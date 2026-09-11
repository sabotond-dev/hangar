// The workspace's and the inspector's words (plan 13-09, PDF page 5, Bible
// section 7 and 16). THIS MODULE IMPORTS NOTHING, for the reason copy.ts
// gives: a component under src/lib/ui/ may name it freely and it costs no
// chunk.
//
// WHY A SECOND COPY MODULE BESIDE copy.ts. copy.ts is Phase 10's register
// and copy.spec.ts holds it character for character; 13-19 rewrites it under
// D-05. The strings the Bible's page 5 gives the workspace are the PDF's and
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
/** The popover's visible close. HANGAR's own (the PDF draws no popover) - ledgered. */
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

/** The count on a coalesced row: `x12`. Empty for a lone message. */
export function monitorCount(count: number): string {
  return count > 1 ? `x${count}` : "";
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
