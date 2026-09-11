<!--
  THE HEADER BAND (plan 13-05; PDF pages 1-5; Bible section 4 and 15).

  76px tall, a 1px divider beneath it. The wordmark with FOR ZONA at its
  left, the primary nav beside it, and the connection control's box at the
  right. Two shapes, chosen by `variant`, and the prop exists for one
  reason: page 1 is the exception. The intro (13-07) has no nav, no context
  bar, no rail and no inspector - its header carries only the wordmark, a
  secondary link (the PDF's Quick guide) and an outlined Connect ZONA. A
  variant is how the shell renders two shapes without each route tearing
  the frame apart.

  THE CONNECTION SLOT IS RESERVED AND EMPTY. 13-11 builds the control from
  slotStateOf and capabilityOf, keeping DeviceSlot.svelte's rule that it is
  a plain button whenever a click does something and a summary whenever it
  does not. This component renders the slot and reserves the box at the
  PDF's 218 x 37 so the header's height does not move the day the control
  arrives; it builds nothing, so two plans cannot build one control.

  THE LINK'S ACCESSIBLE NAME is the plain pair the two pieces spell - the
  mark's own "HANGAR" (Wordmark.svelte's ledgered label) followed by the
  text FOR ZONA - because the Bible gives no line for the link and 13-03
  ledgered the question for 13-18. No aria-label is invented here.

  Every number is layout.ts's, imported. FOR ZONA is the PDF's and is not
  ledgered.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { resolve } from "$app/paths";
  import Wordmark from "../Wordmark.svelte";
  import Nav from "./Nav.svelte";
  import { CONNECTION_SLOT, HEADER_H } from "./layout";
  import type { Section } from "./shell.svelte";

  let {
    variant = "app",
    section,
    secondary,
    connection,
  }: {
    /** "app" for pages 2-5; "intro" for page 1's exception. */
    variant?: "app" | "intro";
    /** The nav's current section. Ignored by the intro. */
    section?: Section;
    /** The intro's secondary link (Quick guide). Rendered only by the intro. */
    secondary?: Snippet;
    /** The connection control. Reserved for 13-11; the box is drawn empty until then. */
    connection?: Snippet;
  } = $props();
</script>

<header
  class="header"
  data-testid="shell-header"
  data-variant={variant}
  style:--header-h="{HEADER_H}px"
  style:--connection-w="{CONNECTION_SLOT.inline}px"
  style:--connection-h="{CONNECTION_SLOT.block}px"
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

  <!--
    The connection slot. 13-11 fills it; until then the box is reserved at
    the PDF's 218 x 37 and renders nothing.
  -->
  <div class="connection" data-testid="shell-connection">
    {#if connection}{@render connection()}{/if}
  </div>
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

  /* The reserved box, pushed to the right edge. */
  .connection {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-inline-start: auto;
    min-inline-size: var(--connection-w);
    min-block-size: var(--connection-h);
  }

  /*
    Section 13's narrow band: the band wraps rather than overflowing. The
    app shape's first phone render was the gallery (plan 13-08), where
    e2e/browse-webkit.e2e.ts measures the document for sideways scroll at
    375px; the wordmark, the nav and the reserved connection box do not fit
    on one line there, so they flow onto rows. The width rule is a layout
    rule and stays keyed to width; targets stay keyed to pointer.
  */
  @media (max-width: 767.98px) {
    .header {
      flex-wrap: wrap;
      gap: 8px 24px;
      padding-block: 8px;
    }
  }
</style>
