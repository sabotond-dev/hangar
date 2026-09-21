// The workspace's and the inspector's words (13-09; PDF page 5, Bible sections
// 7, 10 and 16). Imports nothing, for the reason copy.ts gives: a component
// under src/lib/ui/ may name it and it costs no chunk. A second copy module
// beside copy.ts because the Bible's lines for Randomize, Reset settings and
// Share snapshot live here (RANDOMIZE, RESET_SETTINGS, SHARE_SNAPSHOT), each
// with one home. The PDF's strings are VERBATIM (13-COPY-NEW.md's first rule);
// what HANGAR wrote - the accessible names, the inspector's one headline for
// every entry, the MIDI fields' refusals (13.1-07) and the monitor's controls -
// is in D-05's register and ledgered in 13-COPY-NEW.md and 13.1-COPY-NEW.md.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

// ---------------------------------------------------------------------------
// The inspector (PDF page 5, right column). Verbatim.

/** The eyebrow above the headline. Uppercase: a short section label (D-05). */
export const INSPECTOR_EYEBROW = "CONFIGURATION";

/** The two-line headline, one constant for every entry. Ledgered for 13-18. */
export const INSPECTOR_HEADLINE: readonly [string, string] = [
  "Shape the",
  "movement.",
];

/** The sentence beneath it. PDF page 5, verbatim. */
export const INSPECTOR_LEDE = "Tune the gesture, then try it on your surface.";

/**
 * The five section titles (change 16, 2026-09-21): the settings grouped by what they change, in
 * this fixed order - the light, the movement, the notes, the wire, the clock. HANGAR's own, one
 * word each. SECTION_BEHAVIOR ("Behavior") and SECTION_APPEARANCE ("Appearance") ARE RETIRED BY
 * NAME, 2026-09-21: PDF page 5's two titles held the whole rack and the colour block; the Sandbox
 * keeps its own copies of both words in sandbox/copy.ts. "MIDI output" became "MIDI".
 */
export const SECTION_LOOK = "Look";
export const SECTION_FEEL = "Feel";
export const SECTION_SOUND = "Sound";
export const SECTION_MIDI = "MIDI";
export const SECTION_SYNC = "Sync";

/** The helper under the MIDI fields, read by a screen reader only since change 16. Section 16 / PDF page 5, verbatim. */
export const MIDI_HELPER =
  "Map this CC to a parameter in your instrument or DAW.";

// ---------------------------------------------------------------------------
// The stepper (change 16): a typed field with a step box either side. HANGAR's own - ledgered.

/** The two step boxes' accessible names; the field they step is the row's, named by its label. */
export const STEP_DOWN = "Step down";
export const STEP_UP = "Step up";

/**
 * A stepper field's description and title: the one rule a visitor needs. A typed value lands on
 * a rung the configuration declares, never between two, because the budget was measured on the rungs.
 */
export const SNAP_HINT =
  "A typed value snaps to the nearest step this setting offers.";

// ---------------------------------------------------------------------------
// The MIDI output's two typed fields (13.1-07; 13.1-CONTEXT D-09): a text input
// OVER a knob's closed list, never a free numeric - a typed value the knob
// offers moves the knob, one it does not is refused with the offered values
// named. The labels are the PDF's; the refusals and the cue are ledgered.

/** PDF page 5's two field labels, verbatim - for a knob with id `cc` and one with id `channel`. */
export const CC_NUMBER_LABEL = "CC number";
export const CHANNEL_LABEL = "Channel";

/**
 * The visible label of a MIDI field: the PDF's word for `cc` and `channel`,
 * the knob's own for everything else - morph's `ccBase` reads `CC base` and
 * a preset's `send` reads `Send`, because the PDF's `CC number` would
 * misname a base (13.1-CONTEXT question 6, shipped this way).
 */
export function midiFieldLabel(knob: { id: string; label: string }): string {
  if (knob.id === "cc") return CC_NUMBER_LABEL;
  if (knob.id === "channel") return CHANNEL_LABEL;
  return knob.label;
}

/** A keystroke that is not a whole number. Ledgered; the Sandbox's G.27 line is the model. */
export const TYPE_A_NUMBER = "Type a whole number.";

/**
 * The refusal under a typed NOTE field (change 8, 2026-09-18: ORBIT's four ring notes), for a name
 * the field cannot read and for a number outside the range alike - both are "not a note here".
 * Sharps as the readout spells them (C4 = 60: 0 is C-1, 127 is G9); the numbers because a drum map
 * is often written in them, and because Live spells the same range C-2..G8.
 */
export const NOTE_OFFERED = "A note here is C-1 to G9, or 0 to 127.";

/**
 * The line under Behavior while the preview holds a knob at its `previewIndex` (change 8: ORBIT's
 * Sync at External). The browser has no MIDI clock to follow; the module gets the visitor's choice.
 */
export const PREVIEW_INTERNAL_CLOCK =
  "The browser preview has no MIDI clock, so it runs the internal tempo here. Your ZONA follows your DAW.";

/**
 * The refusal when a typed whole number is one the knob does not offer, naming
 * what it does offer (13.1-CONTEXT D-09). Two forms from ONE builder: a list
 * with gaps names its values (`one of 1, 16, 20, 74 or 102`), a contiguous run
 * its bounds (`0 to 15` on a Lua entry, `1 to 16` on a preset). The noun is
 * the knob's: `channel` for the channel, `controller number` otherwise.
 */
export function offeredLine(id: string, literals: readonly string[]): string {
  const noun = id === "channel" ? "A channel" : "A controller number";
  const run = contiguousRun(literals);
  if (run !== undefined) return `${noun} here is ${run.min} to ${run.max}.`;
  const list =
    literals.length <= 1
      ? literals.join("")
      : `${literals.slice(0, -1).join(", ")} or ${literals[literals.length - 1]}`;
  return `${noun} here is one of ${list}.`;
}

/**
 * A contiguous integer run's bounds, or undefined. Restated here rather than
 * imported from view.ts because this module imports nothing (its header);
 * view.ts's `integerRun` is the same rule and view.spec.ts holds the two
 * equal on the same inputs.
 */
function contiguousRun(
  literals: readonly string[],
): { min: number; max: number } | undefined {
  if (literals.length === 0) return undefined;
  const first = Number.parseInt(literals[0], 10);
  if (!Number.isInteger(first) || !/^-?[0-9]+$/.test(literals[0])) {
    return undefined;
  }
  for (let at = 1; at < literals.length; at++) {
    if (
      !/^-?[0-9]+$/.test(literals[at]) ||
      Number.parseInt(literals[at], 10) !== first + at
    ) {
      return undefined;
    }
  }
  return { min: first, max: first + literals.length - 1 };
}

/**
 * The cue under a Lua entry's Channel field (D-09; X-08): a hand-authored
 * entry's channel is the firmware's zero-based literal - renumbering a value
 * about to be written to hardware is the lie X-08 forbids - while the PDF and
 * every preset show the DAW's `1`. A preset's channel carries no cue.
 */
export const LUA_CHANNEL_CUE =
  "The firmware counts channels from 0; your DAW’s channel 1 is 0 here.";

/**
 * The two action buttons under Behavior. PDF page 5, verbatim; the glyph is
 * drawn aria-hidden and the word is the accessible name (13-10 gives Randomize
 * its scope rule and Undo).
 */
export const RANDOMIZE = "Randomize";
export const RANDOMIZE_GLYPH = "⤬";
export const RESET_SETTINGS = "Reset settings";
/** Section 7's own words ("Provide Undo randomize"), verbatim - plan 13-10. */
export const UNDO_RANDOMIZE = "Undo randomize";

/** The swatch row's link. PDF page 5, verbatim. */
export const EDIT_COLOR = "Edit color";
/**
 * The swatch toggle's word while its colour block is open (13.1-04, D-08):
 * `Edit color` opens the block inline and the same toggle reads `Close` until
 * it is closed. HANGAR's own (the PDF draws no close) - ledgered.
 */
export const POPOVER_CLOSE = "Close";

/** The pinned pair at the inspector's foot. PDF page 5, verbatim. */
export const SAVE_COPY = "Save copy";
export const SHARE_SNAPSHOT = "Share snapshot";

// ---------------------------------------------------------------------------
// The rail (PDF page 5, left column). Verbatim.

export const RAIL_TITLE = "CONFIGURATIONS";
export const ALL_CONFIGS = "← All configs";
export const SAVE_A_COPY = "Save a copy";
export const SAVE_A_COPY_GLYPH = "☆";

// ---------------------------------------------------------------------------
// The centre (PDF page 5). Verbatim.

/** The eyebrow's first word; the FOR label follows a slash. */
export const EXPLORE = "EXPLORE";
export const MODE_CONFIGURE = "Configure";
export const MODE_PLAY = "Play";
export const MODE_PLAY_GLYPH = "▷";
export const MATRIX_LINE = "ZONA · 9 × 9 LIGHT MATRIX";

/** "X 512 / Y 512" - the PDF's readout form, with the live coordinates. */
export function coordinateLine(x: number, y: number): string {
  return `X ${x} / Y ${y}`;
}

// ---------------------------------------------------------------------------
// The MIDI monitor (PDF page 5's collapsed bar; Bible section 10; plan 13-10).
// The bar's two strings are the PDF's, verbatim. The rest are HANGAR's -
// section 10 names the six columns as nouns and gives the controls verbs but
// no labels - and are ledgered in 13-COPY-NEW.md for 13-18.

export const MIDI_MONITOR = "MIDI monitor";
export const MONITOR_STATUS = "Browser preview · No MIDI output";

/** Section 10's six columns, in its order, capitalised as table heads. */
export const MONITOR_COLUMNS: readonly [
  string,
  string,
  string,
  string,
  string,
  string,
] = ["Time", "Direction", "Source", "Channel", "Message", "Value"];

/** Direction and source are constants in v1: nothing here reaches a port. */
export const MONITOR_DIRECTION = "out";
export const MONITOR_SOURCE = "Browser preview";

export const MONITOR_PAUSE = "Pause";
export const MONITOR_RESUME = "Resume";
export const MONITOR_CLEAR = "Clear";

/**
 * The count on a coalesced row: `×12`, with U+00D7 - the real multiplication
 * sign the PDF uses in `2 × 6 units` and MATRIX_LINE already carries
 * (13-18-BATCH.md row F.17, approved by D-23). Empty for a lone message.
 */
export function monitorCount(count: number): string {
  return count > 1 ? `×${count}` : "";
}

export const MONITOR_EMPTY =
  "Nothing sent yet. Play the surface and what it sends shows here.";

export const MONITOR_PAUSED =
  "Paused. What the surface sends now is not shown until you resume.";

// ---------------------------------------------------------------------------
// The brightness field (change 5, 2026-09-17; Bible section 7 lists brightness
// among a Visual configuration's essential properties): one typed number for
// the whole light output, 1..255, under Appearance on both routes. HANGAR's
// own - ledgered.

/** The field's label. */
export const BRIGHTNESS_LABEL = "Brightness";

/** A typed whole number outside the range, refused inline (TYPE_A_NUMBER covers the rest). */
export const BRIGHTNESS_RANGE = "Brightness is 1 to 255.";

/** The Sandbox's helper under the field: the setting is the surface's, not the selected element's. */
export const BRIGHTNESS_SURFACE_HELPER =
  "One brightness for the whole surface, every element included.";

// ---------------------------------------------------------------------------
// The per-field marker and reset (section 7). HANGAR's own - ledgered.

/**
 * The per-field reset's accessible name. The visible word is "Reset"; the
 * name carries the field so a screen reader hears which one. Ledgered.
 */
export const FIELD_RESET = "Reset";
export function fieldResetName(label: string): string {
  return `Reset ${label}`;
}

/** The changed-field marker's accessible text. Ledgered. */
export const FIELD_CHANGED = "Changed from the default";

// ---------------------------------------------------------------------------
// The document title. 13-08's form for the gallery, applied to a workspace.

export function workspaceTitle(name: string | undefined, site: string): string {
  return name === undefined ? site : `${name} — ${site}`;
}
