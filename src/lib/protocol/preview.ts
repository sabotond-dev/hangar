// What a connected ZONA reports about itself while HANGAR mirrors it (change 20, docs/MIRROR.md):
// the LEDPREVIEW records - every changed LED's final colour, by hardware index - and a MIDI message
// the module sent. Read off one decoded class; imports nothing, so the mirror reaches it without the
// protocol package, the way usb.ts is reached. Two readings, both firmware's:
// grid_led.c:497-537 writes a record as NUM, RED, GRE, BLU, two hex characters each, after the
// class's four-character LENGTH; grid_lua_api.c:867-903 builds a sent MIDI message as an EXECUTE,
// and grid_usb_midi.c:141-175 marks one RECEIVED from the computer as a REPORT from the global
// position - so a sent message is told apart on the wire, never guessed.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { DecodedClass } from "./decode";

/** One LED's final colour: its HARDWARE index along the strip, and the frame buffer's RGB. */
export interface LedRecord {
  readonly num: number;
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** One MIDI message as the module's `midi_send` put it on the wire. */
export interface SentMidi {
  readonly ch: number;
  readonly cmd: number;
  readonly p1: number;
  readonly p2: number;
}

/** A ZONA's lights: 81, hardware indices 0 to 80 (grid_module.c:455-458). */
export const ZONA_LED_COUNT = 81;

/** Characters per record: NUM, RED, GRE, BLU, two hex each (grid_led.c:512-515). */
export const LED_RECORD_CHARS = 8;

/**
 * Where the record run starts in a class block: three characters of class code, one of
 * instruction, four of LENGTH (grid_protocol.h:1034-1040) - the index grid-editor reads from
 * (message-stream.store.ts:167, `descr.raw[8 + i * 8]`).
 */
export const LED_RECORDS_AT = 8;

/** Two ASCII hex characters as a number, or NaN when either is not a hex digit. */
function hexPair(raw: readonly number[], at: number): number {
  const text = String.fromCharCode(raw[at], raw[at + 1]);
  return /^[0-9a-fA-F]{2}$/.test(text) ? Number.parseInt(text, 16) : Number.NaN;
}

/**
 * Every LED record one LEDPREVIEW class carries, REPORT or EXECUTE, or undefined when the class is
 * not one or carries no raw block. The count is LENGTH / 8, bounded by the bytes actually present:
 * a LENGTH that claims more than the block holds yields only the whole records that are there. A
 * record whose index is past the ZONA's 81 or whose characters are not hex is dropped, never
 * painted.
 */
export function ledPreviewRecords(cls: DecodedClass): LedRecord[] | undefined {
  if (cls.class_name !== "LEDPREVIEW") return undefined;
  const raw = cls.raw;
  if (raw === undefined) return undefined;
  const declared = Number(cls.class_parameters.LENGTH);
  if (!Number.isFinite(declared) || declared < 0) return [];
  const present = Math.max(0, raw.length - LED_RECORDS_AT);
  const count = Math.floor(Math.min(declared, present) / LED_RECORD_CHARS);
  const out: LedRecord[] = [];
  for (let i = 0; i < count; i++) {
    const at = LED_RECORDS_AT + i * LED_RECORD_CHARS;
    const num = hexPair(raw, at);
    const r = hexPair(raw, at + 2);
    const g = hexPair(raw, at + 4);
    const b = hexPair(raw, at + 6);
    if ([num, r, g, b].some(Number.isNaN)) continue;
    if (num >= ZONA_LED_COUNT) continue;
    out.push({ num, r, g, b });
  }
  return out;
}

/**
 * A MIDI message the module SENT - class MIDI, instruction EXECUTE - or undefined for anything else,
 * a message it received from the computer (a REPORT) included. The four fields are the package's
 * own decode of CHANNEL, COMMAND, PARAM1 and PARAM2.
 */
export function sentMidi(cls: DecodedClass): SentMidi | undefined {
  if (cls.class_name !== "MIDI" || cls.class_instr !== "EXECUTE") {
    return undefined;
  }
  const p = cls.class_parameters;
  const fields = [p.CHANNEL, p.COMMAND, p.PARAM1, p.PARAM2].map(Number);
  if (fields.some((n) => !Number.isInteger(n))) return undefined;
  const [ch, cmd, p1, p2] = fields;
  return { ch, cmd, p1, p2 };
}
