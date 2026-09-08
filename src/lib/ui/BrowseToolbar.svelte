<!--
  The browse toolbar: one search landmark holding the field, the sort, the two
  facet rows, the clear control, the count and the page's only live region.

  EVERY WIDGET IN HERE IS ONE THE SITE ALREADY SHIPS. The sort control is Phase
  5's word row verbatim: a role="radiogroup" over real <input type="radio"> in
  <label>s, one tab stop, arrows that move AND select, 4px gaps, a 44px box with
  12px inline padding. The site has one way of saying "this is the live value"
  and reusing it costs no new pattern, no new accent use and no new keyboard
  model. The only difference from a knob's row is the case: FEATURED and NAME
  are uppercase because they are one-word page-control labels, and that is what
  tells a visitor that NAME reorders the page while Major names a scale.

  THE ROW IS TWO WORDS SINCE D-11, AND TWO IS HONEST. NEWEST went because
  addedAt held three distinct values across thirty-six entries with twenty
  sharing one, so the order produced a twenty-deep block in name order and
  called it a ranking. A third order was considered (MOTION, animated first)
  and refused as redundant: the FEELS row's `generative` and `still` answer
  that question as a filter, which is the better shape.

  THE OPTIONS ARE DRIVEN BY BROWSE_SORTS, never by literals in the markup,
  so the control cannot offer an order the comparators do not implement. The
  words come from a table keyed by BrowseSort, which is exhaustive over the type:
  a third sort added to $lib/browse/sort makes this file a type error rather
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

  THE CHIPS COMBINE OR WITHIN A ROW AND AND ACROSS THE TWO (A-19), AND A CHIP
  THAT WOULD RETURN NOTHING IS STILL A REAL disabled CHECKBOX. The first rule is
  REQUIRED rather than conventional: FOR gives every configuration exactly one
  term, so under a pure AND the second FOR chip would return zero and disable
  itself for ever, and a row whose second click is always dead is not a row.
  05.1-UI-SPEC W-04 said AND and was right about the data it was written
  against - 32 of the 41 tags then shipped sat on exactly one configuration, so
  a union would have made a second chip ADD one card. D-10 re-cut the vocabulary
  and the argument inverted with it. disabledTags() closes the remaining gap
  without printing a number on a chip, and TagChip.svelte carries the reason
  beside the attribute.

  THE STANDING ROWS ARE THE FACET MEMBERS, DECLARED, NEVER DERIVED (G-09).
  FOR_TERMS then FEELS_TERMS, carried here as FACETS so the caption, the order
  and the membership come from ONE declaration in $lib/browse/facets. The row
  used to be "every tag two or more configurations carry", computed from
  `entries` through chipTags(); that function is deleted and so is the branch
  that needed it.

  AND THE OUTSIDER CHIP RETIRED WITH THE DERIVATION. It rendered an active tag
  that was not one of the standing chips after them, which is what made a shared
  /browse/?tag=looper link removable rather than a filter with no visible
  control. Nothing can produce an outsider now: the vocabulary is closed at
  sixteen, so every active member is already in a standing row, and an unmapped
  legacy value lands in the SEARCH FIELD instead of as a chip (G-10). The
  outsider's job passed to the field's own CLEAR.

  "MORE TAGS" WAS NEVER BUILT AND STILL IS NOT, and A-20 rules on it rather than
  leaving it as an absence: sixteen chips in two labelled rows fit above the
  grid at every width, so there is no disclosure and there never was one.
  05.1-UI-SPEC W-19 proposed one; 05.1-CONTEXT D-15 beat it, and the closed
  vocabulary removed the problem it was proposed for.

  THE DISABLED SET IS DERIVED HERE, per row, through disabledTags() - which is
  pure and pinned in node by filter.spec.ts, so nothing untestable moved into a
  component. Its question narrowed with the semantics: a chip is dead only when
  it would return zero given the OTHER row's active set, which makes it rare.

  THE COUNT IS THREE ELEMENTS DOING THREE JOBS, which is Phase 5's meter pattern
  applied to a number. The visible line updates instantly and is aria-hidden. An
  always-present visually-hidden expansion sits beside it in the DOM, is never a
  live region, and is never behind a "has anything changed" flag: a visitor who
  opens /browse/?q=ghost has fired no change event, so the live region has
  nothing to say, and that sentence is the only thing telling them they are
  looking at four of sixteen rather than at the whole catalog. The live region is
  the third thing, and it speaks once per settled change.

  ONE LIVE REGION, AND IT CANNOT CHATTER. Exactly one visually-hidden
  aria-live="polite" aria-atomic="true" element, fired from a 500ms trailing
  timer - never per keystroke, never per tick, never per paint, never on scroll
  and never on an intersection. It is a setTimeout on the state and there is no
  setInterval in this file, which is a prohibition a raw grep cannot check and a
  comment-stripped scan can. Measured, by recording every write to the region:
  typing g-h-o-s-t at 60ms produces ONE utterance through the timer and THREE
  with the same write moved into the keystroke handler - three rather than five
  because the last two characters leave the count at 1, so the sentence is
  unchanged and the DOM is never written. A screen reader would be interrupted
  mid-word twice for nothing.

  FOCUS IS NEVER ORPHANED. Two controls here can vanish while holding focus, and
  both move focus deliberately: the field's CLEAR returns it to the field, and
  CLEAR FILTERS - which removes itself the moment it works - hands it to the
  field too. CLEAR FILTERS clears the query and every tag and does NOT touch the
  sort: a sort is a view preference, not a filter, and resetting it would undo
  something the visitor did not ask to undo.

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
  import { onDestroy } from "svelte";
  import { FACETS, type FacetName } from "$lib/browse/facets";
  import { disabledTags, type ActiveFacets } from "$lib/browse/filter";
  import { BROWSE_SORTS, type BrowseSort } from "$lib/browse/sort";
  import type { ListingEntry } from "$lib/catalog/listing";
  import FacetRow from "./FacetRow.svelte";

  let {
    entries,
    sort,
    q,
    active,
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
    /** How many configurations are showing, after filtering. */
    showing: number;
    /** The size of the unfiltered catalog. */
    total: number;
    onsort: (next: BrowseSort) => void;
    onquery: (next: string) => void;
    onfacet: (facet: FacetName, term: string) => void;
    onclear: () => void;
  } = $props();

  /**
   * The two page-control labels, verbatim from the copy contract.
   *
   * A Record keyed by BrowseSort rather than an array beside BROWSE_SORTS: the
   * order comes from the module and the words come from a table the type system
   * keeps exhaustive, so neither can silently fall out of step with the other.
   * NEWEST left both tables in 10-07 (D-11) and left them as a TYPE ERROR
   * first - which is the whole reason they are keyed by BrowseSort.
   */
  const SORT_LABELS: Readonly<Record<BrowseSort, string>> = {
    featured: "FEATURED",
    name: "NAME",
  };

  /**
   * The same two words in the case the live region says them in. A sentence
   * is not a button label, so `Sorted by Featured.` never shouts.
   */
  const SORT_WORDS: Readonly<Record<BrowseSort, string>> = {
    featured: "Featured",
    name: "Name",
  };

  /** The live region's trailing window, and the only debounce in this file. */
  const VOICE_DELAY_MS = 500;

  /* One toolbar per page, so the wiring ids are constants rather than derived. */
  const FIELD_ID = "browse-search-field";
  const SORT_CAPTION_ID = "browse-sort-caption";

  /**
   * The two rows and, per row, the members that would return nothing given the
   * query and the OTHER row's active set. With nothing active and nothing typed
   * both are empty by construction, so there is no special case for the opening
   * state - and under the narrowed predicate a member is never dead merely
   * because a sibling in its own row is on.
   */
  const rows = $derived(
    FACETS.map((facet) => ({
      facet,
      blocked: disabledTags(entries, q, active, facet.name, facet.terms),
    })),
  );

  /** CLEAR FILTERS exists only while there is a filter for it to clear. */
  const filtering = $derived(
    q.length > 0 || active.for.length > 0 || active.feels.length > 0,
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

  /**
   * The query and every tag, and never the sort. Focus goes to the field
   * because this button removes itself the moment it works.
   */
  function clearFilters(): void {
    onclear();
    field?.focus();
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
      announcement = `No configurations match. CLEAR FILTERS brings back all ${total}.`;
      return;
    }
    const count = `${showing} of ${total} configurations.`;
    announcement = sorted ? `Sorted by ${SORT_WORDS[sort]}. ${count}` : count;
  }

  /*
    The one place the region is fed. It watches the sort, the query and the tags
    - never `showing`, which is a consequence of them - and on the FIRST pass it
    only remembers, because a visitor who has just arrived has changed nothing
    and the hidden expansion has already told them where they are.
  */
  $effect(() => {
    const signature = `${sort}|${q}|${active.for.join(" ")}|${active.feels.join(" ")}`;
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
    // The house guard, in the form this component can state it: no effect runs
    // on the server, so there is never a timer to clear after a server render.
    if (voiceTimer === undefined) return;
    clearTimeout(voiceTimer);
    voiceTimer = undefined;
  });
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

  <!--
    TWO ROWS, FOR THEN FEELS, EACH ITS OWN LABELLED GROUP. The rows come from
    FACETS, so their order, their captions and their membership are one
    declaration in $lib/browse/facets rather than three things in this file that
    can drift apart. There is no third row and no disclosure beneath them.

    CLEAR FILTERS sits beside the rows rather than inside either: it is not a
    term, and a button announced as part of a group labelled FOR would be one
    more thing for a screen reader to sort out at the end of ten.
  -->
  {#each rows as row (row.facet.name)}
    <div class="band">
      <FacetRow
        name={row.facet.name}
        caption={row.facet.caption}
        terms={row.facet.terms}
        active={active[row.facet.name]}
        blocked={row.blocked}
        ontoggle={(term) => onfacet(row.facet.name, term)}
      />
    </div>
  {/each}

  {#if filtering}
    <div class="band clear-band">
      <button
        class="clear-filters"
        type="button"
        data-testid="browse-clear-filters"
        onclick={clearFilters}
      >
        CLEAR FILTERS
      </button>
    </div>
  {/if}

  <!--
    Two of the count's three elements. The visible line is seen and hidden from
    the accessibility tree; the expansion beside it is read and is ALWAYS in the
    DOM, whether or not anything has changed - it is the only thing that tells a
    visitor arriving on a shared, already-filtered address how much of the
    catalog they are looking at. It carries neither aria-live nor aria-hidden,
    and it is not inside an {#if}.
  -->
  <p class="count">
    <span data-testid="browse-count" aria-hidden="true"
      >{showing} of {total} configurations.</span
    >
    <span class="sr-only" data-testid="browse-count-expansion"
      >Showing {showing} of {total} configurations.</span
    >
  </p>

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
  /*
    Stacked bands, 16px apart - SEARCH, SORT, FOR, FEELS, and CLEAR FILTERS when
    there is a filter to clear. Every band is label-over-control at every width:
    Phase 5's rule that a word row always stacks, so its options get the full
    content width to wrap into. Sixteen chips in two labelled rows fit above the
    grid at every width, which is what makes A-20's "no disclosure" a fact about
    layout rather than a preference.
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

  /*
    CLEAR FILTERS is its own band beneath the two facet rows rather than a
    trailing item inside one, which is the approved sketch's shape now that
    there are two rows to trail: appended to FEELS it would read as a seventh
    FEELS chip. Nothing here scrolls sideways at any width - every row wraps,
    and overflow is never set on either axis.
  */
  .clear-band {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  /* Phase 4's secondary button: a bordered box, Micro label, accent on hover. */
  .clear-filters {
    display: grid;
    place-items: center;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-line);
    border-radius: 6px;
    background: transparent;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink);
    cursor: pointer;
    transition: border-color 140ms ease-out;
  }

  .clear-filters:hover {
    border-color: var(--color-accent);
  }

  /*
    Body, quiet, 16px above the chips. Quicksand and not monospaced: the count
    changes on a filter change rather than on a tick, so there is nothing to
    jitter and no fifth use of the mono stack to justify.
  */
  .count {
    margin: 16px 0 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  @media (prefers-reduced-motion: reduce) {
    .clear,
    .clear-filters,
    .word {
      transition: none;
    }
  }
</style>
