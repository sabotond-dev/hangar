<!--
  One captioned facet row, two modes: a CHECKBOX group on the gallery (the FOR
  facet as the PDF's Use row, mounted once - the FEELS row is gone, D-11) and a
  LINK row where a term is a destination. Props: name, caption (never re-cased),
  terms (identifiers), labels (FOR_LABELS, the same record the rail reads), active,
  blocked, ontoggle (checkbox mode), all (the leading All control, a real
  <button aria-pressed> that clears the row - not a checkbox that could only ever
  be checked), href (link mode, a ResolvedPathname). role="group" labelled by the
  caption. The row wraps, never scrolls; 44px on both axes per member in both modes
  (browse-ui.spec.ts checks both by selector). No number beside a term (W-04).
  Decided at 13-08 (13-CONTEXT D-11); see .planning/phases/13-gui-overhaul/13-08-SUMMARY.md

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
    /** The leading All control, checkbox mode only: its label and the clear it performs. */
    all?: { readonly label: string; readonly onclear: () => void };
    /** Link mode: a ResolvedPathname, so svelte/no-navigation-without-resolve is satisfied by the type at the anchor. */
    href?: (term: string) => ResolvedPathname;
  } = $props();

  // $derived, not a const: `name` is a prop; the id carries the facet's name so two rows never share a caption.
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

  /* The row wraps and never scrolls: a chip cut off is a hidden set of configurations. */
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  /* The link member and the All button: TagChip's geometry without its checkbox - 44px both axes, 16px inline padding, a 1px boundary. No radius (D-01). */
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
