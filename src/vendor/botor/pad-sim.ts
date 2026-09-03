// Vendored from sabotond-dev/botor
//   path:   src/renderer/main/zona/pad-sim.ts
//   commit: a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c
//   synced: 2026-09-02
// Modified for HANGAR: nothing - the flat vendor layout keeps ./_pad valid.
// Original copyright and licence (GNU GPL v3 or later) retained below.

// The ZONA simulator. A firmware-faithful model of the pad's 81 LEDs
// that the editor can run with no hardware attached. It interprets the
// same grounded PadState the compiler emits Lua from, reproducing the
// exact numbers the emitted code would leave in the LED layers, so the
// shelf cards can animate honestly instead of guessing. The editor's
// live LED mirror updates at 3.3 Hz while firmware animates at 100 Hz;
// this engine is the only honest preview.
//
// No Lua VM runs here. Fidelity is enforced two ways: every table the
// compiler owns (SPEED_TABLE, DECAY_TABLE, decay snapping, wavelength
// snapping, layer planning, grounding) is imported from _pad.ts rather
// than copied, and the test suite pins the compiled Lua text against the
// same tables, so a compiler change breaks a test instead of drifting
// silently. Firmware-side constants (the weight tables, the /512, the
// sine lookup, glc's stop derivation) exist in no Lua at all; they are
// transcribed from grid_led.c and pinned by hand-computed test vectors.
//
// The engine is deterministic and time-stepped. tick() is exactly one
// 10 ms firmware period; there is no Date.now, no timers, no DOM
// anywhere in this file, so vitest can drive it headlessly and the panel
// owns the clock.

import {
  GRID,
  CELLS,
  type PadState,
  type LayerPlan,
  groundPadState,
  planLayers,
  SPEED_TABLE,
  BRIGHTNESS_TABLE,
  scaleChannel,
  nearestDecay,
  snapWavelength,
  speedRate,
  effectiveAxes,
  springLed,
  springRestCell,
  zoneNotes as zoneNoteTable,
  DIAL_SENSE_TABLE,
  DIAL_ATAN_SCALE,
  DIAL_DEADZONE_R2,
  DIAL_HALF_TURN,
  DIAL_FINE_PER_TURN,
} from "./_pad";

// ---------------------------------------------------------------------------
// Geometry: the serpentine, both directions.
//
// The firmware's logical-to-hardware table (grid_module.c:445-458)
// mirrors EVEN rows: row 0 reads 8,7,6,...,0 and row 1 reads 9,10,...,17.
// ZONA.svelte:88-100 un-serpentines the same way. Internal engine state
// is keyed by hardware index, because that is what every compiled
// glc/glp addresses and shimmer's pattern is genuinely hardware-keyed;
// the exported framebuffer is logical row-major screen order, converted
// through hwToScreen at render time.

export function screenToHw(x: number, y: number): number {
  return y * GRID + (y % 2 === 0 ? GRID - 1 - x : x);
}

export function hwToScreen(hw: number): { x: number; y: number } {
  const y = Math.floor(hw / GRID);
  const raw = hw % GRID;
  return { x: y % 2 === 0 ? GRID - 1 - raw : raw, y };
}

// ---------------------------------------------------------------------------
// Firmware constants, transcribed from grid_led.c.

// The sine table has no exact closed form. It approximates
// round(128 + 127.5*sin(2*pi*p/256)) but the real table is asymmetric
// (SINE[0] is 128 yet SINE[128] is 126, a 255 plateau at 61..67, a 0
// plateau at 188..194) and no tested formula reproduces it bit-exactly,
// so it is embedded verbatim from grid_led.c:86-94.
export const SINE_LOOKUP: readonly number[] = [
  0x80, 0x83, 0x86, 0x89, 0x8c, 0x8f, 0x92, 0x95, 0x98, 0x9c, 0x9f, 0xa2,
  0xa5, 0xa8, 0xab, 0xae, 0xb0, 0xb3, 0xb6, 0xb9, 0xbc, 0xbf, 0xc1, 0xc4,
  0xc7, 0xc9, 0xcc, 0xce, 0xd1, 0xd3, 0xd5, 0xd8, 0xda, 0xdc, 0xde, 0xe0,
  0xe2, 0xe4, 0xe6, 0xe8, 0xea, 0xeb, 0xed, 0xef, 0xf0, 0xf2, 0xf3, 0xf4,
  0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xfb, 0xfb, 0xfc, 0xfd, 0xfd, 0xfe, 0xfe,
  0xfe, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe, 0xfe, 0xfd, 0xfd,
  0xfc, 0xfc, 0xfb, 0xfa, 0xf9, 0xf8, 0xf7, 0xf6, 0xf5, 0xf4, 0xf2, 0xf1,
  0xef, 0xee, 0xec, 0xeb, 0xe9, 0xe7, 0xe5, 0xe3, 0xe1, 0xdf, 0xdd, 0xdb,
  0xd9, 0xd7, 0xd4, 0xd2, 0xcf, 0xcd, 0xca, 0xc8, 0xc5, 0xc3, 0xc0, 0xbd,
  0xba, 0xb8, 0xb5, 0xb2, 0xaf, 0xac, 0xa9, 0xa6, 0xa3, 0xa0, 0x9d, 0x9a,
  0x97, 0x94, 0x91, 0x8e, 0x8a, 0x87, 0x84, 0x81, 0x7e, 0x7b, 0x78, 0x75,
  0x71, 0x6e, 0x6b, 0x68, 0x65, 0x62, 0x5f, 0x5c, 0x59, 0x56, 0x53, 0x50,
  0x4d, 0x4a, 0x47, 0x45, 0x42, 0x3f, 0x3c, 0x3a, 0x37, 0x35, 0x32, 0x30,
  0x2d, 0x2b, 0x28, 0x26, 0x24, 0x22, 0x20, 0x1e, 0x1c, 0x1a, 0x18, 0x16,
  0x14, 0x13, 0x11, 0x10, 0x0e, 0x0d, 0x0b, 0x0a, 0x09, 0x08, 0x07, 0x06,
  0x05, 0x04, 0x03, 0x03, 0x02, 0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x01, 0x01, 0x01, 0x02, 0x02, 0x03, 0x04, 0x04, 0x05,
  0x06, 0x07, 0x08, 0x09, 0x0b, 0x0c, 0x0d, 0x0f, 0x10, 0x12, 0x14, 0x15,
  0x17, 0x19, 0x1b, 0x1d, 0x1f, 0x21, 0x23, 0x25, 0x27, 0x2a, 0x2c, 0x2e,
  0x31, 0x33, 0x36, 0x38, 0x3b, 0x3e, 0x40, 0x43, 0x46, 0x49, 0x4c, 0x4f,
  0x51, 0x54, 0x57, 0x5a, 0x5d, 0x60, 0x63, 0x67, 0x6a, 0x6d, 0x70, 0x73,
  0x76, 0x79, 0x7c, 0x80,
];

// Closed form of the three weight tables (grid_led.c:46-84), verified by
// enumerating all 256 rows in fin-01. Both p=127 and p=128 render pure
// mid, and the weights always sum to exactly 254.
export function weightsOf(p: number): [number, number, number] {
  if (p <= 127) return [254 - 2 * p, 2 * p, 0];
  return [0, 510 - 2 * p, 2 * p - 256];
}

// Shape to intensity (grid_led.c:428-442). sha values outside the switch
// fall through to the initialiser, so an unknown shape behaves as ramp
// up; the engine replicates rather than throwing.
export function shapeIntensity(sha: number, pha: number): number {
  switch (sha) {
    case 1:
      return 255 - pha;
    case 2:
      return pha < 128 ? 255 : 0;
    case 3:
      return SINE_LOOKUP[pha];
    default:
      return pha;
  }
}

// glc's stop derivation (grid_led.c:298-303): min = c/20, mid = c/2,
// max = c, all C uint8 division, so truncation. A nonzero 6th Lua arg
// then forces min to black (grid_lua_api.c:1082-1092).
export function glcStops(
  r: number,
  g: number,
  b: number,
  forceMinBlack: boolean,
): {
  min: [number, number, number];
  mid: [number, number, number];
  max: [number, number, number];
} {
  const min: [number, number, number] = forceMinBlack
    ? [0, 0, 0]
    : [Math.floor(r / 20), Math.floor(g / 20), Math.floor(b / 20)];
  return {
    min,
    mid: [Math.floor(r / 2), Math.floor(g / 2), Math.floor(b / 2)],
    max: [r, g, b],
  };
}

// ---------------------------------------------------------------------------
// Lua arithmetic evaluated in JS. The compiler pre-bakes all literals but
// the positional phase expressions still floor-divide and mod with LUA
// semantics, which differ from JS for negative operands: // floors toward
// negative infinity and % takes the sign of the divisor. The swirl
// expression genuinely goes negative, so these are not pedantry.

function luaMod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

// C parameter narrowing on the firmware side: values reaching pha/fre/sha
// are uint8, timeout is uint16, so a Lua integer wraps two's complement.
// The integer assertion documents the F2Ieq guarantee: the compiler
// closes every float with //1, so a fractional phase reaching a setter
// would be a compiler bug worth failing loudly on.
function wrapU8(v: number): number {
  if (!Number.isInteger(v)) {
    throw new Error(`non-integer value ${v} reached a uint8 narrowing`);
  }
  return luaMod(v, 256);
}

function wrapU16(v: number): number {
  if (!Number.isInteger(v)) {
    throw new Error(`non-integer value ${v} reached a uint16 narrowing`);
  }
  return luaMod(v, 65536);
}

// ---------------------------------------------------------------------------
// The layer state. 81 LEDs times 3 layers (0 alert, 1 UI_A, 2 UI_B),
// stored exactly like the firmware smart buffer: index h + 81*layer.
// Layer 0 is never written by any compiled config but it participates in
// the render sum, so a future alert model drops in without touching the
// render loop.

const LAYER_COUNT = 3;

type Rgb3 = [number, number, number];

type Layer = {
  min: Rgb3;
  mid: Rgb3;
  max: Rgb3;
  pha: number;
  fre: number;
  sha: number;
  timeout: number;
};

function blankLayer(): Layer {
  return {
    min: [0, 0, 0],
    mid: [0, 0, 0],
    max: [0, 0, 0],
    pha: 0,
    fre: 0,
    sha: 0,
    timeout: 0,
  };
}

export type SimMidi = {
  ch: number;
  cmd: number;
  p1: number;
  p2: number;
  mode: number;
};

type Sample = { i: number; e: number; x: number; y: number };

// Firmware event codes as the sim emits them: 1 MOVE, 4 DOWN, 5 UP. The
// compiled guards treat "contact ended" as e == 3 or e >= 5 and "live"
// as e ~= 3 and e < 5; the sim never synthesizes 9 (DOWNUP).
const EVT_MOVE = 1;
const EVT_DOWN = 4;
const EVT_UP = 5;
// The fast tap: firmware coalesces a sub-cycle press-and-lift into ONE
// message with the raw T100 DOWNUP nibble and no separate DOWN or UP.
const EVT_TAP = 9;

function ended(e: number): boolean {
  return e === 3 || e >= 5;
}

function live(e: number): boolean {
  return e !== 3 && e < 5;
}

const FIFO_DEPTH = 10;

export type PadSimOptions = { onMidi?: (m: SimMidi) => void };

// ---------------------------------------------------------------------------
// The engine.

export class PadSim {
  private _state!: PadState;
  private _plan!: LayerPlan;
  private _coordMax: 127 | 1023 = 127;
  // The card's brightness percent, imported from the same table the
  // compiler reads. Applied where the sim CHOOSES colours, mirroring the
  // compiler's funnel sites point for point; glcStops, weightsOf and the
  // render sum are the firmware model and stay untouched.
  private briPct = 100;

  private layers: Layer[] = [];
  private fifo: Sample[] = [];
  // Change gate per contact on (x, y, event), like firmware's enqueue
  // gate. Deliberate deviation from hardware: the gate only advances on a
  // successful enqueue, so a sample dropped from a full FIFO can be
  // regenerated by the next change. The hardware bug where the gate
  // advances before the writability check (a dropped UP is a permanently
  // stuck contact) is the reason the watchdog exists; the sim still runs
  // the watchdog semantics, it just cannot manufacture the stuck contact.
  private gate = new Map<number, Sample>();

  private msClock = 0;
  private _tickCount = 0;

  // The one-shot timer, as compiled: gtt arms a deadline, the body
  // re-arms first. null means the timer slot belongs to the user or the
  // state is trackpad, and nothing re-arms the look layers.
  private timerPeriod: number | null = null;
  private timerDeadline = 0;
  private watchdog = false;
  private keeperCounter = 0; // Lua s.c in the watchdog timer body

  // Compiled per-contact state, named after the Lua fields.
  private glowCell: number | null = null; // s.l, a logical index
  private firstFinger: number | null = null; // s.f
  private zoneNotes = new Map<number, number>(); // s.n
  private zoneAge = new Map<number, number>(); // s.p
  private zoneLatch = new Set<number>(); // s.g, keyed by zone
  // The baked per-zone note table (self.m), or undefined when chromatic
  // arithmetic applies. Built by the compiler's own zoneNotes, so the two
  // sides cannot disagree about a single note.
  private noteTable: number[] | undefined;
  // The dial's slots. ONE set, not keyed per contact: this looks like a
  // bug until you remember normalise pins the dial's fingers to "first",
  // so the compiled Lua keeps a single set on self and the sim matches.
  private dialPrev: number | null = null; // s.a, fine units
  private dialResidual = 0; // s.d
  private dialValue = 64; // s.v (absolute mode only)
  private dialRadiusLast: number | null = null; // s.r

  private frameBuf = new Uint8Array(CELLS * 3);
  private dirty = true;

  private readonly onMidi?: (m: SimMidi) => void;

  constructor(state: PadState, opts?: PadSimOptions) {
    this.onMidi = opts?.onMidi;
    this.rebuild(state);
  }

  // The grounded state actually simulated. The sim never renders a sheet
  // the plan suppressed, so the preview agrees with the ledger.
  get state(): PadState {
    return this._state;
  }

  get plan(): LayerPlan {
    return this._plan;
  }

  // 127 normally, 1023 when the compiled Setup widens the axis range:
  // txma(1023)/tyma(1023) is emitted for hiRes xy/zones and inside the
  // trackpad recipe. The panel divides pointer pixels into this range.
  get coordMax(): 127 | 1023 {
    return this._coordMax;
  }

  get tickCount(): number {
    return this._tickCount;
  }

  // Queue depth, exposed so tests can observe the change gate and the
  // 10-deep cap without reaching into private state.
  get pendingTouches(): number {
    return this.fifo.length;
  }

  // -------------------------------------------------------------------------
  // Rebuild: firmware page-load semantics. grid_led_reset zeroes every
  // stop, phase, rate, shape and timeout on all 81 LEDs and all three
  // layers, then Setup rebuilds from scratch. There is no incremental
  // mutate path; at 243 layer structs a full rebuild costs microseconds
  // and buys equivalence.

  reset(): void {
    this.rebuild(this._state);
  }

  setState(state: PadState): void {
    this.rebuild(state);
  }

  private rebuild(state: PadState): void {
    this._state = groundPadState(state);
    this._plan = planLayers(this._state);
    this.briPct = BRIGHTNESS_TABLE[this._state.brightness - 1].pct;

    this.layers = [];
    for (let i = 0; i < CELLS * LAYER_COUNT; i++) this.layers.push(blankLayer());
    this.fifo = [];
    this.gate.clear();
    this.msClock = 0;
    this._tickCount = 0;
    this.timerPeriod = null;
    this.timerDeadline = 0;
    this.watchdog = false;
    this.keeperCounter = 0;
    this.glowCell = null;
    this.firstFinger = null;
    this.zoneNotes.clear();
    this.zoneAge.clear();
    this.zoneLatch.clear();
    this.noteTable = undefined;
    this.dialPrev = null;
    this.dialResidual = 0;
    this.dialValue = 64;
    this.dialRadiusLast = null;
    this.dirty = true;

    const s = this._state;
    const plan = this._plan;
    const trackpad = plan.sends && s.sends.kind === "trackpad";

    // The compiled Setup emits txma(1023)/tyma(1023) only when the plan
    // keeps the sends sheet and hiRes is on; the trackpad recipe widens
    // inside its own Setup.
    this._coordMax =
      trackpad || (plan.sends && s.sends.hiRes) ? 1023 : 127;

    if (trackpad) {
      // Trackpad writes no LEDs at all: the frame stays black and the
      // panel keeps static art for that one card. Its mouse output is
      // outside this engine's scope.
      return;
    }

    if (plan.look) this.armLook();
    if (plan.touch) this.armTouchInit();
    this.armSendsPicture();

    if (plan.sends && s.sends.kind === "zones") {
      this.noteTable = zoneNoteTable(s);
    }

    // sendsInit's glow home marker: the joystick's rest cell is lit from
    // power-on and the parked dot is the glow's own slot, so the next
    // touch clears it like any other.
    if (springLed(s, plan) === "glow") {
      const cell = springRestCell(s);
      this.glowCell = cell;
      this.glp(this.hwOf(cell), 1, 255);
    }

    // Timer arming, from compile(): gtt(0,20) when the state needs the
    // zones watchdog, gtt(0,3e5) otherwise, and nothing at all when the
    // user owns the timer slot, in which case look layers genuinely
    // freeze at tick 65535. Toggle mode is watchdog-exempt: its latched
    // notes are intentional, mirroring needsWatchdog.
    const timerIsOurs = (s.owned?.timer ?? "editor") !== "user";
    if (timerIsOurs) {
      this.watchdog =
        plan.sends && s.sends.kind === "zones" && !s.sends.toggle;
      this.timerPeriod = this.watchdog ? 20 : 300000;
      this.timerDeadline = this.msClock + this.timerPeriod;
    }
  }

  // -------------------------------------------------------------------------
  // Firmware setter semantics. Every setter copies the guard from
  // grid_led.c:305-375: out-of-range layer or LED index is a SILENT
  // no-op, and a nil address (glag out of 0..80) no-ops in every LED
  // function. The compiled code relies on clipping instead, but the
  // guard is the firmware contract so the engine keeps it.

  private layerAt(h: number, layer: number): Layer | undefined {
    if (!Number.isInteger(h) || h < 0 || h >= CELLS) return undefined;
    if (!Number.isInteger(layer) || layer < 0 || layer >= LAYER_COUNT) {
      return undefined;
    }
    return this.layers[h + CELLS * layer];
  }

  private glc(
    h: number,
    layer: number,
    r: number,
    g: number,
    b: number,
    forceMinBlack: boolean,
  ): void {
    const L = this.layerAt(h, layer);
    if (typeof L === "undefined") return;
    const stops = glcStops(r, g, b, forceMinBlack);
    L.min = stops.min;
    L.mid = stops.mid;
    L.max = stops.max;
  }

  // The optional alpha premultiplies at write time with a C cast, so
  // truncation, not rounding. It dims the stop; it is not compositing.
  private stop(
    h: number,
    layer: number,
    which: "min" | "mid" | "max",
    r: number,
    g: number,
    b: number,
    alpha?: number,
  ): void {
    const L = this.layerAt(h, layer);
    if (typeof L === "undefined") return;
    let cr = r;
    let cg = g;
    let cb = b;
    if (typeof alpha !== "undefined") {
      const a = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha;
      cr = Math.trunc(r * a);
      cg = Math.trunc(g * a);
      cb = Math.trunc(b * a);
    }
    L[which] = [cr, cg, cb];
  }

  private glp(h: number, layer: number, p: number): void {
    const L = this.layerAt(h, layer);
    if (typeof L === "undefined") return;
    L.pha = wrapU8(p);
  }

  private glt(h: number, layer: number, t: number): void {
    const L = this.layerAt(h, layer);
    if (typeof L === "undefined") return;
    L.timeout = wrapU16(t);
  }

  // pha, fre and sha in one call; does NOT set timeout, exactly like the
  // firmware glpfs (grid_lua_api.c:1589-1591).
  private glpfs(
    h: number,
    layer: number,
    p: number,
    f: number,
    sh: number,
  ): void {
    const L = this.layerAt(h, layer);
    if (typeof L === "undefined") return;
    L.pha = wrapU8(p);
    L.fre = wrapU8(f);
    L.sha = wrapU8(sh);
  }

  // -------------------------------------------------------------------------
  // Setup: the Look arming, per kind, reproducing the exact expressions
  // the compiler emits (lookLoop in _pad.ts). All shapes are 3 (sine),
  // all timeouts 65535. Positional kinds walk the logical index and
  // resolve the hardware address like glag(0, n); breathe and shimmer
  // walk the hardware index directly, which matters for shimmer because
  // its pattern is genuinely hardware-keyed and follows the serpentine
  // on screen.

  // The brightness funnel, shared with the compiler: never a local copy.
  private sc(v: number): number {
    return scaleChannel(v, this.briPct);
  }

  private scaleRgb(c: { r: number; g: number; b: number }): {
    r: number;
    g: number;
    b: number;
  } {
    return { r: this.sc(c.r), g: this.sc(c.g), b: this.sc(c.b) };
  }

  private armLook(): void {
    const l = this._state.look;
    const rate = speedRate(l.speed, l.reverse);
    const w = snapWavelength(l.wavelength);
    // Scaled at the same point the compiler scales: the literal the
    // emitted glc would carry.
    const c = this.scaleRgb(l.colour);
    const hard = l.edge === "hard";

    // glc(a, 2, colour, 1) plus the hard-edge mid-black override, then
    // glpfs(a, 2, phase, rate, 3) and glt(a, 2, 65535).
    const armCell = (
      h: number,
      layer: number,
      colr: { r: number; g: number; b: number },
      phase: number,
      f: number,
    ) => {
      this.glc(h, layer, colr.r, colr.g, colr.b, true);
      // The hard edge applies on layer 2 only, matching the emitter.
      if (hard && layer === 2) this.stop(h, layer, "mid", 0, 0, 0);
      this.glpfs(h, layer, phase, f, 3);
      this.glt(h, layer, 65535);
    };

    switch (l.kind) {
      case "none":
        return;

      case "breathe":
        for (let h = 0; h < CELLS; h++) armCell(h, 2, c, 0, rate);
        return;

      case "shimmer":
        // glpfs(a,2,a*97%256,1+a%3,3): the speed detent is deliberately
        // ignored; the never-repeating field comes from the per-LED rate
        // mix 1 + h%3.
        for (let h = 0; h < CELLS; h++) {
          armCell(h, 2, c, luaMod(h * 97, 256), 1 + (h % 3));
        }
        return;

      case "scan":
        for (let n = 0; n < CELLS; n++) {
          const axis = l.axis === "y" ? Math.floor(n / GRID) : n % GRID;
          armCell(this.hwOf(n), 2, c, wrapU8(axis * w), rate);
        }
        return;

      case "wave": {
        const sign = l.axis === "antidiagonal" ? -1 : 1;
        for (let n = 0; n < CELLS; n++) {
          const phase = ((n % GRID) + sign * Math.floor(n / GRID)) * w;
          armCell(this.hwOf(n), 2, c, wrapU8(phase), rate);
        }
        return;
      }

      case "swirl": {
        const m = [41, 82, 123][Math.min(Math.max(l.arms, 1), 3) - 1];
        for (let n = 0; n < CELLS; n++) {
          armCell(this.hwOf(n), 2, c, this.swirlPhase(n, m, l.spiral), rate);
        }
        return;
      }

      case "ripple": {
        // Rings-from owns the rate sign and the reverse switch is
        // suppressed on this tile, so the base rate comes straight from
        // the speed detent (SPEED_TABLE), not from speedRate.
        const step = Math.min(Math.max(Math.round(l.speed), 1), 8);
        const base = SPEED_TABLE[step - 1].rate;
        const r = l.ringsFrom === "centre" ? 256 - base : base;
        for (let n = 0; n < CELLS; n++) {
          armCell(this.hwOf(n), 2, c, this.ripplePhase(n), r);
        }
        return;
      }

      case "drift": {
        // The only Look that cannot use glc: three independent stops per
        // column. The channel arithmetic mirrors rampChannel exactly,
        // including the emitted lo - (|d|*x)//8 form for a falling ramp,
        // which is NOT the same as lo + floor(d*x/8) under Lua floor.
        // The endpoints scale FIRST, then the existing driftRamp runs on
        // the scaled endpoints, mirroring the compiler's emit-then-ramp
        // order exactly.
        const ea = this.scaleRgb(l.colour);
        const eb = this.scaleRgb(l.colourB);
        for (let n = 0; n < CELLS; n++) {
          const h = this.hwOf(n);
          const x = n % GRID;
          this.stop(h, 2, "min", 0, 0, 0);
          this.stop(h, 2, "mid", ...driftRamp(ea, eb, x));
          this.stop(h, 2, "max", ...driftRamp(eb, ea, x));
          this.glpfs(h, 2, wrapU8((x + Math.floor(n / GRID)) * w), rate, 3);
          this.glt(h, 2, 65535);
        }
        return;
      }

      case "showpiece":
        // Layer 2 tide at structural wavelength 15 plus a layer 1
        // counter-rotation at 256 - rate; the phase expressions are
        // structural, not parameters.
        for (let n = 0; n < CELLS; n++) {
          const h = this.hwOf(n);
          const tide = ((n % GRID) + Math.floor(n / GRID)) * 15;
          armCell(h, 2, c, wrapU8(tide), rate);
          armCell(
            h,
            1,
            this.scaleRgb(l.colourB),
            this.swirlPhase(n, 41, false),
            256 - rate,
          );
        }
        return;
    }
  }

  private hwOf(n: number): number {
    return screenToHw(n % GRID, Math.floor(n / GRID));
  }

  // math.atan(n//9-4, n%9-4)*m//1, then %256 without the spiral or
  // + n%9*8 with it, in which case the uint8 narrowing supplies the mod.
  private swirlPhase(n: number, m: number, spiral: boolean): number {
    const row = Math.floor(n / GRID);
    const col = n % GRID;
    const base = Math.floor(Math.atan2(row - 4, col - 4) * m);
    return spiral ? wrapU8(base + col * 8) : luaMod(base, 256);
  }

  // math.sqrt(u*u+v*v)*45//1 with u = n%9-4, v = n//9-4. 45 is fixed:
  // the largest multiplier that keeps the corner radius under 256.
  private ripplePhase(n: number): number {
    const u = (n % GRID) - 4;
    const v = Math.floor(n / GRID) - 4;
    return Math.floor(Math.sqrt(u * u + v * v) * 45);
  }

  // Touch colour init in the merged Setup loop: comet, bloom and glow get
  // glc(a,1,colour,1) on all 81 hardware LEDs. perFinger sets its stops
  // on every paint and disturb writes into the Look's layer, so neither
  // needs an init and neither gets one.
  private armTouchInit(): void {
    const t = this._state.touch;
    if (t.kind === "perFinger" || t.kind === "disturb" || t.kind === "none") {
      return;
    }
    const c = this.scaleRgb(t.colour);
    for (let h = 0; h < CELLS; h++) {
      this.glc(h, 1, c.r, c.g, c.b, true);
    }
  }

  // The Sends static picture (sendsLoop in _pad.ts): only zones and
  // faders with showGrid write LEDs. Hidden zones/faders and xy write
  // none; their MIDI still runs from the handler.
  private armSendsPicture(): void {
    const s = this._state;
    if (!this._plan.sends) return;

    if (s.sends.kind === "zones" && s.sends.showGrid && this.gridDiv() === 4) {
      // Sixteen dots at the odd intersections, not a checkerboard,
      // mirroring the emitted 4x4 picture: layer 1 armed everywhere in
      // gridColour with only the dots phased up, layer 2 the held sheet.
      const light = this.scaleRgb(s.sends.gridColour);
      const held = this.scaleRgb(s.sends.heldColour);
      for (let n = 0; n < CELLS; n++) {
        const h = this.hwOf(n);
        this.glc(h, 1, light.r, light.g, light.b, true);
        const dot = (n % GRID) % 2 === 1 && Math.floor(n / GRID) % 2 === 1;
        this.glp(h, 1, dot ? 255 : 0);
        this.glc(h, 2, held.r, held.g, held.b, true);
        this.glp(h, 2, 0);
      }
      return;
    }

    if (s.sends.kind === "zones" && s.sends.showGrid) {
      // dim(light, 2, 5) FIRST, the checkerboard's dark square, THEN the
      // brightness funnel on each channel, mirroring the emitted order.
      const light = this.scaleRgb(s.sends.gridColour);
      const dark = this.scaleRgb({
        r: Math.floor((s.sends.gridColour.r * 2) / 5),
        g: Math.floor((s.sends.gridColour.g * 2) / 5),
        b: Math.floor((s.sends.gridColour.b * 2) / 5),
      });
      const held = this.scaleRgb(s.sends.heldColour);
      for (let n = 0; n < CELLS; n++) {
        const h = this.hwOf(n);
        const zx = this.ledZoneTerm(n % GRID);
        const zy = this.ledZoneTerm(Math.floor(n / GRID));
        const cc = (zx + zy) % 2 === 0 ? light : dark;
        this.glc(h, 1, cc.r, cc.g, cc.b, true);
        this.glp(h, 1, 255);
        this.glc(h, 2, held.r, held.g, held.b, true);
        this.glp(h, 2, 0);
      }
      return;
    }

    if (s.sends.kind === "faders" && s.sends.showGrid) {
      if (s.sends.layout === "blocks") {
        // The palette coefficients scale, keeping the arithmetic form.
        const P80 = this.sc(80);
        const P255 = this.sc(255);
        const P60 = this.sc(60);
        const P200 = this.sc(200);
        for (let n = 0; n < CELLS; n++) {
          const h = this.hwOf(n);
          const f = Math.floor(((n % GRID) * 4) / GRID);
          this.glc(h, 1, f * P80, P255 - f * P60, P200 - f * P60, true);
          this.glp(h, 1, 0);
          // A dim track on layer 2 so a fader at zero is still visible.
          this.glc(h, 2, this.sc(20), this.sc(20), this.sc(30), true);
          this.glp(h, 2, 255);
        }
        return;
      }
      // Rails. Every rail cell drives BOTH layers together, because one
      // layer alone caps at 49.6 percent and the rails would read grey.
      const k = s.sends.faders === 3 ? 3 : 2;
      const w = this.sc(255);
      for (let n = 0; n < CELLS; n++) {
        const h = this.hwOf(n);
        const col = n % GRID;
        if (col % k === 1) {
          const f = Math.floor(col / k);
          const fc = this.faderColour(f);
          this.glc(h, 1, fc[0], fc[1], fc[2], true);
          this.glc(h, 2, fc[0], fc[1], fc[2], true);
          this.glp(h, 1, 0);
          this.glp(h, 2, 0);
        } else {
          this.glc(h, 1, w, w, w, true);
          this.glc(h, 2, w, w, w, true);
          this.glp(h, 1, 255);
          this.glp(h, 2, 255);
        }
      }
    }
  }

  private faderColour(f: number): Rgb3 {
    // The scaled-coefficient form, mirroring faderColour in _pad.ts.
    return this._state.sends.faders === 3
      ? [
          f * this.sc(127),
          this.sc(255) - f * this.sc(30),
          this.sc(255) - f * this.sc(127),
        ]
      : [
          f * this.sc(85),
          this.sc(255) - f * this.sc(20),
          this.sc(255) - f * this.sc(85),
        ];
  }

  // LED column or row to zone group: 3x3 uses v//3, 4x4 uses v*4//9. The
  // 9x9 grid never reaches here because normalisation clears showGrid.
  private ledZoneTerm(v: number): number {
    const g = this.gridDiv();
    if (g === 3) return Math.floor(v / 3);
    if (g === 9) return v;
    return Math.floor((v * g) / GRID);
  }

  private gridDiv(): number {
    const g = this._state.sends.grid;
    return g === "3x3" ? 3 : g === "4x4" ? 4 : 9;
  }

  // -------------------------------------------------------------------------
  // Touch delivery: a 10-deep FIFO shared by all contacts, change-gated
  // per contact on (x, y, event), one pop per tick, silent drop when
  // full. A motionless finger produces nothing, which is why a held
  // still finger's comet dot visibly fades in the preview.

  touchDown(id: number, x: number, y: number): void {
    this.enqueue(id, EVT_DOWN, x, y);
  }

  touchMove(id: number, x: number, y: number): void {
    this.enqueue(id, EVT_MOVE, x, y);
  }

  touchUp(id: number, x: number, y: number): void {
    this.enqueue(id, EVT_UP, x, y);
  }

  // A hardware fast tap, delivered as the single DOWNUP message the
  // touch shim really hands the module.
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
    const sample = { i: id, e, x: cx, y: cy };
    this.fifo.push(sample);
    this.gate.set(id, sample);
  }

  // -------------------------------------------------------------------------
  // The tick. Hardware runs Lua on core 1 and the LED engine on core 0,
  // unsynchronised at the same 100 Hz; any fixed interleave is within
  // its race tolerance. The sim pins one order: touch pop, timer, then
  // grid_led_tick, and the tests pin it too.

  tick(): void {
    const sample = this.fifo.shift();
    if (typeof sample !== "undefined") this.handleSample(sample);

    this.msClock += 10;
    if (this.timerPeriod !== null && this.msClock >= this.timerDeadline) {
      // Re-arm FIRST, exactly like the emitted gtt-first bodies.
      this.timerDeadline = this.msClock + this.timerPeriod;
      this.runTimerBody();
    }

    this.ledTick();
    this._tickCount += 1;
    this.dirty = true;
  }

  run(n: number): void {
    for (let i = 0; i < n; i++) this.tick();
  }

  // grid_led_tick verbatim (grid_led.c:191-211): phase advances BEFORE
  // the last-tick freeze, so timeout ticks apply exactly timeout
  // increments of fre, and on expiry the phase FREEZES where it landed.
  // Nothing resets; timeout 0 still renders every pass.
  private ledTick(): void {
    for (const L of this.layers) {
      if (L.timeout) {
        L.pha = (L.pha + L.fre) & 255;
        if (L.timeout === 1) L.fre = 0;
        L.timeout -= 1;
      }
    }
  }

  // The Timer body, LED-relevant parts only. Slow keeper: re-arm then
  // glt(a, layer, 65535) on the layers the plan animates, so look layers
  // never reach timeout 0 while the timer lives. Watchdog (zones): the
  // keeper runs once every 15000 fires, then per-contact staleness: a
  // contact whose counter passed 100 gets its note-off and its slots
  // cleared. The stale expiry does NOT repaint the layer 2 highlight;
  // if the expired contact's zone was lit it stays lit. That is honest
  // hardware behaviour and any fix belongs in the compiler.
  private runTimerBody(): void {
    const plan = this._plan;
    const hasKeeper = plan.animates1 || plan.animates2;

    if (!this.watchdog) {
      if (hasKeeper) this.refreshTimeouts();
      return;
    }

    if (hasKeeper) {
      this.keeperCounter += 1;
      if (this.keeperCounter > 15000) {
        this.keeperCounter = 0;
        this.refreshTimeouts();
      }
    }

    // watchdogBody: s.p[i] = t + 1 first, then the expiry test reads the
    // OLD t, so expiry lands on the fire after t exceeds 100.
    const s = this._state;
    const ch = s.sends.channel - 1;
    for (const [i, t] of Array.from(this.zoneAge.entries())) {
      this.zoneAge.set(i, t + 1);
      if (t > 100) {
        const zone = this.zoneNotes.get(i);
        if (typeof zone !== "undefined") {
          this.emitMidi(ch, 128, this.zoneNote(zone), 0, 0);
          this.zoneNotes.delete(i);
        }
        this.zoneAge.delete(i);
      }
    }
  }

  private refreshTimeouts(): void {
    for (let h = 0; h < CELLS; h++) {
      if (this._plan.animates1) this.glt(h, 1, 65535);
      if (this._plan.animates2) this.glt(h, 2, 65535);
    }
  }

  private emitMidi(
    ch: number,
    cmd: number,
    p1: number,
    p2: number,
    mode: number,
  ): void {
    this.onMidi?.({ ch, cmd, p1, p2, mode });
  }

  // -------------------------------------------------------------------------
  // The compiled touch handler, per sample: touch paint first, then the
  // sends paint, matching the J(paint, send, seam) order in compile().

  private handleSample(sm: Sample): void {
    const s = this._state;
    if (this._plan.sends && s.sends.kind === "trackpad") return;
    if (this._plan.touch) this.touchPaint(sm);
    if (this._plan.sends) this.sendsPaint(sm);
  }

  // x*9//d for the cell under the finger; d is 1024 when the compiled
  // state widens the axes (hiRes and not faders), else 128. Mirrors
  // axisDivisor in _pad.ts exactly, including its independence from the
  // layer plan, because the emitted handler divides the same way.
  private axisDivisor(): number {
    const s = this._state.sends;
    return s.hiRes && s.kind !== "faders" ? 1024 : 128;
  }

  private touchPaint(sm: Sample): void {
    const s = this._state;
    const d = this.axisDivisor();
    const decay = nearestDecay(s.touch.trailMs);

    switch (s.touch.kind) {
      case "none":
        return;

      case "comet":
        // No gate: every sample paints, including UP, exactly as
        // compiled. Firmware fades each cell independently so
        // multi-touch is correct for free.
        this.paintCells(sm, (h) => {
          this.glpfs(h, 1, 255, decay.rate, 0);
          this.glt(h, 1, decay.ticks);
        });
        return;

      case "perFinger": {
        // Five hues from one closed form: glc(a,1,A-i*B,i*B,C,1) with the
        // COEFFICIENTS brightness-scaled, mirroring the emitted
        // arithmetic rather than scaling the evaluated result.
        if (!live(sm.e)) return;
        const A = this.sc(255);
        const B = this.sc(60);
        const C = this.sc(128);
        this.paintCells(sm, (h) => {
          this.glc(h, 1, A - sm.i * B, sm.i * B, C, true);
          this.glpfs(h, 1, 255, decay.rate, 0);
          this.glt(h, 1, decay.ticks);
        });
        return;
      }

      case "bloom": {
        if (sm.e !== EVT_DOWN) return;
        // 255 - sqrt(dist)*22//1 per cell, forward rate 4, a short
        // timeout: clamp(round(trailMs/10), 16, 200) ticks. At expiry
        // every cell freezes at start + 4*ticks mod 256; with the
        // default 420 ms the centre freezes at 167, mid-bright. That is
        // what hardware does and the preview must show it, not fix it.
        const ticks = Math.min(
          Math.max(Math.round(s.touch.trailMs / 10), 16),
          200,
        );
        const u = Math.floor((sm.x * 9) / d);
        const v = Math.floor((sm.y * 9) / d);
        for (let n = 0; n < CELLS; n++) {
          const h = this.hwOf(n);
          const p = (n % GRID) - u;
          const q = Math.floor(n / GRID) - v;
          const phase = 255 - Math.floor(Math.sqrt(p * p + q * q) * 22);
          this.glpfs(h, 1, phase, 4, 0);
          this.glt(h, 1, ticks);
        }
        return;
      }

      case "glow": {
        // One slot (s.l): clear the old cell, then track or forget. No
        // timeout, static phases, so a held motionless finger stays lit
        // here where the comet's dot fades.
        if (this.glowCell !== null) {
          this.glp(this.hwOf(this.glowCell), 1, 0);
        }
        if (ended(sm.e)) {
          this.glowCell = null;
        } else {
          this.glowCell =
            Math.floor((sm.x * 9) / d) + Math.floor((sm.y * 9) / d) * GRID;
          this.glp(this.hwOf(this.glowCell), 1, 255);
        }
        return;
      }

      case "disturb": {
        // Phase 255 into the Look's own layer 2, a 3x3 patch clipped to
        // the grid so touching column 0 cannot light a stray cell on the
        // far side of the row above.
        const u = Math.floor((sm.x * 9) / d);
        const v = Math.floor((sm.y * 9) / d);
        for (let j = -1; j <= 1; j++) {
          for (let k = -1; k <= 1; k++) {
            const p = u + k;
            const q = v + j;
            if (p >= 0 && p < GRID && q >= 0 && q < GRID) {
              this.glp(this.hwOf(p + q * GRID), 2, 255);
            }
          }
        }
        return;
      }
    }
  }

  // paintCells from the emitter: brush 1 paints the single cell, brush 2
  // clamps the column and row to 7 and paints the 2x2 at (u+k, v+j).
  // Glow never takes the wide brush.
  private paintCells(sm: Sample, paint: (h: number) => void): void {
    const s = this._state;
    const d = this.axisDivisor();
    if (s.touch.brush === 2 && s.touch.kind !== "glow") {
      const u = Math.min(Math.floor((sm.x * 9) / d), 7);
      const v = Math.min(Math.floor((sm.y * 9) / d), 7);
      for (let j = 0; j <= 1; j++) {
        for (let k = 0; k <= 1; k++) {
          paint(this.hwOf(u + k + (v + j) * GRID));
        }
      }
      return;
    }
    const n =
      Math.floor((sm.x * 9) / d) + Math.floor((sm.y * 9) / d) * GRID;
    paint(this.hwOf(n));
  }

  // -------------------------------------------------------------------------
  // The compiled sends handler (sendsPaint in _pad.ts): MIDI through the
  // onMidi sink, LED writes only when the picture is visible.

  private sendsPaint(sm: Sample): void {
    const s = this._state;
    switch (s.sends.kind) {
      case "xy":
        this.fingerWrap(sm, () => this.xyBody(sm));
        // The spring LED story runs OUTSIDE the first-finger gate,
        // mirroring the emitted order: any contact's end re-parks the
        // picture the unwrapped glow paint may have doused.
        this.springLedOnEnd(sm);
        return;
      case "zones":
        this.fingerWrap(sm, () => this.zonesBody(sm));
        return;
      case "faders":
        this.fingerWrap(sm, () => this.fadersBody(sm));
        return;
      case "dial":
        // Normalise pins the dial to first-finger, so fingerWrap applies.
        // The compiled wrap additionally clears s.a on end of contact,
        // which dialBody reproduces at its own tail.
        this.fingerWrap(sm, () => this.dialBody(sm));
        return;
      default:
        return;
    }
  }

  // "First finger": claim on DOWN when free, run the body only for the
  // claimant, release on its end. The claim happens on the same sample,
  // so the claiming DOWN itself passes the gate. 9 claims too: a fast
  // DOWNUP tap has no separate DOWN, and the same-sample release keeps
  // the slot from sticking. "any"/"each" add none.
  private fingerWrap(sm: Sample, body: () => void): void {
    if (this._state.sends.fingers !== "first") {
      body();
      return;
    }
    if ((sm.e === EVT_DOWN || sm.e === EVT_TAP) && this.firstFinger === null) {
      this.firstFinger = sm.i;
    }
    if (sm.i === this.firstFinger) {
      body();
      if (ended(sm.e)) this.firstFinger = null;
    }
  }

  private phasePass(e: number): boolean {
    const phase = this._state.sends.phase;
    if (phase === "press") return e === EVT_DOWN;
    if (phase === "held") return e === EVT_MOVE || e === EVT_DOWN;
    return ended(e);
  }

  private axisValue(sm: Sample, axis: "x" | "y"): number {
    const s = this._state.sends;
    const invert = axis === "x" ? s.invertX : s.invertY;
    const raw = axis === "x" ? sm.x : sm.y;
    return invert ? this.axisDivisor() - 1 - raw : raw;
  }

  private xyBody(sm: Sample): void {
    const s = this._state.sends;
    const ch = s.channel - 1;
    const mode = s.hiRes ? 1 : 0;
    const scale = (t: number) =>
      s.hiRes ? Math.floor((t * 16383) / 1023) : t;
    // The same effectiveAxes the emitter reads, so the sim and a solo
    // audition can never disagree about which controller leaves the pad.
    // Left-right stays ccBase and up-down ccBase + 1 in every mode.
    const ax = effectiveAxes(this._state);
    // The bend lane (xyBody's bendLive twin): standard resolution rides
    // the MSB directly, fine resolution scales first and splits.
    const bendLive = (t: number) => {
      if (s.hiRes) {
        const b = scale(t);
        this.emitMidi(ch, 224, b % 128, Math.floor(b / 128), 0);
      } else {
        this.emitMidi(ch, 224, 0, t, 0);
      }
    };
    if (this.phasePass(sm.e)) {
      if (ax !== "y") {
        if (s.bend === "x") bendLive(this.axisValue(sm, "x"));
        else {
          this.emitMidi(
            ch,
            176,
            s.ccBase,
            scale(this.axisValue(sm, "x")),
            mode,
          );
        }
      }
      if (ax !== "x") {
        if (s.bend === "y") bendLive(this.axisValue(sm, "y"));
        else {
          this.emitMidi(
            ch,
            176,
            s.ccBase + 1,
            scale(this.axisValue(sm, "y")),
            mode,
          );
        }
      }
    }
    // The spring's end path: exact rest literals, never scaled positions,
    // then the LED story when the plan allows one.
    if (s.spring && ended(sm.e)) {
      const ccRest = s.springTo === "centre" ? (s.hiRes ? 8192 : 64) : 0;
      if (ax !== "y") {
        if (s.bend === "x") this.emitMidi(ch, 224, 0, 64, 0);
        else this.emitMidi(ch, 176, s.ccBase, ccRest, mode);
      }
      if (ax !== "x") {
        if (s.bend === "y") this.emitMidi(ch, 224, 0, 64, 0);
        else this.emitMidi(ch, 176, s.ccBase + 1, ccRest, mode);
      }
    }
  }

  // The emitted spring pulse block that sits after the finger gate:
  // every contact's end restores the home picture.
  private springLedOnEnd(sm: Sample): void {
    if (!this._state.sends.spring || !ended(sm.e)) return;
    const led = springLed(this._state, this._plan);
    if (typeof led === "undefined") return;
    const cell = springRestCell(this._state);
    if (led === "glow") {
      this.glowCell = cell;
      this.glp(this.hwOf(cell), 1, 255);
    } else {
      const decay = nearestDecay(this._state.touch.trailMs);
      this.glpfs(this.hwOf(cell), 1, 255, decay.rate, 0);
      this.glt(this.hwOf(cell), 1, decay.ticks);
    }
  }

  // Zone of a touch sample (zoneStatements in _pad.ts): rows order is
  // zx + zy*g, columns swaps the axes, snake mirrors odd zone rows.
  private touchZone(sm: Sample): number {
    const s = this._state.sends;
    const g = this.gridDiv();
    const d = this.axisDivisor();
    const zx = Math.floor((this.axisValue(sm, "x") * g) / d);
    const zy = Math.floor((this.axisValue(sm, "y") * g) / d);
    if (s.order === "snake") {
      return zy % 2 === 1 ? zy * g + (g - 1) - zx : zy * g + zx;
    }
    return s.order === "columns" ? zy + zx * g : zx + zy * g;
  }

  // The 4x4 zone's dot cell (dotExpr in _pad.ts): the inverse of the
  // order mapping, then the odd intersection (2*zx+1, 2*zy+1).
  private dotCellOf(z: number): number {
    const s = this._state.sends;
    let zx = z % 4;
    let zy = Math.floor(z / 4);
    if (s.order === "columns") {
      zx = Math.floor(z / 4);
      zy = z % 4;
    } else if (s.order === "snake") {
      zx = zy % 2 === 1 ? 3 - (z % 4) : z % 4;
    }
    return zx * 2 + zy * 18 + 10;
  }

  // Zone of an LED cell (ledZoneExpr in _pad.ts), for the highlight
  // repaint. Must agree with touchZone at all nine LED centres, which
  // both do because the compiler chose the terms that way.
  private cellZoneOf(n: number): number {
    const s = this._state.sends;
    const g = this.gridDiv();
    const zx = this.ledZoneTerm(n % GRID);
    const zy = this.ledZoneTerm(Math.floor(n / GRID));
    if (s.order === "snake") {
      return zy % 2 === 1 ? zy * g + (g - 1) - zx : zy * g + zx;
    }
    return s.order === "columns" ? zy + zx * g : zx + zy * g;
  }

  // The note a zone plays (the emitter's note() twin): the baked table
  // when scaled, plain baseNote + z when chromatic.
  private zoneNote(z: number): number {
    return typeof this.noteTable !== "undefined"
      ? this.noteTable[z]
      : this._state.sends.baseNote + z;
  }

  private zonesBody(sm: Sample): void {
    const s = this._state.sends;
    const ch = s.channel - 1;

    if (s.toggle) {
      // The latch: only presses count, the fast DOWNUP tap included.
      if (sm.e !== EVT_DOWN && sm.e !== EVT_TAP) return;
      const z = this.touchZone(sm);
      const on = !this.zoneLatch.has(z);
      if (on) this.zoneLatch.add(z);
      else this.zoneLatch.delete(z);
      if (on) this.emitMidi(ch, 144, this.zoneNote(z), s.velocity, 0);
      else this.emitMidi(ch, 128, this.zoneNote(z), 0, 0);
      if (s.showGrid) {
        if (this.gridDiv() === 4) {
          this.glp(this.hwOf(this.dotCellOf(z)), 2, on ? 255 : 0);
        } else {
          for (let m = 0; m < CELLS; m++) {
            if (this.cellZoneOf(m) === z) {
              this.glp(this.hwOf(m), 2, on ? 255 : 0);
            }
          }
        }
      }
      return;
    }

    let z: number | null = this.touchZone(sm);
    if (ended(sm.e)) z = null;
    const o = this.zoneNotes.has(sm.i) ? this.zoneNotes.get(sm.i)! : null;
    if (o !== z) {
      // Note-off before note-on, in one callback: sliding between zones
      // gives legato for free.
      if (o !== null) this.emitMidi(ch, 128, this.zoneNote(o), 0, 0);
      if (z !== null) this.emitMidi(ch, 144, this.zoneNote(z), s.velocity, 0);
      if (z === null) this.zoneNotes.delete(sm.i);
      else this.zoneNotes.set(sm.i, z);
      if (s.showGrid) {
        // Known caveat carried on purpose: the repaint keys on the zone,
        // not on a contact count, so two fingers in one zone lose the
        // highlight when the first of them leaves. The MIDI stays right.
        if (this.gridDiv() === 4) {
          if (o !== null) this.glp(this.hwOf(this.dotCellOf(o)), 2, 0);
          if (z !== null) this.glp(this.hwOf(this.dotCellOf(z)), 2, 255);
        } else {
          for (let m = 0; m < CELLS; m++) {
            const q = this.cellZoneOf(m);
            if (q === o || q === z) {
              this.glp(this.hwOf(m), 2, q === z ? 255 : 0);
            }
          }
        }
      }
    }
    // The watchdog freshness slot updates on EVERY sample, outside the
    // zone-change guard, so a live moving finger never goes stale.
    if (this.watchdog) {
      if (ended(sm.e)) this.zoneAge.delete(sm.i);
      else this.zoneAge.set(sm.i, 0);
    }
  }

  private fadersBody(sm: Sample): void {
    if (!this.phasePass(sm.e)) return;
    const s = this._state.sends;
    const ch = s.channel - 1;
    const count = s.faders === 3 ? 3 : 4;
    const d = this.axisDivisor();
    const f = Math.floor((this.axisValue(sm, "x") * count) / d);
    const v = s.invertY ? sm.y : 127 - sm.y;
    // A solo guards only the MIDI, exactly like the compiled if f==N
    // wrapper: the LED picture below stays live for every fader.
    const soloFader = /^fader\.(\d+)$/.exec(this._state.soloStream ?? "");
    if (soloFader === null || Number(soloFader[1]) === f) {
      this.emitMidi(ch, 176, s.ccBase + f, v, 0);
    }
    if (!s.showGrid) return;
    // (v + 1) * 9 // 128 is exact at both ends: zero rows at value 0 and
    // all nine at 127, which the naive v*9//127 does not manage.
    const l = Math.floor(((v + 1) * 9) / 128);
    if (s.layout === "blocks") {
      for (let n = 0; n < CELLS; n++) {
        if (Math.floor(((n % GRID) * 4) / GRID) === f) {
          this.glp(this.hwOf(n), 1, 8 - Math.floor(n / GRID) < l ? 255 : 0);
        }
      }
      return;
    }
    const k = count === 3 ? 3 : 2;
    for (let n = 0; n < CELLS; n++) {
      if (n % GRID === f * k + 1) {
        const w = 8 - Math.floor(n / GRID) < l ? 255 : 0;
        const h = this.hwOf(n);
        this.glp(h, 1, w);
        this.glp(h, 2, w);
      }
    }
  }

  // The compiled dial body (dialPaint in _pad.ts), transcribed literally.
  // Math.atan2(v, u) in JS equals Lua math.atan(v, u); Math.floor matches
  // Lua // because both floor toward negative infinity (never Math.trunc
  // here, the residual maths goes negative). The dial writes no LEDs, so
  // there is nothing for the render path to mirror and the preview shows
  // the card's Look and Touch sheets alone, exactly like xy.
  private dialBody(sm: Sample): void {
    const s = this._state.sends;
    const solo = this._state.soloStream;
    const ch = s.channel - 1;
    const K = DIAL_SENSE_TABLE[s.dialSense - 1];
    const u = 2 * sm.x - 127;
    const v = 2 * sm.y - 127;
    const q = u * u + v * v;
    if (q > DIAL_DEADZONE_R2) {
      const a = Math.floor(Math.atan2(v, u) * DIAL_ATAN_SCALE);
      // s.a or a: the first live sample after touch-down or deadzone-exit
      // is a zero delta, the no-jump reset.
      let d = a - (this.dialPrev === null ? a : this.dialPrev);
      this.dialPrev = a;
      // Anything beyond half a turn is a seam crossing.
      if (d > DIAL_HALF_TURN) d -= DIAL_FINE_PER_TURN;
      else if (d < -DIAL_HALF_TURN) d += DIAL_FINE_PER_TURN;
      this.dialResidual += d;
      const n = Math.floor((this.dialResidual + K / 2) / K);
      if (n !== 0) {
        this.dialResidual -= n * K;
        if (s.dialMode === "relative") {
          if (solo !== "dial.radius") {
            const p2 = Math.min(Math.max(64 + n, 1), 127);
            this.emitMidi(ch, 176, s.ccBase, p2, 0);
          }
        } else {
          const w = Math.min(Math.max(this.dialValue + n, 0), 127);
          if (w !== this.dialValue) {
            this.dialValue = w;
            if (solo !== "dial.radius") {
              this.emitMidi(ch, 176, s.ccBase, w, 0);
            }
          }
        }
      }
      if (s.dialRadius && solo !== "dial.turn") {
        // glim(math.sqrt(q)//1,0,127): radius in doubled units, 127 at an
        // edge midpoint, clamped at the corners, change-gated on s.r.
        const r = Math.min(Math.floor(Math.sqrt(q)), 127);
        if (r !== this.dialRadiusLast) {
          this.dialRadiusLast = r;
          this.emitMidi(ch, 176, s.ccBase + 1, r, 0);
        }
      }
    } else {
      // Inside the deadzone the previous angle clears: crossing the
      // centre flips the angle by half a turn, so exit re-baselines.
      this.dialPrev = null;
    }
    // The compiled wrap's ENDED branch clears s.a beside s.f; the
    // residual and the absolute value survive lifts on purpose.
    if (ended(sm.e)) this.dialPrev = null;
  }

  // -------------------------------------------------------------------------
  // Output. 243 bytes, R,G,B per cell in LOGICAL row-major screen order
  // (cell 0 is top-left). The C framebuffer is G,R,B because the strip is
  // a WS2812; nothing downstream of the sim is, so the sim deviates on
  // byte order deliberately. Rendered lazily on access, cached until the
  // next mutation; laziness is unobservable because render reads only
  // current layer state.

  get frame(): Uint8Array {
    if (this.dirty) {
      this.render();
      this.dirty = false;
    }
    return this.frameBuf;
  }

  // True while any layer still counts down with a nonzero rate, i.e.
  // while ticking can change the picture on its own. The panel's loop
  // uses this to stop stepping engines whose frame is settled: the
  // instrument cards after their static Setup picture, and any card
  // whose trails have expired. A layer with fre 0 still counts its
  // timeout down but never moves its phase, so it does not qualify.
  get animating(): boolean {
    for (const L of this.layers) {
      if (L.timeout > 0 && L.fre !== 0) return true;
    }
    return false;
  }

  private render(): void {
    for (let n = 0; n < CELLS; n++) {
      const h = this.hwOf(n);
      let r = 0;
      let g = 0;
      let b = 0;
      for (let layer = 0; layer < LAYER_COUNT; layer++) {
        const L = this.layers[h + CELLS * layer];
        const inten = shapeIntensity(L.sha, L.pha);
        const [wn, wd, wx] = weightsOf(inten);
        r += L.min[0] * wn + L.mid[0] * wd + L.max[0] * wx;
        g += L.min[1] * wn + L.mid[1] * wd + L.max[1] * wx;
        b += L.min[2] * wn + L.mid[2] * wd + L.max[2] * wx;
      }
      // The single divide by 512 happens AFTER the layer sum, so layers
      // ADD and one layer caps at 254/512 of the asked colour. The only
      // saturation is the final clamp to 255.
      this.frameBuf[n * 3] = Math.min(255, Math.floor(r / 512));
      this.frameBuf[n * 3 + 1] = Math.min(255, Math.floor(g / 512));
      this.frameBuf[n * 3 + 2] = Math.min(255, Math.floor(b / 512));
    }
  }

  // -------------------------------------------------------------------------
  // Test hooks. layer() reads one layer's raw fields by HARDWARE index;
  // pokeLayer() writes them directly so the engine unit vectors can pin
  // the render and tick maths without a compiled state in the way. Both
  // throw on bad indices because a mistyped test index is a test bug,
  // not a firmware call to silently ignore.

  layer(
    hw: number,
    layer: 0 | 1 | 2,
  ): {
    min: Rgb3;
    mid: Rgb3;
    max: Rgb3;
    pha: number;
    fre: number;
    sha: number;
    timeout: number;
  } {
    const L = this.layerAt(hw, layer);
    if (typeof L === "undefined") {
      throw new Error(`layer(${hw}, ${layer}) is out of range`);
    }
    return {
      min: [...L.min],
      mid: [...L.mid],
      max: [...L.max],
      pha: L.pha,
      fre: L.fre,
      sha: L.sha,
      timeout: L.timeout,
    };
  }

  pokeLayer(
    hw: number,
    layer: 0 | 1 | 2,
    patch: Partial<{
      min: Rgb3;
      mid: Rgb3;
      max: Rgb3;
      pha: number;
      fre: number;
      sha: number;
      timeout: number;
    }>,
  ): void {
    const L = this.layerAt(hw, layer);
    if (typeof L === "undefined") {
      throw new Error(`pokeLayer(${hw}, ${layer}) is out of range`);
    }
    if (typeof patch.min !== "undefined") L.min = [...patch.min];
    if (typeof patch.mid !== "undefined") L.mid = [...patch.mid];
    if (typeof patch.max !== "undefined") L.max = [...patch.max];
    if (typeof patch.pha !== "undefined") L.pha = wrapU8(patch.pha);
    if (typeof patch.fre !== "undefined") L.fre = wrapU8(patch.fre);
    if (typeof patch.sha !== "undefined") L.sha = wrapU8(patch.sha);
    if (typeof patch.timeout !== "undefined") {
      L.timeout = wrapU16(patch.timeout);
    }
    this.dirty = true;
  }
}

// Drift's per-column ramp, mirroring rampChannel in _pad.ts exactly: the
// emitter writes lo + (d*x)//8 for a rising channel but lo - (|d|*x)//8
// for a falling one, and under Lua floor those differ from a single
// signed floor division, so the sim reproduces the emitted arithmetic
// rather than the intuitive formula.
function driftRamp(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  x: number,
): Rgb3 {
  const channel = (lo: number, hi: number): number => {
    const dd = hi - lo;
    if (dd === 0) return lo;
    if (dd > 0) return lo + Math.floor((dd * x) / 8);
    return lo - Math.floor((-dd * x) / 8);
  };
  return [channel(a.r, b.r), channel(a.g, b.g), channel(a.b, b.b)];
}
