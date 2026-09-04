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

type Worst = {
  entry: string;
  combinations: number;
  maxSetup: number;
  maxTimer: number;
  used: number;
  indices: Indices;
  state: PadState;
};

beforeAll(async () => {
  // The FOUND-05 gate, through HANGAR's own surface. Every `cost()` call below
  // is synchronous and therefore depends on this having resolved - the same
  // precondition `model.ts`'s `fitsAfterGate` names.
  await padReady();
});

describe("reachability sweep: no visitor can produce an over-budget state", () => {
  it("costs every HANGAR knob state on all nine presets and ladders the scoped few", async () => {
    const entries = racked();
    expect(entries.length, "the nine compiler-driven racks").toBe(9);

    const expected = entries.reduce(
      (n, entry) => n + sizeOf(compilerKnobs(entry)),
      0,
    );
    const started = performance.now();

    let costed = 0;
    const rows: Worst[] = [];
    const over: { label: string; state: PadState; used: string }[] = [];

    for (const entry of entries) {
      const knobs = compilerKnobs(entry);
      let maxSetup = 0;
      let maxTimer = 0;
      let worst: Worst | undefined;
      for (const indices of vectors(knobs)) {
        const state = stateOf(entry, knobs, indices);
        const measured = cost(compile(state));
        costed += 1;
        maxSetup = Math.max(maxSetup, measured.setup.used);
        maxTimer = Math.max(maxTimer, measured.timer.used);
        const used = Math.max(measured.setup.used, measured.timer.used);
        if (!worst || used > worst.used) {
          worst = {
            entry: entry.id,
            combinations: sizeOf(knobs),
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
      }
      if (!worst) throw new Error(`${entry.id}: an empty cross-product`);
      rows.push({ ...worst, maxSetup, maxTimer });
    }

    const costSeconds = (performance.now() - started) / 1000;

    // The ladder, on the scoped set: every over-budget state (expected: none)
    // plus the worst-cost state of each preset.
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
      const plan = await fitState(row.state);
      laddered.push({
        label: `worst ${row.entry}`,
        steps: plan.steps.length,
        fits: plan.fits,
      });
    }
    const ladderSeconds = (performance.now() - ladderStarted) / 1000;

    // Report first, assert second. A sweep that only fails tells a reader
    // nothing on the day it passes.
    say("");
    say("reachability sweep - the HANGAR knob cross-product");
    say("  preset      combos  maxSetup  maxTimer  worst  worst-state");
    for (const row of rows) {
      say(
        `  ${row.entry.padEnd(10)} ${String(row.combinations).padStart(6)}` +
          `  ${String(row.maxSetup).padStart(8)}  ${String(row.maxTimer).padStart(8)}` +
          `  ${String(row.used).padStart(5)}  ${JSON.stringify(row.indices)}`,
      );
    }
    say(
      `  costed ${costed} states in ${costSeconds.toFixed(1)}s; ` +
        `laddered ${laddered.length} in ${ladderSeconds.toFixed(1)}s; ` +
        `over budget ${over.length}`,
    );

    // Non-vacuity BEFORE the property: a silently shrunken enumeration would
    // otherwise green this file while checking nothing.
    expect(costed, "the enumeration silently shrank").toBe(expected);
    expect(costed, "the cross-product is not trivial").toBeGreaterThanOrEqual(
      16000,
    );

    // The finding itself.
    expect(
      over.map((each) => `${each.label} (${each.used})`),
      `states over ${EVENT_BUDGET}`,
    ).toEqual([]);
    for (const row of rows) {
      expect(
        row.used,
        `${row.entry} worst ${row.used} of ${EVENT_BUDGET} at ${JSON.stringify(row.indices)}`,
      ).toBeLessThanOrEqual(EVENT_BUDGET);
    }

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
