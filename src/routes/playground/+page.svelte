<!--
  /playground/ - PDF page 2, the configuration gallery, on 13-05's shell.

  MOVED FROM /browse/ BY PLAN 13-08 UNDER 13-CONTEXT D-20 (move-clean): the
  gallery lives at /playground/ and a configuration at /playground/<id>/;
  /browse/ and /c/<id>/ are gone with no forwarding page. The machinery below
  is 05.1-08's and 10-07's and is NOT rebuilt - the wall of live pads behind
  one clock, one tab stop across the grid, IntersectionObserver gating, the
  search landmark, the live region, the sessionStorage browse-return store
  that restores scroll, filters and search when a configuration is closed
  (section 6 asks for exactly that, and readBrowseReturn already is it). THE
  LOGIC KEEPS; THE CHROME IS REWRITTEN.

  WHAT THIS PAGE RENDERS, AND WHERE. The centre column: the eyebrow, the
  headline, the sub, the search row with its sort select, ONE `Use` chip row
  with the count at its right, the three-column card grid, the fidelity line.
  The left rail is handed to the shell as a snippet through fillShell():
  YOUR LIBRARY with two-digit counts, a divider, MADE FOR with one row per
  FOR_TERMS member DERIVED at runtime through the provisional FOR_LABELS
  record (never typed as a literal; browse-ui.spec.ts test 7 prints the count
  it found - 13-CONTEXT D-11's "eight" was superseded by 12-04's retirement of
  `keys`, 13-VALIDATION D-4), the PDF's two quiet lines and `+ Build your own`
  pinned to the bottom. The frame's shape travels as page data (+page.ts) so
  the prerendered document carries the header, the nav and the breadcrumb;
  the rail arrives with the effect.

  THE RAIL AND THE CHIP ROW ARE ONE STATE. A MADE FOR row is the FOR facet with
  exactly that term active; `All configs` is the facet with nothing active.
  Pressing a row sets the facet; pressing a chip moves the rail's selection.
  The rail's other two rows - Favorites, Recently used - are a LIBRARY VIEW
  over the store (src/lib/store/favorites.ts, recent.ts) and narrow the grid
  to what the visitor starred or opened. THE LIBRARY VIEW IS NOT IN THE
  ADDRESS, deliberately: a favorite is local to this browser, and a shared
  link reading ?show=favorites would show somebody else a different set - a
  link that lies. The address carries the sort, the query and the chips, as it
  always has; the view resets to All configs on arrival. Whether that is the
  right shape for the two rows is recorded in 13-COPY-NEW.md as a question.
  `Recently used` counts what the workspace records on open (touchRecent) -
  13-09 rebuilds that page and calls it; until then the row reads 00, which is
  honest. Favorites whose ids the catalog no longer carries are dropped on
  read and COUNTED (`dropped`); no sentence is shown for the count, because
  the sentence would be invented (13-06's question 1, still open).

  THE ADDRESS IS A PROJECTION OF THE STATE, seeded once at component init
  behind a `browser` guard, never a $derived over page.url - Kit's
  replaceState never updates page.url, and reading searchParams during
  prerender throws. Written on a 500 ms trailing timer, replaceState and never
  pushState, flushed before leaving. The popstate re-seed reads
  window.location because Kit's own idea of the URL is a visit behind on a
  shallow write (measured, 05.1-10). All of that is unchanged from /browse/
  and its reasons are in the git history of that file.

  THE SCROLL IS THE CENTRE COLUMN's, NOT THE WINDOW's, IN THE WIDE AND COMPACT
  BANDS. 13-05's frame gives the centre its own scroll container so the rail
  stays put; below 1024 the page flows and the window scrolls. The return
  record therefore reads and restores the nearest scrolling ancestor of this
  section, whichever it is, rather than window.scrollY - the same record, the
  same forward-hop-only rule, one honest reader.

  FOUR THINGS THIS PAGE REFUSES, each the obvious reflex: no `export const
  snapshot` (its restore runs after Kit has set the scroll); no
  `data-sveltekit-noscroll`; no `content-visibility: auto` on the cards (it
  destroys scroll restoration); no `pushState` (sixteen chip presses must not
  cost sixteen Back presses).

  THE PAGE'S ONLY CATALOG SPECIFIER IS $lib/catalog/listing. Not $lib/catalog,
  not its index: entries/ported.ts reaches the vendored shelf and with it the
  131,101-byte protocol chunk, onto the first paint of a page whose job is to
  list twenty-six names (D-12). config-shape.spec.ts test 13 holds that rule
  over this file by NAME, and its test 14 walks build/playground/index.html's
  static import graph to prove it after a build. The store modules take the
  browser store as an argument and import nothing heavy.

  Every visible string is the PDF's verbatim; the ones HANGAR wrote (the page
  title, `Clear`, `Clear filters`, the star's two names) are ledgered in
  13-COPY-NEW.md for 13-18.

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

  /* No gallery-level picture, and inventing one would be a second composition
     to keep true to the site - so the gallery unfurls on the catalog's first
     entry, read out of LISTING so this page's only catalog specifier stays the
     import-free one. */
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
   * The current rail row: the library view when it is not All configs; else
   * the one active FOR term's row; else All configs; else - two or more FOR
   * chips, which the rail cannot express - nothing.
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

  /*
    Plain locals, deliberately outside the reactive graph: a mounted flag, a
    timer handle, the section element. None is rendered.
  */
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

  /** The local store, or undefined - the same guard, for the favorites and recents. */
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
   * The nearest scrolling ancestor of this page, or the window. In the wide
   * and compact bands that is the shell's centre column; below 1024 the page
   * flows and it is the window. Read on the forward hop, written on return.
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
   * Write the address. resolve() accepts a pathname carrying a search string,
   * so both branches satisfy svelte/no-navigation-without-resolve with no
   * suppression and no cast. page.state rather than {}: replacing somebody
   * else's shallow state with an empty object is the kind of thing that
   * breaks quietly a phase later.
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
    THE RETURN RECORD, written from the STATE rather than from the address bar,
    on the forward hop into a configuration only. The address is flushed first
    so the two agree at the moment of leaving. `/playground/` itself is not a
    configuration, so a same-route navigation writes nothing.
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
    THE SECOND SEED, for the browser's own Back button only. Kit's replaceState
    records page.url.href - the page store's url, which replaceState itself
    never updates - into the history entry, so a popstate hands the page an
    address one visit stale. window.location.search is the browser's own
    answer and is correct in every case; it is read only here, only in the
    browser, and only on a popstate. Measured in four journeys (05.1-10).
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
    THE SCROLL RESTORE, for the FORWARD hop only, against the record's href so
    a record written against ?for=show never scrolls a plain /playground/ to
    an offset that means nothing there. Cleared either way. A legacy address
    (?tag=, a retired sort) is re-written once on arrival through the
    ordinary timer, so the screen and the address bar cannot disagree; a
    canonical arrival writes nothing and the live region stays silent.
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

  <!--
    `onreorder` is deliberately NOT wired: flushing the address there would
    write it on every keystroke, which the trailing timer exists to stop.
    `dropped` is read and not rendered - see the header.
  -->
  <div class="grid" data-dropped={dropped}>
    <BrowseGrid
      entries={shown}
      total={LISTING.length}
      {favorites}
      {onfavorite}
    />
  </div>

  <!--
    THE FIDELITY LINE, BENEATH THE GRID AND UNCONDITIONAL (W-13): the largest
    fidelity claim on the site is this wall, and the line is one source shared
    with FidelityLine.svelte.
  -->
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
