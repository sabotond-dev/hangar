import { describe, expect, it } from "vitest";
import {
  ELEMENT_SYSTEM,
  ELEMENT_TOUCH,
  EVENT_SETUP,
  EVENT_TIMER,
  FrameScanner,
  SYSTEM_DEFAULT_SETUP,
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
  rigResponder,
  zonaResponder,
  type ZonaState,
} from "./fixtures/synthetic";
import { NackError, RequestQueue } from "./queue";
import {
  absorbFrame,
  fetchAll,
  fetchBoth,
  fetchModuleKey,
  identify,
  newIdentifyState,
  runBurstProbe,
  runNoOpCycle,
  storeToFlash,
  targetOf,
  writeAll,
  writeBack,
  writeBoth,
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

const zonaState = (over: Partial<ZonaState> = {}): ZonaState => ({
  sx: 0,
  sy: 0,
  activePage: ACTIVE_PAGE,
  configs: { [EVENT_SETUP]: SETUP_CONFIG, [EVENT_TIMER]: TIMER_CONFIG },
  ...over,
});

interface Rig {
  transport: FakeTransport;
  queue: RequestQueue;
  steps: CaptureStep[];
  id: Identity;
}

function rig(
  responder?: (outbound: DecodedClass, requestId: number) => number[][],
  id: Identity = identified(),
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
  return { transport, queue, steps, id };
}

const configWrites = (transport: FakeTransport): DecodedClass[] =>
  flat(transport).filter(
    (c) => c.class_name === "CONFIG" && c.class_instr === "EXECUTE",
  );

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

  it("a second module is named, and the store is a broadcast that stays allowed", async () => {
    const state = newIdentifyState(0);
    absorb(state, zonaHeartbeat());
    // A chained module: type 0, its own SX, and one class in its frame.
    absorb(state, zonaHeartbeat({ sx: 1, type: 0 }));

    const id = identify(state);
    expect(id?.otherModules).toHaveLength(1);
    expect(id?.otherModules[0].sx).toBe(1);
    // Informational since Phase 7 (07-CONTEXT D-18): SAFE-06 supersedes Phase
    // 2's D-12. The field still reports the rig - the identity line and the
    // flash confirmation read it - but nothing refuses on it any more.
    expect(id?.storeAllowed).toBe(false);
    if (!id) throw new Error("the scripted heartbeats did not identify a ZONA");

    // SAFE-06: the store on a rig is ALLOWED. It is a global broadcast, every
    // module on the bus stores its own active page and answers with its own
    // acknowledgement echoing the same LASTHEADER, and the queue settles on
    // the first (07-RESEARCH Pitfall 8). Three modules answer; one request
    // resolves; that is the behaviour the confirmation sentence describes.
    const { transport, queue, steps } = rig(
      rigResponder([zonaState(), zonaState({ sx: 1 }), zonaState({ sx: 2 })]),
      id,
    );
    await expect(storeToFlash(queue, id)).resolves.toBeUndefined();
    expect(
      flat(transport).filter(
        (c) => c.class_name === "PAGESTORE" && c.class_instr === "EXECUTE",
      ),
      "one store on the wire",
    ).toHaveLength(1);
    expect(steps.map((s) => [s.id, s.outcome, s.attempts])).toEqual([
      ["store", "ok", 1],
    ]);
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

  it("writeBoth sends two strings Timer first, verbatim, and writeBack is its adapter", async () => {
    const { transport, queue, id } = rig();
    const strings = { setup: "--[[@cb]]print(9)", timer: "--[[@cb]]print(8)" };

    await writeBoth(queue, targetOf(id), strings);

    const writes = configWrites(transport);
    expect(writes).toHaveLength(2);
    // Timer (6) first, then Setup (0): _pad.ts:3908-3913's reason, and the
    // order Phase 2 proved six times on hardware.
    expect(Number(writes[0].class_parameters.EVENTTYPE)).toBe(EVENT_TIMER);
    expect(Number(writes[1].class_parameters.EVENTTYPE)).toBe(EVENT_SETUP);
    // Verbatim, character for character, with the length firmware checks
    // against the ETX computed from the same string.
    expect(String(writes[0].class_parameters.ACTIONSTRING)).toBe(strings.timer);
    expect(Number(writes[0].class_parameters.ACTIONLENGTH)).toBe(
      strings.timer.length,
    );
    expect(String(writes[1].class_parameters.ACTIONSTRING)).toBe(strings.setup);
    expect(Number(writes[1].class_parameters.ACTIONLENGTH)).toBe(
      strings.setup.length,
    );
    for (const w of writes) {
      expect(Number(w.class_parameters.PAGENUMBER), "the reported page").toBe(
        ACTIVE_PAGE,
      );
    }

    // The adapter changes nothing Phase 2 proved: what was fetched is what
    // goes back, in the same order.
    const back = rig();
    const fetched = await fetchBoth(back.queue, back.id);
    await writeBack(back.queue, back.id, fetched);
    const returned = configWrites(back.transport);
    expect(returned.map((c) => Number(c.class_parameters.EVENTTYPE))).toEqual([
      EVENT_TIMER,
      EVENT_SETUP,
    ]);
    expect(
      returned.map((c) => String(c.class_parameters.ACTIONSTRING)),
    ).toEqual([TIMER_CONFIG, SETUP_CONFIG]);
  });

  it("writeAll sends system, Timer, Setup in that order and no other, and the two-event adapters still send two", async () => {
    // Phase 12, plan 02. THE ORDER IS THE POINT. grid_decode.c:1286-1287
    // registers a written body and runs it IMMEDIATELY, in write order, so at
    // install time the initialisation order is HANGAR's: a touch Setup that
    // calls a library function before the system setup defining it has been
    // written raises `attempt to call a nil value` once, on the desk, and
    // installs no touch_cb at all.
    const state = zonaState();
    const { transport, queue, steps, id } = rig(zonaResponder(state));
    const set = {
      system: "--[[@cb]]function Q()return 1 end",
      timer: "--[[@cb]]print(8)",
      setup: "--[[@cb]]Q()",
    };

    await writeAll(queue, targetOf(id), set);

    const writes = configWrites(transport);
    expect(writes, "three frames, not two and not five").toHaveLength(3);
    expect(
      writes.map((c) => [
        Number(c.class_parameters.ELEMENTNUMBER),
        Number(c.class_parameters.EVENTTYPE),
      ]),
      "255/0, then 0/6, then 0/0",
    ).toEqual([
      [ELEMENT_SYSTEM, EVENT_SETUP],
      [ELEMENT_TOUCH, EVENT_TIMER],
      [ELEMENT_TOUCH, EVENT_SETUP],
    ]);
    expect(writes.map((c) => String(c.class_parameters.ACTIONSTRING))).toEqual([
      set.system,
      set.timer,
      set.setup,
    ]);
    // The pinned ids, in the same order. plan 05's gate and install.spec.ts
    // read these strings.
    expect(steps.map((s) => [s.id, s.outcome])).toEqual([
      ["write-system", "ok"],
      ["write-timer", "ok"],
      ["write-setup", "ok"],
    ]);
    // Two RAMs, apart: the library did not land on the pad.
    expect(state.system?.[EVENT_SETUP]).toBe(set.system);
    expect(state.configs[EVENT_SETUP]).toBe(set.setup);
    // 255/4 and 255/6 are never written. Nothing in HANGAR builds them, and
    // this is where that is asserted rather than assumed.
    for (const c of writes) {
      const element = Number(c.class_parameters.ELEMENTNUMBER);
      const event = Number(c.class_parameters.EVENTTYPE);
      expect(
        element === ELEMENT_SYSTEM && (event === 4 || event === EVENT_TIMER),
        "the utility button and the system timer are never written",
      ).toBe(false);
    }

    // THE FETCHER, three requests, under the three fetch ids, answered from
    // the two RAMs the writes above left.
    const back = rig(zonaResponder(state));
    const all = await fetchAll(back.queue, back.id);
    expect(all.system.actionString).toBe(set.system);
    expect(all.setup.actionString).toBe(set.setup);
    expect(all.timer.actionString).toBe(set.timer);
    expect(all.system.label, "a refusal names the right slot").toBe("System");
    expect(back.steps.map((s) => s.id)).toEqual([
      "fetch-system",
      "fetch-setup",
      "fetch-timer",
    ]);
    const fetches = flat(back.transport).filter(
      (c) => c.class_name === "CONFIG" && c.class_instr === "FETCH",
    );
    expect(
      fetches.map((c) => Number(c.class_parameters.ELEMENTNUMBER)),
    ).toEqual([ELEMENT_SYSTEM, ELEMENT_TOUCH, ELEMENT_TOUCH]);

    // A factory module answers the package's own default for the system slot.
    const factory = rig();
    expect(
      (await fetchAll(factory.queue, factory.id)).system.actionString,
    ).toBe(SYSTEM_DEFAULT_SETUP);

    // THE ADAPTERS' PROMISE, asserted here so it cannot be broken silently:
    // writeBoth still puts exactly TWO frames on the wire and fetchBoth still
    // issues exactly TWO. Every count-pinned spec above this file - the
    // install store's, session.e2e.ts's, install.e2e.ts's - rests on it until
    // 12-03 moves them together.
    const two = rig();
    await writeBoth(two.queue, targetOf(two.id), {
      setup: set.setup,
      timer: set.timer,
    });
    expect(configWrites(two.transport), "two, not three").toHaveLength(2);
    expect(two.steps.map((s) => s.id)).toEqual(["write-timer", "write-setup"]);

    const pair = rig();
    await fetchBoth(pair.queue, pair.id);
    expect(
      flat(pair.transport).filter(
        (c) => c.class_name === "CONFIG" && c.class_instr === "FETCH",
      ),
      "two fetches, not three",
    ).toHaveLength(2);
    expect(pair.steps.map((s) => s.id)).toEqual(["fetch-setup", "fetch-timer"]);
  });

  it("a write to a page the module is not on is refused, and the refusal is not retried", async () => {
    const { transport, queue, steps, id } = rig();
    const strings = { setup: "--[[@cb]]print(9)", timer: "--[[@cb]]print(8)" };

    // grid_decode.c:1272, `currentpage`: a NACK, once, and no second write.
    const elsewhere = { ...targetOf(id), page: ACTIVE_PAGE + 1 };
    await expect(writeBoth(queue, elsewhere, strings)).rejects.toBeInstanceOf(
      NackError,
    );
    expect(steps.map((s) => [s.id, s.outcome, s.attempts])).toEqual([
      ["write-timer", "nack", 1],
    ]);
    expect(
      configWrites(transport),
      "the Setup was never attempted",
    ).toHaveLength(1);

    // The module's key: 32 hex characters when the module has a serial...
    const keyed = rig(
      zonaResponder(zonaState({ serial: [0x12345678, 0x9abcdef0, 0, 0] })),
    );
    await expect(fetchModuleKey(keyed.queue, keyed.id)).resolves.toMatch(
      /^[0-9a-f]{32}$/,
    );
    expect(keyed.steps.map((s) => s.id)).toEqual(["fetch-serial"]);

    // ...and a fetch timeout when it does not answer at all. fetchModuleKey
    // builds its own request, so the deadline is TIMEOUTS.fetchMs of real
    // time; one attempt keeps that to one deadline rather than three with
    // backoff. The caller degrades to a session-only snapshot from this.
    const silent = new FakeTransport({ responder: zonaResponder(zonaState()) });
    const silentSteps: CaptureStep[] = [];
    const silentQueue = new RequestQueue(silent, {
      preSendDelayMs: 0,
      attempts: 1,
      onStep: (s) => silentSteps.push(s),
    });
    pump(silent, silentQueue);
    await expect(fetchModuleKey(silentQueue, id)).rejects.toThrow(/Timed out/);
    expect(silentSteps.map((s) => [s.id, s.outcome, s.attempts])).toEqual([
      ["fetch-serial", "timeout", 1],
    ]);
  });
});
