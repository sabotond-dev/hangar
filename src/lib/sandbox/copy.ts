// Every word the Sandbox's interface shows (plan 13-16), in one module that
// imports nothing - the shape src/lib/tune/inspector-copy.ts set, so a spec
// can hold a component to the sentence it renders rather than to a copy.
//
// TWO KINDS OF STRING, MARKED. The PDF's page 3 and the Bible's sections 8 and
// 16 give most of the words, and those are VERBATIM: the rail headings, the
// four type names, `+ New surface`, `Undo`, `Redo`, `Save copy`, `Edit`,
// `Play`, the eyebrow, the sub-line, `Element name`, `Position & size`,
// `Column`, `Row`, `Width`, `Height`, `CC number`, `Channel`, `Appearance`,
// `MIDI output`, `Duplicate`, `Delete element`, the units chip, the two
// helper lines, section 8's instruction and section 16's overlap line. The
// rest - the empty state's second line, the template's name, the cap's
// reason, the mode-lock reasons, the storage-refused line, the field
// messages, the meter's sentence, the default element names - are HANGAR's,
// written in D-05's register (sentence case, the fact then the way, never
// "invalid", never coy) and ledgered in
// .planning/phases/13-gui-overhaul/13-COPY-NEW.md under "From 13-16" for
// 13-18's batch. The geometry refusals themselves live in
// src/lib/sandbox/geometry.ts (GEOMETRY_COPY, overlapLine) since 13-14 and
// 13-15 and are not repeated here.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

// ---------------------------------------------------------------------------
// The PDF's page 3, verbatim.

export const EYEBROW_SANDBOX = "SANDBOX";
/** The PDF's surface is called My performance; a new surface is named so until renamed. */
export const DEFAULT_SURFACE_NAME = "My performance";
export const SUB_LINE =
  "Compose your controls. Select an element to shape its behavior.";
export const ADD_AN_ELEMENT = "ADD AN ELEMENT";
export const ON_THIS_SURFACE = "ON THIS SURFACE";
export const NEW_SURFACE = "+ New surface";
export const UNDO = "Undo";
export const REDO = "Redo";
export const SAVE_COPY = "Save copy";
export const MODE_EDIT = "Edit";
export const MODE_PLAY = "Play";
/** The PDF's segment reads `▷ Play`; the glyph is decoration and the word is the label. */
export const MODE_PLAY_GLYPH = "▷";
export const MATRIX_LINE = "ZONA · CONTINUOUS TOUCH SURFACE";
export const SELECTED_ELEMENT = "SELECTED ELEMENT";
export const ELEMENT_NAME = "Element name";
export const POSITION_AND_SIZE = "Position & size";
export const COLUMN = "Column";
export const ROW = "Row";
export const WIDTH = "Width";
export const HEIGHT = "Height";
export const SNAP_HELPER = "Snap to light guides. Touch remains continuous.";
export const MIDI_OUTPUT = "MIDI output";
export const CC_NUMBER = "CC number";
export const CHANNEL = "Channel";
export const APPEARANCE = "Appearance";
export const DUPLICATE = "Duplicate";
export const DELETE_ELEMENT = "Delete element";
/** `2 × 6 units`, the raised chip beside the inspector's headline. */
export const unitsChip = (w: number, h: number): string => `${w} × ${h} units`;
/** `4 elements`, right of the plate. */
export const elementsLine = (n: number): string =>
  n === 1 ? "1 element" : `${n} elements`;

/** The four type names as the PDF's rail prints them, and as the type-right label. */
export const KIND_LABELS = {
  fader: "Fader",
  button: "Button",
  knob: "Knob",
  xy: "XY pad",
} as const;

// ---------------------------------------------------------------------------
// The Bible's section 8, verbatim.

/** The empty state's instruction - "Use direct instructions". */
export const EMPTY_INSTRUCTION =
  "Add an element, or select an area on the surface.";

// ---------------------------------------------------------------------------
// HANGAR's own, ledgered.

/** The document title. */
export const TITLE = "Sandbox — HANGAR";
/** /sandbox/ while it decides which surface to open. */
export const OPENING_LINE = "Opening your surface…";
/** The context bar's sentence on /sandbox/ and the editor (pages 2 and 4 carry one; page 3 carries the draft line once one exists). */
export const STATUS_LINE = "Build a surface. Every element is yours to shape.";
/** The empty state's second line: the starter action and the template, named. */
export const EMPTY_SECOND_LINE =
  "Start with a fader, or click any cell to begin an area.";
/** The one visible starter action on an empty surface. */
export const STARTER_ACTION = "Add a fader";
/** The template alternative, named as a template so an empty surface stays possible. */
export const TEMPLATE_ACTION = "Use the fader and button template";
/** The template's two elements, as placed. */
export const TEMPLATE_FADER_NAME = "Filter";
export const TEMPLATE_BUTTON_NAME = "Hold";

/** The palette's `+` at the cap: the reason beside the disabled control (geometry.ts carries the sentence). */
export const PALETTE_ADD = "+";
export const paletteAddName = (kind: string): string => `Add a ${kind}`;

/** Play locks structure: the reason beside the disabled palette and the read-only fields. */
export const PLAY_LOCKS_PALETTE =
  "In Play, touches go to the surface. Switch to Edit to add elements.";
export const PLAY_LOCKS_FIELDS =
  "In Play, touches go to the surface. Switch to Edit to change this element.";
/** The persistent mode label under the switch. */
export const MODE_LINE_EDIT =
  "Edit: select and arrange elements. Touch goes nowhere.";
export const MODE_LINE_PLAY = "Play: touch the surface as you would the pad.";

/** The draft's clause in the context bar (drafts.ts says the word is DRAFT). */
export const DRAFT_SAVED = "Draft saved locally";
export const DRAFT_UNSAVED =
  "Your browser refused to store this draft. It lives in this tab only.";

/** The headline field's accessible name: the surface's name, editable in place. */
export const SURFACE_NAME = "Surface name";
/** The quiet control beside the headline that opens the field. */
export const RENAME_SURFACE = "Rename";
export const renameSurfaceName = (name: string): string => `Rename ${name}`;

/** The plate's own status line (also the live region for a screen reader). */
export const PLATE_NAME = "Surface";
export const placeInstruction = (kind: string): string =>
  `Click a cell to place the ${kind}.`;
export const AREA_START = "Click the far corner of the area.";
export const selectedLine = (name: string, kind: string): string =>
  `${name}, ${kind}, selected.`;
export const NOTHING_SELECTED = "Nothing selected.";
export const cellLine = (col: number, row: number): string =>
  `Column ${col}, Row ${row}`;

/** The element list's row name, so a screen reader hears the type. */
export const listRowName = (name: string, kind: string): string =>
  `${name}, ${kind}`;
/** The element list with nothing on the surface (section 15's empty state). */
export const LIST_EMPTY = "Nothing on this surface yet.";

/** The inspector without a selection. */
export const NO_SELECTION_EYEBROW = "NO ELEMENT SELECTED";
export const NO_SELECTION_HEADLINE = "Pick an element";
export const NO_SELECTION_LEDE =
  "Select an element on the surface or in the list to shape it.";
/** The inspector's kind selector (section 8's Identity: name and type). */
export const TYPE = "Type";
export const ORIENTATION = "Orientation";
export const ORIENTATION_VERTICAL = "Vertical";
export const ORIENTATION_HORIZONTAL = "Horizontal";
export const BEHAVIOR = "Behavior";
export const LATCH = "Latch";
export const LATCH_HELPER =
  "Latched, a press toggles between on and off. Unlatched, it sends on while held.";
/** The XY pad's second controller. */
export const CC_NUMBER_Y = "CC number (Y)";
/** The swatch row's label: one colour per element, the region's own. */
export const COLOUR_LABEL = "Color";

/** Field messages that are not geometry's (geometry.ts carries those). */
export const WHOLE_NUMBER = "Type a whole number.";
export const CC_RANGE = "A controller number is 0 to 127.";
export const CHANNEL_RANGE = "A channel is 1 to 16.";

/** Duplicate with no free window (section 8: offer resize, never delete). */
export const DUPLICATE_NO_SPACE =
  "There’s no free area this size. Make it smaller, or clear some room, and duplicate again.";
export const DUPLICATE_AT_CAP =
  "This surface holds 16 elements, the most a page can carry. Remove one to duplicate another.";

/** The meter's sentence: "N of 908 · room for about M more". */
export const roomLine = (used: number, roomFor: number): string =>
  `${used} of 908 · room for about ${roomFor} more`;
export const ROOM_NONE = "of 908 · no room for another";
/** The meter when a string is over: which one, by how much, and why (13-15's two-slot ceiling). */
export const overLine = (
  word: "Setup" | "Timer",
  used: number,
  over: number,
): string =>
  `${word} is ${used} of 908, ${over} over. Two events can’t hold this mix of element kinds; remove one kind to fit.`;
export const MEASURING = "measuring…";

/** Default names, per kind and ordinal: Fader 1, Button 2. */
export const defaultName = (kind: string, n: number): string => `${kind} ${n}`;
export const copyName = (name: string): string => `${name} copy`;

/** Save copy's outcome. */
export const savedLine = (name: string): string =>
  `${name} saved to My configs.`;
export const SAVE_REFUSED = "Your browser refused to store the copy.";

// ---------------------------------------------------------------------------
// The install and the share (plan 13-17; Bible section 9 and section 11;
// 13-CONTEXT D-14 Q7, D-18, D-19). `Apply to ZONA` and `Store on ZONA` are
// section 9's and are VERBATIM (the first is page-target.ts's APPLY_LABEL);
// the rest are HANGAR's, in D-05's register, ledgered under "From 13-17".

/** Section 9's word for the store, verbatim: the same click as KEEP ON DEVICE, the same confirmation. */
export const STORE_LABEL = "Store on ZONA";
/**
 * The meter when a string is over 908 under three slots: which one, by how
 * much, and the way. What pushed a surface over is an ELEMENT - names are
 * never emitted and colours are measured at their dearest already (land.ts)
 * - so the way offered is the last element's removal.
 */
export const overElementLine = (
  word: "Setup" | "Timer" | "Utility",
  used: number,
  over: number,
): string =>
  `${word} is ${used} of 908, ${over} over. Remove the last element to fit.`;
/** The share control: a surface exports as a file (D-14 Q7), through the same door My configs opens. */
export const EXPORT_SURFACE = "Export as a file";
/** Why there is no link: one clause, the reason, the way. */
export const NO_LINK_EXPLANATION =
  "A surface isn’t a variation of a catalog entry, so there’s no link to share; export it as a file and import it on My configs.";
/** The export's success line, with the file name the browser was asked for. */
export const exportedLine = (fileName: string): string =>
  `Exported as ${fileName}.`;
