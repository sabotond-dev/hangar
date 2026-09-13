// The motion preference's key and its two words, folded in from 13-04's
// src/lib/sim/motion.svelte.ts so the storage guard lives in one place. This
// module owns the key (through schema.ts), the words `animated` (the default)
// and `still`, the read and the write; motion.svelte.ts keeps the rune, the OS
// query, the listeners and motionDeps() (the `os || still` that keeps the
// control additive to prefers-reduced-motion). THE STORED VALUE IS THE SAME BARE
// WORD, not JSON: e2e/browse.e2e.ts writes `animated` straight into the key and
// proves the OS still wins, so the fold moved nothing. It is the one key in this
// directory whose body carries no `schema` field.
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
