<!--
  /playground/{id}/ - the same front door, opened on one configuration.
  (At /c/{id}/ from Phase 5 until plan 13-08 moved it here under 13-CONTEXT
  D-20, move-clean, content otherwise untouched; 13-09 rebuilds it in place.)

  It renders the very same FrontDoor component as /, so the two routes cannot
  drift apart, with two differences that are the whole point of the route:

    1. `splash={false}`. A shared link should open fast; the opening is for the
       front door (D-12). With a real route this needs no suppression trick -
       04-RESEARCH proposed an inline app.html script to stop a splash flash,
       but that was for the hash design D-12 replaced. There is nothing to
       suppress: this page simply never renders one.
    2. Its own <head>. One real HTML file per configuration, each with its own
       title and description, is what makes Phase 5's link unfurls possible at
       all, and it is why D-12 chose routes over a fragment.

  An address nobody has heard of lands here too, with index -1, and gets the
  shelf plus a line saying so rather than a dead end.

  AMENDMENT (wave 9, D-08). The header slot itself is FrontDoor.svelte's, not
  this route's, which is what keeps / and /playground/{id}/ from drifting apart. What
  this route owns is the record's END OF LIFE: a browse return is written by
  /playground/ on the way in and consumed by /playground/ on the way back, and if the
  visitor leaves for anywhere else it has to be forgotten here.

  THE RULE HAS TWO DELIBERATE EXCEPTIONS, and both of them are the point:

    - /playground/ itself, because that is the record being USED, and /playground/'s own
      onMount is what consumes it. Clearing it on the way out would delete the
      scroll offset a beat before the page that restores it asks for it.
    - another /playground/<id>/ route, because a visitor who came from browse and then stepped
      or followed a link to a second configuration still came from browse. The
      way back is still true.

  Stepping the row with the arrows uses replaceState and never leaves the route,
  so the hook does not fire for it at all and the record survives stepping for
  free. A reload also leaves it alone - the way back is still there, which
  05.1-UI-SPEC.md calls a virtue rather than a leak.

  IT IS beforeNavigate AND NOT afterNavigate, AND THAT WAS MEASURED RATHER THAN
  ASSUMED. Plan 05.1-09 asked for afterNavigate; afterNavigate is registered
  through Kit's add_navigation_callback (client.js:2240-2248), which adds the
  callback in onMount and DELETES IT IN THE TEARDOWN - and the teardown runs
  while the new page renders, which is before client.js:2042 walks
  after_navigate_callbacks. A callback registered here therefore fires for a hop
  from /playground/euclid/ to /playground/aurora/, where the component survives, and NEVER for the
  one departure it exists for. Observed on a served production build: with the
  afterNavigate form, a history.go(-2) from /playground/euclid/ past browse to the front
  door left the record in place and the front door's slot then read BACK TO
  BROWSE - a way back to a view that had already been left. beforeNavigate fires
  while this component is still mounted, so it fires.

  WHAT beforeNavigate COSTS, AND HOW IT IS PAID. It also fires for navigations
  that leave the app entirely - a reload, an address-bar hop, a closed tab - and
  those carry `willUnload` with a null `to`. They are skipped, deliberately: a
  reload of the detail page must KEEP the record (05.1-UI-SPEC.md calls that a
  virtue), and a reload and an address-bar hop are indistinguishable from inside
  the page, so the tie is broken in favour of the visitor keeping their way back.
  Nothing else in HANGAR cancels a navigation, so no in-app hop that reaches this
  callback fails to happen.

  AMENDMENT (D-07, plan 05.1-05). The page used to exist only for the eight row
  entries and it read them out of FRONT_DOOR. It now exists for all sixteen and
  reads LISTING, so the seven hand-authored Lua configurations and Trackpad are
  reachable for the first time. A ROW entry still gets Phase 4's eight-pad ring,
  byte for byte - /playground/aurora/ does not move. An OFF-ROW entry gets a ONE-ENTRY
  ring, which src/lib/coverflow/slots.ts already handles (plan 05.1-04), so its
  page is about that configuration rather than about the shelf. Widening the
  ring to sixteen would change a signed-off route for no requirement (D-04).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { browser } from "$app/environment";
  import { beforeNavigate } from "$app/navigation";
  import { clearBrowseReturn, type ReturnStore } from "$lib/browse/return";
  import { FRONT_DOOR, frontDoorIndex } from "$lib/catalog/front-door";
  import { LISTING } from "$lib/catalog/listing";
  // Every specifier here is safe under config-shape.spec.ts test 13: none names
  // the vendored tree, the protocol package nor the compile surface,
  // src/lib/catalog/listing.ts imports nothing at runtime, and
  // src/lib/share/url.ts imports nothing at all, which is why the origin lives
  // there. The image renderer is deliberately NOT imported - it is node-only -
  // so 1200 and 630 appear below as literals beside the sizes it uses.
  import { SITE_ORIGIN } from "$lib/share/url";
  import { ogAlt } from "$lib/tune/copy";
  import FrontDoor from "$lib/ui/FrontDoor.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  /* Visitor-facing copy, in one block. 04-UI-SPEC, Routes and deep links. */
  const SITE = "HANGAR";
  const UNKNOWN_NOTICE = "Never heard of that one. Here is the shelf instead.";
  const SHELF_DESCRIPTION =
    "A shelf of ZONA configurations, every one of them running live in the firmware’s own simulator.";

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
     workspace live under it since 13-08 moved both here (D-20, move-clean).
     Pathname only - this route is prerendered too, and page.url.search throws
     while it is. */
  const PLAYGROUND_PREFIX = "/playground/";

  /** undefined when the address names nothing in the catalog. */
  const listed = $derived(data.index === -1 ? undefined : LISTING[data.index]);
  const title = $derived(
    listed === undefined ? SITE : `${listed.name} — ${SITE}`,
  );
  const description = $derived(listed?.description ?? SHELF_DESCRIPTION);

  /*
    The ring this page opens on.

    A row entry keeps Phase 4's eight-pad ring exactly as it shipped - no
    behaviour on /playground/aurora/ moves. A non-row entry gets a ONE-ENTRY ring, which
    src/lib/coverflow/slots.ts already handles (05.1-04): visibleWindow is [0],
    stepping is inert and the name plate renders no arrows. An address nobody
    has heard of falls to the shelf, which is the same picture / shows.
    Widening the ring to sixteen would change a signed-off route for no
    requirement (D-04).
  */
  const row = $derived(
    listed === undefined || frontDoorIndex(listed.id) !== -1
      ? FRONT_DOOR
      : [listed],
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

  /** The session store, or undefined. /playground/ guards it exactly this way: a
      property access on window.sessionStorage can itself throw in a browser
      configured to refuse storage, before return.ts's own try/catch gets a
      chance. */
  function store(): ReturnStore | undefined {
    if (!browser) return undefined;
    try {
      return window.sessionStorage;
    } catch {
      return undefined;
    }
  }

  /* THE RECORD'S END OF LIFE. See the header for the two exceptions, for why
     this is beforeNavigate rather than afterNavigate, and for what was observed
     when it was the other way round.

     There is no check that the navigation is FROM /playground/ - this callback only
     exists while this route's component is mounted, so it cannot fire anywhere
     else. */
  beforeNavigate((navigation) => {
    if (navigation.willUnload) return;
    const to = navigation.to?.url.pathname ?? "";
    if (to === "") return;
    if (to.startsWith(PLAYGROUND_PREFIX)) return;
    clearBrowseReturn(store());
  });
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

<FrontDoor
  {row}
  initialId={listed?.id}
  notice={listed === undefined ? UNKNOWN_NOTICE : undefined}
/>
