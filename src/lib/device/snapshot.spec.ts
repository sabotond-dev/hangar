// The module's original, as a record: nine gates.
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
// a browser that refuses storage). Tests 8 and 9 hold the three older keys: a
// record from before Phase 12 (v1), one from before Phase 12.1 (v2) and one
// from before 13-17 (v3) each read with the caller's default in the slot it
// lacks, flagged, and none is ever written, overwritten, shadowed or deleted.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  SNAPSHOT_KEY,
  SNAPSHOT_KEY_V2,
  SNAPSHOT_KEY_V3,
  SNAPSHOT_KEY_V4,
  hasSnapshotFor,
  lastModuleId,
  persistIfAbsent,
  readSnapshot,
  rememberLast,
  type ConfigQuad,
  type ConfigQuint,
  type SnapshotStore,
} from "./snapshot";
import { stripComments } from "../../test-support/source";

const SOURCE_PATH = fileURLToPath(new URL("./snapshot.ts", import.meta.url));

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

const ORIGINAL: ConfigQuint = {
  systemTimer: "--[[@cb]]function M:tim()return 2 end",
  system: "--[[@cb]]function M()return 1 end",
  systemUtility: "--[[@cb]]function M:map()return 4 end",
  setup: "--[[@cb]]print(1)",
  timer: "--[[@cb]]print(2)",
};
const HANGARS: ConfigQuint = {
  systemTimer: "--[[@cb]]function H:tim()return 8 end",
  system: "--[[@cb]]function H()return 9 end",
  systemUtility: "--[[@cb]]function H:map()return 7 end",
  setup: "--[[@cb]]glr(1,1,1)",
  timer: "--[[@cb]]glr(2,2,2)",
};
const TAKEN = "2026-09-05T12:00:00.000Z";

/**
 * THE PAGE INIT, THE SYSTEM TIMER AND THE UTILITY THE CALLER PASSES IN when a
 * record has none. Deliberately strings this FILE owns rather than the package
 * constants the install store really passes: a v1, v2 or v3 read has to come
 * back with the CALLER s string, and a package constant here could pass by
 * coinciding with something the module already held. snapshot.ts imports
 * nothing, so it can never reach the package - which is the whole reason the
 * parameter exists.
 */
const PASSED_DEFAULT = "--[[@cb]]--[[caller default]]";
const PASSED_TIMER_DEFAULT = "--[[@cb]]--[[caller timer default]]";
const PASSED_UTILITY_DEFAULT = "--[[@cb]]--[[caller utility default]]";
const DEFAULTS = {
  system: PASSED_DEFAULT,
  systemTimer: PASSED_TIMER_DEFAULT,
  systemUtility: PASSED_UTILITY_DEFAULT,
};

/** readSnapshot with the caller s defaults folded in, and the entry as a plain quad. */
const readAt = (
  store: SnapshotStore | undefined,
  moduleId: string,
  page: number,
) => readSnapshot(store, moduleId, page, DEFAULTS);

/** What readAt returns for a record this version wrote. */
const entry = (
  set: ConfigQuint,
  fromV1 = false,
  fromV2 = false,
  fromV3 = false,
) => ({
  ...set,
  fromV1,
  fromV2,
  fromV3,
});

/** A v3 page entry on the wire, as JSON: four strings (12.1-07's, read only since 13-17). */
const v3Entry = (set: ConfigQuad, takenAt = TAKEN) =>
  `{"systemTimer":"${set.systemTimer}","system":"${set.system}","setup":"${set.setup}","timer":"${set.timer}","takenAt":"${takenAt}"}`;

/** A v4 page entry on the wire, as JSON: five strings (13-17's). */
const v4Entry = (set: ConfigQuint, takenAt = TAKEN) =>
  `{"systemTimer":"${set.systemTimer}","system":"${set.system}","systemUtility":"${set.systemUtility}","setup":"${set.setup}","timer":"${set.timer}","takenAt":"${takenAt}"}`;

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

    const code = stripComments(raw);
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
    expect([...map.keys()], "and it is the v4 key").toEqual([SNAPSHOT_KEY_V4]);
    expect(SNAPSHOT_KEY_V4, "the key is versioned in its name").toBe(
      "hangar.snapshot.v4",
    );
    expect(
      SNAPSHOT_KEY_V3,
      "and the older ones are still named, for reading",
    ).toBe("hangar.snapshot.v3");
    expect(SNAPSHOT_KEY_V2).toBe("hangar.snapshot.v2");
    expect(SNAPSHOT_KEY).toBe("hangar.snapshot.v1");

    const stored = JSON.parse(map.get(SNAPSHOT_KEY_V4) ?? "null") as {
      v: number;
      modules: Record<string, { pages: Record<string, unknown> }>;
    };
    expect(stored.v, "the body is versioned too").toBe(4);
    expect(stored.modules[MODULE_A].pages["0"]).toEqual({
      systemTimer: ORIGINAL.systemTimer,
      system: ORIGINAL.system,
      systemUtility: ORIGINAL.systemUtility,
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
    const before = map.get(SNAPSHOT_KEY_V4);

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
      map.get(SNAPSHOT_KEY_V4),
      "the raw record changed under a kept",
    ).toBe(before);

    const stored = JSON.parse(map.get(SNAPSHOT_KEY_V4) ?? "null") as {
      modules: Record<string, { pages: Record<string, { takenAt: string }> }>;
    };
    expect(stored.modules[MODULE_A].pages["0"].takenAt, "takenAt moved").toBe(
      TAKEN,
    );

    // Idempotent: a third identical persist is also a kept, not a write.
    expect(persistIfAbsent(store, MODULE_A, 0, ORIGINAL, later)).toBe("kept");
    expect(map.get(SNAPSHOT_KEY_V4)).toBe(before);
  });

  it("a second module and a second page each get their own entry", () => {
    const { store } = fakeStore();
    const pairs = {
      a0: {
        systemTimer: "a0m",
        system: "a0y",
        systemUtility: "a0u",
        setup: "a0s",
        timer: "a0t",
      },
      a3: {
        systemTimer: "a3m",
        system: "a3y",
        systemUtility: "a3u",
        setup: "a3s",
        timer: "a3t",
      },
      b0: {
        systemTimer: "b0m",
        system: "b0y",
        systemUtility: "b0u",
        setup: "b0s",
        timer: "b0t",
      },
      b3: {
        systemTimer: "b3m",
        system: "b3y",
        systemUtility: "b3u",
        setup: "b3s",
        timer: "b3t",
      },
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
      { what: "a later schema", raw: '{"v":5,"modules":{}}' },
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
      store.setItem(SNAPSHOT_KEY_V4, raw);

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
    const page3 = {
      systemTimer: "m3",
      system: "y3",
      systemUtility: "u3",
      setup: "s3",
      timer: "t3",
    };
    store.setItem(
      SNAPSHOT_KEY_V4,
      `{"v":4,"modules":{"${MODULE_A}":{"pages":{"0":{"setup":7},"3":${v4Entry(page3)}}}}}`,
    );
    expect(readAt(store, MODULE_A, 0)).toBeUndefined();
    expect(readAt(store, MODULE_A, 3)).toEqual(entry(page3));
    expect(hasSnapshotFor(store, MODULE_A)).toBe(true);
    // And the replacement of page 0 leaves page 3 exactly where it was.
    expect(persistIfAbsent(store, MODULE_A, 0, ORIGINAL, TAKEN)).toBe(
      "written",
    );
    expect(readAt(store, MODULE_A, 3)).toEqual(entry(page3));
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
    odd.setItem(SNAPSHOT_KEY_V4, '{"v":4,"last":7,"modules":{}}');
    expect(lastModuleId(odd)).toBeUndefined();

    // A record with no `last` at all: the ordinary case after a persist alone.
    const { store: plain } = fakeStore();
    persistIfAbsent(plain, MODULE_A, 0, ORIGINAL, TAKEN);
    expect(lastModuleId(plain)).toBeUndefined();

    // And on a throwing store it neither throws nor remembers.
    expect(() => rememberLast(HOSTILE_STORE, MODULE_A)).not.toThrow();
    expect(lastModuleId(HOSTILE_STORE)).toBeUndefined();
  });

  it("a v1 record is read with the caller's default page init, system timer AND utility, is never overwritten, and a v4 entry missing one is absent", () => {
    // THE RECORD PHASE 7 LEFT, and what this version does with it (12-03,
    // 12.1-07 one string on, 13-17 one more: a v1 entry has NO system string,
    // so all three of the caller's defaults stand in and `fromV1` alone says
    // so).
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
      systemTimer: PASSED_TIMER_DEFAULT,
      system: PASSED_DEFAULT,
      systemUtility: PASSED_UTILITY_DEFAULT,
      setup: ORIGINAL.setup,
      timer: ORIGINAL.timer,
      fromV1: true,
      fromV2: false,
      fromV3: false,
    });
    expect(read?.fromV1, "the substitution is surfaced, never silent").toBe(
      true,
    );
    // Different caller defaults land different strings: the values really
    // come from the parameter, and snapshot.ts has no way to invent one -
    // it imports nothing at all (test 1).
    const other = readSnapshot(store, MODULE_A, 0, {
      system: "OTHER",
      systemTimer: "OTHER-TIMER",
      systemUtility: "OTHER-UTILITY",
    });
    expect(other?.system).toBe("OTHER");
    expect(other?.systemTimer).toBe("OTHER-TIMER");
    expect(other?.systemUtility).toBe("OTHER-UTILITY");
    expect(hasSnapshotFor(store, MODULE_A), "a v1 entry counts").toBe(true);
    expect(lastModuleId(store), "and so does its `last`").toBe(MODULE_A);

    // RULE 3, ACROSS THE VERSION BOUNDARY: a v1 entry for this page is the
    // visitor's only original, so a v4 entry beside it is DECLINED. Writing
    // one would not destroy the v1 record - but readSnapshot reads v4 first,
    // so it would SHADOW it, which is the same loss with a longer name.
    expect(
      persistIfAbsent(store, MODULE_A, 0, HANGARS, "2026-09-10T12:00:00.000Z"),
      "a v4 entry was written over a v1 original",
    ).toBe("kept");
    expect(readAt(store, MODULE_A, 0)?.setup, "the original still reads").toBe(
      ORIGINAL.setup,
    );

    // RULE 4: the v1 record is byte-unchanged and still there. A record left
    // by a schema this version does not own is not this version's to touch.
    expect(map.get(SNAPSHOT_KEY), "the v1 record moved").toBe(v1);

    // A page the v1 record does NOT have is written under v4, beside it, and
    // read back as a v4 entry - so the older record blocks nothing but its
    // own page. And nothing was written under v2 or v3 either: the middle
    // keys are read only, exactly like the oldest.
    expect(persistIfAbsent(store, MODULE_A, 3, HANGARS, TAKEN)).toBe("written");
    expect(readAt(store, MODULE_A, 3)).toEqual(entry(HANGARS));
    expect(map.get(SNAPSHOT_KEY), "still byte-unchanged").toBe(v1);
    expect(map.has(SNAPSHOT_KEY_V2), "the v2 key was written").toBe(false);
    expect(map.has(SNAPSHOT_KEY_V3), "the v3 key was written").toBe(false);

    // V4 WINS WHERE BOTH EXIST. A second browser record, same module, same
    // page, under both keys: the newest one is what a read returns.
    const { store: both } = fakeStore();
    both.setItem(SNAPSHOT_KEY, v1);
    both.setItem(
      SNAPSHOT_KEY_V4,
      `{"v":4,"modules":{"${MODULE_A}":{"pages":{"0":${v4Entry(HANGARS)}}}}}`,
    );
    expect(readAt(both, MODULE_A, 0)).toEqual(entry(HANGARS));

    // AND A V4 ENTRY MISSING `system` IS ABSENT, NOT HALF-READ. This is the
    // negative check: a two-string entry under the v4 key is not a v4 entry,
    // and handing back a set with an undefined page init would put that on
    // the wire on the one click that exists to undo every other one. With no
    // older record beside it, the read is `undefined`.
    const { store: half } = fakeStore();
    half.setItem(
      SNAPSHOT_KEY_V4,
      `{"v":4,"modules":{"${MODULE_A}":{"pages":{"0":{"setup":"s","timer":"t","takenAt":"${TAKEN}"}}}}}`,
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

  it("a v2 record is read with the caller's default system timer and utility and fromV2, a v3 record with the default utility and fromV3, neither is overwritten, a v4 record round-trips five, and the older keys are byte-unchanged", () => {
    // THE RECORD PHASE 12 LEFT, and what this version does with it (12.1-07,
    // D-22): 12-03's v1 rules, one version on. A v2 entry holds three strings
    // and no system timer, because no version of HANGAR before Phase 12.1
    // ever wrote element 255's Timer - so the only string a module with a v2
    // record can have met there is the factory one, and the caller's default
    // stands in for it with `fromV2` beside it. Since 13-17 the same read
    // substitutes the utility too (no version before 13-17 wrote 255/4), and
    // THE RECORD PHASE 12.1 LEFT (v3, four strings) reads with the utility
    // default alone and `fromV3` - the second half of this test.
    const { map, store } = fakeStore();
    const v2 = `{"v":2,"last":"${MODULE_A}","modules":{"${MODULE_A}":{"pages":{"0":{"system":"${ORIGINAL.system}","setup":"${ORIGINAL.setup}","timer":"${ORIGINAL.timer}","takenAt":"${TAKEN}"}}}}}`;
    store.setItem(SNAPSHOT_KEY_V2, v2);

    // READ: three strings from the record, the fourth and fifth from the
    // caller, and the flag on - never silent. `fromV1` is false: this record
    // is not the oldest, and the page init it holds is the module's own.
    const read = readAt(store, MODULE_A, 0);
    expect(read).toEqual({
      systemTimer: PASSED_TIMER_DEFAULT,
      system: ORIGINAL.system,
      systemUtility: PASSED_UTILITY_DEFAULT,
      setup: ORIGINAL.setup,
      timer: ORIGINAL.timer,
      fromV1: false,
      fromV2: true,
      fromV3: false,
    });
    expect(read?.fromV2, "the substitution is surfaced, never silent").toBe(
      true,
    );
    // A different caller default lands a different string; the page init is
    // the record's own and does not move with any default.
    const other = readSnapshot(store, MODULE_A, 0, {
      system: "OTHER",
      systemTimer: "OTHER-TIMER",
      systemUtility: "OTHER-UTILITY",
    });
    expect(other?.systemTimer).toBe("OTHER-TIMER");
    expect(other?.systemUtility).toBe("OTHER-UTILITY");
    expect(other?.system, "a v2 record's page init is its own").toBe(
      ORIGINAL.system,
    );
    expect(hasSnapshotFor(store, MODULE_A), "a v2 entry counts").toBe(true);
    expect(lastModuleId(store), "and so does its `last`").toBe(MODULE_A);

    // RULE 3, ACROSS THE VERSION BOUNDARY: a v2 entry for this page is the
    // visitor's only original, so a v4 entry beside it is DECLINED - the
    // re-connect after a TRY ON DEVICE would otherwise file HANGAR's own
    // configuration under the newest key, and readSnapshot reads v4 first.
    expect(
      persistIfAbsent(store, MODULE_A, 0, HANGARS, "2026-09-11T12:00:00.000Z"),
      "a v4 entry was written over a v2 original",
    ).toBe("kept");
    expect(readAt(store, MODULE_A, 0)?.setup, "the original still reads").toBe(
      ORIGINAL.setup,
    );
    expect(readAt(store, MODULE_A, 0)?.fromV2).toBe(true);

    // RULE 4: the v2 record is BYTE-UNCHANGED and still there. A record left
    // by a schema this version does not own is not this version's to touch.
    expect(map.get(SNAPSHOT_KEY_V2), "the v2 record moved").toBe(v2);
    expect(map.has(SNAPSHOT_KEY_V4), "a kept wrote the v4 key").toBe(false);
    expect(map.has(SNAPSHOT_KEY_V3), "a kept wrote the v3 key").toBe(false);

    // A page the v2 record does NOT have is written under v4, beside it, and
    // read back as a v4 entry with FIVE strings and no flag - so the older
    // record blocks nothing but its own page, and the v2 raw string is
    // byte-unchanged again after a persist that DID write.
    expect(persistIfAbsent(store, MODULE_A, 3, HANGARS, TAKEN)).toBe("written");
    expect(readAt(store, MODULE_A, 3)).toEqual(entry(HANGARS));
    expect(map.get(SNAPSHOT_KEY_V2), "still byte-unchanged").toBe(v2);
    expect([...map.keys()].sort(), "v4 beside v2, and no v1 or v3").toEqual(
      [SNAPSHOT_KEY_V2, SNAPSHOT_KEY_V4].sort(),
    );
    const stored = JSON.parse(map.get(SNAPSHOT_KEY_V4) ?? "null") as {
      v: number;
      modules: Record<string, { pages: Record<string, unknown> }>;
    };
    expect(stored.v).toBe(4);
    expect(stored.modules[MODULE_A].pages["3"]).toEqual({
      systemTimer: HANGARS.systemTimer,
      system: HANGARS.system,
      systemUtility: HANGARS.systemUtility,
      setup: HANGARS.setup,
      timer: HANGARS.timer,
      takenAt: TAKEN,
    });
    // And page 0 still reads from v2 - the v4 record holds no entry for it.
    expect(readAt(store, MODULE_A, 0)?.fromV2).toBe(true);

    // V4 WINS WHERE BOTH EXIST, same module, same page, under both keys.
    const { store: both } = fakeStore();
    both.setItem(SNAPSHOT_KEY_V2, v2);
    both.setItem(
      SNAPSHOT_KEY_V4,
      `{"v":4,"modules":{"${MODULE_A}":{"pages":{"0":${v4Entry(HANGARS)}}}}}`,
    );
    expect(readAt(both, MODULE_A, 0)).toEqual(entry(HANGARS));

    // THE RECORD PHASE 12.1 LEFT (13-17): a v3 entry holds four strings and
    // no utility, because no version of HANGAR before 13-17 ever wrote
    // element 255's utility event - so the only string a module with a v3
    // record can have met there is the factory page-next, and the caller's
    // utility default stands in for it with `fromV3` beside it and the other
    // four strings the record's own. Never overwritten, never shadowed, the
    // v3 raw byte-unchanged through a kept and through a write for another
    // page.
    const { map: mapV3, store: storeV3 } = fakeStore();
    const quad: ConfigQuad = {
      systemTimer: ORIGINAL.systemTimer,
      system: ORIGINAL.system,
      setup: ORIGINAL.setup,
      timer: ORIGINAL.timer,
    };
    const v3 = `{"v":3,"last":"${MODULE_A}","modules":{"${MODULE_A}":{"pages":{"0":${v3Entry(quad)}}}}}`;
    storeV3.setItem(SNAPSHOT_KEY_V3, v3);
    expect(readAt(storeV3, MODULE_A, 0)).toEqual({
      systemTimer: ORIGINAL.systemTimer,
      system: ORIGINAL.system,
      systemUtility: PASSED_UTILITY_DEFAULT,
      setup: ORIGINAL.setup,
      timer: ORIGINAL.timer,
      fromV1: false,
      fromV2: false,
      fromV3: true,
    });
    expect(
      readSnapshot(storeV3, MODULE_A, 0, {
        system: "OTHER",
        systemTimer: "OTHER-TIMER",
        systemUtility: "OTHER-UTILITY",
      })?.systemUtility,
    ).toBe("OTHER-UTILITY");
    expect(hasSnapshotFor(storeV3, MODULE_A), "a v3 entry counts").toBe(true);
    expect(lastModuleId(storeV3), "and so does its `last`").toBe(MODULE_A);
    expect(
      persistIfAbsent(storeV3, MODULE_A, 0, HANGARS, TAKEN),
      "a v4 entry was written over a v3 original",
    ).toBe("kept");
    expect(mapV3.has(SNAPSHOT_KEY_V4), "a kept wrote the v4 key").toBe(false);
    expect(persistIfAbsent(storeV3, MODULE_A, 3, HANGARS, TAKEN)).toBe(
      "written",
    );
    expect(readAt(storeV3, MODULE_A, 3)).toEqual(entry(HANGARS));
    expect(readAt(storeV3, MODULE_A, 0)?.fromV3).toBe(true);
    expect(mapV3.get(SNAPSHOT_KEY_V3), "the v3 record moved").toBe(v3);
    expect([...mapV3.keys()].sort(), "v4 beside v3, and no v1 or v2").toEqual(
      [SNAPSHOT_KEY_V3, SNAPSHOT_KEY_V4].sort(),
    );

    // ALL FOUR KEYS AT ONCE, each holding a different page: every entry
    // reads from its own key with its own flags, and `last` comes from the
    // newest key that has one.
    const { store: three } = fakeStore();
    three.setItem(
      SNAPSHOT_KEY,
      `{"v":1,"last":"${MODULE_B}","modules":{"${MODULE_A}":{"pages":{"1":{"setup":"s1","timer":"t1","takenAt":"${TAKEN}"}}}}}`,
    );
    three.setItem(
      SNAPSHOT_KEY_V2,
      `{"v":2,"last":"${MODULE_C}","modules":{"${MODULE_A}":{"pages":{"2":{"system":"y2","setup":"s2","timer":"t2","takenAt":"${TAKEN}"}}}}}`,
    );
    three.setItem(
      SNAPSHOT_KEY_V3,
      `{"v":3,"last":"${MODULE_B}","modules":{"${MODULE_A}":{"pages":{"3":${v3Entry(quad)}}}}}`,
    );
    three.setItem(
      SNAPSHOT_KEY_V4,
      `{"v":4,"last":"${MODULE_A}","modules":{"${MODULE_A}":{"pages":{"4":${v4Entry(ORIGINAL)}}}}}`,
    );
    expect(readAt(three, MODULE_A, 1)).toEqual({
      systemTimer: PASSED_TIMER_DEFAULT,
      system: PASSED_DEFAULT,
      systemUtility: PASSED_UTILITY_DEFAULT,
      setup: "s1",
      timer: "t1",
      fromV1: true,
      fromV2: false,
      fromV3: false,
    });
    expect(readAt(three, MODULE_A, 2)).toEqual({
      systemTimer: PASSED_TIMER_DEFAULT,
      system: "y2",
      systemUtility: PASSED_UTILITY_DEFAULT,
      setup: "s2",
      timer: "t2",
      fromV1: false,
      fromV2: true,
      fromV3: false,
    });
    expect(readAt(three, MODULE_A, 3)).toEqual({
      ...quad,
      systemUtility: PASSED_UTILITY_DEFAULT,
      fromV1: false,
      fromV2: false,
      fromV3: true,
    });
    expect(readAt(three, MODULE_A, 4)).toEqual(entry(ORIGINAL));
    expect(readAt(three, MODULE_A, 0)).toBeUndefined();
    expect(lastModuleId(three), "the newest key's last").toBe(MODULE_A);
    // A `last` only under the older keys still answers, newest first.
    const { store: olderLast } = fakeStore();
    olderLast.setItem(
      SNAPSHOT_KEY,
      `{"v":1,"last":"${MODULE_B}","modules":{}}`,
    );
    olderLast.setItem(
      SNAPSHOT_KEY_V2,
      `{"v":2,"last":"${MODULE_C}","modules":{}}`,
    );
    expect(lastModuleId(olderLast)).toBe(MODULE_C);
    olderLast.setItem(
      SNAPSHOT_KEY_V3,
      `{"v":3,"last":"${MODULE_A}","modules":{}}`,
    );
    expect(lastModuleId(olderLast), "v3 before v2").toBe(MODULE_A);

    // AND A V4 ENTRY MISSING `systemUtility` IS ABSENT, NOT HALF-READ - the
    // negative check one string on from test 8's: a four-string entry under
    // the v4 key is not a v4 entry (it is not a v3 entry either, because it
    // is under the wrong key), and handing back a set with an undefined
    // utility would put that on the wire on PUT BACK.
    const { store: half } = fakeStore();
    half.setItem(
      SNAPSHOT_KEY_V4,
      `{"v":4,"modules":{"${MODULE_A}":{"pages":{"0":${v3Entry(quad)}}}}}`,
    );
    expect(
      readAt(half, MODULE_A, 0),
      "a half-read entry reached the caller",
    ).toBeUndefined();
    expect(hasSnapshotFor(half, MODULE_A)).toBe(false);
    // And it is replaced, not kept: it was never a copy of anything.
    expect(persistIfAbsent(half, MODULE_A, 0, ORIGINAL, TAKEN)).toBe("written");
    expect(readAt(half, MODULE_A, 0)).toEqual(entry(ORIGINAL));

    // The v1 test's v1 record, beside a v2 one for the same page: v2 wins
    // over v1 exactly as before this plan - the middle key is read, and read
    // before the oldest.
    const { store: middle } = fakeStore();
    middle.setItem(
      SNAPSHOT_KEY,
      `{"v":1,"modules":{"${MODULE_A}":{"pages":{"0":{"setup":"old-s","timer":"old-t","takenAt":"${TAKEN}"}}}}}`,
    );
    middle.setItem(SNAPSHOT_KEY_V2, v2);
    expect(readAt(middle, MODULE_A, 0)?.setup).toBe(ORIGINAL.setup);
    expect(readAt(middle, MODULE_A, 0)?.fromV2).toBe(true);
    expect(readAt(middle, MODULE_A, 0)?.fromV1).toBe(false);
  });
});
