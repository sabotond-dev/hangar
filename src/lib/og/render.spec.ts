import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ACCENT_RGB,
  FRAME_RGB,
  LINE_ALPHA,
  LINE_SOFT_ALPHA,
  OG_HEIGHT,
  OG_TICK,
  OG_WIDTH,
  UNLIT_DOT_RGB,
  flattenOnBlack,
  renderOgPixels,
} from "./render";

// The composition is 05-UI-SPEC "The OG image", and this spec restates its
// numbers as literals rather than importing the module's own constants for the
// coordinates it samples. A geometry constant that moved would then move the
// picture and NOT the expectation, which is the only way a geometry test says
// anything at all.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

// 05-UI-SPEC, verbatim: canvas 1200 x 630; pad face 468 x 468 centred at
// (600, 315); nine cells of 52px, each painting 48 x 48 inside a 2px gutter;
// frame 484 x 484 centred, radius 12, 2px stroke.
const FACE_LEFT = 366; // 600 - 468 / 2
const FACE_TOP = 81; // 315 - 468 / 2
const FACE_RIGHT = 833; // last pixel of the face, inclusive
const FACE_BOTTOM = 548;
const CELL = 52;
const GUTTER = 2;
const PAINT = 48;
const FRAME_LEFT = 358; // 600 - 484 / 2
const FRAME_TOP = 73; // 315 - 484 / 2
const FRAME_RIGHT = 841;
const FRAME_BOTTOM = 556;

const BLACK = [0, 0, 0];
/** The UI spec's two flattened hexes, as channels. */
const UI_SPEC_LINE_SOFT = [0x2b, 0x33, 0x10];
const UI_SPEC_LINE = [0x56, 0x66, 0x1f];

const APP_CSS = new URL("../../app.css", import.meta.url);

function pixelAt(px: Uint8Array, x: number, y: number): number[] {
  const at = (y * OG_WIDTH + x) * 3;
  return [px[at], px[at + 1], px[at + 2]];
}

/** A 243-byte screen-order RGB frame with one cell lit. */
function frameWithCell(n: number, rgb: number[]): Uint8Array {
  const frame = new Uint8Array(243);
  frame[n * 3] = rgb[0];
  frame[n * 3 + 1] = rgb[1];
  frame[n * 3 + 2] = rgb[2];
  return frame;
}

/** Every cell lit with the same colour - the geometry probe. */
function frameAllLit(rgb: number[]): Uint8Array {
  const frame = new Uint8Array(243);
  for (let n = 0; n < 81; n++) {
    frame[n * 3] = rgb[0];
    frame[n * 3 + 1] = rgb[1];
    frame[n * 3 + 2] = rgb[2];
  }
  return frame;
}

/** The top-left pixel of cell n's 48 x 48 painted block. */
function blockOrigin(n: number): [number, number] {
  const col = n % 9;
  const row = (n - col) / 9;
  return [FACE_LEFT + col * CELL + GUTTER, FACE_TOP + row * CELL + GUTTER];
}

/** The alpha declared for a token in `src/app.css`, as a number. */
function alphaOf(token: string): number {
  const css = readFileSync(APP_CSS, "utf8");
  const declared = new RegExp(`${token}:[^;]*[/][ ]*([0-9.]+)[ ]*[)]`).exec(
    css,
  );
  if (declared === null) throw new Error(`no ${token} in src/app.css`);
  return Number.parseFloat(declared[1]);
}

describe("the OG pad renderer", () => {
  it("fills a 1200 x 630 buffer whose ground outside the frame is black", () => {
    const px = renderOgPixels(frameAllLit([214, 255, 78]));
    expect(px.length).toBe(OG_WIDTH * OG_HEIGHT * 3);
    expect([OG_WIDTH, OG_HEIGHT]).toEqual([1200, 630]);

    // Every pixel outside the frame's bounding box, checked exhaustively -
    // 756,000 of them - because "the ground is black" is the one claim a
    // spot check cannot make.
    let stray = 0;
    for (let y = 0; y < OG_HEIGHT; y++) {
      const insideRows = y >= FRAME_TOP && y <= FRAME_BOTTOM;
      for (let x = 0; x < OG_WIDTH; x++) {
        if (insideRows && x >= FRAME_LEFT && x <= FRAME_RIGHT) continue;
        const at = (y * OG_WIDTH + x) * 3;
        if (px[at] !== 0 || px[at + 1] !== 0 || px[at + 2] !== 0) stray++;
      }
    }
    expect(stray).toBe(0);

    // The same size contract from the other side: a frame that is not a pad
    // frame is refused, never half-painted.
    expect(() => renderOgPixels(new Uint8Array(242))).toThrow(/243/);
  });

  it("copies a lit cell's firmware bytes across its whole 48 x 48 block", () => {
    // A colour no part of the identity ladder can produce, and one whose every
    // channel changes if anything scales it: 250 * 0.9 is 225.
    const led = [3, 250, 128];
    const n = 40; // the centre cell
    const px = renderOgPixels(frameWithCell(n, led));
    const [left, top] = blockOrigin(n);

    const samples: [number, number][] = [
      [left, top],
      [left + PAINT - 1, top],
      [left, top + PAINT - 1],
      [left + PAINT - 1, top + PAINT - 1],
      [left + PAINT / 2, top + PAINT / 2],
    ];
    for (const [x, y] of samples) {
      expect(`${x},${y}: ${pixelAt(px, x, y)}`).toBe(`${x},${y}: ${led}`);
    }

    // The gutter around it stays the ground, so the block really is 48 wide.
    expect(pixelAt(px, left - 1, top)).toEqual(BLACK);
    expect(pixelAt(px, left + PAINT, top)).toEqual(BLACK);
    expect(pixelAt(px, left, top - 1)).toEqual(BLACK);
    expect(pixelAt(px, left, top + PAINT)).toEqual(BLACK);
  });

  it("paints unlit cells as one flattened dot and the frame as one stroke", () => {
    // Both structural colours are computed from the accent's channels and an
    // alpha - round(channel * alpha) over black - and both must equal the
    // numbers 05-UI-SPEC records. Neither hex appears in render.ts.
    expect(ACCENT_RGB).toEqual([0xd6, 0xff, 0x4e]);
    expect(flattenOnBlack(ACCENT_RGB, LINE_SOFT_ALPHA)).toEqual(
      UI_SPEC_LINE_SOFT,
    );
    expect(flattenOnBlack(ACCENT_RGB, LINE_ALPHA)).toEqual(UI_SPEC_LINE);
    expect(UNLIT_DOT_RGB).toEqual(UI_SPEC_LINE_SOFT);
    expect(FRAME_RGB).toEqual(UI_SPEC_LINE);

    // And the ladder itself: the accent and the two alphas are src/app.css's,
    // so the image cannot drift from the site's own identity.
    expect(readFileSync(APP_CSS, "utf8")).toContain("--color-accent: #d6ff4e;");
    expect(alphaOf("--color-line-soft")).toBe(LINE_SOFT_ALPHA);
    expect(alphaOf("--color-line")).toBe(LINE_ALPHA);

    const px = renderOgPixels(new Uint8Array(243));
    // A 6px dot centred in the 52px cell: the cell's centre is the dot, and
    // the block's corner - well inside the 48px paint - is still the ground.
    const n = 30;
    const [left, top] = blockOrigin(n);
    expect(pixelAt(px, left + PAINT / 2, top + PAINT / 2)).toEqual(
      UI_SPEC_LINE_SOFT,
    );
    expect(pixelAt(px, left, top)).toEqual(BLACK);
    expect(pixelAt(px, left + PAINT / 2 + 4, top + PAINT / 2)).toEqual(BLACK);
    // Six pixels across, and no seventh.
    expect(pixelAt(px, left + PAINT / 2 - 3, top + PAINT / 2)).toEqual(
      UI_SPEC_LINE_SOFT,
    );
    expect(pixelAt(px, left + PAINT / 2 + 2, top + PAINT / 2)).toEqual(
      UI_SPEC_LINE_SOFT,
    );
    expect(pixelAt(px, left + PAINT / 2 - 4, top + PAINT / 2)).toEqual(BLACK);
    expect(pixelAt(px, left + PAINT / 2 + 3, top + PAINT / 2)).toEqual(BLACK);

    // The frame is the only other thing in the picture.
    expect(pixelAt(px, FRAME_LEFT, 315)).toEqual(UI_SPEC_LINE);
    expect(pixelAt(px, 600, FRAME_TOP)).toEqual(UI_SPEC_LINE);
  });

  it("places the face, the cells and the frame where the spec puts them", () => {
    const led = [17, 200, 90];
    const px = renderOgPixels(frameAllLit(led));

    // Tick 64 is the representative frame, not an arbitrary number.
    expect(OG_TICK).toBe(64);

    // The face begins and ends exactly here: 468px of face, 366..833.
    expect(FACE_RIGHT - FACE_LEFT + 1).toBe(468);
    expect(FACE_BOTTOM - FACE_TOP + 1).toBe(468);
    expect(pixelAt(px, FACE_LEFT, FACE_TOP)).toEqual(BLACK); // gutter
    expect(pixelAt(px, FACE_LEFT + 1, FACE_TOP + 1)).toEqual(BLACK); // gutter
    expect(pixelAt(px, FACE_LEFT + 2, FACE_TOP + 2)).toEqual(led); // cell 0
    expect(pixelAt(px, FACE_RIGHT - 2, FACE_BOTTOM - 2)).toEqual(led); // cell 80
    expect(pixelAt(px, FACE_RIGHT - 1, FACE_BOTTOM - 1)).toEqual(BLACK);
    expect(pixelAt(px, FACE_RIGHT, FACE_BOTTOM)).toEqual(BLACK);

    // The four corner cells, each sampled at the centre of its 48px block.
    for (const n of [0, 8, 72, 80]) {
      const [left, top] = blockOrigin(n);
      const x = left + PAINT / 2;
      const y = top + PAINT / 2;
      expect(`cell ${n}: ${pixelAt(px, x, y)}`).toBe(`cell ${n}: ${led}`);
    }

    // 52px between one cell's paint and the next one's, on both axes.
    const [firstLeft, firstTop] = blockOrigin(0);
    const [secondLeft] = blockOrigin(1);
    const [, secondTop] = blockOrigin(9);
    expect(secondLeft - firstLeft).toBe(CELL);
    expect(secondTop - firstTop).toBe(CELL);

    // The frame: 484 x 484 centred, a 2px stroke, and nothing at 3px.
    expect(FRAME_RIGHT - FRAME_LEFT + 1).toBe(484);
    expect(pixelAt(px, FRAME_LEFT - 1, 315)).toEqual(BLACK);
    expect(pixelAt(px, FRAME_LEFT, 315)).toEqual(UI_SPEC_LINE);
    expect(pixelAt(px, FRAME_LEFT + 1, 315)).toEqual(UI_SPEC_LINE);
    expect(pixelAt(px, FRAME_LEFT + 2, 315)).toEqual(BLACK);
    expect(pixelAt(px, FRAME_RIGHT, 315)).toEqual(UI_SPEC_LINE);
    expect(pixelAt(px, FRAME_RIGHT - 1, 315)).toEqual(UI_SPEC_LINE);
    expect(pixelAt(px, FRAME_RIGHT - 2, 315)).toEqual(BLACK);
    expect(pixelAt(px, FRAME_RIGHT + 1, 315)).toEqual(BLACK);
    expect(pixelAt(px, 600, FRAME_BOTTOM)).toEqual(UI_SPEC_LINE);
    expect(pixelAt(px, 600, FRAME_BOTTOM - 2)).toEqual(BLACK);
    // The 12px radius is real: the extreme corner is outside the round.
    expect(pixelAt(px, FRAME_LEFT, FRAME_TOP)).toEqual(BLACK);
  });
});
