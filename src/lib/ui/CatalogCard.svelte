<!--
  The card: the pad IS the card.

  One configuration, rendered as its running pad, its name, its sentence, its
  feel and its Featured mark. Same four-layer pad recipe as the front door, same
  prohibitions, same dot field, same 6px inset inside the 10px radius - nothing
  about the pad's construction changes here (05.1-UI-SPEC Screen 2c).

  EXACTLY ONE LINK. The plate's anchor carries
  `::after { position: absolute; inset: 0 }` over a `position: relative` card, so
  a click anywhere on the card follows the link while the accessibility tree
  contains ONE link and the tab order gains ONE stop. That is what makes
  BrowseGrid's roving tabindex possible, and it is why this card's tag chips are
  spans rather than controls: sixty-four extra tab stops inside the grid would
  destroy the one-stop-per-card rule the arrow keys depend on (W-06).

  IT IS AN ANCHOR AND NOT A LISTBOX OPTION. Neither `role="option"` nor
  `role="gridcell"` appears anywhere in this file, and both are refused for the
  same reason: they REPLACE the link role, and with it a screen reader's links
  list, middle-click, and open-in-new-tab. A browse card is a link to a real
  prerendered address; that is the whole shareability story (05.1-UI-SPEC
  Screen 3).

  THE PAD WRAPPER IS aria-hidden. PadCanvas's `role="img"` and its
  "{name}, live pad simulation" label are right on the front door, where the pad
  is the thing. Inside a named link they would announce the configuration's name
  a second time on every one of sixteen cards (W-17), so the picture is
  decorative WITHIN a named link and the anchor carries the name.

  A CARD IS A PICTURE, NOT AN INSTRUMENT (W-15). No pointer handler is installed
  anywhere in this file, so no touch reaches any card's engine at any width under
  any pointer: a pointerdown on a card is the beginning of a click that opens the
  detail view, and delivering it to the simulator as well would make the card's
  most common gesture ambiguous. The cursor is `pointer` and NEVER `crosshair` -
  the word appears in this sentence and in no declaration, which is why every
  structural scan over this file strips comments first. The instrument is the
  detail view, where the hero already plays.

  THE DESCRIPTION IS NEVER CLAMPED. No `text-overflow`, no line clamp and no
  ellipsis: the longest shipped sentence is 110 characters and it wraps to three
  or four lines in a 286px card. A `…` on this site means "this is still
  happening", never "there is more".

  NOTHING HERE IS AN ALARM. `--color-over` is Phase 5's over-budget colour, it is
  scoped to three uses inside a 908-character meter, and no meter exists on a
  browse screen. An empty band on an unfeatured card, a resting-dark pad and an
  unavailable entry are all quiet prose on the inherited alpha ladder
  (Pitfall 13).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { resolve } from "$app/paths";
  import type { ListingEntry } from "$lib/catalog/listing";
  import { typographic } from "$lib/browse/typographic";
  import { type DemoPath, demoPathFor } from "$lib/sim/demo";
  import PadCanvas from "./PadCanvas.svelte";
  import PadFrame from "./PadFrame.svelte";
  import PadSpinner from "./PadSpinner.svelte";

  let {
    entry,
    tabbable,
    pending = false,
    unavailable = false,
    onready,
    onfocus,
  }: {
    entry: ListingEntry;
    /** True for exactly one card in the grid: the roving one. */
    tabbable: boolean;
    /**
     * The grid has not finished building this card's engine yet. True only
     * between mount and the first frame of a Lua-sourced card, whose VM is a
     * ~271 KB WebAssembly fetch on first intersection (D-06). A card is NEVER an
     * unexplained black pad: it is painting, or it is spinning, or it carries
     * the resting-dark note, or it reads unavailable.
     */
    pending?: boolean;
    /**
     * The grid could not build an engine for this entry, or its lazy import
     * failed. Two causes, one state: the frame and the dot field render with no
     * canvas and the plate reads "{name} - unavailable". THE LINK STAYS A LINK -
     * the detail page can still explain, and one broken entry never blanks the
     * wall.
     */
    unavailable?: boolean;
    /**
     * Hands the canvas to the grid's SimHost, with this entry's demonstration
     * gesture if it has one.
     *
     * THE THIRD ARGUMENT IS WHY THIS COMPONENT IS THE ONE THAT LOOKS IT UP.
     * D-09 gives a configuration that paints nothing until it is touched a
     * finger rather than a light, and the flag reaches the host as
     * register()'s fourth argument (10-VALIDATION V-04). PadFrame.svelte does
     * not carry it: that component holds no engine, issues no draw call and
     * declares `entry: { id: string }` precisely so svelte/no-unused-props
     * stays green, so a `demo` prop on it would be an unused prop and a lint
     * failure. The card is the only surface that mounts a dark entry, so the
     * lookup is here and the grid simply forwards what it is handed.
     */
    onready: (id: string, el: HTMLCanvasElement, demo?: DemoPath) => void;
    /** The card took focus; the grid moves its roving index here. */
    onfocus: () => void;
  } = $props();

  /** The copy contract's broken-entry name, with a real em dash (U+2014). */
  const label = $derived(
    unavailable ? `${entry.name} — unavailable` : entry.name,
  );

  /** The link's describedby target. One id per card, from the catalog id. */
  const descriptionId = $derived(`card-description-${entry.id}`);

  /**
   * PadCanvas's onready shape is unchanged - (id, canvas) - and this closure is
   * what adds the third argument on the way past. Keeping the child's signature
   * as it was means the coverflow's use of the same component is untouched.
   */
  const handleReady = (id: string, el: HTMLCanvasElement): void => {
    onready(id, el, demoPathFor(id));
  };
</script>

<li class="card" data-testid="card-{entry.id}">
  <!--
    The 16px band is RESERVED ON EVERY CARD and holds the word on the eight
    featured ones. That reservation is what keeps sixteen pads aligned across a
    row whichever of them are featured. It is --color-ink and deliberately NOT
    accent: accent means "this is the live value" on this site, and a curation
    flag is not a value (W-05).
  -->
  <p class="featured">
    {#if entry.featured}FEATURED{/if}
  </p>

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

  <!--
    The plate is Phase 4's box without its arrows, authored here as an ANCHOR.
    NamePlate.svelte's name is a <button> that chooses a row entry, and a card
    navigates instead of choosing - so this card restates the plate's four
    declarations rather than widening a shipped component that four other call
    sites depend on. Every measurement below is NamePlate's own.

    No `Enter` and no `Space` handler exists on it, here or in BrowseGrid: Enter
    follows a link natively and hijacking it is the fastest way to break
    middle-click and open-in-new-tab.
  -->
  <a
    class="name"
    class:unavailable
    href={resolve("/c/[id]", { id: entry.id })}
    data-testid="card-name-{entry.id}"
    tabindex={tabbable ? 0 : -1}
    aria-label={label}
    aria-describedby={descriptionId}
    {onfocus}>{label}</a
  >

  <!--
    THE DISPLAY TRANSFORM, at its second and last render site. Radar's sentence
    is vendored copy that may never be edited (05.1-UI-SPEC, Data corrections),
    so the card shows a typographic apostrophe while listing.ts, front-door.ts
    and the route's meta tags stay byte-equal to the vendored bytes. It is NOT
    applied to the name, and NOT to `quiet`, which is HANGAR's own copy and is
    already authored with U+2019.
  -->
  <p class="description" id={descriptionId}>
    {typographic(entry.description)}
  </p>

  <!--
    One string, one source. `quiet` is DEMO_TOUCH_NOTE for the three restsBlack
    entries that carry a demonstration gesture, and Trackpad's own sentence for
    the fourth, which has no LED layer for a gesture to light. restsBlack is a
    recorded fact asserted against frames.json in both directions. Typing any of
    those sentences in here would be a second source for it.

    THE LINE IS NOT DECORATION AFTER D-09, IT IS THE HONESTY. A card that
    appears to animate on its own, when the pad in fact needs a finger, makes a
    claim about somebody's hardware that is not true. The pad is showing what a
    real finger would make it do, and this sentence is where it says so.
  -->
  {#if entry.restsBlack && entry.quiet !== undefined}
    <p class="quiet">{entry.quiet}</p>
  {/if}

  <!--
    THE METADATA BLOCK (19.1c, D-15 reference A). Three machine facts about this
    configuration, + separated with one space either side, column-aligned, in
    the mono stack at --color-ink-quiet: the catalog id, which is also this
    card's address; the engine that renders its preview; and what the pad does
    with nobody touching it. All three are read off the entry - no derivation,
    no second source, and no specifier that reaches the compiler.

    IT IS aria-hidden, AND THAT IS NOT A SHORTCUT. The anchor above already
    carries the entry's name as its accessible name and its description as its
    describedby target, and this block restates the id - which is the name in
    lower case - the engine and the motion. Announced, it would be the same card
    read a second time in machine words, on every one of thirty-six cards. It is
    a register mark for the eye.

    THE + IS U+002B WITH ONE SPACE EITHER SIDE and it is 13.0's second added
    character, beside U+2212. It is markup furniture rather than copy: no string
    in any copy module carries it, so the enumerations in
    src/lib/catalog/copy.spec.ts and src/lib/tune/copy.spec.ts are unchanged -
    which is stated here rather than left as a silence.
  -->
  <p class="meta" aria-hidden="true">
    <span class="field">{entry.id}</span>
    <span class="plus">+</span>
    <span class="field">{entry.preview}</span>
    <span class="plus">+</span>
    <span class="field">{entry.motion}</span>
  </p>

  <ul class="tags" role="list">
    {#each entry.tags as tag (tag)}
      <li><span class="tag">{tag}</span></li>
    {/each}
  </ul>
</li>

<style>
  /*
    A flex column, and the tag row's `margin-block-start: auto` is what makes a
    row of cards line up: every card ends at the same line, so every pad in the
    row starts at the same line whatever the descriptions do.
  */
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    list-style: none;
    cursor: pointer;
  }

  /* Micro: 12px / 600 / 1.2 / 0.18em, uppercase. 14.4px inside a 16px band. */
  .featured {
    block-size: 16px;
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink);
  }

  /* The pad is square and as wide as the card. Never smaller than 260px. */
  .pad-wrap {
    aspect-ratio: 1;
    inline-size: 100%;
    margin-block-end: 16px;
  }

  /*
    PadFrame's root, reached through :global because the component exposes no
    hover prop and its `hero` flag is the wrong lever - hero also adds the lime
    bloom, and no browse card glows. Rest is --color-line-soft (the side-pad
    treatment: a card is not a hero); hover and focus lift it to --color-line.
  */
  .card:hover .pad-wrap > :global(.pad),
  .card:has(.name:focus-visible) .pad-wrap > :global(.pad) {
    border-color: var(--color-line);
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

  /* Phase 4's plate: 44px, 6px radius, --color-line, Heading 20px / 600. */
  .name {
    display: grid;
    place-items: center;
    min-block-size: 44px;
    inline-size: 100%;
    padding-inline: 16px;
    border: 1px solid var(--color-line);
    border-radius: 6px;
    background: transparent;
    font-size: 20px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.01em;
    text-align: center;
    text-wrap: balance;
    text-decoration: none;
    color: var(--color-ink);
    transition: border-color 160ms ease-out;
  }

  /* The overlay. One link, one tab stop, and the whole card is clickable. */
  .name::after {
    content: "";
    position: absolute;
    inset: 0;
  }

  .card:hover .name {
    border-color: var(--color-accent);
  }

  .name.unavailable {
    color: var(--color-ink-dim);
  }

  /*
    The ring is RELOCATED, never removed: drawn on the card at the 10px radius
    so what a visitor sees matches the clickable area rather than a 44px plate
    inside it (05.1-UI-SPEC, Accessibility Contract).
  */
  .name:focus-visible {
    outline: none;
  }

  .card:has(.name:focus-visible) {
    outline: 2px solid var(--color-accent);
    outline-offset: 4px;
    border-radius: 10px;
  }

  /* Body: 16px / 400 / 1.5. Quiet is COLOUR, never a smaller size. */
  .description,
  .quiet {
    margin: 8px 0 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  /*
    Information, not controls, and visibly so: --color-line-soft against the
    toolbar's --color-line, and 24.4px of height against its 44px.
  */
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: auto 0 0;
    padding: 16px 0 0;
    list-style: none;
  }

  /*
    THE SEVENTH --font-mono USE ON THE SITE, AND A-44 REQUIRES THE ARGUMENT TO
    BE MADE OUT LOUD RATHER THAN INHERITED. ColourPicker.svelte's own comment
    spent the sixth and said in as many words that a seventh needs its case
    made again, so here it is.

    THE SIX BEFORE IT: BudgetMeter.svelte's two numeric columns, CopyLink.svelte's
    link field, DeviceSlot.svelte's firmware numerals and Knob.svelte's integer
    readout are Phase 5's four; Knob.svelte's forecast delta is 11.3's fifth;
    ColourPicker.svelte's RGB triple is 10-10's sixth.

    THE FIFTH AND THE SIXTH QUALIFY ON ONE HALF OF W-03's RULE AND THIS ONE
    QUALIFIES ON THE OTHER. Theirs is "a number that changes as a pointer moves
    and must not jitter horizontally" - and that argument does NOT describe this
    block, which is static from the moment the card mounts and never changes at
    all. Ours is the other half: MACHINE TEXT WHOSE COLUMNS MUST HOLD. Thirty-six
    of these blocks stack in a grid, three fields each, separated by a character
    that is only legible AS a separator when it lands in the same place on every
    card. In a proportional face the pair
    arc + padsim + animated and starfield + padsim + animated put their plus signs at two unrelated
    offsets and the block reads as three cards' worth of noise; in a fixed
    advance the fields are columns and the wall reads as a table. That is
    reference A's device exactly, and it is a property of the STACK rather than
    of any one card - which is why no single-card argument would have reached it.

    tabular-nums is declared with no digit in the block today, and that is
    deliberate rather than cargo: the fields are catalog tokens now, and the day
    one of them carries a number the columns must not move on the day it
    arrives rather than on the day somebody notices.

    NO DIVIDER, NO BORDER, NO ZEBRA AND NO NEW --color-line USE (19.1d). The
    column alignment carries the row. The block sits above the tag row on the
    ink ladder's quiet rung and is separated from it by space alone.
  */
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0 8px;
    margin: 8px 0 0;
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 400;
    line-height: 1.4;
    font-variant-numeric: tabular-nums;
    color: var(--color-ink-quiet);
  }

  /* The separator, at the soft rung so the fields read before it does. */
  .plus {
    color: var(--color-line-soft);
  }

  /* Micro (title): 12px / 600 / 1.2 / 0.01em, sentence case, verbatim. */
  .tag {
    display: inline-block;
    padding: 4px 8px;
    border: 1px solid var(--color-line-soft);
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.01em;
    color: var(--color-ink-quiet);
  }
</style>
