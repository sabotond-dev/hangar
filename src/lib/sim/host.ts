// SimHost: one clock, one finger, one painter, for every pad on the page. The reference design is
// the vendored src/vendor/botor/pad-sim-host.ts, read and never imported; its rules are this file's
// contract: one requestAnimationFrame for the whole page; whole 10 ms ticks from an accumulator
// clamped by MAX_CATCHUP_MS (schedule.ts); paint on the per-slot render cadence (HERO_INTERVAL_MS,
// SIDE_INTERVAL_MS) and on the frame an animation expires; a pad runs only while inWindow AND
// intersecting ({ threshold: 0, rootMargin: "200px" }, so it wakes before the viewport edge); the
// self-cancelling loop (the last frame with nothing running asks for no other; every event that could
// wake an engine calls wake()); reduced motion holds one frame at REDUCED_MOTION_TICKS (64) and animates
// only under the visitor's own finger; one engine per entry for the session. A dead 2D context is
// noticed twice (the listener pair and the paint() guard; 11-08.1); nothing here goes into a Svelte rune.
// Decided at 04-04 (04-CONTEXT D-15) / 11-08.1; see .planning/phases/11-bench-corrections/11-08.1-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { type DemoPath, driveDemo } from "./demo";
import { createScratch, GRID_SIDE, paintPad } from "./paint";
import {
  intervalFor,
  isLowPower,
  REDUCED_MOTION_TICKS,
  shouldPaint,
  ticksFor,
} from "./schedule";
import { TouchSampler } from "./touch";

/** The engine shape the host accepts, structural rather than imported: PadSim and the Lua engine both satisfy it, and this file names nothing under src/vendor. */
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

/** Everything the host needs from a browser, injectable: there is no browser Vitest project, so this is how the loop is tested. */
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
  /** The demonstration gesture this pad replays, or undefined for a pad with a picture of its own (D-09, demo.ts). */
  demo: DemoPath | undefined;
  /**
   * One sampler per demo entry, never the host's: touch.ts caps a sampler at MAX_CONTACTS = 5 and keys
   * a contact by pointer id, so a shared one refused two of a visitor's five fingers, delivered the
   * rest to whichever engine ticked first and starved three of four demo cards (measured, 10-06).
   */
  demoSampler: TouchSampler | undefined;
  /** The demo's own tick counter. driveDemo takes the period's modulo. */
  demoTick: number;
  /** |slotOffset| <= radius. The half an IntersectionObserver cannot see. */
  inWindow: boolean;
  intersecting: boolean;
  wasRunning: boolean;
  /**
   * The engine's frame moved from OUTSIDE the tick loop and is not painted yet (change 20: the
   * mirror writes the module's reported lights into its frame as they arrive). invalidate() sets
   * it; paint() clears it.
   */
  dirty: boolean;
  lastPaint: number;
  unobserve: () => void;
  /** Removes BOTH context listeners; held on the entry because removeEventListener matches on function identity. */
  unlisten: () => void;
};

const noop = (): void => {};

/**
 * The browser implementations, each guarded so this module imports in node. `raf` returns 0 when there
 * is no animation clock (a browser handle is never 0), and wake() treats it as "nothing can animate".
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
   * Adopt a canvas and an engine under an id. The host sets the backing store to 9 by 9 itself
   * (putImageData ignores the transform matrix; 04-UI-SPEC W-07) and paints the first frame at once.
   * Registering an engine that was registered before does NOT reset it: one engine per entry for the
   * session. `options.demo` makes this pad a demo card, replaying an authored gesture through its own
   * TouchSampler at the same one-sample-per-contact-per-tick rate a finger gets (D-09); passed from CatalogCard.svelte only.
   */
  register(
    id: string,
    canvas: HTMLCanvasElement,
    engine: HostEngine,
    options?: { demo?: DemoPath },
  ): void {
    if (this.destroyed) return;
    this.unregister(id);
    canvas.width = GRID_SIDE;
    canvas.height = GRID_SIDE;
    const ctx = canvas.getContext("2d") ?? undefined;
    const demo = options?.demo;
    const entry: Entry = {
      canvas,
      ctx,
      scratch: typeof ctx === "undefined" ? undefined : createScratch(ctx),
      engine,
      hero: id === this.heroId,
      demo,
      demoSampler: typeof demo === "undefined" ? undefined : new TouchSampler(),
      demoTick: 0,
      // A pad with no stated slot opinion is in the window; a component that forgets setInWindow animates rather than freezing.
      inWindow: true,
      // Hidden until the observer's first callback; the immediate paint below still shows its picture.
      intersecting: false,
      wasRunning: false,
      dirty: false,
      lastPaint: this.deps.now(),
      unobserve: noop,
      unlisten: noop,
    };
    this.entries.set(id, entry);
    // BEFORE the first paint, so a loss during it is still heard.
    entry.unlisten = this.listen(entry);
    if (this.reduced) this.stillFrame(entry);
    this.paint(entry, entry.lastPaint);
    entry.unobserve = this.deps.observe(canvas, (intersecting) => {
      entry.intersecting = intersecting;
      this.wake();
    });
    this.wake();
  }

  /**
   * Swap the engine under an id, keeping the canvas, the observer and the slot state. NOT register():
   * that calls unregister() (canvas.width = 0) and re-enters with intersecting: false, so a knob turn
   * would blank the hero for a frame (05-RESEARCH Pitfall 3). The caller awaits the new engine first
   * and swaps second, so the old one paints for the whole await (D-06). Unknown ids are a no-op.
   */
  replaceEngine(id: string, engine: HostEngine): void {
    if (this.destroyed) return;
    const entry = this.entries.get(id);
    if (typeof entry === "undefined") return;
    entry.engine = engine;
    // stillFrame BEFORE paint, or a reduced-motion visitor is shown an
    // unticked engine's blank frame instead of its representative one.
    if (this.reduced) this.stillFrame(entry);
    this.paint(entry, this.deps.now());
    // Restarts a loop that had gone quiet because the previous engine settled.
    this.wake();
  }

  /**
   * Repaint every registered pad from its engine's current frame, touching nothing else. One caller:
   * the browse grid after a sort or filter has moved cards in the DOM (a still pad does not tick, and
   * whether a bitmap survives a re-parenting move is not a question to depend on). Does NOT wake().
   */
  repaintAll(): void {
    if (this.destroyed) return;
    const now = this.deps.now();
    for (const entry of this.entries.values()) this.paint(entry, now);
  }

  /**
   * An engine's frame changed from outside the tick loop (change 20, docs/MIRROR.md section 6: the
   * mirror engine is written as the ZONA reports its lights). Marks the pad dirty and wakes the loop;
   * the loop paints it ONCE, no sooner than its paint interval after the last paint, however many
   * reports arrived in between - never one paint per report. It paints under reduced motion too: a
   * mirror is the module's own state, not motion the site adds. A pad off screen stays dirty until
   * it is back. Unknown ids and a destroyed host are ignored.
   */
  invalidate(id: string): void {
    if (this.destroyed) return;
    const entry = this.entries.get(id);
    if (typeof entry === "undefined") return;
    entry.dirty = true;
    this.wake();
  }

  /** Drop one pad, releasing its backing store. The engine belongs to the session, not to one mount. */
  unregister(id: string): void {
    const entry = this.entries.get(id);
    if (typeof entry === "undefined") return;
    entry.unobserve();
    // Both context listeners come off with the observer: a survivor would hold the entry and its engine alive.
    entry.unlisten();
    entry.canvas.width = 0;
    this.entries.delete(id);
  }

  /** The centred entry, or undefined. Only the hero receives pointer samples. */
  setHero(id: string | undefined): void {
    if (this.heroId === id) return;
    // Contacts never leak onto a pad the visitor has stepped away from.
    this.sampler.clear();
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
   * Start a contact in LED coordinates (the component maps client coordinates with mapAxis from
   * ./touch, so no DOM geometry crosses in). False when the pointer is already tracked or all five
   * slots are taken, so the component knows not to capture the pointer.
   */
  touchDown(pointerId: number, x: number, y: number): boolean {
    if (this.destroyed) return false;
    const taken = this.sampler.down(pointerId, x, y);
    if (taken) this.wake();
    return taken;
  }

  touchMove(pointerId: number, x: number, y: number): void {
    if (this.destroyed) return;
    this.sampler.move(pointerId, x, y);
    this.wake();
  }

  touchEnd(pointerId: number): void {
    if (this.destroyed) return;
    this.sampler.end(pointerId);
    this.wake();
  }

  /** The single teardown hook; the destroyed flag is set first, so a queued frame callback does nothing. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (typeof this.rafId !== "undefined") {
      this.deps.caf(this.rafId);
      this.rafId = undefined;
    }
    for (const entry of this.entries.values()) {
      entry.unobserve();
      entry.unlisten();
      // width = 0 is what releases a backing store's compositor memory (.planning/research/PITFALLS.md C14).
      entry.canvas.width = 0;
    }
    this.entries.clear();
    this.sampler.clear();
    this.media.stop();
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
          // Once per TICK, before the tick, never per frame (pad-sim-host.ts:449-452). The hero wins over
          // a demo: the visitor's finger is on it, and the demo pauses until the pad stops being the hero.
          if (entry.hero) this.sampler.deliver(entry.engine);
          else this.driveDemoTick(entry);
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
        // Only a pad still running asks for another frame; the frame an animation expires on has already painted its true final state.
        if (still) any = true;
      } else if (entry.wasRunning) {
        this.paint(entry, now);
        entry.wasRunning = false;
      }
      // An outside frame (invalidate): painted once it is due, the loop kept alive until then.
      if (entry.dirty && entry.inWindow && entry.intersecting) {
        const due = shouldPaint(
          now,
          entry.lastPaint,
          intervalFor(entry.hero, this.deps.lowPower),
        );
        if (due) this.paint(entry, now);
        else any = true;
      }
    }

    if (any) this.rafId = this.deps.raf(this.onFrame);
    else this.lastNow = undefined;
  };

  /**
   * Queue and deliver one tick of a demo entry's gesture from ITS OWN sampler: driveDemo queues, the
   * sampler delivers, nothing calls the engine's touch methods - the same rate, coalescing and slot
   * allocation as a visitor's finger. A non-demo entry is a no-op.
   */
  private driveDemoTick(entry: Entry): void {
    if (
      typeof entry.demo === "undefined" ||
      typeof entry.demoSampler === "undefined"
    ) {
      return;
    }
    driveDemo(
      entry.demo,
      entry.demoTick,
      entry.demoSampler,
      entry.engine.coordMax,
    );
    entry.demoSampler.deliver(entry.engine);
    entry.demoTick++;
  }

  /**
   * Is there anything for this pad to do? Three terms: the hero's finger; a demo card with a gesture
   * in flight (kept under reduced motion so a contact already down is released); and a demo card at
   * all while motion is allowed - the gesture LOOPS, and between two gestures its sampler is empty and
   * its engine may have settled (MORPH, ETCH), so term 2 alone would stop a loop nothing could restart.
   */
  private active(entry: Entry): boolean {
    const heroTouch =
      entry.hero && (this.sampler.size > 0 || entry.engine.pendingTouches > 0);
    const demoTouch =
      typeof entry.demoSampler !== "undefined" &&
      (entry.demoSampler.size > 0 || entry.engine.pendingTouches > 0);
    const demoLooping = typeof entry.demo !== "undefined" && !this.reduced;
    return (
      heroTouch ||
      demoTouch ||
      demoLooping ||
      (!this.reduced && entry.engine.animating)
    );
  }

  // ---------------------------------------------------------------------------
  // Noticing a dead 2D context, twice (11-08.1): the listener pair catches a STILL card, which never
  // paints again; the guard in paint() catches an ANIMATING card whose engine dropped the backing store
  // without emitting the events. Neither is redundant.

  /**
   * Attach the contextlost / contextrestored pair to one canvas; returns the remover for both. NO
   * preventDefault(): for canvas 2D, canceling contextlost tells the user agent NOT to restore (HTML
   * 4.12.5.1.10; the opposite of WebGL's idiom). The typeof guard is real: node tests pass no EventTarget.
   */
  private listen(entry: Entry): () => void {
    const target = entry.canvas;
    if (
      typeof target.addEventListener !== "function" ||
      typeof target.removeEventListener !== "function"
    ) {
      return noop;
    }
    const onLost = (): void => {
      // Drop the cached context AND the scratch. Nothing repaints here: the
      // backing store is gone, so a paint would be into nothing.
      entry.ctx = undefined;
      entry.scratch = undefined;
    };
    const onRestored = (): void => {
      // The half a paint guard can never reach: a still pad's picture only comes back because this listener puts it back.
      this.reacquire(entry);
      this.paint(entry, this.deps.now());
    };
    target.addEventListener("contextlost", onLost);
    target.addEventListener("contextrestored", onRestored);
    return () => {
      target.removeEventListener("contextlost", onLost);
      target.removeEventListener("contextrestored", onRestored);
    };
  }

  /**
   * Take the 2D context again and rebuild the scratch from the new one. The scratch rebuild is
   * DEFENSIVE, not load-bearing (11-08.1 measured: an ImageData carried across a loss still paints).
   * Returns whether there is a context to paint through.
   */
  private reacquire(entry: Entry): boolean {
    const ctx = entry.canvas.getContext("2d") ?? undefined;
    entry.ctx = ctx;
    entry.scratch = typeof ctx === "undefined" ? undefined : createScratch(ctx);
    return typeof ctx !== "undefined";
  }

  /**
   * Is this entry's cached context unusable? One feature-detected call on the hot path, never a
   * getContext per paint: isContextLost ships in Chrome 130+ / Firefox 151+, not the Chrome 89 baseline.
   */
  private lost(entry: Entry): boolean {
    const ctx = entry.ctx;
    if (typeof ctx === "undefined" || typeof entry.scratch === "undefined") {
      return true;
    }
    return typeof ctx.isContextLost === "function" && ctx.isContextLost();
  }

  private paint(entry: Entry, now: number): void {
    entry.lastPaint = now;
    entry.dirty = false;
    // The other half: an ANIMATING card comes back on its next paint with no event at all.
    if (this.lost(entry) && !this.reacquire(entry)) return;
    if (
      typeof entry.ctx === "undefined" ||
      typeof entry.scratch === "undefined"
    )
      return;
    paintPad(entry.ctx, entry.engine.frame, entry.scratch);
  }

  /**
   * The representative frame. A normal entry restarts and runs to tick 64 (deterministic; a sine look
   * near its peak). A demo entry resets and replays its path to the end ONCE and freezes (10-UI-SPEC 14):
   * uninvited motion gets the picture and no loop. Both branches are idempotent, so it is safe on all three call sites.
   */
  private stillFrame(entry: Entry): void {
    entry.engine.reset();
    if (
      typeof entry.demo === "undefined" ||
      typeof entry.demoSampler === "undefined"
    ) {
      entry.engine.run(REDUCED_MOTION_TICKS);
    } else {
      entry.demoSampler.clear();
      entry.demoTick = 0;
      for (let i = 0; i < entry.demo.periodTicks; i++) {
        this.driveDemoTick(entry);
        entry.engine.tick();
      }
      // Back to the top, so leaving reduced motion restarts the gesture rather
      // than resuming it one period in.
      entry.demoTick = 0;
    }
    entry.wasRunning = false;
  }

  private onReducedChange(reduced: boolean): void {
    if (this.destroyed || reduced === this.reduced) return;
    this.reduced = reduced;
    if (reduced) {
      // Nothing re-registers and nothing remounts: an operating-system toggle
      // takes effect on the engines that are already here (IDENT-02).
      for (const entry of this.entries.values()) {
        this.stillFrame(entry);
        this.paint(entry, this.deps.now());
      }
    }
    // Waking on the way back out is the other half of the same rule.
    this.wake();
  }
}
