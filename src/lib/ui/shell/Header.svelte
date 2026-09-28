<!--
  The header band, PDF pages 1-5: 76px, a divider beneath; the wordmark with FOR
  ZONA (the link's name is the plain pair, nothing invented), the primary nav, and
  the connection zone at the right. Props: variant ("app"; "intro" is page 1's
  exception - no nav, a secondary Quick guide link, an outlined Connect ZONA),
  section, secondary, connection (the layout's ConnectionControl.svelte), clear
  (the layout's Clear.svelte, 12px to the LEFT of the PDF's 218 x 37 box, both
  variants, since 13.1-05). The zone is an inline-size container that takes the
  row's remaining space, so Clear can ask how much room there is and the header
  never scrolls sideways; the row's height is the control's 44px. Every number is layout.ts's.
  context (change 25b): on the app pages, where the context bar left, its status and right zones
  (ContextBar.svelte's header placement, handed over by the layout) take a line of their own
  under the row, right-aligned beneath Clear and the connection control, after them in the
  document so the tab order reads the row first; the row itself does not move.
  Decided at 13-05 / 13.1-05 (13.1-CONTEXT D-04); see .planning/phases/13.1-bench-corrections-four/13.1-05-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { resolve } from "$app/paths";
  import Wordmark from "../Wordmark.svelte";
  import Nav from "./Nav.svelte";
  import { CONNECTION_SLOT, HEADER_CONTEXT_PAD, HEADER_H } from "./layout";
  import type { Section } from "./shell.svelte";

  let {
    variant = "app",
    section,
    secondary,
    connection,
    clear,
    context,
  }: {
    /** "app" for pages 2-5; "intro" for page 1's exception. */
    variant?: "app" | "intro";
    /** The nav's current section. Ignored by the intro. */
    section?: Section;
    /** The intro's secondary link (Quick guide). Rendered only by the intro. */
    secondary?: Snippet;
    /** The connection control, handed over by the layout (ConnectionControl.svelte since 13-11). */
    connection?: Snippet;
    /** The user's Clear, handed over by the layout (Clear.svelte since 13.1-05); rendered before the connection control. */
    clear?: Snippet;
    /** The app pages' context line (change 25b): the dotted status and the destination or the preview sentence, beneath the row. Absent elsewhere. */
    context?: Snippet;
  } = $props();
</script>

<header
  class="header"
  data-testid="shell-header"
  data-variant={variant}
  class:with-context={context !== undefined}
  style:--header-h="{HEADER_H}px"
  style:--connection-w="{CONNECTION_SLOT.inline}px"
  style:--connection-h="{CONNECTION_SLOT.block}px"
  style:--context-pad-top="{HEADER_CONTEXT_PAD.top}px"
  style:--context-pad-bottom="{HEADER_CONTEXT_PAD.bottom}px"
>
  <a class="mark" href={resolve("/")} data-testid="shell-wordmark">
    <Wordmark />
    <span class="for type-micro">FOR ZONA</span>
  </a>

  {#if variant === "app"}
    <Nav {section} />
  {:else if secondary}
    <div class="secondary">{@render secondary()}</div>
  {/if}

  <!-- The connection zone: the user's Clear, then the PDF's 218 x 37 box, both filled by the layout. -->
  <div class="connection" data-testid="shell-connection">
    {#if clear}{@render clear()}{/if}
    {#if connection}{@render connection()}{/if}
  </div>

  {#if context}
    <div class="context" data-testid="shell-header-context">
      {@render context()}
    </div>
  {/if}
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    gap: 48px;
    box-sizing: border-box;
    min-block-size: var(--header-h);
    padding-inline: 20px;
    border-block-end: 1px solid var(--color-divider);
    background: var(--color-workspace);
    color: var(--color-ink);
  }

  /* The wordmark is a real link to the front door: a 44px box at every pointer. */
  .mark {
    display: inline-flex;
    align-items: center;
    gap: 16px;
    min-block-size: 44px;
    min-inline-size: 44px;
    text-decoration: none;
    color: var(--color-ink);
  }

  .mark:hover {
    color: var(--color-ink);
  }

  .for {
    color: var(--color-ink-quiet);
  }

  .secondary {
    display: flex;
    align-items: center;
  }

  /* The zone at the right edge: the reserved box is its basis and floor, the row's slack its width, a container so the Clear box can ask for room (13.1-05); 12px between the pair. */
  .connection {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    flex: 1 1 var(--connection-w);
    margin-inline-start: auto;
    min-inline-size: var(--connection-w);
    min-block-size: var(--connection-h);
    container-type: inline-size;
  }

  /*
    The context line (change 25b): the row keeps its place - the 44px controls centred where the
    76px band centres them, the header's padding carrying the half the band would - and the line
    takes the width beneath it, its zones right-aligned under Clear and the connection control.
  */
  .with-context {
    flex-wrap: wrap;
    align-content: flex-start;
    row-gap: 0;
    padding-block: var(--context-pad-top) var(--context-pad-bottom);
  }

  .context {
    display: flex;
    justify-content: flex-end;
    flex: 1 1 100%;
    min-inline-size: 0;
  }

  /* Section 13's narrow band: the band wraps onto rows rather than overflowing (browse-webkit.e2e.ts measures 375px). A layout rule, keyed to width. */
  @media (max-width: 767.98px) {
    .header,
    .with-context {
      flex-wrap: wrap;
      gap: 8px 24px;
      padding-block: 8px;
    }
  }
</style>
