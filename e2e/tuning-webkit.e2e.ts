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
// THE 393px FACT, AND WHY THE STACKING ASSERTION LIVES AT 320px. At the phone
// project's own width the tuning region's content box is about 265px - above
// the 220px container-query threshold in Knob.svelte - so a knob's label and
// its control stay SIDE BY SIDE, exactly as they do at 1280px. Asserting
// "stacked" at 393px would therefore be asserting something false, and
// asserting it at a width where every layout stacks would prove nothing about a
// phone. So test 2 asserts side-by-side at whichever width the project runs at,
// then narrows the viewport to 320px and asserts the layout really did stack -
// and that nothing scrolls sideways at either width.
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
import { COPY_LINK, LINK_COPIED, MEASURING } from "../src/lib/tune/copy";
import { failureCopy } from "../src/lib/transport/transport";
import { guarded, guardedNot } from "./poll";

/** The opening centre of the front-door row, and an `animated` entry. */
const ENTRY = "aurora";
const ENTRY_NAME = "Aurora";

/** The label the honesty copy is interpolated with on this control. */
const PRIMARY_LABEL = "TRY ON DEVICE";

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

/** Knob id to index, read off the real controls. (tuning.e2e.ts) */
function knobIndices(page: Page): Promise<{ id: string; index: number }[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-testid^='knob-']"))
      .filter((el) => el.getAttribute("data-testid") !== "knob-rack")
      .map((el) => {
        const rail = el.querySelector(
          "input[type='range']",
        ) as HTMLInputElement | null;
        const radios = Array.from(
          el.querySelectorAll("input[type='radio']"),
        ) as HTMLInputElement[];
        return {
          id: el.getAttribute("data-testid") ?? "",
          index: rail
            ? Number(rail.value)
            : radios.findIndex((radio) => radio.checked),
        };
      }),
  );
}

/**
 * Both meters settled, anchored on the meter's own `aria-busy` rather than on
 * its text: a knob move leaves the PREVIOUS number on screen through the whole
 * stale window, so a text-only wait returns the measurement the knob replaced.
 * (05-11 observed this.)
 */
async function settled(page: Page): Promise<void> {
  for (const event of ["setup", "timer"] as const) {
    await expect(
      page.getByTestId(`meter-${event}`),
      `the ${event} meter settled on a number`,
    ).toHaveAttribute("aria-busy", "false", { timeout: 30_000 });
  }
}

/**
 * Wait for the shelf to be up. The splash it also waited for went at 13-07
 * with the intro (D-09); the zero it asserts can only be trivially true now.
 */
async function waitForFrontDoor(page: Page): Promise<void> {
  await expect(page.getByTestId("splash")).toHaveCount(0, { timeout: 5_000 });
  await expect(page.getByTestId("coverflow")).toBeVisible();
}

/**
 * Open the configuration and choose the centre pad, from the keyboard. On
 * /playground/{id}/ since 13-07: / is the intro and renders no shelf and no panel.
 */
async function choose(page: Page): Promise<void> {
  await page.goto(`/playground/${ENTRY}/`);
  await waitForFrontDoor(page);
  await waitForPicture(page, ENTRY);
  if ((await page.getByTestId("chosen-panel").count()) === 0) {
    await page.getByTestId("coverflow").press("Enter");
  }
  await expect(page.getByTestId("chosen-panel")).toBeVisible();
  await expect(page.getByTestId("knob-rack")).toBeVisible();
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
 * The first RAIL knob row, classified by where its control sits relative to its
 * label - which is the only thing Knob.svelte's 220px container query moves.
 *
 * Three choices in here are load-bearing:
 *
 *   - A rail row, and one that does not carry the `stacked` class. A words or
 *     swatch row stacks at every width by construction, so including one would
 *     make "stacked" true for a reason that has nothing to do with a phone.
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
      document.querySelectorAll("[data-testid^='knob-']"),
    ).find(
      (el) =>
        el.getAttribute("data-testid") !== "knob-rack" &&
        !el.classList.contains("stacked") &&
        el.querySelector("input[type='range']") !== null,
    );
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

  test("choosing opens the panel and the rack never scrolls sideways @webkit", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await choose(page);

    const panel = page.getByTestId("chosen-panel");
    await expect(panel).toBeVisible();
    await expect(page.getByTestId("tuning-region")).toBeVisible();
    await expect(page.getByTestId("nameplate-name")).toHaveText(ENTRY_NAME);

    // D-11's "wrap, never scroll", MEASURED rather than asserted in prose.
    for (const id of ["knob-rack", "tuning-region", "chosen-panel"]) {
      const box = await overflowOf(page, id);
      expect(box, `${id} is on the page`).not.toBeNull();
      expect(
        (box as { scrollWidth: number }).scrollWidth,
        `${id} has nothing to scroll to sideways: ${JSON.stringify(box)}`,
      ).toBeLessThanOrEqual((box as { clientWidth: number }).clientWidth);
    }

    // At this project's own width - 393px on the phone, 1280px on the desktop -
    // the region's content box is above Knob.svelte's 220px threshold, so a
    // knob's label and its control share a line. See the header: this is the
    // 393px fact, and it is why the stacking assertion is not made here.
    const wide = await rowLayout(page);
    expect(wide, "the rack has at least one rail knob").not.toBeNull();
    const w = wide as NonNullable<typeof wide>;
    expect(
      w.layout,
      `${w.id} is side by side at this width: ${JSON.stringify(w)}`,
    ).toBe("side-by-side");

    // 320px: the narrowest width DEGR-01 is written for. Now the container
    // query fires and the layout stacks - and still nothing scrolls sideways.
    await page.setViewportSize({ width: 320, height: 659 });
    await expect
      .poll(
        guarded(
          async () => (await rowLayout(page))?.layout,
          "the first rail knob's row layout",
        ),
        {
          message:
            "the container query re-evaluated after the resize and the row stacked",
          timeout: 10_000,
        },
      )
      .toBe("stacked");

    const narrow = await rowLayout(page);
    const n = narrow as NonNullable<typeof narrow>;
    expect(
      n.control.x,
      `${n.id} stacked: the control sits under the label, at the same x`,
    ).toBe(n.label.x);
    expect(
      n.control.y,
      "and below it, not merely reflowed",
    ).toBeGreaterThanOrEqual(n.label.y + n.label.h);

    for (const id of ["knob-rack", "tuning-region", "chosen-panel"]) {
      const box = await overflowOf(page, id);
      expect(
        (box as { scrollWidth: number }).scrollWidth,
        `${id} still has nothing to scroll to sideways at 320px: ${JSON.stringify(box)}`,
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

    const rails = page.locator("[data-testid='knob-rack'] input[type='range']");
    expect(await rails.count(), "the rack has a rail to turn").toBeGreaterThan(
      0,
    );
    await rails.first().focus();
    await page.keyboard.press("ArrowRight");
    await settled(page);

    expect(
      await sample(page, ENTRY),
      "one keyboard step changes the pad the visitor is looking at",
    ).not.toBe(before);

    // THE requestIdleCallback FALLBACK, OBSERVED FROM OUTSIDE. Safari has no
    // requestIdleCallback, so $lib/tune/idle prefetches the 628 KB formatter on
    // a setTimeout instead. If that fallback never fired, no number would ever
    // land and both meters would still read `measuring…`. This is the only
    // place that branch is visible without instrumenting the page.
    for (const event of ["setup", "timer"] as const) {
      const numerals = page.getByTestId(`meter-${event}`).locator(".numerals");
      await expect(
        numerals,
        `the ${event} meter left ${MEASURING}, so the formatter really did initialise here`,
      ).not.toHaveText(MEASURING);
      await expect(numerals).toHaveText(/^[0-9]+ \/ 908$/);
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
    await expect(copy, "the control arrives as COPY LINK").toHaveText(
      COPY_LINK,
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
    await expect(copy, "and it reverts on its own").toHaveText(COPY_LINK, {
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

    const rails = page.locator("[data-testid='knob-rack'] input[type='range']");
    await rails.first().focus();
    await page.keyboard.press("ArrowRight");
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
      page.getByTestId("chosen-panel"),
      "the panel is open on arrival, without the visitor choosing anything",
    ).toBeVisible();
    await settled(page);

    await expect(page.getByTestId("nameplate-name")).toHaveText(ENTRY_NAME);
    expect(
      await knobIndices(page),
      "every knob came back exactly where the link left it",
    ).toEqual(tuned);

    // DEGR-02: present, really disabled, never hidden - and the reason names
    // the browsers that CAN install rather than apologising for this one.
    const tryOn = page.getByTestId("try-on-device");
    await expect(tryOn).toBeVisible();
    await expect(tryOn).toBeDisabled();
    const copyForThis = failureCopy("no-web-serial", undefined, PRIMARY_LABEL);
    const status = page.getByTestId("connect-status");
    await expect(status).toContainText(copyForThis.title);
    await expect(status).toContainText(copyForThis.detail);
    for (const step of copyForThis.steps) {
      await expect(status).toContainText(step);
    }
    // CONN-01 is a capability test, never a browser test.
    expect(await page.locator("body").innerText()).not.toContain("Chromium");

    expect(consoleErrors).toEqual([]);
  });
});
