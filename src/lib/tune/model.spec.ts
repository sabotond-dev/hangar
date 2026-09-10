// The tuner's behaviour, in node, before a pixel of it exists.
//
// THE ONE THING THIS FILE IS FOR: proving that a knob turn produces a new
// picture on the same tick and a new character count a tenth of a second later,
// and that the meters say which of those two they are showing. Everything else
// here is scaffolding for that.
//
// FAKE TIMERS EVERYWHERE EXCEPT TESTS 3 AND 6. The debounce is a setTimeout, so
// vi.useFakeTimers() is what makes "five turns inside 120 ms" a statement about
// the code rather than about the machine. Test 3 wants a genuinely cold
// formatter and test 6 instantiates a real Lua VM; neither is a timer question
// and both are steadier on the real clock.
//
// WHY settle() IS A MICROTASK LOOP AND NOT A CLOCK ADVANCE. The FIRST
// measurement is not scheduled on a timer at all - buildTuner starts it
// immediately, and it lands through a promise chain that goes
// padReady -> compileState -> costOf. Advancing a fake clock does not move a
// promise chain, so the flush is a fixed number of microtask hops.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  compile as vendorCompile,
  cost as vendorCost,
  EVENT_BUDGET,
} from "../../vendor/botor/_pad";
import { byId, type CatalogEntry } from "../catalog";
import { compileState, costOf, padReady } from "../pad";
import type { SimEngine } from "../sim/engine";
import {
  buildTuner,
  needsLadder,
  COMPILE_DEBOUNCE_MS,
  type ConfigStrings,
  type ForecastView,
  type LadderView,
  type OverBudgetView,
} from "./model";
import { resetAll } from "./state";
import { COLOUR_LATTICE_SIZE, knobPosition, type TuneView } from "./view";

/** The card whose ladder is genuinely reachable with a reserve - see ladder.spec.ts. */
const OVER_RESERVE = { setup: 300, timer: 0 };

function mustEntry(id: string): CatalogEntry {
  const entry = byId(id);
  if (!entry) throw new Error(`no catalog entry: ${id}`);
  return entry;
}

/** Every callback the tuner takes, with everything it emitted kept in order. */
function recorder() {
  const views: TuneView[] = [];
  const previews: SimEngine[] = [];
  const ladders: (LadderView | undefined)[] = [];
  const overs: (OverBudgetView | undefined)[] = [];
  const configs: (ConfigStrings | undefined)[] = [];
  const forecasts: (ForecastView | undefined)[] = [];
  return {
    views,
    previews,
    ladders,
    overs,
    configs,
    forecasts,
    onview: (view: TuneView) => void views.push(view),
    onpreview: (engine: SimEngine) => void previews.push(engine),
    onladder: (ladder: LadderView | undefined) => void ladders.push(ladder),
    onover: (over: OverBudgetView | undefined) => void overs.push(over),
    onconfig: (config: ConfigStrings | undefined) => void configs.push(config),
    onforecast: (next: ForecastView | undefined) => void forecasts.push(next),
  };
}

/**
 * Let every already-scheduled microtask chain finish. A fixed number of hops,
 * because the chain is a fixed length: padReady, compileState, costOf.
 */
async function settle(): Promise<void> {
  for (let index = 0; index < 64; index++) await Promise.resolve();
}

/** A real wait, for the two tests that run on the real clock. */
const pause = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const settledViews = (views: readonly TuneView[]) =>
  views.filter((view) => view.setup.state === "settled");

/**
 * Make every `close()` the tuner performs on this engine observable, WITHOUT
 * stopping it happening.
 *
 * An own property shadowing the prototype method, installed from inside
 * `onpreview` - which is the moment before `swapEngine` can close anything, so
 * no close is ever missed. `closeEngine` calls `maybe.close()` on the very
 * object handed over, so the spy is what it reaches. The Lua route's engine is
 * the one that really carries `close` (src/lib/sim/lua-pad-sim.ts), so this is
 * the real method rather than a fixture pretending to be one.
 */
function watchClose(engine: SimEngine, closed: SimEngine[]): void {
  const owner = engine as SimEngine & { close?: () => void };
  const original = owner.close?.bind(owner);
  owner.close = (): void => {
    closed.push(engine);
    original?.();
  };
}

/** n ticks of an engine, copied out before the next engine touches it. */
function frameAfter(engine: SimEngine, ticks: number): Uint8Array {
  engine.run(ticks);
  return Uint8Array.from(engine.frame);
}

const same = (a: Uint8Array, b: Uint8Array) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const modelSource = () =>
  readFileSync(fileURLToPath(new URL("./model.ts", import.meta.url)), "utf8");

/** The house stripper: line, block and markup comments, backslash-free. */
const strip = (source: string) =>
  source
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

describe("the tuner (TUNE-02, TUNE-03)", () => {
  beforeAll(async () => {
    await padReady();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("a knob turn repaints on the same tick: the preview is not debounced", async () => {
    vi.useFakeTimers();
    const rec = recorder();
    const tuner = await buildTuner({ entryId: "aurora", ...rec });

    expect(rec.previews, "no engine arrived with the tuner").toHaveLength(1);
    const before = frameAfter(rec.previews[0], 48);

    const colour = tuner.knobs.find((knob) => knob.id === "colour");
    expect(colour, "aurora has a colour knob").toBeDefined();
    const other = (tuner.indices["colour"] + 2) % colour!.options.length;

    tuner.set("colour", other);
    // The whole claim of D-05/D-06, as one assertion: no clock moved between
    // the previous line and this one.
    expect(
      rec.previews,
      "the preview waited for the debounce instead of repainting",
    ).toHaveLength(2);

    const after = frameAfter(rec.previews[1], 48);
    expect(
      same(before, after),
      "the new engine paints the same picture as the old one",
    ).toBe(false);

    // THE POSITION INVARIANT, asserted where a colour knob is already being
    // turned (plans 10-08 and 10-10). `KnobView.index` indexes `values`, and
    // `knobPosition` is the ONE named door back to the knob's own position.
    // Anything outside the widget that reads `.index` directly is one data
    // widening away from reporting the wrong number, which was MEASURED once:
    // 10-08's two-swatch window read aurora's colour back as slot 0 instead of
    // lattice position 95, and `install.e2e.ts` disabled KEEP ON DEVICE with
    // `knobs-moved` after a write nobody had touched. 10-10's picker removed
    // the window, so the translation is the identity again - and this is what
    // makes the identity a MEASUREMENT rather than an assumption. Held for
    // EVERY knob on the view, not only the colour one.
    const views = rec.views.at(-1)?.knobs ?? [];
    expect(views.length, "the last view carried the rack").toBe(
      tuner.knobs.length,
    );
    for (const each of views) {
      expect(
        knobPosition(each),
        `${each.id}: the view's position disagrees with the tuner's index`,
      ).toBe(tuner.indices[each.id]);
      expect(
        each.index,
        `${each.id}: the view's index is not a position in its own values`,
      ).toBeLessThan(each.values.length);
    }
    // AND THE WINDOW IS GONE. 10-08 shipped a two-swatch bridge because a
    // 4,096-option swatch row broke the panel; 10-10's picker draws 48 detents
    // instead of 4,096 options, so the whole lattice reaches the view again.
    // Asserted in BOTH directions - the count is the lattice's, and the view
    // carries no `positions` field to translate through - so the bridge cannot
    // come back quietly beside the picker that replaced it.
    const colourView = views.find((each) => each.id === "colour");
    expect(
      colourView?.values.length,
      "the colour view is not the whole lattice - the rack window is back, or the knob shrank",
    ).toBe(COLOUR_LATTICE_SIZE);
    expect(
      Object.keys(colourView ?? {}),
      "KnobView carries a `positions` window again beside the picker that removed it",
    ).not.toContain("positions");
    expect(
      colourView && knobPosition(colourView),
      "a colour view's position is not its own index, so a coordinate system came back",
    ).toBe(colourView?.index);

    tuner.destroy();
  });

  it("five turns inside the debounce window are one compile, and the meters go stale rather than blank", async () => {
    vi.useFakeTimers();
    const rec = recorder();
    const tuner = await buildTuner({ entryId: "aurora", ...rec });
    await settle();

    const first = settledViews(rec.views);
    expect(first, "the first measurement never landed").toHaveLength(1);
    const known = { setup: first[0].setup.used, timer: first[0].timer.used };

    const speed = tuner.knobs.find((knob) => knob.id === "speed");
    expect(speed, "aurora has a speed knob").toBeDefined();
    const mark = rec.views.length;

    for (let step = 0; step < 5; step++) {
      tuner.set("speed", (speed!.default + 1 + step) % speed!.options.length);
    }

    const during = rec.views.slice(mark);
    expect(during, "a turn did not emit a view").toHaveLength(5);
    for (const view of during) {
      expect(view.setup.state, "a mid-drag meter was not stale").toBe("stale");
      expect(view.timer.state).toBe("stale");
      // The X-13 rule: the SAME last-known numbers, never the measuring word.
      expect(view.setup.used).toBe(known.setup);
      expect(view.timer.used).toBe(known.timer);
    }

    // THE DEBOUNCE ITSELF, and the only assertion that names it: with the
    // window still open, no measurement may have landed however many microtasks
    // have run. Dropping the debounce turns exactly this line red.
    await settle();
    expect(
      settledViews(rec.views),
      "a measurement landed while the debounce window was still open",
    ).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(COMPILE_DEBOUNCE_MS);
    await settle();

    expect(
      settledViews(rec.views),
      "five turns inside one window were not one compile",
    ).toHaveLength(2);

    // -----------------------------------------------------------------------
    // THE FORECAST RIDES THIS SAME DEBOUNCE, AND THAT IS WHY IT IS ASSERTED
    // HERE rather than in a test of its own (TUNE-02, T2). A second debounce
    // with its own number is the thing this block exists to prevent.
    const landed = settledViews(rec.views).at(-1);
    expect(landed, "the second measurement never landed").toBeDefined();
    const now = { setup: landed!.setup.used, timer: landed!.timer.used };
    const standing = tuner.indices["speed"];
    const candidate = (standing + 1) % speed!.options.length;
    const ladderMark = rec.ladders.length;
    const viewMark = rec.views.length;

    tuner.forecast("speed", candidate);
    await settle();
    expect(
      rec.forecasts,
      "a forecast published before its debounce window closed - it is on a timer of its own",
    ).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(COMPILE_DEBOUNCE_MS);
    await settle();
    expect(rec.forecasts, "the forecast never arrived").toHaveLength(1);
    const forecast = rec.forecasts[0];
    expect(forecast?.knobId).toBe("speed");
    expect(
      forecast?.position,
      "the forecast is for a slot, not a position",
    ).toBe(candidate);
    // The deltas are the forecast MINUS the current, from the same function.
    expect(forecast!.setupDelta).toBe(forecast!.setup - now.setup);
    expect(forecast!.timerDelta).toBe(forecast!.timer - now.timer);

    // A FORECAST MOVES NOTHING. No view is emitted, no ladder is asked for,
    // and the knob is exactly where it was - it is a question, not a turn.
    expect(rec.views.length, "a forecast emitted a view").toBe(viewMark);
    expect(rec.ladders.length, "a forecast reached the ladder").toBe(
      ladderMark,
    );
    expect(tuner.indices["speed"], "a forecast moved the knob").toBe(standing);

    // MEMOISED ON THE INDEX VECTOR: the same question a second time answers
    // WITHOUT the debounce, which is what keeps the ghost off the pointer's
    // heels when a visitor comes back to an option they have already hovered.
    tuner.forecast("speed", undefined);
    await settle();
    expect(
      rec.forecasts.at(-1),
      "the withdrawal never arrived",
    ).toBeUndefined();
    tuner.forecast("speed", candidate);
    await settle();
    expect(
      rec.forecasts.at(-1),
      "a memo hit waited out the debounce, so a re-hover lags the pointer",
    ).toEqual(forecast);

    tuner.destroy();
  });

  it("the first view says measuring, and the picture arrives before the formatter does", async () => {
    // A FRESH module graph, the src/lib/pad/ready.spec.ts test 6 idiom: this
    // process's formatter is already warm, so the only way to observe the
    // pre-gate branch again is to rebuild the vendored compiler and the
    // protocol package under it. Nothing here awaits padReady().
    vi.resetModules();
    const fresh = await import("./model");
    const rec = recorder();
    const tuner = await fresh.buildTuner({ entryId: "aurora", ...rec });

    expect(rec.views.length, "no view was emitted at all").toBeGreaterThan(0);
    expect(rec.views[0].setup.state).toBe("measuring");
    expect(rec.views[0].timer.state).toBe("measuring");
    expect(
      rec.views.every((view) => view.setup.state === "measuring"),
      "a measurement landed before the formatter could have initialised",
    ).toBe(true);

    // And the simulation did not wait for any of it.
    expect(rec.previews, "the preview waited on the gate").toHaveLength(1);
    rec.previews[0].run(16);
    expect(rec.previews[0].frame).toHaveLength(243);

    tuner.destroy();
  });

  it("the settled meters are the pinned minifier's own numbers, per event", async () => {
    vi.useFakeTimers();
    const rec = recorder();
    const tuner = await buildTuner({ entryId: "aurora", ...rec });
    await settle();

    // Computed independently, through the VENDORED compile and cost rather
    // than through the surface the tuner used. The state comes from resetAll
    // because that is what "at the defaults" means for a shelf card - it keeps
    // the preset field, and compile writes the stamp into the marker name, so a
    // state without it would measure differently and prove nothing.
    const expected = vendorCost(vendorCompile(resetAll(mustEntry("aurora"))));
    const view = settledViews(rec.views).at(-1);
    expect(view, "no settled view landed").toBeDefined();
    expect(view!.setup.used).toBe(expected.setup.used);
    expect(view!.timer.used).toBe(expected.timer.used);
    expect(view!.setup.limit).toBe(EVENT_BUDGET);
    expect(view!.timer.limit).toBe(EVENT_BUDGET);

    // And again after a turn, so the numbers are the tuned state's and not a
    // constant the tuner happened to emit once.
    const band = tuner.knobs.find((knob) => knob.id === "band");
    expect(band, "aurora has a band knob").toBeDefined();
    const moved = (band!.default + 1) % band!.options.length;
    tuner.set("band", moved);
    await vi.advanceTimersByTimeAsync(COMPILE_DEBOUNCE_MS);
    await settle();

    const tuned = settledViews(rec.views).at(-1);
    const entry = mustEntry("aurora");
    const knob = (await import("./knobs.preset"))
      .presetKnobs("aurora")
      .find((each) => each.id === "band");
    const state = knob!.apply(
      (await import("./state")).baseStateFor(entry),
      moved,
    );
    const after = vendorCost(vendorCompile(state));
    expect(tuned!.setup.used).toBe(after.setup.used);
    expect(tuned!.timer.used).toBe(after.timer.used);

    tuner.destroy();
  });

  it("needsLadder is the only door to the ladder, and there is exactly one of it", async () => {
    // Real costs on both sides, never a hand-made literal: a PadCost the test
    // wrote itself would prove only that needsLadder can read a field.
    const fitting = await costOf(
      await compileState(resetAll(mustEntry("dial"))),
    );
    expect(fitting.fits, "dial at its defaults must fit").toBe(true);
    expect(needsLadder(fitting)).toBe(false);

    const over = await costOf(
      await compileState(resetAll(mustEntry("dial"))),
      OVER_RESERVE,
    );
    expect(over.fits, "the reserve must really push it over").toBe(false);
    expect(needsLadder(over)).toBe(true);

    const source = strip(modelSource());
    const sites = [...source.matchAll(/fitState[ ]*[(]/g)];
    expect(
      sites,
      "fit() compiles once per ladder step; more than one call site is more than one ladder",
    ).toHaveLength(1);

    // "Inside the needsLadder branch", structurally: the guard is the last
    // thing before the call, and no block closes between them.
    const call = source.indexOf("fitState(");
    const guard = source.lastIndexOf("needsLadder(", call);
    expect(
      guard,
      "the ladder is not guarded by needsLadder at all",
    ).toBeGreaterThan(-1);
    const between = source.slice(guard, call);
    expect(
      between,
      "a block closes between the guard and the ladder",
    ).not.toContain("}");
    expect(between.length).toBeLessThan(120);

    // -----------------------------------------------------------------------
    // AND THE FORECAST NEVER GETS ONE (TUNE-02, T2). "Never fit()" is a
    // PERFORMANCE contract on a pointer path - fit() is N+1 minifier calls at
    // roughly 4.4 ms on a state that already fits, and forecasting n options
    // per knob through it would be n times that - and a performance contract
    // with no guard is a comment. The single-call-site assertion above is that
    // guard: a fitState() call added to the forecast would make it two.
    //
    // This block says the same thing at the function rather than at the file,
    // so a red run names the forecast rather than only the count.
    const start = source.indexOf("async function costFor(");
    expect(
      start,
      "costFor is gone - the forecast's one measurement no longer has a name",
    ).toBeGreaterThan(-1);
    const body = source.slice(start, source.indexOf("\n  }", start));
    expect(
      body,
      "the forecast reaches the fitter, which is N+1 minifier calls on a hover",
    ).not.toContain("fitState");
    expect(
      body,
      "the forecast no longer measures with cost() at all",
    ).toContain("costOf(");
    expect(
      body,
      "the Lua route's forecast no longer measures the Lua it would render",
    ).toContain("measureLua(");
  });

  it("a Lua entry waits for its fresh VM, and is never told a ladder it does not have", async () => {
    // Real timers: this test builds two real Lua 5.4 VMs, and the debounce is
    // not the thing under measurement here.
    const rec = recorder();
    const tuner = await buildTuner({ entryId: "euclid", ...rec });
    await pause(80);
    const before = rec.previews.length;
    expect(before, "no engine arrived with the tuner").toBe(1);

    const tempo = tuner.knobs.find((knob) => knob.id === "tempo");
    expect(tempo, "euclid has a tempo knob").toBeDefined();
    tuner.set("tempo", (tempo!.default + 1) % tempo!.options.length);

    // D-06: the previous engine keeps painting for the whole await.
    expect(
      rec.previews,
      "a Lua entry repainted before its new VM had run Setup",
    ).toHaveLength(before);

    await pause(COMPILE_DEBOUNCE_MS + 400);
    expect(
      rec.previews,
      "the fresh VM never arrived, or arrived more than once",
    ).toHaveLength(before + 1);

    // D-10: their whole knob cross-product was proven in budget at build time,
    // so there is no runtime ladder and inventing a line would fake one.
    expect(rec.ladders, "a Lua entry was told about a ladder").toHaveLength(0);
    expect(
      rec.overs,
      "a Lua entry was told about a budget it cannot cross",
    ).toHaveLength(0);

    tuner.destroy();
  });

  it("destroy cancels a pending measurement and leaves no timer behind", async () => {
    vi.useFakeTimers();
    const rec = recorder();
    const tuner = await buildTuner({ entryId: "aurora", ...rec });
    await settle();

    const speed = tuner.knobs.find((knob) => knob.id === "speed");
    tuner.set("speed", (speed!.default + 1) % speed!.options.length);
    const mark = rec.views.length;
    expect(vi.getTimerCount(), "the debounce was never armed").toBe(1);

    tuner.destroy();
    expect(vi.getTimerCount(), "a timer outlived destroy").toBe(0);

    await vi.advanceTimersByTimeAsync(COMPILE_DEBOUNCE_MS * 4);
    await settle();
    expect(rec.views, "a view landed after destroy").toHaveLength(mark);
  });

  it("the engine it hands over is the row's, and destroy does not close it", async () => {
    // OWNERSHIP TRANSFERS AT onpreview (05.1-CONTEXT D-18). The consumer swaps
    // the engine into SimHost synchronously inside that callback and paints it
    // from there on, so an engine the tuner has published is not the tuner's to
    // close. On /c/euclid/ the row is EUCLID ALONE, so before this rule the
    // panel's own close button closed the Lua VM behind the only pad on the
    // page and blanked it. This is the node half of the proof; plan 05.1-11's
    // e2e is the browser half.
    //
    // Real timers, for test 6's reason: this builds two real Lua 5.4 VMs and
    // the debounce is not what is under measurement. Test 7 owns the "destroy
    // leaves no timer behind" half and is deliberately not repeated here.
    const rec = recorder();
    const closed: SimEngine[] = [];
    const tuner = await buildTuner({
      entryId: "euclid",
      ...rec,
      onpreview: (engine: SimEngine) => {
        rec.onpreview(engine);
        watchClose(engine, closed);
      },
    });
    await pause(80);
    expect(rec.previews, "no engine arrived with the tuner").toHaveLength(1);
    const first = rec.previews[0];

    const tempo = tuner.knobs.find((knob) => knob.id === "tempo");
    expect(tempo, "euclid has a tempo knob").toBeDefined();
    tuner.set("tempo", (tempo!.default + 1) % tempo!.options.length);
    await pause(COMPILE_DEBOUNCE_MS + 400);

    expect(rec.previews, "the second VM never arrived").toHaveLength(2);
    const last = rec.previews[1];

    // Half one: the REPLACED engine is closed, once, at the swap. Nothing
    // leaks - swapEngine closes the previous one after the handover.
    expect(
      closed.filter((engine) => engine === first),
      "the replaced engine was not closed exactly once at the swap",
    ).toHaveLength(1);
    expect(
      closed.includes(last),
      "the live engine was closed while it was still the current one",
    ).toBe(false);

    // Half two: the LAST published engine survives destroy, because the row is
    // still painting it.
    tuner.destroy();
    expect(
      closed.includes(last),
      "destroy closed the engine the tuner had already handed to the row",
    ).toBe(false);
    expect(
      closed.filter((engine) => engine === first),
      "destroy closed the replaced engine a second time",
    ).toHaveLength(1);
  });

  it("onconfig carries the compiled pair with every landing, and undefined the instant a knob moves", async () => {
    // D-17. The strings are published from inside land(), so they arrive with
    // the numbers that measured them and never before; and they are withdrawn
    // from inside moveTo(), on the same tick as the feed goes stale, so the
    // 120 ms window in which the meters show the previous numbers is also a
    // window in which there is nothing to write (07-RESEARCH Pitfall 5).
    vi.useFakeTimers();
    const rec = recorder();
    const tuner = await buildTuner({ entryId: "aurora", ...rec });
    // Nothing is published before a landing: the first emit carries the
    // measuring meters and no strings at all.
    expect(rec.configs, "a pair was published before anything landed").toEqual(
      [],
    );
    await settle();

    const landed = settledViews(rec.views).at(-1);
    expect(landed, "the first measurement never landed").toBeDefined();
    expect(rec.configs, "one landing is one pair").toHaveLength(1);
    const first = rec.configs[0];
    expect(first, "the landing published no pair").toBeDefined();
    // The bytes are the numbers: the pin wire-pin.spec.ts holds across the
    // whole catalog, stated once here for the entry this file is about.
    expect(first!.setup.length).toBe(landed!.setup.used);
    expect(first!.timer.length).toBe(landed!.timer.used);

    const band = tuner.knobs.find((knob) => knob.id === "band");
    expect(band, "aurora has a band knob").toBeDefined();
    tuner.set("band", (band!.default + 1) % band!.options.length);
    // THE WITHDRAWAL, and the only assertion that names it: no clock moved
    // between the previous line and this one. Dropping the undefined emit
    // from moveTo leaves the old pair here.
    expect(rec.configs, "a knob move did not publish anything").toHaveLength(2);
    expect(
      rec.configs.at(-1),
      "the strings were still published while the feed was stale",
    ).toBeUndefined();
    // And however many microtasks run inside the window, still nothing.
    await settle();
    expect(rec.configs.at(-1)).toBeUndefined();

    await vi.advanceTimersByTimeAsync(COMPILE_DEBOUNCE_MS);
    await settle();
    const second = rec.configs.at(-1);
    expect(second, "the recompile landed no pair").toBeDefined();
    expect(second!.setup, "the new pair is the old pair").not.toBe(
      first!.setup,
    );
    const tuned = settledViews(rec.views).at(-1);
    expect(second!.setup.length).toBe(tuned!.setup.used);
    expect(second!.timer.length).toBe(tuned!.timer.used);

    tuner.destroy();
  });

  it("a knob index lands a different pair on LUMEN and on NINE PADS - the two entries the bench said had not changed", async () => {
    // THE DECIDING EVIDENCE FOR TWO BENCH REPORTS, and the reason plan 12-01
    // runs before a line of the touch framework is written. LUMEN came back
    // "seems like nothing changed" after the depth knob, NINE PADS came back
    // "make a 16 pads cause nothing changed" after the 4x4 knob - the same
    // shape of report on two entries, one Lua and one preset. Probe B on the
    // user's own ZONA then settled that LUMEN's four depth values are four
    // plainly distinct brightness steps on the desk (196 / 139 / 84 / 27, with
    // 27 clearly lit against dark), so the LEDs render what they are sent.
    // What was never tested is whether a knob index reaches the pair at all.
    // This test asks that question of the tuner; install.e2e.ts asks it of the
    // browser and of the module's RAM.
    //
    // REAL TIMERS, for test 6's reason and one more. LUMEN is a Lua entry:
    // its landing waits on a fresh Lua 5.4 VM and arrives on the real clock,
    // not down a microtask chain, so settle() reads configs.at(-1) BEFORE the
    // landing and a fake clock does not move a promise. Both entries are
    // therefore waited on with pause(), the way the Lua test above does it.
    const CASES = [
      { entryId: "lumen", knobId: "depth", a: 0, b: 3 },
      { entryId: "ninepads", knobId: "grid", a: 0, b: 1 },
    ] as const;
    const landedLengths: string[] = [];

    for (const { entryId, knobId, a, b } of CASES) {
      const rec = recorder();
      const tuner = await buildTuner({ entryId, ...rec });
      const knob = tuner.knobs.find((each) => each.id === knobId);
      expect(knob, `${entryId} has a ${knobId} knob`).toBeDefined();
      for (const index of [a, b]) {
        expect(
          index,
          `${entryId}'s ${knobId} has no index ${index}: its options are ${JSON.stringify(knob!.options)}`,
        ).toBeLessThan(knob!.options.length);
      }

      // The default landing first, so the two tuned ones are measured against
      // a tuner that is known to have published at all.
      await pause(COMPILE_DEBOUNCE_MS + 400);
      const atDefault = rec.configs.at(-1);
      expect(
        atDefault,
        `${entryId} published no pair at its defaults`,
      ).toBeDefined();

      /**
       * Move the knob and wait for the landing. THE WITHDRAWAL IS ASSERTED
       * ONLY WHERE A MOVE ACTUALLY HAPPENS: set() returns early when the index
       * is already where it is asked to go (model.ts, `if (next ===
       * indices[knobId]) return`), and NINE PADS' first index IS its default,
       * so its first step publishes nothing and there is nothing to withdraw.
       * Asserting undefined unconditionally would read the previous landing
       * and call the tuner broken for behaving correctly.
       */
      let at = knob!.default;
      const landAt = async (index: number): Promise<ConfigStrings> => {
        const moves = index !== at;
        const before = rec.configs.length;
        tuner.set(knobId, index);
        if (moves) {
          // D-17, on the same tick as the set and with no clock moved.
          expect(
            rec.configs,
            `${entryId}: the ${knobId} move published nothing at all`,
          ).toHaveLength(before + 1);
          expect(
            rec.configs.at(-1),
            `${entryId}: the pair survived a ${knobId} move that made it stale`,
          ).toBeUndefined();
        }
        at = index;
        await pause(COMPILE_DEBOUNCE_MS + 400);
        const landed = rec.configs.at(-1);
        expect(
          landed,
          `${entryId}: ${knobId} index ${index} landed no pair`,
        ).toBeDefined();
        // The bytes are the meter's, for the vector that is on screen.
        const view = settledViews(rec.views).at(-1);
        expect(
          landed!.setup.length,
          `${entryId}: the landed Setup is not the length the meter settled on`,
        ).toBe(view!.setup.used);
        expect(landed!.timer.length).toBe(view!.timer.used);
        return landed!;
      };

      const first = await landAt(a);
      const second = await landAt(b);
      landedLengths.push(
        `${entryId} ${knobId} ${a}: setup ${first.setup.length} timer ${first.timer.length}`,
        `${entryId} ${knobId} ${b}: setup ${second.setup.length} timer ${second.timer.length}`,
      );

      // THE ASSERTION THE WHOLE TEST IS FOR.
      expect(
        second.setup,
        `${entryId}: ${knobId} index ${a} and index ${b} landed the SAME Setup - the knob does not reach the pair (both ${second.setup.length} characters)`,
      ).not.toBe(first.setup);

      if (entryId === "ninepads") {
        // The lengths move too, so the difference is legible in a meter and
        // not only in a diff. LUMEN's do NOT - @DEPTH is one character at
        // every index, so 742 is 742 either way - and that is exactly why a
        // reader must not take equal lengths for equal strings.
        expect(
          second.setup.length,
          `NINE PADS at 16 pads costs the same as at 9 (${second.setup.length})`,
        ).not.toBe(first.setup.length);
      }

      tuner.destroy();
    }

    // Quoted by 12-01-SUMMARY.md, and the reason this test prints at all: the
    // four numbers are the evidence, and one of them (NINE PADS at 4x4)
    // disagrees with presets.ts's declared 550 - reported, never reconciled.
    console.log(`the knob-to-pair path:\n  ${landedLengths.join("\n  ")}`);
  });

  it("TURN IT DOWN's back-off publishes undefined, then the resolved pair", async () => {
    // Through the over-budget door: dial at ladder.spec.ts's reserve, the only
    // pairing on the shelf that reaches both the block and a real ladder (tpad
    // is blocked on `sends` and offers no step, so its apply() is a no-op).
    // The back-off is the second place the feed goes stale, and it withdraws
    // the strings the same way a knob move does.
    vi.useFakeTimers();
    const rec = recorder();
    const tuner = await buildTuner({
      entryId: "dial",
      reserved: OVER_RESERVE,
      ...rec,
    });
    await settle();

    const over = rec.overs.at(-1);
    expect(
      over,
      "dial under the reserve did not arrive over budget",
    ).toBeDefined();
    const before = rec.configs.length;
    expect(before, "the over-budget landing published no pair").toBeGreaterThan(
      0,
    );
    expect(
      rec.configs.at(-1),
      "an over-budget landing still publishes its pair",
    ).toBeDefined();

    over!.apply();
    expect(rec.configs, "the back-off published nothing").toHaveLength(
      before + 1,
    );
    expect(
      rec.configs.at(-1),
      "the strings survived the back-off while the feed was stale",
    ).toBeUndefined();

    await vi.advanceTimersByTimeAsync(COMPILE_DEBOUNCE_MS);
    await settle();
    const resolved = rec.configs.at(-1);
    expect(resolved, "the resolved state landed no pair").toBeDefined();
    expect(resolved!.setup.length).toBeLessThanOrEqual(EVENT_BUDGET);
    expect(resolved!.timer.length).toBeLessThanOrEqual(EVENT_BUDGET);
    // The bytes are the meter's, less the reserve the test added to reach here.
    // The last view is the landing's; under the reserve its state is "over"
    // rather than "settled" (meterView), which is the door being open.
    const view = rec.views.at(-1);
    expect(view!.setup.state).toBe("over");
    expect(resolved!.setup.length).toBe(view!.setup.used - OVER_RESERVE.setup);

    tuner.destroy();
  });
});
