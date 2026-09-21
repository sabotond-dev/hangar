<!--
  The swatch rows (change 16; change 16b's grid): ONE ROW PER COLOUR KNOB on Knob.svelte's grid -
  label | control | reset | lock - the chip filling the control column at 44px (a 44 square of the
  stored RGB444 value at its left edge, then its readout: the three channels for a lattice knob,
  the hue word for a hand-authored palette), and ONE editor block for all of them, inline under the
  row whose chip opened it (no dialog, no backdrop, no top layer since 13.1-04; the chip's hidden
  verb reads Close while open). Props: entry, knobs, held, lock, budget, onchange (by KNOB
  POSITION), onreset, onhold, onresult. ColourPicker.svelte is handed the knob to open on and
  nothing else; its three circles stay. Escape inside closes and puts focus on the row's chip
  because the focused element is leaving the DOM. Square (D-01).
  Decided at 13-09 / 13.1-04 (13.1-CONTEXT D-08); see .planning/phases/13.1-bench-corrections-four/13.1-04-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { tick } from "svelte";
  import { KNOB_HELD, KNOB_HOLD } from "$lib/tune/copy";
  import {
    EDIT_COLOR,
    FIELD_CHANGED,
    FIELD_RESET,
    POPOVER_CLOSE,
    fieldResetName,
  } from "$lib/tune/inspector-copy";
  import {
    isColourLattice,
    type ColourBudget,
    type KnobView,
  } from "$lib/tune/view";
  import ColourPicker from "./ColourPicker.svelte";

  let {
    entry,
    knobs,
    held,
    lock = true,
    budget,
    onchange,
    onreset,
    onhold,
    onresult,
  }: {
    /** The configuration the result pad runs. Structural, never a catalog import. */
    entry: { id: string; name: string };
    /** Every colour knob this panel declares, in rack order. Never empty. */
    knobs: readonly KnobView[];
    /** The ids Randomize must not roll. The region owns the set. */
    held: ReadonlySet<string>;
    /** Render the lock box on each row; the Sandbox, which rolls nothing, passes false. */
    lock?: boolean;
    /** What a colour may still spend, or undefined while nothing has measured. */
    budget?: ColourBudget;
    /** One colour knob moved to one KNOB POSITION, never a rail level. */
    onchange: (id: string, position: number) => void;
    /** One colour knob back to the colour its card ships with. */
    onreset: (id: string) => void;
    /** One lock, toggled, for the knob the row names. */
    onhold: (id: string) => void;
    /** The picker's result pad, for whoever owns the page's SimHost. */
    onresult?: (id: string, canvas: HTMLCanvasElement) => void;
  } = $props();

  const uid = $props.id();

  /** The knob the block is open on, or undefined while it is closed. */
  let openFor = $state<string | undefined>(undefined);
  /** Each row's chip by knob id, so Escape can put focus on the row's own. */
  let chips: Record<string, HTMLButtonElement | undefined> = {};

  /** "rgb(r g b)" - the selected value's flat fill, as the chip paints it. */
  const fillOf = (knob: KnobView): string | undefined =>
    knob.values[knob.index]?.swatch;

  /** "0 85 255" for a lattice knob, the hue word ("Cyan") for a hand-authored palette. */
  function readoutOf(knob: KnobView): string {
    const value = knob.values[knob.index];
    if (value === undefined) return "";
    if (isColourLattice(knob.values)) {
      return (value.swatch ?? "").replace(/[^0-9 ]/g, "").trim();
    }
    return (value.name ?? value.label).split(",")[0];
  }

  /** The row's chip: open the block on this knob, or close it if it is open here. */
  function toggleFor(knob: KnobView): void {
    openFor = openFor === knob.id ? undefined : knob.id;
  }

  /** Escape INSIDE the block closes it; focus goes to the row's chip once the block is gone. */
  async function onEditorKeydown(
    event: KeyboardEvent,
    id: string,
  ): Promise<void> {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    const chip = chips[id];
    openFor = undefined;
    await tick();
    chip?.focus();
  }
</script>

<div class="swatches" data-testid="swatch-block">
  {#each knobs as knob (knob.id)}
    {@const fill = fillOf(knob)}
    {@const changed = knob.index !== knob.default}
    <div
      class="row"
      class:changed
      data-testid="swatch-{knob.id}"
      data-index={knob.index}
      data-changed={changed}
    >
      <span class="label type-micro" id="{uid}-{knob.id}-label"
        >{knob.label}</span
      >
      {#if changed}
        <span class="sr-only" data-testid="swatch-{knob.id}-changed"
          >{FIELD_CHANGED}</span
        >
      {/if}
      <div class="control">
        <button
          bind:this={chips[knob.id]}
          class="chip"
          class:open={openFor === knob.id}
          type="button"
          data-testid="edit-color"
          aria-expanded={openFor === knob.id}
          aria-controls="{uid}-{knob.id}-editor"
          aria-describedby="{uid}-{knob.id}-label"
          title={openFor === knob.id ? POPOVER_CLOSE : EDIT_COLOR}
          onclick={() => toggleFor(knob)}
        >
          <span
            class="square"
            style:background-color={fill}
            aria-hidden="true"
            data-testid="swatch-{knob.id}-square"
          ></span>
          <span class="readout" class:numerals={isColourLattice(knob.values)}
            >{readoutOf(knob)}</span
          >
          <span class="sr-only"
            >{openFor === knob.id ? POPOVER_CLOSE : EDIT_COLOR}</span
          >
        </button>
      </div>
      <button
        class="box reset"
        type="button"
        data-testid="swatch-{knob.id}-reset"
        disabled={!changed}
        aria-label={fieldResetName(knob.label)}
        title={FIELD_RESET}
        onclick={() => onreset(knob.id)}
      >
        <svg class="glyph" viewBox="0 0 20 20" aria-hidden="true">
          <line x1="5" y1="6" x2="15" y2="6" />
          <line x1="15" y1="6" x2="15" y2="12" />
          <line x1="15" y1="12" x2="7" y2="12" />
          <line x1="7" y1="12" x2="10" y2="9" />
          <line x1="7" y1="12" x2="10" y2="15" />
        </svg>
      </button>
      {#if lock}
        <button
          class="box lock"
          type="button"
          data-testid="swatch-{knob.id}-hold"
          aria-pressed={held.has(knob.id)}
          aria-label={held.has(knob.id) ? KNOB_HELD : KNOB_HOLD}
          title={held.has(knob.id) ? KNOB_HELD : KNOB_HOLD}
          onclick={() => onhold(knob.id)}
        >
          <svg class="glyph" viewBox="0 0 20 20" aria-hidden="true">
            <line x1="5" y1="10" x2="15" y2="10" />
            <line x1="15" y1="10" x2="15" y2="17" />
            <line x1="15" y1="17" x2="5" y2="17" />
            <line x1="5" y1="17" x2="5" y2="10" />
            <line x1="7" y1="10" x2="7" y2="5" />
            <line x1="7" y1="5" x2="13" y2="5" />
            <line x1="13" y1="5" x2="13" y2={held.has(knob.id) ? 10 : 7} />
          </svg>
        </button>
      {/if}
    </div>
    <!--
      The block, in the row's flow, only while open on this knob; re-keyed on the knob
      (the picker reads selectedId once). The keydown is delegated so Escape on any of
      the picker's controls closes the block. Kept apart from the svelte-ignore line:
      every word after the rule name there is parsed as another rule name.
    -->
    {#if openFor === knob.id}
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        class="editor"
        id="{uid}-{knob.id}-editor"
        role="group"
        aria-labelledby="{uid}-{knob.id}-label"
        data-testid="colour-editor"
        data-knob={knob.id}
        onkeydown={(event) => onEditorKeydown(event, knob.id)}
      >
        {#key knob.id}
          <ColourPicker
            {entry}
            {knobs}
            {held}
            {budget}
            {onchange}
            {onreset}
            {onresult}
            selectedId={knob.id}
          />
        {/key}
      </div>
    {/if}
  {/each}
</div>

<style>
  /* The root is the container its rows query; a hairline between the rows. */
  .swatches {
    container-type: inline-size;
  }

  .swatches > :global(* + *) {
    border-block-start: 1px solid var(--color-divider);
  }

  /* Knob.svelte's grid (change 16b): label | control | reset | lock, 44px, the 2px action rule in the start padding while changed. */
  .row {
    position: relative;
    display: grid;
    grid-template-columns: var(--tune-label-w, 96px) minmax(0, 1fr) 44px 44px;
    grid-template-areas: "label control reset lock";
    column-gap: 8px;
    align-items: center;
    min-block-size: 44px;
    padding-inline-start: 4px;
  }

  .row.changed::before {
    content: "";
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    inline-size: 2px;
    background: var(--color-action);
  }

  /* Knob.svelte's switch: under 380px of container the label takes a line of its own, the control still fills its column, the boxes keep their columns. */
  @container (width < 380px) {
    .row {
      grid-template-columns: minmax(0, 1fr) 44px 44px;
      grid-template-areas:
        "label label label"
        "control reset lock";
      row-gap: 4px;
      padding-block: 6px;
    }
  }

  .label {
    grid-area: label;
    display: block;
    min-inline-size: 0;
    color: var(--color-ink-quiet);
    overflow-wrap: normal;
    transition: color 140ms ease-out;
  }

  .row:hover .label,
  .row:focus-within .label {
    color: var(--color-ink);
  }

  .control {
    grid-area: control;
    display: grid;
    box-sizing: border-box;
    inline-size: 100%;
    min-inline-size: 0;
    min-block-size: 44px;
  }

  /* The chip: the column's width at 44px, a boundary hairline, the square at its left edge and the readout after it; the action colour on its edge while its block is open. */
  .chip {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    column-gap: 12px;
    box-sizing: border-box;
    inline-size: 100%;
    min-inline-size: 44px;
    block-size: 44px;
    min-block-size: 44px;
    padding: 0 12px 0 0;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: var(--color-workspace);
    color: var(--color-ink);
    text-align: start;
    cursor: pointer;
    transition: border-color 140ms ease-out;
  }

  .chip:hover {
    border-color: var(--color-ink-quiet);
  }

  /* The one accent declaration on this file's chip (tune-ui.spec.ts counts): the open row's chip reads as the selected one. */
  .chip.open {
    border-color: var(--color-action);
  }

  /* The one fill that is not a token: the stored RGB444 value, a 1:1 preview of the LEDs (A-09's carve-out). The chip's inner height, 42 x 42 inside its hairline, so the square reads as 44 (D-01). */
  .square {
    inline-size: 42px;
    block-size: 42px;
    border-inline-end: 1px solid var(--color-boundary);
  }

  /* The readout: the three channels in the mono face, or the palette's hue word in the micro face. */
  .readout {
    min-inline-size: 0;
    overflow: hidden;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--color-ink);
  }

  .readout.numerals {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 400;
    letter-spacing: 0;
    font-variant-numeric: tabular-nums;
  }

  /* The two boxes: Knob.svelte's, the 44px floor on both axes, no corner. */
  .box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    inline-size: 44px;
    min-inline-size: 44px;
    block-size: 44px;
    min-block-size: 44px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 0;
    background: transparent;
    color: var(--color-ink-quiet);
    cursor: pointer;
    transition: color 140ms ease-out;
  }

  .reset {
    grid-area: reset;
  }

  /* The Quiet tier: borderless (instrument.spec.ts scan 2); the held state is the seated shackle and the full ink. */
  .lock {
    grid-area: lock;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding: 0;
    border: 0;
    background: transparent;
  }

  .glyph {
    inline-size: 20px;
    block-size: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
  }

  .box:hover:not(:disabled),
  .lock[aria-pressed="true"] {
    color: var(--color-ink);
  }

  .reset:disabled {
    color: var(--color-divider);
    cursor: default;
  }

  /* The block: the panel's surface, in the flow, square; --color-boundary above, not the divider, because it is a role="group" (identity.spec.ts, WCAG 1.4.11). */
  .editor {
    padding-block: 12px;
    border-block-start: 1px solid var(--color-boundary);
    background: var(--color-panel);
  }

  @media (prefers-reduced-motion: reduce) {
    .label,
    .chip,
    .box {
      transition: none;
    }
  }
</style>
