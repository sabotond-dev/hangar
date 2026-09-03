import { describe, expect, it } from "vitest";
import {
  EVENT_SETUP,
  EVENT_TIMER,
  FrameScanner,
  TERMINATOR,
  ZONA_HWCFG,
  type DecodedClass,
  decodeFrame,
} from "$lib/protocol";
import type { CaptureStep } from "./capture";
import { FakeTransport } from "./fake";
import {
  configNackFrame,
  configReportFrame,
  heartbeatFrame,
  zonaResponder,
} from "./fixtures/synthetic";
import { RequestQueue } from "./queue";
import {
  absorbFrame,
  fetchBoth,
  identify,
  newIdentifyState,
  runBurstProbe,
  runNoOpCycle,
  writeBack,
  type Identity,
  type IdentifyState,
} from "./sequence";

const SETUP_CONFIG = "--[[@cb]]print(1)";
const TIMER_CONFIG = "--[[@cb]]print(2)";
const FIRMWARE = { major: 1, minor: 5, patch: 5 };
/**
 * Deliberately not the first page. Every request below is addressed with the
 * page the scripted heartbeat reported, so a regression that reached for a
 * constant would be answered with an empty string by the responder (firmware's
 * own behaviour for a fetch of a non-active page) and fail D-09's guard.
 */
const ACTIVE_PAGE = 2;

function classesOf(frame: number[]): DecodedClass[] {
  const decoded = decodeFrame(frame);
  if (!decoded.ok) {
    throw new Error(`fixture frame did not decode: ${decoded.reason}`);
  }
  return decoded.classes;
}

/** The frame pump the page owns: chunks in, classes into the queue. */
function pump(transport: FakeTransport, queue: RequestQueue): void {
  const scanner = new FrameScanner();
  transport.onData((chunk) => {
    for (const frame of scanner.push(chunk)) {
      const decoded = decodeFrame(frame);
      if (decoded.ok) for (const cls of decoded.classes) queue.deliver(cls);
    }
  });
  transport.onClose((reason) => queue.abort(reason));
}

const zonaHeartbeat = (
  over: Partial<Parameters<typeof heartbeatFrame>[0]> = {},
) =>
  heartbeatFrame({
    sx: 0,
    sy: 0,
    type: 1,
    hwcfg: ZONA_HWCFG,
    activePage: ACTIVE_PAGE,
    firmware: FIRMWARE,
    ...over,
  });

const absorb = (state: IdentifyState, frame: number[]) =>
  absorbFrame(classesOf(frame), state);

function identified(): Identity {
  const state = newIdentifyState(0);
  absorb(state, zonaHeartbeat());
  const id = identify(state);
  if (!id) throw new Error("the scripted heartbeat did not identify a ZONA");
  return id;
}

const zonaState = () => ({
  sx: 0,
  sy: 0,
  activePage: ACTIVE_PAGE,
  configs: { [EVENT_SETUP]: SETUP_CONFIG, [EVENT_TIMER]: TIMER_CONFIG },
});

interface Rig {
  transport: FakeTransport;
  queue: RequestQueue;
  steps: CaptureStep[];
  id: Identity;
}

function rig(
  responder?: (outbound: DecodedClass, requestId: number) => number[][],
): Rig {
  const transport = new FakeTransport({
    responder: responder ?? zonaResponder(zonaState()),
  });
  const steps: CaptureStep[] = [];
  const queue = new RequestQueue(transport, {
    preSendDelayMs: 0,
    onStep: (s) => steps.push(s),
  });
  pump(transport, queue);
  return { transport, queue, steps, id: identified() };
}

/** Every outbound frame, decoded back into the classes it carried. */
function written(transport: FakeTransport): DecodedClass[][] {
  return transport.writes.map((bytes) => {
    const frame = [...bytes];
    if (frame[frame.length - 1] === TERMINATOR) frame.pop();
    return classesOf(frame);
  });
}

const flat = (transport: FakeTransport): DecodedClass[] =>
  written(transport).flat();

describe("the no-op cycle", () => {
  it("identify reads the module type, revision, firmware and heartbeat type from one frame", () => {
    const state = newIdentifyState(0);
    absorb(state, zonaHeartbeat());

    const id = identify(state);
    expect(id, "one heartbeat is enough to identify the module").toBeDefined();
    expect(id?.zona.moduleType).toBe("ZONA");
    expect(id?.zona.revision).toBe("RevH");
    expect(id?.zona.heartbeatType).toBe(1);
    expect(id?.zona.hwcfg).toBe(ZONA_HWCFG);
    expect(id?.zona.firmware).toEqual(FIRMWARE);
  });

  it("identify reads the active page from the class riding in the same frame", () => {
    // There is no fetch for the active page and none is needed: firmware
    // appends it to every heartbeat once USB is connected
    // (grid_transport.c:199-203), four times a second.
    const transport = new FakeTransport({});
    const state = newIdentifyState(0);
    absorb(state, zonaHeartbeat());

    expect(identify(state)?.activePage).toBe(ACTIVE_PAGE);
    expect(transport.writes, "nothing was asked for it").toHaveLength(0);
  });

  it("a second module is named and the store is disabled", () => {
    const state = newIdentifyState(0);
    absorb(state, zonaHeartbeat());
    // A chained module: type 0, its own SX, and one class in its frame.
    absorb(state, zonaHeartbeat({ sx: 1, type: 0 }));

    const id = identify(state);
    expect(id?.otherModules).toHaveLength(1);
    expect(id?.otherModules[0].sx).toBe(1);
    // D-12: a page store is a global broadcast, so a second module makes it
    // unsafe - and the page names the module rather than only greying a button.
    expect(id?.storeAllowed).toBe(false);
  });

  it("the fetch returns both events with their strings and their own latencies", async () => {
    const { queue, steps, id } = rig();

    const fetched = await fetchBoth(queue, id);
    expect(fetched.setup.actionString).toBe(SETUP_CONFIG);
    expect(fetched.timer.actionString).toBe(TIMER_CONFIG);
    expect(fetched.setup.actionLength).toBe(SETUP_CONFIG.length);
    expect(fetched.timer.actionLength).toBe(TIMER_CONFIG.length);

    expect(steps.map((s) => s.id)).toEqual(["fetch-setup", "fetch-timer"]);
    for (const step of steps) {
      expect(typeof step.latencyMs, `${step.id} timed itself`).toBe("number");
    }
  });

  it("the write-back sends Timer before Setup", async () => {
    const { transport, queue, id } = rig();

    const fetched = await fetchBoth(queue, id);
    await writeBack(queue, id, fetched);

    const writes = flat(transport).filter(
      (c) => c.class_name === "CONFIG" && c.class_instr === "EXECUTE",
    );
    expect(writes).toHaveLength(2);
    // D-11, and the reason the BOTOR mixed-state incident left the Timer
    // landed and the Setup missing rather than the reverse.
    expect(Number(writes[0].class_parameters.EVENTTYPE)).toBe(EVENT_TIMER);
    expect(Number(writes[1].class_parameters.EVENTTYPE)).toBe(EVENT_SETUP);
  });

  it("the cycle's final outbound frame is a heartbeat carrying type 255", async () => {
    const { transport, queue, id } = rig();

    const result = await runNoOpCycle(queue, id);
    expect(result.byteIdentical).toBe(true);
    expect(result.pageChangeRestored).toBe(true);

    const last = written(transport).at(-1) ?? [];
    expect(last[0].class_name).toBe("HEARTBEAT");
    expect(Number(last[0].class_parameters.TYPE)).toBe(255);
    // The value that DISABLES page changes forever. Nothing in HANGAR would
    // ever re-enable it, so no path may put it on the wire.
    for (const cls of flat(transport)) {
      expect(Number(cls.class_parameters.TYPE ?? 0)).not.toBe(254);
    }
  });

  it("the restore heartbeat is still sent when a write is refused", async () => {
    const answer = zonaResponder(zonaState());
    const { transport, queue, id } = rig((outbound, requestId) => {
      const refused =
        outbound.class_name === "CONFIG" &&
        outbound.class_instr === "EXECUTE" &&
        Number(outbound.class_parameters.EVENTTYPE) === EVENT_TIMER;
      return refused
        ? [configNackFrame({ sx: 0, sy: 0, lastheader: requestId })]
        : answer(outbound, requestId);
    });

    await expect(runNoOpCycle(queue, id)).rejects.toThrow(
      /negative acknowledgement/,
    );

    // The whole point of the finally: this is the path that would otherwise
    // leave the user's module unable to change page until it is power-cycled.
    const last = written(transport).at(-1) ?? [];
    expect(last[0].class_name).toBe("HEARTBEAT");
    expect(Number(last[0].class_parameters.TYPE)).toBe(255);
  });

  it("the burst probe issues exactly twenty read-only fetches and reports its spread", async () => {
    const { transport, queue, id } = rig();

    const burst = await runBurstProbe(queue, id, { preSendDelayMs: 0 });
    expect(burst.n).toBe(20);
    expect(burst.timeouts).toBe(0);
    expect(burst.nacks).toBe(0);
    for (const key of ["min", "p50", "max"] as const) {
      expect(typeof burst.latencyMs[key], key).toBe("number");
    }

    const classes = flat(transport);
    expect(
      classes.filter(
        (c) => c.class_name === "CONFIG" && c.class_instr === "FETCH",
      ),
      "exactly twenty",
    ).toHaveLength(20);
    expect(
      classes.filter(
        (c) => c.class_name === "CONFIG" && c.class_instr === "EXECUTE",
      ),
      "and read-only: the probe writes nothing to the module",
    ).toHaveLength(0);
  });

  it("a config report never moves the active page", () => {
    const state = newIdentifyState(0);
    absorb(state, zonaHeartbeat());
    expect(identify(state)?.activePage).toBe(ACTIVE_PAGE);

    // A CONFIG/REPORT carries a PAGENUMBER too, and one arrives on every
    // fetch. Without the heartbeat-in-the-same-frame rule, every fetch would
    // silently retarget the run at whatever page the report named.
    absorb(
      state,
      configReportFrame({
        sx: 0,
        sy: 0,
        page: 5,
        event: EVENT_SETUP,
        config: SETUP_CONFIG,
      }),
    );
    expect(identify(state)?.activePage).toBe(ACTIVE_PAGE);
  });
});
