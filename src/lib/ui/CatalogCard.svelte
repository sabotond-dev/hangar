<!--
  The card: PDF page 2's six elements - a square live preview, the name with a
  favorite star at the right edge, ONE category and ONE tag (tags[2] is never
  shown), one sentence (description, never clamped), a full-width filled Explore
  box. Props: entry, tabbable, pending, unavailable, favorite, onready, onfocus,
  onfavorite. THE WHOLE CARD IS THE LINK: the name anchor's ::after overlay covers
  the card, Explore is an aria-hidden span, so the tree holds one link and one
  stop (browse-ui.spec.ts counts one anchor). The star is a sibling above the
  overlay with two accessible names, roving with the card. A card is a picture,
  not an instrument (W-15): no pointer handler. The pad wrapper is aria-hidden. No radius (D-01).
  Decided at 13-08 / 13.1-01 (13.1-CONTEXT D-02); see .planning/phases/13.1-bench-corrections-four/13.1-01-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { resolve } from "$app/paths";
  import { forLabel } from "$lib/browse/labels";
  import { typographic } from "$lib/browse/typographic";
  import type { ListingEntry } from "$lib/catalog/listing";
  import { type DemoPath, demoPathFor } from "$lib/sim/demo";
  import PadCanvas from "./PadCanvas.svelte";
  import PadFrame from "./PadFrame.svelte";
  import PadSpinner from "./PadSpinner.svelte";

  let {
    entry,
    tabbable,
    pending = false,
    unavailable = false,
    favorite = false,
    onready,
    onfocus,
    onfavorite,
  }: {
    entry: ListingEntry;
    /** True for exactly one card in the grid: the roving one. */
    tabbable: boolean;
    /** The grid has not built this card's engine yet: between mount and the first frame of a Lua card (the VM is a ~271 KB fetch, D-06). Never an unexplained black pad. */
    pending?: boolean;
    /** No engine could be built, or the lazy import failed: no canvas, the name reads "{name} — unavailable", and the link stays a link. */
    unavailable?: boolean;
    /** Whether the visitor has starred this entry (the page reads the store). */
    favorite?: boolean;
    /** Hands the canvas to the grid's SimHost with this entry's demonstration gesture, if any; the card is the one surface that mounts a dark entry (10-VALIDATION V-04). */
    onready: (id: string, el: HTMLCanvasElement, demo?: DemoPath) => void;
    /** The card took focus (its link or its star); the grid moves its roving index here. */
    onfocus: () => void;
    /** The star was pressed. The page flips the store and hands `favorite` back. */
    onfavorite?: (id: string) => void;
  } = $props();

  /* The PDF's verbatim action word, and the arrow it draws beside it. */
  const EXPLORE = "Explore";
  const ARROW = "↗";

  /** The copy contract's broken-entry name, with a real em dash (U+2014). */
  const label = $derived(
    unavailable ? `${entry.name} — unavailable` : entry.name,
  );

  /** The link's describedby target. One id per card, from the catalog id. */
  const descriptionId = $derived(`card-description-${entry.id}`);

  /** The star's two accessible names (HANGAR's register, 13-COPY-NEW.md): the state is in the words, not in aria-pressed. */
  const starName = $derived(
    favorite
      ? `Remove ${entry.name} from your favorites`
      : `Add ${entry.name} to your favorites`,
  );

  /** The PDF's line: the category through FOR_LABELS, the first FEELS term as itself. */
  const category = $derived(forLabel(entry.tags[0] ?? ""));
  const feel = $derived(entry.tags[1] ?? "");

  /** PadCanvas's onready is (id, canvas); this closure adds the gesture on the way past. */
  const handleReady = (id: string, el: HTMLCanvasElement): void => {
    onready(id, el, demoPathFor(id));
  };
</script>

<li class="card" data-testid="card-{entry.id}">
  <div class="pad-wrap" aria-hidden="true">
    <PadFrame {entry}>
      {#if !unavailable}
        <PadCanvas {entry} onready={handleReady} />
      {/if}
      {#if pending}
        <div class="pending"><PadSpinner /></div>
      {/if}
    </PadFrame>
  </div>

  <div class="head">
    <!-- THE ONE LINK: its aria-label is the card's accessible name, its overlay the whole card. No Enter or Space handler, here or in BrowseGrid - Enter follows a link natively. -->
    <a
      class="name"
      class:unavailable
      href={resolve("/playground/[id]", { id: entry.id })}
      data-testid="card-name-{entry.id}"
      tabindex={tabbable ? 0 : -1}
      aria-label={label}
      aria-describedby={descriptionId}
      {onfocus}>{label}</a
    >
    <button
      class="star"
      class:on={favorite}
      type="button"
      data-testid="card-favorite-{entry.id}"
      data-favorite={favorite ? "true" : "false"}
      tabindex={tabbable ? 0 : -1}
      aria-label={starName}
      onclick={() => onfavorite?.(entry.id)}
      {onfocus}>{favorite ? "★" : "☆"}</button
    >
  </div>

  <p class="line type-micro">
    <span class="term">{category}</span>
    <span class="dot" aria-hidden="true">·</span>
    <span class="term">{feel}</span>
  </p>

  <!-- The display transform at its render site: Radar's vendored sentence may not be edited, so the card shows the typographic apostrophe while listing.ts stays byte-equal. -->
  <p class="description" id={descriptionId}>
    {typographic(entry.description)}
  </p>

  <!-- The visible affordance, decorative for assistive technology: the link above is the control. -->
  <span class="explore" aria-hidden="true"
    >{EXPLORE} <span class="arrow">{ARROW}</span></span
  >
</li>

<style>
  /* A flex column; the Explore box's margin-block-start: auto lines a row of cards up at one bottom edge. */
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
    list-style: none;
    cursor: pointer;
    background-color: var(--color-workspace);
  }

  /* The preview is square and as wide as the card: the PDF's 390 x 390. */
  .pad-wrap {
    aspect-ratio: 1;
    inline-size: 100%;
    margin-block-end: 8px;
  }

  /* PadFrame's root through :global (no hover prop, and `hero` would add the bloom): hover and focus lift the boundary. */
  .card:hover .pad-wrap > :global(.pad),
  .card:has(.name:focus-visible) .pad-wrap > :global(.pad) {
    border-color: var(--color-boundary);
  }

  /* The waiting state, inside the aria-hidden wrapper so PadSpinner's label never speaks; not shown for a merely offscreen card. */
  .pending {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    pointer-events: none;
  }

  /* The name at the left, the star at the right edge, on one line. */
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  /* The PDF's ~24px name in the display face. The catalog's own case, uncased here. */
  .name {
    display: inline-flex;
    align-items: center;
    min-block-size: 44px;
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 700;
    line-height: 1.1;
    text-decoration: none;
    color: var(--color-ink);
  }

  /* The overlay. One link, one tab stop, and the whole card is clickable. */
  .name::after {
    content: "";
    position: absolute;
    inset: 0;
  }

  .name.unavailable {
    color: var(--color-ink-quiet);
  }

  /* The ring on the card, not the plate, so what is seen matches the clickable area. No radius (D-01). */
  .name:focus-visible {
    outline: none;
  }

  .card:has(.name:focus-visible) {
    outline: 2px solid var(--color-action);
    outline-offset: 4px;
  }

  /* The star: a 44px box above the overlay, unfilled at rest, the action colour when set. Square. */
  .star {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding: 0;
    border: 0;
    border-radius: 0;
    appearance: none;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 20px;
    line-height: 1;
    color: var(--color-ink-quiet);
    cursor: pointer;
    transition: color 140ms ease-out;
  }

  .star:hover {
    color: var(--color-ink);
  }

  .star.on,
  .star.on:hover {
    color: var(--color-action);
  }

  .star:focus-visible {
    outline: 2px solid var(--color-action);
    outline-offset: 2px;
  }

  /* MODULATION · FLOWING: the micro role (11px, tracked, uppercase), quiet. */
  .line {
    display: flex;
    flex-wrap: wrap;
    gap: 0 6px;
    margin: 0;
    color: var(--color-ink-quiet);
  }

  /* The PDF's ~14px sentence, quiet. Never clamped. */
  .description {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  /* The PDF's filled Explore box, measured at its 1500 render (13.1-01, D-02): the panel fill and the divider hairline the page draws, the display face, one row that never wraps, the 44px floor beneath the PDF's 40. */
  .explore {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-block-start: auto;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-divider);
    background: var(--color-panel);
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1.2;
    white-space: nowrap;
    color: var(--color-ink);
    transition: border-color 140ms ease-out;
  }

  .card:hover .explore {
    border-color: var(--color-action);
  }

  .arrow {
    color: var(--color-action);
  }

  @media (prefers-reduced-motion: reduce) {
    .star,
    .explore {
      transition: none;
    }
  }
</style>
