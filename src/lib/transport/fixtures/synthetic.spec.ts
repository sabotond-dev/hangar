import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ELEMENT_SYSTEM,
  ELEMENT_TOUCH,
  EVENT_SETUP,
  EVENT_TIMER,
  FrameScanner,
  SYSTEM_DEFAULT_SETUP,
  TERMINATOR,
  TOUCH_EVENTS,
  ZONA_HWCFG,
  ZONA_USB,
  type DecodedClass,
  type GridRequest,
  decodeFrame,
  encodeRequest,
  fetchConfig,
  fetchSerialNumber,
  hostHeartbeat,
  moduleKeyOf,
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
  powerCycle,
  rigResponder,
  zonaResponder,
  type ZonaState,
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

// Phase 7 (07-02): the scripted ZONA can refuse, remember, and answer for
// itself. Every failure the install flow names has to be producible from node
// by a module that does not exist, so each branch is pinned here directly
// against the responder, with no queue in between.
const SETUP_CONFIG = "--[[@cb]]print(1)";
const TIMER_CONFIG = "--[[@cb]]print(2)";
const ACTIVE_PAGE = 2;

const zonaState = (over: Partial<ZonaState> = {}): ZonaState => ({
  sx: 0,
  sy: 0,
  activePage: ACTIVE_PAGE,
  configs: { [EVENT_SETUP]: SETUP_CONFIG, [EVENT_TIMER]: TIMER_CONFIG },
  ...over,
});

type Responder = (outbound: DecodedClass, requestId: number) => number[][];

function classesOf(frame: number[]): DecodedClass[] {
  const decoded = decodeFrame(frame);
  if (!decoded.ok) throw new Error(`frame did not decode: ${decoded.reason}`);
  return decoded.classes;
}

/** Put one request to a responder the way FakeTransport.write does. */
function ask(
  answer: Responder,
  req: GridRequest,
): { id: number; replies: DecodedClass[][] } {
  const { bytes, id } = encodeRequest(req);
  const frame = [...bytes];
  if (frame[frame.length - 1] === TERMINATOR) frame.pop();
  const [outbound] = classesOf(frame);
  return { id, replies: answer(outbound, id).map(classesOf) };
}

describe("the scripted ZONA", () => {
  it("a config write to a page that is not active is refused with a NACK echoing the id", () => {
    const state = zonaState();
    const answer = zonaResponder(state);
    const NEW = "--[[@cb]]print(9)";

    // grid_decode.c:1272, `currentpage`: refused, and nothing written.
    const refused = ask(
      answer,
      sendConfig(0, 0, ACTIVE_PAGE + 1, EVENT_SETUP, NEW),
    );
    expect(refused.replies, "exactly one frame").toHaveLength(1);
    const [nack] = refused.replies[0];
    expect(nack.class_name).toBe("CONFIG");
    expect(nack.class_instr).toBe("NACKNOWLEDGE");
    expect(Number(nack.class_parameters.LASTHEADER)).toBe(refused.id);
    expect(state.configs[EVENT_SETUP], "RAM untouched").toBe(SETUP_CONFIG);

    // The same write to the active page lands.
    const accepted = ask(
      answer,
      sendConfig(0, 0, ACTIVE_PAGE, EVENT_SETUP, NEW),
    );
    expect(accepted.replies).toHaveLength(1);
    const [ack] = accepted.replies[0];
    expect(ack.class_name).toBe("CONFIG");
    expect(ack.class_instr).toBe("ACKNOWLEDGE");
    expect(Number(ack.class_parameters.LASTHEADER)).toBe(accepted.id);
    expect(state.configs[EVENT_SETUP]).toBe(NEW);
  });

  it("a store copies RAM into flash, and a power cycle brings flash back", () => {
    const state = zonaState();
    const answer = zonaResponder(state);
    const STORED = "--[[@cb]]print(7)";
    const UNSTORED = "--[[@cb]]print(8)";

    // A write fixes flash at what RAM held before it, so a power cycle with
    // no store ever would bring back the factory string, not the written one.
    ask(answer, sendConfig(0, 0, ACTIVE_PAGE, EVENT_SETUP, STORED));
    expect(state.configs[EVENT_SETUP]).toBe(STORED);
    expect(state.flash?.[EVENT_SETUP], "flash still holds the original").toBe(
      SETUP_CONFIG,
    );

    // grid_decode.c:955-961: the store copies RAM into flash and reloads it.
    const store = ask(answer, storePage());
    expect(store.replies).toHaveLength(1);
    expect(store.replies[0][0].class_name).toBe("PAGESTORE");
    expect(store.replies[0][0].class_instr).toBe("ACKNOWLEDGE");
    expect(Number(store.replies[0][0].class_parameters.LASTHEADER)).toBe(
      store.id,
    );
    expect(state.flash?.[EVENT_SETUP]).toBe(STORED);
    expect(state.flash?.[EVENT_TIMER]).toBe(TIMER_CONFIG);

    // Written but not stored: a power cycle loses it.
    ask(answer, sendConfig(0, 0, ACTIVE_PAGE, EVENT_SETUP, UNSTORED));
    expect(state.configs[EVENT_SETUP]).toBe(UNSTORED);
    powerCycle(state);
    expect(state.configs[EVENT_SETUP], "RAM is flash again").toBe(STORED);
    expect(state.configs[EVENT_TIMER]).toBe(TIMER_CONFIG);

    // Pitfall 8: on a rig one broadcast store is acknowledged by every module,
    // each echoing the same LASTHEADER, each from its own address.
    const rig = [zonaState(), zonaState({ sx: 1 }), zonaState({ sx: 2 })];
    const broadcast = ask(rigResponder(rig), storePage());
    expect(broadcast.replies, "three acknowledgements").toHaveLength(3);
    for (const [cls] of broadcast.replies) {
      expect(cls.class_name).toBe("PAGESTORE");
      expect(cls.class_instr).toBe("ACKNOWLEDGE");
      expect(Number(cls.class_parameters.LASTHEADER)).toBe(broadcast.id);
    }
    expect(broadcast.replies.map(([cls]) => cls.brc_parameters.SX)).toEqual([
      0, 1, 2,
    ]);
    for (const module of rig) expect(module.flash).toEqual(module.configs);
  });

  it("the system element's RAM is kept apart from the touch element's, and every report echoes the element it was asked about", () => {
    // Phase 12, plan 02. 12-RESEARCH's Pitfall 1: "the fake ZONA conflates
    // elements". A responder that ignored ELEMENTNUMBER would answer a fetch
    // of 255 with the touch element's Setup and let a write to 255 overwrite
    // it - so the library plan would look correct in node and destroy the
    // pad on the desk.
    const state = zonaState();
    const answer = zonaResponder(state);
    const LIBRARY = "--[[@cb]]function Q()return 1 end";
    const PAD = "--[[@cb]]print(9)";

    const toSystem = ask(
      answer,
      sendConfig(0, 0, ACTIVE_PAGE, EVENT_SETUP, LIBRARY, ELEMENT_SYSTEM),
    );
    expect(toSystem.replies[0][0].class_instr).toBe("ACKNOWLEDGE");
    const toTouch = ask(
      answer,
      sendConfig(0, 0, ACTIVE_PAGE, EVENT_SETUP, PAD),
    );
    expect(toTouch.replies[0][0].class_instr).toBe("ACKNOWLEDGE");

    // TWO RAMS, APART. Same page, same event number, different elements.
    expect(state.system?.[EVENT_SETUP], "the system element's RAM").toBe(
      LIBRARY,
    );
    expect(state.configs[EVENT_SETUP], "the touch element's RAM").toBe(PAD);
    expect(state.configs[EVENT_TIMER], "untouched by either").toBe(
      TIMER_CONFIG,
    );

    // AND EACH REPORT ECHOES ITS OWN ELEMENT, which is what makes the fetch
    // filter in descriptors.ts match instead of the request timing out.
    const readBack = (element: number) => {
      const answered = ask(
        answer,
        fetchConfig(0, 0, ACTIVE_PAGE, EVENT_SETUP, element),
      );
      expect(answered.replies, "exactly one report").toHaveLength(1);
      const [report] = answered.replies[0];
      expect(report.class_name).toBe("CONFIG");
      expect(report.class_instr).toBe("REPORT");
      expect(
        Number(report.class_parameters.ELEMENTNUMBER),
        `the report for element ${element}`,
      ).toBe(element);
      return String(report.class_parameters.ACTIONSTRING);
    };
    expect(readBack(ELEMENT_SYSTEM)).toBe(LIBRARY);
    expect(readBack(ELEMENT_TOUCH)).toBe(PAD);

    // A FACTORY MODULE - no `system` key at all - answers the package's own
    // 24-character page-init default, not an empty string. Read from the
    // package here too: this file never types the string.
    const factory = zonaState();
    expect(factory.system, "absent means factory").toBeUndefined();
    const fresh = ask(
      zonaResponder(factory),
      fetchConfig(0, 0, ACTIVE_PAGE, EVENT_SETUP, ELEMENT_SYSTEM),
    );
    const factoryAnswer = String(
      fresh.replies[0][0].class_parameters.ACTIONSTRING,
    );
    expect(factoryAnswer).toBe(SYSTEM_DEFAULT_SETUP);
    expect([...factoryAnswer].length).toBe(24);

    // Both maps survive a store, and both come back from a power cycle. A
    // library written but never stored is lost exactly as a pad is.
    ask(answer, storePage());
    expect(state.systemFlash?.[EVENT_SETUP]).toBe(LIBRARY);
    expect(state.flash?.[EVENT_SETUP]).toBe(PAD);
    ask(
      answer,
      sendConfig(
        0,
        0,
        ACTIVE_PAGE,
        EVENT_SETUP,
        "--[[@cb]]Q=nil",
        ELEMENT_SYSTEM,
      ),
    );
    expect(state.system?.[EVENT_SETUP]).toBe("--[[@cb]]Q=nil");
    powerCycle(state);
    expect(state.system?.[EVENT_SETUP], "flash is RAM again").toBe(LIBRARY);
    expect(state.configs[EVENT_SETUP], "and the pad came back too").toBe(PAD);
  });

  it("a serial-number fetch is answered only when it is addressed", () => {
    const words = [0x12345678, 0x9abcdef0, 0, 0] as const;
    const withSerial = zonaState({ serial: words });

    // Addressed to its own sx, sy: one REPORT, four words back, and a source
    // address of -127, -127 because firmware builds it at the global position.
    const own = ask(zonaResponder(withSerial), fetchSerialNumber(0, 0));
    expect(own.replies).toHaveLength(1);
    const [report] = own.replies[0];
    expect(report.class_name).toBe("SERIALNUMBER");
    expect(report.class_instr).toBe("REPORT");
    expect(
      ["WORD0", "WORD1", "WORD2", "WORD3"].map(
        (w) => Number(report.class_parameters[w]) >>> 0,
      ),
    ).toEqual([...words]);
    expect(report.brc_parameters.SX).toBe(-127);
    expect(report.brc_parameters.SY).toBe(-127);
    expect(moduleKeyOf(report)).toBe("123456789abcdef00000000000000000");

    // Addressed to somebody else: silence. No serial at all: silence.
    expect(
      ask(zonaResponder(withSerial), fetchSerialNumber(1, 0)).replies,
    ).toHaveLength(0);
    expect(
      ask(zonaResponder(zonaState()), fetchSerialNumber(0, 0)).replies,
    ).toHaveLength(0);

    // The measurement behind fetchSerialNumber(sx, sy): a BROADCAST fetch on a
    // rig of three produces three reports that cannot be told apart by address.
    const rig = [
      zonaState({ serial: words }),
      zonaState({ sx: 1, serial: [0x11111111, 0, 0, 0] }),
      zonaState({ sx: 2, serial: [0x22222222, 0, 0, 0] }),
    ];
    const answer = rigResponder(rig);
    const broadcast = ask(answer, fetchSerialNumber(-127, -127));
    expect(broadcast.replies, "every module answers").toHaveLength(3);
    const addresses = new Set(
      broadcast.replies.map(
        ([cls]) => `${cls.brc_parameters.SX},${cls.brc_parameters.SY}`,
      ),
    );
    expect(addresses, "and not one is attributable").toEqual(
      new Set(["-127,-127"]),
    );

    // Addressed, exactly one answers - and it is the one that was asked.
    const addressed = ask(answer, fetchSerialNumber(1, 0));
    expect(addressed.replies).toHaveLength(1);
    expect(Number(addressed.replies[0][0].class_parameters.WORD0) >>> 0).toBe(
      0x11111111,
    );
  });
});
