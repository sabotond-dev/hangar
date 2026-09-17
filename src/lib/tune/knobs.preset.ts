// The nine per-card knob tables: the semantics the vendored compiler does not
// carry. `KnobKind` is a LABEL, NOT A BINDING - nothing in the vendored tree
// says which `PadState` field a kind moves (`colour` is `look.colour` on four
// cards, `touch.colour` on the joystick, `sends.gridColour` on the nine pads);
// BOTOR resolves that in a per-card if/else chain HANGAR may not copy, so this
// module is the recovered mapping as data, held by knobs.preset.spec.ts against
// `presetById(id).knobs`. Three things are READ, not restated: the detent tables
// are the value sets, the vendored quantiseColour is the colour lattice, every
// default index is derived from the card's shipped state (throwing at import).
// Model side of D-18: no component names it.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  DIAL_SENSE_TABLE,
  SPEED_TABLE,
  TRACKPAD_POINTER_CAPS,
  TRACKPAD_SCROLL_UNITS,
  TRACKPAD_TAP_TOLERANCE,
  quantiseColour,
  type PadSheet,
  type PadState,
  type RGB,
  type TouchKind,
} from "../../vendor/botor/_pad";
import { presetById } from "../catalog/presets";
import { withChange, type KnobBinding } from "./state";
import type { KnobKindName } from "./view";

/**
 * One knob, in the shape BOTH routes arrive at the panel in. A Lua entry's
 * knobs map into exactly this (knobs.lua.ts), which is what makes the panel
 * unable to tell a compiler-driven card from a hand-authored one.
 *
 * `options` are strings even where they read as numbers, exactly as
 * `LuaKnob.values` already is: one type keeps the stamp an integer-index
 * problem and lets view.ts's readout rules work unchanged for both routes.
 */
export type KnobDescriptor = {
  /** Stable within the entry. The reset target and the stamp's position. */
  id: string;
  /** The visible label: "Speed", "On lift". */
  label: string;
  /** Picks the widget, and NEVER the field. */
  kind: KnobKindName;
  /** Ordered, at least two, one value per position. */
  options: readonly string[];
  /** An INDEX into `options`, never a value. */
  default: number;
};

/** A compiler-driven knob also knows how to move and read a `PadState`. */
export type PresetKnob = KnobDescriptor &
  KnobBinding & {
    /** `fitState`'s `pinned`: the sheet the visitor's hand is on. */
    sheet: PadSheet;
  };

// RETIRED BY NAME, 2026-09-17 (BENCH-2026-09-16.txt section 5b, the user's word: "one").
//
// `BRIGHTNESS_KNOB_ID` ("brightness"), `brightnessKnob`, `BRIGHTNESS_OPTIONS` and
// `stepForBrightnessIndex` were the universal five-detent knob (15 / 30 / 50 / 75 / 100 percent
// of `BRIGHTNESS_TABLE`, appended to every card that lights something, in the BOTOR stamp as
// format `c`, rolled by Randomize). Change 5 gave every configuration ONE brightness - an
// integer 1..255 applied to the colours HANGAR writes (src/lib/catalog/brightness.ts) - and two
// controls multiplied, so this one goes. THE STATE FIELD IS PINNED AT FULL, not left free:
// `baseStateFor` (tune/state.ts) writes the table's last step on every preset state HANGAR
// compiles, so the field's scaling is the only brightness. D-01's three-knob floor drops to two
// on STARFIELD and FOUR FADERS by the same word; knobs.preset.spec.ts test 1 carries the dated
// exemption. Five cards keep four or more knobs and lost nothing else.

// ---------------------------------------------------------------------------
// Small shared arithmetic.

const literalOf = (c: RGB): string => `${c.r},${c.g},${c.b}`;

/**
 * The index of a shipped value inside its own option list, or a throw.
 *
 * Deriving every default from the card's own state is what makes "RESET ALL
 * lands on the card as published" true by construction rather than by a test
 * that could be written wrong. Falling back to 0 instead would turn a
 * mistyped option into a card that silently ships at the wrong position, so
 * this is a startup failure - the same rule ported.ts already applies to an
 * entry that names no shelf preset.
 */
function mustIndex(
  options: readonly string[],
  value: string,
  where: string,
): number {
  const index = options.indexOf(value);
  if (index < 0) {
    throw new Error(
      `${where}: the card ships at ${value}, which is not one of ${options.join(" ")}`,
    );
  }
  return index;
}

/** The inverse of an option list. Clamps to 0, because a rack must render. */
const indexOf = (options: readonly string[], value: string): number => {
  const found = options.indexOf(value);
  return found < 0 ? 0 : found;
};

// ---------------------------------------------------------------------------
// The colour lattice, and the binding rule.

/**
 * THE LATTICE (D-06, 10-08). Sixteen steps per channel, 4,096 colours, and no
 * more: `quantiseColour` snaps every stored channel to a multiple of 17
 * (`_pad.ts`), so a `PadState` holds exactly RGB444 - the whole reachable
 * colour space, and the picker is built ON it. `read` / `apply` are INDEX <->
 * RGB444 ARITHMETIC, not lookups into a palette, which is what makes
 * `read(apply(state, i)) === i` true by construction for all 4,096.
 */
export const COLOUR_LATTICE_STEPS = 16;
export const COLOUR_LATTICE_SIZE =
  COLOUR_LATTICE_STEPS * COLOUR_LATTICE_STEPS * COLOUR_LATTICE_STEPS;

/**
 * Position -> colour. Clamped rather than throwing, for the same reason
 * `indexOf` clamps: a rack must render, and a stamp arriving with a position
 * past the end is `decodeFor`'s problem to refuse, not this function's problem
 * to crash on.
 */
export function colourAt(index: number): RGB {
  const i = Math.min(
    COLOUR_LATTICE_SIZE - 1,
    Math.max(0, Math.trunc(Number.isFinite(index) ? index : 0)),
  );
  return {
    r: ((i >> 8) & 15) * 17,
    g: ((i >> 4) & 15) * 17,
    b: (i & 15) * 17,
  };
}

/**
 * Colour -> position. Quantises FIRST, through the vendored rule rather than a
 * local `Math.round(v / 17) * 17`: a reimplementation here would drift from the
 * state model on the day `_pad.ts` changes the step, and `read(apply(i)) === i`
 * would break silently on a shared link rather than loudly in this file.
 */
export function colourIndexOf(colour: RGB): number {
  const q = quantiseColour(colour);
  return ((q.r / 17) << 8) | ((q.g / 17) << 4) | (q.b / 17);
}

/**
 * The 4,096 literals, built ONCE at module scope and shared by every colour
 * knob. `presetKnobs()` is called per entry inside two sweeps and inside every
 * stamp decode; building 4,096 strings per call would be a measurable cost for
 * a list that is the same list every time.
 */
const COLOUR_OPTIONS: readonly string[] = Object.freeze(
  Array.from({ length: COLOUR_LATTICE_SIZE }, (_, i) => literalOf(colourAt(i))),
);

/** Which colour field this card's `colour` knob moves. */
export type ColourTarget = "look" | "touch" | "sends";

/**
 * The compiler's own `touchUsesColour` (`_pad.ts:2624`), reimplemented for the
 * same reason `withChange` is: it is module-private and `src/vendor/` is
 * read-only. A touch kind that derives its hues arithmetically (per-finger) or
 * paints nothing has no colour for a knob to move.
 */
const touchUsesColour = (kind: TouchKind): boolean =>
  kind === "comet" || kind === "bloom" || kind === "glow";

/**
 * The colour binding, DERIVED from the state rather than tabulated. It
 * reproduces BOTOR's own per-card choice on all nine cards, which is why it is
 * asserted in the spec instead of written out nine times.
 */
export function colourTargetFor(state: PadState): ColourTarget | undefined {
  if (state.enabled.look && state.look.kind !== "none") return "look";
  if (state.enabled.touch && touchUsesColour(state.touch.kind)) return "touch";
  if (state.enabled.sends && state.sends.showGrid) return "sends";
  return undefined;
}

function colourOf(state: PadState, target: ColourTarget): RGB {
  if (target === "look") return state.look.colour;
  if (target === "touch") return state.touch.colour;
  return state.sends.gridColour;
}

// ---------------------------------------------------------------------------
// The knobs. One factory per binding, each closing over the card's own state
// for its default index.

function colourKnob(base: PadState): PresetKnob {
  const target = colourTargetFor(base);
  if (!target) throw new Error("a colour knob on a card with no colour");
  const sheet: PadSheet = target === "sends" ? "sends" : target;
  // THE DEFAULT IS THE CARD'S OWN COLOUR, at whatever lattice position that
  // colour occupies. The sentence this replaces said "the default is always
  // position 1", which was true of a list built as own-colour-first and is
  // false of a lattice: aurora ships at 0,85,255 and therefore at position 95,
  // ninepads at 0,68,204 and therefore at position 76. What has NOT changed is
  // the property the old sentence existed to guarantee - RESET ALL lands on the
  // card as published - and it is still derived from the card's own state
  // rather than tabulated.
  return {
    id: "colour",
    label: "Colour",
    kind: "colour",
    options: COLOUR_OPTIONS,
    default: colourIndexOf(colourOf(base, target)),
    sheet,
    apply: (state, index) =>
      withChange(state, (draft) => {
        const value = colourAt(index);
        if (target === "look") draft.look.colour = value;
        else if (target === "touch") draft.touch.colour = value;
        else draft.sends.gridColour = value;
      }),
    read: (state) => colourIndexOf(colourOf(state, target)),
  };
}

/** The eight firmware rates, as their detent steps. */
const SPEED_OPTIONS = SPEED_TABLE.map((row) => String(row.step));

function speedKnob(base: PadState): PresetKnob {
  return {
    id: "speed",
    label: "Speed",
    kind: "speed",
    options: SPEED_OPTIONS,
    default: mustIndex(SPEED_OPTIONS, String(base.look.speed), "speed"),
    sheet: "look",
    apply: (state, index) =>
      withChange(state, (draft) => {
        draft.look.speed = Number.parseInt(SPEED_OPTIONS[index], 10);
      }),
    read: (state) => indexOf(SPEED_OPTIONS, String(state.look.speed)),
  };
}

/**
 * Two of the compiler's four `Axis` values, and the reason is the no-op gate.
 *
 * `look.axis` is the right field - it is a real field, the wave and scan looks
 * read it, and view.ts already has words for all four. But the wave emitter
 * branches on `antidiagonal` ALONE (`_pad.ts:2652`: the sign in
 * `(n%9 +/- n//9)`), so `x`, `y` and `diagonal` all compile to the same body.
 * Offering four positions where three paint the same picture is precisely the
 * decorative knob the gate exists to catch, so the option set is the two that
 * differ. The words are view.ts's own: Rising and Falling.
 */
const DIRECTION_OPTIONS: readonly string[] = ["diagonal", "antidiagonal"];

function directionKnob(base: PadState): PresetKnob {
  return {
    id: "direction",
    label: "Direction",
    kind: "direction",
    options: DIRECTION_OPTIONS,
    default: mustIndex(DIRECTION_OPTIONS, base.look.axis, "direction"),
    sheet: "look",
    apply: (state, index) =>
      withChange(state, (draft) => {
        draft.look.axis = DIRECTION_OPTIONS[index] as PadState["look"]["axis"];
      }),
    read: (state) => indexOf(DIRECTION_OPTIONS, state.look.axis),
  };
}

/**
 * The wave's band width. Three wavelengths inside the legal 8..45 window and
 * clear of the 27..29 exclusion, which `snapWavelength` would move under the
 * knob: a narrow band, the card's own 15, and a single slow sweep.
 */
const BAND_OPTIONS: readonly string[] = ["10", "15", "36"];

function bandKnob(base: PadState): PresetKnob {
  return {
    id: "band",
    label: "Band",
    kind: "size",
    options: BAND_OPTIONS,
    default: mustIndex(BAND_OPTIONS, String(base.look.wavelength), "band"),
    sheet: "look",
    apply: (state, index) =>
      withChange(state, (draft) => {
        draft.look.wavelength = Number.parseInt(BAND_OPTIONS[index], 10);
      }),
    read: (state) => indexOf(BAND_OPTIONS, String(state.look.wavelength)),
  };
}

const ARMS_OPTIONS: readonly string[] = ["1", "2", "3"];

function armsKnob(base: PadState): PresetKnob {
  return {
    id: "arms",
    label: "Arms",
    kind: "count",
    options: ARMS_OPTIONS,
    default: mustIndex(ARMS_OPTIONS, String(base.look.arms), "arms"),
    sheet: "look",
    apply: (state, index) =>
      withChange(state, (draft) => {
        draft.look.arms = Number.parseInt(ARMS_OPTIONS[index], 10) as 1 | 2 | 3;
      }),
    read: (state) => indexOf(ARMS_OPTIONS, String(state.look.arms)),
  };
}

const EDGE_OPTIONS: readonly string[] = ["soft", "hard"];

function edgeKnob(base: PadState): PresetKnob {
  return {
    id: "edge",
    label: "Edge",
    kind: "feel",
    options: EDGE_OPTIONS,
    default: mustIndex(EDGE_OPTIONS, base.look.edge, "edge"),
    sheet: "look",
    apply: (state, index) =>
      withChange(state, (draft) => {
        draft.look.edge = EDGE_OPTIONS[index] === "hard" ? "hard" : "soft";
      }),
    read: (state) => indexOf(EDGE_OPTIONS, state.look.edge),
  };
}

/**
 * The first controller number a card sends on.
 *
 * TWELVE options, which is more than eight ON PURPOSE. view.ts offers a
 * `note`-kind knob a word row of scientific pitch names, and this knob's value
 * is a CC number, not a note - "CC 16" displayed as "E1" would be exactly the
 * renumbering lie X-08 forbids. Above eight options the widget rule falls
 * through to a rail, whose readout is the raw integer. The list stops at 80
 * because `maxCcBase` clamps a four-fader card at 124 and a knob that silently
 * clamped would not round-trip.
 */
const SEND_OPTIONS: readonly string[] = [
  "16",
  "20",
  "24",
  "28",
  "32",
  "36",
  "40",
  "44",
  "48",
  "52",
  "64",
  "80",
];

function sendKnob(base: PadState): PresetKnob {
  return {
    id: "send",
    label: "Send",
    kind: "note",
    options: SEND_OPTIONS,
    default: mustIndex(SEND_OPTIONS, String(base.sends.ccBase), "send"),
    sheet: "sends",
    apply: (state, index) =>
      withChange(state, (draft) => {
        draft.sends.ccBase = Number.parseInt(SEND_OPTIONS[index], 10);
      }),
    read: (state) => indexOf(SEND_OPTIONS, String(state.sends.ccBase)),
  };
}

/**
 * All sixteen MIDI channels, ONE-BASED, because that is how `PadState` stores
 * them and how the compiler's own stream descriptions read them back to the
 * visitor ("CC 16 on channel 1"). The emitted Lua sends `channel - 1`; the
 * knob shows the number the DAW shows.
 */
const CHANNEL_OPTIONS: readonly string[] = Array.from({ length: 16 }, (_, i) =>
  String(i + 1),
);

function channelKnob(base: PadState): PresetKnob {
  return {
    id: "channel",
    label: "Channel",
    kind: "amount",
    options: CHANNEL_OPTIONS,
    default: mustIndex(CHANNEL_OPTIONS, String(base.sends.channel), "channel"),
    sheet: "sends",
    apply: (state, index) =>
      withChange(state, (draft) => {
        draft.sends.channel = Number.parseInt(CHANNEL_OPTIONS[index], 10);
      }),
    read: (state) => indexOf(CHANNEL_OPTIONS, String(state.sends.channel)),
  };
}

/**
 * The lowest note on the grid. Four octaves of C, which every one of the four
 * scales can build nine zones on top of without `zoneMaxBase` clamping - and
 * four options is under the eight-option ceiling, so this knob DOES get its
 * word row: C1, C2, C3, C4.
 */
const NOTES_OPTIONS: readonly string[] = ["24", "36", "48", "60"];

function notesKnob(base: PadState): PresetKnob {
  return {
    id: "notes",
    label: "Notes",
    kind: "note",
    options: NOTES_OPTIONS,
    default: mustIndex(NOTES_OPTIONS, String(base.sends.baseNote), "notes"),
    sheet: "sends",
    apply: (state, index) =>
      withChange(state, (draft) => {
        draft.sends.baseNote = Number.parseInt(NOTES_OPTIONS[index], 10);
      }),
    read: (state) => indexOf(NOTES_OPTIONS, String(state.sends.baseNote)),
  };
}

/**
 * NINE PADS' grid, as the number of PADS rather than as a grid string.
 *
 * The user's bench note is "make it selectable to 4x4". `sends.grid` already
 * accepted "4x4" and already compiled; nothing reached it. This is that knob.
 *
 * THE OPTIONS ARE "9" AND "16" AND NOT "3x3" AND "4x4", and the reason is the
 * readout rather than taste. `count` is not one of view.ts's WORD_KINDS, so a
 * grid knob renders as a rail, and a rail prints `integerReadout` when every
 * option is a single integer and falls back to "2 of 3" when one is not.
 * "3x3" is not an integer, so a literal grid string would render the card's
 * one new control as a positional rail with nothing on it. 9 and 16 ARE the
 * number of pads, which is the one readout a visitor can act on without
 * knowing what a zone grid is - and the card is called Nine pads.
 *
 * 9x9 IS REACHABLE IN THE DESCRIPTOR AND IS DELIBERATELY NOT OFFERED. It
 * compiles, at 307 of 908 - cheaper than either - but eighty-one zones is a
 * different card rather than a position of this one, and the note asked for
 * 4x4. Adding it later is one entry in each of the two lists below.
 */
const GRID_PADS: readonly { pads: string; grid: PadState["sends"]["grid"] }[] =
  [
    { pads: "9", grid: "3x3" },
    { pads: "16", grid: "4x4" },
  ];
const GRID_OPTIONS: readonly string[] = GRID_PADS.map((row) => row.pads);

const padsOfGrid = (grid: PadState["sends"]["grid"]): string =>
  GRID_PADS.find((row) => row.grid === grid)?.pads ?? GRID_PADS[0].pads;

function gridKnob(base: PadState): PresetKnob {
  return {
    id: "grid",
    label: "Pads",
    kind: "count",
    options: GRID_OPTIONS,
    default: mustIndex(GRID_OPTIONS, padsOfGrid(base.sends.grid), "grid"),
    sheet: "sends",
    apply: (state, index) =>
      withChange(state, (draft) => {
        draft.sends.grid = GRID_PADS[index].grid;
      }),
    read: (state) => indexOf(GRID_OPTIONS, padsOfGrid(state.sends.grid)),
  };
}

/** The compiler's four `ScaleKind` members, which view.ts already words. */
const SCALE_OPTIONS: readonly string[] = [
  "chromatic",
  "major",
  "minor",
  "pentatonic",
];

function scaleKnob(base: PadState): PresetKnob {
  return {
    id: "scale",
    label: "Scale",
    kind: "scale",
    options: SCALE_OPTIONS,
    default: mustIndex(SCALE_OPTIONS, base.sends.scale, "scale"),
    sheet: "sends",
    apply: (state, index) =>
      withChange(state, (draft) => {
        draft.sends.scale = SCALE_OPTIONS[index] as PadState["sends"]["scale"];
      }),
    read: (state) => indexOf(SCALE_OPTIONS, state.sends.scale),
  };
}

/** Eight detents into the dial's fine-units-per-tick table. */
const SENSE_OPTIONS = DIAL_SENSE_TABLE.map((_, i) => String(i + 1));

function senseKnob(base: PadState): PresetKnob {
  return {
    id: "sensitivity",
    label: "Sensitivity",
    kind: "feel",
    options: SENSE_OPTIONS,
    default: mustIndex(
      SENSE_OPTIONS,
      String(base.sends.dialSense),
      "sensitivity",
    ),
    sheet: "sends",
    apply: (state, index) =>
      withChange(state, (draft) => {
        draft.sends.dialSense = Number.parseInt(SENSE_OPTIONS[index], 10);
      }),
    read: (state) => indexOf(SENSE_OPTIONS, String(state.sends.dialSense)),
  };
}

const MODE_OPTIONS: readonly string[] = ["relative", "absolute"];

function modeKnob(base: PadState): PresetKnob {
  return {
    id: "mode",
    label: "Mode",
    kind: "mode",
    options: MODE_OPTIONS,
    default: mustIndex(MODE_OPTIONS, base.sends.dialMode, "mode"),
    sheet: "sends",
    apply: (state, index) =>
      withChange(state, (draft) => {
        draft.sends.dialMode =
          MODE_OPTIONS[index] === "absolute" ? "absolute" : "relative";
      }),
    read: (state) => indexOf(MODE_OPTIONS, state.sends.dialMode),
  };
}

const BEND_OPTIONS: readonly string[] = ["none", "x", "y"];

function bendKnob(base: PadState): PresetKnob {
  return {
    id: "bend",
    label: "Bend",
    kind: "bend",
    options: BEND_OPTIONS,
    default: mustIndex(BEND_OPTIONS, base.sends.bend, "bend"),
    sheet: "sends",
    apply: (state, index) =>
      withChange(state, (draft) => {
        draft.sends.bend = BEND_OPTIONS[index] as PadState["sends"]["bend"];
      }),
    read: (state) => indexOf(BEND_OPTIONS, state.sends.bend),
  };
}

/**
 * `spring` and `springTo` as ONE vocabulary, because that is how a visitor
 * experiences them: the pad either stays where it was left, comes home to the
 * middle, or falls to zero. `springTo` is unreadable while `spring` is off -
 * normalise resets it (`_pad.ts:1443`) - so two fields under one knob is the
 * shape that cannot show a value the card is not using.
 */
const SPRING_OPTIONS: readonly string[] = ["off", "centre", "zero"];

function springWordOf(state: PadState): string {
  if (!state.sends.spring) return "off";
  return state.sends.springTo === "zero" ? "zero" : "centre";
}

function springKnob(base: PadState): PresetKnob {
  return {
    id: "spring",
    label: "On lift",
    kind: "spring",
    options: SPRING_OPTIONS,
    default: mustIndex(SPRING_OPTIONS, springWordOf(base), "spring"),
    sheet: "sends",
    apply: (state, index) =>
      withChange(state, (draft) => {
        const word = SPRING_OPTIONS[index];
        draft.sends.spring = word !== "off";
        draft.sends.springTo = word === "zero" ? "zero" : "centre";
      }),
    read: (state) => indexOf(SPRING_OPTIONS, springWordOf(state)),
  };
}

// The trackpad's three detent tables. Every one is eight entries and three
// stamp bits, which is what keeps a hand-tuned trackpad card - the tightest
// budget on the shelf at 902 of 908 - inside its own budget once the stamp
// becomes a field dump.
const TAP_OPTIONS = TRACKPAD_TAP_TOLERANCE.map(String);
const POINTER_OPTIONS = TRACKPAD_POINTER_CAPS.map(String);
const SCROLL_OPTIONS = TRACKPAD_SCROLL_UNITS.map(String);

function tapKnob(base: PadState): PresetKnob {
  return {
    id: "tap",
    label: "Tap",
    kind: "feel",
    options: TAP_OPTIONS,
    default: mustIndex(
      TAP_OPTIONS,
      String(base.sends.trackpad.tapTolerance),
      "tap",
    ),
    sheet: "sends",
    apply: (state, index) =>
      withChange(state, (draft) => {
        draft.sends.trackpad = {
          ...draft.sends.trackpad,
          tapTolerance: Number.parseInt(TAP_OPTIONS[index], 10),
        };
      }),
    read: (state) =>
      indexOf(TAP_OPTIONS, String(state.sends.trackpad.tapTolerance)),
  };
}

function pointerKnob(base: PadState): PresetKnob {
  return {
    id: "pointer",
    label: "Pointer speed",
    kind: "amount",
    options: POINTER_OPTIONS,
    default: mustIndex(
      POINTER_OPTIONS,
      String(base.sends.trackpad.pointerCap),
      "pointer",
    ),
    sheet: "sends",
    apply: (state, index) =>
      withChange(state, (draft) => {
        draft.sends.trackpad = {
          ...draft.sends.trackpad,
          pointerCap: Number.parseInt(POINTER_OPTIONS[index], 10),
        };
      }),
    read: (state) =>
      indexOf(POINTER_OPTIONS, String(state.sends.trackpad.pointerCap)),
  };
}

/**
 * The trackpad's third knob, and the reason it exists.
 *
 * A card that lights nothing cannot hold a brightness: canonicalise resets it
 * to Full (`_pad.ts:1486`), so the universal knob below would snap back the
 * moment it was turned. Rather than ship that, such a card is not offered
 * brightness at all - which is what BOTOR's own panel does (`_pad.ts:883`) -
 * and D-01's three-knob floor is met with a third REAL knob from the card's
 * own third detent table instead.
 */
function scrollKnob(base: PadState): PresetKnob {
  return {
    id: "scroll",
    label: "Scroll",
    kind: "amount",
    options: SCROLL_OPTIONS,
    default: mustIndex(
      SCROLL_OPTIONS,
      String(base.sends.trackpad.scrollUnits),
      "scroll",
    ),
    sheet: "sends",
    apply: (state, index) =>
      withChange(state, (draft) => {
        draft.sends.trackpad = {
          ...draft.sends.trackpad,
          scrollUnits: Number.parseInt(SCROLL_OPTIONS[index], 10),
        };
      }),
    read: (state) =>
      indexOf(SCROLL_OPTIONS, String(state.sends.trackpad.scrollUnits)),
  };
}

// ---------------------------------------------------------------------------
// The nine cards.

type Factory = (base: PadState) => PresetKnob;

/**
 * The recovered table, transcribed from 05-RESEARCH's reading of BOTOR's panel
 * at the pinned SHA. The KINDS are held against `presetById(id).knobs` by the
 * spec; the FIELDS are what this table adds, and only a compile-time gate can
 * check those - which is what the spec's no-op test is.
 */
const BY_PRESET: Readonly<Record<string, readonly Factory[]>> = {
  aurora: [colourKnob, speedKnob, directionKnob, bandKnob],
  pinwheel: [colourKnob, speedKnob, armsKnob],
  starfield: [colourKnob, edgeKnob],
  radar: [colourKnob, speedKnob, sendKnob],
  joystick: [colourKnob, sendKnob, bendKnob, springKnob],
  // gridKnob is APPENDED, never inserted, so every pre-existing knob keeps its
  // index (knobs.preset.spec.ts asserts that by id and position). What it does
  // NOT change, and this is worth knowing before the next plan writes the same
  // caution: a preset-backed entry's stamp is not an index vector at all.
  // share/stamp.ts's encodeFor sends a "padsim" entry through the VENDORED
  // encodeStamp over the PadState, and only a "lua" entry gets format x or w,
  // whose payload is one base-32 character per knob BY INDEX. So knob order is
  // stamp payload for the eighteen hand-authored entries and for none of the
  // nine. Appending is still the right shape, and the assertion is still worth
  // its line, but no shared NINE PADS link was ever at risk here.
  ninepads: [colourKnob, notesKnob, scaleKnob, channelKnob, gridKnob],
  faders: [sendKnob, channelKnob],
  dial: [sendKnob, senseKnob, modeKnob, channelKnob],
  tpad: [tapKnob, pointerKnob, scrollKnob],
};

/**
 * The knobs a shelf card exposes, in rack order: the card's own table and
 * nothing appended (the brightness knob is retired, see the block above).
 */
export function presetKnobs(presetId: string): readonly PresetKnob[] {
  const preset = presetById(presetId);
  if (!preset) throw new Error(`unknown preset: ${presetId}`);
  const factories = BY_PRESET[presetId];
  if (!factories) throw new Error(`no knob table for preset: ${presetId}`);
  return factories.map((make) => make(preset.state));
}
