// KEEP-01..06 and SHARE-03, the browser half (plan 13-13): My configs at
// /my-configs/ - PDF page 4 - on the deployed bytes under wrangler dev.
//
// ONE TITLE, chromium only, in the plan's order: the page with nothing saved;
// a planted draft becomes the resume banner and a `Draft` row with a LIVE
// thumbnail; a file that is not HANGAR's is REFUSED through the real
// <input type="file"> with the reason explained and NOTHING written; a good
// file is imported and OPENS (section 11: validated before opening); the row
// is there on return as `Saved`; `Export` really downloads the file and the
// bytes are the envelope; `Delete` is undoable for the session. The two
// fixtures are committed beside this test under e2e/fixtures/library/:
// euclid-copy.hangar.json is a real export written by transfer.ts against the
// catalog as it stood on 2026-09-11 (its `rack` is euclid's six knobs; a
// resized knob turns this import `older` and this title red, which is the
// point), and somebody-elses.json carries `app: "grid-editor"`.
//
// The store is seeded by hand in the record's own shape (schema.ts), the way
// first-experience.e2e.ts plants the intro's draft.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";

const fixture = (name: string) =>
  fileURLToPath(new URL(`./fixtures/library/${name}`, import.meta.url));

const canvasOf = (id: string) => `[data-testid="pad-canvas-${id}"]`;

/** True once the host has painted a non-zero byte into the 9x9 store. */
async function waitForPicture(page: Page, id: string): Promise<void> {
  await page.waitForFunction(
    (sel) => {
      const c = document.querySelector(sel) as HTMLCanvasElement | null;
      if (!c) return false;
      const ctx = c.getContext("2d");
      if (!ctx) return false;
      return ctx.getImageData(0, 0, 9, 9).data.some((b) => b !== 0);
    },
    canvasOf(id),
    { timeout: 30_000 },
  );
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

test.describe("My configs, with no hardware attached", () => {
  test("a refused import is explained and writes nothing, a good one opens, and the library is a live table with a draft banner, export and undoable delete", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);

    // NOTHING SAVED: the frame, the headline, the empty sentence, four rail
    // rows at 00, and no banner.
    await page.goto("/my-configs/");
    await expect(page.getByTestId("my-configs")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Pick up where you left off.",
    );
    await expect(page.getByTestId("library-empty")).toContainText(
      "Nothing saved yet.",
    );
    await expect(page.getByTestId("library-count")).toHaveText(
      "0 saved configurations",
    );
    const rail = page.getByTestId("shell-rail");
    await expect(rail.locator('[data-row="all"]')).toContainText("All saved");
    await expect(rail.locator('[data-row="all"]')).toContainText("00");
    await expect(rail.locator('[data-row="drafts"]')).toContainText("00");
    expect(await page.getByTestId("resume-banner").count()).toBe(0);
    // The nav's MY CONFIGS is current; the breadcrumb is the PDF's.
    await expect(page.getByTestId("shell")).toContainText("YOUR LIBRARY");

    // A DRAFT, planted in the store's own shape, twelve minutes old.
    await page.evaluate(() => {
      const at = new Date(Date.now() - 12 * 60_000).toISOString();
      localStorage.setItem(
        "hangar.drafts.v1",
        JSON.stringify({
          schema: 1,
          drafts: {
            "playground:arc": {
              schema: 1,
              id: "playground:arc",
              name: "Arc — slow bloom",
              kind: "playground",
              source: "arc",
              knobIndices: [1, 0, 0, 0, 0],
              createdAt: at,
              editedAt: at,
            },
          },
        }),
      );
    });
    await page.reload();
    await expect(page.getByTestId("my-configs")).toBeVisible();

    // The banner is the newest draft, with the PDF's meta line.
    const banner = page.getByTestId("resume-banner");
    await expect(banner).toBeVisible();
    await expect(page.getByTestId("resume-title")).toHaveText(
      "Arc — slow bloom",
    );
    await expect(page.getByTestId("resume-meta")).toHaveText(
      "Draft · Modulation · Last edited 12 minutes ago",
    );
    // The codec arrives after the frame; the link carries the draft's stamp
    // once it has (a retrying assertion, not a snapshot).
    await expect(page.getByTestId("resume-draft")).toHaveAttribute(
      "href",
      /^\/playground\/arc\/#z\./,
    );

    // The table: one row, the Draft chip in its own word, Today's moment.
    const rows = page.getByTestId("library-row");
    await expect(rows).toHaveCount(1);
    await expect(page.getByTestId("library-count")).toHaveText(
      "1 saved configuration",
    );
    await expect(page.getByTestId("library-status")).toHaveText("Draft");
    await expect(page.getByTestId("library-status")).toHaveAttribute(
      "data-status",
      "draft",
    );
    await expect(page.getByTestId("library-type")).toHaveText("Modulation");
    await expect(page.getByTestId("library-edited")).toContainText("Today,");
    await expect(rail.locator('[data-row="all"]')).toContainText("01");
    await expect(rail.locator('[data-row="drafts"]')).toContainText("01");

    // LIVE, not stored: the row's thumbnail and the banner's both paint.
    await waitForPicture(page, "playground:arc");
    await waitForPicture(page, "resume:playground:arc");

    // A REFUSED IMPORT: somebody else's JSON through the real file input.
    // The reason is explained, nothing is written, the table is unchanged.
    await page
      .getByTestId("import-file")
      .setInputFiles(fixture("somebody-elses.json"));
    const notice = page.getByTestId("library-notice");
    await expect(notice).toContainText("Couldn't import somebody-elses.json.");
    await expect(notice).toContainText("This file wasn't exported by HANGAR.");
    await expect(rows).toHaveCount(1);
    expect(
      await page.evaluate(() => localStorage.getItem("hangar.library.v1")),
      "NOTHING IS WRITTEN on a refused import",
    ).toBeNull();

    // A GOOD IMPORT opens: the workspace at the record's stamp.
    await page
      .getByTestId("import-file")
      .setInputFiles(fixture("euclid-copy.hangar.json"));
    await page.waitForURL(/\/playground\/euclid\/#z\./, { timeout: 30_000 });
    await expect(page.getByTestId("workspace")).toBeVisible();
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("hangar.library.v1") ?? "null"),
    );
    expect(stored?.copies?.["copy:euclid:fixture"]).toMatchObject({
      schema: 1,
      kind: "playground",
      name: "Euclid copy",
      source: "euclid",
      knobIndices: [4, 1, 1, 2, 3, 1],
    });

    // BACK: the copy is a `Saved` row beside the `Draft` row - two words for
    // two objects - and the count says two.
    await page.goto("/my-configs/");
    await expect(rows).toHaveCount(2);
    await expect(page.getByTestId("library-count")).toHaveText(
      "2 saved configurations",
    );
    const saved = rows.filter({ has: page.locator('[data-status="saved"]') });
    await expect(saved).toHaveCount(1);
    await expect(saved.getByTestId("library-name")).toHaveText("Euclid copy");
    await expect(saved.getByTestId("library-status")).toHaveText("Saved");
    await expect(saved.getByTestId("library-open")).toHaveAttribute(
      "href",
      /^\/playground\/euclid\/#z\./,
    );
    await expect(rail.locator('[data-row="all"]')).toContainText("02");
    await expect(rail.locator('[data-row="drafts"]')).toContainText("01");

    // The Drafts row narrows the table to the first store.
    await rail.locator('[data-row="drafts"]').click();
    await expect(rows).toHaveCount(1);
    await expect(page.getByTestId("library-status")).toHaveText("Draft");
    await rail.locator('[data-row="all"]').click();
    await expect(rows).toHaveCount(2);

    // EXPORT really downloads: the file name is the record's, the bytes are
    // the envelope with the record intact.
    const download = page.waitForEvent("download");
    await saved.getByTestId("library-export").click();
    const file = await download;
    expect(file.suggestedFilename()).toBe("euclid-copy.hangar.json");
    const path = await file.path();
    const exported = JSON.parse(readFileSync(path, "utf8"));
    expect(exported.app).toBe("hangar");
    expect(exported.schema).toBe(1);
    expect(exported.kind).toBe("playground");
    expect(exported.record.name).toBe("Euclid copy");
    expect(exported.rack.length).toBe(6);

    // DELETE, then UNDO, for the session.
    await saved.getByTestId("library-delete").click();
    await expect(notice).toContainText("Deleted Euclid copy.");
    await expect(rows).toHaveCount(1);
    await page.getByTestId("library-undo").click();
    await expect(notice).toContainText("Euclid copy is back.");
    await expect(rows).toHaveCount(2);

    // The search narrows by name; the miss is section 16's own sentence.
    await page.getByTestId("library-search").fill("nothing like this");
    await expect(page.getByTestId("library-empty")).toContainText(
      "No configurations found.",
    );
    await page.getByTestId("library-search").fill("euclid");
    await expect(rows).toHaveCount(1);

    expect(consoleErrors).toEqual([]);
  });
});
