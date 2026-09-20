// The Sandbox's interface, the browser half (plan 13-16): PDF page 3 at
// /sandbox/ on the deployed bytes under wrangler dev, chromium only.
//
// SEVEN TITLES. The first builds a surface end to end with clicks and typed
// numbers - a kind armed from the palette, another by its hotkey, the
// selector's click on empty clearing the selection, selection from the list,
// a refused controller that keeps the last valid value, a delete undone, the
// draft recovered after a reload and NO meter anywhere (change 10A). The
// second is the surface's brightness (change 5). The third (13.1-03, D-03)
// is the handle drag: a handle pulled to another cell resizes the element
// through the editor, a handle pulled onto another element is refused with
// section 16's line and changes nothing, a handle put back where it was
// commits nothing, and one Undo takes the whole drag back. The fourth
// (change 10A) is the selector's walk: F arms a fader, a click places it, V
// returns to the selector, the body dragged moves it, the arrows nudge it,
// Shift-arrows resize it, L places a blank, and the plate's delete icon
// deletes the selection with one Undo bringing it back. The fifth is the
// mode round trip:
// Edit -> Play -> Edit with the same region selected and the same undo
// depth, the palette disabled with its reason and the handles gone in Play,
// and a finger on the plate in Play reaching the preview without an error.
// The fourth (13-17) is the whole loop on a fake ZONA: a two-element surface
// exported as a file through transfer.ts, re-imported on My configs, opened
// onto a fresh surface, applied to the fake as five acknowledged writes in
// SLOTS order - 255/4 carrying the runtime's second slot - stored on the
// fake's one click (the confirmation left on 2026-09-16, BENCH-2026-09-16.txt
// section 2; until then the title opened and closed it first); the codec is asserted
// untouched on the way (D-14 Q7). Nothing here claims a module would answer
// the same: runbook row M is where that is asked. (The sixth is that loop; the
// seventh, change 10B, is the options walk - a fader set Relative and Spring, a
// button set Note and Toggle, a knob set Relative, recovered from the draft; the
// eighth, change 11, an XY pad's Touches - the count, its helper, both refusals; the
// ninth, change 13A, the selection walk - Shift+click, the marquee, Ctrl+C / V / X, a
// channel typed over two, a lock refusing a drag.) THE PUT-BACK HALF LEFT AT
// 13.1-06 (13.1-CONTEXT D-07, the user's "remove"): the title clicked
// `put-back` and read RESTORED in the bar; the control is on no screen now,
// so the title ends at the store's refusal, and the bar's zone it reads is
// DestinationZone.svelte, the one component the workspace mounts too. The
// fake's owner-utility assertion moved with the click: what it proved - the
// module's own 255/4 comes back - is the store's putBack() on the fake in
// install.spec.ts and on the /dev/install/ probe.
//
// Every click here is Playwright's `click`, a pointer press and release at
// one point; only the two drag titles drag - a HANDLE, and since change 10A
// a selected element's BODY - and placement never needs one (13-16's rule,
// kept by 13.1-03). The static host's answer
// for the dynamic segment is asserted too: /sandbox/<id>/ is not a file, the
// host says 404, and the page comes up (src/routes/sandbox/[draftId]/+page.ts).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { TOUCH_LIBRARY, TOUCH_LIBRARY_TIMER } from "../src/lib/catalog/library";
import {
  TRIMMED_LIBRARY,
  TRIMMED_LIBRARY_TIMER,
} from "../src/lib/sandbox/library-trim";
import {
  IDENTIFIED_CAPTION,
  keptCaption,
} from "../src/lib/device/install-copy";
import { EVENT_SETUP, EVENT_TIMER, EVENT_UTILITY } from "../src/lib/protocol";
import { DRAFTS_KEY } from "../src/lib/store/schema";
import { BRIGHTNESS_RANGE } from "../src/lib/tune/inspector-copy";
import {
  HANGAR_FORMAT_LETTERS,
  HANGAR_FORMAT_LUA,
  HANGAR_FORMAT_LUA_COLOUR,
} from "../src/lib/share/stamp";
import { FAKE_SERIAL } from "./fake-serial";
import { installZona } from "./fake-zona";

/**
 * The module the third title connects to: a page of its own, a printable
 * string in every one of the five slots HANGAR writes - none the package's
 * default, so a put-back is told apart from a clear on every slot - and a
 * serial so the snapshot is durable (install.e2e.ts's fixture, in short).
 */
const ACTIVE_PAGE = 2;
const MODULE_SETUP = "--[[@cb]]print(1)";
const MODULE_TIMER = "--[[@cb]]print(2)";
const MODULE_SYSTEM = "--[[@cb]]function M()return 1 end";
const MODULE_SYSTEM_TIMER = "--[[@cb]]function M:tim()return 2 end";
const MODULE_SYSTEM_UTILITY = "--[[@cb]]function M:map()return 5 end";

/** A surface's own address: the front door mints the id and lands here. */
const SURFACE_ADDRESS = /[/]sandbox[/]s-[a-z0-9-]+[/]$/;

/**
 * Every console error but one: the surface's own document arrives with
 * status 404 by design (the static host serves the fallback page for a path
 * no file matches, and the page is real all the same - see the route's
 * +page.ts), and Chromium logs that status as a resource error. That one
 * line is the host's answer, not a defect, and it is asserted directly
 * below with a request; anything else is a real error.
 */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    const at = msg.location()?.url ?? "";
    if (
      text.startsWith("Failed to load resource") &&
      text.includes("404") &&
      SURFACE_ADDRESS.exec(at) !== null
    ) {
      return;
    }
    errors.push(text);
  });
  page.on("pageerror", (error) => errors.push(String(error)));
  return errors;
}

/** Click the centre of a cell on the plate. Column and row are ZERO-based here. */
async function clickCell(plate: Locator, col: number, row: number) {
  const box = await plate.boundingBox();
  if (box === null) throw new Error("the plate has no box");
  const pitch = box.width / 9;
  await plate.click({
    position: { x: (col + 0.5) * pitch, y: (row + 0.5) * pitch },
  });
}

/** Open the Sandbox from its front door and land on a surface of its own. */
async function openFresh(page: Page): Promise<Locator> {
  await page.goto("/sandbox/?new");
  await expect(page).toHaveURL(SURFACE_ADDRESS);
  await expect(page.getByTestId("sandbox")).toBeVisible();
  return page.getByTestId("surface-plate");
}

test.describe("the Sandbox, with no hardware attached", () => {
  test("place, select and edit an element end to end - by clicks, a hotkey and typed numbers, never a drag - with the draft recovered and no meter anywhere", async ({
    page,
    request,
  }) => {
    const consoleErrors = collectErrors(page);
    const plate = await openFresh(page);
    const url = page.url();

    // THE STATIC HOST'S ANSWER: the surface's address is not a file. The host
    // says 404, and the page is real all the same (the fallback booted it).
    expect((await request.get(url)).status()).toBe(404);

    // THE EMPTY STATE: the real plate, the instruction, one starter, one
    // template; five palette rows, each with its key; the list empty.
    await expect(page.getByTestId("sandbox-empty")).toContainText(
      "Add an element to the surface.",
    );
    await expect(page.getByTestId("starter-action")).toBeVisible();
    await expect(page.getByTestId("template-action")).toBeVisible();
    await expect(page.getByTestId("surface-count")).toHaveText("0 elements");
    await expect(page.getByTestId("element-list-empty")).toBeVisible();
    await expect(page.getByTestId("palette-fader")).toBeEnabled();
    await expect(page.getByTestId("palette-blank")).toContainText("L");
    // Nothing is saved until something is edited.
    expect(await page.getByTestId("status-draft").count()).toBe(0);

    // THE PALETTE ARMS A KIND: the palette's Fader, then one click on the
    // plate; the kind stays armed (change 10A) until the row is clicked
    // again, and the panel shows no position block and a plain type.
    await page.getByTestId("palette-fader").click();
    await expect(page.getByTestId("palette-fader")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByTestId("surface-status")).toContainText(
      "Click a cell to place the Fader.",
    );
    await clickCell(plate, 1, 1);
    await expect(page.getByTestId("surface-count")).toHaveText("1 element");
    await expect(page.getByTestId("surface-region")).toHaveCount(1);
    await expect(page.getByTestId("surface-handle")).toHaveCount(8);
    await expect(page.getByTestId("surface-delete")).toBeVisible();
    await expect(page.getByTestId("inspector-name")).toHaveText("Fader 1");
    await expect(page.getByTestId("inspector-units")).toHaveText("2 × 6 units");
    await expect(page.getByTestId("field-kind")).toHaveText("Fader");
    expect(await page.getByTestId("field-col").count()).toBe(0);
    expect(await page.getByTestId("field-w").count()).toBe(0);
    await expect(page.getByTestId("palette-fader")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByTestId("palette-fader").click();
    await expect(page.getByTestId("palette-fader")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(page.getByTestId("element-row")).toHaveCount(1);
    await expect(page.getByTestId("element-row").first()).toHaveAttribute(
      "aria-current",
      "true",
    );

    // THE DRAFT: saved as it is edited, and the bar says so.
    await expect(page.getByTestId("status-draft")).toHaveText(
      "Draft saved locally",
    );

    // THE NUMERIC PATH: a controller typed in lands; an out-of-range one
    // keeps the last valid value with its message until corrected.
    const cc = page.getByTestId("field-cc");
    await expect(cc).toHaveValue("1");
    await cc.fill("74");
    await expect(page.getByTestId("surface-region").first()).toContainText(
      "74",
    );
    await cc.fill("200");
    await expect(page.getByTestId("field-cc-message")).toContainText(
      "A controller number is 0 to 127.",
    );
    await expect(cc).toHaveAttribute("aria-invalid", "true");
    await expect(cc).toHaveValue("200");
    await expect(
      page.getByTestId("surface-region").first(),
      "the model kept the previous valid value",
    ).toContainText("74");
    await cc.fill("7");
    await expect(page.getByTestId("field-cc-message")).toHaveCount(0);

    // A HOTKEY ARMS A KIND (change 10A): B on the plate, then a click, and
    // the second element exists at the button's default size; a click on
    // an empty cell with the selector clears the selection.
    await plate.focus();
    await page.keyboard.press("b");
    await expect(page.getByTestId("palette-button")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await clickCell(plate, 5, 1);
    await expect(page.getByTestId("surface-count")).toHaveText("2 elements");
    await expect(page.getByTestId("inspector-name")).toHaveText("Button 1");
    await expect(page.getByTestId("inspector-units")).toHaveText("2 × 2 units");
    await page.keyboard.press("v");
    await expect(page.getByTestId("palette-button")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await clickCell(plate, 8, 8);
    await expect(page.getByTestId("surface-count")).toHaveText("2 elements");
    await expect(page.getByTestId("surface-handle")).toHaveCount(0);
    await expect(page.getByTestId("surface-status")).toContainText(
      "Nothing selected.",
    );
    // A hotkey typed into a text field arms nothing.
    await page.getByTestId("element-row").first().click();
    await page.getByTestId("field-name").focus();
    await page.keyboard.press("f");
    await expect(page.getByTestId("palette-fader")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await page.getByTestId("field-name").fill("Fader 1");

    // THE LIST IS THE OTHER WAY TO SELECT: the first row, by keyboard.
    await page.getByTestId("element-row").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("inspector-name")).toHaveText("Fader 1");
    await expect(page.getByTestId("element-row").first()).toHaveAttribute(
      "aria-current",
      "true",
    );
    // And a rename lands in the list and on the plate.
    await page.getByTestId("field-name").fill("Filter");
    await expect(page.getByTestId("element-row").first()).toContainText(
      "Filter",
    );
    await expect(page.getByTestId("surface-region").first()).toContainText(
      "Filter",
    );

    // NO METER (change 10A, answer 12): no bar, no count, no "of 908"
    // anywhere on the page, while Store still measures underneath.
    expect(await page.getByTestId("surface-meters").count()).toBe(0);
    expect(await page.getByTestId("meter-line").count()).toBe(0);
    await expect(page.getByTestId("sandbox")).not.toContainText("908");
    await expect(page.getByTestId("shell-inspector")).not.toContainText("908");

    // DELETE, UNDONE: the region comes back and is selected again.
    await page.getByTestId("delete-element").click();
    await expect(page.getByTestId("surface-count")).toHaveText("1 element");
    await expect(page.getByTestId("element-row")).toHaveCount(1);
    await page.getByTestId("undo").click();
    await expect(page.getByTestId("surface-count")).toHaveText("2 elements");
    await expect(page.getByTestId("inspector-name")).toHaveText("Filter");
    await page.getByTestId("redo").click();
    await expect(page.getByTestId("surface-count")).toHaveText("1 element");
    await page.getByTestId("undo").click();
    await expect(page.getByTestId("surface-count")).toHaveText("2 elements");

    // THE DRAFT, RECOVERED: a reload lands on the same surface with both
    // regions and the name, read back from the store.
    await page.waitForTimeout(600);
    await page.reload();
    await expect(page.getByTestId("sandbox")).toBeVisible();
    await expect(page.getByTestId("surface-count")).toHaveText("2 elements");
    await expect(page.getByTestId("element-row").first()).toContainText(
      "Filter",
    );
    await expect(page.getByTestId("status-draft")).toHaveText(
      "Draft saved locally",
    );

    // And /sandbox/ resumes it.
    await page.goto("/sandbox/");
    await expect(page).toHaveURL(url);
    await expect(page.getByTestId("surface-count")).toHaveText("2 elements");

    // My configs lists it as a Draft whose Open comes back here.
    await page.goto("/my-configs/");
    await expect(page.getByTestId("library-count")).toHaveText(
      "1 saved configuration",
    );
    await expect(page.getByTestId("library-status")).toHaveAttribute(
      "data-status",
      "draft",
    );
    await page.getByTestId("library-open").click();
    await expect(page).toHaveURL(url);
    await expect(page.getByTestId("surface-count")).toHaveText("2 elements");

    expect(consoleErrors, "no console error on the whole walk").toEqual([]);
  });

  test("the surface's brightness is one field under Appearance with or without a selection: 128 lands in the draft and is recovered on a reload, 0 is refused with the range line and the last good value kept, Undo takes it back, and the reset drops the field", async ({
    page,
  }) => {
    // CHANGE 5 (2026-09-17). sandbox-ui.spec.ts holds the editor's entry and
    // the rendered shape; emit.spec.ts the scaled rows; this is the wiring
    // in a browser: the field -> editor.setBrightness -> the draft in the
    // visitor's store -> the same surface after a reload, and the two
    // refusals the field makes on its own.
    const consoleErrors = collectErrors(page);
    await openFresh(page);
    const field = page.getByTestId("brightness-field");
    const input = page.getByTestId("brightness-field-input");
    const reset = page.getByTestId("brightness-field-reset");
    const message = page.getByTestId("brightness-field-message");

    // With nothing selected the inspector carries the field alone, at 255.
    await expect(field).toBeVisible();
    await expect(input).toHaveValue("255");
    await expect(field).toHaveAttribute("data-changed", "false");
    await expect(reset).toBeDisabled();
    await expect(page.getByTestId("region-swatch")).toHaveCount(0);

    // With an element selected the same field sits under Appearance, after the swatch.
    await page.getByTestId("starter-action").click();
    await expect(page.getByTestId("surface-count")).toHaveText("1 element");
    await expect(page.getByTestId("region-swatch")).toBeVisible();
    await expect(field).toBeVisible();

    // 128: the draft carries it, the marker and the reset come on.
    await input.fill("128");
    await expect(field).toHaveAttribute("data-value", "128");
    await expect(field).toHaveAttribute("data-changed", "true");
    await expect(reset).toBeEnabled();
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
    await page.waitForTimeout(600);
    const draft = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      DRAFTS_KEY,
    );
    expect(draft, "the draft was written").not.toBeNull();
    expect(draft, "the draft carries the field").toMatch(/"brightness":128/);

    // 0 is refused: aria-invalid, the range line, the model on 128 still.
    await input.fill("0");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(message).toHaveText(BRIGHTNESS_RANGE);
    await expect(field).toHaveAttribute("data-value", "128");
    await input.fill("64");
    await expect(message).toHaveCount(0);
    await expect(field).toHaveAttribute("data-value", "64");

    // Recovered: a reload lands on the same surface at 64.
    await page.waitForTimeout(600);
    await page.reload();
    await expect(page.getByTestId("sandbox")).toBeVisible();
    await expect(page.getByTestId("surface-count")).toHaveText("1 element");
    await expect(page.getByTestId("brightness-field-input")).toHaveValue("64");
    await expect(page.getByTestId("brightness-field")).toHaveAttribute(
      "data-changed",
      "true",
    );

    // The reset drops the field: 255 again, the draft without it.
    await page.getByTestId("brightness-field-reset").click();
    await expect(page.getByTestId("brightness-field-input")).toHaveValue("255");
    await expect(page.getByTestId("brightness-field-reset")).toBeDisabled();
    await page.waitForTimeout(600);
    const back = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      DRAFTS_KEY,
    );
    expect(back, "a surface at 255 is written without the field").not.toMatch(
      /"brightness"/,
    );
    // Undo takes the reset back: 64 again, one entry.
    await page.getByTestId("undo").click();
    await expect(page.getByTestId("brightness-field-input")).toHaveValue("64");

    expect(consoleErrors, "no console error on the whole walk").toEqual([]);
  });

  test("a handle drag resizes an element through the editor, a refused drag leaves it as it was, and Undo takes the drag back", async ({
    page,
  }) => {
    // 13.1-03 (13.1-CONTEXT D-03, bench line 3: "you should be able to
    // resize each element by draggin its points"). Chromium only: a mouse
    // drag; the phone project is not asked to drag, and 13-16's rule that
    // no drag is required is what a phone relies on. The viewport is the
    // harness's 1280 x 720, set explicitly: 13.1-03 wrote this title at 900
    // tall because at 720 the app frame's footer overlaid the plate's bottom
    // row (deferred-items A.1 - the frame was a calc on FOOTER_H while the
    // footer rendered 121), and a pointerDOWN must land on a visible handle;
    // the quick task after the 13.1 gate (A.4) made the frame flex in a
    // 100dvh column, the document no longer scrolls, and the plate's bottom
    // row is visible at 720 again. The moves after the pointerDOWN are
    // captured by the plate wherever the pointer goes.
    await page.setViewportSize({ width: 1280, height: 720 });
    const consoleErrors = collectErrors(page);
    const plate = await openFresh(page);
    const sandbox = page.getByTestId("sandbox");
    const units = page.getByTestId("inspector-units");
    const status = page.getByTestId("surface-status");

    // A fader at cell (1, 1), the default 2 x 6 - cols 1-2, rows 1-6 - and a
    // button at (5, 1), 2 x 2 - cols 5-6, rows 1-2 - placed FIRST so the
    // drag's entry is the last one and one Undo is the drag alone; then V,
    // so the selector is back and no proposed box follows the hover.
    await page.getByTestId("palette-fader").click();
    await clickCell(plate, 1, 1);
    await page.getByTestId("palette-button").click();
    await clickCell(plate, 5, 1);
    await page.keyboard.press("v");
    await expect(page.getByTestId("palette-button")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(sandbox).toHaveAttribute("data-depth", "2");
    await page.getByTestId("element-row").first().click();
    await expect(page.getByTestId("inspector-name")).toHaveText("Fader 1");
    await expect(units).toHaveText("2 × 6 units");
    await expect(page.getByTestId("surface-handle")).toHaveCount(8);

    // The whole plate in the viewport, and every box read after the scroll.
    await plate.scrollIntoViewIfNeeded();
    const box = await plate.boundingBox();
    if (box === null) throw new Error("the plate has no box");
    const pitch = box.width / 9;
    const centreOf = async (handle: string) => {
      const h = await page
        .locator(`[data-testid="surface-handle"][data-handle="${handle}"]`)
        .boundingBox();
      if (h === null) throw new Error(`no ${handle} handle`);
      return { x: h.x + h.width / 2, y: h.y + h.height / 2 };
    };
    const body = page
      .getByTestId("surface-region")
      .first()
      .locator("rect.body");
    const widthBefore = Number(await body.getAttribute("width"));
    expect(widthBefore).toBeCloseTo(2 * (571 / 9), 3);

    // THE DRAG: the south-east handle sits on the far corner (col 3, row 7
    // in plate units); pulled in three steps to the centre of the cell one
    // column right and two rows down of the far corner cell (2, 6) - that
    // is cell (3, 8) - the fader becomes cols 1-3, rows 1-8: 3 x 8. The
    // proposed bounds are visible while the pointer is down.
    const se = await centreOf("se");
    // The handle is 8 square with a 1px stroke: its centre is within a
    // pixel of the corner.
    expect(Math.abs(se.x - (box.x + 3 * pitch))).toBeLessThan(2);
    expect(Math.abs(se.y - (box.y + 7 * pitch))).toBeLessThan(2);
    const target = { x: box.x + 3.5 * pitch, y: box.y + 8.5 * pitch };
    await page.mouse.move(se.x, se.y);
    await page.mouse.down();
    for (let step = 1; step <= 3; step += 1) {
      await page.mouse.move(
        se.x + ((target.x - se.x) * step) / 3,
        se.y + ((target.y - se.y) * step) / 3,
      );
    }
    await expect(page.getByTestId("surface-proposed")).toBeVisible();
    await page.mouse.up();
    await expect(units).toHaveText("3 × 8 units");
    expect(Number(await body.getAttribute("width"))).toBeGreaterThan(
      widthBefore,
    );
    await expect(page.getByTestId("surface-handle")).toHaveCount(8);
    await expect(sandbox).toHaveAttribute("data-depth", "3");
    expect(await page.getByTestId("surface-proposed").count()).toBe(0);

    // THE REFUSED DRAG: the east handle (col 4, row 5) pulled onto the
    // button's column - cols 1-5 would hold the button's cells (5, 1) and
    // (5, 2) - is section 16's line, naming the button, and the fader is
    // exactly as it was: no entry, the width still 3.
    const e = await centreOf("e");
    await page.mouse.move(e.x, e.y);
    await page.mouse.down();
    await page.mouse.move(box.x + 5.5 * pitch, box.y + 5.5 * pitch, {
      steps: 3,
    });
    await page.mouse.up();
    await expect(status).toContainText("overlaps");
    await expect(status).toHaveText(
      "This region overlaps Button 1. Choose another area or resize it.",
    );
    await expect(units).toHaveText("3 × 8 units");
    await expect(sandbox).toHaveAttribute("data-depth", "3");
    await expect(page.getByTestId("surface-handle")).toHaveCount(8);

    // A HANDLE PUT BACK where it was commits nothing: the north handle
    // pressed and released inside its own cell is no entry.
    const n = await centreOf("n");
    await page.mouse.move(n.x, n.y);
    await page.mouse.down();
    await page.mouse.move(n.x + 3, n.y + 3);
    await page.mouse.up();
    await expect(sandbox).toHaveAttribute("data-depth", "3");
    await expect(units).toHaveText("3 × 8 units");
    // And the refusal has cleared with the next press on the plate.
    await expect(status).not.toContainText("overlaps");

    // ONE UNDO takes the whole drag back: 2 x 6 again, the button still
    // there, the depth two.
    await page.getByTestId("undo").click();
    await expect(units).toHaveText("2 × 6 units");
    await expect(page.getByTestId("inspector-name")).toHaveText("Fader 1");
    await expect(page.getByTestId("surface-count")).toHaveText("2 elements");
    await expect(sandbox).toHaveAttribute("data-depth", "2");

    expect(consoleErrors, "no console error across the drags").toEqual([]);
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test("the selector's walk (change 10A): F arms a fader and a click places it, V is the selector, the body dragged moves it and a drag onto another element is refused, the arrows nudge and Shift-arrows resize it, L places a blank with no MIDI fields, and the plate's delete icon deletes with one Undo back", async ({
    page,
  }) => {
    // Chromium only, at the harness's 1280 x 720 like the handle drag: the
    // body drag is a mouse drag captured by the plate.
    await page.setViewportSize({ width: 1280, height: 720 });
    const consoleErrors = collectErrors(page);
    const plate = await openFresh(page);
    const sandbox = page.getByTestId("sandbox");
    const units = page.getByTestId("inspector-units");
    const status = page.getByTestId("surface-status");
    const body = page
      .getByTestId("surface-region")
      .first()
      .locator("rect.body");
    const pitchUnits = 571 / 9;

    // F ARMS A FADER on the plate; one click places it; V is the selector.
    await plate.focus();
    await page.keyboard.press("f");
    await expect(page.getByTestId("palette-fader")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(plate).toHaveClass(/armed/);
    await expect(status).toContainText("Click a cell to place the Fader.");
    await clickCell(plate, 1, 1);
    await expect(page.getByTestId("surface-count")).toHaveText("1 element");
    await expect(units).toHaveText("2 × 6 units");
    await expect(
      page.getByTestId("palette-fader"),
      "the kind stays armed after a placement",
    ).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("v");
    await expect(page.getByTestId("palette-fader")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(plate).not.toHaveClass(/armed/);
    await expect(sandbox).toHaveAttribute("data-depth", "1");

    // THE BODY DRAG: pressed inside the fader at cell (1, 3) - two rows
    // below its origin - and released at cell (4, 5), the fader's origin is
    // (4, 3); the proposed box follows the pointer; one entry.
    await plate.scrollIntoViewIfNeeded();
    const box = await plate.boundingBox();
    if (box === null) throw new Error("the plate has no box");
    const pitch = box.width / 9;
    const at = (col: number, row: number) => ({
      x: box.x + (col + 0.5) * pitch,
      y: box.y + (row + 0.5) * pitch,
    });
    const from = at(1, 3);
    const to = at(4, 5);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 3 });
    await expect(page.getByTestId("surface-proposed")).toBeVisible();
    await page.mouse.up();
    await expect(sandbox).toHaveAttribute("data-depth", "2");
    await expect(units).toHaveText("2 × 6 units");
    expect(Number(await body.getAttribute("x"))).toBeCloseTo(4 * pitchUnits, 3);
    expect(Number(await body.getAttribute("y"))).toBeCloseTo(3 * pitchUnits, 3);
    expect(await page.getByTestId("surface-proposed").count()).toBe(0);

    // L PLACES A BLANK at (8, 0): one cell, no MIDI fields in its panel,
    // its row in the list; Escape returns to the selector.
    await page.keyboard.press("l");
    await expect(page.getByTestId("palette-blank")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await clickCell(plate, 8, 0);
    await expect(page.getByTestId("surface-count")).toHaveText("2 elements");
    await expect(page.getByTestId("inspector-name")).toHaveText("Blank 1");
    await expect(units).toHaveText("1 × 1 units");
    await expect(page.getByTestId("field-kind")).toHaveText("Blank");
    expect(await page.getByTestId("field-cc").count()).toBe(0);
    expect(await page.getByTestId("field-channel").count()).toBe(0);
    await expect(page.getByTestId("region-swatch")).toBeVisible();
    await expect(page.getByTestId("element-row").nth(1)).toContainText("Blank");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("palette-blank")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(sandbox).toHaveAttribute("data-depth", "3");

    // A REFUSED MOVE: the fader dragged from (4, 3) to (7, 0) would cover the
    // blank's cell; section 16's line names it and the fader is where it was.
    const grab = at(4, 3);
    const onto = at(7, 0);
    await page.mouse.move(grab.x, grab.y);
    await page.mouse.down();
    await page.mouse.move(onto.x, onto.y, { steps: 3 });
    await page.mouse.up();
    await expect(status).toHaveText(
      "This region overlaps Blank 1. Choose another area or resize it.",
    );
    await expect(page.getByTestId("inspector-name")).toHaveText("Fader 1");
    expect(Number(await body.getAttribute("x"))).toBeCloseTo(4 * pitchUnits, 3);
    await expect(sandbox).toHaveAttribute("data-depth", "3");

    // THE ARROWS on the plate: Left nudges the fader one column; Shift+Right
    // widens it; Shift+Up shortens it; each press one entry.
    await page.keyboard.press("ArrowLeft");
    expect(Number(await body.getAttribute("x"))).toBeCloseTo(3 * pitchUnits, 3);
    await expect(sandbox).toHaveAttribute("data-depth", "4");
    await page.keyboard.press("Shift+ArrowRight");
    await expect(units).toHaveText("3 × 6 units");
    await expect(sandbox).toHaveAttribute("data-depth", "5");
    await page.keyboard.press("Shift+ArrowUp");
    await expect(units).toHaveText("3 × 5 units");
    await expect(sandbox).toHaveAttribute("data-depth", "6");

    // THE DELETE ICON on the selection: one click deletes the fader; one
    // Undo brings it back, selected, at its size; the Delete key on the
    // plate deletes it again.
    await expect(page.getByTestId("surface-delete")).toBeVisible();
    await page.getByTestId("surface-delete").click();
    await expect(page.getByTestId("surface-count")).toHaveText("1 element");
    await expect(page.getByTestId("surface-handle")).toHaveCount(0);
    await expect(sandbox).toHaveAttribute("data-depth", "7");
    await page.getByTestId("undo").click();
    await expect(page.getByTestId("surface-count")).toHaveText("2 elements");
    await expect(page.getByTestId("inspector-name")).toHaveText("Fader 1");
    await expect(units).toHaveText("3 × 5 units");
    await expect(page.getByTestId("surface-handle")).toHaveCount(8);
    await plate.focus();
    await page.keyboard.press("Delete");
    await expect(page.getByTestId("surface-count")).toHaveText("1 element");
    await expect(page.getByTestId("element-row")).toHaveCount(1);

    expect(consoleErrors, "no console error on the selector's walk").toEqual(
      [],
    );
  });

  test("Edit -> Play -> Edit with the selection and the undo depth intact, the palette disabled with its reason in Play and a finger reaching the preview", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    const plate = await openFresh(page);
    const sandbox = page.getByTestId("sandbox");

    // Two regions; the FIRST selected; the depth is two.
    await page.getByTestId("palette-button").click();
    await clickCell(plate, 0, 0);
    await page.getByTestId("palette-knob").click();
    await clickCell(plate, 4, 4);
    await expect(sandbox).toHaveAttribute("data-depth", "2");
    await page.getByTestId("element-row").first().click();
    await expect(page.getByTestId("inspector-name")).toHaveText("Button 1");
    await expect(page.getByTestId("surface-handle")).toHaveCount(8);

    // EDIT -> PLAY: the segment is the label around a visually hidden radio.
    await page.getByTestId("segment-play").click();
    await expect(page.getByTestId("mode-play")).toBeChecked();
    await expect(sandbox).toHaveAttribute("data-mode", "play");
    await expect(page.getByTestId("mode-line")).toContainText("Play:");
    await expect(page.getByTestId("palette-fader")).toBeDisabled();
    await expect(page.getByTestId("palette-reason")).toHaveText(
      "In Play, touches go to the surface. Switch to Edit to add elements.",
    );
    await expect(page.getByTestId("surface-handle")).toHaveCount(0);
    await expect(page.getByTestId("field-cc")).toHaveAttribute("readonly", "");
    await expect(page.getByTestId("fields-locked")).toContainText(
      "Switch to Edit to change this element.",
    );
    await expect(page.getByTestId("undo")).toBeDisabled();
    await expect(page.getByTestId("delete-element")).toBeDisabled();
    // The selection and the depth are untouched by the switch.
    await expect(page.getByTestId("inspector-name")).toHaveText("Button 1");
    await expect(page.getByTestId("element-row").first()).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(sandbox).toHaveAttribute("data-depth", "2");

    // A FINGER IN PLAY reaches the preview: the canvas is under the plate,
    // the engine arrives, and a press on the button's cell paints it.
    const canvas = page.locator('[data-testid="pad-canvas-sandbox-preview"]');
    await expect(canvas).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(
      () => {
        const c = document.querySelector(
          '[data-testid="pad-canvas-sandbox-preview"]',
        ) as HTMLCanvasElement | null;
        return c !== null && c.width === 9;
      },
      undefined,
      { timeout: 30_000 },
    );
    const box = await plate.boundingBox();
    if (box === null) throw new Error("no plate");
    const pitch = box.width / 9;
    await page.mouse.move(box.x + 0.5 * pitch, box.y + 0.5 * pitch);
    await page.mouse.down();
    await page.waitForTimeout(150);
    await page.mouse.up();
    // Structure is still what it was: no region was placed by the press.
    await expect(page.getByTestId("surface-count")).toHaveText("2 elements");

    // PLAY -> EDIT: the same region, the same depth, the handles back, and
    // Undo works on the history the switch preserved.
    await page.getByTestId("segment-edit").click();
    await expect(sandbox).toHaveAttribute("data-mode", "edit");
    await expect(page.getByTestId("mode-line")).toContainText("Edit:");
    await expect(page.getByTestId("inspector-name")).toHaveText("Button 1");
    await expect(page.getByTestId("element-row").first()).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(sandbox).toHaveAttribute("data-depth", "2");
    await expect(page.getByTestId("surface-handle")).toHaveCount(8);
    await expect(page.getByTestId("palette-fader")).toBeEnabled();
    await page.getByTestId("undo").click();
    await expect(page.getByTestId("surface-count")).toHaveText("1 element");
    await expect(sandbox).toHaveAttribute("data-depth", "1");

    // The other direction: the knob selected, into Play and back.
    await page.getByTestId("redo").click();
    await page.getByTestId("element-row").nth(1).click();
    await expect(page.getByTestId("inspector-name")).toHaveText("Knob 1");
    await page.getByTestId("segment-play").click();
    await expect(sandbox).toHaveAttribute("data-mode", "play");
    await expect(page.getByTestId("inspector-name")).toHaveText("Knob 1");
    await page.getByTestId("segment-edit").click();
    await expect(page.getByTestId("inspector-name")).toHaveText("Knob 1");
    await expect(sandbox).toHaveAttribute("data-depth", "2");

    expect(consoleErrors, "no console error on the round trip").toEqual([]);
  });
});

test.describe("the Sandbox, with a ZONA that answers from Node", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(FAKE_SERIAL);
  });

  test("the whole loop on a fake: a two-element surface exported as a file, re-imported on My configs, opened, stored on the fake ZONA on one click - the five defaults, five acknowledged writes with 255/4 among them, the store proved - with nothing opening first", async ({
    page,
  }) => {
    // Plan 13-17 (13-CONTEXT D-03, D-14 Q7, D-18, D-19; BUILD-03, BUILD-05,
    // SAFE-01, SAFE-07, SHARE-01). The fake is the node suite's responder,
    // exposed and granted BEFORE the page loads (install.e2e.ts's openReal);
    // every write it acknowledges is counted by class, and nothing here
    // claims a module would answer the same - runbook row M is where that is
    // asked.
    const consoleErrors = collectErrors(page);
    const zona = await installZona(page, {
      sx: 0,
      sy: 0,
      activePage: ACTIVE_PAGE,
      configs: { [EVENT_SETUP]: MODULE_SETUP, [EVENT_TIMER]: MODULE_TIMER },
      system: {
        [EVENT_SETUP]: MODULE_SYSTEM,
        [EVENT_TIMER]: MODULE_SYSTEM_TIMER,
        [EVENT_UTILITY]: MODULE_SYSTEM_UTILITY,
      },
      serial: [0x9abcdef0, 0x13171317, 0, 0],
    });
    await page.addInitScript(() => {
      window.__hangarSerial.grant();
    });

    // THE CODEC IS NOT PART OF THIS LOOP, and that is asserted rather than
    // argued (D-14 Q7): HANGAR's four format letters are still w, x, y, z,
    // the two emitted formats are x and w, and y and z are claimed by nothing
    // - a surface has no stamp, so no letter was allocated for it.
    expect(HANGAR_FORMAT_LETTERS).toEqual(["w", "x", "y", "z"]);
    expect([HANGAR_FORMAT_LUA, HANGAR_FORMAT_LUA_COLOUR].sort()).toEqual([
      "w",
      "x",
    ]);
    for (const letter of ["y", "z"]) {
      expect(
        [HANGAR_FORMAT_LUA, HANGAR_FORMAT_LUA_COLOUR].includes(letter),
        `${letter} is claimed`,
      ).toBe(false);
    }
    // And the codec's SOURCE claims neither: outside the four-letter
    // reservation itself, no string literal "y" or "z" exists in stamp.ts
    // (comments stripped), so a constant allocating one for a surface is
    // red here by letter and not only by the diff.
    const codec = readFileSync(
      new URL("../src/lib/share/stamp.ts", import.meta.url),
      "utf8",
    )
      .replace(/^[ ]*[/][/].*$/gm, "")
      .replace(/[/][*][^]*?[*][/]/g, "")
      .replace(/HANGAR_FORMAT_LETTERS[^;]*;/, "");
    expect(codec.length, "the codec was read").toBeGreaterThan(2000);
    for (const letter of ["y", "z"]) {
      expect(
        codec.includes(`"${letter}"`),
        `stamp.ts claims ${letter} somewhere`,
      ).toBe(false);
    }

    // BUILD: the template's two elements - a 2 x 6 Fader and a 2 x 2 Button,
    // page 3's Filter and Hold - and a name of the surface's own.
    const plate = await openFresh(page);
    await page.getByTestId("template-action").click();
    await expect(page.getByTestId("surface-count")).toHaveText("2 elements");
    await expect(page.getByTestId("element-row").first()).toContainText(
      "Filter",
    );
    await expect(page.getByTestId("element-row").nth(1)).toContainText("Hold");
    await page.getByTestId("rename-surface").click();
    await page.getByTestId("surface-name-field").fill("Loop");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("surface-name")).toHaveText("Loop");
    await expect(plate).toBeVisible();

    // EXPORT AS A FILE, through transfer.ts: the browser's own download, the
    // envelope 13-13 defined, the two regions inside it.
    await expect(page.getByTestId("no-link-explanation")).toContainText(
      "there’s no link to share",
    );
    const downloading = page.waitForEvent("download");
    await page.getByTestId("export-surface").click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe("loop.hangar.json");
    await expect(page.getByTestId("export-outcome")).toHaveText(
      "Exported as loop.hangar.json.",
    );
    const exportedPath = await download.path();
    if (exportedPath === null) throw new Error("the download has no path");
    const exportedText = readFileSync(exportedPath, "utf8");
    const exported = JSON.parse(exportedText) as {
      app: string;
      kind: string;
      record: {
        kind: string;
        name: string;
        surface: { regions: { name: string; kind: string }[] };
      };
    };
    expect(exported.app).toBe("hangar");
    expect(exported.kind).toBe("sandbox");
    expect(exported.record.name).toBe("Loop");
    expect(
      exported.record.surface.regions.map((r) => [r.name, r.kind]),
    ).toEqual([
      ["Filter", "fader"],
      ["Hold", "button"],
    ]);

    // RE-IMPORT on My configs through the same six steps every import takes;
    // the row lands as a saved copy beside the draft, and its Open lands on
    // a fresh surface carrying the two regions - the round trip.
    await page.waitForTimeout(600);
    await page.goto("/my-configs/");
    await expect(page.getByTestId("library-count")).toHaveText(
      "1 saved configuration",
    );
    await page.getByTestId("import-file").setInputFiles({
      name: "loop.hangar.json",
      mimeType: "application/json",
      buffer: Buffer.from(exportedText, "utf8"),
    });
    await expect(page.getByTestId("library-count")).toHaveText(
      "2 saved configurations",
    );
    const imported = page.locator(
      '[data-testid="library-row"][data-status="saved"]',
    );
    await expect(imported).toHaveCount(1);
    await expect(imported.getByTestId("library-name")).toContainText("Loop");
    await imported.getByTestId("library-open").click();
    await expect(page).toHaveURL(/[/]sandbox[/]s-[a-z0-9-]+[/][?]from=/);
    await expect(page.getByTestId("sandbox")).toBeVisible();
    await expect(page.getByTestId("surface-name")).toHaveText("Loop");
    await expect(page.getByTestId("surface-count")).toHaveText("2 elements");
    await expect(page.getByTestId("element-row").first()).toContainText(
      "Filter",
    );
    await expect(page.getByTestId("element-row").nth(1)).toContainText("Hold");

    // CONNECT from the header: the granted port, no picker, heartbeats until
    // the slot reads the identity, then the snapshot of FIVE lands and the
    // destination zone comes up with the module's own pages.
    const slot = page.getByTestId("device-slot");
    await expect(slot).toHaveAttribute("data-hydrated", "true");
    await expect(slot).toHaveAttribute("data-slot", "S2");
    await slot.click();
    let beats = 0;
    for (; beats < 80; beats++) {
      await page.evaluate(
        (hex) => window.__hangarSerial.beat(0, hex),
        zona.heartbeatHex(),
      );
      await page.waitForTimeout(60);
      if ((await slot.getAttribute("data-slot")) === "S4") break;
    }
    await expect(slot).toHaveAttribute("data-slot", "S4");
    await expect(page.getByTestId("status-device")).toHaveText(
      IDENTIFIED_CAPTION,
      { timeout: 10_000 },
    );
    expect(zona.seen("CONFIG", "FETCH"), "the snapshot read five").toBe(5);
    expect(zona.seen("CONFIG", "EXECUTE"), "and wrote nothing").toBe(0);
    const destination = page.getByTestId("destination");
    await expect(destination).toBeVisible();
    await expect(destination).toHaveAttribute("data-status", "reported");
    await expect(page.getByTestId("destination-page")).toHaveValue(
      String(ACTIVE_PAGE),
    );
    await expect(page.getByTestId("store-on-zona")).toBeEnabled({
      timeout: 30_000,
    });
    // No Put back and no Apply anywhere on the page (13.1-06, D-07;
    // 2026-09-16) - the zone is Target, Store on ZONA and nothing else.
    expect(await page.getByTestId("put-back").count()).toBe(0);
    expect(await page.getByTestId("apply-to-zona").count()).toBe(0);
    await expect(page.getByTestId("store-on-zona")).toHaveAttribute(
      "aria-describedby",
      /-honesty [^ ]+-store-line$/,
    );
    expect(await page.getByTestId("store-refusal").count()).toBe(0);

    // STORE ON ZONA: enabled once the landing is measured; nothing is on
    // the wire before the click and nothing opens in the control's place
    // (2026-09-16 change 2).
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(0);
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);
    expect(await page.getByTestId("store-confirm").count()).toBe(0);

    // THE STORE, ON ONE CLICK (2026-09-16: the routes' one write): the five
    // firmware defaults into memory, then the surface's five in SLOTS order
    // - the TRIMMED library halves carrying runtime parts (change 10B), the
    // runtime's 255/4, the packed Timer, the data-half Setup calling
    // ele[#ele]:map() - then one
    // store, proved by the read-back after a heartbeat this loop has to
    // push. The fake's two RAMs and its two flashes hold the surface's five.
    await page.getByTestId("store-on-zona").click();
    expect(await page.getByTestId("store-confirm").count()).toBe(0);
    await expect
      .poll(() => zona.seen("CONFIG", "EXECUTE"), { timeout: 10_000 })
      .toBe(10);
    let storeBeats = 0;
    for (; storeBeats < 24; storeBeats++) {
      await page.evaluate(
        (hex) => window.__hangarSerial.beat(0, hex),
        zona.heartbeatHex(),
      );
      await page.waitForTimeout(120);
      if (
        (await page.getByTestId("status-device").textContent())?.trim() ===
        keptCaption(ACTIVE_PAGE)
      )
        break;
    }
    await expect(page.getByTestId("status-device")).toHaveText(
      keptCaption(ACTIVE_PAGE),
    );
    expect(zona.seen("CONFIG", "EXECUTE"), "the defaults and the five").toBe(
      10,
    );
    expect(zona.seen("HEARTBEAT", "EXECUTE"), "one restore per RAM leg").toBe(
      2,
    );
    expect(zona.seen("PAGESTORE", "EXECUTE"), "one store").toBe(1);
    const systemTimer = zona.state.system?.[EVENT_TIMER] ?? "";
    const system = zona.state.system?.[EVENT_SETUP] ?? "";
    expect(systemTimer.startsWith(TRIMMED_LIBRARY_TIMER), "255/6 trimmed").toBe(
      true,
    );
    expect(system.startsWith(TRIMMED_LIBRARY), "255/0 trimmed").toBe(true);
    expect(systemTimer).not.toBe(TOUCH_LIBRARY_TIMER);
    expect(system).not.toBe(TOUCH_LIBRARY);
    expect(system, "the trim keeps no Q").not.toContain(
      "function Q(s,i,e,x,y)",
    );
    const utility = zona.state.system?.[EVENT_UTILITY] ?? "";
    expect(utility.startsWith("--[[@cb]]"), "255/4 holds a body").toBe(true);
    expect(utility, "the runtime's head").toContain("S=S or{}");
    expect(
      systemTimer + system + utility,
      "the release and the entry landed somewhere",
    ).toMatch(/R=function[\s\S]*O=function|O=function[\s\S]*R=function/);
    expect(utility).not.toBe(MODULE_SYSTEM_UTILITY);
    const setup = zona.state.configs[EVENT_SETUP];
    expect(setup, "the data half pulls the utility in").toContain(
      "ele[#ele]:map()",
    );
    expect(setup).toContain("self:tim()");
    expect(setup).toContain("self.touch_cb=O");
    const timer = zona.state.configs[EVENT_TIMER];
    expect(timer).toContain("gtt(0,100)");
    expect(timer).toContain("X(self,20)");
    expect(zona.state.systemFlash?.[EVENT_UTILITY], "stored too").toBe(utility);
    expect(zona.state.flash?.[EVENT_SETUP], "stored too").toBe(setup);
    // The control is closed with the already-kept reason: the module holds
    // the surface on screen, and nothing on the page would put its own back.
    await expect(page.getByTestId("store-on-zona")).toBeDisabled();
    expect(await page.getByTestId("put-back").count()).toBe(0);
    console.log(
      `the loop on the fake: ${beats + 1} heartbeat(s) to identify, ${storeBeats + 1} to prove the store; 255/4 carried ${utility.length} characters; Setup ${setup.length}, Timer ${timer.length}`,
    );

    expect(consoleErrors, "no console error on the whole loop").toEqual([]);
  });

  test("the options walk (change 10B): a fader set Relative and Spring with a typed spring value, a button set Note and Toggle with a typed note, a knob set Relative - every field one Undo, Min and Max gone under a relative knob, and the draft recovered on a reload", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    const plate = await openFresh(page);
    const sandbox = page.getByTestId("sandbox");

    // THE FADER: F, a click, V; Mode to Relative shows Speed; Spring on
    // shows its value; 100 typed; each an entry.
    await plate.focus();
    await page.keyboard.press("f");
    await clickCell(plate, 0, 0);
    await page.keyboard.press("v");
    await expect(sandbox).toHaveAttribute("data-depth", "1");
    expect(await page.getByTestId("field-speed").count()).toBe(0);
    await page.getByTestId("field-mode").selectOption("relative");
    await expect(page.getByTestId("field-speed")).toBeVisible();
    await expect(sandbox).toHaveAttribute("data-depth", "2");
    await page.getByTestId("field-speed").selectOption("full");
    await expect(sandbox).toHaveAttribute("data-depth", "3");
    expect(await page.getByTestId("field-spring-value").count()).toBe(0);
    await page.getByTestId("field-spring").check();
    await expect(page.getByTestId("field-spring-value")).toHaveValue("64");
    await expect(sandbox).toHaveAttribute("data-depth", "4");
    await page.getByTestId("field-spring-value").fill("200");
    await expect(page.getByTestId("field-spring-value-message")).toContainText(
      "A value is 0 to 127.",
    );
    await page.getByTestId("field-spring-value").fill("100");
    await expect(page.getByTestId("field-spring-value-message")).toHaveCount(0);
    await page.getByTestId("field-spring-value").press("Enter");
    await expect(sandbox).toHaveAttribute("data-depth", "5");
    await page.getByTestId("field-min").fill("127");
    await page.getByTestId("field-min").press("Enter");
    await page.getByTestId("field-max").fill("0");
    await page.getByTestId("field-max").press("Enter");
    await expect(sandbox).toHaveAttribute("data-depth", "7");

    // THE BUTTON: B, a click, Escape; Toggle (never Latch); Output to Note
    // shows the note field, C#3 typed lands 49 and reads back as C#3.
    await plate.focus();
    await page.keyboard.press("b");
    await clickCell(plate, 7, 0);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("inspector-name")).toHaveText("Button 1");
    expect(await page.getByTestId("field-latch").count()).toBe(0);
    await page.getByTestId("field-toggle").check();
    await expect(sandbox).toHaveAttribute("data-depth", "9");
    expect(await page.getByTestId("field-note").count()).toBe(0);
    await page.getByTestId("field-output").selectOption("note");
    await expect(page.getByTestId("field-note")).toBeVisible();
    expect(await page.getByTestId("field-cc").count()).toBe(0);
    await page.getByTestId("field-note").fill("H3");
    await expect(page.getByTestId("field-note-message")).toContainText(
      "A note is C-1 to G9, or 0 to 127.",
    );
    await page.getByTestId("field-note").fill("C#3");
    await page.getByTestId("field-note").press("Enter");
    await expect(page.getByTestId("field-note")).toHaveValue("C#3");
    await expect(sandbox).toHaveAttribute("data-depth", "11");
    await page.getByTestId("field-group").selectOption("3");
    await expect(sandbox).toHaveAttribute("data-depth", "12");

    // THE KNOB: K, a click, Escape; Relative (2's comp.) takes Min and Max away.
    await plate.focus();
    await page.keyboard.press("k");
    await clickCell(plate, 3, 4);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("inspector-name")).toHaveText("Knob 1");
    await expect(page.getByTestId("field-min")).toBeVisible();
    await page.getByTestId("field-mode").selectOption("relative-twos");
    expect(await page.getByTestId("field-min").count()).toBe(0);
    expect(await page.getByTestId("field-max").count()).toBe(0);
    await expect(sandbox).toHaveAttribute("data-depth", "14");
    // One Undo brings the knob's Min back.
    await page.getByTestId("undo").click();
    await expect(page.getByTestId("field-min")).toBeVisible();
    await expect(sandbox).toHaveAttribute("data-depth", "13");
    await page.getByTestId("redo").click();
    await expect(sandbox).toHaveAttribute("data-depth", "14");

    // THE DRAFT: reloaded, the fader's options are what was typed.
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.getByTestId("sandbox")).toBeVisible();
    const again = page.getByTestId("surface-plate");
    await clickCell(again, 0, 0);
    await expect(page.getByTestId("inspector-name")).toHaveText("Fader 1");
    await expect(page.getByTestId("field-mode")).toHaveValue("relative");
    await expect(page.getByTestId("field-speed")).toHaveValue("full");
    await expect(page.getByTestId("field-spring")).toBeChecked();
    await expect(page.getByTestId("field-spring-value")).toHaveValue("100");
    await expect(page.getByTestId("field-min")).toHaveValue("127");
    await expect(page.getByTestId("field-max")).toHaveValue("0");
    await clickCell(again, 7, 0);
    await expect(page.getByTestId("field-toggle")).toBeChecked();
    await expect(page.getByTestId("field-note")).toHaveValue("C#3");
    await expect(page.getByTestId("field-group")).toHaveValue("3");
    await clickCell(again, 4, 5);
    await expect(page.getByTestId("field-mode")).toHaveValue("relative-twos");

    expect(consoleErrors, "no console error on the options walk").toEqual([]);
  });

  test("the Touches walk (change 11): an XY pad's Touches select 1 to 5 with its helper, 3 lands as one entry, a CC number typed too high for the count is refused on its field with the line, a count too high for the controllers is refused on the select with the same line and the select snaps back, and the draft recovered on a reload", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    const plate = await openFresh(page);
    const sandbox = page.getByTestId("sandbox");

    // X, a click, Escape: the pad selected, Touches at 1 with the helper.
    await plate.focus();
    await page.keyboard.press("x");
    await clickCell(plate, 3, 0);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("inspector-name")).toHaveText("XY pad 1");
    await expect(sandbox).toHaveAttribute("data-depth", "1");
    await expect(page.getByTestId("field-touches")).toHaveValue("1");
    await expect(page.getByTestId("region-inspector")).toContainText(
      "Every finger sends on its own pair",
    );
    expect(await page.getByTestId("touches-problem").count()).toBe(0);
    // 3 lands as one entry.
    await page.getByTestId("field-touches").selectOption("3");
    await expect(sandbox).toHaveAttribute("data-depth", "2");
    await expect(page.getByTestId("field-touches")).toHaveValue("3");
    // A CC number typed at 126 is past 3 fingers' ceiling of 123: the line
    // on the field, the model untouched; 120 lands.
    await page.getByTestId("field-cc").fill("126");
    await expect(page.getByTestId("field-cc-message")).toContainText(
      "With 3 touches a CC number is 0 to 123",
    );
    await page.getByTestId("field-cc").fill("120");
    await expect(page.getByTestId("field-cc-message")).toHaveCount(0);
    await page.getByTestId("field-cc").press("Enter");
    await expect(sandbox).toHaveAttribute("data-depth", "3");
    // 5 fingers would put the last pair past 127 with the CC at 120: the
    // select refuses with its line and snaps back to 3; no entry.
    await page.getByTestId("field-touches").selectOption("5");
    await expect(page.getByTestId("touches-problem")).toContainText(
      "With 5 touches a CC number is 0 to 119",
    );
    await expect(page.getByTestId("field-touches")).toHaveValue("3");
    await expect(sandbox).toHaveAttribute("data-depth", "3");
    // 2 lands, the line goes.
    await page.getByTestId("field-touches").selectOption("2");
    await expect(page.getByTestId("touches-problem")).toHaveCount(0);
    await expect(sandbox).toHaveAttribute("data-depth", "4");

    // THE DRAFT: reloaded, the pad reads 2 fingers and CC 120.
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.getByTestId("sandbox")).toBeVisible();
    const again = page.getByTestId("surface-plate");
    await clickCell(again, 4, 1);
    await expect(page.getByTestId("inspector-name")).toHaveText("XY pad 1");
    await expect(page.getByTestId("field-touches")).toHaveValue("2");
    await expect(page.getByTestId("field-cc")).toHaveValue("120");

    expect(consoleErrors, "no console error on the Touches walk").toEqual([]);
  });

  test("the selection walk (change 13A): Shift+click selects two under one group outline, a marquee selects the three it touches, Ctrl+C then Ctrl+V pastes them by the placement rule with auto-numbered names, Ctrl+X cuts them as one Undo, a channel typed over two writes both and reads Mixed when they differ, and a locked element refuses a drag and a delete with its line", async ({
    page,
  }) => {
    // Chromium only, at the harness's 1280 x 720 like the body drag: the
    // marquee and the group drag are mouse drags captured by the plate.
    await page.setViewportSize({ width: 1280, height: 720 });
    const consoleErrors = collectErrors(page);
    const plate = await openFresh(page);
    const sandbox = page.getByTestId("sandbox");
    const status = page.getByTestId("surface-status");
    const count = page.getByTestId("surface-count");
    const pitchUnits = 571 / 9;

    // B, three clicks, V: three buttons across row 0, the last one selected.
    await plate.focus();
    await page.keyboard.press("b");
    await clickCell(plate, 0, 0);
    await clickCell(plate, 3, 0);
    await clickCell(plate, 6, 0);
    await page.keyboard.press("v");
    await expect(count).toHaveText("3 elements");
    await expect(page.getByTestId("inspector-name")).toHaveText("Button 3");
    await expect(sandbox).toHaveAttribute("data-depth", "3");

    // SHIFT+CLICK: a click selects Button 1 alone; Shift and a click on
    // Button 2 makes a set of two - a member outline each, ONE group outline,
    // no handle, the count in the status and the panel, both rows pressed.
    await clickCell(plate, 0, 0);
    await expect(page.getByTestId("inspector-name")).toHaveText("Button 1");
    const box = await plate.boundingBox();
    if (box === null) throw new Error("the plate has no box");
    const pitch = box.width / 9;
    const at = (col: number, row: number) => ({
      x: box.x + (col + 0.5) * pitch,
      y: box.y + (row + 0.5) * pitch,
    });
    await plate.click({
      position: { x: 3.5 * pitch, y: 0.5 * pitch },
      modifiers: ["Shift"],
    });
    await expect(page.getByTestId("surface-member")).toHaveCount(2);
    await expect(page.getByTestId("surface-group")).toHaveCount(1);
    await expect(page.getByTestId("surface-handle")).toHaveCount(0);
    await expect(status).toContainText("2 elements selected.");
    await expect(page.getByTestId("inspector-count")).toHaveText("2 elements");
    await expect(page.getByTestId("region-inspector")).toContainText(
      "SELECTED ELEMENTS / BUTTON",
    );
    await expect(
      page.locator('[data-testid="element-row"][aria-pressed="true"]'),
    ).toHaveCount(2);
    await expect(page.getByTestId("delete-element")).toHaveText(
      "Delete 2 elements",
    );

    // THE MARQUEE: a drag from the empty cell (8, 4) up to (0, 1) draws its
    // box and, on release, selects the three buttons it touches.
    const from = at(8, 4);
    const to = at(0, 1);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 4 });
    await expect(page.getByTestId("surface-marquee")).toBeVisible();
    await page.mouse.up();
    await expect(page.getByTestId("surface-marquee")).toHaveCount(0);
    await expect(page.getByTestId("surface-member")).toHaveCount(3);
    await expect(status).toContainText("3 elements selected.");
    await expect(sandbox).toHaveAttribute("data-depth", "3");

    // CTRL+C, CTRL+V: the three copied, then pasted - the focus cell and the
    // cell down-right of the originals are theirs, so the copies land at the
    // first free origin in reading order, row 2, their layout kept, named
    // Button 4, 5 and 6, selected, one entry.
    await page.keyboard.press("Control+c");
    await expect(status).toHaveText("Copied 3 elements.");
    await page.keyboard.press("Control+v");
    await expect(status).toHaveText("Pasted 3 elements.");
    await expect(count).toHaveText("6 elements");
    await expect(sandbox).toHaveAttribute("data-depth", "4");
    await expect(page.getByTestId("element-row").nth(3)).toContainText(
      "Button 4",
    );
    await expect(page.getByTestId("element-row").nth(5)).toContainText(
      "Button 6",
    );
    const pastedBody = page
      .getByTestId("surface-region")
      .nth(3)
      .locator("rect.body");
    expect(Number(await pastedBody.getAttribute("x"))).toBeCloseTo(0, 3);
    expect(Number(await pastedBody.getAttribute("y"))).toBeCloseTo(
      2 * pitchUnits,
      3,
    );
    await expect(page.getByTestId("surface-member")).toHaveCount(3);

    // CTRL+X: the pasted three cut as one entry; Undo brings them back,
    // selected; Delete on the plate takes them away again.
    await page.keyboard.press("Control+x");
    await expect(status).toHaveText("Cut 3 elements.");
    await expect(count).toHaveText("3 elements");
    await expect(sandbox).toHaveAttribute("data-depth", "5");
    await page.getByTestId("undo").click();
    await expect(count).toHaveText("6 elements");
    await expect(page.getByTestId("surface-member")).toHaveCount(3);
    await plate.focus();
    await page.keyboard.press("Delete");
    await expect(count).toHaveText("3 elements");

    // MULTI-EDIT: Button 1 alone, then Button 2 added; both on channel 1, so
    // the field reads 1; 9 typed writes both (one entry); Button 1 alone set
    // to 3, and the pair reads Mixed.
    await clickCell(plate, 0, 0);
    await expect(page.getByTestId("inspector-name")).toHaveText("Button 1");
    await plate.click({
      position: { x: 3.5 * pitch, y: 0.5 * pitch },
      modifiers: ["Shift"],
    });
    const channel = page.getByTestId("field-channel");
    await expect(channel).toHaveValue("1");
    const depthBefore = Number(await sandbox.getAttribute("data-depth"));
    await channel.fill("9");
    await channel.press("Enter");
    await expect(sandbox).toHaveAttribute(
      "data-depth",
      String(depthBefore + 1),
    );
    await clickCell(plate, 0, 0);
    await expect(page.getByTestId("inspector-name")).toHaveText("Button 1");
    await expect(channel).toHaveValue("9");
    await clickCell(plate, 3, 0);
    await expect(page.getByTestId("inspector-name")).toHaveText("Button 2");
    await expect(channel).toHaveValue("9");
    await channel.fill("3");
    await channel.press("Enter");
    await plate.click({
      position: { x: 0.5 * pitch, y: 0.5 * pitch },
      modifiers: ["Shift"],
    });
    await expect(channel).toHaveValue("");
    await expect(channel).toHaveAttribute("placeholder", "Mixed");
    await expect(page.getByTestId("field-min")).toHaveValue("0");

    // THE LOCK: Button 3 alone, Ctrl+L locks it - the glyph, no handle, the
    // checkbox checked - a body drag to row 4 is refused with its line and
    // the button stays, Delete is refused with its line; unchecked, the
    // handles are back.
    await clickCell(plate, 6, 0);
    await expect(page.getByTestId("inspector-name")).toHaveText("Button 3");
    await page.keyboard.press("Control+l");
    await expect(status).toHaveText("Locked 1 element.");
    await expect(page.getByTestId("surface-lock")).toHaveCount(1);
    await expect(page.getByTestId("surface-handle")).toHaveCount(0);
    await expect(page.getByTestId("field-locked")).toBeChecked();
    const grab = at(6, 0);
    const down = at(6, 4);
    await page.mouse.move(grab.x, grab.y);
    await page.mouse.down();
    await page.mouse.move(down.x, down.y, { steps: 3 });
    await page.mouse.up();
    await expect(status).toHaveText(
      "Button 3 is locked. Unlock it to move or resize it.",
    );
    const third = page
      .getByTestId("surface-region")
      .nth(2)
      .locator("rect.body");
    expect(Number(await third.getAttribute("y"))).toBeCloseTo(0, 3);
    await plate.focus();
    await page.keyboard.press("Delete");
    await expect(status).toHaveText(
      "Button 3 is locked. Unlock it to delete it.",
    );
    await expect(count).toHaveText("3 elements");
    await page.getByTestId("field-locked").uncheck();
    await expect(page.getByTestId("surface-lock")).toHaveCount(0);
    await expect(page.getByTestId("surface-handle")).toHaveCount(8);

    expect(consoleErrors, "no console error on the selection walk").toEqual([]);
  });
});
