<!--
  The Build section's drawing (change 26): a Sandbox surface on the 9 x 9 grid holding a fader
  (two columns, seven rows, its level filled from the foot), a button (two by two) and an XY pad
  (five by five, a point where the finger is), each region a 1px boundary over a faint fill, as
  the editor draws a region. No names on the plate. One inline SVG, square corners, token
  colours only; the name is copy.ts's.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { FIGURE_NAMES } from "$lib/guide/copy";

  /** One cell of the plate, in the drawing's units. */
  const CELL = 24;
  /** The grid's lines, nine cells a side: ten lines each way. */
  const LINES = Array.from({ length: 10 }, (_, i) => i * CELL);

  /** A region from its cell box: column, row, width, height. */
  const box = (col: number, row: number, w: number, h: number) => ({
    x: col * CELL + 2,
    y: row * CELL + 2,
    width: w * CELL - 4,
    height: h * CELL - 4,
  });

  const FADER = box(0, 1, 2, 7);
  const BUTTON = box(3, 1, 2, 2);
  const PAD = box(4, 3, 5, 5);
  /** The fader's level: its lower three fifths. */
  const LEVEL = {
    x: FADER.x,
    y: FADER.y + FADER.height * 0.4,
    width: FADER.width,
    height: FADER.height * 0.6,
  };
</script>

<svg
  class="drawing"
  viewBox="-1 -1 218 218"
  role="img"
  aria-label={FIGURE_NAMES.plate}
  data-testid="figure-plate"
>
  <rect class="ground" x="0" y="0" width="216" height="216" />
  {#each LINES as at (at)}
    <line class="grid-line" x1={at} y1="0" x2={at} y2="216" />
    <line class="grid-line" x1="0" y1={at} x2="216" y2={at} />
  {/each}
  <!-- The fader: its region and its level. -->
  <rect class="region fader" {...FADER} />
  <rect class="level" {...LEVEL} />
  <!-- The button. -->
  <rect class="region button" {...BUTTON} />
  <!-- The XY pad and the finger's point on it. -->
  <rect class="region pad" {...PAD} />
  <line
    class="cross"
    x1={PAD.x}
    y1={PAD.y + PAD.height * 0.35}
    x2={PAD.x + PAD.width}
    y2={PAD.y + PAD.height * 0.35}
  />
  <line
    class="cross"
    x1={PAD.x + PAD.width * 0.6}
    y1={PAD.y}
    x2={PAD.x + PAD.width * 0.6}
    y2={PAD.y + PAD.height}
  />
  <rect
    class="point"
    x={PAD.x + PAD.width * 0.6 - 5}
    y={PAD.y + PAD.height * 0.35 - 5}
    width="10"
    height="10"
  />
</svg>

<style>
  .drawing {
    display: block;
    inline-size: 100%;
    max-inline-size: 240px;
    block-size: auto;
  }

  .ground {
    fill: var(--color-workspace);
  }

  .grid-line {
    stroke: var(--color-divider);
    stroke-width: 1;
  }

  .region {
    stroke-width: 1;
  }

  .fader {
    fill: var(--color-action);
    fill-opacity: 0.12;
    stroke: var(--color-action);
  }

  .level {
    fill: var(--color-action);
    fill-opacity: 0.55;
  }

  .button {
    fill: var(--color-ink);
    fill-opacity: 0.14;
    stroke: var(--color-ink);
  }

  .pad {
    fill: var(--color-ink-quiet);
    fill-opacity: 0.1;
    stroke: var(--color-ink-quiet);
  }

  .cross {
    stroke: var(--color-ink-quiet);
    stroke-width: 1;
  }

  .point {
    fill: var(--color-action);
  }
</style>
