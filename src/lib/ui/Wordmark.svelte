<!--
  The wordmark, one asset that can be any colour: src/lib/assets/wordmark.svg is
  bible/hangar-logo-w.svg with three edits - the viewBox re-cropped to the ink box
  (8.06:1), width and height stripped, six fills to currentColor - and
  font-assets.spec.ts holds the derived file. Props: size (the rendered height in
  CSS pixels; the width follows the box), label (the accessible name, ledgered for
  13-18). Inline through {@html} of a build-time ?raw string, never input, because
  an <img> cannot take currentColor. The mark is "HANGAR" alone; FOR ZONA is the
  shell's to compose, and the favicon stays the 9x9 outline.
  Decided at 13-03 (13-CONTEXT D-14 Q14); see .planning/phases/13-gui-overhaul/13-03-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import mark from "$lib/assets/wordmark.svg?raw";

  let {
    size = 22,
    label = "HANGAR",
  }: {
    /** Rendered height in CSS pixels; the width follows the 8.06:1 box. */
    size?: number;
    /** The accessible name of the mark. Ledgered for 13-18. */
    label?: string;
  } = $props();
</script>

<span
  class="wordmark"
  role="img"
  aria-label={label}
  style:block-size="{size}px"
  data-testid="wordmark"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- a build-time string from src/lib/assets/wordmark.svg, never input -->
  {@html mark}
</span>

<style>
  .wordmark {
    display: inline-block;
    line-height: 0;
    color: inherit;
  }

  .wordmark :global(svg) {
    display: block;
    block-size: 100%;
    inline-size: auto;
  }
</style>
