// Randomize's roll (SURPRISE ME until 13-09): a fresh index for every knob in
// scope, re-rolled until it fits. PURE AND INJECTABLE: `rng` and `fits` are
// arguments, and the module imports a type and nothing else. Measured never to
// loop (05-VALIDATION), so the twelve-draw bound and the ladder fallback are
// defensive; exhaustion returns the PREVIOUS indices unchanged and model.ts,
// which owns the compiler, applies the ladder. Held knobs shrink the domain and
// nothing else (10-UI-SPEC 11.5). THE SCOPE RULE (Bible section 7): a MIDI
// destination, channel or controller is never rolled - the predicate reads the
// descriptor's id and label words (surprise.spec.ts holds the excluded knobs by
// entry) and TuningRegion.svelte partitions its MIDI output section with it.
// Decided at 13-10 (the scope rule); see .planning/phases/13-gui-overhaul/13-10-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { KnobDescriptor } from "./knobs.preset";

/**
 * The words a descriptor's id or label uses when it names the wire. Lower
 * case; matched as whole words after a camelCase split, so `ccBase` reads
 * as `cc base` and `Sensitivity` does not read as anything.
 */
const WIRE_WORDS: readonly string[] = [
  "cc",
  "channel",
  "midi",
  "controller",
  "send",
];

/** The whole words of an id or a label: camelCase split, then non-letters. */
function wordsOf(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word.length > 0);
}

/**
 * Section 7's scope rule as a predicate over the descriptor: true for a knob
 * that names a MIDI destination, channel or controller by its id or its
 * label. Such a knob is never rolled and its section is MIDI output.
 */
export function isMidiDestination(
  knob: Pick<KnobDescriptor, "id" | "label">,
): boolean {
  const words = [...wordsOf(knob.id), ...wordsOf(knob.label)];
  return words.some((word) => WIRE_WORDS.includes(word));
}

/** The knobs a roll may move: every knob that does not address the wire. */
export function rollable(
  knobs: readonly KnobDescriptor[],
): readonly KnobDescriptor[] {
  return knobs.filter((knob) => !isMidiDestination(knob));
}

/**
 * How many draws a roll may make before it gives up and hands the state back.
 *
 * Twelve, and the number is a comfort rather than a constraint: measured, the
 * first draw always fits. It exists so that a compiler which one day refuses
 * everything stops the loop instead of freezing the panel.
 */
export const SURPRISE_ROLL_LIMIT = 12;

/** No knob is held. One frozen empty set, so the default allocates nothing. */
const NONE_HELD: ReadonlySet<string> = Object.freeze(new Set<string>());

/**
 * Draw a fresh index for every UNHELD knob that is not a MIDI destination and
 * re-roll until the result fits.
 *
 * A draw that reproduces the state it replaced is rejected WITHOUT being
 * offered to `fits` and rolled again, so Randomize visibly does something. For
 * a Lua entry every draw fits by construction and `fits` is the constant true,
 * so the roll is one pass.
 *
 * `held` names the knobs the visitor has locked. They keep their previous
 * position, they never reach `rng` - a roll therefore makes exactly one draw
 * per UNLOCKED, ROLLABLE knob, which is what lets a test count them - and they
 * are never a reason for `moved`. A MIDI destination (`isMidiDestination`) is
 * treated exactly as a held knob is, on every roll, whether or not it is held.
 *
 * Returns `previous` unchanged when the bound is reached - the exhaustion
 * signal the caller resolves with the fit ladder, or, when every rollable knob
 * is held, disables the control for.
 */
export function surpriseIndices(
  knobs: readonly KnobDescriptor[],
  previous: Readonly<Record<string, number>>,
  fits: (indices: Record<string, number>) => boolean,
  rng: () => number = Math.random,
  held: ReadonlySet<string> = NONE_HELD,
): Record<string, number> {
  const kept = { ...previous };
  if (knobs.length === 0) return kept;

  for (let roll = 0; roll < SURPRISE_ROLL_LIMIT; roll++) {
    const draw: Record<string, number> = {};
    let moved = false;
    for (const knob of knobs) {
      // The scope rule and the lock are one branch: both keep the previous
      // position and neither reaches the rng.
      if (held.has(knob.id) || isMidiDestination(knob)) {
        draw[knob.id] = kept[knob.id];
        continue;
      }
      const at = Math.min(
        knob.options.length - 1,
        Math.max(0, Math.floor(rng() * knob.options.length)),
      );
      draw[knob.id] = at;
      if (at !== kept[knob.id]) moved = true;
    }
    // The same state again is not a surprise. It costs a roll and no compile.
    if (!moved) continue;
    if (fits(draw)) return draw;
  }

  return kept;
}
