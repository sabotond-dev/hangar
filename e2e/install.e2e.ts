// SAFE-01, SAFE-03, SAFE-07 and SAFE-09: the install store in the browser that
// produces its states, against a ZONA that does not exist.
//
// Six tests, all against the install probe route, which renders the store's
// fields as plain text plus one thing no component ever will: a TRACE of every
// phase the store has been in since load, in order. A round trip through the
// scripted module takes tens of milliseconds, so `snapshotting` and `writing`
// never stay on screen long enough for a locator to catch them; the trace is
// how a browser test asserts a transient, and it is why every one of
// 07-UI-SPEC's fourteen states is visited here before a panel exists to hide a
// transition in. Between them the six tests own: idle, snapshotting, ready,
// writing, settled, restored, kept, partial, lost, snapshot-failed,
// kept-mismatch, unconfirmed, restored-unconfirmed and nothing-landed. Tests
// are isolated, so no file-level union is asserted; each test asserts the
// states it owns and 07-08-SUMMARY.md tabulates the fourteen against the six.
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
// ALL SIX TITLES ARE UNTAGGED: every one drives Web Serial, which the phone
// engine does not have, and its degrade path is session.e2e.ts's tagged
// pair. This file adds SIX to the suite total, on the desktop project alone.
//
// TEST 6 IS SLOW BY DESIGN. Two legs of three pagestoreMs (3000 ms) attempts
// with retryBackoffMs between them are roughly 19 s against Playwright's
// default 30 s per-test budget (playwright.config.ts sets no `timeout`; its
// 180 s is the web server's), so it declares test.slow() on its first line
// and prints its wall time. The timeouts under test are the shipped
// constants and are not shortened.
//
// NEVER WRITES TO A DEVICE. Every byte a page writes lands in the shim; the
// only ZONA here is a function in Node.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { expect, test, type Page } from "@playwright/test";
import {
  LIVE_RESTORED,
  LIVE_SNAPSHOT_SAVED,
  announceTitle,
  liveKept,
  liveSettled,
  lostBlock,
  unconfirmedBlock,
  TRY_ON_LABEL,
} from "../src/lib/device/install-copy";
import { EVENT_SETUP, EVENT_TIMER, decodeFrame } from "../src/lib/protocol";
import type { ZonaState } from "../src/lib/transport/fixtures/synthetic";
import { FAKE_SERIAL } from "./fake-serial";
import { type ExposedZona, type ZonaScript, installZona } from "./fake-zona";

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
