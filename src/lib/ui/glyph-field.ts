/**
 * The splash's wallpaper: a seeded, deterministic glyph mosaic (IDENT-01).
 *
 * Pure by construction. There is no document, no canvas and no 2D context in
 * this file, and glyph-field.spec.ts scans the comment-stripped source to keep
 * it that way. The painter lives in Splash.svelte and reads what this returns;
 * splitting them is what makes the identity assertable in node, in a repository
 * whose Vitest projects collect no browser environment at all.
 *
 * DETERMINISM IS THE POINT. The field is drawn from a mulberry32 stream seeded
 * with 0x48414e47 - the bytes of "HANG" - so every visitor on every load sees
 * the same mosaic. A randomised wallpaper would change under a visitor who
 * reloaded and would read as noise rather than as a mark; a seeded one is a
 * logo that happens to be generated. It is also the only reason a test can say
 * anything about it at all.
 *
 * The three alphas here sit OUTSIDE the token ladder in src/app.css, by the
 * declared exemption in 04-UI-SPEC's Color section: this is generated texture -
 * pixels inside an image - rather than an interface surface, and quantising a
 * randomised 0.14-0.28 range onto five fixed steps would destroy exactly the
 * noise that makes the mosaic read as texture. Both colours are still the
 * site's two: lime over black.
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */

/** The bytes of "HANG". 04-UI-SPEC, Screen 1. */
export const FIELD_SEED = 0x48414e47;

/** 14px cell pitch, 10px glyphs (04-UI-SPEC, Screen 1). */
export const CELL_PITCH = 14;
export const GLYPH_SIZE = 10;

/** The mosaic's alphabet. Five shapes, no letters - it must not read as words. */
export const GLYPHS = ["x", "o", "+", "\u25a1", "\u25e6"] as const;

const ALPHA_MIN = 0.14;
const ALPHA_MAX = 0.28;

/** Six to ten blocks, four punches. Both ends of both ranges are reachable. */
const BLOCKS_MIN = 6;
const BLOCKS_MAX = 10;
const PUNCH_COUNT = 4;

/**
 * Block extents, as a fraction of the viewport rather than a fixed cell count.
 * A mosaic sized in absolute cells is a scattering of confetti on a 1920px
 * screen and a solid wall on a phone; sized in fractions it is the same picture
 * at every width, which is what an identity has to be. The floors keep a narrow
 * viewport from producing a block one cell wide.
 */
const BLOCK_MIN_FRACTION_COLS = 0.16;
const BLOCK_MAX_FRACTION_COLS = 0.42;
const BLOCK_MIN_FRACTION_ROWS = 0.12;
const BLOCK_MAX_FRACTION_ROWS = 0.38;
const BLOCK_FLOOR_COLS = 5;
const BLOCK_FLOOR_ROWS = 3;

/**
 * Punch extents, in cells, chosen so the pixel result is inside the contract's
 * 40x12 to 220x28: 3 to 15 cells is 42 to 210px, 1 to 2 cells is 14 to 28px.
 */
const PUNCH_MIN_COLS = 3;
const PUNCH_MAX_COLS = 15;
const PUNCH_MIN_ROWS = 1;
const PUNCH_MAX_ROWS = 2;

/** How much of a block's grid carries a glyph. Below 1 the mosaic breathes. */
const BLOCK_DENSITY = 0.86;

export type GlyphCell = { x: number; y: number; glyph: string; alpha: number };
export type PunchRect = { x: number; y: number; w: number; h: number };

/**
 * mulberry32: a 32-bit PRNG in ten lines, with a period of 2^32 and no state
 * beyond one integer. Chosen over Math.random for the obvious reason - it takes
 * a seed - and over anything larger because nothing here needs statistical
 * quality, only repeatability.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** An integer in [min, max], inclusive at both ends. */
function between(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

/**
 * A block extent in cells: a fraction of the available cells, floored so a
 * narrow viewport still gets a block worth calling one, and capped at the
 * viewport so nothing is laid out off-screen.
 */
function span(
  random: () => number,
  available: number,
  minFraction: number,
  maxFraction: number,
  floorCells: number,
): number {
  const min = Math.min(
    available,
    Math.max(floorCells, Math.round(available * minFraction)),
  );
  const max = Math.max(
    min,
    Math.min(available, Math.round(available * maxFraction)),
  );
  return between(random, min, max);
}

/**
 * Build the field for a viewport, in CSS pixels.
 *
 * Returns the glyph cells, the four punched rectangles, and the blocks
 * themselves - the last so the block count is assertable, which is the one
 * thing the contract states that neither of the other two reveals.
 *
 * Everything is snapped to the 14px cell grid, which is what makes the punches
 * land on block boundaries rather than slicing a glyph in half.
 */
export function buildField(
  width: number,
  height: number,
  seed: number = FIELD_SEED,
): { cells: GlyphCell[]; rects: PunchRect[]; blocks: PunchRect[] } {
  const random = mulberry32(seed);
  const cols = Math.max(1, Math.floor(width / CELL_PITCH));
  const rows = Math.max(1, Math.floor(height / CELL_PITCH));

  // --- Blocks -------------------------------------------------------------
  const blockCount = between(random, BLOCKS_MIN, BLOCKS_MAX);
  const blocks: PunchRect[] = [];
  const grid: { col: number; row: number; cols: number; rows: number }[] = [];

  for (let i = 0; i < blockCount; i += 1) {
    const bCols = span(
      random,
      cols,
      BLOCK_MIN_FRACTION_COLS,
      BLOCK_MAX_FRACTION_COLS,
      BLOCK_FLOOR_COLS,
    );
    const bRows = span(
      random,
      rows,
      BLOCK_MIN_FRACTION_ROWS,
      BLOCK_MAX_FRACTION_ROWS,
      BLOCK_FLOOR_ROWS,
    );
    const col = between(random, 0, Math.max(0, cols - bCols));
    const row = between(random, 0, Math.max(0, rows - bRows));
    grid.push({ col, row, cols: bCols, rows: bRows });
    blocks.push({
      x: col * CELL_PITCH,
      y: row * CELL_PITCH,
      w: bCols * CELL_PITCH,
      h: bRows * CELL_PITCH,
    });
  }

  // --- Glyphs -------------------------------------------------------------
  // The gaps BETWEEN blocks are black because nothing is emitted there; the
  // gaps inside a block come from the density draw. Both are the ground
  // showing through, never a painted colour.
  const cells: GlyphCell[] = [];
  for (const block of grid) {
    for (let r = 0; r < block.rows; r += 1) {
      for (let c = 0; c < block.cols; c += 1) {
        if (random() > BLOCK_DENSITY) continue;
        cells.push({
          x: (block.col + c) * CELL_PITCH,
          y: (block.row + r) * CELL_PITCH,
          glyph: GLYPHS[between(random, 0, GLYPHS.length - 1)],
          alpha: ALPHA_MIN + random() * (ALPHA_MAX - ALPHA_MIN),
        });
      }
    }
  }

  // --- Punches ------------------------------------------------------------
  // Each one starts at a block's own top-left corner, clamped so it cannot run
  // off the viewport. Four rectangles over at least six blocks means four
  // different blocks are punched.
  const rects: PunchRect[] = [];
  for (let i = 0; i < PUNCH_COUNT; i += 1) {
    const block = grid[i % grid.length];
    const pCols = Math.min(
      cols,
      between(random, PUNCH_MIN_COLS, PUNCH_MAX_COLS),
    );
    const pRows = Math.min(
      rows,
      between(random, PUNCH_MIN_ROWS, PUNCH_MAX_ROWS),
    );
    const col = Math.min(block.col, Math.max(0, cols - pCols));
    const row = Math.min(block.row, Math.max(0, rows - pRows));
    rects.push({
      x: col * CELL_PITCH,
      y: row * CELL_PITCH,
      w: pCols * CELL_PITCH,
      h: pRows * CELL_PITCH,
    });
  }

  return { cells, rects, blocks };
}
