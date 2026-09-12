// TUNE-02 to TUNE-07, SHARE-01 to SHARE-03 and DEGR-01's clipboard half: the
// whole tuning and sharing journey, in a real browser.
//
// Ten tests, all in the chromium project. The last two open /dev/tune/, the
// unlinked probe wave 12 added, because the over-budget state TUNE-04 and
// TUNE-05 describe is unreachable from the shipped UI - see the block above
// those two tests. No title here carries the tag
// playwright.config.ts greps the webkit-phone project by, so that project
// still lists zero tests - wave 12 owns the phone journey in its own file.
// The tag is deliberately not written out anywhere in this file: the gate
// for it is a plain grep, and a comment naming the thing it forbids would
// make that grep useless. (TuningRegion.svelte learned the same lesson about
// setInterval, and answered it with a comment-stripping scanner; a grep the
// plan can quote is worth more here.)
//
// No title contains the word the acceptance gate greps the captured log for
// either, for the same reason: that gate asserts an exact passed total AND
// the absence of that word, and a title carrying it would be a permanent
// false negative.
//
// Everything here runs against build/ served by worker/index.js under
// wrangler dev: the deployed bytes, never a development server. A knob that
// only works in `vite dev` is a red test rather than a nice demo.
//
// TWO CHOICES IN HERE ARE ABOUT MAKING AN ASSERTION MEAN WHAT IT SAYS, and
// both are worth reading before editing anything:
//
//   1. TEST 1 RUNS UNDER REDUCED MOTION. Aurora is declared `animated`, so on a
//      full-motion page two samples of its canvas differ whether or not a knob
//      did anything - the test would pass on an implementation where turning a
//      knob does nothing at all. Reduced motion holds every engine on one
//      representative frame (src/lib/sim/host.ts), so a frame that changes
//      after a knob turn changed BECAUSE of the knob. The stillness is asserted
//      on both sides of the turn, so the difference cannot be noise either.
//
//   2. EVERY TEST ASSERTS ITS PRECONDITION BEFORE ITS PROPERTY. locator.count()
//      takes a snapshot and does not auto-wait, so a count taken before
//      hydration reads zero whether or not the element would eventually render.
//      That mistake has already been made once in this repository.
//
// The canvas helpers below are e2e/first-experience.e2e.ts's, re-derived rather
// than reinvented: same 9x9 backing-store read, same "wait for a picture before
// comparing two empty canvases" rule, same error-level console filter.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { expect, test, type Page } from "@playwright/test";
// Both of these modules import NOTHING AT ALL - that is why they exist as
// separate files (05-01, 05-02) - so naming them from a Playwright file costs
// nothing and binds these assertions to the copywriting contract and to the
// real URL composer instead of to transcribed literals.
// The intro's hero, by its one name (13-07). front-door.ts imports nothing.
import { FRONT_DOOR_HERO } from "../src/lib/catalog/front-door";
import { shareUrl } from "../src/lib/share/url";
import {
  LINK_COPIED,
  MEASURING,
  SHARE_FALLBACK_FIELD_NAME,
  STAMP_RESTORED,
  TURN_IT_DOWN,
  backOffKnob,
  overBudgetArrived,
  overBudgetKnob,
  stampUnreadable,
  tryOnBudgetReason,
} from "../src/lib/tune/copy";
// The workspace's words (13-09): the PDF's labels for the two buttons and
// the share control, and (13.1-04) the swatch toggle's two words. The
// module imports nothing.
import {
  EDIT_COLOR,
  POPOVER_CLOSE,
  RANDOMIZE,
  RESET_SETTINGS,
  SHARE_SNAPSHOT,
} from "../src/lib/tune/inspector-copy";
import { guardedNot } from "./poll";

/** The configuration every test in this file opens. */
const ENTRY = "aurora";
const ENTRY_NAME = "Aurora";

/**
 * A payload minted from another card. `p` is the vendored preset-name format
 * and `dial` is a real preset, so this is well formed and still not Aurora's:
 * src/lib/share/stamp.ts's entry-consistency guard is what makes it unreadable
 * rather than "restored" onto a configuration nobody built.
 */
const FOREIGN_STAMP = "#z.pdial";

const canvasOf = (id: string) => `[data-testid="pad-canvas-${id}"]`;

/**
 * The 9x9 backing store as a comma-joined string of its 324 RGBA bytes, or null
 * when the element or its context is missing. A string rather than an array so
 * an assertion diff is one line instead of 324. (e2e/first-experience.e2e.ts)
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
 * two empty canvases, which is a test that passes for the wrong reason - the
 * canvases genuinely are empty for a moment, because the simulator arrives
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

/** Every `.wasm` response, from the moment the listener is attached. */
function collectWasm(page: Page): string[] {
  const urls: string[] = [];
  page.on("response", (r) => {
    if (r.url().endsWith(".wasm")) urls.push(r.url());
  });
  return urls;
}

/** The backing store's real dimensions. A blanked canvas is 0 by 0. */
function canvasSize(
  page: Page,
  id: string,
): Promise<{ w: number; h: number } | null> {
  return page.evaluate((sel) => {
    const c = document.querySelector(sel) as HTMLCanvasElement | null;
    return c ? { w: c.width, h: c.height } : null;
  }, canvasOf(id));
}

/**
 * Knob id to index, read off the real controls rather than off any store.
 *
 * THE COLOUR KNOB IS NOT A `knob-` ROW ANY MORE and it must not fall out of
 * this walk. Plan 10-10 lifts every colour knob out of the rack's row list and
 * into ONE ColourPicker block, so its testids are `colour-rail-r` / `-g` /
 * `-b` rather than `knob-colour`. A walk that only reads `knob-` would still
 * have found four rows on aurora and would have said nothing while RESET ALL
 * quietly stopped being checked against the one knob with 4,096 positions.
 * The three rails are appended under their own ids, which is also why they
 * cannot collide with a row.
 *
 * SINCE 13.1-04 THE RAILS ARE IN THE DOM ONLY WHILE THE COLOUR BLOCK IS OPEN
 * (13.1-CONTEXT D-08: the picker opens inline under the swatch row, rendered
 * only while open; 13-09's closed dialog kept them mounted). A title that
 * wants the colour knob in a snapshot opens the block first, with
 * `openColourEditor`, and keeps it open across whatever it compares; a
 * title that never opens it compares snapshots without the three rails on
 * both sides, which is still an honest comparison of the rows.
 */
function knobIndices(page: Page): Promise<{ id: string; index: number }[]> {
  return page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("[data-testid^='knob-']"))
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
      });
    const picker = Array.from(
      document.querySelectorAll("[data-testid^='colour-rail-']"),
    ).map((el) => {
      const rail = el.querySelector(
        "input[type='range']",
      ) as HTMLInputElement | null;
      return {
        id: el.getAttribute("data-testid") ?? "",
        index: rail ? Number(rail.value) : -1,
      };
    });
    return [...rows, ...picker];
  });
}

/** `"250 / 908"`, or `measuring…` before the first number has landed. */
function meterText(page: Page, event: "setup" | "timer"): Promise<string> {
  return page.getByTestId(`meter-${event}`).locator(".numerals").innerText();
}

/**
 * Both meters settled: neither measuring nor catching up.
 *
 * `aria-busy` is the meter's own published state and covers both waits, which
 * is exactly why it is the anchor. Waiting only for the numerals to leave
 * `measuring…` is NOT enough and the difference is not academic - it was
 * observed on this file's first run. See `recomputed` below.
 */
async function settled(page: Page): Promise<void> {
  for (const event of ["setup", "timer"] as const) {
    await expect(
      page.getByTestId(`meter-${event}`),
      `the ${event} meter settled on a number`,
    ).toHaveAttribute("aria-busy", "false", { timeout: 30_000 });
    await expect(
      page.getByTestId(`meter-${event}`).locator(".numerals"),
      `the ${event} meter left ${MEASURING}`,
    ).not.toHaveText(MEASURING);
  }
}

/**
 * Wait for a knob change to be MEASURED, not merely applied.
 *
 * A knob move puts both meters into the stale state - `aria-busy="true"`, the
 * numerals dimmed and still showing the PREVIOUS number - while the
 * 120ms-debounced recompile runs. A wait that only asked for "not measuring…"
 * therefore came back instantly with the old measurement, and every comparison
 * in this file would have been against the wrong number. Observed: RESET ALL
 * read `256 / 908` where the defaults are `250 / 908`.
 *
 * The stale phase is asserted rather than assumed, so a future change that
 * compiled synchronously on every keystroke - which is what the debounce exists
 * to prevent - turns this red instead of quietly making the wait meaningless.
 */
async function recomputed(page: Page): Promise<void> {
  await expect(
    page.getByTestId("meter-setup"),
    "the change went through the debounced recompile",
  ).toHaveAttribute("aria-busy", "true", { timeout: 5_000 });
  await settled(page);
}

/**
 * Open a configuration's workspace and wait for its inspector to settle.
 *
 * Since 13-09 there is nothing to choose: the workspace (PDF page 5) opens
 * with its panel and its inspector on the page, and the inspector renders one
 * rack per section, so the rack locator takes the first.
 *
 * trailingSlash: "always" (src/routes/+layout.ts), so the slash is not optional
 * - without it the static build 404s and the failure reads as a broken route
 * rather than a URL typo.
 */
async function openPanel(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByTestId("workspace")).toBeVisible();
  await waitForPicture(page, ENTRY);
  // 13.1-06: the tuner's region, not the install column's panel (chosen-panel
  // left with the column, 13.1-CONTEXT D-06; 13.1-04's swap in radius.e2e.ts).
  await expect(page.getByTestId("tuning-region")).toBeVisible();
  await expect(page.getByTestId("knob-rack").first()).toBeVisible();
  await settled(page);
}

/**
 * The colour picker opens INLINE under the swatch row on the swatch's Edit
 * color since 13.1-04 (Bible section 7; 13.1-CONTEXT D-08 - a popover from
 * 13-09 to 13.1-04). Open it when its rails are not on screen: the block,
 * and the rails with it, exist only while open, so the toggle is clicked
 * first and the block waited for.
 */
async function openColourEditor(page: Page): Promise<void> {
  const rail = page.locator(
    "[data-testid='colour-rail-r'] input[type='range']",
  );
  if (await rail.isVisible()) return;
  await page.getByTestId("edit-color").first().click();
  await expect(page.getByTestId("colour-editor")).toBeVisible();
  await expect(rail).toBeVisible();
}

/**
 * The KNOB ROWS' rails, in rack order. The first one is Aurora's Speed.
 *
 * SCOPED TO THE ROWS, and the scope is the whole point. Aurora's knob list is
 * `[colour, speed, direction, band]` plus Brightness, so plan 10-10's picker
 * takes the FIRST slot in the rack and its three colour rails come first in
 * document order. An unscoped `input[type='range']` walk therefore made
 * `turnRail(0)` and `turnRail(1)` turn red and green - which moved a knob and
 * a pad, so half this file stayed green, while "RESET ALL puts every knob
 * back" compared two identical racks and went red instead. Rows here, the
 * picker through `turnColourRail`; SCROLL_RAIL keeps meaning tpad's third
 * rail, and tpad has no colour knob at all.
 */
const rails = (page: Page) =>
  page.locator(
    "[data-testid='knob-rack'] [data-testid^='knob-'] input[type='range']",
  );

/** One keyboard step to the right on a rail, then let the debounce land. */
async function turnRail(page: Page, at: number): Promise<void> {
  await rails(page).nth(at).focus();
  await page.keyboard.press("ArrowRight");
  await recomputed(page);
}

/**
 * One keyboard step to the right on the picker's RED rail.
 *
 * Red rather than blue because aurora ships at 0,85,255: blue already stands
 * at the top detent, where ArrowRight is a no-op and the assertion that
 * something moved would be false through no fault of the picker.
 */
async function turnColourRail(page: Page): Promise<void> {
  await openColourEditor(page);
  await page
    .locator("[data-testid='colour-rail-r'] input[type='range']")
    .focus();
  await page.keyboard.press("ArrowRight");
  await recomputed(page);
}

test.describe("turning a knob", () => {
  test("a knob turn changes the pad", async ({ page }) => {
    const consoleErrors = collectErrors(page);
    const wasm = collectWasm(page);

    // ------------------------------------------------------------------
    // THE FRONT DOOR'S FIRST PAINT FETCHES NO WebAssembly, asserted for `/`.
    //
    // config-shape.spec.ts test 14 covers the protocol-CHUNK half over the
    // built HTML, and e2e/catalog.e2e.ts makes the WebAssembly assertion for
    // /dev/catalog/. Nothing asserted it for the page a visitor actually
    // arrives on. This is that assertion, and it lives inside this test rather
    // than as a ninth one so the file's count stays where the plan put it.
    await page.goto("/");
    // Since 13-07, / is the intro with one live hero surface rather than the
    // shelf; the assertion is the same one about the same page.
    await expect(page.getByTestId("intro")).toBeVisible();
    // The precondition: the simulator really did arrive. Without this a zero
    // below would mean "nothing loaded" rather than "nothing needed WASM".
    await waitForPicture(page, FRONT_DOOR_HERO.id);
    await page.waitForLoadState("networkidle");
    expect(
      wasm,
      "a visitor who only browses the front door downloads no WebAssembly: not the 628 KB formatter, not the 271 KB Lua VM",
    ).toEqual([]);

    // ------------------------------------------------------------------
    // The knob turn itself, under reduced motion. See the header for why.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openPanel(page, `/playground/${ENTRY}/`);
    expect(
      await page.evaluate(
        () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
      "the page really is in the reduced-motion branch, so a frame that moves moved for a reason",
    ).toBe(true);

    const before = await sample(page, ENTRY);
    expect(before, "the hero canvas was readable").not.toBeNull();
    expect(
      (before as string).split(",").some((b) => b !== "0"),
      "the hero shows its representative frame, not a black square",
    ).toBe(true);
    await page.waitForTimeout(400);
    expect(
      await sample(page, ENTRY),
      "reduced motion holds one frame, so 400ms of wall clock must not move it",
    ).toBe(before);

    await turnRail(page, 0);

    const after = await sample(page, ENTRY);
    expect(
      after,
      "one keyboard step on the first rail changes the pad the visitor is looking at",
    ).not.toBe(before);

    // THE replaceEngine PROPERTY, ASSERTED DIRECTLY. SimHost.register() would
    // set canvas.width = 0 on its way through unregister(); replaceEngine swaps
    // the engine in place and the backing store is never torn down.
    expect(
      await canvasSize(page, ENTRY),
      "the hero's backing store survived the swap - a blanked canvas is 0 by 0",
    ).toEqual({ w: 9, h: 9 });

    await page.waitForTimeout(400);
    expect(
      await sample(page, ENTRY),
      "the new engine is held on one frame too, so the change above was the knob rather than noise",
    ).toBe(after);

    expect(consoleErrors).toEqual([]);
  });

  test("the two meters read two different numbers and both change on a knob turn", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await openPanel(page, `/playground/${ENTRY}/`);

    const setupBefore = await meterText(page, "setup");
    const timerBefore = await meterText(page, "timer");
    for (const [event, text] of [
      ["setup", setupBefore],
      ["timer", timerBefore],
    ] as const) {
      expect(text, `the ${event} meter left ${MEASURING}`).not.toContain(
        MEASURING,
      );
      expect(text, `the ${event} meter states its number out of 908`).toMatch(
        /^[0-9]+ \/ 908$/,
      );
    }
    // Two events, two budgets, two numbers. A meter pair showing one number
    // twice would be a wiring bug that every other assertion here would miss.
    expect(
      timerBefore,
      "Setup and Timer are measured separately and do not read the same",
    ).not.toBe(setupBefore);

    await turnRail(page, 0);

    const setupAfter = await meterText(page, "setup");
    const timerAfter = await meterText(page, "timer");
    expect(
      setupAfter !== setupBefore || timerAfter !== timerBefore,
      `a knob turn moves at least one budget: setup ${setupBefore} -> ${setupAfter}, timer ${timerBefore} -> ${timerAfter}`,
    ).toBe(true);

    expect(consoleErrors).toEqual([]);
  });

  test("RESET ALL puts every knob back and is disabled once they are back", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await openPanel(page, `/playground/${ENTRY}/`);

    const resetAll = page.getByTestId("reset-all");
    await expect(resetAll).toHaveText(RESET_SETTINGS);
    // The precondition: on arrival every knob is at home, so the control that
    // puts them there has nothing to do.
    await expect(
      resetAll,
      "on arrival at the defaults RESET ALL is a real disabled button",
    ).toBeDisabled();

    // THE COLOUR BLOCK IS OPENED BEFORE `home` IS TAKEN (13.1-04, D-08): its
    // rails are in the DOM only while it is open, and it stays open across
    // the turns and the reset so the picker's three are in every snapshot
    // this title compares - otherwise the one 4,096-position knob would be
    // absent from `home` and RESET ALL would never be checked against it.
    await openColourEditor(page);
    const home = await knobIndices(page);
    expect(home.length, "the rack rendered its knobs").toBeGreaterThan(1);
    expect(
      home.some((knob) => knob.id === "colour-rail-r"),
      "the picker's rails are in the snapshot - the block is open",
    ).toBe(true);
    const homeSetup = await meterText(page, "setup");
    const homeTimer = await meterText(page, "timer");

    await turnRail(page, 0);
    await turnRail(page, 1);
    // AND THE COLOUR KNOB, which is the picker since 10-10. Without this the
    // rack's one 4,096-position knob would be present in `home` and never
    // moved, so RESET ALL would be proved to leave it alone rather than to put
    // it back.
    await turnColourRail(page);
    const turned = await knobIndices(page);
    expect(turned, "two knobs and the colour really moved").not.toEqual(home);
    await expect(resetAll, "a moved knob enables RESET ALL").toBeEnabled();

    await resetAll.click();
    await recomputed(page);

    expect(
      await knobIndices(page),
      "RESET ALL returns every knob to the position it arrived at",
    ).toEqual(home);
    expect(await meterText(page, "setup"), "the Setup budget came back").toBe(
      homeSetup,
    );
    expect(await meterText(page, "timer"), "the Timer budget came back").toBe(
      homeTimer,
    );
    await expect(
      resetAll,
      "back at the defaults there is nothing left to reset",
    ).toBeDisabled();

    // THE TOGGLE AND ESCAPE (13.1-04, 13.1-CONTEXT D-08; Bible section 14 as
    // simplified). The block is inline, so there is no trap and no return:
    // while it is open the row's toggle reads Close; Escape pressed with
    // focus INSIDE the block closes it - the block leaves the DOM - and focus
    // lands on the row's toggle, which reads Edit color again. The one
    // behaviour a source scan cannot prove, so it is pressed here.
    const toggle = page.getByTestId("edit-color").first();
    await expect(page.getByTestId("colour-editor")).toBeVisible();
    await expect(toggle, "the open block's toggle reads Close").toHaveText(
      POPOVER_CLOSE,
    );
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page
      .locator("[data-testid='colour-rail-r'] input[type='range']")
      .focus();
    await page.keyboard.press("Escape");
    await expect(
      page.getByTestId("colour-editor"),
      "Escape inside the block closes it",
    ).toHaveCount(0);
    await expect(toggle, "focus lands on the row's toggle").toBeFocused();
    await expect(toggle, "the closed toggle reads Edit color").toHaveText(
      EDIT_COLOR,
    );
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    expect(consoleErrors).toEqual([]);
  });

  test("SURPRISE ME moves the knobs and lands inside the budget", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await openPanel(page, `/playground/${ENTRY}/`);

    const surprise = page.getByTestId("surprise-me");
    await expect(surprise).toContainText(RANDOMIZE);
    const home = await knobIndices(page);

    await surprise.click();
    await expect(surprise, "the roll finished").not.toHaveAttribute(
      "aria-busy",
      "true",
      { timeout: 30_000 },
    );
    await settled(page);

    expect(
      await knobIndices(page),
      "a surprise that changed nothing is not a surprise",
    ).not.toEqual(home);

    // SURPRISE ME has no failure state: its roll only accepts states that fit,
    // so neither meter may be in the over-budget branch afterwards.
    for (const event of ["setup", "timer"] as const) {
      const meter = page.getByTestId(`meter-${event}`);
      expect(
        await meter.locator(".over").count(),
        `the ${event} meter is not in the over-budget state after a roll`,
      ).toBe(0);
      const percent = await meter.locator(".percent").innerText();
      expect(
        Number.parseInt(percent, 10),
        `the ${event} meter reads at or under 100 per cent`,
      ).toBeLessThanOrEqual(100);
    }

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("sharing what the visitor made", () => {
  // Chromium only, and deliberately so: grantPermissions for the clipboard is
  // a Chromium capability in Playwright. Wave 12's WebKit test asserts the
  // confirm state, which is what SHARE-02 actually requires of a phone.
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  });

  test("COPY LINK confirms in its own state and copies the link", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await openPanel(page, `/playground/${ENTRY}/`);

    const copy = page.getByTestId("copy-link");
    await expect(copy, "the control arrives as Share snapshot").toHaveText(
      SHARE_SNAPSHOT,
    );

    await turnRail(page, 0);
    await copy.click();

    // The confirmation is the control's own state, and its accessible name is
    // always its visible text (WCAG 2.5.3). No toast: the site has none.
    await expect(
      copy,
      "the button says so itself rather than through a toast",
    ).toHaveText(LINK_COPIED);

    const copied = await page.evaluate(() => navigator.clipboard.readText());
    // Composed through the real shareUrl, twice. The first form pins the
    // origin, the /playground/<id>/ path and the trailing slash; the second pins the
    // whole string including the `z.` fragment prefix, given the payload the
    // page put there. Test 6 then opens exactly this URL and gets the knobs
    // back, which is what makes the pair a round trip rather than a tautology.
    expect(
      copied.startsWith(shareUrl(ENTRY, undefined)),
      `the copied link is this configuration's address: ${copied}`,
    ).toBe(true);
    const payload = copied.split("#z.")[1];
    expect(
      payload,
      "a tuned configuration carries a stamp in the fragment",
    ).toBeTruthy();
    expect(copied, "the link is exactly what shareUrl composes").toBe(
      shareUrl(ENTRY, payload),
    );
    expect(
      copied,
      "a turned knob makes the link differ from the base configuration's",
    ).not.toBe(shareUrl(ENTRY, undefined));

    expect(consoleErrors).toEqual([]);
  });

  test("a shared link lands on the tuned configuration with the panel open", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await openPanel(page, `/playground/${ENTRY}/`);

    await turnRail(page, 0);
    await turnRail(page, 1);
    const sent = await knobIndices(page);
    await page.getByTestId("copy-link").click();
    const link = await page.evaluate(() => navigator.clipboard.readText());
    // The link names the deployed origin; this harness is 127.0.0.1. Only the
    // origin is swapped - the path, the trailing slash and the whole fragment
    // are the ones the page composed.
    const parsed = new URL(link);
    const address = `${parsed.pathname}${parsed.hash}`;
    expect(address, "the link carries a stamp for this configuration").toBe(
      `/playground/${ENTRY}/#z.${link.split("#z.")[1]}`,
    );

    /*
      A REAL DOCUMENT LOAD, VIA about:blank, AND IT IS NOT CEREMONY. The page
      is already at /playground/aurora/, so page.goto of /playground/aurora/#z... is a
      FRAGMENT-ONLY navigation: the browser keeps the document, Coverflow
      never remounts, and the landing - which runs once, in onMount - never
      happens at all. Observed on this file's first run as a stamp notice that
      was not there. Going through about:blank makes the next goto what a
      shared link actually is: a cold arrival on a document that has never
      seen this configuration.
    */
    await page.goto("about:blank");
    await page.goto(address);
    await expect(page.getByTestId("workspace")).toBeVisible();
    // X-18: the whole content of a tuned link is what somebody moved, and the
    // knobs are the only evidence of it - so it arrives with the tuner open.
    await expect(
      page.getByTestId("tuning-region"),
      "a stamped link opens with the panel already open",
    ).toBeVisible();
    await expect(page.getByTestId("workspace-name")).toHaveText(ENTRY_NAME);
    await expect(page.getByTestId("stamp-notice")).toHaveText(STAMP_RESTORED);
    await settled(page);

    expect(
      await knobIndices(page),
      "the knobs are exactly where the sender left them",
    ).toEqual(sent);

    expect(consoleErrors).toEqual([]);
  });

  test("a link that cannot be read lands on the configuration as it ships", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);

    // The defaults, read from a clean arrival, so the comparison below is
    // against what this configuration actually ships as rather than against a
    // list of numbers transcribed into this file.
    await openPanel(page, `/playground/${ENTRY}/`);
    const defaults = await knobIndices(page);
    expect(defaults.length, "the rack rendered its knobs").toBeGreaterThan(1);

    // A cold arrival, for the reason spelled out in the test above.
    await page.goto("about:blank");
    await page.goto(`/playground/${ENTRY}/${FOREIGN_STAMP}`);
    await expect(page.getByTestId("workspace")).toBeVisible();
    await expect(
      page.getByTestId("tuning-region"),
      "the panel opens so the sentence explaining the link is visible",
    ).toBeVisible();
    await settled(page);

    await expect(
      page.getByTestId("stamp-notice"),
      "SHARE-03: it says so rather than landing on a subtly wrong configuration",
    ).toHaveText(stampUnreadable(ENTRY_NAME));
    await expect(page.getByTestId("workspace-name")).toHaveText(ENTRY_NAME);
    expect(
      await knobIndices(page),
      "every knob is at its default, because a stamp never half-applies",
    ).toEqual(defaults);
    await expect(
      page.getByTestId("reset-all"),
      "nothing was applied, so there is nothing to reset",
    ).toBeDisabled();

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("a browser with no clipboard API", () => {
  // DEGR-01's clipboard half, and it has no other coverage: wave 12's WebKit
  // test asserts the CONFIRM state, not this branch, and no browser Playwright
  // drives takes it on its own. Forcing it is a capability question rather than
  // an engine question, so it belongs in the file that owns the desktop
  // journey. `clipboard` is an accessor on Navigator.prototype - deleting it
  // off the instance returns true and removes nothing - so both are deleted and
  // the precondition is asserted before anything is clicked.
  // (e2e/first-experience.e2e.ts does the same for navigator.serial.)
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      delete (Navigator.prototype as unknown as Record<string, unknown>)
        .clipboard;
      delete (navigator as unknown as Record<string, unknown>).clipboard;
    });
  });

  test("with no clipboard API the link is offered for selection instead", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await openPanel(page, `/playground/${ENTRY}/`);

    expect(
      await page.evaluate(() => "clipboard" in navigator),
      "the precondition: this page really has no clipboard API, so the fallback is being forced rather than waited for",
    ).toBe(false);

    await turnRail(page, 0);
    const copy = page.getByTestId("copy-link");
    await copy.click();

    const field = page.getByTestId("copy-link-fallback");
    await expect(
      field,
      "the reveal appears rather than the button failing quietly",
    ).toBeVisible();
    await expect(field).toHaveAttribute("readonly", "");
    await expect(field).toHaveAttribute(
      "aria-label",
      SHARE_FALLBACK_FIELD_NAME,
    );

    const value = await field.inputValue();
    expect(
      value.startsWith(shareUrl(ENTRY, undefined)),
      `the field holds this configuration's address: ${value}`,
    ).toBe(true);
    const payload = value.split("#z.")[1];
    expect(payload, "a turned knob puts a stamp in the fragment").toBeTruthy();
    expect(value, "the field holds exactly what shareUrl composes").toBe(
      shareUrl(ENTRY, payload),
    );

    // 16px IS THE POINT, not a type choice: iOS Safari zooms the whole viewport
    // when a form field under 16px takes focus, and this one is select()ed the
    // instant it appears - so at 15px the panel would jump at exactly the
    // moment the visitor is trying to copy.
    expect(
      await field.evaluate((el) => getComputedStyle(el).fontSize),
      "the field sits on the iOS zoom floor",
    ).toBe("16px");

    // It did not become a different control.
    await expect(copy, "the button's label is still Share snapshot").toHaveText(
      SHARE_SNAPSHOT,
    );

    expect(consoleErrors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// TUNE-04 and TUNE-05, in a browser.
//
// Over budget is UNREACHABLE for anything a visitor can produce:
// src/lib/tune/reachability.sweep.spec.ts measures 32,852 knob states across
// every shelf card and not one crosses 908. So these two tests open
// /dev/tune/ - the unlinked probe that mounts the same tuning region over a
// real `PadReserved`, which the vendored cost() charges itself. Nothing here
// injects a cost, and the region has no test-only prop: what reddens the meter
// is a budget the compiler really refused.
//
// The probe's own numbers are read from its `probe-cost` readout, which
// recomputes the cost from the indices the region reports, through $lib/pad. So
// the numerals below are held against the compiler's answer rather than against
// a literal that would rot the day the pin moves.
//
// The knob these tests drive is Scroll - the third rail on tpad's rack - and
// its measured band with the probe's reserve of 3 is: index 0..3 -> 907/908 (in
// budget), 4 -> 905/908, 5 -> 909/908, 6..7 -> 910/908. Home is index 0 and End
// is index 7, both native to the range input the rail is built on, so one key
// press crosses the line in either direction.

const PROBE = "/dev/tune/";

/** tpad's third knob. Its label is what the over-budget block names. */
const SCROLL_LABEL = "Scroll";
const SCROLL_RAIL = 2;

/** The probe's independently computed cost. */
async function probeCost(
  page: Page,
): Promise<{ setup: number; timer: number; fits: boolean }> {
  const text = await page.getByTestId("probe-cost").innerText();
  expect(
    text.startsWith("{"),
    `the probe measured the configuration itself: ${text}`,
  ).toBe(true);
  return JSON.parse(text);
}

/** The number in front of the slash. `meterText` returns "910 / 908". */
async function meterUsed(
  page: Page,
  event: "setup" | "timer",
): Promise<number> {
  return Number((await meterText(page, event)).split("/")[0].trim());
}

async function meterPct(page: Page, event: "setup" | "timer"): Promise<number> {
  const text = await page
    .getByTestId(`meter-${event}`)
    .locator(".percent")
    .innerText();
  return Number(text.replace("%", ""));
}

/** Open the probe and wait for its first measurement, not merely its markup. */
async function openProbe(page: Page): Promise<void> {
  await page.goto(PROBE);
  await expect(page.getByTestId("tuning-region")).toBeVisible();
  await expect(page.getByTestId("knob-rack").first()).toBeVisible();
  await settled(page);
  await expect(
    page.getByTestId("probe-cost"),
    "the probe's second opinion landed, so the numerals can be held against it",
  ).not.toHaveText("pending", { timeout: 30_000 });
}

/** One key press on Scroll, then let the debounced recompile land. */
async function pressScroll(page: Page, key: "Home" | "End"): Promise<void> {
  await rails(page).nth(SCROLL_RAIL).focus();
  await page.keyboard.press(key);
  await recomputed(page);
}

/**
 * Wait for the next measurement to LAND when the meter is starting from over
 * budget, where it cannot report that it is busy.
 *
 * `meterView` makes `over` outrank the feed - "a warning is never dimmed" - so
 * a meter showing an over-budget number publishes `aria-busy="false"` for the
 * whole of the 120ms recompile, and `recomputed` above would time out on it.
 * OBSERVED: this file's first run failed exactly there. The anchor here is
 * therefore the number itself, polled until it is no longer the one that was on
 * screen when the key went down. Every transition these tests make moves the
 * number, so a poll that never changes is a real defect rather than a slow
 * machine.
 *
 * `recomputed` is still used for the other direction - in budget to over - and
 * it is the stronger wait, so the debounce keeps its own assertion.
 *
 * THE ONE NEGATED POLL IN THIS FILE, AND THE TRAP IT SETS. e2e/poll.ts's
 * positive guard returns a descriptive STRING when the callback throws, which
 * no numeric matcher can match - so every `.toBe` / `.toEqual` /
 * `.toBeGreaterThan` site keeps polling. Here the matcher is `.not.toBe(was)`,
 * and a string is ALSO not equal to `was`: the sentinel would SATISFY THE
 * NEGATION and turn this green on a page that could not be read at all.
 * guardedNot returns `was` itself, which fails the negation, so the poll runs
 * its whole thirty seconds and the swallowed error is named afterwards.
 */
async function remeasured(page: Page, was: number): Promise<void> {
  const moved = guardedNot(
    () => meterUsed(page, "setup"),
    was,
    "the Setup meter's numeral",
  );
  await expect.poll(moved.read, { timeout: 30_000 }).not.toBe(was);
  expect(
    moved.lastError(),
    "the meter moved without the page ever refusing to read it",
  ).toBeUndefined();
  await settled(page);
}

test.describe("a configuration the compiler refuses", () => {
  test("an over-budget configuration reddens its meter and disables the primary control", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await openProbe(page);

    // The precondition: the compiler itself says this does not fit. Everything
    // below is about what the interface does with that fact.
    const cost = await probeCost(page);
    expect(
      cost.fits,
      `the reserve really put it over: ${JSON.stringify(cost)}`,
    ).toBe(false);
    expect(cost.setup).toBeGreaterThan(908);

    const used = await meterUsed(page, "setup");
    expect(
      used,
      "the meter shows the number the compiler measured, reserve and all",
    ).toBe(cost.setup);
    expect(used, "and it is over the budget").toBeGreaterThan(908);
    expect(
      await meterPct(page, "setup"),
      "the percentage is CEILED outside the budget, so one character over reads 101",
    ).toBeGreaterThan(100);

    // The red is asserted as the class the stylesheet keys off rather than as a
    // colour: 05-10 measured that the over state is carried by four non-colour
    // signals as well, so the hue is deliberately not the thing under test.
    const meter = page.getByTestId("meter-setup");
    await expect(meter.locator(".numerals")).toHaveClass(/over/);
    await expect(meter.locator(".track")).toHaveClass(/over/);
    expect(
      await meterUsed(page, "timer"),
      "the event that fits is not reddened with it - one event over is not two",
    ).toBeLessThan(908);
    await expect(
      page.getByTestId("meter-timer").locator(".numerals"),
    ).not.toHaveClass(/over/);

    // TUNE-05: a real disabled button, never aria-disabled alone, never hidden,
    // and the reason beside it.
    const tryOn = page.getByTestId("try-on-device");
    await expect(tryOn).toBeVisible();
    await expect(tryOn).toBeDisabled();
    const reason = tryOnBudgetReason("Setup");
    await expect(
      page.getByTestId("probe-budget-reason"),
      "the region reported the reason upward, which is what disables the control",
    ).toHaveText(reason);
    await expect(
      page.locator("#try-on-reason").getByText(reason),
      "and the sentence is rendered beside the control, not only held in a prop",
    ).toBeVisible();

    // TUNE-04's block. Nothing has been turned yet, so this is the ARRIVED
    // sentence: naming a knob here would name one nobody moved.
    await expect(page.getByTestId("budget-message")).toHaveText(
      overBudgetArrived("Setup", cost.setup - 908),
    );
    expect(
      await page.getByTestId("turn-it-down").count(),
      "tpad's only sheet is sends and the compiler refuses to shed sends, so there is no ladder step to offer and no button is invented",
    ).toBe(0);

    expect(consoleErrors).toEqual([]);
  });

  test("the one-click back-off puts it back inside the budget", async ({
    page,
    context,
  }) => {
    // Nothing on this page may reach the hardware. requestPort is wrapped
    // before the document runs, so the assertion at the end is a count rather
    // than an absence of symptoms.
    await context.addInitScript(() => {
      const w = window as unknown as Record<string, unknown>;
      w.__requestPortCalls = 0;
      const serial = (navigator as unknown as Record<string, unknown>)
        .serial as { requestPort: (...args: unknown[]) => unknown } | undefined;
      if (!serial) return;
      const original = serial.requestPort.bind(serial);
      serial.requestPort = (...args: unknown[]) => {
        w.__requestPortCalls = (w.__requestPortCalls as number) + 1;
        return original(...args);
      };
    });

    const consoleErrors = collectErrors(page);
    await openProbe(page);
    const opened = await meterUsed(page, "setup");
    expect(
      opened,
      "the precondition: the probe opens over budget",
    ).toBeGreaterThan(908);

    // Down first, so there is a measured in-budget number to come back to.
    // Without this the block would be the arrived case a second time and there
    // would be nothing to click.
    await rails(page).nth(SCROLL_RAIL).focus();
    await page.keyboard.press("Home");
    await remeasured(page, opened);
    const inside = await meterUsed(page, "setup");
    expect(inside, "one key press brings it back inside 908").toBeLessThan(908);
    await expect(page.getByTestId("budget-message")).toHaveText("");
    await expect(page.getByTestId("try-on-device")).toBeEnabled();

    // And back over, this time with a culprit.
    await pressScroll(page, "End");
    const over = await meterUsed(page, "setup");
    expect(over).toBeGreaterThan(908);
    await expect(
      page.getByTestId("budget-message").locator(".line"),
      "a knob moved, so the block names it instead of blaming the configuration",
    ).toHaveText(overBudgetKnob(SCROLL_LABEL, "Setup", over - 908));

    const backOff = page.getByTestId("turn-it-down");
    await expect(backOff).toBeVisible();
    await expect(backOff).toHaveText(TURN_IT_DOWN);
    await expect(
      page.getByTestId("budget-message").locator(".explain"),
      "the quiet line says exactly what the click will do, in characters",
    ).toHaveText(backOffKnob(SCROLL_LABEL, "Setup", inside));

    await backOff.click();
    await remeasured(page, over);

    expect(
      await meterUsed(page, "setup"),
      "one click puts the knob back where it was, and the number with it",
    ).toBe(inside);
    await expect(
      page.getByTestId("meter-setup").locator(".numerals"),
    ).not.toHaveClass(/over/);
    await expect(
      page.getByTestId("budget-message"),
      "the block goes away rather than lingering as a warning about a state that has passed",
    ).toHaveText("");
    await expect(page.getByTestId("try-on-device")).toBeEnabled();
    await expect(page.getByTestId("probe-budget-reason")).toHaveText(
      "in budget",
    );

    // The back-off is a tuning control. It talks to the compiler and to nothing
    // else.
    expect(
      await page.evaluate(
        () => (window as unknown as Record<string, unknown>).__requestPortCalls,
      ),
      "no port was asked for at any point in this test",
    ).toBe(0);
    expect(
      await page.getByTestId("disconnect").count(),
      "and nothing was ever connected",
    ).toBe(0);
    expect(consoleErrors).toEqual([]);
  });
});
