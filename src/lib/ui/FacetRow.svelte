<!--
  One captioned facet row. Two modes, one component.

  The gallery renders ONE of these since plan 13-08 - the FOR facet as the
  PDF's `Use` row, a CHECKBOX group - and the front door renders the same
  facet as a LINK row until 13-09 retires that page. They are the same row
  because they are the same claim: these are the doors into the catalog.

  THE FEELS ROW IS GONE (13-CONTEXT D-11; the PDF has no Character filter).
  The six FEELS terms survive as card metadata - CatalogCard.svelte's
  `MODULATION · FLOWING` line - which is where the PDF puts them. This
  component did not lose a mode for it; the toolbar simply mounts it once,
  and browse-ui.spec.ts test 7 counts that.

  THE MODE IS NOT A STYLE, IT IS A SEMANTIC. On the gallery a member is a
  filter the visitor toggles against a grid that is already on the screen, so
  it is a real <input type="checkbox"> in a <label> - Space toggles it,
  removing an active one is pressing it again, and disabled is a real
  attribute (TagChip.svelte carries all of that and this file does not restate
  it). On the front door there is no grid to filter: pressing a term takes you
  somewhere. So it is an <a>, and the anchor is what keeps that page
  prerendered and import-free.

  THE `All` CHIP IS A BUTTON, NOT A CHECKBOX, AND THE DISTINCTION IS HONEST.
  The PDF's chip row opens with `All`, active, before the facet's members.
  "All" is not a term a configuration carries; it is the state in which no
  member is active, and pressing it CLEARS the row. A checkbox that can only
  ever be checked would lie about what Space does to it, so it is a real
  <button aria-pressed> that reports whether the row is clear, wears the same
  rectangle, and lives inside the same labelled group so a screen reader hears
  it as the row's first member. Given only in checkbox mode, through the `all`
  prop; the front door's link row has no such state to clear.

  THE LABELS ARE DISPLAY STRINGS, THE TERMS ARE IDENTIFIERS. `terms` keys the
  toggle and the test ids; `labels` (src/lib/browse/labels.ts's FOR_LABELS,
  provisional until 13-18) is what the visitor reads. The rail and this row
  read the same record, so a chip and its rail row can never carry two
  unrelated strings. Whether one facet may carry a deliberately SHORTER chip
  label than its rail label - the PDF's `Notes` against `Notes & chords` - is
  13-18's question, ledgered by 13-08; today the two are one string.

  THE CAPTION IS A REAL LABEL FOR A REAL GROUP. role="group" with its own
  aria-labelledby, so a screen reader says "Use, group" before the first term
  rather than reading seven words in a row with no idea what they are. The
  caption is the PDF's word as given - `Use`, sentence case, quiet, ~14px -
  and is never re-cased here. The index-and-dash furniture Phase 10's A-42
  put beside it (`01 — FOR`) went with the Bible: the PDF's row has no
  ordinal, and instrument.spec.ts scan 5 now holds the form ABSENT.

  THE ROW WRAPS RATHER THAN TRUNCATING, at every width, on either axis. A
  truncated facet row hides configurations from the visitor, and section 6
  requires the actual matching count and a way to clear each filter; seven
  chips wrap to a second line on a narrow centre and that is correct.

  THE 44px FLOOR IS ON BOTH AXES, per member, in both modes. Phase 4's touch
  contract is about the size of the thing under a finger, and a link reading
  `play` is four characters wide - browse-ui.spec.ts checks the block AND the
  inline axis by selector, so dropping one of them names the class.

  NO NUMBER IS PRINTED BESIDE A TERM - not a carrier count, not a rank, nothing
  a visitor could read as popularity (CAT-02, W-04). The disabled state is what
  makes the number unnecessary.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { ResolvedPathname } from "$app/types";
  import TagChip from "./TagChip.svelte";

  let {
    name,
    caption,
    terms,
    labels = {},
    active = [],
    blocked = [],
    ontoggle,
    all,
    href,
  }: {
    /** The facet's own name, `for` or `feels`. Drives the ids and the testid. */
    name: string;
    /** The caption as it should read - never re-cased at render time. */
    caption: string;
    /** The facet's members (machine terms), in the facet's declared order. */
    terms: readonly string[];
    /** Display label per term. A term with no row is shown as itself. */
    labels?: Readonly<Record<string, string | undefined>>;
    /** The active members. Empty, and irrelevant, in link mode. */
    active?: readonly string[];
    /** The members that would return nothing. Empty in link mode. */
    blocked?: readonly string[];
    /** Checkbox mode. Given exactly when this row is a filter. */
    ontoggle?: (term: string) => void;
    /**
     * The leading `All` control, checkbox mode only: its label and what
     * pressing it does (clear this facet's active set).
     */
    all?: { readonly label: string; readonly onclear: () => void };
    /**
     * Link mode. Given exactly when this row is a set of destinations.
     *
     * It returns a ResolvedPathname rather than a string so that
     * svelte/no-navigation-without-resolve is satisfied by the TYPE at the
     * anchor below, with no suppression and no cast - the same route
     * BrowseLink.svelte takes. The caller composes the address.
     */
    href?: (term: string) => ResolvedPathname;
  } = $props();

  /*
    $derived rather than a const: `name` is a prop, and a const would capture
    only its initial value. The id is derived from the facet's name so two
    rows on one page could never share one caption.
  */
  const captionId = $derived(`facet-${name}-caption`);

  const labelOf = (term: string): string => labels[term] ?? term;
</script>

<div class="facet">
  <span class="caption" id={captionId}>{caption}</span>

  <div
    class="chips"
    data-testid="facet-{name}"
    role="group"
    aria-labelledby={captionId}
  >
    {#if href !== undefined}
      {#each terms as term (term)}
        <a class="link" href={href(term)} data-testid="tag-{term}">
          <span class="text">{labelOf(term)}</span>
        </a>
      {/each}
    {:else}
      {#if all !== undefined}
        <button
          class="all"
          class:active={active.length === 0}
          type="button"
          aria-pressed={active.length === 0}
          data-testid="tag-all"
          onclick={() => all.onclear()}
        >
          <span class="text">{all.label}</span>
        </button>
      {/if}
      {#each terms as term (term)}
        <TagChip
          tag={term}
          label={labelOf(term)}
          active={active.includes(term)}
          disabled={blocked.includes(term)}
          ontoggle={ontoggle ?? (() => {})}
        />
      {/each}
    {/if}
  </div>
</div>

<style>
  /* The caption sits at the row's left, on the chips' centre line: the PDF's `Use`. */
  .facet {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  /* The PDF's word: ~14px, quiet, as given. */
  .caption {
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.2;
    color: var(--color-ink-quiet);
  }

  /*
    The row wraps and never scrolls, at any width, on either axis. Seven
    chips wrap to a second line on a narrow centre rather than being cut to
    four, because a hidden chip is a hidden set of configurations.
  */
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  /*
    The link member and the All button are TagChip's geometry without its
    checkbox: the same 44px box on both axes, the same 16px inline padding,
    the same 1px boundary. A rectangle - no radius anywhere (D-01).
  */
  .link,
  .all {
    position: relative;
    display: grid;
    place-items: center;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    background: transparent;
    font-family: var(--font-sans);
    text-decoration: none;
    cursor: pointer;
    transition:
      border-color 140ms ease-out,
      color 140ms ease-out;
  }

  /* The focus ring, on the anchor and on the button. Nothing here focuses without one. */
  .link:focus-visible,
  .all:focus-visible {
    outline: 2px solid var(--color-action);
    outline-offset: 4px;
  }

  .text {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
    color: var(--color-ink);
    transition: color 140ms ease-out;
  }

  .link:hover,
  .all:hover {
    border-color: var(--color-ink);
  }

  /* The PDF's active `All`: the action colour on the outline and on the word. */
  .all.active,
  .all.active:hover {
    border-color: var(--color-action);
  }

  .all.active .text {
    color: var(--color-action);
  }

  @media (prefers-reduced-motion: reduce) {
    .link,
    .all,
    .text {
      transition: none;
    }
  }
</style>
