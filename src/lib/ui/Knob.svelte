<!--
  One knob. Three skins. No div pretending to be a slider.

  Twelve KnobKinds collapse to three widgets, and the choice is made in
  $lib/tune/view's widgetFor / railSkin and arrives here already made, on the
  KnobView. This component NEVER re-derives it: two copies of the widget rule is
  how a colour knob ends up a rail on one screen and a swatch row on another.
  The rule is TOTAL - a colour whose values are not RGB, a scale whose semitone
  set is not in the table, a note with more than eight options and every kind
  with no table of its own all fall through to a rail - so no knob can fail to
  render, and this file has no "unknown widget" branch because there is no such
  thing.

  EVERY SKIN IS A REAL FORM CONTROL WITH A REAL LABEL (05-UI-SPEC, Knob
  interaction contract). The rail is one <input type="range"> at opacity 0,
  absolutely positioned over the painted dots or track and filling the 44px box,
  so the platform gives arrows, Home, End and PageUp/PageDown for free and
  aria-valuetext carries the readout. The word row and the swatch row are real
  <input type="radio"> inside <label>s under a role="radiogroup", so native
  roving focus makes each of them ONE tab stop rather than n.

  WHY THE RANGE INPUT'S FOCUS RING IS DRAWN ON ITS WRAPPER. The input is
  invisible, so :focus-visible on the input itself would paint a ring nobody can
  see. .rail:has(:focus-visible) puts Phase 4's exact ring - 2px solid
  #d6ff4e, outline-offset 4px, border-radius inherit - around the painted
  control. A knob is never focusable without a visible ring.

  THE READOUT IS POSITIONAL, NEVER A LUA LITERAL. KnobValueView.label is already
  total and already display-safe (a word, a swatch name, the raw integer, or
  "Position 3 of 6"); model.ts resolved it. This file prints it and adds nothing.

  RESET, THREE WAYS, AND ONE KEY DELIBERATELY ABSENT. Double-click on the
  control area, Delete or Backspace on the focused control, or a 500 ms long
  press on a coarse pointer. Escape is NOT handled here and must never be:
  Phase 4 binds Escape to un-choosing the panel, and a knob that swallowed it
  would break the panel's only way out.

  --color-over appears nowhere in this file. The ninth token is scoped to three
  uses and all three of them are a meter's or a message's (05-UI-SPEC X-01); a
  knob is never red.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy } from "svelte";
  import { MediaQuery } from "svelte/reactivity";
  import type { KnobView } from "$lib/tune/view";

  let {
    view,
    stacked = false,
    onchange,
    onreset,
  }: {
    /** The knob, with its widget and skin already chosen by $lib/tune/view. */
    view: KnobView;
    /**
     * Label above the control rather than beside it. The rack decides: a word
     * row always stacks, and the rack's @container rule below stacks every row
     * under 220px whatever this says.
     */
    stacked?: boolean;
    /** A new index on this knob. Fired on every step of a drag. */
    onchange: (index: number) => void;
    /** Back to the default index. All three gestures call exactly this. */
    onreset: () => void;
  } = $props();

  /**
   * The accessible name of the default position, said ONCE on the group through
   * aria-describedby rather than repeated on every option (05-UI-SPEC,
   * Accessibility Contract).
   *
   * This sentence is authored here rather than imported from $lib/tune/copy
   * because it belongs to the Accessibility Contract, not the Copywriting
   * Contract - copy.spec.ts asserts that file character-for-character against
   * the copy table, and this string is not in it. Recorded as a finding in
   * 05-08-SUMMARY.md.
   */
  const homeSentence = $derived(
    `Default is ${view.values[view.default]?.label ?? ""}.`,
  );

  /** n. Every geometry below is a function of it. */
  const count = $derived(view.values.length);

  /** The selected option's display form: the integer, the note, the word. */
  const valueText = $derived(view.values[view.index]?.label ?? "");

  /** A dot rail paints one dot per POSITION; no per-value data reaches it. */
  const slots = $derived(view.values.map((_, at) => at));

  /** Percent along a detent track. A one-option knob sits at the start. */
  const fillPercent = $derived(
    count > 1 ? (view.index / (count - 1)) * 100 : 0,
  );
  const homePercent = $derived(
    count > 1 ? (view.default / (count - 1)) * 100 : 0,
  );

  /** Stable, unique-per-knob ids for label, group and description wiring. */
  const controlId = $derived(`knob-${view.id}-control`);
  const labelId = $derived(`knob-${view.id}-label`);
  const homeId = $derived(`knob-${view.id}-home`);

  /**
   * 500 ms, on a coarse pointer only. A MediaQuery rather than a one-shot read
   * so a device that changes pointer type mid-session needs no remount, which
   * is the same guarantee NamePlate makes for reduced motion.
   */
  const LONG_PRESS_MS = 500;
  const coarse = new MediaQuery("(pointer: coarse)");

  /** A timer handle, deliberately not a rune: nothing renders from it. */
  let pressTimer: ReturnType<typeof setTimeout> | undefined;

  function cancelPress() {
    if (pressTimer !== undefined) {
      clearTimeout(pressTimer);
      pressTimer = undefined;
    }
  }

  function beginPress() {
    if (!coarse.current) return;
    cancelPress();
    pressTimer = setTimeout(() => {
      pressTimer = undefined;
      onreset();
    }, LONG_PRESS_MS);
  }

  onDestroy(cancelPress);

  /**
   * Delete and Backspace reset the focused control. Escape is deliberately not
   * handled - see the header - and no other key is touched, so every native
   * binding the platform gives a range or a radio group survives.
   */
  function resetKeys(event: KeyboardEvent) {
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onreset();
    }
  }

  /**
   * A slot on the control becomes a KNOB POSITION.
   *
   * `view.positions` is undefined for every knob but one, and then this is the
   * identity it has always been. It is defined only when the view is a WINDOW
   * onto a larger knob - today only a lattice colour knob between plan 10-08,
   * which widens it to 4,096 positions, and 10-10, which builds the picker
   * that renders them. See `KnobView.positions`: without the translation a
   * click on the second swatch would write position 1 instead of position
   * 1,638, which is a wrong colour rather than a rendering detail.
   */
  function pick(slot: number) {
    const index = view.positions?.[slot] ?? slot;
    if (index !== (view.positions?.[view.index] ?? view.index)) {
      onchange(index);
    }
  }
</script>

<!--
  The row carries the reset gestures because "double-click anywhere on the
  control area" and "long press anywhere on it" are both area gestures, and the
  painted dots, swatches and words are not one element. The keyboard equivalent
  is on the controls themselves, so the interaction is complete without a
  pointer.

  The row therefore takes pointer handlers while staying a plain container, and
  a11y_no_static_element_interactions is silenced below rather than answered
  with a role. Giving this div a role would put a second, meaningless node in
  the accessibility tree in front of the real labelled control inside it, and
  giving it a tabindex would add a dead tab stop before every knob. Every
  gesture it carries already has a keyboard equivalent on the control itself -
  Delete and Backspace - so nothing here is pointer-only.

  The explanation is a separate comment on purpose: everything after the rule
  name inside a svelte-ignore comment is parsed as further rule names, and
  svelte/no-unused-svelte-ignore then reports one error per word.
-->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="row"
  class:stacked
  data-testid="knob-{view.id}"
  ondblclick={onreset}
  onpointerdown={beginPress}
  onpointerup={cancelPress}
  onpointercancel={cancelPress}
  onpointerleave={cancelPress}
>
  {#if view.widget === "rail"}
    <label class="label" for={controlId}>{view.label}</label>
  {:else}
    <span class="label" id={labelId}>{view.label}</span>
  {/if}

  <span class="sr-only" id={homeId}>{homeSentence}</span>

  {#if view.widget === "rail"}
    <div class="control">
      <div class="rail" class:track={view.skin === "track"}>
        {#if view.skin === "track"}
          <span class="track-line" aria-hidden="true"></span>
          <span
            class="track-fill"
            style:inline-size="{fillPercent}%"
            aria-hidden="true"
          ></span>
          <span
            class="thumb"
            style:inset-inline-start="calc({fillPercent}% - 6px)"
            aria-hidden="true"
          ></span>
          <span
            class="home home-track"
            style:inset-inline-start="calc({homePercent}% - 1px)"
            aria-hidden="true"
          ></span>
        {:else}
          {#each slots as at (at)}
            <span class="slot" aria-hidden="true">
              <span class="dot" class:selected={at === view.index}></span>
              {#if at === view.default}
                <span class="home home-dot"></span>
              {/if}
            </span>
          {/each}
        {/if}

        <input
          class="range"
          id={controlId}
          type="range"
          min="0"
          max={Math.max(0, count - 1)}
          step="1"
          value={view.index}
          aria-describedby={homeId}
          aria-valuetext={valueText}
          oninput={(event) => pick(event.currentTarget.valueAsNumber)}
          onkeydown={resetKeys}
        />
      </div>

      {#if view.readout}
        <span class="readout">{view.readout}</span>
      {/if}
    </div>
  {:else}
    <div
      class="control options"
      class:swatches={view.widget === "swatch"}
      role="radiogroup"
      aria-labelledby={labelId}
      aria-describedby={homeId}
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
            onkeydown={resetKeys}
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
          {#if at === view.default}
            <span class="home" class:home-swatch={view.widget === "swatch"}
            ></span>
          {/if}
        </label>
      {/each}
    </div>
  {/if}
</div>

<style>
  /*
    Row layout (05-UI-SPEC, Knob row layout): label left, control right, in a
    44px box. The 12px is the horizontal label gutter and it is only ever
    horizontal - no vertical gap in this region is 12px.

    touch-action: pan-y so a horizontal drag adjusts the knob and a vertical one
    scrolls the page - which, as a side effect, removes double-tap zoom from the
    row and makes the double-click reset safe on iOS.
  */
  .row {
    display: grid;
    grid-template-columns: minmax(88px, 34%) 1fr;
    column-gap: 12px;
    block-size: 44px;
    align-items: center;
    touch-action: pan-y;
  }

  /*
    Stacked: a 14px line box for the label (spacing exception 4), a 4px gap and
    the control full width in its 44px box. 14 + 4 + 44 = 62.
  */
  .row.stacked {
    display: block;
    block-size: 62px;
  }

  /*
    Under 220px of container the control column would be 92px against a 120px
    floor, so every row stacks. The container itself is established by
    KnobRack.svelte; the query resolves against the nearest ancestor container
    whichever stylesheet declares it, and it lives here because it is this
    component's own geometry that changes.
  */
  @container (width < 220px) {
    .row {
      display: block;
      block-size: 62px;
    }
  }

  /* Micro (title): 12px / 600 / 0.01em, sentence case. */
  .label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--color-ink);
    overflow-wrap: anywhere;
  }

  .row.stacked .label {
    line-height: 14px;
    margin-block-end: 4px;
  }

  .control {
    -webkit-touch-callout: none;
    user-select: none;
  }

  /* A rail's control column: the painted rail, then the optional integer. */
  .control:not(.options) {
    display: grid;
    grid-template-columns: 1fr auto;
    column-gap: 12px;
    align-items: center;
  }

  /*
    The rail is the positioning context for the invisible input, and it carries
    the focus ring on behalf of it.
  */
  .rail {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 4px;
    block-size: 44px;
  }

  .rail.track {
    display: block;
  }

  .rail:has(:focus-visible) {
    outline: 2px solid var(--color-accent);
    outline-offset: 4px;
    border-radius: inherit;
  }

  /*
    The real control. Invisible, but it is the thing that has the label, the
    value, the keyboard and the pointer - the painted dots below are decoration.
  */
  .range {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 44px;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }

  /* One 8px dot per option, at least 4px apart (05-UI-SPEC, Three widgets). */
  .slot {
    position: relative;
    display: grid;
    place-items: center;
    inline-size: 8px;
    block-size: 44px;
  }

  .dot {
    inline-size: 8px;
    block-size: 8px;
    border-radius: 50%;
    background: var(--color-line);
    transition: background-color 140ms ease-out;
  }

  .dot.selected {
    background: var(--color-accent);
    transition:
      background-color 140ms ease-out,
      transform 140ms ease-out;
  }

  /*
    FINDING, recorded in 05-08-SUMMARY.md: the spec's hover target for an
    unselected dot is "--color-accent at 40% opacity", which composites to
    rgb(214 255 78 / 0.4) - exactly --color-line, the rest state. The
    declaration is shipped as the contract words it rather than inventing a
    colour outside the two-colour ladder to make it visible.
  */
  .rail:hover .dot:not(.selected) {
    background: var(--color-accent);
    opacity: 0.4;
  }

  /* 1.25x on the selected dot or thumb while a pointer is down. */
  .rail:active .dot.selected,
  .rail:active .thumb {
    transform: scale(1.25);
  }

  /* n >= 9: a 4px track filled to the index, with a 12px thumb. */
  .track-line,
  .track-fill {
    position: absolute;
    inset-block-start: 20px;
    inset-inline-start: 0;
    block-size: 4px;
    border-radius: 2px;
  }

  .track-line {
    inline-size: 100%;
    background: var(--color-line-soft);
  }

  .track-fill {
    background: var(--color-accent);
    transition: inline-size 120ms ease-out;
  }

  .thumb {
    position: absolute;
    inset-block-start: 16px;
    inline-size: 12px;
    block-size: 12px;
    border-radius: 50%;
    background: var(--color-accent);
    transition: inset-inline-start 120ms ease-out;
  }

  /*
    Where home is: a 2px --color-line-soft dot, 4px below the option at the
    default index. Decorative at 1.58:1 because its meaning is carried by
    RESET ALL, a labelled control on the same screen.

    The offsets are all "4px below the painted thing", inside a 44px box whose
    centre is 22px:
      dot rail   8px dot  -> bottom 26 -> 30
      detent    12px thumb -> bottom 28 -> 32
      swatch    28px square -> bottom 36 -> 40
      word      14px line box -> bottom 29 -> 33
  */
  .home {
    position: absolute;
    inline-size: 2px;
    block-size: 2px;
    border-radius: 50%;
    background: var(--color-line-soft);
  }

  .home-dot {
    inset-block-start: 30px;
    inset-inline-start: 3px;
  }

  .home-track {
    inset-block-start: 32px;
  }

  /* Word rows and swatch rows wrap; the row height is auto with a 44px floor. */
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    min-block-size: 44px;
  }

  .option {
    position: relative;
    display: grid;
    place-items: center;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: color 140ms ease-out;
  }

  .options.swatches .option {
    padding-inline: 0;
  }

  /*
    The radio itself is visually hidden, so Phase 4's ring is drawn on the
    option - the same reason .rail carries the range input's. No control in
    this component is focusable without a visible ring.
  */
  .option:has(:focus-visible) {
    outline: 2px solid var(--color-accent);
    outline-offset: 4px;
    border-radius: 6px;
  }

  /* Micro (title). Selected in accent; everything else quiet. */
  .word {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--color-ink-quiet);
    transition: color 140ms ease-out;
  }

  .option:hover .word {
    color: var(--color-ink);
  }

  .option.selected .word {
    color: var(--color-accent);
  }

  .option:active {
    background: rgb(214 255 78 / 0.08);
  }

  /*
    The swatch exemption, at its minimum: the square is real firmware RGB
    because it is a 1:1 preview of the light the LEDs will emit. Everything
    around it - the hairline, the ring, the label - stays on the two-colour
    ladder, and no gradient, tint, glow or filter of any kind touches it.
  */
  .swatch {
    inline-size: 28px;
    block-size: 28px;
    border: 1px solid var(--color-line);
    border-radius: 2px;
    transition: border-color 140ms ease-out;
  }

  .option:hover .swatch {
    border-color: var(--color-accent);
  }

  .option.selected .swatch {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .option.selected:active .swatch {
    outline-width: 3px;
  }

  .home-swatch {
    inset-block-start: 40px;
    inset-inline-start: calc(50% - 1px);
  }

  .options:not(.swatches) .home {
    inset-block-start: 33px;
    inset-inline-start: calc(50% - 1px);
  }

  /* The one integer readout, tabular so it cannot jitter as it counts. */
  .readout {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 400;
    line-height: 14px;
    font-variant-numeric: tabular-nums;
    color: var(--color-ink);
    text-align: end;
  }

  /*
    Reduced motion: no scale on drag, no transition on hover - colour change
    only, which is Phase 4's "hover lifts -> colour change only".
  */
  @media (prefers-reduced-motion: reduce) {
    .dot,
    .dot.selected,
    .thumb,
    .track-fill,
    .word,
    .swatch,
    .option {
      transition: none;
    }

    .rail:active .dot.selected,
    .rail:active .thumb {
      transform: none;
    }
  }
</style>
