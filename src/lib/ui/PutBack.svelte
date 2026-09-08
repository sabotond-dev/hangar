<!--
  PUT BACK: the way back (07-UI-SPEC, PUT BACK; SAFE-04, SAFE-09; Z-12, Z-18).

  The secondary restore control and the one Body line beneath it. It reads two
  singletons - the install store for putBackState(), phase, action and
  keptThisSession, the session for nothing it does not already know through
  the store - takes no props, and knows nothing about a port: the click is
  install.putBack(), which writes the snapshot's two strings through the same
  Timer-then-Setup sequence as TRY ON DEVICE and, after a keep this session,
  follows with a store (Z-04). No confirmation stands in front of it, because
  putting the owner's own work back is the direction that needs no gate.

  WHEN IT IS NOT ON THE SCREEN AT ALL. putBackState() `absent` renders nothing -
  not a disabled control (Z-12): PUT BACK restores a SPECIFIC module's own
  configuration, and on a browser or a session that has never seen a module
  there is no configuration for it to name. DEGR-02's present-but-disabled rule
  is carried by TRY ON DEVICE and KEEP ON DEVICE, which can explain themselves;
  a disabled control offering to restore nothing is a worse answer than none.
  `needs-zona` IS rendered, disabled, with its line - SAFE-09's "still offered"
  means present and visibly waiting for the session to come back.

  WHY THE LINE CELL RESERVES 72px, AND WHY ALL THREE STRINGS ARE ALWAYS IN IT.
  This is Phase 5's honesty-slot mechanism, copied declaration for declaration
  from TryOnDevice.svelte: a one-cell grid, every candidate string at
  grid-area 1 / 1, the inactive ones visibility: hidden and aria-hidden, and a
  72px floor - three Body lines at 16px/1.5, the height the longest string
  (101 characters, 43 to a line at the 372px column) needs. The cell is
  therefore the height of the TALLEST of the three at whatever width the panel
  actually is, and it is that height in every state. The reason is safety
  rather than tidiness (Z-18): the destructive control, KEEP ON DEVICE, sits
  DIRECTLY BENEATH this cell in the install column, and this line changes
  after a keep (its second form) and when the session drops (its third). A
  cell that changed height with its line would move the site's only
  irreversible control vertically under a hand already reaching for it.
  install-copy.spec.ts holds every one of the three under PUT_BACK_CAP so the
  reservation cannot silently grow.

  WHY THE BUSY LABEL SWAPS WITH NO TRANSITION. `PUTTING BACK…` replaces
  `PUT BACK` the instant install.putBack() starts and is replaced the instant
  its last leg settles. A RAM leg is roughly 40 ms end to end; a 140 ms
  crossfade on a 40 ms state renders as a smear rather than as a change, so the
  swap is instant by contract (07-UI-SPEC, Motion) and the store leg gets the
  same treatment so the three busy labels on the panel behave as one. The only
  transition on the control is the hover colour, and it is declared on the
  ENABLED control alone, so the colour drop to the dim rung when the control
  disables for a write is instant too. The box grows with the longer word;
  nothing sits beside it in the column, so nothing else moves, and the line
  cell's height does not change.

  WHAT `writing` DOES HERE. On a put-back (action `put-back`) this control is
  disabled and carries the busy label with aria-busy through BOTH of its legs -
  there is no fourth label for the store leg. On any other action it is
  disabled with its resting label. In neither case is the LINE swapped (I3,
  rule 4): a sentence that appears and disappears inside 40 ms is noise, and
  the disabling is protective rather than explanatory. The line is derived from
  keptThisSession and putBackState() alone, and neither moves while a write is
  in flight, so it holds by construction.

  Disabled is a real `disabled` attribute with the line bound by
  aria-describedby - never aria-disabled alone. The accessible name is the
  visible label; there is no aria-label. Every string comes from install-copy;
  none is retyped here. The three static specifiers are permitted paths of the
  chunk guard (config-shape.spec.ts test 13), which plan 07-09 proved bites
  from inside this file.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { install } from "$lib/device/install.svelte";
  import {
    PUT_BACK_LABEL,
    PUT_BACK_LINE,
    PUT_BACK_LINE_AFTER_KEEP,
    PUT_BACK_NEEDS_ZONA,
    PUTTING_BACK_LABEL,
  } from "$lib/device/install-copy";

  /** absent, needs-zona or enabled - the store's decision, read every time. */
  const state = $derived(install.putBackState());
  const writing = $derived(install.phase === "writing");
  /** The busy label belongs to a put-back and to nothing else, through both of its legs. */
  const busy = $derived(writing && install.action === "put-back");
  const disabled = $derived(state === "needs-zona" || writing);

  /**
   * Which of the three strings is the visible one. The other two stay
   * rendered as sizing twins - see the style block and the header.
   */
  const shown: "line" | "after-keep" | "needs-zona" = $derived(
    state === "needs-zona"
      ? "needs-zona"
      : install.keptThisSession
        ? "after-keep"
        : "line",
  );

  function putBack(): void {
    void install.putBack();
  }
</script>

{#if state !== "absent"}
  <div class="put-back">
    <button
      class="control"
      type="button"
      data-testid="put-back"
      {disabled}
      aria-busy={busy ? "true" : undefined}
      aria-describedby="put-back-line"
      onclick={putBack}
    >
      {busy ? PUTTING_BACK_LABEL : PUT_BACK_LABEL}
    </button>

    <div class="cell" id="put-back-line" data-testid="put-back-line">
      <p
        class="line"
        class:twin={shown !== "line"}
        aria-hidden={shown !== "line"}
      >
        {PUT_BACK_LINE}
      </p>
      <p
        class="line"
        class:twin={shown !== "after-keep"}
        aria-hidden={shown !== "after-keep"}
      >
        {PUT_BACK_LINE_AFTER_KEEP}
      </p>
      <p
        class="line"
        class:twin={shown !== "needs-zona"}
        aria-hidden={shown !== "needs-zona"}
      >
        {PUT_BACK_NEEDS_ZONA}
      </p>
    </div>
  </div>
{/if}

<style>
  /*
    The cell appears once per session, when the snapshot lands: 160ms of
    opacity and nothing else (07-UI-SPEC, Motion). It never animates height.
  */
  .put-back {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    animation: fade-in 160ms linear;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /*
    Secondary tier (07-UI-SPEC, The control hierarchy): auto width, the 44px
    floor on both axes, a hairline border, Micro label at full ink. Never a
    fill - the accent is the primary's alone.
  */
  .control {
    appearance: none;
    display: inline-flex;
    align-items: center;
    inline-size: fit-content;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-line);
    border-radius: 6px;
    background: transparent;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink);
    cursor: pointer;
  }

  /*
    The hover colour is the ONLY transition, and it is declared on the enabled
    control alone so that disabling for a write - and the busy label that
    arrives with it - is instant. See the header.
  */
  .control:not(:disabled) {
    transition:
      color 140ms ease-out,
      border-color 140ms ease-out;
  }

  .control:hover:not(:disabled) {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  /* Disabled: the label to the dim rung, the border unchanged, a real attribute. */
  .control:disabled {
    color: var(--color-ink-dim);
    cursor: not-allowed;
  }

  /*
    THE RESERVED LINE CELL: one grid cell, three strings at 1 / 1, a 72px
    floor. The header says why; TryOnDevice.svelte's honesty slot is the
    original of this mechanism and the two are kept declaration for
    declaration.

    THE REASON IT EXISTS IS SAFETY, NOT TIDINESS (Z-18). This line changes
    after a keep, KEEP ON DEVICE's changes when a knob moves, and CLEAR's will
    change with the session. Any of them changing line count would shift the
    site's destructive controls vertically UNDER A HAND ALREADY REACHING FOR
    THEM.

    RE-DERIVED BY PLAN 10-03 AND UNCHANGED IN PIXELS. A reservation is
    `ceil(longest / CH_PER_LINE) x 24`; CH_PER_LINE is 43, measured in Inter
    Variable by plan 10-01 rather than assumed. The longest of the three is
    PUT_BACK_LINE_AFTER_KEEP at 101, and `ceil(101 / 43) x 24 = 72`. The face
    changed under this cell and the number did not move - which is a result,
    not a coincidence, and it is stated rather than left to be re-derived by
    the next reader. PUT_BACK_CAP is 3 x 43 = 129, also unchanged.
  */
  .cell {
    display: grid;
    margin-block-start: 8px;
    min-block-size: 72px;
  }

  /* Body role, quiet: the control's own line. */
  .line {
    grid-area: 1 / 1;
    margin: 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  .twin {
    visibility: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    .put-back {
      animation: none;
    }

    .control:not(:disabled) {
      transition: none;
    }
  }
</style>
