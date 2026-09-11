<!--
  KEEP ON DEVICE in the install row: the quietest control on the panel, and
  the one that opens the site's only confirmation (SAFE-02, SAFE-05; 07-UI-SPEC
  The control hierarchy, Region 6; Z-02, Z-05, Z-18, Z-21).

  It is the genuinely destructive control - the store it leads to writes the
  configuration into the module's own flash, so it survives a power cycle and
  replaces whatever the owner had there - and since plan 07-10 it can be
  clicked. Its click does not write: it calls install.openConfirm(), and the
  panel renders KeepConfirm IN THIS CONTROL'S PLACE, so the row's KEEP ON
  DEVICE and the confirmation's are never on the screen together and a
  speech-input user saying "click KEEP ON DEVICE" is never ambiguous. The
  bordered control inside the block is the one that commits.

  WHY IT IS THE QUIET TIER (Z-02). In Phases 4 to 6 this was a bordered
  control that could not be clicked; now it can, and it writes flash, so it
  becomes the quietest thing on the panel and spends its weight inside the
  confirmation, where the visitor has already chosen to be deliberate. No
  border, no background, no inline padding, a quiet label that comes to full
  ink on hover. Phase 4's rule survives and gets stronger: the two install
  controls are never the same size, never the same fill and never adjacent -
  they are now three tiers apart with a hairline, the tuning region and PUT
  BACK between them.

  WHY THE LINE CELL RESERVES 48px AND HOLDS ALL SEVEN STRINGS (Z-18). The
  enabled line and all six reasons are rendered at grid-area 1 / 1, the
  inactive ones visibility: hidden and aria-hidden, under a 48px floor - two
  Body lines at 16px/1.5, the height the longest string (82 characters, 43 to a
  line at the 372px column) needs. So the cell is the height of the TALLEST of
  the seven at whatever width the panel actually is, in every state. The line
  changes the moment a knob moves after a try-on (Z-05: the reason becomes
  "the knobs moved since the last try-on"), and a cell that changed height
  with its line would move the site's only irreversible control vertically
  under a hand already reaching for it. install-copy.spec.ts holds every one
  of the seven under KEEP_CAP so the reservation cannot silently grow. The six
  reasons are iterated from install-copy's closed record, never retyped: a
  seventh reason is a type error there, and this file cannot disagree with
  it about the count.

  WHY THE LINE IS HELD THROUGH A WRITE (I3, rule 4). The store's keepReason()
  reads `never-tried` for the `writing` phase, so during the confirmation's
  own store leg - the only leg where this control is on the screen because
  of a click on it - a derived line would flip to "Available after a try-on."
  for as long as the store takes, while the primary reads KEEPING…. Region 3
  does not swap a block during a write and this cell does not swap a line:
  the last non-writing reason is held in a local written from an effect, and
  the control is disabled through the leg regardless. The disabling is
  protective; the line does not have to explain it.

  A real `disabled` attribute with the line bound by aria-describedby, never
  aria-disabled alone: the reason exists to be read, and an aria-disabled
  button still takes a click and still has to invent something to do with it.
  The accessible name is the visible label. Every string is install-copy's.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { install } from "$lib/device/install.svelte";
  import {
    KEEP_LABEL,
    KEEP_LINE_ENABLED,
    KEEP_REASONS,
    type KeepReason,
  } from "$lib/device/install-copy";
  import { session } from "$lib/device/session.svelte";

  /** The session can write at all: its two capability phases say no. */
  const capable = $derived(
    session.phase !== "unsupported" && session.phase !== "insecure",
  );
  /** Why the control is disabled, or undefined when it is live - the store's seven-row table. */
  const reason = $derived(install.keepReason(capable));
  const writing = $derived(install.phase === "writing");
  const disabled = $derived(reason !== undefined || writing);

  /**
   * The line on screen: the reason, held through a write. Written from an
   * effect on the phase and read by the markup; the effect never reads it, so
   * there is no loop. See the header.
   */
  let held = $state<KeepReason | undefined>(undefined);
  $effect(() => {
    if (install.phase !== "writing") held = reason;
  });
  const shown = $derived(writing ? held : reason);

  /** The six reasons, from the closed record, in its order. */
  const REASONS = Object.entries(KEEP_REASONS) as [KeepReason, string][];

  let button = $state<HTMLButtonElement | null>(null);

  /**
   * The panel's focus return after the confirmation closes. True when this
   * control took focus; false when it is disabled and cannot hold it - after
   * a commit, a knob move or a session drop - so the panel sends focus to
   * region 3 instead (07-UI-SPEC, Focus management).
   */
  export function focus(): boolean {
    if (!button || button.disabled) return false;
    button.focus();
    return true;
  }

  function open(): void {
    install.openConfirm();
  }
</script>

<div class="keep">
  <button
    bind:this={button}
    class="control"
    type="button"
    data-testid="keep-on-device"
    {disabled}
    aria-describedby="keep-on-device-line"
    onclick={open}
  >
    {KEEP_LABEL}
  </button>

  <div class="cell" id="keep-on-device-line" data-testid="keep-on-device-line">
    <p
      class="line"
      class:twin={shown !== undefined}
      aria-hidden={shown !== undefined}
    >
      {KEEP_LINE_ENABLED}
    </p>
    {#each REASONS as [key, text] (key)}
      <p class="line" class:twin={shown !== key} aria-hidden={shown !== key}>
        {text}
      </p>
    {/each}
  </div>
</div>

<style>
  .keep {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  /*
    Quiet tier (07-UI-SPEC, The control hierarchy): auto width, the 44px floor
    on both axes, no border, no background, no inline padding, Micro label in
    the quiet rung, to full ink on hover. Never a fill and never a border - the
    accent is the primary's and the hairline is the secondary tier's.
  */
  .control {
    appearance: none;
    display: inline-flex;
    align-items: center;
    inline-size: fit-content;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 0;
    border: 0;
    background: transparent;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
    cursor: pointer;
  }

  /*
    The hover colour is the ONLY transition, declared on the enabled control
    alone so that disabling for a write is instant - the same rule PUT BACK
    keeps, so the row's controls behave as one.
  */
  .control:not(:disabled) {
    transition: color 140ms ease-out;
  }

  .control:hover:not(:disabled) {
    color: var(--color-ink);
  }

  /* Disabled: the label to the dim rung, a real attribute. */
  .control:disabled {
    color: var(--color-ink-quiet);
    cursor: not-allowed;
  }

  /*
    THE RESERVED LINE CELL: one grid cell, seven strings at 1 / 1, a 48px
    floor. The header says why; TryOnDevice.svelte's honesty slot is the
    original of this mechanism and PutBack.svelte's cell its sibling.

    THE REASON IT EXISTS IS SAFETY, NOT TIDINESS (Z-18). This line changes when
    a knob moves, PUT BACK's changes after a keep, and CLEAR's will change with
    the session. Any of them changing line count would shift the site's
    destructive controls vertically UNDER A HAND ALREADY REACHING FOR THEM.

    RE-DERIVED BY PLAN 10-03 AND UNCHANGED IN PIXELS. A reservation is
    `ceil(longest / CH_PER_LINE) x 24`; CH_PER_LINE is 43, measured in Inter
    Variable by plan 10-01 rather than assumed. The longest of the seven is the
    enabled line at 82, and `ceil(82 / 43) x 24 = 48`. The six reasons are 69,
    69, 62, 42, 36 and 25, all shorter. KEEP_CAP is 2 x 43 = 86, unchanged.
  */
  .cell {
    display: grid;
    margin-block-start: 8px;
    min-block-size: 48px;
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
    .control:not(:disabled) {
      transition: none;
    }
  }
</style>
