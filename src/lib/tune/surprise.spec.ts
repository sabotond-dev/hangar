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
import { roleOfKnob } from "./midi";
import {
  compile as vendorCompile,
  cost as vendorCost,
  fit as vendorFit,
  fits as vendorFits,
  type PadReserved,
} from "../../vendor/botor/_pad";
import { CATALOG, byId, type CatalogEntry } from "../catalog";
import { padReady } from "../pad";
import { encodeFor, stampKnobs } from "../share/stamp";
import { luaKnobs } from "./knobs.lua";
import { presetKnobs, type KnobDescriptor } from "./knobs.preset";
import { applyKnob, baseStateFor, resetAll } from "./state";
import {
  SURPRISE_ROLL_LIMIT,
  isMidiDestination,
  rollable,
  surpriseIndices,
} from "./surprise";

/** The property's draw count, per compiler-driven entry. */
const DRAWS = 2000;

/**
 * The reserve that puts `dial` genuinely over 908 - measured, see
 * ladder.spec.ts. It is how test 4 reaches a state whose only way back inside
 * the budget is the ladder. 300 -> 354 at plan 12.1-08b: DIAL's Setup went
 * 646 -> 592 (its comet is the library's K), and 592 + 354 = 946 is the same
 * -38 the ladder was measured against, so the resolved fallback reproduces
 * (ladder.spec.ts's reason).
 */
const OVER_RESERVE: PadReserved = { setup: 354, timer: 0 };

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
    // Seven since change 12b: the `tpad` preset is on the shelf but not in
    // the catalog (the hand-authored TRACKPAD replaced it as the card, plan
    // 12-10), and so is `radar` since 2026-09-18 (the hand-authored RADAR took
    // its id); SURPRISE ME draws over catalog cards. tpad's 512-state
    // cross-product was never the one that could land over budget - it has no
    // colour knob and tops out at 907 - and RADAR's is drawn as a Lua entry
    // below, so the property loses no witness.
    expect(entries.length, "no compiler-driven entry was read").toBe(7);

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
    const entry = mustEntry("orbit");
    const knobs = luaKnobs(entry);
    expect(knobs.length, "orbit has token knobs").toBeGreaterThan(2);

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

  it("held knobs shrink the roll: a two-option knob alone burns all twelve draws, and the lock never reaches the stamp", () => {
    // THIS PATH WAS UNREACHABLE BEFORE LOCKS EXISTED, which is what makes it
    // worth a test of its own. Until T1 every roll drew every knob, so the
    // no-op rejection at surprise.ts's `if (!moved) continue` could only fire
    // when EVERY knob independently redrew its own position - on starfield's
    // 4,096 x 2 x 5 domain, once in about forty thousand draws, and never
    // twelve times running in any run this repository will ever make. Hold all
    // but one knob and the domain collapses to that knob's own options: on a
    // TWO-option knob standing at one of them, half of all draws are the state
    // it replaced, and twelve in a row is an ordinary event rather than an
    // astronomical one. The rng below makes it certain rather than likely.
    // The card carries TWO knobs since 2026-09-17 (BENCH-2026-09-16.txt section
    // 5b): the retired brightness knob was the third, and one held knob still
    // collapses the domain onto `edge` exactly as three did.
    const entry = mustEntry("starfield");
    const knobs = knobsOf(entry);
    const free = knobs.find((knob) => knob.id === "edge");
    expect(
      free?.options.length,
      "starfield's edge knob is the two-option knob this test is about - if it is not two options, this test is no longer driving the path it names",
    ).toBe(2);
    expect(knobs.length, "starfield has another knob to hold").toBe(2);

    const held = new Set(
      knobs.filter((knob) => knob.id !== "edge").map((knob) => knob.id),
    );
    expect(held.size, "all but one knob is held").toBe(knobs.length - 1);

    const previous = defaultsOf(knobs);
    const standing = previous.edge;
    // Draws the position the knob already stands at, every time. floor() of
    // this times two is exactly `standing`, whichever of the two it is.
    let draws = 0;
    const rng = () => {
      draws++;
      return (standing + 0.5) / 2;
    };
    let asked = 0;
    const drawn = surpriseIndices(
      knobs,
      previous,
      () => {
        asked++;
        return true;
      },
      rng,
      held,
    );

    // Twelve draws attempted, one per roll, because a held knob never reaches
    // the rng at all - which is what makes this number exact rather than a
    // multiple of the rack size.
    expect(
      draws,
      "the roll did not attempt exactly one draw per roll on the one free knob",
    ).toBe(SURPRISE_ROLL_LIMIT);
    // And not one of them was offered to the compiler: the no-op rejection
    // happens before `fits`, so a fully-narrowed roll costs no minifier call.
    expect(
      asked,
      "a draw that reproduces the state it replaced was offered to fits",
    ).toBe(0);
    expect(
      keyOf(knobs, drawn),
      "exhaustion did not hand the state back unchanged",
    ).toBe(keyOf(knobs, previous));

    // Every knob held is the same signal reached without an rng at all: no
    // knob is drawn, so no draw can move and all twelve rolls are no-ops.
    let noDraws = 0;
    const everyKnob = new Set(knobs.map((knob) => knob.id));
    const stuck = surpriseIndices(
      knobs,
      previous,
      () => {
        asked++;
        return true;
      },
      () => {
        noDraws++;
        return 0.5;
      },
      everyKnob,
    );
    expect(noDraws, "a held knob was drawn").toBe(0);
    expect(asked, "a fully-held roll reached the compiler").toBe(0);
    expect(keyOf(knobs, stuck)).toBe(keyOf(knobs, previous));

    // EPHEMERAL, AND THIS IS HOW SHARE-01 IS SAID. A lock is component state
    // that never reaches `encodeFor`, so the link a held rack produces is
    // byte-identical to the link the same indices produce unheld. Measured off
    // a NON-default vector, because a rack at its defaults encodes to
    // undefined and two undefineds would prove nothing.
    const moved = { ...previous, edge: 1 - standing };
    const unheldStamp = encodeFor(entry, moved);
    expect(
      unheldStamp,
      "the moved vector really does produce a stamp",
    ).toBeDefined();
    const heldStamp = encodeFor(
      entry,
      surpriseIndices(
        knobs,
        moved,
        () => true,
        () => 0.5,
        everyKnob,
      ),
    );
    expect(
      heldStamp,
      "a held knob changed the stamp, so a lock is travelling in a link",
    ).toBe(unheldStamp);
  });

  it("the scope rule: a roll leaves every MIDI destination at its prior index while something else moves, the previous vector is untouched, and the excluded set is the knobs listed, on twenty-one entries (the count moves with change 17B's and 17C's outputs)", () => {
    // SECTION 7 (13-10): "Preserve MIDI destination, channel, routing, and
    // device target." The predicate is over the DESCRIPTOR - its id and its
    // label - and this test holds three things: what it excludes across the
    // whole catalog, by entry and id, so the list in 13-10-SUMMARY.md is a
    // measurement; that a roll on an entry with MIDI knobs never draws them
    // and still moves something; and that `previous` comes out of the roll
    // exactly as it went in, which is the vector Undo randomize restores.
    const excluded: string[] = [];
    let entries = 0;
    let knobsSeen = 0;
    for (const entry of CATALOG) {
      const knobs = stampKnobs(entry);
      knobsSeen += knobs.length;
      const out = knobs.filter(isMidiDestination).map((knob) => knob.id);
      if (out.length > 0) {
        entries++;
        excluded.push(`${entry.id}: ${out.join(", ")}`);
      }
      // The predicate agrees with the ids the inspector partitioned by until
      // 13-10, on every entry - so the MIDI output section is unchanged.
      expect(
        out.sort(),
        `${entry.id}: the predicate and the four ids disagree`,
      ).toEqual(
        knobs
          .filter(
            (knob) =>
              ["cc", "ccBase", "channel", "send"].includes(knob.id) ||
              // ORBIT's four ring notes (change 8, 2026-09-18): MIDI destinations
              // by their label's word, so a DAW's drum map is never rolled.
              /^note[1-4]$/.test(knob.id) ||
              // A MIDI output's knobs (change 17): its Type and Receive name the wire too.
              roleOfKnob(entry).has(knob.id),
          )
          .map((knob) => knob.id)
          .sort(),
      );
      // Every rollable knob keeps its kind and its option count: exclusion
      // shrinks the domain and changes no knob.
      for (const knob of rollable(knobs)) {
        expect(knob.options.length).toBeGreaterThan(1);
      }
    }
    expect(knobsSeen, "the catalog was walked").toBeGreaterThan(100);
    expect(
      excluded,
      "the excluded set moved - a knob was added, renamed or re-labelled onto or off the wire; update 13-10-SUMMARY.md's list with it",
    ).toEqual([
      // Change 17C: a wrapped preset's outputs are token knobs on its rack.
      "aurora: xType, channel, xCc, xReceive, yType, yChannel, yCc, yReceive",
      "pinwheel: xType, channel, xCc, xReceive, yType, yChannel, yCc, yReceive",
      "starfield: xType, channel, xCc, xReceive, yType, yChannel, yCc, yReceive",
      "joystick: send, xType, channel, xReceive, yType, yChannel, yCc, yReceive",
      "ninepads: channel",
      "faders: send, channel",
      "dial: send, channel",
      "orbit: note1, note2, note3, note4, channel, type1, receive1, type2, channel2, receive2, type3, channel3, receive3, type4, channel4, receive4",
      "chorus: channel, midiType",
      "arc: cc, channel, midiType, midiReceive",
      "ghost: cc, channel, xType, yType, yChannel, yCc",
      "morph: cc1, channel, type1, rx1, type2, ch2, cc2, rx2, type3, ch3, cc3, rx3, type4, ch4, cc4, rx4",
      "sonar: channel, midiType, midiReceive",
      "steps: note, channel, type1, receive1, type2, channel2, note2, receive2, type3, channel3, note3, receive3, type4, channel4, note4, receive4, type5, channel5, note5, receive5, type6, channel6, note6, receive6, type7, channel7, note7, receive7, type8, channel8, note8, receive8",
      "console: cc, channel, midiType, midiReceive",
      "strip: cc, channel, faderType, faderReceive, crossType, crossChannel, crossCc, crossReceive",
      "lumen: cc, channel, xType, xReceive, yType, yChannel, yCc, yReceive",
      "snake: note, channel, midiType, deathType, deathChannel, deathNote",
      "quadrant: note, channel, type1, receive1, type2, channel2, note2, receive2, type3, channel3, note3, receive3, type4, channel4, note4, receive4",
      "pomodoro: note, channel, alarmType, transportType, transportChannel, transportNote",
      "wheels: cc, channel, modType, modReceive, pitchType, pitchChannel, pitchCc, pitchReceive",
      "radar-points: channel, midiType, midiReceive",
      // Last since change 12b (2026-09-18): RADAR is the last Lua entry in
      // CATALOG now; the same knob, the same id, a Lua palette rack.
      "radar: send, channel, xType, xReceive, yType, yChannel, yCc, yReceive",
    ]);
    expect(entries, "twenty-three entries carry a MIDI destination").toBe(23);
    expect(
      excluded.reduce((n, line) => n + line.split(", ").length, 0),
      "the knobs excluded (change 17B: every output knob a card gains)",
    ).toBe(183);
    // Not theatre: the labels alone name the wire too, camelCase and all.
    expect(isMidiDestination({ id: "x", label: "First controller" })).toBe(
      true,
    );
    expect(isMidiDestination({ id: "ccBase", label: "x" })).toBe(true);
    expect(isMidiDestination({ id: "x", label: "MIDI channel" })).toBe(true);
    expect(isMidiDestination({ id: "sensitivity", label: "Sensitivity" })).toBe(
      false,
    );
    expect(isMidiDestination({ id: "scale", label: "Compass scale" })).toBe(
      false,
    );

    // THE ROLL. dial: send (12), channel (16), sensitivity, mode - and since
    // 2026-09-17 (BENCH-2026-09-16.txt section 5b) no brightness, which the roll
    // used to move: the universal five-detent knob is retired and the one
    // brightness is a typed field the roll cannot reach (it is not a knob at
    // all, so the scope shrinks by one here and by one on every lit card).
    // The MIDI knobs stand OFF their defaults first, so "unmoved" is not
    // "at default"; an rng that draws the last position for everything
    // offered to it moves every rollable knob and is never asked for the
    // two it must not touch - counted, so the scope is a number of draws.
    const knobs = knobsOf(mustEntry("dial"));
    const inScope = rollable(knobs);
    expect(inScope.map((knob) => knob.id).sort()).toEqual([
      "mode",
      "sensitivity",
    ]);
    const previous: Record<string, number> = defaultsOf(knobs);
    previous.channel = 5;
    previous.send = 7;
    const frozen = { ...previous };
    let draws = 0;
    const drawn = surpriseIndices(
      knobs,
      previous,
      () => true,
      () => {
        draws++;
        return 0.5;
      },
    );
    expect(draws, "a MIDI destination reached the rng").toBe(inScope.length);
    expect(drawn.channel, "the channel rolled").toBe(5);
    expect(drawn.send, "the send rolled").toBe(7);
    expect(
      inScope.filter((knob) => drawn[knob.id] !== previous[knob.id]).length,
      "nothing in scope moved",
    ).toBeGreaterThan(0);
    // `previous` is the vector Undo restores: the roll never wrote to it.
    expect(previous, "the roll mutated the previous vector").toEqual(frozen);
    // And the held path composes with the scope: hold every rollable knob
    // and the roll is the fully-held exhaustion, with no draw at all.
    let noDraws = 0;
    const stuck = surpriseIndices(
      knobs,
      previous,
      () => true,
      () => {
        noDraws++;
        return 0.5;
      },
      new Set(inScope.map((knob) => knob.id)),
    );
    expect(noDraws, "a held or excluded knob was drawn").toBe(0);
    expect(keyOf(knobs, stuck)).toBe(keyOf(knobs, previous));
  });
});
