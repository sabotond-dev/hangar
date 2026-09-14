// HANGAR's pad painter: one draw call per pad per paint. The pad is four layers (04-UI-SPEC "The
// pad") and this file owns layer 2 only - the LEDs, written into a 9x9 backing store that CSS scales
// up with image-rendering: pixelated (putImageData ignores the transform matrix; W-07). An unlit
// cell is written at alpha 0, never black, so the two static layers beneath show through. Four
// prohibitions, each asserted by paint.spec.ts against a recording context: no strokeRect per cell
// per frame (the vendored blit() outlines 81 cells a frame; the gutters are static CSS here); no
// ctx.shadowBlur (measurable jank on the renderer thread, pad-sim-host.ts:83-86); no drawImage and
// no second canvas; no CSS filter that adds or tints colour on a pad canvas (04-UI-SPEC "Color").
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** The pad is nine by nine. The canvas backing store is exactly that. */
export const GRID_SIDE = 9;

/** One ImageData per canvas, created once and written in place; takes the context so node can hand in a stub. */
export function createScratch(ctx: CanvasRenderingContext2D): ImageData {
  return ctx.createImageData(GRID_SIDE, GRID_SIDE);
}

/**
 * Paint one pad's frame: 243 bytes, screen order, RGB, cell n at bytes 3n, 3n+1, 3n+2. `scratch` is
 * the caller's and is reused for the life of the canvas (324 bytes per pad per frame is a sawtooth).
 */
export function paintPad(
  ctx: CanvasRenderingContext2D,
  frame: Uint8Array,
  scratch: ImageData,
): void {
  const px = scratch.data;
  for (let n = 0; n < GRID_SIDE * GRID_SIDE; n++) {
    const r = frame[n * 3];
    const g = frame[n * 3 + 1];
    const b = frame[n * 3 + 2];
    const lit = r !== 0 || g !== 0 || b !== 0;
    px[n * 4] = r;
    px[n * 4 + 1] = g;
    px[n * 4 + 2] = b;
    px[n * 4 + 3] = lit ? 255 : 0;
  }
  ctx.putImageData(scratch, 0, 0);
}
