<!--
  THE RIGHT INSPECTOR (plan 13-05; PDF pages 3 and 5; Bible section 7).

  An eyebrow (SELECTED ELEMENT / FADER, CONFIGURATION), a headline, an
  optional lede, sections with 17px titles, and a bottom-pinned pair of
  actions (Duplicate / Delete element; Save copy / Share snapshot). NOT THE
  SCHEMA - 13-09 renders the fields from a validated schema; this component
  draws the panel they go in.

  THE HEADLINE IS A SNIPPET, NOT A STRING, because page 5's is two lines
  ("Shape the / movement.") and a route must be able to break it where the
  PDF does. Page 3 also sets a small raised chip (2 x 6 units) beside its
  headline; that is the `aside` snippet.

  IT SCROLLS ITS OWN BODY. Section 7: "Inspectors may scroll independently
  in the production application while the preview and apply control remain
  visible." That is a CSS constraint, not a sentence: the inspector is a
  three-row grid whose middle row is the only scroll container, the head
  and the pinned actions stay put, and the frame gives the inspector column
  a bounded height so there is something to scroll inside. The primary
  action (Apply to ZONA) lives in the context bar above the frame and is
  never inside this scroll.

  The panel is named by its own headline (aria-labelledby); no label is
  invented. Every size is app.css's type role or layout.ts's; the strings
  are the route's.

  PAGE 3's `Element name` SITS ABOVE THE FIRST SECTION (plan 13-16): the
  PDF draws the name field and the type directly under the headline, before
  `Position & size`, so the body takes an optional `lead` snippet rendered
  before the sections, inside the one scroll container. Nothing else moved.

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

  /* The only scroll container in the panel. */
  .body {
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
