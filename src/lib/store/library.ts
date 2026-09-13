// The library: named copies that can be reopened or shared. The word is SAVED
// COPY - the second of Bible section 9's three objects; the interface may say
// "Saved copy", "Save copy", "Named copies" and "Saved" ON A COPY, never for a
// draft (drafts.ts) or the device (the install store). A copy is CREATED,
// NEVER OVERWRITTEN FROM ITS SOURCE (section 11): saveCopy declines an existing
// id with "kept", and a caller that wants change has rename, duplicate and
// delete, each its own function - there is no "update copy", which is what
// makes "share an immutable snapshot" true of the record. editedAt moves on a
// rename, createdAt never; a duplicate is a new copy with both set. The
// read-modify-write and the refused-read rule are drafts.ts's.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { probe, writeJson, type LocalStore } from "./local";
import {
  LIBRARY_KEY,
  SCHEMA_VERSION,
  isEnvelope,
  isStoredRecord,
  type SavedCopy,
} from "./schema";

/** The envelope under hangar.library.v1. Entries are validated one by one on read. */
type LibraryEnvelope = { schema: 1; copies: Record<string, unknown> };

const isLibraryEnvelope = (value: unknown): value is LibraryEnvelope => {
  if (!isEnvelope(value)) return false;
  const copies = (value as { copies?: unknown }).copies;
  return (
    typeof copies === "object" && copies !== null && !Array.isArray(copies)
  );
};

/**
 * What a library write did.
 *   "written" - the copy is stored
 *   "kept"    - a copy with that id already existed and was NOT touched
 *   "absent"  - the copy asked for does not exist (rename, duplicate)
 *   "refused" - no store, or a store that refused the read or the write
 */
export type LibraryOutcome = "written" | "kept" | "absent" | "refused";

function load(store: LocalStore | undefined): LibraryEnvelope | undefined {
  const found = probe(store, LIBRARY_KEY, isLibraryEnvelope);
  if (found.state === "refused") return undefined;
  if (found.state === "present") return found.value;
  return { schema: SCHEMA_VERSION, copies: {} };
}

const valid = (value: unknown, id: string): SavedCopy | undefined =>
  isStoredRecord(value) && value.id === id ? value : undefined;

function save(
  store: LocalStore | undefined,
  envelope: LibraryEnvelope,
  id: string,
  copy: SavedCopy,
): LibraryOutcome {
  const stored = writeJson(store, LIBRARY_KEY, {
    schema: SCHEMA_VERSION,
    copies: { ...envelope.copies, [id]: copy },
  });
  return stored ? "written" : "refused";
}

/** Every copy this version can read, keyed by id. */
export function readLibrary(
  store: LocalStore | undefined,
): Readonly<Record<string, SavedCopy>> {
  const envelope = load(store);
  const out: Record<string, SavedCopy> = {};
  if (envelope === undefined) return out;
  for (const [id, value] of Object.entries(envelope.copies)) {
    const copy = valid(value, id);
    if (copy) out[id] = copy;
  }
  return out;
}

export function readCopy(
  store: LocalStore | undefined,
  id: string,
): SavedCopy | undefined {
  return readLibrary(store)[id];
}

/** Create a copy. An existing id is "kept" untouched; a copy is never overwritten. */
export function saveCopy(
  store: LocalStore | undefined,
  copy: SavedCopy,
): LibraryOutcome {
  const envelope = load(store);
  if (envelope === undefined) return "refused";
  if (valid(envelope.copies[copy.id], copy.id)) return "kept";
  return save(store, envelope, copy.id, { ...copy, schema: SCHEMA_VERSION });
}

/** Give a copy a new name; editedAt moves to `at`, createdAt does not. */
export function renameCopy(
  store: LocalStore | undefined,
  id: string,
  name: string,
  at: string,
): LibraryOutcome {
  const envelope = load(store);
  if (envelope === undefined) return "refused";
  const copy = valid(envelope.copies[id], id);
  if (!copy) return "absent";
  return save(store, envelope, id, { ...copy, name, editedAt: at });
}

/**
 * A new copy of an existing one under a new id and name, created at `at`.
 * The source is untouched; an existing target id is "kept".
 */
export function duplicateCopy(
  store: LocalStore | undefined,
  id: string,
  newId: string,
  name: string,
  at: string,
): LibraryOutcome {
  const envelope = load(store);
  if (envelope === undefined) return "refused";
  const copy = valid(envelope.copies[id], id);
  if (!copy) return "absent";
  if (valid(envelope.copies[newId], newId)) return "kept";
  return save(store, envelope, newId, {
    ...copy,
    id: newId,
    name,
    createdAt: at,
    editedAt: at,
  });
}

/** Remove one copy by id and nothing else. Undo, where offered, is the screen's (13-13). */
export function deleteCopy(
  store: LocalStore | undefined,
  id: string,
): LibraryOutcome {
  const envelope = load(store);
  if (envelope === undefined) return "refused";
  if (!(id in envelope.copies)) return "absent";
  const copies = { ...envelope.copies };
  delete copies[id];
  return writeJson(store, LIBRARY_KEY, { schema: SCHEMA_VERSION, copies })
    ? "written"
    : "refused";
}
