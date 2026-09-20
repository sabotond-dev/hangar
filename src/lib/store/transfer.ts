// Export as a file and import with validation BEFORE anything opens (Bible
// section 11; KEEP-04, KEEP-05). An ExportFile is an envelope around one
// StoredRecord - { schema, kind, exportedAt, app: "hangar", record, rack? } -
// with the version in the body because a file has no key name, the app word
// so a foreign JSON is refused with a sentence, and a playground's rack (knob
// ids and option counts) so a resized knob lands `older`. Membership does not
// travel. The outcomes are the stamp codec's `Landing`, imported, never
// re-declared. The catalog is an argument (`knobsOf`), never an import. Nothing
// touches storage until validation passes: classifyImport is pure, importText writes.
// Decided at 13-13 (D-22 fork D, no collections field); see .planning/phases/13-gui-overhaul/13-13-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

import type { Landing } from "$lib/share/stamp";
import { saveCopy, readLibrary } from "./library";
import type { LocalStore } from "./local";
import {
  RECORD_KINDS,
  SCHEMA_VERSION,
  SURFACE_ELEMENT_CAP,
  SURFACE_SIZE,
  isStoredRecord,
  type PlaygroundRecord,
  type RecordKind,
  type Region,
  type SandboxRecord,
  type StoredRecord,
} from "./schema";

/** The word every HANGAR export carries, and the first thing an import checks. */
export const EXPORT_APP = "hangar" as const;

/**
 * Schema versions older than SCHEMA_VERSION that this build can still read
 * and land on the base configuration (step 2). Empty today: version 1 is the
 * first. The first `.v2` adds `1` here and writes the migration beside it.
 */
const READABLE_OLDER_SCHEMAS: readonly number[] = [];

/** The file's extension: JSON, marked as HANGAR's so a folder of them reads. */
const EXPORT_EXTENSION = ".hangar.json";

/** What the file input accepts. Both forms, because browsers differ on which they honour. */
export const EXPORT_ACCEPT = "application/json,.json";

/** One knob of the rack a playground export was encoded against. */
export type RackKnob = { readonly id: string; readonly options: number };

export type ExportFile = {
  readonly schema: typeof SCHEMA_VERSION;
  readonly kind: RecordKind;
  readonly exportedAt: string;
  readonly app: typeof EXPORT_APP;
  readonly record: StoredRecord;
  /** The entry's rack at export time; playground files only. On the envelope, so the record still round-trips byte for byte. */
  readonly rack?: readonly RackKnob[];
};

/** A knob as this module needs to know it: the caller's stampKnobs(entry), structurally. */
export type KnobShape = {
  readonly id: string;
  readonly label: string;
  readonly options: readonly unknown[];
  readonly default: number;
};

/** The knobs of a catalog entry, or undefined when the catalog no longer carries it. */
export type KnobsOf = (entryId: string) => readonly KnobShape[] | undefined;

/**
 * What an import found. `landing` is the codec's word; `record` is what will
 * be (or was) stored - present on restored and older, absent on unreadable;
 * `step` and `reason` name the first step that did not pass, so the screen
 * explains rather than shrugs.
 */
export type Imported = {
  readonly landing: Landing;
  readonly record?: StoredRecord;
  readonly step?: 1 | 2 | 3 | 4 | 5;
  readonly reason?: string;
};

/** An import that was also written: `stored` is false when the store refused. */
export type ImportResult = Imported & { readonly stored: boolean };

// ---------------------------------------------------------------------------
// Export.

/** The rack as the file writes it: id and option count per knob, in rack order. */
function rackOf(knobs: readonly KnobShape[]): readonly RackKnob[] {
  return knobs.map((knob) => ({ id: knob.id, options: knob.options.length }));
}

/**
 * The envelope for one record at one moment. Pure. A playground record needs
 * its entry's knobs for the rack; a sandbox record carries none, and a
 * playground record whose entry the catalog no longer has is exported
 * without a rack and will be refused at step 3 on the way back in - there
 * is nothing it could land on.
 */
export function exportFile(
  record: StoredRecord,
  at: string,
  knobsOf?: KnobsOf,
): ExportFile {
  const knobs =
    record.kind === "playground" ? knobsOf?.(record.source) : undefined;
  const file: ExportFile = {
    schema: SCHEMA_VERSION,
    kind: record.kind,
    exportedAt: at,
    app: EXPORT_APP,
    record: { ...record, schema: SCHEMA_VERSION },
  };
  return knobs === undefined ? file : { ...file, rack: rackOf(knobs) };
}

/** Two-space JSON with a trailing newline: a file somebody may open in an editor. */
export function serialiseExport(file: ExportFile): string {
  return `${JSON.stringify(file, null, 2)}\n`;
}

/**
 * `Arc copy` -> `arc-copy.hangar.json`. Letters and digits kept, everything
 * else folded to one hyphen, so the name is safe on every filesystem; an
 * empty result falls back to the record's kind.
 */
export function exportFileName(record: StoredRecord): string {
  const slug = record.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug.length > 0 ? slug : record.kind}${EXPORT_EXTENSION}`;
}

/** The two browser doors a download needs, injectable so a test can watch the revoke. */
export type DownloadDeps = {
  readonly document: Pick<Document, "createElement" | "body">;
  readonly url: Pick<typeof URL, "createObjectURL" | "revokeObjectURL">;
  /** Runs the revoke after the click has been dispatched. */
  readonly defer: (run: () => void) => void;
};

/**
 * Save the file through the browser's own download path: a Blob, an object
 * URL, an anchor with `download`, one synthetic click, and the URL revoked
 * afterwards. Returns the file name it asked for. No permission prompt, no
 * gesture beyond the click that called this.
 */
export function downloadExport(file: ExportFile, deps?: DownloadDeps): string {
  return downloadText(exportFileName(file.record), serialiseExport(file), deps);
}

/**
 * The same door for any JSON text under any name (change 13C: the Grid Editor profile is a
 * second file shape through the one download). Returns the file name it asked for.
 */
export function downloadText(
  name: string,
  text: string,
  deps: DownloadDeps = {
    document,
    url: URL,
    defer: (run) => setTimeout(run, 0),
  },
): string {
  const blob = new Blob([text], { type: "application/json" });
  const href = deps.url.createObjectURL(blob);
  const anchor = deps.document.createElement("a");
  anchor.href = href;
  anchor.download = name;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  deps.document.body.append(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    deps.defer(() => deps.url.revokeObjectURL(href));
  }
  return name;
}

// ---------------------------------------------------------------------------
// Import: the six steps.

const OLDER: Landing = { kind: "older" };
const UNREADABLE: Landing = { kind: "unreadable" };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The refusal sentences, HANGAR's own (no Bible line names an import), in
 * D-05's register and ledgered in 13-COPY-NEW.md under "From 13-13".
 */
export const IMPORT_REASONS = {
  notJson: "This file isn't JSON, so it can't be a HANGAR export.",
  notHangar: "This file wasn't exported by HANGAR.",
  schemaUnknown: (schema: unknown) =>
    `This file was made by a newer HANGAR (format ${String(schema)}). This version reads format ${SCHEMA_VERSION}.`,
  schemaOlder: (schema: number) =>
    `This file was made by an earlier HANGAR (format ${schema}). It opens on the base configuration.`,
  kindUnknown: "This file doesn't hold a configuration or a surface.",
  recordMalformed: "The configuration inside this file is incomplete.",
  rackChanged: (name: string, knob: string) =>
    `The ${knob} knob of ${name} has changed since this file was made. It opens on the base configuration.`,
  entryGone: (source: string) =>
    `The Playground configuration this file was made from, ${source}, isn't in the Playground any more.`,
  knobCount: (name: string, filed: number, now: number) =>
    `This file sets ${filed} ${filed === 1 ? "knob" : "knobs"} and ${name} now has ${now}. It opens on the base configuration.`,
  knobRange: (knob: string, index: number, count: number) =>
    `${knob} has ${count} positions and this file asks for position ${index + 1}.`,
  tooMany: (count: number) =>
    `This surface has ${count} elements, and a page holds at most ${SURFACE_ELEMENT_CAP}.`,
  offSurface: (region: string) =>
    `${region} doesn’t fit on the ${SURFACE_SIZE} × ${SURFACE_SIZE} surface.`,
  overlap: (a: string, b: string) => `${a} overlaps ${b}.`,
} as const;

function refuse(step: 1 | 2 | 3 | 4 | 5, reason: string): Imported {
  return { landing: UNREADABLE, step, reason };
}

const isRack = (value: unknown): value is readonly RackKnob[] =>
  Array.isArray(value) &&
  value.every(
    (knob) =>
      isObject(knob) &&
      typeof knob.id === "string" &&
      typeof knob.options === "number" &&
      Number.isInteger(knob.options) &&
      knob.options >= 1,
  );

/** A region's cells, or undefined when any cell is off the surface. */
function cellsOf(region: Region): number[] | undefined {
  const { col, row, w, h } = region;
  if (w < 1 || h < 1 || col < 0 || row < 0) return undefined;
  if (col + w > SURFACE_SIZE || row + h > SURFACE_SIZE) return undefined;
  const cells: number[] = [];
  for (let r = row; r < row + h; r += 1) {
    for (let c = col; c < col + w; c += 1) cells.push(r * SURFACE_SIZE + c);
  }
  return cells;
}

/** Step 5: the cap, the bounds, then the one-index-per-cell map. */
function checkSurface(record: SandboxRecord): Imported | undefined {
  const regions = record.surface.regions;
  if (regions.length > SURFACE_ELEMENT_CAP) {
    return refuse(5, IMPORT_REASONS.tooMany(regions.length));
  }
  const owner = new Map<number, string>();
  for (const region of regions) {
    const cells = cellsOf(region);
    if (cells === undefined) {
      return refuse(5, IMPORT_REASONS.offSurface(region.name));
    }
    for (const cell of cells) {
      const other = owner.get(cell);
      if (other !== undefined) {
        return refuse(5, IMPORT_REASONS.overlap(region.name, other));
      }
      owner.set(cell, region.name);
    }
  }
  return undefined;
}

/** Step 4: the entry, the rack, then every index against its own list. */
function checkPlayground(
  record: PlaygroundRecord,
  rack: readonly RackKnob[],
  knobsOf: KnobsOf,
  at: string,
): Imported {
  const knobs = knobsOf(record.source);
  if (knobs === undefined) {
    return refuse(4, IMPORT_REASONS.entryGone(record.source));
  }
  const base: StoredRecord = {
    ...record,
    knobIndices: knobs.map((knob) => knob.default),
    editedAt: at,
  };
  const older = (reason: string): Imported => ({
    landing: OLDER,
    record: base,
    step: 4,
    reason,
  });
  // The rack: the same count, and knob by knob the same id and list length.
  // A record with the wrong number of indices for its own rack is the
  // envelope disagreeing with itself and is refused as malformed.
  if (record.knobIndices.length !== rack.length) {
    return refuse(3, IMPORT_REASONS.recordMalformed);
  }
  if (rack.length !== knobs.length) {
    return older(
      IMPORT_REASONS.knobCount(record.source, rack.length, knobs.length),
    );
  }
  for (let i = 0; i < knobs.length; i += 1) {
    if (
      rack[i].id !== knobs[i].id ||
      rack[i].options !== knobs[i].options.length
    ) {
      return older(IMPORT_REASONS.rackChanged(record.source, knobs[i].label));
    }
  }
  // The rack agrees, so every index fitted the list it was written against;
  // one past the end now is a file edited by hand, and the codec's word for
  // that row is unreadable.
  const indices: Record<string, number> = {};
  for (let i = 0; i < knobs.length; i += 1) {
    const index = record.knobIndices[i];
    const knob = knobs[i];
    if (index < 0 || index >= knob.options.length) {
      return refuse(
        4,
        IMPORT_REASONS.knobRange(knob.label, index, knob.options.length),
      );
    }
    indices[knob.id] = index;
  }
  return { landing: { kind: "restored", indices }, record };
}

/**
 * The six steps over the file's text, refusing at the first failure:
 *   1. it parses, app is "hangar", schema is a version this build reads   -> else unreadable
 *   2. a readable schema older than this build's                          -> older, landed on the base
 *   3. kind is playground or sandbox and record is a StoredRecord of it   -> else unreadable
 *   4. playground: the entry exists (else unreadable); its rack is the file's
 *      (else older, the knob named); every index inside its list (else unreadable)
 *   5. sandbox: at most the cap, every region on the 9 x 9, no shared cell -> else unreadable, the region named
 *   6. otherwise                                                          -> restored
 * The classification is the codec's row for row; the one difference is that an added or removed knob is
 * `older` here (the rack is a named list, so a changed count is legibly the rack having moved).
 * Pure: reads nothing, writes nothing, never throws. `at` is the moment an
 * `older` record is re-dated to, since its indices were reset on the way in.
 */
export function classifyImport(
  text: string,
  knobsOf: KnobsOf,
  at: string,
): Imported {
  // 1. JSON, HANGAR's, at a version this build reads.
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return refuse(1, IMPORT_REASONS.notJson);
  }
  if (!isObject(parsed) || parsed.app !== EXPORT_APP) {
    return refuse(1, IMPORT_REASONS.notHangar);
  }
  const schema = parsed.schema;
  const readableOlder =
    typeof schema === "number" && READABLE_OLDER_SCHEMAS.includes(schema);
  if (schema !== SCHEMA_VERSION && !readableOlder) {
    return refuse(1, IMPORT_REASONS.schemaUnknown(schema));
  }

  // 2. An older readable schema lands on the base configuration. The door
  // for the first .v2; today no schema qualifies and this is never reached.
  if (readableOlder) {
    return {
      landing: OLDER,
      step: 2,
      reason: IMPORT_REASONS.schemaOlder(schema as number),
    };
  }

  // 3. The kind, and a record of that kind.
  if (!RECORD_KINDS.includes(parsed.kind as RecordKind)) {
    return refuse(3, IMPORT_REASONS.kindUnknown);
  }
  const record = parsed.record;
  if (!isStoredRecord(record) || record.kind !== parsed.kind) {
    return refuse(3, IMPORT_REASONS.recordMalformed);
  }

  // 4 / 5. The kind's own check. A playground file carries its rack.
  if (record.kind === "playground") {
    const rack = parsed.rack;
    if (!isRack(rack)) return refuse(3, IMPORT_REASONS.recordMalformed);
    return checkPlayground(record, rack, knobsOf, at);
  }
  const refused = checkSurface(record);
  if (refused !== undefined) return refused;

  // 6. As written.
  return { landing: { kind: "restored", indices: {} }, record };
}

/**
 * Classify, then - and only then - write. A `restored` or `older` record goes
 * into the library as a saved copy under its own id; an id the library
 * already holds gets the moment appended, because saveCopy never overwrites
 * and the visitor asked for an import, not a no-op. `unreadable` writes
 * nothing and the store is never asked for anything.
 */
export function importText(
  store: LocalStore | undefined,
  text: string,
  knobsOf: KnobsOf,
  at: string,
): ImportResult {
  const found = classifyImport(text, knobsOf, at);
  if (found.record === undefined) return { ...found, stored: false };
  const taken = found.record.id in readLibrary(store);
  const moment = Number.isNaN(Date.parse(at)) ? Date.now() : Date.parse(at);
  const record: StoredRecord = taken
    ? { ...found.record, id: `${found.record.id}:${moment.toString(36)}` }
    : found.record;
  const outcome = saveCopy(store, record);
  return { ...found, record, stored: outcome === "written" };
}
