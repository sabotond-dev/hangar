<!--
  One knob, one row (change 16, 2026-09-21; change 16b's grid): label | control | reset | lock -
  the label column --tune-label-w (Inspector.svelte's, per breakpoint), the control filling the rest
  edge to edge at 44px, the two boxes fixed 44 and always present (an empty cell where the knob has
  no lock); under 380px of container the label takes a line of its own. Four skins, chosen by
  $lib/tune/view's widgetFor and never re-derived here: `words` a segmented control of real radios
  in labels (equal cells; a second line of cells only when the words cannot share one), `select` a
  real select, `stepper` Stepper.svelte over the rungs (a typed value snaps to the nearest declared
  rung on Enter or blur - view.ts's nearestRung), `swatch` the picker's palette row (`bare`: no label
  cell). A changed field is a 2px action rule in the row's start padding, with FIELD_CHANGED for a
  screen reader; the reset box is disabled at the default; the lock a real <button aria-pressed>.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { KNOB_HELD, KNOB_HOLD } from "$lib/tune/copy";
  import {
    FIELD_CHANGED,
    FIELD_RESET,
    fieldResetName,
  } from "$lib/tune/inspector-copy";
  import {
    knobPosition,
    nearestRung,
    noteNumber,
    rankOf,
    valueOrder,
    type KnobView,
  } from "$lib/tune/view";
  import Stepper from "./Stepper.svelte";

  let {
    view,
    lock = true,
    reset = true,
    caption = true,
    held = false,
    onchange,
    onreset,
    onhold,
  }: {
    /** The knob, with its widget already chosen by $lib/tune/view. */
    view: KnobView;
    /** Render the lock box, or leave it to a parent (the picker's palette row has none). */
    lock?: boolean;
    /** Render the reset box; the picker's palette row leaves it to the swatch row above. */
    reset?: boolean;
    /** Paint the label; the picker's palette row keeps it for a screen reader only, its head names the knob. */
    caption?: boolean;
    /** Locked out of the roll. EPHEMERAL: the region owns the set; a held knob's link is the same link. */
    held?: boolean;
    /** A new index on this knob. */
    onchange: (index: number) => void;
    /** Back to the default index. */
    onreset: () => void;
    /** The lock, toggled. The region owns what held means; this only says so. Absent with the lock. */
    onhold?: () => void;
  } = $props();

  /** The default's accessible name, said once on the control through aria-describedby. */
  const homeSentence = $derived(
    `Default is ${view.values[view.default]?.label ?? ""}.`,
  );

  /** The selected option's display form: the integer, the note, the word. */
  const valueText = $derived(view.values[view.index]?.label ?? "");

  /** Section 7's "changed field": one comparison, and the whole of it. */
  const changed = $derived(view.index !== view.default);

  /** The rungs in value order, for the stepper's rank; the identity when the values are not numbers. */
  const literals = $derived(view.literals ?? []);
  const order = $derived(valueOrder(literals));
  const rank = $derived(rankOf(order, view.index));

  /** The two skins that carry a real <label for>: the stepper and the select. */
  const labelled = $derived(
    view.widget === "stepper" || view.widget === "select",
  );

  /**
   * The segmented row's columns: every word on one line of equal cells where the widest word
   * fits the column so; where it cannot, the fewest rows and the same number of cells on each
   * (four words as 2 x 2, never 3 + 1). The server renders an estimate from the character count
   * (--segment-chars); once mounted the words and the column are measured, again when the face
   * has loaded and whenever the column resizes.
   */
  const longestWord = $derived(
    view.values.reduce((max, value) => Math.max(max, value.label.length), 1),
  );
  let optionsEl = $state<HTMLDivElement | undefined>(undefined);
  let segmentCols = $state<number | undefined>(undefined);
  /** The cell's padding and its two hairlines, beside the word. */
  const CELL_EXTRA = 8;

  $effect(() => {
    const el = optionsEl;
    if (el === undefined || view.widget !== "words") return;
    const count = view.values.length;
    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const widest = Math.max(
        40,
        ...Array.from(
          el.querySelectorAll<HTMLElement>(".word"),
          (word) => word.scrollWidth + CELL_EXTRA,
        ),
      );
      // The cells overlap by a hairline and the grid starts 1px in, so k cells need k * (widest - 1) + 2.
      const fit = Math.floor((el.clientWidth - 2) / (widest - 1));
      let cols = Math.max(1, Math.min(count, fit));
      if (cols < count) cols = Math.ceil(count / Math.ceil(count / cols));
      if (cols !== segmentCols) segmentCols = cols;
    };
    measure();
    void document.fonts.ready.then(measure);
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(el);
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  });

  const controlId = $derived(`knob-${view.id}-control`);
  const labelId = $derived(`knob-${view.id}-label`);
  const homeId = $derived(`knob-${view.id}-home`);

  /** A slot on the control becomes a KNOB POSITION, through the one named door. */
  function pick(slot: number) {
    if (slot !== knobPosition(view)) onchange(slot);
  }

  /** The select's value is the slot. */
  function pickSelected(event: Event) {
    const target = event.currentTarget as HTMLSelectElement;
    pick(Number.parseInt(target.value, 10));
  }

  /** A rank on the value-ordered ladder, back to the declared index. */
  function pickRank(at: number) {
    const index = order[Math.min(order.length - 1, Math.max(0, at))];
    if (index !== undefined) pick(index);
  }

  /**
   * The typed text, on Enter or blur only: a note name or a number, snapped to the nearest
   * declared rung; text that is neither leaves the field on the rung it showed.
   */
  function typedText(text: string, committed: boolean) {
    if (!committed) return;
    const asNote = view.kind === "note" ? noteNumber(text) : undefined;
    const at = nearestRung(
      literals,
      asNote === undefined ? text : String(asNote),
    );
    if (at !== undefined) pick(at);
  }
</script>

<div
  class="knob"
  data-testid="knob-{view.id}"
  data-index={view.index}
  data-changed={changed}
  data-widget={view.widget}
>
  <div class="row" class:changed class:bare={!caption}>
    {#if labelled}
      <label class="label type-micro" for={controlId}>{view.label}</label>
    {:else}
      <span class={caption ? "label type-micro" : "sr-only"} id={labelId}
        >{view.label}</span
      >
    {/if}
    {#if changed}
      <span class="sr-only" data-testid="knob-{view.id}-changed"
        >{FIELD_CHANGED}</span
      >
    {/if}
    <span class="sr-only" id={homeId}>{homeSentence}</span>

    {#if view.widget === "stepper"}
      <div class="control">
        <Stepper
          id={controlId}
          testid="knob-{view.id}"
          value={view.readout ?? valueText}
          unit={view.unit}
          {rank}
          count={view.values.length}
          describedBy={homeId}
          inputmode={view.kind === "note" ? "text" : "numeric"}
          ontext={typedText}
          onrank={pickRank}
        />
      </div>
    {:else if view.widget === "select"}
      <div class="control select-wrap">
        <select
          class="select"
          id={controlId}
          aria-describedby={homeId}
          onchange={pickSelected}
        >
          {#each view.values as value, at (at)}
            <option value={at} selected={at === view.index}
              >{value.label}</option
            >
          {/each}
        </select>
      </div>
    {:else}
      <div
        class="control options"
        class:swatches={view.widget === "swatch"}
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={homeId}
        class:measured={segmentCols !== undefined}
        style:--segment-chars={longestWord}
        style:--segment-cols={segmentCols}
        bind:this={optionsEl}
      >
        {#each view.values as value, at (at)}
          <label class="option" class:selected={at === view.index}>
            <input
              class="sr-only"
              type="radio"
              name="knob-{view.id}"
              value={at}
              checked={at === view.index}
              onchange={() => pick(at)}
            />
            {#if view.widget === "swatch"}
              <span
                class="swatch"
                style:background-color={value.swatch}
                aria-hidden="true"
              ></span>
              <span class="sr-only">{value.name ?? value.label}</span>
            {:else}
              <span class="word">{value.label}</span>
            {/if}
          </label>
        {/each}
      </div>
    {/if}

    {#if reset}
      <button
        class="box reset"
        type="button"
        data-testid="knob-{view.id}-reset"
        disabled={!changed}
        aria-label={fieldResetName(view.label)}
        title={FIELD_RESET}
        onclick={onreset}
      >
        <svg class="glyph" viewBox="0 0 20 20" aria-hidden="true">
          <line x1="5" y1="6" x2="15" y2="6" />
          <line x1="15" y1="6" x2="15" y2="12" />
          <line x1="15" y1="12" x2="7" y2="12" />
          <line x1="7" y1="12" x2="10" y2="9" />
          <line x1="7" y1="12" x2="10" y2="15" />
        </svg>
      </button>
    {/if}

    {#if lock}
      <button
        class="box lock"
        type="button"
        data-testid="knob-{view.id}-hold"
        aria-pressed={held}
        aria-label={held ? KNOB_HELD : KNOB_HOLD}
        title={held ? KNOB_HELD : KNOB_HOLD}
        onclick={onhold}
      >
        <svg class="glyph" viewBox="0 0 20 20" aria-hidden="true">
          <line x1="5" y1="10" x2="15" y2="10" />
          <line x1="15" y1="10" x2="15" y2="17" />
          <line x1="15" y1="17" x2="5" y2="17" />
          <line x1="5" y1="17" x2="5" y2="10" />
          <line x1="7" y1="10" x2="7" y2="5" />
          <line x1="7" y1="5" x2="13" y2="5" />
          <line x1="13" y1="5" x2="13" y2={held ? 10 : 7} />
        </svg>
      </button>
    {/if}
  </div>
</div>

<style>
  /* The root is the container its row queries, so the rack, the picker and the Sandbox need none. */
  .knob {
    container-type: inline-size;
  }

  /*
    The rack's grid (change 16b): label | control | reset | lock. The label column is one width
    per breakpoint (--tune-label-w, Inspector.svelte's), the control column the rest, the two box
    columns fixed 44 and always present, 8px between, 44px tall. Every flexible track is
    minmax(0, ...): a track's automatic minimum is its content's min-content width, which is how a
    rack once scrolled sideways on a phone (tuning-webkit.e2e.ts measures it).
  */
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

  /* Section 7's marker: a 2px rule in the action colour down the row's start while the field is off its default. */
  .row.changed::before {
    content: "";
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    inline-size: 2px;
    background: var(--color-action);
  }

  /*
    Under 380px of container (4 + 96 + 8 + a stepper of 44 + 84 + 44 + 8 + 88: the label, a field
    holding "250 points", the two boxes) the label takes a line of its own; the control still fills
    its column and the boxes keep their two columns at the row's end. The wide band's body is 385
    and the compact band's under 380 at 1280, so the switch is at the band (tuning-webkit.e2e.ts).
  */
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

  /* The picker's palette row has no label cell and no line of its own: the swatches from the block's start, the two empty cells at its end. */
  .row.bare {
    grid-template-columns: minmax(0, 1fr) 44px 44px;
    grid-template-areas: "control reset lock";
    row-gap: 0;
    padding-block: 0;
  }

  /* The eyebrow face, quiet; ink while the row is hovered or holds focus. */
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

  /* The control column: whatever the skin, it fills the column edge to edge, 44px tall. */
  .control {
    grid-area: control;
    display: grid;
    box-sizing: border-box;
    inline-size: 100%;
    min-inline-size: 0;
    min-block-size: 44px;
  }

  /*
    The segmented control: real radios in labels under a radiogroup, drawn as joined boxes of
    EQUAL width - each a boundary hairline, the shared edges collapsed - the chosen one outlined
    and worded in the action colour (the selected value of a knob, reserved-list entry 8), never
    a fill alone. Until measured, the cell's floor is estimated from the longest word
    (--segment-chars); measured, the columns are counted (--segment-cols) and the cells share the
    width equally - the brief's repeat(n, 1fr).
  */
  .options {
    grid-template-columns: repeat(
      auto-fit,
      minmax(calc(var(--segment-chars, 4) * 0.5em + 8px), 1fr)
    );
    padding-block-start: 1px;
    padding-inline-start: 1px;
    font-size: 13px;
    font-weight: 600;
    -webkit-touch-callout: none;
    user-select: none;
  }

  .options.measured {
    grid-template-columns: repeat(var(--segment-cols, 1), minmax(0, 1fr));
  }

  .option {
    position: relative;
    display: grid;
    place-items: center;
    box-sizing: border-box;
    min-inline-size: 0;
    min-block-size: 44px;
    padding-inline: 3px;
    margin-block-start: -1px;
    margin-inline-start: -1px;
    border: 1px solid var(--color-boundary);
    cursor: pointer;
    transition: border-color 140ms ease-out;
  }

  .option:hover {
    border-color: var(--color-ink-quiet);
  }

  .option.selected {
    z-index: 1;
    border-color: var(--color-action);
  }

  /* The radio is visually hidden, so the site's ring is drawn on the option. */
  .option:has(:focus-visible) {
    z-index: 1;
    outline: 2px solid var(--color-action);
    outline-offset: 2px;
  }

  .word {
    min-inline-size: 0;
    max-inline-size: 100%;
    overflow: hidden;
    white-space: nowrap;
    letter-spacing: 0.01em;
    color: var(--color-ink-quiet);
    transition: color 140ms ease-out;
  }

  .option:hover .word {
    color: var(--color-ink);
  }

  .option.selected .word {
    color: var(--color-action);
  }

  /* The picker's palette row: the colours under glass from the block's start, 8px apart, no shared edge, no fill. */
  .options.swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0;
  }

  .options.swatches .option {
    min-inline-size: 44px;
    padding-inline: 0;
    margin: 0;
    border-color: transparent;
  }

  /* The swatch is the stored RGB444 value, a 1:1 preview of the light (A-09's carve-out). Square (D-01). */
  .swatch {
    inline-size: 28px;
    block-size: 28px;
    border: 1px solid var(--color-boundary);
    transition: border-color 140ms ease-out;
  }

  .option:hover .swatch {
    border-color: var(--color-action);
  }

  .option.selected .swatch {
    outline: 2px solid var(--color-action);
    outline-offset: 2px;
  }

  /* The select: a boundary hairline, the field's 15px, the column's width at 44px, appearance none so no engine rounds it; the arrow inside the right padding. */
  .select-wrap {
    position: relative;
  }

  .select-wrap::after {
    content: "";
    position: absolute;
    inset-inline-end: 16px;
    inset-block-start: 50%;
    inline-size: 8px;
    block-size: 8px;
    border-inline-end: 1px solid var(--color-ink-quiet);
    border-block-end: 1px solid var(--color-ink-quiet);
    transform: translateY(-70%) rotate(45deg);
    pointer-events: none;
  }

  .select {
    appearance: none;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 44px;
    min-block-size: 44px;
    padding-inline: 12px 36px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: var(--color-workspace);
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.45;
    color: var(--color-ink);
    cursor: pointer;
  }

  .select:hover {
    border-color: var(--color-ink-quiet);
  }

  .select option {
    color: var(--color-ink);
    background: var(--color-panel);
  }

  /*
    The two boxes at the row's end: the tool rail's 44px square with a straight-line glyph. The
    reset's arrow returns; the lock's shackle seats when held. Quiet ink, full ink on hover and
    when held (the lock's second channel beside its word); the reset one rung down at the default.
  */
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

  /* Present and disabled at the default (DEGR-02's "never hidden"), one rung down. */
  .reset:disabled {
    color: var(--color-divider);
    cursor: default;
  }

  @media (prefers-reduced-motion: reduce) {
    .label,
    .option,
    .word,
    .swatch,
    .box {
      transition: none;
    }
  }
</style>
