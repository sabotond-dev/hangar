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

  COLOUR IS NEVER THE ONLY CHANNEL. An active chip carries accent text, a tinted
  background and the checkbox's own checked state; a disabled chip carries dim
  text, a softened border and the real attribute. Both survive a greyscale
  screenshot, which is the cheapest way to check it and the way it was checked.

  The tint is Phase 5's already-declared rgb(214 255 78 / 0.08) - Knob.svelte's
  pressed word-row background - held for as long as the filter is on rather than
  for as long as a pointer is down. No token is added for it, and the ninth
  token (the over-budget alarm) appears nowhere on a browse screen: no meter
  exists here, so no over-budget state does either.

  The geometry is Knob.svelte's word-row option, which is deliberate: the site
  has one way of saying "this is the live value", and a filter chip is that
  widget in checkbox form.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  let {
    tag,
    active,
    disabled,
    ontoggle,
  }: {
    /** The tag, verbatim from the catalog. Never re-cased, never re-worded. */
    tag: string;
    active: boolean;
    /** Would return nothing given the active set. A real `disabled` attribute. */
    disabled: boolean;
    ontoggle: (tag: string) => void;
  } = $props();
</script>

<label class="chip pill" class:active class:disabled data-testid="tag-{tag}">
  <input
    class="sr-only"
    type="checkbox"
    checked={active}
    {disabled}
    onchange={() => ontoggle(tag)}
  />
  <span class="text">{tag}</span>
</label>

<style>
  /*
    The 44px floor is the interactive box, Phase 4 exception 1, and it stays
    here on both axes because it is this control's rather than its shape's -
    browse-ui.spec.ts's both-axes walk reads it off this rule by selector.

    THE SHAPE IS src/app.css's .pill NOW (10-UI-SPEC 19.1b, D-15 reference C),
    applied by the class on the label above: the border, the radius, the fill
    and 24px of inline padding, which replaces Phase 5 exception 3's 12px. The
    two states below are UNCHANGED and deliberately so - the active chip's tint
    is reserved-list entry 8 and the disabled chip's softened border is its
    second channel, and both outrank the shared rule on specificity without
    restating any of it.
  */
  .chip {
    position: relative;
    display: grid;
    place-items: center;
    min-inline-size: 44px;
    min-block-size: 44px;
    cursor: pointer;
    transition:
      color 140ms ease-out,
      background-color 140ms ease-out,
      border-color 140ms ease-out;
  }

  /*
    The checkbox is visually hidden, so Phase 4's ring is drawn on the label -
    the same relocation Knob.svelte makes for its radios and its range. No
    control on this site is focusable without a visible ring.
  */
  .chip:has(:focus-visible) {
    outline: 2px solid var(--color-accent);
    outline-offset: 4px;
  }

  /* Micro (title): 12px / 600 / 1.2 / 0.01em, sentence case, verbatim. */
  .text {
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.01em;
    color: var(--color-ink-quiet);
    transition: color 140ms ease-out;
  }

  .chip:hover:not(.disabled) .text {
    color: var(--color-ink);
  }

  /* Reserved-list entry 8: the live value of a control. No new accent use. */
  .chip.active {
    background: rgb(214 255 78 / 0.08);
  }

  .chip.active .text,
  .chip.active:hover .text {
    color: var(--color-accent);
  }

  .chip.disabled {
    border-color: var(--color-line-soft);
    cursor: not-allowed;
  }

  .chip.disabled .text {
    color: var(--color-ink-dim);
  }

  @media (prefers-reduced-motion: reduce) {
    .chip,
    .text {
      transition: none;
    }
  }
</style>
