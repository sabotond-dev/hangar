// The install store, driven from node against a ZONA that is not there
// (D-13). Named install.spec.ts, not install.svelte.spec.ts: vite.config.ts's
// `server` project excludes `*.svelte.spec.ts`, so that name would be
// collected by nothing. Every test builds its own DeviceSession and
// InstallStore and imports no singleton. NO AGENT WRITES TO A DEVICE: every
// byte lands in FakeTransport.writes through the store's one queue, in SLOTS
// order (255/6, 255/0, 255/4, 0/6, 0/0), attributable to a named click. The
// harness: a tee over the fake (pushed heartbeats and the responder's replies
// reach the session's one callback); fake timers, the store's `now` advanced
// in step (until()); every port `connected: true`; fault lists DESCENDING by nth.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { render } from "svelte/server";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { TOUCH_LIBRARY, TOUCH_LIBRARY_TIMER } from "$lib/catalog/library";
import { overElementLine } from "$lib/sandbox/copy";
import { canonical } from "$lib/sandbox/cost";
import { landSurface, type SurfaceLanding } from "$lib/sandbox/land";
import type { Region, Surface } from "$lib/sandbox/model";
import DestinationZone from "$lib/ui/DestinationZone.svelte";
import {
  DESKTOP_PRE_SEND_DELAY_MS,
  ELEMENT_SYSTEM,
  ELEMENT_TOUCH,
  EVENT_SETUP,
  EVENT_TIMER,
  EVENT_UTILITY,
  RETRY_ATTEMPTS,
  SYSTEM_DEFAULT_SETUP,
  SYSTEM_DEFAULT_TIMER,
  SYSTEM_DEFAULT_UTILITY,
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
  SLOTS,
} from "$lib/transport";
import {
  configNackFrame,
  configReportFrame,
  heartbeatFrame,
  powerCycle,
  rigResponder,
  serialNumberReportFrame,
  zonaResponder,
  type ZonaState,
} from "../transport/fixtures/synthetic";
import {
  FIRMWARE_DEFAULT_NAME,
  KEEP_LABEL,
  LIVE_STILL_WRITING,
  announceTitle,
  confirmRig,
  keptMismatchBlock,
  liveCleared,
  liveKept,
  liveRestored,
  liveSettled,
  liveSnapshotSaved,
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
  SNAPSHOT_KEY_V2,
  SNAPSHOT_KEY_V3,
  SNAPSHOT_KEY_V4,
  type SnapshotStore,
  persistIfAbsent,
  rememberLast,
} from "./snapshot";
import { stripComments } from "../../test-support/source";

// ---------------------------------------------------------------------------
// The module, and what it holds.

const FIRMWARE = { major: 1, minor: 5, patch: 5 };
/** Deliberately not the first page, for sequence.spec.ts's reason: a constant would be caught. */
const ACTIVE_PAGE = 2;
/** What the module holds when the visitor connects: the strings the snapshot must copy. */
const MODULE_SETUP = "--[[@cb]]print(1)";
const MODULE_TIMER = "--[[@cb]]print(2)";
/**
 * What the module holds in its SYSTEM element (255/0) at connect. DELIBERATELY
 * NOT the package default: the module's page init, the tuner's and the
 * firmware's are three DIFFERENT strings in this file, so every assertion below
 * distinguishes a put-back from a clear from a try-on on the third slot as well
 * as on the pair. A module that had never been written would answer
 * SYSTEM_DEFAULT_SETUP here, and the clear test is where that string appears.
 */
const MODULE_SYSTEM = "--[[@cb]]function M()return 1 end";
/**
 * What the module holds in its SYSTEM element's Timer (255/6) at connect
 * (12.1-07) - the fourth string, on the same terms as MODULE_SYSTEM: NOT the
 * package default (SYSTEM_DEFAULT_TIMER is what a factory module answers and
 * what CLEAR writes), so a put-back, a clear and a try-on are told apart on
 * this slot too.
 */
const MODULE_SYSTEM_TIMER = "--[[@cb]]function M:tim()return 2 end";
/**
 * What the module holds in its SYSTEM element's utility slot (255/4) at
 * connect (13-17) - the fifth string, on the same terms: NOT the package's
 * page-next (SYSTEM_DEFAULT_UTILITY is what a factory module answers and what
 * CLEAR writes), so a put-back, a clear and a try-on are told apart on this
 * slot too - and this module's owner had a utility script of their own, which
 * is exactly what PUT BACK exists to give back.
 */
const MODULE_SYSTEM_UTILITY = "--[[@cb]]function M:map()return 5 end";
/** The module's original, as the five strings HANGAR copies. */
const ORIGINAL: ConfigStrings = {
  systemTimer: MODULE_SYSTEM_TIMER,
  system: MODULE_SYSTEM,
  systemUtility: MODULE_SYSTEM_UTILITY,
  setup: MODULE_SETUP,
  timer: MODULE_TIMER,
};
/** The tuner's five strings, different from the module's in all five. */
const PAIR: ConfigStrings = {
  systemTimer: "--[[@cb]]function T:tim()return 4 end",
  system: "--[[@cb]]function T()return 3 end",
  systemUtility: "--[[@cb]]function T:map()return 9 end",
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
    // The module has been written before: its page init and its system timer
    // are its own, not the package defaults, so a put-back and a clear are
    // told apart on both system slots.
    system: {
      [EVENT_SETUP]: MODULE_SYSTEM,
      [EVENT_TIMER]: MODULE_SYSTEM_TIMER,
      [EVENT_UTILITY]: MODULE_SYSTEM_UTILITY,
    },
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

/** A settled try-on of the pair: the /dev/install/ probe's TRY, which no route calls since 2026-09-16. */
async function triedOn(rig: Rig, name = "Aurora"): Promise<void> {
  rig.store.observeConfig(PAIR);
  await drive(rig.store.tryOnDevice(PAIR, name));
  expect(rig.store.phase).toBe("settled");
}

/**
 * The five firmware defaults, read through the pin: what every Store writes
 * first since 2026-09-16 (BENCH-2026-09-16.txt section 1) and what CLEAR
 * writes alone.
 */
const DEFAULTS: ConfigStrings = {
  systemTimer: SYSTEM_DEFAULT_TIMER,
  system: SYSTEM_DEFAULT_SETUP,
  systemUtility: SYSTEM_DEFAULT_UTILITY,
  setup: TOUCH_DEFAULT_SETUP,
  timer: TOUCH_DEFAULT_TIMER,
};

/**
 * One Store on ZONA of the pair, the routes' one write: the pair observed, the
 * confirmation opened, the click driven through the store leg with the
 * heartbeat fed, landing `kept`.
 */
async function storedOn(rig: Rig, name = "Aurora"): Promise<void> {
  rig.store.observeConfig(PAIR);
  rig.store.openConfirm();
  expect(rig.store.confirmOpen, "the confirmation opened").toBe(true);
  await throughStore(rig, rig.store.keepOnDevice(PAIR, name));
  expect(rig.store.phase).toBe("kept");
}

/** The step ids and outcomes, in order. */
const outcomes = (steps: readonly CaptureStep[]) =>
  steps.map((s) => [s.id, s.outcome]);

/** The one page entry under the v4 key - the only key this version writes. */
function pageEntry(storage: ReturnType<typeof mapStorage>, page: number) {
  const parsed = JSON.parse(storage.map.get(SNAPSHOT_KEY_V4) ?? "{}") as {
    modules?: Record<string, { pages: Record<string, unknown> }>;
  };
  return parsed.modules?.[expectedKey()]?.pages[String(page)];
}

/**
 * The class name, instruction and the parameters an assertion reads, for one
 * outbound frame.
 *
 * THE ELEMENT IS IN HERE SINCE 12-03, and it has to be: the system element's
 * setup and the touch element's Setup are BOTH event 0, so a shape that read
 * only EVENTTYPE would let 255/0 pass for 0/0 and the write order would be
 * unassertable at exactly the place it matters.
 */
const shape = (classes: DecodedClass[]) =>
  classes.map((c) => ({
    cls: `${c.class_name}/${c.class_instr}`,
    element: c.class_parameters.ELEMENTNUMBER,
    event: c.class_parameters.EVENTTYPE,
    action: c.class_parameters.ACTIONSTRING,
    type: c.class_parameters.TYPE,
  }));

/**
 * The RAM leg's wire shape: the system timer, the page init, the utility,
 * then Timer, then Setup, then the restore heartbeat - SIX frames since 13-17
 * (five since 12.1-07), in SLOTS order (sequence.spec.ts proves the order
 * against the list; this file restates it so a store that reordered its own
 * literal would be caught here as well as there).
 */
const ramLegFrames = (strings: ConfigStrings) => [
  [
    {
      cls: "CONFIG/EXECUTE",
      element: ELEMENT_SYSTEM,
      event: EVENT_TIMER,
      action: strings.systemTimer,
      type: undefined,
    },
  ],
  [
    {
      cls: "CONFIG/EXECUTE",
      element: ELEMENT_SYSTEM,
      event: EVENT_SETUP,
      action: strings.system,
      type: undefined,
    },
  ],
  [
    {
      cls: "CONFIG/EXECUTE",
      element: ELEMENT_SYSTEM,
      event: EVENT_UTILITY,
      action: strings.systemUtility,
      type: undefined,
    },
  ],
  [
    {
      cls: "CONFIG/EXECUTE",
      element: ELEMENT_TOUCH,
      event: EVENT_TIMER,
      action: strings.timer,
      type: undefined,
    },
  ],
  [
    {
      cls: "CONFIG/EXECUTE",
      element: ELEMENT_TOUCH,
      event: EVENT_SETUP,
      action: strings.setup,
      type: undefined,
    },
  ],
  [
    {
      cls: "HEARTBEAT/EXECUTE",
      element: undefined,
      event: undefined,
      action: undefined,
      type: 255,
    },
  ],
];

/**
 * A Store click's wire shape since 2026-09-16, EIGHTEEN frames: the five
 * defaults and the restore heartbeat (a RAM leg), the configuration's five
 * and the restore (a second RAM leg - every RAM leg restores, sequence.ts),
 * one PAGESTORE/EXECUTE, then the proof's five CONFIG/FETCH in SLOTS order.
 * The first twelve by full shape, the last six by class (a fetch carries no
 * action string).
 */
const storeClickRamFrames = (strings: ConfigStrings) => [
  ...ramLegFrames(DEFAULTS),
  ...ramLegFrames(strings),
];
const STORE_CLICK_TAIL = [
  "PAGESTORE/EXECUTE",
  "CONFIG/FETCH",
  "CONFIG/FETCH",
  "CONFIG/FETCH",
  "CONFIG/FETCH",
  "CONFIG/FETCH",
];
/** The same click as the capture reads it: eighteen steps, one per frame. */
const STORE_CLICK_STEPS: [string, string][] = [
  ["write-system-timer", "ok"],
  ["write-system", "ok"],
  ["write-system-utility", "ok"],
  ["write-timer", "ok"],
  ["write-setup", "ok"],
  ["restore-page-change", "sent"],
  ["write-system-timer", "ok"],
  ["write-system", "ok"],
  ["write-system-utility", "ok"],
  ["write-timer", "ok"],
  ["write-setup", "ok"],
  ["restore-page-change", "sent"],
  ["store", "ok"],
  ["refetch-system-timer", "ok"],
  ["refetch-system", "ok"],
  ["refetch-system-utility", "ok"],
  ["refetch-timer", "ok"],
  ["refetch-setup", "ok"],
];

/**
 * Three `nth` drops of one acknowledgement class, for three CONSECUTIVE
 * acknowledgements starting at `first` - one fault object per attempt, each
 * with its own counter, LISTED DESCENDING (see the header): dropped() returns
 * at the first due fault, so listed ascending the lowest drop starves the
 * other two of that acknowledgement, the next one finds nobody due and lands,
 * and the trace ends `settled`. A single `nth` cannot produce the trace
 * either: the request id is minted per attempt, so attempt 2's acknowledgement
 * carries a fresh id and lands.
 *
 * `first` MOVED IN 12-03, IN 12.1-07 AND AGAIN IN 13-17, AND THE NUMBER IS
 * DERIVED, NOT COPIED. A RAM leg is five writes now, so the acknowledgement
 * that carries the LAST event's first attempt is the fifth: to leave the
 * system timer, the page init, the utility and the Timer landed and lose the
 * Setup's three attempts, the drops are 5, 6 and 7. A PAGESTORE leg is still
 * one write per attempt, so
 * its callers still start at 1 or 2. The caller states which and why at each
 * site.
 */
const dropThreeAcksFrom = (class_name: string, first: number): Fault[] =>
  [first + 2, first + 1, first].map((nth) => ({
    kind: "drop" as const,
    match: { class_name, class_instr: "ACKNOWLEDGE" },
    nth,
  }));

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

    // The order is the gate: the key, then the five strings in SLOTS order -
    // the system timer, the page init, the utility, Timer, Setup (12.1-06:
    // the fetch order is the write order; 13-17: the utility third) - then
    // the page count (13-12: the enumeration, once per connection, a read) -
    // and nothing else was asked of the module.
    expect(store.steps.map((s) => s.id)).toEqual([
      "fetch-serial",
      "fetch-system-timer",
      "fetch-system",
      "fetch-system-utility",
      "fetch-timer",
      "fetch-setup",
      "fetch-page-count",
    ]);
    expect(store.steps.map((s) => s.outcome)).toEqual([
      "ok",
      "ok",
      "ok",
      "ok",
      "ok",
      "ok",
      "ok",
    ]);
    // And the enumeration is the module's answer, mirrored whole: the fake
    // answers firmware's initial count, and the store offers exactly that.
    expect(store.pages).toEqual([0, 1, 2, 3]);
    expect(store.pageReported).toBe(ACTIVE_PAGE);
    expect(store.pageRequested).toBe(ACTIVE_PAGE);
    expect(store.pageStatus).toBe("reported");
    expect(store.pageSettled()).toBe(true);

    expect(store.snapshot).toEqual(ORIGINAL);
    expect(store.snapshotFromV1, "a fresh record is v4").toBe(false);
    expect(store.snapshotFromV2, "a fresh record is v4").toBe(false);
    expect(store.snapshotFromV3, "a fresh record is v4").toBe(false);
    expect(store.snapshotPage).toBe(ACTIVE_PAGE);
    const key = expectedKey();
    expect(store.moduleId).toMatch(/^[0-9a-f]{32}$/);
    expect(store.moduleId, "the key is the serial, through moduleKeyOf").toBe(
      key,
    );
    expect(store.snapshotDurable).toBe(true);
    expect(store.rememberedModule).toBe(true);

    // The record: one module, one page, the module's own strings, and `last`.
    expect(
      storage.map.get(SNAPSHOT_KEY),
      "nothing here writes the v1 key",
    ).toBeUndefined();
    expect(
      storage.map.get(SNAPSHOT_KEY_V2),
      "nothing here writes the v2 key either (12.1-07)",
    ).toBeUndefined();
    expect(
      storage.map.get(SNAPSHOT_KEY_V3),
      "nor the v3 key (13-17)",
    ).toBeUndefined();
    const raw = storage.map.get(SNAPSHOT_KEY_V4);
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
      systemTimer: MODULE_SYSTEM_TIMER,
      system: MODULE_SYSTEM,
      systemUtility: MODULE_SYSTEM_UTILITY,
      setup: MODULE_SETUP,
      timer: MODULE_TIMER,
    });
    expect(parsed.last).toBe(key);

    // Spoken once the window closes, and NOTHING was written to the module.
    await after(500);
    expect(session.speech).toBe(liveSnapshotSaved(ACTIVE_PAGE));
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
      "fetch-system-timer",
      "fetch-system",
      "fetch-system-utility",
      "fetch-timer",
      "fetch-setup",
      "fetch-page-count",
    ]);

    // Ready all the same: the in-memory half is the rail.
    expect(store.phase).toBe("ready");
    expect(store.snapshot, "PUT BACK would still work").toEqual(ORIGINAL);
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
    expect(session.speech).toBe(
      announceTitle(snapshotFailedBlock(ACTIVE_PAGE).title),
    );

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
    ).toEqual([
      "fetch-serial",
      "fetch-system-timer",
      "fetch-system",
      "fetch-system-utility",
      "fetch-timer",
      "fetch-setup",
    ]);

    // Store on ZONA does the same (2026-09-16): armed from `snapshot-failed`
    // - the click re-reads first - the confirmation opens, the click reads
    // the module again, and writes nothing while the copy is refused.
    store.observeConfig(PAIR);
    expect(store.armed, "Store is armed from snapshot-failed").toBe(true);
    store.openConfirm();
    expect(store.confirmOpen).toBe(true);
    await drive(store.keepOnDevice(PAIR, "x"));
    expect(store.confirmOpen, "the click was taken").toBe(false);
    expect(store.phase).toBe("snapshot-failed");
    expect(
      writesOf("CONFIG", "EXECUTE"),
      "a Store over an uncopied module",
    ).toBe(0);
    expect(writesOf("PAGESTORE", "EXECUTE")).toBe(0);
    expect(
      store.steps.map((s) => s.id),
      "the Store read the module again",
    ).toEqual([
      "fetch-serial",
      "fetch-system-timer",
      "fetch-system",
      "fetch-system-utility",
      "fetch-timer",
      "fetch-setup",
    ]);

    // Fix the module - it is on the page its heartbeat reported - and retry.
    state.activePage = ACTIVE_PAGE;
    await drive(store.retrySnapshot());
    expect(store.phase).toBe("ready");
    expect(store.snapshot).toEqual(ORIGINAL);
    expect(store.snapshotPage).toBe(ACTIVE_PAGE);
    expect(store.moduleId).toBe(expectedKey());
    expect(storage.map.size, "the retry persisted the copy").toBe(1);
    expect(writesOf("CONFIG", "EXECUTE"), "the retry is a read").toBe(0);
  });

  it("nothing is written without a click, armed means Store may write, and the probe's TRY ON DEVICE writes exactly five, the system timer first and the utility third, verbatim", async () => {
    // FOUR CLICKS SINCE PLAN 10-12, THREE SINCE 2026-09-16 (Apply to ZONA
    // gone), and this assertion did not change - which is the finding rather
    // than an omission (G-06, and A-53 correcting the spec text that said
    // otherwise). The count is BY CLASS, and every click writes
    // CONFIG/EXECUTE - the class already counted - so its reach was already
    // total. What widened over the phases is InstallAction, and the compiler
    // enforces that for free.
    const { store, fake, state, session, writesOf } = await connected();
    const locks = record(session, "writeLock");

    // Knob moves: the pair arrives, twice, and nothing goes out. `armed` is
    // Store's readiness since 2026-09-16 - a session, a writable phase, the
    // page at rest, a pair inside 908 - so it is TRUE here with nothing
    // written, and the closed record names no reason.
    expect(store.armed, "nothing published yet").toBe(false);
    store.observeConfig(PAIR);
    store.observeConfig(PAIR);
    expect(writesOf("CONFIG", "EXECUTE"), "a knob move wrote").toBe(0);
    expect(writesOf("PAGESTORE", "EXECUTE"), "a knob move stored").toBe(0);
    expect(store.armed, "Store may write, and nothing has").toBe(true);
    expect(store.keepReason(true), "no reason in the record").toBeUndefined();
    expect(store.lastWritten, "nothing landed").toBeUndefined();
    // Over budget, or withdrawn while measuring, disarms; back inside, arms.
    store.observeConfig({ ...PAIR, setup: "a".repeat(909) });
    expect(store.armed, "over 908 disarms").toBe(false);
    store.observeConfig(undefined);
    expect(store.armed, "measuring disarms").toBe(false);
    store.observeConfig(PAIR);
    expect(store.armed).toBe(true);
    const framesBefore = fake.writes.length;

    await drive(store.tryOnDevice(PAIR, "Aurora"));

    // Exactly five config writes - 255/6, then 255/0, then 255/4, then 0/6,
    // then 0/0 - the strings character for character, then exactly one
    // restore heartbeat: the last SIX frames on the wire, in that order.
    expect(writesOf("CONFIG", "EXECUTE")).toBe(5);
    expect(writesOf("HEARTBEAT", "EXECUTE")).toBe(1);
    const frames = written(fake);
    expect(frames.length - framesBefore, "frames the click produced").toBe(6);
    expect(frames.slice(-6).map(shape)).toEqual(ramLegFrames(PAIR));

    // Settled means every ACK AND the restore went out (SAFE-07).
    expect(store.steps.map((s) => [s.id, s.outcome])).toEqual([
      ["write-system-timer", "ok"],
      ["write-system", "ok"],
      ["write-system-utility", "ok"],
      ["write-timer", "ok"],
      ["write-setup", "ok"],
      ["restore-page-change", "sent"],
    ]);
    expect(store.phase).toBe("settled");
    expect(store.action).toBe("try");
    expect(store.leg).toBe("ram");
    expect(store.cause).toBeUndefined();
    expect(store.lastWritten).toEqual(PAIR);
    expect(store.armed, "Store may write from settled").toBe(true);
    expect(store.name).toBe("Aurora");
    expect(state.configs[EVENT_SETUP], "the fake's RAM").toBe(PAIR.setup);
    expect(state.configs[EVENT_TIMER]).toBe(PAIR.timer);
    expect(
      state.system?.[EVENT_SETUP],
      "the fake's SECOND RAM - the page-init slot, apart from the pad's",
    ).toBe(PAIR.system);
    expect(
      state.system?.[EVENT_UTILITY],
      "and the utility slot on the same RAM (13-17)",
    ).toBe(PAIR.systemUtility);

    // The header lock closed over the leg and released with it.
    expect(locks).toEqual([true, false]);
    expect(session.writeLock).toBe(false);
    await after(500);
    expect(session.speech).toBe(liveSettled(ACTIVE_PAGE));

    // A knob move onto different strings keeps Store armed (the click writes
    // what the screen shows), and writes nothing.
    store.observeConfig({ ...PAIR, timer: MODULE_TIMER });
    expect(store.armed).toBe(true);
    store.observeConfig({ ...PAIR, system: MODULE_SYSTEM });
    expect(store.armed).toBe(true);
    store.observeConfig({ ...PAIR });
    expect(store.armed).toBe(true);
    expect(
      writesOf("CONFIG", "EXECUTE"),
      "a knob move after the click wrote",
    ).toBe(5);
  });

  it("PUT BACK writes the snapshot's strings the same way and lands restored", async () => {
    const { store, fake, state, session, writesOf } = await connected();
    store.observeConfig(PAIR);
    await drive(store.tryOnDevice(PAIR, "Aurora"));
    expect(store.phase).toBe("settled");
    expect(state.configs[EVENT_SETUP]).toBe(PAIR.setup);
    const framesBefore = fake.writes.length;

    await drive(store.putBack());

    // The SNAPSHOT's strings, not the tuner's, in the same order, one
    // restore. All FIVE go back: the system timer, the page init and the
    // utility the module had at connect are written over the ones the try-on
    // left - the owner's own utility script is back on their button.
    const frames = written(fake);
    expect(frames.length - framesBefore).toBe(6);
    expect(frames.slice(-6).map(shape)).toEqual(ramLegFrames(ORIGINAL));
    expect(writesOf("CONFIG", "EXECUTE"), "two clicks, ten writes").toBe(10);
    expect(writesOf("HEARTBEAT", "EXECUTE"), "one restore per leg").toBe(2);
    expect(store.steps.map((s) => [s.id, s.outcome])).toEqual([
      ["write-system-timer", "ok"],
      ["write-system", "ok"],
      ["write-system-utility", "ok"],
      ["write-timer", "ok"],
      ["write-setup", "ok"],
      ["restore-page-change", "sent"],
    ]);

    expect(store.phase).toBe("restored");
    expect(store.action).toBe("put-back");
    expect(store.armed, "Store may write from restored").toBe(true);
    expect(store.lastWritten).toBeUndefined();
    expect(store.name).toBeUndefined();
    expect(store.snapshot, "the way back is still there").toEqual(ORIGINAL);
    expect(session.writeLock).toBe(false);
    await after(500);
    expect(session.speech).toBe(liveRestored(ACTIVE_PAGE));

    // The module's RAM is what it was when the visitor connected - on both
    // elements.
    expect(state.configs[EVENT_SETUP]).toBe(MODULE_SETUP);
    expect(state.configs[EVENT_TIMER]).toBe(MODULE_TIMER);
    expect(state.system?.[EVENT_SETUP]).toBe(MODULE_SYSTEM);
    expect(state.system?.[EVENT_TIMER]).toBe(MODULE_SYSTEM_TIMER);
    expect(state.system?.[EVENT_UTILITY]).toBe(MODULE_SYSTEM_UTILITY);
  });

  it("an existing record wins and is never overwritten, a record from before the timer slot restores the 255/6 default and says so, and one from before the utility slot restores the 255/4 default and says so", async () => {
    // A record from an earlier visit, holding strings DIFFERENT from what the
    // module holds now - the shape a re-connect after TRY ON DEVICE produces.
    // Five strings under the v4 key (13-17).
    const RECORD: ConfigStrings = {
      systemTimer: "--[[@cb]]function R:tim()return 6 end",
      system: "--[[@cb]]function R()return 7 end",
      systemUtility: "--[[@cb]]function R:map()return 3 end",
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
      const parsed = JSON.parse(storage.map.get(SNAPSHOT_KEY_V4) ?? "{}") as {
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
    expect(store.snapshot).not.toEqual(ORIGINAL);
    expect(store.snapshotFromV1, "a v4 record read as v4").toBe(false);
    expect(store.snapshotFromV2, "a v4 record read as v4").toBe(false);
    expect(store.snapshotFromV3, "a v4 record read as v4").toBe(false);
    expect(store.snapshotDurable).toBe(true);
    expect(entryOf(), "the entry was touched (takenAt included)").toEqual(
      before,
    );

    // PUT BACK writes the record's strings - all five.
    await drive(store.putBack());
    expect(store.phase).toBe("restored");
    expect(written(fake).slice(-6).map(shape)).toEqual(ramLegFrames(RECORD));
    expect(writesOf("CONFIG", "EXECUTE")).toBe(5);
    expect(state.configs[EVENT_SETUP]).toBe(RECORD.setup);
    expect(state.configs[EVENT_TIMER]).toBe(RECORD.timer);
    expect(state.system?.[EVENT_SETUP]).toBe(RECORD.system);
    expect(state.system?.[EVENT_TIMER]).toBe(RECORD.systemTimer);
    expect(state.system?.[EVENT_UTILITY]).toBe(RECORD.systemUtility);
    expect(entryOf(), "PUT BACK touched the record").toEqual(before);

    // A RECORD FROM BEFORE THIS PHASE (12.1 D-22): a `hangar.snapshot.v2`
    // entry of three strings, written by hand as Phase 12 wrote it. The store
    // restores the firmware's 255/6 default in the slot the record lacks -
    // read from the pinned package and passed into snapshot.ts, which imports
    // nothing - and publishes `snapshotFromV2` so the substitution is never
    // silent. The v2 raw string is byte-unchanged through the connect and
    // the PUT BACK, and nothing was written under v4 for that page. Since
    // 13-17 the same record lacks the utility too, and the store restores
    // the firmware's page-next there on the same terms.
    const older = mapStorage();
    const v2 = `{"v":2,"last":"${key}","modules":{"${key}":{"pages":{"${ACTIVE_PAGE}":{"system":"${RECORD.system}","setup":"${RECORD.setup}","timer":"${RECORD.timer}","takenAt":"${TAKEN_AT}"}}}}}`;
    older.store.setItem(SNAPSHOT_KEY_V2, v2);
    const second = await connected({ storage: older });
    expect(second.store.phase).toBe("ready");
    expect(second.store.snapshot).toEqual({
      ...RECORD,
      systemTimer: SYSTEM_DEFAULT_TIMER,
      systemUtility: SYSTEM_DEFAULT_UTILITY,
    });
    expect(second.store.snapshotFromV2, "the record predates the slot").toBe(
      true,
    );
    expect(second.store.snapshotFromV1).toBe(false);
    expect(second.store.snapshotFromV3).toBe(false);
    expect(second.store.snapshotDurable, "a kept is durable").toBe(true);
    expect(older.map.get(SNAPSHOT_KEY_V2), "the v2 record moved").toBe(v2);
    expect(
      pageEntry(older, ACTIVE_PAGE),
      "a v4 entry was written beside the v2 original",
    ).toBeUndefined();
    await drive(second.store.putBack());
    expect(second.store.phase).toBe("restored");
    expect(
      second.state.system?.[EVENT_TIMER],
      "PUT BACK wrote the default",
    ).toBe(SYSTEM_DEFAULT_TIMER);
    expect(
      second.state.system?.[EVENT_UTILITY],
      "and the utility default - page-next - not the module's own",
    ).toBe(SYSTEM_DEFAULT_UTILITY);
    expect(second.state.system?.[EVENT_SETUP]).toBe(RECORD.system);
    expect(older.map.get(SNAPSHOT_KEY_V2), "still byte-unchanged").toBe(v2);

    // A RECORD FROM BEFORE 13-17: a `hangar.snapshot.v3` entry of four
    // strings, written by hand as 12.1-07 wrote it. The store restores the
    // firmware's 255/4 default - page-next, what the module's utility button
    // did before HANGAR ever wrote there - in the one slot the record lacks,
    // keeps the record's own 255/6 and 255/0, and publishes `snapshotFromV3`
    // alone. The v3 raw string is byte-unchanged through the connect and the
    // PUT BACK, and nothing was written under v4 for that page.
    const previous = mapStorage();
    const v3 = `{"v":3,"last":"${key}","modules":{"${key}":{"pages":{"${ACTIVE_PAGE}":{"systemTimer":"${RECORD.systemTimer}","system":"${RECORD.system}","setup":"${RECORD.setup}","timer":"${RECORD.timer}","takenAt":"${TAKEN_AT}"}}}}}`;
    previous.store.setItem(SNAPSHOT_KEY_V3, v3);
    const third = await connected({ storage: previous });
    expect(third.store.phase).toBe("ready");
    expect(third.store.snapshot).toEqual({
      ...RECORD,
      systemUtility: SYSTEM_DEFAULT_UTILITY,
    });
    expect(
      third.store.snapshotFromV3,
      "the record predates the utility slot",
    ).toBe(true);
    expect(third.store.snapshotFromV2).toBe(false);
    expect(third.store.snapshotFromV1).toBe(false);
    expect(third.store.snapshotDurable, "a kept is durable").toBe(true);
    expect(previous.map.get(SNAPSHOT_KEY_V3), "the v3 record moved").toBe(v3);
    expect(
      pageEntry(previous, ACTIVE_PAGE),
      "a v4 entry was written beside the v3 original",
    ).toBeUndefined();
    await drive(third.store.putBack());
    expect(third.store.phase).toBe("restored");
    expect(
      third.state.system?.[EVENT_UTILITY],
      "PUT BACK wrote the utility default",
    ).toBe(SYSTEM_DEFAULT_UTILITY);
    expect(SYSTEM_DEFAULT_UTILITY).not.toBe(MODULE_SYSTEM_UTILITY);
    expect(
      third.state.system?.[EVENT_TIMER],
      "and the record's own system timer, not a default",
    ).toBe(RECORD.systemTimer);
    expect(third.state.system?.[EVENT_SETUP]).toBe(RECORD.system);
    expect(previous.map.get(SNAPSHOT_KEY_V3), "still byte-unchanged").toBe(v3);
  });

  it("over budget, and measuring, never reach the wire", async () => {
    const { store, fake, session } = await connected();
    expect(store.phase).toBe("ready");
    const framesBefore = fake.writes.length;
    const stepsBefore = store.steps;
    expect(
      stepsBefore,
      "the serial, the five fetches and the page count",
    ).toHaveLength(7);

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
    await drive(
      store.tryOnDevice({ ...PAIR, setup: "a".repeat(909), timer: "" }, "x"),
    );
    expect(
      fake.writes.length,
      "an over-budget Setup reached the transport",
    ).toBe(framesBefore);
    expect(store.phase).toBe("ready");
    await drive(
      store.tryOnDevice({ ...PAIR, setup: "", timer: "a".repeat(909) }, "x"),
    );
    expect(
      fake.writes.length,
      "an over-budget Timer reached the transport",
    ).toBe(framesBefore);
    expect(store.phase).toBe("ready");
    // The queue was not touched: the steps are still the snapshot's own array.
    expect(store.steps, "an action started").toBe(stepsBefore);
    expect(store.steps).toHaveLength(7);
    expect(store.lastWritten).toBeUndefined();
    expect(session.writeLock).toBe(false);

    // And Store on ZONA, the routes' click: never armed over budget or while
    // measuring, so the confirmation cannot open; a click forced through a
    // confirmation that is open anyway is refused by the store on its own
    // (TUNE-05, D-10) before the queue hears of it.
    store.observeConfig({ ...PAIR, setup: "a".repeat(909) });
    expect(store.armed, "over budget").toBe(false);
    store.openConfirm();
    expect(store.confirmOpen, "the confirmation refused").toBe(false);
    store.observeConfig(undefined);
    expect(store.armed, "measuring").toBe(false);
    store.openConfirm();
    expect(store.confirmOpen).toBe(false);
    store.confirmOpen = true;
    store.armed = true;
    await drive(store.keepOnDevice({ ...PAIR, timer: "a".repeat(909) }, "x"));
    expect(fake.writes.length, "an over-budget Store reached the wire").toBe(
      framesBefore,
    );
    expect(store.confirmOpen, "the click was taken").toBe(false);
    store.confirmOpen = true;
    await drive(store.keepOnDevice(undefined, "x"));
    expect(fake.writes.length, "undefined reached the wire").toBe(framesBefore);
    expect(store.phase).toBe("ready");
    expect(store.steps).toBe(stepsBefore);
    expect(store.confirmOpen).toBe(false);
  });

  it("the file's shape: four specifiers, no raw onData, no direct write, no interval, no derived", () => {
    // Comment-stripped: the store's header legitimately names every symbol
    // these scans forbid while explaining its absence. Needles are assembled
    // from fragments so this file does not contain what it forbids.
    const source = stripComments(sourceOf("./install.svelte.ts"));
    expect(source.length, "the source was actually read").toBeGreaterThan(1000);
    expect(source, "non-vacuity: the class is there").toContain(
      "class InstallStore",
    );

    const specifiers = [...source.matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
    // FOUR since 13-12: the page target joined the two zero-import modules
    // and the session, and it imports nothing either (page-target.spec.ts
    // does not assert that; config-shape.spec.ts test 13 walks it).
    expect(specifiers, "exactly four static specifiers, these four").toEqual([
      "./install-copy",
      "./page-target",
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
    const sessionSource = stripComments(sourceOf("./session.svelte.ts"));
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

  it("a Store returns the page to its firmware default, writes the configuration, stores it, and kept is said after the acknowledgement, a heartbeat and a matching re-fetch - eighteen frames, one click", async () => {
    // THE ROUTES' ONE WRITE SINCE 2026-09-16 (BENCH-2026-09-16.txt section 1,
    // the user's word: "only Store stays. also every Store should send a
    // Clear before Storing"). No RAM audition before it: the pair is observed,
    // the confirmation opens, the click runs three legs.
    const rig = await connected();
    const { store, fake, state, session, writesOf } = rig;
    store.observeConfig(PAIR);
    expect(store.armed, "Store is armed from ready").toBe(true);
    expect(store.keepReason(true), "and the record names no reason").toBe(
      undefined,
    );
    expect(store.storedThisSession).toBe(false);
    const framesBefore = fake.writes.length;
    const locks = record(session, "writeLock");
    const spoken = record(session, "speech");

    store.openConfirm();
    expect(store.confirmOpen).toBe(true);
    const fedAt = await throughStore(rig, store.keepOnDevice(PAIR, "Aurora"));

    expect(store.confirmOpen, "the confirmation closed on the click").toBe(
      false,
    );
    // BY CLASS: two RAM legs of five, two restores, one store, one proof round
    // of five - every class the click may reach, and no other.
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
    ).toEqual([
      "CONFIG/EXECUTE",
      "CONFIG/FETCH",
      "HEARTBEAT/EXECUTE",
      "PAGESTORE/EXECUTE",
    ]);
    expect(writesOf("CONFIG", "EXECUTE"), "five defaults, five strings").toBe(
      10,
    );
    expect(writesOf("HEARTBEAT", "EXECUTE"), "one restore per RAM leg").toBe(2);
    expect(writesOf("PAGESTORE", "EXECUTE"), "one store per click").toBe(1);
    expect(
      writesOf("CONFIG", "FETCH"),
      "the snapshot's five, the proof's five",
    ).toBe(10);
    // THE SEQUENCE, frame by frame: the five defaults VERBATIM in SLOTS order
    // and the restore - the same six frames CLEAR sends - then the pair's five
    // and the restore, then the store, then the proof. Eighteen.
    const clicked = frames.slice(framesBefore).map(shape);
    expect(clicked, "frames the click produced").toHaveLength(18);
    expect(clicked.slice(0, 12)).toEqual(storeClickRamFrames(PAIR));
    expect(clicked.slice(12).map((f) => f[0].cls)).toEqual(STORE_CLICK_TAIL);
    // The capture reads the whole click: eighteen steps, `steps` reset by the
    // first leg alone.
    expect(outcomes(store.steps)).toEqual(STORE_CLICK_STEPS);

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
    expect(store.action, "one action for the whole click").toBe("keep");
    expect(store.leg, "the leg that ended").toBe("store");
    expect(store.cause).toBeUndefined();
    expect(store.storedThisSession).toBe(true);
    expect(store.refetchRounds).toBe(1);
    expect(store.lastWritten, "memory holds the pair").toEqual(PAIR);
    expect(store.name).toBe("Aurora");
    // The record's one row after a store: the module holds the pair on
    // screen, so a second click would store the same bytes. A change on
    // screen makes Store live again; `armed` itself stays true (kept is
    // writable).
    expect(store.keepReason(true)).toBe("already-kept");
    expect(store.armed).toBe(true);
    store.observeConfig({ ...PAIR, timer: MODULE_TIMER });
    expect(store.keepReason(true), "a change: the store is live").toBe(
      undefined,
    );
    store.observeConfig(PAIR);
    expect(store.keepReason(true)).toBe("already-kept");
    expect(store.slow).toBe(false);
    // RAM and flash both hold the pair on both elements; the defaults were
    // overwritten in memory before the store, so nothing of them is in flash
    // and nothing of the module's own page either.
    expect(state.configs[EVENT_SETUP], "the fake's RAM").toBe(PAIR.setup);
    expect(state.system?.[EVENT_UTILITY]).toBe(PAIR.systemUtility);
    expect(state.flash, "the fake's flash holds the pair").toEqual({
      [EVENT_SETUP]: PAIR.setup,
      [EVENT_TIMER]: PAIR.timer,
    });
    expect(
      state.systemFlash,
      "and the SECOND flash holds all three system slots - one store, both elements",
    ).toEqual({
      [EVENT_SETUP]: PAIR.system,
      [EVENT_TIMER]: PAIR.systemTimer,
      [EVENT_UTILITY]: PAIR.systemUtility,
    });
    // The header lock closed over each of the three legs.
    expect(locks).toEqual([true, false, true, false, true, false]);
    expect(session.writeLock).toBe(false);
    await after(500);
    expect(session.speech).toBe(liveKept(ACTIVE_PAGE));
    expect(
      spoken.filter((s) => s === liveKept(ACTIVE_PAGE)),
      "spoken once - not for the ACK and again for the proof",
    ).toHaveLength(1);
    expect(
      spoken.includes(liveSettled(ACTIVE_PAGE)),
      "no RAM landing is spoken inside a Store",
    ).toBe(false);
    expect(
      spoken.includes(liveCleared(ACTIVE_PAGE)),
      "nor is the reset - one click, one utterance",
    ).toBe(false);
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
        // THE ELEMENT IS PART OF THE CONDITION, and it has to be since 12-03:
        // the system element's setup is event 0 as well, so a fault matched on
        // the event alone would answer the system re-fetch with a report
        // echoing element 0 - which the system fetch's own filter refuses, so
        // the leg would TIME OUT rather than mismatch, in a test written to
        // prove mismatch handling. e2e/fake-zona.ts scopes its own
        // mismatchRefetch fault the same way and for the same reason (12-02).
        if (
          stored &&
          outbound.class_name === "CONFIG" &&
          outbound.class_instr === "FETCH" &&
          Number(p.ELEMENTNUMBER) === ELEMENT_TOUCH &&
          Number(p.EVENTTYPE) === EVENT_SETUP
        ) {
          return [
            configReportFrame({
              sx: 0,
              sy: 0,
              page: Number(p.PAGENUMBER),
              event: EVENT_SETUP,
              config: "--[[@cb]]print(9)",
              element: ELEMENT_TOUCH,
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
    store.observeConfig(PAIR);
    store.openConfirm();
    await throughStore(rig, store.keepOnDevice(PAIR, "Aurora"));

    // The two RAM legs, then exactly three rounds, each of all five events, a
    // backoff after each.
    expect(outcomes(store.steps)).toEqual([
      ...STORE_CLICK_STEPS.slice(0, 13),
      ["refetch-system-timer", "ok"],
      ["refetch-system", "ok"],
      ["refetch-system-utility", "ok"],
      ["refetch-timer", "ok"],
      ["refetch-setup", "ok"],
      ["refetch-system-timer", "ok"],
      ["refetch-system", "ok"],
      ["refetch-system-utility", "ok"],
      ["refetch-timer", "ok"],
      ["refetch-setup", "ok"],
      ["refetch-system-timer", "ok"],
      ["refetch-system", "ok"],
      ["refetch-system-utility", "ok"],
      ["refetch-timer", "ok"],
      ["refetch-setup", "ok"],
    ]);
    expect(sleeps).toEqual([
      retryBackoffMs(0),
      retryBackoffMs(1),
      retryBackoffMs(2),
    ]);
    expect(store.refetchRounds).toBe(3);

    expect(store.phase).toBe("kept-mismatch");
    expect(store.cause).toBe("mismatch");
    expect(store.storedThisSession, "not called kept").toBe(false);
    // The store is the retry: armed, no reason in the record.
    expect(store.keepReason(true)).toBeUndefined();
    expect(store.armed).toBe(true);
    expect(store.putBackState()).toBe("enabled");
    expect(session.writeLock).toBe(false);
    await after(500);
    expect(session.speech).toBe(
      announceTitle(keptMismatchBlock(ACTIVE_PAGE).title),
    );
    expect(session.speech.endsWith(".")).toBe(true);
  });

  it("a store that never acknowledges is unconfirmed, and Store on ZONA stays live", async () => {
    const rig = await connected({
      faults: [
        {
          kind: "drop",
          match: { class_name: "PAGESTORE", class_instr: "ACKNOWLEDGE" },
        },
      ],
    });
    const { store, session, writesOf } = rig;
    store.observeConfig(PAIR);
    store.openConfirm();
    const started = clock.t;
    const fedAt = await throughStore(rig, store.keepOnDevice(PAIR, "Aurora"));

    // The two RAM legs land at speed; then three bounded attempts at
    // pagestoreMs each, two backoffs between, and no heartbeat was ever
    // waited for because no acknowledgement came.
    expect(fedAt).toBeUndefined();
    expect(clock.t - started).toBeGreaterThanOrEqual(
      RETRY_ATTEMPTS * TIMEOUTS.pagestoreMs +
        retryBackoffMs(0) +
        retryBackoffMs(1),
    );
    expect(writesOf("PAGESTORE", "EXECUTE")).toBe(RETRY_ATTEMPTS);
    expect(writesOf("CONFIG", "EXECUTE"), "both RAM legs landed").toBe(10);
    expect(outcomes(store.steps)).toEqual([
      ...STORE_CLICK_STEPS.slice(0, 12),
      ["store", "timeout"],
    ]);
    expect(store.steps[12].attempts).toBe(RETRY_ATTEMPTS);

    expect(store.phase).toBe("unconfirmed");
    expect(store.cause).toBe("timeout");
    expect(store.storedThisSession).toBe(false);
    // Memory holds the pair - the block names it - so the store may be sent
    // again: armed, no reason in the record.
    expect(store.lastWritten).toEqual(PAIR);
    expect(store.name).toBe("Aurora");
    expect(store.armed).toBe(true);
    expect(store.keepReason(true)).toBeUndefined();
    expect(store.putBackState()).toBe("enabled");
    expect(store.slow, "the slow line is cleared with the leg").toBe(false);
    expect(session.writeLock).toBe(false);
    await after(500);
    expect(session.speech).toBe(
      announceTitle(unconfirmedBlock("Aurora", ACTIVE_PAGE).title),
    );

    store.openConfirm();
    expect(store.confirmOpen, "the confirmation opens again").toBe(true);
  });

  it("after a keep, PUT BACK stores too; when its store never confirms, it is restored-unconfirmed", async () => {
    // Part one: the store lands and is proved.
    const rig = await connected();
    const { store, fake, state, session, writesOf } = rig;
    await storedOn(rig);
    expect(store.phase).toBe("kept");
    const framesBefore = fake.writes.length;
    const spoken = record(session, "speech");

    await throughStore(rig, store.putBack());

    // The RAM leg with the SNAPSHOT's strings, its restore, then one
    // PAGESTORE/EXECUTE, then the re-fetch of all five. The RAM leg is SIX
    // frames now (five writes and the restore), then one PAGESTORE/EXECUTE,
    // then the re-fetch of all five: twelve in all.
    const frames = written(fake).slice(framesBefore).map(shape);
    expect(frames).toHaveLength(12);
    expect(frames.slice(0, 6)).toEqual(ramLegFrames(ORIGINAL));
    expect(frames[6][0].cls).toBe("PAGESTORE/EXECUTE");
    expect(frames.slice(7).map((f) => f[0].cls)).toEqual([
      "CONFIG/FETCH",
      "CONFIG/FETCH",
      "CONFIG/FETCH",
      "CONFIG/FETCH",
      "CONFIG/FETCH",
    ]);
    expect(outcomes(store.steps)).toEqual([
      ["write-system-timer", "ok"],
      ["write-system", "ok"],
      ["write-system-utility", "ok"],
      ["write-timer", "ok"],
      ["write-setup", "ok"],
      ["restore-page-change", "sent"],
      ["store", "ok"],
      ["refetch-system-timer", "ok"],
      ["refetch-system", "ok"],
      ["refetch-system-utility", "ok"],
      ["refetch-timer", "ok"],
      ["refetch-setup", "ok"],
    ]);
    expect(writesOf("PAGESTORE", "EXECUTE"), "one keep, one put-back").toBe(2);

    expect(store.phase).toBe("restored");
    expect(store.action).toBe("put-back");
    expect(store.leg).toBe("store");
    expect(store.storedThisSession, "cleared by a put-back that stored").toBe(
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
    expect(state.systemFlash, "and so does the second flash").toEqual({
      [EVENT_SETUP]: MODULE_SYSTEM,
      [EVENT_TIMER]: MODULE_SYSTEM_TIMER,
      [EVENT_UTILITY]: MODULE_SYSTEM_UTILITY,
    });
    await after(500);
    expect(session.speech).toBe(liveRestored(ACTIVE_PAGE));
    expect(spoken.filter((s) => s === liveRestored(ACTIVE_PAGE))).toHaveLength(
      1,
    );

    // Part two: a fresh rig whose flash never confirms the put-back's store.
    // Faults are fixed at construction, and a STORE leg is one write per
    // attempt - so this one is unmoved by 12-03: the keep takes
    // acknowledgement 1, and the put-back's three attempts are 2, 3 and 4,
    // listed DESCENDING (see dropThreeAcksFrom and the header).
    const second = await connected({
      faults: dropThreeAcksFrom("PAGESTORE", 2),
    });
    await storedOn(second);
    expect(second.store.phase).toBe("kept");
    const spokenSecond = record(second.session, "speech");

    await throughStore(second, second.store.putBack());

    expect(second.writesOf("PAGESTORE", "EXECUTE"), "1 + 3 attempts").toBe(4);
    expect(outcomes(second.store.steps)).toEqual([
      ["write-system-timer", "ok"],
      ["write-system", "ok"],
      ["write-system-utility", "ok"],
      ["write-timer", "ok"],
      ["write-setup", "ok"],
      ["restore-page-change", "sent"],
      ["store", "timeout"],
    ]);
    expect(second.store.phase).toBe("restored-unconfirmed");
    expect(second.store.cause).toBe("timeout");
    expect(
      second.store.storedThisSession,
      "still set: the store did not prove",
    ).toBe(true);
    expect(second.store.putBackState()).toBe("enabled");
    expect(second.store.keepReason(true), "the store is live").toBeUndefined();
    // RAM is the original. The fake's flash is not asserted: zonaResponder
    // stores before the fault drops its acknowledgement, so what the fake's
    // flash holds is exactly what HANGAR cannot know - the sentence I12 speaks.
    expect(second.state.configs[EVENT_SETUP]).toBe(MODULE_SETUP);
    expect(second.state.configs[EVENT_TIMER]).toBe(MODULE_TIMER);
    await after(500);
    expect(second.session.speech).toBe(
      announceTitle(restoredUnconfirmedBlock(ACTIVE_PAGE).title),
    );
    expect(
      spokenSecond.includes(liveRestored(ACTIVE_PAGE)),
      "the restored utterance spoken on an unproved store",
    ).toBe(false);
  });

  it("one landed script is partial, and it names what landed - on the probe's TRY and on a Store's second leg, whose classifier reads that leg alone", async () => {
    // A RAM LEG IS FIVE WRITES SINCE 13-17, so the drop list moved again and
    // the number is derived rather than copied: acknowledgement 1 is the
    // system timer, 2 the page init, 3 the utility and 4 the Timer - all four
    // land - and 5, 6 and 7 are the Setup's three attempts, dropped, listed
    // DESCENDING (dropThreeAcksFrom, header).
    const rig = await connected({ faults: dropThreeAcksFrom("CONFIG", 5) });
    const { store, state, session, writesOf } = rig;
    store.observeConfig(PAIR);
    await drive(store.tryOnDevice(PAIR, "Aurora"));

    expect(outcomes(store.steps)).toEqual([
      ["write-system-timer", "ok"],
      ["write-system", "ok"],
      ["write-system-utility", "ok"],
      ["write-timer", "ok"],
      ["write-setup", "timeout"],
      ["restore-page-change", "sent"],
    ]);
    expect(store.steps[4].attempts).toBe(RETRY_ATTEMPTS);
    expect(
      writesOf("CONFIG", "EXECUTE"),
      "the system timer once, the page init once, the utility once, the Timer once, the Setup three times",
    ).toBe(7);
    // The restore went out exactly once, after the failed step.
    const restores = store.steps.filter((s) => s.id === "restore-page-change");
    expect(restores).toHaveLength(1);
    expect(store.steps.indexOf(restores[0])).toBeGreaterThan(
      store.steps.findIndex((s) => s.outcome === "timeout"),
    );

    expect(store.phase).toBe("partial");
    expect(store.landed).toBe(
      "The system timer, the page init, the utility script and the Timer",
    );
    expect(store.failed).toBe("the Setup");
    expect(store.landedSlots, "the labels, off SLOTS").toEqual([
      "System timer",
      "System",
      "System utility",
      "Timer",
    ]);
    expect(store.failedSlots).toEqual(["Setup"]);
    expect(store.cause).toBe("timeout");
    expect(store.keepReason(true), "the store is the retry").toBeUndefined();
    expect(store.armed, "the store is the retry: armed from partial").toBe(
      true,
    );
    expect(store.putBackState()).toBe("enabled");
    expect(store.lastWritten, "nothing counts as written").toBeUndefined();
    expect(state.configs[EVENT_TIMER], "the Timer landed").toBe(PAIR.timer);
    expect(state.system?.[EVENT_SETUP], "and so did the page init").toBe(
      PAIR.system,
    );
    expect(state.system?.[EVENT_TIMER], "and the system timer").toBe(
      PAIR.systemTimer,
    );
    expect(state.system?.[EVENT_UTILITY], "and the utility").toBe(
      PAIR.systemUtility,
    );
    expect(session.writeLock).toBe(false);
    await after(500);
    expect(session.speech).toBe(
      announceTitle(
        partialBlock(
          "The system timer, the page init, the utility script and the Timer",
          "the Setup",
          ACTIVE_PAGE,
        ).title,
      ),
    );

    // The same set again: acknowledgements 8 to 12 are past every fault.
    await drive(store.tryOnDevice(PAIR, "Aurora"));
    expect(outcomes(store.steps)).toEqual([
      ["write-system-timer", "ok"],
      ["write-system", "ok"],
      ["write-system-utility", "ok"],
      ["write-timer", "ok"],
      ["write-setup", "ok"],
      ["restore-page-change", "sent"],
    ]);
    expect(store.phase).toBe("settled");
    expect(store.landed).toBeUndefined();
    expect(store.failed).toBeUndefined();
    expect(store.landedSlots).toEqual([]);
    expect(store.failedSlots).toEqual([]);
    expect(writesOf("CONFIG", "EXECUTE"), "7 + 5").toBe(12);

    // A STORE'S SECOND LEG (2026-09-16). The defaults leg takes
    // acknowledgements 1 to 5 and lands; the configuration leg's Setup is the
    // tenth, and its three attempts - 10, 11 and 12 - are dropped. The
    // classifier reads the SECOND leg's steps alone: had it read the click's
    // whole capture, the first leg's five `ok` writes would have counted every
    // slot as landed and indexed a sixth partial that does not exist. Nothing
    // is stored after a partial: the store leg runs only after every
    // acknowledgement, as a clear's does.
    const second = await connected({
      faults: dropThreeAcksFrom("CONFIG", 10),
    });
    second.store.observeConfig(PAIR);
    second.store.openConfirm();
    await drive(second.store.keepOnDevice(PAIR, "Aurora"));
    expect(outcomes(second.store.steps)).toEqual([
      ...STORE_CLICK_STEPS.slice(0, 6),
      ["write-system-timer", "ok"],
      ["write-system", "ok"],
      ["write-system-utility", "ok"],
      ["write-timer", "ok"],
      ["write-setup", "timeout"],
      ["restore-page-change", "sent"],
    ]);
    expect(second.store.phase).toBe("partial");
    expect(second.store.action).toBe("keep");
    expect(second.store.leg).toBe("ram");
    expect(second.store.landed).toBe(
      "The system timer, the page init, the utility script and the Timer",
    );
    expect(second.store.failed).toBe("the Setup");
    expect(second.store.landedSlots).toEqual([
      "System timer",
      "System",
      "System utility",
      "Timer",
    ]);
    expect(second.store.failedSlots).toEqual(["Setup"]);
    expect(
      second.writesOf("CONFIG", "EXECUTE"),
      "five defaults, then the pair's four once and the Setup three times",
    ).toBe(12);
    expect(
      second.writesOf("PAGESTORE", "EXECUTE"),
      "no store after a partial",
    ).toBe(0);
    expect(
      second.store.lastWritten,
      "nothing counts as written",
    ).toBeUndefined();
    expect(second.store.storedThisSession).toBe(false);
    // The store is the retry: armed, no reason in the record.
    expect(second.store.armed).toBe(true);
    expect(second.store.keepReason(true)).toBeUndefined();
    // The fake's flash is untouched: the module's own page survives a partial
    // Store, whatever memory holds.
    expect(second.state.flash?.[EVENT_SETUP]).toBe(MODULE_SETUP);
    expect(second.state.systemFlash?.[EVENT_UTILITY]).toBe(
      MODULE_SYSTEM_UTILITY,
    );
    await after(500);
    expect(second.session.speech).toBe(
      announceTitle(
        partialBlock(
          "The system timer, the page init, the utility script and the Timer",
          "the Setup",
          ACTIVE_PAGE,
        ).title,
      ),
    );
  });

  it("none landed is nothing-landed - by refusal with one attempt, by timeout with three, and the timeout escalates the pacing", async () => {
    // Part one: the module refuses the FIRST write, which since 12.1-07 is
    // the system timer (255/6; the page init since 12-03, the Timer before) -
    // so the refusal is matched on the ELEMENT, and nothing at all is
    // attempted after it. One attempt, no page init, no utility, no Timer and
    // no Setup write, one restore, and no escalation - a refusal is not
    // congestion.
    const refused = await connected({
      wrap: (inner) => (outbound, requestId) =>
        outbound.class_name === "CONFIG" &&
        outbound.class_instr === "EXECUTE" &&
        Number(outbound.class_parameters.ELEMENTNUMBER) === ELEMENT_SYSTEM
          ? [configNackFrame({ sx: 0, sy: 0, lastheader: requestId })]
          : inner(outbound, requestId),
    });
    refused.store.observeConfig(PAIR);
    await drive(refused.store.tryOnDevice(PAIR, "Aurora"));

    expect(outcomes(refused.store.steps)).toEqual([
      ["write-system-timer", "nack"],
      ["restore-page-change", "sent"],
    ]);
    expect(refused.store.steps[0].attempts).toBe(1);
    expect(refused.writesOf("CONFIG", "EXECUTE")).toBe(1);
    expect(refused.store.phase).toBe("nothing-landed");
    expect(refused.store.cause).toBe("nack");
    expect(refused.store.pacingEscalated, "a NACK was seen").toBe(false);
    expect(refused.store.landed).toBeUndefined();
    expect(
      refused.store.keepReason(true),
      "the store is the retry",
    ).toBeUndefined();
    expect(refused.store.putBackState()).toBe("enabled");
    expect(refused.state.configs[EVENT_TIMER], "nothing changed").toBe(
      MODULE_TIMER,
    );
    expect(
      refused.state.system?.[EVENT_TIMER],
      "and the system timer the refusal was aimed at is untouched",
    ).toBe(MODULE_SYSTEM_TIMER);
    expect(refused.state.system?.[EVENT_SETUP], "as is the page init").toBe(
      MODULE_SYSTEM,
    );
    expect(refused.state.system?.[EVENT_UTILITY], "and the utility").toBe(
      MODULE_SYSTEM_UTILITY,
    );
    await after(500);
    expect(refused.session.speech).toBe(
      announceTitle(nothingLandedBlock("put-back", ACTIVE_PAGE).title),
    );

    // Part two: every acknowledgement arrives later than executeMs, so the
    // FIRST write - the system timer - times out three times with no NACK
    // anywhere, and the other four are never attempted.
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
      ["write-system-timer", "timeout"],
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
    const step = slow.store.steps.find((s) => s.id === "write-system-timer");
    expect(step?.sentAt).toBeDefined();
    const leftAt = slow.writeAt()[nextWrite];
    expect(leftAt - callAt).toBeGreaterThanOrEqual(DESKTOP_PRE_SEND_DELAY_MS);
    expect(leftAt - (step?.sentAt ?? Number.NaN)).toBeGreaterThanOrEqual(
      DESKTOP_PRE_SEND_DELAY_MS,
    );
    expect(slow.store.pacingEscalated).toBe(true);
  });

  it("an unplug mid-write is lost, the session keeps quiet, and a reconnect finds the record", async () => {
    // SEVEN reads at connect since 13-17 - the serial, five fetches and the
    // page count (six since 12.1-07, five since 13-12, four since 12-03) - so
    // the eighth frame is the first CONFIG/EXECUTE, and the port dies under
    // it.
    const rig = await connected({
      faults: [{ kind: "disconnect", afterTxFrames: 8 }],
    });
    const { store, session, storage } = rig;
    expect(rig.fake.writes, "the fault sits on the first write").toHaveLength(
      7,
    );
    const spoken = record(session, "speech");
    const entryBefore = pageEntry(storage, ACTIVE_PAGE);
    expect(entryBefore).toBeDefined();

    store.observeConfig(PAIR);
    await drive(store.tryOnDevice(PAIR, "Aurora"));

    expect(store.phase).toBe("lost");
    expect(store.cause).toBe("aborted");
    expect(store.steps[0].id, "the system timer is the first write").toBe(
      "write-system-timer",
    );
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
      announceTitle(lostBlock(false, KEEP_LABEL, ACTIVE_PAGE).title),
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
    expect(store.snapshotFromV2, "a v4 record, all five its own").toBe(false);
    expect(store.snapshotFromV3, "a v4 record, all five its own").toBe(false);
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
    store.observeConfig(PAIR);
    store.openConfirm();
    expect(store.confirmOpen, "the store is allowed on a rig").toBe(true);
    const acksBefore = received()
      .flat()
      .filter((c) => c.class_name === "PAGESTORE").length;

    await throughStore(rig, store.keepOnDevice(PAIR, "Aurora"));

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

  it("flash only what you have heard - the confirmation stays open on a change inside the budget, closes when the pair is withdrawn and on a session drop, a page change re-snapshots, and the select's change is switchPage: the heartbeat then exactly one switch in that order, refused where it must be, and never parked at requested", async () => {
    // The confirmation's exits, two of them here: the pair withdrawn (over
    // budget, or measuring) - a knob move inside 908 is NOT one since
    // 2026-09-16, because the click writes what the screen shows - and the
    // session dropping.
    const first = await connected();
    first.store.observeConfig(PAIR);
    first.store.openConfirm();
    expect(first.store.confirmOpen).toBe(true);
    first.store.observeConfig({ ...PAIR, timer: MODULE_TIMER });
    expect(first.store.confirmOpen, "open across a change in budget").toBe(
      true,
    );
    expect(first.store.armed).toBe(true);
    first.store.observeConfig({ ...PAIR, timer: "a".repeat(909) });
    expect(first.store.confirmOpen, "closed by the pair going over").toBe(
      false,
    );
    expect(first.store.armed).toBe(false);
    expect(first.store.openConfirm(), "refused while disarmed").toBeUndefined();
    expect(first.store.confirmOpen).toBe(false);
    first.store.observeConfig({ ...PAIR });
    expect(first.store.armed, "inside 908 arms again").toBe(true);
    first.store.openConfirm();
    expect(first.store.confirmOpen).toBe(true);
    first.store.observeConfig(undefined);
    expect(first.store.confirmOpen, "closed by the pair withdrawn").toBe(false);
    first.store.observeConfig(PAIR);
    first.store.openConfirm();
    expect(first.store.confirmOpen).toBe(true);
    expect(first.writesOf("PAGESTORE", "EXECUTE"), "opening wrote").toBe(0);
    expect(first.writesOf("CONFIG", "EXECUTE"), "opening wrote").toBe(0);
    first.fire("disconnect", first.port);
    await until(() => first.session.phase !== "connected", "the unplug");
    expect(first.store.confirmOpen, "closed by the session drop").toBe(false);
    expect(first.store.phase).toBe("idle");
    expect(first.store.armed, "no session, not armed").toBe(false);
    expect(first.store.keepReason(true)).toBe("no-session");
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

    // THE SELECT'S CHANGE IS switchPage() (13.1-02; 13.1-CONTEXT D-05, the
    // user's word at the fourth bench): the target's request() then its
    // confirm() in ONE call, no review between them. What is proved here is
    // the wire's envelope, which D-05 did not move - the restore heartbeat
    // FIRST, then exactly one switch (grid_decode.c:717), `switching` until
    // the module's OWN report, Apply by canApply() alone - and the return:
    // true exactly when the switch left, false with nothing sent otherwise.
    const PAGE_SWITCH = ["PAGE", "ACTIVE"].join("");
    const TO = ACTIVE_PAGE + 1;
    const fourth = await connected();
    const classes = (frames: DecodedClass[][]) =>
      frames.map((f) => f.map((c) => `${c.class_name}/${c.class_instr}`));
    expect(fourth.store.pageStatus).toBe("reported");
    expect(fourth.store.applyReady).toBe(true);
    const framesAtRest = fourth.fake.writes.length;

    // The module's own page: nothing to switch to, nothing sent, false.
    expect(await fourth.store.switchPage(ACTIVE_PAGE)).toBe(false);
    expect(fourth.fake.writes.length - framesAtRest, "sent nothing").toBe(0);
    expect(fourth.store.pageStatus).toBe("reported");

    // The change: two frames, HEARTBEAT/EXECUTE then PAGEACTIVE/EXECUTE, as
    // the last two on the wire; the target is `switching`; the call resolves
    // TRUE; Apply is shut on the one condition.
    expect(await fourth.store.switchPage(TO)).toBe(true);
    expect(fourth.store.pageStatus).toBe("switching");
    expect(fourth.store.pageRequested).toBe(TO);
    expect(fourth.store.pageReported).toBe(ACTIVE_PAGE);
    expect(fourth.store.applyReady).toBe(false);
    expect(fourth.store.pageSettled()).toBe(false);
    const afterSwitch = written(fourth.fake);
    expect(afterSwitch.length - framesAtRest, "two frames left").toBe(2);
    expect(classes(afterSwitch.slice(-2))).toEqual([
      ["HEARTBEAT/EXECUTE"],
      [`${PAGE_SWITCH}/EXECUTE`],
    ]);
    expect(fourth.writesOf("CONFIG", "EXECUTE"), "no config write").toBe(0);
    expect(fourth.state.activePage, "the fake accepted the switch").toBe(TO);

    // Refused while switching: the request is refused, nothing more leaves,
    // false - and choosing the module's page while switching is refused too
    // (cancel() is a no-op in flight: the wire cannot be unsent).
    expect(await fourth.store.switchPage(ACTIVE_PAGE - 1)).toBe(false);
    expect(await fourth.store.switchPage(ACTIVE_PAGE)).toBe(false);
    expect(fourth.fake.writes.length - framesAtRest).toBe(2);
    expect(fourth.store.pageStatus).toBe("switching");

    // The ACK gate: the module's own report of the requested page ends the
    // wait, and only then is Apply live again. The store then re-snapshots
    // the new page (a read); wait for it so the next step starts at rest.
    fourth.push(zonaHeartbeat(TO));
    await until(() => fourth.store.pageStatus === "reported", "the report");
    expect(fourth.store.pageReported).toBe(TO);
    expect(fourth.store.pageRequested).toBe(TO);
    expect(fourth.store.applyReady).toBe(true);
    await until(
      () => fourth.store.phase === "ready" && fourth.store.snapshotPage === TO,
      "the re-snapshot of the new page",
    );
    expect(
      fourth.writesOf("CONFIG", "EXECUTE"),
      "a re-snapshot is a read",
    ).toBe(0);

    // Refused while writing: a leg in flight refuses the request before
    // anything is sent - false, no switch on the wire, the target at rest.
    const switchesBeforeLeg = fourth.writesOf(PAGE_SWITCH, "EXECUTE");
    fourth.store.observeConfig(PAIR);
    const finish = begin(fourth.store.tryOnDevice(PAIR, "Aurora"));
    await settle();
    expect(fourth.store.phase).toBe("writing");
    expect(await fourth.store.switchPage(ACTIVE_PAGE)).toBe(false);
    expect(fourth.store.pageStatus).toBe("reported");
    await finish();
    expect(fourth.store.phase).toBe("settled");
    expect(fourth.writesOf(PAGE_SWITCH, "EXECUTE")).toBe(switchesBeforeLeg);

    // NEVER PARKED AT `requested` (13.1-PLAN-CHECK W-04). requestPage() sets
    // the target; confirmPage() sends one microtask later, after its await on
    // the cached module. If the target is taken back inside that microtask -
    // on the site a report of the requested page or a session drop; here
    // cancelPage(), the same tick - the target's own guard refuses the send,
    // and switchPage resolves FALSE with nothing on the wire and the target
    // at `reported`, not left at `requested` with Apply disabled and no line
    // on the screen. (confirmPage's own guards re-check the leg, the phase
    // and the session, and switchPage cancels on any early return.)
    const framesBeforeRace = fourth.fake.writes.length;
    const raced = fourth.store.switchPage(ACTIVE_PAGE);
    expect(fourth.store.pageStatus, "the request opened").toBe("requested");
    fourth.store.cancelPage();
    expect(await raced).toBe(false);
    expect(fourth.store.pageStatus).toBe("reported");
    expect(fourth.store.pageRequested).toBe(TO);
    expect(fourth.fake.writes.length - framesBeforeRace, "sent nothing").toBe(
      0,
    );
    expect(fourth.store.applyReady).toBe(true);
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
    store.observeConfig(PAIR);
    store.openConfirm();
    const spoken = record(session, "speech");

    const finish = begin(store.keepOnDevice(PAIR, "Aurora"));
    // The two RAM legs land at speed under the fake; the store leg arms its
    // own timer when it starts. until() polls every STEP_MS, so the leg's
    // start is read at most 5 ms late: the line is asserted still off at
    // 1985 ms after the reading (1990 at most after the start) and on by 2005.
    await until(() => store.leg === "store", "the store leg");
    expect(store.phase).toBe("writing");
    expect(store.slow).toBe(false);

    await after(1985);
    expect(store.slow, "at most 1990 ms into the store leg").toBe(false);
    await tick(20);
    expect(store.slow, "at least 2005 ms into the store leg").toBe(true);
    expect(store.phase, "still in flight, not failed").toBe("writing");
    await after(500);
    expect(session.speech).toBe(LIVE_STILL_WRITING);

    // The acknowledgement landed at 2500; the proof then needs a heartbeat.
    await until(
      () => store.steps.some((s) => s.id === "store" && s.outcome === "ok"),
      "the delayed acknowledgement",
    );
    expect(store.steps[12].id).toBe("store");
    expect(store.steps[12].attempts).toBe(1);
    rig.heartbeat();
    await finish();

    expect(store.phase).toBe("kept");
    expect(store.slow, "cleared at settle").toBe(false);
    await after(500);
    expect(session.speech).toBe(liveKept(ACTIVE_PAGE));
    expect(spoken.filter((s) => s === LIVE_STILL_WRITING)).toHaveLength(1);

    // And structurally: a setTimeout on the store, zero intervals.
    const source = stripComments(sourceOf("./install.svelte.ts"));
    expect(source).toContain("SLOW_LINE_MS = 2000");
    expect(source).toContain(["set", "Timeout("].join(""));
    expect(source.includes(["set", "Interval"].join(""))).toBe(false);
  });

  // -------------------------------------------------------------------------
  // The fourth click: CLEAR (10-12; A-48, A-50, SAFE-03, SAFE-07).

  it("CLEAR writes the firmware's own default configuration into RAM, then stores it - ACK-gated, proved by the read-back - and only then says cleared", async () => {
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
    expect(store.storedThisSession, "nothing stored yet this session").toBe(
      false,
    );
    const fedAt = await throughStore(rig, store.clearToDefault());

    // ROUND 4C (2026-09-12), ASSERTED BY CLASS FIRST, as A-26's RAM-only
    // ruling was until this date: every class the click put on the wire.
    // The user's word - "clear should not be RAM only though!! it should be
    // like Store but with Clear!" - is the PAGESTORE in this list and the
    // CONFIG/FETCH of the proof after it. A clear that stopped at RAM again
    // would fail here by the class it lost.
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
      "a clear reached a class it has no business reaching, or lost one",
    ).toEqual([
      "CONFIG/EXECUTE",
      "CONFIG/FETCH",
      "HEARTBEAT/EXECUTE",
      "PAGESTORE/EXECUTE",
    ]);
    expect(writesOf("PAGESTORE", "EXECUTE"), "one store per clear").toBe(1);

    // THE SEQUENCE: FIVE CONFIG/EXECUTE carrying the five defaults VERBATIM,
    // in SLOTS order - the system timer first, the utility third - then the
    // one restore heartbeat (the same six frames every RAM leg produces,
    // through the same one writer), THEN one PAGESTORE/EXECUTE, THEN the
    // proof's five CONFIG/FETCH: twelve frames, the shape a put-back after a
    // keep produces. The page init is reset TOO (12-03, option A); since
    // 12.1-07 both of the system element's library slots; since 13-17 its
    // utility.
    const clicked = frames.slice(framesBefore).map(shape);
    expect(clicked, "frames the click produced").toHaveLength(12);
    expect(clicked.slice(0, 6)).toEqual(
      ramLegFrames({
        systemTimer: SYSTEM_DEFAULT_TIMER,
        system: SYSTEM_DEFAULT_SETUP,
        systemUtility: SYSTEM_DEFAULT_UTILITY,
        setup: TOUCH_DEFAULT_SETUP,
        timer: TOUCH_DEFAULT_TIMER,
      }),
    );
    expect(clicked[6][0].cls).toBe("PAGESTORE/EXECUTE");
    expect(clicked.slice(7).map((f) => f[0].cls)).toEqual([
      "CONFIG/FETCH",
      "CONFIG/FETCH",
      "CONFIG/FETCH",
      "CONFIG/FETCH",
      "CONFIG/FETCH",
    ]);
    expect(writesOf("CONFIG", "EXECUTE") - configsBefore).toBe(5);

    // SAFE-07: `cleared` is every acknowledgement, the restore, the store's
    // acknowledgement and a matching round - never a resolved writer
    // promise. `steps` is not reset between the legs, so the capture reads
    // the whole click.
    expect(outcomes(store.steps)).toEqual([
      ["write-system-timer", "ok"],
      ["write-system", "ok"],
      ["write-system-utility", "ok"],
      ["write-timer", "ok"],
      ["write-setup", "ok"],
      ["restore-page-change", "sent"],
      ["store", "ok"],
      ["refetch-system-timer", "ok"],
      ["refetch-system", "ok"],
      ["refetch-system-utility", "ok"],
      ["refetch-timer", "ok"],
      ["refetch-setup", "ok"],
    ]);
    // D-12 through Pitfall 6, on the fourth click as on the second: the
    // re-fetch went out only AFTER the heartbeat was fed.
    expect(
      fedAt,
      "a heartbeat was fed while the clear's store waited",
    ).toBeDefined();
    for (const step of store.steps.filter((s) => s.id.startsWith("refetch"))) {
      expect(
        step.sentAt,
        `${step.id} was sent before the heartbeat`,
      ).toBeGreaterThanOrEqual(fedAt ?? Number.POSITIVE_INFINITY);
    }
    expect(store.phase).toBe("cleared");
    expect(store.action).toBe("clear");
    expect(store.leg, "the second leg is the one that ended").toBe("store");
    expect(store.cause).toBeUndefined();
    expect(store.refetchRounds).toBe(1);
    expect(
      store.storedThisSession,
      "flash was written this session, so a put-back stores too (Z-04)",
    ).toBe(true);
    expect(state.configs[EVENT_SETUP], "the fake's RAM").toBe(
      TOUCH_DEFAULT_SETUP,
    );
    expect(state.configs[EVENT_TIMER]).toBe(TOUCH_DEFAULT_TIMER);
    expect(
      state.system?.[EVENT_SETUP],
      "and the page init is the firmware's own again, not HANGAR's library and not the module's",
    ).toBe(SYSTEM_DEFAULT_SETUP);
    expect(SYSTEM_DEFAULT_SETUP).not.toBe(MODULE_SYSTEM);
    expect(
      state.system?.[EVENT_TIMER],
      "and so is the system timer - the fourth default, not the module's own",
    ).toBe(SYSTEM_DEFAULT_TIMER);
    expect(SYSTEM_DEFAULT_TIMER).not.toBe(MODULE_SYSTEM_TIMER);
    expect(
      state.system?.[EVENT_UTILITY],
      "and so is the utility - page-next, the fifth default, not the module's own",
    ).toBe(SYSTEM_DEFAULT_UTILITY);
    expect(SYSTEM_DEFAULT_UTILITY).not.toBe(MODULE_SYSTEM_UTILITY);
    // THE USER'S CASE (b), CLOSED: the fake's FLASH holds the defaults too,
    // so a power-cycle brings the defaults back and not the Editor's page.
    // (On the module the store of a slot holding its own default DELETES the
    // cfg file - cfg_default_flag, grid_ui.c:398-409, :1126-1134 - which is
    // the same fact by another route; the fake models flash as bytes.)
    expect(state.flash, "the fake's flash holds the touch defaults").toEqual({
      [EVENT_SETUP]: TOUCH_DEFAULT_SETUP,
      [EVENT_TIMER]: TOUCH_DEFAULT_TIMER,
    });
    expect(
      state.systemFlash,
      "and the second flash holds the three system defaults",
    ).toEqual({
      [EVENT_SETUP]: SYSTEM_DEFAULT_SETUP,
      [EVENT_TIMER]: SYSTEM_DEFAULT_TIMER,
      [EVENT_UTILITY]: SYSTEM_DEFAULT_UTILITY,
    });

    // And the power-cycle itself, on the fake: RAM becomes flash, and what
    // comes back is the default - not the module's own, which is what came
    // back before this date (runbook row N is this on hardware).
    powerCycle(state);
    expect(state.configs[EVENT_SETUP], "after a power-cycle").toBe(
      TOUCH_DEFAULT_SETUP,
    );
    expect(state.system?.[EVENT_SETUP]).toBe(SYSTEM_DEFAULT_SETUP);
    expect(state.system?.[EVENT_UTILITY]).toBe(SYSTEM_DEFAULT_UTILITY);

    // Nothing of the visitor's and nothing of HANGAR's is playing, so there is
    // nothing to arm and nothing to keep; the way back is untouched - the
    // snapshot is the one taken at connect, and a clear takes no new one.
    expect(store.lastWritten).toBeUndefined();
    expect(store.name).toBeUndefined();
    expect(store.armed, "Store is live from cleared").toBe(true);
    expect(store.keepReason(true), "the closed set names no reason").toBe(
      undefined,
    );
    expect(store.putBackState(), "a snapshot exists by construction").toBe(
      "enabled",
    );
    expect(store.snapshot).toEqual(ORIGINAL);
    expect(
      locks,
      "the header lock closed over each leg - the RAM leg, then the store leg",
    ).toEqual([true, false, true, false]);
    expect(session.writeLock).toBe(false);
    expect(store.slow).toBe(false);
    await after(500);
    expect(session.speech).toBe(liveCleared(ACTIVE_PAGE));

    // `cleared` is in WRITABLE_PHASES: a clear after a clear is idempotent and
    // harmless - one more store, one more proof - and TRY ON DEVICE works
    // from here.
    expect(store.clearEnabled(true)).toBe(true);
    await throughStore(rig, store.clearToDefault());
    expect(store.phase).toBe("cleared");
    expect(writesOf("CONFIG", "EXECUTE") - configsBefore).toBe(10);
    expect(writesOf("PAGESTORE", "EXECUTE"), "two clears, two stores").toBe(2);
    store.observeConfig(PAIR);
    await drive(store.tryOnDevice(PAIR, "Aurora"));
    expect(store.phase).toBe("settled");
    expect(state.configs[EVENT_SETUP]).toBe(PAIR.setup);
    expect(
      state.flash?.[EVENT_SETUP],
      "an apply after a clear is RAM only, as ever: flash still holds the default",
    ).toBe(TOUCH_DEFAULT_SETUP);
  });

  it("a clear whose store is acknowledged but never reads back is kept-mismatch, never cleared", async () => {
    // The kept-mismatch fixture, on the fourth click: after the store the
    // module answers every fetch of the touch Setup with something other
    // than the default that was sent (the element in the condition, as the
    // keep's test explains). The RAM leg landed; the store was acknowledged;
    // the proof ran out. `cleared` is NOT said - the store's phase is
    // reused, block and all, because its sentence is exactly true here.
    let stored = false;
    const rig = await connected({
      wrap: (inner) => (outbound, requestId) => {
        const p = outbound.class_parameters;
        if (
          stored &&
          outbound.class_name === "CONFIG" &&
          outbound.class_instr === "FETCH" &&
          Number(p.ELEMENTNUMBER) === ELEMENT_TOUCH &&
          Number(p.EVENTTYPE) === EVENT_SETUP
        ) {
          return [
            configReportFrame({
              sx: 0,
              sy: 0,
              page: Number(p.PAGENUMBER),
              event: EVENT_SETUP,
              config: "--[[@cb]]print(9)",
              element: ELEMENT_TOUCH,
            }),
          ];
        }
        const replies = inner(outbound, requestId);
        if (outbound.class_name === "PAGESTORE") stored = true;
        return replies;
      },
      sleep: async () => {},
    });
    const { store, state, session, writesOf } = rig;
    await triedOn(rig);
    await throughStore(rig, store.clearToDefault());

    expect(outcomes(store.steps).slice(0, 7)).toEqual([
      ["write-system-timer", "ok"],
      ["write-system", "ok"],
      ["write-system-utility", "ok"],
      ["write-timer", "ok"],
      ["write-setup", "ok"],
      ["restore-page-change", "sent"],
      ["store", "ok"],
    ]);
    expect(store.refetchRounds, "three rounds, then the honest answer").toBe(3);
    expect(writesOf("PAGESTORE", "EXECUTE")).toBe(1);
    expect(
      store.phase,
      "acknowledged and read back different is not cleared",
    ).toBe("kept-mismatch");
    expect(store.action).toBe("clear");
    expect(store.cause).toBe("mismatch");
    expect(store.storedThisSession, "not called stored").toBe(false);
    expect(store.keepReason(true), "the store is the retry").toBeUndefined();
    expect(
      store.clearEnabled(true),
      "and Clear is one click from a retry",
    ).toBe(true);
    expect(state.configs[EVENT_TIMER], "the RAM leg did land").toBe(
      TOUCH_DEFAULT_TIMER,
    );
    await after(500);
    expect(session.speech).toBe(
      announceTitle(keptMismatchBlock(ACTIVE_PAGE).title),
    );
  });

  it("a clear whose store never acknowledges is unconfirmed with the firmware default named, Store on ZONA reads never-tried, and the RAM leg alone never stores", async () => {
    // Part one: the store's acknowledgement is dropped on every attempt.
    // Three bounded attempts at pagestoreMs, no heartbeat waited for, and
    // the phase is `unconfirmed` - with the block's name set to the firmware
    // default, because that is what the RAM leg left running in memory,
    // and Store on ZONA disabled for the first-apply reason (no knob moved;
    // there is nothing of the visitor's on the module to store).
    const rig = await connected({
      faults: [
        {
          kind: "drop",
          match: { class_name: "PAGESTORE", class_instr: "ACKNOWLEDGE" },
        },
      ],
    });
    const { store, state, session, writesOf } = rig;
    await triedOn(rig);
    const fedAt = await throughStore(rig, store.clearToDefault());

    expect(fedAt).toBeUndefined();
    expect(writesOf("PAGESTORE", "EXECUTE")).toBe(RETRY_ATTEMPTS);
    expect(outcomes(store.steps)).toEqual([
      ["write-system-timer", "ok"],
      ["write-system", "ok"],
      ["write-system-utility", "ok"],
      ["write-timer", "ok"],
      ["write-setup", "ok"],
      ["restore-page-change", "sent"],
      ["store", "timeout"],
    ]);
    expect(store.phase).toBe("unconfirmed");
    expect(store.action).toBe("clear");
    expect(store.cause).toBe("timeout");
    expect(store.storedThisSession).toBe(false);
    expect(store.name, "the block names what is running").toBe(
      FIRMWARE_DEFAULT_NAME,
    );
    expect(store.lastWritten).toBeUndefined();
    expect(store.armed, "Store is live from unconfirmed").toBe(true);
    expect(
      store.keepReason(true),
      "no row: the store is the retry, and nothing of the visitor's is on the module to be already kept",
    ).toBeUndefined();
    expect(store.clearEnabled(true), "Clear is the retry").toBe(true);
    expect(state.configs[EVENT_SETUP], "the RAM leg did land").toBe(
      TOUCH_DEFAULT_SETUP,
    );
    // The fault drops the ACKNOWLEDGE, not the store: the scripted module
    // took the default into flash and HANGAR cannot know that. Saying
    // `unconfirmed` on what it heard is the whole of SAFE-07 on this leg.
    expect(
      state.flash?.[EVENT_SETUP],
      "the module stored; HANGAR heard nothing",
    ).toBe(TOUCH_DEFAULT_SETUP);
    await after(500);
    expect(session.speech).toBe(
      announceTitle(unconfirmedBlock(FIRMWARE_DEFAULT_NAME, ACTIVE_PAGE).title),
    );
    // And an apply from here puts the entry's name back on the block's
    // path: the action moves, so the eighth row no longer matches.
    store.observeConfig(PAIR);
    await drive(store.tryOnDevice(PAIR, "Aurora"));
    expect(store.phase).toBe("settled");
    expect(store.name).toBe("Aurora");
    expect(store.keepReason(true)).toBeUndefined();
  });

  it("a clear whose second acknowledgement never comes is partial, never cleared", async () => {
    // Acknowledgements 1 (the system timer), 2 (the page init), 3 (the
    // utility) and 4 (the Timer) land; 5, 6 and 7 (the Setup's three
    // attempts) are dropped - the same derivation as the try-on above.
    // SAFE-07's distinction, on the fourth click: the promise the click
    // returned RESOLVES, and the phase is still not `cleared`.
    const rig = await connected({ faults: dropThreeAcksFrom("CONFIG", 5) });
    const { store, state, session } = rig;

    await drive(store.clearToDefault());

    expect(outcomes(store.steps)).toEqual([
      ["write-system-timer", "ok"],
      ["write-system", "ok"],
      ["write-system-utility", "ok"],
      ["write-timer", "ok"],
      ["write-setup", "timeout"],
      ["restore-page-change", "sent"],
    ]);
    expect(store.phase, "four acknowledgements are not five").toBe("partial");
    expect(store.action).toBe("clear");
    expect(store.leg, "the leg that failed is the RAM leg").toBe("ram");
    // ROUND 4C: a clear that did not land in memory stores NOTHING - the
    // store leg runs only after every acknowledgement, so a partial clear
    // cannot make a half-default page permanent.
    expect(
      rig.writesOf("PAGESTORE", "EXECUTE"),
      "no store after a partial",
    ).toBe(0);
    expect(store.landed).toBe(
      "The system timer, the page init, the utility script and the Timer",
    );
    expect(store.failed).toBe("the Setup");
    expect(store.cause).toBe("timeout");
    // A-28: the three failure states are reused rather than invented, so the
    // half-landed clear says exactly what the half-landed try-on says.
    await after(500);
    expect(session.speech).toBe(
      announceTitle(
        partialBlock(
          "The system timer, the page init, the utility script and the Timer",
          "the Setup",
          ACTIVE_PAGE,
        ).title,
      ),
    );
    expect(state.configs[EVENT_TIMER], "the Timer landed").toBe(
      TOUCH_DEFAULT_TIMER,
    );
    expect(state.system?.[EVENT_SETUP], "and so did the page init").toBe(
      SYSTEM_DEFAULT_SETUP,
    );
    expect(state.system?.[EVENT_TIMER], "and the system timer").toBe(
      SYSTEM_DEFAULT_TIMER,
    );
    expect(state.system?.[EVENT_UTILITY], "and the utility").toBe(
      SYSTEM_DEFAULT_UTILITY,
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

    const declaration = stripComments(sourceOf("./install.svelte.ts"));
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
      "Store on ZONA after a clear - the closed set of three names no reason, because the store is the way to put a configuration on a cleared page (2026-09-16)",
    ).toBeUndefined();
    expect(store.clearEnabled(true), "and a clear is idempotent (A-50)").toBe(
      true,
    );
    // Store on ZONA's own predicate is `armed` (#storeRefusal: the writable
    // phases plus snapshot-failed, a session, the page at rest, a pair inside
    // 908); the probe's TRY has none here on purpose - its enablement is the
    // probe's. device-ui.spec.ts holds the zone from the other side.

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

  // -------------------------------------------------------------------------
  // The third string (12-03), the fourth (12.1-07) and the fifth (13-17): the
  // order on the wire, and the classifier over five.

  it("five strings go out in the one order on every leg that writes, and the store proof reads five per round", async () => {
    // THE ORDER IS THE POINT and it is asserted by ELEMENT AND EVENT TOGETHER,
    // never by event alone: 255/0 and 0/0 are the same event number, and so
    // are 255/6 and 0/6, so a by-event assertion would let a system slot pass
    // for a touch one at exactly the site where the order matters.
    // grid_decode.c:1286-1287 runs a written body immediately, in write
    // order, so a touch Setup that called a library the page init had not yet
    // defined would raise a call of a nil value once, on the desk, and install
    // no touch callback at all - and a page init written before the system
    // timer it arms would run the firmware's debug print once (12.1-06,
    // reason three). Hence 255/6 first of all.
    const rig = await connected();
    const { store, state, fake, writesOf } = rig;

    const configOrder = () =>
      written(fake)
        .flat()
        .filter((c) => c.class_name === "CONFIG" && c.class_instr === "EXECUTE")
        .map((c) => [
          Number(c.class_parameters.ELEMENTNUMBER),
          Number(c.class_parameters.EVENTTYPE),
          String(c.class_parameters.ACTIONSTRING),
        ]);

    // TRY ON DEVICE: the tuner's five, 255/6 first, 255/4 third.
    store.observeConfig(PAIR);
    await drive(store.tryOnDevice(PAIR, "Aurora"));
    expect(store.phase).toBe("settled");
    expect(configOrder()).toEqual([
      [ELEMENT_SYSTEM, EVENT_TIMER, PAIR.systemTimer],
      [ELEMENT_SYSTEM, EVENT_SETUP, PAIR.system],
      [ELEMENT_SYSTEM, EVENT_UTILITY, PAIR.systemUtility],
      [ELEMENT_TOUCH, EVENT_TIMER, PAIR.timer],
      [ELEMENT_TOUCH, EVENT_SETUP, PAIR.setup],
    ]);
    expect(store.lastWritten).toEqual(PAIR);

    // CLEAR: the same order, the FIRMWARE'S OWN five, read through the pin
    // and never from install-copy.ts. Both elements are reset, which is what
    // keeps D-21's 41-character line literally true of every element HANGAR
    // has ever written.
    const beforeClear = writesOf("CONFIG", "EXECUTE");
    await throughStore(rig, store.clearToDefault());
    expect(store.phase).toBe("cleared");
    expect(configOrder().slice(beforeClear)).toEqual([
      [ELEMENT_SYSTEM, EVENT_TIMER, SYSTEM_DEFAULT_TIMER],
      [ELEMENT_SYSTEM, EVENT_SETUP, SYSTEM_DEFAULT_SETUP],
      [ELEMENT_SYSTEM, EVENT_UTILITY, SYSTEM_DEFAULT_UTILITY],
      [ELEMENT_TOUCH, EVENT_TIMER, TOUCH_DEFAULT_TIMER],
      [ELEMENT_TOUCH, EVENT_SETUP, TOUCH_DEFAULT_SETUP],
    ]);
    // Three DIFFERENT strings have been in the system slot in this one test:
    // the module's own at connect, the tuner's after the try-on, the
    // firmware's after the clear. Nothing above can pass by coincidence.
    const three = [MODULE_SYSTEM, PAIR.system, SYSTEM_DEFAULT_SETUP];
    expect(new Set(three).size, "three distinct page inits").toBe(3);
    expect(state.system?.[EVENT_SETUP]).toBe(SYSTEM_DEFAULT_SETUP);
    // And three different strings in the system TIMER slot, likewise.
    const timers = [
      MODULE_SYSTEM_TIMER,
      PAIR.systemTimer,
      SYSTEM_DEFAULT_TIMER,
    ];
    expect(new Set(timers).size, "three distinct system timers").toBe(3);
    expect(state.system?.[EVENT_TIMER]).toBe(SYSTEM_DEFAULT_TIMER);
    // And three different strings in the UTILITY slot, likewise (13-17).
    const utilities = [
      MODULE_SYSTEM_UTILITY,
      PAIR.systemUtility,
      SYSTEM_DEFAULT_UTILITY,
    ];
    expect(new Set(utilities).size, "three distinct utilities").toBe(3);
    expect(state.system?.[EVENT_UTILITY]).toBe(SYSTEM_DEFAULT_UTILITY);

    // A LANDING WITH NO PAGE INIT AND NO SYSTEM TIMER OF ITS OWN. From 12-03
    // until 12.1-08b that was every PRESET - the tuner published the EMPTY
    // STRING for both, because no module under src/lib/tune/ may know a
    // firmware default (ladder.spec.ts:275) - and this store substitutes its
    // own in ONE place (#systemStringOr, keyed by the event number), so the empty string can
    // never reach the wire and `armed` is computed over the SUBSTITUTED
    // values or it would never arm at all. SINCE 12.1-08b A PRESET LANDS THE
    // LIBRARY'S TWO STRINGS like every other card (12.1-CONTEXT D-26 item 2,
    // D-27; its compiled handler calls K, G and N by name) - wire-pin.spec.ts
    // test 3 pins AURORA's four frames to the exports - so 12-03's
    // CLEAR-vs-preset parity is INVERTED: a preset TRY writes the library at
    // 255/6 and 255/0, and CLEAR alone writes the firmware defaults there
    // (asserted above, and in the four-defaults test below). What this leg
    // proves now is the substitution itself, which /dev/install/'s empty
    // textareas and a caller that names none can still reach.
    // THE UTILITY IS THE LIVE CASE OF THE SAME RULE (13-17): every catalog
    // entry publishes the empty string at 255/4, and #systemStringOr substitutes
    // the firmware's page-next, so the module's utility button keeps turning
    // the page under a catalog configuration.
    const none: ConfigStrings = {
      ...PAIR,
      systemTimer: "",
      system: "",
      systemUtility: "",
    };
    const beforeNone = writesOf("CONFIG", "EXECUTE");
    store.observeConfig(none);
    await drive(store.tryOnDevice(none, "Aurora"));
    expect(store.phase).toBe("settled");
    expect(configOrder().slice(beforeNone).slice(0, 3)).toEqual([
      [ELEMENT_SYSTEM, EVENT_TIMER, SYSTEM_DEFAULT_TIMER],
      [ELEMENT_SYSTEM, EVENT_SETUP, SYSTEM_DEFAULT_SETUP],
      [ELEMENT_SYSTEM, EVENT_UTILITY, SYSTEM_DEFAULT_UTILITY],
    ]);
    expect(
      store.armed,
      "the module holds what the screen shows, through the substitution",
    ).toBe(true);
    expect(store.lastWritten?.systemTimer).toBe(SYSTEM_DEFAULT_TIMER);
    expect(store.lastWritten?.system).toBe(SYSTEM_DEFAULT_SETUP);
    expect(store.lastWritten?.systemUtility).toBe(SYSTEM_DEFAULT_UTILITY);

    // A STORE with the same landing: the substitution reaches the wire on
    // the click's SECOND leg as it did on the probe's TRY - after the five
    // defaults - and the proof, after the store, fetches FIVE per round and
    // compares five. One round, five re-fetches, in the fetcher's own order -
    // SLOTS'.
    const beforeStore = writesOf("CONFIG", "EXECUTE");
    store.openConfirm();
    await throughStore(rig, store.keepOnDevice(none, "Aurora"));
    expect(store.phase).toBe("kept");
    expect(configOrder().slice(beforeStore)).toEqual([
      [ELEMENT_SYSTEM, EVENT_TIMER, SYSTEM_DEFAULT_TIMER],
      [ELEMENT_SYSTEM, EVENT_SETUP, SYSTEM_DEFAULT_SETUP],
      [ELEMENT_SYSTEM, EVENT_UTILITY, SYSTEM_DEFAULT_UTILITY],
      [ELEMENT_TOUCH, EVENT_TIMER, TOUCH_DEFAULT_TIMER],
      [ELEMENT_TOUCH, EVENT_SETUP, TOUCH_DEFAULT_SETUP],
      [ELEMENT_SYSTEM, EVENT_TIMER, SYSTEM_DEFAULT_TIMER],
      [ELEMENT_SYSTEM, EVENT_SETUP, SYSTEM_DEFAULT_SETUP],
      [ELEMENT_SYSTEM, EVENT_UTILITY, SYSTEM_DEFAULT_UTILITY],
      [ELEMENT_TOUCH, EVENT_TIMER, none.timer],
      [ELEMENT_TOUCH, EVENT_SETUP, none.setup],
    ]);
    expect(store.lastWritten?.system, "substituted, never empty").toBe(
      SYSTEM_DEFAULT_SETUP,
    );
    expect(
      store.keepReason(true),
      "the module holds what the screen shows",
    ).toBe("already-kept");
    expect(store.refetchRounds).toBe(1);
    expect(
      store.steps.filter((s) => s.id.startsWith("refetch")).map((s) => s.id),
    ).toEqual([
      "refetch-system-timer",
      "refetch-system",
      "refetch-system-utility",
      "refetch-timer",
      "refetch-setup",
    ]);
  });

  it("a partial names which of the five landed on a Store's second leg, and the partial that cannot happen does not", async () => {
    // THE WRITER IS SEQUENTIAL AND ABORTS ON THE FIRST FAILURE, in SLOTS'
    // order - the system timer, the page init, the utility, the Timer, the
    // Setup - so exactly five outcomes exist and this test walks all five by
    // refusing a different write in each. The sixth conceivable state, "a later slot
    // landed and an earlier one did not" (12-03's "the Setup landed and the
    // page init did not", one slot wider; 12-RESEARCH Pitfall 6), is
    // UNREACHABLE with this writer, and the classifier's comment says so; the
    // assertion at the end is the one a reader looking for that state will
    // find. The labels are asserted against SLOTS itself, not against a copy
    // of the list kept here. SINCE 2026-09-16 THE WALK IS A STORE'S: the click
    // writes the five defaults first (writes 1 to 5, all landing), so the
    // refused write is the nth of the configuration's leg - the (5 + n)th on
    // the wire - and the slots the refusal stopped hold the DEFAULTS, not the
    // module's own.
    const refuseNth = async (nth: number) => {
      let seen = 0;
      const rig = await connected({
        wrap: (inner) => (outbound, requestId) => {
          const isWrite =
            outbound.class_name === "CONFIG" &&
            outbound.class_instr === "EXECUTE";
          if (isWrite && ++seen === 5 + nth) {
            return [configNackFrame({ sx: 0, sy: 0, lastheader: requestId })];
          }
          return inner(outbound, requestId);
        },
      });
      rig.store.observeConfig(PAIR);
      rig.store.openConfirm();
      await drive(rig.store.keepOnDevice(PAIR, "Aurora"));
      expect(rig.writesOf("PAGESTORE", "EXECUTE"), "no store after").toBe(0);
      return rig;
    };
    const labels = SLOTS.map((s) => s.label);
    /** The second leg's steps: the capture holds the defaults' six first. */
    const legOutcomes = (rig: Rig) => outcomes(rig.store.steps).slice(6);
    // 1. The Setup refused after four OKs: all but the Setup landed.
    const lastRefused = await refuseNth(5);
    expect(lastRefused.store.phase).toBe("partial");
    expect(lastRefused.store.cause).toBe("nack");
    expect(lastRefused.store.landed).toBe(
      "The system timer, the page init, the utility script and the Timer",
    );
    expect(lastRefused.store.failed).toBe("the Setup");
    expect(lastRefused.store.landedSlots).toEqual(labels.slice(0, 4));
    expect(lastRefused.store.failedSlots).toEqual(labels.slice(4));
    expect(legOutcomes(lastRefused)).toEqual([
      ["write-system-timer", "ok"],
      ["write-system", "ok"],
      ["write-system-utility", "ok"],
      ["write-timer", "ok"],
      ["write-setup", "nack"],
      ["restore-page-change", "sent"],
    ]);
    expect(lastRefused.state.system?.[EVENT_TIMER]).toBe(PAIR.systemTimer);
    expect(lastRefused.state.system?.[EVENT_SETUP]).toBe(PAIR.system);
    expect(lastRefused.state.system?.[EVENT_UTILITY]).toBe(PAIR.systemUtility);
    expect(lastRefused.state.configs[EVENT_TIMER]).toBe(PAIR.timer);
    expect(
      lastRefused.state.configs[EVENT_SETUP],
      "the refused Setup never reached the module: the default the first leg wrote is still there",
    ).toBe(TOUCH_DEFAULT_SETUP);
    await after(500);
    expect(lastRefused.session.speech).toBe(
      announceTitle(
        partialBlock(
          "The system timer, the page init, the utility script and the Timer",
          "the Setup",
          ACTIVE_PAGE,
        ).title,
      ),
    );

    // 2. The Timer refused after three OKs: the three system slots landed.
    const timerRefused = await refuseNth(4);
    expect(timerRefused.store.phase).toBe("partial");
    expect(timerRefused.store.landed).toBe(
      "The system timer, the page init and the utility script",
    );
    expect(timerRefused.store.failed).toBe("the Timer and the Setup");
    expect(timerRefused.store.landedSlots).toEqual(labels.slice(0, 3));
    expect(timerRefused.store.failedSlots).toEqual(labels.slice(3));
    expect(legOutcomes(timerRefused)).toEqual([
      ["write-system-timer", "ok"],
      ["write-system", "ok"],
      ["write-system-utility", "ok"],
      ["write-timer", "nack"],
      ["restore-page-change", "sent"],
    ]);
    expect(timerRefused.state.system?.[EVENT_TIMER]).toBe(PAIR.systemTimer);
    expect(timerRefused.state.system?.[EVENT_SETUP]).toBe(PAIR.system);
    expect(timerRefused.state.system?.[EVENT_UTILITY]).toBe(PAIR.systemUtility);
    expect(timerRefused.state.configs[EVENT_TIMER]).toBe(TOUCH_DEFAULT_TIMER);
    expect(timerRefused.state.configs[EVENT_SETUP]).toBe(TOUCH_DEFAULT_SETUP);

    // 3. The utility refused after two OKs: the two library halves landed -
    // the partial 13-17 adds, and the pairing the closed unions gained for
    // it. The module's own utility script is untouched.
    const utilityRefused = await refuseNth(3);
    expect(utilityRefused.store.phase).toBe("partial");
    expect(utilityRefused.store.landed).toBe(
      "The system timer and the page init",
    );
    expect(utilityRefused.store.failed).toBe(
      "the utility script, the Timer and the Setup",
    );
    expect(utilityRefused.store.landedSlots).toEqual(labels.slice(0, 2));
    expect(utilityRefused.store.failedSlots).toEqual(labels.slice(2));
    expect(legOutcomes(utilityRefused)).toEqual([
      ["write-system-timer", "ok"],
      ["write-system", "ok"],
      ["write-system-utility", "nack"],
      ["restore-page-change", "sent"],
    ]);
    expect(utilityRefused.state.system?.[EVENT_TIMER]).toBe(PAIR.systemTimer);
    expect(utilityRefused.state.system?.[EVENT_SETUP]).toBe(PAIR.system);
    expect(utilityRefused.state.system?.[EVENT_UTILITY]).toBe(
      SYSTEM_DEFAULT_UTILITY,
    );
    expect(utilityRefused.state.configs[EVENT_TIMER]).toBe(TOUCH_DEFAULT_TIMER);
    expect(utilityRefused.state.configs[EVENT_SETUP]).toBe(TOUCH_DEFAULT_SETUP);

    // 4. The page init refused after one OK: the system timer landed, and
    // only it - the partial 12.1-07 added, and the one pairing the closed
    // unions in install-copy.ts gained for it.
    const systemRefused = await refuseNth(2);
    expect(systemRefused.store.phase).toBe("partial");
    expect(systemRefused.store.landed).toBe("The system timer");
    expect(systemRefused.store.failed).toBe(
      "the page init, the utility script, the Timer and the Setup",
    );
    expect(systemRefused.store.landedSlots).toEqual(labels.slice(0, 1));
    expect(systemRefused.store.failedSlots).toEqual(labels.slice(1));
    expect(legOutcomes(systemRefused)).toEqual([
      ["write-system-timer", "ok"],
      ["write-system", "nack"],
      ["restore-page-change", "sent"],
    ]);
    expect(systemRefused.state.system?.[EVENT_TIMER]).toBe(PAIR.systemTimer);
    expect(systemRefused.state.system?.[EVENT_SETUP]).toBe(
      SYSTEM_DEFAULT_SETUP,
    );
    expect(systemRefused.state.system?.[EVENT_UTILITY]).toBe(
      SYSTEM_DEFAULT_UTILITY,
    );
    expect(systemRefused.state.configs[EVENT_TIMER]).toBe(TOUCH_DEFAULT_TIMER);
    expect(systemRefused.state.configs[EVENT_SETUP]).toBe(TOUCH_DEFAULT_SETUP);
    await after(500);
    expect(systemRefused.session.speech).toBe(
      announceTitle(
        partialBlock(
          "The system timer",
          "the page init, the utility script, the Timer and the Setup",
          ACTIVE_PAGE,
        ).title,
      ),
    );

    // 5. The system timer refused: NOTHING landed, and the four writes after
    // it were never attempted. This is the row that makes the unreachable
    // partial unreachable - the write that would have to fail first is the
    // one that goes first.
    const firstRefused = await refuseNth(1);
    expect(firstRefused.store.phase).toBe("nothing-landed");
    expect(firstRefused.store.landed).toBeUndefined();
    expect(firstRefused.store.failed).toBeUndefined();
    expect(firstRefused.store.landedSlots).toEqual([]);
    expect(firstRefused.store.failedSlots).toEqual([]);
    expect(legOutcomes(firstRefused)).toEqual([
      ["write-system-timer", "nack"],
      ["restore-page-change", "sent"],
    ]);
    expect(
      firstRefused.writesOf("CONFIG", "EXECUTE"),
      "the five defaults and the one refused write",
    ).toBe(6);
    expect(firstRefused.state.system?.[EVENT_TIMER]).toBe(SYSTEM_DEFAULT_TIMER);
    expect(firstRefused.state.system?.[EVENT_SETUP]).toBe(SYSTEM_DEFAULT_SETUP);
    expect(firstRefused.state.system?.[EVENT_UTILITY]).toBe(
      SYSTEM_DEFAULT_UTILITY,
    );
    expect(firstRefused.state.configs[EVENT_SETUP]).toBe(TOUCH_DEFAULT_SETUP);

    // The unreachable state, asserted as unreachable over all five runs and
    // stated on the LIST: what the module holds of the tuner's, read back
    // slot by slot in SLOTS order, is always a prefix of SLOTS. A later slot
    // holding the tuner's string while an earlier one does not - a touch
    // Setup against a page init that did not land, a page init arming a
    // system timer that did not - is the state the writer cannot produce.
    for (const rig of [
      lastRefused,
      timerRefused,
      utilityRefused,
      systemRefused,
      firstRefused,
    ]) {
      const holds = SLOTS.map((slot) =>
        slot.element === ELEMENT_SYSTEM
          ? rig.state.system?.[slot.event] === PAIR[slot.key]
          : rig.state.configs[slot.event] === PAIR[slot.key],
      );
      const firstMiss = holds.indexOf(false);
      expect(
        firstMiss === -1 || holds.slice(firstMiss).every((h) => !h),
        `a later slot landed and an earlier one did not: ${holds.join(",")} - the writer cannot produce this`,
      ).toBe(true);
      // And the classifier's lists are that same prefix, read off the steps.
      expect(rig.store.landedSlots).toEqual(
        labels.slice(0, firstMiss === -1 ? labels.length : firstMiss),
      );
    }
  });

  it("CLEAR writes five defaults and PUT BACK five originals in SLOTS order, the classifier reads the first, the third and the fourth write, and the phase list is 13-12's", async () => {
    // THE FOURTH STRING, END TO END (12.1-07, SAFE-03 / SAFE-05 / SAFE-07),
    // AND THE FIFTH (13-17):
    // one test that reads the write order OFF THE LIST rather than from a
    // literal of its own, so a slot added to SLOTS moves this assertion
    // without a line here - and a store that wrote its own order would fail
    // it by name.
    const rig = await connected();
    const { store, state, fake } = rig;
    const configFrames = (from: number) =>
      written(fake)
        .slice(from)
        .flat()
        .filter((c) => c.class_name === "CONFIG" && c.class_instr === "EXECUTE")
        .map((c) => ({
          element: Number(c.class_parameters.ELEMENTNUMBER),
          event: Number(c.class_parameters.EVENTTYPE),
          action: String(c.class_parameters.ACTIONSTRING),
        }));
    const inSlotOrder = (strings: ConfigStrings) =>
      SLOTS.map((slot) => ({
        element: slot.element,
        event: slot.event,
        action: strings[slot.key],
      }));

    // CLEAR: the five firmware defaults, read through the pin, one per slot.
    const defaults: ConfigStrings = {
      systemTimer: SYSTEM_DEFAULT_TIMER,
      system: SYSTEM_DEFAULT_SETUP,
      systemUtility: SYSTEM_DEFAULT_UTILITY,
      setup: TOUCH_DEFAULT_SETUP,
      timer: TOUCH_DEFAULT_TIMER,
    };
    let from = fake.writes.length;
    await throughStore(rig, store.clearToDefault());
    expect(store.phase).toBe("cleared");
    expect(configFrames(from)).toEqual(inSlotOrder(defaults));
    // Round 4c: the five writes, the restore, then the store and its proof -
    // the refetch ids read off the list as the write ids are.
    expect(store.steps.map((s) => s.id)).toEqual([
      ...SLOTS.map((s) => s.write),
      "restore-page-change",
      "store",
      ...SLOTS.map((s) => `refetch-${s.write.slice("write-".length)}`),
    ]);
    expect(state.system?.[EVENT_TIMER], "255/6 is the 22-character print").toBe(
      SYSTEM_DEFAULT_TIMER,
    );
    expect(SYSTEM_DEFAULT_TIMER).toHaveLength(22);
    expect(
      state.system?.[EVENT_UTILITY],
      "255/4 is the 19-character page-next",
    ).toBe(SYSTEM_DEFAULT_UTILITY);
    expect(SYSTEM_DEFAULT_UTILITY).toHaveLength(19);

    // PUT BACK: the five snapshotted originals, the same order - and,
    // because the clear STORED this session (Z-04, storedThisSession), a store
    // leg after them, so the owner's flash holds their original again.
    from = fake.writes.length;
    await throughStore(rig, store.putBack());
    expect(store.phase).toBe("restored");
    expect(configFrames(from)).toEqual(inSlotOrder(ORIGINAL));
    expect(state.flash?.[EVENT_SETUP], "flash holds the original again").toBe(
      MODULE_SETUP,
    );
    expect(store.storedThisSession).toBe(false);
    expect(state.system?.[EVENT_TIMER]).toBe(MODULE_SYSTEM_TIMER);
    expect(state.system?.[EVENT_SETUP]).toBe(MODULE_SYSTEM);
    expect(state.system?.[EVENT_UTILITY]).toBe(MODULE_SYSTEM_UTILITY);
    expect(state.configs[EVENT_TIMER]).toBe(MODULE_TIMER);
    expect(state.configs[EVENT_SETUP]).toBe(MODULE_SETUP);

    // THE CLASSIFIER, on the first write, the third and the fourth, by a
    // scripted NACK matched on ELEMENT AND EVENT - the five slots share three
    // event numbers, so a by-event match would hit the wrong one.
    const refuse = async (element: number, event: number) => {
      const r = await connected({
        wrap: (inner) => (outbound, requestId) => {
          const p = outbound.class_parameters;
          if (
            outbound.class_name === "CONFIG" &&
            outbound.class_instr === "EXECUTE" &&
            Number(p.ELEMENTNUMBER) === element &&
            Number(p.EVENTTYPE) === event
          ) {
            return [configNackFrame({ sx: 0, sy: 0, lastheader: requestId })];
          }
          return inner(outbound, requestId);
        },
      });
      r.store.observeConfig(PAIR);
      await drive(r.store.tryOnDevice(PAIR, "Aurora"));
      return r;
    };
    const first = await refuse(SLOTS[0].element, SLOTS[0].event);
    expect(SLOTS[0], "the first slot is 255/6").toMatchObject({
      element: ELEMENT_SYSTEM,
      event: EVENT_TIMER,
    });
    expect(first.store.phase).toBe("nothing-landed");
    expect(first.store.landedSlots).toEqual([]);
    expect(first.writesOf("CONFIG", "EXECUTE"), "one attempt, no more").toBe(1);

    const third = await refuse(SLOTS[2].element, SLOTS[2].event);
    expect(SLOTS[2], "the third slot is 255/4").toMatchObject({
      element: ELEMENT_SYSTEM,
      event: EVENT_UTILITY,
    });
    expect(third.store.phase).toBe("partial");
    expect(third.store.landedSlots).toEqual(["System timer", "System"]);
    expect(third.store.failedSlots).toEqual([
      "System utility",
      "Timer",
      "Setup",
    ]);
    expect(third.store.landed).toBe("The system timer and the page init");
    expect(third.store.failed).toBe(
      "the utility script, the Timer and the Setup",
    );

    const fourth = await refuse(SLOTS[3].element, SLOTS[3].event);
    expect(fourth.store.phase).toBe("partial");
    expect(fourth.store.landedSlots).toEqual([
      "System timer",
      "System",
      "System utility",
    ]);
    expect(fourth.store.failedSlots).toEqual(["Timer", "Setup"]);
    expect(fourth.store.landed).toBe(
      "The system timer, the page init and the utility script",
    );
    expect(fourth.store.failed).toBe("the Timer and the Setup");

    // 13-12'S STATES ARE UNTOUCHED: WRITABLE_PHASES is byte-identical to the
    // list as 13-12 left it (read from HEAD 98e3868 at this plan's start and
    // pinned here as text), and the fifteen-phase union still has fifteen.
    const source = sourceOf("./install.svelte.ts");
    const list = source.match(
      /const WRITABLE_PHASES: readonly InstallPhase\[\] = \[[^\]]*\];/,
    );
    expect(list, "WRITABLE_PHASES is declared as it was").not.toBeNull();
    expect(list?.[0]).toBe(
      [
        "const WRITABLE_PHASES: readonly InstallPhase[] = [",
        '  "ready",',
        '  "settled",',
        '  "restored",',
        '  "kept",',
        "  // A clear is idempotent and harmless, so CLEAR after CLEAR is allowed and",
        "  // TRY ON DEVICE works from here (A-50).",
        '  "cleared",',
        '  "partial",',
        '  "nothing-landed",',
        '  "unconfirmed",',
        '  "kept-mismatch",',
        '  "restored-unconfirmed",',
        "];",
      ].join("\n"),
    );
    const union = source.match(/export type InstallPhase =([^;]*);/);
    expect(union, "the phase union is declared").not.toBeNull();
    expect(
      (union?.[1].match(/\| "/g) ?? []).length,
      "fifteen phases, as 13-12 left them",
    ).toBe(15);
  });

  // -------------------------------------------------------------------------
  // The Sandbox's landing (13-17; 13-CONTEXT D-03, D-18, D-19): the third
  // producer of the one shape, through the one writer, refused before the
  // wire when it does not fit.

  describe("a surface through the one writer (13-17)", () => {
    /** The PDF's page 3: a 2 x 6 Fader, a 3 x 3 XY pad, a 3 x 3 Knob and a 2 x 2 Button (runtime.spec.ts's fixture). */
    const region = (
      name: string,
      kind: Region["kind"],
      col: number,
      row: number,
      w: number,
      h: number,
      cc: number,
      extra: Partial<Region> = {},
    ): Region => ({
      id: name.toLowerCase(),
      name,
      kind,
      col,
      row,
      w,
      h,
      cc,
      channel: 1,
      colour: [15, 15, 15],
      ...extra,
    });
    const PAGE3: Surface = {
      id: "page-3",
      name: "Page 3",
      regions: [
        region("Filter", "fader", 0, 0, 2, 6, 20),
        region("Space", "xy", 3, 0, 3, 3, 21, { cc2: 22 }),
        region("Turn", "knob", 3, 4, 3, 3, 23),
        region("Go", "button", 7, 0, 2, 2, 30),
      ],
    };
    /** The landings, built once with real timers: the minifier's WASM gate is awaited here, never under the fake clock. */
    let three: SurfaceLanding;
    let two: SurfaceLanding;
    beforeAll(async () => {
      three = await landSurface(PAGE3);
      two = await landSurface(PAGE3, { slots: 2 });
    }, 30_000);

    it("a surface lands in the tuner's own shape, and the store consumes it by the one path an entry takes", async () => {
      // THE SHAPE. Five keys, the tuner's, in write order - model.spec.ts
      // asserts the same five on a Lua entry and on a preset; a landing
      // with a sixth key or a "kind" would fail here by name. The library's
      // two halves land verbatim, as a Lua entry's do (wire-pin.spec.ts
      // test 2), because the runtime calls E, G, N, U and X by name; the
      // utility is the runtime's second slot; and every string is canonical
      // under the pinned minifier (a fixed point on the first round).
      expect(Object.keys(three.config)).toEqual(Object.keys(PAIR));
      expect(Object.keys(three.config)).toEqual([
        "systemTimer",
        "system",
        "systemUtility",
        "setup",
        "timer",
      ]);
      // The same five keys SLOTS names - the writer owns the wire order, not
      // the shape (sequence.spec.ts's permutation test), so as a set.
      expect([...Object.keys(three.config)].sort()).toEqual(
        SLOTS.map((s) => s.key).sort(),
      );
      expect(three.config.system).toBe(TOUCH_LIBRARY);
      expect(three.config.systemTimer).toBe(TOUCH_LIBRARY_TIMER);
      expect(three.config.systemUtility.startsWith("--[[@cb]]")).toBe(true);
      expect(three.config.setup.startsWith("--[[@cb]]")).toBe(true);
      expect(three.config.timer.startsWith("--[[@cb]]")).toBe(true);
      for (const key of ["systemUtility", "setup", "timer"] as const) {
        expect((await canonical(three.config[key])).rounds, key).toBe(0);
      }
      expect(three.label).toBe("Page 3");
      expect(three.refusal, "page 3 fits three slots").toBeUndefined();
      // The label is the ONLY thing about the surface the store sees: the
      // shape carries no field that says what produced it.
      expect(
        Object.keys(three).sort(),
        "the landing is config, label, measured and refusal",
      ).toEqual(["config", "label", "measured", "refusal"]);
      // Printed for the SUMMARY: the five measured strings at the picker
      // corner, with their free characters.
      const m = three.measured;
      console.log(
        `page 3 at three slots: system timer ${three.config.systemTimer.length}, page init ${three.config.system.length}, utility ${m.mapmode?.used} (${m.mapmode?.free} free), Timer ${m.timer.used} (${m.timer.free} free), Setup ${m.setup.used} (${m.setup.free} free)`,
      );

      // THE PATH. A surface's landing and an entry-shaped one, through the
      // same store and the routes' one click (a Store, 2026-09-16): the same
      // step ids in the same order, the same eighteen frames - the defaults,
      // the landing in SLOTS order, the store, the proof - the same phases,
      // the same arming, the same keep reason. Not the payload - the
      // consumption.
      const fromSurface = await connected();
      const fromEntry = await connected();
      const phasesBefore = [fromSurface.phases.length, fromEntry.phases.length];
      fromSurface.store.observeConfig(three.config);
      fromEntry.store.observeConfig(PAIR);
      fromSurface.store.openConfirm();
      fromEntry.store.openConfirm();
      await throughStore(
        fromSurface,
        fromSurface.store.keepOnDevice(three.config, three.label),
      );
      await throughStore(
        fromEntry,
        fromEntry.store.keepOnDevice(PAIR, "Aurora"),
      );
      expect(outcomes(fromSurface.store.steps)).toEqual(
        outcomes(fromEntry.store.steps),
      );
      expect(outcomes(fromSurface.store.steps)).toEqual(STORE_CLICK_STEPS);
      expect(fromSurface.phases.slice(phasesBefore[0])).toEqual(
        fromEntry.phases.slice(phasesBefore[1]),
      );
      expect(fromSurface.store.phase).toBe("kept");
      expect(written(fromSurface.fake).slice(-18, -6).map(shape)).toEqual(
        storeClickRamFrames(three.config),
      );
      expect(written(fromEntry.fake).slice(-18, -6).map(shape)).toEqual(
        storeClickRamFrames(PAIR),
      );
      expect(fromSurface.store.name).toBe("Page 3");
      expect(fromSurface.store.armed).toBe(fromEntry.store.armed);
      expect(fromSurface.store.armed).toBe(true);
      expect(fromSurface.store.keepReason(true)).toBe(
        fromEntry.store.keepReason(true),
      );
      expect(fromSurface.store.keepReason(true)).toBe("already-kept");
      // The fake holds the surface's five - the runtime in 255/4 among them -
      // in RAM and in flash, and PUT BACK (the probe's) restores the module's
      // own five, the utility included, storing them too after a store.
      const { state } = fromSurface;
      expect(state.system?.[EVENT_UTILITY]).toBe(three.config.systemUtility);
      expect(state.system?.[EVENT_SETUP]).toBe(TOUCH_LIBRARY);
      expect(state.system?.[EVENT_TIMER]).toBe(TOUCH_LIBRARY_TIMER);
      expect(state.configs[EVENT_SETUP]).toBe(three.config.setup);
      expect(state.configs[EVENT_TIMER]).toBe(three.config.timer);
      expect(state.systemFlash?.[EVENT_UTILITY]).toBe(
        three.config.systemUtility,
      );
      await throughStore(fromSurface, fromSurface.store.putBack());
      expect(fromSurface.store.phase).toBe("restored");
      expect(state.system?.[EVENT_UTILITY]).toBe(MODULE_SYSTEM_UTILITY);
      expect(state.system?.[EVENT_SETUP]).toBe(MODULE_SYSTEM);
      expect(state.configs[EVENT_SETUP]).toBe(MODULE_SETUP);
      expect(state.systemFlash?.[EVENT_UTILITY]).toBe(MODULE_SYSTEM_UTILITY);

      // THE STRUCTURAL HALF: the store's code names no surface, no sandbox
      // and no kind, and keepOnDevice - like the probe's tryOnDevice - takes
      // a config and a name - a label, never a branch. And the landing's
      // module stays on the tuner's side of ladder.spec.ts's line: it reaches
      // no protocol, transport or device module, so a firmware default can
      // never be typed into it.
      const store = stripComments(sourceOf("./install.svelte.ts"));
      for (const needle of ["sandbox", "Surface", "surface", ".kind"]) {
        expect(store.includes(needle), `the store names ${needle}`).toBe(false);
      }
      expect(store).toContain(
        "async keepOnDevice(\n    config: ConfigStrings | undefined,\n    name: string,\n  )",
      );
      expect(store).toContain(
        "async tryOnDevice(\n    config: ConfigStrings | undefined,\n    name: string,\n  )",
      );
      const land = stripComments(sourceOf("../sandbox/land.ts"));
      for (const needle of ["lib/protocol", "lib/transport", "lib/device"]) {
        expect(land.includes(needle), `land.ts reaches ${needle}`).toBe(false);
      }
    }, 30_000);

    it("a surface's five strings go out in SLOTS order, the classifier names which of five landed, and the impossible partial is still impossible", async () => {
      // THE ORDER, off the list: the same one writer, the same five frames,
      // 255/6, 255/0, 255/4, 0/6, 0/0, with the surface's own strings in
      // them - the utility third, before the touch Setup that calls it
      // through ele[#ele]:map().
      const rig = await connected();
      rig.store.observeConfig(three.config);
      await drive(rig.store.tryOnDevice(three.config, three.label));
      const frames = written(rig.fake)
        .flat()
        .filter((c) => c.class_name === "CONFIG" && c.class_instr === "EXECUTE")
        .map((c) => [
          Number(c.class_parameters.ELEMENTNUMBER),
          Number(c.class_parameters.EVENTTYPE),
          String(c.class_parameters.ACTIONSTRING),
        ]);
      expect(frames).toEqual(
        SLOTS.map((slot) => [slot.element, slot.event, three.config[slot.key]]),
      );
      expect(rig.store.steps.map((s) => s.id)).toEqual([
        ...SLOTS.map((s) => s.write),
        "restore-page-change",
      ]);

      // THE CLASSIFIER over a surface's landing: refuse the nth write and
      // the store names the landed prefix - in words and in labels - and
      // what the fake holds of the surface's is always a prefix of SLOTS.
      const labels = SLOTS.map((s) => s.label);
      const refuseNth = async (nth: number) => {
        let seen = 0;
        const r = await connected({
          wrap: (inner) => (outbound, requestId) => {
            const isWrite =
              outbound.class_name === "CONFIG" &&
              outbound.class_instr === "EXECUTE";
            if (isWrite && ++seen === nth) {
              return [configNackFrame({ sx: 0, sy: 0, lastheader: requestId })];
            }
            return inner(outbound, requestId);
          },
        });
        r.store.observeConfig(three.config);
        await drive(r.store.tryOnDevice(three.config, three.label));
        return r;
      };
      const utilityRefused = await refuseNth(3);
      expect(utilityRefused.store.phase).toBe("partial");
      expect(utilityRefused.store.landed).toBe(
        "The system timer and the page init",
      );
      expect(utilityRefused.store.failed).toBe(
        "the utility script, the Timer and the Setup",
      );
      expect(utilityRefused.store.landedSlots).toEqual(labels.slice(0, 2));
      expect(utilityRefused.store.failedSlots).toEqual(labels.slice(2));
      expect(
        utilityRefused.state.system?.[EVENT_UTILITY],
        "the refused utility never reached the module",
      ).toBe(MODULE_SYSTEM_UTILITY);
      const timerRefused = await refuseNth(4);
      expect(timerRefused.store.phase).toBe("partial");
      expect(timerRefused.store.landed).toBe(
        "The system timer, the page init and the utility script",
      );
      expect(timerRefused.store.landedSlots).toEqual(labels.slice(0, 3));
      expect(timerRefused.state.system?.[EVENT_UTILITY]).toBe(
        three.config.systemUtility,
      );
      const setupRefused = await refuseNth(5);
      expect(setupRefused.store.phase).toBe("partial");
      expect(setupRefused.store.landedSlots).toEqual(labels.slice(0, 4));
      for (const r of [utilityRefused, timerRefused, setupRefused]) {
        const holds = SLOTS.map((slot) =>
          slot.element === ELEMENT_SYSTEM
            ? r.state.system?.[slot.event] === three.config[slot.key]
            : r.state.configs[slot.event] === three.config[slot.key],
        );
        const firstMiss = holds.indexOf(false);
        expect(
          firstMiss === -1 || holds.slice(firstMiss).every((h) => !h),
          `a later slot landed and an earlier one did not: ${holds.join(",")}`,
        ).toBe(true);
        expect(r.store.landedSlots).toEqual(
          labels.slice(0, firstMiss === -1 ? labels.length : firstMiss),
        );
      }
    }, 30_000);

    it("over budget refuses before the wire: a surface over 908 disables Store, names the cause, and sends zero frames", async () => {
      // THE SAME SURFACE ON TWO SLOTS does not fit (13-15's ceiling: page 3
      // at two slots is over by hundreds), and the landing says which string
      // and by how much, first in write order; the meter's sentence names
      // the way - the last element's removal - because an element is the
      // only thing that can push a surface over (names are never emitted,
      // colours are measured at their dearest already).
      expect(two.refusal).toBeDefined();
      expect(two.refusal?.word).toBe("Timer");
      expect(two.refusal?.used).toBeGreaterThan(908);
      expect(two.refusal?.over).toBe((two.refusal?.used ?? 0) - 908);
      expect(two.config.systemUtility, "two slots: no 255/4 of its own").toBe(
        "",
      );
      const sentence = overElementLine(
        two.refusal!.word,
        two.refusal!.used,
        two.refusal!.over,
      );
      expect(sentence).toBe(
        `Timer is ${two.refusal!.used} of 908, ${two.refusal!.over} over. Remove the last element to fit.`,
      );
      console.log(`page 3 at two slots: ${sentence}`);
      // STORE IS DISABLED BEFORE THE CLICK, described by the sentence: the
      // destination zone (DestinationZone.svelte since 13.1-06 - the one
      // component the Sandbox and the workspace both mount; Store its one
      // write since 2026-09-16) rendered with the refusal carries a real
      // disabled attribute on Store and the sentence under it, named in
      // Store's description beside the honesty line and the reason line.
      const html = render(DestinationZone, {
        props: {
          name: two.label,
          config: two.config,
          refusal: sentence,
        },
      }).body;
      const storeTag = /<button[^>]*data-testid="store-on-zona"[^>]*>/.exec(
        html,
      );
      expect(storeTag, "Store on ZONA is rendered").not.toBeNull();
      expect(storeTag?.[0]).toContain(" disabled");
      expect(storeTag?.[0]).toMatch(/aria-describedby="[^"]*-refusal"/);
      expect(html).toContain(`data-testid="store-refusal"`);
      expect(html).toContain(sentence);
      expect(html, "no Apply on the zone").not.toContain("apply-to-zona");

      // AND ZERO FRAMES: the store is never armed over budget, so the
      // confirmation cannot open; were the click to happen anyway, the store
      // refuses the over-budget Timer on its own (TUNE-05, D-10) and the
      // transport never hears of it - the frame count is the assertion.
      const rig = await connected();
      const framesBefore = rig.fake.writes.length;
      const stepsBefore = rig.store.steps;
      rig.store.observeConfig(two.config);
      expect(rig.store.armed, "over budget is never armed").toBe(false);
      rig.store.openConfirm();
      expect(rig.store.confirmOpen).toBe(false);
      rig.store.confirmOpen = true;
      rig.store.armed = true;
      await drive(rig.store.keepOnDevice(two.config, two.label));
      expect(rig.fake.writes.length, "frames the refusal produced").toBe(
        framesBefore,
      );
      expect(rig.writesOf("CONFIG", "EXECUTE"), "config writes").toBe(0);
      expect(rig.writesOf("HEARTBEAT", "EXECUTE"), "restores").toBe(0);
      expect(rig.writesOf("PAGESTORE", "EXECUTE"), "stores").toBe(0);
      expect(rig.store.phase).toBe("ready");
      expect(rig.store.steps, "an action started").toBe(stepsBefore);
      expect(rig.store.lastWritten).toBeUndefined();
      // The same surface on three slots fits, and the same click writes the
      // defaults, the five, and stores.
      rig.store.observeConfig(three.config);
      expect(rig.store.armed).toBe(true);
      rig.store.openConfirm();
      await throughStore(
        rig,
        rig.store.keepOnDevice(three.config, three.label),
      );
      expect(rig.store.phase).toBe("kept");
      expect(rig.writesOf("CONFIG", "EXECUTE")).toBe(10);
      expect(rig.writesOf("PAGESTORE", "EXECUTE")).toBe(1);
    }, 30_000);
  });
});
