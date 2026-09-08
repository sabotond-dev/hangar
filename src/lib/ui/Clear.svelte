<!--
  CLEAR: the fourth write click, and the quietest of them (D-19, D-20, D-21;
  10-UI-SPEC 10.3, 10.4, 10.5 as amended by A-45 to A-52; SAFE-01, SAFE-03,
  SAFE-07, DEGR-02).

  One click sends. There is NO CONFIRMATION and there is no ClearConfirm
  component (A-45): CLEAR writes RAM only, so PUT BACK - the control directly
  above it in the column - restores the visitor's own configuration, and a
  power cycle brings back whatever is in flash. An action undone by its
  neighbour AND by unplugging the cable does not need a gate. KEEP ON DEVICE's
  confirmation is the site's only one, because that one is genuinely
  irreversible.

  WHAT IT WRITES IS NOT EMPTINESS (A-48, D-20). The store sends the firmware's
  own defaultConfig for the touch element - Setup 641, Timer 22, read from the
  pinned protocol package by event number - so after a clear the pad runs a
  proximity-weighted touch highlight rather than nothing. The line beneath the
  control says exactly that and never says clear, empty or remove; the string
  is install-copy's and its stems are scanned there.

  WHY IT IS THE QUIET TIER AND NOT A TIER OF ITS OWN (A-46). An earlier
  revision of this design gave CLEAR a fifth "Bare" tier with its own wide
  tracking and a second hairline above it. A tier with one member is not a
  hierarchy, it is a special case with a name, and A-41 had already had to
  carve an exception for it twice. So CLEAR takes the Quiet treatment verbatim,
  beside KEEP ON DEVICE: no border, no background, no radius, no inline
  padding, a Micro label at the site's ordinary 0.18em tracking in the quiet
  rung, to full ink on hover.

  THE HONEST CONSEQUENCE, STATED RATHER THAN BURIED (A-47): at rest, after a
  try-on, on a browser that can write, CLEAR and KEEP ON DEVICE LOOK THE SAME.
  Same tier, same weight, same colour, same tracking. Three channels separate
  them and two of the three are behaviour rather than appearance - the words,
  the enablement set, and the ceremony inverted (KEEP opens a block, CLEAR
  sends). That is acceptable on the facts and not on taste: CLEAR is the least
  consequential of the four writes, and the write that needed setting apart is
  the irreversible one, which still has its confirmation.

  WHY BOTH 44px AXES ARE DECLARED, AND WHY NEITHER IS REDUNDANT. padding-inline
  is 0, so the label's own text box sets the control's width, and CLEAR at
  12px/0.18em is well under 44px wide. min-inline-size is therefore what makes
  the target actually reachable by thumb, not decoration - and it is what
  device-ui.spec.ts's control walk requires on every interactive class it finds
  on a listed device component. Do not remove either one as redundant.

  WHY THE LINE CELL RESERVES 48px WHEN THE FORMULA SAYS 24px (A-52). Section
  12's rule is `ceil(longest / CH_PER_LINE) x 24` and CH_PER_LINE is 43,
  measured in Inter Variable by plan 10-01 rather than assumed. The four
  candidates are CLEAR_LINE at 41 and the three reasons at 43, 26 and 36, so
  the formula's own answer is one line and 24px. IT IS NOT TAKEN. A one-line
  cap of 43 would put a shipped string exactly on its own cap - the
  zero-headroom defect plan 10-01 flagged against the old 86-character
  CLEAR_LINE, reintroduced at a different number. THE SECOND LINE IS HEADROOM
  RATHER THAN OCCUPANCY, so CLEAR_CAP stays 86 and this cell stays 48px. A
  later reader who "corrects" this to 24px turns install-copy.spec.ts red,
  which is where the departure is asserted rather than merely commented.

  The mechanism is its two neighbours': one grid cell, every candidate at
  grid-area 1 / 1, the inactive ones visibility: hidden and aria-hidden. The
  reason is safety and not tidiness (Z-18) - a cell that changed height with
  its line would move the column's controls vertically under a hand already
  reaching for them.

  WHY THE LINE IS HELD THROUGH A WRITE (I3, rule 4). The store's clearReason()
  reads `no-session` for the `writing` phase - `writing` is outside
  WRITABLE_PHASES while the snapshot and the session are both still in hand -
  so a derived line would flip to the needs-a-ZONA sentence for as long as a
  40 ms RAM leg takes, which is both false and noise. The last non-writing
  reason is held in a local written from an effect, and the control is disabled
  through the leg regardless. The disabling is protective; the line does not
  have to explain it.

  WHY THE BUSY LABEL SWAPS WITH NO TRANSITION (Z-09). CLEARING… replaces CLEAR
  the instant install.clearToDefault() starts and is replaced the instant its
  one leg settles. A 140 ms crossfade on a 40 ms state renders as a smear
  rather than as a change, so the swap is instant by contract - nothing in this
  file animates, and the only transition is the hover colour, declared on the
  ENABLED control alone so the drop to the dim rung is instant too. The 2000 ms
  line is the store's and is rendered by region 3, not here.

  DEGR-02: PRESENT AND DISABLED, NEVER ABSENT. On a browser that cannot write,
  CLEAR renders with its `incapable` reason inline. It is deliberately unlike
  PUT BACK, which Z-12 makes absent - PUT BACK offers to restore a specific
  module's own configuration and has none to name, while CLEAR does something
  meaningful on any module, so there is a real capability to teach.

  A real `disabled` attribute with the line bound by aria-describedby, never
  aria-disabled alone. The accessible name is the visible label. Every string
  is install-copy's and the three reasons are iterated from its closed record,
  never retyped: a fourth reason is a type error there, and this file cannot
  disagree with it about the count.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { install } from "$lib/device/install.svelte";
  import {
    CLEARING_LABEL,
    CLEAR_LABEL,
    CLEAR_LINE,
    CLEAR_REASONS,
    type ClearReason,
  } from "$lib/device/install-copy";
  import { session } from "$lib/device/session.svelte";

  /** The session can write at all: its two capability phases say no. */
  const capable = $derived(
    session.phase !== "unsupported" && session.phase !== "insecure",
  );
  /** Why the control is disabled, or undefined when it is live - the store's one rule. */
  const reason = $derived(install.clearReason(capable));
  const writing = $derived(install.phase === "writing");
  /** The busy label belongs to a clear and to nothing else, through its one leg. */
  const busy = $derived(writing && install.action === "clear");
  const disabled = $derived(reason !== undefined || writing);

  /**
   * The line on screen: the reason, held through a write. Written from an
   * effect on the phase and read by the markup; the effect never reads it, so
   * there is no loop. See the header.
   */
  let held = $state<ClearReason | undefined>(undefined);
  $effect(() => {
    if (install.phase !== "writing") held = reason;
  });
  const shown = $derived(writing ? held : reason);

  /** The three reasons, from the closed record, in its order. */
  const REASONS = Object.entries(CLEAR_REASONS) as [ClearReason, string][];

  function clear(): void {
    void install.clearToDefault();
  }
</script>

<div class="clear">
  <button
    class="control"
    type="button"
    data-testid="clear"
    {disabled}
    aria-busy={busy ? "true" : undefined}
    aria-describedby="clear-line"
    onclick={clear}
  >
    {busy ? CLEARING_LABEL : CLEAR_LABEL}
  </button>

  <div class="cell" id="clear-line" data-testid="clear-line">
    <p
      class="line"
      class:twin={shown !== undefined}
      aria-hidden={shown !== undefined}
    >
      {CLEAR_LINE}
    </p>
    {#each REASONS as [key, text] (key)}
      <p class="line" class:twin={shown !== key} aria-hidden={shown !== key}>
        {text}
      </p>
    {/each}
  </div>
</div>

<style>
  .clear {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  /*
    Quiet tier (07-UI-SPEC, The control hierarchy; A-46), declaration for
    declaration KeepOnDevice.svelte's: the 44px floor on BOTH axes, no border,
    no background, no radius, no inline padding, Micro label in the quiet rung
    at the site's ordinary 0.18em, to full ink on hover. Never a fill and never
    a border - the accent is the primary's and the hairline is the secondary
    tier's, and A-41's no-pill rule now protects two controls rather than one.

    min-inline-size IS NOT REDUNDANT HERE. padding-inline is 0, so the label
    sets the box and CLEAR is well under 44px wide. See the header.
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
    alone so that disabling for a write - and the busy label that arrives with
    it - is instant. The same rule PUT BACK and KEEP ON DEVICE keep, so the
    column's controls behave as one.
  */
  .control:not(:disabled) {
    transition: color 140ms ease-out;
  }

  .control:hover:not(:disabled) {
    color: var(--color-ink);
  }

  /* Disabled: the label to the dim rung, a real attribute. */
  .control:disabled {
    color: var(--color-ink-dim);
    cursor: not-allowed;
  }

  /*
    THE RESERVED LINE CELL: one grid cell, four strings at 1 / 1, a 48px floor
    whose SECOND LINE IS HEADROOM AND NOT OCCUPANCY (A-52). The header carries
    the arithmetic and the reason the formula's 24px is refused; KeepOnDevice's
    cell is its sibling and TryOnDevice's honesty slot the original.
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
