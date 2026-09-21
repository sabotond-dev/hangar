<!--
  /sandbox/{id}/ - the Sandbox: PDF page 3 on the shell (13-16; Bible sections 2, 8, 14, 16;
  BUILD-01/02/06/07/08, PREV-04, KEEP-01). Three snippets handed to the shell: the rail (Palette,
  ElementList, `+ New surface`), the tool rail (ToolRail, change 15: Undo, Redo, Save copy, the
  exports and the import, the transforms, the view toggles, the sheet's box - icon-only beside the
  inspector) and the inspector (RegionInspector); the centre is the name row with the Edit / Play
  switch and the plate. One model: src/lib/sandbox/editor.ts; this route keeps the one EditorState
  in raw state and owns the stores, the landing, the preview, the frame, the window's key listener
  (the hotkeys, V / Escape, Delete, Ctrl/Cmd + C X V D A L, ? - never in a text field), the plate's
  menu, the recent colours, the Play monitor and the Grid Editor profile file (13C). The landing is
  land.ts's under the pinned minifier with SLOTS 5 to install.observeConfig; Play runs the surface's own strings.
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
    DEFAULTS_RESET_LINE,
    DEFAULT_SURFACE_NAME,
    DRAFT_SAVED,
    DRAFT_UNSAVED,
    DUPLICATE_AT_CAP,
    DUPLICATE_NO_SPACE,
    EMPTY_INSTRUCTION,
    EMPTY_SECOND_LINE,
    EYEBROW_SANDBOX,
    FLIPPED_HORIZONTAL,
    FLIPPED_VERTICAL,
    MODE_EDIT,
    MODE_LINE_EDIT,
    MODE_LINE_PLAY,
    MODE_PLAY,
    MODE_PLAY_GLYPH,
    NEW_SURFACE,
    NOTHING_TO_PASTE,
    RENAME_SURFACE,
    ROTATED,
    SAVE_REFUSED,
    STARTER_ACTION,
    SUB_LINE,
    SURFACE_NAME,
    TEMPLATE_ACTION,
    TITLE,
    TOO_FULL_TO_STORE,
    alignedLine,
    copiedLine,
    copyName,
    cutLine,
    duplicatedLine,
    elementsLine,
    exportedLine,
    lockedLine,
    pastedLine,
    renameSurfaceName,
    savedLine,
    spacedLine,
    unlockedLine,
  } from "$lib/sandbox/copy";
  import { readClipboard, writeClipboard } from "$lib/sandbox/clipboard";
  import { conflictedIds, findConflicts } from "$lib/sandbox/conflicts";
  import { menuItems, type MenuAction } from "$lib/sandbox/menu";
  import { isMacPlatform, platformOf } from "$lib/sandbox/shortcuts";
  import type { RailBoxId } from "$lib/sandbox/tool-rail";
  import {
    EXPORT_PROFILE_MEASURING,
    EXPORT_PROFILE_OVER,
    importedLine,
    profileExportedLine,
    surfaceDescription,
  } from "$lib/share/profile-copy";
  import { midiLogOf } from "$lib/sim/monitor";
  import {
    mintSurfaceId,
    readSurfaceDraft,
    saveSurfaceDraft,
  } from "$lib/sandbox/draft";
  import {
    SELECTOR_KEY,
    SandboxEditor,
    kindForKey,
    type CommandOutcome,
    type EditorState,
    type Mode,
    type NumericField,
  } from "$lib/sandbox/editor";
  import type {
    Alignment,
    Axis,
    SurfaceTransform,
  } from "$lib/sandbox/geometry";
  import { emptySurface } from "$lib/sandbox/model";
  import type { SurfaceLanding } from "$lib/sandbox/land";
  import { SimHost } from "$lib/sim/host";
  import type { SimEngine } from "$lib/sim/engine";
  import { motionDeps } from "$lib/sim/motion.svelte";
  import { mapAxis } from "$lib/sim/touch";
  import { readCopy, saveCopy } from "$lib/store/library";
  import type { LocalStore } from "$lib/store/local";
  import {
    readSandboxDefaults,
    resetSandboxDefaults,
    writeSandboxDefaults,
  } from "$lib/store/sandbox-defaults";
  import {
    readRecentColours,
    rememberColour,
    writeRecentColours,
  } from "$lib/store/sandbox-colours";
  import { readSandboxView, writeSandboxView } from "$lib/store/sandbox-view";
  import {
    DEFAULT_VIEW,
    NO_COLOURS,
    type RecentColours,
    type SandboxDefaults,
    type SandboxView,
    type Surface,
  } from "$lib/store/schema";
  import {
    downloadExport,
    downloadText,
    exportFile,
  } from "$lib/store/transfer";
  import PadCanvas from "$lib/ui/PadCanvas.svelte";
  import ElementList from "$lib/ui/sandbox/ElementList.svelte";
  import Palette from "$lib/ui/sandbox/Palette.svelte";
  import PlayMonitor from "$lib/ui/sandbox/PlayMonitor.svelte";
  import RegionInspector from "$lib/ui/sandbox/RegionInspector.svelte";
  import DestinationZone from "$lib/ui/DestinationZone.svelte";
  import ShortcutSheet from "$lib/ui/sandbox/ShortcutSheet.svelte";
  import SurfaceEditor from "$lib/ui/sandbox/SurfaceEditor.svelte";
  import ToolRail from "$lib/ui/sandbox/ToolRail.svelte";
  import Rail from "$lib/ui/shell/Rail.svelte";
  import { fillShell } from "$lib/ui/shell/shell.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  /** Five slots since change 10B: the touch Timer, the system element's utility (255/4) and the two trimmed system halves (land.ts's LANDING_SLOTS). */
  const SLOTS = 5 as const;
  const SAVE_DEBOUNCE_MS = 250;
  const MEASURE_DEBOUNCE_MS = 120;
  const CONFIRM_MS = 4000;
  /** A colour joins the recent strip once the swatch has rested this long (a drag through the picker is one colour). */
  const RECENT_DEBOUNCE_MS = 300;
  const PREVIEW_ID = "sandbox-preview";

  /** A surface imported from a profile (13C), handed to the next open() of its id when the store refused the draft. */
  let pendingImport: Surface | undefined;

  // ---------------------------------------------------------------------------
  // The model and its rendered state.

  let editor: SandboxEditor | undefined;
  let view = $state.raw<EditorState | undefined>(undefined);
  let draftLine = $state<string | undefined>(undefined);
  let landing = $state.raw<SurfaceLanding | undefined>(undefined);
  let notice = $state<string | undefined>(undefined);
  /** A command's outcome on the plate's status line (change 13A): the clipboard's, the lock's, a refusal; cleared by the next change. Since change 15 the rail's outcomes too (Save copy, the exports, the import), cleared after CONFIRM_MS. */
  let plateNotice = $state<string | undefined>(undefined);
  let unavailable = $state(false);
  let renaming = $state(false);
  /** Change 13C: the shortcut sheet, the view toggles, the recent colours, the clipboard's state for the menu, the platform. */
  let sheetOpen = $state(false);
  let viewPrefs = $state.raw<SandboxView>(DEFAULT_VIEW);
  let recent = $state.raw<RecentColours>(NO_COLOURS);
  let clipboardHeld = $state(false);
  let mac = $state(false);
  /** The control that opened the sheet, so Close returns focus to it. */
  let sheetOpener: HTMLElement | undefined;

  // Plain bindings, outside the reactive graph (04-RESEARCH, Pitfall 3).
  let host: SimHost | undefined;
  let engine: SimEngine | undefined;
  let canvas: HTMLCanvasElement | undefined;
  let mounted = false;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  let measureTimer: ReturnType<typeof setTimeout> | undefined;
  let outcomeTimer: ReturnType<typeof setTimeout> | undefined;
  let recentTimer: ReturnType<typeof setTimeout> | undefined;
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

  /** The clipboard's second home (change 13A): the session store, so a reload in this tab keeps it. */
  function sessionStore(): LocalStore | undefined {
    if (!browser) return undefined;
    try {
      return window.sessionStorage;
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
  /** The plate's menu for the state (13C, menu.ts), the shared-controller pairs and their members' ids (conflicts.ts). */
  const menu = $derived(
    view === undefined ? [] : menuItems(view, clipboardHeld),
  );
  const conflicts = $derived(
    view === undefined ? [] : findConflicts(view.surface.regions),
  );
  const conflictIds = $derived(conflictedIds(conflicts));
  /** Why Export for Grid Editor cannot run now: the landing still measuring, or over the budget. */
  const exportReason = $derived(
    landing === undefined
      ? EXPORT_PROFILE_MEASURING
      : landing.refusal !== undefined
        ? EXPORT_PROFILE_OVER
        : undefined,
  );

  /** Every change: the rendered state, the draft, the landing. */
  function onchange(state: EditorState): void {
    const before = view;
    view = state;
    notice = undefined;
    plateNotice = undefined;
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

  /** Duplicate, the panel's button and Ctrl+D: the copies land by the paste's rule; a refusal on the panel and the plate. */
  function duplicate(): void {
    if (editor === undefined) return;
    const result = editor.duplicate();
    if (result.ok) {
      plateNotice = duplicatedLine(result.regions.length);
      return;
    }
    notice = result.reason === "cap" ? DUPLICATE_AT_CAP : DUPLICATE_NO_SPACE;
    plateNotice = notice;
  }

  /** A command's refusal goes to the plate's status line; done says nothing here. */
  function tell(outcome: CommandOutcome, done: (n: number) => string): void {
    if (outcome.kind === "refused") plateNotice = outcome.message;
    else if (outcome.kind === "done") plateNotice = done(outcome.count);
  }

  function remove(): void {
    if (editor === undefined) return;
    const outcome = editor.remove();
    if (outcome.kind === "refused") plateNotice = outcome.message;
  }

  function removeById(id: string): void {
    if (editor === undefined) return;
    editor.select(id);
    remove();
  }

  /** Ctrl+C: the set to the clipboard, in memory and the session store. */
  function copy(): void {
    const content = editor?.copySelection();
    if (content === undefined) return;
    writeClipboard(sessionStore(), content);
    clipboardHeld = true;
    plateNotice = copiedLine(content.regions.length);
  }

  /** Ctrl+X: the copy, then the delete under `cut` - one Undo. */
  function cut(): void {
    if (editor === undefined) return;
    const content = editor.copySelection();
    if (content === undefined) return;
    const outcome = editor.remove("cut");
    if (outcome.kind === "done") {
      writeClipboard(sessionStore(), content);
      clipboardHeld = true;
    }
    tell(outcome, cutLine);
  }

  /** Ctrl+V: the clipboard's regions by the placement rule. */
  function paste(): void {
    if (editor === undefined) return;
    const content = readClipboard(sessionStore());
    if (content === undefined) {
      plateNotice = NOTHING_TO_PASTE;
      return;
    }
    tell(editor.paste(content), pastedLine);
  }

  /** The Arrange row (change 13B): the set aligned or spaced out; the outcome on the plate's status line. */
  function align(to: Alignment): void {
    if (editor !== undefined) tell(editor.alignSelected(to), alignedLine);
  }

  function distribute(axis: Axis): void {
    if (editor !== undefined) tell(editor.distributeSelected(axis), spacedLine);
  }

  /** The surface's three transforms (change 13B): the outcome names the transform; a refusal its line. */
  function transform(kind: SurfaceTransform): void {
    if (editor === undefined) return;
    const outcome = editor.transformSurface(kind);
    if (outcome.kind === "refused") plateNotice = outcome.message;
    else if (outcome.kind === "done")
      plateNotice =
        kind === "flip-horizontal"
          ? FLIPPED_HORIZONTAL
          : kind === "flip-vertical"
            ? FLIPPED_VERTICAL
            : ROTATED;
  }

  /** The remembered defaults (change 13B): the editor's every change goes to the store; an empty envelope removes the key. */
  function ondefaults(defaults: SandboxDefaults): void {
    if (Object.keys(defaults.kinds).length === 0) resetSandboxDefaults(local());
    else writeSandboxDefaults(local(), defaults);
  }

  /** Reset defaults, one click: not an entry, so the panel says so and the notice stays until the next change. */
  function resetDefaults(): void {
    if (editor === undefined) return;
    editor.resetDefaults();
    notice = DEFAULTS_RESET_LINE;
  }

  /** Ctrl+L: the set locks, or unlocks when every member is locked. */
  function toggleLock(): void {
    const outcome = editor?.toggleLock();
    if (outcome === undefined) return;
    plateNotice = outcome.locked
      ? lockedLine(outcome.count)
      : unlockedLine(outcome.count);
  }

  /** The plate's menu (13C): every item is one of the commands above; Rename is the plate's own. */
  function menuAction(action: MenuAction): void {
    if (editor === undefined) return;
    switch (action) {
      case "cut":
        cut();
        break;
      case "copy":
        copy();
        break;
      case "paste":
        paste();
        break;
      case "duplicate":
        duplicate();
        break;
      case "delete":
        remove();
        break;
      case "lock":
        toggleLock();
        break;
      case "select-every":
        editor.selectAll();
        break;
      case "arrange-left":
        align("left");
        break;
      case "arrange-right":
        align("right");
        break;
      case "arrange-top":
        align("top");
        break;
      case "arrange-bottom":
        align("bottom");
        break;
      case "arrange-centre-x":
        align("centre-x");
        break;
      case "arrange-centre-y":
        align("centre-y");
        break;
      case "space-horizontal":
        distribute("horizontal");
        break;
      case "space-vertical":
        distribute("vertical");
        break;
      case "rename":
        break;
    }
  }

  /** A view toggle (13C): kept per viewer, never in the draft. */
  function toggleView(which: "numbers" | "names", on: boolean): void {
    viewPrefs = { ...viewPrefs, [which]: on };
    writeSandboxView(local(), viewPrefs);
  }

  /** The swatch's colour on the set (the editor's setColour), and the recent strip once the picker rests. */
  function colour(next: readonly [number, number, number]): void {
    editor?.setColour(next);
    if (recentTimer !== undefined) clearTimeout(recentTimer);
    recentTimer = setTimeout(() => {
      recentTimer = undefined;
      const remembered = rememberColour(recent, next);
      if (remembered === recent) return;
      recent = remembered;
      writeRecentColours(local(), recent);
    }, RECENT_DEBOUNCE_MS);
  }

  /** The shortcut sheet (13C): opened by ? or the toolbar's box, closed by Escape, Close or the scrim; focus returns to the opener. */
  function openSheet(opener?: HTMLElement): void {
    sheetOpener =
      opener ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : undefined);
    sheetOpen = true;
  }

  function closeSheet(): void {
    sheetOpen = false;
    sheetOpener?.focus();
    sheetOpener = undefined;
  }

  /** A rail outcome on the plate's status line (change 15) for CONFIRM_MS, unless something else has written the line since. */
  function say(line: string): void {
    plateNotice = line;
    if (outcomeTimer !== undefined) clearTimeout(outcomeTimer);
    outcomeTimer = setTimeout(() => {
      outcomeTimer = undefined;
      if (plateNotice === line) plateNotice = undefined;
    }, CONFIRM_MS);
  }

  /** The rail's action boxes (change 15): every one a call the keys or the rows already made. */
  function railAction(id: RailBoxId): void {
    switch (id) {
      case "undo":
        editor?.undo();
        return;
      case "redo":
        editor?.redo();
        return;
      case "save-copy":
        save_copy();
        return;
      case "export-surface":
        export_surface();
        return;
      case "export-profile":
        void exportProfile();
        return;
      case "flip-horizontal":
      case "flip-vertical":
        transform(id);
        return;
      case "turn-surface":
        transform("rotate");
        return;
      default:
        return;
    }
  }

  /**
   * Export for Grid Editor (13C): the landing's five strings - exactly what Store writes - as the
   * Editor's own profile file, the element count line as its description, and the surface's
   * Export-as-a-file envelope riding under the `hangar` key so Import a profile can open it.
   */
  async function exportProfile(): Promise<void> {
    if (editor === undefined || landing === undefined) return;
    if (landing.refusal !== undefined) return;
    const surface = editor.surface;
    const strings = landing.config;
    const { buildProfile, profileFileName, serialiseProfile } = await import(
      "$lib/share/profile"
    );
    if (!mounted) return;
    const at = new Date().toISOString();
    const profile = buildProfile({
      id: crypto.randomUUID(),
      name: surface.name,
      description: surfaceDescription(elementsLine(surface.regions.length)),
      strings,
      at,
      hangar: exportFile(
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
    });
    const fileName = downloadText(
      profileFileName(surface.name),
      serialiseProfile(profile),
    );
    say(profileExportedLine(fileName));
  }

  /**
   * Import a profile (13C): a profile HANGAR exported opens as a NEW surface under a fresh id -
   * the draft written first, the surface held for open() in case the store refused - and a
   * profile made elsewhere is refused with its line.
   */
  async function importProfile(text: string): Promise<void> {
    const { readProfile } = await import("$lib/share/profile");
    if (!mounted) return;
    const at = new Date().toISOString();
    const found = readProfile(text, at);
    if (found.kind === "refused") {
      say(found.reason);
      return;
    }
    const id = mintSurfaceId();
    const surface: Surface = { ...found.surface, id };
    pendingImport = surface;
    saveSurfaceDraft(local(), surface, at);
    await goto(resolve("/sandbox/[draftId]", { draftId: id }));
    say(importedLine(surface.name));
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
    say(
      outcome === "written" ? savedLine(copyName(surface.name)) : SAVE_REFUSED,
    );
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
    say(exportedLine(fileName));
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
   * The window's keys (change 10A): Ctrl/Cmd+Z and +Y as before; since change 13A Ctrl/Cmd+C, X,
   * V, D copy, cut, paste and duplicate the set, +A selects every unlocked element, +L toggles
   * the lock; a kind's hotkey arms it (HOTKEYS), V returns to the selector, Escape the selector
   * or the selection cleared, Delete or Backspace deletes the selection. Never while a text
   * field, a text area or a select has focus (a name field typing "f" arms nothing; Ctrl+C in a
   * field stays the browser's), never with Alt held, and never for a key the plate or the list
   * already handled (defaultPrevented).
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
    // The sheet (13C) is modal: Escape closes it and every other key waits.
    if (sheetOpen) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSheet();
      }
      return;
    }
    if (event.key === "?" && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      openSheet();
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
      } else if (key === "c") {
        event.preventDefault();
        copy();
      } else if (key === "x") {
        event.preventDefault();
        cut();
      } else if (key === "v") {
        event.preventDefault();
        paste();
      } else if (key === "d") {
        event.preventDefault();
        duplicate();
      } else if (key === "a") {
        event.preventDefault();
        editor.selectAll();
      } else if (key === "l") {
        event.preventDefault();
        toggleLock();
      }
      return;
    }
    if (event.altKey) return;
    if (key === "escape") {
      event.preventDefault();
      editor.escape();
      return;
    }
    if (key === SELECTOR_KEY) {
      event.preventDefault();
      editor.cancel();
      return;
    }
    if (key === "delete" || key === "backspace") {
      event.preventDefault();
      remove();
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
    const imported = pendingImport?.id === id ? pendingImport : undefined;
    pendingImport = undefined;
    const stored =
      readSurfaceDraft(store, id) ?? imported ?? fromCopy(store, id);
    const surface = stored ?? emptySurface(id, DEFAULT_SURFACE_NAME);
    editor = new SandboxEditor(surface, {
      onchange,
      defaults: readSandboxDefaults(store),
      ondefaults,
    });
    view = editor.state();
    draftLine = stored === undefined ? undefined : DRAFT_SAVED;
    notice = undefined;
    scheduleMeasure();
  }

  onMount(() => {
    mounted = true;
    host = new SimHost(motionDeps());
    window.addEventListener("keydown", onWindowKeyDown);
    // Change 13C: the platform's words, the clipboard's state, the view toggles and the recent colours.
    mac = isMacPlatform(platformOf(navigator));
    clipboardHeld = readClipboard(sessionStore()) !== undefined;
    viewPrefs = readSandboxView(local());
    recent = readRecentColours(local());
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
    if (outcomeTimer !== undefined) clearTimeout(outcomeTimer);
    if (recentTimer !== undefined) clearTimeout(recentTimer);
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

  /* The shell: SANDBOX current, the breadcrumb, the draft's clause, the device's, the destination, the rail, the tool rail and the inspector. */
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
      tools,
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
        selection={view.selection}
        onselect={(id, shift) =>
          shift ? editor?.toggleSelect(id) : editor?.select(id)}
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

<!-- The tool rail (change 15): the shell's column between the plate and the inspector; its outcomes go to the plate's status line. -->
{#snippet tools()}
  {#if view !== undefined}
    <ToolRail
      {play}
      {empty}
      canUndo={view.canUndo}
      canRedo={view.canRedo}
      {exportReason}
      numbers={viewPrefs.numbers}
      names={viewPrefs.names}
      {mac}
      describedBy="sandbox-mode-line"
      onaction={railAction}
      ontoggle={toggleView}
      onimport={(text) => void importProfile(text)}
      onshortcuts={(opener) => openSheet(opener)}
    />
  {/if}
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
      ontouches={(touches) => void editor?.setTouches(touches)}
      onlocked={(locked) => editor?.setLocked(locked)}
      oncolour={colour}
      onbrightness={(next) => editor?.setBrightness(next)}
      onalign={align}
      ondistribute={distribute}
      onresetdefaults={resetDefaults}
      onduplicate={duplicate}
      ondelete={remove}
      {notice}
      recentColours={recent.colours}
      {conflicts}
      {mac}
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

    <div class="centre">
      <SurfaceEditor
        {view}
        onclick={(col, row, shift, alt) =>
          void editor?.clickCell(col, row, shift, alt)}
        onmarquee={(box, add) => void editor?.selectTouching(box, add)}
        onmove={(dc, dr) => editor?.moveFocus(dc, dr)}
        onmark={(fill) => void editor?.mark(fill)}
        oncancel={() => editor?.escape()}
        ondelete={remove}
        onselectnext={(step) => void editor?.selectNext(step)}
        onrename={(id, next) => void editor?.renameElement(id, next)}
        onfocuscell={(cell) => editor?.setFocus(cell)}
        menuItems={menu}
        onmenu={menuAction}
        {mac}
        show={viewPrefs}
        conflicts={conflictIds}
        notice={plateNotice}
        onresize={(box) => editor?.resizeSelectedTo(box)}
        onmoveto={(cell) => editor?.moveSelectedTo(cell)}
        onnudge={(dc, dr) => editor?.nudgeSelected(dc, dr)}
        onresizeby={(dw, dh) => editor?.resizeSelectedBy(dw, dh)}
        oncommit={() => editor?.commitField()}
        {onfinger}
        preview={play ? preview : undefined}
      />

      <!-- The MIDI monitor in Play (13C): the newest twelve messages the preview engine sent. -->
      {#if play}
        <PlayMonitor source={() => midiLogOf(engine)} />
      {/if}

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

{#if sheetOpen}
  <ShortcutSheet {mac} onclose={closeSheet} />
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

  /* Outlined controls (the rail's + New surface): the boundary token, square, 44px on both axes. */
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
