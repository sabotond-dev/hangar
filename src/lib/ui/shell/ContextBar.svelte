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

  THE STATUS ZONE TAKES TWO PROPS FOR THE DOTTED LINE, AND THAT IS THE POINT
  (plan 13-11; Bible section 9). `● Draft saved locally · Changes not
  applied` is two facts from two sources: the DRAFT (the drafts store,
  13-06 - editable working state, recovered locally) and the DEVICE (the
  install store's phase - what a specific module confirmed it is running,
  and whether that survives power-off). Section 9 names them as two of three
  distinct objects and says "never use one generic Saved indicator for all
  three". So the bar takes `draft` and `device` as TWO props, the dot's tone
  comes from the device's phase, and the two clauses are joined by the PDF's
  middle dot only when both exist. A single merged prop - one "status
  line" a route pre-joins - would be exactly the mistake section 9 names,
  with a type signature; there is no test that could catch a route joining
  the two strings before it hands them over, and 13-11's summary says so.

  WHAT THE DEVICE CLAUSE IS. device-clause.ts maps the install store's
  fifteen phases onto Phase 10's captions and titles - the same words the
  install block under the surface renders, so the two surfaces cannot
  disagree - and names which spec row each phase serves and which four the
  spec has no row for. The bar reads the phase it is handed and NOTHING from
  the store itself; the route reads the store. 13-18 rewrites the words.

  THE DRAFT CLAUSE IS NOT WIRED YET. The drafts store exists (13-06) and no
  route writes to it until 13-13; its words ("Draft saved locally",
  "Changes not applied") are 13-18's. The prop is here so the shape is the
  Bible's from the day the first clause lands; a route that has no draft
  fact passes nothing, and the line renders the device clause alone.

  NOT THE INSTALL STATE MACHINE (that is install.svelte.ts's, read and not
  edited) AND NOT THE PAGE TARGET (13-12). The destination is a snippet the
  route hands over; this bar draws the zone.

  The bar is a section named by its breadcrumb (aria-labelledby) - a region
  landmark without a role attribute, so no label is invented and
  identity.spec.ts test 5's classifier, which reads role= as a control, does
  not read the bar's divider as a control's border. Every number is
  layout.ts's. The breadcrumb forms and the sentence are the PDF's and are
  not ledgered. The dot is a radial gradient on a square box, not a corner
  (D-01, D-15).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { InstallPhase } from "$lib/device/install.svelte";
  import { deviceClause, deviceTone } from "./device-clause";
  import { BREADCRUMB_SIZE, CONTEXT_H } from "./layout";

  let {
    breadcrumb = [],
    status,
    draft,
    device,
    destination,
  }: {
    /** The left zone, one entry per crumb; joined with " / " as the PDF writes it. */
    breadcrumb?: readonly string[];
    /** The centre zone on pages 2 and 4: a sentence, or a snippet for a richer line. */
    status?: string | Snippet;
    /** The dotted line's FIRST clause: the draft's state, from the drafts store. */
    draft?: string | Snippet;
    /** The dotted line's SECOND clause: the device's state, as the install store's phase. */
    device?: InstallPhase;
    /** The right zone. Absent means the sentence, never an empty zone. */
    destination?: Snippet;
  } = $props();

  const uid = $props.id();
  const crumbId = `${uid}-crumb`;

  /** The PDF's line for pages 2 and 4, where there is nothing to apply. */
  const PREVIEW_ONLY = "Preview without hardware";

  /** The device clause, or undefined when there is no device fact to state. */
  const clause = $derived(
    device === undefined ? undefined : deviceClause(device),
  );
  const tone = $derived(device === undefined ? "none" : deviceTone(device));
  /** The dotted line renders when either fact exists; the sentence otherwise. */
  const dotted = $derived(draft !== undefined || clause !== undefined);
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
    {#if dotted}
      <span
        class="status-line"
        data-testid="status-dotted"
        data-device={device}
        data-tone={tone}
      >
        <span class="dot" aria-hidden="true"></span>
        {#if typeof draft === "function"}
          <span class="clause" data-testid="status-draft"
            >{@render draft()}</span
          >
        {:else if draft}
          <span class="clause" data-testid="status-draft">{draft}</span>
        {/if}
        {#if draft !== undefined && clause !== undefined}
          <span class="sep" aria-hidden="true">&nbsp;·&nbsp;</span>
        {/if}
        {#if clause !== undefined}
          <span class="clause" data-testid="status-device">{clause}</span>
        {/if}
      </span>
    {:else if typeof status === "function"}
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

  /* The dotted line: the dot, the draft clause, the middle dot, the device
     clause, on one line and never wrapped mid-clause. */
  .status-line {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }

  .clause {
    color: var(--color-ink);
  }

  /*
    The dot, 8px, painted as a radial gradient on a square box (no corner,
    D-01). Its tone is the DEVICE's: quiet while nothing is known or a leg is
    in flight, the action colour for a state the module confirmed, full ink
    for the six that ended without a confirmation.
  */
  .dot {
    display: inline-block;
    inline-size: 8px;
    block-size: 8px;
    flex: none;
    --dot: var(--color-ink-quiet);
    background-image: radial-gradient(
      circle at 50% 50%,
      var(--dot) 0 46%,
      transparent 52%
    );
  }

  .status-line[data-tone="live"] .dot {
    --dot: var(--color-action);
  }

  .status-line[data-tone="uncertain"] .dot {
    --dot: var(--color-ink);
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

    .status-line {
      white-space: normal;
    }
  }
</style>
