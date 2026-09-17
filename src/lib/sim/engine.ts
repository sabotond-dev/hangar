// One engine surface for both routes, and the one factory that picks between them: a ported shelf
// entry is driven by the vendored PadSim, a hand-authored entry by a real Lua 5.4 VM over the same
// vendored LED engine (D-06, route 1c); SimEngine is the surface both satisfy, and the row picks one
// by entry.preview. setState is NOT on the surface (the D-08 amendment at 08-03): the two engines
// take incompatible state, so a state change constructs a NEW engine through createEngine (a PadSim
// rebuild costs microseconds; the VM side needs a fresh VM anyway). A preview kind with no engine is
// skipped by the row (a named SimEngineError), never crashed on. The Lua branch is reached only
// through a dynamic import: a static one would put the VM's module graph and the glue.wasm URL into
// every consumer's chunk, and the production-build e2e asserts a cold load fetches no VM WebAssembly.
// Decided at 08-03 (08-CONTEXT D-06, D-08); see .planning/phases/08-new-configurations/08-03-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { presetById } from "../catalog/presets";
import { PadSim } from "../../vendor/botor/pad-sim";
import { BRIGHTNESS_FULL, scaleChannel } from "../catalog/brightness";
import type { CatalogEntry } from "../catalog/types";

/**
 * Everything src/lib/sim/host.ts calls on a pad, plus touchTap (firmware coalesces a sub-cycle
 * press-and-lift into ONE event 9, and a configuration filtering on that shape needs it).
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

/** Structural proof that the vendored simulator satisfies the interface: a re-sync that renames a member stops `npm run check` on THIS line. */
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
 * The engine for one catalog entry. `knobs` maps a knob id to an INDEX into its `values` (default
 * `entry.defaults`) and is used only by the Lua route: a padsim entry's compiler knobs move a
 * PadState and are deliberately IGNORED here. `brightness` (1..255, default 255) reaches the Lua
 * route as the scaled bytes the module would run and a PadSim through `dimmed`. Throws
 * SimEngineError; a row catches and skips (D-08).
 */
export async function createEngine(
  entry: CatalogEntry,
  knobs?: Readonly<Record<string, number>>,
  brightness: number = BRIGHTNESS_FULL,
): Promise<SimEngine> {
  if (entry.preview === "lua") {
    // DYNAMIC, never static. See the module comment.
    const { createLuaPadSim } = await import("./lua-pad-sim");
    return await createLuaPadSim(entry, knobs, brightness);
  }
  // Built synchronously inside the async function: nine ported pads are one microtask, not nine.
  return dimmed(padSimFor(entry), brightness);
}

/**
 * A PadSim's preview at a brightness: the same engine, its rendered frame scaled byte for byte by
 * the landing's channel rule. The wire scales the colours the compiler emits and the firmware's
 * mix is linear in them, so the frame's scale is the wire's within a unit per channel; the Lua
 * route needs none of this (it runs the scaled bytes). At 255 the engine itself is returned.
 */
export function dimmed(engine: SimEngine, brightness: number): SimEngine {
  if (brightness === BRIGHTNESS_FULL) return engine;
  return new DimmedEngine(engine, brightness);
}

class DimmedEngine implements SimEngine {
  private readonly inner: SimEngine;
  private readonly brightness: number;
  private readonly scaled: Uint8Array;

  // Plain fields, never parameter properties: the gate's harness runs this
  // file under Node's type stripping, which erases annotations only.
  constructor(inner: SimEngine, brightness: number) {
    this.inner = inner;
    this.brightness = brightness;
    this.scaled = new Uint8Array(inner.frame.length);
  }

  tick(): void {
    this.inner.tick();
  }

  run(n: number): void {
    this.inner.run(n);
  }

  reset(): void {
    this.inner.reset();
  }

  get frame(): Uint8Array {
    const source = this.inner.frame;
    for (let i = 0; i < source.length; i += 1) {
      this.scaled[i] = scaleChannel(source[i], this.brightness);
    }
    return this.scaled;
  }

  get animating(): boolean {
    return this.inner.animating;
  }

  get coordMax(): 127 | 1023 {
    return this.inner.coordMax;
  }

  get pendingTouches(): number {
    return this.inner.pendingTouches;
  }

  touchDown(id: number, x: number, y: number): void {
    this.inner.touchDown(id, x, y);
  }

  touchMove(id: number, x: number, y: number): void {
    this.inner.touchMove(id, x, y);
  }

  touchUp(id: number, x: number, y: number): void {
    this.inner.touchUp(id, x, y);
  }

  touchTap(id: number, x: number, y: number): void {
    this.inner.touchTap(id, x, y);
  }
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
  // previewFor() cannot produce this pairing: an entry set `preview` by hand and got it wrong.
  throw new SimEngineError(
    `catalog entry "${entry.id}": preview "padsim" over source kind ` +
      `"${source.kind}"`,
  );
}
