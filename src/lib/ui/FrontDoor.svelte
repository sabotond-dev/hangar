<!--
  The front door: the one composition both routes render.

  Wordmark, headline, row. Nothing else lives here - the name plate, the
  fidelity line and the splash arrive in plan 04-07, choosing and the panel in
  04-08, and the deep-link route in 04-09. The `splash` prop is declared and
  unused on purpose, so that when 04-07 lands it changes this file and not the
  two route files.

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
  import Coverflow from "./Coverflow.svelte";

  let {
    initialId,
    splash = false,
  }: {
    /** Centre this entry on arrival. Plan 04-09's deep-link route passes it. */
    initialId?: string;
    /** Declared for plan 04-07, which renders the splash from it. */
    splash?: boolean;
  } = $props();
</script>

<section class="front-door" data-testid="front-door" data-splash={splash}>
  <h1 class="wordmark">HANGAR</h1>
  <p class="headline">You’ve got to start somewhere…</p>
  <div class="row"><Coverflow {initialId} /></div>
</section>

<style>
  .front-door {
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
