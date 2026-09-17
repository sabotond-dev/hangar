// The Sandbox's interface, nine tests (7 and 8 by 13.1-03, 9 by change 5), two halves each:
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
  CC_RANGE,
  EMPTY_INSTRUCTION,
  EMPTY_SECOND_LINE,
  KIND_LABELS,
  LIST_EMPTY,
  PLAY_LOCKS_FIELDS,
  PLAY_LOCKS_PALETTE,
  STARTER_ACTION,
  TEMPLATE_ACTION,
  WHOLE_NUMBER,
} from "../sandbox/copy";
import {
  DEFAULT_COLOUR,
  DEFAULT_SIZES,
  PALETTE,
  SandboxEditor,
  type EditorState,
} from "../sandbox/editor";
import { GEOMETRY_COPY, buildCellMap, validate } from "../sandbox/geometry";
import { History, fieldKey } from "../sandbox/history";
import { withBrightness } from "../sandbox/model";
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
      onkind: noop,
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
  it("1. the empty state: the real plate with its lattice, section 8's instruction verbatim, one starter action and one template, and no question-mark placeholder anywhere", () => {
    // THE INSTRUCTION IS THE BIBLE'S, VERBATIM, and the route renders the
    // constant rather than a copy.
    expect(EMPTY_INSTRUCTION).toBe(
      "Add an element, or select an area on the surface.",
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

    // The rail's two sections on an empty surface: four palette rows
    // enabled, and the list saying so in one line.
    const rail = palette(editor.state());
    expect(count(rail, "<button")).toBe(4);
    expect(rail).not.toContain("disabled");
    for (const label of Object.values(KIND_LABELS))
      expect(rail).toContain(label);
    expect(list(editor.state())).toContain(LIST_EMPTY);
  });

  it("2. element first and area first, both by clicks alone with no pointer-move, and the keyboard route across the plate", () => {
    const { editor } = fresh();

    // ELEMENT FIRST: choose a type, click a cell, a region exists at its
    // default size with its top-left at the cell.
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
    expect(editor.placement).toEqual({ kind: "idle" });

    // AREA FIRST: click a start cell, click an end cell, a region exists at
    // exactly those bounds. Nothing was armed; the click on an empty cell
    // is the start.
    const started = editor.clickCell(7, 0);
    expect(started.kind).toBe("started");
    expect(editor.placement).toEqual({
      kind: "area",
      start: { col: 7, row: 0 },
    });
    const ended = editor.clickCell(8, 5);
    expect(ended.kind).toBe("placed");
    const fader = editor.surface.regions[1];
    expect(fader).toMatchObject({
      kind: "fader",
      orientation: "vertical",
      col: 7,
      row: 0,
      w: 2,
      h: 6,
    });
    // The far corner may be named first: the box is the same.
    editor.clickCell(0, 8);
    editor.clickCell(3, 7);
    expect(editor.surface.regions[2]).toMatchObject({
      kind: "fader",
      orientation: "horizontal",
      col: 0,
      row: 7,
      w: 4,
      h: 2,
    });
    // A one-cell area is a Button, the kind every area can hold.
    editor.clickCell(5, 8);
    editor.clickCell(5, 8);
    expect(editor.surface.regions[3]).toMatchObject({
      kind: "button",
      col: 5,
      row: 8,
      w: 1,
      h: 1,
    });

    // A click on a held cell SELECTS, and never creates.
    const before = editor.surface.regions.length;
    const picked = editor.clickCell(3, 4);
    expect(picked.kind).toBe("selected");
    expect(editor.selectedId).toBe(knob.id);
    expect(editor.surface.regions.length).toBe(before);

    // NO POINTER-MOVE IS REQUIRED, PROVED TWO WAYS - the clause 13-16 wrote
    // as "no method a move could reach", inverted honestly by 13.1-03 (D-03):
    // the model has exactly ONE method whose name starts `resize`, the box a
    // handle drag hands over on RELEASE, and none a pointer or a hover could
    // reach; and the plate's pointermove handler records the hover cell and
    // the proposed box of a drag in progress - it never calls onclick and
    // never commits. Test 7 drives the resize without a pointer at all.
    const methods = Object.getOwnPropertyNames(SandboxEditor.prototype);
    expect(methods.filter((m) => /pointer|hover/i.test(m))).toEqual([]);
    expect(methods.filter((m) => m.startsWith("resize"))).toEqual([
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
    expect(move, "pointermove commits a drag").not.toContain("onresize(");
    expect(move).toContain("hover = cellOf(event)");
    expect(
      source,
      "the click path fires from pointerdown, so a plain click is a whole step",
    ).toMatch(/function onpointerdown[^]*?onclick\(at\.col, at\.row\)/);

    // THE KEYBOARD ROUTE: arrows move the focus cell, Enter marks it - the
    // same click - so a kind can be placed and an area drawn without a
    // pointer at all.
    editor.setFocus({ col: 0, row: 0 });
    editor.choose("button");
    editor.moveFocus(3, 0);
    editor.moveFocus(1, 0);
    expect(editor.focus).toEqual({ col: 4, row: 0 });
    expect(editor.mark().kind).toBe("placed");
    expect(editor.surface.regions[4]).toMatchObject({
      kind: "button",
      col: 4,
      row: 0,
      w: 2,
      h: 2,
    });
    editor.setFocus({ col: 5, row: 5 });
    expect(editor.mark().kind).toBe("started");
    editor.moveFocus(1, 1);
    expect(editor.mark().kind).toBe("placed");
    expect(editor.surface.regions[5]).toMatchObject({
      col: 5,
      row: 5,
      w: 2,
      h: 2,
    });
    // The focus never leaves the plate: clamped at the edges.
    editor.moveFocus(-20, 30);
    expect(editor.focus).toEqual({ col: 0, row: 8 });
    // The plate's key handler wires the four arrows, Enter and Escape.
    for (const key of [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Enter",
      "Escape",
      "Delete",
    ]) {
      expect(source, `the plate handles ${key}`).toContain(`case "${key}":`);
    }

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
    expect(source).toContain("onclick={() => onselect(region.id)}");

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
      // The outline sits on the selected region's own box.
      const pitch = 571 / 9;
      expect(html).toMatch(
        new RegExp(
          `class="outline[^"]*" x="${region.col * pitch}" y="${region.row * pitch}"`,
        ),
      );

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
    expect(count(rail, "disabled"), "every palette row is disabled").toBe(4);
    expect(count(rail, "aria-describedby="), "each with the reason wired").toBe(
      4,
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
    for (const field of ["col", "row", "w", "h", "cc", "channel"]) {
      expect(panel).toMatch(
        new RegExp(`data-testid="field-${field}"[^>]*readonly`),
      );
    }
    expect(panel).toContain(PLAY_LOCKS_FIELDS);
    expect(panel).toMatch(/data-testid="duplicate-element"[^>]*disabled/);
    expect(panel).toMatch(/data-testid="delete-element"[^>]*disabled/);
    expect(editor.editNumber("w", "3"), "a numeric edit in Play").toBe(false);
    expect(editor.remove(), "a delete in Play").toBe(false);
    expect(editor.undo(), "an undo in Play").toBe(false);
    expect(byId(editor, fader.id).w).toBe(2);

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
    editor.editNumber("w", "3");
    expect(editor.history.depth).toBe(depth + 1);

    // The mode label is persistent and visible, and the switch is the way back.
    const route = code(ROUTE);
    expect(route).toContain('data-testid="mode-line"');
    expect(route).toContain('data-testid="mode-edit"');
    expect(route).toContain('data-testid="mode-play"');
  });

  it("5. validation preserves: an out-of-range width keeps the last valid value in the model, the message stays until corrected, and no intermediate invalid surface ever reached the model", () => {
    const { editor, emitted } = fresh();
    editor.choose("fader");
    editor.clickCell(0, 0);
    const id = editor.selectedId as string;
    expect(byId(editor, id)).toMatchObject({ w: 2, h: 6 });

    // AN OUT-OF-RANGE WIDTH: refused; the model holds 2; the field shows
    // the typed text with the field's own message.
    expect(editor.editNumber("w", "12")).toBe(false);
    expect(byId(editor, id).w, "the previous valid value survives").toBe(2);
    expect(editor.fields.w).toEqual({
      text: "12",
      message: GEOMETRY_COPY.offSurface("w"),
    });
    expect(editor.fieldText("w")).toBe("12");
    expect(editor.state().texts.w, "the state carries the same text").toBe(
      "12",
    );
    expect(editor.fieldText("h"), "the other fields show the model").toBe("6");

    // The inspector renders the typed text, aria-invalid and the message.
    const panel = inspector(editor);
    expect(panel).toMatch(
      /data-testid="field-w"[^>]*value="12"[^>]*aria-invalid="true"/,
    );
    expect(panel).toContain(GEOMETRY_COPY.offSurface("w"));

    // THE MESSAGE STAYS UNTIL CORRECTED: a second refused keystroke keeps a
    // message; a blur (commit) does not clear it; a valid keystroke does.
    expect(editor.editNumber("w", "")).toBe(false);
    expect(editor.fields.w?.message).toBe(WHOLE_NUMBER);
    editor.commitField();
    expect(
      editor.fields.w,
      "a commit does not silence the message",
    ).toBeDefined();
    expect(byId(editor, id).w).toBe(2);
    expect(editor.editNumber("w", "3")).toBe(true);
    expect(byId(editor, id).w).toBe(3);
    expect(editor.fields.w).toBeUndefined();
    expect(editor.fieldText("w")).toBe("3");

    // Every rule refuses with its own sentence and the same preservation:
    // a height below a vertical fader's two rows, a controller past 127, a
    // word where a number goes, a channel of 0.
    expect(editor.editNumber("h", "1")).toBe(false);
    expect(byId(editor, id).h).toBe(6);
    expect(editor.fields.h?.message).toContain("at least 2 rows");
    expect(editor.editNumber("cc", "200")).toBe(false);
    expect(editor.fields.cc?.message).toBe(CC_RANGE);
    expect(editor.editNumber("cc", "x")).toBe(false);
    expect(editor.fields.cc?.message).toBe(WHOLE_NUMBER);
    expect(editor.editNumber("channel", "0")).toBe(false);
    expect(editor.editNumber("cc", "74")).toBe(true);
    expect(byId(editor, id).cc).toBe(74);

    // Column and Row arrive one-based and go through the door: Column 1 is
    // col 0; Column 0 is off the surface and refused naming the column.
    expect(editor.editNumber("col", "0")).toBe(false);
    expect(editor.fields.col?.message).toBe(GEOMETRY_COPY.offSurface("col"));
    expect(editor.editNumber("col", "4")).toBe(true);
    expect(byId(editor, id).col).toBe(3);
    expect(editor.fieldText("col")).toBe("4");

    // An overlap is section 16's line, verbatim, naming the other region.
    editor.choose("button");
    editor.clickCell(7, 0);
    const buttonId = editor.selectedId as string;
    expect(editor.editNumber("col", "4")).toBe(false);
    expect(editor.fields.col?.message).toBe(
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

    // PLACE (element first), MOVE, RESIZE, RENAME, RECOLOUR, DUPLICATE, DELETE.
    step("place", () => {
      editor.choose("button");
      editor.clickCell(0, 0);
    });
    const id = editor.selectedId as string;
    step("move", () => {
      expect(editor.editNumber("col", "3")).toBe(true);
      editor.commitField();
    });
    step("resize (two keystrokes, one entry)", () => {
      expect(editor.editNumber("h", "1")).toBe(true);
      expect(editor.editNumber("h", "7")).toBe(true);
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
      expect(editor.remove()).toBe(true);
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
    // h 1 exists in no entry. And the boundary is real: a keystroke after
    // commitField is a NEW entry.
    const resize = editor.history.entries[2];
    expect(resize.key).toBe(fieldKey(id, "h"));
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
    editor.editNumber("w", "4");
    editor.setMode("play");
    editor.setMode("edit");
    editor.editNumber("w", "5");
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

    // THE CAP IS THE CEILING: sixteen one-cell buttons place; the
    // seventeenth is refused with the cap's sentence, and the palette's `+`
    // is disabled with the same reason beside it.
    const capped = fresh().editor;
    for (let i = 0; i < SURFACE_ELEMENT_CAP; i += 1) {
      capped.clickCell(i % 9, Math.floor(i / 9));
      capped.clickCell(i % 9, Math.floor(i / 9));
    }
    expect(capped.surface.regions).toHaveLength(SURFACE_ELEMENT_CAP);
    expect(capped.atCap).toBe(true);
    expect(capped.choose("button")).toBe(false);
    const rail = palette(capped.state());
    expect(count(rail, "disabled")).toBe(4);
    expect(rail).toContain(GEOMETRY_COPY.cap(SURFACE_ELEMENT_CAP));
    expect(capped.duplicate()).toEqual({ ok: false, reason: "cap" });
  });

  it("7. a handle drag commits through the editor on release: resizeSelectedTo moves a fader to the box, one entry undone and redone; an overlapping or too-small box is refused with its line and the surface is the same object; Play and an empty selection change nothing", () => {
    // 13.1-03 (13.1-CONTEXT D-03, bench line 3). Driven with no pointer: the
    // box is what the plate computes from the handle and the cell under the
    // pointer, and the model takes it once, on release.
    const { editor, emitted } = fresh();
    editor.choose("fader");
    editor.clickCell(0, 0);
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
    expect(editor.fieldText("w"), "the width field follows the plate").toBe(
      "3",
    );
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
    editor.clickCell(8, 0);
    editor.clickCell(8, 0);
    expect(editor.surface.regions[4].colour).toEqual(PALETTE[0]);

    // A DELETION IS NOT A STEP BACK: delete the fifth, place a sixth - it is
    // the next of the cycle, not the fifth's colour again.
    expect(editor.remove()).toBe(true);
    editor.clickCell(8, 2);
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
    editor.cancel();
    editor.clickCell(4, 4);
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
      /if [(]region === undefined[)]\s*return \[\{ title: APPEARANCE, content: appearance \}\];/,
    );
    const route = code(ROUTE);
    expect(route).toContain(
      "onbrightness={(next) => editor?.setBrightness(next)}",
    );
  });
});
