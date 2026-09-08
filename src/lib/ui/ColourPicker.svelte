<!--
  The colour picker: three sixteen-detent rails on the hardware's own 4,096-colour
  lattice, and a result that is a pad rather than a swatch.

  ONE PICKER PER PANEL, NOT ONE PER KNOB (10-UI-SPEC 11.2). Six entries in the
  catalog carry two or three colour knobs. Three rails each would put nine rails
  and three extra canvases on `console`, `strip` and `forge`, which breaks the
  six-canvas budget and TUNE-01's amended knob count in one stroke. So the rack
  renders this block once, a compact word row names which colour knob the rails
  are editing, and the result pad stays single because the pad IS the entry: a
  three-colour configuration has one appearance, not three.

  A-09, THE FENCE, AND THE WHOLE OF IT. Every filled pixel inside this component
  is a colour the ZONA will emit at that index, drawn as a flat fill of an exact
  stored RGB444 value. Every line, label, tick, number and caption around it is
  on the two-colour ladder. There is no third category, and six shapes are
  forbidden BY NAME because each of them authors colour in CSS and each of them
  implies a resolution the state does not have: a gradient of any kind, an input
  of the colour type, a filter of any kind, any colour function that is not the
  plain three-channel one, and any element named for a circular hue control or a
  two-axis colour field. colour-picker.spec.ts scans this file for all six and
  carves out the plain three-channel function to the detent fills alone.

  WHY THE RESULT IS A PAD. One layer emits at most 49.6% of what is asked for and
  there is no gamma correction anywhere in the WS2812 path, so a flat rectangle
  of the stored value is the LIE and a running 9x9 is the truth. It answers "what
  will this look like on my ZONA" instead of "what does this hex look like on my
  monitor". It is one more PadCanvas, gated by the same IntersectionObserver as
  every other pad on the page.

  NOTHING NEW IS INVENTED. The three rails are 05-UI-SPEC's detent-track skin -
  a 4px --color-line-soft track filled to the index in --color-accent, a 12px
  accent thumb, one <input type="range"> at opacity 0 over the paint, filling the
  44px box, with a real <label for>. The knob selector is Phase 5's word row, its
  third use after SORT and SCREEN. No new widget, no new keyboard model and no
  new focus behaviour: arrow keys step one, Home and End jump to the ends,
  double-click resets, and every control keeps the ring Phase 4 drew.

  THE ONE THING THE RAILS ARE NOT USED FOR. A hand-authored Lua entry's colour
  knob still offers the four or five literals its author wrote rather than the
  lattice, and three sixteen-detent rails cannot travel between `0,204,255` and
  `255,85,0` without passing through 4,094 colours that knob cannot name. So for
  those the picker shows the SHIPPED Knob.svelte swatch row, inside this same
  block, under this same caption and this same selector - reused as a component
  rather than redrawn. `isColourLattice` is what asks, and it is not X-05's `n`:
  widget selection was already made by kind alone in view.ts, and this is the
  picker asking what it is holding. Widening the Lua route onto the lattice
  regenerates every colour-bearing entry's frames and is deferred-items.md item 3.

  D-15 / D-16 / D-17, THE INSTRUMENT REGISTER. The selector's options are pill
  outlines - fully rounded, 1px, transparent fill - with a filled pill for the
  active state, and the composed value is monospace metadata in +-separated
  columns rather than prose. That is the SIXTH --font-mono use on the site, and
  it qualifies for exactly the reason W-03 introduced the stack: it is a number
  that changes as a pointer moves and it must not jitter horizontally, which is
  the same argument the forecast delta made for the fifth. tabular-nums is the
  other half of it. No token is added: nine tokens, three hexes, and the accent
  reserved list stays at eight - every accent declaration below is either the
  focus ring (entry 4) or the selected value of a knob (entry 8).

  --color-over appears nowhere in this file. The ninth token is scoped to three
  uses and all three of them belong to a meter or a message; a knob is never red,
  and an unaffordable colour is absent rather than alarming.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy } from "svelte";
  import { MediaQuery } from "svelte/reactivity";
  import {
    COLOUR_CAPTION,
    COLOUR_CHEAP_STEPS,
    COLOUR_UNAFFORDABLE,
    COLOUR_WHICH,
    KNOB_HELD,
    KNOB_HOLD,
    colourRailName,
  } from "$lib/tune/copy";
  import {
    COLOUR_CHANNELS,
    COLOUR_RAIL_STEPS,
    colourLevels,
    colourPosition,
    colourRail,
    colourRailMax,
    colourValueText,
    isColourLattice,
    type ColourBudget,
    type ColourDetent,
    type KnobView,
  } from "$lib/tune/view";
  import Knob from "./Knob.svelte";
  import PadCanvas from "./PadCanvas.svelte";

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
    /** The ids SURPRISE ME must not roll. The region owns the set. */
    held: ReadonlySet<string>;
    /**
     * What a colour may still spend, or undefined while nothing has measured.
     * Undefined means every detent is affordable, which is also the measured
     * truth on today's shelf.
     */
    budget?: ColourBudget;
    /** One colour knob moved to one KNOB POSITION, never a rail level. */
    onchange: (id: string, position: number) => void;
    /** One colour knob back to the colour its card ships with. */
    onreset: (id: string) => void;
    /** One lock, toggled, for the knob the rails are editing. */
    onhold: (id: string) => void;
    /**
     * A swatch was hovered or focused, by knob and KNOB POSITION.
     *
     * Forwarded to the shipped swatch row and NOT offered on a rail, which is
     * deferred-items.md item 4 and is answered there rather than here: a rail's
     * detents sit under an invisible range input by construction, so there is
     * no hover the platform delivers and no keyboard candidate at all, and a
     * pointer-only forecast is exactly what the contract's hidden expansion
     * exists to forbid.
     */
    onforecast?: (id: string, position: number | undefined) => void;
    /**
     * Hands the result pad's element to whoever owns the page's SimHost.
     *
     * The pad is rendered only when a driver has asked for it. An unregistered
     * canvas has no backing store and paints nothing, and an empty box inside
     * the picker would be worse than no box: the whole argument of the result
     * is that it shows the truth about a colour, and a blank one shows nothing
     * while claiming to.
     */
    onresult?: (id: string, canvas: HTMLCanvasElement) => void;
  } = $props();

  /**
   * Which colour knob the rails are editing.
   *
   * The id rather than the index, so a rack that re-emits its views (every
   * knob turn does) does not move the selection, and a knob that disappears
   * falls back to the first rather than to nothing.
   */
  let chosen = $state<string | undefined>(undefined);

  const selected = $derived(
    knobs.find((knob) => knob.id === chosen) ?? knobs[0],
  );

  /** 14 entries render no selector, 14 render two options, 3 render three. */
  const manyKnobs = $derived(knobs.length > 1);

  /** The lattice, or a hand-authored palette. See the header. */
  const lattice = $derived(isColourLattice(selected.values));

  /** 0..15 per channel, red first. A LEVEL, never a knob position. */
  const levels = $derived(colourLevels(selected.index));
  const homeLevels = $derived(colourLevels(selected.default));

  const rails = $derived(
    COLOUR_CHANNELS.map((channel, axis) => ({
      channel,
      axis: axis as 0 | 1 | 2,
      detents: colourRail(axis as 0 | 1 | 2, selected.index, budget),
    })),
  );

  /** The 908 guard's live answer: on today's shelf, always false. */
  const anyUnaffordable = $derived(
    rails.some((rail) => colourRailMax(rail.detents) < COLOUR_RAIL_STEPS - 1),
  );

  /** "102, 102, 102" - the three STORED INTEGERS, and never a hex. */
  const valueText = $derived(colourValueText(selected.index));
  /** The same three integers as +-separated columns, for the eye. */
  const valueColumns = $derived(colourValueText(selected.index).split(", "));

  const captionId = "colour-caption";
  const cheapId = "colour-cheap-steps";
  const unaffordableId = "colour-unaffordable";
  const railId = (channel: string) => `colour-rail-${channel}-control`;

  /** The result pad's own registration id, distinct from the hero's. */
  const resultId = $derived(`${entry.id}-colour-result`);

  const isHeld = $derived(held.has(selected.id));

  /**
   * A rail level becomes a KNOB POSITION here and nowhere else.
   *
   * A detent is 0..15 and the knob stands at 0..4095. Reporting the first as
   * the second is the class of bug `knobPosition` was named for, and it was
   * MEASURED once already: a window slot reported as a knob index read aurora's
   * colour back as 0 instead of 95 and disabled KEEP ON DEVICE with
   * `knobs-moved`. One named translation, used by one handler.
   */
  function moveRail(axis: 0 | 1 | 2, level: number) {
    const next: [number, number, number] = [levels[0], levels[1], levels[2]];
    next[axis] = level;
    const position = colourPosition(next);
    if (position !== selected.index) onchange(selected.id, position);
  }

  /** rgb(102 102 102) - a flat fill of a stored value, and A-09's one carve-out. */
  const detentFill = (d: ColourDetent) => `rgb(${d.rgb.join(" ")})`;

  /** Percent along a rail. 15 steps between sixteen detents. */
  const percentOf = (level: number) => (level / (COLOUR_RAIL_STEPS - 1)) * 100;

  /**
   * Delete and Backspace reset the whole colour, exactly as they reset any
   * other knob. Escape is deliberately untouched - Phase 4 binds it to
   * un-choosing the panel - and no other key is intercepted, so every native
   * binding a range input carries survives.
   */
  function resetKeys(event: KeyboardEvent) {
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onreset(selected.id);
    }
  }

  /** 500 ms on a coarse pointer, the same long press every knob row carries. */
  const LONG_PRESS_MS = 500;
  const coarse = new MediaQuery("(pointer: coarse)");
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
      onreset(selected.id);
    }, LONG_PRESS_MS);
  }

  onDestroy(cancelPress);
</script>

<section class="picker" data-testid="colour-picker">
  <div class="head">
    <span class="caption" id={captionId}>{COLOUR_CAPTION}</span>

    {#if manyKnobs}
      <div
        class="which"
        data-testid="colour-knob-select"
        role="radiogroup"
        aria-label={COLOUR_WHICH}
      >
        {#each knobs as knob (knob.id)}
          <label class="option" class:selected={knob.id === selected.id}>
            <input
              class="sr-only"
              type="radio"
              name="colour-knob-{entry.id}"
              value={knob.id}
              checked={knob.id === selected.id}
              onchange={() => (chosen = knob.id)}
            />
            <span class="word">{knob.label}</span>
          </label>
        {/each}
      </div>
    {:else}
      <span class="knob-label">{selected.label}</span>
    {/if}

    {#if lattice}
      <!--
        +-separated columns rather than prose (D-15 reference A). The same
        three integers the rails announce, so the eye and the screen reader
        are told the same thing in the same base.
      -->
      <span class="value" aria-hidden="true">
        {#each valueColumns as column, at (at)}
          {#if at > 0}<span class="join">+</span>{/if}<span class="column"
            >{column}</span
          >
        {/each}
      </span>
    {/if}

    <button
      class="lock"
      type="button"
      data-testid="colour-hold"
      aria-pressed={isHeld}
      onclick={() => onhold(selected.id)}
    >
      {isHeld ? KNOB_HELD : KNOB_HOLD}
    </button>
  </div>

  <div class="body">
    {#if onresult}
      <div class="result" data-testid="colour-result">
        <PadCanvas
          entry={{ id: resultId, name: entry.name }}
          onready={onresult}
        />
      </div>
    {/if}

    {#if lattice}
      <!--
        The rails carry the reset gestures as an area gesture, the same way a
        knob row does, and the keyboard equivalent is on the controls
        themselves - so nothing here is pointer-only and this container needs
        no role and no tabindex. Giving it either would put a meaningless node
        in front of three real labelled controls.

        The explanation is a separate comment on purpose: everything after the
        rule name inside a svelte-ignore comment is parsed as further rule
        names.
      -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="rails"
        ondblclick={() => onreset(selected.id)}
        onpointerdown={beginPress}
        onpointerup={cancelPress}
        onpointercancel={cancelPress}
        onpointerleave={cancelPress}
      >
        {#each rails as rail (rail.channel)}
          {@const top = colourRailMax(rail.detents)}
          <div class="rail" data-testid="colour-rail-{rail.channel}">
            <label class="sr-only" for={railId(rail.channel)}>
              {colourRailName(
                rail.channel,
                manyKnobs ? selected.label : undefined,
              )}
            </label>

            <span class="detents" aria-hidden="true">
              {#each rail.detents as d (d.level)}
                <span
                  class="detent"
                  class:selected={d.level === levels[rail.axis]}
                  class:unaffordable={!d.affordable}
                  style:background={d.affordable ? detentFill(d) : undefined}
                ></span>
              {/each}
            </span>

            <span class="ticks" aria-hidden="true">
              {#each rail.detents as d (d.level)}
                <span class="slot">
                  {#if d.cheap}<span class="tick"></span>{/if}
                </span>
              {/each}
            </span>

            <span class="track-line" aria-hidden="true"></span>
            <span
              class="track-fill"
              style:inline-size="{percentOf(levels[rail.axis])}%"
              aria-hidden="true"
            ></span>
            <span
              class="thumb"
              style:inset-inline-start="calc({percentOf(levels[rail.axis])}% -
              6px)"
              aria-hidden="true"
            ></span>
            <span
              class="home"
              class:bar={isHeld}
              style:inset-inline-start="calc({percentOf(
                isHeld ? levels[rail.axis] : homeLevels[rail.axis],
              )}% - {isHeld ? 6 : 1}px)"
              aria-hidden="true"
            ></span>

            <input
              class="range"
              id={railId(rail.channel)}
              type="range"
              min="0"
              max={top}
              step="1"
              value={levels[rail.axis]}
              aria-valuetext={valueText}
              aria-describedby="{cheapId}{anyUnaffordable
                ? ` ${unaffordableId}`
                : ''}"
              oninput={(event) =>
                moveRail(rail.axis, event.currentTarget.valueAsNumber)}
              onkeydown={resetKeys}
            />
          </div>
        {/each}
      </div>
    {:else}
      <!--
        A hand-authored palette, shown as the shipped swatch row rather than as
        a fourth thing. `lock={false}` because this block already carries one
        for the selected knob and two locks on one knob is not a layout choice.
      -->
      <div class="palette">
        <Knob
          view={{ ...selected, widget: "swatch" }}
          lock={false}
          held={isHeld}
          onchange={(index) => onchange(selected.id, index)}
          onreset={() => onreset(selected.id)}
          onhold={() => onhold(selected.id)}
          onforecast={(position) => onforecast?.(selected.id, position)}
        />
      </div>
    {/if}
  </div>

  <!--
    The two hidden expansions. The ticks' sentence is always present because
    the marks always are; the exclusion's is present only when something really
    is excluded, so a screen reader is never told about a rail that is whole.

    NO ADJACENT REASON LINE, which is X-17's precedent and 05.1's disabled
    chip: the meter two centimetres away is the cause, and a visible sentence
    here would be a third place saying the same 908.
  -->
  <span class="sr-only" id={cheapId}>{COLOUR_CHEAP_STEPS}</span>
  {#if anyUnaffordable}
    <span class="sr-only" id={unaffordableId}>{COLOUR_UNAFFORDABLE}</span>
  {/if}
</section>

<style>
  /*
    THE BLOCK'S HEIGHT IS FIXED AND WIDTH-INDEPENDENT, and that is a contract
    rather than a preference. TuningRegion.svelte reserves the tuning region's
    height from the rack's contents before a knob has been turned, and a picker
    that reflowed at a narrow width would falsify that reservation at exactly
    the widths DEGR-01 exists for.

      head            44
      gap              8
      body           140   = three 44px rails and two 4px gaps
      ----------------------
                     192

    Nothing here wraps and nothing here scrolls: the rails shrink, and a rail
    is one control whose sixteen detents are paint, so there is no minimum
    width below which it stops working.
  */
  .picker {
    display: flex;
    flex-direction: column;
    gap: 8px;
    block-size: 192px;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    min-block-size: 44px;
  }

  /* Micro: 12px / 600 / 1.2 / 0.18em, uppercase, quiet. The rack's own. */
  .caption {
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
  }

  /* Micro (title): the knob's own label, when there is only one to name. */
  .knob-label {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--color-ink);
    overflow-wrap: anywhere;
  }

  /* Phase 5's word row: wraps, never scrolls, 4px gaps, a 44px floor. */
  .which {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    min-block-size: 44px;
    min-inline-size: 0;
  }

  /*
    D-15 REFERENCE C: A PILL OUTLINE, FULLY ROUNDED, 1px, TRANSPARENT FILL,
    WITH A FILLED PILL FOR THE ACTIVE STATE. The markup and the behaviour are
    Phase 5's word row exactly - a radiogroup of real radios inside labels, one
    tab stop, arrow keys that move and select - and only the paint moves, which
    is what D-17 asked for: the instrument register lands inside the waves
    still ahead rather than being retrofitted afterwards.

    BOTH 44px AXES. A three-character knob label at 12px is about 30px wide, so
    the inline floor is load-bearing here rather than free.
  */
  .option {
    position: relative;
    display: grid;
    place-items: center;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 12px;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    background: transparent;
    cursor: pointer;
    transition:
      background-color 140ms ease-out,
      border-color 140ms ease-out;
  }

  .option:hover {
    border-color: var(--color-ink-quiet);
  }

  /*
    The filled pill. Reserved-list entry 8 - the selected value of a knob - and
    a selector of knobs is knob vocabulary, so no ninth entry is spent. The
    label goes to the ground token rather than to a hex, because the fill is
    the accent and the text on it has to be the one colour that is not.
  */
  .option.selected {
    border-color: var(--color-accent);
    background: var(--color-accent);
  }

  /* The radio is visually hidden, so Phase 4's ring is drawn on the option. */
  .option:has(:focus-visible) {
    outline: 2px solid var(--color-accent);
    outline-offset: 4px;
  }

  /* Micro (title), sentence case: the knob's own label, verbatim. */
  .word {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    line-height: 1.2;
    color: var(--color-ink-quiet);
    transition: color 140ms ease-out;
  }

  .option:hover .word {
    color: var(--color-ink);
  }

  .option.selected .word,
  .option.selected:hover .word {
    color: var(--color-ground);
  }

  /*
    THE SIXTH --font-mono USE ON THE SITE, and the argument is W-03's own: it
    is a number that changes as a pointer moves and it must not jitter
    horizontally. tabular-nums is the other half. The fifth was the forecast
    delta and made exactly this case; a seventh needs the argument made out
    loud again.

    +-separated columns rather than prose (D-15 reference A). It is
    aria-hidden because the rails already announce the identical three integers
    through aria-valuetext, and a second reading would be the same fact twice.
  */
  .value {
    margin-inline-start: auto;
    display: flex;
    align-items: baseline;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 400;
    line-height: 14px;
    font-variant-numeric: tabular-nums;
    color: var(--color-ink);
  }

  .column {
    min-inline-size: 3ch;
    text-align: end;
  }

  .join {
    color: var(--color-ink-dim);
  }

  /*
    The lock, for the knob the rails are editing. Knob.svelte's own rule,
    unchanged: Micro, quiet when free and full ink when held, 44px on both axes
    because a four-character word at 12px is nowhere near 44px wide.
  */
  .lock {
    appearance: none;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
    cursor: pointer;
    transition: color 140ms ease-out;
  }

  .lock[aria-pressed="true"],
  .lock:hover {
    color: var(--color-ink);
  }

  .body {
    display: flex;
    align-items: center;
    gap: 12px;
    block-size: 140px;
  }

  /*
    The result: 88px of the 9x9, sized in multiples of nine so the pixelated
    upscale lands on whole cells. It never shrinks - a pad that is not square
    is not a pad - and the rails take whatever is left.
  */
  .result {
    flex: 0 0 auto;
    inline-size: 88px;
    block-size: 88px;
    border: 1px solid var(--color-line-soft);
    border-radius: 2px;
  }

  .rails,
  .palette {
    flex: 1 1 0;
    min-inline-size: 0;
  }

  .rails {
    display: flex;
    flex-direction: column;
    gap: 4px;
    touch-action: pan-y;
    -webkit-touch-callout: none;
    user-select: none;
  }

  /*
    One rail, in a 44px box, and every offset below is measured from its top:

       4..20   the sixteen detents
      24..26   the cheap-step ticks, 4px beneath the detents
      26..38   the 12px thumb
      30..34   the 4px track
      40..42   the default marker, 4px beneath the thumb

    It is the positioning context for the invisible input and it carries the
    focus ring on behalf of it, exactly as Knob.svelte's .rail does.
  */
  .rail {
    position: relative;
    block-size: 44px;
  }

  .rail:has(:focus-visible) {
    outline: 2px solid var(--color-accent);
    outline-offset: 4px;
    border-radius: 2px;
  }

  /* The real control. Invisible; everything painted below is decoration. */
  .range {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 44px;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }

  .detents,
  .ticks {
    position: absolute;
    inset-inline: 0;
    display: flex;
    gap: 2px;
  }

  .detents {
    inset-block-start: 4px;
    block-size: 16px;
  }

  /*
    SIXTEEN DISCRETE, STORABLE, REACHABLE COLOURS, each a flat fill of the
    exact value that index would produce given where the other two rails
    stand - which is why a rail repaints when either of the others moves. It
    is not a gradient and it must never become one: a gradient would offer
    steps the state cannot hold.
  */
  .detent {
    flex: 1 1 0;
    min-inline-size: 0;
    block-size: 16px;
    border-radius: 2px;
    background: var(--color-ground);
  }

  .detent.selected {
    outline: 2px solid var(--color-accent);
    outline-offset: 1px;
  }

  /*
    ABSENT AS A COLOUR, PRESENT AS A POSITION. The ground with a 1px hairline,
    and the rail's own max stops below it so the exclusion is real rather than
    decorative. inset box-shadow rather than a border, so an excluded detent is
    exactly as wide as an included one.
  */
  .detent.unaffordable {
    background: var(--color-ground);
    box-shadow: inset 0 0 0 1px var(--color-line-soft);
  }

  .ticks {
    inset-block-start: 24px;
    block-size: 2px;
  }

  .slot {
    flex: 1 1 0;
    min-inline-size: 0;
    display: grid;
    place-items: center;
    block-size: 2px;
  }

  /*
    THE SAME SHAPE AS THE DEFAULT MARKER, one rung up the ink ladder - a 2px
    round mark, which is a mark a visitor has already learnt from every knob
    row on the panel. It marks the steps whose literal is one or two digits,
    plus 255, and that rule is derived from the literal rather than listed.
  */
  .tick {
    inline-size: 2px;
    block-size: 2px;
    border-radius: 50%;
    background: var(--color-line);
  }

  .track-line,
  .track-fill {
    position: absolute;
    inset-block-start: 30px;
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
    inset-block-start: 26px;
    inline-size: 12px;
    block-size: 12px;
    border-radius: 50%;
    background: var(--color-accent);
    transition: inset-inline-start 120ms ease-out;
  }

  /*
    Where the card ships, and the lock's second channel: a 2px soft dot when
    the knob is free, a --color-line bar over the selected step when it is
    held. Knob.svelte's rule, verbatim, and no accent is spent on either.
  */
  .home {
    position: absolute;
    inset-block-start: 40px;
    inline-size: 2px;
    block-size: 2px;
    border-radius: 50%;
    background: var(--color-line-soft);
  }

  .home.bar {
    inline-size: 12px;
    border-radius: 1px;
    background: var(--color-line);
  }

  /* Phase 4's hover lift becomes a colour change only. */
  @media (prefers-reduced-motion: reduce) {
    .option,
    .word,
    .lock,
    .track-fill,
    .thumb {
      transition: none;
    }
  }
</style>
