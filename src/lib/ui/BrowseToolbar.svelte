<!--
  The gallery toolbar: PDF page 2's search row, sort select and one `Use`
  chip row with the count at its right, plus the page's only live region.

  REWRITTEN FOR THE BIBLE BY PLAN 13-08; THE MACHINERY UNDERNEATH IS 10-07's.
  The state, the address, the return record and the filter live in the page
  and the pure modules under $lib/browse; this component renders controls and
  reports presses. What changed is the chrome, and each change has a decision
  behind it:

    - ONE FACET ROW, NOT TWO (13-CONTEXT D-11; the PDF has no Character
      filter). The FEELS row is gone from the screen; the six FEELS terms
      survive as card metadata. FacetRow.svelte renders ONCE here, and
      browse-ui.spec.ts test 7 counts it. A FEELS term can still arrive in
      the address (`?feels=` since A-20, or a mapped legacy `?tag=`) and it
      still filters - the count line says the truth and `Clear filters`
      clears it - but no chip is rendered for it. Stated, not hidden.
    - THE SORT IS A <select> (PDF: `SORT BY` over `Featured`). CAT-02 is
      unchanged in substance: Featured and Name, driven by BROWSE_SORTS, no
      popularity metric, nothing faked. The words are the sort's own table,
      exhaustive over BrowseSort, so a third order is a type error before it
      is a missing option.
    - THE CHIP ROW OPENS WITH `All` and continues with one chip per FOR term,
      through the same FOR_LABELS record the rail reads, so a chip and its
      rail row cannot carry two unrelated strings. If the row is too wide it
      WRAPS rather than truncating (section 6: the actual matching count and
      a way to clear each filter).
    - THE COUNT SITS AT THE ROW's RIGHT END, as the PDF draws it.
    - THE FIELD HAS THE PDF's PLACEHOLDER AND A REAL <label for>. The label
      (`SEARCH CONFIGURATIONS`, 11px uppercase) stays visible while the
      placeholder vanishes under typing, so the field is never nameless.
      16px, because iOS Safari zooms the viewport when a text input smaller
      than 16px takes focus.

  FILTERING IS SYNCHRONOUS ON EVERY KEYSTROKE. Twenty-six entries cost nothing
  to re-filter and a debounce there makes the grid feel broken - observed,
  with the keystroke and the grid a character out of step. Only the
  announcement and the address write are debounced, on one 500ms trailing
  timer.

  ESCAPE IS BOUND ON THE FIELD, NEVER ON THE WINDOW. Phase 4 binds Escape to
  un-choosing the panel on a different route, and scoping this one to the field
  is what keeps the two from ever colliding.

  THE CHIPS COMBINE OR WITHIN THE ROW (A-19), AND A CHIP THAT WOULD RETURN
  NOTHING IS STILL A REAL disabled CHECKBOX. The OR is REQUIRED rather than
  conventional: FOR gives every configuration exactly one term, so under a pure
  AND the second chip would return zero and disable itself for ever.
  disabledTags() closes the remaining gap without printing a number on a chip:
  given the query, a term that would empty the grid is disabled.

  THE COUNT IS THREE ELEMENTS DOING THREE JOBS, which is Phase 5's meter pattern
  applied to a number. The visible line updates instantly and is aria-hidden.
  An always-present visually-hidden expansion sits beside it, is never a live
  region, and is never behind a "has anything changed" flag: a visitor who
  opens /playground/?q=ghost has fired no change event, so the live region has
  nothing to say, and that sentence is the only thing telling them they are
  looking at four of twenty-six rather than at the whole catalog. The live
  region is the third thing, and it speaks once per settled change.

  ONE LIVE REGION, AND IT CANNOT CHATTER. Exactly one visually-hidden
  aria-live="polite" aria-atomic="true" element, fired from a 500ms trailing
  timer - never per keystroke, never per tick, never per paint, never on scroll
  and never on an intersection. It is a setTimeout on the state and there is no
  setInterval in this file. The empty-result sentence it speaks is section 16's
  own line, verbatim.

  FOCUS IS NEVER ORPHANED. Two controls here can vanish while holding focus, and
  both move focus deliberately: the field's `Clear` returns it to the field, and
  `Clear filters` - which removes itself the moment it works - hands it to the
  field too. `Clear filters` clears the query, every chip and the library view,
  and does NOT touch the sort: a sort is a view preference, not a filter.

  NO POPULARITY METRIC IS SHOWN OR FAKED. No like count, no view count, no
  "trending", no "most", no rank, and no bare number beside a tag that could be
  read as one (W-04). The forbidden words appear in this paragraph and in no
  markup below it, which is why every structural scan over this file strips
  comments first.

  NO RADIUS ANYWHERE (D-01): the field's 6px went with this rewrite and the
  allowlist row with it; the select and the field declare zero explicitly
  because the user-agent stylesheet would otherwise round them, and
  e2e/radius.e2e.ts measures the computed value in both engines.

  It imports from $lib/browse and, for one erased type, from $lib/catalog/listing.
  Never $lib/catalog's index, never the compile surface: this toolbar takes its
  entries as a prop and the page it sits on is prerendered.

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

  /**
   * The sort's words, keyed by BrowseSort so the type system keeps the table
   * exhaustive: a third order added to $lib/browse/sort is a type error here
   * before it is an option silently missing from the select. `Featured` is
   * the PDF's own value; `Name` is HANGAR's second order, sentence case.
   */
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

  /*
    Plain locals, deliberately outside the reactive graph: a timer handle and
    the memory of what was last settled. None of them is rendered.
  */
  let voiceTimer: ReturnType<typeof setTimeout> | undefined;
  /** The last settled sort-query-tags signature, or undefined before arrival. */
  let spokenFor: string | undefined;
  let spokenSort: BrowseSort | undefined;
  /** Whether the sort moved since the last utterance, so it can be named once. */
  let sortMoved = false;

  /**
   * The field element, for the two places focus is moved deliberately. A
   * plain local rather than $state: the binding sits outside every {#if} in
   * this file, and nothing renders from it.
   */
  let field: HTMLInputElement | undefined;

  function clearQuery(): void {
    onquery("");
    field?.focus();
  }

  /**
   * Escape clears the query and keeps focus in the field. preventDefault
   * because Chromium's own Escape handling on type="search" empties the
   * element's value without telling this component about it.
   */
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
    /*
      The numbers are read HERE rather than when the timer was set, so five
      characters typed quickly settle into one sentence carrying the final
      count instead of the count as it was at the first keystroke.
    */
    if (showing === 0) {
      announcement = NO_RESULTS;
      return;
    }
    const count = `${showing} of ${total} configurations.`;
    announcement = sorted ? `Sorted by ${SORT_WORDS[sort]}. ${count}` : count;
  }

  /*
    The one place the region is fed. It watches the sort, the query, the tags
    and the library view - never `showing`, which is a consequence of them -
    and on the FIRST pass it only remembers, because a visitor who has just
    arrived has changed nothing and the hidden expansion has already told them
    where they are.
  */
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
    // No effect runs on the server, so there is never a timer to clear after
    // a server render.
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
        <!--
          `Clear` renders only while there is something to clear, so it is one
          of the two controls on this screen that can vanish while holding
          focus. It hands focus back to the field, which is where the visitor
          was. Its accessible name says what it clears.
        -->
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

  <!--
    ONE ROW: `Use`, then `All`, then one chip per FOR term through FOR_LABELS,
    and the count at the row's right end. It wraps; nothing here scrolls
    sideways at any width.
  -->
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

    <!--
      Two of the count's three elements. The visible line is seen and hidden
      from the accessibility tree; the expansion beside it is read and is
      ALWAYS in the DOM, whether or not anything has changed. It carries
      neither aria-live nor aria-hidden, and it is not inside an {#if}.
    -->
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

  /*
    Body 16px, and the 16px is the iOS zoom floor rather than a taste. The
    trailing padding reserves room for Clear so typed text never runs under
    it. A rectangle: the user-agent's search-field shape is refused.
  */
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
