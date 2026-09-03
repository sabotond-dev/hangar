// FOUND-01: the half of /dev/skeleton/ that needs no hardware.
//
// Web Serial is an operating-system capability, so the connect path can only
// ever be verified by a person with a ZONA on the desk (plan 04). What CAN be
// automated is the branch a large share of visitors will actually hit - the
// browser with no Web Serial at all - and the fact that the route is a real
// prerendered file served by the Worker out of build/.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { expect, test } from "@playwright/test";

test.describe("the walking skeleton page with no Web Serial", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      // serial is an accessor on Navigator.prototype - deleting it off the
      // instance returns true and removes nothing. (e2e/smoke.e2e.ts)
      delete (Navigator.prototype as unknown as Record<string, unknown>).serial;
    });
  });

  test("the page explains itself when the browser has no Web Serial", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      // The protocol package logs HEARTBEAT_INTERVAL at module scope and the
      // decoder logs every rejected frame, both as console.log. An unfiltered
      // assertion would be permanently red for reasons that are not errors.
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    // trailingSlash: "always" (src/routes/+layout.ts). Without the trailing
    // slash the static build 404s and it reads as a broken route rather than
    // as a URL typo.
    await page.goto("/dev/skeleton/");

    // Precondition, asserted. A degrade test that does not verify its own
    // precondition passes for the wrong reason.
    expect(await page.evaluate(() => "serial" in navigator)).toBe(false);

    // Waited on BEFORE the count below: the panel appearing is what proves the
    // page has hydrated, and a count taken against an unhydrated document
    // would be zero for the wrong reason.
    const degrade = page.getByTestId("skeleton-degrade");
    await expect(degrade).toBeVisible();
    expect(
      await page.getByTestId("skeleton-connect").count(),
      "the connect control is absent, not merely disabled",
    ).toBe(0);

    const copy = await degrade.innerText();
    for (const engine of ["Chrome", "Edge", "Firefox 151"]) {
      expect(copy, `the copy names ${engine}`).toContain(engine);
    }
    // CONN-01 is a capability test, never a browser test, and no visitor-facing
    // string names an engine.
    expect(await page.locator("body").innerText()).not.toContain("Chromium");

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("the walking skeleton route on the built site", () => {
  test("the skeleton route is served as a real file from the built site", async ({
    page,
  }) => {
    // trailingSlash: "always" (src/routes/+layout.ts). Without the trailing
    // slash the static build 404s and it reads as a broken route rather than
    // as a URL typo.
    await page.goto("/dev/skeleton/");
    await expect(page.getByTestId("skeleton-status")).toBeVisible();
    await expect(
      page.getByText("Keep this tab in front for the whole run", {
        exact: false,
      }),
    ).toBeVisible();
  });
});
