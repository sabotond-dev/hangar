<!--
  The context bar, PDF pages 2-5: 59px, a divider beneath, THREE ZONES - the
  breadcrumb (11px uppercase, joined with " / "), the status in the centre (a
  sentence, or the dotted draft line), and at the right a destination snippet or,
  where there is nothing to apply, "Preview without hardware" - never empty
  (shell.spec.ts drives both shapes). Props: breadcrumb, status, draft, device,
  page, destination. The dotted line takes draft and device as TWO props (section
  9: never one generic Saved indicator for two objects); the dot's tone is the
  device's phase through device-clause.ts, and the bar reads nothing from a store.
  Not the install machine, not the page target: the destination is the route's
  snippet, and the zone grows the row rather than floating. A section named by its breadcrumb.
  placement "header" (change 25b): on the app pages the bar leaves and its status and right
  zones render inline in Header.svelte's context slot - no breadcrumb, no landmark, the same
  two zones and the same testids, so nothing the bar said or held is lost.
  Decided at 13-05 / 13-11 (Bible section 9); see .planning/phases/13-gui-overhaul/13-11-SUMMARY.md

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
    page,
    destination,
    placement = "bar",
  }: {
    /** The left zone, one entry per crumb; joined with " / " as the PDF writes it. */
    breadcrumb?: readonly string[];
    /** The centre zone on pages 2 and 4: a sentence, or a snippet for a richer line. */
    status?: string | Snippet;
    /** The dotted line's FIRST clause: the draft's state, from the drafts store. */
    draft?: string | Snippet;
    /** The dotted line's SECOND clause: the device's state, as the install store's phase. */
    device?: InstallPhase;
    /** The page that clause names, as the module reports it (the copy adds one); the install store's snapshotPage. */
    page?: number;
    /** The right zone. Absent means the sentence, never an empty zone. */
    destination?: Snippet;
    /** "bar": the section under the header. "header" (change 25b): the status and right zones alone, inline in the header's context slot. */
    placement?: "bar" | "header";
  } = $props();

  const uid = $props.id();
  const crumbId = `${uid}-crumb`;

  /** The PDF's line for pages 2 and 4, where there is nothing to apply. */
  const PREVIEW_ONLY = "Preview without hardware";

  /** The device clause, or undefined when there is no device fact to state. */
  const clause = $derived(
    device === undefined ? undefined : deviceClause(device, page ?? 0),
  );
  const tone = $derived(device === undefined ? "none" : deviceTone(device));
  /** The dotted line renders when either fact exists; the sentence otherwise. */
  const dotted = $derived(draft !== undefined || clause !== undefined);
</script>

<!-- The status and right zones, drawn by both placements. -->
{#snippet zones()}
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
{/snippet}

{#if placement === "header"}
  <div class="inline" data-testid="header-context">
    {@render zones()}
  </div>
{:else}
  <section
    class="bar"
    aria-labelledby={crumbId}
    data-testid="shell-context"
    style:--context-h="{CONTEXT_H}px"
    style:--crumb-size="{BREADCRUMB_SIZE}px"
  >
    <div class="zone crumb" data-zone="breadcrumb" id={crumbId}>
      {#each breadcrumb as crumb, i (i)}
        {#if i > 0}<span class="sep" aria-hidden="true">&nbsp;/&nbsp;</span
          >{/if}
        <span class="crumb-word">{crumb}</span>
      {/each}
    </div>
    {@render zones()}
  </section>
{/if}

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

  /* The dotted line: the dot, the draft clause, the middle dot, the device clause, never wrapped mid-clause. */
  .status-line {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }

  .clause {
    color: var(--color-ink);
  }

  /* The dot, 8px, a radial gradient on a square box (D-01); its tone is the device's: quiet, the action colour for a confirmed state, full ink for an unconfirmed end. */
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

  /*
    The header's placement (change 25b): the two zones on one line at the header's right, in its
    register - the dotted line at 13px beside the preview sentence or the destination, as Clear's
    and the connection control's words are. Header.svelte gives the line a row of its own beneath them.
  */
  .inline {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 24px;
    min-inline-size: 0;
  }

  .inline .status {
    font-size: 13px;
  }

  /* The destination's row sits on the header's line with the zone's 8px above it and none below: the header's own padding closes the band. */
  .inline .destination > :global(.destination) {
    padding-block-end: 0;
  }

  /* With the destination, the dotted line keeps to the row's middle while the zone's lines grow beneath it. */
  .inline:has(.destination > :global(.destination)) {
    align-items: flex-start;
  }

  .inline:has(.destination > :global(.destination)) .status {
    min-block-size: 44px;
    margin-block-start: 8px;
  }

  /* Section 13: on narrow screens the three zones reflow to rows (a layout rule, keyed to width). */
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

    /* In the header, the line wraps its two zones as the bar did, from the left. */
    .inline {
      flex-wrap: wrap;
      justify-content: flex-start;
      row-gap: 8px;
    }

    .inline:has(.destination > :global(.destination)) .status {
      min-block-size: 0;
      margin-block-start: 0;
    }
  }
</style>
