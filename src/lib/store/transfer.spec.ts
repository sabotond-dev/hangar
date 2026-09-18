// Export as a file and import refused before it opens (src/lib/store/transfer.ts,
// plan 13-13). Four tests, in the plan's order:
//
//   1. an exported record round-trips - export, import, every field including
//      `schema` and `kind` byte-for-byte - and the download revokes its URL;
//   2. a wrong `app` or an unreadable `schema` is `unreadable` and WRITES
//      NOTHING - the store's setItem log is asserted empty, not merely the
//      return value;
//   3. an older readable shape is `older` and lands on the base configuration,
//      matched by name against stamp.spec.ts's "lands older on a resized knob
//      and never restored on a changed rack" - the same entry (orbit, EUCLID until change 8), the
//      same resize (the first knob loses its last option), so the two cannot
//      drift;
//   4. a sandbox record with an off-surface or overlapping region is refused
//      with the region named, and a playground record with an index outside
//      its knob's list is refused with the knob named.
//
// The catalog is reached the way the route reaches it - stampKnobs over byId -
// and handed in as the `knobsOf` argument, because transfer.ts imports no
// catalog (13-06's rule, and local.spec.ts's scan).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

import { describe, expect, it } from "vitest";
import { byId, type CatalogEntry } from "../catalog";
import { brightnessOf, isBrightness } from "../catalog/brightness";
import { decodeFor, encodeFor, stampKnobs } from "../share/stamp";
import { readLibrary } from "./library";
import type { LocalStore } from "./local";
import {
  LIBRARY_KEY,
  SCHEMA_VERSION,
  SURFACE_ELEMENT_CAP,
  isStoredRecord,
  type PlaygroundRecord,
  type SandboxRecord,
  type Region,
  type StoredRecord,
} from "./schema";
import {
  EXPORT_APP,
  IMPORT_REASONS,
  classifyImport,
  downloadExport,
  exportFile,
  exportFileName,
  importText,
  serialiseExport,
  type ExportFile,
  type KnobsOf,
} from "./transfer";

/** A Storage over a Map, with a log of every setItem so a write can be proved absent. */
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

const entry = (id: string): CatalogEntry => {
  const found = byId(id);
  if (!found) throw new Error(`the catalog lost ${id}`);
  return found;
};

/** The route's own knobsOf: the catalog's knobs, or undefined when it has no such entry. */
const catalogKnobs: KnobsOf = (id) => {
  const found = byId(id);
  return found === undefined ? undefined : stampKnobs(found);
};

/** stamp.spec.ts's tunedOf: every knob one step past its default. */
const tunedIndices = (each: CatalogEntry): number[] =>
  stampKnobs(each).map((knob) => (knob.default + 1) % knob.options.length);

const T0 = "2026-09-11T10:00:00.000Z";
const T1 = "2026-09-11T10:42:00.000Z";

function playgroundCopy(id: string, source: string): PlaygroundRecord {
  return {
    schema: SCHEMA_VERSION,
    kind: "playground",
    id,
    name: `${entry(source).name} copy`,
    source,
    knobIndices: tunedIndices(entry(source)),
    createdAt: T0,
    editedAt: T0,
  };
}

function region(
  name: string,
  col: number,
  row: number,
  w: number,
  h: number,
): Region {
  return {
    id: name.toLowerCase(),
    name,
    kind: "fader",
    col,
    row,
    w,
    h,
    cc: 1,
    channel: 1,
    colour: [15, 15, 4],
  };
}

function sandboxCopy(id: string, regions: readonly Region[]): StoredRecord {
  return {
    schema: SCHEMA_VERSION,
    kind: "sandbox",
    id,
    name: "My performance",
    source: "surface-1",
    surface: { id: "surface-1", name: "My performance", regions },
    createdAt: T0,
    editedAt: T0,
  };
}

describe("export as a file and import refused before it opens (src/lib/store/transfer.ts)", () => {
  it("1. an exported record round-trips byte-for-byte, schema and kind included, and the download revokes its URL", () => {
    const copy = playgroundCopy("copy:orbit:1", "orbit");
    const file = exportFile(copy, T1, catalogKnobs);
    expect(file).toEqual({
      schema: 1,
      kind: "playground",
      exportedAt: T1,
      app: EXPORT_APP,
      record: copy,
      rack: stampKnobs(entry("orbit")).map((knob) => ({
        id: knob.id,
        options: knob.options.length,
      })),
    });
    expect(
      Object.keys(file).sort(),
      "the ExportFile shape as shipped - and no collections field, by D-22 fork D",
    ).toEqual(["app", "exportedAt", "kind", "rack", "record", "schema"]);

    // The text a visitor's disk holds, back through the six steps.
    const text = serialiseExport(file);
    const { store, map, written } = fakeStore();
    const result = importText(store, text, catalogKnobs, T1);
    expect(result.landing.kind).toBe("restored");
    expect(result.stored).toBe(true);
    expect(result.record).toEqual(copy);
    expect(
      JSON.stringify(result.record),
      "every field survives byte-for-byte",
    ).toBe(JSON.stringify(copy));
    expect(readLibrary(store)["copy:orbit:1"]).toEqual(copy);
    expect(written).toEqual([LIBRARY_KEY]);

    // The restored indices are the codec's own vocabulary: knob id -> index.
    if (result.landing.kind === "restored") {
      expect(
        decodeFor(
          entry("orbit"),
          encodeFor(entry("orbit"), result.landing.indices),
        ),
        "the imported vector is the vector the stamp would restore",
      ).toEqual(result.landing);
    }

    // A second import of the same file is a second copy, never a silent no-op
    // and never an overwrite.
    const again = importText(store, text, catalogKnobs, T1);
    expect(again.stored).toBe(true);
    expect(again.record?.id).not.toBe(copy.id);
    expect(Object.keys(readLibrary(store)).length).toBe(2);
    expect(map.get(LIBRARY_KEY)).toContain('"copy:orbit:1"');

    // The sandbox kind rides the same envelope with no other code path.
    const surface = sandboxCopy("copy:surface:1", [
      region("Filter", 0, 0, 2, 6),
      region("Pad", 3, 0, 4, 4),
    ]);
    const back = classifyImport(
      serialiseExport(exportFile(surface, T1, catalogKnobs)),
      catalogKnobs,
      T1,
    );
    expect(back.landing).toEqual({ kind: "restored", indices: {} });
    expect(back.record).toEqual(surface);
    expect(
      "rack" in exportFile(surface, T1, catalogKnobs),
      "a sandbox file carries no rack",
    ).toBe(false);

    // The download: a Blob behind an object URL on an anchor with `download`,
    // clicked once, and the URL revoked afterwards - no permission, no API
    // beyond what every supported browser has.
    const created: Blob[] = [];
    const revoked: string[] = [];
    const clicks: { href: string; download: string }[] = [];
    let appended = 0;
    let removed = 0;
    const anchor = {
      href: "",
      download: "",
      rel: "",
      style: { display: "" },
      click() {
        clicks.push({ href: this.href, download: this.download });
      },
      remove() {
        removed += 1;
      },
    };
    const name = downloadExport(file, {
      document: {
        createElement: () => anchor as unknown as HTMLAnchorElement,
        body: {
          append: () => {
            appended += 1;
          },
        } as unknown as HTMLElement,
      },
      url: {
        createObjectURL: (blob: Blob | MediaSource) => {
          created.push(blob as Blob);
          return "blob:hangar/1";
        },
        revokeObjectURL: (href: string) => {
          revoked.push(href);
        },
      },
      defer: (run) => run(),
    });
    expect(name).toBe("orbit-copy.hangar.json");
    expect(exportFileName(surface)).toBe("my-performance.hangar.json");
    expect(created.length).toBe(1);
    expect(created[0].type).toBe("application/json");
    expect(clicks).toEqual([
      { href: "blob:hangar/1", download: "orbit-copy.hangar.json" },
    ]);
    expect(revoked, "the object URL is revoked after the click").toEqual([
      "blob:hangar/1",
    ]);
    expect(appended).toBe(1);
    expect(removed).toBe(1);
  });

  it("2. a wrong app or an unreadable schema is unreadable and writes nothing - the store is untouched", () => {
    const copy = playgroundCopy("copy:arc:1", "arc");
    const good = exportFile(copy, T1, catalogKnobs);

    const cases: { name: string; text: string; reason: string }[] = [
      {
        name: "not JSON",
        text: "{ not json",
        reason: IMPORT_REASONS.notJson,
      },
      {
        name: "somebody else's JSON",
        text: JSON.stringify({ ...good, app: "grid-editor" }),
        reason: IMPORT_REASONS.notHangar,
      },
      {
        name: "no app at all",
        text: JSON.stringify({ schema: 1, kind: "playground", record: copy }),
        reason: IMPORT_REASONS.notHangar,
      },
      {
        name: "a newer schema",
        text: JSON.stringify({ ...good, schema: 2 }),
        reason: IMPORT_REASONS.schemaUnknown(2),
      },
      {
        name: "a schema that is not a number",
        text: JSON.stringify({ ...good, schema: "1" }),
        reason: IMPORT_REASONS.schemaUnknown("1"),
      },
      {
        name: "a kind this build has no store for",
        text: JSON.stringify({ ...good, kind: "preset" }),
        reason: IMPORT_REASONS.kindUnknown,
      },
      {
        name: "a record whose kind disagrees with the envelope's",
        text: JSON.stringify({ ...good, kind: "sandbox" }),
        reason: IMPORT_REASONS.recordMalformed,
      },
      {
        name: "a record with a field missing",
        text: JSON.stringify({
          ...good,
          record: { ...copy, knobIndices: undefined },
        }),
        reason: IMPORT_REASONS.recordMalformed,
      },
      {
        name: "a playground file with no rack - not a HANGAR export",
        text: JSON.stringify({ ...good, rack: undefined }),
        reason: IMPORT_REASONS.recordMalformed,
      },
      {
        name: "a rack that disagrees with the record's own index count",
        text: JSON.stringify({ ...good, rack: good.rack?.slice(1) }),
        reason: IMPORT_REASONS.recordMalformed,
      },
      {
        name: "an entry the catalog no longer carries",
        text: JSON.stringify({
          ...good,
          record: { ...copy, source: "forge" },
        }),
        reason: IMPORT_REASONS.entryGone("forge"),
      },
    ];

    for (const each of cases) {
      const { store, written, map } = fakeStore();
      const result = importText(store, each.text, catalogKnobs, T1);
      expect(result.landing, each.name).toEqual({ kind: "unreadable" });
      expect(result.stored, each.name).toBe(false);
      expect(result.record, `${each.name}: no record on unreadable`).toBe(
        undefined,
      );
      expect(result.reason, each.name).toBe(each.reason);
      expect(
        written,
        `${each.name}: NOTHING IS WRITTEN UNTIL THE WHOLE VALIDATION PASSES`,
      ).toEqual([]);
      expect(map.size, each.name).toBe(0);
    }

    // And the same refusals against a store that already holds a library:
    // the record that was there is byte-identical afterwards.
    const { store, map, written } = fakeStore();
    expect(
      importText(store, serialiseExport(good), catalogKnobs, T1).stored,
    ).toBe(true);
    const before = map.get(LIBRARY_KEY);
    written.length = 0;
    for (const each of cases) {
      importText(store, each.text, catalogKnobs, T1);
    }
    expect(written).toEqual([]);
    expect(map.get(LIBRARY_KEY)).toBe(before);

    // A refused import never opens on a subtly wrong configuration: the
    // classifier is pure and the outcome is the same with no store at all.
    expect(classifyImport("{ not json", catalogKnobs, T1).step).toBe(1);
    expect(importText(undefined, "{ not json", catalogKnobs, T1).stored).toBe(
      false,
    );
  });

  it("3. an older shape lands older, on the base configuration - matched against stamp.spec.ts's 'lands older on a resized knob and never restored on a changed rack'", () => {
    // THE SAME RESIZE AS THE STAMP TEST, BY NAME: orbit, whose first knob
    // loses its last option, under the SAME tuned vector (every knob one past
    // its default, stamp.spec.ts's tunedOf). Every index still fits the
    // resized list, so nothing but a shape can catch it - there the payload's
    // shape character, here the file's rack.
    const each = entry("orbit");
    const knobs = stampKnobs(each);
    expect(knobs.length, "orbit has knobs").toBeGreaterThan(1);
    const resized: CatalogEntry = {
      ...each,
      knobs: each.knobs.map((knob, at) =>
        at === 0
          ? { ...knob, values: knob.values.slice(0, knob.values.length - 1) }
          : knob,
      ),
    };
    const resizedKnobs = stampKnobs(resized);
    const knobsOf: KnobsOf = (id) =>
      id === each.id ? resizedKnobs : catalogKnobs(id);

    const tuned = tunedIndices(each);
    expect(
      tuned[0] < resizedKnobs[0].options.length,
      "the tuned index still fits the resized list - only a shape can catch this",
    ).toBe(true);
    const copy: PlaygroundRecord = {
      ...playgroundCopy("copy:orbit:1", "orbit"),
      knobIndices: tuned,
    };
    const indices: Record<string, number> = {};
    knobs.forEach((knob, at) => {
      indices[knob.id] = tuned[at];
    });

    // The stamp's own verdict on the same situation, so the two cannot drift.
    const payload = encodeFor(each, indices);
    expect(payload).toEqual(expect.any(String));
    expect(
      decodeFor(resized, payload as string),
      "stamp.spec.ts: a resized knob must be older, never restored",
    ).toEqual({ kind: "older" });

    // The import's verdict: older, the knob named, the record at the defaults.
    // The file was written against the catalog as it stands (the full rack)
    // and is read against the resized one.
    const text = serialiseExport(exportFile(copy, T1, catalogKnobs));
    const { store, written } = fakeStore();
    const result = importText(store, text, knobsOf, T1);
    expect(result.landing).toEqual({ kind: "older" });
    expect(result.step).toBe(4);
    expect(result.reason).toBe(
      IMPORT_REASONS.rackChanged("orbit", resizedKnobs[0].label),
    );
    expect(result.reason).toContain(resizedKnobs[0].label);
    expect(result.stored).toBe(true);
    expect(written).toEqual([LIBRARY_KEY]);

    // THE BASE CONFIGURATION, NEVER A SUBTLY WRONG ONE (SHARE-03): every index
    // is the knob's default, and the stamp for that vector is the empty one.
    const landed = readLibrary(store)["copy:orbit:1"];
    expect(landed?.kind).toBe("playground");
    if (landed?.kind === "playground") {
      expect(landed.knobIndices).toEqual(
        resizedKnobs.map((knob) => knob.default),
      );
      const atBase: Record<string, number> = {};
      resizedKnobs.forEach((knob, at) => {
        atBase[knob.id] = landed.knobIndices[at];
      });
      expect(
        encodeFor(resized, atBase),
        "a URL with no fragment IS the base configuration",
      ).toBe(undefined);
    }
    expect(landed?.name, "the name survives").toBe(copy.name);
    expect(landed?.editedAt, "re-dated: its indices were reset").toBe(T1);

    // An added or removed knob is the other shape change: older too, by
    // count, with the entry named - where the stamp says unreadable because
    // its payload LENGTH moved and a wrong length might be corruption. A
    // record has passed isStoredRecord by step 4, so what remains is the rack.
    // The file is written against the rack with a knob REMOVED and read
    // against the catalog's full rack.
    const removed: CatalogEntry = { ...each, knobs: each.knobs.slice(1) };
    const removedKnobs = stampKnobs(removed);
    const fewer: PlaygroundRecord = { ...copy, knobIndices: tuned.slice(1) };
    const short = classifyImport(
      serialiseExport(
        exportFile(fewer, T1, (id) =>
          id === each.id ? removedKnobs : catalogKnobs(id),
        ),
      ),
      catalogKnobs,
      T1,
    );
    expect(short.landing).toEqual({ kind: "older" });
    expect(short.reason).toBe(
      IMPORT_REASONS.knobCount("orbit", tuned.length - 1, knobs.length),
    );
    expect(
      decodeFor(each, encodeFor(removed, indices) as string),
      "stamp.spec.ts: a removed knob moves the payload length - unreadable there",
    ).toEqual({ kind: "unreadable" });

    // And the catalog as it stands lands the untouched file restored, so the
    // resize above is the whole difference.
    const fine = classifyImport(text, catalogKnobs, T1);
    expect(fine.landing.kind).toBe("restored");
  });

  it("4. a surface with an off-surface or overlapping region is refused with the region named; a knob index outside its list is refused with the knob named", () => {
    const check = (regions: readonly Region[]) =>
      classifyImport(
        serialiseExport(
          exportFile(sandboxCopy("copy:surface:1", regions), T1, catalogKnobs),
        ),
        catalogKnobs,
        T1,
      );

    // Off the surface, four ways, each naming the region.
    for (const [name, bad] of [
      ["past the right edge", region("Filter", 7, 0, 3, 2)],
      ["past the bottom edge", region("Filter", 0, 8, 2, 2)],
      ["a negative column", region("Filter", -1, 0, 2, 2)],
      ["no width at all", region("Filter", 0, 0, 0, 2)],
    ] as const) {
      const result = check([region("Pad", 0, 4, 2, 2), bad]);
      expect(result.landing, name).toEqual({ kind: "unreadable" });
      expect(result.step, name).toBe(5);
      expect(result.reason, name).toBe(IMPORT_REASONS.offSurface("Filter"));
      expect(result.record, name).toBe(undefined);
    }

    // Overlapping: both names in the sentence, the later region first.
    const overlap = check([
      region("Filter", 0, 0, 2, 6),
      region("Pad", 1, 2, 4, 4),
    ]);
    expect(overlap.landing).toEqual({ kind: "unreadable" });
    expect(overlap.reason).toBe(IMPORT_REASONS.overlap("Pad", "Filter"));
    expect(overlap.reason).toContain("Pad");
    expect(overlap.reason).toContain("Filter");

    // Edge-adjacent is not overlapping: the two share no cell.
    const adjacent = check([
      region("Filter", 0, 0, 2, 6),
      region("Pad", 2, 0, 4, 4),
    ]);
    expect(adjacent.landing.kind).toBe("restored");

    // Over the cap, the count named.
    const many = Array.from({ length: SURFACE_ELEMENT_CAP + 1 }, (_, i) =>
      region(`Button ${i + 1}`, i % 9, Math.floor(i / 9), 1, 1),
    );
    const capped = check(many);
    expect(capped.landing).toEqual({ kind: "unreadable" });
    expect(capped.reason).toBe(IMPORT_REASONS.tooMany(SURFACE_ELEMENT_CAP + 1));
    expect(check(many.slice(0, SURFACE_ELEMENT_CAP)).landing.kind).toBe(
      "restored",
    );

    // Nothing is written on any refusal.
    const { store, written } = fakeStore();
    importText(
      store,
      serialiseExport(
        exportFile(
          sandboxCopy("copy:surface:1", [
            region("Filter", 0, 0, 2, 6),
            region("Pad", 1, 2, 4, 4),
          ]),
          T1,
          catalogKnobs,
        ),
      ),
      catalogKnobs,
      T1,
    );
    expect(written).toEqual([]);

    // A knob index outside its own option list under a rack that agrees -
    // a file edited by hand, since no export can write it: refused as
    // unreadable, the knob named by label, nothing landed (the codec's own
    // row for an index past the end of its options).
    const arc = entry("quadrant");
    const arcKnobs = stampKnobs(arc);
    const indices = tunedIndices(arc);
    const at = arcKnobs.length - 1;
    indices[at] = arcKnobs[at].options.length + 3;
    const copy: PlaygroundRecord = {
      ...playgroundCopy("copy:quadrant:1", "quadrant"),
      knobIndices: indices,
    };
    const result = classifyImport(
      serialiseExport(exportFile(copy, T1, catalogKnobs)),
      catalogKnobs,
      T1,
    );
    expect(result.landing).toEqual({ kind: "unreadable" });
    expect(result.step).toBe(4);
    expect(result.reason).toBe(
      IMPORT_REASONS.knobRange(
        arcKnobs[at].label,
        indices[at],
        arcKnobs[at].options.length,
      ),
    );
    expect(result.reason).toContain(arcKnobs[at].label);
    expect(result.record, "nothing lands on a hand-edited index").toBe(
      undefined,
    );
    // The stamp's verdict on the same row, so the two cannot drift.
    const asStamp: Record<string, number> = {};
    arcKnobs.forEach((knob, i) => {
      asStamp[knob.id] = indices[i];
    });
    const payload = encodeFor(arc, asStamp) as string;
    // encodeFor clamps a bad index to the default, so the payload has to be
    // forced past the end by hand the way a hand-edited file is.
    const forced = payload.slice(0, 2 + at) + "v" + payload.slice(2 + at + 1);
    expect(
      payload[0] === "x" && arcKnobs[at].options.length <= 31,
      "quadrant emits format x (no colour knob) and its last knob has fewer than 32 options",
    ).toBe(true);
    expect(
      decodeFor(arc, forced),
      "stamp.ts: an index past the end is unreadable",
    ).toEqual({ kind: "unreadable" });

    // The type check is where a fourth outcome word would first show: every
    // landing this module returns is one of the codec's members.
    const words = new Set<string>();
    for (const each of [result, overlap, capped, adjacent]) {
      words.add(each.landing.kind);
    }
    for (const word of words) {
      expect(["none", "restored", "older", "unreadable"]).toContain(word);
    }
    // ExportFile's own type carries the record's kind at the top level.
    const typed: ExportFile = exportFile(copy, T1, catalogKnobs);
    expect(typed.kind).toBe(typed.record.kind);
  });

  it("5. brightness (change 5) travels with a record: a Playground copy and a Sandbox surface round-trip it through the file, an older file without the field lands at 255, the schema's range is catalog/brightness.ts's, and 0 or 256 is unreadable", () => {
    const dim: PlaygroundRecord = {
      ...playgroundCopy("copy:orbit:dim", "orbit"),
      brightness: 128,
    };
    const { store } = fakeStore();
    const text = serialiseExport(exportFile(dim, T1, catalogKnobs));
    expect(text, "the file carries it").toMatch(/"brightness": 128/);
    const back = importText(store, text, catalogKnobs, T1);
    expect(back.landing.kind).toBe("restored");
    expect(back.record).toEqual(dim);
    expect(brightnessOf((back.record as PlaygroundRecord).brightness)).toBe(
      128,
    );

    const lit = sandboxCopy("sandbox:dim", [
      region("Filter", 0, 0, 2, 6),
    ]) as SandboxRecord;
    const dimSurface: StoredRecord = {
      ...lit,
      surface: { ...lit.surface, brightness: 40 },
    };
    const surfaceText = serialiseExport(
      exportFile(dimSurface, T1, catalogKnobs),
    );
    const surfaceBack = importText(store, surfaceText, catalogKnobs, T1);
    expect(surfaceBack.landing.kind).toBe("restored");
    expect(surfaceBack.record).toEqual(dimSurface);
    expect(
      (surfaceBack.record as { surface: { brightness?: number } }).surface
        .brightness,
    ).toBe(40);

    // An older file: the record as every copy was written before the field existed.
    const older = playgroundCopy("copy:orbit:older", "orbit");
    const olderBack = importText(
      store,
      serialiseExport(exportFile(older, T1, catalogKnobs)),
      catalogKnobs,
      T1,
    );
    expect(olderBack.landing.kind).toBe("restored");
    expect(olderBack.record).not.toHaveProperty("brightness");
    expect(
      brightnessOf((olderBack.record as PlaygroundRecord).brightness),
      "absent lands at 255",
    ).toBe(255);

    // The schema's range is the scaler's: 1 and 255 read, 0, 256, 1.5 and a string do not.
    for (const value of [1, 255, 128]) {
      expect(
        isStoredRecord({ ...older, brightness: value }),
        `${value} reads`,
      ).toBe(true);
      expect(
        isStoredRecord({
          ...lit,
          surface: {
            ...lit.surface,
            brightness: value,
          },
        }),
      ).toBe(true);
      expect(isBrightness(value)).toBe(true);
    }
    for (const value of [0, 256, 1.5, "128", -1]) {
      expect(
        isStoredRecord({ ...older, brightness: value }),
        `${String(value)} is refused`,
      ).toBe(false);
      expect(
        isStoredRecord({
          ...lit,
          surface: {
            ...lit.surface,
            brightness: value,
          },
        }),
      ).toBe(false);
      expect(isBrightness(value)).toBe(false);
    }
    const broken = serialiseExport(exportFile(dim, T1, catalogKnobs)).replace(
      /"brightness": 128/,
      '"brightness": 256',
    );
    const brokenBack = importText(store, broken, catalogKnobs, T1);
    expect(
      brokenBack.landing.kind,
      "a file edited past the range is unreadable",
    ).toBe("unreadable");
    expect(brokenBack.stored).toBe(false);
  });
});
