// The install store: the snapshot at connect, the flash store - the page's
// five defaults, the configuration's five strings, the page store, the proof
// - the header's Clear, the probe's RAM legs (TRY, PUT BACK, the discard) and
// every way a write can go wrong (Phase 7, SAFE-01, SAFE-03 to SAFE-09).
// Every write on the site lives here and never in the session
// (session.spec.ts "writes nothing across a whole visit, and cannot" scans the
// session for eleven write-shaped needles). Components read the singleton
// `install`; every node test constructs its own `new InstallStore(session)`.
//
// Decided at 07-04 (07-CONTEXT D-16); see .planning/phases/07-install-flow/07-04-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
//
// RULES A SPEC ENFORCES, one line each:
//   four static specifiers and no more (install.spec.ts "the file's shape"):
//     ./install-copy, ./page-target, ./snapshot, ./session.svelte; protocol
//     and transport arrive by await import() in heavyModules()
//   no $derived (the same title): derived answers are methods, or `armed`
//   no setInterval, no raw onData, no direct write (the same title)
//   the write order is SLOTS (sequence.ts): 255/6, 255/0, 255/4, 0/6, 0/0
//   the page target is folded into Phase 7's rules (13-CONTEXT D-06; 13.1-CONTEXT
//     D-05 struck clause 2): a switch is the Target select's change and nothing
//     else; THE KEYBOARD FACT, NAMED (13.1-PLAN-CHECK W-03): a closed <select>
//     fires change on every arrow press, so each press is a switch until it disables
//   no comment here spells an erase, clear or page class by name
//     (forbidden-instructions.spec.ts reads this file raw): the event numbers
//
// CONTENTS, the class's banners in order: reactive fields - NOT reactive
// record - start - the connection lifecycle - the snapshot - the tuner's pair
// and armed - the two closed decisions - the inline confirmation - the page
// target - the probe's RAM clicks - the header's click, CLEAR - the flash
// store, STORE ON ZONA, and the proof - the 2000 ms line - the singleton.
import {
  type ClearReason,
  type FailedWords,
  FIRMWARE_DEFAULT_NAME,
  KEEP_LABEL,
  type KeepReason,
  type LandedWords,
  LIVE_STILL_WRITING,
  announceTitle,
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
  PageTarget,
  type PageTargetView,
  type TargetStatus,
} from "./page-target";
import {
  type SnapshotStore,
  hasSnapshotFor,
  lastModuleId,
  persistIfAbsent,
  readSnapshot,
  rememberLast,
} from "./snapshot";
import { type ConnectionEvent, DeviceSession, session } from "./session.svelte";

// Type-only references: erased, so none is a specifier the chunk guard sees.
type Protocol = typeof import("$lib/protocol");
type Transport = typeof import("$lib/transport");
type Identity = import("$lib/transport").Identity;
type RequestQueue = import("$lib/transport").RequestQueue;
type CaptureStep = import("$lib/transport").CaptureStep;
type DecodedClass = import("$lib/protocol").DecodedClass;

/**
 * The fifteen states of 07-UI-SPEC's machine (fourteen until 10-12).
 * `cleared` is its own state: after a clear the module runs the firmware's
 * own default, which neither `settled` nor `restored` describes truthfully
 * (A-50, D-20). `snapshot-failed` is I9's cause 4; the other I9 causes are
 * read off the session, the tuner's budget and `snapshotting` / `writing`
 * by the component. Since 2026-09-16 `settled` is the /dev/install/ probe's
 * alone, like `restored`: no route reaches a RAM-only landing (the bar's
 * clause and the anti-collapse test keep it in the union by name).
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
/** `discard` joined the four at 13-12: the firmware-native revert (the page-discard class), reachable from the probe only until the bench. */
export type InstallAction = "try" | "put-back" | "keep" | "clear" | "discard";
export type InstallLeg = "ram" | "store";
/** Why an action ended where it did. Rendered by no block in v1; asserted by the spec and recorded in the capture. */
export type InstallCause = "timeout" | "nack" | "aborted" | "mismatch";
/**
 * The tuner's FIVE strings, verbatim (D-10), keyed as sequence.ts's SLOTS
 * names them; the writer owns the order, not this type. Declared here, not
 * imported: a type import is still a specifier. `system` is the SYSTEM
 * element's Setup (255/0, 12-03), `systemTimer` its Timer (255/6, 12.1-07),
 * `systemUtility` its Utility (255/4, 13-17): none metered, each substituted
 * from "" in #systemStringOr, each snapshotted, restored and cleared with the
 * touch pair. One shape for every producer - the tuner's measureLuaRoute and
 * land, the presets, src/lib/sandbox/land.ts - and install.spec.ts pins the
 * one consumption path.
 */
export type ConfigStrings = {
  readonly systemTimer: string;
  readonly system: string;
  readonly systemUtility: string;
  readonly setup: string;
  readonly timer: string;
};
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
  protocolLib: Protocol;
  transportLib: Transport;
}

/**
 * The phases a write may start from: every settled outcome of an earlier
 * action, plus `ready`. `snapshot-failed` retries the snapshot first and
 * writes only if that lands; #pageCheck re-snapshots from the same list.
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

/**
 * One reason per refusal; the guard returns the first that applies.
 * `page-pending` (13-12): the page target is not at rest.
 */
type TryRefusal =
  | "measuring"
  | "not-writable"
  | "no-session"
  | "page-pending"
  | "over-budget";

/**
 * The memoised module promise, module scope like the session's: ES modules
 * are singletons and it carries no store state. The session's open path
 * awaited both before "connected" could fire, so every await below is a
 * cache hit.
 */
let heavy: Promise<HeavyModules> | undefined;
async function loadHeavy(): Promise<HeavyModules> {
  const protocolLib = await import("$lib/protocol");
  const transportLib = await import("$lib/transport");
  return { protocolLib, transportLib };
}
const heavyModules = (): Promise<HeavyModules> => (heavy ??= loadHeavy());

/**
 * The browser's storage, read inside a try: a browser configured to refuse
 * storage can throw on the property ACCESS (Pitfall 9), and the server has no
 * window. `undefined` means session-only.
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
  /**
   * True exactly when Store on ZONA may write (2026-09-16): a session with a
   * queue, a writable phase (or `snapshot-failed`, which the click re-reads
   * first), the page target at rest, the pair published and inside 908. Until
   * 2026-09-16 it meant "the module holds the pair on screen" (Z-05); that
   * predicate is `keepReason()`'s already-kept row now.
   */
  armed = $state(false);
  /** True from a proved keep - or, since round 4c, a proved clear - until a put-back that stored (Z-04). */
  storedThisSession = $state(false);
  confirmOpen = $state(false);
  /** partial's two lists as the words the block interpolates (I7); install-copy.ts's closed unions say which pairings the ONE writer can produce. */
  landed = $state.raw<LandedWords | undefined>(undefined);
  failed = $state.raw<FailedWords | undefined>(undefined);
  /**
   * The same two lists as SLOT LABELS in write order, off sequence.ts's SLOTS
   * by #classify (12.1-07): the acknowledged prefix and the rest. Empty
   * outside `partial`; read by the probe and the spec.
   */
  landedSlots = $state.raw<readonly string[]>([]);
  failedSlots = $state.raw<readonly string[]>([]);
  /** True when the snapshot came from a `hangar.snapshot.v1` record, so its `system` is the firmware default (12-03). Read by the probe and the spec. */
  snapshotFromV1 = $state(false);
  /** True when the snapshot came from a `hangar.snapshot.v2` record, so its `systemTimer` is the firmware's default (12.1-07, D-22); a v1 record sets `snapshotFromV1` alone. */
  snapshotFromV2 = $state(false);
  /** True when the snapshot came from a `hangar.snapshot.v3` record, so its `systemUtility` is the firmware's page-next (13-17). Read by the probe and the spec. */
  snapshotFromV3 = $state(false);
  /** True once a write timeout with no NACK moved the pre-send gap to the desktop's 10 ms (D-19). Shown by the probe; never reset in a page load. */
  pacingEscalated = $state(false);
  /**
   * The page target's mirror (13-12): four scalars and one list, replaced
   * whole from page-target.ts's onChange. `pages` is the module's own
   * enumeration, empty until the PAGECOUNT answer lands and on every
   * reconnect. Components render these and gate on pageSettled(), below.
   */
  pageStatus = $state<TargetStatus>("reported");
  pageReported = $state.raw<number | undefined>(undefined);
  pageRequested = $state.raw<number | undefined>(undefined);
  pages = $state.raw<readonly number[]>([]);
  /** pageSettled() as a rune for the components, assigned from the target's canApply() in the same mirror. */
  applyReady = $state(false);

  // --- NOT reactive: the record of the last action, and the machinery -------

  /**
   * The capture steps of the LAST action as the queue reported them, in
   * order; replaced when an action starts. Plain, never a rune: #classify and
   * the pacing rule read it, nothing renders it.
   */
  steps: CaptureStep[] = [];
  /** How many re-fetch rounds the last store leg took, for the runbook's row E. Plain, like `steps`. */
  refetchRounds = 0;

  readonly #session: DeviceSession;
  #storage: SnapshotStore | undefined;
  #now: (() => number) | undefined;
  #sleep: (ms: number) => Promise<void> = defaultSleep;
  /** The two heavy modules once #attach has awaited them, for the paths that cannot await (the "closed" branch). */
  #modules: HeavyModules | undefined;
  /**
   * The connection generation (Pitfall 11): bumped on every "connected" and
   * every "closed"; an action captures it at its start and discards a result
   * whose generation is stale.
   */
  #generation = 0;
  /** The ONE queue of the current connection, or undefined. */
  #queue: RequestQueue | undefined;
  #unsubscribeClass: (() => void) | undefined;
  /** True while a leg is in flight; "closed" leaves the phase to the leg's catch when it is. */
  #inFlight = false;
  /**
   * The pre-send gap the next queue is built with: PRE_SEND_DELAY_MS (0) once
   * the protocol module is in hand, DESKTOP_PRE_SEND_DELAY_MS after a write
   * timeout with no NACK (D-19).
   */
  #preSendDelayMs: number | undefined;
  /** The 2000 ms line's pending timer. A setTimeout, never an interval. */
  #slowTimer: ReturnType<typeof setTimeout> | undefined;
  /** Store legs waiting for the module's next heartbeat, resolved from the onClass sink. */
  #heartbeatWaiters: { resolve: () => void; reject: (err: Error) => void }[] =
    [];
  #started = false;
  /**
   * The page target (13-12), built once the protocol module is in hand: its
   * window is PAGE_SWITCH_WINDOW_MS, named only through the awaited module.
   */
  #target: PageTarget | undefined;

  constructor(session: DeviceSession) {
    this.#session = session;
  }

  /** The target's mirror: one assignment per field, from one view; `armed` reads the target, so it is recomputed here too. */
  #mirrorTarget(view: PageTargetView): void {
    this.pageStatus = view.status;
    this.pageReported = view.reported;
    this.pageRequested = view.requested;
    this.pages = view.pages;
    this.applyReady = this.#target?.canApply() ?? false;
    this.#recomputeArmed();
  }

  /** The target, built on first need with the protocol module's window. */
  #targetWith(protocolLib: Protocol): PageTarget {
    return (this.#target ??= new PageTarget({
      windowMs: protocolLib.PAGE_SWITCH_WINDOW_MS,
      onChange: (view) => this.#mirrorTarget(view),
    }));
  }

  /**
   * THE ONE CONDITION EVERY WRITE READS (13-12, D-06): the page target is at
   * rest and the module's own report agrees with it. False through
   * `requested`, `switching` and `unverified`, and before any report.
   * Delegates to the target's canApply() and restates nothing.
   */
  pageSettled(): boolean {
    return this.#target?.canApply() ?? false;
  }

  /** The last action's steps, for the probe and for the pacing rule. */
  get lastSteps(): readonly CaptureStep[] {
    return this.steps;
  }

  // --- start: synchronous, idempotent, and it touches no phase of the session

  /**
   * Reads the record for the "needs your ZONA" form and subscribes to the
   * session. Idempotent; touches no phase of the session; opens nothing.
   */
  start(env: InstallEnv = {}): void {
    if (this.#started) return;
    this.#started = true;
    this.#storage = env.storage ?? defaultStorage();
    this.#now = env.now;
    if (env.sleep) this.#sleep = env.sleep;

    // I0, Z-12: a fresh tab that once identified a module with a durable
    // record renders PUT BACK disabled with "Needs your ZONA connected."
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
    // "closed" also fires from the session's teardown with NO "connected"
    // before it (07-04), so each release is guarded on existence and the
    // generation is bumped regardless.
    this.#generation++;
    this.#queue?.abort("closed");
    this.#unsubscribeClass?.();
    this.#unsubscribeClass = undefined;
    this.#queue = undefined;
    // A store leg waiting for a heartbeat hears that the link is gone.
    this.#rejectHeartbeatWaiters("closed");
    // Flash only what you have heard (Z-21): a session drop is one of the
    // confirmation's four exits.
    this.confirmOpen = false;
    // The page target knows nothing about a module that is gone (13-12); the
    // reconnect reports.
    this.#target?.reset();
    if (!this.#inFlight) {
      // Nothing in flight: back to idle. `snapshot`, `moduleId` and
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
   * Build this connection's ONE queue over the session's write view, fed from
   * onClass(), and take the snapshot. The heavy modules are a cache hit here:
   * the session's open path resolved them before "connected" could fire.
   */
  async #attach(gen: number): Promise<void> {
    const modules = await heavyModules();
    this.#modules = modules;
    if (gen !== this.#generation) return;
    const id = this.#session.identity;
    if (!id) return;
    this.#preSendDelayMs ??= modules.protocolLib.PRE_SEND_DELAY_MS;
    // The target starts from nothing on every connection and hears the page
    // the identity carried - the module's own first report (13-12).
    const target = this.#targetWith(modules.protocolLib);
    target.reset();
    target.observeReport(id.activePage);
    const queue = this.#buildQueue(modules.transportLib);
    if (!queue) return;
    await this.#snapshot(id, queue, gen);
  }

  /**
   * The queue over the session's write view with the current pre-send gap,
   * subscribed to the session's class pump; any earlier queue is aborted and
   * unsubscribed first, so there is never a second one delivering. Used at
   * "connected" and again by the pacing escalation.
   */
  #buildQueue(transportLib: Transport): RequestQueue | undefined {
    const transport = this.#session.transport;
    if (!transport) return undefined;
    this.#queue?.abort("replaced");
    this.#unsubscribeClass?.();
    const queue = new transportLib.RequestQueue(transport, {
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
   * The store's own reading of the class pump, beside the queue's: a
   * heartbeat from the ZONA resolves the store leg waiting for one (the D-12
   * proof) and asks whether the module's page moved. Anything else is the
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
    // The fold publishes the identity AFTER its sinks ran for this frame, so
    // the page read waits one microtask; the target reads the same published
    // page (13-12) - the identity's activePage IS the module's page report.
    queueMicrotask(() => {
      this.#pageCheck();
      const page = this.#session.identity?.activePage;
      if (page !== undefined) this.#target?.observeReport(page);
    });
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
    const transportLib = this.#modules?.transportLib;
    const err = transportLib
      ? new transportLib.AbortedError(`heartbeat wait ended (${reason})`)
      : new Error(reason);
    for (const waiter of waiters) waiter.reject(err);
  }

  /**
   * Pitfall 4's third layer: the module's reported page differs from the
   * snapshot's and nothing is in flight, so read the module again for the new
   * page - PUT BACK then writes the page it snapshotted and the record gains
   * a second entry. Never from `writing` or `snapshotting`.
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
   * Each step gates the next (07-RESEARCH Code Examples 1): 1. the module
   * names itself ("fetch-serial"; a timeout degrades to a session-only
   * snapshot and never throws); 2. all FIVE strings come back on the module's
   * REPORTED page and pass canWriteBack (D-03: the empty string is what a
   * fetch of a non-active page produces; a factory module's own defaults are
   * 24, 22 and 19 characters); 3. the set is held IN MEMORY; 4. only then is
   * the durable record consulted, and written IF ABSENT. `ready` publishes
   * after all of that.
   */
  async #snapshot(id: Identity, q: RequestQueue, gen: number): Promise<void> {
    this.phase = "snapshotting";
    this.#recomputeArmed();
    this.steps = [];
    const { protocolLib, transportLib } = await heavyModules();

    let moduleId: string | undefined;
    try {
      moduleId = await transportLib.fetchModuleKey(q, id);
    } catch {
      // Unproven on hardware (runbook row A). Degrade, never throw: the
      // in-memory half still works and the copy says "this tab only".
      moduleId = undefined;
    }
    if (gen !== this.#generation) return;

    let set: Awaited<ReturnType<Transport["fetchAll"]>>;
    try {
      set = await transportLib.fetchAll(q, id);
    } catch {
      if (gen !== this.#generation) return;
      this.#fail(
        "snapshot-failed",
        "timeout",
        snapshotFailedBlock(this.#page()).title,
      );
      return;
    }
    if (gen !== this.#generation) return;

    // THE ENUMERATION (13-12), once per connection, after the five fetches
    // (their step ids read as before) and before `ready`. A read, never a
    // write; enumerate() never throws (Bible section 9: enumerate, never
    // assume four).
    const target = this.#targetWith(protocolLib);
    if (target.pages.length === 0) {
      await target.enumerate(q, protocolLib, id.zona);
    }
    if (gen !== this.#generation) return;

    // D-03 over Z-16: an empty string is refused BEFORE the record is
    // consulted, so a remembered module whose RAM reads empty on this page is
    // not offered its own record (deferred to 07-13). One guard per SLOTS row.
    const guard = protocolLib.canWriteBack(
      transportLib.SLOTS.map((slot) => set[slot.key]),
    );
    if (!guard.ok) {
      this.#fail(
        "snapshot-failed",
        "timeout",
        snapshotFailedBlock(this.#page()).title,
      );
      return;
    }
    const fetched: ConfigStrings = {
      systemTimer: set.systemTimer.actionString ?? "",
      system: set.system.actionString ?? "",
      systemUtility: set.systemUtility.actionString ?? "",
      setup: set.setup.actionString ?? "",
      timer: set.timer.actionString ?? "",
    };

    // IN MEMORY FIRST: storage is a courtesy and never the reason a visitor
    // has no way back (Pitfall 9). The defaults are passed in because
    // snapshot.ts imports nothing; a record older than v4 (12-03, 12.1-07
    // D-22, 13-17) is read with the firmware's own in each missing slot and
    // `fromV1` / `fromV2` / `fromV3` say so. `hangar.snapshot.v4` is written;
    // v3, v2 and v1 are read and never written.
    const record = moduleId
      ? readSnapshot(this.#storage, moduleId, id.activePage, {
          system: protocolLib.SYSTEM_DEFAULT_SETUP,
          systemTimer: protocolLib.SYSTEM_DEFAULT_TIMER,
          systemUtility: protocolLib.SYSTEM_DEFAULT_UTILITY,
        })
      : undefined;
    // An existing original WINS over a fresh fetch: after a Store (or the
    // probe's TRY) a re-connect fetches HANGAR's own configuration.
    this.snapshot = record
      ? {
          systemTimer: record.systemTimer,
          system: record.system,
          systemUtility: record.systemUtility,
          setup: record.setup,
          timer: record.timer,
        }
      : fetched;
    this.snapshotFromV1 = record?.fromV1 ?? false;
    this.snapshotFromV2 = record?.fromV2 ?? false;
    this.snapshotFromV3 = record?.fromV3 ?? false;
    this.snapshotPage = id.activePage;
    this.moduleId = moduleId;
    if (moduleId) {
      // The record's timestamp, read once as a string. Not a SvelteDate:
      // svelte/reactivity would be a fifth static specifier.
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
    this.#session.announce(liveSnapshotSaved(this.#page()));
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
    // Flash only what you have heard (Z-21): a change that would disable the
    // control - the pair withdrawn while measuring, over budget, or back to
    // the pair already stored - closes the confirmation, one of its four
    // exits. A change that keeps Store live leaves it open: the click writes
    // what the screen shows at that moment.
    if (
      this.confirmOpen &&
      (!this.armed || this.keepReason(this.#capable()) !== undefined)
    ) {
      this.confirmOpen = false;
    }
  }

  /**
   * Store on ZONA may write (2026-09-16): #storeRefusal's list is empty.
   * Recomputed here, after every leg and on every target mirror, never
   * derived (the header's rule). False before the protocol module is in hand
   * - no queue, so nothing to write with.
   */
  #recomputeArmed(): void {
    const lib = this.#modules?.protocolLib;
    this.armed =
      lib !== undefined &&
      this.#storeRefusal(this.config, lib.CONFIG_MAX) === undefined;
  }

  /**
   * The module holds the pair the visitor is looking at: the last landed RAM
   * leg's five strings against the published pair, substituted (Z-05's old
   * `armed`). Read by keepReason()'s already-kept row alone.
   */
  #holdsConfig(): boolean {
    const written = this.lastWritten;
    const current = this.config;
    return (
      written !== undefined &&
      current !== undefined &&
      this.#systemStringOr(current, 6) === written.systemTimer &&
      this.#systemStringOr(current, 0) === written.system &&
      this.#systemStringOr(current, 4) === written.systemUtility &&
      current.setup === written.setup &&
      current.timer === written.timer
    );
  }

  /**
   * The system element's string for one event, or the firmware's own default
   * where the tuner published "" - the one substitution point, read by the
   * write path and by `armed` alike (12-03 for 255/0, 12.1-07 for 255/6,
   * 13-17 for 255/4; no module under src/lib/tune/ may name a firmware
   * default, ladder.spec.ts). `event` is the slot's event number: 0 the
   * Setup (`system`), 6 the Timer (`systemTimer`), 4 the Utility
   * (`systemUtility`). Reads a FIELD, never a kind: the store cannot tell a
   * surface from an entry (13-17).
   */
  #systemStringOr(
    config: ConfigStrings,
    event: 0 | 4 | 6,
    protocolLib?: Protocol,
  ): string {
    const lib = protocolLib ?? this.#modules?.protocolLib;
    if (event === 6) {
      return config.systemTimer !== ""
        ? config.systemTimer
        : (lib?.SYSTEM_DEFAULT_TIMER ?? "");
    }
    if (event === 4) {
      return config.systemUtility !== ""
        ? config.systemUtility
        : (lib?.SYSTEM_DEFAULT_UTILITY ?? "");
    }
    return config.system !== ""
      ? config.system
      : (lib?.SYSTEM_DEFAULT_SETUP ?? "");
  }

  // --- the two closed decisions the components render ----------------------

  /**
   * Why Store on ZONA is disabled with a sentence, or undefined when nothing
   * in the closed record applies (Z-05, Z-21; 2026-09-16). One function, four
   * rows, first match wins:
   *
   *   !capable                                   incapable
   *   no queue, or the session not connected     no-session
   *   kept, and the module holds the pair        already-kept
   *   anything else                              undefined
   *
   * Every other disabled moment - measuring, over budget, the snapshot or a
   * leg in flight, the page target not at rest - is `armed` false with no
   * sentence of this record's; the zone disables on `armed`. From `partial`,
   * `kept-mismatch`, `unconfirmed`, `nothing-landed` and `cleared` the store
   * IS the retry, so none of them is a row. `capable` is the session's (not
   * `unsupported`, not `insecure`).
   */
  keepReason(capable: boolean): KeepReason | undefined {
    if (!capable) return "incapable";
    // `phase` is read FIRST and unconditionally: a $derived over this method
    // tracks it, and the queue (not a rune) is built before the phase leaves
    // `idle`, so the no-session row lifts when the phase moves.
    const phase = this.phase;
    if (
      phase === "idle" ||
      !this.#queue ||
      this.#session.phase !== "connected"
    ) {
      return "no-session";
    }
    if (phase === "kept" && this.#holdsConfig()) return "already-kept";
    return undefined;
  }

  /**
   * Whether the restore is offered, and how (I0, I8, Z-12) - read by the
   * /dev/install/ probe alone since 13.1-06 (D-07). `enabled` only when the
   * session is connected AND a snapshot is in hand; `needs-zona` when a
   * snapshot or a remembered module exists and the session is not connected;
   * `absent` otherwise - a remembered module is not a snapshot, and the
   * record is consulted only after a fetch passes canWriteBack. `writing`
   * disables it in the component, not here.
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
   * CLEAR's one enablement rule (10-UI-SPEC 10.5): phase in WRITABLE_PHASES
   * && snapshot != null && capability.canWrite. SAFE-03 by construction: no
   * snapshot, no clear - canWriteBack gates the snapshot FETCH
   * (protocol/write-guard.ts) and `capable` is the browser half (DEGR-02).
   * `connected` is not a fourth term: every phase reachable without a session
   * is outside WRITABLE_PHASES, and clearToDefault() checks the queue anyway.
   */
  clearEnabled(capable: boolean): boolean {
    return (
      WRITABLE_PHASES.includes(this.phase) &&
      this.snapshot !== undefined &&
      capable &&
      // 13-12: and the page target at rest - a clear resets the page the
      // module is ON.
      this.pageSettled()
    );
  }

  /**
   * Why CLEAR is disabled, or undefined when live: 10-UI-SPEC 10.5's three
   * reasons in precedence order. Two disabled moments name no reason -
   * `writing`, and since 13-12 a page target not at rest - and the component
   * disables and holds its last line through both.
   */
  clearReason(capable: boolean): ClearReason | undefined {
    if (this.clearEnabled(capable)) return undefined;
    if (!capable) return "incapable";
    if (this.snapshot === undefined) return "no-snapshot";
    // 13-12: a pending page target with a session and a snapshot in hand has
    // no word in the closed record on purpose - the destination zone carries
    // that line, and Clear.svelte disables on `applyReady`.
    if (this.#queue && this.#session.phase === "connected") return undefined;
    return "no-session";
  }

  // --- the inline confirmation: the only confirmation on the site (SAFE-05) -

  /** Opens the inline confirmation. Refused unless the store is armed and keepReason() is undefined. */
  openConfirm(): void {
    if (!this.armed) return;
    if (this.keepReason(this.#capable()) !== undefined) return;
    this.confirmOpen = true;
  }

  /** NOT NOW, Escape, a knob move, a session drop - all four exits land here or in their own branch. */
  dismissConfirm(): void {
    this.confirmOpen = false;
  }

  // --- the page target: the change, the switch, the revert (13-12, D-06; 13.1 D-05) ---

  /**
   * THE SELECT'S CHANGE, IN ONE CALL (13.1-CONTEXT D-05): the target's
   * request() then its confirm(), with no review between. True exactly when
   * the switch LEFT (the target is `switching` after confirmPage()); false
   * with nothing sent when requestPage() refused or confirmPage()
   * early-returned on its own guards - then the target is taken back with
   * cancelPage() so Store is not parked disabled at `requested`
   * (13.1-PLAN-CHECK W-04). The routes snap the select back on false.
   */
  async switchPage(page: number): Promise<boolean> {
    if (!this.requestPage(page)) return false;
    await this.confirmPage();
    if (this.pageStatus !== "switching") {
      this.cancelPage();
      return false;
    }
    return true;
  }

  /**
   * The page the copy names: the snapshot's page (install-copy D-23). The 0
   * stands in only for the snapshot-failed title, which names no page.
   */
  #page(): number {
    return this.snapshotPage ?? 0;
  }

  /**
   * SET THE TARGET; sends nothing (install.e2e.ts counts the switch class at
   * zero across a cycle that opens the menu). switchPage() calls it first,
   * the /dev/install/ probe alone. Closes the flash confirmation if open
   * (Z-21). False while a switch is pending, before the module has reported,
   * while a leg is in flight, and for the page the module is already on.
   */
  requestPage(page: number): boolean {
    if (this.#inFlight || this.phase === "writing") return false;
    const target = this.#target;
    if (!target || this.#session.phase !== "connected") return false;
    const opened = target.request(page);
    if (opened) this.confirmOpen = false;
    return opened;
  }

  /** A refused change, a session drop, the probe, `unverified`'s programmatic way out: the target is the module's page again. Sends nothing. */
  cancelPage(): void {
    this.#target?.cancel();
  }

  /**
   * THE SEND - the second half of the select's change and the only caller of
   * the target's confirm(): the restore heartbeat, then the switch, through
   * this connection's one queue; the module's own report ends the wait or the
   * window lands `unverified`. Refused while a leg is in flight:
   * sendImmediate drops a frame under an outstanding write (07-RESEARCH
   * Pitfall 2). Called by switchPage() and by the /dev/install/ probe.
   */
  async confirmPage(): Promise<void> {
    if (this.#inFlight || this.phase === "writing") return;
    const q = this.#queue;
    const id = this.#session.identity;
    const target = this.#target;
    if (!q || !id || !target || this.#session.phase !== "connected") return;
    const { protocolLib } = await heavyModules();
    await target.confirm(q, protocolLib, id.zona);
  }

  /**
   * THE FIRMWARE-NATIVE REVERT (the page-discard class, 13-12): reload the
   * active page from flash, undoing every RAM write since the last store
   * without the snapshot (grid_decode.c:895-915). UNPROVEN ON HARDWARE and
   * reachable from the /dev/install/ probe only until docs/INSTALL-RUNBOOK.md
   * row I; no public control. A RAM-only action with a store's wire shape, so
   * it runs under the same lock, slow line and generation check, the restore
   * heartbeat after it. Lands `kept` if this session stored, else
   * `restored`. Gated like a clear.
   */
  async revertToStored(): Promise<void> {
    if (!this.clearEnabled(this.#capable())) return;
    const q = this.#queue;
    const id = this.#session.identity;
    if (!q || !id || this.#session.phase !== "connected") return;
    const gen = this.#generation;
    const { protocolLib, transportLib } = await heavyModules();
    this.action = "discard";
    this.leg = "ram";
    this.cause = undefined;
    this.phase = "writing";
    this.#recomputeArmed();
    this.steps = [];
    this.#inFlight = true;
    this.#session.writeLock = true;
    this.#armSlow();
    try {
      await q.request(protocolLib.discardPage(), "discard");
      if (gen !== this.#generation) return;
      const kept = this.storedThisSession;
      this.lastWritten = undefined;
      this.name = undefined;
      this.cause = undefined;
      this.phase = kept ? "kept" : "restored";
      this.#recomputeArmed();
      this.#session.announce(
        kept ? liveKept(this.#page()) : liveRestored(this.#page()),
      );
    } catch (err) {
      if (err instanceof transportLib.AbortedError) {
        this.#fail(
          "lost",
          "aborted",
          lostBlock(false, KEEP_LABEL, this.#page()).title,
        );
        return;
      }
      if (gen !== this.#generation) return;
      // A discard dropped under a bulk operation answers with nothing, like a
      // store (grid_decode.c:907-909): the restore's own unconfirmed form.
      this.#fail(
        "restored-unconfirmed",
        err instanceof transportLib.NackError ? "nack" : "timeout",
        restoredUnconfirmedBlock(this.#page()).title,
      );
    } finally {
      await transportLib.restorePageChange(q).catch(() => undefined);
      this.#disarmSlow();
      this.#inFlight = false;
      this.#session.writeLock = false;
    }
  }

  // --- the probe's RAM clicks: TRY, PUT BACK ---------------------------------

  /**
   * The refusal list every write reads, first match wins. Over budget never
   * reaches the queue (TUNE-05, D-10): `configMax` is CONFIG_MAX from the
   * awaited protocol module, and sendConfig refuses at the same constant from
   * the other side.
   */
  #tryRefusal(
    config: ConfigStrings | undefined,
    configMax: number,
    rereads = false,
  ): TryRefusal | undefined {
    if (config === undefined) return "measuring";
    if (
      !WRITABLE_PHASES.includes(this.phase) &&
      !(rereads && this.phase === "snapshot-failed")
    ) {
      return "not-writable";
    }
    if (!this.#queue || this.#session.phase !== "connected")
      return "no-session";
    // 13-12: nothing writes while the page target is not at rest.
    if (!this.pageSettled()) return "page-pending";
    if (config.setup.length >= configMax) return "over-budget";
    if (config.timer.length >= configMax) return "over-budget";
    return undefined;
  }

  /**
   * Store on ZONA's refusal list - `armed`'s predicate: #tryRefusal's, with
   * `snapshot-failed` admitted because the click re-reads the module first
   * and writes only if that lands `ready` (SAFE-03 by the retry).
   */
  #storeRefusal(
    config: ConfigStrings | undefined,
    configMax: number,
  ): TryRefusal | undefined {
    return this.#tryRefusal(config, configMax, true);
  }

  /**
   * TRY ON DEVICE - the /dev/install/ probe's alone since 2026-09-16 (no
   * route calls it; Store on ZONA is the routes' one write): the five strings,
   * the three system slots substituted through #systemStringOr (12-03,
   * 12.1-07, 13-17), through #ramLeg in SLOTS order, landing `settled` with
   * `lastWritten` and `name` set. Refuses on #tryRefusal's list without
   * touching the queue; from `snapshot-failed` it reads the module again
   * first and writes only if that lands `ready`.
   */
  async tryOnDevice(
    config: ConfigStrings | undefined,
    name: string,
  ): Promise<void> {
    if (this.phase === "snapshot-failed" && config !== undefined) {
      await this.retrySnapshot();
    }
    const { protocolLib } = await heavyModules();
    if (this.#tryRefusal(config, protocolLib.CONFIG_MAX) !== undefined) return;
    if (config === undefined) return;
    const strings: ConfigStrings = {
      systemTimer: this.#systemStringOr(config, 6, protocolLib),
      system: this.#systemStringOr(config, 0, protocolLib),
      systemUtility: this.#systemStringOr(config, 4, protocolLib),
      setup: config.setup,
      timer: config.timer,
    };
    const ok = await this.#ramLeg("try", strings);
    if (!ok) return;
    this.lastWritten = strings;
    this.name = name;
    this.cause = undefined;
    this.phase = "settled";
    this.#recomputeArmed();
    this.#session.announce(liveSettled(this.#page()));
  }

  /**
   * THE RESTORE - putBack(), the /dev/install/ probe's alone since 13.1-06
   * (D-07; install.spec.ts drives it on the fake): the snapshot's five
   * strings through #ramLeg to the page they came from, then - after a keep
   * this session - the store leg and the same proof, with no confirmation
   * (Z-04); `leg` moves to `store` between them. Lands `restored` and clears
   * `storedThisSession`; a store that did not prove lands
   * `restored-unconfirmed` and leaves it set, so the next put-back stores
   * again. LIVE_RESTORED is spoken once, on entry to `restored`.
   */
  async putBack(): Promise<void> {
    const snapshot = this.snapshot;
    if (!snapshot) return;
    if (!WRITABLE_PHASES.includes(this.phase)) return;
    const id = this.#session.identity;
    if (!this.#queue || !id || this.#session.phase !== "connected") return;
    // 13-12: not while a switch is pending or unverified.
    if (!this.pageSettled()) return;
    // Pitfall 4: one page's original goes back to that page only; the
    // page-change re-snapshot keeps these equal, and refusing is the honest
    // answer when it could not.
    if (id.activePage !== this.snapshotPage) return;
    const ok = await this.#ramLeg("put-back", snapshot);
    if (!ok) return;
    this.lastWritten = undefined;
    this.name = undefined;
    if (this.storedThisSession) {
      const outcome = await this.#storeLeg("put-back", snapshot);
      if (outcome === false) return;
      if (outcome !== "kept") {
        this.#fail(
          "restored-unconfirmed",
          outcome === "mismatch" ? "mismatch" : "timeout",
          restoredUnconfirmedBlock(this.#page()).title,
        );
        return;
      }
      this.storedThisSession = false;
    }
    this.cause = undefined;
    this.phase = "restored";
    this.#recomputeArmed();
    this.#session.announce(liveRestored(this.#page()));
  }

  // --- the header's click: CLEAR ---------------------------------------------

  /**
   * CLEAR: the firmware's own five defaults - the strings the Editor's
   * `clearElement()` writes through `resetDefault()` (A-48, D-20), not
   * emptiness - through #ramLeg in SLOTS order, then the same store leg Store
   * on ZONA runs (round 4c, 2026-09-12, `61ba376`: "like Store but with
   * Clear", so a page the Editor STORED does not come back after a power
   * cycle). One click, no confirmation (13.1 D-04). Lands `cleared` and sets
   * `storedThisSession` on a proved store; `kept-mismatch` (reused, the
   * block's sentence is exactly true of a clear's store) when the rounds run
   * out; `unconfirmed` with FIRMWARE_DEFAULT_NAME as the name when no ACK
   * came; Store on ZONA is live from every one of them (the store is the retry).
   *
   * Both elements are reset (D-21, 12-03): the line beside the control names
   * the whole page, and HANGAR writes the system element's three slots too.
   * Writing an event its own default sets `cfg_default_flag`
   * (grid_ui.c:398-409) and the store then DELETES the cfg file
   * (grid_ui.c:1126-1134), so a cleared page stored leaves no HANGAR file on
   * the module. The five SLOTS are all it resets: a slot the Editor wrote and
   * HANGAR never does survives (the whole-page reset class exists in the
   * package and stays forbidden by forbidden-instructions.spec.ts). No
   * compiler on this path: the defaults are canonical already
   * (constants.spec.ts). The CURRENT page, not the snapshot's; no new snapshot
   * is taken, so the probe's putBack() still holds the visitor's original.
   */
  async clearToDefault(): Promise<void> {
    // The whole of SAFE-03, and the whole of the enablement rule: one call.
    if (!this.clearEnabled(this.#capable())) return;
    if (!this.#queue || this.#session.phase !== "connected") return;
    const { protocolLib } = await heavyModules();
    // Wire facts, read through the awaited protocol module and never from
    // install-copy.ts (on the first paint of `/` with zero imports).
    const defaults: ConfigStrings = {
      systemTimer: protocolLib.SYSTEM_DEFAULT_TIMER,
      system: protocolLib.SYSTEM_DEFAULT_SETUP,
      systemUtility: protocolLib.SYSTEM_DEFAULT_UTILITY,
      setup: protocolLib.TOUCH_DEFAULT_SETUP,
      timer: protocolLib.TOUCH_DEFAULT_TIMER,
    };
    const ok = await this.#ramLeg("clear", defaults);
    if (!ok) return;
    // Nothing of the visitor's or HANGAR's is on the module: nothing the
    // already-kept row could match; Store on ZONA is live from `cleared`.
    this.lastWritten = undefined;
    this.name = undefined;
    // Round 4c: the store leg Store on ZONA runs, proved against the five
    // defaults. `steps` is not reset between the legs, so the capture reads
    // the whole click: five writes, the restore, the store, the proof.
    const outcome = await this.#storeLeg("clear", defaults);
    if (outcome === false) return;
    if (outcome === "kept") {
      // SAFE-07 verbatim: `cleared` only through #ramLeg true (every
      // CONFIG/ACKNOWLEDGE) AND #storeLeg kept (the PAGESTORE/ACKNOWLEDGE, the
      // heartbeat, a matching round) - never a resolved writer promise.
      this.storedThisSession = true;
      this.cause = undefined;
      this.phase = "cleared";
      this.#recomputeArmed();
      this.#session.announce(liveCleared(this.#page()));
      return;
    }
    if (outcome === "mismatch") {
      this.#fail(
        "kept-mismatch",
        "mismatch",
        keptMismatchBlock(this.#page()).title,
      );
      return;
    }
    // The RAM leg landed and the firmware default runs in memory; the block
    // names it so, not the route's entry.
    this.name = FIRMWARE_DEFAULT_NAME;
    this.#fail(
      "unconfirmed",
      "timeout",
      unconfirmedBlock(FIRMWARE_DEFAULT_NAME, this.#page()).title,
    );
  }

  // --- the flash store: STORE ON ZONA, and the proof -----------------------

  /**
   * The confirmation's affirmative, and the routes' one write since
   * 2026-09-16 (BENCH-2026-09-16.txt section 1): the page's five firmware
   * defaults through #ramLeg (the same five writes Clear sends), then the
   * configuration's five strings - the three system slots substituted through
   * #systemStringOr - through #ramLeg again, then one PAGESTORE/EXECUTE
   * through #storeLeg and the proof (D-12): eighteen frames on the fake -
   * five writes, the restore heartbeat, five writes, the restore, the store,
   * five fetches. Lands `kept` only after the proof, else `kept-mismatch` or
   * `unconfirmed`; a RAM leg that fails lands `partial`, `nothing-landed` or
   * `lost` as any RAM leg does, and stores nothing. Refused unless the
   * confirmation is open and the store is armed; from `snapshot-failed` it
   * reads the module again first and writes only if that lands `ready`. The
   * whole click is one action, `keep`, and one capture (`steps` is reset by
   * the first leg alone).
   */
  async keepOnDevice(
    config: ConfigStrings | undefined,
    name: string,
  ): Promise<void> {
    if (!this.confirmOpen || !this.armed) return;
    // The click was taken: the confirmation leaves whatever follows.
    this.confirmOpen = false;
    if (this.phase === "snapshot-failed" && config !== undefined) {
      await this.retrySnapshot();
    }
    // In hand since #attach (armed implies a queue); no await before the
    // first leg publishes `writing`.
    const protocolLib = this.#modules?.protocolLib;
    if (!protocolLib) return;
    if (this.#tryRefusal(config, protocolLib.CONFIG_MAX) !== undefined) return;
    if (config === undefined) return;
    const defaults: ConfigStrings = {
      systemTimer: protocolLib.SYSTEM_DEFAULT_TIMER,
      system: protocolLib.SYSTEM_DEFAULT_SETUP,
      systemUtility: protocolLib.SYSTEM_DEFAULT_UTILITY,
      setup: protocolLib.TOUCH_DEFAULT_SETUP,
      timer: protocolLib.TOUCH_DEFAULT_TIMER,
    };
    const sent: ConfigStrings = {
      systemTimer: this.#systemStringOr(config, 6, protocolLib),
      system: this.#systemStringOr(config, 0, protocolLib),
      systemUtility: this.#systemStringOr(config, 4, protocolLib),
      setup: config.setup,
      timer: config.timer,
    };
    // The page's default first: what a Store leaves in flash is never a mix
    // of the visitor's page and this configuration.
    if (!(await this.#ramLeg("keep", defaults))) return;
    // Nothing of the earlier landing is on the module now.
    this.lastWritten = undefined;
    this.name = undefined;
    if (!(await this.#ramLeg("keep", sent, true))) return;
    // Memory holds the configuration: `unconfirmed` names it, and a store
    // that proves lands `kept` over it.
    this.lastWritten = sent;
    this.name = name;
    const outcome = await this.#storeLeg("keep", sent);
    if (outcome === false) return;
    if (outcome === "kept") {
      this.storedThisSession = true;
      this.cause = undefined;
      this.phase = "kept";
      this.#recomputeArmed();
      this.#session.announce(liveKept(this.#page()));
      return;
    }
    if (outcome === "mismatch") {
      this.#fail(
        "kept-mismatch",
        "mismatch",
        keptMismatchBlock(this.#page()).title,
      );
      return;
    }
    this.#fail(
      "unconfirmed",
      "timeout",
      unconfirmedBlock(name, this.#page()).title,
    );
  }

  /**
   * The store leg, shared by the keep, by a put-back after a keep and by
   * every clear (round 4c): one PAGESTORE/EXECUTE through the queue under
   * pagestoreMs (3000 ms, from the descriptor), then the D-12 proof - the
   * ZONA's next heartbeat, then a re-fetch of all five strings for at most
   * REFETCH_ROUNDS rounds with retryBackoffMs between, `kept` on the first
   * byte-identical set. `mismatch` when the rounds run out; `unconfirmed` on
   * the queue's timeout (a store dropped under a bulk NVM operation answers
   * with nothing, never a NACK, grid_decode.c:979-981); false when the link
   * died (`lost` is already set) or the generation moved.
   */
  async #storeLeg(
    action: InstallAction,
    sent: ConfigStrings,
  ): Promise<StoreOutcome> {
    const gen = this.#generation;
    const q = this.#queue;
    const id = this.#session.identity;
    if (!q || !id) return false;
    const { protocolLib, transportLib } = await heavyModules();
    this.action = action;
    this.leg = "store";
    this.cause = undefined;
    this.phase = "writing";
    this.#recomputeArmed();
    this.refetchRounds = 0;
    this.#inFlight = true;
    this.#session.writeLock = true;
    this.#armSlow();
    try {
      await q.request(protocolLib.storePage(), "store");
      if (gen !== this.#generation) return false;
      // The ACK is sent by the callback that STARTS the page reload
      // (grid_decode.c:947-961): wait for the heartbeat, then prove the bytes.
      await this.#nextHeartbeat();
      if (gen !== this.#generation) return false;
      for (let round = 0; round < REFETCH_ROUNDS; round++) {
        const after = await transportLib.fetchAll(
          q,
          this.#session.identity ?? id,
          "refetch",
        );
        if (gen !== this.#generation) return false;
        this.refetchRounds = round + 1;
        // Five for five, one per SLOTS row (12.1-07, 13-17), the way runNoOpCycle
        // compares: a slot added to the list is compared here without a line.
        if (
          transportLib.SLOTS.every(
            (slot) => after[slot.key].actionString === sent[slot.key],
          )
        ) {
          return "kept";
        }
        await this.#sleep(protocolLib.retryBackoffMs(round));
      }
      return "mismatch";
    } catch (err) {
      // The link died under us: `lost` whatever the generation says (07-06's
      // ordering, Pitfall 11); the store leg's form of the block.
      if (err instanceof transportLib.AbortedError) {
        this.#fail(
          "lost",
          "aborted",
          lostBlock(true, KEEP_LABEL, this.#page()).title,
        );
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
   * The shape every RAM action shares: true when every acknowledgement
   * arrived and the generation is still ours; false on every other path with
   * the phase already classified. The restore heartbeat and the lock release
   * are in the `finally`, whatever happened. `keepSteps` (a Store's second
   * leg) appends to the click's capture instead of starting one; the
   * classifier reads this leg's steps alone either way.
   */
  async #ramLeg(
    action: InstallAction,
    strings: ConfigStrings,
    keepSteps = false,
  ): Promise<boolean> {
    const gen = this.#generation;
    const q = this.#queue;
    const id = this.#session.identity;
    if (!q || !id) return false;
    // The leg is published synchronously, before any await: a component
    // deciding where focus goes when the confirmation closes reads `writing`
    // and a disabled control in the same flush as the click, never an enabled
    // one that disables a tick later.
    this.action = action;
    this.leg = "ram";
    this.cause = undefined;
    this.landed = undefined;
    this.failed = undefined;
    this.landedSlots = [];
    this.failedSlots = [];
    this.phase = "writing";
    this.#recomputeArmed();
    if (!keepSteps) this.steps = [];
    const from = this.steps.length;
    this.#inFlight = true;
    this.#session.writeLock = true;
    this.#armSlow();
    // In hand since #attach built the queue; the await is the cold path no click reaches.
    const modules = this.#modules ?? (await heavyModules());
    const { transportLib } = modules;
    try {
      // 255/6, 255/0, 255/4, 0/6, 0/0, ACK each - sequence.ts writeAll over
      // SLOTS owns the order. Verbatim.
      await transportLib.writeAll(q, transportLib.targetOf(id), strings);
      if (gen !== this.#generation) return false;
      return true;
    } catch (err) {
      // The link died under us: `lost` whatever the generation says - the
      // "closed" that bumped it left the phase to this catch (Pitfall 11).
      if (err instanceof transportLib.AbortedError) {
        this.#classify(err, modules, action, from);
        return false;
      }
      if (gen !== this.#generation) return false;
      this.#classify(err, modules, action, from);
      return false;
    } finally {
      // MANDATORY on every path (sequence.ts restorePageChange): a successful
      // CONFIG/EXECUTE clears page_change_enabled and only this sets it back.
      // `q` is this leg's queue even after a pacing rebuild; sendImmediate
      // works after abort() by design.
      await transportLib.restorePageChange(q).catch(() => undefined);
      this.#disarmSlow();
      this.#inFlight = false;
      this.#session.writeLock = false;
    }
  }

  /**
   * The taxonomy of a RAM leg, decided by error TYPE and never by message
   * text (07-RESEARCH Anti-Patterns: the vendored TRANSIENT_WRITE regex would
   * retry a dead link three times):
   *
   *   AbortedError                                lost            aborted
   *   NackError, the first slot already ok        partial         nack
   *   NackError otherwise                         nothing-landed  nack
   *   anything else, the first slot ok            partial         timeout
   *   anything else otherwise                     nothing-landed  timeout
   *
   * Five writes, five step ids, four possible partials: writeAll is
   * sequential in SLOTS order and stops at the first failure, so what landed
   * is a PREFIX and the classifier walks SLOTS to the first write that was
   * not acknowledged:
   *
   *   write-system-timer failed                        nothing landed
   *   255/6 ok, write-system bad                       the system timer, and only it
   *   255/6 and 255/0 ok, write-system-utility bad     the system timer and the page init
   *   255/6, 255/0 and 255/4 ok, write-timer bad       all but the touch pair
   *   255/6, 255/0, 255/4 and 0/6 ok, write-setup bad  all but the Setup
   *
   * "A later slot landed and an earlier one did not" cannot happen with this
   * writer (12-RESEARCH Pitfall 6 describes that firmware state; nothing
   * HANGAR does produces it). The words are install-copy.ts's closed unions
   * indexed by the prefix length (12.1-08, 13-17); the labels are published
   * as `landedSlots` / `failedSlots`. A timeout cause asks the pacing rule.
   * `from` is where this leg's steps start in the click's capture: a Store's
   * second leg follows five landed writes it must not count.
   */
  #classify(
    err: unknown,
    modules: HeavyModules,
    action: InstallAction,
    from: number,
  ): void {
    const { transportLib } = modules;
    // A-28: the failure states and their copy are reused. A Store's leg takes
    // the store form; a clear or a probe leg that got nothing through takes
    // PUT BACK's - "what was playing is still playing" is true of those.
    const after = action === "keep" ? "store" : "put-back";
    if (err instanceof transportLib.AbortedError) {
      this.#fail(
        "lost",
        "aborted",
        lostBlock(false, KEEP_LABEL, this.#page()).title,
      );
      return;
    }
    const cause: InstallCause =
      err instanceof transportLib.NackError ? "nack" : "timeout";
    const legSteps = this.steps.slice(from);
    const landedStep = (id: string): boolean =>
      legSteps.some((s) => s.id === id && s.outcome === "ok");
    // The landed PREFIX of SLOTS: the writer stops at the first failure.
    let landedCount = 0;
    while (
      landedCount < transportLib.SLOTS.length &&
      landedStep(transportLib.SLOTS[landedCount].write)
    ) {
      landedCount++;
    }
    if (landedCount > 0) {
      // One table indexed by the prefix length (12.1-08; 13-17 the utility
      // script third); a sixth row is a type error against the closed unions.
      const PARTIALS: readonly [LandedWords, FailedWords][] = [
        [
          "The system timer",
          "the page init, the utility script, the Timer and the Setup",
        ],
        [
          "The system timer and the page init",
          "the utility script, the Timer and the Setup",
        ],
        [
          "The system timer, the page init and the utility script",
          "the Timer and the Setup",
        ],
        [
          "The system timer, the page init, the utility script and the Timer",
          "the Setup",
        ],
      ];
      const [landed, failed] = PARTIALS[landedCount - 1];
      this.landed = landed;
      this.failed = failed;
      this.landedSlots = transportLib.SLOTS.slice(0, landedCount).map(
        (s) => s.label,
      );
      this.failedSlots = transportLib.SLOTS.slice(landedCount).map(
        (s) => s.label,
      );
      this.#fail(
        "partial",
        cause,
        partialBlock(landed, failed, this.#page()).title,
      );
    } else {
      this.#fail(
        "nothing-landed",
        cause,
        nothingLandedBlock(after, this.#page()).title,
      );
    }
    if (cause === "timeout") this.#escalatePacing(modules);
  }

  /**
   * D-19, Pitfall 3: a `write-*` timeout with no NACK anywhere in the action
   * is the module's ring discarding a frame silently, so the pre-send gap
   * moves to the desktop's 10 ms and the queue is rebuilt on the same
   * transport for the RETRY already on screen. A NACK is a refusal, not
   * congestion, and never escalates. Once per page load.
   */
  #escalatePacing(modules: HeavyModules): void {
    if (this.pacingEscalated) return;
    if (this.steps.some((s) => s.outcome === "nack")) return;
    this.#preSendDelayMs = modules.protocolLib.DESKTOP_PRE_SEND_DELAY_MS;
    this.pacingEscalated = true;
    this.#buildQueue(modules.transportLib);
  }

  // --- the 2000 ms line (Z-09) ---------------------------------------------

  /**
   * A setTimeout on the store, armed at every leg's start and cleared in its
   * finally (Z-09): `slow` renders the one honest line and LIVE_STILL_WRITING
   * is said once. 2000 ms is roughly 90x the slowest CONFIG/EXECUTE observed
   * (21.6 ms), 50x the slowest PAGESTORE/ACKNOWLEDGE (38.7 ms), and below the
   * 3000 ms pagestoreMs: the line says busy, only the timeout says failed
   * (I11, I12). Never an interval.
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

// The singleton over the session's singleton, at module scope; start() is the
// root layout's to call from onMount.

/** The one instance components read. Tests never touch it. */
export const install = new InstallStore(session);
