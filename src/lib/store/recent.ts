// Recently used: what the visitor opened, most recent first, deduped by id,
// capped.
//
// NOT ONE OF SECTION 9's THREE OBJECTS. An entry here is a fact about the
// visitor's path, not a thing they made; the interface may say "Recently
// used" (the PDF's rail row) and "Pick up where you left off", and it must
// never call an item here saved. Nothing is saved by being opened.
//
// TWO NUMBERS, AND WHY THEY DIFFER. The PDF's rail shows `Recently used 06`,
// so SIX is what a caller asking for the rail gets (RECENT_SHOWN). TWELVE is
// what is kept (RECENT_CAP), for one reason: a visitor who opens seven
// things and then reopens the sixth should still find the first behind it,
// and a cap equal to what is shown would forget an entry the moment it
// scrolled off the list. Twelve is two rows of the rail's six - enough for a
// session's worth of wandering, and small enough that the list is one line
// of JSON. The cap exists at all because an uncapped list grows without
// bound in a store of about 5 MB shared with every draft.
//
// PUSHED ON OPEN, NOT ON EDIT OR ON SAVE. Opening a workspace is the act
// that makes something "used"; an autosave every few seconds would pin the
// current draft to the top of the list for as long as it is open, which is
// true but useless. The caller passes the moment in, so the module is a pure
// function of its arguments and testable without a clock.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { probe, writeJson, type LocalStore } from "./local";
import {
  RECENT_KEY,
  SCHEMA_VERSION,
  isEnvelope,
  isRecentItem,
  type RecentItem,
} from "./schema";

/** What is KEPT: twelve, two rows of the rail's six. */
export const RECENT_CAP = 12;

/** What is SHOWN: six, the PDF's `Recently used 06`. */
export const RECENT_SHOWN = 6;

/** The envelope under hangar.recent.v1. Items are validated one by one. */
type RecentEnvelope = { schema: 1; items: unknown[] };

const isRecentEnvelope = (value: unknown): value is RecentEnvelope =>
  isEnvelope(value) && Array.isArray((value as { items?: unknown }).items);

function load(store: LocalStore | undefined): RecentItem[] | undefined {
  const found = probe(store, RECENT_KEY, isRecentEnvelope);
  if (found.state === "refused") return undefined;
  if (found.state !== "present") return [];
  return found.value.items.filter(isRecentItem);
}

/**
 * The most recent `count` items, newest first. The default is the rail's
 * six; a caller may ask for up to the cap and gets no more than is kept.
 */
export function listRecent(
  store: LocalStore | undefined,
  count: number = RECENT_SHOWN,
): readonly RecentItem[] {
  return (load(store) ?? []).slice(0, Math.max(0, count));
}

/** How many are kept, never more than the cap. */
export function recentCount(store: LocalStore | undefined): number {
  return (load(store) ?? []).length;
}

/**
 * Record an open at `at`. The id moves to the front (deduped), the list is
 * cut to the cap, and the oldest falls off. `true` when stored; `false` when
 * the store refused - losing a recent is not a lost draft, so no caller need
 * say anything, but the fact is reported.
 */
export function touchRecent(
  store: LocalStore | undefined,
  id: string,
  at: string,
): boolean {
  const current = load(store);
  if (current === undefined) return false;
  const items = [{ id, at }, ...current.filter((item) => item.id !== id)].slice(
    0,
    RECENT_CAP,
  );
  return writeJson(store, RECENT_KEY, { schema: SCHEMA_VERSION, items });
}
