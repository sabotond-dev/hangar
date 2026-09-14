<!--
  /my-configs/ - PDF page 4, the personal library on the shell (13-13; Bible sections 9 and 11;
  KEEP-01..06, SHARE-03). The frame's shape travels as page data (+page.ts); the rail (YOUR
  LIBRARY's four counts, a divider, COLLECTIONS) and the rows arrive with the effect.
  The table lists drafts.ts's and library.ts's records together, sorted by last edit, the STATUS
  chip saying which; Favorites and Recently used link to the gallery (they are catalog lists).
  One SimHost and one animation frame own every thumbnail: a Lua entry's engine takes the record's
  own indices, a preset-backed one shows the base configuration; nothing stores a picture (13-06).
  Open and Resume encode the record's indices through stamp.ts; export and import are transfer.ts's;
  a deletion is held in a module-level variable for one Undo (D-22 fork B). At module scope the
  catalog is $lib/catalog/listing; the codec, the catalog and the engine factory arrive by dynamic import from onMount.
  Decided at 13-13 (D-22 fork B); see .planning/phases/13-gui-overhaul/13-13-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script module lang="ts">
  import type { Collection } from "$lib/store/collections";
  import type { StoredRecord } from "$lib/store/schema";
  import type { Status } from "$lib/ui/library/words";

  /**
   * What one deletion needs to be undone: a record with the collections it
   * was filed in (fork A's reconciliation, reversed), or a whole collection.
   */
  type Deletion =
    | {
        readonly kind: "record";
        readonly record: StoredRecord;
        readonly status: Status;
        readonly memberOf: readonly string[];
      }
    | { readonly kind: "collection"; readonly collection: Collection };

  /** The session's undo vector (D-22 fork B): the last deletion, module-level, never written anywhere. */
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
  import {
    collectionsOf,
    createCollection,
    deleteCollection,
    readCollections,
    removeFromAll,
    renameCollection,
    restoreCollection,
    setMember,
  } from "$lib/store/collections";
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

  /* COLLECTIONS (D-22): the PDF's two strings verbatim, the rest HANGAR's, ledgered. */
  const COLLECTIONS = "COLLECTIONS";
  const NEW_COLLECTION = "+ New collection";
  const COLLECTION_NAME = "Collection name";
  const CREATE = "Create";
  const CANCEL = "Cancel";
  const RENAME_COLLECTION = "Rename";
  const DELETE_COLLECTION = "Delete collection";
  const emptyCollection = (name: string) =>
    `Nothing in ${name} yet. Add a configuration from All saved.`;
  const renameCollectionName = (name: string) => `Rename ${name}`;
  const deleteCollectionName = (name: string) =>
    `Delete the collection ${name}`;

  type Sort = "edited" | "name";
  const SORTS: readonly { id: Sort; label: string }[] = [
    { id: "edited", label: SORT_EDITED },
    { id: "name", label: SORT_NAME },
  ];

  /** All saved, Drafts, or one collection by its row id. */
  type View = "all" | "drafts" | `collection:${string}`;

  /** The rail's four rows: two views over this table, two destinations on the gallery. */
  const ROW_ALL = "all";
  const ROW_DRAFTS = "drafts";
  const ROW_NEW_COLLECTION = "collection:new";
  const [, ROW_FAVORITES, ROW_RECENT] = LIBRARY_ROWS;
  const collectionRow = (id: string): View => `collection:${id}`;

  const PLAYGROUND: ResolvedPathname = SECTIONS[0].href;
  /** New surface: the Sandbox's front door told to mint rather than resume (13-16). */
  const NEW_SURFACE_HREF = resolve("/sandbox/?new");
  /** A saved copy: the same front door told to mint AND to load the copy (13-17). */
  const fromCopyHref = (id: string): ResolvedPathname =>
    resolve(`/sandbox/?from=${encodeURIComponent(id)}`);

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
  /** The collections, pruned on read; the drop count is read and not rendered (13-06's open question). */
  let collections: readonly Collection[] = $state([]);
  let collectionsDropped = $state(0);
  /** The `+ New collection` form, and the name as typed. */
  let creating = $state(false);
  let newName = $state("");
  /** The selected collection's inline rename. */
  let renamingCollection = $state(false);
  let collectionName = $state("");

  const newest = $derived(
    drafts.length === 0
      ? undefined
      : drafts.reduce((a, b) => (b.editedAt > a.editedAt ? b : a)),
  );

  /** The collection the view names, if any. */
  const current = $derived(
    view.startsWith("collection:")
      ? collections.find((c) => collectionRow(c.id) === view)
      : undefined,
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

  /** Where a record opens: the workspace with its stamp, or the Sandbox (13-16, 13-17). */
  function hrefOf(record: StoredRecord): ResolvedPathname {
    if (record.kind === "sandbox") {
      // A draft opens its own surface; a saved or imported copy opens onto a fresh surface id (13-17).
      return drafts.some((d) => d.id === record.id)
        ? resolve("/sandbox/[draftId]", { draftId: record.source })
        : fromCopyHref(record.id);
    }
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
      view === "drafts"
        ? all.filter((r) => r.status === "draft")
        : current !== undefined
          ? all.filter((r) => current.members.includes(r.record.id))
          : all;
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
        : current !== undefined
          ? emptyCollection(current.name)
          : EMPTY_LIBRARY,
  );

  /* The rail: YOUR LIBRARY, a divider, COLLECTIONS (fork C: the `+ New collection` row is never hidden). */
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
    {
      title: COLLECTIONS,
      rows: [
        ...collections.map((collection) => ({
          id: collectionRow(collection.id),
          label: collection.name,
        })),
        { id: ROW_NEW_COLLECTION, label: NEW_COLLECTION },
      ],
    },
  ]);

  const selected = $derived(
    current !== undefined
      ? collectionRow(current.id)
      : view === "drafts"
        ? ROW_DRAFTS
        : ROW_ALL,
  );

  /** The route's validator for a member id: a draft or a saved copy. */
  const knownRecord = (id: string): boolean =>
    drafts.some((d) => d.id === id) || copies.some((c) => c.id === id);

  /** The collections a record is in, for the table's select. */
  const memberOf = (recordId: string): readonly string[] =>
    collectionsOf(collections, recordId);

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

  /** The route's edge to the browser store, one per route (13.2-CONTEXT D-15). */
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
    // After both record lists, so the validator sees them (fork A's drop rule).
    const filed = readCollections(store, knownRecord);
    collections = filed.list;
    collectionsDropped = filed.dropped;
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

  /** The codec, the catalog and the engine factory, behind dynamic imports; one load. */
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

  /** A rail row: a view over the table, a collection, or the new-collection form. */
  function onselect(id: string): void {
    renamingCollection = false;
    if (id === ROW_DRAFTS) view = "drafts";
    else if (id === ROW_ALL) view = "all";
    else if (id === ROW_NEW_COLLECTION) {
      creating = true;
      newName = "";
    } else if (collections.some((c) => collectionRow(c.id) === id)) {
      view = id as View;
    }
  }

  // ---------------------------------------------------------------------------
  // Collections (D-22): create, rename, delete with the session's undo, file.

  /** A collection id: the moment, base 36, like the workspace's copy ids. */
  const mintCollectionId = (): string =>
    `collection:${Date.now().toString(36)}`;

  function oncreate(): void {
    const name = newName.trim();
    if (name.length === 0) return;
    const id = mintCollectionId();
    const outcome = createCollection(local(), id, name, moment());
    if (outcome !== "written") {
      say(STORE_REFUSED, "refused");
      return;
    }
    creating = false;
    newName = "";
    readAll();
    view = collectionRow(id);
  }

  function oncancelCreate(): void {
    creating = false;
    newName = "";
  }

  function createKeys(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      oncreate();
    } else if (event.key === "Escape") {
      event.preventDefault();
      oncancelCreate();
    }
  }

  function startRenameCollection(): void {
    if (current === undefined) return;
    collectionName = current.name;
    renamingCollection = true;
  }

  function commitRenameCollection(): void {
    if (!renamingCollection || current === undefined) return;
    renamingCollection = false;
    const name = collectionName.trim();
    if (name.length === 0 || name === current.name) return;
    if (renameCollection(local(), current.id, name) !== "written") {
      say(STORE_REFUSED, "refused");
    }
    readAll();
  }

  function renameCollectionKeys(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      commitRenameCollection();
    } else if (event.key === "Escape") {
      event.preventDefault();
      renamingCollection = false;
    }
  }

  /** Delete the selected collection; it is held for one Undo (fork B). */
  function ondeleteCollection(): void {
    if (current === undefined) return;
    const removed = deleteCollection(local(), current.id);
    if (removed === undefined) {
      say(STORE_REFUSED, "refused");
      return;
    }
    held = { kind: "collection", collection: removed };
    undo = held;
    view = "all";
    say(deletedLine(removed.name), "plain", true);
    readAll();
  }

  /** File a record in a collection (fork A: it may already be in others). */
  function onfileRecord(record: StoredRecord, collectionId: string): void {
    if (setMember(local(), collectionId, record.id, true) !== "written") {
      say(STORE_REFUSED, "refused");
    }
    readAll();
  }

  /** Take a record out of the selected collection; the record itself stays. */
  function onunfileRecord(record: StoredRecord, collectionId: string): void {
    if (setMember(local(), collectionId, record.id, false) !== "written") {
      say(STORE_REFUSED, "refused");
    }
    readAll();
  }

  /** Focus a field the moment it mounts. */
  function focusOnMount(node: HTMLInputElement): void {
    node.focus();
    node.select();
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

  /** Delete: the record leaves its store and every collection (fork A's removeFromAll), held for one Undo. */
  function ondelete(record: StoredRecord): void {
    const store = local();
    const isDraft = drafts.some((draft) => draft.id === record.id);
    const wasIn = removeFromAll(store, record.id);
    const ok =
      wasIn !== undefined &&
      (isDraft
        ? removeDraft(store, record.id)
        : deleteCopy(store, record.id) === "written");
    if (!ok) {
      say(STORE_REFUSED, "refused");
      readAll();
      return;
    }
    held = {
      kind: "record",
      record,
      status: isDraft ? "draft" : "saved",
      memberOf: wasIn,
    };
    undo = held;
    say(deletedLine(record.name), "plain", true);
    readAll();
  }

  /** Undo: the held thing goes back through its own store's write, memberships too. */
  function onundo(): void {
    const deletion = undo;
    if (deletion === undefined) return;
    const store = local();
    let ok: boolean;
    let name: string;
    if (deletion.kind === "collection") {
      ok = restoreCollection(store, deletion.collection) !== "refused";
      name = deletion.collection.name;
    } else {
      ok =
        deletion.status === "draft"
          ? writeDraft(store, deletion.record, deletion.record.editedAt)
          : saveCopy(store, deletion.record) !== "refused";
      for (const collectionId of deletion.memberOf) {
        ok =
          setMember(store, collectionId, deletion.record.id, true) !==
            "refused" && ok;
      }
      name = deletion.record.name;
    }
    if (!ok) {
      say(STORE_REFUSED, "refused");
      return;
    }
    held = undefined;
    undo = undefined;
    say(restoredLine(name));
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
      <a class="filled" href={NEW_SURFACE_HREF} data-testid="new-surface"
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

  <!-- `+ New collection`: one field, Create and Cancel, above the table (fork C: nothing else is offered). -->
  {#if creating}
    <form
      class="create"
      data-testid="collection-create"
      onsubmit={(event) => {
        event.preventDefault();
        oncreate();
      }}
    >
      <label class="caption type-micro" for="collection-name-field"
        >{COLLECTION_NAME}</label
      >
      <div class="create-row">
        <input
          id="collection-name-field"
          class="create-field"
          type="text"
          autocomplete="off"
          data-testid="collection-name"
          bind:value={newName}
          use:focusOnMount
          onkeydown={createKeys}
        />
        <button
          class="filled small"
          type="submit"
          data-testid="collection-create-submit"
          disabled={newName.trim().length === 0}>{CREATE}</button
        >
        <button
          class="outlined small"
          type="button"
          data-testid="collection-create-cancel"
          onclick={oncancelCreate}>{CANCEL}</button
        >
      </div>
    </form>
  {/if}

  <!-- The selected collection: its name (renamable inline), and its one destructive control. -->
  {#if current !== undefined}
    <div class="collection-head" data-testid="collection-head">
      {#if renamingCollection}
        <input
          class="collection-rename type-field"
          type="text"
          data-testid="collection-rename-field"
          aria-label={renameCollectionName(current.name)}
          bind:value={collectionName}
          use:focusOnMount
          onblur={commitRenameCollection}
          onkeydown={renameCollectionKeys}
        />
      {:else}
        <h2 class="collection-name" data-testid="collection-title">
          {current.name}
        </h2>
      {/if}
      <div class="collection-actions">
        <button
          class="quiet"
          type="button"
          data-testid="collection-rename"
          aria-label={renameCollectionName(current.name)}
          onclick={startRenameCollection}>{RENAME_COLLECTION}</button
        >
        <button
          class="quiet"
          type="button"
          data-testid="collection-delete"
          aria-label={deleteCollectionName(current.name)}
          onclick={ondeleteCollection}>{DELETE_COLLECTION}</button
        >
      </div>
    </div>
  {/if}

  <p
    class="count"
    data-testid="library-count"
    data-dropped={collectionsDropped}
  >
    {countLine(rows.length)}
  </p>

  <LibraryTable
    {rows}
    empty={emptyLine}
    {collections}
    {memberOf}
    removeFrom={current}
    onready={collect}
    {onrename}
    {onexport}
    {ondelete}
    onfile={onfileRecord}
    onunfile={onunfileRecord}
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

  /* The new-collection form: a caption, a field and two small buttons in a row. */
  .create {
    margin-block-start: 24px;
    padding: 16px;
    background: var(--color-panel);
    border: 1px solid var(--color-divider);
  }

  .create-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .create-field {
    box-sizing: border-box;
    flex: 1 1 240px;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    appearance: none;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 16px;
    line-height: 1.5;
    color: var(--color-ink);
  }

  .small {
    min-inline-size: 96px;
  }

  .filled:disabled {
    opacity: 0.5;
    cursor: default;
  }

  /* The selected collection's head: the name in the panel-title role, two quiet actions. */
  .collection-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px 24px;
    margin-block-start: 24px;
  }

  .collection-name {
    margin: 0;
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 700;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }

  .collection-rename {
    box-sizing: border-box;
    inline-size: min(100%, 32ch);
    min-block-size: 44px;
    padding-inline: 12px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    appearance: none;
    background: transparent;
    color: var(--color-ink);
  }

  .collection-actions {
    display: flex;
    gap: 4px;
  }

  .quiet {
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 8px;
    border: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    line-height: 1.2;
    color: var(--color-ink-quiet);
    cursor: pointer;
    transition: color 160ms ease-out;
  }

  .quiet:hover {
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
    .outlined,
    .quiet {
      transition: none;
    }
  }
</style>
