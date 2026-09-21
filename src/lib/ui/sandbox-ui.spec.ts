// The Sandbox's interface, twenty-eight tests (7 and 8 by 13.1-03, 9 by change 5, 10 and 11 by
// change 10A - the selector, the hotkeys, the move, the delete icon, the blank kind; 12 by 10B, 13
// by change 11 - an XY pad's Touches; 14 to 16 by 13A; 17 to 20 by 13B; 21 to 27 by 13C - the menu,
// the sheet, the Play monitor, the shared-controller pass, the view toggles, the recent colours, the
// profile controls; 28 by change 15 - the tool rail), two halves each:
// the behaviour half drives src/lib/sandbox/editor.ts in node with NO POINTER
// EVENT - the model's own surface is the thing asserted; the shape half renders
// the components with svelte/server against the model's state and scans the
// source for the rules that are properties of the text (the pointer-move
// handler never places; the list's rows are buttons with arrow keys). Every
// scan strips comments first, except the pins that read a header on purpose
// (history.ts's headings, TuningRegion.svelte's pointer back at history.ts).
// Decided at 13-16 / 13.1-03 (Bible sections 2, 8, 14, 16); see .planning/phases/13.1-bench-corrections-four/13.1-03-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import {
  ARRANGE_HELPER,
  BUTTON_MIN_MAX_HELPER,
  CC_RANGE,
  CHANNEL_RANGE,
  CONFLICTS,
  CONFLICTS_HELPER,
  DEFAULTS_HELPER,
  DISTRIBUTE_NO_ROOM,
  DUPLICATE_AT_CAP,
  EMPTY_INSTRUCTION,
  EMPTY_SECOND_LINE,
  FLIP_HORIZONTAL,
  FLIP_VERTICAL,
  GROUP_HELPER,
  KIND_LABELS,
  KNOB_MODE_WORDS,
  KNOB_RELATIVE_HELPER,
  LIST_EMPTY,
  LOCKED_HELPER,
  MENU_ALIGN_TWO,
  MENU_NEEDS_SELECTION,
  MENU_NOTHING_TO_SELECT,
  MENU_RENAME_ONE,
  MENU_SPACE_THREE,
  MODE_HELPER,
  MULTI_LEDE,
  NOTE_RANGE,
  NOTHING_TO_PASTE,
  NO_LINK_EXPLANATION,
  PALETTE_FILL_HELPER,
  PASTE_AT_CAP,
  PASTE_NO_SPACE,
  PLAY_LOCKS_FIELDS,
  PLAY_LOCKS_PALETTE,
  REDO,
  SAVE_COPY,
  PLAY_MONITOR_EMPTY,
  PLAY_MONITOR_HELPER,
  RECENT_COLOURS_HELPER,
  RESET_DEFAULTS_HELPER,
  ROTATE,
  SHORTCUTS_TITLE,
  SPRING_HELPER,
  STARTER_ACTION,
  TEMPLATE_ACTION,
  TOGGLE,
  TOGGLE_HELPER,
  TOO_FULL_TO_STORE,
  TOUCHES,
  TOUCHES_HELPER,
  TOOLS,
  UNDO,
  VALUE_RANGE,
  VIEW_NAMES,
  VIEW_NAMES_HELPER,
  VIEW_NUMBERS,
  VIEW_NUMBERS_HELPER,
  WHOLE_NUMBER,
  conflictLine,
  lockedDeleteLine,
  lockedMoveLine,
  recentColourName,
  titledWithKeys,
  touchesCcRange,
} from "../sandbox/copy";
import {
  conflictedIds,
  controllersOf,
  findConflicts,
} from "../sandbox/conflicts";
import { menuItems, type MenuItem } from "../sandbox/menu";
import {
  PLAY_MONITOR_ROWS,
  messageWord,
  newestRows,
  playMonitorLine,
} from "../sandbox/play-monitor";
import {
  SHORTCUT_GROUPS,
  isMacPlatform,
  keysRead,
  keysWord,
  platformOf,
} from "../sandbox/shortcuts";
import {
  GLYPH_BOX,
  RAIL_BOXES,
  RAIL_GROUPS,
  railBoxes,
  type RailFlags,
} from "../sandbox/tool-rail";
import {
  EXPORT_PROFILE,
  EXPORT_PROFILE_HELPER,
  EXPORT_PROFILE_OVER,
  IMPORT_PROFILE,
} from "../share/profile-copy";
import type { HostMidi } from "../sim/lua-host";
import { MonitorLog, midiLogOf, type MonitorRow } from "../sim/monitor";
import {
  readRecentColours,
  rememberColour,
  writeRecentColours,
} from "../store/sandbox-colours";
import { readSandboxView, writeSandboxView } from "../store/sandbox-view";
import { EXPORT_ACCEPT } from "../store/transfer";
import { noteName } from "../tune/view";
import {
  DEFAULT_COLOUR,
  DEFAULT_SIZES,
  HOTKEYS,
  NO_DEFAULTS,
  NUMERIC_FIELDS,
  PALETTE,
  SELECTOR_KEY,
  REMEMBERED_FIELDS,
  SandboxEditor,
  autoName,
  kindForKey,
  rememberKind,
  withKindDefaults,
  type EditorState,
} from "../sandbox/editor";
import {
  DEFAULT_VIEW,
  ELEMENT_KINDS,
  NO_COLOURS,
  OWNED_KEYS,
  RECENT_COLOURS_CAP,
  SANDBOX_COLOURS_KEY,
  SANDBOX_DEFAULTS_KEY,
  SANDBOX_VIEW_KEY,
  isRecentColours,
  isSandboxDefaults,
  isSandboxView,
  isStoredRecord,
  type SandboxDefaults,
  type SandboxView,
} from "../store/schema";
import {
  readSandboxDefaults,
  resetSandboxDefaults,
  writeSandboxDefaults,
} from "../store/sandbox-defaults";
import type { LocalStore } from "../store/local";
import {
  CLIPBOARD_KEY,
  clearClipboard,
  isClipboardContent,
  readClipboard,
  writeClipboard,
  type ClipboardContent,
} from "../sandbox/clipboard";
import { regionRow, regionTail } from "../sandbox/emit";
import {
  GEOMETRY_COPY,
  alignBoxes,
  buildCellMap,
  distributeBoxes,
  largestFreeBox,
  overlapLine,
  placementFor,
  touching,
  transformBox,
  validate,
} from "../sandbox/geometry";
import { History } from "../sandbox/history";
import {
  boundingBox,
  ccCeiling,
  flagsOf,
  lockedOf,
  orientationOf,
  seventhOf,
  withBrightness,
} from "../sandbox/model";
import {
  BRIGHTNESS_RANGE,
  BRIGHTNESS_SURFACE_HELPER,
} from "../tune/inspector-copy";
import {
  SURFACE_ELEMENT_CAP,
  emptySurface,
  type ElementKind,
  type Region,
  type Surface,
} from "../sandbox/model";
import ContextMenu from "./sandbox/ContextMenu.svelte";
import ElementList from "./sandbox/ElementList.svelte";
import Palette from "./sandbox/Palette.svelte";
import PlayMonitor from "./sandbox/PlayMonitor.svelte";
import RegionInspector from "./sandbox/RegionInspector.svelte";
import ShortcutSheet from "./sandbox/ShortcutSheet.svelte";
import SurfaceEditor from "./sandbox/SurfaceEditor.svelte";
import ToolRail from "./sandbox/ToolRail.svelte";
import { stripComments } from "../../test-support/source";

const repo = (rel: string) =>
  fileURLToPath(new URL(`../../../${rel}`, import.meta.url));

const code = (rel: string) => stripComments(readFileSync(repo(rel), "utf8"));

const UI = "src/lib/ui/sandbox";
const ROUTE = "src/routes/sandbox/[draftId]/+page.svelte";

const noop = () => undefined;

/** The plate, rendered against a state. */
const plate = (view: EditorState) =>
  render(SurfaceEditor, {
    props: {
      view,
      onclick: noop,
      onmove: noop,
      onmark: noop,
      oncancel: noop,
      ondelete: noop,
    },
  }).body;

/** The inspector, rendered against the editor's state. */
const inspector = (editor: SandboxEditor) =>
  render(RegionInspector, {
    props: {
      view: editor.state(),
      onrename: noop,
      onnumber: noop,
      oncommit: noop,
      onorientation: noop,
      onlatch: noop,
      oncolour: noop,
      onduplicate: noop,
      ondelete: noop,
    },
  }).body;

const palette = (view: EditorState) =>
  render(Palette, {
    props: {
      mode: view.mode,
      placement: view.placement,
      atCap: view.atCap,
      onchoose: noop,
    },
  }).body;

const list = (view: EditorState) =>
  render(ElementList, {
    props: {
      regions: view.surface.regions,
      selectedId: view.selectedId,
      selection: view.selection,
      onselect: noop,
    },
  }).body;

const count = (html: string, needle: string) => html.split(needle).length - 1;

/** The rail's flags with everything live (change 15). */
const LIVE_FLAGS: RailFlags = {
  play: false,
  empty: false,
  canUndo: true,
  canRedo: true,
  numbers: true,
  names: true,
};

/** The tool rail rendered against the flags, described by "why" in Play. */
const railHtml = (flags: Partial<RailFlags>, mac = false) =>
  render(ToolRail, {
    props: {
      ...LIVE_FLAGS,
      ...flags,
      mac,
      describedBy: "why",
      onaction: noop,
      ontoggle: noop,
      onimport: noop,
      onshortcuts: noop,
    },
  }).body;

/** A rail box's opening tag by its test id (the file box is its input). */
const railBox = (html: string, id: string): string =>
  new RegExp(`<(?:button|input)[^>]*data-testid="${id}"[^>]*>`).exec(
    html,
  )?.[0] ?? "";

/** Every region on a surface validates against the others, and the map builds. */
function wholeSurfaceValid(surface: Surface): boolean {
  if (!buildCellMap(surface.regions).ok) return false;
  return surface.regions.every((r) => validate(r, surface).ok);
}

/** A fresh editor over an empty surface, recording every state it emits. */
function fresh(): { editor: SandboxEditor; emitted: Surface[] } {
  const emitted: Surface[] = [];
  const editor = new SandboxEditor(emptySurface("t", "Test"), {
    onchange: (state) => void emitted.push(state.surface),
  });
  return { editor, emitted };
}

const byId = (editor: SandboxEditor, id: string): Region =>
  editor.surface.regions.find((r) => r.id === id) as Region;

/** A region's box, for a geometry assertion. */
const boxOf = (r: Region) => ({ col: r.col, row: r.row, w: r.w, h: r.h });

/** A store over a Map, for the defaults' round trip (change 13B). */
function mapStore(): { store: LocalStore; map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    store: {
      getItem: (key) => map.get(key) ?? null,
      setItem: (key, value) => void map.set(key, value),
      removeItem: (key) => void map.delete(key),
    },
  };
}

describe("the Sandbox's interface (src/lib/ui/sandbox-ui.spec.ts)", () => {
  it("1. the empty state: the real plate with its lattice, section 8's instruction re-worded for the selector, one starter action and one template, and no question-mark placeholder anywhere", () => {
    // THE INSTRUCTION IS SECTION 8'S SHAPE (a direct instruction), re-worded
    // at change 10A because area selection went; the route renders the
    // constant rather than a copy, and the second line names the hotkeys.
    expect(EMPTY_INSTRUCTION).toBe("Add an element to the surface.");
    expect(EMPTY_SECOND_LINE).toBe(
      "Start with a fader, or press F, B, X, K or L and click a cell.",
    );
    const route = code(ROUTE);
    expect(route, "the route renders section 8's instruction").toContain(
      "{EMPTY_INSTRUCTION}",
    );
    expect(route).toContain('data-testid="starter-action"');
    expect(route).toContain('data-testid="template-action"');
    expect(
      TEMPLATE_ACTION.toLowerCase(),
      "the alternative is named as a template, so an empty surface stays possible",
    ).toContain("template");

    // NO QUESTION-MARK PLACEHOLDER: the empty block of the route carries no
    // `?` at all, and neither does the rendered plate.
    const emptyBlock = route.slice(
      route.indexOf('data-testid="sandbox-empty"'),
      route.indexOf("{/if}", route.indexOf('data-testid="sandbox-empty"')),
    );
    expect(emptyBlock.length, "the empty block was found").toBeGreaterThan(100);
    // The block's TEXT, with its `{...}` expressions removed: what a visitor
    // could read. (The expressions themselves carry `editor?.` calls.)
    expect(
      emptyBlock.replace(/[{][^}]*[}]/g, ""),
      "a question-mark placeholder in the empty state",
    ).not.toContain("?");
    for (const text of [
      EMPTY_INSTRUCTION,
      EMPTY_SECOND_LINE,
      STARTER_ACTION,
      TEMPLATE_ACTION,
    ]) {
      expect(text, "a question mark in the empty state's words").not.toContain(
        "?",
      );
    }

    // THE REAL PLATE: an empty editor renders the lattice - sixteen lines
    // in one static group - and no region, and the status names the focus
    // cell so the keyboard route has somewhere to start.
    const { editor } = fresh();
    const html = plate(editor.state());
    expect(html).toContain('data-testid="surface-guides"');
    expect(count(html, "<line"), "the lattice is 8 + 8 lines, drawn once").toBe(
      16,
    );
    expect(count(html, 'data-testid="surface-region"')).toBe(0);
    expect(count(html, 'data-testid="surface-handle"')).toBe(0);
    expect(html, "the plate shows no question mark either").not.toContain("?");
    expect(html).toContain('data-testid="surface-status"');
    expect(html).toContain("0 elements");

    // The lattice is STATIC: one <g> written by the template, never a
    // per-frame loop - the component has no requestAnimationFrame and no
    // canvas of its own.
    const source = code(`${UI}/SurfaceEditor.svelte`);
    expect(source).not.toContain("requestAnimationFrame");
    expect(source).not.toContain("strokeRect");
    expect(source).toContain('<g class="guides"');
    // NEVER A ROUNDED CORNER (D-01), on the comment-stripped source: no
    // border-radius declaration, and no rx / ry on any of the plate's rects
    // - the handles, their hit squares, the fader's thumb and the button's
    // chip (13.1-03; 13.1-PLAN-CHECK W-06: no layer of the radius gate reads
    // an SVG rx). The knob's circle is a <circle>, not a rect with a radius.
    expect(source).not.toContain("border-radius");
    expect(source).not.toMatch(/(^|\s)r[xy]=/m);
    expect(source).toContain("<circle");

    // The rail's two sections on an empty surface: five palette rows
    // enabled, each showing its hotkey (change 10A), and the list saying so
    // in one line.
    const rail = palette(editor.state());
    expect(count(rail, "<button")).toBe(5);
    expect(rail).not.toContain("disabled");
    for (const kind of ELEMENT_KINDS) {
      expect(rail).toContain(KIND_LABELS[kind]);
      expect(rail).toContain(`aria-keyshortcuts="${HOTKEYS[kind]}"`);
      expect(rail).toContain(`>${HOTKEYS[kind].toUpperCase()}</kbd>`);
    }
    expect(list(editor.state())).toContain(LIST_EMPTY);
  });

  it("2. the selector is the default tool (change 10A): a click on an element selects, a click on empty clears, an armed kind places at every click until V or Escape, the hotkeys map one letter to one kind, and the keyboard route across the plate", () => {
    const { editor } = fresh();

    // ARM A KIND, CLICK: a region exists at its default size with its
    // top-left at the cell, selected - and the kind STAYS ARMED (answer 3b),
    // so the next click places another; `cancel` (V or Escape) is the way
    // back to the selector.
    expect(editor.choose("knob")).toBe(true);
    expect(editor.placement).toEqual({ kind: "element", type: "knob" });
    const placed = editor.clickCell(2, 3);
    expect(placed.kind).toBe("placed");
    const knob = editor.surface.regions[0];
    expect(knob).toMatchObject({
      kind: "knob",
      col: 2,
      row: 3,
      w: DEFAULT_SIZES.knob.w,
      h: DEFAULT_SIZES.knob.h,
    });
    expect(editor.selectedId, "the placed region is selected").toBe(knob.id);
    expect(editor.placement, "still armed").toEqual({
      kind: "element",
      type: "knob",
    });
    expect(editor.clickCell(6, 6).kind, "a second click places again").toBe(
      "placed",
    );
    expect(editor.surface.regions).toHaveLength(2);
    // A refused placement (on top of the first knob) keeps the kind armed.
    expect(editor.clickCell(2, 3).kind).toBe("refused");
    expect(editor.placement.kind).toBe("element");
    editor.cancel();
    expect(editor.placement).toEqual({ kind: "idle" });
    // A click near the edge lands the default box inside the plate.
    editor.choose("fader");
    expect(editor.clickCell(8, 0).kind).toBe("placed");
    expect(editor.surface.regions[2]).toMatchObject({
      col: 7,
      row: 0,
      w: 2,
      h: 6,
    });
    editor.cancel();

    // THE SELECTOR: a click on a held cell SELECTS and never creates; a
    // click on an empty cell CLEARS the selection and keeps the focus cell
    // (section 8's keyboard focus) where the click landed.
    const before = editor.surface.regions.length;
    const picked = editor.clickCell(3, 4);
    expect(picked.kind).toBe("selected");
    expect(editor.selectedId).toBe(knob.id);
    expect(editor.surface.regions.length).toBe(before);
    const cleared = editor.clickCell(0, 0);
    expect(cleared.kind).toBe("cleared");
    expect(editor.selectedId).toBeUndefined();
    expect(editor.focus).toEqual({ col: 0, row: 0 });
    expect(editor.surface.regions.length, "nothing created").toBe(before);
    expect(editor.history.depth, "selection is no entry").toBe(3);

    // THE HOTKEYS (answer 2): one lower-case letter per kind, all distinct,
    // read case-insensitively; V is the selector and arms nothing.
    expect(HOTKEYS).toEqual({
      fader: "f",
      button: "b",
      xy: "x",
      knob: "k",
      blank: "l",
    });
    expect(SELECTOR_KEY).toBe("v");
    expect(new Set(Object.values(HOTKEYS)).size).toBe(ELEMENT_KINDS.length);
    for (const kind of ELEMENT_KINDS) {
      expect(kindForKey(HOTKEYS[kind])).toBe(kind);
      expect(kindForKey(HOTKEYS[kind].toUpperCase())).toBe(kind);
    }
    expect(kindForKey(SELECTOR_KEY)).toBeUndefined();
    expect(kindForKey("Escape")).toBeUndefined();
    // The route's window listener reads them, never inside a text field or
    // a select, never with a modifier, never for a key the plate handled.
    const route = code(ROUTE);
    const listener = route.slice(
      route.indexOf("function onWindowKeyDown"),
      route.indexOf("function fromCopy"),
    );
    expect(listener).toContain("kindForKey(key)");
    expect(listener).toContain("key === SELECTOR_KEY");
    expect(listener).toContain("HTMLInputElement");
    expect(listener).toContain("HTMLTextAreaElement");
    expect(listener).toContain("HTMLSelectElement");
    expect(listener).toContain("event.defaultPrevented");
    expect(listener).toContain("event.altKey");
    expect(listener).toContain('key === "delete" || key === "backspace"');

    // NO POINTER-MOVE IS REQUIRED, PROVED TWO WAYS (13.1-03, D-03): the
    // model's methods that take a box are the two a drag hands over on
    // RELEASE and the two an arrow press makes, none a pointer or a hover
    // could reach; and the plate's pointermove handler records the hover
    // cell and the proposed box of a drag in progress - it never calls
    // onclick and never commits. Tests 7 and 10 drive both without a pointer.
    const methods = Object.getOwnPropertyNames(SandboxEditor.prototype);
    expect(methods.filter((m) => /pointer|hover/i.test(m))).toEqual([]);
    expect(
      methods.filter((m) => /^(resize|move|nudge)/.test(m)).sort(),
    ).toEqual([
      "moveFocus",
      "moveSelectedTo",
      "nudgeSelected",
      "resizeSelectedBy",
      "resizeSelectedTo",
    ]);
    const source = code(`${UI}/SurfaceEditor.svelte`);
    const move = source.slice(
      source.indexOf("function onpointermove"),
      source.indexOf("function onpointerup"),
    );
    expect(move.length, "the pointermove handler was found").toBeGreaterThan(
      40,
    );
    expect(move, "pointermove places or selects").not.toContain("onclick(");
    expect(move, "pointermove commits a drag").not.toContain("onresize");
    expect(move, "pointermove commits a move").not.toContain("onmoveto");
    expect(move).toContain("hover = cellOf(event)");
    expect(
      source,
      "the click path fires from pointerdown, so a plain click is a whole step",
    ).toMatch(
      /function onpointerdown[^]*?onclick\(at\.col, at\.row, shift, alt\)/,
    );
    expect(
      source,
      "a release is never a second click (the area accelerator went)",
    ).not.toContain("downCell");

    // THE KEYBOARD ROUTE: with a kind armed the arrows move the focus cell
    // and Enter marks it - the same click - so a kind can be placed without
    // a pointer at all; the plate's own handler sends the arrows to the
    // element only with the selector and a selection (test 10).
    editor.setFocus({ col: 0, row: 0 });
    editor.choose("button");
    editor.moveFocus(3, 0);
    editor.moveFocus(1, 0);
    expect(editor.focus).toEqual({ col: 4, row: 0 });
    expect(editor.mark().kind).toBe("placed");
    expect(editor.surface.regions[3]).toMatchObject({
      kind: "button",
      col: 4,
      row: 0,
      w: 2,
      h: 2,
    });
    // The focus never leaves the plate: clamped at the edges.
    editor.moveFocus(-20, 30);
    expect(editor.focus).toEqual({ col: 0, row: 8 });
    editor.cancel();
    // The plate's key handler wires the four arrows, Enter, Escape and Delete.
    for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]) {
      expect(source, `the plate handles ${key}`).toContain(`${key}:`);
    }
    for (const key of ["Enter", "Escape", "Delete"]) {
      expect(source, `the plate handles ${key}`).toContain(`case "${key}":`);
    }
    expect(source).toContain(
      'view.selection.length > 0 && view.placement.kind === "idle"',
    );

    // The proposed bounds are drawn from the focus cell too, so the keyboard
    // route sees what the next Enter will commit.
    editor.choose("xy");
    editor.setFocus({ col: 1, row: 1 });
    const html = plate(editor.state());
    expect(html).toContain('data-testid="surface-proposed"');
  });

  it("3. the element list is a complete alternative to the plate: every region selected from the list by the keyboard alone, the plate's selection following and the inspector re-targeting", () => {
    const { editor } = fresh();
    editor.choose("fader");
    editor.clickCell(0, 0);
    editor.choose("button");
    editor.clickCell(3, 0);
    editor.choose("knob");
    editor.clickCell(5, 3);
    const ids = editor.surface.regions.map((r) => r.id);
    expect(ids).toHaveLength(3);

    // THE ROWS ARE BUTTONS - real tab stops that Enter and Space activate -
    // each named with its kind, and the arrows walk them.
    const source = code(`${UI}/ElementList.svelte`);
    expect(source).toContain('<button\n            class="row"');
    for (const key of ["ArrowDown", "ArrowUp", "Home", "End"]) {
      expect(source, `the list handles ${key}`).toContain(`"${key}"`);
    }
    expect(source).toContain(
      "onclick={(event) => onselect(region.id, event.shiftKey)}",
    );

    // SELECT EACH FROM THE LIST: what a row's activation does is
    // editor.select(id) and nothing else; the plate's selection follows,
    // and the inspector re-targets.
    for (const id of ids) {
      editor.select(id);
      expect(editor.selectedId).toBe(id);
      const region = byId(editor, id);

      const rows = list(editor.state());
      expect(count(rows, "<button")).toBe(3);
      expect(count(rows, 'aria-current="true"'), "one raised row").toBe(1);
      expect(rows).toMatch(
        new RegExp(`data-row="${id}"[^>]*aria-current="true"`),
      );
      expect(rows).toContain(`${region.name}, ${KIND_LABELS[region.kind]}`);

      const html = plate(editor.state());
      expect(count(html, 'data-testid="surface-selection"')).toBe(1);
      expect(
        count(html, 'data-testid="surface-delete"'),
        "one delete icon",
      ).toBe(1);
      expect(count(html, 'data-testid="surface-handle"'), "eight handles").toBe(
        8,
      );
      // The 16px hit squares under them carry their own test id, never the
      // handle's (13.1-03, W-07): the counts above stay eight.
      expect(count(html, 'data-testid="surface-handle-hit"')).toBe(8);
      for (const name of ["nw", "n", "ne", "w", "e", "sw", "s", "se"]) {
        expect(html).toContain(
          `data-testid="surface-handle" data-handle="${name}"`,
        );
      }
      // The outline sits on the selected region's own box (a member's outline; no group outline on one).
      const pitch = 571 / 9;
      expect(html).toMatch(
        new RegExp(
          `class="outline member[^"]*" data-testid="surface-member" x="${region.col * pitch}" y="${region.row * pitch}"`,
        ),
      );
      expect(count(html, 'data-testid="surface-member"')).toBe(1);
      expect(count(html, 'data-testid="surface-group"')).toBe(0);

      const panel = inspector(editor);
      expect(panel).toContain(`data-testid="inspector-name">${region.name}<`);
      expect(panel).toContain(
        `SELECTED ELEMENT / ${KIND_LABELS[region.kind].toUpperCase()}`,
      );
      expect(panel).toContain(`${region.w} × ${region.h} units`);
    }

    // Selection is not an edit: three selections, zero entries.
    expect(editor.history.depth).toBe(3);
  });

  it("4. the mode switch: in Play the palette is disabled with a reason, the handles are gone and the fields are read-only with a reason; back in Edit the same region is selected and the history is the same length - in both directions", () => {
    const { editor } = fresh();
    editor.choose("fader");
    editor.clickCell(1, 1);
    editor.choose("button");
    editor.clickCell(6, 6);
    const [fader, button] = editor.surface.regions;
    editor.select(fader.id);
    const depth = editor.history.depth;
    expect(depth).toBe(2);

    // EDIT -> PLAY.
    editor.setMode("play");
    expect(editor.mode).toBe("play");
    const inPlay = editor.state();

    const rail = palette(inPlay);
    expect(count(rail, "disabled"), "every palette row is disabled").toBe(5);
    expect(count(rail, "aria-describedby="), "each with the reason wired").toBe(
      5,
    );
    expect(rail).toContain(PLAY_LOCKS_PALETTE);
    expect(editor.choose("knob"), "the model refuses too").toBe(false);

    const html = plate(inPlay);
    expect(
      count(html, 'data-testid="surface-handle"'),
      "no handles in Play",
    ).toBe(0);
    expect(count(html, 'data-testid="surface-handle-hit"')).toBe(0);
    expect(count(html, 'data-testid="surface-selection"')).toBe(0);
    expect(html).toContain('data-mode="play"');

    const panel = inspector(editor);
    for (const field of ["cc", "channel"]) {
      expect(panel).toMatch(
        new RegExp(`data-testid="field-${field}"[^>]*readonly`),
      );
    }
    expect(panel).toContain(PLAY_LOCKS_FIELDS);
    expect(panel).toMatch(/data-testid="duplicate-element"[^>]*disabled/);
    expect(panel).toMatch(/data-testid="delete-element"[^>]*disabled/);
    expect(editor.editNumber("cc", "3"), "a numeric edit in Play").toBe(false);
    expect(editor.nudgeSelected(1, 0), "a nudge in Play").toBeUndefined();
    expect(editor.remove().kind, "a delete in Play").toBe("nothing");
    expect(editor.undo(), "an undo in Play").toBe(false);
    expect(byId(editor, fader.id)).toMatchObject({ col: 1, cc: 1 });
    expect(html, "no delete icon in Play").not.toContain("surface-delete");

    // Selection and history survived the way in.
    expect(editor.selectedId).toBe(fader.id);
    expect(editor.history.depth).toBe(depth);

    // PLAY -> EDIT: the same region, the same depth; the handles are back.
    editor.setMode("edit");
    expect(editor.mode).toBe("edit");
    expect(editor.selectedId).toBe(fader.id);
    expect(editor.history.depth).toBe(depth);
    expect(count(plate(editor.state()), 'data-testid="surface-handle"')).toBe(
      8,
    );
    expect(count(palette(editor.state()), "disabled")).toBe(0);

    // THE OTHER DIRECTION: select in Edit, go to Play and back, then select
    // the OTHER one, go to Play and back - the selection made before each
    // switch is the one after it.
    editor.select(button.id);
    editor.setMode("play");
    expect(editor.selectedId).toBe(button.id);
    editor.setMode("edit");
    expect(editor.selectedId).toBe(button.id);
    expect(editor.history.depth).toBe(depth);

    // And an edit after the round trip lands on top of the same history.
    editor.editNumber("cc", "3");
    expect(editor.history.depth).toBe(depth + 1);

    // The mode label is persistent and visible, and the switch is the way back.
    const route = code(ROUTE);
    expect(route).toContain('data-testid="mode-line"');
    expect(route).toContain('data-testid="mode-edit"');
    expect(route).toContain('data-testid="mode-play"');
  });

  it("5. validation preserves: an out-of-range controller keeps the last valid value in the model, the message stays until corrected, the plate's routes refuse geometry with their own lines, and no intermediate invalid surface ever reached the model", () => {
    const { editor, emitted } = fresh();
    editor.choose("fader");
    editor.clickCell(0, 0);
    editor.cancel();
    const id = editor.selectedId as string;
    expect(byId(editor, id)).toMatchObject({ w: 2, h: 6, cc: 1 });

    // AN OUT-OF-RANGE CONTROLLER: refused; the model holds 1; the field
    // shows the typed text with the field's own message. (The geometry
    // fields went at change 10A; the three MIDI fields are the typed route.)
    expect(NUMERIC_FIELDS).toEqual([
      "cc",
      "cc2",
      "channel",
      "min",
      "max",
      "springValue",
      "note",
    ]);
    expect(editor.editNumber("cc", "200")).toBe(false);
    expect(byId(editor, id).cc, "the previous valid value survives").toBe(1);
    expect(editor.fields.cc).toEqual({ text: "200", message: CC_RANGE });
    expect(editor.fieldText("cc")).toBe("200");
    expect(editor.state().texts.cc, "the state carries the same text").toBe(
      "200",
    );
    expect(editor.fieldText("channel"), "the other fields show the model").toBe(
      "1",
    );

    // The inspector renders the typed text, aria-invalid and the message.
    const panel = inspector(editor);
    expect(panel).toMatch(
      /data-testid="field-cc"[^>]*value="200"[^>]*aria-invalid="true"/,
    );
    expect(panel).toContain(CC_RANGE);

    // THE MESSAGE STAYS UNTIL CORRECTED: a second refused keystroke keeps a
    // message; a blur (commit) does not clear it; a valid keystroke does.
    expect(editor.editNumber("cc", "")).toBe(false);
    expect(editor.fields.cc?.message).toBe(WHOLE_NUMBER);
    editor.commitField();
    expect(
      editor.fields.cc,
      "a commit does not silence the message",
    ).toBeDefined();
    expect(byId(editor, id).cc).toBe(1);
    expect(editor.editNumber("cc", "74")).toBe(true);
    expect(byId(editor, id).cc).toBe(74);
    expect(editor.fields.cc).toBeUndefined();
    expect(editor.fieldText("cc")).toBe("74");
    expect(editor.editNumber("cc", "x")).toBe(false);
    expect(editor.fields.cc?.message).toBe(WHOLE_NUMBER);
    expect(editor.editNumber("channel", "0")).toBe(false);
    expect(editor.fields.channel?.message).toBe(CHANNEL_RANGE);
    expect(editor.editNumber("channel", "16")).toBe(true);
    expect(editor.editNumber("cc", "74")).toBe(true);

    // THE PLATE'S ROUTES refuse geometry with their own sentences and the
    // same preservation: a Shift-arrow below a vertical fader's two rows, an
    // arrow off the left edge naming the column, a drag onto another region
    // with section 16's line verbatim naming it.
    expect(editor.resizeSelectedBy(0, -5)?.message).toContain(
      "at least 2 rows",
    );
    expect(byId(editor, id).h).toBe(6);
    expect(editor.nudgeSelected(-1, 0)?.message).toBe(
      GEOMETRY_COPY.offSurface("col"),
    );
    expect(byId(editor, id).col).toBe(0);
    expect(editor.nudgeSelected(0, 4)?.message).toBe(
      GEOMETRY_COPY.offSurface("h"),
    );
    expect(byId(editor, id).row).toBe(0);
    editor.choose("button");
    editor.clickCell(7, 0);
    editor.cancel();
    const buttonId = editor.selectedId as string;
    expect(editor.moveSelectedTo({ col: 1, row: 0 })?.message).toBe(
      "This region overlaps Fader 1. Choose another area or resize it.",
    );
    expect(byId(editor, buttonId).col).toBe(7);

    // NO INTERMEDIATE INVALID STATE EVER REACHED THE MODEL: every surface
    // the editor emitted validates whole, and none carries a refused value.
    expect(emitted.length).toBeGreaterThan(10);
    for (const surface of emitted) {
      expect(wholeSurfaceValid(surface)).toBe(true);
      for (const r of surface.regions) {
        expect(r.w).toBeLessThanOrEqual(9);
        expect(r.h).toBeGreaterThanOrEqual(1);
        expect(r.cc).toBeLessThanOrEqual(127);
        expect(r.channel).toBeGreaterThanOrEqual(1);
      }
    }
    // And the history holds only valid surfaces too.
    for (const entry of editor.history.entries) {
      expect(wholeSurfaceValid(entry.before)).toBe(true);
      expect(wholeSurfaceValid(entry.after)).toBe(true);
    }
  });

  it("6. undo covers everything structural - place, move, resize, rename, recolour, duplicate and delete - each undone and redone; a numeric field's keystrokes are one entry; and the depth is the same after a mode round trip", () => {
    const { editor } = fresh();
    const snapshots: Surface[] = [editor.surface];
    const step = (label: string, act: () => unknown) => {
      act();
      snapshots.push(editor.surface);
      expect(editor.history.depth, `${label} is one entry`).toBe(
        snapshots.length - 1,
      );
    };

    // PLACE, MOVE (three arrow presses, one entry), RESIZE (two Shift-arrow
    // presses, one entry), RENAME, RECOLOUR, DUPLICATE, DELETE.
    step("place", () => {
      editor.choose("button");
      editor.clickCell(0, 0);
      editor.cancel();
    });
    const id = editor.selectedId as string;
    step("move", () => {
      for (let i = 0; i < 3; i += 1)
        expect(editor.nudgeSelected(1, 0)).toBeUndefined();
      editor.commitField();
    });
    expect(byId(editor, id).col).toBe(3);
    step("resize (two presses, one entry)", () => {
      expect(editor.resizeSelectedBy(0, -1)).toBeUndefined();
      expect(editor.resizeSelectedBy(0, 6)).toBeUndefined();
      editor.commitField();
    });
    expect(byId(editor, id).h).toBe(7);
    step("rename", () => {
      editor.rename("Hold");
      editor.commitField();
    });
    step("recolour", () => editor.setColour([15, 0, 0]));
    step("duplicate", () => expect(editor.duplicate().ok).toBe(true));
    const copyId = editor.selectedId as string;
    expect(copyId).not.toBe(id);
    step("delete", () => {
      editor.select(id);
      expect(editor.remove().kind).toBe("done");
    });
    expect(editor.surface.regions.map((r) => r.id)).toEqual([copyId]);
    expect(editor.history.entries.map((e) => e.kind)).toEqual([
      "place",
      "move",
      "resize",
      "rename",
      "recolour",
      "duplicate",
      "delete",
    ]);

    // THE COALESCING: the resize entry's before is h 2 and its after is h 7;
    // h 1 exists in no entry. And the boundary is real: a press after
    // commitField (the plate's key-up) is a NEW entry.
    const resize = editor.history.entries[2];
    expect(resize.key).toBe(`grow:${id}`);
    expect(editor.history.entries[1].key).toBe(`nudge:${id}`);
    expect(byId({ surface: resize.before } as SandboxEditor, id).h).toBe(2);
    expect(byId({ surface: resize.after } as SandboxEditor, id).h).toBe(7);
    for (const entry of editor.history.entries) {
      for (const r of entry.after.regions) expect(r.h).not.toBe(1);
    }

    // UNDO ALL THE WAY DOWN, each step landing on the snapshot before it -
    // deletion included, which puts the region back and re-selects it.
    for (let i = snapshots.length - 1; i > 0; i -= 1) {
      expect(editor.undo(), `undo ${i}`).toBe(true);
      expect(editor.surface).toEqual(snapshots[i - 1]);
    }
    expect(editor.undo(), "nothing left to undo").toBe(false);
    expect(editor.surface.regions).toEqual([]);

    // REDO ALL THE WAY UP.
    for (let i = 1; i < snapshots.length; i += 1) {
      expect(editor.redo(), `redo ${i}`).toBe(true);
      expect(editor.surface).toEqual(snapshots[i]);
    }
    expect(editor.redo(), "nothing left to redo").toBe(false);

    // The deletion, undone once more: the region is back and selected.
    editor.undo();
    expect(editor.surface.regions.map((r) => r.id).sort()).toEqual(
      [id, copyId].sort(),
    );
    expect(editor.selectedId, "undoing a delete re-selects it").toBe(id);

    // A NEW EDIT AFTER AN UNDO DROPS THE FUTURE.
    expect(editor.history.canRedo).toBe(true);
    editor.rename("Hold again");
    expect(editor.history.canRedo).toBe(false);

    // THE MODE ROUND TRIP LEAVES THE DEPTH ALONE - and seals an open field,
    // so a keystroke after Play is a new entry.
    const depth = editor.history.depth;
    editor.setMode("play");
    editor.setMode("edit");
    expect(editor.history.depth).toBe(depth);
    expect(editor.selectedId).toBe(id);
    editor.editNumber("cc", "4");
    editor.setMode("play");
    editor.setMode("edit");
    editor.editNumber("cc", "5");
    expect(editor.history.depth, "a field sealed by the switch").toBe(
      depth + 2,
    );

    // THE BOUNDARY, STATED IN THE MODULE: the header names the coalescing
    // rule and points at Undo randomize as the thing it is not.
    const header = readFileSync(repo("src/lib/sandbox/history.ts"), "utf8");
    expect(header).toContain("COALESCING BOUNDARY");
    expect(header).toContain("Undo randomize");
    const tuning = readFileSync(repo("src/lib/ui/TuningRegion.svelte"), "utf8");
    expect(tuning, "the other header points back").toContain("history.ts");

    // The History class itself: coalescing by key and recency, sealed by
    // undo, and a keystroke under another key is another entry.
    const h = new History();
    const s = (n: number): Surface => emptySurface(`s${n}`, `S${n}`);
    h.push({
      kind: "resize",
      before: s(0),
      after: s(1),
      regionId: "r",
      key: "k",
    });
    h.push({
      kind: "resize",
      before: s(1),
      after: s(2),
      regionId: "r",
      key: "k",
    });
    expect(h.depth).toBe(1);
    expect(h.entries[0].after).toEqual(s(2));
    h.push({
      kind: "move",
      before: s(2),
      after: s(3),
      regionId: "r",
      key: "other",
    });
    expect(h.depth).toBe(2);
    h.seal();
    h.push({
      kind: "move",
      before: s(3),
      after: s(4),
      regionId: "r",
      key: "other",
    });
    expect(h.depth, "sealed: the same key is a new entry").toBe(3);
    expect(h.undo()?.surface).toEqual(s(3));
    h.push({
      kind: "move",
      before: s(3),
      after: s(5),
      regionId: "r",
      key: "other",
    });
    expect(
      h.depth,
      "undo sealed the entry and the push did not merge into it",
    ).toBe(3);
    expect(h.canRedo).toBe(false);

    // THE CAP IS THE CEILING: sixteen one-cell blanks place from one arming;
    // the seventeenth click is refused with the cap's sentence - worded
    // without a number (change 10A) - and the palette's rows are disabled
    // with the same reason beside them.
    const capped = fresh().editor;
    expect(capped.choose("blank")).toBe(true);
    for (let i = 0; i < SURFACE_ELEMENT_CAP; i += 1) {
      expect(capped.clickCell(i % 9, Math.floor(i / 9)).kind).toBe("placed");
    }
    expect(capped.surface.regions).toHaveLength(SURFACE_ELEMENT_CAP);
    expect(capped.atCap).toBe(true);
    expect(capped.clickCell(8, 8)).toEqual({
      kind: "refused",
      message: GEOMETRY_COPY.cap,
    });
    expect(GEOMETRY_COPY.cap).not.toMatch(/[0-9]/);
    expect(DUPLICATE_AT_CAP).not.toMatch(/[0-9]/);
    expect(capped.choose("button")).toBe(false);
    const rail = palette(capped.state());
    expect(count(rail, "disabled")).toBe(5);
    expect(rail).toContain(GEOMETRY_COPY.cap);
    expect(capped.duplicate()).toEqual({ ok: false, reason: "cap" });
  });

  it("7. a handle drag commits through the editor on release: resizeSelectedTo moves a fader to the box, one entry undone and redone; an overlapping or too-small box is refused with its line and the surface is the same object; Play and an empty selection change nothing", () => {
    // 13.1-03 (13.1-CONTEXT D-03, bench line 3). Driven with no pointer: the
    // box is what the plate computes from the handle and the cell under the
    // pointer, and the model takes it once, on release.
    const { editor, emitted } = fresh();
    editor.choose("fader");
    editor.clickCell(0, 0);
    editor.cancel();
    const faderId = editor.selectedId as string;
    expect(byId(editor, faderId)).toMatchObject({ col: 0, row: 0, w: 2, h: 6 });
    const before = editor.surface;
    const depth = editor.history.depth;

    // THE ACCEPTED BOX: the fader is 3 x 6, one entry under the resize kind.
    expect(editor.resizeSelectedTo({ col: 0, row: 0, w: 3, h: 6 })).toBe(
      undefined,
    );
    expect(byId(editor, faderId)).toMatchObject({ col: 0, row: 0, w: 3, h: 6 });
    expect(editor.history.depth, "one drag is one entry").toBe(depth + 1);
    expect(editor.history.entries[depth].kind).toBe("resize");
    // A second drag is a SECOND entry - the first was sealed on release -
    // and Undo walks each back on its own; Redo re-applies.
    expect(editor.resizeSelectedTo({ col: 1, row: 0, w: 3, h: 6 })).toBe(
      undefined,
    );
    expect(editor.history.depth).toBe(depth + 2);
    expect(editor.undo()).toBe(true);
    expect(byId(editor, faderId)).toMatchObject({ col: 0, w: 3, h: 6 });
    expect(editor.undo()).toBe(true);
    expect(byId(editor, faderId)).toMatchObject({ col: 0, w: 2, h: 6 });
    expect(editor.surface).toEqual(before);
    expect(editor.redo()).toBe(true);
    expect(byId(editor, faderId)).toMatchObject({ w: 3, h: 6 });
    expect(editor.selectedId, "undo and redo re-select the region").toBe(
      faderId,
    );

    // A REFUSED BOX LEAVES THE REGION AS IT WAS. An overlap: the fader
    // dragged onto a button is section 16's line, naming the button, and
    // the surface is the SAME OBJECT - not a copy, not a partial edit.
    editor.choose("button");
    editor.clickCell(5, 0);
    editor.cancel();
    editor.select(faderId);
    const held = editor.surface;
    const heldDepth = editor.history.depth;
    const overlap = editor.resizeSelectedTo({ col: 0, row: 0, w: 6, h: 6 });
    expect(overlap?.message).toBe(
      "This region overlaps Button 1. Choose another area or resize it.",
    );
    expect(editor.surface, "the same surface object").toBe(held);
    expect(byId(editor, faderId)).toMatchObject({ w: 3, h: 6 });
    expect(editor.history.depth, "a refusal is no entry").toBe(heldDepth);
    // Off the surface: the off-surface line, the field named.
    const off = editor.resizeSelectedTo({ col: 0, row: 0, w: 3, h: 10 });
    expect(off?.message).toBe(GEOMETRY_COPY.offSurface("h"));
    expect(editor.surface).toBe(held);
    // Too small: a knob dragged to 2 x 2 is refused with the knob's line.
    editor.choose("knob");
    editor.clickCell(5, 5);
    editor.cancel();
    const knobId = editor.selectedId as string;
    const knobHeld = editor.surface;
    const small = editor.resizeSelectedTo({ col: 5, row: 5, w: 2, h: 2 });
    expect(small?.message).toContain("A knob needs at least 3 × 3 cells");
    expect(editor.surface).toBe(knobHeld);
    expect(byId(editor, knobId)).toMatchObject({ w: 3, h: 3 });

    // THE SAME BOX commits nothing: no entry, the surface untouched.
    const same = editor.surface;
    const sameDepth = editor.history.depth;
    expect(editor.resizeSelectedTo({ col: 5, row: 5, w: 3, h: 3 })).toBe(
      undefined,
    );
    expect(editor.surface).toBe(same);
    expect(editor.history.depth).toBe(sameDepth);

    // PLAY LOCKS IT, silently; NOTHING SELECTED is nothing to resize.
    editor.setMode("play");
    expect(editor.resizeSelectedTo({ col: 5, row: 5, w: 4, h: 4 })).toBe(
      undefined,
    );
    expect(editor.surface).toBe(same);
    editor.setMode("edit");
    editor.select(undefined);
    expect(editor.resizeSelectedTo({ col: 0, row: 0, w: 4, h: 4 })).toBe(
      undefined,
    );
    expect(editor.surface).toBe(same);

    // Every surface the editor emitted validates whole: a drag never put an
    // invalid one anywhere (section 2).
    for (const surface of emitted)
      expect(wholeSurfaceValid(surface)).toBe(true);
    for (const entry of editor.history.entries) {
      expect(wholeSurfaceValid(entry.before)).toBe(true);
      expect(wholeSurfaceValid(entry.after)).toBe(true);
    }
  });

  it("8. every new element takes the next of the four-entry palette by creation order - the first PALETTE[0], the fifth PALETTE[0] again, a deletion not counted, a loaded surface continuing from its count - and the four are distinct RGB444 triples with the first the action colour", () => {
    // 13.1-03 (D-03: "each element should have its own color"). The counter
    // is CREATION order, not `minted` (13.1-PLAN-CHECK W-05) and not the
    // live count.
    expect(PALETTE).toHaveLength(4);
    expect(PALETTE[0]).toEqual(DEFAULT_COLOUR);
    expect(DEFAULT_COLOUR).toEqual([13, 15, 7]);
    for (const triple of PALETTE) {
      expect(triple).toHaveLength(3);
      for (const level of triple) {
        expect(Number.isInteger(level)).toBe(true);
        expect(level).toBeGreaterThanOrEqual(0);
        expect(level).toBeLessThanOrEqual(15);
      }
    }
    expect(new Set(PALETTE.map((t) => t.join(","))).size, "four distinct").toBe(
      4,
    );

    // FOUR KINDS, FOUR COLOURS, in the order placed; the fifth wraps.
    const { editor } = fresh();
    editor.choose("fader");
    editor.clickCell(0, 0);
    editor.choose("xy");
    editor.clickCell(3, 0);
    editor.choose("button");
    editor.clickCell(0, 7);
    editor.choose("knob");
    editor.clickCell(6, 6);
    expect(editor.surface.regions.map((r) => r.colour)).toEqual([
      PALETTE[0],
      PALETTE[1],
      PALETTE[2],
      PALETTE[3],
    ]);
    editor.choose("blank");
    editor.clickCell(8, 0);
    expect(editor.surface.regions[4].colour).toEqual(PALETTE[0]);

    // A DELETION IS NOT A STEP BACK: delete the fifth, place a sixth - it is
    // the next of the cycle, not the fifth's colour again.
    expect(editor.remove().kind).toBe("done");
    editor.clickCell(8, 2);
    expect(editor.surface.regions[4].colour).toEqual(PALETTE[1]);
    // The colours are the region's own value: the picker still recolours,
    // and the palette is not consulted again for that region.
    editor.setColour([15, 0, 0]);
    expect(editor.surface.regions[4].colour).toEqual([15, 0, 0]);
    // A refused placement and the cap's probe never advance the cycle: an
    // element placed after a refusal is still the next of the cycle.
    editor.choose("knob");
    expect(editor.clickCell(0, 0).kind, "a knob on the fader").toBe("refused");
    editor.choose("blank");
    editor.clickCell(4, 4);
    expect(editor.surface.regions[5].colour).toEqual(PALETTE[2]);

    // A LOADED SURFACE continues from its count: three regions loaded, the
    // next placed takes PALETTE[3] - whatever ids the loaded ones carry.
    const loaded = fresh().editor;
    loaded.choose("button");
    loaded.clickCell(0, 0);
    loaded.choose("button");
    loaded.clickCell(3, 0);
    loaded.choose("button");
    loaded.clickCell(6, 0);
    const three = loaded.surface;
    const opened = fresh().editor;
    opened.load(three);
    opened.choose("button");
    opened.clickCell(0, 5);
    expect(opened.surface.regions[3].colour).toEqual(PALETTE[3]);
    // Its id is button-4: mint() walked past the three loaded ids, so a
    // palette indexed by `minted` (4) would have wrapped to PALETTE[0] here.
    // The counter is creation order (W-05).
    expect(opened.surface.regions[3].id).toBe("button-4");

    // The template's two are the first two of the cycle.
    const templated = fresh().editor;
    expect(templated.template()).toBe(true);
    expect(templated.surface.regions.map((r) => r.colour)).toEqual([
      PALETTE[0],
      PALETTE[1],
    ]);
  });

  it("9. the surface's brightness (change 5): one typed field under Appearance with or without a selection, its helper naming the surface, read-only in Play; the editor records one coalesced entry per edit, undone and redone, refused in Play, 255 the field's absence", () => {
    // THE BEHAVIOUR HALF, on the model alone.
    const { editor, emitted } = fresh();
    editor.starter();
    const depth = editor.history.depth;
    expect(
      editor.surface.brightness,
      "a new surface has no field",
    ).toBeUndefined();
    editor.setBrightness(128);
    expect(editor.surface.brightness).toBe(128);
    expect(editor.history.depth, "one entry").toBe(depth + 1);
    expect(editor.history.entries.at(-1)?.kind).toBe("brightness");
    // Typed digits coalesce: 12 then 128 is still one entry until the boundary.
    editor.setBrightness(12);
    editor.setBrightness(120);
    expect(editor.history.depth, "keystrokes coalesced").toBe(depth + 1);
    expect(editor.surface.brightness).toBe(120);
    editor.commitField();
    editor.setBrightness(64);
    expect(editor.history.depth, "a new entry after the boundary").toBe(
      depth + 2,
    );
    expect(
      editor.setBrightness(64),
      "the same value is a no-op",
    ).toBeUndefined();
    expect(editor.history.depth).toBe(depth + 2);
    // Undo and redo walk the field like any structural edit.
    editor.undo();
    expect(editor.surface.brightness).toBe(120);
    editor.undo();
    expect(editor.surface.brightness).toBeUndefined();
    editor.redo();
    expect(editor.surface.brightness).toBe(120);
    // 255 is the field's absence, canonically, so a surface at full is the surface as it was written.
    editor.commitField();
    editor.setBrightness(255);
    expect(editor.surface).not.toHaveProperty("brightness");
    expect(withBrightness(editor.surface, 255)).toBe(editor.surface);
    // Play refuses it.
    editor.setMode("play");
    editor.setBrightness(30);
    expect(editor.surface.brightness).toBeUndefined();
    editor.setMode("edit");
    // Every emitted surface was valid: the field never touched a region.
    for (const surface of emitted)
      expect(wholeSurfaceValid(surface)).toBe(true);

    // THE SHAPE HALF: the inspector with a selection and without one.
    editor.setBrightness(90);
    const selected = inspector(editor);
    expect(selected).toContain('data-testid="brightness-field"');
    expect(selected).toMatch(/value="90"/);
    expect(selected).toContain('data-testid="brightness-field-changed"');
    expect(selected, "the helper says whose it is").toContain(
      BRIGHTNESS_SURFACE_HELPER,
    );
    expect(selected, "under Appearance, after the swatch").toMatch(
      /region-swatch[^]*brightness-field/,
    );
    editor.select(undefined);
    const none = inspector(editor);
    expect(none, "no selection: the field is still there").toContain(
      'data-testid="brightness-field"',
    );
    expect(none).toContain(">Appearance<");
    expect(none).not.toContain('data-testid="region-swatch"');
    editor.setMode("play");
    const locked = inspector(editor);
    expect(locked, "read-only in Play").toMatch(
      /data-testid="brightness-field-input"[^>]*readonly/,
    );
    expect(locked).toMatch(/data-testid="brightness-field-reset"[^>]*disabled/);
    editor.setMode("edit");
    // The refusal string and the wiring.
    expect(BRIGHTNESS_RANGE).toBe("Brightness is 1 to 255.");
    const source = code(`${UI}/RegionInspector.svelte`);
    expect(source).toContain("<BrightnessField");
    expect(source).toContain("onchange={(next) => onbrightness?.(next)}");
    expect(source).toContain("onreset={() => onbrightness?.(255)}");
    expect(source, "no selection lists Appearance, then New elements").toMatch(
      /if [(]!any[)]\s*return \[\s*\{ title: APPEARANCE, content: appearance \},\s*\{ title: NEW_ELEMENTS, content: defaults \},\s*\];/,
    );
    const route = code(ROUTE);
    expect(route).toContain(
      "onbrightness={(next) => editor?.setBrightness(next)}",
    );
  });

  it("10. the selector's edits (change 10A): a body drag is one move entry refused where the box would overlap or leave the plate, the arrows nudge and Shift-arrows resize with a held key one entry, the delete icon sits on the selection, the panel carries no position block, no kind select and no meter, and no number about the budget reaches the words", () => {
    // THE BEHAVIOUR HALF, on the model alone: the drag's release.
    const { editor, emitted } = fresh();
    editor.choose("fader");
    editor.clickCell(1, 1);
    editor.cancel();
    const faderId = editor.selectedId as string;
    const depth = editor.history.depth;
    expect(editor.moveSelectedTo({ col: 4, row: 2 })).toBeUndefined();
    expect(byId(editor, faderId)).toMatchObject({ col: 4, row: 2, w: 2, h: 6 });
    expect(editor.history.depth, "one drag is one entry").toBe(depth + 1);
    expect(editor.history.entries[depth].kind).toBe("move");
    expect(editor.focus, "the focus follows the origin").toEqual({
      col: 4,
      row: 2,
    });
    expect(editor.moveSelectedTo({ col: 5, row: 2 })).toBeUndefined();
    expect(editor.history.depth, "a second drag is a second entry").toBe(
      depth + 2,
    );
    expect(editor.undo()).toBe(true);
    expect(byId(editor, faderId).col).toBe(4);
    expect(editor.undo()).toBe(true);
    expect(byId(editor, faderId)).toMatchObject({ col: 1, row: 1 });
    expect(editor.redo()).toBe(true);
    expect(byId(editor, faderId).col).toBe(4);
    // The same cell commits nothing; a refused box leaves the region as it
    // was and the surface the same object.
    const same = editor.surface;
    expect(editor.moveSelectedTo({ col: 4, row: 2 })).toBeUndefined();
    expect(editor.surface).toBe(same);
    editor.choose("button");
    editor.clickCell(7, 0);
    editor.cancel();
    editor.select(faderId);
    const held = editor.surface;
    const heldDepth = editor.history.depth;
    expect(editor.moveSelectedTo({ col: 6, row: 0 })?.message).toBe(
      "This region overlaps Button 1. Choose another area or resize it.",
    );
    expect(editor.moveSelectedTo({ col: 8, row: 0 })?.message).toBe(
      GEOMETRY_COPY.offSurface("w"),
    );
    expect(editor.surface).toBe(held);
    expect(editor.history.depth).toBe(heldDepth);
    // Play and an empty selection change nothing.
    editor.setMode("play");
    expect(editor.moveSelectedTo({ col: 0, row: 0 })).toBeUndefined();
    expect(editor.surface).toBe(held);
    editor.setMode("edit");
    editor.select(undefined);
    expect(editor.moveSelectedTo({ col: 0, row: 0 })).toBeUndefined();
    expect(editor.nudgeSelected(1, 0)).toBeUndefined();
    expect(editor.resizeSelectedBy(1, 0)).toBeUndefined();
    expect(editor.surface).toBe(held);

    // THE ARROWS: a run of presses is one entry until the release commits;
    // Shift and an arrow resize the same way; each refused at the edge with
    // the geometry's own line and nothing moved.
    editor.select(faderId);
    const arrowDepth = editor.history.depth;
    expect(editor.nudgeSelected(0, 1)).toBeUndefined();
    expect(editor.nudgeSelected(-1, 0)).toBeUndefined();
    expect(editor.nudgeSelected(-1, 0)).toBeUndefined();
    expect(byId(editor, faderId)).toMatchObject({ col: 2, row: 3, w: 2, h: 6 });
    expect(editor.history.depth, "three presses, one entry").toBe(
      arrowDepth + 1,
    );
    editor.commitField();
    expect(editor.nudgeSelected(0, -1)).toBeUndefined();
    expect(editor.history.depth, "a press after the release is new").toBe(
      arrowDepth + 2,
    );
    editor.commitField();
    expect(editor.resizeSelectedBy(1, 0)).toBeUndefined();
    expect(editor.resizeSelectedBy(0, 1)).toBeUndefined();
    expect(byId(editor, faderId)).toMatchObject({ w: 3, h: 7 });
    expect(editor.history.depth).toBe(arrowDepth + 3);
    expect(editor.history.entries.at(-1)?.kind).toBe("resize");
    editor.commitField();
    expect(editor.nudgeSelected(0, 5)?.message).toBe(
      GEOMETRY_COPY.offSurface("h"),
    );
    expect(editor.resizeSelectedBy(0, 5)?.message).toBe(
      GEOMETRY_COPY.offSurface("h"),
    );
    expect(byId(editor, faderId)).toMatchObject({ col: 2, row: 2, w: 3, h: 7 });
    expect(editor.undo()).toBe(true);
    expect(byId(editor, faderId)).toMatchObject({ w: 2, h: 6 });
    for (const surface of emitted)
      expect(wholeSurfaceValid(surface)).toBe(true);

    // THE SHAPE HALF. The plate: the delete icon on the selection - a
    // 20 square with a 44 hit under it, gone in Play - and the plate
    // wires the body drag, the arrows, the Shift resize and the release.
    editor.select(faderId);
    const html = plate(editor.state());
    expect(count(html, 'data-testid="surface-delete"')).toBe(1);
    expect(html).toMatch(/class="delete-hit[^"]*"[^>]*width="44" height="44"/);
    expect(html).toMatch(/class="delete-box[^"]*"[^>]*width="20" height="20"/);
    expect(count(html, "delete-glyph"), "the cross, two strokes").toBe(2);
    const source = code(`${UI}/SurfaceEditor.svelte`);
    expect(source).toContain("onclick={() => ondelete()}");
    expect(source).toContain("onpointerdown={holdForDelete}");
    expect(source).toContain("onmoveto?.({ col: box.col, row: box.row })");
    expect(source).toMatch(/event\.shiftKey\s*\?\s*onresizeby\?\.\(/);
    expect(source).toMatch(/function onkeyup[^]*?oncommit\?\.\(\)/);
    expect(source, "no rounded corner (D-01)").not.toContain("border-radius");
    expect(source).not.toMatch(/(^|\s)r[xy]=/m);

    // The panel: no Position & size block, the type a plain label, no
    // meter; the units chip stays beside the headline; the MIDI fields and
    // the orientation select are still fields.
    const panel = inspector(editor);
    expect(panel).not.toContain("geometry-grid");
    expect(panel).not.toContain("Position &amp; size");
    expect(panel).not.toContain("Position & size");
    for (const id of ["field-col", "field-row", "field-w", "field-h"])
      expect(panel, `${id} is gone`).not.toContain(`data-testid="${id}"`);
    expect(panel).toMatch(
      /<span[^>]*data-testid="field-kind"[^>]*data-kind="fader"[^>]*>Fader</,
    );
    expect(panel).not.toMatch(/<select[^>]*field-kind/);
    expect(panel).toMatch(/<select[^>]*data-testid="field-orientation"/);
    expect(panel).toContain('data-testid="field-cc"');
    expect(panel).toContain('data-testid="inspector-units"');
    expect(panel).toContain('data-testid="delete-element"');
    expect(panel).not.toContain("surface-meters");
    expect("setKind" in SandboxEditor.prototype).toBe(false);
    expect("editNumber" in SandboxEditor.prototype).toBe(true);
    const route = code(ROUTE);
    for (const gone of [
      "surface-meters",
      "meter-line",
      "BudgetMeter",
      "costOf",
    ])
      expect(route, `${gone} is gone from the route`).not.toContain(gone);
    expect(route).toContain(
      "onmoveto={(cell) => editor?.moveSelectedTo(cell)}",
    );
    expect(route).toContain(
      "onnudge={(dc, dr) => editor?.nudgeSelected(dc, dr)}",
    );
    expect(route).toContain(
      "onresizeby={(dw, dh) => editor?.resizeSelectedBy(dw, dh)}",
    );

    // NO NUMBER ABOUT THE BUDGET reaches the Sandbox's words (answer 12):
    // the cap, the duplicate refusal and Store's refusal are worded without
    // one, and copy.ts spells neither the budget nor the cap.
    for (const line of [GEOMETRY_COPY.cap, DUPLICATE_AT_CAP, TOO_FULL_TO_STORE])
      expect(line, "a number in a refusal").not.toMatch(/[0-9]/);
    const copy = code("src/lib/sandbox/copy.ts");
    expect(copy).not.toContain("908");
    expect(copy).not.toContain("16 elements");
    expect(copy).not.toContain("measuring");
  });

  it("11. the blank kind (change 10A): L arms it, it places 1 x 1 with an inert controller, counts against the cap, moves and resizes like the others, its panel has no MIDI output, its palette row reads Blank / L, and a draft written with four kinds still reads as it did", () => {
    expect(kindForKey("l")).toBe("blank");
    expect(DEFAULT_SIZES.blank).toEqual({ w: 1, h: 1 });
    expect(KIND_LABELS.blank).toBe("Blank");
    const { editor, emitted } = fresh();
    expect(editor.choose("blank")).toBe(true);
    expect(editor.clickCell(4, 4).kind).toBe("placed");
    const blank = editor.surface.regions[0];
    expect(blank).toMatchObject({
      kind: "blank",
      name: "Blank 1",
      col: 4,
      row: 4,
      w: 1,
      h: 1,
      cc: 0,
      channel: 1,
    });
    expect(blank).not.toHaveProperty("cc2");
    expect(blank).not.toHaveProperty("latch");
    expect(blank).not.toHaveProperty("orientation");
    // A blank sends nothing, so it holds no controller: the next fader
    // still takes controller 1.
    editor.choose("fader");
    editor.clickCell(0, 0);
    editor.cancel();
    expect(editor.surface.regions[1].cc).toBe(1);
    // Selectable, movable, resizable; its minimum is one cell.
    editor.select(blank.id);
    expect(editor.nudgeSelected(1, 0)).toBeUndefined();
    editor.commitField();
    expect(editor.resizeSelectedBy(1, 1)).toBeUndefined();
    editor.commitField();
    expect(byId(editor, blank.id)).toMatchObject({
      col: 5,
      row: 4,
      w: 2,
      h: 2,
    });
    expect(editor.moveSelectedTo({ col: 7, row: 7 })).toBeUndefined();
    expect(editor.resizeSelectedTo({ col: 7, row: 7, w: 1, h: 1 })).toBe(
      undefined,
    );
    expect(editor.resizeSelectedBy(-1, 0)?.message).toBe(
      GEOMETRY_COPY.offSurface("w"),
    );
    expect(byId(editor, blank.id)).toMatchObject({
      col: 7,
      row: 7,
      w: 1,
      h: 1,
    });
    for (const surface of emitted)
      expect(wholeSurfaceValid(surface)).toBe(true);

    // THE SHAPE HALF: the panel with the blank selected has no MIDI output
    // section and no controller field, but its swatch; the list names it;
    // the palette row reads Blank with its key; the plate draws its name
    // and no control.
    const panel = inspector(editor);
    expect(panel).toContain("SELECTED ELEMENT / BLANK");
    expect(panel).not.toContain("MIDI output");
    expect(panel).not.toContain('data-testid="field-cc"');
    expect(panel).not.toContain('data-testid="field-channel"');
    expect(panel).toContain('data-testid="region-swatch"');
    expect(list(editor.state())).toContain("Blank 1, Blank");
    const rail = palette(editor.state());
    expect(rail).toMatch(
      /data-testid="palette-blank"[^>]*aria-keyshortcuts="l"/,
    );
    const html = plate(editor.state());
    expect(html).toMatch(/data-kind="blank"[^>]*data-testid="surface-region"/);
    const blankMark = html.slice(
      html.indexOf('data-kind="blank"'),
      html.indexOf("</g>", html.indexOf('data-kind="blank"')),
    );
    expect(blankMark).toContain("Blank 1");
    expect(blankMark, "no button chip on a blank").not.toContain("OFF");
    expect(blankMark).not.toContain("<circle");

    // THE CAP counts a blank as a region (test 6 fills sixteen of them).
    const capped = fresh().editor;
    capped.choose("blank");
    for (let i = 0; i < SURFACE_ELEMENT_CAP; i += 1)
      capped.clickCell(i % 9, Math.floor(i / 9));
    expect(capped.atCap).toBe(true);

    // THE SCHEMA: a record written with the four kinds reads as it did; a
    // record with a blank reads too; an unknown kind is refused whole.
    const record = (kind: string) => ({
      schema: 1,
      id: "sandbox:s-1",
      name: "Old",
      kind: "sandbox",
      source: "s-1",
      createdAt: "2026-09-01T00:00:00.000Z",
      editedAt: "2026-09-01T00:00:00.000Z",
      surface: {
        id: "s-1",
        name: "Old",
        regions: [
          {
            id: "fader-1",
            name: "Filter",
            kind: "fader",
            col: 0,
            row: 0,
            w: 2,
            h: 6,
            cc: 1,
            channel: 1,
            colour: [13, 15, 7],
            orientation: "vertical",
          },
          {
            id: "x-2",
            name: "Wash",
            kind,
            col: 4,
            row: 4,
            w: 1,
            h: 1,
            cc: 0,
            channel: 1,
            colour: [7, 11, 10],
          },
        ],
      },
    });
    expect(isStoredRecord(record("button"))).toBe(true);
    expect(isStoredRecord(record("blank"))).toBe(true);
    expect(isStoredRecord(record("wash"))).toBe(false);
    expect(ELEMENT_KINDS).toEqual(["fader", "button", "knob", "xy", "blank"]);
  });

  it("12. the change 10B options: min and max, Mode and Speed, Spring and its value, Toggle, Output with a typed note, Group - each one Undo through the editor, refused off its kind or its range with the model untouched, locked in Play; the panel's fields per kind; a draft with the fields reads and a bad word is refused whole", () => {
    const { editor, emitted } = fresh();
    // A FADER: Mode, then Speed, Spring, the spring value, min and max - six
    // entries, each undone and redone.
    editor.choose("fader");
    editor.clickCell(0, 0);
    editor.cancel();
    const fader = editor.surface.regions[0];
    const placed = editor.state().depth;
    expect(editor.setRegionMode("relative")).toBe(true);
    expect(byId(editor, fader.id).mode).toBe("relative");
    expect(editor.state().depth).toBe(placed + 1);
    editor.setSpeed("full");
    editor.setSpring(true);
    expect(byId(editor, fader.id)).toMatchObject({
      speed: "full",
      spring: true,
    });
    expect(editor.editNumber("springValue", "200")).toBe(false);
    expect(editor.fields.springValue?.message).toBe(VALUE_RANGE);
    expect(byId(editor, fader.id)).not.toHaveProperty("springValue");
    expect(editor.state().texts.springValue).toBe("200");
    expect(editor.editNumber("springValue", "100")).toBe(true);
    editor.commitField();
    expect(editor.state().texts.springValue).toBe("100");
    expect(editor.editNumber("min", "127")).toBe(true);
    editor.commitField();
    expect(editor.editNumber("max", "0")).toBe(true);
    editor.commitField();
    expect(byId(editor, fader.id)).toMatchObject({
      springValue: 100,
      min: 127,
      max: 0,
    });
    expect(editor.editNumber("max", "128")).toBe(false);
    expect(editor.fields.max?.message).toBe(VALUE_RANGE);
    expect(byId(editor, fader.id).max, "the last valid value").toBe(0);
    expect(editor.state().depth).toBe(placed + 6);
    // A knob's mode on a fader: refused, no entry.
    expect(editor.setRegionMode("relative-twos")).toBe(false);
    expect(editor.state().depth).toBe(placed + 6);
    for (let i = 0; i < 6; i += 1) expect(editor.undo()).toBe(true);
    for (const field of [
      "mode",
      "speed",
      "spring",
      "springValue",
      "min",
      "max",
    ])
      expect(byId(editor, fader.id), field).not.toHaveProperty(field);
    for (let i = 0; i < 6; i += 1) expect(editor.redo()).toBe(true);
    expect(byId(editor, fader.id)).toMatchObject({
      mode: "relative",
      speed: "full",
      spring: true,
      springValue: 100,
      min: 127,
      max: 0,
    });
    // A BUTTON: Toggle, Output, the note typed as a name and as a number, Group.
    editor.choose("button");
    editor.clickCell(7, 0);
    editor.cancel();
    const button = editor.surface.regions[1];
    editor.setLatch(true);
    editor.setOutput("note");
    expect(byId(editor, button.id)).toMatchObject({
      latch: true,
      output: "note",
    });
    expect(editor.state().texts.note).toBe(noteName(button.cc));
    expect(editor.editNumber("note", "H3")).toBe(false);
    expect(editor.fields.note?.message).toBe(NOTE_RANGE);
    expect(byId(editor, button.id).cc).toBe(button.cc);
    expect(editor.editNumber("note", "C#3")).toBe(true);
    editor.commitField();
    expect(byId(editor, button.id).cc).toBe(49);
    expect(editor.state().texts.note).toBe("C#3");
    expect(editor.editNumber("note", "60")).toBe(true);
    editor.commitField();
    expect(byId(editor, button.id).cc).toBe(60);
    expect(editor.state().texts.note).toBe("C4");
    editor.setGroup(3);
    expect(byId(editor, button.id).group).toBe(3);
    const grouped = editor.state().depth;
    editor.setGroup(9);
    editor.setGroup(-1);
    expect(editor.state().depth).toBe(grouped);
    expect(editor.setRegionMode("relative"), "a button has no mode").toBe(
      false,
    );
    editor.setSpring(true);
    expect(byId(editor, button.id)).not.toHaveProperty("spring");
    // A KNOB: one of its four; a fader's Relative refused. An XY PAD:
    // Relative and Full. A BLANK: nothing.
    editor.choose("knob");
    editor.clickCell(3, 4);
    editor.cancel();
    const knob = editor.surface.regions[2];
    expect(editor.setRegionMode("relative-sign")).toBe(true);
    expect(byId(editor, knob.id).mode).toBe("relative-sign");
    expect(editor.setRegionMode("relative")).toBe(false);
    editor.choose("xy");
    editor.clickCell(3, 0);
    editor.cancel();
    const xy = editor.surface.regions[3];
    expect(editor.setRegionMode("relative")).toBe(true);
    editor.setSpeed("full");
    expect(byId(editor, xy.id)).toMatchObject({
      mode: "relative",
      speed: "full",
    });
    editor.choose("blank");
    editor.clickCell(8, 8);
    editor.cancel();
    expect(editor.setRegionMode("absolute")).toBe(false);
    for (const s of emitted) expect(wholeSurfaceValid(s)).toBe(true);
    // PLAY locks every setter and every typed field.
    editor.select(fader.id);
    editor.setMode("play");
    const locked = editor.surface;
    editor.setRegionMode("absolute");
    editor.setSpeed("half");
    editor.setSpring(false);
    editor.setOutput("cc");
    editor.setGroup(1);
    expect(editor.editNumber("min", "0")).toBe(false);
    expect(editor.surface).toBe(locked);
    let panel = inspector(editor);
    expect(panel).toMatch(/data-testid="field-mode"[^>]*disabled/);
    expect(panel).toMatch(/data-testid="field-min"[^>]*readonly/);
    editor.setMode("edit");

    // THE SHAPE HALF. The relative spring fader: Mode, Speed, Spring, its
    // value, Min and Max, the helpers; an absolute fader without Speed or
    // the spring value.
    panel = inspector(editor);
    for (const id of [
      "field-mode",
      "field-speed",
      "field-spring",
      "field-spring-value",
      "field-min",
      "field-max",
    ])
      expect(panel, id).toContain(`data-testid="${id}"`);
    expect(panel).toMatch(/data-testid="field-spring-value"[^>]*value="100"/);
    expect(panel).toMatch(/data-testid="field-min"[^>]*value="127"/);
    expect(panel).toMatch(/data-testid="field-max"[^>]*value="0"/);
    expect(panel).toContain(SPRING_HELPER);
    expect(panel).toContain("A Min above the Max inverts the direction.");
    expect(panel).toMatch(/data-testid="field-spring"[^>]*checked/);
    const plain = fresh().editor;
    plain.choose("fader");
    plain.clickCell(0, 0);
    const plainPanel = inspector(plain);
    expect(plainPanel).toContain('data-testid="field-mode"');
    expect(plainPanel).not.toContain('data-testid="field-speed"');
    expect(plainPanel).not.toContain('data-testid="field-spring-value"');
    expect(plainPanel).toContain(MODE_HELPER);
    // The button: Toggle (never Latch), Group with None and eight, Output,
    // the note field showing the name; under CC the controller field.
    editor.select(button.id);
    panel = inspector(editor);
    expect(panel).toContain('data-testid="field-toggle"');
    expect(panel).not.toContain("field-latch");
    expect(panel).toContain(TOGGLE);
    expect(panel).toContain(TOGGLE_HELPER);
    expect(panel).not.toContain("Latch");
    expect(panel).toContain('data-testid="field-group"');
    expect(count(panel, "Group ")).toBe(8);
    expect(panel).toContain(GROUP_HELPER);
    expect(panel).toContain('data-testid="field-output"');
    expect(panel).toMatch(/data-testid="field-note"[^>]*value="C4"/);
    expect(panel).not.toContain('data-testid="field-cc"');
    editor.setOutput("cc");
    panel = inspector(editor);
    expect(panel).toContain('data-testid="field-cc"');
    expect(panel).not.toContain('data-testid="field-note"');
    expect(panel).toContain(BUTTON_MIN_MAX_HELPER);
    // The knob: the four words; under a relative mode no Min or Max and the
    // helper that says so; under Absolute both fields.
    editor.select(knob.id);
    panel = inspector(editor);
    for (const word of Object.values(KNOB_MODE_WORDS))
      expect(panel).toContain(word);
    expect(panel).not.toContain('data-testid="field-min"');
    expect(panel).toContain(KNOB_RELATIVE_HELPER);
    editor.setRegionMode("absolute");
    panel = inspector(editor);
    expect(panel).toContain('data-testid="field-min"');
    expect(panel).toContain('data-testid="field-max"');
    expect(panel).not.toContain(KNOB_RELATIVE_HELPER);
    // The blank: no Behavior at all.
    editor.select(editor.surface.regions[4].id);
    expect(inspector(editor)).not.toContain("Behavior");
    // The copy never says Latch; the route wires the five callbacks.
    expect(code("src/lib/sandbox/copy.ts")).not.toContain("Latch");
    const route = code(ROUTE);
    for (const wire of [
      "onmode={(mode) => void editor?.setRegionMode(mode)}",
      "onspeed={(speed) => editor?.setSpeed(speed)}",
      "onspring={(spring) => editor?.setSpring(spring)}",
      "onoutput={(output) => editor?.setOutput(output)}",
      "ongroup={(group) => editor?.setGroup(group)}",
    ])
      expect(route, wire).toContain(wire);

    // THE SCHEMA: a record with every field reads; a word off the list is refused whole.
    const record = (extra: Record<string, unknown>) => ({
      schema: 1,
      id: "sandbox:s-2",
      name: "New",
      kind: "sandbox",
      source: "s-2",
      createdAt: "2026-09-18T00:00:00.000Z",
      editedAt: "2026-09-18T00:00:00.000Z",
      surface: {
        id: "s-2",
        name: "New",
        regions: [
          {
            id: "fader-1",
            name: "Filter",
            kind: "fader",
            col: 0,
            row: 0,
            w: 2,
            h: 6,
            cc: 1,
            channel: 1,
            colour: [13, 15, 7],
            ...extra,
          },
        ],
      },
    });
    expect(
      isStoredRecord(
        record({
          min: 127,
          max: 0,
          mode: "relative",
          speed: "full",
          spring: true,
          springValue: 100,
          output: "note",
          group: 8,
        }),
      ),
    ).toBe(true);
    expect(isStoredRecord(record({ mode: "sideways" }))).toBe(false);
    expect(isStoredRecord(record({ group: 9 }))).toBe(false);
    expect(isStoredRecord(record({ min: 128 }))).toBe(false);
    expect(isStoredRecord(record({ speed: "fast" }))).toBe(false);
  });

  it("13. an XY pad's Touches (change 11): a select 1 to 5 under Behavior with its helper, one entry, refused off the kind or the range with nothing recorded, refused with its line when a controller is too high for the count - and a controller typed too high for the count refused on its field - the select snapping back, locked in Play; the route wires it; a draft with the field reads and a count the controllers cannot carry is refused whole", () => {
    const { editor, emitted } = fresh();
    editor.choose("xy");
    editor.clickCell(3, 0);
    editor.cancel();
    const xy = editor.surface.regions[0];
    const placed = editor.state().depth;
    expect(xy).not.toHaveProperty("touches");
    // THE SELECT: 3 lands as one entry; 6 and 0 and a fraction are refused
    // with nothing recorded; a fader has no Touches.
    expect(editor.setTouches(3)).toBe(true);
    expect(byId(editor, xy.id).touches).toBe(3);
    expect(editor.state().depth).toBe(placed + 1);
    for (const bad of [6, 0, 2.5, -1])
      expect(editor.setTouches(bad), String(bad)).toBe(false);
    expect(editor.state().depth).toBe(placed + 1);
    expect(editor.state().touchesProblem).toBeUndefined();
    // THE CEILING, both doors. The pad's controllers are 1 and 2 by default:
    // 5 fingers need cc <= 119; a cc typed at 126 under 3 fingers (ceiling
    // 123) is refused on its field with the line, the model untouched; at
    // 123 it lands; then 5 fingers is refused on the select with the same
    // line, kept in the state until the next accepted edit.
    expect(byId(editor, xy.id).cc).toBe(1);
    expect(editor.editNumber("cc", "126")).toBe(false);
    expect(editor.fields.cc?.message).toBe(touchesCcRange(3, 123));
    expect(byId(editor, xy.id).cc).toBe(1);
    expect(editor.editNumber("cc", "123")).toBe(true);
    editor.commitField();
    expect(byId(editor, xy.id).cc).toBe(123);
    expect(editor.editNumber("cc2", "124")).toBe(false);
    expect(editor.fields.cc2?.message).toBe(touchesCcRange(3, 123));
    expect(editor.editNumber("cc2", "10")).toBe(true);
    editor.commitField();
    const before = editor.state().depth;
    expect(editor.setTouches(5)).toBe(false);
    expect(editor.state().touchesProblem).toBe(touchesCcRange(5, 119));
    expect(byId(editor, xy.id).touches, "the model kept 3").toBe(3);
    expect(editor.state().depth).toBe(before);
    expect(editor.setTouches(2)).toBe(true);
    expect(editor.state().touchesProblem).toBeUndefined();
    expect(byId(editor, xy.id).touches).toBe(2);
    expect(ccCeiling(2)).toBe(125);
    // Undo and redo, one entry each.
    editor.undo();
    expect(byId(editor, xy.id).touches).toBe(3);
    editor.redo();
    expect(byId(editor, xy.id).touches).toBe(2);
    // A fader: no Touches at all.
    editor.choose("fader");
    editor.clickCell(0, 0);
    editor.cancel();
    expect(editor.setTouches(2)).toBe(false);
    expect(byId(editor, editor.surface.regions[1].id)).not.toHaveProperty(
      "touches",
    );
    for (const s of emitted) expect(wholeSurfaceValid(s)).toBe(true);
    // PLAY locks it.
    editor.select(xy.id);
    editor.setMode("play");
    const locked = editor.surface;
    expect(editor.setTouches(4)).toBe(false);
    expect(editor.surface).toBe(locked);
    let panel = inspector(editor);
    expect(panel).toMatch(/data-testid="field-touches"[^>]*disabled/);
    editor.setMode("edit");
    // THE SHAPE: the select with five options and the helper under Behavior
    // on the pad; the problem line when the state carries one; none of it
    // on a fader; the flag word and the seventh column of the row.
    panel = inspector(editor);
    expect(panel).toContain('data-testid="field-touches"');
    expect(count(panel, "<option")).toBeGreaterThanOrEqual(5);
    expect(panel).toContain(TOUCHES);
    expect(panel).toContain(TOUCHES_HELPER);
    expect(panel).not.toContain('data-testid="touches-problem"');
    editor.setTouches(5);
    panel = inspector(editor);
    expect(panel).toContain('data-testid="touches-problem"');
    expect(panel).toContain(touchesCcRange(5, 119).replace("'", "&#39;"));
    expect(panel).toMatch(/data-testid="field-touches"[^>]*aria-describedby/);
    editor.select(editor.surface.regions[1].id);
    expect(inspector(editor)).not.toContain('data-testid="field-touches"');
    expect(flagsOf(byId(editor, xy.id)), "the flag word carries no count").toBe(
      0,
    );
    expect(seventhOf(byId(editor, xy.id))).toBe(10 + 128);
    // The route wires the sixth callback.
    expect(code(ROUTE)).toContain(
      "ontouches={(touches) => void editor?.setTouches(touches)}",
    );
    expect(code(`${UI}/RegionInspector.svelte`)).toContain(
      "const now = shared(touchesOf);",
    );
    // THE SCHEMA: the field reads at 1..5; 6, a fraction, and a count whose
    // last finger's pair passes 127 are refused whole; a button's is not read
    // against its controller.
    const record = (region: Record<string, unknown>) => ({
      schema: 1,
      id: "sandbox:s-3",
      name: "Pads",
      kind: "sandbox",
      source: "s-3",
      createdAt: "2026-09-18T00:00:00.000Z",
      editedAt: "2026-09-18T00:00:00.000Z",
      surface: {
        id: "s-3",
        name: "Pads",
        regions: [
          {
            id: "xy-1",
            name: "Space",
            kind: "xy",
            col: 3,
            row: 0,
            w: 3,
            h: 3,
            cc: 21,
            cc2: 22,
            channel: 1,
            colour: [13, 15, 7],
            ...region,
          },
        ],
      },
    });
    for (const touches of [1, 2, 3, 4, 5])
      expect(isStoredRecord(record({ touches })), String(touches)).toBe(true);
    expect(isStoredRecord(record({ touches: 6 }))).toBe(false);
    expect(isStoredRecord(record({ touches: 0 }))).toBe(false);
    expect(isStoredRecord(record({ touches: 2.5 }))).toBe(false);
    expect(isStoredRecord(record({ touches: 3, cc: 124 }))).toBe(false);
    expect(isStoredRecord(record({ touches: 3, cc2: 124 }))).toBe(false);
    expect(isStoredRecord(record({ touches: 3, cc: 123, cc2: 123 }))).toBe(
      true,
    );
    expect(isStoredRecord(record({ touches: 5, cc: 119, cc2: 119 }))).toBe(
      true,
    );
    expect(isStoredRecord(record({ touches: 5, cc: 120 }))).toBe(false);
    expect(
      isStoredRecord(record({ kind: "button", touches: 5, cc: 127 })),
      "the ceiling is the pad's",
    ).toBe(true);
  });

  it("14. the selection set (change 13A): Shift+click toggles, a plain click selects alone, the marquee selects what it touches and skips a locked element, Ctrl+A every unlocked one, Tab and Shift+Tab walk the surface's order and wrap, Escape clears; a group moves, nudges and deletes as one - refused whole where a member would overlap, leave the plate or is locked - one Undo re-selecting the set; a lock refuses a move, a resize and a delete and lets the fields edit", () => {
    const { editor, emitted } = fresh();
    editor.choose("button");
    editor.clickCell(0, 0);
    editor.clickCell(3, 0);
    editor.clickCell(6, 0);
    editor.choose("blank");
    editor.clickCell(0, 8);
    editor.cancel();
    const [a, b, c, blank] = editor.surface.regions;
    const depth = editor.history.depth;

    // SHIFT+CLICK toggles the held element in the set, in the order made; a
    // plain click selects alone; `selected` and `selectedId` are the one
    // region only while the set has one.
    expect(editor.clickCell(0, 0).kind).toBe("selected");
    expect(editor.clickCell(3, 0, true)).toEqual({
      kind: "selected",
      region: b,
    });
    expect(editor.selection).toEqual([a.id, b.id]);
    expect(editor.selectedId, "several: no one id").toBeUndefined();
    expect(editor.selected).toBeUndefined();
    expect(editor.selectedRegions.map((r) => r.id)).toEqual([a.id, b.id]);
    expect(editor.clickCell(0, 0, true)).toEqual({
      kind: "deselected",
      region: a,
    });
    expect(editor.selection).toEqual([b.id]);
    expect(editor.selectedId).toBe(b.id);
    editor.toggleSelect(c.id);
    editor.toggleSelect("nobody");
    expect(editor.selection).toEqual([b.id, c.id]);
    // Shift on an empty cell keeps the set (a marquee may follow); plain clears.
    expect(editor.clickCell(4, 4, true).kind).toBe("kept");
    expect(editor.selection).toEqual([b.id, c.id]);
    expect(editor.clickCell(4, 4).kind).toBe("cleared");
    expect(editor.selection).toEqual([]);
    expect(editor.history.depth, "selection is no entry").toBe(depth);
    // A state carries the set, its regions in the surface's order.
    editor.toggleSelect(c.id);
    editor.toggleSelect(a.id);
    const state = editor.state();
    expect(state.selection).toEqual([c.id, a.id]);
    expect(state.selectedRegions.map((r) => r.id)).toEqual([a.id, c.id]);
    expect(state.focus, "the focus is the set's origin").toEqual({
      col: 0,
      row: 0,
    });

    // THE MARQUEE selects what it TOUCHES: a box over one cell of the first
    // two buttons takes both and not the third; Shift adds; a box over
    // nothing clears; a locked element is skipped.
    expect(
      touching({ col: 1, row: 1, w: 3, h: 1 }, editor.surface.regions).map(
        (r) => r.id,
      ),
    ).toEqual([a.id, b.id]);
    expect(editor.selectTouching({ col: 1, row: 1, w: 3, h: 1 })).toBe(2);
    expect(editor.selection).toEqual([a.id, b.id]);
    expect(editor.selectTouching({ col: 7, row: 1, w: 1, h: 1 }, true)).toBe(1);
    expect(editor.selection).toEqual([a.id, b.id, c.id]);
    expect(editor.selectTouching({ col: 2, row: 4, w: 4, h: 3 })).toBe(0);
    expect(editor.selection).toEqual([]);
    editor.select(blank.id);
    expect(editor.toggleLock()).toEqual({ locked: true, count: 1 });
    expect(byId(editor, blank.id).locked).toBe(true);
    expect(editor.selectTouching({ col: 0, row: 0, w: 9, h: 9 })).toBe(3);
    expect(editor.selection, "the locked blank is skipped").toEqual([
      a.id,
      b.id,
      c.id,
    ]);
    // CTRL+A: every unlocked element.
    editor.select(undefined);
    editor.selectAll();
    expect(editor.selection).toEqual([a.id, b.id, c.id]);

    // A GROUP MOVES AS ONE: the drag's release puts the set's bounding box
    // origin at the cell, every member keeping its place; one entry; the
    // arrows nudge the set; a nudge that would leave the plate is refused
    // whole and nothing moved; a move onto the blank is refused whole with
    // section 16's line naming it.
    const before = editor.history.depth;
    expect(editor.moveSelectedTo({ col: 1, row: 2 })).toBeUndefined();
    expect(byId(editor, a.id)).toMatchObject({ col: 1, row: 2 });
    expect(byId(editor, b.id)).toMatchObject({ col: 4, row: 2 });
    expect(byId(editor, c.id)).toMatchObject({ col: 7, row: 2 });
    expect(editor.history.depth).toBe(before + 1);
    expect(editor.history.entries.at(-1)?.selection).toEqual([
      a.id,
      b.id,
      c.id,
    ]);
    expect(editor.focus).toEqual({ col: 1, row: 2 });
    expect(editor.nudgeSelected(0, 1)).toBeUndefined();
    expect(editor.nudgeSelected(0, 1)).toBeUndefined();
    editor.commitField();
    expect(editor.history.depth, "a held arrow is one entry").toBe(before + 2);
    expect(byId(editor, b.id)).toMatchObject({ col: 4, row: 4 });
    const held = editor.surface;
    expect(editor.nudgeSelected(1, 0)?.message).toBe(
      GEOMETRY_COPY.offSurface("w"),
    );
    expect(editor.surface, "refused whole: the same object").toBe(held);
    expect(editor.moveSelectedTo({ col: 0, row: 7 })?.message).toBe(
      "This region overlaps Blank 1. Choose another area or resize it.",
    );
    expect(editor.surface).toBe(held);
    expect(
      editor.resizeSelectedBy(1, 0),
      "a set does not resize",
    ).toBeUndefined();
    expect(editor.surface).toBe(held);
    // UNDO the nudge and the move: each one step, the set re-selected.
    editor.select(undefined);
    expect(editor.undo()).toBe(true);
    expect(editor.selection).toEqual([a.id, b.id, c.id]);
    expect(byId(editor, b.id)).toMatchObject({ col: 4, row: 2 });
    expect(editor.undo()).toBe(true);
    expect(byId(editor, b.id)).toMatchObject({ col: 3, row: 0 });
    expect(editor.redo()).toBe(true);
    expect(editor.redo()).toBe(true);
    expect(byId(editor, c.id)).toMatchObject({ col: 7, row: 4 });

    // THE GROUP DELETES AS ONE: one entry, undone as one with the set back.
    const total = editor.surface.regions.length;
    expect(editor.remove()).toEqual({ kind: "done", count: 3 });
    expect(editor.surface.regions.map((r) => r.id)).toEqual([blank.id]);
    expect(editor.selection).toEqual([]);
    expect(editor.remove(), "nothing selected").toEqual({ kind: "nothing" });
    expect(editor.undo()).toBe(true);
    expect(editor.surface.regions).toHaveLength(total);
    expect(editor.selection).toEqual([a.id, b.id, c.id]);

    // A LOCK refuses a move, a nudge, a resize and a delete with its line -
    // on a set, the first locked member's - and a locked element still takes
    // a field; Ctrl+L on a mixed set locks all, on an all-locked set unlocks.
    editor.select(a.id);
    expect(editor.toggleLock()).toEqual({ locked: true, count: 1 });
    expect(byId(editor, a.id).locked).toBe(true);
    expect(editor.history.entries.at(-1)?.kind).toBe("lock");
    const lockedSurface = editor.surface;
    expect(editor.moveSelectedTo({ col: 5, row: 5 })?.message).toBe(
      "Button 1 is locked. Unlock it to move or resize it.",
    );
    expect(editor.nudgeSelected(1, 0)?.message).toBe(
      "Button 1 is locked. Unlock it to move or resize it.",
    );
    expect(editor.resizeSelectedBy(1, 0)?.message).toBe(
      "Button 1 is locked. Unlock it to move or resize it.",
    );
    expect(editor.resizeSelectedTo({ col: 1, row: 2, w: 3, h: 2 })?.rule).toBe(
      "locked",
    );
    expect(editor.remove()).toEqual({
      kind: "refused",
      message: "Button 1 is locked. Unlock it to delete it.",
    });
    expect(editor.surface, "nothing moved").toBe(lockedSurface);
    expect(editor.editNumber("channel", "5")).toBe(true);
    expect(byId(editor, a.id).channel).toBe(5);
    editor.toggleSelect(b.id);
    expect(editor.nudgeSelected(0, 1)?.message).toContain("Button 1 is locked");
    expect(editor.toggleLock(), "a mixed set locks all").toEqual({
      locked: true,
      count: 2,
    });
    expect(byId(editor, b.id).locked).toBe(true);
    expect(editor.toggleLock(), "an all-locked set unlocks").toEqual({
      locked: false,
      count: 2,
    });
    expect(byId(editor, a.id), "off is no field").not.toHaveProperty("locked");
    expect(byId(editor, b.id)).not.toHaveProperty("locked");
    editor.setLocked(true);
    expect(byId(editor, a.id).locked).toBe(true);
    editor.setLocked(false);
    expect(byId(editor, a.id)).not.toHaveProperty("locked");
    expect(lockedOf(byId(editor, a.id))).toBe(false);
    editor.setMode("play");
    expect(editor.toggleLock()).toBeUndefined();
    editor.setMode("edit");

    // TAB walks the surface's order from the LAST of the set, wraps, and
    // selects alone; Shift+Tab walks back from the FIRST; nothing selected
    // starts at the first (or the last); Escape clears - and Escape with a
    // kind armed only disarms.
    editor.select(undefined);
    expect(editor.selectNext(1)).toBe(true);
    expect(editor.selection).toEqual([a.id]);
    editor.selectNext(1);
    editor.selectNext(1);
    expect(editor.selection).toEqual([c.id]);
    editor.selectNext(1);
    expect(editor.selection).toEqual([blank.id]);
    editor.selectNext(1);
    expect(editor.selection, "wraps").toEqual([a.id]);
    editor.selectNext(-1);
    expect(editor.selection).toEqual([blank.id]);
    editor.select(undefined);
    editor.selectNext(-1);
    expect(editor.selection, "back from nothing: the last").toEqual([blank.id]);
    editor.toggleSelect(b.id);
    editor.selectNext(1);
    expect(editor.selection, "forward from the set's last").toEqual([c.id]);
    editor.toggleSelect(a.id);
    editor.selectNext(-1);
    expect(editor.selection, "back from the set's first").toEqual([b.id]);
    editor.escape();
    expect(editor.selection).toEqual([]);
    editor.select(a.id);
    editor.choose("knob");
    editor.escape();
    expect(editor.placement).toEqual({ kind: "idle" });
    expect(editor.selection, "armed: Escape disarms and keeps").toEqual([a.id]);
    expect(fresh().editor.selectNext(1), "no element").toBe(false);
    // Play: no marquee.
    editor.setMode("play");
    expect(editor.selectTouching({ col: 0, row: 0, w: 9, h: 9 })).toBe(0);
    editor.setMode("edit");
    for (const s of emitted) expect(wholeSurfaceValid(s)).toBe(true);
    for (const entry of editor.history.entries) {
      expect(wholeSurfaceValid(entry.before)).toBe(true);
      expect(wholeSurfaceValid(entry.after)).toBe(true);
    }
    // THE SHAPE HALF. The plate over a set: one selection group, a member
    // outline per member, ONE group outline round the bounding box, no
    // handle and one delete icon (it deletes the set); over a single every
    // handle and no group outline; over a locked single the lock glyph, no
    // handle, no delete icon; the list marks every member aria-pressed and
    // the one selected row aria-current; the plate's source wires the
    // marquee, Tab and the Shift click, and draws no rounded corner.
    editor.select(a.id);
    editor.toggleSelect(c.id);
    let html = plate(editor.state());
    expect(count(html, 'data-testid="surface-selection"')).toBe(1);
    expect(count(html, 'data-testid="surface-member"')).toBe(2);
    expect(count(html, 'data-testid="surface-group"')).toBe(1);
    {
      const left = byId(editor, a.id);
      const right = byId(editor, c.id);
      const pitch = 571 / 9;
      expect(html).toMatch(
        new RegExp(
          `data-testid="surface-group" x="${left.col * pitch}" y="${left.row * pitch}" width="${(right.col + right.w - left.col) * pitch}"`,
        ),
      );
    }
    expect(count(html, 'data-testid="surface-handle"')).toBe(0);
    expect(count(html, 'data-testid="surface-delete"')).toBe(1);
    expect(html).toContain("2 elements selected.");
    let rows = list(editor.state());
    expect(count(rows, 'aria-pressed="true"')).toBe(2);
    expect(count(rows, 'aria-current="true"')).toBe(0);
    editor.select(b.id);
    html = plate(editor.state());
    expect(count(html, 'data-testid="surface-handle"')).toBe(8);
    expect(count(html, 'data-testid="surface-group"')).toBe(0);
    expect(count(html, 'data-testid="surface-lock"'), "the blank's glyph").toBe(
      1,
    );
    rows = list(editor.state());
    expect(count(rows, 'aria-pressed="true"')).toBe(1);
    expect(rows).toMatch(
      new RegExp(
        `data-row="${b.id}"[^>]*aria-current="true"[^>]*aria-pressed="true"`,
      ),
    );
    editor.toggleLock();
    html = plate(editor.state());
    expect(
      count(html, 'data-testid="surface-lock"'),
      "the blank's and Button 2's",
    ).toBe(2);
    expect(count(html, 'data-testid="surface-handle"')).toBe(0);
    expect(count(html, 'data-testid="surface-delete"')).toBe(0);
    expect(count(html, 'data-testid="surface-member"')).toBe(1);
    editor.toggleLock();
    const source = code(`${UI}/SurfaceEditor.svelte`);
    expect(source).toContain("marquee = { from: at, add: shift }");
    expect(source).toContain("onmarquee?.(box, m.add)");
    expect(source).toContain('data-testid="surface-marquee"');
    expect(source).toContain('if (event.key === "Tab")');
    expect(source).toContain("onselectnext?.(event.shiftKey ? -1 : 1)");
    expect(source).toContain(
      "if (m?.deferred) onclick(m.at.col, m.at.row, false, false)",
    );
    expect(source, "no rounded corner (D-01)").not.toContain("border-radius");
    expect(source).not.toMatch(/(^|\s)r[xy]=/m);
    const rowsSource = code(`${UI}/ElementList.svelte`);
    expect(rowsSource).toContain(
      "aria-pressed={selection.includes(region.id)}",
    );
    const route = code(ROUTE);
    for (const wire of [
      'key === "c"',
      'key === "x"',
      'key === "v"',
      'key === "d"',
      'key === "a"',
      'key === "l"',
      "editor.escape()",
      "onmarquee={(box, add) => void editor?.selectTouching(box, add)}",
      "onselectnext={(step) => void editor?.selectNext(step)}",
      "shift ? editor?.toggleSelect(id) : editor?.select(id)",
      "writeClipboard(sessionStore(), content)",
      "readClipboard(sessionStore())",
    ])
      expect(route, wire).toContain(wire);
    expect(route, "Ctrl and Cmd alike").toContain(
      "event.ctrlKey || event.metaKey",
    );

    // The bounding box and the schema's field.
    expect(boundingBox([])).toBeUndefined();
    expect(
      boundingBox([
        { col: 1, row: 2, w: 2, h: 2 },
        { col: 4, row: 0, w: 1, h: 5 },
      ]),
    ).toEqual({ col: 1, row: 0, w: 4, h: 5 });
    const record = (extra: Record<string, unknown>) => ({
      schema: 1,
      id: "sandbox:s-4",
      name: "Locked",
      kind: "sandbox",
      source: "s-4",
      createdAt: "2026-09-20T00:00:00.000Z",
      editedAt: "2026-09-20T00:00:00.000Z",
      surface: {
        id: "s-4",
        name: "Locked",
        regions: [{ ...blank, ...extra }],
      },
    });
    expect(isStoredRecord(record({ locked: true }))).toBe(true);
    expect(isStoredRecord(record({ locked: undefined }))).toBe(true);
    expect(isStoredRecord(record({ locked: "yes" }))).toBe(false);
  });

  it("15. the clipboard (change 13A): Ctrl+C takes the set as clones, Ctrl+X cuts as one entry, Ctrl+V lands a single element at the focus cell if free, else one cell down-right of the original, else the first free spot in reading order, a group keeping its layout the same way, every pasted element keeping its settings and colour with an auto-numbered name; refused without a number when nothing fits or the cap would be passed; Ctrl+D duplicates by the same rule; the clipboard lives in memory and the session store", () => {
    const { editor, emitted } = fresh();
    editor.choose("fader");
    editor.clickCell(0, 0);
    editor.cancel();
    const fader = editor.surface.regions[0];
    editor.editNumber("channel", "7");
    editor.commitField();
    editor.setColour([15, 0, 0]);
    editor.setRegionMode("relative");

    // THE NAMING RULE, one function: the lowest free number per kind label.
    expect(autoName("fader", editor.surface.regions)).toBe("Fader 2");
    expect(autoName("button", editor.surface.regions)).toBe("Button 1");
    expect(
      autoName("fader", [
        { ...fader, name: "Fader 1" },
        { ...fader, id: "x", name: "Fader 3" },
      ]),
    ).toBe("Fader 2");
    expect(autoName("fader", [])).toBe("Fader 1");

    // COPY: clones in the surface's order; nothing selected is nothing.
    const content = editor.copySelection();
    expect(content?.regions).toHaveLength(1);
    expect(content?.regions[0]).toEqual(byId(editor, fader.id));
    expect(content?.regions[0], "a clone, not the region").not.toBe(
      byId(editor, fader.id),
    );
    editor.select(undefined);
    expect(editor.copySelection()).toBeUndefined();
    expect(editor.paste(undefined)).toEqual({ kind: "nothing" });

    // PASTE: the focus cell is the fader's own origin (selected), so not
    // free; one cell down-right of the original, (1, 1), is under the
    // original too (a two-wide element covers its own down-right cell - only
    // a one-cell element ever lands there); so the first free origin in
    // reading order, (2, 0). The paste keeps the channel, the colour and the
    // mode, takes Fader 2, is selected, and is one entry.
    editor.select(fader.id);
    const depth = editor.history.depth;
    expect(editor.paste(content)).toEqual({ kind: "done", count: 1 });
    const pasted = editor.surface.regions[1];
    expect(pasted).toMatchObject({
      name: "Fader 2",
      kind: "fader",
      col: 2,
      row: 0,
      w: 2,
      h: 6,
      channel: 7,
      colour: [15, 0, 0],
      mode: "relative",
      cc: fader.cc,
    });
    expect(pasted.id).not.toBe(fader.id);
    expect(editor.selection).toEqual([pasted.id]);
    expect(editor.history.depth).toBe(depth + 1);
    expect(editor.history.entries.at(-1)?.kind).toBe("paste");
    expect(editor.focus).toEqual({ col: 2, row: 0 });
    // At a FREE focus cell the paste lands there.
    editor.setFocus({ col: 6, row: 2 });
    expect(editor.paste(content).kind).toBe("done");
    expect(editor.surface.regions[2]).toMatchObject({
      name: "Fader 3",
      col: 6,
      row: 2,
    });
    // Neither the focus nor down-right free: the first free origin in
    // reading order - (4, 0), the first whose 2 x 6 covers only free cells.
    editor.select(fader.id);
    expect(editor.paste(content).kind).toBe("done");
    expect(editor.surface.regions[3]).toMatchObject({
      name: "Fader 4",
      col: 4,
      row: 0,
    });
    // The placement rule, on the pure function: a one-cell box at a free
    // anchor; at a held anchor one cell down-right of its own origin; with
    // that held too the first free cell in reading order; a two-cell box at
    // a free anchor; a box nothing fits; no box.
    const built = buildCellMap(editor.surface.regions);
    const map = built.ok ? built.map : [];
    const cell = [{ col: 0, row: 0, w: 1, h: 1 }];
    expect(placementFor(cell, { col: 8, row: 8 }, map)).toEqual({
      col: 8,
      row: 8,
    });
    expect(
      placementFor([{ col: 7, row: 7, w: 1, h: 1 }], { col: 0, row: 0 }, map),
    ).toEqual({ col: 8, row: 8 });
    expect(placementFor(cell, { col: 0, row: 0 }, map)).toEqual({
      col: 6,
      row: 0,
    });
    expect(
      placementFor([{ col: 0, row: 0, w: 2, h: 2 }], { col: 0, row: 6 }, map),
    ).toEqual({ col: 0, row: 6 });
    expect(
      placementFor([{ col: 0, row: 0, w: 9, h: 9 }], { col: 0, row: 0 }, map),
    ).toBeUndefined();
    expect(placementFor([], { col: 0, row: 0 }, map)).toBeUndefined();

    // CUT: the content taken, the deletion one entry under `cut`, Undo
    // brings the set back; a paste after the cut lands where it was (the
    // focus cell is free now).
    editor.select(editor.surface.regions[3].id);
    const cutContent = editor.copySelection();
    expect(editor.remove("cut")).toEqual({ kind: "done", count: 1 });
    expect(editor.history.entries.at(-1)?.kind).toBe("cut");
    expect(editor.surface.regions).toHaveLength(3);
    expect(editor.focus).toEqual({ col: 4, row: 0 });
    expect(editor.paste(cutContent).kind).toBe("done");
    expect(editor.surface.regions[3]).toMatchObject({
      name: "Fader 4",
      col: 4,
      row: 0,
    });

    // A GROUP keeps its relative layout: with Fader 3 and Fader 4 gone, the
    // pair at (0,0) and (2,0) pasted with the focus at (5, 2) lands at (5,2)
    // and (7,2); then, with nothing free for the pair, the paste is refused
    // with a line that carries no number and nothing lands.
    editor.select(editor.surface.regions[3].id);
    editor.toggleSelect(editor.surface.regions[2].id);
    expect(editor.remove().kind).toBe("done");
    editor.select(fader.id);
    editor.toggleSelect(pasted.id);
    const pair = editor.copySelection();
    expect(pair?.regions.map((r) => r.name)).toEqual(["Fader 1", "Fader 2"]);
    editor.setFocus({ col: 5, row: 2 });
    expect(editor.paste(pair)).toEqual({ kind: "done", count: 2 });
    expect(editor.surface.regions.slice(-2)).toMatchObject([
      { name: "Fader 3", col: 5, row: 2 },
      { name: "Fader 4", col: 7, row: 2 },
    ]);
    expect(editor.selection).toEqual(
      editor.surface.regions.slice(-2).map((r) => r.id),
    );
    const full = editor.surface;
    const fullDepth = editor.history.depth;
    expect(editor.paste(pair)).toEqual({
      kind: "refused",
      message: PASTE_NO_SPACE,
    });
    expect(editor.surface).toBe(full);
    expect(editor.history.depth).toBe(fullDepth);
    expect(PASTE_NO_SPACE).not.toMatch(/[0-9]/);
    expect(PASTE_AT_CAP).not.toMatch(/[0-9]/);
    expect(NOTHING_TO_PASTE).not.toMatch(/[0-9]/);
    // THE CAP: a surface at fifteen refuses a paste of two with the cap's line.
    const capped = fresh().editor;
    capped.choose("blank");
    for (let i = 0; i < SURFACE_ELEMENT_CAP - 1; i += 1)
      capped.clickCell(i % 9, Math.floor(i / 9));
    capped.cancel();
    capped.select(capped.surface.regions[0].id);
    capped.toggleSelect(capped.surface.regions[1].id);
    const two = capped.copySelection();
    expect(capped.paste(two)).toEqual({
      kind: "refused",
      message: PASTE_AT_CAP,
    });
    expect(capped.surface.regions).toHaveLength(SURFACE_ELEMENT_CAP - 1);
    capped.select(capped.surface.regions[0].id);
    expect(capped.paste(capped.copySelection()).kind, "one fits").toBe("done");
    expect(capped.surface.regions).toHaveLength(SURFACE_ELEMENT_CAP);
    expect(capped.duplicate()).toEqual({ ok: false, reason: "cap" });

    // DUPLICATE (Ctrl+D, the panel's button) is the same rule on the set:
    // the focus is the originals' origin and their down-right cell is
    // theirs, so the pair lands at the first free origin in reading order,
    // (0, 2), its layout kept; the copies auto-named and selected, one entry.
    const dup = fresh().editor;
    dup.choose("button");
    dup.clickCell(0, 0);
    dup.clickCell(3, 0);
    dup.cancel();
    dup.select(dup.surface.regions[0].id);
    dup.toggleSelect(dup.surface.regions[1].id);
    const result = dup.duplicate();
    expect(result.ok).toBe(true);
    expect(dup.surface.regions.slice(2)).toMatchObject([
      { name: "Button 3", col: 0, row: 2 },
      { name: "Button 4", col: 3, row: 2 },
    ]);
    expect(dup.selection).toEqual(
      dup.surface.regions.slice(2).map((r) => r.id),
    );
    expect(dup.history.entries.at(-1)?.kind).toBe("duplicate");
    expect(dup.undo()).toBe(true);
    expect(dup.surface.regions).toHaveLength(2);
    expect(dup.selection, "the copies are gone, nothing is selected").toEqual(
      [],
    );
    expect(dup.redo()).toBe(true);
    expect(dup.selection, "redo re-selects the copies").toEqual(
      dup.surface.regions.slice(2).map((r) => r.id),
    );
    dup.undo();
    // Play: nothing lands.
    dup.setMode("play");
    expect(dup.paste(pair)).toEqual({ kind: "nothing" });
    expect(dup.duplicate()).toEqual({ ok: false, reason: "no-space" });
    dup.setMode("edit");
    for (const s of emitted) expect(wholeSurfaceValid(s)).toBe(true);

    // THE CLIPBOARD'S HOME: memory first, the session store beside it; a
    // fresh reader (memory cleared) reads the store back; a foreign value
    // under the key reads as empty; no store is memory alone.
    clearClipboard();
    const backing = new Map<string, string>();
    const store = {
      getItem: (k: string) => backing.get(k) ?? null,
      setItem: (k: string, v: string) => void backing.set(k, v),
      removeItem: (k: string) => void backing.delete(k),
    };
    const held = pair as ClipboardContent;
    expect(readClipboard(store)).toBeUndefined();
    writeClipboard(store, held);
    expect(readClipboard(store)).toEqual(held);
    expect(CLIPBOARD_KEY).toBe("hangar:sandbox-clipboard");
    expect(backing.has(CLIPBOARD_KEY)).toBe(true);
    clearClipboard();
    expect(readClipboard(store)).toEqual(held);
    backing.set(CLIPBOARD_KEY, JSON.stringify({ regions: [{ id: 1 }] }));
    clearClipboard();
    expect(readClipboard(store)).toBeUndefined();
    backing.set(CLIPBOARD_KEY, "{not json");
    expect(readClipboard(store)).toBeUndefined();
    expect(isClipboardContent({ regions: [] }), "empty is nothing").toBe(false);
    writeClipboard(undefined, held);
    expect(readClipboard(undefined)).toEqual(held);
    clearClipboard();
    expect(readClipboard(undefined)).toBeUndefined();
  });

  it("16. multi-edit (change 13A): over a set the numeric fields show the shared value or Mixed, a typed value or a select writes every member under one entry re-selecting the set on Undo, a refusal on any member refuses the whole edit with its line, the kind-specific setters apply only when every member is the kind, the name is single-selection only, and `locked` never reaches a row", () => {
    const { editor, emitted } = fresh();
    editor.choose("fader");
    editor.clickCell(0, 0);
    editor.clickCell(3, 0);
    editor.choose("button");
    editor.clickCell(6, 0);
    editor.cancel();
    const [f1, f2, button] = editor.surface.regions;
    editor.select(f1.id);
    editor.editNumber("channel", "3");
    editor.commitField();
    editor.editNumber("min", "10");
    editor.commitField();

    // MIXED: channel differs (3 and 1), min differs, max agrees (127), cc
    // differs (and with it the note, which is the cc read as a name).
    editor.toggleSelect(f2.id);
    const state = editor.state();
    expect(state.mixed).toEqual(["cc", "channel", "min", "note"]);
    expect(state.texts.channel).toBe("");
    expect(state.texts.max).toBe("127");
    expect(editor.fieldText("min")).toBe("");
    // A TYPED VALUE writes every member as one entry; Undo takes both back
    // and re-selects the set.
    const depth = editor.history.depth;
    expect(editor.editNumber("channel", "9")).toBe(true);
    expect(byId(editor, f1.id).channel).toBe(9);
    expect(byId(editor, f2.id).channel).toBe(9);
    expect(editor.history.depth).toBe(depth + 1);
    expect(editor.history.entries.at(-1)?.selection).toEqual([f1.id, f2.id]);
    expect(editor.state().mixed).toEqual(["cc", "min", "note"]);
    expect(editor.state().texts.channel).toBe("9");
    editor.editNumber("channel", "10");
    expect(editor.history.depth, "keystrokes coalesce over the set").toBe(
      depth + 1,
    );
    editor.commitField();
    editor.select(undefined);
    expect(editor.undo()).toBe(true);
    expect(editor.selection).toEqual([f1.id, f2.id]);
    expect(byId(editor, f1.id).channel).toBe(3);
    expect(byId(editor, f2.id).channel).toBe(1);
    // A REFUSAL ON ANY MEMBER refuses the whole edit with its line: the
    // second fader made one column wide, both turned horizontal - the first
    // could turn, the second is under its minimum, so neither turns and the
    // line is the second's.
    editor.select(f2.id);
    expect(
      editor.resizeSelectedTo({ col: 3, row: 0, w: 1, h: 6 }),
    ).toBeUndefined();
    editor.select(f1.id);
    editor.toggleSelect(f2.id);
    const held = editor.surface;
    expect(editor.setOrientation("horizontal")).toBe(false);
    expect(editor.state().orientationProblem).toBe(
      "A horizontal fader needs at least 2 columns.",
    );
    expect(editor.surface).toBe(held);
    expect(byId(editor, f1.id).orientation).toBe("vertical");
    // The options over the set: mode and speed on both faders; spring; a
    // recolour; each one entry.
    const before = editor.history.depth;
    expect(editor.setRegionMode("relative")).toBe(true);
    editor.setSpeed("full");
    editor.setSpring(true);
    editor.setColour([0, 15, 15]);
    expect(editor.history.depth).toBe(before + 4);
    for (const id of [f1.id, f2.id])
      expect(byId(editor, id)).toMatchObject({
        mode: "relative",
        speed: "full",
        spring: true,
        colour: [0, 15, 15],
      });
    // KIND-SPECIFIC setters apply only when every member is the kind: with
    // the button in the set a fader's mode, spring and orientation, and a
    // button's toggle, output and group, all refuse with nothing recorded;
    // channel, min, max and colour still write all three.
    editor.toggleSelect(button.id);
    const mixedDepth = editor.history.depth;
    expect(editor.setRegionMode("absolute")).toBe(false);
    expect(editor.setOrientation("vertical")).toBe(false);
    editor.setSpring(false);
    editor.setSpeed("half");
    editor.setLatch(true);
    editor.setOutput("note");
    editor.setGroup(2);
    expect(editor.setTouches(2)).toBe(false);
    expect(editor.history.depth).toBe(mixedDepth);
    expect(byId(editor, button.id)).not.toHaveProperty("group");
    expect(editor.editNumber("max", "100")).toBe(true);
    editor.commitField();
    for (const id of [f1.id, f2.id, button.id])
      expect(byId(editor, id).max).toBe(100);
    expect(editor.history.depth).toBe(mixedDepth + 1);
    // THE NAME is single-selection only.
    editor.rename("Group");
    expect(editor.history.depth).toBe(mixedDepth + 1);
    expect(byId(editor, f1.id).name).toBe("Fader 1");
    // A note over two buttons: both take C4; a cc ceiling over two pads
    // reads every member's count.
    editor.choose("button");
    editor.clickCell(6, 3);
    editor.cancel();
    const b2 = editor.surface.regions[3];
    editor.select(button.id);
    editor.toggleSelect(b2.id);
    editor.setOutput("note");
    expect(editor.editNumber("note", "C4")).toBe(true);
    expect(byId(editor, button.id).cc).toBe(60);
    expect(byId(editor, b2.id).cc).toBe(60);
    editor.choose("xy");
    editor.clickCell(0, 6);
    editor.clickCell(3, 6);
    editor.cancel();
    const [p1, p2] = editor.surface.regions.slice(4);
    editor.select(p1.id);
    editor.setTouches(3);
    editor.select(p1.id);
    editor.toggleSelect(p2.id);
    expect(editor.editNumber("cc", "125")).toBe(false);
    expect(editor.fields.cc?.message).toBe(touchesCcRange(3, 123));
    expect(editor.setTouches(2)).toBe(true);
    expect(byId(editor, p2.id).touches).toBe(2);
    for (const s of emitted) expect(wholeSurfaceValid(s)).toBe(true);

    // `locked` NEVER REACHES A ROW: the emitter's row and tail of a locked
    // region are byte-identical to the unlocked one's.
    const locked = { ...byId(editor, f1.id), locked: true };
    expect(regionRow(locked)).toEqual(regionRow(byId(editor, f1.id)));
    expect(regionTail(locked)).toEqual(regionTail(byId(editor, f1.id)));

    // THE SHAPE HALF. The inspector over the two faders: the eyebrow says
    // SELECTED ELEMENTS / FADER, the headline the count, the lede, no name
    // field, the Mixed placeholder on cc... no, cc is single-only: on min
    // (the two differ) and none on max (they agree), the Mode select on both
    // with no blank option (they agree), the delete reading the count, the
    // Locked checkbox unmixed; over a fader and a button the type reads
    // Mixed, no Behavior, and channel / min / max stay; a mixed spring is a
    // mixed checkbox; a mixed orientation a blank option; a mixed colour says so.
    editor.select(f1.id);
    editor.toggleSelect(f2.id);
    editor.editNumber("min", "20");
    editor.commitField();
    editor.select(f1.id);
    editor.editNumber("min", "10");
    editor.commitField();
    editor.setSpring(false);
    editor.setColour([15, 0, 0]);
    editor.toggleSelect(f2.id);
    let panel = inspector(editor);
    expect(panel).toContain("SELECTED ELEMENTS / FADER");
    expect(panel).toContain('data-testid="inspector-count">2 elements<');
    expect(panel).toContain(MULTI_LEDE);
    expect(panel).not.toContain('data-testid="field-name"');
    expect(panel).not.toContain('data-testid="field-cc"');
    expect(panel).not.toContain('data-testid="inspector-units"');
    expect(panel).toMatch(
      /data-testid="field-min"[^>]*value=""[^>]*placeholder="Mixed"[^>]*data-mixed="true"/,
    );
    expect(panel).toMatch(/data-testid="field-max"[^>]*value="100"/);
    expect(panel).not.toMatch(/data-testid="field-max"[^>]*placeholder/);
    expect(panel).toContain('data-testid="field-mode"');
    expect(panel).not.toContain('<option value="" disabled');
    expect(panel).toMatch(
      /data-testid="field-spring"[^>]*aria-checked="mixed"[^>]*data-mixed="true"/,
    );
    expect(panel).toContain('data-testid="colour-mixed"');
    expect(panel).toMatch(/data-testid="field-locked"[^>]*\/>/);
    expect(panel).not.toMatch(/data-testid="field-locked"[^>]*aria-checked/);
    expect(panel).toContain(">Delete 2 elements<");
    expect(panel).toContain(LOCKED_HELPER);
    // A mixed orientation: the blank option, selected and disabled.
    editor.select(f2.id);
    editor.resizeSelectedTo({ col: 3, row: 0, w: 2, h: 6 });
    editor.setOrientation("horizontal");
    editor.toggleSelect(f1.id);
    panel = inspector(editor);
    expect(panel).toMatch(
      /data-testid="field-orientation"[^>]*>(?:<!--[^>]*-->)*<option value="" disabled="" selected="">Mixed<\/option>/,
    );
    // A fader and a button: the type reads Mixed, no Behavior, the shared MIDI fields stay.
    editor.select(f1.id);
    editor.toggleSelect(button.id);
    panel = inspector(editor);
    expect(panel).toContain("SELECTED ELEMENTS / MIXED");
    expect(panel).toMatch(
      /data-testid="field-kind" data-kind="mixed"[^>]*>Mixed</,
    );
    expect(panel).not.toContain(">Behavior<");
    expect(panel).toContain('data-testid="field-channel"');
    expect(panel).toContain('data-testid="field-min"');
    expect(panel).not.toContain('data-testid="field-orientation"');
    // A single: the eyebrow and the name as before, Locked unchecked, then checked.
    editor.select(f1.id);
    panel = inspector(editor);
    expect(panel).toContain("SELECTED ELEMENT / FADER");
    expect(panel).toContain('data-testid="inspector-name">Fader 1<');
    expect(panel).not.toMatch(/data-testid="field-locked"[^>]*checked/);
    editor.toggleLock();
    panel = inspector(editor);
    expect(panel).toMatch(/data-testid="field-locked"[^>]*checked/);
    expect(panel).toContain(">Delete element<");
    // The route wires the lock.
    expect(code(ROUTE)).toContain(
      "onlocked={(locked) => editor?.setLocked(locked)}",
    );
    expect(
      code(`${UI}/RegionInspector.svelte`),
      "no rounded corner",
    ).not.toMatch(/border-radius:\s*[1-9]/);
  });

  it("17. align and distribute (change 13B): the six alignments move every member to the set's edge or centre line with sizes kept, spacing out shares the free cells as equal gaps with the remainder to the first gaps and the outer two fixed, each one entry re-selecting the set on Undo; refused whole with the first line where a member would overlap or is locked, with its own line when there is no room; nothing under two, or three for spacing, or in Play", () => {
    const { editor, emitted } = fresh();
    editor.choose("button");
    editor.clickCell(0, 0);
    editor.clickCell(2, 3);
    editor.cancel();
    // A 1 x 1 blank as the third: a smaller member shows the far-edge and the centre arithmetic.
    editor.choose("blank");
    editor.clickCell(7, 6);
    editor.cancel();
    const [b1, b2, blank] = editor.surface.regions;
    const boxes = () => editor.surface.regions.map(boxOf);
    const start = boxes();
    editor.select(b1.id);
    editor.toggleSelect(b2.id);
    editor.toggleSelect(blank.id);
    const set = [b1.id, b2.id, blank.id];

    // THE PURE FUNCTION: the bounding box is (0, 0) 8 x 7. Left puts every
    // column at 0, right every far edge at 8 (a 2-wide at 6, the blank at 7),
    // top every row at 0, bottom every far edge at 7; the centres floor a
    // half cell toward the left or the top: (8 - 2) / 2 = 3, (8 - 1) / 2 = 3;
    // (7 - 2) / 2 = 2, (7 - 1) / 2 = 3. Sizes never move.
    expect(alignBoxes(start, "left").map((b) => b.col)).toEqual([0, 0, 0]);
    expect(alignBoxes(start, "right").map((b) => b.col)).toEqual([6, 6, 7]);
    expect(alignBoxes(start, "top").map((b) => b.row)).toEqual([0, 0, 0]);
    expect(alignBoxes(start, "bottom").map((b) => b.row)).toEqual([5, 5, 6]);
    expect(alignBoxes(start, "centre-x").map((b) => b.col)).toEqual([3, 3, 3]);
    expect(alignBoxes(start, "centre-y").map((b) => b.row)).toEqual([2, 2, 3]);
    expect(alignBoxes(start, "right").map((b) => [b.w, b.h])).toEqual(
      start.map((b) => [b.w, b.h]),
    );
    expect(alignBoxes([], "left")).toEqual([]);
    // SPACING OUT horizontally: the span from the first's near edge (0) to
    // the last's far edge (8) is 8, the widths sum to 5, three free cells
    // over two gaps - 2 then 1 - so the middle lands at column 4 and the
    // outer two stay. Vertically: rows 0..7, heights 5, free 2, gaps 1 and
    // 1: the middle at row 3. Fewer than three come back as they are; wider
    // than the span is undefined.
    expect(distributeBoxes(start, "horizontal")?.map((b) => b.col)).toEqual([
      0, 4, 7,
    ]);
    expect(distributeBoxes(start, "vertical")?.map((b) => b.row)).toEqual([
      0, 3, 6,
    ]);
    expect(distributeBoxes(start.slice(0, 2), "horizontal")).toEqual(
      start.slice(0, 2),
    );
    expect(
      distributeBoxes(
        [
          { col: 0, row: 0, w: 3, h: 1 },
          { col: 1, row: 2, w: 3, h: 1 },
          { col: 2, row: 4, w: 3, h: 1 },
        ],
        "horizontal",
      ),
    ).toBeUndefined();

    // THROUGH THE EDITOR: align left is one entry under `align`, every
    // member at column 0, sizes kept, the set still selected; Undo takes
    // all three back and re-selects the set.
    const depth = editor.history.depth;
    expect(editor.alignSelected("left")).toEqual({ kind: "done", count: 3 });
    expect(boxes().map((b) => b.col)).toEqual([0, 0, 0]);
    expect(boxes().map((b) => [b.w, b.h])).toEqual([
      [2, 2],
      [2, 2],
      [1, 1],
    ]);
    expect(editor.history.depth).toBe(depth + 1);
    expect(editor.history.entries.at(-1)?.kind).toBe("align");
    expect(editor.selection).toEqual(set);
    expect(editor.alignSelected("left"), "already aligned: nothing").toEqual({
      kind: "nothing",
    });
    expect(editor.history.depth).toBe(depth + 1);
    editor.select(undefined);
    expect(editor.undo()).toBe(true);
    expect(boxes()).toEqual(start);
    expect(editor.selection).toEqual(set);
    // Space out horizontally: one entry under `distribute`, the middle at 4.
    expect(editor.distributeSelected("horizontal")).toEqual({
      kind: "done",
      count: 3,
    });
    expect(boxes().map((b) => b.col)).toEqual([0, 4, 7]);
    expect(editor.history.entries.at(-1)?.kind).toBe("distribute");
    expect(editor.undo()).toBe(true);
    expect(boxes()).toEqual(start);
    // REFUSED WHOLE: with a bystander at (2, 0), align top would put the
    // second button on it - the first line is the overlap's, naming the
    // bystander, and the surface is the same object.
    editor.choose("button");
    editor.clickCell(2, 0);
    editor.cancel();
    editor.select(b1.id);
    editor.toggleSelect(b2.id);
    const held = editor.surface;
    expect(editor.alignSelected("top")).toEqual({
      kind: "refused",
      message: overlapLine("Button 3"),
    });
    expect(editor.surface).toBe(held);
    // A LOCKED MEMBER refuses the command with 13A's line, before anything
    // else is read - even an alignment that would move nothing.
    editor.select(blank.id);
    editor.toggleLock();
    editor.select(b1.id);
    editor.toggleSelect(blank.id);
    expect(editor.alignSelected("left")).toEqual({
      kind: "refused",
      message: lockedMoveLine("Blank 1"),
    });
    expect(editor.distributeSelected("vertical"), "under three").toEqual({
      kind: "nothing",
    });
    editor.select(blank.id);
    editor.toggleLock();
    // NO ROOM: three 3-wide blanks stacked closer than their widths.
    const { editor: tight } = fresh();
    tight.choose("blank");
    tight.clickCell(0, 0);
    tight.clickCell(1, 2);
    tight.clickCell(2, 4);
    tight.cancel();
    for (const r of tight.surface.regions) {
      tight.select(r.id);
      tight.resizeSelectedTo({ col: r.col, row: r.row, w: 3, h: 1 });
    }
    tight.selectAll();
    const tightHeld = tight.surface;
    expect(tight.distributeSelected("horizontal")).toEqual({
      kind: "refused",
      message: DISTRIBUTE_NO_ROOM,
    });
    expect(tight.surface).toBe(tightHeld);
    expect(DISTRIBUTE_NO_ROOM, "no number, no exclamation").not.toMatch(
      /[0-9!]/,
    );
    // Nothing: a single, none, Play.
    editor.select(b1.id);
    expect(editor.alignSelected("right")).toEqual({ kind: "nothing" });
    editor.select(undefined);
    expect(editor.alignSelected("right")).toEqual({ kind: "nothing" });
    editor.selectAll();
    editor.setMode("play");
    expect(editor.alignSelected("right")).toEqual({ kind: "nothing" });
    expect(editor.distributeSelected("vertical")).toEqual({ kind: "nothing" });
    editor.setMode("edit");

    // THE SHAPE HALF: over a set the inspector's Arrange row carries eight
    // named boxes, the two spacings disabled under three members and live
    // at three; a single has no row; the route wires both calls.
    editor.select(b1.id);
    editor.toggleSelect(b2.id);
    let panel = inspector(editor);
    expect(panel).toContain('data-testid="arrange"');
    for (const id of [
      "arrange-left",
      "arrange-right",
      "arrange-top",
      "arrange-bottom",
      "arrange-centre-x",
      "arrange-centre-y",
      "arrange-space-x",
      "arrange-space-y",
    ])
      expect(panel).toContain(`data-testid="${id}"`);
    expect(panel).toContain('aria-label="Align left edges"');
    expect(panel).toContain('aria-label="Space out vertically"');
    expect(panel).toMatch(/data-testid="arrange-space-x"[^>]*disabled/);
    expect(panel).not.toMatch(/data-testid="arrange-left"[^>]*disabled/);
    expect(panel).toContain(ARRANGE_HELPER);
    editor.toggleSelect(blank.id);
    panel = inspector(editor);
    expect(panel).not.toMatch(/data-testid="arrange-space-x"[^>]*disabled/);
    editor.select(b1.id);
    expect(inspector(editor)).not.toContain('data-testid="arrange"');
    const route = code(ROUTE);
    expect(route).toContain("onalign={align}");
    expect(route).toContain("ondistribute={distribute}");
    expect(route).toContain("editor.alignSelected(to)");
    expect(route).toContain("editor.distributeSelected(axis)");
    for (const s of emitted) expect(wholeSurfaceValid(s)).toBe(true);
  });

  it("18. flip and rotate the surface (change 13B): every box mirrored or turned on the 9 x 9, a fader's orientation following a turn, the kinds unchanged, locked elements moving with it; two flips and four turns are the identity; one entry each keeping the selection, Undo taking it back; nothing on an empty surface or in Play", () => {
    // THE PURE FUNCTION on a 2 x 6 at the top-left: mirrored left to right it
    // sits at column 7, top to bottom at row 3; a quarter turn clockwise puts
    // its origin at (3, 0) as a 6 x 2 - the cell (0, 0) goes to (8, 0).
    const fader = { col: 0, row: 0, w: 2, h: 6 };
    expect(transformBox(fader, "flip-horizontal")).toEqual({
      ...fader,
      col: 7,
    });
    expect(transformBox(fader, "flip-vertical")).toEqual({ ...fader, row: 3 });
    expect(transformBox(fader, "rotate")).toEqual({
      col: 3,
      row: 0,
      w: 6,
      h: 2,
    });
    const corner = { col: 8, row: 8, w: 1, h: 1 };
    expect(transformBox(corner, "rotate")).toEqual({ ...corner, col: 0 });
    let turned = fader;
    for (let i = 0; i < 4; i += 1) turned = transformBox(turned, "rotate");
    expect(turned).toEqual(fader);

    // THROUGH THE EDITOR: a fader, a button, a knob and an XY pad, the pad
    // locked; every one moves, including the locked one - a surface
    // transform is not an element edit.
    const { editor, emitted } = fresh();
    editor.choose("fader");
    editor.clickCell(0, 0);
    editor.choose("button");
    editor.clickCell(7, 0);
    editor.choose("knob");
    editor.clickCell(3, 5);
    editor.choose("xy");
    editor.clickCell(0, 6);
    editor.cancel();
    const [f, b, , xy] = editor.surface.regions;
    editor.select(xy.id);
    editor.toggleLock();
    editor.select(f.id);
    editor.toggleSelect(b.id);
    const start = editor.surface.regions;
    const boxes = () => editor.surface.regions.map(boxOf);
    const depth = editor.history.depth;
    expect(editor.transformSurface("flip-horizontal")).toEqual({
      kind: "done",
      count: 4,
    });
    expect(boxes().map((r) => r.col)).toEqual([7, 0, 3, 6]);
    expect(editor.history.depth).toBe(depth + 1);
    expect(editor.history.entries.at(-1)?.kind).toBe("transform");
    expect(editor.selection, "the selection kept").toEqual([f.id, b.id]);
    expect(lockedOf(byId(editor, xy.id))).toBe(true);
    expect(editor.transformSurface("flip-horizontal").kind).toBe("done");
    expect(editor.surface.regions, "two flips are the identity").toEqual(start);
    expect(editor.transformSurface("flip-vertical").kind).toBe("done");
    expect(boxes().map((r) => r.row)).toEqual([3, 7, 1, 0]);
    expect(editor.transformSurface("flip-vertical").kind).toBe("done");
    expect(editor.surface.regions).toEqual(start);
    // A quarter turn: the fader is a 6 x 2 at (3, 0) and HORIZONTAL now, the
    // knob a 3 x 3 at (1, 3), the pad at (0, 0), the button at (7, 7); the
    // kinds are what they were. Four turns are the identity, orientation too.
    expect(editor.transformSurface("rotate")).toEqual({
      kind: "done",
      count: 4,
    });
    expect(boxes()).toEqual([
      { col: 3, row: 0, w: 6, h: 2 },
      { col: 7, row: 7, w: 2, h: 2 },
      { col: 1, row: 3, w: 3, h: 3 },
      { col: 0, row: 0, w: 3, h: 3 },
    ]);
    expect(orientationOf(byId(editor, f.id))).toBe("horizontal");
    expect(editor.surface.regions.map((r) => r.kind)).toEqual(
      start.map((r) => r.kind),
    );
    for (let i = 0; i < 3; i += 1)
      expect(editor.transformSurface("rotate").kind).toBe("done");
    expect(editor.surface.regions, "four turns are the identity").toEqual(
      start,
    );
    expect(orientationOf(byId(editor, f.id))).toBe("vertical");
    expect(editor.history.depth).toBe(depth + 8);
    // Undo takes one turn back at a time, the selection kept.
    expect(editor.transformSurface("rotate").kind).toBe("done");
    expect(editor.undo()).toBe(true);
    expect(editor.surface.regions).toEqual(start);
    expect(editor.selection).toEqual([f.id, b.id]);
    expect(editor.redo()).toBe(true);
    expect(orientationOf(byId(editor, f.id))).toBe("horizontal");
    editor.undo();
    // Nothing on an empty surface, and in Play.
    editor.setMode("play");
    expect(editor.transformSurface("rotate")).toEqual({ kind: "nothing" });
    editor.setMode("edit");
    expect(fresh().editor.transformSurface("flip-vertical")).toEqual({
      kind: "nothing",
    });

    // THE SHAPE HALF (the rail's transform group since change 15): three
    // named boxes, all three disabled and described by the mode line in
    // Play, disabled on an empty surface; straight lines only, no radius;
    // the route's dispatch calls transformSurface.
    const transforms = ["flip-horizontal", "flip-vertical", "turn-surface"];
    const row = railHtml({});
    for (const id of transforms) expect(row).toContain(`data-testid="${id}"`);
    expect(row).toContain(`aria-label="${FLIP_HORIZONTAL}"`);
    expect(row).toContain(`aria-label="${FLIP_VERTICAL}"`);
    expect(row).toContain(`aria-label="${ROTATE}"`);
    for (const id of transforms)
      expect(railBox(row, id)).not.toContain("disabled");
    const off = railHtml({ play: true });
    for (const id of transforms) {
      expect(railBox(off, id)).toContain('disabled=""');
      expect(railBox(off, id)).toContain('aria-describedby="why"');
    }
    const bare = railHtml({ empty: true });
    for (const id of transforms) {
      expect(railBox(bare, id)).toContain('disabled=""');
      expect(railBox(bare, id)).not.toContain('aria-describedby="why"');
    }
    const source = code(`${UI}/ToolRail.svelte`);
    expect(source).not.toMatch(/border-radius:\s*[1-9]/);
    expect(source).not.toMatch(/(^|\s)r[xy]=/m);
    expect(source, "straight lines only").not.toContain("<path");
    const route = code(ROUTE);
    expect(route).toContain("<ToolRail");
    expect(route).toContain("transform(id)");
    expect(route).toContain('transform("rotate")');
    expect(route).toContain("editor.transformSurface(kind)");
    for (const s of emitted) expect(wholeSurfaceValid(s)).toBe(true);
  });

  it("19. fill-to-fit and names (change 13B): Alt+click places the armed kind grown to the largest free rectangle holding the cell - the most cells, then the squarer, then the higher, then the further left - a knob to the largest free square, a fader turned along the longer side, the kind's minimum refusing a hole too small, a held cell falling back to the default size; Alt+Enter is the same at the focus cell; every creation path takes an auto-numbered name; renameElement is one entry by id", () => {
    // THE PURE FUNCTION on a fixture with obstacles: a 2 x 6 fader at the
    // top-left, a 2 x 2 button at (4, 0), a 1 x 1 blank at (3, 4).
    const { editor, emitted } = fresh();
    editor.choose("fader");
    editor.clickCell(0, 0);
    editor.choose("button");
    editor.clickCell(4, 0);
    editor.choose("blank");
    editor.clickCell(3, 4);
    editor.cancel();
    const built = buildCellMap(editor.surface.regions);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    // Around (5, 4): columns 4..8 by rows 2..8 - 35 cells - beats the 7-wide
    // strip below the blank (rows 5..8 by columns 2..8, 28).
    expect(largestFreeBox({ col: 5, row: 4 }, built.map)).toEqual({
      col: 4,
      row: 2,
      w: 5,
      h: 7,
    });
    // A square around (7, 7): 5 x 5 - a 6 x 6 would hold the blank - and of
    // the two 5 x 5 that hold the cell the HIGHER wins, at row 3.
    expect(largestFreeBox({ col: 7, row: 7 }, built.map, true)).toEqual({
      col: 4,
      row: 3,
      w: 5,
      h: 5,
    });
    // Around (2, 2), between the fader and the button: the 7 x 2 band under
    // the button and above the blank (columns 2..8 by rows 2..3, 14 cells)
    // beats column 2 alone (9) and the 2 x 4 block above the blank (8).
    expect(largestFreeBox({ col: 2, row: 2 }, built.map)).toEqual({
      col: 2,
      row: 2,
      w: 7,
      h: 2,
    });
    // An empty plate's corner cell belongs to the whole plate; a held cell
    // is undefined.
    const empty = buildCellMap([]);
    if (empty.ok)
      expect(largestFreeBox({ col: 8, row: 8 }, empty.map)).toEqual({
        col: 0,
        row: 0,
        w: 9,
        h: 9,
      });
    expect(largestFreeBox({ col: 0, row: 0 }, built.map)).toBeUndefined();

    // THROUGH THE EDITOR: F armed, Alt+click at (5, 4) places a 5 x 7 fader
    // at (4, 2), VERTICAL (taller than wide); a plain click at the same cell
    // would have been the default 2 x 6. Named Fader 2.
    editor.choose("fader");
    const filled = editor.clickCell(5, 4, false, true);
    expect(filled.kind).toBe("placed");
    if (filled.kind !== "placed") return;
    expect(boxOf(filled.region)).toEqual({ col: 4, row: 2, w: 5, h: 7 });
    expect(orientationOf(filled.region)).toBe("vertical");
    expect(filled.region.name).toBe("Fader 2");
    expect(editor.history.entries.at(-1)?.kind).toBe("place");
    editor.undo();
    // Alt+click at (2, 2): the 7 x 2 band, wider than tall, lands a
    // HORIZONTAL fader. A knob there is refused by rule 3: the largest free
    // square holding (2, 2) is 2 x 2, under the knob's 3.
    const band = editor.clickCell(2, 2, false, true);
    expect(band.kind).toBe("placed");
    if (band.kind === "placed") {
      expect(boxOf(band.region)).toEqual({ col: 2, row: 2, w: 7, h: 2 });
      expect(orientationOf(band.region)).toBe("horizontal");
    }
    editor.undo();
    editor.choose("knob");
    const small = editor.clickCell(2, 2, false, true);
    expect(small.kind).toBe("refused");
    if (small.kind === "refused")
      expect(small.message).toBe(
        GEOMETRY_COPY.tooSmall(
          { ...editor.surface.regions[0], kind: "knob" },
          { w: 3, h: 3 },
        ),
      );
    // The strip under everything: from (0, 7) the largest free rectangle is
    // columns 0..8 by rows 6..8 (27), wider than tall, so horizontal too.
    editor.choose("fader");
    const wide = editor.clickCell(0, 7, false, true);
    expect(wide.kind).toBe("placed");
    if (wide.kind === "placed") {
      expect(boxOf(wide.region)).toEqual({ col: 0, row: 6, w: 9, h: 3 });
      expect(orientationOf(wide.region)).toBe("horizontal");
    }
    // A HELD CELL falls back to the default size, which the overlap refuses.
    expect(editor.clickCell(0, 0, false, true).kind).toBe("refused");
    // Alt+Enter: the same at the focus cell; a plain Enter the default.
    editor.setFocus({ col: 7, row: 3 });
    editor.choose("button");
    const marked = editor.mark(true);
    expect(marked.kind).toBe("placed");
    if (marked.kind === "placed")
      expect(boxOf(marked.region)).toEqual({ col: 4, row: 2, w: 5, h: 4 });
    editor.undo();
    const plain = editor.mark();
    expect(plain.kind).toBe("placed");
    if (plain.kind === "placed")
      expect(boxOf(plain.region)).toEqual({ col: 7, row: 3, w: 2, h: 2 });
    editor.cancel();

    // AUTO-NUMBERED NAMES on every path: the starter, a hotkey placement, a
    // fill placement, a duplicate and a paste all take the kind's lowest
    // free number; the template's two keep the PDF's names (Filter, Hold).
    const { editor: named } = fresh();
    expect(named.starter().kind).toBe("placed");
    expect(named.surface.regions[0].name).toBe("Fader 1");
    named.choose("fader");
    named.clickCell(3, 0);
    expect(named.surface.regions[1].name).toBe("Fader 2");
    named.cancel();
    named.select(named.surface.regions[0].id);
    expect(named.duplicate().ok).toBe(true);
    expect(named.surface.regions[2].name).toBe("Fader 3");
    const content = named.copySelection();
    named.setFocus({ col: 8, row: 0 });
    expect(named.paste(content).kind).toBe("done");
    expect(named.surface.regions[3].name).toBe("Fader 4");
    named.choose("fader");
    named.clickCell(6, 6, false, true);
    expect(named.surface.regions[4].name).toBe("Fader 5");
    named.select(named.surface.regions[1].id);
    named.remove();
    named.choose("fader");
    named.clickCell(3, 0);
    expect(named.surface.regions.at(-1)?.name, "the gap refilled").toBe(
      "Fader 2",
    );
    named.cancel();
    const { editor: templated } = fresh();
    expect(templated.template()).toBe(true);
    expect(templated.surface.regions.map((r) => r.name)).toEqual([
      "Filter",
      "Hold",
    ]);

    // RENAME BY ID (the plate's inline rename): one entry under `rename`,
    // sealed - a second rename is a second entry - Undo takes it back and
    // leaves the selection as it was; refused for an empty name, the same
    // name, an unknown id, and in Play.
    const [first] = named.surface.regions;
    named.select(undefined);
    const depth = named.history.depth;
    expect(named.renameElement(first.id, "  Cutoff ")).toBe(true);
    expect(byId(named, first.id).name).toBe("Cutoff");
    expect(named.history.depth).toBe(depth + 1);
    expect(named.history.entries.at(-1)?.kind).toBe("rename");
    expect(named.renameElement(first.id, "Resonance")).toBe(true);
    expect(named.history.depth).toBe(depth + 2);
    expect(named.selection).toEqual([]);
    expect(named.undo()).toBe(true);
    expect(byId(named, first.id).name).toBe("Cutoff");
    expect(named.renameElement(first.id, "   ")).toBe(false);
    expect(named.renameElement(first.id, "Cutoff")).toBe(false);
    expect(named.renameElement("nobody", "X")).toBe(false);
    named.setMode("play");
    expect(named.renameElement(first.id, "Play")).toBe(false);
    named.setMode("edit");
    expect(named.history.depth).toBe(depth + 1);

    // THE SHAPE HALF: the plate's click carries Alt from pointerdown and
    // Enter carries it to onmark; a double-click opens the rename field,
    // whose keys and pointer stay its own (nothing reaches the plate's
    // handler, so Escape in the field clears no selection and Delete in it
    // deletes nothing); the palette's helper names the fill while a kind is
    // armed and not otherwise; the route wires the three.
    const source = code(`${UI}/SurfaceEditor.svelte`);
    expect(source).toMatch(
      /function onpointerdown[^]*?const alt = event\.altKey;[^]*?onclick\(at\.col, at\.row, shift, alt\)/,
    );
    expect(source).toContain("onmark(event.altKey)");
    expect(source).toContain("function ondblclick");
    expect(source).toContain('data-testid="surface-rename"');
    expect(source).toContain(`aria-label={ELEMENT_NAME}`);
    expect(source).toContain(
      "if (event.target instanceof HTMLInputElement) return;",
    );
    expect(source).toMatch(
      /function onrenamekey[^]*?event\.stopPropagation\(\);/,
    );
    expect(source).toContain(
      "onpointerdown={(event) => event.stopPropagation()}",
    );
    expect(source).toContain("largestFreeBox(at, view.cellMap");
    expect(source, "no rounded corner (D-01)").not.toContain("border-radius");
    editor.choose("fader");
    let rail = palette(editor.state());
    expect(rail).toContain('data-testid="palette-fill-helper"');
    expect(rail).toContain(PALETTE_FILL_HELPER);
    editor.cancel();
    rail = palette(editor.state());
    expect(rail).not.toContain(PALETTE_FILL_HELPER);
    const route = code(ROUTE);
    expect(route).toContain("void editor?.clickCell(col, row, shift, alt)");
    expect(route).toContain("onmark={(fill) => void editor?.mark(fill)}");
    expect(route).toContain(
      "onrename={(id, next) => void editor?.renameElement(id, next)}",
    );
    for (const s of emitted) expect(wholeSurfaceValid(s)).toBe(true);
  });

  it("20. remembered defaults per kind (change 13B): a field edited on ONE element is remembered for its kind and the next new element of that kind starts from it - channel, min, max, mode, speed, spring and its value, toggle, output and note, group, touches - while the controller, the colour and the orientation are not; a multi-edit, a rename, a recolour and a move remember nothing; the reset forgets every kind and is not an entry; the store round-trips, a corrupt envelope reads as empty, and the key is owned", () => {
    const told: SandboxDefaults[] = [];
    const editor = new SandboxEditor(emptySurface("t", "Test"), {
      ondefaults: (d) => void told.push(d),
    });
    expect(editor.defaults).toBe(NO_DEFAULTS);
    // A fader shaped: channel 5, min 10, relative at full speed, a spring
    // at 40. Every one is told; the record is the kind's remembered fields as
    // they stand - max is absent on the region, so absent here.
    editor.choose("fader");
    editor.clickCell(0, 0);
    editor.cancel();
    editor.editNumber("channel", "5");
    editor.commitField();
    editor.editNumber("min", "10");
    editor.commitField();
    editor.setRegionMode("relative");
    editor.setSpeed("full");
    editor.setSpring(true);
    editor.editNumber("springValue", "40");
    editor.commitField();
    expect(editor.defaults.kinds.fader).toEqual({
      channel: 5,
      min: 10,
      mode: "relative",
      speed: "full",
      spring: true,
      springValue: 40,
    });
    expect(told.at(-1)).toBe(editor.defaults);
    // The next fader takes them; its controller is the next free one, its
    // colour the palette's next, its orientation the default.
    editor.choose("fader");
    editor.clickCell(3, 0);
    editor.cancel();
    const [f1, f2] = editor.surface.regions;
    expect(f2).toMatchObject({
      channel: 5,
      min: 10,
      mode: "relative",
      speed: "full",
      spring: true,
      springValue: 40,
      cc: f1.cc + 1,
      colour: [...PALETTE[1]],
      orientation: "vertical",
    });
    expect(f2).not.toHaveProperty("max");
    // A MULTI-EDIT remembers nothing: channel 9 over both, the record at 5.
    const toldBefore = told.length;
    editor.select(f1.id);
    editor.toggleSelect(f2.id);
    editor.editNumber("channel", "9");
    editor.commitField();
    expect(byId(editor, f2.id).channel).toBe(9);
    expect(editor.defaults.kinds.fader?.channel).toBe(5);
    // Nor a rename, a recolour, a move, a lock, or the orientation.
    editor.select(f1.id);
    editor.rename("Cutoff");
    editor.setColour([0, 15, 15]);
    editor.nudgeSelected(0, 1);
    editor.commitField();
    editor.toggleLock();
    editor.toggleLock();
    editor.setOrientation("horizontal");
    expect(told.length).toBe(toldBefore);
    // A button: Note C4, toggled, group 2 - the next button sends the same
    // note; back on CC the note is not stored and the controller is free.
    editor.choose("button");
    editor.clickCell(6, 0);
    editor.cancel();
    editor.setOutput("note");
    editor.editNumber("note", "C4");
    editor.commitField();
    editor.setLatch(true);
    editor.setGroup(2);
    expect(editor.defaults.kinds.button).toEqual({
      channel: 1,
      latch: true,
      output: "note",
      group: 2,
      note: 60,
    });
    editor.choose("button");
    editor.clickCell(6, 3);
    editor.cancel();
    expect(editor.surface.regions.at(-1)).toMatchObject({
      cc: 60,
      output: "note",
      latch: true,
      group: 2,
    });
    editor.setOutput("cc");
    expect(editor.defaults.kinds.button).not.toHaveProperty("note");
    // An XY pad's touches stick and keep the controllers under the ceiling.
    editor.choose("xy");
    editor.clickCell(6, 6);
    editor.cancel();
    editor.setTouches(4);
    expect(editor.defaults.kinds.xy).toEqual({ channel: 1, touches: 4 });
    const pad = editor.surface.regions.at(-1) as Region;
    expect(
      withKindDefaults({ ...pad, cc: 126, cc2: 127 }, { touches: 5 }),
    ).toMatchObject({ touches: 5, cc: 118, cc2: 119 });
    // Only the kind's own fields apply, and only a mode the kind offers.
    expect(REMEMBERED_FIELDS.blank).toEqual([]);
    expect(
      withKindDefaults(byId(editor, f1.id), {
        touches: 3,
        group: 4,
        mode: "relative-twos",
        channel: 7,
      }),
    ).toEqual({ ...byId(editor, f1.id), channel: 7 });
    expect(rememberKind({ ...byId(editor, f1.id), kind: "blank" })).toEqual({});
    // THE RESET forgets every kind, is told, and is not an entry.
    const depth = editor.history.depth;
    editor.resetDefaults();
    expect(editor.defaults).toBe(NO_DEFAULTS);
    expect(told.at(-1)).toBe(NO_DEFAULTS);
    expect(editor.history.depth).toBe(depth);
    editor.choose("button");
    editor.clickCell(3, 6);
    editor.cancel();
    expect(editor.surface.regions.at(-1)).toMatchObject({
      channel: 1,
      latch: false,
    });
    expect(editor.surface.regions.at(-1)).not.toHaveProperty("group");
    // A paste keeps the original's settings, not the defaults (13A's rule).
    editor.select(editor.surface.regions[3].id);
    editor.setFocus({ col: 0, row: 7 });
    expect(editor.paste(editor.copySelection()).kind).toBe("done");
    expect(editor.surface.regions.at(-1)).toMatchObject({
      cc: 60,
      latch: true,
      group: 2,
      col: 0,
      row: 7,
    });

    // THE STORE: written whole, read back equal; an absent, a corrupt (bad
    // JSON, another version, a channel out of range, an unknown kind, a
    // wrong word) and a refusing store all read as empty; the reset removes
    // the key; the key is owned and versioned like the others.
    const { store, map } = mapStore();
    const defaults: SandboxDefaults = {
      schema: 1,
      kinds: { fader: { channel: 5, spring: true }, button: { note: 60 } },
    };
    expect(readSandboxDefaults(store)).toBe(NO_DEFAULTS);
    expect(writeSandboxDefaults(store, defaults)).toBe(true);
    expect(map.get(SANDBOX_DEFAULTS_KEY)).toBe(JSON.stringify(defaults));
    expect(readSandboxDefaults(store)).toEqual(defaults);
    for (const bad of [
      "{",
      JSON.stringify({ schema: 2, kinds: {} }),
      JSON.stringify({ schema: 1, kinds: { fader: { channel: 99 } } }),
      JSON.stringify({ schema: 1, kinds: { pad: {} } }),
      JSON.stringify({ schema: 1, kinds: { knob: { mode: "spin" } } }),
      JSON.stringify({ schema: 1, kinds: [] }),
    ]) {
      map.set(SANDBOX_DEFAULTS_KEY, bad);
      expect(readSandboxDefaults(store), bad).toBe(NO_DEFAULTS);
    }
    expect(isSandboxDefaults(defaults)).toBe(true);
    expect(
      isSandboxDefaults({ schema: 1, kinds: { xy: { touches: 6 } } }),
    ).toBe(false);
    expect(writeSandboxDefaults(store, defaults)).toBe(true);
    expect(resetSandboxDefaults(store)).toBe(true);
    expect(map.has(SANDBOX_DEFAULTS_KEY)).toBe(false);
    expect(readSandboxDefaults(undefined)).toBe(NO_DEFAULTS);
    expect(writeSandboxDefaults(undefined, defaults)).toBe(false);
    expect(resetSandboxDefaults(undefined)).toBe(false);
    expect(SANDBOX_DEFAULTS_KEY).toBe("hangar.sandbox-defaults.v1");
    expect(OWNED_KEYS).toContain(SANDBOX_DEFAULTS_KEY);

    // THE SHAPE HALF: with nothing selected the inspector's New elements
    // section carries the helper, Reset defaults and the line that says it
    // is not undone - disabled in Play, gone with a selection; the route
    // reads the store into the editor and writes every change back.
    const { editor: bare } = fresh();
    let panel = inspector(bare);
    expect(panel).toContain(">New elements<");
    expect(panel).toContain('data-testid="reset-defaults"');
    expect(panel).toContain(DEFAULTS_HELPER);
    expect(panel).toContain(RESET_DEFAULTS_HELPER);
    expect(RESET_DEFAULTS_HELPER).toContain("Undo");
    expect(panel).not.toMatch(/data-testid="reset-defaults"[^>]*disabled/);
    bare.setMode("play");
    expect(inspector(bare)).toMatch(
      /data-testid="reset-defaults"[^>]*disabled/,
    );
    bare.setMode("edit");
    bare.choose("button");
    bare.clickCell(0, 0);
    bare.cancel();
    panel = inspector(bare);
    expect(panel).not.toContain('data-testid="reset-defaults"');
    expect(panel).not.toContain(">New elements<");
    const route = code(ROUTE);
    expect(route).toContain("defaults: readSandboxDefaults(store)");
    expect(route).toContain("onresetdefaults={resetDefaults}");
    expect(route).toContain("resetSandboxDefaults(local())");
    expect(route).toContain("writeSandboxDefaults(local(), defaults)");
  });

  it("21. the plate's menu (change 13C): the ten items in order on the empty plate, a single, a locked single, a set of two and of three, a set with a locked member, at the cap and in Play - a disabled item carries its reason, never hides - every leaf an editor command; the menu renders as menuitems with the platform's modifier word, the plate opens it on a right-click, Shift+F10 and the Menu key, and the route dispatches every action", () => {
    const { editor } = fresh();
    const byId = (list: readonly MenuItem[], id: string): MenuItem =>
      list.find((i) => i.id === id) as MenuItem;
    const ORDER = [
      "cut",
      "copy",
      "paste",
      "duplicate",
      "delete",
      "lock",
      "rename",
      "align",
      "distribute",
      "select-every",
    ];
    const ALIGNS = [
      "arrange-left",
      "arrange-right",
      "arrange-top",
      "arrange-bottom",
      "arrange-centre-x",
      "arrange-centre-y",
    ];
    const SPACINGS = ["space-horizontal", "space-vertical"];
    // THE EMPTY PLATE: every item present, the selection-bound ones disabled
    // with the one reason, Paste without a clipboard, Select all with nothing.
    let items = menuItems(editor.state(), false);
    expect(items.map((i) => i.id)).toEqual(ORDER);
    for (const id of ["cut", "copy", "duplicate", "delete", "lock"]) {
      expect(byId(items, id).disabled, id).toBe(MENU_NEEDS_SELECTION);
    }
    expect(byId(items, "paste").disabled).toBe(NOTHING_TO_PASTE);
    expect(byId(items, "rename").disabled).toBe(MENU_RENAME_ONE);
    expect(byId(items, "select-every").disabled).toBe(MENU_NOTHING_TO_SELECT);
    expect(byId(items, "align").submenu?.map((s) => s.id)).toEqual(ALIGNS);
    expect(byId(items, "distribute").submenu?.map((s) => s.id)).toEqual(
      SPACINGS,
    );
    for (const sub of byId(items, "align").submenu ?? []) {
      expect(sub.disabled).toBe(MENU_ALIGN_TWO);
      expect(sub.action).toBe(sub.id);
    }
    for (const sub of byId(items, "distribute").submenu ?? []) {
      expect(sub.disabled).toBe(MENU_SPACE_THREE);
    }
    expect(
      Object.fromEntries(items.map((i) => [i.id, i.keys ?? null])),
    ).toEqual({
      cut: "Mod+X",
      copy: "Mod+C",
      paste: "Mod+V",
      duplicate: "Mod+D",
      delete: "Delete",
      lock: "Mod+L",
      rename: null,
      align: null,
      distribute: null,
      "select-every": "Mod+A",
    });
    // A SINGLE, with a clipboard: everything but the two submenus runs.
    editor.choose("button");
    editor.clickCell(0, 0);
    editor.cancel();
    const b1 = editor.surface.regions[0].id;
    items = menuItems(editor.state(), true);
    for (const id of ORDER.filter((i) => i !== "align" && i !== "distribute")) {
      expect(byId(items, id).disabled, id).toBeUndefined();
    }
    expect(byId(items, "lock").label).toBe("Lock");
    expect(byId(items, "align").submenu?.[0].disabled).toBe(MENU_ALIGN_TWO);
    // A LOCKED SINGLE: Cut and Delete refuse with 13A's line, Lock reads Unlock, Copy and Duplicate still run.
    editor.toggleLock();
    items = menuItems(editor.state(), true);
    expect(byId(items, "cut").disabled).toBe(lockedDeleteLine("Button 1"));
    expect(byId(items, "delete").disabled).toBe(lockedDeleteLine("Button 1"));
    expect(byId(items, "lock").label).toBe("Unlock");
    expect(byId(items, "copy").disabled).toBeUndefined();
    expect(byId(items, "duplicate").disabled).toBeUndefined();
    editor.toggleLock();
    // A SET OF TWO: Align runs, Space out needs three, Rename needs one.
    editor.choose("button");
    editor.clickCell(3, 0);
    editor.cancel();
    const b2 = editor.surface.regions[1].id;
    editor.select(b1);
    editor.toggleSelect(b2);
    items = menuItems(editor.state(), false);
    for (const sub of byId(items, "align").submenu ?? []) {
      expect(sub.disabled).toBeUndefined();
    }
    expect(byId(items, "distribute").submenu?.[0].disabled).toBe(
      MENU_SPACE_THREE,
    );
    expect(byId(items, "rename").disabled).toBe(MENU_RENAME_ONE);
    expect(byId(items, "paste").disabled).toBe(NOTHING_TO_PASTE);
    // THREE: Space out runs. A LOCKED MEMBER: Align, Space out, Cut and Delete refuse with the locked one's name; Lock locks the rest.
    editor.choose("button");
    editor.clickCell(6, 0);
    editor.cancel();
    const b3 = editor.surface.regions[2].id;
    editor.select(b1);
    editor.toggleSelect(b2);
    editor.toggleSelect(b3);
    items = menuItems(editor.state(), false);
    expect(byId(items, "distribute").submenu?.[1].disabled).toBeUndefined();
    editor.select(b3);
    editor.toggleLock();
    editor.select(b1);
    editor.toggleSelect(b2);
    editor.toggleSelect(b3);
    items = menuItems(editor.state(), false);
    expect(byId(items, "align").submenu?.[0].disabled).toBe(
      lockedMoveLine("Button 3"),
    );
    expect(byId(items, "distribute").submenu?.[0].disabled).toBe(
      lockedMoveLine("Button 3"),
    );
    expect(byId(items, "cut").disabled).toBe(lockedDeleteLine("Button 3"));
    expect(byId(items, "delete").disabled).toBe(lockedDeleteLine("Button 3"));
    expect(byId(items, "lock").label).toBe("Lock");
    // AT THE CAP: Paste and Duplicate refuse with the cap's lines (no number).
    const capped = new SandboxEditor(emptySurface("c", "Capped"), {
      rules: { cap: 1 },
    });
    capped.choose("button");
    capped.clickCell(0, 0);
    capped.cancel();
    items = menuItems(capped.state(), true);
    expect(byId(items, "paste").disabled).toBe(PASTE_AT_CAP);
    expect(byId(items, "duplicate").disabled).toBe(DUPLICATE_AT_CAP);
    // IN PLAY: no menu.
    editor.setMode("play");
    expect(menuItems(editor.state(), true)).toEqual([]);
    editor.setMode("edit");

    // THE SHAPE HALF: ten menuitems with their test ids, a disabled one with
    // its reason as the title, the modifier's word per platform; the plate
    // opens on contextmenu, Shift+F10 and the Menu key, and mounts it; Rename
    // is the plate's inline field; the route dispatches every other action.
    const bare = fresh().editor;
    const menuHtml = (mac: boolean) =>
      render(ContextMenu, {
        props: {
          items: menuItems(bare.state(), false),
          x: 0.2,
          y: 0.2,
          mac,
          onaction: noop,
          onclose: noop,
        },
      }).body;
    const html = menuHtml(false);
    expect(html).toContain('role="menu"');
    expect(count(html, 'role="menuitem"')).toBe(10);
    for (const id of ORDER) expect(html).toContain(`data-testid="menu-${id}"`);
    expect(html).toMatch(/data-testid="menu-copy"[^>]*disabled/);
    expect(html).toContain(`title="${MENU_NEEDS_SELECTION}"`);
    expect(html).toContain("Ctrl+X");
    expect(html).toContain('aria-haspopup="menu"');
    const macHtml = menuHtml(true);
    expect(macHtml).toContain("Cmd+X");
    expect(macHtml).not.toContain("Ctrl+");
    const plateSrc = code(`${UI}/SurfaceEditor.svelte`);
    expect(plateSrc).toContain("function oncontextmenu(event: MouseEvent)");
    expect(plateSrc).toContain("{oncontextmenu}");
    expect(plateSrc).toContain('event.key === "ContextMenu"');
    expect(plateSrc).toContain('event.key === "F10" && event.shiftKey');
    expect(plateSrc).toContain("<ContextMenu");
    expect(plateSrc).toContain('if (action === "rename")');
    expect(plateSrc).toContain("openRename(r)");
    expect(plateSrc).not.toContain("border-radius");
    const route = code(ROUTE);
    expect(route).toContain("menuItems={menu}");
    expect(route).toContain("onmenu={menuAction}");
    expect(route).toContain("onfocuscell={(cell) => editor?.setFocus(cell)}");
    for (const action of [
      "cut",
      "copy",
      "paste",
      "duplicate",
      "delete",
      "lock",
      "select-every",
      ...ALIGNS,
      ...SPACINGS,
    ]) {
      expect(route, action).toContain(`case "${action}":`);
    }
  });

  it("22. the shortcut sheet (change 13C): every key the route's window listener and the plate's handler read is named by a row, and every key a row names is read by one; the platform is read in one place and turns Mod into Ctrl or Cmd and Alt into Option; the sheet renders every group and row with the platform's words; ? and the toolbar's box open it; and the palette rows, Undo, Redo, Duplicate and Delete carry their keys in their titles", () => {
    const route = code(ROUTE);
    const handler = route.slice(
      route.indexOf("function onWindowKeyDown"),
      route.indexOf("function fromCopy"),
    );
    expect(handler.length).toBeGreaterThan(500);
    const readByRoute = [...handler.matchAll(/key === "([^"]+)"/g)].map((m) =>
      m[1].toLowerCase(),
    );
    expect(readByRoute).toEqual(
      expect.arrayContaining(["z", "y", "c", "x", "v", "d", "a", "l"]),
    );
    expect(readByRoute).toContain("?");
    const plateSrc = code(`${UI}/SurfaceEditor.svelte`).slice(
      code(`${UI}/SurfaceEditor.svelte`).indexOf("function onkeydown("),
      code(`${UI}/SurfaceEditor.svelte`).indexOf("</script>"),
    );
    const readByPlate = [
      ...[...plateSrc.matchAll(/event\.key === "([^"]+)"/g)].map((m) => m[1]),
      ...[...plateSrc.matchAll(/case "([^"]+)":/g)].map((m) => m[1]),
      ...[
        ...code(`${UI}/SurfaceEditor.svelte`).matchAll(
          /(Arrow(?:Left|Right|Up|Down)): \{ col/g,
        ),
      ].map((m) => m[1]),
    ].map((k) => k.toLowerCase());
    expect(readByPlate).toEqual(
      expect.arrayContaining([
        "tab",
        "enter",
        " ",
        "escape",
        "delete",
        "backspace",
        "alt",
        "contextmenu",
        "f10",
        "arrowleft",
        "arrowdown",
      ]),
    );
    const handlersRead = new Set([
      ...readByRoute,
      ...readByPlate,
      ...Object.values(HOTKEYS),
      SELECTOR_KEY,
    ]);
    const named = keysRead();
    for (const key of handlersRead) {
      expect(named.has(key), `the sheet names ${JSON.stringify(key)}`).toBe(
        true,
      );
    }
    for (const key of named) {
      expect(
        handlersRead.has(key),
        `${JSON.stringify(key)} is named but no handler reads it`,
      ).toBe(true);
    }
    // THE PLATFORM, read in one place: shortcuts.ts's platformOf takes the
    // navigator (Client Hints first); nothing else under the Sandbox reads it.
    for (const platform of ["MacIntel", "macOS", "iPhone", "iPad"]) {
      expect(isMacPlatform(platform), platform).toBe(true);
    }
    for (const platform of ["Win32", "Windows", "Linux x86_64", ""]) {
      expect(isMacPlatform(platform), platform).toBe(false);
    }
    expect(
      platformOf({ platform: "Win32", userAgentData: { platform: "macOS" } }),
    ).toBe("macOS");
    expect(platformOf({ platform: "Win32" })).toBe("Win32");
    expect(platformOf(undefined)).toBe("");
    expect(keysWord("Mod+Shift+Z", true)).toBe("Cmd+Shift+Z");
    expect(keysWord("Mod+Shift+Z", false)).toBe("Ctrl+Shift+Z");
    expect(keysWord("Alt+click", true)).toBe("Option+click");
    expect(keysWord("Alt+click", false)).toBe("Alt+click");
    expect(keysWord("Delete", true)).toBe("Delete");
    expect(route).toContain("mac = isMacPlatform(platformOf(navigator))");
    const sandboxSources = readdirSync(repo(UI))
      .filter((f) => f.endsWith(".svelte"))
      .map((f) => code(`${UI}/${f}`));
    for (const source of [...sandboxSources, route]) {
      expect(source).not.toContain("userAgentData");
      expect(source).not.toContain("navigator.platform");
    }
    // THE SHEET: a dialog with every group's title and every row's words, the
    // platform's words, Close; the route opens it on ? and the toggles' box.
    const sheet = (mac: boolean) =>
      render(ShortcutSheet, { props: { mac, onclose: noop } }).body;
    const plain = sheet(false);
    expect(plain).toContain('role="dialog"');
    expect(plain).toContain('aria-modal="true"');
    expect(plain).toContain(SHORTCUTS_TITLE);
    expect(plain).toContain('data-testid="shortcut-sheet-close"');
    let rows = 0;
    for (const group of SHORTCUT_GROUPS) {
      expect(plain).toContain(group.title);
      for (const row of group.rows) {
        expect(plain).toContain(row.what);
        rows += 1;
      }
    }
    expect(count(plain, 'data-testid="shortcut-row"')).toBe(rows);
    expect(plain).toContain("Ctrl+C");
    expect(plain).toContain("Alt+click");
    const mac = sheet(true);
    expect(mac).toContain("Cmd+C");
    expect(mac).toContain("Option+click");
    expect(mac).not.toContain("Ctrl+");
    expect(route).toContain('event.key === "?"');
    expect(route).toContain("<ShortcutSheet {mac} onclose={closeSheet} />");
    expect(route).toContain("if (sheetOpen) {");
    const rail = railHtml({});
    expect(rail).toContain('data-testid="shortcuts-open"');
    expect(railBox(rail, "shortcuts-open")).toContain(
      'title="Keyboard shortcuts (?)"',
    );
    // THE TITLES: the palette rows, Undo and Redo, Duplicate and Delete.
    const { editor } = fresh();
    const pal = palette(editor.state());
    expect(pal).toContain('title="Fader (F)"');
    expect(pal).toContain('title="XY pad (X)"');
    expect(pal).toContain('title="Blank (L)"');
    expect(railBox(rail, "undo")).toContain('title="Undo (Ctrl+Z)"');
    expect(railBox(rail, "redo")).toContain('title="Redo (Ctrl+Y)"');
    expect(railBox(railHtml({}, true), "undo")).toContain(
      'title="Undo (Cmd+Z)"',
    );
    editor.choose("button");
    editor.clickCell(0, 0);
    editor.cancel();
    const panel = inspector(editor);
    expect(panel).toContain('title="Duplicate (Ctrl+D)"');
    expect(panel).toContain('title="Delete element (Delete)"');
    expect(titledWithKeys("Undo", "Ctrl+Z")).toBe("Undo (Ctrl+Z)");
  });

  it("23. the MIDI monitor in Play (change 13C): one line per message - CC 16 ch 1 → 64, Note on C4 ch 1 → 100, ×N when messages folded - through the Playground monitor's own log, the newest twelve of more; the hook is the preview engine's host log through midiLogOf; the list mounts under the plate in Play only with its empty line, its helper and a Clear disabled until a line", () => {
    const row = (
      cmd: number,
      p1: number,
      p2: number,
      ch = 0,
      n = 1,
    ): MonitorRow => ({ at: 0, ch, cmd, p1, p2, count: n });
    expect(playMonitorLine(row(176, 16, 64))).toBe("CC 16 ch 1 → 64");
    expect(playMonitorLine(row(144, 60, 100))).toBe("Note on C4 ch 1 → 100");
    expect(playMonitorLine(row(128, 61, 0, 2))).toBe("Note off C#4 ch 3 → 0");
    expect(playMonitorLine(row(176, 16, 127, 0, 3))).toBe(
      "CC 16 ch 1 → 127 ×3",
    );
    expect(playMonitorLine(row(224, 0, 64))).toBe("Pitch bend ch 1 → 8192");
    expect(messageWord(176, 7)).toBe("CC 7");
    expect(messageWord(144, 0)).toBe("Note on C-1");
    expect(PLAY_MONITOR_ROWS).toBe(12);
    // Through MonitorLog: twenty distinct controllers give twenty rows, the list shows the newest twelve.
    const log = new MonitorLog();
    const stream: HostMidi[] = [];
    for (let i = 0; i < 20; i += 1) {
      stream.push({ ch: 0, cmd: 176, p1: i, p2: i, mode: 0 });
    }
    expect(log.ingest(stream, 0)).toBe(true);
    expect(log.visible).toHaveLength(20);
    const shown = newestRows(log.visible);
    expect(shown).toHaveLength(12);
    expect(shown[0].p1).toBe(19);
    expect(shown[11].p1).toBe(8);
    expect(newestRows(log.visible, 3).map((r) => r.p1)).toEqual([19, 18, 17]);
    // Alike messages inside the window fold: one line, the latest value, the count.
    const folded = new MonitorLog();
    folded.ingest(
      [
        { ch: 0, cmd: 176, p1: 16, p2: 1, mode: 0 },
        { ch: 0, cmd: 176, p1: 16, p2: 2, mode: 0 },
      ],
      0,
    );
    expect(playMonitorLine(folded.visible[0])).toBe("CC 16 ch 1 → 2 ×2");
    // THE HOOK: the Sandbox's engine is a LuaPadSim over a LuaHost whose
    // `midi` is the log; midiLogOf reads it through the host field, and the
    // route hands `() => midiLogOf(engine)` to the list.
    expect(midiLogOf({ host: { midi: [] } })).toEqual([]);
    expect(midiLogOf(undefined)).toBeUndefined();
    expect(code("src/lib/sim/lua-pad-sim.ts")).toContain(
      "private readonly host: LuaHost",
    );
    expect(code("src/lib/sim/lua-host.ts")).toContain(
      "get midi(): readonly HostMidi[]",
    );
    const route = code(ROUTE);
    expect(route).toMatch(
      /\{#if play\}\s*<PlayMonitor source=\{\(\) => midiLogOf\(engine\)\} \/>\s*\{\/if\}/,
    );
    // THE SHAPE: the list, its empty line, its helper, Clear disabled.
    const html = render(PlayMonitor, { props: { source: () => [] } }).body;
    expect(html).toContain('data-testid="play-monitor"');
    expect(html).toContain(PLAY_MONITOR_EMPTY);
    expect(html).toContain(PLAY_MONITOR_HELPER);
    expect(html).toMatch(/data-testid="play-monitor-clear"[^>]*disabled/);
    expect(html).not.toContain('data-testid="play-monitor-line"');
    expect(code(`${UI}/PlayMonitor.svelte`)).not.toMatch(
      /border-radius: (?!0;)/,
    );
  });

  it("24. the shared-controller pass (change 13C): a fader and a button on CC 16 channel 1 are a pair, a note button is not (a note is not a controller), a different channel is not, an XY pad's two axes and every finger's pair count, a blank sends nothing; each pair once per shared controller in the surface's order; the inspector lists the pairs first with nothing selected, the plate marks each member, and the editor still accepts two on one controller", () => {
    const r = (
      over: Partial<Region> & { id: string; name: string; kind: ElementKind },
    ): Region => ({
      col: 0,
      row: 0,
      w: 1,
      h: 1,
      cc: 16,
      channel: 1,
      colour: [15, 15, 7],
      ...over,
    });
    const fader = r({ id: "f", name: "Fader 1", kind: "fader", w: 2, h: 6 });
    const button = r({ id: "b", name: "Button 1", kind: "button", col: 3 });
    const note = r({
      id: "n",
      name: "Note 1",
      kind: "button",
      col: 5,
      output: "note",
    });
    const other = r({
      id: "o",
      name: "Fader 2",
      kind: "fader",
      col: 7,
      channel: 2,
      w: 2,
      h: 6,
    });
    const pad = r({
      id: "x",
      name: "XY pad 1",
      kind: "xy",
      col: 0,
      row: 6,
      w: 3,
      h: 3,
      cc2: 17,
      touches: 2,
    });
    const knob = r({
      id: "k",
      name: "Knob 1",
      kind: "knob",
      col: 3,
      row: 6,
      w: 3,
      h: 3,
      cc: 18,
    });
    const blank = r({
      id: "l",
      name: "Blank 1",
      kind: "blank",
      col: 6,
      row: 6,
    });
    expect(controllersOf(fader)).toEqual([16]);
    expect(controllersOf(button)).toEqual([16]);
    expect(controllersOf(note)).toEqual([]);
    expect(controllersOf(pad)).toEqual([16, 17, 18, 19]);
    expect(controllersOf(knob)).toEqual([18]);
    expect(controllersOf(blank)).toEqual([]);
    const all = [fader, button, note, other, pad, knob, blank];
    const found = findConflicts(all);
    expect(found.map((c) => [c.a, c.b, c.cc, c.channel])).toEqual([
      ["Fader 1", "Button 1", 16, 1],
      ["Fader 1", "XY pad 1", 16, 1],
      ["Button 1", "XY pad 1", 16, 1],
      ["XY pad 1", "Knob 1", 18, 1],
    ]);
    expect(found[0]).toMatchObject({ aId: "f", bId: "b" });
    expect([...conflictedIds(found)].sort()).toEqual(["b", "f", "k", "x"]);
    expect(findConflicts([fader, other])).toEqual([]);
    expect(findConflicts([fader, note])).toEqual([]);
    expect(findConflicts([])).toEqual([]);
    expect(conflictLine("Fader 1", "Button 1", 16, 1)).toBe(
      "Fader 1 and Button 1 both send CC 16 on channel 1.",
    );
    // NEVER A REFUSAL: the editor accepts the second element on the same controller.
    const { editor } = fresh();
    editor.choose("fader");
    editor.clickCell(0, 0);
    editor.choose("button");
    editor.clickCell(3, 0);
    editor.cancel();
    expect(editor.editNumber("cc", "16")).toBe(true);
    editor.commitField();
    editor.select(editor.surface.regions[0].id);
    expect(editor.editNumber("cc", "16")).toBe(true);
    editor.commitField();
    expect(findConflicts(editor.surface.regions)).toHaveLength(1);
    // THE INSPECTOR: with nothing selected the pairs come first, each its
    // line, the helper above them; with a selection, or none found, nothing.
    editor.select(undefined);
    const panelWith = render(RegionInspector, {
      props: {
        view: editor.state(),
        onrename: noop,
        onnumber: noop,
        oncommit: noop,
        onorientation: noop,
        onlatch: noop,
        oncolour: noop,
        onduplicate: noop,
        ondelete: noop,
        conflicts: found,
      },
    }).body;
    expect(panelWith).toContain(`>${CONFLICTS}<`);
    expect(panelWith).toContain(CONFLICTS_HELPER);
    expect(count(panelWith, 'data-testid="conflict-line"')).toBe(4);
    expect(panelWith).toContain(conflictLine("XY pad 1", "Knob 1", 18, 1));
    expect(panelWith.indexOf(`>${CONFLICTS}<`)).toBeLessThan(
      panelWith.indexOf(">Appearance<"),
    );
    expect(inspector(editor)).not.toContain(`>${CONFLICTS}<`);
    editor.select(editor.surface.regions[0].id);
    expect(inspector(editor)).not.toContain(`>${CONFLICTS}<`);
    // THE PLATE: a mark on each member given and on no other; straight lines.
    editor.select(undefined);
    const marked = render(SurfaceEditor, {
      props: {
        view: editor.state(),
        onclick: noop,
        onmove: noop,
        onmark: noop,
        oncancel: noop,
        ondelete: noop,
        conflicts: new Set([editor.surface.regions[0].id]),
      },
    }).body;
    expect(count(marked, 'data-testid="surface-conflict"')).toBe(1);
    expect(marked).toContain("<polygon");
    expect(marked).not.toMatch(/\brx=|\bry=/);
    expect(plate(editor.state())).not.toContain("surface-conflict");
    const route = code(ROUTE);
    expect(route).toContain("findConflicts(view.surface.regions)");
    expect(route).toContain("conflicts={conflictIds}");
    expect(route).toContain("{conflicts}");
  });

  it("25. the view toggles (change 13C): the store round-trips under its own key and a corrupt envelope reads as both on; with the numbers on every sending kind shows its controller - the fader its own numeral, a button, a knob and an XY pad a new one, a note button its note name, a blank none - and with them off none; names off drops the names; the toggles render pressed on the rail with their labels as titles and their helpers as descriptions; the route reads the store on mount, writes every toggle, hands the plate the pair, and the draft never carries it", () => {
    const { store, map } = mapStore();
    expect(DEFAULT_VIEW).toEqual({ schema: 1, numbers: true, names: true });
    expect(readSandboxView(store)).toBe(DEFAULT_VIEW);
    const off: SandboxView = { schema: 1, numbers: false, names: true };
    expect(writeSandboxView(store, off)).toBe(true);
    expect(map.get(SANDBOX_VIEW_KEY)).toBe(JSON.stringify(off));
    expect(readSandboxView(store)).toEqual(off);
    for (const bad of [
      "{",
      JSON.stringify({ schema: 2, numbers: true, names: true }),
      JSON.stringify({ schema: 1, numbers: "no", names: true }),
      JSON.stringify({ schema: 1, numbers: true }),
    ]) {
      map.set(SANDBOX_VIEW_KEY, bad);
      expect(readSandboxView(store), bad).toBe(DEFAULT_VIEW);
    }
    expect(isSandboxView({ schema: 1, numbers: true, names: false })).toBe(
      true,
    );
    expect(readSandboxView(undefined)).toBe(DEFAULT_VIEW);
    expect(writeSandboxView(undefined, off)).toBe(false);
    expect(SANDBOX_VIEW_KEY).toBe("hangar.sandbox-view.v1");
    expect(OWNED_KEYS).toContain(SANDBOX_VIEW_KEY);
    // THE PLATE: five kinds placed; the numerals per toggle.
    const { editor } = fresh();
    editor.choose("fader");
    editor.clickCell(0, 0);
    editor.choose("button");
    editor.clickCell(3, 0);
    editor.choose("knob");
    editor.clickCell(3, 3);
    editor.choose("xy");
    editor.clickCell(6, 0);
    editor.choose("blank");
    editor.clickCell(6, 6);
    editor.cancel();
    const [, button, knob, xy] = editor.surface.regions;
    const shown = (show: { numbers: boolean; names: boolean }) =>
      render(SurfaceEditor, {
        props: {
          view: editor.state(),
          onclick: noop,
          onmove: noop,
          onmark: noop,
          oncancel: noop,
          ondelete: noop,
          show,
        },
      }).body;
    const on = shown({ numbers: true, names: true });
    expect(count(on, 'data-testid="surface-cc"')).toBe(3);
    expect(on).toContain(`>${knob.cc}</text>`);
    expect(on).toContain(`>${xy.cc} ${xy.cc2}</text>`);
    expect(on).toContain(`>${button.cc}</text>`);
    expect(on).not.toContain("no-numbers");
    expect(on).not.toContain("no-names");
    // The default is both on, as the plate was.
    expect(count(plate(editor.state()), 'data-testid="surface-cc"')).toBe(3);
    const numbersOff = shown({ numbers: false, names: true });
    expect(numbersOff).not.toContain('data-testid="surface-cc"');
    expect(count(numbersOff, "no-numbers")).toBe(5);
    expect(numbersOff).toContain(">Fader 1</text>");
    const namesOff = shown({ numbers: true, names: false });
    expect(count(namesOff, "no-names")).toBe(5);
    const plateSrc = code(`${UI}/SurfaceEditor.svelte`);
    expect(plateSrc).toMatch(
      /\.region\.no-numbers \.numeral,\s*\.region\.no-names \.name \{\s*display: none;/,
    );
    // A note button's numeral is its note name.
    editor.select(button.id);
    editor.setOutput("note");
    editor.editNumber("note", "C4");
    editor.commitField();
    expect(shown({ numbers: true, names: true })).toContain(">C4</text>");
    // THE TOGGLES.
    const toggles = railHtml({ numbers: true, names: false });
    expect(railBox(toggles, "view-numbers")).toContain('aria-pressed="true"');
    expect(railBox(toggles, "view-names")).toContain('aria-pressed="false"');
    expect(railBox(toggles, "view-numbers")).toContain(
      `title="${VIEW_NUMBERS}"`,
    );
    expect(railBox(toggles, "view-names")).toContain(`title="${VIEW_NAMES}"`);
    expect(railBox(toggles, "view-numbers")).toMatch(
      /aria-describedby="[^"]+"/,
    );
    expect(toggles).toContain(VIEW_NUMBERS_HELPER);
    expect(toggles).toContain(VIEW_NAMES_HELPER);
    expect(toggles).toContain('role="group"');
    // THE ROUTE, and the draft: a Surface has no such field.
    const route = code(ROUTE);
    expect(route).toContain("viewPrefs = readSandboxView(local())");
    expect(route).toContain("writeSandboxView(local(), viewPrefs)");
    expect(route).toContain("show={viewPrefs}");
    expect(Object.keys(editor.surface).sort()).toEqual([
      "id",
      "name",
      "regions",
    ]);
  });

  it("26. the recent colours (change 13C): rememberColour puts the colour first once and keeps eight, the same object back when it is already first; the store round-trips under its own key and a corrupt or oversize envelope reads as empty; 13A's setColour already writes every member of a set as one entry, so the strip's chip is the swatch's own call; the inspector renders a chip per colour newest first, named and filled, none without a colour or a selection, disabled in Play; the route wires the swatch and the debounce", () => {
    const a: [number, number, number] = [15, 0, 0];
    const b: [number, number, number] = [0, 15, 0];
    let recent = NO_COLOURS;
    recent = rememberColour(recent, a);
    expect(recent.colours).toEqual([a]);
    recent = rememberColour(recent, b);
    expect(recent.colours).toEqual([b, a]);
    expect(rememberColour(recent, b)).toBe(recent);
    recent = rememberColour(recent, a);
    expect(recent.colours).toEqual([a, b]);
    for (let i = 1; i <= 9; i += 1) recent = rememberColour(recent, [i, i, i]);
    expect(RECENT_COLOURS_CAP).toBe(8);
    expect(recent.colours).toHaveLength(8);
    expect(recent.colours[0]).toEqual([9, 9, 9]);
    expect(recent.colours[7]).toEqual([2, 2, 2]);
    // THE STORE.
    const { store, map } = mapStore();
    expect(readRecentColours(store)).toBe(NO_COLOURS);
    expect(writeRecentColours(store, recent)).toBe(true);
    expect(map.get(SANDBOX_COLOURS_KEY)).toBe(JSON.stringify(recent));
    expect(readRecentColours(store)).toEqual(recent);
    for (const bad of [
      "{",
      JSON.stringify({ schema: 2, colours: [] }),
      JSON.stringify({ schema: 1, colours: [[16, 0, 0]] }),
      JSON.stringify({ schema: 1, colours: [[1, 2]] }),
      JSON.stringify({
        schema: 1,
        colours: Array.from({ length: 9 }, () => [1, 1, 1]),
      }),
      JSON.stringify({ schema: 1, colours: {} }),
    ]) {
      map.set(SANDBOX_COLOURS_KEY, bad);
      expect(readRecentColours(store), bad).toBe(NO_COLOURS);
    }
    expect(isRecentColours({ schema: 1, colours: [[0, 15, 15]] })).toBe(true);
    expect(readRecentColours(undefined)).toBe(NO_COLOURS);
    expect(writeRecentColours(undefined, recent)).toBe(false);
    expect(SANDBOX_COLOURS_KEY).toBe("hangar.sandbox-colours.v1");
    expect(OWNED_KEYS).toContain(SANDBOX_COLOURS_KEY);
    // 13A'S MULTI-EDIT, VERIFIED: one colour on a set writes every member as one entry.
    const { editor } = fresh();
    editor.choose("button");
    editor.clickCell(0, 0);
    editor.clickCell(3, 0);
    editor.cancel();
    const [b1, b2] = editor.surface.regions;
    editor.select(b1.id);
    editor.toggleSelect(b2.id);
    const depth = editor.history.depth;
    editor.setColour([1, 2, 3]);
    editor.commitField();
    expect(editor.surface.regions.map((r) => r.colour)).toEqual([
      [1, 2, 3],
      [1, 2, 3],
    ]);
    expect(editor.history.depth).toBe(depth + 1);
    editor.undo();
    expect(editor.selection).toEqual([b1.id, b2.id]);
    // THE INSPECTOR.
    const panel = (colours: readonly (readonly [number, number, number])[]) =>
      render(RegionInspector, {
        props: {
          view: editor.state(),
          onrename: noop,
          onnumber: noop,
          oncommit: noop,
          onorientation: noop,
          onlatch: noop,
          oncolour: noop,
          onduplicate: noop,
          ondelete: noop,
          recentColours: colours,
        },
      }).body;
    const strip = panel([a, b]);
    expect(strip).toContain('data-testid="recent-colours"');
    expect(count(strip, 'data-testid="recent-colour"')).toBe(2);
    expect(strip.indexOf('data-colour="15,0,0"')).toBeLessThan(
      strip.indexOf('data-colour="0,15,0"'),
    );
    expect(strip).toContain(recentColourName(255, 0, 0));
    expect(strip).toContain("background: rgb(255 0 0)");
    expect(strip).toContain(RECENT_COLOURS_HELPER);
    expect(strip).not.toMatch(/data-testid="recent-colour"[^>]*disabled/);
    expect(panel([])).not.toContain('data-testid="recent-colours"');
    editor.setMode("play");
    expect(panel([a])).toMatch(/data-testid="recent-colour"[^>]*disabled/);
    editor.setMode("edit");
    editor.select(undefined);
    expect(panel([a])).not.toContain('data-testid="recent-colours"');
    const route = code(ROUTE);
    expect(route).toContain("oncolour={colour}");
    expect(route).toContain("editor?.setColour(next)");
    expect(route).toContain("rememberColour(recent, next)");
    expect(route).toContain("recent = readRecentColours(local())");
    expect(route).toContain("recentColours={recent.colours}");
  });

  it("27. the Grid Editor profile controls (change 13C): Export for Grid Editor and Import a profile render as the rail's icon boxes - the export disabled with its reason as its title while the landing is measuring or over the budget, the import a file input accepting the export's types - with the outcome on the plate's status line; the Sandbox route builds the file from the landing's strings and opens an imported surface as a new draft; the workspace's pinned button builds it from the tuner's strings; the destination zone is untouched", () => {
    const html = railHtml({});
    expect(railBox(html, "export-profile")).toContain(
      `aria-label="${EXPORT_PROFILE}"`,
    );
    expect(railBox(html, "import-profile")).toContain(
      `aria-label="${IMPORT_PROFILE}"`,
    );
    expect(railBox(html, "export-profile")).not.toContain("disabled");
    expect(railBox(html, "export-profile")).toContain(
      `title="${EXPORT_PROFILE}"`,
    );
    expect(html).toContain(EXPORT_PROFILE_HELPER);
    const input = railBox(html, "import-profile");
    expect(input).toContain('type="file"');
    expect(input).toContain(`accept="${EXPORT_ACCEPT}"`);
    const held = railHtml({ exportReason: EXPORT_PROFILE_OVER });
    expect(railBox(held, "export-profile")).toContain('disabled=""');
    expect(railBox(held, "export-profile")).toContain(
      `title="${EXPORT_PROFILE_OVER}"`,
    );
    expect(held).not.toContain(EXPORT_PROFILE_HELPER);
    expect(code(`${UI}/ToolRail.svelte`)).not.toMatch(/border-radius: (?!0;)/);
    // THE OUTCOME: the route's say() puts the line on the plate's status
    // line for CONFIRM_MS (change 15), for the export and the import alike.
    expect(code(ROUTE)).toContain("say(profileExportedLine(fileName))");
    expect(code(ROUTE)).toContain("say(importedLine(surface.name))");
    expect(code(ROUTE)).toContain("plateNotice = line;");
    // THE SANDBOX ROUTE: the landing's strings (what Store writes), the
    // element count line as the description, the surface's envelope under
    // the hangar key, the file name from the surface's name; an import lands
    // on a fresh id as a draft, the surface held for open() as well.
    const route = code(ROUTE);
    expect(route).toContain("const strings = landing.config;");
    expect(route).toContain(
      "surfaceDescription(elementsLine(surface.regions.length))",
    );
    expect(route).toContain("profileFileName(surface.name)");
    expect(route).toContain("hangar: exportFile(");
    expect(route).toContain("readProfile(text, at)");
    expect(route).toContain("const id = mintSurfaceId();");
    expect(route).toContain("pendingImport = surface;");
    expect(route).toContain("saveSurfaceDraft(local(), surface, at);");
    expect(route).toContain(
      "readSurfaceDraft(store, id) ?? imported ?? fromCopy(store, id)",
    );
    expect(route).toMatch(
      /landing === undefined\s*\?\s*EXPORT_PROFILE_MEASURING\s*:\s*landing\.refusal !== undefined\s*\?\s*EXPORT_PROFILE_OVER/,
    );
    expect(route).toContain("<ToolRail");
    expect(route).toContain("onimport={(text) => void importProfile(text)}");
    // THE WORKSPACE: the tuner's five strings, the card's sentence, the same
    // record Save a copy writes under the hangar key, in the inspector's pinned actions.
    const workspace = code("src/routes/playground/[id]/+page.svelte");
    expect(workspace).toContain('data-testid="export-profile"');
    expect(workspace).toContain("const strings = configStrings;");
    expect(workspace).toContain("configDescription(entry.description)");
    expect(workspace).toContain("stamp.stampKnobs(found)");
    expect(workspace).toContain("profileLib.profileFileName(entry.name)");
    expect(workspace).toMatch(
      /overBudgetReason \?\?\s*\(configStrings === undefined \? EXPORT_PROFILE_MEASURING : undefined\)/,
    );
    expect(code("src/lib/ui/DestinationZone.svelte")).not.toContain("profile");
  });

  it("28. the tool rail (change 15): twelve icon-only boxes in five groups in rail order - Undo, Redo; Save copy, Export as a file, Export for Grid Editor, Import a profile; the three transforms; CC numbers and Names as toggles; the shortcut sheet - every glyph straight lines inside the 20 box, the rows' rules kept by railBoxes, each box 44 square with its label as its name and, with its keys, its title, a hairline between the groups, the reasons and helpers as descriptions; the route hands it to the shell's tools column between the centre and the inspector, and the three rows and their four components are gone", () => {
    // THE ORDER, the kinds, the glyphs.
    expect(RAIL_GROUPS.map((g) => g.map((b) => b.id))).toEqual([
      ["undo", "redo"],
      ["save-copy", "export-surface", "export-profile", "import-profile"],
      ["flip-horizontal", "flip-vertical", "turn-surface"],
      ["view-numbers", "view-names"],
      ["shortcuts-open"],
    ]);
    expect(RAIL_BOXES).toHaveLength(12);
    const kinds = Object.fromEntries(RAIL_BOXES.map((b) => [b.id, b.kind]));
    expect(kinds["view-numbers"]).toBe("toggle");
    expect(kinds["view-names"]).toBe("toggle");
    expect(kinds["import-profile"]).toBe("file");
    expect(
      RAIL_BOXES.filter((b) => b.kind === "action").map((b) => b.id),
    ).toHaveLength(9);
    let lines = 0;
    for (const box of RAIL_BOXES) {
      expect(box.label.length, box.id).toBeGreaterThan(0);
      if (box.glyph === undefined) {
        expect(box.id).toBe("shortcuts-open");
        expect(box.text).toBe("?");
        continue;
      }
      expect(box.glyph.length, box.id).toBeGreaterThan(2);
      for (const line of box.glyph) {
        expect(line).toHaveLength(4);
        for (const n of line) {
          expect(n).toBeGreaterThanOrEqual(0);
          expect(n).toBeLessThanOrEqual(GLYPH_BOX);
        }
        expect(line[0] !== line[2] || line[1] !== line[3], box.id).toBe(true);
        lines += 1;
      }
    }
    expect(RAIL_BOXES.find((b) => b.id === "undo")?.keys).toBe("Mod+Z");
    expect(RAIL_BOXES.find((b) => b.id === "redo")?.keys).toBe("Mod+Y");
    expect(RAIL_BOXES.find((b) => b.id === "turn-surface")?.transform).toBe(
      "rotate",
    );
    // THE RULES, the rows' own: Undo and Redo off in Play and with nothing
    // to take back or redo; the transforms off in Play and on an empty
    // surface; the export off with its reason; the rest live.
    const states = (f: Partial<RailFlags>) =>
      Object.fromEntries(
        railBoxes({ ...LIVE_FLAGS, ...f })
          .flat()
          .map((b) => [b.id, b]),
      );
    const live = states({});
    for (const b of Object.values(live)) expect(b.disabled, b.id).toBe(false);
    expect(live["view-numbers"].pressed).toBe(true);
    expect(states({ names: false })["view-names"].pressed).toBe(false);
    const inPlay = states({ play: true });
    const byMode = [
      "undo",
      "redo",
      "flip-horizontal",
      "flip-vertical",
      "turn-surface",
    ];
    expect(
      Object.values(inPlay)
        .filter((b) => b.disabled)
        .map((b) => b.id)
        .sort(),
    ).toEqual([...byMode].sort());
    for (const id of byMode) expect(inPlay[id].byMode, id).toBe(true);
    const nothing = states({ canUndo: false, canRedo: false });
    expect(nothing.undo.disabled).toBe(true);
    expect(nothing.undo.byMode).toBe(false);
    expect(nothing.redo.disabled).toBe(true);
    expect(nothing["flip-vertical"].disabled).toBe(false);
    const bare = states({ empty: true });
    for (const id of ["flip-horizontal", "flip-vertical", "turn-surface"]) {
      expect(bare[id].disabled, id).toBe(true);
      expect(bare[id].byMode, id).toBe(false);
    }
    expect(bare.undo.disabled).toBe(false);
    const over = states({ exportReason: EXPORT_PROFILE_OVER });
    expect(over["export-profile"].disabled).toBe(true);
    expect(over["export-profile"].reason).toBe(EXPORT_PROFILE_OVER);
    expect(over["import-profile"].disabled).toBe(false);
    expect(over["export-surface"].disabled).toBe(false);
    // THE SHAPE: the group named, the twelve in document order, eleven
    // glyphs of the model's lines and the ? box, four hairlines, the names
    // and the titles, the keys in the platform's words.
    const html = railHtml({});
    expect(html).toContain('data-testid="tool-rail"');
    expect(html).toMatch(new RegExp(`role="group"[^>]*aria-label="${TOOLS}"`));
    expect(count(html, "<hr")).toBe(4);
    let at = -1;
    for (const box of RAIL_BOXES) {
      const tag = railBox(html, box.id);
      expect(tag, box.id).not.toBe("");
      expect(tag, box.id).toContain(`aria-label="${box.label}"`);
      const i = html.indexOf(`data-testid="${box.id}"`);
      expect(i, `${box.id} in rail order`).toBeGreaterThan(at);
      at = i;
    }
    expect(count(html, "<svg")).toBe(11);
    expect(count(html, "<line")).toBe(lines);
    expect(railBox(html, "undo")).toContain(`title="${UNDO} (Ctrl+Z)"`);
    expect(railBox(html, "redo")).toContain(`title="${REDO} (Ctrl+Y)"`);
    expect(railBox(railHtml({}, true), "redo")).toContain(
      `title="${REDO} (Cmd+Y)"`,
    );
    expect(railBox(html, "save-copy")).toContain(`title="${SAVE_COPY}"`);
    expect(railBox(html, "save-copy")).not.toContain("aria-describedby");
    expect(railBox(html, "export-surface")).toMatch(/aria-describedby="[^"]+"/);
    expect(html).toContain('data-testid="no-link-explanation"');
    expect(html).toContain(NO_LINK_EXPLANATION);
    expect(railBox(html, "view-numbers")).toContain('aria-pressed="true"');
    expect(railBox(html, "undo")).not.toContain("aria-pressed");
    expect(count(html, 'aria-pressed="')).toBe(2);
    const off = railHtml({ play: true, canUndo: false });
    expect(railBox(off, "undo")).toContain('aria-describedby="why"');
    expect(railBox(railHtml({ canUndo: false }), "undo")).not.toContain(
      'aria-describedby="why"',
    );
    const source = code(`${UI}/ToolRail.svelte`);
    expect(source).toMatch(
      /\.box \{[^}]*inline-size: 44px;[^}]*block-size: 44px;/,
    );
    expect(source).not.toMatch(/border-radius:\s*[1-9]/);
    expect(source).not.toMatch(/(^|\s)r[xy]=/m);
    expect(source, "straight lines only").not.toContain("<path");
    expect(source).toContain("@media (max-width: 1023.98px)");
    expect(source).toContain("@media (max-height: 767.98px)");
    // THE ROUTE AND THE SHELL: the tools snippet between the rail and the
    // inspector in the fill, the layout's column between main and the
    // inspector's, the rows gone with their helpers and their components.
    const route = code(ROUTE);
    expect(route).toContain("{#snippet tools()}");
    expect(route).toMatch(/rail,\s*tools,\s*inspector,/);
    expect(route).toContain("onaction={railAction}");
    expect(route).toContain("ontoggle={toggleView}");
    expect(route).toContain('describedBy="sandbox-mode-line"');
    expect(route).toContain("onshortcuts={(opener) => openSheet(opener)}");
    for (const gone of [
      'class="tools"',
      'class="view-row"',
      "<SurfaceTransforms",
      "<ViewToggles",
      "<ProfileActions",
      "<SurfaceActions",
      "TRANSFORM_HELPER",
      "VIEW_GROUP",
      "profileOutcome",
      "save-copy-outcome",
      "export-outcome",
    ]) {
      expect(route, gone).not.toContain(gone);
    }
    for (const file of [
      "SurfaceActions",
      "SurfaceTransforms",
      "ViewToggles",
      "ProfileActions",
    ]) {
      expect(existsSync(repo(`${UI}/${file}.svelte`)), file).toBe(false);
    }
    const layout = code("src/routes/+layout.svelte");
    expect(layout).toContain('data-testid="shell-tools-column"');
    expect(layout).toContain("{@render fill.tools()}");
    expect(layout).toMatch(
      /\.frame\.with-tools \{[^}]*grid-template-columns: var\(--rail-w\) minmax\(0, 1fr\) auto var\(--inspector-w\)/,
    );
    expect(layout.indexOf('data-testid="shell-tools-column"')).toBeLessThan(
      layout.indexOf('data-testid="shell-inspector-column"'),
    );
  });
});
