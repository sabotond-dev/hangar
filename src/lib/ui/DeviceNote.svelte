<!--
  The header note: the inline region beneath the header row that says, with no
  click, what the picker is (the swapping cell: the reconnect offer or the S3
  status line) and that nothing is ever written (SAFE_NOTE, unconditional beneath
  it). Props: covered (the splash owns the row), panelOwnsProse (Y-11: the panel
  is saying the same lines, so they hide and hold their height). S0a and S0b render
  nothing, with no reservation. The cell is one 24px line box - ceil(37 / 43) x 24,
  the longest candidate over CH_PER_LINE (10-01) - held in every state so no
  session transition moves the headline beneath. Line changes fade 160ms ease-out on
  opacity; the height never moves. Not a live region: SessionAnnouncer speaks. Strings: session-copy.
  Decided at 06-12 / 10-03 (Y-23, D-16); see .planning/phases/10-redesign/10-03-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { session } from "$lib/device/session.svelte";
  import {
    RECONNECT_OFFER,
    SAFE_NOTE,
    STATUS_CHOOSING,
    STATUS_IDENTIFYING,
    STATUS_OPENING,
    slotStateOf,
  } from "$lib/device/session-copy";

  let {
    covered = false,
    panelOwnsProse = false,
  }: {
    /** True while the splash covers the row. Carries the wordmark's treatment verbatim. */
    covered?: boolean;
    /** True while the chosen panel renders the session's prose (Y-11): the S3 line and SAFE_NOTE hide and hold their height. */
    panelOwnsProse?: boolean;
  } = $props();

  /** The first paragraph's candidates, by name, so a test reads which one is current without inferring it from visibility. */
  type Line = "offer" | "choosing" | "opening" | "identifying" | "none";

  const slot = $derived(slotStateOf(session.phase));

  /** S0a and S0b are terminal (capability is decided before the first hydrated paint) and render nothing. */
  const rendered = $derived(slot !== "S0a" && slot !== "S0b");

  /** Which candidate of the first cell is visible; every other one is a twin. */
  const line: Line = $derived.by(() => {
    switch (slot) {
      case "S2":
        return "offer";
      case "S3":
        if (panelOwnsProse) return "none";
        if (session.phase === "choosing") return "choosing";
        if (session.phase === "opening") return "opening";
        return "identifying";
      default:
        return "none";
    }
  });

  /** aria-hidden as an attribute that is present or absent, never "false". */
  const hidden = (twin: boolean): true | undefined => (twin ? true : undefined);
</script>

{#if rendered}
  <div
    class="device-note"
    class:covered
    data-testid="device-note"
    data-slot={slot}
    data-line={line}
  >
    <div class="cell" data-testid="device-note-line">
      <p
        class="line"
        class:twin={line !== "offer"}
        aria-hidden={hidden(line !== "offer")}
      >
        {RECONNECT_OFFER}
      </p>
      <p
        class="line"
        class:twin={line !== "choosing"}
        aria-hidden={hidden(line !== "choosing")}
      >
        {STATUS_CHOOSING}
      </p>
      <p
        class="line"
        class:twin={line !== "opening"}
        aria-hidden={hidden(line !== "opening")}
      >
        {STATUS_OPENING}
      </p>
      <p
        class="line"
        class:twin={line !== "identifying"}
        aria-hidden={hidden(line !== "identifying")}
      >
        {STATUS_IDENTIFYING}
      </p>
    </div>
    <!-- SAFE-01, on the screen in every state this note renders in; hidden only while the panel says the same sentence, holding its height. -->
    <p
      class="safe-note"
      data-testid="device-note-safe"
      class:twin={panelOwnsProse}
      aria-hidden={hidden(panelOwnsProse)}
    >
      {SAFE_NOTE}
    </p>
  </div>
{/if}

<style>
  /* Two rows, 8px apart, at the panel's 372px content column, flush right; --arrive-ms is the front door's dissolve, the fallback its full-motion value. */
  .device-note {
    --note-arrive-ms: var(--arrive-ms, 700ms);
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    row-gap: 8px;
    inline-size: min(372px, 100%);
    margin-inline-start: auto;
    text-align: start;
    transition: opacity var(--note-arrive-ms) cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  /* Held at nothing while the splash owns the screen, not transitioned into it: the wordmark's declaration, verbatim. */
  .device-note.covered {
    opacity: 0;
    transition: none;
  }

  /*
    The one-cell grid: every candidate in the same cell, so a line count changing
    here cannot move the headline beneath (Z-18). The floor is ceil(longest /
    CH_PER_LINE) x 24 = ceil(37 / 43) x 24 = 24px (10-01's 43, 10-03's 37);
    device-ui.spec.ts holds it with the arithmetic in its failure message.
  */
  .cell {
    display: grid;
    min-block-size: 24px;
  }

  .cell > .line {
    grid-area: 1 / 1;
  }

  /* Body role, quiet: the honesty slot's treatment. Line changes fade on opacity alone. */
  .line {
    margin: 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
    transition:
      opacity 160ms ease-out,
      visibility 0s linear 0s;
  }

  /* SAFE_NOTE: Micro, 12px 600 on a 14px box, in --color-ink because a safety statement is not quiet; the note's second row, nothing ever in its place. */
  .safe-note {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    line-height: 14px;
    letter-spacing: 0.01em;
    color: var(--color-ink);
    transition:
      opacity 160ms ease-out,
      visibility 0s linear 0s;
  }

  /* A twin holds the height and nothing else: out of the tree by visibility, out of sight by opacity, the flip after the fade. */
  .twin {
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 160ms ease-out,
      visibility 0s linear 160ms;
  }

  @media (prefers-reduced-motion: reduce) {
    .device-note {
      --note-arrive-ms: var(--arrive-ms, 200ms);
    }

    .line,
    .safe-note,
    .twin {
      transition: none;
    }
  }
</style>
