// CAT-02 / CAT-03 / DEGR-01: the browse screen on the engine a large share of
// visitors will actually use it with.
//
// Four tests, and EVERY TITLE ENDS WITH THE TAG the webkit-phone project greps
// for. That is the whole arithmetic of this file, and e2e/tuning-webkit.e2e.ts
// wrote it out first:
//
//   - playwright.config.ts gives the chromium project NO grep, so chromium runs
//     every test in the suite, tagged or not, at devices["Desktop Chrome"]
//     (1280x720).
//   - webkit-phone carries grep: /@webkit/ and devices["iPhone 15"]
//     (393x659, isMobile, hasTouch).
//   - A tagged title therefore RUNS TWICE and COUNTS TWICE. This file's four
//     tests contribute eight to the suite total.
//
// THAT ASYMMETRY IS ALSO WHY COUNTING TITLE OPENINGS IN SOURCE CANNOT PROVE A
// NON-ZERO e2e DELTA (plan 11-08.1). A tagged title counts ONCE in a source grep
// and TWICE in the run. The convention that a suite-running plan proves its own
// zero that way is sound while the term is zero and unsound for anything else:
// the fourth test below moves the grep by one and the run by two, and both
// numbers belong in a summary. (The grep pattern is deliberately not written out
// in this comment. It is a plain substring scan, and quoting it here added a
// phantom match to the file's own count - observed, on the first attempt.)
//
// It is not a second phone run: chromium takes the same assertions at a desktop
// width on a different engine, which is what makes these four cross-browser
// rather than WebKit-only. Every assertion below is therefore written to be
// true at BOTH widths, and where the answer genuinely differs by width - the
// column count - it is computed from the shipped ladder rather than typed.
//
// WHY THESE FOUR AND NOT A COPY OF e2e/browse.e2e.ts. iOS Safari can never
// install, so for a large share of visitors the catalog IS the product. The
// four things that decide whether the shelf works on a phone are: it renders
// at one column with nothing hanging off the side, a pad that does not animate
// is still lit after the grid reorders under it, the search field does not
// zoom the viewport the moment it is touched, and - the one this file was
// missing until 11-08.1 - a pad whose backing store the engine drops gets its
// picture back instead of going black for the rest of the visit. Everything
// else about the screen is engine-independent and is proven once, in chromium.
//
// NOTHING HERE READS A CLIPBOARD. context.grantPermissions(["clipboard-read",
// "clipboard-write"]) is chromium-only and throws on WebKit, and this phase
// touches no COPY LINK control at all.
//
// Everything runs against build/ served by worker/index.js under wrangler dev.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { expect, test, type Page } from "@playwright/test";
import { columnsForWidth, columnsFromTemplate } from "../src/lib/browse/grid";
import { sortListing, type BrowseSort } from "../src/lib/browse/sort";
import { LISTING } from "../src/lib/catalog/listing";
import { guarded } from "./poll";

/** trailingSlash: "always" (src/routes/+layout.ts). Never without the slash. */
const BROWSE = "/playground/";

const GRID = '[data-testid="browse-grid"]';
const CARDS = `${GRID} > li`;

/** Only error-level messages: the protocol package logs at console.log. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

/** A cold arrival, through about:blank. (e2e/browse.e2e.ts) */
async function coldGoto(page: Page, path: string): Promise<void> {
  await page.goto("about:blank");
  await page.goto(path);
}

/** The precondition, asserted: the grid is up and holds what it should. */
async function waitForCards(page: Page, expected: number): Promise<void> {
  await expect(page.getByTestId("browse-grid")).toBeVisible();
  await expect(page.locator(CARDS)).toHaveCount(expected);
}

/** The rendered card ids, in DOM order - which is the order on the screen. */
function renderedIds(page: Page): Promise<string[]> {
  return page.evaluate((selector) => {
    return Array.from(document.querySelectorAll(selector)).map((li) =>
      (li.getAttribute("data-testid") ?? "").slice("card-".length),
    );
  }, CARDS);
}

/**
 * The id sequence a sort should produce, computed by the shipped comparator.
 *
 * The parameter is BrowseSort rather than a literal union restating it. It used
 * to read `"featured" | "newest" | "name"` - the same three-member restatement
 * browse.e2e.ts carried - and D-11 removed one of the three. A restatement is
 * how a file goes on naming a sort the comparators no longer implement; taking
 * the type from sortListing's own signature is how it cannot.
 */
const orderOf = (sort: BrowseSort): string[] =>
  sortListing(LISTING, sort).map((entry) => entry.id);

/**
 * The live grid, measured: the column count parsed out of the real computed
 * template by the SHIPPED parser, and the content width the shipped ladder is
 * a function of. Two numbers rather than one, so the assertion can be "these
 * agree" instead of "this equals a number somebody typed".
 */
function gridGeometry(
  page: Page,
): Promise<{ template: string; width: number } | null> {
  return page.evaluate((selector) => {
    const grid = document.querySelector(selector);
    if (grid === null) return null;
    return {
      template: getComputedStyle(grid).gridTemplateColumns,
      width: Math.round(grid.clientWidth),
    };
  }, GRID);
}

/** scrollWidth versus clientWidth on the document. A measurement, not a style grep. */
function documentOverflow(
  page: Page,
): Promise<{ scrollWidth: number; clientWidth: number }> {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
}

/**
 * How many of a pad's 81 cells are lit, read straight off the canvas backing
 * store. A count rather than the 324-byte string, because what test 2 needs to
 * know is "is there still a picture here", and a count says that in one number
 * that can be printed into the run's output.
 *
 * THREE RETURN SHAPES, AND THE THIRD IS A DIAGNOSTIC RATHER THAN A FIX.
 *
 *   number - the count.
 *   null   - the canvas is not on the page, or has no 9x9 backing store yet.
 *   string - THE ENGINE REFUSED, and this is the one that was missing. The body
 *            had no try, so getContext or getImageData throwing sent the raw
 *            error out of a poll callback - which Playwright evaluates OUTSIDE
 *            its retry try block (see e2e/poll.ts), so the test died at the
 *            first attempt with an unattributed stack. Two waves of summaries
 *            could describe the flake's SHAPE and never its cause because of
 *            exactly this.
 *
 * Catching it improves attribution and CHANGES NOTHING about the product. The
 * product half - a SimHost that notices a dead 2D context - is src/lib/sim/
 * host.ts, and the test at the bottom of this file is what proves it.
 */
function litCells(page: Page, id: string): Promise<number | string | null> {
  return page.evaluate((sel) => {
    try {
      const canvas = document.querySelector(sel) as HTMLCanvasElement | null;
      if (canvas === null || canvas.width !== 9) return null;
      const ctx = canvas.getContext("2d");
      if (ctx === null) return null;
      const data = ctx.getImageData(0, 0, 9, 9).data;
      let lit = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) lit += 1;
      }
      return lit;
    } catch (error) {
      // The error's OWN name and message, so the failure says which engine
      // refused and why instead of pointing at a line number.
      const name = error instanceof Error ? error.name : typeof error;
      const message = error instanceof Error ? error.message : String(error);
      return `the page refused to read this canvas: ${name}: ${message}`;
    }
  }, `[data-testid="pad-canvas-${id}"]`);
}

/** litCells as a number, or undefined when it came back null or a message. */
function countOf(value: number | string | null): number | undefined {
  return typeof value === "number" ? value : undefined;
}

/**
 * Kill a pad's picture the way a dropped backing store looks, and optionally
 * tell the page it is back.
 *
 * THE VACUITY TRAP THIS AVOIDS, NAMED SO IT CANNOT BE WALKED BACK INTO. A
 * synthetic `contextlost` does not actually lose anything. A test that
 * dispatched the event and then asserted the pixels were unchanged would PASS
 * AGAINST THE UNFIXED CODE, because the pixels were never disturbed. So the
 * store is CLEARED from the test, which is what a dropped-and-restored backing
 * store actually looks like from the page: blank.
 *
 * It returns `defaultPrevented` as well, because the canvas-2D polarity is the
 * opposite of WebGL's: per the HTML standard, canceling `contextlost` is what
 * tells the user agent NOT to restore. src/lib/sim/host.ts must therefore leave
 * it alone, and this is the assertion that says so.
 */
function dropBackingStore(
  page: Page,
  id: string,
  restore: boolean,
): Promise<{
  defaultPrevented: boolean;
  blanked: number;
  restored: boolean;
} | null> {
  return page.evaluate(
    ([sel, doRestore]) => {
      const canvas = document.querySelector(
        sel as string,
      ) as HTMLCanvasElement | null;
      if (canvas === null || canvas.width !== 9) return null;

      const lost = new Event("contextlost", { cancelable: true });
      canvas.dispatchEvent(lost);

      const ctx = canvas.getContext("2d");
      if (ctx === null) return null;
      ctx.clearRect(0, 0, 9, 9);
      const data = ctx.getImageData(0, 0, 9, 9).data;
      let blanked = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) blanked++;
      }

      if (doRestore) canvas.dispatchEvent(new Event("contextrestored"));
      return {
        defaultPrevented: lost.defaultPrevented,
        blanked,
        restored: doRestore === true,
      };
    },
    [`[data-testid="pad-canvas-${id}"]`, restore] as [string, boolean],
  );
}

/** Where a card sits: its DOM index, and its box on screen. */
function cardPlace(
  page: Page,
  id: string,
): Promise<{ index: number; x: number; y: number } | null> {
  return page.evaluate(
    ([selector, wanted]) => {
      const cards = Array.from(document.querySelectorAll(selector));
      const index = cards.findIndex(
        (li) => li.getAttribute("data-testid") === `card-${wanted}`,
      );
      if (index < 0) return null;
      const box = cards[index].getBoundingClientRect();
      return { index, x: Math.round(box.x), y: Math.round(box.y) };
    },
    [CARDS, id] as [string, string],
  );
}

/**
 * Count the contextlost / contextrestored events the ENGINE fires, as opposed
 * to the ones this file dispatches. `isTrusted` is the whole discriminator, and
 * the listener is a capturing one on `document` because the spec fires these at
 * the canvas without bubbling - capture reaches a non-bubbling event, bubble
 * does not.
 *
 * IT MEASURES OR IT REPORTS AN UNKNOWN, AND NEVER GUESSES. Emission cannot be
 * forced from a test, so a zero here is "not observed in this run", not "WebKit
 * does not emit these". That difference is exactly why the paint-time guard in
 * src/lib/sim/host.ts is not optional: a fix that depended on an event the
 * engine may never send would run green here and blank the pads on the device
 * the bug was found on.
 */
async function watchTrustedContextEvents(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const store = window as unknown as {
      __trustedContextEvents: { lost: number; restored: number };
    };
    store.__trustedContextEvents = { lost: 0, restored: 0 };
    document.addEventListener(
      "contextlost",
      (e) => {
        if (e.isTrusted) store.__trustedContextEvents.lost++;
      },
      true,
    );
    document.addEventListener(
      "contextrestored",
      (e) => {
        if (e.isTrusted) store.__trustedContextEvents.restored++;
      },
      true,
    );
  });
}

test.describe("the shelf on a phone engine", () => {
  test("the browse screen renders on a phone @webkit", async ({ page }) => {
    const consoleErrors = collectErrors(page);
    await coldGoto(page, BROWSE);
    await waitForCards(page, LISTING.length);

    // The count line, both of the ways it is said out loud. The visually-hidden
    // expansion is the one a screen reader gets, and on a phone it is the only
    // one a visitor can hear.
    await expect(page.getByTestId("browse-count")).toHaveText(
      `${LISTING.length} of ${LISTING.length} configurations.`,
    );
    await expect(page.getByTestId("browse-count-expansion")).toHaveText(
      `Showing ${LISTING.length} of ${LISTING.length} configurations.`,
    );

    // THE COLUMN COUNT IS AGREEMENT, NOT A LITERAL. This test runs at 393px on
    // the phone and at 1280px in chromium, so a hard "one column" would be
    // false in one of the two projects. What is asserted instead is that the
    // ladder in $lib/browse/grid - pinned in node by grid.spec.ts against
    // 05.1-UI-SPEC.md Screen 2b's table - predicts what the browser really did
    // with `repeat(auto-fill, minmax(260px, 1fr))` at whatever width this
    // project runs at. The spec's bottom row is then asserted directly, below.
    const geometry = await gridGeometry(page);
    expect(geometry, "the grid is on the page and measurable").not.toBeNull();
    const live = geometry as NonNullable<typeof geometry>;
    const columns = columnsFromTemplate(live.template);
    expect(
      columns,
      `the shipped ladder and the real layout agree at ${live.width}px: ${live.template}`,
    ).toBe(columnsForWidth(live.width));
    console.log(
      `browse on this project: ${live.width}px content width, ${columns} columns`,
    );

    // AND THE PHONE ROW OF THE TABLE, ASSERTED AT A PHONE WIDTH. Below 544px of
    // content the grid is one column, which is what a 393px device gets; 375px
    // is narrower than any device this file runs on, so both projects take the
    // same branch here and neither is asserting something vacuous.
    await page.setViewportSize({ width: 375, height: 659 });
    await expect
      .poll(
        guarded(
          async () => columnsFromTemplate((await gridGeometry(page))?.template),
          "the grid's computed template",
        ),
        {
          message: "the grid collapses to a single column on a phone",
          timeout: 10_000,
        },
      )
      .toBe(1);
    await expect(page.locator(CARDS)).toHaveCount(LISTING.length);

    // NOTHING SCROLLS SIDEWAYS, at either width. Measured on the document
    // element rather than grepped out of a stylesheet.
    const narrow = await documentOverflow(page);
    expect(
      narrow.scrollWidth,
      `the page has nothing to scroll to sideways at 375px: ${JSON.stringify(narrow)}`,
    ).toBeLessThanOrEqual(narrow.clientWidth);

    expect(consoleErrors).toEqual([]);
  });

  test("a still configuration stays lit after a sort @webkit", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);

    // WHAT THIS TEST SETTLES, AND WHY THE ANSWER IS ALLOWED TO BE AN ASSERTION.
    // A keyed {#each} MOVES an <li> rather than recreating it when the sort
    // changes, and whether a canvas keeps its bitmap across that re-parenting is
    // genuinely unspecified across engines - Pitfall 10 in the phase's research
    // names it and does not answer it. BrowseGrid.svelte does not depend on the
    // answer: after any reorder it awaits Svelte's tick() and calls
    // SimHost.repaintAll(), which repaints every registered pad from its
    // engine's current frame whether or not it is on screen. That is what makes
    // the outcome deterministic and therefore assertable. The two lit-cell
    // counts are printed anyway, because the underlying question is worth
    // having evidence about either way.
    //
    // THE ENTRY MUST BE STILL AND LIT. A restsBlack entry would be black before
    // and after and this test would pass against an implementation that painted
    // nothing at all; an animated one would be repainted by the tick loop and
    // would say nothing about the reorder. `motion` and `restsBlack` are both
    // recorded facts asserted against frames.json in both directions, so the
    // choice is derived from the catalog rather than from a list of ids.
    const featured = orderOf("featured");
    const byName = orderOf("name");
    // The two the plan names, in preference order. They are NAMED here and
    // their two declared facts are then checked against the catalog, rather
    // than the whole choice being derived: every still, lit entry satisfies the
    // derivation, and the first one it happens to return is Joystick, whose
    // still frame is a SINGLE lit cell of 81. That would be a true assertion
    // resting on one pixel. Nine pads lights nine, which is a picture.
    const PREFERRED = ["ninepads", "faders"];
    const candidate = PREFERRED.map((id) =>
      LISTING.find((entry) => entry.id === id),
    ).find(
      (entry) =>
        entry !== undefined &&
        entry.motion === "static" &&
        !entry.restsBlack &&
        featured.indexOf(entry.id) !== byName.indexOf(entry.id),
    );
    expect(
      candidate,
      "the catalog declares a still, lit configuration that the two sorts place differently",
    ).toBeDefined();
    const still = candidate as NonNullable<typeof candidate>;

    await coldGoto(page, BROWSE);
    await waitForCards(page, LISTING.length);

    // The card has to have been ON SCREEN once for its engine to be built at
    // all: BrowseGrid builds per card, on first intersection.
    const card = page.locator(`[data-testid="card-${still.id}"]`);
    await card.scrollIntoViewIfNeeded();
    await expect
      .poll(
        guarded(() => litCells(page, still.id), `${still.id}'s pad`),
        {
          message: `${still.id} built its engine and painted a picture`,
          timeout: 30_000,
        },
      )
      .toBeGreaterThan(0);

    const before = countOf(await litCells(page, still.id));
    const wasAt = (await renderedIds(page)).indexOf(still.id);
    expect(wasAt, `${still.id} is in the grid before the sort`).toBe(
      featured.indexOf(still.id),
    );

    // THE SORT, which is what moves the <li> in the DOM.
    await page.getByTestId("browse-sort").selectOption("name");
    await expect(page.getByTestId("browse-sort")).toHaveValue("name");
    await expect
      .poll(
        guarded(() => renderedIds(page), "the rendered card order"),
        {
          message: "the grid re-rendered in name order",
          timeout: 10_000,
        },
      )
      .toEqual(byName);

    const nowAt = (await renderedIds(page)).indexOf(still.id);
    expect(
      nowAt,
      `${still.id} really moved in the DOM: ${wasAt} to ${nowAt}`,
    ).not.toBe(wasAt);

    const after = countOf(await litCells(page, still.id));
    console.log(
      `${still.id} lit cells across a sort: ${String(before)} before at index ${wasAt}, ` +
        `${String(after)} after at index ${nowAt} (of 81)`,
    );

    expect(before, `${still.id} was lit before the sort`).toBeDefined();
    expect(
      after,
      `${still.id} is still on the page after the sort`,
    ).toBeDefined();
    expect(before as number).toBeGreaterThan(0);
    expect(
      after as number,
      `${still.id} is a still pad and nothing ticks it, so only repaintAll() can have kept it lit`,
    ).toBeGreaterThan(0);

    expect(consoleErrors).toEqual([]);
  });

  test("the search field does not zoom the viewport @webkit", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await coldGoto(page, BROWSE);
    await waitForCards(page, LISTING.length);

    const field = page.getByTestId("browse-search");

    // 16px IS THE iOS ZOOM FLOOR AND IT IS IN THE SPEC RATHER THAN IN A
    // PREFERENCE. Safari on iOS zooms the page when a text field smaller than
    // 16px takes focus, and it never zooms back out on its own - the visitor is
    // left on a magnified page with a horizontal scrollbar they did not ask
    // for. The number is asserted as a COMPUTED style, so a rule that overrode
    // it anywhere in the cascade is caught rather than the declaration merely
    // being present in a file.
    await expect(field, "the search field is at the iOS zoom floor").toHaveCSS(
      "font-size",
      "16px",
    );

    const measure = () =>
      page.evaluate(() => ({
        scale: window.visualViewport ? window.visualViewport.scale : null,
        layoutWidth: Math.round(document.documentElement.clientWidth),
        innerWidth: Math.round(window.innerWidth),
      }));

    const before = await measure();
    await field.click();
    await expect(field).toBeFocused();
    // Any zoom would be applied by the time the field has focus; the wait is
    // for a viewport animation that has no event to wait on.
    await page.waitForTimeout(500);
    const after = await measure();

    console.log(
      `search field focus: ${JSON.stringify(before)} before, ${JSON.stringify(after)} after`,
    );

    // The scale is the direct answer where visualViewport exists, and the
    // layout width is the fallback the plan names for where it does not - both
    // are asserted, so neither engine is left with nothing checked.
    expect(
      after.scale,
      `focusing the field must not zoom: scale ${String(before.scale)} to ${String(after.scale)}`,
    ).toBe(before.scale);
    expect(after.layoutWidth, "and the layout viewport did not move").toBe(
      before.layoutWidth,
    );
    expect(after.innerWidth).toBe(before.innerWidth);

    // And typing into it still works, so this is not passing on a field nobody
    // can reach.
    await field.fill("aurora");
    await expect(page.locator(CARDS)).toHaveCount(1);

    expect(consoleErrors).toEqual([]);
  });

  /*
    A PAD WHOSE BACKING STORE DIES GETS ITS PICTURE BACK, ON THE CARD IT IS
    ALREADY SITTING ON (plan 11-08.1, CANVAS-CONTEXT-LOSS.md).

    ONE TITLE, TWO BRANCHES, following 11-08's precedent of extending rather
    than adding, and because the two branches are the two halves of one fix that
    must not be conflated - see src/lib/sim/host.ts's header table.

    WHAT EACH BRANCH IS RED AGAINST, stated rather than implied, because a
    negative check that cannot redden is this phase's recurring lesson:

      STILL BRANCH   - red against the code as it shipped before this plan. A
                       still pad never paints again, so with no contextrestored
                       listener nothing on earth repaints it and it is black
                       forever. This is the assertion.

      ANIMATING      - GREEN against that same unfixed code, and it is said out
      BRANCH           loud rather than hidden: clearing pixels does not lose a
                       context, so an unfixed host's loop simply repaints. What
                       it IS red against is a build that has the listener half
                       and no paint-time guard - the listener clears entry.ctx,
                       nothing re-acquires, and the pad stays black while the
                       engine runs. src/lib/sim/host.spec.ts reddens that same
                       counterfactual in node, where the context can really be
                       made to report itself lost.

    NEITHER BRANCH SORTS, SCROLLS AWAY FROM, RELOADS OR RE-REGISTERS THE CARD.
    BrowseGrid.svelte's `started` set builds a card's engine exactly once ever,
    and the recovery happens entirely inside SimHost with no second register().
    repaintAll() would also heal a still pad on a sort - that is a bonus, not the
    mechanism, and this test must not lean on it - so the card's DOM index and
    its box on screen are asserted unmoved across the whole thing.
  */
  test("a pad whose backing store dies gets its picture back where it sits @webkit", async ({
    page,
  }) => {
    await watchTrustedContextEvents(page);
    const consoleErrors = collectErrors(page);

    // Both cards are DERIVED from the catalog's recorded facts, never typed as
    // ids - the same rule the sort test above follows. The still one is
    // preferred out of the two whose still frame is a picture rather than a
    // single lit cell, because "one pixel came back" is a true assertion
    // resting on nothing.
    const stillest = ["ninepads", "faders"]
      .map((id) => LISTING.find((entry) => entry.id === id))
      .find(
        (entry) =>
          entry !== undefined && entry.motion === "static" && !entry.restsBlack,
      );
    expect(
      stillest,
      "the catalog declares a still, lit configuration",
    ).toBeDefined();
    const still = stillest as NonNullable<typeof stillest>;

    const moving = orderOf("featured").find((id) => {
      const entry = LISTING.find((e) => e.id === id);
      return entry?.motion === "animated" && !entry.restsBlack;
    });
    expect(
      moving,
      "the catalog declares an animated, lit configuration",
    ).toBeDefined();
    const movingId = moving as string;

    await coldGoto(page, BROWSE);
    await waitForCards(page, LISTING.length);

    // ---- BRANCH ONE: THE STILL CARD ------------------------------------
    await page
      .locator(`[data-testid="card-${still.id}"]`)
      .scrollIntoViewIfNeeded();
    await expect
      .poll(
        guarded(() => litCells(page, still.id), `${still.id}'s pad`),
        {
          message: `${still.id} built its engine and painted a picture`,
          timeout: 30_000,
        },
      )
      .toBeGreaterThan(0);

    const before = countOf(await litCells(page, still.id));
    expect(
      before,
      `${still.id} is lit before anything is done to it`,
    ).toBeDefined();
    const wasAt = await cardPlace(page, still.id);
    expect(wasAt, `${still.id} is placed in the grid`).not.toBeNull();

    const killed = await dropBackingStore(page, still.id, true);
    expect(killed, `${still.id}'s canvas was reachable`).not.toBeNull();
    const k = killed as NonNullable<typeof killed>;

    // THE CLEAR REALLY HAPPENED. Without this the whole test is the vacuous
    // version: dispatch an event, disturb nothing, assert nothing changed.
    expect(
      k.blanked,
      `${still.id}'s 9x9 store was cleared from the test, so the recovery below is a real one`,
    ).toBe(0);

    // AND THE HOST DID NOT CANCEL THE EVENT. Canceling contextlost on a 2D
    // canvas is what tells the user agent NOT to restore - the opposite of the
    // WebGL idiom, and the single most likely way to ship a listener that runs
    // and achieves nothing.
    expect(
      k.defaultPrevented,
      "src/lib/sim/host.ts called preventDefault() on contextlost, which on a 2D canvas suppresses restoration",
    ).toBe(false);

    await expect
      .poll(
        guarded(() => litCells(page, still.id), `${still.id}'s pad, healing`),
        {
          message: `${still.id} is a STILL pad: nothing ticks it, so only a contextrestored listener can have put its picture back`,
          timeout: 30_000,
        },
      )
      .toBe(before);

    const nowAt = await cardPlace(page, still.id);
    expect(
      nowAt,
      `${still.id} healed exactly where it sat: no sort, no scroll, no reload, no re-register`,
    ).toEqual(wasAt);

    // ---- BRANCH TWO: THE ANIMATING CARD, WITH NO contextrestored --------
    await page
      .locator(`[data-testid="card-${movingId}"]`)
      .scrollIntoViewIfNeeded();
    await expect
      .poll(
        guarded(() => litCells(page, movingId), `${movingId}'s pad`),
        {
          message: `${movingId} built its engine and painted a picture`,
          timeout: 30_000,
        },
      )
      .toBeGreaterThan(0);

    const movingKilled = await dropBackingStore(page, movingId, false);
    expect(movingKilled, `${movingId}'s canvas was reachable`).not.toBeNull();
    const m = movingKilled as NonNullable<typeof movingKilled>;
    expect(m.blanked, `${movingId}'s store was cleared`).toBe(0);
    expect(
      m.restored,
      "no contextrestored was dispatched, so only the paint-time guard can answer this branch",
    ).toBe(false);

    await expect
      .poll(
        guarded(() => litCells(page, movingId), `${movingId}'s pad, healing`),
        {
          message: `${movingId} is ANIMATING: it came back on its own next paint with no event at all`,
          timeout: 30_000,
        },
      )
      .toBeGreaterThan(0);

    const stillAfter = countOf(await litCells(page, still.id));
    const movingAfter = countOf(await litCells(page, movingId));
    const trusted = await page.evaluate(
      () =>
        (
          window as unknown as {
            __trustedContextEvents: { lost: number; restored: number };
          }
        ).__trustedContextEvents,
    );
    console.log(
      `context loss recovery: ${still.id} (still) ${String(before)} lit before, ` +
        `0 while dropped, ${String(stillAfter)} after contextrestored at index ${wasAt?.index}; ` +
        `${movingId} (animating) ${String(movingAfter)} lit after a drop with NO event; ` +
        `engine-fired (isTrusted) contextlost ${trusted.lost}, contextrestored ${trusted.restored}`,
    );

    expect(consoleErrors).toEqual([]);
  });
});
