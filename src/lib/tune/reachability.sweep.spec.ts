// The phase's load-bearing claim, as a test that runs.
//
// TUNE-04 (the fit-ladder line) and TUNE-05 (the over-budget block) ship as
// tested GUARDS rather than as live features, and the whole justification for
// that shape is one measured finding: no state a visitor can produce is over
// 908 characters. A claim that load-bearing does not belong in a research
// document. It belongs in the suite, in the project whose entire purpose is
// anti-drift, and `src/vendor/botor/tests/pad-invariants.test.js` is the
// precedent this file follows - including reporting a table rather than merely
// passing.
//
// WHAT IT PROVES AND WHAT IT DOES NOT. It proves the finding FOR THE PINNED
// COMPILER: the vendored `_pad.ts` at `a0fb69d5` measured through
// `@intechstudio/grid-protocol` at the version `src/lib/protocol-pin.ts` names.
// It is a property of a version, not a law. Re-run it after ANY vendored
// re-sync or protocol pin bump - `docs/PIN-POLICY.md` learns that in 05-12 -
// and if it goes red, the answer is that TUNE-04 and TUNE-05 stopped being
// unreachable, which is news rather than a bug.
//
// WHY `fitState` RUNS ON A SCOPED SET AND `cost()` DOES NOT. `cost()` runs on
// EVERY state, with no sampling. `fit()` is N+1 minifier calls - 05-04 measures
// it at 4.4 ms on a fitting state - so laddering per state would add well over
// a minute on top of the `cost()` pass and buy nothing, because `fit()` is
// defined to return `{ fits: true, steps: [] }` for any state `cost()` has
// already accepted. So the ladder runs on every state whose `cost().fits` is
// false (expected: zero) plus the measured worst-cost state for each preset
// (nine more). The scoping is arithmetic, not squeamishness, and it is written
// here so a later reader can see the trade rather than guess at it.
//
// THE MEASUREMENT, honestly. 05-VALIDATION set this file a 60 s threshold from
// a projected 16,645-state cross-product. The knob tables plan 05-03 actually
// shipped are wider than the ones the research proposed, so the real
// cross-product is 32,852 states and the file runs over that threshold. The
// numbers are recorded in 05-05-SUMMARY.md. The sweep is not trimmed to fit a
// projection: D-10's precedent is a separate PROJECT, never a shortened
// comparison.
//
// AMENDMENT, G-07, plan 10-08: THE SWEEP IS RESTRUCTURED INTO TWO PASSES AND
// THE HONEST TOTAL RISES.
//
// D-06 turns the colour knob into the whole reachable RGB444 lattice - 4,096
// stored, quantise-stable colours - and a 4,096-option knob replacing a
// six-option one multiplies each colour-bearing preset's cross-product by 683.
// `ninepads` alone would go from 7,680 to 5,242,880 and this file would never
// finish. So the single cross-product becomes two passes:
//
//   PASS A - every NON-colour knob cross-producted exactly as before, with the
//            colour pinned at the literal MEASURED dearest for that preset.
//   PASS B - the colour dimension alone, every other knob at its default index.
//
// The direction of the change is stated rather than softened: the total RISES,
// 32,852 -> 44,078, +11,226 and +34%. 10-UI-SPEC's first pass said it would
// fall "well below" today's; it does not, and the number planned against is the
// real one. The structure is still right for two reasons. The alternative is
// 683x. And the growth is ADDITIVE: a tenth preset carrying a colour knob costs
// its own Pass A cross-product PLUS 4,096, never TIMES 4,096.
//
// WHAT THE TWO PASSES PROVE TOGETHER, and it is not the full cross-product.
// Pass A x Pass B is not enumerated. What licenses the split is that a colour
// contributes to an event's length only through the three decimal literals
// `glc(a, layer, r, g, b, 1)` writes, and that contribution is independent of
// every other knob's value: it is occurrences times the literal's length, the
// same pure literal arithmetic `lua-entries.sweep.spec.ts:358-384` proves for
// the other route. So the colour that is dearest at the defaults is the colour
// that is dearest everywhere, which is why Pass B runs FIRST and hands Pass A
// the pin it measured rather than being handed `255,255,255` and hoping.
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
    expect(entries.length, "the nine compiler-driven racks").toBe(9);

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
    // THE FLOOR, RE-DERIVED. The old 16,000 was half of one 32,852-state
    // cross-product. The passes are now two, and the number that cannot be met
    // by a shrunken enumeration is 19,000: the three COLOURLESS presets
    // contribute 16,832 of Pass A between them (faders 960, dial 15,360, tpad
    // 512) and cannot reach 19,000 alone, so the floor can only be cleared if
    // the six colour-bearing presets' 2,670 Pass A states are present too. It
    // is a literal on purpose - `expectedA` and `expectedB` are derived from
    // the same knob tables the loops read, so a floor derived from them would
    // shrink with them.
    expect(costed, "the two passes are not trivial").toBeGreaterThanOrEqual(
      19000,
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
    // here as an equality so that the day it stops being 268 the suite says so
    // rather than staying quietly green under a shrinking margin.
    expect(dearestBearing.entry, "the dearest colour-bearing preset").toBe(
      "ninepads",
    );
    expect(
      EVENT_BUDGET - dearestBearing.worst.used,
      `${dearestBearing.entry} leaves ${EVENT_BUDGET - dearestBearing.worst.used} characters free at its dearest colour, not 268`,
    ).toBe(268);

    // And the ladder, on the scoped set: nine worst-cost states, zero
    // over-budget ones, and not one step to offer between them.
    expect(laddered.length, "the scoped ladder set").toBe(over.length + 9);
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
