// The intro's first card, and the two strings HANGAR had to write for it
// (plan 13-07; 13-CONTEXT.md D-05, D-14 Q2; 13-RESEARCH.md section 8).
//
// WHAT THE RETURNING VISITOR CHANGES, AND WHAT THEY DO NOT. `/` is always the
// intro: it is prerendered, it is every unfurl's target, and it carries the
// site's one live surface. A visitor who has been here before and has a
// draft is offered `Resume draft` in the FIRST CARD, pointing at the newest
// draft, instead of `Explore Playground`. Nothing else on the page moves and
// nothing navigates. This module answers "which card" as a pure function of
// the store and the clock, so the page's onMount is one call and the answer
// is testable without a browser.
//
// THE SAFE DIRECTION, STATED AS A DECISION. A store that is absent, refuses,
// throws on access, or holds a record this version cannot read reads as a
// FIRST VISIT: `hasSeenIntro` and `newestDraft` both degrade to "nothing
// there" (src/lib/store/local.ts), and this function never throws. The other
// direction - assuming "seen" on a failure - would greet a first visitor with
// a resume card for a draft that was never made, on exactly the browsers that
// are strictest about storage.
//
// BOTH THE FLAG AND A DRAFT, NOT EITHER. The flag says the visitor has been
// here; the draft is the thing there is to resume. A flag with no draft is a
// visitor who looked and left, and `Explore Playground` is still the right
// first card for them.
//
// THE TWO STRINGS THIS MODULE INVENTS are ledgered in
// .planning/phases/13-gui-overhaul/13-COPY-NEW.md for 13-18 (D-05): the
// resume card's supporting line, in the shape of the PDF's page-4 status
// (`Draft · Modulation · Last edited 12 minutes ago`), and the hero's
// accessible description. The resume card's eyebrow reuses the Bible's own
// sentence "Pick up where you left off" as a short label, uppercase because
// the other two card eyebrows are; it is ledgered too, as a case change
// rather than a new sentence. Every other string on the intro is the PDF's,
// verbatim, and lives in Intro.svelte.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { newestDraft } from "$lib/store/drafts";
import { hasSeenIntro } from "$lib/store/intro";
import type { LocalStore } from "$lib/store/local";
import type { Draft } from "$lib/store/schema";

/** What the first card offers. `resume` carries the draft it points at. */
export type IntroCard =
  | { readonly kind: "explore" }
  | { readonly kind: "resume"; readonly draft: Draft; readonly edited: string };

const EXPLORE: IntroCard = { kind: "explore" };

/**
 * The first card for this visitor: `resume` when the intro has been seen and
 * a draft exists, `explore` for everything else - including every failure.
 */
export function introCardFor(
  store: LocalStore | undefined,
  now: Date,
): IntroCard {
  if (!hasSeenIntro(store)) return EXPLORE;
  const draft = newestDraft(store);
  if (draft === undefined) return EXPLORE;
  return { kind: "resume", draft, edited: relativeTime(draft.editedAt, now) };
}

/**
 * "12 minutes ago", in words, from an ISO moment and the clock. Coarse on
 * purpose: a draft's age is a reassurance, not a measurement. An unreadable
 * moment - a record written by hand, a clock that went backwards - reads
 * as "earlier" rather than as NaN.
 */
export function relativeTime(editedAt: string, now: Date): string {
  const then = Date.parse(editedAt);
  if (Number.isNaN(then)) return "earlier";
  const seconds = Math.max(0, Math.round((now.getTime() - then) / 1000));
  if (seconds < 45) return "just now";
  if (seconds < 90) return "a minute ago";
  const minutes = Math.round(seconds / 60);
  if (minutes < 45) return `${minutes} minutes ago`;
  if (minutes < 90) return "an hour ago";
  const hours = Math.round(minutes / 60);
  if (hours < 22) return `${hours} hours ago`;
  if (hours < 36) return "a day ago";
  const days = Math.round(hours / 24);
  return `${days} days ago`;
}

/**
 * The resume card's supporting line. The PDF's page-4 status reads
 * `Draft · Modulation · Last edited 12 minutes ago`; this is the same shape
 * with the draft's own name. Ledgered (13-COPY-NEW.md, 13-07).
 */
export function resumeLine(name: string, edited: string): string {
  return `Draft · ${name} · Last edited ${edited}`;
}

/**
 * The resume card's eyebrow: the PDF's own page-4 eyebrow above its resume
 * card, verbatim (13-18, D-23, batch row D.4), beside page 1's `START WITH A
 * BLANK SURFACE`. 13-07 shipped the Bible's headline in uppercase, which
 * D-05 forbids for a sentence; the PDF had the label all along.
 */
export const RESUME_EYEBROW = "CONTINUE EDITING";

/**
 * The hero's accessible description, read after the canvas's own name
 * ("{name}, live pad simulation"). Plain about state (D-05): it runs here,
 * a finger plays it, and nothing reaches a ZONA. Ledgered (13-COPY-NEW.md,
 * 13-07).
 */
export function heroDescription(name: string): string {
  return `A live simulation of ${name} running in your browser. Drag across it to play it; nothing is sent to a ZONA.`;
}
