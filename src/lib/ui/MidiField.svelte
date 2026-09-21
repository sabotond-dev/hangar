<!--
  One typed MIDI field, one row (change 16): the label left, Stepper.svelte right over the knob's
  closed list, the reset box at the end. Props: knob (the list, index and default are its), onchange
  (the same call a knob row makes), onreset. Every keystroke maps back through view.ts's typedIndex -
  an offered whole number moves the knob, an unoffered one is refused with the offered values named,
  anything else with TYPE_A_NUMBER; a note field (ORBIT's ring notes) reads names and numbers through
  noteNumber. The last good value survives a refusal (13-16's shape): the refused text stays with
  aria-invalid until a keystroke validates or the knob moves from outside. X-08 kept: a Lua channel
  shows the firmware's 0-based literal, LUA_CHANNEL_CUE its description and title. No lock: a MIDI
  destination is never rolled. 44px, square; the error ink on a refused boundary and its line only.
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
    rankOf,
    typedIndex,
    valueOrder,
    type KnobView,
  } from "$lib/tune/view";
  import Stepper from "./Stepper.svelte";

  let {
    knob,
    onchange,
    onreset,
  }: {
    /** The knob this field is over. The list, the index and the default are its. */
    knob: KnobView;
    /** One knob moved to one index - the same call a knob row makes. */
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
  /** A NOTE field (change 8: ORBIT's ring notes) takes a name or a number; its readout is the name. */
  const noteField = $derived(knob.kind === "note");
  /** The rungs in value order, for the boxes and the ladder. */
  const order = $derived(valueOrder(literals));
  const rank = $derived(rankOf(order, knob.index));

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

  /** What the field shows: the refused text while one is held, else the knob's own literal. */
  const shown = $derived(refused ?? knob.readout ?? "");
  const describedBy = $derived(
    [
      problem === undefined ? undefined : messageId,
      zeroBasedChannel ? cueId : undefined,
    ]
      .filter((id) => id !== undefined)
      .join(" ") || undefined,
  );

  function accept(index: number): void {
    refused = undefined;
    problem = undefined;
    seenIndex = index;
    if (index !== knob.index) onchange(knob.id, index);
  }

  /** Every keystroke (a committed one reads the same text again, which is the same answer). */
  function typed(text: string): void {
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
      accept(at);
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
    accept(index);
  }

  /** A rank on the value-ordered ladder, back to the declared index. */
  function pickRank(at: number): void {
    const index = order[Math.min(order.length - 1, Math.max(0, at))];
    if (index !== undefined && index !== knob.index) accept(index);
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
  <div class="row" class:changed>
    <label
      class="label type-micro"
      for={inputId}
      title={zeroBasedChannel ? LUA_CHANNEL_CUE : undefined}>{label}</label
    >
    {#if changed}
      <span class="sr-only" data-testid="midi-field-{knob.id}-changed"
        >{FIELD_CHANGED}</span
      >
    {/if}
    <div class="control">
      <Stepper
        id={inputId}
        testid="midi-field-{knob.id}"
        value={shown}
        {rank}
        count={literals.length}
        invalid={problem !== undefined}
        {describedBy}
        hint={false}
        inputmode={noteField ? "text" : "numeric"}
        ontext={typed}
        onrank={pickRank}
      />
    </div>
    <button
      class="box reset"
      type="button"
      data-testid="midi-field-{knob.id}-reset"
      disabled={!changed}
      aria-label={fieldResetName(label)}
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
      data-testid="midi-field-{knob.id}-message"
    >
      {problem}
    </p>
  {/if}
  {#if zeroBasedChannel}
    <p class="sr-only" id={cueId} data-testid="midi-field-{knob.id}-cue">
      {LUA_CHANNEL_CUE}
    </p>
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

  /* The refusal, in the error ink, on its own line under the row - never on a button. */
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
