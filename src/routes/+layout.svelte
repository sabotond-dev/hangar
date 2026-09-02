<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";

  let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
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
