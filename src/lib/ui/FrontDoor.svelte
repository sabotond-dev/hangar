<!--
  The front door: the one composition both routes render.

  Wordmark, headline, row - and, on / but never on a deep link (D-12), the
  splash layer over the top of all three. Choosing and the panel arrive in plan
  04-08 and the deep-link route in 04-09.

  THE ROW IS MOUNTED AND TICKING WHETHER OR NOT THE SPLASH IS THERE. The splash
  is a layer over a live page, never a gate in front of a dead one: Coverflow is
  rendered before it and its onMount runs regardless of what is painted over it,
  so when the splash clears the machines really have been running for two
  seconds (W-10). Nothing here may make the row conditional on the splash.

  The wordmark is the page's only level-1 heading, and it is one deliberately:
  it is the site's name on its front page, it is what keeps e2e/smoke.e2e.ts
  green, and it gives a screen reader a document title instead of a stray
  uppercase string. It is not focusable - the tab order goes straight to the
  listbox.

  The section carries no inline padding. The gutter belongs to the wordmark and
  the headline; the row is full-bleed on purpose, because pads falling off the
  edges of the viewport is the picture the brief asks for.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { untrack } from "svelte";
  import Coverflow from "./Coverflow.svelte";
  import Splash from "./Splash.svelte";

  let {
    initialId,
    notice,
    splash = false,
  }: {
    /** Centre this entry on arrival. Plan 04-09's deep-link route passes it. */
    initialId?: string;
    /**
     * Stands in for the fidelity line for a few seconds. The deep-link route
     * passes it when the address names nothing in the row, so an unknown link
     * lands on the shelf with an explanation rather than on a dead end.
     */
    notice?: string;
    /** Play the opening. / does; a deep link never does (D-12). */
    splash?: boolean;
  } = $props();

  /**
   * Whether the opening plays, read ONCE. untrack is not decoration: Svelte
   * warns that a prop read at component-init scope captures only its initial
   * value, and capturing only the initial value is exactly right here - a later
   * change to the prop must never re-open a splash over a page the visitor is
   * already using.
   */
  const opensWithSplash = (): boolean => splash;

  /** The splash layer, until it has finished and taken itself off the page. */
  let opening = $state(untrack(opensWithSplash));
  /**
   * True while the splash still covers the row. The header wordmark holds at
   * opacity 0 through it and comes up to 1 across the dissolve, so it reaches
   * full strength at the moment the flying mark lands on it.
   */
  let covered = $state(untrack(opensWithSplash));
</script>

<section class="front-door" data-testid="front-door" data-splash={splash}>
  <h1 class="wordmark" class:covered>
    <span data-testid="header-wordmark">HANGAR</span>
  </h1>
  <p class="headline">You’ve got to start somewhere…</p>
  <div class="row"><Coverflow {initialId} {notice} /></div>
</section>

{#if opening}
  <Splash
    ondissolve={() => (covered = false)}
    onfinished={() => (opening = false)}
  />
{/if}

<style>
  .front-door {
    /* The 700ms dissolve, or the 200ms crossfade under reduced motion. */
    --arrive-ms: 700ms;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    min-block-size: 100svh;
    padding-block: 32px;
  }

  .wordmark,
  .headline {
    padding-inline: 32px;
  }

  /* Micro role: 12px / 600 / 0.18em / uppercase. */
  .wordmark {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-accent);
    transition: opacity var(--arrive-ms) cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  /*
    Held at nothing while the splash owns the screen, and NOT transitioned into
    that state - the header must be invisible on the very first painted frame
    rather than fade out of one.
  */
  .wordmark.covered {
    opacity: 0;
    transition: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .front-door {
      --arrive-ms: 200ms;
    }
  }

  /* Body role, quiet by colour rather than by size. */
  .headline {
    margin: 48px 0 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    text-align: center;
    color: var(--color-ink-quiet);
  }

  .row {
    margin-block-start: 32px;
  }

  @media (max-width: 639px) {
    .front-door {
      padding-block: 24px;
    }

    .wordmark,
    .headline {
      padding-inline: 24px;
    }
  }
</style>
