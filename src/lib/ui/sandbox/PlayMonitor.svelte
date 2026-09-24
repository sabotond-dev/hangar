<!--
  The MIDI monitor in Play (change 13C, suggestion 11): the newest twelve messages the preview
  engine sent, one line each, newest first, under the plate while Play is on - a RENDER of the
  log lua-host.ts keeps, through sim/monitor.ts's MonitorLog (the same coalescing and cap as the
  Playground's monitor) and play-monitor.ts's line. Props: source (the engine's log, read fresh
  on every sample - the engine arrives after Play begins) and now (the clock). A
  self-rescheduling timeout while mounted; one Clear box. Mounted in Play only. Square (D-01).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import {
    PLAY_MONITOR,
    PLAY_MONITOR_CLEAR,
    PLAY_MONITOR_EMPTY,
    PLAY_MONITOR_HELPER,
  } from "$lib/sandbox/copy";
  import { newestRows, playMonitorLine } from "$lib/sandbox/play-monitor";
  import type { HostMidi } from "$lib/sim/lua-host";
  import {
    COALESCE_WINDOW_MS,
    MonitorLog,
    type MonitorRow,
  } from "$lib/sim/monitor";

  let {
    source,
    now = () => performance.now(),
    title = PLAY_MONITOR,
    helper = PLAY_MONITOR_HELPER,
    empty = PLAY_MONITOR_EMPTY,
  }: {
    /** The engine's MIDI log, or undefined until the engine arrives. */
    source: () => readonly HostMidi[] | undefined;
    now?: () => number;
    /** The heading: the preview's monitor, or the ZONA's while the plate mirrors it (change 20). */
    title?: string;
    /** The line under it, the same two readers. */
    helper?: string;
    /** The empty log's line, the same two readers. */
    empty?: string;
  } = $props();

  const uid = $props.id();
  const titleId = `${uid}-title`;

  /** Newest first, replaced whole on change. */
  let rows: readonly MonitorRow[] = $state.raw([]);

  const log = new MonitorLog();
  let openedAt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function sample(): void {
    timer = undefined;
    const current = source();
    if (current !== undefined && log.ingest(current, now() - openedAt)) {
      rows = newestRows(log.visible);
    }
    timer = setTimeout(sample, COALESCE_WINDOW_MS);
  }

  function clear(): void {
    log.clear();
    rows = [];
  }

  onMount(() => {
    openedAt = now();
    timer = setTimeout(sample, COALESCE_WINDOW_MS);
  });

  onDestroy(() => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  });
</script>

<section class="monitor" data-testid="play-monitor" aria-labelledby={titleId}>
  <div class="head">
    <h3 class="title type-micro" id={titleId}>{title}</h3>
    <button
      class="outlined"
      type="button"
      data-testid="play-monitor-clear"
      disabled={rows.length === 0}
      onclick={clear}>{PLAY_MONITOR_CLEAR}</button
    >
  </div>
  <p class="helper type-helper">{helper}</p>
  {#if rows.length === 0}
    <p class="helper empty type-helper" data-testid="play-monitor-empty">
      {empty}
    </p>
  {:else}
    <ol class="lines" data-testid="play-monitor-lines">
      {#each rows as row (`${row.at}:${row.ch}:${row.cmd}:${row.p1}`)}
        <li class="line" data-testid="play-monitor-line">
          {playMonitorLine(row)}
        </li>
      {/each}
    </ol>
  {/if}
</section>

<style>
  /* Under the plate at the plate's width: the panel token under a divider hairline (decorative - it bounds no control). */
  .monitor {
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: 571px;
    padding: 12px 16px 16px;
    border: 1px solid var(--color-divider);
    background: var(--color-panel);
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .title {
    margin: 0;
    color: var(--color-ink-quiet);
  }

  .outlined {
    flex: none;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 12px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 13px;
    color: var(--color-ink);
    cursor: pointer;
  }

  .outlined:hover:not(:disabled) {
    border-color: var(--color-action);
  }

  .outlined:disabled {
    color: var(--color-ink-quiet);
    cursor: default;
  }

  .helper {
    margin: 8px 0 0;
    color: var(--color-ink-quiet);
  }

  /* The lines: the mono face, tabular, newest at the top; twelve at most so the list never grows the page. */
  .lines {
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
    font-family: var(--font-mono);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    line-height: 1.6;
    color: var(--color-ink);
  }

  .line {
    border-block-end: 1px solid var(--color-divider);
  }
</style>
