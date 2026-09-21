<!--
  The stepper (change 16, 2026-09-21): one typed field with a step box either side and a ladder of
  the rungs under the text - the shape Knob.svelte's numeric rows and MidiField.svelte share. It
  owns the draft while a visitor types and nothing else: `ontext(text, committed)` hands every
  keystroke up with `committed` false and Enter or blur with it true, and the owner answers by
  re-rendering `value`; `onrank(rank)` asks for a rung by its place on the value-ordered ladder
  (the boxes, the arrows, Home and End). The boxes are out of the tab order: the field is the one
  stop, a spinbutton. 44px on every control, square (D-01); the field in the mono face
  (instrument.spec.ts's list). No corner, no colour but the tokens.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { SNAP_HINT, STEP_DOWN, STEP_UP } from "$lib/tune/inspector-copy";

  let {
    id,
    testid,
    value,
    unit,
    rank,
    count,
    invalid = false,
    describedBy,
    hint = true,
    inputmode = "numeric",
    ontext,
    onrank,
  }: {
    /** The input's id, the row's label points at it. */
    id: string;
    /** The input's test id (`knob-speed-input`, `midi-field-cc-input`). */
    testid: string;
    /** What the field shows between edits: the rung's readout, or the owner's refused text. */
    value: string;
    /** Printed after the value, never inside it. */
    unit?: string;
    /** Where the rung sits on the value-ordered ladder, 0 the smallest value. */
    rank: number;
    /** How many rungs the ladder has. */
    count: number;
    /** The owner refused the text: the error ink on the boundary, aria-invalid. */
    invalid?: boolean;
    /** Ids the input is described by, beside the hint's. */
    describedBy?: string;
    /** Describe the snap rule (a knob's field); a MIDI field says its own refusals instead. */
    hint?: boolean;
    inputmode?: "numeric" | "text";
    /** Every keystroke with `committed` false; Enter and blur with it true. */
    ontext: (text: string, committed: boolean) => void;
    /** A rung by rank, already clamped to the ladder. */
    onrank: (rank: number) => void;
  } = $props();

  const hintId = $derived(`${id}-hint`);
  const described = $derived(
    [describedBy, hint ? hintId : undefined].filter(Boolean).join(" ") ||
      undefined,
  );

  /** The text while a visitor types; undefined between edits, when the field shows `value`. */
  let draft = $state<string | undefined>(undefined);
  const shown = $derived(draft ?? value);
  const last = $derived(Math.max(0, count - 1));
  const valueText = $derived(unit ? `${value} ${unit}` : value);
  /** The ladder is drawn up to 32 rungs; a longer one (ORBIT's 128 notes) shows its mark alone. */
  const LADDER_MAX = 32;
  const ticks = $derived(
    count <= LADDER_MAX ? Array.from({ length: count }, (_, at) => at) : [],
  );
  const percent = (at: number) => (last === 0 ? 0 : (at / last) * 100);

  function typed(event: Event): void {
    const text = (event.currentTarget as HTMLInputElement).value;
    draft = text;
    ontext(text, false);
  }

  function commit(): void {
    if (draft === undefined) return;
    const text = draft;
    draft = undefined;
    ontext(text, true);
  }

  function step(delta: number): void {
    draft = undefined;
    onrank(Math.min(last, Math.max(0, rank + delta)));
  }

  function onkeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case "Enter":
        event.preventDefault();
        commit();
        return;
      case "ArrowUp":
        event.preventDefault();
        step(1);
        return;
      case "ArrowDown":
        event.preventDefault();
        step(-1);
        return;
      case "Home":
        event.preventDefault();
        draft = undefined;
        onrank(0);
        return;
      case "End":
        event.preventDefault();
        draft = undefined;
        onrank(last);
        return;
    }
  }
</script>

<div class="stepper" class:invalid data-testid="{testid}-stepper">
  <button
    class="box"
    type="button"
    tabindex="-1"
    aria-label={STEP_DOWN}
    title={STEP_DOWN}
    data-testid="{testid}-down"
    disabled={rank <= 0}
    onclick={() => step(-1)}
  >
    <svg class="glyph" viewBox="0 0 20 20" aria-hidden="true">
      <line x1="6" y1="10" x2="14" y2="10" />
    </svg>
  </button>
  <div class="field">
    <input
      class="input"
      {id}
      type="text"
      role="spinbutton"
      {inputmode}
      autocomplete="off"
      spellcheck="false"
      data-testid="{testid}-input"
      value={shown}
      aria-valuemin="0"
      aria-valuemax={last}
      aria-valuenow={rank}
      aria-valuetext={valueText}
      aria-invalid={invalid}
      aria-describedby={described}
      title={hint ? SNAP_HINT : undefined}
      oninput={typed}
      onblur={commit}
      {onkeydown}
    />
    {#if unit}
      <span class="unit" aria-hidden="true">{unit}</span>
    {/if}
    <span class="ladder" aria-hidden="true">
      {#each ticks as at (at)}
        <span
          class="tick"
          class:at={at === rank}
          style:inset-inline-start="{percent(at)}%"
        ></span>
      {/each}
      {#if ticks.length === 0}
        <span class="tick at" style:inset-inline-start="{percent(rank)}%"
        ></span>
      {/if}
    </span>
  </div>
  <button
    class="box"
    type="button"
    tabindex="-1"
    aria-label={STEP_UP}
    title={STEP_UP}
    data-testid="{testid}-up"
    disabled={rank >= last}
    onclick={() => step(1)}
  >
    <svg class="glyph" viewBox="0 0 20 20" aria-hidden="true">
      <line x1="6" y1="10" x2="14" y2="10" />
      <line x1="10" y1="6" x2="10" y2="14" />
    </svg>
  </button>
  {#if hint}
    <span class="sr-only" id={hintId}>{SNAP_HINT}</span>
  {/if}
</div>

<style>
  /* A box, the field, a box: 44px each in height, the boxes 44 wide, the field the rest. */
  .stepper {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) 44px;
    inline-size: 100%;
    min-inline-size: 160px;
  }

  /* The step box: the tool rail's shape - a boundary hairline, square, the glyph in straight lines. */
  .box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding: 0;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: transparent;
    color: var(--color-ink);
    cursor: pointer;
  }

  .box:hover:not(:disabled) {
    border-color: var(--color-ink-quiet);
  }

  .box:disabled {
    color: var(--color-divider);
    cursor: default;
  }

  .glyph {
    inline-size: 20px;
    block-size: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
  }

  /* The field's box between the two: its own hairline on the block edges only, so the three read as one control. */
  .field {
    position: relative;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    min-inline-size: 0;
    min-block-size: 44px;
    border-block: 1px solid var(--color-boundary);
    background: var(--color-workspace);
  }

  .field:hover {
    border-color: var(--color-ink-quiet);
  }

  /* The error ink on the boundary only, never on a box (X-01). */
  .invalid .field {
    border-color: var(--color-error-ink);
  }

  /* The value in the mono face, tabular, 16px so iOS does not zoom a focused field. */
  .input {
    box-sizing: border-box;
    inline-size: 100%;
    min-inline-size: 0;
    min-block-size: 42px;
    padding-inline: 10px 4px;
    border: 0;
    border-radius: 0;
    background: transparent;
    font-family: var(--font-mono);
    font-size: 16px;
    font-variant-numeric: tabular-nums;
    color: var(--color-ink);
  }

  .input:focus-visible {
    outline-offset: -2px;
  }

  /* The unit, quiet, after the value. */
  .unit {
    flex: 0 0 auto;
    padding-inline-end: 10px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--color-ink-quiet);
    pointer-events: none;
  }

  /* The ladder: a hairline along the field's foot with a 1px tick per rung, the rung the field is at 2px in the action colour. */
  .ladder {
    position: absolute;
    inset-inline: 8px;
    inset-block-end: 3px;
    block-size: 4px;
    border-block-end: 1px solid var(--color-divider);
    pointer-events: none;
  }

  .tick {
    position: absolute;
    inset-block-end: 0;
    inline-size: 1px;
    block-size: 4px;
    margin-inline-start: -0.5px;
    background: var(--color-boundary);
  }

  .tick.at {
    inline-size: 2px;
    block-size: 5px;
    margin-inline-start: -1px;
    background: var(--color-action);
  }
</style>
