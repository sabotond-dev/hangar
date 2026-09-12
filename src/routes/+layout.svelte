<script lang="ts">
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
   * The shape a route DECLARED as data (plan 13-07), read only while no
   * effect has filled the shell. On the server this is the only fill there
   * can be - see shellFromData - and it is what puts the intro's header in
   * the prerendered document. `page` is bound to the current request and
   * throws outside one; the one place the layout renders outside a request
   * is src/lib/ui/shell.spec.ts's render(), where there is no declared
   * shape either, so the throw reads as "none".
   */
  function declared(): ShellFill | undefined {
    try {
      return shellFromData(page.data);
    } catch {
      return undefined;
    }
  }

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
   * footer. Every visitor-facing route fills the shell since 13-09 (/,
   * /playground/, /playground/[id]); the unfilled branch stays for the
   * seven bench instruments under /dev/, which draw their own chrome and
   * fill nothing, so 13-09 kept it rather than putting a header on the
   * bench.
   *
   * THE FRAME'S NUMBERS ARE layout.ts's, SET AS CUSTOM PROPERTIES BELOW and
   * read by the rules in the style block; no number is written in the stylesheet.
   * The three breakpoints are the one exception CSS forces: a media query
   * cannot read a custom property, so section 13's 1440 / 1024 / 768 appear
   * in the queries as literals, and shell.spec.ts test 5 holds each of them
   * equal to BREAKPOINTS. The inspector is the PDF's fraction of the
   * viewport clamped to its band (D-14 Q9); the rail is fixed per band.
   *
   * THE FRAME IS WHAT THE VIEWPORT LEAVES in the wide and compact bands, so
   * the rail and the inspector scroll their own bodies while the surface and
   * the context bar's primary action stay put (section 7). The site root is a
   * 100dvh flex column on every shape (13.1-01 gave the intro this; the quick
   * task after the 13.1 gate, deferred-items A.4, widened it to the app
   * pages): the announcer, the shell and the footer at their rendered
   * heights, the shell flex 1, and inside it the frame flex 1 with
   * min-block-size 0. The frame's height is DERIVED from the header, the
   * context bar and the footer as they render, never a calc on HEADER_H,
   * CONTEXT_H and FOOTER_H: the footer is min-block-size FOOTER_H and renders
   * 121 (its licence row is a second 44px line), so the calc this rule used
   * to be left every app page 71px of document scroll (A.1). In the stacked
   * and narrow bands the side regions leave the row - the rail above the
   * centre, the inspector below it, section 13's "below the surface" - and
   * the page flows. The rail's collapse control at 768-1023 and the drawer and bottom
   * sheet below 768 are controls with labels the Bible does not give; the
   * frame stacks the regions honestly and the plan that first renders a rail
   * at those widths (13-08) asks for the words.
   *
   * TOUCH TARGETS ARE KEYED TO POINTER CAPABILITY, NEVER TO WIDTH (section
   * 13): under (pointer: coarse) every control inside the shell resolves
   * COARSE_TARGET on both axes, whatever the viewport. Checkboxes and radios
   * are excluded because their label row is the target, as
   * MotionControl.svelte already declares.
   *
   * THE INTRO IS ONE SCREEN (plan 13.1-01; 13.1-CONTEXT.md D-01; bench line
   * 1, 2026-09-12: "I dont want the index page to be scrollable, always fit
   * on the screen"). In the wide and compact bands the site root is the
   * 100dvh flex column above (under the intro variant since 13.1-01, under
   * every variant since A.4): the announcer, the shell (header over centre)
   * and the footer, each at its own rendered height, and the intro's centre
   * takes what is left with overflow: hidden. The centre's height is
   * DERIVED from the header and the footer as they render, never computed
   * from HEADER_H and FOOTER_H: the footer is min-block-size FOOTER_H and
   * renders taller (its licence row is a second 44px line), so a calc on
   * the constants would leave the document 71px of scroll. The centre is a
   * size container, and Intro.svelte reads its height as 100cqh to scale
   * the PDF's numbers (layout.ts, INTRO_FIT_H and the paragraph above it).
   * Below 1024 the root is display: contents again, the columns stack
   * (13-07) and the phone may scroll - D-01 is the user's rule about the
   * desktop; deferred-items D.10 is still open.
   *
   * THE DEVICE CHROME IS THE SHELL'S, NOT A ROUTE'S (plan 13-11). The
   * header's connection control and the footer's Device actions read the
   * two singletons this layout starts, so the layout mounts both, once, on
   * every shape - the intro's header, the app pages' header, and the footer
   * under all three shapes including the unfilled bench. 13-05 reserved the
   * two slots as snippets a route would hand over; 13-09 filled the first
   * provisionally from the workspace route. Neither is a route's business:
   * a control that must exist on every page belongs to the one component
   * that is on every page. The snippet props stay on Header and Footer so
   * shell.spec.ts can render either shape alone.
   *
   * THE USER'S CLEAR IS THE HEADER'S TOO (plan 13.1-05; 13.1-CONTEXT D-04;
   * bench line 4, 2026-09-12: "CLEAR button. we need a CLEAR button it
   * should live all the time in the top right corner next to ZONA
   * connected."). Clear.svelte - the store's clearToDefault() as one click,
   * disabled with its reason otherwise - is handed to the header's `clear`
   * snippet here, once, beside the connection snippet, so it renders on
   * every page and in both header variants: the intro's header carries it
   * as the app pages' does, because "all the time" is the user's word. The
   * workspace's install column no longer mounts it. Clear.svelte names the
   * session, the install store and install-copy and nothing else - the
   * chunk guard's permitted paths (config-shape.spec.ts test 13;
   * device-ui.spec.ts test 1 reads the component), all free of the protocol
   * package, so the header still paints without it.
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
  The one session live region, BEFORE the page (D-17). It precedes the tuning
  and browse regions in the document, and that document order plus the store's
  trailing timer is the whole of "the session speaks first"; there is no
  cross-region scheduler. See SessionAnnouncer.svelte.

  13-05 put the shell AROUND this line rather than moving it: the announcer is
  the first element in the document on every route, ahead of the header, and
  the shell's regions follow it. Nothing about its order changed.
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
    GPLv3 section 6(d) — "clear directions next to the object code". The block
    lives in Footer.svelte since 13-05, verbatim (the five lines are held
    against git by src/lib/ui/shell.spec.ts test 4), and the footer is mounted
    here, in the persistent layout, so it is on every page that ships the
    bundle - filled shell or not - and not on an About page. The motion control
    13-04 parked in this file's own footer went with it, under Help & shortcuts.
  -->
  <Footer {deviceActions} />
</div>

<style>
  /*
    One screen (13.1-01, D-01; widened from the intro to every shape by the
    quick task after the 13.1 gate, deferred-items A.4): the site root is a
    100dvh column - announcer, shell, footer - and the shell takes what is
    left. The custom properties inherit through it as they did when it had
    no box.
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
    The frame, wide band: rail | centre | inspector. The inspector is the
    PDF's fraction of the viewport, clamped; the rail is fixed; the centre is
    the remainder, and the whole row is what the shell's column leaves after
    the header and the context bar (the footer is the site column's), so each
    column scrolls its own body. Never a calc on the constants (A.4).
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
    The intro's centre (13.1-01, D-01): a flex child of the 100dvh site
    column below, sized by what the header and the footer leave, clipped at
    its edge, and a size container so Intro.svelte can read its height in
    cq units. The e2e title in first-experience.e2e.ts proves the fit at four
    desktop viewports off the rendered boxes, not off this stylesheet.
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

  /* Compact band (section 13's 1024-1439): the 200 rail and the 268-300 inspector. */
  @media (max-width: 1439.98px) {
    .frame {
      --rail-w: var(--rail-compact-w);
      --inspector-min: var(--inspector-compact-min);
      --inspector-max: var(--inspector-compact-max);
    }
  }

  /*
    Stacked band (768-1023): the side regions leave the row, the page flows.
    flex: none, as .centre.intro declares below: the shell's column is
    content-height here (the site root is display: contents), and a flex
    basis of 0 in a content-height column is a frame of height 0 with the
    page spilling past it (measured, A.4's quick task: 8522px of document at
    900 x 720 without this line).
  */
  @media (max-width: 1023.98px) {
    .frame,
    .frame.no-inspector {
      grid-template-columns: minmax(0, 1fr);
      flex: none;
      block-size: auto;
    }

    .rail-col {
      border-inline-end: 0;
      border-block-end: 1px solid var(--color-divider);
    }

    .inspector-col {
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

  /*
    Section 13: pointer capability sizes targets, never the viewport. Every
    control inside the shell - the frame, the header, the footer, and
    whatever a route renders in a slot - is at least the coarse target on
    both axes under a coarse pointer, at any width.
  */
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
