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
  import FrontDoor from "$lib/ui/FrontDoor.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  /* Visitor-facing copy, in one block. 04-UI-SPEC, Routes and deep links. */
  const SITE = "HANGAR";
  const UNKNOWN_NOTICE = "Never heard of that one. Here is the shelf instead.";
  const SHELF_DESCRIPTION =
    "A shelf of ZONA configurations, every one of them running live in the firmware’s own simulator.";

  /** undefined when the address names nothing in the row. */
  const entry = $derived(
    data.index === -1 ? undefined : FRONT_DOOR[data.index],
  );
  const title = $derived(
    entry === undefined ? SITE : `${entry.name} — ${SITE}`,
  );
  const description = $derived(entry?.description ?? SHELF_DESCRIPTION);
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
</svelte:head>

<FrontDoor
  initialId={entry?.id}
  notice={entry === undefined ? UNKNOWN_NOTICE : undefined}
  splash={false}
/>
