<!--
  The swatch: PDF page 5's Appearance row, and the colour block that opens
  under it (plan 13-09, Bible section 7, 13-CONTEXT.md D-10, D-15; 13.1-04,
  13.1-CONTEXT.md D-08).

  Section 7 asks for a swatch that opens the colour editor with the exact
  value still available. The PDF draws it: a 34 x 34 square in the colour, the
  hex beside it, and a right-aligned `Edit color`. This component draws ONE
  ROW PER COLOUR KNOB the entry declares - six entries carry two or three -
  and ONE editor block for all of them, because the picker is one block per
  panel (10-UI-SPEC 11.2) and a row's toggle opens it on that row's knob.

  INLINE, BELOW THE ROW, SINCE 13.1-04 (bench line 7, 2026-09-12: "Edit
  color should not be pop up window in the left upper corne but instead open
  down seamlessly to edit color."; D-08). 13-09 put the picker in a <dialog>
  opened with showModal(); the user saw a modal box in the top-left corner,
  and the PDF's inspector is one column that grows. So the dialog is gone:
  `Edit color` is a toggle (aria-expanded, aria-controls) and the editor is a
  block in the inspector's own flow directly under the row it belongs to. The
  rows below move down; nothing floats, nothing is positioned, there is no
  backdrop and no top layer. The toggle reads `Close` (F.8's approved word,
  kept) while its block is open; a click on another row's toggle moves the
  block to that row.

  THE PICKER IS MOVED, NOT REWRITTEN - twice now. ColourPicker.svelte's
  RGB444 lattice, its three sixteen-detent rails, its cheap-step marks and
  the picker-corner budget arithmetic are the most expensive correctness in
  the tree; this file hands the component the knob to open on and nothing
  else, and 13.1-04-SUMMARY.md shows its diffstat empty. Its three true
  circles stay round inside the block (D-15).

  FOCUS SIMPLIFIES: NO TRAP, NO RETURN (section 14, D-08). An inline group is
  not a modal: nothing outside it is made inert, Tab walks on into the rows
  below, and the toggle never leaves the DOM, so there is nothing to give
  back. Escape inside the open block closes it and puts focus on the row's
  toggle - only because the element that held focus is about to leave the DOM
  (KeepConfirm's rule for an inline group, 13-11), not as a modal's return.
  The block's accessible name is the knob's own label through
  aria-labelledby - section 7 says to use actual parameter names, and no name
  is invented. tune-ui.spec.ts holds the shape, and e2e/tuning.e2e.ts presses
  Escape and reads the focus.

  THE PICKER RENDERS ONLY WHILE OPEN. 13-09 rendered the dialog once, closed,
  so the picker's rails were in the DOM and a stamp's knobs could be read off
  them before anything was opened. That reason went with the dialog: the
  rails are in the DOM only while the block is open, and the e2e that reads
  them opens the block first (`openColourEditor`, then `knobIndices`).

  THE HEX IS SHOWN AND NEVER ANNOUNCED. The picker's aria-valuetext is the
  three stored integers (view.ts: a hex implies a 24-bit resolution the pad
  cannot reach); the PDF draws `#DCFF71` beside the square, and the hex of a
  stored colour is exact because every channel is a multiple of 17, so the
  eye gets the PDF's form and the ear gets the firmware's. The batch may
  choose either (13-COPY-NEW.md, 13-09's question 3).

  No corner above zero (D-01): the square and the block are square, and no
  border-radius is declared here at all. --color-error-ink appears nowhere in
  this file.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { tick } from "svelte";
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

  /** The knob the block is open on, or undefined while it is closed. */
  let openFor = $state<string | undefined>(undefined);
  /** Each row's toggle by knob id, so Escape can put focus on the row's own. */
  let toggles: Record<string, HTMLButtonElement | undefined> = {};

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

  /** The row's toggle: open the block on this knob, or close it if it is open here. */
  function toggleFor(knob: KnobView): void {
    openFor = openFor === knob.id ? undefined : knob.id;
  }

  /**
   * Escape INSIDE the block closes it. The element holding focus is about to
   * leave the DOM, so focus is placed on the row's toggle once the block is
   * gone - the one deliberate focus move in this file, and it is not a return.
   */
  async function onEditorKeydown(
    event: KeyboardEvent,
    id: string,
  ): Promise<void> {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    const toggle = toggles[id];
    openFor = undefined;
    await tick();
    toggle?.focus();
  }
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
          bind:this={toggles[knob.id]}
          class="edit"
          type="button"
          data-testid="edit-color"
          aria-expanded={openFor === knob.id}
          aria-controls="{uid}-{knob.id}-editor"
          aria-describedby="{uid}-{knob.id}-label"
          onclick={() => toggleFor(knob)}
        >
          {openFor === knob.id ? POPOVER_CLOSE : EDIT_COLOR}
        </button>
      </div>
      <!--
        The block, in the row's own flow, rendered only while open on this
        knob. Re-keyed on the knob: the picker reads selectedId once, at init.

        The keydown on the group is DELEGATED, as BrowseGrid's is: the things
        that take focus and receive the key are the picker's rails, its
        selector and its buttons inside, and the handler exists so Escape on
        any of them closes the block. A window listener (KeepConfirm's shape)
        would do the same at one remove; this one is scoped to the block by
        construction. The explanation is a separate comment on purpose:
        everything after the rule name inside a svelte-ignore comment is
        parsed as further rule names, and svelte/no-unused-svelte-ignore then
        reports one error per word.
      -->
      {#if openFor === knob.id}
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
          class="editor"
          id="{uid}-{knob.id}-editor"
          role="group"
          aria-labelledby="{uid}-{knob.id}-label"
          data-testid="colour-editor"
          data-knob={knob.id}
          onkeydown={(event) => onEditorKeydown(event, knob.id)}
        >
          {#key knob.id}
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
              selectedId={knob.id}
            />
          {/key}
        </div>
      {/if}
    </div>
  {/each}
</div>

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

  /* The PDF's row: the square, the hex, and the toggle pushed to the right. */
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
    THE ONE ACCENT DECLARATION IN THIS FILE (the census in tune-ui.spec.ts):
    13-09 spent it on the popover's Close button's hover border; with the
    dialog gone it moves to the toggle's OPEN state, so the row whose block is
    open reads as the selected one - entry 8's family, the selected value of
    a knob, here the selected row. Nothing else in this file takes the token.
  */
  .edit[aria-expanded="true"] {
    color: var(--color-action);
  }

  /*
    The block: the panel's own surface, in the flow, square-cornered, a
    hairline rule above so the picker reads as the row's own. No shadow, no
    position, no top layer - the rows below simply move down.
  */
  .editor {
    padding-block: 12px;
    border-block-start: 1px solid var(--color-divider);
    background: var(--color-panel);
  }

  @media (prefers-reduced-motion: reduce) {
    .edit {
      transition: none;
    }
  }
</style>
