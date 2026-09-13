// The cost of an emitted surface, MEASURED under the pinned minifier at the
// RGB444 picker corner - never estimated, never divided. `fits` is a statement
// about every string the surface emits (the Timer and 255/4 carry the runtime).
// A text costs `max(compressed.length, raw.length)` under GridScript.compressScript
// after padReady(), which is why every stored body is CANONICAL - a fixed point
// of the minifier - and `canonical()` runs the output back through itself. The
// picker corner is EVERY region at level 15 on all three channels, so a colour
// rail can never push a surface the meter said fitted over the budget. "Room
// for about M more" ADDS the dearest representative region and re-measures
// until the budget, the cap or the map's free windows run out - a floor, never a division.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { GridScript } from "@intechstudio/grid-protocol";
import { EVENT_BUDGET } from "../../vendor/botor/_pad";
import { padReady } from "../pad/ready";
import { emitSurface, type EmitOptions, type Emitted } from "./emit";
import { buildCellMap, freeWindow } from "./geometry";
import {
  CC_MAX,
  CHANNEL_MAX,
  PICKER_CORNER,
  SURFACE_ELEMENT_CAP,
  type Region,
  type Surface,
} from "./model";

export { EVENT_BUDGET };

export type Budget = {
  readonly used: number;
  readonly limit: number;
  readonly free: number;
};

export type Canonical = {
  /** The fixed point. */
  readonly text: string;
  /** `max(compressed, raw)` of the text handed in - what the meter charges. */
  readonly cost: number;
  /** How many rounds the minifier needed to stop moving; 0 means the input was canonical. */
  readonly rounds: number;
};

/**
 * Run the minifier to a fixed point. `cost` is charged on the INPUT the way
 * the vendored `cost()` charges a stored body: the raw length wins if it is
 * larger, which is exactly why the emitter emits the canonical form.
 */
export async function canonical(lua: string): Promise<Canonical> {
  await padReady();
  let text = lua;
  let rounds = 0;
  for (;;) {
    const next = GridScript.compressScript(text);
    if (next === text) break;
    text = next;
    rounds += 1;
    if (rounds > 8) throw new Error("the minifier did not reach a fixed point");
  }
  const compressed = GridScript.compressScript(lua).length;
  return { text, cost: Math.max(compressed, lua.length), rounds };
}

function budget(used: number): Budget {
  return { used, limit: EVENT_BUDGET, free: EVENT_BUDGET - used };
}

export type MeasuredSurface = {
  readonly emitted: Emitted;
  readonly setup: Budget;
  /** The touch Timer: the runtime (or what the packer left in it) beside the sweep (13-15). */
  readonly timer: Budget;
  /** The system element's fourth event under three slots; undefined under two. */
  readonly mapmode: Budget | undefined;
  /** Every emitted string inside 908. A runtime that does not fit its slot(s) is a surface that does not fit. */
  readonly fits: boolean;
};

/** The surface as given, measured - every string it emits. */
export async function measureSurface(
  surface: Surface,
  options: EmitOptions = {},
): Promise<MeasuredSurface> {
  const emitted = emitSurface(surface, options);
  const [setup, timer, mapmode] = await Promise.all([
    canonical(emitted.setup),
    canonical(emitted.timer),
    emitted.mapmode === undefined ? undefined : canonical(emitted.mapmode),
  ]);
  return {
    emitted,
    setup: budget(setup.cost),
    timer: budget(timer.cost),
    mapmode: mapmode === undefined ? undefined : budget(mapmode.cost),
    fits:
      setup.cost <= EVENT_BUDGET &&
      timer.cost <= EVENT_BUDGET &&
      (mapmode === undefined || mapmode.cost <= EVENT_BUDGET),
  };
}

/** Every region at the picker corner: level 15 on all three channels. */
export function atPickerCorner(surface: Surface): Surface {
  return {
    ...surface,
    regions: surface.regions.map((r) => ({ ...r, colour: PICKER_CORNER })),
  };
}

export type SurfaceCost = MeasuredSurface & {
  /** How many more representative regions fit before the Setup exceeds the budget - measured, not divided. */
  readonly roomFor: number;
  /** What stopped the count: the budget, the cap, or the surface being full. */
  readonly roomLimit: "budget" | "cap" | "space";
};

/** The largest region shape on the surface by area; one cell on an empty surface. */
export function representativeShape(surface: Surface): {
  readonly w: number;
  readonly h: number;
} {
  let best = { w: 1, h: 1 };
  for (const r of surface.regions) {
    if (r.w * r.h > best.w * best.h) best = { w: r.w, h: r.h };
  }
  return best;
}

/** The dearest region of that shape: a vertical fader, cc 127, channel 16, at the corner. */
export function representativeRegion(
  index: number,
  col: number,
  row: number,
  shape: { readonly w: number; readonly h: number },
): Region {
  return {
    id: `room-${index}`,
    name: `Room ${index}`,
    kind: "fader",
    col,
    row,
    w: shape.w,
    h: shape.h,
    cc: CC_MAX,
    channel: CHANNEL_MAX,
    colour: PICKER_CORNER,
  };
}

/**
 * "This surface costs N of 908 at the picker corner, and you have room for
 * about M more elements." M by re-measurement, never by division.
 */
export async function costOf(
  surface: Surface,
  options: EmitOptions = {},
): Promise<SurfaceCost> {
  const corner = atPickerCorner(surface);
  const measured = await measureSurface(corner, options);
  let roomFor = 0;
  let roomLimit: SurfaceCost["roomLimit"] = "budget";
  if (measured.fits) {
    const shape = representativeShape(corner);
    let grown = corner;
    for (;;) {
      if (grown.regions.length >= SURFACE_ELEMENT_CAP) {
        roomLimit = "cap";
        break;
      }
      const built = buildCellMap(grown.regions);
      if (!built.ok) throw new Error("a measured surface stopped building");
      // The largest shape while a window for it exists, then single cells
      // until none is free: a floor on what the surface can still take.
      let placed = { at: freeWindow(shape.w, shape.h, built.map), shape };
      if (placed.at === undefined) {
        placed = { at: freeWindow(1, 1, built.map), shape: { w: 1, h: 1 } };
      }
      if (placed.at === undefined) {
        roomLimit = "space";
        break;
      }
      const next: Surface = {
        ...grown,
        regions: [
          ...grown.regions,
          representativeRegion(
            roomFor + 1,
            placed.at.col,
            placed.at.row,
            placed.shape,
          ),
        ],
      };
      const trial = await measureSurface(next, options);
      if (!trial.fits) {
        roomLimit = "budget";
        break;
      }
      grown = next;
      roomFor += 1;
    }
  }
  return { ...measured, roomFor, roomLimit };
}
