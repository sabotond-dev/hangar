// The whole loop, driven by a fake clock in node: there is no browser Vitest project, so every
// dependency the host needs from a browser - rAF, cancel, performance.now, an IntersectionObserver
// and a prefers-reduced-motion subscription - is injected, and frames advance only when a test says
// so, at a timestamp it chose. The recording context is paint.spec.ts's shape, copied rather than
// exported from a spec; each fake canvas records the timestamp of every paint it received.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { cellToCoord, type DemoPath } from "./demo";
import { SimHost, type HostDeps } from "./host";
import { GRID_SIDE } from "./paint";
import {
  HERO_INTERVAL_MS,
  MAX_CATCHUP_MS,
  REDUCED_MOTION_TICKS,
  SIDE_INTERVAL_MS,
  TICK_MS,
} from "./schedule";
import { MAX_CONTACTS } from "./touch";

type FrameCb = (now: number) => void;

/**
 * A clock whose frames only run when a test steps it, at a timestamp the test
 * chose. Nothing here touches a real timer.
 */
function fakeClock() {
  let now = 0;
  let nextHandle = 1;
  let rafCalls = 0;
  const queued = new Map<number, FrameCb>();
  const cancelled: number[] = [];
  return {
    deps: {
      now: () => now,
      raf: (cb: FrameCb) => {
        rafCalls++;
        const handle = nextHandle++;
        queued.set(handle, cb);
        return handle;
      },
      caf: (handle: number) => {
        cancelled.push(handle);
        queued.delete(handle);
      },
    },
    get now(): number {
      return now;
    },
    /** How many frames the host has asked for, ever. */
    get rafCalls(): number {
      return rafCalls;
    },
    /** How many frames are outstanding. The loop is idle at 0. */
    get pending(): number {
      return queued.size;
    },
    get cancelled(): number[] {
      return cancelled.slice();
    },
    /** The outstanding frame handle, or undefined. */
    get handle(): number | undefined {
      return Array.from(queued.keys())[0];
    },
    /** The queued callback, left in place. */
    peek(): FrameCb | undefined {
      return Array.from(queued.values())[0];
    },
    /** Run every queued callback at an explicit timestamp. */
    step(to: number): void {
      now = to;
      const cbs = Array.from(queued.values());
      queued.clear();
      for (const cb of cbs) cb(to);
    },
  };
}

type Recording = HTMLCanvasElement & {
  paints: number[];
  /**
   * Every value ever written to `width`, in order.
   *
   * `width` is a recorded accessor rather than a plain field because per the
   * HTML specification a write to it - of ANY value, including the same one -
   * resets the bitmap, and `unregister()` writes 0. A test that only read the
   * final value would miss a tear-down that was immediately undone, which is
   * exactly what a repaint implemented as `register()` does (05-SUMMARY records
   * the same 0-then-9 pair being measured in Chromium).
   */
  widths: number[];
  /**
   * The contexts this canvas has handed out, oldest first, each with its own
   * paint log. A recovery is only observable if the host can be shown painting
   * through a DIFFERENT object from the one it cached, so `contexts` is what
   * turns "it re-acquired" from an inference into an assertion.
   */
  contexts: FakeCtx[];
  /** Live listeners by type. A teardown is asserted as a count off this. */
  listeners: Map<string, Set<() => void>>;
  /** Drop the backing store the way an engine does, and tell the page. */
  loseContext(): void;
  /** Hand out a NEW context and fire contextrestored. */
  restoreContext(): void;
  /** Fire one event type at whatever is listening. */
  fire(type: string): void;
};

type FakeCtx = {
  paints: number[];
  lost: boolean;
  createImageData: (w: number, h: number) => ImageData;
  putImageData: () => void;
  isContextLost: () => boolean;
};

/**
 * A canvas whose context draws nothing and records when it was painted.
 *
 * IT HANDS OUT A NEW CONTEXT OBJECT AFTER A LOSS, which is the whole point of
 * the three tests plan 11-08.1 added: the vendored reference host
 * (src/vendor/botor/pad-sim-host.ts) calls getContext inside blit() on every
 * paint and so never holds a reference across a loss, while HANGAR caches the
 * context AND a persistent ImageData because putImageData into a 9x9 store is
 * the whole point of the faster painter (04-CONTEXT D-15). The performance win
 * traded away an accidental resilience, and nobody noticed the trade. A fake
 * that reused one ctx object could not have caught it.
 */
function fakeCanvas(now: () => number): Recording {
  const widths: number[] = [];
  const contexts: FakeCtx[] = [];
  const listeners = new Map<string, Set<() => void>>();
  let width = 0;

  const mintContext = (): FakeCtx => {
    const ctx: FakeCtx = {
      paints: [],
      lost: false,
      createImageData: (w: number, h: number) =>
        ({
          width: w,
          height: h,
          data: new Uint8ClampedArray(w * h * 4),
        }) as unknown as ImageData,
      putImageData: () => {
        // A real dead context throws here. This one records, so a test can
        // assert that the host never even reached it.
        ctx.paints.push(now());
      },
      isContextLost: () => ctx.lost,
    };
    contexts.push(ctx);
    return ctx;
  };
  let current = mintContext();

  const fire = (type: string): void => {
    for (const fn of Array.from(listeners.get(type) ?? [])) fn();
  };

  return {
    get width(): number {
      return width;
    },
    set width(value: number) {
      width = value;
      widths.push(value);
    },
    height: 0,
    /** Every paint this canvas ever received, across every context. */
    get paints(): number[] {
      return contexts.flatMap((c) => c.paints).sort((a, b) => a - b);
    },
    widths,
    contexts,
    listeners,
    // A LOST CONTEXT IS NEVER HANDED OUT AGAIN. On a real canvas getContext
    // returns the same object and isContextLost() flips back; minting a new one
    // is the same fact made OBSERVABLE, which is what lets a test assert
    // "it re-acquired" instead of inferring it. It is also the shape the
    // vendored reference host gets for free, because blit() calls getContext on
    // every paint (src/vendor/botor/pad-sim-host.ts) and so never holds a
    // reference across a loss at all.
    getContext: () => {
      if (current.lost) current = mintContext();
      return current;
    },
    addEventListener: (type: string, fn: () => void) => {
      const set = listeners.get(type) ?? new Set<() => void>();
      set.add(fn);
      listeners.set(type, set);
    },
    removeEventListener: (type: string, fn: () => void) => {
      listeners.get(type)?.delete(fn);
    },
    loseContext: (): void => {
      current.lost = true;
      fire("contextlost");
    },
    restoreContext: (): void => {
      fire("contextrestored");
    },
    fire,
  } as unknown as Recording;
}

/** Every live listener on a canvas, of any type. A teardown is this at zero. */
function listenerCount(canvas: Recording): number {
  let total = 0;
  for (const set of canvas.listeners.values()) total += set.size;
  return total;
}

type TouchCall = [string, number, number, number];

/**
 * An engine with PadSim's shape that counts what the host asked of it. It holds
 * contacts the way PadSim does, so pendingTouches falls back to zero only once
 * the UP has actually been delivered.
 */
function fakeEngine(stopAfterTicks = Number.POSITIVE_INFINITY) {
  const held = new Set<number>();
  const calls = {
    tick: 0,
    reset: 0,
    run: [] as number[],
    touch: [] as TouchCall[],
  };
  let ticks = 0;
  return {
    calls,
    tick(): void {
      calls.tick++;
      ticks++;
    },
    run(n: number): void {
      calls.run.push(n);
      ticks += n;
    },
    reset(): void {
      calls.reset++;
      ticks = 0;
    },
    frame: new Uint8Array(GRID_SIDE * GRID_SIDE * 3),
    get animating(): boolean {
      return ticks < stopAfterTicks;
    },
    coordMax: 127 as const,
    get pendingTouches(): number {
      return held.size;
    },
    touchDown(id: number, x: number, y: number): void {
      held.add(id);
      calls.touch.push(["down", id, x, y]);
    },
    touchMove(id: number, x: number, y: number): void {
      calls.touch.push(["move", id, x, y]);
    },
    touchUp(id: number, x: number, y: number): void {
      held.delete(id);
      calls.touch.push(["up", id, x, y]);
    },
  };
}

/**
 * A visibility source. A real IntersectionObserver reports asynchronously;
 * reporting true on observe is the shortest way to say "this pad is on screen",
 * and report() moves it afterwards.
 */
function fakeObserver() {
  const watched = new Map<unknown, (intersecting: boolean) => void>();
  const handles: (() => void)[] = [];
  let unobserved = 0;
  return {
    observe: (el: unknown, cb: (intersecting: boolean) => void) => {
      watched.set(el, cb);
      cb(true);
      const off = (): void => {
        unobserved++;
        watched.delete(el);
      };
      handles.push(off);
      return off;
    },
    report(el: unknown, intersecting: boolean): void {
      watched.get(el)?.(intersecting);
    },
    get unobserved(): number {
      return unobserved;
    },
    get watching(): number {
      return watched.size;
    },
    /**
     * Every unobserve function ever handed out, in creation order. A second
     * observe() for the same pad appends a NEW closure, so comparing this list
     * by reference is how a test proves an observer was not re-created.
     */
    get handles(): readonly (() => void)[] {
      return handles.slice();
    },
  };
}

/** A live prefers-reduced-motion source a test can toggle mid-session. */
function fakeMedia(initial: boolean) {
  let listener: ((reduced: boolean) => void) | undefined;
  let stops = 0;
  return {
    subscribe: (cb: (reduced: boolean) => void) => {
      listener = cb;
      return {
        matches: initial,
        stop: () => {
          stops++;
          listener = undefined;
        },
      };
    },
    /** The operating system toggle. */
    set(reduced: boolean): void {
      listener?.(reduced);
    },
    get stops(): number {
      return stops;
    },
    get subscribed(): boolean {
      return typeof listener !== "undefined";
    },
  };
}

function harness(opts: { reduced?: boolean; lowPower?: boolean } = {}) {
  const clock = fakeClock();
  const io = fakeObserver();
  const media = fakeMedia(opts.reduced ?? false);
  const deps: Partial<HostDeps> = {
    ...clock.deps,
    observe: io.observe,
    reducedMotion: media.subscribe,
    lowPower: opts.lowPower ?? false,
  };
  return {
    clock,
    io,
    media,
    host: new SimHost(deps),
    canvas: () => fakeCanvas(() => clock.now),
  };
}

/**
 * A one-contact demonstration gesture, authored here rather than imported from
 * src/lib/sim/demo.ts.
 *
 * The shipped paths are four hundred ticks long and are asserted for shape in
 * demo.spec.ts; what this file is about is the host's plumbing, and a path short
 * enough to replay inside one frame's catch-up clamp is what makes the tick
 * arithmetic below exact rather than approximate. Both are DemoPath, so the
 * type still has to agree with what ships.
 */
const STROKE: DemoPath = {
  id: "stroke",
  gesture: "one contact down, one move, one lift",
  periodTicks: 40,
  samples: [
    { tick: 2, pointer: 1, event: "down", x: 2, y: 3 },
    { tick: 4, pointer: 1, event: "move", x: 4, y: 5 },
    { tick: 6, pointer: 1, event: "up", x: 4, y: 5 },
  ],
};

/**
 * A two-contact gesture that stays down. Trackpad's own path would have opened
 * two, which is why four demo cards on one shared five-slot sampler was never
 * survivable - and why the contention test needs a path that holds its
 * contacts rather than releasing them a few ticks in.
 */
const TWO_FINGERS: DemoPath = {
  id: "two-fingers",
  gesture: "two contacts down, held, then lifted",
  periodTicks: 100,
  samples: [
    { tick: 1, pointer: 1, event: "down", x: 3, y: 2 },
    { tick: 2, pointer: 2, event: "down", x: 5, y: 2 },
    { tick: 80, pointer: 1, event: "up", x: 3, y: 6 },
    { tick: 81, pointer: 2, event: "up", x: 5, y: 6 },
  ],
};

/** Gaps between successive paints, including the one register paints. */
function gaps(paints: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < paints.length; i++) out.push(paints[i] - paints[i - 1]);
  return out;
}

describe("the simulator host (src/lib/sim/host.ts)", () => {
  it("drives every registered pad from one animation frame, and owns the 9 by 9 backing store", () => {
    const h = harness();
    const pads = ["a", "b", "c"].map((id) => {
      const canvas = h.canvas();
      const engine = fakeEngine();
      h.host.register(id, canvas, engine);
      return { id, canvas, engine };
    });

    for (const pad of pads) {
      expect(pad.canvas.width, `${pad.id} backing store width`).toBe(GRID_SIDE);
      expect(pad.canvas.height, `${pad.id} backing store height`).toBe(
        GRID_SIDE,
      );
      expect(
        pad.canvas.paints.length,
        `${pad.id} shows a picture at once`,
      ).toBe(1);
    }

    expect(h.clock.rafCalls, "three pads, one frame request").toBe(1);
    h.clock.step(0);
    expect(h.clock.rafCalls, "one frame request per frame, not three").toBe(2);
    expect(h.clock.pending, "exactly one outstanding frame").toBe(1);
    h.clock.step(16);
    expect(h.clock.rafCalls, "still one frame request per frame").toBe(3);
    for (const pad of pads) {
      expect(pad.engine.calls.tick, `${pad.id} stepped with the others`).toBe(
        1,
      );
    }

    h.host.destroy();
  });

  it("ticks a 25 ms gap twice and carries the remainder into the next", () => {
    const h = harness();
    const canvas = h.canvas();
    const engine = fakeEngine();
    h.host.register("a", canvas, engine);

    h.clock.step(0);
    expect(engine.calls.tick, "the first frame after a wake has no gap").toBe(
      0,
    );
    h.clock.step(25);
    expect(engine.calls.tick, "25 ms is two whole ticks and 5 ms carried").toBe(
      2,
    );
    h.clock.step(50);
    expect(engine.calls.tick, "5 carried plus 25 is three more ticks").toBe(5);
    expect(
      engine.calls.tick * TICK_MS,
      "the simulation consumed the wall clock exactly",
    ).toBe(50);

    h.host.destroy();
  });

  it("clamps a five second gap: the clamp decides how far it catches up, not the gap", () => {
    const h = harness();
    const canvas = h.canvas();
    const engine = fakeEngine();
    h.host.register("a", canvas, engine);

    h.clock.step(0);
    h.clock.step(5000);
    expect(
      engine.calls.tick,
      "a restored tab must not replay minutes of ticks",
    ).toBe(MAX_CATCHUP_MS / TICK_MS);

    h.host.destroy();
  });

  it("repaints the hero no faster than 33 ms and a side pad no faster than 50 ms", () => {
    const h = harness();
    const heroCanvas = h.canvas();
    const heroEngine = fakeEngine();
    const sideCanvas = h.canvas();
    const sideEngine = fakeEngine();
    h.host.setHero("hero");
    h.host.register("hero", heroCanvas, heroEngine);
    h.host.register("side", sideCanvas, sideEngine);

    for (let t = 16; t <= 320; t += 16) h.clock.step(t);

    expect(heroCanvas.paints.length, "the hero repainted").toBeGreaterThan(2);
    expect(sideCanvas.paints.length, "the side pad repainted").toBeGreaterThan(
      1,
    );
    for (const gap of gaps(heroCanvas.paints)) {
      expect(gap, "hero paint gap").toBeGreaterThanOrEqual(HERO_INTERVAL_MS);
    }
    for (const gap of gaps(sideCanvas.paints)) {
      expect(gap, "side paint gap").toBeGreaterThanOrEqual(SIDE_INTERVAL_MS);
    }
    expect(
      heroCanvas.paints.length,
      "the hero repaints more often than the sides",
    ).toBeGreaterThan(sideCanvas.paints.length);

    h.host.destroy();
  });

  it("paints the frame an animation expires on, then stops asking for frames", () => {
    const h = harness();
    const canvas = h.canvas();
    const engine = fakeEngine(3);
    h.host.register("a", canvas, engine);

    h.clock.step(0);
    const before = canvas.paints.length;
    h.clock.step(30);

    expect(engine.calls.tick, "three ticks ran the animation out").toBe(3);
    expect(
      canvas.paints.length - before,
      "one final paint, so the freeze frame is the true final state",
    ).toBe(1);
    expect(h.clock.pending, "a settled row costs no CPU at all").toBe(0);

    h.host.destroy();
  });

  it("ticks a pad only when it is inside the coverflow window AND inside the viewport", () => {
    const h = harness();
    const behind = { canvas: h.canvas(), engine: fakeEngine() };
    const scrolledAway = { canvas: h.canvas(), engine: fakeEngine() };
    const visible = { canvas: h.canvas(), engine: fakeEngine() };

    // On screen by geometry, but three layers deep in the coverflow.
    h.host.register("hidden-behind", behind.canvas, behind.engine);
    h.host.setInWindow("hidden-behind", false);
    // Inside the window, but the row is scrolled out of view.
    h.host.register("scrolled-away", scrolledAway.canvas, scrolledAway.engine);
    h.io.report(scrolledAway.canvas, false);
    h.host.register("visible", visible.canvas, visible.engine);

    h.clock.step(0);
    h.clock.step(20);

    expect(
      behind.engine.calls.tick,
      "hidden-behind kept ticking: the observer alone cannot pause a coverflow",
    ).toBe(0);
    expect(
      scrolledAway.engine.calls.tick,
      "scrolled-away kept ticking: the window alone cannot pause a scroll",
    ).toBe(0);
    expect(visible.engine.calls.tick, "the visible pad ticked").toBe(2);

    h.host.destroy();
  });

  it("does not restart an engine that is registered again after a step", () => {
    const h = harness();
    const canvas = h.canvas();
    const engine = fakeEngine();
    h.host.register("a", canvas, engine);
    h.clock.step(0);
    h.clock.step(50);
    const ticked = engine.calls.tick;
    expect(ticked, "the pad had run before the step").toBe(5);

    h.host.unregister("a");
    h.host.register("a", canvas, engine);
    h.clock.step(60);
    h.clock.step(80);

    expect(
      engine.calls.reset,
      "stepping away and back restarted the pad at tick 0",
    ).toBe(0);
    expect(
      engine.calls.tick,
      "the engine kept its simulation across the step",
    ).toBeGreaterThan(ticked);

    h.host.destroy();
  });
  it("stills the row to the representative frame, and a live toggle takes effect without a remount", () => {
    const h = harness({ reduced: true });
    const pads = ["a", "b", "c"].map((id) => {
      const canvas = h.canvas();
      const engine = fakeEngine();
      h.host.register(id, canvas, engine);
      return { id, canvas, engine };
    });

    for (const pad of pads) {
      expect(
        pad.engine.calls.reset,
        `${pad.id} restarted deterministically`,
      ).toBe(1);
      expect(pad.engine.calls.run, `${pad.id} ran to the still frame`).toEqual([
        REDUCED_MOTION_TICKS,
      ]);
      expect(pad.canvas.paints.length, `${pad.id} showed its still frame`).toBe(
        1,
      );
    }

    h.clock.step(0);
    h.clock.step(50);
    for (const pad of pads) {
      expect(
        pad.engine.calls.tick,
        `${pad.id} animated under reduced motion`,
      ).toBe(0);
    }

    // The operating system toggle, mid-session. Nothing re-registers.
    h.media.set(false);
    h.clock.step(60);
    h.clock.step(80);
    for (const pad of pads) {
      expect(
        pad.engine.calls.tick,
        `${pad.id} did not start when reduced motion went off`,
      ).toBeGreaterThan(0);
      expect(
        pad.engine.calls.reset,
        `${pad.id} was restarted rather than simply resumed`,
      ).toBe(1);
    }

    h.media.set(true);
    for (const pad of pads) {
      expect(
        pad.engine.calls.run,
        `${pad.id} did not return to the representative frame`,
      ).toEqual([REDUCED_MOTION_TICKS, REDUCED_MOTION_TICKS]);
      expect(pad.engine.calls.reset, `${pad.id} reset count`).toBe(2);
    }

    h.host.destroy();
  });

  it("lets a finger move the hero even under reduced motion, one sample per tick", () => {
    const h = harness({ reduced: true });
    const canvas = h.canvas();
    // Never animating on its own: the finger is the only thing that can run it.
    const engine = fakeEngine(0);
    h.host.setHero("hero");
    h.host.register("hero", canvas, engine);

    h.clock.step(0);
    expect(h.clock.pending, "a still pad with no finger asks for nothing").toBe(
      0,
    );

    expect(h.host.touchDown(7, 3, 4), "the contact was taken").toBe(true);
    h.host.touchMove(7, 4, 4);
    h.host.touchMove(7, 5, 5);
    h.host.touchMove(7, 6, 6);

    h.clock.step(10);
    expect(engine.calls.touch.length, "no tick, no sample").toBe(0);

    h.clock.step(20);
    expect(
      engine.calls.touch,
      "one sample per contact per tick, and the id is the contact SLOT",
    ).toEqual([["down", 0, 3, 4]]);
    expect(
      engine.calls.tick,
      "the user causing the motion is the reduced-motion carve-out",
    ).toBe(1);

    h.clock.step(30);
    expect(
      engine.calls.touch[1],
      "three MOVEs coalesced to the newest position",
    ).toEqual(["move", 0, 6, 6]);

    h.host.touchEnd(7);
    h.clock.step(40);
    expect(engine.calls.touch[2], "the lift reached the engine").toEqual([
      "up",
      0,
      6,
      6,
    ]);

    const ticked = engine.calls.tick;
    h.clock.step(50);
    h.clock.step(60);
    expect(engine.calls.tick, "the hero settled once the finger left").toBe(
      ticked,
    );
    expect(h.clock.pending, "and the loop stopped").toBe(0);

    h.host.destroy();
  });

  it("leaves nothing behind when it is destroyed", () => {
    const h = harness();
    const pads = ["a", "b"].map((id) => {
      const canvas = h.canvas();
      const engine = fakeEngine();
      h.host.register(id, canvas, engine);
      return { id, canvas, engine };
    });
    h.host.setHero("a");
    h.host.touchDown(1, 2, 2);
    h.clock.step(0);
    h.clock.step(16);

    const handle = h.clock.handle;
    const queued = h.clock.peek();
    expect(handle, "a frame was outstanding before destroy").toBeDefined();
    expect(h.media.subscribed, "the media source was subscribed").toBe(true);

    h.host.destroy();

    expect(
      h.clock.cancelled,
      "the outstanding frame was not cancelled",
    ).toContain(handle);
    expect(h.io.unobserved, "an observer was left attached").toBe(pads.length);
    expect(h.io.watching, "the observer still watches something").toBe(0);
    expect(h.media.stops, "the media subscription was not stopped").toBe(1);
    expect(h.media.subscribed, "the media listener leaked").toBe(false);
    for (const pad of pads) {
      expect(pad.canvas.width, `${pad.id} backing store was not released`).toBe(
        0,
      );
    }

    const ticks = pads.map((pad) => pad.engine.calls.tick);
    const touches = pads.map((pad) => pad.engine.calls.touch.length);
    queued?.(32);
    expect(
      pads.map((pad) => pad.engine.calls.tick),
      "a frame queued before destroy still ticked",
    ).toEqual(ticks);
    expect(
      pads.map((pad) => pad.engine.calls.touch.length),
      "a contact was still held after destroy",
    ).toEqual(touches);
  });

  it("swaps the engine under a live pad and keeps the canvas, the observer and the slot", () => {
    const h = harness();
    const canvas = h.canvas();
    const first = fakeEngine();
    h.host.setHero("a");
    h.host.register("a", canvas, first);
    h.clock.step(0);
    h.clock.step(50);
    expect(first.calls.tick, "the pad had run before the swap").toBe(5);

    const second = fakeEngine();
    h.host.replaceEngine("a", second);

    expect(canvas.width, "the backing store was torn down by the swap").toBe(
      GRID_SIDE,
    );
    expect(h.io.unobserved, "the observer was dropped by the swap").toBe(0);
    expect(h.io.watching, "the pad is watched exactly once").toBe(1);

    h.clock.step(60);
    h.clock.step(80);
    expect(
      second.calls.tick,
      "the new engine stalled: the swap waited for an observer callback",
    ).toBe(3);
    expect(first.calls.tick, "the old engine kept running after the swap").toBe(
      5,
    );
    expect(
      second.calls.reset,
      "a swap under full motion restarted the new engine at tick 0",
    ).toBe(0);

    // Only the hero receives contacts, so a sample reaching the new engine is
    // the proof that the slot's hero flag survived the swap.
    expect(h.host.touchDown(3, 2, 2), "the contact was taken").toBe(true);
    h.clock.step(90);
    h.clock.step(100);
    expect(
      second.calls.touch.map((call) => call[0]),
      "the swapped-in engine is no longer the hero",
    ).toEqual(["down"]);

    h.host.destroy();
  });

  it("paints the new engine at once, before the loop runs again", () => {
    const h = harness();
    const canvas = h.canvas();
    const first = fakeEngine();
    h.host.register("a", canvas, first);
    h.clock.step(0);
    h.clock.step(50);
    const before = canvas.paints.length;

    const second = fakeEngine();
    h.host.replaceEngine("a", second);

    expect(
      canvas.paints.length - before,
      "the swap did not paint: the new engine's frame waits for a frame callback",
    ).toBe(1);
    expect(
      canvas.paints[canvas.paints.length - 1],
      "the swap's paint did not happen at the swap's own timestamp",
    ).toBe(h.clock.now);

    h.host.destroy();
  });

  it("re-stills the pad on a swap under reduced motion, and ignores an id it does not know", () => {
    const h = harness({ reduced: true });
    const canvas = h.canvas();
    const first = fakeEngine();
    h.host.register("a", canvas, first);
    expect(first.calls.run, "the first engine was stilled at register").toEqual(
      [REDUCED_MOTION_TICKS],
    );
    const before = canvas.paints.length;

    const second = fakeEngine();
    // The still frame must run BEFORE the paint, or the visitor is shown an
    // unticked engine's blank square. Recording the paint count at the moment
    // run() is called is what pins that order.
    const paintsAtRun: number[] = [];
    const rawRun = second.run;
    second.run = (n: number): void => {
      paintsAtRun.push(canvas.paints.length);
      rawRun(n);
    };
    h.host.replaceEngine("a", second);

    expect(
      second.calls.reset,
      "the new engine was not restarted deterministically",
    ).toBe(1);
    expect(
      second.calls.run,
      "the new engine did not run to the representative frame",
    ).toEqual([REDUCED_MOTION_TICKS]);
    expect(
      paintsAtRun,
      "the swap painted before it stilled: a reduced-motion visitor sees an unticked frame",
    ).toEqual([before]);
    expect(
      canvas.paints.length - before,
      "a reduced-motion visitor kept looking at the previous engine's frozen picture",
    ).toBe(1);

    expect(
      () => h.host.replaceEngine("nobody", fakeEngine()),
      "a knob turn racing an unmount threw instead of doing nothing",
    ).not.toThrow();

    h.host.destroy();
  });

  it("repaints every registered pad without touching an engine, an observer or a backing store", () => {
    const h = harness();
    // Engines that settle, so the loop is quiet before repaintAll is called and
    // any tick or frame it caused is unambiguously its own.
    const pads = ["a", "b", "c"].map((id) => {
      const canvas = h.canvas();
      const engine = fakeEngine(3);
      h.host.register(id, canvas, engine);
      return { id, canvas, engine };
    });

    h.clock.step(0);
    h.clock.step(30);
    expect(h.clock.pending, "the row settled before the repaint").toBe(0);

    const paintsBefore = pads.map((pad) => pad.canvas.paints.length);
    const widthsBefore = pads.map((pad) => pad.canvas.widths.length);
    const ticksBefore = pads.map((pad) => pad.engine.calls.tick);
    const resetsBefore = pads.map((pad) => pad.engine.calls.reset);
    const observersBefore = h.io.handles;
    const rafsBefore = h.clock.rafCalls;
    const unobservedBefore = h.io.unobserved;

    h.host.repaintAll();

    pads.forEach((pad, i) => {
      expect(
        pad.canvas.paints.length - paintsBefore[i],
        `${pad.id} did not receive exactly one repaint`,
      ).toBe(1);
      expect(
        pad.canvas.paints[pad.canvas.paints.length - 1],
        `${pad.id} was painted at a timestamp that is not now`,
      ).toBe(h.clock.now);
      // The failure register() would produce, asserted where it is visible:
      // register() calls unregister(), which sets canvas.width = 0 - and then
      // register() sets it back to 9, so the FINAL value is innocent and only
      // the write is evidence. A zero-width write drops the backing store.
      expect(
        pad.canvas.widths.filter((w) => w === 0),
        `${pad.id}'s backing store was torn down by the repaint`,
      ).toEqual([]);
      expect(
        pad.canvas.widths.length,
        `${pad.id}'s backing store was written to at all by the repaint`,
      ).toBe(widthsBefore[i]);
      expect(
        pad.canvas.width,
        `${pad.id} lost its backing store to the repaint`,
      ).toBe(GRID_SIDE);
      expect(
        pad.canvas.height,
        `${pad.id} lost its backing store height to the repaint`,
      ).toBe(GRID_SIDE);
      expect(pad.engine.calls.tick, `${pad.id} was ticked by a repaint`).toBe(
        ticksBefore[i],
      );
      expect(
        pad.engine.calls.reset,
        `${pad.id} was restarted by a repaint`,
      ).toBe(resetsBefore[i]);
    });

    const observersAfter = h.io.handles;
    expect(
      observersAfter.length,
      "an observer was created by the repaint",
    ).toBe(observersBefore.length);
    observersAfter.forEach((off, i) => {
      expect(off, `pad ${i}'s observer was re-created by the repaint`).toBe(
        observersBefore[i],
      );
    });
    expect(h.io.unobserved, "an observer was dropped by the repaint").toBe(
      unobservedBefore,
    );
    expect(h.io.watching, "the three pads are each watched once").toBe(3);

    // Repainting is not a reason to start the loop. A wall of settled still
    // pads must stay at zero CPU after a sort has moved every card.
    expect(h.clock.rafCalls, "the repaint asked for a frame").toBe(rafsBefore);
    expect(h.clock.pending, "the repaint restarted the loop").toBe(0);

    h.host.destroy();
  });

  it("is a no-op after destroy", () => {
    const h = harness();
    const canvas = h.canvas();
    const engine = fakeEngine();
    h.host.register("a", canvas, engine);
    h.clock.step(0);
    h.clock.step(30);

    h.host.destroy();
    const paints = canvas.paints.length;
    const ticks = engine.calls.tick;

    expect(
      () => h.host.repaintAll(),
      "a repaint after destroy threw instead of doing nothing",
    ).not.toThrow();

    expect(
      canvas.paints.length,
      "a repaint after destroy painted a released backing store",
    ).toBe(paints);
    expect(engine.calls.tick, "a repaint after destroy ticked").toBe(ticks);
    expect(h.clock.pending, "a repaint after destroy queued a frame").toBe(0);
  });

  // ---------------------------------------------------------------------------
  // D-09's demonstration finger. Four things had to change in the host before a
  // card that paints nothing until it is touched could be touched at all, and
  // each of them is a test here.

  it("delivers a demo card's own gesture to a pad that is not the hero, through its own sampler", () => {
    const h = harness();
    const canvas = h.canvas();
    const engine = fakeEngine();
    h.host.register("card", canvas, engine, { demo: STROKE });

    h.clock.step(0);
    // 100 ms is the catch-up clamp, so this is ten whole ticks - past the
    // path's lift at tick 6 and short of its period.
    h.clock.step(100);

    // The DOWN and the MOVE carry the cells the path authored, converted to LED
    // coordinates at the cell centre. The UP carries the contact's LAST
    // position rather than the one written beside it, because TouchSampler.end
    // reuses the contact's own coordinates - a demo finger is subject to that
    // rule exactly as a real one is (touch.ts:126-137).
    expect(
      engine.calls.touch,
      "a browse card is never the hero, so without the demo term it would receive nothing at all",
    ).toEqual([
      ["down", 0, cellToCoord(2, 127, "x"), cellToCoord(3, 127, "y")],
      ["move", 0, cellToCoord(4, 127, "x"), cellToCoord(5, 127, "y")],
      ["up", 0, cellToCoord(4, 127, "x"), cellToCoord(5, 127, "y")],
    ]);
    expect(
      engine.calls.tick,
      "the gesture rode the host's own tick loop, one sample per tick",
    ).toBe(10);

    // The other half of the same rule: a pad with no demo path receives nothing.
    const plain = fakeEngine();
    h.host.register("plain", h.canvas(), plain);
    h.clock.step(200);
    expect(
      plain.calls.touch,
      "a pad with no demo path was handed a touch from somewhere",
    ).toEqual([]);

    h.host.destroy();
  });

  it("keeps a demo card running when its engine has settled, and freezes it under reduced motion", () => {
    // Never animating on its own: without the demo terms in active() this pad
    // would be judged frozen on the first frame and its rAF cancelled.
    const h = harness();
    const engine = fakeEngine(0);
    h.host.register("card", h.canvas(), engine, { demo: STROKE });

    h.clock.step(0);
    h.clock.step(100);
    expect(
      engine.animating,
      "the engine really does report itself settled - otherwise this test asserts nothing",
    ).toBe(false);
    expect(
      engine.pendingTouches,
      "the contact was opened and released inside the ten ticks",
    ).toBe(0);
    const ticked = engine.calls.tick;
    expect(ticked, "the demo card ticked at all").toBeGreaterThan(0);

    // The loop, past the end of the gesture and past the end of the period. The
    // sampler is empty for most of this and the engine is settled for all of
    // it; a demo card is active because it is a demo card.
    h.clock.step(200);
    h.clock.step(400);
    expect(
      engine.calls.tick,
      "a demo card stopped between two gestures, and nothing but a tick could ever restart it",
    ).toBeGreaterThan(ticked);
    expect(h.clock.pending, "the loop is still asking for frames").toBe(1);

    // The contrast, so the assertion above is about the demo path and not about
    // some other reason the loop stays alive.
    const still = fakeEngine(0);
    h.host.register("still", h.canvas(), still, {});
    const before = still.calls.tick;
    h.clock.step(500);
    h.clock.step(600);
    expect(
      still.calls.tick,
      "a settled pad with no demo path kept ticking",
    ).toBe(before);

    h.host.destroy();

    // Reduced motion: reset, replay the path to its end ONCE, and freeze. The
    // demo is uninvited motion, so a visitor who asked for less of it gets the
    // picture the gesture produced and no loop.
    const r = harness({ reduced: true });
    const frozen = fakeEngine(0);
    r.host.register("card", r.canvas(), frozen, { demo: STROKE });
    expect(frozen.calls.reset, "the still frame restarted the engine").toBe(1);
    expect(
      frozen.calls.run,
      "a demo entry replays its path rather than running to tick 64",
    ).toEqual([]);
    expect(
      frozen.calls.tick,
      "the whole period was replayed, tick by tick, so the samples could be delivered",
    ).toBe(STROKE.periodTicks);
    const replayed = frozen.calls.touch.length;
    expect(replayed, "the gesture reached the engine").toBe(3);

    r.clock.step(0);
    r.clock.step(300);
    expect(
      frozen.calls.tick,
      "the demo looped under reduced motion instead of freezing",
    ).toBe(STROKE.periodTicks);

    // Idempotent, which is what makes it safe on all three of its call sites.
    r.host.replaceEngine("card", frozen);
    expect(frozen.calls.reset, "the second still frame reset again").toBe(2);
    expect(
      frozen.calls.tick,
      "the second replay ran the same number of ticks",
    ).toBe(STROKE.periodTicks * 2);
    expect(
      frozen.calls.touch.length,
      "the second replay delivered the same gesture",
    ).toBe(replayed * 2);

    r.host.destroy();
  });

  it("cannot starve the visitor's finger, because a demo card holds its own five slots", () => {
    // THE POINT OF THE ONE-SAMPLER-PER-ENTRY DECISION, and it was measured on
    // exactly this arrangement with the demo entries handed the host's own
    // sampler: the visitor's five fingers came back true, true, true, FALSE,
    // FALSE, and the three that WERE accepted reached the hero's engine zero
    // times - every one of them was delivered to the first demo card instead.
    // See the demoSampler comment in host.ts for all three failure modes.
    expect(
      MAX_CONTACTS,
      "the fix is one sampler per demo entry, NOT a bigger global cap - raising this would change what the hardware tracks",
    ).toBe(5);

    const h = harness();
    const demos = ["one", "two", "three", "four"].map((id) => {
      const engine = fakeEngine();
      h.host.register(id, h.canvas(), engine, { demo: TWO_FINGERS });
      return { id, engine };
    });
    const heroEngine = fakeEngine();
    h.host.setHero("hero");
    h.host.register("hero", h.canvas(), heroEngine);

    h.clock.step(0);
    h.clock.step(60);

    for (const demo of demos) {
      expect(
        demo.engine.pendingTouches,
        `${demo.id}: both of its own contacts are down on its own engine`,
      ).toBe(2);
      expect(
        demo.engine.calls.touch.map((call) => call[1]),
        `${demo.id}: its contacts are slots 0 and 1 of ITS OWN sampler, not slots 6 and 7 of a shared one`,
      ).toEqual([0, 1]);
    }

    // Eight demo contacts are down. The visitor now puts five fingers on the
    // hero and every one of them is taken.
    const taken: boolean[] = [];
    for (let finger = 0; finger < MAX_CONTACTS; finger++) {
      taken.push(h.host.touchDown(100 + finger, finger, finger));
    }
    expect(
      taken,
      "the hero's five contacts were starved by the demo cards - the samplers are not separate",
    ).toEqual([true, true, true, true, true]);
    expect(
      h.host.touchDown(200, 0, 0),
      "a sixth pointer is refused, as on hardware",
    ).toBe(false);

    h.clock.step(70);
    expect(
      heroEngine.calls.touch.map((call) => call[1]),
      "the hero's five fingers reached ITS engine on the host's own sampler",
    ).toEqual([0, 1, 2, 3, 4]);
    for (const demo of demos) {
      expect(
        demo.engine.calls.touch.some((call) => call[1] > 1),
        `${demo.id}: a slot from another pad's finger arrived on this engine`,
      ).toBe(false);
    }

    h.host.destroy();
  });
});

/*
  A DEAD 2D CONTEXT, AND THE TWO ROUTES BACK FROM IT (plan 11-08.1).

  Before this block `grep -rn "contextlost\|contextrestored\|isContextLost"
  src/` returned nothing: BrowseGrid builds a card's engine exactly once ever,
  register() took the context once, and paint() wrote through it forever. On a
  memory-constrained device with 27 canvas layers the pads went black and
  stayed black - on the one screen an iOS visitor has, because DEGR-01 says
  they can never install.

  The three tests below are written against the two halves separately, because
  the header's table says each catches what the other cannot and a test that
  exercised only the pair together would let either be deleted as duplication.
*/
describe("a canvas whose backing store dies (src/lib/sim/host.ts)", () => {
  it("drops the cached context and the scratch on contextlost, and paints through neither", () => {
    const h = harness();
    const canvas = h.canvas();
    const engine = fakeEngine();
    h.host.register("pad", canvas, engine);

    const first = canvas.contexts[0];
    expect(
      first.paints.length,
      "register() painted the first frame at once, through the context it cached",
    ).toBe(1);
    expect(canvas.contexts, "one context so far").toHaveLength(1);

    // The engine drops the backing store and says so.
    canvas.loseContext();

    // THE LISTENER CLEARS AND DOES NOT REPAINT. There is nothing to paint into
    // yet - the store is gone - so contextlost is a release, never a redraw.
    expect(
      canvas.contexts,
      "the contextlost handler went looking for a context there was no point asking for",
    ).toHaveLength(1);
    expect(
      first.paints.length,
      "the contextlost handler painted into the store that had just been dropped",
    ).toBe(1);

    // And the next paint re-acquires rather than writing through the dead
    // reference. The fake's putImageData records rather than throwing precisely
    // so this is an assertion about the host and not about the fake.
    h.host.repaintAll();
    expect(
      first.paints.length,
      "the host wrote into the dead context after it had been told the store was gone",
    ).toBe(1);
    expect(
      canvas.contexts.length,
      "the host re-acquired instead of giving up silently",
    ).toBe(2);
    expect(
      canvas.contexts[1].paints.length,
      "and it painted the engine's current frame through the new one",
    ).toBe(1);

    h.host.destroy();
  });

  it("comes back by the event on a still card, and by the next paint on an animating one", () => {
    // BRANCH ONE: A STILL CARD. It never paints again by itself - the loop is
    // self-cancelling and a settled pad costs zero CPU - so only the
    // contextrestored listener can put its picture back. This is the case a
    // paint-time guard alone can NEVER reach.
    const still = harness();
    const stillCanvas = still.canvas();
    // stopAfterTicks 0: animating is false from the first read, so this pad is
    // settled and the loop has nothing to run for it.
    const stillEngine = fakeEngine(0);
    still.host.register("still", stillCanvas, stillEngine);
    still.clock.step(50);
    const beforeLoss = stillCanvas.paints.length;

    stillCanvas.loseContext();
    still.clock.step(200);
    expect(
      stillCanvas.paints.length,
      "a still pad painted itself while its context was dead - the branch is measuring nothing",
    ).toBe(beforeLoss);

    // A NEW CONTEXT IS DEMANDED EXPLICITLY, and the assertion is not
    // `contexts[length - 1]` alone. With no listener attached nothing calls
    // getContext again, so the last element would still be the ORIGINAL, whose
    // paint count from register() is one - and the test would pass against a
    // host that never recovered. Measured: it did, until this was tightened.
    const beforeRestore = stillCanvas.contexts.length;
    stillCanvas.restoreContext();
    expect(
      stillCanvas.contexts.length,
      "nothing asked the canvas for a context, so the still pad is black and stays black - the case a paint guard can never reach",
    ).toBe(beforeRestore + 1);
    const fresh = stillCanvas.contexts[stillCanvas.contexts.length - 1];
    expect(fresh, "the new context is not the dead one").not.toBe(
      stillCanvas.contexts[0],
    );
    expect(
      fresh.paints.length,
      "the still pad got its picture back on the card it was already sitting on, through the NEW context",
    ).toBe(1);
    still.host.destroy();

    // BRANCH TWO: AN ANIMATING CARD, WITH NO EVENT AT ALL. Nothing is
    // dispatched here - the context simply starts reporting isContextLost() -
    // which is the case an event listener alone can never reach, and the reason
    // the fix does not depend on an engine WebKit may never emit for.
    const moving = harness();
    const movingCanvas = moving.canvas();
    const movingEngine = fakeEngine();
    moving.host.register("moving", movingCanvas, movingEngine);
    const original = movingCanvas.contexts[0];
    expect(movingCanvas.contexts, "one context so far").toHaveLength(1);

    original.lost = true; // no dispatch, no listener, no notification
    moving.clock.step(SIDE_INTERVAL_MS + TICK_MS);

    expect(
      movingCanvas.contexts.length,
      "the paint guard never asked for a context again, so an engine that emits no event blanks the pad forever",
    ).toBeGreaterThan(1);
    const replacement = movingCanvas.contexts[movingCanvas.contexts.length - 1];
    expect(
      replacement.paints.length,
      "the animating pad came back on its own next paint, through the new context",
    ).toBeGreaterThan(0);
    expect(
      original.paints.length,
      "and nothing further went through the dead one",
    ).toBe(1);

    moving.host.destroy();
  });

  it("removes both listeners on unregister and on destroy", () => {
    const h = harness();
    const one = h.canvas();
    const two = h.canvas();
    h.host.register("one", one, fakeEngine());
    h.host.register("two", two, fakeEngine());

    expect(
      listenerCount(one),
      "register attached exactly the contextlost and contextrestored pair",
    ).toBe(2);
    expect(one.listeners.get("contextlost")?.size).toBe(1);
    expect(one.listeners.get("contextrestored")?.size).toBe(1);
    expect(listenerCount(two)).toBe(2);

    h.host.unregister("one");
    expect(
      listenerCount(one),
      "unregister left a listener holding an entry the host has let go of",
    ).toBe(0);
    expect(listenerCount(two), "and it took nothing off the other pad").toBe(2);

    // A re-register does not accumulate: register() unregisters first.
    h.host.register("two", two, fakeEngine());
    expect(listenerCount(two), "a second register doubled the pair").toBe(2);

    h.host.destroy();
    expect(
      listenerCount(two),
      "after destroy() there is nothing left to leak - the file's own promise",
    ).toBe(0);
  });
});
