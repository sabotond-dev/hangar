<!--
  The Connect section's drawing (change 26): ZONA from above, the 9 x 9 matrix on its face, the
  USB-C cable plugged into one side and the utility button on the side opposite it, marked by a
  short leader in the action colour. No text and no status light on the device. One inline SVG,
  square corners, token colours only; the name is copy.ts's, the caption the page's.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { FIGURE_NAMES } from "$lib/guide/copy";

  /** The face: nine cells a side, from the matrix's corner at (112, 40), 14 apart, 8 across. */
  const CELLS = Array.from({ length: 81 }, (_, i) => ({
    x: 112 + (i % 9) * 14 + 3,
    y: 40 + Math.floor(i / 9) * 14 + 3,
  }));
</script>

<svg
  class="drawing"
  viewBox="0 0 360 200"
  role="img"
  aria-label={FIGURE_NAMES.zona}
  data-testid="figure-zona"
>
  <!-- The cable, from the left edge to the plug in the device's left side. -->
  <line class="cable" x1="0" y1="100" x2="74" y2="100" />
  <rect class="plug" x="74" y="92" width="18" height="16" />
  <!-- The body and its face. -->
  <rect class="body" x="92" y="20" width="166" height="160" />
  <rect class="face" x="108" y="36" width="134" height="134" />
  {#each CELLS as cell, i (i)}
    <rect class="cell" x={cell.x} y={cell.y} width="8" height="8" />
  {/each}
  <!-- The utility button, on the side opposite the USB-C socket, and its leader. -->
  <rect class="button" x="258" y="88" width="6" height="24" />
  <line class="leader" x1="324" y1="100" x2="272" y2="100" />
  <polyline class="leader" points="280,93 272,100 280,107" />
</svg>

<style>
  .drawing {
    display: block;
    inline-size: 100%;
    max-inline-size: 360px;
    block-size: auto;
  }

  .cable {
    stroke: var(--color-ink-quiet);
    stroke-width: 6;
  }

  .plug {
    fill: var(--color-boundary);
  }

  .body {
    fill: var(--color-panel);
    stroke: var(--color-boundary);
    stroke-width: 1;
  }

  .face {
    fill: var(--color-workspace);
    stroke: var(--color-divider);
    stroke-width: 1;
  }

  .cell {
    fill: var(--color-raised);
  }

  .button {
    fill: var(--color-ink);
  }

  .leader {
    fill: none;
    stroke: var(--color-action);
    stroke-width: 2;
  }
</style>
