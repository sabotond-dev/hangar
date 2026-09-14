<!--
  The plate: PDF page 3's 571px square, the 9 x 9 lattice (a static SVG overlay,
  drawn once), the regions with their kind's marks, the selection with its eight
  drag handles, the proposed bounds, the focus cell and the status line. Props:
  view, onclick (the ONE creation and selection call, fired from pointerdown; a
  release on another cell is the second click - no drag is ever required), onmove,
  onmark, oncancel, ondelete (the keyboard route: one tab stop, arrows, Enter,
  Escape, Delete), onresize (a handle drag's box on release, one Undo), onfinger
  and preview (Play: the route's canvas under the SVG). The marks are page 3's,
  measured at its 1500 render (13.1-03); the knob's circle is an SVG circle, not a
  radius (D-15). Every number is layout.ts's; the region fill is the stored RGB444 value.
  Decided at 13-16 / 13.1-03 (13.1-CONTEXT D-03); see .planning/phases/13.1-bench-corrections-four/13.1-03-SUMMARY.md

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
  import type { Problem } from "$lib/sandbox/geometry";
  import {
    SURFACE_SIZE,
    colourByte,
    toDisplay,
    type Region,
  } from "$lib/sandbox/model";
  import {
    SANDBOX_HANDLE,
    SANDBOX_HANDLE_HIT,
    SANDBOX_LABEL_SIZE,
    SANDBOX_PITCH,
    SANDBOX_PLATE,
  } from "$lib/ui/shell/layout";

  type Box = { col: number; row: number; w: number; h: number };
  type HandleName = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";

  let {
    view,
    onclick,
    onmove,
    onmark,
    oncancel,
    ondelete,
    onresize,
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
    /** A handle drag's box on release; the route wires editor.resizeSelectedTo and the problem shows in the status line. Optional so the spec's render needs no drag. */
    onresize?: (box: Box) => Problem | undefined;
    /** Play: a finger on the plate, as an offset inside the plate's box and its extent; the route maps it with touch.ts's mapAxis (PREV-04). */
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
  const HIT = SANDBOX_HANDLE_HIT;
  const LABEL = SANDBOX_LABEL_SIZE;

  /** The page's fader at rest: the thumb at 0.62 of the travel (Filter, `74`). */
  const REST_VALUE = 0.62;

  let plate = $state<HTMLDivElement | null>(null);
  /** The cell under the pointer, for the proposed bounds only. */
  let hover = $state<Cell | undefined>(undefined);
  let focused = $state(false);
  /** The cell the pointer went down on, so a release elsewhere is the second click. */
  let downCell: Cell | undefined;
  /** A handle drag in progress: which handle, and the box it started from. */
  let drag = $state<{ handle: HandleName; from: Box } | undefined>(undefined);
  /** The box the drag would commit, drawn as the proposed bounds. */
  let dragBox = $state<Box | undefined>(undefined);
  /** The last drag's refusal, shown until the next pointer or key or until the surface moves under it. Raw, so the identity check in `status` is against the editor's own reference. */
  let refused = $state.raw<
    { message: string; surface: EditorState["surface"] } | undefined
  >(undefined);

  const play = $derived(view.mode === "play");
  const regions = $derived(view.surface.regions);

  /** "rgb(221 255 119)" from RGB444 levels. */
  const fillOf = (r: Region): string =>
    `rgb(${colourByte(r.colour[0])} ${colourByte(r.colour[1])} ${colourByte(r.colour[2])})`;

  const x = (col: number) => col * PITCH;
  const y = (row: number) => row * PITCH;

  /** A region's box in plate units: edges, size and centre. */
  const frame = (r: Region) => {
    const left = x(r.col);
    const top = y(r.row);
    const w = r.w * PITCH;
    const h = r.h * PITCH;
    return {
      left,
      top,
      w,
      h,
      right: left + w,
      bottom: top + h,
      cx: left + w / 2,
      cy: top + h / 2,
    };
  };

  /** The box the next Enter or click would commit, from the hover cell or the focus cell - or a drag's. */
  const proposed = $derived.by(() => {
    if (play) return undefined;
    if (dragBox !== undefined) return dragBox;
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

  /** The eight handles of the selected region: corners and edge midpoints, named. */
  const handles = $derived.by(() => {
    const r = view.selected;
    if (r === undefined || play) return [];
    const f = frame(r);
    const midX = (f.left + f.right) / 2;
    const midY = (f.top + f.bottom) / 2;
    return [
      { name: "nw", x: f.left, y: f.top },
      { name: "n", x: midX, y: f.top },
      { name: "ne", x: f.right, y: f.top },
      { name: "w", x: f.left, y: midY },
      { name: "e", x: f.right, y: midY },
      { name: "sw", x: f.left, y: f.bottom },
      { name: "s", x: midX, y: f.bottom },
      { name: "se", x: f.right, y: f.bottom },
    ] as const;
  });

  /** The status line: what the next click or Enter does, and what is selected. */
  const status = $derived.by(() => {
    if (refused !== undefined && refused.surface === view.surface) {
      return refused.message;
    }
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

  /** The box a handle makes from the cell under the pointer: the unheld edges are the anchor, the held edge never crosses it, so the box is at least 1 x 1. */
  function boxFor(handle: HandleName, from: Box, at: Cell): Box {
    let left = from.col;
    let top = from.row;
    let right = from.col + from.w - 1;
    let bottom = from.row + from.h - 1;
    if (handle.includes("w")) left = Math.min(at.col, right);
    if (handle.includes("e")) right = Math.max(at.col, left);
    if (handle.includes("n")) top = Math.min(at.row, bottom);
    if (handle.includes("s")) bottom = Math.max(at.row, top);
    return { col: left, row: top, w: right - left + 1, h: bottom - top + 1 };
  }

  const sameBox = (a: Box, b: Box): boolean =>
    a.col === b.col && a.row === b.row && a.w === b.w && a.h === b.h;

  function startDrag(event: PointerEvent, handle: HandleName): void {
    const r = view.selected;
    if (play || r === undefined || event.button !== 0) return;
    // The plate's own pointerdown must not run: a press on a handle is not a click on the cell.
    event.stopPropagation();
    refused = undefined;
    plate?.focus({ preventScroll: true });
    try {
      plate?.setPointerCapture(event.pointerId);
    } catch {
      // The element can detach between the event and the capture.
    }
    drag = { handle, from: { col: r.col, row: r.row, w: r.w, h: r.h } };
    dragBox = drag.from;
  }

  function endDrag(): void {
    const d = drag;
    const box = dragBox;
    drag = undefined;
    dragBox = undefined;
    if (d === undefined || box === undefined) return;
    if (sameBox(box, d.from)) return;
    const problem = onresize?.(box);
    refused =
      problem === undefined
        ? undefined
        : { message: problem.message, surface: view.surface };
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
    refused = undefined;
    const at = cellOf(event);
    if (at === undefined) return;
    // WITHOUT SCROLLING (13-17): a programmatic focus that scrolled the plate would move the
    // page under a pressed pointer, and the release would land on another cell as a second click.
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
    // A drag in progress: the proposed bounds follow the cell, nothing commits.
    if (drag !== undefined && hover !== undefined) {
      dragBox = boxFor(drag.handle, drag.from, hover);
    }
  }

  function onpointerup(event: PointerEvent): void {
    if (play) {
      fingerAt("up", event);
      return;
    }
    if (drag !== undefined) {
      try {
        plate?.releasePointerCapture(event.pointerId);
      } catch {
        // Already released.
      }
      endDrag();
      downCell = undefined;
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
    refused = undefined;
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
    One tab stop with its own spatial keyboard model, which is what role="application"
    tells an assistive technology; a grid of gridcells would promise 81 focusable cells
    the plate does not have. The two a11y rules are suppressed for that reason.
  -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    bind:this={plate}
    class="plate"
    class:play
    class:focused
    class:dragging={drag !== undefined}
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

      <!-- The regions: the ground that hides the lattice, the tinted fill, the 1px boundary, the kind's mark, the name (header: THE MARKS). -->
      {#each regions as r (r.id)}
        {@const fill = fillOf(r)}
        {@const selected = r.id === view.selectedId}
        {@const f = frame(r)}
        <g
          class="region"
          class:selected
          data-region={r.id}
          data-kind={r.kind}
          data-testid="surface-region"
        >
          <rect class="ground" x={f.left} y={f.top} width={f.w} height={f.h} />
          <rect
            class="body"
            x={f.left}
            y={f.top}
            width={f.w}
            height={f.h}
            style:fill
            style:stroke={fill}
          />
          {#if r.kind === "knob"}
            {@const radius = Math.min(f.w, f.h) * 0.16}
            {@const kcy = f.top + f.h * 0.34}
            <!-- A true circle: an SVG circle, not a radius (D-15). -->
            <circle
              class="mark ring"
              cx={f.cx}
              cy={kcy}
              r={radius}
              style:stroke={fill}
            />
            <line
              class="mark pointer"
              x1={f.cx}
              y1={kcy - radius + 2.5}
              x2={f.cx}
              y2={kcy - radius * 0.3}
              style:stroke={fill}
            />
            <text
              class="name"
              class:action={selected && !play}
              text-anchor="middle"
              x={f.cx}
              y={f.top + f.h * 0.72}
              font-size={LABEL}>{r.name}</text
            >
          {:else if r.kind === "xy"}
            <line
              class="mark hair"
              x1={f.left + 6}
              y1={f.cy}
              x2={f.right - 6}
              y2={f.cy}
              style:stroke={fill}
            />
            <line
              class="mark hair"
              x1={f.cx}
              y1={f.top + PITCH * 0.75}
              x2={f.cx}
              y2={f.bottom - PITCH * 0.75}
              style:stroke={fill}
            />
            <circle class="dot" cx={f.cx} cy={f.cy} r={7} style:fill />
            <text
              class="numeral"
              x={f.left + 20}
              y={f.bottom - 24}
              font-size={LABEL}
              style:fill>X 0.50 Y 0.50</text
            >
            <text
              class="name"
              class:action={selected && !play}
              x={f.left + 20}
              y={f.top + 26}
              font-size={LABEL}>{r.name}</text
            >
          {:else if r.kind === "fader"}
            {@const grooveW = PITCH * 0.19}
            {@const thumbL = PITCH * 0.61}
            {@const thumbT = PITCH * 0.2}
            {#if (r.orientation ?? "vertical") === "vertical"}
              {@const gTop = f.top + PITCH * 0.8}
              {@const gBottom = Math.max(gTop + 10, f.bottom - PITCH * 0.85)}
              {@const ty = gBottom - REST_VALUE * (gBottom - gTop)}
              <rect
                class="groove"
                x={f.cx - grooveW / 2}
                y={gTop}
                width={grooveW}
                height={gBottom - gTop}
              />
              <rect
                class="value"
                x={f.cx - grooveW / 2}
                y={ty}
                width={grooveW}
                height={gBottom - ty}
                style:fill
              />
              <rect
                class="thumb"
                x={f.cx - thumbL / 2}
                y={ty - thumbT / 2}
                width={thumbL}
                height={thumbT}
                style:fill
              />
              <text
                class="numeral"
                text-anchor="middle"
                x={f.cx}
                y={f.bottom - PITCH * 0.45}
                font-size={LABEL}
                style:fill>{r.cc}</text
              >
            {:else}
              {@const gLeft = f.left + PITCH * 0.3}
              {@const gRight = Math.max(gLeft + 10, f.right - PITCH * 0.3)}
              {@const tx = gLeft + REST_VALUE * (gRight - gLeft)}
              <rect
                class="groove"
                x={gLeft}
                y={f.cy - grooveW / 2}
                width={gRight - gLeft}
                height={grooveW}
              />
              <rect
                class="value"
                x={gLeft}
                y={f.cy - grooveW / 2}
                width={tx - gLeft}
                height={grooveW}
                style:fill
              />
              <rect
                class="thumb"
                x={tx - thumbT / 2}
                y={f.cy - thumbL / 2}
                width={thumbT}
                height={thumbL}
                style:fill
              />
              <text
                class="numeral"
                text-anchor="middle"
                x={f.cx}
                y={f.cy + PITCH * 0.42}
                font-size={LABEL}
                style:fill>{r.cc}</text
              >
            {/if}
            <text
              class="name"
              class:action={selected && !play}
              text-anchor="middle"
              x={f.cx}
              y={f.top + 23}
              font-size={LABEL}>{r.name}</text
            >
          {:else}
            {@const chipW = PITCH * 0.93}
            {@const chipH = PITCH * 0.41}
            {@const chipCy =
              f.cy + Math.min(PITCH * 0.42, f.h / 2 - chipH / 2 - 2)}
            <text
              class="name"
              class:action={selected && !play}
              text-anchor="middle"
              x={f.cx}
              y={f.cy - PITCH * 0.4 + 4}
              font-size={LABEL}>{r.name}</text
            >
            <!-- At rest a button is off, whether it latches or not. -->
            <rect
              class="chip"
              x={f.cx - chipW / 2}
              y={chipCy - chipH / 2}
              width={chipW}
              height={chipH}
            />
            <text
              class="chip-word"
              text-anchor="middle"
              x={f.cx}
              y={chipCy + 4}
              font-size={LABEL}>OFF</text
            >
          {/if}
        </g>
      {/each}

      <!-- The selection: an action-colour 1px outline plus eight square handles with their hit squares beneath (Edit only). -->
      {#if view.selected !== undefined && !play}
        {@const r = view.selected}
        {@const f = frame(r)}
        <g class="selection" data-testid="surface-selection">
          <rect class="outline" x={f.left} y={f.top} width={f.w} height={f.h} />
          <!-- The handles and their hit squares take a pointerdown and have no role: a pointer accelerator inside the aria-hidden SVG; the numeric fields are the keyboard route. -->
          {#each handles as h (h.name)}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <rect
              class="handle-hit"
              data-testid="surface-handle-hit"
              data-handle={h.name}
              x={h.x - HIT / 2}
              y={h.y - HIT / 2}
              width={HIT}
              height={HIT}
              onpointerdown={(event) => startDrag(event, h.name)}
            />
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <rect
              class="handle"
              data-testid="surface-handle"
              data-handle={h.name}
              x={h.x - HANDLE / 2}
              y={h.y - HANDLE / 2}
              width={HANDLE}
              height={HANDLE}
              onpointerdown={(event) => startDrag(event, h.name)}
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

  /* The plate: a square, the PDF's 571 at most, the workspace token under a boundary hairline; position: relative so the canvas and the SVG stack; touch-action: none so a finger is not a scroll. */
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

  /* A region covers the lattice, as the page's regions cover the cells. */
  .region .ground {
    fill: var(--color-workspace);
  }

  /* A region's tinted fill and its 1px boundary, both the stored colour (the tint measured off page 3, header). */
  .region .body {
    fill-opacity: 0.24;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  /* The 1px marks: the XY pad's crosshair at half strength, as the page draws it. */
  .region .mark {
    fill: none;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .region .hair {
    stroke-opacity: 0.5;
  }

  /* The knob's ring and its pointer tick: the page's 5 and 4, scaling with the plate. */
  .region .ring {
    stroke-width: 5;
    vector-effect: none;
  }

  .region .pointer {
    stroke-width: 4;
    vector-effect: none;
  }

  /* The fader's groove is a darker channel in the workspace colour; the value and the thumb are the region's colour. */
  .region .groove {
    fill: var(--color-workspace);
    fill-opacity: 0.7;
  }

  /* The button's chip: the page's raised box with the quiet ink. */
  .region .chip {
    fill: var(--color-raised);
  }

  .region .chip-word {
    fill: var(--color-ink-quiet);
    font-family: var(--font-display);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    pointer-events: none;
  }

  /* Numerals: the mono face, tabular, the region's colour (set inline). */
  .region .numeral {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }

  /* The 11px uppercase name, the micro role's tracking. */
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
    pointer-events: all;
  }

  /* The hit square under each handle: invisible, but a target (SANDBOX_HANDLE_HIT). */
  .selection .handle-hit {
    fill: none;
    stroke: none;
    pointer-events: all;
  }

  .selection [data-handle="nw"],
  .selection [data-handle="se"] {
    cursor: nwse-resize;
  }

  .selection [data-handle="ne"],
  .selection [data-handle="sw"] {
    cursor: nesw-resize;
  }

  .selection [data-handle="n"],
  .selection [data-handle="s"] {
    cursor: ns-resize;
  }

  .selection [data-handle="w"],
  .selection [data-handle="e"] {
    cursor: ew-resize;
  }

  /* While a handle is held the whole plate keeps the drag's meaning. */
  .plate.dragging {
    cursor: move;
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
