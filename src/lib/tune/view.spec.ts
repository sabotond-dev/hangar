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
import { COLOUR_LATTICE_SIZE, presetKnobs } from "./knobs.preset";
import {
  EVENT_BUDGET,
  INTEGER_WORD_ROW_MAX,
  KNOB_KIND_NAMES,
  NOTE_SELECT_MAX,
  SCALE_WORDS,
  SEGMENT_CHARS_MAX,
  hueName,
  integerReadout,
  meterView,
  nearestRung,
  noteName,
  percentOf,
  positionText,
  rankOf,
  scaleWord,
  splitUnit,
  swatchName,
  swatchOf,
  valueOrder,
  widgetFor,
  wordFor,
  type KnobKindName,
  type KnobWidget,
} from "./view";
import { stripComments } from "../../test-support/source";

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

  it("gives every one of the twelve kinds a widget, and falls through to a select of positions", () => {
    // Five since change 16 (2026-09-21): `stepper` is the typed field over an
    // integer ladder (and a note ladder past NOTE_SELECT_MAX), `select` the
    // worded knob at five options and above AND the total fall-through for a
    // value set nothing can name; the 4/5 boundary is asserted in
    // src/lib/ui/tune-ui.spec.ts, beside the component. No rail anywhere.
    const widgets: KnobWidget[] = [
      "colour",
      "swatch",
      "words",
      "select",
      "stepper",
    ];

    // THE WHOLE MAPPING, COMPARED AS ONE OBJECT (plan 10-10). Each kind is
    // handed a value set that its own table cannot name, so a kind that
    // stopped consulting its values shows up here. Three rows moved at change
    // 16 and the rest are what they were in kind: three integers are a
    // stepper now (a rail until then), two integers a word row (12-05), a
    // scale set the table lacks reads as its semitones (a list of integers is
    // a word), and two words nothing names are a select of positions.
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
      "a kind's widget moved. `colour` is the picker BY KIND ALONE (X-05 / X-06 as plan 10-10 amends them); a knob of ANY kind whose values are at most two integers is a word row (plan 12-05); more integers are a stepper (change 16); a worded set is a row to four and a select above; a note ladder is a select to twenty-four; anything nothing can name is a select of positions",
    ).toEqual({
      colour: "colour",
      speed: "stepper",
      direction: "select",
      size: "stepper",
      count: "stepper",
      // Nine note names: a select, not a rail (change 16).
      note: "select",
      // Two integers, and the rule is kind-blind (12-05).
      feel: "words",
      amount: "stepper",
      mode: "select",
      bend: "select",
      spring: "select",
      // Two semitone lists read as their numbers (change 16's list rule).
      scale: "words",
    });

    // Totality first: no knob can fail to render, whatever its kind and
    // whatever its values - and an EMPTY value set resolves too.
    let seen = 0;
    for (const kind of KNOB_KIND_NAMES) {
      expect(widgets, kind).toContain(widgetFor(kind, ["1", "2", "3"]));
      expect(widgets, `${kind} on no values`).toContain(widgetFor(kind, []));
      seen += 1;
    }
    expect(seen, "the loop ran over all twelve kinds").toBe(12);

    // Then the rules, on the tables' own words.
    expect(widgetFor("colour", ["0,200,255", "255,90,0"])).toBe("colour");
    expect(widgetFor("scale", ["0,2,4,5,7,9,11", "0,2,3,5,7,8,10"])).toBe(
      "words",
    );
    expect(widgetFor("direction", ["x", "y", "diagonal"])).toBe("words");
    expect(widgetFor("mode", ["relative", "absolute"])).toBe("words");
    expect(widgetFor("bend", ["none", "x", "y"])).toBe("words");
    // Three words, 41 characters: the segmented row would wrap, so a select (SEGMENT_CHARS_MAX).
    expect(SEGMENT_CHARS_MAX).toBe(40);
    expect(widgetFor("spring", ["off", "centre", "zero"])).toBe("select");
    expect(widgetFor("spring", ["off", "centre"])).toBe("words");
    expect(widgetFor("note", ["24", "30", "36"])).toBe("words");
    expect(widgetFor("speed", ["240", "180", "110"])).toBe("stepper");
    expect(widgetFor("amount", ["0", "1", "2"])).toBe("stepper");
    // A note ladder: a select to NOTE_SELECT_MAX, typed above it.
    const notes = (n: number) =>
      Array.from({ length: n }, (_, i) => String(24 + i));
    expect(NOTE_SELECT_MAX).toBe(24);
    expect(widgetFor("note", notes(NOTE_SELECT_MAX))).toBe("select");
    expect(widgetFor("note", notes(NOTE_SELECT_MAX + 1))).toBe("stepper");
    expect(widgetFor("note", notes(128))).toBe("stepper");
    // STARFIELD's edge reads Soft / Hard (change 16's feel table), a row of two.
    expect(widgetFor("feel", ["soft", "hard"])).toBe("words");
    expect(wordFor("feel", "soft")).toBe("Soft");

    // THE X-05 / X-06 AMENDMENT (10-UI-SPEC §11.2, plans 10-08 and 10-10):
    // `colour` is chosen by KIND ALONE, whatever the values.
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
    expect(
      widgetFor(
        "colour",
        Array.from({ length: COLOUR_LATTICE_SIZE }, (_, i) => String(i)),
      ),
      "the 4,096-position lattice is still the colour widget",
    ).toBe("colour");

    // `swatch` is still a widget and it is no longer CHOSEN. ColourPicker
    // synthesises it for a hand-authored Lua palette and hands that view to
    // the shipped Knob.svelte swatch row; nothing else may produce it.
    expect(
      Object.values(mapping),
      "widgetFor still returns a swatch row for some kind - the picker owns that skin now",
    ).not.toContain("swatch");
  });

  it("gives a two-valued integer knob a word row, and PINWHEEL's arms a stepper", () => {
    // THE BENCH NOTE THIS ANSWERS is NINE PADS' "make a 16 pads cause nothing
    // changed" (12-01, 12-05): `grid` is a `count` knob with the two values
    // `9` and `16`, a row of two words. Above two integers the position on
    // the ladder carries meaning and the stepper draws it (change 16).
    const grid = presetKnobs("ninepads").find((knob) => knob.id === "grid");
    expect(grid, "ninepads still declares a grid knob").toBeDefined();
    expect(grid!.options, "its two values are the pad counts").toEqual([
      "9",
      "16",
    ]);
    expect(
      widgetFor(grid!.kind, grid!.options),
      "NINE PADS' Pads knob is a word row",
    ).toBe("words");
    expect(
      grid!.default,
      "and the card ships at 4x4, which is index 1 (plan 12-05)",
    ).toBe(1);

    // THREE integer values is a stepper. PINWHEEL's `arms` is the shipped
    // knob that proves it - same `count` kind, three values.
    const arms = presetKnobs("pinwheel").find((knob) => knob.id === "arms");
    expect(arms, "pinwheel still declares an arms knob").toBeDefined();
    expect(arms!.options.length, "arms has three values").toBe(3);
    expect(
      arms!.options.every((v) => /^-?[0-9]+$/.test(v)),
      "and all three are integers, so only the CEILING keeps it off the word row",
    ).toBe(true);
    expect(
      widgetFor(arms!.kind, arms!.options),
      "PINWHEEL's arms is a stepper: one arm, two arms, three arms is an ORDER, and the ladder shows an order",
    ).toBe("stepper");

    // STARFIELD's `edge` (`feel`, "soft" / "hard") is a row of two words since
    // change 16 - the two literals have a table now - where it was a rail of
    // two unnamed dots before.
    const edge = presetKnobs("starfield").find((knob) => knob.id === "edge");
    expect(edge, "starfield still declares an edge knob").toBeDefined();
    expect(edge!.options).toEqual(["soft", "hard"]);
    expect(widgetFor(edge!.kind, edge!.options)).toBe("words");
    expect(edge!.options.map((v) => wordFor(edge!.kind, v))).toEqual([
      "Soft",
      "Hard",
    ]);

    // AND THE RULE ITSELF: the ceiling, and that it is chosen KIND-BLIND.
    expect(INTEGER_WORD_ROW_MAX, "the rule's ceiling is two").toBe(2);
    for (const kind of ["count", "size", "amount", "speed"] as const) {
      expect(
        widgetFor(kind, ["9", "16"]),
        `${kind}: two integer values must render as words`,
      ).toBe("words");
      expect(
        widgetFor(kind, ["9", "16", "25"]),
        `${kind}: three integer values are a stepper`,
      ).toBe("stepper");
    }
  });

  it("the stepper's arithmetic: a typed value snaps to the nearest declared rung, the boxes walk the rungs in value order, and a label's parenthetical is its unit", () => {
    // THE ONE HARD RULE OF CHANGE 16. The budget is measured over each knob's
    // declared rungs at the RGB444 corner, so a typed value lands on a rung
    // and never between two. SNAKE's step time is declared descending
    // (300 220 160 110) and is the witness: 100 snaps to 110 (index 3), 300
    // to 300, 1000 to the top rung, a tie to the lower value.
    const snake = ["300", "220", "160", "110"];
    expect(nearestRung(snake, "100")).toBe(3);
    expect(nearestRung(snake, "115")).toBe(3);
    expect(nearestRung(snake, "300")).toBe(0);
    expect(nearestRung(snake, "1000"), "past the top lands on the top").toBe(0);
    expect(nearestRung(snake, "-5"), "past the foot lands on the foot").toBe(3);
    expect(nearestRung(snake, "190"), "a tie goes to the lower value").toBe(2);
    expect(nearestRung(snake, " 221 ")).toBe(1);
    expect(nearestRung(snake, "2.2e2"), "not a plain number").toBeUndefined();
    expect(nearestRung(snake, "fast")).toBeUndefined();
    expect(nearestRung(snake, "")).toBeUndefined();
    expect(nearestRung([], "1")).toBeUndefined();
    expect(
      nearestRung(["soft", "hard"], "1"),
      "a ladder with a rung that is not a number snaps nothing",
    ).toBeUndefined();
    // A decimal typed against integers snaps too: 22.5 is 20's.
    expect(nearestRung(["20", "40", "60", "85"], "22.5")).toBe(0);

    // VALUE ORDER: the declared indices sorted by value, equal values in
    // declared order, a non-number anywhere leaving the declared order.
    expect(valueOrder(snake)).toEqual([3, 2, 1, 0]);
    expect(valueOrder(["15", "20", "25", "50", "1", "5"])).toEqual([
      4, 5, 0, 1, 2, 3,
    ]);
    expect(valueOrder(["1", "1", "0"])).toEqual([2, 0, 1]);
    expect(valueOrder(["soft", "hard"])).toEqual([0, 1]);
    expect(valueOrder([])).toEqual([]);
    expect(rankOf(valueOrder(snake), 0), "300 is the top rung").toBe(3);
    expect(rankOf(valueOrder(snake), 3), "110 is the foot").toBe(0);
    expect(rankOf([2, 0, 1], 9), "an index off the ladder ranks 0").toBe(0);

    // THE UNIT: `Tempo (BPM)` splits; a bare label has none; only a TRAILING
    // parenthetical counts, and it is trimmed.
    expect(splitUnit("Tempo (BPM)")).toEqual({ label: "Tempo", unit: "BPM" });
    expect(splitUnit("Step time (ms)")).toEqual({
      label: "Step time",
      unit: "ms",
    });
    expect(splitUnit("Speed")).toEqual({ label: "Speed" });
    expect(splitUnit("  Loop length ( points ) ")).toEqual({
      label: "Loop length",
      unit: "points",
    });
    expect(splitUnit("Ring (1) colour")).toEqual({ label: "Ring (1) colour" });

    // THE ID-KEYED WORDS (change 16): a boolean under `mode` is Internal /
    // External for `sync` and On / Off otherwise (TRACKPAD's edge flash no
    // longer reads External); QUADRANT's fill, STAGE's modifier and the two
    // HID key knobs have tables of their own; CHORUS's `key` is a note.
    expect(wordFor("mode", "true", "sync")).toBe("External");
    expect(wordFor("mode", "false", "sync")).toBe("Internal");
    expect(wordFor("mode", "true", "flash")).toBe("On");
    expect(wordFor("mode", "false")).toBe("Off");
    expect(wordFor("mode", "1", "fill")).toBe("Colour and fill");
    expect(wordFor("mode", "224", "modifier")).toBe("Ctrl");
    expect(wordFor("mode", "0", "modifier")).toBe("None");
    expect(wordFor("mode", "0", "inversion")).toBe("Off");
    expect(wordFor("note", "104", "key")).toBe("F13");
    expect(wordFor("note", "30", "key")).toBe("1");
    expect(wordFor("note", "48", "key")).toBe("C3");
    expect(wordFor("note", "16")).toBe("E0");
    expect(wordFor("count", "82", "arms"), "ARC's arms").toBe("2");
    expect(wordFor("count", "2", "arms"), "PINWHEEL's arms").toBeUndefined();
    expect(wordFor("amount", "3", "dim"), "CULL's legend").toBe("50%");
    expect(wordFor("spring", "512", "spring"), "WHEELS' spring").toBe("320 ms");
    expect(wordFor("spring", "centre", "spring"), "the joystick's").toBe(
      "Springs to centre",
    );
    // A comma list of integers is a word: ORBIT's pulse sets, QUADRANT's
    // palettes as their hue words.
    expect(wordFor("count", "3,5,7,11")).toBe("3, 5, 7, 11");
    expect(
      wordFor("mode", "255,140,0,0,200,255,0,255,120,255,0,180", "hue"),
    ).toBe("Orange, Cyan, Spring green, Rose");
    expect(wordFor("scale", "0,1,2")).toBe("0, 1, 2");
    expect(wordFor("colour", "0,200,255"), "a colour is never worded").toBe(
      undefined,
    );
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
    // cannot drift from what ORBIT actually offers (its four ring knobs share one palette).
    const ring = byId("orbit")?.knobs.find((k) => k.id === "ring1Colour");
    const shipped: readonly (readonly [string, string])[] = [
      ["0,200,255", "Cyan"],
      ["255,90,0", "Orange"],
      ["0,255,120", "Spring green"],
      ["255,255,255", "White"],
      ["120,0,255", "Violet"],
    ];
    // Change 19: the five are the knob's palette and its first five rungs; the lattice follows.
    expect(ring?.palette).toEqual(shipped.map(([literal]) => literal));
    expect(ring?.values.slice(0, 5)).toEqual(
      shipped.map(([literal]) => literal),
    );
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
