// SimHost: one clock, one finger, one painter, for every pad on the page.
//
// The reference design is the vendored host, src/vendor/botor/pad-sim-host.ts,
// which HANGAR reads and never imports (04-RESEARCH §Pitfall 2: it was written
// for a fixed nine-card rail plus one preview inside an Electron panel, its cell
// sizes and its single render interval are module constants, its painter is
// module-private, and src/vendor may not be edited). Every rule it encodes is a
// bug somebody already paid for, so the explanations are carried over verbatim
// in comments while the code is HANGAR's own.
//
// What HANGAR keeps unchanged:
//
//   - One requestAnimationFrame for the whole page. N loops is N times the
//     scheduler overhead and N chances to desync.
//   - The self-cancelling loop: the last frame with nothing running does not ask
//     for another, so a row of still instruments costs no CPU at all. Every
//     event that could wake an engine calls wake().
//   - Paint on the render cadence AND on the frame an animation expires, so the
//     freeze frame shown is the true final state and not a stale one.
//   - The reduced-motion carve-out: a pad animates under reduced motion only
//     while a pointer is actually down on it. The user causing the motion is the
//     carve-out; uninvited ambient motion is not.
//   - One destroy() that cancels the frame, drops the observers and the media
//     listener, and releases every held contact.
//
// What HANGAR changes (04-CONTEXT D-15, 04-RESEARCH §Architecture Pattern 2):
//
//   - Per-slot paint intervals instead of one global: the hero at 33 ms, the
//     receding sides at 50 ms.
//   - { threshold: 0, rootMargin: "200px" } instead of a bare { threshold: 0 },
//     so a pad wakes BEFORE it crosses the viewport edge instead of showing a
//     frozen frame for a beat.
//   - running = inWindow AND intersecting, not intersecting alone. In a
//     coverflow the far pad is on screen, scaled to a third and hidden behind
//     three others, and an IntersectionObserver answers a geometric question it
//     happily reports as intersecting (04-RESEARCH §Pitfall 4).
//   - One engine per catalog entry for the whole session instead of a separate
//     preview engine, so stepping away and back never restarts a pad at tick 0.
//   - paintPad (one putImageData into a 9x9 backing store) instead of blit.
//
// Nothing here may go into a Svelte rune: $state deep-proxies, and a proxy trap
// inside a 100 Hz tick loop turns a 0.35 us tick into something else entirely
// (04-RESEARCH §Pitfall 3). Engines, canvases and frame buffers live in the
// plain Map below, and only scalars cross into a component.
//
// There is no setInterval anywhere in this design, so after destroy() there is
// nothing left to leak.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { createScratch, GRID_SIDE, paintPad } from "./paint";
import { intervalFor, isLowPower, shouldPaint, ticksFor } from "./schedule";
import { TouchSampler } from "./touch";

/**
 * The engine shape the host accepts, declared structurally rather than imported.
 * The vendored PadSim satisfies it today and Phase 8's Lua engine satisfies it
 * later, which is what keeps this file free of any dependency on src/vendor.
 */
export interface HostEngine {
  tick(): void;
  run(n: number): void;
  reset(): void;
  /** 243 bytes, screen order, RGB. */
  readonly frame: Uint8Array;
  /** True while any layer is still counting down. */
  readonly animating: boolean;
  readonly coordMax: 127 | 1023;
  readonly pendingTouches: number;
  touchDown(id: number, x: number, y: number): void;
  touchMove(id: number, x: number, y: number): void;
  touchUp(id: number, x: number, y: number): void;
}

/**
 * Everything the host needs from a browser, in one injectable record.
 *
 * Each has a real default below. Injecting them is not a testing nicety: there
 * is no browser Vitest project in this repository (04-RESEARCH §Pitfall 6), so
 * this is the only way the loop is testable at all.
 */
export interface HostDeps {
  now(): number;
  raf(cb: (now: number) => void): number;
  caf(handle: number): void;
  /** Observe visibility. Returns an unobserve function. */
  observe(el: unknown, cb: (intersecting: boolean) => void): () => void;
  /** Live reduced-motion source. Returns the current value and an unsubscribe. */
  reducedMotion(cb: (reduced: boolean) => void): {
    matches: boolean;
    stop: () => void;
  };
  lowPower: boolean;
}

type Entry = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | undefined;
  scratch: ImageData | undefined;
  engine: HostEngine;
  hero: boolean;
  /** |slotOffset| <= radius. The half an IntersectionObserver cannot see. */
  inWindow: boolean;
  intersecting: boolean;
  wasRunning: boolean;
  lastPaint: number;
  unobserve: () => void;
};

const noop = (): void => {};

/**
 * The browser implementations, each guarded so this module can be imported in a
 * node test with none of them existing.
 *
 * `raf` returns 0 when there is no animation clock. A browser's
 * requestAnimationFrame is specified to return a non-zero handle, so 0 is an
 * unambiguous "nothing here can animate" and wake() treats it as such rather
 * than latching a handle it can never cancel.
 */
function defaultDeps(): HostDeps {
  return {
    now: () =>
      typeof performance !== "undefined" &&
      typeof performance.now === "function"
        ? performance.now()
        : Date.now(),
    raf: (cb) =>
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame(cb)
        : 0,
    caf: (handle) => {
      if (typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(handle);
      }
    },
    observe: (el, cb) => {
      if (typeof IntersectionObserver === "undefined") {
        // No observer: treat the pad as on screen, exactly as the vendored host
        // does, so a missing capability never silently freezes the page.
        cb(true);
        return noop;
      }
      const io = new IntersectionObserver(
        (records) => {
          for (const record of records) cb(record.isIntersecting);
        },
        // The margin is the point: without it a pad wakes exactly as it crosses
        // the viewport edge and shows a frozen frame for a beat (D-15).
        { threshold: 0, rootMargin: "200px" },
      );
      io.observe(el as Element);
      return () => io.disconnect();
    },
    reducedMotion: (cb) => {
      if (
        typeof window === "undefined" ||
        typeof window.matchMedia !== "function"
      ) {
        return { matches: false, stop: noop };
      }
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      const handler = (): void => cb(query.matches);
      // A subscription, never a one-shot read: an operating-system toggle
      // mid-session must take effect without a remount (IDENT-02).
      query.addEventListener("change", handler);
      return {
        matches: query.matches,
        stop: () => query.removeEventListener("change", handler),
      };
    },
    lowPower: isLowPower(
      typeof navigator === "undefined"
        ? undefined
        : navigator.hardwareConcurrency,
    ),
  };
}

export class SimHost {
  private readonly deps: HostDeps;
  private readonly entries = new Map<string, Entry>();
  private readonly sampler = new TouchSampler();
  private readonly media: { matches: boolean; stop: () => void };

  private heroId: string | undefined;
  private rafId: number | undefined;
  private lastNow: number | undefined;
  private pendingMs = 0;
  private reduced: boolean;
  private destroyed = false;

  constructor(deps?: Partial<HostDeps>) {
    this.deps = { ...defaultDeps(), ...deps };
    this.media = this.deps.reducedMotion((reduced) =>
      this.onReducedChange(reduced),
    );
    this.reduced = this.media.matches;
  }

  /**
   * Adopt a canvas and an engine under an id.
   *
   * The host sets the backing store to 9 by 9 itself, so a component cannot
   * forget it (04-UI-SPEC W-07): putImageData ignores the transform matrix, so
   * any other size paints a 9x9 patch in the corner of a larger canvas. The
   * first frame is painted immediately, before the loop has ever run, so a still
   * pad shows its picture at once.
   *
   * Registering an engine that was registered before does NOT reset it. That is
   * the whole point of one engine per entry for the session: a visitor stepping
   * away and back never sees a pad restart at tick 0.
   */
  register(id: string, canvas: HTMLCanvasElement, engine: HostEngine): void {
    if (this.destroyed) return;
    this.unregister(id);
    canvas.width = GRID_SIDE;
    canvas.height = GRID_SIDE;
    const ctx = canvas.getContext("2d") ?? undefined;
    const entry: Entry = {
      canvas,
      ctx,
      scratch: typeof ctx === "undefined" ? undefined : createScratch(ctx),
      engine,
      hero: id === this.heroId,
      // A pad with no stated slot opinion is in the window; the coverflow
      // narrows it. A component that forgets setInWindow animates rather than
      // silently freezing the whole row.
      inWindow: true,
      // Until the observer's first callback the pad is treated as hidden. The
      // immediate paint below means it still shows its picture, it just does not
      // tick yet.
      intersecting: false,
      wasRunning: false,
      lastPaint: this.deps.now(),
      unobserve: noop,
    };
    this.entries.set(id, entry);
    this.paint(entry, entry.lastPaint);
    entry.unobserve = this.deps.observe(canvas, (intersecting) => {
      entry.intersecting = intersecting;
      this.wake();
    });
    this.wake();
  }

  /** Drop one pad. The engine is untouched: it belongs to the session. */
  unregister(id: string): void {
    const entry = this.entries.get(id);
    if (typeof entry === "undefined") return;
    entry.unobserve();
    this.entries.delete(id);
  }

  /** The centred entry, or undefined. Only the hero receives pointer samples. */
  setHero(id: string | undefined): void {
    if (this.heroId === id) return;
    const old =
      typeof this.heroId === "undefined"
        ? undefined
        : this.entries.get(this.heroId);
    if (typeof old !== "undefined") old.hero = false;
    this.heroId = id;
    const next = typeof id === "undefined" ? undefined : this.entries.get(id);
    if (typeof next !== "undefined") next.hero = true;
    this.wake();
  }

  /** |slotOffset| <= radius. The half an IntersectionObserver cannot see. */
  setInWindow(id: string, inWindow: boolean): void {
    const entry = this.entries.get(id);
    if (typeof entry === "undefined" || entry.inWindow === inWindow) return;
    entry.inWindow = inWindow;
    if (inWindow) this.wake();
  }

  /**
   * The single teardown hook. The destroyed flag is set first, so a frame
   * callback already queued does nothing when it runs.
   */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (typeof this.rafId !== "undefined") {
      this.deps.caf(this.rafId);
      this.rafId = undefined;
    }
    for (const entry of this.entries.values()) entry.unobserve();
    this.entries.clear();
  }

  // ---------------------------------------------------------------------------
  // The loop.

  private wake(): void {
    if (this.destroyed || typeof this.rafId !== "undefined") return;
    const handle = this.deps.raf(this.onFrame);
    if (handle === 0) return;
    this.lastNow = undefined;
    this.rafId = handle;
  }

  private onFrame = (now: number): void => {
    this.rafId = undefined;
    if (this.destroyed) return;
    const dt = typeof this.lastNow === "undefined" ? 0 : now - this.lastNow;
    this.lastNow = now;
    const { ticks, carryMs } = ticksFor(this.pendingMs, dt);
    this.pendingMs = carryMs;

    let any = false;
    for (const entry of this.entries.values()) {
      const running =
        entry.inWindow && entry.intersecting && this.active(entry);
      if (running) {
        for (let i = 0; i < ticks; i++) {
          // Once per TICK, before the tick - never once per frame. Delivering
          // per frame silently restores the pointer-rate dependence the sampler
          // exists to remove (src/vendor/botor/pad-sim-host.ts:449-452).
          if (entry.hero) this.sampler.deliver(entry.engine);
          entry.engine.tick();
        }
        const still = this.active(entry);
        const due = shouldPaint(
          now,
          entry.lastPaint,
          intervalFor(entry.hero, this.deps.lowPower),
        );
        if (due || !still) this.paint(entry, now);
        entry.wasRunning = still;
        // Only a pad that is STILL running asks for another frame. The frame an
        // animation expires on has already painted its true final state, so
        // there is nothing a further frame could do, and every event that could
        // change that calls wake().
        if (still) any = true;
      } else if (entry.wasRunning) {
        this.paint(entry, now);
        entry.wasRunning = false;
      }
    }

    if (any) this.rafId = this.deps.raf(this.onFrame);
    else this.lastNow = undefined;
  };

  /**
   * Is there anything for this pad to do? Reduced motion animates a pad only
   * while a pointer is actually down on it, and only the hero has one.
   */
  private active(entry: Entry): boolean {
    const touchActive =
      entry.hero && (this.sampler.size > 0 || entry.engine.pendingTouches > 0);
    return touchActive || (!this.reduced && entry.engine.animating);
  }

  private paint(entry: Entry, now: number): void {
    entry.lastPaint = now;
    if (
      typeof entry.ctx === "undefined" ||
      typeof entry.scratch === "undefined"
    )
      return;
    paintPad(entry.ctx, entry.engine.frame, entry.scratch);
  }

  private onReducedChange(reduced: boolean): void {
    if (this.destroyed || reduced === this.reduced) return;
    this.reduced = reduced;
    this.wake();
  }
}
