<!--
  The rack: every knob of one configuration, and nothing else.

  It owns exactly two things - the container, and the row/stacked decision -
  and it renders no button. SURPRISE ME and RESET ALL belong to the region
  above the meters (05-10), not here, and this file must never grow them: a
  rack that also owned the actions row would own the region's height too, and
  the height arithmetic below is the region's contract, not the rack's.

  WHY A CONTAINER AND NOT A MEDIA QUERY. The rows have to fit THE PANEL, which
  is 420px at most and narrower on a phone, so `container-type: inline-size`
  here lets Knob.svelte's `@container (width < 220px)` reflow against the panel
  rather than the viewport. A viewport media query would stack rows on a phone
  held in a wide panel and keep them side by side in a narrow one - exactly
  backwards.

  A WORD ROW ALWAYS STACKS, at every width, because its options wrap and it
  needs the full content width to wrap into. That is the one stacking decision
  this file makes; the width-driven one is the container query's.

  NOTHING IN HERE SCROLLS HORIZONTALLY. Neither this component nor Knob.svelte
  declares a horizontal overflow of auto or of scroll anywhere, and wave 10's
  tune-ui.spec.ts greps for exactly those two declarations - which is why they
  are described here rather than spelled, so the grep reads the CSS and not this
  paragraph. D-11's rule is "wrap, never scroll", and a scrollbar under a
  visitor's thumb is the failure it names.

  ------------------------------------------------------------------------
  THE HEIGHT ARITHMETIC, AND WHY IT IS TWO CONSTANTS RATHER THAN ONE

  Wave 10 sizes the tuning region from this, and a number nobody can re-derive
  is a number that rots, so the derivation lives beside the code that produces
  it.

  A row-layout knob is 44 + 4 = 48. A word row is 62 + 4 = 66 (a 14px label
  line box, a 4px gap, a 44px control). The rack drops its trailing gap. With
  no messages, and `r` row-layout knobs against `w` word rows:

      194 + 48r + 66w - 4     the actions row fits on one line
      246 + 48r + 66w - 4     the actions row wraps to two

  246 = 194 + 44 + 8: the second 44px button row plus the 8px `sm` gap.

  THIS IS A CORRECTION TO THE APPROVED UI SPEC AND IS RECORDED AS ONE.
  05-UI-SPEC's "Vertical arithmetic" table bills the actions row at a flat 44px
  and derives a single 194 constant from it. But the same document's
  "SURPRISE ME and RESET ALL" section gives that row `flex-wrap: wrap`, and its
  Spacing table defines `sm` 8px as "gap between SURPRISE ME and RESET ALL WHEN
  THEY WRAP". The spec provides for the wrap everywhere except in the one table
  that adds the heights up. The two-constant form is the arithmetic the spec's
  own rules produce, and 05-08-SUMMARY.md records it as a correction to the
  approved contract in the same open manner as X-27's gate amendment.

  WHERE THE SWITCH IS, DERIVED - AND NOT MEASURED HERE.
  Both labels are Micro: 12px, weight 600, uppercase, letter-spacing 0.18em =
  2.16px after every character, inside padding-inline: 16px (32px of chrome per
  button), with the 8px gap between them. SURPRISE ME is ten caps and a space;
  RESET ALL is eight caps and a space. At Quicksand 600's uppercase advance the
  pair needs about 251px of inline space (about 131 + about 112 + 8). The
  rack's container is the region's content box - the viewport less 48px of page
  padding, 48px of panel padding and 32px of region padding - so the row wraps
  below a content box of about 251px, which is below a viewport of about 379px.
  It therefore wraps at 320px (content box 192px) and at 375px (247px), and
  does not at 420px (292px).

  That 251px is arithmetic over a font whose exact advance widths this plan has
  NOT measured, and nothing in the tree renders SURPRISE ME or RESET ALL until
  TuningRegion.svelte exists. This comment therefore ships the derivation only:
  the real number is measured in 05-10, which corrects both this comment and
  its own. If that measurement disagrees with 379px by more than a few pixels
  it wins, and 05-10's SUMMARY says so - wave 10's tune-ui.spec.ts asserts the
  shipped two-constant form, so both numbers have to be the ones the code
  actually uses.
  ------------------------------------------------------------------------

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { EMPTY_RACK } from "$lib/tune/copy";
  import type { KnobView } from "$lib/tune/view";
  import Knob from "./Knob.svelte";

  let {
    knobs,
    onchange,
    onreset,
  }: {
    /** Every knob of the chosen configuration, in the order the entry gives. */
    knobs: readonly KnobView[];
    /** One knob moved to one index. The region owns what that means. */
    onchange: (id: string, index: number) => void;
    /** One knob back to its default. RESET ALL is the region's, not this. */
    onreset: (id: string) => void;
  } = $props();
</script>

<div class="rack" data-testid="knob-rack">
  {#if knobs.length === 0}
    <p class="empty">{EMPTY_RACK}</p>
  {:else}
    {#each knobs as knob (knob.id)}
      <Knob
        view={knob}
        stacked={knob.widget === "words"}
        onchange={(index) => onchange(knob.id, index)}
        onreset={() => onreset(knob.id)}
      />
    {/each}
  {/if}
</div>

<style>
  /*
    The container the rows reflow against. A flex column's gap has no trailing
    edge, which is the "the rack drops its trailing gap" of the arithmetic
    above - stated once, in one place, rather than subtracted twice.
  */
  .rack {
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* Body role, quiet. One line, and the rack renders nothing else beside it. */
  .empty {
    margin: 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }
</style>
