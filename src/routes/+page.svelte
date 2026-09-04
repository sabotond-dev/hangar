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
</script>

<FrontDoor splash />
