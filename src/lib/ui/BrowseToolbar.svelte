<!--
  The gallery toolbar: PDF page 2's search row (a 16px field with a real label
  and its Clear), the sort <select> (BROWSE_SORTS, exhaustive), ONE Use chip row
  (All, then one chip per FOR term through FOR_LABELS; wraps, never scrolls) with
  the count at its right, Clear filters, and the page's only live region. Props:
  entries (the full listing, for the disabled chips), sort, q, active, narrowed,
  showing, total, and the four callbacks. The state, the address and the filter
  are the page's and $lib/browse's; this renders controls and reports presses.
  Filtering is synchronous per keystroke; only the announcement and the address
  write ride one 500ms trailing timer. Escape is bound on the field, never the
  window. No popularity metric (W-04). No radius (D-01; radius.e2e.ts measures the field).
  Decided at 10-07 / 13-08 (13-CONTEXT D-11); see .planning/phases/13-gui-overhaul/13-08-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy } from "svelte";
  import { FOR_TERMS, type FacetName } from "$lib/browse/facets";
  import { disabledTags, type ActiveFacets } from "$lib/browse/filter";
  import { FOR_LABELS } from "$lib/browse/labels";
  import { BROWSE_SORTS, type BrowseSort } from "$lib/browse/sort";
  import type { ListingEntry } from "$lib/catalog/listing";
  import FacetRow from "./FacetRow.svelte";

  let {
    entries,
    sort,
    q,
    active,
    narrowed = false,
    showing,
    total,
    onsort,
    onquery,
    onfacet,
    onclear,
  }: {
    /** The full listing, for the disabled derivation. Never the filtered set. */
    entries: readonly ListingEntry[];
    sort: BrowseSort;
    q: string;
    /** The active chips, one list per facet, each in activation order. */
    active: ActiveFacets;
    /** Something outside this toolbar narrows the grid too (the rail's library view). */
    narrowed?: boolean;
    /** How many configurations are showing, after filtering. */
    showing: number;
    /** The size of the unfiltered catalog. */
    total: number;
    onsort: (next: BrowseSort) => void;
    onquery: (next: string) => void;
    onfacet: (facet: FacetName, term: string) => void;
    onclear: () => void;
  } = $props();

  /* The PDF's strings, verbatim. */
  const SEARCH_LABEL = "SEARCH CONFIGURATIONS";
  const SEARCH_PLACEHOLDER = "Search names, gestures, and tags…";
  const SORT_LABEL = "SORT BY";
  const USE = "Use";
  const ALL = "All";

  /* HANGAR's, in the register, ledgered for 13-18. */
  const CLEAR = "Clear";
  const CLEAR_NAME = "Clear the search";
  const CLEAR_FILTERS = "Clear filters";

  /* Section 16's row for no results, verbatim. */
  const NO_RESULTS =
    "No configurations found. Try a different search or clear your filters.";

  /** The sort's words keyed by BrowseSort, so a third order is a type error before it is a missing option; Featured is the PDF's, Name HANGAR's. */
  const SORT_WORDS: Readonly<Record<BrowseSort, string>> = {
    featured: "Featured",
    name: "Name",
  };

  /** The live region's trailing window, and the only debounce in this file. */
  const VOICE_DELAY_MS = 500;

  /* One toolbar per page, so the wiring ids are constants rather than derived. */
  const FIELD_ID = "browse-search-field";
  const SORT_ID = "browse-sort-field";

  /** The FOR members that would return nothing given the query. */
  const blocked = $derived(disabledTags(entries, q, active, "for", FOR_TERMS));

  /** `Clear filters` exists only while there is a filter for it to clear. */
  const filtering = $derived(
    narrowed ||
      q.length > 0 ||
      active.for.length > 0 ||
      active.feels.length > 0,
  );

  /** The one thing this component speaks. Everything else is said in the DOM. */
  let announcement = $state("");

  // Plain locals outside the reactive graph: a timer handle and what was last settled.
  let voiceTimer: ReturnType<typeof setTimeout> | undefined;
  /** The last settled sort-query-tags signature, or undefined before arrival. */
  let spokenFor: string | undefined;
  let spokenSort: BrowseSort | undefined;
  /** Whether the sort moved since the last utterance, so it can be named once. */
  let sortMoved = false;

  /** The field, for the two deliberate focus moves; a plain local, since the binding sits outside every {#if}. */
  let field: HTMLInputElement | undefined;

  function clearQuery(): void {
    onquery("");
    field?.focus();
  }

  /** Escape clears the query and keeps focus; preventDefault because Chromium's own Escape on type="search" empties the value silently. */
  function fieldKeys(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    event.preventDefault();
    onquery("");
  }

  /** The query, every chip and the library view, and never the sort. */
  function clearFilters(): void {
    onclear();
    field?.focus();
  }

  /** The select's value, typed through the sort's own list rather than cast. */
  function sortChanged(event: Event & { currentTarget: HTMLSelectElement }) {
    const next = BROWSE_SORTS.find(
      (option) => option === event.currentTarget.value,
    );
    if (next !== undefined) onsort(next);
  }

  // ---------------------------------------------------------------------------
  // The one voice.

  function flushVoice(): void {
    voiceTimer = undefined;
    const sorted = sortMoved;
    sortMoved = false;
    // The numbers are read HERE, not when the timer was set: five quick keystrokes settle into one sentence with the final count.
    if (showing === 0) {
      announcement = NO_RESULTS;
      return;
    }
    const count = `${showing} of ${total} configurations.`;
    announcement = sorted ? `Sorted by ${SORT_WORDS[sort]}. ${count}` : count;
  }

  /* The one place the region is fed: the sort, the query, the tags and the library view (never `showing`); the FIRST pass only remembers. */
  $effect(() => {
    const signature = `${sort}|${q}|${active.for.join(" ")}|${active.feels.join(" ")}|${narrowed}`;
    if (spokenFor === undefined) {
      spokenFor = signature;
      spokenSort = sort;
      return;
    }
    if (signature === spokenFor) return;
    sortMoved = sortMoved || sort !== spokenSort;
    spokenFor = signature;
    spokenSort = sort;
    if (voiceTimer !== undefined) clearTimeout(voiceTimer);
    voiceTimer = setTimeout(flushVoice, VOICE_DELAY_MS);
  });

  onDestroy(() => {
    // No effect runs on the server, so there is never a timer to clear there.
    if (voiceTimer === undefined) return;
    clearTimeout(voiceTimer);
    voiceTimer = undefined;
  });
</script>

<search class="toolbar" data-testid="browse-toolbar">
  <!-- The PDF's search row: the field, wide; the sort, at its right. -->
  <div class="row">
    <div class="search">
      <label class="caption type-micro" for={FIELD_ID}>{SEARCH_LABEL}</label>
      <div class="field">
        <input
          bind:this={field}
          id={FIELD_ID}
          data-testid="browse-search"
          type="search"
          enterkeyhint="search"
          autocomplete="off"
          spellcheck="false"
          placeholder={SEARCH_PLACEHOLDER}
          value={q}
          oninput={(event) => onquery(event.currentTarget.value)}
          onkeydown={fieldKeys}
        />
        <!-- Clear renders only while there is something to clear, and hands focus back to the field. -->
        {#if q.length > 0}
          <button
            class="clear"
            type="button"
            data-testid="browse-search-clear"
            aria-label={CLEAR_NAME}
            onclick={clearQuery}
          >
            {CLEAR}
          </button>
        {/if}
      </div>
    </div>

    <div class="sort">
      <label class="caption type-micro" for={SORT_ID}>{SORT_LABEL}</label>
      <div class="select-wrap">
        <select
          id={SORT_ID}
          data-testid="browse-sort"
          value={sort}
          onchange={sortChanged}
        >
          {#each BROWSE_SORTS as option (option)}
            <option value={option}>{SORT_WORDS[option]}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- ONE ROW: Use, All, one chip per FOR term, the count at the right end; it wraps. -->
  <div class="row use">
    <FacetRow
      name="for"
      caption={USE}
      terms={FOR_TERMS}
      labels={FOR_LABELS}
      active={active.for}
      {blocked}
      all={{ label: ALL, onclear: () => onclear() }}
      ontoggle={(term) => onfacet("for", term)}
    />

    <!-- Two of the count's three elements: the visible line, aria-hidden; the expansion beside it, ALWAYS in the DOM, never live. -->
    <p class="count">
      <span data-testid="browse-count" aria-hidden="true"
        >{showing} of {total} configurations.</span
      >
      <span class="sr-only" data-testid="browse-count-expansion"
        >Showing {showing} of {total} configurations.</span
      >
    </p>
  </div>

  {#if filtering}
    <div class="row">
      <button
        class="clear-filters"
        type="button"
        data-testid="browse-clear-filters"
        onclick={clearFilters}
      >
        {CLEAR_FILTERS}
      </button>
    </div>
  {/if}

  <!-- The third element, and the page's only live region. -->
  <p
    class="sr-only"
    data-testid="browse-live"
    aria-live="polite"
    aria-atomic="true"
  >
    {announcement}
  </p>
</search>

<style>
  .toolbar {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* The PDF's rows: the field wide, the sort at the right; the chips left, the count right. */
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 16px 24px;
  }

  .search {
    flex: 1 1 320px;
    min-inline-size: 0;
  }

  .sort {
    flex: 0 1 300px;
  }

  .caption {
    display: block;
    margin-block-end: 8px;
    color: var(--color-ink-quiet);
  }

  /* The positioning context for Clear. */
  .field {
    position: relative;
  }

  /* Body 16px, the iOS zoom floor; trailing padding reserves room for Clear; a rectangle, the user-agent's search shape refused. */
  .field input {
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: 44px;
    padding-inline: 16px 80px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    appearance: none;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink);
  }

  .field input::placeholder {
    color: var(--color-ink-quiet);
    opacity: 1;
  }

  /* Clear is the only clear control on the field; the native one is removed. */
  .field input::-webkit-search-cancel-button {
    display: none;
  }

  /* Quiet: borderless, no fill, the ink on hover. */
  .clear {
    position: absolute;
    inset-block-start: 0;
    inset-inline-end: 0;
    display: grid;
    place-items: center;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 12px;
    border: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
    color: var(--color-ink-quiet);
    cursor: pointer;
    transition: color 160ms ease-out;
  }

  .clear:hover {
    color: var(--color-ink);
  }

  /* The select: a rectangle with a chevron drawn in the ink, never an image. */
  .select-wrap {
    position: relative;
  }

  .select-wrap::after {
    content: "";
    position: absolute;
    inset-inline-end: 18px;
    inset-block-start: 50%;
    inline-size: 8px;
    block-size: 8px;
    border-inline-end: 1px solid var(--color-ink-quiet);
    border-block-end: 1px solid var(--color-ink-quiet);
    transform: translateY(-70%) rotate(45deg);
    pointer-events: none;
  }

  .sort select {
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 16px 44px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    appearance: none;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink);
    cursor: pointer;
  }

  .sort select option {
    background: var(--color-panel);
    color: var(--color-ink);
  }

  .row.use {
    align-items: center;
  }

  /* The count, right-aligned on the chip row, ~14px quiet as the PDF draws it. */
  .count {
    margin: 0 0 0 auto;
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  /* Secondary: an outlined rectangle at the floor. */
  .clear-filters {
    display: grid;
    place-items: center;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    background: transparent;
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
    color: var(--color-ink);
    cursor: pointer;
    transition: border-color 140ms ease-out;
  }

  .clear-filters:hover {
    border-color: var(--color-action);
  }

  @media (prefers-reduced-motion: reduce) {
    .clear,
    .clear-filters {
      transition: none;
    }
  }
</style>
