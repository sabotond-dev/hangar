// CAT-02 / CAT-03 / DEGR-01: the browse screen on the engine a large share of
// visitors will actually use it with.
//
// Three tests, and EVERY TITLE ENDS WITH THE TAG the webkit-phone project greps
// for. That is the whole arithmetic of this file, and e2e/tuning-webkit.e2e.ts
// wrote it out first:
//
//   - playwright.config.ts gives the chromium project NO grep, so chromium runs
//     every test in the suite, tagged or not, at devices["Desktop Chrome"]
//     (1280x720).
//   - webkit-phone carries grep: /@webkit/ and devices["iPhone 15"]
//     (393x659, isMobile, hasTouch).
//   - A tagged title therefore RUNS TWICE and COUNTS TWICE. This file's three
//     tests contribute six to the suite total.
//
// It is not a second phone run: chromium takes the same assertions at a desktop
// width on a different engine, which is what makes these three cross-browser
// rather than WebKit-only. Every assertion below is therefore written to be
// true at BOTH widths, and where the answer genuinely differs by width - the
// column count - it is computed from the shipped ladder rather than typed.
//
// WHY THESE THREE AND NOT A COPY OF e2e/browse.e2e.ts. iOS Safari can never
// install, so for a large share of visitors the catalog IS the product. The
// three things that decide whether the shelf works on a phone are: it renders
// at one column with nothing hanging off the side, a pad that does not animate
// is still lit after the grid reorders under it, and the search field does not
// zoom the viewport the moment it is touched. Everything else about the screen
// is engine-independent and is proven once, in chromium.
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

/** trailingSlash: "always" (src/routes/+layout.ts). Never without the slash. */
const BROWSE = "/browse/";

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
 */
function litCells(page: Page, id: string): Promise<number | null> {
  return page.evaluate((sel) => {
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
  }, `[data-testid="pad-canvas-${id}"]`);
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
        async () => columnsFromTemplate((await gridGeometry(page))?.template),
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
      .poll(() => litCells(page, still.id), {
        message: `${still.id} built its engine and painted a picture`,
        timeout: 30_000,
      })
      .toBeGreaterThan(0);

    const before = await litCells(page, still.id);
    const wasAt = (await renderedIds(page)).indexOf(still.id);
    expect(wasAt, `${still.id} is in the grid before the sort`).toBe(
      featured.indexOf(still.id),
    );

    // THE SORT, which is what moves the <li> in the DOM.
    await page
      .getByTestId("browse-sort")
      .getByText("NAME", { exact: true })
      .click();
    await expect(
      page.getByTestId("browse-sort").locator('input[value="name"]'),
    ).toBeChecked();
    await expect
      .poll(() => renderedIds(page), {
        message: "the grid re-rendered in name order",
        timeout: 10_000,
      })
      .toEqual(byName);

    const nowAt = (await renderedIds(page)).indexOf(still.id);
    expect(
      nowAt,
      `${still.id} really moved in the DOM: ${wasAt} to ${nowAt}`,
    ).not.toBe(wasAt);

    const after = await litCells(page, still.id);
    console.log(
      `${still.id} lit cells across a sort: ${String(before)} before at index ${wasAt}, ` +
        `${String(after)} after at index ${nowAt} (of 81)`,
    );

    expect(before, `${still.id} was lit before the sort`).not.toBeNull();
    expect(
      after,
      `${still.id} is still on the page after the sort`,
    ).not.toBeNull();
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
});
