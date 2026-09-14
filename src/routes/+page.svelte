<!--
  / - the intro: PDF page 1 as a real prerendered page (13-07). Always the intro, never a redirect:
  the returning visitor's local flag changes what the first card offers (`Resume draft`) and nothing
  else, and intro.spec.ts test 2 counts navigations at zero. The browser store is read in onMount,
  never at module scope; an absent, refusing or throwing store reads as a first visit (intro/card.ts)
  and the flag is written after the read, so a mount that threw marks nothing. The OG head block keeps
  its thirteen tags, the SITE_ORIGIN join and ogAlt; the image and the alt are the hero's. The shell's
  intro variant (wordmark, Quick guide, the connection slot; no nav, no context bar, no rail, no
  inspector) travels as data through +page.ts; the Quick guide snippet points at the page's own strip.
  Decided at 13-07 (13-CONTEXT D-09, D-14 Q2); see .planning/phases/13-gui-overhaul/13-07-SUMMARY.md

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

  /* The page unfurls on the HERO's picture: the one surface a visitor sees first. Derived, not chosen here. */
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
   * The browser store, or undefined: the property ACCESS is inside the try (a browser configured to
   * refuse storage can throw on it; 07-RESEARCH pitfall 9). The route's own edge to the store, one
   * per route (13.2-CONTEXT D-15); intro.spec.ts pins this copy inline.
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
    // Read first, mark second: the flag records this visit only once the read has succeeded.
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
