<!--
  The MIDI monitor: PDF page 5's collapsed bar under the surface, expanded into
  section 10's six-column log - a RENDER of the midiLog lua-host.ts already keeps
  (monitor.ts is the arithmetic; the host is read and never edited). Props: source
  (the log, read fresh on every sample) and now (the clock). No live region, no
  interval, no frame loop of its own: a self-rescheduling timeout while the log shows.
  Absent on the preset-backed entries, not present and empty: the vendored
  pad-sim.ts records no send, and D-14 Q4b chose Lua entries only for v1 over
  adding a log to src/vendor/. Mounted inside {#if listed.preview === "lua"} only.
  Decided at 13-10 (D-14 Q4b); see .planning/phases/13-gui-overhaul/13-10-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy } from "svelte";
  import type { HostMidi } from "$lib/sim/lua-host";
  import {
    COALESCE_WINDOW_MS,
    MonitorLog,
    describeChannel,
    describeMessage,
    describeTime,
    describeValue,
    type MonitorRow,
  } from "$lib/sim/monitor";
  import {
    MIDI_MONITOR,
    MONITOR_CLEAR,
    MONITOR_COLUMNS,
    MONITOR_DIRECTION,
    MONITOR_EMPTY,
    MONITOR_PAUSE,
    MONITOR_PAUSED,
    MONITOR_RESUME,
    MONITOR_SOURCE,
    MONITOR_STATUS,
    monitorCount,
  } from "$lib/tune/inspector-copy";

  let {
    source,
    now = () => performance.now(),
    sourceLabel = MONITOR_SOURCE,
    status = MONITOR_STATUS,
    empty = MONITOR_EMPTY,
  }: {
    /** The engine's MIDI log, read fresh on every sample: the workspace swaps engines under the same id on every knob turn. */
    source: () => readonly HostMidi[] | undefined;
    /** The clock. A prop so a harness can script it. */
    now?: () => number;
    /** The Source column's word: the preview's, or the ZONA's while the plate mirrors it (change 20). */
    sourceLabel?: string;
    /** The bar's status, the same two readers. */
    status?: string;
    /** The empty log's line, the same two readers. */
    empty?: string;
  } = $props();

  /** The sampling cadence IS the coalescing window: nothing finer would show. */
  const SAMPLE_MS = COALESCE_WINDOW_MS;

  const titleId = "midi-monitor-title";
  const panelId = "midi-monitor-panel";

  let open = $state(false);
  let paused = $state(false);
  /** Newest first. Replaced whole on change, never mutated, so raw is right. */
  let rows: readonly MonitorRow[] = $state.raw([]);

  // Plain locals outside the reactive graph: a log, a clock origin and a timer handle.
  const log = new MonitorLog();
  let openedAt: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function stop(): void {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }

  function sample(): void {
    timer = undefined;
    const current = source();
    if (current !== undefined && openedAt !== undefined) {
      if (log.ingest(current, now() - openedAt)) rows = log.visible;
    }
    timer = setTimeout(sample, SAMPLE_MS);
  }

  /** Watch from this moment on: skip the array's past, then sample. */
  function start(): void {
    stop();
    const current = source();
    if (current !== undefined) log.skipTo(current);
    if (openedAt === undefined) openedAt = now();
    timer = setTimeout(sample, SAMPLE_MS);
  }

  function toggle(): void {
    open = !open;
    if (open && !paused) start();
    else stop();
  }

  function togglePause(): void {
    paused = !paused;
    if (paused) stop();
    else start();
  }

  function clear(): void {
    log.clear();
    rows = [];
  }

  onDestroy(stop);
</script>

<section class="monitor" data-testid="midi-monitor" aria-labelledby={titleId}>
  <button
    class="bar"
    type="button"
    data-testid="monitor-toggle"
    aria-expanded={open}
    aria-controls={panelId}
    onclick={toggle}
  >
    <span class="chevron" aria-hidden="true">{open ? "˄" : "˅"}</span>
    <span class="title" id={titleId}>{MIDI_MONITOR}</span>
    <span class="status">{status}</span>
    <span class="chevron" aria-hidden="true">{open ? "˄" : "˅"}</span>
  </button>

  {#if open}
    <div class="panel" id={panelId} data-testid="monitor-panel">
      <div class="controls">
        <button
          class="control"
          type="button"
          data-testid="monitor-pause"
          onclick={togglePause}
        >
          {paused ? MONITOR_RESUME : MONITOR_PAUSE}
        </button>
        <button
          class="control"
          type="button"
          data-testid="monitor-clear"
          disabled={rows.length === 0}
          onclick={clear}
        >
          {MONITOR_CLEAR}
        </button>
      </div>

      {#if paused}
        <p class="note type-helper" data-testid="monitor-paused">
          {MONITOR_PAUSED}
        </p>
      {/if}

      {#if rows.length === 0}
        <p class="note type-helper" data-testid="monitor-empty">
          {empty}
        </p>
      {:else}
        <div class="scroll">
          <table class="log" data-testid="monitor-log">
            <thead>
              <tr>
                {#each MONITOR_COLUMNS as head (head)}
                  <th scope="col">{head}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each rows as row (`${row.at}:${row.ch}:${row.cmd}:${row.p1}`)}
                <tr>
                  <td class="numerals">{describeTime(row.at)}</td>
                  <td>{MONITOR_DIRECTION}</td>
                  <td>{sourceLabel}</td>
                  <td class="numerals">{describeChannel(row.ch)}</td>
                  <td>{describeMessage(row.cmd, row.p1)}</td>
                  <td class="numerals">
                    {describeValue(row.cmd, row.p1, row.p2)}
                    {#if row.count > 1}
                      <span class="count" data-testid="monitor-count"
                        >{monitorCount(row.count)}</span
                      >
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</section>

<style>
  /* The surface's own width, centred like everything under it. Square (D-01). */
  .monitor {
    inline-size: min(100%, var(--surface-max));
    margin-inline: auto;
    border: 1px solid var(--color-divider);
    background: var(--color-panel);
  }

  /* The whole bar is the toggle (page 5: a chevron at each end, the status at the right); 44px tall, no fill. */
  .bar {
    appearance: none;
    display: flex;
    align-items: center;
    gap: 12px;
    inline-size: 100%;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.2;
    color: var(--color-ink-quiet);
    text-align: start;
    cursor: pointer;
    transition: color 140ms ease-out;
  }

  .bar:hover {
    color: var(--color-ink);
  }

  .title {
    font-weight: 500;
    color: var(--color-ink);
  }

  .status {
    margin-inline-start: auto;
    text-align: end;
  }

  .chevron {
    font-size: 12px;
  }

  .panel {
    border-block-start: 1px solid var(--color-divider);
    padding: 12px 16px 16px;
  }

  /* Pause and Clear: section 10.3's Secondary treatment at 44px, square. */
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-block-end: 12px;
  }

  .control {
    appearance: none;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    background: transparent;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    line-height: 1.2;
    color: var(--color-ink);
    cursor: pointer;
    transition: border-color 140ms ease-out;
  }

  .control:hover:not(:disabled) {
    border-color: var(--color-action);
  }

  .control:disabled {
    color: var(--color-ink-quiet);
    cursor: not-allowed;
  }

  .note {
    margin: 0 0 8px;
    color: var(--color-ink-quiet);
  }

  /* A window over the ring, scrolling on the block axis only (D-11): fixed-layout table, every cell wraps. */
  .scroll {
    max-block-size: 320px;
    overflow-y: auto;
  }

  .log {
    inline-size: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    font-family: var(--font-sans);
    font-size: 12px;
    line-height: 1.4;
    color: var(--color-ink);
  }

  .log th,
  .log td {
    padding: 4px 8px 4px 0;
    text-align: start;
    vertical-align: top;
    overflow-wrap: anywhere;
    border-block-end: 1px solid var(--color-divider);
  }

  .log th {
    font-weight: 600;
    color: var(--color-ink-quiet);
  }

  .count {
    margin-inline-start: 4px;
    color: var(--color-ink-quiet);
  }

  @media (prefers-reduced-motion: reduce) {
    .bar,
    .control {
      transition: none;
    }
  }
</style>
