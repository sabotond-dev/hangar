// Collections: named filing for the personal library (PDF page 4's COLLECTIONS
// section). The Bible never wrote this shape; the user decided it at four forks
// - "many session bare no" (13-CONTEXT D-22): (A) a configuration may be in
// MANY collections - one `members` id list per collection, reconciled on delete
// by removeFromAll, drops counted on read; (B) delete is undoable for the rest
// of the SESSION - deleteCollection returns the collection as the undo vector,
// nothing persisted; (C) the empty state is BARE - the route's to obey; (D)
// membership does NOT travel - an import lands unfiled. hangar.collections.v1
// holds an envelope of Collections, each with `schema` in its body. Every read is
// a probe (local.ts); a refused read declines the write; `isKnown(id)` is an argument.
// Decided at 13-13 (D-22); see .planning/phases/13-gui-overhaul/13-13-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

import { probe, writeJson, type LocalStore } from "./local";
import { COLLECTIONS_KEY, SCHEMA_VERSION, isEnvelope } from "./schema";

/** One collection: a name over a list of record ids. */
export type Collection = {
  readonly schema: typeof SCHEMA_VERSION;
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly members: readonly string[];
};

/** True when a record id is in drafts.ts or library.ts. Passed in; never imported. */
export type IsKnownRecord = (id: string) => boolean;

/** The list a screen shows, and how many member ids were dropped on the way. */
export type Collections = {
  readonly list: readonly Collection[];
  /** Member ids the validator rejected, summed over every collection. Zero on a healthy store. */
  readonly dropped: number;
};

/**
 * What a collections write did.
 *   "written" - stored
 *   "kept"    - a collection with that id already existed and was NOT touched
 *   "absent"  - the collection asked for does not exist
 *   "refused" - no store, or a store that refused the read or the write
 */
export type CollectionOutcome = "written" | "kept" | "absent" | "refused";

type CollectionsEnvelope = { schema: 1; collections: unknown[] };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isCollectionsEnvelope = (value: unknown): value is CollectionsEnvelope =>
  isEnvelope(value) &&
  Array.isArray((value as { collections?: unknown }).collections);

function isCollection(value: unknown): value is Collection {
  if (!isObject(value) || value.schema !== SCHEMA_VERSION) return false;
  if (typeof value.id !== "string" || typeof value.name !== "string") {
    return false;
  }
  if (typeof value.createdAt !== "string") return false;
  return (
    Array.isArray(value.members) &&
    value.members.every((member) => typeof member === "string")
  );
}

/** The validated list, or a fresh one; `undefined` only when the store refused. */
function load(store: LocalStore | undefined): Collection[] | undefined {
  const found = probe(store, COLLECTIONS_KEY, isCollectionsEnvelope);
  if (found.state === "refused") return undefined;
  if (found.state !== "present") return [];
  return found.value.collections.filter(isCollection);
}

function save(
  store: LocalStore | undefined,
  collections: readonly Collection[],
): CollectionOutcome {
  return writeJson(store, COLLECTIONS_KEY, {
    schema: SCHEMA_VERSION,
    collections,
  })
    ? "written"
    : "refused";
}

/**
 * Every collection, each member list pruned to the ids the library still
 * carries, with the drops counted (fork A's rule, favorites.ts's shape).
 * Reading never writes; the next write stores what it was handed.
 */
export function readCollections(
  store: LocalStore | undefined,
  isKnown: IsKnownRecord,
): Collections {
  const raw = load(store);
  if (raw === undefined) return { list: [], dropped: 0 };
  let dropped = 0;
  const list = raw.map((collection) => {
    const members = collection.members.filter((member) => {
      if (isKnown(member)) return true;
      dropped += 1;
      return false;
    });
    return { ...collection, members };
  });
  return { list, dropped };
}

/** Create a collection. An existing id is "kept" untouched. The name is stored as given. */
export function createCollection(
  store: LocalStore | undefined,
  id: string,
  name: string,
  at: string,
): CollectionOutcome {
  const current = load(store);
  if (current === undefined) return "refused";
  if (current.some((collection) => collection.id === id)) return "kept";
  return save(store, [
    ...current,
    { schema: SCHEMA_VERSION, id, name, createdAt: at, members: [] },
  ]);
}

/** Give a collection a new name. createdAt and members are untouched. */
export function renameCollection(
  store: LocalStore | undefined,
  id: string,
  name: string,
): CollectionOutcome {
  const current = load(store);
  if (current === undefined) return "refused";
  if (!current.some((collection) => collection.id === id)) return "absent";
  return save(
    store,
    current.map((collection) =>
      collection.id === id ? { ...collection, name } : collection,
    ),
  );
}

/**
 * Remove a collection and RETURN IT: the removed collection is the undo
 * vector (fork B), and the caller holds it in memory for the session. This
 * module writes no tombstone. `undefined` when the collection is not there
 * or the store refused - nothing to hold either way.
 */
export function deleteCollection(
  store: LocalStore | undefined,
  id: string,
): Collection | undefined {
  const current = load(store);
  if (current === undefined) return undefined;
  const removed = current.find((collection) => collection.id === id);
  if (removed === undefined) return undefined;
  const outcome = save(
    store,
    current.filter((collection) => collection.id !== id),
  );
  return outcome === "written" ? removed : undefined;
}

/**
 * The undo: a held collection goes back, members and all, at the end of the
 * list. "kept" when a collection with its id has appeared since.
 */
export function restoreCollection(
  store: LocalStore | undefined,
  collection: Collection,
): CollectionOutcome {
  const current = load(store);
  if (current === undefined) return "refused";
  if (current.some((each) => each.id === collection.id)) return "kept";
  return save(store, [...current, { ...collection, schema: SCHEMA_VERSION }]);
}

/**
 * File or unfile one record in one collection. A record may be in many
 * (fork A); adding it to a second collection never removes it from the
 * first. Adding an id that is already there, or removing one that is not,
 * is a success with no write.
 */
export function setMember(
  store: LocalStore | undefined,
  collectionId: string,
  recordId: string,
  on: boolean,
): CollectionOutcome {
  const current = load(store);
  if (current === undefined) return "refused";
  const target = current.find((collection) => collection.id === collectionId);
  if (target === undefined) return "absent";
  const has = target.members.includes(recordId);
  if (has === on) return "written";
  const members = on
    ? [...target.members, recordId]
    : target.members.filter((member) => member !== recordId);
  return save(
    store,
    current.map((collection) =>
      collection.id === collectionId ? { ...collection, members } : collection,
    ),
  );
}

/** The ids of every collection a record is in. */
export function collectionsOf(
  collections: readonly Collection[],
  recordId: string,
): readonly string[] {
  return collections
    .filter((collection) => collection.members.includes(recordId))
    .map((collection) => collection.id);
}

/**
 * THE RECONCILIATION (fork A): a deleted record leaves EVERY collection it
 * was in. Called by the route beside removeDraft / deleteCopy. Returns the
 * ids of the collections it was removed from - what an undo of the record
 * needs to put the memberships back - or `undefined` when the store refused.
 * A record in no collection is a success with no write.
 */
export function removeFromAll(
  store: LocalStore | undefined,
  recordId: string,
): readonly string[] | undefined {
  const current = load(store);
  if (current === undefined) return undefined;
  const wasIn = collectionsOf(current, recordId);
  if (wasIn.length === 0) return [];
  const collections = current.map((collection) => ({
    ...collection,
    members: collection.members.filter((member) => member !== recordId),
  }));
  return save(store, collections) === "written" ? wasIn : undefined;
}
