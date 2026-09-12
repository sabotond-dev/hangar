// The workspace's and the inspector's words (plan 13-09, PDF page 5, Bible
// section 7 and 16). THIS MODULE IMPORTS NOTHING, for the reason copy.ts
// gives: a component under src/lib/ui/ may name it freely and it costs no
// chunk.
//
// WHY A SECOND COPY MODULE BESIDE copy.ts. copy.ts was Phase 10's register
// when this module was written and copy.spec.ts held it character for
// character; 13-19 rewrote it under D-05 and retired the three Phase 10
// labels whose Bible lines live here (RANDOMIZE, RESET_SETTINGS,
// SHARE_SNAPSHOT), so each of the three has one home. The strings the Bible's page 5 gives the workspace are the PDF's and
// are taken VERBATIM here (13-COPY-NEW.md's first rule), and the few HANGAR
// had to write - the two accessible names, the inspector's one headline -
// are ledgered there for 13-18. Landing them in copy.ts would move
// copy.spec.ts's count in a plan whose term does not include it.
//
// THE INSPECTOR'S HEADLINE IS ONE CONSTANT, NOT TWENTY-SEVEN. PDF page 5
// draws "Shape the / movement." above ARC's inspector. Twenty-seven entries
// have no two-line headline of their own and inventing them is not this
// plan's to do (D-01); the headline is section-independent, ledgered, and
// per-entry headlines are recorded as a question for 13-18.
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

/** The three section titles. PDF page 5 and section 7, verbatim. */
export const SECTION_BEHAVIOR = "Behavior";
export const SECTION_APPEARANCE = "Appearance";
export const SECTION_MIDI = "MIDI output";

/** The helper line under the MIDI fields. Section 16 / PDF page 5, verbatim. */
export const MIDI_HELPER =
  "Map this CC to a parameter in your instrument or DAW.";

// ---------------------------------------------------------------------------
// The MIDI output's two typed fields (13.1-07; 13.1-CONTEXT D-09; bench line
// 7, screenshot 2: "replace MIDI channel selector with MIDI output selector
// with input fields, exactly as on the attached screenshot"). A field is a
// text input OVER a knob's closed list, never a free numeric: a typed value
// the knob offers moves the knob to that index, one it does not is refused
// in the field with the offered values named. The two labels are the PDF's;
// the refusals and the cue are HANGAR's and ledgered in 13.1-COPY-NEW.md.

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
 * The refusal when a typed whole number is one the knob does not offer,
 * naming what it does offer (13.1-CONTEXT D-09's ledgered wording). Two
 * forms from ONE builder, because the workspace's lists are not the full
 * MIDI range: a list with gaps names its values - `A controller number here
 * is one of 1, 16, 20, 74 or 102.` - and a contiguous run names its bounds -
 * `A channel here is 0 to 15.` on a Lua entry, `1 to 16` on a preset. The
 * Sandbox's G.29 `A channel is 1 to 16.` is deliberately NOT reused: it
 * cannot serve a Lua channel's 0 to 15 without lying, and one builder for
 * both bases is the one place to change when question 5 is answered. The
 * noun is the knob's: `channel` for the channel, `controller number` for
 * `cc`, `ccBase` and `send`.
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
 * The cue under a Lua entry's Channel field (13.1-PLAN-CHECK W-16; D-09;
 * X-08). A hand-authored entry's channel is the firmware's zero-based
 * literal - `0` is what the Lua sends and what the field shows, because
 * renumbering a value about to be written to hardware is the lie X-08
 * forbids - while the PDF and every preset show the DAW's `1`. Until
 * 13.1-CONTEXT question 5 is answered the field says so, in its description
 * and under it, so the state is not a silent off-by-one; a preset's channel
 * (1 to 16) carries no cue. A real apostrophe (D-05).
 */
export const LUA_CHANNEL_CUE =
  "The firmware counts channels from 0; your DAW’s channel 1 is 0 here.";

/**
 * The two action buttons under Behavior. PDF page 5, verbatim. The glyph
 * before Randomize is drawn aria-hidden beside the word; the word is the
 * accessible name. 13-10 gives Randomize section 7's scope rule and Undo;
 * this plan only names the control the PDF's way.
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
 * `Edit color` opens the block inline under the row, and the same toggle
 * reads `Close` until it is closed. F.8's approved word, kept; the symbol
 * keeps 13-09's name because three files read it. HANGAR's own (the PDF draws
 * no close) - ledgered.
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
