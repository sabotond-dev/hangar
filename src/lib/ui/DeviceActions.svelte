<!--
  DEVICE ACTIONS, IN THE FOOTER (plan 13-11; Bible section 9 "Reset behavior",
  section 15 "App header" and "Connection control"; PDF pages 2-5, the
  footer's right: `Help & shortcuts · Device actions`).

  WHAT IT IS. A disclosure label shaped exactly like Footer.svelte's `Help &
  shortcuts` - a button carrying aria-expanded and aria-controls, closed by
  default - and the panel it controls, which is DeviceDetails.svelte: the
  five disclosure states Phase 6 and Phase 7 wrote, unchanged and re-homed.
  While a ZONA is connected the panel is the identity sentence (firmware and
  the active page), the multi-module line, the snapshot line saying where
  the copy of the module's own configuration is kept, DISCONNECT ZONA and
  FORGET THIS ZONA under the session's write lock. Unplugged, it is the
  replug offer and FORGET THIS ZONA. On a browser that cannot connect, or
  after a refused connection, it is the recovery (CONN-02's two messages,
  CONN-04's six steps). Every one of those states, strings, controls and
  reasons is DeviceDetails' and none is retyped here.

  ONE MOUNT, TWO OPENERS. This is the ONLY place DeviceDetails is mounted on
  the site (Y-11: the recovery is never on the screen twice). The header's
  connection control (DeviceSlot.svelte) is the other opener: a summary in
  the four states where a click cannot act, it toggles the same
  device-drawer.svelte.ts state this label toggles, and the arriving S6
  failure opens the panel from there and moves focus into it. Both openers
  carry the panel's id in aria-controls, which is how DeviceDetails tells an
  opener's click from a click outside.

  FORGET THIS ZONA KEEPS ITS GATE. `SerialPort.forget()` is the control that
  earns trust on a site that talks to hardware people paid for (PROJECT.md);
  it renders only where the browser can revoke (session.canForget), behind
  this disclosure, with REVOKE_EXPLANATION beside it saying what it removes
  and that the copy of the visitor's own configuration stays (Z-13). That is
  its gate - an explanation one disclosure away - and it moved whole.

  RESET ACTIVE DEVICE PAGE IS NOT HERE, AND THAT IS A QUESTION, NOT AN
  OMISSION. Section 9 puts it under Device actions with a confirmation that
  names the page. The tree has the control - CLEAR, in the workspace's
  install column - and Phase 10's A-45 shipped it WITHOUT a confirmation
  (device-ui.spec.ts test 13 asserts the site's one confirmation is KEEP ON
  DEVICE's); the confirmation's sentence is 13-18's, and the page it would
  name is 13-12's target, not the reported page. Building a second gate for
  one write beside the first, with a sentence this plan may not author, was
  refused under D-01 and recorded in 13-11's summary for the user.

  THE LABEL IS THE PDF'S and is not ledgered, as Footer.svelte's `Help &
  shortcuts` is not. The panel's id is one static string because there is
  one mount.

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

<!-- The panel row: present always so aria-controls names a real element;
     DeviceDetails renders inside it only while open and in a state that has
     a disclosure. -->
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
  /* The footer's link-shaped button, the same shape as Help & shortcuts: no
     border, no fill, the footer's colour, the 44px box on both axes. */
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

  /* The panel takes its own row beneath the footer's line (Footer.svelte
     lays its children out as one wrapping row). */
  .panel {
    flex-basis: 100%;
    display: flex;
  }

  .panel:not(.open) {
    display: none;
  }
</style>
