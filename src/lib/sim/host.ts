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
  /**
   * The demonstration gesture this pad replays, or undefined for every pad that
   * has a picture of its own (D-09, src/lib/sim/demo.ts).
   */
  demo: DemoPath | undefined;
  /**
   * ONE SAMPLER PER DEMO ENTRY, and this is the reason it is here rather than
   * on the host. touch.ts caps a sampler at MAX_CONTACTS = 5, which is what the
   * hardware tracks, and it keys a contact by POINTER ID - so a shared sampler
   * is not merely crowded, it is wrong in three ways at once.
   *
   * MEASURED, by handing every demo entry `this.sampler` and putting four demo
   * cards and five fingers on one page:
   *
   *   - the visitor's five fingers came back true, true, true, FALSE, FALSE -
   *     three of five, the other two refused outright;
   *   - of the three that were accepted, the hero's engine received ZERO. Every
   *     one of them was delivered to the first demo card's engine, because
   *     deliver() empties the queue into whichever engine ticks first;
   *   - and three of the four demo cards received nothing at all, because their
   *     paths use the same pointer ids and down() refuses a pointer already
   *     tracked.
   *
   * The interactive preview's guarantee is then not the one Phase 4 signed off,
   * and it fails SILENTLY - the pointer is simply never captured. The hero
   * keeps the host's own sampler, untouched.
   */
  demoSampler: TouchSampler | undefined;
  /** The demo's own tick counter. driveDemo takes the period's modulo. */
  demoTick: number;
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
   *
   * THE FOURTH ARGUMENT IS OPTIONAL AND EVERY EXISTING CALLER IS UNCHANGED.
   * `options.demo` makes this pad a demo card: it replays an authored gesture
   * through its own TouchSampler, at the same one-sample-per-contact-per-tick
   * rate a real finger gets (D-09). It is passed from CatalogCard.svelte, which
   * is the only surface that mounts a dark entry - 10-VALIDATION V-04, because
   * PadFrame.svelte holds no engine and a `demo` prop on it would be an unused
   * prop and a lint failure.
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
    if (this.reduced) this.stillFrame(entry);
    this.paint(entry, entry.lastPaint);
    entry.unobserve = this.deps.observe(canvas, (intersecting) => {
      entry.intersecting = intersecting;
      this.wake();
    });
    this.wake();
  }

  /**
   * Swap the engine under an id, keeping the canvas, the observer and the slot
   * state.
   *
   * NOT register(). register() calls unregister(), which sets canvas.width = 0,
   * and re-enters with intersecting: false - so a knob turn would blank the hero
   * for a frame and then stall it until the IntersectionObserver fires again
   * (05-RESEARCH, Pitfall 3). This is the mechanism behind D-06's "the previous
   * engine keeps painting until the new one has run Setup": the caller awaits the
   * new engine first and swaps second, so the old one paints for the whole await.
   *
   * Unknown ids are a no-op rather than a throw: a knob turn racing an unmount is
   * a real sequence, not a programming error.
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
   * Repaint every registered pad from its engine's current frame, without
   * touching the engines, the observers or the backing stores.
   *
   * NOT register(). register() calls unregister(), which sets canvas.width = 0
   * and re-enters with intersecting: false - the exact bug replaceEngine was
   * added to avoid in Phase 5. This exists for one caller: the browse grid, after
   * a sort or a filter has moved cards in the DOM. A still pad does not tick, so
   * nothing else would repaint it, and whether a canvas bitmap survives a
   * re-parenting move is not a question this repository wants to depend on.
   *
   * It does NOT call wake(). Repainting is not a reason to start the loop, and a
   * wall of settled still pads must stay at zero CPU.
   */
  repaintAll(): void {
    if (this.destroyed) return;
    const now = this.deps.now();
    for (const entry of this.entries.values()) this.paint(entry, now);
  }

  /**
   * Drop one pad, releasing its backing store. The engine is untouched: it
   * belongs to the session, not to one mount.
   */
  unregister(id: string): void {
    const entry = this.entries.get(id);
    if (typeof entry === "undefined") return;
    entry.unobserve();
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
   * Start a contact. The coordinates are LED coordinates, never client ones:
   * the component owns the canvas rect and maps them with mapAxis from ./touch.
   * The host is testable in node precisely because no DOM geometry crosses into
   * it.
   *
   * Returns false when the pointer is already tracked or all five slots are
   * taken, so the component knows not to capture the pointer.
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
    for (const entry of this.entries.values()) {
      entry.unobserve();
      // Nine mounted pads at a large backing store are megabytes of compositor
      // memory; width = 0 is what releases them
      // (.planning/research/PITFALLS.md C14).
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
          // Once per TICK, before the tick - never once per frame. Delivering
          // per frame silently restores the pointer-rate dependence the sampler
          // exists to remove (src/vendor/botor/pad-sim-host.ts:449-452).
          //
          // THE HERO WINS. A pad that is both the hero and a demo card belongs
          // to the visitor: their finger is on it, and two fingers - one of
          // them ours - would fight over the same pad. The demo simply pauses
          // and picks its loop back up when the pad stops being the hero. On
          // the browse grid, where every demo card lives, nothing is ever hero.
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
   * Queue and deliver one tick of a demo entry's gesture, from ITS OWN sampler.
   *
   * driveDemo queues; the sampler delivers. Nothing here calls the engine's
   * touch methods, which is the line that keeps a demo card firmware-faithful:
   * it is subject to the same one-sample-per-contact-per-tick rate, the same
   * MOVE coalescing and the same slot allocation as a visitor's finger. A
   * non-demo entry is a no-op.
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
   * Is there anything for this pad to do? Reduced motion animates a pad only
   * while a pointer is actually down on it, and only the hero has one.
   *
   * Three terms, each with its own job:
   *
   *   1. the hero's finger, unchanged from Phase 4;
   *   2. a demo card with a gesture in flight - this is the term that stops a
   *      demo being judged frozen and having its rAF cancelled mid-stroke, on
   *      exactly the same size / pendingTouches test the hero gets. It survives
   *      under reduced motion on purpose: a contact that is already down has to
   *      be released, and a preference change is not a reason to leave a finger
   *      stuck on a pad;
   *   3. a demo card at all, while motion is allowed. The gesture LOOPS, and
   *      between two gestures its sampler is momentarily empty and its engine
   *      may have settled - MORPH and ETCH both report animating: false with
   *      their picture still on the pad. Term 2 alone would stop the loop
   *      there, and nothing could ever restart it: the only thing that queues a
   *      demo sample is a tick, so a demo that stops between gestures is a demo
   *      that never resumes. Under reduced motion this term is false and the
   *      card holds stillFrame()'s single replay instead.
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

  private paint(entry: Entry, now: number): void {
    entry.lastPaint = now;
    if (
      typeof entry.ctx === "undefined" ||
      typeof entry.scratch === "undefined"
    )
      return;
    paintPad(entry.ctx, entry.engine.frame, entry.scratch);
  }

  /**
   * The representative frame, in two branches.
   *
   * A NORMAL ENTRY runs to tick 64. Restarting from tick 0 makes it
   * deterministic instead of whatever tick the loop happened to reach, and the
   * tick count is chosen so a sine look sits near its peak - the still frame
   * shows colour and pattern rather than a black square.
   *
   * A DEMO ENTRY resets and replays its path to the end, ONCE, and freezes
   * (10-UI-SPEC 14). Running it to tick 64 instead would show a pad two thirds
   * of the way through its first stroke, or - for a path whose first contact
   * lands later - a black square, which is the one thing D-09 forbids. And it
   * replays only once because the demo is UNINVITED motion: a visitor who asked
   * for less of it gets the picture the gesture produced and no loop.
   *
   * Both branches are idempotent: reset() puts the engine back to the state
   * right after Setup, the demo's sampler is emptied with it, and the replay is
   * a pure function of the path. Calling this twice paints the same frame,
   * which is what makes it safe on every one of the three call sites.
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
