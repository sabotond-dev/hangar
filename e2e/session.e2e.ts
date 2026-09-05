// CONN-01, CONN-02, CONN-05 and DEGR-02: the capability and refusal halves of
// the device session, in the browsers that produce them.
//
// Four tests, all against the session probe route, which renders the
// session's fields as plain text and nothing else (its header says why). One
// title ends with the @webkit tag and runs on the phone project too - the
// unsupported branch, because that is the engine that can never install and
// the path most visitors on it will hit - so this file adds FIVE to the suite
// total: four titles on chromium, one of them again on webkit-phone.
//
// THE FAKE SERIAL. Web Serial has no CDP domain and no fake-device hook, but
// `serial` is a configurable accessor on Navigator.prototype, so
// e2e/fake-serial.ts defines a scripted one there before any page script
// runs. Three of the four tests install it; the unsupported test deliberately
// does NOT, and deletes the real slot instead, so that branch is rendered by
// a browser that genuinely has none.
//
// THE INSECURE BRANCH. `navigator.serial` is [SecureContext] in every engine
// that ships it, so an insecure page has no serial property at all and lands
// in `unsupported` - which is why, until this file, the `insecure` sentence
// had only ever been rendered by a node test. Shadowing the global getter
// with an own `isSecureContext` on window, while leaving `navigator.serial`
// in place, is what reaches it in a real browser (06-RESEARCH.md, Code
// Example 5). Test 3 is the first time it has rendered in one in this
// project.
//
// EVERY TEST ASSERTS ITS OWN PRECONDITION FIRST. A degrade test that does not
// verify its precondition passes for the wrong reason (e2e/skeleton.e2e.ts).
//
// NEVER WRITES. The shim counts chunks written to any fake port, and the
// tests that install it assert that number is zero at the end.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { expect, test, type Page } from "@playwright/test";
import {
  CONNECT_LABEL,
  PERMISSION_DECLINED,
} from "../src/lib/device/session-copy";
import { failureCopy } from "../src/lib/transport/transport";
import { FAKE_SERIAL } from "./fake-serial";

const PROBE = "/dev/session/";

/** The two capability titles, from the module that owns them, never a literal. */
const UNSUPPORTED = failureCopy("no-web-serial", undefined, CONNECT_LABEL);
const INSECURE = failureCopy("insecure-context", undefined, CONNECT_LABEL);
const CANCELLED = failureCopy("cancelled", undefined, CONNECT_LABEL);

/**
 * Only error-level messages are collected: the protocol package logs at
 * console.log from module scope and the decoder logs every rejected frame.
 * (e2e/first-experience.e2e.ts)
 */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

const phase = (page: Page) => page.getByTestId("session-phase");
const title = (page: Page) => page.getByTestId("session-failure-title");
const detail = (page: Page) => page.getByTestId("session-failure-detail");
const steps = (page: Page) => page.getByTestId("session-failure-steps");

const writes = (page: Page) =>
  page.evaluate(() => window.__hangarSerial.writes());

test.describe("the session with a scripted serial and nothing granted", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(FAKE_SERIAL);
  });

  test("a granted-free browser rests at NO ZONA and writes nothing", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await page.goto(PROBE);

    // Precondition: the shim is installed, so this browser HAS Web Serial.
    expect(await page.evaluate(() => "serial" in navigator)).toBe(true);

    // start() asks getPorts(), which returns nothing, so the session rests at
    // `idle` - the phase behind the NO ZONA slot - with no failure at all.
    await expect(phase(page)).toHaveText("idle");
    await expect(title(page)).toHaveText("none");
    await expect(detail(page)).toHaveText("none");
    await expect(steps(page)).toHaveText("none");
    await expect(page.getByTestId("session-identity")).toHaveText("none");

    expect(await writes(page)).toBe(0);
    await expect(page.getByTestId("session-writes")).toHaveText("0");
    expect(consoleErrors).toEqual([]);
  });

  test("a cancelled chooser is its own state, and a declined permission adds one sentence", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await page.goto(PROBE);
    expect(await page.evaluate(() => "serial" in navigator)).toBe(true);
    await expect(phase(page)).toHaveText("idle");

    // The next requestPort() rejects with the default NotFoundError - the
    // closed chooser, the empty chooser and the blocked one, which the API
    // does not tell apart (D-12).
    await page.evaluate(() => window.__hangarSerial.reject());
    await page.getByTestId("session-connect").click();

    await expect(phase(page)).toHaveText("cancelled");
    await expect(title(page)).toHaveText(CANCELLED.title);
    expect(CANCELLED.title).toBe("You closed the chooser");
    await expect(detail(page)).toHaveText(CANCELLED.detail);
    // One step, and it names the header's control, not the panel's.
    const listed = steps(page).locator("li");
    await expect(listed).toHaveCount(1);
    await expect(listed.first()).toHaveText(CANCELLED.steps[0]);
    expect(CANCELLED.steps[0]).toContain(CONNECT_LABEL);
    await expect(page.getByTestId("session-permission-declined")).toHaveText(
      "none",
    );

    // A declined permission prompt is a closed chooser by another route:
    // still `cancelled`, plus one sentence (Y-06), and not a tenth state.
    await page.evaluate(() =>
      window.__hangarSerial.reject(
        "NotAllowedError",
        "Failed to execute 'requestPort' on 'Serial': Must be handling a user gesture to show a permission request.",
      ),
    );
    await page.getByTestId("session-connect").click();

    await expect(phase(page)).toHaveText("cancelled");
    await expect(title(page)).toHaveText(CANCELLED.title);
    await expect(page.getByTestId("session-permission-declined")).toHaveText(
      PERMISSION_DECLINED,
    );

    expect(await writes(page)).toBe(0);
    expect(consoleErrors).toEqual([]);
  });
});

test.describe("the session on a browser with no Web Serial", () => {
  test.beforeEach(async ({ context }) => {
    // NO shim. The real slot is deleted from the prototype - on an engine
    // that never had one the delete is a no-op that returns true - so this
    // branch is rendered by a browser that genuinely has none.
    await context.addInitScript(() => {
      delete (Navigator.prototype as unknown as Record<string, unknown>).serial;
    });
  });

  test("a browser with no Web Serial names the browsers that do @webkit", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await page.goto(PROBE);

    // Precondition, asserted.
    expect(await page.evaluate(() => "serial" in navigator)).toBe(false);

    await expect(phase(page)).toHaveText("unsupported");
    await expect(title(page)).toHaveText(UNSUPPORTED.title);
    await expect(detail(page)).toHaveText(UNSUPPORTED.detail);

    // CONN-02: the message names the browsers that work, and never an engine.
    const reason = await detail(page).innerText();
    for (const named of ["Chrome", "Edge", "Firefox 151"]) {
      expect(reason, `the detail names ${named}`).toContain(named);
    }
    expect(await page.locator("body").innerText()).not.toContain("Chromium");

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("the session in an insecure context", () => {
  test.beforeEach(async ({ context }) => {
    // The shim keeps `navigator.serial` in place; the own property on window
    // shadows the global's isSecureContext getter, and that is the whole
    // trick (06-RESEARCH.md, Code Example 5).
    await context.addInitScript(FAKE_SERIAL);
    await context.addInitScript(() => {
      Object.defineProperty(window, "isSecureContext", {
        configurable: true,
        value: false,
      });
    });
  });

  test("an insecure context is a different message from an unsupported browser", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await page.goto(PROBE);

    // Precondition: serial present, context insecure - the one combination
    // no shipping browser produces on its own.
    expect(
      await page.evaluate(() => ({
        hasSerial: "serial" in navigator,
        secure: isSecureContext,
      })),
    ).toEqual({ hasSerial: true, secure: false });

    await expect(phase(page)).toHaveText("insecure");
    await expect(title(page)).toHaveText(INSECURE.title);
    await expect(detail(page)).toHaveText(INSECURE.detail);

    // Two conditions, two messages (D-03): the title differs from the
    // unsupported one, and this one names HTTPS as the fix.
    expect(INSECURE.title).not.toBe(UNSUPPORTED.title);
    expect(await title(page).innerText()).toContain("HTTPS");
    expect(await page.locator("body").innerText()).not.toContain("Chromium");

    expect(await writes(page)).toBe(0);
    expect(consoleErrors).toEqual([]);
  });
});
