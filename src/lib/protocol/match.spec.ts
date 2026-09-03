import { grid } from "@intechstudio/grid-protocol";
import { describe, expect, it } from "vitest";
import { ELEMENT_TOUCH, EVENT_TIMER, PROTOCOL_VERSION } from "./constants";
import { decodeFrame, type DecodedClass } from "./decode";
import {
  encodeRequest,
  fetchConfig,
  hostHeartbeat,
  sendConfig,
  type GridDescriptor,
  type GridRequest,
  type ResponseFilter,
} from "./descriptors";
import { matchResponse } from "./match";

const CONFIG = "--[[@cb]]print(1)";

/**
 * Encode a descriptor, decode it back, and present it as a class the way an
 * attached module would.
 *
 * encode_packet forces the SOURCE address to zero on the wire and the decoder
 * subtracts 127, so an outbound frame decodes SX/SY as -127. A real inbound
 * frame from a directly attached module reports SX/SY 0. Only those two fields
 * are adjusted; the class shape itself is genuine decoder output.
 */
const inbound = (descr: GridDescriptor, sx = 0, sy = 0): DecodedClass => {
  const encoded = grid.encode_packet(descr);
  if (!encoded) throw new Error("encode_packet returned undefined");
  const result = decodeFrame([...(encoded.serial as number[])]);
  if (!result.ok) throw new Error(result.reason);
  const cls = result.classes[0];
  return { ...cls, brc_parameters: { ...cls.brc_parameters, SX: sx, SY: sy } };
};

const filterOf = (req: GridRequest): ResponseFilter => {
  if (!req.filter) throw new Error(`${req.label} has no filter`);
  return req.filter;
};

const report = inbound({
  brc_parameters: { DX: 0, DY: 0 },
  class_name: "CONFIG",
  class_instr: "REPORT",
  class_parameters: {
    VERSIONMAJOR: PROTOCOL_VERSION.MAJOR,
    VERSIONMINOR: PROTOCOL_VERSION.MINOR,
    VERSIONPATCH: PROTOCOL_VERSION.PATCH,
    PAGENUMBER: 0,
    ELEMENTNUMBER: ELEMENT_TOUCH,
    EVENTTYPE: EVENT_TIMER,
    ACTIONLENGTH: CONFIG.length,
    ACTIONSTRING: CONFIG,
  },
});

const acknowledgement = (instr: string): DecodedClass =>
  inbound({
    brc_parameters: { DX: 0, DY: 0 },
    class_name: "CONFIG",
    class_instr: instr,
    class_parameters: { LASTHEADER: 7 },
  });

describe("response matcher", () => {
  it("a heartbeat never resolves a waiter, even against a loose filter", () => {
    const beat = inbound(hostHeartbeat().descr, -127, -127);
    expect(beat.class_name).toBe("HEARTBEAT");
    expect(
      matchResponse(beat, { class_name: "HEARTBEAT", class_instr: "EXECUTE" }),
    ).toBe("no");
  });

  it("a report matches on class, instruction, source, page, element and event", () => {
    expect(report.brc_parameters.SX).toBe(0);
    expect(
      matchResponse(report, filterOf(fetchConfig(0, 0, 0, EVENT_TIMER))),
    ).toBe("ok");
  });

  it("a report is never matched on the request id", () => {
    const request = fetchConfig(0, 0, 0, EVENT_TIMER);
    // The id counter cycles 1..255; a second encode guarantees an id that is
    // not the protocol major version.
    const first = encodeRequest(request).id;
    const requestId =
      first === PROTOCOL_VERSION.MAJOR ? encodeRequest(request).id : first;
    // LASTHEADER and VERSIONMAJOR share offset 5. On a REPORT those bytes are
    // the firmware's protocol major, so correlating on them would reject every
    // fetch - or accept one by coincidence when the id happened to be 1.
    expect(Number(report.class_parameters.LASTHEADER)).toBe(
      PROTOCOL_VERSION.MAJOR,
    );
    expect(Number(report.class_parameters.LASTHEADER)).not.toBe(requestId);
    expect(matchResponse(report, filterOf(request))).toBe("ok");
    expect(matchResponse(report, filterOf(request), requestId)).toBe("no");
  });

  it("an acknowledgement matches only when the id it echoes is the request id", () => {
    const ack = acknowledgement("ACKNOWLEDGE");
    expect(Number(ack.class_parameters.LASTHEADER)).toBe(7);
    expect(
      matchResponse(ack, filterOf(sendConfig(0, 0, 0, EVENT_TIMER, CONFIG)), 7),
    ).toBe("ok");
  });

  it("an acknowledgement carrying a different id does not match", () => {
    expect(
      matchResponse(
        acknowledgement("ACKNOWLEDGE"),
        filterOf(sendConfig(0, 0, 0, EVENT_TIMER, CONFIG)),
        8,
      ),
    ).toBe("no");
  });

  it("a negative acknowledgement rejects immediately", () => {
    // A NACK is a distinct outcome, not a timeout, and the queue must not
    // retry it.
    expect(
      matchResponse(
        acknowledgement("NACKNOWLEDGE"),
        filterOf(sendConfig(0, 0, 0, EVENT_TIMER, CONFIG)),
        7,
      ),
    ).toBe("nack");
  });

  it("a response from another module's address does not match", () => {
    expect(
      matchResponse(report, filterOf(fetchConfig(1, 0, 0, EVENT_TIMER))),
    ).toBe("no");
  });
});
