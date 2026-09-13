// The Sandbox's region model: what a region IS, what a surface may hold, and
// the doors between the numbers the interface shows and the numbers the model
// keeps. Data and pure functions only; no browser, no minifier, no device.
//
// The shapes (Region, Surface, ElementKind, SURFACE_SIZE, SURFACE_ELEMENT_CAP)
// live in store/schema.ts - an import is validated against them before any
// Sandbox module loads - and are re-exported here so the Sandbox imports from
// one place. Every component reads a cell through toDisplay / fromDisplay: one-
// based shown, zero-based kept. The minimum size per kind is derived below.
// Decided at 13-15 (the dead zone, D-08); see .planning/phases/13-gui-overhaul/13-15-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  ELEMENT_KINDS,
  ORIENTATIONS,
  SURFACE_ELEMENT_CAP,
  SURFACE_SIZE,
  type ElementKind,
  type Orientation,
  type Region,
  type Surface,
} from "../store/schema";

export {
  ELEMENT_KINDS,
  ORIENTATIONS,
  SURFACE_ELEMENT_CAP,
  SURFACE_SIZE,
  type ElementKind,
  type Orientation,
  type Region,
  type Surface,
};

/** Nine by nine: the number of cells, and the length of the cell map. */
export const SURFACE_CELLS = SURFACE_SIZE * SURFACE_SIZE;

/** The last cell index on either axis, 0-based. */
export const LAST_CELL = SURFACE_SIZE - 1;

// ---------------------------------------------------------------------------
// The named door: one-based in the interface, zero-based in the model.

/** A model coordinate (0..8) -> the number the interface shows (1..9). */
export const toDisplay = (zeroBased: number): number => zeroBased + 1;

/** The number the interface shows (1..9) -> the model coordinate (0..8). */
export const fromDisplay = (oneBased: number): number => oneBased - 1;

/**
 * The MIDI channel's door, for the same reason: 1..16 as the user sees it and
 * types it, 0..15 on the wire. The emitter is the only caller; a component
 * never sees a wire channel.
 */
export const CHANNEL_MIN = 1;
export const CHANNEL_MAX = 16;
export const wireChannel = (channel: number): number => channel - 1;

/** A controller number, as the user sees it and as the wire carries it. */
export const CC_MIN = 0;
export const CC_MAX = 127;

// ---------------------------------------------------------------------------
// The kinds, their orientation and their runtime type codes.

/** A fader's axis; absent means vertical (schema.ts). Every other kind: undefined. */
export function orientationOf(region: Region): Orientation | undefined {
  if (region.kind !== "fader") return undefined;
  return region.orientation ?? "vertical";
}

/**
 * The runtime's type code per kind, the fifth column of a region row. The
 * codes are 13-RESEARCH 3.1's table: 1 vertical fader, 2 horizontal fader,
 * 3 button, 4 XY pad, 5 knob. A row's SEVENTH column is the XY pad's second
 * controller and the button's latch flag (0 or 1) - the research's "a second
 * flag, not a second branch" - so every row has the same eleven columns.
 */
export type TypeCode = 1 | 2 | 3 | 4 | 5;

export function typeCodeOf(region: Region): TypeCode {
  switch (region.kind) {
    case "fader":
      return orientationOf(region) === "horizontal" ? 2 : 1;
    case "button":
      return 3;
    case "xy":
      return 4;
    case "knob":
      return 5;
  }
}

/** The runtime branch a region needs: its kind, with a fader split by axis. */
export type Branch = "fader-v" | "fader-h" | "button" | "xy" | "knob";

export const BRANCHES: readonly Branch[] = [
  "fader-v",
  "fader-h",
  "button",
  "xy",
  "knob",
];

export function branchOf(region: Region): Branch {
  if (region.kind === "fader") {
    return orientationOf(region) === "horizontal" ? "fader-h" : "fader-v";
  }
  return region.kind;
}

/** The set of branches a surface uses, in BRANCHES order - dead-branch elimination's input. */
export function branchesUsed(regions: readonly Region[]): Branch[] {
  const used = new Set(regions.map(branchOf));
  return BRANCHES.filter((b) => used.has(b));
}

// ---------------------------------------------------------------------------
// Colour.

/** An RGB444 level (0..15) -> the 0..255 the firmware's `glc` takes. Level 15 is 255. */
export const colourByte = (level: number): number => level * 17;

/** The picker corner: the longest colour literal a region can carry, `255,255,255`. */
export const PICKER_CORNER: readonly [number, number, number] = [15, 15, 15];

// ---------------------------------------------------------------------------
// The minimum size per kind: derived from the probe's jitter and the runtime's step, not chosen.

export type CellSize = { readonly w: number; readonly h: number };

/** The minimum size per kind. Absent kinds have a one-cell minimum. */
export type MinimumSizes = Partial<Record<ElementKind, CellSize>>;

// The Knob's arithmetic. Every number below is derived from the two inputs
// (Probe A Q1's jitter, the uniform cell pitch) and the one design constant
// (the step); none is typed twice. The derivation is 13-15-SUMMARY.md's.

/** One raw sensor unit: Probe A Q1's per-sample wobble on one axis. */
export const JITTER_RAW = 1;

/** The diagonal of the 2 x 2 set a still finger visits over a few samples - the conservative jitter. */
export const JITTER_DIAGONAL_RAW = Math.SQRT2;

/** Degrees of accumulated turn per value step. 45 steps a turn, 2.84 turns end to end. */
export const KNOB_STEP_DEG = 8;

/** Value steps in one full turn. */
export const KNOB_STEPS_PER_TURN = 360 / KNOB_STEP_DEG;

/** One cell in raw units under the uniform 128/9 approximation (the measured pitches run 6..22). */
export const CELL_RAW = 128 / SURFACE_SIZE;

/**
 * The dead zone's radius in raw units: where the diagonal jitter alone swings
 * the angle by a whole step. 10.13 raw units, 0.71 of a cell.
 */
export const KNOB_DEAD_ZONE_RAW =
  (JITTER_DIAGONAL_RAW * (180 / Math.PI)) / KNOB_STEP_DEG;

/** The literal the runtime compares `dx*dx+dy*dy` against: ceil(rho0^2) = 103. */
export const KNOB_DEAD_ZONE_SQUARED = Math.ceil(
  KNOB_DEAD_ZONE_RAW * KNOB_DEAD_ZONE_RAW,
);

/** The ring's radius on a w-wide region: the outer cells' LED centres, uniform map. */
export const knobRingRaw = (w: number): number => ((w - 1) / 2) * CELL_RAW;

/**
 * The smallest w for which the ring lies outside the dead zone by one unit
 * of per-sample jitter: `(w-1)/2 * CELL_RAW >= rho0 + JITTER_RAW`, so 3.
 */
export const KNOB_MINIMUM_CELLS = Math.ceil(
  1 + (2 * (KNOB_DEAD_ZONE_RAW + JITTER_RAW)) / CELL_RAW,
);

/**
 * The derived defaults: a Knob at the dead-zone minimum, an XY pad at two
 * cells on each axis it reads (a one-row fader divides by zero on the module). A fader's minimum depends on its
 * orientation and is `minimumSizeFor`'s to answer; by kind alone a fader has
 * a one-cell minimum here and the orientation rule is applied on top.
 */
const DEFAULT_MINIMUM_SIZES: MinimumSizes = {
  knob: { w: KNOB_MINIMUM_CELLS, h: KNOB_MINIMUM_CELLS },
  xy: { w: 2, h: 2 },
};

function minimumSizeOf(
  kind: ElementKind,
  minimums: MinimumSizes = DEFAULT_MINIMUM_SIZES,
): CellSize {
  return minimums[kind] ?? { w: 1, h: 1 };
}

/**
 * The minimum size of THIS region: its kind's, and for a fader two cells
 * along the axis it reads - the one rule the kind alone cannot
 * state. geometry.ts's `validate` reads this one.
 */
export function minimumSizeFor(
  region: Region,
  minimums: MinimumSizes = DEFAULT_MINIMUM_SIZES,
): CellSize {
  const byKind = minimumSizeOf(region.kind, minimums);
  if (region.kind !== "fader") return byKind;
  return orientationOf(region) === "horizontal"
    ? { w: Math.max(byKind.w, 2), h: byKind.h }
    : { w: byKind.w, h: Math.max(byKind.h, 2) };
}

// ---------------------------------------------------------------------------
// Cells.

/** The cell index of a column and a row, both 0-based: `row*9 + col`. */
export const cellIndex = (col: number, row: number): number =>
  row * SURFACE_SIZE + col;

/** The region's cells, in reading order. Assumes the region is on the surface. */
export function cellsOf(region: Region): number[] {
  const out: number[] = [];
  for (let r = region.row; r < region.row + region.h; r += 1) {
    for (let c = region.col; c < region.col + region.w; c += 1) {
      out.push(cellIndex(c, r));
    }
  }
  return out;
}

/** A structurally identical copy - the shape a duplicate starts from. */
export function cloneRegion(region: Region): Region {
  return { ...region, colour: [...region.colour] };
}

/** The empty surface. */
export function emptySurface(id: string, name: string): Surface {
  return { id, name, regions: [] };
}
