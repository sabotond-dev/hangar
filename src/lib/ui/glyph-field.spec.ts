/**
 * IDENT-01: the splash's glyph field, pinned as data rather than as a look.
 *
 * The field is the site's identity, and the one property that makes it an
 * identity rather than noise is that it is the SAME field on every load. A
 * randomised wallpaper would change under a visitor who reloaded, and no test
 * could ever say anything about it. So the generator is seeded, it is pure - no
 * document, no canvas, no context - and every number the design contract states
 * is asserted here rather than trusted in the painter.
 *
 * The approved contract is .planning/phases/04-first-experience/04-UI-SPEC.md
 * (Screen 1, and the Color section's explicit exemption for generated texture:
 * the 0.14-0.28 alpha range sits outside the token ladder by design, because
 * quantising it onto five fixed steps would destroy the noise that makes the
 * mosaic read as texture at all).
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */
import { describe, expect, it } from "vitest";
import { buildField, FIELD_SEED, mulberry32 } from "./glyph-field";

/** 04-UI-SPEC, Screen 1. Quoted, not re-derived. */
const GLYPHS = ["x", "o", "+", "\u25a1", "\u25e6"];
const ALPHA_MIN = 0.14;
const ALPHA_MAX = 0.28;
const BLOCKS_MIN = 6;
const BLOCKS_MAX = 10;
const PUNCH_COUNT = 4;
const PUNCH_MIN_W = 40;
const PUNCH_MIN_H = 12;
const PUNCH_MAX_W = 220;
const PUNCH_MAX_H = 28;

const WIDTH = 1920;
const HEIGHT = 1080;

describe("the splash glyph field (src/lib/ui/glyph-field.ts)", () => {
  it("is byte-identical across two builds, because the seed is the identity", () => {
    const a = buildField(WIDTH, HEIGHT);
    const b = buildField(WIDTH, HEIGHT);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("lays out between six and ten blocks and exactly four punched rectangles", () => {
    const { blocks, rects, cells } = buildField(WIDTH, HEIGHT);
    expect(
      cells.length,
      "a field with no glyphs in it would pass every other assertion vacuously",
    ).toBeGreaterThan(0);
    expect(blocks.length).toBeGreaterThanOrEqual(BLOCKS_MIN);
    expect(blocks.length).toBeLessThanOrEqual(BLOCKS_MAX);
    expect(rects.length).toBe(PUNCH_COUNT);
  });

  it("draws only the five glyphs, each at an alpha inside the declared range", () => {
    const { cells } = buildField(WIDTH, HEIGHT);
    expect(cells.length).toBeGreaterThan(0);
    for (const [index, cell] of cells.entries()) {
      expect(
        GLYPHS,
        `cell ${index} draws ${JSON.stringify(cell.glyph)}, which is not in the glyph set`,
      ).toContain(cell.glyph);
      expect(
        cell.alpha,
        `cell ${index} has alpha ${cell.alpha}, outside [${ALPHA_MIN}, ${ALPHA_MAX}]`,
      ).toBeGreaterThanOrEqual(ALPHA_MIN);
      expect(
        cell.alpha,
        `cell ${index} has alpha ${cell.alpha}, outside [${ALPHA_MIN}, ${ALPHA_MAX}]`,
      ).toBeLessThanOrEqual(ALPHA_MAX);
    }
  });

  it("punches rectangles that are inside the viewport and inside the size range", () => {
    const { rects } = buildField(WIDTH, HEIGHT);
    expect(rects.length).toBe(PUNCH_COUNT);
    for (const [index, rect] of rects.entries()) {
      expect(rect.w, `rect ${index} is ${rect.w} wide`).toBeGreaterThanOrEqual(
        PUNCH_MIN_W,
      );
      expect(rect.w, `rect ${index} is ${rect.w} wide`).toBeLessThanOrEqual(
        PUNCH_MAX_W,
      );
      expect(rect.h, `rect ${index} is ${rect.h} tall`).toBeGreaterThanOrEqual(
        PUNCH_MIN_H,
      );
      expect(rect.h, `rect ${index} is ${rect.h} tall`).toBeLessThanOrEqual(
        PUNCH_MAX_H,
      );
      expect(
        rect.x,
        `rect ${index} starts at x ${rect.x}`,
      ).toBeGreaterThanOrEqual(0);
      expect(
        rect.y,
        `rect ${index} starts at y ${rect.y}`,
      ).toBeGreaterThanOrEqual(0);
      expect(
        rect.x + rect.w,
        `rect ${index} ends at x ${rect.x + rect.w}, past the ${WIDTH}px viewport`,
      ).toBeLessThanOrEqual(WIDTH);
      expect(
        rect.y + rect.h,
        `rect ${index} ends at y ${rect.y + rect.h}, past the ${HEIGHT}px viewport`,
      ).toBeLessThanOrEqual(HEIGHT);
    }
  });

  it("has a PRNG that stays in [0, 1) and repeats itself for one seed", () => {
    const first = mulberry32(FIELD_SEED);
    const second = mulberry32(FIELD_SEED);
    const a: number[] = [];
    const b: number[] = [];
    for (let i = 0; i < 500; i += 1) {
      a.push(first());
      b.push(second());
    }
    for (const [index, value] of a.entries()) {
      expect(value, `draw ${index} is ${value}`).toBeGreaterThanOrEqual(0);
      expect(value, `draw ${index} is ${value}`).toBeLessThan(1);
    }
    expect(b).toEqual(a);
    // A different seed must produce a different stream, or "seeded" means nothing.
    expect(mulberry32(FIELD_SEED + 1)()).not.toBe(a[0]);
  });
});
