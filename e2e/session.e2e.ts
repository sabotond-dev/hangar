// CONN-01, CONN-02, CONN-04, CONN-05, CONN-06, DEGR-02 and SAFE-01: the
// device session in the browsers that produce its states.
//
// Nine tests, all against the session probe route, which renders the
// session's fields as plain text and nothing else (its header says why). Four
// are the capability and refusal half (plan 06-06): what a browser refuses.
// Five are the cable's half (plan 06-07): what a browser does when a module is
// really there - the granted-port offer, the busy port, the unplug, the replug
// and a whole visit that writes nothing. One title ends with the @webkit tag
// and runs on the phone project too - the unsupported branch, because that is
// the engine that can never install and the path most visitors on it will hit
// - so this file adds TEN to the suite total: nine titles on chromium, one of
// them again on webkit-phone. None of the five cable tests is tagged: WebKit
// has no navigator.serial at all, and its degrade path is the tagged test.
//
// THE FAKE SERIAL. Web Serial has no CDP domain and no fake-device hook, but
// `serial` is a configurable accessor on Navigator.prototype, so
// e2e/fake-serial.ts defines a scripted one there before any page script
// runs. Eight of the nine tests install it; the unsupported test deliberately
// does NOT, and deletes the real slot instead, so that branch is rendered by
// a browser that genuinely has none.
//
// IDENTIFICATION RUNS ON REAL CAPTURED BYTES. The rx chunks come out of the
// committed hardware capture - a ZONA RevH on firmware 1.5.5, active page 3,
// recorded by the Phase 2 skeleton run - read in Node at module scope and
// pushed into the fake port one chunk at a time, in order, until the session
// reads `connected`. A hand-written heartbeat would test the test. The
// firmware and the page the readout is asserted against come from the same
// file's identity block, never from a literal here.
//
// THE REPLUG ASSERTS AGAINST THE NEW OBJECT. `replug()` mints a fresh port,
// as Chromium does (06-RESEARCH.md, The Replug Identity Trap), and the
// assertion that matters is that the following click opens THAT port - its
// open count goes to one while the dead port's stays where it was - with zero
// requestPort() calls. A session holding the pre-unplug object would either
// ask for the picker again or fail to open, and both are visible here.
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
// NEVER WRITES. The shim counts chunks written to any fake port, and every
// test that installs it ends by asserting that number is zero. The whole-visit
// test is SAFE-01 as a number over a visitor journey, and 06-07-SUMMARY.md
// records the one time that counter was made to report a non-zero number on
// purpose, before it was trusted.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import {
  CONNECT_LABEL,
  PERMISSION_DECLINED,
  firmwareText,
} from "../src/lib/device/session-copy";
import { failureCopy } from "../src/lib/transport/transport";
import { FAKE_SERIAL } from "./fake-serial";

const PROBE = "/dev/session/";

/** The failure titles, from the module that owns them, never a literal. */
const UNSUPPORTED = failureCopy("no-web-serial", undefined, CONNECT_LABEL);
const INSECURE = failureCopy("insecure-context", undefined, CONNECT_LABEL);
const CANCELLED = failureCopy("cancelled", undefined, CONNECT_LABEL);
const PORT_BUSY = failureCopy("port-busy", undefined, CONNECT_LABEL);

/**
 * The browser's own sentence for a held port (serial_port.cc, identical on
 * all three desktop platforms). CONN-04 exists to replace it, so the busy test
 * asserts it is NOT on the page. The shim raises it; the page must not echo it.
 */
const BROWSER_BUSY_SENTENCE = "Failed to open serial port.";

/**
 * The hardware capture, read in Node, filtered exactly as
 * FakeTransport.fromCapture filters it: rx chunks only, in recorded order.
 */
const capture = JSON.parse(
  readFileSync(
    "src/lib/transport/fixtures/zona-hardware-a-hb-on-pace-0.json",
    "utf8",
  ),
) as {
  identity: {
    firmware: { major: number; minor: number; patch: number };
    activePage: number;
  };
  events: { dir: string; kind: string; hex: string }[];
};
const RX: number[][] = capture.events
  .filter((e) => e.dir === "rx" && e.kind === "chunk")
  .map((e) => [...Buffer.from(e.hex, "hex")]);

/** What the readout must carry once identified: the capture's own values. */
const CAPTURED_FIRMWARE = `fw ${firmwareText(capture.identity.firmware)}`;
const CAPTURED_PAGE = `page ${capture.identity.activePage}`;

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

const identity = (page: Page) => page.getByTestId("session-identity");

const writes = (page: Page) =>
  page.evaluate(() => window.__hangarSerial.writes());
const requests = (page: Page) =>
  page.evaluate(() => window.__hangarSerial.requests());
const openCount = (page: Page, i: number) =>
  page.evaluate((index) => window.__hangarSerial.openCount(index), i);

/**
 * Grant a ZONA BEFORE the page loads. An init script added after the shim's
 * runs after it on every navigation, so by the time the session's start()
 * asks getPorts() the granted, attached module is already in the list - the
 * returning visitor whose permission survived a browser restart.
 */
const grantBeforeLoad = (page: Page) =>
  page.addInitScript(() => {
    window.__hangarSerial.grant();
  });

/**
 * Feed the capture into port `index`, one chunk at a time and in order, until
 * the session reads `connected`; return how many chunks that took. After each
 * chunk the page is polled for up to one heartbeat period (the module beats
 * at 4 Hz), so the count is the first chunk that COMPLETED identification and
 * never a later one that merely arrived before the poll noticed.
 *
 * Throws if the whole capture goes in without identification - a test that
 * fed 119 chunks and asserted nothing would pass for the wrong reason.
 */
async function identifyWith(page: Page, index: number): Promise<number> {
  let fed = 0;
  for (const chunk of RX) {
    await page.evaluate(([i, bytes]) => window.__hangarSerial.feed(i, bytes), [
      index,
      chunk,
    ] as const);
    fed += 1;
    const connected = await page.evaluate(async () => {
      const read = () =>
        document.querySelector('[data-testid="session-phase"]')?.textContent;
      for (let waited = 0; waited < 250; waited += 10) {
        if (read() === "connected") return true;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      return read() === "connected";
    });
    if (connected) return fed;
  }
  throw new Error(
    `identification did not complete after all ${fed} rx chunks of the capture`,
  );
}

/**
 * The road every cable test starts on: a granted ZONA, the offer on load, one
 * click, the capture, `connected`. Asserts each step, and returns the chunk
 * count identification needed so the test that cares can record it.
 */
async function connectGranted(page: Page): Promise<number> {
  await expect(phase(page)).toHaveText("detected");
  await page.getByTestId("session-connect").click();
  const fed = await identifyWith(page, 0);
  await expect(phase(page)).toHaveText("connected");
  return fed;
}

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

test.describe("the session with a granted ZONA on the cable", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(FAKE_SERIAL);
  });

  test("a granted ZONA is offered on load and one click connects it with no picker", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    // Granted BEFORE the page loads, so getPorts() finds it on load - the
    // returning visitor whose permission survived (CONN-06's silent half).
    await grantBeforeLoad(page);
    await page.goto(PROBE);

    // Precondition: the shim is installed and the grant is what the browser
    // would list, so the offer has something to find.
    expect(
      await page.evaluate(async () => ({
        hasSerial: "serial" in navigator,
        listed: (await navigator.serial.getPorts()).length,
      })),
    ).toEqual({ hasSerial: true, listed: 1 });

    // The offer: `detected`, and the port was NEVER opened to get there. D-06
    // and SAFE-01's spirit in one number - a page that opened a port on load
    // would take the module away from Grid Editor with no click.
    await expect(phase(page)).toHaveText("detected");
    expect(await openCount(page, 0)).toBe(0);
    await expect(identity(page)).toHaveText("none");
    await expect(page.getByTestId("session-can-forget")).toHaveText("true");

    // One click, the captured bytes, `connected`.
    await page.getByTestId("session-connect").click();
    const fed = await identifyWith(page, 0);
    await expect(phase(page)).toHaveText("connected");
    console.log(`identification needed ${fed} of ${RX.length} rx chunks`);
    expect(fed).toBeGreaterThan(0);
    expect(fed).toBeLessThan(RX.length);

    // The readout carries the capture's own firmware and active page, and
    // this is a single module, so there is no rig tail.
    const line = await identity(page).innerText();
    expect(line).toContain("ZONA");
    expect(line).toContain(CAPTURED_FIRMWARE);
    expect(line).toContain(CAPTURED_PAGE);
    expect(line).toContain("others none");
    await expect(title(page)).toHaveText("none");

    // No picker was involved at any point, and the click opened it once.
    expect(await requests(page)).toBe(0);
    expect(await openCount(page, 0)).toBe(1);

    expect(await writes(page)).toBe(0);
    await expect(page.getByTestId("session-writes")).toHaveText("0");
    expect(consoleErrors).toEqual([]);
  });

  test("a port held by another program names Grid Editor and gives the recovery in order", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await page.goto(PROBE);

    // Precondition: nothing granted at load, so the session rests at `idle`
    // and the click below goes through the chooser rather than the offer.
    expect(await page.evaluate(() => "serial" in navigator)).toBe(true);
    await expect(phase(page)).toHaveText("idle");

    // A ZONA appears in the picker, but its port is held - Grid Editor's tray
    // process is the usual holder - so open() raises the browser's NetworkError.
    await page.evaluate(() => {
      const s = window.__hangarSerial;
      const i = s.grant();
      s.busy(i);
      s.pick(i);
    });
    await page.getByTestId("session-connect").click();

    await expect(phase(page)).toHaveText("port-busy");
    await expect(title(page)).toHaveText(PORT_BUSY.title);
    await expect(detail(page)).toHaveText(PORT_BUSY.detail);

    // CONN-04: the block names Grid Editor and the tray icon, and the six
    // steps appear IN ORDER - the tray-icon quit first, the click last.
    expect(PORT_BUSY.detail).toContain("Grid Editor");
    const listed = steps(page).locator("li");
    await expect(listed).toHaveCount(6);
    await expect(listed).toHaveText(PORT_BUSY.steps);
    expect(PORT_BUSY.steps[0]).toContain("Grid Editor");
    expect(PORT_BUSY.steps[0]).toContain("tray icon");
    expect(PORT_BUSY.steps[5]).toBe(`Click ${CONNECT_LABEL} again`);

    // The browser's own sentence never reaches the screen. The shim raised
    // it; failureRaw holds it; only the `unknown` row would render it.
    expect(await page.locator("body").innerText()).not.toContain(
      BROWSER_BUSY_SENTENCE,
    );

    // The picker was asked once, the open was attempted once and refused.
    expect(await requests(page)).toBe(1);
    expect(await openCount(page, 0)).toBe(1);

    expect(await writes(page)).toBe(0);
    expect(consoleErrors).toEqual([]);
  });

  test("unplugging changes the page immediately, with no click", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await grantBeforeLoad(page);
    await page.goto(PROBE);

    // Precondition: a live, identified session on the granted port.
    await connectGranted(page);
    const line = await identity(page).innerText();
    expect(line).toContain(CAPTURED_FIRMWARE);

    // The cable comes out. No click, no navigation, no failed write in
    // between: the `disconnect` event alone moves the page, in the same turn.
    await page.evaluate(() => window.__hangarSerial.unplug(0));

    await expect(phase(page)).toHaveText("unplugged-while-connected");
    await expect(identity(page)).toHaveText("none");
    // S5 is one sentence, not a failure block: no title, no steps.
    await expect(title(page)).toHaveText("none");
    await expect(steps(page)).toHaveText("none");
    expect(await detail(page).innerText()).toContain("Nothing was written");
    // The dead port stays adopted so the revoke control can still act on it.
    await expect(page.getByTestId("session-can-forget")).toHaveText("true");

    expect(await requests(page)).toBe(0);
    expect(await writes(page)).toBe(0);
    expect(consoleErrors).toEqual([]);
  });
});
