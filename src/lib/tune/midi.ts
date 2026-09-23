// The playground's MIDI outputs (change 17, BENCH-2026-09-16.txt section 17; docs/MIDI.md): an
// entry declares each output it sends - a name, continuous or trigger, and the knobs its Type,
// Channel, Number and Receive are - and the tuning panel draws one block per output under MIDI.
// The knobs stay ordinary token knobs (the stamp encodes their indices, the budget sweep measures
// their rungs); this module holds the ladders every card declares them with, resolves an entry's
// outputs to its knobs, and says what is wrong with a declaration (catalog.spec.ts runs it).
// Pure: a type-only import, no compiler, no protocol package.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { CatalogEntry, LuaKnob, MidiOutput } from "../catalog/types";

/** The status bytes a Type knob's literals are (the channel is the Channel knob's). */
export const MIDI_STATUS = {
  note: "144",
  cc: "176",
  program: "192",
  pressure: "208",
  pitchbend: "224",
} as const;

/** A continuous output's types (answer 2, "common only"): a controller, a pitch bend, a channel pressure. */
export const CONTINUOUS_STATUSES: readonly string[] = [
  MIDI_STATUS.cc,
  MIDI_STATUS.pitchbend,
  MIDI_STATUS.pressure,
];

/** A trigger's types: a note or a controller - and a program change where the trigger has no off (the output declares `once`). */
export const TRIGGER_STATUSES: readonly string[] = [
  MIDI_STATUS.note,
  MIDI_STATUS.cc,
];
export const ONCE_STATUSES: readonly string[] = [
  ...TRIGGER_STATUSES,
  MIDI_STATUS.program,
];

/** The Type knob's literals for an output, in the order the panel offers them. */
export const typeValues = (output: MidiOutput): readonly string[] =>
  output.kind === "continuous"
    ? CONTINUOUS_STATUSES
    : output.once === true
      ? ONCE_STATUSES
      : TRIGGER_STATUSES;

/** The Channel knob's literals: all sixteen, the firmware's 0-based channel (X-08). */
export const CHANNEL_VALUES: readonly string[] = Array.from(
  { length: 16 },
  (_, i) => String(i),
);

/**
 * The Number knob's literals: 0..127. A card whose number knob had fewer rungs keeps its old
 * rungs FIRST, in their old order, then the rest ascending, so a saved copy's index lands on the
 * value it had (a copy reopens by index; the stamp's shape still moves, and an older link lands
 * unreadable). The stepper walks them in value order whatever the declared order.
 */
export function numberValues(kept: readonly string[] = []): readonly string[] {
  const rest = Array.from({ length: 128 }, (_, i) => String(i)).filter(
    (v) => !kept.includes(v),
  );
  return [...kept, ...rest];
}

/**
 * The Receive knob's literals: the header INSTR the card's `midirx_cb` answers - 0 (no message
 * carries it: Off) and 13 (the host's REPORT: On) - so turning Receive costs no Lua.
 */
export const RECEIVE_VALUES: readonly string[] = ["0", "13"];
/** Receive is on by default (section 17's reading). */
export const RECEIVE_ON_INDEX = 1;

/** What a knob is inside an output's block. */
export type OutputRole = "type" | "channel" | "number" | "receive";

/** The block's rows in the order the panel draws them. */
export const OUTPUT_ROLES: readonly OutputRole[] = [
  "type",
  "channel",
  "number",
  "receive",
];

/** An output's knob by its token reference: a Lua entry's `@TOKEN`, or a knob id (a compiler card's knobs have no token). */
function knobOf(
  entry: CatalogEntry,
  ref: string | undefined,
): LuaKnob | undefined {
  if (ref === undefined) return undefined;
  return entry.knobs.find((k) => k.token === ref || k.id === ref);
}

/** One output resolved to its knobs' ids by role. */
export type ResolvedOutput = {
  readonly id: string;
  readonly name: string;
  readonly kind: MidiOutput["kind"];
  readonly knobs: Readonly<Partial<Record<OutputRole, string>>>;
};

/** Every declared output with its knobs' ids; a reference that names no knob is left out (outputProblems says so). */
export function resolveOutputs(entry: CatalogEntry): readonly ResolvedOutput[] {
  return (entry.outputs ?? []).map((output) => {
    const knobs: Partial<Record<OutputRole, string>> = {};
    for (const role of OUTPUT_ROLES) {
      const knob = knobOf(entry, output.tokens[role]);
      if (knob !== undefined) knobs[role] = knob.id;
    }
    return { id: output.id, name: output.name, kind: output.kind, knobs };
  });
}

/** Knob id -> its role, for every knob an output names. */
export function roleOfKnob(
  entry: CatalogEntry,
): ReadonlyMap<string, OutputRole> {
  const out = new Map<string, OutputRole>();
  for (const output of resolveOutputs(entry)) {
    for (const role of OUTPUT_ROLES) {
      const id = output.knobs[role];
      if (id !== undefined) out.set(id, role);
    }
  }
  return out;
}

const sameList = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * What is wrong with an entry's outputs, one line each; empty when the declaration holds: unique
 * ids, a Type and a Channel on every output, every reference naming a knob, no knob in two
 * roles, the Type knob's literals the output's types, the Channel's the sixteen, the Number's
 * all of 0..127, Receive's Off and On.
 */
export function outputProblems(entry: CatalogEntry): string[] {
  const problems: string[] = [];
  const outputs = entry.outputs ?? [];
  const ids = new Set<string>();
  const used = new Set<string>();
  for (const output of outputs) {
    const at = `${entry.id} output ${output.id}`;
    if (ids.has(output.id)) problems.push(`${at}: the id is not unique`);
    ids.add(output.id);
    if (output.tokens.type === undefined) problems.push(`${at}: no Type`);
    if (output.tokens.channel === undefined) problems.push(`${at}: no Channel`);
    for (const role of OUTPUT_ROLES) {
      const ref = output.tokens[role];
      if (ref === undefined) continue;
      const knob = knobOf(entry, ref);
      if (knob === undefined) {
        problems.push(`${at}: ${role} names no knob (${ref})`);
        continue;
      }
      if (used.has(knob.id)) problems.push(`${at}: ${knob.id} is in two roles`);
      used.add(knob.id);
      const values = knob.values;
      if (role === "type" && !sameList(values, typeValues(output)))
        problems.push(`${at}: the Type's literals are not its types`);
      if (role === "channel" && !sameList(values, CHANNEL_VALUES))
        problems.push(`${at}: the Channel is not the sixteen channels`);
      if (
        role === "number" &&
        !sameList(
          [...values].sort((a, b) => +a - +b),
          numberValues(),
        )
      )
        problems.push(`${at}: the Number is not 0..127`);
      if (role === "receive" && !sameList(values, RECEIVE_VALUES))
        problems.push(`${at}: Receive is not Off and On`);
    }
  }
  return problems;
}
