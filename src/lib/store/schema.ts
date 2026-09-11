// The local store's vocabulary: the key names, the version, and the record
// shapes. Data only - no function here touches a browser, and the module
// imports nothing at all.
//
// THE VERSION IS IN THE KEY NAME AND IN THE BODY, AND THE TWO DO DIFFERENT
// JOBS. src/lib/device/snapshot.ts set the rule for the key: SNAPSHOT_KEY is
// "hangar.snapshot.v1", so when Phase 12 needed a third string per entry it
// wrote "hangar.snapshot.v2" BESIDE it (12-03), and the v1 record was read
// as `system = default`, never overwritten, never deleted and never shadowed.
// A version in the key name is a stronger guarantee than a field inside the
// JSON, because a reader that never opens the other version's record cannot
// misparse it: an unknown-shaped record is simply a key it does not look at.
// Every key below ends in `.v1` for that reason, and storeKey() below is the
// one place the suffix is spelled, so a `.v2` is a call and not a rename.
//
// BUT AN EXPORTED FILE HAS NO KEY NAME. Section 11 of the Bible requires
// export and import, and 13-13 builds them; a file on somebody's disk carries
// no `hangar.library.v1` with it. So the version goes in the body as well -
// `schema: 1` on every record that could ever travel - and an import reads
// the body's version the way a local read reads the key's. Both, always,
// because each covers the case the other cannot.
//
// EVERY KEY HOLDS AN ENVELOPE `{ schema: 1, ... }`, not a bare array or a bare
// map. KEEP-05 says "every stored record carries its version in the key name
// and in the body", and a `string[]` under hangar.favorites.v1 would carry it
// in the key only. The envelope costs eleven characters per key and makes the
// requirement literal rather than mostly true. The one key that is NOT an
// envelope is hangar.motion.v1, which holds the bare word `animated` or
// `still` because 13-04 wrote it that way and e2e/browse.e2e.ts writes it
// that way; it is a two-word preference and not a record, nothing exports
// it, and a `.v2` would still sit beside it by the key rule. Stated here so
// nobody "fixes" it into JSON and breaks the additive-motion proof.
//
// THREE OBJECTS, THREE WORDS, THREE STORES (Bible section 9). A DRAFT is
// editable working state recovered locally - drafts.ts. A SAVED COPY is a
// named snapshot that can be reopened or shared - library.ts. DEVICE STATE
// is what is confirmed on a page of a module - the install store, where it
// already lives, and NOT here. "Never use one generic 'Saved' indicator for
// all three" is the spec's own sentence; the two record stores share a shape
// (StoredRecord) and share nothing else, so no module can offer one word for
// both by accident.
//
// hangar.collections.v1 WAS RESERVED HERE AT 13-06 AND IS SPENT AT 13-13.
// Collections ship in v1 (13-CONTEXT D-13); their shape - many collections
// per configuration, a session-only undo on delete, the bare "+ New
// collection" empty state, no membership in an export - was the user's
// decision at 13-13's checkpoint, recorded as D-22 ("many session bare no",
// 2026-09-11). collections.ts owns the key and carries the four answers in
// its header as the specification the Bible never wrote; local.spec.ts's
// scan still finds the word in schema.ts and in no other 13-06 store.
//
// THE SURFACE'S TWO NUMBERS LIVE HERE because a sandbox record is validated
// against them on import (transfer.ts, step 5) before any Sandbox module is
// loaded: SURFACE_SIZE is the ZONA's 9, and SURFACE_ELEMENT_CAP is D-14 Q4's
// sixteen with the live budget meter. 13-14's region model (src/lib/sandbox/
// model.ts) imports both rather than re-declaring them, so a cap that moves
// after the budget is measured (13-14's own task) moves in one place.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** The one version every body carries and every key name ends in. */
export const SCHEMA_VERSION = 1 as const;

/** The seven stores this module names. */
export type StoreName =
  | "drafts"
  | "library"
  | "favorites"
  | "recent"
  | "intro"
  | "motion"
  | "collections";

/**
 * The one place the key suffix is spelled. `storeKey("drafts", 1)` is
 * "hangar.drafts.v1"; a later reader asks for `storeKey("drafts", 2)` and by
 * construction never opens the v1 record (local.spec.ts test 5).
 */
export function storeKey(name: StoreName, version: number): string {
  return `hangar.${name}.v${version}`;
}

export const DRAFTS_KEY = storeKey("drafts", SCHEMA_VERSION);
export const LIBRARY_KEY = storeKey("library", SCHEMA_VERSION);
export const FAVORITES_KEY = storeKey("favorites", SCHEMA_VERSION);
export const RECENT_KEY = storeKey("recent", SCHEMA_VERSION);
export const INTRO_KEY = storeKey("intro", SCHEMA_VERSION);

/**
 * 13-04's key, adopted by name and unchanged: the value under it is the bare
 * word `animated` or `still`, not JSON (see the header).
 */
export const MOTION_KEY = storeKey("motion", SCHEMA_VERSION);

/** Spent by 13-13: collections.ts owns it (D-13, D-22). */
export const COLLECTIONS_KEY = storeKey("collections", SCHEMA_VERSION);

/** The ZONA's matrix is nine by nine; a region's cells are 0..8 on both axes. */
export const SURFACE_SIZE = 9;

/** The most elements one surface holds (13-CONTEXT D-14 Q4, "room for four more" beats a wall). */
export const SURFACE_ELEMENT_CAP = 16;

/** Every key this module owns, for a test that wants to see all of them. */
export const OWNED_KEYS: readonly string[] = [
  DRAFTS_KEY,
  LIBRARY_KEY,
  FAVORITES_KEY,
  RECENT_KEY,
  INTRO_KEY,
  MOTION_KEY,
  COLLECTIONS_KEY,
];

// ---------------------------------------------------------------------------
// The record shapes.

/** Which half of the product a record belongs to. */
export type RecordKind = "playground" | "sandbox";

/** The runtime list of the two kinds, because a union does not exist at runtime. */
export const RECORD_KINDS: readonly RecordKind[] = ["playground", "sandbox"];

/**
 * The four element kinds the Sandbox places (13-RESEARCH 3.1, D-03, D-08).
 * 13-14 owns the region model and may widen this; the shape lives here
 * because a Surface is what a sandbox record carries.
 */
export type ElementKind = "fader" | "button" | "knob" | "xy";

export const ELEMENT_KINDS: readonly ElementKind[] = [
  "fader",
  "button",
  "knob",
  "xy",
];

/**
 * One placed element. Cells are ZERO-based, 0..8, and the UI shows them
 * one-based through 13-14's named door. `channel` is 1..16 as the user sees
 * it; the wire's 0..15 is the compiler's business. `colour` is RGB444, the
 * picker's own resolution. `cc2` exists for the XY pad's second axis;
 * `latch` for a button only.
 */
export type Region = {
  readonly id: string;
  readonly name: string;
  readonly kind: ElementKind;
  readonly col: number;
  readonly row: number;
  readonly w: number;
  readonly h: number;
  readonly cc: number;
  readonly cc2?: number;
  readonly channel: number;
  readonly colour: readonly [number, number, number];
  readonly latch?: boolean;
};

/** A Sandbox surface: a region list and nothing else. No thumbnail, ever. */
export type Surface = {
  readonly id: string;
  readonly name: string;
  readonly regions: readonly Region[];
};

/**
 * The fields every record shares. `createdAt` is set once and never moves;
 * `editedAt` moves on every write (drafts.ts and library.ts both enforce it,
 * local.spec.ts test 7 holds it). Both are ISO-8601 strings, the format
 * snapshot.ts already stores as `takenAt`.
 */
type RecordBase = {
  readonly schema: typeof SCHEMA_VERSION;
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly editedAt: string;
};

/**
 * A Playground record: an entry and one knob index per knob. `source` is the
 * catalog entry id. The indices are what the share stamp encodes (D-13:
 * integer knob indices, never values), so a record and a stamp describe the
 * same thing and 13-13's import can validate one against the other.
 */
export type PlaygroundRecord = RecordBase & {
  readonly kind: "playground";
  readonly source: string;
  readonly knobIndices: readonly number[];
};

/**
 * A Sandbox record: a surface. `source` is the surface's own id, so "one
 * draft per source" reads the same for both kinds.
 */
export type SandboxRecord = RecordBase & {
  readonly kind: "sandbox";
  readonly source: string;
  readonly surface: Surface;
};

export type StoredRecord = PlaygroundRecord | SandboxRecord;

/** Editable working state, recovered locally. The word is DRAFT. */
export type Draft = StoredRecord;

/** A named snapshot that can be reopened or shared. The word is SAVED COPY. */
export type SavedCopy = StoredRecord;

/** One opened thing in the recently-used list. */
export type RecentItem = { readonly id: string; readonly at: string };

/** The returning-visitor flag (13-CONTEXT D-14 Q2). */
export type IntroFlag = {
  readonly schema: typeof SCHEMA_VERSION;
  readonly seen: true;
  readonly at: string;
};

// ---------------------------------------------------------------------------
// The validators. A record is what it is only if every field is; anything
// else is absent, never partial (the snapshot.ts rule).

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);

/** True for an envelope whose `schema` is THIS version. Any other version reads as absent. */
export function isEnvelope(value: unknown): value is { schema: 1 } {
  return isObject(value) && value.schema === SCHEMA_VERSION;
}

export function isRegion(value: unknown): value is Region {
  if (!isObject(value)) return false;
  if (!isString(value.id) || !isString(value.name)) return false;
  if (!ELEMENT_KINDS.includes(value.kind as ElementKind)) return false;
  for (const field of ["col", "row", "w", "h", "cc", "channel"]) {
    if (!isInt(value[field])) return false;
  }
  if (value.cc2 !== undefined && !isInt(value.cc2)) return false;
  if (value.latch !== undefined && typeof value.latch !== "boolean") {
    return false;
  }
  const colour = value.colour;
  if (!Array.isArray(colour) || colour.length !== 3) return false;
  return colour.every(isInt);
}

export function isSurface(value: unknown): value is Surface {
  if (!isObject(value)) return false;
  if (!isString(value.id) || !isString(value.name)) return false;
  return Array.isArray(value.regions) && value.regions.every(isRegion);
}

function hasBase(value: Record<string, unknown>): boolean {
  if (value.schema !== SCHEMA_VERSION) return false;
  return (
    isString(value.id) &&
    isString(value.name) &&
    isString(value.createdAt) &&
    isString(value.editedAt)
  );
}

/** A record only if it is one: the base, the kind, and the kind's own field. */
export function isStoredRecord(value: unknown): value is StoredRecord {
  if (!isObject(value) || !hasBase(value)) return false;
  if (!isString(value.source)) return false;
  if (value.kind === "playground") {
    return Array.isArray(value.knobIndices) && value.knobIndices.every(isInt);
  }
  if (value.kind === "sandbox") return isSurface(value.surface);
  return false;
}

export function isRecentItem(value: unknown): value is RecentItem {
  return isObject(value) && isString(value.id) && isString(value.at);
}

export function isIntroFlag(value: unknown): value is IntroFlag {
  if (!isObject(value) || value.schema !== SCHEMA_VERSION) return false;
  return value.seen === true && isString(value.at);
}
