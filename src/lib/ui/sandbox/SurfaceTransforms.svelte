<!--
  The surface's three transforms (change 13B, BENCH-2026-09-16.txt section 13, suggestion 4):
  flip left to right, flip top to bottom, a quarter turn clockwise - one row under the toolbar,
  three 44px icon boxes with straight-line glyphs and their accessible names, the helper beside
  them saying the whole surface moves, locked elements too. Props: disabled (Play, or an empty
  surface), describedBy (the mode line in Play), ontransform (editor.transformSurface). No state
  of its own; the outcome is the plate's status line, written by the route. Square (D-01).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import {
    FLIP_HORIZONTAL,
    FLIP_VERTICAL,
    ROTATE,
    TRANSFORM_HELPER,
  } from "$lib/sandbox/copy";
  import type { SurfaceTransform } from "$lib/sandbox/geometry";

  let {
    disabled = false,
    describedBy,
    ontransform,
  }: {
    /** Play, or nothing on the surface to move. */
    disabled?: boolean;
    /** The id of the line that says why, while disabled. */
    describedBy?: string;
    ontransform: (transform: SurfaceTransform) => void;
  } = $props();

  const uid = $props.id();
  const helperId = `${uid}-helper`;

  /** A glyph is straight lines on a 20 x 20 box: [x1, y1, x2, y2] each. */
  type Glyph = readonly (readonly [number, number, number, number])[];

  /** Two arrowheads either side of a centre line: the mirror. */
  const MIRROR_X: Glyph = [
    [10, 2, 10, 18],
    [2, 6, 7, 10],
    [7, 10, 2, 14],
    [18, 6, 13, 10],
    [13, 10, 18, 14],
  ];
  const MIRROR_Y: Glyph = MIRROR_X.map(([x1, y1, x2, y2]) => [y1, x1, y2, x2]);
  /** Three sides of a square and an arrowhead at the open corner: a quarter turn clockwise. */
  const TURN: Glyph = [
    [4, 16, 4, 4],
    [4, 4, 16, 4],
    [16, 4, 16, 12],
    [12, 9, 16, 13],
    [16, 13, 20, 9],
  ];

  const controls: readonly {
    id: string;
    transform: SurfaceTransform;
    label: string;
    glyph: Glyph;
  }[] = [
    {
      id: "flip-horizontal",
      transform: "flip-horizontal",
      label: FLIP_HORIZONTAL,
      glyph: MIRROR_X,
    },
    {
      id: "flip-vertical",
      transform: "flip-vertical",
      label: FLIP_VERTICAL,
      glyph: MIRROR_Y,
    },
    { id: "turn-surface", transform: "rotate", label: ROTATE, glyph: TURN },
  ];
</script>

<div class="transforms" data-testid="surface-transforms">
  {#each controls as control (control.id)}
    <button
      class="icon"
      type="button"
      data-testid={control.id}
      aria-label={control.label}
      title={control.label}
      {disabled}
      aria-describedby={disabled ? describedBy : helperId}
      onclick={() => ontransform(control.transform)}
    >
      <svg class="glyph" viewBox="0 0 20 20" aria-hidden="true">
        {#each control.glyph as [x1, y1, x2, y2], i (i)}
          <line {x1} {y1} {x2} {y2} />
        {/each}
      </svg>
    </button>
  {/each}
  <p class="helper type-helper" id={helperId}>{TRANSFORM_HELPER}</p>
</div>

<style>
  /* The row: three boxes and the helper, which folds beside them. */
  .transforms {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  /* An icon box: the boundary token, square, 44px on both axes. */
  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    inline-size: 44px;
    block-size: 44px;
    padding: 0;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: transparent;
    color: var(--color-ink);
    cursor: pointer;
  }

  .icon:hover:not(:disabled) {
    border-color: var(--color-action);
    color: var(--color-action);
  }

  .icon:disabled {
    color: var(--color-ink-quiet);
    cursor: default;
  }

  .glyph {
    inline-size: 20px;
    block-size: 20px;
    overflow: visible;
  }

  .glyph line {
    stroke: currentColor;
    stroke-width: 2;
  }

  .helper {
    margin: 0;
    min-inline-size: 0;
    color: var(--color-ink-quiet);
  }
</style>
