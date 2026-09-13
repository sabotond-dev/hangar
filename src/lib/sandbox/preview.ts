// The Sandbox's live preview: a Lua-backed engine running the surface the
// visitor built, so Play routes a finger to the same runtime the module would
// run (PREV-04). The same host, library and strings: emitSurface writes the
// Setup, the Timer and, under three slots, the 255/4 body; createLuaHost runs
// them over TOUCH_LIBRARY and TOUCH_LIBRARY_TIMER exactly as a hand-authored
// entry; LuaPadSim is the SimEngine the page's SimHost paints. Two stand-ins,
// as runtime.spec.ts uses them: the touch element's `tim` (the Timer body) and
// `ele[#ele]:map()` (the 255/4 body) are assigned in front of the Setup, because
// the host models neither for the touch element. Reached only through
// await import(): this chunk carries the Lua host and wasmoon's glue.wasm.
// Decided at 13-16 and 13-17 (D-18 / D-19, three slots); see .planning/phases/13-gui-overhaul/13-17-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { PadSim } from "../../vendor/botor/pad-sim";
import { TOUCH_LIBRARY, TOUCH_LIBRARY_TIMER } from "../catalog/library";
import type { SimEngine } from "../sim/engine";
import { createLuaHost } from "../sim/lua-host";
import { blankPadState, LuaPadSim } from "../sim/lua-pad-sim";
import { emitSurface, type EmitOptions } from "./emit";
import type { Surface } from "./model";

/** The touch element's `tim`, which the host compiles as the Timer wrapper. */
export const TIM_STAND_IN = "self.tim=__hangar_timer ";

/** The slots the preview runs, and the slots the install lands (land.ts's LANDING_SLOTS). */
export const PREVIEW_SLOTS = 3 as const;

/**
 * The system element's `map` under three slots: the emitted 255/4 body as a
 * method of `ele[#ele]`, the spelling the second probe lit (D-18).
 */
export const mapStandIn = (mapmode: string): string =>
  `ele={{map=function(s)${mapmode} end}}`;

/** Both stand-ins in front of the Setup, or the one the slot count needs. */
export function standIns(mapmode: string | undefined): string {
  return mapmode === undefined
    ? TIM_STAND_IN
    : `${TIM_STAND_IN}${mapStandIn(mapmode)}`;
}

/** An engine running the surface's emitted Lua under the pinned library. */
export async function createSurfaceEngine(
  surface: Surface,
  options: EmitOptions = {},
): Promise<SimEngine> {
  const emitted = emitSurface(surface, {
    ...options,
    slots: options.slots ?? PREVIEW_SLOTS,
  });
  const host = await createLuaHost({
    sim: new PadSim(blankPadState()),
    system: TOUCH_LIBRARY,
    systemTimer: TOUCH_LIBRARY_TIMER,
    setup: standIns(emitted.mapmode) + emitted.setup,
    timer: emitted.timer,
  });
  return new LuaPadSim(host);
}
