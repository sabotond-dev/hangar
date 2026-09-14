<!--
  The pad: four layers, two of which never repaint. Bottom to top: the dot field
  on a wash (Layer 1, CSS, painted once), the canvas (Layer 2, the slot, the
  host's), the gutter grid (Layer 3, CSS) and the frame (Layer 4, the root's
  border). The canvas writes an unlit cell at alpha 0, so the dots show through;
  the gutters cut the upscale into 81 lamps, and the wash keeps a pad that lights
  nothing (Trackpad) legible as 81 dark cells, not one black square (A-58, D-22).
  Props: entry ({ id } only - it renders no text), hero, children. No draw call,
  no engine, nothing under src/vendor. Square (D-01); the 6px inset stays because the
  siblings were measured with it. No drop-shadow, blur, hue-rotate, sepia or invert near a face.
  Decided at 04-04 / 10-13.2 / 13-04 (10-UI-SPEC A-58, 13-CONTEXT D-01, D-09); see .planning/phases/13-gui-overhaul/13-04-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    entry,
    hero = false,
    children,
  }: {
    /** Declared structurally (the HostEngine pattern), and { id } only: this component renders no text, and svelte/no-unused-props fails an unused declared property. */
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
  /* Layer 4: the frame, decorative on a side pad, functional on the hero. Square (D-01). */
  .pad {
    position: relative;
    inline-size: 100%;
    block-size: 100%;
    border: 1px solid var(--color-divider);
    background: var(--color-workspace);
  }

  .pad.hero {
    border-color: var(--color-boundary);
    box-shadow: 0 0 40px var(--action-bloom);
  }

  .dots,
  .face,
  .gutters {
    position: absolute;
    inset: 6px;
  }

  /*
    Layer 1: one dot per unlit cell on a wash, painted once. The wash is the absence of
    a light drawn so it can be seen, not a light (A-58, A-59): it sits BEHIND the canvas,
    so only cells left at alpha 0 show it, and Trackpad stays 0 of 81 lit (demo.ts's
    DARK_BY_CONSTRUCTION, frames.spec.ts, gen-og.mjs). 15% of the dot's own token, so
    the dot stays the brightest mark in an unlit cell (aesthetic.spec.ts caps the
    fraction at 50 and asserts the token); color-mix on the existing token, because a
    literal would be a colour no gate can see and a twelfth token is red by construction.
  */
  .dots {
    background-color: color-mix(in srgb, var(--color-divider) 15%, transparent);
    background-image: radial-gradient(
      circle at 50% 50%,
      var(--color-divider) 0 6%,
      transparent 6.5%
    );
    background-size: 11.111% 11.111%;
    pointer-events: none;
  }

  /* Layer 2 lives in the slot: PadCanvas, sized to the face by the parent. */
  .face {
    line-height: 0;
  }

  /* Layer 3: the gutters, one pass per axis, offset by half a line onto the cell boundaries. */
  .gutters {
    background-image:
      repeating-linear-gradient(
        to right,
        var(--color-workspace) 0 0.9%,
        transparent 0.9% 11.111%
      ),
      repeating-linear-gradient(
        to bottom,
        var(--color-workspace) 0 0.9%,
        transparent 0.9% 11.111%
      );
    background-position: -0.45% -0.45%;
    pointer-events: none;
  }
</style>
