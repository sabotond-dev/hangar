<!--
  / - the intro. PDF page 1 (plan 13-07; 13-CONTEXT.md D-09, D-14 Q2).

  ALWAYS THE INTRO, FOR THREE MEASURED REASONS. +layout.ts sets prerender =
  true, so a client-side redirect on mount would flash this page before it
  jumped; / is the target of every link anyone pastes, so its <head> has to
  be a real page's head; and the live surface beside the words is the site's
  best first impression. So the returning visitor is never redirected and
  never interrupted: the local flag changes what the FIRST CARD offers -
  `Resume draft`, pointing at the newest draft - and nothing else. There is
  no goto, no redirect and no navigation of any kind here, and
  src/lib/ui/intro.spec.ts test 2 counts them at zero.

  STORAGE IS READ IN onMount, NEVER AT MODULE SCOPE. The page renders on a
  server with no storage of any kind; the store is read once the page has
  painted, through 13-06's guarded stores, and a store that is absent,
  refuses or throws reads as a first visit - the safe direction, stated in
  src/lib/ui/intro/card.ts. The flag is written after the read, on this
  first successful mount, so a mount that threw never marks anything.

  THE OG HEAD BLOCK KEEPS ITS SHAPE: the same thirteen tags, the same
  SITE_ORIGIN join, the same ogAlt call. Its content follows the page - the
  description is now the PDF's own three sentences, and the image and the alt
  are the hero's rather than the ring's opening centre (the same entry today,
  because the hero is derived from the same list in the same order).

  THE SHELL'S INTRO VARIANT: a header with the wordmark, the PDF's `Quick
  guide` and the connection slot 13-11 fills; no nav, no context bar, no rail,
  no inspector (13-05). The shape travels as data through +page.ts so the
  prerendered document carries the header; the Quick guide snippet arrives
  with the effect. Quick guide points at the page's own three-step strip,
  which is the guide the PDF draws.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { FRONT_DOOR_HERO } from "$lib/catalog/front-door";
  import { SITE_ORIGIN } from "$lib/share/url";
  import { markIntroSeen } from "$lib/store/intro";
  import { ogAlt } from "$lib/tune/copy";
  import Intro from "$lib/ui/intro/Intro.svelte";
  import { introCardFor, type IntroCard } from "$lib/ui/intro/card";
  import { fillShell } from "$lib/ui/shell/shell.svelte";

  /* Visitor-facing copy, in one block. The description is the PDF's page 1. */
  const TITLE = "HANGAR";
  const DESCRIPTION =
    "Make ZONA your own. Find a gesture you love. Build a surface that works the way you do.";

  /* The page unfurls on the HERO's picture: the one surface a visitor sees
     first, and the one the intro is running. Derived, not chosen here. */
  const HERO = FRONT_DOOR_HERO;
  const OG_TYPE = "website";
  const OG_URL = `${SITE_ORIGIN}/`;
  const OG_IMAGE = `${SITE_ORIGIN}/og/${HERO.id}.png`;
  const OG_IMAGE_TYPE = "image/png";
  const OG_IMAGE_WIDTH = "1200";
  const OG_IMAGE_HEIGHT = "630";
  const OG_IMAGE_ALT = ogAlt(HERO.name);
  const TWITTER_CARD = "summary_large_image";

  /** The first card. `explore` until the store has been read in onMount. */
  let card: IntroCard = $state({ kind: "explore" });

  /**
   * The local store, or undefined. The property ACCESS is inside the try,
   * not only the call: a browser configured to refuse storage can throw on
   * `window.localStorage` itself (07-RESEARCH pitfall 9). This is the one
   * line on the route that names the browser store; the store modules take
   * it as an argument.
   */
  function storage(): Storage | undefined {
    try {
      return window.localStorage;
    } catch {
      return undefined;
    }
  }

  onMount(() => {
    const store = storage();
    const now = new Date();
    // Read first, mark second: the card is decided from what was there
    // before this visit, and the flag records this visit only once the
    // page has painted and the read has succeeded.
    card = introCardFor(store, now);
    markIntroSeen(store, now.toISOString());
  });

  $effect(() => fillShell({ variant: "intro", secondary }));
</script>

{#snippet secondary()}
  <a class="quick-guide type-base" href="#quick-guide" data-testid="quick-guide"
    >Quick guide</a
  >
{/snippet}

<svelte:head>
  <title>{TITLE}</title>
  <meta name="description" content={DESCRIPTION} />
  <meta property="og:type" content={OG_TYPE} />
  <meta property="og:site_name" content={TITLE} />
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

<Intro {card} hero={HERO} />

<style>
  .quick-guide {
    display: inline-flex;
    align-items: center;
    min-block-size: 44px;
    color: var(--color-ink-quiet);
    text-decoration: none;
  }

  .quick-guide:hover {
    color: var(--color-ink);
  }
</style>
