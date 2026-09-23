<!--
  The plate: PDF page 3's 571px square, the 9 x 9 lattice (a static SVG overlay,
  drawn once), the regions with their kind's marks (a lock glyph on a locked one),
  the selection - each member's outline, the set's one outline round its bounding
  box, the eight drag handles on an unlocked single, the delete icon (on a set it
  deletes the set) - the marquee, the proposed bounds, the focus cell and the
  status line, the inline rename (13B: a double-click opens a field over the
  element), the menu (13C: a right-click, Shift+F10 or the Menu key opens ContextMenu over
  the cell), the view toggles' effect and the shared-controller marks. Props: view, onclick
  (the ONE placement and selection call, fired from pointerdown with Shift and Alt - Alt
  fills; no drag is ever required), onmarquee, onmove, onmark (Enter; Alt+Enter fills), oncancel,
  ondelete, onselectnext, onrename, onfocuscell, menuItems / onmenu / mac, show, conflicts,
  onresize / onmoveto / onnudge / onresizeby / oncommit, notice, onfinger and preview (Play). Every number is layout.ts's.
  Decided at 13-16 / 13.1-03 (13.1-CONTEXT D-03); see .planning/phases/13.1-bench-corrections-four/13.1-03-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import {
    ELEMENT_NAME,
    KIND_LABELS,
    MATRIX_LINE,
    NOTHING_SELECTED,
    PLATE_NAME,
    TYPE_SHORT,
    cellLine,
    elementsLine,
    placeInstruction,
    selectedCountLine,
    selectedLine,
  } from "$lib/sandbox/copy";
  import {
    DEFAULT_SIZES,
    type Box,
    type Cell,
    type EditorState,
  } from "$lib/sandbox/editor";
  import { largestFreeBox, type Problem } from "$lib/sandbox/geometry";
  import type { MenuAction, MenuItem } from "$lib/sandbox/menu";
  import {
    SURFACE_SIZE,
    boundingBox,
    cellIndex,
    colourByte,
    hasNumber,
    lockedOf,
    outputOf,
    springOf,
    springPosition,
    toDisplay,
    typeOf,
    typeYOf,
    type MidiType,
    type Region,
  } from "$lib/sandbox/model";
  import { noteName } from "$lib/tune/view";
  import ContextMenu from "./ContextMenu.svelte";
  import {
    SANDBOX_DELETE_HIT,
    SANDBOX_DELETE_ICON,
    SANDBOX_HANDLE,
    SANDBOX_HANDLE_HIT,
    SANDBOX_LABEL_SIZE,
    SANDBOX_LOCK_ICON,
    SANDBOX_PITCH,
    SANDBOX_PLATE,
  } from "$lib/ui/shell/layout";

  type HandleName = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";
  /**
   * A body drag in progress (change 10A): the set's box, where inside it the pointer went down,
   * the cell pressed, and whether the press was on a member of a set whose plain click is
   * DEFERRED to the release (change 13A: a press keeps the set so the drag moves it; a release
   * with no motion selects the pressed one alone).
   */
  type MoveDrag = { from: Box; grab: Cell; at: Cell; deferred: boolean };
  /** A marquee in progress (change 13A): the cell pressed on, and whether Shift adds to the set. */
  type Marquee = { from: Cell; add: boolean };
  /** The inline rename (change 13B): the element under the double-click, its name as it was, and its box for the field. */
  type Renaming = { id: string; name: string; box: Box };

  let {
    view,
    onclick,
    onmarquee,
    onmove,
    onmark,
    oncancel,
    ondelete,
    onselectnext,
    onrename,
    onfocuscell,
    menuItems,
    onmenu,
    mac = false,
    show = { numbers: true, names: true },
    conflicts,
    onresize,
    onmoveto,
    onnudge,
    onresizeby,
    oncommit,
    notice,
    onfinger,
    preview,
  }: {
    view: EditorState;
    /** The one placement and selection call (editor.ts); Shift toggles the held element in the set; Alt fills the free area (13B). */
    onclick: (col: number, row: number, shift: boolean, alt: boolean) => void;
    /** A marquee's release (change 13A): the box dragged from an empty cell; `add` with Shift held. */
    onmarquee?: (box: Box, add: boolean) => void;
    /** Arrows: the focus cell moves by a delta. */
    onmove: (dcol: number, drow: number) => void;
    /** Enter on the plate: the same click, at the focus cell; with Alt the fill-to-fit click (13B). */
    onmark: (fill: boolean) => void;
    /** Escape: nothing pending - the selector, or the selection cleared. */
    oncancel: () => void;
    /** Delete: the selection. */
    ondelete: () => void;
    /** Tab / Shift+Tab with a selection (change 13A): the next / previous element in the surface's order. */
    onselectnext?: (step: 1 | -1) => void;
    /** The inline rename's commit (change 13B): editor.renameElement; the inspector's name field is the keyboard route. */
    onrename?: (id: string, name: string) => void;
    /** A right-click on an empty cell (change 13C): the focus cell moves there, so a paste from the menu lands on it. */
    onfocuscell?: (cell: Cell) => void;
    /** The menu's items for the state (menu.ts), and the route's dispatch of a chosen action; rename is the plate's own. */
    menuItems?: readonly MenuItem[];
    onmenu?: (action: MenuAction) => void;
    /** Cmd and Option in the menu's key hints. */
    mac?: boolean;
    /** The view toggles (change 13C): whether the controller numbers and the names are drawn. */
    show?: { readonly numbers: boolean; readonly names: boolean };
    /** The ids of every element on a shared controller (conflicts.ts): each gets a mark. */
    conflicts?: ReadonlySet<string>;
    /** A command's outcome for the status line (the clipboard's, the lock's; change 13A), shown until the next change. */
    notice?: string;
    /** A handle drag's box on release; the route wires editor.resizeSelectedTo and the problem shows in the status line. Optional so the spec's render needs no drag. */
    onresize?: (box: Box) => Problem | undefined;
    /** A body drag's origin on release (change 10A); the route wires editor.moveSelectedTo. */
    onmoveto?: (cell: Cell) => Problem | undefined;
    /** An arrow with a selection and the selector: the element one cell over (editor.nudgeSelected). */
    onnudge?: (dcol: number, drow: number) => Problem | undefined;
    /** Shift and an arrow with a selection: one cell wider or taller (editor.resizeSelectedBy). */
    onresizeby?: (dw: number, dh: number) => Problem | undefined;
    /** An arrow released: the coalescing boundary, so a held key is one Undo. */
    oncommit?: () => void;
    /** Play: a finger on the plate, as an offset inside the plate's box and its extent; the route maps it with touch.ts's mapAxis (PREV-04). */
    onfinger?: (
      phase: "down" | "move" | "up",
      pointerId: number,
      x: number,
      y: number,
      extent: number,
    ) => void;
    /** The live picture in Play, rendered under the SVG. */
    preview?: Snippet;
  } = $props();

  const uid = $props.id();
  const statusId = `${uid}-status`;
  const PLATE = SANDBOX_PLATE;
  const PITCH = SANDBOX_PITCH;
  const HANDLE = SANDBOX_HANDLE;
  const HIT = SANDBOX_HANDLE_HIT;
  const LABEL = SANDBOX_LABEL_SIZE;
  const ICON = SANDBOX_DELETE_ICON;
  const ICON_HIT = SANDBOX_DELETE_HIT;
  const LOCK = SANDBOX_LOCK_ICON;
  /** The gap between the selection's corner and its delete icon. */
  const ICON_GAP = 4;

  /** The arrows, as deltas. */
  const ARROWS: Readonly<Record<string, Cell>> = {
    ArrowLeft: { col: -1, row: 0 },
    ArrowRight: { col: 1, row: 0 },
    ArrowUp: { col: 0, row: -1 },
    ArrowDown: { col: 0, row: 1 },
  };

  /** The page's fader at rest: the thumb at 0.62 of the travel (Filter, `74`). */
  const REST_VALUE = 0.62;

  /** Where a fader's thumb rests: at its spring value when it has one (change 10B), else the page's 0.62. */
  const restOf = (r: Region): number =>
    springOf(r) ? springPosition(r) / 127 : REST_VALUE;

  /** An output's number as the plate draws it (change 17): the controller, or the type's short word where it has none (a pitch bend, a channel pressure). */
  const numberOf = (type: MidiType, cc: number): string =>
    hasNumber(type) ? String(cc) : TYPE_SHORT[type as keyof typeof TYPE_SHORT];

  /** The controller numeral a kind shows (change 13C's toggle): a button's note by name, an XY pad's pair, a blank none. */
  function numeralOf(r: Region): string | undefined {
    switch (r.kind) {
      case "blank":
        return undefined;
      case "button":
        return outputOf(r) === "note" ? noteName(r.cc) : String(r.cc);
      case "xy":
        return `${numberOf(typeOf(r), r.cc)} ${numberOf(typeYOf(r), r.cc2 ?? 0)}`;
      default:
        return numberOf(typeOf(r), r.cc);
    }
  }

  let plate = $state<HTMLDivElement | null>(null);
  /** The cell under the pointer, for the proposed bounds only. */
  let hover = $state<Cell | undefined>(undefined);
  let focused = $state(false);
  /** A handle drag in progress: which handle, and the box it started from. */
  let drag = $state<{ handle: HandleName; from: Box } | undefined>(undefined);
  /** A body drag in progress: the selected set, pressed with the selector. */
  let moveDrag = $state<MoveDrag | undefined>(undefined);
  /** The box either drag would commit, drawn as the proposed bounds. */
  let dragBox = $state<Box | undefined>(undefined);
  /** A marquee in progress, and the box it has drawn so far (undefined until the pointer leaves the first cell). */
  let marquee = $state<Marquee | undefined>(undefined);
  let marqueeBox = $state<Box | undefined>(undefined);
  /** Alt held over the plate (change 13B): the proposed bounds show the fill instead of the default size. */
  let altHeld = $state(false);
  /** The inline rename in progress (change 13B), or undefined. */
  let renaming = $state<Renaming | undefined>(undefined);
  /** The menu (change 13C): where it is open, as fractions of the plate, or undefined. */
  let menuAt = $state<{ x: number; y: number } | undefined>(undefined);
  /** The last drag's refusal, shown until the next pointer or key or until the surface moves under it. Raw, so the identity check in `status` is against the editor's own reference. */
  let refused = $state.raw<
    { message: string; surface: EditorState["surface"] } | undefined
  >(undefined);

  const play = $derived(view.mode === "play");
  const regions = $derived(view.surface.regions);
  /** The set (change 13A), its one outline's box, and the unlocked single that takes handles. */
  const members = $derived(view.selectedRegions);
  const group = $derived(
    boundingBox(
      members.map((r) => ({ col: r.col, row: r.row, w: r.w, h: r.h })),
    ),
  );
  const resizable = $derived(
    view.selected !== undefined && !lockedOf(view.selected)
      ? view.selected
      : undefined,
  );

  /** "rgb(221 255 119)" from RGB444 levels. */
  const fillOf = (r: Region): string =>
    `rgb(${colourByte(r.colour[0])} ${colourByte(r.colour[1])} ${colourByte(r.colour[2])})`;

  const x = (col: number) => col * PITCH;
  const y = (row: number) => row * PITCH;

  /** A region's box in plate units: edges, size and centre. */
  const frame = (r: Box) => {
    const left = x(r.col);
    const top = y(r.row);
    const w = r.w * PITCH;
    const h = r.h * PITCH;
    return {
      left,
      top,
      w,
      h,
      right: left + w,
      bottom: top + h,
      cx: left + w / 2,
      cy: top + h / 2,
    };
  };

  /** The box the next Enter or click would commit, from the hover cell or the focus cell - or a drag's. */
  const proposed = $derived.by(() => {
    if (play) return undefined;
    if (dragBox !== undefined) return dragBox;
    const at = hover ?? view.focus;
    const pending = view.placement;
    if (pending.kind === "element") {
      const size = DEFAULT_SIZES[pending.type];
      const fallback = {
        col: Math.min(at.col, SURFACE_SIZE - size.w),
        row: Math.min(at.row, SURFACE_SIZE - size.h),
        w: size.w,
        h: size.h,
      };
      // With Alt held the bounds show the fill (change 13B), the same box the click would place.
      if (!altHeld) return fallback;
      return (
        largestFreeBox(at, view.cellMap, pending.type === "knob") ?? fallback
      );
    }
    return undefined;
  });

  /** The delete icon's box: off the selection's top-right corner, inside the plate - right of and above the corner where there is room, else inside it. */
  function deleteIconAt(f: { right: number; top: number }): {
    x: number;
    y: number;
  } {
    const x =
      f.right + ICON_GAP + ICON <= PLATE
        ? f.right + ICON_GAP
        : f.right - ICON_GAP - ICON;
    const y =
      f.top - ICON_GAP - ICON >= 0 ? f.top - ICON_GAP - ICON : f.top + ICON_GAP;
    return { x, y };
  }

  /** The eight handles of an unlocked single selection: corners and edge midpoints, named. */
  const handles = $derived.by(() => {
    const r = resizable;
    if (r === undefined || play) return [];
    const f = frame(r);
    const midX = (f.left + f.right) / 2;
    const midY = (f.top + f.bottom) / 2;
    return [
      { name: "nw", x: f.left, y: f.top },
      { name: "n", x: midX, y: f.top },
      { name: "ne", x: f.right, y: f.top },
      { name: "w", x: f.left, y: midY },
      { name: "e", x: f.right, y: midY },
      { name: "sw", x: f.left, y: f.bottom },
      { name: "s", x: midX, y: f.bottom },
      { name: "se", x: f.right, y: f.bottom },
    ] as const;
  });

  /** The status line: a command's outcome, a refusal, what the next click or Enter does, and what is selected. */
  const status = $derived.by(() => {
    if (notice !== undefined) return notice;
    if (refused !== undefined && refused.surface === view.surface) {
      return refused.message;
    }
    const pending = view.placement;
    if (pending.kind === "element") {
      return placeInstruction(KIND_LABELS[pending.type]);
    }
    const r = view.selected;
    const where = cellLine(
      toDisplay(view.focus.col),
      toDisplay(view.focus.row),
    );
    if (members.length > 1)
      return `${selectedCountLine(members.length)} ${where}.`;
    return r === undefined
      ? `${NOTHING_SELECTED} ${where}.`
      : `${selectedLine(r.name, KIND_LABELS[r.kind])} ${where}.`;
  });

  function cellOf(event: MouseEvent): Cell | undefined {
    if (plate === null) return undefined;
    const rect = plate.getBoundingClientRect();
    if (rect.width <= 0) return undefined;
    const col = Math.floor(((event.clientX - rect.left) / rect.width) * 9);
    const row = Math.floor(((event.clientY - rect.top) / rect.height) * 9);
    return {
      col: Math.min(8, Math.max(0, col)),
      row: Math.min(8, Math.max(0, row)),
    };
  }

  /** The box a handle makes from the cell under the pointer: the unheld edges are the anchor, the held edge never crosses it, so the box is at least 1 x 1. */
  function boxFor(handle: HandleName, from: Box, at: Cell): Box {
    let left = from.col;
    let top = from.row;
    let right = from.col + from.w - 1;
    let bottom = from.row + from.h - 1;
    if (handle.includes("w")) left = Math.min(at.col, right);
    if (handle.includes("e")) right = Math.max(at.col, left);
    if (handle.includes("n")) top = Math.min(at.row, bottom);
    if (handle.includes("s")) bottom = Math.max(at.row, top);
    return { col: left, row: top, w: right - left + 1, h: bottom - top + 1 };
  }

  const sameBox = (a: Box, b: Box): boolean =>
    a.col === b.col && a.row === b.row && a.w === b.w && a.h === b.h;

  /** The box between two cells, both inside it (the marquee). */
  const boxBetween = (a: Cell, b: Cell): Box => ({
    col: Math.min(a.col, b.col),
    row: Math.min(a.row, b.row),
    w: Math.abs(a.col - b.col) + 1,
    h: Math.abs(a.row - b.row) + 1,
  });

  /** The region holding a cell, from the state's own map. */
  function holderAt(at: Cell): Region | undefined {
    const index = view.cellMap[cellIndex(at.col, at.row)];
    return index === undefined || index === 0 ? undefined : regions[index - 1];
  }

  /** The box a body drag makes: the origin follows the cell under the pointer less the grab offset, kept on the plate. */
  function movedBox(m: MoveDrag, at: Cell): Box {
    return {
      col: Math.min(SURFACE_SIZE - m.from.w, Math.max(0, at.col - m.grab.col)),
      row: Math.min(SURFACE_SIZE - m.from.h, Math.max(0, at.row - m.grab.row)),
      w: m.from.w,
      h: m.from.h,
    };
  }

  function capture(event: PointerEvent): void {
    try {
      plate?.setPointerCapture(event.pointerId);
    } catch {
      // The element can detach between the event and the capture.
    }
  }

  function startDrag(event: PointerEvent, handle: HandleName): void {
    const r = resizable;
    if (play || r === undefined || event.button !== 0) return;
    // The plate's own pointerdown must not run: a press on a handle is not a click on the cell.
    event.stopPropagation();
    refused = undefined;
    plate?.focus({ preventScroll: true });
    capture(event);
    drag = { handle, from: { col: r.col, row: r.row, w: r.w, h: r.h } };
    dragBox = drag.from;
  }

  /** The delete icon's press: the plate's own pointerdown must not run (it would read the cell under the icon). */
  function holdForDelete(event: PointerEvent): void {
    event.stopPropagation();
    refused = undefined;
    plate?.focus({ preventScroll: true });
  }

  /**
   * Either drag's release: a handle's box to onresize, a body's origin to onmoveto; the same
   * box commits nothing - and a deferred press released with no motion is the plain click on
   * the pressed member (it selects alone).
   */
  function endDrag(): void {
    const d = drag;
    const m = moveDrag;
    const box = dragBox;
    drag = undefined;
    moveDrag = undefined;
    dragBox = undefined;
    if (box === undefined) {
      if (m?.deferred) onclick(m.at.col, m.at.row, false, false);
      return;
    }
    let problem: Problem | undefined;
    if (d !== undefined) {
      if (sameBox(box, d.from)) return;
      problem = onresize?.(box);
    } else if (m !== undefined) {
      if (sameBox(box, m.from)) return;
      problem = onmoveto?.({ col: box.col, row: box.row });
    } else return;
    refused =
      problem === undefined
        ? undefined
        : { message: problem.message, surface: view.surface };
  }

  /** The marquee's release: the box it drew, if the pointer ever left the first cell, to onmarquee. */
  function endMarquee(): void {
    const m = marquee;
    const box = marqueeBox;
    marquee = undefined;
    marqueeBox = undefined;
    if (m === undefined || box === undefined) return;
    onmarquee?.(box, m.add);
  }

  function fingerAt(phase: "down" | "move" | "up", event: PointerEvent): void {
    if (plate === null || onfinger === undefined) return;
    const rect = plate.getBoundingClientRect();
    onfinger(
      phase,
      event.pointerId,
      event.clientX - rect.left,
      event.clientY - rect.top,
      rect.width,
    );
  }

  function onpointerdown(event: PointerEvent): void {
    if (play) {
      try {
        (event.currentTarget as Element).setPointerCapture(event.pointerId);
      } catch {
        // The element can detach between the event and the capture.
      }
      fingerAt("down", event);
      return;
    }
    if (event.button !== 0) return;
    refused = undefined;
    const at = cellOf(event);
    if (at === undefined) return;
    // WITHOUT SCROLLING (13-17): a programmatic focus that scrolled the plate would move the
    // page under a pressed pointer, and the release would land on another cell.
    plate?.focus({ preventScroll: true });
    const idle = view.placement.kind === "idle";
    const shift = event.shiftKey;
    // With a kind armed, the click places. The selector on an EMPTY cell: the click clears (or,
    // with Shift, keeps the set) and a drag from here is a marquee. On a held cell (change 10A):
    // Shift toggles it and starts no drag; a plain press on a member of a set keeps the set and
    // moves it whole, the click deferred to a release with no motion; otherwise the click
    // selects it and a drag from here moves it - the box follows the pointer and commits on release.
    const holder = idle ? holderAt(at) : undefined;
    const alt = event.altKey;
    if (holder === undefined) {
      onclick(at.col, at.row, shift, alt);
      if (!idle) return;
      capture(event);
      marquee = { from: at, add: shift };
      return;
    }
    if (shift) {
      onclick(at.col, at.row, true, false);
      return;
    }
    const deferred =
      view.selection.length > 1 && view.selection.includes(holder.id);
    if (!deferred) onclick(at.col, at.row, false, false);
    const from = deferred
      ? (group as Box)
      : { col: holder.col, row: holder.row, w: holder.w, h: holder.h };
    capture(event);
    moveDrag = {
      from,
      grab: { col: at.col - from.col, row: at.row - from.row },
      at,
      deferred,
    };
  }

  function onpointermove(event: PointerEvent): void {
    if (play) {
      fingerAt("move", event);
      return;
    }
    hover = cellOf(event);
    altHeld = event.altKey;
    if (hover === undefined) return;
    // A drag in progress: the proposed bounds follow the cell, nothing commits; a marquee draws
    // its box once the pointer has left the cell it started on.
    if (drag !== undefined) {
      dragBox = boxFor(drag.handle, drag.from, hover);
    } else if (moveDrag !== undefined) {
      const box = movedBox(moveDrag, hover);
      dragBox = sameBox(box, moveDrag.from) ? undefined : box;
    } else if (marquee !== undefined) {
      const box = boxBetween(marquee.from, hover);
      if (marqueeBox !== undefined || box.w > 1 || box.h > 1) marqueeBox = box;
    }
  }

  function onpointerup(event: PointerEvent): void {
    if (play) {
      fingerAt("up", event);
      return;
    }
    if (drag === undefined && moveDrag === undefined && marquee === undefined)
      return;
    try {
      plate?.releasePointerCapture(event.pointerId);
    } catch {
      // Already released.
    }
    if (marquee !== undefined) endMarquee();
    else endDrag();
  }

  function onpointerleave(): void {
    hover = undefined;
    altHeld = false;
  }

  /** The inline rename opened over a region (the double-click's and the menu's Rename). */
  function openRename(holder: Region): void {
    renaming = {
      id: holder.id,
      name: holder.name,
      box: { col: holder.col, row: holder.row, w: holder.w, h: holder.h },
    };
  }

  /**
   * The inline rename (change 13B): a double-click on an element with the selector opens a field
   * over it; Enter commits, Escape cancels, blur commits; never in Play. A double-click inside the
   * field is the field's own. The inspector's name field stays the keyboard route.
   */
  function ondblclick(event: MouseEvent): void {
    if (play || view.placement.kind !== "idle" || onrename === undefined)
      return;
    if (event.target instanceof HTMLInputElement) return;
    const at = cellOf(event);
    const holder = at === undefined ? undefined : holderAt(at);
    if (holder === undefined) return;
    event.preventDefault();
    openRename(holder);
  }

  /**
   * The menu (change 13C): a right-click opens it at the pointer - on an element outside the
   * set the element is selected alone first (the click's own rule), on an empty cell the
   * selection stays and the focus cell moves there; never in Play, where the browser's own
   * menu is left alone. Shift+F10 and the Menu key open it over the selection's corner, or the
   * focus cell.
   */
  function oncontextmenu(event: MouseEvent): void {
    if (play || menuItems === undefined) return;
    event.preventDefault();
    if (plate === null) return;
    const at = cellOf(event);
    if (at === undefined) return;
    refused = undefined;
    plate.focus({ preventScroll: true });
    const holder = view.placement.kind === "idle" ? holderAt(at) : undefined;
    if (holder !== undefined && !view.selection.includes(holder.id)) {
      onclick(at.col, at.row, false, false);
    } else if (holder === undefined) {
      onfocuscell?.(at);
    }
    const rect = plate.getBoundingClientRect();
    menuAt = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  }

  function openMenuByKey(): void {
    if (play || menuItems === undefined) return;
    const origin = group ?? {
      col: view.focus.col,
      row: view.focus.row,
      w: 1,
      h: 1,
    };
    menuAt = {
      x: (origin.col + 0.5) / SURFACE_SIZE,
      y: (origin.row + 0.5) / SURFACE_SIZE,
    };
  }

  /** The menu closes and the plate takes focus back. */
  function closeMenu(): void {
    menuAt = undefined;
    plate?.focus({ preventScroll: true });
  }

  /** A menu item chosen: Rename is the plate's own inline field; everything else is the route's. */
  function onMenuAction(action: MenuAction): void {
    closeMenu();
    if (action === "rename") {
      const r = view.selected;
      if (r !== undefined && onrename !== undefined) openRename(r);
      return;
    }
    onmenu?.(action);
  }

  /** The field's keys stay its own: Enter commits, Escape cancels, nothing reaches the plate's handler. */
  function onrenamekey(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === "Enter") {
      event.preventDefault();
      commitRename(event.currentTarget as HTMLInputElement);
    } else if (event.key === "Escape") {
      event.preventDefault();
      renaming = undefined;
      plate?.focus({ preventScroll: true });
    }
  }

  /** The commit: the typed name to onrename (the editor trims and refuses an empty or unchanged one), the field closed. */
  function commitRename(field: HTMLInputElement): void {
    const r = renaming;
    if (r === undefined) return;
    renaming = undefined;
    onrename?.(r.id, field.value);
  }

  /** The field takes focus with its text selected the moment it mounts. */
  function focusSelect(node: HTMLInputElement): void {
    node.focus();
    node.select();
  }

  function onkeydown(event: KeyboardEvent): void {
    if (play) return;
    if (event.key === "Alt") {
      altHeld = true;
      return;
    }
    refused = undefined;
    if (
      event.key === "ContextMenu" ||
      (event.key === "F10" && event.shiftKey)
    ) {
      event.preventDefault();
      openMenuByKey();
      return;
    }
    const arrow = ARROWS[event.key];
    if (arrow !== undefined) {
      // With the selector and a selection the arrows move the set, and with Shift resize a single
      // (change 10A, answer 4); with a kind armed or nothing selected they move the focus cell.
      if (view.selection.length > 0 && view.placement.kind === "idle") {
        const problem = event.shiftKey
          ? onresizeby?.(arrow.col, arrow.row)
          : onnudge?.(arrow.col, arrow.row);
        if (problem !== undefined)
          refused = { message: problem.message, surface: view.surface };
      } else {
        onmove(arrow.col, arrow.row);
      }
      event.preventDefault();
      return;
    }
    // Tab cycles a SELECTION through the elements (change 13A) and wraps; with nothing selected it
    // leaves the plate as it always did - Escape clears the selection, so the way off by keyboard
    // is Escape, then Tab.
    if (event.key === "Tab") {
      if (view.selection.length === 0 || view.placement.kind !== "idle") return;
      onselectnext?.(event.shiftKey ? -1 : 1);
      event.preventDefault();
      return;
    }
    switch (event.key) {
      case "Enter":
      case " ":
        onmark(event.altKey);
        break;
      case "Escape":
        oncancel();
        break;
      case "Delete":
      case "Backspace":
        ondelete();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  /** An arrow released: the boundary, so a held arrow is one Undo. Alt released: the default bounds again. */
  function onkeyup(event: KeyboardEvent): void {
    if (play) return;
    if (event.key === "Alt") {
      altHeld = false;
      return;
    }
    if (ARROWS[event.key] === undefined) return;
    oncommit?.();
  }
</script>

<div class="editor" data-testid="surface-editor" data-mode={view.mode}>
  <!--
    One tab stop with its own spatial keyboard model, which is what role="application"
    tells an assistive technology; a grid of gridcells would promise 81 focusable cells
    the plate does not have. The two a11y rules are suppressed for that reason.
  -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    bind:this={plate}
    class="plate"
    class:play
    class:focused
    class:armed={view.placement.kind === "element"}
    class:dragging={drag !== undefined || moveDrag !== undefined}
    class:marquee={marquee !== undefined}
    role="application"
    tabindex="0"
    aria-label={PLATE_NAME}
    aria-describedby={statusId}
    data-testid="surface-plate"
    style:--plate="{PLATE}px"
    {onpointerdown}
    {onpointermove}
    {onpointerup}
    onpointercancel={onpointerup}
    {onpointerleave}
    {ondblclick}
    {oncontextmenu}
    {onkeydown}
    {onkeyup}
    onfocus={() => (focused = true)}
    onblur={() => (focused = false)}
  >
    {#if preview}
      <div class="preview" data-testid="surface-preview">
        {@render preview()}
      </div>
    {/if}
    {#if menuAt !== undefined && menuItems !== undefined}
      <!-- The menu (change 13C): over the plate where the pointer was, or over the selection. -->
      <ContextMenu
        items={menuItems}
        x={menuAt.x}
        y={menuAt.y}
        {mac}
        onaction={onMenuAction}
        onclose={closeMenu}
      />
    {/if}
    {#if renaming !== undefined}
      <!-- The inline rename (change 13B): a field over the element, sized by its box in the plate's own percentages; its pointer and keys stay its own. -->
      <input
        class="rename"
        type="text"
        autocomplete="off"
        aria-label={ELEMENT_NAME}
        data-testid="surface-rename"
        value={renaming.name}
        style:left="{(renaming.box.col / SURFACE_SIZE) * 100}%"
        style:top="{(renaming.box.row / SURFACE_SIZE) * 100}%"
        style:width="{(renaming.box.w / SURFACE_SIZE) * 100}%"
        style:height="{(renaming.box.h / SURFACE_SIZE) * 100}%"
        use:focusSelect
        onpointerdown={(event) => event.stopPropagation()}
        onkeydown={onrenamekey}
        onblur={(event) => commitRename(event.currentTarget)}
      />
    {/if}
    <svg
      class="overlay"
      viewBox="0 0 {PLATE} {PLATE}"
      aria-hidden="true"
      data-testid="surface-svg"
    >
      <!-- The static lattice: sixteen lines, drawn once. -->
      <g class="guides" data-testid="surface-guides">
        {#each { length: SURFACE_SIZE - 1 }, i (i)}
          <line x1={x(i + 1)} y1="0" x2={x(i + 1)} y2={PLATE} />
          <line x1="0" y1={y(i + 1)} x2={PLATE} y2={y(i + 1)} />
        {/each}
      </g>

      <!-- The regions: the ground that hides the lattice, the tinted fill, the 1px boundary, the kind's mark, the name (header: THE MARKS). -->
      {#each regions as r (r.id)}
        {@const fill = fillOf(r)}
        {@const selected = view.selection.includes(r.id)}
        {@const locked = lockedOf(r)}
        {@const f = frame(r)}
        {@const conflicted = conflicts?.has(r.id) === true}
        {@const numeral = show.numbers ? numeralOf(r) : undefined}
        <g
          class="region"
          class:selected
          class:locked
          class:no-numbers={!show.numbers}
          class:no-names={!show.names}
          data-region={r.id}
          data-kind={r.kind}
          data-testid="surface-region"
        >
          <rect class="ground" x={f.left} y={f.top} width={f.w} height={f.h} />
          <rect
            class="body"
            x={f.left}
            y={f.top}
            width={f.w}
            height={f.h}
            style:fill
            style:stroke={fill}
          />
          {#if r.kind === "knob"}
            {@const radius = Math.min(f.w, f.h) * 0.16}
            {@const kcy = f.top + f.h * 0.34}
            <!-- A true circle: an SVG circle, not a radius (D-15). -->
            <circle
              class="mark ring"
              cx={f.cx}
              cy={kcy}
              r={radius}
              style:stroke={fill}
            />
            <line
              class="mark pointer"
              x1={f.cx}
              y1={kcy - radius + 2.5}
              x2={f.cx}
              y2={kcy - radius * 0.3}
              style:stroke={fill}
            />
            <text
              class="name"
              class:action={selected && !play}
              text-anchor="middle"
              x={f.cx}
              y={f.top + f.h * 0.72}
              font-size={LABEL}>{r.name}</text
            >
          {:else if r.kind === "xy"}
            <line
              class="mark hair"
              x1={f.left + 6}
              y1={f.cy}
              x2={f.right - 6}
              y2={f.cy}
              style:stroke={fill}
            />
            <line
              class="mark hair"
              x1={f.cx}
              y1={f.top + PITCH * 0.75}
              x2={f.cx}
              y2={f.bottom - PITCH * 0.75}
              style:stroke={fill}
            />
            <circle class="dot" cx={f.cx} cy={f.cy} r={7} style:fill />
            <text
              class="numeral"
              x={f.left + 20}
              y={f.bottom - 24}
              font-size={LABEL}
              style:fill>X 0.50 Y 0.50</text
            >
            <text
              class="name"
              class:action={selected && !play}
              x={f.left + 20}
              y={f.top + 26}
              font-size={LABEL}>{r.name}</text
            >
          {:else if r.kind === "fader"}
            {@const grooveW = PITCH * 0.19}
            {@const thumbL = PITCH * 0.61}
            {@const thumbT = PITCH * 0.2}
            {#if (r.orientation ?? "vertical") === "vertical"}
              {@const gTop = f.top + PITCH * 0.8}
              {@const gBottom = Math.max(gTop + 10, f.bottom - PITCH * 0.85)}
              {@const ty = gBottom - restOf(r) * (gBottom - gTop)}
              <rect
                class="groove"
                x={f.cx - grooveW / 2}
                y={gTop}
                width={grooveW}
                height={gBottom - gTop}
              />
              <rect
                class="value"
                x={f.cx - grooveW / 2}
                y={ty}
                width={grooveW}
                height={gBottom - ty}
                style:fill
              />
              <rect
                class="thumb"
                x={f.cx - thumbL / 2}
                y={ty - thumbT / 2}
                width={thumbL}
                height={thumbT}
                style:fill
              />
              <text
                class="numeral"
                text-anchor="middle"
                x={f.cx}
                y={f.bottom - PITCH * 0.45}
                font-size={LABEL}
                style:fill>{numberOf(typeOf(r), r.cc)}</text
              >
            {:else}
              {@const gLeft = f.left + PITCH * 0.3}
              {@const gRight = Math.max(gLeft + 10, f.right - PITCH * 0.3)}
              {@const tx = gLeft + restOf(r) * (gRight - gLeft)}
              <rect
                class="groove"
                x={gLeft}
                y={f.cy - grooveW / 2}
                width={gRight - gLeft}
                height={grooveW}
              />
              <rect
                class="value"
                x={gLeft}
                y={f.cy - grooveW / 2}
                width={tx - gLeft}
                height={grooveW}
                style:fill
              />
              <rect
                class="thumb"
                x={tx - thumbT / 2}
                y={f.cy - thumbL / 2}
                width={thumbT}
                height={thumbL}
                style:fill
              />
              <text
                class="numeral"
                text-anchor="middle"
                x={f.cx}
                y={f.cy + PITCH * 0.42}
                font-size={LABEL}
                style:fill>{numberOf(typeOf(r), r.cc)}</text
              >
            {/if}
            <text
              class="name"
              class:action={selected && !play}
              text-anchor="middle"
              x={f.cx}
              y={f.top + 23}
              font-size={LABEL}>{r.name}</text
            >
          {:else if r.kind === "blank"}
            <!-- A blank (change 10A): colour and its name, no control drawn. -->
            <text
              class="name"
              class:action={selected && !play}
              text-anchor="middle"
              x={f.cx}
              y={f.cy + 4}
              font-size={LABEL}>{r.name}</text
            >
          {:else}
            {@const chipW = PITCH * 0.93}
            {@const chipH = PITCH * 0.41}
            {@const chipCy =
              f.cy + Math.min(PITCH * 0.42, f.h / 2 - chipH / 2 - 2)}
            <text
              class="name"
              class:action={selected && !play}
              text-anchor="middle"
              x={f.cx}
              y={f.cy - PITCH * 0.4 + 4}
              font-size={LABEL}>{r.name}</text
            >
            <!-- At rest a button is off, whether it latches or not. -->
            <rect
              class="chip"
              x={f.cx - chipW / 2}
              y={chipCy - chipH / 2}
              width={chipW}
              height={chipH}
            />
            <text
              class="chip-word"
              text-anchor="middle"
              x={f.cx}
              y={chipCy + 4}
              font-size={LABEL}>OFF</text
            >
          {/if}
          {#if numeral !== undefined && r.kind !== "fader"}
            <!-- The controller numeral (change 13C's toggle) on the kinds that had none: bottom-left, inside the region. -->
            <text
              class="numeral cc"
              data-testid="surface-cc"
              x={f.left + 6}
              y={f.bottom - 6}
              font-size={LABEL}
              style:fill>{numeral}</text
            >
          {/if}
          {#if conflicted}
            <!-- The shared-controller mark (change 13C): a triangle of straight lines and its bar, top-left inside the region. -->
            <g
              class="conflict"
              data-testid="surface-conflict"
              aria-hidden="true"
            >
              <polygon
                class="conflict-shape"
                points="{f.left + 4 + LOCK / 2},{f.top + 4} {f.left +
                  4 +
                  LOCK},{f.top + 4 + LOCK} {f.left + 4},{f.top + 4 + LOCK}"
              />
              <line
                class="conflict-bar"
                x1={f.left + 4 + LOCK / 2}
                y1={f.top + 4 + LOCK * 0.35}
                x2={f.left + 4 + LOCK / 2}
                y2={f.top + 4 + LOCK * 0.7}
              />
              <line
                class="conflict-bar"
                x1={f.left + 4 + LOCK / 2}
                y1={f.top + 4 + LOCK * 0.8}
                x2={f.left + 4 + LOCK / 2}
                y2={f.top + 4 + LOCK * 0.92}
              />
            </g>
          {/if}
          {#if locked}
            <!-- The lock glyph (change 13A): a padlock of straight lines inside the top-right corner - the body a square, the shackle a square arch. -->
            <g class="lock" data-testid="surface-lock" aria-hidden="true">
              <rect
                class="lock-body"
                x={f.right - LOCK - 4}
                y={f.top + 4 + LOCK * 0.45}
                width={LOCK}
                height={LOCK * 0.55}
              />
              <polyline
                class="lock-shackle"
                points="{f.right - LOCK - 4 + LOCK * 0.25},{f.top +
                  4 +
                  LOCK * 0.45} {f.right - LOCK - 4 + LOCK * 0.25},{f.top +
                  4} {f.right - 4 - LOCK * 0.25},{f.top + 4} {f.right -
                  4 -
                  LOCK * 0.25},{f.top + 4 + LOCK * 0.45}"
              />
            </g>
          {/if}
        </g>
      {/each}

      <!-- The selection (Edit only): each member's action-colour 1px outline, the set's one outline round its bounding box, eight square handles with their hit squares beneath on an unlocked single, and the delete icon at the set's corner. -->
      {#if group !== undefined && !play}
        {@const f = frame(group)}
        {@const icon = deleteIconAt(f)}
        <g class="selection" data-testid="surface-selection">
          {#each members as m (m.id)}
            {@const mf = frame(m)}
            <rect
              class="outline member"
              data-testid="surface-member"
              x={mf.left}
              y={mf.top}
              width={mf.w}
              height={mf.h}
            />
          {/each}
          {#if members.length > 1}
            <rect
              class="outline group"
              data-testid="surface-group"
              x={f.left}
              y={f.top}
              width={f.w}
              height={f.h}
            />
          {/if}
          <!-- The handles and their hit squares take a pointerdown and have no role: a pointer accelerator inside the aria-hidden SVG; the arrows are the keyboard route. -->
          {#each handles as h (h.name)}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <rect
              class="handle-hit"
              data-testid="surface-handle-hit"
              data-handle={h.name}
              x={h.x - HIT / 2}
              y={h.y - HIT / 2}
              width={HIT}
              height={HIT}
              onpointerdown={(event) => startDrag(event, h.name)}
            />
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <rect
              class="handle"
              data-testid="surface-handle"
              data-handle={h.name}
              x={h.x - HANDLE / 2}
              y={h.y - HANDLE / 2}
              width={HANDLE}
              height={HANDLE}
              onpointerdown={(event) => startDrag(event, h.name)}
            />
          {/each}
          <!-- The delete icon (change 10A): a square off the top-right corner, its 44px hit beneath; the click is the panel's Delete element, one Undo - on a set the set's; not on a locked single (the model would refuse). -->
          {#if members.length > 1 || resizable !== undefined}
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
            <g
              class="delete"
              data-testid="surface-delete"
              onpointerdown={holdForDelete}
              onclick={() => ondelete()}
            >
              <rect
                class="delete-hit"
                x={icon.x + ICON / 2 - ICON_HIT / 2}
                y={icon.y + ICON / 2 - ICON_HIT / 2}
                width={ICON_HIT}
                height={ICON_HIT}
              />
              <rect
                class="delete-box"
                x={icon.x}
                y={icon.y}
                width={ICON}
                height={ICON}
              />
              <line
                class="delete-glyph"
                x1={icon.x + 6}
                y1={icon.y + 6}
                x2={icon.x + ICON - 6}
                y2={icon.y + ICON - 6}
              />
              <line
                class="delete-glyph"
                x1={icon.x + ICON - 6}
                y1={icon.y + 6}
                x2={icon.x + 6}
                y2={icon.y + ICON - 6}
              />
            </g>
          {/if}
        </g>
      {/if}

      <!-- The marquee (change 13A): the action colour, 1px, no fill, while the pointer drags from an empty cell. -->
      {#if marqueeBox !== undefined}
        <rect
          class="marquee-box"
          data-testid="surface-marquee"
          x={x(marqueeBox.col)}
          y={y(marqueeBox.row)}
          width={marqueeBox.w * PITCH}
          height={marqueeBox.h * PITCH}
        />
      {/if}

      <!-- The proposed bounds, before anything commits (section 8). -->
      {#if proposed !== undefined}
        <rect
          class="proposed"
          data-testid="surface-proposed"
          x={x(proposed.col)}
          y={y(proposed.row)}
          width={proposed.w * PITCH}
          height={proposed.h * PITCH}
        />
      {/if}

      <!-- The keyboard's focus cell, while the plate has focus. -->
      {#if focused && !play}
        <rect
          class="focus"
          data-testid="surface-focus"
          x={x(view.focus.col) + 1}
          y={y(view.focus.row) + 1}
          width={PITCH - 2}
          height={PITCH - 2}
        />
      {/if}
    </svg>
  </div>

  <div class="under">
    <span class="matrix type-micro">{MATRIX_LINE}</span>
    <span class="count numerals" data-testid="surface-count"
      >{elementsLine(regions.length)}</span
    >
  </div>
  <p
    class="status type-helper"
    id={statusId}
    role="status"
    data-testid="surface-status"
  >
    {status}
  </p>
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    inline-size: 100%;
    max-inline-size: var(--plate, 571px);
  }

  /* The plate: a square, the PDF's 571 at most, the workspace token under a boundary hairline; position: relative so the canvas and the SVG stack; touch-action: none so a finger is not a scroll. */
  .plate {
    position: relative;
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: var(--plate);
    aspect-ratio: 1;
    border: 1px solid var(--color-boundary);
    background: var(--color-workspace);
    touch-action: none;
    cursor: default;
    user-select: none;
  }

  /* The selector's cursor is the arrow; an armed kind makes it the crosshair (change 10A). */
  .plate.armed {
    cursor: crosshair;
  }

  .plate.play {
    cursor: pointer;
  }

  .preview {
    position: absolute;
    inset: 0;
  }

  .preview :global(canvas) {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    image-rendering: pixelated;
  }

  .overlay {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    display: block;
    overflow: visible;
  }

  /* In Play the SVG is a picture over the live one; the wrapper takes the finger. */
  .plate.play .overlay {
    pointer-events: none;
  }

  /* The static lattice: the decorative divider token, 1px at any size. */
  .guides line {
    stroke: var(--color-divider);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  /* A region covers the lattice, as the page's regions cover the cells. */
  .region .ground {
    fill: var(--color-workspace);
  }

  /* A region's tinted fill and its 1px boundary, both the stored colour (the tint measured off page 3, header). */
  .region .body {
    fill-opacity: 0.24;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  /* The 1px marks: the XY pad's crosshair at half strength, as the page draws it. */
  .region .mark {
    fill: none;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .region .hair {
    stroke-opacity: 0.5;
  }

  /* The knob's ring and its pointer tick: the page's 5 and 4, scaling with the plate. */
  .region .ring {
    stroke-width: 5;
    vector-effect: none;
  }

  .region .pointer {
    stroke-width: 4;
    vector-effect: none;
  }

  /* The fader's groove is a darker channel in the workspace colour; the value and the thumb are the region's colour. */
  .region .groove {
    fill: var(--color-workspace);
    fill-opacity: 0.7;
  }

  /* The button's chip: the page's raised box with the quiet ink. */
  .region .chip {
    fill: var(--color-raised);
  }

  .region .chip-word {
    fill: var(--color-ink-quiet);
    font-family: var(--font-display);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    pointer-events: none;
  }

  /* Numerals: the mono face, tabular, the region's colour (set inline). */
  .region .numeral {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }

  /* The view toggles (change 13C): the numerals and the names leave the picture, nothing else moves. */
  .region.no-numbers .numeral,
  .region.no-names .name {
    display: none;
  }

  /* The shared-controller mark: the ink (never the error red - a warning, not a refusal), a triangle and its bar, straight lines only. */
  .conflict-shape {
    fill: var(--color-ink);
    pointer-events: none;
  }

  .conflict-bar {
    stroke: var(--color-workspace);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }

  /* The 11px uppercase name, the micro role's tracking. */
  .region .name {
    fill: var(--color-ink);
    font-family: var(--font-display);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    pointer-events: none;
  }

  .region .name.action {
    fill: var(--color-action);
  }

  /* The selected body drags: the move cursor over it; a locked one does not move. */
  .region.selected .body {
    cursor: move;
  }

  .region.locked .body {
    cursor: default;
  }

  /* The lock glyph: the quiet ink, a filled square body and a 2px square arch. */
  .lock-body {
    fill: var(--color-ink-quiet);
    pointer-events: none;
  }

  .lock-shackle {
    fill: none;
    stroke: var(--color-ink-quiet);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }

  /* The selection: the action colour, 1px, round each member and round the set; eight filled squares. */
  .selection .outline {
    fill: none;
    stroke: var(--color-action);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  /* The set's outline is dashed so it reads as the group, not a ninth element. */
  .selection .outline.group {
    stroke-dasharray: 4 3;
  }

  /* The marquee: the action colour, 1px, no fill, no radius. */
  .marquee-box {
    fill: none;
    stroke: var(--color-action);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }

  /* While a marquee is drawn the plate keeps the crosshair. */
  .plate.marquee {
    cursor: crosshair;
  }

  .selection .handle {
    fill: var(--color-action);
    stroke: var(--color-workspace);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
    pointer-events: all;
  }

  /* The hit square under each handle: invisible, but a target (SANDBOX_HANDLE_HIT). */
  .selection .handle-hit {
    fill: none;
    stroke: none;
    pointer-events: all;
  }

  .selection [data-handle="nw"],
  .selection [data-handle="se"] {
    cursor: nwse-resize;
  }

  .selection [data-handle="ne"],
  .selection [data-handle="sw"] {
    cursor: nesw-resize;
  }

  .selection [data-handle="n"],
  .selection [data-handle="s"] {
    cursor: ns-resize;
  }

  .selection [data-handle="w"],
  .selection [data-handle="e"] {
    cursor: ew-resize;
  }

  /* While a handle or a body is held the whole plate keeps the drag's meaning. */
  .plate.dragging {
    cursor: move;
  }

  /* The delete icon: a filled action-colour square with the workspace's cross, its hit square invisible and a pointer's target. */
  .delete-hit {
    fill: none;
    stroke: none;
    pointer-events: all;
    cursor: pointer;
  }

  .delete-box {
    fill: var(--color-action);
    pointer-events: none;
  }

  .delete-glyph {
    stroke: var(--color-workspace);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }

  /* The proposed bounds: the action colour, dashed, before anything commits. */
  .proposed {
    fill: var(--color-action);
    fill-opacity: 0.08;
    stroke: var(--color-action);
    stroke-width: 1;
    stroke-dasharray: 4 3;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }

  /* The keyboard's cell: the focus ring's colour and width, inside the cell. */
  .focus {
    fill: none;
    stroke: var(--color-action);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }

  .plate:focus-visible {
    outline: 2px solid var(--color-action);
    outline-offset: 2px;
  }

  /* The inline rename's field (13B): over the element, above the SVG, the display face at the name's size, its text selectable; square by preflight's input rule (radius.e2e.ts's header). */
  .rename {
    position: absolute;
    z-index: 1;
    box-sizing: border-box;
    padding-inline: 8px;
    border: 1px solid var(--color-action);
    background: var(--color-workspace);
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-align: center;
    color: var(--color-ink);
    user-select: text;
  }

  .rename:focus {
    outline: none;
  }

  .under {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 16px;
    margin-block-start: 12px;
  }

  .matrix {
    color: var(--color-ink-quiet);
  }

  .count {
    font-size: 13px;
    color: var(--color-ink-quiet);
  }

  .status {
    margin: 8px 0 0;
    min-block-size: 1.45em;
    color: var(--color-ink-quiet);
  }
</style>
