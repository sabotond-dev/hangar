<!--
  Message slot A: how this panel arrived, said once. Props: kind (none, restored,
  older, unreadable - $lib/share/stamp decides which is true; `older` only where
  the format letter is known and its shape disagrees, never a partial restore,
  D-13), name. Handed none it renders nothing; otherwise it renders until the
  region removes it on the first knob change or Reset - the region knows a knob
  moved, this file does not. role="status", announced after hydration rather than
  from a container live at first render. Slot A's height is settled at landing, so
  there is no appearance transition. No --color-error-ink here: an unreadable link is not an alarm.
  Decided at 05-08 (D-13); see .planning/phases/05-tuning-budgets-and-shareable-links/05-08-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { STAMP_RESTORED, stampOlder, stampUnreadable } from "$lib/tune/copy";

  /** $lib/share/stamp's `Landing["kind"]`, declared here: that module reaches the vendored compiler and this one may not name it (D-18, config-shape.spec.ts). */
  type LandingKind = "none" | "restored" | "older" | "unreadable";

  let {
    kind,
    name,
  }: {
    /** Which of the three landings, or none. */
    kind: LandingKind;
    /** The configuration's name, which two of the three sentences carry. */
    name: string;
  } = $props();

  /** Undefined for `none`, and the component then renders nothing at all. */
  const line = $derived(
    kind === "restored"
      ? STAMP_RESTORED
      : kind === "older"
        ? stampOlder(name)
        : kind === "unreadable"
          ? stampUnreadable(name)
          : undefined,
  );
</script>

<div class="slot" data-testid="stamp-notice" role="status">
  {#if line}
    <p class="line">{line}</p>
  {/if}
</div>

<style>
  /* Always in the DOM so the status role is attached before anything is announced; no space until it has a sentence. */
  .slot:not(:empty) {
    margin-block-end: 16px;
  }

  /* Body role at full strength, with the 2px structural left rule. */
  .line {
    margin: 0;
    border-inline-start: 2px solid var(--color-boundary);
    padding-inline-start: 12px;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink);
  }
</style>
