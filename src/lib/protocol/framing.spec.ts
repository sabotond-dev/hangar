import { describe, expect, it } from "vitest";
import { EVENT_SETUP } from "./constants";
import { decodeFrame } from "./decode";
import {
  encodeRequest,
  fetchConfig,
  hostHeartbeat,
  storePage,
} from "./descriptors";
import { EOT, FrameScanner, MAX_BUFFER, TERMINATOR } from "./framing";

/**
 * Every input in this file is real encoder output, so no test invents bytes.
 * The trailing byte of each is the terminator the caller appends; the scanner
 * emits everything up to but not including it.
 */
const wire = (bytes: Uint8Array): number[] => [...bytes];
const FETCH = wire(encodeRequest(fetchConfig(0, 0, 0, EVENT_SETUP)).bytes);
const HEARTBEAT = wire(encodeRequest(hostHeartbeat()).bytes);
const STORE = wire(encodeRequest(storePage()).bytes);

/** The frame the scanner should emit for a given whole-chunk input. */
const body = (frame: number[]) => frame.slice(0, -1);

describe("frame scanner", () => {
  it("a whole frame in one chunk emits one frame and empties the buffer", () => {
    const scanner = new FrameScanner();
    const out = scanner.push(FETCH);
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual(body(FETCH));
    expect(scanner.buffered).toBe(0);
  });

  it("every split point emits one byte-identical frame", () => {
    for (let i = 1; i < FETCH.length; i++) {
      const scanner = new FrameScanner();
      const out = [
        ...scanner.push(FETCH.slice(0, i)),
        ...scanner.push(FETCH.slice(i)),
      ];
      expect(out, `split at ${i}`).toHaveLength(1);
      expect(out[0], `split at ${i}`).toEqual(body(FETCH));
      expect(scanner.buffered, `split at ${i}`).toBe(0);
    }
  });

  it("the terminator alone in the second chunk still emits the frame", () => {
    const scanner = new FrameScanner();
    const split = FETCH.length - 1;
    expect(FETCH[split]).toBe(TERMINATOR);
    const out = [
      ...scanner.push(FETCH.slice(0, split)),
      ...scanner.push(FETCH.slice(split)),
    ];
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual(body(FETCH));
  });

  it("the EOT alone in the second chunk still emits the frame", () => {
    const scanner = new FrameScanner();
    const split = FETCH.length - 4;
    expect(FETCH[split]).toBe(EOT);
    const out = [
      ...scanner.push(FETCH.slice(0, split)),
      ...scanner.push(FETCH.slice(split)),
    ];
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual(body(FETCH));
  });

  it("three coalesced frames emit three frames in order", () => {
    const scanner = new FrameScanner();
    const out = scanner.push([...FETCH, ...HEARTBEAT, ...STORE]);
    expect(out).toHaveLength(3);
    expect(out[0]).toEqual(body(FETCH));
    expect(out[1]).toEqual(body(HEARTBEAT));
    expect(out[2]).toEqual(body(STORE));
    expect(scanner.buffered).toBe(0);
  });

  it("two frames plus a trailing partial retain the partial", () => {
    const scanner = new FrameScanner();
    const partial = STORE.slice(0, 11);
    const out = scanner.push([...FETCH, ...HEARTBEAT, ...partial]);
    expect(out).toHaveLength(2);
    expect(out[1]).toEqual(body(HEARTBEAT));
    expect(scanner.buffered).toBe(partial.length);
  });

  it("leading garbage is absorbed by the first frame and the next one resyncs", () => {
    const scanner = new FrameScanner();
    const out = scanner.push([0x41, 0x42, 0x43, ...FETCH, ...HEARTBEAT]);
    expect(out).toHaveLength(2);
    // The garbage lands inside the first emitted frame, which then fails its
    // own length and checksum checks. The scanner does not decode; the decoder
    // drops it and the NEXT frame is clean. That is the resync property.
    expect(decodeFrame(out[0]).ok).toBe(false);
    expect(decodeFrame(out[1]).ok).toBe(true);
  });

  it("eight kilobytes with no delimiter resets the buffer and reports the overflow once", () => {
    const scanner = new FrameScanner();
    let overflows = 0;
    scanner.onOverflow = () => {
      overflows += 1;
    };
    scanner.push(new Array(MAX_BUFFER + 1).fill(0x41));
    expect(overflows).toBe(1);
    expect(scanner.buffered).toBe(0);
    const out = scanner.push(HEARTBEAT);
    expect(out).toHaveLength(1);
    expect(decodeFrame(out[0]).ok).toBe(true);
  });

  it("the emitted frame ends with EOT and two checksum characters, and a stray terminator byte inside the payload does not split it", () => {
    const emitted = new FrameScanner().push(FETCH)[0];
    expect(emitted[emitted.length - 3]).toBe(EOT);
    expect(String.fromCharCode(emitted[emitted.length - 2])).toMatch(
      /[0-9a-f]/,
    );
    expect(String.fromCharCode(emitted[emitted.length - 1])).toMatch(
      /[0-9a-f]/,
    );

    // Every other input in this file is encoder output, which carries byte 10
    // only as the terminator the caller appends. Without this half, the
    // buf[i - 3] === EOT half of the condition is never exercised and a scanner
    // that ignored it would stay green.
    const torn = [...FETCH];
    const at = torn.findIndex(
      (b, i) => i > 12 && i < torn.length - 6 && torn[i - 3] !== EOT,
    );
    expect(at).toBeGreaterThan(12);
    expect(torn[at - 3]).not.toBe(EOT);
    torn[at] = TERMINATOR;
    const out = new FrameScanner().push(torn);
    // The checksum is now wrong, which is the decoder's problem, not the
    // scanner's: this is purely the boundary property.
    expect(out).toHaveLength(1);
    expect(out[0]).toHaveLength(FETCH.length - 1);
  });
});
