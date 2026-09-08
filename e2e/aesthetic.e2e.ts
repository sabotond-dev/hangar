// IDENT-01 / IDENT-02 / D-07 - the four browser gates the shipped canvas
// assertions structurally cannot make (10-UI-SPEC 8.7).
//
// WHY THIS FILE EXISTS. e2e/browse.e2e.ts:140-148 and its twin at
// e2e/first-experience.e2e.ts:87 read the 9x9 CANVAS BACKING STORE - 324 bytes
// out of getImageData - and compare two samples to prove a pad is still under
// reduced motion. A CSS overlay painted above that canvas by the compositor
// NEVER TOUCHES THE BACKING STORE. A sweeping scanline bar over the pads would
// leave every one of those assertions green while the screen visibly moved.
// The tests would lie. Nothing about them is wrong - they are simply looking at
// the wrong surface for this question - so this file asks the compositor
// instead, through getComputedStyle, and asks it in BOTH browser projects.
//
// EVERY TEST HERE CARRIES THE HOUSE NON-VACUITY ASSERTION BEFORE THE ASSERTION
// IT GUARDS. Each one reads a computed style off an element that a default or a
// capability check can legitimately keep out of the DOM - the roll bar does not
// mount under SCREEN: FLAT, or on four cores, or while a pad is chosen - and
// getComputedStyle of nothing asserts nothing at all.
//
// TWO GATES HAVE TO BE OPENED BEFORE THE REDUCED-MOTION CLAIM MEANS ANYTHING,
// and both were live holes on the UI spec's first pass:
//
//   1. SCREEN: TEXTURED is selected EXPLICITLY, because 10-UI-SPEC 8.6's own
//      default under reduced motion is FLAT - and FLAT mounts no roll bar, so
//      "the roll bar is not animating" would be true of a page that has none.
//   2. navigator.hardwareConcurrency is forced to 8 through addInitScript
//      BEFORE goto, because Switch 3 removes Layer R entirely on a four-core
//      machine and CI runners are often four-core.
//
// Test 4 then asserts Switch 3 in its own right at a forced 4, because without
// it that switch is a sentence no test can tell from a typo.
//
// ALL FOUR TITLES CARRY @webkit. playwright.config.ts filters the second
// project on /@webkit/, so a title without the tag runs in chromium only -
// and half the point of this file is that iOS, which can never install, still
// gets the site it can use. Four titles times two projects is eight.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { expect, test, type Page } from "@playwright/test";

/** trailingSlash: "always" (src/routes/+layout.ts). Never without the slash. */
const FRONT_DOOR = "/";

/**
 * The four layer selectors, as the browser sees them. Svelte's scoping ADDS a
 * class, it never replaces one, so the authored names are still in the class
 * attribute and a plain class selector finds them.
 */
const ROLL = ".crt-roll";
const SHELL = ".crt-band";
const PAD = ".pad";

/**
 * A COLD ARRIVAL. The about:blank hop is the idiom e2e/tuning.e2e.ts
 * established: it removes every doubt about a warm client router carrying
 * state across a navigation to the same path.
 */
async function coldGoto(page: Page, path: string): Promise<void> {
  await page.goto("about:blank");
  await page.goto(path);
}

/**
 * Force the core count BEFORE the page runs any of its own script.
 * FrontDoor.svelte reads navigator.hardwareConcurrency in onMount, so a value
 * set after goto would arrive too late and the test would silently measure the
 * runner's real machine instead of the case it names.
 */
async function forceCores(page: Page, cores: number): Promise<void> {
  await page.addInitScript((count) => {
    Object.defineProperty(navigator, "hardwareConcurrency", {
      get: () => count,
      configurable: true,
    });
  }, cores);
}

/**
 * Wait until the front door is a page rather than an opening. The splash is a
 * fixed layer over the row for about two seconds; the idiom for waiting it out
 * is e2e/first-experience.e2e.ts:138's.
 */
async function frontDoorSettled(page: Page): Promise<void> {
  await expect(page.getByTestId("coverflow")).toBeVisible();
  await expect(page.getByTestId("splash")).toHaveCount(0, { timeout: 5_000 });
}

/** The one attribute the whole treatment derives from. */
function screenAttribute(page: Page): Promise<string | null> {
  return page.evaluate(() =>
    document.documentElement.getAttribute("data-screen"),
  );
}

/** The property that attribute sets, trimmed - a custom property keeps its space. */
function crtProperty(page: Page): Promise<string> {
  return page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--crt").trim(),
  );
}

/**
 * One computed property off the first match of a selector, optionally off one
 * of its pseudo-elements. Returns null when nothing matched, so a caller can
 * tell "the element is not there" from "the element says none" - a distinction
 * this whole file turns on.
 */
function computed(
  page: Page,
  selector: string,
  pseudo: string | null,
  property: string,
): Promise<string | null> {
  return page.evaluate(
    ([sel, pse, prop]) => {
      const el =
        sel === "body" ? document.body : document.querySelector(sel as string);
      if (el === null) return null;
      return getComputedStyle(el, pse).getPropertyValue(prop as string);
    },
    [selector, pseudo, property] as [string, string | null, string],
  );
}

/**
 * THE CHOICE, ONCE THE PAGE HAS HYDRATED - and this is a poll rather than a
 * read because of something this plan observed rather than assumed.
 *
 * Every route here is PRERENDERED. The static HTML carries no `data-screen` at
 * all, and ScreenToggle.svelte writes it from its module scope, which runs when
 * the layout's JavaScript loads - before hydration, but AFTER the prerendered
 * markup has already painted. So on a cold arrival there is a window, measured
 * in one frame or two, in which the attribute is absent and src/app.css's
 * default (`--crt: 1`) stands. A single read taken inside that window returns
 * null, and it did: this exact assertion was red on webkit-phone and green on
 * chromium purely on timing.
 *
 * The claim being made is "the choice survived", not "the choice was on the
 * first painted frame" - so the assertion says the first thing. The second is a
 * real if small flaw, it is recorded in ScreenToggle.svelte's header, and
 * closing it means a blocking inline script in src/app.html.
 */
async function settledScreen(page: Page, expected: string): Promise<void> {
  await expect
    .poll(() => screenAttribute(page), {
      message: `data-screen is ${expected} once this page has hydrated`,
    })
    .toBe(expected);
  await expect
    .poll(() => crtProperty(page), {
      message: `--crt follows data-screen=${expected}`,
    })
    .toBe(expected === "flat" ? "0" : "1");
}

/** Click the visible control, and wait for the attribute rather than assume it. */
async function chooseScreen(
  page: Page,
  label: "TEXTURED" | "FLAT",
): Promise<void> {
  const group = page.getByTestId("screen-toggle");
  await expect(group, "the SCREEN control is on this route").toHaveCount(1);
  await group.locator("label", { hasText: label }).click();
  await expect
    .poll(() => screenAttribute(page), {
      message: `SCREEN: ${label} reached <html> as data-screen`,
    })
    .toBe(label.toLowerCase());
}

test.describe("the CRT treatment, asserted at the compositor", () => {
  test("@webkit reduced motion stops both moving layers, and neither was absent", async ({
    page,
  }) => {
    // BOTH, and the explicit call is not belt-and-braces: test.use({
    // reducedMotion }) alone was measured insufficient in Phase 4 and recorded
    // again at e2e/browse.e2e.ts:493-500 - the declarative option left
    // matchMedia inside the page reporting false. emulateMedia comes BEFORE
    // goto so the page arrives stilled rather than being stilled afterwards.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await forceCores(page, 8);
    await coldGoto(page, FRONT_DOOR);
    await frontDoorSettled(page);

    // The preference, as the page itself sees it.
    expect(
      await page.evaluate(
        () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
      "the page sees the reduced-motion preference",
    ).toBe(true);

    // GATE 1. Under reduced motion the SCREEN default is FLAT, and FLAT mounts
    // no roll bar at all - so without this the test below would be asserting
    // that a page with no CRT has no moving CRT.
    await chooseScreen(page, "TEXTURED");
    expect(await crtProperty(page), "the CRT is switched on").toBe("1");

    // GATE 2. Switch 3 drops Layer R on four cores, which is what many CI
    // runners have. Forced to 8 above; asserted here as the page reads it.
    expect(
      await page.evaluate(() => navigator.hardwareConcurrency),
      "the core count the page reads is the one this test forced",
    ).toBe(8);

    // ---- Non-vacuity: both moving layers are really in the document. ----
    expect(
      await page.locator(ROLL).count(),
      "the roll bar is in the DOM, so there is an animation to stop",
    ).toBeGreaterThan(0);
    expect(
      await page.locator(SHELL).count(),
      "the tear-bearing element is in the DOM, so there is an animation to stop",
    ).toBeGreaterThan(0);

    // ---- The claim, read off the compositor rather than off a canvas. ----
    expect(
      await computed(page, ROLL, null, "animation-name"),
      "Layer R declares no animation under reduced motion. The reference " +
        "implementation's own reduced-motion rule does not stop its scanline " +
        "sweep; this assertion is the difference.",
    ).toBe("none");
    expect(
      await computed(page, SHELL, "::after", "animation-name"),
      "Layer T declares no animation under reduced motion. At rest and in full " +
        "motion this reads crt-tear - the animation is armed and paused - so " +
        '"none" here is a real difference rather than the absence of a rule.',
    ).toBe("none");
  });

  test("@webkit SCREEN: FLAT turns off all four layers, not the two that move", async ({
    page,
  }) => {
    await forceCores(page, 8);
    await coldGoto(page, FRONT_DOOR);
    await frontDoorSettled(page);
    await chooseScreen(page, "TEXTURED");

    // ---- THE PRESENT HALF, WHICH IS ALSO THE NON-VACUITY ASSERTION. This
    // test proves a CHANGE rather than an absence: four selectors are read
    // twice, and an assertion that only read them after the switch would pass
    // on a build that shipped no CRT at all.
    expect(await crtProperty(page), "--crt is 1 under TEXTURED").toBe("1");
    expect(
      await page.locator(PAD).count(),
      "the front door renders pad frames, so Layer S has somewhere to be",
    ).toBeGreaterThan(0);

    const groundOn = await computed(
      page,
      "body",
      "::before",
      "background-image",
    );
    expect(groundOn, "Layer G paints a ground texture under TEXTURED").not.toBe(
      "none",
    );
    expect(groundOn, "Layer G is really there to be read").not.toBeNull();

    const scanlinesOn = await computed(page, PAD, "::after", "content");
    expect(
      scanlinesOn,
      "Layer S generates its pseudo-element under TEXTURED",
    ).not.toBe("none");
    expect(scanlinesOn, "Layer S is really there to be read").not.toBeNull();

    expect(
      await page.locator(ROLL).count(),
      "Layer R is mounted under TEXTURED on a machine with more than four cores",
    ).toBeGreaterThan(0);

    const tearOn = await computed(page, SHELL, "::after", "content");
    expect(
      tearOn,
      "Layer T generates its pseudo-element under TEXTURED",
    ).not.toBe("none");
    expect(tearOn, "Layer T is really there to be read").not.toBeNull();

    // ---- The switch. One control, one attribute, four layers. ----
    await chooseScreen(page, "FLAT");

    expect(await crtProperty(page), "--crt is 0 under FLAT").toBe("0");
    expect(
      await computed(page, "body", "::before", "background-image"),
      "Layer G - the page ground - is off under FLAT. It does not move, so no " +
        "motion preference reaches it, which is the whole argument for SCREEN.",
    ).toBe("none");
    expect(
      await computed(page, PAD, "::after", "content"),
      "Layer S - the pad frames' scanlines - is off under FLAT. content: none " +
        "removes the pseudo-element; an opacity folded to zero would leave this " +
        "reading a layer that was still being composited.",
    ).toBe("none");
    expect(
      await page.locator(ROLL).count(),
      "Layer R is ABSENT FROM THE DOM under FLAT, not merely hidden",
    ).toBe(0);
    expect(
      await computed(page, SHELL, "::after", "content"),
      "Layer T - the tear - is off under FLAT",
    ).toBe("none");
  });

  // THIS TITLE DOES TWO JOBS, AND THE SECOND ONE IS HERE ON PURPOSE. 10-UI-SPEC
  // 8.7 declares FOUR titles for this file and 10-04's contract fixes the e2e
  // delta at four times two projects; this is the only one of the four that is
  // legitimately on /browse/, and the measured Layer S fallback (8.5) is a
  // shipped behaviour that would otherwise have no gate at all. A decision
  // nothing asserts is a comment, so it goes in the test that is already there
  // rather than into a fifth title nobody counted.
  test("@webkit the SCREEN choice survives a navigation and a reload, and the browse grid keeps Layer G alone", async ({
    page,
  }) => {
    await forceCores(page, 8);
    await coldGoto(page, FRONT_DOOR);
    await frontDoorSettled(page);

    // ---- Non-vacuity: the choice really changes something before it is
    // asked to survive anything. Without this the test would pass on a
    // preference that was never written and a default that never moved.
    await chooseScreen(page, "TEXTURED");
    expect(await crtProperty(page), "the CRT starts on").toBe("1");
    await chooseScreen(page, "FLAT");
    expect(await crtProperty(page), "the choice took effect").toBe("0");

    // A CLIENT-SIDE navigation: SvelteKit keeps the JS context alive, so this
    // exercises the shared store rather than the stored string.
    await page.getByTestId("browse-link").click();
    await expect(page.getByTestId("browse-grid")).toBeVisible();
    // The attribute survived a navigation from / to /browse/.
    await settledScreen(page, "flat");

    // A RELOAD: a fresh JS context, so this exercises hangar.screen.v1 itself
    // rather than the shared store the client-side navigation kept alive.
    await page.reload();
    await expect(page.getByTestId("browse-grid")).toBeVisible();
    await settledScreen(page, "flat");
    expect(
      await page.evaluate(() => {
        try {
          return localStorage.getItem("hangar.screen.v1");
        } catch {
          return "unreadable";
        }
      }),
      "the preference is under its own versioned key",
    ).toBe("flat");

    // ---- 10-UI-SPEC 8.5's measured fallback, held where it ships. ----
    // With SCREEN back on, the browse grid carries Layer G and NOTHING ELSE.
    // Measured, median of three runs per arm, p95 of rAF deltas over a full
    // scroll of /browse/ at thirty-six entries: chromium 0.00 ms, webkit at a
    // phone viewport 61 ms with the sampled frame count halving from 128 to 65.
    // Thirty times the 2 ms threshold on one of the two engines, so Layer S is
    // scoped to the front door's seven frames. Without this assertion a later
    // tidy-up unscopes it and nothing anywhere goes red.
    await chooseScreen(page, "TEXTURED");
    expect(await crtProperty(page), "the CRT is switched on").toBe("1");
    expect(
      await page.locator(PAD).count(),
      "the browse grid rendered pad frames, so Layer S had somewhere to go",
    ).toBeGreaterThan(1);
    expect(
      await computed(page, PAD, "::after", "content"),
      "Layer S is NOT on the browse grid's frames - the measured fallback",
    ).toBe("none");
    expect(
      await page.locator(SHELL).count(),
      "Layers R and T never appear on /browse/ at all; the shell is the front door's",
    ).toBe(0);
    expect(
      await computed(page, "body", "::before", "background-image"),
      "Layer G is here, and it is what the grid keeps",
    ).not.toBe("none");
  });

  test("@webkit Switch 3 removes only the roll bar, and only on four cores", async ({
    page,
  }) => {
    await forceCores(page, 4);
    await coldGoto(page, FRONT_DOOR);
    await frontDoorSettled(page);
    await chooseScreen(page, "TEXTURED");

    // The switch's own input, asserted in its own right. Without this the
    // absence below is indistinguishable from a typo in a class name.
    expect(
      await page.evaluate(() => navigator.hardwareConcurrency),
      "the page reads four cores",
    ).toBe(4);
    expect(await crtProperty(page), "the CRT is switched on").toBe("1");

    // ---- Non-vacuity: the shell IS there, so the roll bar's absence is a
    // decision rather than a page that failed to render.
    expect(
      await page.locator(SHELL).count(),
      "the CRT shell is mounted, so Layer R had somewhere to go and did not go there",
    ).toBeGreaterThan(0);
    expect(
      await page.locator(PAD).count(),
      "the front door rendered its pad frames",
    ).toBeGreaterThan(0);

    // ---- The claim: one layer goes, three stay. ----
    expect(
      await page.locator(ROLL).count(),
      "Layer R does not mount at all on four cores or fewer. It is the only " +
        "layer with a per-frame compositor cost, and the only one worth spending " +
        "a capability check on. Feature-detected, never browser-sniffed.",
    ).toBe(0);
    expect(
      await computed(page, "body", "::before", "background-image"),
      "Layer G is still present on a four-core machine - it costs one raster",
    ).not.toBe("none");
    expect(
      await computed(page, PAD, "::after", "content"),
      "Layer S is still present on a four-core machine",
    ).not.toBe("none");
  });
});
