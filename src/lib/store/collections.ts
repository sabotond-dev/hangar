// Collections: named filing for the personal library (plan 13-13; PDF page 4's
// COLLECTIONS section - `Live set`, `Studio experiments`, `+ New collection`).
//
// THE SPECIFICATION THE BIBLE NEVER WROTE. Section 11 of the design
// specification lists recoverable drafts, named copies, favorites and
// export/import, and never mentions collections; the PDF draws them and the
// user chose to ship them in v1 anyway (13-CONTEXT D-13), so the shape had
// to be decided by somebody. It was decided BY THE USER, at four forks put to
// them with their storage and code costs, on 2026-09-11, and the answer is
// recorded verbatim as 13-CONTEXT D-22:
//
//     "many session bare no"
//
//   A. MEMBERSHIP: MANY. A configuration may be in many collections. One id
//      list per collection (`members`), never a field on the record. Costs a
//      reconciliation on delete - removing a configuration removes it from
//      every list (removeFromAll) - and a read that drops an id the library
//      no longer carries and COUNTS the drop, which is favorites.ts's rule
//      applied identically (readCollections returns `dropped`). The
//      alternative, one collection per record, was cheaper and refused
//      because `Live set` and `Studio experiments` are exactly the pair a
//      thing belongs to both of.
//   B. DELETE: UNDOABLE FOR THE REST OF THE SESSION. deleteCollection returns
//      the removed collection as the undo vector and the SCREEN holds it in
//      memory - one vector, nothing persisted, gone with the tab. No
//      tombstone record, no expiry rule, no second shape in storage
//      (collections.spec.ts test 3 asserts the store carries no trace after
//      a delete). The tombstone was offered and refused; a confirmation
//      instead of undo was offered and refused because section 11 asks for
//      undo "where practical" and here it is.
//   C. EMPTY STATE: BARE. When there are no collections the rail shows the
//      PDF's `+ New collection` link and nothing else - no suggested first
//      collection, no hidden section. This module has nothing to do for C;
//      the route obeys it.
//   D. EXPORT: MEMBERSHIP DOES NOT TRAVEL. transfer.ts's ExportFile has no
//      collections field, an import always lands unfiled, and an import can
//      never create a collection the visitor did not make (test 4). The
//      alternative - membership travels and the collection is created on
//      import - was refused because importing one file could create
//      something the visitor never asked for.
//
// These are DECISIONS, not conventions: a later reader who finds them
// inconvenient changes D-22 first and this header second.
//
// THE RECORD. hangar.collections.v1 holds `{ schema: 1, collections:
// Collection[] }`, an envelope like every other 13-06 key, and each
// Collection is `{ schema: 1, id, name, createdAt, members: string[] }` - the
// version in the body too, because a collection could one day travel even
// though D-22 says a record's membership does not. `members` are record ids
// from drafts.ts or library.ts (a draft and a saved copy can both be filed).
// The key was reserved in schema.ts at 13-06 as COLLECTIONS_KEY_RESERVED so
// no other store could take the name; it is COLLECTIONS_KEY now and this
// module is its one reader and writer.
//
// THE PRIMITIVE IS 13-06's. Every read is a probe classified as absent,
// corrupt or refused before any write; a refused read declines the write
// (a fresh record written after a refused read is every collection
// destroyed); a corrupt envelope is replaced whole on the next write; an
// individual malformed collection hides no neighbour. Reading never writes:
// the drop count is reported, and the pruned list is what the next write
// stores (favorites.ts's rule).
//
// THE VALIDATOR IS AN ARGUMENT (13-06's rule): this module cannot know which
// record ids exist without importing both record stores, and the route
// already has both lists. `isKnown(id)` is the route's closure over them.
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
