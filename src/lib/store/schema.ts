// The local store's vocabulary: the key names, the version, and the record
// shapes. Data only - nothing here touches a browser; the module imports nothing.
// The version is in the KEY NAME (every key ends in `.v1`, spelled once by
// storeKey, so a `.v2` sits beside its predecessor and never shadows it - the
// snapshot.ts rule) AND in the BODY (`schema: 1` on every record, because an
// exported file has no key name; KEEP-05). Every key holds an envelope except
// hangar.motion.v1, 13-04's bare `animated` / `still` word. Three stores, three
// words (Bible section 9): DRAFT (drafts.ts), SAVED COPY (library.ts), DEVICE
// STATE (the install store, not here). Region and Surface live here, extended by
// sandbox/model.ts, because an import validates a surface before the Sandbox loads.
// Decided at 13-06 and 13-13 (D-22, collections); see .planning/phases/13-gui-overhaul/13-13-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** The one version every body carries and every key name ends in. */
export const SCHEMA_VERSION = 1 as const;

/** The seven stores this module names. */
export type StoreName =
  | "drafts"
  | "library"
  | "favorites"
  | "recent"
  | "intro"
  | "motion"
  | "collections"
  | "sandbox-defaults";

/**
 * The one place the key suffix is spelled. `storeKey("drafts", 1)` is
 * "hangar.drafts.v1"; a later reader asks for `storeKey("drafts", 2)` and by
 * construction never opens the v1 record (local.spec.ts test 5).
 */
export function storeKey(name: StoreName, version: number): string {
  return `hangar.${name}.v${version}`;
}

export const DRAFTS_KEY = storeKey("drafts", SCHEMA_VERSION);
export const LIBRARY_KEY = storeKey("library", SCHEMA_VERSION);
export const FAVORITES_KEY = storeKey("favorites", SCHEMA_VERSION);
export const RECENT_KEY = storeKey("recent", SCHEMA_VERSION);
export const INTRO_KEY = storeKey("intro", SCHEMA_VERSION);

/**
 * 13-04's key, adopted by name and unchanged: the value under it is the bare
 * word `animated` or `still`, not JSON - e2e/browse.e2e.ts writes it that way.
 */
export const MOTION_KEY = storeKey("motion", SCHEMA_VERSION);

/** Spent by 13-13: collections.ts owns it (D-13, D-22). */
export const COLLECTIONS_KEY = storeKey("collections", SCHEMA_VERSION);

/** The Sandbox's remembered defaults per kind (change 13B): sandbox-defaults.ts owns it. */
export const SANDBOX_DEFAULTS_KEY = storeKey(
  "sandbox-defaults",
  SCHEMA_VERSION,
);

/** The ZONA's matrix is nine by nine; a region's cells are 0..8 on both axes. */
export const SURFACE_SIZE = 9;

/** The most elements one surface holds (13-CONTEXT D-14 Q4, "room for four more" beats a wall). */
export const SURFACE_ELEMENT_CAP = 16;

/** Every key this module owns, for a test that wants to see all of them. */
export const OWNED_KEYS: readonly string[] = [
  DRAFTS_KEY,
  LIBRARY_KEY,
  FAVORITES_KEY,
  RECENT_KEY,
  INTRO_KEY,
  MOTION_KEY,
  COLLECTIONS_KEY,
  SANDBOX_DEFAULTS_KEY,
];

// ---------------------------------------------------------------------------
// The record shapes.

/** Which half of the product a record belongs to. */
export type RecordKind = "playground" | "sandbox";

/** The runtime list of the two kinds, because a union does not exist at runtime. */
export const RECORD_KINDS: readonly RecordKind[] = ["playground", "sandbox"];

/**
 * The five element kinds the Sandbox places (13-RESEARCH 3.1, D-03, D-08; `blank` since change
 * 10A, 2026-09-18 - a coloured region that sends nothing). 13-14 owns the region model and may
 * widen this; the shape lives here because a Surface is what a sandbox record carries. Widening
 * is additive: a record written with four kinds reads exactly as it did.
 */
export type ElementKind = "fader" | "button" | "knob" | "xy" | "blank";

export const ELEMENT_KINDS: readonly ElementKind[] = [
  "fader",
  "button",
  "knob",
  "xy",
  "blank",
];

/**
 * A fader's axis (Bible section 8, the inspector's Geometry row). Absent
 * means vertical - the PDF's own Filter fader is a 2 x 6 upright - so every
 * record written before 13-14 added the field still reads as it was drawn.
 * Meaningful on a fader only; the model ignores it on the other kinds.
 */
export type Orientation = "vertical" | "horizontal";

export const ORIENTATIONS: readonly Orientation[] = ["vertical", "horizontal"];

/**
 * A brightness field on a record: an integer 1..255, or absent for full - the reading every record
 * written before change 5 (2026-09-17) gets. The range is catalog/brightness.ts's; restated here
 * because this module imports nothing; transfer.spec.ts test 5 holds the two equal.
 */
const isBrightnessField = (value: unknown): boolean =>
  value === undefined || (isInt(value) && value >= 1 && value <= 255);

/** A continuous kind's mode (change 10B): a fader or an XY pad is absolute or relative; a knob is absolute or one of three relative encodings. */
export type RegionMode =
  | "absolute"
  | "relative"
  | "relative-twos"
  | "relative-offset"
  | "relative-sign";

export const REGION_MODES: readonly RegionMode[] = [
  "absolute",
  "relative",
  "relative-twos",
  "relative-offset",
  "relative-sign",
];

/** A relative fader's or XY pad's speed: the region's full travel is 64 steps at half, 127 at full. */
export type Speed = "half" | "full";

export const SPEEDS: readonly Speed[] = ["half", "full"];

/** A button's output: a controller, or a note whose number is the `cc` field. */
export type ButtonOutput = "cc" | "note";

export const BUTTON_OUTPUTS: readonly ButtonOutput[] = ["cc", "note"];

/** A radio group is 1..8; 0 (or absent) is no group. */
export const GROUP_MAX = 8;

/** An XY pad's fingers (change 11): 1..5; absent is 1. */
export const TOUCHES_MAX = 5;

/**
 * One placed element. Cells are ZERO-based, 0..8, and the UI shows them
 * one-based through 13-14's named door. `channel` is 1..16 as the user sees
 * it; the wire's 0..15 is the compiler's business. `colour` is RGB444, the
 * picker's own resolution. `cc2` exists for the XY pad's second axis;
 * `latch` (the interface says Toggle since change 10B) for a button only;
 * `orientation` for a fader only (13-14). A blank carries `cc` 0 and
 * `channel` 1 as inert fields, so every region is one shape. The change 10B
 * fields are every one optional and read as their default when absent
 * (`min` 0, `max` 127, `mode` absolute, `speed` half, `spring` off,
 * `springValue` 64, `output` cc, `group` none), so a draft written before
 * them reads exactly as it did; sandbox/model.ts holds the readers. `touches`
 * (change 11) is an XY pad's finger count, 1..5, absent 1: finger n sends on
 * `cc + 2(n-1)` and `cc2 + 2(n-1)`, so a region whose last finger would pass
 * 127 is not a region. `locked` (change 13A) is EDITOR state - a locked
 * element is not moved, resized or deleted - absent is unlocked, and it is
 * never a row column: the emitter reads named fields and never this one.
 */
export type Region = {
  readonly id: string;
  readonly name: string;
  readonly kind: ElementKind;
  readonly col: number;
  readonly row: number;
  readonly w: number;
  readonly h: number;
  readonly cc: number;
  readonly cc2?: number;
  readonly channel: number;
  readonly colour: readonly [number, number, number];
  readonly latch?: boolean;
  readonly orientation?: Orientation;
  readonly min?: number;
  readonly max?: number;
  readonly mode?: RegionMode;
  readonly speed?: Speed;
  readonly spring?: boolean;
  readonly springValue?: number;
  readonly output?: ButtonOutput;
  readonly group?: number;
  readonly touches?: number;
  readonly locked?: boolean;
};

/**
 * A Sandbox surface: a region list and, since change 5, the whole surface's brightness (1..255,
 * absent is 255 - every colour the emitter writes is scaled by it). No thumbnail, ever. The
 * version is on the record that carries it, not here: a Surface never travels alone.
 */
export type Surface = {
  readonly id: string;
  readonly name: string;
  readonly regions: readonly Region[];
  readonly brightness?: number;
};

/**
 * The fields every record shares. `createdAt` is set once and never moves;
 * `editedAt` moves on every write (drafts.ts and library.ts both enforce it,
 * local.spec.ts test 7 holds it). Both are ISO-8601 strings, the format
 * snapshot.ts already stores as `takenAt`.
 */
type RecordBase = {
  readonly schema: typeof SCHEMA_VERSION;
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly editedAt: string;
};

/**
 * A Playground record: an entry and one knob index per knob. `source` is the
 * catalog entry id. The indices are what the share stamp encodes (D-13:
 * integer knob indices, never values), so a record and a stamp describe the
 * same thing and 13-13's import can validate one against the other.
 */
export type PlaygroundRecord = RecordBase & {
  readonly kind: "playground";
  readonly source: string;
  readonly knobIndices: readonly number[];
  /** The brightness the copy was saved at (change 5); absent is 255. Not in the stamp: a shared link lands at 255. */
  readonly brightness?: number;
};

/**
 * A Sandbox record: a surface. `source` is the surface's own id, so "one
 * draft per source" reads the same for both kinds.
 */
export type SandboxRecord = RecordBase & {
  readonly kind: "sandbox";
  readonly source: string;
  readonly surface: Surface;
};

export type StoredRecord = PlaygroundRecord | SandboxRecord;

/** Editable working state, recovered locally. The word is DRAFT. */
export type Draft = StoredRecord;

/** A named snapshot that can be reopened or shared. The word is SAVED COPY. */
export type SavedCopy = StoredRecord;

/** One opened thing in the recently-used list. */
export type RecentItem = { readonly id: string; readonly at: string };

/**
 * The settings a new element of a kind starts from (change 13B, suggestion 8): the fields the
 * user last gave that kind, every one optional - a kind with none starts from the model's
 * defaults. `note` is a button's note number while its output is a note (the region's `cc`
 * then); the controller itself, the colour, the orientation and the geometry are never here.
 */
export type KindDefaults = {
  readonly channel?: number;
  readonly min?: number;
  readonly max?: number;
  readonly mode?: RegionMode;
  readonly speed?: Speed;
  readonly spring?: boolean;
  readonly springValue?: number;
  readonly latch?: boolean;
  readonly output?: ButtonOutput;
  readonly group?: number;
  readonly touches?: number;
  readonly note?: number;
};

/** The envelope under hangar.sandbox-defaults.v1: one record per kind that has any. */
export type SandboxDefaults = {
  readonly schema: typeof SCHEMA_VERSION;
  readonly kinds: Partial<Record<ElementKind, KindDefaults>>;
};

/** The empty envelope, one value: every kind starts from the model's own. The editor and the store read the same object. */
export const NO_DEFAULTS: SandboxDefaults = {
  schema: SCHEMA_VERSION,
  kinds: {},
};

/** The returning-visitor flag (13-CONTEXT D-14 Q2). */
export type IntroFlag = {
  readonly schema: typeof SCHEMA_VERSION;
  readonly seen: true;
  readonly at: string;
};

// ---------------------------------------------------------------------------
// The validators. A record is what it is only if every field is; anything
// else is absent, never partial (the snapshot.ts rule).

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);

/** True for an envelope whose `schema` is THIS version. Any other version reads as absent. */
export function isEnvelope(value: unknown): value is { schema: 1 } {
  return isObject(value) && value.schema === SCHEMA_VERSION;
}

/** A region only if every field is; exported for the clipboard's reader (change 13A). */
export function isRegion(value: unknown): value is Region {
  if (!isObject(value)) return false;
  if (!isString(value.id) || !isString(value.name)) return false;
  if (!ELEMENT_KINDS.includes(value.kind as ElementKind)) return false;
  for (const field of ["col", "row", "w", "h", "cc", "channel"]) {
    if (!isInt(value[field])) return false;
  }
  if (value.cc2 !== undefined && !isInt(value.cc2)) return false;
  if (value.latch !== undefined && typeof value.latch !== "boolean") {
    return false;
  }
  if (
    value.orientation !== undefined &&
    !ORIENTATIONS.includes(value.orientation as Orientation)
  ) {
    return false;
  }
  // The change 10B fields: each absent or its own shape (a number 0..127, a
  // word from its list, a boolean, a group 0..8) - a draft carrying none of
  // them is the draft it was.
  for (const field of ["min", "max", "springValue"]) {
    const v = value[field];
    if (v !== undefined && !(isInt(v) && v >= 0 && v <= 127)) return false;
  }
  if (
    value.mode !== undefined &&
    !REGION_MODES.includes(value.mode as RegionMode)
  ) {
    return false;
  }
  if (value.speed !== undefined && !SPEEDS.includes(value.speed as Speed)) {
    return false;
  }
  if (value.spring !== undefined && typeof value.spring !== "boolean") {
    return false;
  }
  if (
    value.output !== undefined &&
    !BUTTON_OUTPUTS.includes(value.output as ButtonOutput)
  ) {
    return false;
  }
  if (
    value.group !== undefined &&
    !(isInt(value.group) && value.group >= 0 && value.group <= GROUP_MAX)
  ) {
    return false;
  }
  // Change 11: the touch count 1..5, and its last finger's pair inside 127.
  if (value.touches !== undefined) {
    const touches = value.touches;
    if (!(isInt(touches) && touches >= 1 && touches <= TOUCHES_MAX)) {
      return false;
    }
    if (value.kind === "xy") {
      const shift = 2 * (touches - 1);
      const cc2 = isInt(value.cc2) ? value.cc2 : 0;
      if ((value.cc as number) + shift > 127 || cc2 + shift > 127) return false;
    }
  }
  if (value.locked !== undefined && typeof value.locked !== "boolean") {
    return false;
  }
  const colour = value.colour;
  if (!Array.isArray(colour) || colour.length !== 3) return false;
  return colour.every(isInt);
}

function isSurface(value: unknown): value is Surface {
  if (!isObject(value)) return false;
  if (!isString(value.id) || !isString(value.name)) return false;
  if (!isBrightnessField(value.brightness)) return false;
  return Array.isArray(value.regions) && value.regions.every(isRegion);
}

function hasBase(value: Record<string, unknown>): boolean {
  if (value.schema !== SCHEMA_VERSION) return false;
  return (
    isString(value.id) &&
    isString(value.name) &&
    isString(value.createdAt) &&
    isString(value.editedAt)
  );
}

/** A record only if it is one: the base, the kind, and the kind's own field. */
export function isStoredRecord(value: unknown): value is StoredRecord {
  if (!isObject(value) || !hasBase(value)) return false;
  if (!isString(value.source)) return false;
  if (value.kind === "playground") {
    if (!isBrightnessField(value.brightness)) return false;
    return Array.isArray(value.knobIndices) && value.knobIndices.every(isInt);
  }
  if (value.kind === "sandbox") return isSurface(value.surface);
  return false;
}

export function isRecentItem(value: unknown): value is RecentItem {
  return isObject(value) && isString(value.id) && isString(value.at);
}

export function isIntroFlag(value: unknown): value is IntroFlag {
  if (!isObject(value) || value.schema !== SCHEMA_VERSION) return false;
  return value.seen === true && isString(value.at);
}

/** A kind's defaults only if every field present is its own shape (the region's rules, field by field). */
export function isKindDefaults(value: unknown): value is KindDefaults {
  if (!isObject(value)) return false;
  const inRange = (v: unknown, lo: number, hi: number): boolean =>
    v === undefined || (isInt(v) && v >= lo && v <= hi);
  const oneOf = (v: unknown, words: readonly string[]): boolean =>
    v === undefined || words.includes(v as string);
  const bool = (v: unknown): boolean =>
    v === undefined || typeof v === "boolean";
  return (
    inRange(value.channel, 1, 16) &&
    inRange(value.min, 0, 127) &&
    inRange(value.max, 0, 127) &&
    inRange(value.springValue, 0, 127) &&
    inRange(value.note, 0, 127) &&
    inRange(value.group, 0, GROUP_MAX) &&
    inRange(value.touches, 1, TOUCHES_MAX) &&
    oneOf(value.mode, REGION_MODES) &&
    oneOf(value.speed, SPEEDS) &&
    oneOf(value.output, BUTTON_OUTPUTS) &&
    bool(value.spring) &&
    bool(value.latch)
  );
}

/** The defaults envelope only if it is one: this version, and every kind named a known kind with its own valid record. */
export function isSandboxDefaults(value: unknown): value is SandboxDefaults {
  if (!isObject(value) || value.schema !== SCHEMA_VERSION) return false;
  const kinds = value.kinds;
  if (!isObject(kinds)) return false;
  return Object.entries(kinds).every(
    ([kind, record]) =>
      ELEMENT_KINDS.includes(kind as ElementKind) && isKindDefaults(record),
  );
}
