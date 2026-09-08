<!--
  The header note: the inline region beneath the header row that says, with
  no click at all, what the picker is and that nothing is ever written
  (06-UI-SPEC, The header note; Y-23; D-16).

  WHY IT EXISTS. In S1, S2 and S7 the device slot is a plain button that
  connects, so its explanation cannot hang off it: a control that both acts
  and expands lies about one of its two jobs. The copy therefore sits here,
  in a region of its own, on the one surface that exists on every route. It
  costs a reserved header height on every capable browser for the whole visit,
  and it buys CONN-03's explanation and SAFE-01's promise read without a click.
  That trade is 06-UI-SPEC's open question 7, made rather than assumed.

  THE RESERVATION IS MEASURED, AND SINCE PLAN 10-03 IT IS ONE CELL. Phase 6
  and 7 shipped two Body paragraphs 8px apart: a one-cell grid over every
  string the first line could show, and beneath it the SAFE-01 sentence, also
  kept as a twin in the states that did not show it. 06-UI-SPEC's arithmetic
  at the 372px column was 3 + 3 line boxes + 8px = 152px.

  R-02 retires PICKER_EXPLAINER (130) and R-03 moves SAFE-01's guarantee out
  of a paragraph and onto the control as SAFE_NOTE, so BOTH of those cells
  go. What is left in the swapping cell is the reconnect offer at 37 and the
  three S3 status lines at 36, 17 and 25 - every one of them one line box at
  the measured CH_PER_LINE of 43 (10-01-SUMMARY.md, thirty-six full line
  boxes in two engines). The cell is therefore
  `ceil(37 / 43) x 24 = 24px`, one line, and that is the largest single
  reduction in the phase: 152px to 24px. The candidates still all sit at
  `grid-area: 1 / 1` with the non-current ones `visibility: hidden` and
  aria-hidden, so the height is still identical in every state and no session
  transition can move the headline or the coverflow beneath it. Phase 5's
  honesty slot (TryOnDevice.svelte) is the pattern, unchanged.

  SAFE_NOTE IS NOT PART OF THAT RESERVATION. It is a fixed 14px Micro line
  beneath the cell, 8px away: unconditional, never swapped, and with nothing
  ever rendered in its place. It costs one line box permanently and nothing
  variable - see session-copy.ts's contract block on the constant.

  STATE BY STATE. `starting` is S1 (session-copy's slotStateOf), so this is
  the row the PRERENDERED page ships: an empty held cell over SAFE_NOTE. S1 /
  S7 the same; S2 the reconnect offer; S3 the current status line; S4, S5 and
  S6 empty with the height held, because that copy is in the disclosure. In
  every one of those seven, SAFE_NOTE is on the screen. S0a and S0b render
  NOTHING,
  with no reservation: capability is decided synchronously before the first
  hydrated paint and cannot change during the visit, so those two states are
  terminal, there is no picker to explain, and a visitor on a browser that
  cannot connect pays nothing for this region. The prerendered document
  always carries the note, and hydration removes it exactly once, in the
  first hydrated frame, on those two browsers - a removal, not an absence,
  which is why a browser-side assertion about the note's absence has to wait
  for a hydration marker first (plan 06-10's DeviceSlot data-hydrated).

  THE NEVER-BOTH RULE IS ABOUT SURFACES (Y-11). When the chosen panel is
  open it owns the session's prose and this note holds the space without
  speaking. `panelOwnsProse` covers every line the two surfaces can both
  show. Through Phases 6 and 7 that was TWO - the S1 / S7 pre-click explainer
  and the S3 status line, both rendered by the panel's connect-state region
  (plan 06-12). Plan 10-03 retires the explainer and adds SAFE_NOTE, which
  the panel also renders, so it is two again: the S3 status line and
  SAFE_NOTE. In both cases the note keeps rendering the hidden line, so its
  height is unchanged and nothing below the header moves when a panel opens
  or closes; only the visible text goes. One input, not two special cases.

  SAFE_NOTE'S HIDDEN FORM IS THE NEVER-BOTH RULE, NOT A SIZING TWIN, and the
  difference is worth writing down. A sizing twin exists because SOMETHING
  ELSE will be swapped into its cell and the taller candidate has to have
  reserved the room. Nothing is ever swapped into SAFE_NOTE's line: it is
  hidden here for exactly one reason, that the panel is saying the same
  sentence eight pixels lower down, and it holds its own height while it is
  hidden so the header does not jump when a panel opens. The panel's copy,
  the one beneath the primary control, is unconditional and has no hidden
  sibling at all - device-ui.spec.ts asserts that over TryOnDevice.svelte.

  NOT A LIVE REGION, AND IT NEVER ANNOUNCES. It changes with the session, and
  the session already speaks once through SessionAnnouncer.svelte; marking
  this polite would say every transition twice. No heading, no control, no
  tab stop, no border, no ground, no icon, no accent: it is prose under a
  control.

  GEOMETRY AND MOTION. `inline-size: min(372px, 100%)` - Phase 4's panel
  content column, reused so one sentence wraps to the same three lines in
  both surfaces - pushed to the right edge so it sits flush with the device
  slot's, with the text left-aligned inside it. Line changes are 160ms
  ease-out on opacity only; the height never animates because it never
  changes. On / it carries the wordmark's `.covered` treatment verbatim:
  opacity 0 with no transition while the splash covers the row, then up to
  1 across the dissolve on the front door's own --arrive-ms.

  EVERY STRING COMES FROM session-copy AND NONE IS RETYPED HERE. Both
  specifiers below are on the chunk guard's permitted list
  (src/lib/config-shape.spec.ts test 13); the session and its copy module
  are free of the protocol package, which is what lets a header component
  name them on the first paint of /.

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
    /**
     * True while the chosen panel is open and rendering the session's prose
     * (Y-11). The note keeps its hidden lines and its height; only the
     * visible text goes, so nothing below the header moves when a panel
     * opens or closes. Two lines are affected: the S3 status line and
     * SAFE_NOTE.
     */
    panelOwnsProse?: boolean;
  } = $props();

  /** The first paragraph's candidates, by name, so a test reads which one is current without inferring it from visibility. */
  type Line = "offer" | "choosing" | "opening" | "identifying" | "none";

  const slot = $derived(slotStateOf(session.phase));

  /** S0a and S0b render nothing at all - see the header. */
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
    <!--
      SAFE-01, on the screen in every state this note renders in. It is hidden
      only while the chosen panel is saying the same sentence beneath its own
      primary (the never-both rule), and it holds its height while hidden so
      opening a panel does not move the coverflow.
    -->
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
  /*
    Two rows, 8px apart (Phase 4's `sm`), at the panel's 372px content
    column, flush with the right edge of whatever row sits above. The
    --arrive-ms is the front door's dissolve; the fallback is its full-motion
    value so the treatment is the same where no front door declares it.
  */
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

  /*
    Held at nothing while the splash owns the screen, and NOT transitioned
    into that state - absent from the very first painted frame rather than
    faded out of one. The wordmark's declaration, verbatim.
  */
  .device-note.covered {
    opacity: 0;
    transition: none;
  }

  /* The one-cell grid: every candidate of the first line in the same cell. */
  .cell {
    display: grid;
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

  /*
    SAFE_NOTE, and it is NOT one of the lines above. Micro (title): 12px, 600,
    a 14px line box, 0.01em, sentence case, in --color-ink at 9.26:1 rather
    than --color-ink-quiet, because a safety statement is not quiet and the
    honesty prose beneath it already is. No grid-area: it is the note's second
    row, 8px below the cell, with nothing ever rendered in its place - so it
    reserves nothing and costs exactly one 14px line box, permanently.
  */
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

  /*
    A twin holds the height and nothing else: out of the accessibility tree
    by visibility (aria-hidden makes that explicit), out of sight by opacity,
    and its visibility flips only after its fade so a line change is a fade
    and never a cut.
  */
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
