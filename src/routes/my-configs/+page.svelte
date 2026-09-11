<!--
  /my-configs/ - PDF page 4, the personal library, on 13-05's shell (plan
  13-13; Bible sections 9 and 11; KEEP-01..06, SHARE-03).

  WHAT THIS PAGE RENDERS, AND WHERE. The rail, handed to the shell as a
  snippet: YOUR LIBRARY with four two-digit counts - All saved, Drafts,
  Favorites, Recently used - then a divider and COLLECTIONS (13-13 task 3).
  The centre: the eyebrow, the headline "Pick up where you left off.", the
  sub, `Import config` outlined and `New surface` filled at the top right; the
  RESUME BANNER over the newest draft (ResumeBanner.svelte), shown only when
  a draft exists; the search row with its `Last edited` sort; the count line;
  and the TABLE (LibraryTable.svelte) - a table and not a card grid, because
  a timestamp and a status are columns. The frame's shape travels as page
  data (+page.ts) so the prerendered document carries the header, the nav
  and the breadcrumb; the rail and the rows arrive with the effect, read from
  the visitor's own browser store.

  ALL SAVED IS BOTH RECORD STORES. The PDF's `All saved 12` over a table that
  carries a `Draft` row: the table lists drafts.ts's records and library.ts's
  records together, sorted by the moment they were last edited, and the
  STATUS chip says which is which - two words for two objects, never one for
  three (section 9). `Drafts` narrows the table to the first store.

  FAVORITES AND RECENTLY USED ARE DESTINATIONS HERE, NOT FILTERS - 13-08's
  open question, decided from the PDF. Both pages draw the same YOUR LIBRARY
  rows with the same counts (08, 06), and both lists are lists of CATALOG
  ENTRIES: a favorite is a starred Playground configuration and a recent is
  one the workspace opened. This table lists PERSONAL configurations - a
  draft or a saved copy - so narrowing it by either list would show a count
  the table cannot match (eight favorites, two copies made from them), which
  is the coy state D-05 forbids. The two rows therefore link to the gallery,
  where the two lists live as views, and their counts are the stores' own.
  The gallery cannot yet be asked to arrive WITH a view selected - 13-08
  keeps the library view out of the address so a shared link never shows
  somebody else's favorites - so a visitor lands on All configs and clicks
  once more. That gap is ledgered as a question (13-COPY-NEW.md, 13-13).

  THE THUMBNAILS ARE LIVE. This page owns ONE SimHost and one animation frame;
  the banner and every row hand their canvas up and the page registers it
  with an engine built for the record's SOURCE entry through the same
  dynamic import the gallery uses. A hand-authored (Lua) entry's engine takes
  the record's own knob indices, so a saved variation shows AS SAVED; a
  preset-backed entry's knobs move a PadState through the compiler and its
  thumbnail is the base configuration - the workspace's tuner is the one
  place that compiles, and twelve compiles for twelve thumbnails is not a
  price this page pays. Nothing stores a picture (13-06). A sandbox record's
  face is unlit until 13-15's surface engine exists (a known stub, named in
  the SUMMARY).

  OPEN AND RESUME GO THROUGH THE STAMP. The workspace reads its knob vector
  from the URL's hash and nothing else (13-09), so `Open` on a Playground
  record is `/playground/{source}/#z.{stamp}` with the stamp ENCODED from the
  record's indices through stamp.ts's own encodeFor - the codec used, never
  touched, and a draft resumes at the positions it was left at. A sandbox
  record opens in the Sandbox, a later wave's route (13-16).

  EXPORT AND IMPORT ARE transfer.ts's. Export: one click, a Blob behind an
  object URL on an anchor with `download`, the URL revoked - no permission
  and no API beyond what every supported browser has. Import: a hidden
  <input type="file">, File.text(), and the six steps, which write nothing
  until all pass; the outcome is one of the codec's Landing words and the
  refusal names its reason in a sentence. A `restored` Playground import
  OPENS (section 11: "before opening"); an `older` one stays here with its
  explanation and a row at the base configuration; `unreadable` stays here
  with the reason and no row.

  DELETE IS UNDOABLE FOR THE REST OF THE SESSION (D-22 fork B, applied to
  records and collections alike): the deleted thing is held in a module-level
  variable - one vector, nothing persisted, gone with the tab - and one
  `Undo` puts it back through the store's own write.

  THE CATALOG HERE IS $lib/catalog/listing AND NOTHING HEAVIER AT MODULE
  SCOPE: names and tags for the TYPE column come from the import-free listing;
  the codec, the full catalog and the engine factory arrive through dynamic
  imports from onMount, after the frame has painted.

  Every visible string the PDF draws is verbatim; the ones HANGAR wrote (the
  title, the empty states, the import and delete notices, the sort's second
  option, the three row actions) are ledgered in 13-COPY-NEW.md for 13-18.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script module lang="ts">
  import type { StoredRecord } from "$lib/store/schema";
  import type { Status } from "$lib/ui/library/words";

  /** What one deletion needs to be undone. */
  type Deletion = { readonly record: StoredRecord; readonly status: Status };

  /**
   * THE SESSION'S UNDO VECTOR (D-22 fork B): the last deletion, held for the
   * life of the tab and never written anywhere. Module-level so it survives a
   * hop to the workspace and back; a reload or a closed tab ends it.
   */
  let held: Deletion | undefined;
</script>

<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import type { ResolvedPathname } from "$app/types";
  import { onDestroy, onMount } from "svelte";
  import { forLabel } from "$lib/browse/labels";
  import { LIBRARY_ROWS, YOUR_LIBRARY } from "$lib/browse/rail";
  import { listingById } from "$lib/catalog/listing";
  import { SimHost, type HostEngine } from "$lib/sim/host";
  import { motionDeps } from "$lib/sim/motion.svelte";
  import { readDrafts, removeDraft, writeDraft } from "$lib/store/drafts";
  import { readFavorites } from "$lib/store/favorites";
  import {
    deleteCopy,
    readLibrary,
    renameCopy,
    saveCopy,
  } from "$lib/store/library";
  import type { LocalStore } from "$lib/store/local";
  import { listRecent } from "$lib/store/recent";
  import {
    EXPORT_ACCEPT,
    downloadExport,
    exportFile,
    importText,
    type KnobsOf,
  } from "$lib/store/transfer";
  import { relativeTime } from "$lib/ui/intro/card";
  import LibraryTable, {
    type LibraryRow,
  } from "$lib/ui/library/LibraryTable.svelte";
  import ResumeBanner from "$lib/ui/library/ResumeBanner.svelte";
  import { countLine, editedInWords, typeLabel } from "$lib/ui/library/words";
  import Rail, { type RailSection } from "$lib/ui/shell/Rail.svelte";
  import { SECTIONS, fillShell } from "$lib/ui/shell/shell.svelte";

  /* The PDF's page 4 strings, verbatim, as consts (Prettier reflows element text). */
  const EYEBROW = "YOUR PERSONAL CONFIGURATION LIBRARY";
  const HEADLINE = "Pick up where you left off.";
  const SUB = "Saved variations and custom surfaces. Every idea has a place.";
  const BREADCRUMB = ["MY CONFIGS", "YOUR LIBRARY"];
  const STATUS = "Your configurations, ready for the next session.";
  const IMPORT_CONFIG = "Import config";
  const NEW_SURFACE = "New surface";
  const SEARCH_LABEL = "SEARCH MY CONFIGURATIONS";
  const SEARCH_PLACEHOLDER = "Search saved configurations…";
  const SORT_LABEL = "SORT BY";
  const SORT_EDITED = "Last edited";
  const ALL_SAVED = "All saved";
  const DRAFTS = "Drafts";

  /* HANGAR's own, ledgered in 13-COPY-NEW.md (13-13). */
  const TITLE = "My configs — HANGAR";
  const SORT_NAME = "Name";
  const EMPTY_LIBRARY =
    "Nothing saved yet. Save a copy from the Playground or build a surface in the Sandbox, and it will be kept here.";
  const EMPTY_DRAFTS =
    "No drafts. A draft is kept here while you're still working on it.";
  /** Section 16's line for the search miss, verbatim, as the gallery uses it. */
  const EMPTY_SEARCH =
    "No configurations found. Try a different search or clear your filters.";
  const UNDO = "Undo";
  const importRefused = (file: string, reason: string) =>
    `Couldn't import ${file}. ${reason}`;
  const importedLine = (name: string, reason?: string) =>
    reason === undefined ? `Imported ${name}.` : `Imported ${name}. ${reason}`;
  const deletedLine = (name: string) => `Deleted ${name}.`;
  const restoredLine = (name: string) => `${name} is back.`;
  const STORE_REFUSED = "Your browser refused to store the change.";

  type Sort = "edited" | "name";
  const SORTS: readonly { id: Sort; label: string }[] = [
    { id: "edited", label: SORT_EDITED },
    { id: "name", label: SORT_NAME },
  ];

  type View = "all" | "drafts";

  /** The rail's four rows: two views over this table, two destinations on the gallery. */
  const ROW_ALL = "all";
  const ROW_DRAFTS = "drafts";
  const [, ROW_FAVORITES, ROW_RECENT] = LIBRARY_ROWS;

  const PLAYGROUND: ResolvedPathname = SECTIONS[0].href;
  const SANDBOX: ResolvedPathname = SECTIONS[1].href;

  const SEARCH_ID = "library-search-field";
  const SORT_ID = "library-sort-field";

  // ---------------------------------------------------------------------------
  // State read from the store.

  let q = $state("");
  let sort = $state<Sort>("edited");
  let view = $state<View>("all");
  let now = $state(new Date(0));
  let drafts: readonly StoredRecord[] = $state([]);
  let copies: readonly StoredRecord[] = $state([]);
  let favoritesCount = $state(0);
  let recentCount = $state(0);
  /** Record id -> the stamp payload for its indices, once the codec has arrived. */
  let stamps: Readonly<Record<string, string | undefined>> = $state({});
  /** Canvas ids the page has an engine for (or has asked for one). */
  let liveIds: ReadonlySet<string> = $state(new Set());
  let undo: Deletion | undefined = $state(held);
  let notice:
    | { text: string; tone: "plain" | "refused"; undo?: boolean }
    | undefined = $state(undefined);

  const newest = $derived(
    drafts.length === 0
      ? undefined
      : drafts.reduce((a, b) => (b.editedAt > a.editedAt ? b : a)),
  );

  /** The TYPE word: the source entry's FOR label, or the kind said plainly. */
  function typeOf(record: StoredRecord): string {
    if (record.kind === "sandbox") return typeLabel("sandbox");
    const entry = listingById(record.source);
    return typeLabel(
      "playground",
      entry === undefined ? undefined : forLabel(entry.tags[0]),
    );
  }

  /** Where a record opens: the workspace with its stamp, or the Sandbox. */
  function hrefOf(record: StoredRecord): ResolvedPathname {
    if (record.kind === "sandbox") return SANDBOX;
    const stamp = stamps[record.id];
    return stamp === undefined
      ? resolve("/playground/[id]", { id: record.source })
      : resolve(`/playground/${record.source}/#z.${stamp}`);
  }

  /** A row is live when its source is a listed Playground entry. */
  const canBeLive = (record: StoredRecord): boolean =>
    record.kind === "playground" && listingById(record.source) !== undefined;

  const rows = $derived.by((): readonly LibraryRow[] => {
    const all: LibraryRow[] = [
      ...drafts.map((record) => ({ record, status: "draft" as const })),
      ...copies.map((record) => ({ record, status: "saved" as const })),
    ].map(({ record, status }) => ({
      record,
      status,
      type: typeOf(record),
      edited: editedInWords(record.editedAt, now),
      href: hrefOf(record),
      live: liveIds.has(record.id),
    }));
    const inView =
      view === "drafts" ? all.filter((r) => r.status === "draft") : all;
    const needle = q.trim().toLowerCase();
    const found =
      needle === ""
        ? inView
        : inView.filter(
            (r) =>
              r.record.name.toLowerCase().includes(needle) ||
              r.type.toLowerCase().includes(needle),
          );
    return [...found].sort((a, b) =>
      sort === "name"
        ? a.record.name.localeCompare(b.record.name)
        : b.record.editedAt.localeCompare(a.record.editedAt),
    );
  });

  const emptyLine = $derived(
    q.trim() !== ""
      ? EMPTY_SEARCH
      : view === "drafts"
        ? EMPTY_DRAFTS
        : EMPTY_LIBRARY,
  );

  const sections = $derived<readonly RailSection[]>([
    {
      title: YOUR_LIBRARY,
      rows: [
        { id: ROW_ALL, label: ALL_SAVED, count: drafts.length + copies.length },
        { id: ROW_DRAFTS, label: DRAFTS, count: drafts.length },
        {
          id: ROW_FAVORITES.id,
          label: ROW_FAVORITES.label,
          count: favoritesCount,
          href: PLAYGROUND,
        },
        {
          id: ROW_RECENT.id,
          label: ROW_RECENT.label,
          count: recentCount,
          href: PLAYGROUND,
        },
      ],
    },
  ]);

  const selected = $derived(view === "drafts" ? ROW_DRAFTS : ROW_ALL);

  // ---------------------------------------------------------------------------
  // The store, the codec and the engines - plain bindings outside the graph.

  let mounted = false;
  let host: SimHost | undefined;
  let fileInput: HTMLInputElement | undefined;
  /** The codec and the catalog, once their dynamic imports have resolved. */
  let codec:
    | {
        knobsOf: KnobsOf;
        stampFor: (record: StoredRecord) => string | undefined;
        engineFor: (record: StoredRecord) => Promise<HostEngine>;
      }
    | undefined;
  // Plain Maps, never reactive: an engine is read on every tick (Pitfall 3).
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const engines = new Map<string, HostEngine>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const canvases = new Map<string, HTMLCanvasElement>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const registered = new Set<string>();

  function local(): LocalStore | undefined {
    if (!browser) return undefined;
    try {
      return window.localStorage;
    } catch {
      return undefined;
    }
  }

  const moment = (): string => new Date().toISOString();

  /** Re-read both record stores and the two counts. Reading never writes. */
  function readAll(): void {
    const store = local();
    now = new Date();
    drafts = Object.values(readDrafts(store));
    copies = Object.values(readLibrary(store));
    favoritesCount = readFavorites(store, (id) => listingById(id) !== undefined)
      .ids.length;
    recentCount = listRecent(store).length;
    refreshStamps();
    void buildEngines();
  }

  /** Every record's stamp, once the codec is here. */
  function refreshStamps(): void {
    if (codec === undefined) return;
    const next: Record<string, string | undefined> = {};
    for (const record of [...drafts, ...copies]) {
      next[record.id] = codec.stampFor(record);
    }
    stamps = next;
  }

  /** The canvas ids this page shows: every live row, and the banner's. */
  function wanted(): { id: string; record: StoredRecord }[] {
    const out: { id: string; record: StoredRecord }[] = [];
    for (const record of [...drafts, ...copies]) {
      if (canBeLive(record)) out.push({ id: record.id, record });
    }
    if (newest !== undefined && canBeLive(newest)) {
      out.push({ id: `resume:${newest.id}`, record: newest });
    }
    return out;
  }

  /** One engine per canvas, built once, registered when both exist. */
  async function buildEngines(): Promise<void> {
    if (codec === undefined || !mounted) return;
    const targets = wanted();
    liveIds = new Set(targets.map((t) => t.id));
    for (const { id, record } of targets) {
      if (engines.has(id)) continue;
      try {
        const engine = await codec.engineFor(record);
        if (!mounted) return;
        engines.set(id, engine);
        adopt(id);
      } catch (error) {
        console.warn(
          `My configs: no simulator engine for "${record.source}"; its thumbnail renders unlit.`,
          error,
        );
      }
    }
  }

  /** PadCanvas hands its element over from its own onMount. */
  function collect(id: string, canvas: HTMLCanvasElement): void {
    canvases.set(id, canvas);
    adopt(id);
  }

  function adopt(id: string): void {
    const canvas = canvases.get(id);
    const engine = engines.get(id);
    if (host === undefined || canvas === undefined || engine === undefined) {
      return;
    }
    if (registered.has(id)) {
      host.replaceEngine(id, engine);
      return;
    }
    host.register(id, canvas, engine);
    registered.add(id);
  }

  onMount(() => {
    mounted = true;
    host = new SimHost(motionDeps());
    host.setHero(undefined);
    readAll();
    void loadCodec();
  });

  onDestroy(() => {
    if (!mounted) return;
    mounted = false;
    host?.destroy();
    host = undefined;
    engines.clear();
    canvases.clear();
    registered.clear();
  });

  /**
   * The codec, the catalog and the engine factory, behind dynamic imports
   * so the prerendered page never carries the protocol chunk. One load.
   */
  async function loadCodec(): Promise<void> {
    const [{ encodeFor, stampKnobs }, { byId }, { createEngine }] =
      await Promise.all([
        import("$lib/share/stamp"),
        import("$lib/catalog"),
        import("$lib/sim/engine"),
      ]);
    if (!mounted) return;
    const knobsOf: KnobsOf = (id) => {
      const entry = byId(id);
      return entry === undefined ? undefined : stampKnobs(entry);
    };
    /** Positional indices -> knob id map, in the entry's rack order. */
    const indicesOf = (
      record: StoredRecord,
    ): Record<string, number> | undefined => {
      if (record.kind !== "playground") return undefined;
      const entry = byId(record.source);
      if (entry === undefined) return undefined;
      const knobs = stampKnobs(entry);
      const out: Record<string, number> = {};
      knobs.forEach((knob, at) => {
        const index = record.knobIndices[at];
        if (index !== undefined) out[knob.id] = index;
      });
      return out;
    };
    codec = {
      knobsOf,
      stampFor: (record) => {
        if (record.kind !== "playground") return undefined;
        const entry = byId(record.source);
        const indices = indicesOf(record);
        if (entry === undefined || indices === undefined) return undefined;
        return encodeFor(entry, indices);
      },
      engineFor: async (record) => {
        const entry = byId(record.source);
        if (entry === undefined) {
          throw new Error(`no catalog entry with id "${record.source}"`);
        }
        return await createEngine(entry, indicesOf(record));
      },
    };
    refreshStamps();
    await buildEngines();
  }

  // ---------------------------------------------------------------------------
  // What a control can do.

  function say(
    text: string,
    tone: "plain" | "refused" = "plain",
    withUndo = false,
  ): void {
    notice = { text, tone, undo: withUndo };
  }

  function onselect(id: string): void {
    if (id === ROW_DRAFTS) view = "drafts";
    else if (id === ROW_ALL) view = "all";
  }

  function sortChanged(event: Event): void {
    const value = (event.currentTarget as HTMLSelectElement).value;
    const next = SORTS.find((option) => option.id === value);
    if (next !== undefined) sort = next.id;
  }

  /** Rename: a copy through library.ts, a draft through drafts.ts. editedAt moves. */
  function onrename(record: StoredRecord, name: string): void {
    const store = local();
    const at = moment();
    const isDraft = drafts.some((draft) => draft.id === record.id);
    const ok = isDraft
      ? writeDraft(store, { ...record, name }, at)
      : renameCopy(store, record.id, name, at) === "written";
    if (!ok) say(STORE_REFUSED, "refused");
    readAll();
  }

  /** Export: the file, through transfer.ts, with the entry's rack when the codec is here. */
  function onexport(record: StoredRecord): void {
    downloadExport(exportFile(record, moment(), codec?.knobsOf));
  }

  /** Delete: the record leaves its store and is held for one Undo. */
  function ondelete(record: StoredRecord): void {
    const store = local();
    const isDraft = drafts.some((draft) => draft.id === record.id);
    const ok = isDraft
      ? removeDraft(store, record.id)
      : deleteCopy(store, record.id) === "written";
    if (!ok) {
      say(STORE_REFUSED, "refused");
      return;
    }
    held = { record, status: isDraft ? "draft" : "saved" };
    undo = held;
    say(deletedLine(record.name), "plain", true);
    readAll();
  }

  /** Undo: the held record goes back through its own store's write. */
  function onundo(): void {
    const deletion = undo;
    if (deletion === undefined) return;
    const store = local();
    const ok =
      deletion.status === "draft"
        ? writeDraft(store, deletion.record, deletion.record.editedAt)
        : saveCopy(store, deletion.record) !== "refused";
    if (!ok) {
      say(STORE_REFUSED, "refused");
      return;
    }
    held = undefined;
    undo = undefined;
    say(restoredLine(deletion.record.name));
    readAll();
  }

  /** Import config: the hidden input's chooser. */
  function chooseFile(): void {
    fileInput?.click();
  }

  /** The chosen file, through the six steps; nothing is written until all pass. */
  async function onfile(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (file === undefined) return;
    const text = await file.text();
    if (codec === undefined) await loadCodec();
    if (codec === undefined || !mounted) return;
    const result = importText(local(), text, codec.knobsOf, moment());
    if (result.landing.kind === "unreadable" || result.record === undefined) {
      say(importRefused(file.name, result.reason ?? ""), "refused");
      return;
    }
    if (!result.stored) {
      say(STORE_REFUSED, "refused");
      return;
    }
    readAll();
    if (result.landing.kind === "older") {
      say(importedLine(result.record.name, result.reason));
      return;
    }
    say(importedLine(result.record.name));
    // Section 11: validated BEFORE opening - and now it opens.
    if (result.record.kind === "playground") {
      await goto(hrefOf(result.record));
    }
  }

  /* The shell: MY CONFIGS current, the breadcrumb, the sentence, the rail. */
  $effect(() =>
    fillShell({
      variant: "app",
      section: "my-configs",
      breadcrumb: BREADCRUMB,
      status: STATUS,
      rail,
    }),
  );
</script>

<svelte:head>
  <title>{TITLE}</title>
  <meta name="description" content={SUB} />
  <meta name="robots" content="noindex" />
</svelte:head>

{#snippet rail()}
  <Rail {sections} {selected} {onselect} />
{/snippet}

<section class="library-page" data-testid="my-configs">
  <header class="top">
    <div class="words">
      <p class="eyebrow type-micro">{EYEBROW}</p>
      <h1 class="headline type-page-title">{HEADLINE}</h1>
      <p class="sub">{SUB}</p>
    </div>
    <div class="actions">
      <button
        class="outlined"
        type="button"
        data-testid="import-config"
        onclick={chooseFile}>{IMPORT_CONFIG}</button
      >
      <input
        bind:this={fileInput}
        class="file-input"
        type="file"
        accept={EXPORT_ACCEPT}
        data-testid="import-file"
        tabindex="-1"
        aria-hidden="true"
        onchange={onfile}
      />
      <a class="filled" href={SANDBOX} data-testid="new-surface"
        >{NEW_SURFACE}</a
      >
    </div>
  </header>

  <!-- One live region: the import's outcome, a deletion and its Undo, a refused store. -->
  <p
    class="notice"
    class:refused={notice?.tone === "refused"}
    role="status"
    data-testid="library-notice"
  >
    {#if notice}
      <span>{notice.text}</span>
      {#if notice.undo && undo !== undefined}
        <button
          class="undo"
          type="button"
          data-testid="library-undo"
          onclick={onundo}>{UNDO}</button
        >
      {/if}
    {/if}
  </p>

  {#if newest !== undefined}
    <div class="banner">
      <ResumeBanner
        draft={newest}
        type={typeOf(newest)}
        edited={relativeTime(newest.editedAt, now)}
        href={hrefOf(newest)}
        onready={collect}
      />
    </div>
  {/if}

  <search class="toolbar">
    <div class="field">
      <label class="caption type-micro" for={SEARCH_ID}>{SEARCH_LABEL}</label>
      <input
        id={SEARCH_ID}
        data-testid="library-search"
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        spellcheck="false"
        placeholder={SEARCH_PLACEHOLDER}
        bind:value={q}
      />
    </div>
    <div class="sort">
      <label class="caption type-micro" for={SORT_ID}>{SORT_LABEL}</label>
      <div class="select-wrap">
        <select
          id={SORT_ID}
          data-testid="library-sort"
          value={sort}
          onchange={sortChanged}
        >
          {#each SORTS as option (option.id)}
            <option value={option.id}>{option.label}</option>
          {/each}
        </select>
      </div>
    </div>
  </search>

  <p class="count" data-testid="library-count">{countLine(rows.length)}</p>

  <LibraryTable
    {rows}
    empty={emptyLine}
    onready={collect}
    {onrename}
    {onexport}
    {ondelete}
  />
</section>

<style>
  /* The PDF's centre: content from x 259 against a rail ending at 224, on the frame's 24 pad. */
  .library-page {
    padding-inline: 11px;
    padding-block: 16px 48px;
    text-align: start;
  }

  /* The words at the left, the two buttons at the top right. */
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px 24px;
  }

  .words {
    min-inline-size: 0;
  }

  .eyebrow {
    margin: 0 0 12px;
    color: var(--color-ink-quiet);
  }

  .headline {
    margin: 0 0 12px;
    color: var(--color-ink);
  }

  .sub {
    margin: 0;
    max-inline-size: 62ch;
    font-family: var(--font-sans);
    font-size: 17px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  .actions {
    display: flex;
    flex: none;
    gap: 12px;
    padding-block-start: 24px;
  }

  /* Outlined and filled, the PDF's two shapes at the 44 floor, square (D-01). */
  .outlined,
  .filled {
    display: grid;
    place-items: center;
    min-inline-size: 148px;
    min-block-size: 44px;
    padding-inline: 20px;
    font-family: var(--font-sans);
    font-size: 15px;
    font-weight: 600;
    line-height: 1.2;
    text-decoration: none;
    cursor: pointer;
  }

  .outlined {
    border: 1px solid var(--color-boundary);
    background: transparent;
    color: var(--color-ink);
    transition: border-color 140ms ease-out;
  }

  .outlined:hover {
    border-color: var(--color-action);
  }

  .filled {
    border: 0;
    background: var(--color-action);
    color: var(--color-on-action);
  }

  .filled:hover {
    color: var(--color-on-action);
  }

  /* The chooser is the button above; the input itself is never seen. */
  .file-input {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
  }

  /* The live region keeps its line so the layout never jumps when it speaks. */
  .notice {
    display: flex;
    align-items: center;
    gap: 12px;
    min-block-size: 24px;
    margin: 16px 0 0;
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.45;
    color: var(--color-ink-quiet);
  }

  .notice.refused {
    color: var(--color-ink);
  }

  .undo {
    min-block-size: 24px;
    padding: 0 4px;
    border: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 600;
    color: var(--color-action);
    cursor: pointer;
  }

  .banner {
    margin-block-start: 16px;
  }

  /* The PDF's second search row: the field wide, the sort at its right. */
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 16px 24px;
    margin-block-start: 32px;
  }

  .field {
    flex: 1 1 320px;
    min-inline-size: 0;
  }

  .sort {
    flex: 0 1 300px;
  }

  .caption {
    display: block;
    margin-block-end: 8px;
    color: var(--color-ink-quiet);
  }

  .field input,
  .sort select {
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    appearance: none;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink);
  }

  .field input::placeholder {
    color: var(--color-ink-quiet);
    opacity: 1;
  }

  .field input::-webkit-search-cancel-button {
    display: none;
  }

  .select-wrap {
    position: relative;
  }

  .select-wrap::after {
    content: "";
    position: absolute;
    inset-inline-end: 18px;
    inset-block-start: 50%;
    inline-size: 8px;
    block-size: 8px;
    border-inline-end: 1px solid var(--color-ink-quiet);
    border-block-end: 1px solid var(--color-ink-quiet);
    transform: translateY(-70%) rotate(45deg);
    pointer-events: none;
  }

  .sort select {
    padding-inline-end: 44px;
    cursor: pointer;
  }

  .sort select option {
    background: var(--color-panel);
    color: var(--color-ink);
  }

  /* `12 saved configurations`, quiet, above the table. */
  .count {
    margin: 24px 0 12px;
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  @media (prefers-reduced-motion: reduce) {
    .outlined {
      transition: none;
    }
  }
</style>
