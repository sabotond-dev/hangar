<!--
  The inspector: PDF page 5's right column, rendered from the schema that
  already exists (plan 13-09, Bible section 7, 13-CONTEXT.md D-14 Q5, Q11c,
  D-21).

  Section 7 asks production for "a validated schema driving the controls".
  HANGAR has one: src/lib/tune/view.ts's twelve knob kinds, checked exhaustive
  against the vendored compiler's own union, and a TOTAL widget rule. Every
  field this panel renders comes through `widgetFor` on a KnobView the tuner
  published; nothing here is a hand-written form per entry, and no entry
  declares a field the schema does not carry.

  THREE SECTIONS, PARTITIONED FROM THE SCHEMA, AND A FOURTH THAT IS HANGAR'S.
  Behavior is every knob that is neither a colour nor a MIDI destination, and
  it carries the PDF's two buttons, Randomize and Reset settings. Appearance is
  the colour knobs, through the one picker block. MIDI output is the knobs
  that address the wire - ids `cc`, `ccBase`, `channel` and `send` - in PDF
  page 5's 2 x 2 field grid with section 16's helper line beneath. A section
  with no knob in it is OMITTED, not rendered empty: an empty disclosure is
  the thing the next paragraph exists to forbid. The fourth group is the two
  budget meters under Phase 4's TUNING caption - the spec has no budget meter
  anywhere and HANGAR's honesty is not for cutting (13-RESEARCH Q8). They
  render after the last section, so under MIDI output on an entry that has
  one: two `{used} / 908` rows with a percentage in tabular numerals, the
  ladder's line and the over-budget block beneath them, the over state on
  13-03's error tokens (13-10). TUNE-05 survives the re-home clause by
  clause: over budget disables the primary control through `onbudget`, turns
  the offending meter red, names the knob that pushed it over, offers a
  one-click back-off, and the click never reaches the wire to fail there.

  THERE IS NO ADVANCED SECTION, AND THAT IS A DECISION RATHER THAN AN EMPTY
  DISCLOSURE. Section 7 proposes Curve, Smoothing, Phase, Clock sync, Voicing,
  Inversion, Velocity response and External trigger under "Advanced
  properties, only if supported". HANGAR's entries declare none of them, and
  section 7's own boundary says: "Use actual parameter names, limits, units,
  defaults, and dependencies from the configuration schema. Do not expose
  numerical concepts such as 'Arms' without a clear meaning." Inventing a tier
  would mean new tokens in the Lua on entries already at 857-875 of 908 at the
  picker corner. Do not add a disclosure with nothing behind it.

  RANDOMIZE HAS A SCOPE, AND THE SCOPE IS THE MIDI SECTION'S OWN PARTITION
  (13-10, section 7: "Preserve MIDI destination, channel, routing, and
  device target"). $lib/tune/surprise's `isMidiDestination` is ONE predicate
  over the descriptor's id and label, and it does two jobs here: it decides
  which knobs render under MIDI output, and - inside surpriseIndices - which
  knobs a roll never touches. One rule, so what the section shows is exactly
  what the button preserves. Randomize is disabled when every ROLLABLE knob
  is held, not every knob: a MIDI destination is out of the roll on every
  click, held or not.

  UNDO RANDOMIZE IS ONE VALUE AND ONE CLICK. `tuner.surprise()` resolves to
  a copy of the index vector the roll replaced; this component keeps EXACTLY
  ONE of them (`undo`) and `Undo randomize` hands it back through
  `tuner.restore()`. Not a history, not a stack, not a tree: a second click
  finds `undo` cleared and the button disabled, and a knob turned by hand
  after a roll clears it too, because the vector would then restore more
  than the roll. IT IS EXPLICITLY NOT GENERAL UNDO. Section 17's Sandbox
  undo/redo is a different thing with a different owner - plan 13-16, the
  Sandbox's own draft history, src/lib/sandbox/history.ts, whose header
  points back here - and conflating the two is how a one-value control
  becomes a subsystem.

  THE HEADLINE IS ONE CONSTANT (inspector-copy.ts). Page 5 draws "Shape the /
  movement." above ARC; twenty-seven entries have no headline of their own and
  this plan does not invent twenty-seven (D-01). Per-entry headlines are a
  question for 13-18. The lede is the PDF's sentence; the entry's `quiet` line
  belongs to the centre, under the surface (D-14 Q11c).

  D-21, THE REFLOW. The 2 x 2 grid needs 454 of inspector and the wide band's
  floor is 380 (13-05's finding). The user chose "reflow": the floor stays,
  and the grid is two columns when the inspector is at least layout.ts's
  NUMERIC_GRID_REFLOW wide and one column below. The number is read from
  layout.ts and never written here; a ResizeObserver on the grid's own box
  answers it, because a container query cannot read a custom property and the
  decision says the number lives in one place. Nothing else in the inspector
  changes shape at that width.

  Two rules in this file are structural guards rather than preferences.

  RULE 1 - THE COMPILER ARRIVES THROUGH `await import("$lib/tune/model")` AND
  NEVER STATICALLY. src/lib/tune/model.ts imports the vendored compiler, which
  imports @intechstudio/grid-protocol at module scope, which is a 131,101-byte
  chunk. A static import here would put all of it on the critical path of a page
  whose whole job is to paint in under two seconds.
  src/lib/config-shape.spec.ts test 13 walks every non-spec file under
  src/lib/ui/ and fails on a `from` specifier naming the vendored tree, the
  protocol package or the compile surface; test 14 asserts the built
  build/index.html and build/playground/aurora/index.html reference no chunk carrying the
  package. The workspace route reaches the simulator the same way, in its own
  onMount. The types the region holds are therefore declared STRUCTURALLY
  below - the src/lib/sim/host.ts HostEngine pattern - and the real ones are
  checked against them where buildTuner's result is assigned. The boundary is
  proved by the build's chunk list, not by a gate: 13-09-SUMMARY.md says so.

  Everything else this file names is compiler-free by construction:
  $lib/tune/view, $lib/tune/copy, $lib/tune/inspector-copy and $lib/tune/idle
  import nothing at all, $lib/tune/surprise imports one type, $lib/ui/shell/
  layout imports nothing, and $lib/sim/engine is a type-only import that is
  erased before a byte is emitted.

  RULE 2 - THE PANEL SCROLLS ITS OWN BODY AND THE PRIMARY ACTION IS NOT IN IT.
  Inspector.svelte's body is the one scroll container; the head and the
  pinned pair stay put; Apply to ZONA lives in the context bar (13-11). So
  the height reservation this file carried from 05-10 to 13-08 - the two
  constants, the measured 257px wrap, the 196p picker term - has no subject
  and is gone. Nothing above the rack can move when the rack grows.

  ONE LIVE REGION, AND IT CANNOT CHATTER. There is exactly one visually-hidden
  aria-live="polite" aria-atomic="true" element for the whole inspector, and
  it NEVER fires on a value change. It fires on a category transition (in budget
  to over budget and back), on the two explicit commands, and on a successful
  copy - which arrives through the exported announceCopied(), because the share
  control holds no live region of its own.

  Everything it says goes through ONE trailing timer, and that is what makes
  "a command and a category transition are one utterance, never two" true by
  construction rather than by remembering: Reset settings can land on defaults
  that are already over budget, and $lib/tune/copy carries combined strings for
  exactly that case. The 500ms delay is the UI spec's coalescing window - a knob
  dragged across 908 and back says nothing at all - and it doubles as the wait
  for the command's own numbers, which arrive with the debounced measurement.

  The timer is a setTimeout ON THE STATE, never a timer on the render, and
  there is no setInterval anywhere in this file - Phase 4 forbids that form
  outright, and the shared animation-frame loop is SimHost's business and not
  this component's. Naming the prohibition here is what makes a raw grep for it
  useless and the comment-stripped scan the only honest gate.

  THE FORMATTER IS PREFETCHED WHEN THE BROWSER IS IDLE, and shortly instead on
  Safari, which has no idea what idle means - that is the whole of $lib/tune/idle
  (D-08). Nothing here awaits it before the first paint: the meters say
  `measuring…` until a number lands, and the preview is already running. When it
  never resolves at all - blocked, 404, offline - the meters block is replaced
  by one Body line and NOTHING else is disabled.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy, onMount, untrack, type Snippet } from "svelte";
  import { SvelteSet } from "svelte/reactivity";
  import type { SimEngine } from "$lib/sim/engine";
  import {
    LINK_COPIED_ANNOUNCEMENT,
    METERS_UNAVAILABLE,
    SURPRISE_ALL_HELD,
    TUNING_CAPTION,
    liveBackInside,
    liveRandomised,
    liveReset,
    liveResetOver,
    liveResetOverBoth,
    forecastDelta,
    forecastExpansion,
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
  import BudgetMeter from "./BudgetMeter.svelte";
  import KnobRack from "./KnobRack.svelte";
  import StampNotice from "./StampNotice.svelte";
  import Inspector from "./shell/Inspector.svelte";
  import { INSPECTOR_INSET, NUMERIC_GRID_REFLOW } from "./shell/layout";

  /**
   * $lib/share/stamp's `Landing["kind"]`, restated. See rule 1 in the header:
   * that module reaches the vendored compiler, so this file may not name it.
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

  /**
   * $lib/tune/model's ForecastView, restated for the same reason every other
   * type on this page is: that module reaches the vendored compiler.
   */
  type ForecastMessage = {
    knobId: string;
    position: number;
    setup: number;
    timer: number;
    setupDelta: number;
    timerDelta: number;
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
    forecast(knobId: string, position: number | undefined): void;
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
    /**
     * The catalog id, NOT an entry object, so /dev/tune/ can mount the region
     * for a configuration that has no workspace page without inventing a row
     * entry for it.
     */
    entryId: string;
    /**
     * The configuration's name, which two of the stamp notice's three
     * sentences carry. It is a prop rather than a catalog lookup because the
     * catalog's knob tables sit behind the compiler (see rule 1).
     */
    name: string;
    /** Knob id to index. The owner keeps them, so re-opening restores them. */
    knobs?: Readonly<Record<string, number>>;
    /** Phase 7's install marker, and /dev/tune/'s way to reach over budget. */
    reserved?: { setup: number; timer: number };
    /** Where the URL landed, decided by the route before the panel opened. */
    landing?: { kind: LandingKind };
    /**
     * The inspector's pinned pair - page 5's Save copy / Share snapshot - which
     * are the route's controls and not the tuner's. Forwarded to the shell's
     * Inspector as its `actions`.
     */
    actions?: Snippet;
    /** Every knob position, on every change, so the owner can hold them. */
    onknobs?: (indices: Readonly<Record<string, number>>) => void;
    /** The new engine, for SimHost.replaceEngine. Never stored in a rune. */
    onpreview?: (engine: SimEngine) => void;
    /** The share payload, precomputed, so the share control never awaits anything. */
    onstamp?: (stamp: string | undefined) => void;
    /** The over-budget reason for the primary control, or undefined when in budget. */
    onbudget?: (reason: string | undefined) => void;
    /**
     * The compiled pair, or undefined while measuring. The owner hands it to
     * the install store, which writes it verbatim - never a re-compile at
     * click time.
     */
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
    /**
     * The colour picker's result pad, for whoever owns the page's SimHost.
     * A consumer that supplies this registers the element against the id it
     * is handed; one that does not gets no result pad at all rather than a
     * blank one.
     */
    onresult?: (id: string, canvas: HTMLCanvasElement) => void;
  } = $props();

  /**
   * The live region's trailing window. 05-UI-SPEC: a knob dragged across 908
   * and back says nothing at all.
   */
  const VOICE_DELAY_MS = 500;

  let view: TuneView | undefined = $state(undefined);
  let ladder: LadderMessage | undefined = $state(undefined);
  let over: OverBudgetMessage | undefined = $state(undefined);
  let rolling = $state(false);
  /**
   * The vector the last roll replaced, or undefined: before any roll, after
   * an undo, and after any hand move since the roll. ONE value - see the
   * header. It is component state and never the tuner's.
   */
  let undo: IndexVector | undefined = $state(undefined);
  /**
   * The knobs the visitor has locked (T1, 10-UI-SPEC 11.5).
   *
   * EPHEMERAL, AND THIS IS THE ONLY PLACE IT LIVES. It is component state, not
   * tuner state: it is handed to `surprise()` per roll and dropped, so there
   * is no path from a lock to `encodeFor` and a held knob's link is
   * byte-identical to the same knob's unheld one. SHARE-01 is untouched, and
   * `surprise.spec.ts` asserts the stamp rather than trusting this paragraph.
   */
  const heldKnobs = new SvelteSet<string>();
  /**
   * The one forecast on screen (TUNE-02, T2), or undefined. AT MOST ONE FOR
   * THE WHOLE INSPECTOR: a visitor has one pointer and one focus. The tuner
   * withdraws it on every knob move, so nothing here has to remember to.
   */
  let forecast: ForecastMessage | undefined = $state(undefined);
  /**
   * The stamp notice describes how the panel arrived, and stops being true
   * once the visitor takes over. untrack: the landing is decided by the route
   * before the panel opens and a later change must not put the notice back
   * after a knob has moved.
   */
  let landed = $state(untrack(() => landing.kind !== "none"));
  let metersUnavailable = $state(false);
  let announcement = $state("");
  /** D-21: the MIDI grid's column count, answered by the observer below. */
  let gridColumns = $state(1);

  /*
    Plain locals, deliberately outside the reactive graph. Nothing that holds an
    engine, a timer handle or an observer goes into a rune, and none of these
    is rendered.
  */
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

  /*
    Both of these read the view through a PARAMETER rather than inline, and that
    is a type-checking necessity rather than taste: at this point in the file
    TypeScript has seen `view` assigned only undefined - it is filled inside an
    async callback further down - so it narrows it to undefined here and every
    property access below becomes an error on `never`. A parameter is not
    narrowed by the outer control flow, so the declared union survives.
  */
  const knobsOf = (current: TuneView | undefined): readonly KnobView[] =>
    current?.knobs ?? [];
  const busyOf = (current: TuneView | undefined): boolean =>
    current === undefined ||
    waiting(current.setup.state) ||
    waiting(current.timer.state);

  const knobViews = $derived(knobsOf(view));
  const hasKnobs = $derived(knobViews.length > 0);
  /**
   * The schema, partitioned into section 7's three sections. The MIDI
   * partition is surprise.ts's predicate over the knob's id and label - the
   * CC or CC base a gesture sends on, and its channel - so the section and
   * the roll's scope are one rule. A kind could not say it: `send` is a
   * `note` kind by the compiler's vocabulary and `channel` is `amount` on the
   * preset route and `mode` on the Lua route.
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
  /**
   * Every ROLLABLE knob held, which is the one state Randomize cannot act
   * in. A MIDI destination is out of scope on every roll, so holding or not
   * holding it changes nothing here.
   *
   * `surpriseIndices` already answers this by handing the previous indices
   * back - its documented exhaustion signal - so the alternative to disabling
   * the control is a button that appears to do nothing, which is worse.
   */
  const allHeld = $derived(
    hasKnobs && rollableKnobs.every((knob) => heldKnobs.has(knob.id)),
  );
  /**
   * aria-busy on the block while either meter is measuring or catching up, so
   * an assistive technology does not read numbers that are about to change.
   */
  const busy = $derived(busyOf(view));
  /** The disabled control's reason, wired to it by aria-describedby. */
  const heldReasonId = "tuning-surprise-held";

  /**
   * WHICH EVENT THE ONE NUMBER SPEAKS FOR.
   *
   * The forecast moves both budgets and both meters draw their own ghost, but
   * the delta beside the option is ONE number and has to be about one of them.
   * It is the event that moves further, ties to Setup - so the number answers
   * "what is the most this would cost me" rather than averaging two budgets
   * that are not interchangeable.
   */
  const forecastEvent = $derived.by<EventWord>(() => {
    const now = forecast;
    if (now === undefined) return "Setup";
    return Math.abs(now.timerDelta) > Math.abs(now.setupDelta)
      ? "Timer"
      : "Setup";
  });

  /**
   * The forecast as the rack takes it: two already-written strings.
   *
   * `$derived.by` rather than `$derived`, and it is not a style choice: a rune
   * initialiser is an expression in the module body, so TypeScript's flow
   * analysis knows `forecast` was assigned `undefined` on the line above and
   * narrows every later branch of it to `never`. A closure defers the read and
   * the declared type survives.
   */
  const rackForecast = $derived.by(() => {
    const now = forecast;
    if (now === undefined) return undefined;
    const event = forecastEvent;
    return {
      knobId: now.knobId,
      position: now.position,
      label: forecastDelta(event === "Setup" ? now.setupDelta : now.timerDelta),
      sentence: forecastExpansion(
        event,
        event === "Setup" ? now.setup : now.timer,
      ),
    };
  });

  /**
   * WHAT A COLOUR MAY STILL SPEND (TUNE-05, 10-UI-SPEC 11.2).
   *
   * The tighter of the two events' free margins, and the number of times the
   * emitted script writes the literal. A colour change moves nothing else in
   * the script, so a candidate's cost is exactly the digit-count difference of
   * its three channels times the copy count - which is why this is arithmetic
   * the picker can do without ever reaching the compiler.
   *
   * `copies` is 1, and the ONE card that emits its colour twice is `ninepads`,
   * whose checkerboard draws a dimmed second copy. So the guard is
   * conservative by at most six characters on exactly one entry, and what
   * catches that six is the path that already exists: the meters go over, the
   * message appears and the primary control is disabled with a reason.
   *
   * Clamped at zero because an ALREADY over-budget state must not shorten
   * every rail to one detent.
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

  /**
   * Two columns when the INSPECTOR is at least NUMERIC_GRID_REFLOW wide. The
   * grid's box is the inspector's body less the two insets, so the inspector's
   * width is the box plus INSPECTOR_INSET twice - both numbers layout.ts's.
   */
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

  /**
   * The command's own sentence, with the crossing folded into it when the
   * command landed over budget. Reset settings can land on defaults that are
   * already over 908, and the live region emits at most one string per event.
   */
  function commandLine(
    command: "reset" | "surprise",
    current: TuneView,
    isOver: boolean,
  ): string {
    if (command === "surprise") {
      // The count is the roll's SCOPE, not the rack: a MIDI destination was
      // never rolled and the sentence must not say it was.
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
      // The numbers have not landed yet. The next emit reschedules; when the
      // formatter never resolves at all there are no numbers, and a command
      // that cannot state one says nothing rather than inventing it.
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

  /**
   * The share control's one announcement. It holds no live region of its
   * own, so its owner calls this through bind:this - the shape
   * TryOnDevice.svelte's release() established.
   */
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
   * D-08's prefetch, and the only place this component reaches the compile
   * surface. It is a DYNAMIC import for the reason in rule 1, it is not awaited
   * before the first paint, and its failure is the meters' own degraded state
   * rather than the region's.
   */
  async function prefetchFormatter(): Promise<void> {
    try {
      const { padReady } = await import("$lib/pad");
      await padReady();
    } catch {
      if (mounted) metersUnavailable = true;
    }
  }

  onMount(() => {
    mounted = true;
    stopIdle = onIdle(() => {
      void prefetchFormatter();
    });

    void (async () => {
      // DYNAMIC, and never `from`. Rule 1 in the header is the whole reason.
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
        onforecast: (next) => {
          forecast = next;
        },
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
    // A hand move after a roll: the stored vector would now restore more
    // than the roll, so it goes. One value, and it means one thing.
    undo = undefined;
    tuner?.set(id, index);
  }

  function resetKnob(id: string): void {
    landed = false;
    undo = undefined;
    tuner?.reset(id);
  }

  /**
   * One lock, toggled. It moves no knob, so it does NOT clear the stamp
   * notice and it does not touch the tuner: "these knobs came with the link"
   * is still true of a link whose knobs the visitor has only locked.
   */
  function holdKnob(id: string): void {
    if (!heldKnobs.delete(id)) heldKnobs.add(id);
  }

  /**
   * One hover or focus, forwarded. Nothing is computed here and nothing is
   * cached here: the tuner owns the memo, because the memo's key is the index
   * vector and the tuner is what owns that.
   */
  function forecastKnob(id: string, position: number | undefined): void {
    tuner?.forecast(id, position);
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
    // The notice goes for the same reason it goes on a knob turn and on Reset
    // settings: a roll moves every knob in scope, so "these knobs came with
    // the link" stops being true the moment it settles.
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
    forecast={rackForecast}
    empty={!hasKnobs}
    onchange={changeKnob}
    onreset={resetKnob}
    onhold={holdKnob}
    onforecast={forecastKnob}
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
      <!--
        Section 7's "Provide Undo randomize". Disabled until a roll has
        happened and again the moment it is used or a knob moves by hand:
        the button's state IS the one stored vector's presence.
      -->
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
    <!--
      DEGR-02's reason rule, and this control needs one where Reset settings
      does not: Reset settings is disabled by a state the rack shows directly,
      and this one is disabled by a state spread across every row's toggle.
    -->
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
    forecast={rackForecast}
    empty={false}
    {onresult}
    onchange={changeKnob}
    onreset={resetKnob}
    onhold={holdKnob}
    onforecast={forecastKnob}
  />
{/snippet}

<!-- MIDI output: page 5's 2 x 2 field grid (D-21), and section 16's helper line. -->
{#snippet midi()}
  <div class="grid-box" bind:this={gridBox} data-testid="midi-grid">
    <KnobRack
      entry={{ id: entryId, name }}
      knobs={midiKnobs}
      held={heldKnobs}
      forecast={rackForecast}
      layout="grid"
      columns={gridColumns}
      empty={false}
      onchange={changeKnob}
      onreset={resetKnob}
      onhold={holdKnob}
      onforecast={forecastKnob}
    />
  </div>
  <p class="helper type-helper">{MIDI_HELPER}</p>
{/snippet}

{#snippet headline()}
  {INSPECTOR_HEADLINE[0]}<br />{INSPECTOR_HEADLINE[1]}
{/snippet}

<div class="region" data-testid="tuning-region">
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
    <!--
      HANGAR's fourth group: the two budget meters under Phase 4's TUNING
      caption. Not a section 7 section - the spec has no budget meter - and
      not for cutting; it is the site's honesty about 908.
    -->
    <hr class="divider" />
    <p class="caption" id="tuning-meters-caption">{TUNING_CAPTION}</p>
    {#if metersUnavailable}
      <p class="unavailable" data-testid="meters-unavailable">
        {METERS_UNAVAILABLE}
      </p>
    {:else if view}
      <div
        class="meters"
        data-testid="tuning-meters"
        aria-busy={busy}
        aria-labelledby="tuning-meters-caption"
      >
        <BudgetMeter view={view.setup} ghost={forecast?.setup} />
        <BudgetMeter view={view.timer} ghost={forecast?.timer} />
      </div>
    {/if}

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
  /*
    No box of its own: the shell's inspector column sizes the Inspector, and
    a wrapper with a box would put a second scroll container between them.
    The test id is what e2e/tuning-webkit.e2e.ts measures for sideways
    overflow; a box of zero width has nothing to scroll to.
  */
  .region {
    display: contents;
  }

  /*
    Page 5's two outlined buttons under Behavior, side by side and equal. One
    row that wraps into two at a narrow width rather than truncating or
    scrolling (D-11: wrap, never scroll).
  */
  .actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 16px;
    margin-block-start: 16px;
  }

  /*
    Section 10.3's Secondary treatment at 44px: a 1px boundary outline, no
    fill, the field face. Neither of these ever takes an accent fill: the
    only filled button on this site is the primary. Square (D-01).
  */
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

  /*
    The one reason line this region renders, and it appears only in the state
    that produces it. Body role, quiet, 8px under the actions row.
  */
  .reason {
    margin: 8px 0 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  /* The grid's box, observed for D-21. It is exactly as wide as the body's content. */
  .grid-box {
    inline-size: 100%;
  }

  .helper {
    margin: 12px 0 0;
    color: var(--color-ink-quiet);
  }

  /* The fourth group's separation, Inspector.svelte's own divider rule. */
  .divider {
    margin-block: 20px;
    border: 0;
    border-block-start: 1px solid var(--color-divider);
  }

  /* Phase 4's caption: 12px / 600 / 14px box / 0.18em, uppercase, quiet. */
  .caption {
    margin: 0 0 12px;
    font-size: 12px;
    font-weight: 600;
    line-height: 14px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
  }

  /* Exactly 56px: two 26px meters and the 4px between them. */
  .meters {
    display: flex;
    flex-direction: column;
    gap: 4px;
    block-size: 56px;
  }

  /* The formatter never resolved. One Body line, and nothing else is disabled. */
  .unavailable {
    margin: 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  @media (prefers-reduced-motion: reduce) {
    .action {
      transition: none;
    }
  }
</style>
