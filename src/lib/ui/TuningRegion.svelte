<!--
  The tuning region: the six bands Phase 4 reserved room for, filled.

  Two rules in this file are structural guards rather than preferences, and
  both are the reason it is shaped the way it is.

  RULE 1 - THE COMPILER ARRIVES THROUGH `await import("$lib/tune/model")` AND
  NEVER STATICALLY. src/lib/tune/model.ts imports the vendored compiler, which
  imports @intechstudio/grid-protocol at module scope, which is a 131,101-byte
  chunk. A static import here would put all of it on the critical path of a page
  whose whole job is to paint in under two seconds.
  src/lib/config-shape.spec.ts test 13 walks every non-spec file under
  src/lib/ui/ and fails on a `from` specifier naming the vendored tree, the
  protocol package or the compile surface; test 14 asserts the built
  build/index.html and build/c/aurora/index.html reference no chunk carrying the
  package. Coverflow.svelte reaches the simulator the same way, in its own
  onMount, and this is a copy of that shape rather than a new one. The types the
  region holds are therefore declared STRUCTURALLY below - the
  src/lib/sim/host.ts HostEngine pattern - and the real ones are checked against
  them where buildTuner's result is assigned.

  Everything else this file names is compiler-free by construction:
  $lib/tune/view, $lib/tune/copy and $lib/tune/idle import nothing at all, and
  $lib/sim/engine is a type-only import that is erased before a byte is emitted.

  RULE 2 - THE REGION'S HEIGHT IS FIXED THE MOMENT AN ENTRY IS CHOSEN. It is a
  pure function of that entry's knob count and knob kinds. A meter changing, a
  readout going stale and a bar crossing 908 all leave it exactly where it was.
  Phase 4's comment in ChosenPanel.svelte was written to protect this, and this
  is the mechanism.

  ------------------------------------------------------------------------
  THE ARITHMETIC, AND WHY IT IS TWO CONSTANTS

  Every vertical gap between bands in the region is 16px - Phase 4's `md`, so
  this phase adds no new spacing value. The 12px in 05-UI-SPEC is horizontal
  only. Top to bottom, with `r` row-layout knobs and `w` word rows:

      region padding, top                                       16
      TUNING caption           (the region's fixed 14px line box) 14
      gap                                                        16
      message slot A           auto, and only when a stamp landed  -
      knob rack                               48r + 66w + 196p - 4
      gap                                                        16
      actions row              SURPRISE ME / RESET ALL            44
      gap                                                        16
      meters block             (14 + 4 + 8) x 2 + 4 = exactly     56
      message slot B           auto, and only when it applies      -
      region padding, bottom                                     16

  which sums to

      194 + 48r + 66w + 196p - 4     the actions row on one line
      246 + 48r + 66w + 196p - 4     the actions row wrapped to two

  `p` is 1 when the entry declares ANY colour knob and 0 otherwise, because
  plan 10-10 renders one ColourPicker per panel rather than one per knob
  (10-UI-SPEC 11.2). Its 192px block is width-independent by construction, so
  it needs no third constant. The colour knobs themselves are billed at zero:
  they are inside the picker, not beside it.

  246 = 194 + 44 + 8: the second 44px button row plus the 8px `sm` gap that
  05-UI-SPEC's Spacing table defines as the gap between SURPRISE ME and RESET
  ALL when they wrap. A region carrying only the 194 constant would
  under-reserve by 52px at exactly the widths DEGR-01 exists for. The
  two-constant form is a recorded correction to the approved UI spec, whose
  "Vertical arithmetic" table bills the actions row at a flat 44px while its own
  "SURPRISE ME and RESET ALL" section gives that row `flex-wrap: wrap`.
  KnobRack.svelte carries the same derivation beside the code that produces the
  `48r + 66w - 4` half of it.

  THE WRAP WIDTH IS MEASURED, NOT DERIVED. KnobRack.svelte's comment reasoned
  from Quicksand 600's uppercase advance to about 251px and said plainly that
  the real number was this plan's to take. It was taken: this component was
  mounted in Chromium against its own shipped markup and style block, with
  Quicksand loaded the way src/app.css loads it, and the container narrowed one
  pixel at a time. SURPRISE ME lays out at 134.453125px and RESET ALL at
  114.546875px - 249.0px exactly - so with the 8px `sm` gap the pair needs
  exactly 257px. They share one line down to a region content box of 257px and
  wrap at 256px. The container query below is therefore `width < 257px`, and
  257px of content box is a viewport of about 385px once 48px of page padding,
  48px of panel padding and 32px of region padding are taken off it. Both 320px
  (content box 192px) and 375px (247px) are below it and reserve the wrapped
  constant; 420px (292px) is above it and reserves the one-line constant. The
  measurement is 6px wider than the derivation, which is inside the margin the
  derivation admitted, and it agrees with the derivation's conclusion about all
  three of those widths.

  The two constants are stated here in terms of the OUTER region box, which is
  ChosenPanel.svelte's `.reserved` - it owns the 16px of padding at each end.
  The element this file reserves sits inside that padding, so it carries
  194 - 32 = 162 and 246 - 32 = 214.

  ONE THING THE HEIGHT CANNOT BE SETTLED BEFORE. The knob count and the knob
  kinds live behind the compiler: src/lib/tune/knobs.preset.ts imports the
  vendored `_pad`, so there is no compiler-free way to ask how many knobs an
  entry has. The reservation is therefore Phase 4's 152px floor until the
  tuner's first view lands - the same tick the rack first appears - and the
  computed constant from then on, unchanged for the life of the entry. Nothing
  a visitor is reading moves either way: the primary control, its honesty line
  and the connect-state region are all ABOVE this element, and the region grows
  downward.
  ------------------------------------------------------------------------

  ONE LIVE REGION, AND IT CANNOT CHATTER. There is exactly one visually-hidden
  aria-live="polite" aria-atomic="true" element for the whole tuning region, and
  it NEVER fires on a value change. It fires on a category transition (in budget
  to over budget and back), on the two explicit commands, and on a successful
  copy - which arrives through the exported announceCopied(), because COPY LINK
  sits below the panel's hairline and holds no live region of its own.

  Everything it says goes through ONE trailing timer, and that is what makes
  "a command and a category transition are one utterance, never two" true by
  construction rather than by remembering: RESET ALL can land on defaults that
  are already over budget, and $lib/tune/copy carries combined strings for
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
  by one Body line and NOTHING else is disabled. This phase connects and
  identifies and needs no compiler: knobs still turn, the preview still animates,
  COPY LINK still copies.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy, onMount, untrack } from "svelte";
  import { SvelteSet } from "svelte/reactivity";
  import type { SimEngine } from "$lib/sim/engine";
  import {
    LINK_COPIED_ANNOUNCEMENT,
    METERS_UNAVAILABLE,
    RESET_ALL,
    SURPRISE_ALL_HELD,
    SURPRISE_ME,
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
  import { knobPosition, type KnobView, type TuneView } from "$lib/tune/view";
  import BudgetMessage from "./BudgetMessage.svelte";
  import BudgetMeter from "./BudgetMeter.svelte";
  import KnobRack from "./KnobRack.svelte";
  import StampNotice from "./StampNotice.svelte";

  /**
   * $lib/share/stamp's `Landing["kind"]`, restated. See rule 1 in the header:
   * that module reaches the vendored compiler, so this file may not name it.
   */
  type LandingKind = "none" | "restored" | "older" | "unreadable";

  /** $lib/tune/model's LadderView, narrowed to what slot B renders. */
  type LadderMessage = { line: string };

  /** $lib/tune/model's OverBudgetView, narrowed to what this region uses. */
  type OverBudgetMessage = {
    line: string;
    backOff: string;
    /** The reason beside a disabled TRY ON DEVICE. Reported upward, never rendered here. */
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

  /** $lib/tune/model's Tuner, narrowed to the calls this region makes. */
  type Tuner = {
    set(knobId: string, index: number): void;
    reset(knobId: string): void;
    resetAll(): void;
    surprise(held?: ReadonlySet<string>): Promise<void>;
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
    onknobs,
    onpreview,
    onstamp,
    onbudget,
    onconfig,
    onresult,
  }: {
    /**
     * The catalog id, NOT an entry object, so /dev/tune/ can mount the region
     * for a configuration that has no front-door page without inventing a row
     * entry for it.
     */
    entryId: string;
    /**
     * The configuration's name, which two of message slot A's three sentences
     * carry. It is a prop rather than a catalog lookup because the catalog's
     * knob tables sit behind the compiler (see rule 1) and slot A's height is
     * settled at landing, before the panel is visible - resolving the name
     * through the same dynamic import would settle it a chunk-fetch later.
     */
    name: string;
    /** Knob id to index. The owner keeps them, so re-choosing restores them. */
    knobs?: Readonly<Record<string, number>>;
    /** Phase 7's install marker, and /dev/tune/'s way to reach over budget. */
    reserved?: { setup: number; timer: number };
    /** Where the URL landed, decided by the route before the panel opened. */
    landing?: { kind: LandingKind };
    /** Every knob position, on every change, so the owner can hold them. */
    onknobs?: (indices: Readonly<Record<string, number>>) => void;
    /** The new engine, for SimHost.replaceEngine. Never stored in a rune. */
    onpreview?: (engine: SimEngine) => void;
    /** The share payload, precomputed, so COPY LINK never awaits anything. */
    onstamp?: (stamp: string | undefined) => void;
    /** The over-budget reason for TRY ON DEVICE, or undefined when in budget. */
    onbudget?: (reason: string | undefined) => void;
    /**
     * The compiled pair, or undefined while measuring. The owner hands it to
     * the install store, which writes it verbatim - never a re-compile at
     * click time.
     */
    onconfig?: (config: { setup: string; timer: string } | undefined) => void;
    /**
     * The colour picker's result pad, for whoever owns the page's SimHost.
     *
     * The region has no host of its own - it hands the tuner's engine upward
     * through `onpreview` and the owner registers it - so the result canvas
     * goes the same way. A consumer that supplies this registers the element
     * against the id it is handed and unregisters it on teardown; one that
     * does not gets no result pad at all rather than a blank one.
     */
    onresult?: (id: string, canvas: HTMLCanvasElement) => void;
  } = $props();

  /**
   * The live region's trailing window. 05-UI-SPEC: a knob dragged across 908
   * and back says nothing at all.
   */
  const VOICE_DELAY_MS = 500;

  /*
    The two constants of the header's arithmetic, less ChosenPanel's 32px of
    region padding, are 194 - 32 = 162 and 246 - 32 = 214. They are literals in
    the style block below rather than constants here, because a CSS custom
    property cannot be used inside a container query's condition and half the
    pair would then live in one place and half in the other. What this script
    computes is the rack's own contribution, which IS a custom property.
  */

  /** A row-layout knob is 44 + 4; a word row is 62 + 4; the rack drops its trailing gap. */
  const ROW_KNOB_PX = 48;
  const WORD_ROW_PX = 66;
  /** The colour picker's 192px block plus the same 4px gap. Billed ONCE. */
  const PICKER_PX = 196;
  const RACK_GAP_PX = 4;

  let view: TuneView | undefined = $state(undefined);
  let ladder: LadderMessage | undefined = $state(undefined);
  let over: OverBudgetMessage | undefined = $state(undefined);
  let rolling = $state(false);
  /**
   * The knobs the visitor has locked (T1, 10-UI-SPEC 11.5).
   *
   * EPHEMERAL, AND THIS IS THE ONLY PLACE IT LIVES. It is component state, not
   * tuner state: it is handed to `surprise()` per roll and dropped, so there
   * is no path from a lock to `encodeFor` and a held knob's link is
   * byte-identical to the same knob's unheld one. SHARE-01 is untouched, and
   * `surprise.spec.ts` asserts the stamp rather than trusting this paragraph.
   *
   * A SvelteSet rather than a plain Set in a rune, and the linter is right to
   * insist: a plain Set is not deeply reactive, so `allHeld` would have to be
   * recomputed by reassigning the whole collection on every toggle. This one
   * invalidates the readers of the key that changed and nothing else, which is
   * the same reason Knob.svelte reaches for MediaQuery rather than a one-shot
   * matchMedia read.
   */
  const heldKnobs = new SvelteSet<string>();
  /**
   * The one forecast on screen (TUNE-02, T2), or undefined.
   *
   * AT MOST ONE FOR THE WHOLE RACK: a visitor has one pointer and one focus,
   * so a second forecast could only ever be a stale first one. The tuner
   * withdraws it on every knob move, so nothing here has to remember to.
   */
  let forecast: ForecastMessage | undefined = $state(undefined);
  /**
   * Slot A describes how the panel arrived, and stops being true once the
   * visitor takes over.
   *
   * untrack is not decoration: reading a prop at component-init scope otherwise
   * warns that only the initial value is captured - which is exactly what is
   * wanted here, because the landing is decided by the route before the panel
   * opens and a later change to it must not put the notice back after a knob
   * has moved. Coverflow.svelte's openingCentre is the same shape.
   */
  let landed = $state(untrack(() => landing.kind !== "none"));
  let metersUnavailable = $state(false);
  /** Settled on the first view and never recomputed. See rule 2 in the header. */
  let rackPx: number | undefined = $state(undefined);
  let announcement = $state("");

  /*
    Plain locals, deliberately outside the reactive graph. Nothing that holds an
    engine or a timer handle goes into a rune, and none of these is rendered.
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

  /*
    Both of these read the view through a PARAMETER rather than inline, and that
    is a type-checking necessity rather than taste: at this point in the file
    TypeScript has seen `view` assigned only undefined - it is filled inside an
    async callback further down - so it narrows it to undefined here and every
    property access below becomes an error on `never`. A parameter is not
    narrowed by the outer control flow, so the declared union survives. It is
    TryOnDevice.svelte's labelOf/secondsOf shape, for the same reason.
  */
  const knobsOf = (current: TuneView | undefined): readonly KnobView[] =>
    current?.knobs ?? [];
  const busyOf = (current: TuneView | undefined): boolean =>
    current === undefined ||
    waiting(current.setup.state) ||
    waiting(current.timer.state);

  const knobViews = $derived(knobsOf(view));
  const hasKnobs = $derived(knobViews.length > 0);
  const atDefaults = $derived(
    knobViews.every((knob) => knob.index === knob.default),
  );
  /**
   * Every knob held, which is the one state SURPRISE ME cannot act in.
   *
   * `surpriseIndices` already answers this by handing the previous indices
   * back - its documented exhaustion signal - so the alternative to disabling
   * the control is a button that appears to do nothing, which is worse.
   */
  const allHeld = $derived(
    hasKnobs && knobViews.every((knob) => heldKnobs.has(knob.id)),
  );
  /**
   * aria-busy on the block while either meter is measuring or catching up, so
   * an assistive technology does not read numbers that are about to change.
   */
  const busy = $derived(busyOf(view));
  const rack = $derived(rackPx ?? 0);
  /** The disabled control's reason, wired to it by aria-describedby. */
  const heldReasonId = "tuning-surprise-held";

  /**
   * WHICH EVENT THE ONE NUMBER SPEAKS FOR.
   *
   * The forecast moves both budgets and both meters draw their own ghost, but
   * the delta beside the option is ONE number and has to be about one of them.
   * It is the event that moves further, ties to Setup - so the number answers
   * "what is the most this would cost me" rather than averaging two budgets
   * that are not interchangeable. The sentence beside it names the event, so
   * the number is never ambiguous about which meter it belongs to.
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
   * the picker can do without ever reaching the compiler, and why it does not
   * cost 4,096 compiles to answer.
   *
   * `copies` is 1, and the ONE card that emits its colour twice is `ninepads`,
   * whose checkerboard draws a dimmed second copy. So the guard is
   * conservative by at most six characters on exactly one entry, and what
   * catches that six is the path that already exists: the meters go over, the
   * message appears and TRY ON DEVICE is disabled with a reason. Under-warning
   * into a state the panel already handles is the right side to err on;
   * over-warning would grey out a colour that fits.
   *
   * Clamped at zero because an ALREADY over-budget state must not shorten
   * every rail to one detent: the colour the knob stands at is always
   * affordable by construction, and 908 is the meters' business to report.
   *
   * MEASURED AT ZERO EXCLUSIONS ON TODAY'S SHELF. The dearest colour-bearing
   * preset is `ninepads` at 640 of 908 - 268 free against a lattice worth six
   * characters - and zero of the reachability sweep's 24,576 colour states
   * crosses the wall.
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

  /** `48r + 66w + 196p - 4`, and zero for an entry with nothing to turn. */
  function rackHeight(next: TuneView): number {
    const words = next.knobs.filter((knob) => knob.widget === "words").length;
    const colours = next.knobs.filter(
      (knob) => knob.widget === "colour",
    ).length;
    const rows = next.knobs.length - words - colours;
    if (next.knobs.length === 0) return 0;
    // ONE picker, however many colour knobs it holds. Billing them one each
    // would over-reserve by 48px on `console`, `strip` and `forge` and would
    // contradict the one thing 10-UI-SPEC 11.2 is about.
    return (
      ROW_KNOB_PX * rows +
      WORD_ROW_PX * words +
      (colours > 0 ? PICKER_PX : 0) -
      RACK_GAP_PX
    );
  }

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
   * command landed over budget. RESET ALL can land on defaults that are already
   * over 908, and the live region emits at most one string per event.
   */
  function commandLine(
    command: "reset" | "surprise",
    current: TuneView,
    isOver: boolean,
  ): string {
    if (command === "surprise") {
      return liveRandomised(
        current.knobs.length,
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
   * COPY LINK's one announcement. It lives below the panel's hairline and holds
   * no live region of its own, so its owner calls this through bind:this - the
   * shape TryOnDevice.svelte's release() established.
   */
  export function announceCopied(): void {
    clearVoice();
    announcement = LINK_COPIED_ANNOUNCEMENT;
  }

  // ---------------------------------------------------------------------------
  // The tuner.

  function receive(next: TuneView): void {
    view = next;
    // Settled once, on the first view, and never recomputed: see rule 2.
    rackPx ??= rackHeight(next);
    const indices: Record<string, number> = {};
    // THROUGH knobPosition, never knob.index: a windowed view - today only a
    // lattice colour knob, until 10-10 - indexes its own values rather than
    // the knob. See view.ts.
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
    tuner?.set(id, index);
  }

  function resetKnob(id: string): void {
    landed = false;
    tuner?.reset(id);
  }

  /**
   * One lock, toggled. It moves no knob, so it does NOT clear slot A and it
   * does not touch the tuner: "these knobs came with the link" is still true
   * of a link whose knobs the visitor has only locked.
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
    pendingCommand = "reset";
    tuner.resetAll();
    scheduleVoice();
  }

  async function surprise(): Promise<void> {
    const current = tuner;
    if (current === undefined || rolling || allHeld) return;
    rolling = true;
    // Slot A goes for the same reason it goes on a knob turn and on RESET ALL:
    // a roll moves every knob, so "these knobs came with the link" stops being
    // true the moment it settles.
    landed = false;
    pendingCommand = "surprise";
    try {
      await current.surprise(heldKnobs);
    } finally {
      if (mounted) rolling = false;
    }
    scheduleVoice();
  }
</script>

<div class="region">
  <div class="bands" data-testid="tuning-region" style="--tune-rack: {rack}px">
    <p class="caption">{TUNING_CAPTION}</p>

    {#if landed}
      <StampNotice kind={landing.kind} {name} />
    {/if}

    <KnobRack
      entry={{ id: entryId, name }}
      knobs={knobViews}
      held={heldKnobs}
      budget={colourBudget}
      forecast={rackForecast}
      {onresult}
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
          {SURPRISE_ME}
        </button>
        <button
          class="action"
          type="button"
          data-testid="reset-all"
          disabled={atDefaults}
          onclick={resetAll}
        >
          {RESET_ALL}
        </button>
      </div>
      <!--
        DEGR-02's reason rule, and this control needs one where RESET ALL does
        not: RESET ALL is disabled by a state the rack shows directly, and this
        one is disabled by a state spread across every row's toggle.
      -->
      {#if allHeld}
        <p class="reason" id={heldReasonId} data-testid="surprise-held-reason">
          {SURPRISE_ALL_HELD}
        </p>
      {/if}
    {/if}

    {#if metersUnavailable}
      <p class="unavailable" data-testid="meters-unavailable">
        {METERS_UNAVAILABLE}
      </p>
    {:else if view}
      <div class="meters" data-testid="tuning-meters" aria-busy={busy}>
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
  </div>
</div>

<style>
  /*
    The query container the height switch below resolves against, and nothing
    else. Its width IS the region's content box, because ChosenPanel.svelte's
    `.reserved` owns the 16px of padding at each edge. A container cannot query
    itself, which is why the reservation is on the child rather than here.
  */
  .region {
    container-type: inline-size;
  }

  /*
    194 - 32, plus the rack. A flex column so the gaps below are the elements'
    own margins rather than a collapsing negotiation between them, and so an
    empty message slot costs exactly nothing.
  */
  .bands {
    display: flex;
    flex-direction: column;
    min-block-size: calc(162px + var(--tune-rack, 0px));
  }

  /*
    246 - 32. MEASURED, not derived: the two action buttons need exactly 257px
    of content box (134.453125 + 114.546875 + the 8px gap), so they share one
    line down to 257px and wrap at 256px. See the header for the working and for
    why reserving only the one-line constant would under-reserve by 52px at
    320px and 375px.
  */
  @container (width < 257px) {
    .bands {
      min-block-size: calc(214px + var(--tune-rack, 0px));
    }
  }

  /*
    Micro role in the quiet rung, and a 14px line box rather than Quicksand's
    1.2 ratio: every 12px line inside this region is 14px, which is what makes
    the arithmetic in the header whole pixels. 16px below it, always.
  */
  .caption {
    margin: 0 0 16px;
    font-size: 12px;
    font-weight: 600;
    line-height: 14px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
  }

  /*
    One 44px row that wraps into two rather than truncating or scrolling
    (D-11: wrap, never scroll). `flex: 1 1 auto` on the buttons means the line
    breaks at their natural widths and each wrapped line then fills.
  */
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: space-between;
    margin-block-start: 16px;
  }

  /*
    Phase 4's secondary treatment at 44px. Neither of these ever takes an accent
    fill: the only filled button on this panel is TRY ON DEVICE.
  */
  .action {
    appearance: none;
    flex: 1 1 auto;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-line);
    border-radius: 6px;
    background: transparent;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink);
    cursor: pointer;
    transition: border-color 140ms ease-out;
  }

  .action:hover:not(:disabled) {
    border-color: var(--color-accent);
  }

  /*
    Phase 4's disabled treatment, and RESET ALL carries no adjacent reason line:
    DEGR-02's reason rule exists for install controls whose cause is invisible,
    and here the cause is the rack directly above with every marker at home.
  */
  .action:disabled {
    color: var(--color-ink-dim);
    cursor: not-allowed;
  }

  /*
    The one reason line this region renders, and it appears only in the state
    that produces it. Body role, quiet, 8px under the actions row - the same
    `sm` step that separates the two buttons when they wrap.
  */
  .reason {
    margin: 8px 0 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  /* Exactly 56px: two 26px meters and the 4px between them. */
  .meters {
    display: flex;
    flex-direction: column;
    gap: 4px;
    block-size: 56px;
    margin-block-start: 16px;
  }

  /* The formatter never resolved. One Body line, and nothing else is disabled. */
  .unavailable {
    margin: 16px 0 0;
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
