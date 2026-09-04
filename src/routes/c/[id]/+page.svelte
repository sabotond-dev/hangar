<!--
  /c/{id}/ - the same front door, opened on one configuration.

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

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { FRONT_DOOR } from "$lib/catalog/front-door";
  // Both specifiers are safe under config-shape.spec.ts test 13: neither names
  // the vendored tree, the protocol package nor the compile surface, and
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

  /** undefined when the address names nothing in the row. */
  const entry = $derived(
    data.index === -1 ? undefined : FRONT_DOOR[data.index],
  );
  const title = $derived(
    entry === undefined ? SITE : `${entry.name} — ${SITE}`,
  );
  const description = $derived(entry?.description ?? SHELF_DESCRIPTION);

  /* An address nobody has heard of must not claim to be a configuration, and
     must not produce /og/undefined.png either. It unfurls as the shelf, on the
     opening centre's picture - the same choice / makes. */
  const OPENING = FRONT_DOOR[0];
  const ogEntry = $derived(entry ?? OPENING);
  const ogUrl = $derived(
    entry === undefined ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/c/${entry.id}/`,
  );
  const ogImage = $derived(`${SITE_ORIGIN}/og/${ogEntry.id}.png`);
  const ogImageAlt = $derived(ogAlt(ogEntry.name));
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
  initialId={entry?.id}
  notice={entry === undefined ? UNKNOWN_NOTICE : undefined}
  splash={false}
/>
