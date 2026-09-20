// The Sandbox's six geometry rules (Bible section 8; the banners below carry
// the numbers): 1 on the surface, the offending field named; 2 no overlap,
// both names; 3 a minimum size per kind (model.ts, a parameter); 4 duplicate
// to a free window or return the surface UNCHANGED with `no-space`; 5 the
// previous valid value survives an invalid edit (applyEdit returns the surface
// it was given beside the problem); 6 edge adjacency is a WARNING, never an
// error. THE CELL MAP IS THE RULE: buildCellMap writes each region's cells into 81 entries, a
// cell written twice is a conflict and the map is not returned, and emit.ts renders that same
// array as `M` - an overlapping surface cannot be emitted. The overlap line is the Bible's
// section 16 row; the rest are HANGAR's. Change 13B's pure geometry sits after rule 4.
// Decided at 13-14 (13-RESEARCH 3.1, unrepresentable overlaps); see .planning/phases/13-gui-overhaul/13-14-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  LAST_CELL,
  SURFACE_CELLS,
  SURFACE_ELEMENT_CAP,
  SURFACE_SIZE,
  boundingBox,
  cellIndex,
  cellsOf,
  cloneRegion,
  minimumSizeFor,
  orientationOf,
  toDisplay,
  type Box,
  type CellSize,
  type MinimumSizes,
  type Region,
  type Surface,
} from "./model";

// ---------------------------------------------------------------------------
// The strings.

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
  /** The cap, worded without a number (change 10A: no count reaches the Sandbox's words). */
  cap: "This surface is full. Remove an element to add another.",
  /**
   * Rule 3, per kind (13-15; model.ts). A knob's line carries the
   * reason - its centre cannot read a turn - and the fader's names the one
   * axis it reads. Ledgered in 13-COPY-NEW.md under "From 13-15".
   */
  tooSmall: (region: Region, minimum: CellSize): string => {
    switch (region.kind) {
      case "knob":
        return `A knob needs at least ${minimum.w} × ${minimum.h} cells. Its centre can’t read a turn, so the finger needs a ring of cells around it.`;
      case "fader":
        return orientationOf(region) === "horizontal"
          ? `A horizontal fader needs at least ${minimum.w} columns.`
          : `A vertical fader needs at least ${minimum.h} rows.`;
      case "xy":
        return `An XY pad needs at least ${minimum.w} × ${minimum.h} cells.`;
      case "button":
        return `A button needs at least ${minimum.w} × ${minimum.h} cells.`;
      case "blank":
        return `A blank needs at least ${minimum.w} × ${minimum.h} cells.`;
    }
  },
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
// Rule 2: the cell map.

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
function offSurfaceField(region: Region): GeometryField | undefined {
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
  readonly rule: "off-surface" | "overlap" | "too-small" | "cap" | "locked";
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
        message: GEOMETRY_COPY.cap,
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
  const minimum = minimumSizeFor(region, rules.minimums);
  if (region.w < minimum.w || region.h < minimum.h) {
    const field: GeometryField = region.w < minimum.w ? "w" : "h";
    return {
      ok: false,
      problem: {
        rule: "too-small",
        field,
        message: GEOMETRY_COPY.tooSmall(region, minimum),
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

/** One region's patch inside a group edit. */
export type RegionEdit = readonly [
  id: string,
  patch: Partial<Omit<Region, "id">>,
];

/**
 * Apply one patch per region AS ONE (change 13A): every patched region is validated against the
 * surface with every other patch already applied, so a group move that would overlap or leave the
 * plate is refused whole - the surface handed in comes back unchanged beside the first problem -
 * and the model is never transiently invalid. A key whose patch value is `undefined` is REMOVED
 * from the region (the canonical absence: `locked` off is no field). An unknown id throws.
 */
export function applyEdits(
  surface: Surface,
  edits: readonly RegionEdit[],
  rules: GeometryRules = {},
): EditResult {
  const regions = surface.regions.slice();
  const touched = new Set<number>();
  for (const [id, patch] of edits) {
    const index = regions.findIndex((r) => r.id === id);
    if (index === -1) throw new Error(`no region with id ${id}`);
    const edited: Record<string, unknown> = { ...regions[index], ...patch, id };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) delete edited[key];
    }
    regions[index] = edited as Region;
    touched.add(index);
  }
  // Each patched region against the UNTOUCHED ones first (validate assumes the others are a
  // valid surface: rules 1 and 3 and an overlap with a bystander, named right); then the map
  // over everything, where the only conflict left is between two patched regions.
  const untouched = regions.filter((_, index) => !touched.has(index));
  for (const index of touched) {
    const verdict = validate(
      regions[index],
      { ...surface, regions: [...untouched, regions[index]] },
      rules,
    );
    if (!verdict.ok) return { ok: false, surface, problem: verdict.problem };
  }
  const built = buildCellMap(regions);
  if (!built.ok) {
    const other = built.kind === "overlap" ? built.a : built.region;
    return {
      ok: false,
      surface,
      problem: { rule: "overlap", message: overlapLine(other) },
    };
  }
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
// Change 13A: the marquee's hit-test and the paste's placement rule.

/** The regions a box TOUCHES - one cell in common is enough (the marquee's rule, BENCH section 13). */
export function touching(box: Box, regions: readonly Region[]): Region[] {
  return regions.filter(
    (r) =>
      r.col < box.col + box.w &&
      box.col < r.col + r.w &&
      r.row < box.row + box.h &&
      box.row < r.row + r.h,
  );
}

/**
 * Where a group of boxes lands, as the origin its bounding box takes (the paste, the duplicate):
 * the anchor cell - the keyboard focus cell - if every box fits there with the group's layout
 * kept; else one cell down-right of the group's own origin; else the first origin in reading
 * order (row-major) at which every box is on the plate and covers only free cells. Undefined when
 * nowhere fits. A box "fits" cell by cell, so another element may sit in the group's gaps.
 */
export function placementFor(
  boxes: readonly Box[],
  anchor: { readonly col: number; readonly row: number },
  map: CellMap,
): { col: number; row: number } | undefined {
  const origin = boundingBox(boxes);
  if (origin === undefined) return undefined;
  const fits = (at: { col: number; row: number }): boolean =>
    boxes.every((b) => {
      const col = b.col - origin.col + at.col;
      const row = b.row - origin.row + at.row;
      if (col < 0 || row < 0) return false;
      if (col + b.w > SURFACE_SIZE || row + b.h > SURFACE_SIZE) return false;
      for (let r = row; r < row + b.h; r += 1) {
        for (let c = col; c < col + b.w; c += 1) {
          if (map[cellIndex(c, r)] !== 0) return false;
        }
      }
      return true;
    });
  const candidates = [
    { col: anchor.col, row: anchor.row },
    { col: origin.col + 1, row: origin.row + 1 },
  ];
  for (let row = 0; row < SURFACE_SIZE; row += 1) {
    for (let col = 0; col < SURFACE_SIZE; col += 1)
      candidates.push({ col, row });
  }
  return candidates.find(fits);
}

// ---------------------------------------------------------------------------
// Change 13B: the fill-to-fit rectangle, the alignments, the spacing and the whole-surface transforms.

/**
 * The largest free rectangle holding a cell (Alt+click's placement): every rectangle of free cells
 * that contains the cell is enumerated - the plate is 9 x 9, so at most 2,025 - and the one with
 * the most cells wins; on a tie the squarer one (the smaller difference between its sides), then
 * the higher, then the further left. With `square` only squares are considered (a knob). Undefined
 * when the cell itself is held.
 */
export function largestFreeBox(
  at: { readonly col: number; readonly row: number },
  map: CellMap,
  square = false,
): Box | undefined {
  if (map[cellIndex(at.col, at.row)] !== 0) return undefined;
  const free = (col: number, row: number, w: number, h: number): boolean => {
    for (let r = row; r < row + h; r += 1) {
      for (let c = col; c < col + w; c += 1) {
        if (map[cellIndex(c, r)] !== 0) return false;
      }
    }
    return true;
  };
  let best: Box | undefined;
  const better = (box: Box): boolean => {
    if (best === undefined) return true;
    const area = box.w * box.h - best.w * best.h;
    if (area !== 0) return area > 0;
    const shape = Math.abs(best.w - best.h) - Math.abs(box.w - box.h);
    if (shape !== 0) return shape > 0;
    if (box.row !== best.row) return box.row < best.row;
    return box.col < best.col;
  };
  for (let row = 0; row <= at.row; row += 1) {
    for (let bottom = at.row; bottom < SURFACE_SIZE; bottom += 1) {
      const h = bottom - row + 1;
      for (let col = 0; col <= at.col; col += 1) {
        for (let right = at.col; right < SURFACE_SIZE; right += 1) {
          const w = right - col + 1;
          if (square && w !== h) continue;
          const box = { col, row, w, h };
          if (better(box) && free(col, row, w, h)) best = box;
        }
      }
    }
  }
  return best;
}

/** The six alignments: an edge of the set's bounding box, or its centre line on one axis. */
export type Alignment =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "centre-x"
  | "centre-y";

export const ALIGNMENTS: readonly Alignment[] = [
  "left",
  "right",
  "top",
  "bottom",
  "centre-x",
  "centre-y",
];

/**
 * Every box moved to the alignment, its size kept: left / top to the set's bounding box's edge,
 * right / bottom so its far edge is the box's, a centre so its middle is the box's - a half-cell
 * centre rounds toward the left or the top. Sizes never change; the caller validates the result.
 */
export function alignBoxes(boxes: readonly Box[], to: Alignment): Box[] {
  const bounds = boundingBox(boxes);
  if (bounds === undefined) return [];
  return boxes.map((b) => {
    switch (to) {
      case "left":
        return { ...b, col: bounds.col };
      case "right":
        return { ...b, col: bounds.col + bounds.w - b.w };
      case "top":
        return { ...b, row: bounds.row };
      case "bottom":
        return { ...b, row: bounds.row + bounds.h - b.h };
      case "centre-x":
        return { ...b, col: bounds.col + Math.floor((bounds.w - b.w) / 2) };
      case "centre-y":
        return { ...b, row: bounds.row + Math.floor((bounds.h - b.h) / 2) };
    }
  });
}

export type Axis = "horizontal" | "vertical";

/**
 * Equal gaps between the boxes along one axis, the outermost two kept where they are: the boxes
 * are taken in the order of their near edge (ties by the other axis), the free cells between
 * the first's near edge and the last's far edge are shared out as gaps - the remainder of the
 * division going to the first gaps, one cell each - and every box between moves to its slot.
 * Undefined when the boxes are wider than the span (no room), and the input order is kept.
 */
export function distributeBoxes(
  boxes: readonly Box[],
  axis: Axis,
): Box[] | undefined {
  if (boxes.length < 3) return boxes.slice();
  const near = (b: Box): number => (axis === "horizontal" ? b.col : b.row);
  const other = (b: Box): number => (axis === "horizontal" ? b.row : b.col);
  const size = (b: Box): number => (axis === "horizontal" ? b.w : b.h);
  const order = boxes
    .map((b, index) => ({ b, index }))
    .sort((p, q) => near(p.b) - near(q.b) || other(p.b) - other(q.b));
  const first = order[0].b;
  const last = order[order.length - 1].b;
  const span = near(last) + size(last) - near(first);
  const free = span - order.reduce((sum, { b }) => sum + size(b), 0);
  if (free < 0) return undefined;
  const gaps = order.length - 1;
  const each = Math.floor(free / gaps);
  const extra = free - each * gaps;
  const out = boxes.slice();
  let cursor = near(first);
  order.forEach(({ b, index }, i) => {
    out[index] =
      axis === "horizontal" ? { ...b, col: cursor } : { ...b, row: cursor };
    cursor += size(b) + each + (i < extra ? 1 : 0);
  });
  return out;
}

/** The whole-surface transforms: a mirror on either axis, or a quarter turn clockwise. */
export type SurfaceTransform = "flip-horizontal" | "flip-vertical" | "rotate";

/**
 * One box under a transform of the 9 x 9: mirrored left to right (`col' = 9 - col - w`), top to
 * bottom (`row' = 9 - row - h`), or turned a quarter clockwise - the cell (c, r) goes to
 * (8 - r, c), so the box's origin is (9 - row - h, col) and its sides swap. Four turns, or two
 * of either mirror, are the identity.
 */
export function transformBox(box: Box, transform: SurfaceTransform): Box {
  switch (transform) {
    case "flip-horizontal":
      return { ...box, col: SURFACE_SIZE - box.col - box.w };
    case "flip-vertical":
      return { ...box, row: SURFACE_SIZE - box.row - box.h };
    case "rotate":
      return {
        col: SURFACE_SIZE - box.row - box.h,
        row: box.col,
        w: box.h,
        h: box.w,
      };
  }
}

// ---------------------------------------------------------------------------
// Rule 6: edge adjacency, a warning at both regions.

export type AdjacencyWarning = {
  readonly a: string;
  readonly b: string;
  readonly message: string;
};

/** True when the two regions share an edge segment with no gap: touching, not overlapping. */
function edgeAdjacent(a: Region, b: Region): boolean {
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
