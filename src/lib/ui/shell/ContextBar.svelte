<!--
  THE CONTEXT BAR (plan 13-05; PDF pages 2-5, y 76 to 135).

  59px tall, a 1px divider beneath it, THREE ZONES: the breadcrumb at the
  left (11px uppercase tracked, secondary - the PDF's PLAYGROUND /
  CONFIGURATIONS, SANDBOX / CUSTOM SURFACE, MY CONFIGS / YOUR LIBRARY,
  PLAYGROUND / ARC), the status in the centre (a sentence on pages 2 and 4;
  the dotted draft line on 3 and 5), and at the right either a destination -
  the Target select and Apply to ZONA on pages 3 and 5 - or, where there is
  nothing to apply, the sentence "Preview without hardware" (pages 2 and 4).
  THE THIRD ZONE IS A DESTINATION OR A SENTENCE, NEVER EMPTY; that is a
  structural rule of the bar and shell.spec.ts test 3 drives both shapes.

  NOT THE INSTALL STATE MACHINE (13-11) AND NOT THE PAGE TARGET (13-12). The
  destination is a snippet the route hands over; this bar draws the zone.

  The bar is a section named by its breadcrumb (aria-labelledby) - a region
  landmark without a role attribute, so no label is invented and
  identity.spec.ts test 5's classifier, which reads role= as a control, does
  not read the bar's divider as a control's border. Every number is layout.ts's. The breadcrumb forms
  and the sentence are the PDF's and are not ledgered.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { BREADCRUMB_SIZE, CONTEXT_H } from "./layout";

  let {
    breadcrumb = [],
    status,
    destination,
  }: {
    /** The left zone, one entry per crumb; joined with " / " as the PDF writes it. */
    breadcrumb?: readonly string[];
    /** The centre zone: a sentence, or a snippet for a richer line. */
    status?: string | Snippet;
    /** The right zone. Absent means the sentence, never an empty zone. */
    destination?: Snippet;
  } = $props();

  const uid = $props.id();
  const crumbId = `${uid}-crumb`;

  /** The PDF's line for pages 2 and 4, where there is nothing to apply. */
  const PREVIEW_ONLY = "Preview without hardware";
</script>

<section
  class="bar"
  aria-labelledby={crumbId}
  data-testid="shell-context"
  style:--context-h="{CONTEXT_H}px"
  style:--crumb-size="{BREADCRUMB_SIZE}px"
>
  <div class="zone crumb" data-zone="breadcrumb" id={crumbId}>
    {#each breadcrumb as crumb, i (i)}
      {#if i > 0}<span class="sep" aria-hidden="true">&nbsp;/&nbsp;</span>{/if}
      <span class="crumb-word">{crumb}</span>
    {/each}
  </div>

  <div class="zone status" data-zone="status">
    {#if typeof status === "function"}
      {@render status()}
    {:else if status}
      {status}
    {/if}
  </div>

  <div class="zone destination" data-zone="destination">
    {#if destination}
      {@render destination()}
    {:else}
      <span class="preview-only">{PREVIEW_ONLY}</span>
    {/if}
  </div>
</section>

<style>
  .bar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    box-sizing: border-box;
    min-block-size: var(--context-h);
    padding-inline: 30px;
    border-block-end: 1px solid var(--color-divider);
    background: var(--color-workspace);
    color: var(--color-ink);
  }

  .zone {
    display: flex;
    align-items: center;
    gap: 12px;
    min-inline-size: 0;
  }

  .crumb {
    justify-content: flex-start;
    font-family: var(--font-display);
    font-size: var(--crumb-size);
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
  }

  .status {
    justify-content: center;
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.45;
    color: var(--color-ink-quiet);
  }

  .destination {
    justify-content: flex-end;
  }

  .preview-only {
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.45;
    color: var(--color-ink-quiet);
  }

  /* Section 13: on narrow screens the three zones reflow to rows. Keyed to
     width because it is a layout rule, not a target-size rule. */
  @media (max-width: 767.98px) {
    .bar {
      grid-template-columns: 1fr;
      row-gap: 8px;
      padding-block: 12px;
    }

    .status,
    .destination {
      justify-content: flex-start;
    }
  }
</style>
