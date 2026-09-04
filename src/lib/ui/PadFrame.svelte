<!--
  The pad: four layers, and two of the four never repaint.

  Bottom to top the layers are the dot field, the canvas, and the gutter grid,
  inside a frame drawn by the root element's border. The canvas writes an unlit
  cell at alpha 0 rather than as black, so the dot field shows through every
  cell the configuration did not light; the black gutter grid painted on top is
  what turns a gapless nearest-neighbour upscale back into 81 discrete lights.
  That sentence is the whole reason three of these four layers exist: without
  the dots an unlit pad is a black square, and without the gutters a lit one is
  a smear rather than a grid of lamps.

  Layers 1, 3 and 4 are CSS the browser paints once. This component therefore
  issues no draw call of its own, holds no engine and reaches nothing under
  src/vendor - the canvas it wraps is owned by the simulator host, which sets
  its 9x9 backing store and does every paint (04-UI-SPEC W-07).

  The canvas is inset 6px inside the 10px corner radius. Six is not on the
  4-point spacing scale and is not meant to be: it is the smallest inset that
  stops the corner arc clipping a corner LED (04-UI-SPEC, Spacing, exception 3).

  No CSS here may author a colour the simulator did not emit. The only light
  HANGAR adds around a pad is the lime glow on the hero's frame; there is no
  drop-shadow, no blur, no hue-rotate, no sepia and no invert anywhere near a
  pad face (04-UI-SPEC, Color).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    entry,
    hero = false,
    children,
  }: {
    /**
     * Declared STRUCTURALLY rather than imported - the `HostEngine` pattern
     * from src/lib/sim/host.ts, for the same reason: wave 6's browse card
     * renders this frame from a `ListingEntry` and the coverflow renders it
     * from a `FrontDoorEntry`, and one shape serves both with no import either
     * way.
     *
     * `{ id }` and NOT `{ id; name }`, which is what the plan's interfaces
     * block proposed: this component renders no text at all - the id is the
     * test id and nothing else is read - and `svelte/no-unused-props` fails an
     * unused declared property. The narrower shape is still satisfied by both
     * entry types, so it costs the browse card nothing.
     */
    entry: { id: string };
    hero?: boolean;
    children?: Snippet;
  } = $props();
</script>

<div class="pad" class:hero data-testid="pad-{entry.id}">
  <div class="dots" aria-hidden="true"></div>
  <div class="face">{@render children?.()}</div>
  <div class="gutters" aria-hidden="true"></div>
</div>

<style>
  /* Layer 4: the frame. Decorative on a side pad, functional on the hero. */
  .pad {
    position: relative;
    inline-size: 100%;
    block-size: 100%;
    border: 1px solid var(--color-line-soft);
    border-radius: 10px;
    background: var(--color-ground);
  }

  .pad.hero {
    border-color: var(--color-line);
    box-shadow: 0 0 40px var(--color-glow);
  }

  .dots,
  .face,
  .gutters {
    position: absolute;
    inset: 6px;
  }

  /* Layer 1: one dot per unlit cell, painted once by the browser. */
  .dots {
    background-image: radial-gradient(
      circle at 50% 50%,
      var(--color-line-soft) 0 6%,
      transparent 6.5%
    );
    background-size: 11.111% 11.111%;
    pointer-events: none;
  }

  /* Layer 2 lives in the slot: PadCanvas, sized to the face by the parent. */
  .face {
    line-height: 0;
  }

  /*
    Layer 3: the gutters between the 81 cells, one pass per axis, offset by half
    a line so the grid sits on the cell boundaries rather than beside them.
  */
  .gutters {
    background-image:
      repeating-linear-gradient(
        to right,
        var(--color-ground) 0 0.9%,
        transparent 0.9% 11.111%
      ),
      repeating-linear-gradient(
        to bottom,
        var(--color-ground) 0 0.9%,
        transparent 0.9% 11.111%
      );
    background-position: -0.45% -0.45%;
    pointer-events: none;
  }
</style>
