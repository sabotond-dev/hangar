<!--
  The brightness field (change 5, 2026-09-17): one typed whole number, 1..255, for the whole light
  output - under Appearance in the workspace beside the swatch and in the Sandbox's inspector.
  MidiField.svelte's shape over a free range instead of a knob's list: a keystroke that is a whole
  number inside the range reaches the owner through onchange, one outside is refused inline with
  BRIGHTNESS_RANGE and anything else with TYPE_A_NUMBER; the last good value survives a refusal
  (the refused text stays with aria-invalid until a keystroke validates or the value moves from
  outside). Section 7's changed-field marker at any value but 255 and a per-field reset named for
  the field. Not a knob: no lock, never rolled. 44px, square.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { untrack } from "svelte";
  import { BRIGHTNESS_FULL, parseBrightness } from "$lib/catalog/brightness";
  import {
    BRIGHTNESS_LABEL,
    BRIGHTNESS_RANGE,
    FIELD_CHANGED,
    FIELD_RESET,
    TYPE_A_NUMBER,
    fieldResetName,
  } from "$lib/tune/inspector-copy";

  let {
    value,
    onchange,
    onreset,
    oncommit,
    readonly = false,
    helper,
    describedBy,
  }: {
    /** The owner's brightness, 1..255. */
    value: number;
    /** A whole number inside the range was typed. */
    onchange: (value: number) => void;
    /** Back to 255. */
    onreset?: () => void;
    /** Blur or Enter: the Sandbox history's coalescing boundary. */
    oncommit?: () => void;
    /** Play locks the Sandbox's fields; the reason is the owner's, through describedBy. */
    readonly?: boolean;
    /** A line beneath the field, the owner's. */
    helper?: string;
    /** An id the input is described by beside its own message. */
    describedBy?: string;
  } = $props();

  const uid = $props.id();
  const inputId = `${uid}-input`;
  const messageId = `${uid}-message`;
  const helperId = `${uid}-helper`;

  const changed = $derived(value !== BRIGHTNESS_FULL);

  /** The refused text, or undefined while the field shows the owner's value. */
  let refused = $state<string | undefined>(undefined);
  let problem = $state<string | undefined>(undefined);
  /** The value last seen from the owner, so an outside move clears a refusal. */
  let seen = $state(untrack(() => value));

  $effect(() => {
    const now = value;
    if (now !== untrack(() => seen)) {
      seen = now;
      refused = undefined;
      problem = undefined;
    }
  });

  const shown = $derived(refused ?? String(value));
  const described = $derived(
    [
      problem === undefined ? undefined : messageId,
      helper === undefined ? undefined : helperId,
      describedBy,
    ]
      .filter((id) => id !== undefined)
      .join(" ") || undefined,
  );

  function typed(event: Event): void {
    const text = (event.currentTarget as HTMLInputElement).value;
    const parsed = parseBrightness(text);
    if (!parsed.ok) {
      refused = text;
      problem = parsed.reason === "number" ? TYPE_A_NUMBER : BRIGHTNESS_RANGE;
      return;
    }
    refused = undefined;
    problem = undefined;
    seen = parsed.value;
    onchange(parsed.value);
  }

  function onkeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      oncommit?.();
    }
  }

  function reset(): void {
    refused = undefined;
    problem = undefined;
    seen = BRIGHTNESS_FULL;
    onreset?.();
  }
</script>

<div
  class="field"
  class:invalid={problem !== undefined}
  data-testid="brightness-field"
  data-value={value}
  data-changed={changed}
>
  <!-- The label with section 7's changed-field marker at its start (MidiField.svelte's shape). -->
  <label class="label" for={inputId}>
    {#if changed}
      <span class="changed" data-testid="brightness-field-changed"
        ><span class="sr-only">{FIELD_CHANGED}</span></span
      >
    {/if}
    {BRIGHTNESS_LABEL}
  </label>
  <input
    class="input"
    id={inputId}
    type="text"
    inputmode="numeric"
    autocomplete="off"
    data-testid="brightness-field-input"
    value={shown}
    {readonly}
    aria-readonly={readonly}
    aria-invalid={problem !== undefined}
    aria-describedby={described}
    oninput={typed}
    onblur={() => oncommit?.()}
    {onkeydown}
  />
  <button
    class="reset"
    type="button"
    data-testid="brightness-field-reset"
    disabled={!changed || readonly}
    aria-label={fieldResetName(BRIGHTNESS_LABEL)}
    onclick={reset}
  >
    {FIELD_RESET}
  </button>
  {#if problem !== undefined}
    <p
      class="message type-helper"
      id={messageId}
      data-testid="brightness-field-message"
    >
      {problem}
    </p>
  {/if}
  {#if helper !== undefined}
    <p class="helper type-helper" id={helperId}>{helper}</p>
  {/if}
</div>

<style>
  /* MidiField.svelte's stacked row: a 14px label box, a 4px gap, the box in its 44px row, the reset spanning both at the inline end; the message and the helper beneath. */
  .field {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "label reset"
      "control reset"
      "message message"
      "helper helper";
    align-items: start;
    min-inline-size: 0;
    margin-block-start: 16px;
  }

  .label {
    position: relative;
    grid-area: label;
    display: block;
    padding-inline-start: 12px;
    margin-block-end: 4px;
    font-size: 12px;
    font-weight: 600;
    line-height: 14px;
    letter-spacing: 0.01em;
    color: var(--color-ink);
    overflow-wrap: anywhere;
  }

  /* The changed-field marker: a 6px square in the ink. No radius (D-01). */
  .changed {
    position: absolute;
    inset-inline-start: 0;
    inset-block-start: 0.35em;
    inline-size: 6px;
    block-size: 6px;
    background: var(--color-ink);
  }

  /* The field box at the 44px floor: a boundary hairline, square (D-01), tabular numerals; 16px so iOS does not zoom a focused field. */
  .input {
    grid-area: control;
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: 44px;
    padding-inline: 12px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: var(--color-workspace);
    font-family: var(--font-sans);
    font-size: 16px;
    font-variant-numeric: tabular-nums;
    color: var(--color-ink);
  }

  .input:hover {
    border-color: var(--color-ink-quiet);
  }

  .input[readonly] {
    color: var(--color-ink-quiet);
  }

  /* The field that refused a keystroke: the error ink on its boundary only. */
  .invalid .input {
    border-color: var(--color-error-ink);
  }

  .message {
    grid-area: message;
    margin: 6px 0 0;
    color: var(--color-error-ink);
  }

  .helper {
    grid-area: helper;
    margin: 6px 0 0;
    color: var(--color-ink-quiet);
  }

  /* The per-field reset: the quiet word at the 44px floor on both axes, no corner. */
  .reset {
    grid-area: reset;
    align-self: stretch;
    appearance: none;
    min-inline-size: 44px;
    min-block-size: 44px;
    margin-inline-start: 12px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--color-ink-quiet);
    cursor: pointer;
    transition: color 140ms ease-out;
  }

  .reset:hover:not(:disabled) {
    color: var(--color-ink);
  }

  .reset:disabled {
    color: var(--color-divider);
    cursor: default;
  }

  @media (prefers-reduced-motion: reduce) {
    .reset {
      transition: none;
    }
  }
</style>
