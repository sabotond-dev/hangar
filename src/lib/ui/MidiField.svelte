<!--
  One typed MIDI field: PDF page 5's `CC number` / `Channel` box (13.1-07;
  13.1-CONTEXT D-09; bench line 7, screenshot 2: "replace MIDI channel
  selector with MIDI output selector with input fields, exactly as on the
  attached screenshot").

  A TEXT INPUT OVER A CLOSED LIST, NEVER A FREE NUMERIC. The knob underneath
  is unchanged - its option list, its index, its default - because a five-bit
  index is what makes the stamp, the forecast and the sweep possible, and no
  knob's value count moves here. What the visitor types is mapped back to
  that list through view.ts's `typedIndex`: a whole number the knob offers
  moves the knob to that index (`onchange(id, index)`, the same call a rail
  makes); a whole number it does not offer is REFUSED in the field with the
  offered values named (`offeredLine`); anything that is not a whole number
  is refused with `TYPE_A_NUMBER`. Phase 13 D-14 Q5 ("free-typed numerics
  live only in the Sandbox") is overridden for these fields and no other.

  THE LAST GOOD VALUE SURVIVES A REFUSAL (13-16's rule and its shape,
  RegionInspector.svelte's numeric field): the field is uncontrolled in one
  direction only - its value is the model's own literal, or, while a
  keystroke has been refused, the text that was typed - and a refused text
  stays in the field with `aria-invalid` and the message under it until a
  keystroke validates. The model never sees a refused keystroke, so nothing
  half-typed reaches the stamp, the tuner or the wire. The refusal is
  cleared when the knob moves from outside (a per-field reset, Reset
  settings, Undo randomize), so a stale message never sits over a fresh
  value.

  X-08 IS KEPT, AND THE CUE SAYS SO. The value shown is the knob's own
  literal as `integerReadout` prints it - on a Lua entry the channel is the
  firmware's zero-based `0` to `15`, on a preset the DAW's `1` to `16` -
  because renumbering a value about to be written to hardware is the lie
  X-08 forbids. The PDF draws `1`. Until 13.1-CONTEXT question 5 is answered
  a Lua entry's Channel (the run that starts at 0) carries LUA_CHANNEL_CUE
  as a helper line beneath it and in its aria-describedby, so the asked
  state is not a silent off-by-one; a preset's Channel carries no cue
  (13.1-PLAN-CHECK W-16).

  THE LABEL IS THE PDF'S FOR `cc` AND `channel` AND THE KNOB'S OWN FOR THE
  REST (`CC base`, `Send`), through inspector-copy's `midiFieldLabel` -
  13.1-CONTEXT question 6, shipped this way. Section 7's changed-field
  marker and per-field reset are Knob.svelte's, kept here in the same shape
  (`changed` is the one comparison, the reset named for the field, disabled
  at the default). The lock is NOT here: a MIDI destination is out of every
  Randomize roll already (surprise.ts's predicate), so a lock on it would be
  a control that changes nothing.

  Knob.svelte is not edited and its three circles do not move: the region
  hands the MIDI partition to this component instead of the rack, and
  `widgetFor`'s resolution of these knobs (a rail, at five and sixteen
  integers) is simply never rendered. 44px floor on the input and the reset;
  no corner anywhere (D-01).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { untrack } from "svelte";
  import {
    FIELD_CHANGED,
    FIELD_RESET,
    LUA_CHANNEL_CUE,
    TYPE_A_NUMBER,
    fieldResetName,
    midiFieldLabel,
    offeredLine,
  } from "$lib/tune/inspector-copy";
  import { integerRun, typedIndex, type KnobView } from "$lib/tune/view";

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
  /**
   * A Lua entry's channel: the contiguous run that starts at the firmware's
   * 0. A preset's starts at 1 and gets no cue (W-16; question 5).
   */
  const zeroBasedChannel = $derived(
    knob.id === "channel" && integerRun(literals)?.min === 0,
  );

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
  <!--
    The label with section 7's changed-field marker at its start (Knob.svelte's
    shape): a 6px square in the ink while the field is off its default, and a
    hidden sentence for a screen reader.
  -->
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
    inputmode="numeric"
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
  /*
    Knob.svelte's stacked row, kept: a 14px line box for the label, a 4px
    gap, the box in its 44px row, and the reset spanning both rows at the
    inline end - so a MIDI field is the same height as the grid field it
    replaces (14 + 4 + 44 = 62) and the rows below it do not move. The
    message and the cue take a row of their own beneath, full width.
  */
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

  /*
    The changed-field marker: a 6px square in the ink at the label's start.
    Ink and never accent - a change is information, and the reserved list is
    held at eight by tune-ui.spec.ts. No radius (D-01).
  */
  .changed {
    position: absolute;
    inset-inline-start: 0;
    inset-block-start: 0.35em;
    inline-size: 6px;
    block-size: 6px;
    background: var(--color-ink);
  }

  /*
    The PDF's field box under the 44px floor: a boundary hairline, square
    (D-01), the workspace's ground, the panel's ink, tabular numerals so a
    value never jitters. 16px so iOS does not zoom a focused field.
  */
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
