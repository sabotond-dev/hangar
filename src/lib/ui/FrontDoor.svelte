<!--
  The front door: the composition /playground/{id}/ renders until 13-09.

  Wordmark, headline, row. Choosing and the panel arrived in plan 04-08 and
  the deep-link route in 04-09.

  THE SPLASH WENT AT 13-07 (13-CONTEXT.md D-09, 2026-09-11). / is PDF page 1
  now - src/routes/+page.svelte and src/lib/ui/intro/ - and no longer renders
  this component, so the opening this file played on / and never on a deep
  link (D-12) has no route left to play on. The `splash` prop, the `opening`
  and `covered` state, the speech hold and the Splash layer left with it;
  Splash.svelte and glyph-field.ts were deleted in the same commit. The
  header wordmark is at full strength from the first frame and the three
  header children take `covered`'s default of false. This component and the
  coverflow it mounts go at 13-09 (13-VALIDATION D-5), when /playground/{id}/ becomes
  the workspace.

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

  THE SPLASH HOLD (Phase 6, plan 06-11 task 3) LEFT WITH THE SPLASH (13-07).
  session.holdSpeech() held the live region while the opening covered the
  row; with no opening there is nothing to talk over, and this component no
  longer holds anything. The method survives on the session store with its
  own spec until a caller wants it again.

  The section carries no inline padding. The gutter belongs to the header block
  and the headline; the coverflow row is full-bleed on purpose, because pads
  falling off the edges of the viewport is the picture the brief asks for.

  THE CRT SHELL THAT LIVED HERE WENT AT 13-04 (13-CONTEXT.md D-09, 2026-09-11).
  Plan 10-04 gave `.row` a second child sized to Coverflow's `.band` and
  carrying the roll bar and the 180 ms tear on the connect event.
  The Bible's §3 asks for solid surfaces inside the working application and its
  own intro is flat, so the shell, its two layers, its keyframes, its SCREEN
  rule and its reduced-motion block were deleted with the rest of the CRT.
  `.row` keeps `position: relative` because the coverflow's geometry was
  measured against it. This component and the coverflow it mounts are the
  composition half of D-09 and go at 13-07 and 13-09 (13-VALIDATION D-5).

  AMENDMENT (Phase 10, plan 10-07, A-22 and 10-UI-SPEC 9.1). THE `FOR` LINK
  ROW. The ten workflow terms render here as LINKS, one `/playground/?for={term}`
  each, so the front door becomes the entry to browse instead of its rival. A
  link rather than a checkbox is what keeps this page PRERENDERED, keeps its
  `<head>` intact and keeps it import-free: FacetRow.svelte in link mode needs
  no state, no handler and no navigation, and `$lib/browse/facets` declares no
  import at all, so naming it costs this page nothing at first paint.

  AND IT SITS BELOW THE COVERFLOW BLOCK RATHER THAN INSIDE IT, WHICH IS A
  DEPARTURE FROM THE SPEC'S ORDER AND IS FORCED. 10-UI-SPEC 9.1 puts the row
  between the name plate and the fidelity line. Both of those are rendered by
  Coverflow.svelte - `.plate` and `.fidelity` are ITS top-level fragments, not
  this file's - and Coverflow.svelte may not be edited in this phase, so there
  is no seam between them to insert into without breaking a promise that is
  worth more than the ordering. The row therefore follows the fidelity line, at
  the same 32px rhythm, and the departure is recorded in 10-07-SUMMARY.md rather
  than smoothed over. The ring stays at EIGHT and front-door.ts is untouched.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { FOR_TERMS } from "$lib/browse/facets";
  import type { FrontDoorEntry } from "$lib/catalog/front-door";
  import BrowseLink from "./BrowseLink.svelte";
  import Coverflow from "./Coverflow.svelte";
  import FacetRow from "./FacetRow.svelte";
  import DeviceNote from "./DeviceNote.svelte";
  import DeviceSlot from "./DeviceSlot.svelte";

  let {
    row,
    initialId,
    notice,
  }: {
    /**
     * The ring, forwarded verbatim to Coverflow and read by nothing here.
     * Left undefined by /, which is what makes Coverflow fall to its own
     * FRONT_DOOR default; /playground/{id}/ passes a ONE-ENTRY row for an off-row
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
  } = $props();

  /**
   * The chosen panel is open and owns the session's prose (Y-11). The same
   * source Coverflow.svelte reads for its own `chosen`, so the header and the
   * row cannot disagree about whether a panel is up. `{}` during prerender.
   */
  const panelOwnsProse = $derived(page.state.chosen === true);
</script>

<section class="front-door" data-testid="front-door">
  <div class="header-block">
    <div class="header">
      <h1 class="wordmark">
        <span data-testid="header-wordmark">HANGAR</span>
      </h1>
      <div class="cluster">
        <BrowseLink />
        <div class="slot">
          <DeviceSlot {panelOwnsProse} />
        </div>
      </div>
    </div>
    <DeviceNote {panelOwnsProse} />
  </div>
  <!--
    R-01. Phase 4's `You’ve got to start somewhere…` is retired: it was an
    apology for a shelf that needs none, and the pixels beside it - thirty-six
    pads, every one of them already animating - say the same thing better.

    THERE IS NO CASE EXCEPTION HERE ANY MORE, AND THIS PARAGRAPH REPLACES THE
    ONE THAT ARGUED FOR IT (A-43, D-18). The headline was
    `PICK ONE · IT IS ALREADY RUNNING`, 32 characters and six words, and the
    comment in this place defended the uppercase on the grounds that it was the
    only uppercase string on the site longer than two words, that it earned the
    case by not being a sentence, and that nothing else might cite it as a
    precedent. `START EXPLORING` is FIFTEEN characters and TWO WORDS, counted by
    script, so it is inside 5.2's rule rather than outside it: uppercase is
    reserved for the wordmark, button labels and captions of at most two words,
    and this is a headline set in the Micro role that now satisfies the same
    count. The exception is retired in 5.2, 13.0 and 13.1 as well, and this is
    the only place the old argument could have survived as a comment defending
    something the contract no longer has.

    THE MIDDLE DOT GOES WITH IT, AND IT DOES NOT LEAVE THE SITE. 13's separator
    inventory loses this use, and U+00B7 is still rendered in two components -
    DeviceSlot.svelte's three, between the module name, the firmware and the
    page, and MixTwo.svelte's one, joining a result's settings. Four rendered
    uses where there were five; it is not a retirement of the character.
  -->
  <p class="headline">START EXPLORING</p>
  <div class="row">
    <Coverflow {row} {initialId} {notice} />
  </div>

  <!--
    THE `FOR` ROW (A-22). Ten destinations, not ten controls: pressing one takes
    you to /playground/ already filtered, which is what makes this page the entry to
    the catalog rather than a rival to it. The caption is FACETS' own, so the
    ten words and their order are one declaration shared with the toolbar.
  -->
  <div class="for-row">
    <FacetRow
      name="for"
      caption="FOR"
      terms={FOR_TERMS}
      href={(term) => resolve(`/playground/?for=${term}`)}
    />
  </div>
</section>

<style>
  .front-door {
    /* The 700ms arrival BrowseLink's opacity still reads, or 200ms under
       reduced motion. The dissolve it was written for went with the splash
       (13-07); the variable stays because the link's rule names it. */
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
    color: var(--color-action);
  }

  @media (prefers-reduced-motion: reduce) {
    .front-door {
      --arrive-ms: 200ms;
    }
  }

  /*
    MICRO ROLE (10-UI-SPEC 5.2): --font-display, 12px, 700, 1.2, 0.18em,
    uppercase - the same ladder rung as every button label and region caption,
    and separated from Display and Heading by size and tracking rather than by
    weight. It was Body at 16px / 400 through Phases 4 to 9.

    The 48px top margin and the centring are Phase 4's and are deliberately
    unchanged: the headline's position on the page is not what R-01 moved.
    Quiet is still colour, never size.
  */
  .headline {
    margin: 48px 0 0;
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    text-align: center;
    color: var(--color-ink-quiet);
  }

  /*
    The one line this file already owned. position: relative stays after the
    CRT shell left (13-04, D-09): the coverflow's geometry was measured against
    this box, and a row that stopped being a containing block would move it.
  */
  .row {
    margin-block-start: 32px;
    position: relative;
  }

  /*
    The FOR row, at the 32px rhythm 10-UI-SPEC 6 gives it, inside the same
    gutter the headline and the header block carry - the row itself is the only
    full-bleed thing on this page.
  */
  .for-row {
    margin-block-start: 32px;
    padding-inline: 32px;
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
