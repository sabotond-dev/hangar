// DEGR-01: everything except install, on the engine that can never install.
//
// Five tests, and EVERY TITLE ENDS WITH THE TAG the webkit-phone project greps
// for. That is the whole arithmetic of this file, written out so nobody has to
// re-derive it:
//
//   - playwright.config.ts gives the chromium project NO grep, so chromium runs
//     every test in the suite, tagged or not, at devices["Desktop Chrome"]
//     (1280x720).
//   - webkit-phone carries grep: /@webkit/ and devices["iPhone 15"]
//     (393x659, isMobile, hasTouch).
//   - A tagged title therefore RUNS TWICE and COUNTS TWICE. This file's five
//     tests contribute ten to the suite total.
//
// It is not a second phone run: chromium takes the same assertions at a desktop
// width on a different engine, which is what makes these five cross-browser
// rather than WebKit-only.
//
// WHY THESE FIVE AND NOT A COPY OF e2e/tuning.e2e.ts. iOS Safari can never
// install - WebKit's standards position on Web Serial is formally "oppose" -
// so DEGR-01's promise is that the catalog, the simulator, tuning and sharing
// all work anyway, and that install is present and honest about itself rather
// than hidden. These five are that promise in order: the door opens, choosing
// works and nothing scrolls sideways, a knob moves the pad and the meters land,
// the link copies, and a shared link lands with install disabled for the right
// reason.
//
// THE STACKING FACT (change 16). A knob row is one line - the label left, the
// control right, the two boxes at the end - only where its own container is
// 364px or wider: the inspector's body is 386 at 1440 and above, 248 at the
// compact band (1280) and 341 on the phone (393). So at BOTH projects' own
// widths the rows are STACKED (the label on a line of its own, the control
// under it with the boxes at its end), and test 2 asserts exactly that, then
// widens the viewport to 1440 and asserts the row went side by side, then
// narrows it to 320 and asserts it stacked again - and that nothing scrolls
// sideways at any of the three widths, and that every stepper control still
// hits 44px on the phone.
//
// TWO WebKit FACTS THESE TESTS RESPECT:
//
//   1. context.grantPermissions(["clipboard-read", "clipboard-write"]) is
//      CHROMIUM-ONLY. Test 4 therefore asserts the CONFIRM STATE and never
//      reads the clipboard, which is exactly what SHARE-02 requires. Its
//      expected branch is stated in its own comment, before the assertion.
//   2. requestIdleCallback DOES NOT EXIST in Safari stable, so $lib/tune/idle
//      takes its setTimeout fallback there. Test 3 asserts both meters leave
//      `measuring…`, which is the one place that fallback is observable from
//      outside the process: if the prefetch never ran, no number would land.
//
// NOTHING HERE APOLOGISES FOR THE BROWSER. No string in this phase invites the
// visitor to go and find another one, and test 5 asserts that TRY ON DEVICE is
// present, really `disabled`, and carries Phase 4's own copy - which names the
// browsers that CAN install rather than the one that cannot.
//
// Everything runs against build/ served by worker/index.js under wrangler dev.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { expect, test, type Page } from "@playwright/test";
// Both of these modules import NOTHING AT ALL, so naming them from a Playwright
// file costs nothing and binds these assertions to the source of the sentences
// rather than to transcriptions of them. (src/lib/transport/transport.ts has
// zero import statements; src/lib/tune/copy.ts is a leaf by design.)
// The intro's hero, by its one name (13-07). front-door.ts imports nothing.
import { FRONT_DOOR_HERO } from "../src/lib/catalog/front-door";
import { CLEAR_REASONS } from "../src/lib/device/install-copy";
import { LINK_COPIED } from "../src/lib/tune/copy";
import { SHARE_SNAPSHOT } from "../src/lib/tune/inspector-copy";
import { failureCopy } from "../src/lib/transport/transport";
import { guarded, guardedNot } from "./poll";

/** The opening centre of the front-door row, and an `animated` entry. */
const ENTRY = "aurora";
const ENTRY_NAME = "Aurora";

const canvasOf = (id: string) => `[data-testid="pad-canvas-${id}"]`;

/** The 9x9 backing store as one comma-joined string. (first-experience) */
function sample(page: Page, id: string): Promise<string | null> {
  return page.evaluate((sel) => {
    const c = document.querySelector(sel) as HTMLCanvasElement | null;
    if (!c) return null;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    return Array.from(ctx.getImageData(0, 0, 9, 9).data).join(",");
  }, canvasOf(id));
}

/** Wait until the pad has a picture at all, so two samples are not two blanks. */
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

/** Only error-level messages: the protocol package logs at console.log. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

/** Knob id to index, read off the rows' own data-index. (tuning.e2e.ts) */
function knobIndices(page: Page): Promise<{ id: string; index: number }[]> {
  return page.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        "[data-testid^='knob-'][data-index], [data-testid^='swatch-'][data-index]",
      ),
    ).map((el) => ({
      id: el.getAttribute("data-testid") ?? "",
      index: Number(el.getAttribute("data-index")),
    })),
  );
}

/**
 * Both numbers settled, anchored on the region's own `data-busy` (the
 * meters' aria-busy, carried on the tuning region's root since 13.1-07 hid
 * the meters - 13.1-CONTEXT D-10) rather than on any text: a knob move
 * leaves the PREVIOUS number through the whole stale window, so a text-only
 * wait returns the measurement the knob replaced. (05-11 observed this.)
 */
async function settled(page: Page): Promise<void> {
  await expect(
    page.getByTestId("tuning-region"),
    "the region settled on its numbers",
  ).toHaveAttribute("data-busy", "false", { timeout: 30_000 });
  for (const event of ["setup", "timer"] as const) {
    await expect(
      page.getByTestId("tuning-region"),
      `the ${event} number landed`,
    ).toHaveAttribute(`data-${event}`, /^[0-9]+$/);
  }
}

/**
 * Wait for the workspace to be up. The splash this also waited for went at
 * 13-07 with the intro (D-09) and the shelf at 13-09 with the workspace; the
 * zero it asserts can only be trivially true now.
 */
async function waitForFrontDoor(page: Page): Promise<void> {
  await expect(page.getByTestId("splash")).toHaveCount(0, { timeout: 5_000 });
  await expect(page.getByTestId("workspace")).toBeVisible();
}

/**
 * Open the configuration's workspace. Since 13-09 there is nothing to choose:
 * the panel and the inspector are on the page on arrival, and the inspector
 * renders one rack per section, so the rack locator takes the first.
 */
async function choose(page: Page): Promise<void> {
  await page.goto(`/playground/${ENTRY}/`);
  await waitForFrontDoor(page);
  await waitForPicture(page, ENTRY);
  // 13.1-06: the tuner's region, not the install column's panel (chosen-panel
  // left with the column, 13.1-CONTEXT D-06; 13.1-04's swap in radius.e2e.ts).
  await expect(page.getByTestId("tuning-region")).toBeVisible();
  await expect(page.getByTestId("knob-rack").first()).toBeVisible();
  await settled(page);
}

/** scrollWidth versus clientWidth: a measurement, never a style grep. */
function overflowOf(
  page: Page,
  testId: string,
): Promise<{ scrollWidth: number; clientWidth: number } | null> {
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    return el
      ? { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }
      : null;
  }, testId);
}

type RowLayout = {
  id: string;
  label: { x: number; y: number; w: number; h: number };
  control: { x: number; y: number; w: number; h: number };
  layout: "side-by-side" | "stacked" | "other";
};

/**
 * The first STEPPER knob row, classified by where its control sits relative to
 * its label - which is the only thing Knob.svelte's 364px container query moves.
 *
 * Two choices in here are load-bearing:
 *
 *   - The classification compares the two BOXES, never their `y` alone. The row
 *     is a grid with `align-items: center`, so a 14px label and a 44px control
 *     have different TOPS while sitting perfectly side by side - an equality on
 *     `y` is red on correct code, which is how this test first ran.
 *   - It is computed in the page and returned as a word, so the poll after the
 *     resize waits for the layout rather than for a pixel.
 */
function rowLayout(page: Page): Promise<RowLayout | null> {
  return page.evaluate(() => {
    const row = Array.from(
      document.querySelectorAll(
        "[data-testid^='knob-'][data-widget='stepper']",
      ),
    ).find((el) => el.querySelector("input[role='spinbutton']") !== null);
    if (!row) return null;
    const label = row.querySelector(".label");
    const control = row.querySelector(".control");
    if (!label || !control) return null;
    const l = label.getBoundingClientRect();
    const c = control.getBoundingClientRect();
    const box = (r: DOMRect) => ({
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
    });
    const sameX = Math.round(c.x) === Math.round(l.x);
    const below = Math.round(c.y) >= Math.round(l.y + l.height);
    const rightOf = Math.round(c.x) >= Math.round(l.x + l.width);
    const overlapY = c.y < l.y + l.height && l.y < c.y + c.height;
    return {
      id: row.getAttribute("data-testid") ?? "",
      label: box(l),
      control: box(c),
      layout:
        sameX && below
          ? ("stacked" as const)
          : rightOf && overlapY
            ? ("side-by-side" as const)
            : ("other" as const),
    };
  });
}

test.describe("the whole site except install, on a phone engine", () => {
  test("the front door opens and a pad is animating @webkit", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    // Since 13-07 the front door is the intro: one live hero surface beside
    // the words, on a page with no splash. The DEGR-01 floor is the same -
    // a phone engine that can never install still gets the site's opening
    // with its machine running - and it is now measured on that one pad.
    await page.goto("/");
    await expect(page.getByTestId("intro")).toBeVisible();

    // The hero rendered, and it is the one pad on the page: the intro is a
    // single surface, not a row.
    expect(
      await page.locator("[data-testid^='pad-canvas-']").count(),
      "the intro renders exactly one pad",
    ).toBe(1);

    // On a phone the intro stacks its two columns and the hero panel sits
    // below the fold. The host gates every pad on an IntersectionObserver
    // with a 200px margin - an off-screen pad is painted once and never
    // ticked, by design - so the surface is scrolled into view first, which
    // is where a visitor who wants to see it running will have put it.
    // Measured on 2026-09-11: without this line the backing store is lit
    // and unchanging for the whole 10 s poll on webkit-phone.
    await page.getByTestId("intro-hero").scrollIntoViewIfNeeded();

    // The hero's motion is declared in src/lib/catalog/front-door.ts, derived
    // there as the first non-dark member, and that declaration is held
    // against golden-frames.json by front-door.spec.ts - so this test and
    // that gate cannot disagree about what it should do.
    const HERO = FRONT_DOOR_HERO.id;
    await waitForPicture(page, HERO);
    const first = await sample(page, HERO);
    expect(first, "the hero canvas was readable").not.toBeNull();
    expect(
      (first as string).split(",").some((b) => b !== "0"),
      "the hero has a picture before two samples are compared",
    ).toBe(true);

    // THE SECOND NEGATED POLL SITE IN THIS REPOSITORY, and it takes the
    // inverted guard for the same reason tuning.e2e.ts's remeasured() does: a
    // string sentinel returned on a throw is ALSO not equal to `first`, so it
    // would satisfy the negation and report a page that refused to read its
    // canvas as a simulator that is running. guardedNot returns `first`
    // itself, which fails the negation, so the poll keeps its whole budget.
    const changed = guardedNot(
      () => sample(page, HERO),
      first,
      `${HERO}'s backing store`,
    );
    await expect
      .poll(changed.read, {
        message:
          "the simulator is really running on this engine: the hero's own backing store changes between samples",
        timeout: 10_000,
      })
      .not.toBe(first);
    expect(
      changed.lastError(),
      "the poll above reached its answer without the page ever refusing to read the canvas",
    ).toBeUndefined();

    expect(consoleErrors).toEqual([]);
  });

  test("the workspace opens with its panel and the rack never scrolls sideways @webkit", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await choose(page);

    // 13.1-07: the panel is the shell's inspector (chosen-panel left with the
    // install column at 13.1-06, 13.1-CONTEXT D-06).
    const panel = page.getByTestId("shell-inspector");
    await expect(panel).toBeVisible();
    await expect(page.getByTestId("tuning-region")).toBeVisible();
    await expect(page.getByTestId("workspace-name")).toHaveText(ENTRY_NAME);

    // D-11's "wrap, never scroll", MEASURED rather than asserted in prose.
    for (const id of ["knob-rack", "tuning-region", "shell-inspector"]) {
      const box = await overflowOf(page, id);
      expect(box, `${id} is on the page`).not.toBeNull();
      expect(
        (box as { scrollWidth: number }).scrollWidth,
        `${id} has nothing to scroll to sideways: ${JSON.stringify(box)}`,
      ).toBeLessThanOrEqual((box as { clientWidth: number }).clientWidth);
    }

    // At this project's own width - 393px on the phone, 1280px on the desktop's
    // compact band - the row's container is under 364px, so the label takes a
    // line of its own and the control sits under it (change 16). See the
    // header: this is the stacking fact.
    const own = await rowLayout(page);
    expect(own, "the rack has at least one stepper row").not.toBeNull();
    const o = own as NonNullable<typeof own>;
    expect(
      o.layout,
      `${o.id} is stacked at this width: ${JSON.stringify(o)}`,
    ).toBe("stacked");
    expect(
      o.control.x,
      `${o.id} stacked: the control sits under the label, at the same x`,
    ).toBe(o.label.x);
    expect(
      o.control.y,
      "and below it, not merely reflowed",
    ).toBeGreaterThanOrEqual(o.label.y + o.label.h);

    // EVERY STEPPER CONTROL HITS 44px AT THIS WIDTH, measured on the first
    // stepper row: the field, the two boxes, the reset and the lock.
    const first = page
      .locator("[data-testid^='knob-'][data-widget='stepper']")
      .first();
    for (const suffix of ["-input", "-down", "-up", "-reset", "-hold"]) {
      const control = first.locator(`[data-testid$="${suffix}"]`).first();
      const box = await control.boundingBox();
      expect(box, `${suffix} has a box`).not.toBeNull();
      expect(box!.height, `${suffix} is 44px tall`).toBeGreaterThanOrEqual(44);
      if (suffix !== "-input") {
        expect(box!.width, `${suffix} is 44px wide`).toBeGreaterThanOrEqual(44);
      }
    }

    // At 1440 the inspector's body is 386px and the row is one line: the
    // control to the right of the label, overlapping it vertically.
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect
      .poll(
        guarded(
          async () => (await rowLayout(page))?.layout,
          "the first stepper row's layout",
        ),
        {
          message:
            "the container query re-evaluated after the resize and the row went side by side",
          timeout: 10_000,
        },
      )
      .toBe("side-by-side");
    for (const id of ["knob-rack", "tuning-region", "shell-inspector"]) {
      const box = await overflowOf(page, id);
      expect(
        (box as { scrollWidth: number }).scrollWidth,
        `${id} has nothing to scroll to sideways at 1440px: ${JSON.stringify(box)}`,
      ).toBeLessThanOrEqual((box as { clientWidth: number }).clientWidth);
    }

    // 320px is the narrowest width DEGR-01 is written for: stacked again, and
    // nothing scrolls sideways.
    await page.setViewportSize({ width: 320, height: 659 });
    await expect
      .poll(
        guarded(
          async () => (await rowLayout(page))?.layout,
          "the first stepper row's layout",
        ),
        {
          message:
            "the container query re-evaluated after the resize and the row stacked",
          timeout: 10_000,
        },
      )
      .toBe("stacked");
    for (const id of ["knob-rack", "tuning-region", "shell-inspector"]) {
      const box = await overflowOf(page, id);
      expect(
        (box as { scrollWidth: number }).scrollWidth,
        `${id} has nothing to scroll to sideways at 320px: ${JSON.stringify(box)}`,
      ).toBeLessThanOrEqual((box as { clientWidth: number }).clientWidth);
    }

    expect(consoleErrors).toEqual([]);
  });

  test("a knob turn changes the pad and the meters settle @webkit", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);

    // Reduced motion, for the reason e2e/tuning.e2e.ts test 1 records: aurora
    // ANIMATES, so on a full-motion page two samples differ whether or not the
    // knob did anything, and the test would pass against an implementation
    // where turning a knob does nothing at all. Held on one frame, a changed
    // frame changed because of the knob.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await choose(page);
    expect(
      await page.evaluate(
        () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
      "the page really is in the reduced-motion branch",
    ).toBe(true);

    const before = await sample(page, ENTRY);
    expect(before, "the hero canvas was readable").not.toBeNull();
    await page.waitForTimeout(400);
    expect(
      await sample(page, ENTRY),
      "reduced motion holds one frame, so 400ms of wall clock must not move it",
    ).toBe(before);

    const steppers = page.locator(
      "[data-testid='knob-rack'] input[role='spinbutton']",
    );
    expect(
      await steppers.count(),
      "the rack has a stepper to step",
    ).toBeGreaterThan(0);
    await steppers.first().focus();
    await page.keyboard.press("ArrowUp");
    await settled(page);

    expect(
      await sample(page, ENTRY),
      "one arrow changes the pad the visitor is looking at",
    ).not.toBe(before);

    // THE requestIdleCallback FALLBACK, OBSERVED FROM OUTSIDE. Safari has no
    // requestIdleCallback, so $lib/tune/idle prefetches the 628 KB formatter on
    // a setTimeout instead. If that fallback never fired, no number would ever
    // land and the region would carry no data-setup / data-timer at all
    // (13.1-07: the numbers are attributes, nothing paints them). This is the
    // only place that branch is visible without instrumenting the page.
    for (const event of ["setup", "timer"] as const) {
      const text = await page
        .getByTestId("tuning-region")
        .getAttribute(`data-${event}`);
      expect(
        text,
        `the ${event} number landed on the region, so the formatter really did initialise here`,
      ).toMatch(/^[0-9]+$/);
      expect(Number(text)).toBeLessThanOrEqual(908);
    }

    expect(consoleErrors).toEqual([]);
  });

  test("COPY LINK confirms in its own state @webkit", async ({
    page,
    context,
    browserName,
  }) => {
    // THE BRANCH THIS TEST EXPECTS, STATED BEFORE THE ASSERTION.
    // src/lib/ui/CopyLink.svelte has two: navigator.clipboard.writeText
    // resolves and the button confirms, or the API is missing / the write
    // rejects and the select-and-copy field is revealed instead. The expected
    // branch here is the CONFIRM branch, and on WebKit it is reached with no
    // help at all.
    //
    // MEASURED on this tree, at the phone viewport, before this assertion was
    // written:
    //
    //   webkit-phone   navigator.permissions.query -> TypeError (not
    //                  implemented), writeText -> RESOLVED, button -> LINK
    //                  COPIED, fallback field absent.
    //   chromium       permissions state "prompt", writeText -> REJECTED with
    //                  NotAllowedError "Write permission denied", so the
    //                  fallback field is revealed instead.
    //
    // That difference is the HARNESS's permission model, not a product defect,
    // and it is worth being precise about which way round it falls: the browser
    // this file exists for is the one that succeeds unaided. The phase's whole
    // activation discipline - a URL precomputed on every knob change, no await
    // in front of the call - is what makes that true, and Safari is exactly
    // where an await would have expired the activation.
    //
    // So the grant is made for CHROMIUM ONLY. grantPermissions does not accept
    // these names on WebKit and throws there, and granting is also what the
    // sibling desktop test does for its own clipboard read. Both projects then
    // assert the SAME branch, which is the point: this test asserts the confirm
    // state AND that the fallback field is absent, so a silent branch flip is a
    // red test rather than a passing one that proved nothing. The clipboard is
    // never READ here - that API is Chromium-only, and the confirm state is
    // what SHARE-02 requires.
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }

    const consoleErrors = collectErrors(page);
    await choose(page);

    const copy = page.getByTestId("copy-link");
    await expect(copy, "the control arrives as Share snapshot").toHaveText(
      SHARE_SNAPSHOT,
    );
    expect(
      await page.getByTestId("copy-link-fallback").count(),
      "the fallback field is not on the page before anything is clicked",
    ).toBe(0);

    await copy.click();

    await expect(
      copy,
      "the button says so itself rather than through a toast - and the confirm branch is the one that ran",
    ).toHaveText(LINK_COPIED);
    expect(
      await page.getByTestId("copy-link-fallback").count(),
      "the write succeeded, so the select-and-copy fallback was never revealed",
    ).toBe(0);

    // The confirmed state has a lifetime of its own: 2000ms, and then the
    // control goes back to offering the same thing again.
    await expect(copy, "and it reverts on its own").toHaveText(SHARE_SNAPSHOT, {
      timeout: 10_000,
    });

    expect(consoleErrors).toEqual([]);
  });

  test("a shared link lands with the knobs restored, and install is present but disabled @webkit", async ({
    page,
    context,
  }) => {
    // Both capabilities are removed before the document runs, and both removals
    // are deliberate:
    //
    //   - serial, so that BOTH projects take the branch this test is about.
    //     On WebKit the delete is a no-op - Safari has never had Web Serial and
    //     WebKit's standards position on it is "oppose" - while in chromium it
    //     forces the same degrade path, which is how one set of assertions can
    //     describe both engines.
    //   - clipboard, so the link can be MINTED without reading a clipboard the
    //     WebKit driver will not grant. CopyLink's fallback field holds exactly
    //     the same precomputed URL the write would have carried, so the link
    //     under test is one the product composed rather than one this file
    //     typed out. (05-11 minted its foreign stamp the same way.)
    await context.addInitScript(() => {
      const proto = Navigator.prototype as unknown as Record<string, unknown>;
      const instance = navigator as unknown as Record<string, unknown>;
      // Both are accessors on the prototype: deleting off the instance returns
      // true and removes nothing. (e2e/skeleton.e2e.ts)
      delete proto.serial;
      delete instance.serial;
      delete proto.clipboard;
      delete instance.clipboard;
    });

    const consoleErrors = collectErrors(page);
    await choose(page);

    expect(
      await page.evaluate(() => "serial" in navigator),
      "the precondition: this page cannot talk to hardware at all",
    ).toBe(false);

    const steppers = page.locator(
      "[data-testid='knob-rack'] input[role='spinbutton']",
    );
    await steppers.first().focus();
    await page.keyboard.press("ArrowUp");
    await settled(page);
    const tuned = await knobIndices(page);

    await page.getByTestId("copy-link").click();
    const field = page.getByTestId("copy-link-fallback");
    await expect(
      field,
      "the link is offered for selection instead",
    ).toBeVisible();
    const link = await field.inputValue();
    expect(link, "and it carries a stamp").toContain("#z.");

    // ONLY THE ORIGIN IS SWAPPED. shareUrl names the DEPLOYED origin, because a
    // shared link goes into somebody else's chat window rather than into this
    // page's address bar - and this harness is 127.0.0.1. Following the link
    // verbatim leaves the local build entirely and lands on the real site's
    // Basic Auth gate, which is what this test did on its first run. The path,
    // the trailing slash and the whole fragment below are the ones the page
    // composed. (e2e/tuning.e2e.ts test 6 does the same.)
    const parsed = new URL(link);
    const address = `${parsed.pathname}${parsed.hash}`;

    // A COLD ARRIVAL. page.goto to the same path with a different fragment is a
    // fragment-only navigation: the document is kept, Coverflow never remounts
    // and the onMount landing never runs. (05-11)
    await page.goto("about:blank");
    await page.goto(address);
    await waitForFrontDoor(page);
    await expect(
      page.getByTestId("tuning-region"),
      "the panel is open on arrival, without the visitor choosing anything",
    ).toBeVisible();
    await settled(page);

    await expect(page.getByTestId("workspace-name")).toHaveText(ENTRY_NAME);
    expect(
      await knobIndices(page),
      "every knob came back exactly where the link left it",
    ).toEqual(tuned);

    // DEGR-02: present, really disabled, never hidden - the header's Clear
    // with its reason (13.1-05; since 13.1-06 the bar's Apply exists only
    // for a module that has reported a page, so on this engine the bar says
    // preview-only where the zone would be) - and the header's disclosure
    // names the browsers that CAN install rather than apologising for this
    // one.
    const clear = page.getByTestId("clear");
    await expect(clear).toBeVisible();
    await expect(clear).toBeDisabled();
    await expect(page.getByTestId("clear-line")).toHaveText(
      CLEAR_REASONS.incapable,
    );
    expect(await page.getByTestId("store-on-zona").count()).toBe(0);
    await expect(page.locator('[data-zone="destination"]')).toContainText(
      "Preview",
    );
    const copyForThis = failureCopy("no-web-serial", undefined, "Connect ZONA");
    const slot = page.getByTestId("device-slot");
    await expect(slot).toHaveAttribute("data-slot", "S0a");
    await slot.click();
    const drawer = page.getByTestId("device-details");
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText(copyForThis.title);
    await expect(drawer).toContainText(copyForThis.detail);
    // CONN-01 is a capability test, never a browser test.
    expect(await page.locator("body").innerText()).not.toContain("Chromium");
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);

    expect(consoleErrors).toEqual([]);
  });
});
