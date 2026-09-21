<!--
  The stepper (change 16, 2026-09-21): one typed field with a step box either side and a ladder of
  the rungs under the text - the shape Knob.svelte's numeric rows, MidiField.svelte and
  BrightnessField.svelte share. It owns the draft while a visitor types and nothing else:
  `ontext(text, committed)` hands every keystroke up with `committed` false and Enter or blur with
  it true (the text the field shows, typed or not), and the owner answers by re-rendering `value`;
  `onrank(rank)` asks for a rung by its place on the value-ordered ladder (the boxes, the arrows,
  Home and End). The boxes are out of the tab order: the field is the one stop, a spinbutton.
  Change 16b's shape: the control fills its column edge to edge at 44px - a 44 box, the field, a
  44 box, 12px inside; `readonly` (the Sandbox under Play) holds every step; the Sandbox's fields
  (change 16c) keep their own input id and show MIXED as a placeholder. Square; the mono face.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { SNAP_HINT, STEP_DOWN, STEP_UP } from "$lib/tune/inspector-copy";

  let {
    id,
    testid,
    inputTestid = `${testid}-input`,
    value,
    unit,
    placeholder,
    mixed = false,
    rank,
    count,
    invalid = false,
    describedBy,
    hint = true,
    inputmode = "numeric",
    readonly = false,
    ontext,
    onrank,
  }: {
    /** The input's id, the row's label points at it. */
    id: string;
    /** The test id the boxes and the root derive from (`knob-speed`, `midi-field-cc`, `brightness-field`). */
    testid: string;
    /** The input's own test id: `{testid}-input` unless the owner keeps an older one (the Sandbox's `field-cc`). */
    inputTestid?: string;
    /** What the field shows between edits: the rung's readout, or the owner's refused text. */
    value: string;
    /** Printed after the value, never inside it. */
    unit?: string;
    /** Shown while `value` is empty: the Sandbox's MIXED over a set whose members differ. */
    placeholder?: string;
    /** The set differs (change 13A): data-mixed for the suites, the placeholder as the value's text. */
    mixed?: boolean;
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
    /** The owner's field is read-only (the Sandbox under Play): the boxes and the arrows hold, the text cannot change. */
    readonly?: boolean;
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
  const valueText = $derived(
    value === "" && placeholder !== undefined
      ? placeholder
      : unit
        ? `${value} ${unit}`
        : value,
  );
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

  /** Enter or blur: what the field shows goes up as committed, so an owner's boundary (the Sandbox's history) always hears it. */
  function commit(): void {
    const text = draft ?? value;
    draft = undefined;
    ontext(text, true);
  }

  function step(delta: number): void {
    if (readonly) return;
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
        if (readonly) return;
        draft = undefined;
        onrank(0);
        return;
      case "End":
        event.preventDefault();
        if (readonly) return;
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
    disabled={readonly || rank <= 0}
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
      data-testid={inputTestid}
      value={shown}
      {placeholder}
      data-mixed={mixed || undefined}
      {readonly}
      aria-readonly={readonly}
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
    disabled={readonly || rank >= last}
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
  /* A box, the field, a box: the column's width edge to edge and 44px tall (change 16b), the boxes 44 wide, the field the rest. */
  .stepper {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) 44px;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 44px;
  }

  /* The step box: the tool rail's shape - a boundary hairline, square, the glyph in straight lines. */
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
    block-size: 44px;
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

  /* The value in the mono face, tabular, 16px so iOS does not zoom a focused field; 12px in from the box, as every control. */
  .input {
    box-sizing: border-box;
    inline-size: 100%;
    min-inline-size: 0;
    block-size: 42px;
    padding-inline: 12px 4px;
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

  .input[readonly] {
    color: var(--color-ink-quiet);
  }

  /* The Mixed placeholder over a set: the quiet ink, the sans face (it is a word, not a number). */
  .input::placeholder {
    font-family: var(--font-sans);
    color: var(--color-ink-quiet);
    opacity: 1;
  }

  /* The unit, quiet, after the value, 8px from the box: "250 points" fits the wide band's 85px field. */
  .unit {
    flex: 0 0 auto;
    padding-inline-end: 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--color-ink-quiet);
    pointer-events: none;
  }

  /* The ladder: a hairline along the field's foot with a 1px tick per rung, the rung the field is at 2px in the action colour. */
  .ladder {
    position: absolute;
    inset-inline: 12px;
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
