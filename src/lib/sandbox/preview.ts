// The Sandbox's live preview: a Lua-backed engine running the surface the
// visitor built, so Play routes a finger to the same runtime the module would
// run (plan 13-16; PREV-04's third reach; 13-13 asked whether a sandbox
// picture could light once 13-15's Lua existed - this is the answer).
//
// THE SAME HOST, THE SAME LIBRARY, THE SAME STRINGS. `emitSurface` writes the
// Setup, the Timer and - under three slots - the 255/4 body that 13-17
// installs; `createLuaHost` runs them over TOUCH_LIBRARY and
// TOUCH_LIBRARY_TIMER exactly as it runs a hand-authored entry
// (lua-pad-sim.ts), and `LuaPadSim` is the SimEngine shape the page's SimHost
// paints and delivers fingers to. What the preview shows is therefore the
// emitted text under the pinned library - not a drawing of the regions -
// which is the only picture that can be honest about a button's 0 or a
// knob's dead zone.
//
// THE TWO STAND-INS, AS runtime.spec.ts USES THEM: the touch element's Setup
// closes with `self:tim()`, which on the module is the element's own `tim`
// method (the stored Timer body); the host compiles the Timer as
// `__hangar_timer` and models `tim` for the SYSTEM element only, so the touch
// element's is assigned here in front of the Setup. Under three slots - the
// default since 13-17, when HANGAR started writing 255/4 (D-18, D-19) - the
// Setup also calls `ele[#ele]:map()`, the system element's utility method,
// which on the module is the stored 255/4 body; the host models no `map`, so
// the emitted 255/4 body is assigned as a method of `ele[#ele]` in front of
// the Setup too, exactly as runtime.spec.ts's `standIns` does. Until 13-17
// this module refused `slots: 3` because the preview would have run a string
// the module did not hold; the module holds it now, on the same install
// that lands the other four.
//
// REACHED ONLY THROUGH await import(): this module pulls the Lua host and,
// through it, wasmoon's glue.wasm into its chunk (ready.ts), and the Sandbox
// route must paint its plate before a visitor has touched Play.
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
