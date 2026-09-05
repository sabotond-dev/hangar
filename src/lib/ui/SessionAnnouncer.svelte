<!--
  The one session live region (06-UI-SPEC, Accessibility Contract; D-17; Y-16).

  Visually hidden, polite, atomic, mounted ONCE in +layout.svelte before the
  page, so it exists on every route and there is never a second copy. It
  renders `session.speech` and does nothing else: no timer, no logic, no
  memory. Everything it could get wrong - the 500ms trailing coalescer, the
  hold while the splash covers the row, the rule that a heartbeat or a page
  number never speaks - lives in the store (src/lib/device/session.svelte.ts),
  where a node test can reach it. session.spec.ts tests 16 and 17 are those
  tests; this file has nothing to test.

  THREE LIVE REGIONS ON THE SITE, AND THIS IS THE THIRD. Phase 5's tuning
  region speaks on a settled budget change; Phase 5.1's browse region speaks
  on a settled filter or sort change; this one speaks on a session transition.
  The three trigger sets are disjoint, so no event on this site fires two of
  them. Kit's own #svelte-announcer is a fourth aria-live element on every
  hydrated page and is not ours; a DOM-level count of [aria-live] therefore
  reads one more than the site's regions, and any assertion about THIS one
  goes through its testid.

  "THE SESSION SPEAKS FIRST" IS DOCUMENT ORDER, AND NOTHING MORE. D-17 says
  that when a session transition and a budget or browse change land in the
  same 500ms window the session's utterance goes first. There is NO
  cross-region scheduler on this site and none is built: what exists is the
  store's trailing timer and the fact that this element precedes the tuning
  and browse regions in the document, because the layout mounts it before
  {@render children()}. A reader who wants a real queue should know that it
  does not exist rather than assume that it does.

  TryOnDevice.svelte's connect-status aria-live is the one this phase removes
  (plan 06-12), so a session transition is announced once. That removal is not
  this file's.

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
