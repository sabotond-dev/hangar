<!--
  The right inspector, PDF pages 3 and 5: the panel the fields go in - an eyebrow,
  a headline (a snippet, because page 5's is two lines), an optional aside chip
  and lede, an optional lead before the first section (page 3's Element name,
  13-16), titled sections, children, and the bottom-pinned pair. Not the schema:
  13-09 renders the fields. IT SCROLLS ITS OWN BODY (section 7): a three-row grid
  whose middle row is the only scroll container; the head and the pinned actions
  stay put, and the primary action lives in the context bar, never inside the
  scroll. Named by its own headline (aria-labelledby). Every size is app.css's
  type role or layout.ts's; the strings are the route's.
  Decided at 13-05 / 13-16 (Bible section 7); see .planning/phases/13-gui-overhaul/13-05-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { Snippet } from "svelte";

  export interface InspectorSection {
    /** The 17px group title (Position & size, Behavior, Appearance, MIDI output). */
    title: string;
    content: Snippet;
  }

  let {
    eyebrow,
    headline,
    aside,
    lede,
    sections = [],
    lead,
    children,
    actions,
  }: {
    /** The 11px uppercase line above the headline. */
    eyebrow: string;
    /** The panel title, at the PDF's 30px; a snippet so it can be two lines. */
    headline: Snippet;
    /** A small element beside the headline (page 3's 2 x 6 units chip). */
    aside?: Snippet;
    /** The sentence beneath the headline (page 5's "Tune the gesture, then try it on your surface."). */
    lede?: string;
    /** Titled sections, in order. */
    sections?: readonly InspectorSection[];
    /** Before the first section, inside the scroll: page 3's Element name and Type (13-16). */
    lead?: Snippet;
    /** Anything else in the body, after the sections. */
    children?: Snippet;
    /** The bottom-pinned pair. */
    actions?: Snippet;
  } = $props();

  const uid = $props.id();
  const headlineId = `${uid}-headline`;
</script>

<aside
  class="inspector"
  data-testid="shell-inspector"
  aria-labelledby={headlineId}
>
  <div class="head">
    <p class="eyebrow type-micro">{eyebrow}</p>
    <div class="headline-row">
      <h2 class="headline type-panel-title" id={headlineId}>
        {@render headline()}
      </h2>
      {#if aside}<div class="aside">{@render aside()}</div>{/if}
    </div>
    {#if lede}<p class="lede">{lede}</p>{/if}
  </div>

  <div class="body" data-testid="shell-inspector-body">
    {#if lead}{@render lead()}{/if}
    {#each sections as section, i (section.title)}
      {#if i > 0}<hr class="divider" />{/if}
      <section class="group">
        <h3 class="group-title type-group-title">{section.title}</h3>
        {@render section.content()}
      </section>
    {/each}
    {#if children}{@render children()}{/if}
  </div>

  {#if actions}
    <div class="actions">{@render actions()}</div>
  {/if}
</aside>

<style>
  /* Three rows: the head, the ONE scroll container, the pinned actions. */
  .inspector {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    box-sizing: border-box;
    block-size: 100%;
    background: var(--color-panel);
    color: var(--color-ink);
  }

  .head {
    padding-inline: 26px;
    padding-block: 20px 8px;
  }

  .eyebrow {
    margin: 0 0 12px;
    color: var(--color-ink-quiet);
  }

  .headline-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .headline {
    margin: 0;
    color: var(--color-ink);
  }

  .aside {
    flex: 0 0 auto;
    padding-block-start: 6px;
  }

  .lede {
    margin: 12px 0 0;
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.45;
    color: var(--color-ink-quiet);
  }

  /* The only scroll container, and a containing block: an absolutely positioned descendant (TuningRegion's sr-only live region) would otherwise escape the clip and extend the document's overflow (13.1 deferred-items A.4). */
  .body {
    position: relative;
    overflow-y: auto;
    min-block-size: 0;
    padding-inline: 26px;
    padding-block: 12px 20px;
  }

  .group-title {
    margin: 0 0 12px;
    color: var(--color-ink);
  }

  /* Decorative separation between sections: the divider, never on a control. */
  .divider {
    margin-block: 20px;
    border: 0;
    border-block-start: 1px solid var(--color-divider);
  }

  /* The pinned pair, above a divider. */
  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding-inline: 26px;
    padding-block: 16px 24px;
    border-block-start: 1px solid var(--color-divider);
  }
</style>
