<script lang="ts">
  // The persistent layout: the shell (13-05), mounted once and filled by the route through
  // shell.svelte.ts - "app" (PDF pages 2-5: header with nav, context bar, rail, centre, inspector,
  // footer), "intro" (page 1: header with the wordmark, Quick guide and the connection slot), or
  // unfilled (the bench instruments under /dev/ draw their own chrome). Starts the session and the
  // install store once, from onMount, for the whole site (D-05, D-03); mounts the device chrome -
  // ConnectionControl and Clear in the header, DeviceActions in the footer - on every shape (13-11,
  // 13.1-05). The frame's numbers are layout.ts's as custom properties; the three breakpoints are
  // literals in the queries, held equal to BREAKPOINTS by shell.spec.ts test 5. The site root is a
  // 100dvh column (announcer, shell, footer) whose frame height is derived, never a calc (A.4).
  // The static imports of the session and the install store are the chunk guard's two allowed cases (config-shape.spec.ts test 13).
  // Decided at 13-05 / 13-11 / 13.1-01 / 13.1-05 (13.1-CONTEXT D-01, D-04); see .planning/phases/13.1-bench-corrections-four/13.1-05-SUMMARY.md
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import favicon from "$lib/assets/favicon.svg";
  import { install } from "$lib/device/install.svelte";
  import { session } from "$lib/device/session.svelte";
  import Clear from "$lib/ui/Clear.svelte";
  import DeviceActions from "$lib/ui/DeviceActions.svelte";
  import SessionAnnouncer from "$lib/ui/SessionAnnouncer.svelte";
  import ConnectionControl from "$lib/ui/shell/ConnectionControl.svelte";
  import ContextBar from "$lib/ui/shell/ContextBar.svelte";
  import Footer from "$lib/ui/shell/Footer.svelte";
  import Header from "$lib/ui/shell/Header.svelte";
  import {
    CENTRE_PAD,
    COARSE_TARGET,
    CONTEXT_H,
    FOOTER_H,
    HEADER_H,
    INSPECTOR_COMPACT_MAX,
    INSPECTOR_COMPACT_MIN,
    INSPECTOR_FR,
    INSPECTOR_MAX,
    INSPECTOR_MIN,
    RAIL_COMPACT_W,
    RAIL_W,
    SURFACE_MAX,
  } from "$lib/ui/shell/layout";
  import {
    shell,
    shellFromData,
    type ShellFill,
  } from "$lib/ui/shell/shell.svelte";

  let { children } = $props();

  /**
   * The shape a route declared as data (13-07), read only while no effect has filled the shell; on
   * the server it is the only fill there can be. `page` throws outside a request (shell.spec.ts's
   * render()), and the throw reads as "none".
   */
  function declared(): ShellFill | undefined {
    try {
      return shellFromData(page.data);
    } catch {
      return undefined;
    }
  }

  /**
   * The device session starts here, once, for the whole site (D-05), from onMount because the module
   * scope runs in the prerenderer; start() is idempotent, so the session probe's own start attaches nothing twice.
   */
  onMount(() => {
    session.start();
    // The install store subscribes to the session's connection seam here, so the snapshot is taken at
    // "connected" on every route before any panel mounts (07-08, D-03). Idempotent.
    install.start();
  });

  /**
   * The fill: the route's, else the declared shape. Every visitor-facing route fills the shell since
   * 13-09; the unfilled branch renders the announcer, the page and the footer for the bench. Touch
   * targets are keyed to pointer capability, never to width (section 13); the intro is one screen
   * (13.1-01, D-01) and the phone may scroll below 1024 (deferred-items D.10 open).
   */
  const fill = $derived(shell.fill ?? declared());
</script>

{#snippet clear()}
  <Clear />
{/snippet}

{#snippet connection()}
  <ConnectionControl />
{/snippet}

{#snippet deviceActions()}
  <DeviceActions />
{/snippet}

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!--
  The one session live region, first in the document on every route, before the header (D-17): that
  order plus the store's trailing timer is the whole of "the session speaks first". SessionAnnouncer.svelte.
-->
<SessionAnnouncer />

<div
  class="site"
  class:intro={fill?.variant === "intro"}
  style:--coarse-target="{COARSE_TARGET}px"
  style:--header-h="{HEADER_H}px"
  style:--context-h="{CONTEXT_H}px"
  style:--footer-h="{FOOTER_H}px"
>
  {#if fill === undefined}
    {@render children()}
  {:else}
    <div class="shell" data-testid="shell" data-variant={fill.variant}>
      <Header
        variant={fill.variant}
        section={fill.section}
        secondary={fill.secondary}
        {clear}
        {connection}
      />
      {#if fill.variant === "app"}
        <ContextBar
          breadcrumb={fill.breadcrumb}
          status={fill.status}
          draft={fill.draft}
          device={fill.device}
          page={fill.page}
          destination={fill.destination}
        />
        <div
          class="frame"
          class:no-inspector={!fill.inspector}
          class:with-tools={fill.tools !== undefined}
          data-testid="shell-frame"
          style:--rail-w="{RAIL_W}px"
          style:--rail-compact-w="{RAIL_COMPACT_W}px"
          style:--inspector-fr={INSPECTOR_FR}
          style:--inspector-min="{INSPECTOR_MIN}px"
          style:--inspector-max="{INSPECTOR_MAX}px"
          style:--inspector-compact-min="{INSPECTOR_COMPACT_MIN}px"
          style:--inspector-compact-max="{INSPECTOR_COMPACT_MAX}px"
          style:--surface-max="{SURFACE_MAX}px"
          style:--centre-pad="{CENTRE_PAD}px"
        >
          <div class="rail-col" data-testid="shell-rail-column">
            {#if fill.rail}{@render fill.rail()}{/if}
          </div>
          <main class="centre" data-testid="shell-centre">
            {@render children()}
          </main>
          {#if fill.tools}
            <div class="tools-col" data-testid="shell-tools-column">
              {@render fill.tools()}
            </div>
          {/if}
          {#if fill.inspector}
            <div class="inspector-col" data-testid="shell-inspector-column">
              {@render fill.inspector()}
            </div>
          {/if}
        </div>
      {:else}
        <main class="centre intro">
          {@render children()}
        </main>
      {/if}
    </div>
  {/if}

  <!--
    GPLv3 section 6(d): the directions block lives in Footer.svelte (shell.spec.ts test 4 holds its five
    lines against git), mounted here so it is on every page that ships the bundle, filled shell or not.
  -->
  <Footer {deviceActions} />
</div>

<style>
  /*
    One screen (13.1-01, D-01; every shape since A.4): the site root is a 100dvh column - announcer,
    shell, footer - and the shell takes what is left. The custom properties inherit through it.
  */
  .site {
    display: flex;
    flex-direction: column;
    block-size: 100dvh;
  }

  .shell {
    display: flex;
    flex-direction: column;
  }

  .site .shell {
    flex: 1 1 0;
    min-block-size: 0;
  }

  /*
    The frame, wide band: rail | centre | inspector. The inspector is the PDF's fraction of the viewport,
    clamped; the rail is fixed; the centre the remainder; the row is what the shell's column leaves after
    the header and the context bar, so each column scrolls its own body. Never a calc on the constants (A.4).
  */
  .frame {
    --inspector-w: clamp(
      var(--inspector-min),
      calc(var(--inspector-fr) * 100vw),
      var(--inspector-max)
    );
    display: grid;
    grid-template-columns: var(--rail-w) minmax(0, 1fr) var(--inspector-w);
    flex: 1 1 0;
    min-block-size: 0;
  }

  .frame.no-inspector {
    grid-template-columns: var(--rail-w) minmax(0, 1fr);
  }

  /* With a tool rail (change 15): a fourth track between the centre and the inspector, as wide as the rail draws itself. */
  .frame.with-tools {
    grid-template-columns: var(--rail-w) minmax(0, 1fr) auto var(--inspector-w);
  }

  .rail-col {
    min-block-size: 0;
    overflow: hidden;
    background: var(--color-panel);
    border-inline-end: 1px solid var(--color-divider);
  }

  /* The centre scrolls its own body; the surface inside it is capped. */
  .centre {
    min-block-size: 0;
    overflow-y: auto;
    padding: var(--centre-pad);
  }

  /*
    The intro's centre (13.1-01, D-01): a flex child of the 100dvh column, clipped at its edge, a size
    container so Intro.svelte reads its height in cq units; first-experience.e2e.ts proves the fit at four viewports.
  */
  .centre.intro {
    flex: 1 1 0;
    min-block-size: 0;
    padding: 0;
    overflow: hidden;
    container-type: size;
  }

  .inspector-col {
    min-block-size: 0;
    overflow: hidden;
    background: var(--color-panel);
    border-inline-start: 1px solid var(--color-divider);
  }

  /* The tools column scrolls its own body on a viewport too short for the rail's two stacks. */
  .tools-col {
    min-block-size: 0;
    overflow-y: auto;
    background: var(--color-panel);
    border-inline-start: 1px solid var(--color-divider);
  }

  /* Compact band (section 13's 1024-1439): the 200 rail and the 268-300 inspector. */
  @media (max-width: 1439.98px) {
    .frame {
      --rail-w: var(--rail-compact-w);
      --inspector-min: var(--inspector-compact-min);
      --inspector-max: var(--inspector-compact-max);
    }
  }

  /*
    Stacked band (768-1023): the side regions leave the row, the page flows. flex: none because the
    shell's column is content-height here and a flex basis of 0 would be a frame of height 0 with the
    page spilling past it (measured, A.4's quick task: 8522px of document at 900 x 720 without this line).
  */
  @media (max-width: 1023.98px) {
    .frame,
    .frame.no-inspector,
    .frame.with-tools {
      grid-template-columns: minmax(0, 1fr);
      flex: none;
      block-size: auto;
    }

    .rail-col {
      border-inline-end: 0;
      border-block-end: 1px solid var(--color-divider);
    }

    .inspector-col,
    .tools-col {
      border-inline-start: 0;
      border-block-start: 1px solid var(--color-divider);
    }

    .centre {
      overflow: visible;
    }

    /* The stacked page flows and may scroll (13-07's stack; D-01 is about the desktop). */
    .site {
      display: contents;
    }

    .centre.intro {
      flex: none;
      overflow: visible;
      container-type: normal;
    }
  }

  /* Narrow band (below 768): the same stack, tighter. */
  @media (max-width: 767.98px) {
    .centre {
      padding-inline: 16px;
    }
  }

  /* Section 13: every control inside the shell is at least the coarse target on both axes under a coarse pointer, at any width. */
  @media (pointer: coarse) {
    .site
      :global(
        :is(
          a,
          button,
          select,
          textarea,
          summary,
          [role="button"],
          input:not([type="checkbox"]):not([type="radio"])
        )
      ) {
      min-block-size: var(--coarse-target);
      min-inline-size: var(--coarse-target);
    }
  }
</style>
