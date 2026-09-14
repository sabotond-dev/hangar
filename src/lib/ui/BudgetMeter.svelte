<!--
  One meter: a caption, a right-aligned count, a percentage and an 8px bar,
  rendering a MeterView and re-deriving NOTHING - over and state are settled in
  $lib/tune/view's meterView(). Props: view, ghost (a forecast count, TUNE-02).
  The numerals are the mono stack with tabular-nums so a count never jitters; the
  caption is not monospaced. Staleness is an alpha change, never the measuring
  word. No ARIA role (DEGR-01: real text everywhere; the numerals aria-hidden with
  a visually-hidden sentence beside them). The height is arithmetic: 14 + 4 + 8 =
  26, two plus a 4px gap = 56 - the three line-height: 14px declarations ARE it.
  X-01 uses 1 and 2 of 3 live here; the ghost is --color-divider and spends nothing.
  Decided at 05-08 / 13-10 (D-01, TUNE-02); see .planning/phases/13-gui-overhaul/13-10-SUMMARY.md

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
    ghost,
  }: {
    /** One meter, already resolved by $lib/tune/view's meterView(). */
    view: MeterView;
    /** The count a hovered or focused option WOULD produce (TUNE-02), or undefined; a number, never a percentage, so the ghost and the fill share one rounding. */
    ghost?: number;
  } = $props();

  /** The two event words as the contract's {Setup|Timer} placeholder prints them: $lib/tune/copy imports nothing and takes the capitalised word. */
  const WORDS: Readonly<Record<MeterView["event"], EventWord>> = {
    setup: "Setup",
    timer: "Timer",
  };

  const caption = $derived(
    view.event === "setup" ? SETUP_CAPTION : TIMER_CAPTION,
  );

  /** aria-busy while a number is arriving or catching up; per meter, because each has its own feed. */
  const busy = $derived(view.state === "measuring" || view.state === "stale");

  /** Geometry, not state: min(100%, used / 908) of the track; over budget it is already 100, so the full bar needs no branch. */
  const fillPercent = $derived(
    view.state === "measuring"
      ? 0
      : Math.min(100, (view.used / view.limit) * 100),
  );

  /**
   * The ghost as one span and no direction branch: the segment from min(current,
   * forecast) to max, drawn in --color-divider over the track's own, so a forecast
   * above is the extra and a forecast below is the notch, at one alpha (10-UI-SPEC 14).
   * Nothing is drawn while measuring.
   */
  const ghostPercent = $derived(
    ghost === undefined || view.state === "measuring"
      ? undefined
      : Math.min(100, (ghost / view.limit) * 100),
  );
  const ghostFrom = $derived(
    ghostPercent === undefined
      ? fillPercent
      : Math.min(fillPercent, ghostPercent),
  );
  const ghostSize = $derived(
    ghostPercent === undefined ? 0 : Math.abs(ghostPercent - fillPercent),
  );

  /** The visually-hidden sentence in place of the numerals; none while measuring, so the measuring word stays readable. MORPH ships an empty Timer, so 0 / 908 is a true measurement. */
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
    <span
      class="fill"
      class:over={view.over}
      class:forecasting={ghostPercent !== undefined}
      style:inline-size="{ghostFrom}%"
    ></span>
    {#if ghostPercent !== undefined}
      <span
        class="ghost"
        style:inset-inline-start="{ghostFrom}%"
        style:inline-size="{ghostSize}%"
      ></span>
    {/if}
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

  /* Micro role in the quiet rung; Quicksand, NOT monospaced - the caption is a word. */
  .caption {
    font-size: 12px;
    font-weight: 600;
    line-height: 14px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
  }

  /* The only two monospaced cells: tabular numerals in the caption's 14px box. */
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
    color: var(--color-error-ink);
  }

  /* 4px under the row, then an 8px bar at the full content width. Square (D-01). */
  .track {
    position: relative;
    margin-block-start: 4px;
    block-size: 8px;
    background: var(--color-divider);
  }

  /* The ghost (TUNE-02): --color-divider, the track's own token, no accent, no red; transition: none because it tracks a pointer (10-UI-SPEC 14). */
  .ghost {
    position: absolute;
    inset-block: 0;
    display: block;
    background: var(--color-divider);
    transition: none;
  }

  /* X-01 use 1 of 3: the offending meter's fill and its outline, outside the track so a full bar is still visibly a bar. */
  .track.over {
    outline: 2px solid var(--color-error-ink);
    outline-offset: 2px;
  }

  .fill {
    display: block;
    block-size: 100%;
    background: var(--color-action);
    transition: inline-size 120ms ease-out;
  }

  /* The fill's 120 ms is for a measurement landing; while a forecast shows it tracks a pointer, so the transition is dropped for exactly that long. */
  .fill.forecasting {
    transition: none;
  }

  /* Full accent in budget, never --color-ink: accent-to-over is 3.09:1, ink-to-over 1.56:1 (05-UI-SPEC X-02, X-03). */
  .fill.over {
    background: var(--color-error-ink);
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
