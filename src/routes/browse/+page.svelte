<!--
  /browse/ - the shelf, all of it, running.

  Composition over construction. The toolbar (wave 7) sits over the grid (wave
  6), both fed by the pure modules of waves 2 and 3, and everything this file
  adds is the wiring between them: one head, one content column, three runes,
  one write-only address and one record of where the visitor was.

  THERE IS NO +page.ts, DELIBERATELY, and its absence is the load-bearing part.
  src/routes/+layout.ts already declares `prerender = true` and
  `trailingSlash = "always"` for the whole site, and vite.config.ts's
  `prerender.entries: ["*"]` picks up every route with no required dynamic
  parameter - so a +page.ts here would buy nothing. It could also COST the
  build: Kit's respond.js:433-434 and load_data.js:71 call `disable_search(url)`
  whenever `state.prerendering`, and utils/url.js:174-188 then defines `search`
  and `searchParams` as properties that THROW. 05.1-UI-SPEC.md's Component
  Inventory names a `+page.ts` for this route; it is not built, and
  05.1-08-SUMMARY.md records that departure.

  THE STATE IS A RUNE SEEDED ONCE, AND THE ADDRESS IS A PROJECTION OF IT. Read
  out of Kit 2.70.3's own source in both directions: client.js:2551-2581
  (`replaceState`) sets `page.state` and re-clones the page object but NEVER
  touches `page.url`, while client.js:2871-2905 - the popstate shallow branch -
  DOES call `update_url`. `page.url` is therefore stale on write and fresh on
  back, and a `$derived` over it would be a bug pointing two ways at once. The
  three runes below are the source of truth; the address is written from them
  and never read again after the seed.

  AND THE SEED HAPPENS AT COMPONENT INIT, NOT IN onMount. 05.1-CONTEXT.md D-16
  says "inside onMount"; the two reasons D-16 gives are prerender safety and the
  staleness of shallow routing, and an init-scope read behind a `browser` guard
  satisfies both. An onMount seed does not: the first client render of
  /browse/?tag=drums would paint all sixteen cards and collapse to three a frame
  later, so the grid is tall at the exact moment Kit restores scroll and short
  immediately afterwards, and the visitor lands in the wrong place
  (05.1-RESEARCH.md Pitfall 7a). The deviation is one word of mechanism rather
  than of intent and it is recorded in the SUMMARY.

  FOUR THINGS THIS PAGE REFUSES, each of them the obvious reflex:

    - NO `export const snapshot`. Its `restore()` runs after
      `after_navigate_callbacks` and therefore after Kit has already set the
      scroll (client.js:2045-2048), which is wrong for anything that changes
      layout height - and a filter changes layout height by definition.
    - NO `data-sveltekit-noscroll` anywhere. It would also suppress the WANTED
      scroll-to-top on the forward hop into /c/<id>/.
    - NO `content-visibility: auto` on the cards. It is the obvious way to make
      sixteen canvases cheap and it destroys scroll restoration, because an
      unrendered card has no height until it is scrolled near.
    - NO `pushState`. Sixteen chip presses must not cost sixteen Back presses.

  THE PAGE'S ONLY CATALOG SPECIFIER IS $lib/catalog/listing. Not $lib/catalog,
  not its index, not through a re-export: entries/ported.ts:13 reaches
  src/vendor/botor/_pad and with it the 131,101-byte protocol chunk, onto the
  first paint of a page whose entire job is to list sixteen names (D-12).
  config-shape.spec.ts test 13 holds that rule over this file by NAME from this
  plan onwards, and its test 14 walks build/browse/index.html's transitive
  static import graph to prove it after a build.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { browser } from "$app/environment";
  import { beforeNavigate, replaceState } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { onDestroy, onMount, untrack } from "svelte";
  import { allTags, filterListing } from "$lib/browse/filter";
  import {
    DEFAULT_QUERY,
    parseBrowseQuery,
    serialiseBrowseQuery,
  } from "$lib/browse/query";
  import {
    clearBrowseReturn,
    readBrowseReturn,
    writeBrowseReturn,
    type ReturnStore,
  } from "$lib/browse/return";
  import { sortListing, type BrowseSort } from "$lib/browse/sort";
  import { LISTING } from "$lib/catalog/listing";
  import { SITE_ORIGIN } from "$lib/share/url";
  import { ogAlt } from "$lib/tune/copy";
  import BrowseGrid from "$lib/ui/BrowseGrid.svelte";
  import BrowseToolbar from "$lib/ui/BrowseToolbar.svelte";

  /* Visitor-facing copy, in one block, verbatim from the Copywriting Contract.
     Every string is a const rather than inline markup text: Prettier reflows
     element text and Phase 2 lost a load-bearing sentence to exactly that. */
  const SITE = "HANGAR";
  const TITLE = "Browse — HANGAR";
  const HEADLINE = "Everything on the shelf, all of it running.";
  const DESCRIPTION =
    "Every ZONA configuration in HANGAR, running live in the firmware’s own simulator.";

  /* Phase 4's fidelity claim, verbatim, with a real U+2019. THIS IS A SECOND
     COPY AND IT DOES NOT SURVIVE THE WAVE: the next task of this same plan
     lifts the sentence out of FidelityLine.svelte into
     src/lib/ui/fidelity-line.ts and both consumers import it from there. Two
     copies of the site's largest fidelity claim is one copy too many. */
  const FIDELITY_LINE =
    "Every pad here runs the firmware’s own code, compiled exactly as it would be written to a ZONA. What a screen cannot show: the real colour of the lights, the way they bleed into each other, and how the surface feels under a finger.";

  /* Real typographic doubles, U+201C and U+201D, around a visitor's own query.
     The apostrophe rule already imposes this discipline; the phase extends it
     to quotation marks, and these two constants are why no template literal
     below carries a bare ASCII quote. */
  const OPEN_QUOTE = "“";
  const CLOSE_QUOTE = "”";

  /* The head's fixed half, exactly as / and /c/<id>/ write it. twitter:card is
     what makes Discord render a large embed rather than an 80x80 thumbnail. */
  const OG_TYPE = "website";
  const OG_URL = `${SITE_ORIGIN}/browse/`;
  const OG_IMAGE_TYPE = "image/png";
  const OG_IMAGE_WIDTH = "1200";
  const OG_IMAGE_HEIGHT = "630";
  const TWITTER_CARD = "summary_large_image";

  /*
    There is no shelf-level picture, and inventing one would be a second
    composition to keep true to the site - so /browse/ unfurls on the same
    image / does, the opening centre's. LISTING is catalog order and its first
    entry IS the front door's opening centre; both arrays are that same order,
    so the two cannot drift while the catalog has one first entry. Reading it
    out of LISTING rather than out of FRONT_DOOR is what keeps this page's only
    catalog specifier the import-free one.
  */
  const OPENING = LISTING[0];
  const OG_IMAGE = `${SITE_ORIGIN}/og/${OPENING.id}.png`;
  const OG_IMAGE_ALT = ogAlt(OPENING.name);

  /** The address settles this long after the last keystroke or chip press. */
  const ADDRESS_DELAY_MS = 500;

  /** The tag vocabulary, so query.ts never has to import the listing. */
  const TAGS = allTags(LISTING);

  /*
    ONCE, at component init, and only in the browser. untrack is the same idiom
    Coverflow.svelte uses for initialId and FidelityLine.svelte for its notice:
    capturing only the initial value is exactly what is wanted here. Never a
    $derived over page.url - replaceState does not update it, and reading
    searchParams during prerender throws.
  */
  const seed = () =>
    browser ? parseBrowseQuery(page.url.searchParams, TAGS) : DEFAULT_QUERY;
  const initial = untrack(seed);

  let sort: BrowseSort = $state(initial.sort);
  let q = $state(initial.q);
  let tags: string[] = $state([...initial.tags]);

  /* Filter first, then sort: filterListing is O(n) and sortListing allocates. */
  const shown = $derived(sortListing(filterListing(LISTING, q, tags), sort));

  /*
    The by-condition sentence for an empty result. The PAGE chooses it because
    the page is the only place that knows whether a query, a set of tags or both
    produced the miss - the grid is handed a finished sentence and never
    composes one. undefined when the grid is not empty, and undefined when
    nothing is filtered at all, which is the empty-catalog case the grid owns.
  */
  const emptyReason = $derived.by(() => {
    const quoted = `${OPEN_QUOTE}${q}${CLOSE_QUOTE}`;
    if (q !== "" && tags.length > 0) {
      return `No configuration matches ${quoted} with those tags.`;
    }
    if (q !== "") return `No configuration matches ${quoted}.`;
    if (tags.length > 0) return "No configuration carries all of those tags.";
    return undefined;
  });

  /*
    Plain locals, deliberately outside the reactive graph: a mounted flag, a
    timer handle. Neither is rendered. `mounted` exists because replaceState
    throws before the router is initialised, and because onDestroy runs during
    prerender where none of this was ever created.
  */
  let mounted = false;
  let addressTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * The session store, or undefined.
   *
   * A property access on `window.sessionStorage` can itself throw in a browser
   * configured to refuse storage - before any of return.ts's own try/catch
   * blocks get a chance - so the guard is here rather than there. sessionStorage
   * and never the persistent one: a middle-click into a new tab correctly gets
   * no way back, because in a new tab there is nothing to go back to.
   */
  function store(): ReturnStore | undefined {
    if (!browser) return undefined;
    try {
      return window.sessionStorage;
    } catch {
      return undefined;
    }
  }

  /** The address this view WOULD have, composed from the state. */
  function currentHref(): string {
    const search = serialiseBrowseQuery({ sort, q, tags });
    return search === "" ? "/browse/" : `/browse/?${search}`;
  }

  /**
   * Write the address. resolve() from $app/paths accepts a pathname carrying a
   * search string, so both branches satisfy svelte/no-navigation-without-resolve
   * with NO suppression and NO cast. Two statements rather than one ternary
   * argument, because the rule reads the call expression it is handed.
   *
   * page.state rather than {}: this route pushes no shallow state of its own
   * today, and replacing somebody else's with an empty object is the kind of
   * thing that breaks quietly a phase later (Phase 4 learned it on W-20).
   */
  function writeAddress(): void {
    if (!mounted) return;
    const search = serialiseBrowseQuery({ sort, q, tags });
    if (search === "") replaceState(resolve("/browse/"), page.state);
    else replaceState(resolve(`/browse/?${search}`), page.state);
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
  // The four things a control can do, and the one thing all four then do.

  function onsort(next: BrowseSort): void {
    sort = next;
    scheduleAddress();
  }

  function onquery(next: string): void {
    q = next;
    scheduleAddress();
  }

  function ontag(tag: string): void {
    tags = tags.includes(tag)
      ? tags.filter((active) => active !== tag)
      : [...tags, tag];
    scheduleAddress();
  }

  /** The query and every tag, and never the sort: a sort is a view preference. */
  function onclear(): void {
    q = "";
    tags = [];
    scheduleAddress();
  }

  /*
    THE RETURN RECORD, written from the STATE rather than from the address bar.
    The address is projected on a trailing timer, so a card clicked 200 ms after
    a chip toggle would record a view one toggle stale; composing the href out of
    the live state removes that race instead of racing it. The address is flushed
    first for the same reason, so the two agree at the moment of leaving.
  */
  beforeNavigate((navigation) => {
    const to = navigation.to?.url.pathname ?? "";
    if (!to.startsWith("/c/")) return;
    flushAddress();
    writeBrowseReturn(store(), {
      href: currentHref(),
      scrollY: window.scrollY,
    });
  });

  /*
    THE SCROLL RESTORE, and it is for the FORWARD hop only. Kit's own back-button
    restoration already targets the offset this record holds, so the two cannot
    disagree; what gets no restoration at all is a `goto` back from a detail page,
    which is what wave 9's control performs. The href is compared because a
    record written against ?tag=drums must not scroll a plain /browse/ to an
    offset that means nothing there. Cleared either way: there is one way back at
    a time and it has now been used.
  */
  onMount(() => {
    mounted = true;
    const record = readBrowseReturn(store());
    clearBrowseReturn(store());
    if (record === undefined || record.href !== currentHref()) return;
    window.scrollTo(0, record.scrollY);
  });

  onDestroy(() => {
    // The house guard: onDestroy runs during prerender, where no timer was ever
    // set. Checking the handle says the same thing and says it locally.
    if (addressTimer === undefined) return;
    clearTimeout(addressTimer);
    addressTimer = undefined;
  });
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

<section class="browse" data-testid="browse">
  <!--
    The wordmark is this page's only level-1 heading and on this route it is a
    REAL LINK to the front door. There is no right-hand header slot here: the
    page that control would lead to is the page you are on (W-01).
  -->
  <h1 class="wordmark">
    <a href={resolve("/")} data-testid="header-wordmark">{SITE}</a>
  </h1>

  <p class="headline">{HEADLINE}</p>

  <div class="toolbar">
    <BrowseToolbar
      entries={LISTING}
      {sort}
      {q}
      {tags}
      showing={shown.length}
      total={LISTING.length}
      {onsort}
      {onquery}
      {ontag}
      {onclear}
    />
  </div>

  <!--
    `onreorder` is deliberately NOT wired. The grid offers it so a page can flush
    its address after a reorder, and flushing there would write the address on
    every keystroke - which is the one thing the 500 ms trailing timer exists to
    stop. The address settles half a second after the last keystroke instead,
    and beforeNavigate flushes it before anything can leave with a stale one.
  -->
  <div class="grid">
    <BrowseGrid entries={shown} total={LISTING.length} {emptyReason} />
  </div>

  <!--
    THE FIDELITY LINE, BENEATH THE GRID AND UNCONDITIONAL (W-13). Phase 4
    requires it on every load - "a fidelity claim that only appears next to the
    pads that flatter it would not be one" - and this is the largest such claim
    on the site, sixteen live pads at once. It sits below rather than above
    because it is 231 characters, and 231 characters between a visitor and
    sixteen running machines would bury the thing the page exists to show. One
    source, shared with FidelityLine.svelte, so the two copies cannot drift.
  -->
  <p class="fidelity" data-testid="fidelity-line">{FIDELITY_LINE}</p>
</section>

<style>
  /*
    One content column, left-aligned throughout (W-21). The front door centres
    because it is ceremonial; browse is a working page, and a left-aligned
    toolbar over a left-aligned grid is what makes them read as one column.
  */
  .browse {
    max-inline-size: 1280px;
    margin-inline: auto;
    padding-inline: 32px;
    padding-block: 32px;
    text-align: start;
  }

  /* Micro role: 12px / 600 / 0.18em / uppercase, accent. Phase 4's wordmark. */
  .wordmark {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-accent);
  }

  /*
    The wordmark's anchor fills its 44px box rather than sitting inside one, so
    the visible target and the clickable target are the same shape. inline-flex
    with a min-block-size keeps the heading's own line box honest at every width.
  */
  .wordmark a {
    display: inline-flex;
    align-items: center;
    min-block-size: 44px;
    color: inherit;
    text-decoration: none;
    transition: opacity 160ms ease-out;
  }

  .wordmark a:hover {
    opacity: 0.75;
  }

  /* Body role, quiet by colour rather than by size. */
  .headline {
    margin: 48px 0 0;
    max-inline-size: 62ch;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  .toolbar {
    margin-block-start: 32px;
  }

  .grid {
    margin-block-start: 32px;
  }

  /* 48px below the last grid row, Body, quiet, 62ch. */
  .fidelity {
    margin: 48px 0 0;
    max-inline-size: 62ch;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  @media (max-width: 639px) {
    .browse {
      padding-inline: 24px;
      padding-block: 24px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .wordmark a {
      transition: none;
    }
  }
</style>
