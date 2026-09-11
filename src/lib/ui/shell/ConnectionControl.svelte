<!--
  THE HEADER'S CONNECTION CONTROL (plan 13-11; PDF page 1 `Connect ZONA`,
  pages 2-5 `ZONA connected`; Bible section 15 "Connection control: Ready,
  unavailable, denied, interrupted"; CONN-01, CONN-02, CONN-08, DEGR-02).

  It fills the slot Header.svelte reserved at 13-05 (CONNECTION_SLOT, 218 x
  37) on every shell page, in both header variants: the intro's `Connect
  ZONA` and the app pages' `ZONA connected` are ONE control in two of its
  nine states, not two controls, so the header's `variant` prop does not
  reach it. The layout mounts it once, from the shell, so no route hands a
  control into the header any more and two plans cannot build one control.

  THE BUTTON-VERSUS-SUMMARY RULE, CARRIED ACROSS FROM DeviceSlot.svelte
  VERBATIM IN SPIRIT. The control is a plain BUTTON whenever a click does
  something - S1, S2, S6 and S7 all connect - and a SUMMARY (a button that
  carries aria-expanded and toggles the disclosure) whenever it does not -
  S0a, S0b, S4, S5. S3 is disabled and busy. A control that both acts and
  expands announces a lie in one of its two jobs, so the two are never the
  same element in the same state. The rule is written in DeviceSlot.svelte,
  which is the machine; this component is its host and adds no state of its
  own. slotStateOf(session.phase) is read here for the box's data attributes
  only, and the two predicates it exposes are the session's, not this file's:
  session-copy's slotStateOf maps the seventeen phases onto nine slot states
  and no tenth, and capabilityOf({ hasSerial, secure }) answered `ok`,
  `unsupported` or `insecure` ONCE, synchronously, inside session.start() -
  the phase carries its answer as `unsupported` or `insecure`, and that is
  what `data-capability` reads. Calling capabilityOf again from a component
  would mean reading the browser from a component, which no device component
  does (session-copy.ts: "a capability test over an explicit environment
  record, never a browser test").

  DEGR-02 AND CONN-02 ON THIS CONTROL. On a browser that cannot install the
  control is PRESENT, never hidden: a summary whose caption is CONN-02's own
  line for that browser (CAPTION_UNSUPPORTED or CAPTION_INSECURE, two
  different lines), whose label offers no connect, and whose one click opens
  the reason in full - the unsupported branch naming Chrome, Edge and desktop
  Firefox 151+ and never an engine, the insecure branch naming HTTPS. It is
  not `disabled`, and that is deliberate: the reason is behind it, and a
  disabled summary could not open it. The controls DEGR-02 disables with the
  reason inline are the INSTALL controls, in the workspace's column, and
  device-ui.spec.ts test 10 and e2e/first-experience.e2e.ts hold them to it.

  NO STRING IS THIS FILE'S. The words are session-copy's, rendered by
  DeviceSlot; 13-18 rewrites them into the PDF's `Connect ZONA` and `ZONA
  connected`. Every number is layout.ts's through Header.svelte's box.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { session } from "$lib/device/session.svelte";
  import { type Capability, slotStateOf } from "$lib/device/session-copy";
  import DeviceSlot from "../DeviceSlot.svelte";

  /** The nine-state table, read for the box's attribute; DeviceSlot reads it for everything else. */
  const slot = $derived(slotStateOf(session.phase));

  /**
   * capabilityOf()'s answer, as the phase the session set from it at start():
   * the two terminal phases are the two non-ok answers, and every other phase
   * is a browser that can connect.
   */
  const capability: Capability = $derived(
    session.phase === "unsupported" || session.phase === "insecure"
      ? session.phase
      : "ok",
  );
</script>

<div
  class="connection-control"
  data-testid="connection-control"
  data-slot={slot}
  data-capability={capability}
>
  <DeviceSlot />
</div>

<style>
  /* The host fills the reserved box; the control inside it draws the border. */
  .connection-control {
    display: flex;
    justify-content: flex-end;
    min-inline-size: 100%;
  }
</style>
