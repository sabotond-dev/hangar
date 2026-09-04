import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { PngSizeError, encodePng } from "./png";

// The encoder is checked, never trusted. Every assertion below reconstructs the
// bytes it is asserting about rather than reading a length the encoder also
// computed: the IDAT is inflated back and compared against the scanlines the
// encoder was handed, and every chunk CRC is recomputed over `type + data` with
// the same `zlib.crc32` the encoder used - which incidentally proves the
// framing, the lengths and the offsets, since a walk that drifted by one byte
// would land on a type string that is not four ASCII letters and on a CRC that
// does not match.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** The OG canvas, restated from 05-UI-SPEC so this spec fixes it too. */
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
/** Discord's practical ceiling. The measured pad PNG is roughly 4 KB. */
const SIZE_CEILING = 1024 * 1024;

interface PngChunk {
  type: string;
  data: Buffer;
  crc: number;
}

/**
 * Walk the file chunk by chunk from the byte after the signature, exactly as a
 * decoder would. Deliberately not driven by anything the encoder returned.
 */
function walkChunks(png: Uint8Array): PngChunk[] {
  const buf = Buffer.from(png.buffer, png.byteOffset, png.byteLength);
  const chunks: PngChunk[] = [];
  let at = SIGNATURE.length;
  while (at + 12 <= buf.length) {
    const length = buf.readUInt32BE(at);
    chunks.push({
      type: buf.toString("ascii", at + 4, at + 8),
      data: buf.subarray(at + 8, at + 8 + length),
      crc: buf.readUInt32BE(at + 8 + length),
    });
    at += 12 + length;
  }
  return chunks;
}

function chunkNamed(png: Uint8Array, type: string): PngChunk {
  const found = walkChunks(png).find((chunk) => chunk.type === type);
  if (found === undefined) throw new Error(`no ${type} chunk in the file`);
  return found;
}

/** A varied image, so an inflate round trip carries real information. */
function gradient(width: number, height: number): Uint8Array {
  const px = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    px[i * 3] = i % 256;
    px[i * 3 + 1] = (i * 7) % 256;
    px[i * 3 + 2] = (i * 31) % 251;
  }
  return px;
}

/** The scanlines `encodePng` is contracted to compress: filter byte 0, row. */
function expectedScanlines(
  rgb: Uint8Array,
  width: number,
  height: number,
): Buffer {
  const stride = width * 3;
  const raw = Buffer.alloc(height * (1 + stride));
  for (let y = 0; y < height; y++) {
    const dst = y * (1 + stride);
    raw[dst] = 0;
    raw.set(rgb.subarray(y * stride, (y + 1) * stride), dst + 1);
  }
  return raw;
}

/**
 * A mostly-black 1200x630 with a lime pad face on it - the shape `render.ts`
 * produces, restated here so the encoder's spec depends on nothing but the
 * encoder. The research measured this class of image at 4,321 bytes of IDAT.
 */
function realisticOgPixels(): Uint8Array {
  const px = new Uint8Array(OG_WIDTH * OG_HEIGHT * 3);
  for (let n = 0; n < 81; n++) {
    const col = n % 9;
    const row = (n - col) / 9;
    const rgb = [40 + col * 20, 120 + row * 14, 20 + ((col + row) % 5) * 9];
    for (let dy = 0; dy < 48; dy++) {
      for (let dx = 0; dx < 48; dx++) {
        const x = 366 + col * 52 + 2 + dx;
        const y = 81 + row * 52 + 2 + dy;
        const at = (y * OG_WIDTH + x) * 3;
        px[at] = rgb[0];
        px[at + 1] = rgb[1];
        px[at + 2] = rgb[2];
      }
    }
  }
  return px;
}

// ---------------------------------------------------------------------------
// Test 5's second half: the node-only rule, enforced rather than promised.
// ---------------------------------------------------------------------------

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
/** Everything a bundler could pull into a client chunk. */
const SCANNED_DIRS = ["src", "e2e"];
const SCANNED_EXTENSIONS = [".ts", ".js", ".mjs", ".svelte"];
/** The two places allowed to reach the encoder: this directory, and scripts/. */
const EXEMPT = join("src", "lib", "og");
const SKIPPED_DIRS = ["node_modules", ".svelte-kit"];

/**
 * Comments removed before the forbid-scan, in this repository's uniform form
 * (line, block and markup). A comment explaining why a module must NOT be
 * imported is correct code, and must never be able to fail a structural check.
 */
const stripComments = (source: string) =>
  source
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

function walkSources(dir: string, found: string[]): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIPPED_DIRS.includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walkSources(full, found);
    } else if (SCANNED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      found.push(full);
    }
  }
  return found;
}

describe("the PNG encoder", () => {
  it("opens with the PNG signature and closes with an empty IEND", () => {
    const png = encodePng(gradient(4, 2), 4, 2);
    expect([...png.subarray(0, 8)]).toEqual(SIGNATURE);

    const chunks = walkChunks(png);
    const last = chunks[chunks.length - 1];
    expect(last.type).toBe("IEND");
    expect(last.data.length).toBe(0);
    // Nothing after the terminator: the file ends where IEND's CRC ends.
    expect(png.length).toBe(
      chunks.reduce((total, chunk) => total + 12 + chunk.data.length, 8),
    );
  });

  it("writes an IHDR that decodes to its own arguments", () => {
    // Truecolour RGB, 8 bits, no compression method but 0, no filter method but
    // 0, no interlacing. Asserted small and again at the real canvas size,
    // because a byte-order slip is invisible on a square.
    for (const [width, height] of [
      [7, 3],
      [OG_WIDTH, OG_HEIGHT],
    ]) {
      const ihdr = chunkNamed(
        encodePng(new Uint8Array(width * height * 3), width, height),
        "IHDR",
      ).data;
      expect(ihdr.length).toBe(13);
      expect(ihdr.readUInt32BE(0)).toBe(width);
      expect(ihdr.readUInt32BE(4)).toBe(height);
      expect(ihdr[8]).toBe(8);
      expect(ihdr[9]).toBe(2);
      expect([ihdr[10], ihdr[11], ihdr[12]]).toEqual([0, 0, 0]);
    }

    // The same contract from the other side: a buffer that does not match the
    // dimensions the IHDR advertises is refused rather than encoded short. A
    // truncated image that still decodes is worse than a failed build.
    expect(() => encodePng(new Uint8Array(4 * 2 * 3 - 1), 4, 2)).toThrow(
      PngSizeError,
    );
    expect(() => encodePng(new Uint8Array(4 * 2 * 3 + 1), 4, 2)).toThrow(/24/);
  });

  it("holds an IDAT that inflates back to the scanlines it was given", () => {
    const width = 37;
    const height = 11;
    const rgb = gradient(width, height);
    const idat = chunkNamed(encodePng(rgb, width, height), "IDAT").data;

    const inflated = inflateSync(idat);
    expect(inflated.length).toBe(height * (1 + width * 3));
    // Every row prefixed with filter 0 (None), and nothing else added.
    for (let y = 0; y < height; y++) {
      expect(inflated[y * (1 + width * 3)]).toBe(0);
    }
    expect(
      Buffer.compare(inflated, expectedScanlines(rgb, width, height)),
    ).toBe(0);
  });

  it("carries a CRC on every chunk that verifies over type and data", () => {
    const chunks = walkChunks(encodePng(gradient(9, 9), 9, 9));
    // Non-vacuous: a walk that fell off the rails would find nothing to check.
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    expect(chunks.map((chunk) => chunk.type)).toEqual(["IHDR", "IDAT", "IEND"]);
    for (const chunk of chunks) {
      const over = Buffer.concat([
        Buffer.from(chunk.type, "ascii"),
        chunk.data,
      ]);
      expect(`${chunk.type} ${crc32(over)}`).toBe(`${chunk.type} ${chunk.crc}`);
    }
  });

  it("stays far under a megabyte, and stays out of every client chunk", () => {
    const png = encodePng(realisticOgPixels(), OG_WIDTH, OG_HEIGHT);
    expect([...png.subarray(0, 8)]).toEqual(SIGNATURE);
    expect(png.length).toBeLessThan(SIZE_CEILING);

    // `png.ts` imports node:zlib. A component that reached it would put a node:
    // builtin in a browser bundle, and the resulting build error names the
    // builtin rather than the import that dragged it in.
    const files = SCANNED_DIRS.flatMap((dir) =>
      walkSources(join(REPO_ROOT, dir), []),
    ).filter((file) => !file.includes(EXEMPT));
    expect(files.length).toBeGreaterThanOrEqual(30);

    const reaching = files.filter((file) => {
      const source = stripComments(readFileSync(file, "utf8"));
      return source.includes("$lib/og") || /lib[/]og[/]/.test(source);
    });
    expect(reaching).toEqual([]);
  });
});
