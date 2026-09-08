// The install store: the snapshot at connect, the two RAM clicks, the way
// back, the flash store and its proof, and every way a write can go wrong
// (Phase 7, SAFE-01, SAFE-03 to SAFE-09).
//
// WHY THIS IS A SEPARATE FILE AND NOT PART OF THE SESSION. Phase 6 plan 06-04's
// test 15 scans session.svelte.ts, comment-stripped, for eight write-shaped
// needles - the queue class, the host heartbeat, the config send, the page
// store, the fetch, the flash store, the write-back and the interval - and
// asserts every one is absent. That scan is a structural guarantee that the
// session never writes, and it is worth more than the convenience of one file:
// a write added to the session would turn the gate red with no honest
// replacement. So every write of this site lives HERE, in a second runes store
// beside the session and never inside it, and this file borrows from the
// session exactly what plan 07-04 lent: the `transport` write view, onClass(),
// onConnection(), announce() and writeLock.
//
// WHY EXACTLY THREE STATIC `from` SPECIFIERS, AND WHICH THREE. The install
// panel is on the first paint of `/c/{id}/`, and this store is reachable from
// it, so whatever this file names statically is on the cold load. Phase 4's
// chunk guard (src/lib/config-shape.spec.ts test 13) matches specifier TEXT,
// and install.spec.ts test 8 counts them:
//
//   ./install-copy    zero imports. Every sentence this store speaks.
//   ./snapshot        zero imports. The durable record, keyed module then page.
//   ./session.svelte  Phase 6's four light specifiers (session-copy,
//                     protocol/usb, transport/ports, transport/transport), all
//                     of them free of the protocol package.
//
// Every reference to $lib/protocol, $lib/transport or $lib/pad is either an
// inline `import(...)` TYPE - erased, invisible to a specifier scan, costing no
// byte - or an `await import(...)` inside an action, where the chunk the
// session's open path already fetched is in hand and no new fetch happens. The
// memoised module promise below is module scope for the reason the session's
// is: ES modules are singletons whatever instance asks for them, and the
// promise carries no store state. DESKTOP_PRE_SEND_DELAY_MS, PRE_SEND_DELAY_MS,
// retryBackoffMs, TIMEOUTS and CONFIG_MAX are all read from the awaited
// protocol module and never through a fourth specifier.
//
// WHY THE QUEUE IS FED FROM onClass() AND NEVER FROM onData(). GridTransport
// carries exactly ONE data callback and the session owns it after
// identification (07-CONTEXT D-16). A second raw registration would silently
// unhook the fold that keeps the page number and the rig tail true, and the
// later writes would then fail as unexplained refusals - the module NACKs a
// write to a page that is not its active one, and the page on screen would be
// frozen at connect time (07-RESEARCH Pitfall 1). The session's view throws on
// onData for exactly this reason; this store subscribes through onClass() and
// hands every decoded class to the queue's deliver(). The same sink is where
// the store hears the module's heartbeat - for the proof below, and for the
// page-change re-snapshot. The spec scans this file for a raw onData
// registration and expects none.
//
// WHY ONE RequestQueue PER CONNECTION, NOT PER CLICK. sendImmediate() drops the
// restore heartbeat when ITS OWN queue has a write in flight and cannot see
// another queue's (07-RESEARCH Pitfall 2). Two queues over one transport could
// interleave a fire-and-forget heartbeat between another queue's write and its
// acknowledgement. One queue per connection, built at "connected" and dropped
// at "closed", keeps the one-outstanding-request invariant true for the whole
// site, and the capture's steps and the retry bound stay true with it. Nothing
// here calls the transport's write directly; every byte goes through the queue.
// The one time a queue is rebuilt inside a connection is the pacing escalation
// below, and the old one is aborted and unsubscribed before the new one exists.
//
// WHY THE SNAPSHOT IS TAKEN INTO MEMORY BEFORE STORAGE IS TOUCHED. The
// in-memory copy is the safety rail; the durable record is a courtesy that
// makes the rail reach into a fresh tab (SAFE-04). A private window, a full
// quota or a browser that throws on the storage property itself must never be
// the reason a visitor has no way back (07-RESEARCH Pitfall 9), so the pair is
// held in `snapshot` first and persistIfAbsent() is consulted only afterwards,
// and `ready` publishes whatever the store said.
//
// WHY AN EXISTING RECORD WINS OVER A FRESH FETCH. The record is the module's
// ORIGINAL, not its latest. After TRY ON DEVICE has written, a re-connect's
// fetch returns HANGAR's own configuration; if the fetch won, PUT BACK would
// put HANGAR back, and the only copy of what the visitor came in with would be
// gone. So readSnapshot() is consulted before the in-memory copy is chosen, and
// persistIfAbsent() never overwrites a valid entry. Nothing in this file
// deletes a snapshot: `keptThisSession` is cleared by a put-back that stored,
// and `snapshot` itself is never cleared by an action.
//
// ONE CONSEQUENCE OF THE GATED ORDER, NAMED AND NOT FIXED HERE. An empty fetched
// string lands `snapshot-failed` BEFORE the durable record is consulted, so a
// remembered module whose RAM reads empty on that page is not offered its own
// record. The reorder waits on the Z-16 / D-03 question 07-VALIDATION leaves
// open and is a deferred item for 07-13.
//
// WHY THE RE-FETCH AFTER A STORE WAITS FOR A HEARTBEAT FIRST (D-12, D-19,
// 07-RESEARCH Pitfall 6). The PAGESTORE acknowledgement is sent by the success
// callback that STARTS the module's page reload and Lua VM restart
// (grid_decode.c:947-961), and CONFIG/FETCH has no bulk guard. A fetch that
// races that reload returns a partially loaded string, and the panel would say
// the store failed when it did not. So `kept` is said only after the ACK, then
// the module's next heartbeat, then a re-fetch of both strings that matches
// byte for byte - bounded to three rounds with retryBackoffMs between them,
// because nobody has measured how long the load takes (runbook row E records
// how many rounds it took; `refetchRounds` holds the number).
//
// WHY `kept-mismatch` EXISTS AT ALL. It is unreachable on healthy hardware -
// Phase 2 proved byte identity across three stores - and it exists so that the
// failure is never silent. The ACK already means stored; the re-fetch is a
// proof, not the definition, and when the proof runs out the panel says so
// rather than calling it kept.
//
// WHY PUT BACK AFTER A KEEP STORES TOO, AND GETS NO CONFIRMATION (Z-04). A
// gate on the escape hatch is the one place a gate does harm, so PUT BACK is
// never confirmed; and without the store a kept-then-put-back would leave the
// owner's RAM right and their flash still holding HANGAR's work, so after a
// keep this session the RAM leg is followed by a store leg and the same proof.
//
// WHY THE TAXONOMY IS DECIDED BY ERROR TYPE AND NEVER BY MESSAGE TEXT. The
// queue exposes NackError and AbortedError and refuses to retry either; this
// store never wraps it in a retry of its own (Pitfall 7) - the queue's three
// bounded attempts are the whole retry policy. The vendored TRANSIENT_WRITE
// regex would match AbortedError's "interrupted" and retry a dead link three
// times (07-RESEARCH Anti-Patterns); here `instanceof` decides, and `partial`
// is read off the recorded steps, never off a message.
//
// WHY THE PRE-SEND GAP ESCALATES, AND ONLY ON A NO-NACK TIMEOUT (D-19,
// Pitfall 3). 0 ms pacing has never met two back-to-back 957-byte writes
// against the module's 2,048-byte ring, which discards a whole message silently
// (docs/SKELETON-RESULTS.md (b)). A `write-*` timeout with zero NACKs in the
// action is that signature, so it moves the next queue's gap to the desktop's
// 10 ms and rebuilds the queue; the RETRY the visitor is already offered then
// runs the experiment. A NACK is a refusal, not congestion, and never escalates.
//
// WHY THE 2000 ms LINE IS A setTimeout ON THE STORE. Z-09: nothing animates
// during `writing`; the one honest line arrives at 2000 ms - roughly 90x the
// slowest CONFIG/EXECUTE ever observed on a RAM leg, roughly 50x the slowest
// PAGESTORE/ACKNOWLEDGE on a store leg, and below the 3000 ms pagestoreMs on
// purpose: the line says busy, and only the timeout says failed. It is a timer
// on the state, never on a render, never an interval, and it never touches the
// shared rAF loop.
//
// WHY THERE IS NO $derived. Plan 06-01's spike licensed `$state` and
// `$state.raw` in node - both compile to plain own class fields under the SSR
// transform, so a node test reads and writes them as data - and it did not
// license `$derived`. Every derived answer here is a method or is recomputed
// into a plain `$state` boolean at the point its inputs change (`armed`).
// Reactive fields are scalars and whole-value snapshots, replaced and never
// mutated, the house rule of the session.
//
// THE CLASS IS EXPORTED BESIDE THE SINGLETON, for the reason the session's is:
// `install` is for components, one instance per page load; every node test
// constructs its own `new DeviceSession()` and `new InstallStore(session)` and
// never touches either singleton, so no test can leak a queue, a snapshot or a
// phase into the next and the class needs no reset hook.
//
// EVERY ACTION SHARES ONE SHAPE. Guard the phase, capture the connection
// generation, set writeLock, arm the slow line, run the sequence through the
// ONE queue, classify by error TYPE, and restore page change in a `finally` on
// every RAM path: a successful CONFIG/EXECUTE clears page_change_enabled
// (grid_decode.c:1279) and only an inbound HEARTBEAT TYPE 255 sets it back
// (grid_decode.c:717); the firmware's own timeout restore is commented out.
// Settled means both acknowledgements arrived AND the restore went out - never
// a resolved write.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  type ClearReason,
  type KeepReason,
  LIVE_CLEARED,
  LIVE_RESTORED,
  LIVE_SNAPSHOT_SAVED,
  LIVE_STILL_WRITING,
  TRY_ON_LABEL,
  announceTitle,
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
  type SnapshotStore,
  hasSnapshotFor,
  lastModuleId,
  persistIfAbsent,
  readSnapshot,
  rememberLast,
} from "./snapshot";
import { type ConnectionEvent, DeviceSession, session } from "./session.svelte";

// Type-only references. Erased at compile time, so none is a specifier the
// chunk guard can see, and none costs a byte on the load path.
type Protocol = typeof import("$lib/protocol");
type Transport = typeof import("$lib/transport");
type Identity = import("$lib/transport").Identity;
type RequestQueue = import("$lib/transport").RequestQueue;
type CaptureStep = import("$lib/transport").CaptureStep;
type DecodedClass = import("$lib/protocol").DecodedClass;

/**
 * The FIFTEEN states of 07-UI-SPEC's machine, fourteen until plan 10-12.
 * `snapshot-failed` is I9's cause 4; the other I9 causes are not phases here -
 * they are read off the session's capability, the tuner's budget and this
 * store's `snapshotting` and `writing` by the component.
 *
 * WHY `cleared` IS ITS OWN STATE AND MUST NOT BE COLLAPSED INTO ONE OF THE
 * OTHERS (A-50, D-19's one open question, settled by D-20). After a clear the
 * module runs the firmware's own default configuration - a real state no
 * existing phase describes truthfully. `settled` would claim THIS
 * configuration is on the pad; `restored` would claim the visitor's own is
 * back, and that one is not merely inaccurate but unsafe, because a panel
 * reading RESTORED tells a visitor not to click PUT BACK - the one control
 * that actually would restore them.
 */
export type InstallPhase =
  | "idle"
  | "snapshotting"
  | "ready"
  | "writing"
  | "settled"
  | "restored"
  | "kept"
  | "cleared"
  | "partial"
  | "lost"
  | "snapshot-failed"
  | "kept-mismatch"
  | "unconfirmed"
  | "restored-unconfirmed"
  | "nothing-landed";
export type InstallAction = "try" | "put-back" | "keep" | "clear";
export type InstallLeg = "ram" | "store";
/** Why an action ended where it did. Rendered by no block in v1; asserted by the spec and recorded in the capture. */
export type InstallCause = "timeout" | "nack" | "aborted" | "mismatch";
/** The tuner's pair, verbatim (D-10). Declared here rather than imported: a type import is still a specifier. */
export type ConfigStrings = { readonly setup: string; readonly timer: string };
/** What a store leg concluded; false means the connection is no longer ours and the phase is already set. */
type StoreOutcome = "kept" | "mismatch" | "unconfirmed" | false;

export interface InstallEnv {
  /** Injected for node; defaults to a guarded read of the browser's local storage (Pitfall 9). */
  storage?: SnapshotStore;
  /** The queue's deadline clock. Injected so a node test can move it in step with fake timers. */
  now?: () => number;
  /** The wait between re-fetch rounds after a store. Injected so a node test can see the backoffs it asked for. */
  sleep?: (ms: number) => Promise<void>;
}

/** The two heavy modules, resolved together and kept. */
interface HeavyModules {
  P: Protocol;
  T: Transport;
}

/**
 * The phases a write may start from. Everything that is a settled outcome of
 * an earlier action, plus `ready`. `snapshot-failed` is handled separately:
 * the click retries the snapshot and writes only if that lands. The same list
 * is where a page change on the module re-snapshots from - never `writing`,
 * never `snapshotting`.
 */
const WRITABLE_PHASES: readonly InstallPhase[] = [
  "ready",
  "settled",
  "restored",
  "kept",
  // A clear is idempotent and harmless, so CLEAR after CLEAR is allowed and
  // TRY ON DEVICE works from here (A-50).
  "cleared",
  "partial",
  "nothing-landed",
  "unconfirmed",
  "kept-mismatch",
  "restored-unconfirmed",
];

/** D-12 / D-19: the re-fetch proof after a store is bounded to this many rounds (Pitfall 6). */
const REFETCH_ROUNDS = 3;
/** Z-09: the one honest line of `writing`, and the only utterance that is not a transition. */
const SLOW_LINE_MS = 2000;

/** One reason per refusal; the guard returns the first that applies. */
type TryRefusal = "measuring" | "not-writable" | "no-session" | "over-budget";

/**
 * The memoised module promise. Module scope on purpose, exactly as the
 * session's is and for the same reason: ES modules are singletons, and this
 * promise carries no store state. The session's open path has already awaited
 * both of these before "connected" can fire, so every await of it in an action
 * below resolves from cache.
 */
let heavy: Promise<HeavyModules> | undefined;
async function loadHeavy(): Promise<HeavyModules> {
  const P = await import("$lib/protocol");
  const T = await import("$lib/transport");
  return { P, T };
}
const heavyModules = (): Promise<HeavyModules> => (heavy ??= loadHeavy());

/**
 * The browser's storage, read inside a try: a browser configured to refuse
 * storage can throw on the property ACCESS, not only on use (Pitfall 9), and
 * on the server there is no window at all. `undefined` means session-only.
 */
function defaultStorage(): SnapshotStore | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/** The default wait between re-fetch rounds. A timer, never an interval. */
const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class InstallStore {
  // --- reactive: scalars and whole-value snapshots only ---------------------

  phase = $state<InstallPhase>("idle");
  action = $state.raw<InstallAction | undefined>(undefined);
  leg = $state.raw<InstallLeg | undefined>(undefined);
  cause = $state.raw<InstallCause | undefined>(undefined);
  /** The 2000 ms line (Z-09): true while a leg has been in flight past SLOW_LINE_MS. */
  slow = $state(false);
  /** The module's original for the page that was snapshotted, or undefined. */
  snapshot = $state.raw<ConfigStrings | undefined>(undefined);
  snapshotPage = $state.raw<number | undefined>(undefined);
  /** True when the snapshot is in the browser's record; false when it is this tab only. */
  snapshotDurable = $state(false);
  moduleId = $state.raw<string | undefined>(undefined);
  /** True once a durable record exists for the module this browser last identified - PUT BACK's "needs your ZONA" form with no session (I0, Z-12). */
  rememberedModule = $state(false);
  /** The name and strings of the configuration currently on the module, from the last landed RAM leg. */
  name = $state.raw<string | undefined>(undefined);
  lastWritten = $state.raw<ConfigStrings | undefined>(undefined);
  /** The tuner's current pair, or undefined while measuring (07-05, D-17). */
  config = $state.raw<ConfigStrings | undefined>(undefined);
  /** True exactly when the module holds the pair the visitor is looking at (Z-05). */
  armed = $state(false);
  /** True from a proved keep until a put-back that stored (Z-04). */
  keptThisSession = $state(false);
  confirmOpen = $state(false);
  /** partial's halves, as already-capitalised words (I7). */
  landed = $state.raw<"Setup" | "Timer" | undefined>(undefined);
  failed = $state.raw<"Setup" | "Timer" | undefined>(undefined);
  /**
   * True once a `write-*` timeout with no NACK has moved the pre-send gap to
   * the desktop's 10 ms (D-19, Pitfall 3). Shown by the probe; the runbook
   * asks whether it ever fired. Never reset inside a page load.
   */
  pacingEscalated = $state(false);

  // --- NOT reactive: the record of the last action, and the machinery -------

  /**
   * The capture steps of the LAST action - the snapshot or one action's legs -
   * as the queue reported them, in order. Replaced with a fresh array when an
   * action starts, so a reader sees one action at a time. Plain, never a rune:
   * it is written from the queue's onStep and rendered by nothing; #classify
   * reads it to tell a half-landed write from a whole one, and the pacing rule
   * reads it for a NACK.
   */
  steps: CaptureStep[] = [];
  /**
   * How many re-fetch rounds the last store leg took to match, or ran out at.
   * Recorded for the runbook (row E: a measurement nobody has), rendered
   * nowhere. Plain, for the same reason as `steps`.
   */
  refetchRounds = 0;

  readonly #session: DeviceSession;
  #storage: SnapshotStore | undefined;
  #now: (() => number) | undefined;
  #sleep: (ms: number) => Promise<void> = defaultSleep;
  /** The two heavy modules once #attach has awaited them, for the paths that cannot await (the "closed" branch). */
  #modules: HeavyModules | undefined;
  /**
   * The connection generation (Pitfall 11). Bumped on every "connected" and
   * every "closed"; every action captures it at its start and discards a
   * result whose generation is stale, so an action that outlived its link can
   * never publish against the next one.
   */
  #generation = 0;
  /** The ONE queue of the current connection, or undefined. */
  #queue: RequestQueue | undefined;
  #unsubscribeClass: (() => void) | undefined;
  /** True while a leg is in flight; "closed" leaves the phase to the leg's catch when it is. */
  #inFlight = false;
  /**
   * The pre-send gap the next queue is built with. Undefined until the
   * protocol module is in hand, when it reads PRE_SEND_DELAY_MS (0); escalated
   * to the desktop's DESKTOP_PRE_SEND_DELAY_MS on a write timeout with no NACK.
   */
  #preSendDelayMs: number | undefined;
  /** The 2000 ms line's pending timer. A setTimeout, never an interval. */
  #slowTimer: ReturnType<typeof setTimeout> | undefined;
  /** Store legs waiting for the module's next heartbeat, resolved from the onClass sink. */
  #heartbeatWaiters: { resolve: () => void; reject: (err: Error) => void }[] =
    [];
  #started = false;

  constructor(session: DeviceSession) {
    this.#session = session;
  }

  /** The last action's steps, for the probe and for the pacing rule. */
  get lastSteps(): readonly CaptureStep[] {
    return this.steps;
  }

  // --- start: synchronous, idempotent, and it touches no phase of the session

  /**
   * Reads the record for the "needs your ZONA" form and subscribes to the
   * session. Idempotent: a second call attaches no second subscriber. It does
   * not touch the session's phase and opens nothing.
   */
  start(env: InstallEnv = {}): void {
    if (this.#started) return;
    this.#started = true;
    this.#storage = env.storage ?? defaultStorage();
    this.#now = env.now;
    if (env.sleep) this.#sleep = env.sleep;

    // I0, Z-12: a fresh tab that once identified a module with a durable
    // record renders PUT BACK disabled with "Needs your ZONA connected."
    // before any connection exists.
    const last = lastModuleId(this.#storage);
    this.rememberedModule =
      last !== undefined && hasSnapshotFor(this.#storage, last);

    this.#session.onConnection((ev) => this.#onConnection(ev));
  }

  // --- the connection lifecycle, from the session's seams and nothing else --

  #onConnection(ev: ConnectionEvent): void {
    if (ev === "connected") {
      this.#generation++;
      void this.#attach(this.#generation);
      return;
    }
    // "closed". This also fires from the session's teardown on the not-zona
    // and silent paths with NO "connected" before it (07-04), so each of the
    // abort, the unsubscribe and the drop is guarded on existence, and the
    // generation is bumped regardless.
    this.#generation++;
    this.#queue?.abort("closed");
    this.#unsubscribeClass?.();
    this.#unsubscribeClass = undefined;
    this.#queue = undefined;
    // A store leg waiting for a heartbeat hears the same thing its waiter
    // would have: the link is gone.
    this.#rejectHeartbeatWaiters("closed");
    // Flash only what you have heard (Z-21): a session drop is one of the
    // confirmation's four exits.
    this.confirmOpen = false;
    if (!this.#inFlight) {
      // Nothing was in flight: back to idle. `snapshot`, `moduleId` and
      // `rememberedModule` STAY - the way back survives the unplug.
      this.phase = "idle";
      this.action = undefined;
      this.leg = undefined;
      this.cause = undefined;
      this.#recomputeArmed();
    }
    // A leg in flight sees its waiter rejected with the queue's AbortedError
    // and its catch lands `lost`.
  }

  /**
   * Build the ONE queue of this connection over the session's write view, fed
   * from onClass(), and take the snapshot. The heavy modules are awaited here,
   * but the session's open path has already resolved them, so this is a cache
   * hit and no fetch.
   */
  async #attach(gen: number): Promise<void> {
    const modules = await heavyModules();
    this.#modules = modules;
    if (gen !== this.#generation) return;
    const id = this.#session.identity;
    if (!id) return;
    this.#preSendDelayMs ??= modules.P.PRE_SEND_DELAY_MS;
    const queue = this.#buildQueue(modules.T);
    if (!queue) return;
    await this.#snapshot(id, queue, gen);
  }

  /**
   * The queue over the session's write view, with the current pre-send gap,
   * subscribed to the session's class pump. Any queue before it is aborted
   * and unsubscribed first, so there is never a second one delivering. Used at
   * "connected" and again by the pacing escalation.
   */
  #buildQueue(T: Transport): RequestQueue | undefined {
    const transport = this.#session.transport;
    if (!transport) return undefined;
    this.#queue?.abort("replaced");
    this.#unsubscribeClass?.();
    const queue = new T.RequestQueue(transport, {
      preSendDelayMs: this.#preSendDelayMs,
      now: this.#now,
      onStep: (step) => {
        this.steps.push(step);
      },
    });
    this.#queue = queue;
    this.#unsubscribeClass = this.#session.onClass((cls: DecodedClass) => {
      queue.deliver(cls);
      this.#onClassSeen(cls);
    });
    return queue;
  }

  /**
   * The store's own reading of the class pump, beside the queue's. A heartbeat
   * from the ZONA resolves whichever store leg is waiting for one (the D-12
   * proof), and asks whether the module's page moved. Anything else is the
   * queue's business.
   */
  #onClassSeen(cls: DecodedClass): void {
    if (cls.class_name !== "HEARTBEAT") return;
    const zona = this.#session.identity?.zona;
    if (
      zona &&
      (Number(cls.brc_parameters.SX) !== zona.sx ||
        Number(cls.brc_parameters.SY) !== zona.sy)
    ) {
      return;
    }
    const waiters = this.#heartbeatWaiters;
    this.#heartbeatWaiters = [];
    for (const waiter of waiters) waiter.resolve();
    // The session's fold publishes the identity AFTER its sinks have run for
    // this frame, so the page comparison waits one microtask for it.
    queueMicrotask(() => this.#pageCheck());
  }

  /** A promise for the ZONA's next heartbeat, rejected if the link closes first. */
  #nextHeartbeat(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#heartbeatWaiters.push({ resolve, reject });
    });
  }

  #rejectHeartbeatWaiters(reason: string): void {
    const waiters = this.#heartbeatWaiters;
    this.#heartbeatWaiters = [];
    if (waiters.length === 0) return;
    const T = this.#modules?.T;
    const err = T
      ? new T.AbortedError(`heartbeat wait ended (${reason})`)
      : new Error(reason);
    for (const waiter of waiters) waiter.reject(err);
  }

  /**
   * Pitfall 4's third layer. The module's reported page differs from the page
   * the snapshot was taken on, and nothing is in flight: read the module again
   * for the new page, so PUT BACK writes the page it snapshotted and the
   * record accumulates a second entry rather than shadowing the first. Never
   * from `writing` - a successful write disables page change until the restore
   * heartbeat anyway, which is why this window is narrow - and never from
   * `snapshotting`.
   */
  #pageCheck(): void {
    const id = this.#session.identity;
    const q = this.#queue;
    if (!id || !q || this.#inFlight) return;
    if (this.snapshotPage === undefined || id.activePage === this.snapshotPage)
      return;
    if (!WRITABLE_PHASES.includes(this.phase)) return;
    void this.#snapshot(id, q, this.#generation);
  }

  // --- the snapshot, in the order that gates each step ----------------------

  /**
   * Each step is a gate on the next (07-RESEARCH Code Examples 1):
   *
   *   1. the module names itself      - "fetch-serial"; a timeout here
   *      degrades to a session-only snapshot and never throws;
   *   2. both strings come back on the module's REPORTED page and pass
   *      canWriteBack - D-03: the empty string is exactly the shape a fetch of
   *      a non-active page produces;
   *   3. the pair is held IN MEMORY;
   *   4. only then is the durable record consulted, and written IF ABSENT.
   *
   * Only after all of that does `ready` publish.
   */
  async #snapshot(id: Identity, q: RequestQueue, gen: number): Promise<void> {
    this.phase = "snapshotting";
    this.steps = [];
    const { P, T } = await heavyModules();

    let moduleId: string | undefined;
    try {
      moduleId = await T.fetchModuleKey(q, id);
    } catch {
      // Unproven on hardware (runbook row A). Degrade, never throw: the
      // in-memory half still works and the copy says "this tab only".
      moduleId = undefined;
    }
    if (gen !== this.#generation) return;

    let pair: Awaited<ReturnType<Transport["fetchBoth"]>>;
    try {
      pair = await T.fetchBoth(q, id);
    } catch {
      if (gen !== this.#generation) return;
      this.#fail("snapshot-failed", "timeout", snapshotFailedBlock().title);
      return;
    }
    if (gen !== this.#generation) return;

    // D-03 over Z-16: an empty string is refused here, BEFORE the record is
    // consulted. A remembered module whose RAM reads empty on this page is
    // therefore not offered its own record - named in the header, deferred to
    // 07-13, not fixed here.
    const guard = P.canWriteBack([pair.setup, pair.timer]);
    if (!guard.ok) {
      this.#fail("snapshot-failed", "timeout", snapshotFailedBlock().title);
      return;
    }
    const fetched: ConfigStrings = {
      setup: pair.setup.actionString ?? "",
      timer: pair.timer.actionString ?? "",
    };

    // IN MEMORY FIRST. Storage is a courtesy and must never be the reason a
    // visitor has no way back (Pitfall 9).
    const record = moduleId
      ? readSnapshot(this.#storage, moduleId, id.activePage)
      : undefined;
    // An existing original WINS over a fresh fetch: after TRY ON DEVICE a
    // re-connect fetches HANGAR's own configuration.
    this.snapshot = record ?? fetched;
    this.snapshotPage = id.activePage;
    this.moduleId = moduleId;
    if (moduleId) {
      // The record's timestamp, read once and handed over as a string; nothing
      // holds or renders the instance. Not a SvelteDate: svelte/reactivity
      // would be a fourth static specifier.
      // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a timestamp read once; see the comment above
      const takenAt = new Date().toISOString();
      const wrote = persistIfAbsent(
        this.#storage,
        moduleId,
        id.activePage,
        fetched,
        takenAt,
      );
      rememberLast(this.#storage, moduleId);
      this.snapshotDurable = wrote !== "unavailable";
      this.rememberedModule = this.snapshotDurable;
    } else {
      this.snapshotDurable = false;
    }
    this.cause = undefined;
    this.phase = "ready";
    this.#recomputeArmed();
    this.#session.announce(LIVE_SNAPSHOT_SAVED);
  }

  /** The click on `snapshot-failed`: read the module again. Writes nothing. */
  async retrySnapshot(): Promise<void> {
    if (this.phase !== "snapshot-failed") return;
    const q = this.#queue;
    const id = this.#session.identity;
    if (!q || !id || this.#session.phase !== "connected") return;
    await this.#snapshot(id, q, this.#generation);
  }

  // --- the tuner's pair, and what "armed" means -----------------------------

  observeConfig(config: ConfigStrings | undefined): void {
    this.config = config;
    this.#recomputeArmed();
    // Flash only what you have heard (Z-05, Z-21): a knob move that leaves the
    // module holding something other than the pair on screen closes the
    // confirmation - one of its four exits.
    if (this.confirmOpen && !this.armed) this.confirmOpen = false;
  }

  /**
   * Z-05: the module holds the pair the visitor is looking at. Recomputed here
   * and after every leg rather than derived, for the header's reason. A knob
   * move that lands on identical strings keeps it armed - what plays on the
   * module is what the strings say. No path in this file arms from a phase
   * other than `settled` or `unconfirmed`: in `unconfirmed` memory still holds
   * what was heard, and the store may be sent again (I11).
   */
  #recomputeArmed(): void {
    const written = this.lastWritten;
    const current = this.config;
    this.armed =
      (this.phase === "settled" || this.phase === "unconfirmed") &&
      written !== undefined &&
      current !== undefined &&
      current.setup === written.setup &&
      current.timer === written.timer;
  }

  // --- the two closed decisions the components render ----------------------

  /**
   * Why KEEP ON DEVICE is disabled, or undefined when it is live (Z-05, Z-21).
   * One function, seven rows, first match wins:
   *
   *   !capable                                   incapable
   *   partial                                    after-partial
   *   kept                                       already-kept
   *   kept-mismatch                              after-mismatch
   *   settled | unconfirmed, armed               undefined - live
   *   settled | unconfirmed, not armed           knobs-moved
   *   anything else                              never-tried
   *
   * `capable` is the session's: false on `unsupported` and `insecure`.
   */
  keepReason(capable: boolean): KeepReason | undefined {
    if (!capable) return "incapable";
    const phase = this.phase;
    if (phase === "partial") return "after-partial";
    if (phase === "kept") return "already-kept";
    if (phase === "kept-mismatch") return "after-mismatch";
    if (phase === "settled" || phase === "unconfirmed") {
      return this.armed ? undefined : "knobs-moved";
    }
    return "never-tried";
  }

  /**
   * Whether PUT BACK renders, and how (I0, I8, Z-12). Decided on `snapshot`
   * first: `enabled` ONLY when the session is connected AND a snapshot is in
   * hand - including over budget and every failure state with a snapshot;
   * `needs-zona` when a snapshot or a remembered module exists and the session
   * is not connected; `absent` otherwise - no snapshot and no remembered
   * module, and also a connected session with no snapshot in hand
   * (`snapshotting` before the fetch answers, `snapshot-failed` even on a
   * remembered module: the record is consulted only after a fetch passes
   * canWriteBack). A remembered module is not a snapshot, and the component's
   * click writes `snapshot`. `writing` disables it in the component, not here.
   */
  putBackState(): "absent" | "enabled" | "needs-zona" {
    const connected = this.#session.phase === "connected";
    if (this.snapshot !== undefined)
      return connected ? "enabled" : "needs-zona";
    if (!connected && this.rememberedModule) return "needs-zona";
    return "absent";
  }

  /** The session can write at all: not `unsupported`, not `insecure`. */
  #capable(): boolean {
    const phase = this.#session.phase;
    return phase !== "unsupported" && phase !== "insecure";
  }

  /**
   * CLEAR'S ONE ENABLEMENT RULE, IN ONE PLACE (10-UI-SPEC 10.5):
   *
   *   phase in WRITABLE_PHASES && snapshot != null && capability.canWrite
   *
   * SAFE-03 IS SATISFIED BY CONSTRUCTION rather than by a check somebody
   * remembered to write: no snapshot, no clear. The write guard is in the
   * third term and not in a call of its own - canWriteBack gates the snapshot
   * FETCH (src/lib/protocol/write-guard.ts), so a fetch it refused leaves
   * `snapshot` undefined and lands `snapshot-failed`, and `capable` is the
   * browser half of the same verdict (DEGR-02).
   *
   * `connected` is not a fourth term: every phase reachable without a session
   * (`idle`, `lost`) is already outside WRITABLE_PHASES, and clearToDefault()
   * checks the queue and the session anyway before it touches the wire.
   */
  clearEnabled(capable: boolean): boolean {
    return (
      WRITABLE_PHASES.includes(this.phase) &&
      this.snapshot !== undefined &&
      capable
    );
  }

  /**
   * Why CLEAR is disabled, or undefined when it is live - the three reasons of
   * 10-UI-SPEC 10.5's closed table, in precedence order. `writing` is the one
   * phase that reaches the last line with a session and a snapshot in hand,
   * and the component renders CLEARING… (or a control disabled under another
   * action's write) rather than a reason there - the same division of labour
   * PUT BACK uses.
   */
  clearReason(capable: boolean): ClearReason | undefined {
    if (this.clearEnabled(capable)) return undefined;
    if (!capable) return "incapable";
    if (this.snapshot === undefined) return "no-snapshot";
    return "no-session";
  }

  // --- the inline confirmation: the only confirmation on the site (SAFE-05) -

  /** Opens the inline confirmation. Refused unless keepReason() is undefined. */
  openConfirm(): void {
    if (this.keepReason(this.#capable()) !== undefined) return;
    this.confirmOpen = true;
  }

  /** NOT NOW, Escape, a knob move, a session drop - all four exits land here or in their own branch. */
  dismissConfirm(): void {
    this.confirmOpen = false;
  }

  // --- the two RAM clicks ----------------------------------------------------

  /**
   * The refusal list, one reason per line, the first that applies. An
   * over-budget state never reaches the queue, let alone the wire (TUNE-05,
   * D-10): `configMax` is CONFIG_MAX read from the awaited protocol module,
   * never restated - sendConfig refuses at `>= CONFIG_MAX` too, so the two
   * ceilings are one constant from two sides.
   */
  #tryRefusal(
    config: ConfigStrings | undefined,
    configMax: number,
  ): TryRefusal | undefined {
    if (config === undefined) return "measuring";
    if (!WRITABLE_PHASES.includes(this.phase)) return "not-writable";
    if (!this.#queue || this.#session.phase !== "connected")
      return "no-session";
    if (config.setup.length >= configMax) return "over-budget";
    if (config.timer.length >= configMax) return "over-budget";
    return undefined;
  }

  /**
   * TRY ON DEVICE. Refuses - returns without touching the queue - when the
   * pair is undefined (the tuner is measuring), when the phase is not one a
   * write may start from, when the session is not connected, or when either
   * string is at or over the module's limit. From `snapshot-failed` it reads
   * the module again first and writes only if that lands `ready`.
   */
  async tryOnDevice(
    config: ConfigStrings | undefined,
    name: string,
  ): Promise<void> {
    if (this.phase === "snapshot-failed" && config !== undefined) {
      await this.retrySnapshot();
    }
    const { P } = await heavyModules();
    if (this.#tryRefusal(config, P.CONFIG_MAX) !== undefined) return;
    if (config === undefined) return;
    const strings: ConfigStrings = { setup: config.setup, timer: config.timer };
    const ok = await this.#ramLeg("try", strings);
    if (!ok) return;
    this.lastWritten = strings;
    this.name = name;
    this.cause = undefined;
    this.phase = "settled";
    this.#recomputeArmed();
    this.#session.announce(liveSettled(name));
  }

  /**
   * PUT BACK: the snapshot's strings, the same way, to the page they were
   * taken from. After a keep this session the RAM leg is followed by a store
   * leg and the same proof (Z-04, see the header), with no confirmation: the
   * phase stays `writing` between the two, `leg` moves to `store`, and the
   * component renders RESTORED's caption and first line off that pair. A
   * store that proved lands `restored` and clears `keptThisSession`; one that
   * did not lands `restored-unconfirmed` and leaves it set, so the next PUT
   * BACK stores again. LIVE_RESTORED is spoken once, on entry to `restored`.
   */
  async putBack(): Promise<void> {
    const snapshot = this.snapshot;
    if (!snapshot) return;
    if (!WRITABLE_PHASES.includes(this.phase)) return;
    const id = this.#session.identity;
    if (!this.#queue || !id || this.#session.phase !== "connected") return;
    // Pitfall 4: the snapshot is one page's original and goes back to that
    // page only. The page-change re-snapshot keeps these equal; if it could
    // not, refusing is the honest answer rather than a cross-page write.
    if (id.activePage !== this.snapshotPage) return;
    const ok = await this.#ramLeg("put-back", snapshot);
    if (!ok) return;
    this.lastWritten = undefined;
    this.name = undefined;
    if (this.keptThisSession) {
      const outcome = await this.#storeLeg("put-back", snapshot);
      if (outcome === false) return;
      if (outcome !== "kept") {
        this.#fail(
          "restored-unconfirmed",
          outcome === "mismatch" ? "mismatch" : "timeout",
          restoredUnconfirmedBlock().title,
        );
        return;
      }
      this.keptThisSession = false;
    }
    this.cause = undefined;
    this.phase = "restored";
    this.#recomputeArmed();
    this.#session.announce(LIVE_RESTORED);
  }

  // --- the fourth click: CLEAR ---------------------------------------------

  /**
   * CLEAR. Writes the FIRMWARE'S OWN default configuration for the touch
   * element back into the module's RAM - not emptiness (A-48, D-20). The
   * Editor's `clearElement()` is `resetDefault()` followed by `sendToGrid()`,
   * and `resetDefault()` takes each event's own `defaultConfig`; this is the
   * same two strings, through the same one writer, in the same order.
   *
   * RAM ONLY, AND THAT IS ASSERTED BY CLASS RATHER THAN SAID IN COPY (A-26).
   * Two CONFIG/EXECUTE and no PAGESTORE/EXECUTE: the Editor calls
   * sendToGrid(), never store(), so a power cycle brings back whatever is in
   * flash. D-21 fixed the line beside the control at 41 characters and it does
   * not mention the power cycle, so install.spec.ts's by-class count is where
   * that fact now lives.
   *
   * NO COMPILER ON THIS PATH, AND THAT IS DELIBERATE. The try-on writes a
   * configuration the tuner compiled; a clear writes two strings that are
   * already canonical under the pinned minifier (constants.spec.ts pins that),
   * sendConfig takes a plain string, and nothing here needs the Lua formatter.
   * An `await padCompilerReady()` added here would hang 628 KB of WASM off the
   * cheapest write on the site.
   *
   * THE CURRENT PAGE, NOT THE SNAPSHOT'S. Unlike PUT BACK - which carries one
   * page's original back to the page it came from and refuses a cross-page
   * write - a clear resets whatever page the module is on, which is exactly
   * what its line says. The page-change re-snapshot keeps the two equal in
   * practice; nothing here depends on that.
   */
  async clearToDefault(): Promise<void> {
    // The whole of SAFE-03, and the whole of the enablement rule: one call.
    if (!this.clearEnabled(this.#capable())) return;
    if (!this.#queue || this.#session.phase !== "connected") return;
    const { P } = await heavyModules();
    // Read through the lazily resolved protocol module, NEVER from
    // install-copy.ts: these are wire facts and not copy, and install-copy is
    // on the first paint of `/` with zero imports for that reason.
    const defaults: ConfigStrings = {
      setup: P.TOUCH_DEFAULT_SETUP,
      timer: P.TOUCH_DEFAULT_TIMER,
    };
    const ok = await this.#ramLeg("clear", defaults);
    if (!ok) return;
    // Nothing of the visitor's and nothing of HANGAR's is on the module now,
    // so there is nothing to arm and nothing to keep: keepReason() reads
    // `never-tried` from here, which is the closed set's own answer.
    this.lastWritten = undefined;
    this.name = undefined;
    this.cause = undefined;
    // SAFE-07 verbatim: `cleared` is reached only through #ramLeg returning
    // true, which is both CONFIG/ACKNOWLEDGE frames and never a resolved
    // writer promise.
    this.phase = "cleared";
    this.#recomputeArmed();
    this.#session.announce(LIVE_CLEARED);
  }

  // --- the flash store: KEEP ON DEVICE, and the proof ----------------------

  /**
   * The confirmation's affirmative. Refused unless the confirmation is open
   * and the module holds the pair on screen. Stores the pair the module is
   * playing - `lastWritten`, never `config` - and says `kept` only after the
   * proof (D-12). `armed` is recomputed after each outcome and is live again
   * only in `unconfirmed`.
   */
  async keepOnDevice(): Promise<void> {
    if (!this.confirmOpen || !this.armed) return;
    const sent = this.lastWritten;
    const name = this.name ?? "";
    if (!sent || !this.#queue || this.#session.phase !== "connected") return;
    this.confirmOpen = false;
    this.steps = [];
    const outcome = await this.#storeLeg("keep", sent);
    if (outcome === false) return;
    if (outcome === "kept") {
      this.keptThisSession = true;
      this.cause = undefined;
      this.phase = "kept";
      this.#recomputeArmed();
      this.#session.announce(liveKept(name));
      return;
    }
    if (outcome === "mismatch") {
      this.#fail("kept-mismatch", "mismatch", keptMismatchBlock().title);
      return;
    }
    this.#fail("unconfirmed", "timeout", unconfirmedBlock(name).title);
  }

  /**
   * The store leg, shared by the keep and by a put-back after a keep. One
   * PAGESTORE/EXECUTE through the queue under pagestoreMs (3000 ms, from the
   * descriptor; on a rig N acknowledgements resolve it once), then the D-12
   * proof: wait for the ZONA's next heartbeat, then re-fetch both strings for
   * at most REFETCH_ROUNDS rounds with retryBackoffMs between them, kept on the
   * first byte-identical pair. `mismatch` when the rounds run out;
   * `unconfirmed` on the queue's timeout - a store dropped under a bulk NVM
   * operation answers with nothing, no NACK ever (grid_decode.c:979-981);
   * false when the link died (`lost` is already set) or the generation moved.
   */
  async #storeLeg(
    action: InstallAction,
    sent: ConfigStrings,
  ): Promise<StoreOutcome> {
    const gen = this.#generation;
    const q = this.#queue;
    const id = this.#session.identity;
    if (!q || !id) return false;
    const { P, T } = await heavyModules();
    this.action = action;
    this.leg = "store";
    this.cause = undefined;
    this.phase = "writing";
    this.refetchRounds = 0;
    this.#inFlight = true;
    this.#session.writeLock = true;
    this.#armSlow();
    try {
      await q.request(P.storePage(), "store");
      if (gen !== this.#generation) return false;
      // The ACK is sent by the success callback that STARTS the page reload
      // (grid_decode.c:947-961). Wait for the module's next heartbeat, then
      // prove the bytes - see the header for why a fetch that races the
      // reload would call a good store failed.
      await this.#nextHeartbeat();
      if (gen !== this.#generation) return false;
      for (let round = 0; round < REFETCH_ROUNDS; round++) {
        const after = await T.fetchBoth(
          q,
          this.#session.identity ?? id,
          "refetch",
        );
        if (gen !== this.#generation) return false;
        this.refetchRounds = round + 1;
        if (
          after.setup.actionString === sent.setup &&
          after.timer.actionString === sent.timer
        ) {
          return "kept";
        }
        await this.#sleep(P.retryBackoffMs(round));
      }
      return "mismatch";
    } catch (err) {
      // The link died under us: `lost`, whatever the generation says - the
      // "closed" that bumped it is the same event that rejected the waiter
      // (07-06's ordering, Pitfall 11). The store leg's form of the block.
      if (err instanceof T.AbortedError) {
        this.#fail("lost", "aborted", lostBlock(true, TRY_ON_LABEL).title);
        return false;
      }
      if (gen !== this.#generation) return false;
      return "unconfirmed";
    } finally {
      this.#disarmSlow();
      this.#inFlight = false;
      this.#session.writeLock = false;
    }
  }

  /**
   * The shape every RAM action shares. True when both acknowledgements
   * arrived and the generation is still ours; false on every other path, with
   * the phase already classified. The restore heartbeat goes out in the
   * `finally` whatever happened, and the lock is released there too.
   */
  async #ramLeg(
    action: InstallAction,
    strings: ConfigStrings,
  ): Promise<boolean> {
    const gen = this.#generation;
    const q = this.#queue;
    const id = this.#session.identity;
    if (!q || !id) return false;
    const modules = await heavyModules();
    const { T } = modules;
    this.action = action;
    this.leg = "ram";
    this.cause = undefined;
    this.landed = undefined;
    this.failed = undefined;
    this.phase = "writing";
    this.steps = [];
    this.#inFlight = true;
    this.#session.writeLock = true;
    this.#armSlow();
    try {
      // Timer, then Setup, ACK each (sequence.ts writeBoth). Verbatim.
      await T.writeBoth(q, T.targetOf(id), strings);
      if (gen !== this.#generation) return false;
      return true;
    } catch (err) {
      // The link died under us: `lost`, whatever the generation says - the
      // "closed" that bumped it is the same event that rejected the waiter,
      // and it left the phase to this catch (Pitfall 11).
      if (err instanceof T.AbortedError) {
        this.#classify(err, modules, action);
        return false;
      }
      if (gen !== this.#generation) return false;
      this.#classify(err, modules, action);
      return false;
    } finally {
      // MANDATORY on every path. See sequence.ts restorePageChange: a
      // successful CONFIG/EXECUTE clears page_change_enabled and only this
      // sets it back. On a dead link the send throws and is swallowed here.
      // `q` is this leg's queue even if the pacing rule has since rebuilt it:
      // sendImmediate works after abort() by design.
      await T.restorePageChange(q).catch(() => undefined);
      this.#disarmSlow();
      this.#inFlight = false;
      this.#session.writeLock = false;
    }
  }

  /**
   * The taxonomy of a RAM leg, decided by error TYPE and never by message
   * text: the vendored TRANSIENT_WRITE regex matches AbortedError's
   * "interrupted" and would retry a dead link three times (07-RESEARCH
   * Anti-Patterns). Here:
   *
   *   AbortedError                                lost            aborted
   *   NackError, write-timer already ok           partial         nack
   *   NackError otherwise                         nothing-landed  nack
   *   anything else, write-timer ok               partial         timeout
   *   anything else otherwise                     nothing-landed  timeout
   *
   * `partial` is read off the recorded steps - Timer goes first, so the half
   * that landed is Timer and the half that did not is Setup - never off a
   * message. A timeout cause then asks the pacing rule whether to escalate.
   */
  #classify(err: unknown, modules: HeavyModules, action: InstallAction): void {
    const { T } = modules;
    // A-28: the three failure states are REUSED, not invented, and so is the
    // copy. A clear that got neither script through takes PUT BACK's form -
    // "what was playing is still playing" - because that is exactly true of a
    // clear, where the try-on's "your own Setup and Timer are still running"
    // would not be.
    const after = action === "try" ? "try" : "put-back";
    if (err instanceof T.AbortedError) {
      this.#fail("lost", "aborted", lostBlock(false, TRY_ON_LABEL).title);
      return;
    }
    const cause: InstallCause = err instanceof T.NackError ? "nack" : "timeout";
    const timerLanded = this.steps.some(
      (s) => s.id === "write-timer" && s.outcome === "ok",
    );
    if (timerLanded) {
      this.landed = "Timer";
      this.failed = "Setup";
      this.#fail("partial", cause, partialBlock("Timer", "Setup").title);
    } else {
      this.#fail("nothing-landed", cause, nothingLandedBlock(after).title);
    }
    if (cause === "timeout") this.#escalatePacing(modules);
  }

  /**
   * D-19, Pitfall 3. A `write-*` timeout with NO negative acknowledgement
   * anywhere in the action is the signature of the module's ring discarding a
   * frame silently: move the pre-send gap to the desktop's 10 ms and rebuild
   * the queue on the same transport, so the RETRY already on the screen runs
   * the experiment. A NACK anywhere means the module heard us and refused,
   * which is not congestion, and never escalates. Once is enough.
   */
  #escalatePacing(modules: HeavyModules): void {
    if (this.pacingEscalated) return;
    if (this.steps.some((s) => s.outcome === "nack")) return;
    this.#preSendDelayMs = modules.P.DESKTOP_PRE_SEND_DELAY_MS;
    this.pacingEscalated = true;
    this.#buildQueue(modules.T);
  }

  // --- the 2000 ms line (Z-09) ---------------------------------------------

  /**
   * A setTimeout on the store, armed at the start of every leg and cleared in
   * its finally. When it fires, `slow` renders the one honest line and the
   * live region says LIVE_STILL_WRITING once. The arithmetic: 2000 ms is
   * roughly 90x the slowest CONFIG/EXECUTE ever observed (21.6 ms) on a RAM
   * leg, roughly 50x the slowest PAGESTORE/ACKNOWLEDGE (38.7 ms) on a store
   * leg, and below the 3000 ms pagestoreMs on purpose - the line says busy;
   * only the timeout says failed (I11, I12). Never an interval.
   */
  #armSlow(): void {
    this.#disarmSlow();
    this.#slowTimer = setTimeout(() => {
      this.#slowTimer = undefined;
      this.slow = true;
      this.#session.announce(LIVE_STILL_WRITING);
    }, SLOW_LINE_MS);
  }

  #disarmSlow(): void {
    if (this.#slowTimer !== undefined) clearTimeout(this.#slowTimer);
    this.#slowTimer = undefined;
    this.slow = false;
  }

  /** Publish a failure and speak its title, with the full stop the live region adds. */
  #fail(phase: InstallPhase, cause: InstallCause, title: string): void {
    this.phase = phase;
    this.cause = cause;
    this.#recomputeArmed();
    this.#session.announce(announceTitle(title));
  }
}

// The singleton is built over the session's singleton, at module scope, and
// starts nothing: start() is the root layout's to call from onMount.

/** The one instance components read. Tests never touch it. */
export const install = new InstallStore(session);
