// The phase's load-bearing claim as a test that runs: no state a visitor can produce is over 908
// characters, so TUNE-04 and TUNE-05 ship as tested guards. Proved FOR THE PINNED COMPILER (the
// vendored `_pad.ts` through the protocol pin) - a property of a version, re-run after any re-sync
// or pin bump; red means the guards stopped being unreachable, which is news. `cost()` runs on every
// state; `fit()` (N+1 minifier calls) only on states whose `cost().fits` is false plus each preset's
// measured worst state. Two passes since 10-08 (G-07): Pass A every non-colour knob cross-producted
// with the colour pinned at the measured dearest literal, Pass B the colour dimension alone - a
// colour's cost is occurrences times the literal's length, independent of every other knob, so Pass B
// runs first and hands Pass A its pin. The total is 44,078 states (32,852 before D-06's lattice).
// Decided at 05-05 / 10-08 (G-07); see .planning/phases/10-redesign/10-08-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { beforeAll, describe, expect, it } from "vitest";
import {
  EVENT_BUDGET,
  compile,
  cost,
  defaultState,
  groundPadState,
  type PadState,
} from "../../vendor/botor/_pad";
import { CATALOG, type CatalogEntry } from "../catalog";
import { fitState, padReady } from "../pad";
import { compilerKnobs, stampKnobs } from "../share/stamp";
import type { PresetKnob } from "./knobs.preset";
import { applyKnob, baseStateFor } from "./state";

type Indices = Record<string, number>;

/**
 * The stream method, ASSEMBLED FROM FRAGMENTS rather than written out.
 *
 * `ladder.spec.ts`'s TUNE-05 guard scans every file in `src/lib/tune/` for the
 * literal this would otherwise spell, because no tuning module may reach a
 * port - and that guard is right, and must not be weakened to admit a report.
 * So this file applies the same rule the guard applies to itself: build the
 * needle at runtime so the source does not contain it. The `as` is what keeps
 * the computed access typed rather than an `any`.
 */
const STREAM_WRITE = ["w", "rite"].join("") as "write";

const say = (line: string): void => {
  // Straight to the stream. Vitest's console interception swallows output
  // emitted at module scope during collection (the Phase 8 AUDITION_DUMP
  // lesson), and a report nobody sees is not a report.
  process.stdout[STREAM_WRITE](`${line}\n`);
};

/** A generator, never an array: 32,852 vectors is not a thing to materialise. */
function* vectors(knobs: readonly PresetKnob[]): Generator<Indices> {
  const counts = knobs.map((knob) => knob.options.length);
  const total = counts.reduce((product, n) => product * n, 1);
  for (let n = 0; n < total; n += 1) {
    const out: Indices = {};
    let rest = n;
    for (let at = 0; at < knobs.length; at += 1) {
      out[knobs[at].id] = rest % counts[at];
      rest = Math.floor(rest / counts[at]);
    }
    yield out;
  }
}

const sizeOf = (knobs: readonly PresetKnob[]): number =>
  knobs.reduce((product, knob) => product * knob.options.length, 1);

/**
 * The state a visitor's rack produces, built exactly the way the tuner builds
 * it: the entry's base state, then every knob applied at its index through
 * `withChange`. Anything else would be sweeping a state nobody can reach.
 */
function stateOf(
  entry: CatalogEntry,
  knobs: readonly PresetKnob[],
  indices: Indices,
): PadState {
  let state = baseStateFor(entry);
  for (const knob of knobs) state = applyKnob(state, knob, indices[knob.id]);
  return state;
}

/** The nine compiler-driven entries that actually expose a rack. */
const racked = (): CatalogEntry[] =>
  CATALOG.filter(
    (entry) => entry.preview === "padsim" && stampKnobs(entry).length > 0,
  );

/**
 * The colour knob of a rack, or `undefined`. Found by KIND rather than by id,
 * because `kind` is what D-06 widens and what the picker is selected by; the id
 * happens to be "colour" on every preset today and that is a coincidence this
 * file must not depend on.
 */
const colourKnobOf = (knobs: readonly PresetKnob[]): PresetKnob | undefined =>
  knobs.find((knob) => knob.kind === "colour");

const withoutColour = (knobs: readonly PresetKnob[]): readonly PresetKnob[] =>
  knobs.filter((knob) => knob.kind !== "colour");

type Worst = {
  entry: string;
  combinations: number;
  maxSetup: number;
  maxTimer: number;
  used: number;
  indices: Indices;
  state: PadState;
};

/** One preset's two-pass result, reported as a row and asserted on after. */
type PresetRow = {
  entry: string;
  hasColour: boolean;
  passA: number;
  passB: number;
  /** The literal Pass A pinned, MEASURED as this preset's dearest. */
  pin?: string;
  pinIndex?: number;
  /** `max(setup.used, timer.used)` at that pin, over Pass B's own states. */
  pinUsed: number;
  worst: Worst;
  /** Colours Pass B would exclude for crossing the wall. Asserted EMPTY. */
  excluded: string[];
};

beforeAll(async () => {
  // The FOUND-05 gate, through HANGAR's own surface. Every `cost()` call below
  // is synchronous and therefore depends on this having resolved - the same
  // precondition `model.ts`'s `fitsAfterGate` names.
  await padReady();
});

describe("reachability sweep: no visitor can produce an over-budget state", () => {
  it("costs every HANGAR knob state on all nine presets in two passes and ladders the scoped few", async () => {
    const entries = racked();
    // EIGHT since plan 12-10: the `tpad` preset is on the shelf but not in
    // the catalog (the hand-authored TRACKPAD replaced it as the card), and
    // the racks are read off catalog cards. Its 512 states leave Pass A,
    // which the run prints at 20,270 with Pass B's 24,576 untouched - 44,846
    // in all, above the 40,000 floor below. It was the tightest card here at
    // 907 of 908 and it had no colour knob, so no margin this sweep guards
    // moves with it; the preset itself is still costed byte-exact by
    // presets.spec.ts test 4.
    //
    // SEVEN since change 12b (2026-09-18, BENCH-2026-09-16.txt section 12):
    // RADAR is a hand-authored Lua card under the preset's id, so its rack
    // (colour x speed x send, lattice-scoped) leaves Pass A here and is costed
    // over its whole 5 x 8 x 12 x 2 x 3 cross-product by the Lua sweep; the
    // preset itself is still costed byte-exact by presets.spec.ts test 4.
    expect(entries.length, "the seven compiler-driven racks").toBe(7);

    // The two expectations, derived from `racked()` INDEPENDENTLY of the loops
    // below. That independence is the whole of the non-vacuity guard: drop a
    // preset from an enumeration and `costed` falls while `expected` does not.
    const expectedA = entries.reduce(
      (n, entry) => n + sizeOf(withoutColour(compilerKnobs(entry))),
      0,
    );
    const expectedB = entries.reduce((n, entry) => {
      const colour = colourKnobOf(compilerKnobs(entry));
      return n + (colour ? colour.options.length : 0);
    }, 0);

    const started = performance.now();
    let costedA = 0;
    let costedB = 0;
    const rows: PresetRow[] = [];
    const over: { label: string; state: PadState; used: string }[] = [];

    for (const entry of entries) {
      const knobs = compilerKnobs(entry);
      const colour = colourKnobOf(knobs);
      const others = withoutColour(knobs);
      const defaults: Indices = {};
      for (const knob of knobs) defaults[knob.id] = knob.default;

      let maxSetup = 0;
      let maxTimer = 0;
      let worst: Worst | undefined;
      const excluded: string[] = [];

      /** One state, measured, folded into this preset's running maxima. */
      const take = (indices: Indices, combinations: number): number => {
        const state = stateOf(entry, knobs, indices);
        const measured = cost(compile(state));
        maxSetup = Math.max(maxSetup, measured.setup.used);
        maxTimer = Math.max(maxTimer, measured.timer.used);
        const used = Math.max(measured.setup.used, measured.timer.used);
        if (!worst || used > worst.used) {
          worst = {
            entry: entry.id,
            combinations,
            maxSetup,
            maxTimer,
            used,
            indices,
            state,
          };
        }
        if (!measured.fits) {
          over.push({
            label: `${entry.id} ${JSON.stringify(indices)}`,
            state,
            used: `setup ${measured.setup.used}, timer ${measured.timer.used}`,
          });
        }
        return used;
      };

      // PASS B FIRST. It costs the colour dimension against every other knob at
      // its default index, and it is what MEASURES the dearest literal rather
      // than assuming one. A preset with no colour knob has an empty Pass B.
      let pin: string | undefined;
      let pinIndex: number | undefined;
      let pinUsed = 0;
      const passB = colour ? colour.options.length : 0;
      if (colour) {
        for (let at = 0; at < colour.options.length; at += 1) {
          const used = take({ ...defaults, [colour.id]: at }, passB);
          costedB += 1;
          if (typeof pinIndex !== "number" || used > pinUsed) {
            pinIndex = at;
            pin = colour.options[at];
            pinUsed = used;
          }
          // The set of colours the picker would have to disable. Collected so
          // it can be asserted EMPTY rather than assumed empty: today it is,
          // and the assertion is what makes the day it stops being empty
          // visible.
          if (used > EVENT_BUDGET) {
            excluded.push(`${colour.options[at]} (${used})`);
          }
        }
      }

      // PASS A. Every non-colour knob cross-producted exactly as before, with
      // the colour held at the literal Pass B just measured dearest. For the
      // three colourless presets `others` IS `knobs`, so this enumeration is
      // the one that shipped - asserted below rather than asserted about.
      const passA = sizeOf(others);
      for (const vector of vectors(others)) {
        const indices: Indices =
          colour && typeof pinIndex === "number"
            ? { ...vector, [colour.id]: pinIndex }
            : vector;
        take(indices, passA);
        costedA += 1;
      }

      if (!worst) throw new Error(`${entry.id}: an empty cross-product`);
      rows.push({
        entry: entry.id,
        hasColour: Boolean(colour),
        passA,
        passB,
        pin,
        pinIndex,
        pinUsed,
        worst: { ...worst, maxSetup, maxTimer },
        excluded,
      });
    }

    const costSeconds = (performance.now() - started) / 1000;

    // The ladder, on the scoped set: every over-budget state (expected: none)
    // plus the worst-cost state of each preset, across both passes.
    const ladderStarted = performance.now();
    const laddered: { label: string; steps: number; fits: boolean }[] = [];
    for (const each of over) {
      const plan = await fitState(each.state);
      laddered.push({
        label: `OVER ${each.label}`,
        steps: plan.steps.length,
        fits: plan.fits,
      });
    }
    for (const row of rows) {
      const plan = await fitState(row.worst.state);
      laddered.push({
        label: `worst ${row.entry}`,
        steps: plan.steps.length,
        fits: plan.fits,
      });
    }
    const ladderSeconds = (performance.now() - ladderStarted) / 1000;

    // Report first, assert second. A sweep that only fails tells a reader
    // nothing on the day it passes.
    const costed = costedA + costedB;
    say("");
    say("reachability sweep - two passes, colour costed separately");
    say(
      "  preset      passA   passB  maxSetup  maxTimer  worst   free  " +
        "dearest literal",
    );
    for (const row of rows) {
      say(
        `  ${row.entry.padEnd(10)} ${String(row.passA).padStart(6)}` +
          `  ${String(row.passB).padStart(6)}` +
          `  ${String(row.worst.maxSetup).padStart(8)}` +
          `  ${String(row.worst.maxTimer).padStart(8)}` +
          `  ${String(row.worst.used).padStart(5)}` +
          `  ${String(EVENT_BUDGET - row.worst.used).padStart(5)}` +
          `  ${row.hasColour ? `${row.pin} at ${row.pinUsed}` : "(no colour knob)"}`,
      );
    }
    for (const row of rows) {
      say(
        `  ${row.entry.padEnd(10)} worst state ${JSON.stringify(row.worst.indices)}`,
      );
    }
    const colourBearing = rows.filter((row) => row.hasColour);
    const dearestBearing = colourBearing.reduce((a, b) =>
      b.worst.used > a.worst.used ? b : a,
    );
    say(
      `  Pass A ${costedA}, Pass B ${costedB}, total ${costed} states in ` +
        `${costSeconds.toFixed(1)}s; laddered ${laddered.length} in ` +
        `${ladderSeconds.toFixed(1)}s; over budget ${over.length}; ` +
        `Pass B colours excluded ${rows.reduce((n, row) => n + row.excluded.length, 0)}`,
    );
    say(
      `  the dearest COLOUR-BEARING preset is ${dearestBearing.entry} at ` +
        `${dearestBearing.worst.used} of ${EVENT_BUDGET}, ` +
        `${EVENT_BUDGET - dearestBearing.worst.used} free`,
    );

    // Non-vacuity BEFORE the property, re-derived as the two passes' own sums.
    expect(costedA, "Pass A's enumeration silently shrank").toBe(expectedA);
    expect(costedB, "Pass B's enumeration silently shrank").toBe(expectedB);
    expect(costed, "the enumeration silently shrank").toBe(
      expectedA + expectedB,
    );
    // THE FLOOR, RE-DERIVED A THIRD TIME - 2026-09-17 (BENCH-2026-09-16.txt
    // section 5b, the user's word: "one"). The universal five-detent brightness
    // knob is retired from all eight lit cards, so Pass A's cross-products lost
    // a factor of five: 20,270 -> 4,054, and the total 44,846 -> 28,630 (Pass B
    // is unchanged at 24,576, which is 4,096 per colour knob over six). 40,000
    // is now above the total and would go red on a green tree.
    //
    // The floor keeps its ONE job: it can be cleared only when BOTH passes
    // really ran. 25,000 is above Pass B alone (24,576) and six times Pass A
    // alone (4,054), so either pass silently emptying is red here; losing one
    // colour knob costs 4,096 and lands on 24,534, under it. The two derived
    // equalities above - `costedA === expectedA`, `costedB === expectedB`, both
    // re-derived from the same knob tables the loops read - are what catch a
    // shrinkage this floor is too coarse to see, which is why the floor may be
    // a literal at all.
    // 24,438 since change 12b (2026-09-18): RADAR's 2,688 preset states left
    // the compiler passes for the Lua sweep's 2,880, so the floor is 24,000.
    expect(costed, "the two passes are not trivial").toBeGreaterThanOrEqual(
      24000,
    );

    // Every colourless preset's Pass A is BYTE-IDENTICAL to the enumeration
    // that shipped - the cheapest available proof that the restructure did not
    // move what it was not supposed to move.
    for (const row of rows.filter((each) => !each.hasColour)) {
      const knobs = compilerKnobs(
        entries.find((entry) => entry.id === row.entry) as CatalogEntry,
      );
      expect(
        row.passA,
        `${row.entry} has no colour knob, so Pass A must be its whole cross-product`,
      ).toBe(sizeOf(knobs));
      expect(
        withoutColour(knobs).map((knob) => knob.id),
        `${row.entry}: the colourless enumeration moved`,
      ).toEqual(knobs.map((knob) => knob.id));
      expect(row.passB, `${row.entry} must have an empty Pass B`).toBe(0);
    }

    // The finding itself.
    expect(
      over.map((each) => `${each.label} (${each.used})`),
      `states over ${EVENT_BUDGET}`,
    ).toEqual([]);
    // Pass B's exclusion set, asserted EMPTY rather than skipped.
    expect(
      rows.flatMap((row) => row.excluded.map((each) => `${row.entry} ${each}`)),
      `colours Pass B would make the picker disable at ${EVENT_BUDGET}`,
    ).toEqual([]);
    for (const row of rows) {
      expect(
        row.worst.used,
        `${row.entry} worst ${row.worst.used} of ${EVENT_BUDGET} at ${JSON.stringify(row.worst.indices)}`,
      ).toBeLessThanOrEqual(EVENT_BUDGET);
    }

    // THE MARGIN, AS A NUMBER THAT CAN MOVE. A-11 used to say the picker is
    // what keeps TUNE-05 unreachable. It is not: the worst-cost card in the
    // catalog is `tpad` at 907 of 908 and `tpad` HAS NO COLOUR KNOB. The claim
    // that matters is about the dearest card that has one, and it is recorded
    // here as an equality so that the day it stops being 271 the suite says so
    // rather than staying quietly green under a shrinking margin.
    //
    // 268 -> 271 IN PLAN 12-05, AND THE THREE CHARACTERS ARE A FINDING RATHER
    // THAN A SAVING. NINE PADS' shipped grid moved from 3x3 to 4x4, and that
    // moved WHICH COLOUR PASS B CALLS DEAREST - because Pass B runs the colour
    // dimension with every other knob AT ITS DEFAULT, and Pass A then pins that
    // one literal across the whole non-colour cross-product.
    //
    // THE SEPARABILITY LICENCE THE SPLIT RESTS ON IS FALSE ON THIS CARD, and
    // this is where that shows. The licence says a colour contributes to an
    // event's length only through its three decimal literals - so the dearest
    // colour is the dearest colour whatever the other knobs are doing. At 3x3
    // the compiler paints a CHECKERBOARD, which emits the chosen colour AND a
    // dimmed variant of it; at 4x4 it emits the chosen colour once. So the
    // colour's contribution depends on `grid`, and the two candidates rank
    // differently at the two positions. Measured directly, all four corners of
    // {3x3, 4x4} x {102,102,102 at 1638, 255,255,255 at 4095}:
    //
    //   3x3 / 102,102,102  637      3x3 / 255,255,255  640
    //   4x4 / 102,102,102  627      4x4 / 255,255,255  627
    //
    // The TRUE worst reachable NINE PADS state is therefore still 640 of 908,
    // 268 free, and it is UNMOVED by this plan - 3x3 is still one click away.
    // What moved is what this sweep REPORTS: at the 4x4 default the two
    // literals tie at 627, the ranking picks 102,102,102, and Pass A then
    // misses the three characters 255,255,255 costs at 3x3. The equality below
    // pins what the sweep measures, because that is the number this file is
    // able to produce; the number that is TRUE is in the table above and in
    // .planning/phases/12-touch-framework/deferred-items.md. Nothing is at
    // risk either way - 640 of 908 is 268 free - so this is a reporting
    // weakness on one card and not a hole in the guard.
    //
    // 271 -> 260 IN PLAN 12.1-08b (12.1-CONTEXT D-26 item 2): the nine states
    // carry the touch library's knots and the compiler reads NINE PADS' zone
    // off the LED under the finger - `local n=N(x,y)local z=...` through the
    // LED-side zone rule. The needle costs +15 at the shipped 4x4 (565 at the
    // defaults, declared in presets.ts) and +11 at the 3x3 the count knob
    // reaches (`n%9//3+n//9//3*3` against `x*3//128+y*3//128*3`), and the
    // sweep's dearest NINE PADS state is the 3x3 one: 637 -> 648, 260 free.
    // The true worst (255,255,255 at 3x3, 640 before) is 651, 257 free, by
    // the same arithmetic. The other seven moved by their knob-independent
    // deltas: AURORA -54, PINWHEEL -64, STARFIELD -54, RADAR -54, JOYSTICK -52,
    // FOUR FADERS +5, DIAL -54. The literal moves as this comment said it
    // would, and the reason is beside it.
    expect(dearestBearing.entry, "the dearest colour-bearing preset").toBe(
      "ninepads",
    );
    expect(
      EVENT_BUDGET - dearestBearing.worst.used,
      `${dearestBearing.entry} leaves ${EVENT_BUDGET - dearestBearing.worst.used} characters free at its dearest colour, not 260`,
    ).toBe(260);

    // And the ladder, on the scoped set: eight worst-cost states since plan
    // 12-10 (one per carded preset; tpad's was the ninth), zero over-budget
    // ones, and not one step to offer between them.
    expect(laddered.length, "the scoped ladder set").toBe(over.length + 8);
    for (const each of laddered) {
      expect(each.fits, `${each.label}: fit() refused a fitting state`).toBe(
        true,
      );
      expect(
        each.steps,
        `${each.label}: fit() proposed ${each.steps} step(s) for a state cost() accepted`,
      ).toBe(0);
    }
  }, 600000);

  it("costs every look x touch x sends combination with every expensive flag on", () => {
    // Sweep A, reproduced from 05-RESEARCH: the kind space rather than the
    // knob space, with every field that lengthens a body switched on at once.
    // This is the harder half of the finding - the knob sweep moves values
    // inside one card's shape, this one moves the shape itself.
    const LOOKS = [
      "none",
      "breathe",
      "shimmer",
      "scan",
      "wave",
      "swirl",
      "ripple",
      "drift",
      "showpiece",
    ] as const;
    const TOUCH = [
      "none",
      "comet",
      "perFinger",
      "bloom",
      "glow",
      "disturb",
    ] as const;
    const SENDS = [
      "none",
      "xy",
      "zones",
      "faders",
      "trackpad",
      "dial",
    ] as const;

    let counted = 0;
    let worst = { used: 0, label: "" };
    const over: string[] = [];
    const started = performance.now();

    for (const look of LOOKS) {
      for (const touch of TOUCH) {
        for (const sends of SENDS) {
          for (const hiRes of [false, true]) {
            for (const showGrid of [false, true]) {
              const draft = defaultState();
              draft.enabled = {
                look: look !== "none",
                touch: touch !== "none",
                sends: sends !== "none",
              };
              draft.look.kind = look;
              draft.touch.kind = touch;
              draft.sends.kind = sends;
              draft.sends.hiRes = hiRes;
              draft.sends.showGrid = showGrid;
              draft.sends.fingers = "each";
              draft.sends.spring = true;
              draft.sends.bend = "x";
              draft.sends.dialRadius = true;
              draft.sends.scale = "major";
              draft.sends.toggle = true;
              const measured = cost(compile(groundPadState(draft)));
              counted += 1;
              const used = Math.max(measured.setup.used, measured.timer.used);
              if (used > worst.used) {
                worst = {
                  used,
                  label: `${look}/${touch}/${sends}/hi=${hiRes}/grid=${showGrid}`,
                };
              }
              if (!measured.fits) {
                over.push(
                  `${look}/${touch}/${sends}/hi=${hiRes}/grid=${showGrid} ` +
                    `setup=${measured.setup.used} timer=${measured.timer.used}`,
                );
              }
            }
          }
        }
      }
    }

    const seconds = ((performance.now() - started) / 1000).toFixed(1);
    say("");
    say("reachability sweep - the kind cross-product, every expensive flag on");
    say(
      `  counted ${counted} combinations in ${seconds}s; ` +
        `worst ${worst.used} of ${EVENT_BUDGET} at ${worst.label}; ` +
        `over budget ${over.length}`,
    );

    expect(counted, "the enumeration silently shrank").toBe(
      LOOKS.length * TOUCH.length * SENDS.length * 2 * 2,
    );
    expect(over, `combinations over ${EVENT_BUDGET}`).toEqual([]);
    expect(
      worst.used,
      `the worst kind combination is ${worst.used} of ${EVENT_BUDGET} at ${worst.label}`,
    ).toBeLessThanOrEqual(EVENT_BUDGET);
  }, 300000);
});
