// The returning-visitor flag (13-CONTEXT D-14 Q2): has this browser seen the
// intro.
//
// NOT ONE OF SECTION 9's THREE OBJECTS, and the interface never names it. It
// changes what the intro OFFERS - a returning visitor's first card becomes
// "Resume draft" pointing at the newest draft - and never where the visitor
// lands: `/` stays the intro, always, because it is prerendered, it is every
// Discord unfurl's target, and it carries the site's one live hero surface.
// No redirect, no flash.
//
// WRITTEN ON THE FIRST SUCCESSFUL MOUNT OF `/`, NEVER ON A FAILED ONE. The
// caller marks the flag from inside onMount after the page has painted, not
// at module scope and not before; a mount that threw never reaches the call,
// so a visitor whose first visit broke sees the intro again rather than a
// "Resume draft" for a draft that was never made.
//
// THE SAFE DIRECTION, STATED AS A DECISION: A REFUSING BROWSER SEES THE
// INTRO EVERY TIME. When storage is refused, throwing or full, the read
// degrades to "not seen" and the write is dropped. That visitor gets the
// welcome on every visit, which is the harmless failure; the other direction
// - assuming "seen" and hiding the way in - would greet a first visitor with
// a resume card for nothing. 13-07 renders the card; this module only
// answers the question.
//
// THE FIRST MOMENT IS KEPT. Marking a flag that is already set is a no-op
// that reports success, so `at` is the first successful visit and never
// moves; "you have been here before" is a fact about the first time.
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
