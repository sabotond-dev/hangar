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
// write zero CONFIG/EXECUTE, TRY ON DEVICE writes two, PUT BACK writes two and
// - after a keep - one PAGESTORE/EXECUTE, KEEP ON DEVICE writes one
// PAGESTORE/EXECUTE. Nothing here opens a port.
//
// THE TEE. FakeTransport has no public rx injection - only fromCapture and the
// responder - so the session is handed a tee: an object implementing
// GridTransport that delegates isOpen, write, onClose and close to the fake,
// whose onData(cb) keeps cb and registers on the fake a forwarder into it, and
// which exposes push(frame) calling that same cb. So a pushed heartbeat and the
// responder's replies both reach the ONE callback the session registers, and
// the fake keeps its faults, which the flash-leg gates need. (session.spec.ts's
// pushable() bus beside a responder would lose the faults.) The tee also logs
// every frame it delivered, decoded - so a rig's three acknowledgements to one
// store can be counted - and the clock reading at every write, so the pacing
// escalation is measured where it lands rather than believed.
//
// THE HEARTBEATS THE STORE WAITS FOR ARRIVE THROUGH push(). The store's D-12
// proof waits for the ZONA's next heartbeat after the PAGESTORE acknowledgement
// before it re-fetches; the responder never sends one, so every store-leg gate
// feeds one through the tee, and records the clock reading it was fed at.
//
// EVERY FAKE PORT IS `connected: true`. The session's missed-disconnect
// watchdog (MODULE_GONE_MS 750, session.svelte.ts #armWatchdog) tears the
// session down only when the module has been silent AND portIsAttached(port)
// is false. A port that reports attached keeps the watchdog quiet through test
// 2's ~1.3 s of fake-timer advance and tests 11 and 12's ~9 s, so no test here
// lands in `unplugged-while-connected` by accident. The one unplug this file
// stages (test 15) is a `disconnect` fault on the fake, and the one it fires
// (test 17) is the navigator-level event.
//
// THE CLOCK. setTimeout and clearTimeout are faked in every test - the queue's
// pre-send sleep, its deadlines, its retry backoff, the store's 2000 ms line
// and the live region's 500 ms window are all setTimeout chains - and the
// queue's deadline clock is the store's injected `now`, a movable value this
// file advances IN STEP with the fake timers (until() below). The session's
// own clock is frozen at zero: with every port attached, the watchdog never has
// a reason to fire.
//
// THE ORDER OF A FAULT LIST IS LOAD-BEARING (tests 12 and 13). fake.ts's
// dropped() returns at the FIRST due fault and due() counts a fault only when
// the loop reaches it. Three `nth` drops meant for acknowledgements 2, 3 and 4
// are therefore listed DESCENDING - nth 4, 3, 2 - so every earlier-listed fault
// sees every acknowledgement; listed ascending, the nth 2 drop would starve the
// others of acknowledgement 2, acknowledgement 3 would find nobody due and
// LAND, and the trace would end `settled`.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DESKTOP_PRE_SEND_DELAY_MS,
  EVENT_SETUP,
  EVENT_TIMER,
  RETRY_ATTEMPTS,
  TERMINATOR,
  TIMEOUTS,
  TOUCH_DEFAULT_SETUP,
  TOUCH_DEFAULT_TIMER,
  ZONA_HWCFG,
  type DecodedClass,
  decodeFrame,
  moduleKeyOf,
  retryBackoffMs,
} from "$lib/protocol";
import { ZONA_USB } from "$lib/protocol/usb";
import {
  type CaptureStep,
  FakeTransport,
  type Fault,
  type GridTransport,
} from "$lib/transport";
import {
  configNackFrame,
  configReportFrame,
  heartbeatFrame,
  rigResponder,
  serialNumberReportFrame,
  zonaResponder,
  type ZonaState,
} from "../transport/fixtures/synthetic";
import {
  LIVE_CLEARED,
  LIVE_RESTORED,
  LIVE_SNAPSHOT_SAVED,
  LIVE_STILL_WRITING,
  TRY_ON_LABEL,
  announceTitle,
  confirmRig,
  keptMismatchBlock,
  liveKept,
  liveSettled,
  lostBlock,
  nothingLandedBlock,
  partialBlock,
  restoredUnconfirmedBlock,
  snapshotFailedBlock,
  unconfirmedBlock,
} from "./install-copy";
import {
  type ConfigStrings,
  type InstallPhase,
  InstallStore,
} from "./install.svelte";
import { DeviceSession, type SerialLike } from "./session.svelte";
import {
  SNAPSHOT_KEY,
  type SnapshotStore,
  persistIfAbsent,
  rememberLast,
} from "./snapshot";

// ---------------------------------------------------------------------------
// The module, and what it holds.

const FIRMWARE = { major: 1, minor: 5, patch: 5 };
/** Deliberately not the first page, for sequence.spec.ts's reason: a constant would be caught. */
const ACTIVE_PAGE = 2;
/** What the module holds when the visitor connects: the strings the snapshot must copy. */
const MODULE_SETUP = "--[[@cb]]print(1)";
const MODULE_TIMER = "--[[@cb]]print(2)";
/** The module's original, as a pair. */
const ORIGINAL: ConfigStrings = { setup: MODULE_SETUP, timer: MODULE_TIMER };
/** The tuner's pair, different from the module's in both events. */
const PAIR: ConfigStrings = {
  setup: "--[[@cb]]print(3)",
  timer: "--[[@cb]]print(4)",
};
/** WORD0..WORD3, with a word above 2^31 so moduleKeyOf's unsigned rule is exercised. */
const SERIAL = [0x9abcdef0, 0x12345678, 0, 0] as const;
/** Two modules that share a cable with the ZONA in test 16, by their RevH hwcfg. */
const EN16_HWCFG = 195;
const BU16_HWCFG = 131;

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

/** A chained module's heartbeat: TYPE 0, one class, no page report. */
const otherHeartbeat = (sx: number, hwcfg: number) =>
  heartbeatFrame({
    sx,
    sy: 0,
    type: 0,
    hwcfg,
    activePage: ACTIVE_PAGE,
    firmware: FIRMWARE,
  });

// ---------------------------------------------------------------------------
// The clock, and how the tests wait.

/** The queue's deadline clock. Moved by until() in step with the fake timers. */
const clock = { t: 0 };
const STEP_MS = 5;

/** One turn of the real macrotask queue, so pending microtasks run before the clock moves. */
const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

/** Advance the clock and the fake timers together by exactly `ms`, once. */
async function tick(ms: number): Promise<void> {
  clock.t += ms;
  await vi.advanceTimersByTimeAsync(ms);
  await settle();
}

/**
 * Advance the clock and the fake timers together by `ms`, in small steps, and
 * yield to the macrotask queue between them so real promise chains (the
 * store's dynamic imports) can make progress too.
 */
async function after(ms: number): Promise<void> {
  for (let done = 0; done < ms; done += STEP_MS) await tick(STEP_MS);
}

/** Advance until the predicate holds, or fail after 20 virtual seconds. */
async function until(predicate: () => boolean, what: string): Promise<void> {
  for (let i = 0; i < 4000; i++) {
    if (predicate()) return;
    await after(STEP_MS);
  }
  throw new Error(`timed out waiting for ${what}`);
}

/**
 * Start a store action without waiting for it, and return the wait: the
 * flash-leg gates need to feed a heartbeat while the action is in flight.
 * The wait yields one macrotask BEFORE the clock moves, so the action's own
 * microtasks - the phase going to `writing`, the queue stamping sentAt - run
 * at the clock reading the caller took, not one step later.
 */
function begin(action: Promise<void>): () => Promise<void> {
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
  return async () => {
    await settle();
    await until(() => done, "the action to settle");
    if (failure !== undefined) throw failure;
  };
}

/** Drive a store action to completion under the fake timers, and rethrow what it threw. */
async function drive(action: Promise<void>): Promise<void> {
  await begin(action)();
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

/**
 * A navigator.serial with one granted port and no chooser: requestPort() would
 * throw. It keeps the session's listener pair so a test can fire the
 * navigator-level `disconnect` (test 17) and `connect` (test 15's replug) at a
 * port, the way the browser would.
 */
function fakeSerial(granted: SerialPort[]) {
  const listeners = new Map<string, Set<(ev: Event) => void>>();
  const serial: SerialLike = {
    requestPort: () => {
      throw new Error("the test gave requestPort no cue");
    },
    getPorts: async () => granted,
    addEventListener: (type, listener) => {
      const set = listeners.get(type) ?? new Set();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener: (type, listener) => {
      listeners.get(type)?.delete(listener);
    },
  };
  const fire = (type: "connect" | "disconnect", port: SerialPort): void => {
    for (const listener of listeners.get(type) ?? []) {
      listener({ target: port } as unknown as Event);
    }
  };
  return { serial, fire };
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

/** One frame's classes, or undefined when it did not decode. */
function classesOf(bytes: Uint8Array | number[]): DecodedClass[] | undefined {
  const frame = [...bytes];
  if (frame[frame.length - 1] === TERMINATOR) frame.pop();
  const decoded = decodeFrame(frame);
  return decoded.ok ? decoded.classes : undefined;
}

/**
 * The tee over a FakeTransport; see the header. `initial` is delivered on the
 * first onData, as pushable() does. `received` is every frame delivered to the
 * session, decoded; `writeAt` is the clock reading at every write.
 */
function tee(fake: FakeTransport, initial: number[][]) {
  let callback: ((chunk: Uint8Array) => void) | undefined;
  let forwarding = false;
  let delivered = false;
  const received: DecodedClass[][] = [];
  const writeAt: number[] = [];
  const deliver = (chunk: Uint8Array) => {
    const classes = classesOf(chunk);
    if (classes) received.push(classes);
    callback?.(chunk);
  };
  const push = (frame: number[]) =>
    deliver(Uint8Array.from([...frame, TERMINATOR]));
  const transport: GridTransport = {
    get isOpen() {
      return fake.isOpen;
    },
    write: (data) => {
      writeAt.push(clock.t);
      return fake.write(data);
    },
    onData: (next) => {
      callback = next;
      if (!forwarding) {
        forwarding = true;
        fake.onData(deliver);
      }
      if (delivered) return;
      delivered = true;
      for (const frame of initial) push(frame);
    },
    onClose: (handler) => fake.onClose(handler),
    close: () => fake.close(),
  };
  return { transport, push, received, writeAt };
}

/** Every outbound frame, decoded back into the classes it carried. */
function written(fake: FakeTransport): DecodedClass[][] {
  return fake.writes.map((bytes) => {
    const classes = classesOf(bytes);
    if (!classes) throw new Error(`an outbound frame did not decode`);
    return classes;
  });
}

const settledPhase = (phase: InstallPhase) =>
  phase !== "idle" && phase !== "snapshotting";

type Responder = (outbound: DecodedClass, requestId: number) => number[][];

interface ConnectOptions {
  state?: Partial<ZonaState>;
  storage?: ReturnType<typeof mapStorage>;
  faults?: Fault[];
  /** Other modules on the cable: they answer through rigResponder and their heartbeats ride in the initial frames. */
  others?: { sx: number; hwcfg: number }[];
  /** Wrap the scripted module's answers - a re-fetch that lies, a refusal of one event. */
  wrap?: (inner: Responder) => Responder;
  /** The store's wait between re-fetch rounds, so a test can see the backoffs it asked for. */
  sleep?: (ms: number) => Promise<void>;
  /** False to return as soon as the session is connected, before the snapshot lands. */
  settle?: boolean;
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
  const others = opts.others ?? [];
  const otherStates: ZonaState[] = others.map((m) => ({
    sx: m.sx,
    sy: 0,
    activePage: ACTIVE_PAGE,
    configs: {},
  }));
  const base: Responder =
    otherStates.length > 0
      ? rigResponder([state, ...otherStates])
      : zonaResponder(state);
  const responder = opts.wrap ? opts.wrap(base) : base;
  const fake = new FakeTransport({ responder, faults: opts.faults });
  /** The ZONA's heartbeat and, on a rig, every other module's: what identifies the cable and what a store leg waits for. */
  const heartbeats = [
    zonaHeartbeat(),
    ...others.map((m) => otherHeartbeat(m.sx, m.hwcfg)),
  ];
  let bus = tee(fake, heartbeats);
  const port = fakePort();
  const storage = opts.storage ?? mapStorage();
  const { serial, fire } = fakeSerial([port]);

  const session = new DeviceSession();
  const store = new InstallStore(session);
  const phases = record(store, "phase");
  store.start({
    storage: storage.store,
    now: () => clock.t,
    sleep: opts.sleep,
  });
  session.start({
    hasSerial: true,
    secure: true,
    serial,
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
  if (opts.settle !== false) {
    await until(() => settledPhase(store.phase), "the snapshot to land");
  }

  const writesOf = (className: string, instr: string): number =>
    written(fake)
      .flat()
      .filter((c) => c.class_name === className && c.class_instr === instr)
      .length;

  /**
   * Replug: a fresh fake over the same scripted module, a new port object
   * arriving on the navigator-level `connect` (the session adopts it by
   * getInfo), one click, and the snapshot left to land again.
   */
  const reconnect = async (faults?: Fault[]) => {
    const next = new FakeTransport({ responder, faults });
    bus = tee(next, heartbeats);
    const replugged = fakePort();
    fire("connect", replugged);
    await until(() => session.phase === "detected", "the replug offer");
    session.connect();
    await until(() => session.phase === "connected", "re-identification");
    await until(() => settledPhase(store.phase), "the snapshot to land again");
    const nextWritesOf = (className: string, instr: string): number =>
      written(next)
        .flat()
        .filter((c) => c.class_name === className && c.class_instr === instr)
        .length;
    return { fake: next, writesOf: nextWritesOf };
  };

  return {
    fake,
    port,
    fire,
    push: (frame: number[]) => bus.push(frame),
    /** Feed the cable's heartbeats - the ZONA's and, on a rig, the others' - as the modules would. */
    heartbeat: () => {
      for (const frame of heartbeats) bus.push(frame);
    },
    received: () => bus.received,
    writeAt: () => bus.writeAt,
    reconnect,
    state,
    storage,
    session,
    store,
    phases,
    writesOf,
  };
}

type Rig = Awaited<ReturnType<typeof connected>>;

/**
 * Run an action with a store leg the way the module would let it run: the
 * PAGESTORE goes out, and once its acknowledgement is recorded the cable's
 * heartbeats are fed - after a 20 ms pause in which a store that did NOT wait
 * for them would already have re-fetched. Returns the clock reading the
 * heartbeats were fed at, or undefined when the leg ended without one (a
 * store that never acknowledged, a refusal).
 */
async function throughStore(
  rig: Rig,
  action: Promise<void>,
): Promise<number | undefined> {
  const finish = begin(action);
  await settle();
  const acknowledged = () =>
    rig.store.steps.some((s) => s.id === "store" && s.outcome === "ok");
  await until(
    () => acknowledged() || rig.store.phase !== "writing",
    "the store acknowledgement or a failure",
  );
  let fedAt: number | undefined;
  if (rig.store.phase === "writing" && acknowledged()) {
    await after(20);
    fedAt = clock.t;
    rig.heartbeat();
  }
  await finish();
  return fedAt;
}

/** A settled try-on of the pair, the road every flash-leg gate starts from. */
async function triedOn(rig: Rig, name = "Aurora"): Promise<void> {
  rig.store.observeConfig(PAIR);
  await drive(rig.store.tryOnDevice(PAIR, name));
  expect(rig.store.phase).toBe("settled");
}

/** The step ids and outcomes, in order. */
const outcomes = (steps: readonly CaptureStep[]) =>
  steps.map((s) => [s.id, s.outcome]);

/** The one page entry under the key, or undefined. */
function pageEntry(storage: ReturnType<typeof mapStorage>, page: number) {
  const parsed = JSON.parse(storage.map.get(SNAPSHOT_KEY) ?? "{}") as {
    modules?: Record<string, { pages: Record<string, unknown> }>;
  };
  return parsed.modules?.[expectedKey()]?.pages[String(page)];
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

/**
 * Three `nth` drops of one acknowledgement class, for acknowledgements 2, 3
 * and 4 - one fault object per attempt, each with its own counter, LISTED
 * DESCENDING (see the header): dropped() returns at the first due fault, so
 * listed ascending the nth 2 drop starves nth 3 and nth 4 of acknowledgement
 * 2, acknowledgement 3 finds nobody due and lands, and the trace ends
 * `settled`. A single `nth: 2` cannot produce the trace either: the request id
 * is minted per attempt, so attempt 2's acknowledgement carries a fresh id and
 * lands.
 */
const dropAcks234 = (class_name: string): Fault[] =>
  [4, 3, 2].map((nth) => ({
    kind: "drop" as const,
    match: { class_name, class_instr: "ACKNOWLEDGE" },
    nth,
  }));

/** try-on.spec.ts's comment stripper, for tests 8 and 18. */
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
    // FOUR CLICKS SINCE PLAN 10-12, and this assertion did not change - which
    // is the finding rather than an omission (G-06, and A-53 correcting the
    // spec text that said otherwise). The count is BY CLASS, and CLEAR writes
    // CONFIG/EXECUTE - the class already counted - so its reach was already
    // total and widening the enumeration would have been work that proved
    // nothing. What actually widened is InstallAction, and the compiler
    // enforces that for free.
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
    // TEN since plan 10-12, and this copy moves with the original or the
    // sentence above it stops being true.
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
      ["clear", "ToDefault"].join(""),
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

  // -------------------------------------------------------------------------
  // The flash leg, the taxonomy and the bounds (07-07; SAFE-05 to SAFE-09).

  it("kept is said after the store acknowledgement, a heartbeat, and a matching re-fetch", async () => {
    const rig = await connected();
    const { store, state, session, writesOf } = rig;
    await triedOn(rig);
    expect(
      store.keepReason(true),
      "live after a settled try-on",
    ).toBeUndefined();
    const locks = record(session, "writeLock");
    const spoken = record(session, "speech");

    store.openConfirm();
    expect(store.confirmOpen).toBe(true);
    const fedAt = await throughStore(rig, store.keepOnDevice());

    expect(store.confirmOpen, "the confirmation closed on the click").toBe(
      false,
    );
    expect(writesOf("PAGESTORE", "EXECUTE")).toBe(1);
    expect(outcomes(store.steps)).toEqual([
      ["store", "ok"],
      ["refetch-setup", "ok"],
      ["refetch-timer", "ok"],
    ]);

    // D-12 through Pitfall 6: the re-fetch went out only AFTER the heartbeat
    // was fed - at the feed's clock reading or later (the send is the
    // microtask after the feed). throughStore paused 20 ms between the
    // acknowledgement and the feed, so a store that did not wait would have
    // sent its re-fetch strictly before fedAt.
    expect(fedAt, "a heartbeat was fed while the store waited").toBeDefined();
    for (const step of store.steps.filter((s) => s.id.startsWith("refetch"))) {
      expect(
        step.sentAt,
        `${step.id} was sent before the heartbeat`,
      ).toBeGreaterThanOrEqual(fedAt ?? Number.POSITIVE_INFINITY);
    }

    expect(store.phase).toBe("kept");
    expect(store.action).toBe("keep");
    expect(store.leg).toBe("store");
    expect(store.cause).toBeUndefined();
    expect(store.keptThisSession).toBe(true);
    expect(store.refetchRounds).toBe(1);
    expect(store.keepReason(true)).toBe("already-kept");
    expect(store.armed).toBe(false);
    expect(store.slow).toBe(false);
    expect(state.flash, "the fake's flash holds the pair").toEqual({
      [EVENT_SETUP]: PAIR.setup,
      [EVENT_TIMER]: PAIR.timer,
    });
    expect(locks).toEqual([true, false]);
    expect(session.writeLock).toBe(false);
    await after(500);
    expect(session.speech).toBe(liveKept("Aurora"));
    expect(
      spoken.filter((s) => s === liveKept("Aurora")),
      "spoken once - not for the ACK and again for the proof",
    ).toHaveLength(1);
  });

  it("a read-back that never matches is kept-mismatch after three rounds", async () => {
    const sleeps: number[] = [];
    let stored = false;
    const rig = await connected({
      // After the store, the module answers every fetch of Setup with
      // something other than what was sent: the shape of a reload that
      // never settles, unreachable on healthy hardware.
      wrap: (inner) => (outbound, requestId) => {
        const p = outbound.class_parameters;
        if (
          stored &&
          outbound.class_name === "CONFIG" &&
          outbound.class_instr === "FETCH" &&
          Number(p.EVENTTYPE) === EVENT_SETUP
        ) {
          return [
            configReportFrame({
              sx: 0,
              sy: 0,
              page: Number(p.PAGENUMBER),
              event: EVENT_SETUP,
              config: "--[[@cb]]print(9)",
            }),
          ];
        }
        const replies = inner(outbound, requestId);
        if (outbound.class_name === "PAGESTORE") stored = true;
        return replies;
      },
      sleep: async (ms) => {
        sleeps.push(ms);
      },
    });
    const { store, session } = rig;
    await triedOn(rig);
    store.openConfirm();
    await throughStore(rig, store.keepOnDevice());

    // Exactly three rounds, each of both events, a backoff after each.
    expect(outcomes(store.steps)).toEqual([
      ["store", "ok"],
      ["refetch-setup", "ok"],
      ["refetch-timer", "ok"],
      ["refetch-setup", "ok"],
      ["refetch-timer", "ok"],
      ["refetch-setup", "ok"],
      ["refetch-timer", "ok"],
    ]);
    expect(sleeps).toEqual([
      retryBackoffMs(0),
      retryBackoffMs(1),
      retryBackoffMs(2),
    ]);
    expect(store.refetchRounds).toBe(3);

    expect(store.phase).toBe("kept-mismatch");
    expect(store.cause).toBe("mismatch");
    expect(store.keptThisSession, "not called kept").toBe(false);
    expect(store.keepReason(true)).toBe("after-mismatch");
    expect(store.putBackState()).toBe("enabled");
    expect(store.armed).toBe(false);
    expect(session.writeLock).toBe(false);
    await after(500);
    expect(session.speech).toBe(announceTitle(keptMismatchBlock().title));
    expect(session.speech.endsWith(".")).toBe(true);
  });

  it("a store that never acknowledges is unconfirmed, and KEEP ON DEVICE stays live", async () => {
    const rig = await connected({
      faults: [
        {
          kind: "drop",
          match: { class_name: "PAGESTORE", class_instr: "ACKNOWLEDGE" },
        },
      ],
    });
    const { store, session, writesOf } = rig;
    await triedOn(rig);
    store.openConfirm();
    const started = clock.t;
    const fedAt = await throughStore(rig, store.keepOnDevice());

    // Three bounded attempts at pagestoreMs each, two backoffs between, and
    // no heartbeat was ever waited for because no acknowledgement came.
    expect(fedAt).toBeUndefined();
    expect(clock.t - started).toBeGreaterThanOrEqual(
      RETRY_ATTEMPTS * TIMEOUTS.pagestoreMs +
        retryBackoffMs(0) +
        retryBackoffMs(1),
    );
    expect(writesOf("PAGESTORE", "EXECUTE")).toBe(RETRY_ATTEMPTS);
    expect(outcomes(store.steps)).toEqual([["store", "timeout"]]);
    expect(store.steps[0].attempts).toBe(RETRY_ATTEMPTS);

    expect(store.phase).toBe("unconfirmed");
    expect(store.cause).toBe("timeout");
    expect(store.keptThisSession).toBe(false);
    // Memory still holds what was heard, so the store may be sent again.
    expect(store.armed).toBe(true);
    expect(store.keepReason(true)).toBeUndefined();
    expect(store.putBackState()).toBe("enabled");
    expect(store.slow, "the slow line is cleared with the leg").toBe(false);
    expect(session.writeLock).toBe(false);
    await after(500);
    expect(session.speech).toBe(
      announceTitle(unconfirmedBlock("Aurora").title),
    );

    store.openConfirm();
    expect(store.confirmOpen, "the confirmation opens again").toBe(true);
  });

  it("after a keep, PUT BACK stores too; when its store never confirms, it is restored-unconfirmed", async () => {
    // Part one: the store lands and is proved.
    const rig = await connected();
    const { store, fake, state, session, writesOf } = rig;
    await triedOn(rig);
    store.openConfirm();
    await throughStore(rig, store.keepOnDevice());
    expect(store.phase).toBe("kept");
    const framesBefore = fake.writes.length;
    const spoken = record(session, "speech");

    await throughStore(rig, store.putBack());

    // The RAM leg with the SNAPSHOT's strings, its restore, then one
    // PAGESTORE/EXECUTE, then the re-fetch of both.
    const frames = written(fake).slice(framesBefore).map(shape);
    expect(frames).toHaveLength(6);
    expect(frames.slice(0, 3)).toEqual(ramLegFrames(ORIGINAL));
    expect(frames[3][0].cls).toBe("PAGESTORE/EXECUTE");
    expect(frames.slice(4).map((f) => f[0].cls)).toEqual([
      "CONFIG/FETCH",
      "CONFIG/FETCH",
    ]);
    expect(outcomes(store.steps)).toEqual([
      ["write-timer", "ok"],
      ["write-setup", "ok"],
      ["restore-page-change", "sent"],
      ["store", "ok"],
      ["refetch-setup", "ok"],
      ["refetch-timer", "ok"],
    ]);
    expect(writesOf("PAGESTORE", "EXECUTE"), "one keep, one put-back").toBe(2);

    expect(store.phase).toBe("restored");
    expect(store.action).toBe("put-back");
    expect(store.leg).toBe("store");
    expect(store.keptThisSession, "cleared by a put-back that stored").toBe(
      false,
    );
    expect(state.configs).toEqual({
      [EVENT_SETUP]: MODULE_SETUP,
      [EVENT_TIMER]: MODULE_TIMER,
    });
    expect(state.flash, "the fake's flash holds the original again").toEqual({
      [EVENT_SETUP]: MODULE_SETUP,
      [EVENT_TIMER]: MODULE_TIMER,
    });
    await after(500);
    expect(session.speech).toBe(LIVE_RESTORED);
    expect(spoken.filter((s) => s === LIVE_RESTORED)).toHaveLength(1);

    // Part two: a fresh rig whose flash never confirms the put-back's store.
    // Faults are fixed at construction: the keep takes acknowledgement 1, and
    // the put-back's three attempts are acknowledgements 2, 3 and 4 - listed
    // DESCENDING, see dropAcks234 and the header.
    const second = await connected({ faults: dropAcks234("PAGESTORE") });
    await triedOn(second);
    second.store.openConfirm();
    await throughStore(second, second.store.keepOnDevice());
    expect(second.store.phase).toBe("kept");
    const spokenSecond = record(second.session, "speech");

    await throughStore(second, second.store.putBack());

    expect(second.writesOf("PAGESTORE", "EXECUTE"), "1 + 3 attempts").toBe(4);
    expect(outcomes(second.store.steps)).toEqual([
      ["write-timer", "ok"],
      ["write-setup", "ok"],
      ["restore-page-change", "sent"],
      ["store", "timeout"],
    ]);
    expect(second.store.phase).toBe("restored-unconfirmed");
    expect(second.store.cause).toBe("timeout");
    expect(
      second.store.keptThisSession,
      "still set: the store did not prove",
    ).toBe(true);
    expect(second.store.putBackState()).toBe("enabled");
    expect(second.store.keepReason(true)).toBe("never-tried");
    // RAM is the original. The fake's flash is not asserted: zonaResponder
    // stores before the fault drops its acknowledgement, so what the fake's
    // flash holds is exactly what HANGAR cannot know - the sentence I12 speaks.
    expect(second.state.configs[EVENT_SETUP]).toBe(MODULE_SETUP);
    expect(second.state.configs[EVENT_TIMER]).toBe(MODULE_TIMER);
    await after(500);
    expect(second.session.speech).toBe(
      announceTitle(restoredUnconfirmedBlock().title),
    );
    expect(
      spokenSecond.includes(LIVE_RESTORED),
      "LIVE_RESTORED spoken on an unproved store",
    ).toBe(false);
  });

  it("one landed script is partial, and it names the halves", async () => {
    // Acknowledgement 1 (Timer) lands; 2, 3 and 4 (Setup's three attempts)
    // are dropped - listed DESCENDING, see dropAcks234 and the header.
    const rig = await connected({ faults: dropAcks234("CONFIG") });
    const { store, state, session, writesOf } = rig;
    store.observeConfig(PAIR);
    await drive(store.tryOnDevice(PAIR, "Aurora"));

    expect(outcomes(store.steps)).toEqual([
      ["write-timer", "ok"],
      ["write-setup", "timeout"],
      ["restore-page-change", "sent"],
    ]);
    expect(store.steps[1].attempts).toBe(RETRY_ATTEMPTS);
    expect(writesOf("CONFIG", "EXECUTE"), "Timer once, Setup three times").toBe(
      4,
    );
    // The restore went out exactly once, after the failed step.
    const restores = store.steps.filter((s) => s.id === "restore-page-change");
    expect(restores).toHaveLength(1);
    expect(store.steps.indexOf(restores[0])).toBeGreaterThan(
      store.steps.findIndex((s) => s.outcome === "timeout"),
    );

    expect(store.phase).toBe("partial");
    expect(store.landed).toBe("Timer");
    expect(store.failed).toBe("Setup");
    expect(store.cause).toBe("timeout");
    expect(store.keepReason(true)).toBe("after-partial");
    expect(store.armed, "never armed from partial").toBe(false);
    expect(store.putBackState()).toBe("enabled");
    expect(store.lastWritten, "nothing counts as written").toBeUndefined();
    expect(state.configs[EVENT_TIMER], "the half that landed").toBe(PAIR.timer);
    expect(session.writeLock).toBe(false);
    await after(500);
    expect(session.speech).toBe(
      announceTitle(partialBlock("Timer", "Setup").title),
    );

    // The same pair again: acknowledgements 5 and 6 are past every fault.
    await drive(store.tryOnDevice(PAIR, "Aurora"));
    expect(outcomes(store.steps)).toEqual([
      ["write-timer", "ok"],
      ["write-setup", "ok"],
      ["restore-page-change", "sent"],
    ]);
    expect(store.phase).toBe("settled");
    expect(store.landed).toBeUndefined();
    expect(store.failed).toBeUndefined();
    expect(writesOf("CONFIG", "EXECUTE")).toBe(6);
  });

  it("none landed is nothing-landed - by refusal with one attempt, by timeout with three, and the timeout escalates the pacing", async () => {
    // Part one: the module refuses the Timer write. One attempt, no Setup
    // write, one restore, and no escalation - a refusal is not congestion.
    const refused = await connected({
      wrap: (inner) => (outbound, requestId) =>
        outbound.class_name === "CONFIG" &&
        outbound.class_instr === "EXECUTE" &&
        Number(outbound.class_parameters.EVENTTYPE) === EVENT_TIMER
          ? [configNackFrame({ sx: 0, sy: 0, lastheader: requestId })]
          : inner(outbound, requestId),
    });
    refused.store.observeConfig(PAIR);
    await drive(refused.store.tryOnDevice(PAIR, "Aurora"));

    expect(outcomes(refused.store.steps)).toEqual([
      ["write-timer", "nack"],
      ["restore-page-change", "sent"],
    ]);
    expect(refused.store.steps[0].attempts).toBe(1);
    expect(refused.writesOf("CONFIG", "EXECUTE")).toBe(1);
    expect(refused.store.phase).toBe("nothing-landed");
    expect(refused.store.cause).toBe("nack");
    expect(refused.store.pacingEscalated, "a NACK was seen").toBe(false);
    expect(refused.store.landed).toBeUndefined();
    expect(refused.store.keepReason(true)).toBe("never-tried");
    expect(refused.store.putBackState()).toBe("enabled");
    expect(refused.state.configs[EVENT_TIMER], "nothing changed").toBe(
      MODULE_TIMER,
    );
    await after(500);
    expect(refused.session.speech).toBe(
      announceTitle(nothingLandedBlock("try").title),
    );

    // Part two: every acknowledgement arrives later than executeMs, so the
    // Timer write times out three times with no NACK anywhere.
    const slow = await connected({
      faults: [
        {
          kind: "delay",
          match: { class_name: "CONFIG", class_instr: "ACKNOWLEDGE" },
          byMs: TIMEOUTS.executeMs + 50,
        },
      ],
    });
    const firstWrite = slow.fake.writes.length;
    const firstCallAt = clock.t;
    slow.store.observeConfig(PAIR);
    await drive(slow.store.tryOnDevice(PAIR, "Aurora"));

    expect(outcomes(slow.store.steps)).toEqual([
      ["write-timer", "timeout"],
      ["restore-page-change", "sent"],
    ]);
    expect(slow.store.steps[0].attempts).toBe(RETRY_ATTEMPTS);
    expect(slow.store.phase).toBe("nothing-landed");
    expect(slow.store.cause).toBe("timeout");
    expect(slow.store.pacingEscalated, "a timeout with zero NACKs").toBe(true);
    // Before the escalation the first frame left within one clock step of the
    // call, at PRE_SEND_DELAY_MS 0.
    expect(slow.writeAt()[firstWrite] - firstCallAt).toBeLessThan(
      DESKTOP_PRE_SEND_DELAY_MS,
    );

    // The NEXT action runs at the desktop's gap: its first frame leaves at
    // least DESKTOP_PRE_SEND_DELAY_MS after the call, on the injected clock,
    // and after the step's own sentAt.
    const nextWrite = slow.fake.writes.length;
    const callAt = clock.t;
    await drive(slow.store.tryOnDevice(PAIR, "Aurora"));
    const step = slow.store.steps.find((s) => s.id === "write-timer");
    expect(step?.sentAt).toBeDefined();
    const leftAt = slow.writeAt()[nextWrite];
    expect(leftAt - callAt).toBeGreaterThanOrEqual(DESKTOP_PRE_SEND_DELAY_MS);
    expect(leftAt - (step?.sentAt ?? Number.NaN)).toBeGreaterThanOrEqual(
      DESKTOP_PRE_SEND_DELAY_MS,
    );
    expect(slow.store.pacingEscalated).toBe(true);
  });

  it("an unplug mid-write is lost, the session keeps quiet, and a reconnect finds the record", async () => {
    // Three fetches at connect; the fourth frame is the first CONFIG/EXECUTE,
    // and the port dies under it.
    const rig = await connected({
      faults: [{ kind: "disconnect", afterTxFrames: 4 }],
    });
    const { store, session, storage } = rig;
    expect(rig.fake.writes, "the fault sits on the first write").toHaveLength(
      3,
    );
    const spoken = record(session, "speech");
    const entryBefore = pageEntry(storage, ACTIVE_PAGE);
    expect(entryBefore).toBeDefined();

    store.observeConfig(PAIR);
    await drive(store.tryOnDevice(PAIR, "Aurora"));

    expect(store.phase).toBe("lost");
    expect(store.cause).toBe("aborted");
    expect(store.steps[0].id).toBe("write-timer");
    expect(store.steps[0].outcome).toBe("aborted");
    expect(session.phase).toBe("unplugged-while-connected");
    expect(session.writeLock, "released with the leg").toBe(false);
    expect(session.unpluggedWhileWriting).toBe(true);
    expect(store.putBackState()).toBe("needs-zona");
    expect(store.confirmOpen).toBe(false);
    expect(store.snapshot, "the way back survives the unplug").toEqual(
      ORIGINAL,
    );
    await after(500);
    expect(session.speech).toBe(
      announceTitle(lostBlock(false, TRY_ON_LABEL).title),
    );
    expect(
      spoken.some((s) => s.includes("Nothing was written")),
      "the session's unplug sentence under a write",
    ).toBe(false);

    // The replug: a new port on the navigator-level event, one click, and
    // the store reads the module again - and the record it finds wins.
    const again = await rig.reconnect();
    expect(session.phase).toBe("connected");
    expect(store.phase).toBe("ready");
    expect(store.snapshot).toEqual(ORIGINAL);
    expect(store.snapshotPage).toBe(ACTIVE_PAGE);
    expect(pageEntry(storage, ACTIVE_PAGE), "the record was touched").toEqual(
      entryBefore,
    );
    expect(store.putBackState()).toBe("enabled");
    expect(again.writesOf("CONFIG", "EXECUTE"), "a write on reconnect").toBe(0);
  });

  it("on a rig the store is allowed, resolves once, and the confirmation names the others", async () => {
    const rig = await connected({
      others: [
        { sx: 1, hwcfg: EN16_HWCFG },
        { sx: 2, hwcfg: BU16_HWCFG },
      ],
    });
    const { store, session, writesOf, received } = rig;
    expect(
      session.identity?.otherModules.map((m) => [m.sx, m.moduleType]),
    ).toEqual([
      [1, "EN16"],
      [2, "BU16"],
    ]);
    await triedOn(rig);
    store.openConfirm();
    expect(store.confirmOpen, "the store is allowed on a rig").toBe(true);
    const acksBefore = received()
      .flat()
      .filter((c) => c.class_name === "PAGESTORE").length;

    await throughStore(rig, store.keepOnDevice());

    // One store on the wire, three acknowledgements back, one resolution.
    expect(writesOf("PAGESTORE", "EXECUTE")).toBe(1);
    const acks = received()
      .flat()
      .filter(
        (c) => c.class_name === "PAGESTORE" && c.class_instr === "ACKNOWLEDGE",
      );
    expect(acks.length - acksBefore, "one per module on the cable").toBe(3);
    const storeStep = store.steps.find((s) => s.id === "store");
    expect(storeStep?.attempts).toBe(1);
    expect(storeStep?.outcome).toBe("ok");
    expect(store.phase).toBe("kept");

    // SAFE-06: the confirmation names them in sx order, from the identity.
    const others = session.identity?.otherModules ?? [];
    const names = others.map((m) => m.moduleType ?? "module");
    expect(names).toEqual(["EN16", "BU16"]);
    expect(confirmRig(names)).toContain(
      "Your EN16 and BU16 are on the same cable.",
    );
  });

  it("flash only what you have heard - the confirmation closes on a knob move and a session drop, and a page change re-snapshots", async () => {
    // The four exits of the confirmation, two of them here: a knob move that
    // disarms, and the session dropping.
    const first = await connected();
    await triedOn(first);
    first.store.openConfirm();
    expect(first.store.confirmOpen).toBe(true);
    first.store.observeConfig({ setup: PAIR.setup, timer: MODULE_TIMER });
    expect(first.store.confirmOpen, "closed by the knob move").toBe(false);
    expect(first.store.armed).toBe(false);
    expect(first.store.keepReason(true)).toBe("knobs-moved");
    expect(first.store.openConfirm(), "refused while disarmed").toBeUndefined();
    expect(first.store.confirmOpen).toBe(false);
    first.store.observeConfig({ ...PAIR });
    expect(first.store.armed, "identical strings arm again").toBe(true);
    first.store.openConfirm();
    expect(first.store.confirmOpen).toBe(true);
    expect(first.writesOf("PAGESTORE", "EXECUTE"), "opening wrote").toBe(0);
    first.fire("disconnect", first.port);
    await until(() => first.session.phase !== "connected", "the unplug");
    expect(first.store.confirmOpen, "closed by the session drop").toBe(false);
    expect(first.store.phase).toBe("idle");
    expect(first.writesOf("PAGESTORE", "EXECUTE")).toBe(0);

    // A page change on the module, seen from the heartbeat, re-snapshots for
    // the new page: through snapshotting, back to ready, a second entry.
    const second = await connected();
    expect(second.store.phase).toBe("ready");
    const readyAt = second.phases.length;
    second.state.activePage = ACTIVE_PAGE + 1;
    second.push(zonaHeartbeat(ACTIVE_PAGE + 1));
    await until(
      () =>
        second.store.phase === "ready" &&
        second.store.snapshotPage === ACTIVE_PAGE + 1,
      "the re-snapshot",
    );
    expect(second.phases.slice(readyAt)).toEqual(["snapshotting", "ready"]);
    expect(second.session.identity?.activePage).toBe(ACTIVE_PAGE + 1);
    expect(second.store.snapshot).toEqual(ORIGINAL);
    expect(pageEntry(second.storage, ACTIVE_PAGE)).toBeDefined();
    expect(pageEntry(second.storage, ACTIVE_PAGE + 1)).toBeDefined();
    expect(
      second.writesOf("CONFIG", "EXECUTE"),
      "a re-snapshot is a read",
    ).toBe(0);

    // putBackState()'s no-snapshot rows. A remembered module - the record and
    // `last` pre-seeded under the state's key - whose fetch answers empty:
    // never `enabled`, because a remembered module is not a snapshot.
    const storage = mapStorage();
    const key = expectedKey();
    persistIfAbsent(
      storage.store,
      key,
      ACTIVE_PAGE,
      ORIGINAL,
      "2026-09-01T09:00:00.000Z",
    );
    rememberLast(storage.store, key);
    const third = await connected({
      storage,
      state: { activePage: ACTIVE_PAGE + 1 },
      // The serial report is held 50 ms so `snapshotting` is observable.
      faults: [
        {
          kind: "delay",
          match: { class_name: "SERIALNUMBER", class_instr: "REPORT" },
          byMs: 50,
        },
      ],
      settle: false,
    });
    expect(third.store.rememberedModule, "remembered from the record").toBe(
      true,
    );
    await until(() => third.store.phase === "snapshotting", "snapshotting");
    expect(third.session.phase).toBe("connected");
    expect(third.store.snapshot).toBeUndefined();
    expect(third.store.putBackState(), "while fetch-serial is pending").toBe(
      "absent",
    );
    await until(() => settledPhase(third.store.phase), "the snapshot to fail");
    expect(third.store.phase).toBe("snapshot-failed");
    expect(third.store.snapshot).toBeUndefined();
    expect(third.store.rememberedModule).toBe(true);
    expect(
      third.store.putBackState(),
      "a remembered module is not a snapshot",
    ).toBe("absent");
  });

  it("the slow line is a timer on the store, spoken once, and never an interval", async () => {
    // On the STORE leg: the acknowledgement is held 2500 ms - under
    // pagestoreMs 3000, so the one attempt never times out. A RAM leg cannot
    // host this: the request id is minted per attempt and the waiter armed
    // before the write (queue.ts), so a CONFIG/ACKNOWLEDGE later than
    // executeMs 250 is stale, and three attempts with the 120/240 backoff end
    // `nothing-landed` at roughly 1,110 ms - before the line could fire.
    const rig = await connected({
      faults: [
        {
          kind: "delay",
          match: { class_name: "PAGESTORE", class_instr: "ACKNOWLEDGE" },
          byMs: 2500,
        },
      ],
    });
    const { store, session } = rig;
    await triedOn(rig);
    store.openConfirm();
    const spoken = record(session, "speech");

    const finish = begin(store.keepOnDevice());
    // Let the leg arm its timer at this clock reading before any time passes.
    await settle();
    expect(store.phase).toBe("writing");
    expect(store.leg).toBe("store");
    expect(store.slow).toBe(false);

    await after(1995);
    await tick(4);
    expect(store.slow, "at 1999 ms").toBe(false);
    await tick(1);
    expect(store.slow, "at 2000 ms").toBe(true);
    expect(store.phase, "still in flight, not failed").toBe("writing");
    await after(500);
    expect(session.speech).toBe(LIVE_STILL_WRITING);

    // The acknowledgement landed at 2500; the proof then needs a heartbeat.
    await until(
      () => store.steps.some((s) => s.id === "store" && s.outcome === "ok"),
      "the delayed acknowledgement",
    );
    expect(store.steps[0].attempts).toBe(1);
    rig.heartbeat();
    await finish();

    expect(store.phase).toBe("kept");
    expect(store.slow, "cleared at settle").toBe(false);
    await after(500);
    expect(session.speech).toBe(liveKept("Aurora"));
    expect(spoken.filter((s) => s === LIVE_STILL_WRITING)).toHaveLength(1);

    // And structurally: a setTimeout on the store, zero intervals.
    const source = strip(sourceOf("./install.svelte.ts"));
    expect(source).toContain("SLOW_LINE_MS = 2000");
    expect(source).toContain(["set", "Timeout("].join(""));
    expect(source.includes(["set", "Interval"].join(""))).toBe(false);
  });

  // -------------------------------------------------------------------------
  // The fourth click: CLEAR (10-12; A-48, A-50, SAFE-03, SAFE-07).

  it("CLEAR writes the firmware's own default configuration into RAM, and nothing into flash", async () => {
    const rig = await connected();
    const { store, fake, state, session, writesOf } = rig;
    // The pad is holding HANGAR's work when the clear happens, which is the
    // only interesting starting point: a clear from `ready` would leave the
    // module's RAM looking the same either way.
    await triedOn(rig);
    const framesBefore = fake.writes.length;
    const configsBefore = writesOf("CONFIG", "EXECUTE");
    const locks = record(session, "writeLock");

    expect(store.clearEnabled(true), "a settled phase with a snapshot").toBe(
      true,
    );
    expect(store.clearReason(true)).toBeUndefined();
    await drive(store.clearToDefault());

    // A-26, ASSERTED BY CLASS RATHER THAN SAID IN COPY, and asserted FIRST so
    // that a store added to this path names the class it added rather than
    // failing on an arithmetic. The line beside the control is 41 characters
    // and does not mention the power cycle (D-21), so this enumeration is
    // where "RAM only" is held: every class the click put on the wire, and
    // PAGESTORE is not among them.
    const frames = written(fake);
    expect(
      [
        ...new Set(
          frames
            .slice(framesBefore)
            .flat()
            .map((c) => `${c.class_name}/${c.class_instr}`),
        ),
      ].sort(),
      "a clear reached a class it has no business reaching",
    ).toEqual(["CONFIG/EXECUTE", "HEARTBEAT/EXECUTE"]);
    expect(writesOf("PAGESTORE", "EXECUTE"), "a clear stored to flash").toBe(0);

    // Two CONFIG/EXECUTE carrying the two defaults VERBATIM, Timer first,
    // then the one restore heartbeat - the same three frames every RAM leg
    // produces, through the same one writer.
    expect(frames.length - framesBefore, "frames the click produced").toBe(3);
    expect(frames.slice(-3).map(shape)).toEqual(
      ramLegFrames({ setup: TOUCH_DEFAULT_SETUP, timer: TOUCH_DEFAULT_TIMER }),
    );
    expect(writesOf("CONFIG", "EXECUTE") - configsBefore).toBe(2);

    // SAFE-07: `cleared` is both acknowledgements and the restore, never a
    // resolved writer promise.
    expect(outcomes(store.steps)).toEqual([
      ["write-timer", "ok"],
      ["write-setup", "ok"],
      ["restore-page-change", "sent"],
    ]);
    expect(store.phase).toBe("cleared");
    expect(store.action).toBe("clear");
    expect(store.leg).toBe("ram");
    expect(store.cause).toBeUndefined();
    expect(state.configs[EVENT_SETUP], "the fake's RAM").toBe(
      TOUCH_DEFAULT_SETUP,
    );
    expect(state.configs[EVENT_TIMER]).toBe(TOUCH_DEFAULT_TIMER);

    // Nothing of the visitor's and nothing of HANGAR's is playing, so there is
    // nothing to arm and nothing to keep; the way back is untouched.
    expect(store.lastWritten).toBeUndefined();
    expect(store.name).toBeUndefined();
    expect(store.armed).toBe(false);
    expect(store.keepReason(true), "the closed set's own answer").toBe(
      "never-tried",
    );
    expect(store.putBackState(), "a snapshot exists by construction").toBe(
      "enabled",
    );
    expect(store.snapshot).toEqual(ORIGINAL);
    expect(locks, "the header lock closed over the leg").toEqual([true, false]);
    expect(session.writeLock).toBe(false);
    await after(500);
    expect(session.speech).toBe(LIVE_CLEARED);

    // `cleared` is in WRITABLE_PHASES: a clear after a clear is idempotent and
    // harmless, and TRY ON DEVICE works from here.
    expect(store.clearEnabled(true)).toBe(true);
    await drive(store.clearToDefault());
    expect(store.phase).toBe("cleared");
    expect(writesOf("CONFIG", "EXECUTE") - configsBefore).toBe(4);
    store.observeConfig(PAIR);
    await drive(store.tryOnDevice(PAIR, "Aurora"));
    expect(store.phase).toBe("settled");
    expect(state.configs[EVENT_SETUP]).toBe(PAIR.setup);
  });

  it("a clear whose second acknowledgement never comes is partial, never cleared", async () => {
    // Acknowledgement 1 (Timer) lands; 2, 3 and 4 (Setup's three attempts) are
    // dropped. SAFE-07's distinction, on the fourth click: the promise the
    // click returned RESOLVES, and the phase is still not `cleared`.
    const rig = await connected({ faults: dropAcks234("CONFIG") });
    const { store, state, session } = rig;

    await drive(store.clearToDefault());

    expect(outcomes(store.steps)).toEqual([
      ["write-timer", "ok"],
      ["write-setup", "timeout"],
      ["restore-page-change", "sent"],
    ]);
    expect(store.phase, "one acknowledgement is not two").toBe("partial");
    expect(store.action).toBe("clear");
    expect(store.landed).toBe("Timer");
    expect(store.failed).toBe("Setup");
    expect(store.cause).toBe("timeout");
    // A-28: the three failure states are reused rather than invented, so the
    // half-landed clear says exactly what the half-landed try-on says.
    await after(500);
    expect(session.speech).toBe(
      announceTitle(partialBlock("Timer", "Setup").title),
    );
    expect(state.configs[EVENT_TIMER], "the half that landed").toBe(
      TOUCH_DEFAULT_TIMER,
    );
    // The fault drops the ACKNOWLEDGE, not the write, so the scripted module's
    // own RAM took the Setup too - and HANGAR cannot know that. Saying
    // `partial` on what it heard rather than on what happened is the whole of
    // SAFE-07, and it is why the panel offers a retry and PUT BACK here.
    // And `partial` is writable, so the clear is one click from repeating.
    expect(store.clearEnabled(true)).toBe(true);
  });

  it("no snapshot, no clear - and the fifteen-row enablement table", async () => {
    // SAFE-03 BY CONSTRUCTION, over the one state that produces it honestly:
    // the module answers a fetch of a non-active page with an empty string,
    // canWriteBack (src/lib/protocol/write-guard.ts) refuses it, and the phase
    // is `snapshot-failed` with no snapshot in hand. CLEAR is behind that
    // guard by construction rather than by calling it - the guard's verdict is
    // the second term of clearEnabled and `capable` is the third.
    const refused = await connected({ state: { activePage: ACTIVE_PAGE + 1 } });
    expect(refused.store.phase).toBe("snapshot-failed");
    expect(refused.store.snapshot).toBeUndefined();
    const framesBefore = refused.fake.writes.length;
    const stepsBefore = refused.store.steps.length;

    expect(refused.store.clearEnabled(true)).toBe(false);
    expect(refused.store.clearReason(true)).toBe("no-snapshot");
    await drive(refused.store.clearToDefault());

    // ZERO WRITES OF ANY CLASS, not zero of the class a clear would have used.
    expect(
      refused.fake.writes.length - framesBefore,
      "a clear over an uncopied module",
    ).toBe(0);
    expect(refused.store.phase, "and it changed no phase").toBe(
      "snapshot-failed",
    );
    expect(
      refused.store.steps.length - stepsBefore,
      "it did not even read the module - unlike TRY ON DEVICE, a clear from snapshot-failed retries nothing",
    ).toBe(0);
    // DEGR-02, the browser half of the same verdict: present, disabled, with
    // its own reason.
    expect(refused.store.clearReason(false)).toBe("incapable");

    // The whole partition, over every phase the machine has. A sixteenth phase
    // added without a row here fails on the source scan below rather than
    // quietly defaulting to disabled.
    const ENABLED: InstallPhase[] = [
      "ready",
      "settled",
      "restored",
      "kept",
      "cleared",
      "partial",
      "nothing-landed",
      "unconfirmed",
      "kept-mismatch",
      "restored-unconfirmed",
    ];
    const DISABLED: InstallPhase[] = [
      "idle",
      "snapshotting",
      "writing",
      "lost",
      "snapshot-failed",
    ];
    expect(ENABLED.length + DISABLED.length, "fifteen states").toBe(15);

    const declaration = strip(sourceOf("./install.svelte.ts"));
    const union = declaration.slice(
      declaration.indexOf("export type InstallPhase"),
      declaration.indexOf("export type InstallAction"),
    );
    expect(union.length, "the union was actually read").toBeGreaterThan(100);
    expect(
      [...union.matchAll(/"([a-z-]+)"/g)].map((m) => m[1]).sort(),
      "a phase exists that this table does not have a row for",
    ).toEqual([...ENABLED, ...DISABLED].sort());

    const { store } = await connected();
    expect(store.snapshot, "the table's rig has a snapshot").toEqual(ORIGINAL);

    // THE FOUR CONTROLS IN `cleared`, because the FACTORY DEFAULT body names
    // one of them (plan 10-13). The copy rule is that no string names a
    // control that is not on the screen, and install-copy.spec.ts asserts that
    // the body names PUT BACK; this is the half that makes the pairing true -
    // in `cleared` PUT BACK is not merely present, it is ENABLED, and it is so
    // by construction rather than by coincidence, because a snapshot in hand
    // is the second term of CLEAR's own enablement rule.
    store.phase = "cleared";
    expect(
      store.putBackState(),
      "the FACTORY DEFAULT body names PUT BACK, so PUT BACK has to be live where that body renders",
    ).toBe("enabled");
    expect(
      store.keepReason(true),
      "KEEP ON DEVICE after a clear - the closed set of six answers this phase without a seventh member, because a clear leaves nothing of the visitor's on the module to keep",
    ).toBe("never-tried");
    expect(store.clearEnabled(true), "and a clear is idempotent (A-50)").toBe(
      true,
    );
    // TRY ON DEVICE has no predicate here on purpose: its enablement is the
    // component's, derived from `writing`, `snapshotting` and a missing
    // config, so `cleared` enables it by not being either of the two phases.
    // device-ui.spec.ts holds that from the other side, by asserting the
    // primary names no phase this plan added.

    for (const phase of ENABLED) {
      store.phase = phase;
      expect(store.clearEnabled(true), `${phase} should enable CLEAR`).toBe(
        true,
      );
      expect(
        store.clearReason(true),
        `${phase} named a reason`,
      ).toBeUndefined();
    }
    for (const phase of DISABLED) {
      store.phase = phase;
      expect(store.clearEnabled(true), `${phase} should disable CLEAR`).toBe(
        false,
      );
    }
    // And the snapshot term dominates the phase term: with no copy of the
    // module, not one of the fifteen enables the control.
    store.snapshot = undefined;
    for (const phase of [...ENABLED, ...DISABLED]) {
      store.phase = phase;
      expect(store.clearEnabled(true), `${phase} enabled without a copy`).toBe(
        false,
      );
      expect(store.clearReason(true)).toBe("no-snapshot");
    }
  });
});
