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
  line box, a 4px gap, a 44px control). THE COLOUR PICKER IS 192 + 4 = 196, and
  it is billed ONCE however many colour knobs an entry declares, because plan
  10-10 renders one picker per panel rather than one per knob - so `p` below is
  1 or 0, never 2 and never 3, and the colour knobs themselves cost nothing.
  The rack drops its trailing gap. With no messages, and `r` row-layout knobs
  against `w` word rows and `p` pickers:

      194 + 48r + 66w + 196p - 4     the actions row fits on one line
      246 + 48r + 66w + 196p - 4     the actions row wraps to two

  246 = 194 + 44 + 8: the second 44px button row plus the 8px `sm` gap.

  192 = 44 (the picker's head) + 8 + 140 (three 44px rails and two 4px gaps),
  and it is width-independent BY CONSTRUCTION: the picker's rails shrink rather
  than wrap, and its result pad is a fixed 88px square, so the reservation is
  true at 320px and at 420px alike.

  THIS IS A CORRECTION TO THE APPROVED UI SPEC AND IS RECORDED AS ONE.
  05-UI-SPEC's "Vertical arithmetic" table bills the actions row at a flat 44px
  and derives a single 194 constant from it. But the same document's
  "SURPRISE ME and RESET ALL" section gives that row `flex-wrap: wrap`, and its
  Spacing table defines `sm` 8px as "gap between SURPRISE ME and RESET ALL WHEN
  THEY WRAP". The spec provides for the wrap everywhere except in the one table
  that adds the heights up. The two-constant form is the arithmetic the spec's
  own rules produce, and 05-08-SUMMARY.md records it as a correction to the
  approved contract in the same open manner as X-27's gate amendment.

  WHERE THE SWITCH IS: DERIVED HERE, THEN MEASURED IN 05-10.
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

  That 251px was arithmetic over a font whose exact advance widths plan 05-08
  could not measure, because nothing in the tree rendered SURPRISE ME or RESET
  ALL until TuningRegion.svelte existed. It does now, and the number was taken:
  mounted in Chromium with Quicksand loaded the way src/app.css loads it,
  SURPRISE ME lays out at 134.453125px and RESET ALL at 114.546875px, so with
  the 8px gap the pair needs exactly 257px. THE ROW WRAPS BELOW A REGION
  CONTENT BOX OF 257px - it holds one line at 257 and wraps at 256 - which is a
  viewport of about 385px. The derivation was 6px narrow and its three
  conclusions all survive: the row wraps at 320px (content box 192px) and at
  375px (247px), and does not at 420px (292px). 257px is the number
  TuningRegion.svelte's container query actually carries, and wave 10's
  tune-ui.spec.ts asserts the shipped two-constant form against it, so this
  comment and that code cannot drift apart.
  ------------------------------------------------------------------------

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { EMPTY_RACK } from "$lib/tune/copy";
  import type { ColourBudget, KnobView } from "$lib/tune/view";
  import ColourPicker from "./ColourPicker.svelte";
  import Knob from "./Knob.svelte";

  let {
    entry,
    knobs,
    held,
    budget,
    forecast,
    onchange,
    onreset,
    onhold,
    onforecast,
    onresult,
  }: {
    /**
     * The configuration, for the picker's result pad. Declared STRUCTURALLY -
     * the src/lib/sim/host.ts HostEngine pattern - so this file names no
     * catalog type and costs no chunk.
     */
    entry: { id: string; name: string };
    /** Every knob of the chosen configuration, in the order the entry gives. */
    knobs: readonly KnobView[];
    /** One knob moved to one index. The region owns what that means. */
    onchange: (id: string, index: number) => void;
    /** One knob back to its default. RESET ALL is the region's, not this. */
    onreset: (id: string) => void;
    /**
     * The ids SURPRISE ME must not roll. EPHEMERAL and the region's: it is
     * never encoded into a stamp, so a held knob's link is byte-identical to
     * the same knob's unheld one.
     */
    held: ReadonlySet<string>;
    /** One lock, toggled. What "held" then means is the region's, not this. */
    onhold: (id: string) => void;
    /**
     * The one forecast on screen, or undefined (TUNE-02, T2). AT MOST ONE for
     * the whole rack, because a visitor has one pointer and one focus - which
     * is also what bounds the forecast to one memoised cost() at a time.
     */
    forecast?: {
      knobId: string;
      /** A knob POSITION, never a window slot. */
      position: number;
      label: string;
      sentence: string;
    };
    /** An option was hovered or focused, by knob and KNOB POSITION. */
    onforecast?: (id: string, position: number | undefined) => void;
    /**
     * What a colour may still spend. Forwarded to the picker, which is the
     * only thing on the panel with a domain large enough for the question to
     * arise.
     */
    budget?: ColourBudget;
    /** The picker's result pad, for whoever owns the page's SimHost. */
    onresult?: (id: string, canvas: HTMLCanvasElement) => void;
  } = $props();

  /**
   * ONE PICKER PER PANEL, NOT ONE PER KNOB (10-UI-SPEC 11.2).
   *
   * The colour knobs come out of the rack's row list and go into a single
   * ColourPicker block, rendered in the place of the FIRST of them so the
   * entry's own knob order survives. Six entries carry two or three colour
   * knobs; giving each its own three rails and its own result pad would put
   * nine rails and three extra canvases on `console`, `strip` and `forge`.
   */
  const colourKnobs = $derived(knobs.filter((k) => k.widget === "colour"));
  /** The one colour knob whose slot the picker takes; the others render nothing. */
  const pickerAt = $derived(colourKnobs[0]?.id);
</script>

<div class="rack" data-testid="knob-rack">
  {#if knobs.length === 0}
    <p class="empty">{EMPTY_RACK}</p>
  {:else}
    {#each knobs as row (row.id)}
      {#if row.widget === "colour"}
        {#if row.id === pickerAt}
          <ColourPicker
            {entry}
            {held}
            {budget}
            {onresult}
            knobs={colourKnobs}
            onchange={(id, position) => onchange(id, position)}
            onreset={(id) => onreset(id)}
            onhold={(id) => onhold(id)}
            onforecast={(id, position) => onforecast?.(id, position)}
          />
        {/if}
      {:else}
        <Knob
          view={row}
          stacked={row.widget === "words"}
          held={held.has(row.id)}
          forecastAt={forecast?.knobId === row.id
            ? forecast.position
            : undefined}
          forecastLabel={forecast?.knobId === row.id
            ? forecast.label
            : undefined}
          forecastSentence={forecast?.knobId === row.id
            ? forecast.sentence
            : undefined}
          onchange={(index) => onchange(row.id, index)}
          onreset={() => onreset(row.id)}
          onhold={() => onhold(row.id)}
          onforecast={(position) => onforecast?.(row.id, position)}
        />
      {/if}
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
