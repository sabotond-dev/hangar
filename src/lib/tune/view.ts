// The tuning panel's view seam: the types a component names, the rule that turns a knob into a
// widget, the meter arithmetic, the colour lattice for the picker and the readouts.
// This module imports nothing at all - not even `import type` - because config-shape.spec.ts test 13
// fails any file under src/lib/ui/ whose `from "..."` specifier names the vendored compiler, the
// protocol package or $lib/pad by SPECIFIER TEXT, and a component must be able to name this file
// freely (view.spec.ts asserts the zero-import shape). The split: view.ts (types and pure rules),
// copy.ts (every sentence), idle.ts (one shim), model.ts (the compiler side, reached only by
// `await import()`). Three facts are restated here as literals and held against their real source by
// a spec rather than imported: the twelve knob kinds and EVENT_BUDGET = 908 (view.spec.ts), and the
// colour lattice's arithmetic (colour-picker.spec.ts walks all 4,096 positions against `colourAt`).
// Decided at 05-04 (05-CONTEXT D-18) / 10-10 / 13-09; see .planning/phases/13-gui-overhaul/13-09-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

// ---------------------------------------------------------------------------
// The vocabulary.

/** The vendored compiler's `KnobKind` union, restated; view.spec.ts test 1 asserts both directions of `Exclude`. */
export type KnobKindName =
  | "colour"
  | "speed"
  | "direction"
  | "size"
  | "count"
  | "note"
  | "feel"
  | "amount"
  | "mode"
  | "bend"
  | "spring"
  | "scale";

/** The same twelve at run time, because a `kind` arrives as a string. */
export const KNOB_KIND_NAMES: readonly KnobKindName[] = [
  "colour",
  "speed",
  "direction",
  "size",
  "count",
  "note",
  "feel",
  "amount",
  "mode",
  "bend",
  "spring",
  "scale",
];

/**
 * Five names, four row skins and one picker. `swatch`, `words`, `select` and `rail` are what a KNOB
 * ROW can be, and `widgetFor` chooses between the last three; `colour` is the whole ColourPicker
 * block, rendered once per panel (10-UI-SPEC 11.2; behind a swatch and a popover since 13-09).
 * `widgetFor` never returns `swatch`: the picker synthesises it for a hand-authored Lua palette. A
 * worded knob with up to SEGMENTED_MAX options is the word row, one with more (up to WORD_ROW_MAX) a
 * `<select>` (13-09, a rendering change: no option moved, no stamp changed).
 */
export type KnobWidget = "colour" | "swatch" | "words" | "select" | "rail";

/** A rail's two skins: a dot per option, or a track with a thumb. */
export type RailSkin = "dots" | "track";

/** Above this many options a worded knob is a `<select>` rather than segmented radios (13-09, section 7). */
export const SEGMENTED_MAX = 4;
/** Above this many options a worded knob is a rail; the select's ceiling since 13-09 (view.spec.ts and tune-ui.spec.ts read the name). */
export const WORD_ROW_MAX = 8;
/** Above this many options a dot rail becomes a detent track. */
const DOT_RAIL_MAX = 8;

// ---------------------------------------------------------------------------
// The view types a component names.

/** One option on a knob, already resolved for display. */
export type KnobValueView = {
  /** What a word row prints, and what aria-valuetext says. Never a Lua literal. */
  label: string;
  /** "rgb(r g b)" for a swatch, undefined otherwise. */
  swatch?: string;
  /** The hue word plus position for a swatch's accessible name. */
  name?: string;
};

export type KnobView = {
  id: string;
  label: string;
  kind: KnobKindName;
  widget: KnobWidget;
  skin?: RailSkin;
  values: readonly KnobValueView[];
  index: number;
  default: number;
  /** The right-aligned integer, when every value is a single integer. */
  readout?: string;
  /**
   * The raw option literals, present exactly when `readout` is (every option a single integer, X-08),
   * so a typed field can map a number back to an index (13.1-07, D-09). Absent otherwise.
   */
  literals?: readonly string[];
};

/** Which of the two 908-character events a meter is showing. */
export type MeterEvent = "setup" | "timer";

/** The four states the UI spec draws. `over` is derived, never asked for. */
export type MeterState = "measuring" | "settled" | "stale" | "over";

/**
 * What the model can honestly report: no measurement has ever landed, the
 * current one is fresh, or a debounced recompile has not landed yet. "over" is
 * absent on purpose - it is a property of the number, not of the feed.
 */
export type MeterFeed = "measuring" | "settled" | "stale";

export type MeterView = {
  event: MeterEvent;
  used: number;
  limit: number;
  pct: number;
  over: boolean;
  state: MeterState;
};

export type TuneView = {
  entryId: string;
  knobs: readonly KnobView[];
  setup: MeterView;
  timer: MeterView;
};

// ---------------------------------------------------------------------------
// The word tables, transcribed verbatim from 05-UI-SPEC's "Word tables".

/**
 * Semitone-offset set -> mode name, plus the compiler's own four `ScaleKind` members. `as const`:
 * view.spec.ts asserts `Exclude<ScaleKind, keyof typeof SCALE_WORDS>` is `never`.
 */
export const SCALE_WORDS = {
  "0,2,4,5,7,9,11": "Major",
  "0,2,3,5,7,8,10": "Minor",
  "0,2,3,5,7,9,10": "Dorian",
  "0,2,4,5,7,9,10": "Mixolydian",
  "0,2,4,6,7,9,11": "Lydian",
  "0,1,3,5,7,8,10": "Phrygian",
  "0,3,5,7,10": "Minor pentatonic",
  "0,2,4,7,9": "Major pentatonic",
  "0,2,4,6,8": "Whole tone",
  "0,2,3,7,9": "Kumoi",
  "0,1,5,7,10": "Insen",
  chromatic: "Chromatic",
  major: "Major",
  minor: "Minor",
  pentatonic: "Pentatonic",
} as const;

/** The compiler's `Axis`, as directions a visitor can picture. */
const DIRECTION_WORDS = {
  x: "Across",
  y: "Down",
  diagonal: "Rising",
  antidiagonal: "Falling",
} as const;

/** The compiler's `DialMode`. */
const MODE_WORDS = {
  relative: "Relative",
  absolute: "Absolute",
} as const;

/** The compiler's `BendAxis`. */
const BEND_WORDS = {
  none: "No bend",
  x: "Left-right",
  y: "Up-down",
} as const;

/** The joystick's `spring` plus `springTo`, as one vocabulary. */
const SPRING_WORDS = {
  off: "Stays put",
  centre: "Springs to centre",
  zero: "Springs to zero",
} as const;

/** Sharps, never flats. C4 = 60. */
const NOTE_NAMES: readonly string[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

/**
 * Twelve 30-degree hue buckets, plus three neutrals below 10% saturation.
 * Index 0 is hue 0 and each step is 30 degrees.
 */
const HUE_NAMES: readonly string[] = [
  "Red",
  "Orange",
  "Amber",
  "Lime",
  "Green",
  "Spring green",
  "Cyan",
  "Azure",
  "Blue",
  "Violet",
  "Magenta",
  "Rose",
];

// ---------------------------------------------------------------------------
// The budget.

/** The per-event budget, restated from the vendored `EVENT_BUDGET`; view.spec.ts test 4 asserts the two equal, so it cannot drift. */
export const EVENT_BUDGET = 908;

// ---------------------------------------------------------------------------
// Pure rules.

const INTEGER = /^-?[0-9]+$/;

/** Parse "r,g,b" into three integers in 0..255, or undefined. */
function rgbOf(literal: string): readonly [number, number, number] | undefined {
  const parts = literal.split(",");
  if (parts.length !== 3) return undefined;
  const out: number[] = [];
  for (const part of parts) {
    const text = part.trim();
    if (!INTEGER.test(text)) return undefined;
    const n = Number.parseInt(text, 10);
    if (n < 0 || n > 255) return undefined;
    out.push(n);
  }
  return [out[0], out[1], out[2]];
}

/**
 * The mode name for a `scale` value, or undefined when the set is not in the
 * table - which is what sends the knob to a rail.
 */
export function scaleWord(literal: string): string | undefined {
  return (SCALE_WORDS as Readonly<Record<string, string>>)[literal];
}

/**
 * The scientific pitch name for a MIDI note. C4 = 60, sharps never flats.
 * `NAMES[n % 12] + (floor(n / 12) - 1)`.
 */
export function noteName(midi: number): string {
  const n = Math.trunc(midi);
  const index = ((n % 12) + 12) % 12;
  return `${NOTE_NAMES[index]}${Math.floor(n / 12) - 1}`;
}

/**
 * The display word for one value of one kind, or undefined when the kind has
 * no table or the value is not in it. `widgetFor` uses this to decide whether
 * a word row is even possible; the fall-through to a rail is the answer when
 * it is not.
 */
export function wordFor(
  kind: KnobKindName,
  literal: string,
): string | undefined {
  const table: Readonly<Record<string, string>> | undefined =
    kind === "scale"
      ? SCALE_WORDS
      : kind === "direction"
        ? DIRECTION_WORDS
        : kind === "mode"
          ? MODE_WORDS
          : kind === "bend"
            ? BEND_WORDS
            : kind === "spring"
              ? SPRING_WORDS
              : undefined;
  if (table) return table[literal];
  if (kind === "note") {
    return INTEGER.test(literal)
      ? noteName(Number.parseInt(literal, 10))
      : undefined;
  }
  return undefined;
}

/** The kinds a word row is offered to BY NAME, because they have a table; a knob of any kind with at most two integers gets one too (12-05). */
const WORD_KINDS: readonly KnobKindName[] = [
  "direction",
  "mode",
  "bend",
  "spring",
  "scale",
  "note",
];

/**
 * The widget rule, and it is TOTAL: every kind and every value set resolves to one widget, and the
 * fall-through is a rail, where position is always meaningful. `colour` is chosen by `kind` ALONE
 * (X-05 / X-06; 10-08, 10-10): a colour knob carries `n = 4096` and any rule that consulted `n`
 * would send it to a 4,096-position rail; the widget is the picker at any `n`. A knob with at most
 * two INTEGER values renders as words, kind-blind (12-05: NINE PADS' `Pads` at `9` and `16` was a
 * two-dot rail nobody saw); the test is whether a label exists, which is what X-05 permits.
 */
/** Two. Above this an integer knob is a rail, where position carries meaning. */
export const INTEGER_WORD_ROW_MAX = 2;

export function widgetFor(
  kind: KnobKindName,
  values: readonly string[],
): KnobWidget {
  if (kind === "colour") return "colour";
  if (WORD_KINDS.includes(kind)) {
    const fits = values.length > 0 && values.length <= WORD_ROW_MAX;
    if (!fits || !values.every((v) => wordFor(kind, v) !== undefined)) {
      return "rail";
    }
    // The 4/5 boundary (13-09): a row of segmented radios up to four worded
    // options, a select from five to eight. Rendering only (13-09).
    return values.length <= SEGMENTED_MAX ? "words" : "select";
  }
  if (
    values.length > 0 &&
    values.length <= INTEGER_WORD_ROW_MAX &&
    values.every((v) => INTEGER.test(v))
  ) {
    return "words";
  }
  return "rail";
}

/**
 * The KNOB POSITION a view is at: the one named door between a view's coordinate system and the
 * knob's. The identity for every knob today (10-10 removed the two-swatch window whose slot 0 was
 * once reported for lattice position 95), and model.spec.ts asserts it for every knob on every view.
 * The picker's own door is `colourPosition` (a detent is 0..15, a position 0..4095).
 */
export function knobPosition(view: KnobView): number {
  return view.index;
}

/** A dot per option up to eight; a detent track from nine. */
export function railSkin(n: number): RailSkin {
  return n <= DOT_RAIL_MAX ? "dots" : "track";
}

// ---------------------------------------------------------------------------
// The colour lattice, restated for the picker (D-06, 10-UI-SPEC 11.2): the real arithmetic is
// knobs.preset.ts's `colourAt` / `colourIndexOf` through the vendored `quantiseColour`, which this
// file may not import; colour-picker.spec.ts holds every function below against it over all 4,096.

/** Sixteen detents per rail. Three rails span 16^3 = 4,096 and no more. */
export const COLOUR_RAIL_STEPS = 16;
/** 255 / 15: `quantiseColour` snaps every stored channel to a multiple of 17 (`src/vendor/botor/_pad.ts:490-493`). */
export const COLOUR_RAIL_STEP = 17;
/** 4,096. The whole reachable colour space, not a sample of it. */
export const COLOUR_LATTICE_SIZE =
  COLOUR_RAIL_STEPS * COLOUR_RAIL_STEPS * COLOUR_RAIL_STEPS;

/** The three rails, in the order they are drawn and in the order of the bits. */
export type ColourChannel = "r" | "g" | "b";
export const COLOUR_CHANNELS: readonly ColourChannel[] = ["r", "g", "b"];

const clampLevel = (level: number) =>
  Math.min(
    COLOUR_RAIL_STEPS - 1,
    Math.max(0, Math.trunc(Number.isFinite(level) ? level : 0)),
  );

const clampPosition = (position: number) =>
  Math.min(
    COLOUR_LATTICE_SIZE - 1,
    Math.max(0, Math.trunc(Number.isFinite(position) ? position : 0)),
  );

/** A lattice position -> its three rail LEVELS, red first. */
export function colourLevels(
  position: number,
): readonly [number, number, number] {
  const i = clampPosition(position);
  return [(i >> 8) & 15, (i >> 4) & 15, i & 15];
}

/** Three rail levels -> the lattice position: the picker's `knobPosition`, the one door upward. */
export function colourPosition(
  levels: readonly [number, number, number],
): number {
  return (
    (clampLevel(levels[0]) << 8) |
    (clampLevel(levels[1]) << 4) |
    clampLevel(levels[2])
  );
}

/** A rail level -> its stored channel value. Exactly `level * 17`, never a round. */
export function colourChannel(level: number): number {
  return clampLevel(level) * COLOUR_RAIL_STEP;
}

/**
 * "102, 102, 102" - the three STORED integers, what a rail's `aria-valuetext` announces. Never a hex
 * (a resolution the pad cannot reach); the spaces after the commas make a screen reader read three numbers.
 */
export function colourValueText(position: number): string {
  return colourLevels(position).map(colourChannel).join(", ");
}

/**
 * How many characters `glc(a, layer, r, g, b, 1)` spends on this colour: three decimal literals and
 * two commas. The whole lattice is worth six characters (`0,0,0` five, `102,102,102` eleven).
 */
export function colourLiteralLength(position: number): number {
  return colourLevels(position).reduce(
    (sum, level) => sum + String(colourChannel(level)).length,
    2,
  );
}

/**
 * The cheap-step rule, derived from the literal: a channel literal of one or two digits (`0`, `17`
 * to `85`), plus `255` at the top of the rail so full brightness is marked too.
 */
export function colourCheapLevel(level: number): boolean {
  const value = colourChannel(level);
  return String(value).length <= 2 || value === 255;
}

/**
 * What the picker may spend, or `undefined` before anything has measured: `free` is the characters
 * left on the tighter event; `copies` how many times the script writes the literal (two on `ninepads`).
 */
export type ColourBudget = { free: number; copies: number };

/**
 * One detent of one rail, fully resolved: where it sits, what colour it is,
 * whether it is a cheap step, and whether it fits.
 */
export type ColourDetent = {
  /** 0..15 along this rail. */
  level: number;
  /** The lattice position this detent composes to, with the other two rails held. */
  position: number;
  /** The three stored channel values of that position. */
  rgb: readonly [number, number, number];
  cheap: boolean;
  /**
   * False when this colour's literal would push the state past 908. Measured at zero on today's shelf
   * (`ninepads` is the dearest at 640 of 908); the guard ships because it makes the claim checkable.
   */
  affordable: boolean;
};

/**
 * One rail, resolved: sixteen detents of `axis`, each painted in the colour it would produce GIVEN
 * THE OTHER TWO RAILS WHERE THEY STAND - sixteen discrete storable colours, not a gradient.
 */
export function colourRail(
  axis: 0 | 1 | 2,
  position: number,
  budget?: ColourBudget,
): readonly ColourDetent[] {
  const current = colourLevels(position);
  const currentLength = colourLiteralLength(position);
  return Array.from({ length: COLOUR_RAIL_STEPS }, (_, level) => {
    const levels: [number, number, number] = [...current];
    levels[axis] = level;
    const at = colourPosition(levels);
    return {
      level,
      position: at,
      rgb: [
        colourChannel(levels[0]),
        colourChannel(levels[1]),
        colourChannel(levels[2]),
      ] as const,
      cheap: colourCheapLevel(level),
      affordable:
        budget === undefined ||
        (colourLiteralLength(at) - currentLength) * budget.copies <=
          budget.free,
    };
  });
}

/**
 * The highest level a rail's `<input type="range">` may reach. An unaffordable detent is still painted
 * (in `--color-workspace` behind a hairline) so the rail keeps its shape; the control's `max` is what
 * stops there. The unaffordable set is always a suffix: a channel's digit count is monotonic in its level.
 */
export function colourRailMax(rail: readonly ColourDetent[]): number {
  let top = 0;
  for (const detent of rail) {
    if (!detent.affordable) break;
    top = detent.level;
  }
  return top;
}

/**
 * True when this colour knob carries the whole lattice rather than a hand-authored palette. Not widget
 * selection (that is by kind alone): the picker asking what it holds. A Lua entry's colour knob is the
 * four or five literals its author wrote, so the picker shows it the shipped swatch row instead;
 * widening the Lua route onto the lattice is deferred-items.md item 3.
 */
export function isColourLattice(values: readonly unknown[]): boolean {
  return values.length === COLOUR_LATTICE_SIZE;
}

/** The percentage, floored inside the budget and ceiled outside it: 907 reads 99, 908 100, 909 101. */
export function percentOf(used: number): number {
  const raw = (used / EVENT_BUDGET) * 100;
  return used > EVENT_BUDGET ? Math.ceil(raw) : Math.floor(raw);
}

/** One meter, resolved. `over` is derived from the number and outranks staleness; a meter that never measured is not over. */
export function meterView(
  event: MeterEvent,
  used: number,
  feed: MeterFeed,
): MeterView {
  const over = feed !== "measuring" && used > EVENT_BUDGET;
  return {
    event,
    used,
    limit: EVENT_BUDGET,
    pct: percentOf(used),
    over,
    state: over ? "over" : feed,
  };
}

// ---------------------------------------------------------------------------
// Readouts. The pad above the panel is the readout; these are the exceptions.

/** The CSS colour for a swatch, or undefined when the value is not RGB. */
export function swatchOf(literal: string): string | undefined {
  const rgb = rgbOf(literal);
  return rgb ? `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})` : undefined;
}

/**
 * The hue word for a swatch's accessible name. Twelve 30-degree buckets, with
 * three neutrals below 10% saturation: White above 80% lightness, Grey above
 * 20%, otherwise Black.
 */
export function hueName(rgb: readonly [number, number, number]): string {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  if (saturation < 0.1) {
    if (lightness > 0.8) return "White";
    if (lightness > 0.2) return "Grey";
    return "Black";
  }

  let hue: number;
  if (max === r) hue = 60 * (((g - b) / delta) % 6);
  else if (max === g) hue = 60 * ((b - r) / delta + 2);
  else hue = 60 * ((r - g) / delta + 4);
  if (hue < 0) hue += 360;

  return HUE_NAMES[Math.round(hue / 30) % 12];
}

/** "Position 3 of 6" - the accessible name for a value with no display form. */
export function positionText(index: number, n: number): string {
  return `Position ${index + 1} of ${n}`;
}

/** "Cyan, 1 of 5" - a swatch's accessible name, or undefined if not RGB. */
export function swatchName(
  literal: string,
  index: number,
  n: number,
): string | undefined {
  const rgb = rgbOf(literal);
  if (!rgb) return undefined;
  return `${hueName(rgb)}, ${index + 1} of ${n}`;
}

/**
 * The right-aligned integer beside a rail when every value on that knob is a single integer, nothing
 * otherwise. Returned RAW, never reinterpreted (X-08): a zero-based MIDI channel displays `0`.
 */
export function integerReadout(
  values: readonly string[],
  index: number,
): string | undefined {
  if (index < 0 || index >= values.length) return undefined;
  if (!values.every((v) => INTEGER.test(v))) return undefined;
  return values[index];
}

/**
 * The other direction of `integerReadout` (13.1-07, D-09): the index of a TYPED literal in a knob's
 * closed list, or undefined. Trimmed and compared as a number (`074` finds `74`); never clamped,
 * rounded or snapped, because X-08 forbids renumbering what is about to be written to hardware.
 */
export function typedIndex(
  literals: readonly string[],
  text: string,
): number | undefined {
  const typed = text.trim();
  if (!INTEGER.test(typed)) return undefined;
  const n = Number.parseInt(typed, 10);
  const at = literals.findIndex(
    (literal) => INTEGER.test(literal) && Number.parseInt(literal, 10) === n,
  );
  return at < 0 ? undefined : at;
}

/**
 * The bounds of a CONTIGUOUS integer run (`["0", ..., "15"]` gives `{ min: 0, max: 15 }`), or
 * undefined when the literals are not integers, are empty or skip a number (Arc's `cc`).
 */
export function integerRun(
  literals: readonly string[],
): { min: number; max: number } | undefined {
  if (literals.length === 0) return undefined;
  if (!literals.every((literal) => INTEGER.test(literal))) return undefined;
  const first = Number.parseInt(literals[0], 10);
  for (let at = 1; at < literals.length; at++) {
    if (Number.parseInt(literals[at], 10) !== first + at) return undefined;
  }
  return { min: first, max: first + literals.length - 1 };
}
