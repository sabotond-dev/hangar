// PREV-01, PREV-02 and D-10: the browser half of the front door.
//
// Six tests. Three from plan 04-06 (an animated pad moves, a static one does
// not, the row steps and wraps) and three from plan 04-07 (the splash opens the
// door and clears itself, any key cuts to the dissolve, and reduced motion
// stills the pads while making stepping instant).
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

  test("the splash opens the front door and clears itself", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await page.goto("/");

    // data-phase rather than a stopwatch. Timing a 1.84s sequence with
    // waitForTimeout is a flake generator on a busy machine; reading the phase
    // the component publishes is deterministic.
    const splash = page.getByTestId("splash");
    await expect(splash).toHaveAttribute("data-phase", /^(in|hold)$/);

    // The claim the whole splash exists to make: the machines are already
    // running underneath it, not started when it clears (04-UI-SPEC W-10).
    await expect(page.getByTestId("coverflow")).toBeAttached();

    // It clears itself. How fast is not the assertion - that it goes is.
    await expect(splash).toHaveCount(0, { timeout: 5_000 });
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveCSS("opacity", "1");

    expect(consoleErrors).toEqual([]);
  });

  test("any key cuts straight to the dissolve", async ({ page }) => {
    const consoleErrors = collectErrors(page);
    await page.goto("/");

    const splash = page.getByTestId("splash");
    await expect(splash).toHaveAttribute("data-phase", "hold");

    await page.keyboard.press("KeyH");
    await expect(splash).toHaveAttribute("data-phase", "dissolve", {
      timeout: 250,
    });

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("the front door for a visitor who asked for less motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("reduced motion stills the pads and makes stepping instant", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);

    // BOTH, and the explicit call is not belt-and-braces. Measured here on
    // 2026-09-04 with Playwright 1.62.1: test.use({ reducedMotion }) alone left
    // window.matchMedia("(prefers-reduced-motion: reduce)").matches reporting
    // false inside the page, and HANGAR reads the preference in JavaScript -
    // src/lib/sim/host.ts subscribes to that media query to still the engines -
    // so the declarative option alone would have tested the full-motion path
    // under a reduced-motion title. emulateMedia comes BEFORE goto so the page
    // arrives stilled rather than being stilled after it has started moving.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    // The host resets every engine and runs it to tick 64, then freezes it.
    // golden-frames.json samples ticks 0, 37, 101, 500 and 1009 and therefore
    // pins no preset at 64, so what is asserted here is the pair of properties
    // that matter rather than an exact frame: lit, and unchanging.
    await waitForPicture(page, "aurora");
    const first = await sample(page, "aurora");
    expect(first, "the hero canvas was readable").not.toBeNull();
    const lit = (first as string).split(",").filter((b) => b !== "0").length;
    expect(
      lit,
      "the still representative frame must show colour, not a black square",
    ).toBeGreaterThan(0);

    await page.waitForTimeout(400);
    expect(
      await sample(page, "aurora"),
      "reduced motion holds one frame; 400ms of wall clock must not move it",
    ).toBe(first);

    await expect(page.getByTestId("splash")).toHaveCount(0, { timeout: 5_000 });

    const band = page.getByTestId("coverflow");
    await band.press("ArrowRight");
    await expect(band).toHaveAttribute(
      "aria-activedescendant",
      "slot-pinwheel",
    );
    const duration = await page
      .locator("#slot-pinwheel")
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration, "stepping is instant under reduced motion").toBe("0s");

    expect(consoleErrors).toEqual([]);
  });
});
