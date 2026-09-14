<!--
  Device actions, in the footer: a disclosure label shaped like Footer.svelte's
  Help & shortcuts (aria-expanded, aria-controls, closed by default) and the panel
  it controls, DeviceDetails.svelte - the ONLY mount of the details on the site
  (Y-11: the recovery is never on the screen twice). No props; the open state is
  device-drawer.svelte.ts's, which the header's DeviceSlot toggles too, and both
  openers carry the panel's id in aria-controls. Every state, string, control and
  reason in the panel is DeviceDetails'; none is retyped here. Reset active device
  page is not here - a question recorded for the user, not an omission.
  Decided at 13-11; see .planning/phases/13-gui-overhaul/13-11-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { PANEL_ID, drawer } from "./device-drawer.svelte";
  import DeviceDetails from "./DeviceDetails.svelte";

  let label = $state<HTMLButtonElement | null>(null);

  function toggle(): void {
    drawer.opener = label;
    drawer.open = !drawer.open;
  }
</script>

<button
  class="label"
  type="button"
  data-testid="device-actions"
  aria-expanded={drawer.open}
  aria-controls={PANEL_ID}
  bind:this={label}
  onclick={toggle}>Device actions</button
>

<!-- The panel row is present always so aria-controls names a real element; DeviceDetails renders inside it only while open. -->
<div
  class="panel"
  class:open={drawer.open}
  id={PANEL_ID}
  data-testid="device-actions-panel"
>
  <DeviceDetails
    open={drawer.open}
    opener={drawer.opener}
    onclose={() => (drawer.open = false)}
  />
</div>

<style>
  /* The footer's link-shaped button, Help & shortcuts' shape: no fill, the footer's colour, 44px on both axes. */
  .label {
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

  .label:hover,
  .label[aria-expanded="true"] {
    color: var(--color-ink);
  }

  /* The panel takes its own row beneath the footer's line. */
  .panel {
    flex-basis: 100%;
    display: flex;
  }

  .panel:not(.open) {
    display: none;
  }
</style>
