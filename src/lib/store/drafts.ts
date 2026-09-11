// Drafts: editable working state, recovered locally. The word is DRAFT.
//
// WHICH OF SECTION 9's THREE OBJECTS THIS HOLDS. The Bible names a draft, a
// saved copy and the device state and says "never use one generic 'Saved'
// indicator for all three". This module holds the first: what a visitor is
// working on right now, saved as it is edited so a closed tab or a crashed
// browser loses nothing. The interface may say "Draft", "Draft saved locally"
// (the PDF's context-bar status), "Resume draft" and "Your draft is safe". It
// may not say "Saved" alone - that word belongs to library.ts, and the
// install store owns "Stored on ZONA".
//
// ONE DRAFT PER SOURCE. A Playground draft's source is its catalog entry; a
// Sandbox draft's source is its surface. draftIdFor() spells the id out of
// the kind and the source, so opening `arc` twice finds the same draft
// rather than growing a second, and a sandbox surface can never collide with
// an entry that happens to share its name.
//
// editedAt MOVES ON EVERY WRITE AND createdAt NEVER DOES. writeDraft takes
// the moment as an argument and stamps it; when a draft already exists under
// the id, its createdAt is carried over whatever the caller passed, so "Last
// edited 12 minutes ago" and "created" can never swap. local.spec.ts test 7
// holds both.
//
// NEVER DELETES ANOTHER KIND'S DRAFT, OR ANY ENTRY IT CANNOT READ. Every
// write is read-modify-write over the whole map, spreading the raw map so an
// entry a later HANGAR wrote in a shape this one does not read survives
// beside the one being written. A refused read (local.ts's probe) declines
// the write rather than writing blind: with no way to know what is there, a
// fresh record could destroy every draft a visitor has. A corrupt envelope is
// replaced whole, because nothing in it was ever a draft.
//
// NOTHING STORES A THUMBNAIL. A draft is `{ entryId, knobIndices }` or a
// region list; a 96x96 PNG is roughly 10-30 KB, so 200 of them is
// megabytes, against a store of about 5 MB, for a picture the live
// simulator already renders for free sixteen at a time on the gallery.
// The escape hatch is IndexedDB, and its trigger is written down: STORED
// THUMBNAILS, IMPORTED BINARIES, OR A CAPTURE LOG. None of the three is v1.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { probe, writeJson, type LocalStore } from "./local";
import {
  DRAFTS_KEY,
  SCHEMA_VERSION,
  isEnvelope,
  isStoredRecord,
  type Draft,
  type RecordKind,
} from "./schema";

/** The envelope under hangar.drafts.v1. Entries are validated one by one on read. */
type DraftsEnvelope = { schema: 1; drafts: Record<string, unknown> };

const isDraftsEnvelope = (value: unknown): value is DraftsEnvelope => {
  if (!isEnvelope(value)) return false;
  const drafts = (value as { drafts?: unknown }).drafts;
  return (
    typeof drafts === "object" && drafts !== null && !Array.isArray(drafts)
  );
};

/** The one draft id a kind and a source can have. */
export function draftIdFor(kind: RecordKind, source: string): string {
  return `${kind}:${source}`;
}

/** The raw envelope, or a fresh one; `undefined` only when the store refused. */
function load(store: LocalStore | undefined): DraftsEnvelope | undefined {
  const found = probe(store, DRAFTS_KEY, isDraftsEnvelope);
  if (found.state === "refused") return undefined;
  if (found.state === "present") return found.value;
  return { schema: SCHEMA_VERSION, drafts: {} };
}

/** Every draft this version can read, keyed by id. A malformed entry hides no neighbour. */
export function readDrafts(
  store: LocalStore | undefined,
): Readonly<Record<string, Draft>> {
  const envelope = load(store);
  const out: Record<string, Draft> = {};
  if (envelope === undefined) return out;
  for (const [id, value] of Object.entries(envelope.drafts)) {
    if (isStoredRecord(value) && value.id === id) out[id] = value;
  }
  return out;
}

export function readDraft(
  store: LocalStore | undefined,
  id: string,
): Draft | undefined {
  return readDrafts(store)[id];
}

/** The draft edited most recently, for the intro's Resume draft card (D-14 Q2). */
export function newestDraft(store: LocalStore | undefined): Draft | undefined {
  let newest: Draft | undefined;
  for (const draft of Object.values(readDrafts(store))) {
    if (newest === undefined || draft.editedAt > newest.editedAt) {
      newest = draft;
    }
  }
  return newest;
}

/**
 * Store a draft under its id with `editedAt = at`; an existing draft's
 * createdAt is kept. `true` when stored, `false` when the store refused the
 * read or the write - the caller is told, because a silent drop on a draft
 * is a lost draft.
 */
export function writeDraft(
  store: LocalStore | undefined,
  draft: Draft,
  at: string,
): boolean {
  const envelope = load(store);
  if (envelope === undefined) return false;
  const existing = envelope.drafts[draft.id];
  const createdAt =
    isStoredRecord(existing) && existing.id === draft.id
      ? existing.createdAt
      : draft.createdAt;
  const next: Draft = {
    ...draft,
    schema: SCHEMA_VERSION,
    createdAt,
    editedAt: at,
  };
  return writeJson(store, DRAFTS_KEY, {
    schema: SCHEMA_VERSION,
    drafts: { ...envelope.drafts, [draft.id]: next },
  });
}

/**
 * Remove one draft by id and nothing else. Removing an id that is not there
 * is a success, as it is for Storage. `false` only when the store refused.
 */
export function removeDraft(
  store: LocalStore | undefined,
  id: string,
): boolean {
  const envelope = load(store);
  if (envelope === undefined) return false;
  if (!(id in envelope.drafts)) return true;
  const drafts = { ...envelope.drafts };
  delete drafts[id];
  return writeJson(store, DRAFTS_KEY, { schema: SCHEMA_VERSION, drafts });
}
