<!--
  Screen 1: the opening (D-06, IDENT-01, IDENT-02).

  A black ground, the seeded glyph field on one canvas, four lime rectangles
  punched through it, a halftone grain, and the wide-tracked HANGAR wordmark on
  a black plate. It holds for a beat and then dissolves, and the coverflow it
  dissolves into has been mounted and ticking underneath since t = 0 (W-10).
  That is the whole reason this screen exists: the brief asks for "you arrive
  and the machines are already running", which is only true if they have been
  running - and the splash is what covers the simulator's 131 KB dynamic import
  while they start.

  THE WORDMARK IS NOT A HEADING. It is a span. The front door has exactly one
  level-1 heading - the header wordmark this mark flies into - and
  e2e/smoke.e2e.ts asserts it through Playwright's strict getByRole, which fails on two
  matches rather than picking one. Writing the tag out in full here would also
  trip the plan's own heading count, which scans the raw source.

  data-phase IS NOT DECORATION. It is `in`, `hold`, `dissolve` or `done`, and it
  is what lets a browser test assert the skip rule without a stopwatch. A
  stopwatch assertion on a 1.84 second sequence is a flake generator on a busy
  machine; reading an attribute is not.

  THE DISSOLVE NEVER TOUCHES THE COVERFLOW. It is this layer's own opacity and
  scale. A mask-image over the row would flatten the 3D ladder into a line of
  equal squares, because a mask is a grouping property (04-RESEARCH, Pitfall 5).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { prefersReducedMotion } from "svelte/motion";
  import { buildField, GLYPH_SIZE } from "./glyph-field";

  let {
    ondissolve,
    onfinished,
  }: {
    /**
     * Fired the instant the dissolve starts, which is NOT a fixed point in
     * time: any key, click or wheel cuts to it early. The front door needs it
     * because its header wordmark has to come up to full strength over the
     * same 700 ms the mark is flying, and a callback that only fired at the
     * end would make the header pop in after the flight had already landed.
     */
    ondissolve?: () => void;
    /** Fired when the layer has removed itself and the row is uncovered. */
    onfinished?: () => void;
  } = $props();

  type Phase = "in" | "hold" | "dissolve" | "done";

  /** 240 + 900 + 700 = 1840ms (04-UI-SPEC, Screen 1). */
  const IN_MS = 240;
  const HOLD_MS = 900;
  const OUT_MS = 700;
  /** 0 + 400 + 200 = 600ms under prefers-reduced-motion: reduce. */
  const REDUCED_IN_MS = 0;
  const REDUCED_HOLD_MS = 400;
  const REDUCED_OUT_MS = 200;

  /**
   * Painted, not tokenised. The canvas cannot read a CSS custom property, and
   * these are the two colours the ladder in src/app.css is built from.
   */
  const ACCENT = "#d6ff4e";
  const GROUND = "#000000";
  /** Display 28px shrinking to the header's Micro 12px. */
  const MARK_PX = 28;
  const HEADER_PX = 12;
  /** Where the mark lands if the header wordmark is not on the page. */
  const GUTTER_PX = 32;
  /** A retina field is worth the pixels; beyond 2x it is only memory. */
  const MAX_DPR = 2;
  /** The header wordmark the mark flies into. */
  const HEADER_SELECTOR = '[data-testid="header-wordmark"]';

  let phase: Phase = $state("in");
  let entered = $state(false);
  /** The flight, as an inline transform. Empty under reduced motion. */
  let flight = $state("");

  /*
    The three bound elements. $state rather than a plain let, which is what
    svelte-check asks for on a bind:this inside an {#if} - and it is free here:
    $state deep-proxies plain objects and arrays only, and a DOM node is
    neither, so nothing is wrapped. The standing rule that keeps runes away
    from canvases is about the 100 Hz pad loop in Coverflow.svelte, where a
    proxy trap would sit inside every tick; this canvas is painted once and
    never read again.
  */
  let canvasEl: HTMLCanvasElement | undefined = $state();
  let plateEl: HTMLElement | undefined = $state();
  let markEl: HTMLElement | undefined = $state();
  /** Two handles: one re-armed across `in` and `hold`, one for the dissolve. */
  let timer: ReturnType<typeof setTimeout> | undefined;
  let exitTimer: ReturnType<typeof setTimeout> | undefined;
  /**
   * onDestroy runs on the SERVER too, straight after the markup is rendered,
   * and there is no window there. Coverflow.svelte guards its teardown the same
   * way. Without this the prerender of / dies with `window is not defined`.
   */
  let mounted = false;

  /**
   * Live, not a one-shot read: svelte/motion's prefersReducedMotion is a
   * MediaQuery with a change subscription, so an operating-system toggle
   * mid-session takes effect without a remount (IDENT-02). The CSS half of the
   * same preference is a plain @media block below.
   */
  const inMs = () => (prefersReducedMotion.current ? REDUCED_IN_MS : IN_MS);
  const holdMs = () =>
    prefersReducedMotion.current ? REDUCED_HOLD_MS : HOLD_MS;
  const outMs = () => (prefersReducedMotion.current ? REDUCED_OUT_MS : OUT_MS);

  /**
   * One paint, on mount, and never again - the field does not animate, and the
   * whole screen is gone inside two seconds, so a resize handler would cost a
   * listener and a reflow to redraw something nobody is looking at any more.
   */
  function paint(): void {
    const canvas = canvasEl;
    if (canvas === undefined) return;
    const ctx = canvas.getContext("2d");
    if (ctx === null) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.scale(dpr, dpr);

    const { cells, rects } = buildField(w, h);

    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, w, h);

    // The mosaic. Canvas text at 10px in the browser's default sans, which
    // 04-UI-SPEC exempts from the type scale explicitly: these are generated
    // pixels, not interface type, and nobody reads them as words.
    ctx.font = GLYPH_SIZE + "px sans-serif";
    ctx.textBaseline = "top";
    ctx.fillStyle = ACCENT;
    for (const cell of cells) {
      ctx.globalAlpha = cell.alpha;
      ctx.fillText(cell.glyph, cell.x, cell.y);
    }

    // The four punches: solid accent, then the same glyphs again in black
    // inside them, so the rectangle reads as a hole cut through the mosaic
    // rather than as a sticker laid on top of it.
    ctx.globalAlpha = 1;
    for (const rect of rects) ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = GROUND;
    for (const cell of cells) {
      for (const rect of rects) {
        if (
          cell.x >= rect.x &&
          cell.x < rect.x + rect.w &&
          cell.y >= rect.y &&
          cell.y < rect.y + rect.h
        ) {
          ctx.fillText(cell.glyph, cell.x, cell.y);
          break;
        }
      }
    }
  }

  /**
   * The flight, computed at the moment the dissolve starts rather than declared
   * in CSS, because it depends on where the header wordmark actually landed.
   * The transform scales about the plate's top-left corner, so the delta has to
   * account for the mark's own offset inside the plate shrinking with it.
   *
   * Under reduced motion this returns nothing at all and the mark crossfades
   * instead - an inline transform would otherwise beat the @media rule that
   * removes every scale.
   */
  function flightStyle(): string {
    if (prefersReducedMotion.current) return "";
    const plate = plateEl;
    const mark = markEl;
    if (plate === undefined || mark === undefined) return "";

    const plateBox = plate.getBoundingClientRect();
    const markBox = mark.getBoundingClientRect();
    const target = document
      .querySelector(HEADER_SELECTOR)
      ?.getBoundingClientRect();

    const scale = HEADER_PX / MARK_PX;
    const toX = target?.left ?? GUTTER_PX;
    const toY = target?.top ?? GUTTER_PX;
    const dx = toX - plateBox.left - scale * (markBox.left - plateBox.left);
    const dy = toY - plateBox.top - scale * (markBox.top - plateBox.top);
    return (
      "transform: translate(" + dx + "px, " + dy + "px) scale(" + scale + ");"
    );
  }

  function skip(): void {
    toDissolve();
  }

  function armSkip(): void {
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    window.addEventListener("wheel", skip, { passive: true });
  }

  function disarmSkip(): void {
    window.removeEventListener("pointerdown", skip);
    window.removeEventListener("keydown", skip);
    window.removeEventListener("wheel", skip);
  }

  /** Idempotent: a click and a keypress in the same frame must not double-arm. */
  function toDissolve(): void {
    if (phase === "dissolve" || phase === "done") return;
    disarmSkip();
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    flight = flightStyle();
    phase = "dissolve";
    ondissolve?.();
    exitTimer = setTimeout(() => {
      exitTimer = undefined;
      phase = "done";
      onfinished?.();
    }, outMs());
  }

  onMount(() => {
    mounted = true;
    paint();
    armSkip();
    // Two frames, so the browser has committed opacity 0 before it is asked for
    // opacity 1. One frame is not reliably enough for a transition to run.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        entered = true;
      });
    });
    timer = setTimeout(() => {
      phase = "hold";
      timer = setTimeout(toDissolve, holdMs());
    }, inMs());
  });

  onDestroy(() => {
    if (!mounted) return;
    mounted = false;
    disarmSkip();
    if (timer !== undefined) clearTimeout(timer);
    if (exitTimer !== undefined) clearTimeout(exitTimer);
    timer = undefined;
    exitTimer = undefined;
  });
</script>

{#if phase !== "done"}
  <div class="splash" class:entered data-testid="splash" data-phase={phase}>
    <canvas class="field" bind:this={canvasEl} aria-hidden="true"></canvas>
    <div class="grain" aria-hidden="true"></div>
    <div class="plate" bind:this={plateEl} style={flight}>
      <span class="mark" bind:this={markEl} data-testid="splash-wordmark"
        >HANGAR</span
      >
    </div>
  </div>
{/if}

<style>
  .splash {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    background: var(--color-ground);

    --in-ms: 240ms;
    --out-ms: 700ms;
    --in-ease: cubic-bezier(0.4, 0, 0.2, 1);
    --out-ease: cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  /*
    The CSS half of the motion preference. The JavaScript half is the live
    MediaQuery in the script block; both are needed, because a media query
    cannot reach a setTimeout and a rune cannot reach a transition duration.
  */
  @media (prefers-reduced-motion: reduce) {
    .splash {
      --in-ms: 0ms;
      --out-ms: 200ms;
    }
  }

  .field,
  .grain {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity var(--in-ms) var(--in-ease);
  }

  .field {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }

  /* The halftone, as one repeating gradient rather than a second canvas. */
  .grain {
    background-image: radial-gradient(
      circle,
      rgb(214 255 78 / 0.06) 0 0.5px,
      transparent 0.6px
    );
    background-size: 3px 3px;
    pointer-events: none;
  }

  .splash.entered .field,
  .splash.entered .grain {
    opacity: 1;
  }

  .splash[data-phase="dissolve"] .field,
  .splash[data-phase="dissolve"] .grain {
    opacity: 0;
    transform: scale(1.04);
    transition:
      opacity var(--out-ms) var(--out-ease),
      transform var(--out-ms) var(--out-ease);
  }

  /*
    The plate the mark sits on, so the wordmark stays legible over the mosaic.
    It is what flies: the transform is applied here and the mark rides inside
    it, and its black is invisible against the ground it lands on.
  */
  .plate {
    position: relative;
    padding: 32px;
    background: var(--color-ground);
    transform-origin: 0 0;
    transition:
      transform var(--out-ms) var(--out-ease),
      opacity var(--out-ms) var(--out-ease);
  }

  /* Display role: 28px / 600 / 0.50em / uppercase, and the only place it ships. */
  .mark {
    display: block;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: var(--color-accent);
    /* The tracking adds a trailing space; this takes it back off. */
    margin-inline-end: -0.5em;
  }

  @media (prefers-reduced-motion: reduce) {
    /* No scale on anything, and the mark crossfades instead of flying. */
    .splash[data-phase="dissolve"] .field,
    .splash[data-phase="dissolve"] .grain {
      transform: none;
    }

    .splash[data-phase="dissolve"] .plate {
      opacity: 0;
    }
  }
</style>
