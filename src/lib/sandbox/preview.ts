// The Sandbox's live preview: a Lua-backed engine running the surface the
// visitor built, so Play routes a finger to the same runtime the module would
// run (plan 13-16; PREV-04's third reach; 13-13 asked whether a sandbox
// picture could light once 13-15's Lua existed - this is the answer).
//
// THE SAME HOST, THE SAME LIBRARY, THE SAME STRINGS. `emitSurface` writes the
// Setup and the Timer 13-17 will install; `createLuaHost` runs them over
// TOUCH_LIBRARY and TOUCH_LIBRARY_TIMER exactly as it runs a hand-authored
// entry (lua-pad-sim.ts), and `LuaPadSim` is the SimEngine shape the page's
// SimHost paints and delivers fingers to. What the preview shows is
// therefore the emitted text under the pinned library - not a drawing of
// the regions - which is the only picture that can be honest about a
// button's 0 or a knob's dead zone.
//
// THE ONE STAND-IN, AS runtime.spec.ts USES IT: the touch element's Setup
// closes with `self:tim()`, which on the module is the element's own `tim`
// method (the stored Timer body); the host compiles the Timer as
// `__hangar_timer` and models `tim` for the SYSTEM element only, so the
// touch element's is assigned here in front of the Setup. Under two slots
// (the default until 13-17 flips it) that is the only stand-in; under three
// the Setup also calls `ele[#ele]:map()` and the 255/4 body would need the
// second stand-in the spec builds - this module refuses `slots: 3` rather
// than pretend, because the preview would otherwise run a string the
// module does not hold yet.
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

/** An engine running the surface's emitted Lua under the pinned library. */
export async function createSurfaceEngine(
  surface: Surface,
  options: EmitOptions = {},
): Promise<SimEngine> {
  if (options.slots === 3) {
    throw new Error(
      "the preview runs two slots: 255/4 is not written until 13-17 (preview.ts)",
    );
  }
  const emitted = emitSurface(surface, { ...options, slots: 2 });
  const host = await createLuaHost({
    sim: new PadSim(blankPadState()),
    system: TOUCH_LIBRARY,
    systemTimer: TOUCH_LIBRARY_TIMER,
    setup: TIM_STAND_IN + emitted.setup,
    timer: emitted.timer,
  });
  return new LuaPadSim(host);
}
