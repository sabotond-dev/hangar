// The module's original, as a record: seven gates.
//
// One per rule the install store relies on. The store is a three-method object
// over a Map, as return.spec.ts and HostDeps do, because there is no jsdom and
// no browser Vitest project in this repository (04-RESEARCH Pitfall 6); a store
// that throws is the same object with its methods replaced, because Safari in
// private mode and a full quota are real browser states and the install path
// runs through this module at connect.
//
// The three mutations these tests exist to catch: persistIfAbsent overwriting
// an entry (test 3 - the visitor's only copy destroyed by a re-connect);
// readSnapshot handing a malformed entry through (test 6 - a partial restore);
// and a `try` removed from around the store (test 5 - a connect that throws on
// a browser that refuses storage).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  SNAPSHOT_KEY,
  SNAPSHOT_KEY_V2,
  hasSnapshotFor,
  lastModuleId,
  persistIfAbsent,
  readSnapshot,
  rememberLast,
  type ConfigTriple,
  type SnapshotStore,
} from "./snapshot";

const SOURCE_PATH = fileURLToPath(new URL("./snapshot.ts", import.meta.url));

/** The house comment stripper (src/lib/config-shape.spec.ts), backslash-free. */
const strip = (source: string) =>
  source.replace(/^[ ]*[/][/].*$/gm, "").replace(/[/][*][^]*?[*][/]/g, "");

/** Everything a Storage is, for this module's purposes, over a Map. */
function fakeStore() {
  const map = new Map<string, string>();
  const store: SnapshotStore = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
  return { map, store };
}

/** A store that throws on every method, the way a private window does. */
const HOSTILE_STORE: SnapshotStore = {
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

/** A store that reads fine and refuses every write: the full-quota case on its own. */
function fullStore() {
  const { map, store } = fakeStore();
  const full: SnapshotStore = {
    ...store,
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  };
  return { map, store: full };
}

/** Two 32-character keys, the shape moduleKeyOf produces. */
const MODULE_A = "123456789abcdef00000000000000000";
const MODULE_B = "fffffff0000000010000000000000000";
const MODULE_C = "00000000000000000000000000000001";

const ORIGINAL: ConfigTriple = {
  system: "--[[@cb]]function M()return 1 end",
  setup: "--[[@cb]]print(1)",
  timer: "--[[@cb]]print(2)",
};
const HANGARS: ConfigTriple = {
  system: "--[[@cb]]function H()return 9 end",
  setup: "--[[@cb]]glr(1,1,1)",
  timer: "--[[@cb]]glr(2,2,2)",
};
const TAKEN = "2026-09-05T12:00:00.000Z";

/**
 * THE PAGE INIT THE CALLER PASSES IN when a record has none. Deliberately a
 * string this FILE owns rather than the package constant the install store
 * really passes: a v1 read has to come back with the CALLER s string, and a
 * package constant here could pass by coinciding with something the module
 * already held. snapshot.ts imports nothing, so it can never reach the
 * package - which is the whole reason the parameter exists.
 */
const PASSED_DEFAULT = "--[[@cb]]--[[caller default]]";

/** readSnapshot with the caller s default folded in, and the entry as a plain triple. */
const readAt = (
  store: SnapshotStore | undefined,
  moduleId: string,
  page: number,
) => readSnapshot(store, moduleId, page, PASSED_DEFAULT);

/** What readAt returns for a record this version wrote. */
const entry = (set: ConfigTriple, fromV1 = false) => ({ ...set, fromV1 });

describe("the module's original, as a record (src/lib/device/snapshot.ts)", () => {
  it("imports nothing at all, and names no window", () => {
    const raw = readFileSync(SOURCE_PATH, "utf8");
    expect(raw.length, "the source was actually read").toBeGreaterThan(4000);
    // The header MUST say the word, so the code scan below is not vacuous:
    // the rule is "in prose, never in code", and the strip is what makes the
    // distinction.
    expect(raw, "the header names the browser store in prose").toContain(
      "localStorage",
    );

    const code = strip(raw);
    expect(
      code.length,
      "the stripped source is still the module, not only its comments",
    ).toBeGreaterThan(2000);
    expect(code, "the stripper ate the code").toContain(
      "export function persistIfAbsent",
    );

    expect(code.includes('from "'), "snapshot.ts imports").toBe(false);
    expect(code.includes("from '"), "snapshot.ts imports").toBe(false);
    expect(code.includes("import("), "snapshot.ts imports dynamically").toBe(
      false,
    );
    expect(code.includes("import "), "snapshot.ts imports").toBe(false);
    expect(code.includes("require("), "snapshot.ts requires").toBe(false);

    for (const name of [
      "window",
      "localStorage",
      "sessionStorage",
      "document",
    ]) {
      expect(code.includes(name), `snapshot.ts names ${name} in CODE`).toBe(
        false,
      );
    }

    // Z-13: nothing here deletes. The type carries removeItem because
    // return.ts's shape does; no function calls it.
    const calls = code.match(/[.]removeItem[(]/g) ?? [];
    expect(calls, "snapshot.ts calls removeItem").toEqual([]);
    expect(code, "the type still carries the three-method shape").toContain(
      '"removeItem"',
    );
  });

  it("a record round-trips through persistIfAbsent and readSnapshot, with its timestamp", () => {
    const { map, store } = fakeStore();
    expect(
      readAt(store, MODULE_A, 0),
      "nothing was recorded yet",
    ).toBeUndefined();
    expect(hasSnapshotFor(store, MODULE_A), "nothing was recorded yet").toBe(
      false,
    );

    expect(persistIfAbsent(store, MODULE_A, 0, ORIGINAL, TAKEN)).toBe(
      "written",
    );

    expect(readAt(store, MODULE_A, 0)).toEqual(entry(ORIGINAL));
    expect(hasSnapshotFor(store, MODULE_A)).toBe(true);

    expect(map.size, "exactly one key was written").toBe(1);
    expect([...map.keys()], "and it is the v2 key").toEqual([SNAPSHOT_KEY_V2]);
    expect(SNAPSHOT_KEY_V2, "the key is versioned in its name").toBe(
      "hangar.snapshot.v2",
    );
    expect(SNAPSHOT_KEY, "and the older one is still named, for reading").toBe(
      "hangar.snapshot.v1",
    );

    const stored = JSON.parse(map.get(SNAPSHOT_KEY_V2) ?? "null") as {
      v: number;
      modules: Record<string, { pages: Record<string, unknown> }>;
    };
    expect(stored.v, "the body is versioned too").toBe(2);
    expect(stored.modules[MODULE_A].pages["0"]).toEqual({
      system: ORIGINAL.system,
      setup: ORIGINAL.setup,
      timer: ORIGINAL.timer,
      takenAt: TAKEN,
    });
  });

  it("an existing page entry is never overwritten", () => {
    const { map, store } = fakeStore();
    expect(persistIfAbsent(store, MODULE_A, 0, ORIGINAL, TAKEN)).toBe(
      "written",
    );
    const before = map.get(SNAPSHOT_KEY_V2);

    // The re-connect after a TRY ON DEVICE: the fetch now returns HANGAR's own
    // configuration, and persisting it would destroy the only original.
    const later = "2026-09-05T12:05:00.000Z";
    expect(
      persistIfAbsent(store, MODULE_A, 0, HANGARS, later),
      "the second persist must decline",
    ).toBe("kept");
    expect(readAt(store, MODULE_A, 0), "the original was overwritten").toEqual(
      entry(ORIGINAL),
    );
    expect(
      map.get(SNAPSHOT_KEY_V2),
      "the raw record changed under a kept",
    ).toBe(before);

    const stored = JSON.parse(map.get(SNAPSHOT_KEY_V2) ?? "null") as {
      modules: Record<string, { pages: Record<string, { takenAt: string }> }>;
    };
    expect(stored.modules[MODULE_A].pages["0"].takenAt, "takenAt moved").toBe(
      TAKEN,
    );

    // Idempotent: a third identical persist is also a kept, not a write.
    expect(persistIfAbsent(store, MODULE_A, 0, ORIGINAL, later)).toBe("kept");
    expect(map.get(SNAPSHOT_KEY_V2)).toBe(before);
  });

  it("a second module and a second page each get their own entry", () => {
    const { store } = fakeStore();
    const pairs = {
      a0: { system: "a0y", setup: "a0s", timer: "a0t" },
      a3: { system: "a3y", setup: "a3s", timer: "a3t" },
      b0: { system: "b0y", setup: "b0s", timer: "b0t" },
      b3: { system: "b3y", setup: "b3s", timer: "b3t" },
    } as const;

    expect(persistIfAbsent(store, MODULE_A, 0, pairs.a0, TAKEN)).toBe(
      "written",
    );
    expect(persistIfAbsent(store, MODULE_A, 3, pairs.a3, TAKEN)).toBe(
      "written",
    );
    expect(persistIfAbsent(store, MODULE_B, 0, pairs.b0, TAKEN)).toBe(
      "written",
    );
    expect(persistIfAbsent(store, MODULE_B, 3, pairs.b3, TAKEN)).toBe(
      "written",
    );

    // Four entries, none shadowing another.
    expect(readAt(store, MODULE_A, 0)).toEqual(entry(pairs.a0));
    expect(readAt(store, MODULE_A, 3)).toEqual(entry(pairs.a3));
    expect(readAt(store, MODULE_B, 0)).toEqual(entry(pairs.b0));
    expect(readAt(store, MODULE_B, 3)).toEqual(entry(pairs.b3));

    // A page never snapshotted is absent even when its neighbours exist -
    // Pitfall 4: page 3's original is never handed out for page 1.
    expect(readAt(store, MODULE_A, 1)).toBeUndefined();
    expect(readAt(store, MODULE_B, 1)).toBeUndefined();

    expect(hasSnapshotFor(store, MODULE_A)).toBe(true);
    expect(hasSnapshotFor(store, MODULE_B)).toBe(true);
    expect(hasSnapshotFor(store, MODULE_C), "a third module has none").toBe(
      false,
    );
    expect(readAt(store, MODULE_C, 0)).toBeUndefined();
  });

  it("a throwing store and an undefined store degrade without throwing", () => {
    // Every method throws: Safari private mode, or a browser that refuses
    // storage for this site.
    expect(() => readAt(HOSTILE_STORE, MODULE_A, 0)).not.toThrow();
    expect(readAt(HOSTILE_STORE, MODULE_A, 0)).toBeUndefined();
    expect(() =>
      persistIfAbsent(HOSTILE_STORE, MODULE_A, 0, ORIGINAL, TAKEN),
    ).not.toThrow();
    expect(persistIfAbsent(HOSTILE_STORE, MODULE_A, 0, ORIGINAL, TAKEN)).toBe(
      "unavailable",
    );
    expect(() => hasSnapshotFor(HOSTILE_STORE, MODULE_A)).not.toThrow();
    expect(hasSnapshotFor(HOSTILE_STORE, MODULE_A)).toBe(false);
    expect(() => lastModuleId(HOSTILE_STORE)).not.toThrow();
    expect(lastModuleId(HOSTILE_STORE)).toBeUndefined();
    expect(() => rememberLast(HOSTILE_STORE, MODULE_A)).not.toThrow();

    // Reads fine, refuses every write: a full quota. The read half still
    // works and the write half is reported, not thrown.
    const { map, store: full } = fullStore();
    expect(() =>
      persistIfAbsent(full, MODULE_A, 0, ORIGINAL, TAKEN),
    ).not.toThrow();
    expect(persistIfAbsent(full, MODULE_A, 0, ORIGINAL, TAKEN)).toBe(
      "unavailable",
    );
    expect(map.size, "a refused write left nothing behind").toBe(0);
    expect(() => rememberLast(full, MODULE_A)).not.toThrow();
    expect(readAt(full, MODULE_A, 0)).toBeUndefined();

    // No store at all: the prerendered page.
    expect(readAt(undefined, MODULE_A, 0)).toBeUndefined();
    expect(persistIfAbsent(undefined, MODULE_A, 0, ORIGINAL, TAKEN)).toBe(
      "unavailable",
    );
    expect(hasSnapshotFor(undefined, MODULE_A)).toBe(false);
    expect(lastModuleId(undefined)).toBeUndefined();
    expect(() => rememberLast(undefined, MODULE_A)).not.toThrow();
  });

  it("a malformed or wrong-version record reads as absent, never partial", () => {
    const broken: readonly { readonly what: string; readonly raw: string }[] = [
      { what: "not JSON at all", raw: "not json" },
      { what: "JSON null", raw: "null" },
      { what: "a JSON string", raw: '"hangar"' },
      { what: "an array", raw: "[]" },
      { what: "a later schema", raw: '{"v":2,"modules":{}}' },
      { what: "no version", raw: '{"modules":{}}' },
      { what: "no modules", raw: '{"v":1}' },
      { what: "modules as an array", raw: '{"v":1,"modules":[]}' },
      {
        what: "a module with no pages",
        raw: `{"v":1,"modules":{"${MODULE_A}":{}}}`,
      },
      {
        what: "a setup that is a number",
        raw: `{"v":1,"modules":{"${MODULE_A}":{"pages":{"0":{"setup":7,"timer":"t","takenAt":"${TAKEN}"}}}}}`,
      },
      {
        what: "a timer missing",
        raw: `{"v":1,"modules":{"${MODULE_A}":{"pages":{"0":{"setup":"s","takenAt":"${TAKEN}"}}}}}`,
      },
      {
        what: "a takenAt that is a number",
        raw: `{"v":1,"modules":{"${MODULE_A}":{"pages":{"0":{"setup":"s","timer":"t","takenAt":1}}}}}`,
      },
      {
        what: "a page entry that is a string",
        raw: `{"v":1,"modules":{"${MODULE_A}":{"pages":{"0":"s"}}}}`,
      },
    ];

    for (const { what, raw } of broken) {
      const { store } = fakeStore();
      store.setItem(SNAPSHOT_KEY_V2, raw);

      let got: ReturnType<typeof readAt>;
      expect(() => {
        got = readAt(store, MODULE_A, 0);
      }, `${what}: a broken record threw`).not.toThrow();
      expect(
        got,
        `${what}: a broken record reached the caller`,
      ).toBeUndefined();
      expect(
        hasSnapshotFor(store, MODULE_A),
        `${what}: a broken record counted as a snapshot`,
      ).toBe(false);

      // A persist on the broken record REPLACES it with a valid one: nothing in
      // it was ever a copy of anything, so nothing in it is protected.
      expect(
        persistIfAbsent(store, MODULE_A, 0, ORIGINAL, TAKEN),
        `${what}: a persist on a broken record did not write`,
      ).toBe("written");
      expect(
        readAt(store, MODULE_A, 0),
        `${what}: the replacement did not read back`,
      ).toEqual(entry(ORIGINAL));
      expect(hasSnapshotFor(store, MODULE_A)).toBe(true);
    }

    // The neighbour rule: one malformed page entry does not hide a valid one
    // beside it, and does not stop the module counting as snapshotted.
    const { store } = fakeStore();
    store.setItem(
      SNAPSHOT_KEY_V2,
      `{"v":2,"modules":{"${MODULE_A}":{"pages":{"0":{"setup":7},"3":{"system":"y3","setup":"s3","timer":"t3","takenAt":"${TAKEN}"}}}}}`,
    );
    expect(readAt(store, MODULE_A, 0)).toBeUndefined();
    expect(readAt(store, MODULE_A, 3)).toEqual(
      entry({ system: "y3", setup: "s3", timer: "t3" }),
    );
    expect(hasSnapshotFor(store, MODULE_A)).toBe(true);
    // And the replacement of page 0 leaves page 3 exactly where it was.
    expect(persistIfAbsent(store, MODULE_A, 0, ORIGINAL, TAKEN)).toBe(
      "written",
    );
    expect(readAt(store, MODULE_A, 3)).toEqual(
      entry({ system: "y3", setup: "s3", timer: "t3" }),
    );
  });

  it("rememberLast and lastModuleId round-trip, and a store with no record has no last", () => {
    const { map, store } = fakeStore();
    expect(lastModuleId(store), "no record, no last").toBeUndefined();

    rememberLast(store, MODULE_A);
    expect(lastModuleId(store)).toBe(MODULE_A);
    expect(map.size, "one key").toBe(1);

    // Remembering a different module replaces the last and touches no entry.
    persistIfAbsent(store, MODULE_A, 0, ORIGINAL, TAKEN);
    rememberLast(store, MODULE_B);
    expect(lastModuleId(store)).toBe(MODULE_B);
    expect(readAt(store, MODULE_A, 0), "the entry survived").toEqual(
      entry(ORIGINAL),
    );
    expect(
      hasSnapshotFor(store, MODULE_B),
      "remembering is not a snapshot",
    ).toBe(false);

    // A record with a `last` that is not a string has no last, and is otherwise
    // read normally.
    const { store: odd } = fakeStore();
    odd.setItem(SNAPSHOT_KEY_V2, '{"v":2,"last":7,"modules":{}}');
    expect(lastModuleId(odd)).toBeUndefined();

    // A record with no `last` at all: the ordinary case after a persist alone.
    const { store: plain } = fakeStore();
    persistIfAbsent(plain, MODULE_A, 0, ORIGINAL, TAKEN);
    expect(lastModuleId(plain)).toBeUndefined();

    // And on a throwing store it neither throws nor remembers.
    expect(() => rememberLast(HOSTILE_STORE, MODULE_A)).not.toThrow();
    expect(lastModuleId(HOSTILE_STORE)).toBeUndefined();
  });

  it("a v1 record is read with the caller's default page init, is never overwritten, and a v2 entry missing one is absent", () => {
    // THE RECORD PHASE 7 LEFT, and what this version does with it (12-03).
    const { map, store } = fakeStore();
    const v1 = `{"v":1,"last":"${MODULE_A}","modules":{"${MODULE_A}":{"pages":{"0":{"setup":"${ORIGINAL.setup}","timer":"${ORIGINAL.timer}","takenAt":"${TAKEN}"}}}}}`;
    store.setItem(SNAPSHOT_KEY, v1);

    // READ, with the CALLER's default standing in for the page init the record
    // never had - and `fromV1` saying so, rather than the substitution being
    // silent. It is not a guess: no version of HANGAR before this phase ever
    // wrote element 255, so the only page init a module with a v1 record can
    // have met is its factory one.
    const read = readAt(store, MODULE_A, 0);
    expect(read).toEqual({
      system: PASSED_DEFAULT,
      setup: ORIGINAL.setup,
      timer: ORIGINAL.timer,
      fromV1: true,
    });
    expect(read?.fromV1, "the substitution is surfaced, never silent").toBe(
      true,
    );
    // A different caller default lands a different string: the value really
    // comes from the parameter, and snapshot.ts has no way to invent one -
    // it imports nothing at all (test 1).
    expect(readSnapshot(store, MODULE_A, 0, "OTHER")?.system).toBe("OTHER");
    expect(hasSnapshotFor(store, MODULE_A), "a v1 entry counts").toBe(true);
    expect(lastModuleId(store), "and so does its `last`").toBe(MODULE_A);

    // RULE 3, ACROSS THE VERSION BOUNDARY: a v1 entry for this page is the
    // visitor's only original, so a v2 entry beside it is DECLINED. Writing
    // one would not destroy the v1 record - but readSnapshot reads v2 first,
    // so it would SHADOW it, which is the same loss with a longer name.
    expect(
      persistIfAbsent(store, MODULE_A, 0, HANGARS, "2026-09-10T12:00:00.000Z"),
      "a v2 entry was written over a v1 original",
    ).toBe("kept");
    expect(readAt(store, MODULE_A, 0)?.setup, "the original still reads").toBe(
      ORIGINAL.setup,
    );

    // RULE 4: the v1 record is byte-unchanged and still there. A record left
    // by a schema this version does not own is not this version's to touch.
    expect(map.get(SNAPSHOT_KEY), "the v1 record moved").toBe(v1);

    // A page the v1 record does NOT have is written under v2, beside it, and
    // read back as a v2 entry - so the older record blocks nothing but its
    // own page.
    expect(persistIfAbsent(store, MODULE_A, 3, HANGARS, TAKEN)).toBe("written");
    expect(readAt(store, MODULE_A, 3)).toEqual(entry(HANGARS));
    expect(map.get(SNAPSHOT_KEY), "still byte-unchanged").toBe(v1);

    // V2 WINS WHERE BOTH EXIST. A second browser record, same module, same
    // page, under both keys: the newer one is what a read returns.
    const { store: both } = fakeStore();
    both.setItem(SNAPSHOT_KEY, v1);
    both.setItem(
      SNAPSHOT_KEY_V2,
      `{"v":2,"modules":{"${MODULE_A}":{"pages":{"0":{"system":"${HANGARS.system}","setup":"${HANGARS.setup}","timer":"${HANGARS.timer}","takenAt":"${TAKEN}"}}}}}`,
    );
    expect(readAt(both, MODULE_A, 0)).toEqual(entry(HANGARS));

    // AND A V2 ENTRY MISSING `system` IS ABSENT, NOT HALF-READ. This is the
    // negative check: a two-string entry under the v2 key is not a v2 entry,
    // and handing back a set with an undefined page init would put that on
    // the wire on the one click that exists to undo every other one. With no
    // v1 record beside it, the read is `undefined`.
    const { store: half } = fakeStore();
    half.setItem(
      SNAPSHOT_KEY_V2,
      `{"v":2,"modules":{"${MODULE_A}":{"pages":{"0":{"setup":"s","timer":"t","takenAt":"${TAKEN}"}}}}}`,
    );
    expect(
      readAt(half, MODULE_A, 0),
      "a half-read entry reached the caller",
    ).toBeUndefined();
    expect(hasSnapshotFor(half, MODULE_A)).toBe(false);
    // And it is replaced, not kept: it was never a copy of anything.
    expect(persistIfAbsent(half, MODULE_A, 0, ORIGINAL, TAKEN)).toBe("written");
    expect(readAt(half, MODULE_A, 0)).toEqual(entry(ORIGINAL));
  });
});
