// The install store: the snapshot at connect, the two RAM clicks, and the way
// back (Phase 7, SAFE-01, SAFE-03, SAFE-04, SAFE-07).
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
// promise carries no store state.
//
// WHY THE QUEUE IS FED FROM onClass() AND NEVER FROM onData(). GridTransport
// carries exactly ONE data callback and the session owns it after
// identification (07-CONTEXT D-16). A second raw registration would silently
// unhook the fold that keeps the page number and the rig tail true, and the
// later writes would then fail as unexplained refusals - the module NACKs a
// write to a page that is not its active one, and the page on screen would be
// frozen at connect time (07-RESEARCH Pitfall 1). The session's view throws on
// onData for exactly this reason; this store subscribes through onClass() and
// hands every decoded class to the queue's deliver(). The spec scans this file
// for a raw onData registration and expects none.
//
// WHY ONE RequestQueue PER CONNECTION, NOT PER CLICK. sendImmediate() drops the
// restore heartbeat when ITS OWN queue has a write in flight and cannot see
// another queue's (07-RESEARCH Pitfall 2). Two queues over one transport could
// interleave a fire-and-forget heartbeat between another queue's write and its
// acknowledgement. One queue per connection, built at "connected" and dropped
// at "closed", keeps the one-outstanding-request invariant true for the whole
// site, and the capture's steps and the retry bound stay true with it. Nothing
// here calls the transport's write directly; every byte goes through the queue.
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
// persistIfAbsent() never overwrites a valid entry.
//
// ONE CONSEQUENCE OF THE GATED ORDER, NAMED AND NOT FIXED HERE. An empty fetched
// string lands `snapshot-failed` BEFORE the durable record is consulted, so a
// remembered module whose RAM reads empty on that page is not offered its own
// record. The reorder waits on the Z-16 / D-03 question 07-VALIDATION leaves
// open and is a deferred item for 07-13.
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
// generation, set writeLock, run the sequence through the ONE queue, classify
// by error TYPE, and restore page change in a `finally` on every path: a
// successful CONFIG/EXECUTE clears page_change_enabled (grid_decode.c:1279) and
// only an inbound HEARTBEAT TYPE 255 sets it back (grid_decode.c:717); the
// firmware's own timeout restore is commented out. Settled means both
// acknowledgements arrived AND the restore went out - never a resolved write.
//
// Plan 07-07 adds the flash leg, the partial classification, the slow line and
// the bounds to this same file.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  LIVE_RESTORED,
  LIVE_SNAPSHOT_SAVED,
  TRY_ON_LABEL,
  announceTitle,
  liveSettled,
  lostBlock,
  nothingLandedBlock,
  snapshotFailedBlock,
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
 * The fourteen states of 07-UI-SPEC's machine. `snapshot-failed` is I9's
 * cause 4; the other I9 causes are not phases here - they are read off the
 * session's capability, the tuner's budget and this store's `snapshotting` and
 * `writing` by the component.
 */
export type InstallPhase =
  | "idle"
  | "snapshotting"
  | "ready"
  | "writing"
  | "settled"
  | "restored"
  | "kept"
  | "partial"
  | "lost"
  | "snapshot-failed"
  | "kept-mismatch"
  | "unconfirmed"
  | "restored-unconfirmed"
  | "nothing-landed";
export type InstallAction = "try" | "put-back" | "keep";
export type InstallLeg = "ram" | "store";
/** Why an action ended where it did. Rendered by no block in v1; asserted by the spec and recorded in the capture. */
export type InstallCause = "timeout" | "nack" | "aborted" | "mismatch";
/** The tuner's pair, verbatim (D-10). Declared here rather than imported: a type import is still a specifier. */
export type ConfigStrings = { readonly setup: string; readonly timer: string };

export interface InstallEnv {
  /** Injected for node; defaults to a guarded read of the browser's local storage (Pitfall 9). */
  storage?: SnapshotStore;
  /** The queue's deadline clock. Injected so a node test can move it in step with fake timers. */
  now?: () => number;
  // 07-07 adds `sleep` here beside its re-fetch rounds, which are the first
  // thing in this file that waits; a member nothing reads would fail lint.
}

/** The two heavy modules, resolved together and kept. */
interface HeavyModules {
  P: Protocol;
  T: Transport;
}

/**
 * The phases a write may start from. Everything that is a settled outcome of
 * an earlier action, plus `ready`. `snapshot-failed` is handled separately:
 * the click retries the snapshot and writes only if that lands.
 */
const WRITABLE_PHASES: readonly InstallPhase[] = [
  "ready",
  "settled",
  "restored",
  "kept",
  "partial",
  "nothing-landed",
  "unconfirmed",
  "kept-mismatch",
  "restored-unconfirmed",
];

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

export class InstallStore {
  // --- reactive: scalars and whole-value snapshots only ---------------------

  phase = $state<InstallPhase>("idle");
  action = $state.raw<InstallAction | undefined>(undefined);
  leg = $state.raw<InstallLeg | undefined>(undefined);
  cause = $state.raw<InstallCause | undefined>(undefined);
  /** The 2000 ms line (07-07). */
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
  keptThisSession = $state(false);
  confirmOpen = $state(false);
  /** partial's halves, as already-capitalised words (07-07). */
  landed = $state.raw<"Setup" | "Timer" | undefined>(undefined);
  failed = $state.raw<"Setup" | "Timer" | undefined>(undefined);

  // --- NOT reactive: the record of the last action, and the machinery -------

  /**
   * The capture steps of the LAST action - the snapshot or one leg - as the
   * queue reported them, in order. Replaced with a fresh array when an action
   * starts, so a reader sees one action at a time. Plain, never a rune: it is
   * written from the queue's onStep and rendered by nothing; 07-07 reads it to
   * tell a half-landed write from a whole one.
   */
  steps: CaptureStep[] = [];

  readonly #session: DeviceSession;
  #storage: SnapshotStore | undefined;
  #now: (() => number) | undefined;
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
   * protocol module is in hand, when it reads PRE_SEND_DELAY_MS (0); 07-07
   * escalates it to the desktop's 10 ms on a write timeout with no NACK.
   */
  #preSendDelayMs: number | undefined;
  #started = false;

  constructor(session: DeviceSession) {
    this.#session = session;
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
    const { P, T } = await heavyModules();
    if (gen !== this.#generation) return;
    const transport = this.#session.transport;
    const id = this.#session.identity;
    if (!transport || !id) return;

    this.#preSendDelayMs ??= P.PRE_SEND_DELAY_MS;
    const queue = new T.RequestQueue(transport, {
      preSendDelayMs: this.#preSendDelayMs,
      now: this.#now,
      onStep: (step) => {
        this.steps.push(step);
      },
    });
    this.#queue = queue;
    this.#unsubscribeClass = this.#session.onClass((cls: DecodedClass) =>
      queue.deliver(cls),
    );
    await this.#snapshot(id, queue, gen);
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
  }

  /**
   * Z-05: the module holds the pair the visitor is looking at. Recomputed here
   * and after every leg rather than derived, for the header's reason. A knob
   * move that lands on identical strings keeps it armed - what plays on the
   * module is what the strings say.
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
    this.phase = "settled";
    this.#recomputeArmed();
    this.#session.announce(liveSettled(name));
  }

  /** PUT BACK: the snapshot's strings, the same way. Its store leg is 07-07. */
  async putBack(): Promise<void> {
    const snapshot = this.snapshot;
    if (!snapshot) return;
    if (!WRITABLE_PHASES.includes(this.phase)) return;
    if (!this.#queue || this.#session.phase !== "connected") return;
    const ok = await this.#ramLeg("put-back", snapshot);
    if (!ok) return;
    this.lastWritten = undefined;
    this.name = undefined;
    this.phase = "restored";
    this.#recomputeArmed();
    this.#session.announce(LIVE_RESTORED);
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
    const { T } = await heavyModules();
    this.action = action;
    this.leg = "ram";
    this.cause = undefined;
    this.phase = "writing";
    this.steps = [];
    this.#inFlight = true;
    this.#session.writeLock = true;
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
        this.#classify(err, T, action);
        return false;
      }
      if (gen !== this.#generation) return false;
      this.#classify(err, T, action);
      return false;
    } finally {
      // MANDATORY on every path. See sequence.ts restorePageChange: a
      // successful CONFIG/EXECUTE clears page_change_enabled and only this
      // sets it back. On a dead link the send throws and is swallowed here.
      await T.restorePageChange(q).catch(() => undefined);
      this.#inFlight = false;
      this.#session.writeLock = false;
    }
  }

  /**
   * The taxonomy, decided by error TYPE and never by message text: _pad.ts's
   * isTransient regex would match the queue's AbortedError and retry a dead
   * link (07-RESEARCH Anti-Patterns). In this plan an aborted wait is `lost`
   * and everything else is `nothing-landed` with its cause; 07-07 widens this
   * to `partial` by reading `steps` for a landed Timer, and to the store legs.
   */
  #classify(err: unknown, T: Transport, action: InstallAction): void {
    const after = action === "put-back" ? "put-back" : "try";
    if (err instanceof T.AbortedError) {
      this.#fail("lost", "aborted", lostBlock(false, TRY_ON_LABEL).title);
      return;
    }
    if (err instanceof T.NackError) {
      this.#fail("nothing-landed", "nack", nothingLandedBlock(after).title);
      return;
    }
    this.#fail("nothing-landed", "timeout", nothingLandedBlock(after).title);
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
