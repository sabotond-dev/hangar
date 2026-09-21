// The Sandbox's tool rail (change 15, BENCH-2026-09-16.txt section 15): the twelve icon-only boxes
// the three toolbar rows used to hold, in five groups - History (Undo, Redo), Files (Save copy,
// Export as a file, Export for Grid Editor, Import a profile), Transform (the three of 13B), View
// (CC numbers, Names - toggles) and Help (the shortcut sheet) - each with its label, its keys
// where it has them, and a glyph of straight lines on a 20 x 20 box. railBoxes() resolves the
// disabled and pressed state of every box from the route's flags, so the rules are the same as
// the rows' were and sandbox-ui.spec.ts holds them in node. Pure: ToolRail.svelte renders it.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { EXPORT_PROFILE, IMPORT_PROFILE } from "$lib/share/profile-copy";
import {
  EXPORT_SURFACE,
  FLIP_HORIZONTAL,
  FLIP_VERTICAL,
  REDO,
  ROTATE,
  SAVE_COPY,
  SHORTCUTS_OPEN_GLYPH,
  SHORTCUTS_TITLE,
  UNDO,
  VIEW_NAMES,
  VIEW_NUMBERS,
} from "./copy";
import type { SurfaceTransform } from "./geometry";
import { MOD } from "./shortcuts";

/** A glyph is straight lines on a 20 x 20 box: [x1, y1, x2, y2] each (no curve, no radius). */
export type Glyph = readonly (readonly [number, number, number, number])[];

/** The box the glyphs are drawn in. */
export const GLYPH_BOX = 20;

/** Mirror a glyph left to right. */
const flipX = (g: Glyph): Glyph =>
  g.map(([x1, y1, x2, y2]) => [GLYPH_BOX - x1, y1, GLYPH_BOX - x2, y2]);
/** Swap a glyph's axes. */
const swap = (g: Glyph): Glyph => g.map(([x1, y1, x2, y2]) => [y1, x1, y2, x2]);

/** An arrow pointing left whose shaft turns down and comes back: a step taken back. */
const UNDO_GLYPH: Glyph = [
  [16, 7, 5, 7],
  [5, 7, 9, 3],
  [5, 7, 9, 11],
  [16, 7, 16, 13],
  [16, 13, 8, 13],
];
/** Two squares, the second offset over the first: a copy. */
const COPY_GLYPH: Glyph = [
  [3, 3, 13, 3],
  [13, 3, 13, 13],
  [13, 13, 3, 13],
  [3, 13, 3, 3],
  [7, 7, 17, 7],
  [17, 7, 17, 17],
  [17, 17, 7, 17],
  [7, 17, 7, 7],
];
/** An open tray under an arrow: out to a file. */
const TRAY: Glyph = [
  [3, 12, 3, 18],
  [3, 18, 17, 18],
  [17, 18, 17, 12],
];
const EXPORT_GLYPH: Glyph = [
  [10, 2, 10, 12],
  [6, 8, 10, 12],
  [14, 8, 10, 12],
  ...TRAY,
];
const IMPORT_GLYPH: Glyph = [
  [10, 12, 10, 2],
  [6, 6, 10, 2],
  [14, 6, 10, 2],
  ...TRAY,
];
/** An arrow down into a square of four cells: out to the Grid Editor. */
const EDITOR_GLYPH: Glyph = [
  [10, 1, 10, 9],
  [6, 5, 10, 9],
  [14, 5, 10, 9],
  [3, 11, 17, 11],
  [17, 11, 17, 19],
  [17, 19, 3, 19],
  [3, 19, 3, 11],
  [10, 11, 10, 19],
  [3, 15, 17, 15],
];
/** Two arrowheads either side of a centre line: the mirror (13B's). */
const MIRROR_X: Glyph = [
  [10, 2, 10, 18],
  [2, 6, 7, 10],
  [7, 10, 2, 14],
  [18, 6, 13, 10],
  [13, 10, 18, 14],
];
/** Three sides of a square and an arrowhead at the open corner: a quarter turn clockwise (13B's). */
const TURN: Glyph = [
  [4, 16, 4, 4],
  [4, 4, 16, 4],
  [16, 4, 16, 12],
  [12, 9, 16, 13],
  [16, 13, 20, 9],
];
/** A number sign: the controller numbers. */
const HASH_GLYPH: Glyph = [
  [7, 3, 7, 17],
  [13, 3, 13, 17],
  [3, 7, 17, 7],
  [3, 13, 17, 13],
];
/** A label tag: the names. */
const TAG_GLYPH: Glyph = [
  [3, 5, 12, 5],
  [12, 5, 17, 10],
  [17, 10, 12, 15],
  [12, 15, 3, 15],
  [3, 15, 3, 5],
];

export type RailBoxId =
  | "undo"
  | "redo"
  | "save-copy"
  | "export-surface"
  | "export-profile"
  | "import-profile"
  | "flip-horizontal"
  | "flip-vertical"
  | "turn-surface"
  | "view-numbers"
  | "view-names"
  | "shortcuts-open";

export interface RailBox {
  /** The test id, and the id the route's dispatch reads. */
  id: RailBoxId;
  /** The accessible name and the title's first part. */
  label: string;
  /** The keys, with Mod for the platform's modifier; in the title through keysWord. */
  keys?: string;
  /** The glyph's lines, or the text the box shows (the ? box). */
  glyph?: Glyph;
  text?: string;
  /** An action runs once; a toggle is pressed or not; a file box opens the browser's chooser. */
  kind: "action" | "toggle" | "file";
  /** A transform box: the transform it runs. */
  transform?: SurfaceTransform;
}

/** The five groups, top to bottom, a hairline between each. */
export const RAIL_GROUPS: readonly (readonly RailBox[])[] = [
  [
    {
      id: "undo",
      label: UNDO,
      keys: `${MOD}+Z`,
      glyph: UNDO_GLYPH,
      kind: "action",
    },
    {
      id: "redo",
      label: REDO,
      keys: `${MOD}+Y`,
      glyph: flipX(UNDO_GLYPH),
      kind: "action",
    },
  ],
  [
    { id: "save-copy", label: SAVE_COPY, glyph: COPY_GLYPH, kind: "action" },
    {
      id: "export-surface",
      label: EXPORT_SURFACE,
      glyph: EXPORT_GLYPH,
      kind: "action",
    },
    {
      id: "export-profile",
      label: EXPORT_PROFILE,
      glyph: EDITOR_GLYPH,
      kind: "action",
    },
    {
      id: "import-profile",
      label: IMPORT_PROFILE,
      glyph: IMPORT_GLYPH,
      kind: "file",
    },
  ],
  [
    {
      id: "flip-horizontal",
      label: FLIP_HORIZONTAL,
      glyph: MIRROR_X,
      kind: "action",
      transform: "flip-horizontal",
    },
    {
      id: "flip-vertical",
      label: FLIP_VERTICAL,
      glyph: swap(MIRROR_X),
      kind: "action",
      transform: "flip-vertical",
    },
    {
      id: "turn-surface",
      label: ROTATE,
      glyph: TURN,
      kind: "action",
      transform: "rotate",
    },
  ],
  [
    {
      id: "view-numbers",
      label: VIEW_NUMBERS,
      glyph: HASH_GLYPH,
      kind: "toggle",
    },
    { id: "view-names", label: VIEW_NAMES, glyph: TAG_GLYPH, kind: "toggle" },
  ],
  [
    {
      id: "shortcuts-open",
      label: SHORTCUTS_TITLE,
      keys: SHORTCUTS_OPEN_GLYPH,
      text: SHORTCUTS_OPEN_GLYPH,
      kind: "action",
    },
  ],
];

/** Every box in rail order. */
export const RAIL_BOXES: readonly RailBox[] = RAIL_GROUPS.flat();

/** What the route knows that decides a box's state. */
export interface RailFlags {
  play: boolean;
  /** Nothing on the surface: the transforms have nothing to move. */
  empty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  /** Why Export for Grid Editor cannot run now; undefined when it can. */
  exportReason?: string | undefined;
  numbers: boolean;
  names: boolean;
}

export interface RailBoxState extends RailBox {
  disabled: boolean;
  /** The reason a disabled box gives as its title (the export's); undefined when the state alone says it. */
  reason?: string | undefined;
  /** Disabled by Play: the box is described by the mode line, as the rows' were. */
  byMode: boolean;
  /** A toggle's state. */
  pressed?: boolean | undefined;
}

/**
 * The rows' rules, kept: Undo and Redo are off in Play and with nothing to take back or redo;
 * the transforms are off in Play and on an empty surface; Export for Grid Editor is off with
 * its reason while the landing measures or is over the budget; Save copy, Export as a file,
 * Import a profile, the two toggles and the sheet's box are always live.
 */
export function railBoxes(
  flags: RailFlags,
): readonly (readonly RailBoxState[])[] {
  return RAIL_GROUPS.map((group) =>
    group.map((box) => {
      switch (box.id) {
        case "undo":
          return {
            ...box,
            disabled: flags.play || !flags.canUndo,
            byMode: flags.play,
          };
        case "redo":
          return {
            ...box,
            disabled: flags.play || !flags.canRedo,
            byMode: flags.play,
          };
        case "flip-horizontal":
        case "flip-vertical":
        case "turn-surface":
          return {
            ...box,
            disabled: flags.play || flags.empty,
            byMode: flags.play,
          };
        case "export-profile":
          return {
            ...box,
            disabled: flags.exportReason !== undefined,
            reason: flags.exportReason,
            byMode: false,
          };
        case "view-numbers":
          return {
            ...box,
            disabled: false,
            byMode: false,
            pressed: flags.numbers,
          };
        case "view-names":
          return {
            ...box,
            disabled: false,
            byMode: false,
            pressed: flags.names,
          };
        default:
          return { ...box, disabled: false, byMode: false };
      }
    }),
  );
}
