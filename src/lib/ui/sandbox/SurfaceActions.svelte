<!--
  THE SURFACE'S SHARE CONTROL (plan 13-17; Bible section 11; 13-CONTEXT D-14
  Q7, D-18; SHARE-01). ONE ZONE SINCE 13.1-06.

  A surface exports as a FILE (D-14 Q7 - a surface has no catalog entry for a
  link to point at, and a fixed sixteen-region envelope would be some 420
  characters of hash), through 13-13's transfer.ts and nothing else, with the
  one-clause explanation beside it. The export label, the no-link explanation
  and the exported line are HANGAR's, in copy.ts, ledgered under "From
  13-17". Square everywhere (D-01).

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
  <p
    class="explanation type-helper"
    id={explanationId}
    data-testid="no-link-explanation"
  >
    {NO_LINK_EXPLANATION}
  </p>
</div>

<style>
  /* The share: the outlined control beside Save copy, the explanation beneath. */
  .share {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }

  .exported {
    color: var(--color-ink-quiet);
  }

  .outlined {
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 14px;
    color: var(--color-ink);
    cursor: pointer;
  }

  .outlined:hover {
    border-color: var(--color-action);
  }

  .explanation {
    margin: 0;
    max-inline-size: 420px;
    text-align: end;
    color: var(--color-ink-quiet);
  }
</style>
