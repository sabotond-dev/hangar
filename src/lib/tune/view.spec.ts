// The view seam's spec, and the tie that keeps it honest.
//
// src/lib/tune/view.ts imports NOTHING, so the three facts it restates as
// literals - the twelve knob kinds, the 908-character event budget and the
// vocabulary the compiler already writes - are held against their real sources
// HERE instead. That is the src/lib/protocol-pin.ts and
// src/lib/catalog/front-door.ts pattern: a spec may import the vendored
// compiler and the catalog freely, because a spec is never bundled.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  EVENT_BUDGET as VENDOR_EVENT_BUDGET,
  type KnobKind,
  type ScaleKind,
} from "../../vendor/botor/_pad";
import { CATALOG, KNOB_KINDS, byId } from "../catalog";
// The lattice size, read rather than restated: a spec that hard-codes 4,096
// would keep passing on the day the step rule moves.
import { COLOUR_LATTICE_SIZE } from "./knobs.preset";
import {
  EVENT_BUDGET,
  KNOB_KIND_NAMES,
  SCALE_WORDS,
  hueName,
  integerReadout,
  meterView,
  noteName,
  percentOf,
  positionText,
  railSkin,
  scaleWord,
  swatchName,
  swatchOf,
  widgetFor,
  type KnobKindName,
  type KnobWidget,
} from "./view";

// TEST 1, the half a runtime assertion cannot make. If BOTOR's union ever
// gains or loses a member, one of these two lines stops compiling and
// `npm run check` names it - which is the whole reason view.ts is allowed to
// restate the vocabulary rather than import it.
type MissingHere = Exclude<KnobKind, KnobKindName>;
type ExtraHere = Exclude<KnobKindName, KnobKind>;
const _noKindIsMissing: MissingHere extends never ? true : never = true;
const _noKindIsInvented: ExtraHere extends never ? true : never = true;
void _noKindIsMissing;
void _noKindIsInvented;

// TEST 6, same shape, over the compiler's four bare-word scales.
type MissingScaleWord = Exclude<ScaleKind, keyof typeof SCALE_WORDS>;
const _everyScaleKindHasAWord: MissingScaleWord extends never ? true : never =
  true;
void _everyScaleKindHasAWord;

/** The four bare words, typed so a fifth ScaleKind fails the line above. */
const SCALE_KINDS: readonly ScaleKind[] = [
  "chromatic",
  "major",
  "minor",
  "pentatonic",
];

const source = (file: string) =>
  readFileSync(new URL(file, import.meta.url), "utf8");

/**
 * Comments removed before a structural match, in the one uniform form used
 * across this repository (src/lib/config-shape.spec.ts). Deliberately
 * backslash-free. view.ts's own header comment names the vendored tree and the
 * protocol package - correctly, since explaining why they are absent is the
 * point - so a scan over raw source would go red on correct code.
 */
const stripComments = (text: string) =>
  text
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

const rgb = (literal: string) =>
  literal.split(",").map(Number) as [number, number, number];

/** Every colour value the catalog ships today, for the totality assertions. */
const colourValues = () => {
  const values = new Set<string>();
  for (const entry of CATALOG) {
    for (const knob of entry.knobs) {
      if (knob.kind === "colour") for (const v of knob.values) values.add(v);
    }
  }
  return values;
};

/** Every semitone set the catalog ships today. */
const scaleValues = () => {
  const values = new Set<string>();
  for (const entry of CATALOG) {
    for (const knob of entry.knobs) {
      if (knob.kind === "scale") for (const v of knob.values) values.add(v);
    }
  }
  return values;
};

describe("the tuning view seam (src/lib/tune/view.ts)", () => {
  it("restates the vendored KnobKind union exactly, and no more", () => {
    // The type-level half is above, at module scope. This is the runtime half:
    // the panel picks a widget from a `kind` STRING, so the list has to exist
    // at run time and it has to be the same list the catalog validates against.
    expect(KNOB_KIND_NAMES).toHaveLength(12);
    expect([...KNOB_KIND_NAMES].sort()).toEqual([...KNOB_KINDS].sort());
  });

  it("gives every one of the twelve kinds a widget, and falls through to a rail", () => {
    const widgets: KnobWidget[] = ["colour", "swatch", "words", "rail"];

    // THE WHOLE MAPPING, COMPARED AS ONE OBJECT (plan 10-10). The amendment
    // below moves ONE row, and "no other kind's mapping moved" is a claim
    // about the other eleven - so it is asserted as an equality over the whole
    // table rather than as a handful of spot checks that a twelfth kind could
    // slip past. Each kind is handed a value set that its own table cannot
    // name, so a kind that stopped consulting its values shows up here.
    const UNNAMEABLE: Readonly<Record<KnobKindName, readonly string[]>> = {
      colour: ["0,200,255", "255,90,0"],
      speed: ["240", "180", "110"],
      direction: ["x", "sideways"],
      size: ["1", "2", "3"],
      count: ["1", "2", "3"],
      note: ["24", "26", "28", "30", "32", "34", "36", "38", "40"],
      feel: ["0", "1"],
      amount: ["0", "1", "2"],
      mode: ["relative", "sideways"],
      bend: ["none", "sideways"],
      spring: ["off", "sideways"],
      scale: ["0,1,2", "0,1,3"],
    };
    const mapping = Object.fromEntries(
      KNOB_KIND_NAMES.map((kind) => [kind, widgetFor(kind, UNNAMEABLE[kind])]),
    );
    expect(
      mapping,
      "a kind's widget moved. `colour` is the picker BY KIND ALONE (X-05 / X-06 as plan 10-10 amends them); every other kind still consults its values and falls through to a rail when it cannot name them",
    ).toEqual({
      colour: "colour",
      speed: "rail",
      direction: "rail",
      size: "rail",
      count: "rail",
      note: "rail",
      feel: "rail",
      amount: "rail",
      mode: "rail",
      bend: "rail",
      spring: "rail",
      scale: "rail",
    });

    // Totality first: no knob can fail to render, whatever its kind and
    // whatever its values.
    let seen = 0;
    for (const kind of KNOB_KIND_NAMES) {
      expect(widgets, kind).toContain(widgetFor(kind, ["1", "2", "3"]));
      seen += 1;
    }
    expect(seen, "the loop ran over all twelve kinds").toBe(12);

    // Then the three rules.
    expect(widgetFor("colour", ["0,200,255", "255,90,0"])).toBe("colour");
    expect(widgetFor("scale", ["0,2,4,5,7,9,11", "0,2,3,5,7,8,10"])).toBe(
      "words",
    );
    expect(widgetFor("direction", ["x", "y", "diagonal"])).toBe("words");
    expect(widgetFor("mode", ["relative", "absolute"])).toBe("words");
    expect(widgetFor("bend", ["none", "x", "y"])).toBe("words");
    expect(widgetFor("spring", ["off", "centre", "zero"])).toBe("words");
    expect(widgetFor("note", ["24", "30", "36"])).toBe("words");
    expect(widgetFor("speed", ["240", "180", "110"])).toBe("rail");
    expect(widgetFor("amount", ["0", "1", "2"])).toBe("rail");

    // THE X-05 / X-06 AMENDMENT (10-UI-SPEC §11.2, plans 10-08 and 10-10):
    // `colour` is chosen by KIND ALONE. The two assertions this replaces
    // asserted the opposite - that a colour whose values are not RGB falls
    // through to a rail - and they were right for a six-swatch palette and
    // wrong for a 4,096-position lattice, where any rule that consults `n`
    // sends the colour knob to a single detent track: one 4,096-position rail,
    // which is exactly the picker that lies about what the pad can show. Kept
    // as assertions rather than deleted, with the verdict inverted, so the
    // change is visible in the suite rather than only in a diff.
    expect(
      widgetFor("colour", ["red"]),
      "a colour is chosen by kind alone, even when a value is not RGB",
    ).toBe("colour");
    expect(
      widgetFor("colour", ["0,200,255", "0,200,300"]),
      "a colour is chosen by kind alone, even with a channel outside 0..255",
    ).toBe("colour");
    expect(
      widgetFor("colour", []),
      "a colour is chosen by kind alone, even with no values at all",
    ).toBe("colour");
    // The lattice itself, at the size D-06 gives it. `n = 4096` must not move
    // the answer, which is the whole content of the amendment.
    expect(
      widgetFor(
        "colour",
        Array.from({ length: COLOUR_LATTICE_SIZE }, (_, i) => String(i)),
      ),
      "the 4,096-position lattice is still the colour widget",
    ).toBe("colour");

    // `swatch` is still a widget and it is no longer CHOSEN. ColourPicker
    // synthesises it for a hand-authored Lua palette and hands that view to
    // the shipped Knob.svelte swatch row; nothing else may produce it, or the
    // rack would draw a colour knob twice.
    expect(
      Object.values(mapping),
      "widgetFor still returns a swatch row for some kind - the picker owns that skin now",
    ).not.toContain("swatch");
  });

  it("skins a rail with dots at eight options and a track at nine", () => {
    expect(railSkin(2)).toBe("dots");
    expect(railSkin(8)).toBe("dots");
    expect(railSkin(9)).toBe("track");
    // The one n >= 9 knob shipped today: MIDI channel, sixteen values.
    expect(railSkin(16)).toBe("track");
  });

  it("carries the vendored EVENT_BUDGET, and reports it as the meter's limit", () => {
    expect(
      EVENT_BUDGET,
      "view.ts's budget literal has drifted from the vendored compiler's",
    ).toBe(VENDOR_EVENT_BUDGET);
    expect(meterView("setup", 702, "settled").limit).toBe(VENDOR_EVENT_BUDGET);
    expect(meterView("timer", 941, "settled").limit).toBe(VENDOR_EVENT_BUDGET);
    expect(meterView("timer", 0, "measuring").limit).toBe(VENDOR_EVENT_BUDGET);
    expect(meterView("timer", 218, "settled").event).toBe("timer");
  });

  it("floors the percentage inside the budget and ceils it outside", () => {
    // 100% means exactly at the limit and never means "nearly there".
    expect(percentOf(0)).toBe(0);
    expect(percentOf(702)).toBe(77);
    expect(percentOf(907)).toBe(99);
    expect(percentOf(908)).toBe(100);
    expect(percentOf(909)).toBe(101);
    expect(percentOf(941)).toBe(104);

    expect(meterView("setup", 908, "settled").over).toBe(false);
    expect(meterView("setup", 909, "settled").over).toBe(true);
    expect(meterView("setup", 909, "settled").state).toBe("over");
    expect(meterView("setup", 702, "settled").state).toBe("settled");
    expect(meterView("setup", 702, "stale").state).toBe("stale");
    // Staleness never applies while over budget: dimming a warning is wrong.
    expect(meterView("setup", 941, "stale").state).toBe("over");
    // A meter that has never measured cannot be over anything.
    expect(meterView("setup", 0, "measuring").state).toBe("measuring");
    expect(meterView("setup", 941, "measuring").over).toBe(false);
  });

  it("names notes and scales from the vocabulary the catalog and the compiler ship", () => {
    expect(noteName(24)).toBe("C1");
    expect(noteName(30)).toBe("F#1");
    expect(noteName(36)).toBe("C2");
    expect(noteName(60)).toBe("C4");
    for (let n = 0; n <= 127; n += 1) {
      // Sharps never flats. No sharp name carries a lower-case b, so a
      // lower-case b anywhere in the output is a flat that leaked in.
      expect(noteName(n), `note ${n}`).not.toContain("b");
    }

    // Derived from the catalog rather than restated, so a new entry with an
    // unlisted semitone set turns this red instead of silently rendering as a
    // rail.
    const sets = scaleValues();
    expect(sets.size, "the catalog ships scale knobs").toBeGreaterThanOrEqual(
      11,
    );
    for (const literal of sets) {
      expect(scaleWord(literal), literal).toBeTruthy();
    }

    // The compiler's own four, which arrive as bare words rather than sets.
    // The type-level tie is at module scope.
    for (const kind of SCALE_KINDS) {
      expect(scaleWord(kind), kind).toBeTruthy();
    }
    expect(scaleWord("0,2,4,5,7,9,11")).toBe("Major");
    expect(scaleWord("0,3,5,7,10")).toBe("Minor pentatonic");
    expect(scaleWord("0,1,2")).toBeUndefined();
  });

  it("names hues, and shows an integer readout only when every value is one integer", () => {
    // The five shipped swatch values, read off the catalog so the pairs below
    // cannot drift from what EUCLID actually offers.
    const ring = byId("euclid")?.knobs.find((k) => k.id === "ringColour");
    const shipped: readonly (readonly [string, string])[] = [
      ["0,200,255", "Cyan"],
      ["255,90,0", "Orange"],
      ["0,255,120", "Spring green"],
      ["255,255,255", "White"],
      ["120,0,255", "Violet"],
    ];
    expect(ring?.values).toEqual(shipped.map(([literal]) => literal));
    for (const [literal, word] of shipped) {
      expect(hueName(rgb(literal)), literal).toBe(word);
    }

    // The three neutrals, below 10% saturation.
    expect(hueName([255, 255, 255])).toBe("White");
    expect(hueName([128, 128, 128])).toBe("Grey");
    expect(hueName([0, 0, 0])).toBe("Black");

    // Totality over every colour the catalog ships, so a new entry cannot land
    // a swatch with no accessible name.
    const colours = colourValues();
    expect(colours.size, "the catalog ships colour knobs").toBeGreaterThan(5);
    for (const literal of colours) {
      expect(swatchOf(literal), literal).toBe(
        `rgb(${literal.split(",").join(" ")})`,
      );
      expect(hueName(rgb(literal)), literal).not.toBe("");
    }
    expect(swatchOf("red")).toBeUndefined();
    expect(swatchOf("0,200,300")).toBeUndefined();

    // The accessible names: a hue word plus a position, and a bare position
    // for a value with no display form.
    expect(swatchName("0,200,255", 0, 5)).toBe("Cyan, 1 of 5");
    expect(positionText(2, 6)).toBe("Position 3 of 6");

    // The integer readout. X-08: the raw literal, never reinterpreted - a MIDI
    // channel whose Lua literal is 0 displays 0.
    expect(integerReadout(["240", "180", "140", "110"], 3)).toBe("110");
    expect(integerReadout(["0", "1", "2"], 0)).toBe("0");
    expect(integerReadout(["3,5,7", "2,3,5"], 0)).toBeUndefined();
    expect(integerReadout(["21", "42", "wide"], 1)).toBeUndefined();
    expect(integerReadout(["21", "42"], 7)).toBeUndefined();
  });

  it("imports nothing at all", () => {
    // Not "no compiler ones" - nothing. Phase 4's chunk guard
    // (config-shape.spec.ts test 13) matches the SPECIFIER TEXT, so even
    // `import type { PadState } from "../../vendor/botor/_pad"` fails it, and
    // a component that names this module has to be safe by construction rather
    // than by review.
    const code = stripComments(source("./view.ts"));
    expect(code, "the file was actually read").toContain(
      "export function widgetFor",
    );
    expect(code).not.toContain('from "');
    expect(code).not.toContain("from '");
    expect(code).not.toContain("import(");
    expect(code).not.toContain("require(");
  });
});
