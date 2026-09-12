<!--
  /sandbox/{id}/ - the Sandbox: PDF page 3 on 13-05's shell (plan 13-16;
  Bible sections 2, 8, 14, 16; BUILD-01, BUILD-02, BUILD-06, BUILD-07,
  BUILD-08, PREV-04, KEEP-01).

  THREE REGIONS, ALL THE PDF'S. The rail: ADD AN ELEMENT (Palette.svelte),
  a divider, ON THIS SURFACE (ElementList.svelte), and `+ New surface`
  pinned. The centre: the eyebrow `SANDBOX / MY PERFORMANCE`, the name, the
  two-segment `Edit` / `Play` switch with its persistent mode line, the
  sub-line, `Undo` and `Redo` left with `Save copy` right, the plate
  (SurfaceEditor.svelte) with `ZONA · CONTINUOUS TOUCH SURFACE` and the
  element count beneath it. The inspector: RegionInspector.svelte, handed
  to the shell as a snippet, with the budget meters after its last section.

  ONE MODEL, RENDERED. src/lib/sandbox/editor.ts holds the surface, the
  selection, the mode, the pending placement, the focus cell, the field
  states and the history; every component reads the one EditorState value
  this route keeps in raw state and replaces on every change, and every
  edit is a method call on the editor. The route owns what the model
  cannot: the store, the meter, the live preview and the frame.

  THE DRAFT IS SAVED AS IT IS EDITED (section 9; KEEP-01) through 13-06's
  drafts.ts, debounced a beat behind the keystrokes, under
  `sandbox:{surface id}`; the context bar's draft clause says `Draft saved
  locally` once the first write lands, and when the store refuses it says
  so in one honest line and the session goes on unsaved - no dialog, no
  error. On return the draft is read back and loaded without a history
  entry. The first write waits for the first edit, so opening an empty
  surface leaves no Draft row behind in My configs.

  THE METER IS cost.ts's, MEASURED (13-14, 13-15): after every change,
  `costOf` measures the emitted Setup, Timer and 255/4 under the pinned
  minifier at the picker corner and re-measures with representative regions
  for "room for about M more". It reaches the minifier through await
  import(), after the plate has painted. `SLOTS` IS 3 SINCE 13-17 (13-CONTEXT
  D-18, D-19): HANGAR writes 255/4, so the Sandbox emits against the three
  slots the install lands, and every combination of kinds fits (13-15's
  measured ceiling) - the PDF's own page 3 included. The two-slot refusal
  line 13-16 rendered is kept in copy.ts for `slots: 2` and is unreachable
  from this route; when a string is over 908 here it is the Setup, an
  element pushed it, and the meter says so in the error ink.

  THE INSTALL IS THE ONE WRITER'S (13-17; D-03; BUILD-03, BUILD-05, SAFE-01
  to SAFE-09). After every measurement `landSurface` (land.ts) publishes the
  five strings in the tuner's own shape - the library's two halves, the
  runtime's 255/4, the packed Timer, the data-half Setup - and the route
  hands them to `install.observeConfig` exactly as the workspace hands the
  tuner's; the context bar's destination zone (SurfaceActions.svelte) is
  13-12's Target select and `Apply to ZONA` with section 9's `Store on ZONA`
  and PUT BACK beside them, every click the install store's own. Over
  budget, Apply is disabled before the click and the meter names the cause;
  nothing reaches the wire (install.spec.ts counts zero frames).

  A SURFACE SHARES AS A FILE (D-14 Q7; section 11): `Export as a file`
  beside Save copy goes through 13-13's transfer.ts unchanged - the same
  envelope My configs exports and imports - and a copy opened from My
  configs (`?from=<record id>`, minted onto a fresh surface id by /sandbox/)
  lands back on this route.

  PLAY ROUTES THE FINGER TO THE PREVIEW (PREV-04's third reach, after the
  intro's hero and the workspace). Entering Play builds a Lua engine
  running the surface's OWN emitted strings under the pinned library
  (preview.ts), registers it with this page's one SimHost under the plate,
  and the plate's wrapper hands every pointer sample to the host through
  touch.ts's mapAxis - tick-locked, one sample per contact per tick, as the
  workspace does. Structure is locked meanwhile (editor.ts section 3);
  selection and history survive the round trip and the spec asserts it in
  both directions. 13-20 decides whether the three reaches close PREV-04.

  KEYBOARD: Ctrl+Z / Cmd+Z undo and Ctrl+Shift+Z / Ctrl+Y redo from
  anywhere on the page that is not a text field (a field's own undo is the
  browser's). The plate and the list carry their own models
  (SurfaceEditor.svelte, ElementList.svelte).

  "Follow hardware selection" is not built: ZONA has one touch element
  (editor.ts section 3). Nothing on this page writes to a device except
  through the install store's clicks in the destination zone.

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
    MEASURING,
    MODE_EDIT,
    MODE_LINE_EDIT,
    MODE_LINE_PLAY,
    MODE_PLAY,
    MODE_PLAY_GLYPH,
    NEW_SURFACE,
    REDO,
    RENAME_SURFACE,
    ROOM_NONE,
    SAVE_COPY,
    SAVE_REFUSED,
    STARTER_ACTION,
    SUB_LINE,
    SURFACE_NAME,
    TEMPLATE_ACTION,
    TITLE,
    UNDO,
    copyName,
    exportedLine,
    overElementLine,
    renameSurfaceName,
    roomLine,
    savedLine,
  } from "$lib/sandbox/copy";
  import {
    mintSurfaceId,
    readSurfaceDraft,
    saveSurfaceDraft,
  } from "$lib/sandbox/draft";
  import {
    SandboxEditor,
    type EditorState,
    type Mode,
    type NumericField,
  } from "$lib/sandbox/editor";
  import { emptySurface } from "$lib/sandbox/model";
  import type { SurfaceCost } from "$lib/sandbox/cost";
  import type { SurfaceLanding } from "$lib/sandbox/land";
  import { SimHost } from "$lib/sim/host";
  import type { SimEngine } from "$lib/sim/engine";
  import { motionDeps } from "$lib/sim/motion.svelte";
  import { mapAxis } from "$lib/sim/touch";
  import { readCopy, saveCopy } from "$lib/store/library";
  import type { LocalStore } from "$lib/store/local";
  import { downloadExport, exportFile } from "$lib/store/transfer";
  import { meterView, type MeterView } from "$lib/tune/view";
  import BudgetMeter from "$lib/ui/BudgetMeter.svelte";
  import PadCanvas from "$lib/ui/PadCanvas.svelte";
  import ElementList from "$lib/ui/sandbox/ElementList.svelte";
  import Palette from "$lib/ui/sandbox/Palette.svelte";
  import RegionInspector from "$lib/ui/sandbox/RegionInspector.svelte";
  import SurfaceActions from "$lib/ui/sandbox/SurfaceActions.svelte";
  import SurfaceEditor from "$lib/ui/sandbox/SurfaceEditor.svelte";
  import Rail from "$lib/ui/shell/Rail.svelte";
  import { fillShell } from "$lib/ui/shell/shell.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  /**
   * THREE SLOTS SINCE 13-17 (13-CONTEXT D-18, D-19). The emitter, the meter,
   * the preview and the landing all measure against the slots the install
   * lands: the touch Timer and the system element's utility (255/4), which
   * HANGAR writes and PUT BACK restores. 13-16 held this at 2 with the
   * two-slot refusal rendered; the flip and the write are one commit.
   */
  const SLOTS = 3 as const;
  const SAVE_DEBOUNCE_MS = 250;
  const MEASURE_DEBOUNCE_MS = 120;
  const CONFIRM_MS = 4000;
  const PREVIEW_ID = "sandbox-preview";

  // ---------------------------------------------------------------------------
  // The model and its rendered state.

  let editor: SandboxEditor | undefined;
  let view = $state.raw<EditorState | undefined>(undefined);
  let draftLine = $state<string | undefined>(undefined);
  let cost = $state.raw<SurfaceCost | undefined>(undefined);
  let landing = $state.raw<SurfaceLanding | undefined>(undefined);
  let exported = $state<string | undefined>(undefined);
  let measuring = $state(true);
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
  let costOfSurface: typeof import("$lib/sandbox/cost").costOf | undefined;
  let landSurface: typeof import("$lib/sandbox/land").landSurface | undefined;

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

  /** Every change: the rendered state, the draft, the meter. */
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
  // The meter (cost.ts, measured).

  function scheduleMeasure(): void {
    if (measureTimer !== undefined) clearTimeout(measureTimer);
    measureTimer = setTimeout(() => void measure(), MEASURE_DEBOUNCE_MS);
  }

  /**
   * The meter and the landing, from one measurement. The landing is withdrawn
   * the instant the feed goes stale (`observeConfig(undefined)`), so a click
   * inside the debounce cannot write the previous surface's strings -
   * 07-RESEARCH Pitfall 5, the tuner's own discipline.
   */
  async function measure(): Promise<void> {
    measureTimer = undefined;
    if (editor === undefined || !mounted) return;
    const generation = (measureGeneration += 1);
    const surface = editor.surface;
    landing = undefined;
    install.observeConfig(undefined);
    try {
      costOfSurface ??= (await import("$lib/sandbox/cost")).costOf;
      landSurface ??= (await import("$lib/sandbox/land")).landSurface;
      const [measured, landed] = await Promise.all([
        costOfSurface(surface, { slots: SLOTS }),
        landSurface(surface, { slots: SLOTS }),
      ]);
      if (generation !== measureGeneration || !mounted) return;
      cost = measured;
      landing = landed;
      measuring = false;
      // An over-budget landing is never observed: Apply is disabled on the
      // refusal and the store is not told about strings it must not write.
      install.observeConfig(
        landed.refusal === undefined ? landed.config : undefined,
      );
    } catch {
      if (generation !== measureGeneration || !mounted) return;
      unavailable = true;
      measuring = false;
    }
  }

  const setupMeter = $derived<MeterView>(
    meterView(
      "setup",
      cost?.setup.used ?? 0,
      measuring ? "measuring" : "settled",
    ),
  );
  const timerMeter = $derived<MeterView>(
    meterView(
      "timer",
      cost?.timer.used ?? 0,
      measuring ? "measuring" : "settled",
    ),
  );

  /**
   * The over sentence when a string is over 908 - which one, by how much,
   * the way (land.ts's refusal, first in write order) - or undefined.
   */
  const refusal = $derived.by((): string | undefined => {
    const r = landing?.refusal;
    if (r === undefined) return undefined;
    return overElementLine(r.word, r.used, r.over);
  });

  /** "N of 908 · room for about M more", or which string is over and by how much. */
  const meterLine = $derived.by(() => {
    if (cost === undefined) return MEASURING;
    if (!cost.fits) {
      if (refusal !== undefined) return refusal;
      const over =
        cost.setup.used > cost.setup.limit
          ? (["Setup", cost.setup] as const)
          : cost.timer.used > cost.timer.limit
            ? (["Timer", cost.timer] as const)
            : (["Utility", cost.mapmode ?? cost.timer] as const);
      return overElementLine(
        over[0],
        over[1].used,
        over[1].used - over[1].limit,
      );
    }
    const used = Math.max(
      cost.setup.used,
      cost.timer.used,
      cost.mapmode?.used ?? 0,
    );
    return cost.roomFor === 0
      ? `${used} ${ROOM_NONE}`
      : roomLine(used, cost.roomFor);
  });

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

  /**
   * Export as a file (D-14 Q7; section 11): the surface as the record shape
   * 13-13 defined, through transfer.ts's own envelope and download - the
   * same door My configs opens, and no code of this route's own.
   */
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

  function onWindowKeyDown(event: KeyboardEvent): void {
    if (editor === undefined) return;
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) {
      return;
    }
    const meta = event.ctrlKey || event.metaKey;
    if (!meta) return;
    const key = event.key.toLowerCase();
    if (key === "z" && !event.shiftKey) {
      event.preventDefault();
      editor.undo();
    } else if ((key === "z" && event.shiftKey) || key === "y") {
      event.preventDefault();
      editor.redo();
    }
  }

  // ---------------------------------------------------------------------------
  // Mount: the store, the model, the host.

  /**
   * A saved copy, opened from My configs: `?from=<record id>` names a
   * sandbox record in the library, and its surface is loaded onto THIS
   * surface id (a fresh one, minted by /sandbox/) so the copy stays a copy
   * and the first edit writes a draft of its own. A draft under this id
   * wins over the query, so a return visit resumes the edits.
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
    cost = undefined;
    measuring = true;
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

  /* THE DESTINATION ZONE renders while a ZONA is connected (13-12's rule, the
     workspace's own): without a session the bar says "Preview without
     hardware" on its own. */
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

<!-- The context bar's destination zone (13-12; 13-17): the page target, Apply to ZONA, Store on ZONA, PUT BACK. -->
{#snippet destination()}
  <SurfaceActions
    zone="destination"
    {name}
    config={landing?.config}
    {refusal}
  />
{/snippet}

{#snippet meter()}
  <div class="meters" data-testid="surface-meters" aria-busy={measuring}>
    <BudgetMeter view={setupMeter} />
    <BudgetMeter view={timerMeter} />
    <p
      class="meter-line type-helper"
      class:over={cost !== undefined && !cost.fits}
      data-testid="meter-line"
    >
      {meterLine}
    </p>
  </div>
{/snippet}

{#snippet inspector()}
  {#if view !== undefined}
    <RegionInspector
      {view}
      onrename={(next) => editor?.rename(next)}
      {onnumber}
      oncommit={() => editor?.commitField()}
      onkind={(kind) => void editor?.setKind(kind)}
      onorientation={(o) => void editor?.setOrientation(o)}
      onlatch={(latch) => editor?.setLatch(latch)}
      oncolour={(colour) => editor?.setColour(colour)}
      onduplicate={duplicate}
      ondelete={remove}
      {notice}
      {meter}
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
        <div class="mode-block">
          <!-- The two-segment switch: a radiogroup of two real radios in labels, one tab stop. -->
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
          <!-- The persistent, visible mode label (section 8). -->
          <p
            class="mode-line type-helper"
            id="sandbox-mode-line"
            data-testid="mode-line"
          >
            {play ? MODE_LINE_PLAY : MODE_LINE_EDIT}
          </p>
        </div>
      </div>
      <p class="sentence">{SUB_LINE}</p>
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
        <SurfaceActions
          zone="share"
          {name}
          {exported}
          onexport={export_surface}
        />
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

  .title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }

  .name-block {
    display: flex;
    align-items: baseline;
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

  .sentence {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 17px;
    line-height: 1.45;
    color: var(--color-ink-quiet);
  }

  .mode-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }

  /* PDF page 3's two-segment switch: two outlined boxes, the active one in the action colour. Square (D-01). */
  .mode {
    display: flex;
    gap: 12px;
  }

  .segment {
    display: inline-flex;
    align-items: center;
    gap: 8px;
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
    text-align: end;
  }

  .tools {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .history,
  .save {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .saved {
    color: var(--color-ink-quiet);
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

  .meters {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .meter-line {
    margin: 8px 0 0;
    color: var(--color-ink-quiet);
  }

  /* The refusal: the error ink, section 12's validation ink, on the sentence that names the string. */
  .meter-line.over {
    color: var(--color-error-ink);
  }
</style>
