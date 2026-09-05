<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import favicon from "$lib/assets/favicon.svg";
  import { session } from "$lib/device/session.svelte";
  import SessionAnnouncer from "$lib/ui/SessionAnnouncer.svelte";

  let { children } = $props();

  /**
   * The device session is started HERE, once, for the whole site (D-05), and
   * from onMount rather than at module scope on purpose: +layout.ts sets
   * prerender = true, so this component's module scope runs in the
   * prerenderer, where there is no window and no navigator.serial to read.
   * start() is idempotent on the instance, so the session probe page - which
   * starts the singleton from its own onMount as well - attaches nothing
   * twice. The static import of the session is the one case the chunk guard
   * allows for this file (src/lib/config-shape.spec.ts test 13): the session
   * and its four specifiers are free of the protocol package.
   */
  onMount(() => {
    session.start();
  });
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!--
  The one session live region, BEFORE the page (D-17). It precedes the tuning
  and browse regions in the document, and that document order plus the store's
  trailing timer is the whole of "the session speaks first"; there is no
  cross-region scheduler. See SessionAnnouncer.svelte.
-->
<SessionAnnouncer />
{@render children()}

<!--
  GPLv3 section 6(d) — "clear directions next to the object code". This lives in
  the persistent layout, so it is on every page that ships the bundle, not on an
  About page. The SHA is rendered in full so the smoke test can read it and
  derive the archive URL, which is why __BUILD_DIRTY__ is a separate constant:
  concatenating "-dirty" onto the SHA would point the link at an archive that
  never exists. Styling is deliberately minimal — the design system is Phase 4.
  rel="external" on the three links is not decoration: none of these targets is
  a SvelteKit route. LICENSE, THIRD-PARTY.md and the source archive are plain
  files that scripts/postbuild.mjs writes into build/, so the client router must
  not try to handle them — which is also what satisfies
  svelte/no-navigation-without-resolve without weakening the rule.
-->
<footer
  class="mt-16 flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-6 text-xs [&_a]:underline [&_a]:underline-offset-2"
>
  <a href="/LICENSE" rel="external">GPLv3</a>
  <a href="/THIRD-PARTY.md" rel="external">Third-party notices</a>
  <a href="/source-{__COMMIT_SHA__}.tar.gz" rel="external" download>Source</a>
  <code data-testid="commit-sha">{__COMMIT_SHA__}</code>
  {#if __BUILD_DIRTY__}<span>(built from uncommitted changes)</span>{/if}
</footer>
