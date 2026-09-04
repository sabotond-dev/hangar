// PREV-01, PREV-02 and D-10: the browser half of the front door.
//
// What this file covers: that the row is really running the firmware simulator
// with nothing plugged in (an animated pad provably changes between two samples
// of its own canvas), that the honesty of the classification holds in the other
// direction too (a pad the catalog calls static provably does not change), and
// that the row steps from the keyboard and wraps at both ends.
//
// Everything here runs against build/ served by worker/index.js under
// wrangler dev - the deployed bytes, not a dev server - so a pad that only
// animates in development is a red test rather than a nice demo.
//
// What this file cannot cover: Web Serial. It is an operating-system
// capability with no CDP domain and no fake-device hook, so the device half of
// this phase is a human check with a real ZONA on the desk. Nothing below opens
// a port or writes a byte.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { expect, test, type Page } from "@playwright/test";

const canvasOf = (id: string) => `[data-testid="pad-canvas-${id}"]`;

/**
 * The 9x9 backing store as a comma-joined string of its 324 RGBA bytes, or null
 * when the element or its context is missing. A string rather than an array so
 * an assertion diff is one line instead of 324.
 */
function sample(page: Page, id: string): Promise<string | null> {
  return page.evaluate((sel) => {
    const c = document.querySelector(sel) as HTMLCanvasElement | null;
    if (!c) return null;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    return Array.from(ctx.getImageData(0, 0, 9, 9).data).join(",");
  }, canvasOf(id));
}

/**
 * Wait until the pad has a picture at all. Sampling before this point compares
 * two empty canvases, which is a test that passes for the wrong reason - and
 * the canvases genuinely are empty for a moment, because the simulator arrives
 * through a dynamic import after the prerendered frames have already painted.
 */
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

/**
 * The protocol package logs at console.log from module scope and the decoder
 * logs every rejected frame, so only error-level messages are collected. An
 * unfiltered assertion would be permanently red for reasons that are not
 * errors. (e2e/skeleton.e2e.ts)
 */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

test.describe("the front door, with no hardware attached", () => {
  test("the front door animates", async ({ page }) => {
    const consoleErrors = collectErrors(page);
    await page.goto("/");

    await expect(page.getByTestId("coverflow")).toBeVisible();
    // aurora's motion is declared `animated` in src/lib/catalog/front-door.ts
    // and that declaration is derived from golden-frames.json by
    // front-door.spec.ts, so this test and that gate cannot disagree.
    await waitForPicture(page, "aurora");

    const first = await sample(page, "aurora");
    expect(first, "the hero canvas was readable").not.toBeNull();
    expect(
      (first as string).split(",").some((b) => b !== "0"),
      "the hero canvas has a picture before the two samples are compared",
    ).toBe(true);

    await page.waitForTimeout(400);
    const second = await sample(page, "aurora");
    expect(second, "the hero canvas was still readable").not.toBeNull();
    expect(
      second,
      "aurora is declared animated, so 400ms of firmware ticks must move it",
    ).not.toBe(first);

    expect(consoleErrors).toEqual([]);
  });

  test("a still configuration really is still", async ({ page }) => {
    const consoleErrors = collectErrors(page);
    await page.goto("/");

    const band = page.getByTestId("coverflow");
    await expect(band).toBeVisible();
    await expect(band).toHaveAttribute("aria-activedescendant", "slot-aurora");

    // ninepads is index 2 of the ring: two steps right from the opening centre.
    await band.press("ArrowRight");
    await band.press("ArrowRight");
    await expect(band).toHaveAttribute(
      "aria-activedescendant",
      "slot-ninepads",
    );
    // The slot transition is 420ms; let it land before reading pixels.
    await page.waitForTimeout(500);
    await waitForPicture(page, "ninepads");

    const first = await sample(page, "ninepads");
    expect(first, "the ninepads canvas was readable").not.toBeNull();
    expect(
      (first as string).split(",").some((b) => b !== "0"),
      "a static pad still shows its real lit picture, never a black square",
    ).toBe(true);

    await page.waitForTimeout(400);
    const second = await sample(page, "ninepads");
    expect(
      second,
      "ninepads is declared static, so its picture must not move on its own",
    ).toBe(first);

    expect(consoleErrors).toEqual([]);
  });

  test("the row steps with the keyboard and wraps", async ({ page }) => {
    const consoleErrors = collectErrors(page);
    await page.goto("/");

    const band = page.getByTestId("coverflow");
    await expect(band).toBeVisible();
    await expect(band).toHaveAttribute("aria-activedescendant", "slot-aurora");

    // One step left from index 0 is the wrap: the ring's last entry is dial.
    await band.press("ArrowLeft");
    await expect(band).toHaveAttribute("aria-activedescendant", "slot-dial");

    await band.press("ArrowRight");
    await band.press("ArrowRight");
    await expect(band).toHaveAttribute(
      "aria-activedescendant",
      "slot-pinwheel",
    );

    await band.press("Home");
    await expect(band).toHaveAttribute("aria-activedescendant", "slot-aurora");

    expect(consoleErrors).toEqual([]);
  });
});
