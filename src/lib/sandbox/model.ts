// The Sandbox's region model: what a region IS, what a surface may hold, and
// the doors between the numbers the interface shows and the numbers the model
// keeps. Data and pure functions only; no browser, no minifier, no device.
//
// The shapes (Region, Surface, ElementKind, SURFACE_SIZE, SURFACE_ELEMENT_CAP)
// live in store/schema.ts - an import is validated against them before any
// Sandbox module loads - and are re-exported here so the Sandbox imports from
// one place. Every component reads a cell through toDisplay / fromDisplay: one-
// based shown, zero-based kept. The minimum size per kind is derived below.
// Decided at 13-15 (the dead zone, D-08); see .planning/phases/13-gui-overhaul/13-15-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  BUTTON_OUTPUTS,
  CONTINUOUS_TYPES,
  ELEMENT_KINDS,
  EXTRAS_MAX,
  EXTRA_TRIGGERS,
  MIDI_TYPES,
  GROUP_MAX,
  NOTE_MODES,
  ORIENTATIONS,
  REGION_MODES,
  SCALE_IDS,
  SPEEDS,
  SURFACE_ELEMENT_CAP,
  SURFACE_SIZE,
  TOUCHES_MAX,
  TOUCH_TYPES,
  VALUE_TYPES,
  type ButtonOutput,
  type ColourInput,
  type ElementKind,
  type Extra,
  type ExtraAxis,
  type ExtraTrigger,
  type MidiType,
  type NoteMode,
  type Orientation,
  type Region,
  type RegionMode,
  type ScaleId,
  type Speed,
  type Surface,
} from "../store/schema";

export {
  BUTTON_OUTPUTS,
  CONTINUOUS_TYPES,
  ELEMENT_KINDS,
  EXTRAS_MAX,
  EXTRA_TRIGGERS,
  MIDI_TYPES,
  GROUP_MAX,
  NOTE_MODES,
  ORIENTATIONS,
  REGION_MODES,
  SCALE_IDS,
  SPEEDS,
  SURFACE_ELEMENT_CAP,
  SURFACE_SIZE,
  TOUCHES_MAX,
  TOUCH_TYPES,
  VALUE_TYPES,
  type ButtonOutput,
  type ColourInput,
  type ElementKind,
  type Extra,
  type ExtraAxis,
  type ExtraTrigger,
  type MidiType,
  type NoteMode,
  type Orientation,
  type Region,
  type RegionMode,
  type ScaleId,
  type Speed,
  type Surface,
};

/** Nine by nine: the number of cells, and the length of the cell map. */
export const SURFACE_CELLS = SURFACE_SIZE * SURFACE_SIZE;

/** The last cell index on either axis, 0-based. */
export const LAST_CELL = SURFACE_SIZE - 1;

// ---------------------------------------------------------------------------
// The named door: one-based in the interface, zero-based in the model.

/** A model coordinate (0..8) -> the number the interface shows (1..9). */
export const toDisplay = (zeroBased: number): number => zeroBased + 1;

/** The number the interface shows (1..9) -> the model coordinate (0..8). */
export const fromDisplay = (oneBased: number): number => oneBased - 1;

/**
 * The MIDI channel's door, for the same reason: 1..16 as the user sees it and
 * types it, 0..15 on the wire. The emitter is the only caller; a component
 * never sees a wire channel.
 */
export const CHANNEL_MIN = 1;
export const CHANNEL_MAX = 16;
export const wireChannel = (channel: number): number => channel - 1;

/** A controller number, as the user sees it and as the wire carries it. */
export const CC_MIN = 0;
export const CC_MAX = 127;

/** A MIDI value - a min, a max, a spring value, a note number - 0..127. */
export const VALUE_MIN = 0;
export const VALUE_MAX = 127;

// ---------------------------------------------------------------------------
// The change 10B options, read with their defaults (schema.ts: every field optional).

/** The sent value's span: 0 and 127 unless set. A min above the max inverts the direction (answer 6a). */
export const minOf = (region: Region): number => region.min ?? VALUE_MIN;
export const maxOf = (region: Region): number => region.max ?? VALUE_MAX;

/** The modes a fader or an XY pad offers, and the four a knob offers, in the interface's order. */
export const CONTINUOUS_MODES: readonly RegionMode[] = ["absolute", "relative"];
export const KNOB_MODES: readonly RegionMode[] = [
  "absolute",
  "relative-twos",
  "relative-offset",
  "relative-sign",
];

/** The region's mode: absolute unless set; a button and a blank have none. */
export function modeOf(region: Region): RegionMode | undefined {
  if (region.kind === "button" || region.kind === "blank") return undefined;
  const offered = region.kind === "knob" ? KNOB_MODES : CONTINUOUS_MODES;
  const mode = region.mode ?? "absolute";
  return offered.includes(mode) ? mode : "absolute";
}

/** True for a fader, an XY pad or a knob whose mode is any relative one. */
export const isRelative = (region: Region): boolean =>
  (modeOf(region) ?? "absolute") !== "absolute";

/** A relative fader's or XY pad's speed: half unless set. */
export const speedOf = (region: Region): Speed => region.speed ?? "half";

/** A fader's spring: off unless set; never on another kind. */
export const springOf = (region: Region): boolean =>
  region.kind === "fader" && region.spring === true;

/** The typed spring value, 64 unless set, CLAMPED into the region's min..max span (answer 8). */
export function springValueOf(region: Region): number {
  const lo = Math.min(minOf(region), maxOf(region));
  const hi = Math.max(minOf(region), maxOf(region));
  return Math.min(hi, Math.max(lo, region.springValue ?? 64));
}

/** A button's output: a controller unless set (a continuous kind's type is `typeOf`'s). */
export const outputOf = (region: Region): ButtonOutput =>
  region.kind === "button" && region.output === "note" ? "note" : "cc";

// ---------------------------------------------------------------------------
// The change 17 MIDI output (BENCH-2026-09-16.txt section 17; docs/MIDI.md): every sending
// element's Type, Channel and Number, an XY pad's per axis, and Receive.

/**
 * The types a region's output offers, in the interface's order: a button's two, a continuous
 * kind's three (answer 2, "common only") - except a knob in a relative mode, whose detents are
 * relative controller steps (answer 11d), so its one type is a controller; a blank none.
 */
export function typesOf(region: Region): readonly MidiType[] {
  if (region.kind === "blank") return [];
  if (region.kind === "button") return BUTTON_OUTPUTS;
  if (region.kind === "knob" && isRelative(region)) return ["cc"];
  // Change 21A: a Note on every continuous output but a pad's with more than one touch (its
  // fingers are transient slots, and one output cannot hold a note per finger).
  if (touchesOf(region) > TOUCHES_MIN) return CONTINUOUS_TYPES;
  return NOTE_CONTINUOUS_TYPES;
}

/** A continuous output's four types since change 21A, in the interface's order: the three, then Note. */
export const NOTE_CONTINUOUS_TYPES: readonly MidiType[] = [
  ...CONTINUOUS_TYPES,
  "note",
];

/** The region's (X axis's) type: its own when the kind offers it, a controller otherwise. */
export function typeOf(region: Region): MidiType {
  const type = region.output ?? "cc";
  return typesOf(region).includes(type) ? type : "cc";
}

/** An XY pad's Y axis type; a controller on every other kind. */
export const typeYOf = (region: Region): MidiType =>
  region.kind === "xy" && typesOf(region).includes(region.outputY ?? "cc")
    ? (region.outputY ?? "cc")
    : "cc";

// ---------------------------------------------------------------------------
// Change 21A: a Note on a continuous output (BENCH-2026-09-16.txt section 21, the addition).

/** The two axes' outputs: the fader's, the knob's and the pad's X axis is "x". */
export type OutputAxis = "x" | "y";

/** The type an axis sends: `typeOf` on X, `typeYOf` on Y. */
export const typeOfAxis = (region: Region, axis: OutputAxis): MidiType =>
  axis === "y" ? typeYOf(region) : typeOf(region);

/** True when the axis's own output is a Note on a continuous kind (a button's note is its own, change 10B). */
export const isContinuousNote = (region: Region, axis: OutputAxis): boolean =>
  region.kind !== "button" &&
  (axis === "x" || region.kind === "xy") &&
  typeOfAxis(region, axis) === "note";

/** True when either of the region's own outputs is a continuous Note. */
export const hasNoteOutput = (region: Region): boolean =>
  isContinuousNote(region, "x") || isContinuousNote(region, "y");

/** A continuous Note's mode: Pitch unless set. */
export const noteModeOf = (region: Region, axis: OutputAxis): NoteMode =>
  (axis === "y" ? region.noteModeY : region.noteMode) ?? "pitch";

/** A Pitch output's scale: Chromatic unless set. */
export const scaleOf = (region: Region, axis: OutputAxis): ScaleId =>
  (axis === "y" ? region.scaleY : region.scale) ?? "chromatic";

/** A Pitch output's fixed velocity, 1..127: 100 unless set. */
export const DEFAULT_VELOCITY = 100;
export const noteVelocityOf = (region: Region, axis: OutputAxis): number =>
  (axis === "y" ? region.velocityY : region.velocity) ?? DEFAULT_VELOCITY;

/**
 * Each scale's degrees in semitones from its root - the root is the output's Min - read from the
 * catalog's own scale tables' sets (tune/view.ts SCALE_WORDS names every one; model.spec-free: the
 * UI spec holds the two equal). Chromatic is every semitone, so it is never written to the row.
 */
export const SCALE_DEGREES: Readonly<Record<ScaleId, readonly number[]>> = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  "major-pentatonic": [0, 2, 4, 7, 9],
  "minor-pentatonic": [0, 3, 5, 7, 10],
};

/**
 * The note a Pitch output plays for a value already scaled through Min..Max (the runtime's `D`
 * twin): the value quantised DOWN onto the scale rooted on Min - the largest degree at or under
 * the value's distance above the root's pitch class. Chromatic is the value itself.
 */
export function pitchOf(
  region: Region,
  axis: OutputAxis,
  value: number,
): number {
  const degrees = SCALE_DEGREES[scaleOf(region, axis)];
  const d = (((value - minOf(region)) % 12) + 12) % 12;
  let u = 0;
  for (const g of degrees) if (g <= d && g > u) u = g;
  return value - d + u;
}

// ---------------------------------------------------------------------------
// Change 21A: the extra messages (BENCH-2026-09-16.txt section 21).

/** The extras a region stores: none on a blank (it takes no touch and sends nothing), else its own, at most three. */
export const extrasOf = (region: Region): readonly Extra[] =>
  region.kind === "blank" ? [] : (region.extras ?? []).slice(0, EXTRAS_MAX);

/**
 * The triggers a kind honours: Touch on every kind that takes touch; Value where the element keeps
 * a value it sends through the scale - a fader, an XY pad, an absolute knob (a button's value is
 * its press, a relative knob's detents are steps). A blank none.
 */
export function extraTriggersOf(region: Region): readonly ExtraTrigger[] {
  if (region.kind === "blank") return [];
  if (region.kind === "button") return ["touch"];
  if (region.kind === "knob" && isRelative(region)) return ["touch"];
  return EXTRA_TRIGGERS;
}

/** The types an extra's trigger offers: a Touch a note or a CC (a gate), a Value the continuous three. */
export const extraTypesOf = (trigger: ExtraTrigger): readonly MidiType[] =>
  trigger === "touch" ? TOUCH_TYPES : VALUE_TYPES;

/** A Touch note's velocity: its fixed 1..127, or the landing's axis; 100 unless set. */
export const extraVelocityOf = (extra: Extra): number | ExtraAxis =>
  extra.velocity ?? DEFAULT_VELOCITY;

/** A Value message's axis on an XY pad: X unless set; X on every other kind. */
export const extraSourceOf = (region: Region, extra: Extra): ExtraAxis =>
  region.kind === "xy" ? (extra.source ?? "x") : "x";

/** The extras the module is sent: the stored ones whose trigger the kind honours now (a Value kept while a knob is relative is kept, not sent). */
export const sentExtrasOf = (region: Region): readonly Extra[] =>
  extrasOf(region).filter((x) => extraTriggersOf(region).includes(x.trigger));

/** A velocity is 1..127: 0 would be a note-off. */
export const VELOCITY_MIN = 1;

/** The typed fields of an extra's block (change 21A): its channel, its number, a Touch note's fixed velocity. */
export type ExtraField = "channel" | "number" | "velocity";

/** True when every number of an extra is in its range and every word one of its own (the schema's rules; the kind's are `extraTriggersOf`). */
export function extraFits(extra: Extra): boolean {
  const int = (n: unknown, lo: number, hi: number): boolean =>
    typeof n === "number" && Number.isInteger(n) && n >= lo && n <= hi;
  const axis = (v: unknown): boolean => v === "x" || v === "y";
  return (
    EXTRA_TRIGGERS.includes(extra.trigger) &&
    MIDI_TYPES.includes(extra.type) &&
    int(extra.channel, CHANNEL_MIN, CHANNEL_MAX) &&
    int(extra.number, CC_MIN, CC_MAX) &&
    (extra.velocity === undefined ||
      axis(extra.velocity) ||
      int(extra.velocity, VELOCITY_MIN, VALUE_MAX)) &&
    (extra.source === undefined || axis(extra.source))
  );
}

/**
 * An extra in its canonical shape for the region: a type its trigger offers (the trigger's first
 * otherwise - a Touch a note, a Value a CC); a velocity only on a Touch note and never the default
 * 100; a source only on a Value message on an XY pad and never the default X.
 */
export function reshapeExtra(region: Region, extra: Extra): Extra {
  const types = extraTypesOf(extra.trigger);
  const type = types.includes(extra.type) ? extra.type : types[0];
  const out: {
    -readonly [K in keyof Extra]: Extra[K];
  } = {
    trigger: extra.trigger,
    type,
    channel: extra.channel,
    number: extra.number,
  };
  if (
    extra.trigger === "touch" &&
    type === "note" &&
    extra.velocity !== undefined &&
    extra.velocity !== DEFAULT_VELOCITY
  )
    out.velocity = extra.velocity;
  if (extra.trigger === "value" && region.kind === "xy" && extra.source === "y")
    out.source = "y";
  return out;
}

/** The extra "+ Add message" appends (change 21A): a Touch note on an XY pad and a button, a Value CC on a fader and a knob; on the element's channel, number 60 (C4) or its controller plus one. */
export function newExtraFor(region: Region): Extra | undefined {
  if (region.kind === "blank") return undefined;
  const touch =
    region.kind === "xy" ||
    region.kind === "button" ||
    !extraTriggersOf(region).includes("value");
  return touch
    ? { trigger: "touch", type: "note", channel: region.channel, number: 60 }
    : {
        trigger: "value",
        type: "cc",
        channel: region.channel,
        number: Math.min(CC_MAX, region.cc + 1),
      };
}

/** An XY pad's Y axis channel, 1..16: its own, or the X axis's (an older draft's one channel serves both). */
export const channelYOf = (region: Region): number =>
  region.kind === "xy" ? (region.channelY ?? region.channel) : region.channel;

/** A type that carries a number (a controller, a note); pitch bend and channel pressure do not. */
export const hasNumber = (type: MidiType): boolean =>
  type === "cc" || type === "note";

/** Receive, the setting: on unless set off. */
export const receiveOf = (region: Region): boolean => region.receive !== false;

/**
 * Whether the region answers host MIDI on the module: the setting, on a kind that holds a value a
 * DAW can set - never a blank (sends nothing), a knob in a relative mode (keeps no position) or a
 * pad with more than one touch (its fingers are transient, and a slot's cell column is its
 * occupancy - runtime.ts). The emitter sets the row's receive-off bit for every other region.
 */
export function receivesOf(region: Region): boolean {
  if (!receiveOf(region) || region.kind === "blank") return false;
  if (region.kind === "knob" && isRelative(region)) return false;
  // Change 21A: a continuous Note does not receive - a note is an event, not a held value: under
  // Pitch a received note would have to be placed back through the scale, under Gate its only
  // number is a velocity the element does not keep between touches (decided, recorded).
  if (hasNoteOutput(region)) return false;
  return touchesOf(region) === TOUCHES_MIN;
}

/**
 * A type's code in the channel word: the status is `176 + 16 * code` - a controller 0, a channel
 * pressure 2, a pitch bend 3, a note -2 (144; a button's alone). So a received message's word is
 * its channel plus its status less 176, whatever the type (runtime.ts `Y`).
 */
export const TYPE_CODES: Readonly<Record<MidiType, number>> = {
  cc: 0,
  note: -2,
  pressure: 2,
  pitchbend: 3,
};

/** The status byte a type sends on (the channel added on the wire). */
export const STATUS_OF: Readonly<Record<MidiType, number>> = {
  cc: 176,
  note: 144,
  pressure: 208,
  pitchbend: 224,
};

/**
 * Change 21A: a continuous Note's code - Gate the button's note (-2: status 144, the number, the
 * value at the landing its velocity), Pitch one lower (-3: the value picks the note, the number
 * column carries the velocity). A Note never receives, so its X word always carries the
 * receive-off bit: Pitch 80..95, Gate 96..111, read `h%128//16` 5 and 6 by the note-aware `D`
 * (runtime.ts); a Y word carries no receive bit (-48..-33, -32..-17), which Lua's `%128` reads
 * the same.
 */
export const PITCH_CODE = -3;

/** An axis's code in its channel word: the type's, and a continuous Note under Pitch `PITCH_CODE`. */
export const typeCodeOfAxis = (region: Region, axis: OutputAxis): number =>
  isContinuousNote(region, axis) && noteModeOf(region, axis) === "pitch"
    ? PITCH_CODE
    : TYPE_CODES[typeOfAxis(region, axis)];

/** The channel word's receive-off bit: a region that does not receive is 128 higher (every receiving word is under 64). */
export const RECEIVE_OFF_BIT = 128;

/**
 * The CHANNEL WORD, the row's eighth column (and an XY pad's fifteenth, its Y axis): the wire
 * channel 0..15, plus 16 times the type's code, plus 128 when the region does not receive, plus
 * 512 when it is Latch Off (change 18, `HAND_OVER_BIT`) - so a controller on channel 1 that
 * receives and latches is 0, exactly the column before change 17. Measured
 * against a flag bit and a column of its own (emit.spec.ts test 10): the channel column is always
 * written, so the word costs nothing at the defaults and one character at most beyond them.
 */
export function channelWord(region: Region, axis: "x" | "y" = "x"): number {
  const channel = axis === "y" ? channelYOf(region) : region.channel;
  return (
    wireChannel(channel) +
    16 * typeCodeOfAxis(region, axis) +
    (axis === "x" && !receivesOf(region) ? RECEIVE_OFF_BIT : 0) +
    (axis === "x" && handsOver(region) ? HAND_OVER_BIT : 0)
  );
}

// ---------------------------------------------------------------------------
// The change 18 option: Latch (BENCH-2026-09-16.txt section 18).

/**
 * The kinds that carry Latch: every kind that takes touch but the knob. A blank takes no touch; a
 * knob is a rotary gesture, and an Off knob lets go the moment the finger slips outside its box,
 * which only ever reads as a fault (change 18b, BENCH-2026-09-16.txt section 18: the knob loses
 * the row).
 */
export const takesLatch = (kind: ElementKind): boolean =>
  kind !== "blank" && kind !== "knob";

/**
 * Latch, the setting: On unless set off. On, a finger keeps the element it landed on until it
 * lifts, wherever it goes - what every element did before change 18 (runtime.ts `O`). Off, a
 * finger that slides off the element hands over to the element it moves onto (runtime.ts
 * `HAND_OVER_TEXT`). A kind that does not carry Latch (`takesLatch`: a blank, a knob) reads On
 * whatever it carries - so a knob stored Off while change 18 allowed it loads On, and its channel
 * word loses the hand-over bit.
 */
export const latchTouchOf = (region: Region): boolean =>
  !takesLatch(region.kind) || region.latchTouch !== false;

/** True for a region whose finger hands over: Latch Off on a kind that takes touch. */
export const handsOver = (region: Region): boolean => !latchTouchOf(region);

/** True when a surface carries a region that hands over - the runtime's hand-over entry is emitted (runtime.ts). */
export const hasHandOver = (regions: readonly Region[]): boolean =>
  regions.some(handsOver);

/**
 * The channel word's hand-over bit (change 18): a region that is Latch Off is 512 higher, so
 * every Off word is 480 and up (a note's -32 + 512) and every On word under 192 - the hand-over
 * entry reads `J[g][8]>479`. Every reader of the word that runs at On already takes it apart by
 * `%16`, `%128` or `//16%4`, which 512 leaves alone; the receive callback reads it whole and is
 * swapped for a variant that takes `%512` first (runtime.ts `RECEIVE_ROWS_HAND_OVER`). At On the
 * word is the one it was. Measured against a keyed field `,h=1` after the row and a bit in the
 * flag word, 8 (emit.spec.ts test 10), every element Off: the cheapest of the three on every
 * surface measured - page 3 21 against 22 and 39, sixteen elements 33 against 70 and 140 - since
 * a word gains at most two digits and a Receive-off word none, where the keyed field is four
 * characters a row and the flag bit forces the tail and two variants of texts every surface carries.
 * Change 18b took Latch off the knob, and the same measure moved: still the cheapest on eight and
 * sixteen elements (25 and 33), no longer on page 3 (the keyed field 18 against 20) or page 3
 * with every option (the flag bit 14 against 19) - the encoding stays (emit.spec.ts test 10).
 */
export const HAND_OVER_BIT = 512;

/** The surface's Colour input, or undefined while it is off. */
export const colourInputOf = (surface: Surface): ColourInput | undefined =>
  surface.colourInput;

/** A button's radio group, 1..8; 0 is none (answer 9b). */
export const groupOf = (region: Region): number =>
  region.kind === "button" ? (region.group ?? 0) : 0;

// ---------------------------------------------------------------------------
// The change 11 option: an XY pad's fingers (BENCH-2026-09-16.txt section 11, answers 1a and 2a).

/** An XY pad's touch count, 1..5; 1 unless set, and 1 on every other kind. */
export const TOUCHES_MIN = 1;
export const touchesOf = (region: Region): number =>
  region.kind === "xy" ? (region.touches ?? TOUCHES_MIN) : TOUCHES_MIN;

/** Finger n (1-based) sends on the pad's controller plus 2(n-1) - the next pair up per finger. */
export const fingerController = (cc: number, finger: number): number =>
  cc + 2 * (finger - 1);

/** The highest base controller a touch count admits: the last finger's pair must stay inside 127. */
export const ccCeiling = (touches: number): number =>
  CC_MAX - 2 * (touches - 1);

/** True when a surface carries a pad with more than one finger - the runtime's multitouch variant is emitted (runtime.ts). */
export const hasMultitouch = (regions: readonly Region[]): boolean =>
  regions.some((r) => touchesOf(r) > TOUCHES_MIN);

/**
 * The row's SEVENTH column: an XY pad's second controller with its touch count less one on top
 * in steps of 128 (`cc2 + 128(touches-1)`: a one-finger pad is its `cc2`, byte-identical to the
 * row before change 11; the runtime reads `> 127` as "more than one finger", `% 128` as the
 * controller and `// 64` as the last slot's offset); a button's radio group; 0 on the rest.
 * Measured against the flag word's bits 2..4 (a forced tail, `,0,127,16` on an otherwise-default
 * pad) and a column of its own (`,0,127,0,5`): one to three characters a pad instead of ten.
 */
export const TOUCHES_COLUMN_STEP = 128;
export function seventhOf(region: Region): number {
  if (region.kind === "xy")
    return (
      (region.cc2 ?? 0) +
      TOUCHES_COLUMN_STEP * (touchesOf(region) - TOUCHES_MIN)
    );
  return groupOf(region);
}

/**
 * The runtime's scale, `W(r,v)`: a POSITION 0..127 along the region's travel -> the sent value
 * `min + (max - min) * v // 127` (Lua's floor division, so a negative span floors toward the
 * min's side). Every continuous kind keeps a position and sends through this; the twin is here so
 * a spec and the spring's inverse read the same arithmetic.
 */
export function scaleValue(region: Region, position: number): number {
  const lo = minOf(region);
  return lo + Math.floor(((maxOf(region) - lo) * position) / 127);
}

/**
 * The spring's POSITION: the first position 0..127 whose scaled value is the (clamped) spring
 * value. One always exists - the span is at most 127 wide, so consecutive positions differ by at
 * most one value - which is why the row carries a position and the runtime never inverts `W`.
 */
export function springPosition(region: Region): number {
  const target = springValueOf(region);
  for (let p = 0; p <= 127; p += 1) {
    if (scaleValue(region, p) === target) return p;
  }
  return 0;
}

/**
 * The row's flag word (column 14), one integer per region, kind by kind: a fader's bit 0 is
 * relative, bit 1 full speed, bit 2 spring; an XY pad's bits 0 and 1 the same (its touch count
 * rides in the seventh column, `seventhOf`); a button's bit 0 is toggle (`latch`) - its note
 * output moved to the channel word in change 17 (`channelWord`, code 1); a knob's is its mode's
 * index 0..3 (absolute, two's complement, binary offset, sign magnitude). 0 for every default, so
 * the column is omitted.
 */
export function flagsOf(region: Region): number {
  switch (region.kind) {
    case "fader":
      return (
        (isRelative(region) ? 1 : 0) +
        (speedOf(region) === "full" ? 2 : 0) +
        (springOf(region) ? 4 : 0)
      );
    case "xy":
      return (
        (isRelative(region) ? 1 : 0) + (speedOf(region) === "full" ? 2 : 0)
      );
    case "button":
      return region.latch === true ? 1 : 0;
    case "knob":
      return Math.max(0, KNOB_MODES.indexOf(modeOf(region) ?? "absolute"));
    case "blank":
      return 0;
  }
}

// ---------------------------------------------------------------------------
// The kinds, their orientation and their runtime type codes.

/** A fader's axis; absent means vertical (schema.ts). Every other kind: undefined. */
export function orientationOf(region: Region): Orientation | undefined {
  if (region.kind !== "fader") return undefined;
  return region.orientation ?? "vertical";
}

/**
 * The runtime's type code per kind, the fifth column of a region row. The
 * codes are 13-RESEARCH 3.1's table: 1 vertical fader, 2 horizontal fader,
 * 3 button, 4 XY pad, 5 knob. A row's SEVENTH column is the XY pad's second
 * controller and the button's latch flag (0 or 1) - the research's "a second
 * flag, not a second branch" - so every row has the same eleven columns.
 * A blank has no code: it is paint, never a contact's region (emit.ts).
 */
export type TypeCode = 1 | 2 | 3 | 4 | 5;

export function typeCodeOf(region: Region): TypeCode {
  switch (region.kind) {
    case "fader":
      return orientationOf(region) === "horizontal" ? 2 : 1;
    case "button":
      return 3;
    case "xy":
      return 4;
    case "knob":
      return 5;
    case "blank":
      throw new Error("a blank has no type code: it is paint only");
  }
}

/** True for the kind the runtime never sees: a blank is colour on layer 1 and nothing else. */
export const isPaintOnly = (region: Region): boolean => region.kind === "blank";

/** The runtime branch a region needs, or undefined for a blank (no branch runs for it). */
export type Branch = "fader-v" | "fader-h" | "button" | "xy" | "knob";

export const BRANCHES: readonly Branch[] = [
  "fader-v",
  "fader-h",
  "button",
  "xy",
  "knob",
];

export function branchOf(region: Region): Branch | undefined {
  if (region.kind === "fader") {
    return orientationOf(region) === "horizontal" ? "fader-h" : "fader-v";
  }
  if (region.kind === "blank") return undefined;
  return region.kind;
}

/** The set of branches a surface uses, in BRANCHES order - dead-branch elimination's input. */
export function branchesUsed(regions: readonly Region[]): Branch[] {
  const used = new Set(regions.map(branchOf));
  return BRANCHES.filter((b) => used.has(b));
}

// ---------------------------------------------------------------------------
// Colour.

/** An RGB444 level (0..15) -> the 0..255 the firmware's `glc` takes. Level 15 is 255. */
export const colourByte = (level: number): number => level * 17;

/** The picker corner: the longest colour literal a region can carry, `255,255,255`. */
export const PICKER_CORNER: readonly [number, number, number] = [15, 15, 15];

// ---------------------------------------------------------------------------
// The minimum size per kind: derived from the probe's jitter and the runtime's step, not chosen.

export type CellSize = { readonly w: number; readonly h: number };

/** The minimum size per kind. Absent kinds have a one-cell minimum. */
export type MinimumSizes = Partial<Record<ElementKind, CellSize>>;

// The Knob's arithmetic. Every number below is derived from the two inputs
// (Probe A Q1's jitter, the uniform cell pitch) and the one design constant
// (the step); none is typed twice. The derivation is 13-15-SUMMARY.md's.

/** One raw sensor unit: Probe A Q1's per-sample wobble on one axis. */
export const JITTER_RAW = 1;

/** The diagonal of the 2 x 2 set a still finger visits over a few samples - the conservative jitter. */
export const JITTER_DIAGONAL_RAW = Math.SQRT2;

/** Degrees of accumulated turn per value step. 45 steps a turn, 2.84 turns end to end. */
export const KNOB_STEP_DEG = 8;

/** Value steps in one full turn. */
export const KNOB_STEPS_PER_TURN = 360 / KNOB_STEP_DEG;

/** One cell in raw units under the uniform 128/9 approximation (the measured pitches run 6..22). */
export const CELL_RAW = 128 / SURFACE_SIZE;

/**
 * The dead zone's radius in raw units: where the diagonal jitter alone swings
 * the angle by a whole step. 10.13 raw units, 0.71 of a cell.
 */
export const KNOB_DEAD_ZONE_RAW =
  (JITTER_DIAGONAL_RAW * (180 / Math.PI)) / KNOB_STEP_DEG;

/** The literal the runtime compares `dx*dx+dy*dy` against: ceil(rho0^2) = 103. */
export const KNOB_DEAD_ZONE_SQUARED = Math.ceil(
  KNOB_DEAD_ZONE_RAW * KNOB_DEAD_ZONE_RAW,
);

/** The ring's radius on a w-wide region: the outer cells' LED centres, uniform map. */
export const knobRingRaw = (w: number): number => ((w - 1) / 2) * CELL_RAW;

/**
 * The smallest w for which the ring lies outside the dead zone by one unit
 * of per-sample jitter: `(w-1)/2 * CELL_RAW >= rho0 + JITTER_RAW`, so 3.
 */
export const KNOB_MINIMUM_CELLS = Math.ceil(
  1 + (2 * (KNOB_DEAD_ZONE_RAW + JITTER_RAW)) / CELL_RAW,
);

/**
 * The derived defaults: a Knob at the dead-zone minimum, an XY pad at two
 * cells on each axis it reads (a one-row fader divides by zero on the module). A fader's minimum depends on its
 * orientation and is `minimumSizeFor`'s to answer; by kind alone a fader has
 * a one-cell minimum here and the orientation rule is applied on top. A
 * button and a blank are one cell.
 */
const DEFAULT_MINIMUM_SIZES: MinimumSizes = {
  knob: { w: KNOB_MINIMUM_CELLS, h: KNOB_MINIMUM_CELLS },
  xy: { w: 2, h: 2 },
};

function minimumSizeOf(
  kind: ElementKind,
  minimums: MinimumSizes = DEFAULT_MINIMUM_SIZES,
): CellSize {
  return minimums[kind] ?? { w: 1, h: 1 };
}

/**
 * The minimum size of THIS region: its kind's, and for a fader two cells
 * along the axis it reads - the one rule the kind alone cannot
 * state. geometry.ts's `validate` reads this one.
 */
export function minimumSizeFor(
  region: Region,
  minimums: MinimumSizes = DEFAULT_MINIMUM_SIZES,
): CellSize {
  const byKind = minimumSizeOf(region.kind, minimums);
  if (region.kind !== "fader") return byKind;
  return orientationOf(region) === "horizontal"
    ? { w: Math.max(byKind.w, 2), h: byKind.h }
    : { w: byKind.w, h: Math.max(byKind.h, 2) };
}

// ---------------------------------------------------------------------------
// Cells.

/** A region's place and size, zero-based - the plate's own cells. */
export type Box = {
  readonly col: number;
  readonly row: number;
  readonly w: number;
  readonly h: number;
};

/** The smallest box holding every box given; undefined for none (change 13A: a group's outline and its move). */
export function boundingBox(boxes: readonly Box[]): Box | undefined {
  if (boxes.length === 0) return undefined;
  let left = SURFACE_SIZE;
  let top = SURFACE_SIZE;
  let right = 0;
  let bottom = 0;
  for (const b of boxes) {
    left = Math.min(left, b.col);
    top = Math.min(top, b.row);
    right = Math.max(right, b.col + b.w);
    bottom = Math.max(bottom, b.row + b.h);
  }
  return { col: left, row: top, w: right - left, h: bottom - top };
}

/** Locked (change 13A): the element is not moved, resized or deleted; absent is unlocked. */
export const lockedOf = (region: Region): boolean => region.locked === true;

/** The cell index of a column and a row, both 0-based: `row*9 + col`. */
export const cellIndex = (col: number, row: number): number =>
  row * SURFACE_SIZE + col;

/** The region's cells, in reading order. Assumes the region is on the surface. */
export function cellsOf(region: Region): number[] {
  const out: number[] = [];
  for (let r = region.row; r < region.row + region.h; r += 1) {
    for (let c = region.col; c < region.col + region.w; c += 1) {
      out.push(cellIndex(c, r));
    }
  }
  return out;
}

/** A structurally identical copy - the shape a duplicate starts from. */
export function cloneRegion(region: Region): Region {
  return {
    ...region,
    colour: [...region.colour],
    // Change 21A: the extras are the copy's own (a field absent stays absent).
    ...(region.extras === undefined
      ? {}
      : { extras: region.extras.map((x) => ({ ...x })) }),
  };
}

/** The empty surface. */
export function emptySurface(id: string, name: string): Surface {
  return { id, name, regions: [] };
}

/**
 * The surface with its brightness set, canonically: 255 is the field's absence (so a surface at
 * full reads, emits and hashes exactly as one written before the field existed), anything else
 * is carried. The value is the caller's to validate (catalog/brightness.ts's isBrightness).
 */
export function withBrightness(surface: Surface, brightness: number): Surface {
  if (brightness === 255) {
    if (surface.brightness === undefined) return surface;
    const rest = { ...surface };
    delete (rest as { brightness?: number }).brightness;
    return rest;
  }
  return { ...surface, brightness };
}
