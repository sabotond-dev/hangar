<!--
  One toolbar chip. A real checkbox that looks like a chip, in four states.

  IT IS AN <input type="checkbox"> AND NEVER role="checkbox" ON A DIV. The
  platform's own checkbox brings Space, the checked state, the disabled state,
  the label association and every assistive technology's idea of a toggle for
  free; a div wearing the role brings the announcement and none of the
  behaviour, and every one of those pieces would then have to be hand-written
  and hand-tested. Removing an active chip is pressing it again, which is what a
  checkbox already is - so there is no x, no glyph and no second control per
  chip (05.1-UI-SPEC W-14). This paragraph is the only place the role's name
  appears in this file, which is why a structural scan over it strips comments
  first.

  A CHIP THAT WOULD RETURN NOTHING IS A REAL `disabled` ATTRIBUTE, never
  aria-disabled alone. The difference is not cosmetic: aria-disabled says
  "unavailable" to a screen reader while leaving the control clickable to
  everybody, so a visitor who presses it empties the grid and reads the
  announcement as a bug. The real attribute is the one the toolbar wants,
  because the answer to "why can I not press this" is the active chips two
  centimetres away and the count line beneath them - which is also why there is
  no adjacent reason line here (05.1-UI-SPEC, The tag chips).

  NO NUMBER IS PRINTED ON A CHIP. Not the count of configurations carrying the
  tag, not a rank, and nothing else a visitor could read as popularity - CAT-02
  forbids the metric and the disabled state above is what makes the number
  unnecessary (W-04). The words this file is forbidden to render appear in this
  paragraph and nowhere in its markup.

  THE LABEL AND THE TERM ARE TWO PROPS SINCE PLAN 13-08. `tag` is the machine
  term - it keys the test id and the toggle, and it is never re-cased or
  re-worded here - and `label` is what the visitor reads: the FOR facet's
  display label from src/lib/browse/labels.ts (provisional until 13-18), which
  D-05 requires in place of an upper-cased identifier. Left out, the label is
  the term, which is what the front door's FEELS-free row and every test
  fixture get.

  THE SHAPE IS THE PDF's, PAGE 2: a rectangle (D-01, never a corner) with a
  1px boundary at rest; the active chip carries the ACTION COLOUR on its
  outline AND on its label, plus the checkbox's own checked state - colour is
  never the only channel, and selection is never a fill (13-03's second rule:
  raised-on-panel is 1.12:1, so a chip told apart by background alone would
  be invisible). Phase 5's lime tint is gone with the pill it sat in. A
  disabled chip keeps the boundary border - the divider token fails 3:1 and
  may bound no control (identity.spec.ts test 5) - and says so with the real
  attribute, the quiet ink and the cursor.

  The 44px floor is on both axes, per chip, because the touch contract is
  about the box under a finger and a chip reading `play` is four characters
  wide; browse-ui.spec.ts reads it off this rule by selector.

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

  /*
    The checkbox is visually hidden, so the focus ring is drawn on the label -
    the same relocation Knob.svelte makes for its radios and its range. No
    control on this site is focusable without a visible ring.
  */
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
