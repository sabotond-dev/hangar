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
  a 4px --color-divider track filled to the index in --color-action, a 12px
  accent thumb, one <input type="range"> at opacity 0 over the paint, filling the
  44px box, with a real <label for>. The knob selector is Phase 5's word row, its
  third use after SORT and SCREEN. No new widget, no new keyboard model and no
  new focus behaviour: arrow keys step one, Home and End jump to the ends,
  double-click resets, and every control keeps the ring Phase 4 drew.

  EVERY PLAYGROUND COLOUR KNOB IS ON THE LATTICE SINCE CHANGE 19. A hand-authored
  Lua card's knob carries its own four or five colours FIRST and the rest of the
  4,096 after them (catalog/lattice.ts), so its index is not its cell: the view's
  `cells` takes an index to the rails and `knobIndexAt` brings a cell back, and
  its own colours are drawn under the rails as the quick-pick row - the SHIPPED
  Knob.svelte swatch row, reused as a component rather than redrawn. A knob of a
  few literals (none today) would still get that row instead of the rails.
  `isColourLattice` is what asks: the picker asking what it is holding.

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

  --color-error-ink appears nowhere in this file. The ninth token is scoped to three
  uses and all three of them belong to a meter or a message; a knob is never red,
  and an unaffordable colour is absent rather than alarming.

  INSIDE A POPOVER SINCE 13-09 (Bible section 7, PDF page 5). Swatch.svelte
  draws the swatch rows and opens this block in a <dialog> on a row's Edit
  color, handing over `selectedId`; nothing in the lattice, the rails, the
  marks or the budget arithmetic moved with it, and 13-09-SUMMARY.md pastes
  the diffstat. The six non-circle radii this file carried went the same day
  (D-01); the tick, the thumb and the home mark are true circles on square
  boxes and keep border-radius: 50% (D-10, D-15).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import { MediaQuery } from "svelte/reactivity";
  import {
    COLOUR_CAPTION,
    COLOUR_CHEAP_STEPS,
    COLOUR_UNAFFORDABLE,
    COLOUR_WHICH,
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
    knobIndexAt,
    latticePositionOf,
    swatchValueText,
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
    onresult,
    selectedId,
  }: {
    /**
     * The knob to open on (13-09): the swatch row whose Edit color opened the
     * popover. Read once, at init - the popover mounts this picker once and
     * the selector inside it is the visitor's from then on.
     */
    selectedId?: string;
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
    /**
     * Hands the result pad's element to whoever owns the page's SimHost.
     *
     * The pad is rendered only when a driver has asked for it. An unregistered
     * canvas has no backing store and paints nothing, and an empty box inside
     * the picker would be worse than no box: the whole argument of the result
     * is that it shows the truth about a colour, and a blank one shows nothing
     * while claiming to.
     *
     * NOBODY SUPPLIES IT YET, and the reason is named rather than hidden: the
     * one thing on the page that owns a SimHost is Coverflow.svelte, which
     * this phase promises not to edit and whose own plan asserts that promise.
     * deferred-items.md item 5 carries the three lines that close it, and
     * colour-picker.spec.ts asserts this end of the chain so there is nothing
     * to re-derive when they land.
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
  let chosen = $state<string | undefined>(untrack(() => selectedId));

  const selected = $derived(
    knobs.find((knob) => knob.id === chosen) ?? knobs[0],
  );

  /** 14 entries render no selector, 14 render two options, 3 render three. */
  const manyKnobs = $derived(knobs.length > 1);

  /** The lattice, or a hand-authored palette. See the header. */
  const lattice = $derived(isColourLattice(selected.values));

  /** The knob's cell on the rails: its index on a preset, through `cells` on a Lua card (change 19). */
  const position = $derived(latticePositionOf(selected, selected.index));

  /** 0..15 per channel, red first. A LEVEL, never a knob position. */
  const levels = $derived(colourLevels(position));
  const homeLevels = $derived(
    colourLevels(latticePositionOf(selected, selected.default)),
  );

  const rails = $derived(
    COLOUR_CHANNELS.map((channel, axis) => ({
      channel,
      axis: axis as 0 | 1 | 2,
      detents: colourRail(axis as 0 | 1 | 2, position, budget),
    })),
  );

  /** The 908 guard's live answer: on today's shelf, always false. */
  const anyUnaffordable = $derived(
    rails.some((rail) => colourRailMax(rail.detents) < COLOUR_RAIL_STEPS - 1),
  );

  /** "102, 102, 102" - the three STORED INTEGERS, and never a hex: a card's own colour as written. */
  const valueText = $derived(
    swatchValueText(selected.values[selected.index]?.swatch) ??
      colourValueText(position),
  );
  /** The same three integers as +-separated columns, for the eye. */
  const valueColumns = $derived(valueText.split(", "));

  /**
   * The quick-pick row (change 19): a Lua card's own colours, the first `palette` rungs, as the
   * swatch row - selected only while the knob stands on one of them.
   */
  const quick = $derived<KnobView | undefined>(
    selected.palette === undefined
      ? undefined
      : {
          ...selected,
          widget: "swatch",
          values: selected.values.slice(0, selected.palette),
          index: selected.index < selected.palette ? selected.index : -1,
          cells: undefined,
          palette: undefined,
        },
  );

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
    const at = colourPosition(next);
    if (at !== position) onchange(selected.id, knobIndexAt(selected, at));
  }

  /** rgb(102 102 102) - a flat fill of a stored value, and A-09's one carve-out. */
  const detentFill = (d: ColourDetent) => `rgb(${d.rgb.join(" ")})`;

  /** A detent's fill: the rung standing in its cell as the knob writes it (a card's own colour), else the cell. */
  const fillOf = (d: ColourDetent) =>
    (selected.cells === undefined
      ? undefined
      : selected.values[knobIndexAt(selected, d.position)]?.swatch) ??
    detentFill(d);

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
          <label class="option pill" class:selected={knob.id === selected.id}>
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
                  style:background={d.affordable ? fillOf(d) : undefined}
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
        A knob of a few literals, shown as the shipped swatch row rather than as
        a fourth thing. `lock={false}`, `reset={false}`, `caption={false}`: the swatch row above carries all three.
      -->
      <div class="palette">
        <Knob
          view={{ ...selected, widget: "swatch" }}
          lock={false}
          reset={false}
          caption={false}
          held={isHeld}
          onchange={(index) => onchange(selected.id, index)}
          onreset={() => onreset(selected.id)}
        />
      </div>
    {/if}
  </div>

  {#if lattice && quick !== undefined}
    <!-- The card's own colours under the rails, one click each (change 19); the row above carries the reset and the lock. -->
    <div data-testid="colour-quick">
      <Knob
        view={quick}
        lock={false}
        reset={false}
        caption={false}
        held={isHeld}
        onchange={(index) => onchange(selected.id, index)}
        onreset={() => onreset(selected.id)}
      />
    </div>
  {/if}

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

    192 IS A FLOOR RATHER THAN A FIXED HEIGHT, and the difference is one entry
    class. On the fourteen entries with ONE colour knob the head really is a
    44px line at every width - see the 262px container query below, which is
    what keeps it one - and 192 is exact. On the SEVENTEEN with two or three,
    the head carries a word row whose options are 44px on both axes by
    contract, and three of those plus the 63px caption plus the 44px lock is
    263px of min-content against a rack that is 172px wide at a 320px
    viewport. MEASURED on `console` at 320px: the selector stacks its three
    options, the head becomes 140px and the picker 288px. With a fixed height
    that content paints over the next rack row; with a floor the block grows to
    hold it and the region's 196px reservation merely under-reserves by 96px,
    which is a first-paint shift rather than an overlap.
    Recorded as deferred-items.md item 7 for 10-13.1, which owns the pill's
    final inline padding (10-UI-SPEC 19.1b puts it at 24px) and therefore owns
    every number in that arithmetic.
  */
  .picker {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-block-size: 192px;
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

    10-13.1 MOVED THE SHAPE TO src/app.css's .pill AND WIDENED THE PADDING FROM
    12px TO 24px. This file authored the pill first, in 10-10, at Phase 5's 12px
    word-row padding - and 12px is not enough: at the 44px block floor the 999px
    radius resolves to a 22px cap at each end, so a label 12px from the edge sits
    ON the curve. 19.1b's 24px is what clears it, and it is one value in one
    file now rather than eleven copies in nine. The floor stays here because
    tune-ui.spec.ts reads it off this rule, per control.
  */
  .option {
    position: relative;
    display: grid;
    place-items: center;
    min-inline-size: 44px;
    min-block-size: 44px;
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
    border-color: var(--color-action);
    background: var(--color-action);
  }

  /* The radio is visually hidden, so Phase 4's ring is drawn on the option. */
  .option:has(:focus-visible) {
    outline: 2px solid var(--color-action);
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
    color: var(--color-workspace);
  }

  /*
    THE SIXTH --font-mono USE ON THE SITE, and the argument is W-03's own: it
    is a number that changes as a pointer moves and it must not jitter
    horizontally. tabular-nums is the other half. The fifth was the forecast
    delta and made exactly this case; a seventh needs the argument made out
    loud again.

    THE SEVENTH ARRIVED IN 10-13.1 AND ITS ARGUMENT IS NOT THIS ONE (A-44).
    CatalogCard.svelte's + separated metadata block qualifies on the OTHER half
    of W-03's rule - machine text whose columns must hold across thirty-six
    stacked cards - because it is static and never jitters, so this comment's
    case would not have carried it. The count is SEVEN and 5.2's "six, and the
    list is asserted" was written before 10-10 shipped; instrument.spec.ts
    scan 5 is what holds the list now.

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
    color: var(--color-ink-quiet);
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
    border: 1px solid var(--color-divider);
  }

  .rails,
  .palette {
    flex: 1 1 0;
    min-inline-size: 0;
  }

  /*
    THE 6px IS THE THUMB'S RADIUS AND IT IS LOAD-BEARING. MEASURED, not
    reasoned: without it `knob-rack` reported scrollWidth 251 against
    clientWidth 245 at the 393px phone viewport and 342 against 336 on
    chromium, red in e2e/tuning-webkit.e2e.ts:279's never-scrolls-sideways
    assertion - and D-11 forbids a horizontal overflow of either kind anywhere
    in the tuning region, so that is a prohibition breach rather than a
    cosmetic one. (The declarations are described rather than spelled here, the
    way KnobRack.svelte's header does it: tune-ui.spec.ts greps this file for
    them, and a paragraph naming them would defeat the grep.)

    The 12px thumb is centred on its value: `calc(100% - 6px)` puts its right
    edge 6px past the rail at level 15, and aurora SHIPS at 0,85,255, so the
    blue rail stands at 15 on arrival and the overflow is there before a
    visitor touches anything. Knob.svelte has the identical thumb rule and does
    not overflow because its `.row` grid puts a lock column to its right that
    absorbs the 6px; a rail here is the last thing in the block, so the block
    reserves the radius itself. Padding on `.rails` rather than on `.rail`
    because an absolutely positioned child resolves `inset-inline: 0` against
    its containing block's PADDING box - padding on the rail itself would move
    nothing at all.
  */
  .rails {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-inline: 6px;
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
    outline: 2px solid var(--color-action);
    outline-offset: 4px;
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
    background: var(--color-workspace);
  }

  .detent.selected {
    outline: 2px solid var(--color-action);
    outline-offset: 1px;
  }

  /*
    ABSENT AS A COLOUR, PRESENT AS A POSITION. The ground with a 1px hairline,
    and the rail's own max stops below it so the exclusion is real rather than
    decorative. inset box-shadow rather than a border, so an excluded detent is
    exactly as wide as an included one.
  */
  .detent.unaffordable {
    background: var(--color-workspace);
    box-shadow: inset 0 0 0 1px var(--color-divider);
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
    background: var(--color-boundary);
  }

  .track-line,
  .track-fill {
    position: absolute;
    inset-block-start: 30px;
    inset-inline-start: 0;
    block-size: 4px;
  }

  .track-line {
    inline-size: 100%;
    background: var(--color-divider);
  }

  .track-fill {
    background: var(--color-action);
    transition: inline-size 120ms ease-out;
  }

  .thumb {
    position: absolute;
    inset-block-start: 26px;
    inline-size: 12px;
    block-size: 12px;
    border-radius: 50%;
    background: var(--color-action);
    transition: inset-inline-start 120ms ease-out;
  }

  /*
    Where the card ships, and the lock's second channel: a 2px soft dot when
    the knob is free, a --color-boundary bar over the selected step when it is
    held. Knob.svelte's rule, verbatim, and no accent is spent on either.
  */
  .home {
    position: absolute;
    inset-block-start: 40px;
    inline-size: 2px;
    block-size: 2px;
    border-radius: 50%;
    background: var(--color-divider);
  }

  .home.bar {
    inline-size: 12px;
    border-radius: 0;
    background: var(--color-boundary);
  }

  /* Phase 4's hover lift becomes a colour change only. */
  @media (prefers-reduced-motion: reduce) {
    .option,
    .word,
    .track-fill,
    .thumb {
      transition: none;
    }
  }

  /*
    THE METADATA IS THE FIRST THING TO GO, AND 262 IS ARITHMETIC OVER FOUR
    MEASURED WIDTHS RATHER THAN A ROUND NUMBER.

      caption COLOUR                    63
      the metadata at its widest        89   (three 3ch columns and two joins)
      the lock                          44
      three 8px gaps                    24
      --------------------------------------
      furniture, before the knob's own name gets a pixel     220
      the name at Micro, on one line                        + 39
      --------------------------------------                 259
      three pixels so the boundary is not the exact fit      + 3
      --------------------------------------                 262

    Every one of those is a measured width, `Colour` at 39px included, and the
    3px is slack rather than arithmetic: a threshold sitting exactly on the fit
    would flip on a sub-pixel difference between two engines.

    Below it the name is what the flex line takes the metadata out of, and both
    phone widths were already past the point: at a 245px rack (a 393px
    viewport) `Colour` measured 25px wide and 36px TALL - broken across three
    lines inside a 44px row - and at a 172px rack (320px) it was 9px wide and
    108px tall, with the head's min-content at 229px against 172px of rack.
    That last one is a horizontal overflow of the rack itself, which the tuning
    region forbids outright, and it was red in
    e2e/tuning-webkit.e2e.ts:279's 320px pass. After this rule: 172 against
    172 and 245 against 245, the head back to 44px, the name back to 39px on
    one 18px line.

    IT IS THE LAST RULE IN THIS FILE ON PURPOSE. `.value` declares
    `display: flex` and this declares `display: none` at the same specificity,
    so the one that wins is the one that comes second. Written up beside
    `.head`, where it reads better, it was in the stylesheet and had no effect
    at all - observed, not feared.

    The metadata is the right thing to drop because it is the only member of
    the row that carries NO information of its own: it is aria-hidden, and the
    three integers it shows are the same three the rails already announce
    through aria-valuetext. The caption names the block, the knob's name says
    what the rails are editing, the lock is a control. 10-UI-SPEC 19.1c asks
    for monospace metadata in +-separated columns; it does not ask for it at a
    width where it costs the block its name.
  */
  @container (width < 262px) {
    .value {
      display: none;
    }
  }
</style>
