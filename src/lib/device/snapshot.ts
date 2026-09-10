// The module's original, kept somewhere a closed tab cannot reach.
//
// This is the first persistent state HANGAR has ever had, and it exists for one
// sentence in the requirements: PUT BACK survives a closed tab (SAFE-04). The
// install store takes the snapshot into MEMORY first and that copy is the
// safety rail; what lives here is the courtesy that makes the rail reach into a
// fresh tab. Four decisions a reader would otherwise reverse:
//
//  1. THE KEY IS THE MODULE'S SERIAL, NOT A HASH OF THE FETCHED STRINGS. The
//     32-character key comes from SERIALNUMBER/REPORT (07-01's moduleKeyOf), read
//     off the wire and addressed to the ZONA. A content key looks tidier and is
//     broken: the fetched strings change the instant TRY ON DEVICE writes, so a
//     record keyed by their hash stops finding its own snapshot at exactly the
//     moment PUT BACK matters. The serial is the one thing about the module
//     that a write does not change.
//
//  2. THE RECORD IS KEYED BY PAGE UNDERNEATH THE MODULE. A visitor can change
//     the ZONA's page between the snapshot and a write (07-RESEARCH Pitfall 4).
//     Firmware refuses a cross-page write with a NACK, which is a backstop and
//     not a design; the design is that page 3's original and page 1's original
//     are two entries, so a page change accumulates a second snapshot rather
//     than shadowing the first, and PUT BACK writes the page it snapshotted.
//
//  3. AN EXISTING PAGE ENTRY IS NEVER OVERWRITTEN. This record is the module's
//     ORIGINAL, not its latest. Once TRY ON DEVICE has written, a re-connect's
//     fetch returns HANGAR's own configuration; overwriting would destroy the
//     only copy of what the visitor came in with and PUT BACK would put HANGAR
//     back. persistIfAbsent says so in its name and returns "kept" when it
//     declined. A malformed entry is the one exception: it was never a copy of
//     anything, so a valid one may take its place.
//
//  4. NOTHING HERE DELETES ANYTHING. There is no clear, no forget, no remove
//     (07-UI-SPEC Z-13). Revoking the site's permission to see a module is not
//     a reason to destroy somebody's only copy of their own configuration, and
//     FORGET THIS ZONA's amended explanation promises exactly that. The store
//     type carries `removeItem` only because it is the shape return.ts
//     established and the caller hands the same object to both; NO FUNCTION IN
//     THIS MODULE CALLS removeItem, and snapshot.spec.ts scans for it.
//
// TWO KEYS SINCE PHASE 12 (12-03), AND THE OLDER ONE IS READ, NEVER WRITTEN.
// A `.v1` entry holds two strings; a `.v2` entry holds three, because HANGAR
// now writes the SYSTEM element's page-init slot as well as the touch
// element's Setup and Timer, and PUT BACK has to put all three back. Rules 3
// and 4 decide what happens to the records that already exist:
//
//   - `readSnapshot` reads v2 first. When there is none it reads v1 and
//     returns the entry with `system` set to the DEFAULT the caller passed in
//     and `fromV1: true` beside it, because a record taken before this phase
//     was taken from a module whose page-init slot HANGAR had never written -
//     which is to say a factory one. Writing the default back is therefore
//     leaving the module as the visitor found it, and it is never guessed
//     silently: the flag is on the returned entry and the store publishes it.
//   - `persistIfAbsent` writes v2 ONLY. It never writes v1 and never deletes
//     it: a record left by a schema this version does not own is not this
//     version's to touch, and a browser that opens an older deploy of HANGAR
//     after this one still finds its own record where it left it.
//
// THE DEFAULT COMES FROM THE CALLER, and it has to. This module imports
// NOTHING - snapshot.spec.ts test 1 asserts zero specifiers of any kind,
// `import type` included - and the string is a property of the pinned protocol
// package. install.svelte.ts already resolves that package lazily inside an
// action, so it passes the string in; the alternative would be a fourth static
// specifier on the first paint of `/c/{id}/` for a 24-character constant.
//
// THE STORE IS AN ARGUMENT AND THIS MODULE IMPORTS NOTHING. Zero specifiers,
// `import type` included, for the reason src/lib/browse/return.ts gives: the
// pages that call this are prerendered, and on the server there is no storage
// of any kind, so every function is a no-op on `undefined`. In the browser the
// caller passes `localStorage`, and it reads that property inside a try of its
// own, because a browser configured to refuse storage can throw on the property
// ACCESS and not only on use (07-RESEARCH Pitfall 9). The name of that global
// appears in this header and nowhere in the code; the spec strips the comments
// and checks.
//
// NOTHING HERE THROWS. A store that throws on getItem, a quota that is full on
// setItem, a record left by a schema this version does not know, JSON that is
// not JSON: every one of them degrades to "absent" or "unavailable", and the
// caller's in-memory copy stands. A missing courtesy may never be the reason a
// visitor has no way back.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/**
 * The key Phase 7 wrote and this version only READS. A v1 entry holds two
 * strings; nothing in this module writes it and nothing deletes it.
 */
export const SNAPSHOT_KEY = "hangar.snapshot.v1";

/** The key this version owns. Three strings per page entry (12-03). */
export const SNAPSHOT_KEY_V2 = "hangar.snapshot.v2";

/** The two strings a touch element holds, as fetched. */
export type EventPair = { readonly setup: string; readonly timer: string };

/** The three strings HANGAR writes: the page init, and the touch element's pair. */
export type ConfigTriple = EventPair & { readonly system: string };

/**
 * What readSnapshot hands back. `fromV1` is true when the record predates this
 * phase, so `system` is the default the caller passed rather than a string the
 * module ever handed over - the store publishes that fact instead of the
 * caller having to infer it.
 */
export type ReadEntry = ConfigTriple & { readonly fromV1: boolean };

/**
 * Anything with the three methods; `undefined` during prerender. Never throws
 * out of this module whatever the store does. `removeItem` is in the shape
 * because return.ts's is and the caller hands one object to both - nothing in
 * this module calls it.
 */
export type SnapshotStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** One page's original under the v1 key, with the moment it was taken. */
type PageEntryV1 = EventPair & { readonly takenAt: string };

/** One page's original under the v2 key. Three strings, or it is not an entry. */
type PageEntryV2 = ConfigTriple & { readonly takenAt: string };

/**
 * The one record under either key. Versioned in its key AND its body, so a
 * record written by a later schema under a reused key still reads as absent
 * here rather than as a half-understood one. The page entries inside are typed
 * `unknown`: each is validated at the point it is read, so one malformed entry
 * never hides its neighbours, and the two versions share this shape because
 * everything above the entries is identical between them.
 */
type SnapshotRecord = {
  v: 1 | 2;
  /** The module this browser last identified, so PUT BACK can be offered (disabled) with no session. */
  last?: string;
  modules: Record<string, { pages: Record<string, unknown> }>;
};

/** What persistIfAbsent did. */
export type PersistOutcome = "written" | "kept" | "unavailable";

// ---------------------------------------------------------------------------
// Reading and writing the whole record, each inside its own try.

/** The one getItem, inside the one try. REFUSED when the store threw, so a writer can decline rather than write blind. */
const REFUSED = Symbol("refused");

function readRaw(
  store: SnapshotStore,
  key: string,
): string | null | typeof REFUSED {
  try {
    return store.getItem(key);
  } catch {
    return REFUSED;
  }
}

/**
 * The record a raw value holds, or `undefined` when there is none worth
 * trusting. A value that is not JSON, JSON that is not an object, a version
 * other than the one asked for and a `modules` that is not an object all read
 * as absent.
 */
function parse(
  raw: string | null | typeof REFUSED,
  version: 1 | 2,
): SnapshotRecord | undefined {
  if (raw === REFUSED || raw === null) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (typeof parsed !== "object" || parsed === null) return undefined;

  const record = parsed as { v?: unknown; last?: unknown; modules?: unknown };
  if (record.v !== version) return undefined;
  if (typeof record.modules !== "object" || record.modules === null) {
    return undefined;
  }
  if (Array.isArray(record.modules)) return undefined;

  return {
    v: version,
    last: typeof record.last === "string" ? record.last : undefined,
    modules: record.modules as SnapshotRecord["modules"],
  };
}

/** The v2 record, read through its own key. The only record any function here writes. */
const readV2 = (store: SnapshotStore): SnapshotRecord | undefined =>
  parse(readRaw(store, SNAPSHOT_KEY_V2), 2);

/** The v1 record, read through its own key. Never written, never deleted. */
const readV1 = (store: SnapshotStore): SnapshotRecord | undefined =>
  parse(readRaw(store, SNAPSHOT_KEY), 1);

/** The whole v2 record back through one setItem. False when the store refused. */
function save(store: SnapshotStore, record: SnapshotRecord): boolean {
  try {
    store.setItem(SNAPSHOT_KEY_V2, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

/** An empty v2 record, for a browser that has none or one this version cannot read. */
function fresh(): SnapshotRecord {
  return { v: 2, modules: {} };
}

/** A v1 page entry only if it is one: two strings and a timestamp. Anything else is absent. */
function validV1(value: unknown): PageEntryV1 | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const entry = value as {
    setup?: unknown;
    timer?: unknown;
    takenAt?: unknown;
  };
  if (typeof entry.setup !== "string") return undefined;
  if (typeof entry.timer !== "string") return undefined;
  if (typeof entry.takenAt !== "string") return undefined;
  return { setup: entry.setup, timer: entry.timer, takenAt: entry.takenAt };
}

/**
 * A v2 page entry only if it is one: THREE strings and a timestamp. A v2 entry
 * missing `system` is absent rather than half-read - a half-read entry would
 * put an undefined string on the wire on the one click that exists to undo
 * every other one.
 */
function validV2(value: unknown): PageEntryV2 | undefined {
  const pair = validV1(value);
  if (!pair) return undefined;
  const entry = value as { system?: unknown };
  if (typeof entry.system !== "string") return undefined;
  return { system: entry.system, ...pair };
}

/** Predicate forms of the two validators, for the any-page scan below. */
const isV1 = (value: unknown): boolean => validV1(value) !== undefined;
const isV2 = (value: unknown): boolean => validV2(value) !== undefined;

/** The pages object for a module, or `undefined` when the module has none that is an object. */
function pagesOf(
  record: SnapshotRecord,
  moduleId: string,
): Record<string, unknown> | undefined {
  const entry: unknown = record.modules[moduleId];
  if (typeof entry !== "object" || entry === null) return undefined;
  const pages: unknown = (entry as { pages?: unknown }).pages;
  if (typeof pages !== "object" || pages === null) return undefined;
  if (Array.isArray(pages)) return undefined;
  return pages as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// The five functions the install store calls.

/**
 * The original strings for this module on this page, or `undefined`. Malformed
 * and wrong-version read as absent, never as a partial set.
 *
 * V2 FIRST, THEN V1. A v1 entry has no page-init string, so `systemDefault` -
 * the firmware's own, passed in by the store because this module imports
 * nothing - stands in for it and `fromV1` says so. That is not a guess: no
 * version of HANGAR before this phase ever wrote element 255, so the only
 * page init a module with a v1 record can have met is the factory one.
 */
export function readSnapshot(
  store: SnapshotStore | undefined,
  moduleId: string,
  page: number,
  systemDefault: string,
): ReadEntry | undefined {
  if (typeof store === "undefined") return undefined;
  const key = String(page);

  const current = readV2(store);
  const pagesV2 = current ? pagesOf(current, moduleId) : undefined;
  const entryV2 = pagesV2 ? validV2(pagesV2[key]) : undefined;
  if (entryV2) {
    return {
      system: entryV2.system,
      setup: entryV2.setup,
      timer: entryV2.timer,
      fromV1: false,
    };
  }

  const older = readV1(store);
  const pagesV1 = older ? pagesOf(older, moduleId) : undefined;
  const entryV1 = pagesV1 ? validV1(pagesV1[key]) : undefined;
  if (!entryV1) return undefined;
  return {
    system: systemDefault,
    setup: entryV1.setup,
    timer: entryV1.timer,
    fromV1: true,
  };
}

/**
 * Persist ONLY when no entry exists for this module and page, and ONLY under
 * the v2 key.
 *
 *   "written"     - the entry was absent (or malformed) and is now stored
 *   "kept"        - a valid entry already existed and was NOT touched; the
 *                   original wins, whatever the caller brought
 *   "unavailable" - no store, a store that throws, or a full quota; the
 *                   caller's in-memory copy stands and the copy says so
 *
 * A store whose getItem throws is "unavailable" rather than a blind write:
 * with no way to know whether an entry exists, writing could overwrite one,
 * and rule 3 outranks the courtesy.
 *
 * A V1 ENTRY FOR THE SAME PAGE IS "kept" TOO, and it is left exactly where it
 * is. Rule 3 is about the visitor's only copy, not about a key: writing a v2
 * entry beside a v1 one would put HANGAR's own configuration under the newer
 * key on a re-connect, and readSnapshot reads v2 first, so the original would
 * be shadowed rather than destroyed - which is the same loss with a longer
 * name.
 */
export function persistIfAbsent(
  store: SnapshotStore | undefined,
  moduleId: string,
  page: number,
  set: ConfigTriple,
  takenAt: string,
): PersistOutcome {
  if (typeof store === "undefined") return "unavailable";

  const raw = readRaw(store, SNAPSHOT_KEY_V2);
  if (raw === REFUSED) return "unavailable";

  // A record this version cannot read is replaced whole; there is nothing in
  // it this version could have written, so nothing in it is anybody's copy.
  const record = parse(raw, 2) ?? fresh();
  const key = String(page);
  const pages = pagesOf(record, moduleId) ?? {};

  if (validV2(pages[key])) return "kept";

  const older = readV1(store);
  const olderPages = older ? pagesOf(older, moduleId) : undefined;
  if (olderPages && validV1(olderPages[key])) return "kept";

  const next: SnapshotRecord = {
    ...record,
    modules: {
      ...record.modules,
      [moduleId]: {
        pages: {
          ...pages,
          [key]: {
            system: set.system,
            setup: set.setup,
            timer: set.timer,
            takenAt,
          },
        } as Record<string, PageEntryV2>,
      },
    },
  };
  return save(store, next) ? "written" : "unavailable";
}

/**
 * Remember which module this browser last identified, so a fresh tab can offer
 * PUT BACK (disabled, `Needs your ZONA connected.`) before any session exists.
 * Written under the v2 key, like everything else this version writes; nothing
 * throws, and a refusing store simply does not remember.
 */
export function rememberLast(
  store: SnapshotStore | undefined,
  moduleId: string,
): void {
  if (typeof store === "undefined") return;
  const raw = readRaw(store, SNAPSHOT_KEY_V2);
  if (raw === REFUSED) return;
  save(store, { ...(parse(raw, 2) ?? fresh()), last: moduleId });
}

/**
 * The module this browser last identified, or `undefined` when it never has.
 * Either key answers: a browser that connected before this phase and has not
 * connected since still has its `last` under v1.
 */
export function lastModuleId(
  store: SnapshotStore | undefined,
): string | undefined {
  if (typeof store === "undefined") return undefined;
  return readV2(store)?.last ?? readV1(store)?.last;
}

/** True when at least one valid page entry exists for the module, under either key. */
export function hasSnapshotFor(
  store: SnapshotStore | undefined,
  moduleId: string,
): boolean {
  if (typeof store === "undefined") return false;
  const current = readV2(store);
  const pagesV2 = current ? pagesOf(current, moduleId) : undefined;
  if (pagesV2 && Object.values(pagesV2).some(isV2)) return true;
  const older = readV1(store);
  const pagesV1 = older ? pagesOf(older, moduleId) : undefined;
  return pagesV1 !== undefined && Object.values(pagesV1).some(isV1);
}
