<!--
  /playground/ - PDF page 2, the configuration gallery, on the shell (13-08; at /browse/ until D-20).
  The centre: eyebrow, headline, sub, the search row with its sort, one `Use` chip row with the count,
  the three-column card grid and the fidelity line. The rail is a snippet through fillShell(): YOUR
  LIBRARY's counts, MADE FOR with one row per FOR_TERMS member (FOR_LABELS), `+ Build your own` pinned;
  the frame's shape travels as page data (+page.ts). The rail and the chip row are one state; Favorites
  and Recently used are a library view over the store, never in the address (a shared link must not lie).
  The address is a projection of the state, seeded once at init behind a `browser` guard, written on a
  500 ms trailing timer by replaceState, flushed before leaving; the browse-return record (sessionStorage)
  restores scroll, filters and search from the nearest scrolling ancestor. The page's only catalog
  specifier is $lib/catalog/listing - config-shape.spec.ts test 13 holds it by name, test 14 on the build.
  Decided at 13-08 (13-CONTEXT D-11, D-12, D-20); see .planning/phases/13-gui-overhaul/13-08-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { browser } from "$app/environment";
  import { afterNavigate, beforeNavigate, replaceState } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { onDestroy, onMount, untrack } from "svelte";
  import {
    FEELS_TERMS,
    FOR_TERMS,
    LEGACY_TAG_MAP,
    type FacetName,
    type ForTerm,
  } from "$lib/browse/facets";
  import {
    filterListing,
    NO_FACETS,
    type ActiveFacets,
  } from "$lib/browse/filter";
  import {
    DEFAULT_QUERY,
    parseBrowseQuery,
    serialiseBrowseQuery,
    type BrowseVocabulary,
  } from "$lib/browse/query";
  import {
    forRowId,
    forTermOf,
    railSections,
    type LibraryView,
  } from "$lib/browse/rail";
  import {
    clearBrowseReturn,
    readBrowseReturn,
    writeBrowseReturn,
    type ReturnStore,
  } from "$lib/browse/return";
  import { sortListing, type BrowseSort } from "$lib/browse/sort";
  import { LISTING, listingById } from "$lib/catalog/listing";
  import { SITE_ORIGIN } from "$lib/share/url";
  import { readFavorites, toggleFavorite } from "$lib/store/favorites";
  import { listRecent } from "$lib/store/recent";
  import { ogAlt } from "$lib/tune/copy";
  import BrowseGrid from "$lib/ui/BrowseGrid.svelte";
  import BrowseToolbar from "$lib/ui/BrowseToolbar.svelte";
  import { FIDELITY_LINE } from "$lib/ui/fidelity-line";
  import Rail from "$lib/ui/shell/Rail.svelte";
  import { SECTIONS, fillShell } from "$lib/ui/shell/shell.svelte";

  /* The PDF's page 2 strings, verbatim, as consts rather than inline markup
     text: Prettier reflows element text and Phase 2 lost a sentence to that. */
  const SITE = "HANGAR";
  const EYEBROW = "THE CONFIGURATION PLAYGROUND";
  const HEADLINE = "Find your next gesture.";
  const SUB =
    "Playable ideas for your surface. Open one, try it, make it yours.";
  const BREADCRUMB = ["PLAYGROUND", "CONFIGURATIONS"];
  const STATUS = "Browse. Preview. Make it yours.";
  const NOTE_LINE_1 = "Start with a configuration.";
  const NOTE_LINE_2 = "Make it feel like you.";
  const BUILD_YOUR_OWN = "+ Build your own";

  /* HANGAR's own: the document title, ledgered for 13-18. */
  const TITLE = "Playground — HANGAR";
  const DESCRIPTION = SUB;

  /* The head's fixed half, exactly as / writes it. twitter:card is what makes
     Discord render a large embed rather than an 80x80 thumbnail. */
  const OG_TYPE = "website";
  const OG_URL = `${SITE_ORIGIN}/playground/`;
  const OG_IMAGE_TYPE = "image/png";
  const OG_IMAGE_WIDTH = "1200";
  const OG_IMAGE_HEIGHT = "630";
  const TWITTER_CARD = "summary_large_image";

  /* No gallery-level picture: the gallery unfurls on the catalog's first entry, read out of LISTING. */
  const OPENING = LISTING[0];
  const OG_IMAGE = `${SITE_ORIGIN}/og/${OPENING.id}.png`;
  const OG_IMAGE_ALT = ogAlt(OPENING.name);

  /** The address settles this long after the last keystroke or chip press. */
  const ADDRESS_DELAY_MS = 500;

  /** The gallery's own address, the site's trailing slash included. */
  const PLAYGROUND = "/playground/";

  /** The closed vocabulary and the legacy table, so query.ts imports neither. */
  const VOCABULARY: BrowseVocabulary = {
    for: FOR_TERMS,
    feels: FEELS_TERMS,
    legacy: LEGACY_TAG_MAP,
  };

  /*
    ONCE, at component init, and only in the browser. untrack captures the
    initial value and nothing more. Never a $derived over page.url.
  */
  const seed = () =>
    browser
      ? parseBrowseQuery(page.url.searchParams, VOCABULARY)
      : DEFAULT_QUERY;
  const initial = untrack(seed);

  let sort: BrowseSort = $state(initial.sort);
  let q = $state(initial.q);
  let active: ActiveFacets = $state({
    for: [...initial.for],
    feels: [...initial.feels],
  });

  /* The library view and the two lists behind it, read from the store in onMount. */
  let library: LibraryView = $state("all");
  let favorites: readonly string[] = $state([]);
  let dropped = $state(0);
  let recent: readonly string[] = $state([]);

  /** True when the catalog still carries the id: the favorites validator. */
  const known = (id: string): boolean => listingById(id) !== undefined;

  /** The entries the library view admits, before the query and the chips. */
  const inLibrary = $derived.by(() => {
    if (library === "all") return LISTING;
    const ids = new Set(library === "favorites" ? favorites : recent);
    return LISTING.filter((entry) => ids.has(entry.id));
  });

  /* Filter first, then sort: filterListing is O(n) and sortListing allocates. */
  const shown = $derived(
    sortListing(filterListing(inLibrary, q, active), sort),
  );

  /** The rail's rows, derived from the vocabulary and the store's counts. */
  const sections = $derived(
    railSections({
      all: LISTING.length,
      favorites: favorites.length,
      recent: recent.length,
    }),
  );

  /**
   * The current rail row: the library view when not All configs; else the one active FOR term's row;
   * else All configs; else (two or more FOR chips, which the rail cannot express) nothing.
   */
  const selected = $derived.by((): string | undefined => {
    if (library !== "all") return library;
    if (active.for.length === 0) return "all";
    if (active.for.length === 1) {
      const term = FOR_TERMS.find((t) => t === active.for[0]);
      return term === undefined ? undefined : forRowId(term);
    }
    return undefined;
  });

  /* Plain locals outside the reactive graph: a mounted flag, a timer handle, the section element. */
  let mounted = false;
  let addressTimer: ReturnType<typeof setTimeout> | undefined;
  let root: HTMLElement | undefined;

  /** The session store, or undefined - the property access is inside the try. */
  function store(): ReturnStore | undefined {
    if (!browser) return undefined;
    try {
      return window.sessionStorage;
    } catch {
      return undefined;
    }
  }

  /** The local store, or undefined - the route's own edge to the browser store (13.2-CONTEXT D-15). */
  function local(): Storage | undefined {
    if (!browser) return undefined;
    try {
      return window.localStorage;
    } catch {
      return undefined;
    }
  }

  /** Read both lists. Reading never writes; the drop count is kept beside the list. */
  function readLibrary(): void {
    const read = readFavorites(local(), known);
    favorites = read.ids;
    dropped = read.dropped;
    recent = listRecent(local()).map((item) => item.id);
  }

  /**
   * The nearest scrolling ancestor of this page (the shell's centre column in the wide and compact
   * bands; the window below 1024). Read on the forward hop, written on return.
   */
  function scroller(): { read(): number; write(y: number): void } {
    let el: HTMLElement | null = root?.parentElement ?? null;
    while (el !== null && el !== document.body) {
      const overflow = getComputedStyle(el).overflowY;
      if (overflow === "auto" || overflow === "scroll") {
        const target = el;
        return {
          read: () => target.scrollTop,
          write: (y) => {
            target.scrollTop = y;
          },
        };
      }
      el = el.parentElement;
    }
    return {
      read: () => window.scrollY,
      write: (y) => window.scrollTo(0, y),
    };
  }

  /** The address this view WOULD have, composed from the state. */
  function currentHref(): string {
    const search = serialiseBrowseQuery({ sort, q, ...active });
    return search === "" ? PLAYGROUND : `${PLAYGROUND}?${search}`;
  }

  /**
   * Write the address. resolve() accepts a pathname carrying a search string, so both branches satisfy
   * svelte/no-navigation-without-resolve; page.state rather than {} so nobody's shallow state is replaced.
   */
  function writeAddress(): void {
    if (!mounted) return;
    const search = serialiseBrowseQuery({ sort, q, ...active });
    if (search === "") replaceState(resolve("/playground/"), page.state);
    else replaceState(resolve(`/playground/?${search}`), page.state);
  }

  /** The 500 ms trailing timer, so a burst of typing writes the address once. */
  function scheduleAddress(): void {
    if (!mounted) return;
    if (addressTimer !== undefined) clearTimeout(addressTimer);
    addressTimer = setTimeout(() => {
      addressTimer = undefined;
      writeAddress();
    }, ADDRESS_DELAY_MS);
  }

  /** Write it now. Called before leaving, so no navigation carries a stale one. */
  function flushAddress(): void {
    if (addressTimer === undefined) return;
    clearTimeout(addressTimer);
    addressTimer = undefined;
    writeAddress();
  }

  // ---------------------------------------------------------------------------
  // What a control can do, and the one thing all of them then do.

  function onsort(next: BrowseSort): void {
    sort = next;
    scheduleAddress();
  }

  function onquery(next: string): void {
    q = next;
    scheduleAddress();
  }

  /** One chip, in the row that owns it. Pressing an active one removes it. */
  function onfacet(facet: FacetName, term: string): void {
    const row = active[facet];
    const next = row.includes(term)
      ? row.filter((on) => on !== term)
      : [...row, term];
    active =
      facet === "for" ? { ...active, for: next } : { ...active, feels: next };
    scheduleAddress();
  }

  /** The query, every chip and the library view, and never the sort. */
  function onclear(): void {
    q = "";
    active = NO_FACETS;
    library = "all";
    scheduleAddress();
  }

  /** A rail row: a library view, or the FOR facet set to exactly that term. */
  function onselect(id: string): void {
    const term: ForTerm | undefined = forTermOf(id);
    if (term !== undefined) {
      library = "all";
      active = { ...active, for: [term] };
    } else if (id === "all") {
      library = "all";
      active = { ...active, for: [] };
    } else if (id === "favorites" || id === "recent") {
      library = id;
    }
    scheduleAddress();
  }

  /** The star: flip the store, then re-read it so the card and the rail agree. */
  function onfavorite(id: string): void {
    toggleFavorite(local(), id, known);
    readLibrary();
  }

  /*
    The return record, written from the state on the forward hop into a configuration only, after the
    address is flushed so the two agree; a same-route navigation writes nothing.
  */
  beforeNavigate((navigation) => {
    const to = navigation.to?.url.pathname ?? "";
    if (!to.startsWith(PLAYGROUND) || to === PLAYGROUND) return;
    flushAddress();
    writeBrowseReturn(store(), {
      href: currentHref(),
      scrollY: scroller().read(),
    });
  });

  /*
    The second seed, for the browser's Back button only: Kit's replaceState records the page store's
    url, which it never updates, so a popstate hands the page an address one visit stale;
    window.location.search is the browser's own answer. Measured in four journeys (05.1-10).
  */
  afterNavigate((navigation) => {
    if (!browser || navigation.type !== "popstate") return;
    const restored = parseBrowseQuery(
      new URLSearchParams(window.location.search),
      VOCABULARY,
    );
    if (addressTimer !== undefined) {
      clearTimeout(addressTimer);
      addressTimer = undefined;
    }
    sort = restored.sort;
    q = restored.q;
    active = { for: [...restored.for], feels: [...restored.feels] };
  });

  /*
    The scroll restore, for the forward hop only, against the record's href; cleared either way. A
    legacy address (?tag=, a retired sort) is re-written once on arrival through the ordinary timer.
    Refused on purpose: `export const snapshot`, `data-sveltekit-noscroll`, `content-visibility: auto`
    on the cards (it destroys scroll restoration), `pushState` (sixteen chip presses, sixteen Backs).
  */
  onMount(() => {
    mounted = true;
    readLibrary();

    const entered = `${window.location.pathname}${window.location.search}`;
    if (entered !== currentHref()) scheduleAddress();

    const record = readBrowseReturn(store());
    clearBrowseReturn(store());
    if (record === undefined || record.href !== currentHref()) return;
    scroller().write(record.scrollY);
  });

  onDestroy(() => {
    // onDestroy runs during prerender, where no timer was ever set.
    if (addressTimer === undefined) return;
    clearTimeout(addressTimer);
    addressTimer = undefined;
  });

  /* The shell: PLAYGROUND current, the breadcrumb, the status line, the rail. */
  $effect(() =>
    fillShell({
      variant: "app",
      section: "playground",
      breadcrumb: BREADCRUMB,
      status: STATUS,
      rail,
    }),
  );
</script>

<svelte:head>
  <title>{TITLE}</title>
  <meta name="description" content={DESCRIPTION} />
  <meta property="og:type" content={OG_TYPE} />
  <meta property="og:site_name" content={SITE} />
  <meta property="og:title" content={TITLE} />
  <meta property="og:description" content={DESCRIPTION} />
  <meta property="og:url" content={OG_URL} />
  <meta property="og:image" content={OG_IMAGE} />
  <meta property="og:image:type" content={OG_IMAGE_TYPE} />
  <meta property="og:image:width" content={OG_IMAGE_WIDTH} />
  <meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
  <meta property="og:image:alt" content={OG_IMAGE_ALT} />
  <meta name="twitter:card" content={TWITTER_CARD} />
</svelte:head>

{#snippet rail()}
  <Rail {sections} {selected} {onselect}>
    {#snippet note()}
      <p class="note-line">{NOTE_LINE_1}</p>
      <p class="note-line">{NOTE_LINE_2}</p>
    {/snippet}
    {#snippet action()}
      <a class="build" href={SECTIONS[1].href} data-testid="rail-build"
        >{BUILD_YOUR_OWN}</a
      >
    {/snippet}
  </Rail>
{/snippet}

<section class="playground" data-testid="browse" bind:this={root}>
  <p class="eyebrow type-micro">{EYEBROW}</p>
  <h1 class="headline type-page-title">{HEADLINE}</h1>
  <p class="sub">{SUB}</p>

  <div class="toolbar">
    <BrowseToolbar
      entries={LISTING}
      {sort}
      {q}
      {active}
      narrowed={library !== "all"}
      showing={shown.length}
      total={LISTING.length}
      {onsort}
      {onquery}
      {onfacet}
      {onclear}
    />
  </div>

  <!-- `onreorder` is not wired (it would write the address on every keystroke); `dropped` is read and not rendered. -->
  <div class="grid" data-dropped={dropped}>
    <BrowseGrid
      entries={shown}
      total={LISTING.length}
      {favorites}
      {onfavorite}
    />
  </div>

  <!-- The fidelity line, beneath the grid and unconditional (W-13): one source shared with FidelityLine.svelte. -->
  <p class="fidelity" data-testid="fidelity-line">{FIDELITY_LINE}</p>
</section>

<style>
  /* The PDF's centre: content from x 259 against a rail ending at 224, on the frame's 24 pad. */
  .playground {
    padding-inline: 11px;
    padding-block: 16px 48px;
    text-align: start;
  }

  .eyebrow {
    margin: 0 0 12px;
    color: var(--color-ink-quiet);
  }

  /* The page title role: 36px in the display face (D-17). */
  .headline {
    margin: 0 0 12px;
    color: var(--color-ink);
  }

  /* The PDF's ~17px sub, quiet. */
  .sub {
    margin: 0 0 32px;
    max-inline-size: 62ch;
    font-family: var(--font-sans);
    font-size: 17px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  .grid {
    margin-block-start: 24px;
    background-color: transparent;
  }

  /* 48px below the last row, quiet, 62ch. */
  .fidelity {
    margin: 48px 0 0;
    max-inline-size: 62ch;
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  /* The rail's pinned foot: two quiet lines, then the outlined full-rail link. */
  .note-line {
    margin: 0;
  }

  .build {
    display: grid;
    place-items: center;
    inline-size: 100%;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    font-family: var(--font-sans);
    font-size: 15px;
    font-weight: 500;
    line-height: 1.2;
    text-decoration: none;
    color: var(--color-ink);
    transition: border-color 140ms ease-out;
  }

  .build:hover {
    border-color: var(--color-action);
  }

  @media (prefers-reduced-motion: reduce) {
    .build {
      transition: none;
    }
  }
</style>
