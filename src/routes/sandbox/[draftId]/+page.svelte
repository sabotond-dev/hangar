<!--
  /sandbox/{id}/ - the Sandbox: PDF page 3 on the shell (13-16; Bible sections 2, 8, 14, 16;
  BUILD-01/02/06/07/08, PREV-04, KEEP-01). The rail (Palette, ElementList, `+ New surface`) and
  the inspector (RegionInspector) are snippets handed to the shell; the centre is the name row with
  the Edit / Play switch, one toolbar row (Undo, Redo, Save copy, Export as a file) and the plate.
  One model: src/lib/sandbox/editor.ts holds the surface, selection, mode, focus and history; this
  route keeps the one EditorState in raw state and owns the store, the landing, the preview, the
  frame and the window's key listener (the hotkeys, V / Escape, Delete - never in a text field).
  The draft is saved as it is edited (drafts.ts, debounced, `sandbox:{id}`); the landing is land.ts's
  under the pinned minifier with SLOTS 5 (change 10B), its five strings going to install.observeConfig
  after every measurement, and DestinationZone is the one component both routes mount (13.1-06).
  No number about the budget is shown (change 10A); an over-budget landing refuses Store in words.
  Play builds a Lua engine on the surface's own strings and routes the finger through touch.ts's mapAxis, tick-locked.
  Decided at 13-16 / 13-17 / 13.1-06 (13-CONTEXT D-18, D-19; 13.1-CONTEXT D-06); see .planning/phases/13.1-bench-corrections-four/13.1-06-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { onDestroy, onMount, untrack } from "svelte";
  import { install } from "$lib/device/install.svelte";
  import { session } from "$lib/device/session.svelte";
  import {
    DEFAULT_SURFACE_NAME,
    DRAFT_SAVED,
    DRAFT_UNSAVED,
    DUPLICATE_AT_CAP,
    DUPLICATE_NO_SPACE,
    EMPTY_INSTRUCTION,
    EMPTY_SECOND_LINE,
    EYEBROW_SANDBOX,
    MODE_EDIT,
    MODE_LINE_EDIT,
    MODE_LINE_PLAY,
    MODE_PLAY,
    MODE_PLAY_GLYPH,
    NEW_SURFACE,
    REDO,
    RENAME_SURFACE,
    SAVE_COPY,
    SAVE_REFUSED,
    STARTER_ACTION,
    SUB_LINE,
    SURFACE_NAME,
    TEMPLATE_ACTION,
    TITLE,
    TOO_FULL_TO_STORE,
    UNDO,
    copyName,
    exportedLine,
    renameSurfaceName,
    savedLine,
  } from "$lib/sandbox/copy";
  import {
    mintSurfaceId,
    readSurfaceDraft,
    saveSurfaceDraft,
  } from "$lib/sandbox/draft";
  import {
    SELECTOR_KEY,
    SandboxEditor,
    kindForKey,
    type EditorState,
    type Mode,
    type NumericField,
  } from "$lib/sandbox/editor";
  import { emptySurface } from "$lib/sandbox/model";
  import type { SurfaceLanding } from "$lib/sandbox/land";
  import { SimHost } from "$lib/sim/host";
  import type { SimEngine } from "$lib/sim/engine";
  import { motionDeps } from "$lib/sim/motion.svelte";
  import { mapAxis } from "$lib/sim/touch";
  import { readCopy, saveCopy } from "$lib/store/library";
  import type { LocalStore } from "$lib/store/local";
  import { downloadExport, exportFile } from "$lib/store/transfer";
  import PadCanvas from "$lib/ui/PadCanvas.svelte";
  import ElementList from "$lib/ui/sandbox/ElementList.svelte";
  import Palette from "$lib/ui/sandbox/Palette.svelte";
  import RegionInspector from "$lib/ui/sandbox/RegionInspector.svelte";
  import DestinationZone from "$lib/ui/DestinationZone.svelte";
  import SurfaceActions from "$lib/ui/sandbox/SurfaceActions.svelte";
  import SurfaceEditor from "$lib/ui/sandbox/SurfaceEditor.svelte";
  import Rail from "$lib/ui/shell/Rail.svelte";
  import { fillShell } from "$lib/ui/shell/shell.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  /** Five slots since change 10B: the touch Timer, the system element's utility (255/4) and the two trimmed system halves (land.ts's LANDING_SLOTS). */
  const SLOTS = 5 as const;
  const SAVE_DEBOUNCE_MS = 250;
  const MEASURE_DEBOUNCE_MS = 120;
  const CONFIRM_MS = 4000;
  const PREVIEW_ID = "sandbox-preview";

  // ---------------------------------------------------------------------------
  // The model and its rendered state.

  let editor: SandboxEditor | undefined;
  let view = $state.raw<EditorState | undefined>(undefined);
  let draftLine = $state<string | undefined>(undefined);
  let landing = $state.raw<SurfaceLanding | undefined>(undefined);
  let exported = $state<string | undefined>(undefined);
  let notice = $state<string | undefined>(undefined);
  let saved = $state<string | undefined>(undefined);
  let unavailable = $state(false);
  let renaming = $state(false);

  // Plain bindings, outside the reactive graph (04-RESEARCH, Pitfall 3).
  let host: SimHost | undefined;
  let engine: SimEngine | undefined;
  let canvas: HTMLCanvasElement | undefined;
  let mounted = false;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  let measureTimer: ReturnType<typeof setTimeout> | undefined;
  let confirmTimer: ReturnType<typeof setTimeout> | undefined;
  let exportTimer: ReturnType<typeof setTimeout> | undefined;
  let measureGeneration = 0;
  let previewGeneration = 0;
  let landSurface: typeof import("$lib/sandbox/land").landSurface | undefined;

  /** The route's edge to the browser store, one per route (13.2-CONTEXT D-15). */
  function local(): LocalStore | undefined {
    if (!browser) return undefined;
    try {
      return window.localStorage;
    } catch {
      return undefined;
    }
  }

  const name = $derived(view?.surface.name ?? DEFAULT_SURFACE_NAME);
  const empty = $derived(
    view !== undefined && view.surface.regions.length === 0,
  );
  const mode = $derived<Mode>(view?.mode ?? "edit");
  const play = $derived(mode === "play");

  /** Every change: the rendered state, the draft, the landing. */
  function onchange(state: EditorState): void {
    const before = view;
    view = state;
    notice = undefined;
    if (before !== undefined && before.surface !== state.surface) {
      scheduleSave();
      scheduleMeasure();
    }
  }

  // ---------------------------------------------------------------------------
  // The draft (KEEP-01).

  function scheduleSave(): void {
    if (saveTimer !== undefined) clearTimeout(saveTimer);
    saveTimer = setTimeout(save, SAVE_DEBOUNCE_MS);
  }

  function save(): void {
    saveTimer = undefined;
    if (editor === undefined || !mounted) return;
    const ok = saveSurfaceDraft(
      local(),
      editor.surface,
      new Date().toISOString(),
    );
    draftLine = ok ? DRAFT_SAVED : DRAFT_UNSAVED;
  }

  // ---------------------------------------------------------------------------
  // The landing (land.ts, measured at the picker corner).

  function scheduleMeasure(): void {
    if (measureTimer !== undefined) clearTimeout(measureTimer);
    measureTimer = setTimeout(() => void measure(), MEASURE_DEBOUNCE_MS);
  }

  /**
   * The landing, from one measurement; withdrawn the instant the feed goes stale
   * (`observeConfig(undefined)`) so a click inside the debounce cannot write stale strings.
   */
  async function measure(): Promise<void> {
    measureTimer = undefined;
    if (editor === undefined || !mounted) return;
    const generation = (measureGeneration += 1);
    const surface = editor.surface;
    landing = undefined;
    install.observeConfig(undefined);
    try {
      landSurface ??= (await import("$lib/sandbox/land")).landSurface;
      const landed = await landSurface(surface, { slots: SLOTS });
      if (generation !== measureGeneration || !mounted) return;
      landing = landed;
      // An over-budget landing is never observed: Store is disabled on the
      // refusal and the store is not told about strings it must not write.
      install.observeConfig(
        landed.refusal === undefined ? landed.config : undefined,
      );
    } catch {
      if (generation !== measureGeneration || !mounted) return;
      unavailable = true;
    }
  }

  /** Store's refusal when a string is over the budget (land.ts's, first in write order), worded without a number. */
  const refusal = $derived(
    landing?.refusal === undefined ? undefined : TOO_FULL_TO_STORE,
  );

  // ---------------------------------------------------------------------------
  // The live preview (PREV-04's third reach).

  function collect(_id: string, el: HTMLCanvasElement): void {
    canvas = el;
    adopt();
  }

  function adopt(): void {
    if (host === undefined || engine === undefined || canvas === undefined)
      return;
    host.register(PREVIEW_ID, canvas, engine);
    host.setHero(PREVIEW_ID);
  }

  async function openPreview(): Promise<void> {
    if (editor === undefined) return;
    const generation = (previewGeneration += 1);
    try {
      const { createSurfaceEngine } = await import("$lib/sandbox/preview");
      const built = await createSurfaceEngine(editor.surface, { slots: SLOTS });
      if (generation !== previewGeneration || !mounted) return;
      engine = built;
      adopt();
    } catch {
      if (generation !== previewGeneration || !mounted) return;
      unavailable = true;
    }
  }

  function closePreview(): void {
    previewGeneration += 1;
    host?.setHero(undefined);
    host?.unregister(PREVIEW_ID);
    engine = undefined;
    canvas = undefined;
  }

  function onfinger(
    phase: "down" | "move" | "up",
    pointerId: number,
    x: number,
    y: number,
    extent: number,
  ): void {
    if (host === undefined || engine === undefined) return;
    if (phase === "up") {
      host.touchEnd(pointerId);
      return;
    }
    const lx = mapAxis(x, extent, engine.coordMax);
    const ly = mapAxis(y, extent, engine.coordMax, "y");
    if (phase === "down") host.touchDown(pointerId, lx, ly);
    else host.touchMove(pointerId, lx, ly);
  }

  function setMode(next: Mode): void {
    if (editor === undefined || editor.mode === next) return;
    editor.setMode(next);
    if (next === "play") void openPreview();
    else closePreview();
  }

  // ---------------------------------------------------------------------------
  // The edits, each a method on the editor.

  const onnumber = (field: NumericField, text: string): void =>
    void editor?.editNumber(field, text);

  function duplicate(): void {
    if (editor === undefined) return;
    const result = editor.duplicate();
    if (result.ok) return;
    notice = result.reason === "cap" ? DUPLICATE_AT_CAP : DUPLICATE_NO_SPACE;
  }

  function remove(): void {
    editor?.remove();
  }

  function removeById(id: string): void {
    if (editor === undefined) return;
    editor.select(id);
    editor.remove();
  }

  /** Save copy (section 11; library.ts): a NEW named copy, never a write over the draft. */
  function save_copy(): void {
    if (editor === undefined) return;
    const at = new Date().toISOString();
    const surface = editor.surface;
    const outcome = saveCopy(local(), {
      schema: 1,
      id: `copy:${surface.id}:${Date.now().toString(36)}`,
      name: copyName(surface.name),
      kind: "sandbox",
      source: surface.id,
      surface,
      createdAt: at,
      editedAt: at,
    });
    saved =
      outcome === "written" ? savedLine(copyName(surface.name)) : SAVE_REFUSED;
    if (confirmTimer !== undefined) clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => {
      confirmTimer = undefined;
      saved = undefined;
    }, CONFIRM_MS);
  }

  /** Export as a file (D-14 Q7; section 11): the record shape through transfer.ts's own envelope and download. */
  function export_surface(): void {
    if (editor === undefined) return;
    const at = new Date().toISOString();
    const surface = editor.surface;
    const fileName = downloadExport(
      exportFile(
        {
          schema: 1,
          id: surface.id,
          name: surface.name,
          kind: "sandbox",
          source: surface.id,
          surface,
          createdAt: at,
          editedAt: at,
        },
        at,
      ),
    );
    exported = exportedLine(fileName);
    if (exportTimer !== undefined) clearTimeout(exportTimer);
    exportTimer = setTimeout(() => {
      exportTimer = undefined;
      exported = undefined;
    }, CONFIRM_MS);
  }

  function commitName(next: string): void {
    renaming = false;
    const trimmed = next.trim();
    if (trimmed !== "") editor?.renameSurface(trimmed);
  }

  function newSurface(): void {
    void goto(resolve("/sandbox/[draftId]", { draftId: mintSurfaceId() }));
  }

  /**
   * The window's keys (change 10A): Ctrl/Cmd+Z and +Y as before; a kind's hotkey arms it (HOTKEYS),
   * V or Escape returns to the selector, Delete or Backspace deletes the selection. Never while a
   * text field, a text area or a select has focus (a name field typing "f" arms nothing), never
   * with Alt held, and never for a key the plate or the list already handled (defaultPrevented).
   */
  function onWindowKeyDown(event: KeyboardEvent): void {
    if (editor === undefined || event.defaultPrevented) return;
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) {
      return;
    }
    const key = event.key.toLowerCase();
    if (event.ctrlKey || event.metaKey) {
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        editor.undo();
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        editor.redo();
      }
      return;
    }
    if (event.altKey) return;
    if (key === "escape" || key === SELECTOR_KEY) {
      event.preventDefault();
      editor.cancel();
      return;
    }
    if (key === "delete" || key === "backspace") {
      event.preventDefault();
      editor.remove();
      return;
    }
    const kind = kindForKey(key);
    if (kind !== undefined) {
      event.preventDefault();
      editor.choose(kind);
    }
  }

  // ---------------------------------------------------------------------------
  // Mount: the store, the model, the host.

  /**
   * A saved copy opened from My configs (`?from=<record id>`) is loaded onto THIS fresh surface id, so
   * the copy stays a copy; a draft under this id wins over the query, so a return visit resumes.
   */
  function fromCopy(store: LocalStore | undefined, id: string) {
    const from = page.url.searchParams.get("from");
    if (from === null) return undefined;
    const record = readCopy(store, from);
    if (record === undefined || record.kind !== "sandbox") return undefined;
    return { ...record.surface, id };
  }

  function open(id: string): void {
    closePreview();
    const store = local();
    const stored = readSurfaceDraft(store, id) ?? fromCopy(store, id);
    const surface = stored ?? emptySurface(id, DEFAULT_SURFACE_NAME);
    editor = new SandboxEditor(surface, { onchange });
    view = editor.state();
    draftLine = stored === undefined ? undefined : DRAFT_SAVED;
    notice = undefined;
    scheduleMeasure();
  }

  onMount(() => {
    mounted = true;
    host = new SimHost(motionDeps());
    window.addEventListener("keydown", onWindowKeyDown);
  });

  onDestroy(() => {
    if (!mounted) return;
    mounted = false;
    window.removeEventListener("keydown", onWindowKeyDown);
    if (saveTimer !== undefined) {
      clearTimeout(saveTimer);
      save();
    }
    if (measureTimer !== undefined) clearTimeout(measureTimer);
    if (confirmTimer !== undefined) clearTimeout(confirmTimer);
    if (exportTimer !== undefined) clearTimeout(exportTimer);
    // The landing is this page's: the store forgets it with the page.
    install.observeConfig(undefined);
    host?.destroy();
    host = undefined;
    engine = undefined;
    canvas = undefined;
  });

  /* One open per id: `+ New surface` navigates within this route. */
  $effect(() => {
    const id = data.draftId;
    if (!mounted) return;
    untrack(() => open(id));
  });

  /* The destination zone renders while a ZONA is connected (13-12's rule); without a session the bar says so itself. */
  const reportedPage = $derived(session.identity?.activePage);

  /* The shell: SANDBOX current, the breadcrumb, the draft's clause, the device's, the destination, the rail and the inspector. */
  $effect(() =>
    fillShell({
      variant: "app",
      section: "sandbox",
      breadcrumb: ["SANDBOX", name.toUpperCase()],
      draft: draftLine,
      device: install.phase,
      page: install.snapshotPage,
      destination: reportedPage === undefined ? undefined : destination,
      rail,
      inspector,
    }),
  );
</script>

<svelte:head>
  <title>{TITLE}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

{#snippet rail()}
  {#if view !== undefined}
    <Rail>
      <Palette
        mode={view.mode}
        placement={view.placement}
        atCap={view.atCap}
        onchoose={(kind) =>
          kind === undefined ? editor?.cancel() : editor?.choose(kind)}
      />
      <hr class="divider" />
      <ElementList
        regions={view.surface.regions}
        selectedId={view.selectedId}
        onselect={(id) => editor?.select(id)}
        ondelete={removeById}
      />
      {#snippet action()}
        <button
          class="outlined wide"
          type="button"
          data-testid="new-surface"
          onclick={newSurface}>{NEW_SURFACE}</button
        >
      {/snippet}
    </Rail>
  {/if}
{/snippet}

<!-- The context bar's destination zone (13-12; 13-17; 13.1-06; Apply gone 2026-09-16): the page target, Store on ZONA - the one component both routes mount. -->
{#snippet destination()}
  <DestinationZone {name} config={landing?.config} {refusal} />
{/snippet}

{#snippet inspector()}
  {#if view !== undefined}
    <RegionInspector
      {view}
      onrename={(next) => editor?.rename(next)}
      {onnumber}
      oncommit={() => editor?.commitField()}
      onorientation={(o) => void editor?.setOrientation(o)}
      onlatch={(latch) => editor?.setLatch(latch)}
      onmode={(mode) => void editor?.setRegionMode(mode)}
      onspeed={(speed) => editor?.setSpeed(speed)}
      onspring={(spring) => editor?.setSpring(spring)}
      onoutput={(output) => editor?.setOutput(output)}
      ongroup={(group) => editor?.setGroup(group)}
      oncolour={(colour) => editor?.setColour(colour)}
      onbrightness={(next) => editor?.setBrightness(next)}
      onduplicate={duplicate}
      ondelete={remove}
      {notice}
    />
  {/if}
{/snippet}

{#snippet preview()}
  <PadCanvas entry={{ id: PREVIEW_ID, name }} hero onready={collect} />
{/snippet}

{#if view !== undefined}
  <div
    class="sandbox"
    data-testid="sandbox"
    data-mode={view.mode}
    data-surface={view.surface.id}
    data-depth={view.depth}
    data-unavailable={unavailable || undefined}
  >
    <header class="top">
      <p class="eyebrow type-micro">{EYEBROW_SANDBOX} / {name.toUpperCase()}</p>
      <div class="title-row">
        <div class="name-block">
          {#if renaming}
            <!-- The name, edited in place: Enter or blur commits, Escape keeps the old name. -->
            <input
              class="name-field type-page-title"
              type="text"
              aria-label={SURFACE_NAME}
              data-testid="surface-name-field"
              value={name}
              onblur={(event) => commitName(event.currentTarget.value)}
              onkeydown={(event) => {
                if (event.key === "Enter")
                  commitName(event.currentTarget.value);
                else if (event.key === "Escape") renaming = false;
              }}
            />
          {:else}
            <h1 class="name type-page-title" data-testid="surface-name">
              {name}
            </h1>
            {#if !play}
              <button
                class="quiet"
                type="button"
                data-testid="rename-surface"
                aria-label={renameSurfaceName(name)}
                onclick={() => (renaming = true)}>{RENAME_SURFACE}</button
              >
            {/if}
          {/if}
        </div>
        <!-- The two-segment switch: a radiogroup of two real radios in labels, one tab stop. On the name's row (PDF page 3). -->
        <div class="mode" role="radiogroup" aria-label="Mode">
          <label
            class="segment"
            class:selected={!play}
            data-testid="segment-edit"
          >
            <input
              class="sr-only"
              type="radio"
              name="sandbox-mode"
              value="edit"
              data-testid="mode-edit"
              checked={!play}
              onchange={() => setMode("edit")}
            />
            {MODE_EDIT}
          </label>
          <label
            class="segment"
            class:selected={play}
            data-testid="segment-play"
          >
            <input
              class="sr-only"
              type="radio"
              name="sandbox-mode"
              value="play"
              data-testid="mode-play"
              checked={play}
              onchange={() => setMode("play")}
            />
            <span aria-hidden="true">{MODE_PLAY_GLYPH}</span>
            {MODE_PLAY}
          </label>
        </div>
      </div>
      <div class="lines">
        <p class="sentence">{SUB_LINE}</p>
        <!-- The persistent, visible mode label (section 8): the sub-line's second line since round 4b, not the switch's helper - the PDF draws none there. -->
        <p
          class="mode-line type-helper"
          id="sandbox-mode-line"
          data-testid="mode-line"
        >
          {play ? MODE_LINE_PLAY : MODE_LINE_EDIT}
        </p>
      </div>
    </header>

    <div class="tools">
      <div class="history">
        <button
          class="outlined"
          type="button"
          data-testid="undo"
          disabled={play || !view.canUndo}
          aria-describedby={play ? "sandbox-mode-line" : undefined}
          onclick={() => editor?.undo()}>{UNDO}</button
        >
        <button
          class="outlined"
          type="button"
          data-testid="redo"
          disabled={play || !view.canRedo}
          aria-describedby={play ? "sandbox-mode-line" : undefined}
          onclick={() => editor?.redo()}>{REDO}</button
        >
      </div>
      <div class="save">
        {#if saved !== undefined}
          <span
            class="saved type-helper"
            role="status"
            data-testid="save-copy-outcome">{saved}</span
          >
        {/if}
        <button
          class="outlined"
          type="button"
          data-testid="save-copy"
          onclick={save_copy}>{SAVE_COPY}</button
        >
        <SurfaceActions {exported} onexport={export_surface} />
      </div>
    </div>

    <div class="centre">
      <SurfaceEditor
        {view}
        onclick={(col, row) => void editor?.clickCell(col, row)}
        onmove={(dc, dr) => editor?.moveFocus(dc, dr)}
        onmark={() => void editor?.mark()}
        oncancel={() => editor?.cancel()}
        ondelete={remove}
        onresize={(box) => editor?.resizeSelectedTo(box)}
        onmoveto={(cell) => editor?.moveSelectedTo(cell)}
        onnudge={(dc, dr) => editor?.nudgeSelected(dc, dr)}
        onresizeby={(dw, dh) => editor?.resizeSelectedBy(dw, dh)}
        oncommit={() => editor?.commitField()}
        {onfinger}
        preview={play ? preview : undefined}
      />

      <!-- The empty state (section 8): the real plate above, the instruction, one starter, one template. -->
      {#if empty && !play}
        <div class="empty" data-testid="sandbox-empty">
          <p class="instruction type-base">{EMPTY_INSTRUCTION}</p>
          <p class="second type-helper">{EMPTY_SECOND_LINE}</p>
          <div class="starters">
            <button
              class="filled"
              type="button"
              data-testid="starter-action"
              onclick={() => void editor?.starter()}>{STARTER_ACTION}</button
            >
            <button
              class="quiet"
              type="button"
              data-testid="template-action"
              onclick={() => void editor?.template()}>{TEMPLATE_ACTION}</button
            >
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .sandbox {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-inline-size: 900px;
    margin-inline: auto;
    /* The toolbar row's wrap rule reads this column's width, not the viewport's (KnobRack's precedent). */
    container-type: inline-size;
  }

  .top {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .eyebrow {
    margin: 0;
    color: var(--color-ink-quiet);
  }

  /* The name's row: the name left, the switch right, the switch's boxes centred on the name's line (PDF page 3). */
  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }

  /* The name and Rename: centred on each other, so Rename's 44px box and the switch's share one top and bottom. */
  .name-block {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1 1 240px;
    min-inline-size: 0;
  }

  .name {
    margin: 0;
    min-inline-size: 0;
    overflow-wrap: anywhere;
    color: var(--color-ink);
  }

  /* The name is the page title and a field at once: the PDF's headline, editable in place. */
  .name-field {
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: 44px;
    padding: 0;
    border: 0;
    border-block-end: 1px solid transparent;
    border-radius: 0;
    background: transparent;
    color: var(--color-ink);
  }

  .name-field:focus {
    border-block-end-color: var(--color-boundary);
    outline: none;
  }

  .name-field:focus-visible {
    outline: 2px solid var(--color-action);
    outline-offset: 4px;
  }

  /* The sub-line and the mode line under it, one block. */
  .lines {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sentence {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 17px;
    line-height: 1.45;
    color: var(--color-ink-quiet);
  }

  /* PDF page 3's two-segment switch: two outlined boxes, the active one in the action colour. Square (D-01). */
  .mode {
    display: flex;
    flex: none;
    gap: 12px;
    /* When the row wraps (the name at 40px beside a 372px compact centre), the switch keeps the right edge. */
    margin-inline-start: auto;
  }

  .segment {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 20px;
    border: 1px solid var(--color-boundary);
    font-family: var(--font-sans);
    font-size: 15px;
    color: var(--color-ink);
    cursor: pointer;
  }

  .segment.selected {
    border-color: var(--color-action);
    color: var(--color-action);
  }

  .segment:has(:focus-visible) {
    outline: 2px solid var(--color-action);
    outline-offset: 4px;
  }

  .mode-line {
    margin: 0;
    color: var(--color-ink-quiet);
  }

  /* ONE toolbar row (PDF page 3): Undo, Redo left; Save copy and the export right; every box 44 tall.
     Above 480 of column the row never wraps: the two transient outcome lines shrink and fold beside
     their buttons (measured at 1280 and 1440: one line stays one row of 44, both make it 56 for four
     seconds), so a file name never sets the row's minimum (measured at 1024: 55px of slide without this). */
  .tools {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .history,
  .save {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .history {
    flex: none;
  }

  .save {
    flex: 1 1 auto;
    justify-content: flex-end;
    min-inline-size: 0;
  }

  /* The saved line gives way beside its button: it shrinks and folds, never the boxes. */
  .saved {
    min-inline-size: 0;
    overflow-wrap: anywhere;
    text-align: end;
    color: var(--color-ink-quiet);
  }

  .tools .outlined {
    flex: none;
    white-space: nowrap;
  }

  /* The compact band (1024-1439): the centre is 372 at 1024 and the four
     boxes at the wide band's padding and gaps are 413, so the row tightens -
     10px padding and 8px gaps, 353 - and stays one row. */
  @media (max-width: 1439.98px) {
    .tools {
      gap: 12px;
    }

    .history,
    .save {
      gap: 8px;
    }

    .tools .outlined {
      padding-inline: 10px;
    }
  }

  /* Under 480 of column (372 at 1024) an outcome line has no room beside the boxes (353 with gaps), so
     the right pair drops to a second line for its four seconds; Clear.svelte's 480 is the same threshold. */
  @container (width < 480px) {
    .tools {
      flex-wrap: wrap;
    }
  }

  /* Outlined controls: the boundary token, square, 44px on both axes. */
  .outlined {
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 14px;
    color: var(--color-ink);
    cursor: pointer;
  }

  .outlined:hover:not(:disabled) {
    border-color: var(--color-action);
  }

  .outlined:disabled {
    color: var(--color-ink-quiet);
    cursor: default;
  }

  .outlined.wide {
    inline-size: 100%;
  }

  .centre {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
  }

  .instruction {
    margin: 0;
    color: var(--color-ink);
  }

  .second {
    margin: 0;
    color: var(--color-ink-quiet);
  }

  .starters {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-block-start: 8px;
  }

  /* The one visible starter action: filled, the action colour. */
  .filled {
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 20px;
    border: 1px solid var(--color-action);
    border-radius: 0;
    background: var(--color-action);
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 600;
    color: var(--color-on-action);
    cursor: pointer;
  }

  /* The template alternative: quiet text, 44px. */
  .quiet {
    min-block-size: 44px;
    min-inline-size: 44px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 14px;
    color: var(--color-ink-quiet);
    cursor: pointer;
  }

  .quiet:hover {
    color: var(--color-ink);
  }

  .divider {
    margin-block: 16px;
    margin-inline: 12px;
    border: 0;
    border-block-start: 1px solid var(--color-divider);
  }
</style>
