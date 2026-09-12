<!--
  /playground/{id}/ - the workspace: PDF page 5 on 13-05's shell (plan 13-09).

  (At /c/{id}/ from Phase 5 to 13-08, which moved it here under 13-CONTEXT
  D-20, move-clean; until this plan it rendered the front door's coverflow
  with the chosen panel beneath it. FrontDoor.svelte, Coverflow.svelte,
  NamePlate.svelte, ChosenPanel.svelte and src/lib/coverflow/ left the tree
  with this rewrite.)

  THREE REGIONS, ALL THE PDF'S. The rail lists the nearby configurations -
  `CONFIGURATIONS`, the `All configs` way back, one numbered row per entry
  with this one raised and ruled, and `Save a copy` pinned at the foot. The
  centre carries the eyebrow (`EXPLORE / MODULATION`: the FOR label through
  13-08's FOR_LABELS), the name, the two-segment `Configure` / `Play` switch,
  the sentence, the surface at the PDF's square with its 1px lattice, the
  `ZONA · 9 × 9 LIGHT MATRIX` line with the live `X / Y` readout, and the
  collapsed MIDI monitor (13-10) under them. The inspector is the schema
  renderer, TuningRegion.svelte, handed to the shell as a snippet.

  "NEARBY" IS THE BROWSE-RETURN SET IF THERE IS ONE, ELSE THE FRONT-DOOR
  MEMBERSHIP. Section 6's preserved-context rule is why the return record
  exists, so a visitor who filtered the gallery down to six sees those six
  in the rail, in the order they saw them; a cold arrival sees the curated
  eight. The entry on the page is always in the list - prepended when the set
  does not carry it - so the raised row is never missing.

  THE MODE SWITCH IS PREV-04's SECOND HALF, AND IT IS NOT TICKED HERE. Play
  routes the pointer to the preview as mouse-as-finger through the host's
  tick-locked delivery (the intro's hero was the first half, 13-07); Configure
  leaves the surface a picture you look at while tuning. Nothing is locked -
  a catalog entry has no structure to lock, which is the Sandbox's rule at
  13-16. 13-20 decides the requirement's tick.

  THE CONNECTION CONTROL IS THE SHELL'S (13-11). The layout mounts
  ConnectionControl.svelte in the header and DeviceActions.svelte in the
  footer on every page; this route hands neither over any more (13-09's
  provisional DeviceSlot snippet is gone). WHAT THIS ROUTE HANDS THE CONTEXT
  BAR (13-11): the device's clause, `device: install.phase`, so the bar's
  status zone reads the install store's fifteen phases through
  ContextBar.svelte's own mapping (section 9's device-state object); the
  draft's clause is 13-13's wiring and 13-18's words and is not set here.
  The fill is re-made when the phase moves - the snippets in it are the same
  functions, so the rail and the inspector are not re-created. THE
  DESTINATION ZONE (13-12; 13-CONTEXT D-06; Bible section 9, D02; 13.1-CONTEXT
  D-05, D-06) is DestinationZone.svelte - THE ONE COMPONENT THIS ROUTE AND
  THE SANDBOX BOTH MOUNT since 13.1-06, by the user's word at the fourth
  bench ("the second row in the page (so under the logo) the right side
  should look like this: Target PAGE 1 on ZONA selector, Apply to ZONA
  button, Store on ZONA button.", bench line 6): the Target select over the
  pages the module enumerated, Apply to ZONA, Store on ZONA with the site's
  one confirmation in its place, and beneath them the store's reason, the
  over-budget refusal, the switching line or the unverified line, the
  still-writing line and a write's failure block - while a ZONA is
  connected, and the PDF's sentence otherwise. This route hands it the
  entry's name, the tuner's five strings and the tuner's refusal, and
  nothing else; the zone's header says the rest. It is the one control on
  the site that moves the hardware, and THE SELECT'S CHANGE IS THE SWITCH:
  there is no destination review ("When you change page form the drop down
  just change the page and thats it.", bench line 5, which struck 13-CONTEXT
  D-06's second clause). Opening the menu sends nothing; a change calls
  install.switchPage(value), which is the target's request() then its
  confirm() - the restore heartbeat, then exactly one switch - and the store
  gates every write on the module's own page report until it arrives (the
  ACK gate, unmoved). On a focused, closed select Chromium fires change on
  every ArrowUp / ArrowDown, so each arrow press is a switch until the
  select disables at switching: the visitor's own gesture on the one control
  that moves the hardware.
  THE MONITOR IS ON LUA ENTRIES ONLY (13-10, D-14 Q4b): the bar
  under the surface renders the log the Lua host keeps, read through the
  live engine on every sample, and is ABSENT - not present and empty - on
  the nine preset-backed entries, whose vendored simulator keeps no log.
  MidiMonitor.svelte's header carries the three limits. THERE IS NO INSTALL
  COLUMN UNDER THE SURFACE SINCE 13.1-06 (13.1-CONTEXT D-06, D-07; batch row
  J.13, owed since the gate). Phase 7's column - TRY ON DEVICE with its
  honesty block and its connect-state region, the hairline, NEXT, PUT BACK,
  KEEP ON DEVICE or its confirmation, the reset (the header's since 13.1-05)
  and DISCONNECT ZONA (Device actions' since 13-11) - was the block the user
  called "totally unnecessary" once the bar carried Apply; it is gone, and
  TryOnDevice.svelte, InstallState.svelte, KeepOnDevice.svelte and
  PutBack.svelte were deleted with it. Put back has no control anywhere on
  the site by the user's "remove" (D-07); the store's putBack() and the
  snapshot before every write stay, reachable from the install probe under
  the unlinked bench routes (named nowhere here: config-shape.spec.ts's
  probe-route test forbids the path outside its own directory).
  What the column did that the zone does not is done here instead: the
  tuner's pair reaches install.observeConfig the moment it changes (the
  effect below, TryOnDevice's, kept), which is what arms Store on ZONA and
  closes the confirmation when a knob moves (Z-05, Z-21). The Escape rule
  (Z-10) is kept on the window; the confirmation's focus return is the
  zone's own.

  THE STAMP LANDING (SHARE-01, SHARE-03, D-13) runs after the engine is
  built and BEFORE the inspector mounts: the tuner builds in its own onMount
  with whatever indices it is handed, so a stamped link's knobs have to be
  decoded first or the tuner would open on the defaults. `arrived` is that
  gate. NEVER A PARTIAL RESTORE: `restored` sets every index; `older` and
  `unreadable` leave every knob at its default and say so through the notice.

  THE COMPILER AND THE SIMULATOR ARRIVE THROUGH `await import()` AND NEVER
  STATICALLY. src/lib/config-shape.spec.ts test 13 walks this file for a
  `from` specifier naming the vendored tree, the protocol package or the
  compile surface; test 14 asserts the built page references no chunk
  carrying the package. The static imports below are the light half of the
  tree: the listing, the front-door membership, the browse stores, the
  install and session stores the layout already names, and the host.

  THE RECORD'S END OF LIFE. A browse return is written by /playground/ on the
  way in and consumed by /playground/ on the way back, and if the visitor
  leaves for anywhere else it has to be forgotten here. Two deliberate
  exceptions: /playground/ itself (the record being USED), and another
  /playground/<id>/ (a visitor who came from browse and followed the rail to
  a second configuration still came from browse). It is beforeNavigate and
  not afterNavigate, and that was measured rather than assumed (05.1-09:
  afterNavigate's callback is deleted in the teardown that runs while the
  new page renders, so it never fires for the one departure it exists for).
  A reload or an address-bar hop carries `willUnload` and is skipped: the
  way back survives a reload, which 05.1-UI-SPEC.md calls a virtue.

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
  import type { LocalStore } from "$lib/store/local";
  import { saveCopy } from "$lib/store/library";
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

  /* The head's fixed half. 05-UI-SPEC, The OG image. twitter:card is what makes
     Discord render a large embed rather than an 80x80 thumbnail; nothing here
     is about Twitter. Every value is a const rather than inline markup text,
     because Prettier reflows element text and Phase 2 lost a load-bearing
     sentence to exactly that. */
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

  /* stamp.ts's own union, imported as a type (erased; not a specifier the
     chunk guard can see) rather than re-declared - 13-13's rule, applied here
     by 13-12 while it edited this file. The module itself still arrives
     through the awaited import below. */
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

  function local(): LocalStore | undefined {
    if (!browser) return undefined;
    try {
      return window.localStorage;
    } catch {
      return undefined;
    }
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
    host.register(listed.id, canvas, engine);
    host.setHero(listed.id);
    ready = true;
  }

  /** The tuner's engine, replacing the shipped one under the same id. */
  function applyPreview(id: string, next: SimEngine): void {
    if (listed?.id !== id) return;
    engine = next;
    host?.replaceEngine(id, next);
  }

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
    window.addEventListener("keydown", onWindowKeyDown);
  });

  onDestroy(() => {
    if (!mounted) return;
    mounted = false;
    generation += 1;
    window.removeEventListener("keydown", onWindowKeyDown);
    if (saveTimer !== undefined) clearTimeout(saveTimer);
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
    if (mode !== "play" || host === undefined) return;
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
    if (mode !== "play" || host === undefined) return;
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
   * Save copy (Bible section 11; library.ts): a NEW named copy, never a write
   * over its source. The id carries the moment so two saves are two copies;
   * the indices are the knob vector the stamp encodes, in knob order.
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
   * Escape, from anywhere on the page (07-UI-SPEC Z-10, I3 rule 9). While the
   * install store is writing, Escape does nothing at all: the state lasts
   * about two seconds on a RAM leg and about five on a store leg by
   * construction - a pause, not a trap. While the flash confirmation is open,
   * Escape closes the block. There is no panel to un-choose any more, so
   * nothing else happens and no history entry is pushed.
   */
  function onWindowKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    if (install.phase === "writing") return;
    if (install.confirmOpen) {
      event.preventDefault();
      install.dismissConfirm();
    }
  }

  /**
   * THE TUNER'S PAIR REACHES THE STORE the moment it changes - and reaches
   * it as undefined the moment a knob moves, which is what disables Apply
   * for the measuring window (D-17) and un-arms Store on ZONA (Z-05, Z-21).
   * TryOnDevice.svelte's effect, kept here when the column went (13.1-06):
   * the Sandbox route does the same for its landing. The effect writes a
   * value it never reads, so there is no loop; untrack because observeConfig
   * reads the store's own fields to recompute what "armed" means, and this
   * must re-run on the pair alone.
   */
  $effect(() => {
    const pair = configStrings;
    untrack(() => install.observeConfig(pair));
  });

  /* THE RECORD'S END OF LIFE. See the header. There is no check that the
     navigation is FROM /playground/ - this callback only exists while this
     route's component is mounted, so it cannot fire anywhere else. */
  beforeNavigate((navigation) => {
    if (navigation.willUnload) return;
    const to = navigation.to?.url.pathname ?? "";
    if (to === "") return;
    if (to.startsWith(PLAYGROUND_PREFIX)) return;
    clearBrowseReturn(store());
  });

  /* THE DESTINATION ZONE (13-12; 13-CONTEXT D-06; 13.1-06). The reported
     page is the module's own, through the session's fold, and it is what
     decides whether the zone renders at all: no session, the bar's own
     sentence. Everything else - the pages offered, the select's value, the
     switch, Apply's enablement, Store on ZONA and its confirmation, the
     lines and the failure block - is DestinationZone.svelte's, and this
     route hands it three props. */
  const reportedPage = $derived(session.identity?.activePage);

  /* The shell, filled for the life of this page (13-05's bridge). The rail,
     the inspector and the destination are snippets and arrive with this
     effect; the breadcrumb travelled as data so the prerendered document
     already carries it. `device` is the install store's phase, read here so
     the effect re-fills when it moves (see the header). */
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
  THE CONTEXT BAR'S DESTINATION ZONE while a ZONA is connected (13-12; PDF
  pages 3 and 5; Bible section 9; 13-CONTEXT D-06; 13.1-CONTEXT D-05, D-06):
  DestinationZone.svelte, the one component both routes mount - Target,
  Apply to ZONA, Store on ZONA, the lines and the failure block beneath.
  Without a session the bar renders its own "Preview without hardware". The
  route hands the entry's name (the store's label for the write), the
  tuner's five strings (undefined while it measures) and the tuner's
  over-budget sentence (Apply is disabled on it and described by it).
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

<!-- The inspector's pinned pair: Save copy, and the share stamp as Share snapshot. -->
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
        {landing}
        {actions}
        onknobs={rememberKnobs}
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
        </div>
        <p class="sentence">{typographic(listed.description)}</p>
      </header>

      <!--
        The pointer target is the wrapper, not the canvas: the canvas is a
        picture (role="img", named by PadCanvas.svelte) and the wrapper is
        where a finger lands in Play. There is no keyboard gesture for a pad,
        so the static-element rule is suppressed rather than satisfied with a
        role that would promise a control this surface is not.
      -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="surface"
        class:play={mode === "play"}
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
        <span class="coords numerals" data-testid="workspace-coordinates"
          >{coordinateLine(point.x, point.y)}</span
        >
      </div>

      {#if listed.quiet}
        <p class="quiet type-helper" data-testid="workspace-quiet">
          {listed.quiet}
        </p>
      {/if}

      <!--
        THE MONITOR BAR (PDF page 5: a collapsed `MIDI monitor` bar with
        `Browser preview · No MIDI output`), on Lua entries only - D-14 Q4b.
        The source is a closure over the live engine, because the tuner swaps
        engines under the same id on every knob turn and the monitor has to
        read the one that is playing.
      -->
      <div class="monitor-slot" data-testid="monitor-slot">
        {#if listed.preview === "lua"}
          <MidiMonitor source={() => midiLogOf(engine)} />
        {/if}
      </div>

      <div class="fidelity"><FidelityLine entry={listed} /></div>
      <!--
        Nothing beneath the fidelity line since 13.1-06. Phase 7's install
        column stood here from 07-10 to 13.1-06 (the header says what it
        was); the bar's destination zone is the whole of the install
        interface now, and the reset is the header's.
      -->
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

  /*
    PDF page 5's two-segment switch: two outlined boxes, the active one
    outlined in the action colour with its word in the action colour. 44px
    on both axes at every pointer. Square (D-01).
  */
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
