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
  72px floor - three Body lines at 16px/1.5. The cell is therefore the height
  of the TALLEST of the three at whatever width the panel actually is, and it
  is that height in every state. The reason is safety rather than tidiness
  (Z-18): the destructive control, Store on ZONA, sits DIRECTLY BENEATH this
  cell in the install column, and this line changes after a store (its second
  form) and when the session drops (its third). A cell that changed height
  with its line would move the site's only irreversible control vertically
  under a hand already reaching for it. The three are the twins themselves,
  rendered; the measured cap that once held them (PUT_BACK_CAP, 129) retired
  with 13-18 - install-copy.ts's header says what it was and what replaced it.

  WHY THE BUSY LABEL SWAPS WITH NO TRANSITION. `Putting Page 2 back…` replaces
  `Put back` the instant install.putBack() starts and is replaced the instant
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
  visible label; there is no aria-label. Every string comes from install-copy
  or, since 13-12, from page-target.ts; none is retyped here. The static
  specifiers are permitted paths of the chunk guard (config-shape.spec.ts
  test 13), which plan 07-09 proved bites from inside this file.

  PUT BACK NAMES ITS PAGE BEFORE IT ACTS (Phase 13, plan 13-12; 13-CONTEXT
  D-06, fourth clause). While a snapshot is in hand the line under the control
  is page-target.ts's putBackPageLine - "Puts Page 2 back to what it was
  playing when you connected." - and its after-store form. Phase 10's two
  page-less lines retired with 13-18 (D-23, batch row I.3.4): a snapshot
  always has a page, so the fallback they served was unreachable, and the
  three twins in the cell are the whole of what the control can say. The
  label is `Put back` and its busy form names the page (I.3.2, I.3.3).
  THE CONTROL IS ALSO DISABLED WHILE THE PAGE TARGET IS NOT AT REST -
  install.applyReady false, the store's one condition mirrored - because a
  put-back sent while a switch is pending would land on a page about to stop
  being the active one, and the store refuses it anyway (install.putBack).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { install } from "$lib/device/install.svelte";
  import {
    PUT_BACK_LABEL,
    PUT_BACK_NEEDS_ZONA,
    puttingBackLabel,
  } from "$lib/device/install-copy";
  import {
    putBackPageLine,
    putBackPageLineAfterKeep,
  } from "$lib/device/page-target";

  /** absent, needs-zona or enabled - the store's decision, read every time. */
  const state = $derived(install.putBackState());
  const writing = $derived(install.phase === "writing");
  /** The busy label belongs to a put-back and to nothing else, through both of its legs. */
  const busy = $derived(writing && install.action === "put-back");
  /** And not while the page target is pending (13-12): the store's one condition, mirrored. */
  const disabled = $derived(
    state === "needs-zona" ||
      writing ||
      (state === "enabled" && !install.applyReady),
  );
  /**
   * The page the snapshot in hand names - the page Put back will restore, as
   * the module reports it (the copy adds one). Undefined only before a
   * snapshot exists, when the control is absent or reads its needs-zona line,
   * so the 0 the builders are handed below is never a page a visitor reads.
   */
  const page = $derived(install.snapshotPage ?? 0);

  /**
   * Which of the three strings is the visible one. The other two stay
   * rendered as sizing twins - see the style block and the header.
   */
  const shown: "needs-zona" | "page" | "page-after-keep" = $derived(
    state === "needs-zona"
      ? "needs-zona"
      : install.keptThisSession
        ? "page-after-keep"
        : "page",
  );

  function putBack(): void {
    void install.putBack();
  }
</script>

{#if state !== "absent"}
  <div class="put-back">
    <button
      class="control pill"
      type="button"
      data-testid="put-back"
      {disabled}
      aria-busy={busy ? "true" : undefined}
      aria-describedby="put-back-line"
      onclick={putBack}
    >
      {busy ? puttingBackLabel(page) : PUT_BACK_LABEL}
    </button>

    <div class="cell" id="put-back-line" data-testid="put-back-line">
      <p
        class="line"
        class:twin={shown !== "needs-zona"}
        aria-hidden={shown !== "needs-zona"}
      >
        {PUT_BACK_NEEDS_ZONA}
      </p>
      <!-- 13-12: the page named before the click (D-06). Twins like the three above. -->
      <p
        class="line"
        class:twin={shown !== "page"}
        aria-hidden={shown !== "page"}
        data-testid="put-back-page-line"
      >
        {putBackPageLine(page)}
      </p>
      <p
        class="line"
        class:twin={shown !== "page-after-keep"}
        aria-hidden={shown !== "page-after-keep"}
      >
        {putBackPageLineAfterKeep(page)}
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

    THE BORDER, THE RADIUS AND THE FILL ARE src/app.css's .pill NOW (10-UI-SPEC
    19.1b, A-41), applied by the class on the button above rather than restated
    here: eleven controls each authoring the same three declarations is eleven
    places for one shape to drift. THE 44px FLOOR STAYS, on both axes, because
    Phase 4's touch floor is a property of THIS CONTROL rather than of the shape
    it wears - device-ui.spec.ts's install-leaf walk reads it off this rule, and
    it would still have to be true if the pill were taken away tomorrow.
  */
  .control {
    appearance: none;
    display: inline-flex;
    align-items: center;
    inline-size: fit-content;
    min-block-size: 44px;
    min-inline-size: 44px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.01em;
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
    border-color: var(--color-action);
    color: var(--color-action);
  }

  /* Disabled: the label to the dim rung, the border unchanged, a real attribute. */
  .control:disabled {
    color: var(--color-ink-quiet);
    cursor: not-allowed;
  }

  /*
    THE RESERVED LINE CELL: one grid cell, three strings at 1 / 1, a 72px
    floor. The header says why; TryOnDevice.svelte's honesty slot is the
    original of this mechanism and the two are kept declaration for
    declaration.

    THE REASON IT EXISTS IS SAFETY, NOT TIDINESS (Z-18). This line changes
    after a store, Store on ZONA's changes when a knob moves, and the reset's
    will change with the session. Any of them changing line count would shift
    the site's destructive controls vertically UNDER A HAND ALREADY REACHING
    FOR THEM.

    RE-DERIVED BY PLAN 10-03 AND UNCHANGED IN PIXELS: a reservation of three
    Body lines, `3 x 24 = 72`. The measured cap that once governed the strings
    in it (PUT_BACK_CAP, 3 x 43 = 129) retired with 13-18 under D-05; the
    floor stays because the twins are rendered and the tallest of them sets
    the height, which is the mechanism, not the number.
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
