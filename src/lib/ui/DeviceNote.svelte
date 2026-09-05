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

  THE RESERVATION IS MEASURED, NEVER ASSERTED IN PIXELS. Two Body paragraphs,
  8px apart. The first is a one-cell grid holding EVERY string the line can
  ever show - the pre-click explainer, the reconnect offer, the three S3
  status lines - with the non-current ones `visibility: hidden` and
  aria-hidden; the second is the SAFE-01 sentence, also kept as a twin in the
  states that do not show it. The region's height is therefore whatever the
  browser measures at the current width, identical in every state, so no
  session transition can move the headline or the coverflow beneath it.
  Phase 5's honesty slot (TryOnDevice.svelte) is the pattern, unchanged. At
  the 372px column the spec's arithmetic gives 3 + 3 line boxes + 8px =
  152px; 06-09-SUMMARY.md records what the browser measured.

  STATE BY STATE. `starting` is S1 (session-copy's slotStateOf), so this is
  the row the PRERENDERED page ships: explainer over promise. S1 / S7 the
  same; S2 the reconnect offer over the promise; S3 the current status line
  over an empty, height-held second cell; S4, S5 and S6 empty with the height
  held, because that copy is in the disclosure. S0a and S0b render NOTHING,
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
  show, which in this phase is TWO - the S1 / S7 pre-click explainer and the
  S3 status line, both rendered by the panel's connect-state region (plan
  06-12) - and the list is expected to stay at two. In both cases the note
  keeps rendering its sizing twin, so its height is unchanged and nothing
  below the header moves when a panel opens or closes; only the visible text
  goes. One input, not two special cases.

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
    SAFE_PROMISE,
    STATUS_CHOOSING,
    STATUS_IDENTIFYING,
    STATUS_OPENING,
    slotStateOf,
  } from "$lib/device/session-copy";
  import PickerExplainer from "./PickerExplainer.svelte";

  let {
    covered = false,
    panelOwnsProse = false,
  }: {
    /** True while the splash covers the row. Carries the wordmark's treatment verbatim. */
    covered?: boolean;
    /**
     * True while the chosen panel is open and rendering the session's prose
     * (Y-11). The note keeps its sizing twins and its height; only the
     * visible text goes, so nothing below the header moves when a panel
     * opens or closes. Two lines are affected: the S1/S7 pre-click
     * explanation and the S3 status line.
     */
    panelOwnsProse?: boolean;
  } = $props();

  /** The first paragraph's candidates, by name, so a test reads which one is current without inferring it from visibility. */
  type Line =
    | "explainer"
    | "offer"
    | "choosing"
    | "opening"
    | "identifying"
    | "none";

  const slot = $derived(slotStateOf(session.phase));

  /** S0a and S0b render nothing at all - see the header. */
  const rendered = $derived(slot !== "S0a" && slot !== "S0b");

  /** Which candidate of the first cell is visible; every other one is a twin. */
  const line: Line = $derived.by(() => {
    switch (slot) {
      case "S1":
      case "S7":
        return panelOwnsProse ? "none" : "explainer";
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

  /** The SAFE-01 sentence shows in the three not-connected resting states and holds its height in the rest. */
  const safeShown = $derived(slot === "S1" || slot === "S2" || slot === "S7");

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
      <div
        class="line"
        class:twin={line !== "explainer"}
        aria-hidden={hidden(line !== "explainer")}
      >
        <PickerExplainer />
      </div>
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
    <p
      class="line safe"
      data-testid="device-note-safe"
      class:twin={!safeShown}
      aria-hidden={hidden(!safeShown)}
    >
      {SAFE_PROMISE}
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
    .twin {
      transition: none;
    }
  }
</style>
