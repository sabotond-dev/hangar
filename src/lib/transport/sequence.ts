// The walking skeleton's run as functions instead of a page (FOUND-01): identity folded out of
// inbound heartbeats, ONE fetcher and ONE writer over ONE ordered list (SLOTS, one row per slot in
// write order: 255/6, 255/0, 255/4, 0/6, 0/0 - the five strings every write since 13-17 lands, which
// every install click and the skeleton's write-back reach), the store, the burst probe, and the
// closing heartbeat that gives the module its page changes back. Nothing here touches the DOM; the
// page wires a transport and a queue to these and renders what they report. Nothing here counts two
// or three any more (12-03 removed the two-event adapters; sequence.spec.ts asserts it by name).
// Decided at 12-03 / 12.1-06 / 13-17; see .planning/phases/13-gui-overhaul/13-17-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { grid } from "@intechstudio/grid-protocol";
import {
  ELEMENT_SYSTEM,
  ELEMENT_TOUCH,
  EVENT_SETUP,
  EVENT_TIMER,
  EVENT_UTILITY,
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
  /** Informational since Phase 7 (SAFE-06 names the other modules in a confirmation instead of refusing); the captures and fixtures.spec.ts shape it. */
  storeAllowed: boolean;
}

/** The accumulator absorbFrame folds heartbeats into. activePage starts undefined: a zero default is the silent no-op D-10 exists to prevent. */
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

/** True once the identify window has passed with nothing seen: the module is not the USB-attached one (or its firmware predates the page report), so the page refuses rather than guessing. */
export function identifyTimedOut(
  state: IdentifyState,
  at: number = now(),
): boolean {
  return at - state.firstSeenAt > IDENTIFY_WINDOW_MS;
}

/**
 * Fold one decoded frame's classes into the seen-module map and the active page. Both numeric
 * coercions are required, as the desktop does (runtime.ts:2366, :2370): module_type_from_hwcfg needs
 * a NUMBER and module_hwcfgs() stores its hwcfg as a STRING. `at` is the clock `lastSeen` is stamped
 * with; the session passes its injected clock so its liveness watchdog and this fold agree.
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

  // Three conditions before the active page moves (D-10): the class carries a PAGENUMBER; a HEARTBEAT
  // rode in the SAME decoded frame (firmware appends the page report to its own heartbeat and to nothing
  // else, grid_transport.c:199-203); and the class carries neither EVENTTYPE nor ACTIONLENGTH. Without
  // the last two a CONFIG/REPORT, which also carries a PAGENUMBER, would retarget the run at whatever page was last fetched.
  if (!heartbeatInThisFrame) return;
  for (const cls of classes) {
    const p = cls.class_parameters;
    if (p.PAGENUMBER === undefined) continue;
    if (p.EVENTTYPE !== undefined || p.ACTIONLENGTH !== undefined) continue;
    state.activePage = Number(p.PAGENUMBER);
  }
}

/**
 * Resolve once a ZONA reporting heartbeat type 1 (the USB-attached module, `grid_decode.c:695-700`)
 * and an active page have both been seen; anything else on the bus is named in `otherModules` (SAFE-06).
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

/** ONE FETCH, ONE STEP ID, ONE FetchedEvent: the primitive fetchAll is built from. */
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

/**
 * ONE ROW PER SLOT HANGAR WRITES, IN WRITE ORDER (12.1-06). The order is data, not a function body:
 * writeAll and fetchAll iterate it, ConfigSet and FetchedSet are keyed by its `key`s, the step ids the
 * captures and install.spec.ts read are its `write` / `fetch` / `refetch` columns, and the label a
 * refusal names is its `label`. Why this order and no other - three reasons, independent of each other:
 *
 *   REASON ONE (Phase 12). A written body is registered AND RUN IMMEDIATELY, in write order
 *   (../grid-fw/common/src/c/grid_decode.c:1283-1288), so a touch Setup that calls a library function
 *   before the system setup defining it has landed raises `attempt to call a nil value` once, at
 *   install, and installs no `touch_cb`. The library belongs in 255/0, the slot firmware runs first
 *   on a page load (../grid-fw/common/src/lua/init.lua:46-50). Hence 255/0 before 0/6 and 0/0.
 *
 *   REASON TWO (Phase 2, _pad.ts:3908-3913, cited by filename, never imported). Timer (6) before
 *   Setup (0): gtt is a no-op until the Timer event holds a stored action, and Setup runs immediately
 *   in the live VM, so a Setup-first write arms a timer that does not exist yet. Hence 0/6 before 0/0.
 *
 *   REASON THREE (12.1, D-03). The library's second half lives in 255/6 and 255/0 arms it with
 *   `self:tim()`; a 255/0 written before 255/6 would run the firmware's debug print once, at install.
 *   Hence 255/6 FIRST OF ALL.
 *
 * The fifth row, 255/4 (13-17; 13-CONTEXT D-18, D-19), sits after 255/0 and before the touch pair:
 * whatever the utility body calls must be registered before the body runs. sequence.spec.ts asserts
 * the row, its place and its bytes; constants.ts's header carries why it was once refused.
 */
export const SLOTS: readonly {
  readonly element: number;
  readonly event: number;
  readonly key: keyof ConfigSet;
  readonly label: FetchedEvent["label"];
  readonly write: StepId;
  readonly fetch: StepId;
  readonly refetch: StepId;
}[] = [
  {
    element: ELEMENT_SYSTEM,
    event: EVENT_TIMER,
    key: "systemTimer",
    label: "System timer",
    write: "write-system-timer",
    fetch: "fetch-system-timer",
    refetch: "refetch-system-timer",
  },
  {
    element: ELEMENT_SYSTEM,
    event: EVENT_SETUP,
    key: "system",
    label: "System",
    write: "write-system",
    fetch: "fetch-system",
    refetch: "refetch-system",
  },
  {
    element: ELEMENT_SYSTEM,
    event: EVENT_UTILITY,
    key: "systemUtility",
    label: "System utility",
    write: "write-system-utility",
    fetch: "fetch-system-utility",
    refetch: "refetch-system-utility",
  },
  {
    element: ELEMENT_TOUCH,
    event: EVENT_TIMER,
    key: "timer",
    label: "Timer",
    write: "write-timer",
    fetch: "fetch-timer",
    refetch: "refetch-timer",
  },
  {
    element: ELEMENT_TOUCH,
    event: EVENT_SETUP,
    key: "setup",
    label: "Setup",
    write: "write-setup",
    fetch: "fetch-setup",
    refetch: "refetch-setup",
  },
];

/** All FIVE strings a module holds for HANGAR, one per SLOTS row. */
export interface FetchedSet {
  systemTimer: FetchedEvent;
  system: FetchedEvent;
  systemUtility: FetchedEvent;
  setup: FetchedEvent;
  timer: FetchedEvent;
}

/**
 * Read all FIVE back, one per SLOTS row - the one fetcher since 12-03. Fetch order is free (no fetch
 * runs anything) but written in SLOTS order so a capture's steps[] reads as the write does. `stage`
 * picks the pinned step ids: the cycle and the store proof fetch once before the write and once after.
 */
export async function fetchAll(
  q: RequestQueue,
  id: Identity,
  stage: "fetch" | "refetch" = "fetch",
): Promise<FetchedSet> {
  const set: Partial<FetchedSet> = {};
  for (const slot of SLOTS) {
    set[slot.key] = await fetchOne(
      q,
      id,
      slot.event,
      slot.element,
      slot.label,
      stage === "fetch" ? slot.fetch : slot.refetch,
    );
  }
  return set as FetchedSet;
}

/** The five strings a full write puts on the wire, keyed by SLOTS' `key`s. Verbatim, never compressed here. */
export interface ConfigSet {
  systemTimer: string;
  system: string;
  systemUtility: string;
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
 * Write all five into the module's RAM, in SLOTS order and no other (SLOTS carries the three reasons;
 * a caller's key order changes nothing, sequence.spec.ts asserts it). THE ONE WRITER for every click.
 * The strings go on the wire VERBATIM (D-10: cost().used === setupLua.length with reserve 0/0).
 * Sequential, one acknowledgement at a time under its own pinned step id, aborting on the first
 * failure, so a half-landed write names which of the five landed.
 */
export async function writeAll(
  q: RequestQueue,
  target: WriteTarget,
  s: ConfigSet,
): Promise<void> {
  for (const slot of SLOTS) {
    await writeOne(
      q,
      target,
      slot.event,
      slot.element,
      s[slot.key],
      slot.write,
    );
  }
}

/** Phase 2's caller, unchanged in behaviour, now an adapter over writeAll. */
export async function writeBack(
  q: RequestQueue,
  id: Identity,
  f: FetchedSet,
): Promise<void> {
  const set: Partial<ConfigSet> = {};
  for (const slot of SLOTS) set[slot.key] = f[slot.key].actionString ?? "";
  await writeAll(q, targetOf(id), set as ConfigSet);
}

/**
 * The module's own key, or a throw the caller degrades from (D-04 amended). Addressed to the ZONA's
 * SX/SY, never broadcast (fetchSerialNumber's comment); the caller's fallback is a session-only snapshot.
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
 * Commit the module's RAM config to flash, outside the cycle, behind its own click (D-11). A GLOBAL
 * BROADCAST (storePage() addresses -127,-127, accepted as IS_ME | IS_GLOBAL): every module on the bus
 * stores its own active page and acknowledges; the queue resolves on the first (SAFE-06's reason,
 * a confirmation naming the others since Phase 7; Phase 2's throw on `id.storeAllowed` is undone by
 * 07-CONTEXT D-18, and `id` stays for provenance). The border LEDs animate yellow-dim while it runs
 * (grid_decode.c:986-987), and the success callback reloads the page from flash and restarts the Lua
 * VM (grid_decode.c:956-960), so "provable no-op" is a claim about the stored bytes.
 */
export async function storeToFlash(
  q: RequestQueue,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- provenance and symmetry; see the comment above
  id: Identity,
): Promise<void> {
  await q.request(storePage(), "store");
}

/**
 * Send one HEARTBEAT/EXECUTE TYPE 255. Firmware clears page_change_enabled on every successful config
 * write (grid_decode.c:1279) and only this restores it (grid_decode.c:717; the timeout restore at
 * grid_esp32_port.c:480 is commented out), so it runs after every cycle, after an error, and from a button.
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
    // D-09: a write is provably a no-op only when the string it writes back is one the module really
    // handed over. Five strings since 13-17, one per SLOTS row, every one guarded and compared.
    const guard = canWriteBack(SLOTS.map((slot) => before[slot.key]));
    if (!guard.ok) throw new Error(guard.reason);
    await writeBack(q, id, before);
    const after = await fetchAll(q, id, "refetch");
    cycle = {
      before,
      after,
      byteIdentical: SLOTS.every(
        (slot) =>
          before[slot.key].actionString === after[slot.key].actionString,
      ),
      pageChangeRestored: false,
    };
    return cycle;
  } finally {
    // Mandatory even when a write rejects: otherwise the module cannot change page until power-cycled.
    await restorePageChange(q);
    if (cycle) cycle.pageChangeRestored = true;
  }
}

/**
 * Twenty consecutive read-only fetches, one outstanding at a time: a CONFIG/FETCH is 49 bytes out and
 * produces a roughly 690-byte REPORT, against a 512-byte CDC RX buffer feeding a 2048-byte ring that
 * discards a whole message when it cannot fit (grid_transport.c:151-153). Nothing is written.
 * `preSendDelayMs` is recorded, not applied: the queue owns the pacing.
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
