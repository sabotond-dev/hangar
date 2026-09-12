// The Sandbox's interface, the browser half (plan 13-16): PDF page 3 at
// /sandbox/ on the deployed bytes under wrangler dev, chromium only.
//
// THREE TITLES. The first builds a surface end to end with clicks and typed
// numbers - element first from the palette, area first with two clicks on
// the plate, selection from the list, a refused width that keeps the last
// valid value, a delete undone, the draft recovered after a reload and the
// meter saying how much room is left. The second is the mode round trip:
// Edit -> Play -> Edit with the same region selected and the same undo
// depth, the palette disabled with its reason and the handles gone in Play,
// and a finger on the plate in Play reaching the preview without an error.
// The third (13-17) is the whole loop on a fake ZONA: a two-element surface
// exported as a file through transfer.ts, re-imported on My configs, opened
// onto a fresh surface, applied to the fake as five acknowledged writes in
// SLOTS order - 255/4 carrying the runtime's second slot - and put back; the
// codec is asserted untouched on the way (D-14 Q7). Nothing here claims a
// module would answer the same: runbook row M is where that is asked.
//
// Every click here is Playwright's `click`, a pointer press and release at
// one point; nothing drags. The static host's answer for the dynamic
// segment is asserted too: /sandbox/<id>/ is not a file, the host says 404,
// and the page comes up (src/routes/sandbox/[draftId]/+page.ts).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { TOUCH_LIBRARY, TOUCH_LIBRARY_TIMER } from "../src/lib/catalog/library";
import {
  IDENTIFIED_CAPTION,
  restoredCaption,
  settledCaption,
} from "../src/lib/device/install-copy";
import { EVENT_SETUP, EVENT_TIMER, EVENT_UTILITY } from "../src/lib/protocol";
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

test.describe("the Sandbox, with a ZONA that answers from Node", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(FAKE_SERIAL);
  });

  test("the whole loop on a fake: a two-element surface exported as a file, re-imported on My configs, opened, applied to the fake ZONA as five acknowledged writes with 255/4 among them, and put back", async ({
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
    await expect(page.getByTestId("store-on-zona")).toBeDisabled();
    await expect(page.getByTestId("put-back")).toBeVisible();

    // APPLY TO ZONA: enabled once the landing is measured, one click, five
    // acknowledged writes in SLOTS order and the restore heartbeat, PLAYING
    // NOW in the bar - the same write as TRY ON DEVICE, through the one
    // writer. The fake's two RAMs hold the surface's five: the library's two
    // halves, the runtime's second slot in 255/4, the packed Timer, the
    // data-half Setup calling ele[#ele]:map(). Its flash still holds its own.
    const apply = page.getByTestId("apply-to-zona");
    await expect(apply).toBeEnabled({ timeout: 30_000 });
    expect(await page.getByTestId("apply-refusal").count()).toBe(0);
    await apply.click();
    await expect(page.getByTestId("status-device")).toHaveText(
      settledCaption(ACTIVE_PAGE),
      { timeout: 10_000 },
    );
    await expect
      .poll(() => zona.seen("CONFIG", "EXECUTE"), { timeout: 10_000 })
      .toBe(5);
    expect(zona.seen("HEARTBEAT", "EXECUTE")).toBe(1);
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);
    expect(zona.state.system?.[EVENT_TIMER]).toBe(TOUCH_LIBRARY_TIMER);
    expect(zona.state.system?.[EVENT_SETUP]).toBe(TOUCH_LIBRARY);
    const utility = zona.state.system?.[EVENT_UTILITY] ?? "";
    expect(utility.startsWith("--[[@cb]]"), "255/4 holds a body").toBe(true);
    expect(utility, "the runtime's head and release").toContain("R=function");
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
    expect(zona.state.systemFlash?.[EVENT_UTILITY]).toBe(MODULE_SYSTEM_UTILITY);
    expect(zona.state.flash?.[EVENT_SETUP]).toBe(MODULE_SETUP);
    await expect(page.getByTestId("store-on-zona")).toBeEnabled();

    // STORE ON ZONA opens the site's one confirmation in its place and
    // writes nothing; NOT NOW closes it and the control is back.
    await page.getByTestId("store-on-zona").click();
    await expect(page.getByTestId("store-confirm")).toBeVisible();
    expect(await page.getByTestId("store-on-zona").count()).toBe(0);
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);
    await page.getByTestId("keep-confirm-no").click();
    await expect(page.getByTestId("store-on-zona")).toBeVisible();
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);

    // PUT BACK: the module's own five, the utility included - the owner's
    // utility script back on their button - and RESTORED in the bar.
    await page.getByTestId("put-back").click();
    await expect(page.getByTestId("status-device")).toHaveText(
      restoredCaption(ACTIVE_PAGE),
      { timeout: 10_000 },
    );
    await expect
      .poll(() => zona.seen("CONFIG", "EXECUTE"), { timeout: 10_000 })
      .toBe(10);
    expect(zona.state.system?.[EVENT_UTILITY]).toBe(MODULE_SYSTEM_UTILITY);
    expect(zona.state.system?.[EVENT_TIMER]).toBe(MODULE_SYSTEM_TIMER);
    expect(zona.state.system?.[EVENT_SETUP]).toBe(MODULE_SYSTEM);
    expect(zona.state.configs[EVENT_SETUP]).toBe(MODULE_SETUP);
    expect(zona.state.configs[EVENT_TIMER]).toBe(MODULE_TIMER);
    expect(zona.seen("PAGESTORE", "EXECUTE"), "nothing stored").toBe(0);
    console.log(
      `the loop on the fake: ${beats + 1} heartbeat(s) to identify; 255/4 carried ${utility.length} characters; Setup ${setup.length}, Timer ${timer.length}`,
    );

    expect(consoleErrors, "no console error on the whole loop").toEqual([]);
  });
});
