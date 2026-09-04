// The whole loop, driven by a fake clock in node.
//
// There is no browser Vitest project in this repository (04-RESEARCH
// §Pitfall 6), so every dependency the host needs from a browser -
// requestAnimationFrame, cancelAnimationFrame, performance.now, an
// IntersectionObserver and a prefers-reduced-motion subscription - is injected.
// That is not a testing nicety: it is the only reason a 100 Hz scheduler with a
// self-cancelling frame loop can be asserted at all. Frames here advance only
// when a test says so, at a timestamp a test chose, which makes assertions about
// tick counts and paint cadence exact rather than flaky.
//
// The recording context is the shape paint.spec.ts uses, copied rather than
// exported from a spec file. Each fake canvas records the timestamp of every
// paint it received, so per-entry paint cadence is measurable per pad.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { SimHost, type HostDeps } from "./host";
import { GRID_SIDE } from "./paint";
import {
  HERO_INTERVAL_MS,
  MAX_CATCHUP_MS,
  REDUCED_MOTION_TICKS,
  SIDE_INTERVAL_MS,
  TICK_MS,
} from "./schedule";

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

type Recording = HTMLCanvasElement & { paints: number[] };

/** A canvas whose context draws nothing and records when it was painted. */
function fakeCanvas(now: () => number): Recording {
  const paints: number[] = [];
  const ctx = {
    createImageData: (w: number, h: number) => ({
      width: w,
      height: h,
      data: new Uint8ClampedArray(w * h * 4),
    }),
    putImageData: () => {
      paints.push(now());
    },
  };
  return {
    width: 0,
    height: 0,
    paints,
    getContext: () => ctx,
  } as unknown as Recording;
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
  let unobserved = 0;
  return {
    observe: (el: unknown, cb: (intersecting: boolean) => void) => {
      watched.set(el, cb);
      cb(true);
      return () => {
        unobserved++;
        watched.delete(el);
      };
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
});
