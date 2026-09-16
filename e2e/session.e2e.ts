// CONN-01, CONN-02, CONN-04, CONN-05, CONN-06, CONN-07, DEGR-02 and SAFE-01:
// the device session in the browsers that produce its states.
//
// Fourteen tests. Nine are against the session probe route, which renders the
// session's fields as plain text and nothing else (its header says why): four
// are the capability and refusal half (plan 06-06), what a browser refuses,
// and five are the cable's half (plan 06-07), what a browser does when a
// module is really there - the granted-port offer, the busy port, the unplug,
// the replug and a whole visit that writes nothing. The remaining five (plan
// 06-13) are the same machine on the SHIPPED CHROME - the header slot, its
// disclosure, the header note, the chosen panel and the three live regions -
// on the routes a visitor actually opens. Two titles carry the @webkit tag and
// run on the phone project too, both the unsupported branch (the probe's and
// the header's), because that is the engine that can never install and the
// path most visitors on it will hit - so this file adds SIXTEEN to the suite
// total: fourteen titles on chromium, two of them again on webkit-phone. No
// cable test is tagged: that engine has no navigator.serial at all, and its
// degrade path is the tagged pair.
//
// THE SHIPPED-CHROME TESTS WAIT ON STATE, NEVER ON PROSE ALONE. The slot
// publishes its state as data-slot and its hydration as data-hydrated (set only
// from onMount, so the prerendered file cannot carry it); the tests below wait
// on those, and read the words only once the state they belong to is current.
// A bare text match can be satisfied by a stale phase (Phase 5 recorded that
// lesson against the meters) and by the prerendered document itself, which
// already ships a slot and a note.
//
// THE WALK IS A CLIENT-ROUTER WALK. Test 11 crosses / -> /playground/ -> /playground/{id}/
// -> /playground/ -> / by CLICKING the site's own links, never by goto. D-05's
// claim is that one connection survives a move between routes because Kit's
// client router keeps the module graph - and the open port - alive; a goto is
// a fresh document and would prove the opposite of what the test is named for.
// The document is stamped before the walk and read after it, so a stray
// rel="external" or a window.location assignment anywhere on the path is a red
// test rather than a quiet reconnect. Then the test does the thing that must
// NOT work - a reload - and asserts the session comes back as an OFFER, not a
// connection: the port died with the document and the grant did not, which is
// exactly what getPorts() is for.
//
// THE FAKE SERIAL. Web Serial has no CDP domain and no fake-device hook, but
// `serial` is a configurable accessor on Navigator.prototype, so
// e2e/fake-serial.ts defines a scripted one there before any page script
// runs. Twelve of the fourteen tests install it; the two unsupported tests
// deliberately do NOT, and delete the real slot instead, so that branch is
// rendered by a browser that genuinely has none.
//
// THE DEGRADE TEST ON THE HEADER ASSERTS IN ONE ORDER, AND THE ORDER IS THE
// TEST. slotStateOf("starting") is S1, so the prerendered document ALREADY
// ships a rendered slot and a rendered 152px note: "the slot is present" is
// satisfied by markup that has run no JavaScript, and a device-note count of 0
// taken early is 0 for reasons that have nothing to do with capability. The
// test therefore waits for data-hydrated="true" - the only assertion in the
// list a prerendered document is structurally incapable of passing - and then
// for the caption to settle at its unsupported sentence, which is the only one
// that proves the capability branch, and ONLY THEN asserts the note's absence
// and the panel's reason. 06-13-SUMMARY.md records the run in which those two
// waits were deleted and the count-0 assertion passed anyway against a
// document whose app chunk was being held back: a false green, which is what
// the order exists to prevent.
//
// ONE VOICE. Three live regions exist on this site - the session's, the
// tuning region's and the browse toolbar's - with disjoint trigger sets
// (D-17). Test 14 records every text change in each of them across a session
// transition and then across a tuning command, and asserts each moment moved
// exactly one region. It also asserts that exactly one [aria-live] element on
// the page carries the session region's current sentence and that no second
// one carries the identity sentence: the panel's connect-status used to be
// polite too, and with it two regions said one thing. Since plan 07-08 the
// current sentence after a connect is the install store's snapshot line, not
// the session's connected one - see the last paragraph of this header.
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
// NEVER WRITES, COUNTED BY CLASS SINCE PHASE 7. The shim counts chunks written
// to any fake port, and every test that never connects still ends by
// asserting that number is zero. Since plan 07-08 the root layout starts the
// install store beside the session, and the store takes its snapshot the
// moment a session is connected (07-CONTEXT D-03): one SERIALNUMBER/FETCH and
// two CONFIG/FETCH leave the page with no click beyond CONNECT, and every one
// of them is a READ. So the cable tests give the page a module that answers -
// e2e/fake-zona.ts, the node suite's own zonaResponder exposed into the page,
// with a state taken from the capture's identity block - and end by asserting
// SAFE-01 the way Phase 7 states it: zero CONFIG/EXECUTE, zero
// PAGESTORE/EXECUTE and zero HEARTBEAT/EXECUTE on the wire, with every chunk
// the shim counted accounted for as one of the snapshot's fetches. Without the
// responder those fetches would retry into a timeout and the store would speak
// `Nothing to put back yet.` into the one live region two and a half seconds
// after connect - a true sentence about a silent module, and the wrong module
// for tests whose premise is a ZONA on the cable. 06-07-SUMMARY.md records the
// one time the chunk counter was made to report a non-zero number on purpose,
// before it was trusted; 07-08-SUMMARY.md records the run in which these seven
// tests went red the moment the layout started the store.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import {
  CAPTION_DETECTED,
  CAPTION_FAILED,
  CONNECTED_LABEL,
  CAPTION_UNSUPPORTED,
  CONNECTING_LABEL,
  CONNECT_LABEL,
  DISCONNECT_LABEL,
  FORGET_LABEL,
  LIVE_DETECTED,
  PERMISSION_DECLINED,
  firmwareText,
  identityDescription,
  identitySentence,
  liveConnected,
} from "../src/lib/device/session-copy";
import {
  CLEAR_REASONS,
  liveSnapshotSaved,
} from "../src/lib/device/install-copy";
import { EVENT_SETUP, EVENT_TIMER } from "../src/lib/protocol";
import { failureCopy } from "../src/lib/transport/transport";
import { FAKE_SERIAL } from "./fake-serial";
import { type ExposedZona, installZona } from "./fake-zona";

declare global {
  interface Window {
    /** Test 11's stamp on the document that connected; a fresh document has none. */
    __hangarWalk?: string;
    /** Test 14's record of every text change in each live region, by testid. */
    __hangarLiveLog?: Record<string, string[]>;
  }
}

const PROBE = "/dev/session/";

/**
 * The configuration the shipped-chrome tests open. It is the front door's
 * opening centre, so /playground/aurora/ lands with no splash on the same row / shows,
 * and its first rail is the one e2e/tuning.e2e.ts turns.
 */
const ENTRY = "aurora";

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
    sx: number;
    sy: number;
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
 * The module that answers the install store's snapshot once the session is
 * connected (Phase 7, plan 07-08): the capture's own address and active page,
 * two short printable strings for the store to read, and a serial so the
 * snapshot is durable. Called BEFORE goto, like the grant.
 */
const answering = (page: Page): Promise<ExposedZona> =>
  installZona(page, {
    sx: capture.identity.sx,
    sy: capture.identity.sy,
    activePage: capture.identity.activePage,
    configs: {
      [EVENT_SETUP]: "--[[@cb]]print(1)",
      [EVENT_TIMER]: "--[[@cb]]print(2)",
    },
    serial: [0x9abcdef0, 0x12345678, 0, 0],
  });

/**
 * SAFE-01 by class, over however many connects the test made: not one
 * EXECUTE of any class left the page, and every chunk the shim counted was
 * one of the snapshot's reads - one serial fetch, four config fetches
 * (12.1-08; three before) and, since 13-12, one page-count fetch per connect
 * (the destination control's
 * enumeration; Bible section 9). "Any class" gained two since 13-12 too: the
 * page switch and the page discard are writes for this purpose (13-CONTEXT
 * D-06, first clause), and the list below is extended, never excepted.
 *
 * THE WAIT COMES FIRST, AND IT IS ON A SIGNAL THAT IMPLIES COMPLETION.
 *
 * This function used to assert exact totals with no wait at all, on the
 * strength of `session-phase` reading `connected` at its call sites. That
 * signal does not imply what the assertion needs. session.svelte.ts sets
 * `phase = "connected"` and only THEN fires the connection event;
 * install.svelte.ts's #onConnection receives it and calls `void #attach(...)`,
 * fire-and-forget by design; #attach's #snapshot issues one SERIALNUMBER/FETCH
 * and then fetchAll, which sequence.ts runs as THREE awaits IN SERIES rather
 * than a Promise.all. So `connected` in the DOM means FOUR protocol round
 * trips are ABOUT TO START, each a full page-to-Node CDP hop. The observed
 * failure was "expected 4, received 3" at a `connects: 2` call site, in the
 * middle of the fetches on the second connect; re-derived for the third
 * string it would be expected 6, received 5. IT REPRODUCES AT --workers=1
 * TOO, just rarely enough that nobody has seen it; more workers only move the
 * odds.
 *
 * The wait is therefore CAUSAL rather than timing-based: install.svelte.ts
 * publishes `snapshotting` on entering #snapshot and `ready` after the pair has
 * been fetched, guarded and held - so `install-phase` leaving `snapshotting` IS
 * "the snapshot is done". `snapshot-failed` is accepted as an exit too, because
 * the point of the wait is that nothing is still in flight; the counter
 * assertions below then say whether what happened was reads.
 *
 * TWO WAITS, BECAUSE THREE OF THE SEVEN CALL SITES ARE NOT ON THE PROBE.
 * `install-phase` is published by /dev/install/ and - since plan 11-08.1 - by
 * /dev/session/. Four call sites load PROBE; the other three load "/" and
 * "/playground/{id}/", where the shipped chrome renders no such row, and a bare
 * `expect(getByTestId("install-phase")).not.toHaveText(...)` PASSES IMMEDIATELY
 * against an element that does not exist. That would have been a vacuous wait
 * on exactly the sites nobody was watching, so:
 *
 *   1. The fetch counters are polled to their totals FIRST, at every call site.
 *      Since 13-12 the PAGE-COUNT fetch is the last chunk #snapshot issues
 *      (after the timer fetch, before `ready`), so PAGECOUNT/FETCH reaching
 *      `connects` IS "the reads are answered"; CONFIG/FETCH at 5 * connects
 *      is polled first for the diagnosis's own message. Neither needs
 *      anything from the page.
 *   2. WHERE the row is published, the store is then required to have LEFT
 *      `snapshotting`. Step 1 makes that sound rather than racy: by then both
 *      awaits inside #snapshot have returned, so the phase is a settled one and
 *      not a pre-snapshot `idle` that would satisfy the negation for free.
 *
 * AND THE ORDER IS THE WHOLE POINT. Wait first, read the safety counters
 * second. A read taken before the wait, with the wait after it, would let a
 * late write slip through unseen - which is the opposite of what this function
 * exists for.
 */
async function onlyReads(
  page: Page,
  zona: ExposedZona,
  connects: number,
): Promise<void> {
  await expect
    .poll(() => zona.seen("CONFIG", "FETCH"), {
      message: `all five config reads - the page timer, the page init, the utility, the Timer and the Setup, in SLOTS order - of all ${connects} snapshot(s) have been answered; the Setup fetch is the last config chunk #snapshot issues`,
      timeout: 30_000,
    })
    .toBe(5 * connects);
  await expect
    .poll(() => zona.seen("PAGECOUNT", "FETCH"), {
      message: `the page count - the LAST chunk #snapshot issues since 13-12 - has been answered once per connect`,
      timeout: 30_000,
    })
    .toBe(connects);
  await expect
    .poll(() => zona.seen("SERIALNUMBER", "FETCH"), {
      message: `the module named itself once per connect`,
      timeout: 30_000,
    })
    .toBe(connects);

  const published = page.getByTestId("install-phase");
  if ((await published.count()) > 0) {
    await expect(
      published,
      "the install store is not still inside #snapshot, so nothing is in flight behind these counters",
    ).not.toHaveText("snapshotting", { timeout: 30_000 });
  }

  expect(zona.seen("CONFIG", "EXECUTE"), "config writes").toBe(0);
  expect(zona.seen("PAGESTORE", "EXECUTE"), "flash stores").toBe(0);
  // 13-12: the page switch and the page discard are writes for this purpose.
  expect(
    zona.seen(["PAGE", "ACTIVE"].join(""), "EXECUTE"),
    "page switches",
  ).toBe(0);
  expect(
    zona.seen(["PAGE", "DISCARD"].join(""), "EXECUTE"),
    "page discards",
  ).toBe(0);
  expect(zona.seen("HEARTBEAT", "EXECUTE"), "host heartbeats").toBe(0);
  expect(zona.seen("SERIALNUMBER", "FETCH")).toBe(connects);
  expect(zona.seen("CONFIG", "FETCH")).toBe(5 * connects);
  expect(zona.seen("PAGECOUNT", "FETCH")).toBe(connects);
  // SIX chunks per connect since 12.1-08 (five since 13-12, four since
  // 12-03, three before) - and this one is a WRITE count, so no grep for
  // `2 *` would have found it. One SERIALNUMBER/FETCH, four CONFIG/FETCH,
  // one PAGECOUNT/FETCH, and every one of them is a read.
  expect(await writes(page), "chunks, every one a read").toBe(7 * connects);
}

/**
 * Where a page publishes "connected": an element, and either an attribute of
 * it or its text, that reads `value` once identification has completed. The
 * probe says it in text; the shipped header says it in the slot's data-slot.
 */
interface ConnectedMark {
  selector: string;
  attribute?: string;
  value: string;
}
const PROBE_CONNECTED: ConnectedMark = {
  selector: '[data-testid="session-phase"]',
  value: "connected",
};
const SLOT_CONNECTED: ConnectedMark = {
  selector: '[data-testid="device-slot"]',
  attribute: "data-slot",
  value: "S4",
};

/**
 * Feed the capture into port `index`, one chunk at a time and in order, until
 * the page reads connected at `mark`; return how many chunks that took. After
 * each chunk the page is polled for up to one heartbeat period (the module
 * beats at 4 Hz), so the count is the first chunk that COMPLETED
 * identification and never a later one that merely arrived before the poll
 * noticed.
 *
 * Throws if the whole capture goes in without identification - a test that
 * fed 119 chunks and asserted nothing would pass for the wrong reason.
 */
async function identifyWith(
  page: Page,
  index: number,
  mark: ConnectedMark = PROBE_CONNECTED,
): Promise<number> {
  let fed = 0;
  for (const chunk of RX) {
    await page.evaluate(([i, bytes]) => window.__hangarSerial.feed(i, bytes), [
      index,
      chunk,
    ] as const);
    fed += 1;
    const connected = await page.evaluate(async (m) => {
      const read = () => {
        const el = document.querySelector(m.selector);
        if (!el) return null;
        return m.attribute ? el.getAttribute(m.attribute) : el.textContent;
      };
      for (let waited = 0; waited < 250; waited += 10) {
        if (read() === m.value) return true;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      return read() === m.value;
    }, mark);
    if (connected) return fed;
  }
  throw new Error(
    `identification did not complete after all ${fed} rx chunks of the capture`,
  );
}

// ---------------------------------------------------------------------------
// The shipped chrome (plan 06-13).

const slot = (page: Page) => page.getByTestId("device-slot");
const slotLabel = (page: Page) => page.getByTestId("device-slot-label");
const slotCaption = (page: Page) => page.getByTestId("device-slot-caption");
const details = (page: Page) => page.getByTestId("device-details");

/**
 * The identity label's words. Its spaces are non-breaking entities by design
 * (06-10: Svelte trims source whitespace at an element boundary), so innerText
 * carries U+00A0 where a substring match expects U+0020; every whitespace run
 * is folded to one plain space before the label is compared to anything.
 */
async function labelWords(page: Page): Promise<string> {
  return (await slotLabel(page).innerText()).replace(/\s+/g, " ").trim();
}

/** The route's pathname, so a redirect or a stray reload shows as a path. */
const pathOf = (page: Page) => new URL(page.url()).pathname;

/**
 * Wait for the shelf to be up. Until 13-07 this also waited for the splash
 * to take itself off /: a click or a key that landed while it was up was
 * swallowed by its window-level skip listener rather than reaching the
 * control (deferred item 8's two records of exactly that race). The splash
 * is gone with the intro (D-09), / no longer renders the shelf, and the
 * three header tests below open on /playground/{id}/, where the shipped header with
 * its device slot lives until 13-09 and 13-11 rebuild it; the splash count
 * stays as a zero that can only be trivially true.
 */
async function waitForFrontDoor(page: Page): Promise<void> {
  await expect(page.getByTestId("splash")).toHaveCount(0, { timeout: 5_000 });
  // The shelf went at 13-09; the workspace is what a configuration's page is.
  await expect(page.getByTestId("workspace")).toBeVisible();
}

/**
 * The road every shipped-chrome cable test starts on: the slot hydrated and
 * offering the granted ZONA (S2), one click ON THE HEADER, the capture, S4.
 * Asserts each step, and that the port was never opened before the click.
 */
async function connectFromHeader(page: Page): Promise<number> {
  const control = slot(page);
  await expect(control).toHaveAttribute("data-hydrated", "true");
  await expect(control).toHaveAttribute("data-slot", "S2");
  expect(await openCount(page, 0)).toBe(0);
  await control.click();
  const fed = await identifyWith(page, 0, SLOT_CONNECTED);
  await expect(control).toHaveAttribute("data-slot", "S4");
  return fed;
}

/**
 * Both numbers settled, then a change measured rather than merely applied -
 * e2e/tuning.e2e.ts's two waits, re-derived: data-busy on the tuning
 * region's root is the region's own published state (the meters' aria-busy,
 * carried there since 13.1-07 hid the meters - 13.1-CONTEXT D-10), and a
 * wait that only asked for a present number comes back instantly with the
 * previous one.
 */
async function settled(page: Page): Promise<void> {
  await expect(
    page.getByTestId("tuning-region"),
    "the region settled on its numbers",
  ).toHaveAttribute("data-busy", "false", { timeout: 30_000 });
  for (const event of ["setup", "timer"] as const) {
    await expect(
      page.getByTestId("tuning-region"),
      `the ${event} number landed`,
    ).toHaveAttribute(`data-${event}`, /^[0-9]+$/);
  }
}
async function recomputed(page: Page): Promise<void> {
  await expect(
    page.getByTestId("tuning-region"),
    "the change went through the debounced recompile",
  ).toHaveAttribute("data-busy", "true", { timeout: 5_000 });
  await settled(page);
}

/** The three live regions' testids, in document order. */
const LIVE_REGIONS = ["session-live", "tuning-live", "browse-live"] as const;

/**
 * Start recording every text change in each live region that exists on the
 * page. A region absent from the route (the browse toolbar's, on /playground/{id}/)
 * gets an empty record and nothing to observe; its absence is itself read by
 * liveTexts below as null.
 */
function recordLiveRegions(page: Page): Promise<void> {
  return page.evaluate((ids) => {
    const log: Record<string, string[]> = {};
    window.__hangarLiveLog = log;
    for (const id of ids) {
      log[id] = [];
      const el = document.querySelector(`[data-testid="${id}"]`);
      if (!el) continue;
      new MutationObserver(() => {
        log[id].push((el.textContent ?? "").trim());
      }).observe(el, { subtree: true, childList: true, characterData: true });
    }
  }, LIVE_REGIONS);
}

/** Each region's current text (null where the route has no such region) and the record so far. */
function liveTexts(page: Page): Promise<{
  session: string | null;
  tuning: string | null;
  browse: string | null;
  log: Record<string, string[]>;
}> {
  return page.evaluate((ids) => {
    const read = (id: string): string | null => {
      const el = document.querySelector(`[data-testid="${id}"]`);
      return el ? (el.textContent ?? "").trim() : null;
    };
    return {
      session: read(ids[0]),
      tuning: read(ids[1]),
      browse: read(ids[2]),
      log: window.__hangarLiveLog ?? {},
    };
  }, LIVE_REGIONS);
}

/** The distinct utterances a region made: its recorded texts with the empties dropped. */
const utterances = (recorded: string[] | undefined): string[] =>
  (recorded ?? []).filter((text) => text !== "");

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
    const zona = await answering(page);
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

    // The snapshot's five reads (four until 13-17, three until 12.1-08) and
    // nothing else.
    await onlyReads(page, zona, 1);

    // THE READOUT IS THE SHIM'S OWN COUNT, AS AN EQUALITY. It used to be two
    // lines - `>= 0` and `<= await writes(page)` - and they measured nothing.
    // The first is vacuous over a count. The second asserted 0 <= shown <= 3
    // and would have passed with the readout wired to a constant zero, which
    // was not a hypothetical: the probe's $effect re-read the shim only on
    // `session.phase` and `session.identity`, and every write it is about
    // happens after the last such change, so it was STRUCTURALLY guaranteed to
    // be read too early. Somebody hit the race that fails inside onlyReads,
    // understood it, and weakened this assertion instead of waiting for the
    // event. The $effect now also depends on `install.phase`, which publishes
    // `ready` after all four round trips, so the pair collapses into the one
    // thing it was always trying to say.
    const shown = Number(await page.getByTestId("session-writes").innerText());
    expect(shown, "the readout is the shim's own count").toBe(
      await writes(page),
    );
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

    // CONN-04: the block names Grid Editor and the tray icon, and the seven
    // steps appear IN ORDER - the other HANGAR tab first (batch row I.3.12,
    // landed by 13-20 under D-23), the tray-icon quit second, the click last.
    expect(PORT_BUSY.detail).toContain("Grid Editor");
    expect(PORT_BUSY.detail).toContain("HANGAR tab");
    const listed = steps(page).locator("li");
    await expect(listed).toHaveCount(7);
    await expect(listed).toHaveText(PORT_BUSY.steps);
    expect(PORT_BUSY.steps[0]).toContain("HANGAR tab");
    expect(PORT_BUSY.steps[1]).toContain("Grid Editor");
    expect(PORT_BUSY.steps[1]).toContain("tray icon");
    expect(PORT_BUSY.steps[6]).toBe(`Click ${CONNECT_LABEL} again`);

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
    const zona = await answering(page);
    await grantBeforeLoad(page);
    await page.goto(PROBE);

    // Precondition: a live, identified session on the granted port.
    await connectGranted(page);
    const line = await identity(page).innerText();
    expect(line).toContain(CAPTURED_FIRMWARE);
    // And the snapshot landed (13-12): onlyReads() at the end of this test
    // counts one whole snapshot's reads, which `connected` does not imply -
    // the same causal wait the two tests below carry, for the same reason.
    await expect(page.getByTestId("install-phase")).toHaveText("ready", {
      timeout: 30_000,
    });

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
    await onlyReads(page, zona, 1);
    expect(consoleErrors).toEqual([]);
  });

  test("replugging offers the connection back, and the offer opens the new port", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    const zona = await answering(page);
    await grantBeforeLoad(page);
    await page.goto(PROBE);

    // Precondition: a live session, then the cable out - S5, on port 0.
    await connectGranted(page);
    // THE SNAPSHOT MUST HAVE LANDED BEFORE THE CABLE COMES OUT (13-12). This
    // test asserts "two connects, two snapshots" at its end through
    // onlyReads(), whose totals assume each snapshot ran to its last chunk.
    // `connected` does not imply that (onlyReads's own header), and the
    // unplug below used to race the snapshot's tail: with four chunks the
    // race was rarely lost, with five since 13-12 - the page-count fetch is
    // the last - it was lost on the first run, the first snapshot cut between
    // its timer fetch and its count. The probe publishes `install-phase`, so
    // the wait is causal: `ready` IS "the snapshot is done".
    await expect(page.getByTestId("install-phase")).toHaveText("ready", {
      timeout: 30_000,
    });
    await page.evaluate(() => window.__hangarSerial.unplug(0));
    await expect(phase(page)).toHaveText("unplugged-while-connected");
    const oldOpensBefore = await openCount(page, 0);
    expect(oldOpensBefore).toBe(1);

    // The cable goes back in. replug() mints a NEW port object and fires
    // `connect` at it, as Chromium does - never at the object the session
    // holds - so the session has to recognise the arrival by getInfo() and
    // adopt the new object. The offer comes back: `detected`, nothing opened.
    const replugged = await page.evaluate(() => window.__hangarSerial.replug());
    expect(replugged).toBe(1);
    await expect(phase(page)).toHaveText("detected");
    expect(await openCount(page, 1)).toBe(0);
    await expect(title(page)).toHaveText("none");
    await expect(detail(page)).toHaveText("none");

    // Taking the offer: one click, the capture into the NEW port's index,
    // `connected`, and still no picker - the permission survived the replug.
    await page.getByTestId("session-connect").click();
    await identifyWith(page, replugged);
    await expect(phase(page)).toHaveText("connected");
    expect(await identity(page).innerText()).toContain(CAPTURED_FIRMWARE);
    expect(await requests(page)).toBe(0);

    // The assertion that makes this more than a state check: the click
    // opened the object the browser handed over, not the one that left. A
    // session that reused its stored reference would show the opposite pair.
    expect(await openCount(page, 0)).toBe(oldOpensBefore);
    expect(await openCount(page, 1)).toBe(1);

    // Two connects, two snapshots, FOURTEEN reads (twelve before 13-17, ten
    // before 12.1-08, eight before 13-12), zero writes: each snapshot is one
    // SERIALNUMBER/FETCH, five CONFIG/FETCH and one PAGECOUNT/FETCH.
    await onlyReads(page, zona, 2);
    expect(consoleErrors).toEqual([]);
  });

  test("a whole visit writes nothing and can revoke its own permission", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    const zona = await answering(page);
    await grantBeforeLoad(page);
    await page.goto(PROBE);

    // One sequence, no shortcuts: grant, load, connect, identify, unplug,
    // replug, connect, identify, forget. Every step is asserted on the way,
    // and the write counter is read ONCE, at the end, so the number it
    // reports is the whole journey's.
    expect(await page.evaluate(() => "serial" in navigator)).toBe(true);
    await connectGranted(page);
    // The snapshot landed before the unplug - the same causal wait the replug
    // test above carries, for the same reason (13-12: five chunks, and the
    // journey's totals at the end assume both snapshots ran whole).
    await expect(page.getByTestId("install-phase")).toHaveText("ready", {
      timeout: 30_000,
    });
    await page.evaluate(() => window.__hangarSerial.unplug(0));
    await expect(phase(page)).toHaveText("unplugged-while-connected");
    const replugged = await page.evaluate(() => window.__hangarSerial.replug());
    await expect(phase(page)).toHaveText("detected");
    await page.getByTestId("session-connect").click();
    await identifyWith(page, replugged);
    await expect(phase(page)).toHaveText("connected");
    await expect(page.getByTestId("session-can-forget")).toHaveText("true");

    // FORGET THIS ZONA: the session closes first, then revokes (06-04 test
    // 14 holds the order), and the browser will not list the module again.
    await page.getByTestId("session-forget").click();
    await expect(phase(page)).toHaveText("forgotten");
    await expect(identity(page)).toHaveText("none");
    await expect(page.getByTestId("session-can-forget")).toHaveText("false");
    expect(
      await page.evaluate(
        async (i) => ({
          forgotten: window.__hangarSerial.forgotten(i),
          listed: (await navigator.serial.getPorts()).length,
        }),
        replugged,
      ),
    ).toEqual({ forgotten: true, listed: 0 });

    // No picker across the whole visit: the offer, the replug offer, the
    // revoke - none of it went through requestPort().
    expect(await requests(page)).toBe(0);

    // SAFE-01 as a number over a visitor journey: offer, connect, identify,
    // unplug, replug, connect, identify, revoke - two snapshots' ten reads
    // and zero writes of any class.
    await onlyReads(page, zona, 2);
    expect(consoleErrors).toEqual([]);
  });
});

test.describe("the shipped header with a granted ZONA on the cable", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(FAKE_SERIAL);
  });

  test("the header shows the module a visitor connected to", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    const zona = await answering(page);
    await grantBeforeLoad(page);
    // The shipped header lives on /playground/{id}/ since 13-07 made / the intro; the
    // intro's connection slot is 13-11's.
    await page.goto(`/playground/${ENTRY}/`);

    // Precondition: the shim is installed and the grant is what the browser
    // would list, so the header has something to offer.
    expect(
      await page.evaluate(async () => ({
        hasSerial: "serial" in navigator,
        listed: (await navigator.serial.getPorts()).length,
      })),
    ).toEqual({ hasSerial: true, listed: 1 });
    await waitForFrontDoor(page);

    // S2, before any click: the caption over the label, and the port never
    // opened to get there. The accessible name is the label line alone - a
    // speech-input user says what the button DOES - and never the caption.
    const control = slot(page);
    await expect(control).toHaveAttribute("data-hydrated", "true");
    await expect(control).toHaveAttribute("data-slot", "S2");
    await expect(slotCaption(page)).toHaveText(CAPTION_DETECTED);
    await expect(slotLabel(page)).toHaveText(CONNECT_LABEL);
    expect(CAPTION_DETECTED).toBe("ZONA detected");
    await expect(control).toHaveAccessibleName(CONNECT_LABEL);
    await expect(control).not.toHaveAccessibleName(/detected/);
    // S2 is a plain button that acts: no aria-expanded on it.
    expect(await control.getAttribute("aria-expanded")).toBeNull();
    expect(await openCount(page, 0)).toBe(0);

    // The click: S3, busy and disabled, CONNECTING… on the label line.
    await control.click();
    await expect(control).toHaveAttribute("data-slot", "S3");
    await expect(slotLabel(page)).toHaveText(CONNECTING_LABEL);
    await expect(control).toHaveAttribute("aria-busy", "true");
    await expect(control).toBeDisabled();

    // The capture, then S4: the identity summary carries the captured
    // firmware and the active page, in the header.
    const fed = await identifyWith(page, 0, SLOT_CONNECTED);
    console.log(
      `header identification needed ${fed} of ${RX.length} rx chunks`,
    );
    await expect(control).toHaveAttribute("data-slot", "S4");
    await expect(control).toBeEnabled();
    expect(await control.getAttribute("aria-busy")).toBeNull();
    // The header's box reads the PDF's own words (13-18, D-23); the identity
    // moved into Device actions and into the control's description, which
    // names the page as the visitor reads it - wire 3 is Page 4.
    expect(await labelWords(page)).toBe(CONNECTED_LABEL);
    await expect(control).toHaveAccessibleName(CONNECTED_LABEL);
    await expect(control).toHaveAccessibleDescription(
      identityDescription(
        capture.identity.firmware,
        capture.identity.activePage,
      ),
    );
    expect(
      identityDescription(
        capture.identity.firmware,
        capture.identity.activePage,
      ),
    ).toContain(`Page ${capture.identity.activePage + 1}`);
    await expect(control).not.toHaveAccessibleName(/·/);

    // S4 is a summary: aria-expanded present and false, then true once opened,
    // and the drawer holds the identity sentence and both controls.
    await expect(control).toHaveAttribute("aria-expanded", "false");
    await control.click();
    await expect(control).toHaveAttribute("aria-expanded", "true");
    const drawer = details(page);
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute("data-slot", "S4");
    await expect(drawer).toContainText(
      identitySentence(capture.identity.firmware, capture.identity.activePage),
    );
    await expect(
      drawer.getByRole("button", { name: DISCONNECT_LABEL }),
    ).toBeVisible();
    await expect(
      drawer.getByRole("button", { name: FORGET_LABEL }),
    ).toBeVisible();

    // No picker at any point, the click opened the port once, nothing written.
    expect(await requests(page)).toBe(0);
    expect(await openCount(page, 0)).toBe(1);
    await onlyReads(page, zona, 1);
    expect(consoleErrors).toEqual([]);
  });

  test("one connection survives the front door, a configuration and the catalog", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    const zona = await answering(page);
    await grantBeforeLoad(page);
    // Since 13-07 the walk STARTS on a configuration rather than on /: the
    // intro carries no device slot until 13-11 fills the shell's connection
    // slot, so the header a visitor connects from is /playground/{id}/'s. The walk
    // still ends on / and proves the connection survives arriving there.
    await page.goto(`/playground/${ENTRY}/`);
    expect(
      await page.evaluate(async () => ({
        hasSerial: "serial" in navigator,
        listed: (await navigator.serial.getPorts()).length,
      })),
    ).toEqual({ hasSerial: true, listed: 1 });
    await waitForFrontDoor(page);
    expect(pathOf(page)).toBe(`/playground/${ENTRY}/`);

    // Precondition: a live, identified session made from the header.
    await connectFromHeader(page);
    // Stamp THIS document. A fresh document - a full navigation anywhere on
    // the walk - would come back without it.
    const STAMP = "the document that connected";
    await page.evaluate((s) => {
      window.__hangarWalk = s;
    }, STAMP);

    /** What must hold on every route of the walk. */
    const stillConnected = async (route: RegExp): Promise<void> => {
      expect(pathOf(page)).toMatch(route);
      await expect(slot(page)).toHaveAttribute("data-slot", "S4");
      expect(await labelWords(page), `the box on ${pathOf(page)}`).toBe(
        CONNECTED_LABEL,
      );
      await expect(
        slot(page),
        `the identity on ${pathOf(page)}`,
      ).toHaveAccessibleDescription(
        identityDescription(
          capture.identity.firmware,
          capture.identity.activePage,
        ),
      );
      expect(
        await page.evaluate(() => window.__hangarWalk),
        `the same document on ${pathOf(page)}`,
      ).toBe(STAMP);
      expect(await requests(page)).toBe(0);
      expect(await openCount(page, 0)).toBe(1);
    };

    // THE WALK, by the site's own links and nothing else - no goto between
    // these four hops. /playground/aurora/ -> BROWSE ALL -> /playground/ -> a card ->
    // /playground/aurora/ -> BACK TO BROWSE -> /playground/ -> the wordmark link -> /.
    // (On /playground/{id}/ the wordmark is a heading, not a link; the one link home
    // is the gallery's shell wordmark since 13-08, so the way back runs through it.
    // Since 13-11 the shell's header carries the connection control on EVERY
    // route - the gallery and the intro included - so every hop asserts the
    // slot, as this title did before 13-07 and 13-08 moved the routes onto
    // the shell.)
    await page.getByTestId("browse-link").click();
    await expect(page.getByTestId("browse-grid")).toBeVisible();
    await stillConnected(/^\/playground\/$/);

    await page.getByTestId(`card-name-${ENTRY}`).click();
    await expect(page.getByTestId("workspace")).toBeVisible();
    await stillConnected(new RegExp(`^/playground/${ENTRY}/?$`));

    await page.getByTestId("browse-link").click();
    await expect(page.getByTestId("browse-grid")).toBeVisible();
    await stillConnected(/^\/playground\/$/);

    // The last hop lands on the intro (13-07), whose header carries the same
    // control since 13-11: the identity, the same document, the same one
    // open, and not one request.
    await page.getByTestId("shell-wordmark").click();
    await expect(page.getByTestId("intro")).toBeVisible();
    await stillConnected(/^\/$/);
    // SAFE-01 over the whole walk, before the reload resets the shim: the one
    // snapshot's five reads at connect, and not one write on any route.
    await onlyReads(page, zona, 1);

    // THE THING THAT MUST NOT WORK. A reload is a fresh document: the port
    // goes with the old one and the grant does not. On / that shows as the
    // stamp gone and nothing opened; on a configuration's page, reached as a
    // second fresh document, the session comes back as the OFFER - detected,
    // S2, nothing opened - and never as connected. A session that leaked a
    // connection across a fresh document would show S4 here.
    await page.reload();
    await expect(page.getByTestId("intro")).toBeVisible();
    expect(await page.evaluate(() => window.__hangarWalk)).toBeUndefined();
    expect(await openCount(page, 0)).toBe(0);
    await page.goto(`/playground/${ENTRY}/`);
    const control = slot(page);
    await expect(control).toHaveAttribute("data-hydrated", "true");
    await expect(control).toHaveAttribute("data-slot", "S2");
    await expect(slotCaption(page)).toHaveText(CAPTION_DETECTED);
    await expect(slotLabel(page)).toHaveText(CONNECT_LABEL);
    expect(await page.evaluate(() => window.__hangarWalk)).toBeUndefined();
    expect(await openCount(page, 0)).toBe(0);
    expect(await requests(page)).toBe(0);
    expect(await writes(page)).toBe(0);
    expect(consoleErrors).toEqual([]);
  });

  test("a failure from the header opens its recovery and hands focus back on Escape", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    await grantBeforeLoad(page);
    // The busy flag goes on the ADOPTED port 0: with a granted, attached port
    // the session's connect() takes the no-chooser path and reopens that
    // object, so a flag planted on a freshly granted port scheduled through
    // pick() would never be read (06-12-SUMMARY.md's harness note).
    await page.addInitScript(() => {
      window.__hangarSerial.busy(0);
    });
    // A deep link: no splash, so nothing covers the header or eats a key.
    await page.goto(`/playground/${ENTRY}/`);

    // Precondition: the shim, the grant, and the offer on the header.
    expect(
      await page.evaluate(async () => ({
        hasSerial: "serial" in navigator,
        listed: (await navigator.serial.getPorts()).length,
      })),
    ).toEqual({ hasSerial: true, listed: 1 });
    const control = slot(page);
    await expect(control).toHaveAttribute("data-hydrated", "true");
    await expect(control).toHaveAttribute("data-slot", "S2");
    expect(await control.getAttribute("aria-expanded")).toBeNull();
    await expect(details(page)).toHaveCount(0);

    // ONE click on the header. The open is refused, S6 arrives, and the
    // drawer opens BY ITSELF - no second click - because the failure is one
    // this slot's own click produced.
    await control.click();
    await expect(control).toHaveAttribute("data-slot", "S6");
    await expect(slotCaption(page)).toHaveText(CAPTION_FAILED);
    await expect(slotLabel(page)).toHaveText(CONNECT_LABEL);
    const drawer = details(page);
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute("data-slot", "S6");

    // Focus moved INTO the recovery: the container or a control within it.
    expect(
      await page.evaluate(() => {
        const d = document.querySelector('[data-testid="device-details"]');
        const a = document.activeElement;
        return {
          inside: !!d && !!a && (a === d || d.contains(a)),
          active: a?.getAttribute("data-testid") ?? a?.tagName ?? null,
        };
      }),
    ).toEqual({ inside: true, active: "device-details" });

    // CONN-04's seven steps (six until 13-20 landed I.3.12), in order,
    // naming the header's control in the last.
    const block = drawer.getByTestId("failure-block");
    await expect(block).toContainText(PORT_BUSY.title);
    await expect(block).toContainText(PORT_BUSY.detail);
    const listed = block.locator("li");
    await expect(listed).toHaveCount(7);
    await expect(listed).toHaveText(PORT_BUSY.steps);
    expect(PORT_BUSY.steps[6]).toBe(`Click ${CONNECT_LABEL} again`);
    expect(await page.locator("body").innerText()).not.toContain(
      BROWSER_BUSY_SENTENCE,
    );

    // THE ARIA RULING. The slot ACTED; it did not expand. A button that both
    // acts and expands lies about one of its two jobs, so in S6 the drawer
    // is open and the slot carries no aria-expanded at all.
    expect(await control.getAttribute("aria-expanded")).toBeNull();

    // Escape closes the recovery and gives the control back: focus on the slot.
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await expect(control).toBeFocused();
    await expect(control).toHaveAttribute("data-slot", "S6");
    expect(await control.getAttribute("aria-expanded")).toBeNull();

    // One refused open on the adopted port, no picker, nothing written.
    expect(await requests(page)).toBe(0);
    expect(await openCount(page, 0)).toBe(1);
    expect(await writes(page)).toBe(0);
    expect(consoleErrors).toEqual([]);
  });
});

test.describe("the shipped header on a browser with no Web Serial", () => {
  test.beforeEach(async ({ context }) => {
    // NO shim. The real slot is deleted from the prototype, so this header is
    // rendered by a browser that genuinely has none.
    await context.addInitScript(() => {
      delete (Navigator.prototype as unknown as Record<string, unknown>).serial;
    });
  });

  test("@webkit the header names the browsers that can install and offers nothing to press @webkit", async ({
    page,
  }, testInfo) => {
    const consoleErrors = collectErrors(page);
    // The shipped header lives on /playground/{id}/ since 13-07 made / the intro.
    await page.goto(`/playground/${ENTRY}/`);

    // Precondition, asserted.
    expect(await page.evaluate(() => "serial" in navigator)).toBe(false);

    // IN THIS ORDER AND NO OTHER - see the header.
    // 1. The slot renders and is not hidden. (The prerendered file alone
    //    satisfies this: DEGR-02's control is present, never hidden.)
    const control = slot(page);
    await expect(control).toBeAttached();
    await expect(control).toBeVisible();

    // 2. The hydration marker: set only from onMount, so a static file
    //    cannot carry it. This is the one assertion here a prerendered
    //    document is structurally incapable of passing.
    await expect(control).toHaveAttribute("data-hydrated", "true");

    // 3. The caption has SETTLED at the unsupported sentence: the capability
    //    decision has happened, and everything below depends on it.
    await expect(slotCaption(page)).toHaveText(CAPTION_UNSUPPORTED);
    expect(CAPTION_UNSUPPORTED).toBe("Not in this browser");
    await expect(control).toHaveAttribute("data-slot", "S0a");

    // 4. The disclosure names the browsers that can, and no engine. The
    //    slot here is a summary - present, enabled, aria-expanded - and
    //    opening it is the only thing a click can do. The splash must be gone
    //    first: a click while it is up is its skip gesture, not the slot's.
    await waitForFrontDoor(page);
    await expect(control).toBeEnabled();
    await expect(control).toHaveAttribute("aria-expanded", "false");
    await control.click();
    const drawer = details(page);
    await expect(drawer).toBeVisible();
    await expect(control).toHaveAttribute("aria-expanded", "true");
    await expect(drawer).toContainText(UNSUPPORTED.title);
    await expect(drawer).toContainText(UNSUPPORTED.detail);
    const reason = await drawer.innerText();
    for (const named of ["Chrome", "Edge", "Firefox 151"]) {
      expect(reason, `the disclosure names ${named}`).toContain(named);
    }
    expect(await page.locator("body").innerText()).not.toContain("Chromium");
    // Nothing to press: the recovery on this engine is another browser, so
    // the drawer holds no control, and the label offers no connect.
    await expect(drawer.getByRole("button")).toHaveCount(0);
    await expect(slotLabel(page)).not.toHaveText(CONNECT_LABEL);

    // 5. The note region is ABSENT ENTIRELY - a snapshot count, taken only
    //    now, after the marker and the settled caption. A visitor who can
    //    never connect pays no reserved 152px for a picker they will never
    //    see.
    expect(await page.getByTestId("device-note").count()).toBe(0);

    // 6. The header's Clear carries the same reason - DEGR-02's two
    //    surfaces, one sentence (the column's connect-status was the second
    //    until 13.1-06; since then the bar's zone renders only for a module
    //    that has reported a page, and where it would be the bar says
    //    preview-only). Escape closes the drawer and hands focus back.
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    // Since 13-09 the panel is on the page on arrival; nothing is chosen.
    await expect(page.getByTestId("workspace")).toHaveAttribute(
      "data-ready",
      "true",
    );
    await expect(page.getByTestId("tuning-region")).toBeVisible();
    const clear = page.getByTestId("clear");
    await expect(clear).toBeVisible();
    await expect(clear).toBeDisabled();
    await expect(page.getByTestId("clear-line")).toHaveText(
      CLEAR_REASONS.incapable,
    );
    expect(await page.getByTestId("destination").count()).toBe(0);
    expect(await page.getByTestId("store-on-zona").count()).toBe(0);
    await expect(page.locator('[data-zone="destination"]')).toContainText(
      "Preview",
    );
    expect(await page.locator("body").innerText()).not.toContain("Chromium");

    // The header a large share of visitors will see, on the record.
    const dump = await page.evaluate(() => {
      const rect = (sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), h: Math.round(r.height) };
      };
      return {
        viewport: { w: innerWidth, h: innerHeight },
        slot: rect('[data-testid="device-slot"]'),
        headline: rect(".headline"),
        noteCount: document.querySelectorAll('[data-testid="device-note"]')
          .length,
      };
    });
    console.log(
      `degrade header on ${testInfo.project.name}: ${JSON.stringify({
        ...dump,
        caption: await slotCaption(page).innerText(),
        label: await labelWords(page),
      })}`,
    );
    await page.screenshot({
      path: `.tmp-e2e/06-13-degrade-header-${testInfo.project.name}.png`,
    });

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("the three live regions with a granted ZONA on the cable", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(FAKE_SERIAL);
  });

  test("a session transition is announced once, and the other two regions stay quiet", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    const zona = await answering(page);
    await grantBeforeLoad(page);
    // A deep link: the panel with its knobs is on this route, the tuning
    // region with it, and there is no splash to hold the session's speech.
    await page.goto(`/playground/${ENTRY}/`);
    expect(
      await page.evaluate(async () => ({
        hasSerial: "serial" in navigator,
        listed: (await navigator.serial.getPorts()).length,
      })),
    ).toEqual({ hasSerial: true, listed: 1 });

    // The offer was announced on load - one sentence, from the store's
    // trailing window - and the slot offers.
    const sessionLive = page.getByTestId("session-live");
    await expect(sessionLive).toHaveText(LIVE_DETECTED);
    await expect(slot(page)).toHaveAttribute("data-slot", "S2");

    // The panel, from the keyboard, once the band is really listening.
    // Since 13-09 the panel is on the page on arrival; nothing is chosen.
    await expect(page.getByTestId("workspace")).toHaveAttribute(
      "data-ready",
      "true",
    );
    await expect(page.getByTestId("tuning-region")).toBeVisible();
    await expect(page.getByTestId("knob-rack").first()).toBeVisible();
    await settled(page);

    // Precondition: the three regions as they stand, and the recorder on.
    await recordLiveRegions(page);
    const before = await liveTexts(page);
    expect(before.session).toBe(LIVE_DETECTED);
    expect(before.tuning).toBe("");
    // The browse toolbar is not on this route, so its region is absent here;
    // "unchanged" for it means "still absent".
    expect(before.browse).toBeNull();

    // MOMENT ONE: a session transition. Connect from the header, then wait
    // past the 500ms trailing window.
    await connectFromHeader(page);
    await page.waitForTimeout(800);
    const afterConnect = await liveTexts(page);
    const connectedSentence = liveConnected(
      capture.identity.firmware,
      capture.identity.activePage,
    );
    console.log(
      `after connect: session=${JSON.stringify(afterConnect.session)} tuning=${JSON.stringify(afterConnect.tuning)} browse=${JSON.stringify(afterConnect.browse)}`,
    );
    // SINCE PHASE 7 (plan 07-08) THE REGION READS THE SNAPSHOT SENTENCE, NOT
    // THE CONNECTED ONE. The install store takes its snapshot the moment the
    // session is connected and speaks liveSnapshotSaved on `ready`; on a
    // module that answers, that is tens of milliseconds after the session
    // queued its own sentence, inside the same 500 ms trailing window, and
    // the coalescer keeps the LAST line (Y-16). So the connected sentence is
    // queued and never rendered, and the record holds one utterance. This is
    // the announcer doing what its contract says, and it is recorded as a
    // product observation in 07-08's deferred items, not silently asserted
    // past.
    expect(afterConnect.session).toBe(
      liveSnapshotSaved(capture.identity.activePage),
    );
    expect(afterConnect.session).not.toBe(connectedSentence);
    // Exactly one utterance: the region was emptied when the first line was
    // queued, emptied again (no change) when the second replaced it, and
    // written once when the window closed - the record is the empty string
    // and then one sentence, and nothing else.
    expect(utterances(afterConnect.log["session-live"])).toEqual([
      liveSnapshotSaved(capture.identity.activePage),
    ]);
    expect(afterConnect.tuning).toBe(before.tuning);
    expect(utterances(afterConnect.log["tuning-live"])).toEqual([]);
    expect(afterConnect.browse).toBeNull();
    expect(utterances(afterConnect.log["browse-live"])).toEqual([]);

    // The session's current sentence is carried by exactly ONE live region
    // on the whole page, and the identity sentence - which the panel's
    // connect-status shows as plain text - by no live region at all: the day
    // the connect-status is polite again this reads two, the double-speak
    // D-17 exists to prevent.
    const carriersOf = (sentence: string) =>
      page.evaluate(
        (s) =>
          Array.from(document.querySelectorAll("[aria-live]"))
            .filter((el) => (el.textContent ?? "").includes(s))
            .map((el) => el.getAttribute("data-testid") ?? el.id ?? el.tagName),
        sentence,
      );
    expect(
      await carriersOf(liveSnapshotSaved(capture.identity.activePage)),
    ).toEqual(["session-live"]);
    expect(
      (
        await carriersOf(
          identitySentence(
            capture.identity.firmware,
            capture.identity.activePage,
          ),
        )
      ).length,
    ).toBeLessThanOrEqual(1);

    // MOMENT TWO: a tuning change. Turn the first rail one step, let the
    // debounced recompile land, then RESET ALL - the tuning region's own
    // gesture that speaks (a knob that stays inside budget is silent by
    // Phase 5's contract; only a command or a budget crossing speaks).
    const rails = page.locator("[data-testid='knob-rack'] input[type='range']");
    await rails.nth(0).focus();
    await page.keyboard.press("ArrowRight");
    await recomputed(page);
    await page.getByTestId("reset-all").click();
    await recomputed(page);
    const tuningLive = page.getByTestId("tuning-live");
    await expect(tuningLive).not.toHaveText("", { timeout: 10_000 });
    await page.waitForTimeout(800);
    const afterKnob = await liveTexts(page);
    console.log(
      `after the knobs: session=${JSON.stringify(afterKnob.session)} tuning=${JSON.stringify(afterKnob.tuning)} browse=${JSON.stringify(afterKnob.browse)}`,
    );
    // The tuning region spoke, and the session region did not move: same
    // text, and not one more recorded change.
    expect(afterKnob.tuning).not.toBe("");
    expect(afterKnob.tuning).not.toBe(afterConnect.tuning);
    expect(utterances(afterKnob.log["tuning-live"]).length).toBeGreaterThan(0);
    expect(afterKnob.session).toBe(afterConnect.session);
    expect(afterKnob.log["session-live"]).toEqual(
      afterConnect.log["session-live"],
    );
    expect(afterKnob.browse).toBeNull();
    expect(utterances(afterKnob.log["browse-live"])).toEqual([]);

    // Still connected, still nothing asked of the picker, nothing written:
    // the snapshot's five reads and no write through two moments and a
    // knob.
    await expect(slot(page)).toHaveAttribute("data-slot", "S4");
    expect(await requests(page)).toBe(0);
    await onlyReads(page, zona, 1);
    expect(consoleErrors).toEqual([]);
  });
});
