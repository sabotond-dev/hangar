<!--
  The front door: the one composition both routes render.

  Wordmark, headline, row - and, on / but never on a deep link (D-12), the
  splash layer over the top of all three. Choosing and the panel arrive in plan
  04-08 and the deep-link route in 04-09.

  THE ROW IS MOUNTED AND TICKING WHETHER OR NOT THE SPLASH IS THERE. The splash
  is a layer over a live page, never a gate in front of a dead one: Coverflow is
  rendered before it and its onMount runs regardless of what is painted over it,
  so when the splash clears the machines really have been running for two
  seconds (W-10). Nothing here may make the row conditional on the splash.

  The wordmark is the page's only level-1 heading, and it is one deliberately:
  it is the site's name on its front page, it is what keeps e2e/smoke.e2e.ts
  green, and it gives a screen reader a document title instead of a stray
  uppercase string. It is not focusable.

  AMENDMENT (wave 9, D-19, W-01). The wordmark now shares a flex row with the
  header's right-hand slot, BrowseLink. The row carries the gutter the wordmark
  used to carry on its own, so nothing else moves: the headline's 48px top
  margin is measured from the row and is the same 48px, the section still
  carries no inline padding, and the splash, the choosing, the panel and every
  connect state are untouched. BrowseLink is given the same `covered` value the
  wordmark wears, so the two are absent from the first painted frame together
  and come up together across the dissolve on the same curve.

  AMENDMENT (Phase 6, plan 06-11). The row's right-hand end is now a CLUSTER of
  two children - BrowseLink first, then the device slot - so the row itself
  still has exactly two children, the wordmark and the cluster, and BrowseLink
  is not edited: its element, its label logic, its treatment, its testid and
  its place as the first tab stop and the first right-hand child in the DOM are
  Phase 5.1's, byte for byte. The device slot is the thing that yields
  (06-UI-SPEC, The collapse ladder): its multi-module tail collapses inside the
  slot itself below 1024px, and below 640px the header is TWO ROWS - the
  wordmark and BROWSE ALL on the first, the slot alone and right-aligned on the
  second. The second row is unconditional, not a state-dependent wrap: at 320px
  one row would wrap anyway, and WHAT it wrapped would change with the session
  state, moving the headline and the coverflow at the exact moment a visitor
  plugged something in. DOM order is unchanged by the layout, so the tab order
  (BROWSE ALL, then the slot, then the listbox) does not move with it.

  Both device children take `covered` from the wordmark's own value, so the slot
  and the note are absent from the very first painted frame and rise with the
  wordmark, and `panelOwnsProse` from the coverflow's "an entry is chosen" state
  - read from page.state exactly as Coverflow.svelte reads it (Y-11). Passing
  panelOwnsProse to only one of the two would let the note yield its prose while
  the disclosure still opened behind the panel, or the reverse - both Y-11
  violations - so the ONE expression feeds both.

  AMENDMENT (Phase 6, plan 06-11 task 2). The note sits beneath the row, inside
  the header block. The headline's 48px top margin is now measured from the
  bottom of that block - which includes the note - so the coverflow keeps its
  existing distance from the last thing above it, and the margin value does not
  change with the session state because the note holds its height in every one.

  The section carries no inline padding. The gutter belongs to the header block
  and the headline; the coverflow row is full-bleed on purpose, because pads
  falling off the edges of the viewport is the picture the brief asks for.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { page } from "$app/state";
  import { untrack } from "svelte";
  import type { FrontDoorEntry } from "$lib/catalog/front-door";
  import BrowseLink from "./BrowseLink.svelte";
  import Coverflow from "./Coverflow.svelte";
  import DeviceNote from "./DeviceNote.svelte";
  import DeviceSlot from "./DeviceSlot.svelte";
  import Splash from "./Splash.svelte";

  let {
    row,
    initialId,
    notice,
    splash = false,
  }: {
    /**
     * The ring, forwarded verbatim to Coverflow and read by nothing here.
     * Left undefined by /, which is what makes Coverflow fall to its own
     * FRONT_DOOR default; /c/{id}/ passes a ONE-ENTRY row for an off-row
     * configuration (D-07, plan 05.1-05) and FRONT_DOOR for a row entry, so a
     * signed-off route is byte-for-byte what Phase 4 shipped.
     */
    row?: readonly FrontDoorEntry[];
    /** Centre this entry on arrival. Plan 04-09's deep-link route passes it. */
    initialId?: string;
    /**
     * Stands in for the fidelity line for a few seconds. The deep-link route
     * passes it when the address names nothing in the row, so an unknown link
     * lands on the shelf with an explanation rather than on a dead end.
     */
    notice?: string;
    /** Play the opening. / does; a deep link never does (D-12). */
    splash?: boolean;
  } = $props();

  /**
   * Whether the opening plays, read ONCE. untrack is not decoration: Svelte
   * warns that a prop read at component-init scope captures only its initial
   * value, and capturing only the initial value is exactly right here - a later
   * change to the prop must never re-open a splash over a page the visitor is
   * already using.
   */
  const opensWithSplash = (): boolean => splash;

  /** The splash layer, until it has finished and taken itself off the page. */
  let opening = $state(untrack(opensWithSplash));
  /**
   * True while the splash still covers the row. The header wordmark holds at
   * opacity 0 through it and comes up to 1 across the dissolve, so it reaches
   * full strength at the moment the flying mark lands on it.
   */
  let covered = $state(untrack(opensWithSplash));

  /**
   * The chosen panel is open and owns the session's prose (Y-11). The same
   * source Coverflow.svelte reads for its own `chosen`, so the header and the
   * row cannot disagree about whether a panel is up. `{}` during prerender.
   */
  const panelOwnsProse = $derived(page.state.chosen === true);
</script>

<section class="front-door" data-testid="front-door" data-splash={splash}>
  <div class="header-block">
    <div class="header">
      <h1 class="wordmark" class:covered>
        <span data-testid="header-wordmark">HANGAR</span>
      </h1>
      <div class="cluster">
        <BrowseLink {covered} />
        <div class="slot">
          <DeviceSlot {covered} {panelOwnsProse} />
        </div>
      </div>
    </div>
    <DeviceNote {covered} {panelOwnsProse} />
  </div>
  <p class="headline">You’ve got to start somewhere…</p>
  <div class="row"><Coverflow {row} {initialId} {notice} /></div>
</section>

{#if opening}
  <Splash
    ondissolve={() => (covered = false)}
    onfinished={() => (opening = false)}
  />
{/if}

<style>
  .front-door {
    /* The 700ms dissolve, or the 200ms crossfade under reduced motion. */
    --arrive-ms: 700ms;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    min-block-size: 100svh;
    padding-block: 32px;
  }

  /*
    The header block: the row, and the note beneath it. The gutter that used to
    sit on the wordmark sits here, so the wordmark's left edge and the
    headline's left edge are still the same 32px from the viewport - nothing
    moved sideways - and the note's right edge (it is margin-inline-start: auto)
    lands on the same padding edge as the slot's right edge.
  */
  .header-block,
  .headline {
    padding-inline: 32px;
  }

  /*
    The header row. min-block-size is the 44px touch floor for the two controls
    on the right; the wordmark is 12px of Micro and would otherwise set the
    row's height at about 14px. Exactly two children: the wordmark and the
    cluster.
  */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-block-size: 44px;
  }

  /* The right-hand cluster: BROWSE ALL, 24px, then the device slot. */
  .cluster {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  /*
    The slot's own cell in the cluster. It exists so the phone layout below can
    place the slot on its own row without reaching into DeviceSlot's markup;
    at every width it is just the box the slot sits in.
  */
  .slot {
    display: flex;
  }

  /* Micro role: 12px / 600 / 0.18em / uppercase. */
  .wordmark {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-accent);
    transition: opacity var(--arrive-ms) cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  /*
    Held at nothing while the splash owns the screen, and NOT transitioned into
    that state - the header must be invisible on the very first painted frame
    rather than fade out of one.
  */
  .wordmark.covered {
    opacity: 0;
    transition: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .front-door {
      --arrive-ms: 200ms;
    }
  }

  /* Body role, quiet by colour rather than by size. */
  .headline {
    margin: 48px 0 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    text-align: center;
    color: var(--color-ink-quiet);
  }

  .row {
    margin-block-start: 32px;
  }

  @media (max-width: 639px) {
    .front-door {
      padding-block: 24px;
    }

    .header-block,
    .headline {
      padding-inline: 24px;
    }

    /*
      TWO ROWS, ALWAYS (06-UI-SPEC Y-04). The row becomes a two-column grid:
      the wordmark and BROWSE ALL on the first row, the device slot alone on
      the second, right-aligned. The cluster dissolves into the grid
      (display: contents) so its two children place themselves - BROWSE ALL
      falls into the one free cell of the first row by auto-placement, and the
      slot is placed explicitly across the second. The DOM is untouched, so
      the tab order is untouched. Each row keeps the 44px floor.
    */
    .header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-auto-rows: minmax(44px, auto);
      align-items: center;
    }

    .cluster {
      display: contents;
    }

    .wordmark {
      grid-area: 1 / 1;
    }

    .slot {
      grid-area: 2 / 1 / 3 / 3;
      justify-self: end;
    }
  }
</style>
