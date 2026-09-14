<!--
  The swatch: PDF page 5's Appearance row - a 34 x 34 square in the colour, the
  hex beside it, a right-aligned Edit color - ONE ROW PER COLOUR KNOB and ONE
  editor block for all of them, inline under the row it belongs to (no dialog, no
  backdrop, no top layer since 13.1-04; the toggle reads Close while open). Props:
  entry, knobs, held, budget, onchange (by KNOB POSITION), onreset, onhold,
  onforecast, onresult. ColourPicker.svelte is handed the knob to open on and
  nothing else, and is not edited (its three circles stay). No trap, no focus
  return: Escape inside closes and puts focus on the row's toggle because the
  focused element is leaving the DOM. The picker renders only while open. Square (D-01).
  Decided at 13-09 / 13.1-04 (13.1-CONTEXT D-08); see .planning/phases/13.1-bench-corrections-four/13.1-04-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { tick } from "svelte";
  import { EDIT_COLOR, POPOVER_CLOSE } from "$lib/tune/inspector-copy";
  import type { ColourBudget, KnobView } from "$lib/tune/view";
  import ColourPicker from "./ColourPicker.svelte";

  let {
    entry,
    knobs,
    held,
    budget,
    onchange,
    onreset,
    onhold,
    onforecast,
    onresult,
  }: {
    /** The configuration the result pad runs. Structural, never a catalog import. */
    entry: { id: string; name: string };
    /** Every colour knob this panel declares, in rack order. Never empty. */
    knobs: readonly KnobView[];
    /** The ids Randomize must not roll. The region owns the set. */
    held: ReadonlySet<string>;
    /** What a colour may still spend, or undefined while nothing has measured. */
    budget?: ColourBudget;
    /** One colour knob moved to one KNOB POSITION, never a rail level. */
    onchange: (id: string, position: number) => void;
    /** One colour knob back to the colour its card ships with. */
    onreset: (id: string) => void;
    /** One lock, toggled, for the knob the rails are editing. */
    onhold: (id: string) => void;
    /** A swatch was hovered or focused, by knob and KNOB POSITION. */
    onforecast?: (id: string, position: number | undefined) => void;
    /** The picker's result pad, for whoever owns the page's SimHost. */
    onresult?: (id: string, canvas: HTMLCanvasElement) => void;
  } = $props();

  const uid = $props.id();

  /** The knob the block is open on, or undefined while it is closed. */
  let openFor = $state<string | undefined>(undefined);
  /** Each row's toggle by knob id, so Escape can put focus on the row's own. */
  let toggles: Record<string, HTMLButtonElement | undefined> = {};

  /** "rgb(r g b)" - the selected value's flat fill, as the row paints it. */
  const fillOf = (knob: KnobView): string | undefined =>
    knob.values[knob.index]?.swatch;

  /** "#DCFF71" from "rgb(220 255 113)": exact, because every channel is stored. */
  function hexOf(fill: string | undefined): string {
    if (fill === undefined) return "";
    const parts = fill
      .replace(/[^0-9 ]/g, "")
      .trim()
      .split(/\s+/);
    if (parts.length !== 3) return "";
    return (
      "#" +
      parts
        .map((part) => Number.parseInt(part, 10).toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()
    );
  }

  /** The row's toggle: open the block on this knob, or close it if it is open here. */
  function toggleFor(knob: KnobView): void {
    openFor = openFor === knob.id ? undefined : knob.id;
  }

  /** Escape INSIDE the block closes it; focus goes to the row's toggle once the block is gone, because the focused element is leaving the DOM. */
  async function onEditorKeydown(
    event: KeyboardEvent,
    id: string,
  ): Promise<void> {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    const toggle = toggles[id];
    openFor = undefined;
    await tick();
    toggle?.focus();
  }
</script>

<div class="swatches" data-testid="swatch-block">
  {#each knobs as knob (knob.id)}
    {@const fill = fillOf(knob)}
    <div class="row" data-testid="swatch-{knob.id}">
      <span class="label" id="{uid}-{knob.id}-label">{knob.label}</span>
      <div class="value">
        <span
          class="square"
          style:background-color={fill}
          aria-hidden="true"
          data-testid="swatch-{knob.id}-square"
        ></span>
        <span class="hex numerals" aria-hidden="true">{hexOf(fill)}</span>
        <button
          bind:this={toggles[knob.id]}
          class="edit"
          type="button"
          data-testid="edit-color"
          aria-expanded={openFor === knob.id}
          aria-controls="{uid}-{knob.id}-editor"
          aria-describedby="{uid}-{knob.id}-label"
          onclick={() => toggleFor(knob)}
        >
          {openFor === knob.id ? POPOVER_CLOSE : EDIT_COLOR}
        </button>
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
              {onhold}
              {onforecast}
              {onresult}
              selectedId={knob.id}
            />
          {/key}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .swatches {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .row {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Micro (title): the knob's own label, verbatim. */
  .label {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--color-ink);
  }

  /* The PDF's row: the square, the hex, and the toggle pushed to the right. */
  .value {
    display: flex;
    align-items: center;
    gap: 16px;
    min-block-size: 44px;
  }

  /* The one fill that is not a token: the stored RGB444 value, a 1:1 preview of the LEDs (A-09's carve-out). 34 x 34, square (D-01), a boundary hairline. */
  .square {
    flex: 0 0 auto;
    inline-size: 34px;
    block-size: 34px;
    border: 1px solid var(--color-boundary);
  }

  .hex {
    font-size: 12px;
    color: var(--color-ink-quiet);
  }

  /* Quiet, right-aligned, a 44px box on both axes at every pointer. */
  .edit {
    appearance: none;
    margin-inline-start: auto;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 14px;
    color: var(--color-ink-quiet);
    cursor: pointer;
    transition: color 140ms ease-out;
  }

  .edit:hover {
    color: var(--color-ink);
  }

  /* The one accent declaration in this file (tune-ui.spec.ts counts): the open row's toggle reads as the selected one. */
  .edit[aria-expanded="true"] {
    color: var(--color-action);
  }

  /* The block: the panel's surface, in the flow, square, a hairline above; --color-boundary, not the divider, because it is a role="group" (identity.spec.ts, WCAG 1.4.11). */
  .editor {
    padding-block: 12px;
    border-block-start: 1px solid var(--color-boundary);
    background: var(--color-panel);
  }

  @media (prefers-reduced-motion: reduce) {
    .edit {
      transition: none;
    }
  }
</style>
