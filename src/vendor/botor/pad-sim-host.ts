// Vendored from sabotond-dev/botor
//   path:   src/renderer/main/zona/pad-sim-host.ts
//   commit: a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c
//   synced: 2026-09-02
// Modified for HANGAR: nothing - the flat vendor layout keeps ./_pad and ./pad-sim valid.
// Original copyright and licence (GNU GPL v3 or later) retained below.

// The panel-owned simulator host: one PadSim engine per shelf card plus
// one for the interactive preview, all stepped by a single
// requestAnimationFrame loop in exact 10 ms firmware ticks. PadPanel
// constructs one SimHost per mounted panel and calls destroy() in
// onDestroy; RightPanelContainer unmounts the panel on tab switch,
// deselection and widget-editor open alike, so that one hook covers
// every leak path. Nothing here reads Date.now - the engines are
// deterministic and this file owns the clock, which is what keeps the
// preview honest against the 100 Hz firmware it models.

import { GRID, encodeStamp, type PadState } from "./_pad";
import { PadSim } from "./pad-sim";

// One firmware tick is 10 ms; the accumulator turns wall-clock frame
// gaps into whole ticks. The clamp is the anti-fast-forward rule: rAF
// stops in a backgrounded window, and on return the animation must
// resume near where it paused instead of replaying minutes of ticks in
// one frame. Phase continuity across a background period is not a
// promise anyone made - the physical pad kept animating and the editor
// did not.
const TICK_MS = 10;
const MAX_CATCHUP_MS = 100;

// Ticking is pointer arithmetic; painting is the expensive half, so the
// two cadences are decoupled: engines step at logical 100 Hz, canvases
// repaint at most every 33 ms.
const RENDER_INTERVAL_MS = 33;

// Reduced motion shows one representative frame instead of a loop. 64
// ticks in, a sine look sits near its peak, so the card shows its colour
// and pattern rather than a black square.
const REDUCED_MOTION_TICKS = 64;

// Thumbnails keep the static art's 108x108 geometry; the preview backs
// its 216 CSS pixels with devicePixelRatio so the cells stay crisp.
const THUMB_CELL = 12;
const PREVIEW_CELL = 24;

// The pad tracks five contacts; a sixth pointer is ignored, as on
// hardware.
const MAX_CONTACTS = 5;

// Firmware touch event codes, matching what the engine's touch methods
// deliver: 1 move, 4 down, 5 up.
const EVT_MOVE = 1;
const EVT_DOWN = 4;
const EVT_UP = 5;

type CardEntry = {
  sim: PadSim | undefined;
  canvas: HTMLCanvasElement;
  stamp: string;
  visible: boolean;
  running: boolean;
};

type PendingSample = { e: number; x: number; y: number };

// One live pointer: its engine contact slot, its undelivered samples,
// and the last coordinates it produced (pointercancel and
// lostpointercapture carry no useful position, so the UP reuses these).
type Contact = {
  slot: number;
  pending: PendingSample[];
  x: number;
  y: number;
  ended: boolean;
};

type PreviewEntry = {
  sim: PadSim;
  canvas: HTMLCanvasElement;
  stamp: string;
  cell: number;
  visible: boolean;
  running: boolean;
  detach: () => void;
};

// The card painter, minus the old static art's shadowBlur: a blurred
// rect per lit cell at 30 fps across nine canvases is measurable jank on
// the renderer thread, and a plain fill reads fine at this size. The
// insets reproduce the previous geometry exactly at cell 12 and scale
// with the preview's larger cells.
function blit(
  canvas: HTMLCanvasElement,
  frame: Uint8Array | undefined,
  cell: number,
): void {
  const g = canvas.getContext("2d");
  if (g === null) return;
  const size = GRID * cell;
  if (canvas.width !== size || canvas.height !== size) {
    canvas.width = size;
    canvas.height = size;
  }
  g.fillStyle = "#0b0b0b";
  g.fillRect(0, 0, size, size);
  g.strokeStyle = "rgba(255,255,255,0.07)";
  g.lineWidth = 1;
  const pad = Math.round(cell / 4);
  const inner = cell - pad * 2;
  for (let n = 0; n < GRID * GRID; n++) {
    const x = (n % GRID) * cell;
    const y = Math.floor(n / GRID) * cell;
    g.strokeRect(x + pad + 0.5, y + pad + 0.5, inner - 1, inner - 1);
    if (typeof frame === "undefined") continue;
    const r = frame[n * 3];
    const gr = frame[n * 3 + 1];
    const b = frame[n * 3 + 2];
    if (r === 0 && gr === 0 && b === 0) continue;
    g.fillStyle = `rgb(${r},${gr},${b})`;
    g.fillRect(x + pad, y + pad, inner, inner);
  }
}

export class SimHost {
  private cards = new Map<string, CardEntry>();
  private preview: PreviewEntry | undefined;
  private contacts = new Map<number, Contact>();
  private slots = new Set<number>();

  private observer: IntersectionObserver | undefined;
  private rafId: number | undefined;
  private lastNow: number | undefined;
  private pendingMs = 0;
  private lastRender = 0;

  private reduced = false;
  private media: MediaQueryList | undefined;
  private mediaHandler: (() => void) | undefined;

  private destroyed = false;

  constructor() {
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function"
    ) {
      this.media = window.matchMedia("(prefers-reduced-motion: reduce)");
      this.reduced = this.media.matches;
      this.mediaHandler = () =>
        this.onReducedChange(this.media?.matches ?? false);
      this.media.addEventListener("change", this.mediaHandler);
    }
  }

  // -------------------------------------------------------------------------
  // Thumbnails. Engines key on state CONTENT via encodeStamp, never on
  // session identity, so store patches (busy flags, faults, playingId)
  // that reach the action as fresh clones change nothing here; only an
  // actual tune rebuilds, and only that one card's engine.

  registerCard(
    id: string,
    canvas: HTMLCanvasElement,
    state: PadState | undefined,
  ): void {
    if (this.destroyed) return;
    this.unregisterCard(id);
    const io = this.ensureObserver();
    const sim = typeof state === "undefined" ? undefined : new PadSim(state);
    const entry: CardEntry = {
      sim,
      canvas,
      stamp: typeof state === "undefined" ? "" : encodeStamp(state),
      // Until the observer's first callback the card is treated as
      // hidden; the immediate blit below means it still shows its
      // picture, it just does not tick yet.
      visible: typeof io === "undefined",
      running: false,
    };
    this.cards.set(id, entry);
    if (this.reduced && typeof sim !== "undefined") {
      sim.run(REDUCED_MOTION_TICKS);
    }
    blit(canvas, sim?.frame, THUMB_CELL);
    io?.observe(canvas);
    this.wake();
  }

  updateCard(
    id: string,
    canvas: HTMLCanvasElement,
    state: PadState | undefined,
  ): void {
    const entry = this.cards.get(id);
    if (typeof entry === "undefined") {
      this.registerCard(id, canvas, state);
      return;
    }
    const stamp = typeof state === "undefined" ? "" : encodeStamp(state);
    if (stamp === entry.stamp) return;
    entry.stamp = stamp;
    if (typeof state === "undefined") {
      entry.sim = undefined;
      entry.running = false;
      blit(entry.canvas, undefined, THUMB_CELL);
      return;
    }
    // Restart from tick 0 with freshly armed phases: exactly what the
    // physical pad does when the debounced audition rewrites Setup and
    // grid_led_reset re-arms the LEDs. The other engines keep their
    // phase and never stutter.
    if (typeof entry.sim === "undefined") entry.sim = new PadSim(state);
    else entry.sim.setState(state);
    if (this.reduced) entry.sim.run(REDUCED_MOTION_TICKS);
    blit(entry.canvas, entry.sim.frame, THUMB_CELL);
    this.wake();
  }

  unregisterCard(id: string): void {
    const entry = this.cards.get(id);
    if (typeof entry === "undefined") return;
    this.observer?.unobserve(entry.canvas);
    this.cards.delete(id);
  }

  // -------------------------------------------------------------------------
  // The interactive preview: its own engine even though the selected
  // card also has a thumbnail, so touch never contaminates the ambient
  // rail picture, and the two can render at different sizes.

  attachPreview(canvas: HTMLCanvasElement, state: PadState): void {
    if (this.destroyed) return;
    this.detachPreview();
    const io = this.ensureObserver();
    const sim = new PadSim(state);
    const dpr =
      typeof devicePixelRatio === "number" && devicePixelRatio > 0
        ? devicePixelRatio
        : 1;
    const cell = Math.max(PREVIEW_CELL, Math.round(PREVIEW_CELL * dpr));
    const onDown = (e: PointerEvent) => this.previewDown(e);
    const onMove = (e: PointerEvent) => this.previewMove(e);
    const onEnd = (e: PointerEvent) => this.previewEnd(e);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onEnd);
    canvas.addEventListener("pointercancel", onEnd);
    canvas.addEventListener("lostpointercapture", onEnd);
    this.preview = {
      sim,
      canvas,
      stamp: encodeStamp(state),
      cell,
      visible: typeof io === "undefined",
      running: false,
      detach: () => {
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onEnd);
        canvas.removeEventListener("pointercancel", onEnd);
        canvas.removeEventListener("lostpointercapture", onEnd);
      },
    };
    blit(canvas, sim.frame, cell);
    io?.observe(canvas);
    this.wake();
  }

  updatePreview(state: PadState): void {
    const pv = this.preview;
    if (typeof pv === "undefined") return;
    const stamp = encodeStamp(state);
    if (stamp === pv.stamp) return;
    pv.stamp = stamp;
    // A retune or card switch mid-drag drops the held contacts: the new
    // Setup starts clean, exactly like the audition rewriting the pad.
    this.clearContacts(pv);
    pv.sim.setState(state);
    blit(pv.canvas, pv.sim.frame, pv.cell);
    this.wake();
  }

  detachPreview(): void {
    const pv = this.preview;
    if (typeof pv === "undefined") return;
    this.clearContacts(pv);
    this.observer?.unobserve(pv.canvas);
    pv.detach();
    this.preview = undefined;
  }

  // -------------------------------------------------------------------------
  // Pointer handling. The handlers only stash samples; delivery into the
  // engine is tick-locked in the loop, at most one sample per contact
  // per tick, reproducing the firmware's 100 Hz pop budget. MOVEs
  // coalesce to the newest; DOWN and UP always keep their place.

  private mapAxis(offset: number, extent: number, max: number): number {
    // The factor is max + 1, not max: the emitted cell expression is
    // x*9//128, so a 128-wide domain lands each ninth of the canvas on
    // exactly one LED column, edges included. hiRes states report
    // coordMax 1023 and scale the same way.
    if (extent <= 0) return 0;
    const v = Math.floor((offset / extent) * (max + 1));
    return Math.min(Math.max(v, 0), max);
  }

  private samplePoint(
    pv: PreviewEntry,
    e: PointerEvent,
  ): { x: number; y: number } {
    const rect = pv.canvas.getBoundingClientRect();
    const max = pv.sim.coordMax;
    return {
      x: this.mapAxis(e.clientX - rect.left, rect.width, max),
      y: this.mapAxis(e.clientY - rect.top, rect.height, max),
    };
  }

  private previewDown(e: PointerEvent): void {
    const pv = this.preview;
    if (typeof pv === "undefined" || this.contacts.has(e.pointerId)) return;
    let slot = -1;
    for (let s = 0; s < MAX_CONTACTS; s++) {
      if (!this.slots.has(s)) {
        slot = s;
        break;
      }
    }
    if (slot === -1) return;
    e.preventDefault();
    try {
      pv.canvas.setPointerCapture(e.pointerId);
    } catch {
      // The canvas can detach between the event and the capture; the
      // contact still works, it just will not follow the pointer out.
    }
    const { x, y } = this.samplePoint(pv, e);
    this.contacts.set(e.pointerId, {
      slot,
      pending: [{ e: EVT_DOWN, x, y }],
      x,
      y,
      ended: false,
    });
    this.slots.add(slot);
    this.wake();
  }

  private previewMove(e: PointerEvent): void {
    const pv = this.preview;
    const c = this.contacts.get(e.pointerId);
    if (typeof pv === "undefined" || typeof c === "undefined" || c.ended) {
      return;
    }
    const { x, y } = this.samplePoint(pv, e);
    c.x = x;
    c.y = y;
    const last = c.pending[c.pending.length - 1];
    if (typeof last !== "undefined" && last.e === EVT_MOVE) {
      last.x = x;
      last.y = y;
    } else {
      c.pending.push({ e: EVT_MOVE, x, y });
    }
    this.wake();
  }

  private previewEnd(e: PointerEvent): void {
    const c = this.contacts.get(e.pointerId);
    if (typeof c === "undefined" || c.ended) return;
    // pointerup, pointercancel and lostpointercapture all funnel here;
    // the ended flag makes the UP single-shot when several fire for one
    // lift. A leaked held contact would stick a zone note exactly the
    // way the firmware bug does, and the preview must not reproduce a
    // bug the compiler's watchdog exists to fix.
    c.ended = true;
    c.pending.push({ e: EVT_UP, x: c.x, y: c.y });
    this.wake();
  }

  private deliverPending(sim: PadSim): void {
    for (const [pid, c] of Array.from(this.contacts.entries())) {
      const sm = c.pending.shift();
      if (typeof sm === "undefined") continue;
      if (sm.e === EVT_DOWN) sim.touchDown(c.slot, sm.x, sm.y);
      else if (sm.e === EVT_MOVE) sim.touchMove(c.slot, sm.x, sm.y);
      else sim.touchUp(c.slot, sm.x, sm.y);
      if (sm.e === EVT_UP) {
        // The UP is always the contact's final sample, so its slot can
        // free for the next pointer immediately after delivery.
        this.contacts.delete(pid);
        this.slots.delete(c.slot);
      }
    }
  }

  private clearContacts(pv: PreviewEntry): void {
    for (const pid of this.contacts.keys()) {
      try {
        pv.canvas.releasePointerCapture(pid);
      } catch {
        // Already released; nothing to undo.
      }
    }
    this.contacts.clear();
    this.slots.clear();
  }

  // -------------------------------------------------------------------------
  // The loop. One rAF for the whole panel; it cancels itself when no
  // engine is running, so the idle panel costs exactly zero, and every
  // event that could wake an engine calls wake().

  private wake(): void {
    if (this.destroyed || typeof this.rafId !== "undefined") return;
    if (typeof requestAnimationFrame !== "function") return;
    this.lastNow = undefined;
    this.rafId = requestAnimationFrame(this.onFrame);
  }

  private onFrame = (now: number): void => {
    this.rafId = undefined;
    if (this.destroyed) return;
    const dt = typeof this.lastNow === "undefined" ? 0 : now - this.lastNow;
    this.lastNow = now;
    this.pendingMs += Math.min(dt, MAX_CATCHUP_MS);
    const ticks = Math.floor(this.pendingMs / TICK_MS);
    this.pendingMs -= ticks * TICK_MS;
    const paint = now - this.lastRender >= RENDER_INTERVAL_MS;
    if (paint) this.lastRender = now;

    let any = false;

    for (const entry of this.cards.values()) {
      const sim = entry.sim;
      if (typeof sim === "undefined") continue;
      const running = entry.visible && !this.reduced && sim.animating;
      if (running) {
        any = true;
        for (let i = 0; i < ticks; i++) sim.tick();
        const still = sim.animating;
        // Paint on the render cadence, and always on the frame where
        // the animation expires, so the freeze frame shown is the true
        // final state and not a 33 ms stale one.
        if (paint || !still) blit(entry.canvas, sim.frame, THUMB_CELL);
        entry.running = still;
      } else if (entry.running) {
        blit(entry.canvas, sim.frame, THUMB_CELL);
        entry.running = false;
      }
    }

    const pv = this.preview;
    if (typeof pv !== "undefined") {
      const active =
        this.contacts.size > 0 || pv.sim.pendingTouches > 0;
      // Reduced motion animates the preview only while the user is
      // actively causing the motion with a pointer; uninvited ambient
      // animation is not the carve-out.
      const running =
        pv.visible && (active || (!this.reduced && pv.sim.animating));
      if (running) {
        any = true;
        for (let i = 0; i < ticks; i++) {
          this.deliverPending(pv.sim);
          pv.sim.tick();
        }
        const still =
          this.contacts.size > 0 ||
          pv.sim.pendingTouches > 0 ||
          (!this.reduced && pv.sim.animating);
        if (paint || !still) blit(pv.canvas, pv.sim.frame, pv.cell);
        pv.running = still;
      } else if (pv.running) {
        blit(pv.canvas, pv.sim.frame, pv.cell);
        pv.running = false;
      }
    }

    if (any) this.rafId = requestAnimationFrame(this.onFrame);
    else this.lastNow = undefined;
  };

  // -------------------------------------------------------------------------
  // Visibility. Root null still respects ancestor overflow clipping, so
  // a card scrolled out of the panel's own scroll container reports
  // hidden; on re-entry it resumes from its frozen phase, no catch-up.

  private ensureObserver(): IntersectionObserver | undefined {
    if (typeof this.observer !== "undefined") return this.observer;
    if (typeof IntersectionObserver === "undefined") return undefined;
    this.observer = new IntersectionObserver(
      (entries) => this.onIntersect(entries),
      { threshold: 0 },
    );
    return this.observer;
  }

  private onIntersect(entries: IntersectionObserverEntry[]): void {
    for (const e of entries) {
      for (const card of this.cards.values()) {
        if (card.canvas === e.target) card.visible = e.isIntersecting;
      }
      const pv = this.preview;
      if (typeof pv !== "undefined" && pv.canvas === e.target) {
        pv.visible = e.isIntersecting;
      }
    }
    this.wake();
  }

  // -------------------------------------------------------------------------
  // Reduced motion, subscribed live so a mid-session OS toggle takes
  // effect without a remount.

  private onReducedChange(reduced: boolean): void {
    this.reduced = reduced;
    if (reduced) {
      // Snap every thumbnail to the representative frame. Restarting
      // from tick 0 makes it deterministic instead of whatever tick the
      // loop happened to reach.
      for (const entry of this.cards.values()) {
        if (typeof entry.sim === "undefined") continue;
        entry.sim.reset();
        entry.sim.run(REDUCED_MOTION_TICKS);
        blit(entry.canvas, entry.sim.frame, THUMB_CELL);
        entry.running = false;
      }
      const pv = this.preview;
      if (typeof pv !== "undefined" && this.contacts.size === 0) {
        blit(pv.canvas, pv.sim.frame, pv.cell);
        pv.running = false;
      }
    }
    this.wake();
  }

  // -------------------------------------------------------------------------
  // Teardown: the single hook PadPanel's onDestroy calls. No setInterval
  // exists anywhere in this design, so after this there is nothing left
  // to leak.

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (typeof this.rafId !== "undefined") {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
    this.detachPreview();
    this.observer?.disconnect();
    this.observer = undefined;
    if (
      typeof this.media !== "undefined" &&
      typeof this.mediaHandler !== "undefined"
    ) {
      this.media.removeEventListener("change", this.mediaHandler);
    }
    this.media = undefined;
    this.mediaHandler = undefined;
    this.cards.clear();
  }
}
