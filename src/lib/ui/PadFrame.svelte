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
  painted in --color-workspace: a black grid divides nothing when the cells behind
  it are also black. Every other card gets its structure for free from its LIT
  cells; the one configuration that lights none of them therefore got none, and
  eighty-one lamps collapsed into one rectangle that read as a card which had
  failed to load. Nine rows of nine dots on black is a dot grid, not a pad.

  So Layer 1 carries a WASH as well as its dots - a fraction of the dot's own
  token - and Layer 3's gutters cut it into 81 dark lamps. It is global, not
  scoped to the dark entry, and that is the point: an unlit cell on the pad
  that can never light is exactly as strong as an unlit cell on every other
  card, which is parity by construction rather than a branch.

  Layers 1, 3 and 4 are CSS the browser paints once. This component therefore
  issues no draw call of its own, holds no engine and reaches nothing under
  src/vendor - the canvas it wraps is owned by the simulator host, which sets
  its 9x9 backing store and does every paint (04-UI-SPEC W-07).

  THE FRAME IS SQUARE (13-CONTEXT.md D-01, plan 13-04, 2026-09-11). The root
  carried a 10px corner radius from Phase 4, and the canvas was inset 6px to
  keep the corner arc off a corner LED (04-UI-SPEC, Spacing, exception 3).
  D-01 overrides every radius to zero and src/lib/ui/radius.spec.ts holds this
  file at none, so the arc is gone and the inset is kept for a different
  reason: the coverflow's geometry, the browse wall and layer C's
  computed-style sweep were all measured with the face 6px inside the frame,
  and the three siblings share the inset.

  No CSS here may author a colour the simulator did not emit. The only light
  HANGAR adds around a pad is the action-colour bloom on the hero's frame - §3
  reserves glow for the light output, and the frame's bloom is the light
  output's; there is no drop-shadow, no blur, no hue-rotate, no sepia and no
  invert anywhere near a pad face (04-UI-SPEC, Color).

  LAYER S WENT AT 13-04 (13-CONTEXT.md D-09). Plan 10-04 admitted one
  pointer-events: none pseudo-element over the face - a repeating gradient and
  a noise tile at a layer opacity of 0.18, scoped to the front door after a
  61 ms measurement on webkit-phone - and the Bible's §3 asks for solid
  surfaces inside the working application. The pseudo-element, its noise tile
  and its SCREEN: FLAT rule were deleted together; what is left is the pad and
  nothing over it, and instrument.spec.ts scan 6 holds the vocabulary absent.

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
  /* Layer 4: the frame. Decorative on a side pad, functional on the hero.
     Square corners (D-01): the 10px radius went at 13-04. */
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

    THE STRENGTH IS A FRACTION OF THE DOT'S, AND THE CAP IS THE RULE. The dot is
    --color-divider at full strength; the wash is the same token at 15% - it
    was 25% while the token was lime at 0.2 alpha, and 13-03's eleven-token
    palette made the divider an opaque graphite, so 25% of it would have been
    a 0.25 alpha against the 0.2 cap the browser gate of the day held. 15%
    keeps it strictly dimmer at every pixel, which keeps the dot the brightest
    mark in an unlit cell and keeps this card's unlit cells at exactly the
    strength every other card's have. aesthetic.spec.ts scan 8 caps the
    fraction at 50 and asserts the token; 13-04 removed Layer S and the
    frame's radius and left this layer as it was.

    color-mix RATHER THAN A LITERAL, A NEW TOKEN OR A PSEUDO-ELEMENT. A literal
    rgba() here would be a colour no gate on this site can see: identity.spec.ts
    reads src/app.css and nothing else, and 10-04 proved twice that even inside
    that file a percent-encoded hue passes all of its assertions. A twelfth
    --color-* token is red by construction. A ::before with an opacity would be
    a fifth layer and a paint-time group on every one of the browse wall's
    cards. This is one declaration that names the existing token, so every
    colour gate still reads a var().
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

  /*
    Layer 3: the gutters between the 81 cells, one pass per axis, offset by half
    a line so the grid sits on the cell boundaries rather than beside them.
  */
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
