// The Lua VM host: a real Lua 5.4 engine driving the vendored simulator's
// firmware LED engine.
//
// The insight this file rests on (08-RESEARCH, route 1c) is that PadSim is two
// things fused - a TypeScript transcription of what the compiler WOULD emit,
// and the firmware LED engine itself (ledTick transcribed from
// grid_led.c:191-211, weightsOf, shapeIntensity, the 256-entry SINE_LOOKUP,
// the divide-by-512 after the layer sum). The second half is exactly what a Lua
// host needs, it is exactly what src/lib/fidelity/firmware-oracle.spec.ts
// independently pins, and pad-sim.ts already exposes it publicly through
// layer(), pokeLayer(), tick() and frame. So no vendored byte moves: this host
// implements the Grid API a ZONA configuration calls and writes the result
// through pokeLayer alone.
//
// The sim handed in must be blank and fully detached - every PadSlot owned by
// "user" - so that rebuild() arms nothing, its own timerPeriod stays null and
// its own touch FIFO stays empty. sim.tick() then degenerates to exactly
// "grid_led_tick, then render", which is the half this host wants. The host
// keeps its own FIFO and its own timer because the sim's belong to compiled
// handlers that are not attached here.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { CELLS, GRID } from "../../vendor/botor/_pad";
import { glcStops, screenToHw, type PadSim } from "../../vendor/botor/pad-sim";
import { luaReady, type LuaEngine } from "./ready";

/** One recorded midi_send, in the order the configuration issued it. */
export type HostMidi = {
  readonly ch: number;
  readonly cmd: number;
  readonly p1: number;
  readonly p2: number;
  readonly mode: number;
};

export type LuaHostOptions = {
  /**
   * A blank, fully "user"-owned PadSim. The host owns every slot; the sim
   * contributes its LED engine and nothing else.
   */
  sim: PadSim;
  /** Canonical Setup Lua, event marker included. Run exactly once, at create. */
  setup: string;
  /**
   * Canonical Timer Lua, or undefined for an entry with no Timer event. An
   * empty string is a Timer that exists and does nothing, which is not the same
   * thing: firmware's gtt is a no-op until the Timer event holds at least one
   * stored action (_pad.ts:3908-3916), and the host models that distinction.
   */
  timer?: string;
};

// Firmware event codes, as pad-sim.ts documents them. 9 is the fast tap:
// firmware coalesces a sub-cycle press-and-lift into ONE message with no
// separate DOWN or UP. The compiled guards read "contact ended" as
// `e == 3 or e >= 5`, so a config filtering on `e ~= 4 and e ~= 9` is tap-only
// and one filtering on `e == 3 or e >= 5` is lift-only. Both shapes ship.
const EVT_MOVE = 1;
const EVT_DOWN = 4;
const EVT_UP = 5;
const EVT_TAP = 9;

/** The FIFO depth firmware enqueues into, mirrored from PadSim. */
const FIFO_DEPTH = 10;

/** One firmware period. */
const TICK_MS = 10;

/** How many raised Lua errors to keep. A stuck body must not grow without bound. */
const ERROR_LOG_CAP = 20;

type Sample = { i: number; e: number; x: number; y: number };

/**
 * Anything Lua hands a JS callback, reduced to a usable number. Absent
 * arguments arrive as undefined and a non-finite value cannot reach a firmware
 * register, so both become 0.
 */
function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/**
 * The F2Ieq rule. The module builds Lua with LUA_FLOORN2I = F2Ieq, so
 * lua_tointeger on a fractional value FAILS and the C argument conversion
 * yields 0 - it does not round and it does not truncate. glp(a, 1, 127.5)
 * therefore stores phase 0, and a swirl that forgot its `// 1` gives every cell
 * phase 0 and the whole grid breathes in unison.
 *
 * This must be applied in the stub, before pokeLayer: PadSim's wrapU8 THROWS on
 * a non-integer ("non-integer value ${v} reached a uint8 narrowing"), which is
 * the right assertion for a compiler that closes every float with `// 1` and
 * the wrong behaviour for a hand-authored config the firmware would silently
 * zero.
 */
function f2i(v: number): number {
  return Number.isInteger(v) ? v : 0;
}

/**
 * The colour rule: F2Ieq first, then the uint8 narrowing firmware does on
 * assignment. Truncation, never a clamp - 260 becomes 4 and a bright cell turns
 * almost black with no warning, which is why any knob that scales a channel
 * needs a compile-time range check. Phase and index arguments ARE guarded, so
 * off-grid brushes are free; colours are not.
 */
function u8(v: number): number {
  const i = f2i(v);
  return ((i % 256) + 256) % 256;
}

function clampIndex(n: number): number {
  return Math.min(Math.max(n, 0), CELLS - 1);
}

// `self` is the element table every configuration hangs its state off. Its four
// colon-called methods bridge into JS; everything else a config puts on it
// (self.q, self.m, self.h, its own helper methods) is the config's own state
// and the host never touches it.
const SELF_PRELUDE = [
  "self = {}",
  "self.gms = function(s, ch, cmd, p1, p2, mode) __hangar_gms(ch, cmd, p1, p2, mode) end",
  "self.grxm = function(s, slot, mode) grxm(slot, mode) end",
  "self.txma = function(s, v) txma(v) end",
  "self.tyma = function(s, v) tyma(v) end",
].join("\n");

// Reads self.touch_cb at call time and invokes it with self as its first
// parameter, which is the shape every config declares:
// self.touch_cb = function(s, i, e, x, y) ... end
const TOUCH_DISPATCH = [
  "__hangar_touch = function(i, e, x, y)",
  "  local f = self.touch_cb",
  "  if f then f(self, i, e, x, y) end",
  "end",
].join("\n");

export class LuaHost {
  private readonly sim: PadSim;
  private readonly engine: LuaEngine;

  /** The Setup-assigned self.touch_cb, reached through a Lua-side dispatcher. */
  private touchFn:
    | ((i: number, e: number, x: number, y: number) => unknown)
    | undefined;
  /** The Timer body, compiled ONCE at create and invoked as a cached function. */
  private timerFn: (() => unknown) | undefined;
  private hasTimerEvent = false;

  private readonly fifo: Sample[] = [];
  /** Change gate per contact on (x, y, event), exactly as PadSim gates. */
  private readonly gate = new Map<number, Sample>();

  private msClock = 0;
  private _tickCount = 0;
  /**
   * The one-shot timer deadline in host milliseconds, or null when nothing is
   * armed. gtt arms it; a fire consumes it; the body's own gtt is what re-arms.
   */
  private timerDeadline: number | null = null;

  private _coordMax: 127 | 1023 = 127;
  private readonly midiLog: HostMidi[] = [];
  private readonly errorLog: string[] = [];
  private _rxMode: number | undefined;

  private constructor(sim: PadSim, engine: LuaEngine) {
    this.sim = sim;
    this.engine = engine;
  }

  /** Builds the VM, registers the Grid API, compiles the Timer, runs Setup. */
  static async create(opts: LuaHostOptions): Promise<LuaHost> {
    const factory = await luaReady();
    const engine = await factory.createEngine();
    const host = new LuaHost(opts.sim, engine);
    try {
      await host.install(opts.setup, opts.timer);
    } catch (error) {
      // A Setup that raises - a typo calling a function the host does not
      // register is exactly that - must not leak a VM. Nothing else in HANGAR
      // holds a reference to this engine, so if create() does not release it
      // here nobody ever will.
      engine.global.close();
      throw error;
    }
    return host;
  }

  private async install(
    setup: string,
    timer: string | undefined,
  ): Promise<void> {
    this.registerGlobals();

    // `self` is created in LUA, never marshalled in from JS. A configuration
    // assigns arbitrary fields to it (self.q, self.m, self.h, its own methods)
    // and those must be real Lua values living in the VM, not properties of a
    // proxied JS object.
    await this.engine.doString(SELF_PRELUDE);

    // The Timer wrapper is compiled BEFORE Setup runs, because Setup's closing
    // gtt(0, ...) must find a Timer event to arm.
    if (typeof timer === "string") {
      this.hasTimerEvent = true;
      // Compiled ONCE. A configuration's Timer runs at 100 Hz and the smoke
      // gate samples to tick 1009; a per-tick doString would put the Lua parser
      // at the top of the profile instead of the simulation. The `--[[@cb]]`
      // event marker is a Lua BLOCK comment, so wrapping the body in a function
      // is safe - the marker comments itself out and the remaining statements
      // become the function body. `self` resolves as a global inside it, which
      // is exactly how every stored Timer reads it (`local s = self`).
      await this.engine.doString(
        "__hangar_timer = function() " + timer + " end",
      );
      this.timerFn = this.engine.global.get("__hangar_timer") as () => unknown;
    }

    await this.engine.doString(setup);

    // Installed AFTER Setup, so it reads the self.touch_cb Setup assigned. The
    // dispatcher reads the field on every call rather than capturing it, so a
    // configuration that reassigns touch_cb later is honoured.
    await this.engine.doString(TOUCH_DISPATCH);
    this.touchFn = this.engine.global.get("__hangar_touch") as (
      i: number,
      e: number,
      x: number,
      y: number,
    ) => unknown;
  }

  // -------------------------------------------------------------------------
  // The Grid API.
  //
  // Exactly the surface the shipped configurations call, and nothing else. An
  // unlisted call must surface as a Lua "attempt to call a nil value", never as
  // a silent no-op: a typo that does nothing is a card that looks subtly wrong
  // forever, and a typo that raises is a card that fails its gate.

  private registerGlobals(): void {
    const g = this.engine.global;
    g.set("glag", (_slot: unknown, n: unknown) => this.glag(n));
    g.set(
      "glc",
      (
        a: unknown,
        l: unknown,
        r: unknown,
        gr: unknown,
        b: unknown,
        k: unknown,
      ) => this.glc(a, l, r, gr, b, k),
    );
    g.set("glp", (a: unknown, l: unknown, p: unknown) => this.glp(a, l, p));
    g.set("glf", (a: unknown, l: unknown, f: unknown) => this.glf(a, l, f));
    g.set("gls", (a: unknown, l: unknown, s: unknown) => this.gls(a, l, s));
    g.set("glt", (a: unknown, l: unknown, t: unknown) => this.glt(a, l, t));
    g.set(
      "glpfs",
      (a: unknown, l: unknown, p: unknown, f: unknown, s: unknown) =>
        this.glpfs(a, l, p, f, s),
    );
    g.set("glim", (v: unknown, lo: unknown, hi: unknown) =>
      this.glim(v, lo, hi),
    );
    g.set("gtt", (_slot: unknown, ms: unknown) => this.gtt(ms));

    // The self-methods' JS side. gms is bridged under a private name so a bare
    // `gms(...)` still raises - it is only ever called as `self:gms(...)`.
    // grxm, txma and tyma are ALSO plain globals: the recipe book's own
    // configurations call `grxm(0,2)` bare while calling `self:txma(1023)` with
    // a colon, so both spellings are real and both must work.
    g.set(
      "__hangar_gms",
      (ch: unknown, cmd: unknown, p1: unknown, p2: unknown, mode: unknown) =>
        this.gms(ch, cmd, p1, p2, mode),
    );
    g.set("grxm", (_slot: unknown, mode: unknown) => this.grxm(mode));
    g.set("txma", (v: unknown) => this.axisMax(v));
    g.set("tyma", (v: unknown) => this.axisMax(v));
  }

  /**
   * led_address_get: a LOGICAL cell index to the HARDWARE index.
   *
   * This is NOT the identity, and it is the single biggest trap in the phase.
   * The firmware's table (grid_module.c:445-458, transcribed as screenToHw in
   * pad-sim.ts) mirrors EVEN rows: row 0 reads 8,7,6,...,0 and row 1 reads
   * 9,10,...,17. An identity stub moves 40 of the 81 cells to the wrong place
   * and produces a picture that looks plausible and is wrong.
   */
  private glag(n: unknown): number {
    const logical = clampIndex(f2i(num(n)));
    return screenToHw(logical % GRID, Math.floor(logical / GRID));
  }

  private glc(
    a: unknown,
    l: unknown,
    r: unknown,
    g: unknown,
    b: unknown,
    k: unknown,
  ): void {
    const hw = this.addr(a);
    const layer = this.lay(l);
    if (hw === undefined || layer === undefined) return;
    // A nonzero 6th argument forces the minimum stop black
    // (grid_lua_api.c:1082-1092). Absent means 0 means false.
    const forceMinBlack = f2i(num(k)) !== 0;
    this.sim.pokeLayer(
      hw,
      layer,
      glcStops(u8(num(r)), u8(num(g)), u8(num(b)), forceMinBlack),
    );
  }

  private glp(a: unknown, l: unknown, p: unknown): void {
    const hw = this.addr(a);
    const layer = this.lay(l);
    if (hw === undefined || layer === undefined) return;
    this.sim.pokeLayer(hw, layer, { pha: f2i(num(p)) });
  }

  /**
   * led_animation_rate. Rate ONLY: pokeLayer leaves every field the patch does
   * not name alone, so there is no phase reset here. That is what makes an
   * accelerating swirl accelerate instead of restarting.
   */
  private glf(a: unknown, l: unknown, f: unknown): void {
    const hw = this.addr(a);
    const layer = this.lay(l);
    if (hw === undefined || layer === undefined) return;
    this.sim.pokeLayer(hw, layer, { fre: f2i(num(f)) });
  }

  private gls(a: unknown, l: unknown, s: unknown): void {
    const hw = this.addr(a);
    const layer = this.lay(l);
    if (hw === undefined || layer === undefined) return;
    this.sim.pokeLayer(hw, layer, { sha: f2i(num(s)) });
  }

  private glt(a: unknown, l: unknown, t: unknown): void {
    const hw = this.addr(a);
    const layer = this.lay(l);
    if (hw === undefined || layer === undefined) return;
    this.sim.pokeLayer(hw, layer, { timeout: f2i(num(t)) });
  }

  private glpfs(
    a: unknown,
    l: unknown,
    p: unknown,
    f: unknown,
    s: unknown,
  ): void {
    const hw = this.addr(a);
    const layer = this.lay(l);
    if (hw === undefined || layer === undefined) return;
    this.sim.pokeLayer(hw, layer, {
      pha: f2i(num(p)),
      fre: f2i(num(f)),
      sha: f2i(num(s)),
    });
  }

  /** limit(v, lo, hi). Integers in, integer out. */
  private glim(v: unknown, lo: unknown, hi: unknown): number {
    return Math.min(Math.max(f2i(num(v)), f2i(num(lo))), f2i(num(hi)));
  }

  /**
   * timer_start. A ONE-SHOT, as firmware's is: arming sets a deadline, a fire
   * consumes it, and the body's own gtt is the only thing that re-arms. That is
   * why a Timer must open with gtt - the handler runs inside a pcall
   * (grid_lua.c:369), so a re-arm placed at the END dies permanently on the
   * first raise. Modelling the re-arm as automatic (which is what PadSim can
   * afford, because every body the compiler emits is gtt-first by construction)
   * would make that failure mode invisible to a hand-authored config.
   */
  private gtt(ms: unknown): void {
    // gtt is a no-op until the Timer event holds at least one stored action
    // (_pad.ts:3908-3916); an entry with no Timer never arms anything.
    if (!this.hasTimerEvent) return;
    const period = f2i(num(ms));
    if (period <= 0) return;
    this.timerDeadline = this.msClock + period;
  }

  private gms(
    ch: unknown,
    cmd: unknown,
    p1: unknown,
    p2: unknown,
    mode: unknown,
  ): void {
    // Appended in order. Never deduplicated, never sorted: the ORDER is the
    // musical result.
    this.midiLog.push({
      ch: f2i(num(ch)),
      cmd: f2i(num(cmd)),
      p1: f2i(num(p1)),
      p2: f2i(num(p2)),
      mode: f2i(num(mode)),
    });
  }

  /** rx_mode. Recorded; the host has no MIDI input to route, so no behaviour. */
  private grxm(mode: unknown): void {
    this._rxMode = f2i(num(mode));
  }

  /**
   * touch_x_max / touch_y_max. Firmware takes an arbitrary maximum; HANGAR's
   * engine surface types it as 127 | 1023 because those are the only two values
   * any compiled or hand-authored configuration uses, so anything wider than
   * 127 reads as the hi-res range.
   */
  private axisMax(v: unknown): void {
    this._coordMax = f2i(num(v)) > 127 ? 1023 : 127;
  }

  private addr(a: unknown): number | undefined {
    const v = f2i(num(a));
    return v >= 0 && v < CELLS ? v : undefined;
  }

  private lay(l: unknown): 0 | 1 | 2 | undefined {
    const v = f2i(num(l));
    return v === 0 || v === 1 || v === 2 ? v : undefined;
  }

  // -------------------------------------------------------------------------
  // Touch. The host keeps its OWN FIFO rather than delegating to the sim's: the
  // sim's feeds its own compiled handlers, which are all detached here. The
  // rules are the sim's rules - a change gate per contact on (x, y, event), a
  // 10-deep cap with a silent drop when full, and at most one sample popped per
  // tick. A motionless finger therefore produces nothing at all, which is why a
  // held-still comet dot visibly fades.

  touchDown(id: number, x: number, y: number): void {
    this.enqueue(id, EVT_DOWN, x, y);
  }

  touchMove(id: number, x: number, y: number): void {
    this.enqueue(id, EVT_MOVE, x, y);
  }

  touchUp(id: number, x: number, y: number): void {
    this.enqueue(id, EVT_UP, x, y);
  }

  /** A hardware fast tap: one DOWNUP message, no separate DOWN or UP. */
  touchTap(id: number, x: number, y: number): void {
    this.enqueue(id, EVT_TAP, x, y);
  }

  private enqueue(id: number, e: number, x: number, y: number): void {
    const max = this._coordMax;
    const cx = Math.min(Math.max(Math.floor(x), 0), max);
    const cy = Math.min(Math.max(Math.floor(y), 0), max);
    const last = this.gate.get(id);
    if (
      typeof last !== "undefined" &&
      last.e === e &&
      last.x === cx &&
      last.y === cy
    ) {
      return;
    }
    if (this.fifo.length >= FIFO_DEPTH) return;
    const sample: Sample = { i: id, e, x: cx, y: cy };
    this.fifo.push(sample);
    this.gate.set(id, sample);
  }

  // -------------------------------------------------------------------------
  // The tick. PadSim's pinned interleave, with the Lua half where the compiled
  // half would be: pop one touch sample and dispatch it, run the timer if due,
  // then hand over to the sim for grid_led_tick and the render.

  tick(): void {
    const sample = this.fifo.shift();
    if (typeof sample !== "undefined") {
      this.guarded(() =>
        this.touchFn?.(sample.i, sample.e, sample.x, sample.y),
      );
    }

    this.msClock += TICK_MS;
    if (this.timerDeadline !== null && this.msClock >= this.timerDeadline) {
      // Consume the one-shot BEFORE the body runs. The body's opening gtt
      // re-arms it; a body that raises before re-arming stops for good, which
      // is the firmware behaviour a hand-authored Timer has to respect.
      this.timerDeadline = null;
      this.guarded(() => this.timerFn?.());
    }

    // The sim's own FIFO is empty and its own timer is null because every slot
    // is "user"-owned, so this is grid_led_tick plus the render and nothing
    // more.
    this.sim.tick();
    this._tickCount += 1;
  }

  run(n: number): void {
    for (let i = 0; i < n; i++) this.tick();
  }

  /**
   * Firmware runs every handler inside a pcall (grid_lua.c:369): a raise stops
   * that one call and nothing else. Recording rather than rethrowing is what
   * lets the execution smoke gate assert "no configuration raised" instead of
   * discovering it as a crashed test run.
   */
  private guarded(fn: () => unknown): void {
    try {
      fn();
    } catch (error) {
      if (this.errorLog.length < ERROR_LOG_CAP) {
        this.errorLog.push(
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  // -------------------------------------------------------------------------
  // Observation.

  /** Every midi_send the configuration issued, in order. */
  get midi(): readonly HostMidi[] {
    return this.midiLog;
  }

  /** Every Lua error a handler raised, in order. Empty is the passing state. */
  get errors(): readonly string[] {
    return this.errorLog;
  }

  /** The mode the configuration asked for with grxm, or undefined. */
  get rxMode(): number | undefined {
    return this._rxMode;
  }

  get coordMax(): 127 | 1023 {
    return this._coordMax;
  }

  get pendingTouches(): number {
    return this.fifo.length;
  }

  get timerArmed(): boolean {
    return this.timerDeadline !== null;
  }

  get tickCount(): number {
    return this._tickCount;
  }

  /** 243 bytes, screen order, RGB - the vendored engine's own render. */
  get frame(): Uint8Array {
    return this.sim.frame;
  }

  get animating(): boolean {
    return this.sim.animating;
  }

  /** Releases the VM. A closed host must not be ticked again. */
  close(): void {
    this.engine.global.close();
  }
}

/** The documented spelling. LuaHost.create is the same call. */
export function createLuaHost(opts: LuaHostOptions): Promise<LuaHost> {
  return LuaHost.create(opts);
}
