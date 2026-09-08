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

  AMENDED BY NAME (Phase 10, plan 10-04, 10-UI-SPEC 8.2 and 8.3). That sentence
  gains a fourth clause. ONE pointer-events: none pseudo-element is admitted
  over the pad face: Layer S, a repeating gradient and a noise tile at a layer
  opacity of at most 0.18, which adds NO COLOUR and only darkens. It carries no
  filter, no blur, no promotion and no shadow, and it is a leaf of the 3D tree -
  the same position filter: brightness() already legally occupies on the slot -
  so it flattens nothing. A comment that quietly stopped being true is how a
  header stops being read, which is why this paragraph is here rather than in a
  planning document.

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

  /*
    LAYER S - scanlines and noise on pad frames, and ONLY on pad frames
    (10-UI-SPEC 8.2, 8.3, 8.5).

    THE NOISE TILE LIVES HERE AND NOT IN src/app.css, AND THAT WAS MEASURED.
    Plan 10-04 declared it as --crt-noise at :root in app.css and ran
    identity.spec.ts: seven passed. It then wrote fill='%23ff0000' - a pure red,
    a fourth hue - into the same data-URI and ran it again: seven passed again.
    That file's hex walk matches a literal '#', and a percent-encoded one is not
    one, so a colour hidden inside a data-URI there is invisible to every colour
    gate the site has. Here, aesthetic.spec.ts scan 6 reads the tile and asserts
    it declares no `fill` attribute at all - the filter's own output is the only
    thing that colours a pixel of it.

    THE SELECTOR IS SCOPED TO THE FRONT DOOR, AND THAT IS A MEASUREMENT, NOT A
    TASTE. 10-UI-SPEC 8.5 requires an A/B of this exact pair of background
    layers against the shipped /browse/ at thirty-six entries, and rules that if
    the delta exceeds 2 ms at the 95th percentile then Layer S is scoped to the
    front door's seven frames and the browse grid keeps Layer G alone. Measured
    on this machine, median of three runs per arm, p95 of requestAnimationFrame
    deltas across a full scroll of the grid: chromium 16.70 ms with and 16.70 ms
    without - a delta of 0.00 ms - and webkit at a phone viewport 138 ms with
    against 77 ms without, a delta of 61 ms, with the sampled frame count
    halving from 128 to 65. Thirty times the threshold on one of the two
    engines. The declared fallback therefore applies, and this one selector is
    where it applies: `.front-door` is FrontDoor.svelte's own root class, so the
    coverflow's seven frames carry the treatment and the browse grid's
    thirty-six do not.

    inset: 6px puts it inside the 10px radius and off the frame's own border,
    exactly as its three siblings sit. The 5px scanline period is a declared
    non-token texture metric (10-UI-SPEC 6, exception 5). --crt-scanline is read
    from app.css and is deliberately NOT declared here, for the reason that
    file's own comment gives.
  */
  .pad {
    --crt-noise: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='crtNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23crtNoise)'/%3E%3C/svg%3E");
  }

  :global(.front-door) .pad::after {
    content: "";
    position: absolute;
    inset: 6px;
    border-radius: 4px;
    pointer-events: none;
    opacity: calc(0.18 * var(--crt, 1));
    background-image:
      repeating-linear-gradient(
        to bottom,
        var(--crt-scanline) 0 1px,
        transparent 1px 5px
      ),
      var(--crt-noise);
    background-size:
      auto,
      220px 220px;
  }

  /*
    SCREEN: FLAT. `content: none` removes the pseudo-element outright rather
    than fading it to nothing, which is what 10-UI-SPEC 8.7's browser gate 2
    reads. An opacity folded to zero would leave that assertion green over a
    layer that was still being composited.
  */
  :global(html[data-screen="flat"] .front-door) .pad::after {
    content: none;
  }
</style>
