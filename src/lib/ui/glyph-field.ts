/**
 * The splash's wallpaper, generated deterministically.
 *
 * SKELETON - plan 04-07 task 2, RED half. The behaviour lives in the spec
 * beside this file; the bodies arrive in the next commit.
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */

export const FIELD_SEED = 0x48414e47; // "HANG"

export type GlyphCell = { x: number; y: number; glyph: string; alpha: number };
export type PunchRect = { x: number; y: number; w: number; h: number };

export function mulberry32(seed: number): () => number {
  throw new Error(`mulberry32(${seed}) is not implemented yet`);
}

export function buildField(
  width: number,
  height: number,
  seed: number = FIELD_SEED,
): { cells: GlyphCell[]; rects: PunchRect[]; blocks: PunchRect[] } {
  throw new Error(
    `buildField(${width}, ${height}, ${seed}) is not implemented yet`,
  );
}
