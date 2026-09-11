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
// saved copy overwritten from its source (9); the intro flag reported seen
// on a refusing store, or the motion word moved by the fold (10).
//
// TEN, NOT SEVEN. The plan asked for seven and allowed an eighth for the
// favorites drop rule. Three subjects had no honest home in the seven: the
// drop rule (8), the library's never-overwrite rule (9) and the two flags
// (10). Folding them into 7 to hold a number is the dishonesty the counting
// rule exists to prevent, so the term is +10 and the SUMMARY says so.
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
  COLLECTIONS_KEY,
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
  type Draft,
  type SavedCopy,
  type Surface,
} from "./schema";
import {
  draftIdFor,
  newestDraft,
  readDraft,
  readDrafts,
  removeDraft,
  writeDraft,
} from "./drafts";
import {
  deleteCopy,
  duplicateCopy,
  readCopy,
  readLibrary,
  renameCopy,
  saveCopy,
} from "./library";
import {
  isFavorite,
  readFavorites,
  setFavorite,
  toggleFavorite,
} from "./favorites";
import {
  RECENT_CAP,
  RECENT_SHOWN,
  listRecent,
  recentCount,
  touchRecent,
} from "./recent";
import { hasSeenIntro, markIntroSeen, readIntro } from "./intro";
import { MOTION_CHOICES, readMotion, writeMotion } from "./motion";

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
      "hangar.collections.v1",
    ]);
    expect([
      DRAFTS_KEY,
      LIBRARY_KEY,
      FAVORITES_KEY,
      RECENT_KEY,
      INTRO_KEY,
    ]).toEqual(OWNED_KEYS.slice(0, 5));
    expect(MOTION_KEY, "13-04's key, adopted by name").toBe("hangar.motion.v1");
    // Reserved at 13-06, spent at 13-13 (D-22): the key is owned now and
    // collections.ts is its one reader and writer.
    expect(COLLECTIONS_KEY).toBe("hangar.collections.v1");
    expect(OWNED_KEYS, "the spent key is owned").toContain(COLLECTIONS_KEY);
    expect(OWNED_KEYS.length).toBe(7);
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

// ---------------------------------------------------------------------------
// The five stores over the primitive.

const T0 = "2026-09-11T10:00:00.000Z";
const T1 = "2026-09-11T10:05:00.000Z";
const T2 = "2026-09-11T10:12:00.000Z";

/** A Playground draft: an entry and one index per knob. */
const ARC_DRAFT: Draft = {
  schema: 1,
  kind: "playground",
  id: draftIdFor("playground", "arc"),
  name: "Arc",
  createdAt: T0,
  editedAt: T0,
  source: "arc",
  knobIndices: [3, 0, 7, 2, 1],
};

/**
 * THE PDF's PAGE-3 SURFACE (13-CONTEXT D-18): a 2x6 Fader, an XY pad, a
 * Button and a Knob. Region names are fixture data, not copy.
 */
const PAGE3: Surface = {
  id: "surface-page3",
  name: "Custom surface",
  regions: [
    {
      id: "r1",
      name: "Filter",
      kind: "fader",
      col: 0,
      row: 0,
      w: 2,
      h: 6,
      cc: 74,
      channel: 1,
      colour: [13, 15, 4],
    },
    {
      id: "r2",
      name: "Space",
      kind: "xy",
      col: 3,
      row: 0,
      w: 4,
      h: 4,
      cc: 16,
      cc2: 17,
      channel: 1,
      colour: [4, 12, 15],
    },
    {
      id: "r3",
      name: "Hold",
      kind: "button",
      col: 3,
      row: 5,
      w: 2,
      h: 2,
      cc: 64,
      channel: 1,
      colour: [15, 5, 3],
      latch: true,
    },
    {
      id: "r4",
      name: "Rate",
      kind: "knob",
      col: 6,
      row: 5,
      w: 3,
      h: 3,
      cc: 1,
      channel: 1,
      colour: [15, 15, 15],
    },
  ],
};

const PAGE3_DRAFT: Draft = {
  schema: 1,
  kind: "sandbox",
  id: draftIdFor("sandbox", PAGE3.id),
  name: PAGE3.name,
  createdAt: T0,
  editedAt: T0,
  source: PAGE3.id,
  surface: PAGE3,
};

/** The twelve ids Phases 11 and 12 removed (11-01, 12-04). */
const REMOVED = [
  "hold",
  "keys",
  "learn",
  "switch",
  "etch",
  "gridlock",
  "life",
  "slam",
  "table",
  "lattice",
  "forge",
  "shuttle",
];
const KNOWN = new Set(["arc", "euclid", "chorus", "ghost", "morph", "sonar"]);
const isKnown = (id: string): boolean => KNOWN.has(id);

describe("the five stores (src/lib/store/*.ts)", () => {
  it("6. recent caps at twelve, dedupes by id, and six is what a caller asking for six gets", () => {
    expect(RECENT_CAP, "kept").toBe(12);
    expect(RECENT_SHOWN, "shown").toBe(6);

    const { map, store } = fakeStore();
    expect(listRecent(store)).toEqual([]);
    expect(recentCount(store)).toBe(0);

    // Thirteen opens: the first one falls off, the twelve newest remain.
    for (let n = 1; n <= 13; n += 1) {
      const at = `2026-09-11T10:${String(n).padStart(2, "0")}:00.000Z`;
      expect(touchRecent(store, `e${n}`, at)).toBe(true);
    }
    expect(recentCount(store), "capped at twelve").toBe(12);
    const all = listRecent(store, RECENT_CAP);
    expect(all.map((item) => item.id)).toEqual([
      "e13",
      "e12",
      "e11",
      "e10",
      "e9",
      "e8",
      "e7",
      "e6",
      "e5",
      "e4",
      "e3",
      "e2",
    ]);
    expect(
      all.map((item) => item.id),
      "the oldest is gone",
    ).not.toContain("e1");

    // Six is what the rail gets: the six newest, in order.
    expect(listRecent(store).map((item) => item.id)).toEqual([
      "e13",
      "e12",
      "e11",
      "e10",
      "e9",
      "e8",
    ]);
    expect(listRecent(store, 6)).toEqual(listRecent(store));

    // Dedupe: reopening e5 moves it to the front, keeps the count at twelve,
    // and carries its new moment.
    expect(touchRecent(store, "e5", T2)).toBe(true);
    expect(recentCount(store)).toBe(12);
    expect(listRecent(store)[0]).toEqual({ id: "e5", at: T2 });
    expect(
      listRecent(store, RECENT_CAP).filter((item) => item.id === "e5"),
    ).toHaveLength(1);

    // Asking for more than is kept gets what is kept; asking for nothing gets nothing.
    expect(listRecent(store, 100)).toHaveLength(12);
    expect(listRecent(store, 0)).toEqual([]);

    // The body carries its version and the key is the named one.
    expect([...map.keys()]).toEqual([RECENT_KEY]);
    expect(JSON.parse(map.get(RECENT_KEY) ?? "null").schema).toBe(1);

    // A malformed item hides no neighbour.
    map.set(
      RECENT_KEY,
      '{"schema":1,"items":[{"id":"x","at":"t"},{"id":7},"junk",{"id":"y","at":"u"}]}',
    );
    expect(listRecent(store).map((item) => item.id)).toEqual(["x", "y"]);

    // Refusing stores: nothing listed, the touch reported, nothing thrown.
    expect(listRecent(HOSTILE_STORE)).toEqual([]);
    expect(listRecent(ACCESS_THROWS)).toEqual([]);
    expect(touchRecent(HOSTILE_STORE, "e1", T0)).toBe(false);
    expect(touchRecent(undefined, "e1", T0)).toBe(false);
  });

  it("7. a draft round-trips: write, read, edit, read, remove, read - editedAt moving and createdAt not - and another kind's draft survives", () => {
    const { map, store } = fakeStore();
    expect(readDraft(store, ARC_DRAFT.id)).toBeUndefined();
    expect(newestDraft(store)).toBeUndefined();

    // WRITE at T0, READ.
    expect(writeDraft(store, ARC_DRAFT, T0)).toBe(true);
    const first = readDraft(store, ARC_DRAFT.id);
    expect(first).toEqual(ARC_DRAFT);
    expect([...map.keys()]).toEqual([DRAFTS_KEY]);
    expect(
      JSON.parse(map.get(DRAFTS_KEY) ?? "null").schema,
      "the envelope carries its version",
    ).toBe(1);
    expect(
      first?.schema,
      "and so does the record, for the day it is exported",
    ).toBe(1);

    // A second kind beside it.
    expect(writeDraft(store, PAGE3_DRAFT, T0)).toBe(true);
    expect(Object.keys(readDrafts(store)).sort()).toEqual(
      [ARC_DRAFT.id, PAGE3_DRAFT.id].sort(),
    );

    // EDIT at T1 - the caller hands a stale createdAt on purpose, and the
    // store keeps the original.
    const edited: Draft = {
      ...ARC_DRAFT,
      knobIndices: [3, 0, 7, 2, 4],
      createdAt: T2,
    };
    expect(writeDraft(store, edited, T1)).toBe(true);
    const second = readDraft(store, ARC_DRAFT.id);
    expect(
      second?.kind === "playground" ? second.knobIndices : undefined,
    ).toEqual([3, 0, 7, 2, 4]);
    expect(second?.editedAt, "editedAt moved").toBe(T1);
    expect(second?.createdAt, "createdAt did not").toBe(T0);
    expect(newestDraft(store)?.id, "the edited one is newest").toBe(
      ARC_DRAFT.id,
    );
    expect(
      readDraft(store, PAGE3_DRAFT.id),
      "the other kind's draft is untouched",
    ).toEqual(PAGE3_DRAFT);

    // REMOVE, READ: only the one id goes.
    expect(removeDraft(store, ARC_DRAFT.id)).toBe(true);
    expect(readDraft(store, ARC_DRAFT.id)).toBeUndefined();
    expect(
      readDraft(store, PAGE3_DRAFT.id),
      "removing one kind's draft never deletes another's",
    ).toEqual(PAGE3_DRAFT);
    expect(newestDraft(store)?.id).toBe(PAGE3_DRAFT.id);
    expect(
      removeDraft(store, "never-there"),
      "removing what is not there is a success",
    ).toBe(true);

    // ONE DRAFT PER SOURCE: the id is a function of kind and source.
    expect(draftIdFor("playground", "arc")).toBe("playground:arc");
    expect(draftIdFor("sandbox", "arc")).not.toBe(
      draftIdFor("playground", "arc"),
    );

    // AN ENTRY THIS VERSION CANNOT READ SURVIVES A WRITE BESIDE IT, and is
    // not handed out.
    map.set(
      DRAFTS_KEY,
      `{"schema":1,"drafts":{"future:x":{"schema":3,"shape":"unknown"},"${PAGE3_DRAFT.id}":${JSON.stringify(PAGE3_DRAFT)}}}`,
    );
    expect(Object.keys(readDrafts(store))).toEqual([PAGE3_DRAFT.id]);
    expect(writeDraft(store, ARC_DRAFT, T2)).toBe(true);
    expect(
      JSON.parse(map.get(DRAFTS_KEY) ?? "null").drafts["future:x"],
    ).toEqual({
      schema: 3,
      shape: "unknown",
    });

    // A REFUSED READ DECLINES THE WRITE rather than writing blind over every draft.
    const refusingRead: LocalStore = {
      ...store,
      getItem: HOSTILE_STORE.getItem,
    };
    const before = map.get(DRAFTS_KEY);
    expect(writeDraft(refusingRead, ARC_DRAFT, T2)).toBe(false);
    expect(removeDraft(refusingRead, ARC_DRAFT.id)).toBe(false);
    expect(map.get(DRAFTS_KEY), "nothing was written blind").toBe(before);
    // A corrupt envelope is replaced whole: nothing in it was ever a draft.
    map.set(DRAFTS_KEY, "not json");
    expect(readDrafts(store)).toEqual({});
    expect(writeDraft(store, ARC_DRAFT, T2)).toBe(true);
    expect(readDraft(store, ARC_DRAFT.id)?.editedAt).toBe(T2);

    // Every function degrades on a refusing store.
    expect(readDrafts(HOSTILE_STORE)).toEqual({});
    expect(readDrafts(ACCESS_THROWS)).toEqual({});
    expect(newestDraft(undefined)).toBeUndefined();
    expect(writeDraft(undefined, ARC_DRAFT, T0)).toBe(false);
    const { store: full } = fullStore();
    expect(writeDraft(full, ARC_DRAFT, T0), "a full quota is reported").toBe(
      false,
    );

    // SIZE, MEASURED. No thumbnail is stored anywhere: a Playground draft
    // and the PDF's four-element surface are both a fraction of a kilobyte,
    // which is why localStorage holds thousands and IndexedDB is a
    // documented escape hatch and not a dependency.
    const playgroundBytes = JSON.stringify(ARC_DRAFT).length;
    const surfaceBytes = JSON.stringify(PAGE3_DRAFT).length;
    console.log(
      `13-06 measured: playground draft ${playgroundBytes} bytes; page-3 four-element surface draft ${surfaceBytes} bytes`,
    );
    expect(playgroundBytes).toBeLessThan(256);
    expect(surfaceBytes).toBeLessThan(1024);
  });

  it("8. favorites drop an id the catalog no longer carries on read, and the drop is counted", () => {
    const { map, store } = fakeStore();
    expect(readFavorites(store, isKnown)).toEqual({ ids: [], dropped: 0 });

    expect(setFavorite(store, "arc", true, isKnown)).toBe(true);
    expect(setFavorite(store, "ghost", true, isKnown)).toBe(true);
    expect(setFavorite(store, "euclid", true, isKnown)).toBe(true);
    expect(
      readFavorites(store, isKnown),
      "order-stable, in the order made",
    ).toEqual({
      ids: ["arc", "ghost", "euclid"],
      dropped: 0,
    });
    expect(isFavorite(store, "ghost")).toBe(true);
    expect(isFavorite(store, "sonar")).toBe(false);
    expect([...map.keys()]).toEqual([FAVORITES_KEY]);
    expect(
      JSON.parse(map.get(FAVORITES_KEY) ?? "null").schema,
      "the envelope carries its version",
    ).toBe(1);

    // THE REAL CASE: a visitor starred `forge` before 12-04 removed it and
    // `keys` before 11-01 did. The list is shorter by two AND SAYS SO.
    map.set(
      FAVORITES_KEY,
      JSON.stringify({
        schema: 1,
        ids: ["arc", "forge", "ghost", "keys", "euclid"],
      }),
    );
    const raw = map.get(FAVORITES_KEY);
    const read = readFavorites(store, isKnown);
    expect(read.ids).toEqual(["arc", "ghost", "euclid"]);
    expect(
      read.dropped,
      "a shorter list without a count is the coy state D-05 forbids",
    ).toBe(2);
    expect(map.get(FAVORITES_KEY), "reading never writes").toBe(raw);

    // Against every one of the twelve removed ids: all dropped, all counted.
    map.set(
      FAVORITES_KEY,
      JSON.stringify({ schema: 1, ids: [...REMOVED, "arc"] }),
    );
    const swept = readFavorites(store, isKnown);
    expect(swept).toEqual({ ids: ["arc"], dropped: REMOVED.length });
    expect(swept.dropped).toBe(12);

    // The next change persists the pruned list; unstar removes in place.
    expect(setFavorite(store, "sonar", true, isKnown)).toBe(true);
    expect(JSON.parse(map.get(FAVORITES_KEY) ?? "null").ids).toEqual([
      "arc",
      "sonar",
    ]);
    expect(toggleFavorite(store, "arc", isKnown)).toBe(false);
    expect(readFavorites(store, isKnown).ids).toEqual(["sonar"]);
    expect(toggleFavorite(store, "arc", isKnown)).toBe(true);
    expect(readFavorites(store, isKnown).ids).toEqual(["sonar", "arc"]);

    // An id the catalog does not carry cannot be starred.
    expect(setFavorite(store, "forge", true, isKnown)).toBe(false);
    expect(readFavorites(store, isKnown).ids).toEqual(["sonar", "arc"]);

    // Refusing stores: an empty list with nothing dropped, the write reported.
    expect(readFavorites(HOSTILE_STORE, isKnown)).toEqual({
      ids: [],
      dropped: 0,
    });
    expect(readFavorites(ACCESS_THROWS, isKnown)).toEqual({
      ids: [],
      dropped: 0,
    });
    expect(isFavorite(HOSTILE_STORE, "arc")).toBe(false);
    expect(setFavorite(HOSTILE_STORE, "arc", true, isKnown)).toBe(false);
    expect(toggleFavorite(undefined, "arc", isKnown)).toBeUndefined();
  });

  it("9. a saved copy is created and never overwritten from its source; rename moves editedAt, duplicate is new, delete is one id", () => {
    const { map, store } = fakeStore();
    const copy: SavedCopy = {
      ...ARC_DRAFT,
      id: "copy-1",
      name: "Arc - slow bloom",
    };
    expect(readLibrary(store)).toEqual({});

    expect(saveCopy(store, copy)).toBe("written");
    expect(readCopy(store, "copy-1")).toEqual(copy);
    expect([...map.keys()]).toEqual([LIBRARY_KEY]);
    expect(JSON.parse(map.get(LIBRARY_KEY) ?? "null").schema).toBe(1);

    // NEVER OVERWRITTEN: saving again under the same id - the source moved
    // on, the copy did not - is kept, byte for byte.
    const before = map.get(LIBRARY_KEY);
    const changed: SavedCopy = {
      ...copy,
      knobIndices: [0, 0, 0, 0, 0],
      editedAt: T2,
    };
    expect(
      saveCopy(store, changed),
      "a copy was overwritten from its source",
    ).toBe("kept");
    expect(map.get(LIBRARY_KEY)).toBe(before);
    expect(readCopy(store, "copy-1")).toEqual(copy);

    // RENAME: the name and editedAt move, createdAt does not, the indices do not.
    expect(renameCopy(store, "copy-1", "Arc - faster", T1)).toBe("written");
    const renamed = readCopy(store, "copy-1");
    expect(renamed?.name).toBe("Arc - faster");
    expect(renamed?.editedAt).toBe(T1);
    expect(renamed?.createdAt).toBe(T0);
    expect(
      renamed?.kind === "playground" ? renamed.knobIndices : undefined,
    ).toEqual(copy.knobIndices);
    expect(renameCopy(store, "nope", "x", T1)).toBe("absent");

    // DUPLICATE: a new copy at T2, the source untouched; an existing target is kept.
    expect(duplicateCopy(store, "copy-1", "copy-2", "Arc - copy", T2)).toBe(
      "written",
    );
    const dup = readCopy(store, "copy-2");
    expect(dup?.createdAt).toBe(T2);
    expect(dup?.editedAt).toBe(T2);
    expect(dup?.name).toBe("Arc - copy");
    expect(dup?.source).toBe("arc");
    expect(readCopy(store, "copy-1")).toEqual(renamed);
    expect(duplicateCopy(store, "copy-1", "copy-2", "again", T2)).toBe("kept");
    expect(duplicateCopy(store, "nope", "copy-3", "x", T2)).toBe("absent");

    // A sandbox copy beside the playground ones.
    const surfaceCopy: SavedCopy = { ...PAGE3_DRAFT, id: "copy-s" };
    expect(saveCopy(store, surfaceCopy)).toBe("written");
    expect(Object.keys(readLibrary(store)).sort()).toEqual([
      "copy-1",
      "copy-2",
      "copy-s",
    ]);

    // DELETE: one id, nothing else.
    expect(deleteCopy(store, "copy-2")).toBe("written");
    expect(Object.keys(readLibrary(store)).sort()).toEqual([
      "copy-1",
      "copy-s",
    ]);
    expect(deleteCopy(store, "copy-2")).toBe("absent");

    // Three words for three objects: nothing in the two record stores names
    // the third. The install store keeps "Stored on ZONA"; a scan of the
    // stripped sources finds no generic "Saved" offered as a status, no
    // Svelte, no catalog, and the reserved key named in schema.ts only.
    for (const file of [
      "drafts.ts",
      "library.ts",
      "favorites.ts",
      "recent.ts",
      "intro.ts",
      "motion.ts",
      "local.ts",
      "schema.ts",
    ]) {
      const code = strip(readFileSync(here(`./${file}`), "utf8"));
      expect(code.includes('"Saved"'), `${file} offers a generic Saved`).toBe(
        false,
      );
      expect(
        code.includes("Stored on ZONA"),
        `${file} names device state`,
      ).toBe(false);
      expect(
        code.includes("collections"),
        `${file} reads or writes the reserved key`,
      ).toBe(file === "schema.ts");
      expect(code.includes("svelte"), `${file} imports Svelte`).toBe(false);
      expect(code.includes("catalog"), `${file} imports the catalog`).toBe(
        false,
      );
    }

    // Refusing stores: every outcome is "refused", nothing thrown.
    expect(saveCopy(HOSTILE_STORE, copy)).toBe("refused");
    expect(saveCopy(ACCESS_THROWS, copy)).toBe("refused");
    expect(renameCopy(HOSTILE_STORE, "copy-1", "x", T1)).toBe("refused");
    expect(duplicateCopy(undefined, "copy-1", "copy-9", "x", T1)).toBe(
      "refused",
    );
    expect(deleteCopy(HOSTILE_STORE, "copy-1")).toBe("refused");
    expect(readLibrary(ACCESS_THROWS)).toEqual({});
    const { store: full } = fullStore();
    expect(saveCopy(full, copy), "a full quota is reported, not thrown").toBe(
      "refused",
    );
  });

  it("10. the intro flag is written once and a refusing browser sees the intro every time; the motion word is 13-04's, unchanged", () => {
    const { map, store } = fakeStore();
    expect(hasSeenIntro(store)).toBe(false);
    expect(readIntro(store)).toBeUndefined();

    expect(markIntroSeen(store, T0)).toBe(true);
    expect(hasSeenIntro(store)).toBe(true);
    expect(readIntro(store)).toEqual({ schema: 1, seen: true, at: T0 });
    expect([...map.keys()]).toEqual([INTRO_KEY]);

    // Once: a second mark keeps the first moment and reports success.
    expect(markIntroSeen(store, T1)).toBe(true);
    expect(readIntro(store)?.at, "the first visit's moment is kept").toBe(T0);

    // THE SAFE DIRECTION. A refusing, throwing or full store never reports
    // "seen", so that visitor gets the intro on every visit rather than a
    // resume card for a draft that was never made.
    expect(hasSeenIntro(HOSTILE_STORE)).toBe(false);
    expect(hasSeenIntro(ACCESS_THROWS)).toBe(false);
    expect(hasSeenIntro(undefined)).toBe(false);
    expect(markIntroSeen(HOSTILE_STORE, T0)).toBe(false);
    expect(markIntroSeen(ACCESS_THROWS, T0)).toBe(false);
    const { store: full } = fullStore();
    expect(markIntroSeen(full, T0)).toBe(false);
    expect(
      hasSeenIntro(full),
      "a mark that could not be written is not seen",
    ).toBe(false);
    // A flag from a later schema, or a malformed one, is not seen either.
    for (const raw of [
      '{"schema":2,"seen":true,"at":"t"}',
      '{"schema":1,"seen":false,"at":"t"}',
      '{"seen":true}',
      "junk",
    ]) {
      const { store: odd } = fakeStore();
      odd.setItem(INTRO_KEY, raw);
      expect(hasSeenIntro(odd), raw).toBe(false);
    }

    // THE MOTION WORD. 13-04 stored the bare word and e2e/browse.e2e.ts
    // writes it by hand; the fold into store/motion.ts must not move it.
    expect(MOTION_CHOICES).toEqual(["animated", "still"]);
    const { map: m, store: motion } = fakeStore();
    expect(
      readMotion(motion),
      "absent means the default, decided by the caller",
    ).toBeUndefined();
    expect(writeMotion(motion, "still")).toBe(true);
    expect(m.get(MOTION_KEY), "the bare word, not JSON").toBe("still");
    expect(readMotion(motion)).toBe("still");
    m.set(MOTION_KEY, "animated");
    expect(readMotion(motion)).toBe("animated");
    m.set(MOTION_KEY, '"still"');
    expect(
      readMotion(motion),
      "a JSON string is not one of the two words",
    ).toBeUndefined();
    m.set(MOTION_KEY, "off");
    expect(readMotion(motion)).toBeUndefined();
    expect(readMotion(HOSTILE_STORE)).toBeUndefined();
    expect(readMotion(ACCESS_THROWS)).toBeUndefined();
    expect(writeMotion(HOSTILE_STORE, "still")).toBe(false);
    expect(writeMotion(undefined, "still")).toBe(false);

    // The Svelte module reads through this one and no longer spells the key
    // or the guard itself: one key, one place.
    const svelteSide = strip(
      readFileSync(here("../sim/motion.svelte.ts"), "utf8"),
    );
    expect(
      svelteSide.includes('"hangar.motion.v1"'),
      "the key is spelled twice",
    ).toBe(false);
    expect(
      svelteSide.includes("getItem"),
      "the Svelte side still carries its own read guard",
    ).toBe(false);
    expect(
      svelteSide.includes("setItem"),
      "the Svelte side still carries its own write guard",
    ).toBe(false);
    expect(
      svelteSide.includes("readMotion(") && svelteSide.includes("writeMotion("),
      "the Svelte side reads and writes through store/motion.ts",
    ).toBe(true);
    expect(
      svelteSide.includes('|| motion.choice === "still"'),
      "the additive OR is where 13-04 left it",
    ).toBe(true);
  });
});
