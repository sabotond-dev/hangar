// Every word the Sandbox's interface shows (13-16, 13-17), in one module that
// imports nothing - the shape inspector-copy.ts set, so a spec can hold a
// component to the sentence it renders. Two kinds of string, marked by section:
// the PDF's page 3 and the Bible's sections 8, 9, 11 and 16 give most of the
// words, VERBATIM; the rest are HANGAR's, in D-05's register (sentence case, the
// fact then the way, never "invalid", never coy), ledgered in
// .planning/phases/13-gui-overhaul/13-COPY-NEW.md under "From 13-16" and "From
// 13-17". The geometry refusals live in geometry.ts (GEOMETRY_COPY, overlapLine).
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

/** The type names as the PDF's rail prints them (Blank is HANGAR's, change 10A), and as the type-right label. */
export const KIND_LABELS = {
  fader: "Fader",
  button: "Button",
  knob: "Knob",
  xy: "XY pad",
  blank: "Blank",
} as const;

// ---------------------------------------------------------------------------
// The Bible's section 8, re-worded at change 10A (area placement went; answer 1a).

/** The empty state's instruction - "Use direct instructions". */
export const EMPTY_INSTRUCTION = "Add an element to the surface.";

// ---------------------------------------------------------------------------
// HANGAR's own, ledgered.

/** The document title. */
export const TITLE = "Sandbox — HANGAR";
/** /sandbox/ while it decides which surface to open. */
export const OPENING_LINE = "Opening your surface…";
/** The context bar's sentence on /sandbox/ and the editor (pages 2 and 4 carry one; page 3 carries the draft line once one exists). */
export const STATUS_LINE = "Build a surface. Every element is yours to shape.";
/** The empty state's second line: the starter action and the hotkey route, named. */
export const EMPTY_SECOND_LINE =
  "Start with a fader, or press F, B, X, K or L and click a cell.";
/** The one visible starter action on an empty surface. */
export const STARTER_ACTION = "Add a fader";
/** The template alternative, named as a template so an empty surface stays possible. */
export const TEMPLATE_ACTION = "Use the fader and button template";
/** The template's two elements, as placed. */
export const TEMPLATE_FADER_NAME = "Filter";
export const TEMPLATE_BUTTON_NAME = "Hold";

/** The palette's rows: the accessible name, and the key each row shows (editor.ts's HOTKEYS). */
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
/** The inspector's first section (section 8's Identity: name and type), titled since change 16c. */
export const IDENTITY = "Identity";
export const TYPE = "Type";
export const ORIENTATION = "Orientation";
export const ORIENTATION_VERTICAL = "Vertical";
export const ORIENTATION_HORIZONTAL = "Horizontal";
export const BEHAVIOR = "Behavior";
// LATCH (`Latch`) and LATCH_HELPER ARE RETIRED BY NAME, 2026-09-18 (change 10B, the user's
// "rename latch to toggle mode"): the field is TOGGLE below; the schema keeps `latch`.
/** The two words of a switch (change 16c): Spring and Toggle are segmented controls, never a checkbox. */
export const SWITCH_OFF = "Off";
export const SWITCH_ON = "On";
/** The button's toggle (change 10B; the schema's `latch`). */
export const TOGGLE = "Toggle";
export const TOGGLE_HELPER =
  "Toggled, a press turns it on and the next press turns it off. Otherwise it sends on while held.";
// CC_NUMBER_Y (`CC number (Y)`) and OUTPUT (`Output`) ARE RETIRED BY NAME, 2026-09-23 (change 17): an
// XY pad's Y axis is a block of its own (`Y_AXIS`) and every output's word is OUTPUT_TYPE below.

// ---------------------------------------------------------------------------
// The change 10B options (BENCH-2026-09-16.txt section 10, answers 6 to 11), D-05's register.

/** A fader's, an XY pad's or a knob's mode. */
export const MODE = "Mode";
export const MODE_ABSOLUTE = "Absolute";
export const MODE_RELATIVE = "Relative";
export const MODE_HELPER =
  "Relative: a touch changes nothing until the finger moves, then the value follows the movement.";
/** The knob's four modes, keyed by the schema's words (answer 11d). */
export const KNOB_MODE_WORDS = {
  absolute: "Absolute",
  "relative-twos": "Relative (2's comp.)",
  "relative-offset": "Relative (binary offset)",
  "relative-sign": "Relative (sign magnitude)",
} as const;
export const KNOB_RELATIVE_HELPER =
  "A relative mode sends one CC step per detent, so Type, Min and Max don’t apply and the knob doesn’t receive.";
/** A relative fader's or XY pad's speed (answer 7c). */
export const SPEED = "Speed";
export const SPEED_HALF = "Half";
export const SPEED_FULL = "Full";
export const SPEED_HELPER =
  "Half moves the value 64 steps over the element’s travel; Full moves it 127.";
/** A fader's spring (answer 8). */
export const SPRING = "Spring";
export const SPRING_HELPER =
  "On release the fader returns to the spring value and sends it.";
export const SPRING_VALUE = "Spring value";
/** A button's output and its note (answer 10); since change 17 every output's Type (the button's two words, a continuous kind's three). */
export const OUTPUT_TYPE = "Type";
export const OUTPUT_CC = "CC";
export const OUTPUT_NOTE = "Note";
export const TYPE_PITCH_BEND = "Pitch bend";
export const TYPE_PRESSURE = "Channel pressure";
export const TYPE_HELPER =
  "Pitch bend and channel pressure carry no number. A pitch bend sends the value as its high byte, so 64 is the center.";
/** The plate's word for an output with no number (change 17): a pitch bend, a channel pressure. */
export const TYPE_SHORT = { pitchbend: "PB", pressure: "CP" } as const;
/** An XY pad's two outputs (change 17), each with its own Type, number and channel. */
export const X_AXIS = "X axis";
export const Y_AXIS = "Y axis";
/** MIDI RX (change 17, answers 1i and 1ii). */
export const RECEIVE = "Receive";
export const RECEIVE_HELPER =
  "When your DAW sends this element’s message, the element takes the value and shows it. Nothing is sent back.";
/** The surface's Color input (change 17, answer 1iii). */
export const COLOR_INPUT = "Color input";
export const COLOR_INPUT_SWITCH = "Receive colors";
export const FIRST_CC = "First CC";
export const COLOR_INPUT_HELPER =
  "A CC on this channel sets an element’s color: the first CC is the first element in the list, the next CC the second. 0 restores its own color, 1 to 126 go round the hue wheel, 127 is white.";
export const NOTE_NUMBER = "Note";
export const NOTE_HELPER =
  "A name or a number: C#3 or 49. On sends the note at Max as its velocity; off sends note-off.";
/** A button's radio group (answer 9b). */
export const GROUP = "Group";
export const GROUP_NONE = "None";
export const groupWord = (n: number): string => `Group ${n}`;
export const GROUP_HELPER =
  "Buttons in the same group are exclusive: pressing one turns the others off.";
/** An XY pad's fingers (change 11, BENCH-2026-09-16.txt section 11, answers 1a and 2a). */
export const TOUCHES = "Touches";
export const TOUCHES_HELPER =
  "Every finger sends on its own pair: finger 2 on the CC numbers two up, finger 3 four up. Each finger has its own crosshair. A pad with more than one touch doesn’t receive.";
/** The refusal when the last finger's pair would pass 127 - on the count, or on a controller typed too high for it. */
export const touchesCcRange = (touches: number, ceiling: number): string =>
  `With ${touches} touches a CC number is 0 to ${ceiling}, so the last finger stays inside 127.`;
/** The sent value's span (answer 6a). */
export const MIN = "Min";
export const MAX = "Max";
export const MIN_MAX_HELPER =
  "The value runs from Min to Max. A Min above the Max inverts the direction.";
export const BUTTON_MIN_MAX_HELPER =
  "Max is sent when the button turns on, Min when it turns off.";
/** The swatch row's label: one colour per element, the region's own. */
export const COLOUR_LABEL = "Color";

/** Field messages that are not geometry's (geometry.ts carries those). */
export const WHOLE_NUMBER = "Type a whole number.";
export const CC_RANGE = "A controller number is 0 to 127.";
export const CHANNEL_RANGE = "A channel is 1 to 16.";
export const VALUE_RANGE = "A value is 0 to 127.";
export const NOTE_RANGE = "A note is C-1 to G9, or 0 to 127.";

/** Duplicate with no free window (section 8: offer resize, never delete). */
export const DUPLICATE_NO_SPACE =
  "There’s no free area this size. Make it smaller, or clear some room, and duplicate again.";
export const DUPLICATE_AT_CAP =
  "This surface is full. Remove an element to duplicate another.";

/** Default names, per kind and count: Fader 1, Button 2. */
export const defaultName = (kind: string, n: number): string => `${kind} ${n}`;
export const copyName = (name: string): string => `${name} copy`;

// ---------------------------------------------------------------------------
// Change 13A (BENCH-2026-09-16.txt section 13): the selection set, the clipboard, multi-edit,
// lock and Tab. D-05's register; every line here is HANGAR's.

/** The inspector over more than one element: the eyebrow, the lede, and a field whose values differ. */
export const SELECTED_ELEMENTS = "SELECTED ELEMENTS";
export const MULTI_LEDE = "A change here applies to every selected element.";
export const MIXED = "Mixed";
/** The pinned delete on a group: `Delete 3 elements`. */
export const deleteElements = (n: number): string =>
  `Delete ${elementsLine(n)}`;
/** The plate's status with more than one selected. */
export const selectedCountLine = (n: number): string =>
  `${elementsLine(n)} selected.`;

/** Lock (suggestion 6): the lock box (change 16c; a checkbox before), its helper, and the two refusals a locked element makes. */
export const LOCKED = "Locked";
export const LOCKED_HELPER =
  "A locked element stays where it is: it can’t be moved, resized or deleted. Its settings still change.";
export const lockedMoveLine = (name: string): string =>
  `${name} is locked. Unlock it to move or resize it.`;
export const lockedDeleteLine = (name: string): string =>
  `${name} is locked. Unlock it to delete it.`;
export const lockedLine = (n: number): string => `Locked ${elementsLine(n)}.`;
export const unlockedLine = (n: number): string =>
  `Unlocked ${elementsLine(n)}.`;

/** The clipboard's outcomes on the plate's status line, and its three refusals (no number about the cap). */
export const copiedLine = (n: number): string => `Copied ${elementsLine(n)}.`;
export const cutLine = (n: number): string => `Cut ${elementsLine(n)}.`;
export const pastedLine = (n: number): string => `Pasted ${elementsLine(n)}.`;
export const duplicatedLine = (n: number): string =>
  `Duplicated ${elementsLine(n)}.`;
export const NOTHING_TO_PASTE =
  "Nothing to paste yet. Copy or cut an element first.";
export const PASTE_NO_SPACE =
  "There’s no free area for what you copied. Clear some room and paste again.";
export const PASTE_AT_CAP =
  "This surface is full. Remove an element to paste another.";

// ---------------------------------------------------------------------------
// Change 13B (BENCH-2026-09-16.txt section 13): align and distribute, flip and rotate, the
// fill-to-fit placement, and the remembered defaults. D-05's register; every line here is HANGAR's.

/** The inspector's Arrange row over a set: its title, its helper, and the eight commands' accessible names. */
export const ARRANGE = "Arrange";
export const ARRANGE_HELPER =
  "Align the selected elements on an edge or a center line, or space them out with equal gaps. When spacing out, the outer two stay where they are.";
export const ALIGN_LEFT = "Align left edges";
export const ALIGN_RIGHT = "Align right edges";
export const ALIGN_TOP = "Align top edges";
export const ALIGN_BOTTOM = "Align bottom edges";
export const ALIGN_CENTRE_X = "Center horizontally";
export const ALIGN_CENTRE_Y = "Center vertically";
export const DISTRIBUTE_X = "Space out horizontally";
export const DISTRIBUTE_Y = "Space out vertically";
/** The outcomes on the plate's status line, and the one refusal spacing makes of its own. */
export const alignedLine = (n: number): string => `Aligned ${elementsLine(n)}.`;
export const spacedLine = (n: number): string =>
  `Spaced out ${elementsLine(n)}.`;
export const DISTRIBUTE_NO_ROOM =
  "There’s no room to space these out. Move the outer elements further apart first.";

// TRANSFORM_HELPER (`Flip or rotate the whole surface. Every element moves with it, locked ones
// too: a transform is not an element edit.`) IS RETIRED BY NAME, 2026-09-21 (change 15, BENCH
// section 15): the transforms row went into the tool rail, whose boxes carry their labels as
// titles and the cheat-sheet carries the words.
/** The surface's three transforms (suggestion 4): the three names, the three outcomes. */
export const FLIP_HORIZONTAL = "Flip left to right";
export const FLIP_VERTICAL = "Flip top to bottom";
export const ROTATE = "Rotate a quarter turn clockwise";
export const FLIPPED_HORIZONTAL = "Flipped the surface left to right.";
export const FLIPPED_VERTICAL = "Flipped the surface top to bottom.";
export const ROTATED = "Rotated the surface a quarter turn clockwise.";

/** The palette's helper while a kind is armed (suggestion 5): a plain click and the fill-to-fit click. */
export const PALETTE_FILL_HELPER =
  "A click places the element at its default size. Alt+click (Option+click on a Mac) fills the free area around the cell.";

/** The inspector's New elements section with nothing selected (suggestion 8): the remembered defaults and their reset. */
export const NEW_ELEMENTS = "New elements";
export const DEFAULTS_HELPER =
  "A new element takes the settings you last gave its kind: channel, range, mode and the rest. Its color still follows the palette.";
export const RESET_DEFAULTS = "Reset defaults";
export const RESET_DEFAULTS_HELPER =
  "Reset returns every kind to its built-in settings. It changes the stored defaults, not the surface, so Undo doesn’t take it back.";
export const DEFAULTS_RESET_LINE =
  "Defaults reset. The next new element starts from the built-in settings.";

/** Save copy's outcome. */
export const savedLine = (name: string): string =>
  `${name} saved to My configs.`;
export const SAVE_REFUSED = "Your browser refused to store the copy.";

// ---------------------------------------------------------------------------
// The install and the share (13-17; Bible sections 9 and 11; 13-CONTEXT D-14
// Q7, D-18, D-19). `Store on ZONA` is install-copy.ts's KEEP_LABEL; the rest are
// HANGAR's, ledgered under "From 13-17".

// STORE_LABEL (`Store on ZONA`, section 9's word, verbatim) IS RETIRED BY
// NAME, 2026-09-12 (13.1-06, 13.1-CONTEXT D-06, D-11 a): its one reader moved
// into DestinationZone.svelte, which reads install-copy.ts's KEEP_LABEL.
/**
 * Store's refusal when a string is over the budget (land.ts's refusal), worded without a number
 * since change 10A. What pushed a surface over is an ELEMENT - names are never emitted and colours
 * are measured at their dearest already - so the way offered is the last element's removal.
 */
export const TOO_FULL_TO_STORE =
  "This surface is too full for a ZONA page. Remove the last element to fit.";
/** The share control: a surface exports as a file (D-14 Q7), through the same door My configs opens. */
export const EXPORT_SURFACE = "Export as a file";
/** Why there is no link: one clause, the reason, the way. */
export const NO_LINK_EXPLANATION =
  "A surface isn’t a variation of a catalog entry, so there’s no link to share; export it as a file and import it on My configs.";
/** The export's success line, with the file name the browser was asked for. */
export const exportedLine = (fileName: string): string =>
  `Exported as ${fileName}.`;

// ---------------------------------------------------------------------------
// Change 13C (BENCH-2026-09-16.txt section 13): the right-click menu, the shortcut sheet, the
// MIDI monitor in Play, the plate's view toggles, the shared-controller pass and the recent
// colours. D-05's register; every line here is HANGAR's. The profile file's strings are
// share/profile-copy.ts's (the workspace reads them too).

/** The plate's menu (suggestion 1): its name, its items, and the reason each disabled item gives as its title. */
export const MENU_NAME = "Surface menu";
export const MENU_CUT = "Cut";
export const MENU_COPY = "Copy";
export const MENU_PASTE = "Paste";
export const MENU_DELETE = "Delete";
export const MENU_LOCK = "Lock";
export const MENU_UNLOCK = "Unlock";
export const MENU_RENAME = "Rename";
export const MENU_ALIGN = "Align";
export const MENU_DISTRIBUTE = "Space out";
export const MENU_SELECT_ALL = "Select all";
export const MENU_NEEDS_SELECTION = "Select an element first.";
export const MENU_RENAME_ONE = "Select one element to rename it.";
export const MENU_ALIGN_TWO = "Select two or more elements to align them.";
export const MENU_SPACE_THREE =
  "Select three or more elements to space them out.";
export const MENU_NOTHING_TO_SELECT = "There’s nothing to select.";

/** The shortcut sheet (suggestion 2): the dialog's title, its two columns, the close control, and the toolbar's way in. */
export const SHORTCUTS_TITLE = "Keyboard shortcuts";
export const SHORTCUTS_KEYS_COLUMN = "Keys";
export const SHORTCUTS_DOES_COLUMN = "Does";
export const SHORTCUTS_CLOSE = "Close";
export const SHORTCUTS_OPEN_GLYPH = "?";
export const SHORTCUTS_LEDE =
  "Every shortcut the Sandbox answers. None of them works while you are typing in a field.";
/** A control's title with its keys: `Undo (Ctrl+Z)`. */
export const titledWithKeys = (label: string, keys: string): string =>
  `${label} (${keys})`;

/** The MIDI monitor in Play (suggestion 11): the list's name, its helper, its empty line and its one control. */
export const PLAY_MONITOR = "MIDI monitor";
export const PLAY_MONITOR_HELPER =
  "The last twelve messages the surface sent, newest first. Nothing here reaches a MIDI port.";
export const PLAY_MONITOR_EMPTY =
  "Nothing sent yet. Touch the surface and what it sends shows here.";
export const PLAY_MONITOR_CLEAR = "Clear";

// VIEW_GROUP (`View`) IS RETIRED BY NAME, 2026-09-21 (change 15): the View row went into the
// tool rail, whose group is named TOOLS below.
/** The plate's view toggles (suggestion 12): the two switches and their helpers. */
export const VIEW_NUMBERS = "CC numbers";
export const VIEW_NAMES = "Names";
export const VIEW_NUMBERS_HELPER =
  "Show each element’s controller number on the surface.";
export const VIEW_NAMES_HELPER = "Show each element’s name on the surface.";

/** The shared-controller pass (suggestion 12): the section, its helper, and one line per pair. */
export const CONFLICTS = "Shared controllers";
export const CONFLICTS_HELPER =
  "Two elements on one controller number and channel send over each other. That may be what you want; if not, change one of them.";
export const conflictLine = (
  a: string,
  b: string,
  cc: number,
  channel: number,
): string => `${a} and ${b} both send CC ${cc} on channel ${channel}.`;

/** The recent colours (suggestion 13): the strip's name, its helper, and each chip's name. */
export const RECENT_COLOURS = "Recent colors";
export const RECENT_COLOURS_HELPER =
  "The last eight colors you applied. Click one to apply it to every selected element.";
export const recentColourName = (r: number, g: number, b: number): string =>
  `Apply color ${r}, ${g}, ${b}`;

// ---------------------------------------------------------------------------
// Change 15 (BENCH-2026-09-16.txt section 15): the tool rail beside the inspector.

/** The rail's accessible name: the group of twelve icon-only boxes (tool-rail.ts). */
export const TOOLS = "Tools";
