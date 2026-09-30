<!--
  The Store section's drawing (change 26): the header's controls as they sit with a ZONA
  connected on a card or in the Sandbox - Clear and the connection control on the row, Target
  and Store on ZONA on the line beneath, right-aligned. A picture of the controls, not the
  controls: spans in their boxes, nothing focusable, one name for the whole (role img). Every
  word is the controls' own (install-copy.ts, session-copy.ts, page-target.ts), the dot is
  DeviceMark.svelte's connected shape; square corners, token colours only.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { CLEAR_LABEL, KEEP_LABEL } from "$lib/device/install-copy";
  import { TARGET_LABEL, pageName } from "$lib/device/page-target";
  import { CONNECTED_LABEL } from "$lib/device/session-copy";
  import { FIGURE_NAMES, FIGURE_ON_ZONA } from "$lib/guide/copy";
  import DeviceMark from "../DeviceMark.svelte";
</script>

<!-- The header's rule on a frame of its own: the picture inside carries the role. -->
<div class="frame">
  <div
    class="drawing"
    role="img"
    aria-label={FIGURE_NAMES.store}
    data-testid="figure-store"
  >
    <div class="line">
      <span class="box strong">{CLEAR_LABEL}</span>
      <span class="box">
        <DeviceMark shape="connected" />
        <span class="strong">{CONNECTED_LABEL}</span>
      </span>
    </div>
    <div class="line">
      <span class="quiet">{TARGET_LABEL}</span>
      <span class="box choice"
        >{pageName(0)}{FIGURE_ON_ZONA}
        <svg class="chevron" viewBox="0 0 20 20" aria-hidden="true">
          <polyline points="6,8 10,12 14,8" />
        </svg>
      </span>
      <span class="box">{KEEP_LABEL}</span>
    </div>
  </div>
</div>

<style>
  /* The workspace ground with the header's rule beneath. */
  .frame {
    box-sizing: border-box;
    max-inline-size: 440px;
    border-block-end: 1px solid var(--color-divider);
    background: var(--color-workspace);
  }

  /* The two rows, right-aligned as the header sets them. */
  .drawing {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
    box-sizing: border-box;
    padding: 16px 20px;
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.2;
    color: var(--color-ink);
  }

  .line {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
  }

  /* A control's box: the boundary token, 44px tall, no fill, no corner. */
  .box {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    box-sizing: border-box;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    white-space: nowrap;
  }

  .strong {
    font-weight: 600;
  }

  .quiet {
    color: var(--color-ink-quiet);
  }

  /* The Target select: the page and its mark, a chevron at the right. */
  .choice {
    gap: 8px;
    padding-inline: 8px;
    font-variant-numeric: tabular-nums;
  }

  .chevron {
    inline-size: 16px;
    block-size: 16px;
    fill: none;
    stroke: var(--color-ink-quiet);
    stroke-width: 1.5;
  }
</style>
