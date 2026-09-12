<!--
  THE LEFT RAIL (plan 13-05; PDF pages 2-5; Bible sections 7, 13, 14).

  A titled section list, and NOT the catalog and NOT the element list: it
  takes rows. The four PDF rails are four shapes of the same thing and the
  props cover all four -

    page 2: YOUR LIBRARY with two-digit counts (All configs 36, Favorites
            08, Recently used 06), a divider, MADE FOR with plain rows, a
            quiet two-line note and an outlined + Build your own pinned to
            the bottom;
    page 3: ADD AN ELEMENT with a + at each row's right, a divider, ON THIS
            SURFACE with the element's TYPE at the right (Filter / Fader),
            and + New surface pinned;
    page 4: YOUR LIBRARY with counts, a divider, COLLECTIONS with plain rows;
    page 5: CONFIGURATIONS, a back link, six rows with a two-digit INDEX at
            the right (Arc 01), and a starred Save a copy pinned.

  A row carries a label and at most one right-hand thing: a count (padded
  by layout.ts's padCount, which stops padding above 99), a meta string
  (the type, or the +), or an index (padded the same way). A row with an
  href is a link; a row without one is a button that reports its id.

  THE SELECTED ROW IS D-03's THREE SIGNALS (app.css's second rule, held by
  identity.spec.ts test 6): a 3px action-colour left rule, the raised fill,
  and an action-coloured label - together, because raised-on-panel is
  1.12:1 and a selection told apart by fill alone is invisible. All three
  are keyed to aria-current, so the accessibility tree and the paint cannot
  disagree, and this rail is the first real subject of test 6's scan.

  Section 14's "element list so the surface is not the sole means of
  selection" is exactly page 3's ON THIS SURFACE section: it is a list of
  buttons, reachable by keyboard, and it is not optional.

  Every row is a 44px box at every pointer: the site's floor is per control,
  and layout.ts's RAIL_ROW_H (the PDF's 40) is the row's declared height
  beneath that floor. Every number is layout.ts's. The section titles and
  row labels are the route's, so nothing here is ledgered.

  PAGE 3's TWO SECTIONS ARRIVE AS CHILDREN (plan 13-16). The palette's `+`
  is disabled at the cap with a reason beside it, and the element list has
  a keyboard model of its own; neither is a row a `RailRow` can describe. So
  the rail takes an optional `children` snippet, rendered inside the same
  scroll column after any `sections`, and src/lib/ui/sandbox/Palette.svelte
  and ElementList.svelte draw their rows at this file's numbers. One aside,
  one landmark, one scroll container - the frame does not know the
  difference.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ResolvedPathname } from "$app/types";
  import { RAIL_ROW_H, padCount } from "./layout";

  export interface RailRow {
    id: string;
    label: string;
    /** A count at the right, padded to two digits (page 2 and 4). */
    count?: number;
    /** A short string at the right: the type (page 3), or a plus (page 3's palette). */
    meta?: string;
    /** A one-based index at the right, padded to two digits (page 5). */
    index?: number;
    /**
     * A link row. Without it the row is a button that reports its id. Typed
     * ResolvedPathname so the route hands over a resolve() result and the
     * navigation lint rule is satisfied by the type, as BrowseLink.svelte does.
     */
    href?: ResolvedPathname;
  }

  export interface RailSection {
    /** The 11px uppercase title (YOUR LIBRARY, MADE FOR, ...). */
    title: string;
    rows: readonly RailRow[];
  }

  let {
    sections = [],
    selected,
    onselect,
    lead,
    note,
    action,
    children,
  }: {
    sections?: readonly RailSection[];
    /** The id of the selected row, if any. */
    selected?: string;
    /** Reported by a button row's click. */
    onselect?: (id: string) => void;
    /** Above the first section: page 5's back link, say. */
    lead?: Snippet;
    /** The quiet lines above the pinned action (page 2). */
    note?: Snippet;
    /** The bottom-pinned action: page 2's + Build your own, page 3's + New surface. */
    action?: Snippet;
    /** Page 3's palette and element list (13-16): rendered in the scroll column after the sections. */
    children?: Snippet;
  } = $props();

  const uid = $props.id();
  const titleId = (i: number) => `${uid}-section-${i}`;
</script>

<aside
  class="rail"
  data-testid="shell-rail"
  aria-labelledby={sections.length > 0 ? titleId(0) : undefined}
  style:--rail-row-h="{RAIL_ROW_H}px"
>
  <div class="scroll">
    {#if lead}
      <div class="lead">{@render lead()}</div>
    {/if}
    {#each sections as section, i (section.title)}
      {#if i > 0}<hr class="divider" />{/if}
      <section class="group" aria-labelledby={titleId(i)}>
        <h2 class="title type-micro" id={titleId(i)}>{section.title}</h2>
        <ul class="rows">
          {#each section.rows as row (row.id)}
            <li>
              {#if row.href}
                <a
                  class="row"
                  href={row.href}
                  aria-current={row.id === selected ? "page" : undefined}
                  data-row={row.id}
                >
                  <span class="label">{row.label}</span>
                  {#if row.count !== undefined}
                    <span class="side numerals">{padCount(row.count)}</span>
                  {:else if row.index !== undefined}
                    <span class="side numerals">{padCount(row.index)}</span>
                  {:else if row.meta}
                    <span class="side">{row.meta}</span>
                  {/if}
                </a>
              {:else}
                <button
                  class="row"
                  type="button"
                  aria-current={row.id === selected ? "true" : undefined}
                  data-row={row.id}
                  onclick={() => onselect?.(row.id)}
                >
                  <span class="label">{row.label}</span>
                  {#if row.count !== undefined}
                    <span class="side numerals">{padCount(row.count)}</span>
                  {:else if row.index !== undefined}
                    <span class="side numerals">{padCount(row.index)}</span>
                  {:else if row.meta}
                    <span class="side">{row.meta}</span>
                  {/if}
                </button>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/each}
    {#if children}{@render children()}{/if}
  </div>

  {#if note || action}
    <div class="pinned">
      {#if note}<div class="note">{@render note()}</div>{/if}
      {#if action}<div class="action">{@render action()}</div>{/if}
    </div>
  {/if}
</aside>

<style>
  /* The rail is a column: a scrolling list above a pinned foot. */
  .rail {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    box-sizing: border-box;
    block-size: 100%;
    padding-block: 16px 24px;
    background: var(--color-panel);
    color: var(--color-ink);
  }

  .scroll {
    overflow-y: auto;
    min-block-size: 0;
    padding-inline: 16px;
  }

  .lead {
    padding-inline: 12px;
    padding-block-end: 8px;
  }

  .title {
    margin: 0;
    padding-inline: 12px;
    padding-block: 12px 8px;
    color: var(--color-ink-quiet);
  }

  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* The decorative divider between sections: --color-divider, never on a control. */
  .divider {
    margin-block: 16px;
    margin-inline: 12px;
    border: 0;
    border-block-start: 1px solid var(--color-divider);
  }

  /*
    A row: the PDF's 40px beneath the site's 44px floor, on both axes, at
    every pointer. The 3px left slot is reserved on every row - transparent
    at rest, the action colour when current - so selection never shifts the
    label sideways.
  */
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: max(var(--rail-row-h), 44px);
    min-inline-size: 44px;
    padding-inline: 12px;
    border: 0;
    border-inline-start: 3px solid transparent;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.3;
    text-align: start;
    text-decoration: none;
    color: var(--color-ink);
    cursor: pointer;
  }

  .row:hover {
    background: var(--color-raised);
  }

  /* D-03's three signals, together, on the current row. */
  .row[aria-current] {
    background: var(--color-raised);
    border-inline-start: 3px solid var(--color-action);
  }

  .row[aria-current] .label {
    color: var(--color-action);
  }

  .side {
    flex: 0 0 auto;
    font-size: 13px;
    color: var(--color-ink-quiet);
  }

  .pinned {
    padding-inline: 28px;
    padding-block-start: 16px;
  }

  .note {
    padding-block-end: 12px;
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.45;
    color: var(--color-ink-quiet);
  }

  .action {
    display: flex;
  }
</style>
