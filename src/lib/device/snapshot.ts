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

/** One key, versioned in its name so a `.v2` can sit beside it and neither misreads the other. */
export const SNAPSHOT_KEY = "hangar.snapshot.v1";

/** The two strings a touch element holds, as fetched. */
export type EventPair = { readonly setup: string; readonly timer: string };

/**
 * Anything with the three methods; `undefined` during prerender. Never throws
 * out of this module whatever the store does. `removeItem` is in the shape
 * because return.ts's is and the caller hands one object to both - nothing in
 * this module calls it.
 */
export type SnapshotStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** One page's original, with the moment it was taken. */
type PageEntry = EventPair & { readonly takenAt: string };

/**
 * The one record under SNAPSHOT_KEY. Versioned in its key AND its body, so a
 * record written by a later schema under a reused key still reads as absent
 * here rather than as a half-understood one.
 */
type SnapshotRecord = {
  v: 1;
  /** The module this browser last identified, so PUT BACK can be offered (disabled) with no session. */
  last?: string;
  modules: Record<string, { pages: Record<string, PageEntry> }>;
};

/** What persistIfAbsent did. */
export type PersistOutcome = "written" | "kept" | "unavailable";

// ---------------------------------------------------------------------------
// Reading and writing the whole record, each inside its own try.

/** The one getItem, inside the one try. REFUSED when the store threw, so a writer can decline rather than write blind. */
const REFUSED = Symbol("refused");

function readRaw(store: SnapshotStore): string | null | typeof REFUSED {
  try {
    return store.getItem(SNAPSHOT_KEY);
  } catch {
    return REFUSED;
  }
}

/**
 * The record a raw value holds, or `undefined` when there is none worth
 * trusting. A value that is not JSON, JSON that is not an object, a version
 * other than 1 and a `modules` that is not an object all read as absent. The
 * page entries inside are NOT validated here - each is checked at the point it
 * is read, so one malformed entry never hides its neighbours.
 */
function parse(
  raw: string | null | typeof REFUSED,
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
  if (record.v !== 1) return undefined;
  if (typeof record.modules !== "object" || record.modules === null) {
    return undefined;
  }
  if (Array.isArray(record.modules)) return undefined;

  return {
    v: 1,
    last: typeof record.last === "string" ? record.last : undefined,
    modules: record.modules as SnapshotRecord["modules"],
  };
}

/** The whole record back through one setItem. False when the store refused. */
function save(store: SnapshotStore, record: SnapshotRecord): boolean {
  try {
    store.setItem(SNAPSHOT_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

/** An empty record, for a browser that has none or one this version cannot read. */
function fresh(): SnapshotRecord {
  return { v: 1, modules: {} };
}

/** A page entry only if it is one: two strings and a timestamp. Anything else is absent. */
function validEntry(value: unknown): PageEntry | undefined {
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
 * and wrong-version read as absent, never as a partial pair.
 */
export function readSnapshot(
  store: SnapshotStore | undefined,
  moduleId: string,
  page: number,
): EventPair | undefined {
  if (typeof store === "undefined") return undefined;
  const record = parse(readRaw(store));
  if (!record) return undefined;
  const pages = pagesOf(record, moduleId);
  if (!pages) return undefined;
  const entry = validEntry(pages[String(page)]);
  if (!entry) return undefined;
  return { setup: entry.setup, timer: entry.timer };
}

/**
 * Persist ONLY when no entry exists for this module and page.
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
 */
export function persistIfAbsent(
  store: SnapshotStore | undefined,
  moduleId: string,
  page: number,
  pair: EventPair,
  takenAt: string,
): PersistOutcome {
  if (typeof store === "undefined") return "unavailable";

  const raw = readRaw(store);
  if (raw === REFUSED) return "unavailable";

  // A record this version cannot read is replaced whole; there is nothing in
  // it this version could have written, so nothing in it is anybody's copy.
  const record = parse(raw) ?? fresh();
  const key = String(page);
  const pages = pagesOf(record, moduleId) ?? {};

  if (validEntry(pages[key])) return "kept";

  const next: SnapshotRecord = {
    ...record,
    modules: {
      ...record.modules,
      [moduleId]: {
        pages: {
          ...pages,
          [key]: { setup: pair.setup, timer: pair.timer, takenAt },
        } as Record<string, PageEntry>,
      },
    },
  };
  return save(store, next) ? "written" : "unavailable";
}

/**
 * Remember which module this browser last identified, so a fresh tab can offer
 * PUT BACK (disabled, `Needs your ZONA connected.`) before any session exists.
 * Nothing throws; a refusing store simply does not remember.
 */
export function rememberLast(
  store: SnapshotStore | undefined,
  moduleId: string,
): void {
  if (typeof store === "undefined") return;
  const raw = readRaw(store);
  if (raw === REFUSED) return;
  save(store, { ...(parse(raw) ?? fresh()), last: moduleId });
}

/** The module this browser last identified, or `undefined` when it never has. */
export function lastModuleId(
  store: SnapshotStore | undefined,
): string | undefined {
  if (typeof store === "undefined") return undefined;
  return parse(readRaw(store))?.last;
}

/** True when at least one valid page entry exists for the module. */
export function hasSnapshotFor(
  store: SnapshotStore | undefined,
  moduleId: string,
): boolean {
  if (typeof store === "undefined") return false;
  const record = parse(readRaw(store));
  if (!record) return false;
  const pages = pagesOf(record, moduleId);
  if (!pages) return false;
  return Object.values(pages).some((value) => validEntry(value) !== undefined);
}
