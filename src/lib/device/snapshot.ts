// The module's original, kept where a closed tab cannot reach it (SAFE-04: PUT
// BACK survives a closed tab); the install store's in-memory copy is the safety
// rail, this the courtesy that reaches a fresh tab. Four rules: (1) the key is
// the module's SERIAL, not a hash of strings a write changes; (2) entries are
// keyed by page under the module; (3) an existing page entry is NEVER
// overwritten - persistIfAbsent returns "kept"; (4) nothing here deletes. Four
// keys, v1..v4 (two to five strings): v4 is written, the older three read and
// never touched, the caller's firmware defaults standing in for the strings an
// older entry lacks (fromV1 / fromV2 / fromV3 say which). Imports nothing, names
// no window: the caller passes localStorage; no-op on undefined; nothing throws.
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

/**
 * The key Phase 12.1 wrote (12.1-07) and this version only READS. A v3 entry
 * holds four strings; nothing in this module writes it and nothing deletes it.
 */
export const SNAPSHOT_KEY_V3 = "hangar.snapshot.v3";

/** The key this version owns. Five strings per page entry (13-17). */
export const SNAPSHOT_KEY_V4 = "hangar.snapshot.v4";

/** The two strings a touch element holds, as fetched. */
export type EventPair = { readonly setup: string; readonly timer: string };

/** The three strings Phase 12 wrote: the page init, and the touch element's pair. */
export type ConfigTriple = EventPair & { readonly system: string };

/** The four strings HANGAR wrote from 12.1 to 13-17: the system timer beside the three. */
export type ConfigQuad = ConfigTriple & { readonly systemTimer: string };

/** The five strings HANGAR writes since 13-17: the system utility beside the four. */
export type ConfigQuint = ConfigQuad & { readonly systemUtility: string };

/**
 * What readSnapshot hands back. `fromV1` is true when the record predates
 * Phase 12, so `system` (and `systemTimer` and `systemUtility`) is the
 * default the caller passed rather than a string the module ever handed
 * over; `fromV2` is true when it predates Phase 12.1, so `systemTimer` (and
 * `systemUtility`) is; `fromV3` is true when it predates 13-17, so
 * `systemUtility` is. At most one is true - each names the key the entry
 * was read from - and the store publishes all three instead of the caller
 * having to infer them. "The utility slot is a default" is any of the three.
 */
export type ReadEntry = ConfigQuint & {
  readonly fromV1: boolean;
  readonly fromV2: boolean;
  readonly fromV3: boolean;
};

/** The three defaults a read substitutes, passed in by the caller: this module imports nothing. */
export type SnapshotDefaults = {
  readonly system: string;
  readonly systemTimer: string;
  readonly systemUtility: string;
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

/** One page's original under the v4 key. Five strings, or it is not an entry. */
type PageEntryV4 = ConfigQuint & { readonly takenAt: string };

/** The versions a record can carry, one per key. */
type Version = 1 | 2 | 3 | 4;

/**
 * The one record under any of the keys. Versioned in its key AND its body, so
 * a record written by a later schema under a reused key still reads as absent
 * here rather than as a half-understood one. The page entries inside are typed
 * `unknown`: each is validated at the point it is read, so one malformed entry
 * never hides its neighbours, and the four versions share this shape because
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

/** The v4 record, read through its own key. The only record any function here writes. */
const readV4 = (store: SnapshotStore): SnapshotRecord | undefined =>
  parse(readRaw(store, SNAPSHOT_KEY_V4), 4);

/** The v3 record, read through its own key. Never written, never deleted. */
const readV3 = (store: SnapshotStore): SnapshotRecord | undefined =>
  parse(readRaw(store, SNAPSHOT_KEY_V3), 3);

/** The v2 record, read through its own key. Never written, never deleted. */
const readV2 = (store: SnapshotStore): SnapshotRecord | undefined =>
  parse(readRaw(store, SNAPSHOT_KEY_V2), 2);

/** The v1 record, read through its own key. Never written, never deleted. */
const readV1 = (store: SnapshotStore): SnapshotRecord | undefined =>
  parse(readRaw(store, SNAPSHOT_KEY), 1);

/** The whole v4 record back through one setItem. False when the store refused. */
function save(store: SnapshotStore, record: SnapshotRecord): boolean {
  try {
    store.setItem(SNAPSHOT_KEY_V4, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

/** An empty v4 record, for a browser that has none or one this version cannot read. */
function fresh(): SnapshotRecord {
  return { v: 4, modules: {} };
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

/**
 * A v4 page entry only if it is one: FIVE strings and a timestamp. A v4 entry
 * missing `systemUtility` is absent rather than half-read, for the reason
 * validV2 gives two strings earlier.
 */
function validV4(value: unknown): PageEntryV4 | undefined {
  const quad = validV3(value);
  if (!quad) return undefined;
  const entry = value as { systemUtility?: unknown };
  if (typeof entry.systemUtility !== "string") return undefined;
  return { systemUtility: entry.systemUtility, ...quad };
}

/** Predicate forms of the four validators, for the any-page scan below. */
const isV1 = (value: unknown): boolean => validV1(value) !== undefined;
const isV2 = (value: unknown): boolean => validV2(value) !== undefined;
const isV3 = (value: unknown): boolean => validV3(value) !== undefined;
const isV4 = (value: unknown): boolean => validV4(value) !== undefined;

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
 * V4 FIRST, THEN V3, THEN V2, THEN V1. A v3 entry has no utility string, so
 * `defaults.systemUtility` - the firmware's own page-next, passed in by the
 * store because this module imports nothing - stands in for it and `fromV3`
 * says so. A v2 entry has no system-timer string either, so
 * `defaults.systemTimer` stands in as well and `fromV2` says so. A v1 entry
 * has no page-init string, so `defaults.system` stands in for that too and
 * `fromV1` says so. None is a guess: no version of HANGAR before Phase 12
 * ever wrote element 255, none before Phase 12.1 wrote its Timer, and none
 * before 13-17 wrote its utility, so the only string a module with an older
 * record can have met in the slot the record lacks is the factory one.
 */
export function readSnapshot(
  store: SnapshotStore | undefined,
  moduleId: string,
  page: number,
  defaults: SnapshotDefaults,
): ReadEntry | undefined {
  if (typeof store === "undefined") return undefined;
  const key = String(page);

  const current = readV4(store);
  const pagesV4 = current ? pagesOf(current, moduleId) : undefined;
  const entryV4 = pagesV4 ? validV4(pagesV4[key]) : undefined;
  if (entryV4) {
    return {
      systemTimer: entryV4.systemTimer,
      system: entryV4.system,
      systemUtility: entryV4.systemUtility,
      setup: entryV4.setup,
      timer: entryV4.timer,
      fromV1: false,
      fromV2: false,
      fromV3: false,
    };
  }

  const previous = readV3(store);
  const pagesV3 = previous ? pagesOf(previous, moduleId) : undefined;
  const entryV3 = pagesV3 ? validV3(pagesV3[key]) : undefined;
  if (entryV3) {
    return {
      systemTimer: entryV3.systemTimer,
      system: entryV3.system,
      systemUtility: defaults.systemUtility,
      setup: entryV3.setup,
      timer: entryV3.timer,
      fromV1: false,
      fromV2: false,
      fromV3: true,
    };
  }

  const middle = readV2(store);
  const pagesV2 = middle ? pagesOf(middle, moduleId) : undefined;
  const entryV2 = pagesV2 ? validV2(pagesV2[key]) : undefined;
  if (entryV2) {
    return {
      systemTimer: defaults.systemTimer,
      system: entryV2.system,
      systemUtility: defaults.systemUtility,
      setup: entryV2.setup,
      timer: entryV2.timer,
      fromV1: false,
      fromV2: true,
      fromV3: false,
    };
  }

  const older = readV1(store);
  const pagesV1 = older ? pagesOf(older, moduleId) : undefined;
  const entryV1 = pagesV1 ? validV1(pagesV1[key]) : undefined;
  if (!entryV1) return undefined;
  return {
    systemTimer: defaults.systemTimer,
    system: defaults.system,
    systemUtility: defaults.systemUtility,
    setup: entryV1.setup,
    timer: entryV1.timer,
    fromV1: true,
    fromV2: false,
    fromV3: false,
  };
}

/**
 * Persist ONLY when no entry exists for this module and page, and ONLY under
 * the v4 key.
 *
 *   "written"     - the entry was absent (or malformed) and is now stored
 *   "kept"        - a valid entry already existed and was NOT touched; the
 *                   original wins, whatever the caller brought
 *   "unavailable" - no store, a store that throws, or a full quota; the
 *                   caller's in-memory copy stands and the copy says so
 *
 * A store whose getItem throws is "unavailable" rather than a blind write:
 * with no way to know whether an entry exists, writing could overwrite one,
 * and never overwriting (rule 3) outranks the courtesy.
 *
 * A V3, V2 OR V1 ENTRY FOR THE SAME PAGE IS "kept" TOO, and it is left
 * exactly where it is. Never overwriting (rule 3) is about the visitor's only copy, not about a
 * key: writing a v4 entry beside an older one would put HANGAR's own
 * configuration under the newest key on a re-connect, and readSnapshot reads
 * v4 first, so the original would be shadowed rather than destroyed - which
 * is the same loss with a longer name.
 */
export function persistIfAbsent(
  store: SnapshotStore | undefined,
  moduleId: string,
  page: number,
  set: ConfigQuint,
  takenAt: string,
): PersistOutcome {
  if (typeof store === "undefined") return "unavailable";

  const raw = readRaw(store, SNAPSHOT_KEY_V4);
  if (raw === REFUSED) return "unavailable";

  // A record this version cannot read is replaced whole; there is nothing in
  // it this version could have written, so nothing in it is anybody's copy.
  const record = parse(raw, 4) ?? fresh();
  const key = String(page);
  const pages = pagesOf(record, moduleId) ?? {};

  if (validV4(pages[key])) return "kept";

  const previous = readV3(store);
  const previousPages = previous ? pagesOf(previous, moduleId) : undefined;
  if (previousPages && validV3(previousPages[key])) return "kept";

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
            systemUtility: set.systemUtility,
            setup: set.setup,
            timer: set.timer,
            takenAt,
          },
        } as Record<string, PageEntryV4>,
      },
    },
  };
  return save(store, next) ? "written" : "unavailable";
}

/**
 * Remember which module this browser last identified, so a fresh tab can offer
 * PUT BACK (disabled, `Needs your ZONA connected.`) before any session exists.
 * Written under the v4 key, like everything else this version writes; nothing
 * throws, and a refusing store simply does not remember.
 */
export function rememberLast(
  store: SnapshotStore | undefined,
  moduleId: string,
): void {
  if (typeof store === "undefined") return;
  const raw = readRaw(store, SNAPSHOT_KEY_V4);
  if (raw === REFUSED) return;
  save(store, { ...(parse(raw, 4) ?? fresh()), last: moduleId });
}

/**
 * The module this browser last identified, or `undefined` when it never has.
 * Any key answers: a browser that connected before this phase and has not
 * connected since still has its `last` under v3, v2 or v1.
 */
export function lastModuleId(
  store: SnapshotStore | undefined,
): string | undefined {
  if (typeof store === "undefined") return undefined;
  return (
    readV4(store)?.last ??
    readV3(store)?.last ??
    readV2(store)?.last ??
    readV1(store)?.last
  );
}

/** True when at least one valid page entry exists for the module, under any key. */
export function hasSnapshotFor(
  store: SnapshotStore | undefined,
  moduleId: string,
): boolean {
  if (typeof store === "undefined") return false;
  const current = readV4(store);
  const pagesV4 = current ? pagesOf(current, moduleId) : undefined;
  if (pagesV4 && Object.values(pagesV4).some(isV4)) return true;
  const previous = readV3(store);
  const pagesV3 = previous ? pagesOf(previous, moduleId) : undefined;
  if (pagesV3 && Object.values(pagesV3).some(isV3)) return true;
  const middle = readV2(store);
  const pagesV2 = middle ? pagesOf(middle, moduleId) : undefined;
  if (pagesV2 && Object.values(pagesV2).some(isV2)) return true;
  const older = readV1(store);
  const pagesV1 = older ? pagesOf(older, moduleId) : undefined;
  return pagesV1 !== undefined && Object.values(pagesV1).some(isV1);
}
