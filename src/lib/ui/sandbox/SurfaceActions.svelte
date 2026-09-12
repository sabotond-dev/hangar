<!--
  THE SURFACE'S SHARE CONTROL (plan 13-17; Bible section 11; 13-CONTEXT D-14
  Q7, D-18; SHARE-01). ONE ZONE SINCE 13.1-06.

  A surface exports as a FILE (D-14 Q7 - a surface has no catalog entry for a
  link to point at, and a fixed sixteen-region envelope would be some 420
  characters of hash), through 13-13's transfer.ts and nothing else, with the
  one-clause explanation as the button's description. The export label, the
  no-link explanation and the exported line are HANGAR's, in copy.ts,
  ledgered under "From 13-17". Square everywhere (D-01).

  THE EXPLANATION LEFT THE ROW ON THE FOURTH BENCH'S ROUND 4b. From 13-17 it
  was a visible two-line paragraph under the button, which put the button's
  box above Save copy's and the row "all over the place" (the user's words,
  BENCH-2026-09-12.txt). PDF page 3's toolbar row is four boxes on one
  baseline and draws no helper under any of them, so the paragraph is
  sr-only now: still in the DOM, still the button's `aria-describedby`, read
  to a screen reader and by the e2e's `toContainText`, painted nowhere. The
  string is unchanged (D-05). The export's success line stays in the row
  beside its button, centred on it and folding when the row is short of
  room, as Save copy's does.

  THE DESTINATION HALF LEFT THIS FILE AT 13.1-06 (13.1-CONTEXT D-06, D-11 a).
  From 13-17 to 13.1-06 this component carried two zones behind a `zone`
  prop: the context bar's destination zone for the Sandbox - the Target
  select, Apply to ZONA, Store on ZONA, Put back and the lines beneath - and
  this share control. The user asked for the workspace's bar to read Target,
  Apply to ZONA, Store on ZONA (bench line 6) - the shape this file already
  had - and two copies of the one control that moves hardware is how they
  drift, so the destination half moved WHOLE into src/lib/ui/
  DestinationZone.svelte, which both routes mount, and Put back left the
  interface by the user's word (D-07). The `zone` prop went with it; this is
  the share control and nothing else; the `name` prop went too (the
  export's click reads the surface through the route, and the share half
  never read it).

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
  /* The share: the outlined control beside Save copy on the toolbar's one
     row. No box of its own - its line and its button are items of the
     route's row directly, so the two outcome lines shrink side by side by
     their own widths rather than this one paying for its button as well
     (nested, the export's line was 75px wide and five lines tall at 1440
     while the saved line had 219). */
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
