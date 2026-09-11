// The MIDI monitor's arithmetic: the log the Lua host already keeps, read,
// stamped, coalesced and ring-capped (plan 13-10, Bible section 10, PDF
// page 5's collapsed bar, 13-CONTEXT.md D-14 Q4b).
//
// NOTHING HERE IS NEW DATA. src/lib/sim/lua-host.ts keeps `midiLog`, one
// `HostMidi` per midi_send in the order the configuration issued it, appended
// by the bridged `__hangar_gms` and cleared on restart. The monitor is a
// RENDER of that array plus a clock: this module reads the array, stamps each
// new entry with the moment it was first seen, folds repeats together and
// keeps the last two hundred. The host is read and never edited.
//
// THREE HONEST LIMITS, AND THE FIRST WAS DECIDED BEFORE THIS PLAN.
//
//   1. THE NINE COMPILER-DRIVEN ENTRIES PRODUCE NOTHING. The vendored
//      src/vendor/botor/pad-sim.ts has no MIDI log at all - it paints lights
//      and records no send - so on a preset-backed entry there is no array to
//      read. D-14 Q4b chose the branch this module takes: the monitor appears
//      on Lua-driven entries only, and the bar is ABSENT on the others rather
//      than present and empty. The other branch - adding a log to pad-sim.ts -
//      would be a declared divergence from the vendored simulator for a v1
//      nicety, and this plan declines it by name. `midiLogOf` returns
//      undefined for such an engine, and the workspace renders no bar.
//
//   2. RATE. Probe A Q1 (12-01) measured a STILL finger emitting one message
//      every 10 ms sample. Section 10: "aggregate or limit high-rate messages
//      to keep the UI responsive." So messages with the same (channel, cmd,
//      p1) inside a COALESCE_WINDOW_MS window fold into one row carrying an
//      `xN` count and the latest value, and the visible log is a ring of at
//      most MONITOR_CAP rows - the oldest leave as the newest arrive.
//
//   3. `No MIDI output` IS THE TRUTH AND STAYS THE TRUTH. Phase 6 closed
//      section 19's Web MIDI row: HANGAR never uses Web MIDI for
//      configuration, so nothing in this log reaches a port. Direction is the
//      constant `out` and source is the constant `Browser preview`, the
//      PDF's own phrase.
//
// THE PROBE, AND WHY IT READS A FIELD THE TYPE CALLS PRIVATE. `LuaPadSim`
// (src/lib/sim/lua-pad-sim.ts) exposes `errors` beyond SimEngine and not the
// MIDI log; its `host` is a TypeScript-private field. The right seam is a
// `get midi()` beside `get errors()`, three lines in that file - and this plan
// could not write them: lua-pad-sim.ts and lua-host.ts are in Phase 12.1's
// concurrency band (13-VALIDATION) while 12.1-02 closes, so `midiLogOf` reads
// the engine STRUCTURALLY, the way model.ts's `closeEngine` reads `close()`:
// a public `midi` getter first, if one exists, else the host's own `midi`
// getter through the field. When lua-pad-sim.ts gains the getter the first
// branch answers and the second is dead. Named in 13-10-SUMMARY.md for the
// plan that owns that file next.
//
// PURE AND CLOCKLESS. `ingest` takes the moment as an argument, so the
// coalescing window and the ring cap are properties a test can drive with a
// scripted clock and no component, no timer and no browser. The component
// supplies performance.now and its own sampling cadence.
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
 * The MIDI log an engine keeps, or undefined when it keeps none.
 *
 * A LuaPadSim keeps one (through its host - see the header); a vendored PadSim
 * keeps none, and undefined is the signal the workspace renders no bar on.
 * Never an empty array for a preset engine: "absent" and "nothing sent yet"
 * are two different facts and the bar exists only for the second.
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
   * Read everything the source has appended since the last call, stamp it
   * `at`, fold repeats, and drop the oldest past the cap. Returns true when
   * the visible rows changed, so a caller can skip a render that would draw
   * the same thing.
   *
   * A source SHORTER than the last read is a restarted host (its log was
   * cleared); the read position follows it back to the start rather than
   * waiting for the array to grow past a length it will never reach again.
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
   * The index of the row this message folds into, or undefined for a new
   * row. Walks back from the newest while rows are still inside the window,
   * so a finger that alternates X and Y controllers folds each into its own
   * row rather than only ever matching the very last one.
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

  /**
   * Empty the VISIBLE log and nothing else. The host's array is not touched -
   * it is the host's - and the read position stays where it is, so what
   * arrives next is what shows next.
   */
  clear(): void {
    this.rows = [];
  }

  /**
   * Skip whatever the source holds right now without showing it. The
   * component calls this when it starts sampling - on open, and on resume
   * after a pause - so the monitor shows what happens from the moment it is
   * watching, the way any console does.
   */
  skipTo(source: readonly HostMidi[]): void {
    this.consumed = source.length;
  }
}

/**
 * The message column: the command byte's name and its first data byte, in
 * the words a DAW uses. The status byte's high nibble is the command and
 * the configurations send it as the whole byte on channel 0 (176 is CC,
 * 144 is note on); the low nibble is folded away so a `ch` of 3 with a cmd
 * of 179 reads as CC on channel 4, not as an unknown command.
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
 * The channel column, ONE-BASED: the wire carries 0..15 and every DAW shows
 * 1..16, and the knob that sets it shows the DAW's number too
 * (knobs.preset.ts, CHANNEL_OPTIONS). A channel outside the wire's range is
 * shown as sent, so a configuration that computed one wrong is visible.
 */
export function describeChannel(ch: number): string {
  return ch >= 0 && ch <= 15 ? String(ch + 1) : String(ch);
}

/**
 * The value column: the latest second data byte. Pitch bend spends both
 * bytes on one 14-bit number and shows it whole, so a bend that moved reads
 * as one number that moved.
 */
export function describeValue(cmd: number, p1: number, p2: number): string {
  return (cmd & 0xf0) === 0xe0 ? String(p1 + p2 * 128) : String(p2);
}

/**
 * The time column: seconds and milliseconds since the monitor opened, in the
 * form `m:ss.mmm`. Fixed width by construction, so the column holds still.
 */
export function describeTime(elapsedMs: number): string {
  const ms = Math.max(0, Math.round(elapsedMs));
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const millis = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}
