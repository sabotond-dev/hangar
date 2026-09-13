// The returning-visitor flag (13-CONTEXT D-14 Q2): has this browser seen the
// intro. Not one of section 9's three objects, and the interface never names
// it; it changes what the intro OFFERS (a returning visitor's first card is
// "Resume draft"), never where the visitor lands - `/` stays the intro, no
// redirect, no flash. Written on the first SUCCESSFUL mount of `/`, from
// onMount after the paint, never before it. The safe direction: a refusing
// browser sees the intro every time (the read degrades to "not seen", the
// write is dropped). The first moment is kept - marking a set flag is a no-op
// that reports success, so `at` never moves.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { probe, readJson, writeJson, type LocalStore } from "./local";
import {
  INTRO_KEY,
  SCHEMA_VERSION,
  isIntroFlag,
  type IntroFlag,
} from "./schema";

/** The flag, or `undefined` for a first visit and for every refusing store. */
export function readIntro(
  store: LocalStore | undefined,
): IntroFlag | undefined {
  return readJson(store, INTRO_KEY, isIntroFlag);
}

/** True only when a valid flag is stored. Every failure is "not seen". */
export function hasSeenIntro(store: LocalStore | undefined): boolean {
  return readIntro(store) !== undefined;
}

/**
 * Set the flag at `at`, once. An existing flag is kept and `true` reported;
 * `false` when the store refused - and then the intro is simply seen again.
 */
export function markIntroSeen(
  store: LocalStore | undefined,
  at: string,
): boolean {
  const found = probe(store, INTRO_KEY, isIntroFlag);
  if (found.state === "refused") return false;
  if (found.state === "present") return true;
  return writeJson(store, INTRO_KEY, {
    schema: SCHEMA_VERSION,
    seen: true,
    at,
  });
}
