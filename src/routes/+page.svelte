<!--
  The front door. One component, rendered here and (from plan 04-09) at
  /c/{id}/ as well, so the two routes cannot drift apart.

  `splash` is passed because this is the site's opening: a deep link never
  plays it (D-12), `/` always does. Plan 04-07 is what makes the prop do
  anything.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { FRONT_DOOR } from "$lib/catalog/front-door";
  import { SITE_ORIGIN } from "$lib/share/url";
  import { ogAlt } from "$lib/tune/copy";
  import FrontDoor from "$lib/ui/FrontDoor.svelte";

  /* Visitor-facing copy, in one block. The deep-link route has its own. */
  const TITLE = "HANGAR";
  const DESCRIPTION =
    "A shelf of ZONA configurations, every one of them running live in the firmware’s own simulator. Turn a few knobs, then load one onto your own module.";

  /* The shelf unfurls too, on the OPENING CENTRE's picture. There is no
     shelf-level image: making one would be a second composition to keep true to
     the site, and the opening centre is what a visitor sees first anyway. It is
     the one thing here 05-UI-SPEC does not fix, so it is a decision a designer
     may overturn - and overturning it is one const and one new file. */
  const OPENING = FRONT_DOOR[0];
  const OG_TYPE = "website";
  const OG_URL = `${SITE_ORIGIN}/`;
  const OG_IMAGE = `${SITE_ORIGIN}/og/${OPENING.id}.png`;
  const OG_IMAGE_TYPE = "image/png";
  const OG_IMAGE_WIDTH = "1200";
  const OG_IMAGE_HEIGHT = "630";
  const OG_IMAGE_ALT = ogAlt(OPENING.name);
  const TWITTER_CARD = "summary_large_image";
</script>

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

<FrontDoor splash />
