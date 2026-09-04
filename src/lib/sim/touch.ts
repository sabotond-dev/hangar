// Mouse-as-finger, sampled the way the firmware receives a touch.
//
// The interactive pad is only honest if a finger reaches the engine at the rate
// the hardware reads one: at most one sample per contact per 10 ms tick. A
// browser delivers pointermove at whatever rate the mouse and the compositor
// agree on - 125 Hz and 1000 Hz mice both exist - so handing pointer events
// straight to the simulator makes the preview a lie in the direction that
// flatters it. This module stashes samples; the host pops them, one per contact,
// once per tick.
//
// The semantics are the vendored host's (src/vendor/botor/pad-sim-host.ts:292-410),
// which HANGAR reads and never imports. What changed is the lifecycle, not the
// sampling: HANGAR keeps one engine per catalog entry for the whole session and
// simply points the finger at whichever one is centred, so stepping the row
// never restarts a pad at tick 0.
//
// Nothing here knows about the DOM. Pointer events, element geometry and
// pointer capture belong to the Svelte component that owns the canvas; this
// module takes an already-mapped integer coordinate and a pointer id, which is
// what lets the whole rule set be asserted in node.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** The pad tracks five contacts; a sixth pointer is ignored, as on hardware. */
export const MAX_CONTACTS = 5;

// Firmware touch event codes, matching what the engine's touch methods deliver.
const EVT_MOVE = 1;
const EVT_DOWN = 4;
const EVT_UP = 5;

/**
 * Canvas offset to an LED coordinate.
 *
 * The factor is max + 1, not max: the emitted cell expression is x*9//128, so a
 * 128-wide domain lands each ninth of the canvas on exactly one LED column,
 * edges included. hiRes states report coordMax 1023 and scale the same way.
 * A zero or negative extent - an element measured while it is not laid out -
 * returns 0 rather than dividing, because a NaN coordinate would reach the
 * engine and poison a zone.
 */
export function mapAxis(offset: number, extent: number, max: number): number {
  if (extent <= 0) return 0;
  const v = Math.floor((offset / extent) * (max + 1));
  return Math.min(Math.max(v, 0), max);
}

/** The minimum an engine must offer for a finger to reach it. PadSim satisfies it. */
export interface TouchTarget {
  touchDown(id: number, x: number, y: number): void;
  touchMove(id: number, x: number, y: number): void;
  touchUp(id: number, x: number, y: number): void;
}

type PendingSample = { e: number; x: number; y: number };

/**
 * One live pointer: its engine contact slot, its undelivered samples, and the
 * last coordinates it produced. A cancelled pointer carries no useful position,
 * so the UP reuses these.
 */
type Contact = {
  slot: number;
  pending: PendingSample[];
  x: number;
  y: number;
  ended: boolean;
};

/**
 * The pointer-to-engine buffer. The host calls deliver() once per firmware tick
 * and the component calls down / move / end from its pointer handlers.
 */
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
      // Overwriting rather than queueing is what makes a 1000 Hz mouse and a
      // 125 Hz mouse produce the same motion: the tick sees the newest
      // position, never a backlog it has to replay.
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
    // A browser funnels several events into one lift, and the ended flag makes
    // the UP single-shot across all of them. A leaked held contact would stick
    // a zone note exactly the way the firmware bug does, and the preview must
    // not reproduce a bug the compiler's watchdog exists to fix
    // (src/vendor/botor/pad-sim-host.ts:369-374).
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
        // The UP is always the contact's final sample, so the slot frees on
        // its DELIVERY rather than when the lift was reported - until then the
        // engine still holds the contact and the slot is not reusable.
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
