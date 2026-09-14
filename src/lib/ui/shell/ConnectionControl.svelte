<!--
  The header's connection control: DeviceSlot.svelte's host at the end of the zone
  Header.svelte reserves, mounted once by the layout on every shell page and both
  header variants - Connect ZONA and ZONA connected are ONE control in two of its
  nine states. No props, no state of its own. The rule is DeviceSlot's: a plain
  button whenever a click connects, and a summary whenever it does not (S0a, S0b,
  S4, S5); S3 is disabled and busy. slotStateOf(session.phase) is read here for
  the box's data attributes only, and data-capability reads the phase the session
  set from capabilityOf() once at start() - no component reads the browser. On a
  browser that cannot install the control is PRESENT, a summary opening CONN-02's reason (DEGR-02).
  Decided at 13-11 (Bible section 15); see .planning/phases/13-gui-overhaul/13-11-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { session } from "$lib/device/session.svelte";
  import { type Capability, slotStateOf } from "$lib/device/session-copy";
  import DeviceSlot from "../DeviceSlot.svelte";

  /** The nine-state table, read for the box's attribute; DeviceSlot reads it for everything else. */
  const slot = $derived(slotStateOf(session.phase));

  /** capabilityOf()'s answer, as the phase the session set from it at start(): the two terminal phases are the two non-ok answers. */
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
  /* Sized by the control inside it, which draws the border; it claims no width of its own, or the Clear box 12px to its left would be pushed over the nav (13.1-05). */
  .connection-control {
    display: flex;
    justify-content: flex-end;
  }
</style>
