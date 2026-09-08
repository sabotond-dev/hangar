<!--
  One captioned facet row. Two modes, one component.

  A-19 and A-22. The browse toolbar renders two of these - FOR then FEELS - as
  CHECKBOX groups, and the front door renders one of them, FOR, as a LINK row.
  They are the same row because they are the same claim: these are the doors
  into the catalog, and there are sixteen of them.

  THE MODE IS NOT A STYLE, IT IS A SEMANTIC. On /browse/ a member is a filter
  the visitor toggles against a grid that is already on the screen, so it is a
  real <input type="checkbox"> in a <label> - Space toggles it, removing an
  active one is pressing it again, and disabled is a real attribute
  (TagChip.svelte carries all of that and this file does not restate it). On /
  there is no grid to filter: pressing a term takes you somewhere. So it is an
  <a>, and the anchor is what keeps the front door PRERENDERED, keeps its
  <head> intact and keeps the page import-free - a checkbox there would need
  state, a handler and a navigation, and would put a control on a ceremonial
  page that does nothing until it is pressed twice.

  THE CAPTION IS A REAL LABEL FOR A REAL GROUP. role="group" with its own
  aria-labelledby, so a screen reader says "FOR, group" before the first term
  rather than reading sixteen words in a row with no idea which facet they came
  from. The two rows carry different ids, derived from the facet's name, because
  one page renders both and two elements may not share an id.

  THE 44px FLOOR IS ON BOTH AXES, per member, in both modes. Phase 4's touch
  contract is about the size of the thing under a finger, and a link reading
  `keys` is four characters wide - browse-ui.spec.ts checks the block AND the
  inline axis by selector, which is the derivation device-ui.spec.ts uses, so
  dropping one of them names the class.

  NO ADJACENT REASON LINE beside a disabled member (05.1-UI-SPEC, The tag
  chips). The cause of a dead chip is the active chips two centimetres away and
  the count line beneath them; a sentence per chip would be sixteen sentences.

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
    active = [],
    blocked = [],
    ontoggle,
    href,
  }: {
    /** The facet's own name, `for` or `feels`. Drives the ids and the testid. */
    name: string;
    /** Micro role, uppercase ALREADY - never uppercased at render time. */
    caption: string;
    /** The facet's members, in the facet's declared order. */
    terms: readonly string[];
    /** The active members. Empty, and irrelevant, in link mode. */
    active?: readonly string[];
    /** The members that would return nothing. Empty in link mode. */
    blocked?: readonly string[];
    /** Checkbox mode. Given exactly when this row is a filter. */
    ontoggle?: (term: string) => void;
    /**
     * Link mode. Given exactly when this row is a set of destinations.
     *
     * It returns a ResolvedPathname rather than a string so that
     * svelte/no-navigation-without-resolve is satisfied by the TYPE at the
     * anchor below, with no suppression and no cast - the same route
     * BrowseLink.svelte takes. The caller composes the address, which is what
     * keeps the one `/browse/?for=` literal on the page that means it.
     */
    href?: (term: string) => ResolvedPathname;
  } = $props();

  /*
    $derived rather than a const: `name` is a prop, and a const would capture
    only its initial value. One page renders both rows, so the two ids must
    differ - and an id that went stale would point a group's aria-labelledby at
    the other facet's caption.
  */
  const captionId = $derived(`facet-${name}-caption`);
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
          <span class="text">{term}</span>
        </a>
      {/each}
    {:else}
      {#each terms as term (term)}
        <TagChip
          tag={term}
          active={active.includes(term)}
          disabled={blocked.includes(term)}
          ontoggle={ontoggle ?? (() => {})}
        />
      {/each}
    {/if}
  </div>
</div>

<style>
  /* Micro: 12px / 600 / 1.2 / 0.18em, uppercase, quiet. 4px above its row. */
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

  /*
    The row wraps and never scrolls, at any width, on either axis. Sixteen
    members in two labelled rows fit above the grid everywhere, which is what
    makes a disclosure unnecessary rather than merely unbuilt.
  */
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
  }

  /*
    The link member is TagChip's geometry without its checkbox: the same 44px
    box on both axes, the same 12px inline padding (Phase 5 exception 3, a
    horizontal internal metric of one control), the same border and radius.
  */
  .link {
    position: relative;
    display: grid;
    place-items: center;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 12px;
    border: 1px solid var(--color-line);
    border-radius: 6px;
    background: transparent;
    text-decoration: none;
    cursor: pointer;
    transition:
      border-color 140ms ease-out,
      background-color 140ms ease-out;
  }

  /* Phase 4's ring, on the anchor itself. Nothing here focuses without one. */
  .link:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 4px;
  }

  /* Micro (title): 12px / 600 / 1.2 / 0.01em, sentence case, verbatim. */
  .text {
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.01em;
    color: var(--color-ink-quiet);
    transition: color 140ms ease-out;
  }

  .link:hover {
    border-color: var(--color-accent);
  }

  .link:hover .text {
    color: var(--color-ink);
  }

  @media (prefers-reduced-motion: reduce) {
    .link,
    .text {
      transition: none;
    }
  }
</style>
