// The colour picker's gate. Every test in it is a property of
// the SOURCE or of pure arithmetic, so none of them needs a browser.
//
// It lives under src/lib/tune/ rather than beside the component because three
// of them have to import the vendored compiler - `colourAt`, `colourIndexOf`
// and `COLOUR_LATTICE_SIZE` are the real lattice, and the picker's own copy of
// that arithmetic is only trustworthy if something holds the two together. A
// spec may import the compiler freely; a spec is never bundled.
//
// EVERY SOURCE SCAN STRIPS COMMENTS FIRST, and that is load-bearing rather than
// tidy: ColourPicker.svelte's header names all six forbidden shapes out loud, so
// a scan over raw source would go red on correct code and the natural fix would
// be deleting the documentation that makes the rule survivable. The stripper and
// the non-vacuity habit are src/lib/config-shape.spec.ts's, copied rather than
// reinvented, and every regular expression here is backslash-free in the same
// house style.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CATALOG } from "../catalog";
import { stampKnobs } from "../share/stamp";
import {
  COLOUR_BLUE_RAIL,
  COLOUR_CAPTION,
  COLOUR_CHEAP_STEPS,
  COLOUR_GREEN_RAIL,
  COLOUR_RED_RAIL,
  COLOUR_UNAFFORDABLE,
  COLOUR_WHICH,
  colourRailName,
} from "./copy";
// The real lattice. Restated in view.ts because a file src/lib/ui/ may name
// cannot import the compiler; held against the real thing here.
import {
  COLOUR_LATTICE_SIZE as VENDORED_LATTICE_SIZE,
  colourAt,
  colourIndexOf,
} from "./knobs.preset";
import {
  COLOUR_CHANNELS,
  COLOUR_LATTICE_SIZE,
  COLOUR_RAIL_STEP,
  COLOUR_RAIL_STEPS,
  colourChannel,
  colourLevels,
  colourPosition,
  colourRail,
  colourValueText,
  widgetFor,
} from "./view";

const repo = (rel: string) =>
  fileURLToPath(new URL(`../../../${rel}`, import.meta.url));

const PICKER = "src/lib/ui/ColourPicker.svelte";
const RACK = "src/lib/ui/KnobRack.svelte";

/** The house comment stripper: line, block and markup. */
const stripComments = (source: string) =>
  source
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

const raw = (rel: string) => readFileSync(repo(rel), "utf8");
const code = (rel: string) => stripComments(raw(rel));

const occurrences = (text: string, needle: string) =>
  text.split(needle).length - 1;

/** Every colour knob an entry declares, in rack order, on either route. */
const colourKnobsOf = (entryId: string) => {
  const entry = CATALOG.find((each) => each.id === entryId);
  if (!entry) throw new Error(`no catalog entry: ${entryId}`);
  return stampKnobs(entry).filter(
    (knob) => widgetFor(knob.kind, knob.options) === "colour",
  );
};

describe("the colour picker (10-UI-SPEC §11.2, TUNE-01, TUNE-05)", () => {
  it("every detent is a stored, reachable RGB444 colour, and the picker's arithmetic IS the lattice knob's", () => {
    // -----------------------------------------------------------------------
    // 1. THE TIE. view.ts restates the lattice because D-18 forbids a file
    // src/lib/ui/ may name from importing the compiler - by specifier text, so
    // even a type-only import fails. That restatement is only worth anything
    // if something holds it against `quantiseColour`'s real arithmetic, and
    // this is that something: all 4,096 positions, both directions.
    expect(
      COLOUR_LATTICE_SIZE,
      "view.ts's lattice size has drifted from knobs.preset.ts's",
    ).toBe(VENDORED_LATTICE_SIZE);
    expect(COLOUR_LATTICE_SIZE).toBe(4096);
    expect(COLOUR_RAIL_STEPS ** 3).toBe(COLOUR_LATTICE_SIZE);

    let walked = 0;
    for (let position = 0; position < COLOUR_LATTICE_SIZE; position += 1) {
      const vendored = colourAt(position);
      const levels = colourLevels(position);
      expect(
        [
          colourChannel(levels[0]),
          colourChannel(levels[1]),
          colourChannel(levels[2]),
        ],
        `position ${position}: the picker's channels are not the lattice knob's`,
      ).toEqual([vendored.r, vendored.g, vendored.b]);
      expect(
        colourPosition(levels),
        `position ${position}: levels do not compose back to the position`,
      ).toBe(position);
      expect(
        colourIndexOf(vendored),
        `position ${position}: the vendored round trip disagrees`,
      ).toBe(position);
      walked += 1;
    }
    expect(walked, "the whole lattice was walked").toBe(4096);

    // -----------------------------------------------------------------------
    // 2. THE FILLS. Every detent of every rail, sampled across the space: a
    // multiple of 17 on all three channels, inside 0..255, and equal to the
    // colour `colourAt` gives that composed position. This is what "a flat
    // fill of an exact stored RGB444 value" means, checked rather than
    // asserted in prose.
    const SAMPLES = [0, 95, 1638, 2730, 4095, 273, 3822];
    let detents = 0;
    for (const at of SAMPLES) {
      for (let axis = 0; axis < 3; axis += 1) {
        const rail = colourRail(axis as 0 | 1 | 2, at);
        expect(rail, `axis ${axis} at ${at}`).toHaveLength(COLOUR_RAIL_STEPS);
        for (const detent of rail) {
          const truth = colourAt(detent.position);
          expect(
            [...detent.rgb],
            `axis ${axis}, level ${detent.level} at ${at}: the detent is not the colour that index produces`,
          ).toEqual([truth.r, truth.g, truth.b]);
          for (const channel of detent.rgb) {
            expect(
              channel % COLOUR_RAIL_STEP,
              `a detent channel (${channel}) is not a multiple of 17, so it is a colour the state cannot hold`,
            ).toBe(0);
            expect(channel).toBeGreaterThanOrEqual(0);
            expect(channel).toBeLessThanOrEqual(255);
          }
          detents += 1;
        }
        // The other two rails are held where they stand - which is what makes
        // a rail repaint when either of them moves.
        const held = colourLevels(at);
        for (const detent of rail) {
          const levels = colourLevels(detent.position);
          for (let other = 0; other < 3; other += 1) {
            if (other === axis) continue;
            expect(
              levels[other],
              `axis ${axis}: the detent moved a channel it does not own`,
            ).toBe(held[other]);
          }
        }
      }
    }
    expect(detents, "every sampled rail's sixteen detents were checked").toBe(
      SAMPLES.length * 3 * COLOUR_RAIL_STEPS,
    );

    // -----------------------------------------------------------------------
    // 3. THE COMPONENT SPENDS NO ARITHMETIC OF ITS OWN. Every fill goes
    // through the lattice; a local `Math.round(v / 17) * 17` or a hand-typed
    // table would drift from the state model on the day _pad.ts moves the
    // step, silently and on a shared link.
    const picker = code(PICKER);
    expect(picker.length, "ColourPicker.svelte was read").toBeGreaterThan(2000);
    expect(picker, "the picker does not use the lattice at all").toContain(
      "colourRail",
    );
    expect(
      picker,
      "the picker rounds a channel itself instead of going through the lattice",
    ).not.toContain("17");
    expect(
      picker,
      "the picker composes a position by hand instead of through colourPosition",
    ).toContain("colourPosition");
  });

  it("the selector is rendered only when an entry has more than one colour knob, and the shelf splits 14 / 14 / 3 / 5", () => {
    // RECOUNTED FROM THE CATALOG, never from a literal list, because the split
    // is a fact about the shipped tree and a list is a copy of it that rots.
    const split = { none: 0, two: 0, three: 0, noPicker: 0 };
    const three: string[] = [];
    for (const entry of CATALOG) {
      const colours = colourKnobsOf(entry.id).length;
      if (colours === 0) split.noPicker += 1;
      else if (colours === 1) split.none += 1;
      else if (colours === 2) split.two += 1;
      else {
        split.three += 1;
        three.push(entry.id);
      }
    }
    expect(
      split,
      "the colour-knob split moved. 14 entries render no selector (one colour knob), 14 render two options, 3 render three, and 5 have no picker at all",
    ).toEqual({ none: 14, two: 14, three: 3, noPicker: 5 });
    expect(
      three.sort(),
      "the three-colour entries are console, forge and strip - the worst case the six-canvas budget is measured against",
    ).toEqual(["console", "forge", "strip"]);
    expect(
      CATALOG.length,
      "the catalog is no longer 36 entries, so the split above is a different denominator",
    ).toBe(split.none + split.two + split.three + split.noPicker);

    // THE PRESENCE RULE, IN BOTH DIRECTIONS, as a property of the source: the
    // selector exists only above one knob, and the caption carries the knob's
    // own label when it does not.
    const picker = code(PICKER);
    expect(
      picker,
      "the selector is not gated on the knob count, so a single-colour entry renders a radiogroup of one",
    ).toContain("knobs.length > 1");
    expect(
      picker,
      "the selector is not gated by `manyKnobs`, so the rule above is declared and not used",
    ).toMatch(/[{]#if manyKnobs[}]/);
    expect(
      picker,
      "a single-colour entry gets no label at all where the selector would have been",
    ).toContain("knob-label");
    expect(
      picker,
      "the selector's group label is missing, so a radiogroup ships unnamed",
    ).toContain("COLOUR_WHICH");

    // -----------------------------------------------------------------------
    // THE SEVEN STRINGS, COUNTED BY SCRIPT rather than by eye. copy.spec.ts
    // holds them character-for-character; these are the numbers the UI spec
    // gives them.
    const counts = {
      COLOUR_CAPTION: [...COLOUR_CAPTION].length,
      COLOUR_WHICH: [...COLOUR_WHICH].length,
      COLOUR_RED_RAIL: [...COLOUR_RED_RAIL].length,
      COLOUR_GREEN_RAIL: [...COLOUR_GREEN_RAIL].length,
      COLOUR_BLUE_RAIL: [...COLOUR_BLUE_RAIL].length,
      COLOUR_CHEAP_STEPS: [...COLOUR_CHEAP_STEPS].length,
      COLOUR_UNAFFORDABLE: [...COLOUR_UNAFFORDABLE].length,
    };
    expect(counts, "a picker string is no longer its stated length").toEqual({
      COLOUR_CAPTION: 6,
      COLOUR_WHICH: 12,
      COLOUR_RED_RAIL: 13,
      COLOUR_GREEN_RAIL: 15,
      COLOUR_BLUE_RAIL: 14,
      COLOUR_CHEAP_STEPS: 40,
      COLOUR_UNAFFORDABLE: 57,
    });

    // THE PREFIXED FORM IS COMPOSED, NOT A LITERAL. Seventeen entries carry
    // more than one colour knob and seventeen different labels; writing the
    // prefixed names down would be fifty-one sentences that drift from the
    // catalog.
    expect(colourRailName("r"), "the bare form is not the constant").toBe(
      COLOUR_RED_RAIL,
    );
    expect(
      colourRailName("r", "Mute"),
      "the prefixed rail name is not composed from the knob's own label",
    ).toBe("Mute red, 16 steps");
    expect(colourRailName("g", "Rail")).toBe("Rail green, 16 steps");
    expect(colourRailName("b", "Level")).toBe("Level blue, 16 steps");
    expect(
      picker,
      "the picker writes a prefixed rail name itself instead of calling the one composer",
    ).toContain("colourRailName(");
    expect(picker).not.toContain(`"${COLOUR_RED_RAIL}"`);
  });

  it("the picker contributes exactly one canvas, so the worst entry shows six rather than eight", () => {
    const picker = code(PICKER);
    const rack = code(RACK);

    // ONE PICKER PER PANEL, NOT ONE PER KNOB (10-UI-SPEC §11.2). The rack
    // takes the colour knobs OUT of its row list and renders one block in the
    // place of the first of them.
    expect(
      rack,
      "the rack does not gather the colour knobs, so it is still drawing one row each",
    ).toContain('knobs.filter((k) => k.widget === "colour")');
    expect(
      occurrences(rack, "<ColourPicker"),
      "the rack renders more than one picker",
    ).toBe(1);
    expect(
      rack,
      "the picker is not gated to the first colour knob's slot, so a three-colour entry renders three of them",
    ).toContain("row.id === pickerAt");

    // AND THE PICKER CONTRIBUTES EXACTLY ONE CANVAS. The pad is the entry: a
    // three-colour configuration has one appearance, not three.
    expect(
      occurrences(picker, "<PadCanvas"),
      "the picker declares more than one result pad - one per colour knob is what one-picker-per-panel exists to prevent",
    ).toBe(1);

    // THE BUDGET, RECORDED FOR 10-11 TO BUILD ON. `console`, `strip` and
    // `forge` each declare three colour knobs, and each shows: the hero, the
    // picker's one result, and four more only while MIX TWO's children are
    // showing. SIX at most, not eight, and that difference is exactly what one
    // picker per panel bought.
    const HERO = 1;
    const PICKER_RESULT = 1;
    const MIX_TWO_CHILDREN = 4;
    const worst = colourKnobsOf("console").length;
    expect(worst, "console no longer declares three colour knobs").toBe(3);
    expect(
      HERO + PICKER_RESULT + MIX_TWO_CHILDREN,
      "the six-canvas budget moved",
    ).toBe(6);
    expect(
      HERO + worst + MIX_TWO_CHILDREN,
      "one picker per KNOB would be eight, which is what this rule exists to avoid",
    ).toBe(8);

    // The pad is registered by whoever owns the page's SimHost, gated by the
    // same IntersectionObserver as every other pad, and it is rendered only
    // when a driver has asked for it - an unregistered canvas paints nothing,
    // and an empty box claiming to show the truth about a colour is worse than
    // no box.
    expect(
      picker,
      "the result pad does not hand its element upward, so nothing can register it",
    ).toContain("onready={onresult}");
    expect(
      picker,
      "the result pad renders unconditionally, so a page with no SimHost shows an empty box",
    ).toMatch(/[{]#if onresult[}]/);
    expect(
      picker,
      "the result pad shares the hero's registration id, which would unregister the hero",
    ).toContain("-colour-result");

    // -----------------------------------------------------------------------
    // THE ANNOUNCEMENT, riding here because it is the other half of "what the
    // picker says about the colour it is showing": THREE STORED INTEGERS,
    // NEVER A HEX. A hex is a number the state does not hold, written in a
    // base the firmware never sees, and it implies 24 bits of resolution the
    // pad cannot reach.
    expect(colourValueText(colourPosition([6, 6, 6]))).toBe("102, 102, 102");
    expect(colourValueText(0)).toBe("0, 0, 0");
    expect(colourValueText(COLOUR_LATTICE_SIZE - 1)).toBe("255, 255, 255");
    for (const at of [0, 95, 1638, 4095]) {
      expect(
        colourValueText(at),
        `position ${at} is not announced as three integers`,
      ).toMatch(/^[0-9]{1,3}, [0-9]{1,3}, [0-9]{1,3}$/);
      expect(
        colourValueText(at),
        `position ${at} is announced as a hex, which is a resolution the state does not have`,
      ).not.toContain("#");
    }
    expect(
      picker,
      "a rail does not announce the composed value, so moving one says nothing about the colour",
    ).toContain("aria-valuetext={valueText}");
    expect(
      picker,
      "the picker builds its own value text instead of using the one arithmetic",
    ).toContain("colourValueText(");
    expect(
      COLOUR_CHANNELS,
      "the three rails are no longer red, green and blue in that order",
    ).toEqual(["r", "g", "b"]);
  });
});
