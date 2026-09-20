// The plate's menu (change 13C, BENCH-2026-09-16.txt section 13, suggestion 1): the items a
// right-click, Shift+F10 or the Menu key offers, built from the editor's state - Cut, Copy, Paste,
// Duplicate, Delete, Lock / Unlock, Rename, Align and Space out as submenus, Select all. Every
// item names an editor command the route already wires (13A / 13B); nothing here is a second
// implementation. An item that cannot run is disabled WITH ITS REASON, never hidden, so the menu
// reads the same on an element, a set and the empty plate. Pure: sandbox-ui.spec.ts holds the
// item set per selection state; ContextMenu.svelte renders it.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  ALIGN_BOTTOM,
  ALIGN_CENTRE_X,
  ALIGN_CENTRE_Y,
  ALIGN_LEFT,
  ALIGN_RIGHT,
  ALIGN_TOP,
  DISTRIBUTE_X,
  DISTRIBUTE_Y,
  DUPLICATE,
  DUPLICATE_AT_CAP,
  MENU_ALIGN,
  MENU_ALIGN_TWO,
  MENU_COPY,
  MENU_CUT,
  MENU_DELETE,
  MENU_DISTRIBUTE,
  MENU_LOCK,
  MENU_NEEDS_SELECTION,
  MENU_NOTHING_TO_SELECT,
  MENU_PASTE,
  MENU_RENAME,
  MENU_RENAME_ONE,
  MENU_SELECT_ALL,
  MENU_SPACE_THREE,
  MENU_UNLOCK,
  NOTHING_TO_PASTE,
  PASTE_AT_CAP,
  lockedDeleteLine,
  lockedMoveLine,
} from "./copy";
import type { EditorState } from "./editor";
import { lockedOf } from "./model";

/** What an item does, in the route's words: each is one editor command. */
export type MenuAction =
  | "cut"
  | "copy"
  | "paste"
  | "duplicate"
  | "delete"
  | "lock"
  | "rename"
  | "select-all"
  | "align-left"
  | "align-right"
  | "align-top"
  | "align-bottom"
  | "align-centre-x"
  | "align-centre-y"
  | "distribute-horizontal"
  | "distribute-vertical";

export type MenuItem = {
  /** The item's id: its test id's tail and, for a leaf, its action. */
  readonly id: string;
  readonly label: string;
  /** The keys shown beside the label, `Mod` for the platform's modifier; none on a submenu or a pointer-only item. */
  readonly keys?: string;
  /** The reason it cannot run now, shown as the title; absent when it can. */
  readonly disabled?: string;
  /** A leaf's command. */
  readonly action?: MenuAction;
  /** A submenu's items. */
  readonly submenu?: readonly MenuItem[];
};

/** The alignments and the spacings as they read in the submenus (13B's names, the commands' own). */
const ALIGNMENTS: readonly { id: MenuAction; label: string }[] = [
  { id: "align-left", label: ALIGN_LEFT },
  { id: "align-right", label: ALIGN_RIGHT },
  { id: "align-top", label: ALIGN_TOP },
  { id: "align-bottom", label: ALIGN_BOTTOM },
  { id: "align-centre-x", label: ALIGN_CENTRE_X },
  { id: "align-centre-y", label: ALIGN_CENTRE_Y },
];

const SPACINGS: readonly { id: MenuAction; label: string }[] = [
  { id: "distribute-horizontal", label: DISTRIBUTE_X },
  { id: "distribute-vertical", label: DISTRIBUTE_Y },
];

/**
 * The menu for a state. Empty in Play (the plate opens none). `clipboardHeld` is whether the
 * clipboard holds anything - the route reads it, the model does not know.
 */
export function menuItems(
  state: EditorState,
  clipboardHeld: boolean,
): readonly MenuItem[] {
  if (state.mode === "play") return [];
  const members = state.selectedRegions;
  const n = members.length;
  const locked = members.find(lockedOf);
  const allLocked = n > 0 && members.every(lockedOf);
  const none = n === 0 ? MENU_NEEDS_SELECTION : undefined;
  const cannotDelete =
    none ?? (locked === undefined ? undefined : lockedDeleteLine(locked.name));
  const cannotMove =
    locked === undefined ? undefined : lockedMoveLine(locked.name);
  const alignReason = n < 2 ? MENU_ALIGN_TWO : cannotMove;
  const spaceReason = n < 3 ? MENU_SPACE_THREE : cannotMove;
  const anyUnlocked = state.surface.regions.some((r) => !lockedOf(r));
  const item = (
    id: MenuAction,
    label: string,
    keys: string | undefined,
    disabled: string | undefined,
  ): MenuItem => ({
    id,
    label,
    ...(keys === undefined ? {} : { keys }),
    ...(disabled === undefined ? {} : { disabled }),
    action: id,
  });
  return [
    item("cut", MENU_CUT, "Mod+X", cannotDelete),
    item("copy", MENU_COPY, "Mod+C", none),
    item(
      "paste",
      MENU_PASTE,
      "Mod+V",
      !clipboardHeld
        ? NOTHING_TO_PASTE
        : state.atCap
          ? PASTE_AT_CAP
          : undefined,
    ),
    item(
      "duplicate",
      DUPLICATE,
      "Mod+D",
      none ?? (state.atCap ? DUPLICATE_AT_CAP : undefined),
    ),
    item("delete", MENU_DELETE, "Delete", cannotDelete),
    item("lock", allLocked ? MENU_UNLOCK : MENU_LOCK, "Mod+L", none),
    item(
      "rename",
      MENU_RENAME,
      undefined,
      n === 1 ? undefined : MENU_RENAME_ONE,
    ),
    {
      id: "align",
      label: MENU_ALIGN,
      submenu: ALIGNMENTS.map((a) =>
        item(a.id, a.label, undefined, alignReason),
      ),
    },
    {
      id: "distribute",
      label: MENU_DISTRIBUTE,
      submenu: SPACINGS.map((s) => item(s.id, s.label, undefined, spaceReason)),
    },
    item(
      "select-all",
      MENU_SELECT_ALL,
      "Mod+A",
      anyUnlocked ? undefined : MENU_NOTHING_TO_SELECT,
    ),
  ];
}
