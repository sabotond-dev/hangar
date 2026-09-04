// One engine surface for both routes, and the one factory that picks between
// them.
//
// HANGAR previews a configuration in exactly two ways. A ported shelf entry is
// driven by the vendored PadSim, which is BOTOR's own TypeScript transcription
// of what its compiler emits. A hand-authored entry is driven by a real Lua 5.4
// VM over the same vendored LED engine (D-06, route 1c). SimEngine is the
// surface both satisfy, so the row picks one by entry.preview and changes
// nothing else.
//
// WHY setState IS NOT HERE (the D-08 amendment, made at 08-03 plan check and
// written down so nobody re-litigates it).
//
// 08-CONTEXT D-08 lists the surface the Lua host must implement as tick, frame,
// animating, touchDown/Move/Up, setState, coordMax, pendingTouches. SimEngine
// takes all of those EXCEPT setState. The two engines take incompatible state:
// setState means "here is a new PadState", which is meaningless for a
// hand-authored Lua entry whose state change is a knob INDEX moving and whose
// rebuild is a re-render of the template plus a fresh VM. Widening setState to
// a union neither engine can implement honestly would be worse than the
// alternative, so the uniform answer to a state change is: CONSTRUCT A NEW
// ENGINE through createEngine. PadSim's own comment prices that -
// "at 243 layer structs a full rebuild costs microseconds and buys
// equivalence" (pad-sim.ts, rebuild) - and the VM side is a fresh VM, which is
// what a knob change needs anyway because the substituted Lua text differs.
//
// D-08's intent is preserved exactly: the card component picks an engine by
// entry.preview and changes nothing else. Only the mechanism for a state change
// moves from a method to a constructor. A preview kind with no engine is SKIPPED
// by the row (createEngine throws a named error and the caller reports the id),
// never crashed on.
//
// THE LUA BRANCH IS REACHED ONLY THROUGH A DYNAMIC IMPORT. A static import of
// ./lua-pad-sim would put the Lua VM's module graph - and with it the
// fingerprinted glue.wasm URL - into the chunk of every consumer of this file,
// including a catalog page of nothing but ported entries. The production-build
// e2e asserts that a cold load fetches no VM WebAssembly at all, and this is
// the line that makes it true.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { presetById } from "../../vendor/botor/_pad";
import { PadSim } from "../../vendor/botor/pad-sim";
import type { CatalogEntry } from "../catalog/types";

/**
 * Everything src/lib/sim/host.ts calls on a pad, plus touchTap.
 *
 * Derived from a real consumer rather than invented: SimHost's HostEngine is
 * this list minus touchTap, and PadSim's own members are what both are read
 * from. touchTap is here because firmware coalesces a sub-cycle press-and-lift
 * into ONE event 9 with no separate DOWN or UP, and a configuration that
 * filters on that shape has nothing to respond to without it.
 */
export interface SimEngine {
  tick(): void;
  run(n: number): void;
  /** Firmware page-load semantics: back to the state right after Setup. */
  reset(): void;
  /** 243 bytes, screen order, RGB. */
  readonly frame: Uint8Array;
  /** True while anything is still counting down or still to fire. */
  readonly animating: boolean;
  readonly coordMax: 127 | 1023;
  readonly pendingTouches: number;
  touchDown(id: number, x: number, y: number): void;
  touchMove(id: number, x: number, y: number): void;
  touchUp(id: number, x: number, y: number): void;
  touchTap(id: number, x: number, y: number): void;
}

/**
 * Structural proof that the vendored simulator already satisfies the interface.
 *
 * This is a compile-time assertion, not decoration. If a future vendored
 * re-sync renames pendingTouches or changes coordMax's type, `npm run check`
 * names THIS line - before Phase 4 discovers it in a browser, and before a
 * spec that only exercises one engine goes green on a broken other one.
 */
const _padSimIsASimEngine: (s: PadSim) => SimEngine = (s) => s;
void _padSimIsASimEngine;

/** Raised when a catalog entry cannot be turned into an engine. */
export class SimEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SimEngineError";
  }
}

/**
 * The engine for one catalog entry.
 *
 * `knobs` maps a knob id to an INDEX into that knob's `values`, and defaults to
 * `entry.defaults`. It is used only by the Lua route: a padsim entry's knobs are
 * compiler knobs, which move a PadState and belong to Phase 5's tune panel, so
 * they are deliberately IGNORED here rather than silently half-applied.
 *
 * Throws SimEngineError for an entry no engine can be built for. Callers that
 * render a list - the coverflow row - catch it and skip the entry (D-08 as
 * amended); they must never let one bad entry blank the row.
 */
export async function createEngine(
  entry: CatalogEntry,
  knobs?: Readonly<Record<string, number>>,
): Promise<SimEngine> {
  if (entry.preview === "lua") {
    // DYNAMIC, never static. See the module comment.
    const { createLuaPadSim } = await import("./lua-pad-sim");
    return await createLuaPadSim(entry, knobs);
  }
  // Built synchronously inside the async function: a ported entry costs one
  // constructor and no await, and awaiting nothing is what keeps a row of nine
  // ported pads a single microtask rather than nine.
  return padSimFor(entry);
}

function padSimFor(entry: CatalogEntry): PadSim {
  const source = entry.source;
  if (source.kind === "preset") {
    const preset = presetById(source.presetId);
    if (preset === undefined) {
      throw new SimEngineError(
        `catalog entry "${entry.id}": the vendored shelf has no preset ` +
          `"${source.presetId}"`,
      );
    }
    return new PadSim(preset.state);
  }
  if (source.kind === "state") return new PadSim(source.state);
  // previewFor() cannot produce this pairing, so reaching it means an entry
  // set `preview` by hand and got it wrong. Naming both halves is what makes
  // that a one-line diagnosis.
  throw new SimEngineError(
    `catalog entry "${entry.id}": preview "padsim" over source kind ` +
      `"${source.kind}"`,
  );
}
