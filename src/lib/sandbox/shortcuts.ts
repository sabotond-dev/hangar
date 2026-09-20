// The Sandbox's shortcut sheet (change 13C, BENCH-2026-09-16.txt section 13, suggestion 2): one
// table of every key the route's window listener and the plate's own handler read - 10A's
// hotkeys, 13A's Ctrl combos, Tab, the arrows, Alt+click, Delete, Escape / V, Undo / Redo, the
// menu keys - and the words a control's title shows. Each row carries the keys as shown and the
// `event.key` values it stands for, so sandbox-ui.spec.ts can hold the sheet complete against the
// handlers' source. THE ONE PLACE A PLATFORM IS READ: `platformOf` takes the navigator and
// `isMacPlatform` reads its platform word, so Cmd and Option are shown on a Mac.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { KIND_LABELS } from "./copy";
import { HOTKEYS, SELECTOR_KEY } from "./editor";
import type { ElementKind } from "./model";

/** The modifier's placeholder in a key string: `Mod+C` reads Ctrl+C or Cmd+C. */
export const MOD = "Mod";

export type Shortcut = {
  /** The keys as shown, `MOD` for the platform's modifier: `Mod+Shift+Z`. */
  readonly keys: readonly string[];
  /** What it does. */
  readonly what: string;
  /** The lower-cased `event.key` values the handlers read for this row; a pointer row reads none. */
  readonly reads: readonly string[];
};

export type ShortcutGroup = {
  readonly title: string;
  readonly rows: readonly Shortcut[];
};

/** The navigator's platform word, from User-Agent Client Hints first, else the legacy field. */
export function platformOf(
  nav:
    | {
        readonly platform?: string;
        readonly userAgentData?: { readonly platform?: string };
      }
    | undefined,
): string {
  if (nav === undefined) return "";
  return nav.userAgentData?.platform ?? nav.platform ?? "";
}

/** True for macOS and iOS, where the modifier is Cmd and Alt is Option. */
export const isMacPlatform = (platform: string): boolean =>
  /^mac|^ip(hone|ad|od)/i.test(platform.trim());

/** The modifier's word: Cmd on a Mac, Ctrl elsewhere. */
export const modWord = (mac: boolean): string => (mac ? "Cmd" : "Ctrl");

/** A key string with the platform's words in: `Mod+C` -> `Ctrl+C`, `Alt+click` -> `Option+click` on a Mac. */
export function keysWord(keys: string, mac: boolean): string {
  return keys
    .split("+")
    .map((part) =>
      part === MOD ? modWord(mac) : part === "Alt" && mac ? "Option" : part,
    )
    .join("+");
}

/** A row's keys as one string: alternatives joined by ` / `. */
export const keysLine = (keys: readonly string[], mac: boolean): string =>
  keys.map((k) => keysWord(k, mac)).join(" / ");

const hotkeyRows: readonly Shortcut[] = (
  Object.keys(HOTKEYS) as ElementKind[]
).map((kind) => ({
  keys: [HOTKEYS[kind].toUpperCase()],
  what: `Arm a ${KIND_LABELS[kind].toLowerCase()} to place`,
  reads: [HOTKEYS[kind]],
}));

/** The whole sheet, in the order it reads. */
export const SHORTCUT_GROUPS: readonly ShortcutGroup[] = [
  {
    title: "Add elements",
    rows: [
      ...hotkeyRows,
      {
        keys: [SELECTOR_KEY.toUpperCase()],
        what: "Back to the selector",
        reads: [SELECTOR_KEY],
      },
      {
        keys: ["Click"],
        what: "Place the armed element at its default size",
        reads: [],
      },
      {
        keys: ["Alt+click"],
        what: "Place the armed element filling the free area around the cell",
        reads: [],
      },
      {
        keys: ["Enter", "Space"],
        what: "Place at the focus cell, or select what is there",
        reads: ["enter", " "],
      },
      {
        keys: ["Alt+Enter"],
        what: "Place at the focus cell filling the free area",
        reads: ["alt"],
      },
    ],
  },
  {
    title: "Select",
    rows: [
      { keys: ["Click"], what: "Select an element alone", reads: [] },
      {
        keys: ["Shift+click"],
        what: "Add an element to the selection or remove it",
        reads: [],
      },
      {
        keys: ["Drag on empty"],
        what: "Select every element the box touches",
        reads: [],
      },
      { keys: ["Mod+A"], what: "Select every unlocked element", reads: ["a"] },
      {
        keys: ["Tab", "Shift+Tab"],
        what: "Select the next or the previous element",
        reads: ["tab"],
      },
      {
        keys: ["Escape"],
        what: "Back to the selector, or clear the selection",
        reads: ["escape"],
      },
      {
        keys: ["Arrows"],
        what: "Move the focus cell when nothing is selected",
        reads: ["arrowleft", "arrowright", "arrowup", "arrowdown"],
      },
    ],
  },
  {
    title: "Edit",
    rows: [
      { keys: ["Mod+X"], what: "Cut the selection", reads: ["x"] },
      { keys: ["Mod+C"], what: "Copy the selection", reads: ["c"] },
      {
        keys: ["Mod+V"],
        what: "Paste at the focus cell, or the nearest free area",
        reads: ["v"],
      },
      { keys: ["Mod+D"], what: "Duplicate the selection", reads: ["d"] },
      {
        keys: ["Delete", "Backspace"],
        what: "Delete the selection",
        reads: ["delete", "backspace"],
      },
      { keys: ["Mod+L"], what: "Lock or unlock the selection", reads: ["l"] },
      {
        keys: ["Double-click"],
        what: "Rename the element in place",
        reads: [],
      },
      { keys: ["Arrows"], what: "Move the selection one cell", reads: [] },
      {
        keys: ["Shift+Arrows"],
        what: "Resize the selected element one cell",
        reads: [],
      },
    ],
  },
  {
    title: "History",
    rows: [
      { keys: ["Mod+Z"], what: "Undo", reads: ["z"] },
      { keys: ["Mod+Shift+Z", "Mod+Y"], what: "Redo", reads: ["y"] },
    ],
  },
  {
    title: "Menus and help",
    rows: [
      { keys: ["Right-click"], what: "Open the surface menu", reads: [] },
      {
        keys: ["Shift+F10", "Menu"],
        what: "Open the surface menu on the selection",
        reads: ["f10", "contextmenu"],
      },
      { keys: ["?"], what: "Open this sheet", reads: ["?"] },
      { keys: ["Escape"], what: "Close the sheet or the menu", reads: [] },
    ],
  },
];

/** Every `event.key` value the sheet stands for, lower-cased - what the spec holds the handlers to. */
export function keysRead(): ReadonlySet<string> {
  const out = new Set<string>();
  for (const group of SHORTCUT_GROUPS) {
    for (const row of group.rows) for (const key of row.reads) out.add(key);
  }
  return out;
}
