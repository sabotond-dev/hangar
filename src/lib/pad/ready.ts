// The FOUND-05 gate.
//
// GridScript.compressScript throws when the WASM Lua formatter has not
// initialised, and GridScript.checkSyntax merely returns false - so a caller
// that measured before initialisation would either crash or, worse, report a
// correct config as syntactically broken. Every HANGAR entry point that
// compiles, costs, fits, measures or validates awaits this promise first.
//
// PadSim is deliberately NOT behind this gate: it takes a PadState, never Lua,
// and works with the formatter uninitialised. Gating it would make the catalog
// wait on a 628 KB WASM download for a picture that does not need it.
//
// Nothing awaits this at boot either. The gate hangs off the compile surface
// rather than off the app root, so the catalog paints without fetching the
// WASM at all; what a page shows while a first cost resolves is Phase 4's
// concern.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { initLuaFormatter } from "@intechstudio/grid-protocol";
import { padCompilerReady } from "../../vendor/botor/_pad";

let gate: Promise<void> | undefined;

/** Resolves once the Lua formatter WASM is initialised. Memoised: every caller awaits one load. */
export function padReady(): Promise<void> {
  gate ??= (async () => {
    await initLuaFormatter();
    // The vendored compiler keeps its own memoised flag; awaiting it here is
    // what makes assertPadCompilerReady() take the fast path afterwards
    // instead of falling back to checkSyntax and logging.
    await padCompilerReady();
  })();
  return gate;
}

/** Test-only. Drops the memo so a spec can observe the pre-init branch. Never call this from app code. */
export function resetPadReadyForTests(): void {
  gate = undefined;
}
