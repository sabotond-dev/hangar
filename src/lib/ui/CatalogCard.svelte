<!--
  The card: PDF page 2's six elements (plan 13-08).

  A square live preview, the name with a favorite star at the card's right
  edge, ONE category and ONE tag on an 11px uppercase line, one sentence, and
  a full-width outlined `Explore` action. Nothing else: Phase 10's FEATURED
  band, its three-tag row and its monospaced metadata block (id + engine +
  motion) are gone with the Bible. `featured` keeps its field and LOSES ITS
  MARK - it is a sort, not a badge, and the PDF draws none.

  THE WHOLE CARD IS THE LINK, AND THE `Explore` BUTTON IS INSIDE IT. The name
  anchor carries `::after { position: absolute; inset: 0 }` over a
  `position: relative` card, so a click anywhere on the card - the preview,
  the sentence, the Explore box - follows the link, while the accessibility
  tree contains ONE link and the tab order gains ONE stop for it. `Explore` is
  a <span aria-hidden="true"> styled as the PDF's outlined button: it is the
  visible affordance and it is not a second control, because a second anchor
  would put two entries in a screen reader's links list for one destination
  and a <button> inside a link is invalid markup. THE ONE ACCESSIBLE NAME IS
  THE ANCHOR's aria-label - the configuration's name (or `{name} — unavailable`)
  - and its description is the anchor's aria-describedby target. browse-ui
  .spec.ts test 8 counts exactly one anchor and holds the Explore element
  hidden; the whole-card link is stronger for a keyboard than a button inside
  it, which is why the link is the card and not the box (05.1-UI-SPEC W-06).

  THE STAR IS A REAL BUTTON WITH TWO ACCESSIBLE NAMES, both HANGAR's and both
  ledgered for 13-18: `Add {name} to your favorites` when the star is
  outlined, `Remove {name} from your favorites` when it is filled in the action
  colour. It writes through src/lib/store/favorites.ts from the page that owns
  the store; the card is handed `favorite` and reports `onfavorite`. It is a
  SIBLING of the anchor, not a child, so a click on it never follows the link,
  and it sits above the anchor's overlay (`z-index: 1`) so it can be clicked
  at all. IT ROVES WITH THE CARD: the star carries the same tabindex as the
  anchor, so the roving card exposes two stops - its link, then its star - and
  every other card exposes none. Tab crosses the wall in two presses instead
  of one, and the arrow keys still move by card (BrowseGrid.svelte).

  ONE CATEGORY AND ONE TAG, AND THE THIRD TAG IS NOT SHOWN - a decision, not
  an omission. Every entry carries exactly three terms (one FOR, two FEELS;
  src/lib/browse/facets.ts). The PDF's line is `MODULATION · FLOWING`: the
  FOR term through FOR_LABELS (src/lib/browse/labels.ts, provisional until
  13-18, the same record the rail and the chip row read) and the FIRST FEELS
  term as its identifier, both upper-cased by the micro role's CSS. tags[2]
  appears nowhere on the card; the second FEELS term is still a filter in the
  address and still on the entry.

  THE SENTENCE IS `description` (13-CONTEXT D-14 Q11c): the card has room for
  one, and `quiet` - the resting-black honesty line - moves to the workspace
  as helper text (13-09). listing.spec.ts still requires a quiet line for
  every entry whose motion is not self-evident; the requirement did not move.

  THE NAME IS RENDERED AS THE CATALOG DECLARES IT - uppercase until 13-19
  applies D-14 Q11b. The card does not case it.

  THE PAD WRAPPER IS aria-hidden. PadCanvas's `role="img"` and its
  "{name}, live pad simulation" label are right on the intro's hero, where the
  pad is the thing. Inside a named link they would announce the name a second
  time on every card, so the picture is decorative WITHIN a named link.

  A CARD IS A PICTURE, NOT AN INSTRUMENT (W-15). No pointer handler is
  installed anywhere in this file, so no touch reaches any card's engine: a
  pointerdown on a card is the beginning of a click that opens the workspace.
  The cursor is `pointer` and NEVER `crosshair` - the word appears in this
  sentence and in no declaration, which is why every structural scan over this
  file strips comments first.

  THE DESCRIPTION IS NEVER CLAMPED. No `text-overflow`, no line clamp and no
  ellipsis: a `…` on this site means "this is still happening", never "there
  is more".

  NO RADIUS ANYWHERE (D-01). The plate's 6px, the focus ring's 10px and the
  tag chips' 6px went with this rewrite and the allowlist row went with them.
  Every colour is one of the eleven tokens.

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
    /**
     * The grid has not finished building this card's engine yet. True only
     * between mount and the first frame of a Lua-sourced card, whose VM is a
     * ~271 KB WebAssembly fetch on first intersection (D-06). A card is NEVER an
     * unexplained black pad: it is painting, or it is spinning, or it reads
     * unavailable.
     */
    pending?: boolean;
    /**
     * The grid could not build an engine for this entry, or its lazy import
     * failed. Two causes, one state: the frame renders with no canvas and the
     * name reads "{name} — unavailable". THE LINK STAYS A LINK - the workspace
     * can still explain, and one broken entry never blanks the wall.
     */
    unavailable?: boolean;
    /** Whether the visitor has starred this entry (the page reads the store). */
    favorite?: boolean;
    /**
     * Hands the canvas to the grid's SimHost, with this entry's demonstration
     * gesture if it has one. The card is the one surface that mounts a dark
     * entry, so the lookup is here and the grid forwards what it is handed
     * (10-VALIDATION V-04).
     */
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

  /**
   * The star's two accessible names. HANGAR's, in the register (sentence
   * case, second person, the verb first), ledgered in 13-COPY-NEW.md for
   * 13-18. Two names rather than one name plus aria-pressed, because the
   * plan asked for the state to be in the words a screen reader hears.
   */
  const starName = $derived(
    favorite
      ? `Remove ${entry.name} from your favorites`
      : `Add ${entry.name} to your favorites`,
  );

  /** The PDF's line: the category through FOR_LABELS, the first FEELS term as itself. */
  const category = $derived(forLabel(entry.tags[0] ?? ""));
  const feel = $derived(entry.tags[1] ?? "");

  /**
   * PadCanvas's onready shape is unchanged - (id, canvas) - and this closure is
   * what adds the third argument on the way past.
   */
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
    <!--
      THE ONE LINK. Its aria-label is the card's one accessible name; the
      overlay pseudo-element makes the whole card its target. No `Enter` and
      no `Space` handler exists on it, here or in BrowseGrid: Enter follows a
      link natively and hijacking it is the fastest way to break middle-click
      and open-in-new-tab.
    -->
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

  <!--
    THE DISPLAY TRANSFORM, at its render site. Radar's sentence is vendored
    copy that may never be edited (05.1-UI-SPEC, Data corrections), so the
    card shows a typographic apostrophe while listing.ts and the route's meta
    tags stay byte-equal to the vendored bytes.
  -->
  <p class="description" id={descriptionId}>
    {typographic(entry.description)}
  </p>

  <!-- The visible affordance, decorative for assistive technology: the link above is the control. -->
  <span class="explore" aria-hidden="true"
    >{EXPLORE} <span class="arrow">{ARROW}</span></span
  >
</li>

<style>
  /*
    A flex column; the Explore box's `margin-block-start: auto` is what makes
    a row of cards line up: every card ends at the same line whatever the
    descriptions do. The card paints the workspace itself, as it has since
    13-04 removed the registration field.
  */
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

  /*
    PadFrame's root, reached through :global because the component exposes no
    hover prop and its `hero` flag is the wrong lever - hero also adds the
    bloom, and no card glows. Hover and focus lift the frame's boundary.
  */
  .card:hover .pad-wrap > :global(.pad),
  .card:has(.name:focus-visible) .pad-wrap > :global(.pad) {
    border-color: var(--color-boundary);
  }

  /*
    The waiting state, inside the aria-hidden wrapper so PadSpinner's own
    "Connecting" label never speaks on a card that is not connecting to
    anything. It is not shown for a merely offscreen card - an observer-paused
    pad keeps the last frame it painted.
  */
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

  /*
    The ring is drawn on the card rather than on the 44px plate inside it, so
    what a visitor sees matches the clickable area. No radius on it (D-01).
  */
  .name:focus-visible {
    outline: none;
  }

  .card:has(.name:focus-visible) {
    outline: 2px solid var(--color-action);
    outline-offset: 4px;
  }

  /*
    The star: a 44px box above the overlay so it can be pressed, borderless
    and unfilled at rest, the action colour when set. A square, no radius.
  */
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

  /*
    The PDF's full-width outlined `Explore ↗`. A rectangle at the site's
    44px floor beneath the PDF's 38; the boundary token at rest, the action
    colour on hover because the whole card is the target it belongs to.
  */
  .explore {
    display: grid;
    place-items: center;
    margin-block-start: auto;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    font-family: var(--font-sans);
    font-size: 16px;
    font-weight: 500;
    line-height: 1.2;
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
