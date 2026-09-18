// LuaPadSim: a SimEngine over a LuaHost driving a blank, fully detached PadSim - the Lua half of the
// D-06 route-1c seam. The wrapped PadSim owns every slot as "user", so it contributes nothing but the
// firmware LED engine, and the VM contributes everything a compiled configuration would have;
// src/lib/fidelity/lua-parity.spec.ts proves the two routes are the same engine on the same data.
// Reached ONLY through the dynamic import inside ./engine.ts's createEngine (importing it puts the
// VM's module graph and the glue.wasm URL into the importing chunk). renderLua is a pure string
// function with no VM and no await, so the knob-sweep budget gate can call it thousands of times.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  DEFAULT_PAD_STATE,
  type PadOwnership,
  type PadState,
} from "../../vendor/botor/_pad";
import { PadSim } from "../../vendor/botor/pad-sim";
import { BRIGHTNESS_FULL, scaleLua, sitesFor } from "../catalog/brightness";
import { TOUCH_LIBRARY, TOUCH_LIBRARY_TIMER } from "../catalog/library";
import type { CatalogEntry, LuaKnob } from "../catalog/types";
import { SimEngineError, type SimEngine } from "./engine";
import { createLuaHost, type LuaHost } from "./lua-host";

/** Every slot handed to the user, typed as the vendored PadOwnership so a re-sync that adds a PadSlot stops `npm run check` here. */
const ALL_USER_OWNED: PadOwnership = {
  touchHandler: "user",
  timer: "user",
  layer1: "user",
  layer2: "user",
};

/** The blank, fully detached state: every slot "user"-owned, so sim.tick() is grid_led_tick plus the render and nothing else. */
export function blankPadState(): PadState {
  return { ...DEFAULT_PAD_STATE, owned: { ...ALL_USER_OWNED } };
}

/**
 * Which value of a knob is selected: an explicit override, else the entry's default, else the knob's
 * own; an index outside `values` falls back to the default rather than substituting `undefined` into Lua.
 */
function indexFor(
  knob: LuaKnob,
  knobs: Readonly<Record<string, number>> | undefined,
  defaults: Readonly<Record<string, number>>,
): number {
  const asked = knobs?.[knob.id] ?? defaults[knob.id] ?? knob.default;
  const inRange =
    Number.isInteger(asked) && asked >= 0 && asked < knob.values.length;
  return inRange ? asked : knob.default;
}

/**
 * The D-12 token substitution: for every knob, `knob.token` is replaced with the selected literal in
 * both event strings. Pure. `knobs` maps a knob id to an INDEX into its `values` (D-13).
 * Plain-string `replaceAll`: a token is data, not a pattern.
 */
export function renderLua(
  entry: CatalogEntry,
  knobs?: Readonly<Record<string, number>>,
): { setup: string; timer: string } {
  const source = entry.source;
  if (source.kind !== "lua") {
    throw new SimEngineError(
      `catalog entry "${entry.id}": renderLua needs a "lua" source, got ` +
        `"${source.kind}"`,
    );
  }
  let setup = source.setup;
  let timer = source.timer;
  for (const knob of entry.knobs) {
    const value = knob.values[indexFor(knob, knobs, entry.defaults)];
    setup = setup.replaceAll(knob.token, value);
    timer = timer.replaceAll(knob.token, value);
  }
  return { setup, timer };
}

/**
 * The indices the PREVIEW renders: a knob that declares `previewIndex` is held there whatever the
 * visitor chose, because the browser cannot honour the choice (ORBIT's Sync: no MIDI clock reaches
 * a preview). `renderLua` itself never reads it - the wire and the meters carry the chosen index.
 */
export function previewIndices(
  entry: CatalogEntry,
  knobs?: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> | undefined {
  const held = entry.knobs.filter((knob) => knob.previewIndex !== undefined);
  if (held.length === 0) return knobs;
  const out: Record<string, number> = { ...(knobs ?? {}) };
  for (const knob of held) out[knob.id] = knob.previewIndex as number;
  return out;
}

/** A SimEngine backed by a real Lua 5.4 VM over the vendored LED engine. */
export class LuaPadSim implements SimEngine {
  private readonly host: LuaHost;

  /** Prefer createLuaPadSim: building a host is asynchronous, this is not. */
  constructor(host: LuaHost) {
    this.host = host;
  }

  tick(): void {
    this.host.tick();
  }

  run(n: number): void {
    this.host.run(n);
  }

  /** Firmware page-load semantics without rebuilding the VM; synchronous because SimHost calls it from register(). */
  reset(): void {
    this.host.restart();
  }

  get frame(): Uint8Array {
    return this.host.frame;
  }

  /**
   * Two halves, both load-bearing: `host.animating` (any layer still counting down) alone would report
   * a card with a stored Timer as settled between fires and SimHost would freeze it; `host.timerArmed`
   * is the other half, and an entry with no Timer (MORPH) still settles and costs nothing.
   */
  get animating(): boolean {
    return this.host.animating || this.host.timerArmed;
  }

  get coordMax(): 127 | 1023 {
    return this.host.coordMax;
  }

  get pendingTouches(): number {
    return this.host.pendingTouches;
  }

  touchDown(id: number, x: number, y: number): void {
    this.host.touchDown(id, x, y);
  }

  touchMove(id: number, x: number, y: number): void {
    this.host.touchMove(id, x, y);
  }

  touchUp(id: number, x: number, y: number): void {
    this.host.touchUp(id, x, y);
  }

  touchTap(id: number, x: number, y: number): void {
    this.host.touchTap(id, x, y);
  }

  /** Every Lua error a handler raised, in order; empty is the passing state (D-14's smoke gate). Beyond SimEngine. */
  get errors(): readonly string[] {
    return this.host.errors;
  }

  /** Releases the VM (beyond SimEngine: a suite of nine hosts must not hold nine open). A closed engine must not be ticked. */
  close(): void {
    this.host.close();
  }
}

/**
 * Build a Lua-backed engine for one catalog entry. An empty Timer string means no Timer EVENT (gtt is
 * a no-op until the event holds a stored action, _pad.ts:3908-3916), mapped onto LuaHost's `undefined`.
 * The touch library goes in as the system Setup AND the system Timer (12-07, 12.1-02) for every entry
 * built here - the hand-authored ones; a preset never comes through - as the install path does
 * (`measureLuaRoute` + `land` publish the library). A host given only `TOUCH_LIBRARY` has no `G`,
 * `V`, `N`, `A` or `D` and raises on the first finger. `brightness` (1..255, default 255) scales
 * the rendered colours exactly as the landing does (catalog/brightness.ts), so the VM runs the
 * bytes the module would.
 */
export async function createLuaPadSim(
  entry: CatalogEntry,
  knobs?: Readonly<Record<string, number>>,
  brightness: number = BRIGHTNESS_FULL,
): Promise<LuaPadSim> {
  const rendered = renderLua(entry, previewIndices(entry, knobs));
  const sites = sitesFor(entry.id);
  const setup = scaleLua(rendered.setup, brightness, sites);
  const timer = scaleLua(rendered.timer, brightness, sites);
  const host = await createLuaHost({
    sim: new PadSim(blankPadState()),
    system: TOUCH_LIBRARY,
    systemTimer: TOUCH_LIBRARY_TIMER,
    setup,
    timer: timer.trim() === "" ? undefined : timer,
  });
  return new LuaPadSim(host);
}
