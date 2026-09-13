// The guarded primitive under every local store: read, write, remove, each
// degrading to absent, with the store passed in (snapshot.ts's and return.ts's
// shape). Three rules: (1) the store is an ARGUMENT - every page prerenders on a
// server with no storage, so every function is a no-op on undefined and the
// caller passes localStorage from an effect or a click; this module imports
// nothing and names no window; (2) the property ACCESS is inside the try - a
// refusing browser can throw on `store.getItem` itself; (3) nothing throws - a
// read degrades silently, a write returns false. The reader never repairs by
// deleting; a writer may replace. probe() tells absent from corrupt from REFUSED
// so no store writes blind after a refused read; readJson() collapses the three.
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
