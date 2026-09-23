// The tuning panel's view seam: the types a component names, the rule that turns a knob into a
// widget, the stepper's arithmetic, the meter arithmetic, the colour lattice for the picker and the
// readouts. This module imports nothing at all - not even `import type` - because config-shape.spec.ts
// test 13 fails any file under src/lib/ui/ whose `from "..."` specifier names the vendored compiler,
// the protocol package or $lib/pad by SPECIFIER TEXT, and a component must be able to name this file
// freely (view.spec.ts asserts the zero-import shape). Three facts are restated here as literals and
// held against their real source by a spec: the twelve knob kinds and EVENT_BUDGET = 908
// (view.spec.ts), and the colour lattice's arithmetic (colour-picker.spec.ts walks all 4,096).
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
 * Five names, four row skins and one picker (change 16, 2026-09-21). `words` is a segmented control,
 * `select` a native select, `stepper` a typed field with a step box either side, `swatch` the
 * picker's own palette row; `colour` is the whole colour block, rendered once per section.
 * `widgetFor` chooses between `words`, `select` and `stepper` and never returns `swatch`: the picker
 * synthesises it for a hand-authored Lua palette.
 */
export type KnobWidget = "colour" | "swatch" | "words" | "select" | "stepper";

/** Above this many options a worded knob is a `<select>` rather than segmented radios (13-09, section 7). */
export const SEGMENTED_MAX = 4;
/** Above this many characters across its words a worded knob is a select too (change 16): four long words do not sit on one line. */
export const SEGMENT_CHARS_MAX = 40;
/** Above this many options a note knob is typed (a name or a number) rather than chosen from a list (change 16). */
export const NOTE_SELECT_MAX = 24;
/** Two. Above this an integer knob is a stepper, where the ladder shows where the value sits (12-05, change 16). */
export const INTEGER_WORD_ROW_MAX = 2;

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
  /** The display label, its unit split off (`Tempo (BPM)` reads `Tempo` with `unit` BPM). */
  label: string;
  kind: KnobKindName;
  widget: KnobWidget;
  values: readonly KnobValueView[];
  index: number;
  default: number;
  /** The unit a stepper prints after the value (`ms`, `BPM`), from the label's parenthetical; absent otherwise. */
  unit?: string;
  /** The rung's own text for a typed field: the integer, or the note's name. */
  readout?: string;
  /**
   * The raw option literals, present exactly when `readout` is (every option a single integer, X-08),
   * so a typed field can map a number back to an index (13.1-07, D-09). Absent otherwise.
   */
  literals?: readonly string[];
  /** The knob's part in a MIDI output's block (change 17), and the output's id; absent on every other knob. */
  role?: KnobRole;
  output?: string;
};

/** One MIDI output as the MIDI section draws it (change 17): its sub-head and its rows' knob ids by role. */
export type OutputView = {
  id: string;
  name: string;
  kind: "continuous" | "trigger";
  knobs: Readonly<Partial<Record<KnobRole, string>>>;
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
  /** The brightness the strings were landed at, 1..255; not a knob, so never in `knobs`. */
  brightness: number;
  /** False when the card declares `rollable: false` (change 7): no Randomize, no Undo, no row lock. */
  rollable: boolean;
  /**
   * The ids of the knobs the browser preview is holding at their `previewIndex` because the visitor
   * chose a position the browser cannot honour (change 8: ORBIT's Sync at External - no MIDI clock
   * reaches a preview). Empty on every other card and at every honoured position; the inspector says
   * so under Sync whenever it is not.
   */
  previewHeld: readonly string[];
  /** The entry's MIDI outputs (change 17): one block each under MIDI; empty on a card not yet moved to the per-output model. */
  outputs: readonly OutputView[];
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

/**
 * ARC's LFO wave (change 6, 2026-09-17), keyed by the Lua expression the knob substitutes for `v`
 * over the phase `p`; read under `mode`, after the dial's two words, so the six-option select is worded.
 */
const SHAPE_WORDS = {
  "128+(1-p//128*2)*(p%128*(128-p%128)*127//4096)": "Sine",
  p: "Saw up",
  "255-p": "Saw down",
  "255-math.abs(p*2-255)": "Triangle",
  "255-p//128*255": "Square",
  "s.n%256": "Random",
} as const;

/**
 * CHORUS's voicing (change 7, 2026-09-18), keyed by the upper bound of its inversion loop: 0 root
 * position only, 2 the closest of three. Read under `mode`, after the dial's and the wave's words.
 */
const INVERSION_WORDS = {
  "0": "Off",
  "2": "Smart",
} as const;

/**
 * A clock source (change 8, 2026-09-18), keyed by the Lua boolean the `sync` knob substitutes: the
 * Setup folds it to `grxm(2,3)` or `grxm(2,0)` and the Timer steps only when it is false. Read by
 * the knob's ID (change 16): any other boolean under `mode` is On / Off, so TRACKPAD's edge flash
 * no longer reads Internal / External.
 */
const SYNC_WORDS = {
  false: "Internal",
  true: "External",
} as const;

/** A boolean under `mode` that is not a clock source: TRACKPAD's `flash`, TRACKPAD COMET's `scroll`. */
const ON_OFF_WORDS = {
  true: "On",
  false: "Off",
} as const;

/** A step division under External (change 8): MIDI clocks per step, 24 to the quarter. */
const DIVISION_WORDS = {
  "12": "8th",
  "6": "16th",
  "3": "32nd",
} as const;

/** QUADRANT's `fill` (change 16): the three fill modes its Setup reads at two sites. */
const FILL_WORDS = {
  "0": "Colour only",
  "1": "Colour and fill",
  "2": "High contrast",
} as const;

/** STAGE's `modifier` (change 16): a USB HID modifier usage id from the Keyboard/Keypad page, or 0. */
const MODIFIER_WORDS = {
  "0": "None",
  "224": "Ctrl",
  "225": "Shift",
  "226": "Alt",
} as const;

/**
 * A `key` knob's first USB HID usage id (change 16): CULL's five and STAGE's nine contiguous keys
 * start here. CHORUS's `key` is a MIDI note whose literals (48..59) are not on this table, so it
 * falls through to the note names.
 */
const KEY_WORDS = {
  "30": "1",
  "58": "F1",
  "89": "Keypad 1",
  "104": "F13",
} as const;

/** ARC's `arms` (change 16): the compiler's radial multipliers, 41 per arm; PINWHEEL's 1 / 2 / 3 are not on this table and read as they are. */
const ARMS_WORDS = {
  "41": "1",
  "82": "2",
  "123": "3",
} as const;

/** CULL's `dim` (change 16): a multiplier over a divisor of 6, read as the share of the palette it leaves lit. */
const DIM_WORDS = {
  "2": "33%",
  "3": "50%",
  "4": "67%",
  "6": "100%",
} as const;

/** WHEELS' `spring` (change 16): the walk per 20 ms fire, read as the time a full deflection takes to come home. */
const RETURN_WORDS = {
  "256": "640 ms",
  "512": "320 ms",
  "1024": "160 ms",
  "2048": "80 ms",
} as const;

/** The tables read by the knob's ID before its kind's own (change 16). */
const ID_WORDS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  sync: SYNC_WORDS,
  fill: FILL_WORDS,
  modifier: MODIFIER_WORDS,
  key: KEY_WORDS,
  arms: ARMS_WORDS,
  dim: DIM_WORDS,
  spring: RETURN_WORDS,
};

/**
 * A knob's part in a MIDI output's block (change 17, tune/midi.ts's `OutputRole` restated - this
 * module imports nothing): its Type and Receive are worded by the role, whatever the knob's id.
 */
export type KnobRole = "type" | "channel" | "number" | "receive";

/** A Type knob's literals are status bytes (tune/midi.ts `MIDI_STATUS`). */
export const MIDI_TYPE_WORDS: Readonly<Record<string, string>> = {
  "176": "CC",
  "224": "Pitch bend",
  "208": "Channel pressure",
  "144": "Note",
  "192": "Program change",
};

/** A Receive knob's literals are the header INSTR its callback answers: 0 none (Off), 13 the host (On). */
export const RECEIVE_WORDS: Readonly<Record<string, string>> = {
  "0": "Off",
  "13": "On",
};

/** The `mode` tables after the dial's own two words, tried in this order; every key is unique across them. */
const MODE_TABLES: readonly Readonly<Record<string, string>>[] = [
  SHAPE_WORDS,
  INVERSION_WORDS,
  DIVISION_WORDS,
  ON_OFF_WORDS,
];

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

/** STARFIELD's `edge` (change 16): the two words the compiler's `feel` carries as literals. */
const FEEL_WORDS = {
  soft: "Soft",
  hard: "Hard",
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
/** A typed number: an integer or a decimal, either sign. */
const NUMBER = /^-?[0-9]+(\.[0-9]+)?$/;
/** Two or more integers with commas between: ORBIT's pulse sets, QUADRANT's palettes, a scale set. */
const INTEGER_LIST = /^-?[0-9]+(,-?[0-9]+)+$/;

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
 * table - which is what sends the knob to its semitone list.
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

/** `C#3` / `Db3` / `c#3` -> a letter, an optional accidental, an octave -2..9. The other direction of `noteName`. */
const NOTE_TEXT = /^([A-Ga-g])([#b]?)(-?[0-9]+)$/;

/**
 * The MIDI number a typed note names, 0..127, or undefined (change 8, 2026-09-18: ORBIT's ring
 * notes are typed). Names and numbers alike, in `noteName`'s own spelling (C4 = 60, so 0 is C-1 and
 * 127 is G9 - Live's C-2..G8 is the same 0..127 one octave lower in name): `C#3` and `49` both give
 * 49; `Db3` too; `C-1` is 0 and `G9` 127; `H3`, `128`, `G#9` and `-1` are refused. Trimmed; the
 * letter's case is free.
 */
export function noteNumber(text: string): number | undefined {
  const typed = text.trim();
  if (INTEGER.test(typed)) {
    const n = Number.parseInt(typed, 10);
    return n >= 0 && n <= 127 ? n : undefined;
  }
  const m = NOTE_TEXT.exec(typed);
  if (m === null) return undefined;
  const letter = NOTE_NAMES.indexOf(m[1].toUpperCase());
  const accidental = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
  const n = (Number.parseInt(m[3], 10) + 1) * 12 + letter + accidental;
  return n >= 0 && n <= 127 ? n : undefined;
}

/**
 * A comma list of integers as a word (change 16): four RGB triples under `mode` read as their hue
 * names (QUADRANT's palettes), any other list as its numbers with spaces (ORBIT's pulse sets, an
 * unlisted scale's semitones). Undefined for anything that is not such a list.
 */
function listWord(kind: KnobKindName, literal: string): string | undefined {
  if (!INTEGER_LIST.test(literal)) return undefined;
  const numbers = literal.split(",").map((part) => Number.parseInt(part, 10));
  if (
    kind === "mode" &&
    numbers.length % 3 === 0 &&
    numbers.every((n) => n >= 0 && n <= 255)
  ) {
    const hues: string[] = [];
    for (let at = 0; at < numbers.length; at += 3) {
      hues.push(hueName([numbers[at], numbers[at + 1], numbers[at + 2]]));
    }
    return hues.join(", ");
  }
  return numbers.join(", ");
}

/**
 * The display word for one value of one kind, or undefined when no table names it. `widgetFor`
 * uses this to decide whether a worded row is possible at all. The knob's ID is read first (change
 * 16): `sync` is Internal / External where any other boolean is On / Off, `fill`, `modifier` and
 * `key` have tables of their own, and a comma list of integers reads as a list.
 */
export function wordFor(
  kind: KnobKindName,
  literal: string,
  id?: string,
  role?: KnobRole,
): string | undefined {
  if (kind === "colour") return undefined;
  if (role === "type") return MIDI_TYPE_WORDS[literal];
  if (role === "receive") return RECEIVE_WORDS[literal];
  const own = id === undefined ? undefined : ID_WORDS[id]?.[literal];
  if (own !== undefined) return own;
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
              : kind === "feel"
                ? FEEL_WORDS
                : undefined;
  if (table) {
    const word = table[literal];
    if (word !== undefined) return word;
    if (kind === "mode") {
      for (const more of MODE_TABLES) {
        const later = more[literal];
        if (later !== undefined) return later;
      }
    }
  }
  if (kind === "note" && INTEGER.test(literal)) {
    return noteName(Number.parseInt(literal, 10));
  }
  return listWord(kind, literal);
}

/**
 * The widget rule, and it is TOTAL: every kind and every value set resolves to one widget. `colour`
 * is chosen by `kind` ALONE (X-05 / X-06; 10-08, 10-10): a colour knob carries `n = 4096` and any
 * rule that consulted `n` would send it elsewhere. A knob every one of whose values has a word is
 * segmented up to SEGMENTED_MAX options and SEGMENT_CHARS_MAX characters and a select above either
 * - except a note ladder past NOTE_SELECT_MAX, which is typed. A knob of integers is words at up to INTEGER_WORD_ROW_MAX (12-05: NINE PADS'
 * `Pads` at `9` and `16`) and a stepper above. Anything else is a select of positions (change 16).
 */
export function widgetFor(
  kind: KnobKindName,
  values: readonly string[],
  id?: string,
  role?: KnobRole,
): KnobWidget {
  if (kind === "colour") return "colour";
  const n = values.length;
  // Change 17: a MIDI output's Type is segmented at two words (a trigger's Note / CC) and the
  // select from three (a continuous output's: "Channel pressure" cannot share a line at 173px).
  if (role === "type") return n <= INTEGER_WORD_ROW_MAX ? "words" : "select";
  const words = values.map((v) => wordFor(kind, v, id, role));
  if (n > 0 && words.every((word) => word !== undefined)) {
    if (kind === "note" && n > NOTE_SELECT_MAX) return "stepper";
    const chars = words.reduce((sum, word) => sum + (word as string).length, 0);
    return n <= SEGMENTED_MAX && chars <= SEGMENT_CHARS_MAX
      ? "words"
      : "select";
  }
  if (n > 0 && values.every((v) => INTEGER.test(v))) {
    return n <= INTEGER_WORD_ROW_MAX ? "words" : "stepper";
  }
  return "select";
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

// ---------------------------------------------------------------------------
// The stepper's arithmetic (change 16, 2026-09-21): a typed value snaps to a DECLARED rung, never
// between - the budget is measured over the rungs at the RGB444 corner - and the step boxes walk
// the rungs in VALUE order whatever order the entry declared them in.

/** `Tempo (BPM)` -> `Tempo` and `BPM`; a label with no trailing parenthetical is its own, with no unit. */
export function splitUnit(label: string): { label: string; unit?: string } {
  const m = /^(.*\S)\s*\(([^()]+)\)$/.exec(label.trim());
  if (m === null) return { label: label.trim() };
  return { label: m[1], unit: m[2].trim() };
}

/** The number a literal is, or undefined: every stepper rung is an integer today, the note ladders included. */
function numberOf(literal: string): number | undefined {
  return NUMBER.test(literal.trim()) ? Number(literal.trim()) : undefined;
}

/**
 * The declared indices in ascending VALUE order (a stable sort, so equal values keep their
 * declared order): SNAKE's `300 220 160 110` walks 110 first. A ladder with a non-number anywhere
 * is walked in declared order.
 */
export function valueOrder(literals: readonly string[]): readonly number[] {
  const indices = literals.map((_, at) => at);
  const numbers = literals.map(numberOf);
  if (numbers.some((n) => n === undefined)) return indices;
  return indices.sort(
    (a, b) => (numbers[a] as number) - (numbers[b] as number) || a - b,
  );
}

/** Where a declared index sits on the value-ordered ladder: 0 is the smallest value. */
export function rankOf(order: readonly number[], index: number): number {
  const rank = order.indexOf(index);
  return rank < 0 ? 0 : rank;
}

/**
 * The index of the declared rung NEAREST a typed number, or undefined when the text is not a
 * number or the ladder has a rung that is not one. Ties go to the lower value; a number past
 * either end lands on that end. The one hard rule of change 16: a typed value never lands between
 * two rungs, because nothing between two rungs was ever measured against 908.
 */
export function nearestRung(
  literals: readonly string[],
  text: string,
): number | undefined {
  const typed = numberOf(text);
  if (typed === undefined || literals.length === 0) return undefined;
  const numbers = literals.map(numberOf);
  if (numbers.some((n) => n === undefined)) return undefined;
  let best = -1;
  let distance = Number.POSITIVE_INFINITY;
  for (const index of valueOrder(literals)) {
    const gap = Math.abs((numbers[index] as number) - typed);
    if (gap < distance) {
      best = index;
      distance = gap;
    }
  }
  return best < 0 ? undefined : best;
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
 * undefined when the literals are not integers, are empty, repeat or skip a number. In ANY order
 * since change 17: a grown number ladder keeps a card's old rungs first (tune/midi.ts
 * `numberValues`) and is still the run 0..127.
 */
export function integerRun(
  literals: readonly string[],
): { min: number; max: number } | undefined {
  if (literals.length === 0) return undefined;
  if (!literals.every((literal) => INTEGER.test(literal))) return undefined;
  const sorted = literals
    .map((literal) => Number.parseInt(literal, 10))
    .sort((a, b) => a - b);
  for (let at = 1; at < sorted.length; at++) {
    if (sorted[at] !== sorted[0] + at) return undefined;
  }
  return { min: sorted[0], max: sorted[0] + sorted.length - 1 };
}
