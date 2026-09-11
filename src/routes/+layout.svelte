<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import favicon from "$lib/assets/favicon.svg";
  import { install } from "$lib/device/install.svelte";
  import { session } from "$lib/device/session.svelte";
  import SessionAnnouncer from "$lib/ui/SessionAnnouncer.svelte";
  import ContextBar from "$lib/ui/shell/ContextBar.svelte";
  import Footer from "$lib/ui/shell/Footer.svelte";
  import Header from "$lib/ui/shell/Header.svelte";
  import { shell } from "$lib/ui/shell/shell.svelte";

  let { children } = $props();

  /**
   * The device session is started HERE, once, for the whole site (D-05), and
   * from onMount rather than at module scope on purpose: +layout.ts sets
   * prerender = true, so this component's module scope runs in the
   * prerenderer, where there is no window and no navigator.serial to read.
   * start() is idempotent on the instance, so the session probe page - which
   * starts the singleton from its own onMount as well - attaches nothing
   * twice. The static imports of the session and the install store are the
   * two cases the chunk guard allows for this file (src/lib/config-shape.spec.ts
   * test 13): the session and its four specifiers, and the install store and
   * its three, are all free of the protocol package.
   */
  onMount(() => {
    session.start();
    // Phase 7 (07-08): the install store subscribes to the session's
    // connection seam here so the snapshot is taken at "connected" on every
    // route, before any panel mounts (D-03). Idempotent, like the session's.
    install.start();
  });

  /**
   * THE SHELL (plan 13-05). Mounted once, here, and filled by the route
   * through src/lib/ui/shell/shell.svelte.ts: the layout reads the fill and
   * renders the frame's named slots; it knows nothing about configurations.
   * Three shapes. "app" is the PDF's pages 2-5 (header with nav, context
   * bar, rail, centre, inspector, footer). "intro" is page 1's exception
   * (13-07): a header with the wordmark, a secondary link and the
   * connection slot, and nothing else above the page. UNFILLED - no route
   * has called fillShell() - renders the announcer, the page and the
   * footer, because `/`, `/c/[id]` and `/browse/` still draw a header of
   * their own until 13-07 and 13-09 rewrite them (13-VALIDATION.md D-5),
   * and a second header above it would be a visible defect on the live
   * site. 13-09 removes the unfilled branch when the last of the three
   * fills the shell.
   */
  const fill = $derived(shell.fill);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!--
  The one session live region, BEFORE the page (D-17). It precedes the tuning
  and browse regions in the document, and that document order plus the store's
  trailing timer is the whole of "the session speaks first"; there is no
  cross-region scheduler. See SessionAnnouncer.svelte.

  13-05 put the shell AROUND this line rather than moving it: the announcer is
  the first element in the document on every route, ahead of the header, and
  the shell's regions follow it. Nothing about its order changed.
-->
<SessionAnnouncer />

{#if fill === undefined}
  {@render children()}
{:else}
  <div class="shell" data-testid="shell" data-variant={fill.variant}>
    <Header
      variant={fill.variant}
      section={fill.section}
      secondary={fill.secondary}
      connection={fill.connection}
    />
    {#if fill.variant === "app"}
      <ContextBar
        breadcrumb={fill.breadcrumb}
        status={fill.status}
        destination={fill.destination}
      />
    {/if}
    <main class="centre">
      {@render children()}
    </main>
  </div>
{/if}

<!--
  GPLv3 section 6(d) — "clear directions next to the object code". The block
  lives in Footer.svelte since 13-05, verbatim (the five lines are held
  against git by src/lib/ui/shell.spec.ts test 4), and the footer is mounted
  here, in the persistent layout, so it is on every page that ships the
  bundle - filled shell or not - and not on an About page. The motion control
  13-04 parked in this file's own footer went with it, under Help & shortcuts.
-->
<Footer deviceActions={fill?.deviceActions} />

<style>
  .shell {
    display: flex;
    flex-direction: column;
  }

  .centre {
    flex: 1 1 auto;
    min-block-size: 0;
  }
</style>
