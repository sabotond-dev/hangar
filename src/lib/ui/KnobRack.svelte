<!--
  The rack: a list of knob rows of one section, a hairline between them, and nothing else - it
  renders no button (Randomize and Reset settings are TuningRegion.svelte's). Props: entry, knobs,
  onchange, onreset, held, onhold, lock, budget, onresult, empty. The colour knobs go through ONE
  Swatch block, in the first colour knob's place; every other knob is a Knob.svelte row. Nothing
  here scrolls sideways (tune-ui.spec.ts greps the two declarations, so they are not spelled).
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
    empty = false,
    onchange,
    onreset,
    onhold,
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
    /** False when the card offers no lock on a row (change 7). */
    lock?: boolean;
    /** What a colour may still spend, forwarded to the picker. */
    budget?: ColourBudget;
    /** The picker's result pad, for whoever owns the page's SimHost. */
    onresult?: (id: string, canvas: HTMLCanvasElement) => void;
    /** Render the empty line when there is nothing to turn. */
    empty?: boolean;
  } = $props();

  const colourKnobs = $derived(knobs.filter((k) => k.widget === "colour"));
  /** The one colour knob whose slot the swatch block takes; the others render nothing. */
  const pickerAt = $derived(colourKnobs[0]?.id);
</script>

<div class="rack" data-testid="knob-rack">
  {#if knobs.length === 0}
    {#if empty}<p class="empty">{EMPTY_RACK}</p>{/if}
  {:else}
    {#each knobs as row (row.id)}
      {#if row.widget === "colour"}
        {#if row.id === pickerAt}
          <Swatch
            {entry}
            {held}
            {lock}
            {budget}
            {onresult}
            knobs={colourKnobs}
            onchange={(id, position) => onchange(id, position)}
            onreset={(id) => onreset(id)}
            onhold={(id) => onhold(id)}
          />
        {/if}
      {:else}
        <Knob
          view={row}
          {lock}
          held={held.has(row.id)}
          onchange={(index) => onchange(row.id, index)}
          onreset={() => onreset(row.id)}
          onhold={() => onhold(row.id)}
        />
      {/if}
    {/each}
  {/if}
</div>

<style>
  /* A column of rows with a hairline between them; each row is its own container. */
  .rack {
    display: flex;
    flex-direction: column;
    min-inline-size: 0;
  }

  .rack > :global(* + *) {
    border-block-start: 1px solid var(--color-divider);
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
