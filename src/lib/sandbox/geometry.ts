// The Sandbox's six geometry rules, and the one data structure that enforces
// the two that matter most.
//
// ---------------------------------------------------------------------------
// 1. THE CELL MAP IS THE RULE, NOT A CHECK OF THE RULE
// ---------------------------------------------------------------------------
//
// `buildCellMap` writes each region's cells into an 81-entry array where every
// cell holds ONE region index (1-based, 0 for none). A cell written twice is a
// conflict, reported with both names, and the map is NOT returned - not
// half-built, not with the first writer winning. So an overlapping surface has
// no cell map, and the emitter (emit.ts) takes the cell map as its input, so an
// overlapping surface cannot be emitted either: the rule is unrepresentable
// rather than merely discouraged, which is what 13-RESEARCH 3.1 chose and the
// Bible's section 8 ("default to preventing overlaps") permits. Layered
// hit-testing (section 8's conditional) would need a cell to hold a LIST, and
// the runtime cost of that list on the device is the reason it is not done.
//
// THE SAME MAP IS BOTH THE VALIDATOR AND THE EMITTER'S `M`. geometry.ts builds
// it; emit.ts renders it as `M={[0]=...}`; emit.spec.ts test 3 asserts the
// rendered numbers equal this array cell for cell. Two structures would drift.
//
// ---------------------------------------------------------------------------
// 2. THE SIX RULES (13-14-PLAN.md, the interfaces block)
// ---------------------------------------------------------------------------
//
//   1. On the surface: col + w <= 9, row + h <= 9, col, row >= 0, w, h >= 1.
//      Refused with the offending FIELD named (`validate`).
//   2. No overlap: the cell map (above). Reported with BOTH names.
//   3. A minimum size per kind: taken as a parameter (model.ts section 4).
//   4. Duplicate to a free area: `freeWindow` scans the map in reading order
//      for a w x h window of zeros; `duplicate` places the copy there, and if
//      there is none it returns the surface UNCHANGED with `no-space` so the
//      caller can offer resize. "Never silently delete an existing element"
//      is section 8's own sentence; geometry.spec.ts test 3 asserts the
//      original list is byte-identical after a failed duplicate.
//   5. The previous valid value survives an invalid edit: `applyEdit` returns
//      the surface it was given, untouched, beside the problem, so a component
//      keeps showing the last valid value with the message inline until the
//      edit is corrected (section 8).
//   6. Edge adjacency is a WARNING, never an error: two regions sharing a
//      boundary with no gap between them. Probe A Q2 measured the cell
//      boundary as ONE raw unit wide (a still finger at x=71/72 flips cells),
//      and Phase 12's hysteresis cannot help on a first sample because there
//      is no prior cell - a press exactly on the seam is a coin flip. A
//      contact keeps the region it landed in for the whole gesture (13-15's
//      runtime), so the coin is flipped once, at onset. The mitigation is
//      therefore in the editor: name both regions at the region, one step
//      earlier than section 8's "explain the conflict at the affected region".
//      `validate` never reads the warnings; test 4 asserts a warned surface
//      still validates.
//
// ---------------------------------------------------------------------------
// 3. THE STRINGS
// ---------------------------------------------------------------------------
//
// The overlap line is the Bible's section 16 row, verbatim, and is not
// ledgered: "This region overlaps Filter. Choose another area or resize it."
// The off-surface message, the adjacency warning and the cap message are
// HANGAR's, written in D-05's register and ledgered in 13-COPY-NEW.md for
// 13-18's batch. transfer.ts carries its own import-side sentences for the
// same three facts (13-13); 13-13's SUMMARY asks that the two become one
// sentence each at 13-18, and this file does not pre-empt that.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  DEFAULT_MINIMUM_SIZES,
  LAST_CELL,
  SURFACE_CELLS,
  SURFACE_ELEMENT_CAP,
  SURFACE_SIZE,
  cellIndex,
  cellsOf,
  cloneRegion,
  minimumSizeOf,
  toDisplay,
  type MinimumSizes,
  type Region,
  type Surface,
} from "./model";

// ---------------------------------------------------------------------------
// The strings (section 3).

/** The Bible's section 16 line, verbatim, with the other region's name in Filter's place. */
export const overlapLine = (other: string): string =>
  `This region overlaps ${other}. Choose another area or resize it.`;

/** HANGAR's own three, ledgered in 13-COPY-NEW.md. */
export const GEOMETRY_COPY = {
  /** Rule 1, with the field that broke it named in the interface's own words. */
  offSurface: (field: GeometryField): string =>
    `This region doesn’t fit on the surface. ${FIELD_WORDS[field]} keeps it inside the 9 × 9.`,
  /** Rule 6, naming both. */
  adjacency: (a: string, b: string): string =>
    `${a} and ${b} touch with no gap between them. A press on the shared edge could land on either.`,
  /** The cap, with the count. */
  cap: (cap: number): string =>
    `This surface holds ${cap} elements, the most a page can carry. Remove one to add another.`,
  /**
   * Rule 3's placeholder. PROVISIONAL: 13-15 derives the Knob's minimum from
   * the dead-zone arithmetic and ledgers the refusal message that names it.
   */
  tooSmall: (kind: string, w: number, h: number): string =>
    `A ${kind} needs at least ${w} × ${h} cells.`,
} as const;

/** The field an off-surface refusal names. */
export type GeometryField = "col" | "row" | "w" | "h";

const FIELD_WORDS: Record<GeometryField, string> = {
  col: "A smaller column",
  row: "A smaller row",
  w: "A smaller width",
  h: "A smaller height",
};

// ---------------------------------------------------------------------------
// Rule 2: the cell map (section 1).

/** 81 entries, cell -> 1-based region index, 0 for none. */
export type CellMap = readonly number[];

export type CellMapResult =
  | { readonly ok: true; readonly map: CellMap }
  | {
      readonly ok: false;
      readonly kind: "overlap";
      /** Both names, first writer first. */
      readonly a: string;
      readonly b: string;
      readonly cell: number;
    }
  | {
      readonly ok: false;
      readonly kind: "off-surface";
      readonly region: string;
      readonly field: GeometryField;
    };

/**
 * The map, or the first conflict. Never a half-built map: the array is local
 * until every cell has been written exactly once.
 */
export function buildCellMap(regions: readonly Region[]): CellMapResult {
  const map: number[] = new Array<number>(SURFACE_CELLS).fill(0);
  for (let index = 0; index < regions.length; index += 1) {
    const region = regions[index];
    const field = offSurfaceField(region);
    if (field !== undefined) {
      return { ok: false, kind: "off-surface", region: region.name, field };
    }
    for (const cell of cellsOf(region)) {
      const holder = map[cell];
      if (holder !== 0) {
        return {
          ok: false,
          kind: "overlap",
          a: regions[holder - 1].name,
          b: region.name,
          cell,
        };
      }
      map[cell] = index + 1;
    }
  }
  return { ok: true, map };
}

// ---------------------------------------------------------------------------
// Rule 1: on the surface, with the field named.

/** The first field that puts the region off the surface, or undefined when it is on it. */
export function offSurfaceField(region: Region): GeometryField | undefined {
  const { col, row, w, h } = region;
  if (!Number.isInteger(w) || w < 1) return "w";
  if (!Number.isInteger(h) || h < 1) return "h";
  if (!Number.isInteger(col) || col < 0) return "col";
  if (!Number.isInteger(row) || row < 0) return "row";
  // A region that starts on the surface and runs off it: the size is what a
  // visitor most likely typed; but if the origin alone is past the edge, it
  // is the origin. `col + w > 9` with `col <= 8` names the width.
  if (col > LAST_CELL) return "col";
  if (row > LAST_CELL) return "row";
  if (col + w > SURFACE_SIZE) return "w";
  if (row + h > SURFACE_SIZE) return "h";
  return undefined;
}

// ---------------------------------------------------------------------------
// Rules 1, 2, 3 and the cap: validate one region against a surface.

export type Problem = {
  readonly rule: "off-surface" | "overlap" | "too-small" | "cap";
  /** The field a component should mark, where one applies. */
  readonly field?: GeometryField | "kind" | "count";
  readonly message: string;
};

export type Validation =
  | { readonly ok: true }
  | { readonly ok: false; readonly problem: Problem };

export type GeometryRules = {
  readonly minimums?: MinimumSizes;
  readonly cap?: number;
};

/**
 * Whether `region` may be placed on `surface` as it is. A region already on
 * the surface with the same id is the one being edited and is not counted
 * against itself. Warnings (rule 6) are not read here: a warning never blocks.
 */
export function validate(
  region: Region,
  surface: Surface,
  rules: GeometryRules = {},
): Validation {
  const others = surface.regions.filter((r) => r.id !== region.id);
  const cap = rules.cap ?? SURFACE_ELEMENT_CAP;
  if (others.length >= cap) {
    return {
      ok: false,
      problem: {
        rule: "cap",
        field: "count",
        message: GEOMETRY_COPY.cap(cap),
      },
    };
  }
  const field = offSurfaceField(region);
  if (field !== undefined) {
    return {
      ok: false,
      problem: {
        rule: "off-surface",
        field,
        message: GEOMETRY_COPY.offSurface(field),
      },
    };
  }
  const minimum = minimumSizeOf(
    region.kind,
    rules.minimums ?? DEFAULT_MINIMUM_SIZES,
  );
  if (region.w < minimum.w || region.h < minimum.h) {
    const field: GeometryField = region.w < minimum.w ? "w" : "h";
    return {
      ok: false,
      problem: {
        rule: "too-small",
        field,
        message: GEOMETRY_COPY.tooSmall(region.kind, minimum.w, minimum.h),
      },
    };
  }
  const built = buildCellMap([...others, region]);
  if (!built.ok) {
    // The others were already a valid surface, so the only conflict a new
    // region can raise is with one of them - and `a` is that one.
    const other = built.kind === "overlap" ? built.a : region.name;
    return {
      ok: false,
      problem: { rule: "overlap", message: overlapLine(other) },
    };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Rule 5: the previous valid value survives an invalid edit.

export type EditResult =
  | { readonly ok: true; readonly surface: Surface }
  | {
      readonly ok: false;
      readonly surface: Surface;
      readonly problem: Problem;
    };

/**
 * Apply a partial edit to the region with `id`. When the edited region fails
 * `validate`, the surface handed in is returned UNCHANGED beside the problem,
 * so the component keeps the previous valid value on screen with the message
 * inline until the edit is corrected. An unknown id is a programming error.
 */
export function applyEdit(
  surface: Surface,
  id: string,
  patch: Partial<Omit<Region, "id">>,
  rules: GeometryRules = {},
): EditResult {
  const index = surface.regions.findIndex((r) => r.id === id);
  if (index === -1) throw new Error(`no region with id ${id}`);
  const edited: Region = { ...surface.regions[index], ...patch, id };
  const verdict = validate(edited, surface, rules);
  if (!verdict.ok) return { ok: false, surface, problem: verdict.problem };
  const regions = surface.regions.slice();
  regions[index] = edited;
  return { ok: true, surface: { ...surface, regions } };
}

/** Add a region; the same contract as `applyEdit`. */
export function addRegion(
  surface: Surface,
  region: Region,
  rules: GeometryRules = {},
): EditResult {
  if (surface.regions.some((r) => r.id === region.id)) {
    throw new Error(`a region with id ${region.id} already exists`);
  }
  const verdict = validate(region, surface, rules);
  if (!verdict.ok) return { ok: false, surface, problem: verdict.problem };
  return {
    ok: true,
    surface: { ...surface, regions: [...surface.regions, region] },
  };
}

// ---------------------------------------------------------------------------
// Rule 4: duplicate to a free area, never silently delete.

/** The top-left of the first free w x h window in reading order, or undefined. */
export function freeWindow(
  w: number,
  h: number,
  map: CellMap,
): { col: number; row: number } | undefined {
  if (w < 1 || h < 1 || w > SURFACE_SIZE || h > SURFACE_SIZE) return undefined;
  for (let row = 0; row + h <= SURFACE_SIZE; row += 1) {
    for (let col = 0; col + w <= SURFACE_SIZE; col += 1) {
      let free = true;
      for (let r = row; free && r < row + h; r += 1) {
        for (let c = col; c < col + w; c += 1) {
          if (map[cellIndex(c, r)] !== 0) {
            free = false;
            break;
          }
        }
      }
      if (free) return { col, row };
    }
  }
  return undefined;
}

export type DuplicateResult =
  | { readonly ok: true; readonly surface: Surface; readonly region: Region }
  | {
      readonly ok: false;
      readonly reason: "no-space" | "cap";
      /** The surface handed in, untouched. */
      readonly surface: Surface;
    };

/**
 * A copy of the region with `id`, placed in the first free window of the
 * same size, keeping its mapping (section 8: "retain the original mapping").
 * With no free window the surface is returned untouched and the caller
 * offers resize. `mint` names the copy's id; the name gains " copy".
 */
export function duplicate(
  surface: Surface,
  id: string,
  mint: (source: Region) => string,
  rules: GeometryRules = {},
): DuplicateResult {
  const source = surface.regions.find((r) => r.id === id);
  if (source === undefined) throw new Error(`no region with id ${id}`);
  const cap = rules.cap ?? SURFACE_ELEMENT_CAP;
  if (surface.regions.length >= cap)
    return { ok: false, reason: "cap", surface };
  const built = buildCellMap(surface.regions);
  if (!built.ok) return { ok: false, reason: "no-space", surface };
  const at = freeWindow(source.w, source.h, built.map);
  if (at === undefined) return { ok: false, reason: "no-space", surface };
  const region: Region = {
    ...cloneRegion(source),
    id: mint(source),
    name: `${source.name} copy`,
    col: at.col,
    row: at.row,
  };
  return {
    ok: true,
    surface: { ...surface, regions: [...surface.regions, region] },
    region,
  };
}

// ---------------------------------------------------------------------------
// Rule 6: edge adjacency, a warning at both regions.

export type AdjacencyWarning = {
  readonly a: string;
  readonly b: string;
  readonly message: string;
};

/** True when the two regions share an edge segment with no gap: touching, not overlapping. */
export function edgeAdjacent(a: Region, b: Region): boolean {
  const aRight = a.col + a.w;
  const bRight = b.col + b.w;
  const aBottom = a.row + a.h;
  const bBottom = b.row + b.h;
  const rowsOverlap = a.row < bBottom && b.row < aBottom;
  const colsOverlap = a.col < bRight && b.col < aRight;
  const sideBySide = (aRight === b.col || bRight === a.col) && rowsOverlap;
  const stacked = (aBottom === b.row || bBottom === a.row) && colsOverlap;
  return sideBySide || stacked;
}

/** Every touching pair, each named once, in the order the regions are listed. */
export function adjacencyWarnings(
  regions: readonly Region[],
): AdjacencyWarning[] {
  const out: AdjacencyWarning[] = [];
  for (let i = 0; i < regions.length; i += 1) {
    for (let j = i + 1; j < regions.length; j += 1) {
      const a = regions[i];
      const b = regions[j];
      if (edgeAdjacent(a, b)) {
        out.push({
          a: a.name,
          b: b.name,
          message: GEOMETRY_COPY.adjacency(a.name, b.name),
        });
      }
    }
  }
  return out;
}

/** The interface's own words for a region's place, through the named door. */
export function placeInWords(region: Region): string {
  return `Column ${toDisplay(region.col)}, Row ${toDisplay(region.row)}`;
}
