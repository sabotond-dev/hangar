import { describe, expect, it } from "vitest";
import {
  EVENT_SETUP,
  FrameScanner,
  decodeFrame,
  encodeRequest,
  fetchConfig,
} from "$lib/protocol";
import { CAPTURE_SCHEMA, CaptureRecorder, type CaptureRun } from "./capture";
import { FakeTransport } from "./fake";
import { configReportFrame, heartbeatFrame } from "./fixtures/synthetic";

const RUN: CaptureRun = {
  id: "spec-run",
  hostHeartbeat: { enabled: true, intervalMs: 300, type: 255 },
  pacing: { preSendDelayMs: 10 },
  timeouts: { fetchMs: 1000, executeMs: 500, pagestoreMs: 3000 },
  retries: 3,
  userAgent: "vitest",
  origin: "spec",
  protocolPin: "1.20260825.1135",
};

/** A deterministic performance.now(), so `t` is asserted rather than tolerated. */
function clock(step = 1.5) {
  let t = 0;
  return () => (t += step);
}

const hex = (bytes: number[] | Uint8Array) =>
  [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");

describe("capture recorder (D-07)", () => {
  it("the capture declares its schema, source and run block", () => {
    const rec = new CaptureRecorder(RUN, { source: "synthetic", now: clock() });
    const out = rec.toJSON();
    expect(out.schema).toBe(CAPTURE_SCHEMA);
    // `source` is a sibling of `run`, not a field inside it, and there is no
    // default - the constructor makes every caller choose.
    expect(out.source).toBe("synthetic");
    expect(out.run).toEqual(RUN);
    expect(out.capturedAt, "an ISO instant").toMatch(/^\d{4}-\d\d-\d\dT/);
    expect(out.events).toEqual([]);
    expect(out.steps).toEqual([]);
  });

  it("every outbound write is recorded as a tx bytes event with its hex", () => {
    const rec = new CaptureRecorder(RUN, { source: "synthetic", now: clock() });
    const { bytes } = encodeRequest(fetchConfig(0, 0, 0, EVENT_SETUP));
    rec.tx(bytes);
    const [event] = rec.toJSON().events;
    expect(event.dir).toBe("tx");
    expect(event.kind).toBe("bytes");
    expect(event.hex).toBe(hex(bytes));
    expect(event.n).toBe(0);
    expect(event.t, "performance.now() milliseconds, fraction kept").toBe(1.5);
  });

  it("an inbound chunk and the frame the scanner cut from it are recorded separately", () => {
    const rec = new CaptureRecorder(RUN, { source: "synthetic", now: clock() });
    const frame = heartbeatFrame({
      sx: 0,
      sy: 0,
      type: 1,
      hwcfg: 161,
      activePage: 0,
      firmware: { major: 1, minor: 5, patch: 5 },
    });
    const chunk = Uint8Array.from([...frame, 10]);
    rec.rxChunk(chunk);
    rec.rxFrame(frame, decodeFrame(frame));

    const events = rec.toJSON().events;
    expect(events, "the chunk and the frame are two records").toHaveLength(2);
    expect(events[0].kind).toBe("chunk");
    expect(events[0].hex, "the chunk keeps its terminator").toBe(hex(chunk));
    expect(events[1].kind).toBe("frame");
    expect(events[1].hex, "the frame does not").toBe(hex(frame));
    expect(events[1].ok).toBe(true);
    expect(
      events[1].ok === true && events[1].classes.map((c) => c.class_name),
    ).toEqual(["HEARTBEAT", "PAGEACTIVE"]);
    expect(
      events.map((e) => e.n),
      "n is monotonic",
    ).toEqual([0, 1]);
  });

  it("a rejected frame is recorded with ok false and the decoder's reason", () => {
    const rec = new CaptureRecorder(RUN, { source: "synthetic", now: clock() });
    const frame = configReportFrame({
      sx: 0,
      sy: 0,
      page: 0,
      event: EVENT_SETUP,
      config: "print(1)",
    });
    // One checksum character flipped: decode_packet_frame returns undefined and
    // the console.log it prints is not a record of anything.
    const broken = [...frame];
    broken[broken.length - 1] = broken[broken.length - 1] === 48 ? 49 : 48;
    const decoded = decodeFrame(broken);
    expect(decoded.ok, "the input really is refused").toBe(false);
    rec.rxFrame(broken, decoded);

    const [event] = rec.toJSON().events;
    expect(event.kind).toBe("frame");
    expect(event.ok).toBe(false);
    expect(event.ok === false && event.reason).toContain("undefined");
    expect(event.hex, "the refused bytes are kept, not dropped").toBe(
      hex(broken),
    );
  });

  it("a step carries sentAt, settledAt, latencyMs, attempts and outcome", () => {
    const rec = new CaptureRecorder(RUN, { source: "synthetic", now: clock() });
    rec.step({
      id: "fetch-timer",
      descr: "CONFIG/FETCH ev6",
      requestId: 3,
      sentAt: 120.2,
      settledAt: 131.4,
      latencyMs: 11.2,
      attempts: 1,
      outcome: "ok",
      matchedOn: ["class", "instr", "SX", "SY"],
    });
    const [step] = rec.toJSON().steps;
    expect(step.id).toBe("fetch-timer");
    expect(step.sentAt).toBe(120.2);
    expect(step.settledAt).toBe(131.4);
    expect(step.latencyMs).toBe(11.2);
    expect(step.attempts).toBe(1);
    expect(step.outcome).toBe("ok");
    expect(step.requestId).toBe(3);
  });

  it("the capture survives a round trip through JSON and back into the fake transport", () => {
    const rec = new CaptureRecorder(RUN, { source: "synthetic", now: clock() });
    const frames = [
      heartbeatFrame({
        sx: 0,
        sy: 0,
        type: 1,
        hwcfg: 161,
        activePage: 0,
        firmware: { major: 1, minor: 5, patch: 5 },
      }),
      configReportFrame({
        sx: 0,
        sy: 0,
        page: 0,
        event: EVENT_SETUP,
        config: "print(1)",
      }),
    ];
    const chunks = frames.map((f) => Uint8Array.from([...f, 10]));
    for (const chunk of chunks) rec.rxChunk(chunk);
    rec.setIdentity({
      usbVendorId: 0x303a,
      usbProductId: 0x8123,
      sx: 0,
      sy: 0,
      rot: 0,
      hwcfg: 161,
      moduleType: "ZONA",
      revision: "RevH",
      firmware: { major: 1, minor: 5, patch: 5 },
      heartbeatType: 1,
      activePage: 0,
      otherModules: [],
    });

    const reparsed = JSON.parse(JSON.stringify(rec.toJSON()));
    const fake = FakeTransport.fromCapture(reparsed);
    const seen: Uint8Array[] = [];
    fake.onData((c) => seen.push(c));

    expect(seen.map(hex), "replayed chunks are the recorded ones").toEqual(
      chunks.map(hex),
    );
    // And they are still real frames after the round trip.
    const scanner = new FrameScanner();
    const cut = seen.flatMap((c) => scanner.push(c));
    expect(cut).toHaveLength(2);
    expect(cut.map((f) => decodeFrame(f).ok)).toEqual([true, true]);
  });
});
