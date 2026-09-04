<!--
  The row: one component owns every pad on it.

  The ring arrives as the `row` prop and defaults to FRONT_DOOR, so / and every
  row entry's page are byte-for-byte what Phase 4 signed off. Its entries are
  rendered in stable catalog order and are NEVER reordered. Stepping changes one
  number - `centre` - and every slot's transform is derived from
  slotFor(slotOffset(index, centre, count), heroPx). A keyed each that reordered
  would move DOM nodes and make the layout engine do the work the compositor is
  meant to do.

  Three structural rules here are load-bearing rather than stylistic:

    1. The clip and the edge mask live on the OUTER wrapper (.band), which has
       no preserve-3d, and the perspective lives on the inner .stage. Any of
       overflow other than visible or clip, an opacity below 1, a filter, a
       mask-image, a mix-blend-mode or contain: paint forces transform-style
       flat on descendants, so a mask on the 3D context would flatten the whole
       ladder into a row of equal squares (04-CONTEXT D-16).
    2. filter: brightness() goes on the SLOT, which is a leaf of the 3D tree -
       it has no 3D children to flatten - and it only scales channels the
       simulator already emitted toward black. It is the one filter permitted
       anywhere near a pad.
    3. Nothing that holds an engine, a canvas or a frame buffer goes into a
       rune. $state deep-proxies objects and arrays, and a proxy trap inside a
       100 Hz loop is a silent performance cliff. Only scalars cross into
       Svelte: centre, radius, heroPx, ready, transitions and the list of ids
       whose engine could not be built.

  The simulator arrives through a DYNAMIC import inside onMount and never a
  static one: src/vendor/botor/_pad.ts imports @intechstudio/grid-protocol at
  module scope, which is a 131 KB chunk, and a static import would put it on the
  front door's critical path. The row's frames, dots and gutters are in the
  prerendered HTML and are visible before any of that resolves; the canvases
  fill in when it does (04-CONTEXT D-21). The same rule covers the Lua VM: an
  engine is asked for by entry.preview through $lib/sim/engine's createEngine,
  whose "lua" branch is itself a dynamic import, so a row of ported entries
  never fetches the VM's 271 KB of WebAssembly (08-CONTEXT D-07).

  An entry the catalog cannot build an engine for is SKIPPED, never crashed on
  (08-CONTEXT D-08 as amended in plan 08-03): its id goes into `skipped`, the
  name plate says "unavailable", and every other pad in the row still animates.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy, onMount, untrack } from "svelte";
  import { pushState, replaceState } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { typographic } from "$lib/browse/typographic";
  import { FRONT_DOOR, type FrontDoorEntry } from "$lib/catalog/front-door";
  import {
    radiusForWidth,
    slotFor,
    slotOffset,
    step,
    visibleWindow,
  } from "$lib/coverflow/slots";
  import { shareUrl } from "$lib/share/url";
  import type { SimEngine } from "$lib/sim/engine";
  import { SimHost } from "$lib/sim/host";
  import { mapAxis } from "$lib/sim/touch";
  import ChosenPanel from "./ChosenPanel.svelte";
  import CopyLink from "./CopyLink.svelte";
  import FidelityLine from "./FidelityLine.svelte";
  import NamePlate from "./NamePlate.svelte";
  import PadCanvas from "./PadCanvas.svelte";
  import PadFrame from "./PadFrame.svelte";
  import TryOnDevice from "./TryOnDevice.svelte";
  import TuningRegion from "./TuningRegion.svelte";

  /**
   * `$lib/share/stamp`'s `Landing`, restated STRUCTURALLY rather than imported.
   *
   * That module reaches the vendored compiler through `knobs.preset`, so this
   * file may not name it: the stamp arrives through `await import()` in onMount
   * below, and the real `Landing` is checked against this declaration where
   * `decodeFor`'s result is assigned. It is the `src/lib/sim/host.ts`
   * `HostEngine` pattern, used by every Phase 5 component for the same reason.
   */
  type Landing =
    | { kind: "none" }
    | { kind: "restored"; indices: Record<string, number> }
    | { kind: "older" }
    | { kind: "unreadable" };

  const NO_LANDING: Landing = { kind: "none" };

  let {
    row = FRONT_DOOR,
    initialId,
    notice,
    onskipped,
  }: {
    /**
     * The ring. Defaults to the front-door row, so / and every row entry's page
     * are byte-for-byte what Phase 4 signed off. An off-row /c/{id}/ passes a
     * ONE-ENTRY row: src/lib/coverflow/slots.ts is well defined at count 1 -
     * visibleWindow(c, r, 1) is [0], step(0, +/-1, 1) is 0, slotOffset(0, 0, 1)
     * is 0 - so a solo pad renders as the hero and stepping is inert. Widening
     * the ring to sixteen would change a signed-off route for no requirement
     * (D-04).
     */
    row?: readonly FrontDoorEntry[];
    /** Centre this entry on arrival. An unknown id opens on the row's first. */
    initialId?: string;
    /** Forwarded to the fidelity line. The deep-link route's unknown-id copy. */
    notice?: string;
    /**
     * The ids the vendored shelf could not build an engine for. Reported once,
     * after mount, so plan 04-07's name plate can render "{name} - unavailable"
     * without reaching into this component.
     */
    onskipped?: (ids: readonly string[]) => void;
  } = $props();

  /**
   * The ring's length. A $derived and NOT a module-init constant: the row is a
   * prop and is not known when this file's constants are evaluated. Every call
   * of step, slotOffset and visibleWindow reads it, so a row of one and a row
   * of eight go through exactly the same arithmetic.
   */
  const count = $derived(row.length);
  /** |deltaX| accumulated before one step fires, and the pause after it. */
  const WHEEL_THRESHOLD_PX = 40;
  const WHEEL_COOLDOWN_MS = 260;
  /** A gesture that goes quiet for this long starts its accumulation again. */
  const WHEEL_IDLE_MS = 300;
  /** A horizontal touch drag of at least this many pixels steps one. */
  const DRAG_STEP_PX = 48;
  const RESIZE_DEBOUNCE_MS = 200;

  /*
    THE TAP RULE (D-11, 04-UI-SPEC W-15). The hero is playable before it is
    chosen and a click has to do both, so the two readings of one gesture are
    separated by time and distance rather than by target. A pointerdown ALWAYS
    delivers a touch to the simulator; a pointerup inside these two numbers is
    ALSO a choose. Anything longer or further is play only, which is what keeps
    a drag across the instrument from closing the row behind a panel.
  */
  const TAP_MAX_MS = 250;
  const TAP_MAX_PX = 6;

  /*
    How far the row may be stepped while chosen before the panel closes.

    D-08 and D-09 pull in opposite directions - one says the arrows keep
    stepping and the panel re-fills, the other says stepping past the chosen
    entry returns to the plain coverflow - and both are requirements. One step
    is a look at the neighbour and re-fills the panel with it (W-20 keeps the
    connect state); a second step is leaving, and closes it.
  */
  const STEP_AWAY_LIMIT = 1;

  /** While chosen the side pads recede. The hero is deliberately unchanged. */
  const RECEDE_OPACITY = 0.55;
  const RECEDE_BRIGHTNESS = 0.8;

  /**
   * The opening centre, read once. untrack is not decoration: reading a prop at
   * component-init scope otherwise warns that only the initial value is
   * captured - which is exactly what is wanted here, because a later change to
   * initialId must not yank the row out from under a visitor who has stepped it.
   */
  function openingCentre(): number {
    // Indexed into `row` and never through frontDoorIndex: a solo row's only
    // entry is at index 0 and may not be in FRONT_DOOR at all.
    const index =
      initialId === undefined
        ? -1
        : row.findIndex((entry) => entry.id === initialId);
    return index === -1 ? 0 : index;
  }

  // Every rune here is a scalar or a list of ids. See rule 3 above.
  let centre = $state(untrack(openingCentre));
  let radius = $state(3);
  let heroPx = $state(0);
  let ready = $state(false);
  let transitions = $state(false);
  let skipped: string[] = $state([]);
  /**
   * The connect state machine, bound so that every un-choose path can hand the
   * port back. A visitor who closes the panel must not still be holding the
   * ZONA away from Grid Editor.
   */
  let tryOn: ReturnType<typeof TryOnDevice> | undefined = $state(undefined);
  /** The region, bound so a successful copy reaches its one live region. */
  let region: ReturnType<typeof TuningRegion> | undefined = $state(undefined);

  /*
    THE KNOB INDICES LIVE IN THE ROW, NOT IN THE REGION, and that is a
    correctness rule rather than a tidiness one. The region unmounts on
    un-choose; if it owned the indices, re-choosing would show every marker at
    home while the pad went on playing the tuned state - the panel and the pad
    disagreeing about what the visitor did. Held per entry id, because the
    tuned ENGINE is held per entry id too (in `engines`, below), and the two
    have to be restored together or not at all.

    These are runes and rule 3 above is not violated: a knob index is a number.
    Nothing here holds an engine, a canvas or a frame buffer.
  */
  let knobIndices: Record<string, Record<string, number>> = $state({});
  /** The reason a disabled TRY ON DEVICE gives, or undefined when in budget. */
  let overBudgetReason: string | undefined = $state(undefined);
  /** The share payload, precomputed by the model so COPY LINK never awaits. */
  let shareStamp: string | undefined = $state(undefined);
  /** How the URL landed, and the entry it landed on. Both settled at mount. */
  let landing: Landing = $state(NO_LANDING);
  let landedId: string | undefined = $state(undefined);

  /**
   * CHOSEN LIVES IN THE HISTORY ENTRY, NOT IN A LOCAL BOOLEAN. Choosing pushes
   * a shallow history entry, so the browser Back button and Escape are
   * literally the same gesture rather than two implementations of it (D-09,
   * 04-UI-SPEC W-16). The empty first argument is exactly what
   * svelte/no-navigation-without-resolve permits for shallow navigation: no
   * lint suppression is needed here, and none may be added.
   */
  const chosen = $derived(page.state.chosen === true);

  // Plain bindings, deliberately outside the reactive graph.
  let host: SimHost | undefined;
  let stage: HTMLDivElement | undefined;
  let mounted = false;
  // A plain Map, never SvelteMap. The lint rule assumes a mutable Map is a
  // missed reactivity opportunity; here it is the opposite. SvelteMap is a
  // reactive proxy, and a proxy trap around an engine that is read on every one
  // of the 100 ticks a second is the exact cliff rule 3 above exists to avoid.
  // Neither map is ever read from the markup, so nothing needs to react to it.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const engines = new Map<string, SimEngine>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const elements = new Map<string, HTMLCanvasElement>();

  let wheelAccum = 0;
  let wheelLastAt = 0;
  let wheelBlockedUntil = 0;
  let dragPointer: number | undefined;
  let dragFromX = 0;
  let dragFromY = 0;
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  /** Which entry was centred at the moment of choosing, for STEP_AWAY_LIMIT. */
  let chosenAt = 0;
  /** True only while the current history entry is one this session pushed. */
  let pushedChosen = false;
  /** The previous chosen flag, so the Back button releases the port too. */
  let wasChosen = false;
  let tapPointer: number | undefined;
  let tapAt = 0;
  let tapFromX = 0;
  let tapFromY = 0;

  const heroId = (): string => row[centre].id;
  /** The plate and the fidelity line both speak for whatever is centred. */
  const centred = $derived(row[centre]);

  /**
   * PadCanvas hands its element over from its own onMount, which runs before
   * this component's. A canvas that arrives before the engines are built is
   * simply held until they are; one that arrives afterwards - a slot re-entering
   * the window - registers straight away, against the SAME engine object, so the
   * pad resumes where it was rather than restarting at tick 0.
   */
  function collect(id: string, canvas: HTMLCanvasElement): void {
    elements.set(id, canvas);
    adopt(id);
  }

  function adopt(id: string): void {
    const canvas = elements.get(id);
    const engine = engines.get(id);
    if (host === undefined || canvas === undefined || engine === undefined) {
      return;
    }
    host.register(id, canvas, engine);
    host.setInWindow(id, inWindow(id));
  }

  function inWindow(id: string): boolean {
    return visibleWindow(centre, radius, count).some(
      (index) => row[index].id === id,
    );
  }

  /**
   * The coverflow's half of the host's gate. An IntersectionObserver cannot see
   * it: the far pad is on screen, scaled to a third and hidden behind three
   * others, and the observer happily reports it intersecting.
   */
  function syncHost(): void {
    if (host === undefined) return;
    const open = new Set(
      visibleWindow(centre, radius, count).map((index) => row[index].id),
    );
    for (const entry of row) {
      host.setInWindow(entry.id, open.has(entry.id));
    }
    host.setHero(heroId());
  }

  /**
   * Keep the address on whatever is centred (CAT-01, D-12).
   *
   * replaceState and NEVER pushState: nine steps must not need nine Back
   * presses, so Back still leaves the page (04-UI-SPEC W-16). It is also Kit's
   * import rather than the same-named method on the `history` global, which Kit
   * monkey-patches and warns about on every arrow press in dev.
   *
   * resolve() from $app/paths is what makes this line lint-clean:
   * svelte/no-navigation-without-resolve accepts an empty string or a resolve()
   * call as the first argument to replaceState, so NO suppression is needed
   * here and none may be added. It resolves to /c/{id} without the trailing
   * slash that trailingSlash: "always" emits; the static host redirects
   * /c/aurora to /c/aurora/ on a reload, and building a concatenated string the
   * rule cannot type-check would be the worse trade.
   *
   * The current page state is carried through rather than reset to {}: stepping
   * while chosen re-fills the panel with the neighbour (W-20), and a {} here
   * would close it on the first arrow press.
   *
   * Guarded on `mounted`, because replaceState throws before the router is
   * initialised and must never run during prerender.
   */
  function syncAddress(): void {
    if (!mounted) return;
    replaceState(resolve("/c/[id]", { id: heroId() }), page.state);
  }

  function stepBy(delta: number): void {
    if (delta === 0) return;
    centre = step(centre, delta, count);
    syncHost();
    syncAddress();
    afterStep();
  }

  function goTo(index: number): void {
    if (index === centre) return;
    centre = step(index, 0, count);
    syncHost();
    syncAddress();
    afterStep();
  }

  /**
   * Stepping while chosen re-fills the panel with the new entry and leaves the
   * connect state alone - the port belongs to the session, not to the
   * configuration (W-20). Stepping PAST the chosen entry closes the panel.
   * slotOffset is reused rather than a second modulo written here, so the ring
   * distance and the slot ladder can never disagree about what one away is.
   */
  function afterStep(): void {
    if (!chosen) return;
    if (Math.abs(slotOffset(centre, chosenAt, count)) > STEP_AWAY_LIMIT) {
      unchoose();
    }
  }

  // ---------------------------------------------------------------------------
  // Choosing and un-choosing (D-05, D-09, D-11).

  function choose(): void {
    if (chosen) return;
    chosenAt = centre;
    pushedChosen = true;
    pushState("", { chosen: true });
  }

  function unchoose(): void {
    if (!chosen) return;
    void tryOn?.release();
    if (pushedChosen) {
      pushedChosen = false;
      history.back();
    } else {
      /*
        A reload while chosen restores page.state out of the history entry, so
        the flag can be true in a page session that never pushed it. Going back
        from there would leave the site rather than close a panel.
      */
      replaceState("", {});
    }
  }

  // ---------------------------------------------------------------------------
  // Stepping.

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepBy(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      stepBy(1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(count - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      // No touch is delivered here: this is the keyboard route to the same
      // place, and the site has to be fully operable with no pointer at all.
      event.preventDefault();
      choose();
    }
  }

  /**
   * Escape, from anywhere on the page - the panel takes focus from nothing, so
   * a visitor who has tabbed into it must still be able to leave with one key.
   * Registered in onMount and removed in onDestroy.
   */
  function onWindowKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Escape" || !chosen) return;
    event.preventDefault();
    unchoose();
  }

  /**
   * Horizontal wheel and trackpad swipe. deltaY is ignored entirely and never
   * prevented, so the page still scrolls to the footer, and preventDefault fires
   * only on the event that actually takes a step - a wheel handler bound to an
   * element is non-passive by default, so that call really does work.
   */
  function onWheel(event: WheelEvent): void {
    if (event.deltaX === 0) return;
    const now = performance.now();
    if (now < wheelBlockedUntil) return;
    if (now - wheelLastAt > WHEEL_IDLE_MS) wheelAccum = 0;
    wheelLastAt = now;
    wheelAccum += Math.abs(event.deltaX);
    if (wheelAccum < WHEEL_THRESHOLD_PX) return;
    wheelAccum = 0;
    wheelBlockedUntil = now + WHEEL_COOLDOWN_MS;
    event.preventDefault();
    stepBy(event.deltaX > 0 ? 1 : -1);
  }

  /** A click anywhere on a side pad steps to it; a click on slot 2 steps two. */
  function onClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const slot = target.closest("[data-offset]");
    if (slot === null) return;
    const offset = Number(slot.getAttribute("data-offset"));
    if (!Number.isFinite(offset)) return;
    if (chosen && offset !== 0) {
      // A click on the dimmed row is a way out, not a step (D-09). Stepping to
      // it as well would swap the panel's contents on the way to closing it.
      unchoose();
      return;
    }
    stepBy(offset);
  }

  /**
   * A horizontal touch drag steps one; a vertical one is left alone so the page
   * scrolls. A mouse is excluded on purpose: on the hero it is a finger, and a
   * drag across the instrument must not also move the row.
   */
  function onBandPointerDown(event: PointerEvent): void {
    if (event.pointerType === "mouse") return;
    dragPointer = event.pointerId;
    dragFromX = event.clientX;
    dragFromY = event.clientY;
  }

  function onBandPointerUp(event: PointerEvent): void {
    if (dragPointer !== event.pointerId) return;
    dragPointer = undefined;
    const dx = event.clientX - dragFromX;
    const dy = event.clientY - dragFromY;
    if (Math.abs(dx) < DRAG_STEP_PX || Math.abs(dx) <= Math.abs(dy)) return;
    stepBy(dx < 0 ? 1 : -1);
  }

  // ---------------------------------------------------------------------------
  // The hero's finger (PREV-04). This component owns the geometry and nothing
  // else: the host does the tick-locked delivery, at most one sample per contact
  // per firmware tick, which is what keeps the preview faithful rather than
  // pointer-rate dependent.

  function ledPoint(event: PointerEvent): { x: number; y: number } | undefined {
    const canvas = elements.get(heroId());
    const engine = engines.get(heroId());
    if (canvas === undefined || engine === undefined) return undefined;
    const rect = canvas.getBoundingClientRect();
    return {
      x: mapAxis(event.clientX - rect.left, rect.width, engine.coordMax),
      y: mapAxis(event.clientY - rect.top, rect.height, engine.coordMax),
    };
  }

  function onHeroDown(event: PointerEvent): void {
    // Recorded before anything can return early: the tap rule has to hold even
    // on a pad whose engine the vendored shelf could not build.
    tapPointer = event.pointerId;
    tapAt = performance.now();
    tapFromX = event.clientX;
    tapFromY = event.clientY;
    if (host === undefined) return;
    const target = event.currentTarget;
    try {
      if (target instanceof Element) target.setPointerCapture(event.pointerId);
    } catch {
      // The element can detach between the event and the capture. A pad that
      // stepped away mid-press is not an error; the contact simply ends.
    }
    const point = ledPoint(event);
    if (point === undefined) return;
    host.touchDown(event.pointerId, point.x, point.y);
  }

  function onHeroMove(event: PointerEvent): void {
    if (host === undefined) return;
    const point = ledPoint(event);
    if (point === undefined) return;
    host.touchMove(event.pointerId, point.x, point.y);
  }

  function onHeroUp(event: PointerEvent): void {
    host?.touchEnd(event.pointerId);
  }

  /**
   * The tap rule. The touch is ended first and unconditionally - the pad is an
   * instrument before it is a link - and only then is the same gesture read a
   * second time as a choose. pointercancel and lostpointercapture deliberately
   * do not come through here: a contact the browser took away is not a tap.
   */
  function onHeroPointerUp(event: PointerEvent): void {
    onHeroUp(event);
    if (tapPointer !== event.pointerId) return;
    tapPointer = undefined;
    if (performance.now() - tapAt >= TAP_MAX_MS) return;
    const dx = event.clientX - tapFromX;
    const dy = event.clientY - tapFromY;
    if (Math.hypot(dx, dy) >= TAP_MAX_PX) return;
    choose();
  }

  // ---------------------------------------------------------------------------
  // The tuning region's four reports (TUNE-02, SHARE-01).

  /**
   * THE LIVE PREVIEW, AND THE WHOLE REASON `replaceEngine` EXISTS.
   *
   * `register()` would be wrong here in a way that is invisible in a diff and
   * obvious on screen: it calls `unregister()` first, which sets
   * `canvas.width = 0` - blanking the hero for a frame - and then re-enters the
   * pad with `intersecting: false`, so it stays frozen until the
   * IntersectionObserver next fires, which on a pad the visitor is already
   * looking at is never. Wave 1 added `replaceEngine` for exactly this moment:
   * it swaps the engine in place and repaints, and the canvas, its backing
   * store and its observer registration all survive untouched.
   *
   * The tuned engine ALSO goes into the session `engines` map, which is what
   * makes stepping one away and back return to the tuned pad rather than to the
   * shelf card: `adopt()` re-registers a returning canvas against whatever
   * engine that map holds. The knob indices survive in `knobIndices` for the
   * same reason and under the same key, so the panel and the pad can never
   * disagree about what the visitor did.
   *
   * `id` is closed over from the region's own `{#key}` block rather than read
   * from `heroId()`, so an emit that arrives after a step lands on the entry it
   * describes instead of on whatever happens to be centred by then.
   */
  function applyPreview(id: string, engine: SimEngine): void {
    engines.set(id, engine);
    host?.replaceEngine(id, engine);
  }

  /** Every knob position, on every change, held against the entry's id. */
  function rememberKnobs(
    id: string,
    indices: Readonly<Record<string, number>>,
  ): void {
    knobIndices[id] = { ...indices };
  }

  /**
   * The landing belongs to the entry the URL named and to no other. Stepping
   * while chosen re-fills the panel with a neighbour, and "these knobs came
   * with the link" is false about that one.
   */
  const landingFor = $derived(centred.id === landedId ? landing : NO_LANDING);

  /**
   * The panel's reported state, cleared whenever the region reporting it goes
   * away. Neither report is emitted on mount - a budget reason arrives only
   * when a measurement crosses 908, and a Lua entry never emits one at all - so
   * a reason left behind by another entry, or by the last time the panel was
   * open, would disable TRY ON DEVICE for a configuration comfortably inside
   * the budget. `reportedFor` is a plain local: nothing renders from it.
   */
  let reportedFor: string | undefined;
  $effect(() => {
    const id = chosen ? centred.id : undefined;
    if (id === reportedFor) return;
    reportedFor = id;
    overBudgetReason = undefined;
    shareStamp = undefined;
  });

  /** The recede, applied to the slot wrapper and never to a pad canvas. */
  const dimOpacity = (value: number, hero: boolean): number =>
    chosen && !hero ? value * RECEDE_OPACITY : value;
  const dimBrightness = (value: number, hero: boolean): number =>
    chosen && !hero ? value * RECEDE_BRIGHTNESS : value;

  // ---------------------------------------------------------------------------
  // Viewport.

  function measure(): boolean {
    const nextRadius = radiusForWidth(window.innerWidth);
    const nextHero =
      stage === undefined ? heroPx : stage.getBoundingClientRect().height;
    if (nextRadius === radius && nextHero === heroPx) return false;
    radius = nextRadius;
    heroPx = nextHero;
    return true;
  }

  /**
   * Debounced, and it does nothing at all when neither number moved:
   * re-registering canvases per resize event reallocates a backing store per
   * event and is its own jank source.
   */
  function onResize(): void {
    if (resizeTimer !== undefined) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = undefined;
      if (measure()) syncHost();
    }, RESIZE_DEBOUNCE_MS);
  }

  onMount(() => {
    mounted = true;
    measure();
    // The first layout lands with transitions off, so the row does not animate
    // out of the prerendered stack on arrival. They come on one frame later.
    requestAnimationFrame(() => {
      transitions = true;
    });
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onWindowKeyDown);
    host = new SimHost();

    void (async () => {
      const [{ createEngine }, { byId }] = await Promise.all([
        import("$lib/sim/engine"),
        import("$lib/catalog"),
      ]);
      if (!mounted) return;
      const missing: string[] = [];
      for (const entry of row) {
        // The catalog grows underneath this phase. An entry no engine can be
        // built for - an id the catalog does not know, a preset the vendored
        // shelf does not know, a preview kind with no engine behind it - renders
        // as a frame and a dot field with no canvas, which is the broken-entry
        // state the contract specifies, rather than blanking the row.
        const configuration = byId(entry.id);
        try {
          if (configuration === undefined) {
            throw new Error(`no catalog entry with id "${entry.id}"`);
          }
          engines.set(entry.id, await createEngine(configuration));
        } catch (error) {
          missing.push(entry.id);
          console.warn(
            `Coverflow: no simulator engine for "${entry.id}"; its pad renders unlit.`,
            error,
          );
        }
      }
      if (!mounted) return;
      skipped = missing;
      for (const entry of row) adopt(entry.id);
      syncHost();
      ready = true;
      await land();
    })();
  });

  /**
   * THE STAMP LANDING (SHARE-01, SHARE-03, D-13).
   *
   * AFTER THE ENTRY IS CENTRED, NEVER BEFORE, and that ordering is the whole of
   * D-13: `initialId` is read once at component init while the hash is read
   * once at mount, so doing this any earlier would apply a stamp to whatever
   * happened to be at index 0. It runs at the end of the same onMount block
   * that built the engines, after `adopt()` and `syncHost()`.
   *
   * The stamp module arrives through `await import` for the reason the header
   * gives: `$lib/share/stamp` reaches the vendored compiler through the knob
   * descriptor tables, and this file may not put that on the front door's
   * critical path.
   *
   * NEVER A PARTIAL RESTORE. `restored` sets every index; `older` and
   * `unreadable` leave every knob at its default and say so through the notice.
   * A stamp that half-applied would be the "subtly wrong configuration"
   * SHARE-03 exists to forbid.
   */
  async function land(): Promise<void> {
    // Both dynamic, and both already resolved: the catalog module was imported a
    // few lines above and module records are cached, so this costs a microtask.
    const [{ byId }, { parseHash, decodeFor }] = await Promise.all([
      import("$lib/catalog"),
      import("$lib/share/stamp"),
    ]);
    if (!mounted) return;
    const id = heroId();
    const entry = byId(id);
    if (entry === undefined) return;
    const result = decodeFor(entry, parseHash(page.url.hash));
    if (result.kind === "none") return;
    if (result.kind === "restored") knobIndices[id] = result.indices;
    landedId = id;
    landing = result;
    /*
      A STAMPED LINK AUTO-CHOOSES; A BARE /c/<id> STILL LANDS UN-CHOSEN, exactly
      as Phase 4 ships it. X-18: the whole content of a tuned link is what
      somebody moved, and the knobs are the only evidence of it - landing one on
      a closed panel would show the tuning and hide the tuner. The two landings
      that could not read the stamp open the panel too, because the sentence
      explaining why lives inside it.

      replaceState and NEVER pushState: a shared link must not need a Back press
      to leave. The empty-string first argument is the shallow-navigation form
      svelte/no-navigation-without-resolve permits - the same form choose()
      already uses - so no suppression is needed here and none may be added. The
      current URL is kept, hash and all, so a reload lands the same way.

      chosenAt is set for STEP_AWAY_LIMIT, and `pushedChosen` is deliberately
      left false: this session replaced rather than pushed, and unchoose()
      already handles that case by replacing rather than going back.
    */
    chosenAt = centre;
    replaceState("", { chosen: true });
  }

  onDestroy(() => {
    if (!mounted) return;
    mounted = false;
    window.removeEventListener("resize", onResize);
    window.removeEventListener("keydown", onWindowKeyDown);
    if (resizeTimer !== undefined) clearTimeout(resizeTimer);
    host?.destroy();
    host = undefined;
    engines.clear();
    elements.clear();
  });

  $effect(() => {
    // One report, once the engines have been tried. Reading `ready` is what
    // sequences it after the dynamic import.
    if (ready) onskipped?.(skipped);
  });

  /*
    The Back button un-chooses without going through unchoose(), so on the one
    path nothing in this file initiates the port would otherwise stay open.
    $effect.pre runs BEFORE the DOM update, which is the only moment the bound
    component still exists to be asked. release() is idempotent, so the paths
    that already called it lose nothing by being seen here again.
  */
  $effect.pre(() => {
    const now = chosen;
    if (wasChosen && !now) void tryOn?.release();
    wasChosen = now;
  });
</script>

<div
  class="band"
  class:chosen
  data-testid="coverflow"
  data-ready={ready}
  role="listbox"
  aria-label="ZONA configurations"
  aria-orientation="horizontal"
  aria-activedescendant="slot-{heroId()}"
  tabindex="0"
  onkeydown={onKeyDown}
  onwheel={onWheel}
  onclick={onClick}
  onpointerdown={onBandPointerDown}
  onpointerup={onBandPointerUp}
>
  <div class="stage" class:measured={transitions} bind:this={stage}>
    {#each row as entry, index (entry.id)}
      {@const slot = slotFor(slotOffset(index, centre, count), heroPx)}
      {#if slot.mounted && Math.abs(slot.offset) <= radius}
        <!--
          The listbox keeps focus and names the centred option through
          aria-activedescendant, which is the pattern 04-UI-SPEC approved. Giving
          each option a tabindex to satisfy the rule would make a click on a side
          pad move focus off the band, so the next arrow key would go nowhere.
        -->
        <!-- svelte-ignore a11y_interactive_supports_focus -->
        <div
          class="slot"
          class:hero={slot.hero}
          id="slot-{entry.id}"
          role="option"
          aria-selected={slot.hero}
          data-offset={slot.offset}
          style="transform: translate3d({slot.translateX}px, 0, {slot.translateZ}px) rotateY({slot.rotateY}deg) scale({slot.scale}); opacity: {dimOpacity(
            slot.opacity,
            slot.hero,
          )}; filter: brightness({dimBrightness(
            slot.brightness,
            slot.hero,
          )}); z-index: {slot.zIndex};"
          onpointerdown={slot.hero ? onHeroDown : undefined}
          onpointermove={slot.hero ? onHeroMove : undefined}
          onpointerup={slot.hero ? onHeroPointerUp : undefined}
          onpointercancel={slot.hero ? onHeroUp : undefined}
          onlostpointercapture={slot.hero ? onHeroUp : undefined}
        >
          <PadFrame {entry} hero={slot.hero}>
            {#if !skipped.includes(entry.id)}
              <PadCanvas {entry} hero={slot.hero} onready={collect} />
            {/if}
          </PadFrame>
          <!--
            The display transform, applied HERE and at no other render site on
            this page. Radar's sentence is vendored copy that may never be
            edited (05.1-UI-SPEC, Data corrections), so the spoken description
            gets a typographic apostrophe while front-door.ts and the route's
            meta and og:description tags stay byte-equal to their source.
          -->
          <span class="sr-only">{typographic(entry.description)}</span>
        </div>
      {/if}
    {/each}
  </div>
</div>

<div class="plate">
  <NamePlate
    entry={centred}
    unavailable={skipped.includes(centred.id)}
    arrows={count > 1}
    onprev={() => stepBy(-1)}
    onnext={() => stepBy(1)}
    onchoose={choose}
  />
</div>

<div class="fidelity"><FidelityLine entry={centred} {notice} /></div>

<!--
  Region 4 of the panel. The `{#key}` is load-bearing: TuningRegion builds its
  tuner once, in its own onMount, so a changed `entryId` prop would leave it
  tuning the entry the visitor has just stepped away from. Keying it on the
  centred id rebuilds it for the neighbour instead, with that entry's own knob
  positions out of `knobIndices` - which is W-20's "the panel re-fills" for the
  tuning half, and which the connect state deliberately does NOT do.

  `{@const}` captures the id for the two reports that are about a specific
  entry, so a late emit cannot be filed under the wrong one.
-->
{#snippet tuning()}
  {#key centred.id}
    {@const id = centred.id}
    <TuningRegion
      bind:this={region}
      entryId={id}
      name={centred.name}
      knobs={knobIndices[id]}
      landing={landingFor}
      onknobs={(indices) => rememberKnobs(id, indices)}
      onpreview={(engine) => applyPreview(id, engine)}
      onstamp={(stamp) => (shareStamp = stamp)}
      onbudget={(reason) => (overBudgetReason = reason)}
    />
  {/key}
{/snippet}

<!--
  COPY LINK NEVER NAVIGATES. The URL is composed here, on every stamp, and
  arrives at the control as a finished string - so its click handler holds
  nothing up in front of navigator.clipboard.writeText and Safari's transient
  activation window is never crossed by an await. Phase 5 does not write the
  hash at all; see $lib/share/url's header for the consequence.
-->
{#snippet share()}
  <CopyLink
    url={shareUrl(centred.id, shareStamp)}
    oncopied={() => region?.announceCopied()}
  />
{/snippet}

{#if chosen}
  <div class="panel">
    <ChosenPanel entry={centred} {tuning} {share}>
      <TryOnDevice
        entry={centred}
        budgetReason={overBudgetReason}
        bind:this={tryOn}
      />
    </ChosenPanel>
  </div>
{/if}

<style>
  /*
    The outer wrapper. It clips and it masks, so it must NOT carry preserve-3d:
    both are grouping properties and would flatten the ladder inside it. clip
    rather than hidden, because hidden also makes the element a scroll container.
  */
  .band {
    --pad-hero: clamp(260px, 52vmin, 560px);
    position: relative;
    inline-size: min(100vw, 1280px);
    /*
      100vw counts the scrollbar and the container does not, so on a page tall
      enough to scroll - which this one is, the footer is below the fold - the
      band would be about fifteen pixels wider than the space it sits in and
      would push a horizontal scrollbar onto the front door. margin-inline is
      over-constrained at that width and resolves to zero, so the overflow is
      not even symmetric.
    */
    max-inline-size: 100%;
    margin-inline: auto;
    overflow: clip;
    overflow-clip-margin: 6px;
    mask-image: linear-gradient(
      to right,
      transparent 0%,
      #000000 14%,
      #000000 86%,
      transparent 100%
    );
    transition: transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  /*
    The row recedes while a pad is chosen: the whole band lifts 24px and the
    side slots dim. The hero itself is untouched - it stays the largest thing
    on the screen, which is the point of choosing it.
  */
  .band.chosen {
    transform: translateY(-24px);
  }

  /* The 3D context, and the only element that carries it. */
  .stage {
    position: relative;
    block-size: var(--pad-hero);
    perspective: 1400px;
    perspective-origin: 50% 42%;
    transform-style: preserve-3d;
  }

  .slot {
    position: absolute;
    top: 0;
    left: calc(50% - var(--pad-hero) / 2);
    inline-size: var(--pad-hero);
    block-size: var(--pad-hero);
    cursor: pointer;
    /* A vertical drag still scrolls the page; a horizontal one is ours. */
    touch-action: pan-y;
  }

  .slot.hero {
    cursor: crosshair;
  }

  /*
    The transition is on the property rather than driven from JavaScript, so a
    rapid second step re-targets from the current computed value instead of
    restarting from the old one.
  */
  .stage.measured .slot {
    transition:
      transform 420ms cubic-bezier(0.22, 0.61, 0.36, 1),
      opacity 420ms cubic-bezier(0.22, 0.61, 0.36, 1),
      filter 420ms cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  /* 32px below the hero pad's bottom edge, which is the stage's. */
  .plate {
    margin-block-start: 32px;
  }

  .fidelity {
    margin-block-start: 16px;
    padding-inline: 32px;
  }

  .panel {
    margin-block-start: 16px;
    padding-inline: 32px;
  }

  @media (prefers-reduced-motion: reduce) {
    .stage.measured .slot {
      transition: none;
    }

    /* The recede stays; only the movement goes. */
    .band {
      transition: none;
    }

    .band.chosen {
      transform: none;
    }
  }
</style>
