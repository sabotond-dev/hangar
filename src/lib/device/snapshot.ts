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
// THREE KEYS SINCE PHASE 12.1 (12-03, 12.1-07), AND THE OLDER ONES ARE READ,
// NEVER WRITTEN. A `.v1` entry holds two strings; a `.v2` entry holds three,
// because since Phase 12 HANGAR writes the SYSTEM element's page-init slot as
// well as the touch element's Setup and Timer; a `.v3` entry holds four,
// because since Phase 12.1 (D-03) it writes the system element's Timer too -
// the library's second half - and PUT BACK has to put all four back. Rules 3
// and 4 decide what happens to the records that already exist, and 12-03's
// two rules are repeated here one version on, verbatim in their shape:
//
//   - `readSnapshot` reads v3 first. When there is none it reads v2 and
//     returns the entry with `systemTimer` set to the DEFAULT the caller
//     passed in and `fromV2: true` beside it, because a record taken before
//     Phase 12.1 was taken from a module whose system-timer slot HANGAR had
//     never written - which is to say a factory one (12.1 D-22). When there
//     is no v2 entry either it reads v1 and returns the entry with `system`
//     set to the caller's OTHER default and `fromV1: true` beside it, for the
//     same reason one phase earlier; a v1 entry has neither system string, so
//     BOTH defaults stand in and `fromV1` alone says so. Writing a default
//     back is therefore leaving the module as the visitor found it, and it is
//     never guessed silently: the flags are on the returned entry and the
//     store publishes them.
//   - `persistIfAbsent` writes v3 ONLY. It never writes v2 or v1 and never
//     deletes either: a record left by a schema this version does not own is
//     not this version's to touch, and a browser that opens an older deploy
//     of HANGAR after this one still finds its own record where it left it.
//     An older entry for the same module and page is "kept" too, exactly as
//     12-03 ruled for v1 under v2, because a v3 entry beside it would SHADOW
//     it on the next read, which is the same loss with a longer name.
//
// THE DEFAULTS COME FROM THE CALLER, and they have to. This module imports
// NOTHING - snapshot.spec.ts test 1 asserts zero specifiers of any kind,
// `import type` included - and both strings are properties of the pinned
// protocol package. install.svelte.ts already resolves that package lazily
// inside an action, so it passes them in; the alternative would be a fifth
// static specifier on the first paint of `/playground/{id}/` for a
// 24-character and a 22-character constant.
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

/**
 * The key Phase 12 wrote (12-03) and this version only READS. A v2 entry holds
 * three strings; nothing in this module writes it and nothing deletes it.
 */
export const SNAPSHOT_KEY_V2 = "hangar.snapshot.v2";

/** The key this version owns. Four strings per page entry (12.1-07). */
export const SNAPSHOT_KEY_V3 = "hangar.snapshot.v3";

/** The two strings a touch element holds, as fetched. */
export type EventPair = { readonly setup: string; readonly timer: string };

/** The three strings Phase 12 wrote: the page init, and the touch element's pair. */
export type ConfigTriple = EventPair & { readonly system: string };

/** The four strings HANGAR writes since 12.1: the system timer beside the three. */
export type ConfigQuad = ConfigTriple & { readonly systemTimer: string };

/**
 * What readSnapshot hands back. `fromV1` is true when the record predates
 * Phase 12, so `system` (and `systemTimer`) is the default the caller passed
 * rather than a string the module ever handed over; `fromV2` is true when it
 * predates Phase 12.1, so `systemTimer` is. At most one is true - each names
 * the key the entry was read from - and the store publishes both instead of
 * the caller having to infer them.
 */
export type ReadEntry = ConfigQuad & {
  readonly fromV1: boolean;
  readonly fromV2: boolean;
};

/** The two defaults a read substitutes, passed in by the caller (see the header). */
export type SnapshotDefaults = {
  readonly system: string;
  readonly systemTimer: string;
};

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

/** One page's original under the v3 key. Four strings, or it is not an entry. */
type PageEntryV3 = ConfigQuad & { readonly takenAt: string };

/** The versions a record can carry, one per key. */
type Version = 1 | 2 | 3;

/**
 * The one record under any of the keys. Versioned in its key AND its body, so
 * a record written by a later schema under a reused key still reads as absent
 * here rather than as a half-understood one. The page entries inside are typed
 * `unknown`: each is validated at the point it is read, so one malformed entry
 * never hides its neighbours, and the three versions share this shape because
 * everything above the entries is identical between them.
 */
type SnapshotRecord = {
  v: Version;
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
  version: Version,
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

/** The v3 record, read through its own key. The only record any function here writes. */
const readV3 = (store: SnapshotStore): SnapshotRecord | undefined =>
  parse(readRaw(store, SNAPSHOT_KEY_V3), 3);

/** The v2 record, read through its own key. Never written, never deleted. */
const readV2 = (store: SnapshotStore): SnapshotRecord | undefined =>
  parse(readRaw(store, SNAPSHOT_KEY_V2), 2);

/** The v1 record, read through its own key. Never written, never deleted. */
const readV1 = (store: SnapshotStore): SnapshotRecord | undefined =>
  parse(readRaw(store, SNAPSHOT_KEY), 1);

/** The whole v3 record back through one setItem. False when the store refused. */
function save(store: SnapshotStore, record: SnapshotRecord): boolean {
  try {
    store.setItem(SNAPSHOT_KEY_V3, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

/** An empty v3 record, for a browser that has none or one this version cannot read. */
function fresh(): SnapshotRecord {
  return { v: 3, modules: {} };
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

/**
 * A v3 page entry only if it is one: FOUR strings and a timestamp. A v3 entry
 * missing `systemTimer` is absent rather than half-read, for the reason validV2
 * gives one string earlier.
 */
function validV3(value: unknown): PageEntryV3 | undefined {
  const triple = validV2(value);
  if (!triple) return undefined;
  const entry = value as { systemTimer?: unknown };
  if (typeof entry.systemTimer !== "string") return undefined;
  return { systemTimer: entry.systemTimer, ...triple };
}

/** Predicate forms of the three validators, for the any-page scan below. */
const isV1 = (value: unknown): boolean => validV1(value) !== undefined;
const isV2 = (value: unknown): boolean => validV2(value) !== undefined;
const isV3 = (value: unknown): boolean => validV3(value) !== undefined;

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
 * V3 FIRST, THEN V2, THEN V1. A v2 entry has no system-timer string, so
 * `defaults.systemTimer` - the firmware's own, passed in by the store because
 * this module imports nothing - stands in for it and `fromV2` says so. A v1
 * entry has no page-init string either, so `defaults.system` stands in for
 * that as well and `fromV1` says so. Neither is a guess: no version of HANGAR
 * before Phase 12 ever wrote element 255, and none before Phase 12.1 wrote
 * its Timer, so the only string a module with an older record can have met
 * in the slot the record lacks is the factory one.
 */
export function readSnapshot(
  store: SnapshotStore | undefined,
  moduleId: string,
  page: number,
  defaults: SnapshotDefaults,
): ReadEntry | undefined {
  if (typeof store === "undefined") return undefined;
  const key = String(page);

  const current = readV3(store);
  const pagesV3 = current ? pagesOf(current, moduleId) : undefined;
  const entryV3 = pagesV3 ? validV3(pagesV3[key]) : undefined;
  if (entryV3) {
    return {
      systemTimer: entryV3.systemTimer,
      system: entryV3.system,
      setup: entryV3.setup,
      timer: entryV3.timer,
      fromV1: false,
      fromV2: false,
    };
  }

  const middle = readV2(store);
  const pagesV2 = middle ? pagesOf(middle, moduleId) : undefined;
  const entryV2 = pagesV2 ? validV2(pagesV2[key]) : undefined;
  if (entryV2) {
    return {
      systemTimer: defaults.systemTimer,
      system: entryV2.system,
      setup: entryV2.setup,
      timer: entryV2.timer,
      fromV1: false,
      fromV2: true,
    };
  }

  const older = readV1(store);
  const pagesV1 = older ? pagesOf(older, moduleId) : undefined;
  const entryV1 = pagesV1 ? validV1(pagesV1[key]) : undefined;
  if (!entryV1) return undefined;
  return {
    systemTimer: defaults.systemTimer,
    system: defaults.system,
    setup: entryV1.setup,
    timer: entryV1.timer,
    fromV1: true,
    fromV2: false,
  };
}

/**
 * Persist ONLY when no entry exists for this module and page, and ONLY under
 * the v3 key.
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
 * A V2 OR V1 ENTRY FOR THE SAME PAGE IS "kept" TOO, and it is left exactly
 * where it is. Rule 3 is about the visitor's only copy, not about a key:
 * writing a v3 entry beside an older one would put HANGAR's own configuration
 * under the newest key on a re-connect, and readSnapshot reads v3 first, so
 * the original would be shadowed rather than destroyed - which is the same
 * loss with a longer name.
 */
export function persistIfAbsent(
  store: SnapshotStore | undefined,
  moduleId: string,
  page: number,
  set: ConfigQuad,
  takenAt: string,
): PersistOutcome {
  if (typeof store === "undefined") return "unavailable";

  const raw = readRaw(store, SNAPSHOT_KEY_V3);
  if (raw === REFUSED) return "unavailable";

  // A record this version cannot read is replaced whole; there is nothing in
  // it this version could have written, so nothing in it is anybody's copy.
  const record = parse(raw, 3) ?? fresh();
  const key = String(page);
  const pages = pagesOf(record, moduleId) ?? {};

  if (validV3(pages[key])) return "kept";

  const middle = readV2(store);
  const middlePages = middle ? pagesOf(middle, moduleId) : undefined;
  if (middlePages && validV2(middlePages[key])) return "kept";

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
            systemTimer: set.systemTimer,
            system: set.system,
            setup: set.setup,
            timer: set.timer,
            takenAt,
          },
        } as Record<string, PageEntryV3>,
      },
    },
  };
  return save(store, next) ? "written" : "unavailable";
}

/**
 * Remember which module this browser last identified, so a fresh tab can offer
 * PUT BACK (disabled, `Needs your ZONA connected.`) before any session exists.
 * Written under the v3 key, like everything else this version writes; nothing
 * throws, and a refusing store simply does not remember.
 */
export function rememberLast(
  store: SnapshotStore | undefined,
  moduleId: string,
): void {
  if (typeof store === "undefined") return;
  const raw = readRaw(store, SNAPSHOT_KEY_V3);
  if (raw === REFUSED) return;
  save(store, { ...(parse(raw, 3) ?? fresh()), last: moduleId });
}

/**
 * The module this browser last identified, or `undefined` when it never has.
 * Any key answers: a browser that connected before this phase and has not
 * connected since still has its `last` under v2 or v1.
 */
export function lastModuleId(
  store: SnapshotStore | undefined,
): string | undefined {
  if (typeof store === "undefined") return undefined;
  return readV3(store)?.last ?? readV2(store)?.last ?? readV1(store)?.last;
}

/** True when at least one valid page entry exists for the module, under any key. */
export function hasSnapshotFor(
  store: SnapshotStore | undefined,
  moduleId: string,
): boolean {
  if (typeof store === "undefined") return false;
  const current = readV3(store);
  const pagesV3 = current ? pagesOf(current, moduleId) : undefined;
  if (pagesV3 && Object.values(pagesV3).some(isV3)) return true;
  const middle = readV2(store);
  const pagesV2 = middle ? pagesOf(middle, moduleId) : undefined;
  if (pagesV2 && Object.values(pagesV2).some(isV2)) return true;
  const older = readV1(store);
  const pagesV1 = older ? pagesOf(older, moduleId) : undefined;
  return pagesV1 !== undefined && Object.values(pagesV1).some(isV1);
}
