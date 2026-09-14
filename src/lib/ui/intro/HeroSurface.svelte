<!--
  The intro's live surface, PDF page 1's right column: one pad run the way every
  pad is - SimHost's one frame loop and observer, the reduced-motion carve-out,
  the ambient-motion preference through motionDeps(). Props: entry (the hero,
  a padsim entry by construction, so no Lua VM is fetched on /), description
  (card.ts's heroDescription). The engine arrives through a dynamic import inside
  onMount, never static (the protocol chunk stays off the first paint). It is
  interactive (PREV-04's first half): the wrapper owns the geometry through
  mapAxis, the host the delivery at one sample per contact per tick; no keyboard
  gesture. The square is min(100cqw, 100cqh) of the stage, bounded by its row (13.1-01).
  Decided at 13-07 / 13.1-01 (13-CONTEXT D-09, D-14 Q2); see .planning/phases/13-gui-overhaul/13-07-SUMMARY.md

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

  // Plain lets, never runes: nothing holding a canvas or an engine belongs in reactive state (04-RESEARCH Pitfall 3).
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
        // The frame and the dot field stay, the canvas unlit: the broken-entry state, never a blank panel.
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
      // The element can detach between the event and the capture; the contact simply ends.
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

  <!-- The pointer target is the wrapper, not the canvas (a picture); no keyboard gesture exists for a pad, so the static-element rule is suppressed rather than a control promised. -->
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
  /* The panel: solid, bounded, square (D-01); three rows, the middle one the stage, stretched to its grid row (13.1-01); padding and gaps on the intro's unit. */
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

  /* The stage is the square's room and its own size container; the square is the smaller of its two sides (13.1-01). */
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
