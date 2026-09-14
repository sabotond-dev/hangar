// Mouse-as-finger, sampled the way the firmware receives a touch: at most one sample per contact per
// 10 ms tick, whatever rate the mouse and the compositor deliver pointermove at. This module stashes
// samples; the host pops them, one per contact, once per tick. The semantics are the vendored host's
// (pad-sim-host.ts:292-410), read and never imported; the lifecycle is HANGAR's - one engine per
// entry for the session, the finger pointed at whichever is centred. Nothing here knows the DOM:
// pointer events, geometry and capture belong to the component; this takes an already-mapped integer
// coordinate and a pointer id, which is what lets the whole rule set be asserted in node.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { sensorAt } from "../catalog/calibration";

/** The pad tracks five contacts; a sixth pointer is ignored, as on hardware. */
export const MAX_CONTACTS = 5;

// Firmware touch event codes, matching what the engine's touch methods deliver.
const EVT_MOVE = 1;
const EVT_DOWN = 4;
const EVT_UP = 5;

/**
 * Canvas offset to the raw value the SENSOR reports for a finger at that point: LED n is at u = n
 * (the centre of the n-th ninth of the canvas) and the map is calibration.ts's FORWARD map, sensorAt -
 * piecewise linear over the knots measured on the user's ZONA (Probe C, 2026-09-11), saturating at
 * the outer knots, scaled x8 for a hiRes state (12.1-05; the naive floor(offset / extent * (max + 1))
 * before it drew the finger a third of a cell out once the library read the measured map). The axis
 * defaults to "x" (the two call sites gained their "y" token at 12.1-08). A zero or negative extent
 * returns 0 rather than a NaN that would poison a zone.
 */
export function mapAxis(
  offset: number,
  extent: number,
  max: number,
  axis: "x" | "y" = "x",
): number {
  if (extent <= 0) return 0;
  const u = (offset / extent) * 9 - 0.5; // LED n at u = n
  return sensorAt(u, axis, max); // clamped into 0..max inside
}

/** The minimum an engine must offer for a finger to reach it. PadSim satisfies it. */
export interface TouchTarget {
  touchDown(id: number, x: number, y: number): void;
  touchMove(id: number, x: number, y: number): void;
  touchUp(id: number, x: number, y: number): void;
}

type PendingSample = { e: number; x: number; y: number };

/** One live pointer: its engine slot, its undelivered samples and its last coordinates (a cancelled pointer's UP reuses them). */
type Contact = {
  slot: number;
  pending: PendingSample[];
  x: number;
  y: number;
  ended: boolean;
};

/** The pointer-to-engine buffer: the host calls deliver() once per tick, the component down / move / end. */
export class TouchSampler {
  private contacts = new Map<number, Contact>();
  private slots = new Set<number>();

  /** Number of live contacts. The host uses it to decide the pad is active. */
  get size(): number {
    return this.contacts.size;
  }

  /**
   * Start a contact. Returns false when the pointer is already tracked or all
   * five slots are taken, so the component knows not to capture the pointer.
   */
  down(pointerId: number, x: number, y: number): boolean {
    if (this.contacts.has(pointerId)) return false;
    let slot = -1;
    for (let s = 0; s < MAX_CONTACTS; s++) {
      if (!this.slots.has(s)) {
        slot = s;
        break;
      }
    }
    if (slot === -1) return false;
    this.contacts.set(pointerId, {
      slot,
      pending: [{ e: EVT_DOWN, x, y }],
      x,
      y,
      ended: false,
    });
    this.slots.add(slot);
    return true;
  }

  /** Move a contact. Consecutive MOVEs coalesce to the newest position. */
  move(pointerId: number, x: number, y: number): void {
    const c = this.contacts.get(pointerId);
    if (typeof c === "undefined" || c.ended) return;
    c.x = x;
    c.y = y;
    const last = c.pending[c.pending.length - 1];
    if (typeof last !== "undefined" && last.e === EVT_MOVE) {
      // Overwriting, not queueing: a 1000 Hz mouse and a 125 Hz mouse produce the same motion.
      last.x = x;
      last.y = y;
    } else {
      c.pending.push({ e: EVT_MOVE, x, y });
    }
  }

  /** Lift a contact. Idempotent: several reports of one lift make one UP. */
  end(pointerId: number): void {
    const c = this.contacts.get(pointerId);
    if (typeof c === "undefined" || c.ended) return;
    // A browser funnels several events into one lift; the ended flag makes the UP single-shot. A leaked
    // held contact would stick a zone note the way the firmware bug does (pad-sim-host.ts:369-374).
    c.ended = true;
    c.pending.push({ e: EVT_UP, x: c.x, y: c.y });
  }

  /** At most one sample per contact. Called once per tick, by the host. */
  deliver(target: TouchTarget): void {
    for (const [pid, c] of Array.from(this.contacts.entries())) {
      const sm = c.pending.shift();
      if (typeof sm === "undefined") continue;
      if (sm.e === EVT_DOWN) target.touchDown(c.slot, sm.x, sm.y);
      else if (sm.e === EVT_MOVE) target.touchMove(c.slot, sm.x, sm.y);
      else target.touchUp(c.slot, sm.x, sm.y);
      if (sm.e === EVT_UP) {
        // The UP is the contact's final sample, so the slot frees on its DELIVERY, not when the lift was reported.
        this.contacts.delete(pid);
        this.slots.delete(c.slot);
      }
    }
  }

  /** Drop every contact and free every slot, delivering nothing. */
  clear(): void {
    this.contacts.clear();
    this.slots.clear();
  }
}
