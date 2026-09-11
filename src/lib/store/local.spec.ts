// The local stores: one test per failure mode, then one per rule.
//
// There is no jsdom and no browser Vitest project in this repository
// (04-RESEARCH Pitfall 6), so the store is a three-method object over a Map,
// exactly as src/lib/device/snapshot.spec.ts and src/lib/browse/return.spec.ts
// build it. The fakes below are snapshot.spec.ts's, copied with their names
// rather than written a second way: a store that throws on every METHOD
// (HOSTILE_STORE), a store that reads and refuses every write (fullStore), and
// - the one this module adds - a store that throws on every PROPERTY ACCESS
// (ACCESS_THROWS), because a browser configured to refuse storage throws when
// `getItem` is read off the object and not only when it is called
// (07-RESEARCH Pitfall 9).
//
// The mutations these tests exist to catch, by number: the property access
// moved outside the try (4); writeJson swallowing the quota error (3); a v2
// reader falling back to the v1 key (5); a reader that deletes what it cannot
// parse (2); a cap or a dedupe dropped from recent (6); an edit moving
// createdAt (7); favorites showing a shorter list without saying so (8); a
// saved copy overwritten from its source, or the intro flag written on a
// refusing store (9).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  probe,
  readJson,
  readString,
  removeKey,
  writeJson,
  writeString,
  type LocalStore,
} from "./local";
import {
  COLLECTIONS_KEY_RESERVED,
  DRAFTS_KEY,
  FAVORITES_KEY,
  INTRO_KEY,
  LIBRARY_KEY,
  MOTION_KEY,
  OWNED_KEYS,
  RECENT_KEY,
  SCHEMA_VERSION,
  isEnvelope,
  isStoredRecord,
  storeKey,
} from "./schema";

const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));

/** The house comment stripper (src/lib/config-shape.spec.ts), backslash-free. */
const strip = (source: string) =>
  source.replace(/^[ ]*[/][/].*$/gm, "").replace(/[/][*][^]*?[*][/]/g, "");

/**
 * Everything a Storage is, for this module's purposes, over a Map - and a log
 * of every key getItem was asked for, so test 5 can prove a record was never
 * OPENED rather than merely never changed.
 */
function fakeStore() {
  const map = new Map<string, string>();
  const asked: string[] = [];
  const store: LocalStore = {
    getItem: (key: string) => {
      asked.push(key);
      return map.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
  return { map, asked, store };
}

/** A store that throws on every method, the way a private window does (snapshot.spec.ts). */
const HOSTILE_STORE: LocalStore = {
  getItem: () => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  },
  setItem: () => {
    throw new DOMException(
      "The quota has been exceeded.",
      "QuotaExceededError",
    );
  },
  removeItem: () => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  },
};

/**
 * A store that throws on every PROPERTY ACCESS - `store.getItem` itself, not
 * the call. Pitfall 9's own case, and the one a guard that wraps only the
 * call misses.
 */
const ACCESS_THROWS: LocalStore = new Proxy({} as LocalStore, {
  get() {
    throw new DOMException("The operation is insecure.", "SecurityError");
  },
});

/** A store that reads fine and refuses every write: the full-quota case on its own (snapshot.spec.ts). */
function fullStore() {
  const { map, store } = fakeStore();
  const full: LocalStore = {
    ...store,
    setItem: () => {
      throw new DOMException(
        "The quota has been exceeded.",
        "QuotaExceededError",
      );
    },
  };
  return { map, store: full };
}

/** A body shape for the primitive's own tests: an envelope with one string field. */
type Note = { schema: 1; text: string };
const isNote = (value: unknown): value is Note =>
  isEnvelope(value) && typeof (value as { text?: unknown }).text === "string";

const KEY = "hangar.spec.v1";

describe("the guarded primitive (src/lib/store/local.ts)", () => {
  it("1. an absent key reads as undefined, and the module imports nothing and names no window", () => {
    const { store, asked } = fakeStore();
    expect(readJson(store, KEY, isNote)).toBeUndefined();
    expect(readString(store, KEY), "the raw read says null for absent").toBe(
      null,
    );
    expect(probe(store, KEY, isNote)).toEqual({ state: "absent" });
    expect(asked, "the key was really asked for").toEqual([KEY, KEY, KEY]);

    // No store at all: the prerendered page.
    expect(readJson(undefined, KEY, isNote)).toBeUndefined();
    expect(readString(undefined, KEY)).toBeUndefined();
    expect(probe(undefined, KEY, isNote)).toEqual({ state: "refused" });
    expect(writeJson(undefined, KEY, { schema: 1, text: "x" })).toBe(false);
    expect(writeString(undefined, KEY, "x")).toBe(false);
    expect(removeKey(undefined, KEY)).toBe(false);

    // THE SOURCE SCAN, the same proof snapshot.ts carries: zero specifiers,
    // `import type` included, and no browser global named in code.
    const raw = readFileSync(here("./local.ts"), "utf8");
    expect(raw, "the header names the browser store in prose").toContain(
      "localStorage",
    );
    const code = strip(raw);
    expect(code, "the stripper ate the code").toContain(
      "export function writeJson",
    );
    expect(code.includes('from "'), "local.ts imports").toBe(false);
    expect(code.includes("from '"), "local.ts imports").toBe(false);
    expect(code.includes("import("), "local.ts imports dynamically").toBe(
      false,
    );
    expect(code.includes("import "), "local.ts imports").toBe(false);
    expect(code.includes("require("), "local.ts requires").toBe(false);
    for (const name of [
      "window",
      "localStorage",
      "sessionStorage",
      "document",
      "globalThis",
    ]) {
      expect(code.includes(name), `local.ts names ${name} in CODE`).toBe(false);
    }

    // And schema.ts is data: no specifiers either, and its six keys plus the
    // reserved one are what the plan names.
    const schema = strip(readFileSync(here("./schema.ts"), "utf8"));
    expect(schema.includes('from "'), "schema.ts imports").toBe(false);
    expect(OWNED_KEYS).toEqual([
      "hangar.drafts.v1",
      "hangar.library.v1",
      "hangar.favorites.v1",
      "hangar.recent.v1",
      "hangar.intro.v1",
      "hangar.motion.v1",
    ]);
    expect([
      DRAFTS_KEY,
      LIBRARY_KEY,
      FAVORITES_KEY,
      RECENT_KEY,
      INTRO_KEY,
    ]).toEqual(OWNED_KEYS.slice(0, 5));
    expect(MOTION_KEY, "13-04's key, adopted by name").toBe("hangar.motion.v1");
    expect(COLLECTIONS_KEY_RESERVED).toBe("hangar.collections.v1");
    expect(OWNED_KEYS, "the reserved key is not owned").not.toContain(
      COLLECTIONS_KEY_RESERVED,
    );
    expect(SCHEMA_VERSION).toBe(1);
  });

  it("2. a corrupt value - not JSON, or JSON of the wrong shape - reads as undefined and is NOT deleted", () => {
    const broken: readonly { readonly what: string; readonly raw: string }[] = [
      { what: "not JSON at all", raw: "not json" },
      { what: "JSON null", raw: "null" },
      { what: "a JSON string", raw: '"hangar"' },
      { what: "an array", raw: "[]" },
      { what: "no schema", raw: '{"text":"x"}' },
      { what: "a later schema", raw: '{"schema":2,"text":"x"}' },
      {
        what: "the right schema, the wrong field",
        raw: '{"schema":1,"text":7}',
      },
      { what: "the right schema, no field", raw: '{"schema":1}' },
    ];
    for (const { what, raw } of broken) {
      const { map, store } = fakeStore();
      store.setItem(KEY, raw);
      let got: Note | undefined;
      expect(() => {
        got = readJson(store, KEY, isNote);
      }, `${what}: a broken value threw`).not.toThrow();
      expect(got, `${what}: a broken value reached the caller`).toBeUndefined();
      expect(probe(store, KEY, isNote), `${what}: classified`).toEqual({
        state: "corrupt",
      });
      // THE EVIDENCE STANDS. A reader that repairs by deleting destroys the
      // one thing that could explain what went wrong.
      expect(map.get(KEY), `${what}: the reader deleted the evidence`).toBe(
        raw,
      );
      expect(map.size, `${what}: the reader touched another key`).toBe(1);
    }

    // The version in the body is load-bearing on its own: a v2 body under
    // the v1 key is corrupt to a v1 reader, even though the key is right.
    const { store } = fakeStore();
    store.setItem(KEY, '{"schema":2,"text":"from the future"}');
    expect(readJson(store, KEY, isNote)).toBeUndefined();

    // And a record body is held to every field: one wrong field is absent,
    // never a partial record.
    const good = {
      schema: 1,
      kind: "playground",
      id: "playground:arc",
      name: "Arc",
      createdAt: "2026-09-11T10:00:00.000Z",
      editedAt: "2026-09-11T10:00:00.000Z",
      source: "arc",
      knobIndices: [3, 0, 7],
    };
    expect(isStoredRecord(good)).toBe(true);
    expect(isStoredRecord({ ...good, knobIndices: [3, "0"] })).toBe(false);
    expect(isStoredRecord({ ...good, kind: "sandbox" })).toBe(false);
    expect(isStoredRecord({ ...good, schema: 2 })).toBe(false);
    expect(isStoredRecord({ ...good, editedAt: 1 })).toBe(false);
  });

  it("3. a setItem that throws quota makes writeJson return false, and the previous value survives", () => {
    const { map, store } = fakeStore();
    expect(writeJson(store, KEY, { schema: 1, text: "first" })).toBe(true);
    const before = map.get(KEY);
    expect(before).toBe('{"schema":1,"text":"first"}');

    // The same Map, now refusing writes: a quota that filled up between the
    // first draft and the second.
    const full: LocalStore = {
      ...store,
      setItem: () => {
        throw new DOMException(
          "The quota has been exceeded.",
          "QuotaExceededError",
        );
      },
    };
    let outcome: boolean | undefined;
    expect(() => {
      outcome = writeJson(full, KEY, { schema: 1, text: "second" });
    }, "a refused write threw at the caller").not.toThrow();
    expect(
      outcome,
      "THE CALLER IS TOLD: a silent drop on a draft is a lost draft",
    ).toBe(false);
    expect(map.get(KEY), "the previous value survived the refused write").toBe(
      before,
    );
    expect(readJson(full, KEY, isNote), "and it still reads").toEqual({
      schema: 1,
      text: "first",
    });

    // The string path reports the same way.
    expect(writeString(full, MOTION_KEY, "still")).toBe(false);
    expect(map.has(MOTION_KEY)).toBe(false);

    // A value that cannot be serialised is a refused write too, not a throw.
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    expect(writeJson(store, KEY, cyclic)).toBe(false);
    expect(writeJson(store, KEY, undefined), "undefined is not a value").toBe(
      false,
    );
    expect(map.get(KEY), "a failed serialisation wrote nothing").toBe(before);

    // fullStore() from snapshot.spec.ts, for the record: same result.
    const { store: refusing, map: empty } = fullStore();
    expect(writeJson(refusing, KEY, { schema: 1, text: "x" })).toBe(false);
    expect(empty.size).toBe(0);
  });

  it("4. a store whose property access throws makes every function return the absent answer", () => {
    // The ACCESS, not the call: `ACCESS_THROWS.getItem` throws before there
    // is anything to call. A guard with the access outside its try turns
    // this red at the first line.
    expect(() => readJson(ACCESS_THROWS, KEY, isNote)).not.toThrow();
    expect(readJson(ACCESS_THROWS, KEY, isNote)).toBeUndefined();
    expect(() => readString(ACCESS_THROWS, KEY)).not.toThrow();
    expect(
      readString(ACCESS_THROWS, KEY),
      "refused, not absent",
    ).toBeUndefined();
    expect(() => probe(ACCESS_THROWS, KEY, isNote)).not.toThrow();
    expect(probe(ACCESS_THROWS, KEY, isNote)).toEqual({ state: "refused" });
    expect(() =>
      writeJson(ACCESS_THROWS, KEY, { schema: 1, text: "x" }),
    ).not.toThrow();
    expect(writeJson(ACCESS_THROWS, KEY, { schema: 1, text: "x" })).toBe(false);
    expect(() => writeString(ACCESS_THROWS, KEY, "x")).not.toThrow();
    expect(writeString(ACCESS_THROWS, KEY, "x")).toBe(false);
    expect(() => removeKey(ACCESS_THROWS, KEY)).not.toThrow();
    expect(removeKey(ACCESS_THROWS, KEY)).toBe(false);

    // The fake really does throw on access, so the assertions above were not
    // vacuous.
    expect(() => ACCESS_THROWS.getItem).toThrow(DOMException);

    // And the store that throws on USE - the other half of Pitfall 9 - lands
    // in the same place.
    expect(readJson(HOSTILE_STORE, KEY, isNote)).toBeUndefined();
    expect(probe(HOSTILE_STORE, KEY, isNote)).toEqual({ state: "refused" });
    expect(writeJson(HOSTILE_STORE, KEY, { schema: 1, text: "x" })).toBe(false);
    expect(writeString(HOSTILE_STORE, KEY, "x")).toBe(false);
    expect(removeKey(HOSTILE_STORE, KEY)).toBe(false);
  });

  it("5. a .v1 record and a .v2 record coexist: the v2 reader returns v2 and never opens, writes or deletes v1", () => {
    const { map, asked, store } = fakeStore();
    const v1Key = storeKey("drafts", 1);
    const v2Key = storeKey("drafts", 2);
    expect(v1Key).toBe(DRAFTS_KEY);
    expect(v2Key).toBe("hangar.drafts.v2");

    const v1 = '{"schema":1,"drafts":{"a":{"legacy":true}}}';
    const v2 = '{"schema":2,"drafts":{"b":{"future":true}}}';
    store.setItem(v1Key, v1);
    store.setItem(v2Key, v2);
    asked.length = 0;

    // A reader for the version that does not exist yet, written the way one
    // would be: its own key, its own body check.
    type V2 = { schema: 2; drafts: Record<string, unknown> };
    const isV2 = (value: unknown): value is V2 =>
      typeof value === "object" &&
      value !== null &&
      (value as { schema?: unknown }).schema === 2 &&
      typeof (value as { drafts?: unknown }).drafts === "object";

    const read = readJson(store, v2Key, isV2);
    expect(read, "the v2 reader returns the v2 record").toEqual(JSON.parse(v2));

    // NEVER OPENED: the v1 key was not asked for. This is the guarantee a
    // version in the key name gives that a field in the body cannot - an
    // unknown-shaped record cannot be misparsed by a reader that never looks
    // at it. A reader that fell back to v1 would show up here by name.
    expect(
      asked,
      `the v2 reader opened a record it must never read: ${asked.join(", ")}`,
    ).toEqual([v2Key]);
    expect(asked, "the v1 record was opened").not.toContain(v1Key);

    // NEVER WRITTEN, NEVER DELETED: a v2 write beside it leaves v1 byte for byte.
    expect(writeJson(store, v2Key, { schema: 2, drafts: {} })).toBe(true);
    expect(map.get(v1Key), "the v1 record moved").toBe(v1);
    expect(removeKey(store, v2Key)).toBe(true);
    expect(map.get(v1Key), "the v1 record was deleted with v2").toBe(v1);
    expect(map.has(v2Key)).toBe(false);

    // And the other direction: the v1 reader over its own key does not see
    // v2's body as anything - the body version refuses it (test 2's rule),
    // and the key rule means it is never even asked for.
    asked.length = 0;
    store.setItem(v2Key, v2);
    expect(readJson(store, v1Key, isEnvelope)).toEqual(JSON.parse(v1));
    expect(asked).toEqual([v1Key]);
  });
});
