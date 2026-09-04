<!--
  The front door. One component, rendered here and (from plan 04-09) at
  /c/{id}/ as well, so the two routes cannot drift apart.

  `splash` is passed because this is the site's opening: a deep link never
  plays it (D-12), `/` always does. Plan 04-07 is what makes the prop do
  anything.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import FrontDoor from "$lib/ui/FrontDoor.svelte";

  /* Visitor-facing copy, in one block. The deep-link route has its own. */
  const TITLE = "HANGAR";
  const DESCRIPTION =
    "A shelf of ZONA configurations, every one of them running live in the firmware’s own simulator. Turn a few knobs, then load one onto your own module.";
</script>

<svelte:head>
  <title>{TITLE}</title>
  <meta name="description" content={DESCRIPTION} />
</svelte:head>

<FrontDoor splash />
