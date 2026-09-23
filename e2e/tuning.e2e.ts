// TUNE-02 to TUNE-07, SHARE-01 to SHARE-03 and DEGR-01's clipboard half: the
// whole tuning and sharing journey, in a real browser.
//
// Twelve tests, all in the chromium project (ten from 05-11 to 13.1-06; the
// eleventh, 13.1-07's, types into the MIDI section's CC number field; the
// twelfth, change 16's, walks every widget kind the reworked rows draw). The
// last two open /dev/tune/, the unlinked probe wave 12 added, because the
// over-budget state TUNE-04 and TUNE-05 describe is unreachable from the
// shipped UI - see the block above those two tests.
//
// THE NUMBERS ARE READ OFF THE TUNING REGION'S DATA ATTRIBUTES SINCE 13.1-07
// (13.1-CONTEXT D-10: the meters are hidden by the user's word - "TUNING, so
// code limit visualiztation should be removed, lets not show that"). Nothing
// paints `{used} / 908` on the workspace any more; the region's root carries
// data-setup, data-timer and data-busy, machine-readable and never painted,
// so settled() and recomputed() below keep exactly the meaning the meters'
// aria-busy and numerals gave them. TUNE-05 is read where it renders: the
// zone's disabled Store (Apply until 2026-09-16) and its refusal line, and BudgetMessage's block. No title here carries the tag
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
  KNOB_HELD,
  KNOB_HOLD,
  LINK_COPIED,
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
  LUA_CHANNEL_CUE,
  POPOVER_CLOSE,
  RANDOMIZE,
  RESET_SETTINGS,
  SHARE_SNAPSHOT,
  offeredLine,
} from "../src/lib/tune/inspector-copy";
// SNAKE, for the widget walk (change 16): its step time is declared
// DESCENDING (300 220 160 110), the witness that the stepper walks the
// rungs in value order and a typed 100 snaps to 110. snake.ts imports only
// a type from the catalog.
import { SNAKE } from "../src/lib/catalog/entries/snake";
// Arc, for the CC number title (13.1-07): the values the field must offer
// and refuse are read off the entry, never typed here. arc.ts imports only
// a type from the vendored compiler, so this costs the runner nothing.
import { ARC } from "../src/lib/catalog/entries/arc";
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
 * Knob id to index, read off the rows' own `data-index` (change 16: every
 * knob row and every swatch row carries its position) and, while the colour
 * block is open, the picker's three rails.
 *
 * THE COLOUR KNOB IS A SWATCH ROW (`swatch-<id>`) and its picker's rails are
 * `colour-rail-r` / `-g` / `-b`; both are in the walk, so RESET ALL is
 * checked against the one knob with 4,096 positions too.
 *
 * SINCE 13.1-04 THE RAILS ARE IN THE DOM ONLY WHILE THE COLOUR BLOCK IS OPEN
 * (13.1-CONTEXT D-08). A title that wants the rails in a snapshot opens the
 * block first, with `openColourEditor`, and keeps it open across whatever it
 * compares; a title that never opens it compares snapshots without the three
 * rails on both sides, which is still an honest comparison of the rows.
 */
function knobIndices(page: Page): Promise<{ id: string; index: number }[]> {
  return page.evaluate(() => {
    const rows = Array.from(
      document.querySelectorAll(
        "[data-testid^='knob-'][data-index], [data-testid^='swatch-'][data-index]",
      ),
    ).map((el) => ({
      id: el.getAttribute("data-testid") ?? "",
      index: Number(el.getAttribute("data-index")),
    }));
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

/** The region's root, which carries the two measured numbers and the busy state (13.1-07). */
const region = (page: Page) => page.getByTestId("tuning-region");

/**
 * The measured number for one event, read off the region's data attribute:
 * `250`, never `250 / 908` - nothing paints the slash any more. Throws on a
 * region that has not measured yet, which no caller reaches: every read
 * here follows settled().
 */
async function measured(page: Page, event: "setup" | "timer"): Promise<number> {
  const text = await region(page).getAttribute(`data-${event}`);
  expect(text, `the ${event} number has landed on the region`).toMatch(
    /^[0-9]+$/,
  );
  return Number(text);
}

/**
 * Both numbers settled: neither measuring nor catching up.
 *
 * `data-busy` is the region's own published state - the meters' aria-busy,
 * kept on the root since the meters went - and covers both waits, which is
 * exactly why it is the anchor. Waiting only for a number to be present is
 * NOT enough and the difference is not academic - it was observed on this
 * file's first run. See `recomputed` below.
 */
async function settled(page: Page): Promise<void> {
  await expect(
    region(page),
    "the region settled on its numbers",
  ).toHaveAttribute("data-busy", "false", { timeout: 30_000 });
  for (const event of ["setup", "timer"] as const) {
    await expect(region(page), `the ${event} number landed`).toHaveAttribute(
      `data-${event}`,
      /^[0-9]+$/,
    );
  }
}

/**
 * Wait for a knob change to be MEASURED, not merely applied.
 *
 * A knob move puts the region into the stale state - `data-busy="true"`, the
 * numbers still the PREVIOUS ones - while the 120ms-debounced recompile
 * runs. A wait that only asked for a present number therefore came back
 * instantly with the old measurement, and every comparison in this file
 * would have been against the wrong number. Observed (on the meters, 05-11):
 * RESET ALL read `256 / 908` where the defaults are `250 / 908`.
 *
 * The stale phase is asserted rather than assumed, so a future change that
 * compiled synchronously on every keystroke - which is what the debounce exists
 * to prevent - turns this red instead of quietly making the wait meaningless.
 */
async function recomputed(page: Page): Promise<void> {
  await expect(
    region(page),
    "the change went through the debounced recompile",
  ).toHaveAttribute("data-busy", "true", { timeout: 5_000 });
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
async function openPanel(
  page: Page,
  path: string,
  id: string = ENTRY,
): Promise<void> {
  await page.goto(path);
  await expect(page.getByTestId("workspace")).toBeVisible();
  await waitForPicture(page, id);
  // 13.1-06: the tuner's region, not the install column's panel (chosen-panel
  // left with the column, 13.1-CONTEXT D-06; 13.1-04's swap in radius.e2e.ts).
  await expect(page.getByTestId("tuning-region")).toBeVisible();
  await expect(page.getByTestId("knob-rack").first()).toBeVisible();
  await settled(page);
}

/**
 * The colour picker opens INLINE under the swatch row on the row's chip
 * (change 16; 13.1-CONTEXT D-08 - a popover from 13-09 to 13.1-04). Open it
 * when its rails are not on screen: the block, and the rails with it, exist
 * only while open, so the chip is clicked first and the block waited for.
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
 * The KNOB ROWS' stepper fields, in rack order (change 16). The first one is
 * Aurora's Speed, the second its Band: Aurora's knob list is `[colour, speed,
 * direction, band]` plus Brightness - the colour is a swatch row and the
 * direction a segmented row, so neither is a spinbutton, and the brightness
 * field is a plain text input. SCOPED TO THE ROWS: the picker's rails are
 * range inputs under their own ids, reached through `turnColourRail`;
 * SCROLL_STEPPER keeps meaning tpad's third field.
 */
const steppers = (page: Page) =>
  page.locator(
    "[data-testid='knob-rack'] [data-testid^='knob-'] input[role='spinbutton']",
  );

/** One arrow up on a stepper - the next rung in VALUE order - then let the debounce land. */
async function turnStepper(page: Page, at: number): Promise<void> {
  await steppers(page).nth(at).focus();
  await page.keyboard.press("ArrowUp");
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

    await turnStepper(page, 0);

    const after = await sample(page, ENTRY);
    expect(
      after,
      "one arrow on the first stepper changes the pad the visitor is looking at",
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

  test("a CC number typed into the MIDI output field moves the knob to that value, one the knob does not offer is refused in the field with the offered values named and the last good value kept, and a Lua channel says it counts from 0", async ({
    page,
  }) => {
    // 13.1-07, 13.1-CONTEXT D-09 (bench line 7, screenshot 2), in a browser:
    // the field is a text input OVER Arc's closed cc list - 0..127 since
    // change 17, its five old rungs 1, 16, 20, 74, 102 first - so a typed 20
    // is the knob at index 2, a typed 200 is refused with aria-invalid and
    // the offered line under it while the knob stays where it was, blur keeps
    // the refused text, and a typed 102 lands. The
    // knob index is read off the field's own data-index, and the measurement
    // is proved to have run by the busy transition and - on the 3-character
    // literal - by the number moving. A CC number paints nothing, so the
    // pad's picture is deliberately NOT compared here; test 1 above owns
    // that assertion for a knob that does paint. tune-ui.spec.ts holds the
    // door (typedIndex) and the rendered shape; this is the wiring, pressed.
    const consoleErrors = collectErrors(page);
    const cc = ARC.knobs.find((knob) => knob.id === "cc");
    const channel = ARC.knobs.find((knob) => knob.id === "channel");
    expect(cc && channel, "Arc carries a cc and a channel knob").toBeTruthy();
    const values = cc!.values;
    expect(values.slice(0, 5)).toEqual(["1", "16", "20", "74", "102"]);
    expect(values).toHaveLength(128);
    const arrival = values[cc!.default];

    await openPanel(page, `/playground/${ARC.id}/`, ARC.id);
    const field = page.getByTestId("midi-field-cc");
    const input = page.getByTestId("midi-field-cc-input");
    const message = page.getByTestId("midi-field-cc-message");
    const reset = page.getByTestId("midi-field-cc-reset");
    // The section: the LFO output's block (change 17) - its Channel and
    // Number stepper fields (change 16), the helper read by a screen reader;
    // no rack in the MIDI section.
    const grid = page.getByTestId("midi-grid");
    await expect(grid).toBeVisible();
    expect(await grid.locator("[data-testid='knob-rack']").count()).toBe(0);
    await expect(field.locator("label")).toHaveText("Number");
    await expect(
      page.getByTestId("midi-field-channel").locator("label"),
    ).toHaveText("Channel");
    await expect(input).toHaveAttribute("type", "text");
    await expect(input).toHaveAttribute("role", "spinbutton");
    await expect(input).toHaveAttribute("inputmode", "numeric");
    await expect(
      input,
      "the field arrives on the knob's own literal",
    ).toHaveValue(arrival);
    await expect(field).toHaveAttribute("data-index", String(cc!.default));
    await expect(
      reset,
      "at the default there is nothing to reset",
    ).toBeDisabled();
    const setupBefore = await measured(page, "setup");
    const timerBefore = await measured(page, "timer");

    // A VALUE THE KNOB OFFERS: the knob moves to its index, the measurement
    // runs, the marker and the reset come on, nothing is refused.
    await input.fill("20");
    await recomputed(page);
    await expect(field).toHaveAttribute("data-index", "2");
    await expect(input).toHaveValue("20");
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
    await expect(message).toHaveCount(0);
    await expect(field).toHaveAttribute("data-changed", "true");
    await expect(reset).toBeEnabled();

    // A VALUE THE KNOB DOES NOT OFFER: refused in the field, the offered
    // values named, the knob unmoved and the numbers unmoved - no compile
    // ran, so the region never went busy.
    const setupAt20 = await measured(page, "setup");
    await input.fill("200");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(message).toHaveText(offeredLine("cc", values));
    expect(offeredLine("cc", values)).toBe(
      "A controller number here is 0 to 127.",
    );
    await expect(input).toHaveAttribute(
      "aria-describedby",
      await message.getAttribute("id"),
    );
    await expect(field).toHaveAttribute("data-index", "2");
    await expect(region(page)).toHaveAttribute("data-busy", "false");
    expect(await measured(page, "setup")).toBe(setupAt20);
    // Blur keeps the refused text and its message (13-16's rule).
    await input.blur();
    await expect(input).toHaveValue("200");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(message).toHaveText(offeredLine("cc", values));
    await expect(field).toHaveAttribute("data-index", "2");

    // A VALID VALUE AGAIN: the message goes, the knob lands, and a
    // three-character literal moves the measurement where 16 -> 20 could
    // not (both two characters).
    await input.fill("102");
    await recomputed(page);
    await expect(field).toHaveAttribute("data-index", "4");
    await expect(input).toHaveValue("102");
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
    await expect(message).toHaveCount(0);
    const setupAt102 = await measured(page, "setup");
    const timerAt102 = await measured(page, "timer");
    expect(
      setupAt102 !== setupBefore || timerAt102 !== timerBefore,
      `the typed literal reached the compiler: setup ${setupBefore} -> ${setupAt102}, timer ${timerBefore} -> ${timerAt102}`,
    ).toBe(true);

    // THE STEP BOXES AND THE ARROWS (change 16) walk the closed list in
    // value order whatever the declared order: down from 102 is 101, an arrow
    // down again is 100, and at 127 the up box has nowhere to go.
    const up = page.getByTestId("midi-field-cc-up");
    const down = page.getByTestId("midi-field-cc-down");
    await down.click();
    await recomputed(page);
    await expect(field).toHaveAttribute(
      "data-index",
      String(values.indexOf("101")),
    );
    await expect(input).toHaveValue("101");
    await input.focus();
    await page.keyboard.press("ArrowDown");
    await recomputed(page);
    await expect(input).toHaveValue("100");
    await input.fill("127");
    await recomputed(page);
    await expect(up, "at the top the up box has nowhere to go").toBeDisabled();
    await down.click();
    await recomputed(page);
    await expect(input).toHaveValue("126");
    await expect(up).toBeEnabled();

    // THE PER-FIELD RESET: back to the default, the marker off.
    await reset.click();
    await recomputed(page);
    await expect(field).toHaveAttribute("data-index", String(cc!.default));
    await expect(input).toHaveValue(arrival);
    await expect(field).toHaveAttribute("data-changed", "false");
    await expect(reset).toBeDisabled();

    // THE CHANNEL FIELD ON A LUA ENTRY: the firmware's zero-based literal
    // (X-08) under the PDF's label, with the cue beneath it and in its
    // description - 13.1-CONTEXT question 5 is open, and this is what keeps
    // the asked state from being a silent off-by-one until it is answered.
    const channelInput = page.getByTestId("midi-field-channel-input");
    await expect(channelInput).toHaveValue(channel!.values[channel!.default]);
    expect(channel!.values[0], "a Lua channel list starts at 0").toBe("0");
    // The cue is read, not painted (change 16: no helper prose in the rows):
    // in the DOM for a screen reader, in the field's description, and the
    // label's title for a pointer.
    const cue = page.getByTestId("midi-field-channel-cue");
    await expect(cue).toBeAttached();
    await expect(cue).toHaveText(LUA_CHANNEL_CUE);
    await expect(
      page.getByTestId("midi-field-channel").locator("label"),
    ).toHaveAttribute("title", LUA_CHANNEL_CUE);
    await expect(channelInput).toHaveAttribute(
      "aria-describedby",
      await cue.getAttribute("id"),
    );
    await expect(
      page.getByTestId("midi-field-cc-cue"),
      "the cue is the channel's alone",
    ).toHaveCount(0);

    expect(consoleErrors).toEqual([]);
  });

  test("ARC's MIDI output (change 17): the LFO's block under its name, Type a select that takes the Number row away on Pitch bend, a typed Channel, Same channel for all showing the shared channel and setting it, Receive a segmented Off / On - every move recompiled", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await openPanel(page, `/playground/${ARC.id}/`, ARC.id);
    const grid = page.getByTestId("midi-grid");
    await expect(grid.getByTestId("midi-output")).toHaveText("LFO");
    await expect(grid.getByTestId("midi-output")).toHaveAttribute(
      "data-output",
      "lfo",
    );
    const type = page.getByTestId("knob-midiType");
    const typeSelect = type.locator("select");
    await expect(typeSelect).toHaveValue("0");
    await expect(type.locator("option")).toHaveText([
      "CC",
      "Pitch bend",
      "Channel pressure",
    ]);
    await expect(page.getByTestId("midi-field-cc")).toBeVisible();
    // TYPE: Pitch bend takes the Number away and recompiles; CC brings it back.
    await typeSelect.selectOption({ label: "Pitch bend" });
    await recomputed(page);
    await expect(type).toHaveAttribute("data-index", "1");
    await expect(page.getByTestId("midi-field-cc")).toHaveCount(0);
    await typeSelect.selectOption({ label: "CC" });
    await recomputed(page);
    await expect(page.getByTestId("midi-field-cc")).toBeVisible();
    // CHANNEL: typed 4; Same channel for all shows it (the one output shares it).
    const channel = page.getByTestId("midi-field-channel-input");
    const same = page.getByTestId("knob-midiSameChannel").locator("select");
    await expect(same).toHaveValue("1");
    await channel.fill("4");
    await channel.press("Enter");
    await channel.blur();
    await recomputed(page);
    await expect(page.getByTestId("midi-field-channel")).toHaveAttribute(
      "data-index",
      "4",
    );
    await expect(same).toHaveValue("5");
    // SAME CHANNEL FOR ALL: 9 writes every output's channel.
    await expect(
      page.getByTestId("knob-midiSameChannel").locator("option"),
    ).toHaveCount(17);
    await same.selectOption({ label: "9" });
    await recomputed(page);
    await expect(channel).toHaveValue("9");
    await expect(same).toHaveValue("10");
    // RECEIVE: On by default, Off one click.
    const receive = page.getByTestId("knob-midiReceive");
    await expect(receive).toHaveAttribute("data-index", "1");
    await receive.getByText("Off").click();
    await recomputed(page);
    await expect(receive).toHaveAttribute("data-index", "0");
    expect(consoleErrors).toEqual([]);
  });

  test("the two measured numbers differ and both change on a knob turn", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await openPanel(page, `/playground/${ENTRY}/`);

    const setupBefore = await measured(page, "setup");
    const timerBefore = await measured(page, "timer");
    // Two events, two budgets, two numbers. A pair carrying one number twice
    // would be a wiring bug that every other assertion here would miss.
    expect(
      timerBefore,
      "Setup and Timer are measured separately and do not read the same",
    ).not.toBe(setupBefore);
    for (const [event, used] of [
      ["setup", setupBefore],
      ["timer", timerBefore],
    ] as const) {
      expect(used, `the ${event} number is inside 908`).toBeLessThanOrEqual(
        908,
      );
    }

    await turnStepper(page, 0);

    const setupAfter = await measured(page, "setup");
    const timerAfter = await measured(page, "timer");
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
    const homeSetup = await measured(page, "setup");
    const homeTimer = await measured(page, "timer");

    await turnStepper(page, 0);
    await turnStepper(page, 1);
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
    expect(await measured(page, "setup"), "the Setup budget came back").toBe(
      homeSetup,
    );
    expect(await measured(page, "timer"), "the Timer budget came back").toBe(
      homeTimer,
    );
    await expect(
      resetAll,
      "back at the defaults there is nothing left to reset",
    ).toBeDisabled();

    // THE CHIP AND ESCAPE (13.1-04, 13.1-CONTEXT D-08; change 16's chip).
    // The block is inline, so there is no trap and no return: while it is
    // open the row's chip carries Close (its hidden verb and its title);
    // Escape pressed with focus INSIDE the block closes it - the block
    // leaves the DOM - and focus lands on the row's chip, which carries Edit
    // color again. The one behaviour a source scan cannot prove.
    const chip = page.getByTestId("edit-color").first();
    await expect(page.getByTestId("colour-editor")).toBeVisible();
    await expect(chip, "the open block's chip reads Close").toContainText(
      POPOVER_CLOSE,
    );
    await expect(chip).toHaveAttribute("title", POPOVER_CLOSE);
    await expect(chip).toHaveAttribute("aria-expanded", "true");
    await page
      .locator("[data-testid='colour-rail-r'] input[type='range']")
      .focus();
    await page.keyboard.press("Escape");
    await expect(
      page.getByTestId("colour-editor"),
      "Escape inside the block closes it",
    ).toHaveCount(0);
    await expect(chip, "focus lands on the row's chip").toBeFocused();
    await expect(chip, "the closed chip reads Edit color").toContainText(
      EDIT_COLOR,
    );
    await expect(chip).toHaveAttribute("title", EDIT_COLOR);
    await expect(chip).toHaveAttribute("aria-expanded", "false");

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
    // so neither number may be over 908 afterwards and no refusal renders.
    for (const event of ["setup", "timer"] as const) {
      expect(
        await measured(page, event),
        `the ${event} number is at or under 908 after a roll`,
      ).toBeLessThanOrEqual(908);
    }
    await expect(
      page.getByTestId("budget-message"),
      "no over-budget block after a roll",
    ).toHaveText("");

    expect(consoleErrors).toEqual([]);
  });

  test("every widget kind, walked (change 16): a typed 100 snaps to SNAKE's 110, the boxes and the arrows step in value order, End is the top rung, a word is refused, the reset box and the lock work, a segment is one click, the chip opens the palette, the sections read in order, a select lands on its option, and every control hits 44px", async ({
    page,
  }) => {
    // The reworked rows on the deployed bytes, one walk per widget kind at
    // the desktop width (the phone width is tuning-webkit.e2e.ts's). SNAKE
    // is the witness for the stepper: its step time is declared DESCENDING
    // (300 220 160 110 ms), so "up" must be the next LARGER value whatever
    // the declared order, and a typed 100 must land on 110 - the nearest
    // declared rung, never between two. tune-ui.spec.ts holds the rule
    // (nearestRung, valueOrder); this is the wiring, pressed.
    const consoleErrors = collectErrors(page);
    const speed = SNAKE.knobs.find((knob) => knob.id === "speed");
    expect(speed, "SNAKE carries a step time knob").toBeDefined();
    expect(speed!.values).toEqual(["300", "220", "160", "110"]);
    expect(speed!.default).toBe(1);
    await openPanel(page, `/playground/${SNAKE.id}/`, SNAKE.id);

    // THE SECTIONS, in the fixed order, only the ones SNAKE fills.
    await expect(
      page.locator("[data-testid='shell-inspector'] h3"),
      "the sections are Look, Feel, Sound and MIDI, in that order (no Sync on SNAKE)",
    ).toHaveText(["Look", "Feel", "Sound", "MIDI"]);

    // THE STEPPER. The row arrives at 220 ms with its unit beside the value.
    const row = page.getByTestId("knob-speed");
    const input = page.getByTestId("knob-speed-input");
    const up = page.getByTestId("knob-speed-up");
    const down = page.getByTestId("knob-speed-down");
    const reset = page.getByTestId("knob-speed-reset");
    const lock = page.getByTestId("knob-speed-hold");
    await expect(row).toHaveAttribute("data-widget", "stepper");
    await expect(row).toHaveAttribute("data-index", "1");
    await expect(input).toHaveValue("220");
    await expect(input).toHaveAttribute("role", "spinbutton");
    await expect(input).toHaveAttribute("aria-valuetext", "220 ms");
    await expect(row.locator(".unit")).toHaveText("ms");
    await expect(
      reset,
      "at the default there is nothing to reset",
    ).toBeDisabled();
    await expect(row).toHaveAttribute("data-changed", "false");

    // A typed 100, committed with Enter, snaps to 110 - index 3 in the
    // declared order - and the field shows the rung, not the typed text.
    await input.fill("100");
    await expect(row, "typing alone moves nothing").toHaveAttribute(
      "data-index",
      "1",
    );
    await input.press("Enter");
    await recomputed(page);
    await expect(row).toHaveAttribute("data-index", "3");
    await expect(input).toHaveValue("110");
    await expect(row).toHaveAttribute("data-changed", "true");
    await expect(reset).toBeEnabled();
    await expect(down, "110 is the foot of the ladder").toBeDisabled();

    // The arrows and the boxes walk the VALUE order: up from 110 is 160
    // (index 2), the up box is 220 (index 1), End is 300 (index 0).
    await input.focus();
    await page.keyboard.press("ArrowUp");
    await recomputed(page);
    await expect(row).toHaveAttribute("data-index", "2");
    await expect(input).toHaveValue("160");
    await up.click();
    await recomputed(page);
    await expect(row).toHaveAttribute("data-index", "1");
    await expect(input).toHaveValue("220");
    await input.focus();
    await page.keyboard.press("End");
    await recomputed(page);
    await expect(row).toHaveAttribute("data-index", "0");
    await expect(input).toHaveValue("300");
    await expect(up, "300 is the top of the ladder").toBeDisabled();
    await down.click();
    await recomputed(page);
    await expect(row).toHaveAttribute("data-index", "1");

    // A word is not a value: on blur the field shows the rung it was on and
    // the region never went busy.
    await input.fill("fast");
    await input.blur();
    await expect(input).toHaveValue("220");
    await expect(row).toHaveAttribute("data-index", "1");
    await expect(region(page)).toHaveAttribute("data-busy", "false");
    // A typed 999 clamps to the top rung.
    await input.fill("999");
    await input.press("Enter");
    await recomputed(page);
    await expect(row).toHaveAttribute("data-index", "0");

    // The reset box puts the row back; the lock toggles its word and state.
    await reset.click();
    await recomputed(page);
    await expect(row).toHaveAttribute("data-index", "1");
    await expect(row).toHaveAttribute("data-changed", "false");
    await expect(reset).toBeDisabled();
    await expect(lock).toHaveAttribute("aria-pressed", "false");
    await expect(lock).toHaveAttribute("title", KNOB_HOLD);
    await lock.click();
    await expect(lock).toHaveAttribute("aria-pressed", "true");
    await expect(lock).toHaveAttribute("title", KNOB_HELD);
    await lock.click();
    await expect(lock).toHaveAttribute("aria-pressed", "false");

    // THE SEGMENTED ROW: SNAKE's lowest note, four radios; the second is one click.
    const note = page.getByTestId("knob-note");
    await expect(note).toHaveAttribute("data-widget", "words");
    const radios = note.locator("input[type='radio']");
    expect(await radios.count()).toBe(4);
    // The radio is visually hidden inside its label; the label is the click.
    await note.locator("label").nth(1).click();
    await expect(radios.nth(1)).toBeChecked();
    await recomputed(page);
    await expect(note).toHaveAttribute("data-index", "1");

    // THE SWATCH CHIP: SNAKE's body colour is a hand-authored palette; the
    // chip reads its hue word, opens the block on a click, and the palette
    // row inside it moves the knob - the chip's readout follows.
    const body = page.getByTestId("swatch-body");
    const chip = body.getByTestId("edit-color");
    await expect(chip).toContainText("Spring green");
    await expect(chip).toHaveAttribute("aria-expanded", "false");
    await chip.click();
    await expect(chip).toHaveAttribute("aria-expanded", "true");
    const editor = page.getByTestId("colour-editor");
    await expect(editor).toBeVisible();
    await expect(editor).toHaveAttribute("data-knob", "body");
    const palette = editor
      .getByTestId("knob-body")
      .locator("input[type='radio']");
    expect(await palette.count()).toBe(4);
    await editor.getByTestId("knob-body").locator("label").nth(1).click();
    await expect(palette.nth(1)).toBeChecked();
    await recomputed(page);
    await expect(body).toHaveAttribute("data-index", "1");
    await expect(chip).toContainText("Cyan");
    await expect(body).toHaveAttribute("data-changed", "true");
    await body.getByTestId("swatch-body-reset").click();
    await recomputed(page);
    await expect(body).toHaveAttribute("data-index", "0");

    // EVERY CONTROL ON THE ROW HITS 44px, measured: the field as its whole
    // control (the input sits 42px between the field's two hairlines).
    const stepper = page.getByTestId("knob-speed-stepper");
    for (const control of [stepper, up, down, reset, lock, chip]) {
      const box = await control.boundingBox();
      expect(box, "the control has a box").not.toBeNull();
      expect(box!.height, "44px tall").toBeGreaterThanOrEqual(44);
    }
    for (const control of [up, down, reset, lock]) {
      const box = await control.boundingBox();
      expect(box!.width, "44px wide").toBeGreaterThanOrEqual(44);
    }

    // THE SELECT: ARC's wave shape, six words; Square is index 4.
    await openPanel(page, `/playground/${ARC.id}/`, ARC.id);
    const shape = page.getByTestId("knob-shape");
    await expect(shape).toHaveAttribute("data-widget", "select");
    const select = shape.locator("select");
    expect(await select.locator("option").count()).toBe(6);
    await select.selectOption({ label: "Square" });
    await recomputed(page);
    await expect(shape).toHaveAttribute("data-index", "4");
    await expect(select).toHaveValue("4");
    // ARC's CC number and channel are under MIDI; its arms (41 / 82 / 123, the
    // compiler's radial multipliers) read 1 / 2 / 3 as a segmented row under
    // Feel - the review's finding, fixed in view.ts by the knob's id.
    await expect(page.locator("[data-testid='shell-inspector'] h3")).toHaveText(
      ["Look", "Feel", "MIDI"],
    );
    const arms = page.getByTestId("knob-arms");
    await expect(arms).toHaveAttribute("data-widget", "words");
    await expect(arms.locator("label")).toHaveText(["1", "2", "3"]);

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

    await turnStepper(page, 0);
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

    await turnStepper(page, 0);
    await turnStepper(page, 1);
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

    await turnStepper(page, 0);
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
// injects a cost, and the region has no test-only prop: what sets the refusal
// is a budget the compiler really refused. Since 13.1-07 (D-10) nothing paints
// the numbers; they are read off the region's data attributes, and TUNE-05 is
// read where it renders - the zone's disabled Store with its refusal line
// (the probe mounts DestinationZone with the refusal alone, 13.1-06) and
// BudgetMessage's block with its one-click back-off.
//
// The probe's own numbers are read from its `probe-cost` readout, which
// recomputes the cost from the indices the region reports, through $lib/pad. So
// the numerals below are held against the compiler's answer rather than against
// a literal that would rot the day the pin moves.
//
// The knob these tests drive is Scroll - the third stepper on tpad's rack -
// and its measured band with the probe's reserve of 3 is: index 0..3 ->
// 907/908 (in budget), 4 -> 905/908, 5 -> 909/908, 6..7 -> 910/908. Home is
// the smallest value and End the largest on the stepper's ladder, and the
// list is ascending, so Home is index 0 and End index 7: one key press
// crosses the line in either direction.

const PROBE = "/dev/tune/";

/** tpad's third knob. Its label is what the over-budget block names. */
const SCROLL_LABEL = "Scroll";
const SCROLL_STEPPER = 2;

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
  await steppers(page).nth(SCROLL_STEPPER).focus();
  await page.keyboard.press(key);
  await recomputed(page);
}

/**
 * Wait for the next measurement to LAND when the region is starting from over
 * budget, where it cannot report that it is busy.
 *
 * `meterView` makes `over` outrank the feed - "a warning is never dimmed" - so
 * a view holding an over-budget number publishes `data-busy="false"` for the
 * whole of the 120ms recompile, and `recomputed` above would time out on it.
 * OBSERVED: this file's first run failed exactly there (on the meter's
 * aria-busy, which the attribute inherits). The anchor here is therefore the
 * number itself, polled until it is no longer the one that was on the region
 * when the key went down. Every transition these tests make moves the
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
    () => measured(page, "setup"),
    was,
    "the Setup number on the region",
  );
  await expect.poll(moved.read, { timeout: 30_000 }).not.toBe(was);
  expect(
    moved.lastError(),
    "the number moved without the page ever refusing to read it",
  ).toBeUndefined();
  await settled(page);
}

test.describe("a configuration the compiler refuses", () => {
  test("an over-budget configuration shows the refusal line and disables Store", async ({
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

    const used = await measured(page, "setup");
    expect(
      used,
      "the region carries the number the compiler measured, reserve and all",
    ).toBe(cost.setup);
    expect(used, "and it is over the budget").toBeGreaterThan(908);
    expect(
      await measured(page, "timer"),
      "the event that fits is not over with it - one event over is not two",
    ).toBeLessThan(908);
    // NOTHING PAINTS THE NUMBER (13.1-07, D-10): no meter, no TUNING caption,
    // no percentage in the workspace's inspector. The refusal is the message.
    expect(await page.getByTestId("meter-setup").count()).toBe(0);
    expect(await page.getByTestId("tuning-meters").count()).toBe(0);
    expect(await page.getByText("TUNING", { exact: true }).count()).toBe(0);

    // TUNE-05: a real disabled button, never aria-disabled alone, never hidden,
    // and the reason beside it - the zone's Store on ZONA (13.1-06 mounts the
    // zone on the probe with the refusal alone) described by its refusal
    // line, which is the one place the cause is painted.
    const store = page.getByTestId("store-on-zona");
    await expect(store).toBeVisible();
    await expect(store).toBeDisabled();
    const reason = tryOnBudgetReason("Setup");
    await expect(
      page.getByTestId("probe-budget-reason"),
      "the region reported the reason upward, which is what disables the control",
    ).toHaveText(reason);
    const refusal = page.getByTestId("store-refusal");
    await expect(
      refusal,
      "and the sentence is rendered beside the control, not only held in a prop",
    ).toBeVisible();
    await expect(refusal).toHaveText(reason);
    await expect(
      store,
      "the refusal is Store's description as well as its neighbour",
    ).toHaveAttribute("aria-describedby", /-refusal$/);

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
    const opened = await measured(page, "setup");
    expect(
      opened,
      "the precondition: the probe opens over budget",
    ).toBeGreaterThan(908);

    // Down first, so there is a measured in-budget number to come back to.
    // Without this the block would be the arrived case a second time and there
    // would be nothing to click.
    await steppers(page).nth(SCROLL_STEPPER).focus();
    await page.keyboard.press("Home");
    await remeasured(page, opened);
    const inside = await measured(page, "setup");
    expect(inside, "one key press brings it back inside 908").toBeLessThan(908);
    await expect(page.getByTestId("budget-message")).toHaveText("");
    // The probe has no session, so Store stays disabled on that; what the
    // budget controls is the REFUSAL, which is gone inside 908.
    await expect(page.getByTestId("store-refusal")).toHaveCount(0);
    await expect(page.getByTestId("probe-budget-reason")).toHaveText(
      "in budget",
    );

    // And back over, this time with a culprit.
    await pressScroll(page, "End");
    const over = await measured(page, "setup");
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

    await expect(
      page.getByTestId("store-refusal"),
      "over budget the zone's refusal line names the cause",
    ).toHaveText(tryOnBudgetReason("Setup"));
    await expect(page.getByTestId("store-on-zona")).toBeDisabled();

    await backOff.click();
    await remeasured(page, over);

    expect(
      await measured(page, "setup"),
      "one click puts the knob back where it was, and the number with it",
    ).toBe(inside);
    await expect(
      page.getByTestId("budget-message"),
      "the block goes away rather than lingering as a warning about a state that has passed",
    ).toHaveText("");
    await expect(
      page.getByTestId("store-refusal"),
      "and the refusal with it",
    ).toHaveCount(0);
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
