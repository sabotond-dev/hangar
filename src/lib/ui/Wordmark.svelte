<!--
  THE WORDMARK, AS ONE ASSET THAT CAN BE ANY COLOUR (plan 13-03, D-14 Q14).

  src/lib/assets/wordmark.svg is bible/hangar-logo-w.svg with exactly three
  edits: the viewBox re-cropped to the ink box, re-measured from the six paths
  rather than copied from the research (54.496 361.359 698.586 86.711, 8.06:1);
  width and height stripped, because at 1080 they beat CSS in some contexts;
  and its six fills changed from #ffffff to currentColor. Nothing else - no
  path data touched, no <defs> added, no optimiser run. The supplied file is
  byte-identical in bible/ and src/lib/ui/font-assets.spec.ts holds the
  derived one: no dimensions, six currentColor fills, zero hex fills, and a
  viewBox that equals the ink box the test itself re-measures.

  INLINE, NOT <img>: an <img> cannot take currentColor. The asset is imported
  as a string at build time (?raw) and rendered inside a span that carries the
  role and the accessible name, so the paths inherit the parent's color: the
  header sets --color-ink, a focus state can set --color-action, and print
  gets whatever the page's color is - one asset, three jobs. The {@html} below
  renders a repository asset the bundler read at build time, never input,
  which is the one case the lint rule cannot tell from the other.

  THE MARK IS "HANGAR" ALONE. The PDF's header sets HANGAR beside a separate
  FOR ZONA at about 11px, uppercase, tracked, in the secondary colour. That
  pair is the shell's to compose (13-05); this component takes the mark only.
  It is not a favicon either: the mark is 8:1 and the icon stays the 9x9 pad
  outline at 1:1 - two marks with two jobs, which is what the PDF shows.

  The accessible name defaults to the word the mark spells and is ledgered in
  13-COPY-NEW.md for 13-18 (D-05). `size` is the rendered height in CSS
  pixels; the ink box is the cap height, and 13-RESEARCH.md measured the
  header's at about 22 on the PDF at 1440.

  The intro's header mounts this mark since 13-07, which deleted the splash
  and its tracked text wordmark; FrontDoor.svelte's tracked Grifter text
  wordmark stays on /c/{id}/ until 13-09 deletes it.

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
