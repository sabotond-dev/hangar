import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  EVENT_SETUP,
  EVENT_TIMER,
  FrameScanner,
  type DecodedClass,
  decodeFrame,
  encodeRequest,
  fetchConfig,
  sendConfig,
  storePage,
} from "$lib/protocol";
import { type Capture } from "./capture";
import { FakeTransport } from "./fake";
import { zonaResponder } from "./fixtures/synthetic";

/**
 * The real ZONA, not the generated one. Plan 05 re-pointed this test at the
 * hardware capture so the replay path - and through it every framing assertion
 * downstream of it - is pinned against chunk boundaries a real USB CDC link
 * produced, at the sizes a real 2 Mbaud read loop delivered them in, rather
 * than against boundaries this repository invented for itself.
 *
 * The synthetic capture and fixtures/synthetic.spec.ts stay exactly as they
 * were: they are what keeps the suite runnable on a machine with no ZONA.
 */
const HARDWARE = JSON.parse(
  readFileSync(
    new URL("./fixtures/zona-hardware.json", import.meta.url),
    "utf8",
  ),
) as Capture;

const SETUP_CONFIG = "--[[@cb]]print(1)";
const TIMER_CONFIG = "--[[@cb]]print(2)";

const hex = (bytes: number[] | Uint8Array) =>
  [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function state() {
  return {
    sx: 0,
    sy: 0,
    activePage: 0,
    configs: { [EVENT_SETUP]: SETUP_CONFIG, [EVENT_TIMER]: TIMER_CONFIG },
  };
}

/** The frame pump the page owns: chunks in, decoded classes out. */
function sink(fake: FakeTransport) {
  const scanner = new FrameScanner();
  const chunks: Uint8Array[] = [];
  const classes: DecodedClass[] = [];
  const refused: string[] = [];
  fake.onData((chunk) => {
    chunks.push(chunk);
    for (const frame of scanner.push(chunk)) {
      const decoded = decodeFrame(frame);
      if (decoded.ok) classes.push(...decoded.classes);
      else refused.push(decoded.reason);
    }
  });
  return { scanner, chunks, classes, refused };
}

describe("fake transport", () => {
  it("replay emits the recorded chunks in order", () => {
    const recordedChunks = HARDWARE.events.filter(
      (e) => e.dir === "rx" && e.kind === "chunk",
    );
    const recordedFrames = HARDWARE.events.filter((e) => e.kind === "frame");
    const outbound = HARDWARE.events.filter((e) => e.dir === "tx");
    expect(
      recordedChunks.length,
      "a real arm, not a smoke test",
    ).toBeGreaterThan(100);
    expect(
      outbound.length,
      "with outbound traffic to skip past",
    ).toBeGreaterThan(0);

    const fake = FakeTransport.fromCapture(HARDWARE);
    const out = sink(fake);
    // 149 tx events sit interleaved through this arm and not one of them is
    // replayed: FakeTransport is a module, not a tape recorder.
    expect(out.chunks.map(hex)).toEqual(recordedChunks.map((e) => e.hex));
    expect(
      out.scanner.buffered,
      "the real link left no partial frame behind",
    ).toBe(0);
    // Not one frame in the arm was refused by the decode guard, so the pump
    // that produced these classes is reading the same bytes the page read.
    expect(out.refused, "a real link, decoded clean").toEqual([]);
    expect(
      out.classes.filter((c) => c.class_name === "HEARTBEAT").length,
      "one decoded heartbeat per recorded heartbeat frame",
    ).toBe(
      recordedFrames.filter(
        (e) =>
          e.kind === "frame" &&
          e.ok &&
          e.classes.some((c) => c.class_name === "HEARTBEAT"),
      ).length,
    );
    // The module's own active page - 3, not the 0 that would have been the
    // tempting constant to hardcode - falls out of the heartbeats.
    expect(
      [
        ...new Set(
          out.classes
            .filter((c) => c.class_name === "PAGEACTIVE")
            .map((c) => c.class_parameters.PAGENUMBER),
        ),
      ],
      "the page number rides on every heartbeat, and it never moved",
    ).toEqual([HARDWARE.identity?.activePage]);
  });

  it("the responder answers a fetch with a report carrying the stored config", async () => {
    const fake = new FakeTransport({ responder: zonaResponder(state()) });
    const out = sink(fake);
    await fake.write(encodeRequest(fetchConfig(0, 0, 0, EVENT_TIMER)).bytes);
    const report = out.classes.find((c) => c.class_instr === "REPORT");
    expect(report?.class_name).toBe("CONFIG");
    expect(report?.class_parameters.ACTIONSTRING).toBe(TIMER_CONFIG);
    expect(report?.class_parameters.EVENTTYPE).toBe(EVENT_TIMER);
    // A directly attached module reports its own address as its source.
    expect(report?.brc_parameters.SX).toBe(0);
  });

  it("the responder echoes the request id into an acknowledgement's LASTHEADER", async () => {
    const fake = new FakeTransport({ responder: zonaResponder(state()) });
    const out = sink(fake);
    const write = encodeRequest(
      sendConfig(0, 0, 0, EVENT_TIMER, "--[[@cb]]print(9)"),
    );
    await fake.write(write.bytes);
    const ack = out.classes.find((c) => c.class_instr === "ACKNOWLEDGE");
    expect(ack?.class_name).toBe("CONFIG");
    expect(ack?.class_parameters.LASTHEADER).toBe(write.id);

    // ...and the write really landed, so a refetch returns what was written.
    await fake.write(encodeRequest(fetchConfig(0, 0, 0, EVENT_TIMER)).bytes);
    const report = out.classes.find((c) => c.class_instr === "REPORT");
    expect(report?.class_parameters.ACTIONSTRING).toBe("--[[@cb]]print(9)");
  });

  it("a drop fault withholds the matching response and nothing else", async () => {
    const fake = new FakeTransport({
      responder: zonaResponder(state()),
      faults: [
        {
          kind: "drop",
          match: { class_name: "CONFIG", class_instr: "ACKNOWLEDGE" },
        },
      ],
    });
    const out = sink(fake);
    await fake.write(
      encodeRequest(sendConfig(0, 0, 0, EVENT_TIMER, "x")).bytes,
    );
    expect(out.chunks, "the acknowledgement never arrives").toHaveLength(0);
    await fake.write(encodeRequest(fetchConfig(0, 0, 0, EVENT_TIMER)).bytes);
    expect(
      out.classes.map((c) => c.class_instr),
      "the report is untouched",
    ).toEqual(["REPORT"]);
  });

  it("a delay fault defers the response by the milliseconds it names", async () => {
    const fake = new FakeTransport({
      responder: zonaResponder(state()),
      faults: [
        {
          kind: "delay",
          match: { class_name: "CONFIG", class_instr: "REPORT" },
          byMs: 60,
        },
      ],
    });
    const out = sink(fake);
    const started = Date.now();
    await fake.write(encodeRequest(fetchConfig(0, 0, 0, EVENT_SETUP)).bytes);
    expect(out.chunks, "nothing has arrived yet").toHaveLength(0);
    await sleep(20);
    expect(out.chunks, "still nothing at a third of the delay").toHaveLength(0);
    await sleep(70);
    expect(out.chunks, "and then it arrives").toHaveLength(1);
    expect(Date.now() - started).toBeGreaterThanOrEqual(55);
  });

  it("a disconnect fault stops the transport after the named number of outbound frames", async () => {
    const fake = new FakeTransport({
      responder: zonaResponder(state()),
      faults: [{ kind: "disconnect", afterTxFrames: 1 }],
    });
    const closed: string[] = [];
    fake.onClose((reason) => closed.push(reason));
    expect(fake.isOpen).toBe(true);
    await fake.write(encodeRequest(fetchConfig(0, 0, 0, EVENT_SETUP)).bytes);
    expect(fake.isOpen, "the port is gone").toBe(false);
    expect(closed, "and it said so, once").toHaveLength(1);
    expect(closed[0]).toMatch(/unplug/i);
    await expect(
      fake.write(encodeRequest(storePage()).bytes),
      "a write to a closed port fails",
    ).rejects.toThrow();
    expect(fake.writes, "and is not recorded as sent").toHaveLength(1);
  });

  it("a corrupt fault flips a checksum character so the frame is refused by the decoder", async () => {
    const fake = new FakeTransport({
      responder: zonaResponder(state()),
      faults: [{ kind: "corrupt", match: { class_name: "CONFIG" } }],
    });
    const out = sink(fake);
    await fake.write(encodeRequest(fetchConfig(0, 0, 0, EVENT_SETUP)).bytes);
    expect(out.chunks, "the bytes still arrive").toHaveLength(1);
    expect(out.classes, "but nothing survives the decoder").toHaveLength(0);
    expect(out.refused).toEqual(["decode_packet_frame returned undefined"]);
  });

  it("a truncate fault stops mid-frame and leaves the scanner holding a partial", async () => {
    const fake = new FakeTransport({
      responder: zonaResponder(state()),
      faults: [{ kind: "truncate", afterRxBytes: 20 }],
      chunking: 8,
    });
    const out = sink(fake);
    await fake.write(encodeRequest(fetchConfig(0, 0, 0, EVENT_SETUP)).bytes);
    const delivered = out.chunks.reduce((n, c) => n + c.length, 0);
    expect(delivered, "the link stopped at the byte it named").toBe(20);
    expect(out.classes, "a partial frame decodes to nothing").toHaveLength(0);
    expect(out.scanner.buffered, "and the scanner is still holding it").toBe(
      20,
    );
  });
});
