<!--
  The MIDI monitor: PDF page 5's collapsed bar under the surface, expanded
  into section 10's six-column log (plan 13-10, Bible section 10 and 14,
  13-CONTEXT.md D-14 Q4b).

      [ ˅ MIDI monitor ]              Browser preview · No MIDI output  ˅

  Collapsed by default, one bar at the bottom of the centre column. Expanded:
  Pause and Clear, then the log - timestamp, direction, source, channel,
  message, value - newest first. It is a RENDER of the log the Lua host
  already keeps (src/lib/sim/lua-host.ts's `midiLog`, appended by the bridged
  `__hangar_gms`) plus a clock; the arithmetic is src/lib/sim/monitor.ts and
  this file paints it. The host is read and never edited.

  THREE HONEST LIMITS. monitor.ts's header carries them in full; in brief:

    1. THE BAR IS ABSENT ON THE NINE PRESET-BACKED ENTRIES, NOT PRESENT AND
       EMPTY. The vendored pad-sim.ts records no send, so there is nothing to
       render there. D-14 Q4b chose Lua entries only for v1 over adding a log
       to src/vendor/ - a declared divergence for a nicety - and this plan
       declines that divergence by name. The workspace mounts this component
       inside `{#if listed.preview === "lua"}` and nowhere else, which is why
       there is no empty state for "this engine has no log" in this file.
    2. RATE. A still finger sends every 10 ms. Alike messages inside
       COALESCE_WINDOW_MS fold into one row with an `xN` count and the latest
       value; the log is a ring of MONITOR_CAP rows.
    3. `No MIDI output` IS TRUE. Nothing here reaches a port (Phase 6 closed
       section 19's Web MIDI row). Direction is `out`, source is the PDF's
       `Browser preview`, and the bar says so at rest, verbatim.

  NOT A LIVE REGION, BY SECTION 14: "do not announce every MIDI event or
  animation frame." There is no aria-live anywhere in this file. The toggle
  is a real button with aria-expanded and aria-controls; the log is a real
  table with column heads; a screen reader reads it when asked and is never
  interrupted by it.

  THE SAMPLER IS A SELF-RESCHEDULING setTimeout AND RUNS ONLY WHILE THE LOG
  IS SHOWING. The host pushes nothing - its log is an array - so the monitor
  polls it, at the coalescing window's own cadence, only while the panel is
  open and not paused. Collapsed or paused it costs nothing. Never
  setInterval (Phase 4's rule, site-wide), and never a second animation-frame
  loop: SimHost owns the page's one rAF and this component does not tick,
  paint or touch an engine. It therefore cannot fight 13-04's motion control:
  a still surface that still answers a finger still sends, and the rows that
  arrive are the log's, not an animation of this component's.

  PAUSE FREEZES THE VIEW. What the surface sends while paused is not shown,
  and Resume picks up from the moment it is pressed rather than replaying
  the gap - the paused line says exactly that. Clear empties the visible
  rows and nothing else: the host's array is the host's.

  The strings: `MIDI monitor` and `Browser preview · No MIDI output` are the
  PDF's, verbatim. The six heads, `out`, `Pause` / `Resume` / `Clear`, the
  count form and the two lines are HANGAR's and are ledgered in 13-COPY-NEW.md.

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
  }: {
    /**
     * The engine's MIDI log, read fresh on every sample - a function, not
     * an array, because the workspace swaps engines under the same id on
     * every knob turn and the monitor has to follow the live one.
     */
    source: () => readonly HostMidi[] | undefined;
    /** The clock. A prop so a harness can script it. */
    now?: () => number;
  } = $props();

  /** The sampling cadence IS the coalescing window: nothing finer would show. */
  const SAMPLE_MS = COALESCE_WINDOW_MS;

  const titleId = "midi-monitor-title";
  const panelId = "midi-monitor-panel";

  let open = $state(false);
  let paused = $state(false);
  /** Newest first. Replaced whole on change, never mutated, so raw is right. */
  let rows: readonly MonitorRow[] = $state.raw([]);

  // Plain locals, outside the reactive graph: a log, a clock origin and a
  // timer handle are not things to render.
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
    <span class="status">{MONITOR_STATUS}</span>
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
          {MONITOR_EMPTY}
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
                  <td>{MONITOR_SOURCE}</td>
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

  /*
    The whole bar is the toggle: PDF page 5 draws a chevron at each end and
    the status at the right. 44px tall, no fill, the boundary lights on hover
    like every outlined control on the site.
  */
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

  /*
    The ring is two hundred rows; the panel shows a window of them and
    scrolls on the BLOCK axis only. Never the inline axis (D-11): the table is
    fixed-layout at the panel's width and every cell wraps.
  */
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
