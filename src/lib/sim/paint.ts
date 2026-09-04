// HANGAR's pad painter: one draw call per pad per paint.
//
// The pad is four layers (04-UI-SPEC "The pad") and two of them never repaint.
// Layer 1 is a CSS radial-gradient dot field for the unlit cells, layer 3 is a
// pair of CSS repeating-linear-gradients that draw the gutters between cells,
// and layer 4 is the border. This file owns layer 2 and nothing else: the LEDs,
// written into a 9x9 canvas backing store that CSS scales up with
// image-rendering: pixelated. The compositor does the upscale for free, which
// is why there is no scaling here - and, per MDN, putImageData is "not affected
// by the canvas transformation matrix", so scaling here was never possible
// anyway (04-UI-SPEC W-07, which supersedes 04-CONTEXT D-15's earlier wording).
//
// That is also why an unlit cell is written at alpha 0 rather than as black: a
// black cell would be indistinguishable on screen and would silently cover the
// two static layers underneath it.
//
// The four prohibitions, and why each one exists:
//
//   - No strokeRect per cell per frame. The vendored blit()
//     (src/vendor/botor/pad-sim-host.ts:87-118) outlines all 81 cells every
//     frame; .planning/research/STACK.md Decision 2 measures path stroking as
//     roughly half the draw cost of a frame that never changes, and says to
//     delete it. Here the gutters are static CSS, painted once by the browser.
//   - No ctx.shadowBlur. Removed upstream with a measurement: "a blurred rect
//     per lit cell at 30 fps across nine canvases is measurable jank on the
//     renderer thread" (src/vendor/botor/pad-sim-host.ts:83-86). HANGAR shows
//     up to seven pads at once, so it is worse here.
//   - No drawImage and no second canvas. W-07: the compositor already does the
//     upscale, so an intermediate surface buys nothing and costs a blit.
//   - No CSS filter that adds or tints colour on a pad canvas. 04-UI-SPEC
//     "Color": no CSS may author a colour the simulator did not emit. The depth
//     ladder's filter: brightness() is permitted, but it goes on the slot
//     wrapper, never on the canvas, and it only scales emitted channels toward
//     black.
//
// paint.spec.ts asserts all of this against a recording context, so none of the
// above is a promise.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** The pad is nine by nine. The canvas backing store is exactly that. */
export const GRID_SIDE = 9;

/**
 * One ImageData per canvas, created once and written in place on every paint.
 *
 * It takes the context rather than constructing an ImageData directly, so the
 * module is testable in node against a stub and does not depend on a global
 * constructor the runner does not have.
 */
export function createScratch(ctx: CanvasRenderingContext2D): ImageData {
  return ctx.createImageData(GRID_SIDE, GRID_SIDE);
}

/**
 * Paint one pad's frame. `frame` is PadSim.frame: 243 bytes, screen order, RGB,
 * with cell n at bytes 3n, 3n+1, 3n+2.
 *
 * `scratch` belongs to the caller and is reused for the life of the canvas -
 * allocating 324 bytes per pad per frame at 30 fps is the kind of garbage that
 * shows up as a sawtooth in a memory profile and as a stutter on screen.
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
