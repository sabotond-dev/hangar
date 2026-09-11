// The cost of an emitted surface, MEASURED under the pinned minifier at the
// RGB444 picker corner - never estimated, never divided.
//
// ---------------------------------------------------------------------------
// 1. HOW A STRING IS MEASURED IN THIS TREE (lua-entries.sweep.spec.ts test 1)
// ---------------------------------------------------------------------------
//
// `GridScript.compressScript` after `padReady()` - the WASM formatter throws
// before it resolves and `checkSyntax` silently returns false, so every
// entry point here awaits the gate first. The cost of a text is
// `max(compressed.length, raw.length)`: the vendored `cost()` charges the raw
// length when it is larger, which is why every stored body is CANONICAL - a
// fixed point of the minifier - and why `canonical()` below runs the output
// back through itself until it stops moving. The emitter is written to be a
// fixed point already (emit.spec.ts test 1 asserts one round); canonicalising
// here is what keeps the meter honest if a later edit is not.
//
// ---------------------------------------------------------------------------
// 2. THE PICKER CORNER, FOR A SURFACE
// ---------------------------------------------------------------------------
//
// A hand-authored entry is measured at its longest colour literal (D-06,
// plan 10-08: `255,255,255`). For a surface that means EVERY REGION at level
// 15 on all three channels, so a visitor who turns a colour rail can never
// push a surface over the budget that the meter said fitted. `costOf`
// measures the surface with every colour replaced by `PICKER_CORNER`; the
// surface's own colours are never cheaper by more than a few characters and
// never dearer.
//
// ---------------------------------------------------------------------------
// 3. "ROOM FOR ABOUT M MORE" IS MEASURED, NOT DIVIDED
// ---------------------------------------------------------------------------
//
// The cost of one more region is not the average of the regions already
// there: a seventeenth-row index makes every one of that region's cells two
// characters in `M` instead of one, a three-digit controller is two more
// than a one-digit one, and the sixteen cap is a wall of its own. So
// `roomFor` ADDS A REPRESENTATIVE REGION AND RE-MEASURES, again and again,
// until the Setup would exceed the budget, the cap is reached, or the map
// has no free window - and reports how many it managed to add. The
// representative is the dearest a region can be in BOTH tables: in `J` a
// three-digit controller on channel 16 at the picker corner, and in `M`
// the surface's own LARGEST region shape, because a region's cost in `M`
// is one character per cell it covers (two once its index passes nine) - a
// one-cell fader beside a 2 x 6 would report room the 2 x 6 does not have.
// On an empty surface the shape is one cell. The answer is therefore a
// floor, which is the honest side to err on for a meter that says "room for
// four more". Once no window of that shape is free the count goes on with
// single cells, so a nearly full surface still gets a number rather than a
// shrug.
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
  readonly timer: Budget;
  readonly fits: boolean;
};

/** The surface as given, measured. */
export async function measureSurface(
  surface: Surface,
  options: EmitOptions = {},
): Promise<MeasuredSurface> {
  const emitted = emitSurface(surface, options);
  const [setup, timer] = await Promise.all([
    canonical(emitted.setup),
    canonical(emitted.timer),
  ]);
  return {
    emitted,
    setup: budget(setup.cost),
    timer: budget(timer.cost),
    fits: setup.cost <= EVENT_BUDGET && timer.cost <= EVENT_BUDGET,
  };
}

/** Every region at the picker corner (section 2). */
export function atPickerCorner(surface: Surface): Surface {
  return {
    ...surface,
    regions: surface.regions.map((r) => ({ ...r, colour: PICKER_CORNER })),
  };
}

export type SurfaceCost = MeasuredSurface & {
  /** How many more representative regions fit before the Setup exceeds the budget (section 3). */
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
