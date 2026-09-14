<!--
  The connection control's dot: the session's shape channel, an 8px filled dot in
  every state so the control's width cannot move. Prop: shape - dark (no dot
  painted), detected (the quiet ink), connecting (full ink), connected (the action
  colour); DeviceSlot.svelte maps its nine states onto the four. Painted as a
  radial-gradient on a square box, never a border-radius (D-01, D-15's six circles
  are elsewhere). Decoration: aria-hidden in every state, the caption and label
  beside it carry the whole meaning. No hex literal, no SVG, no import at all.
  Decided at 13-11 (06-UI-SPEC Y-08); see .planning/phases/13-gui-overhaul/13-11-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  let {
    shape,
  }: {
    /** The session's four shapes by name; the slot maps its nine states onto them. */
    shape: "dark" | "detected" | "connecting" | "connected";
  } = $props();
</script>

<span
  class="mark"
  data-testid="device-mark"
  data-shape={shape}
  aria-hidden="true"
></span>

<style>
  /* 8px, whatever the shape. flex: none so the box cannot squeeze it. */
  .mark {
    display: inline-block;
    inline-size: 8px;
    block-size: 8px;
    flex: none;
    --dot: transparent;
    background-image: radial-gradient(
      circle at 50% 50%,
      var(--dot) 0 46%,
      transparent 52%
    );
  }

  .mark[data-shape="detected"] {
    --dot: var(--color-ink-quiet);
  }

  .mark[data-shape="connecting"] {
    --dot: var(--color-ink);
  }

  .mark[data-shape="connected"] {
    --dot: var(--color-action);
  }
</style>
