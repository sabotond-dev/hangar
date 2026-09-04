// SURPRISE ME as a property, not a demo (TUNE-07).
//
// TEST 1 IS THE WHOLE FILE. Two thousand draws for every compiler-driven entry,
// each one compiled and costed with the pinned minifier, every one inside 908.
// The assertion counts the draws first, so a roll that silently produced
// nothing cannot pass it.
//
// WHY THE COSTS ARE MEMOISED BY INDEX VECTOR. Two draws with the same index
// vector are the same `PadState` and therefore the same compile and the same
// cost; compiling one twice proves nothing and costs another 2 ms. The DRAW
// count is unaffected and is asserted separately - every draw is checked, and
// every DISTINCT draw is measured. Both numbers are recorded in the SUMMARY.
//
// THE INJECTED `fits` IS WHAT MAKES THE BOUND REACHABLE. Measured, the roll
// never loops: nothing this compiler can produce is over 908. A test that
// waited for a real over-budget draw would wait forever, so test 4 hands the
// roll a predicate that always refuses and watches it stop.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { beforeAll, describe, expect, it } from "vitest";
import {
  compile as vendorCompile,
  cost as vendorCost,
  fit as vendorFit,
  fits as vendorFits,
  type PadReserved,
} from "../../vendor/botor/_pad";
import { CATALOG, byId, type CatalogEntry } from "../catalog";
import { padReady } from "../pad";
import { luaKnobs } from "./knobs.lua";
import { presetKnobs, type KnobDescriptor } from "./knobs.preset";
import { applyKnob, baseStateFor, resetAll } from "./state";
import { SURPRISE_ROLL_LIMIT, surpriseIndices } from "./surprise";

/** The property's draw count, per compiler-driven entry. */
const DRAWS = 2000;

/**
 * The reserve that puts `dial` genuinely over 908 - measured, see
 * ladder.spec.ts. It is how test 4 reaches a state whose only way back inside
 * the budget is the ladder.
 */
const OVER_RESERVE: PadReserved = { setup: 300, timer: 0 };

const compilerEntries = (): readonly CatalogEntry[] =>
  CATALOG.filter(
    (entry) => entry.preview === "padsim" && entry.source.kind === "preset",
  );

function mustEntry(id: string): CatalogEntry {
  const entry = byId(id);
  if (!entry) throw new Error(`no catalog entry: ${id}`);
  return entry;
}

const knobsOf = (entry: CatalogEntry) =>
  entry.source.kind === "preset" ? presetKnobs(entry.source.presetId) : [];

const defaultsOf = (knobs: readonly KnobDescriptor[]) =>
  Object.fromEntries(knobs.map((knob) => [knob.id, knob.default]));

const keyOf = (
  knobs: readonly KnobDescriptor[],
  indices: Readonly<Record<string, number>>,
) => knobs.map((knob) => indices[knob.id]).join(",");

/** A deterministic rng: the scripted numbers first, then the last one forever. */
function scripted(values: readonly number[]): () => number {
  let at = 0;
  return () => values[Math.min(at++, values.length - 1)];
}

describe("SURPRISE ME never lands over budget (TUNE-07)", () => {
  beforeAll(async () => {
    await padReady();
  });

  it("two thousand draws per compiler-driven entry, every one inside 908", () => {
    const entries = compilerEntries();
    expect(entries.length, "no compiler-driven entry was read").toBe(9);

    let draws = 0;
    let distinct = 0;
    let rerolls = 0;
    const offenders: string[] = [];

    for (const entry of entries) {
      const knobs = knobsOf(entry);
      const measured = new Map<string, boolean>();
      const fitsAt = (indices: Record<string, number>): boolean => {
        const key = keyOf(knobs, indices);
        const known = measured.get(key);
        if (typeof known === "boolean") return known;
        distinct++;
        let state = baseStateFor(entry);
        for (const knob of knobs)
          state = applyKnob(state, knob, indices[knob.id]);
        const answer = vendorFits(vendorCompile(state));
        measured.set(key, answer);
        return answer;
      };

      let indices: Record<string, number> = defaultsOf(knobs);
      let entryDraws = 0;
      for (let draw = 0; draw < DRAWS; draw++) {
        let calls = 0;
        indices = surpriseIndices(knobs, indices, (candidate) => {
          calls++;
          return fitsAt(candidate);
        });
        entryDraws++;
        rerolls += Math.max(0, calls - 1);
        if (!fitsAt(indices))
          offenders.push(`${entry.id} ${keyOf(knobs, indices)}`);
      }
      expect(entryDraws, `${entry.id} was not drawn ${DRAWS} times`).toBe(
        DRAWS,
      );
      draws += entryDraws;
    }

    // Counted BEFORE the property is asserted, so a roll that produced nothing
    // cannot pass this test on an empty offender list.
    expect(draws, "the property ran on fewer draws than it claims").toBe(
      DRAWS * entries.length,
    );
    expect(distinct, "no state was ever actually compiled").toBeGreaterThan(0);
    expect(
      offenders,
      "SURPRISE ME produced an over-budget configuration",
    ).toEqual([]);
    // Recorded rather than asserted at a value: the expected number is zero and
    // a non-zero one is a finding about the compiler, not a failure here.
    expect(rerolls, "the re-roll count is a number").toBeGreaterThanOrEqual(0);
    // MEASURED, 2026-09-04: 18,000 draws, about 9,700 distinct states compiled and
    // costed, 0 re-rolls, 24 s wall time. The timeout is generous because this
    // is a real property run over the real minifier, not because it is slow by
    // accident - see the SUMMARY, which carries the number.
  }, 180_000);

  it("a draw that repeats the state it replaced is rejected and rolled again", () => {
    const knobs = knobsOf(mustEntry("aurora"));
    expect(knobs.length, "aurora has knobs to draw").toBeGreaterThan(2);

    // Every knob at position 0, and an rng that draws position 0 on its first
    // pass and the last position on its second. The first draw is the state we
    // are already in, so it must never reach `fits`.
    const previous = Object.fromEntries(knobs.map((knob) => [knob.id, 0]));
    const rng = scripted([...knobs.map(() => 0), 0.999999]);
    let asked = 0;
    const drawn = surpriseIndices(
      knobs,
      previous,
      () => {
        asked++;
        return true;
      },
      rng,
    );

    expect(
      asked,
      "the identical draw was offered to fits instead of rejected",
    ).toBe(1);
    expect(keyOf(knobs, drawn)).not.toBe(keyOf(knobs, previous));
    for (const knob of knobs) {
      expect(drawn[knob.id]).toBe(knob.options.length - 1);
    }
  });

  it("a Lua entry fits by construction, so its roll is one pass", () => {
    const entry = mustEntry("euclid");
    const knobs = luaKnobs(entry);
    expect(knobs.length, "euclid has token knobs").toBeGreaterThan(2);

    let indices = defaultsOf(knobs);
    let passes = 0;
    for (let draw = 0; draw < 200; draw++) {
      let calls = 0;
      indices = surpriseIndices(knobs, indices, () => {
        calls++;
        return true;
      });
      passes += calls;
      for (const knob of knobs) {
        expect(
          indices[knob.id],
          `${knob.id} drew a position outside its own values`,
        ).toBeGreaterThanOrEqual(0);
        expect(indices[knob.id]).toBeLessThan(knob.options.length);
      }
    }
    expect(passes, "a Lua entry re-rolled a draw that already fits").toBe(200);
  });

  it("a compiler that always refuses stops at the bound and leaves the ladder a state to resolve", () => {
    const entry = mustEntry("dial");
    const knobs = knobsOf(entry);
    const previous = defaultsOf(knobs);
    let asked = 0;
    const drawn = surpriseIndices(
      knobs,
      previous,
      () => {
        asked++;
        return false;
      },
      scripted([0.5]),
    );

    expect(asked, "the roll did not stop at its own bound").toBe(
      SURPRISE_ROLL_LIMIT,
    );
    // Exhaustion is signalled by handing the previous indices back unchanged.
    // The ladder fallback is the CALLER's job, in model.ts, which is the half
    // that has fitState - stated in both files so neither grows the other's.
    expect(keyOf(knobs, drawn), "exhaustion did not hand the state back").toBe(
      keyOf(knobs, previous),
    );

    // And the fallback the caller reaches for really does resolve: with a real
    // reserve this state is over 908, and the compiler's own ladder lands it
    // back inside.
    const state = resetAll(entry);
    expect(vendorFits(vendorCompile(state), OVER_RESERVE)).toBe(false);
    const plan = vendorFit(state, { reserved: OVER_RESERVE });
    expect(plan.fits, "the ladder could not resolve the fallback state").toBe(
      true,
    );
    expect(
      plan.resolved,
      "a resolved plan carries the state it resolved to",
    ).toBeDefined();
    expect(
      vendorCost(vendorCompile(plan.resolved!), OVER_RESERVE).fits,
      "the ladder-resolved state is still over budget",
    ).toBe(true);
  });
});
