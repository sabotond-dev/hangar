<!--
  The one session live region: visually hidden, polite, atomic, mounted ONCE in
  +layout.svelte before the page. No props. It renders session.speech and does
  nothing else - the 500ms coalescer, the hold under the splash and the rule that
  a heartbeat or a page number never speaks are the store's (session.spec.ts).
  The third of the site's three live regions (tuning, browse, session), with
  disjoint triggers; Kit's #svelte-announcer is a fourth aria-live element and
  not ours, so an assertion about this one goes through its testid. "The session
  speaks first" is document order and nothing more: there is no cross-region queue.
  Decided at 06-12 (06-UI-SPEC D-17, Y-16); see .planning/phases/06-device-session/06-12-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { session } from "$lib/device/session.svelte";
</script>

<div
  class="sr-only"
  data-testid="session-live"
  aria-live="polite"
  aria-atomic="true"
>
  {session.speech}
</div>
