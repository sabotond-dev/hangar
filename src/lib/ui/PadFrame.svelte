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

  AND IT IS HALF A DIAGNOSIS, CORRECTED HERE BY MEASUREMENT (10-UI-SPEC A-58,
  D-22). The dots are there and TRACKPAD WAS STILL A BLACK SQUARE. The cell
  STRUCTURE on a pad face is drawn by Layer 3, the gutter grid, and Layer 3 is
  painted in --color-ground: a black grid divides nothing when the cells behind
  it are also black. Every other card gets its structure for free from its LIT
  cells; the one configuration that lights none of them therefore got none, and
  eighty-one lamps collapsed into one rectangle that read as a card which had
  failed to load. Nine rows of nine dots on black is a dot grid, not a pad.

  So Layer 1 carries a WASH as well as its dots - one quarter of the dot's own
  alpha, off the same token - and Layer 3's gutters cut it into 81 dark lamps.
  It is global, not scoped to the dark entry, and that is the point: an unlit
  cell on the pad that can never light is exactly as strong as an unlit cell on
  every other card, which is parity by construction rather than a branch.

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

  /*
    Layer 1: one dot per unlit cell, on a wash that makes the cell itself
    legible. Painted once by the browser; nothing here moves.

    THE WASH IS THE ABSENCE OF A LIGHT, DRAWN SO IT CAN BE SEEN - IT IS NOT A
    LIGHT (10-UI-SPEC A-58, A-59). HANGAR adds no colour the firmware did not
    emit, and this changes how an UNLIT cell is painted rather than whether it
    is unlit. It sits BEHIND the canvas, so a lit cell covers it completely and
    only the cells the configuration left at alpha 0 show it at all.

    src/vendor/botor/_pad.ts's Trackpad draft sets look.kind = "none",
    touch.kind = "none" and enabled = { look: false, touch: false }: it is a
    pointer, it sends, and it has no LED layer to light. Measured at 0 of 81 lit
    over a one-finger drag, a two-finger scroll, a single tap, a two-finger tap
    and 2,000 idle ticks. THAT STAYS TRUE AND IS STILL ASSERTED - src/lib/sim/
    demo.ts's DARK_BY_CONSTRUCTION carries the reason, frames.spec.ts proves
    every entry's declared restsBlack in both directions, scripts/gen-og.mjs
    exempts the entry by name and renders its OG image from the engine in Node
    with no CSS at all, so that image is still black. The card's own sentence -
    "Trackpad writes no lights at all" - is unchanged and remains accurate.

    THE STRENGTH IS A QUARTER OF THE DOT'S, AND THE CAP IS THE RULE. The dot is
    --color-line-soft at its full 0.2; the wash is the same token at 25%, so
    0.05 - strictly dimmer at every pixel, which keeps the dot the brightest
    mark in an unlit cell and keeps this card's unlit cells at exactly the
    strength every other card's have.

    color-mix RATHER THAN A LITERAL, A NEW TOKEN OR A PSEUDO-ELEMENT. A literal
    rgba() here would be a colour no gate on this site can see: identity.spec.ts
    reads src/app.css and nothing else, and 10-04 proved twice that even inside
    that file a percent-encoded hue passes all seven of its assertions. A tenth
    --color-* token is red by construction. A ::before with an opacity would be
    a fifth layer and a paint-time group on every one of thirty-six cards. This
    is one declaration that names the existing token, so every colour gate still
    reads a var() and the ladder is still nine with three hexes.
  */
  .dots {
    background-color: color-mix(
      in srgb,
      var(--color-line-soft) 25%,
      transparent
    );
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
