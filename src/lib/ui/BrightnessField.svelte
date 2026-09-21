<!--
  The brightness field (change 5, 2026-09-17; change 16's row): one typed whole number, 1..255, for
  the whole light output - under Look in the workspace and in the Sandbox's inspector. A free range
  instead of a knob's list, so no step boxes: a keystroke that is a whole number inside the range
  reaches the owner through onchange, one outside is refused inline with BRIGHTNESS_RANGE and
  anything else with TYPE_A_NUMBER; the last good value survives a refusal (the refused text stays
  with aria-invalid until a keystroke validates or the value moves from outside); the arrows step
  by one. Section 7's changed-field marker at any value but 255 and a per-field reset box named for
  the field. Not a knob: no lock, never rolled. 44px, square; the mono face on the value.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { untrack } from "svelte";
  import {
    BRIGHTNESS_FULL,
    BRIGHTNESS_MIN,
    parseBrightness,
  } from "$lib/catalog/brightness";
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

  /** The arrows step by one inside the range; a refused text is dropped for the owner's value first. */
  function step(delta: number): void {
    if (readonly) return;
    const next = Math.min(
      BRIGHTNESS_FULL,
      Math.max(BRIGHTNESS_MIN, value + delta),
    );
    refused = undefined;
    problem = undefined;
    if (next !== value) {
      seen = next;
      onchange(next);
    }
  }

  function onkeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      oncommit?.();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      step(-1);
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
  <div class="row" class:changed>
    <label class="label type-micro" for={inputId}>{BRIGHTNESS_LABEL}</label>
    {#if changed}
      <span class="sr-only" data-testid="brightness-field-changed"
        >{FIELD_CHANGED}</span
      >
    {/if}
    <div class="control">
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
    </div>
    <button
      class="box reset"
      type="button"
      data-testid="brightness-field-reset"
      disabled={!changed || readonly}
      aria-label={fieldResetName(BRIGHTNESS_LABEL)}
      title={FIELD_RESET}
      onclick={reset}
    >
      <svg class="glyph" viewBox="0 0 20 20" aria-hidden="true">
        <line x1="5" y1="6" x2="15" y2="6" />
        <line x1="15" y1="6" x2="15" y2="12" />
        <line x1="15" y1="12" x2="7" y2="12" />
        <line x1="7" y1="12" x2="10" y2="9" />
        <line x1="7" y1="12" x2="10" y2="15" />
      </svg>
    </button>
  </div>
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
  /* The root is the container its row queries (Knob.svelte's shape). */
  .field {
    container-type: inline-size;
    min-inline-size: 0;
  }

  /* Knob.svelte's row less the lock: label | control | reset, 44px, the 2px action rule while changed. */
  .row {
    position: relative;
    display: grid;
    grid-template-columns: minmax(72px, 1fr) minmax(0, 2fr) auto;
    grid-template-areas: "label control reset";
    column-gap: 8px;
    align-items: center;
    min-block-size: 44px;
    padding-inline-start: 8px;
  }

  .row.changed::before {
    content: "";
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    inline-size: 2px;
    background: var(--color-action);
  }

  @container (width < 364px) {
    .row {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        "label label"
        "control reset";
      row-gap: 4px;
    }

    .row .control {
      justify-content: flex-start;
    }
  }

  .label {
    grid-area: label;
    display: block;
    min-inline-size: 0;
    color: var(--color-ink-quiet);
    overflow-wrap: anywhere;
    transition: color 140ms ease-out;
  }

  .row:hover .label,
  .row:focus-within .label {
    color: var(--color-ink);
  }

  .control {
    grid-area: control;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    min-inline-size: 0;
  }

  /* The field box at the 44px floor: a boundary hairline, square (D-01), the mono face, tabular; 16px so iOS does not zoom a focused field. */
  .input {
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: 160px;
    min-block-size: 44px;
    padding-inline: 10px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: var(--color-workspace);
    font-family: var(--font-mono);
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
    margin: 4px 0 8px 8px;
    color: var(--color-error-ink);
  }

  .helper {
    margin: 4px 0 8px 8px;
    color: var(--color-ink-quiet);
  }

  /* The reset box: Knob.svelte's, the 44px floor on both axes, no corner. */
  .box {
    grid-area: reset;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    inline-size: 44px;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 0;
    background: transparent;
    color: var(--color-ink-quiet);
    cursor: pointer;
    transition: color 140ms ease-out;
  }

  .glyph {
    inline-size: 20px;
    block-size: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
  }

  .box:hover:not(:disabled) {
    color: var(--color-ink);
  }

  .reset:disabled {
    color: var(--color-divider);
    cursor: default;
  }

  @media (prefers-reduced-motion: reduce) {
    .label,
    .box {
      transition: none;
    }
  }
</style>
