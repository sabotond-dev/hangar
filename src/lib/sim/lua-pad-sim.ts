// LuaPadSim: a SimEngine over a LuaHost driving a blank, fully detached PadSim.
//
// This is the Lua half of the D-06 route-1c seam. The wrapped PadSim owns every
// slot as "user", so it contributes nothing but the firmware LED engine -
// grid_led_tick, the weights, the 256-entry sine table, the divide-by-512 - and
// the Lua VM contributes everything a compiled configuration would have. The
// nine-preset parity gate in src/lib/fidelity/lua-parity.spec.ts is what proves
// the two routes are the same engine on the same data.
//
// This module is reached ONLY through the dynamic import inside
// ./engine.ts's createEngine. Importing it puts the VM's module graph - and the
// fingerprinted glue.wasm asset URL in ./ready.ts - into the importing chunk.
// renderLua is deliberately free of all that: it is a pure string function with
// no VM and no await, so plan 08-04's knob-sweep budget gate can call it
// thousands of times without instantiating anything.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  DEFAULT_PAD_STATE,
  type PadOwnership,
  type PadState,
} from "../../vendor/botor/_pad";
import { PadSim } from "../../vendor/botor/pad-sim";
import type { CatalogEntry, LuaKnob } from "../catalog/types";
import { SimEngineError, type SimEngine } from "./engine";
import { createLuaHost, type LuaHost } from "./lua-host";

/**
 * Every slot handed to the user.
 *
 * Typed as the vendored PadOwnership rather than written from memory, so a
 * re-sync that adds a PadSlot stops `npm run check` on this object instead of
 * letting a compiled handler quietly re-attach itself underneath the VM.
 */
const ALL_USER_OWNED: PadOwnership = {
  touchHandler: "user",
  timer: "user",
  layer1: "user",
  layer2: "user",
};

/**
 * The blank, fully detached state the Lua route wraps. With every slot
 * "user"-owned, PadSim.rebuild arms nothing, its timerPeriod stays null and its
 * own FIFO stays empty, so sim.tick() degenerates to grid_led_tick plus the
 * render - which is exactly the half a Lua host wants and nothing else.
 */
export function blankPadState(): PadState {
  return { ...DEFAULT_PAD_STATE, owned: { ...ALL_USER_OWNED } };
}

/**
 * Which value of a knob is selected: an explicit override, else the entry's
 * default, else the knob's own. An index outside the knob's `values` falls back
 * to the knob's default rather than substituting `undefined` into Lua source -
 * a stamp from an older catalog version is untrusted input, and the failure mode
 * of trusting it is a syntactically broken configuration.
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
 * The D-12 token substitution: for every knob, `knob.token` is replaced with the
 * selected literal in both event strings.
 *
 * Pure. No VM, no await, no I/O. `knobs` maps a knob id to an INDEX into that
 * knob's `values` (D-13: integer knob indices), and defaults to `entry.defaults`
 * and then to each knob's own `default`.
 *
 * replaceAll with a PLAIN STRING needle, never a regular expression: a token is
 * catalog-authored data, and a regular expression would turn "@" and every other
 * punctuation character in it into a metacharacter question nobody should have
 * to answer. The plain-string overload replaces every occurrence literally.
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

  /**
   * Firmware page-load semantics without rebuilding the VM: the LED engine is
   * zeroed, every global Setup created is removed, `self` is rebuilt empty and
   * Setup re-runs. Synchronous because SimHost calls it from register() on the
   * reduced-motion path.
   */
  reset(): void {
    this.host.restart();
  }

  get frame(): Uint8Array {
    return this.host.frame;
  }

  /**
   * Two halves, and both are load-bearing.
   *
   * `host.animating` delegates to the wrapped sim: true while any layer is still
   * counting a timeout down. That alone would report a card with a stored Timer
   * as settled between fires, and SimHost uses this field to decide whether to
   * keep the shared rAF loop running - so the row would freeze a live
   * configuration a fraction of a second after Setup.
   *
   * `host.timerArmed` is the other half: an entry with a stored Timer re-arms
   * itself on every fire and therefore never settles, which is correct. MORPH
   * has no Timer at all, so once its trails expire it settles and costs nothing,
   * which is also correct - and is why this is an OR rather than a constant true
   * for every Lua entry.
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

  /**
   * Every Lua error a handler raised, in order. Empty is the passing state, and
   * it is what lets D-14's execution smoke gate assert "no configuration raised"
   * instead of discovering it as a crashed run. Beyond SimEngine on purpose.
   */
  get errors(): readonly string[] {
    return this.host.errors;
  }

  /**
   * Releases the VM. Beyond SimEngine: a test needs it so a suite of nine hosts
   * does not hold nine engines open, and Phase 4 needs it when a card leaves the
   * DOM for good. A closed engine must not be ticked again.
   */
  close(): void {
    this.host.close();
  }
}

/**
 * Build a Lua-backed engine for one catalog entry.
 *
 * An empty Timer string means the entry has no Timer EVENT, which is not the
 * same as a Timer that does nothing: firmware's gtt is a no-op until the Timer
 * event holds at least one stored action (_pad.ts:3908-3916), so an entry that
 * stores nothing there must not be able to arm a timer at all. LuaHost draws
 * that distinction on `undefined` versus `""`, and this is where the catalog's
 * always-a-string shape is mapped onto it.
 */
export async function createLuaPadSim(
  entry: CatalogEntry,
  knobs?: Readonly<Record<string, number>>,
): Promise<LuaPadSim> {
  const { setup, timer } = renderLua(entry, knobs);
  const host = await createLuaHost({
    sim: new PadSim(blankPadState()),
    setup,
    timer: timer.trim() === "" ? undefined : timer,
  });
  return new LuaPadSim(host);
}
