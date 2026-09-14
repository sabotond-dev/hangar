<!--
  The tuning region: the workspace's inspector - the knobs, the MIDI fields,
  the colour block, Randomize and its one-value Undo, and ONE aria-live region
  that never fires on a value change (device-ui.spec.ts:681 counts the word here).
  Reflow width and inset are layout.ts's and written in no component (tune-ui.spec.ts).
  THERE IS NO ADVANCED SECTION: section 7's boundary says "Use actual parameter names,
  limits, units, defaults, and dependencies from the configuration schema"; the
  entries declare none of the advanced properties, so no disclosure is drawn.
  UNDO RANDOMIZE IS ONE VALUE AND ONE CLICK, and IT IS EXPLICITLY NOT GENERAL UNDO:
  Not a history, not a stack, not a tree - the Sandbox's draft history is
  src/lib/sandbox/history.ts (13-16), a different thing with a different owner.
  Decided at 13-09 / 13-10 / 13-16; see .planning/phases/13-gui-overhaul/13-10-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy, onMount, untrack, type Snippet } from "svelte";
  import { SvelteSet } from "svelte/reactivity";
  import type { SimEngine } from "$lib/sim/engine";
  import {
    LINK_COPIED_ANNOUNCEMENT,
    SURPRISE_ALL_HELD,
    liveBackInside,
    liveRandomised,
    liveReset,
    liveResetOver,
    liveResetOverBoth,
    type EventWord,
  } from "$lib/tune/copy";
  import { onIdle } from "$lib/tune/idle";
  import {
    INSPECTOR_EYEBROW,
    INSPECTOR_HEADLINE,
    INSPECTOR_LEDE,
    MIDI_HELPER,
    RANDOMIZE,
    RANDOMIZE_GLYPH,
    RESET_SETTINGS,
    SECTION_APPEARANCE,
    SECTION_BEHAVIOR,
    SECTION_MIDI,
    UNDO_RANDOMIZE,
  } from "$lib/tune/inspector-copy";
  import { isMidiDestination } from "$lib/tune/surprise";
  import { knobPosition, type KnobView, type TuneView } from "$lib/tune/view";
  import BudgetMessage from "./BudgetMessage.svelte";
  import KnobRack from "./KnobRack.svelte";
  import MidiField from "./MidiField.svelte";
  import StampNotice from "./StampNotice.svelte";
  import Inspector from "./shell/Inspector.svelte";
  import { INSPECTOR_INSET, NUMERIC_GRID_REFLOW } from "./shell/layout";

  /**
   * $lib/share/stamp's `Landing["kind"]`, restated: that module reaches the
   * vendored compiler, and this file names the compiler only through
   * `await import()` (config-shape.spec.ts walks src/lib/ui/ for a static-import one).
   */
  type LandingKind = "none" | "restored" | "older" | "unreadable";

  /** $lib/tune/model's LadderView, narrowed to what the message renders. */
  type LadderMessage = { line: string };

  /** $lib/tune/model's OverBudgetView, narrowed to what this region uses. */
  type OverBudgetMessage = {
    line: string;
    backOff: string;
    /** The reason beside a disabled primary control. Reported upward, never rendered here. */
    reason: string;
    /** The one utterance for the crossing, with the knob named when one moved. */
    live: string;
    apply: () => void;
  };

  /** One index vector: what Undo randomize keeps, and all it keeps. */
  type IndexVector = Readonly<Record<string, number>>;

  /** $lib/tune/model's Tuner, narrowed to the calls this region makes. */
  type Tuner = {
    set(knobId: string, index: number): void;
    reset(knobId: string): void;
    resetAll(): void;
    surprise(held?: ReadonlySet<string>): Promise<IndexVector | undefined>;
    restore(indices: IndexVector): void;
    stamp(): string | undefined;
    destroy(): void;
  };

  let {
    entryId,
    name,
    knobs = {},
    reserved,
    landing = { kind: "none" },
    actions,
    onknobs,
    onpreview,
    onstamp,
    onbudget,
    onconfig,
    onresult,
  }: {
    /** The catalog id, not an entry object: /dev/tune/ mounts the region for a configuration with no workspace page. */
    entryId: string;
    /** The configuration's name, for the stamp notice; a prop because the catalog's knob tables sit behind the compiler. */
    name: string;
    /** Knob id to index. The owner keeps them, so re-opening restores them. */
    knobs?: Readonly<Record<string, number>>;
    /** Phase 7's install marker, and /dev/tune/'s way to reach over budget. */
    reserved?: { setup: number; timer: number };
    /** Where the URL landed, decided by the route before the panel opened. */
    landing?: { kind: LandingKind };
    /** The inspector's pinned pair (Save copy / Share snapshot), the route's controls; forwarded to Inspector as `actions`. */
    actions?: Snippet;
    /** Every knob position, on every change, so the owner can hold them. */
    onknobs?: (indices: Readonly<Record<string, number>>) => void;
    /** The new engine, for SimHost.replaceEngine. Never stored in a rune. */
    onpreview?: (engine: SimEngine) => void;
    /** The share payload, precomputed, so the share control never awaits anything. */
    onstamp?: (stamp: string | undefined) => void;
    /** The over-budget reason for the primary control, or undefined when in budget. */
    onbudget?: (reason: string | undefined) => void;
    /** The compiled pair, or undefined while measuring; the install store writes it verbatim, never a re-compile at click time. */
    onconfig?: (
      config:
        | {
            systemTimer: string;
            system: string;
            systemUtility: string;
            setup: string;
            timer: string;
          }
        | undefined,
    ) => void;
    /** The colour picker's result pad, for whoever owns the page's SimHost; without it there is no result pad at all. */
    onresult?: (id: string, canvas: HTMLCanvasElement) => void;
  } = $props();

  /** The live region's trailing window: a knob dragged across 908 and back says nothing (05-UI-SPEC). */
  const VOICE_DELAY_MS = 500;

  let view: TuneView | undefined = $state(undefined);
  let ladder: LadderMessage | undefined = $state(undefined);
  let over: OverBudgetMessage | undefined = $state(undefined);
  let rolling = $state(false);
  /** The vector the last roll replaced, or undefined before a roll, after an undo and after any hand move. ONE value, component state. */
  let undo: IndexVector | undefined = $state(undefined);
  /** The knobs the visitor has locked (T1). Component state, handed to surprise() per roll: no path from a lock to the stamp (surprise.spec.ts). */
  const heldKnobs = new SvelteSet<string>();
  /** untrack: the landing was decided by the route before the panel opened; a later change must not put the notice back after a knob has moved. */
  let landed = $state(untrack(() => landing.kind !== "none"));
  let announcement = $state("");
  /** D-21: the MIDI grid's column count, answered by the observer below. */
  let gridColumns = $state(1);

  // Plain locals outside the reactive graph: an engine, a timer handle or an observer never goes into a rune.
  let tuner: Tuner | undefined;
  let mounted = false;
  let voiceTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingCommand: "reset" | "surprise" | undefined;
  let stopIdle: (() => void) | undefined;
  /** The category the live region last spoke about, so a repeat says nothing. */
  let announcedOver = false;
  /** Which event was over when it did, so the way back can name the same one. */
  let announcedEvent: EventWord = "Setup";
  /** The grid's box, observed for D-21. */
  let gridBox: HTMLDivElement | undefined = $state(undefined);
  let gridObserver: ResizeObserver | undefined;

  // Both read the view through a PARAMETER: here TypeScript has seen `view` assigned only
  // undefined, and a parameter is not narrowed by the outer control flow.
  const knobsOf = (current: TuneView | undefined): readonly KnobView[] =>
    current?.knobs ?? [];
  const busyOf = (current: TuneView | undefined): boolean =>
    current === undefined ||
    waiting(current.setup.state) ||
    waiting(current.timer.state);

  const knobViews = $derived(knobsOf(view));
  const hasKnobs = $derived(knobViews.length > 0);
  /**
   * Section 7's three sections. The MIDI partition is surprise.ts's `isMidiDestination` -
   * ONE predicate over id and label, which also bounds the roll - so the section shows
   * exactly what Randomize preserves.
   */
  const colourKnobs = $derived(
    knobViews.filter((knob) => knob.widget === "colour"),
  );
  const midiKnobs = $derived(
    knobViews.filter(
      (knob) => knob.widget !== "colour" && isMidiDestination(knob),
    ),
  );
  const behaviorKnobs = $derived(
    knobViews.filter(
      (knob) => knob.widget !== "colour" && !isMidiDestination(knob),
    ),
  );
  /** The knobs a roll may move: section 7's scope, colour included. */
  const rollableKnobs = $derived(
    knobViews.filter((knob) => !isMidiDestination(knob)),
  );
  const atDefaults = $derived(
    knobViews.every((knob) => knob.index === knob.default),
  );
  /** Every ROLLABLE knob held: the one state Randomize cannot act in (a MIDI destination is out of the roll either way). */
  const allHeld = $derived(
    hasKnobs && rollableKnobs.every((knob) => heldKnobs.has(knob.id)),
  );
  /** data-busy on the root while either number is measuring: the e2e suite's settled() and recomputed() anchors, painted by nothing. */
  const busy = $derived(busyOf(view));
  /** The disabled control's reason, wired to it by aria-describedby. */
  const heldReasonId = "tuning-surprise-held";

  /**
   * What a colour may still spend (TUNE-05): the tighter free margin over the copy count.
   * `copies` is 1; ninepads emits its colour twice, so the guard is at most six characters
   * conservative there and the over-budget path catches the rest. Clamped at zero so an
   * already over-budget state does not shorten every rail to one detent.
   */
  const colourBudget = $derived.by(() => {
    const current = view;
    if (current === undefined) return undefined;
    return {
      free: Math.max(
        0,
        Math.min(
          current.setup.limit - current.setup.used,
          current.timer.limit - current.timer.used,
        ),
      ),
      copies: 1,
    };
  });

  function waiting(state: string): boolean {
    return state === "measuring" || state === "stale";
  }

  // ---------------------------------------------------------------------------
  // D-21: the grid's columns, from layout.ts's number and the grid's own box.

  /** Two columns when the inspector (the box plus INSPECTOR_INSET twice) is at least NUMERIC_GRID_REFLOW wide - both numbers layout.ts's. */
  function columnsFor(boxWidth: number): number {
    return boxWidth + INSPECTOR_INSET * 2 >= NUMERIC_GRID_REFLOW ? 2 : 1;
  }

  $effect(() => {
    const box = gridBox;
    gridObserver?.disconnect();
    gridObserver = undefined;
    if (box === undefined || typeof ResizeObserver === "undefined") return;
    gridColumns = columnsFor(box.getBoundingClientRect().width);
    gridObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        gridColumns = columnsFor(entry.contentRect.width);
      }
    });
    gridObserver.observe(box);
    return () => {
      gridObserver?.disconnect();
      gridObserver = undefined;
    };
  });

  // ---------------------------------------------------------------------------
  // The one voice.

  function clearVoice(): void {
    if (voiceTimer !== undefined) clearTimeout(voiceTimer);
    voiceTimer = undefined;
  }

  function scheduleVoice(): void {
    clearVoice();
    voiceTimer = setTimeout(() => {
      voiceTimer = undefined;
      flushVoice();
    }, VOICE_DELAY_MS);
  }

  /** The view, or undefined while a number is still arriving or catching up. */
  function settledView(): TuneView | undefined {
    const current = view;
    if (current === undefined) return undefined;
    return waiting(current.setup.state) || waiting(current.timer.state)
      ? undefined
      : current;
  }

  const eventOver = (current: TuneView | undefined): EventWord =>
    current?.setup.over ? "Setup" : "Timer";

  /** The command's sentence, with the crossing folded in when it landed over budget: at most one string per event. */
  function commandLine(
    command: "reset" | "surprise",
    current: TuneView,
    isOver: boolean,
  ): string {
    if (command === "surprise") {
      // The count is the roll's scope: a MIDI destination was never rolled.
      return liveRandomised(
        current.knobs.filter((knob) => !isMidiDestination(knob)).length,
        current.setup.used,
        current.timer.used,
      );
    }
    if (!isOver) return liveReset(current.setup.used, current.timer.used);
    const setupBy = current.setup.used - current.setup.limit;
    const timerBy = current.timer.used - current.timer.limit;
    if (current.setup.over && current.timer.over) {
      return liveResetOverBoth(setupBy, timerBy);
    }
    return current.setup.over
      ? liveResetOver("Setup", setupBy)
      : liveResetOver("Timer", timerBy);
  }

  function flushVoice(): void {
    const isOver = over !== undefined;
    if (pendingCommand !== undefined) {
      // The numbers have not landed; the next emit reschedules. No number, no sentence.
      const current = settledView();
      if (current === undefined) return;
      const command = pendingCommand;
      pendingCommand = undefined;
      announcedOver = isOver;
      if (isOver) announcedEvent = eventOver(current);
      announcement = commandLine(command, current, isOver);
      return;
    }
    if (isOver === announcedOver) return;
    announcedOver = isOver;
    if (isOver && over) {
      announcedEvent = eventOver(view);
      announcement = over.live;
      return;
    }
    announcement = liveBackInside(announcedEvent);
  }

  /** The share control's one announcement: it holds no live region, so its owner calls this through bind:this. */
  export function announceCopied(): void {
    clearVoice();
    announcement = LINK_COPIED_ANNOUNCEMENT;
  }

  // ---------------------------------------------------------------------------
  // The tuner.

  function receive(next: TuneView): void {
    view = next;
    const indices: Record<string, number> = {};
    // THROUGH knobPosition, never knob.index. See view.ts.
    for (const knob of next.knobs) indices[knob.id] = knobPosition(knob);
    onknobs?.(indices);
    onstamp?.(tuner?.stamp());
    if (pendingCommand !== undefined) scheduleVoice();
  }

  function receiveOver(next: OverBudgetMessage | undefined): void {
    over = next;
    onbudget?.(next?.reason);
    scheduleVoice();
  }

  /**
   * D-08's prefetch, the only place this file reaches the compile surface: a dynamic import,
   * not awaited before the first paint. Its failure lands no number, so the zone's Apply
   * stays disabled on the missing pair.
   */
  async function prefetchFormatter(): Promise<void> {
    try {
      const { padReady } = await import("$lib/pad");
      await padReady();
    } catch {
      // Never resolved: the absence of a number is the state.
    }
  }

  onMount(() => {
    mounted = true;
    stopIdle = onIdle(() => {
      void prefetchFormatter();
    });

    void (async () => {
      // DYNAMIC and never `from`: config-shape.spec.ts walks src/lib/ui/ for a static-import
      // specifier naming the compiler (a 131,101-byte chunk, kept off the first paint).
      const { buildTuner } = await import("$lib/tune/model");
      if (!mounted) return;
      const built = await buildTuner({
        entryId,
        indices: knobs,
        reserved,
        onview: receive,
        onpreview: (engine) => onpreview?.(engine),
        onladder: (next) => {
          ladder = next;
        },
        onover: receiveOver,
        onconfig,
      });
      if (!mounted) {
        built.destroy();
        return;
      }
      tuner = built;
      // The first emit ran inside buildTuner, before this assignment, so the
      // stamp it reported was undefined. A landed stamp is real from here.
      onstamp?.(built.stamp());
    })();
  });

  onDestroy(() => {
    // The house guard: onDestroy runs on the server immediately after
    // rendering, where there is no timer and no tuner (04-07-SUMMARY).
    if (!mounted) return;
    mounted = false;
    clearVoice();
    stopIdle?.();
    stopIdle = undefined;
    tuner?.destroy();
    tuner = undefined;
  });

  // ---------------------------------------------------------------------------
  // The controls.

  function changeKnob(id: string, index: number): void {
    landed = false;
    // A hand move after a roll: the vector would now restore more than the roll.
    undo = undefined;
    tuner?.set(id, index);
  }

  function resetKnob(id: string): void {
    landed = false;
    undo = undefined;
    tuner?.reset(id);
  }

  /** One lock, toggled: it moves no knob, so the stamp notice stays and the tuner is not touched. */
  function holdKnob(id: string): void {
    if (!heldKnobs.delete(id)) heldKnobs.add(id);
  }

  function resetAll(): void {
    if (tuner === undefined) return;
    landed = false;
    undo = undefined;
    pendingCommand = "reset";
    tuner.resetAll();
    scheduleVoice();
  }

  async function surprise(): Promise<void> {
    const current = tuner;
    if (current === undefined || rolling || allHeld) return;
    rolling = true;
    // A roll moves every knob in scope, so the notice goes as it does on a knob turn.
    landed = false;
    pendingCommand = "surprise";
    let previous: IndexVector | undefined;
    try {
      previous = await current.surprise(heldKnobs);
    } finally {
      if (mounted) rolling = false;
    }
    // The ONE stored vector: what this roll replaced. A second roll
    // replaces it - Undo takes you back one roll, never two.
    if (mounted && previous !== undefined) undo = previous;
    scheduleVoice();
  }

  /** Undo randomize: one value, one click, then nothing left to undo. */
  function undoRandomize(): void {
    const vector = undo;
    if (tuner === undefined || vector === undefined || rolling) return;
    undo = undefined;
    landed = false;
    tuner.restore(vector);
  }
</script>

<!-- Behavior: the schema's fields, then the PDF's two buttons. -->
{#snippet behavior()}
  {#if landed}
    <StampNotice kind={landing.kind} {name} />
  {/if}

  <KnobRack
    entry={{ id: entryId, name }}
    knobs={behaviorKnobs}
    held={heldKnobs}
    budget={colourBudget}
    empty={!hasKnobs}
    onchange={changeKnob}
    onreset={resetKnob}
    onhold={holdKnob}
  />

  {#if hasKnobs}
    <div class="actions">
      <button
        class="action"
        type="button"
        data-testid="surprise-me"
        disabled={rolling || allHeld}
        aria-busy={rolling}
        aria-describedby={allHeld ? heldReasonId : undefined}
        onclick={surprise}
      >
        <span class="glyph" aria-hidden="true">{RANDOMIZE_GLYPH}</span>
        {RANDOMIZE}
      </button>
      <button
        class="action"
        type="button"
        data-testid="reset-all"
        disabled={atDefaults}
        onclick={resetAll}
      >
        {RESET_SETTINGS}
      </button>
      <!-- Section 7's "Provide Undo randomize": disabled until a roll, and again once used or a knob moves by hand. -->
      <button
        class="action"
        type="button"
        data-testid="undo-randomize"
        disabled={undo === undefined || rolling}
        onclick={undoRandomize}
      >
        {UNDO_RANDOMIZE}
      </button>
    </div>
    <!-- DEGR-02's reason rule: this control is disabled by a state spread across every row's toggle. -->
    {#if allHeld}
      <p class="reason" id={heldReasonId} data-testid="surprise-held-reason">
        {SURPRISE_ALL_HELD}
      </p>
    {/if}
  {/if}
{/snippet}

<!-- Appearance: the colour knobs, through the one picker block. -->
{#snippet appearance()}
  <KnobRack
    entry={{ id: entryId, name }}
    knobs={colourKnobs}
    held={heldKnobs}
    budget={colourBudget}
    empty={false}
    {onresult}
    onchange={changeKnob}
    onreset={resetKnob}
    onhold={holdKnob}
  />
{/snippet}

<!-- MIDI output: page 5's 2 x 2 field grid (D-21), one typed field per MIDI knob (13.1-07, D-09), section 16's helper line. -->
{#snippet midi()}
  <div
    class="grid-box"
    bind:this={gridBox}
    data-testid="midi-grid"
    data-columns={gridColumns}
    style:--columns={gridColumns}
  >
    {#each midiKnobs as knob (knob.id)}
      <MidiField {knob} onchange={changeKnob} onreset={resetKnob} />
    {/each}
  </div>
  <p class="helper type-helper">{MIDI_HELPER}</p>
{/snippet}

{#snippet headline()}
  {INSPECTOR_HEADLINE[0]}<br />{INSPECTOR_HEADLINE[1]}
{/snippet}

<!--
  The two measured numbers and the busy state ride on the root as data
  attributes (13.1-07, D-10): read by the e2e suite, painted by nothing.
-->
<div
  class="region"
  data-testid="tuning-region"
  data-setup={view?.setup.used}
  data-timer={view?.timer.used}
  data-busy={busy}
>
  <Inspector
    eyebrow={INSPECTOR_EYEBROW}
    {headline}
    lede={INSPECTOR_LEDE}
    sections={[
      { title: SECTION_BEHAVIOR, content: behavior },
      ...(colourKnobs.length > 0
        ? [{ title: SECTION_APPEARANCE, content: appearance }]
        : []),
      ...(midiKnobs.length > 0 ? [{ title: SECTION_MIDI, content: midi }] : []),
    ]}
    {actions}
  >
    <!-- The fourth group is not painted, by the user's word (13.1-07, D-10): no caption, no meter, no forecast; TUNE-05's line alone. -->
    <BudgetMessage {ladder} {over} />

    <p
      class="sr-only"
      data-testid="tuning-live"
      aria-live="polite"
      aria-atomic="true"
    >
      {announcement}
    </p>
  </Inspector>
</div>

<style>
  /* No box of its own: the shell's inspector column sizes the Inspector (e2e/tuning-webkit.e2e.ts measures the test id for sideways overflow). */
  .region {
    display: contents;
  }

  /* Page 5's two outlined buttons, side by side; wrap, never scroll (D-11). */
  .actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 16px;
    margin-block-start: 16px;
  }

  /* Section 10.3's Secondary at 44px: a 1px outline, no fill; square (D-01). */
  .action {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    background: transparent;
    font-family: var(--font-sans);
    font-size: 15px;
    font-weight: 500;
    line-height: 1.2;
    color: var(--color-ink);
    cursor: pointer;
    transition: border-color 140ms ease-out;
  }

  .action:hover:not(:disabled) {
    border-color: var(--color-action);
  }

  .action:disabled {
    color: var(--color-ink-quiet);
    cursor: not-allowed;
  }

  .glyph {
    font-size: 13px;
  }

  /* The one reason line, body role, 8px under the actions row. */
  .reason {
    margin: 8px 0 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  /* The grid's box, observed for D-21: --columns is the region's answer, two at or above NUMERIC_GRID_REFLOW, one below; no number written here. */
  .grid-box {
    display: grid;
    grid-template-columns: repeat(var(--columns, 1), minmax(0, 1fr));
    column-gap: 22px;
    row-gap: 12px;
    inline-size: 100%;
  }

  .helper {
    margin: 12px 0 0;
    color: var(--color-ink-quiet);
  }

  @media (prefers-reduced-motion: reduce) {
    .action {
      transition: none;
    }
  }
</style>
