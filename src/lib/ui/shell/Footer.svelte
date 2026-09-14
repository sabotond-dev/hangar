<!--
  The footer, PDF pages 2-5 (Bible section 4): HANGAR / by intech studio at the
  left, Help & shortcuts · Device actions at the right, ~13px secondary, and a
  quieter second row carrying the GPLv3 block verbatim - the five lines git holds
  at 07d910f (src/routes/+layout.svelte:60-64), rel="external" because none of
  the targets is a route, __BUILD_DIRTY__ a separate constant so a dirty SHA never
  points at an archive that does not exist (shell.spec.ts holds the five lines).
  Help & shortcuts is a disclosure (aria-expanded, aria-controls, closed) with the
  motion control under it. Prop: deviceActions, the layout's snippet (absent: no
  dead label); it renders its label and its panel row, which wraps beneath the pair.
  Decided at 13-05 / 13-11 (GPLv3 section 6(d), D-09); see .planning/phases/13-gui-overhaul/13-05-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import MotionControl from "../MotionControl.svelte";
  import { FOOTER_H } from "./layout";

  let {
    deviceActions,
  }: {
    /** The Device actions control, handed over by the layout (DeviceActions.svelte since 13-11); absent means no label. */
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

  <!-- The Help & shortcuts panel: the motion control (13-04 parked it in the layout's footer; 13-05 moved it). -->
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
</style>
