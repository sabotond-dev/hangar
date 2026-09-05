// The walking skeleton's run, as functions instead of as a page (FOUND-01).
//
// Everything here is worth testing and nothing here touches the DOM: identity
// folded out of inbound heartbeats, the two fetches, the write-back in D-11's
// order, the store, the burst probe, and the closing heartbeat that gives the
// module its page changes back. The page is the part that is not worth
// testing; it wires a transport and a queue to these and renders what they
// report.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { grid } from "@intechstudio/grid-protocol";
import {
  EVENT_SETUP,
  EVENT_TIMER,
  IDENTIFY_WINDOW_MS,
  ZONA_HWCFG,
  type DecodedClass,
  type FetchedEvent,
  canWriteBack,
  fetchConfig,
  hostHeartbeat,
  sendConfig,
  storePage,
} from "$lib/protocol";
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
  /** PAGESTORE is a global broadcast, so a second module makes it unsafe here (D-12). */
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
  before: { setup: FetchedEvent; timer: FetchedEvent };
  after: { setup: FetchedEvent; timer: FetchedEvent };
  byteIdentical: boolean;
  /** True once the closing HEARTBEAT TYPE 255 has been sent, in either arm. */
  pageChangeRestored: boolean;
}

export interface FetchedPair {
  setup: FetchedEvent;
  timer: FetchedEvent;
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
 * else on the bus is another module, and its presence disables the store.
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
 * Read both events back off the module, one request at a time.
 *
 * `stage` picks the pinned step ids the run reports under: the cycle fetches
 * once before the write-back and once after it, and plan 05's gate reads those
 * four ids to tell the two apart.
 */
export async function fetchBoth(
  q: RequestQueue,
  id: Identity,
  stage: "fetch" | "refetch" = "fetch",
): Promise<FetchedPair> {
  const setup = await q.request(
    fetchConfig(id.zona.sx, id.zona.sy, id.activePage, EVENT_SETUP),
    stage === "fetch" ? "fetch-setup" : "refetch-setup",
  );
  const timer = await q.request(
    fetchConfig(id.zona.sx, id.zona.sy, id.activePage, EVENT_TIMER),
    stage === "fetch" ? "fetch-timer" : "refetch-timer",
  );
  return {
    setup: fetched(setup, EVENT_SETUP, "Setup"),
    timer: fetched(timer, EVENT_TIMER, "Timer"),
  };
}

/**
 * Write both strings back into the module's RAM, in D-11's order.
 *
 * _pad.ts:3898-3936 (vendored, cited by filename only - never imported here).
 * Timer (6) first, then Setup (0): the field-tested order, and the reason the
 * BOTOR mixed-state incident left the Timer landed and the Setup missing
 * rather than the reverse. Sequential, one acknowledgement at a time, each
 * reported under its own pinned step id, so a half-landed write names which
 * half landed.
 */
export async function writeBack(
  q: RequestQueue,
  id: Identity,
  f: FetchedPair,
): Promise<void> {
  await q.request(
    sendConfig(
      id.zona.sx,
      id.zona.sy,
      id.activePage,
      EVENT_TIMER,
      f.timer.actionString ?? "",
    ),
    "write-timer",
  );
  await q.request(
    sendConfig(
      id.zona.sx,
      id.zona.sy,
      id.activePage,
      EVENT_SETUP,
      f.setup.actionString ?? "",
    ),
    "write-setup",
  );
}

/**
 * Commit the module's RAM config to flash. Outside the cycle, behind its own
 * click (D-11), and never while a second module is on the bus (D-12).
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
  id: Identity,
): Promise<void> {
  if (!id.storeAllowed) {
    throw new Error(
      "Another module is on the bus and a page store is a global broadcast, so the store is disabled",
    );
  }
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
    const before = await fetchBoth(q, id);
    // D-09: a write is only provably a no-op when the string it writes back is
    // one the module really handed over.
    const guard = canWriteBack([before.setup, before.timer]);
    if (!guard.ok) throw new Error(guard.reason);
    await writeBack(q, id, before);
    const after = await fetchBoth(q, id, "refetch");
    cycle = {
      before,
      after,
      byteIdentical:
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
