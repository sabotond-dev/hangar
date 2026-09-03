import { readFileSync } from "node:fs";
import { grid } from "@intechstudio/grid-protocol";
import { describe, expect, it, vi } from "vitest";
import { EVENT_TIMER } from "./constants";
import { decodeFrame } from "./decode";
import { encodeRequest, sendConfig, type GridDescriptor } from "./descriptors";

const source = readFileSync(new URL("./decode.ts", import.meta.url), "utf8");

/** encode_packet stops at the checksum, which is exactly what the scanner emits. */
const frameFor = (descr: GridDescriptor): number[] => {
  const encoded = grid.encode_packet(descr);
  if (!encoded) throw new Error("encode_packet returned undefined");
  return [...(encoded.serial as number[])];
};

const write = sendConfig(0, 0, 0, EVENT_TIMER, "--[[@cb]]print(1)");
const good = [...encodeRequest(write).bytes].slice(0, -1);
const corrupt = (() => {
  const bytes = [...good];
  const last = bytes.length - 1;
  bytes[last] = bytes[last] === 0x61 ? 0x62 : 0x61;
  return bytes;
})();

describe("frame decode guard", () => {
  it("a good frame decodes to its classes with its BRC parameters", () => {
    const result = decodeFrame(good);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.classes).toHaveLength(1);
    expect(result.classes[0].class_name).toBe("CONFIG");
    expect(result.classes[0].class_instr).toBe("EXECUTE");
    const id = result.classes[0].brc_parameters.ID;
    expect(id).toBeGreaterThanOrEqual(1);
    expect(id).toBeLessThanOrEqual(255);
  });

  it("a checksum-corrupted frame is refused and never reaches the class decoder", () => {
    const classDecoder = vi.spyOn(grid, "decode_packet_classes");
    try {
      const result = decodeFrame(corrupt);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.reason).toContain("decode_packet_frame");
      expect(classDecoder).toHaveBeenCalledTimes(0);
    } finally {
      classDecoder.mockRestore();
    }
  });

  it("the guard is truthiness because the failure return is undefined, never false", () => {
    // The desktop guards this with an inequality against false, which is dead
    // code: all seven failure exits return undefined.
    expect(grid.decode_packet_frame(corrupt)).toBeUndefined();
    expect((grid.decode_packet_frame(corrupt) as unknown) === false).toBe(
      false,
    );
    expect(source).not.toContain("!== false");
  });

  it("returns every class in the frame, never just the first", () => {
    // A single BRC frame carries more than one class as the normal case: a
    // TYPE 1 heartbeat carries a page report, a store acknowledgement carries a
    // debug text. This frame carries one, and the count is asserted against the
    // decoder's own array length rather than a literal.
    const frame = grid.decode_packet_frame(good);
    const result = decodeFrame(good);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.classes).toHaveLength(frame.length);
    expect(source).not.toMatch(/frame\[0\]/);
  });

  it("an acknowledgement decodes its LASTHEADER and leaves the config fields undefined", () => {
    const ack = frameFor({
      brc_parameters: { DX: 0, DY: 0 },
      class_name: "CONFIG",
      class_instr: "ACKNOWLEDGE",
      class_parameters: { LASTHEADER: 7 },
    });
    const result = decodeFrame(ack);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const params = result.classes[0].class_parameters;
    expect(Number(params.LASTHEADER)).toBe(7);
    // The class block is six bytes; everything past it decodes as undefined,
    // which is why a filter that requires these could never match an ACK.
    expect(params.PAGENUMBER).toBeUndefined();
    expect(params.EVENTTYPE).toBeUndefined();
    expect(params.ACTIONSTRING).toBeUndefined();
  });
});
