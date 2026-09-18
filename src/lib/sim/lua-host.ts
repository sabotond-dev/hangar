// The Lua VM host: a real Lua 5.4 engine driving the vendored simulator's firmware LED engine
// (08-RESEARCH route 1c). PadSim is two things fused - a transcription of what the compiler would
// emit, and the firmware LED engine itself (ledTick from grid_led.c:191-211, weightsOf, shapeIntensity,
// SINE_LOOKUP, the divide-by-512), which pad-sim.ts exposes through layer(), pokeLayer(), tick() and
// frame - so no vendored byte moves: this host implements the Grid API a ZONA configuration calls and
// writes the result through pokeLayer alone. The sim handed in must be blank and fully detached (every
// PadSlot owned by "user"), so sim.tick() degenerates to grid_led_tick plus the render; the host keeps
// its own touch FIFO and its own one-shot timer. Owns HOST_GLOBALS and HOST_SELF_METHODS, the whole
// surface a hand-authored entry may call (host-surface.spec.ts refuses every call outside them).
// Decided at 08-02 / 12-07 / 12.1-07; see .planning/phases/12.1-gradient-touch/12.1-07-SUMMARY.md
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

/**
 * One recorded HID output, in the order the configuration issued it: the compiler's other three
 * out-calls (`gmms`, `gmbs`, `gks`; _pad.ts OUT_CALLS), recorded and nothing more - they must EXIST
 * because tpad's compiled Setup opens with a bare `gmbs(3,0)`.
 */
export type HostHid = {
  readonly call: "gmms" | "gmbs" | "gks";
  readonly args: readonly number[];
};

/**
 * One recorded sysex message, in the order the configuration issued it: a variable-length run of
 * bytes, so a third log rather than a widened `HostHid` or `HostMidi`; no `call` discriminant because
 * `gmss` is the only sysex emitter in the Grid table (`ZONA_REFERENCE.md:1249-1250`,
 * `grid_lua_api.c:2220-2221`). `bytes` is what was ASKED for, never narrowed to seven bits (`recordSysex`).
 */
export type HostSysex = {
  readonly bytes: readonly number[];
};

export type LuaHostOptions = {
  /** A blank, fully "user"-owned PadSim: the host owns every slot; the sim contributes its LED engine. */
  sim: PadSim;
  /** Canonical Setup Lua, event marker included. Run exactly once, at create. */
  setup: string;
  /**
   * The SYSTEM element's Setup (255/0) - HANGAR's touch library for a hand-authored entry, absent for
   * a preset. Run before `setup`, as the firmware does in both senses: `init.lua:46-50` runs
   * `ele[#ele]:post_init_cb()` first on a page load, and `grid_decode.c:1283-1288` runs a written body
   * immediately (why the install store writes 255/0 before 0/0). Runs AFTER the pristine snapshot -
   * Pitfall 3, see `install()` and `restart()`.
   */
  system?: string;
  /**
   * The SYSTEM element's Timer (255/6) - the library's second half since 12.1: the painters and the
   * senders (`V G Z Y K A D`), while `system` holds state and the map (`U W E Q X N`). On the module
   * 255/6 is written FIRST (`grid_decode.c:1286-1287`) and 255/0 closes with `self:tim()`, so this host
   * installs `systemTimer` as the `tim` method of a stand-in `self` and then runs `system`; both run
   * after the snapshot, before `setup`, and again on every `restart()` (`B`, the block-by-contact table,
   * is per-contact state a remount must not inherit). Absent with `system` present, `tim` is a no-op
   * (the firmware default `--[[@cb]]print("tick")` defines nothing) and the first `G(` raises into
   * `errors` - the loud failure lua-host.spec.ts pins.
   */
  systemTimer?: string;
  /**
   * Canonical Timer Lua, or undefined for an entry with no Timer event. An empty string is a Timer that
   * exists and does nothing: gtt is a no-op until the event holds a stored action (_pad.ts:3908-3916).
   */
  timer?: string;
};

// Firmware event codes, as pad-sim.ts documents them. 9 is the fast tap: a sub-cycle press-and-lift
// coalesced into ONE message; "contact ended" reads `e == 3 or e >= 5`.
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

/** Anything Lua hands a JS callback, as a usable number: undefined and non-finite both become 0. */
function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/**
 * The F2Ieq rule: the module builds Lua with LUA_FLOORN2I = F2Ieq, so a fractional value converts to
 * 0 - no round, no truncation - and glp(a, 1, 127.5) stores phase 0. Applied before pokeLayer, whose
 * wrapU8 THROWS on a non-integer (right for the compiler, wrong for a hand-authored config).
 */
function f2i(v: number): number {
  return Number.isInteger(v) ? v : 0;
}

/**
 * The colour rule: F2Ieq, then firmware's uint8 narrowing on assignment - truncation, never a clamp
 * (260 becomes 4). Phase and index arguments are guarded; colours are not.
 */
function u8(v: number): number {
  const i = f2i(v);
  return ((i % 256) + 256) % 256;
}

function clampIndex(n: number): number {
  return Math.min(Math.max(n, 0), CELLS - 1);
}

/**
 * Every Grid name a hand-authored entry may call BARE, and nothing else. registerGlobals() iterates
 * it; host-surface.spec.ts refuses any call outside it and cross-checks it against a booted VM's _G.
 * gms is ABSENT (bridged under a private name, so a bare gms(...) raises); gmms, gmbs, gks are PRESENT
 * (tpad's Setup opens with a bare gmbs(3,0)); gmss is PRESENT because firmware gives it no `self:`
 * form (`ZONA_REFERENCE.md:2022`).
 */
export const HOST_GLOBALS = [
  "glag",
  "glc",
  "glp",
  "glf",
  "gls",
  "glt",
  "glpfs",
  "glim",
  "gtt",
  "grxm",
  "txma",
  "tyma",
  "gmms",
  "gmbs",
  "gks",
  "gmss",
] as const;

/** Every name reachable only as self:<name>(...). */
export const HOST_SELF_METHODS = [
  "gms",
  "grxm",
  "txma",
  "tyma",
  "touch_pop",
  "tid",
  "tev",
  "txv",
  "tyv",
] as const;

/** One bare Grid call, as the VM sees it: everything in, anything out. */
type HostBinding = (...args: unknown[]) => unknown;

// `self` is the element table every configuration hangs its state off; its colon-called methods bridge
// into JS, everything else on it is the config's own. touch_pop / tid / tev / txv / tyv are firmware's
// touch QUEUE accessors, which the compiled trackpad handler drains its backlog with (_pad.ts:2259).
// HOST_SELF_METHODS restates what this prelude installs; lua-host.spec.ts and host-surface.spec.ts hold the two together.
const SELF_PRELUDE = [
  "self = {}",
  "self.gms = function(s, ch, cmd, p1, p2, mode) __hangar_gms(ch, cmd, p1, p2, mode) end",
  "self.grxm = function(s, slot, mode) grxm(slot, mode) end",
  "self.txma = function(s, v) txma(v) end",
  "self.tyma = function(s, v) tyma(v) end",
  "self.touch_pop = function(s) return __hangar_tpop() end",
  "self.tid = function(s) return __hangar_tfield(0) end",
  "self.tev = function(s) return __hangar_tfield(1) end",
  "self.txv = function(s) return __hangar_tfield(2) end",
  "self.tyv = function(s) return __hangar_tfield(3) end",
].join("\n");

// Reads self.touch_cb at call time and invokes it with self first: `self.touch_cb = function(s, i, e, x, y) ... end`.
const TOUCH_DISPATCH = [
  "__hangar_touch = function(i, e, x, y)",
  "  local f = self.touch_cb",
  "  if f then f(self, i, e, x, y) end",
  "end",
].join("\n");

// restart()'s two halves: the snapshot runs once, after the Grid API and the prelude and BEFORE Setup,
// so every key it records is the host's; the wipe removes everything added afterwards (clearing a
// field while traversing with pairs() is permitted in Lua; only adding one is undefined). After it
// _G holds exactly the keys it held before Setup first ran, and `self` is a new empty table.
const PRISTINE_SNAPSHOT = [
  "__hangar_pristine = {}",
  "for k in pairs(_G) do __hangar_pristine[k] = true end",
].join("\n");

const RESTART_WIPE =
  "for k in pairs(_G) do if not __hangar_pristine[k] then _G[k] = nil end end";

export class LuaHost {
  private readonly sim: PadSim;
  private readonly engine: LuaEngine;
  /** Kept so restart() can re-run Setup without rebuilding the VM. */
  private setupSource = "";
  /** Its twin: the system Setup, re-run on every restart for the same reason. */
  private systemSource: string | undefined;
  /** And the system Timer, run as `self.tim` before the system Setup each time. */
  private systemTimerSource: string | undefined;

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
  /** The sample tid/tev/txv/tyv read: whatever tick() or touch_pop() last took. */
  private current: Sample | undefined;

  private msClock = 0;
  private _tickCount = 0;
  /** The one-shot deadline in host ms, or null: gtt arms it, a fire consumes it, the body's own gtt re-arms. */
  private timerDeadline: number | null = null;

  private _coordMax: 127 | 1023 = 127;
  private readonly midiLog: HostMidi[] = [];
  private readonly hidLog: HostHid[] = [];
  private readonly sysexLog: HostSysex[] = [];
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
      await host.install(opts.setup, opts.timer, opts.system, opts.systemTimer);
    } catch (error) {
      // A Setup that raises must not leak a VM: nothing else holds a reference to this engine.
      engine.global.close();
      throw error;
    }
    return host;
  }

  private async install(
    setup: string,
    timer: string | undefined,
    system: string | undefined,
    systemTimer: string | undefined,
  ): Promise<void> {
    this.setupSource = setup;
    this.systemSource = system;
    this.systemTimerSource = systemTimer;
    this.registerGlobals();

    // `self` is created in LUA, never marshalled in from JS: a configuration's fields on it must be real Lua values.
    await this.engine.doString(SELF_PRELUDE);

    // The Timer wrapper is compiled BEFORE Setup runs, because Setup's closing
    // gtt(0, ...) must find a Timer event to arm.
    if (typeof timer === "string") {
      this.hasTimerEvent = true;
      // Compiled ONCE: a Timer runs at 100 Hz and a per-tick doString would put the parser at the top of
      // the profile. The `--[[@cb]]` marker is a block comment, so wrapping the body in a function is
      // safe; `self` resolves as a global inside it, as every stored Timer reads it.
      await this.engine.doString(
        "__hangar_timer = function() " + timer + " end",
      );
      this.timerFn = this.engine.global.get("__hangar_timer") as () => unknown;
    }

    // Everything in _G at THIS moment is the host's own furniture. Recorded
    // before Setup runs so restart() can tell the two apart.
    await this.engine.doString(PRISTINE_SNAPSHOT);

    // The system pair runs AFTER the snapshot and BEFORE Setup (Pitfall 3): before Setup because that is
    // the firmware's order (LuaHostOptions.system); after the snapshot because the library's globals
    // and per-contact tables are not the host's furniture - kept on the pristine side they would survive
    // RESTART_WIPE and a remounted card would inherit the last mount's `H[i]`. The Timer first, as the
    // `tim` method the Setup's closing `self:tim()` reaches (systemPair()).
    const pair = this.systemPair();
    if (pair !== undefined) await this.engine.doString(pair);

    await this.engine.doString(setup);

    // Installed AFTER Setup, so it reads the self.touch_cb Setup assigned; read on every call, so a later reassignment is honoured.
    await this.engine.doString(TOUCH_DISPATCH);
    this.touchFn = this.readTouchFn();
  }

  /**
   * The system element's two strings as ONE Lua chunk in the module's order, or undefined when the host
   * was given neither. `self` is saved, replaced by a stand-in whose `tim` wraps the 255/6 body, and
   * restored, so nothing the pair does leaks into the touch element's `self`; every `function G(` form
   * inside defines a plain global, as on the module (`grid_ui.c:370-383`). `systemTimer` absent: `tim` is
   * a no-op. `system` absent: the Timer body runs once through `self:tim()` anyway (`grid_decode.c:1286-1287`).
   */
  private systemPair(): string | undefined {
    const system = this.systemSource;
    const timer = this.systemTimerSource;
    if (typeof system !== "string" && typeof timer !== "string") {
      return undefined;
    }
    return [
      "local __hangar_self = self",
      "self = { tim = function(s) " + (timer ?? "") + " end }",
      typeof system === "string" ? system : "self:tim()",
      "self = __hangar_self",
    ].join("\n");
  }

  private readTouchFn(): (
    i: number,
    e: number,
    x: number,
    y: number,
  ) => unknown {
    return this.engine.global.get("__hangar_touch") as (
      i: number,
      e: number,
      x: number,
      y: number,
    ) => unknown;
  }

  /**
   * Firmware page-load semantics in the VM this host owns: grid_led_reset's half is PadSim.reset(); this
   * adds the Lua half - every global Setup created is removed, `self` is rebuilt empty, Setup re-runs
   * and the touch dispatcher is reinstalled. SYNCHRONOUS because sim/host.ts calls SimEngine.reset()
   * from register() on the reduced-motion path; the Timer wrapper is not recompiled (it resolves `self`
   * at call time). Setup re-runs under the same pcall discipline as any handler (grid_lua.c:369).
   */
  restart(): void {
    // Host state first, so a Setup that calls txma or gtt writes into a clean slate.
    this.fifo.length = 0;
    this.gate.clear();
    this.current = undefined;
    this.msClock = 0;
    this._tickCount = 0;
    this.timerDeadline = null;
    this._coordMax = 127;
    this._rxMode = undefined;
    this.midiLog.length = 0;
    this.hidLog.length = 0;
    this.sysexLog.length = 0;
    this.errorLog.length = 0;
    this.sim.reset();

    this.guarded(() => {
      this.engine.doStringSync(RESTART_WIPE);
      // The wipe removed the library with everything else, so it is rebuilt here - before Setup, as at
      // install (a library function that needs the touch element takes it as a parameter, `Q(s, ...)`:
      // the system element's own self carries no touch accessors, `grid_ui_system.c:9-15`). H, T, C, P
      // and B come back EMPTY, which is the whole of Pitfall 3.
      const pair = this.systemPair();
      if (pair !== undefined) this.engine.doStringSync(pair);
      this.engine.doStringSync(SELF_PRELUDE);
      this.engine.doStringSync(this.setupSource);
      this.engine.doStringSync(TOUCH_DISPATCH);
      this.touchFn = this.readTouchFn();
    });
  }

  /** The keys in the VM's global table. Test-facing: proves restart() restored a clean _G. */
  globalKeys(): readonly string[] {
    const keys = this.engine.doStringSync(
      "local t = {} for k in pairs(_G) do t[#t+1] = tostring(k) end return t",
    ) as unknown;
    return Array.isArray(keys) ? (keys as string[]) : [];
  }

  /**
   * How many entries one GLOBAL TABLE holds, or undefined when it is not a table. Test-facing (12-07):
   * the library's contract across a remount is "H IS EMPTY", which `globalKeys()` cannot see. Counted
   * with `pairs`, as the library's own loops walk it.
   */
  globalSize(name: string): number | undefined {
    const value = this.engine.doStringSync(
      `local t = _G[${JSON.stringify(name)}] ` +
        'if type(t) ~= "table" then return nil end ' +
        "local n = 0 for _ in pairs(t) do n = n + 1 end return n",
    ) as unknown;
    return typeof value === "number" ? value : undefined;
  }

  /**
   * One NUMERIC field of the VM's `self` table, or undefined. Test-facing (12-05): a configuration's
   * internal state is sometimes the only honest observable (ARC's stopped swirl must go on tracking the
   * drag). Numbers only: a general marshaller would invite assertions about object identity across the VM boundary.
   */
  selfNumber(field: string): number | undefined {
    const value = this.engine.doStringSync(
      `local v = self[${JSON.stringify(field)}] ` +
        'if type(v) ~= "number" then return nil end return v',
    ) as unknown;
    return typeof value === "number" ? value : undefined;
  }

  // -------------------------------------------------------------------------
  // The Grid API: exactly the surface the shipped configurations call. An unlisted call must surface
  // as a Lua "attempt to call a nil value", never as a silent no-op.

  private registerGlobals(): void {
    const g = this.engine.global;

    // The registration is the list: keyed by HOST_GLOBALS, so a name without a binding or a binding
    // without a name fails the build. grxm, txma and tyma appear here AND in HOST_SELF_METHODS: the
    // recipe book calls `grxm(0,2)` bare and `self:txma(1023)` with a colon. gmms, gmbs and gks are
    // recorded and inert, variadic on purpose (the symbol must resolve and the call be observable).
    // gmss is a fourth out-call the compiler's OUT_CALLS does not know (`_pad.ts:3563`); a hand-authored
    // entry can send sysex, and `gmss` takes two or more arguments, one payload byte each.
    const bindings: Record<(typeof HOST_GLOBALS)[number], HostBinding> = {
      glag: (_slot: unknown, n: unknown) => this.glag(n),
      glc: (
        a: unknown,
        l: unknown,
        r: unknown,
        gr: unknown,
        b: unknown,
        k: unknown,
      ) => this.glc(a, l, r, gr, b, k),
      glp: (a: unknown, l: unknown, p: unknown) => this.glp(a, l, p),
      glf: (a: unknown, l: unknown, f: unknown) => this.glf(a, l, f),
      gls: (a: unknown, l: unknown, s: unknown) => this.gls(a, l, s),
      glt: (a: unknown, l: unknown, t: unknown) => this.glt(a, l, t),
      glpfs: (a: unknown, l: unknown, p: unknown, f: unknown, s: unknown) =>
        this.glpfs(a, l, p, f, s),
      glim: (v: unknown, lo: unknown, hi: unknown) => this.glim(v, lo, hi),
      gtt: (_slot: unknown, ms: unknown) => this.gtt(ms),
      grxm: (_slot: unknown, mode: unknown) => this.grxm(mode),
      txma: (v: unknown) => this.axisMax(v),
      tyma: (v: unknown) => this.axisMax(v),
      gmms: (...args: unknown[]) => this.recordHid("gmms", args),
      gmbs: (...args: unknown[]) => this.recordHid("gmbs", args),
      gks: (...args: unknown[]) => this.recordHid("gks", args),
      // Its own recorder: a sysex message is a variable-length run of bytes, not a mouse click.
      gmss: (...args: unknown[]) => this.recordSysex(args),
    };
    for (const name of HOST_GLOBALS) g.set(name, bindings[name]);

    // The three bridges, outside the list: each is bound under a private __hangar_ name no configuration
    // may spell, reached only through the `self:` form SELF_PRELUDE installs. gms is the one that
    // matters (a bare `gms(...)` still raises); the touch queue's accessors have no bare form in firmware either.
    g.set(
      "__hangar_gms",
      (ch: unknown, cmd: unknown, p1: unknown, p2: unknown, mode: unknown) =>
        this.gms(ch, cmd, p1, p2, mode),
    );
    g.set("__hangar_tpop", () => this.touchPop());
    g.set("__hangar_tfield", (which: unknown) => this.touchField(which));
  }

  /** Records one mouse or keyboard send. Nothing in HANGAR consumes them. */
  private recordHid(call: HostHid["call"], args: readonly unknown[]): void {
    this.hidLog.push({ call, args: args.map((a) => f2i(num(a))) });
  }

  /**
   * Records one sysex message, WHOLE and in call order: every argument is one payload byte and the
   * configuration supplies 0xF0 and 0xF7 itself (`grid_lua_api.c:905-935`; `grid_decode.c:96-100` warns
   * and transmits anyway). F2Ieq and nothing else - no seven-bit narrowing, so a data byte above 127
   * stays visible in a test rather than hidden by a mask.
   */
  private recordSysex(args: readonly unknown[]): void {
    this.sysexLog.push({ bytes: args.map((a) => f2i(num(a))) });
  }

  /**
   * firmware's touch_pop: take the next queued sample and make it current, or report empty. A compiled
   * handler drains a backlog INSIDE one dispatch (the trackpad loops up to 24 times), so it shares the
   * host's one FIFO with tick()'s own pop.
   */
  private touchPop(): boolean {
    const next = this.fifo.shift();
    if (typeof next === "undefined") return false;
    this.current = next;
    return true;
  }

  /** tid / tev / txv / tyv, indexed 0..3, over whatever touch_pop left current. */
  private touchField(which: unknown): number {
    const sample = this.current;
    if (typeof sample === "undefined") return 0;
    const index = f2i(num(which));
    if (index === 0) return sample.i;
    if (index === 1) return sample.e;
    if (index === 2) return sample.x;
    return sample.y;
  }

  /**
   * led_address_get: a LOGICAL cell index to the HARDWARE index. NOT the identity: the firmware's table
   * (grid_module.c:445-458; screenToHw in pad-sim.ts) mirrors EVEN rows, and an identity stub moves 40
   * of the 81 cells to a plausible wrong place.
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

  /** led_animation_rate. Rate ONLY, no phase reset: pokeLayer leaves every unnamed field alone, so an accelerating swirl accelerates. */
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
   * timer_start. A ONE-SHOT, as firmware's is: a fire consumes the deadline and only the body's own gtt
   * re-arms it. A handler runs inside a pcall (grid_lua.c:369), so a re-arm placed at the END dies
   * permanently on the first raise - which an automatic re-arm would hide from a hand-authored config.
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

  /** touch_x_max / touch_y_max. Typed as 127 | 1023, the only two values any configuration uses; wider than 127 reads as hi-res. */
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
  // Touch. The host keeps its OWN FIFO (the sim's feeds its detached compiled handlers) under the sim's
  // rules: a change gate per contact on (x, y, event), a 10-deep cap with a silent drop, at most one
  // sample popped per tick - so a motionless finger produces nothing and a held-still comet dot fades.

  touchDown(id: number, x: number, y: number): void {
    this.enqueue(id, EVT_DOWN, x, y);
  }

  /**
   * One MIDI realtime byte to the configuration, exactly as the firmware hands it (change 8,
   * 2026-09-18): `decode.lua:42-44` calls `el:rtmrx_cb({instr, sx, sy}, byte)` when the element
   * defines `rtmrx_cb` and `grid_decode.c:388` has let the class through `rx_mode`. Test-facing and
   * SYNCHRONOUS - the host has no MIDI input, so nothing schedules this; a spec drives the callback
   * the way a DAW would and reads what the rings did. The routing gate is the spec's to assert
   * through `rxMode`; this call does not consult it, so an Internal card can be shown ignoring nothing
   * because nothing reaches it. Returns false when the configuration defines no handler.
   */
  rtm(byte: number): boolean {
    let called = false;
    this.guarded(() => {
      called = this.engine.doStringSync(
        `local f = self.rtmrx_cb if type(f) ~= "function" then return false end ` +
          `f(self, {13, 0, 0}, ${f2i(num(byte))}) return true`,
      ) as boolean;
    });
    return called;
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
  // The tick: PadSim's pinned interleave with the Lua half where the compiled half would be - pop one
  // touch sample and dispatch it, run the timer if due, then the sim's grid_led_tick and render.

  tick(): void {
    const sample = this.fifo.shift();
    if (typeof sample !== "undefined") {
      // Made current before the dispatch, so a handler that reads tid/tev/txv/
      // tyv before its first touch_pop sees the sample it was called with.
      this.current = sample;
      this.guarded(() =>
        this.touchFn?.(sample.i, sample.e, sample.x, sample.y),
      );
    }

    this.msClock += TICK_MS;
    if (this.timerDeadline !== null && this.msClock >= this.timerDeadline) {
      // Consume the one-shot BEFORE the body runs: a body that raises before re-arming stops for good.
      this.timerDeadline = null;
      this.guarded(() => this.timerFn?.());
    }

    // Every slot is "user"-owned, so this is grid_led_tick plus the render and nothing more.
    this.sim.tick();
    this._tickCount += 1;
  }

  run(n: number): void {
    for (let i = 0; i < n; i++) this.tick();
  }

  /** Firmware runs every handler inside a pcall (grid_lua.c:369): a raise stops that call and is recorded, never rethrown. */
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

  /** Every mouse and keyboard send the configuration issued, in order. */
  get hid(): readonly HostHid[] {
    return this.hidLog;
  }

  /** Every sysex message the configuration issued, whole and in order. */
  get sysex(): readonly HostSysex[] {
    return this.sysexLog;
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
