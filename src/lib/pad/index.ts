// HANGAR's compile / cost / fit / measure / validate surface.
//
// Every entry point here awaits the FOUND-05 gate as its first statement, so
// nothing HANGAR exposes can observe the un-initialised formatter: no throw
// from the measuring path, and no "not-ready" diagnostic masquerading as a
// syntax error. Nothing else in HANGAR imports the vendored compiler's
// measuring functions directly.
//
// compile() itself does not need the formatter - it emits Lua without ever
// measuring it - but compilePreset and compileState await the gate anyway.
// Every caller of compile in HANGAR immediately costs the result, and one gate
// across the whole surface is a rule that cannot be misapplied.
//
// The simulator is NOT part of this surface and is NOT gated. PadSim takes a
// PadState, never Lua, and renders with the formatter uninitialised; whoever
// needs it imports it straight from the vendored pad-sim module, so the catalog
// never waits on a 628 KB WASM download to draw a frame.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { padReady } from "./ready";
import {
  compile as vendorCompile,
  cost as vendorCost,
  fit as vendorFit,
  fits as vendorFits,
  measure as vendorMeasure,
  validate as vendorValidate,
  type CompileResult,
  type FitPlan,
  type FitStep,
  type PadCost,
  type PadDiagnostic,
  type PadReserved,
  type PadSheet,
  type PadState,
  type PadUserCode,
} from "../../vendor/botor/_pad";
// The nine shelf presets are HANGAR's, not the vendored module's (plan 11-05).
// This re-export is how the rest of HANGAR reaches the shelf, so this one line
// moves five call sites that never name a preset module themselves. The
// vendored PRESETS array is still exported and is still what the two fidelity
// fixtures measure - it is the PORT's gate, not the CATALOG's.
import { PRESETS, presetById } from "../catalog/presets";

export { PRESETS, presetById, padReady };
export type {
  CompileResult,
  FitPlan,
  FitStep,
  PadCost,
  PadDiagnostic,
  PadReserved,
  PadSheet,
  PadState,
  PadUserCode,
};

/** Compiles a shelf preset by id. Throws if the id is not on the shelf. */
export async function compilePreset(
  id: string,
  user?: PadUserCode,
): Promise<CompileResult> {
  await padReady();
  const preset = presetById(id);
  if (!preset) throw new Error(`unknown preset: ${id}`);
  return vendorCompile(preset.state, user);
}

/** Compiles an arbitrary pad state - a tuned preset, once knobs exist. */
export async function compileState(
  state: PadState,
  user?: PadUserCode,
): Promise<CompileResult> {
  await padReady();
  return vendorCompile(state, user);
}

/** Both events' budgets for a compiled result. Measured, never estimated. */
export async function costOf(
  result: CompileResult,
  reserved?: PadReserved,
): Promise<PadCost> {
  await padReady();
  return vendorCost(result, reserved);
}

/** True when both events fit inside the 908-character budget. */
export async function fitsIn(
  result: CompileResult,
  reserved?: PadReserved,
): Promise<boolean> {
  await padReady();
  return vendorFits(result, reserved);
}

/**
 * The fit ladder for a pad state: what the compiler would turn down to stay
 * inside 908, in its own words.
 *
 * `pinned` is the sheet whose knob the visitor's hand is on; the compiler never
 * proposes degrading the thing they just moved (_pad.ts:4093-4095). `reserved`
 * exists for Phase 7's install marker and is what makes the over-budget branch
 * reachable in a test at all - see 05-VALIDATION, the unreachability finding.
 *
 * fit() compiles once per ladder step, so this is N+1 minifier calls. Call it
 * only when cost().fits is false, never on a knob change.
 */
export async function fitState(
  state: PadState,
  options?: { user?: PadUserCode; reserved?: PadReserved; pinned?: PadSheet },
): Promise<FitPlan> {
  await padReady();
  return vendorFit(state, options);
}

/** The minified character cost of one event body. */
export async function measureLua(lua: string): Promise<number> {
  await padReady();
  return vendorMeasure(lua);
}

/** Diagnostics for a compiled result. Never reports a not-ready state. */
export async function validateCompiled(
  result: CompileResult,
  reserved?: PadReserved,
): Promise<PadDiagnostic[]> {
  await padReady();
  return vendorValidate(result, reserved);
}
