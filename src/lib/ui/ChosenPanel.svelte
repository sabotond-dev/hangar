<!--
  The panel that appears when a visitor chooses the centre pad. D-05: that is
  the whole point of the front door, and nothing about the device exists on the
  page until it happens.

  This component owns LAYOUT and nothing else. The primary control, the honesty
  line and the connect-state region are one snippet handed in by the caller, so
  the state machine that touches a port lives in TryOnDevice.svelte and the box
  it sits in lives here. Top to bottom the panel is D-08's order, and Phase 5
  docks into it without moving anything:

    1. the primary control            these three are the caller's snippet
    2. the honesty line
    3. the connect-state region
    4. the reserved tuning region     the caller's `tuning` snippet (Phase 5)
    5. a 24px gap, a hairline, 24px
    6. KEEP ON DEVICE, disabled       beside the caller's `share` snippet

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

  Everything about the box is unchanged from Phase 4: margin-block-start 24px,
  the dashed border, the 10px radius, 16px of padding, min-block-size 152px and
  the data-testid the e2e suite asserts. Only its CONTENTS moved, out of this
  file and into the caller's snippet. The caption moved with them: it belongs to
  the region now, where every 12px line is a 14px line box, and the 1.2 ratio
  this file used for it is untouched everywhere else it is still used - ZONA
  IDENTIFIED in TryOnDevice.svelte included.

  The entrance is here rather than in the caller because the element only exists
  while it is chosen: 16px up and a fade over 260ms, or opacity alone over 120ms
  for a visitor who asked for less motion.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { FrontDoorEntry } from "$lib/catalog/front-door";
  import KeepOnDevice from "./KeepOnDevice.svelte";

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
     * The share control, on the right of the row below the hairline. It is not
     * an install control and never claims to be: KEEP ON DEVICE is disabled
     * with a dim label throughout this phase while this one works.
     */
    share?: Snippet;
  } = $props();
</script>

<section
  class="panel"
  data-testid="chosen-panel"
  data-entry={entry.id}
  aria-label={entry.name}
>
  {@render children?.()}

  <div class="reserved" data-testid="tuning-reserved">
    {@render tuning?.()}
  </div>

  <hr class="rule" />

  <div class="install-row">
    <KeepOnDevice />
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

  /* 24px, a hairline, 24px. The gap the two install controls never close. */
  .rule {
    margin-block: 24px;
    border: 0;
    border-block-start: 1px solid var(--color-line-soft);
  }

  /*
    KEEP ON DEVICE left, COPY LINK right, each with its own quiet line beneath
    it (05-UI-SPEC, COPY LINK). It wraps rather than shrinking, so on a phone
    the two stack and neither label is ever truncated. Phase 4's rule that the
    two INSTALL controls are never adjacent is untouched: COPY LINK is not an
    install control, it is disabled-versus-enabled and dim-versus-ink against
    the one beside it, and TRY ON DEVICE is still a whole hairline away.
  */
  .install-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: space-between;
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
