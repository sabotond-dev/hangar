// The inspector's five sections (change 16, 2026-09-21): where a knob's row goes, decided from
// its kind and the words of its id and label, in one fixed order - Look (the colours), Feel (the
// amounts, speeds and trails), Sound (the notes, scales and keys), MIDI (the wire: surprise.ts's
// own predicate, so the section is exactly what Randomize preserves), Sync (the clock). Pure and
// total: every knob lands in one section; a section with no knob is not drawn (Look always is,
// for the brightness field). tune-ui.spec.ts walks every card's rack through it.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { KnobKindName } from "./view";
import { isMidiDestination, wordsOf } from "./surprise";

export type SectionName = "look" | "feel" | "sound" | "midi" | "sync";

/** The fixed order the inspector draws them in. */
export const SECTION_ORDER: readonly SectionName[] = [
  "look",
  "feel",
  "sound",
  "midi",
  "sync",
];

/** The words that put a knob under Sync, whatever its kind: the clock source and its divisions. */
const SYNC_WORDS: readonly string[] = [
  "sync",
  "division",
  "divisions",
  "clock",
  "clocks",
];

/** The kinds that are Sound on their own. */
const SOUND_KINDS: readonly KnobKindName[] = ["note", "scale"];

/** The words that put a knob of any other kind under Sound. */
const SOUND_WORDS: readonly string[] = [
  "note",
  "notes",
  "key",
  "keys",
  "root",
  "scale",
  "octave",
  "velocity",
  "inversion",
  "modifier",
];

/** Which section a knob's row belongs in. The MIDI test runs before the word tests: `Ring 1 MIDI note` is the wire. */
export function sectionOf(knob: {
  id: string;
  label: string;
  kind: KnobKindName;
}): SectionName {
  if (knob.kind === "colour") return "look";
  if (isMidiDestination(knob)) return "midi";
  const words = [...wordsOf(knob.id), ...wordsOf(knob.label)];
  if (words.some((word) => SYNC_WORDS.includes(word))) return "sync";
  if (SOUND_KINDS.includes(knob.kind)) return "sound";
  if (words.some((word) => SOUND_WORDS.includes(word))) return "sound";
  return "feel";
}

/** Every knob under its section, every section present (possibly empty), in rack order within each. */
export function groupBySection<
  T extends { id: string; label: string; kind: KnobKindName },
>(knobs: readonly T[]): Readonly<Record<SectionName, readonly T[]>> {
  const out: Record<SectionName, T[]> = {
    look: [],
    feel: [],
    sound: [],
    midi: [],
    sync: [],
  };
  for (const knob of knobs) out[sectionOf(knob)].push(knob);
  return out;
}
