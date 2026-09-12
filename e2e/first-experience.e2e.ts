// PREV-01, PREV-02, D-10 and 13-CONTEXT.md D-14 Q2: the browser half of the
// first experience.
//
// FIVE TESTS SINCE 13-07, FROM ELEVEN. / became PDF page 1 - the intro, one
// live hero surface beside the words, no splash, no coverflow, no dissolve -
// and seven titles whose subject was the ring or the splash were deleted by
// name on 2026-09-11: "the front door animates", "the row steps with the
// keyboard and wraps", "the splash opens the front door and clears itself",
// "any key cuts straight to the dissolve", "choosing reveals the panel, and
// Escape and Back both close it", "a deep link lands with that configuration
// centred and skips the splash", "the row's painted frames over two seconds
// are recorded". None of the seven was @webkit-tagged. Four survive, re-aimed
// where their subject moved, and one is added: the returning visitor.
//
// THE SHELF WENT AT 13-09. A configuration's page is PDF page 5's workspace
// now - the rail of nearby configurations, the surface, the inspector - and
// FrontDoor.svelte, Coverflow.svelte and NamePlate.svelte left the tree with
// src/lib/coverflow/. The three titles whose subject was the ring on
// /playground/{id}/ are re-aimed at the workspace: a still configuration is
// still on its own page; reduced motion stills the surface too (stepping no
// longer exists to be instant); and an off-row page is a workspace of its own
// with the rail as its way on (a row of one no longer exists either). Two of
// the three titles changed their words with their subject, and 13-09-SUMMARY
// .md names them.
//
// What this file covers now: that the intro's hero is the firmware simulator
// really running with nothing plugged in (its canvas provably changes between
// two samples); that the honesty of the classification holds in the other
// direction on a configuration's own page (a pad the catalog calls static
// provably does not change); that reduced motion stills the hero and the
// workspace's surface; that a browser with no Web Serial still gets the
// workspace's controls, present and disabled with the reason; that every
// routed configuration is a real file with its own description while an
// off-row page is a workspace of its own; and that a returning visitor is
// offered their draft on the same page, never redirected.
//
// Everything here runs against build/ served by worker/index.js under
// wrangler dev - the deployed bytes, not a dev server - so a pad that only
// animates in development is a red test rather than a nice demo.
//
// What this file cannot cover: Web Serial. It is an operating-system
// capability with no CDP domain and no fake-device hook, so the device half is
// a human check with a real ZONA on the desk. Nothing below opens a port or
// writes a byte. What CAN be proven in a browser is the branch a large share
// of visitors actually land on - no Web Serial at all.
//
// AMENDMENT (D-07, plan 05.1-05), to ONE test - the deep-link file test, whose
// title changed with it. It reads ROUTED and asserts every page is served with
// its own description, and the 404 half moved to a genuinely unknown id.
//
// AMENDMENT (Phase 7, plan 07-11). The degrade test is EXTENDED: PUT BACK is
// ABSENT on a browser that cannot write (07-UI-SPEC Z-12), and KEEP ON DEVICE
// is disabled with the capability sentence adjacent (DEGR-02 on the third
// control).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { expect, test, type Page } from "@playwright/test";
// The list itself, not a copy of it. src/lib/catalog/front-door.ts imports
// nothing at all - that is the whole reason it exists as a separate module - so
// pulling it into a Playwright file costs nothing.
import { FRONT_DOOR, FRONT_DOOR_HERO } from "../src/lib/catalog/front-door";
import { KEEP_REASONS } from "../src/lib/device/install-copy";
// The routed set, by its one name. src/lib/catalog/listing.ts imports nothing at
// runtime either, so this costs a Playwright file nothing.
import { ROUTED } from "../src/lib/catalog/listing";

/** The intro's hero, derived: the first non-dark member of FRONT_DOOR. */
const HERO = FRONT_DOOR_HERO.id;

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

/** The workspace, on a configuration's page (13-09). */
async function waitForWorkspace(page: Page): Promise<void> {
  await expect(page.getByTestId("workspace")).toBeVisible();
}

test.describe("the intro, with no hardware attached", () => {
  test("a first visit sees the intro with its hero running, a returning visitor is offered their draft, and neither is redirected", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);

    // Every navigation after the first arrival is counted. A redirect on
    // mount - the thing D-14 Q2 rules out - would be one.
    let arrivals = 0;
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) arrivals += 1;
    });

    // THE FIRST VISIT. The prerendered intro, the first card offering the
    // Playground, and the hero really running: its backing store changes
    // between two samples 400 ms apart, which is what "live" means.
    await page.goto("/");
    await expect(page.getByTestId("intro")).toBeVisible();
    await expect(page.getByTestId("start-explore")).toBeVisible();
    await expect(page.getByTestId("start-explore")).toContainText(
      "Explore Playground",
    );
    expect(await page.getByTestId("start-resume").count()).toBe(0);
    await expect(page.getByTestId("start-sandbox")).toBeVisible();
    expect(
      await page.locator('[data-testid^="pad-canvas-"]').count(),
      "one live surface, not a row",
    ).toBe(1);

    await waitForPicture(page, HERO);
    const first = await sample(page, HERO);
    expect(first, "the hero canvas was readable").not.toBeNull();
    await page.waitForTimeout(400);
    expect(
      await sample(page, HERO),
      `${HERO} is the hero and is not dark, so 400ms of firmware ticks must move it`,
    ).not.toBe(first);

    // The flag was written on this first successful mount, once, through
    // 13-06's store: an envelope with the schema, seen, and the moment.
    const flag = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("hangar.intro.v1") ?? "null"),
    );
    expect(flag).toMatchObject({ schema: 1, seen: true });
    expect(typeof flag.at).toBe("string");

    // THE RETURNING VISITOR, with a draft: plant a Playground draft in the
    // store's own shape (src/lib/store/schema.ts) and come back.
    await page.evaluate(() => {
      const at = new Date(Date.now() - 12 * 60_000).toISOString();
      localStorage.setItem(
        "hangar.drafts.v1",
        JSON.stringify({
          schema: 1,
          drafts: {
            "playground:aurora": {
              schema: 1,
              id: "playground:aurora",
              name: "Aurora, my way",
              kind: "playground",
              source: "aurora",
              knobIndices: [0, 1, 2],
              createdAt: at,
              editedAt: at,
            },
          },
        }),
      );
    });
    const before = arrivals;
    await page.reload();
    await expect(page.getByTestId("intro")).toBeVisible();
    const resume = page.getByTestId("start-resume");
    await expect(resume).toBeVisible();
    await expect(resume).toContainText("Resume draft");
    await expect(resume).toContainText("Aurora, my way");
    await expect(resume).toContainText("Last edited 12 minutes ago");
    expect(await page.getByTestId("start-explore").count()).toBe(0);
    await expect(page.getByTestId("start-sandbox")).toBeVisible();
    // The card is one link and points at the draft's own address, through
    // the same helper every card on the site uses (13-08 moves it with D-20).
    expect(await resume.getAttribute("href")).toMatch(
      /\/playground\/aurora\/?$/,
    );

    // NEVER REDIRECTED. The reload is the one arrival; after the page has
    // settled there has been no other, the address is still /, and the hero
    // is still the page's own live surface.
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    expect(arrivals - before, "the reload was the only navigation").toBe(1);
    expect(new URL(page.url()).pathname).toBe("/");
    await waitForPicture(page, HERO);

    // The moment is the first visit's, not this one's: marking twice keeps
    // the first.
    const again = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("hangar.intro.v1") ?? "null"),
    );
    expect(again.at).toBe(flag.at);

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("a configuration's page, with no hardware attached", () => {
  test("a still configuration really is still", async ({ page }) => {
    const consoleErrors = collectErrors(page);
    // ninepads is declared `static` in src/lib/catalog/front-door.ts, derived
    // from golden-frames.json by front-door.spec.ts. Its own page is its
    // workspace (13-09), and the surface is its pad.
    await page.goto("/playground/ninepads/");
    await waitForWorkspace(page);
    await expect(page.getByTestId("workspace-name")).toHaveText("Nine pads");
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
});

test.describe("a configuration's page on a browser that cannot install", () => {
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
    // The shell's connection slot is 13-11's; the controls that degrade live
    // in the install column on a configuration's workspace.
    await page.goto(`/playground/${HERO}/`);

    // Precondition, asserted. A degrade test that does not verify its own
    // precondition passes for the wrong reason.
    expect(await page.evaluate(() => "serial" in navigator)).toBe(false);

    await waitForWorkspace(page);
    await expect(page.getByTestId("workspace")).toHaveAttribute(
      "data-ready",
      "true",
    );
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

    // Phase 7 (Z-12): PUT BACK restores a specific module's own configuration, and on a
    // browser that has never seen a module there is nothing for it to name. Absent, not disabled.
    await expect(page.getByTestId("put-back")).toHaveCount(0);
    // DEGR-02 on the third control: the reason is the capability sentence, adjacent.
    await expect(page.getByTestId("keep-on-device")).toBeDisabled();
    await expect(page.getByTestId("keep-on-device-line")).toContainText(
      KEEP_REASONS.incapable,
    );
    expect(KEEP_REASONS.incapable).toBe("This browser can’t write to a ZONA.");

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("a visitor who asked for less motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("reduced motion stills the intro's hero and the workspace's surface", async ({
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

    // THE HERO, on the intro (13-07). The host resets the engine and runs it
    // to tick 64, then freezes it. golden-frames.json samples ticks 0, 37,
    // 101, 500 and 1009 and therefore pins no preset at 64, so what is
    // asserted is the pair of properties that matter rather than an exact
    // frame: lit, and unchanging.
    await page.goto("/");
    await expect(page.getByTestId("intro")).toBeVisible();
    await waitForPicture(page, HERO);
    const first = await sample(page, HERO);
    expect(first, "the hero canvas was readable").not.toBeNull();
    const lit = (first as string).split(",").filter((b) => b !== "0").length;
    expect(
      lit,
      "the still representative frame must show colour, not a black square",
    ).toBeGreaterThan(0);

    await page.waitForTimeout(400);
    expect(
      await sample(page, HERO),
      "reduced motion holds one frame; 400ms of wall clock must not move it",
    ).toBe(first);

    // THE SURFACE, on the workspace (13-09). The same host, the same rule:
    // the entry that animates on the intro is held on one frame here too.
    // Stepping no longer exists to be instant - the ring went with the
    // coverflow - so the second half of this title is the surface's stillness.
    await page.goto(`/playground/${FRONT_DOOR[0].id}/`);
    await waitForWorkspace(page);
    await waitForPicture(page, FRONT_DOOR[0].id);
    const surface = await sample(page, FRONT_DOOR[0].id);
    expect(surface, "the surface canvas was readable").not.toBeNull();
    await page.waitForTimeout(400);
    expect(
      await sample(page, FRONT_DOOR[0].id),
      "reduced motion holds the workspace's surface on one frame too",
    ).toBe(surface);

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("every configuration's page", () => {
  test("every configuration is a real file with its own description, and an off-row page is a workspace of its own with the rail as its way on", async ({
    page,
    request,
  }) => {
    const consoleErrors = collectErrors(page);
    const descriptions = new Map<string, string>();

    for (const entry of ROUTED) {
      const response = await request.get(`/playground/${entry.id}/`);
      expect(response.status(), `/playground/${entry.id}/ is served`).toBe(200);
      const body = await response.text();
      const match = /<meta name="description" content="([^"]*)"/.exec(body);
      expect(
        match,
        `/playground/${entry.id}/ carries a description`,
      ).not.toBeNull();
      const description = (match as RegExpExecArray)[1];
      expect(
        description.length,
        `/playground/${entry.id}/'s description is not empty`,
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

    // AN OFF-ROW PAGE IS A WORKSPACE OF ITS OWN. euclid is in the catalog and
    // not in the front-door membership, so its page must be about euclid: one
    // pad, its own name, and the rail carrying it as the current row - first,
    // prepended to the membership it is not part of - so the raised row is
    // never missing (13-09).
    await page.goto("/playground/euclid/");
    await waitForWorkspace(page);
    const soloPads = page.locator('[data-testid^="pad-canvas-"]');
    await expect(soloPads, "a workspace shows one pad").toHaveCount(1);
    await expect(page.getByTestId("pad-canvas-euclid")).toBeVisible();
    await expect(page.getByTestId("workspace-name")).toHaveText("EUCLID");
    const rail = page.getByTestId("shell-rail");
    await expect(rail.locator('[data-row="euclid"]')).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      rail.locator("[data-row]"),
      "the off-row entry joins the front-door membership in the rail",
    ).toHaveCount(FRONT_DOOR.length + 1);

    // AND A MEMBER'S PAGE, so the prepend above is proved to be conditional:
    // aurora is the membership's first row, current, with nothing prepended,
    // and the rail is the site's way to every other member.
    await page.goto("/playground/aurora/");
    await waitForWorkspace(page);
    await expect(page.getByTestId("pad-canvas-aurora")).toBeVisible();
    await expect(
      rail.locator("[data-row]"),
      "a member's rail is the membership, no more",
    ).toHaveCount(FRONT_DOOR.length);
    await expect(rail.locator('[data-row="aurora"]')).toHaveAttribute(
      "aria-current",
      "page",
    );
    for (const entry of FRONT_DOOR) {
      await expect(rail.locator(`[data-row="${entry.id}"]`)).toHaveAttribute(
        "href",
        `/playground/${entry.id}`,
      );
    }

    // And an address nobody has heard of is still not a dead end: the static
    // host serves the fallback with a 404, the client router matches /playground/[id],
    // and the page comes up with the rail as the way on and a line saying so.
    // Since D-07 every catalog id resolves, so the unknown id is a genuinely
    // unknown one rather than a deliberately excluded entry.
    const unknown = "no-such-configuration";
    const missing = await request.get(`/playground/${unknown}/`);
    expect(
      missing.status(),
      `/playground/${unknown}/ is not a page and the static host says so`,
    ).toBe(404);

    await page.goto(`/playground/${unknown}/`);
    await waitForWorkspace(page);
    await expect(page.getByTestId("fidelity-notice")).toHaveText(
      "Never heard of that one. Pick a configuration from the list.",
    );
    await expect(
      rail.locator("[data-row]"),
      "the rail is the way on from an unknown address",
    ).toHaveCount(FRONT_DOOR.length);

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
