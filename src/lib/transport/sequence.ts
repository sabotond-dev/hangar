// The walking skeleton's run, as functions instead of as a page (FOUND-01).
//
// Everything here is worth testing and nothing here touches the DOM: identity
// folded out of inbound heartbeats, the fetches, writeAll - the ONE writer,
// system setup then Timer then Setup, that TRY ON DEVICE, PUT BACK and the
// skeleton's write-back reach (Phase 7, SAFE-03; Phase 12 added the first of
// the three) - the store, the burst probe, and the closing heartbeat that gives
// the module its page changes back. The page is the part that is not worth
// testing; it wires a transport and a queue to these and renders what they
// report.
//
// ONE FETCHER AND ONE WRITER, EACH OVER THREE EVENTS. 12-02 shipped fetchAll
// and writeAll beside two-event adapters, so that nothing above the transport
// moved inside that plan; 12-03 moved the store, the tuner, the probe page,
// both e2e files and the runbooks in ONE plan, and the adapters are gone with
// their promise kept. Nothing here counts two any more, and sequence.spec.ts
// asserts the removal by name rather than leaving it to a reader's memory.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { grid } from "@intechstudio/grid-protocol";
import {
  ELEMENT_SYSTEM,
  ELEMENT_TOUCH,
  EVENT_SETUP,
  EVENT_TIMER,
  IDENTIFY_WINDOW_MS,
  ZONA_HWCFG,
  type DecodedClass,
  type FetchedEvent,
  canWriteBack,
  fetchConfig,
  fetchSerialNumber,
  hostHeartbeat,
  moduleKeyOf,
  sendConfig,
  storePage,
} from "$lib/protocol";
import type { StepId } from "./capture";
import { NackError, type RequestQueue } from "./queue";

export interface ModuleSeen {
  sx: number;
  sy: number;
  rot: number;
  hwcfg: number;
  moduleType: string | undefined;
  revision: string | undefined;
  heartbeatType: number;
  firmware: { major: number; minor: number; patch: number };
  lastSeen: number;
}

export interface Identity {
  zona: ModuleSeen;
  activePage: number;
  otherModules: ModuleSeen[];
  /**
   * Informational since Phase 7. Phase 2's D-12 refused a page store on this
   * field; SAFE-06 (07-CONTEXT D-05) allows the store on a rig and names the
   * other modules in a confirmation instead. Nothing refuses on this field any
   * more - it is still here because the captures and fixtures.spec.ts shape it.
   */
  storeAllowed: boolean;
}

/**
 * The accumulator absorbFrame folds heartbeats into. activePage starts
 * undefined on purpose: the page is unknown until a heartbeat reports it, and a
 * zero default is exactly the silent no-op D-10 exists to prevent.
 */
export interface IdentifyState {
  /** Keyed `${sx},${sy}`. */
  seen: Map<string, ModuleSeen>;
  activePage: number | undefined;
  /** performance.now() at connect, for IDENTIFY_WINDOW_MS. */
  firstSeenAt: number;
}

export interface CycleResult {
  before: FetchedSet;
  after: FetchedSet;
  byteIdentical: boolean;
  /** True once the closing HEARTBEAT TYPE 255 has been sent, in either arm. */
  pageChangeRestored: boolean;
}

export interface BurstResult {
  preSendDelayMs: number;
  n: number;
  timeouts: number;
  nacks: number;
  latencyMs: { min: number; p50: number; max: number };
}

/** The module the package knows about, keyed by the number its heartbeat carries. */
interface HwcfgEntry {
  type: string;
  revision: string;
  hwcfg: string | number;
}

const now = () => performance.now();

/** A fresh accumulator. The active page is unknown until a heartbeat says so. */
export function newIdentifyState(startedAt: number = now()): IdentifyState {
  return { seen: new Map(), activePage: undefined, firstSeenAt: startedAt };
}

/**
 * True once the identify window has passed with nothing to show for it. Its
 * absence means the module is not the USB-attached one (or is on firmware
 * older than the piggybacked page report), so the page refuses and says so
 * rather than guessing a page.
 */
export function identifyTimedOut(
  state: IdentifyState,
  at: number = now(),
): boolean {
  return at - state.firstSeenAt > IDENTIFY_WINDOW_MS;
}

/**
 * Fold one decoded frame's classes into the seen-module map and the active
 * page.
 *
 * Both numeric coercions are required and the desktop does both
 * (runtime.ts:2366, :2370): module_type_from_hwcfg needs a NUMBER, and
 * module_hwcfgs() stores its hwcfg as a STRING.
 *
 * `at` is the clock reading `lastSeen` is stamped with. It defaults to this
 * module's own clock so every existing caller is unchanged; the session passes
 * its injected clock, so its liveness watchdog and this fold agree about time.
 */
export function absorbFrame(
  classes: DecodedClass[],
  state: IdentifyState,
  at: number = now(),
): void {
  const seenAt = at;
  let heartbeatInThisFrame = false;

  for (const cls of classes) {
    if (cls.class_name !== "HEARTBEAT") continue;
    heartbeatInThisFrame = true;
    const p = cls.class_parameters;
    const brc = cls.brc_parameters;
    const hwcfg = Number(p.HWCFG);
    const entry = (grid.module_hwcfgs() as unknown as HwcfgEntry[]).find(
      (e) => Number(e.hwcfg) === hwcfg,
    );
    const sx = Number(brc.SX);
    const sy = Number(brc.SY);
    state.seen.set(`${sx},${sy}`, {
      sx,
      sy,
      rot: Number(brc.ROT),
      hwcfg,
      moduleType: grid.module_type_from_hwcfg(hwcfg) as string | undefined,
      revision: entry?.revision,
      heartbeatType: Number(p.TYPE),
      firmware: {
        major: Number(p.VMAJOR),
        minor: Number(p.VMINOR),
        patch: Number(p.VPATCH),
      },
      lastSeen: seenAt,
    });
  }

  // Three conditions, all required, before the active page moves (D-10):
  //
  //   1. the class carries a PAGENUMBER;
  //   2. a HEARTBEAT rode in the SAME decoded frame - firmware appends the
  //      page report to its own heartbeat and to nothing else
  //      (grid_transport.c:199-203);
  //   3. the class carries neither EVENTTYPE nor ACTIONLENGTH.
  //
  // Without 2 and 3 a CONFIG/REPORT - which also carries a PAGENUMBER, and
  // arrives on every single fetch - would silently retarget the whole run at
  // whatever page was last fetched.
  if (!heartbeatInThisFrame) return;
  for (const cls of classes) {
    const p = cls.class_parameters;
    if (p.PAGENUMBER === undefined) continue;
    if (p.EVENTTYPE !== undefined || p.ACTIONLENGTH !== undefined) continue;
    state.activePage = Number(p.PAGENUMBER);
  }
}

/**
 * Resolve once a ZONA reporting heartbeat type 1 - the USB-attached module,
 * `grid_decode.c:695-700` - and an active page have both been seen. Anything
 * else on the bus is another module; it is named in `otherModules` so the
 * identity line and the flash confirmation can say so (SAFE-06). Its presence
 * no longer disables anything - `storeAllowed` is informational since Phase 7.
 */
export function identify(state: IdentifyState): Identity | undefined {
  if (state.activePage === undefined) return undefined;
  const modules = [...state.seen.values()];
  const zona = modules.find(
    (m) => m.heartbeatType === 1 && m.hwcfg === ZONA_HWCFG,
  );
  if (!zona) return undefined;
  const otherModules = modules.filter((m) => m !== zona);
  return {
    zona,
    activePage: state.activePage,
    otherModules,
    storeAllowed: otherModules.length === 0,
  };
}

const fetched = (
  cls: DecodedClass,
  event: number,
  label: FetchedEvent["label"],
): FetchedEvent => {
  const length = cls.class_parameters.ACTIONLENGTH;
  const config = cls.class_parameters.ACTIONSTRING;
  return {
    event,
    label,
    actionString: config === undefined ? undefined : String(config),
    actionLength: length === undefined ? undefined : Number(length),
  };
};

/**
 * ONE FETCH, ONE STEP ID, ONE FetchedEvent - the primitive the fetcher below is
 * built from. It stayed after 12-03 removed the two-event adapters it was
 * written to keep honest, because the alternative is three near-identical
 * request-and-label blocks inside one function.
 */
async function fetchOne(
  q: RequestQueue,
  id: Identity,
  event: number,
  element: number,
  label: FetchedEvent["label"],
  step: StepId,
): Promise<FetchedEvent> {
  const cls = await q.request(
    fetchConfig(id.zona.sx, id.zona.sy, id.activePage, event, element),
    step,
  );
  return fetched(cls, event, label);
}

/** One write, one step id. The counterpart of fetchOne. */
async function writeOne(
  q: RequestQueue,
  target: WriteTarget,
  event: number,
  element: number,
  config: string,
  step: StepId,
): Promise<void> {
  await q.request(
    sendConfig(target.sx, target.sy, target.page, event, config, element),
    step,
  );
}

/** All three strings a module holds for HANGAR: system setup, touch Setup, touch Timer. */
export interface FetchedSet {
  system: FetchedEvent;
  setup: FetchedEvent;
  timer: FetchedEvent;
}

/**
 * Read all THREE back: the system element's setup (255/0) and both touch
 * events. THE ONE FETCHER since 12-03.
 *
 * FETCH ORDER IS FREE - firmware answers each request on its own and no fetch
 * runs anything - but it is written system-first anyway so a capture's steps[]
 * reads in the same order as the write below, and a reader comparing a fetch
 * trace with a write trace is not comparing two different orderings.
 *
 * Events 4 and 6 of element 255 are NOT fetched. See constants.ts's header:
 * event 4 is the module's physical utility button, and HANGAR does not
 * snapshot what it will never write back.
 *
 * `stage` picks the pinned step ids the run reports under: the cycle and the
 * store proof fetch once before the write and once after it, and plan 05's
 * gate reads those six ids to tell the two apart.
 */
export async function fetchAll(
  q: RequestQueue,
  id: Identity,
  stage: "fetch" | "refetch" = "fetch",
): Promise<FetchedSet> {
  const system = await fetchOne(
    q,
    id,
    EVENT_SETUP,
    ELEMENT_SYSTEM,
    "System",
    stage === "fetch" ? "fetch-system" : "refetch-system",
  );
  const setup = await fetchOne(
    q,
    id,
    EVENT_SETUP,
    ELEMENT_TOUCH,
    "Setup",
    stage === "fetch" ? "fetch-setup" : "refetch-setup",
  );
  const timer = await fetchOne(
    q,
    id,
    EVENT_TIMER,
    ELEMENT_TOUCH,
    "Timer",
    stage === "fetch" ? "fetch-timer" : "refetch-timer",
  );
  return { system, setup, timer };
}

/**
 * The three strings a full write puts on the wire. Verbatim, never compressed
 * here. `system` is the page-init slot the shared library lives in; the other
 * two are the touch element's.
 */
export interface ConfigSet {
  system: string;
  setup: string;
  timer: string;
}

/** Where a write goes: the ZONA's own address and its REPORTED active page (D-10). */
export interface WriteTarget {
  sx: number;
  sy: number;
  page: number;
}

export const targetOf = (id: Identity): WriteTarget => ({
  sx: id.zona.sx,
  sy: id.zona.sy,
  page: id.activePage,
});

/**
 * Write all three into the module's RAM: SYSTEM SETUP, THEN TOUCH TIMER, THEN
 * TOUCH SETUP. This order and no other, and the two reasons are independent.
 *
 * THE ONE WRITER FOR FOUR CLICKS. TRY ON DEVICE, PUT BACK, CLEAR and the
 * skeleton's write-back all come through here; writeBack below is a two-line
 * adapter. The strings go on the wire VERBATIM - never compressed here
 * (07-RESEARCH, the D-10 measurement: cost().used === setupLua.length with
 * reserve 0/0). THE ORDER IS NOT THE CALLER'S TO GET WRONG: it lives in this
 * function, so a caller that hands the set over with its keys in another
 * order changes nothing at all, and sequence.spec.ts asserts that.
 *
 * REASON ONE, THE NEW ONE (Phase 12). A written body is registered AND RUN
 * IMMEDIATELY, in write order: ../grid-fw/common/src/c/grid_decode.c:1286-1287
 * calls `grid_ui_register_script` and then `grid_ui_process_single` inside the
 * same accepted-write branch. So at install time the initialisation order is
 * HANGAR's, not the firmware's page-load order. A touch Setup that calls a
 * library function by name before the system setup that defines it has been
 * written raises `attempt to call a nil value` ONCE, at install, on the user's
 * desk - and installs no `touch_cb` at all, so the pad goes dead rather than
 * looking wrong. The system element's slot is where the library belongs
 * because it is the slot firmware runs first on a page load
 * (../grid-fw/common/src/lua/init.lua:46-50), and 12-00's slot probe confirmed
 * on hardware that an event body is callable from another event's body and
 * that its globals persist.
 *
 * REASON TWO, THE OLD ONE. Timer (6) before Setup (0). _pad.ts:3908-3913
 * (vendored, cited by filename only - never imported here) gives the reason
 * and it is not stylistic: gtt is a no-op until the Timer event holds at least
 * one stored action, and Setup runs immediately in the live VM - so a
 * Setup-first write arms a timer that does not exist yet and the pad simply
 * sits still. It is also why the BOTOR mixed-state incident left the Timer
 * landed and the Setup missing rather than the reverse. Unchanged by Phase 12,
 * and unaffected by the first write.
 *
 * EVENTS 4 AND 6 OF ELEMENT 255 ARE NEVER WRITTEN. Three writes per install,
 * not five. constants.ts's header carries the reason: event 4 is the module's
 * physical utility button, event 6 a second timer nothing arms.
 *
 * Sequential, one acknowledgement at a time, each under its own pinned step
 * id, and aborting on the first failure - so a half-landed write names which
 * halves landed, and "the system setup did not land but the touch Setup did"
 * cannot occur.
 */
export async function writeAll(
  q: RequestQueue,
  target: WriteTarget,
  s: ConfigSet,
): Promise<void> {
  await writeOne(
    q,
    target,
    EVENT_SETUP,
    ELEMENT_SYSTEM,
    s.system,
    "write-system",
  );
  await writeOne(q, target, EVENT_TIMER, ELEMENT_TOUCH, s.timer, "write-timer");
  await writeOne(q, target, EVENT_SETUP, ELEMENT_TOUCH, s.setup, "write-setup");
}

/** Phase 2's caller, unchanged in behaviour, now an adapter over writeAll. */
export async function writeBack(
  q: RequestQueue,
  id: Identity,
  f: FetchedSet,
): Promise<void> {
  await writeAll(q, targetOf(id), {
    system: f.system.actionString ?? "",
    setup: f.setup.actionString ?? "",
    timer: f.timer.actionString ?? "",
  });
}

/**
 * The module's own key, or a throw the caller degrades from (D-04 amended).
 *
 * Addressed to the ZONA's SX/SY, never broadcast - see fetchSerialNumber's
 * comment for the wire fact behind that. A module that does not answer times
 * out on the queue's bounded attempts; the caller's fallback is a session-only
 * snapshot with honest copy, never a guessed key.
 */
export async function fetchModuleKey(
  q: RequestQueue,
  id: Identity,
): Promise<string> {
  const cls = await q.request(
    fetchSerialNumber(id.zona.sx, id.zona.sy),
    "fetch-serial",
  );
  return moduleKeyOf(cls);
}

/**
 * Commit the module's RAM config to flash. Outside the cycle, behind its own
 * click (D-11).
 *
 * The store is a GLOBAL BROADCAST (storePage() addresses -127,-127 and
 * firmware accepts it as IS_ME | IS_GLOBAL): every module on the bus stores
 * its own active page and answers with its own acknowledgement echoing the
 * same LASTHEADER. The queue resolves on the first and the rest are delivered
 * to nobody (queue.ts `settle` nulls the waiter). That is SAFE-06's whole
 * reason for existing, and in Phase 7 it is a confirmation sentence naming the
 * other modules - not a refusal. Phase 2's D-12 threw here on
 * `id.storeAllowed`; that rule was the skeleton's and is undone by name
 * (07-CONTEXT D-18). `id` stays a parameter for the step's provenance and for
 * symmetry with the other sequences; it is currently unread.
 *
 * Two honest caveats, both worth saying out loud on the page:
 *
 *   - the module's border LEDs animate yellow-dim while the store runs and
 *     then settle (grid_decode.c:986-987). That is the store working, not a
 *     fault.
 *   - the success callback reloads the page from flash and restarts the Lua VM
 *     (grid_decode.c:956-960). So "provable no-op" is a claim about the stored
 *     bytes, not about the running script, which is restarted exactly as a
 *     page change would restart it.
 */
export async function storeToFlash(
  q: RequestQueue,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- provenance and symmetry; see the comment above
  id: Identity,
): Promise<void> {
  await q.request(storePage(), "store");
}

/**
 * Send one HEARTBEAT/EXECUTE TYPE 255.
 *
 * Firmware clears page_change_enabled on every successful config write
 * (grid_decode.c:1279) and only this restores it (grid_decode.c:717) - the
 * timeout restore at grid_esp32_port.c:480 is commented out. So this runs
 * after every cycle, in both A/B arms, after an error, and from a button the
 * user can press at any time. Without it the module cannot change page until
 * it is power-cycled, which is not a no-op.
 */
export async function restorePageChange(q: RequestQueue): Promise<void> {
  await q.sendImmediate(hostHeartbeat(), "restore-page-change");
}

/**
 * Fetch, refuse or write back, re-fetch, compare - and give the module its
 * page changes back whatever happened.
 */
export async function runNoOpCycle(
  q: RequestQueue,
  id: Identity,
): Promise<CycleResult> {
  let cycle: CycleResult | undefined;
  try {
    const before = await fetchAll(q, id);
    // D-09: a write is only provably a no-op when the string it writes back is
    // one the module really handed over. THREE strings since 12-03: the system
    // element's setup is written back too, so it is guarded too.
    const guard = canWriteBack([before.system, before.setup, before.timer]);
    if (!guard.ok) throw new Error(guard.reason);
    await writeBack(q, id, before);
    const after = await fetchAll(q, id, "refetch");
    cycle = {
      before,
      after,
      byteIdentical:
        before.system.actionString === after.system.actionString &&
        before.setup.actionString === after.setup.actionString &&
        before.timer.actionString === after.timer.actionString,
      pageChangeRestored: false,
    };
    return cycle;
  } finally {
    // Mandatory. See restorePageChange's own comment: this runs even when a
    // write rejects, which is exactly the case that would otherwise leave the
    // user's module unable to change page until it is power-cycled.
    await restorePageChange(q);
    if (cycle) cycle.pageChangeRestored = true;
  }
}

/**
 * Twenty consecutive read-only fetches, one outstanding at a time.
 *
 * Better evidence than the two writes the cycle performs: a CONFIG/FETCH is 49
 * bytes out and produces a roughly 690-byte REPORT, against a 512-byte CDC RX
 * buffer feeding a 2048-byte ring that silently discards a whole message when
 * it cannot fit (grid_transport.c:151-153). Nothing is written to the module.
 *
 * `preSendDelayMs` is recorded, not applied: the queue owns the pacing, and
 * this is the value it was built with, so the capture cannot report a gap the
 * run did not use.
 */
export async function runBurstProbe(
  q: RequestQueue,
  id: Identity,
  opts: { n?: number; preSendDelayMs: number },
): Promise<BurstResult> {
  const n = opts.n ?? 20;
  const latencies: number[] = [];
  let timeouts = 0;
  let nacks = 0;

  for (let i = 0; i < n; i++) {
    const startedAt = now();
    try {
      await q.request(
        fetchConfig(id.zona.sx, id.zona.sy, id.activePage, EVENT_SETUP),
        "burst",
      );
      latencies.push(now() - startedAt);
    } catch (err) {
      if (err instanceof NackError) nacks++;
      else timeouts++;
    }
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const at = (i: number) => (sorted.length > 0 ? sorted[i] : Number.NaN);
  return {
    preSendDelayMs: opts.preSendDelayMs,
    n,
    timeouts,
    nacks,
    latencyMs: {
      min: at(0),
      p50: at(Math.floor(sorted.length / 2)),
      max: at(sorted.length - 1),
    },
  };
}
