import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  EVENT_SETUP,
  EVENT_TIMER,
  FrameScanner,
  TERMINATOR,
  TOUCH_EVENTS,
  ZONA_HWCFG,
  ZONA_USB,
  type GridRequest,
  decodeFrame,
  encodeRequest,
  fetchConfig,
  hostHeartbeat,
  sendConfig,
  storePage,
} from "$lib/protocol";
import {
  CAPTURE_SCHEMA,
  CaptureRecorder,
  STEP_IDS,
  type Capture,
  type CaptureRun,
  type StepId,
} from "../capture";
import { FakeTransport } from "../fake";
import {
  configAckFrame,
  configReportFrame,
  heartbeatFrame,
  pagestoreAckFrame,
} from "./synthetic";

const FIXTURE_URL = new URL("./synthetic-zona.json", import.meta.url);
const FIXTURE_PATH = fileURLToPath(FIXTURE_URL);
const REPO_ROOT = fileURLToPath(new URL("../../../../", FIXTURE_URL));
const FIXTURE_REL = "src/lib/transport/fixtures/synthetic-zona.json";

const FIRMWARE = { major: 1, minor: 5, patch: 5 };
const defaultConfig = (value: number) => {
  const event = TOUCH_EVENTS.find((e) => e.value === value);
  if (!event) throw new Error(`no touch event with value ${value}`);
  return event.defaultConfig;
};

const round = (n: number) => Math.round(n * 10) / 10;

const RUN: CaptureRun = {
  id: "synthetic-hb-on-pace-10",
  hostHeartbeat: { enabled: true, intervalMs: 300, type: 255 },
  pacing: { preSendDelayMs: 10 },
  timeouts: { fetchMs: 1000, executeMs: 500, pagestoreMs: 3000 },
  retries: 3,
  // Invented, like every other number in this file. A generated capture must
  // never look like it came from a browser talking to a module.
  userAgent: "node (generated, no browser)",
  origin: "synthetic://generated",
  protocolPin: JSON.parse(readFileSync(`${REPO_ROOT}package.json`, "utf8"))
    .dependencies["@intechstudio/grid-protocol"],
};

/**
 * A full A-arm, built entirely from real `encode_packet` output with invented
 * content and invented timing. The `"synthetic"` marker on the capture is what
 * declares that second half, and plan 05's gate refuses to close the phase on
 * a capture that carries it.
 */
function buildSyntheticCapture(): Capture {
  let t = 0;
  const rec = new CaptureRecorder(RUN, {
    source: "synthetic",
    now: () => t,
    // Pinned, not `new Date()`: regeneration has to be idempotent or every
    // review is a diff of one changed timestamp and 13 unchanged frames.
    capturedAt: "2026-09-03T00:00:00.000Z",
  });

  const receive = (frame: number[]) => {
    rec.rxChunk(Uint8Array.from([...frame, TERMINATOR]));
    t = round(t + 0.1);
    rec.rxFrame(frame, decodeFrame(frame));
  };
  const send = (req: GridRequest) => {
    const { bytes, id } = encodeRequest(req);
    rec.tx(bytes);
    return id;
  };

  // Eight module heartbeats at the firmware's own 250 ms period. Each one
  // carries the active page beside it, which is how the page learns it.
  t = 12.4;
  for (let i = 0; i < 8; i++) {
    receive(
      heartbeatFrame({
        sx: 0,
        sy: 0,
        type: 1,
        hwcfg: ZONA_HWCFG,
        activePage: 0,
        firmware: FIRMWARE,
      }),
    );
    t = round(t + 249.9);
  }
  rec.step({
    id: "identify",
    descr: "HEARTBEAT/EXECUTE TYPE 1 with the active page beside it",
    sentAt: 12.4,
    settledAt: 12.5,
    latencyMs: 0.1,
    attempts: 1,
    outcome: "ok",
    matchedOn: ["TYPE", "HWCFG", "PAGENUMBER"],
  });

  const transaction = (
    id: StepId,
    descr: string,
    req: GridRequest,
    reply: (requestId: number) => number[],
    latencyMs: number,
  ) => {
    const sentAt = t;
    const requestId = send(req);
    t = round(t + latencyMs);
    receive(reply(requestId));
    rec.step({
      id,
      descr,
      requestId,
      sentAt,
      settledAt: round(sentAt + latencyMs),
      latencyMs,
      attempts: 1,
      outcome: "ok",
      matchedOn: ["class", "instr", "SX", "SY"],
    });
  };

  const setup = defaultConfig(EVENT_SETUP);
  const timer = defaultConfig(EVENT_TIMER);

  t = 2012.4;
  transaction(
    "fetch-setup",
    "CONFIG/FETCH ev0",
    fetchConfig(0, 0, 0, EVENT_SETUP),
    () =>
      configReportFrame({
        sx: 0,
        sy: 0,
        page: 0,
        event: EVENT_SETUP,
        config: setup,
      }),
    14.7,
  );
  t = round(t + 10);
  transaction(
    "fetch-timer",
    "CONFIG/FETCH ev6",
    fetchConfig(0, 0, 0, EVENT_TIMER),
    () =>
      configReportFrame({
        sx: 0,
        sy: 0,
        page: 0,
        event: EVENT_TIMER,
        config: timer,
      }),
    9.4,
  );

  // Timer first, then Setup (D-11's order): Setup is the expensive one and the
  // one whose failure is most visible, so it is written last.
  t = round(t + 10);
  transaction(
    "write-timer",
    "CONFIG/EXECUTE ev6",
    sendConfig(0, 0, 0, EVENT_TIMER, timer),
    (requestId) => configAckFrame({ sx: 0, sy: 0, lastheader: requestId }),
    8.9,
  );
  t = round(t + 10);
  transaction(
    "write-setup",
    "CONFIG/EXECUTE ev0",
    sendConfig(0, 0, 0, EVENT_SETUP, setup),
    (requestId) => configAckFrame({ sx: 0, sy: 0, lastheader: requestId }),
    12.1,
  );
  t = round(t + 10);
  transaction(
    "store",
    "PAGESTORE/EXECUTE",
    storePage(),
    (requestId) => pagestoreAckFrame({ lastheader: requestId }),
    61.5,
  );

  // The restore rule: a successful CONFIG/EXECUTE leaves page changes disabled
  // in firmware and ONLY an inbound TYPE 255 heartbeat re-enables them. It is
  // fire and forget, so it has no response and its outcome is "sent".
  t = round(t + 10);
  const restoreId = send(hostHeartbeat());
  rec.step({
    id: "restore-page-change",
    descr: "HEARTBEAT/EXECUTE TYPE 255",
    requestId: restoreId,
    sentAt: t,
    attempts: 1,
    outcome: "sent",
  });

  rec.setIdentity({
    usbVendorId: ZONA_USB.usbVendorId,
    usbProductId: ZONA_USB.usbProductId,
    sx: 0,
    sy: 0,
    rot: 0,
    hwcfg: ZONA_HWCFG,
    moduleType: "ZONA",
    revision: "RevH",
    firmware: FIRMWARE,
    heartbeatType: 1,
    activePage: 0,
    otherModules: [],
  });
  rec.setResults({
    setupBefore: setup,
    timerBefore: timer,
    setupAfter: setup,
    timerAfter: timer,
    byteIdentical: true,
  });
  return rec.toJSON();
}

function regenerate(): void {
  writeFileSync(
    FIXTURE_PATH,
    JSON.stringify(buildSyntheticCapture(), null, 2) + "\n",
    "utf8",
  );
  // src/lib/transport/fixtures/ is not prettier-ignored, so without this
  // normalising pass `npm run lint` fails on a file no human wrote.
  execSync(`npx prettier --write ${FIXTURE_REL}`, {
    cwd: REPO_ROOT,
    stdio: "ignore",
  });
}

// golden-frames.spec.ts's pattern, with one deliberate difference recorded in
// 02-02-SUMMARY.md: regeneration is a module-scope side effect that THROWS,
// and there is no guard `it()`. A guarded test would report a `skipped` count,
// and every aggregate test total in plans 02 through 05 and in 02-VALIDATION.md
// is stated with no skip allowance. Setting the variable regenerates,
// normalises, and then fails the run by design, so a regenerated fixture can
// never be silently accepted as a pass.
//
// Regeneration:
//   node scripts/make-synthetic-capture.mjs
if ((process.env.UPDATE_SYNTHETIC ?? "") !== "") {
  regenerate();
  throw new Error(
    "synthetic-zona.json regenerated. Review the diff, then re-run without UPDATE_SYNTHETIC.",
  );
}

const fixture = JSON.parse(readFileSync(FIXTURE_URL, "utf8")) as Capture;

describe("the committed synthetic capture", () => {
  it("matches the schema and is marked synthetic", () => {
    expect(fixture.schema).toBe(CAPTURE_SCHEMA);
    expect(fixture.source, "never mistakable for evidence").toBe("synthetic");
    expect(fixture.run.id).toBe("synthetic-hb-on-pace-10");
    expect(fixture.identity?.moduleType).toBe("ZONA");
    expect(fixture.identity?.hwcfg).toBe(ZONA_HWCFG);
    expect(fixture.identity?.heartbeatType, "the USB-attached module").toBe(1);
  });

  it("every recorded chunk replays into a frame that decodes", () => {
    const recordedFrames = fixture.events.filter((e) => e.kind === "frame");
    expect(recordedFrames.length, "a capture worth replaying").toBeGreaterThan(
      10,
    );

    const scanner = new FrameScanner();
    const cut: number[][] = [];
    const fake = FakeTransport.fromCapture(fixture);
    fake.onData((chunk) => cut.push(...scanner.push(chunk)));

    expect(
      cut,
      "every recorded frame is reproduced from the chunks",
    ).toHaveLength(recordedFrames.length);
    expect(scanner.buffered, "and nothing is left over").toBe(0);
    for (const [i, frame] of cut.entries()) {
      const decoded = decodeFrame(frame);
      expect(decoded.ok, `replayed frame ${i} decodes`).toBe(true);
    }

    // The one hand-built frame in the phase: encode_packet emits exactly one
    // class block, so the heartbeat's page report is spliced in and the BRC
    // LEN and the checksum are rewritten by hand. Two classes out of one frame
    // is what proves the splice; decodeFrame returning ok is what proves the
    // length and the checksum, because either being wrong returns undefined
    // rather than a wrong answer.
    const spliced = heartbeatFrame({
      sx: 0,
      sy: 0,
      type: 1,
      hwcfg: ZONA_HWCFG,
      activePage: 3,
      firmware: FIRMWARE,
    });
    const decoded = decodeFrame(spliced);
    expect(decoded.ok).toBe(true);
    expect(decoded.ok === true && decoded.classes).toHaveLength(2);
    expect(
      decoded.ok === true && decoded.classes.map((c) => c.class_name),
    ).toEqual(["HEARTBEAT", "PAGEACTIVE"]);
    expect(
      decoded.ok === true && decoded.classes[1].class_parameters.PAGENUMBER,
    ).toBe(3);
  });

  it("the capture's closing step is the restore heartbeat", () => {
    expect(fixture.steps.length).toBeGreaterThan(0);
    for (const step of fixture.steps) {
      expect(STEP_IDS, `"${step.id}" is a pinned step id`).toContain(step.id);
    }
    const last = fixture.steps[fixture.steps.length - 1];
    // The same assertion plan 05's fixtures.spec.ts makes against the real
    // capture. Pinning it here is what makes that gate writable before anyone
    // has touched a module.
    expect(last.id, "every run ends by re-enabling page changes").toBe(
      "restore-page-change",
    );
    expect(last.outcome, "fire and forget, so never acknowledged").toBe("sent");
  });
});
