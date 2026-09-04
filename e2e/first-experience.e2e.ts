// PREV-01, PREV-02 and D-10: the browser half of the front door.
//
// Eleven tests. Three from plan 04-06 (an animated pad moves, a static one does
// not, the row steps and wraps), three from plan 04-07 (the splash opens the
// door and clears itself, any key cuts to the dissolve, and reduced motion
// stills the pads while making stepping instant), two from plan 04-08
// (choosing reveals the panel and both ways out close it, and the device
// control on a browser with no Web Serial) and three from plan 04-09 (a deep
// link lands centred, alive and with no splash; every routed configuration is a
// real file with its own description while an off-row page is a row of one -
// amended by plan 05.1-05, see below; and the row's paint rate over two
// seconds, recorded rather than gated).
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
// a port or writes a byte. What CAN be proven in a browser is the branch a
// large share of visitors actually land on - no Web Serial at all - and that is
// the last test in this file.
//
// AMENDMENT (D-07, plan 05.1-05), to ONE test - the deep-link file test, whose
// title changed with it. One test in, one test out; the file's count did not
// move.
//
// What it asserted before: every FRONT_DOOR id is a real file with its own
// description, and every EXCLUDED_FROM_ROW id returns 404. That second half was
// correct and is now WRONG - D-07 gives every catalog entry an address, so the
// eight ids it demanded a 404 from are eight of the sixteen pages the site now
// ships. The assertion is REWRITTEN rather than deleted, because what it was
// really guarding is still worth guarding: that the set of addresses the site
// serves is exactly the set it declares. It now reads ROUTED and asserts
// sixteen 200s with unique descriptions, and the 404 half moved to a genuinely
// unknown id, which is the only kind left.
//
// It gained the claim D-07 makes and nothing else was: an off-row page is a
// ROW OF ONE. /c/euclid/ shows exactly one pad and a name plate with no arrows;
// /c/aurora/ still shows the shelf with both arrows and still wraps onto the
// ring's last entry. Both sides, because the solo assertion alone would pass on
// a broken row.
//
// The single-deliberate-console-error assertion is kept exactly as it was. It
// is still exactly one 404: the two new navigations are to real pages.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { expect, test, type Page } from "@playwright/test";
// The row itself, not a copy of it. src/lib/catalog/front-door.ts imports
// nothing at all - that is the whole reason it exists as a separate module - so
// pulling it into a Playwright file costs nothing and means a row that grows is
// covered here without anyone editing a list of ids.
import { FRONT_DOOR } from "../src/lib/catalog/front-door";
// The routed set, by its one name. src/lib/catalog/listing.ts imports nothing at
// runtime either, so this costs a Playwright file nothing.
import { ROUTED } from "../src/lib/catalog/listing";

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

/**
 * Wait for the opening to take itself off the page. A test that chooses while
 * the splash is still up is racing two keydown listeners - the splash's skip
 * and the row's - for one key press, and the panel it asserts on would be
 * rendered underneath a layer that covers the viewport.
 */
async function waitForFrontDoor(page: Page): Promise<void> {
  await expect(page.getByTestId("splash")).toHaveCount(0, { timeout: 5_000 });
  await expect(page.getByTestId("coverflow")).toBeVisible();
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

test.describe("choosing the centre pad", () => {
  test("choosing reveals the panel, and Escape and Back both close it", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await page.goto("/");
    await waitForFrontDoor(page);

    // Counted AFTER the row is up and the opening has cleared, so a zero here
    // is a real absence rather than a document that has not hydrated yet.
    // D-05: nothing about the device exists until a visitor asks for it.
    expect(
      await page.getByTestId("chosen-panel").count(),
      "nothing about the device is on the page before a choose",
    ).toBe(0);

    // THE TAP RULE, both halves (D-11, 04-UI-SPEC W-15). The hero is an
    // instrument before it is a link, so a press that lingers plays the pad and
    // does not choose; one under 250 ms and 6 px does both. Without the
    // negative half this would pass on an implementation where every press
    // chooses, which is exactly the collision the rule exists to prevent.
    const hero = page.getByTestId("pad-aurora");
    const box = await hero.boundingBox();
    expect(box, "the hero pad was measurable").not.toBeNull();
    const cx = (box as { x: number; width: number }).x + 40;
    const cy = (box as { y: number; height: number }).y + 40;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.waitForTimeout(350);
    await page.mouse.up();
    expect(
      await page.getByTestId("chosen-panel").count(),
      "a press longer than the tap window plays the pad and does not choose",
    ).toBe(0);

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.up();
    await expect(
      page.getByTestId("chosen-panel"),
      "a quick tap on the hero both plays it and chooses it",
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("chosen-panel")).toHaveCount(0);

    const band = page.getByTestId("coverflow");
    await band.press("Enter");

    const panel = page.getByTestId("chosen-panel");
    await expect(panel).toBeVisible();
    await expect(panel.getByTestId("try-on-device")).toBeVisible();
    // Secondary, and really disabled rather than merely styled that way.
    const keep = panel.getByTestId("keep-on-device");
    await expect(keep).toBeVisible();
    await expect(keep).toBeDisabled();
    await expect(panel.getByTestId("tuning-reserved")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("chosen-panel")).toHaveCount(0);

    // The same gesture by the other route: choosing pushed a shallow history
    // entry, so the browser Back button is Escape (04-UI-SPEC W-16).
    await band.press("Enter");
    await expect(page.getByTestId("chosen-panel")).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId("chosen-panel")).toHaveCount(0);

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("the front door on a browser that cannot install", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      // serial is an accessor on Navigator.prototype - deleting it off the
      // instance returns true and removes nothing. (e2e/skeleton.e2e.ts)
      delete (Navigator.prototype as unknown as Record<string, unknown>).serial;
    });
  });

  test("with no Web Serial the control is present, disabled, and says why", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await page.goto("/");

    // Precondition, asserted. A degrade test that does not verify its own
    // precondition passes for the wrong reason.
    expect(await page.evaluate(() => "serial" in navigator)).toBe(false);

    await waitForFrontDoor(page);
    await page.getByTestId("coverflow").press("Enter");
    await expect(page.getByTestId("chosen-panel")).toBeVisible();

    // DEGR-02: present and disabled, never hidden.
    const tryOn = page.getByTestId("try-on-device");
    await expect(tryOn).toBeVisible();
    await expect(tryOn).toBeDisabled();

    const status = page.getByTestId("connect-status");
    await expect(status).toContainText("Firefox 151");
    const reason = await status.innerText();
    for (const named of ["Chrome", "Edge", "Firefox 151"]) {
      expect(reason, `the reason names ${named}`).toContain(named);
    }
    // CONN-01 is a capability test, never a browser test, and no visitor-facing
    // string names an engine.
    expect(await page.locator("body").innerText()).not.toContain("Chromium");

    // The secondary control degrades too, for its own separate reason.
    const keep = page.getByTestId("keep-on-device");
    await expect(keep).toBeVisible();
    await expect(keep).toBeDisabled();

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

test.describe("a deep link to one configuration", () => {
  test("a deep link lands with that configuration centred and skips the splash", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await page.goto("/c/radar/");

    // THE PRECONDITION FIRST. locator.count() does not auto-wait, so a count
    // taken against a document that has not hydrated is zero for the wrong
    // reason. Waiting for the row to be visible is what makes the zero below
    // mean "no splash was ever rendered" rather than "nothing has rendered".
    const band = page.getByTestId("coverflow");
    await expect(band).toBeVisible();
    expect(
      await page.getByTestId("splash").count(),
      "a shared link opens fast: the opening is for the front door (D-12)",
    ).toBe(0);

    await expect(band).toHaveAttribute("aria-activedescendant", "slot-radar");
    await expect(page.getByTestId("nameplate-name")).toHaveText("Radar");

    // Centred, named - and ALIVE. Without this the test would prove that a deep
    // link arrives at the right markup, which is not the claim being made.
    await waitForPicture(page, "radar");
    const first = await sample(page, "radar");
    expect(first, "the deep-linked hero canvas was readable").not.toBeNull();
    await page.waitForTimeout(400);
    expect(
      await sample(page, "radar"),
      "radar is declared animated, so a deep link must arrive at a running pad",
    ).not.toBe(first);

    expect(consoleErrors).toEqual([]);
  });

  test("every configuration is a real file with its own description, and an off-row page is a row of one", async ({
    page,
    request,
  }) => {
    const consoleErrors = collectErrors(page);
    const descriptions = new Map<string, string>();

    for (const entry of ROUTED) {
      const response = await request.get(`/c/${entry.id}/`);
      expect(response.status(), `/c/${entry.id}/ is served`).toBe(200);
      const body = await response.text();
      const match = /<meta name="description" content="([^"]*)"/.exec(body);
      expect(match, `/c/${entry.id}/ carries a description`).not.toBeNull();
      const description = (match as RegExpExecArray)[1];
      expect(
        description.length,
        `/c/${entry.id}/'s description is not empty`,
      ).toBeGreaterThan(0);
      descriptions.set(entry.id, description);
    }

    // Non-vacuity: an accidentally shortened routed set would otherwise make
    // the loop above pass on fewer pages instead of failing on the missing ones.
    expect(
      descriptions.size,
      "every catalog entry has an address (D-07)",
    ).toBeGreaterThanOrEqual(16);

    // Its OWN description, not the site's. One real file per configuration with
    // its own head is what makes Phase 5's link unfurls possible at all.
    expect(
      new Set(descriptions.values()).size,
      "two configurations must not share one description",
    ).toBe(descriptions.size);

    // AN OFF-ROW PAGE IS A ROW OF ONE. euclid is in the catalog and not in the
    // row, so its page must be about euclid rather than about the shelf: one
    // pad, and a name plate with no arrows to a row it is not in.
    await page.goto("/c/euclid/");
    await expect(page.getByTestId("coverflow")).toBeVisible();
    const soloPads = page.locator('[data-testid^="pad-canvas-"]');
    await expect(soloPads, "an off-row page shows one pad").toHaveCount(1);
    await expect(page.getByTestId("pad-canvas-euclid")).toBeVisible();
    await expect(
      page.getByTestId("nameplate-prev"),
      "a row of one has nowhere to step back to",
    ).toHaveCount(0);
    await expect(page.getByTestId("nameplate-next")).toHaveCount(0);

    // BOTH SIDES, or the solo assertion above could pass on a broken row. A row
    // entry keeps Phase 4's ring exactly as it shipped: several pads, both
    // arrows, and one step left from the opening centre wrapping onto the
    // ring's LAST entry - which is what proves the whole row is still there
    // rather than only the pads that happen to be in the visible window.
    await page.goto("/c/aurora/");
    const band = page.getByTestId("coverflow");
    await expect(band).toBeVisible();
    await expect(
      page.locator('[data-testid^="pad-canvas-"]'),
      "a row entry still opens on the shelf",
    ).not.toHaveCount(1);
    await expect(page.getByTestId("pad-canvas-aurora")).toBeVisible();
    await expect(page.getByTestId("nameplate-prev")).toHaveCount(1);
    await expect(page.getByTestId("nameplate-next")).toHaveCount(1);
    await expect(band).toHaveAttribute(
      "aria-activedescendant",
      `slot-${FRONT_DOOR[0].id}`,
    );
    await band.press("ArrowLeft");
    await expect(band).toHaveAttribute(
      "aria-activedescendant",
      `slot-${FRONT_DOOR[FRONT_DOOR.length - 1].id}`,
    );

    // And an address nobody has heard of is still not a dead end: the static
    // host serves the fallback with a 404, the client router matches /c/[id],
    // and the shelf comes up centred on its first entry with a line saying so.
    // Since D-07 every catalog id resolves, so the unknown id is a genuinely
    // unknown one rather than a deliberately excluded entry.
    const unknown = "no-such-configuration";
    const missing = await request.get(`/c/${unknown}/`);
    expect(
      missing.status(),
      `/c/${unknown}/ is not a page and the static host says so`,
    ).toBe(404);

    await page.goto(`/c/${unknown}/`);
    await expect(page.getByTestId("coverflow")).toBeVisible();
    await expect(page.getByTestId("coverflow")).toHaveAttribute(
      "aria-activedescendant",
      `slot-${FRONT_DOOR[0].id}`,
    );
    await expect(page.getByTestId("fidelity-notice")).toHaveText(
      "Never heard of that one. Here is the shelf instead.",
    );

    // That navigation was deliberately to a 404, and the browser logs one error
    // for it. This is the only test in the file that cannot assert an empty
    // console, so the exception is narrow and asserted from both sides: exactly
    // one message, and nothing in it that is not about the status code.
    expect(
      consoleErrors.filter((message) => !message.includes("404")),
      "no console error beyond the deliberate one",
    ).toEqual([]);
    expect(
      consoleErrors.length,
      "the deliberate 404 was logged exactly once",
    ).toBe(1);
  });
});

test.describe("the row's frame budget, on the record", () => {
  test("the row's painted frames over two seconds are recorded", async ({
    page,
  }, testInfo) => {
    const consoleErrors = collectErrors(page);

    // Count the paints at their only exit. src/lib/sim/paint.ts ends in exactly
    // one ctx.putImageData per pad per paint, and paint.spec.ts pins that, so a
    // counter on the prototype is a count of painted pad frames and nothing
    // else.
    await page.addInitScript(() => {
      const store = window as unknown as { __padPaints: number };
      store.__padPaints = 0;
      const proto = CanvasRenderingContext2D.prototype;
      const original = proto.putImageData;
      proto.putImageData = function (
        this: CanvasRenderingContext2D,
        ...args: unknown[]
      ) {
        store.__padPaints += 1;
        return (original as unknown as (...a: unknown[]) => void).apply(
          this,
          args,
        );
      } as typeof proto.putImageData;
    });

    await page.goto("/");
    await waitForFrontDoor(page);
    await waitForPicture(page, "aurora");

    const read = () =>
      page.evaluate(
        () => (window as unknown as { __padPaints: number }).__padPaints,
      );
    const before = await read();
    await page.waitForTimeout(2_000);
    const painted = (await read()) - before;

    const viewport = page.viewportSize();
    const where = viewport ? `${viewport.width}x${viewport.height}` : "unknown";
    const line = `pad frames painted in two seconds: ${painted} (viewport ${where})`;
    console.log(line);
    testInfo.annotations.push({ type: "measurement", description: line });

    // A RECORDED MEASUREMENT, NOT A BUDGET GATE. The honest ceiling on a
    // four-core laptop with integrated graphics is unmeasured (04-RESEARCH
    // §Open Question 4), and a frame-rate threshold asserted on this machine
    // would go red on someone else's for reasons that are not regressions. What
    // IS asserted is that the loop is running at all.
    expect(painted, "the shared rAF loop is painting").toBeGreaterThan(0);
    expect(consoleErrors).toEqual([]);
  });
});
