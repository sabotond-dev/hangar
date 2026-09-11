// The motion preference's key and its two words, folded in from 13-04's
// src/lib/sim/motion.svelte.ts so the storage guard lives in one place.
//
// WHAT MOVED AND WHAT DID NOT. 13-04 wrote the key `hangar.motion.v1` and
// the values `animated` (the default) and `still` as bare strings, with a
// guard copied line for line from the retired ScreenToggle.svelte. This
// module owns the key (through schema.ts), the two words, the read and the
// write; motion.svelte.ts keeps the rune, the OS query, the listeners and
// motionDeps() - the `os || still` that makes the control additive to
// prefers-reduced-motion and never subtractive - and calls readMotion() and
// writeMotion() where it used to call its own. THE STORED VALUE IS THE SAME
// BARE WORD, not JSON: e2e/browse.e2e.ts writes `animated` straight into the
// key under the OS preference and proves the OS still wins, and that title
// is the proof this fold moved nothing. It is the one key in this directory
// whose body carries no `schema` field, and schema.ts's header says why.
//
// THE PLANNER'S SHAPE WAS A GUESS. 13-06-PLAN.md lists the key as
// `{ ambient: boolean }`; it was written before 13-04 landed. The rule that
// the behaviour must not change outranks the sketch, so the shape here is
// 13-04's, and the sketch is recorded in the SUMMARY as superseded.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readString, writeString, type LocalStore } from "./local";
import { MOTION_KEY } from "./schema";

export { MOTION_KEY };

export type MotionChoice = "animated" | "still";

/** The two recorded values. `animated` is the default and is what an absent key means. */
export const MOTION_CHOICES: readonly MotionChoice[] = ["animated", "still"];

/** The recorded choice, or `undefined` for an absent key, a refusing store, or any other word. */
export function readMotion(
  store: LocalStore | undefined,
): MotionChoice | undefined {
  const raw = readString(store, MOTION_KEY);
  return MOTION_CHOICES.find((choice) => choice === raw);
}

/** Record the choice as the bare word. `false` when the store refused; the live preference stands either way. */
export function writeMotion(
  store: LocalStore | undefined,
  choice: MotionChoice,
): boolean {
  return writeString(store, MOTION_KEY, choice);
}
