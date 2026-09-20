// The Sandbox's interface, thirteen tests (7 and 8 by 13.1-03, 9 by change 5, 10 and 11 by change
// 10A - the selector, the hotkeys, the move, the delete icon, the blank kind; 12 by 10B, 13 by change
// 11 - an XY pad's Touches), two halves each:
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
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import {
  BUTTON_MIN_MAX_HELPER,
  CC_RANGE,
  CHANNEL_RANGE,
  DUPLICATE_AT_CAP,
  EMPTY_INSTRUCTION,
  EMPTY_SECOND_LINE,
  GROUP_HELPER,
  KIND_LABELS,
  KNOB_MODE_WORDS,
  KNOB_RELATIVE_HELPER,
  LIST_EMPTY,
  LOCKED_HELPER,
  MODE_HELPER,
  MULTI_LEDE,
  NOTE_RANGE,
  NOTHING_TO_PASTE,
  PASTE_AT_CAP,
  PASTE_NO_SPACE,
  PLAY_LOCKS_FIELDS,
  PLAY_LOCKS_PALETTE,
  SPRING_HELPER,
  STARTER_ACTION,
  TEMPLATE_ACTION,
  TOGGLE,
  TOGGLE_HELPER,
  TOO_FULL_TO_STORE,
  TOUCHES,
  TOUCHES_HELPER,
  VALUE_RANGE,
  WHOLE_NUMBER,
  touchesCcRange,
} from "../sandbox/copy";
import { noteName } from "../tune/view";
import {
  DEFAULT_COLOUR,
  DEFAULT_SIZES,
  HOTKEYS,
  NUMERIC_FIELDS,
  PALETTE,
  SELECTOR_KEY,
  SandboxEditor,
  autoName,
  kindForKey,
  type EditorState,
} from "../sandbox/editor";
import { ELEMENT_KINDS, isStoredRecord } from "../store/schema";
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
  buildCellMap,
  placementFor,
  touching,
  validate,
} from "../sandbox/geometry";
import { History } from "../sandbox/history";
import {
  boundingBox,
  ccCeiling,
  flagsOf,
  lockedOf,
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
  type Region,
  type Surface,
} from "../sandbox/model";
import ElementList from "./sandbox/ElementList.svelte";
import Palette from "./sandbox/Palette.svelte";
import RegionInspector from "./sandbox/RegionInspector.svelte";
import SurfaceEditor from "./sandbox/SurfaceEditor.svelte";
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
    ).toMatch(/function onpointerdown[^]*?onclick\(at\.col, at\.row, shift\)/);
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
    expect(source, "no selection lists Appearance alone").toMatch(
      /if [(]!any[)] return \[\{ title: APPEARANCE, content: appearance \}\];/,
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
      "if (m?.deferred) onclick(m.at.col, m.at.row, false)",
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
});
