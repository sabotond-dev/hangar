<!--
  The panel that appears when a visitor chooses the centre pad. D-05: that is
  the whole point of the front door, and nothing about the device exists on the
  page until it happens.

  This component owns LAYOUT and one focus rule, and nothing else. The primary
  control, the honesty line and the connect-state region are one snippet handed
  in by the caller, so the state machine that touches a port lives in
  TryOnDevice.svelte and the box it sits in lives here. Top to bottom the panel
  is D-08's order, and Phases 5 and 7 dock into it without moving anything:

    1. the primary control            these three are the caller's snippet
    2. the honesty line
    3. the connect-state region
    4. the reserved tuning region     the caller's `tuning` snippet (Phase 5)
    5. a 24px gap, a hairline, 24px
    6. the NEXT caption               one Micro word (plan 10-13)
       the install row, ONE COLUMN    PUT BACK, KEEP ON DEVICE (or the
                                      confirmation in its place), CLEAR, then
                                      the caller's `share` snippet (Phases 7
                                      and 10)

  THE SEQUENCE IS A CAPTION, AN ORDER AND AN ENABLEMENT - NEVER THREE EQUAL
  BUTTONS IN A ROW (D-04, 10-UI-SPEC 10.2). D-04 asked the install controls to
  read as one natural sequence, and SAFE-02's whole content is that TRY ON
  DEVICE and KEEP ON DEVICE are never equal-weight. Both are honoured because
  the sequence is carried on three channels, none of which is weight:

    A CAPTION. NEXT, one word, Micro, in the quiet rung, directly under the
    hairline this panel has had since Phase 7. It converts "three controls
    that happen to sit together" into "what happens after", and it reads right
    before a try-on too: it is what comes next.

    DOM AND VISUAL ORDER. PUT BACK, KEEP ON DEVICE, CLEAR, COPY LINK, at the
    16px rhythm, one layout at every width. Unchanged from Z-03 except for
    CLEAR joining it.

    ENABLEMENT CHOREOGRAPHY, and it is the strongest of the three because it
    already existed. Before a try-on everything under NEXT is disabled with
    its own reason in its own cell; the instant `settled` lands, PUT BACK and
    KEEP ON DEVICE go live together. That transition IS the sequence, and it
    is behaviour rather than decoration.

  So there are NO step numerals, no connecting rule or bracket, no progress
  indicator, no shared background, no equalised widths and no accent on any
  sequence marker. And there is NO SECOND HAIRLINE: an earlier revision put
  CLEAR in a fifth "Bare" tier below a rule of its own, and A-46 retired the
  tier and the rule together. CLEAR joins the existing column under the one
  hairline Phase 7 gave region 6, at the same 16px rhythm as its neighbours.

  THE RESERVED REGION'S HEIGHT IS LOAD-BEARING, NOT DECORATIVE, AND 152px IS A
  FLOOR RATHER THAN A CEILING - which is what min-block-size already said in the
  shipped CSS. Phase 4 sized it as 96px of knob rack plus 56px of meters. The
  meters half is exactly right and TuningRegion.svelte honours it to the pixel.
  The 96px half does not survive contact with six controls: Phase 4's own 44px
  accessibility floor puts six knobs plus an actions row at 44 x 7 + 4 x 6 =
  332px however they are arranged, and no layout closes that gap.

  So the invariant this panel actually contracts - the one the Phase 4 comment
  here was written to protect - is not a fixed 152px. It is:

    THE PRIMARY CONTROL NEVER MOVES. TRY ON DEVICE, its honesty line and the
    connect-state region sit ABOVE the region and their position is byte
    identical to Phase 4's. The region grows DOWNWARD, and its height is fixed
    the moment an entry is chosen - a pure function of that entry's knob count
    and kinds, unchanged while a visitor turns knobs, unchanged when a meter
    changes, unchanged when a bar crosses 908. TuningRegion.svelte carries the
    arithmetic; TryOnDevice.svelte's reserved honesty slot is the other half,
    because a sentence that changes line count above the region would move the
    region just as surely.

  THE INSTALL ROW IS A COLUMN, AND THE ARITHMETIC FORCES IT (07-UI-SPEC Region
  6, Z-03, amending 07-CONTEXT D-15's "beside"). The panel's content column is
  372px at its widest and never wider - max-inline-size 420px minus 24px of
  padding each side. Each of the three cells carries a 16px Body sentence
  beneath its control. Two cells side by side give each sentence about 178px,
  which is roughly twenty characters a line against the 43 this design
  measures at 372px; Phase 5's wrapping row was therefore a column pretending
  to be a row, and which controls shared a line changed as their labels
  changed state. A column at a 16px rhythm is one layout at every width. The
  order is PUT BACK first because the way back should be the first thing the
  eye reaches below the rule, KEEP ON DEVICE second because it is the
  commitment, COPY LINK last because it is not an install control at all. PUT
  BACK renders nothing until a snapshot exists, so the column simply closes
  up above KEEP ON DEVICE until then.

  THE CONFIRMATION REPLACES THE CONTROL THAT OPENED IT. While
  install.confirmOpen the row renders KeepConfirm where KEEP ON DEVICE was, so
  there is never a second KEEP ON DEVICE on the screen (WCAG 2.5.3): PUT BACK
  above it does not move and COPY LINK below it moves down by the block's
  height. The block LEAVES INSTANTLY, on purpose, and this is the decision
  plan 07-09 deferred to here: a leaving fade would keep `keep-confirm-yes` on
  the screen for 160ms beside the re-rendered `keep-on-device` - the never-both
  rule broken for exactly the interval a speech command could land in - and
  would put a ghost of the block under a control that already has focus. The
  Motion Contract's "appearing or leaving" is honoured on the appearing half,
  in the leaf's own CSS.

  THE ONE FOCUS RULE (07-UI-SPEC, Focus management). When the confirmation
  closes, for any of its four reasons, focus goes to the row's KEEP ON DEVICE
  if that control can hold it, and to region 3 otherwise. NOT NOW and Escape
  leave the control enabled, so focus returns to it; a commit leaves it
  disabled under the store's write, and a knob move or a session drop leave it
  disabled with a reason, so in all three focus falls to the connect-state
  region (tabindex="-1", inside the caller's snippet), which at the commit
  holds the PLAYING NOW block under aria-busy while the primary reads
  KEEPING…. One rule, four exits, and no control removes itself while holding
  focus without a successor.

  Everything about the box is unchanged from Phase 4: margin-block-start 24px,
  the dashed border, the 10px radius, 16px of padding, min-block-size 152px and
  the data-testid the e2e suite asserts. Only its CONTENTS moved, out of this
  file and into the caller's snippet. The caption moved with them: it belongs to
  the region now, where every 12px line is a 14px line box, and the 1.2 ratio
  this file used for it is untouched everywhere else it is still used.

  The entrance is here rather than in the caller because the element only exists
  while it is chosen: 16px up and a fade over 260ms, or opacity alone over 120ms
  for a visitor who asked for less motion.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { tick, type Snippet } from "svelte";
  import type { FrontDoorEntry } from "$lib/catalog/front-door";
  import { install } from "$lib/device/install.svelte";
  import Clear from "./Clear.svelte";
  import KeepConfirm from "./KeepConfirm.svelte";
  import KeepOnDevice from "./KeepOnDevice.svelte";
  import PutBack from "./PutBack.svelte";

  let {
    entry,
    children,
    tuning,
    share,
  }: {
    /**
     * The chosen configuration. The panel names it so a screen reader knows
     * which pad these controls act on, and publishes its id so a test can see
     * the panel re-fill on a step without the connect state resetting (W-20).
     */
    entry: FrontDoorEntry;
    /** Regions 1 to 3: the primary control, its honesty line, its status. */
    children?: Snippet;
    /**
     * Region 4's contents. The box, its reservation and its test id stay here;
     * everything inside it - the caption, the rack, the actions row, the two
     * meters and both message slots - belongs to the caller.
     */
    tuning?: Snippet;
    /**
     * The share control, the last cell of the column below the hairline. It is
     * not an install control and never claims to be.
     */
    share?: Snippet;
  } = $props();

  /** The panel's own element, so the focus rule can find region 3 inside the caller's snippet. */
  let root = $state<HTMLElement | null>(null);
  /** The row's KEEP ON DEVICE, bound so the focus rule can ask it to take focus. */
  let keep = $state<ReturnType<typeof KeepOnDevice> | undefined>(undefined);

  /** NOT NOW and Escape inside the block. The focus return is the effect's, below. */
  function onclose(): void {
    install.dismissConfirm();
  }

  /**
   * The focus rule, applied on every close of the confirmation - NOT NOW,
   * Escape, the commit, a knob move, a session drop - after the DOM has
   * swapped the block for the row control. `wasOpen` is a plain local, as
   * Coverflow.svelte's `wasChosen` is: nothing renders from it.
   */
  let wasOpen = false;
  $effect(() => {
    const open = install.confirmOpen;
    if (wasOpen && !open) void returnFocus();
    wasOpen = open;
  });

  async function returnFocus(): Promise<void> {
    await tick();
    if (keep?.focus()) return;
    root?.querySelector<HTMLElement>('[data-testid="connect-status"]')?.focus();
  }
</script>

<!--
  THE REGISTRATION LATTICE'S SECOND AND LAST ROOT (10-UI-SPEC 19.1a, D-16).
  This one element covers the panels, the tuning region and the whole device
  flow, which is why there are two roots and not six.

  ITS POSITION IS WHY A MASK HERE IS LEGAL, AND IT IS ASSERTED RATHER THAN
  DESCRIBED. 8.2 forbids a grouping property ON .stage or BETWEEN .stage and a
  .slot, because either flattens the coverflow's 3D ladder into a row of equal
  squares. This section is rendered inside Coverflow.svelte's own .panel
  wrapper, which is a TOP-LEVEL SIBLING of .band and outside the 3D context
  .stage establishes - so the lattice pseudo-element is a leaf that is an
  ancestor of no .slot. instrument.spec.ts scan 3 proves that by READING
  Coverflow.svelte, never by editing it.
-->
<section
  bind:this={root}
  class="panel lattice"
  data-testid="chosen-panel"
  data-entry={entry.id}
  aria-label={entry.name}
>
  {@render children?.()}

  <div class="reserved" data-testid="tuning-reserved">
    {@render tuning?.()}
  </div>

  <hr class="rule" />

  <p class="caption" data-testid="next-caption">NEXT</p>

  <div class="install-row">
    <PutBack />
    {#if install.confirmOpen}
      <KeepConfirm {onclose} />
    {:else}
      <KeepOnDevice bind:this={keep} />
    {/if}
    <Clear />
    {@render share?.()}
  </div>
</section>

<style>
  .panel {
    max-inline-size: 420px;
    margin-inline: auto;
    padding: 24px;
    border: 1px solid var(--color-line);
    border-radius: 10px;
    animation: arrive 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  @keyframes arrive {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /*
    Phase 4's 96px of knob rack + 56px of meters, and every declaration in here
    is byte identical to what Phase 4 shipped. See the header for what the
    number turned out to mean: min-block-size is a FLOOR, the region grows
    downward past it, and what is contracted is that nothing ABOVE it moves.
    The 56px half is honoured exactly - the meters block really is 56px.
  */
  .reserved {
    margin-block-start: 24px;
    padding: 16px;
    border: 1px dashed var(--color-line-soft);
    border-radius: 10px;
    min-block-size: 152px;
  }

  /*
    24px, a hairline, 24px. The gap the two install controls never close - and
    THE ONLY HAIRLINE IN THIS REGION. A-46 retired the second one along with
    the Bare tier it was there to separate, so plan 10-13 adds no
    border-block-start anywhere in this file.
  */
  .rule {
    margin-block: 24px;
    border: 0;
    border-block-start: 1px solid var(--color-line-soft);
  }

  /*
    The NEXT caption (plan 10-13, D-04): Micro, uppercase, in the quiet rung,
    directly under the hairline. It is a caption and not a control - no accent,
    no rule, no bracket, no numeral - and it is the only thing this plan adds
    above the column.
  */
  .caption {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
  }

  /*
    One column at a 16px rhythm: PUT BACK, KEEP ON DEVICE or the confirmation
    in its place, CLEAR, COPY LINK (07-UI-SPEC Region 6; 10-UI-SPEC 10.2). The
    header carries the arithmetic that retired Phase 5's space-between row.
    align-items keeps every cell at its own width, so a fit-content control
    never stretches to the column. The caption sits 16px above the first cell,
    on the same rhythm as the gaps between them.
  */
  .install-row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    margin-block-start: 16px;
  }

  @media (prefers-reduced-motion: reduce) {
    .panel {
      animation: fade-in 120ms linear;
    }

    @keyframes fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  }
</style>
