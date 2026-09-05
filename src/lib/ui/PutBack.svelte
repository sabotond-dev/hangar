<!--
  PUT BACK - stub for plan 07-09 task 1. Replaced by the full component in task 2.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { install } from "$lib/device/install.svelte";
  import { session } from "$lib/device/session.svelte";
  import { PUT_BACK_LABEL } from "$lib/device/install-copy";

  const enabled = $derived(
    install.putBackState() === "enabled" && session.phase === "connected",
  );
</script>

<button type="button" data-testid="put-back" disabled={!enabled}>
  {PUT_BACK_LABEL}
</button>
