// The pad, at 1200 x 630, with no colour anything but the simulator or the
// identity ladder authored.
//
// Everything the browser draws AROUND a pad is CSS. The dot field for unlit
// cells is a `radial-gradient`, the gutters between cells are a pair of
// `repeating-linear-gradient`s, and the frame is a `border` - three of
// `PadCanvas.svelte`'s four layers, none of which exists in Node. So this
// function does not reproduce the DOM; it reproduces the RECIPE, and
// 05-UI-SPEC "The OG image" is the recipe, table row by table row.
//
// THE RULE THIS MODULE EXISTS TO KEEP: no colour in this image was authored by
// anything but the simulator or the identity ladder. A lit cell's three bytes
// are COPIED out of the frame, unmodified and unscaled - the same bytes
// `src/lib/sim/paint.ts` puts on a canvas, read in the same order. The only
// other colours in the picture are the accent flattened onto black at the two
// alphas `src/app.css` already declares, and both are computed here with the
// arithmetic written beside them rather than typed as a hex, so the identity
// ladder and the image cannot drift apart. There is nothing else: no grain, no
// glow, no gradient, and - D-21 - no text, because nothing rasterises a font in
// Node without a native dependency and Discord renders `og:title` as real text
// beside the image anyway.
//
// This half is PURE and imports nothing at all, so the geometry is testable in
// node and `png.ts` stays the only node-only module in the directory.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** The canvas 05-UI-SPEC fixes, and the size `og:image:width/height` declare. */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/**
 * The tick the still image is taken at.
 *
 * 64 and not another number because it is the representative frame Phase 4
 * already contracted for `prefers-reduced-motion` (04-UI-SPEC, Motion): a
 * visitor who asks for no motion sees the pad snapped to tick 64, so the
 * unfurled picture and the still preview show the same thing. Changing it is
 * then a diffable decision about which frame represents a configuration,
 * rather than a mystery constant somebody picked twice, differently.
 */
export const OG_TICK = 64;

/** The pad is nine by nine, as `src/lib/sim/paint.ts` also says. */
export const GRID_SIDE = 9;
/** A pad frame: 243 bytes, screen order, RGB, cell n at 3n, 3n+1, 3n+2. */
const FRAME_BYTES = GRID_SIDE * GRID_SIDE * 3;

/** 468 x 468 of face; nine cells of 52; 48 painted inside a 2px gutter. */
const CELL_PX = 52;
const CELL_GUTTER_PX = 2;
const CELL_PAINT_PX = CELL_PX - CELL_GUTTER_PX * 2;
const FACE_PX = GRID_SIDE * CELL_PX;
/** A 6px dot centred in an unlit cell - the CSS dot field, in pixels. */
const DOT_PX = 6;

/** The frame: 484 x 484 centred, radius 12, a 2px stroke. */
const FRAME_PX = 484;
const FRAME_RADIUS_PX = 12;
const FRAME_STROKE_PX = 2;

/**
 * `--color-action` from `src/app.css`, as channels.
 *
 * The channels rather than the hex, because the two structural colours below
 * are arithmetic on them and a hex would have to be re-derived by hand every
 * time somebody read this file. `render.spec.ts` holds this against the token
 * in `src/app.css`, so the two cannot disagree.
 */
export const ACCENT_RGB = [0xdc, 0xff, 0x71] as const;

/**
 * The two flattening alphas are THIS IMAGE'S OWN since 13-03. Under the
 * nine-token ladder they were `--color-line-soft`'s 0.2 and `--color-line`'s
 * 0.4, read back from `src/app.css` by `render.spec.ts`; the eleven-token
 * palette (13-03, D-16) makes the divider and the boundary opaque graphites,
 * so there is no alpha left to read. The accent above still IS the site's
 * (`--color-action`, `#dcff71`), and the spec holds it against the file. 13-07
 * re-derives the whole image from the eleven tokens; until then the picture
 * is the Phase 5 composition in the D-16 accent.
 */
/** The decorative dot field's alpha. */
export const LINE_SOFT_ALPHA = 0.2;
/** The frame's alpha: a functional border. */
export const LINE_ALPHA = 0.4;

/**
 * A translucent identity colour, composited onto the true-black ground.
 *
 * `round(channel * alpha)`, which is what a browser does when it paints
 * `rgb(220 255 113 / 0.2)` over `#000000` and is the whole of the maths. The
 * results are the two hexes `render.spec.ts` asserts - neither is typed
 * anywhere in this file.
 */
export function flattenOnBlack(
  rgb: readonly number[],
  alpha: number,
): number[] {
  return [
    Math.round(rgb[0] * alpha),
    Math.round(rgb[1] * alpha),
    Math.round(rgb[2] * alpha),
  ];
}

/** The dot in an unlit cell: the accent at LINE_SOFT_ALPHA, flattened. */
export const UNLIT_DOT_RGB = flattenOnBlack(ACCENT_RGB, LINE_SOFT_ALPHA);
/** The rounded frame around the face: the accent at LINE_ALPHA, flattened. */
export const FRAME_RGB = flattenOnBlack(ACCENT_RGB, LINE_ALPHA);

/** Both blocks are centred on the canvas, which is what puts them at 600, 315. */
const FACE_LEFT = (OG_WIDTH - FACE_PX) / 2;
const FACE_TOP = (OG_HEIGHT - FACE_PX) / 2;
const FRAME_LEFT = (OG_WIDTH - FRAME_PX) / 2;
const FRAME_TOP = (OG_HEIGHT - FRAME_PX) / 2;

function put(px: Uint8Array, x: number, y: number, rgb: readonly number[]) {
  const at = (y * OG_WIDTH + x) * 3;
  px[at] = rgb[0];
  px[at + 1] = rgb[1];
  px[at + 2] = rgb[2];
}

/**
 * Is the pixel centre inside a rounded square?
 *
 * The pixel's centre is at `x + 0.5`, so a 2px stroke lands on exactly two
 * columns rather than straddling three at half strength - there is no
 * anti-aliasing here and there should not be: a frame drawn crisply at whole
 * pixels reads better at unfurl size than a soft one.
 */
function insideRounded(
  x: number,
  y: number,
  left: number,
  top: number,
  size: number,
  radius: number,
): boolean {
  const right = left + size;
  const bottom = top + size;
  if (x < left || x >= right || y < top || y >= bottom) return false;
  // Distance from the nearest corner arc's centre, zero anywhere but a corner.
  const dx = Math.max(left + radius - x, x - (right - radius), 0);
  const dy = Math.max(top + radius - y, y - (bottom - radius), 0);
  return dx * dx + dy * dy <= radius * radius;
}

/** The stroke is the outer rounded square minus the one inset by its width. */
function paintFrame(px: Uint8Array) {
  const inset = FRAME_STROKE_PX;
  for (let row = FRAME_TOP; row < FRAME_TOP + FRAME_PX; row++) {
    for (let col = FRAME_LEFT; col < FRAME_LEFT + FRAME_PX; col++) {
      const x = col + 0.5;
      const y = row + 0.5;
      const outer = insideRounded(
        x,
        y,
        FRAME_LEFT,
        FRAME_TOP,
        FRAME_PX,
        FRAME_RADIUS_PX,
      );
      const inner = insideRounded(
        x,
        y,
        FRAME_LEFT + inset,
        FRAME_TOP + inset,
        FRAME_PX - inset * 2,
        FRAME_RADIUS_PX - inset,
      );
      if (outer && !inner) put(px, col, row, FRAME_RGB);
    }
  }
}

/** The whole 48 x 48 block, in the firmware's own three bytes. */
function paintLitCell(
  px: Uint8Array,
  left: number,
  top: number,
  rgb: readonly number[],
) {
  for (let dy = 0; dy < CELL_PAINT_PX; dy++) {
    for (let dx = 0; dx < CELL_PAINT_PX; dx++) {
      put(px, left + dx, top + dy, rgb);
    }
  }
}

/**
 * A 6px dot centred in the cell: the pixels whose centres fall within 3px of
 * the cell's centre. Six across on both axes with the four corners off, which
 * is a dot rather than a small square - the same read as the CSS
 * `radial-gradient` field it stands in for.
 */
function paintUnlitCell(px: Uint8Array, cellLeft: number, cellTop: number) {
  const radius = DOT_PX / 2;
  const centreX = cellLeft + CELL_PX / 2;
  const centreY = cellTop + CELL_PX / 2;
  for (let y = centreY - radius; y < centreY + radius; y++) {
    for (let x = centreX - radius; x < centreX + radius; x++) {
      const dx = x + 0.5 - centreX;
      const dy = y + 0.5 - centreY;
      if (dx * dx + dy * dy <= radius * radius) put(px, x, y, UNLIT_DOT_RGB);
    }
  }
}

/**
 * Paint one pad frame into a 1200 x 630 RGB buffer.
 *
 * `frame` is `PadSim.frame` / `SimEngine.frame`: 243 bytes, screen order, RGB.
 * A cell is lit when any of its three bytes is non-zero, which is the same test
 * `paintPad` uses to decide between an opaque LED and a transparent hole onto
 * the dot field underneath.
 *
 * The returned buffer is tightly packed and row-major - `encodePng`'s input.
 */
export function renderOgPixels(frame: Uint8Array): Uint8Array {
  if (frame.length !== FRAME_BYTES) {
    throw new Error(
      `renderOgPixels: a pad frame is ${FRAME_BYTES} bytes, ` +
        `and this one is ${frame.length}`,
    );
  }

  // Zero-initialised, and the ground is #000000, so the canvas starts painted.
  const px = new Uint8Array(OG_WIDTH * OG_HEIGHT * 3);
  paintFrame(px);

  for (let n = 0; n < GRID_SIDE * GRID_SIDE; n++) {
    const col = n % GRID_SIDE;
    const row = (n - col) / GRID_SIDE;
    const cellLeft = FACE_LEFT + col * CELL_PX;
    const cellTop = FACE_TOP + row * CELL_PX;
    const r = frame[n * 3];
    const g = frame[n * 3 + 1];
    const b = frame[n * 3 + 2];
    if (r !== 0 || g !== 0 || b !== 0) {
      paintLitCell(px, cellLeft + CELL_GUTTER_PX, cellTop + CELL_GUTTER_PX, [
        r,
        g,
        b,
      ]);
    } else {
      paintUnlitCell(px, cellLeft, cellTop);
    }
  }

  return px;
}
