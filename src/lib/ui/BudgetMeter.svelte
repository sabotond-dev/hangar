<!--
  One meter. Two numbers that never lie and never jitter.

  A meter is a caption, a right-aligned character count, a right-aligned
  percentage and an 8px bar. It renders a MeterView and re-derives NOTHING:
  `over` is a property of the number and `state` is the model's word for what
  the feed is doing, both settled in $lib/tune/view's meterView(). Two copies of
  "is this over 908" is how one screen ends up red while the other is lime.

  WHY THE CAPTION IS NOT MONOSPACED. Monospace is confined to numerals and
  machine text (05-UI-SPEC, Typography, extending Phase 4's W-03). SETUP and
  TIMER are Micro captions in Quicksand 600 like every other caption in the
  region; only the two numeric columns take var(--font-mono) with
  font-variant-numeric: tabular-nums. Tabular numerals are mandatory rather than
  decorative: a budget that shifts horizontally while it counts from 702 to 711
  is the exact failure the mono stack was introduced for.

  WHY STALENESS IS AN ALPHA CHANGE AND NOT THE `measuring…` WORD. During a drag
  the 120ms debounce fires several times a second. Swapping the numerals for a
  word and back would strobe; dropping their alpha moves no layout, cannot
  reflow, and reads as "these numbers are catching up" rather than "these
  numbers are gone". The word is reserved for the very first measurement, when
  there is genuinely nothing to show. And staleness never applies while over
  budget - meterView() makes `over` outrank the feed - because dimming a warning
  is wrong.

  WHY THERE IS NO ARIA ROLE HERE AT ALL. DEGR-01 requires iOS Safari, where
  VoiceOver's support for the meter role is partial and inconsistent, and a
  readout that announces differently on one platform is worse than one that
  announces as plain text everywhere. So: the caption, the numerals and the
  percentage are real text in the DOM; the visible numerals are aria-hidden and
  paired with a visually-hidden sentence that says the same thing in words; the
  bar is decoration and is aria-hidden. Nothing here is focusable and nothing
  carries a tabindex either - a readout with no action must never become a dead
  tab stop. Every assistive technology on every platform understands real text,
  and it cannot regress.

  THE HEIGHT IS ARITHMETIC, NOT A GUESS. One meter is

      14 (the region's fixed line box) + 4 (gap) + 8 (bar) = 26

  and the two-meter block the region stacks is

      (14 + 4 + 8) x 2 + 4 = 56

  which is the 56px half of Phase 4's reservation that survived D-11's
  correction, honoured to the pixel. All three cells of the row therefore carry
  `line-height: 14px` and nothing else - no family, size, weight, tracking or
  case changes with it. Quicksand's own 1.2 ratio would make the row 14.4 and
  the block 56.8, and 14.4 divides into neither number. If a later tidy-up
  deletes one of those three declarations the block silently becomes 56.8px:
  the declarations are the arithmetic.

  --color-over lives here and in BudgetMessage.svelte, and nowhere else on the
  site. Two of X-01's three permitted uses are in this file: the offending
  meter's bar fill with its 2px outline, and that meter's numerals and
  percentage. It is never a button, never a border elsewhere, never a knob.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import {
    MEASURING,
    SETUP_CAPTION,
    TIMER_CAPTION,
    emptyTimerExpansion,
    meterExpansion,
    meterNumerals,
    meterPercent,
    type EventWord,
  } from "$lib/tune/copy";
  import type { MeterView } from "$lib/tune/view";

  let {
    view,
  }: {
    /** One meter, already resolved by $lib/tune/view's meterView(). */
    view: MeterView;
  } = $props();

  /**
   * The two event words in the case the contract's {Setup|Timer} placeholder
   * prints them.
   *
   * They are a two-word capitalisation table rather than sentences, and
   * $lib/tune/copy's own header says why they arrive that way: that module
   * imports nothing, so it cannot name view.ts's MeterEvent and takes the
   * already-capitalised word instead.
   */
  const WORDS: Readonly<Record<MeterView["event"], EventWord>> = {
    setup: "Setup",
    timer: "Timer",
  };

  const caption = $derived(
    view.event === "setup" ? SETUP_CAPTION : TIMER_CAPTION,
  );

  /**
   * aria-busy while a number is arriving or catching up, so an assistive
   * technology does not read a count that is about to change. 05-UI-SPEC words
   * this as "on the meters block"; it is set per meter because each meter has
   * its own feed, and the block above is free to be busy when either is.
   */
  const busy = $derived(view.state === "measuring" || view.state === "stale");

  /**
   * Geometry, not state: the fill is min(100%, used / 908) of the track, and a
   * meter that has never measured shows a track with nothing in it. Over budget
   * this expression is already 100 - `over` is `used > 908` - so the full bar
   * needs no branch of its own.
   */
  const fillPercent = $derived(
    view.state === "measuring"
      ? 0
      : Math.min(100, (view.used / view.limit) * 100),
  );

  /**
   * The visually-hidden sentence a screen reader gets in place of the numerals.
   *
   * MORPH ships an empty Timer, so `0 / 908` is a true measurement rather than
   * a dead meter and the expansion says which of the two it is in words. There
   * is no expansion while measuring: the `measuring…` word is left readable
   * instead, so the meter says what it is waiting for rather than nothing.
   */
  const expansion = $derived(
    view.event === "timer" && view.used === 0
      ? emptyTimerExpansion()
      : meterExpansion(WORDS[view.event], view.used, view.pct),
  );
</script>

<div class="meter" data-testid="meter-{view.event}" aria-busy={busy}>
  <div class="row">
    <span class="caption">{caption}</span>

    {#if view.state === "measuring"}
      <span class="numerals quiet">{MEASURING}</span>
      <span class="percent"></span>
    {:else}
      <span
        class="numerals"
        class:quiet={view.state === "stale"}
        class:over={view.over}
        aria-hidden="true">{meterNumerals(view.used)}</span
      >
      <span
        class="percent"
        class:quiet={view.state === "stale"}
        class:over={view.over}
        aria-hidden="true">{meterPercent(view.pct)}</span
      >
      <span class="sr-only">{expansion}</span>
    {/if}
  </div>

  <div class="track" class:over={view.over} aria-hidden="true">
    <span class="fill" class:over={view.over} style:inline-size="{fillPercent}%"
    ></span>
  </div>
</div>

<style>
  /* 14 + 4 + 8 = 26, exactly, so that two of these plus a 4px gap are 56. */
  .meter {
    block-size: 26px;
  }

  .row {
    display: grid;
    grid-template-columns: auto 1fr 40px;
    column-gap: 12px;
    align-items: baseline;
  }

  /*
    Micro role: 12px / 600 / 0.18em / uppercase, in the quiet rung. Quicksand,
    NOT monospaced - the caption is a word, not a number.
  */
  .caption {
    font-size: 12px;
    font-weight: 600;
    line-height: 14px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
  }

  /*
    The only two monospaced cells in this file, and the only place
    var(--font-mono) appears in it. Tabular numerals so the columns hold still
    while the count changes, and the same 14px box as the caption beside them.
  */
  .numerals,
  .percent {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 400;
    line-height: 14px;
    font-variant-numeric: tabular-nums;
    text-align: end;
    color: var(--color-ink);
    transition: color 100ms linear;
  }

  /* Stale numbers, and the measuring word: last-known, catching up. */
  .quiet {
    color: var(--color-ink-quiet);
  }

  /* X-01 use 2 of 3. A warning is never dimmed, so .over wins over .quiet. */
  .over {
    color: var(--color-over);
  }

  /* 4px under the row, then an 8px bar at the full content width. */
  .track {
    margin-block-start: 4px;
    block-size: 8px;
    border-radius: 2px;
    background: var(--color-line-soft);
  }

  /*
    X-01 use 1 of 3: the offending meter's fill and its outline. The outline
    sits outside the track rather than inside it, so a completely full bar is
    still visibly a full bar rather than a solid block.
  */
  .track.over {
    outline: 2px solid var(--color-over);
    outline-offset: 2px;
  }

  .fill {
    display: block;
    block-size: 100%;
    border-radius: 2px;
    background: var(--color-accent);
    transition: inline-size 120ms ease-out;
  }

  /*
    Full strength accent while in budget, never --color-ink: the accent-to-over
    luminance ratio is 3.09:1 and clears WCAG's 3:1 for a non-text graphic, so
    the two bar states are told apart without hue. At --color-ink that ratio
    collapses to 1.56:1 (05-UI-SPEC X-02, X-03).
  */
  .fill.over {
    background: var(--color-over);
  }

  /* The fill glides when a measurement lands; instant when motion is reduced. */
  @media (prefers-reduced-motion: reduce) {
    .fill,
    .numerals,
    .percent {
      transition: none;
    }
  }
</style>
