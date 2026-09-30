<!--
  The DAW section's drawing (change 26): one output block's head as a card's MIDI section draws
  it (TuningRegion.svelte's fold) - the output's name in the eyebrow face, the one-line summary
  in the house mono, a chevron - on the inspector's panel. The summary is built by
  inspector-copy.ts's outputSummary from copy.ts's parts, so the picture and the app cannot
  word it differently. A picture, not the control: nothing focusable, one name (role img).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import {
    FIGURE_NAMES,
    FIGURE_OUTPUT_NAME,
    FIGURE_OUTPUT_PARTS,
  } from "$lib/guide/copy";
  import { outputSummary } from "$lib/tune/inspector-copy";

  const SUMMARY = outputSummary(FIGURE_OUTPUT_PARTS);
</script>

<div
  class="drawing"
  role="img"
  aria-label={FIGURE_NAMES.output}
  data-testid="figure-output"
>
  <span class="name type-micro">{FIGURE_OUTPUT_NAME}</span>
  <span class="summary">{SUMMARY}</span>
  <svg class="chevron" viewBox="0 0 20 20" aria-hidden="true">
    <polyline points="8,6 12,10 8,14" />
  </svg>
</div>

<style>
  /* The fold's grid: the name, the summary, the chevron's 44px box; on the inspector's panel. */
  .drawing {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr) 44px;
    column-gap: 8px;
    align-items: center;
    box-sizing: border-box;
    max-inline-size: 440px;
    min-block-size: 44px;
    padding: 8px 8px 8px 16px;
    border: 1px solid var(--color-divider);
    background: var(--color-panel);
    color: var(--color-ink);
  }

  .summary {
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--color-ink-quiet);
  }

  .chevron {
    justify-self: center;
    inline-size: 20px;
    block-size: 20px;
    fill: none;
    stroke: var(--color-ink-quiet);
    stroke-width: 1.5;
  }
</style>
