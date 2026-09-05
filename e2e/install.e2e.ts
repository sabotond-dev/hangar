// SAFE-01, SAFE-02, SAFE-03, SAFE-05, SAFE-07, SAFE-08, SAFE-09 and DEGR-02:
// the install store in the browser that produces its states, against a ZONA
// that does not exist - first through a probe that hides nothing, then on the
// page a visitor actually opens.
//
// Eleven tests in three blocks. THE FIRST SIX run against the install probe
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
// THE NEXT FOUR (plan 07-12) run on /c/aurora/ against the production build,
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
// therefore held 200 ms PER acknowledgement - two events, a window of about
// 400 ms that Playwright's polling catches, both landing on attempt 1 - and
// anything that needs a window past 2000 ms, the slow line, is observed on a
// STORE leg, whose single attempt runs to pagestoreMs 3000.
//
// THE HEADER LOCK IS MET ONLY AFTER AN UN-CHOOSE DURING A LEG (deferred item
// 19). panelOwnsProse is page.state.chosen and the drawer never renders while
// the panel that holds every writing control is open, so test 7 reaches the
// open disclosure the way a visitor could: the browser's Back inside the RAM
// leg, which un-chooses where Escape refuses (Z-10 names Escape only). The
// panel is re-chosen after the leg and reads its settled block.
//
// THE ELEVENTH is the degrade path, tagged for the phone project: no shim,
// `Navigator.prototype.serial` deleted, and every install control present,
// disabled and explained - PUT BACK absent, by decision (Z-12).
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
// TEN OF THE ELEVEN TITLES ARE UNTAGGED: every one of them drives Web Serial,
// which the phone engine does not have. The eleventh carries the tag
// playwright.config.ts greps the webkit-phone project by, so it runs on both
// projects: eleven titles, twelve runs. 07-08 added six to the suite total on
// the desktop project alone; 07-12 adds four there and one on both, six more.
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
  LIVE_RESTORED,
  LIVE_SNAPSHOT_SAVED,
  LIVE_STILL_WRITING,
  PUTTING_BACK_LABEL,
  PUT_BACK_LABEL,
  PUT_BACK_LINE,
  PUT_BACK_LINE_AFTER_KEEP,
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
  CAPTION_UNSUPPORTED,
  WRITE_LOCK_REASON,
} from "../src/lib/device/session-copy";
import {
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

/** The pair the probe's two textareas hold, read rather than restated. */
async function probePair(
  page: Page,
): Promise<{ setup: string; timer: string }> {
  return {
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
    await expect(readout(page, "install-snapshot")).toHaveText(
      `durable ${MODULE_SETUP.length} ${MODULE_TIMER.length}`,
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
      "fetch-setup ok 1",
      "fetch-timer ok 1",
    ]);

    // SAFE-01 by class, over the whole journey: one serial fetch, two config
    // fetches, and not one write of any kind.
    expect(zona.seen("SERIALNUMBER", "FETCH")).toBe(1);
    expect(zona.seen("CONFIG", "FETCH")).toBe(2);
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(0);
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);
    expect(zona.seen("HEARTBEAT", "EXECUTE")).toBe(0);
    expect((await writesOf(page)).length).toBe(3);

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
    expect(empty.seen("CONFIG", "FETCH")).toBe(4);
    expect(empty.seen("CONFIG", "EXECUTE")).toBe(0);
    expect(empty.seen("PAGESTORE", "EXECUTE")).toBe(0);

    expect(consoleErrors).toEqual([]);
    expect(secondErrors).toEqual([]);
  });

  test("TRY ON DEVICE lands both acknowledgements, PUT BACK restores, and the trace names every state", async ({
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    const zona = await openProbe(page, moduleState(3));
    await connectAndSnapshot(page, zona);
    const pair = await probePair(page);
    expect(pair.setup).not.toBe(MODULE_SETUP);
    expect(pair.timer).not.toBe(MODULE_TIMER);

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
      "write-timer ok 1",
      "write-setup ok 1",
      "restore-page-change sent 1",
    ]);
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(2);
    expect(zona.seen("HEARTBEAT", "EXECUTE")).toBe(1);
    // The module's RAM holds the pair; its flash still holds its own.
    expect(zona.state.configs[EVENT_SETUP]).toBe(pair.setup);
    expect(zona.state.configs[EVENT_TIMER]).toBe(pair.timer);
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
      "write-timer ok 1",
      "write-setup ok 1",
      "restore-page-change sent 1",
    ]);
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(4);
    expect(zona.seen("HEARTBEAT", "EXECUTE")).toBe(2);
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);
    expect(zona.state.configs[EVENT_SETUP]).toBe(MODULE_SETUP);
    expect(zona.state.configs[EVENT_TIMER]).toBe(MODULE_TIMER);
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
    // One store, one heartbeat waited for, one matching round.
    expect(await stepLines(page)).toEqual([
      "store ok 1",
      "refetch-setup ok 1",
      "refetch-timer ok 1",
    ]);
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(1);
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(2);
    expect(zona.seen("CONFIG", "FETCH")).toBe(4);
    expect(zona.state.flash?.[EVENT_SETUP]).toBe(pair.setup);
    expect(zona.state.flash?.[EVENT_TIMER]).toBe(pair.timer);

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
    expect(lines.filter((l) => l.startsWith("refetch-setup "))).toHaveLength(3);
    expect(lines.filter((l) => l.startsWith("refetch-timer "))).toHaveLength(3);
    expect(liar.seen("PAGESTORE", "EXECUTE")).toBe(1);
    expect(liar.seen("CONFIG", "EXECUTE")).toBe(2);
    expect(liar.seen("CONFIG", "FETCH")).toBe(2 + 6);

    expect(consoleErrors).toEqual([]);
    expect(secondErrors).toEqual([]);
  });

  test("one landed script is partial, none landed is nothing-landed, and both offer the way back", async ({
    context,
    page,
  }) => {
    const consoleErrors = collectErrors(page);
    // One drop per attempt of the SECOND event: the id is minted per attempt,
    // so a single nth 2 would let attempt 2's acknowledgement land and the
    // trace would end settled.
    const zona = await openProbe(page, moduleState(6), {
      dropAck: [
        { class_name: "CONFIG", nth: 2 },
        { class_name: "CONFIG", nth: 3 },
        { class_name: "CONFIG", nth: 4 },
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
      "write-timer ok 1",
      "write-setup timeout 3",
      "restore-page-change sent 1",
    ]);
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(4);
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0);
    // Timer landed. Setup's three writes REACHED the module too - only their
    // acknowledgements were dropped - so the fake's RAM holds the pair on
    // both events, which is exactly what HANGAR cannot know and why the
    // panel names one half landed and offers PUT BACK.
    expect(zona.state.configs[EVENT_TIMER]).toBe(pair.timer);
    expect(zona.state.configs[EVENT_SETUP]).toBe(pair.setup);

    // A refusal on the first write: one attempt, never retried, nothing
    // written, and no escalation - a NACK is not congestion.
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
      "write-timer nack 1",
      "restore-page-change sent 1",
    ]);
    expect(refusedLines.some((l) => l.startsWith("write-setup"))).toBe(false);
    expect(refusing.seen("CONFIG", "EXECUTE")).toBe(1);
    expect(refusing.seen("PAGESTORE", "EXECUTE")).toBe(0);
    expect(refusing.state.configs[EVENT_TIMER]).toBe(MODULE_TIMER);
    expect(refusing.state.configs[EVENT_SETUP]).toBe(MODULE_SETUP);

    // A timer write that never lands: three attempts time out with no NACK
    // seen, and THIS one escalates.
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
      "write-timer timeout 3",
      "restore-page-change sent 1",
    ]);
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
    // three fetches are on the wire already, so the next write is the one.
    const n = (await writesOf(page)).length + 1;
    expect(n).toBe(4);
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
    expect(lostLines[0]).toBe("write-timer aborted 1");
    expect(lostLines.slice(1)).toEqual(
      lostLines.length > 1 ? ["restore-page-change sent 1"] : [],
    );
    expect(lostLines.some((l) => l.startsWith("write-setup"))).toBe(false);

    // The write that caused it is recorded, and it never reached the module:
    // the nth chunk decodes as the Timer write, and Node counted no
    // CONFIG/EXECUTE at all.
    const written = await writesOf(page);
    console.log(`writes recorded at lost: ${written.length} (unplug at ${n})`);
    expect(written.length).toBeGreaterThanOrEqual(n);
    const causing = [...Buffer.from(written[n - 1], "hex")];
    causing.pop();
    const decoded = decodeFrame(causing);
    expect(decoded.ok && decoded.classes[0]?.class_name).toBe("CONFIG");
    expect(decoded.ok && decoded.classes[0]?.class_instr).toBe("EXECUTE");
    expect(
      decoded.ok && Number(decoded.classes[0]?.class_parameters.EVENTTYPE),
    ).toBe(EVENT_TIMER);
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
    expect(zona.seen("SERIALNUMBER", "FETCH")).toBe(2);
    expect(zona.seen("CONFIG", "FETCH")).toBe(4);
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
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(3);
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(2);
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
    // Both legs of one put-back in one record: the RAM leg's three steps,
    // then the store that never confirmed.
    expect(await stepLines(second)).toEqual([
      "write-timer ok 1",
      "write-setup ok 1",
      "restore-page-change sent 1",
      "store timeout 3",
    ]);
    expect(kept.seen("PAGESTORE", "EXECUTE")).toBe(1 + 3);
    expect(kept.seen("CONFIG", "EXECUTE")).toBe(4);
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
// The real page (plan 07-12). Everything below opens /c/aurora/ and drives the
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
 * The chosen /c/aurora/ with landed meters. The deep link may already be
 * chosen; if not, Enter on the band chooses it (e2e/tuning.e2e.ts openPanel).
 */
async function openPanel(page: Page): Promise<void> {
  await page.goto(`/c/${ENTRY}/`);
  const band = page.getByTestId("coverflow");
  await expect(band).toBeVisible();
  await waitForPicture(page, ENTRY);
  if ((await page.getByTestId("chosen-panel").count()) === 0) {
    await expect(band).toHaveAttribute("data-ready", "true");
    await band.press("Enter");
  }
  await expect(page.getByTestId("chosen-panel")).toBeVisible();
  await expect(page.getByTestId("knob-rack")).toBeVisible();
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
): Promise<ExposedZona> {
  const zona = await installZona(page, state, script);
  await page.addInitScript(() => {
    window.__hangarSerial.grant();
  });
  await openPanel(page);
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
async function tryOnPage(page: Page): Promise<void> {
  await primary(page).click();
  await expect(installState(page)).toContainText(SETTLED_CAPTION, {
    timeout: 10_000,
  });
  await expect(installState(page)).toContainText(settledBody(ENTRY_NAME));
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
    await expect(visibleLine(page, "put-back-line")).toHaveText(PUT_BACK_LINE);
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

    // THE HEADER LOCK, reached the only way the page allows (deferred item
    // 19): Back un-chooses the panel mid-leg where Escape refuses, and the
    // disclosure can open once the panel is gone. Still inside the window.
    await page.evaluate(() => history.back());
    await expect(page.getByTestId("chosen-panel")).toHaveCount(0);
    await expect(page).toHaveURL(/\/c\/aurora\/$/);
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

    // Re-chosen, the panel reads the settled state the write produced while
    // nobody was watching it: PLAYING NOW, the label back at rest, KEEP ON
    // DEVICE enabled - the one and only path to it (I4).
    const band = page.getByTestId("coverflow");
    await expect(band).toHaveAttribute("data-ready", "true");
    await band.press("Enter");
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

    // The wire: one try-on, both acknowledgements on attempt 1, nothing stored.
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(2);
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
      PUT_BACK_LINE_AFTER_KEEP,
    );
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(1);
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(2);
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
    expect(rig.seen("CONFIG", "EXECUTE")).toBe(2);

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
      PUT_BACK_LINE_AFTER_KEEP,
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
    await expect(visibleLine(page, "put-back-line")).toHaveText(PUT_BACK_LINE);
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

    // The wire: the keep and the put-back's store; three try-ons' worth of
    // RAM writes (two try-ons and the put-back's RAM leg).
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(2);
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(6);
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

    // The wire: the keep and the put-back's store; the two settled RAM legs;
    // the write that caused the unplug never reached the module.
    expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(2);
    expect(zona.seen("CONFIG", "EXECUTE")).toBe(4);
    console.log(`test 10 wall time ${Date.now() - startedAt} ms`);
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
    await page.goto(`/c/${ENTRY}/`);
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

    const band = page.getByTestId("coverflow");
    await expect(band).toBeVisible();
    await waitForPicture(page, ENTRY);
    if ((await page.getByTestId("chosen-panel").count()) === 0) {
      await expect(band).toHaveAttribute("data-ready", "true");
      await band.press("Enter");
    }
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
});
