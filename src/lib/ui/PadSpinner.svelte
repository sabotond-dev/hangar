<!--
  The 9x9 motif, walking. IDENT-01 asks the same outline to be the logo, the pad
  frame AND the state the site shows while it waits (04-UI-SPEC W-23), and this
  is the only place in Phase 4 that waits at all.

  32px (by default) of the pad recipe's first layer - one dot per unlit cell,
  painted once by the browser - with a single cell lit at full accent walking
  the perimeter, 90ms per step, 32 cells, 2,880ms a lap.

  THE WALK IS A CSS ANIMATION AND NEVER A TIMER. A JavaScript walker would be a
  second scheduler beside src/lib/sim/host.ts's single requestAnimationFrame
  loop, running on the one screen where the visitor is already waiting on a
  port; the compositor can move one 3.5px square without the main thread. The 32
  keyframes are written out rather than generated because a Svelte component's
  <style> block is static CSS, and steps(1) is what makes each hop discrete
  instead of a slide.

  Under prefers-reduced-motion the cell does not walk: three cells light in the
  top-left corner and stay there, which still reads as the mark and still says
  "something is happening" without moving anything (04-UI-SPEC, the reduced
  motion override table).

  This component never uses the word the copy contract forbids. The status line
  beside it says what is actually being waited for.

  TWO PROPS, NO BEHAVIOUR (Phase 6, 06-UI-SPEC Modified). `size` drives one
  custom property, --spinner-size, and nothing else: the keyframes below are
  percentage translates on an 11.111% cell, so the walk scales with no second
  animation and no new keyframes - which is the whole reason the header's 24px
  device mark renders THIS component rather than a copy of it. `decorative`
  drops three attributes together: role="img", aria-label="Connecting" AND
  data-testid="pad-spinner". The third is not an afterthought. Throughout the
  connecting state the header's mark and the panel's spinner are on screen AT
  THE SAME TIME, and a selector that matched two elements would make every
  existing assertion about the panel's spinner ambiguous; a decorative
  instance is therefore invisible to the accessibility tree and to the test
  suite alike, and the text beside it carries the meaning. Both defaults - 32
  and false - reproduce the Phase 4 output exactly, so TryOnDevice and
  CatalogCard render what they rendered before these props existed.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  let {
    size = 32,
    decorative = false,
  }: {
    /** Drives one custom property. The keyframes are percentage translates, so they scale. */
    size?: number;
    /**
     * True drops role="img", aria-label and data-testid, so a decorative
     * instance never collides with the panel's spinner in a selector - the
     * two are on screen together throughout the connecting state.
     */
    decorative?: boolean;
  } = $props();
</script>

<div
  class="spinner"
  style:--spinner-size="{size}px"
  data-testid={decorative ? undefined : "pad-spinner"}
  role={decorative ? undefined : "img"}
  aria-label={decorative ? undefined : "Connecting"}
>
  <div class="walker" aria-hidden="true"></div>
  <div class="still still-a" aria-hidden="true"></div>
  <div class="still still-b" aria-hidden="true"></div>
  <div class="still still-c" aria-hidden="true"></div>
</div>

<style>
  /* Layer 1 of the pad recipe, at --spinner-size (32px by default). Same gradient, same 11.111% pitch. */
  .spinner {
    position: relative;
    inline-size: var(--spinner-size);
    block-size: var(--spinner-size);
    flex: none;
    background-image: radial-gradient(
      circle at 50% 50%,
      var(--color-divider) 0 6%,
      transparent 6.5%
    );
    background-size: 11.111% 11.111%;
  }

  /*
    One cell. Its box is exactly one ninth of the field, so translate(100%, 0)
    is one cell to the right and the keyframes below can be read as grid
    coordinates rather than as pixels.
  */
  .walker,
  .still {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    inline-size: 11.111%;
    block-size: 11.111%;
    background-image: radial-gradient(
      circle at 50% 50%,
      var(--color-action) 0 34%,
      transparent 38%
    );
  }

  .walker {
    animation: walk 2880ms steps(1) infinite;
  }

  /* Shown only under reduced motion; the walker is hidden there instead. */
  .still {
    display: none;
  }

  .still-b {
    transform: translate(100%, 0);
  }

  .still-c {
    transform: translate(0, 100%);
  }

  /*
    32 perimeter cells at 3.125% each: nine across the top, eight down the right,
    eight back along the bottom, seven up the left. The 100% frame returns to the
    origin so the lap joins itself with no jump.
  */
  @keyframes walk {
    0% {
      transform: translate(0, 0);
    }
    3.125% {
      transform: translate(100%, 0);
    }
    6.25% {
      transform: translate(200%, 0);
    }
    9.375% {
      transform: translate(300%, 0);
    }
    12.5% {
      transform: translate(400%, 0);
    }
    15.625% {
      transform: translate(500%, 0);
    }
    18.75% {
      transform: translate(600%, 0);
    }
    21.875% {
      transform: translate(700%, 0);
    }
    25% {
      transform: translate(800%, 0);
    }
    28.125% {
      transform: translate(800%, 100%);
    }
    31.25% {
      transform: translate(800%, 200%);
    }
    34.375% {
      transform: translate(800%, 300%);
    }
    37.5% {
      transform: translate(800%, 400%);
    }
    40.625% {
      transform: translate(800%, 500%);
    }
    43.75% {
      transform: translate(800%, 600%);
    }
    46.875% {
      transform: translate(800%, 700%);
    }
    50% {
      transform: translate(800%, 800%);
    }
    53.125% {
      transform: translate(700%, 800%);
    }
    56.25% {
      transform: translate(600%, 800%);
    }
    59.375% {
      transform: translate(500%, 800%);
    }
    62.5% {
      transform: translate(400%, 800%);
    }
    65.625% {
      transform: translate(300%, 800%);
    }
    68.75% {
      transform: translate(200%, 800%);
    }
    71.875% {
      transform: translate(100%, 800%);
    }
    75% {
      transform: translate(0, 800%);
    }
    78.125% {
      transform: translate(0, 700%);
    }
    81.25% {
      transform: translate(0, 600%);
    }
    84.375% {
      transform: translate(0, 500%);
    }
    87.5% {
      transform: translate(0, 400%);
    }
    90.625% {
      transform: translate(0, 300%);
    }
    93.75% {
      transform: translate(0, 200%);
    }
    96.875% {
      transform: translate(0, 100%);
    }
    100% {
      transform: translate(0, 0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .walker {
      display: none;
    }

    .still {
      display: block;
    }
  }
</style>
