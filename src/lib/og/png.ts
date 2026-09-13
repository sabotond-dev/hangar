// A PNG encoder with no dependency at all: truecolour, no interlacing, no
// ancillary chunks, nothing but two functions out of Node's own zlib. D-15
// disqualifies every native module and a headless browser; what is left is
// exactly enough because `zlib.crc32()` exists in Node 24 (no hand-rolled CRC
// table), `zlib.deflateSync` emits the RFC-1950 stream an IDAT chunk holds, and
// a 1200x630 mostly-black frame deflates to about 4 KB against Discord's
// megabyte ceiling, so filter None will do. THE ONE DESIGN RULE: NODE-ONLY. It
// imports `node:zlib`, so only `src/lib/og/` and `scripts/` may import it;
// png.spec.ts walks `src/` and `e2e/` and asserts nothing else does.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

import { crc32, deflateSync } from "node:zlib";

/** `89 50 4E 47 0D 0A 1A 0A` - the eight bytes every PNG opens with. */
const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Bit depth 8, colour type 2 (truecolour RGB), and no interlacing. */
const BIT_DEPTH = 8;
const COLOUR_TYPE_TRUECOLOUR = 2;

/**
 * Raised when the pixel buffer does not match the dimensions it is being
 * encoded under. Named, because the alternative is a file whose IHDR promises
 * 1200x630 and whose IDAT holds less than that: some decoders render it, most
 * render it wrong, and a silently truncated image is worse than a failed build.
 */
export class PngSizeError extends Error {
  constructor(actual: number, expected: number) {
    super(
      `encodePng: the pixel buffer is ${actual} bytes, ` +
        `but the given dimensions need exactly ${expected}`,
    );
    this.name = "PngSizeError";
  }
}

/** `length(4) + type(4) + data + crc32(type + data)(4)`, for every chunk. */
function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const tail = Buffer.alloc(4);
  // The CRC covers the type and the data, and never the length field.
  tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, tail]);
}

/**
 * Encode a tightly packed RGB buffer as a PNG.
 *
 * `rgb` is `width * height * 3` bytes, row-major, three bytes per pixel and no
 * padding at the end of a row - the layout `renderOgPixels` produces.
 *
 * Every scanline is written with filter type 0 (None). A PNG writer that cared
 * about bytes would try the other four filters per row and keep the cheapest;
 * this one does not, because the measured file is 4 KB and the ceiling is a
 * megabyte, and an unfiltered stream is a stream anyone can check by eye.
 */
export function encodePng(
  rgb: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const stride = width * 3;
  const expected = stride * height;
  if (rgb.length !== expected) throw new PngSizeError(rgb.length, expected);

  const raw = Buffer.alloc(height * (1 + stride));
  for (let y = 0; y < height; y++) {
    const dst = y * (1 + stride);
    raw[dst] = 0; // filter: None
    raw.set(rgb.subarray(y * stride, (y + 1) * stride), dst + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = BIT_DEPTH;
  ihdr[9] = COLOUR_TYPE_TRUECOLOUR;
  // Bytes 10, 11 and 12 - compression method, filter method, interlace method -
  // are all zero, which are the only values the format defines.

  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
