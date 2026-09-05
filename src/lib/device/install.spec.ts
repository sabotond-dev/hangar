// The install store, driven from node against a ZONA that is not there (D-13).
//
// WHY THIS FILE IS install.spec.ts AND NOT install.svelte.spec.ts. The module
// under test is install.svelte.ts, and the obvious name for its spec matches
// vite.config.ts's `server` project exclude, `src/**/*.svelte.{test,spec}.{js,ts}`,
// exactly. A spec by that name would be collected by NOTHING in
// `npm run test:quick`, and the suite would be green and vacuous. This name
// matches the include and misses the exclude; the file count moving by one in
// the count gate is what proves it was collected.
//
// EVERY TEST CONSTRUCTS ITS OWN `new DeviceSession()` AND `new InstallStore(session)`
// and never imports either singleton: a suite that shared them would carry one
// test's queue, snapshot and phase into the next, and would need a reset hook
// neither production class has a reason to have.
//
// NO AGENT WRITES TO A DEVICE. Every byte this file sends lands in
// FakeTransport.writes, through the store's one RequestQueue, and every one of
// them is attributable to a named click below (D-11): connect and the snapshot
// write zero CONFIG/EXECUTE, TRY ON DEVICE writes two, PUT BACK writes two.
// Nothing here opens a port.
//
// THE TEE. FakeTransport has no public rx injection - only fromCapture and the
// responder - so the session is handed a tee: an object implementing
// GridTransport that delegates isOpen, write, onClose and close to the fake,
// whose onData(cb) keeps cb and registers on the fake a forwarder into it, and
// which exposes push(frame) calling that same cb. So a pushed heartbeat and the
// responder's replies both reach the ONE callback the session registers, and
// the fake keeps its faults, which 07-07 needs. (session.spec.ts's pushable()
// bus beside a responder would lose the faults.)
//
// EVERY FAKE PORT IS `connected: true`. The session's missed-disconnect
// watchdog (MODULE_GONE_MS 750, session.svelte.ts #armWatchdog) tears the
// session down only when the module has been silent AND portIsAttached(port)
// is false. A port that reports attached keeps the watchdog quiet through test
// 2's ~1.3 s of fake-timer advance and 07-07's ~9 s, so no test here lands in
// `unplugged-while-connected` by accident.
//
// THE CLOCK. setTimeout and clearTimeout are faked in every test - the queue's
// pre-send sleep, its deadlines, its retry backoff and the live region's 500 ms
// window are all setTimeout chains - and the queue's deadline clock is the
// store's injected `now`, a movable value this file advances IN STEP with the
// fake timers (until() below). The session's own clock is frozen at zero: with
// every port attached, the watchdog never has a reason to fire.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EVENT_SETUP,
  EVENT_TIMER,
  RETRY_ATTEMPTS,
  TERMINATOR,
  TIMEOUTS,
  ZONA_HWCFG,
  type DecodedClass,
  decodeFrame,
  moduleKeyOf,
  retryBackoffMs,
} from "$lib/protocol";
import { ZONA_USB } from "$lib/protocol/usb";
import { FakeTransport, type Fault, type GridTransport } from "$lib/transport";
import {
  heartbeatFrame,
  serialNumberReportFrame,
  zonaResponder,
  type ZonaState,
} from "../transport/fixtures/synthetic";
import {
  LIVE_RESTORED,
  LIVE_SNAPSHOT_SAVED,
  announceTitle,
  liveSettled,
  snapshotFailedBlock,
} from "./install-copy";
import {
  type ConfigStrings,
  type InstallPhase,
  InstallStore,
} from "./install.svelte";
import { DeviceSession, type SerialLike } from "./session.svelte";
import { SNAPSHOT_KEY, type SnapshotStore, persistIfAbsent } from "./snapshot";

// ---------------------------------------------------------------------------
// The module, and what it holds.

const FIRMWARE = { major: 1, minor: 5, patch: 5 };
/** Deliberately not the first page, for sequence.spec.ts's reason: a constant would be caught. */
const ACTIVE_PAGE = 2;
/** What the module holds when the visitor connects: the strings the snapshot must copy. */
const MODULE_SETUP = "--[[@cb]]print(1)";
const MODULE_TIMER = "--[[@cb]]print(2)";
/** The tuner's pair, different from the module's in both events. */
const PAIR: ConfigStrings = {
  setup: "--[[@cb]]print(3)",
  timer: "--[[@cb]]print(4)",
};
/** WORD0..WORD3, with a word above 2^31 so moduleKeyOf's unsigned rule is exercised. */
const SERIAL = [0x9abcdef0, 0x12345678, 0, 0] as const;

/** The key 07-01's moduleKeyOf derives from that serial, through the same decoder the store uses. */
function expectedKey(): string {
  const decoded = decodeFrame(serialNumberReportFrame(SERIAL));
  if (!decoded.ok) throw new Error("the serial report did not decode");
  return moduleKeyOf(decoded.classes[0]);
}

const zonaHeartbeat = (activePage = ACTIVE_PAGE) =>
  heartbeatFrame({
    sx: 0,
    sy: 0,
    type: 1,
    hwcfg: ZONA_HWCFG,
    activePage,
    firmware: FIRMWARE,
  });

// ---------------------------------------------------------------------------
// The clock, and how the tests wait.

/** The queue's deadline clock. Moved by until() in step with the fake timers. */
const clock = { t: 0 };
const STEP_MS = 5;

/**
 * Advance the clock and the fake timers together by `ms`, in small steps, and
 * yield to the macrotask queue between them so real promise chains (the
 * store's dynamic imports) can make progress too.
 */
async function after(ms: number): Promise<void> {
  for (let done = 0; done < ms; done += STEP_MS) {
    clock.t += STEP_MS;
    await vi.advanceTimersByTimeAsync(STEP_MS);
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

/** Advance until the predicate holds, or fail after 20 virtual seconds. */
async function until(predicate: () => boolean, what: string): Promise<void> {
  for (let i = 0; i < 4000; i++) {
    if (predicate()) return;
    await after(STEP_MS);
  }
  throw new Error(`timed out waiting for ${what}`);
}

/** Drive a store action to completion under the fake timers, and rethrow what it threw. */
async function drive(action: Promise<void>): Promise<void> {
  let done = false;
  let failure: unknown;
  action.then(
    () => {
      done = true;
    },
    (err: unknown) => {
      failure = err;
      done = true;
    },
  );
  await until(() => done, "the action to settle");
  if (failure !== undefined) throw failure;
}

/**
 * Log every write to a runes field. `$state` compiles to a PLAIN own property
 * under the server transform (06-01's spike), so the field can be replaced on
 * one instance with an accessor that records each assignment.
 */
function record<T extends object, K extends keyof T & string>(
  target: T,
  key: K,
): T[K][] {
  const log: T[K][] = [];
  let value = target[key];
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    get: () => value,
    set: (next: T[K]) => {
      value = next;
      log.push(next);
    },
  });
  return log;
}

// ---------------------------------------------------------------------------
// The fakes.

/** A granted, attached ZONA port. Every port in this file reports attached (see the header). */
function fakePort(): SerialPort {
  let readable: object | null = null;
  const port: Record<string, unknown> = {
    getInfo: () => ({ ...ZONA_USB }),
    open: async () => {
      readable = {};
    },
    close: async () => {
      readable = null;
    },
    get readable() {
      return readable;
    },
    forget: async () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    connected: true,
  };
  return port as unknown as SerialPort;
}

/** A navigator.serial with one granted port and no chooser: requestPort() would throw. */
function fakeSerial(granted: SerialPort[]): SerialLike {
  return {
    requestPort: () => {
      throw new Error("the test gave requestPort no cue");
    },
    getPorts: async () => granted,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

/** A Map-backed store in the shape the snapshot module takes. */
function mapStorage() {
  const map = new Map<string, string>();
  const store: SnapshotStore = {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
  return { store, map };
}

/** The tee over a FakeTransport; see the header. `initial` is delivered on the first onData, as pushable() does. */
function tee(fake: FakeTransport, initial: number[][]) {
  let callback: ((chunk: Uint8Array) => void) | undefined;
  let forwarding = false;
  let delivered = false;
  const push = (frame: number[]) =>
    callback?.(Uint8Array.from([...frame, TERMINATOR]));
  const transport: GridTransport = {
    get isOpen() {
      return fake.isOpen;
    },
    write: (data) => fake.write(data),
    onData: (next) => {
      callback = next;
      if (!forwarding) {
        forwarding = true;
        fake.onData((chunk) => callback?.(chunk));
      }
      if (delivered) return;
      delivered = true;
      for (const frame of initial) push(frame);
    },
    onClose: (handler) => fake.onClose(handler),
    close: () => fake.close(),
  };
  return { transport, push };
}

/** Every outbound frame, decoded back into the classes it carried. */
function written(fake: FakeTransport): DecodedClass[][] {
  return fake.writes.map((bytes) => {
    const frame = [...bytes];
    if (frame[frame.length - 1] === TERMINATOR) frame.pop();
    const decoded = decodeFrame(frame);
    if (!decoded.ok) throw new Error(`an outbound frame did not decode`);
    return decoded.classes;
  });
}

const settledPhase = (phase: InstallPhase) =>
  phase !== "idle" && phase !== "snapshotting";

interface ConnectOptions {
  state?: Partial<ZonaState>;
  storage?: ReturnType<typeof mapStorage>;
  faults?: Fault[];
}

/**
 * The road every gate starts on: a scripted ZONA behind a FakeTransport, a
 * tee over it, a session started with a granted attached port, an install
 * store started with a Map-backed storage, one click, and the snapshot left
 * to land - in whichever phase it lands.
 */
async function connected(opts: ConnectOptions = {}) {
  const state: ZonaState = {
    sx: 0,
    sy: 0,
    activePage: ACTIVE_PAGE,
    configs: { [EVENT_SETUP]: MODULE_SETUP, [EVENT_TIMER]: MODULE_TIMER },
    serial: SERIAL,
    ...opts.state,
  };
  const fake = new FakeTransport({
    responder: zonaResponder(state),
    faults: opts.faults,
  });
  const bus = tee(fake, [zonaHeartbeat()]);
  const port = fakePort();
  const storage = opts.storage ?? mapStorage();

  const session = new DeviceSession();
  const store = new InstallStore(session);
  const phases = record(store, "phase");
  store.start({ storage: storage.store, now: () => clock.t });
  session.start({
    hasSerial: true,
    secure: true,
    serial: fakeSerial([port]),
    openTransport: async (p) => {
      await p.open({ baudRate: 2_000_000 });
      return bus.transport;
    },
    now: () => 0,
    sleep: async () => {},
  });
  await until(() => session.phase === "detected", "the offer");
  session.connect();
  await until(() => session.phase === "connected", "identification");
  await until(() => settledPhase(store.phase), "the snapshot to land");

  const writesOf = (className: string, instr: string): number =>
    written(fake)
      .flat()
      .filter((c) => c.class_name === className && c.class_instr === instr)
      .length;

  return {
    fake,
    push: bus.push,
    state,
    storage,
    session,
    store,
    phases,
    writesOf,
  };
}

/** The class name, instruction and the parameters an assertion reads, for one outbound frame. */
const shape = (classes: DecodedClass[]) =>
  classes.map((c) => ({
    cls: `${c.class_name}/${c.class_instr}`,
    event: c.class_parameters.EVENTTYPE,
    action: c.class_parameters.ACTIONSTRING,
    type: c.class_parameters.TYPE,
  }));

/** The RAM leg's wire shape: Timer, then Setup, then the restore heartbeat. */
const ramLegFrames = (strings: ConfigStrings) => [
  [
    {
      cls: "CONFIG/EXECUTE",
      event: EVENT_TIMER,
      action: strings.timer,
      type: undefined,
    },
  ],
  [
    {
      cls: "CONFIG/EXECUTE",
      event: EVENT_SETUP,
      action: strings.setup,
      type: undefined,
    },
  ],
  [
    {
      cls: "HEARTBEAT/EXECUTE",
      event: undefined,
      action: undefined,
      type: 255,
    },
  ],
];

/** try-on.spec.ts's comment stripper, for test 8. */
const strip = (t: string) =>
  t
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

const sourceOf = (file: string) =>
  readFileSync(new URL(file, import.meta.url), "utf8");

// ---------------------------------------------------------------------------

describe("InstallStore: the snapshot, the two RAM clicks, and the way back (SAFE-01, SAFE-03, SAFE-04, SAFE-07)", () => {
  beforeEach(() => {
    clock.t = 0;
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("the snapshot is taken at connect, in order, before ready", async () => {
    const { store, storage, phases, writesOf, session } = await connected();

    expect(store.phase).toBe("ready");
    const snapshotting = phases.indexOf("snapshotting");
    const ready = phases.indexOf("ready");
    expect(
      snapshotting,
      "the store passed through snapshotting",
    ).toBeGreaterThanOrEqual(0);
    expect(ready, "and then ready").toBeGreaterThan(snapshotting);

    // The order is the gate: the key, then Setup, then Timer, and nothing
    // else was asked of the module.
    expect(store.steps.map((s) => s.id)).toEqual([
      "fetch-serial",
      "fetch-setup",
      "fetch-timer",
    ]);
    expect(store.steps.map((s) => s.outcome)).toEqual(["ok", "ok", "ok"]);

    expect(store.snapshot).toEqual({
      setup: MODULE_SETUP,
      timer: MODULE_TIMER,
    });
    expect(store.snapshotPage).toBe(ACTIVE_PAGE);
    const key = expectedKey();
    expect(store.moduleId).toMatch(/^[0-9a-f]{32}$/);
    expect(store.moduleId, "the key is the serial, through moduleKeyOf").toBe(
      key,
    );
    expect(store.snapshotDurable).toBe(true);
    expect(store.rememberedModule).toBe(true);

    // The record: one module, one page, the module's own strings, and `last`.
    const raw = storage.map.get(SNAPSHOT_KEY);
    expect(raw, "the record was written").toBeDefined();
    const parsed = JSON.parse(raw ?? "{}") as {
      last?: string;
      modules: Record<string, { pages: Record<string, ConfigStrings> }>;
    };
    expect(Object.keys(parsed.modules)).toEqual([key]);
    expect(Object.keys(parsed.modules[key].pages)).toEqual([
      String(ACTIVE_PAGE),
    ]);
    expect(parsed.modules[key].pages[String(ACTIVE_PAGE)]).toMatchObject({
      setup: MODULE_SETUP,
      timer: MODULE_TIMER,
    });
    expect(parsed.last).toBe(key);

    // Spoken once the window closes, and NOTHING was written to the module.
    await after(500);
    expect(session.speech).toBe(LIVE_SNAPSHOT_SAVED);
    expect(writesOf("CONFIG", "EXECUTE"), "a config write at connect").toBe(0);
    expect(writesOf("PAGESTORE", "EXECUTE"), "a store at connect").toBe(0);
    expect(session.writeLock, "the snapshot is a read; no lock").toBe(false);
  });

  it("a serial that is not answered degrades to a session-only snapshot", async () => {
    const started = clock.t;
    const { store, storage, writesOf } = await connected({
      state: { serial: undefined },
    });

    // Three bounded attempts at TIMEOUTS.fetchMs each, two backoffs between:
    // the fake timers carried the queue through all of it.
    const serialStep = store.steps[0];
    expect(serialStep.id).toBe("fetch-serial");
    expect(serialStep.outcome).toBe("timeout");
    expect(serialStep.attempts).toBe(RETRY_ATTEMPTS);
    const bound =
      RETRY_ATTEMPTS * TIMEOUTS.fetchMs + retryBackoffMs(0) + retryBackoffMs(1);
    expect(
      clock.t - started,
      "the deadlines were waited out",
    ).toBeGreaterThanOrEqual(bound);
    expect(store.steps.map((s) => s.id)).toEqual([
      "fetch-serial",
      "fetch-setup",
      "fetch-timer",
    ]);

    // Ready all the same: the in-memory half is the rail.
    expect(store.phase).toBe("ready");
    expect(store.snapshot, "PUT BACK would still work").toEqual({
      setup: MODULE_SETUP,
      timer: MODULE_TIMER,
    });
    expect(store.snapshotDurable).toBe(false);
    expect(store.moduleId).toBeUndefined();
    expect(store.rememberedModule).toBe(false);
    expect(storage.map.size, "a record with no key").toBe(0);
    expect(writesOf("CONFIG", "EXECUTE")).toBe(0);
  });

  it("an empty fetched string is snapshot-failed, and everything stays disabled", async () => {
    // The module's RAM is on page 3; its heartbeat (the fixture's) reports
    // page 2. Firmware answers a fetch of a non-active page with an empty
    // string, which is exactly what D-03 refuses.
    const { store, state, storage, writesOf, session } = await connected({
      state: { activePage: ACTIVE_PAGE + 1 },
    });
    expect(store.phase).toBe("snapshot-failed");
    expect(store.snapshot).toBeUndefined();
    expect(store.snapshotPage).toBeUndefined();
    expect(store.moduleId, "the key was never published").toBeUndefined();
    expect(store.snapshotDurable).toBe(false);
    // Nothing was persisted: an empty pair is refused BEFORE storage is
    // touched, so no record of a snapshot that was never taken exists.
    expect(storage.map.size, "a record for an empty snapshot").toBe(0);
    expect(writesOf("CONFIG", "EXECUTE")).toBe(0);
    await after(500);
    expect(session.speech).toBe(announceTitle(snapshotFailedBlock().title));

    // The click retries the snapshot first, and writes ONLY if that lands.
    // The module is still on the wrong page, so: nothing.
    await drive(store.tryOnDevice(PAIR, "x"));
    expect(store.phase).toBe("snapshot-failed");
    expect(
      writesOf("CONFIG", "EXECUTE"),
      "a write over an uncopied module",
    ).toBe(0);
    expect(
      store.steps.map((s) => s.id),
      "the click read the module again",
    ).toEqual(["fetch-serial", "fetch-setup", "fetch-timer"]);

    // Fix the module - it is on the page its heartbeat reported - and retry.
    state.activePage = ACTIVE_PAGE;
    await drive(store.retrySnapshot());
    expect(store.phase).toBe("ready");
    expect(store.snapshot).toEqual({
      setup: MODULE_SETUP,
      timer: MODULE_TIMER,
    });
    expect(store.snapshotPage).toBe(ACTIVE_PAGE);
    expect(store.moduleId).toBe(expectedKey());
    expect(storage.map.size, "the retry persisted the copy").toBe(1);
    expect(writesOf("CONFIG", "EXECUTE"), "the retry is a read").toBe(0);
  });

  it("nothing is written without a click, and TRY ON DEVICE writes exactly two, Timer first, verbatim", async () => {
    const { store, fake, state, session, writesOf } = await connected();
    const locks = record(session, "writeLock");

    // Knob moves: the pair arrives, twice, and nothing goes out.
    store.observeConfig(PAIR);
    store.observeConfig(PAIR);
    expect(writesOf("CONFIG", "EXECUTE"), "a knob move wrote").toBe(0);
    expect(store.armed, "armed before anything was written").toBe(false);
    const framesBefore = fake.writes.length;

    await drive(store.tryOnDevice(PAIR, "Aurora"));

    // Exactly two config writes, Timer (6) then Setup (0), the strings
    // character for character, then exactly one restore heartbeat - the last
    // three frames on the wire, in that order.
    expect(writesOf("CONFIG", "EXECUTE")).toBe(2);
    expect(writesOf("HEARTBEAT", "EXECUTE")).toBe(1);
    const frames = written(fake);
    expect(frames.length - framesBefore, "frames the click produced").toBe(3);
    expect(frames.slice(-3).map(shape)).toEqual(ramLegFrames(PAIR));

    // Settled means both ACKs AND the restore went out (SAFE-07).
    expect(store.steps.map((s) => [s.id, s.outcome])).toEqual([
      ["write-timer", "ok"],
      ["write-setup", "ok"],
      ["restore-page-change", "sent"],
    ]);
    expect(store.phase).toBe("settled");
    expect(store.action).toBe("try");
    expect(store.leg).toBe("ram");
    expect(store.cause).toBeUndefined();
    expect(store.lastWritten).toEqual(PAIR);
    expect(store.armed, "the module holds the pair on screen").toBe(true);
    expect(store.name).toBe("Aurora");
    expect(state.configs[EVENT_SETUP], "the fake's RAM").toBe(PAIR.setup);
    expect(state.configs[EVENT_TIMER]).toBe(PAIR.timer);

    // The header lock closed over the leg and released with it.
    expect(locks).toEqual([true, false]);
    expect(session.writeLock).toBe(false);
    await after(500);
    expect(session.speech).toBe(liveSettled("Aurora"));

    // A knob move onto different strings disarms; onto the same strings, not.
    store.observeConfig({ setup: PAIR.setup, timer: MODULE_TIMER });
    expect(store.armed).toBe(false);
    store.observeConfig({ ...PAIR });
    expect(store.armed).toBe(true);
    expect(
      writesOf("CONFIG", "EXECUTE"),
      "a knob move after the click wrote",
    ).toBe(2);
  });

  it("PUT BACK writes the snapshot's strings the same way and lands restored", async () => {
    const { store, fake, state, session, writesOf } = await connected();
    store.observeConfig(PAIR);
    await drive(store.tryOnDevice(PAIR, "Aurora"));
    expect(store.phase).toBe("settled");
    expect(state.configs[EVENT_SETUP]).toBe(PAIR.setup);
    const framesBefore = fake.writes.length;

    await drive(store.putBack());

    // The SNAPSHOT's strings, not the pair, in the same order, one restore.
    const frames = written(fake);
    expect(frames.length - framesBefore).toBe(3);
    expect(frames.slice(-3).map(shape)).toEqual(
      ramLegFrames({ setup: MODULE_SETUP, timer: MODULE_TIMER }),
    );
    expect(writesOf("CONFIG", "EXECUTE"), "two clicks, four writes").toBe(4);
    expect(writesOf("HEARTBEAT", "EXECUTE"), "one restore per leg").toBe(2);
    expect(store.steps.map((s) => [s.id, s.outcome])).toEqual([
      ["write-timer", "ok"],
      ["write-setup", "ok"],
      ["restore-page-change", "sent"],
    ]);

    expect(store.phase).toBe("restored");
    expect(store.action).toBe("put-back");
    expect(store.armed).toBe(false);
    expect(store.lastWritten).toBeUndefined();
    expect(store.name).toBeUndefined();
    expect(store.snapshot, "the way back is still there").toEqual({
      setup: MODULE_SETUP,
      timer: MODULE_TIMER,
    });
    expect(session.writeLock).toBe(false);
    await after(500);
    expect(session.speech).toBe(LIVE_RESTORED);

    // The module's RAM is what it was when the visitor connected.
    expect(state.configs[EVENT_SETUP]).toBe(MODULE_SETUP);
    expect(state.configs[EVENT_TIMER]).toBe(MODULE_TIMER);
  });

  it("an existing record wins and is never overwritten", async () => {
    // A record from an earlier visit, holding strings DIFFERENT from what the
    // module holds now - the shape a re-connect after TRY ON DEVICE produces.
    const RECORD: ConfigStrings = {
      setup: "--[[@cb]]print(7)",
      timer: "--[[@cb]]print(8)",
    };
    const TAKEN_AT = "2026-09-01T09:00:00.000Z";
    const storage = mapStorage();
    const key = expectedKey();
    expect(
      persistIfAbsent(storage.store, key, ACTIVE_PAGE, RECORD, TAKEN_AT),
    ).toBe("written");
    const entryOf = () => {
      const parsed = JSON.parse(storage.map.get(SNAPSHOT_KEY) ?? "{}") as {
        modules: Record<string, { pages: Record<string, unknown> }>;
      };
      return parsed.modules[key].pages[String(ACTIVE_PAGE)];
    };
    const before = entryOf();
    expect(before).toEqual({ ...RECORD, takenAt: TAKEN_AT });

    const { store, fake, state, writesOf } = await connected({ storage });
    expect(store.phase).toBe("ready");
    expect(store.snapshot, "the record's strings, not the module's").toEqual(
      RECORD,
    );
    expect(store.snapshot).not.toEqual({
      setup: MODULE_SETUP,
      timer: MODULE_TIMER,
    });
    expect(store.snapshotDurable).toBe(true);
    expect(entryOf(), "the entry was touched (takenAt included)").toEqual(
      before,
    );

    // PUT BACK writes the record's strings.
    await drive(store.putBack());
    expect(store.phase).toBe("restored");
    expect(written(fake).slice(-3).map(shape)).toEqual(ramLegFrames(RECORD));
    expect(writesOf("CONFIG", "EXECUTE")).toBe(2);
    expect(state.configs[EVENT_SETUP]).toBe(RECORD.setup);
    expect(state.configs[EVENT_TIMER]).toBe(RECORD.timer);
    expect(entryOf(), "PUT BACK touched the record").toEqual(before);
  });

  it("over budget, and measuring, never reach the wire", async () => {
    const { store, fake, session } = await connected();
    expect(store.phase).toBe("ready");
    const framesBefore = fake.writes.length;
    const stepsBefore = store.steps;
    expect(stepsBefore).toHaveLength(3);

    // Measuring: the tuner has withdrawn the pair (D-17). The write count is
    // asserted FIRST, so a store that proceeds on undefined is reported as
    // what it is - a write - rather than as a phase that moved.
    await drive(store.tryOnDevice(undefined, "x"));
    expect(fake.writes.length, "undefined reached the transport").toBe(
      framesBefore,
    );
    expect(store.phase).toBe("ready");
    // Over budget: 909 is one past the module's limit, refused here before
    // sendConfig's own RangeError could ever be reached (TUNE-05, D-10).
    await drive(store.tryOnDevice({ setup: "a".repeat(909), timer: "" }, "x"));
    expect(
      fake.writes.length,
      "an over-budget Setup reached the transport",
    ).toBe(framesBefore);
    expect(store.phase).toBe("ready");
    await drive(store.tryOnDevice({ setup: "", timer: "a".repeat(909) }, "x"));
    expect(
      fake.writes.length,
      "an over-budget Timer reached the transport",
    ).toBe(framesBefore);
    expect(store.phase).toBe("ready");
    // The queue was not touched: the steps are still the snapshot's own array.
    expect(store.steps, "an action started").toBe(stepsBefore);
    expect(store.steps).toHaveLength(3);
    expect(store.lastWritten).toBeUndefined();
    expect(store.armed).toBe(false);
    expect(session.writeLock).toBe(false);
  });

  it("the file's shape: three specifiers, no raw onData, no direct write, no interval, no derived", () => {
    // Comment-stripped: the store's header legitimately names every symbol
    // these scans forbid while explaining its absence. Needles are assembled
    // from fragments so this file does not contain what it forbids.
    const source = strip(sourceOf("./install.svelte.ts"));
    expect(source.length, "the source was actually read").toBeGreaterThan(1000);
    expect(source, "non-vacuity: the class is there").toContain(
      "class InstallStore",
    );

    const specifiers = [...source.matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
    expect(specifiers, "exactly three static specifiers, these three").toEqual([
      "./install-copy",
      "./snapshot",
      "./session.svelte",
    ]);
    for (const needle of [
      [".", "onData("].join(""),
      [".", "write("].join(""),
      ["set", "Interval"].join(""),
      ["$", "derived"].join(""),
      ["navigator", ".userAgent"].join(""),
    ]) {
      expect
        .soft(source.includes(needle), `install.svelte.ts reaches ${needle}`)
        .toBe(false);
    }
    // The heavy modules arrive by await import inside an action, and the
    // queue is fed from the session's seam.
    expect(source).toContain(["await import(", '"$lib/transport")'].join(""));
    expect(source).toContain(["session", ".onClass("].join(""));
    expect(source).toContain(["persist", "IfAbsent("].join(""));

    // And the session is still clean after this plan: test 15's needle list,
    // run here over session.svelte.ts so the two files are checked together.
    const sessionSource = strip(sourceOf("./session.svelte.ts"));
    expect(sessionSource.length).toBeGreaterThan(1000);
    for (const needle of [
      [".", "write("].join(""),
      ["Request", "Queue"].join(""),
      ["host", "Heartbeat"].join(""),
      ["send", "Config"].join(""),
      ["store", "Page"].join(""),
      ["fetch", "Config"].join(""),
      ["store", "ToFlash"].join(""),
      ["write", "Back"].join(""),
      ["set", "Interval"].join(""),
    ]) {
      expect
        .soft(
          sessionSource.includes(needle),
          `session.svelte.ts reaches ${needle}`,
        )
        .toBe(false);
    }
  });
});
