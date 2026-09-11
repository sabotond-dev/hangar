<!--
  THE FOOTER (plan 13-05; PDF pages 2-5, about 50 tall; Bible section 4).

  HANGAR / by intech studio at the left; Help & shortcuts · Device actions at
  the right; ~13px secondary. Both strings are the PDF's and are not
  ledgered.

  THREE THINGS LIVE HERE, AND NONE OF THEM IS DECORATION.

  1. THE GPLv3 BLOCK, VERBATIM. GPLv3 section 6(d) - "clear directions next
     to the object code". It lived in src/routes/+layout.svelte's own footer
     from plan 04 until this plan, and the five lines below are byte for
     byte the lines git holds at 07d910f (src/routes/+layout.svelte:60-64):
     the same hrefs, the same rel="external" (none of these targets is a
     SvelteKit route - LICENSE, THIRD-PARTY.md and the archive are plain
     files scripts/postbuild.mjs writes into build/, so the client router
     must not handle them, which is also what satisfies
     svelte/no-navigation-without-resolve), the same download attribute,
     the same commit-sha test id the smoke test reads to derive the archive
     URL, and __BUILD_DIRTY__ still a separate constant, because
     concatenating "-dirty" onto the SHA would point the link at an archive
     that never exists. shell.spec.ts test 4 holds the five lines against
     the git copy. The block is styled as a second, quieter row; it is on
     every page that ships the bundle, not on an About page.

  2. HELP & SHORTCUTS IS A DISCLOSURE, AND THE MOTION CONTROL IS UNDER IT.
     13-04 re-homed the SCREEN switch's one surviving purpose (D-09) as
     MotionControl.svelte and parked it in the layout's footer with a
     comment naming this plan as the one that moves it under Help &
     shortcuts. Moved as a unit, unchanged: the same component, the same
     strings (ledgered by 13-04), the same additive rule. The disclosure is
     a button carrying aria-expanded and aria-controls, closed by default,
     which keeps the footer the PDF's one quiet line until someone asks.
     The panel is a plain block, never a dialog. Keyboard shortcuts join it
     when a plan defines some; nothing is invented here to fill it.

  3. DEVICE ACTIONS IS A RESERVED SLOT. 13-11 fills it. Until it does the
     label is ABSENT rather than dead: a footer link that does nothing is
     the coy state D-05 forbids, so the pair reads Help & shortcuts alone
     while the slot is empty and gains its middle dot and its second label
     the day 13-11 hands the snippet over. shell.spec.ts test 4 drives both.

  Every number is layout.ts's, imported. No radius anywhere.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import MotionControl from "../MotionControl.svelte";
  import { FOOTER_H } from "./layout";

  let {
    deviceActions,
  }: {
    /** The Device actions control. Reserved for 13-11; absent means no label. */
    deviceActions?: Snippet;
  } = $props();

  const uid = $props.id();
  const helpId = `${uid}-help`;

  /** The disclosure's state. Owned here; nothing else reads it. */
  let helpOpen = $state(false);
</script>

<footer
  class="footer"
  data-testid="shell-footer"
  style:--footer-h="{FOOTER_H}px"
>
  <p class="brand">HANGAR / by intech studio</p>

  <div class="actions">
    <button
      class="link"
      type="button"
      data-testid="footer-help"
      aria-expanded={helpOpen}
      aria-controls={helpId}
      onclick={() => (helpOpen = !helpOpen)}>Help &amp; shortcuts</button
    >
    {#if deviceActions}
      <span class="dot" aria-hidden="true">·</span>
      <span class="device" data-testid="footer-device-actions"
        >{@render deviceActions()}</span
      >
    {/if}
  </div>

  <!-- The Help & shortcuts panel: the motion control, moved here from the
       layout's footer by this plan (13-04 parked it there and named 13-05). -->
  <div
    class="help"
    id={helpId}
    hidden={!helpOpen}
    data-testid="footer-help-panel"
  >
    <MotionControl />
  </div>

  <div class="break" aria-hidden="true"></div>
  <a href="/LICENSE" rel="external">GPLv3</a>
  <a href="/THIRD-PARTY.md" rel="external">Third-party notices</a>
  <a href="/source-{__COMMIT_SHA__}.tar.gz" rel="external" download>Source</a>
  <code data-testid="commit-sha">{__COMMIT_SHA__}</code>
  {#if __BUILD_DIRTY__}<span>(built from uncommitted changes)</span>{/if}
</footer>

<style>
  .footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 16px;
    row-gap: 4px;
    box-sizing: border-box;
    min-block-size: var(--footer-h);
    padding-inline: 30px;
    padding-block: 12px;
    border-block-start: 1px solid var(--color-divider);
    background: var(--color-workspace);
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.45;
    color: var(--color-ink-quiet);
  }

  .brand {
    margin: 0;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-inline-start: auto;
  }

  /* A link-shaped button: no border, no fill, the footer's own colour, and
     the 44px box on both axes at every pointer. */
  .link {
    display: inline-flex;
    align-items: center;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    font: inherit;
    color: inherit;
    cursor: pointer;
  }

  .link:hover,
  .link[aria-expanded="true"] {
    color: var(--color-ink);
  }

  .device {
    display: inline-flex;
    align-items: center;
  }

  /* The panel takes its own row beneath the line. */
  .help {
    flex-basis: 100%;
  }

  .help[hidden] {
    display: none;
  }

  /* The licence row: after the break, the five verbatim elements flow as
     one quieter line. */
  .break {
    flex-basis: 100%;
    block-size: 0;
  }

  .footer > a {
    min-block-size: 44px;
    min-inline-size: 44px;
    display: inline-flex;
    align-items: center;
    font-size: 12px;
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .footer > code,
  .footer > span {
    font-size: 12px;
  }

  .footer > code {
    font-family: var(--font-mono);
  }
</style>
