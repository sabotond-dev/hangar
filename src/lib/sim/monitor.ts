// The MIDI monitor's arithmetic: the log the Lua host already keeps (`midiLog`, one HostMidi per
// midi_send, cleared on restart), read, stamped, coalesced and ring-capped (13-10; Bible section 10;
// D-14 Q4b). Nothing here is new data and the host is never edited. Three limits: the nine
// compiler-driven entries produce nothing (the vendored pad-sim.ts keeps no log), so `midiLogOf`
// returns undefined and the bar is ABSENT, not empty; messages with the same (channel, cmd, p1)
// inside COALESCE_WINDOW_MS fold into one row with an `xN` count (a still finger emits one message
// per 10 ms sample, Probe A Q1) and the ring holds MONITOR_CAP rows; `No MIDI output` is the truth -
// nothing here reaches a port. `midiLogOf` reads the engine structurally (a public `midi` getter
// first, else the host's through the field) as model.ts's `closeEngine` reads `close()`. Pure and
// clockless: `ingest` takes the moment as an argument; the component supplies performance.now.
// Decided at 13-10 (13-CONTEXT D-14 Q4b); see .planning/phases/13-gui-overhaul/13-10-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { HostMidi } from "./lua-host";

/**
 * Messages with the same (channel, cmd, p1) first seen within this many
 * milliseconds of each other fold into one row. A still finger's 100 Hz
 * stream is then ten rows a second per controller, not a hundred.
 */
export const COALESCE_WINDOW_MS = 100;

/** The most rows the monitor ever holds. Older rows leave as newer arrive. */
export const MONITOR_CAP = 200;

/** One visible row: one message, or a run of alike messages folded together. */
export type MonitorRow = {
  /** The moment the FIRST message of the run was seen, in the caller's clock. */
  readonly at: number;
  /** The wire's zero-based channel, exactly as the configuration sent it. */
  readonly ch: number;
  readonly cmd: number;
  readonly p1: number;
  /** The LATEST value of the run: a moving controller shows where it is now. */
  readonly p2: number;
  /** How many messages the row stands for. 1 for a lone message. */
  readonly count: number;
};

/** Where an engine keeps a MIDI log, if it keeps one at all. */
type MidiSource = { readonly midi?: readonly HostMidi[] };
type HostedSource = { readonly host?: MidiSource };

/**
 * The MIDI log an engine keeps, or undefined when it keeps none - never an empty array for a preset
 * engine: "absent" and "nothing sent yet" are two facts and the bar exists only for the second.
 */
export function midiLogOf(engine: unknown): readonly HostMidi[] | undefined {
  if (engine === null || typeof engine !== "object") return undefined;
  const direct = (engine as MidiSource).midi;
  if (Array.isArray(direct)) return direct;
  const hosted = (engine as HostedSource).host?.midi;
  if (Array.isArray(hosted)) return hosted;
  return undefined;
}

/**
 * The visible log. Rows are held OLDEST FIRST inside and handed out NEWEST
 * FIRST, which is how a console reads.
 */
export class MonitorLog {
  private rows: MonitorRow[] = [];
  /** How far into the source array the last `ingest` read. */
  private consumed = 0;

  /**
   * Read everything appended since the last call, stamp it `at`, fold repeats, drop the oldest past the
   * cap; true when the visible rows changed. A source SHORTER than the last read is a restarted host,
   * and the read position follows it back to the start.
   */
  ingest(source: readonly HostMidi[], at: number): boolean {
    if (source.length < this.consumed) this.consumed = 0;
    if (source.length === this.consumed) return false;
    let changed = false;
    for (let i = this.consumed; i < source.length; i++) {
      const entry = source[i];
      const folded = this.fold(entry, at);
      if (folded === undefined) {
        this.rows.push({
          at,
          ch: entry.ch,
          cmd: entry.cmd,
          p1: entry.p1,
          p2: entry.p2,
          count: 1,
        });
      } else {
        this.rows[folded] = {
          ...this.rows[folded],
          p2: entry.p2,
          count: this.rows[folded].count + 1,
        };
      }
      changed = true;
    }
    this.consumed = source.length;
    if (this.rows.length > MONITOR_CAP) {
      this.rows.splice(0, this.rows.length - MONITOR_CAP);
    }
    return changed;
  }

  /**
   * The index of the row this message folds into, or undefined for a new row. Walks back from the
   * newest while rows are inside the window, so alternating X and Y controllers each fold into their own row.
   */
  private fold(entry: HostMidi, at: number): number | undefined {
    for (let i = this.rows.length - 1; i >= 0; i--) {
      const row = this.rows[i];
      if (at - row.at > COALESCE_WINDOW_MS) return undefined;
      if (row.ch === entry.ch && row.cmd === entry.cmd && row.p1 === entry.p1)
        return i;
    }
    return undefined;
  }

  /** Newest first. A fresh array each call, so a rune can hold it raw. */
  get visible(): readonly MonitorRow[] {
    return this.rows.slice().reverse();
  }

  get size(): number {
    return this.rows.length;
  }

  /** Empty the VISIBLE log only: the host's array is the host's, and the read position stays. */
  clear(): void {
    this.rows = [];
  }

  /** Skip whatever the source holds now without showing it: called on open and on resume, as any console does. */
  skipTo(source: readonly HostMidi[]): void {
    this.consumed = source.length;
  }
}

/**
 * The message column in a DAW's words. The configurations send the status byte whole on channel 0
 * (176 is CC, 144 note on); the low nibble is folded away, so a `ch` of 3 with cmd 179 reads as CC.
 */
export function describeMessage(cmd: number, p1: number): string {
  const kind = cmd & 0xf0;
  switch (kind) {
    case 0xb0:
      return `CC ${p1}`;
    case 0x90:
      return `Note on ${p1}`;
    case 0x80:
      return `Note off ${p1}`;
    case 0xa0:
      return `Aftertouch ${p1}`;
    case 0xc0:
      return `Program ${p1}`;
    case 0xd0:
      return "Pressure";
    case 0xe0:
      return "Pitch bend";
    default:
      return `Command ${cmd}`;
  }
}

/**
 * The channel column, ONE-BASED as every DAW and the channel knob show it (CHANNEL_OPTIONS); a channel
 * outside the wire's range is shown as sent, so a configuration that computed one wrong is visible.
 */
export function describeChannel(ch: number): string {
  return ch >= 0 && ch <= 15 ? String(ch + 1) : String(ch);
}

/** The value column: the latest second data byte; pitch bend shows its 14-bit number whole. */
export function describeValue(cmd: number, p1: number, p2: number): string {
  return (cmd & 0xf0) === 0xe0 ? String(p1 + p2 * 128) : String(p2);
}

/** The time column, `m:ss.mmm` since the monitor opened; fixed width, so the column holds still. */
export function describeTime(elapsedMs: number): string {
  const ms = Math.max(0, Math.round(elapsedMs));
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const millis = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}
