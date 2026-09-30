<!--
  The footer, PDF pages 2-5 (Bible section 4): HANGAR / by intech studio at the
  left, Help & shortcuts · Device actions at the right, ~13px secondary, and a
  quieter second row carrying the GPLv3 block verbatim - the five lines git holds
  at 07d910f (src/routes/+layout.svelte:60-64), rel="external" because none of
  the targets is a route, __BUILD_DIRTY__ a separate constant so a dirty SHA never
  points at an archive that does not exist (shell.spec.ts holds the five lines).
  Help & shortcuts is a disclosure (aria-expanded, aria-controls, closed) with the
  motion control under it and, since change 26, the Quick guide's link above that. Prop: deviceActions, the layout's snippet (absent: no
  dead label); it renders its label and its panel row, which wraps beneath the pair.
  strip (change 25b): on the app pages the same elements in the same order draw ONE LINE -
  the brand, Help & shortcuts · Device actions, then the licence row at the right - in the
  licence row's 12px, the build id the first thing to give way. Every link stays: the
  source is one click away on every page (GPLv3 section 6(d)). A panel opens on a row
  beneath the line. Below the compact band the page scrolls and the footer is the full one.
  Decided at 13-05 / 13-11 (GPLv3 section 6(d), D-09); see .planning/phases/13-gui-overhaul/13-05-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { HELP_GUIDE_LINK } from "$lib/guide/copy";
  import MotionControl from "../MotionControl.svelte";
  import { GUIDE_HREF } from "./shell.svelte";
  import { FOOTER_H, FOOTER_STRIP_H } from "./layout";

  let {
    deviceActions,
    strip = false,
  }: {
    /** The Device actions control, handed over by the layout (DeviceActions.svelte since 13-11); absent means no label. */
    deviceActions?: Snippet;
    /** The app pages' one-line strip (change 25b); the full two-row footer otherwise. */
    strip?: boolean;
  } = $props();

  const uid = $props.id();
  const helpId = `${uid}-help`;

  /** The disclosure's state. Owned here; nothing else reads it. */
  let helpOpen = $state(false);
</script>

<footer
  class="footer"
  class:strip
  data-testid="shell-footer"
  data-shape={strip ? "strip" : "full"}
  style:--footer-h="{FOOTER_H}px"
  style:--strip-h="{FOOTER_STRIP_H}px"
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

  <!-- The Help & shortcuts panel: the Quick guide (change 26), then the motion control (13-04 parked it in the layout's footer; 13-05 moved it). -->
  <div
    class="help"
    id={helpId}
    hidden={!helpOpen}
    data-testid="footer-help-panel"
  >
    <p class="help-guide">
      <a href={GUIDE_HREF} data-testid="help-quick-guide">{HELP_GUIDE_LINK}</a>
    </p>
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

  /* The brand stays on the footer's first line whatever a panel beneath does to the height. */
  .brand {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    min-block-size: 44px;
    margin: 0;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 0 8px;
    max-inline-size: 100%;
    margin-inline-start: auto;
  }

  /* A link-shaped button: no fill, the footer's colour, a 44px box on both axes. */
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

  /* The slot's label sits in the row; its panel (flex-basis: 100%) wraps onto the line beneath. */
  .device {
    display: contents;
  }

  /* The panel takes its own row beneath the line. */
  .help {
    flex-basis: 100%;
  }

  .help[hidden] {
    display: none;
  }

  /* The panel's link: the footer's ink, underlined as its links are, a 44px box at every pointer. */
  .help-guide {
    margin: 0;
  }

  .help-guide a {
    display: inline-flex;
    align-items: center;
    min-block-size: 44px;
    min-inline-size: 44px;
    color: var(--color-ink);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  /* The licence row: after the break, the five verbatim elements flow as one quieter line. */
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

  /*
    THE STRIP (change 25b), from the compact band up, where the centre fits the screen: one grid
    row - the brand, Help & shortcuts, the dot, Device actions, the slack, GPLv3, Third-party
    notices, Source, the build id, the dirty note - and a second row for whichever panel is open.
    The build id's track is the only one that can shrink below its text, so it gives way first,
    with an ellipsis. The actions box lets its children join the grid.
  */
  @media (min-width: 1024px) {
    .strip {
      display: grid;
      grid-template-columns:
        auto auto auto auto minmax(0, 1fr) auto auto auto
        minmax(0, max-content) auto;
      align-items: center;
      column-gap: 8px;
      row-gap: 0;
      min-block-size: 0;
      padding-inline: 20px;
      padding-block: 0;
      font-size: 12px;
      white-space: nowrap;
    }

    .strip .actions,
    .strip .device {
      display: contents;
    }

    .strip > *,
    .strip .actions > *,
    .strip .device > :global(*) {
      grid-row: 1;
    }

    .strip .brand {
      grid-column: 1;
      align-self: center;
      min-block-size: 0;
    }

    /* 8px either side of the dot, as in the full footer; 16 between everything else. */
    .strip .link,
    .strip > a,
    .strip > code,
    .strip > span {
      margin-inline-start: 8px;
    }

    .strip .link {
      grid-column: 2;
    }

    .strip .dot {
      grid-column: 3;
    }

    .strip .device > :global(button) {
      grid-column: 4;
    }

    .strip .break {
      display: none;
    }

    .strip > a:nth-of-type(1) {
      grid-column: 6;
    }

    .strip > a:nth-of-type(2) {
      grid-column: 7;
    }

    .strip > a:nth-of-type(3) {
      grid-column: 8;
    }

    .strip > code {
      grid-column: 9;
      min-inline-size: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .strip > span {
      grid-column: 10;
    }

    /* A panel opens on its own row beneath the line: the strip grows while it is open, as the full footer does. */
    .strip .help,
    .strip .device > :global(div) {
      grid-row: 2;
      grid-column: 1 / -1;
      white-space: normal;
    }
  }

  /* The strip's controls are its line's height at a fine pointer; a coarse pointer keeps the site's 44px floor. */
  @media (min-width: 1024px) and (pointer: fine) {
    .strip .link,
    .strip > a,
    .strip .device > :global(button) {
      min-block-size: var(--strip-h);
    }
  }
</style>
