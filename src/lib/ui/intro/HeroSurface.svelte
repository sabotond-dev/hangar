<!--
  The intro's live surface (plan 13-07; PDF page 1, right column; 13-CONTEXT.md
  D-09, D-14 Q2; PREV-04, half-reached here).

  ONE PAD, THE SAME WAY EVERY OTHER PAD IS RUN. The simulator host is HANGAR's
  own SimHost (src/lib/sim/host.ts): one shared requestAnimationFrame, one
  IntersectionObserver with { threshold: 0, rootMargin: "200px" } so the pad
  wakes before it crosses the viewport edge, the reduced-motion carve-out that
  stills it at its representative frame and lets a finger move it anyway, and
  the ambient-motion preference folded in through motionDeps() (13-04). Nothing
  here is a picture and nothing here is a loop: the engine is the catalog
  entry's own, built by createEngine, and the frame the canvas shows is what
  the firmware would light.

  THE ENGINE ARRIVES THROUGH A DYNAMIC IMPORT INSIDE onMount, never a static
  one, for the reason Coverflow.svelte gives: src/vendor/botor/_pad.ts imports
  @intechstudio/grid-protocol at module scope, a 131 KB chunk, and this page's
  whole job is to paint at once. The hero is a "padsim" entry by construction
  (front-door.spec.ts requires it of every FRONT_DOOR member), so the Lua VM's
  WebAssembly is never fetched on / either - e2e/tuning.e2e.ts asserts it.

  IT IS INTERACTIVE, AND THAT IS PREV-04's FIRST HALF. The wrapper owns the
  geometry - a pointer position mapped onto the engine's own coordinate range
  through mapAxis - and the host owns the delivery, at most one sample per
  contact per firmware tick, which is what keeps the preview faithful rather
  than pointer-rate dependent. The keyboard has no gesture equivalent, and the
  surface is a demonstration rather than a control: a visitor without a
  pointer still sees the configuration running, which is what the panel
  promises. 13-09 builds the workspace's Configure / Play switch and 13-16 the
  Sandbox's; 13-20 decides whether the three together close PREV-04. Nothing is
  ticked here.

  THE DOT FIELD STAYS. PadFrame.svelte draws one dot per unlit cell on a wash
  and the gutter grid over the canvas; 13-04 kept it because it is the pad's
  unlit-cell mark (aesthetic.spec.ts scan 8 asserts it), not a texture, and
  the PDF's matrix shows its unlit cells as dark cells with a visible pitch,
  which is exactly what those two layers give. The Bible's section 3 declines
  texture on the intro and this component adds none: the panel is solid, the
  chip is solid, and the only light is the light output's own bloom on the
  frame.

  THE SQUARE IS BOUNDED BY ITS ROW (plan 13.1-01; 13.1-CONTEXT.md D-01). The
  panel is a grid of three rows - the label row, the stage, the caption row
  - stretched to the height the intro's columns row gives it, and the stage
  is a size container: the square is min(100cqw, 100cqh) of the stage, so it
  is the smaller of the column's width and whatever height the two text
  rows leave, centred in the stage either way. No arithmetic on the panel's
  padding or gaps is written anywhere, because the stage's own box already
  excludes them. The panel's padding and gaps scale with the intro's unit
  (--intro-unit, Intro.svelte; 1px outside it). Below 1024 the stage is no
  container and the square is the column's width, as 13-07 built it.

  THE STRINGS ARE THE PDF's, VERBATIM: `TRY THE SURFACE`, `BROWSER PREVIEW`,
  the name-slash-term caption (`ARC / MODULATION` on the PDF; the hero's own
  name and FOR term here) and "Drag across the surface to preview". The one
  string HANGAR wrote is the accessible description, ledgered in card.ts.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import type { FrontDoorEntry } from "$lib/catalog/front-door";
  import { listingById } from "$lib/catalog/listing";
  import type { SimEngine } from "$lib/sim/engine";
  import { SimHost } from "$lib/sim/host";
  import { motionDeps } from "$lib/sim/motion.svelte";
  import { mapAxis } from "$lib/sim/touch";
  import PadCanvas from "../PadCanvas.svelte";
  import PadFrame from "../PadFrame.svelte";

  let {
    entry,
    description,
  }: {
    /** The hero, derived by src/lib/catalog/front-door.ts. */
    entry: FrontDoorEntry;
    /** The accessible description, card.ts's heroDescription. */
    description: string;
  } = $props();

  /** The PDF's caption is the name, a slash, and the category. HANGAR's category is the FOR term. */
  const term = $derived(listingById(entry.id)?.tags[0] ?? "");

  // Plain lets, never runes: nothing that holds a canvas or an engine belongs
  // in reactive state (04-RESEARCH, Pitfall 3).
  let host: SimHost | undefined;
  let engine: SimEngine | undefined;
  let canvas: HTMLCanvasElement | undefined;
  let mounted = false;

  /** PadCanvas hands its element over from its own onMount, which runs first. */
  function collect(_id: string, el: HTMLCanvasElement): void {
    canvas = el;
    adopt();
  }

  /** Register once the host, the engine and the canvas all exist. */
  function adopt(): void {
    if (host === undefined || engine === undefined || canvas === undefined) {
      return;
    }
    host.register(entry.id, canvas, engine);
    host.setHero(entry.id);
  }

  onMount(() => {
    mounted = true;
    host = new SimHost(motionDeps());
    void (async () => {
      const [{ createEngine }, { byId }] = await Promise.all([
        import("$lib/sim/engine"),
        import("$lib/catalog"),
      ]);
      if (!mounted) return;
      const configuration = byId(entry.id);
      try {
        if (configuration === undefined) {
          throw new Error(`no catalog entry with id "${entry.id}"`);
        }
        engine = await createEngine(configuration);
      } catch (error) {
        // The frame and the dot field stay; the canvas stays unlit. The same
        // broken-entry state the coverflow renders, never a blank panel.
        console.warn(
          `HeroSurface: no simulator engine for "${entry.id}"; the pad renders unlit.`,
          error,
        );
        return;
      }
      if (!mounted) return;
      adopt();
    })();
    return () => {
      mounted = false;
      host?.destroy();
      host = undefined;
    };
  });

  // ---------------------------------------------------------------------------
  // The finger (PREV-04, first half). Geometry here, delivery in the host.

  function ledPoint(event: PointerEvent): { x: number; y: number } | undefined {
    if (canvas === undefined || engine === undefined) return undefined;
    const rect = canvas.getBoundingClientRect();
    return {
      x: mapAxis(event.clientX - rect.left, rect.width, engine.coordMax),
      y: mapAxis(event.clientY - rect.top, rect.height, engine.coordMax, "y"),
    };
  }

  function onDown(event: PointerEvent): void {
    if (host === undefined) return;
    const target = event.currentTarget;
    try {
      if (target instanceof Element) target.setPointerCapture(event.pointerId);
    } catch {
      // The element can detach between the event and the capture; the
      // contact simply ends.
    }
    const point = ledPoint(event);
    if (point === undefined) return;
    host.touchDown(event.pointerId, point.x, point.y);
  }

  function onMove(event: PointerEvent): void {
    if (host === undefined) return;
    const point = ledPoint(event);
    if (point === undefined) return;
    host.touchMove(event.pointerId, point.x, point.y);
  }

  function onUp(event: PointerEvent): void {
    host?.touchEnd(event.pointerId);
  }
</script>

<section
  class="hero"
  data-testid="intro-hero"
  aria-labelledby="intro-hero-label"
>
  <div class="top">
    <span id="intro-hero-label" class="label type-micro">TRY THE SURFACE</span>
    <span class="chip type-micro">BROWSER PREVIEW</span>
  </div>

  <!--
    The pointer target is the wrapper, not the canvas: the canvas is a picture
    (role="img", named by PadCanvas.svelte) and the wrapper is where a finger
    lands. There is no keyboard gesture for a pad - see the header - so the
    static-element rule is suppressed here rather than satisfied with a role
    that would promise a control this surface is not.
  -->
  <div class="stage">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="surface"
      data-testid="intro-surface"
      aria-describedby="intro-hero-description"
      onpointerdown={onDown}
      onpointermove={onMove}
      onpointerup={onUp}
      onpointercancel={onUp}
      onlostpointercapture={onUp}
    >
      <PadFrame {entry} hero>
        <PadCanvas {entry} hero onready={collect} />
      </PadFrame>
    </div>
  </div>
  <p id="intro-hero-description" class="description">{description}</p>

  <div class="bottom">
    <span class="caption type-micro" data-testid="intro-hero-caption"
      >{entry.name.toUpperCase()} / {term.toUpperCase()}</span
    >
    <span class="hint type-helper">Drag across the surface to preview</span>
  </div>
</section>

<style>
  /*
    The panel: solid, bounded, square-cornered (D-01). PDF: x 806-1425, y
    133-802 at 1500. Three rows, the middle one the stage, the whole panel
    stretched to its grid row (13.1-01); the padding and gaps scale with the
    intro's unit.
  */
  .hero {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    row-gap: calc(24 * var(--intro-unit, 1px));
    box-sizing: border-box;
    min-block-size: 0;
    padding: calc(28 * var(--intro-unit, 1px));
    background: var(--color-panel);
    border: 1px solid var(--color-divider);
  }

  .top,
  .bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .label,
  .caption {
    color: var(--color-ink-quiet);
  }

  /* The filled chip: a rectangle, never a pill (D-10). */
  .chip {
    padding: 5px 10px;
    background: var(--color-action);
    color: var(--color-on-action);
  }

  /*
    The stage is the square's room and its own size container; the square
    is the smaller of the stage's two sides (13.1-01). PDF: 511 inside 619,
    which is what the width side gives at the PDF's height.
  */
  .stage {
    container-type: size;
    display: grid;
    place-content: center;
    min-block-size: 0;
  }

  .surface {
    inline-size: min(100cqw, 100cqh);
    aspect-ratio: 1;
    touch-action: none;
  }

  /* Below the compact band the columns stack: no container, the column's width (13-07). */
  @media (max-width: 1023.98px) {
    .hero {
      grid-template-rows: auto auto auto;
    }

    .stage {
      container-type: normal;
    }

    .surface {
      inline-size: 100%;
    }
  }

  /* Read by assistive technology, drawn by nothing: the caption pair below is the visible text. */
  .description {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .hint {
    color: var(--color-ink-quiet);
    text-align: end;
  }
</style>
