// The install store: the snapshot at connect, the two RAM clicks, the way
// back, the flash store and its proof, and every way a write can go wrong
// (Phase 7, SAFE-01, SAFE-03 to SAFE-09).
//
// WHY THIS IS A SEPARATE FILE AND NOT PART OF THE SESSION. Phase 6 plan 06-04's
// test 15 scans session.svelte.ts, comment-stripped, for TEN write-shaped
// needles - the transport write, the queue class, the host heartbeat, the
// config send, the page store, the fetch, the flash store, the write-back, the
// clear and the interval - and asserts every one is absent. It was eight when
// this paragraph was written and nine before Phase 10; plan 10-12's fourth
// write click made it ten. That scan is a structural guarantee that the
// session never writes, and it is worth more than the convenience of one file:
// a write added to the session would turn the gate red with no honest
// replacement. So every write of this site lives HERE, in a second runes store
// beside the session and never inside it, and this file borrows from the
// session exactly what plan 07-04 lent: the `transport` write view, onClass(),
// onConnection(), announce() and writeLock.
//
// WHY EXACTLY FOUR STATIC `from` SPECIFIERS, AND WHICH FOUR. The install
// panel is on the first paint of `/playground/{id}/`, and this store is reachable from
// it, so whatever this file names statically is on the cold load. Phase 4's
// chunk guard (src/lib/config-shape.spec.ts test 13) matches specifier TEXT,
// and install.spec.ts test 8 counts them:
//
//   ./install-copy    zero imports. Every sentence this store speaks.
//   ./snapshot        zero imports. The durable record, keyed module then page.
//   ./page-target     zero imports. The page target (Phase 13, 13-12): the
//                     one control that moves the hardware, and its envelope.
//   ./session.svelte  Phase 6's four light specifiers (session-copy,
//                     protocol/usb, transport/ports, transport/transport), all
//                     of them free of the protocol package.
//
// THE PAGE TARGET, AND HOW IT IS FOLDED INTO PHASE 7'S RULES RATHER THAN
// EXCEPTED FROM THEM (13-CONTEXT D-06 clauses 1 and 3-6; 13.1-CONTEXT D-05
// for clause 2, struck). page-target.ts holds the four states - reported,
// requested, switching, unverified - and the two frames a switch puts on the
// wire, in the one order firmware forces (the restore heartbeat, THEN the
// switch). This store owns the wiring and the gate:
//
//   - the module's page report reaches the target from the SAME class sink
//     the heartbeat waiters and the page-change re-snapshot already read
//     (#onClassSeen), one microtask after the session's fold has published
//     the identity, so the target reads `activePage` the way #pageCheck does;
//   - a switch is a CLICK and nothing else, and the click is the Target
//     select's CHANGE. There is no destination review: the user struck it
//     at the fourth bench (BENCH-2026-09-12.txt line 5, "Page switch doesnt
//     need a confirmation window. When you change page form the drop down
//     just change the page and thats it."; 13.1-CONTEXT D-05). switchPage()
//     is what the select's change handler calls: requestPage() sets the
//     target and sends nothing, confirmPage() sends - it is still the ONLY
//     path to the target's confirm() - and the two run back to back in one
//     call. No navigation, selection, restore, install or report of the
//     module's own calls either. Opening the menu sends nothing; only a
//     change sends, and install.e2e.ts's zero-writes proof counts the
//     switch class at zero across a cycle that opens the menu;
//   - THE KEYBOARD FACT, NAMED (13.1-PLAN-CHECK W-03): on a focused, CLOSED
//     <select>, Chromium fires `change` on every ArrowUp / ArrowDown, so
//     each arrow press is a switch - the heartbeat and the page change - until
//     the select disables at `switching`. That is the user's own gesture on
//     the one control that moves the hardware, a click for SAFE-01's
//     purpose and counted by class like any other; it is NOT a write that
//     happens without a gesture. The gate's bench row 5 tries it on
//     hardware;
//   - EVERY write path reads the target's ONE condition - pageSettled(), which
//     is canApply(): at rest, and reported === requested - before it touches
//     the queue: the try-on's refusal list, PUT BACK, CLEAR's enablement and
//     the keep. Between the change and the module's own report of the
//     requested page, and through `unverified`, nothing writes. The ACK gate
//     and the heartbeat-first order are the wire's, not the interface's,
//     and D-05 moves neither;
//   - the pages offered are the module's own answer to a PAGECOUNT fetch,
//     taken once per connection inside the snapshot; never a number;
//   - the per-page snapshot D-06 asks for has existed since Phase 7
//     (snapshot.ts rule 2, keyed module then page; #pageCheck re-snapshots
//     the new page when the module moves). What this plan adds is that PUT
//     BACK NAMES the page it holds before the click (putBackPageLine).
//
// THE DISCARD (the page-discard class, revertToStored below) is the firmware-native
// revert D-06's last clause asked to be researched. It is written, it is
// UNPROVEN on hardware, and it is reachable from the /dev/install/ probe only
// until docs/INSTALL-RUNBOOK.md row I confirms it. No public control.
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
// the module's next heartbeat, then a re-fetch of all five strings that matches
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
  type FailedWords,
  type KeepReason,
  type LandedWords,
  LIVE_STILL_WRITING,
  TRY_ON_LABEL,
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
/**
 * `discard` joined the four in Phase 13, plan 13-12: the firmware-native
 * revert (the page-discard class), reachable from the probe only until the bench.
 */
export type InstallAction = "try" | "put-back" | "keep" | "clear" | "discard";
export type InstallLeg = "ram" | "store";
/** Why an action ended where it did. Rendered by no block in v1; asserted by the spec and recorded in the capture. */
export type InstallCause = "timeout" | "nack" | "aborted" | "mismatch";
/**
 * The tuner's FIVE strings, verbatim (D-10). Declared here rather than
 * imported: a type import is still a specifier.
 *
 * `system` is the SYSTEM element's page-init slot (255/0), added in 12-03. It
 * is not metered, it does not move with a knob, and in this plan it is the
 * firmware's own default for every entry - so a TRY after a TRY of another
 * entry leaves the module holding one coherent set rather than a new pair on
 * top of an old library. It travels with the pair everywhere the pair goes:
 * the snapshot, `lastWritten`, `config`, and every write.
 *
 * `systemTimer` is the SYSTEM element's Timer slot (255/6), added in 12.1-07
 * (D-03): the library's second half, which 255/0 arms with `self:tim()`. It
 * follows `system` everywhere `system` goes and on the same terms - not
 * metered, substituted from the empty string in ONE place (`#pageTimer`),
 * snapshotted, restored and cleared with the other three. The keys are in
 * write order (sequence.ts SLOTS); the writer owns the order, not this type.
 *
 * `systemUtility` is the SYSTEM element's utility slot (255/4), added in
 * 13-17 (13-CONTEXT D-18, D-19): the Sandbox runtime's second slot, which the
 * touch Setup pulls in with `ele[#ele]:map()`. On `system`'s terms once
 * more: not metered, substituted from the empty string in ONE place
 * (`#pageUtility`) - a catalog entry has no utility body and lands the
 * firmware's own page-next there, so the module's utility button keeps
 * turning the page under a catalog configuration and stops while a surface
 * is installed - snapshotted, restored and cleared with the other four. THE
 * STORE CANNOT TELL A SURFACE FROM AN ENTRY: both reach it as this one shape
 * (the tuner's `landLua` and preset landings, and `src/lib/sandbox/land.ts`),
 * and install.spec.ts asserts the consumption path is one path.
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

/**
 * One reason per refusal; the guard returns the first that applies.
 * `page-pending` (13-12): the page target is not at rest - a change is on
 * its way to the wire, a switch awaits the module's report, or the window
 * closed unverified.
 */
type TryRefusal =
  | "measuring"
  | "not-writable"
  | "no-session"
  | "page-pending"
  | "over-budget";

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
  /**
   * partial's two lists, as the words the block interpolates (I7). Five
   * writes make them lists rather than single words, and the closed unions in
   * install-copy.ts say which pairings the ONE writer can produce.
   */
  landed = $state.raw<LandedWords | undefined>(undefined);
  failed = $state.raw<FailedWords | undefined>(undefined);
  /**
   * The same two lists AS SLOT LABELS, in write order, read straight off
   * sequence.ts's SLOTS by #classify (12.1-07): `landedSlots` is the prefix of
   * SLOTS whose write was acknowledged, `failedSlots` the rest. Empty outside
   * `partial`. Rendered by nothing yet - the probe and the spec read them,
   * and 12.1-08's sentences are built from the same labels - and they exist
   * so that "which of five landed" is a fact about the list rather than a
   * sentence somebody has to keep in step with it.
   */
  landedSlots = $state.raw<readonly string[]>([]);
  failedSlots = $state.raw<readonly string[]>([]);
  /**
   * True when the snapshot in hand came from a `hangar.snapshot.v1` record, so
   * its `system` string is the firmware default rather than one the module
   * handed over (12-03). Rendered by nothing; the probe page and the spec read
   * it, and it exists so that the substitution is surfaced rather than silent.
   */
  snapshotFromV1 = $state(false);
  /**
   * True when the snapshot in hand came from a `hangar.snapshot.v2` record, so
   * its `systemTimer` string is the firmware's 255/6 default rather than one
   * the module handed over (12.1-07, D-22) - the v1 flag's shape one version
   * on. A v1 record substitutes BOTH defaults and sets `snapshotFromV1` alone;
   * "the timer slot is a default" is therefore either flag. Rendered by
   * nothing; the probe page's install-snapshot line (12.1-08) and the spec
   * read it.
   */
  snapshotFromV2 = $state(false);
  /**
   * True when the snapshot in hand came from a `hangar.snapshot.v3` record, so
   * its `systemUtility` string is the firmware's page-next rather than one the
   * module handed over (13-17) - the v2 flag's shape one version on. A v2 or
   * v1 record substitutes the utility too and sets its own flag alone; "the
   * utility slot is a default" is therefore any of the three. Rendered by
   * nothing; the probe page's install-snapshot line and the spec read it.
   */
  snapshotFromV3 = $state(false);
  /**
   * True once a `write-*` timeout with no NACK has moved the pre-send gap to
   * the desktop's 10 ms (D-19, Pitfall 3). Shown by the probe; the runbook
   * asks whether it ever fired. Never reset inside a page load.
   */
  pacingEscalated = $state(false);
  /**
   * THE PAGE TARGET'S MIRROR (13-12). Four scalars and one list, replaced
   * whole from page-target.ts's onChange and never mutated - the house rule.
   * `pageReported` is the page the module last reported beside its
   * heartbeat; `pageRequested` the page the visitor asked for (equal to the
   * reported page at rest); `pageStatus` one of the four states; `pages` the
   * module's own enumeration, empty until the PAGECOUNT answer lands and
   * empty again on every reconnect. Components render these; the gate they
   * must obey is pageSettled(), below, and not a comparison of their own.
   */
  pageStatus = $state<TargetStatus>("reported");
  pageReported = $state.raw<number | undefined>(undefined);
  pageRequested = $state.raw<number | undefined>(undefined);
  pages = $state.raw<readonly number[]>([]);
  /**
   * pageSettled() as a rune, for the components: assigned from the target's
   * canApply() in the same mirror, never computed a second time from the
   * fields above. Apply to ZONA, TRY ON DEVICE, PUT BACK and CLEAR all
   * disable on this, and the store's own write paths refuse on pageSettled().
   */
  applyReady = $state(false);

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
  /**
   * The page target (13-12). Built once the protocol module is in hand,
   * because its window is PAGE_SWITCH_WINDOW_MS and this file names that
   * constant only through the awaited module; `undefined` before the first
   * connect, when nothing has a page to target anyway.
   */
  #target: PageTarget | undefined;

  constructor(session: DeviceSession) {
    this.#session = session;
  }

  /** The target's mirror: one assignment per field, from one view. */
  #mirrorTarget(view: PageTargetView): void {
    this.pageStatus = view.status;
    this.pageReported = view.reported;
    this.pageRequested = view.requested;
    this.pages = view.pages;
    this.applyReady = this.#target?.canApply() ?? false;
  }

  /** The target, built on first need with the protocol module's window. */
  #targetWith(P: Protocol): PageTarget {
    return (this.#target ??= new PageTarget({
      windowMs: P.PAGE_SWITCH_WINDOW_MS,
      onChange: (view) => this.#mirrorTarget(view),
    }));
  }

  /**
   * THE ONE CONDITION EVERY WRITE READS (13-12, D-06): the page target is at
   * rest and the module's own report agrees with it. False for the microtask
   * a change spends in `requested`, while a switch awaits the report, and
   * through `unverified`. Also
   * false before any module has reported, which every write path already
   * refuses on other grounds. Delegates to the target's canApply() and
   * restates nothing.
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
    // The page target knows nothing about a module that is gone: a request
    // is dropped, a pending switch is no longer pending, `unverified` ends the
    // one way it can end without a report (13-12). The reconnect reports.
    this.#target?.reset();
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
    // The target starts from nothing on every connection and hears the page
    // the identity carried - the module's own first report (13-12).
    const target = this.#targetWith(modules.P);
    target.reset();
    target.observeReport(id.activePage);
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
    // this frame, so the page comparison waits one microtask for it. The page
    // target reads the same published page in the same microtask (13-12):
    // the identity's activePage IS the module's page report - D-10's fold
    // moves it only for a PAGENUMBER riding beside a heartbeat with no
    // EVENTTYPE and no ACTIONLENGTH, so a CONFIG/REPORT can never land here.
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
   *   2. all FIVE strings come back on the module's REPORTED page and pass
   *      canWriteBack - D-03: the empty string is exactly the shape a fetch of
   *      a non-active page produces. A factory module passes: the system
   *      element's own defaults are 24, 22 and 19 characters, never empty;
   *   3. the set is held IN MEMORY;
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

    let set: Awaited<ReturnType<Transport["fetchAll"]>>;
    try {
      set = await T.fetchAll(q, id);
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

    // THE ENUMERATION (13-12), once per connection, after the five config
    // fetches so their step ids read as they always have and before `ready`
    // so the destination control never renders a list it has not been given.
    // A read, never a write; a module that does not answer offers only its
    // reported page, and enumerate() never throws (Bible section 9: enumerate,
    // never assume four).
    const target = this.#targetWith(P);
    if (target.pages.length === 0) {
      await target.enumerate(q, P, id.zona);
    }
    if (gen !== this.#generation) return;

    // D-03 over Z-16: an empty string is refused here, BEFORE the record is
    // consulted. A remembered module whose RAM reads empty on this page is
    // therefore not offered its own record - named in the header, deferred to
    // 07-13, not fixed here. FIVE strings since 13-17 (four since 12.1-07,
    // three since 12-03), and the guard runs over all of them, one per SLOTS
    // row: HANGAR writes all three system slots, so it copies all three
    // first.
    const guard = P.canWriteBack(T.SLOTS.map((slot) => set[slot.key]));
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

    // IN MEMORY FIRST. Storage is a courtesy and must never be the reason a
    // visitor has no way back (Pitfall 9).
    //
    // The DEFAULTS are passed in because snapshot.ts imports nothing (its own
    // header, and its spec's first test). A record written before Phase 12 has
    // no page-init string, one written before Phase 12.1 has no system-timer
    // string (D-22), one written before 13-17 has no utility string, and
    // each is read with the firmware's own in its place; `fromV1`, `fromV2`
    // and `fromV3` say when that happened, and all three are published
    // rather than swallowed. The record is `hangar.snapshot.v4` since 13-17,
    // beside v3, v2 and v1, which are read and never written.
    const record = moduleId
      ? readSnapshot(this.#storage, moduleId, id.activePage, {
          system: P.SYSTEM_DEFAULT_SETUP,
          systemTimer: P.SYSTEM_DEFAULT_TIMER,
          systemUtility: P.SYSTEM_DEFAULT_UTILITY,
        })
      : undefined;
    // An existing original WINS over a fresh fetch: after TRY ON DEVICE a
    // re-connect fetches HANGAR's own configuration.
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
      this.#pageTimer(current) === written.systemTimer &&
      this.#pageInit(current) === written.system &&
      this.#pageUtility(current) === written.systemUtility &&
      current.setup === written.setup &&
      current.timer === written.timer;
  }

  /**
   * THE ONE PLACE THE FIRMWARE'S OWN PAGE INIT IS SUBSTITUTED, and the reason
   * it is here rather than in the tuner (12-03).
   *
   * `$lib/tune/model.ts` publishes `system` verbatim from its `systemSetup`
   * option, and an entry with none publishes the EMPTY STRING - not the
   * firmware default, because that module may not know it:
   * `src/lib/tune/ladder.spec.ts:275` scans every file under `src/lib/tune/`,
   * comment-stripped, for `lib/protocol`, `lib/transport`, `lib/device` and
   * the transport write, and asserts the offender list is empty. A firmware
   * default is a wire fact and it lives behind that line. This store is
   * already on the right side of it - it resolves the protocol module lazily
   * inside every action and reads `SYSTEM_DEFAULT_SETUP` for CLEAR - so the
   * substitution happens HERE, in one function, used by the write path and by
   * `armed` alike, so the two can never disagree about what is playing.
   *
   * The empty string can therefore never reach the wire. 12-07 fills
   * `systemSetup` in per entry and this stops firing for those entries.
   */
  #pageInit(config: ConfigStrings, P?: Protocol): string {
    if (config.system !== "") return config.system;
    return (P ?? this.#modules?.P)?.SYSTEM_DEFAULT_SETUP ?? "";
  }

  /**
   * THE ONE PLACE THE FIRMWARE'S OWN SYSTEM TIMER IS SUBSTITUTED (12.1-07),
   * beside #pageInit and for its reason, one slot on: the tuner publishes
   * `systemTimer` verbatim from its `systemTimer` option and the empty string
   * for an entry with none - the Lua route lands the library's second half
   * since 12.1-07, a preset lands "" until 12.1-08b - and a firmware default
   * may not be named on that side of ladder.spec.ts:275's line. So the
   * substitution to `SYSTEM_DEFAULT_TIMER` (`--[[@cb]]print("tick")`, 22
   * characters, read from the pinned package) happens HERE, used by the
   * write path and by `armed` alike. The empty string can never reach 255/6.
   */
  #pageTimer(config: ConfigStrings, P?: Protocol): string {
    if (config.systemTimer !== "") return config.systemTimer;
    return (P ?? this.#modules?.P)?.SYSTEM_DEFAULT_TIMER ?? "";
  }

  /**
   * THE ONE PLACE THE FIRMWARE'S OWN UTILITY SCRIPT IS SUBSTITUTED (13-17),
   * beside #pageInit and #pageTimer and for their reason, one slot on: a
   * catalog entry has no utility body and publishes the empty string; a
   * Sandbox surface publishes its runtime's second slot. The substitution to
   * `SYSTEM_DEFAULT_UTILITY` (`gpl(gpn())`, page-next, 19 characters, read
   * from the pinned package) happens HERE, used by the write path and by
   * `armed` alike, so a catalog configuration leaves the module's utility
   * button turning the page and the empty string can never reach 255/4. This
   * function reads a FIELD, never a kind: the store cannot tell a surface
   * from an entry, and a branch here would be the start of a second write
   * path (13-17's first rule).
   */
  #pageUtility(config: ConfigStrings, P?: Protocol): string {
    if (config.systemUtility !== "") return config.systemUtility;
    return (P ?? this.#modules?.P)?.SYSTEM_DEFAULT_UTILITY ?? "";
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
      capable &&
      // 13-12: and the page target at rest. A clear resets the page the
      // module is ON, and while a switch is pending that page is in question.
      this.pageSettled()
    );
  }

  /**
   * Why CLEAR is disabled, or undefined when it is live - the three reasons of
   * 10-UI-SPEC 10.5's closed table, in precedence order. Two disabled
   * moments name NO reason with a session and a snapshot in hand, and the
   * component disables and holds its last line through both: `writing`,
   * where it renders CLEARING… (or a control disabled under another action's
   * write), and since 13-12 a page target that is not at rest, whose line is
   * the destination zone's - the same division of labour PUT BACK uses.
   */
  clearReason(capable: boolean): ClearReason | undefined {
    if (this.clearEnabled(capable)) return undefined;
    if (!capable) return "incapable";
    if (this.snapshot === undefined) return "no-snapshot";
    // 13-12: a page target that is not at rest, with a session and a
    // snapshot in hand, is not "no session" and the closed record has no
    // word for it on purpose - the destination zone carries that state's
    // own line, and Clear.svelte disables on `applyReady` and holds its last
    // reason exactly as it does through a write.
    if (this.#queue && this.#session.phase === "connected") return undefined;
    return "no-session";
  }

  // --- the inline confirmation: the only confirmation on the site (SAFE-05) -

  /** Opens the inline confirmation. Refused unless keepReason() is undefined. */
  openConfirm(): void {
    if (this.keepReason(this.#capable()) !== undefined) return;
    // 13-12: not while the page target is pending - what would be stored is
    // on a page that is about to stop being the active one.
    if (!this.pageSettled()) return;
    this.confirmOpen = true;
  }

  /** NOT NOW, Escape, a knob move, a session drop - all four exits land here or in their own branch. */
  dismissConfirm(): void {
    this.confirmOpen = false;
  }

  // --- the page target: the change, the switch, the revert (13-12, D-06; 13.1 D-05) ---

  /**
   * THE SELECT'S CHANGE, IN ONE CALL (13.1-CONTEXT D-05): the target's
   * request() then its confirm(), back to back, with no review between them.
   * Resolves TRUE exactly when the switch LEFT - the target is `switching`
   * after confirmPage() returned - and FALSE otherwise, with nothing sent:
   * when requestPage() refused (a switch pending, no report yet, a leg in
   * flight, the module's own page, no session), or when confirmPage()
   * early-returned on its own guards (they re-check the leg, the phase and
   * the session after the await). In that second case the target would be
   * parked at `requested` - Apply disabled, no line on the screen, because
   * the routes render `switching` and `unverified` only - so it is taken
   * back with cancelPage() before the false is returned (13.1-PLAN-CHECK
   * W-04). The routes snap the select back on false. Opening the menu never
   * reaches here; only a change does.
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
   * The visitor chose a destination: SET THE TARGET. Sends nothing - that is
   * the whole of this method's contract, and install.e2e.ts counts the switch
   * class at zero across a cycle that opens the menu. switchPage() calls it
   * first and confirmPage() next; the /dev/install/ probe calls it alone. The
   * flash confirmation, if open, closes: two confirmations on one screen is
   * one too many, and a page change under an open KEEP would be exactly the
   * "flash only what you have heard" failure Z-21 names. Refused - false -
   * while a switch is pending, before the module has reported, while a leg
   * is in flight, and for the page the module is already on.
   */
  /**
   * The page the copy names, as the module reports it (install-copy adds one,
   * D-23): the snapshot's page. Every utterance and title built here follows
   * a snapshot, so the 0 stands in only for the snapshot-failed title, which
   * names no page.
   */
  #page(): number {
    return this.snapshotPage ?? 0;
  }

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
   * THE SEND - the second half of the select's change, and the only caller
   * of the target's confirm(). The restore heartbeat goes out, then the
   * switch, both through this connection's ONE queue; the module's own
   * report ends the wait, or the window lands `unverified`. Refused while a
   * leg is in flight: sendImmediate DROPS a frame while a write is
   * outstanding (07-RESEARCH Pitfall 2), and a dropped switch would read as a
   * refusal on the module rather than as what it was. Called by switchPage()
   * and by the /dev/install/ probe; nothing else.
   */
  async confirmPage(): Promise<void> {
    if (this.#inFlight || this.phase === "writing") return;
    const q = this.#queue;
    const id = this.#session.identity;
    const target = this.#target;
    if (!q || !id || !target || this.#session.phase !== "connected") return;
    const { P } = await heavyModules();
    await target.confirm(q, P, id.zona);
  }

  /**
   * THE FIRMWARE-NATIVE REVERT (the page-discard class): reload the active page from
   * flash, undoing every RAM write since the last store without needing the
   * snapshot (grid_decode.c:895-915). UNPROVEN ON HARDWARE and reachable from
   * the /dev/install/ probe only until docs/INSTALL-RUNBOOK.md row I says
   * otherwise; no public control calls this. It is a RAM-only action with the
   * store's wire shape - a broadcast, an id-correlated acknowledgement, the
   * store's timeout, a page reload that restarts the Lua VM - so it runs
   * under the same lock, the same slow line and the same generation check as
   * a store leg, and the restore heartbeat follows it as after every RAM
   * action. Where it lands: the module now runs what FLASH holds - the kept
   * configuration if this session stored one (`kept`), the visitor's own
   * otherwise (`restored`). Gated like a clear: a writable phase, a snapshot
   * in hand, and the page target at rest.
   */
  async revertToStored(): Promise<void> {
    if (!this.clearEnabled(this.#capable())) return;
    const q = this.#queue;
    const id = this.#session.identity;
    if (!q || !id || this.#session.phase !== "connected") return;
    const gen = this.#generation;
    const { P, T } = await heavyModules();
    this.action = "discard";
    this.leg = "ram";
    this.cause = undefined;
    this.phase = "writing";
    this.steps = [];
    this.#inFlight = true;
    this.#session.writeLock = true;
    this.#armSlow();
    try {
      await q.request(P.discardPage(), "discard");
      if (gen !== this.#generation) return;
      const kept = this.keptThisSession;
      this.lastWritten = undefined;
      this.name = undefined;
      this.cause = undefined;
      this.phase = kept ? "kept" : "restored";
      this.#recomputeArmed();
      this.#session.announce(
        kept ? liveKept(this.#page()) : liveRestored(this.#page()),
      );
    } catch (err) {
      if (err instanceof T.AbortedError) {
        this.#fail(
          "lost",
          "aborted",
          lostBlock(false, TRY_ON_LABEL, this.#page()).title,
        );
        return;
      }
      if (gen !== this.#generation) return;
      // A discard dropped under a bulk operation answers with nothing, like a
      // store (grid_decode.c:907-909): the restore's own unconfirmed form.
      this.#fail(
        "restored-unconfirmed",
        err instanceof T.NackError ? "nack" : "timeout",
        restoredUnconfirmedBlock(this.#page()).title,
      );
    } finally {
      await T.restorePageChange(q).catch(() => undefined);
      this.#disarmSlow();
      this.#inFlight = false;
      this.#session.writeLock = false;
    }
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
    // 13-12: nothing writes while the page target is not at rest.
    if (!this.pageSettled()) return "page-pending";
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
    const strings: ConfigStrings = {
      systemTimer: this.#pageTimer(config, P),
      system: this.#pageInit(config, P),
      systemUtility: this.#pageUtility(config, P),
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
    // 13-12: not while a switch is pending or unverified - the page the
    // snapshot names may be about to stop being the active one.
    if (!this.pageSettled()) return;
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
          restoredUnconfirmedBlock(this.#page()).title,
        );
        return;
      }
      this.keptThisSession = false;
    }
    this.cause = undefined;
    this.phase = "restored";
    this.#recomputeArmed();
    this.#session.announce(liveRestored(this.#page()));
  }

  // --- the fourth click: CLEAR ---------------------------------------------

  /**
   * CLEAR. Writes the FIRMWARE'S OWN default configuration back into the
   * module's RAM - not emptiness (A-48, D-20). The Editor's `clearElement()`
   * is `resetDefault()` followed by `sendToGrid()`, and `resetDefault()` takes
   * each event's own `defaultConfig`; this is the same strings, through the
   * same one writer, in the same order.
   *
   * IT RESETS BOTH ELEMENTS, AND THE REASON IS D-21 (12-03, research option
   * A). The line beside the control is `Reset the current page to factory
   * default` - 41 characters, locked - and since 12-03 HANGAR writes the
   * SYSTEM element's page-init slot as well as the touch element's pair. A
   * clear that reset only the touch element would leave HANGAR's own library
   * sitting in the page init, and the line would be untrue by one element on a
   * page HANGAR did write. So the page init is reset too, with the package's
   * own `SYSTEM_DEFAULT_SETUP` - and since 12.1-07 the system element's Timer
   * (255/6, the library's second half) with its own `SYSTEM_DEFAULT_TIMER`,
   * `--[[@cb]]print("tick")`: a debug print that runs once on the module when
   * the write lands and prints to nobody, and then never again, because the
   * page init that armed it is the firmware's own and arms nothing - and
   * since 13-17 the system element's utility (255/4) with its own
   * `SYSTEM_DEFAULT_UTILITY`, page-next, which is what the module's utility
   * button did before HANGAR wrote anything.
   *
   * AND THAT IS ALSO WHAT MAKES A KEEP AFTER A CLEAR LEAVE NOTHING BEHIND.
   * Writing an event its OWN default sets `cfg_default_flag`
   * (`../grid-fw/common/src/c/grid_ui.c:398-409`), and
   * `grid_ui_bulk_page_store` then DELETES the cfg file rather than writing it
   * (`:1126-1134`). So a cleared page stored to flash leaves no HANGAR file on
   * the module at all - 255/6 included, on the same rule (12-RESEARCH 1c).
   * One more acknowledgement per clear per slot is the whole cost.
   *
   * RAM ONLY, AND THAT IS ASSERTED BY CLASS RATHER THAN SAID IN COPY (A-26).
   * Five CONFIG/EXECUTE and no PAGESTORE/EXECUTE: the Editor calls
   * sendToGrid(), never store(), so a power cycle brings back whatever is in
   * flash. D-21 fixed the line beside the control at 41 characters and it does
   * not mention the power cycle, so install.spec.ts's by-class count is where
   * that fact now lives.
   *
   * NO COMPILER ON THIS PATH, AND THAT IS DELIBERATE. The try-on writes a
   * configuration the tuner compiled; a clear writes five strings that are
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
      systemTimer: P.SYSTEM_DEFAULT_TIMER,
      system: P.SYSTEM_DEFAULT_SETUP,
      systemUtility: P.SYSTEM_DEFAULT_UTILITY,
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
    this.#session.announce(liveCleared(this.#page()));
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
    if (!this.pageSettled()) return;
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
   * The store leg, shared by the keep and by a put-back after a keep. One
   * PAGESTORE/EXECUTE through the queue under pagestoreMs (3000 ms, from the
   * descriptor; on a rig N acknowledgements resolve it once), then the D-12
   * proof: wait for the ZONA's next heartbeat, then re-fetch all five strings for
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
        const after = await T.fetchAll(
          q,
          this.#session.identity ?? id,
          "refetch",
        );
        if (gen !== this.#generation) return false;
        this.refetchRounds = round + 1;
        // Five for five, one per SLOTS row (12.1-07, 13-17), the way runNoOpCycle
        // compares: a slot added to the list is compared here without a line.
        if (
          T.SLOTS.every(
            (slot) => after[slot.key].actionString === sent[slot.key],
          )
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
        this.#fail(
          "lost",
          "aborted",
          lostBlock(true, TRY_ON_LABEL, this.#page()).title,
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
    this.landedSlots = [];
    this.failedSlots = [];
    this.phase = "writing";
    this.steps = [];
    this.#inFlight = true;
    this.#session.writeLock = true;
    this.#armSlow();
    try {
      // The system timer, the page init, the utility, then Timer, then
      // Setup, ACK each (sequence.ts writeAll over SLOTS, which owns the
      // order). Verbatim.
      await T.writeAll(q, T.targetOf(id), strings);
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
   *   NackError, the first slot already ok        partial         nack
   *   NackError otherwise                         nothing-landed  nack
   *   anything else, the first slot ok            partial         timeout
   *   anything else otherwise                     nothing-landed  timeout
   *
   * FIVE WRITES, FIVE STEP IDS, AND ONLY FOUR PARTIALS CAN OCCUR. The writer
   * is sequential and aborts on the first failure (sequence.ts writeAll), and
   * its order is SLOTS' - the system timer, the page init, the utility, the
   * Timer, the Setup (12.1-06's three reasons, 13-17's row). So what landed
   * is always a PREFIX of the list, and the classifier reads it as one: it
   * walks SLOTS in order and stops at the first write that was not
   * acknowledged.
   *
   *   write-system-timer failed                        nothing landed
   *   255/6 ok, write-system bad                       the system timer, and only it
   *   255/6 and 255/0 ok, write-system-utility bad     the system timer and the page init
   *   255/6, 255/0 and 255/4 ok, write-timer bad       all but the touch pair
   *   255/6, 255/0, 255/4 and 0/6 ok, write-setup bad  all but the Setup
   *
   * "A LATER SLOT LANDED AND AN EARLIER ONE DID NOT" CANNOT HAPPEN WITH THIS
   * WRITER - 12-03's "the page init did not land but the Setup did", one slot
   * wider - and it is worth saying out loud because 12-RESEARCH Pitfall 6
   * describes exactly that state and a reader will come here looking for it.
   * It is a real firmware state - a module can hold a touch Setup calling a
   * library its page init does not define, or a page init arming a timer
   * whose body is still firmware's - but nothing HANGAR does produces it,
   * because the write that would have to fail first is the one that goes
   * first. The worst case this store can reach is the last row: the module
   * runs the OLD Setup against a NEW library, which is harmless.
   *
   * `partial` is read off the recorded steps, in write order, never off a
   * message. The words the block interpolates are install-copy.ts's closed
   * unions (one pairing per reachable row; 12.1-08 wrote the sentences for
   * four, 13-17 for five), chosen by the length of the landed prefix, as a
   * table indexed by that length; the labels themselves
   * are published beside them as `landedSlots` / `failedSlots`. A timeout
   * cause then asks the pacing rule whether to escalate.
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
      this.#fail(
        "lost",
        "aborted",
        lostBlock(false, TRY_ON_LABEL, this.#page()).title,
      );
      return;
    }
    const cause: InstallCause = err instanceof T.NackError ? "nack" : "timeout";
    const landedStep = (id: string): boolean =>
      this.steps.some((s) => s.id === id && s.outcome === "ok");
    // The landed PREFIX of SLOTS, in write order: the writer stops at the
    // first failure, so the first slot whose write was not acknowledged ends
    // the prefix and every later slot was never attempted.
    let landedCount = 0;
    while (
      landedCount < T.SLOTS.length &&
      landedStep(T.SLOTS[landedCount].write)
    ) {
      landedCount++;
    }
    if (landedCount > 0) {
      // Every row names the landed prefix in write order (12.1-08; 13-17 the
      // utility script third). One table, indexed by the prefix length; a
      // sixth row would be a type error against the closed unions.
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
      this.landedSlots = T.SLOTS.slice(0, landedCount).map((s) => s.label);
      this.failedSlots = T.SLOTS.slice(landedCount).map((s) => s.label);
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
