<!--
  The browse toolbar: one search landmark holding the field, the sort and - from
  the next commit - the chips, the clear control and the count.

  EVERY WIDGET IN HERE IS ONE THE SITE ALREADY SHIPS. The sort control is Phase
  5's word row verbatim: a role="radiogroup" over real <input type="radio"> in
  <label>s, one tab stop, arrows that move AND select, 4px gaps, a 44px box with
  12px inline padding. The site has one way of saying "this is the live value"
  and reusing it costs no new pattern, no new accent use and no new keyboard
  model. The only difference from a knob's row is the case: FEATURED, NEWEST and
  NAME are uppercase because they are one-word page-control labels, and that is
  what tells a visitor that NAME reorders the page while Major names a scale.

  THE OPTIONS ARE DRIVEN BY BROWSE_SORTS, never by three literals in the markup,
  so the control cannot offer an order the comparators do not implement. The
  words come from a table keyed by BrowseSort, which is exhaustive over the type:
  a fourth sort added to $lib/browse/sort makes this file a type error rather
  than a control silently missing an option.

  THE FIELD HAS A REAL <label for> AND NO PLACEHOLDER. A placeholder would say
  the same word as the label and then vanish at the moment it was needed - while
  a visitor is typing, which is exactly when a reminder of what the field does is
  worth something. It is 16px because iOS Safari zooms the viewport when a text
  input smaller than 16px takes focus; it is the second and last text input on
  the site, and 05-UI-SPEC made the same declaration for the copy fallback field.

  FILTERING IS SYNCHRONOUS ON EVERY KEYSTROKE. Sixteen entries cost nothing to
  re-filter and a debounce there makes the grid feel broken - observed, with the
  keystroke and the grid a character out of step. Only the announcement and the
  address write are debounced, on one 500ms trailing timer.

  ESCAPE IS BOUND ON THE FIELD, NEVER ON THE WINDOW. Phase 4 binds Escape to
  un-choosing the panel on a different route, and scoping this one to the field
  is what keeps the two from ever colliding. Pressed anywhere else on the browse
  page it does nothing at all.

  NO POPULARITY METRIC IS SHOWN OR FAKED. No like count, no view count, no
  "trending", no "most", no rank, and no bare number beside a tag that could be
  read as one (W-04). The forbidden words appear in this paragraph and in no
  markup below it, which is why every structural scan over this file strips
  comments first.

  The ninth token - Phase 5's over-budget alarm - appears nowhere on a browse
  screen. It is scoped to the over-budget state of a 908-character meter, and no
  meter exists here. Nothing on this page is monospaced either: the count changes
  on a filter change rather than on a tick, so there is nothing to jitter.

  It imports from $lib/browse and, for one erased type, from $lib/catalog/listing.
  Never $lib/catalog's index, never the compile surface: this toolbar takes its
  entries as a prop and the page it sits on is prerendered.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { BROWSE_SORTS, type BrowseSort } from "$lib/browse/sort";

  let {
    sort,
    q,
    onsort,
    onquery,
  }: {
    sort: BrowseSort;
    q: string;
    onsort: (next: BrowseSort) => void;
    onquery: (next: string) => void;
  } = $props();

  /**
   * The three page-control labels, verbatim from the copy contract.
   *
   * A Record keyed by BrowseSort rather than an array beside BROWSE_SORTS: the
   * order comes from the module and the words come from a table the type system
   * keeps exhaustive, so neither can silently fall out of step with the other.
   */
  const SORT_LABELS: Readonly<Record<BrowseSort, string>> = {
    featured: "FEATURED",
    newest: "NEWEST",
    name: "NAME",
  };

  /* One toolbar per page, so the wiring ids are constants rather than derived. */
  const FIELD_ID = "browse-search-field";
  const SORT_CAPTION_ID = "browse-sort-caption";

  /**
   * The field element, for the two places focus is moved deliberately: its own
   * CLEAR, which removes itself, and CLEAR FILTERS, which does the same.
   *
   * A plain local rather than $state, the same as Coverflow.svelte's stage: the
   * binding sits outside every {#if} in this file, and nothing renders from it.
   */
  let field: HTMLInputElement | undefined;

  function clearQuery(): void {
    onquery("");
    field?.focus();
  }

  /**
   * Escape clears the query and keeps focus in the field.
   *
   * preventDefault because Chromium's own Escape handling on type="search"
   * empties the element's value without telling this component about it, which
   * would leave the field and the grid disagreeing about what was typed.
   */
  function fieldKeys(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    event.preventDefault();
    onquery("");
  }
</script>

<search class="toolbar" data-testid="browse-toolbar">
  <div class="band">
    <label class="caption" for={FIELD_ID}>SEARCH</label>

    <div class="field">
      <input
        bind:this={field}
        id={FIELD_ID}
        data-testid="browse-search"
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        spellcheck="false"
        value={q}
        oninput={(event) => onquery(event.currentTarget.value)}
        onkeydown={fieldKeys}
      />

      <!--
        CLEAR renders only while there is something to clear, so it is one of the
        two controls on this screen that can vanish while holding focus. It hands
        focus back to the field, which is where the visitor was.

        The visible word stays CLEAR; the accessible name is "Clear the search",
        because CLEAR on its own does not say what it clears once a screen reader
        has moved past the SEARCH label.
      -->
      {#if q.length > 0}
        <button
          class="clear"
          type="button"
          data-testid="browse-search-clear"
          aria-label="Clear the search"
          onclick={clearQuery}
        >
          CLEAR
        </button>
      {/if}
    </div>
  </div>

  <div class="band">
    <span class="caption" id={SORT_CAPTION_ID}>SORT</span>

    <div
      class="options"
      data-testid="browse-sort"
      role="radiogroup"
      aria-labelledby={SORT_CAPTION_ID}
    >
      {#each BROWSE_SORTS as option (option)}
        <label class="option" class:selected={option === sort}>
          <input
            class="sr-only"
            type="radio"
            name="sort"
            value={option}
            checked={option === sort}
            onchange={() => onsort(option)}
          />
          <span class="word">{SORT_LABELS[option]}</span>
        </label>
      {/each}
    </div>
  </div>
</search>

<style>
  /*
    Three stacked bands, 16px apart. Every band is label-over-control at every
    width - Phase 5's rule that a word row always stacks, so its options get the
    full content width to wrap into.
  */
  .toolbar {
    display: block;
  }

  .band + .band {
    margin-block-start: 16px;
  }

  /* Micro: 12px / 600 / 1.2 / 0.18em, uppercase, quiet. 4px above its control. */
  .caption {
    display: block;
    margin-block-end: 4px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
  }

  /* The positioning context for CLEAR, capped at the 480px field width. */
  .field {
    position: relative;
    max-inline-size: 480px;
  }

  /*
    Body 16px, and the 16px is the iOS zoom floor rather than a taste: a smaller
    field zooms the viewport of every visitor on an iPhone the moment it takes
    focus. The 64px of trailing padding reserves room for CLEAR so typed text
    never runs under it.
  */
  .field input {
    inline-size: 100%;
    min-block-size: 44px;
    padding-inline: 16px 64px;
    border: 1px solid var(--color-line);
    border-radius: 6px;
    background: transparent;
    font-family: inherit;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink);
  }

  /* CLEAR is the only clear control on the field; the native one is removed. */
  .field input::-webkit-search-cancel-button {
    display: none;
  }

  .clear {
    position: absolute;
    inset-block-start: 0;
    inset-inline-end: 0;
    display: grid;
    place-items: center;
    inline-size: 44px;
    min-block-size: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
    cursor: pointer;
    transition: color 160ms ease-out;
  }

  .clear:hover {
    color: var(--color-ink);
  }

  /* Phase 5's word row: wraps, never scrolls, 4px gaps, a 44px floor. */
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    min-block-size: 44px;
  }

  .option {
    position: relative;
    display: grid;
    place-items: center;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 12px;
    border-radius: 6px;
    cursor: pointer;
  }

  /*
    The radio is visually hidden, so Phase 4's ring is drawn on the option - the
    same relocation Knob.svelte makes. No control here is focusable without one.
  */
  .option:has(:focus-visible) {
    outline: 2px solid var(--color-accent);
    outline-offset: 4px;
    border-radius: 6px;
  }

  /* Micro: the selected option is accent under reserved-list entry 8. */
  .word {
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
    transition: color 140ms ease-out;
  }

  .option:hover .word {
    color: var(--color-ink);
  }

  .option.selected .word,
  .option.selected:hover .word {
    color: var(--color-accent);
  }

  @media (prefers-reduced-motion: reduce) {
    .clear,
    .word {
      transition: none;
    }
  }
</style>
