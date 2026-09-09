// The spec that ties HANGAR's recovered knob semantics back to BOTOR's own
// declaration, and proves that not one of the resulting knobs is decorative.
//
// TEST 2 IS THE ANTI-DRIFT MECHANISM. `KnobKind` is a label, not a binding:
// the vendored compiler says WHICH KINDS a card exposes and nothing anywhere
// says which `PadState` field a kind moves. HANGAR recovers the bindings in
// knobs.preset.ts; this file holds the kind set against
// `presetById(id).knobs` in both directions, so a re-sync that adds or removes
// a card's knob goes red and NAMES THE CARD instead of leaving a silently
// short rack.
//
// TEST 5 COMPARES COMPILED BODIES, NOT `setupLua`. `compile` writes the
// state's stamp into the first action's MARKER NAME (`_pad.ts:2419-2421`), and
// the stamp changes whenever any encoded field changes - so a gate that
// compared `setupLua` would pass for a knob that moves a field the emitter
// never reads. Measured: aurora's four `Axis` values give four distinct
// `setupLua` strings and only TWO distinct bodies, because the wave emitter
// branches on `antidiagonal` alone. Comparing `action.script` is what makes
// this gate mean anything at all.
//
// The formatter is deliberately NOT awaited. `compile` emits Lua without
// measuring it, and only `measure`/`cost` reach `GridScript` (`_pad.ts:3042`),
// so this suite needs none of the 628 KB of WASM - the 08-03 precedent.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import {
  BRIGHTNESS_TABLE,
  compile,
  padLightsAnything,
  quantiseColour,
  type PadState,
} from "../../vendor/botor/_pad";
// The simulator, for one assertion only: what the NINE PADS 4x4 picture
// actually looks like. No WASM is involved, so the file's no-formatter rule
// above is untouched.
import { PadSim } from "../../vendor/botor/pad-sim";
// HANGAR's nine, not the vendored shelf's, and that is load-bearing: this spec
// holds the knob KINDS against `presetById(id).knobs`, so if it kept reading
// src/vendor/ then a later plan adding a knob to a HANGAR-owned preset would go
// red here for the wrong reason - a disagreement with a shelf HANGAR no longer
// ships. The two shelves are held identical field by field by
// src/lib/catalog/presets.spec.ts, which is where that comparison belongs.
import { PRESETS, presetById } from "../catalog/presets";
import { applyKnob, readKnob } from "./state";
import { CATALOG } from "../catalog";
import {
  BRIGHTNESS_KNOB_ID,
  COLOUR_LATTICE_SIZE,
  colourAt,
  colourIndexOf,
  colourTargetFor,
  presetKnobs,
  type PresetKnob,
} from "./knobs.preset";

/** The compiled Lua a visitor would actually get: bodies only, no stamp. */
function bodies(state: PadState): string {
  const built = compile(state);
  return [...built.setup, ...built.timer].map((a) => a.script).join("~");
}

function stateOf(id: string): PadState {
  const preset = presetById(id);
  if (!preset) throw new Error(`the vendored shelf lost ${id}`);
  return preset.state;
}

const rgbOf = (literal: string) => {
  const [r, g, b] = literal.split(",").map((n) => Number.parseInt(n, 10));
  return { r, g, b };
};
const literalOf = (c: { r: number; g: number; b: number }) =>
  `${c.r},${c.g},${c.b}`;

type Row = { id: string; base: PadState; knobs: readonly PresetKnob[] };
const ROWS: readonly Row[] = PRESETS.map((preset) => ({
  id: preset.id,
  base: preset.state,
  knobs: presetKnobs(preset.id),
}));

describe("the per-preset knob descriptors (src/lib/tune/knobs.preset.ts)", () => {
  it("gives every shelf card three to six real knobs", () => {
    expect(ROWS.length).toBe(PRESETS.length);
    for (const row of ROWS) {
      expect(row.knobs.length, `${row.id} knob count`).toBeGreaterThanOrEqual(
        3,
      );
      expect(row.knobs.length, `${row.id} knob count`).toBeLessThanOrEqual(6);

      const ids = new Set<string>();
      for (const knob of row.knobs) {
        const where = `${row.id}.${knob.id}`;
        expect(knob.options.length, `${where} options`).toBeGreaterThanOrEqual(
          2,
        );
        expect(knob.default, `${where} default`).toBeGreaterThanOrEqual(0);
        expect(knob.default, `${where} default`).toBeLessThan(
          knob.options.length,
        );
        expect(knob.label.length, `${where} label`).toBeGreaterThan(0);
        ids.add(knob.id);
      }
      expect(ids.size, `${row.id} knob ids are unique`).toBe(row.knobs.length);
    }
  });

  it("exposes exactly the kinds BOTOR declares for each card, both directions", () => {
    // The carve-out, and why it is by ID and never by kind: `brightness` is
    // NOT a member of the vendored `KnobKind` union. It is a HANGAR-added
    // universal knob (D-01's three-knob floor) and it borrows the existing
    // `amount` kind for its widget - so filtering by kind would also drop
    // ninepads' channel knob, which IS one of the declared four. One card's
    // real knob and one added knob share a kind; only the id tells them apart.
    for (const row of ROWS) {
      const declared = presetById(row.id)?.knobs ?? [];
      const mine = row.knobs
        .filter((knob) => knob.id !== BRIGHTNESS_KNOB_ID)
        .map((knob) => knob.kind);

      expect([...new Set(mine)].sort(), `${row.id} kinds`).toEqual(
        [...new Set<string>(declared)].sort(),
      );
    }
  });

  it("defaults every knob to the position the card actually ships at", () => {
    let checked = 0;
    for (const row of ROWS) {
      for (const knob of row.knobs) {
        expect(readKnob(row.base, knob), `${row.id}.${knob.id} default`).toBe(
          knob.default,
        );
        checked++;
      }
    }
    expect(checked).toBe(ROWS.reduce((n, row) => n + row.knobs.length, 0));

    // Derived defaults could all be a silent zero, so five are also stated by
    // hand: aurora ships at speed detent 2, ninepads at base note 36, the dial
    // at sensitivity detent 5, and every lit card at Full brightness.
    const knobOf = (preset: string, id: string) => {
      const knob = presetKnobs(preset).find((k) => k.id === id);
      if (!knob) throw new Error(`${preset} has no ${id} knob`);
      return knob;
    };
    expect(knobOf("aurora", "speed").default).toBe(1);
    expect(knobOf("aurora", "band").default).toBe(1);
    expect(knobOf("ninepads", "notes").default).toBe(1);
    expect(knobOf("dial", "sensitivity").default).toBe(4);
    expect(knobOf("aurora", BRIGHTNESS_KNOB_ID).default).toBe(4);
  });

  it("reads back every index it writes, on every knob of every card", () => {
    let checked = 0;
    let colourOptions = 0;
    for (const row of ROWS) {
      for (const knob of row.knobs) {
        for (let i = 0; i < knob.options.length; i++) {
          expect(
            readKnob(applyKnob(row.base, knob, i), knob),
            `${row.id}.${knob.id} option ${i} (${knob.options[i]})`,
          ).toBe(i);
          checked++;
        }
        if (knob.kind !== "colour") continue;
        // THE LATTICE, AND THE THREE THINGS THAT MAKE THE ROUND TRIP ABOVE
        // HOLD FOR ALL 4,096 (D-06, plan 10-08). The loop above has already
        // proved `read(apply(state, i)) === i` for every one of them on every
        // colour-bearing preset - that is not a separate test, it is the same
        // test over a wider knob, and it is what a shared link's correctness
        // rests on. What is asserted here is WHY it holds: it holds by
        // construction, because every position IS a quantiseColour fixed point
        // rather than a literal that happens to survive the trip.
        expect(
          knob.options.length,
          `${row.id}.${knob.id} is the whole reachable lattice`,
        ).toBe(COLOUR_LATTICE_SIZE);
        for (let i = 0; i < knob.options.length; i++) {
          const option = knob.options[i];
          const colour = rgbOf(option);
          // 1. Quantise-stable: quantiseColour(colourAt(i)) === colourAt(i).
          expect(
            literalOf(quantiseColour(colour)),
            `${row.id}.${knob.id} position ${i} (${option}) is not quantise-stable`,
          ).toBe(option);
          // 2. Every channel a multiple of 17, and in 0..255.
          for (const [channel, value] of [
            ["r", colour.r],
            ["g", colour.g],
            ["b", colour.b],
          ] as const) {
            expect(
              value % 17,
              `${row.id}.${knob.id} position ${i}: ${channel} = ${value} is not a multiple of 17`,
            ).toBe(0);
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(255);
          }
          // 3. Index <-> colour is the arithmetic, not a lookup: the position
          // the knob is at is the position the arithmetic names.
          expect(
            colourIndexOf(colour),
            `${row.id}.${knob.id} position ${i} does not name itself`,
          ).toBe(i);
          expect(literalOf(colourAt(i)), `${row.id}.${knob.id} at ${i}`).toBe(
            option,
          );
          colourOptions++;
        }
        // THE DEFAULT MARKER STILL POINTS AT WHERE THE CARD SHIPS. The comment
        // this replaces said "the default is always position 1"; on a lattice
        // it is wherever the card's own colour sits, and RESET ALL landing on
        // the card as published is the property that had to survive.
        const target = colourTargetFor(row.base);
        if (!target)
          throw new Error(`${row.id} has a colour knob and no target`);
        const own =
          target === "look"
            ? row.base.look.colour
            : target === "touch"
              ? row.base.touch.colour
              : row.base.sends.gridColour;
        expect(
          knob.options[knob.default],
          `${row.id}.${knob.id} default position ${knob.default} is not the card's own colour`,
        ).toBe(literalOf(quantiseColour(own)));
      }
    }
    expect(checked).toBeGreaterThan(200);
    // Six colour knobs, every position of every one of them.
    expect(colourOptions, "the lattice, on every colour-bearing preset").toBe(
      6 * COLOUR_LATTICE_SIZE,
    );
    // AN EXPLICIT TIMEOUT, and the reason rather than a bigger number.
    // D-06 widens the colour knob from six options to 4,096, so this test's
    // round trip goes from about 250 states to 24,576 and its sibling below
    // from 250 compiles to 24,576. Alone the whole file is ~3 s; inside a
    // 78-file `npm run test:quick` under memory pressure it crossed Vitest's
    // 5,000 ms default and reported `Test timed out in 5000ms` - the same
    // failure `lua-entries.sweep.spec.ts` documents at its own long test on
    // 2026-09-07. NOTHING IS SAMPLED OR TRIMMED TO FIT: read(apply(state, i))
    // === i is required for ALL 4,096 on every colour-bearing preset, so the
    // number that moves is the timeout. 120,000 ms is a ceiling, not a budget
    // - crossing it means something is genuinely wrong.
  }, 120000);

  it("ships no decorative knob: every option changes the compiled Lua", () => {
    let compiles = 0;
    for (const row of ROWS) {
      for (const knob of row.knobs) {
        const seen = new Map<string, string[]>();
        for (let i = 0; i < knob.options.length; i++) {
          const key = bodies(applyKnob(row.base, knob, i));
          seen.set(key, [...(seen.get(key) ?? []), knob.options[i]]);
          compiles++;
        }
        const collisions = [...seen.values()].filter((v) => v.length > 1);
        expect(
          collisions,
          `${row.id}.${knob.id} has options that compile identically`,
        ).toEqual([]);
      }
    }
    expect(compiles).toBeGreaterThan(200);

    // THE PREDICATE, and why no knob needs an exemption from the gate above.
    // A card that lights nothing cannot hold a brightness at all: canonicalise
    // resets it to Full (`_pad.ts:1486`), so every detent would compile to the
    // same body AND read back as Full. Rather than ship a knob that snaps back
    // when it is turned, such a card is not offered one - which is what BOTOR's
    // own panel does (`_pad.ts:883`). Expressed as the predicate, never as an
    // id: a card that starts lighting something gains the knob by itself.
    const dark = ROWS.filter((row) => !padLightsAnything(row.base));
    expect(
      dark.length,
      "the shelf still has a card that lights nothing",
    ).toBeGreaterThan(0);
    for (const row of dark) {
      expect(
        row.knobs.some((knob) => knob.id === BRIGHTNESS_KNOB_ID),
        `${row.id} lights nothing and must not offer brightness`,
      ).toBe(false);
      const detents = new Set(
        BRIGHTNESS_TABLE.map((entry) =>
          bodies({ ...row.base, brightness: entry.step }),
        ),
      );
      expect(detents.size, `${row.id} brightness would be a no-op`).toBe(1);
    }
    // The same explicit timeout, for the same reason: this test now makes
    // 24,576 compile() calls where it made about 250.
  }, 120000);

  it("derives the colour binding from the state instead of tabulating it", () => {
    // The rule reproduces BOTOR's own per-card choice for all nine cards:
    //   look.colour      when the card has a look
    //   touch.colour     else when its touch response is a coloured one
    //   sends.gridColour else when it draws its sends picture
    expect(colourTargetFor(stateOf("aurora"))).toBe("look");
    expect(colourTargetFor(stateOf("pinwheel"))).toBe("look");
    expect(colourTargetFor(stateOf("starfield"))).toBe("look");
    expect(colourTargetFor(stateOf("radar"))).toBe("look");
    expect(colourTargetFor(stateOf("joystick"))).toBe("touch");
    expect(colourTargetFor(stateOf("ninepads"))).toBe("sends");

    // THE THREE THAT HAVE NO COLOUR AT ALL, ASSERTED RATHER THAN ASSUMED.
    // A-11 used to say the colour picker is what keeps TUNE-05 unreachable.
    // It is not, and the whole of the correction rests on this fact: the
    // worst-cost card in the catalog is `tpad` at 907 of 908, and `tpad` has
    // no colour knob, so no colour literal can push it over. `faders` and
    // `dial` likewise. If a re-sync ever gives one of them a look, a touch
    // colour or a sends picture, this goes red and the 907-of-908 argument has
    // to be re-made rather than inherited.
    //
    // It is the KNOB TABLE that is asserted here and not `colourTargetFor`,
    // and the difference is a real one worth recording: `faders` draws its
    // sends picture, so `colourTargetFor` DOES resolve it to `sends`. What
    // decides whether a card is offered a colour knob is BOTOR's own
    // declaration, which gives `faders` two knobs and neither of them a
    // colour. `colourTargetFor` answers "which field would a colour knob move
    // on this card", never "does this card have one".
    expect(colourTargetFor(stateOf("faders"))).toBe("sends");
    expect(colourTargetFor(stateOf("tpad"))).toBe(undefined);
    for (const id of ["faders", "dial", "tpad"]) {
      expect(
        presetKnobs(id).filter((knob) => knob.kind === "colour"),
        `${id} declares a colour knob`,
      ).toEqual([]);
    }
    // Six of the nine carry one, three do not - counted, so neither number can
    // drift without this line saying so.
    expect(
      ROWS.filter((row) => row.knobs.some((knob) => knob.kind === "colour"))
        .length,
      "the colour-bearing presets",
    ).toBe(6);

    // And the other route's two, for the same reason: the Lua half of the
    // budget claim is made per colour knob, so an entry with none is an entry
    // the colour dimension costs nothing for.
    for (const id of ["cull", "quadrant"]) {
      const entry = CATALOG.find((each) => each.id === id);
      expect(entry, `the catalog lost ${id}`).toBeDefined();
      expect(
        entry?.knobs.filter((knob) => knob.kind === "colour"),
        `${id} declares a colour knob`,
      ).toEqual([]);
    }

    // And the descriptor moves the field the rule names, rather than a field
    // that happens to agree on the cards someone checked by hand.
    const moved = (id: string) => {
      const base = stateOf(id);
      const knob = presetKnobs(id).find((k) => k.kind === "colour");
      if (!knob) throw new Error(`${id} has no colour knob`);
      const after = applyKnob(base, knob, knob.options.length - 1);
      return {
        look: literalOf(after.look.colour) !== literalOf(base.look.colour),
        touch: literalOf(after.touch.colour) !== literalOf(base.touch.colour),
        sends:
          literalOf(after.sends.gridColour) !==
          literalOf(base.sends.gridColour),
      };
    };
    expect(moved("aurora")).toEqual({ look: true, touch: false, sends: false });
    expect(moved("joystick")).toEqual({
      look: false,
      touch: true,
      sends: false,
    });
    expect(moved("ninepads")).toEqual({
      look: false,
      touch: false,
      sends: true,
    });
  });

  it("reaches 4x4 from an APPENDED NINE PADS knob, and says what 4x4 looks like", () => {
    // The user's bench note is "make it selectable to 4x4" (2026-09-09).
    // sends.grid already accepted "4x4" and already compiled; plan 11-05
    // measured it emitting note 44 where 3x3 emits 39. What was missing was a
    // knob, so this is the test that makes "selectable" a fact.
    const knobs = presetKnobs("ninepads");

    // APPENDED, NEVER INSERTED. Every knob that existed before plan 11-06 keeps
    // the index it had, asserted by id AND position rather than by length, and
    // brightness stays last because presetKnobs appends it by construction.
    expect(
      knobs.map((knob) => knob.id),
      "the rack order: the pre-11-06 four, then the new knob, then brightness",
    ).toEqual(["colour", "notes", "scale", "channel", "grid", "brightness"]);
    expect(
      knobs.at(-1)?.id,
      "brightness is last, so the appended knob went before it and not after",
    ).toBe(BRIGHTNESS_KNOB_ID);
    // Six is the ceiling test 1 enforces, so this card is now AT it. A seventh
    // knob on NINE PADS turns test 1 red, which is the intended conversation.
    expect(knobs.length, "at the six-knob ceiling").toBe(6);

    const grid = knobs.find((knob) => knob.id === "grid");
    if (!grid) throw new Error("ninepads has no grid knob");
    expect(grid.label, "reads as the number of pads").toBe("Pads");
    expect(grid.options, "nine pads or sixteen").toEqual(["9", "16"]);
    expect(
      grid.default,
      "the card still SHIPS at 3x3; selectable, not moved",
    ).toBe(0);

    // Both positions reach the field, and both reach it as the compiler reads
    // it: the zone divisor in the emitted Lua is the proof, not the state.
    const base = stateOf("ninepads");
    const at = (index: number) => applyKnob(base, grid, index);
    expect(at(0).sends.grid).toBe("3x3");
    expect(at(1).sends.grid).toBe("4x4");
    expect(readKnob(at(1), grid), "reads back the position it wrote").toBe(1);
    expect(bodies(at(0)), "3x3 divides the axis by three").toContain(
      "x*3//128",
    );
    expect(bodies(at(1)), "4x4 divides the axis by four").toContain("x*4//128");

    // WHAT 4x4 ACTUALLY LOOKS LIKE, PINNED RATHER THAN ASSUMED, because four
    // does not divide nine and the two pictures are not the same KIND of
    // picture. At 3x3 the compiler paints the WHOLE pad as a nine-zone
    // checkerboard; at 4x4 it cannot tile, so it lights ONE MARKER CELL per
    // zone - sixteen dots on an otherwise dark pad. That is 162 lit bytes
    // against 32, a fifth of the light, and it is a real regression in how the
    // card reads across a room. It ships because the user asked for it to be
    // selectable and because the compiler's answer is the honest one for a
    // grid that does not tile; this assertion is what stops it being a
    // surprise, and what goes red if a re-sync changes the marker layout.
    const lit = (state: PadState): number => {
      const sim = new PadSim(state);
      sim.run(0);
      return sim.frame.reduce((n, byte) => n + (byte !== 0 ? 1 : 0), 0);
    };
    expect(lit(at(0)), "3x3 tiles the whole pad").toBe(162);
    expect(lit(at(1)), "4x4 lights one marker cell per zone, and no more").toBe(
      32,
    );

    // 9x9 IS REACHABLE IN THE DESCRIPTOR AND DELIBERATELY NOT OFFERED, so the
    // knob's option list is asserted to be the short one on purpose rather than
    // by omission. Eighty-one zones is a different card, and the note asked for
    // 4x4.
    expect(
      grid.options.includes("81"),
      "9x9 compiles and is not offered; adding it is one entry in GRID_PADS",
    ).toBe(false);
  });
});
