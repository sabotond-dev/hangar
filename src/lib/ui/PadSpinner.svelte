<!--
  The 9x9 motif, walking: IDENT-01's outline as the state the site shows while it
  waits (W-23). 32px by default of the pad recipe's first layer with one cell lit
  at full accent walking the perimeter, 90ms a step, 32 cells, 2,880ms a lap - a
  CSS animation, never a timer (the host owns the one frame loop); steps(1) makes
  each hop discrete. Under prefers-reduced-motion three corner cells light and
  stay. Props: size (one custom property, --spinner-size; the keyframes are
  percentage translates, so the walk scales), decorative (drops role="img", the
  aria-label AND data-testid together, so a second instance never collides with
  the panel's spinner in a selector). It never uses the word the copy contract forbids.
  Decided at 04-04 / 06-10 (04-UI-SPEC W-23); see .planning/phases/06-device-session/06-10-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  let {
    size = 32,
    decorative = false,
  }: {
    /** Drives one custom property. The keyframes are percentage translates, so they scale. */
    size?: number;
    /** True drops role="img", aria-label and data-testid together: a decorative instance never collides with the panel's spinner. */
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

  /* One cell, one ninth of the field, so translate(100%, 0) is one cell right and the keyframes read as grid coordinates. */
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

  /* 32 perimeter cells at 3.125% each: nine across, eight down, eight back, seven up; the 100% frame returns to the origin. */
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
