<!--
  The row: one component owns every pad on the front door.

  Eight entries are rendered in stable catalog order and are NEVER reordered.
  Stepping changes one number - `centre` - and every slot's transform is derived
  from slotFor(slotOffset(index, centre, count), heroPx). A keyed each that
  reordered would move DOM nodes and make the layout engine do the work the
  compositor is meant to do.

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
  fill in when it does (04-CONTEXT D-21).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy, onMount, untrack } from "svelte";
  import { pushState, replaceState } from "$app/navigation";
  import { page } from "$app/state";
  import { FRONT_DOOR, frontDoorIndex } from "$lib/catalog/front-door";
  import {
    radiusForWidth,
    slotFor,
    slotOffset,
    step,
    visibleWindow,
  } from "$lib/coverflow/slots";
  import { SimHost, type HostEngine } from "$lib/sim/host";
  import { mapAxis } from "$lib/sim/touch";
  import ChosenPanel from "./ChosenPanel.svelte";
  import FidelityLine from "./FidelityLine.svelte";
  import NamePlate from "./NamePlate.svelte";
  import PadCanvas from "./PadCanvas.svelte";
  import PadFrame from "./PadFrame.svelte";
  import TryOnDevice from "./TryOnDevice.svelte";

  let {
    initialId,
    onskipped,
  }: {
    /** Centre this entry on arrival. An unknown id opens on the row's first. */
    initialId?: string;
    /**
     * The ids the vendored shelf could not build an engine for. Reported once,
     * after mount, so plan 04-07's name plate can render "{name} - unavailable"
     * without reaching into this component.
     */
    onskipped?: (ids: readonly string[]) => void;
  } = $props();

  const COUNT = FRONT_DOOR.length;
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
    const index = initialId === undefined ? -1 : frontDoorIndex(initialId);
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
  const engines = new Map<string, HostEngine>();
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

  const heroId = (): string => FRONT_DOOR[centre].id;
  /** The plate and the fidelity line both speak for whatever is centred. */
  const centred = $derived(FRONT_DOOR[centre]);

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
    return visibleWindow(centre, radius, COUNT).some(
      (index) => FRONT_DOOR[index].id === id,
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
      visibleWindow(centre, radius, COUNT).map((index) => FRONT_DOOR[index].id),
    );
    for (const entry of FRONT_DOOR) {
      host.setInWindow(entry.id, open.has(entry.id));
    }
    host.setHero(heroId());
  }

  function stepBy(delta: number): void {
    if (delta === 0) return;
    centre = step(centre, delta, COUNT);
    syncHost();
    afterStep();
  }

  function goTo(index: number): void {
    if (index === centre) return;
    centre = step(index, 0, COUNT);
    syncHost();
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
    if (Math.abs(slotOffset(centre, chosenAt, COUNT)) > STEP_AWAY_LIMIT) {
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
      goTo(COUNT - 1);
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
      const [{ PadSim }, { presetById }] = await Promise.all([
        import("../../vendor/botor/pad-sim"),
        import("../../vendor/botor/_pad"),
      ]);
      if (!mounted) return;
      const missing: string[] = [];
      for (const entry of FRONT_DOOR) {
        const preset = presetById(entry.id);
        if (preset === undefined) {
          // The catalog grows underneath this phase. An entry the vendored
          // shelf does not know renders as a frame and a dot field with no
          // canvas - the broken-entry state the contract specifies - rather
          // than blanking the row.
          missing.push(entry.id);
          console.warn(
            `Coverflow: no simulator engine for "${entry.id}"; its pad renders unlit.`,
          );
          continue;
        }
        engines.set(entry.id, new PadSim(preset.state));
      }
      skipped = missing;
      for (const entry of FRONT_DOOR) adopt(entry.id);
      syncHost();
      ready = true;
    })();
  });

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
    {#each FRONT_DOOR as entry, index (entry.id)}
      {@const slot = slotFor(slotOffset(index, centre, COUNT), heroPx)}
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
          <span class="sr-only">{entry.description}</span>
        </div>
      {/if}
    {/each}
  </div>
</div>

<div class="plate">
  <NamePlate
    entry={centred}
    unavailable={skipped.includes(centred.id)}
    onprev={() => stepBy(-1)}
    onnext={() => stepBy(1)}
    onchoose={choose}
  />
</div>

<div class="fidelity"><FidelityLine entry={centred} /></div>

{#if chosen}
  <div class="panel">
    <ChosenPanel entry={centred}>
      <TryOnDevice entry={centred} bind:this={tryOn} />
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
