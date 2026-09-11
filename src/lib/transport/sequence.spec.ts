import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ELEMENT_SYSTEM,
  ELEMENT_TOUCH,
  EVENT_SETUP,
  EVENT_TIMER,
  FrameScanner,
  SYSTEM_DEFAULT_SETUP,
  SYSTEM_DEFAULT_TIMER,
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
  SLOTS,
  absorbFrame,
  fetchAll,
  fetchModuleKey,
  identify,
  newIdentifyState,
  runBurstProbe,
  runNoOpCycle,
  storeToFlash,
  targetOf,
  writeAll,
  writeBack,
  type Identity,
  type IdentifyState,
} from "./sequence";
/** The whole module, for the removal assertion: an export list is read as a record. */
import * as sequence from "./sequence";

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

  it("the fetch returns all four events with their strings and their own latencies", async () => {
    const { queue, steps, id } = rig();

    const fetched = await fetchAll(queue, id);
    // A factory module: the two system slots answer the package's own
    // defaults (12.1-06 added the timer's), the two touch slots the fixture's.
    expect(fetched.systemTimer.actionString).toBe(SYSTEM_DEFAULT_TIMER);
    expect(fetched.system.actionString).toBe(SYSTEM_DEFAULT_SETUP);
    expect(fetched.setup.actionString).toBe(SETUP_CONFIG);
    expect(fetched.timer.actionString).toBe(TIMER_CONFIG);
    expect(fetched.systemTimer.actionLength).toBe(SYSTEM_DEFAULT_TIMER.length);
    expect(fetched.system.actionLength).toBe(SYSTEM_DEFAULT_SETUP.length);
    expect(fetched.setup.actionLength).toBe(SETUP_CONFIG.length);
    expect(fetched.timer.actionLength).toBe(TIMER_CONFIG.length);

    // In SLOTS order - the same order as the write, so a fetch trace and a
    // write trace read alike.
    expect(steps.map((s) => s.id)).toEqual([
      "fetch-system-timer",
      "fetch-system",
      "fetch-timer",
      "fetch-setup",
    ]);
    for (const step of steps) {
      expect(typeof step.latencyMs, `${step.id} timed itself`).toBe("number");
    }
  });

  it("the write-back sends the system timer, then the page init, then Timer, then Setup", async () => {
    const { transport, queue, id } = rig();

    const fetched = await fetchAll(queue, id);
    await writeBack(queue, id, fetched);

    const writes = flat(transport).filter(
      (c) => c.class_name === "CONFIG" && c.class_instr === "EXECUTE",
    );
    expect(writes).toHaveLength(4);
    // D-11 plus Phase 12's reason one plus 12.1's reason three: the element
    // AND the event together, so 255/6 cannot be read as 0/6 and 255/0 as
    // 0/0 by an assertion that only looks at events.
    expect(
      writes.map((c) => [
        Number(c.class_parameters.ELEMENTNUMBER),
        Number(c.class_parameters.EVENTTYPE),
      ]),
    ).toEqual([
      [ELEMENT_SYSTEM, EVENT_TIMER],
      [ELEMENT_SYSTEM, EVENT_SETUP],
      [ELEMENT_TOUCH, EVENT_TIMER],
      [ELEMENT_TOUCH, EVENT_SETUP],
    ]);
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

  it("writeAll sends four strings verbatim, and writeBack is its adapter", async () => {
    const { transport, queue, id } = rig();
    const strings = {
      systemTimer: "--[[@cb]]function G()return 6 end",
      system: "--[[@cb]]function Q()return 7 end",
      setup: "--[[@cb]]print(9)",
      timer: "--[[@cb]]print(8)",
    };

    await writeAll(queue, targetOf(id), strings);

    const writes = configWrites(transport);
    expect(writes).toHaveLength(4);
    // The system timer (255/6) first, then the page init (255/0), then Timer
    // (0/6), then Setup (0/0): SLOTS' three reasons, in that order.
    expect(Number(writes[0].class_parameters.ELEMENTNUMBER)).toBe(
      ELEMENT_SYSTEM,
    );
    expect(Number(writes[0].class_parameters.EVENTTYPE)).toBe(EVENT_TIMER);
    expect(Number(writes[1].class_parameters.ELEMENTNUMBER)).toBe(
      ELEMENT_SYSTEM,
    );
    expect(Number(writes[1].class_parameters.EVENTTYPE)).toBe(EVENT_SETUP);
    expect(Number(writes[2].class_parameters.ELEMENTNUMBER)).toBe(
      ELEMENT_TOUCH,
    );
    expect(Number(writes[2].class_parameters.EVENTTYPE)).toBe(EVENT_TIMER);
    expect(Number(writes[3].class_parameters.ELEMENTNUMBER)).toBe(
      ELEMENT_TOUCH,
    );
    expect(Number(writes[3].class_parameters.EVENTTYPE)).toBe(EVENT_SETUP);
    // Verbatim, character for character, with the length firmware checks
    // against the ETX computed from the same string.
    const sent = [
      strings.systemTimer,
      strings.system,
      strings.timer,
      strings.setup,
    ];
    sent.forEach((s, i) => {
      expect(String(writes[i].class_parameters.ACTIONSTRING)).toBe(s);
      expect(Number(writes[i].class_parameters.ACTIONLENGTH)).toBe(s.length);
    });
    for (const w of writes) {
      expect(Number(w.class_parameters.PAGENUMBER), "the reported page").toBe(
        ACTIVE_PAGE,
      );
    }

    // THE ORDER IS NOT THE CALLER'S TO GET WRONG. The same four strings
    // handed over with the keys in the WRONG order - Setup first, the system
    // timer last - produce the same four frames in the same order, because
    // SLOTS owns it. This is the negative check 12-03 ran, kept as an
    // assertion so nobody has to run it again to find out; re-proved over
    // four by 12.1-06.
    const swapped = rig();
    await writeAll(swapped.queue, targetOf(swapped.id), {
      setup: strings.setup,
      system: strings.system,
      timer: strings.timer,
      systemTimer: strings.systemTimer,
    });
    expect(
      configWrites(swapped.transport).map((c) => [
        Number(c.class_parameters.ELEMENTNUMBER),
        Number(c.class_parameters.EVENTTYPE),
      ]),
    ).toEqual([
      [ELEMENT_SYSTEM, EVENT_TIMER],
      [ELEMENT_SYSTEM, EVENT_SETUP],
      [ELEMENT_TOUCH, EVENT_TIMER],
      [ELEMENT_TOUCH, EVENT_SETUP],
    ]);

    // The adapter changes nothing Phase 2 proved: what was fetched is what
    // goes back, in the same order.
    const back = rig();
    const fetched = await fetchAll(back.queue, back.id);
    await writeBack(back.queue, back.id, fetched);
    const returned = configWrites(back.transport);
    expect(returned.map((c) => Number(c.class_parameters.EVENTTYPE))).toEqual([
      EVENT_TIMER,
      EVENT_SETUP,
      EVENT_TIMER,
      EVENT_SETUP,
    ]);
    expect(
      returned.map((c) => String(c.class_parameters.ACTIONSTRING)),
    ).toEqual([
      SYSTEM_DEFAULT_TIMER,
      SYSTEM_DEFAULT_SETUP,
      TIMER_CONFIG,
      SETUP_CONFIG,
    ]);
  });

  it("writeAll sends system timer, system, Timer, Setup in that order and no other, and the two-event adapters are gone", async () => {
    // Phase 12, plan 02, widened by 12.1-06. THE ORDER IS THE POINT.
    // grid_decode.c:1283-1288 registers a written body and runs it
    // IMMEDIATELY, in write order, so at install time the initialisation
    // order is HANGAR's: a touch Setup that calls a library function before
    // the system setup defining it has been written raises `attempt to call
    // a nil value` once, on the desk, and installs no touch_cb at all - and
    // a system setup that arms `self:tim()` before the system timer holding
    // the library's second half has been written arms the firmware's debug
    // print, once, for the same reason.
    const state = zonaState();
    const { transport, queue, steps, id } = rig(zonaResponder(state));
    const set = {
      systemTimer: "--[[@cb]]function G()return 6 end",
      system: "--[[@cb]]function Q()return 1 end self:tim()",
      timer: "--[[@cb]]print(8)",
      setup: "--[[@cb]]Q()",
    };

    await writeAll(queue, targetOf(id), set);

    const writes = configWrites(transport);
    expect(writes, "four frames, not three and not five").toHaveLength(4);
    expect(
      writes.map((c) => [
        Number(c.class_parameters.ELEMENTNUMBER),
        Number(c.class_parameters.EVENTTYPE),
      ]),
      "255/6, then 255/0, then 0/6, then 0/0",
    ).toEqual([
      [ELEMENT_SYSTEM, EVENT_TIMER],
      [ELEMENT_SYSTEM, EVENT_SETUP],
      [ELEMENT_TOUCH, EVENT_TIMER],
      [ELEMENT_TOUCH, EVENT_SETUP],
    ]);
    expect(writes.map((c) => String(c.class_parameters.ACTIONSTRING))).toEqual([
      set.systemTimer,
      set.system,
      set.timer,
      set.setup,
    ]);
    // The pinned ids, in the same order. plan 05's gate and install.spec.ts
    // read these strings; the three old ids are byte-unchanged and the new
    // one is first.
    expect(steps.map((s) => [s.id, s.outcome])).toEqual([
      ["write-system-timer", "ok"],
      ["write-system", "ok"],
      ["write-timer", "ok"],
      ["write-setup", "ok"],
    ]);
    // Two RAMs, apart, two events each: neither half of the library landed
    // on the pad, and neither touch event landed on the system element
    // (12-RESEARCH Pitfall 1's conflation stays impossible with four).
    expect(state.system?.[EVENT_TIMER]).toBe(set.systemTimer);
    expect(state.system?.[EVENT_SETUP]).toBe(set.system);
    expect(state.configs[EVENT_TIMER]).toBe(set.timer);
    expect(state.configs[EVENT_SETUP]).toBe(set.setup);
    expect(state.system?.[EVENT_TIMER]).not.toBe(state.configs[EVENT_TIMER]);
    expect(state.system?.[EVENT_SETUP]).not.toBe(state.configs[EVENT_SETUP]);
    // 12-02's one loop, halved by 12.1-06 (12.1-VALIDATION R-10). HALF ONE:
    // 255/4 is still never written - it is 13-17's row, and until that row
    // exists nothing in HANGAR builds it. Asserted here rather than assumed.
    const addressed = writes.map((c) => [
      Number(c.class_parameters.ELEMENTNUMBER),
      Number(c.class_parameters.EVENTTYPE),
    ]);
    for (const [element, event] of addressed) {
      expect(
        element === ELEMENT_SYSTEM && event === 4,
        "the utility button is never written",
      ).toBe(false);
    }
    // HALF TWO: 255/6 is written EXACTLY ONCE per install, and it is the
    // FIRST frame - the library's second half is registered before the
    // setup that arms it runs (SLOTS' reason three).
    const systemTimerWrites = addressed.filter(
      ([element, event]) => element === ELEMENT_SYSTEM && event === EVENT_TIMER,
    );
    expect(systemTimerWrites, "once per install").toHaveLength(1);
    expect(addressed[0], "and first").toEqual([ELEMENT_SYSTEM, EVENT_TIMER]);

    // THE FETCHER, four requests, under the four fetch ids in SLOTS order,
    // answered from the two RAMs the writes above left - the round trip
    // through the fixture for all four.
    const back = rig(zonaResponder(state));
    const all = await fetchAll(back.queue, back.id);
    expect(all.systemTimer.actionString).toBe(set.systemTimer);
    expect(all.system.actionString).toBe(set.system);
    expect(all.setup.actionString).toBe(set.setup);
    expect(all.timer.actionString).toBe(set.timer);
    expect(all.system.label, "a refusal names the right slot").toBe("System");
    expect(all.systemTimer.label, "and the fourth slot by its own name").toBe(
      "System timer",
    );
    expect(back.steps.map((s) => s.id)).toEqual([
      "fetch-system-timer",
      "fetch-system",
      "fetch-timer",
      "fetch-setup",
    ]);
    const fetches = flat(back.transport).filter(
      (c) => c.class_name === "CONFIG" && c.class_instr === "FETCH",
    );
    expect(
      fetches.map((c) => [
        Number(c.class_parameters.ELEMENTNUMBER),
        Number(c.class_parameters.EVENTTYPE),
      ]),
    ).toEqual([
      [ELEMENT_SYSTEM, EVENT_TIMER],
      [ELEMENT_SYSTEM, EVENT_SETUP],
      [ELEMENT_TOUCH, EVENT_TIMER],
      [ELEMENT_TOUCH, EVENT_SETUP],
    ]);

    // A factory module answers the package's own defaults for both system
    // slots - the fixture materialises 255/0 and falls through to the
    // package for 255/6, never a literal (D-20).
    const factory = rig();
    const fresh = await fetchAll(factory.queue, factory.id);
    expect(fresh.system.actionString).toBe(SYSTEM_DEFAULT_SETUP);
    expect(fresh.systemTimer.actionString).toBe(SYSTEM_DEFAULT_TIMER);

    // THE ADAPTERS ARE GONE, asserted rather than remembered. 12-02 kept
    // `fetchBoth` and `writeBoth` as two-event adapters for one plan's length,
    // with the promise that 12-03 would move the store and retire them; this
    // assertion is that promise kept, and it is where a reader of the two
    // SUMMARYs finds out. A module's exports are read as a record, so a
    // re-introduction under either name fails here rather than in whatever
    // count it would silently halve.
    const exported = Object.keys(sequence);
    expect(exported, "the module was actually read").toContain("writeAll");
    expect(exported, "the module was actually read").toContain("fetchAll");
    for (const gone of ["fetchBoth", "writeBoth"]) {
      expect(exported, `${gone} is back`).not.toContain(gone);
    }
    // `EventStrings` was a TYPE, so it never appears in the exports record and
    // the check above cannot see it. The comment-stripped source can - and the
    // strip is what keeps this file's own prose about the removal legal.
    const source = readFileSync(
      new URL("./sequence.ts", import.meta.url),
      "utf8",
    )
      .replace(/^[ ]*[/][/].*$/gm, "")
      .replace(/[/][*][^]*?[*][/]/g, "");
    expect(source.length, "the source was actually read").toBeGreaterThan(4000);
    expect(source, "non-vacuity: the writer is there").toContain(
      "export async function writeAll",
    );
    for (const gone of ["fetchBoth", "writeBoth", "EventStrings"]) {
      expect(source.includes(gone), `sequence.ts still names ${gone}`).toBe(
        false,
      );
    }
  });

  it("SLOTS is the single source of the order: the frames equal the list row for row, and the caller's key order changes nothing", async () => {
    // Phase 12.1, plan 06. The order used to live in writeAll's body as
    // three lines; it is now data, and this is the test that says the data
    // is what goes on the wire - so 13-17 adds 255/4 as a row and this test
    // grows with it without being edited.
    //
    // FIRST, before any count: no row addresses 255/4. This is the list-level
    // half of 12-02's assertion (the frame-level half is in the order test
    // above, where the exact-order assertion shadows it), and it sits ahead
    // of the length check so that a planted 255/4 row is red HERE, by name,
    // and not only as "five rows". 13-17 edits this line when it adds the
    // row, and nothing else in this test.
    expect(
      SLOTS.some((s) => s.element === ELEMENT_SYSTEM && s.event === 4),
      "the utility button (255/4) is not a slot until 13-17 says so",
    ).toBe(false);
    expect(SLOTS, "four rows today; 13-17 makes it five").toHaveLength(4);
    expect(
      SLOTS.map((s) => [s.element, s.event]),
      "255/6, 255/0, 0/6, 0/0",
    ).toEqual([
      [ELEMENT_SYSTEM, EVENT_TIMER],
      [ELEMENT_SYSTEM, EVENT_SETUP],
      [ELEMENT_TOUCH, EVENT_TIMER],
      [ELEMENT_TOUCH, EVENT_SETUP],
    ]);
    // Within each element the Timer precedes the Setup that arms it, and the
    // system element precedes the touch element that calls it: the rule the
    // three reasons in SLOTS' comment reduce to, stated as a property so a
    // row inserted in the wrong place fails here by name.
    for (const element of [ELEMENT_SYSTEM, ELEMENT_TOUCH]) {
      const events = SLOTS.filter((s) => s.element === element).map(
        (s) => s.event,
      );
      expect(events.indexOf(EVENT_TIMER), `element ${element}`).toBeLessThan(
        events.indexOf(EVENT_SETUP),
      );
    }
    expect(
      SLOTS.findLastIndex((s) => s.element === ELEMENT_SYSTEM),
    ).toBeLessThan(SLOTS.findIndex((s) => s.element === ELEMENT_TOUCH));
    // Every key, label and step id is distinct, and the step ids are the
    // pinned ones in the pinned shape.
    const distinct = (xs: readonly string[]) => new Set(xs).size === xs.length;
    expect(distinct(SLOTS.map((s) => s.key))).toBe(true);
    expect(distinct(SLOTS.map((s) => s.label))).toBe(true);
    expect(distinct(SLOTS.flatMap((s) => [s.write, s.fetch, s.refetch]))).toBe(
      true,
    );
    for (const s of SLOTS) {
      expect(s.write).toMatch(/^write-/);
      expect(s.fetch).toMatch(/^fetch-/);
      expect(s.refetch).toMatch(/^refetch-/);
      expect(s.fetch.slice("fetch-".length)).toBe(
        s.write.slice("write-".length),
      );
      expect(s.refetch).toBe(`re${s.fetch}`);
    }

    // THE FRAMES EQUAL THE LIST, element for element, string for string,
    // step id for step id - derived from SLOTS, not typed beside it.
    const strings = {
      systemTimer: "--[[@cb]]function G()return 6 end",
      system: "--[[@cb]]function Q()return 7 end",
      setup: "--[[@cb]]print(9)",
      timer: "--[[@cb]]print(8)",
    };
    const { transport, queue, steps, id } = rig();
    await writeAll(queue, targetOf(id), strings);
    const frames = configWrites(transport).map((c) => ({
      element: Number(c.class_parameters.ELEMENTNUMBER),
      event: Number(c.class_parameters.EVENTTYPE),
      config: String(c.class_parameters.ACTIONSTRING),
    }));
    expect(frames).toEqual(
      SLOTS.map((s) => ({
        element: s.element,
        event: s.event,
        config: strings[s.key],
      })),
    );
    expect(steps.map((s) => s.id)).toEqual(SLOTS.map((s) => s.write));

    // The caller's key order changes nothing: every permutation of the four
    // keys produces the same four frames. Twenty-four rigs, one assertion.
    const keys = Object.keys(strings) as (keyof typeof strings)[];
    const permutations = (xs: typeof keys): (typeof keys)[] =>
      xs.length <= 1
        ? [xs]
        : xs.flatMap((x, i) =>
            permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [
              x,
              ...p,
            ]),
          );
    const orders = permutations(keys);
    expect(orders).toHaveLength(24);
    for (const order of orders) {
      const shuffled = Object.fromEntries(
        order.map((k) => [k, strings[k]]),
      ) as typeof strings;
      expect(Object.keys(shuffled)).toEqual(order);
      const r = rig();
      await writeAll(r.queue, targetOf(r.id), shuffled);
      expect(
        configWrites(r.transport).map((c) => [
          Number(c.class_parameters.ELEMENTNUMBER),
          Number(c.class_parameters.EVENTTYPE),
          String(c.class_parameters.ACTIONSTRING),
        ]),
        `keys handed over as ${order.join(", ")}`,
      ).toEqual(SLOTS.map((s) => [s.element, s.event, strings[s.key]]));
    }

    // The fetcher reads the same list: four fetches, SLOTS order, SLOTS ids,
    // each landing under its own key.
    const back = rig();
    const fetched = await fetchAll(back.queue, back.id);
    expect(Object.keys(fetched).sort()).toEqual(SLOTS.map((s) => s.key).sort());
    expect(back.steps.map((s) => s.id)).toEqual(SLOTS.map((s) => s.fetch));
    for (const s of SLOTS) {
      expect(fetched[s.key].event, s.key).toBe(s.event);
      expect(fetched[s.key].label, s.key).toBe(s.label);
    }
    const refetched = await fetchAll(back.queue, back.id, "refetch");
    expect(back.steps.slice(SLOTS.length).map((s) => s.id)).toEqual(
      SLOTS.map((s) => s.refetch),
    );
    expect(refetched.systemTimer.actionString).toBe(SYSTEM_DEFAULT_TIMER);
  });

  it("a write to a page the module is not on is refused, and the refusal is not retried", async () => {
    const { transport, queue, steps, id } = rig();
    const strings = {
      systemTimer: "--[[@cb]]function G()return 6 end",
      system: "--[[@cb]]function Q()return 7 end",
      setup: "--[[@cb]]print(9)",
      timer: "--[[@cb]]print(8)",
    };

    // grid_decode.c:1272, `currentpage`: a NACK, once, and no second write.
    // The refused write is the FIRST one - the system timer since 12.1-06 -
    // and the abort is proved over all THREE unreached legs rather than only
    // the last.
    const elsewhere = { ...targetOf(id), page: ACTIVE_PAGE + 1 };
    await expect(writeAll(queue, elsewhere, strings)).rejects.toBeInstanceOf(
      NackError,
    );
    expect(steps.map((s) => [s.id, s.outcome, s.attempts])).toEqual([
      ["write-system-timer", "nack", 1],
    ]);
    expect(
      configWrites(transport),
      "the page init, the Timer and the Setup were never attempted",
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
