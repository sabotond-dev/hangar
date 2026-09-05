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
// THE EXPECTED DATA IS IMPORTED, NEVER TRANSCRIBED. src/lib/catalog/listing.ts,
// src/lib/browse/sort.ts and src/lib/browse/filter.ts each import one erased
// type, and src/lib/browse/grid.ts imports nothing at all -
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
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { filterListing } from "../src/lib/browse/filter";
import { columnsFromTemplate } from "../src/lib/browse/grid";
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

const canvasOf = (id: string) => `[data-testid="pad-canvas-${id}"]`;

/**
 * The 9x9 backing store as a comma-joined string of its 324 RGBA bytes, or null
 * when the element or its context is missing. A string rather than an array so
 * an assertion diff is one line instead of 324. (e2e/first-experience.e2e.ts)
 */
function samplePad(page: Page, id: string): Promise<string | null> {
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

/** The formatter's asset, which is a different gate (e2e/fidelity.e2e.ts). */
const FORMATTER = "lua_fmt_bg";

/** The symbol src/lib/config-shape.spec.ts measures the protocol chunk by. */
const PROTOCOL_SYMBOL = "GRID_PARAMETER_ELEMENT_POTMETER";

type WasmResponse = { url: string; status: number; type: string | null };

/**
 * Every .wasm response, every JavaScript response and every error-level console
 * line, collected from the moment the listener is attached. Discriminating the
 * VM's asset by the ABSENCE of the formatter's name rather than by its own
 * filename keeps a Vite hashing change from turning this red for the wrong
 * reason. (e2e/catalog.e2e.ts)
 */
function watchWasm(page: Page): {
  wasm: WasmResponse[];
  scripts: string[];
  consoleErrors: string[];
  vmOnly: () => WasmResponse[];
} {
  const wasm: WasmResponse[] = [];
  const scripts: string[] = [];
  const consoleErrors: string[] = [];
  page.on("response", (r) => {
    const url = r.url();
    if (url.endsWith(".wasm")) {
      wasm.push({
        url,
        status: r.status(),
        type: r.headers()["content-type"] ?? null,
      });
    }
    if (url.endsWith(".js")) scripts.push(url);
  });
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  return {
    wasm,
    scripts,
    consoleErrors,
    vmOnly: () => wasm.filter((w) => !w.url.includes(FORMATTER)),
  };
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

test.describe("arriving on a browse screen somebody else composed", () => {
  test("a filtered link renders its own set on the first paint", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);

    // A COLD ARRIVAL, THROUGH about:blank. This test exists to catch a
    // client-side correction applied AFTER paint, so it must not be reachable
    // from a warm router that already holds browse state.
    await coldGoto(page, "/browse/?sort=name&tag=playable");

    const playable = sortListing(
      LISTING.filter((entry) => entry.tags.includes("playable")),
      "name",
    ).map((entry) => entry.id);
    expect(playable.length, "playable is a real chip").toBeGreaterThan(1);
    expect(playable.length).toBeLessThan(LISTING.length);

    // ASSERTED BEFORE ANY INTERACTION. Nothing below clicks, types or presses
    // anything: a page that painted the whole shelf and then corrected itself
    // would satisfy an assertion made after a chip press and fail this one.
    await expect(page.getByTestId("browse-grid")).toBeVisible();
    await expect(page.locator(CARDS)).toHaveCount(playable.length);
    expect(await renderedIds(page)).toEqual(playable);
    await expect(
      page.getByTestId("browse-sort").locator('input[value="name"]'),
    ).toBeChecked();
    await expect(
      page.getByTestId("tag-playable").locator("input"),
    ).toBeChecked();
    await expectCount(page, playable.length, LISTING.length);

    // THE THIRD WAY THE COUNT IS SAID IS BY SAYING NOTHING. 05.1-UI-SPEC.md's
    // Accessibility Contract: on first load the live region is silent, because
    // nothing has changed and the visually-hidden expansion has already said
    // where the visitor is. 05.1-08 measured the other branch - seeding the
    // filter state in onMount instead of at component init makes the seed look
    // like a visitor-made change, and the region announces a filter nobody
    // applied over whatever the visitor was reading. This is that finding,
    // asserted rather than remembered.
    //
    // The locator is HANGAR's own region by its test id. Kit inserts its own
    // svelte-announcer live region into every page, so a browser-side count of
    // aria-live elements would read two and prove nothing about this one.
    await coldGoto(page, "/browse/?q=aurora");
    await expect(page.getByTestId("browse-grid")).toBeVisible();
    await expect(page.locator(CARDS)).toHaveCount(1);
    await expectCount(page, 1, LISTING.length);
    // Well past the toolbar's 500 ms trailing window, so silence here is
    // settled silence rather than a sentence that has not been said yet.
    await page.waitForTimeout(1_200);
    await expect(page.getByTestId("browse-live")).toHaveText("");

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("the browse screen for a visitor who asked for less motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("reduced motion stills every card", async ({ page }) => {
    const consoleErrors = collectErrors(page);

    // BOTH, and the explicit call is not belt-and-braces. Measured in Phase 4
    // on Playwright 1.62.1 and reproduced for this file: test.use({
    // reducedMotion }) alone left window.matchMedia("(prefers-reduced-motion:
    // reduce)").matches reporting false inside the page, and HANGAR reads the
    // preference in JavaScript - src/lib/sim/host.ts subscribes to that media
    // query to still its engines - so the declarative option alone would test
    // the full-motion path under a reduced-motion title. emulateMedia comes
    // BEFORE goto so the page arrives stilled rather than being stilled after
    // it has started moving.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await coldGoto(page, BROWSE);
    await waitForCards(page, LISTING.length);

    // The preference, as the page itself sees it. Without this the test would
    // be measuring whatever the default motion path does.
    expect(
      await page.evaluate(
        () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
      "the page sees the reduced-motion preference",
    ).toBe(true);

    // THE TRAP THIS TEST WOULD OTHERWISE FALL INTO. Three of the sixteen
    // configurations are declared restsBlack and their still frames are
    // legitimately black, so "the two samples are identical" would pass on them
    // even if reduced motion did nothing at all. The exemption is read from the
    // listing - restsBlack is a recorded fact asserted against frames.json in
    // both directions - and never by naming the three ids.
    const dark = LISTING.filter((entry) => entry.restsBlack).map((e) => e.id);
    expect(dark.length, "the exemption is not empty").toBeGreaterThan(0);

    /** Every registered canvas as its 324 backing-store bytes. */
    const sampleAll = () =>
      page.evaluate(() => {
        const out: Record<string, string> = {};
        for (const el of Array.from(
          document.querySelectorAll('[data-testid^="pad-canvas-"]'),
        )) {
          const canvas = el as HTMLCanvasElement;
          // SimHost.register sets the 9x9 backing store; unregister sets it
          // back to zero. A canvas that is still 0 wide has no engine yet.
          if (canvas.width !== 9) continue;
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          const id = (canvas.getAttribute("data-testid") ?? "").slice(
            "pad-canvas-".length,
          );
          out[id] = Array.from(ctx.getImageData(0, 0, 9, 9).data).join(",");
        }
        return out;
      });

    /** Built, and every built pad that is not declared dark has a picture. */
    const settled = () =>
      page.waitForFunction(
        (darkIds: string[]) => {
          let built = 0;
          for (const el of Array.from(
            document.querySelectorAll('[data-testid^="pad-canvas-"]'),
          )) {
            const canvas = el as HTMLCanvasElement;
            if (canvas.width !== 9) continue;
            built += 1;
            const id = (canvas.getAttribute("data-testid") ?? "").slice(
              "pad-canvas-".length,
            );
            if (darkIds.includes(id)) continue;
            const ctx = canvas.getContext("2d");
            if (!ctx) return false;
            if (!ctx.getImageData(0, 0, 9, 9).data.some((b) => b !== 0)) {
              return false;
            }
          }
          return built >= 4;
        },
        dark,
        { timeout: 30_000 },
      );

    await settled();
    // Let anything still arriving finish registering, then require the same
    // condition again: a card whose engine landed between the wait and the
    // first sample would otherwise be read blank and stay blank, and the
    // stillness assertion below would pass on it for the wrong reason.
    await page.waitForTimeout(500);
    await settled();

    const first = await sampleAll();
    await page.waitForTimeout(400);
    const second = await sampleAll();

    const shared = Object.keys(first).filter((id) => id in second);
    expect(
      shared.length,
      "several pads were readable on both samples",
    ).toBeGreaterThanOrEqual(4);

    for (const id of shared) {
      expect(
        second[id],
        `${id} must hold one frame: 400ms of wall clock moved it`,
      ).toBe(first[id]);
    }

    const lit = shared.filter((id) => !dark.includes(id));
    expect(lit.length, "the lit half of the wall is not empty").toBeGreaterThan(
      0,
    );
    for (const id of lit) {
      expect(
        first[id].split(",").some((b) => b !== "0"),
        `${id} shows its still representative frame, not a black square`,
      ).toBe(true);
    }

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("the wall is really running, and it is measured rather than gated", () => {
  test("the cards animate, and the paint count over two seconds is recorded", async ({
    page,
  }, testInfo) => {
    // Count the paints at their only exit. src/lib/sim/paint.ts ends in exactly
    // one ctx.putImageData per pad per paint, and paint.spec.ts pins that, so a
    // counter on the prototype is a count of painted pad frames and nothing
    // else. (e2e/first-experience.e2e.ts)
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

    await coldGoto(page, BROWSE);
    await waitForCards(page, LISTING.length);

    // THE PRECONDITION, AND IT IS THE HALF THAT IS ACTUALLY ASSERTED: the pads
    // on the wall are running the firmware simulator with nothing plugged in.
    // aurora is declared animated in the listing and that declaration is
    // derived from golden-frames.json, so this test and that gate cannot
    // disagree.
    const moving = LISTING.find(
      (entry) => entry.motion === "animated" && !entry.restsBlack,
    );
    expect(moving, "the catalog declares an animated entry").toBeDefined();
    const movingId = (moving as { id: string }).id;

    await waitForPicture(page, movingId);
    const before = await samplePad(page, movingId);
    expect(before, "the card canvas was readable").not.toBeNull();
    await page.waitForTimeout(400);
    expect(
      await samplePad(page, movingId),
      `${movingId} is declared animated, so 400ms of firmware ticks must move it`,
    ).not.toBe(before);

    const read = () =>
      page.evaluate(
        () => (window as unknown as { __padPaints: number }).__padPaints,
      );
    const start = await read();
    await page.waitForTimeout(2_000);
    const painted = (await read()) - start;

    // The conditions the number was taken under. A paint count with no viewport
    // and no visible-card count beside it is not evidence of anything.
    const conditions = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll('[data-testid="browse-grid"] > li'),
      );
      const onScreen = cards.filter((li) => {
        const box = li.getBoundingClientRect();
        return box.bottom > 0 && box.top < window.innerHeight;
      }).length;
      const built = Array.from(
        document.querySelectorAll('[data-testid^="pad-canvas-"]'),
      ).filter((el) => (el as HTMLCanvasElement).width === 9).length;
      return { cards: cards.length, onScreen, built };
    });

    const viewport = page.viewportSize();
    const where = viewport ? `${viewport.width}x${viewport.height}` : "unknown";
    const line =
      `browse pad frames painted in two seconds: ${painted} ` +
      `(viewport ${where}, ${conditions.onScreen} of ${conditions.cards} cards on screen, ` +
      `${conditions.built} engines built)`;
    console.log(line);
    testInfo.annotations.push({ type: "measurement", description: line });

    // A RECORDED MEASUREMENT, NOT A BUDGET GATE, and the reason is written
    // down rather than assumed. .planning/research/STACK.md's own estimate -
    // 10-16 concurrently visible animating cards before stutter with the
    // vendored blit, 30+ after the two fixes HANGAR already ships - is marked
    // "Unverified estimate - profile it", and this phase does not turn an
    // unverified estimate into a threshold that would go red on somebody
    // else's machine for reasons that are not regressions. If the wall ever
    // does stutter the first lever is the column count, and it is never
    // SIDE_INTERVAL_MS, which schedule.spec.ts pins against the vendored host.
    //
    // The arithmetic to compare it against, for whoever reads the number
    // later: intervalFor(hero = false, lowPower = false) is 50 ms, so a fully
    // visible wall of n animating cards approaches 40n paints in two seconds.
    expect(painted, "the shared rAF loop is painting").toBeGreaterThan(0);
  });

  test("a browse view with no Lua configuration in it fetches no WebAssembly", async ({
    page,
    request,
  }) => {
    const seen = watchWasm(page);

    // THE QUERY IS LOAD-BEARING AND IT IS NOT A BARE /browse/. D-06 asks for
    // "a cold /browse/ with no Lua card in view fetches no WebAssembly", but
    // with the default Featured sort the first screenful holds several Lua
    // cards, so a genuine cold /browse/ at the top of the page WILL fetch the
    // VM - correctly, and immediately. The honest claim is that a visitor who
    // never brings a Lua card into view never downloads the VM, and the honest
    // test is a filtered load. "aurora" leaves exactly one card in the grid and
    // that card is declared padsim. Do not "simplify" this to a bare /browse/:
    // it goes red for a good reason, which the negative check below observed.
    const matched = LISTING.filter((entry) =>
      [entry.name, entry.description, ...entry.tags]
        .join(" ")
        .toLowerCase()
        .includes("aurora"),
    );
    expect(matched.length, "?q=aurora leaves exactly one card").toBe(1);
    expect(matched[0].preview, "and that card is not a Lua card").toBe(
      "padsim",
    );
    const soloId = matched[0].id;

    await coldGoto(page, "/browse/?q=aurora");
    await expect(page.getByTestId("browse-grid")).toBeVisible();
    await expect(page.locator(CARDS)).toHaveCount(1);
    await waitForPicture(page, soloId);
    await page.waitForLoadState("networkidle");

    // NOT "not much" - NONE. Neither the VM nor the formatter.
    expect(
      seen.wasm.map((w) => w.url),
      "a browse view with no Lua card in it fetched WebAssembly",
    ).toEqual([]);

    // AND NO PROTOCOL CHUNK ON THE FIRST PAINT. This half is asserted against
    // the SERVED HTML rather than against the live DOM, and that is the whole
    // point: Vite's preload helper inserts modulepreload links for a DYNAMIC
    // import's dependencies too, so by the time the grid has built an engine
    // the document carries links a first paint never saw. The bytes the Worker
    // serves for /browse/ are what the browser fetches before it can paint, and
    // they are race-free.
    const chunkDir = fileURLToPath(
      new URL("../build/_app/immutable/chunks", import.meta.url),
    );
    const carriers = readdirSync(chunkDir)
      .map(String)
      .filter((name) => name.endsWith(".js"))
      .filter((name) =>
        readFileSync(join(chunkDir, name), "utf8").includes(PROTOCOL_SYMBOL),
      );
    // A guard that can no longer see the thing it guards must fail rather than
    // pass. The symbol is the one 04-RESEARCH measured the 131,101-byte chunk
    // by, and src/lib/config-shape.spec.ts walks the same graph in node.
    expect(
      carriers.length,
      `no built chunk contains ${PROTOCOL_SYMBOL} - this guard has gone blind`,
    ).toBeGreaterThan(0);

    const html = await (await request.get(BROWSE)).text();
    const declared = [
      ...new Set(
        [...html.matchAll(/_app\/immutable\/[^"'\s]+\.js/g)].map((m) => m[0]),
      ),
    ];
    expect(
      declared.length,
      "/browse/ names the modules it loads",
    ).toBeGreaterThan(0);
    expect(
      declared.filter((rel) =>
        carriers.includes(rel.slice(rel.lastIndexOf("/") + 1)),
      ),
      "/browse/ names the protocol chunk in the graph it paints from",
    ).toEqual([]);

    // The other side of the same claim, so the assertion above is not vacuous:
    // the chunk is DEFERRED rather than absent. The grid pulls it through
    // await import() when it builds its first engine, which is after paint.
    const fetched = seen.scripts.map((url) =>
      url.slice(url.lastIndexOf("/") + 1),
    );
    expect(
      fetched.filter((name) => carriers.includes(name)).length,
      "the protocol chunk never arrived at all - this measurement proves nothing",
    ).toBeGreaterThan(0);

    // AND THE VM ARRIVES WHEN A LUA CARD DOES. Clearing the filter puts the
    // whole shelf back; the first Lua entry in Featured order is scrolled to
    // explicitly rather than relied on to be on screen.
    await page.getByTestId("browse-clear-filters").click();
    await expect(page.locator(CARDS)).toHaveCount(LISTING.length);

    const luaId = orderOf("featured").find(
      (id) => LISTING.find((entry) => entry.id === id)?.preview === "lua",
    );
    expect(luaId, "the catalog ships a Lua configuration").toBeDefined();
    await page
      .locator(`[data-testid="card-${luaId as string}"]`)
      .scrollIntoViewIfNeeded();

    await expect
      .poll(() => seen.vmOnly().length, { timeout: 30_000 })
      .toBeGreaterThan(0);
    const vm = seen.vmOnly();
    expect(vm[0].status).toBe(200);
    // A wrong MIME breaks nothing visibly - the loader falls back from
    // instantiateStreaming to WebAssembly.instantiate with only a console
    // warning and then runs the slow path forever. So assert it.
    expect(vm[0].type).toBe("application/wasm");

    expect(seen.consoleErrors).toEqual([]);
  });
});

test.describe("coming back to a browse screen you had already narrowed", () => {
  test("the browser Back button returns the filtered view it left", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);

    const playable = sortListing(
      LISTING.filter((entry) => entry.tags.includes("playable")),
      "featured",
    ).map((entry) => entry.id);
    expect(playable.length).toBeGreaterThan(1);
    expect(playable.length).toBeLessThan(LISTING.length);

    // THE JOURNEY IS THE ASSERTION, AND THE CHIP PRESS IS THE PART THAT
    // MATTERS. A Back into an address the document was LOADED with was already
    // green before this test existed - measured. The defect logged in the
    // phase's deferred-items.md needs the filtered address to have been
    // composed by a shallow replaceState, because Kit's replaceState records
    // `page.url.href` - the page store's url, which replaceState itself never
    // updates - into the history entry, so the entry remembers the address the
    // document was entered with and Back hands the page a url one visit stale.
    // Arriving on a bare /browse/ and pressing a chip is exactly that, and it
    // is also what a visitor does.
    await coldGoto(page, BROWSE);
    await waitForCards(page, LISTING.length);

    await page.getByTestId("tag-playable").click();
    await expect(page.locator(CARDS)).toHaveCount(playable.length);
    // Let the 500 ms projection land, so the address really is the composed one
    // rather than one beforeNavigate is about to flush.
    await expect(page).toHaveURL(/\/browse\/\?tag=playable$/);

    await page.getByTestId(`card-name-${playable[0]}`).click();
    await expect(page).toHaveURL(new RegExp(`/c/${playable[0]}/$`));
    await expect(page.getByTestId("coverflow")).toBeVisible();

    // THE ADDRESS BAR AND THE SCREEN MUST AGREE. Before the fix this read
    // sixteen cards and no active chip while the address still said
    // ?tag=playable - the screen and the address bar contradicting each other,
    // on a link the visitor could then copy and send to somebody.
    await page.goBack();
    await expect(page).toHaveURL(/\/browse\/\?tag=playable$/);
    await expect(page.getByTestId("browse-grid")).toBeVisible();
    await expect(page.locator(CARDS)).toHaveCount(playable.length);
    expect(await renderedIds(page)).toEqual(playable);
    await expect(
      page.getByTestId("tag-playable").locator("input"),
    ).toBeChecked();
    await expectCount(page, playable.length, LISTING.length);

    // AND THE OTHER DIRECTION, WHICH IS THE ONE THAT WAS NEVER BROKEN: a Back
    // into an address the document was loaded with. It is asserted because a
    // repair that fixed the composed case by breaking this one would otherwise
    // ship green.
    await coldGoto(page, "/browse/?tag=playable");
    await expect(page.locator(CARDS)).toHaveCount(playable.length);
    await page.getByTestId(`card-name-${playable[0]}`).click();
    await expect(page.getByTestId("coverflow")).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/browse\/\?tag=playable$/);
    await expect(page.locator(CARDS)).toHaveCount(playable.length);
    await expect(
      page.getByTestId("tag-playable").locator("input"),
    ).toBeChecked();

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("the catalog with no pointer at all", () => {
  test("the keyboard crosses the grid in one tab stop and opens a configuration", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await coldGoto(page, BROWSE);
    await waitForCards(page, LISTING.length);

    /** What holds focus, and whether it is inside the grid. */
    const focus = () =>
      page.evaluate((selector) => {
        const el = document.activeElement;
        const grid = document.querySelector(selector);
        return {
          testId: el?.getAttribute("data-testid") ?? null,
          tag: el?.tagName ?? null,
          inGrid: el !== null && grid !== null && grid.contains(el),
        };
      }, GRID);

    /** The name link of the card at `index` in the order on the screen. */
    const cardAt = (order: readonly string[], index: number) =>
      `card-name-${order[index]}`;

    const featured = orderOf("featured");

    // TAB FROM THE FIELD, THROUGH THE TOOLBAR, INTO THE GRID - and the number
    // of stops is COUNTED rather than written down. How many chips stand in the
    // toolbar is derived from the data (W-19: every tag on two or more
    // configurations), so a literal here would be one more declaration of the
    // catalog to keep in step. The loop is bounded, so a grid that can never be
    // reached from the keyboard fails instead of hanging.
    await page.getByTestId("browse-search").focus();
    expect(
      (await focus()).testId,
      "the journey starts in the search field",
    ).toBe("browse-search");

    let presses = 0;
    while (presses < 60 && !(await focus()).inGrid) {
      await page.keyboard.press("Tab");
      presses += 1;
    }
    expect(
      presses,
      "the grid is reachable from the search field with Tab alone",
    ).toBeLessThan(60);
    console.log(
      `browse keyboard: ${presses} Tab presses from the search field into the grid`,
    );

    // ROVING TABINDEX, WHICH IS THE WHOLE OF W-07. Exactly one card is tabbable
    // at a time; the other fifteen carry -1.
    await expect(
      page.locator(`${GRID} [tabindex="0"]`),
      "exactly one card in the grid is tabbable",
    ).toHaveCount(1);
    await expect(page.locator(`${GRID} [tabindex="-1"]`)).toHaveCount(
      LISTING.length - 1,
    );
    expect(
      (await focus()).testId,
      "Tab lands on the roving card, which on arrival is the first one",
    ).toBe(cardAt(featured, 0));

    // ONE TAB STOP, MEASURED. The next Tab must leave the wall entirely rather
    // than step to the second card - seventeen presses to cross a shelf is the
    // failure roving tabindex exists to prevent.
    await page.keyboard.press("Tab");
    const beyond = await focus();
    expect(
      beyond.inGrid,
      `one Tab crosses the whole wall: focus moved to ${beyond.tag} ${beyond.testId}`,
    ).toBe(false);
    await page.keyboard.press("Shift+Tab");
    expect(
      (await focus()).testId,
      "and Shift+Tab comes back to the same roving card",
    ).toBe(cardAt(featured, 0));

    // THE COLUMN COUNT IS READ OFF THE LIVE LAYOUT, never assumed. A hard-coded
    // 4 would pass at 1280x720 and mislead at every other width, and the parse
    // is the shipped one - columnsFromTemplate is pinned in node by
    // grid.spec.ts, so this is the browser half of the same arithmetic.
    const template = await page.evaluate((selector) => {
      const grid = document.querySelector(selector);
      return grid === null
        ? undefined
        : getComputedStyle(grid).gridTemplateColumns;
    }, GRID);
    const columns = columnsFromTemplate(template);
    expect(
      columns,
      `the grid reports its own column count: ${String(template)}`,
    ).toBeGreaterThanOrEqual(1);

    await page.keyboard.press("ArrowRight");
    expect((await focus()).testId).toBe(cardAt(featured, 1));
    await page.keyboard.press("ArrowRight");
    expect((await focus()).testId).toBe(cardAt(featured, 2));

    const below = 2 + columns;
    expect(
      below,
      `a row below card 2 exists at ${columns} columns`,
    ).toBeLessThan(LISTING.length);
    await page.keyboard.press("ArrowDown");
    expect(
      (await focus()).testId,
      `ArrowDown steps one row, which is ${columns} cards`,
    ).toBe(cardAt(featured, below));

    const last = LISTING.length - 1;
    await page.keyboard.press("End");
    expect((await focus()).testId).toBe(cardAt(featured, last));

    // THE ENDS ARE THE ENDS (grid.ts clamps, never wraps). ArrowDown off the
    // last row must not land back on the first card.
    await page.keyboard.press("ArrowDown");
    expect(
      (await focus()).testId,
      "ArrowDown from the last card does not move",
    ).toBe(cardAt(featured, last));

    // Enter has NO handler: the anchor is followed natively, which is what
    // keeps middle-click and open-in-new-tab working too.
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/c/${featured[last]}/$`));
    await expect(page.getByTestId("coverflow")).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("browse, open a configuration, and come back", () => {
  test("browse, open a configuration, and come back to the same view", async ({
    page,
    context,
  }) => {
    const consoleErrors = collectErrors(page);

    /** The slack allowed on the restored offset: rounding, and nothing else. */
    const SCROLL_TOLERANCE_PX = 2;

    const QUERY = "pad";
    const TAG = "playable";

    await coldGoto(page, BROWSE);
    await waitForCards(page, LISTING.length);

    // The expected set is COMPUTED by the shipped filter and the shipped
    // comparator, never transcribed. Both modules import one erased type and
    // nothing else, which is why naming them from here costs nothing.
    const expectedIds = sortListing(
      filterListing(LISTING, QUERY, [TAG]),
      "newest",
    ).map((entry) => entry.id);
    expect(
      expectedIds.length,
      "the recorded view is neither the whole shelf nor empty",
    ).toBeGreaterThan(1);
    expect(expectedIds.length).toBeLessThan(LISTING.length);

    const sortGroup = page.getByTestId("browse-sort");
    await sortGroup.getByText("NEWEST", { exact: true }).click();
    await expect(sortGroup.locator('input[value="newest"]')).toBeChecked();

    await page.getByTestId("browse-search").fill(QUERY);
    await page.getByTestId(`tag-${TAG}`).click();
    await expect(page.locator(CARDS)).toHaveCount(expectedIds.length);
    expect(await renderedIds(page)).toEqual(expectedIds);

    // The address is projected on a 500 ms trailing timer, so it is waited for
    // rather than read - what is recorded below has to be the composed address
    // and not one that is about to change under it.
    await expect(page).toHaveURL(/sort=newest/);
    await expect(page).toHaveURL(new RegExp(`q=${QUERY}`));
    await expect(page).toHaveURL(new RegExp(`tag=${TAG}`));
    const address = page.url();

    // THE OFFSET IS A NUMBER, RECORDED AND THEN ASSERTED AGAINST. "The page
    // looks right" is not an assertion. The greater-than-zero check is the
    // precondition: restoring a scroll offset of 0 would prove nothing.
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(200);
    const scrolledTo = await page.evaluate(() => Math.round(window.scrollY));
    expect(
      scrolledTo,
      "the recorded view is really scrolled, so restoring it means something",
    ).toBeGreaterThan(0);

    const opened = expectedIds[expectedIds.length - 1];
    await page.getByTestId(`card-name-${opened}`).click();
    await expect(page).toHaveURL(new RegExp(`/c/${opened}/$`));
    await expect(page.getByTestId("coverflow")).toBeVisible();

    // ONE SLOT, TWO LABELS (W-01, D-19). A visitor who came from browse gets
    // their own view back; the cold-arrival label is asserted at the end of
    // this test, in a tab that holds no record.
    const slot = page.getByTestId("browse-link");
    await expect(slot).toHaveText("BACK TO BROWSE");
    await slot.click();

    await expect(page).toHaveURL(address);
    await expect(page.getByTestId("browse-grid")).toBeVisible();
    await expect(page.locator(CARDS)).toHaveCount(expectedIds.length);
    expect(await renderedIds(page)).toEqual(expectedIds);
    await expect(
      page.getByTestId("browse-sort").locator('input[value="newest"]'),
    ).toBeChecked();
    await expect(page.getByTestId("browse-search")).toHaveValue(QUERY);
    await expect(page.getByTestId(`tag-${TAG}`).locator("input")).toBeChecked();

    let restoredTo = -1;
    await expect
      .poll(
        async () => {
          restoredTo = await page.evaluate(() => Math.round(window.scrollY));
          return Math.abs(restoredTo - scrolledTo) <= SCROLL_TOLERANCE_PX;
        },
        {
          message: `the browse view came back at the offset it left, within ${SCROLL_TOLERANCE_PX}px`,
          timeout: 10_000,
        },
      )
      .toBe(true);
    console.log(
      `browse round trip: scrollY ${scrolledTo} before, ${restoredTo} after ` +
        `(tolerance ${SCROLL_TOLERANCE_PX}px)`,
    );

    // ONE BACK PRESS LEAVES BROWSE, and what that proves is written down rather
    // than glossed. The return is a `goto` with `{ noScroll: true }` and
    // deliberately NOT `{ replaceState: true }`: 05.1-09 measured that
    // replaceState takes Kit's shallow popstate branch on this exact journey and
    // leaves the address bar reading /c/<id>/ while the browse screen is still
    // on the page. So the round trip costs one history entry, and one Back lands
    // on the configuration the visitor opened. The phase's deferred-items.md
    // item 2 records that 05.1-UI-SPEC.md's sentence asking for replaceState is
    // the thing that is wrong here, not the shipped control.
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/c/${opened}/$`));
    expect(
      await page.getByTestId("browse").count(),
      "the browse screen is off the page after one Back",
    ).toBe(0);

    // A COLD ARRIVAL IN A TAB THAT NEVER SAW BROWSE. sessionStorage is per tab,
    // so a new page in the same context is the honest way to reach the other
    // label - and the empty store is asserted rather than assumed, because a
    // shared store would make the assertion below pass for the wrong reason.
    const fresh = await context.newPage();
    try {
      await fresh.goto("/c/euclid/");
      await expect(fresh.getByTestId("coverflow")).toBeVisible();
      expect(
        await fresh.evaluate(() => window.sessionStorage.length),
        "the precondition: this tab holds no browse return",
      ).toBe(0);
      await expect(
        fresh.getByTestId("browse-link"),
        "a visitor arriving cold is never left without a route into the catalog",
      ).toHaveText("BROWSE ALL");
    } finally {
      await fresh.close();
    }

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("the engine hazard this phase created, in a browser", () => {
  test("un-choosing a hand-authored configuration leaves its pad running", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);

    // THE ONE PAGE WHERE THE HAZARD IS VISIBLE. `buildTuner`'s `destroy()` used
    // to call `closeEngine(engine)` unconditionally, and that was harmless only
    // while every Lua entry stayed out of FRONT_DOOR. Plan 05.1-05 made
    // /c/euclid/ real, where the row is EUCLID ALONE - so un-choosing would have
    // closed the VM behind the only pad on the page and blanked it. 05.1-04
    // fixed it (`if (engine !== published)`) and pinned it in node; this is the
    // same property where a visitor would have met it.
    const ID = "euclid";

    await coldGoto(page, `/c/${ID}/`);
    await expect(page.getByTestId("coverflow")).toBeVisible();
    await expect(
      page.locator('[data-testid^="pad-canvas-"]'),
      "a row of one: this page has a single pad, and it is the one under test",
    ).toHaveCount(1);
    await waitForPicture(page, ID);

    // THE PRECONDITION. Without it a pad that never ran at all would satisfy the
    // "the two samples differ" assertion at the end by being broken in a
    // different way.
    const opening = await samplePad(page, ID);
    expect(opening, "the pad canvas was readable").not.toBeNull();
    await page.waitForTimeout(400);
    expect(
      await samplePad(page, ID),
      `${ID} is running before anything is chosen`,
    ).not.toBe(opening);

    // The tap rule: under 250 ms and 6 px both plays the pad and chooses it.
    const pad = page.getByTestId(`pad-${ID}`);
    const box = await pad.boundingBox();
    expect(box, "the pad was measurable").not.toBeNull();
    const at = box as { x: number; y: number; width: number; height: number };
    await page.mouse.move(at.x + at.width / 2, at.y + at.height / 2);
    await page.mouse.down();
    await page.mouse.up();

    await expect(page.getByTestId("chosen-panel")).toBeVisible();
    await expect(page.getByTestId("tuning-region")).toBeVisible();

    // BOTH METERS SETTLED, AND THAT IS THE PART THAT ARMS THIS TEST. Ownership
    // of the engine transfers at `onpreview`; a test that pressed Escape before
    // the handover would exercise the branch where `destroy()` closes an engine
    // nobody ever saw, which is the safe case and not the hazard. A settled
    // meter means the tuner has compiled and published.
    for (const event of ["setup", "timer"] as const) {
      await expect(
        page.getByTestId(`meter-${event}`),
        `the ${event} meter settled, so the tuner has published its engine`,
      ).toHaveAttribute("aria-busy", "false", { timeout: 30_000 });
    }

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("chosen-panel")).toHaveCount(0);

    const after = await samplePad(page, ID);
    expect(
      after,
      "the pad canvas is still readable after un-choosing",
    ).not.toBe(null);
    await page.waitForTimeout(400);
    expect(
      await samplePad(page, ID),
      "D-18: un-choosing must not close the engine the row is still painting from",
    ).not.toBe(after);

    expect(consoleErrors).toEqual([]);
  });
});
