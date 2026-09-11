<!--
  The rack: a list of knobs of one configuration, and nothing else.

  It owns exactly two things - the container, and the row/stacked decision -
  and it renders no button. Randomize and Reset settings belong to the
  inspector's Behavior section (TuningRegion.svelte), not here, and this file
  must never grow them.

  SINCE 13-09 THE INSPECTOR RENDERS THREE RACKS, ONE PER SECTION 7 SECTION -
  Behavior, Appearance, MIDI output - each handed the knobs that belong to it.
  The rack does not know which section it is in; it renders what it is given.
  The one thing it knows beyond the row/stacked decision is `layout`: a
  list, which is every section but one, or the 2 x 2 GRID of PDF page 5's
  MIDI output (CC number beside Channel), whose column count the region
  decides under D-21 and hands down as `columns` - never a number this file
  writes.

  WHY A CONTAINER AND NOT A MEDIA QUERY. The rows have to fit THE PANEL - the
  inspector's body, 380 to 456 in the wide band, 268 to 300 in the compact
  band, the viewport below - so `container-type: inline-size` here lets
  Knob.svelte's `@container (width < 220px)` reflow against the rack rather
  than the viewport. A viewport media query would stack rows on a phone held
  in a wide panel and keep them side by side in a narrow one - exactly
  backwards.

  A WORD ROW ALWAYS STACKS, at every width, because its options wrap and it
  needs the full content width to wrap into. A GRID FIELD ALWAYS STACKS too:
  page 5 draws the field's label above its box. Those are the two stacking
  decisions this file makes; the width-driven one is the container query's.

  NOTHING IN HERE SCROLLS HORIZONTALLY. Neither this component nor Knob.svelte
  declares a horizontal overflow of auto or of scroll anywhere, and
  tune-ui.spec.ts greps for exactly those two declarations - which is why they
  are described here rather than spelled, so the grep reads the CSS and not this
  paragraph. D-11's rule is "wrap, never scroll", and a scrollbar under a
  visitor's thumb is the failure it names.

  THE COLOUR KNOBS GO THROUGH ONE SWATCH BLOCK (10-UI-SPEC 11.2, 13-09). The
  colour knobs come out of the row list and into a single Swatch block,
  rendered in the place of the FIRST of them so the entry's own knob order
  survives; Swatch.svelte draws one row per colour knob and opens the ONE
  picker in a popover. Six entries carry two or three colour knobs; giving
  each its own three rails and result pad would put nine rails and three
  extra canvases on `console`, `strip` and `forge`.

  THE HEIGHT ARITHMETIC THIS HEADER USED TO CARRY WENT WITH THE CHOSEN PANEL.
  From 05-08 to 13-08 the rack's rows were billed at 48 / 66 / 196 so
  ChosenPanel.svelte could reserve the tuning region's height before a knob
  had turned and keep TRY ON DEVICE from moving. The inspector's body is the
  one scroll container of a panel whose primary action sits in the context
  bar (Bible section 7; Inspector.svelte), so nothing above the rack can
  move when it grows, and the reservation - both constants, the measured
  257px wrap and the 196p term - has no subject. Recorded in
  13-09-SUMMARY.md rather than kept as a number nobody re-derives.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { EMPTY_RACK } from "$lib/tune/copy";
  import type { ColourBudget, KnobView } from "$lib/tune/view";
  import Knob from "./Knob.svelte";
  import ColourPicker from "./ColourPicker.svelte";

  let {
    entry,
    knobs,
    held,
    budget,
    forecast,
    layout = "list",
    columns = 1,
    empty = true,
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
    /** The knobs this rack renders, in the order the entry gives. */
    knobs: readonly KnobView[];
    /** One knob moved to one index. The region owns what that means. */
    onchange: (id: string, index: number) => void;
    /** One knob back to its default. Reset settings is the region's, not this. */
    onreset: (id: string) => void;
    /**
     * The ids Randomize must not roll. EPHEMERAL and the region's: it is
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
    /** A list of rows, or page 5's field grid (D-21). */
    layout?: "list" | "grid";
    /** The grid's column count, decided by the region under D-21. Ignored by a list. */
    columns?: number;
    /**
     * Render the empty line when there is nothing to turn. The inspector
     * says it once, in Behavior; the other racks are simply omitted.
     */
    empty?: boolean;
  } = $props();

  const colourKnobs = $derived(knobs.filter((k) => k.widget === "colour"));
  /** The one colour knob whose slot the swatch block takes; the others render nothing. */
  const pickerAt = $derived(colourKnobs[0]?.id);
</script>

<div
  class="rack"
  class:grid={layout === "grid"}
  data-testid="knob-rack"
  data-layout={layout}
  data-columns={layout === "grid" ? columns : undefined}
  style:--columns={columns}
>
  {#if knobs.length === 0}
    {#if empty}<p class="empty">{EMPTY_RACK}</p>{/if}
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
          stacked={row.widget === "words" || layout === "grid"}
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
    edge, so the last row carries no gap below it.
  */
  .rack {
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /*
    PDF page 5's field grid: two 190px fields and a 22px gutter at the PDF's
    width, as columns of equal share with the gutter between. --columns is
    the region's answer under D-21 - two at or above layout.ts's
    NUMERIC_GRID_REFLOW, one below - and no number is written here.
  */
  .rack.grid {
    display: grid;
    grid-template-columns: repeat(var(--columns, 1), minmax(0, 1fr));
    column-gap: 22px;
    row-gap: 12px;
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
