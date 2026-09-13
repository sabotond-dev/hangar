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
// 4. THE MINIMUM SIZE PER KIND IS DERIVED, NOT CHOSEN (13-15)
// ---------------------------------------------------------------------------
//
// 13-14 left the minimum sizes as a parameter with a provisional 3 x 3 Knob;
// 13-15 replaced the default with the rule below, and the parameter stays so
// a spec can still move it. Two kinds of minimum, and neither is taste:
//
// (a) A FADER OR AN XY PAD NEEDS TWO CELLS ALONG EVERY AXIS IT READS. Since
//     13-15 a fader's value is computed on the library's calibrated axis
//     (`U(y,KY)`, LED n at n*64) between the region's first and last LED
//     CENTRES, so the top and bottom LEDs give 127 and 0 exactly (the Phase
//     12.1 hand-off's rule); the divisor is the LED span `(h-1)*64`, and on
//     a one-row fader that is ZERO - Lua's `//0` raises on the module on
//     every sample. A vertical fader therefore needs h >= 2, a horizontal one
//     w >= 2 and an XY pad 2 x 2. `minimumSizeFor` reads the orientation,
//     which `minimumSizeOf` by kind alone cannot.
//
// (b) A KNOB NEEDS A RING OUTSIDE ITS DEAD ZONE, and the dead zone's radius
//     is derived from the probe, not from the nine-cells-per-turn figure.
//     The rotary (runtime.ts, `I[5]`) reads the angle `math.atan(dy,dx)`
//     around the region's centre in RAW sensor units (0..127 per axis), and
//     steps the value once per KNOB_STEP_DEG degrees of accumulated turn.
//     Probe A Q1 measured a still finger moving ONE raw unit on one axis
//     per sample (x 65<->66, y 66<->67 at 100 Hz); over a few samples it
//     visits a 2 x 2 set whose diagonal is sqrt(2) raw units, and that is
//     the spread this file takes as the jitter (JITTER_DIAGONAL_RAW - the
//     conservative reading; the per-sample figure is 1). At radius rho from
//     the centre a tangential spread j swings the angle by about j/rho
//     radians, i.e. j * (180/pi) / rho degrees. The runtime's truncating
//     accumulator (runtime.ts section 3) never steps while the spread stays
//     under one step, so the angle is UNSTABLE - jitter alone steps the value
//     - wherever j * 57.3 / rho >= KNOB_STEP_DEG, that is inside
//
//         rho0 = JITTER_DIAGONAL_RAW * (180 / pi) / KNOB_STEP_DEG raw units
//              = 1.414 * 57.30 / 8 = 10.13 raw units (KNOB_DEAD_ZONE_RAW),
//
//     which is 0.71 of a cell at the uniform 128/9 = 14.2 raw units per
//     cell (CELL_RAW). The runtime refuses samples inside it outright
//     (`u*u+v*v<103`, KNOB_DEAD_ZONE_SQUARED = ceil(rho0^2)) and forgets the
//     contact's previous angle there, so a finger dragged through the centre
//     lands on the far side without a half-turn jump. EVERY FIGURE ABOVE IS
//     RESOLUTION: it says where a turn can be read. "Nine cells of travel per
//     turn" (D-08) is LED FEEDBACK: how many lights a finger walks past on a
//     3 x 3 ring, which is a different number about a different thing.
//
//     THE INEQUALITY. The ring a finger follows on a w-wide region is the
//     region's outer cells, whose LED centres sit (w-1)/2 cells from the
//     centre: (w-1)/2 * CELL_RAW raw units. A region is usable when that ring
//     lies outside the dead zone by at least one unit of per-sample jitter:
//
//         (w - 1) / 2 * CELL_RAW  >=  rho0 + JITTER_RAW
//         w  >=  1 + 2 * (10.13 + 1) / 14.22  =  2.57
//
//     so KNOB_MINIMUM_CELLS = 3. A 2 x 2 has its ring 7.1 raw units out,
//     inside the dead zone, and is refused; a 3 x 3's ring is 14.2 out, 3.1
//     past it; a 4 x 4's 21.3. The measured map (calibration.ts) is not
//     uniform - its pitches run 6..22 raw units per cell - and
//     runtime.spec.ts prints the ring radius of every 3 x 3 placement under
//     it; the rule here is the uniform one the plan asks for, and the two
//     placements the measured map puts under the line are a question in
//     13-15-SUMMARY.md, not a refusal this plan invents.
//
//     THE STEP, KNOB_STEP_DEG = 8, is the finest step that keeps the 3 x 3
//     knob the Bible draws (page 3, "Turn") clear of the dead zone under the
//     diagonal jitter: at 6 degrees rho0 is 13.5, one unit short of the 3 x
//     3's ring; at 8 it is 10.1. Forty-five steps a turn, 128/45 = 2.84 turns
//     from 0 to 127. Nothing about this has been felt on the pad; the bench
//     row (docs/INSTALL-RUNBOOK.md row L) is where the figure is tested, and
//     the constant is one number.
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

// The Knob's arithmetic (section 4b). Every number below is derived from the
// two inputs and the one design constant; none is typed twice.

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
 * cells on each axis it reads (section 4a). A fader's minimum depends on its
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
 * along the axis it reads (section 4a) - the one rule the kind alone cannot
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
