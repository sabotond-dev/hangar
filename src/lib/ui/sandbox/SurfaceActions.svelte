<!--
  The surface's share control, one zone since 13.1-06 (the destination half moved
  whole to DestinationZone.svelte, D-06, D-11 a): a surface exports as a FILE
  through transfer.ts (D-14 Q7 - no catalog entry for a link to point at), with
  the no-link explanation as the button's sr-only description, painted nowhere
  since round 4b (PDF page 3's toolbar row draws no helper), and the success line
  beside the button, folding when the row is short. Props: exported (the success
  line while shown), onexport. The strings are copy.ts's, ledgered under "From
  13-17". Square everywhere (D-01).
  Decided at 13-17 / 13.1-06 (13-CONTEXT D-14 Q7; 13.1-CONTEXT D-06); see .planning/phases/13.1-bench-corrections-four/13.1-06-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { EXPORT_SURFACE, NO_LINK_EXPLANATION } from "$lib/sandbox/copy";

  let {
    exported,
    onexport,
  }: {
    /** The export's success line, while it is shown. */
    exported?: string | undefined;
    onexport?: () => void;
  } = $props();

  const uid = $props.id();
  const explanationId = `${uid}-explanation`;
</script>

<div class="share" data-testid="surface-share">
  {#if exported !== undefined}
    <span
      class="exported type-helper"
      role="status"
      data-testid="export-outcome">{exported}</span
    >
  {/if}
  <button
    class="outlined"
    type="button"
    data-testid="export-surface"
    aria-describedby={explanationId}
    onclick={() => onexport?.()}
  >
    {EXPORT_SURFACE}
  </button>
  <!-- The no-link explanation: the button's description alone, painted nowhere (PDF page 3's row carries no helper). -->
  <p class="sr-only" id={explanationId} data-testid="no-link-explanation">
    {NO_LINK_EXPLANATION}
  </p>
</div>

<style>
  /* The share: the outlined control beside Save copy. No box of its own - its line and its button are items of the route's row directly, so the two outcome lines shrink side by side (round 4b). */
  .share {
    display: contents;
  }

  /* The success line gives way beside its button: it shrinks and folds anywhere, so a file name never sets the row's minimum. */
  .exported {
    min-inline-size: 0;
    overflow-wrap: anywhere;
    text-align: end;
    color: var(--color-ink-quiet);
  }

  .outlined {
    flex: none;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 14px;
    white-space: nowrap;
    color: var(--color-ink);
    cursor: pointer;
  }

  .outlined:hover {
    border-color: var(--color-action);
  }

  /* The compact band (1024-1439): the route's row tightens to 10px padding, and this box with it. */
  @media (max-width: 1439.98px) {
    .outlined {
      padding-inline: 10px;
    }
  }
</style>
