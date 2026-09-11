// The Sandbox's region model: what a region IS, what a surface may hold, and
// the doors between the numbers the interface shows and the numbers the model
// keeps. Data and pure functions only; nothing here touches a browser, the
// minifier or a device.
//
// ---------------------------------------------------------------------------
// 1. THE SHAPES ARE 13-13's, EXTENDED HERE AND NOT DUPLICATED
// ---------------------------------------------------------------------------
//
// `Region`, `Surface`, `ElementKind`, `SURFACE_SIZE` and `SURFACE_ELEMENT_CAP`
// live in src/lib/store/schema.ts, because a sandbox record is validated
// against them on import (transfer.ts, step 5) before any Sandbox module has
// loaded. This module re-exports them so the Sandbox has one place to import
// from, and adds what the editor and the emitter need beside them. The one
// field added to the schema by this plan is a fader's `orientation`
// (schema.ts's header says why the version stays on the record and not on the
// surface).
//
// ---------------------------------------------------------------------------
// 2. ONE-BASED IN THE INTERFACE, ZERO-BASED IN THE MODEL - THE NAMED DOOR
// ---------------------------------------------------------------------------
//
// The PDF's inspector shows `Column 1, Row 1` for the top-left cell. HANGAR is
// zero-based everywhere else: `glag(0, n)` addresses LED `n = row*9 + col`,
// the cell map below is indexed 0..80, and every Lua the emitter writes counts
// from 0. That translation is a real interface between two numbering systems
// and it gets a NAMED DOOR, `toDisplay` / `fromDisplay`, the way
// src/lib/tune/view.ts already names `knobPosition` (a view position is not a
// knob index) and `colourPosition` (a rail detent is not a lattice position).
// The precedent's lesson, quoted from that file: an inline `knob.index` read
// where the door should have been was MEASURED as a KEEP ON DEVICE control
// disabling itself after a write nobody had touched. Four inline `- 1`s in
// four components are the same bug waiting; every component goes through
// these two functions, and 13-16's spec asserts the arithmetic appears nowhere
// else.
//
// ---------------------------------------------------------------------------
// 3. THE CAP, AND WHY THE METER IS THE REAL GATE
// ---------------------------------------------------------------------------
//
// Sixteen regions (13-CONTEXT D-14 Q4), imported from schema.ts. The cap is
// the coarse rule; the fine one is the budget meter in cost.ts, which measures
// the emitted Setup under the pinned minifier at the RGB444 picker corner and
// says "room for about M more" by adding regions and re-measuring. A surface
// of sixteen tiny faders fits; a surface of eight with three-digit CCs on
// sixteen channels might not; only the measurement knows which.
//
// ---------------------------------------------------------------------------
// 4. THE MINIMUM SIZE PER KIND IS A PARAMETER, NOT A RULE THIS PLAN INVENTS
// ---------------------------------------------------------------------------
//
// A Knob is a real rotary (D-08): angle around the region's centre, and the
// arithmetic that sets its minimum size is a centre dead zone derived from
// Probe A Q1's measured jitter - 13-15's derivation, not this plan's. So the
// geometry rules take the minimum sizes as a parameter (`MinimumSizes`), with
// a PROVISIONAL default that refuses a 1x1 and a 2x2 Knob as the plan asks
// and nothing else; 13-15 replaces the default with the derived rule and
// ledgers the refusal message. Every other kind's minimum is one cell.
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
// The named door (section 2).

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
// The minimum size per kind (section 4).

export type CellSize = { readonly w: number; readonly h: number };

/** The minimum size per kind. Absent kinds have a one-cell minimum. */
export type MinimumSizes = Partial<Record<ElementKind, CellSize>>;

/**
 * PROVISIONAL. The plan's own words: "a 1x1 or 2x2 knob is refused - 13-15
 * derives the exact rule from the arithmetic and this plan takes it as a
 * parameter rather than inventing it". Three by three is the smallest size
 * this default admits; 13-15 replaces it from the dead-zone inequality.
 */
export const DEFAULT_MINIMUM_SIZES: MinimumSizes = { knob: { w: 3, h: 3 } };

export function minimumSizeOf(
  kind: ElementKind,
  minimums: MinimumSizes = DEFAULT_MINIMUM_SIZES,
): CellSize {
  return minimums[kind] ?? { w: 1, h: 1 };
}

// ---------------------------------------------------------------------------
// Cells.

/** The cell index of a column and a row, both 0-based: `row*9 + col`. */
export const cellIndex = (col: number, row: number): number =>
  row * SURFACE_SIZE + col;

/** The column and the row of a cell index. */
export function cellAt(index: number): { col: number; row: number } {
  return { col: index % SURFACE_SIZE, row: Math.floor(index / SURFACE_SIZE) };
}

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

/** True when the region's cells are all inside the 9 x 9 and its size is at least 1 x 1. */
export function isOnSurface(region: Region): boolean {
  const { col, row, w, h } = region;
  if (!Number.isInteger(col) || !Number.isInteger(row)) return false;
  if (!Number.isInteger(w) || !Number.isInteger(h)) return false;
  if (w < 1 || h < 1 || col < 0 || row < 0) return false;
  return col + w <= SURFACE_SIZE && row + h <= SURFACE_SIZE;
}

/** A structurally identical copy - the shape a duplicate starts from. */
export function cloneRegion(region: Region): Region {
  return { ...region, colour: [...region.colour] };
}

/** The empty surface. */
export function emptySurface(id: string, name: string): Surface {
  return { id, name, regions: [] };
}
