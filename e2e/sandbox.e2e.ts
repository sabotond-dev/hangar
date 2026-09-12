// The Sandbox's interface, the browser half (plan 13-16): PDF page 3 at
// /sandbox/ on the deployed bytes under wrangler dev, chromium only.
//
// TWO TITLES. The first builds a surface end to end with clicks and typed
// numbers - element first from the palette, area first with two clicks on
// the plate, selection from the list, a refused width that keeps the last
// valid value, a delete undone, the draft recovered after a reload and the
// meter saying how much room is left. The second is the mode round trip:
// Edit -> Play -> Edit with the same region selected and the same undo
// depth, the palette disabled with its reason and the handles gone in Play,
// and a finger on the plate in Play reaching the preview without an error.
//
// Every click here is Playwright's `click`, a pointer press and release at
// one point; nothing drags. The static host's answer for the dynamic
// segment is asserted too: /sandbox/<id>/ is not a file, the host says 404,
// and the page comes up (src/routes/sandbox/[draftId]/+page.ts).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

import { expect, test, type Locator, type Page } from "@playwright/test";

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
      /[/]sandbox[/]s-[a-z0-9-]+[/]$/.test(at)
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
  await expect(page).toHaveURL(/\/sandbox\/s-[a-z0-9-]+\/$/);
  await expect(page.getByTestId("sandbox")).toBeVisible();
  return page.getByTestId("surface-plate");
}

test.describe("the Sandbox, with no hardware attached", () => {
  test("place, select and edit an element end to end - by clicks and typed numbers, never a drag - with the draft recovered and the meter honest", async ({
    page,
    request,
  }) => {
    const consoleErrors = collectErrors(page);
    const plate = await openFresh(page);
    const url = page.url();

    // THE STATIC HOST'S ANSWER: the surface's address is not a file. The host
    // says 404, and the page is real all the same (the fallback booted it).
    expect((await request.get(url)).status()).toBe(404);

    // THE EMPTY STATE: the real plate, section 8's instruction verbatim, one
    // starter, one template; four palette rows; the list empty.
    await expect(page.getByTestId("sandbox-empty")).toContainText(
      "Add an element, or select an area on the surface.",
    );
    await expect(page.getByTestId("starter-action")).toBeVisible();
    await expect(page.getByTestId("template-action")).toBeVisible();
    await expect(page.getByTestId("surface-count")).toHaveText("0 elements");
    await expect(page.getByTestId("element-list-empty")).toBeVisible();
    await expect(page.getByTestId("palette-fader")).toBeEnabled();
    // Nothing is saved until something is edited.
    expect(await page.getByTestId("status-draft").count()).toBe(0);

    // ELEMENT FIRST: the palette's Fader, then one click on the plate.
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
    await expect(page.getByTestId("inspector-name")).toHaveText("Fader 1");
    await expect(page.getByTestId("inspector-units")).toHaveText("2 × 6 units");
    await expect(page.getByTestId("field-col")).toHaveValue("2");
    await expect(page.getByTestId("field-row")).toHaveValue("2");
    await expect(page.getByTestId("element-row")).toHaveCount(1);
    await expect(page.getByTestId("element-row").first()).toHaveAttribute(
      "aria-current",
      "true",
    );

    // THE DRAFT: saved as it is edited, and the bar says so.
    await expect(page.getByTestId("status-draft")).toHaveText(
      "Draft saved locally",
    );

    // THE NUMERIC PATH: a width typed in moves the region; an out-of-range
    // width keeps the last valid value with its message until corrected.
    const width = page.getByTestId("field-w");
    await width.fill("3");
    await expect(page.getByTestId("inspector-units")).toHaveText("3 × 6 units");
    await width.fill("12");
    await expect(page.getByTestId("field-w-message")).toContainText(
      "A smaller width keeps it inside the 9 × 9.",
    );
    await expect(width).toHaveAttribute("aria-invalid", "true");
    await expect(width).toHaveValue("12");
    await expect(
      page.getByTestId("inspector-units"),
      "the model kept the previous valid value",
    ).toHaveText("3 × 6 units");
    await width.fill("2");
    await expect(page.getByTestId("field-w-message")).toHaveCount(0);
    await expect(page.getByTestId("inspector-units")).toHaveText("2 × 6 units");

    // AREA FIRST: two clicks on empty cells, no drag - a start corner and a
    // far corner - and the region is the box between them.
    await clickCell(plate, 5, 1);
    await expect(page.getByTestId("surface-status")).toContainText(
      "Click the far corner of the area.",
    );
    await expect(page.getByTestId("surface-proposed")).toBeVisible();
    await clickCell(plate, 7, 4);
    await expect(page.getByTestId("surface-count")).toHaveText("2 elements");
    await expect(page.getByTestId("inspector-name")).toHaveText("Fader 2");
    await expect(page.getByTestId("inspector-units")).toHaveText("3 × 4 units");
    await expect(page.getByTestId("field-col")).toHaveValue("6");
    await expect(page.getByTestId("field-row")).toHaveValue("2");

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

    // THE METER: measured, and honest about room.
    await expect(page.getByTestId("meter-line")).toContainText(
      /of 908 · room for about [0-9]+ more/,
      { timeout: 30_000 },
    );

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
    await expect(page.getByTestId("field-w")).toHaveAttribute("readonly", "");
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
