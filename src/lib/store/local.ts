// The guarded primitive under every local store: read, write, remove, each
// degrading to absent, with the store passed in.
//
// THIS IS THE FOURTH INSTANCE OF A SHAPE THAT HAS ALREADY SURVIVED
// PRERENDERING, QUOTA AND A HOSTILE BROWSER. src/lib/device/snapshot.ts,
// src/lib/browse/return.ts and the retired ScreenToggle.svelte (now
// src/lib/sim/motion.svelte.ts) all do the same three things, and this module
// copies them rather than rediscovering them:
//
//  1. THE STORE IS AN ARGUMENT. `+layout.ts` sets `prerender = true`, so every
//     page that calls a store renders first on a server where no storage of
//     any kind exists; a module that touched localStorage at import time
//     would fail `npm run build` and nowhere else. Every function here is a
//     no-op on `undefined`, the caller passes the real store from inside an
//     effect or a click, and the name of that global appears in this header
//     and nowhere in the code - local.spec.ts strips the comments and checks.
//
//  2. THE PROPERTY ACCESS IS INSIDE THE TRY. A browser configured to refuse
//     storage can throw on `store.getItem` - the ACCESS - and not only on the
//     call (07-RESEARCH Pitfall 9). `store.getItem(key)` is one expression and
//     the whole of it sits inside the try, so a store that throws on access, a
//     store that throws on use and a store that is not there all land in the
//     same catch. local.spec.ts test 4 hands in a Proxy that throws on every
//     property access; moving the access outside the try turns it red.
//
//  3. NOTHING HERE THROWS, AND A READ DEGRADES SILENTLY WHILE A WRITE TELLS
//     ITS CALLER. A key that is not there, a value that is not JSON, JSON of
//     the wrong shape and a store that refuses all read as `undefined`: a
//     missing courtesy may never be the reason a page fails to paint. But a
//     write that is dropped on a DRAFT is a lost draft, so writeJson returns
//     `false` when setItem throws - a full quota, a private window - and the
//     caller decides what to say. Silence is the reader's privilege, not the
//     writer's.
//
// THE READER NEVER REPAIRS BY DELETING. A value that will not parse is left
// exactly where it is: it is evidence of what went wrong, and a later version
// of HANGAR - or a person with the developer tools open - may be able to read
// it. A WRITER may replace it, because there is no other way to store
// anything under that key, and snapshot.ts makes the same call ("a record
// this version cannot read is replaced whole"). The distinction is the whole
// of test 2.
//
// probe() IS THE HONEST READ, AND readJson() IS ITS CONVENIENCE. A store that
// does read-modify-write - drafts.ts, library.ts, favorites.ts, recent.ts -
// must not write blind after a read the store REFUSED: with no way to know
// what is there, writing a fresh record could destroy every draft a visitor
// has. So probe() tells absent from corrupt from refused, the read-modify-
// write stores decline on refused and replace on corrupt, and readJson()
// collapses all three to `undefined` for a caller that only wants the value.
// This is snapshot.ts's REFUSED symbol, given a name a reader can print.
//
// THE MOTION KEY IS NOT JSON, so readString and writeString exist beside the
// JSON pair. 13-04 stored the bare word `animated` or `still` and
// e2e/browse.e2e.ts writes it that way; folding the key in here must not move
// that behaviour (13-06's rule), and JSON.parse("animated") throws.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/**
 * Anything with the three methods; `undefined` during prerender. In the
 * browser the caller passes the persistent store; in a test, three closures
 * over a Map. The same shape return.ts and snapshot.ts declare, so one object
 * can be handed to all of them.
 */
export type LocalStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** What a probe found. `present` carries the validated value. */
export type Probe<T> =
  | { readonly state: "present"; readonly value: T }
  | { readonly state: "absent" }
  | { readonly state: "corrupt" }
  | { readonly state: "refused" };

const ABSENT: Probe<never> = { state: "absent" };
const CORRUPT: Probe<never> = { state: "corrupt" };
const REFUSED: Probe<never> = { state: "refused" };

/**
 * The raw string under a key, or `null` when the key is not there, or
 * `undefined` when the store refused - no store, or a store that threw on
 * access or on use. The one getItem, inside the one try.
 */
export function readString(
  store: LocalStore | undefined,
  key: string,
): string | null | undefined {
  if (typeof store === "undefined") return undefined;
  try {
    return store.getItem(key);
  } catch {
    return undefined;
  }
}

/**
 * One setItem, inside one try. `true` when the value is stored, `false` when
 * the store refused: no store, a full quota, a private window, a store that
 * throws on access. The caller is told; it is never thrown at.
 */
export function writeString(
  store: LocalStore | undefined,
  key: string,
  value: string,
): boolean {
  if (typeof store === "undefined") return false;
  try {
    store.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * The value under a key, classified. A `null` from the store is absent; a
 * value that will not parse, or parses to something the validator rejects,
 * is corrupt AND IS LEFT IN PLACE; a store that refused is refused.
 */
export function probe<T>(
  store: LocalStore | undefined,
  key: string,
  isValid: (value: unknown) => value is T,
): Probe<T> {
  const raw = readString(store, key);
  if (raw === undefined) return REFUSED;
  if (raw === null) return ABSENT;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return CORRUPT;
  }
  return isValid(parsed) ? { state: "present", value: parsed } : CORRUPT;
}

/**
 * The validated value under a key, or `undefined` for every other outcome.
 * The validator is REQUIRED: "JSON of the wrong shape" is a failure mode of
 * its own (test 2), and a reader that trusts JSON.parse's result hands a
 * record with a missing field to a caller that will render against it.
 */
export function readJson<T>(
  store: LocalStore | undefined,
  key: string,
  isValid: (value: unknown) => value is T,
): T | undefined {
  const found = probe(store, key, isValid);
  return found.state === "present" ? found.value : undefined;
}

/**
 * JSON.stringify then one setItem. `false` when the store refused or the
 * value cannot be serialised - a cycle, a BigInt - which is a caller's bug
 * and is reported the same way rather than thrown, because a page whose
 * draft would not save must still be a page.
 */
export function writeJson(
  store: LocalStore | undefined,
  key: string,
  value: unknown,
): boolean {
  let text: string;
  try {
    text = JSON.stringify(value);
  } catch {
    return false;
  }
  if (typeof text !== "string") return false;
  return writeString(store, key, text);
}

/**
 * One removeItem, inside one try. `true` when the store accepted the call -
 * removing a key that was never there is a success, as it is for Storage -
 * and `false` when it refused. Nothing in this module calls it on its own
 * initiative: a removal is always a caller's explicit act.
 */
export function removeKey(store: LocalStore | undefined, key: string): boolean {
  if (typeof store === "undefined") return false;
  try {
    store.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
