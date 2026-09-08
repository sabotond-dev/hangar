// The tuning panel's view seam: the types a component names, the rule that
// turns a knob into a widget, the meter arithmetic and the readouts.
//
// THIS MODULE IMPORTS NOTHING. Not the vendored compiler, not
// @intechstudio/grid-protocol, not $lib/pad, not $lib/catalog - and not even
// `import type`. That is not tidiness, it is the shape D-18 forced:
// src/lib/config-shape.spec.ts's front-door guard strips comments from every
// non-spec file under src/lib/ui/ and fails on any `from "..."` specifier
// containing `vendor`, `intechstudio` or `lib/pad`. It matches the SPECIFIER
// TEXT, so a type-only import of the compiler fails it exactly as a value
// import would. The guard exists because the vendored compiler pulls a
// 131,101-byte protocol chunk onto the critical path of a page whose whole job
// is to paint in under two seconds.
//
// So the split is:
//
//   src/lib/tune/view.ts   <- this file. Plain types and pure rules, zero
//                             imports. A component may name it freely.
//   src/lib/tune/copy.ts   <- every sentence. Zero imports.
//   src/lib/tune/idle.ts   <- one browser shim. Zero imports.
//   src/lib/tune/model.ts  <- the compiler side. Reached ONLY by await import().
//
// WHAT IS RESTATED HERE, AND WHAT HOLDS IT HONEST. Three facts belong to the
// vendored compiler and are written below as literals rather than imported:
// the twelve knob kinds, EVENT_BUDGET = 908, and the words the compiler already
// writes for its own scales, axes and switches. Every one of them is asserted
// against its real source in view.spec.ts - a type-level Exclude over the
// vendored KnobKind and ScaleKind unions, a runtime equality against the
// catalog's KNOB_KINDS, and a runtime equality against the vendored
// EVENT_BUDGET. That is the src/lib/protocol-pin.ts and
// src/lib/catalog/front-door.ts pattern: a literal held against another source
// by a spec, rather than an import that costs a chunk.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

// ---------------------------------------------------------------------------
// The vocabulary.

/**
 * The vendored compiler's `KnobKind` union, restated. view.spec.ts test 1
 * asserts both directions of `Exclude` against the real union, so a member
 * added or removed upstream stops `npm run check` compiling.
 */
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
 * Four names, three row skins and one picker.
 *
 * `swatch`, `words` and `rail` are what a KNOB ROW can be, and `widgetFor`
 * chooses between the last two. `colour` is the fourth, and it is not a row at
 * all: it is the whole ColourPicker block, which the rack renders ONCE per
 * panel however many colour knobs an entry declares (10-UI-SPEC §11.2).
 *
 * `widgetFor` never returns `swatch` any more. The picker synthesises it for
 * the one case that still needs it - a hand-authored Lua palette, whose four
 * or five literals cannot be reached from three sixteen-detent rails - and
 * hands that view to the SHIPPED `Knob.svelte` swatch row rather than drawing
 * a second one. See ColourPicker.svelte's header.
 */
export type KnobWidget = "colour" | "swatch" | "words" | "rail";

/** A rail's two skins: a dot per option, or a track with a thumb. */
export type RailSkin = "dots" | "track";

/** Above this many options a word row will not fit, and a rail is used. */
export const WORD_ROW_MAX = 8;
/** Above this many options a dot rail becomes a detent track. */
export const DOT_RAIL_MAX = 8;

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
 * Semitone-offset set -> mode name, plus the compiler's own four `ScaleKind`
 * members, which arrive as bare words rather than sets.
 *
 * `as const` on purpose: view.spec.ts asserts
 * `Exclude<ScaleKind, keyof typeof SCALE_WORDS>` is `never`, which needs the
 * keys to be literal types.
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
export const DIRECTION_WORDS = {
  x: "Across",
  y: "Down",
  diagonal: "Rising",
  antidiagonal: "Falling",
} as const;

/** The compiler's `DialMode`. */
export const MODE_WORDS = {
  relative: "Relative",
  absolute: "Absolute",
} as const;

/** The compiler's `BendAxis`. */
export const BEND_WORDS = {
  none: "No bend",
  x: "Left-right",
  y: "Up-down",
} as const;

/** The joystick's `spring` plus `springTo`, as one vocabulary. */
export const SPRING_WORDS = {
  off: "Stays put",
  centre: "Springs to centre",
  zero: "Springs to zero",
} as const;

/** Sharps, never flats. C4 = 60. */
export const NOTE_NAMES: readonly string[] = [
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
export const HUE_NAMES: readonly string[] = [
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

/**
 * The per-event character budget, restated from the vendored compiler's
 * `EVENT_BUDGET`. view.spec.ts test 4 asserts the two are equal, so this
 * number cannot drift from the one the minifier is actually measured against.
 */
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

/** The kinds a word row is even offered to. Everything else is a rail. */
const WORD_KINDS: readonly KnobKindName[] = [
  "direction",
  "mode",
  "bend",
  "spring",
  "scale",
  "note",
];

/**
 * The widget rule, and it is TOTAL: every kind and every value set resolves to
 * one of three widgets, so no knob can ever fail to render.
 *
 * A `scale` whose semitone set is not in the table, a `note` with more than
 * eight options and every kind with no table of its own all fall through to a
 * rail. That fall-through is the design, not a safety net: a rail always works,
 * because position is always meaningful.
 *
 * THE X-05 / X-06 AMENDMENT, BY NAME (10-UI-SPEC §11.2, plans 10-08 and
 * 10-10). X-05 and X-06 say widget selection is "chosen by `kind` and by `n`,
 * never per configuration". `colour` is chosen by `kind` ALONE. The reason is
 * not tidiness: under D-06 a colour knob carries `n = 4096`, and any rule that
 * consults `n` sends it to a single detent track - one 4,096-position rail,
 * which is precisely the picker that lies about what the pad can show. The
 * colour widget is the PICKER at any `n`. Every other kind's mapping is
 * untouched, and `view.spec.ts` compares the whole mapping rather than the one
 * row that moved.
 *
 * The old `values.every(v => rgbOf(v) !== undefined)` guard is gone with it.
 * It was a per-configuration test - exactly what X-05 forbids - and at 4,096
 * options it would have walked the whole lattice on every render to conclude
 * what the kind already says.
 */
export function widgetFor(
  kind: KnobKindName,
  values: readonly string[],
): KnobWidget {
  if (kind === "colour") return "colour";
  if (WORD_KINDS.includes(kind)) {
    const fits = values.length > 0 && values.length <= WORD_ROW_MAX;
    return fits && values.every((v) => wordFor(kind, v) !== undefined)
      ? "words"
      : "rail";
  }
  return "rail";
}

/**
 * The KNOB POSITION a view is currently at: the ONE named door between a
 * view's coordinate system and the knob's.
 *
 * It is the identity for every knob today, and it is kept as a function rather
 * than inlined because the class of bug it was introduced for is not
 * hypothetical. Plan 10-08 gave a lattice colour knob a two-swatch WINDOW and
 * `KnobView.positions` to translate the slots back; `TuningRegion.svelte` read
 * `knob.index` directly and reported window slot 0 where the knob stood at
 * lattice position 95, which was MEASURED as `install.e2e.ts` disabling KEEP
 * ON DEVICE with `knobs-moved` after a write nobody had touched. Plan 10-10
 * removed the window with the picker that replaces it, so the translation is
 * the identity again - and `model.spec.ts` asserts it for EVERY knob on every
 * view, which is what makes the identity a measurement rather than an
 * assumption.
 *
 * A VIEW POSITION IS STILL NOT A KNOB INDEX, and the picker is where that is
 * live: a rail detent is 0..15 and the knob position it composes to is
 * 0..4095. That translation has its own named door, `colourPosition`, for
 * exactly the same reason this one exists.
 */
export function knobPosition(view: KnobView): number {
  return view.index;
}

/** A dot per option up to eight; a detent track from nine. */
export function railSkin(n: number): RailSkin {
  return n <= DOT_RAIL_MAX ? "dots" : "track";
}

// ---------------------------------------------------------------------------
// The colour lattice, restated for the picker (D-06, 10-UI-SPEC §11.2).
//
// WHY IT IS RESTATED HERE RATHER THAN IMPORTED. The real arithmetic is
// src/lib/tune/knobs.preset.ts's `colourAt` / `colourIndexOf`, which go through
// the vendored `quantiseColour`. That file imports the vendored compiler, and
// D-18's front-door guard fails any file under src/lib/ui/ that names it - by
// SPECIFIER TEXT, so even a type-only import fails. So this is the same move
// EVENT_BUDGET and the KnobKind union already make in this file: a literal
// restatement HELD AGAINST ITS REAL SOURCE BY A SPEC. `colour-picker.spec.ts`
// walks all 4,096 positions and asserts `colourLevels`/`colourChannel` against
// the vendored `colourAt`, and `colourPosition` against `colourIndexOf`, in
// both directions. A drift in `_pad.ts`'s 17-step quantisation stops the suite,
// not the picker.
//
// This is what "every detent is index-to-RGB444 arithmetic through the lattice
// knob, never a hand-typed list" means in a file that may not import the knob.

/** Sixteen detents per rail. Three rails span 16^3 = 4,096 and no more. */
export const COLOUR_RAIL_STEPS = 16;
/**
 * 255 / 15. `quantiseColour` snaps every stored channel to a multiple of 17
 * (`src/vendor/botor/_pad.ts:490-493`), which is what makes the lattice exactly
 * sixteen steps wide and exactly reachable.
 */
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

/**
 * Three rail levels -> the lattice position.
 *
 * THE PICKER'S `knobPosition`. A detent is 0..15 and a knob position is
 * 0..4095, and every place the picker reports a move upward comes through
 * here, for the reason `knobPosition`'s comment gives.
 */
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
 * "102, 102, 102" - the three STORED INTEGERS, and this is what a rail's
 * `aria-valuetext` announces.
 *
 * NEVER A HEX. `#666666` would be a number the state does not hold written in
 * a base the firmware never sees, and it implies a 24-bit resolution the pad
 * cannot reach. The spaces after the commas are deliberate: a screen reader
 * pauses on them and reads three numbers rather than one long one.
 */
export function colourValueText(position: number): string {
  return colourLevels(position).map(colourChannel).join(", ");
}

/**
 * How many characters `glc(a, layer, r, g, b, 1)` spends on this colour: three
 * decimal literals and the two commas between them.
 *
 * The whole lattice is worth SIX characters - `0,0,0` is five and `102,102,102`
 * is eleven - and that is the entire arithmetic the affordability guard rests
 * on, because a colour change moves nothing else in the emitted script.
 */
export function colourLiteralLength(position: number): number {
  return colourLevels(position).reduce(
    (sum, level) => sum + String(colourChannel(level)).length,
    2,
  );
}

/**
 * The cheap-step rule, DERIVED from the literal rather than listed.
 *
 * A marked step is one whose channel literal is one or two digits, plus 255.
 * That is `0` (one digit), `17` `34` `51` `68` `85` (two), and `255` - the top
 * of the rail, marked because a visitor reaching for full brightness should not
 * have to learn that it is the expensive end. `102` and everything between it
 * and `238` is three digits and unmarked.
 */
export function colourCheapLevel(level: number): boolean {
  const value = colourChannel(level);
  return String(value).length <= 2 || value === 255;
}

/**
 * What the picker is allowed to spend, or `undefined` when nothing has
 * measured yet.
 *
 * `free` is the characters left on the tighter of the two events at the colour
 * the knob currently stands at; `copies` is how many times the emitted script
 * writes the literal (one on every card but `ninepads`, whose checkerboard
 * emits a dimmed second copy).
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
   * False when this colour's literal would push the state past 908.
   *
   * MEASURED AT ZERO ON TODAY'S SHELF: the dearest colour-bearing preset is
   * `ninepads` at 640 of 908, leaving 268 free, and the whole lattice is worth
   * six characters per copy. The guard ships because it makes that claim
   * CHECKABLE, because the Lua route's hand-authored templates have far less
   * headroom, and because the catalog grows.
   */
  affordable: boolean;
};

/**
 * One rail, resolved: sixteen detents of `axis`, each painted in the colour it
 * would produce GIVEN THE OTHER TWO RAILS WHERE THEY STAND.
 *
 * That "given the other two" is why a rail re-paints when either other rail
 * moves, and it is what makes the strip sixteen discrete storable colours
 * rather than a gradient.
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
 * The highest level a rail's `<input type="range">` may reach.
 *
 * ABSENT AS A COLOUR, PRESENT AS A POSITION. An unaffordable detent is still
 * painted - in `--color-ground` behind a 1px `--color-line-soft` hairline - so
 * the rail keeps its shape and a visitor can see that the space continues; the
 * control's own `max` is what stops there, which is what makes the exclusion
 * real rather than decorative and what makes the platform announce it.
 *
 * The unaffordable set is always a SUFFIX, and that is arithmetic rather than
 * luck: the cost of a colour is the digit count of its three channels, and a
 * channel's digit count is monotonic in its level (1 digit at 0, 2 up to 85, 3
 * from 102). So there is always a single top level and never a hole.
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
 * True when this colour knob carries the whole lattice rather than a
 * hand-authored palette.
 *
 * THIS IS NOT WIDGET SELECTION AND IT IS NOT X-05's `n`. `widgetFor` has
 * already chosen the picker by kind alone; this is the picker asking what it
 * is holding. A compiler-route colour knob IS the lattice (`knobs.preset.ts`
 * builds its options from `colourAt` over all 4,096). A Lua entry's colour knob
 * is still the four or five literals its author wrote, and three sixteen-detent
 * rails cannot travel between `0,204,255` and `255,85,0` without passing
 * through 4,094 colours that knob cannot name - so the picker shows that knob
 * the SHIPPED swatch row instead, inside the same block, with the same caption
 * and the same selector. Widening the Lua route onto the lattice regenerates
 * every colour-bearing entry's frames and is `deferred-items.md` item 3.
 */
export function isColourLattice(values: readonly unknown[]): boolean {
  return values.length === COLOUR_LATTICE_SIZE;
}

/**
 * The percentage, floored inside the budget and ceiled outside it.
 *
 * The asymmetry is the point: 100% must mean "exactly at the limit" and must
 * never mean "nearly there". 907 reads 99, 908 reads 100, 909 reads 101, 941
 * reads 104.
 */
export function percentOf(used: number): number {
  const raw = (used / EVENT_BUDGET) * 100;
  return used > EVENT_BUDGET ? Math.ceil(raw) : Math.floor(raw);
}

/**
 * One meter, resolved.
 *
 * `over` is derived from the number rather than asked for, and it outranks
 * staleness: a warning is never dimmed. A meter that has never measured is not
 * over anything, however large the placeholder it was handed.
 */
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
 * The right-aligned integer beside a rail, when every value on that knob is a
 * single integer - and nothing at all otherwise, so `3,5,7` shows nothing.
 *
 * The literal is returned RAW and is never reinterpreted (X-08). A MIDI channel
 * whose Lua literal is `0` displays `0`, because the firmware is zero-based and
 * showing `1` would be HANGAR silently renumbering a value it is about to write
 * to someone's hardware.
 */
export function integerReadout(
  values: readonly string[],
  index: number,
): string | undefined {
  if (index < 0 || index >= values.length) return undefined;
  if (!values.every((v) => INTEGER.test(v))) return undefined;
  return values[index];
}
