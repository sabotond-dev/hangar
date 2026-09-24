<!--
  /playground/{id}/ - the workspace: PDF page 5 on the shell (13-09; at /c/{id}/ until 13-08, D-20).
  Hands the shell three snippets - the rail (CONFIGURATIONS, `All configs`, one row per nearby entry,
  `Save a copy` pinned), the inspector (TuningRegion.svelte, the schema renderer) and the destination
  (DestinationZone.svelte, the one component both routes mount, 13.1-06) - and `device: install.phase`.
  Nearby is the browse-return set if there is one, else the front-door membership; this entry is always in it.
  Play routes the pointer to the preview through the host's tick-locked delivery (PREV-04's second half);
  MidiMonitor mounts inside `{#if listed.preview === "lua"}` only (13-10, D-14 Q4b) - and on every card while
  Mirror ZONA is on (change 20, docs/MIRROR.md): the plate then holds the mirror's engine under the entry's id,
  the monitor reads the module's own MIDI, the pointer is ignored and the status line replaces the readout.
  The stamp lands after the engine is built and before the inspector mounts (`arrived`); never a partial restore.
  The compiler and the simulator arrive through `await import()` and never statically: config-shape.spec.ts
  test 13 walks this file for a `from` specifier naming them and test 14 the built page (the one rule).
  Decided at 13-09 / 13-12 / 13.1-06 (13-CONTEXT D-06, D-20; 13.1-CONTEXT D-05, D-06); see .planning/phases/13.1-bench-corrections-four/13.1-06-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { browser } from "$app/environment";
  import { beforeNavigate } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { onDestroy, onMount, untrack } from "svelte";
  import { FEELS_TERMS, FOR_TERMS, LEGACY_TAG_MAP } from "$lib/browse/facets";
  import { filterListing } from "$lib/browse/filter";
  import { forLabel } from "$lib/browse/labels";
  import { parseBrowseQuery, type BrowseVocabulary } from "$lib/browse/query";
  import {
    clearBrowseReturn,
    readBrowseReturn,
    type ReturnStore,
  } from "$lib/browse/return";
  import { sortListing } from "$lib/browse/sort";
  import { typographic } from "$lib/browse/typographic";
  import { FRONT_DOOR } from "$lib/catalog/front-door";
  import { LISTING, listingById } from "$lib/catalog/listing";
  import { install } from "$lib/device/install.svelte";
  import { session } from "$lib/device/session.svelte";
  import {
    MIRROR_CANNOT,
    MIRROR_MONITOR_EMPTY,
    MIRROR_MONITOR_SOURCE,
    MIRROR_MONITOR_STATUS,
    mirrorStatus,
  } from "$lib/mirror/copy";
  import { mirror } from "$lib/mirror/mirror.svelte";
  // Every specifier here is safe under config-shape.spec.ts test 13: none names
  // the vendored tree, the protocol package nor the compile surface. The image
  // renderer is deliberately NOT imported - it is node-only - so 1200 and 630
  // appear below as literals beside the sizes it uses.
  import type { Landing } from "$lib/share/stamp";
  import { SITE_ORIGIN, shareUrl } from "$lib/share/url";
  import type { SimEngine } from "$lib/sim/engine";
  import { SimHost } from "$lib/sim/host";
  import { midiLogOf } from "$lib/sim/monitor";
  import { motionDeps } from "$lib/sim/motion.svelte";
  import { mapAxis } from "$lib/sim/touch";
  import { brightnessOf } from "$lib/catalog/brightness";
  import type { LocalStore } from "$lib/store/local";
  import {
    EXPORT_PROFILE,
    EXPORT_PROFILE_HELPER,
    EXPORT_PROFILE_MEASURING,
    PROFILE_EXPORTED,
    configDescription,
  } from "$lib/share/profile-copy";
  import { readCopy, saveCopy } from "$lib/store/library";
  import type { PlaygroundRecord } from "$lib/store/schema";
  import { touchRecent } from "$lib/store/recent";
  import { ogAlt } from "$lib/tune/copy";
  import {
    EXPLORE,
    MATRIX_LINE,
    MODE_CONFIGURE,
    MODE_PLAY,
    MODE_PLAY_GLYPH,
    RAIL_TITLE,
    SAVE_A_COPY,
    SAVE_A_COPY_GLYPH,
    SAVE_COPY,
    SHARE_SNAPSHOT,
    coordinateLine,
    workspaceTitle,
  } from "$lib/tune/inspector-copy";
  import BrowseLink from "$lib/ui/BrowseLink.svelte";
  import CopyLink from "$lib/ui/CopyLink.svelte";
  import DestinationZone from "$lib/ui/DestinationZone.svelte";
  import FidelityLine from "$lib/ui/FidelityLine.svelte";
  import MidiMonitor from "$lib/ui/MidiMonitor.svelte";
  import MirrorToggle from "$lib/ui/MirrorToggle.svelte";
  import PadCanvas from "$lib/ui/PadCanvas.svelte";
  import PadFrame from "$lib/ui/PadFrame.svelte";
  import TuningRegion from "$lib/ui/TuningRegion.svelte";
  import Rail, { type RailRow } from "$lib/ui/shell/Rail.svelte";
  import { SURFACE_MAX } from "$lib/ui/shell/layout";
  import { fillShell } from "$lib/ui/shell/shell.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  /* Visitor-facing copy, in one block. 04-UI-SPEC, Routes and deep links. */
  const SITE = "HANGAR";
  /** An address nobody has heard of. Ledgered (13-09): the shelf it named is gone. */
  const UNKNOWN_NOTICE =
    "There’s no configuration at this address. Pick one from the list.";
  const SHELF_DESCRIPTION =
    "A shelf of ZONA configurations, every one of them running live in the firmware’s own simulator.";
  /** The saved copy's confirmed label - library.ts's own permitted word ON A COPY. Ledgered. */
  const SAVED_COPY = "Saved copy";
  /** The copy's name: the entry's, marked. Ledgered; 13-13's rename owns the rest. */
  const copyName = (name: string) => `${name} copy`;
  const CONFIRM_MS = 2000;

  /* The head's fixed half (05-UI-SPEC, The OG image): twitter:card makes Discord render a large embed.
     Every value is a const, not inline markup text, because Prettier reflows element text. */
  const OG_TYPE = "website";
  const OG_IMAGE_TYPE = "image/png";
  const OG_IMAGE_WIDTH = "1200";
  const OG_IMAGE_HEIGHT = "630";
  const TWITTER_CARD = "summary_large_image";

  /* The one prefix the record survives a departure to - the gallery and every
     workspace live under it (D-20). Pathname only - this route is prerendered
     too, and page.url.search throws while it is. */
  const PLAYGROUND_PREFIX = "/playground/";

  /** The closed vocabulary the return record's query is parsed against. */
  const VOCABULARY: BrowseVocabulary = {
    for: FOR_TERMS,
    feels: FEELS_TERMS,
    legacy: LEGACY_TAG_MAP,
  };

  /** undefined when the address names nothing in the catalog. */
  const listed = $derived(data.index === -1 ? undefined : LISTING[data.index]);
  const title = $derived(workspaceTitle(listed?.name, SITE));
  const description = $derived(listed?.description ?? SHELF_DESCRIPTION);
  /** The FOR label for the eyebrow: EXPLORE / MODULATION. */
  const category = $derived(
    listed === undefined ? "" : forLabel(listed.tags[0]),
  );

  /* An address nobody has heard of must not claim to be a configuration, and
     must not produce /og/undefined.png either. It unfurls as the shelf, on the
     opening centre's picture - the same choice / makes. */
  const OPENING = FRONT_DOOR[0];
  const ogEntry = $derived(listed ?? OPENING);
  const ogUrl = $derived(
    listed === undefined
      ? `${SITE_ORIGIN}/`
      : `${SITE_ORIGIN}/playground/${listed.id}/`,
  );
  const ogImage = $derived(`${SITE_ORIGIN}/og/${ogEntry.id}.png`);
  const ogImageAlt = $derived(ogAlt(ogEntry.name));

  // ---------------------------------------------------------------------------
  // The rail.

  /** The ids of the browse view the visitor left, from the record's query; undefined when there is none. */
  let returnIds: readonly string[] | undefined = $state(undefined);

  /** Nearby: the return set, else the front-door membership; this entry always in it. */
  const nearbyIds = $derived.by(() => {
    const set = returnIds ?? FRONT_DOOR.map((entry) => entry.id);
    if (listed === undefined || set.includes(listed.id)) return set;
    return [listed.id, ...set];
  });

  const rows = $derived<readonly RailRow[]>(
    nearbyIds.flatMap((id, at) => {
      const entry = listingById(id);
      if (entry === undefined) return [];
      return [
        {
          id,
          label: entry.name,
          index: at + 1,
          href: resolve("/playground/[id]", { id }),
        },
      ];
    }),
  );

  // ---------------------------------------------------------------------------
  // The surface, the host and the finger (PREV-04, second half).

  /* stamp.ts's own union as a type import (erased, so not a specifier the chunk guard can see). */
  const NO_LANDING: Landing = { kind: "none" };

  let mode: "configure" | "play" = $state("configure");
  /** The engine is registered and the stamp has landed: the inspector may mount. */
  let arrived = $state(false);
  let ready = $state(false);
  let unavailable = $state(false);
  /** The last finger the surface delivered, for the PDF's X / Y readout. */
  let point = $state({ x: 0, y: 0 });
  /** Knob id to index for THIS entry, held here so the tuner can be re-keyed. */
  let knobIndices: Record<string, number> = $state({});
  /** The brightness (change 5), 1..255: opened from a saved copy's field (`?from=`), reported by the region, saved with the copy. Never in the stamp. */
  let brightness = $state(255);
  let landing: Landing = $state(NO_LANDING);
  /** The reason a disabled Apply to ZONA gives, or undefined when in budget. */
  let overBudgetReason: string | undefined = $state(undefined);
  let configStrings:
    | {
        systemTimer: string;
        system: string;
        systemUtility: string;
        setup: string;
        timer: string;
      }
    | undefined = $state(undefined);
  let shareStamp: string | undefined = $state(undefined);
  let saved = $state(false);
  /** Export for Grid Editor's confirmation (change 13C), for CONFIRM_MS. */
  let exportedProfile = $state(false);
  let exportTimer: ReturnType<typeof setTimeout> | undefined;
  /** Why the export cannot run now: the tuner still measuring, or a string over the budget. */
  const exportReason = $derived(
    overBudgetReason ??
      (configStrings === undefined ? EXPORT_PROFILE_MEASURING : undefined),
  );

  // Plain bindings, deliberately outside the reactive graph (04-RESEARCH, Pitfall 3).
  let host: SimHost | undefined;
  let engine: SimEngine | undefined;
  let canvas: HTMLCanvasElement | undefined;
  let mounted = false;
  /** Which open() is current; a late engine for a previous id is dropped. */
  let generation = 0;
  let region: ReturnType<typeof TuningRegion> | undefined = $state(undefined);
  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  /** The session store, or undefined. /playground/ guards it exactly this way. */
  function store(): ReturnStore | undefined {
    if (!browser) return undefined;
    try {
      return window.sessionStorage;
    } catch {
      return undefined;
    }
  }

  /** The route's edge to the browser store, one per route (13.2-CONTEXT D-15). */
  function local(): LocalStore | undefined {
    if (!browser) return undefined;
    try {
      return window.localStorage;
    } catch {
      return undefined;
    }
  }

  /**
   * A saved copy opened from My configs carries its brightness in the record, not the stamp (the
   * stamp is knob indices and colours only; a shared link lands at 255): the link names the record
   * (`?from=<record id>`, the Sandbox's 13-17 shape) and the field is read here, for THIS entry only.
   */
  function fromCopyBrightness(id: string): number {
    const from = page.url.searchParams.get("from");
    if (from === null) return 255;
    const record = readCopy(local(), from);
    if (record === undefined || record.kind !== "playground") return 255;
    if (record.source !== id) return 255;
    return brightnessOf(record.brightness);
  }

  /** PadCanvas hands its element over from its own onMount, which runs first. */
  function collect(_id: string, el: HTMLCanvasElement): void {
    canvas = el;
    adopt();
  }

  function adopt(): void {
    if (
      host === undefined ||
      engine === undefined ||
      canvas === undefined ||
      listed === undefined
    ) {
      return;
    }
    host.register(listed.id, canvas, mirroring ? mirror.engine : engine);
    host.setHero(listed.id);
    ready = true;
  }

  /** The tuner's engine, replacing the shipped one under the same id. */
  function applyPreview(id: string, next: SimEngine): void {
    if (listed?.id !== id) return;
    engine = next;
    // While the plate mirrors the ZONA the tuner's engine waits; Mirror off puts it back.
    if (!mirroring) host?.replaceEngine(id, next);
  }

  // ---------------------------------------------------------------------------
  // Mirror ZONA (change 20, docs/MIRROR.md section 6).

  /** The mirror is on: the plate is the module's, not the simulator's. */
  const mirroring = $derived(mirror.state !== "off");
  /** The mirror's frame listener while it is on: the host repaints on its own frame, never per report. */
  let unmirror: (() => void) | undefined;

  /** Hand the plate to the mirror's engine, or back to the simulator's, under the same id. */
  function swapPlate(on: boolean): void {
    if (on) {
      unmirror ??= mirror.onFrame(() => {
        if (listed !== undefined) host?.invalidate(listed.id);
      });
      if (listed !== undefined) host?.replaceEngine(listed.id, mirror.engine);
      return;
    }
    unmirror?.();
    unmirror = undefined;
    if (listed !== undefined && engine !== undefined) {
      host?.replaceEngine(listed.id, engine);
    }
  }

  $effect(() => {
    const on = mirroring;
    untrack(() => swapPlate(on));
  });

  /**
   * Open one entry: the engine through the simulator's dynamic import, then
   * the stamp, then the inspector. Runs once per id.
   */
  async function open(entry: { id: string }): Promise<void> {
    const mine = ++generation;
    arrived = false;
    ready = false;
    unavailable = false;
    landing = NO_LANDING;
    knobIndices = {};
    brightness = fromCopyBrightness(entry.id);
    overBudgetReason = undefined;
    configStrings = undefined;
    shareStamp = undefined;
    engine = undefined;
    point = { x: 0, y: 0 };
    touchRecent(local(), entry.id, new Date().toISOString());

    const [{ createEngine }, { byId }] = await Promise.all([
      import("$lib/sim/engine"),
      import("$lib/catalog"),
    ]);
    if (!mounted || mine !== generation) return;
    const configuration = byId(entry.id);
    try {
      if (configuration === undefined) {
        throw new Error(`no catalog entry with id "${entry.id}"`);
      }
      engine = await createEngine(configuration);
    } catch (error) {
      // The frame stays; the canvas stays unlit. The broken-entry state the
      // coverflow rendered, never a blank panel.
      console.warn(
        `Workspace: no simulator engine for "${entry.id}"; the pad renders unlit.`,
        error,
      );
      if (mounted && mine === generation) unavailable = true;
    }
    if (!mounted || mine !== generation) return;
    adopt();

    // The landing, after the engine and before the inspector. Both modules
    // are already resolved: the catalog was imported above and module
    // records are cached, so this costs a microtask and one small fetch.
    const [{ parseHash, decodeFor }] = await Promise.all([
      import("$lib/share/stamp"),
    ]);
    if (!mounted || mine !== generation) return;
    if (configuration !== undefined) {
      const result = decodeFor(configuration, parseHash(page.url.hash));
      if (result.kind === "restored") knobIndices = { ...result.indices };
      landing = result;
    }
    arrived = true;
  }

  onMount(() => {
    mounted = true;
    // The ambient-motion preference folded into the host's reduced-motion
    // input, os || still (13-04, Bible section 14); the surface still answers
    // a finger in Play.
    host = new SimHost(motionDeps());
    const record = readBrowseReturn(store());
    if (record !== undefined) {
      const mark = record.href.indexOf("?");
      const params = new URLSearchParams(
        mark === -1 ? "" : record.href.slice(mark + 1),
      );
      const query = parseBrowseQuery(params, VOCABULARY);
      returnIds = sortListing(
        filterListing(LISTING, query.q, query),
        query.sort,
      ).map((entry) => entry.id);
    }
  });

  onDestroy(() => {
    if (!mounted) return;
    mounted = false;
    generation += 1;
    if (saveTimer !== undefined) clearTimeout(saveTimer);
    if (exportTimer !== undefined) clearTimeout(exportTimer);
    // Leaving the page ends the mirror: the heartbeats stop and the module drops out of editor mode.
    mirror.stop();
    unmirror?.();
    unmirror = undefined;
    host?.destroy();
    host = undefined;
    engine = undefined;
    canvas = undefined;
  });

  /* One open per id: the rail's rows navigate within this route, so the
     component survives and the id changes under it. The markup below is
     keyed on the id, so the canvas re-mounts and collect() runs again. */
  $effect(() => {
    const entry = listed;
    if (!mounted || entry === undefined) return;
    void untrack(() => open(entry));
  });

  function ledPoint(event: PointerEvent): { x: number; y: number } | undefined {
    if (canvas === undefined || engine === undefined) return undefined;
    const rect = canvas.getBoundingClientRect();
    return {
      x: mapAxis(event.clientX - rect.left, rect.width, engine.coordMax),
      y: mapAxis(event.clientY - rect.top, rect.height, engine.coordMax, "y"),
    };
  }

  function onDown(event: PointerEvent): void {
    // Mirroring, the fingers are on the module: the plate takes none.
    if (mode !== "play" || host === undefined || mirroring) return;
    const target = event.currentTarget;
    try {
      if (target instanceof Element) target.setPointerCapture(event.pointerId);
    } catch {
      // The element can detach between the event and the capture; the
      // contact simply ends.
    }
    const at = ledPoint(event);
    if (at === undefined) return;
    point = at;
    host.touchDown(event.pointerId, at.x, at.y);
  }

  function onMove(event: PointerEvent): void {
    if (mode !== "play" || host === undefined || mirroring) return;
    const at = ledPoint(event);
    if (at === undefined) return;
    point = at;
    host.touchMove(event.pointerId, at.x, at.y);
  }

  function onUp(event: PointerEvent): void {
    if (mode !== "play") return;
    host?.touchEnd(event.pointerId);
  }

  // ---------------------------------------------------------------------------
  // The inspector's reports, the copy and the share.

  function rememberKnobs(indices: Readonly<Record<string, number>>): void {
    knobIndices = { ...indices };
  }

  /**
   * Save copy (Bible section 11; library.ts): a NEW named copy, never a write over its source; the id
   * carries the moment, the indices are the knob vector the stamp encodes, in knob order.
   */
  function save(): void {
    if (listed === undefined) return;
    const at = new Date().toISOString();
    const outcome = saveCopy(local(), {
      schema: 1,
      id: `copy:${listed.id}:${Date.now().toString(36)}`,
      name: copyName(listed.name),
      kind: "playground",
      source: listed.id,
      knobIndices: Object.values(knobIndices),
      // The field only when it is not full: a copy at 255 is the record as every copy was.
      ...(brightness === 255 ? {} : { brightness }),
      createdAt: at,
      editedAt: at,
    });
    if (outcome !== "written") return;
    saved = true;
    if (saveTimer !== undefined) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = undefined;
      saved = false;
    }, CONFIRM_MS);
  }

  /**
   * Export for Grid Editor (change 13C): the tuner's five strings - exactly what Store writes -
   * as the Editor's own profile file, the card's sentence as its description, and the same
   * playground record Save a copy writes riding under the `hangar` key so the file names its
   * source. Every module arrives by dynamic import on the click, as the codec does.
   */
  async function exportProfile(): Promise<void> {
    if (listed === undefined || configStrings === undefined) return;
    const strings = configStrings;
    const entry = listed;
    const [profileLib, transfer, stamp, catalog] = await Promise.all([
      import("$lib/share/profile"),
      import("$lib/store/transfer"),
      import("$lib/share/stamp"),
      import("$lib/catalog"),
    ]);
    if (!mounted) return;
    const at = new Date().toISOString();
    const record: PlaygroundRecord = {
      schema: 1,
      id: `copy:${entry.id}:${Date.now().toString(36)}`,
      name: entry.name,
      kind: "playground",
      source: entry.id,
      knobIndices: Object.values(knobIndices),
      ...(brightness === 255 ? {} : { brightness }),
      createdAt: at,
      editedAt: at,
    };
    const profile = profileLib.buildProfile({
      id: crypto.randomUUID(),
      name: entry.name,
      description: configDescription(entry.description),
      strings,
      at,
      hangar: transfer.exportFile(record, at, (id) => {
        const found = catalog.byId(id);
        return found === undefined ? undefined : stamp.stampKnobs(found);
      }),
    });
    transfer.downloadText(
      profileLib.profileFileName(entry.name),
      profileLib.serialiseProfile(profile),
    );
    exportedProfile = true;
    if (exportTimer !== undefined) clearTimeout(exportTimer);
    exportTimer = setTimeout(() => {
      exportTimer = undefined;
      exportedProfile = false;
    }, CONFIRM_MS);
  }

  /**
   * The tuner's pair reaches the store the moment it changes, and as undefined the moment a knob
   * moves - which disables Apply for the measuring window (D-17) and un-arms Store on ZONA (Z-05,
   * Z-21). TryOnDevice.svelte's effect, kept here when the column went (13.1-06). untrack because
   * observeConfig reads the store's own fields; this must re-run on the pair alone.
   */
  $effect(() => {
    const pair = configStrings;
    untrack(() => install.observeConfig(pair));
  });

  /* The browse-return record's end of life: written by /playground/ on the way in, forgotten here on a
     departure to anywhere but /playground/ (the record being used) or another /playground/<id>/ (the
     rail's hop still came from browse); a reload carries `willUnload` and is skipped. beforeNavigate,
     not afterNavigate - measured rather than assumed (05.1-09: afterNavigate's callback is deleted in
     the teardown that runs while the new page renders). The callback exists only while this component is mounted. */
  beforeNavigate((navigation) => {
    if (navigation.willUnload) return;
    const to = navigation.to?.url.pathname ?? "";
    if (to === "") return;
    if (to.startsWith(PLAYGROUND_PREFIX)) return;
    clearBrowseReturn(store());
  });

  /* The reported page is the module's own, through the session's fold, and decides whether the zone
     renders at all; everything else is DestinationZone.svelte's, and this route hands it three props. */
  const reportedPage = $derived(session.identity?.activePage);

  /* The shell, filled for the life of this page (13-05's bridge): the three snippets arrive here, the
     breadcrumb travelled as data; `device` is read so the fill re-makes when the phase moves. */
  $effect(() =>
    fillShell({
      variant: "app",
      section: "playground",
      breadcrumb: data.shell.breadcrumb,
      device: install.phase,
      page: install.snapshotPage,
      destination: reportedPage === undefined ? undefined : destination,
      rail,
      inspector,
    }),
  );
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta property="og:type" content={OG_TYPE} />
  <meta property="og:site_name" content={SITE} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={ogUrl} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:type" content={OG_IMAGE_TYPE} />
  <meta property="og:image:width" content={OG_IMAGE_WIDTH} />
  <meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
  <meta property="og:image:alt" content={ogImageAlt} />
  <meta name="twitter:card" content={TWITTER_CARD} />
</svelte:head>

<!--
  The context bar's destination zone while a ZONA is connected (13-12; 13.1-06): DestinationZone.svelte,
  handed the entry's name (the store's label for the write), the tuner's five strings (undefined while
  it measures) and the tuner's over-budget sentence. Without a session the bar renders its own sentence.
-->
{#snippet destination()}
  <DestinationZone
    name={listed?.name ?? ""}
    config={configStrings}
    refusal={overBudgetReason}
  />
{/snippet}

<!-- PDF page 5's rail: CONFIGURATIONS, the way back, the numbered rows, Save a copy. -->
{#snippet rail()}
  <Rail sections={[{ title: RAIL_TITLE, rows }]} selected={listed?.id}>
    {#snippet lead()}
      <BrowseLink />
    {/snippet}
    {#snippet action()}
      <button
        class="pinned-save"
        type="button"
        data-testid="save-a-copy"
        disabled={listed === undefined}
        onclick={save}
      >
        <span aria-hidden="true">{SAVE_A_COPY_GLYPH}</span>
        {saved ? SAVED_COPY : SAVE_A_COPY}
      </button>
    {/snippet}
  </Rail>
{/snippet}

<!-- The inspector's pinned actions: Save copy, the share stamp as Share snapshot, and Export for Grid Editor (13C). -->
{#snippet actions()}
  <button
    class="inspector-action"
    type="button"
    data-testid="save-copy"
    disabled={listed === undefined}
    onclick={save}
  >
    {saved ? SAVED_COPY : SAVE_COPY}
  </button>
  {#if listed}
    <CopyLink
      url={shareUrl(listed.id, shareStamp)}
      label={SHARE_SNAPSHOT}
      oncopied={() => region?.announceCopied()}
    />
    <button
      class="inspector-action"
      type="button"
      data-testid="export-profile"
      disabled={exportReason !== undefined}
      title={exportReason ?? EXPORT_PROFILE_HELPER}
      onclick={() => void exportProfile()}
    >
      {exportedProfile ? PROFILE_EXPORTED : EXPORT_PROFILE}
    </button>
  {/if}
{/snippet}

<!--
  The inspector: the schema renderer, keyed on the entry so a rail hop
  rebuilds the tuner for the neighbour with that entry's own knob positions,
  and gated on the landing so a stamped link opens on its knobs.
-->
{#snippet inspector()}
  {#if listed && arrived}
    {#key listed.id}
      <TuningRegion
        bind:this={region}
        entryId={listed.id}
        name={listed.name}
        knobs={knobIndices}
        {brightness}
        {landing}
        {actions}
        onknobs={rememberKnobs}
        onbrightness={(next) => (brightness = next)}
        onpreview={(next) => applyPreview(listed.id, next)}
        onstamp={(stamp) => (shareStamp = stamp)}
        onbudget={(reason) => (overBudgetReason = reason)}
        onconfig={(config) => (configStrings = config)}
      />
    {/key}
  {/if}
{/snippet}

<div
  class="workspace"
  data-testid="workspace"
  data-ready={ready}
  data-mode={mode}
  data-mirror={mirror.state}
  style:--surface-max="{SURFACE_MAX}px"
>
  {#if listed}
    {#key listed.id}
      <header class="top">
        <p class="eyebrow type-micro">{EXPLORE} / {category}</p>
        <div class="title-row">
          <h1 class="name type-page-title" data-testid="workspace-name">
            {listed.name}
          </h1>
          <!--
            The two-segment switch: a radiogroup of two real radios in labels,
            one tab stop, arrows that move and select - the word row's
            mechanics. Configure is the PDF's active segment.
          -->
          <div class="switches">
            <div class="mode" role="radiogroup" aria-label="Mode">
              <label class="segment" class:selected={mode === "configure"}>
                <input
                  class="sr-only"
                  type="radio"
                  name="workspace-mode"
                  value="configure"
                  data-testid="mode-configure"
                  checked={mode === "configure"}
                  onchange={() => (mode = "configure")}
                />
                {MODE_CONFIGURE}
              </label>
              <label class="segment" class:selected={mode === "play"}>
                <input
                  class="sr-only"
                  type="radio"
                  name="workspace-mode"
                  value="play"
                  data-testid="mode-play"
                  checked={mode === "play"}
                  onchange={() => (mode = "play")}
                />
                <span aria-hidden="true">{MODE_PLAY_GLYPH}</span>
                {MODE_PLAY}
              </label>
            </div>
            <MirrorToggle />
          </div>
        </div>
        <p class="sentence">{typographic(listed.description)}</p>
      </header>

      <!--
        The pointer target is the wrapper, not the canvas (a picture, role="img"); there is no keyboard
        gesture for a pad, so the static-element rule is suppressed rather than satisfied with a false role.
      -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="surface"
        class:play={mode === "play" && !mirroring}
        data-testid="workspace-surface"
        data-unavailable={unavailable || undefined}
        onpointerdown={onDown}
        onpointermove={onMove}
        onpointerup={onUp}
        onpointercancel={onUp}
        onlostpointercapture={onUp}
      >
        <PadFrame entry={listed} hero>
          <PadCanvas entry={listed} hero onready={collect} />
        </PadFrame>
      </div>

      <div class="under">
        <span class="matrix type-micro">{MATRIX_LINE}</span>
        {#if mirroring}
          <span class="coords numerals" data-testid="mirror-status"
            >{mirrorStatus(
              session.identity?.activePage,
              mirror.lit,
              mirror.silent,
            )}</span
          >
        {:else}
          <span class="coords numerals" data-testid="workspace-coordinates"
            >{coordinateLine(point.x, point.y)}</span
          >
        {/if}
      </div>

      {#if mirroring}
        <p class="quiet type-helper" data-testid="mirror-note">
          {MIRROR_CANNOT}
        </p>
      {/if}

      {#if listed.quiet}
        <p class="quiet type-helper" data-testid="workspace-quiet">
          {listed.quiet}
        </p>
      {/if}

      <!--
        The monitor bar (PDF page 5), on Lua entries only (D-14 Q4b). The source is a closure over the
        live engine: the tuner swaps engines under the same id on every knob turn.
      -->
      <div class="monitor-slot" data-testid="monitor-slot">
        {#if mirroring}
          <MidiMonitor
            source={() => mirror.midi}
            sourceLabel={MIRROR_MONITOR_SOURCE}
            status={MIRROR_MONITOR_STATUS}
            empty={MIRROR_MONITOR_EMPTY}
          />
        {:else if listed.preview === "lua"}
          <MidiMonitor source={() => midiLogOf(engine)} />
        {/if}
      </div>

      <div class="fidelity"><FidelityLine entry={listed} /></div>
      <!-- Nothing beneath the fidelity line since 13.1-06: the bar's destination zone is the whole install interface. -->
    {/key}
  {:else}
    <!-- An address nobody has heard of: the rail is the way on, and the line says so. -->
    <div class="fidelity">
      <FidelityLine entry={OPENING} notice={UNKNOWN_NOTICE} />
    </div>
  {/if}
</div>

<style>
  .workspace {
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
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }

  .name {
    margin: 0;
    color: var(--color-ink);
  }

  .sentence {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 17px;
    line-height: 1.45;
    color: var(--color-ink-quiet);
  }

  /* The mode switch and, while a ZONA is connected, Mirror ZONA beside it (change 20). */
  .switches {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  /* PDF page 5's two-segment switch: two outlined boxes, the active one in the action colour, 44px on both axes. Square (D-01). */
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

  /* The surface: the PDF's square, capped at layout.ts's SURFACE_MAX. */
  .surface {
    inline-size: min(100%, var(--surface-max));
    aspect-ratio: 1;
    margin-inline: auto;
    touch-action: none;
  }

  .surface.play {
    cursor: crosshair;
  }

  .under {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 16px;
    inline-size: min(100%, var(--surface-max));
    margin-inline: auto;
  }

  .matrix {
    color: var(--color-ink-quiet);
  }

  /* The readout: machine text, tabular, never jittering as a finger moves. */
  .coords {
    font-size: 12px;
    color: var(--color-ink-quiet);
  }

  .quiet {
    margin: 0;
    text-align: center;
    color: var(--color-ink-quiet);
  }

  /* The monitor's row. No box of its own: the bar sizes itself to the surface. */
  .monitor-slot {
    display: contents;
  }

  .fidelity {
    inline-size: min(100%, var(--surface-max));
    margin-inline: auto;
  }

  /* The rail's pinned Save a copy: page 5's outlined box, full width, 44px. */
  .pinned-save {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    inline-size: 100%;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    background: transparent;
    font-family: var(--font-sans);
    font-size: 15px;
    color: var(--color-ink);
    cursor: pointer;
  }

  .pinned-save:hover:not(:disabled) {
    border-color: var(--color-action);
  }

  /* The inspector's pinned pair member: the same outlined box, in its half. */
  .inspector-action {
    appearance: none;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    background: transparent;
    font-family: var(--font-sans);
    font-size: 15px;
    color: var(--color-ink);
    cursor: pointer;
  }

  .inspector-action:hover:not(:disabled) {
    border-color: var(--color-action);
  }

  .pinned-save:disabled,
  .inspector-action:disabled {
    color: var(--color-ink-quiet);
    cursor: not-allowed;
  }
</style>
