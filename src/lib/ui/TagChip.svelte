<!--
  One toolbar chip: a real <input type="checkbox"> in a label, never a role on a
  div - the platform brings Space, checked, disabled and the label association,
  and removing an active chip is pressing it again (W-14). Props: tag (the
  machine term, never re-cased; keys the test id and the toggle), label (what the
  visitor reads, FOR_LABELS; defaults to the term), active, disabled (a chip that
  would return nothing is a real disabled attribute, never aria-disabled alone),
  ontoggle. No number on a chip (CAT-02, W-04). The PDF's rectangle (D-01): a 1px
  boundary at rest, the action colour on the outline AND the label when active,
  never a fill; the disabled chip keeps the boundary token. 44px on both axes.
  Decided at 05.1-04 / 13-08 (W-14, D-05); see .planning/phases/13-gui-overhaul/13-08-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  let {
    tag,
    label = tag,
    active,
    disabled,
    ontoggle,
  }: {
    /** The machine term, verbatim from the vocabulary. Keys the test id and the toggle. */
    tag: string;
    /** What the visitor reads. Defaults to the term. */
    label?: string;
    active: boolean;
    /** Would return nothing given the active set. A real `disabled` attribute. */
    disabled: boolean;
    ontoggle: (tag: string) => void;
  } = $props();
</script>

<label class="chip" class:active class:disabled data-testid="tag-{tag}">
  <input
    class="sr-only"
    type="checkbox"
    checked={active}
    {disabled}
    onchange={() => ontoggle(tag)}
  />
  <span class="text">{label}</span>
</label>

<style>
  /* The 44px floor on both axes is this control's own. A rectangle: no radius anywhere. */
  .chip {
    position: relative;
    display: grid;
    place-items: center;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    background: transparent;
    cursor: pointer;
    transition:
      color 140ms ease-out,
      border-color 140ms ease-out;
  }

  /* The checkbox is visually hidden, so the focus ring is drawn on the label (Knob.svelte's relocation). */
  .chip:has(:focus-visible) {
    outline: 2px solid var(--color-action);
    outline-offset: 4px;
  }

  .text {
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
    color: var(--color-ink);
    transition: color 140ms ease-out;
  }

  .chip:hover:not(.disabled) {
    border-color: var(--color-ink);
  }

  /* The PDF's active chip: the action colour on the outline and on the word. */
  .chip.active,
  .chip.active:hover:not(.disabled) {
    border-color: var(--color-action);
  }

  .chip.active .text,
  .chip.active:hover .text {
    color: var(--color-action);
  }

  .chip.disabled {
    cursor: not-allowed;
  }

  .chip.disabled .text {
    color: var(--color-ink-quiet);
  }

  @media (prefers-reduced-motion: reduce) {
    .chip,
    .text {
      transition: none;
    }
  }
</style>
