// The MIDI monitor in Play (change 13C, BENCH-2026-09-16.txt section 13, suggestion 11): the
// Sandbox's short form of the Playground's monitor. The log is sim/monitor.ts's MonitorLog - the
// same coalescing and the same cap, over the preview engine's `midi` (LuaPadSim's host keeps it,
// `midiLogOf` finds it) - and this module only formats: one line per row, `CC 16 ch 1 → 64` or
// `Note on C4 ch 1 → 100`, the count after it when messages folded, and the newest twelve of
// them. Pure; the component samples and clears.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  describeChannel,
  describeMessage,
  describeValue,
  type MonitorRow,
} from "../sim/monitor";
import { noteName } from "../tune/view";

/** How many lines the list shows: the newest twelve. */
export const PLAY_MONITOR_ROWS = 12;

/** The message word: a note by its name (`Note on C4`), everything else as the Playground's monitor says it. */
export function messageWord(cmd: number, p1: number): string {
  const kind = cmd & 0xf0;
  if (kind === 0x90) return `Note on ${noteName(p1)}`;
  if (kind === 0x80) return `Note off ${noteName(p1)}`;
  return describeMessage(cmd, p1);
}

/** One line: the message, the one-based channel, the latest value, and `×N` when the row folded N messages. */
export function playMonitorLine(row: MonitorRow): string {
  const count = row.count > 1 ? ` ×${row.count}` : "";
  return `${messageWord(row.cmd, row.p1)} ch ${describeChannel(row.ch)} → ${describeValue(row.cmd, row.p1, row.p2)}${count}`;
}

/** The newest rows the list shows, from a newest-first list. */
export function newestRows(
  rows: readonly MonitorRow[],
  n: number = PLAY_MONITOR_ROWS,
): readonly MonitorRow[] {
  return rows.slice(0, n);
}
