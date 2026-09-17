<!--
  The rack: a list of knobs of one configuration, and nothing else - it renders no
  button (Randomize and Reset settings are TuningRegion.svelte's). Props: entry,
  knobs, onchange, onreset, held, onhold, forecast (at most one for the rack),
  onforecast, budget, onresult, layout (a list, or page 5's 2 x 2 MIDI grid),
  columns (the region's answer under D-21, never a number written here), empty.
  It is an inline-size container so Knob.svelte's query reflows against the panel,
  not the viewport; a word row and a grid field always stack. Nothing here scrolls
  sideways (tune-ui.spec.ts greps the two declarations, so they are not spelled).
  The colour knobs go through ONE Swatch block, in the first colour knob's place.
  Decided at 13-09 (D-21); see .planning/phases/13-gui-overhaul/13-09-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { EMPTY_RACK } from "$lib/tune/copy";
  import type { ColourBudget, KnobView } from "$lib/tune/view";
  import Knob from "./Knob.svelte";
  import Swatch from "./Swatch.svelte";

  let {
    entry,
    knobs,
    held,
    lock = true,
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
    /** The configuration, for the picker's result pad; declared structurally so this file names no catalog type and costs no chunk. */
    entry: { id: string; name: string };
    /** The knobs this rack renders, in the order the entry gives. */
    knobs: readonly KnobView[];
    /** One knob moved to one index. The region owns what that means. */
    onchange: (id: string, index: number) => void;
    /** One knob back to its default. Reset settings is the region's, not this. */
    onreset: (id: string) => void;
    /** The ids Randomize must not roll: the region's, ephemeral, never encoded into a stamp. */
    held: ReadonlySet<string>;
    /** One lock, toggled. What "held" then means is the region's, not this. */
    onhold: (id: string) => void;
    /** False when the card offers no lock on a row (change 7); the picker's own lock is the picker's. */
    lock?: boolean;
    /** The one forecast on screen, or undefined (TUNE-02): at most one for the rack, one pointer and one focus. */
    forecast?: {
      knobId: string;
      /** A knob POSITION, never a window slot. */
      position: number;
      label: string;
      sentence: string;
    };
    /** An option was hovered or focused, by knob and KNOB POSITION. */
    onforecast?: (id: string, position: number | undefined) => void;
    /** What a colour may still spend, forwarded to the picker. */
    budget?: ColourBudget;
    /** The picker's result pad, for whoever owns the page's SimHost. */
    onresult?: (id: string, canvas: HTMLCanvasElement) => void;
    /** A list of rows, or page 5's field grid (D-21). */
    layout?: "list" | "grid";
    /** The grid's column count, decided by the region under D-21. Ignored by a list. */
    columns?: number;
    /** Render the empty line when there is nothing to turn; the inspector says it once, in Behavior. */
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
          <Swatch
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
          {lock}
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
  /* The container the rows reflow against; a flex column's gap has no trailing edge. */
  .rack {
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* Page 5's field grid: columns of equal share with the 22px gutter; --columns is the region's answer under D-21, no number written here. */
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
