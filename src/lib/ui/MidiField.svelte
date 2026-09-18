<!--
  One typed MIDI field: PDF page 5's CC number / Channel box. Props: knob (the
  list, index and default are its), onchange (the same call a rail makes), onreset.
  A text input over a closed list, never a free numeric: the typed text maps back
  through view.ts's typedIndex - an offered whole number moves the knob, an
  unoffered one is refused with the offered values named, anything else with
  TYPE_A_NUMBER. The last good value survives a refusal (13-16's shape): the
  refused text stays with aria-invalid until a keystroke validates or the knob
  moves from outside, and the model never sees it. X-08 kept: a Lua channel shows
  the firmware's 0-based literal with LUA_CHANNEL_CUE beneath. No lock here. 44px, square.
  Decided at 13.1-07 (13.1-CONTEXT D-09); see .planning/phases/13.1-bench-corrections-four/13.1-07-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { untrack } from "svelte";
  import {
    FIELD_CHANGED,
    FIELD_RESET,
    LUA_CHANNEL_CUE,
    NOTE_OFFERED,
    TYPE_A_NUMBER,
    fieldResetName,
    midiFieldLabel,
    offeredLine,
  } from "$lib/tune/inspector-copy";
  import {
    integerRun,
    noteNumber,
    typedIndex,
    type KnobView,
  } from "$lib/tune/view";

  let {
    knob,
    onchange,
    onreset,
  }: {
    /** The knob this field is over. The list, the index and the default are its. */
    knob: KnobView;
    /** One knob moved to one index - the same call a rail makes. */
    onchange: (id: string, index: number) => void;
    /** One knob back to its default. */
    onreset?: (id: string) => void;
  } = $props();

  const uid = $props.id();
  const inputId = `${uid}-input`;
  const messageId = `${uid}-message`;
  const cueId = `${uid}-cue`;

  /** The knob's raw literals; the readout's twin, present when every option is an integer. */
  const literals = $derived(knob.literals ?? []);
  const label = $derived(midiFieldLabel(knob));
  /** Section 7's one comparison. */
  const changed = $derived(knob.index !== knob.default);
  /** A Lua entry's channel: the contiguous run that starts at the firmware's 0; a preset's starts at 1 and gets no cue (W-16). */
  const zeroBasedChannel = $derived(
    knob.id === "channel" && integerRun(literals)?.min === 0,
  );
  /** A NOTE field (change 8: ORBIT's ring notes) takes a name or a number; its readout is the name, its keyboard the full one. */
  const noteField = $derived(knob.kind === "note");

  /** The refused text, or undefined while the field shows the model's literal. */
  let refused = $state<string | undefined>(undefined);
  let problem = $state<string | undefined>(undefined);
  /** The index last seen from the model, so an outside move clears a refusal. */
  let seenIndex = $state(untrack(() => knob.index));

  $effect(() => {
    const now = knob.index;
    if (now !== untrack(() => seenIndex)) {
      seenIndex = now;
      refused = undefined;
      problem = undefined;
    }
  });

  /** What the input shows: the refused text while one is held, else the knob's own literal. */
  const shown = $derived(refused ?? knob.readout ?? "");
  const describedBy = $derived(
    [
      problem === undefined ? undefined : messageId,
      zeroBasedChannel ? cueId : undefined,
    ]
      .filter((id) => id !== undefined)
      .join(" ") || undefined,
  );

  function typed(event: Event): void {
    const text = (event.currentTarget as HTMLInputElement).value;
    // A note field reads `C#3` and `49` alike (view.ts's noteNumber); a name it cannot read and a
    // number outside 0..127 are refused by the same line - both are "not a note here".
    if (noteField) {
      const midi = noteNumber(text);
      const at =
        midi === undefined ? undefined : typedIndex(literals, String(midi));
      if (at === undefined) {
        refused = text;
        problem = NOTE_OFFERED;
        return;
      }
      refused = undefined;
      problem = undefined;
      seenIndex = at;
      onchange(knob.id, at);
      return;
    }
    if (!/^-?[0-9]+$/.test(text.trim())) {
      refused = text;
      problem = TYPE_A_NUMBER;
      return;
    }
    const index = typedIndex(literals, text);
    if (index === undefined) {
      refused = text;
      problem = offeredLine(knob.id, literals);
      return;
    }
    refused = undefined;
    problem = undefined;
    seenIndex = index;
    onchange(knob.id, index);
  }

  function reset(): void {
    refused = undefined;
    problem = undefined;
    onreset?.(knob.id);
  }
</script>

<div
  class="field"
  class:invalid={problem !== undefined}
  data-testid="midi-field-{knob.id}"
  data-index={knob.index}
  data-changed={changed}
>
  <!-- The label with section 7's changed-field marker at its start (Knob.svelte's shape): a 6px square in the ink, and a hidden sentence for a screen reader. -->
  <label class="label" for={inputId}>
    {#if changed}
      <span class="changed" data-testid="midi-field-{knob.id}-changed"
        ><span class="sr-only">{FIELD_CHANGED}</span></span
      >
    {/if}
    {label}
  </label>
  <input
    class="input"
    id={inputId}
    type="text"
    inputmode={noteField ? "text" : "numeric"}
    autocomplete="off"
    data-testid="midi-field-{knob.id}-input"
    value={shown}
    aria-invalid={problem !== undefined}
    aria-describedby={describedBy}
    oninput={typed}
  />
  <!-- Section 7's per-field reset: present on every field, disabled at the default, named for the field. -->
  <button
    class="reset"
    type="button"
    data-testid="midi-field-{knob.id}-reset"
    disabled={!changed}
    aria-label={fieldResetName(label)}
    onclick={reset}
  >
    {FIELD_RESET}
  </button>
  {#if problem !== undefined}
    <p
      class="message type-helper"
      id={messageId}
      data-testid="midi-field-{knob.id}-message"
    >
      {problem}
    </p>
  {/if}
  {#if zeroBasedChannel}
    <p
      class="cue type-helper"
      id={cueId}
      data-testid="midi-field-{knob.id}-cue"
    >
      {LUA_CHANNEL_CUE}
    </p>
  {/if}
</div>

<style>
  /* Knob.svelte's stacked row: a 14px label box, a 4px gap, the box in its 44px row (14 + 4 + 44 = 62, the grid field's height), the reset spanning both at the inline end; the message and the cue on a row beneath. */
  .field {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "label reset"
      "control reset"
      "message message"
      "cue cue";
    align-items: start;
    min-inline-size: 0;
  }

  /* Micro (title): 12px / 600 / 0.01em, sentence case, room for the marker. */
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

  /* The changed-field marker: a 6px square in the ink, never accent (the reserved list is held at eight by tune-ui.spec.ts). No radius (D-01). */
  .changed {
    position: absolute;
    inset-inline-start: 0;
    inset-block-start: 0.35em;
    inline-size: 6px;
    block-size: 6px;
    background: var(--color-ink);
  }

  /* The PDF's field box under the 44px floor: a boundary hairline, square (D-01), tabular numerals; 16px so iOS does not zoom a focused field. */
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

  /* The field that refused a keystroke: the error ink on its boundary only, never on a button. */
  .invalid .input {
    border-color: var(--color-error-ink);
  }

  .message {
    grid-area: message;
    margin: 6px 0 0;
    color: var(--color-error-ink);
  }

  .cue {
    grid-area: cue;
    margin: 6px 0 0;
    color: var(--color-ink-quiet);
  }

  /* The per-field reset: Knob.svelte's quiet word at the 44px floor on both axes, no corner. */
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
