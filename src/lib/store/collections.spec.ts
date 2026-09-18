// Collections at the user's four answers (src/lib/store/collections.ts, plan
// 13-13, 13-CONTEXT D-22 "many session bare no"). Four tests, in the plan's
// order:
//
//   1. create, rename, delete round-trip through a working store, and through
//      a store that throws every outcome degrades to absent;
//   2. the membership rule at fork A (MANY): a record in two collections at
//      once, and deleting the record removes it from EVERY collection - the
//      failure message names the orphan - while an id the library no longer
//      carries is dropped on read and the drop counted (favorites' rule);
//   3. the undo at fork B (SESSION): delete returns the vector, the store
//      holds no trace of it, a fresh read (a reload) finds nothing, the held
//      vector restores it whole, and once the vector is gone (the session's
//      end) nothing in storage can bring it back;
//   4. export and import at fork D (NO): the exported file carries no
//      membership, an import lands unfiled, and a file hand-edited to carry
//      a collections field creates nothing.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { byId } from "../catalog";
import { stampKnobs } from "../share/stamp";
import {
  collectionsOf,
  createCollection,
  deleteCollection,
  readCollections,
  removeFromAll,
  renameCollection,
  restoreCollection,
  setMember,
  type Collection,
} from "./collections";
import { readLibrary, saveCopy } from "./library";
import type { LocalStore } from "./local";
import {
  COLLECTIONS_KEY,
  LIBRARY_KEY,
  OWNED_KEYS,
  SCHEMA_VERSION,
  type PlaygroundRecord,
} from "./schema";
import {
  exportFile,
  importText,
  serialiseExport,
  type KnobsOf,
} from "./transfer";
import { stripComments } from "../../test-support/source";

const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));

/** A Storage over a Map, with a log of every setItem. */
function fakeStore() {
  const map = new Map<string, string>();
  const written: string[] = [];
  const store: LocalStore = {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      written.push(key);
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
  return { map, written, store };
}

/** A store that throws on every method, the way a private window does. */
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

const T0 = "2026-09-11T10:00:00.000Z";
const T1 = "2026-09-11T10:42:00.000Z";

const catalogKnobs: KnobsOf = (id) => {
  const found = byId(id);
  return found === undefined ? undefined : stampKnobs(found);
};

function copy(id: string, source: string): PlaygroundRecord {
  const entry = byId(source);
  if (!entry) throw new Error(`the catalog lost ${source}`);
  return {
    schema: SCHEMA_VERSION,
    kind: "playground",
    id,
    name: `${entry.name} copy`,
    source,
    knobIndices: stampKnobs(entry).map((knob) => knob.default),
    createdAt: T0,
    editedAt: T0,
  };
}

/** The route's validator: the library's ids. */
const knownIn = (store: LocalStore) => (id: string) => id in readLibrary(store);

describe("collections at the user's four answers (src/lib/store/collections.ts)", () => {
  it("1. create, rename and delete round-trip, and a store that throws degrades every outcome to absent", () => {
    const { store, map } = fakeStore();
    const everything = () => true;

    expect(readCollections(store, everything)).toEqual({
      list: [],
      dropped: 0,
    });

    // CREATE, twice, in order; a repeated id is kept untouched.
    expect(createCollection(store, "c-live", "Live set", T0)).toBe("written");
    expect(createCollection(store, "c-studio", "Studio experiments", T1)).toBe(
      "written",
    );
    expect(createCollection(store, "c-live", "Another name", T1)).toBe("kept");
    const two = readCollections(store, everything).list;
    expect(two.map((c) => [c.id, c.name, c.createdAt])).toEqual([
      ["c-live", "Live set", T0],
      ["c-studio", "Studio experiments", T1],
    ]);
    expect(two.every((c) => c.schema === 1 && c.members.length === 0)).toBe(
      true,
    );

    // The envelope: the version in the key AND in every body.
    const raw = JSON.parse(map.get(COLLECTIONS_KEY) ?? "null");
    expect(raw.schema).toBe(1);
    expect(raw.collections[0].schema).toBe(1);
    expect(OWNED_KEYS, "the key is owned since 13-13").toContain(
      COLLECTIONS_KEY,
    );

    // RENAME moves the name and nothing else.
    expect(renameCollection(store, "c-live", "Live set 2026")).toBe("written");
    expect(renameCollection(store, "c-none", "x")).toBe("absent");
    const renamed = readCollections(store, everything).list[0];
    expect(renamed.name).toBe("Live set 2026");
    expect(renamed.createdAt).toBe(T0);

    // DELETE is one id, and returns what it removed.
    const removed = deleteCollection(store, "c-studio");
    expect(removed?.name).toBe("Studio experiments");
    expect(deleteCollection(store, "c-studio")).toBe(undefined);
    expect(readCollections(store, everything).list.map((c) => c.id)).toEqual([
      "c-live",
    ]);

    // A malformed collection hides no neighbour; a corrupt envelope reads as
    // nothing and is left in place until the next write replaces it.
    map.set(
      COLLECTIONS_KEY,
      JSON.stringify({
        schema: 1,
        collections: [
          { schema: 1, id: "ok", name: "Fine", createdAt: T0, members: [] },
          { schema: 1, id: "bad", name: "No members" },
          "not a collection",
        ],
      }),
    );
    expect(readCollections(store, everything).list.map((c) => c.id)).toEqual([
      "ok",
    ]);
    map.set(COLLECTIONS_KEY, "{ not json");
    expect(readCollections(store, everything).list).toEqual([]);
    expect(map.get(COLLECTIONS_KEY)).toBe("{ not json");

    // THE STORE THAT THROWS: every read is absent, every write refused,
    // nothing thrown, nothing held.
    expect(readCollections(HOSTILE_STORE, everything)).toEqual({
      list: [],
      dropped: 0,
    });
    expect(createCollection(HOSTILE_STORE, "c", "Live set", T0)).toBe(
      "refused",
    );
    expect(renameCollection(HOSTILE_STORE, "c", "x")).toBe("refused");
    expect(deleteCollection(HOSTILE_STORE, "c")).toBe(undefined);
    expect(setMember(HOSTILE_STORE, "c", "r", true)).toBe("refused");
    expect(removeFromAll(HOSTILE_STORE, "r")).toBe(undefined);
    expect(
      restoreCollection(HOSTILE_STORE, {
        schema: 1,
        id: "c",
        name: "Live set",
        createdAt: T0,
        members: [],
      }),
    ).toBe("refused");
    expect(readCollections(undefined, everything).list).toEqual([]);
    expect(createCollection(undefined, "c", "Live set", T0)).toBe("refused");

    // The module imports nothing heavy and names no window.
    const code = stripComments(readFileSync(here("./collections.ts"), "utf8"));
    for (const word of ["svelte", "catalog", "window", "localStorage"]) {
      expect(code.includes(word), `collections.ts names ${word}`).toBe(false);
    }
    expect(code.includes('"Saved"')).toBe(false);
  });

  it("2. fork A (many): a record is in two collections at once, deleting it removes it from every one, and an unknown id is dropped on read and counted", () => {
    const { store, map } = fakeStore();
    const arc = copy("copy:arc:1", "arc");
    const orbit = copy("copy:orbit:1", "orbit");
    expect(saveCopy(store, arc)).toBe("written");
    expect(saveCopy(store, orbit)).toBe("written");
    const known = knownIn(store);

    createCollection(store, "c-live", "Live set", T0);
    createCollection(store, "c-studio", "Studio experiments", T0);

    // MANY: the same record filed in both; the second filing never removes
    // the first (that would be fork A's other answer).
    expect(setMember(store, "c-live", arc.id, true)).toBe("written");
    expect(setMember(store, "c-studio", arc.id, true)).toBe("written");
    expect(setMember(store, "c-live", orbit.id, true)).toBe("written");
    let list = readCollections(store, known).list;
    expect(collectionsOf(list, arc.id)).toEqual(["c-live", "c-studio"]);
    expect(collectionsOf(list, orbit.id)).toEqual(["c-live"]);

    // Filing twice is a success with no second write; unfiling from one
    // leaves the other.
    const before = map.get(COLLECTIONS_KEY);
    expect(setMember(store, "c-live", arc.id, true)).toBe("written");
    expect(map.get(COLLECTIONS_KEY)).toBe(before);
    expect(setMember(store, "c-studio", arc.id, false)).toBe("written");
    expect(collectionsOf(readCollections(store, known).list, arc.id)).toEqual([
      "c-live",
    ]);
    expect(setMember(store, "c-studio", arc.id, true)).toBe("written");
    expect(setMember(store, "c-none", arc.id, true)).toBe("absent");

    // THE RECONCILIATION: deleting the record removes it from EVERY
    // collection. The failure message names any collection still holding it.
    expect(removeFromAll(store, arc.id)).toEqual(["c-live", "c-studio"]);
    list = readCollections(store, known).list;
    const orphaned = list
      .filter((c) => c.members.includes(arc.id))
      .map((c) => c.name);
    expect(
      orphaned,
      `${arc.id} was deleted and is still filed in: ${orphaned.join(", ")}`,
    ).toEqual([]);
    expect(collectionsOf(list, orbit.id), "the neighbour is untouched").toEqual(
      ["c-live"],
    );
    expect(
      removeFromAll(store, "copy:nobody:1"),
      "not filed: no write",
    ).toEqual([]);

    // THE DROP RULE, favorites' shape: an id the library no longer carries
    // is dropped on read and COUNTED, and the raw record is untouched.
    map.set(
      COLLECTIONS_KEY,
      JSON.stringify({
        schema: 1,
        collections: [
          {
            schema: 1,
            id: "c-live",
            name: "Live set",
            createdAt: T0,
            members: [orbit.id, "copy:forge:gone", "copy:keys:gone"],
          },
          {
            schema: 1,
            id: "c-studio",
            name: "Studio experiments",
            createdAt: T0,
            members: ["copy:forge:gone"],
          },
        ],
      }),
    );
    const rawBefore = map.get(COLLECTIONS_KEY);
    const read = readCollections(store, known);
    expect(read.list.map((c) => c.members)).toEqual([[orbit.id], []]);
    expect(
      read.dropped,
      "a shorter list without a count is the coy state D-05 forbids",
    ).toBe(3);
    expect(map.get(COLLECTIONS_KEY), "reading never writes").toBe(rawBefore);
    // The next write stores the pruned list the caller was handed... only if
    // the caller hands it; a write through setMember keeps what it loaded.
    expect(setMember(store, "c-studio", orbit.id, true)).toBe("written");
    expect(readCollections(store, known).dropped).toBe(3);
  });

  it("3. fork B (session): delete returns the vector, the store holds no trace, a reload finds nothing, the held vector restores it, and after the session nothing can", () => {
    const { store, map, written } = fakeStore();
    const arc = copy("copy:arc:1", "arc");
    saveCopy(store, arc);
    const known = knownIn(store);
    createCollection(store, "c-live", "Live set", T0);
    setMember(store, "c-live", arc.id, true);
    written.length = 0;

    // DELETE hands back the whole collection - the undo vector - and the
    // store is left with an envelope that does not carry it anywhere.
    let held: Collection | undefined = deleteCollection(store, "c-live");
    expect(held).toEqual({
      schema: 1,
      id: "c-live",
      name: "Live set",
      createdAt: T0,
      members: [arc.id],
    });
    expect(written, "one write, to the one key - no tombstone key").toEqual([
      COLLECTIONS_KEY,
    ]);
    expect(
      [...map.keys()].filter((key) => !OWNED_KEYS.includes(key)),
      "no key outside the owned set was written",
    ).toEqual([]);
    expect(map.get(COLLECTIONS_KEY)).not.toContain("c-live");
    expect(map.get(COLLECTIONS_KEY)).not.toContain("Live set");
    expect(map.get(COLLECTIONS_KEY)).not.toContain("tombstone");

    // A RELOAD: a fresh read of the same store finds nothing to undo.
    const reloaded = fakeStore();
    for (const [key, value] of map) reloaded.map.set(key, value);
    expect(readCollections(reloaded.store, known).list).toEqual([]);

    // THE UNDO, from the held vector, within the session: back whole.
    if (held === undefined) throw new Error("the vector was not handed back");
    const vector: Collection = held;
    expect(restoreCollection(store, vector)).toBe("written");
    const back = readCollections(store, known).list;
    expect(back).toEqual([vector]);
    expect(collectionsOf(back, arc.id)).toEqual(["c-live"]);
    // Restoring again is kept: the id is there.
    expect(restoreCollection(store, vector)).toBe("kept");

    // THE SESSION'S END: the vector is gone with the tab. Delete again, drop
    // the vector, and there is nothing in storage that could bring it back -
    // the honest cost of fork B, chosen over a tombstone.
    deleteCollection(store, "c-live");
    held = undefined;
    expect(held).toBe(undefined);
    expect(JSON.stringify([...map.entries()])).not.toContain("c-live");
    expect(readCollections(store, known).list).toEqual([]);
  });

  it("4. fork D (no): the export carries no membership, an import lands unfiled, and a file that claims a collection creates none", () => {
    const { store, map, written } = fakeStore();
    const arc = copy("copy:arc:1", "arc");
    saveCopy(store, arc);
    createCollection(store, "c-live", "Live set", T0);
    setMember(store, "c-live", arc.id, true);
    const known = knownIn(store);
    expect(collectionsOf(readCollections(store, known).list, arc.id)).toEqual([
      "c-live",
    ]);

    // THE EXPORT: no collections field, and the collection's name is nowhere
    // in the bytes.
    const file = exportFile(arc, T1, catalogKnobs);
    expect("collections" in file).toBe(false);
    expect("collection" in file).toBe(false);
    const text = serialiseExport(file);
    expect(text).not.toContain("Live set");
    expect(text).not.toContain("c-live");
    expect(text).not.toContain("collections");

    // THE IMPORT, into a second browser that has the same collection: the
    // record lands, unfiled, and the collections key is never written.
    const other = fakeStore();
    createCollection(other.store, "c-live", "Live set", T0);
    other.written.length = 0;
    const landed = importText(other.store, text, catalogKnobs, T1);
    expect(landed.landing.kind).toBe("restored");
    expect(landed.stored).toBe(true);
    expect(other.written).toEqual([LIBRARY_KEY]);
    const otherKnown = knownIn(other.store);
    expect(
      collectionsOf(readCollections(other.store, otherKnown).list, arc.id),
      "an import always lands unfiled",
    ).toEqual([]);

    // A FILE THAT CLAIMS A COLLECTION - hand-edited to carry what D-22 says
    // does not travel - is imported as a record and creates nothing: no
    // collection appears, the key is not written, the claimed name is not in
    // the store.
    const claiming = JSON.stringify({
      ...file,
      collections: [{ id: "c-tour", name: "Tour 2026", members: [arc.id] }],
    });
    const third = fakeStore();
    const result = importText(third.store, claiming, catalogKnobs, T1);
    expect(result.landing.kind).toBe("restored");
    expect(third.written).toEqual([LIBRARY_KEY]);
    expect(third.map.has(COLLECTIONS_KEY)).toBe(false);
    expect(readCollections(third.store, knownIn(third.store)).list).toEqual([]);
    expect(JSON.stringify([...third.map.values()])).not.toContain("Tour 2026");

    // And the first store is exactly as it was: exporting is a read.
    expect(written.filter((key) => key === COLLECTIONS_KEY).length).toBe(2);
    expect(collectionsOf(readCollections(store, known).list, arc.id)).toEqual([
      "c-live",
    ]);
    expect(map.get(LIBRARY_KEY)).toContain(arc.id);
  });
});
