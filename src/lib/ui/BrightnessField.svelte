<!--
  The brightness field (change 5, 2026-09-17; change 16's row; change 16b's grid): one typed whole
  number, 1..255, for the whole light output - under Look in the workspace and in the Sandbox's
  inspector - on Knob.svelte's label | control | reset | lock grid (the lock cell empty: not a knob,
  never rolled), Stepper.svelte filling the control column: its boxes and the arrows step by one
  over the free range 1..255 (a rung per value, the ladder's mark alone). A keystroke that is a
  whole number inside the range reaches the owner through onchange, one outside is refused inline
  with BRIGHTNESS_RANGE and anything else with TYPE_A_NUMBER; the last good value survives a
  refusal (the refused text stays with aria-invalid until a keystroke validates or the value moves
  from outside); Enter and blur are oncommit. Section 7's changed-field marker at any value but 255
  and a per-field reset box named for the field; read-only under the Sandbox's Play. 44px, square.

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
  import Stepper from "./Stepper.svelte";

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
    /** The owner's helper: the label's title and a screen reader's description, never a line in the flow (change 16c). */
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

  /** Every keystroke validates; Enter and blur are the owner's boundary. */
  function typed(text: string, committed: boolean): void {
    if (committed) {
      oncommit?.();
      return;
    }
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

  /** The boxes and the arrows: rank 0 is 1, rank 254 is 255; a refused text is dropped for the owner's value first. */
  function pickRank(rank: number): void {
    if (readonly) return;
    const next = Math.min(
      BRIGHTNESS_FULL,
      Math.max(BRIGHTNESS_MIN, rank + BRIGHTNESS_MIN),
    );
    refused = undefined;
    problem = undefined;
    if (next !== value) {
      seen = next;
      onchange(next);
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
    <label class="label type-micro" for={inputId} title={helper}
      >{BRIGHTNESS_LABEL}</label
    >
    {#if helper !== undefined}
      <span class="sr-only" id={helperId}>{helper}</span>
    {/if}
    {#if changed}
      <span class="sr-only" data-testid="brightness-field-changed"
        >{FIELD_CHANGED}</span
      >
    {/if}
    <div class="control">
      <Stepper
        id={inputId}
        testid="brightness-field"
        value={shown}
        rank={value - BRIGHTNESS_MIN}
        count={BRIGHTNESS_FULL - BRIGHTNESS_MIN + 1}
        invalid={problem !== undefined}
        describedBy={described}
        hint={false}
        {readonly}
        ontext={typed}
        onrank={pickRank}
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
</div>

<style>
  /* The root is the container its row queries (Knob.svelte's shape). */
  .field {
    container-type: inline-size;
    min-inline-size: 0;
  }

  /* Knob.svelte's grid (change 16b): label | control | reset | lock, the lock cell empty, 44px, the 2px action rule in the start padding while changed. */
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

  .message {
    margin: 4px 0 8px 8px;
    color: var(--color-error-ink);
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
