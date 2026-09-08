// MIX TWO's crossover as a property, not a demo (TUNE-04, T4).
//
// TEST 1 IS THE WHOLE FILE, and it is surprise.spec.ts's shape deliberately:
// many SEEDED runs over every entry that declares knobs, with the run count
// asserted BEFORE the property so a walk that produced nothing cannot pass on
// an empty offender list. What it proves is the three things the plan claims
// and a component cannot demonstrate by being looked at:
//
//   1. every child's every index is componentwise inside its knob's own
//      options - which is what "zero new reachable states" MEANS at this
//      level, and the sweep proves the same thing again from the other end;
//   2. a held knob's index is `a`'s, in every child, always - never crossed
//      and never mutated (T1, 10-UI-SPEC 11.5);
//   3. every unheld index is `a`'s or `b`'s except AT MOST ONE mutated
//      position per child.
//
// "AT MOST ONE" RATHER THAN "EXACTLY ONE", and the difference is a real
// behaviour rather than a hedge. The mutation is a `surpriseIndices` draw, and
// that function rejects a draw reproducing the position it replaced; on a
// two-option knob standing at one of them it can burn its whole twelve-draw
// bound and hand the indices back unchanged. The child is then pure crossover.
// surprise.spec.ts's fifth test owns that path; this one only has to not claim
// the opposite.
//
// NO COMPILER, NO FORMATTER, NO padReady(). This module never compiles and
// never measures - the sweep does that, over the same space - so the suite
// needs none of the 628 KB of WASM. The 08-03 precedent, and knobs.preset.ts's
// descriptors need none of it either.
//
// THE RNG IS SEEDED AND WRITTEN OUT HERE rather than imported: `mixIndices`
// takes `rng` with NO default, which is the stricter half of the "no
// Math.random in a component" rule, and this file is where the strictness pays
// for itself.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { CATALOG, byId, type CatalogEntry } from "../catalog";
import { luaKnobs } from "./knobs.lua";
import { presetKnobs, type KnobDescriptor } from "./knobs.preset";
import { MIX_CHILDREN, mixIndices } from "./mix";

/** Seeded runs per entry. Every one is a fresh a, b and held set. */
const RUNS = 250;

/**
 * mulberry32: eleven lines, no dependency, and the same sequence on every
 * machine. Determinism is the point - a red run here is reproducible from the
 * seed printed in its own message.
 */
function seeded(seed: number): () => number {
  let at = seed >>> 0;
  return () => {
    at = (at + 0x6d2b79f5) >>> 0;
    let t = at;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Both routes, in one shape. The panel cannot tell them apart and nor can this. */
const knobsOf = (entry: CatalogEntry): readonly KnobDescriptor[] =>
  entry.preview === "padsim" && entry.source.kind === "preset"
    ? presetKnobs(entry.source.presetId)
    : luaKnobs(entry);

const withKnobs = (): readonly CatalogEntry[] =>
  CATALOG.filter((entry) => knobsOf(entry).length > 0);

function mustEntry(id: string): CatalogEntry {
  const entry = byId(id);
  if (!entry) throw new Error(`no catalog entry: ${id}`);
  return entry;
}

const defaultsOf = (knobs: readonly KnobDescriptor[]) =>
  Object.fromEntries(knobs.map((knob) => [knob.id, knob.default]));

/** A random-but-seeded index vector: every knob somewhere it can stand. */
const vectorOf = (knobs: readonly KnobDescriptor[], rng: () => number) =>
  Object.fromEntries(
    knobs.map((knob) => [
      knob.id,
      Math.min(
        knob.options.length - 1,
        Math.floor(rng() * knob.options.length),
      ),
    ]),
  );

describe("MIX TWO crosses two candidates and invents nothing (TUNE-04)", () => {
  it("every child is in range, every held knob is untouched, and at most one position is redrawn", () => {
    const entries = withKnobs();
    expect(
      entries.length,
      "no entry with knobs was read - the walk found nothing to cross",
    ).toBeGreaterThan(9);

    let runs = 0;
    let childrenSeen = 0;
    let heldKnobsSeen = 0;
    let mutations = 0;
    const outOfRange: string[] = [];
    const crossedHeld: string[] = [];
    const invented: string[] = [];
    const tooManyRedraws: string[] = [];

    for (const entry of entries) {
      const knobs = knobsOf(entry);
      for (let run = 0; run < RUNS; run++) {
        const rng = seeded(run * 7919 + entry.id.length * 104729 + 1);
        const a = vectorOf(knobs, rng);
        const b = vectorOf(knobs, rng);
        // A seeded held set: every knob independently, so a run sees none
        // held, some held and - rarely, and on the one-knob entries often -
        // all of them.
        const held = new Set(
          knobs.filter(() => rng() < 0.35).map((knob) => knob.id),
        );
        heldKnobsSeen += held.size;

        const children = mixIndices(a, b, held, knobs, rng);
        runs++;
        expect(
          children.length,
          `${entry.id} run ${run} produced ${children.length} results rather than ${MIX_CHILDREN}`,
        ).toBe(MIX_CHILDREN);

        for (const [n, child] of children.entries()) {
          childrenSeen++;
          let redrawn = 0;
          for (const knob of knobs) {
            const at = child[knob.id];
            const where = `${entry.id} run ${run} result ${n} knob ${knob.id}`;

            if (!Number.isInteger(at) || at < 0 || at >= knob.options.length) {
              outOfRange.push(
                `${where} stands at ${at} of ${knob.options.length}`,
              );
              continue;
            }
            if (held.has(knob.id)) {
              // The claim T1 is FOR: a lock a visitor set is a lock they keep.
              if (at !== a[knob.id]) {
                crossedHeld.push(`${where} moved from ${a[knob.id]} to ${at}`);
              }
              continue;
            }
            if (at !== a[knob.id] && at !== b[knob.id]) redrawn++;
          }
          mutations += redrawn;
          if (redrawn > 1) {
            tooManyRedraws.push(
              `${entry.id} run ${run} result ${n} redrew ${redrawn} knobs`,
            );
          }
          // Every id the child carries is a knob of this entry, and every knob
          // of this entry is in the child. A vector missing a key is a state
          // the rack cannot render.
          const ids = Object.keys(child).sort().join(",");
          const expected = knobs
            .map((knob) => knob.id)
            .sort()
            .join(",");
          if (ids !== expected) invented.push(`${entry.id} run ${run}: ${ids}`);
        }
      }
    }

    // COUNTED FIRST. A property asserted on an empty walk is a property
    // asserted about nothing, and every list below would be empty for that
    // reason rather than for the right one.
    expect(runs, "the property ran on fewer runs than it claims").toBe(
      RUNS * entries.length,
    );
    expect(childrenSeen, "no result was ever inspected").toBe(
      runs * MIX_CHILDREN,
    );
    expect(
      heldKnobsSeen,
      "no knob was ever held, so the held-knob half of this test proved nothing",
    ).toBeGreaterThan(0);
    expect(
      mutations,
      "not one result carried a redrawn position, so the mutation never ran",
    ).toBeGreaterThan(0);

    expect(
      outOfRange.slice(0, 5),
      `a result stands at a position its knob does not have. Every child is supposed to be a point in the space reachability.sweep.spec.ts already covers, so this is the failure that would move 10-08's totals (${outOfRange.length} in all)`,
    ).toEqual([]);
    expect(
      crossedHeld.slice(0, 5),
      `a HELD knob was crossed or redrawn. T1 (10-UI-SPEC 11.5) is what makes MIX TWO behave the way a person expects - lock the colour you love, mix everything else - and a held knob takes THIS ONE's position unchanged (${crossedHeld.length} in all)`,
    ).toEqual([]);
    expect(
      tooManyRedraws.slice(0, 5),
      `a result redrew more than one knob. The mutation is ONE surpriseIndices draw on ONE unheld knob; more than one is a second randomiser (${tooManyRedraws.length} in all)`,
    ).toEqual([]);
    expect(
      invented.slice(0, 5),
      `a result's knob set is not the entry's own (${invented.length} in all)`,
    ).toEqual([]);

    // The run count, printed rather than only asserted, because the plan asks
    // for the property to be visibly a property. MEASURED, 2026-09-08: every
    // one of the catalog's 36 entries declares knobs, 250 seeded runs each -
    // 9,000 runs, 36,000 results and 27,894 redrawn positions, in 0.18 s.
    console.log(
      `mix: ${runs} seeded runs over ${entries.length} entries, ${childrenSeen} results, ${mutations} redrawn positions`,
    );
  });

  it("the degenerate and boundary cases: every knob held, a equal to b, one knob, and a two-option knob", () => {
    // ---- EVERY KNOB HELD. Nothing to cross and nothing to redraw, so all
    // four results are THIS ONE. Asserted rather than left to happen: it is
    // the case a caller has to disable the control for, and a silent four
    // copies of the current state would be a button that appears to work.
    const aurora = mustEntry("aurora");
    const knobs = knobsOf(aurora);
    expect(knobs.length, "aurora has knobs to hold").toBeGreaterThan(2);

    const a = defaultsOf(knobs);
    const b = Object.fromEntries(
      knobs.map((knob) => [knob.id, knob.options.length - 1]),
    );
    const everyKnob = new Set(knobs.map((knob) => knob.id));
    let drawsWhileHeld = 0;
    const stuck = mixIndices(a, b, everyKnob, knobs, () => {
      drawsWhileHeld++;
      return 0.5;
    });
    expect(stuck.length).toBe(MIX_CHILDREN);
    for (const child of stuck) {
      expect(
        child,
        "a fully-held mix produced something other than the configuration on the screen",
      ).toEqual(a);
    }
    // AND IT COSTS NO RANDOMNESS AT ALL. Every knob held means no coin to
    // flip and no knob to choose, so the rng is never reached - the same
    // shape surpriseIndices takes when every knob is held.
    expect(
      drawsWhileHeld,
      "a fully-held mix still drew from the rng, so something unheld was crossed",
    ).toBe(0);

    // ---- a EQUAL TO b. The coin cannot matter, so every result is that
    // vector except at the one redrawn knob. This is what "half from each" is
    // when both halves are the same.
    const same = mixIndices(a, a, new Set(), knobs, seeded(11));
    for (const child of same) {
      const moved = knobs.filter((knob) => child[knob.id] !== a[knob.id]);
      expect(
        moved.length,
        `identical candidates produced ${moved.length} differences, and at most one knob is redrawn`,
      ).toBeLessThanOrEqual(1);
      for (const knob of knobs) {
        expect(child[knob.id]).toBeGreaterThanOrEqual(0);
        expect(child[knob.id]).toBeLessThan(knob.options.length);
      }
    }

    // ---- A SINGLE-KNOB ENTRY, AND IT IS SYNTHETIC BECAUSE THE CATALOG HAS
    // NONE. Measured here rather than assumed: the thinnest rack on the shelf
    // carries THREE knobs, which is D-01's floor - starfield and the faders
    // declare two of their own and knobs.preset.ts adds the universal
    // brightness knob to reach it. So the one-knob rack is a descriptor
    // written out below, and the catalog's own minimum is asserted beside it,
    // so the day an entry arrives with one knob this comment is red rather
    // than merely stale.
    const thinnest = Math.min(...withKnobs().map((e) => knobsOf(e).length));
    expect(
      thinnest,
      "an entry now declares one knob, so this case can be driven from the catalog instead of from a synthetic rack",
    ).toBe(3);

    const one: readonly KnobDescriptor[] = [
      {
        id: "only",
        label: "Only",
        kind: "amount",
        options: ["1", "2", "3", "4"],
        default: 0,
      },
    ];
    const from = defaultsOf(one);
    const to = { only: 3 };
    const children = mixIndices(from, to, new Set(), one, seeded(3));
    expect(children.length).toBe(MIX_CHILDREN);
    for (const child of children) {
      expect(child.only, "the only knob left its own options").toBeLessThan(
        one[0].options.length,
      );
      expect(child.only).toBeGreaterThanOrEqual(0);
    }
    // With one knob and nothing held, that knob is both the crossover and the
    // mutation's only candidate. Hold it and neither can touch it.
    const oneHeld = mixIndices(from, to, new Set(["only"]), one, seeded(3));
    for (const child of oneHeld) {
      expect(child.only, "the only knob was crossed while held").toBe(
        from.only,
      );
    }

    // ---- A TWO-OPTION KNOB AS THE ONLY UNHELD ONE. surprise.ts documents
    // this path: half of all draws reproduce the position they replaced, so
    // the twelve-draw bound is genuinely reachable and the answer is the
    // indices unchanged. The child is then pure crossover with no mutation,
    // which is exactly why the property above says AT MOST one.
    const starfield = mustEntry("starfield");
    const rack = knobsOf(starfield);
    const edge = rack.find((knob) => knob.id === "edge");
    expect(
      edge?.options.length,
      "starfield's edge knob is the two-option knob this case is about",
    ).toBe(2);

    const others = new Set(
      rack.filter((knob) => knob.id !== "edge").map((knob) => knob.id),
    );
    const standing = defaultsOf(rack);
    // An rng that always draws the position `edge` already stands at: the coin
    // reads it as "take THIS ONE" and the mutation rejects it twelve times.
    const stubborn = () => (standing.edge + 0.5) / 2;
    const narrowed = mixIndices(standing, standing, others, rack, stubborn);
    for (const child of narrowed) {
      expect(
        child,
        "a two-option knob standing where it stands produced a state, so the exhaustion path is not being reached",
      ).toEqual(standing);
    }
  });
});
