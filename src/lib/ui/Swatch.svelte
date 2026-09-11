<!--
  The swatch: PDF page 5's Appearance row, and the popover that holds the
  picker (plan 13-09, Bible section 7, 13-CONTEXT.md D-10, D-15).

  Section 7 asks for a swatch that opens a colour popover with the exact value
  still available. The PDF draws it: a 34 x 34 square in the colour, the hex
  beside it, and a right-aligned `Edit color`. This component draws ONE ROW
  PER COLOUR KNOB the entry declares - six entries carry two or three - and
  ONE popover for all of them, because the picker is one block per panel
  (10-UI-SPEC 11.2) and a row's link opens it on that row's knob.

  THE PICKER IS MOVED, NOT REWRITTEN. ColourPicker.svelte's RGB444 lattice,
  its three sixteen-detent rails, its cheap-step marks and the picker-corner
  budget arithmetic are the most expensive correctness in the tree; this file
  puts the component inside a dialog and hands it the knob to open on, and
  13-09-SUMMARY.md pastes the picker's diffstat to show that nothing else in
  it moved. Its three true circles stay round inside the popover (D-15).

  A <dialog>, OPENED WITH showModal(), AND THAT IS THE WHOLE OF THE
  ACCESSIBILITY (section 14): the platform gives the focus trap (everything
  outside a modal dialog is inert), the top layer, and Escape through the
  cancel event, so none of the three is re-implemented here and none can
  drift. The two things the platform does not give are written here: a click
  on the backdrop closes (the backdrop is the dialog element itself, so
  `event.target === dialog` is the test), and focus RETURNS TO THE LINK THAT
  OPENED IT on close, whichever way it closed. The dialog's accessible name is
  the knob's own label through aria-labelledby - section 7 says to use actual
  parameter names, and no name is invented. tune-ui.spec.ts holds the three
  shapes, and e2e/tuning.e2e.ts presses Escape and reads the focus back.

  THE HEX IS SHOWN AND NEVER ANNOUNCED. The picker's aria-valuetext is the
  three stored integers (view.ts: a hex implies a 24-bit resolution the pad
  cannot reach); the PDF draws `#DCFF71` beside the square, and the hex of a
  stored colour is exact because every channel is a multiple of 17, so the
  eye gets the PDF's form and the ear gets the firmware's. The batch may
  choose either (13-COPY-NEW.md, 13-09's question 3).

  No corner above zero (D-01): the square, the dialog and its sheet are
  square. --color-error-ink appears nowhere in this file.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy } from "svelte";
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
  const titleId = `${uid}-title`;

  /** The knob the popover opened on, or undefined while it is closed. */
  let openFor = $state<string | undefined>(undefined);
  let dialog = $state<HTMLDialogElement | null>(null);
  /** The link that opened the popover, so focus can go back to it. */
  let trigger: HTMLButtonElement | undefined;

  const opened = $derived(
    knobs.find((knob) => knob.id === openFor) ?? knobs[0],
  );

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

  function open(knob: KnobView, event: MouseEvent): void {
    trigger = event.currentTarget as HTMLButtonElement;
    openFor = knob.id;
    dialog?.showModal();
  }

  function close(): void {
    dialog?.close();
  }

  /** The backdrop is the dialog element itself; a click on the sheet is not. */
  function onBackdropClick(event: MouseEvent): void {
    if (event.target === dialog) close();
  }

  /** Whichever way it closed - Escape, the backdrop, the button - focus goes back. */
  function onClosed(): void {
    openFor = undefined;
    trigger?.focus();
    trigger = undefined;
  }

  onDestroy(() => {
    if (dialog?.open) dialog.close();
  });
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
          class="edit"
          type="button"
          data-testid="edit-color"
          aria-describedby="{uid}-{knob.id}-label"
          onclick={(event) => open(knob, event)}
        >
          {EDIT_COLOR}
        </button>
      </div>
    </div>
  {/each}
</div>

<!--
  The popover. Rendered once, closed, so the picker's rails are in the DOM
  and a stamp's knobs can be read off them before anything is opened; opened
  with showModal() on a row's link. `onclose` fires for every way out.
-->
<dialog
  bind:this={dialog}
  class="popover"
  data-testid="colour-popover"
  aria-labelledby={titleId}
  onclick={onBackdropClick}
  onclose={onClosed}
>
  <div class="sheet">
    <div class="head">
      <p class="title type-micro" id={titleId}>{opened?.label ?? ""}</p>
      <button
        class="close"
        type="button"
        data-testid="colour-popover-close"
        onclick={close}
      >
        {POPOVER_CLOSE}
      </button>
    </div>
    <!-- Re-keyed on the knob it opened on: the picker reads selectedId once, at init. -->
    {#key openFor}
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
        selectedId={openFor}
      />
    {/key}
  </div>
</dialog>

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

  /* The PDF's row: the square, the hex, and the link pushed to the right. */
  .value {
    display: flex;
    align-items: center;
    gap: 16px;
    min-block-size: 44px;
  }

  /*
    THE ONE FILL THAT IS NOT A TOKEN: the square is the stored RGB444 value,
    a 1:1 preview of what the LEDs will emit (A-09's carve-out). 34 x 34, the
    PDF's, square-cornered (D-01), a boundary hairline so a dark colour has an
    edge on the panel.
  */
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

  /*
    The popover: a panel-coloured sheet in the top layer, square-cornered,
    sized to the picker. Zero padding on the dialog itself so a click on the
    backdrop lands on the dialog and a click on the sheet does not.
  */
  .popover {
    padding: 0;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: var(--color-panel);
    color: var(--color-ink);
    inline-size: min(92vw, 520px);
    max-block-size: 90dvh;
  }

  .popover::backdrop {
    background: var(--color-workspace);
    opacity: 0.7;
  }

  .sheet {
    padding: 20px;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-block-end: 12px;
  }

  .title {
    margin: 0;
    color: var(--color-ink-quiet);
  }

  .close {
    appearance: none;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 12px;
    border: 1px solid var(--color-boundary);
    background: transparent;
    font-family: var(--font-sans);
    font-size: 14px;
    color: var(--color-ink);
    cursor: pointer;
  }

  .close:hover {
    border-color: var(--color-action);
  }

  @media (prefers-reduced-motion: reduce) {
    .edit {
      transition: none;
    }
  }
</style>
