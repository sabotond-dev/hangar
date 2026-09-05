// CAT-02 and CAT-03: the browse screen, in a real browser, against the bytes
// that get deployed.
//
// Everything here runs against build/ served by worker/index.js under
// wrangler dev - the deployed bytes, never a development server and never
// `vite preview`, which boots the Node server from .svelte-kit/output/server
// and never reads build/ at all. A filter that only works in `vite dev` is a
// red test rather than a nice demo.
//
// NO TITLE IN THIS FILE CARRIES THE TAG playwright.config.ts greps the
// webkit-phone project by. That project owns the phone journey in its own file,
// and a tag here would silently cost two against the suite total instead of
// one. The tag is deliberately not written out anywhere in this file, because
// the gate for it is a plain grep and a comment naming the thing it forbids
// would make that grep useless. No title carries the word the acceptance gate
// greps the captured log for either, for exactly the same reason.
//
// THE EXPECTED DATA IS IMPORTED, NEVER TRANSCRIBED. src/lib/catalog/listing.ts
// and src/lib/browse/sort.ts each import one erased type and nothing else -
// that is the whole reason they exist as separate modules (D-12) - so naming
// them from a Playwright file costs nothing and means a catalog that grows is
// covered here without anybody editing a list of sixteen ids. A hard-coded list
// in a test file would be a seventeenth declaration of the catalog.
//
// The chain that makes the sort assertions mean something: sort.spec.ts pins
// the three comparators in node against literal id sequences, and the tests
// below pin the rendered DOM against those same comparators. Neither half is a
// tautology; together they say the browser renders the order the module
// computes.
//
// The canvas helpers are e2e/first-experience.e2e.ts's, re-derived rather than
// reinvented: the same 9x9 backing-store read, the same "wait for a picture
// before comparing two empty canvases" rule, the same error-level console
// filter.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { expect, test, type Page } from "@playwright/test";
import { sortListing } from "../src/lib/browse/sort";
import { LISTING } from "../src/lib/catalog/listing";

/** trailingSlash: "always" (src/routes/+layout.ts). Never without the slash. */
const BROWSE = "/browse/";

const GRID = '[data-testid="browse-grid"]';
const CARDS = `${GRID} > li`;

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
 * A COLD ARRIVAL, and the about:blank hop is not ceremony. `page.goto` to the
 * same path with a different query is still a real navigation, but going
 * through about:blank removes every doubt about a warm client router carrying
 * state across - and it is the idiom e2e/tuning.e2e.ts established for exactly
 * this reason.
 */
async function coldGoto(page: Page, path: string): Promise<void> {
  await page.goto("about:blank");
  await page.goto(path);
}

/**
 * THE PRECONDITION, ASSERTED. locator.count() takes a snapshot and does not
 * auto-wait, so a count read before hydration is zero whether or not the cards
 * would ever render; toHaveCount does auto-wait, and waiting for the grid first
 * is what makes the number below mean what it says. That mistake has already
 * been made once in this repository.
 */
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
 * THE COUNT IS SAID THREE WAYS and this helper reads two of them: the visible
 * line, which is aria-hidden, and the always-present visually-hidden expansion
 * beside it, which is what tells a visitor arriving on a shared filtered
 * address how much of the catalog they are looking at. The third way - the live
 * region - is asserted where it belongs, which is by its SILENCE on arrival.
 */
async function expectCount(
  page: Page,
  showing: number,
  total: number,
): Promise<void> {
  await expect(page.getByTestId("browse-count")).toHaveText(
    `${showing} of ${total} configurations.`,
  );
  await expect(page.getByTestId("browse-count-expansion")).toHaveText(
    `Showing ${showing} of ${total} configurations.`,
  );
}

/** The id sequence a sort should produce, computed by the shipped comparator. */
const orderOf = (sort: "featured" | "newest" | "name"): string[] =>
  sortListing(LISTING, sort).map((entry) => entry.id);

/** Wait until the first card is the one the order expects, then read them all. */
async function expectOrder(page: Page, expected: string[]): Promise<void> {
  await expect(page.locator(CARDS).first()).toHaveAttribute(
    "data-testid",
    `card-${expected[0]}`,
  );
  expect(await renderedIds(page)).toEqual(expected);
}

test.describe("the browse screen, with nothing plugged in", () => {
  test("the browse screen lists every configuration with its own description", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await coldGoto(page, BROWSE);
    await waitForCards(page, LISTING.length);

    // The sixteen expected ids come from the listing module, so this file and
    // the catalog cannot drift.
    const ids = await renderedIds(page);
    expect([...ids].sort()).toEqual([...LISTING.map((e) => e.id)].sort());

    // Its OWN description, and at least one tag, read out of the rendered DOM
    // rather than out of the module that produced it.
    const cards = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll('[data-testid="browse-grid"] > li'),
      ).map((li) => {
        const id = (li.getAttribute("data-testid") ?? "").slice("card-".length);
        const description =
          li.querySelector(`#card-description-${id}`)?.textContent ?? "";
        const tags = Array.from(li.querySelectorAll("ul li")).map(
          (tag) => tag.textContent?.trim() ?? "",
        );
        return { id, description: description.trim(), tags };
      }),
    );

    expect(cards.length, "sixteen cards were read").toBe(LISTING.length);
    for (const card of cards) {
      expect(
        card.description.length,
        `${card.id} carries a description`,
      ).toBeGreaterThan(0);
      expect(
        card.tags.filter((tag) => tag.length > 0).length,
        `${card.id} carries at least one tag`,
      ).toBeGreaterThan(0);
    }

    // No two configurations share a sentence. One real description per card is
    // what makes the shelf readable rather than sixteen variations of one line.
    expect(
      new Set(cards.map((card) => card.description)).size,
      "two configurations must not share one description",
    ).toBe(cards.length);

    await expectCount(page, LISTING.length, LISTING.length);
    expect(consoleErrors).toEqual([]);
  });

  test("sorting reorders the grid and the address", async ({ page }) => {
    await coldGoto(page, BROWSE);
    await waitForCards(page, LISTING.length);

    const sortGroup = page.getByTestId("browse-sort");
    const option = (word: string) => sortGroup.getByText(word, { exact: true });
    const radio = (value: string) =>
      sortGroup.locator(`input[value="${value}"]`);

    // FEATURED is where a plain /browse/ opens, so the opening order is the
    // first thing asserted and the address carries no sort key at all.
    await expect(radio("featured")).toBeChecked();
    await expectOrder(page, orderOf("featured"));

    // NAME. Deterministic in full: sort.spec.ts pins the comparator against
    // literal ids in node, so what is proven here is that the DOM renders it.
    await option("NAME").click();
    await expect(radio("name")).toBeChecked();
    await expectOrder(page, orderOf("name"));
    await expect(page).toHaveURL(/\/browse\/\?sort=name$/);

    // NEWEST, AND THE ASSERTION IS THE BLOCK BOUNDARY RATHER THAN A SEQUENCE.
    // There are exactly two distinct addedAt values today - 2026-09-02 for the
    // nine ported entries and 2026-09-04 for the seven Lua ones - so "newest"
    // is two blocks and not a ranking. A strict sixteen-element sequence would
    // be brittle the day one date changes; the property that is actually true
    // is that no card is older than the card above it.
    await option("NEWEST").click();
    await expect(radio("newest")).toBeChecked();
    await expect(page).toHaveURL(/\/browse\/\?sort=newest$/);
    await expect(page.locator(CARDS)).toHaveCount(LISTING.length);

    const addedAt = new Map(LISTING.map((entry) => [entry.id, entry.addedAt]));
    const newest = await renderedIds(page);
    expect([...newest].sort()).toEqual([...addedAt.keys()].sort());
    const dates = newest.map((id) => addedAt.get(id) as string);
    expect(
      new Set(dates).size,
      "the block boundary is vacuous unless two dates exist",
    ).toBeGreaterThan(1);
    for (let i = 1; i < dates.length; i += 1) {
      expect(
        dates[i] <= dates[i - 1],
        `${newest[i]} (${dates[i]}) must not sit above ${newest[i - 1]} (${dates[i - 1]})`,
      ).toBe(true);
    }

    // Back to FEATURED, which is the DEFAULT: a plain /browse/ is canonical, so
    // the address must lose its sort key rather than gain ?sort=featured.
    await option("FEATURED").click();
    await expect(radio("featured")).toBeChecked();
    await expectOrder(page, orderOf("featured"));
    await expect(page).toHaveURL(/\/browse\/$/);
  });

  test("searching and tag chips narrow the grid, and CLEAR FILTERS brings it back", async ({
    page,
  }) => {
    await coldGoto(page, BROWSE);
    await waitForCards(page, LISTING.length);

    const total = LISTING.length;
    const field = page.getByTestId("browse-search");
    const sortGroup = page.getByTestId("browse-sort");
    const chip = (tag: string) => page.getByTestId(`tag-${tag}`);
    const chipBox = (tag: string) => chip(tag).locator("input");

    // A TYPED WORD. Filtering is synchronous on every keystroke, so the grid is
    // asserted with no waiting beyond the locator's own.
    const expectedForDrums = sortListing(
      LISTING.filter((entry) =>
        [entry.name, entry.description, ...entry.tags]
          .join(" ")
          .toLowerCase()
          .includes("drums"),
      ),
      "featured",
    ).map((entry) => entry.id);
    expect(
      expectedForDrums.length,
      "the typed word narrows the catalog without emptying it",
    ).toBeGreaterThan(1);

    await field.fill("drums");
    await expect(page.locator(CARDS)).toHaveCount(expectedForDrums.length);
    expect(await renderedIds(page)).toEqual(expectedForDrums);
    await expectCount(page, expectedForDrums.length, total);

    // The field's own CLEAR, which exists only while there is something to
    // clear and hands focus back to the field it removes itself from.
    await page.getByTestId("browse-search-clear").click();
    await expect(page.locator(CARDS)).toHaveCount(total);
    await expect(field).toBeFocused();

    // TWO CHIPS, COMBINING WITH AND. playable is carried by four entries and
    // generative by three; their intersection is one, which is the whole reason
    // the chips intersect rather than union (05.1-UI-SPEC W-04).
    const withTag = (tag: string) =>
      LISTING.filter((entry) => entry.tags.includes(tag)).map((e) => e.id);
    const playable = sortListing(
      LISTING.filter((entry) => entry.tags.includes("playable")),
      "featured",
    ).map((entry) => entry.id);
    expect(playable.length, "playable is a real chip").toBeGreaterThan(1);

    await chip("playable").click();
    await expect(chipBox("playable")).toBeChecked();
    await expect(page.locator(CARDS)).toHaveCount(playable.length);
    expect(await renderedIds(page)).toEqual(playable);
    await expectCount(page, playable.length, total);

    const both = playable.filter((id) => withTag("generative").includes(id));
    expect(
      both.length,
      "the intersection is smaller than either chip alone",
    ).toBeLessThan(playable.length);
    await chip("generative").click();
    await expect(chipBox("generative")).toBeChecked();
    await expect(page.locator(CARDS)).toHaveCount(both.length);
    expect(await renderedIds(page)).toEqual(both);
    await expectCount(page, both.length, total);

    // A CHIP THAT WOULD RETURN NOTHING IS A REAL disabled ATTRIBUTE, never
    // aria-disabled alone and never a bare number beside the word. 32 of the 41
    // shipped tags sit on exactly one configuration, so without this an
    // intersection would empty the grid on the second press most of the time.
    const disabled = page.locator('[data-testid="browse-tags"] input:disabled');
    expect(
      await disabled.count(),
      "at least one chip cannot change the grid and says so",
    ).toBeGreaterThan(0);

    // CLEAR FILTERS. The query and every tag, and the address back to the bare
    // canonical form.
    await page.getByTestId("browse-clear-filters").click();
    await expect(page.locator(CARDS)).toHaveCount(total);
    await expect(chipBox("playable")).not.toBeChecked();
    await expect(chipBox("generative")).not.toBeChecked();
    await expectCount(page, total, total);
    await expect(page).toHaveURL(/\/browse\/$/);
    await expect(sortGroup.locator('input[value="featured"]')).toBeChecked();

    // AND THE SORT IS NOT A FILTER. The assertion above is true but vacuous
    // while the sort sits on its default, so it is made again from a sort the
    // visitor chose: CLEAR FILTERS must leave ?sort=name standing, because
    // resetting a view preference would undo something nobody asked to undo.
    await sortGroup.getByText("NAME", { exact: true }).click();
    await expect(sortGroup.locator('input[value="name"]')).toBeChecked();
    await expect(page).toHaveURL(/\/browse\/\?sort=name$/);

    await chip("playable").click();
    await expect(page.locator(CARDS)).toHaveCount(playable.length);
    await page.getByTestId("browse-clear-filters").click();
    await expect(page.locator(CARDS)).toHaveCount(total);
    await expect(page).toHaveURL(/\/browse\/\?sort=name$/);
    await expect(sortGroup.locator('input[value="name"]')).toBeChecked();
    expect(await renderedIds(page)).toEqual(orderOf("name"));
  });
});
