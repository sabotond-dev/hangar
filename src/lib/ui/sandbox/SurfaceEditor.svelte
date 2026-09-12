<!--
  THE PLATE: PDF page 3's 571px square, the 9 x 9 lattice, the regions, the
  selection with its eight handles, the proposed bounds, the keyboard focus
  cell, and the click-to-place path (plan 13-16; Bible sections 2, 8, 14;
  BUILD-01, BUILD-06, BUILD-08, PREV-04).

  NO DRAG IS EVER REQUIRED. Every creation reaches src/lib/sandbox/editor.ts
  through ONE call, `onclick(col, row)`, fired from POINTERDOWN: a click on an
  empty cell starts an area, the next click ends it; a click after the
  palette armed a kind places that kind's default region; a click on a
  region selects it. A drag is the accelerator and nothing more: pointerup
  on a DIFFERENT cell from the one pressed fires the same `onclick` for that
  cell, so press-at-A / release-at-B is exactly click-A / click-B. Pointer
  MOVE only updates `hover`, which draws the proposed bounds (section 8:
  "show proposed bounds before committing") and is never required for
  anything - the keyboard route draws the same proposed box from the focus
  cell. The spec proves the model needs no move; e2e proves the plate
  places with clicks.

  THE KEYBOARD ROUTE (section 14's spatial model): the plate is one tab stop;
  arrows move the focus cell, Enter marks it (the same `onclick`), Escape
  cancels a pending placement, Delete deletes the selection. The focus cell
  is drawn as a square outline and named in the status line beneath the
  plate, which is role="status" so a screen reader hears what the next
  Enter will do. The element list beside the plate is the other complete
  way to select (ElementList.svelte).

  THE LATTICE IS A STATIC OVERLAY. Sixteen <line>s in one <g>, drawn once
  by the DOM and never redrawn by a frame loop - 13-RESEARCH's "path
  stroking is the expensive 2D primitive" applies to a canvas repainting 81
  strokeRects thirty times a second, and an SVG retained by the compositor
  is the static overlay it prescribes. The live picture in Play is the
  route's PadCanvas, rendered UNDER this SVG through the `preview` snippet;
  the SVG stops taking pointer events in Play and the wrapper routes the
  finger to `onfinger`.

  THE KNOB'S CIRCLE IS AN SVG <circle> - a true circle by construction, not
  a box with a radius. D-15's exemption is for `border-radius: 50%` on
  square boxes in three CSS files; a circle element is not a border-radius
  at all, so this file declares no radius above zero and needs no allowlist
  row. The eight selection handles are <rect>s, square (D-01).

  "FOLLOW HARDWARE SELECTION" (section 8's optional control) IS DELIBERATELY
  ABSENT and this is where a reader would look for it: ZONA has one touch
  element, so there is no hardware selection to follow (editor.ts section
  3). Nothing here listens to the device.

  Every number is layout.ts's (SANDBOX_PLATE, SANDBOX_PITCH, SANDBOX_HANDLE,
  SANDBOX_LABEL_SIZE); the region fill is the stored RGB444 value - the one
  fill that is not a token, A-09's carve-out, as Swatch.svelte's square.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import {
    AREA_START,
    KIND_LABELS,
    MATRIX_LINE,
    NOTHING_SELECTED,
    PLATE_NAME,
    cellLine,
    elementsLine,
    placeInstruction,
    selectedLine,
  } from "$lib/sandbox/copy";
  import {
    DEFAULT_SIZES,
    boxBetween,
    type Cell,
    type EditorState,
  } from "$lib/sandbox/editor";
  import {
    SURFACE_SIZE,
    colourByte,
    toDisplay,
    type Region,
  } from "$lib/sandbox/model";
  import {
    SANDBOX_HANDLE,
    SANDBOX_LABEL_SIZE,
    SANDBOX_PITCH,
    SANDBOX_PLATE,
  } from "$lib/ui/shell/layout";

  let {
    view,
    onclick,
    onmove,
    onmark,
    oncancel,
    ondelete,
    onfinger,
    preview,
  }: {
    view: EditorState;
    /** The one creation and selection call (editor.ts section 1). */
    onclick: (col: number, row: number) => void;
    /** Arrows: the focus cell moves by a delta. */
    onmove: (dcol: number, drow: number) => void;
    /** Enter on the plate: the same click, at the focus cell. */
    onmark: () => void;
    /** Escape: nothing pending. */
    oncancel: () => void;
    /** Delete: the selection. */
    ondelete: () => void;
    /**
     * Play: a finger on the plate, as an offset inside the plate's box and
     * the box's extent, so the route maps it to LED coordinates with
     * touch.ts's mapAxis and hands it to its host (PREV-04's third reach).
     */
    onfinger?: (
      phase: "down" | "move" | "up",
      pointerId: number,
      x: number,
      y: number,
      extent: number,
    ) => void;
    /** The live picture in Play, rendered under the SVG. */
    preview?: Snippet;
  } = $props();

  const uid = $props.id();
  const statusId = `${uid}-status`;
  const PLATE = SANDBOX_PLATE;
  const PITCH = SANDBOX_PITCH;
  const HANDLE = SANDBOX_HANDLE;

  let plate = $state<HTMLDivElement | null>(null);
  /** The cell under the pointer, for the proposed bounds only. */
  let hover = $state<Cell | undefined>(undefined);
  let focused = $state(false);
  /** The cell the pointer went down on, so a release elsewhere is the second click. */
  let downCell: Cell | undefined;

  const play = $derived(view.mode === "play");
  const regions = $derived(view.surface.regions);

  /** "rgb(221 255 119)" from RGB444 levels. */
  const fillOf = (r: Region): string =>
    `rgb(${colourByte(r.colour[0])} ${colourByte(r.colour[1])} ${colourByte(r.colour[2])})`;

  const x = (col: number) => col * PITCH;
  const y = (row: number) => row * PITCH;

  /** The box the next Enter or click would commit, from the hover cell or the focus cell. */
  const proposed = $derived.by(() => {
    if (play) return undefined;
    const at = hover ?? view.focus;
    const pending = view.placement;
    if (pending.kind === "element") {
      const size = DEFAULT_SIZES[pending.type];
      return {
        col: Math.min(at.col, SURFACE_SIZE - size.w),
        row: Math.min(at.row, SURFACE_SIZE - size.h),
        w: size.w,
        h: size.h,
      };
    }
    if (pending.kind === "area") return boxBetween(pending.start, at);
    return undefined;
  });

  /** The eight handles of the selected region: corners and edge midpoints. */
  const handles = $derived.by(() => {
    const r = view.selected;
    if (r === undefined || play) return [];
    const left = x(r.col);
    const top = y(r.row);
    const right = x(r.col + r.w);
    const bottom = y(r.row + r.h);
    const midX = (left + right) / 2;
    const midY = (top + bottom) / 2;
    return [
      [left, top],
      [midX, top],
      [right, top],
      [left, midY],
      [right, midY],
      [left, bottom],
      [midX, bottom],
      [right, bottom],
    ] as const;
  });

  /** The status line: what the next click or Enter does, and what is selected. */
  const status = $derived.by(() => {
    const pending = view.placement;
    if (pending.kind === "element") {
      return placeInstruction(KIND_LABELS[pending.type]);
    }
    if (pending.kind === "area") return AREA_START;
    const r = view.selected;
    const where = cellLine(
      toDisplay(view.focus.col),
      toDisplay(view.focus.row),
    );
    return r === undefined
      ? `${NOTHING_SELECTED} ${where}.`
      : `${selectedLine(r.name, KIND_LABELS[r.kind])} ${where}.`;
  });

  function cellOf(event: PointerEvent): Cell | undefined {
    if (plate === null) return undefined;
    const rect = plate.getBoundingClientRect();
    if (rect.width <= 0) return undefined;
    const col = Math.floor(((event.clientX - rect.left) / rect.width) * 9);
    const row = Math.floor(((event.clientY - rect.top) / rect.height) * 9);
    return {
      col: Math.min(8, Math.max(0, col)),
      row: Math.min(8, Math.max(0, row)),
    };
  }

  function fingerAt(phase: "down" | "move" | "up", event: PointerEvent): void {
    if (plate === null || onfinger === undefined) return;
    const rect = plate.getBoundingClientRect();
    onfinger(
      phase,
      event.pointerId,
      event.clientX - rect.left,
      event.clientY - rect.top,
      rect.width,
    );
  }

  function onpointerdown(event: PointerEvent): void {
    if (play) {
      try {
        (event.currentTarget as Element).setPointerCapture(event.pointerId);
      } catch {
        // The element can detach between the event and the capture.
      }
      fingerAt("down", event);
      return;
    }
    if (event.button !== 0) return;
    const at = cellOf(event);
    if (at === undefined) return;
    // WITHOUT SCROLLING (13-17): a programmatic focus scrolls a partly visible
    // plate into view, and a page that moves under a pressed pointer makes
    // the release land on another cell - which the accelerator below reads
    // as the second click of a drag, so one click placed an element AND
    // started an area. The pointer is already on the plate; nothing needs to
    // move for it. Found by 13-17's layout (the tools row grew, the plate
    // sat partly below the fold) and e2e/sandbox.e2e.ts's first title.
    plate?.focus({ preventScroll: true });
    downCell = at;
    onclick(at.col, at.row);
  }

  function onpointermove(event: PointerEvent): void {
    if (play) {
      fingerAt("move", event);
      return;
    }
    hover = cellOf(event);
  }

  function onpointerup(event: PointerEvent): void {
    if (play) {
      fingerAt("up", event);
      return;
    }
    const at = cellOf(event);
    const from = downCell;
    downCell = undefined;
    if (at === undefined || from === undefined) return;
    // The accelerator: a release on another cell is the second click.
    if (at.col !== from.col || at.row !== from.row) onclick(at.col, at.row);
  }

  function onpointerleave(): void {
    hover = undefined;
  }

  function onkeydown(event: KeyboardEvent): void {
    if (play) return;
    switch (event.key) {
      case "ArrowLeft":
        onmove(-1, 0);
        break;
      case "ArrowRight":
        onmove(1, 0);
        break;
      case "ArrowUp":
        onmove(0, -1);
        break;
      case "ArrowDown":
        onmove(0, 1);
        break;
      case "Enter":
      case " ":
        onmark();
        break;
      case "Escape":
        oncancel();
        break;
      case "Delete":
      case "Backspace":
        ondelete();
        break;
      default:
        return;
    }
    event.preventDefault();
  }
</script>

<div class="editor" data-testid="surface-editor" data-mode={view.mode}>
  <!--
    The plate is one tab stop with a spatial keyboard model of its own
    (arrows, Enter, Escape, Delete), which is what role="application" tells
    an assistive technology: pass the keys through. Its name is the PDF's
    word and its description is the status line beneath it. Svelte's
    a11y rules count `application` as non-interactive and would rather see
    a widget role; a grid of gridcells would promise 81 focusable cells this
    plate does not have (the cell is a position, not a control), so the two
    rules are suppressed here with that reason, as the workspace's surface
    suppresses the static-element rule for its finger.
  -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    bind:this={plate}
    class="plate"
    class:play
    class:focused
    role="application"
    tabindex="0"
    aria-label={PLATE_NAME}
    aria-describedby={statusId}
    data-testid="surface-plate"
    style:--plate="{PLATE}px"
    {onpointerdown}
    {onpointermove}
    {onpointerup}
    onpointercancel={onpointerup}
    {onpointerleave}
    {onkeydown}
    onfocus={() => (focused = true)}
    onblur={() => (focused = false)}
  >
    {#if preview}
      <div class="preview" data-testid="surface-preview">
        {@render preview()}
      </div>
    {/if}
    <svg
      class="overlay"
      viewBox="0 0 {PLATE} {PLATE}"
      aria-hidden="true"
      data-testid="surface-svg"
    >
      <!-- The static lattice: sixteen lines, drawn once. -->
      <g class="guides" data-testid="surface-guides">
        {#each { length: SURFACE_SIZE - 1 }, i (i)}
          <line x1={x(i + 1)} y1="0" x2={x(i + 1)} y2={PLATE} />
          <line x1="0" y1={y(i + 1)} x2={PLATE} y2={y(i + 1)} />
        {/each}
      </g>

      <!-- The regions: a tinted fill, a 1px boundary in the region's colour, the 11px uppercase name. -->
      {#each regions as r (r.id)}
        {@const fill = fillOf(r)}
        {@const selected = r.id === view.selectedId}
        <g
          class="region"
          class:selected
          data-region={r.id}
          data-kind={r.kind}
          data-testid="surface-region"
        >
          <rect
            class="body"
            x={x(r.col)}
            y={y(r.row)}
            width={r.w * PITCH}
            height={r.h * PITCH}
            style:fill
            style:stroke={fill}
          />
          {#if r.kind === "knob"}
            <!-- A true circle: an SVG circle, not a radius (D-15). -->
            <circle
              class="mark"
              cx={x(r.col) + (r.w * PITCH) / 2}
              cy={y(r.row) + (r.h * PITCH) / 2}
              r={(Math.min(r.w, r.h) * PITCH) / 2 - PITCH * 0.28}
              style:stroke={fill}
            />
            <line
              class="mark"
              x1={x(r.col) + (r.w * PITCH) / 2}
              y1={y(r.row) + (r.h * PITCH) / 2}
              x2={x(r.col) + (r.w * PITCH) / 2}
              y2={y(r.row) +
                (r.h * PITCH) / 2 -
                ((Math.min(r.w, r.h) * PITCH) / 2 - PITCH * 0.28)}
              style:stroke={fill}
            />
          {:else if r.kind === "xy"}
            <line
              class="mark"
              x1={x(r.col) + PITCH * 0.3}
              y1={y(r.row) + (r.h * PITCH) / 2}
              x2={x(r.col + r.w) - PITCH * 0.3}
              y2={y(r.row) + (r.h * PITCH) / 2}
              style:stroke={fill}
            />
            <line
              class="mark"
              x1={x(r.col) + (r.w * PITCH) / 2}
              y1={y(r.row) + PITCH * 0.3}
              x2={x(r.col) + (r.w * PITCH) / 2}
              y2={y(r.row + r.h) - PITCH * 0.3}
              style:stroke={fill}
            />
          {:else if r.kind === "fader"}
            {#if (r.orientation ?? "vertical") === "vertical"}
              <line
                class="mark"
                x1={x(r.col) + (r.w * PITCH) / 2}
                y1={y(r.row) + PITCH * 0.6}
                x2={x(r.col) + (r.w * PITCH) / 2}
                y2={y(r.row + r.h) - PITCH * 0.3}
                style:stroke={fill}
              />
            {:else}
              <line
                class="mark"
                x1={x(r.col) + PITCH * 0.3}
                y1={y(r.row) + (r.h * PITCH) / 2}
                x2={x(r.col + r.w) - PITCH * 0.3}
                y2={y(r.row) + (r.h * PITCH) / 2}
                style:stroke={fill}
              />
            {/if}
          {/if}
          <text
            class="name"
            class:action={selected && !play}
            x={x(r.col) + 6}
            y={y(r.row) + SANDBOX_LABEL_SIZE + 5}
            font-size={SANDBOX_LABEL_SIZE}>{r.name}</text
          >
        </g>
      {/each}

      <!-- The selection: an action-colour 1px outline plus eight square handles (Edit only). -->
      {#if view.selected !== undefined && !play}
        {@const r = view.selected}
        <g class="selection" data-testid="surface-selection">
          <rect
            class="outline"
            x={x(r.col)}
            y={y(r.row)}
            width={r.w * PITCH}
            height={r.h * PITCH}
          />
          {#each handles as [hx, hy], i (i)}
            <rect
              class="handle"
              data-testid="surface-handle"
              x={hx - HANDLE / 2}
              y={hy - HANDLE / 2}
              width={HANDLE}
              height={HANDLE}
            />
          {/each}
        </g>
      {/if}

      <!-- The proposed bounds, before anything commits (section 8). -->
      {#if proposed !== undefined}
        <rect
          class="proposed"
          data-testid="surface-proposed"
          x={x(proposed.col)}
          y={y(proposed.row)}
          width={proposed.w * PITCH}
          height={proposed.h * PITCH}
        />
      {/if}

      <!-- The keyboard's focus cell, while the plate has focus. -->
      {#if focused && !play}
        <rect
          class="focus"
          data-testid="surface-focus"
          x={x(view.focus.col) + 1}
          y={y(view.focus.row) + 1}
          width={PITCH - 2}
          height={PITCH - 2}
        />
      {/if}
    </svg>
  </div>

  <div class="under">
    <span class="matrix type-micro">{MATRIX_LINE}</span>
    <span class="count numerals" data-testid="surface-count"
      >{elementsLine(regions.length)}</span
    >
  </div>
  <p
    class="status type-helper"
    id={statusId}
    role="status"
    data-testid="surface-status"
  >
    {status}
  </p>
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    inline-size: 100%;
    max-inline-size: var(--plate, 571px);
  }

  /*
    The plate: a square, the PDF's 571 at most, the workspace token under a
    boundary hairline. position: relative so the preview canvas and the
    SVG stack; touch-action: none so a finger in Play is not a scroll.
  */
  .plate {
    position: relative;
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: var(--plate);
    aspect-ratio: 1;
    border: 1px solid var(--color-boundary);
    background: var(--color-workspace);
    touch-action: none;
    cursor: crosshair;
    user-select: none;
  }

  .plate.play {
    cursor: pointer;
  }

  .preview {
    position: absolute;
    inset: 0;
  }

  .preview :global(canvas) {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    image-rendering: pixelated;
  }

  .overlay {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    display: block;
    overflow: visible;
  }

  /* In Play the SVG is a picture over the live one; the wrapper takes the finger. */
  .plate.play .overlay {
    pointer-events: none;
  }

  /* The static lattice: the decorative divider token, 1px at any size. */
  .guides line {
    stroke: var(--color-divider);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  /* A region's tinted fill and its 1px boundary, both the stored colour. */
  .region .body {
    fill-opacity: 0.18;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .region .mark {
    fill: none;
    stroke-width: 1;
    stroke-opacity: 0.7;
    vector-effect: non-scaling-stroke;
  }

  /* The 11px uppercase name at the top-left, the micro role's tracking. */
  .region .name {
    fill: var(--color-ink);
    font-family: var(--font-display);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    pointer-events: none;
  }

  .region .name.action {
    fill: var(--color-action);
  }

  /* The selection: the action colour, 1px, and eight filled squares. */
  .selection .outline {
    fill: none;
    stroke: var(--color-action);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .selection .handle {
    fill: var(--color-action);
    stroke: var(--color-workspace);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  /* The proposed bounds: the action colour, dashed, before anything commits. */
  .proposed {
    fill: var(--color-action);
    fill-opacity: 0.08;
    stroke: var(--color-action);
    stroke-width: 1;
    stroke-dasharray: 4 3;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }

  /* The keyboard's cell: the focus ring's colour and width, inside the cell. */
  .focus {
    fill: none;
    stroke: var(--color-action);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }

  .plate:focus-visible {
    outline: 2px solid var(--color-action);
    outline-offset: 2px;
  }

  .under {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 16px;
    margin-block-start: 12px;
  }

  .matrix {
    color: var(--color-ink-quiet);
  }

  .count {
    font-size: 13px;
    color: var(--color-ink-quiet);
  }

  .status {
    margin: 8px 0 0;
    min-block-size: 1.45em;
    color: var(--color-ink-quiet);
  }
</style>
