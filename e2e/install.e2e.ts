// SAFE-01, SAFE-02, SAFE-03, SAFE-05, SAFE-07, SAFE-08, SAFE-09 and DEGR-02:
// the install store in the browser that produces its states, against a ZONA
// that does not exist - first through a probe that hides nothing, then on the
// page a visitor actually opens.
//
// Fourteen tests in three blocks. THE FIRST SIX run against the install probe
// route, which renders the store's fields as plain text plus one thing no
// component ever will: a TRACE of every phase the store has been in since
// load, in order. A round trip through the scripted module takes tens of
// milliseconds, so `snapshotting` and `writing` never stay on screen long
// enough for a locator to catch them; the trace is how a browser test asserts
// a transient, and it is why every one of 07-UI-SPEC's fourteen states is
// visited there before a panel exists to hide a transition in. Between them
// the six tests own: idle, snapshotting, ready, writing, settled, restored,
// kept, partial, lost, snapshot-failed, kept-mismatch, unconfirmed,
// restored-unconfirmed and nothing-landed. Tests are isolated, so no
// file-level union is asserted; each test asserts the states it owns and
// 07-08-SUMMARY.md tabulates the fourteen against the six.
//
// THE NEXT FOUR (plan 07-12) run on /playground/aurora/ against the production build,
// with the same shim and the same Node responder, and prove the things a
// visitor meets that the probe cannot show: the panel's busy label and its
// aria-busy, the header lock engaging and releasing, the confirmation
// replacing the control that opened it and moving focus deliberately, the
// put-back that stores after a keep, the one live region speaking once per
// outcome, and Escape doing nothing mid-write. A RAM leg lands in about 40 ms
// and the lock would be unobservable, so the tests that need to SEE `writing`
// hold the acknowledgement in Node - and the hold has to respect the queue's
// arithmetic. The request id is minted per attempt, the waiter is armed
// before the write, and delayAckMs stalls the page's write() itself (the
// shim's sink awaits Node), so a CONFIG acknowledgement held past executeMs
// 250 is stale on arrival and three attempts end nothing-landed. A RAM leg is
// therefore held 200 ms PER acknowledgement - THREE events since 12-03, a
// window of about 600 ms that Playwright's polling catches, all three landing
// on attempt 1 - and
// anything that needs a window past 2000 ms, the slow line, is observed on a
// STORE leg, whose single attempt runs to pagestoreMs 3000.
//
// THE HEADER LOCK WAS MET ONLY AFTER AN UN-CHOOSE DURING A LEG (deferred item
// 19) until 13-09: panelOwnsProse was page.state.chosen and the drawer never
// rendered while the panel that holds every writing control was open. The
// workspace has no chosen state - the panel is always on the page and the
// slot is handed panelOwnsProse false - so test 7 opens the disclosure with
// one click inside the RAM leg and reads the panel's settled block after it.
//
// THE ELEVENTH (plan 10-13) is the fourth write click walked end to end: at
// rest CLEAR is live beside KEEP ON DEVICE under the NEXT caption; one click
// sends with NO confirmation and no element ever appears bearing the testid
// one would have had; CLEARING… carries aria-busy through the one leg; region
// 3 reads FACTORY DEFAULT over a body that names PUT BACK, which is on the
// screen and enabled; and PUT BACK then brings the visitor's own back. The
// wire is counted by class at the end and PAGESTORE/EXECUTE is zero, which is
// A-26's RAM-only ruling as a number rather than an intention.
//
// THE TWELFTH (plan 12-01) is the phase-12 question asked of the wire rather
// than of the tuner: a rail turned on /playground/lumen/ BEFORE the click, then the
// fake ZONA's own RAM read back and compared against the depth literal
// derived from lumen.ts's knob values. It is the only title in the file that
// moves a knob between two writes, and it exists because two bench reports -
// LUMEN's "seems like nothing changed" and NINE PADS' "make a 16 pads cause
// nothing changed" - could not be answered without it. Untagged: it drives
// Web Serial through the shim.
//
// THE THIRTEENTH AND FOURTEENTH are the degrade path, tagged for the phone
// project: no shim, `Navigator.prototype.serial` deleted, and every install
// control present, disabled and explained - PUT BACK absent, by decision
// (Z-12), and CLEAR present-and-disabled beside it, by the opposite decision
// (DEGR-02), which the thirteenth holds as one assertion.
//
// THE PUT-BACK AFTER A KEEP NEEDS A BOUNDED BEAT LOOP, NOT ONE TIMED BEAT.
// After a keep, PUT BACK runs a store leg too (Z-04), and the store's D-12
// proof waits for the ZONA's next heartbeat AFTER the acknowledgement lands -
// `#nextHeartbeat()` is armed only then. The landing is invisible from the
// page (the label and the block do not change on it), heartbeats in this
// harness come only from beat(), and sleeps are forbidden, so a single beat
// pushed at a guessed moment is lost to the fold. beatUntilShows() pushes one,
// polls the panel for about one heartbeat period, and pushes again, capped at
// twelve - the module's own 4 Hz cadence, about three seconds in all.
//
// THE ZONA IS THE NODE SUITE'S ZONA. e2e/fake-zona.ts exposes the real
// zonaResponder into the page through page.exposeFunction; the page-side shim
// (e2e/fake-serial.ts) hands every written chunk to it and pushes the frames
// it returns back into the fake port's readable stream. So the request id the
// acknowledgement echoes is read off the real wire in Node, and a state the
// browser reaches is a state install.spec.ts can reach. Faults are scripted on
// top of that responder, never inside it: acknowledgements dropped by their
// cumulative number per class, a first write refused, a re-fetch that lies.
//
// HEARTBEATS ARE PACED BY THE TEST. The responder answers a host heartbeat
// with nothing and never volunteers one, so identification and the store's
// D-12 proof - which waits for the ZONA's own next heartbeat after the
// PAGESTORE acknowledgement before it re-fetches - both need the test to push
// them, through beat(). beatUntil() pushes one, polls a readout for up to one
// heartbeat period, and pushes again, the way a module beats at 4 Hz whatever
// the host is doing; a heartbeat that arrives before the store is waiting is
// absorbed by the fold and harms nothing, which is what makes the pump safe.
//
// EVERY TEST COUNTS THE WIRE BY CLASS. The Node side decodes every outbound
// frame and counts it, and every test ends by asserting CONFIG/EXECUTE and
// PAGESTORE/EXECUTE equal exactly the number its clicks account for - test 1
// over a whole connect-and-snapshot journey, where both are zero. That is
// SAFE-01 as a class count on a real page, and it is the number 06-07's
// zero-writes gate could not give: that gate counted chunks, this one reads
// them.
//
// EVERY TEST ASSERTS ITS OWN PRECONDITION FIRST (e2e/skeleton.e2e.ts). Every
// fresh page in a test gets its own module (a different serial number), so
// the durable record one page writes is never the reason the next one reads
// `ready`.
//
// TWELVE OF THE FIFTEEN TITLES ARE UNTAGGED (eleven of fourteen before
// 13-12): every one of them drives Web Serial, which the phone engine does
// not have. Three carry the tag playwright.config.ts greps the phone project
// by, so they run on both: fifteen titles, eighteen runs. 07-08 added six to
// the suite total on the desktop project alone; 07-12 adds four there and one
// on both, six more; 10-13 adds two on both, four more; 12-01 adds ONE on the
// desktop project alone, so the source count and the run count each move by
// exactly one; 13-12 adds ONE the same way - the page target, D-06.
//
// AND ONE OF THE THREE TAGGED TITLES DRIVES WEB SERIAL, WHICH IS A DEPARTURE
// FROM THE PARAGRAPH ABOVE - said plainly rather than left to be noticed. The
// clear walk runs on the phone project through the SHIM, so what it proves
// there is that the panel's logic, copy and enablement behave the same in
// WebKit at a phone viewport; it does not and cannot prove that an iPhone can
// install, and nothing here claims it does. Plan 10-13 asked for the fourth
// click in both projects and the reason is worth the departure: the fourth
// click is the one whose whole design was cut down after approval, and a
// second engine is the cheapest check that what shipped is the same in both.
//
// TESTS 6 AND 10 ARE SLOW BY DESIGN. Test 6's two legs of three pagestoreMs
// (3000 ms) attempts with retryBackoffMs between them are roughly 19 s; test
// 10 holds one store acknowledgement 2.5 s, paces two keep-and-restore proofs
// through heartbeats, polls the live region for a second and ends in an
// unplug. Both are against Playwright's default 30 s per-test budget
// (playwright.config.ts sets no `timeout`; its 180 s is the web server's),
// so each declares test.slow() on its first line and prints its wall time.
// The timeouts under test are the shipped constants and are not shortened.
//
// NEVER WRITES TO A DEVICE. Every byte a page writes lands in the shim; the
// only ZONA here is a function in Node.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { expect, test, type Page } from "@playwright/test";
import {
  CLEARED_BODY,
  CLEARED_CAPTION,
  CLEARING_LABEL,
  CLEAR_LABEL,
  CLEAR_LINE,
  CLEAR_REASONS,
  CONFIRM_CAPTION,
  CONFIRM_REPLACES,
  CONFIRM_WAY_BACK,
  HONESTY_INCAPABLE,
  HONESTY_READY,
  IDENTIFIED_CAPTION,
  KEEPING_LABEL,
  KEEP_LINE_ENABLED,
  KEEP_REASONS,
  KEPT_CAPTION,
  KEPT_PROOF_LINE,
  LIVE_CLEARED,
  LIVE_RESTORED,
  LIVE_SNAPSHOT_SAVED,
  LIVE_STILL_WRITING,
  PUTTING_BACK_LABEL,
  PUT_BACK_LABEL,
  PUT_BACK_NEEDS_ZONA,
  RESTORED_BODY,
  RESTORED_CAPTION,
  RESTORED_STORED_LINE,
  SETTLED_CAPTION,
  STILL_WRITING_LINE,
  WRITING_LABEL,
  announceTitle,
  confirmRig,
  keptBody,
  liveKept,
  liveSettled,
  lostBlock,
  settledBody,
  unconfirmedBlock,
  TRY_ON_LABEL,
} from "../src/lib/device/install-copy";
import {
  putBackPageLine,
  putBackPageLineAfterKeep,
} from "../src/lib/device/page-target";
import {
  CAPTION_UNSUPPORTED,
  WRITE_LOCK_REASON,
} from "../src/lib/device/session-copy";
// The entry itself, so the depth literal this test looks for on the wire is
// DERIVED from the knob's own values and never typed here. lumen.ts imports
// only a type from the vendored compiler, so this costs the runner nothing.
import { LUMEN } from "../src/lib/catalog/entries/lumen";
import {
  ELEMENT_SYSTEM,
  EVENT_SETUP,
  EVENT_TIMER,
  TERMINATOR,
  decodeFrame,
} from "../src/lib/protocol";
import {
  type ZonaState,
  heartbeatFrame,
} from "../src/lib/transport/fixtures/synthetic";
import { MEASURING } from "../src/lib/tune/copy";
import { FAKE_SERIAL } from "./fake-serial";
import { type ExposedZona, type ZonaScript, installZona } from "./fake-zona";

declare global {
  interface Window {
    /** Test 10's record of every text change in each live region, by testid. */
    __hangarInstallLiveLog?: Record<string, string[]>;
  }
}

const PROBE = "/dev/install/";

/** The name the probe hands TRY ON DEVICE; the settled and kept sentences carry it. */
const NAME = "Probe";

/** What the module holds when the visitor connects: the strings the snapshot must copy. */
const MODULE_SETUP = "--[[@cb]]print(1)";
const MODULE_TIMER = "--[[@cb]]print(2)";
/**
 * And what it holds in its SYSTEM element (255/0) - the page-init slot HANGAR
 * started writing in 12-03. Deliberately NOT the package default, so a
 * put-back putting the module's own page init back is distinguishable from a
 * factory module answering a default it never had written.
 */
const MODULE_SYSTEM = "--[[@cb]]function M()return 1 end";
/** Deliberately not the first page, for sequence.spec.ts's reason: a constant would be caught. */
const ACTIVE_PAGE = 2;

/**
 * A module per page: WORD0 differs, so each page identifies a different ZONA
 * and reads no other page's durable record.
 */
function moduleState(nth: number, over: Partial<ZonaState> = {}): ZonaState {
  return {
    sx: 0,
    sy: 0,
    activePage: ACTIVE_PAGE,
    configs: { [EVENT_SETUP]: MODULE_SETUP, [EVENT_TIMER]: MODULE_TIMER },
    system: { [EVENT_SETUP]: MODULE_SYSTEM },
    serial: [0x9abcdef0 + nth, 0x12345678, 0, 0],
    ...over,
  };
}

/** The titles the store speaks, from the module that owns them, never a literal. */
const LOST_SPOKEN = announceTitle(lostBlock(false, TRY_ON_LABEL).title);
const UNCONFIRMED_SPOKEN = announceTitle(unconfirmedBlock(NAME).title);

/**
 * Only error-level messages are collected: the protocol package logs at
 * console.log from module scope and the decoder logs every rejected frame.
 */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

const readout = (page: Page, id: string) => page.getByTestId(id);
const sessionPhase = (page: Page) => readout(page, "session-phase");
const phase = (page: Page) => readout(page, "install-phase");
const trace = (page: Page) => readout(page, "install-trace");
const cause = (page: Page) => readout(page, "install-cause");
const putBack = (page: Page) => readout(page, "install-put-back");
const keepReason = (page: Page) => readout(page, "install-keep-reason");
const speech = (page: Page) => readout(page, "install-speech");
const click = (page: Page, id: string) => readout(page, id).click();

/** The last action's steps, one `id outcome attempts` per line. */
async function stepLines(page: Page): Promise<string[]> {
  const text = await readout(page, "install-steps").innerText();
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

/** The THREE strings the probe's textareas hold, read rather than restated. */
async function probePair(
  page: Page,
): Promise<{ system: string; setup: string; timer: string }> {
  return {
    system: await readout(page, "install-system").inputValue(),
    setup: await readout(page, "install-setup").inputValue(),
    timer: await readout(page, "install-timer").inputValue(),
  };
}

const writesOf = (page: Page) =>
  page.evaluate(() => window.__hangarSerial.writesOf());

/**
 * Expose the module, grant its port BEFORE the page loads (the returning
 * visitor whose permission survived), open the probe and assert the offer.
 */
async function openProbe(
  page: Page,
  state: ZonaState,
  script?: ZonaScript,
): Promise<ExposedZona> {
  const zona = await installZona(page, state, script);
  await page.addInitScript(() => {
    window.__hangarSerial.grant();
  });
  await page.goto(PROBE);
  // Precondition: the shim is installed, the grant is what the browser would
  // list, and the store is at rest.
  expect(
    await page.evaluate(async () => ({
      hasSerial: "serial" in navigator,
      listed: (await navigator.serial.getPorts()).length,
    })),
  ).toEqual({ hasSerial: true, listed: 1 });
  await expect(sessionPhase(page)).toHaveText("detected");
  await expect(phase(page)).toHaveText("idle");
  return zona;
}

/**
 * Push heartbeats into port `index` until `testid` reads `value`; return how
 * many it took. After each beat the page is polled for up to one heartbeat
 * period (the module beats at 4 Hz). Throws rather than returning quietly if
 * the readout never arrives - a pump with no bound would pass for the wrong
 * reason on a store that never leaves `writing`.
 */
async function beatUntil(
  page: Page,
  zona: ExposedZona,
  index: number,
  testid: string,
  value: string,
  max = 80,
): Promise<number> {
  for (let n = 1; n <= max; n++) {
    await page.evaluate(([i, hex]) => window.__hangarSerial.beat(i, hex), [
      index,
      zona.heartbeatHex(),
    ] as const);
    const reached = await page.evaluate(
      async ([id, expected]) => {
        const read = () =>
          document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
        for (let waited = 0; waited < 250; waited += 10) {
          if (read() === expected) return true;
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        return read() === expected;
      },
      [testid, value] as const,
    );
    if (reached) return n;
  }
  const last = await readout(page, testid).innerText();
  throw new Error(
    `${testid} never read ${value} after ${max} heartbeats; it reads ${last}`,
  );
}

/** One click on the probe's connect, heartbeats until `connected`, and the snapshot left to land in `ready`. */
async function connectAndSnapshot(
  page: Page,
  zona: ExposedZona,
  index = 0,
): Promise<void> {
  await click(page, "install-connect");
  await beatUntil(page, zona, index, "session-phase", "connected");
  await expect(phase(page)).toHaveText("ready");
}

/** Observe the probe's pair, click TRY ON DEVICE, and wait for the phase named. */
async function tryOn(page: Page, lands: string): Promise<void> {
  await click(page, "install-observe");
  await click(page, "install-try");
  await expect(phase(page)).toHaveText(lands, { timeout: 10_000 });
}

/** Open the confirmation, take it, and pace heartbeats until the phase named. */
async function keep(
  page: Page,
  zona: ExposedZona,
  lands: string,
): Promise<void> {
  await click(page, "install-keep");
  await expect(readout(page, "install-confirm")).toHaveText("true");
  await click(page, "install-keep-yes");
  await expect(readout(page, "install-confirm")).toHaveText("false");
  await beatUntil(page, zona, 0, "install-phase", lands);
}

test.describe("the install store on a scripted ZONA that answers from Node", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(FAKE_SERIAL);
  });

  test("the snapshot is taken before any control enables, and nothing is written without a click", async ({
    context,
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    const zona = await openProbe(page, moduleState(1));
    // Before any session: no snapshot, no remembered module, so PUT BACK is
    // absent (I0) and KEEP ON DEVICE has its resting reason.
    await expect(putBack(page)).toHaveText("absent");
    await expect(keepReason(page)).toHaveText("never-tried");

    await click(page, "install-connect");
    const beats = await beatUntil(page, zona, 0, "session-phase", "connected");
    console.log(`identification needed ${beats} heartbeat(s)`);
    await expect(phase(page)).toHaveText("ready");

    // The trace holds the transient: idle, the snapshot in flight, ready.
    await expect(trace(page)).toHaveText(/^idle > snapshotting > ready$/);
    // THREE LENGTHS, in write order. This site is a READOUT STRING rather
    // than a count, so no grep for a numeric literal finds it; the full suite
    // did, on the first run.
    await expect(readout(page, "install-snapshot")).toHaveText(
      `durable ${MODULE_SYSTEM.length} ${MODULE_SETUP.length} ${MODULE_TIMER.length}`,
    );
    expect(await readout(page, "install-module").innerText()).toMatch(
      /^[0-9a-f]{32}$/,
    );
    await expect(putBack(page)).toHaveText("enabled");
    await expect(keepReason(page)).toHaveText("never-tried");
    await expect(readout(page, "install-armed")).toHaveText("false");
    await expect(cause(page)).toHaveText("none");
    await expect(speech(page)).toHaveText(LIVE_SNAPSHOT_SAVED);
    expect(await stepLines(page)).toEqual([
      "fetch-serial ok 1",
      "fetch-system ok 1",
      "fetch-setup ok 1",
      "fetch-timer ok 1",
      // 13-12: the enumeration, once per connection, a READ. The pages the
      // destination control offers are this answer and never a number.
      "fetch-page-count ok 1",
    ]);
    await expect(readout(page, "install-pages")).toHaveText("0 1 2 3");
    await expect(readout(page, "install-page-status")).toHaveText("reported");
    await expect(readout(page, "install-page-reported")).toHaveText(
      String(ACTIVE_PAGE),
    );
    await expect(readout(page, "install-apply-ready")).toHaveText("true");

    // SAFE-01 by class, over the whole journey: one serial fetch, THREE config
    // fetches, ONE page-count fetch, and not one write of any kind - where,
    // since 13-12, "a write" includes the PAGE SWITCH and the PAGE DISCARD
    // (13-CONTEXT D-06, first clause: a page switch is a click, never a side
    // effect). The class list is EXTENDED here, never excepted: connecting,
    // snapshotting and enumerating moved the module's page zero times.
    expect(zona.seen("SERIALNUMBER", "FETCH")).toBe(1);
    expect(zona.seen("CONFIG", "FETCH")).toBe(3);
    expect(zona.seen("PAGECOUNT", "FETCH")).toBe(1);
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(0);
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);
    expect(zona.seen(["PAGE", "ACTIVE"].join(""), "EXECUTE")).toBe(0);
    expect(zona.seen(["PAGE", "DISCARD"].join(""), "EXECUTE")).toBe(0);
    expect(zona.seen("HEARTBEAT", "EXECUTE")).toBe(0);
    // Five frames since 13-12 (four since 12-03): the serial, the three
    // fetches, the page count.
    expect((await writesOf(page)).length).toBe(5);

    // A module whose fetch answers empty: the snapshot is refused before the
    // record is consulted (D-03), PUT BACK stays absent, and RETRY after the
    // module is fixed reaches ready through a second snapshotting.
    const second = await context.newPage();
    const secondErrors = collectErrors(second);
    const empty = await openProbe(second, moduleState(2, { configs: {} }));
    await click(second, "install-connect");
    await beatUntil(second, empty, 0, "session-phase", "connected");
    await expect(phase(second)).toHaveText("snapshot-failed");
    await expect(trace(second)).toHaveText(
      /^idle > snapshotting > snapshot-failed$/,
    );
    await expect(putBack(second)).toHaveText("absent");
    await expect(readout(second, "install-snapshot")).toHaveText("none");
    await expect(cause(second)).toHaveText("timeout");

    empty.state.configs[EVENT_SETUP] = MODULE_SETUP;
    empty.state.configs[EVENT_TIMER] = MODULE_TIMER;
    await click(second, "install-retry");
    await expect(phase(second)).toHaveText("ready");
    await expect(trace(second)).toHaveText(
      /^idle > snapshotting > snapshot-failed > snapshotting > ready$/,
    );
    await expect(putBack(second)).toHaveText("enabled");
    // Two snapshot attempts, three fetches each; the count fetched ONCE - the
    // first attempt enumerated before its guard refused, and the retry did
    // not ask again. Still not one write of any class.
    expect(empty.seen("CONFIG", "FETCH")).toBe(6);
    expect(empty.seen("PAGECOUNT", "FETCH")).toBe(1);
    expect(empty.seen("CONFIG", "EXECUTE")).toBe(0);
    expect(empty.seen("PAGESTORE", "EXECUTE")).toBe(0);
    expect(empty.seen(["PAGE", "ACTIVE"].join(""), "EXECUTE")).toBe(0);

    expect(consoleErrors).toEqual([]);
    expect(secondErrors).toEqual([]);
  });

  test("TRY ON DEVICE lands all three acknowledgements, PUT BACK restores, and the trace names every state", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    const zona = await openProbe(page, moduleState(3));
    await connectAndSnapshot(page, zona);
    const pair = await probePair(page);
    expect(pair.setup).not.toBe(MODULE_SETUP);
    expect(pair.timer).not.toBe(MODULE_TIMER);
    expect(
      pair.system,
      "the third textarea holds something else again",
    ).not.toBe(MODULE_SYSTEM);

    // Observing the pair arms nothing on its own (Z-05: armed means the
    // module HOLDS the pair).
    await click(page, "install-observe");
    await expect(readout(page, "install-armed")).toHaveText("false");

    await click(page, "install-try");
    await expect(phase(page)).toHaveText("settled");
    await expect(trace(page)).toHaveText(
      /^idle > snapshotting > ready > writing > settled$/,
    );
    await expect(readout(page, "install-action")).toHaveText("try");
    await expect(readout(page, "install-leg")).toHaveText("ram");
    await expect(cause(page)).toHaveText("none");
    await expect(readout(page, "install-armed")).toHaveText("true");
    await expect(keepReason(page)).toHaveText("live");
    await expect(putBack(page)).toHaveText("enabled");
    await expect(speech(page)).toHaveText(liveSettled(NAME));
    expect(await stepLines(page)).toEqual([
      "write-system ok 1",
      "write-timer ok 1",
      "write-setup ok 1",
      "restore-page-change sent 1",
    ]);
    // One RAM leg, three writes.
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(3);
    expect(zona.seen("HEARTBEAT", "EXECUTE")).toBe(1);
    // The module's RAM holds the three; its flash still holds its own. The
    // THIRD line is 12-03's: what the install-system textarea holds is what
    // element 255 holds, read out of the fake's SECOND RAM - the sure route
    // for pasting an arbitrary page init at a module.
    expect(zona.state.configs[EVENT_SETUP]).toBe(pair.setup);
    expect(zona.state.configs[EVENT_TIMER]).toBe(pair.timer);
    expect(zona.state.system?.[EVENT_SETUP]).toBe(pair.system);
    expect(zona.state.flash?.[EVENT_SETUP]).toBe(MODULE_SETUP);

    await click(page, "install-put-back-click");
    await expect(phase(page)).toHaveText("restored");
    await expect(trace(page)).toHaveText(/> settled > writing > restored$/);
    await expect(readout(page, "install-action")).toHaveText("put-back");
    await expect(readout(page, "install-armed")).toHaveText("false");
    await expect(keepReason(page)).toHaveText("never-tried");
    await expect(speech(page)).toHaveText(LIVE_RESTORED);
    // The second restore-page-change line: one per RAM leg, read after each.
    expect(await stepLines(page)).toEqual([
      "write-system ok 1",
      "write-timer ok 1",
      "write-setup ok 1",
      "restore-page-change sent 1",
    ]);
    // Two RAM legs, three writes each. The heartbeat count does NOT move:
    // one restore per leg, and there are still two legs.
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(6);
    expect(zona.seen("HEARTBEAT", "EXECUTE")).toBe(2);
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);
    expect(zona.state.configs[EVENT_SETUP]).toBe(MODULE_SETUP);
    expect(zona.state.configs[EVENT_TIMER]).toBe(MODULE_TIMER);
    expect(zona.state.system?.[EVENT_SETUP], "and the page init too").toBe(
      MODULE_SYSTEM,
    );
    expect(consoleErrors).toEqual([]);
  });

  test("KEEP ON DEVICE is kept only after the read-back matches, and a mismatch is named", async ({
    context,
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    const zona = await openProbe(page, moduleState(4));
    await connectAndSnapshot(page, zona);
    const pair = await probePair(page);
    await tryOn(page, "settled");

    // NOT NOW is one of the confirmation's exits, and it disables nothing.
    await click(page, "install-keep");
    await expect(readout(page, "install-confirm")).toHaveText("true");
    await click(page, "install-keep-no");
    await expect(readout(page, "install-confirm")).toHaveText("false");
    await expect(phase(page)).toHaveText("settled");
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);

    await keep(page, zona, "kept");
    await expect(trace(page)).toHaveText(/> settled > writing > kept$/);
    await expect(readout(page, "install-action")).toHaveText("keep");
    await expect(readout(page, "install-leg")).toHaveText("store");
    await expect(cause(page)).toHaveText("none");
    await expect(keepReason(page)).toHaveText("already-kept");
    await expect(readout(page, "install-armed")).toHaveText("false");
    await expect(putBack(page)).toHaveText("enabled");
    await expect(speech(page)).toHaveText(liveKept(NAME));
    // One store, one heartbeat waited for, one matching round of THREE.
    expect(await stepLines(page)).toEqual([
      "store ok 1",
      "refetch-system ok 1",
      "refetch-setup ok 1",
      "refetch-timer ok 1",
    ]);
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(1);
    // One RAM leg.
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(3);
    // The snapshot s three, plus one refetch round of three.
    expect(zona.seen("CONFIG", "FETCH")).toBe(6);
    expect(zona.state.flash?.[EVENT_SETUP]).toBe(pair.setup);
    expect(zona.state.flash?.[EVENT_TIMER]).toBe(pair.timer);
    expect(zona.state.systemFlash?.[EVENT_SETUP], "one store, both").toBe(
      pair.system,
    );

    // A module whose re-fetch never returns what was stored: the ACK already
    // meant stored, the proof runs out after three rounds, and the panel will
    // say so rather than call it kept.
    const second = await context.newPage();
    const secondErrors = collectErrors(second);
    const liar = await openProbe(second, moduleState(5), {
      mismatchRefetch: true,
    });
    await connectAndSnapshot(second, liar);
    await tryOn(second, "settled");
    await keep(second, liar, "kept-mismatch");
    await expect(trace(second)).toHaveText(
      /> settled > writing > kept-mismatch$/,
    );
    await expect(cause(second)).toHaveText("mismatch");
    await expect(keepReason(second)).toHaveText("after-mismatch");
    await expect(putBack(second)).toHaveText("enabled");
    const lines = await stepLines(second);
    expect(lines[0]).toBe("store ok 1");
    // THE 3 HERE IS THE ROUND COUNT AND IT DOES NOT MOVE - REFETCH_ROUNDS is
    // still three. What moved is that a round is three fetches, so a third
    // line joins the two.
    expect(lines.filter((l) => l.startsWith("refetch-system "))).toHaveLength(
      3,
    );
    expect(lines.filter((l) => l.startsWith("refetch-setup "))).toHaveLength(3);
    expect(lines.filter((l) => l.startsWith("refetch-timer "))).toHaveLength(3);
    expect(liar.seen("PAGESTORE", "EXECUTE")).toBe(1);
    expect(liar.seen("CONFIG", "EXECUTE")).toBe(3);
    // The snapshot s three, plus three rounds of three.
    expect(liar.seen("CONFIG", "FETCH")).toBe(3 + 9);

    expect(consoleErrors).toEqual([]);
    expect(secondErrors).toEqual([]);
  });

  test("one landed script is partial, none landed is nothing-landed, and both offer the way back", async ({
    context,
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    // One drop per attempt of the LAST event: the id is minted per attempt, so
    // a single nth would let attempt 2's acknowledgement land and the trace
    // would end settled.
    //
    // THE NUMBERS MOVED WITH 12-03 AND THEY ARE DERIVED, NOT COPIED. A RAM leg
    // is THREE writes now, so acknowledgement 1 is the page init and 2 is the
    // Timer - both must land - and the Setup's three attempts are 3, 4 and 5.
    const zona = await openProbe(page, moduleState(6), {
      dropAck: [
        { class_name: "CONFIG", nth: 3 },
        { class_name: "CONFIG", nth: 4 },
        { class_name: "CONFIG", nth: 5 },
      ],
    });
    await connectAndSnapshot(page, zona);
    const pair = await probePair(page);
    await tryOn(page, "partial");
    await expect(trace(page)).toHaveText(
      /^idle > snapshotting > ready > writing > partial$/,
    );
    await expect(cause(page)).toHaveText("timeout");
    await expect(keepReason(page)).toHaveText("after-partial");
    await expect(putBack(page)).toHaveText("enabled");
    await expect(readout(page, "install-armed")).toHaveText("false");
    // A timeout with no NACK anywhere in the action escalates the pacing.
    await expect(readout(page, "install-pacing")).toHaveText("true");
    expect(await stepLines(page)).toEqual([
      "write-system ok 1",
      "write-timer ok 1",
      "write-setup timeout 3",
      "restore-page-change sent 1",
    ]);
    // FIVE, NOT SIX: the page init once, the Timer once, the Setup three
    // times. A blanket multiple would have said six; the step lines above are
    // where the number comes from.
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(5);
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);
    // The page init and the Timer landed. The Setup's three writes REACHED the
    // module too - only their acknowledgements were dropped - so the fake's
    // RAM holds all three, which is exactly what HANGAR cannot know and why
    // the panel names what landed and offers PUT BACK.
    expect(zona.state.system?.[EVENT_SETUP]).toBe(pair.system);
    expect(zona.state.configs[EVENT_TIMER]).toBe(pair.timer);
    expect(zona.state.configs[EVENT_SETUP]).toBe(pair.setup);

    // A refusal on the FIRST write: one attempt, never retried, nothing
    // written, and no escalation - a NACK is not congestion. Since 12-03 the
    // first write is the PAGE INIT rather than the Timer, so the step line
    // below changed subject - but the COUNT did not move and could not: one
    // write is attempted either way.
    const second = await context.newPage();
    const secondErrors = collectErrors(second);
    const refusing = await openProbe(second, moduleState(7), {
      nackFirstWrite: true,
    });
    await connectAndSnapshot(second, refusing);
    await tryOn(second, "nothing-landed");
    await expect(trace(second)).toHaveText(
      /> ready > writing > nothing-landed$/,
    );
    await expect(cause(second)).toHaveText("nack");
    await expect(readout(second, "install-pacing")).toHaveText("false");
    await expect(keepReason(second)).toHaveText("never-tried");
    await expect(putBack(second)).toHaveText("enabled");
    const refusedLines = await stepLines(second);
    expect(refusedLines).toEqual([
      "write-system nack 1",
      "restore-page-change sent 1",
    ]);
    // The abort is proved over BOTH unreached legs now, not only the last.
    expect(refusedLines.some((l) => l.startsWith("write-timer"))).toBe(false);
    expect(refusedLines.some((l) => l.startsWith("write-setup"))).toBe(false);
    // ONE, AND UNCHANGED BY THIS PHASE: nackFirstWrite refuses the first write
    // and nothing is retried, so one write is attempted either way.
    expect(refusing.seen("CONFIG", "EXECUTE")).toBe(1);
    expect(refusing.seen("PAGESTORE", "EXECUTE")).toBe(0);
    expect(refusing.state.system?.[EVENT_SETUP]).toBe(MODULE_SYSTEM);
    expect(refusing.state.configs[EVENT_TIMER]).toBe(MODULE_TIMER);
    expect(refusing.state.configs[EVENT_SETUP]).toBe(MODULE_SETUP);

    // A FIRST write that never lands - the page init since 12-03: three
    // attempts time out with no NACK seen, and THIS one escalates. The drop
    // list is unchanged at nth 1, 2, 3 because those are still the first
    // write s three attempts, and so is the count of three.
    const third = await context.newPage();
    const thirdErrors = collectErrors(third);
    const deaf = await openProbe(third, moduleState(8), {
      dropAck: [
        { class_name: "CONFIG", nth: 1 },
        { class_name: "CONFIG", nth: 2 },
        { class_name: "CONFIG", nth: 3 },
      ],
    });
    await connectAndSnapshot(third, deaf);
    await tryOn(third, "nothing-landed");
    await expect(cause(third)).toHaveText("timeout");
    await expect(readout(third, "install-pacing")).toHaveText("true");
    await expect(keepReason(third)).toHaveText("never-tried");
    await expect(putBack(third)).toHaveText("enabled");
    expect(await stepLines(third)).toEqual([
      "write-system timeout 3",
      "restore-page-change sent 1",
    ]);
    // THREE, AND UNCHANGED: the first write is attempted three times and the
    // leg aborts, whichever event the first write is.
    expect(deaf.seen("CONFIG", "EXECUTE")).toBe(3);
    expect(deaf.seen("PAGESTORE", "EXECUTE")).toBe(0);

    expect(consoleErrors).toEqual([]);
    expect(secondErrors).toEqual([]);
    expect(thirdErrors).toEqual([]);
  });

  test("an unplug mid-write is lost, and the put-back waits for the module", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    const zona = await openProbe(page, moduleState(9));
    await connectAndSnapshot(page, zona);
    const snapshotLine = await readout(page, "install-snapshot").innerText();
    const moduleId = await readout(page, "install-module").innerText();

    // The cable comes out as the first CONFIG/EXECUTE leaves: the snapshot's
    // FIVE frames - the serial, three fetches and the page count (13-12) - are
    // on the wire already, so the next write is the sixth.
    const n = (await writesOf(page)).length + 1;
    expect(n).toBe(6);
    await page.evaluate(
      (count) => window.__hangarSerial.unplugAfterWrites(0, count),
      n,
    );
    await tryOn(page, "lost");
    await expect(trace(page)).toHaveText(
      /^idle > snapshotting > ready > writing > lost$/,
    );
    await expect(cause(page)).toHaveText("aborted");
    await expect(putBack(page)).toHaveText("needs-zona");
    await expect(sessionPhase(page)).toHaveText("unplugged-while-connected");
    await expect(speech(page)).toHaveText(LOST_SPOKEN);
    const spoken = await speech(page).innerText();
    expect(spoken).toContain("mid-write");
    expect(spoken).not.toContain("Nothing was written");
    // The timer write is the aborted step. The RAM leg's finally then sends
    // the restore heartbeat on EVERY path (sequence.ts restorePageChange);
    // whether that `sent` step is recorded depends on whether the session's
    // teardown has already closed the port when the finally runs - a race
    // between two handlers of one disconnect event - so both records are
    // accepted here and the one seen is printed. Nothing after the abort is
    // ever a write of a config.
    const lostLines = await stepLines(page);
    console.log(`steps at lost: ${lostLines.join(" | ")}`);
    expect(lostLines[0]).toBe("write-system aborted 1");
    expect(lostLines.slice(1)).toEqual(
      lostLines.length > 1 ? ["restore-page-change sent 1"] : [],
    );
    // The abort is proved over BOTH unreached legs, not only the last.
    expect(lostLines.some((l) => l.startsWith("write-timer"))).toBe(false);
    expect(lostLines.some((l) => l.startsWith("write-setup"))).toBe(false);

    // The write that caused it is recorded, and it never reached the module:
    // the nth chunk decodes as the PAGE INIT write - element 255, event 0 -
    // and Node counted no CONFIG/EXECUTE at all. The ELEMENT is asserted as
    // well as the event, because 255/0 and 0/0 share an event number.
    const written = await writesOf(page);
    console.log(`writes recorded at lost: ${written.length} (unplug at ${n})`);
    expect(written.length).toBeGreaterThanOrEqual(n);
    const causing = [...Buffer.from(written[n - 1], "hex")];
    causing.pop();
    const decoded = decodeFrame(causing);
    expect(decoded.ok && decoded.classes[0]?.class_name).toBe("CONFIG");
    expect(decoded.ok && decoded.classes[0]?.class_instr).toBe("EXECUTE");
    expect(
      decoded.ok && Number(decoded.classes[0]?.class_parameters.ELEMENTNUMBER),
    ).toBe(ELEMENT_SYSTEM);
    expect(
      decoded.ok && Number(decoded.classes[0]?.class_parameters.EVENTTYPE),
    ).toBe(EVENT_SETUP);
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(0);
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);

    // The cable goes back in: a NEW port object, the offer, one click, the
    // heartbeats into the new index, and the record wins over the fresh
    // fetch - the way back survived the unplug.
    const replugged = await page.evaluate(() => window.__hangarSerial.replug());
    expect(replugged).toBe(1);
    await expect(sessionPhase(page)).toHaveText("detected");
    await expect(putBack(page)).toHaveText("needs-zona");
    await connectAndSnapshot(page, zona, replugged);
    await expect(trace(page)).toHaveText(/> lost > snapshotting > ready$/);
    await expect(putBack(page)).toHaveText("enabled");
    await expect(readout(page, "install-snapshot")).toHaveText(snapshotLine);
    expect(snapshotLine.startsWith("durable ")).toBe(true);
    await expect(readout(page, "install-module")).toHaveText(moduleId);
    // The SERIALNUMBER count does NOT move: one per connect, and there are
    // still two connects. The config fetches are two snapshots of three.
    expect(zona.seen("SERIALNUMBER", "FETCH")).toBe(2);
    expect(zona.seen("CONFIG", "FETCH")).toBe(6);
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(0);
    expect(consoleErrors).toEqual([]);
  });

  test("a store that never confirms, on both the keep and the put-back legs, is said out loud", async ({
    context,
    page,
  }) => {
    test.slow();
    const startedAt = Date.now();
    const consoleErrors = collectErrors(page);
    // One drop per attempt: three PAGESTORE acknowledgements never arrive.
    const zona = await openProbe(page, moduleState(10), {
      dropAck: [
        { class_name: "PAGESTORE", nth: 1 },
        { class_name: "PAGESTORE", nth: 2 },
        { class_name: "PAGESTORE", nth: 3 },
      ],
    });
    await connectAndSnapshot(page, zona);
    await tryOn(page, "settled");
    await click(page, "install-keep");
    await expect(readout(page, "install-confirm")).toHaveText("true");
    await click(page, "install-keep-yes");
    // Three pagestoreMs timeouts with backoff between: about 9.4 s.
    await expect(phase(page)).toHaveText("unconfirmed", { timeout: 20_000 });
    await expect(trace(page)).toHaveText(/> settled > writing > unconfirmed$/);
    await expect(cause(page)).toHaveText("timeout");
    // KEEP ON DEVICE is live again: memory still holds what was heard (I11).
    await expect(keepReason(page)).toHaveText("live");
    await expect(readout(page, "install-armed")).toHaveText("true");
    await expect(readout(page, "install-slow")).toHaveText("false");
    await expect(speech(page)).toHaveText(UNCONFIRMED_SPOKEN);
    expect(await stepLines(page)).toEqual(["store timeout 3"]);
    // A STORE leg is one write per attempt, so the PAGESTORE count does not
    // move. The CONFIG count is one RAM leg of three.
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(3);
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(3);
    const firstLegMs = Date.now() - startedAt;

    // A keep that landed, then a put-back whose own store never confirms:
    // the counter is cumulative, the keep took acknowledgement 1, so the
    // put-back's three attempts lose 2, 3 and 4.
    const second = await context.newPage();
    const secondErrors = collectErrors(second);
    const kept = await openProbe(second, moduleState(11));
    await connectAndSnapshot(second, kept);
    await tryOn(second, "settled");
    await keep(second, kept, "kept");
    expect(kept.seen("PAGESTORE", "EXECUTE")).toBe(1);
    kept.script({
      dropAck: [
        { class_name: "PAGESTORE", nth: 2 },
        { class_name: "PAGESTORE", nth: 3 },
        { class_name: "PAGESTORE", nth: 4 },
      ],
    });
    await click(second, "install-put-back-click");
    await expect(phase(second)).toHaveText("restored-unconfirmed", {
      timeout: 20_000,
    });
    await expect(trace(second)).toHaveText(
      /> kept > writing > restored-unconfirmed$/,
    );
    await expect(readout(second, "install-action")).toHaveText("put-back");
    await expect(readout(second, "install-leg")).toHaveText("store");
    await expect(cause(second)).toHaveText("timeout");
    await expect(keepReason(second)).toHaveText("never-tried");
    await expect(putBack(second)).toHaveText("enabled");
    // Both legs of one put-back in one record: the RAM leg's FOUR steps, then
    // the store that never confirmed.
    expect(await stepLines(second)).toEqual([
      "write-system ok 1",
      "write-timer ok 1",
      "write-setup ok 1",
      "restore-page-change sent 1",
      "store timeout 3",
    ]);
    // 1 + 3 store attempts, unmoved: a store leg is one write per attempt.
    expect(kept.seen("PAGESTORE", "EXECUTE")).toBe(1 + 3);
    // Two RAM legs of three.
    expect(kept.seen("CONFIG", "EXECUTE")).toBe(6);
    // RAM is the original again; what the fake's flash holds is exactly what
    // HANGAR cannot know, and is not asserted.
    expect(kept.state.configs[EVENT_SETUP]).toBe(MODULE_SETUP);
    expect(kept.state.configs[EVENT_TIMER]).toBe(MODULE_TIMER);

    const wallMs = Date.now() - startedAt;
    console.log(
      `test 6 wall time ${wallMs} ms (first leg ${firstLegMs} ms, second leg ${wallMs - firstLegMs} ms)`,
    );
    expect(consoleErrors).toEqual([]);
    expect(secondErrors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The real page (plan 07-12). Everything below opens /playground/aurora/ and drives the
// shipped panel, header and live region through the same shim and the same
// Node responder as the probe walks above.

const ENTRY = "aurora";
/** The catalog's name for the entry, interpolated raw by install-copy (never re-cased). */
const ENTRY_NAME = "Aurora";

/** The two chained modules the rig test puts on the cable, by the HWCFG their heartbeats report. */
const EN16_HWCFG = 195;
const BU16_HWCFG = 131;
/** The firmware every heartbeat here reports - the same RevH fake-zona.ts reports for the ZONA. */
const RIG_FIRMWARE = { major: 1, minor: 5, patch: 5 };

const hexOf = (frame: number[]): string =>
  Buffer.from([...frame, TERMINATOR]).toString("hex");

/** A chained module's heartbeat: TYPE 0, no page report, from its own address (install.spec.ts). */
const otherHeartbeatHex = (sx: number, hwcfg: number): string =>
  hexOf(
    heartbeatFrame({
      sx,
      sy: 0,
      type: 0,
      hwcfg,
      activePage: ACTIVE_PAGE,
      firmware: RIG_FIRMWARE,
    }),
  );

/** A chained module as the rig responder needs it: an address, the page, nothing in RAM. */
const rigModule = (sx: number): ZonaState => ({
  sx,
  sy: 0,
  activePage: ACTIVE_PAGE,
  configs: {},
});

/** The sentence a keep or a put-back speaks when the cable comes out mid-write. */
const LOST_ON_PAGE = announceTitle(lostBlock(false, TRY_ON_LABEL).title);

const canvasOf = (id: string) => `[data-testid="pad-canvas-${id}"]`;

/**
 * Wait until the pad has a picture at all: the simulator arrives through a
 * dynamic import after the prerendered frames have painted, and a panel
 * opened before that races the band's own readiness. (e2e/tuning.e2e.ts)
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

/** Both meters settled on a number: the tuner's pair is published and the primary can write. (e2e/tuning.e2e.ts) */
async function metersSettled(page: Page): Promise<void> {
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

/** A knob change MEASURED, not merely applied: the stale phase first, then the settle. (e2e/tuning.e2e.ts) */
async function recomputed(page: Page): Promise<void> {
  await expect(
    page.getByTestId("meter-setup"),
    "the change went through the debounced recompile",
  ).toHaveAttribute("aria-busy", "true", { timeout: 5_000 });
  await metersSettled(page);
}

const rails = (page: Page) =>
  page.locator("[data-testid='knob-rack'] input[type='range']");

/** One keyboard step on a rail, then let the debounce land. */
async function turnRail(
  page: Page,
  at: number,
  key: "ArrowRight" | "ArrowLeft" = "ArrowRight",
): Promise<void> {
  await rails(page).nth(at).focus();
  await page.keyboard.press(key);
  await recomputed(page);
}

/**
 * The chosen /playground/<id>/ with landed meters. The deep link may already be
 * chosen; if not, Enter on the band chooses it (e2e/tuning.e2e.ts openPanel).
 *
 * `id` defaults to ENTRY, which is what every test before plan 12-01 wanted.
 * The knob-to-wire title needs LUMEN's panel, so the entry is a parameter
 * rather than a constant read from the module scope.
 */
async function openPanel(page: Page, id: string = ENTRY): Promise<void> {
  await page.goto(`/playground/${id}/`);
  // Since 13-09 the workspace opens with its panel and its inspector on the
  // page; there is nothing to choose, and the inspector renders one rack per
  // section, so the rack locator takes the first.
  await expect(page.getByTestId("workspace")).toBeVisible();
  await waitForPicture(page, id);
  await expect(page.getByTestId("workspace")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.getByTestId("chosen-panel")).toBeVisible();
  await expect(page.getByTestId("knob-rack").first()).toBeVisible();
  await metersSettled(page);
}

/**
 * The VISIBLE line of a reserved cell. Every cell on the panel renders all of
 * its candidate strings as sizing twins at grid-area 1 / 1, the inactive ones
 * visibility: hidden and aria-hidden, so textContent of the cell is every
 * string at once; the one on screen is the one not hidden.
 */
const visibleLine = (page: Page, testid: string) =>
  page.getByTestId(testid).locator('p[aria-hidden="false"]');
/** The honesty slot's visible sentence. Its cell carries an id, not a testid. */
const honesty = (page: Page) =>
  page.locator('#try-on-reason p[aria-hidden="false"]');

const primary = (page: Page) => page.getByTestId("try-on-device");
const putBackControl = (page: Page) => page.getByTestId("put-back");
const keepControl = (page: Page) => page.getByTestId("keep-on-device");
const clearControl = (page: Page) => page.getByTestId("clear");

/**
 * True when nothing anywhere on the page is CLEAR's confirmation. There is no
 * such component (A-45, D-19) and there is no such testid, so this is a proof
 * of an absence rather than of a state: CLEAR writes RAM only, PUT BACK
 * directly above it undoes it, and a power cycle undoes it, so KEEP ON
 * DEVICE's block is the site's only confirmation. Asserted at rest, inside
 * the write and after it lands.
 */
const noConfirmOnScreen = async (page: Page): Promise<boolean> =>
  (await page.locator('[data-testid="clear-confirm"]').count()) === 0;
const installState = (page: Page) => page.getByTestId("install-state");
const sessionLive = (page: Page) => page.getByTestId("session-live");

/**
 * Expose the module, grant its port BEFORE the page loads, open the chosen
 * panel and assert the precondition every test here shares: the shim is
 * installed and the grant is what the browser would list.
 */
async function openReal(
  page: Page,
  state: ZonaState,
  script?: ZonaScript,
  id: string = ENTRY,
): Promise<ExposedZona> {
  const zona = await installZona(page, state, script);
  await page.addInitScript(() => {
    window.__hangarSerial.grant();
  });
  await openPanel(page, id);
  expect(
    await page.evaluate(async () => ({
      hasSerial: "serial" in navigator,
      listed: (await navigator.serial.getPorts()).length,
    })),
  ).toEqual({ hasSerial: true, listed: 1 });
  return zona;
}

/** What beatUntilShows reads after each beat: one element's text, or one of its attributes. */
interface Mark {
  selector: string;
  attribute?: string;
  /** The reading must equal this... */
  equals?: string;
  /** ...or contain this. */
  includes?: string;
}

/**
 * Push heartbeats into port `index` until the mark reads as asked; return how
 * many it took. After each beat the page is polled for about one heartbeat
 * period. `extra` frames (a rig's other modules) are pushed before the ZONA's
 * on every beat, because a rig's others reach the identity only on the ZONA's
 * next heartbeat (deferred item 13). Throws rather than returning quietly
 * when the bound is reached, naming the last reading.
 */
async function beatUntilShows(
  page: Page,
  zona: ExposedZona,
  index: number,
  mark: Mark,
  max = 12,
  extra: string[] = [],
): Promise<number> {
  for (let n = 1; n <= max; n++) {
    await page.evaluate(
      ([i, frames]) => {
        for (const hex of frames) window.__hangarSerial.beat(i, hex);
      },
      [index, [...extra, zona.heartbeatHex()]] as const,
    );
    const reached = await page.evaluate(async (m) => {
      const read = (): string | null => {
        const el = document.querySelector(m.selector);
        if (!el) return null;
        return m.attribute
          ? el.getAttribute(m.attribute)
          : (el.textContent ?? "").trim();
      };
      const ok = (): boolean => {
        const value = read();
        if (value === null) return false;
        if (m.equals !== undefined) return value === m.equals;
        return m.includes !== undefined && value.includes(m.includes);
      };
      for (let waited = 0; waited < 300; waited += 10) {
        if (ok()) return true;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      return ok();
    }, mark);
    if (reached) return n;
  }
  const last = await page.evaluate((m) => {
    const el = document.querySelector(m.selector);
    if (!el) return null;
    return m.attribute ? el.getAttribute(m.attribute) : el.textContent;
  }, mark);
  throw new Error(
    `${mark.selector} never read ${mark.equals ?? mark.includes} after ${max} heartbeats; it reads ${JSON.stringify(last)}`,
  );
}

/** The panel's state block includes this text. */
const stateShows = (needle: string): Mark => ({
  selector: '[data-testid="install-state"]',
  includes: needle,
});

/**
 * The connect sequence on the real page: the FIRST click on TRY ON DEVICE is
 * the session's (it connects the granted port with no picker); heartbeats
 * until the header slot reads the identity; then the snapshot lands and the
 * honesty slot reads its ready form. Returns the heartbeats identification
 * needed.
 */
async function connectOnPage(
  page: Page,
  zona: ExposedZona,
  extraBeats: string[] = [],
): Promise<number> {
  await expect(page.getByTestId("device-slot")).toHaveAttribute(
    "data-slot",
    "S2",
  );
  await primary(page).click();
  const beats = await beatUntilShows(
    page,
    zona,
    0,
    {
      selector: '[data-testid="device-slot"]',
      attribute: "data-slot",
      equals: "S4",
    },
    80,
    extraBeats,
  );
  await expect(installState(page)).toContainText(IDENTIFIED_CAPTION);
  await expect(honesty(page)).toHaveText(HONESTY_READY);
  return beats;
}

/** One try-on on the real page, from ready or any settled state, to PLAYING NOW. */
async function tryOnPage(page: Page, name: string = ENTRY_NAME): Promise<void> {
  await primary(page).click();
  await expect(installState(page)).toContainText(SETTLED_CAPTION, {
    timeout: 10_000,
  });
  await expect(installState(page)).toContainText(settledBody(name));
}

/** Open the confirmation, commit it, and pace heartbeats until KEPT. */
async function keepOnPage(page: Page, zona: ExposedZona): Promise<number> {
  await keepControl(page).click();
  await expect(page.getByTestId("keep-confirm")).toBeVisible();
  await page.getByTestId("keep-confirm-yes").click();
  const beats = await beatUntilShows(page, zona, 0, stateShows(KEPT_CAPTION));
  await expect(installState(page)).toContainText(keptBody(ENTRY_NAME));
  return beats;
}

/** The three live regions' testids, in document order (e2e/session.e2e.ts). */
const LIVE_REGIONS = ["session-live", "tuning-live", "browse-live"] as const;

/** Start recording every text change in each live region that exists on the page. */
function recordLiveRegions(page: Page): Promise<void> {
  return page.evaluate((ids) => {
    const log: Record<string, string[]> = {};
    window.__hangarInstallLiveLog = log;
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
      log: window.__hangarInstallLiveLog ?? {},
    };
  }, LIVE_REGIONS);
}

/** The distinct utterances a region made: its recorded texts with the empties dropped. */
const utterances = (recorded: string[] | undefined): string[] =>
  (recorded ?? []).filter((text) => text !== "");

test.describe("the install flow on the real page, with a ZONA that answers from Node", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(FAKE_SERIAL);
  });

  test("the panel writes on a click, says PLAYING NOW, and locks the header while it writes", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    const zona = await openReal(page, moduleState(12));
    await connectOnPage(page, zona);

    // I2 on the page a visitor sees: the ready sentence, PUT BACK offered
    // with its line, KEEP ON DEVICE waiting for a try-on.
    await expect(honesty(page)).toHaveText(HONESTY_READY);
    await expect(putBackControl(page)).toBeVisible();
    await expect(putBackControl(page)).toBeEnabled();
    await expect(visibleLine(page, "put-back-line")).toHaveText(
      // 13-12: the line names the page the snapshot holds (D-06).
      putBackPageLine(ACTIVE_PAGE),
    );
    await expect(keepControl(page)).toBeDisabled();
    await expect(visibleLine(page, "keep-on-device-line")).toHaveText(
      KEEP_REASONS["never-tried"],
    );
    await expect(primary(page)).toBeEnabled();
    await expect(primary(page)).toHaveText(TRY_ON_LABEL);

    // Hold each CONFIG acknowledgement 200 ms in Node - strictly under
    // executeMs 250, so both events land on attempt 1 and the leg is a window
    // of about 400 ms. Installed AFTER the connect sequence: the snapshot's
    // reads are not what this test is about.
    zona.script({ delayAckMs: { class_name: "CONFIG", byMs: 200 } });
    const clickedAt = Date.now();
    await primary(page).click();

    // Inside the window: the busy label, and everything I3 says around it,
    // read in one snapshot so the round trips do not spend the window.
    await expect(primary(page)).toHaveText(WRITING_LABEL);
    const busySeenAt = Date.now() - clickedAt;
    const during = await page.evaluate(() => {
      const q = (id: string) =>
        document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
      const primary = q("try-on-device") as HTMLButtonElement | null;
      const label = primary?.querySelector<HTMLElement>(".label") ?? null;
      return {
        label: label?.textContent?.trim() ?? null,
        busy: primary?.getAttribute("aria-busy") ?? null,
        disabled: primary?.disabled ?? null,
        putBackDisabled:
          (q("put-back") as HTMLButtonElement | null)?.disabled ?? null,
        keepDisabled:
          (q("keep-on-device") as HTMLButtonElement | null)?.disabled ?? null,
        honesty:
          document
            .querySelector('#try-on-reason p[aria-hidden="false"]')
            ?.textContent?.trim() ?? null,
        statusBusy: q("connect-status")?.getAttribute("aria-busy") ?? null,
        stateBusy: q("install-state")?.getAttribute("aria-busy") ?? null,
        stateText: q("install-state")?.textContent?.trim() ?? null,
        transition: label ? getComputedStyle(label).transitionDuration : null,
        panels: document.querySelectorAll('[data-testid="chosen-panel"]')
          .length,
      };
    });
    const snapshotAt = Date.now() - clickedAt;
    expect(during.label).toBe(WRITING_LABEL);
    expect(during.busy).toBe("true");
    expect(during.disabled).toBe(true);
    // I3 rule 3: all three install controls disabled, whichever was clicked.
    expect(during.putBackDisabled).toBe(true);
    expect(during.keepDisabled).toBe(true);
    // I3 rule 4: the honesty slot holds whatever string it was holding, and
    // region 3 holds the previous block under aria-busy.
    expect(during.honesty).toBe(HONESTY_READY);
    expect(during.statusBusy).toBe("true");
    expect(during.stateBusy).toBe("true");
    expect(during.stateText).toContain(IDENTIFIED_CAPTION);
    // I3 rule 1: the busy label swaps with no transition. The label span's
    // computed transition-duration is 0s; the control's own transitions are
    // its hover filter and glow, never its text.
    expect(during.transition).toBe("0s");
    expect(during.panels).toBe(1);

    // THE HEADER LOCK. Since 13-09 the panel is always on the page and the
    // header's drawer opens beside it (the workspace hands the slot
    // panelOwnsProse false), so the lock is reached with one click where
    // deferred item 19 needed a Back. Still inside the window.
    await page.getByTestId("device-slot").click();
    const disconnect = page.getByTestId("details-disconnect");
    const forget = page.getByTestId("details-forget");
    await expect(disconnect).toBeDisabled();
    const lockSeenAt = Date.now() - clickedAt;
    const locked = await page.evaluate(() => {
      const q = (id: string) =>
        document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
      const reason = q("write-lock-reason");
      return {
        forgetDisabled:
          (q("details-forget") as HTMLButtonElement | null)?.disabled ?? null,
        reason: reason?.textContent?.trim() ?? null,
        reasonId: reason?.id ?? null,
        disconnectDescribedBy:
          q("details-disconnect")?.getAttribute("aria-describedby") ?? null,
        forgetDescribedBy:
          q("details-forget")?.getAttribute("aria-describedby") ?? null,
      };
    });
    expect(locked.forgetDisabled).toBe(true);
    expect(locked.reason).toBe(WRITE_LOCK_REASON);
    // The reason is the aria-describedby target of BOTH controls.
    expect(locked.disconnectDescribedBy).toBe(locked.reasonId);
    expect(locked.forgetDescribedBy).toBe(locked.reasonId);

    // Then it lands: the lock releases and the reason line leaves.
    await expect(disconnect).toBeEnabled();
    const releasedAt = Date.now() - clickedAt;
    await expect(forget).toBeEnabled();
    await expect(page.getByTestId("write-lock-reason")).toHaveCount(0);
    console.log(
      `test 7 timing: WRITING at +${busySeenAt} ms, panel snapshot at +${snapshotAt} ms, header locked at +${lockSeenAt} ms, released at +${releasedAt} ms`,
    );

    // The drawer closed, the panel reads the settled state the write produced:
    // PLAYING NOW, the label back at rest, KEEP ON DEVICE enabled - the one
    // and only path to it (I4).
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("chosen-panel")).toBeVisible();
    await expect(installState(page)).toContainText(SETTLED_CAPTION);
    await expect(installState(page)).toContainText(settledBody(ENTRY_NAME));
    await expect(installState(page)).not.toHaveAttribute("aria-busy", "true");
    await expect(primary(page)).toHaveText(TRY_ON_LABEL);
    await expect(primary(page)).not.toHaveAttribute("aria-busy", "true");
    await expect(primary(page)).toBeEnabled();
    await expect(honesty(page)).toHaveText(HONESTY_READY);
    await expect(putBackControl(page)).toBeEnabled();
    await expect(keepControl(page)).toBeEnabled();
    await expect(visibleLine(page, "keep-on-device-line")).toHaveText(
      KEEP_LINE_ENABLED,
    );

    // The wire: one try-on, all three acknowledgements on attempt 1, nothing
    // stored.
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(3);
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);
    expect(zona.seen("HEARTBEAT", "EXECUTE")).toBe(1);
    expect(consoleErrors).toEqual([]);
  });

  test("the flash confirmation replaces the control, names what it replaces, and moves focus deliberately", async ({
    context,
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    const zona = await openReal(page, moduleState(13));
    await connectOnPage(page, zona);
    await tryOnPage(page);
    await expect(keepControl(page)).toBeEnabled();

    // Open: the block is where the control was, never both on screen, and
    // focus is on the GROUP, not on either button - so no key press commits
    // without a deliberate move.
    await keepControl(page).click();
    const confirm = page.getByTestId("keep-confirm");
    await expect(confirm).toBeVisible();
    await expect(keepControl(page)).toHaveCount(0);
    await expect(confirm).toBeFocused();
    await expect(confirm).toHaveAttribute("role", "group");
    await expect(confirm).toHaveAttribute("tabindex", "-1");
    expect(await page.locator('[role="dialog"]').count()).toBe(0);
    expect(await page.locator("[aria-modal]").count()).toBe(0);
    const sentences = confirm.locator("p");
    await expect(sentences).toHaveCount(3);
    await expect(sentences.nth(0)).toHaveText(CONFIRM_CAPTION);
    await expect(sentences.nth(1)).toHaveText(CONFIRM_REPLACES);
    expect(CONFIRM_REPLACES).toContain("touch element");
    expect(CONFIRM_REPLACES).toContain("survives a power cycle");
    await expect(sentences.nth(2)).toHaveText(CONFIRM_WAY_BACK);
    // The group is labelled by the caption and described by its sentences.
    const captionId = await sentences.nth(0).getAttribute("id");
    expect(await confirm.getAttribute("aria-labelledby")).toBe(captionId);
    expect(
      (await confirm.getAttribute("aria-describedby"))?.split(" "),
    ).toEqual([
      await sentences.nth(1).getAttribute("id"),
      await sentences.nth(2).getAttribute("id"),
    ]);

    // The first Tab reaches the affirmative, the second NOT NOW.
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("keep-confirm-yes")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("keep-confirm-no")).toBeFocused();

    // NOT NOW: the block leaves, the row's control is back and holds focus,
    // and nothing was sent.
    await page.getByTestId("keep-confirm-no").click();
    await expect(confirm).toHaveCount(0);
    await expect(keepControl(page)).toBeVisible();
    await expect(keepControl(page)).toBeFocused();
    await expect(keepControl(page)).toBeEnabled();
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);

    // Escape inside the block is NOT NOW; the panel stays chosen (Z-10).
    await keepControl(page).click();
    await expect(confirm).toBeVisible();
    await expect(confirm).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(confirm).toHaveCount(0);
    await expect(page.getByTestId("chosen-panel")).toHaveCount(1);
    await expect(keepControl(page)).toBeFocused();
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);

    // The commit: KEPT after the acknowledgement, the ZONA's heartbeat and the
    // re-fetch proof; focus went to region 3 because the row's control came
    // back disabled; PUT BACK's line says it will store too.
    await keepControl(page).click();
    await expect(confirm).toBeVisible();
    await page.getByTestId("keep-confirm-yes").click();
    await expect(confirm).toHaveCount(0);
    await expect(page.getByTestId("connect-status")).toBeFocused();
    const beats = await beatUntilShows(page, zona, 0, stateShows(KEPT_CAPTION));
    console.log(`test 8: KEPT after ${beats} heartbeat(s)`);
    await expect(installState(page)).toContainText(keptBody(ENTRY_NAME));
    await expect(installState(page)).toContainText(KEPT_PROOF_LINE);
    await expect(page.getByTestId("connect-status")).toBeFocused();
    await expect(keepControl(page)).toBeDisabled();
    await expect(visibleLine(page, "keep-on-device-line")).toHaveText(
      KEEP_REASONS["already-kept"],
    );
    await expect(visibleLine(page, "put-back-line")).toHaveText(
      putBackPageLineAfterKeep(ACTIVE_PAGE),
    );
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(1);
    // One try-on, three writes.
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(3);
    expect(zona.state.flash?.[EVENT_SETUP]).not.toBe(MODULE_SETUP);

    // On a rig, the fourth sentence names the others and says their pages are
    // stored too (SAFE-06). The others reach the identity only on the ZONA's
    // heartbeat after theirs (deferred item 13), so the rig's beats ride
    // along with every ZONA beat here.
    const second = await context.newPage();
    const secondErrors = collectErrors(second);
    const rigBeats = [
      otherHeartbeatHex(1, EN16_HWCFG),
      otherHeartbeatHex(2, BU16_HWCFG),
    ];
    const rig = await openReal(second, moduleState(14), {
      rig: [rigModule(1), rigModule(2)],
    });
    await connectOnPage(second, rig, rigBeats);
    await tryOnPage(second);
    await keepControl(second).click();
    const rigConfirm = second.getByTestId("keep-confirm");
    await expect(rigConfirm).toBeVisible();
    await beatUntilShows(
      second,
      rig,
      0,
      { selector: '[data-testid="keep-confirm"]', includes: "same cable" },
      12,
      rigBeats,
    );
    const rigSentences = rigConfirm.locator("p");
    await expect(rigSentences).toHaveCount(4);
    await expect(rigSentences.nth(3)).toHaveText(
      confirmRig(["EN16", "BU16"]) ?? "",
    );
    expect(
      (await rigConfirm.getAttribute("aria-describedby"))?.split(" "),
    ).toHaveLength(3);
    // Nothing stored on the rig page: the confirmation was read, not taken.
    await second.getByTestId("keep-confirm-no").click();
    await expect(rigConfirm).toHaveCount(0);
    expect(rig.seen("PAGESTORE", "EXECUTE")).toBe(0);
    // One try-on, three writes.
    expect(rig.seen("CONFIG", "EXECUTE")).toBe(3);

    expect(consoleErrors).toEqual([]);
    expect(secondErrors).toEqual([]);
  });

  test("after a keep, PUT BACK stores too and KEEP ON DEVICE waits for another try-on", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    const zona = await openReal(page, moduleState(15));
    await connectOnPage(page, zona);
    await tryOnPage(page);
    await keepOnPage(page, zona);
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(1);
    await expect(visibleLine(page, "put-back-line")).toHaveText(
      putBackPageLineAfterKeep(ACTIVE_PAGE),
    );

    // Hold the store acknowledgement so the put-back's STORE leg is on screen
    // long enough to read: I5's interval, between the two RAM acknowledgements
    // and the proof.
    zona.script({ delayAckMs: { class_name: "PAGESTORE", byMs: 600 } });
    await putBackControl(page).click();
    await expect(putBackControl(page)).toHaveText(PUTTING_BACK_LABEL);
    await expect(installState(page)).toContainText(RESTORED_CAPTION);
    const interval = await page.evaluate(() => {
      const q = (id: string) =>
        document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
      const putBack = q("put-back") as HTMLButtonElement | null;
      const primary = q("try-on-device") as HTMLButtonElement | null;
      return {
        putBackLabel: putBack?.textContent?.trim() ?? null,
        putBackBusy: putBack?.getAttribute("aria-busy") ?? null,
        putBackDisabled: putBack?.disabled ?? null,
        primaryLabel: primary?.textContent?.trim() ?? null,
        primaryDisabled: primary?.disabled ?? null,
        primaryBusy: primary?.getAttribute("aria-busy") ?? null,
        keepDisabled:
          (q("keep-on-device") as HTMLButtonElement | null)?.disabled ?? null,
        stateBusy: q("install-state")?.getAttribute("aria-busy") ?? null,
        stateText: q("install-state")?.textContent?.trim() ?? null,
      };
    });
    // I3: PUTTING BACK… with aria-busy on PUT BACK itself through the store
    // leg; the primary keeps its resting label, disabled, and carries no busy
    // word - there is no fourth label.
    expect(interval.putBackLabel).toBe(PUTTING_BACK_LABEL);
    expect(interval.putBackBusy).toBe("true");
    expect(interval.putBackDisabled).toBe(true);
    expect(interval.primaryLabel).toBe(TRY_ON_LABEL);
    expect(interval.primaryDisabled).toBe(true);
    expect(interval.primaryBusy).toBeNull();
    expect(interval.keepDisabled).toBe(true);
    // I5's interval: RESTORED's caption and first line, region 3 still busy,
    // and the power-cycle claim NOT yet made.
    expect(interval.stateBusy).toBe("true");
    expect(interval.stateText).toContain(RESTORED_CAPTION);
    expect(interval.stateText).toContain(RESTORED_BODY);
    expect(interval.stateText).not.toContain(RESTORED_STORED_LINE);

    // The proof needs the ZONA's heartbeat after the held acknowledgement
    // lands, and the landing is invisible from here: the bounded beat loop.
    const beats = await beatUntilShows(
      page,
      zona,
      0,
      stateShows(RESTORED_STORED_LINE),
    );
    console.log(
      `test 9: RESTORED with the stored line after ${beats} heartbeat(s)`,
    );
    await expect(installState(page)).not.toHaveAttribute("aria-busy", "true");
    await expect(putBackControl(page)).toHaveText(PUT_BACK_LABEL);
    await expect(putBackControl(page)).toBeEnabled();
    await expect(putBackControl(page)).not.toHaveAttribute("aria-busy", "true");
    // The keep is undone: the line is back to its first form, and KEEP ON
    // DEVICE waits for another try-on.
    await expect(visibleLine(page, "put-back-line")).toHaveText(
      // 13-12: the line names the page the snapshot holds (D-06).
      putBackPageLine(ACTIVE_PAGE),
    );
    await expect(keepControl(page)).toBeDisabled();
    await expect(visibleLine(page, "keep-on-device-line")).toHaveText(
      KEEP_REASONS["never-tried"],
    );
    await expect(primary(page)).toBeEnabled();
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(2);
    // The module's RAM and flash are its own again.
    expect(zona.state.configs[EVENT_SETUP]).toBe(MODULE_SETUP);
    expect(zona.state.configs[EVENT_TIMER]).toBe(MODULE_TIMER);
    expect(zona.state.flash?.[EVENT_SETUP]).toBe(MODULE_SETUP);
    expect(zona.state.flash?.[EVENT_TIMER]).toBe(MODULE_TIMER);

    // Flash only what you have heard (Z-05): a knob turn, a try-on, KEEP ON
    // DEVICE live; the confirmation open; the knob turned back - the block
    // closes and the reason names the knobs.
    zona.script({});
    await turnRail(page, 0);
    await tryOnPage(page);
    await expect(keepControl(page)).toBeEnabled();
    await expect(visibleLine(page, "keep-on-device-line")).toHaveText(
      KEEP_LINE_ENABLED,
    );
    await keepControl(page).click();
    await expect(page.getByTestId("keep-confirm")).toBeVisible();
    await turnRail(page, 0, "ArrowLeft");
    await expect(page.getByTestId("keep-confirm")).toHaveCount(0);
    await expect(keepControl(page)).toBeDisabled();
    await expect(visibleLine(page, "keep-on-device-line")).toHaveText(
      KEEP_REASONS["knobs-moved"],
    );
    // A knob move closing the confirmation sends focus to region 3 (the
    // row's control cannot hold it).
    await expect(page.getByTestId("connect-status")).toBeFocused();

    // The wire: the keep and the put-back's store; three RAM legs (two
    // try-ons and the put-back's), three writes each.
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(2);
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(9);
    expect(consoleErrors).toEqual([]);
  });

  test("the live region speaks once per outcome, and Escape is ignored while writing", async ({
    page,
  }) => {
    test.slow();
    const startedAt = Date.now();
    const consoleErrors = collectErrors(page);
    const zona = await openReal(page, moduleState(16));
    await connectOnPage(page, zona);
    // I1 to I2: the snapshot sentence, the one the region reads after a
    // connect on a module that answers (07-08 deferred item 9).
    await expect(sessionLive(page)).toHaveText(LIVE_SNAPSHOT_SAVED);

    await tryOnPage(page);
    await expect(sessionLive(page)).toHaveText(liveSettled(ENTRY_NAME));

    // THE SLOW LINE, on the keep's STORE leg - never a RAM leg, where a
    // 2500 ms hold would make every acknowledgement stale at executeMs 250.
    // The script is switched after the confirmation opens and before the
    // commit, so the hold covers exactly one acknowledgement.
    await keepControl(page).click();
    const confirm = page.getByTestId("keep-confirm");
    await expect(confirm).toBeVisible();
    zona.script({ delayAckMs: { class_name: "PAGESTORE", byMs: 2500 } });
    const committedAt = Date.now();
    await page.getByTestId("keep-confirm-yes").click();
    // Z-19: the primary carries the busy label, because the control that was
    // clicked has left the screen.
    await expect(primary(page)).toHaveText(KEEPING_LABEL);
    await expect(primary(page)).toHaveAttribute("aria-busy", "true");
    await expect(confirm).toHaveCount(0);
    await expect(keepControl(page)).toBeDisabled();
    // At 2000 ms: one Body line under the held block, and one polite word.
    await expect(installState(page)).toContainText(STILL_WRITING_LINE, {
      timeout: 5_000,
    });
    const slowLineAt = Date.now() - committedAt;
    await expect(sessionLive(page)).toHaveText(LIVE_STILL_WRITING, {
      timeout: 5_000,
    });
    // Escape inside the window: a pause, not a trap (I3 rule 9). The panel
    // stays chosen, the held block stays, the label stays.
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("chosen-panel")).toHaveCount(1);
    await expect(primary(page)).toHaveText(KEEPING_LABEL);
    await expect(installState(page)).toContainText(SETTLED_CAPTION);
    await expect(installState(page)).toHaveAttribute("aria-busy", "true");
    await expect(installState(page)).toContainText(STILL_WRITING_LINE);
    await expect(page.getByTestId("chosen-panel")).toHaveCount(1);

    // The acknowledgement lands at about 2500 ms; its landing is invisible
    // from here and the proof waits for a heartbeat, so: the bounded loop.
    const keptBeats = await beatUntilShows(
      page,
      zona,
      0,
      stateShows(KEPT_CAPTION),
    );
    const keptAt = Date.now() - committedAt;
    await expect(sessionLive(page)).toHaveText(liveKept(ENTRY_NAME));
    await expect(installState(page)).not.toContainText(STILL_WRITING_LINE);
    await expect(installState(page)).not.toHaveAttribute("aria-busy", "true");
    await expect(primary(page)).toHaveText(TRY_ON_LABEL);
    console.log(
      `test 10: slow line at +${slowLineAt} ms, KEPT at +${keptAt} ms after ${keptBeats} heartbeat(s)`,
    );

    // The put-back after a keep stores too (Z-04), so LIVE_RESTORED is
    // reached only after the store's proof - and spoken exactly once. The
    // next store leg lands at speed; the recorder is on before the click.
    zona.script({});
    await recordLiveRegions(page);
    const before = await liveTexts(page);
    expect(before.session).toBe(liveKept(ENTRY_NAME));
    expect(before.tuning).toBe("");
    expect(before.browse).toBeNull();
    await putBackControl(page).click();
    const restoredBeats = await beatUntilShows(
      page,
      zona,
      0,
      stateShows(RESTORED_STORED_LINE),
    );
    console.log(`test 10: RESTORED after ${restoredBeats} heartbeat(s)`);
    await expect(sessionLive(page)).toHaveText(LIVE_RESTORED);
    // A second of polling: the text never becomes anything else, and the
    // record holds ONE utterance for the whole put-back - never one for the
    // RAM leg and another for the store.
    for (let sampled = 0; sampled < 10; sampled++) {
      await expect(sessionLive(page)).toHaveText(LIVE_RESTORED);
      await page.waitForTimeout(100);
    }
    const afterRestore = await liveTexts(page);
    expect(afterRestore.session).toBe(LIVE_RESTORED);
    expect(utterances(afterRestore.log["session-live"])).toEqual([
      LIVE_RESTORED,
    ]);
    expect(afterRestore.tuning).toBe("");
    expect(utterances(afterRestore.log["tuning-live"])).toEqual([]);
    expect(afterRestore.browse).toBeNull();
    expect(utterances(afterRestore.log["browse-live"])).toEqual([]);

    // An unplug mid-write: the lost title, spoken, and never the session's
    // "Nothing was written" (Z-11); PUT BACK waits for the module.
    const n = (await writesOf(page)).length + 1;
    await page.evaluate(
      (count) => window.__hangarSerial.unplugAfterWrites(0, count),
      n,
    );
    await primary(page).click();
    await expect(sessionLive(page)).toHaveText(LOST_ON_PAGE, {
      timeout: 10_000,
    });
    expect(LOST_ON_PAGE).toBe("The ZONA was unplugged mid-write.");
    await expect(putBackControl(page)).toBeDisabled();
    await expect(visibleLine(page, "put-back-line")).toHaveText(
      PUT_BACK_NEEDS_ZONA,
    );
    const afterLost = await liveTexts(page);
    const spoken = utterances(afterLost.log["session-live"]);
    expect(spoken[spoken.length - 1]).toBe(LOST_ON_PAGE);
    expect(spoken.some((line) => line.includes("Nothing was written"))).toBe(
      false,
    );
    expect(utterances(afterLost.log["tuning-live"])).toEqual([]);
    expect(utterances(afterLost.log["browse-live"])).toEqual([]);

    // The wire: the keep and the put-back's store; the two settled RAM legs,
    // three writes each; the write that caused the unplug never reached the
    // module.
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(2);
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(6);
    console.log(`test 10 wall time ${Date.now() - startedAt} ms`);
    expect(consoleErrors).toEqual([]);
  });

  test("@webkit CLEAR sends on the click with no confirmation, the panel reads FACTORY DEFAULT, and PUT BACK brings the visitor's own back @webkit", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    const zona = await openReal(page, moduleState(17));
    await connectOnPage(page, zona);
    await recordLiveRegions(page);
    await tryOnPage(page);

    // AT REST, AFTER A TRY-ON, ON A BROWSER THAT CAN WRITE. CLEAR is live
    // beside KEEP ON DEVICE, under the NEXT caption, with its own line - and
    // the two look the same, which is A-47's ruling stated rather than hidden.
    // What separates them is behaviour: the words, the enablement set, and the
    // ceremony KEEP has and CLEAR does not.
    await expect(page.getByTestId("next-caption")).toHaveText("NEXT");
    await expect(clearControl(page)).toBeVisible();
    await expect(clearControl(page)).toBeEnabled();
    await expect(clearControl(page)).toHaveText(CLEAR_LABEL);
    await expect(visibleLine(page, "clear-line")).toHaveText(CLEAR_LINE);
    await expect(keepControl(page)).toBeEnabled();
    expect(await noConfirmOnScreen(page)).toBe(true);

    // Hold each CONFIG acknowledgement 200 ms in Node - strictly under
    // executeMs 250, as test 7 does - so CLEARING… is a window of about
    // 400 ms rather than 40, and a locator can catch it.
    zona.script({ delayAckMs: { class_name: "CONFIG", byMs: 200 } });

    // D-11-08.1-a, CLOSED HERE. This baseline read had no wait, and once in
    // five full-suite runs on 2026-09-09 the delta below read 3 for 2. The
    // diagnosis: PLAYING NOW is on screen the moment the store publishes
    // `settled`, which happens in the BROWSER - while the last frame of the
    // try-on may still be crossing the CDP hop to the Node fake that owns the
    // counter. So `configBefore` was read one SHORT, and the delta came out
    // one long. The deferred item read it as "a third write arriving"; it is
    // the same arithmetic seen from the other end, and the fix is a wait on
    // the COUNTER rather than on the panel - the counter is what the
    // assertion reads, so the counter is what has to have settled.
    //
    // The wait implies completion: a try-on is three writes, so the counter
    // reaching three IS "every frame of it has been answered in Node".
    await expect
      .poll(() => zona.seen("CONFIG", "EXECUTE"), {
        message: "every frame of the try-on has reached the Node fake",
        timeout: 10_000,
      })
      .toBe(3);
    const configBefore = zona.seen("CONFIG", "EXECUTE");
    await clearControl(page).click();

    // THE CLICK SENT. No block appeared, nothing waited for a second click,
    // and the busy label is on the control that was clicked. This is the
    // cheapest possible proof that A-45 shipped rather than being planned.
    await expect(clearControl(page)).toHaveText(CLEARING_LABEL);
    await expect(clearControl(page)).toHaveAttribute("aria-busy", "true");
    expect(await noConfirmOnScreen(page)).toBe(true);

    // I14 lands: the caption names the STATE and the body names PUT BACK,
    // which is on the screen and enabled - the copy rule holds where this
    // phase could most easily have broken it.
    await expect(installState(page)).toContainText(CLEARED_CAPTION);
    await expect(installState(page)).toContainText(CLEARED_BODY);
    await expect(clearControl(page)).toHaveText(CLEAR_LABEL);
    await expect(clearControl(page)).not.toHaveAttribute("aria-busy", "true");
    await expect(clearControl(page)).toBeEnabled();
    await expect(putBackControl(page)).toBeEnabled();
    // A clear leaves nothing of the visitor's on the module to keep, so the
    // closed set of six answers the new phase without a seventh member.
    await expect(keepControl(page)).toBeDisabled();
    await expect(visibleLine(page, "keep-on-device-line")).toHaveText(
      KEEP_REASONS["never-tried"],
    );
    expect(await noConfirmOnScreen(page)).toBe(true);
    // THREE firmware defaults, and the page init is one of them: CLEAR resets
    // BOTH elements (12-03, option A), which is what keeps D-21's line -
    // `Reset the current page to factory default` - literally true of every
    // element HANGAR has ever written.
    expect(zona.seen("CONFIG", "EXECUTE") - configBefore).toBe(3);
    // The region is WAITED ON rather than read: session.speech arrives on the
    // store's trailing timer, so a log read the instant region 3 changes is
    // read before the sentence exists.
    await expect(sessionLive(page)).toHaveText(LIVE_CLEARED);

    // AND THE WAY BACK IS ONE CLICK, which is the whole reason CLEAR needs no
    // confirmation (D-19): the control directly above it undoes the write.
    await putBackControl(page).click();
    await expect(installState(page)).toContainText(RESTORED_CAPTION);
    await expect(installState(page)).toContainText(RESTORED_BODY);
    await expect(putBackControl(page)).toHaveText(PUT_BACK_LABEL);
    await expect(sessionLive(page)).toHaveText(LIVE_RESTORED);

    // The live region said the clear once and never called it an emptying.
    const after = await liveTexts(page);
    const spoken = utterances(after.log["session-live"]);
    expect(spoken.filter((line) => line === LIVE_CLEARED).length).toBe(1);
    expect(spoken[spoken.length - 1]).toBe(LIVE_RESTORED);
    expect(utterances(after.log["tuning-live"])).toEqual([]);

    // The wire, by class: the try-on, the clear and the put-back are THREE
    // CONFIG/EXECUTE each, and A-26's RAM-only ruling is a counted zero
    // rather than an intention - a clear stores nothing.
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(9);
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);
    expect(consoleErrors).toEqual([]);
  });

  test("a knob turned before the click is the pair the module receives - LUMEN's depth, on the real panel", async ({
    page,
  }) => {
    // THE OTHER HALF OF PLAN 12-01'S QUESTION. model.spec.ts proves the TUNER
    // lands a different pair for a different knob index; nothing until now
    // proved that the pair TRY ON DEVICE puts on the wire is that one. The
    // seam between them is four files - Coverflow's `onconfig={(config) =>
    // (configStrings = config)}`, the {#key} remount, the reset effect that
    // clears configStrings on a step, and TryOnDevice's $effect into
    // install.observeConfig - and no title has ever turned a knob before the
    // click. LUMEN is the entry the bench reported as "seems like nothing
    // changed", so it is the one asked here.
    //
    // WHAT IS READ IS THE MODULE'S RAM, not the tuner's published pair:
    // zona.state.configs[EVENT_SETUP] is the Setup the last CONFIG/EXECUTE
    // wrote (synthetic.ts). Reading the panel would prove the panel.
    //
    // CHROMIUM ONLY, and deliberately untagged: this drives Web Serial through
    // the shim, which the phone project's engine has no slot for. One source
    // title, one run.
    const consoleErrors = collectErrors(page);
    const zona = await openReal(page, moduleState(18), undefined, LUMEN.id);
    await connectOnPage(page, zona);

    // THE TWO LITERALS, DERIVED FROM lumen.ts AND NEVER TYPED HERE. The token
    // sits in `local d=32-n//9*@DEPTH ` - it read 36 until plan 12-11 re-cut
    // the ramp, which is exactly why the lead is SLICED from the template
    // rather than written down - so the ten characters in front of it make
    // each rendered value unique in a 704-character Setup, where the bare
    // digit would match a dozen places. The default is index 2 and one
    // ArrowRight is index 3, the deepest ramp there is.
    const depthKnob = LUMEN.knobs.find((knob) => knob.id === "depth");
    expect(depthKnob, "LUMEN has a depth knob").toBeDefined();
    expect(LUMEN.source.kind, "LUMEN is a hand-authored Lua entry").toBe("lua");
    const template = LUMEN.source.kind === "lua" ? LUMEN.source.setup : "";
    const tokenAt = template.indexOf(depthKnob!.token);
    expect(
      tokenAt,
      `${depthKnob!.token} is in LUMEN's Setup template`,
    ).toBeGreaterThan(10);
    const lead = template.slice(tokenAt - 10, tokenAt);
    const literalAt = (index: number): string =>
      `${lead}${depthKnob!.values[index]}`;
    const fromIndex = depthKnob!.default;
    const toIndex = fromIndex + 1;
    expect(
      toIndex,
      `depth index ${toIndex} is inside ${JSON.stringify(depthKnob!.values)}`,
    ).toBeLessThan(depthKnob!.values.length);
    expect(literalAt(toIndex)).not.toBe(literalAt(fromIndex));

    // The precondition: the module holds the probe's own strings, so anything
    // found there afterwards was put there by a click on this page.
    expect(zona.state.configs[EVENT_SETUP]).toBe(MODULE_SETUP);

    // CLICK ONE, at the defaults.
    await tryOnPage(page, LUMEN.name);
    await expect(keepControl(page)).toBeEnabled();
    const atDefault = zona.state.configs[EVENT_SETUP];
    expect(typeof atDefault, "the module's RAM holds a Setup string").toBe(
      "string",
    );
    expect(atDefault.length).toBeGreaterThan(0);
    expect(
      atDefault.startsWith("--[[@cb]]"),
      "the Setup the module received is the entry's own event-marked Lua",
    ).toBe(true);

    // THE RAIL, LOCATED BY THE KNOB IT BELONGS TO RATHER THAN COUNTED. The
    // rack's range inputs are not one per knob in declaration order: LUMEN's
    // cursor knob renders as a ColourPicker, which contributes THREE rails of
    // its own and no Knob wrapper, so an index taken from the entry's knobs
    // array would land on a colour channel. The index handed to turnRail is
    // read out of the DOM, from the rail that sits inside `knob-depth`.
    const railIndex = await page.evaluate(() => {
      const found = [
        ...document.querySelectorAll(
          '[data-testid="knob-rack"] input[type="range"]',
        ),
      ];
      return found.findIndex(
        (rail) => rail.closest('[data-testid="knob-depth"]') !== null,
      );
    });
    expect(
      railIndex,
      "the depth knob renders a rail in the rack",
    ).toBeGreaterThanOrEqual(0);
    await expect(rails(page).nth(railIndex)).toHaveValue(String(fromIndex));
    await turnRail(page, railIndex, "ArrowRight");
    await expect(rails(page).nth(railIndex)).toHaveValue(String(toIndex));

    // The store SAW the move: the pair it holds is no longer the pair the
    // module holds, so KEEP ON DEVICE goes out with the reason that names it.
    // This is also the positive edge the second click is waited on against -
    // PLAYING NOW is already on screen from click one, so a bare re-read of
    // the caption would pass before the second write had happened at all
    // (Phase 11 deferred item D-11-08.1-a).
    await expect(keepControl(page)).toBeDisabled();
    await expect(visibleLine(page, "keep-on-device-line")).toHaveText(
      KEEP_REASONS["knobs-moved"],
    );

    // CLICK TWO, with the knob turned.
    await primary(page).click();
    await expect(keepControl(page), "the second try-on landed").toBeEnabled({
      timeout: 10_000,
    });
    await expect(installState(page)).toContainText(SETTLED_CAPTION);
    await expect(installState(page)).toContainText(settledBody(LUMEN.name));
    const tuned = zona.state.configs[EVENT_SETUP];

    // THE VERDICT, in bytes.
    expect(
      tuned,
      `the module received the same Setup at depth ${fromIndex} and at depth ${toIndex} - the knob does not reach the wire (both ${tuned.length} characters)`,
    ).not.toBe(atDefault);
    expect(
      tuned.includes(literalAt(toIndex)),
      `the module's RAM does not carry the turned depth (${literalAt(toIndex)})`,
    ).toBe(true);
    expect(
      atDefault.includes(literalAt(fromIndex)),
      `the first write did not carry the default depth (${literalAt(fromIndex)})`,
    ).toBe(true);
    expect(atDefault.includes(literalAt(toIndex))).toBe(false);
    expect(tuned.includes(literalAt(fromIndex))).toBe(false);
    console.log(
      `LUMEN on the wire: depth ${fromIndex} -> ${atDefault.length} characters carrying "${literalAt(fromIndex)}", depth ${toIndex} -> ${tuned.length} characters carrying "${literalAt(toIndex)}", differing`,
    );

    // The wire, read only after the second settled state. Two clicks, THREE
    // events each since 12-03 - which is the move 12-01 predicted here in
    // this comment, by name. What changed is the composition of a click, not
    // the number of clicks.
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(6);
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);
    expect(consoleErrors).toEqual([]);
  });

  test("the destination menu lists the pages the module reports and sends nothing on open; the review names both pages and sends nothing; the affirmative sends the heartbeat then exactly one switch; Apply waits for the module's own report, and PUT BACK then names the new page", async ({
    page,
  }) => {
    // Plan 13-12 (13-CONTEXT D-06, every clause but the bench). The fake is
    // the node suite's responder, which since this plan moves its active page
    // on a switch and reports it beside the next heartbeat - the whole of the
    // confirmation firmware gives (grid_decode.c:302-357). Heartbeats here are
    // PUSHED by the test, so "the module has not reported yet" is a state
    // this test can hold for as long as it likes.
    const PAGE_SWITCH = ["PAGE", "ACTIVE"].join("");
    const TO = 3;
    const consoleErrors = collectErrors(page);
    const zona = await openReal(page, moduleState(19));
    await connectOnPage(page, zona);

    const select = page.getByTestId("destination-page");
    const apply = page.getByTestId("apply-to-zona");
    const review = page.getByTestId("destination-review");
    const seenBefore = () => ({
      switches: zona.seen(PAGE_SWITCH, "EXECUTE"),
      heartbeats: zona.seen("HEARTBEAT", "EXECUTE"),
      writes: zona.seen("CONFIG", "EXECUTE"),
    });

    // THE MENU: the module's enumeration - four pages from the fake's
    // firmware-initial count, never a number typed in the page - with the
    // reported page marked and selected. Opening it sends NOTHING.
    await expect(select).toBeVisible();
    await expect(select).toBeEnabled();
    await expect(select.locator("option")).toHaveCount(4);
    await expect(select.locator("option")).toHaveText([
      "Page 0",
      "Page 1",
      `Page ${ACTIVE_PAGE} · on ZONA`,
      "Page 3",
    ]);
    await expect(select).toHaveValue(String(ACTIVE_PAGE));
    await expect(apply).toBeEnabled();
    await select.focus();
    await select.click();
    expect(seenBefore()).toEqual({ switches: 0, heartbeats: 0, writes: 0 });
    await expect(review).toHaveCount(0);

    // THE REVIEW, on first use: both pages named in D-06's sentence, Apply
    // disabled, and still nothing on the wire. The negative takes the select
    // back to the module's page, re-enables Apply, and sends nothing.
    await select.selectOption(String(TO));
    await expect(review).toBeVisible();
    await expect(page.getByTestId("destination-review-line")).toHaveText(
      `Switch your ZONA to Page ${TO}? It will stop playing Page ${ACTIVE_PAGE}.`,
    );
    await expect(review).toHaveAttribute("data-to", String(TO));
    await expect(review).toHaveAttribute("data-from", String(ACTIVE_PAGE));
    await expect(page.getByTestId("destination")).toHaveAttribute(
      "data-status",
      "requested",
    );
    await expect(apply).toBeDisabled();
    await expect(
      primary(page),
      "TRY ON DEVICE is the same gate",
    ).toBeDisabled();
    expect(seenBefore()).toEqual({ switches: 0, heartbeats: 0, writes: 0 });
    await page.getByTestId("destination-review-no").click();
    await expect(review).toHaveCount(0);
    await expect(select).toHaveValue(String(ACTIVE_PAGE));
    await expect(apply).toBeEnabled();
    expect(seenBefore()).toEqual({ switches: 0, heartbeats: 0, writes: 0 });

    // EVERY CHANGE: the second request reviews again - no memory, no skip.
    await select.selectOption(String(TO));
    await expect(review).toBeVisible();
    expect(seenBefore().switches).toBe(0);

    // THE AFFIRMATIVE: the restore heartbeat, THEN exactly one switch, in
    // that order on the wire - the case the ordering exists for is a switch
    // after a write, and the order is asserted here off the frames the page
    // wrote, not off a count. No config write, no store.
    const framesBefore = (await writesOf(page)).length;
    await page.getByTestId("destination-review-yes").click();
    await expect(page.getByTestId("destination")).toHaveAttribute(
      "data-status",
      "switching",
    );
    await expect(page.getByTestId("destination-line")).toHaveText(
      `Switching to Page ${TO}…`,
    );
    expect(seenBefore()).toEqual({ switches: 1, heartbeats: 1, writes: 0 });
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);
    const frames = await writesOf(page);
    expect(frames.length - framesBefore, "two frames left the page").toBe(2);
    const classOf = (hex: string) => {
      const bytes = [...Buffer.from(hex, "hex")];
      if (bytes[bytes.length - 1] === TERMINATOR) bytes.pop();
      const decoded = decodeFrame(bytes);
      if (!decoded.ok)
        throw new Error(`a frame did not decode: ${decoded.reason}`);
      return decoded.classes.map((c) => `${c.class_name}/${c.class_instr}`);
    };
    expect(frames.slice(-2).map(classOf)).toEqual([
      ["HEARTBEAT/EXECUTE"],
      [`${PAGE_SWITCH}/EXECUTE`],
    ]);
    // The fake accepted it: its page moved, and the next heartbeat will say so.
    expect(zona.state.activePage).toBe(TO);

    // THE ACK GATE: Apply stays disabled until the module's OWN report. The
    // module has not heartbeated since the switch, so the target is still
    // switching and every write control is shut.
    await expect(apply).toBeDisabled();
    await expect(primary(page)).toBeDisabled();
    await expect(select).toBeDisabled();
    await expect(putBackControl(page)).toBeDisabled();
    await expect(clearControl(page)).toBeDisabled();

    // The report: one heartbeat from the module, carrying page 3. The target
    // settles, the select shows the new page as the module's, Apply is live
    // again - and the store re-snapshots the NEW page (Pitfall 4's third
    // layer), so PUT BACK's line now NAMES Page 3 before any click.
    const beats = await beatUntilShows(page, zona, 0, {
      selector: '[data-testid="destination"]',
      attribute: "data-status",
      equals: "reported",
    });
    console.log(`the report needed ${beats} heartbeat(s)`);
    await expect(select).toHaveValue(String(TO));
    await expect(select.locator("option")).toHaveText([
      "Page 0",
      "Page 1",
      `Page ${ACTIVE_PAGE}`,
      `Page ${TO} · on ZONA`,
    ]);
    await expect(apply).toBeEnabled();
    await expect(primary(page)).toBeEnabled();
    await expect(page.getByTestId("put-back-page-line")).toHaveText(
      `Puts Page ${TO} back to what it was playing when you connected.`,
      { timeout: 10_000 },
    );
    await expect(page.getByTestId("put-back-page-line")).not.toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(putBackControl(page)).toBeEnabled();

    // The wire, whole: one switch, one heartbeat before it, no config write,
    // no store, no discard; the re-snapshot of the new page is reads only.
    expect(seenBefore()).toEqual({ switches: 1, heartbeats: 1, writes: 0 });
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);
    expect(zona.seen(["PAGE", "DISCARD"].join(""), "EXECUTE")).toBe(0);
    expect(zona.seen("PAGECOUNT", "FETCH"), "enumerated once").toBe(1);
    expect(consoleErrors).toEqual([]);
  });
});

test.describe("the install controls on the engine that can never install", () => {
  test.beforeEach(async ({ context }) => {
    // NO shim. The real slot is deleted from the prototype, so this page is
    // rendered by a browser that genuinely has no Web Serial - on the phone
    // project it never had one, on the desktop project this forces the same
    // branch, so one set of assertions describes both engines.
    await context.addInitScript(() => {
      delete (Navigator.prototype as unknown as Record<string, unknown>).serial;
    });
  });

  test("@webkit the install controls are present and disabled with their reasons, and PUT BACK is absent @webkit", async ({
    page,
  }, testInfo) => {
    const consoleErrors = collectErrors(page);
    await page.goto(`/playground/${ENTRY}/`);
    // Precondition, asserted: this page cannot talk to hardware at all.
    expect(await page.evaluate(() => "serial" in navigator)).toBe(false);

    // 06-13's ordering: the hydration marker, then the SETTLED capability
    // caption, and only then anything that depends on the decision.
    const slot = page.getByTestId("device-slot");
    await expect(slot).toHaveAttribute("data-hydrated", "true");
    await expect(page.getByTestId("device-slot-caption")).toHaveText(
      CAPTION_UNSUPPORTED,
    );
    await expect(slot).toHaveAttribute("data-slot", "S0a");

    await expect(page.getByTestId("workspace")).toBeVisible();
    await waitForPicture(page, ENTRY);
    await expect(page.getByTestId("chosen-panel")).toBeVisible();

    // DEGR-02, all three controls. The primary: present, disabled, the
    // capability sentence in its own slot (I9 precedence 1).
    await expect(primary(page)).toBeVisible();
    await expect(primary(page)).toBeDisabled();
    await expect(honesty(page)).toHaveText(HONESTY_INCAPABLE);
    // KEEP ON DEVICE: present, disabled, its reason the capability sentence.
    await expect(keepControl(page)).toBeVisible();
    await expect(keepControl(page)).toBeDisabled();
    await expect(visibleLine(page, "keep-on-device-line")).toHaveText(
      KEEP_REASONS.incapable,
    );
    // PUT BACK: absent, not disabled (Z-12) - there is no module to name.
    await expect(putBackControl(page)).toHaveCount(0);
    // The connect-state region names the browsers that can, and no engine.
    const status = page.getByTestId("connect-status");
    await expect(status).toContainText("Firefox 151");
    const reason = await status.innerText();
    for (const named of ["Chrome", "Edge", "Firefox 151"]) {
      expect(reason, `the reason names ${named}`).toContain(named);
    }
    expect(await page.locator("body").innerText()).not.toContain("Chromium");

    // No horizontal scrollbar from the install controls. The panel is never
    // wider than its own box, on either project. The DOCUMENT is no wider
    // than the window at the phone layout - the single-column layout DEGR-01
    // makes its promise at, where the band's clipped cards run past its box
    // (overflow-x: clip) and rightly reach the document not at all. At the
    // desktop project's 1280px the document scrolls by ONE pixel with the
    // panel chosen or not, shim or none, while no element's bounding box
    // exceeds the viewport - a sub-pixel property of the page measured by
    // plan 07-12 and recorded as Phase 7 deferred item 20, not of anything
    // this test is about; it is logged here and bounded at that pixel, so a
    // second one is red and the fix reads zero on both projects.
    const widths = await page.evaluate(() => {
      const doc = document.documentElement;
      const panel = document.querySelector('[data-testid="chosen-panel"]');
      const band = document.querySelector('[data-testid="coverflow"]');
      return {
        viewport: innerWidth,
        document: doc.scrollWidth,
        client: doc.clientWidth,
        panel: panel?.scrollWidth ?? null,
        panelClient: panel?.clientWidth ?? null,
        bandContentExcess: band
          ? Math.max(0, band.scrollWidth - band.clientWidth)
          : null,
      };
    });
    console.log(
      `degrade panel on ${testInfo.project.name}: ${JSON.stringify(widths)}`,
    );
    expect(widths.panel).not.toBeNull();
    expect(widths.panel as number).toBeLessThanOrEqual(
      widths.panelClient as number,
    );
    const documentExcess = widths.document - widths.client;
    if (widths.viewport < 600) {
      expect(
        documentExcess,
        "no horizontal scrollbar at the phone layout",
      ).toBe(0);
    } else {
      expect(
        documentExcess,
        "deferred item 20: one pixel at 1280, and no more",
      ).toBeLessThanOrEqual(1);
    }

    expect(consoleErrors).toEqual([]);
  });

  test("@webkit CLEAR is present and disabled where PUT BACK is absent, and the difference is one assertion @webkit", async ({
    page,
  }) => {
    // DEGR-02 for the fourth click (plan 10-13). This is the branch a large
    // share of visitors hit and the one no manual tester remembers to check.
    const consoleErrors = collectErrors(page);
    await page.goto(`/playground/${ENTRY}/`);
    expect(await page.evaluate(() => "serial" in navigator)).toBe(false);

    const slot = page.getByTestId("device-slot");
    await expect(slot).toHaveAttribute("data-hydrated", "true");
    await expect(slot).toHaveAttribute("data-slot", "S0a");
    await expect(page.getByTestId("workspace")).toBeVisible();
    await waitForPicture(page, ENTRY);
    await expect(page.getByTestId("chosen-panel")).toBeVisible();

    // PRESENT AND DISABLED, WITH ITS REASON INLINE. Not hidden: a visitor who
    // cannot install still learns what the control would have done, which is
    // the whole of DEGR-02's "teach rather than hide". The caption above the
    // column is on the screen too - the sequence reads the same on a browser
    // that can never walk it.
    await expect(page.getByTestId("next-caption")).toHaveText("NEXT");
    await expect(clearControl(page)).toBeVisible();
    await expect(clearControl(page)).toBeDisabled();
    await expect(clearControl(page)).toHaveText(CLEAR_LABEL);
    await expect(visibleLine(page, "clear-line")).toHaveText(
      CLEAR_REASONS.incapable,
    );

    // AND THE CONTRAST WITH PUT BACK, IN ONE ASSERTION, so the difference is
    // deliberate and visible rather than two facts in two places. PUT BACK is
    // ABSENT (Z-12): it offers to restore a SPECIFIC module's own
    // configuration, and on a browser that never had one there is nothing for
    // it to name. CLEAR does something meaningful on any module, so there is a
    // real capability to teach.
    expect(
      {
        clear: await clearControl(page).count(),
        clearDisabled: await clearControl(page).isDisabled(),
        putBack: await putBackControl(page).count(),
      },
      "CLEAR must be PRESENT and DISABLED exactly where PUT BACK is ABSENT",
    ).toEqual({ clear: 1, clearDisabled: true, putBack: 0 });

    // No confirmation exists to be hidden here either.
    expect(await noConfirmOnScreen(page)).toBe(true);
    expect(consoleErrors).toEqual([]);
  });
});
