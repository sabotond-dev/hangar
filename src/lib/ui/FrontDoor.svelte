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

  THE SPLASH HOLD (Phase 6, plan 06-11 task 3). While the splash covers the row
  the session's live region is held (session.holdSpeech()), so a ZONA detected
  during the opening is announced once, AFTER it, rather than over it. The hold
  is taken in onMount - which runs before the layout's onMount starts the
  session - only where there is a splash to talk over, and released from
  Splash's onfinished, which fires on EVERY path the splash ends by, including
  the one where a key, a click or a wheel cuts straight to the dissolve. It is
  also released if this component is destroyed while the splash is still up (a
  link followed during the opening), because a hold nobody releases is a live
  region muted for the rest of the visit. On a deep link there is no splash and
  nothing is held.

  The section carries no inline padding. The gutter belongs to the header block
  and the headline; the coverflow row is full-bleed on purpose, because pads
  falling off the edges of the viewport is the picture the brief asks for.

  AMENDMENT (Phase 10, plan 10-04, 10-UI-SPEC 8.2 and 8.3). THE CRT SHELL LIVES
  HERE BECAUSE Coverflow.svelte MAY NOT BE TOUCHED. The roll bar and the tear
  have to be bound to the coverflow band's own box, and that box belongs to a
  component this phase promises not to edit - so `.row` gains
  `position: relative` and a second child, `.crt-band`, sized to `.band` rather
  than to the row.

  WHY NOT `inset: 0`. The row holds four things: the band, the name plate, the
  fidelity line and, while a pad is chosen, the panel. A bar at `inset: 0` would
  sweep across the 20px heading carrying a configuration's name and across the
  prose beneath it, and 10-RESEARCH 3.5's arithmetic is not disputed - a
  0.186-alpha black line over --color-ink-quiet takes it from 5.57:1 to about
  3.9:1 while identity.spec.ts stays green, because that gate computes contrast
  from the DECLARED alpha. The resolution is not to make the gate composite an
  overlay; it is to make the overlay unable to reach the words. `.crt-band`
  contains one empty div and nothing else, ever, and aesthetic.spec.ts scan 3
  proves that structurally rather than trusting this paragraph.

  AMENDMENT (Phase 10, plan 10-07, A-22 and 10-UI-SPEC 9.1). THE `FOR` LINK
  ROW. The ten workflow terms render here as LINKS, one `/browse/?for={term}`
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

  THE DUPLICATION BELOW IS REAL AND IS GATED RATHER THAN TRUSTED. Five literals
  now live in two files. Scan 7 reads all five out of Coverflow.svelte's `.band`
  rules and out of this file's `.crt-band` rules and compares them after the
  same whitespace normalisation identity.spec.ts uses, so an edit to one that is
  not made to the other goes red and names both files.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { onDestroy, onMount, untrack } from "svelte";
  import { FOR_TERMS } from "$lib/browse/facets";
  import type { FrontDoorEntry } from "$lib/catalog/front-door";
  import { session } from "$lib/device/session.svelte";
  import { isLowPower } from "$lib/sim/schedule";
  import BrowseLink from "./BrowseLink.svelte";
  import Coverflow from "./Coverflow.svelte";
  import FacetRow from "./FacetRow.svelte";
  import DeviceNote from "./DeviceNote.svelte";
  import DeviceSlot from "./DeviceSlot.svelte";
  import { screen } from "./ScreenToggle.svelte";
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

  /** The hold's release, set only while the splash covers the row. */
  let releaseSpeech: (() => void) | undefined;

  /** Release once, from whichever path gets there first. */
  function releaseHold(): void {
    releaseSpeech?.();
    releaseSpeech = undefined;
  }

  onMount(() => {
    // Held only where there is a splash to talk over. A deep link has none, and
    // a suppression window that outlived a splash that never played would
    // silence a returning visitor's reconnect offer for nothing.
    if (opening) releaseSpeech = session.holdSpeech();
  });

  onDestroy(() => {
    // The opening ended by this component leaving the page. onDestroy runs on
    // the server too, where nothing was ever held, and releaseHold is a no-op.
    releaseHold();
  });

  function onSplashFinished(): void {
    opening = false;
    releaseHold();
  }

  // --- The CRT shell: Layer R's three conditions and Layer T's one event -----

  /** 10-UI-SPEC 8.4: the tear is 180 ms, and it is 180 ms in exactly one place. */
  const TEAR_MS = 180;

  /**
   * SWITCH 3, and it is feature-detected rather than browser-sniffed. Layer R
   * is the only layer with a per-frame compositor cost, so it is the only one
   * worth spending a capability check on. isLowPower is src/lib/sim/schedule.ts's
   * - `(cores ?? 8) <= 4`, the same predicate the simulator host already halves
   * its paint rate on - rather than a second reading of the same number that
   * could drift from it.
   *
   * Read in onMount because navigator does not exist in the prerenderer, and
   * held as state so the roll bar appears at hydration rather than never.
   */
  let manyCores = $state(false);
  onMount(() => {
    manyCores = !isLowPower(navigator.hardwareConcurrency);
  });

  /**
   * Layer R mounts on THREE conditions, and each of the three is a different
   * kind of no: SCREEN says textured (the visitor's own choice), the machine
   * has more than four cores (a capability), and no pad is chosen (a state -
   * a bar sweeping over a panel somebody is reading is the "overwhelming" D-07
   * rules out).
   *
   * MOUNTED, not hidden. 10-UI-SPEC 8.7's browser gate 2 requires the roll bar
   * to be ABSENT FROM THE DOM under FLAT; `display: none` would leave that
   * assertion reading an element that is still there.
   */
  const showRoll = $derived(
    screen.value === "textured" && manyCores && !panelOwnsProse,
  );

  /**
   * THE TEAR, ON ONE SURFACE AND ONE EVENT. session.plugged counts permitted
   * ZONAs arriving on the cable - navigator.serial's own `connect`, past the
   * session's guards. Not a click-driven connect, not a disconnect, not a
   * failure, and not a recurring idle timer: real hardware caused it, and it is
   * the one thing that happens on this site that the visitor did not start.
   *
   * THE {#key} IS LOAD-BEARING AND NOT DECORATION. `.crt-band::after` declares
   * its animation at rest with `animation-play-state: paused`, sitting on the
   * invisible 0% keyframe - which is what lets 10-UI-SPEC 8.7's gate 1 read a
   * real animation-name at the compositor and see it become "none" under
   * reduced motion, instead of reading "none" in both states and proving
   * nothing. The cost of that design is that a finished animation cannot be
   * replayed by toggling play-state, so the element is rebuilt per arrival.
   * Rebuilding restarts the roll bar's sweep as well; at one rebuild per
   * physical plug-in that is a fair price, and arguably the right picture.
   */
  const tearRun = $derived(session.plugged);
  let tearing = $state(false);

  $effect(() => {
    if (session.plugged === 0) return;
    tearing = true;
    const timer = setTimeout(() => {
      tearing = false;
    }, TEAR_MS);
    return () => clearTimeout(timer);
  });
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
    <!--
      THE CRT SHELL. A SIBLING of the whole coverflow output, never an ancestor
      of any of it: the 3D rendering context is `.stage`'s, and a grouping
      property anywhere above a `.slot` flattens the ladder into a row of equal
      squares. It contains Layer R and nothing else; Layer T is its ::after.
      NO TEXT NODE MAY EVER GO IN HERE - scan 3 walks this subtree and asserts
      it is empty of words.
    -->
    {#key tearRun}
      <div
        class="crt-band"
        class:chosen={panelOwnsProse}
        class:tearing
        aria-hidden="true"
      >
        {#if showRoll}<div class="crt-roll" aria-hidden="true"></div>{/if}
      </div>
    {/key}
  </div>

  <!--
    THE `FOR` ROW (A-22). Ten destinations, not ten controls: pressing one takes
    you to /browse/ already filtered, which is what makes this page the entry to
    the catalog rather than a rival to it. The caption is FACETS' own, so the
    ten words and their order are one declaration shared with the toolbar.
  -->
  <div class="for-row">
    <FacetRow
      name="for"
      caption="FOR"
      terms={FOR_TERMS}
      href={(term) => resolve(`/browse/?for=${term}`)}
    />
  </div>
</section>

{#if opening}
  <Splash ondissolve={() => (covered = false)} onfinished={onSplashFinished} />
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
    color: var(--color-action);
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
    The one line this file already owned. `.crt-band` is positioned against the
    row, and against nothing in Coverflow.svelte.
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

  /*
    ================= THE CRT SHELL (10-UI-SPEC 8.3) =========================

    FIVE OF THE DECLARATIONS BELOW ARE COPIED VERBATIM FROM Coverflow.svelte's
    `.band` RULES, AND THAT DUPLICATION IS REAL, DELIBERATE AND GATED.
    aesthetic.spec.ts scan 7 reads `clamp(260px, 52vmin, 560px)`,
    `min(100vw, 1280px)`, `overflow-clip-margin: 6px`, the four-stop
    `mask-image` gradient and `translateY(-24px)` out of BOTH files and compares
    them after the same normalisation identity.spec.ts uses. Change one without
    the other and the scan goes red naming both files and the literal. Do NOT
    "clean this up" by reaching into Coverflow.svelte for a shared custom
    property: that file is not edited in this phase, and its own header forbids
    exactly this class of change.

    THE BOX IS `.band`'s, NOT THE ROW'S. The row also holds the name plate, the
    fidelity line and the panel, all of which carry words.

    `inset-inline: 0` alone would over-reach: above 1280px the row is full-bleed
    and the band is not, so the inline size and the auto margins are load-
    bearing rather than copied for symmetry.

    `overflow: clip` and `mask-image` are grouping properties, and they are
    legal HERE for the reason they are legal on `.band`: this element is an
    ancestor of nothing that lives in a 3D rendering context.
  */
  .crt-band {
    position: absolute;
    inset-block-start: 0;
    inset-inline: 0;
    block-size: clamp(260px, 52vmin, 560px);
    inline-size: min(100vw, 1280px);
    max-inline-size: 100%;
    margin-inline: auto;
    overflow: clip;
    overflow-clip-margin: 6px;
    mask-image: linear-gradient(
      to right,
      transparent 0%,
      #000000 14%,
      #000000 86%,
      transparent 100%
    );
    pointer-events: none;
    transition: transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  /*
    The band lifts 24px when a pad is chosen. A layer that did not follow would
    slip 24px out of register the instant a visitor chose one.
  */
  .crt-band.chosen {
    transform: translateY(-24px);
  }

  /*
    LAYER R - one roll bar, for the whole page. Not one per card, not one per
    surface: exactly one instance exists on the site, it is here, and it does
    not mount at all while a pad is chosen, under SCREEN: FLAT, or on a machine
    with four cores or fewer.

    The reference implementation's cold blue #bed7ff12 becomes the accent at the
    same alpha, read from --crt-roll in app.css. A borrowed hue would have been
    a fourth colour on a site whose entire palette is three.

    `will-change: transform` is the one promotion in this whole treatment, and
    it is on the one element that actually moves every frame: a 22%-tall bar
    travelling the height of the band on a composited transform, no repaint.
  */
  .crt-roll {
    position: absolute;
    inset-block-start: 0;
    inset-inline: 0;
    block-size: 22%;
    background: var(--crt-roll);
    pointer-events: none;
    will-change: transform;
    animation: crt-roll 6.5s linear infinite;
  }

  @keyframes crt-roll {
    from {
      transform: translateY(-130%);
    }
    to {
      transform: translateY(520%);
    }
  }

  /*
    LAYER T - the tear. Seven step-end states over 180 ms of clip-path and
    translateX, and NOT ONE `filter` PROPERTY ANYWHERE IN THE KEYFRAMES.
    `hue-rotate`, `saturate`, `contrast` and `brightness` are all removed from
    the ported effect: paint.ts:17-35 makes a CSS filter that adds or tints
    colour over a pad face a FIDELITY violation rather than a style choice, and
    the band is full of pad faces.

    It clips and translates ITSELF - a pseudo-element with no contents - and
    never an element that has any. That is what makes "animates a border box,
    not its contents" achievable at all.

    ARMED AT REST AND PAUSED, which is not an optimisation but the thing that
    makes the reduced-motion gate mean something. With `animation-play-state:
    paused` the computed animation-name here is `crt-tear` at rest and `none`
    under reduced motion, so 10-UI-SPEC 8.7's gate 1 reads a real difference at
    the compositor. Declared the other way round - no animation until a class
    arrives - the gate would read "none" in both states and assert nothing. The
    0% keyframe is the invisible resting state for exactly that reason: a
    paused animation still applies its current value, and time zero is where it
    sits.
  */
  .crt-band::after {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--crt-roll);
    pointer-events: none;
    opacity: var(--crt);
    clip-path: inset(100% 0 0 0);
    animation: crt-tear 180ms step-end 1;
    animation-play-state: paused;
  }

  .crt-band.tearing::after {
    animation-play-state: running;
  }

  @keyframes crt-tear {
    0% {
      clip-path: inset(100% 0 0 0);
      transform: translateX(0);
    }
    2% {
      clip-path: inset(12% 0 76% 0);
      transform: translateX(-1.6%);
    }
    16% {
      clip-path: inset(38% 0 54% 0);
      transform: translateX(2.4%);
    }
    30% {
      clip-path: inset(6% 0 88% 0);
      transform: translateX(-3.2%);
    }
    44% {
      clip-path: inset(64% 0 28% 0);
      transform: translateX(1.6%);
    }
    58% {
      clip-path: inset(22% 0 70% 0);
      transform: translateX(-2.4%);
    }
    72% {
      clip-path: inset(52% 0 42% 0);
      transform: translateX(3.2%);
    }
    86% {
      clip-path: inset(80% 0 14% 0);
      transform: translateX(-1.6%);
    }
    100% {
      clip-path: inset(100% 0 0 0);
      transform: translateX(0);
    }
  }

  /*
    SCREEN: FLAT. `content: none` removes the tear outright rather than fading
    it, which is what gate 2 reads. Layer R is not here because it is not in the
    DOM at all under FLAT.
  */
  :global(html[data-screen="flat"]) .crt-band::after {
    content: none;
  }

  /*
    SWITCH 1 - and it is a SECOND reduced-motion block on purpose, sitting after
    the rules it overrides rather than beside the --arrive-ms one further up. A
    media query adds no specificity, so a `transition: none` written above
    `.crt-band`'s own `transition` would simply lose.

    THE REFERENCE'S OWN REDUCED-MOTION RULE DOES NOT STOP ITS SCANLINE SWEEP.
    That is the bug this treatment is re-derived rather than ported to avoid,
    and it is a direct consequence of spreading motion across two components'
    pseudo-elements. Both moving layers are stopped here, in one block, three
    lines apart, and 10-UI-SPEC 8.7's gate 1 reads animationName at the
    compositor in both browser projects - which the shipped canvas-backing-store
    assertions structurally cannot see, because a CSS overlay painted above a
    canvas never touches that canvas's bytes.

    Layers G and S are untouched by this block because they do not move. Their
    off switch is SCREEN, and that is the whole argument for SCREEN existing.
  */
  @media (prefers-reduced-motion: reduce) {
    .crt-band {
      transition: none;
    }

    .crt-band.chosen {
      transform: none;
    }

    .crt-roll {
      animation: none;
    }

    .crt-band::after {
      animation: none;
    }
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
