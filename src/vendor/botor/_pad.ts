// Vendored from sabotond-dev/botor
//   path:   src/renderer/main/zona/_pad.ts
//   commit: a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c
//   synced: 2026-09-02
// Modified for HANGAR: one mechanical delta (the RGB type is inlined; upstream
//   line 37 was a type-only import from ../../config-blocks/_screen) plus the
//   deliberate divergences enumerated, with a reason and a date, in
//   src/lib/fidelity/upstream-manifest.json. That file is the authority; this
//   line is not a second copy of it.
// Original copyright and licence (GNU GPL v3 or later) retained below.

// The ZONA pad compiler. One typed state object per module per page
// becomes exactly three actions across two events: the generated Setup
// body, the user's own code, and the Timer body. State travels in the
// first action's marker name (the stamp) rather than in the Lua, because
// the savings that make the published costs true - merged 81-LED loops,
// inlined glag, one-character locals - destroy the feature boundaries a
// parser would need. The body is output; the stamp is the record.
//
// Hardware-verified orientation (settled on a real ZONA): logical (0,0)
// is the TOP-LEFT LED, +x runs right, +y runs DOWN, and
// led_address_get(0, x + y*9) is plain row-major. Touch and LED axes
// agree. No axis flips are needed anywhere. ZONA.svelte:88-91 looks like
// a contradiction and is not: it un-serpentines the HARDWARE store index
// for the picture, while led_address_get takes a LOGICAL index and does
// the serpentine lookup inside firmware.
//
// Three traps are unbuildable here, not warned about. No code path emits
// `e == 5` (9 DOWNUP is a fast tap with no separate UP, so "contact
// ended" is always `e == 3 or e >= 5`), no code path emits
// `if i > 0 then return end` (firmware never remaps contact slots, so
// that gate freezes the pointer the moment finger 0 lifts first), and no
// code path emits a bare `/` at all - every division is `//` and every
// math.sqrt or math.atan result is closed with `// 1`, because Lua 5.5
// with LUA_FLOORN2I=F2Ieq turns a fractional argument to a firmware call
// silently into 0.
//
// Two structural rules follow. The generated touch handler contains no
// `return` token at all: every guard is a positive `if` wrapper, which is
// both cheaper than a return guard and keeps the user seam reachable on
// every sample. And no body ever sets phase on a layer it has not given a
// colour stop, because a layer with no colour renders pure black and such
// a body is a silent no-op.

import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";
// Type-only, so nothing from the screen module is pulled in at runtime and
// this file stays importable in a headless test.
export type RGB = { r: number; g: number; b: number };

// ---------------------------------------------------------------------------
// Readiness.
//
// GridScript.compressScript throws when the WASM Lua formatter has not
// been initialised, but checkSyntax merely returns FALSE. A compiler that
// validated before initLuaFormatter() resolved would report every correct
// body as broken and the panel would say the pad is dead when it is fine.
// So readiness is an explicit gate, probed once and cached.

let formatterReady = false;
let readyPromise: Promise<void> | undefined;

export function padCompilerReady(): Promise<void> {
  if (typeof readyPromise === "undefined") {
    readyPromise = initLuaFormatter().then(() => {
      formatterReady = true;
    });
  }
  return readyPromise;
}

export function isPadCompilerReady(): boolean {
  if (formatterReady) return true;
  formatterReady = GridScript.checkSyntax("local a=1");
  return formatterReady;
}

export function assertPadCompilerReady(): void {
  if (!isPadCompilerReady()) {
    throw new Error(
      "The Lua formatter is not initialised. Await padCompilerReady() first.",
    );
  }
}

// ---------------------------------------------------------------------------
// Geometry.

export const GRID = 9;
export const CELLS = 81;

export type Calib = { rot: 0 | 1 | 2 | 3; flipX: boolean; flipY: boolean };

// Measured, not assumed. The "unmeasured" arm the draft carried is gone:
// keeping it would force a null check through every generated expression
// for a state that no longer exists.
export const CALIB_IDENTITY: Calib = { rot: 0, flipX: false, flipY: false };

export function isIdentityCalib(c: Calib): boolean {
  return c.rot === 0 && !c.flipX && !c.flipY;
}

export function cellIndex(x: number, y: number, calib?: Calib): number {
  const c = calib ?? CALIB_IDENTITY;
  let cx = x;
  let cy = y;
  for (let i = 0; i < c.rot; i++) {
    const nx = GRID - 1 - cy;
    cy = cx;
    cx = nx;
  }
  if (c.flipX) cx = GRID - 1 - cx;
  if (c.flipY) cy = GRID - 1 - cy;
  return cx + cy * GRID;
}

// The hardware LED store is serpentine, and the mirrored rows are the
// EVEN ones: the firmware lookup table (grid_module.c:445-458) puts
// hardware 8 at logical (0,0) and hardware 0 at (8,0), and
// ZONA.svelte:88-100 un-serpentines the same way (row % 2 === 0). The
// compiler never calls this helper, so no emitted Lua depends on it, but
// the simulator renders through it and an odd-row mirror here would flip
// every preview horizontally.
export function ledIndexToCell(hardwareIndex: number): {
  x: number;
  y: number;
} {
  const y = Math.floor(hardwareIndex / GRID);
  const raw = hardwareIndex % GRID;
  return { x: y % 2 === 0 ? GRID - 1 - raw : raw, y };
}

// Touch column c's centre sits at x = c * 127 / 8: the touch endpoints map
// to the CENTRES of the outermost LEDs, not to the pad's physical edges.
// Every zone and fader claim in the recipe book holds under this
// convention and under no other, so the compiler and the simulator have to
// import the same constant or every zone thumbnail is a lie.
export function touchXofColumn(c: number, hiRes = false): number {
  return Math.round((c * (hiRes ? 1023 : 127)) / (GRID - 1));
}

export function zoneOf(
  x: number,
  y: number,
  div: number,
  hiRes = false,
): number {
  const d = hiRes ? 1024 : 128;
  return Math.floor((x * div) / d) + Math.floor((y * div) / d) * div;
}

export function cellZone(cell: number, div: number): number {
  const map = (v: number) =>
    div === 3
      ? Math.floor(v / 3)
      : div === 9
        ? v
        : Math.floor((v * div) / GRID);
  return map(cell % GRID) + map(Math.floor(cell / GRID)) * div;
}

// ---------------------------------------------------------------------------
// The state object.

export type LookKind =
  | "none"
  | "breathe"
  | "shimmer"
  | "scan"
  | "wave"
  | "swirl"
  | "ripple"
  | "drift"
  | "showpiece";

export type TouchKind =
  | "none"
  | "comet"
  | "perFinger"
  | "bloom"
  | "glow"
  | "disturb";

// GAP, chosen: "Highlight the pad" and "Fader levels" are not touch
// responses. They are conditional branches inside the Sends handler, so
// they live on the Sends sheet as showGrid / heldColour, not here.
// "dial" was appended, never inserted: the list order is a stamp payload
// and reordering it would orphan every stored pad.
export type SendKind = "none" | "xy" | "zones" | "faders" | "trackpad" | "dial";

// Which of the two xy controllers actually leave the pad. The controller
// numbers never move with this knob: left-right is always ccBase and
// up-down always ccBase + 1, in every mode, so a DAW mapping made in
// "both" survives a later switch to one axis and back.
export type AxesMode = "both" | "x" | "y";

// The dial's output convention. Relative is the DAW "64 is zero,
// bin-offset" form; absolute accumulates a 0..127 level with stops.
export type DialMode = "relative" | "absolute";

// Which xy axis leaves the pad as pitch bend instead of a CC. Never
// "both": bend is a per-channel lane, so two axes writing it would fight
// over one value and the DAW would see churn, not control. One field
// instead of two per-axis booleans makes that state unrepresentable.
export type BendAxis = "none" | "x" | "y";

// Where a sprung xy axis comes to rest on lift. The bend lane ignores
// this and always centres, because a pitch wheel resting anywhere but
// 8192 is a detuned instrument.
export type SpringTo = "centre" | "zero";

// The zones note mapping. Chromatic is the plain baseNote + z arithmetic;
// the others bake a per-zone note table at compile time, so the module
// never computes a scale degree.
export type ScaleKind = "chromatic" | "major" | "minor" | "pentatonic";

export type Axis = "x" | "y" | "diagonal" | "antidiagonal";

export type Order = "rows" | "columns" | "snake";

// GAP, chosen: no "tap". The only tap classifier in the corpus costs 428
// characters and claims the Timer, and the cheap `e == 9` form catches the
// DOWNUP fast tap while missing every ordinary tap. Shipping it would be a
// promise the hardware does not keep.
export type TouchPhase = "press" | "held" | "release";

export type Fingers = "first" | "any" | "each";

export type SlotOwner = "editor" | "user";

export type PadSlot = "touchHandler" | "timer" | "layer1" | "layer2";

export type PadOwnership = Record<PadSlot, SlotOwner>;

// C10's knobs, all length-neutral literal swaps. scrollUnits is the only
// scroll tunable: the bias in (s.w + b) // u and the residual s.w - d*u
// are both derived from it, because plain floor division breaks the two
// directions apart unless the bias is exactly half the divisor.
export type TrackpadTuning = {
  scrollInvert: boolean;
  scrollUnits: number;
  pointerCap: number;
  pointerHoldOff: number;
  tapTolerance: number;
  tapTicks: number;
  clickTicks: number;
};

export type PadState = {
  version: 1;

  // One knob for the whole card, applied to everything the state lights:
  // look colours, touch colours and the sends picture alike. A detent
  // 1..5 into BRIGHTNESS_TABLE, default 5 (Full). Scaling happens at
  // compile time on every emitted channel literal, so it costs no Lua and
  // no meaningful bytes; the floor is Dim, never black, because a card
  // claiming "Look: Wave" while rendering nothing is the silent-lie class
  // this compiler exists to abolish.
  brightness: number;

  look: {
    kind: LookKind;
    colour: RGB;
    // The gradient's far end on drift, and the counter-rotating layer on
    // the showpiece.
    colourB: RGB;
    speed: number; // 1..8, a detent into SPEED_TABLE
    reverse: boolean;
    // "hard" adds gld(a,2,0,0,0) to force the mid stop black: a narrow
    // bright peak with a soft tail, +14 characters. Shape 2 is never
    // emitted, because firmware cannot make its bar thinner than 4.6
    // columns and the tile would be lying about what it draws.
    edge: "soft" | "hard";
    axis: Axis;
    wavelength: number;
    arms: 1 | 2 | 3;
    spiral: boolean;
    ringsFrom: "centre" | "edge";
  };

  touch: {
    kind: TouchKind;
    // One colour, not five. Per-finger derives its five hues from the
    // contact index arithmetically (255-i*60, i*60, 128), which is why it
    // costs 60 characters rather than five literals.
    colour: RGB;
    trailMs: number; // snapped to DECAY_TABLE
    brush: 1 | 2;
  };

  sends: {
    kind: SendKind;
    grid: "3x3" | "4x4" | "9x9";
    faders: 3 | 4;
    layout: "blocks" | "rails";
    baseNote: number; // 0..127
    order: Order;
    channel: number; // 1..16, emitted as channel - 1
    ccBase: number; // 0..127
    velocity: number; // 1..127. "From position" has no measured recipe.
    phase: TouchPhase;
    fingers: Fingers;
    invertX: boolean;
    invertY: boolean;
    hiRes: boolean;
    // Read only when kind is "xy". Which axis leaves the pad; see AxesMode
    // for why the controller numbers never move with it.
    axes: AxesMode;
    // Read only when kind is "xy". On lift the pad snaps each sending
    // axis to its rest value, like a synth joystick; off keeps today's
    // hold behaviour. springTo is read only while spring is on.
    spring: boolean;
    springTo: SpringTo;
    // Read only when kind is "xy". The axis that rides the pitch-bend
    // lane; its controller number is skipped, not renumbered, so a later
    // switch back to CC never moves the other stream.
    bend: BendAxis;
    // Read only when kind is "zones", and only on the 3x3 and 4x4 grids:
    // an 81-entry table cannot fit the budget and an 81-zone scale is not
    // an instrument, so the 9x9 grid stays chromatic.
    scale: ScaleKind;
    // Read only when kind is "zones". A press latches the pad's note on,
    // the next press releases it, and the held picture stays lit while
    // latched. Sliding between pads does nothing here: only presses count.
    toggle: boolean;
    // Read only when kind is "dial".
    dialMode: DialMode;
    dialSense: number; // 1..8, a detent into DIAL_SENSE_TABLE
    // The optional second stream: distance from centre on ccBase + 1.
    // Default off so the card is single-stream for DAW mapping.
    dialRadius: boolean;
    // "Draw this control on the pad": the zone checkerboard, or the fader
    // rails and level bars. Claims LED layers, which is why it is mutually
    // exclusive with Look and Touch.
    showGrid: boolean;
    gridColour: RGB;
    heldColour: RGB;
    trackpad: TrackpadTuning;
  };

  enabled: { look: boolean; touch: boolean; sends: boolean };

  calib: Calib;
  // Per-slot detach, recording "Let it take over". Absent means every slot
  // belongs to the editor.
  owned?: Partial<PadOwnership>;
  // The shelf card this came from, cleared on any Adjust edit. When set,
  // the stamp is a short preset reference instead of a field dump, which
  // is what makes the trackpad card fit its own budget.
  preset?: string;
  // AUDITION-ONLY derived state for "Help your DAW learn": compile a
  // variant body that emits exactly this one stream. encodeStamp never
  // writes it, so the stamp always records the real card and readPad can
  // never mistake a solo leftover for the user's configuration; withChange,
  // fit and the ledger strip it before measuring.
  soloStream?: PadStreamId;
  // HANGAR divergence, plan 12.1-08b (see src/lib/fidelity/upstream-manifest.json).
  // When set, the module this state is written to carries HANGAR's touch
  // library in 255/0 and 255/6 (U, N, G, K in scope) and the touch handler
  // emits calls into it through the measured sensor map; the simulator
  // mirrors the same map with these knots. Absent (every BOTOR state, every
  // vendored preset): byte-identical output to upstream. Not encoded by
  // encodeStamp; carried by clonePadState and so by normalisePadState.
  touchLibrary?: { readonly kx: readonly number[]; readonly ky: readonly number[] };
};

// Structural stream ids: kind plus index, so they stay stable across
// tuning and across sessions. The solo feature and the DAW mappings it
// protects both depend on that stability.
export type PadStreamId =
  | "xy.x"
  | "xy.y"
  | `fader.${number}` // fader.0 .. fader.3
  | "zones"
  | "dial.turn"
  | "dial.radius";

// ---------------------------------------------------------------------------
// Domain tables.

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function byte(v: number): number {
  return clamp(Math.round(v), 0, 255);
}

// Detent to firmware rate. Cycle seconds = 2.56 / rate. Rate 1 is a hard
// floor because fre is an integer step; anything slower has to be re-armed
// from the Timer and costs Lua per tick.
export const SPEED_TABLE: readonly {
  step: number;
  rate: number;
  seconds: number;
}[] = [1, 2, 3, 4, 6, 8, 12, 16].map((rate, i) => ({
  step: i + 1,
  rate,
  seconds: Math.round(2560 / rate) / 1000,
}));

// (rate, ticks) pairs for a decaying one-shot on layer 1. Firmware applies
// `ticks` decrements of `step = 256 - rate` and then zeroes the rate, so a
// cell lands on `start - step*ticks` (mod 256) and FREEZES there for good.
// The start is therefore emitted as `step*ticks`, NOT as 255: every product
// here is in 248..254, so a start of 255 leaves a permanent residue of 1..7
// of 255 on every cell a finger crossed. HANGAR divergence, plan 11-04; see
// src/lib/fidelity/upstream-manifest.json.
export const DECAY_TABLE: readonly {
  ms: number;
  rate: number;
  ticks: number;
}[] = [
  { ms: 210, rate: 244, ticks: 21 },
  { ms: 230, rate: 245, ticks: 23 },
  { ms: 250, rate: 246, ticks: 25 },
  { ms: 280, rate: 247, ticks: 28 },
  { ms: 310, rate: 248, ticks: 31 },
  { ms: 360, rate: 249, ticks: 36 },
  { ms: 420, rate: 250, ticks: 42 },
  { ms: 500, rate: 251, ticks: 50 },
  { ms: 630, rate: 252, ticks: 63 },
  { ms: 840, rate: 253, ticks: 84 },
  { ms: 1270, rate: 254, ticks: 127 },
  { ms: 2540, rate: 255, ticks: 254 },
];

export function nearestDecay(ms: number): {
  ms: number;
  rate: number;
  ticks: number;
} {
  let best = DECAY_TABLE[0];
  for (const row of DECAY_TABLE) {
    if (Math.abs(row.ms - ms) < Math.abs(best.ms - ms)) best = row;
  }
  return best;
}

// Detent to brightness percent, with the plain word the panel shows.
// Detents rather than a free percent: state colours are already RGB444
// (quantiseColour below), so fine percent steps are an illusion; detents
// cost 3 stamp bits instead of 7; and a 5-level axis keeps the invariant
// sweep enumerable. The floor is 15 and never 0 so no card can claim a
// Look while rendering black, and at 15 percent no RGB444-quantised
// nonzero channel collapses to 0 (floor(17 * 15 / 100) = 2).
export const BRIGHTNESS_TABLE: readonly {
  step: number;
  pct: number;
  word: string;
}[] = [
  { step: 1, pct: 15, word: "Dim" },
  { step: 2, pct: 30, word: "Low" },
  { step: 3, pct: 50, word: "Half" },
  { step: 4, pct: 75, word: "Bright" },
  { step: 5, pct: 100, word: "Full" },
];

// The one place a channel value becomes an emitted number. Applied at the
// FINAL literal emission point, after every other colour derivation (after
// dim, after ramp endpoint selection, on each numeric coefficient of an
// arithmetic colour expression). floor(v * 100 / 100) === v exactly, so at
// the default detent every emitted body is byte-identical to an unscaled
// one. Nothing is ever scaled twice; nothing that is a phase, rate,
// wavelength or timeout is ever scaled.
export function scaleChannel(v: number, pct: number): number {
  return Math.floor((byte(v) * pct) / 100);
}

function briPct(s: PadState): number {
  return BRIGHTNESS_TABLE[clamp(Math.round(s.brightness), 1, 5) - 1].pct;
}

function scaleColour(c: RGB, pct: number): RGB {
  return {
    r: scaleChannel(c.r, pct),
    g: scaleChannel(c.g, pct),
    b: scaleChannel(c.b, pct),
  };
}

export function speedRate(step: number, reverse: boolean): number {
  const row = SPEED_TABLE[clamp(Math.round(step), 1, 8) - 1];
  return reverse ? 256 - row.rate : row.rate;
}

// A wavelength within a row stride of 256/9 = 28.4 aligns the wave with
// the grid and degenerates it into a vertical scan, so the user would get
// Scan while the card said Wave.
export const WAVELENGTH_MIN = 8;
export const WAVELENGTH_MAX = 45;
export const WAVELENGTH_EXCLUDED: readonly number[] = [27, 28, 29];

export function snapWavelength(w: number): number {
  const v = clamp(Math.round(w), WAVELENGTH_MIN, WAVELENGTH_MAX);
  return WAVELENGTH_EXCLUDED.includes(v) ? (v < 28 ? 26 : 30) : v;
}

// Colours are stored, and therefore shown, at the fidelity the stamp
// carries: 4 bits per channel. Quantising in the state rather than in the
// encoder is what makes decodeStamp(encodeStamp(s)) a real identity, and
// 4096 steps is invisible next to the 254/512 single-layer cap that the
// second swatch already warns about.
export function quantiseColour(c: RGB): RGB {
  const q = (v: number) => Math.round(byte(v) / 17) * 17;
  return { r: q(c.r), g: q(c.g), b: q(c.b) };
}

// The trackpad knobs are detents, not free numbers, so that the whole card
// still fits its own budget once a knob has been moved and the stamp
// becomes a field dump. Every table is eight entries, three bits each.
export const TRACKPAD_SCROLL_UNITS: readonly number[] = [
  32, 48, 64, 96, 128, 192, 256, 384,
];
export const TRACKPAD_POINTER_CAPS: readonly number[] = [
  16, 24, 32, 40, 48, 55, 60, 63,
];
export const TRACKPAD_TAP_TOLERANCE: readonly number[] = [
  40, 60, 80, 100, 120, 160, 220, 300,
];
export const TRACKPAD_TAP_TICKS: readonly number[] = [
  10, 15, 20, 25, 30, 40, 60, 90,
];

function snapTo(table: readonly number[], v: number): number {
  let best = table[0];
  for (const t of table) {
    if (Math.abs(t - v) < Math.abs(best - v)) best = t;
  }
  return best;
}

// The dial's fixed-point angle system, shared verbatim by the emitter and
// the simulator so the two cannot drift. Angles live in "fine units":
// a = math.atan(v, u) * 652 // 1 with 652 = round(4096 / 2pi), so one
// full revolution is 4096 fine units and a lands in (-2048, 2048]. Any
// raw delta beyond half a turn is a seam crossing and is corrected by a
// full turn. Coordinates are doubled (u = 2x - 127) so the pad's exact
// centre (63.5 in touch units) sits on integer 0 with perfect symmetry.
export const DIAL_FINE_PER_TURN = 4096;
export const DIAL_HALF_TURN = 2048;
export const DIAL_ATAN_SCALE = 652;
// Compared against u*u + v*v, no sqrt. 1444 = 38^2; 38 doubled units is
// 19 raw units, about 1.2 LED cells. Inside that circle one raw unit of
// jitter swings the angle by tens of degrees and the angle is meaningless
// at the centre, so those samples clear the previous angle instead: a
// finger crossing the centre flips the angle by half a turn, which is
// exactly the wrap correction's ambiguity point, and re-baselining on
// exit is the only honest behaviour.
export const DIAL_DEADZONE_R2 = 1444;
// Fine units per emitted tick, detents 1..8. Ticks per full turn is
// 4096 / K: 16, 21, 32, 43, 64, 85, 128, 256. Every entry is even, so
// the round-to-nearest bias K/2 is exact.
export const DIAL_SENSE_TABLE: readonly number[] = [
  256, 192, 128, 96, 64, 48, 32, 16,
];

// Scale degrees within one octave, ascending. The zone index walks the
// scale and wraps to the next octave, so a 3x3 major grid is one octave
// plus two steps and a 4x4 is two octaves plus two.
export const SCALE_DEGREES: Record<
  Exclude<ScaleKind, "chromatic">,
  readonly number[]
> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
};

// The highest base note whose LAST zone still lands on a legal note.
// normalise clamps baseNote against this, the same shape as maxCcBase:
// clamping the entries instead would bake several zones onto note 127,
// and then one zone's note-off silences another zone that is still
// latched and still lit, which is the cross-wire lie class this
// compiler exists to abolish.
export function zoneMaxBase(s: PadState): number {
  if (s.sends.kind !== "zones") return 127;
  const g = s.sends.grid === "3x3" ? 3 : s.sends.grid === "4x4" ? 4 : 9;
  const z = g * g - 1;
  if (s.sends.scale === "chromatic") return 127 - z;
  const deg = SCALE_DEGREES[s.sends.scale];
  return 127 - (12 * Math.floor(z / deg.length) + deg[z % deg.length]);
}

// The per-zone note table a scaled zones card bakes into Setup, or
// undefined when the plain baseNote + z arithmetic applies. The base
// clamp above guarantees every entry is already legal and strictly
// ascending; the min is a belt for un-normalised input.
export function zoneNotes(s: PadState): number[] | undefined {
  if (s.sends.kind !== "zones" || s.sends.scale === "chromatic") {
    return undefined;
  }
  const deg = SCALE_DEGREES[s.sends.scale];
  const g = s.sends.grid === "3x3" ? 3 : s.sends.grid === "4x4" ? 4 : 9;
  const out: number[] = [];
  for (let z = 0; z < g * g; z++) {
    const note =
      s.sends.baseNote + 12 * Math.floor(z / deg.length) + deg[z % deg.length];
    out.push(Math.min(127, note));
  }
  return out;
}

// The cell a sprung joystick comes home to, for the LED story: bend and
// centre-rest axes rest on the middle column or row, a zero-rest CC axis
// rests where its term reads zero, and an axis that does not send rests
// in the middle because the picture still needs a row to sit on.
export function springRestCell(s: PadState): number {
  const ax = effectiveAxes(s);
  const home = (axis: "x" | "y"): number => {
    const sends = axis === "x" ? ax !== "y" : ax !== "x";
    if (!sends) return 4;
    if (s.sends.bend === axis || s.sends.springTo === "centre") return 4;
    const invert = axis === "x" ? s.sends.invertX : s.sends.invertY;
    return invert ? 8 : 0;
  };
  return home("x") + home("y") * 9;
}

export const DEFAULT_TRACKPAD: TrackpadTuning = {
  scrollInvert: true,
  scrollUnits: 128,
  pointerCap: 63,
  pointerHoldOff: 4,
  tapTolerance: 120,
  tapTicks: 25,
  clickTicks: 4,
};

// Every default is the stateless option: comet over glow, one colour call
// over three, firmware fade over Lua fade, no fine resolution, no LED
// feedback on the sends. On this hardware the cheap option is also the
// correct one, so defaulting to it is not a compromise.
export const DEFAULT_PAD_STATE: PadState = {
  version: 1,
  brightness: 5,
  look: {
    kind: "wave",
    colour: { r: 0, g: 90, b: 255 },
    colourB: { r: 255, g: 60, b: 0 },
    speed: 2,
    reverse: false,
    edge: "soft",
    axis: "diagonal",
    wavelength: 15,
    arms: 1,
    spiral: false,
    ringsFrom: "centre",
  },
  touch: {
    kind: "comet",
    colour: { r: 255, g: 170, b: 40 },
    trailMs: 420,
    brush: 1,
  },
  sends: {
    kind: "none",
    grid: "3x3",
    faders: 4,
    layout: "rails",
    baseNote: 36,
    order: "rows",
    channel: 1,
    ccBase: 16,
    velocity: 100,
    phase: "held",
    fingers: "any",
    invertX: false,
    invertY: false,
    hiRes: false,
    axes: "both",
    spring: false,
    springTo: "centre",
    bend: "none",
    scale: "chromatic",
    toggle: false,
    dialMode: "relative",
    dialSense: 5,
    dialRadius: false,
    showGrid: false,
    gridColour: { r: 0, g: 70, b: 200 },
    heldColour: { r: 255, g: 140, b: 40 },
    trackpad: DEFAULT_TRACKPAD,
  },
  enabled: { look: true, touch: true, sends: true },
  calib: CALIB_IDENTITY,
};

export function clonePadState(s: PadState): PadState {
  return {
    version: 1,
    brightness: s.brightness,
    look: {
      ...s.look,
      colour: { ...s.look.colour },
      colourB: { ...s.look.colourB },
    },
    touch: { ...s.touch, colour: { ...s.touch.colour } },
    sends: {
      ...s.sends,
      gridColour: { ...s.sends.gridColour },
      heldColour: { ...s.sends.heldColour },
      trackpad: { ...s.sends.trackpad },
    },
    enabled: { ...s.enabled },
    calib: { ...s.calib },
    ...(typeof s.owned !== "undefined" ? { owned: { ...s.owned } } : {}),
    ...(typeof s.preset !== "undefined" ? { preset: s.preset } : {}),
    ...(typeof s.soloStream !== "undefined"
      ? { soloStream: s.soloStream }
      : {}),
    // HANGAR divergence, plan 12.1-08b: the library's knots travel with the
    // state, so a tuned or normalised copy still emits the calibrated calls.
    ...(typeof s.touchLibrary !== "undefined"
      ? { touchLibrary: { kx: [...s.touchLibrary.kx], ky: [...s.touchLibrary.ky] } }
      : {}),
  };
}

export function defaultState(): PadState {
  return clonePadState(DEFAULT_PAD_STATE);
}

// ---------------------------------------------------------------------------
// Lua emission primitives.
//
// Everything below builds statement lists and joins them with J, which
// inserts a separator only where the Lua lexer needs one. That makes the
// emitted body the minifier's own normal form, so compressScript is a
// fixed point of it and the measured cost equals the stored cost.

const WORD = /[A-Za-z0-9_]/;

function J(...parts: (string | undefined | false)[]): string {
  let out = "";
  for (const part of parts) {
    if (!part) continue;
    const prev = out[out.length - 1];
    if (
      out !== "" &&
      ((WORD.test(prev) && WORD.test(part[0])) ||
        // Two minus signs run together would open a comment.
        (prev === "-" && part[0] === "-"))
    ) {
      out += " ";
    }
    out += part;
  }
  return out;
}

// Every colour literal the compiler emits comes through here, which is
// what makes the brightness funnel a single place: pct is the compiled
// state's brightness percent, and at 100 the output is byte-identical to
// the unscaled channel.
function rgb(c: RGB, pct: number): string {
  return `${scaleChannel(c.r, pct)},${scaleChannel(c.g, pct)},${scaleChannel(c.b, pct)}`;
}

function dim(c: RGB, num: number, den: number): RGB {
  return {
    r: Math.floor((byte(c.r) * num) / den),
    g: Math.floor((byte(c.g) * num) / den),
    b: Math.floor((byte(c.b) * num) / den),
  };
}

// A linear ramp across the nine columns that lands exactly on `a` at
// column 0 and exactly on `b` at column 8, so no channel can leave 0..255
// and be silently truncated to a near-black cell by lua_tointeger.
function rampChannel(a: number, b: number, xv: string): string {
  const lo = byte(a);
  const hi = byte(b);
  const d = hi - lo;
  if (d === 0) return String(lo);
  if (lo === 0 && d > 0) return `${d}*${xv}//8`;
  return d > 0 ? `${lo}+${d}*${xv}//8` : `${lo}-${-d}*${xv}//8`;
}

function ramp(a: RGB, b: RGB, xv: string): string {
  return [
    rampChannel(a.r, b.r, xv),
    rampChannel(a.g, b.g, xv),
    rampChannel(a.b, b.b, xv),
  ].join(",");
}

// A positive wrapper, never a return guard. Cheaper than `if not c then
// return end` and it leaves the user seam at the end of the handler
// reachable on every sample rather than only on the ones that pass.
function wrapIf(cond: string | undefined, body: string): string {
  if (typeof cond === "undefined" || body === "") return body;
  return J(`if ${cond} then`, body, "end");
}

// The only expression the compiler ever uses for "this contact ended".
// `e == 5` alone leaks a stuck contact because code 9 (DOWNUP) is a fast
// tap that arrives as a single message with no separate UP.
//
// ENDED IS CORRECT AS WRITTEN AND IS NOT CHANGED BY HANGAR, at any of its
// ten interpolation sites. Code 9 IS an end - it is a press and a lift in
// one message - and every ENDED site is a release path: clearing a claimed
// finger slot, dropping a dial baseline, re-parking a spring, ending a
// trackpad contact. Making ENDED false for 9 would leave every one of them
// armed forever. What a fast tap loses is the PRESS half, and that lives in
// LIVE and in phaseCond, which is where HANGAR fixed it.
//
// LIVE, though, excluded code 9 outright: `e<5` is false for 9, so a fast
// tap painted nothing at all. Measured before the fix: PINWHEEL's perFinger
// trail wrote no layer record whatsoever on a tap, where a slow press wrote
// one. `or e>8` admits the tap; Lua binds `and` tighter than `or`, so this
// parses as `(e~=3 and e<5) or (e>8)`, which is what is wanted, and it is
// 7 characters where the bracketed form is 9. HANGAR divergence, plan
// 11-04; see src/lib/fidelity/upstream-manifest.json.
const ENDED = "e==3 or e>=5";
const LIVE = "e~=3 and e<5 or e>8";

export const SEAM_TOUCH = "if s.uh then s.uh(s,i,e,x,y)end";
export const SEAM_TIMER = "if s.ut then s.ut(s)end";

// s.u1 through s.u9 belong to the user. The compiler never emits them.
export const USER_SCRATCH = [
  "u1",
  "u2",
  "u3",
  "u4",
  "u5",
  "u6",
  "u7",
  "u8",
  "u9",
] as const;

// ---------------------------------------------------------------------------
// The merged arming loop.
//
// Look's layer-2 arming, Touch's layer-1 colour init and Sends' static LED
// picture all go through one `for` wrapper. That is worth 18 characters
// every time and it is why per-feature costs are not additive: the ledger
// has to measure differentially rather than sum a table.

type ArmLoop = {
  // A positional pattern needs the logical index, so the loop walks n and
  // resolves `local a = glag(0, n)`. A pattern that treats every LED alike
  // walks the hardware index directly and saves the lookup entirely.
  positional: boolean;
  extraNames: string[];
  extraInits: string[];
  statements: string[];
};

function emptyLoop(): ArmLoop {
  return { positional: false, extraNames: [], extraInits: [], statements: [] };
}

function mergeLoop(into: ArmLoop, add: ArmLoop | undefined): ArmLoop {
  if (typeof add === "undefined") return into;
  return {
    positional: into.positional || add.positional,
    extraNames: [...into.extraNames, ...add.extraNames],
    extraInits: [...into.extraInits, ...add.extraInits],
    statements: [...into.statements, ...add.statements],
  };
}

function loopIndex(loop: ArmLoop): string {
  return loop.positional ? "n" : "a";
}

function buildLoop(loop: ArmLoop): string {
  if (loop.statements.length === 0) return "";
  const body = J(...loop.statements);
  if (!loop.positional) {
    return J("for a=0,80 do", body, "end");
  }
  const names = ["a", ...loop.extraNames].join(",");
  const inits = ["glag(0,n)", ...loop.extraInits].join(",");
  return J("for n=0,80 do", `local ${names}=${inits}`, body, "end");
}

// ---------------------------------------------------------------------------
// Layer planning.
//
// Spec 2.1 says Sends uses no layer. That is true only of whole-pad XY and
// of note zones with the grid hidden: every visible Sends kind claims both
// LED layers, and the fader recipes drive them together deliberately to
// beat the 49.6 percent single-layer cap. So the three enable checkboxes
// cannot be independent booleans and the compiler resolves the conflict
// here, once, with a reason attached to every suppression.

export type PadSheet = "look" | "touch" | "sends";

export type LayerNote = {
  sheet: PadSheet;
  reason: string;
};

export type LayerPlan = {
  look: boolean;
  touch: boolean;
  sends: boolean;
  layer1: PadSheet | "none";
  layer2: PadSheet | "none";
  // A visible Sends control repaints its own LEDs, so the two-layer
  // keeper is not the Look's alone.
  animates1: boolean;
  animates2: boolean;
  notes: LayerNote[];
};

function sendsIsVisible(s: PadState): boolean {
  if (s.sends.kind === "zones") return s.sends.showGrid;
  if (s.sends.kind === "faders") return s.sends.showGrid;
  return false;
}

// The single definition of "this card lights something", read by
// canonicalise (which resets brightness when nothing does) and by the
// panel (which hides the Brightness knob then). Like the enabled flags it
// reads the pre-grounding claim: a look-none plus touch-disturb state
// answers true here although planLayers drops the touch sheet, and the
// panel avoids that edge by asking about the GROUNDED state, where
// grounding has flipped the enabled flag and the reset has re-run.
export function padLightsAnything(s: PadState): boolean {
  return (
    (s.enabled.look && s.look.kind !== "none") ||
    (s.enabled.touch && s.touch.kind !== "none") ||
    (s.enabled.sends && sendsIsVisible(s))
  );
}

function ownerOf(s: PadState, slot: PadSlot): SlotOwner {
  return s.owned?.[slot] ?? "editor";
}

export function planLayers(s: PadState): LayerPlan {
  const notes: LayerNote[] = [];
  const plan: LayerPlan = {
    look: s.enabled.look && s.look.kind !== "none",
    touch: s.enabled.touch && s.touch.kind !== "none",
    sends: s.enabled.sends && s.sends.kind !== "none",
    layer1: "none",
    layer2: "none",
    animates1: false,
    animates2: false,
    notes,
  };

  const drop = (sheet: PadSheet, reason: string) => {
    if (plan[sheet]) {
      plan[sheet] = false;
      notes.push({ sheet, reason });
    }
  };

  if (plan.sends && s.sends.kind === "trackpad") {
    drop("look", "The trackpad card uses the whole element on its own.");
    drop("touch", "The trackpad card uses the whole element on its own.");
  }

  const visible = plan.sends && sendsIsVisible(s);
  if (visible) {
    drop(
      "look",
      "The control is drawn on the pad, which uses both light layers.",
    );
    drop(
      "touch",
      "The control is drawn on the pad, which uses both light layers.",
    );
  }

  if (plan.look && s.look.kind === "showpiece") {
    drop("touch", "The two-layer look uses both light layers.");
  }

  // A layer with no colour stop renders pure black, so bending a
  // background that is not there is a silent no-op rather than a subtle
  // effect. Refuse to emit it.
  if (plan.touch && s.touch.kind === "disturb" && !plan.look) {
    drop("touch", "Bending the background needs a background to bend.");
  }

  if (ownerOf(s, "touchHandler") === "user") {
    drop("touch", "Your code owns the touch handler.");
    drop("sends", "Your code owns the touch handler.");
  }
  if (ownerOf(s, "layer1") === "user") {
    if (plan.touch && s.touch.kind !== "disturb") {
      drop("touch", "Your code owns light layer 1.");
    }
    if (visible) drop("sends", "Your code owns light layer 1.");
  }
  if (ownerOf(s, "layer2") === "user") {
    drop("look", "Your code owns light layer 2.");
    if (plan.touch && s.touch.kind === "disturb") {
      drop("touch", "Your code owns light layer 2.");
    }
  }

  if (plan.look) {
    plan.layer2 = "look";
    plan.animates2 = true;
    if (s.look.kind === "showpiece") {
      plan.layer1 = "look";
      plan.animates1 = true;
    }
  }
  if (plan.touch && plan.layer1 === "none" && s.touch.kind !== "disturb") {
    plan.layer1 = "touch";
  }
  if (visible) {
    plan.layer1 = "sends";
    plan.layer2 = "sends";
  }
  return plan;
}

// ---------------------------------------------------------------------------
// Look: layer 2, armed once, animated entirely in C at no Lua cost per
// frame. Every pattern is the same four calls with a different phase
// expression, which is why the whole Look wall is one template.
//
// glc(a, L, r, g, b, 1) sets min, mid and max from one colour and the
// trailing 1 forces min to black. It is 29 characters cheaper per loop
// than separate gln/gld/glx, so it is used everywhere except drift, whose
// stops are not on the c/20, c/2, c ratio.

const CONTINUOUS = "65535";

function lookLoop(s: PadState): ArmLoop | undefined {
  const l = s.look;
  const pct = briPct(s);
  const rate = speedRate(s.look.speed, s.look.reverse);
  const w = snapWavelength(l.wavelength);
  const colour = rgb(l.colour, pct);
  const hard = l.edge === "hard" ? `gld(a,2,0,0,0)` : undefined;
  const arm = (phase: string, r: number, layer = 2, c = colour) => [
    `glc(a,${layer},${c},1)`,
    ...(layer === 2 && typeof hard !== "undefined" ? [hard] : []),
    `glpfs(a,${layer},${phase},${r},3)`,
    `glt(a,${layer},${CONTINUOUS})`,
  ];

  switch (l.kind) {
    case "none":
      return undefined;

    case "breathe":
      // The only Look where every LED gets identical treatment, so the
      // loop walks the hardware index and skips glag entirely.
      return {
        positional: false,
        extraNames: [],
        extraInits: [],
        statements: arm("0", rate),
      };

    case "shimmer": {
      // The never-repeating field comes from the per-LED rate mix, not
      // from the phase seed, so the speed detent is deliberately not
      // honoured here. A rate component of 0 would freeze a third of the
      // grid, which reads as dead pixels, so the mix starts at 1.
      return {
        positional: false,
        extraNames: [],
        extraInits: [],
        statements: [
          `glc(a,2,${colour},1)`,
          ...(typeof hard !== "undefined" ? [hard] : []),
          `glpfs(a,2,a*97%256,1+a%3,3)`,
          `glt(a,2,${CONTINUOUS})`,
        ],
      };
    }

    case "scan": {
      const axis = l.axis === "y" ? "n//9" : "n%9";
      return {
        positional: true,
        extraNames: [],
        extraInits: [],
        statements: arm(`${axis}*${w}`, rate),
      };
    }

    case "wave": {
      const sign = l.axis === "antidiagonal" ? "-" : "+";
      return {
        positional: true,
        extraNames: [],
        extraInits: [],
        statements: arm(`(n%9${sign}n//9)*${w}`, rate),
      };
    }

    case "swirl": {
      // The // 1 after math.atan is not optional and its absence is the
      // loudest failure in the book: every LED lands on phase 0 and the
      // whole grid breathes in unison, which reads as broken hardware.
      // 41 rather than the exact 256/2pi costs the same and overlaps the
      // seam instead of leaving a gap.
      const m = [41, 82, 123][clamp(l.arms, 1, 3) - 1];
      const spiral = l.spiral ? "+n%9*8" : "";
      return {
        positional: true,
        extraNames: [],
        extraInits: [],
        statements: arm(`math.atan(n//9-4,n%9-4)*${m}//1${spiral}%256`, rate),
      };
    }

    case "ripple": {
      // 45 is fixed: the largest multiplier that keeps d*45 under 256 at
      // the corner radius of 5.657, so exactly one ring is ever on
      // screen. Rings-from owns the rate sign, which is why the reverse
      // switch is suppressed on this tile.
      const base = SPEED_TABLE[clamp(Math.round(l.speed), 1, 8) - 1].rate;
      const r = l.ringsFrom === "centre" ? 256 - base : base;
      return {
        positional: true,
        extraNames: ["u", "v"],
        extraInits: ["n%9-4", "n//9-4"],
        statements: arm("math.sqrt(u*u+v*v)*45//1", r),
      };
    }

    case "drift": {
      // The only Look that cannot use glc, because it needs three
      // independent stops per column. Both ramps land exactly on their
      // endpoint colours at columns 0 and 8, so no channel can leave
      // 0..255 and be truncated to near-black by lua_tointeger.
      return {
        positional: true,
        extraNames: ["x"],
        extraInits: ["n%9"],
        statements: [
          `gln(a,2,0,0,0)`,
          // The endpoints are scaled FIRST, then rampChannel runs on the
          // scaled endpoints, so columns 0 and 8 still land exactly on
          // the (scaled) colours and no channel leaves 0..255.
          `gld(a,2,${ramp(scaleColour(l.colour, pct), scaleColour(l.colourB, pct), "x")})`,
          `glx(a,2,${ramp(scaleColour(l.colourB, pct), scaleColour(l.colour, pct), "x")})`,
          `glpfs(a,2,(x+n//9)*${w},${rate},3)`,
          `glt(a,2,${CONTINUOUS})`,
        ],
      };
    }

    case "showpiece": {
      // A fixed two-layer composite with two colour knobs and one speed:
      // a slow tide on layer 2 under a counter-rotation on layer 1. The
      // two phase expressions are structural, not parameters.
      return {
        positional: true,
        extraNames: [],
        extraInits: [],
        statements: [
          ...arm(`(n%9+n//9)*15`, rate),
          ...arm(
            "math.atan(n//9-4,n%9-4)*41//1%256",
            256 - rate,
            1,
            rgb(l.colourB, pct),
          ),
        ],
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Touch: layer 1, painted inside the handler. The cell under the finger is
// always integer arithmetic, which is both correct and 55 characters
// cheaper than the float form the factory script uses.

function axisDivisor(s: PadState): number {
  return s.sends.hiRes && s.sends.kind !== "faders" ? 1024 : 128;
}

function axisMax(s: PadState): number {
  return axisDivisor(s) - 1;
}

function cellExpr(d: number): string {
  return `x*9//${d}+y*9//${d}*9`;
}

// HANGAR divergence, plan 12.1-08b (see src/lib/fidelity/upstream-manifest.json).
// A state that carries `touchLibrary` is written to a module whose system
// element holds HANGAR's touch library, and its handler reaches the LEDs
// through the library's measured map instead of `x*9//d`: `N(x,y)` is the
// nearest calibrated LED, `K` the decaying bilinear stamp, `G` the live one.
// The library reads raw 0..127, so a widened axis is brought back first.
function libraryOn(s: PadState): boolean {
  return typeof s.touchLibrary !== "undefined";
}

function libraryXY(s: PadState): string {
  return axisDivisor(s) === 1024 ? "x//8,y//8" : "x,y";
}

function touchLoop(s: PadState): ArmLoop | undefined {
  // Per-finger sets its stops on every paint and disturb writes into the
  // Look's own layer, so neither needs an init and neither pays for one.
  if (s.touch.kind === "perFinger" || s.touch.kind === "disturb") {
    return undefined;
  }
  return {
    positional: false,
    extraNames: [],
    extraInits: [],
    statements: [`glc(a,1,${rgb(s.touch.colour, briPct(s))},1)`],
  };
}

// A finger-anchored wide brush would walk off the end of a row and
// reappear on the next one, so the column is clamped before the write
// rather than guarded after it. A one-cell brush cannot wrap and does not
// pay for the guard.
function paintCells(s: PadState, paint: (addr: string) => string[]): string {
  const d = axisDivisor(s);
  if (s.touch.brush === 2 && s.touch.kind !== "glow") {
    return J(
      `local u,v=x*9//${d},y*9//${d}`,
      "if u>7 then u=7 end",
      "if v>7 then v=7 end",
      "for j=0,1 do",
      "for k=0,1 do",
      "local a=glag(0,u+k+(v+j)*9)",
      ...paint("a"),
      "end",
      "end",
    );
  }
  return J(`local a=glag(0,${cellExpr(d)})`, ...paint("a"));
}

function touchPaint(s: PadState): string {
  const d = axisDivisor(s);
  const decay = nearestDecay(s.touch.trailMs);

  switch (s.touch.kind) {
    case "none":
      return "";

    case "comet":
      // HANGAR divergence, plan 12.1-08b: with the library on the module and
      // the house decay (rate 250, D's), the stamp is the library's K - the
      // 2x2 block around the calibrated position, each cell's start weighted
      // by distance and quantised to a multiple of 6 so every one lands on
      // 0. The wide brush and any other rate keep the naive cell below.
      if (libraryOn(s) && s.touch.brush !== 2 && decay.rate === 250) {
        return `K(${libraryXY(s)},1,${(256 - decay.rate) * decay.ticks})`;
      }
      // Stateless: no previous-cell tracking, no clear pass, no release
      // handling, no stuck pixels, and multi-touch correct for free
      // because each contact writes its own cells and firmware fades all
      // of them independently.
      return paintCells(s, (a) => [
        `glpfs(${a},1,${(256 - decay.rate) * decay.ticks},${decay.rate},0)`,
        `glt(${a},1,${decay.ticks})`,
      ]);

    case "perFinger": {
      // Five hues from one closed form at zero table cost. A real
      // five-entry palette would need a Lua table constructor and about
      // 60 more characters, so the colour knob is suppressed here.
      // Brightness scales the COEFFICIENTS of the closed form, so the
      // emitted arithmetic keeps its shape and stays non-negative over
      // i = 0..4 at every detent (pinned in the tests).
      const pct = briPct(s);
      const A = scaleChannel(255, pct);
      const B = scaleChannel(60, pct);
      const C = scaleChannel(128, pct);
      // HANGAR divergence, plan 12.1-08b: the same K as the comet's, handed
      // the contact's closed-form hue so the four cells take its colour.
      if (libraryOn(s) && s.touch.brush !== 2 && decay.rate === 250) {
        return wrapIf(
          LIVE,
          `K(${libraryXY(s)},1,${(256 - decay.rate) * decay.ticks},${A}-i*${B},i*${B},${C})`,
        );
      }
      return wrapIf(
        LIVE,
        paintCells(s, (a) => [
          `glc(${a},1,${A}-i*${B},i*${B},${C},1)`,
          `glpfs(${a},1,${(256 - decay.rate) * decay.ticks},${decay.rate},0)`,
          `glt(${a},1,${decay.ticks})`,
        ]),
      );
    }

    case "bloom": {
      // One burst per tap and zero per-frame Lua: firmware advances the
      // whole field in step. 22 phase units per cell puts the visible
      // front about 5.7 cells wide, so this is a soft expanding bloom
      // with a bright leading edge, never a thin ring. The decay table
      // does not apply: this runs a positive forward rate against a short
      // timeout, which is different arithmetic.
      const ticks = clamp(Math.round(s.touch.trailMs / 10), 16, 200);
      return wrapIf(
        "e==4",
        J(
          `local u,v=x*9//${d},y*9//${d}`,
          "for n=0,80 do",
          "local a,p,q=glag(0,n),n%9-u,n//9-v",
          "glpfs(a,1,255-math.sqrt(p*p+q*q)*22//1,4,0)",
          `glt(a,1,${ticks})`,
          "end",
        ),
      );
    }

    case "glow":
      // HANGAR divergence, plan 12.1-08b: with the library on the module the
      // live dot is G's bilinear block on layer 1 in the touch colour, per
      // contact; the parked dot the spring re-park leaves in s.l is doused
      // on any sample first, exactly as the naive form douses it, and the
      // re-park in sendsPaint runs after G on an end code, unchanged.
      if (libraryOn(s)) {
        return J(
          "if s.l then glp(glag(0,s.l),1,0)s.l=nil end",
          `G(s,i,e,${libraryXY(s)},1,${rgb(s.touch.colour, briPct(s))})`,
        );
      }
      // One slot, so two contacts fight over it and the dot jumps between
      // them. Kept only because a held motionless finger stays lit here
      // and fades on the comet, since enqueue is change-gated per contact.
      return J(
        "if s.l then glp(glag(0,s.l),1,0)end",
        `if ${ENDED} then`,
        "s.l=nil",
        "else",
        `s.l=${cellExpr(d)}`,
        "glp(glag(0,s.l),1,255)",
        "end",
      );

    case "disturb":
      // Writes phase 255 into the Look's own layer, so the travelling
      // pattern visibly bends around the finger. The 3x3 footprint is
      // clipped rather than wrapped: without the bounds test, touching
      // column 0 lights a stray cell on the far right of the row above.
      return J(
        `local u,v=x*9//${d},y*9//${d}`,
        "for j=-1,1 do",
        "for k=-1,1 do",
        "local p,q=u+k,v+j",
        "if p>=0 and p<9 and q>=0 and q<9 then glp(glag(0,p+q*9),2,255)end",
        "end",
        "end",
      );
  }
}

// ---------------------------------------------------------------------------
// Normalisation. Contradictions are resolved once, before codegen and
// before the stamp, so what is encoded is exactly what was compiled.

// The highest controller a state reaches, so ccBase can be clamped to leave
// room for it. xy sends two controllers, and in hiRes each becomes a 14-bit
// pair at n and n+32, so it reaches ccBase+33. Faders send one per fader.
export function maxCcBase(s: PadState): number {
  // xy deliberately IGNORES axes: if "x" relaxed the clamp to 127, a later
  // switch back to "both" would silently re-clamp ccBase down and renumber
  // both streams. Range stability beats one reclaimed controller.
  if (s.sends.kind === "xy") return s.sends.hiRes ? 127 - 33 : 127 - 1;
  if (s.sends.kind === "faders") return 127 - (s.sends.faders - 1);
  if (s.sends.kind === "dial") return s.sends.dialRadius ? 126 : 127;
  return 127;
}

export function normalisePadState(input: PadState): PadState {
  const s = clonePadState(input);
  s.look.colour = quantiseColour(s.look.colour);
  s.look.colourB = quantiseColour(s.look.colourB);
  s.touch.colour = quantiseColour(s.touch.colour);
  s.sends.gridColour = quantiseColour(s.sends.gridColour);
  s.sends.heldColour = quantiseColour(s.sends.heldColour);
  s.look.speed = clamp(Math.round(s.look.speed), 1, 8);
  s.brightness = clamp(Math.round(s.brightness), 1, 5);
  s.look.wavelength = snapWavelength(s.look.wavelength);
  s.look.arms = clamp(Math.round(s.look.arms), 1, 3) as 1 | 2 | 3;
  s.touch.trailMs = nearestDecay(s.touch.trailMs).ms;
  s.touch.brush = s.touch.brush === 2 ? 2 : 1;
  s.sends.channel = clamp(Math.round(s.sends.channel), 1, 16);
  s.sends.velocity = clamp(Math.round(s.sends.velocity), 1, 127);
  // Fader values come from 127 - y and land straight in a 7-bit CC, so
  // widening the axes would only break the arithmetic. The trackpad sets
  // its own range, and the dial's angle gains nothing from 10-bit
  // coordinates while every dial constant assumes 0..127.
  if (
    s.sends.kind === "faders" ||
    s.sends.kind === "trackpad" ||
    s.sends.kind === "dial"
  ) {
    s.sends.hiRes = false;
  }
  // The dial is definitionally one finger: two fingers accumulating into
  // one encoder is chaos. Pinned here so the stamp records the truth.
  if (s.sends.kind === "dial") s.sends.fingers = "first";
  s.sends.axes =
    s.sends.axes === "x" || s.sends.axes === "y" ? s.sends.axes : "both";
  s.sends.spring = s.sends.spring === true;
  s.sends.springTo = s.sends.springTo === "zero" ? "zero" : "centre";
  s.sends.bend =
    s.sends.bend === "x" || s.sends.bend === "y" ? s.sends.bend : "none";
  s.sends.scale =
    s.sends.scale === "major" ||
    s.sends.scale === "minor" ||
    s.sends.scale === "pentatonic"
      ? s.sends.scale
      : "chromatic";
  // An 81-entry note table cannot fit the budget, so the 9x9 grid is
  // chromatic by construction rather than by silent truncation.
  if (s.sends.grid === "9x9") s.sends.scale = "chromatic";
  s.sends.toggle = s.sends.toggle === true;
  // After kind, grid and scale are settled, because the highest legal
  // base depends on all three. A flat 127 clamp lets the top zones walk
  // past note 127: chromatic emits the illegal byte raw, and a scaled
  // table would bake duplicate 127s whose note-offs cross zones.
  s.sends.baseNote = clamp(Math.round(s.sends.baseNote), 0, zoneMaxBase(s));
  s.sends.dialMode = s.sends.dialMode === "absolute" ? "absolute" : "relative";
  s.sends.dialSense = clamp(Math.round(s.sends.dialSense), 1, 8);
  s.sends.dialRadius = s.sends.dialRadius === true;
  // Clamped after kind, faders and hiRes are settled, because the highest
  // controller a state reaches depends on all three. A flat clamp emitted
  // controller numbers above 127, which is not a legal CC.
  s.sends.ccBase = clamp(Math.round(s.sends.ccBase), 0, maxCcBase(s));
  // Blocks needs four column groups. Three faders on nine columns is the
  // rail layout or nothing.
  if (s.sends.faders === 3) s.sends.layout = "rails";
  // A checkerboard over one-LED zones is a per-cell chequer that conveys
  // nothing, so the 9x9 grid draws no picture rather than a misleading one.
  if (s.sends.grid === "9x9") s.sends.showGrid = false;
  // Only zones and faders have a picture to draw.
  if (s.sends.kind !== "zones" && s.sends.kind !== "faders") {
    s.sends.showGrid = false;
  }
  // The trackpad owns the handler, the timer and both mouse axes, so
  // nothing composes alongside it. Clearing the other two sheets here is
  // what keeps a hand-adjusted trackpad inside its own budget: the stamp
  // stops carrying settings the compiler would ignore anyway, and the
  // recipe leaves only a handful of characters spare.
  if (s.enabled.sends && s.sends.kind === "trackpad") {
    s.look.kind = "none";
    s.touch.kind = "none";
  }
  const t = s.sends.trackpad;
  t.scrollUnits = snapTo(TRACKPAD_SCROLL_UNITS, t.scrollUnits);
  // Two coalesced cycles have to stay inside an int8_t or a fast flick
  // throws the cursor backwards, so 63 is a ceiling and not a default to
  // be raised.
  t.pointerCap = snapTo(TRACKPAD_POINTER_CAPS, t.pointerCap);
  t.tapTolerance = snapTo(TRACKPAD_TAP_TOLERANCE, t.tapTolerance);
  t.tapTicks = snapTo(TRACKPAD_TAP_TICKS, t.tapTicks);
  t.pointerHoldOff = clamp(Math.round(t.pointerHoldOff), 1, 8);
  t.clickTicks = clamp(Math.round(t.clickTicks), 1, 8);
  return canonicalise(s);
}

// Anything the stamp does not carry is reset to its default here, so a
// value the user cannot see is never quietly kept alive until a reload
// throws it away. The conditions below mirror encodeStamp exactly: if the
// two drift apart, decodeStamp(encodeStamp(s)) stops being an identity and
// the reload promise breaks.
function canonicalise(s: PadState): PadState {
  const d = DEFAULT_PAD_STATE;

  if (s.look.kind === "none") {
    s.look = {
      ...d.look,
      kind: "none",
      colour: { ...d.look.colour },
      colourB: { ...d.look.colourB },
    };
  } else {
    if (!usesAxis(s.look.kind)) s.look.axis = d.look.axis;
    if (!usesWavelength(s.look.kind)) s.look.wavelength = d.look.wavelength;
    if (s.look.kind !== "swirl") {
      s.look.arms = d.look.arms;
      s.look.spiral = d.look.spiral;
    }
    if (s.look.kind !== "ripple") s.look.ringsFrom = d.look.ringsFrom;
    if (!usesColourB(s.look.kind)) s.look.colourB = { ...d.look.colourB };
  }

  if (s.touch.kind === "none") {
    s.touch = { ...d.touch, kind: "none", colour: { ...d.touch.colour } };
  } else {
    if (!touchUsesColour(s.touch.kind)) s.touch.colour = { ...d.touch.colour };
    if (!touchUsesTrail(s.touch.kind)) s.touch.trailMs = d.touch.trailMs;
    if (!touchUsesBrush(s.touch.kind)) s.touch.brush = d.touch.brush;
  }

  const k = s.sends.kind;
  if (k === "none" || k === "trackpad") {
    s.sends.channel = d.sends.channel;
    s.sends.invertX = d.sends.invertX;
    s.sends.invertY = d.sends.invertY;
    s.sends.fingers = d.sends.fingers;
  }
  if (k === "dial") {
    // Dead fields on a dial: the emitter never reads them, and normalise
    // already pinned fingers to "first", so the stamp round trip is exact.
    s.sends.invertX = d.sends.invertX;
    s.sends.invertY = d.sends.invertY;
  }
  if (!sendsUsesPhase(k)) s.sends.phase = d.sends.phase;
  if (k !== "xy") {
    s.sends.axes = d.sends.axes;
    s.sends.spring = d.sends.spring;
    s.sends.springTo = d.sends.springTo;
    s.sends.bend = d.sends.bend;
  }
  // springTo is read only while spring is on, so a value the user cannot
  // see is reset rather than quietly kept alive.
  if (!s.sends.spring) s.sends.springTo = d.sends.springTo;
  if (k !== "zones") {
    s.sends.scale = d.sends.scale;
    s.sends.toggle = d.sends.toggle;
  }
  if (k !== "dial") {
    s.sends.dialMode = d.sends.dialMode;
    s.sends.dialSense = d.sends.dialSense;
    s.sends.dialRadius = d.sends.dialRadius;
  }
  if (k !== "xy" && k !== "faders" && k !== "dial") {
    s.sends.ccBase = d.sends.ccBase;
  }
  if (k !== "xy" && k !== "zones") s.sends.hiRes = d.sends.hiRes;
  if (k !== "zones") {
    s.sends.grid = d.sends.grid;
    s.sends.baseNote = d.sends.baseNote;
    s.sends.order = d.sends.order;
    s.sends.velocity = d.sends.velocity;
  }
  if (k !== "faders") {
    s.sends.faders = d.sends.faders;
    s.sends.layout = d.sends.layout;
  }
  if (!s.sends.showGrid) {
    s.sends.gridColour = { ...d.sends.gridColour };
    s.sends.heldColour = { ...d.sends.heldColour };
  }
  if (k !== "trackpad") s.sends.trackpad = { ...d.sends.trackpad };

  if (typeof s.owned !== "undefined") {
    const owned: Partial<PadOwnership> = {};
    for (const slot of SLOTS)
      if (s.owned[slot] === "user") owned[slot] = "user";
    if (Object.keys(owned).length === 0) delete s.owned;
    else s.owned = owned;
  }

  // A brightness on a card that lights nothing is a value the user cannot
  // see, so it is reset rather than quietly kept alive. Runs after the
  // sends fields above are settled, so sendsIsVisible reads the settled
  // showGrid; the stamp mirrors this exactly, because a nothing-lights
  // state normalises to Full and therefore never emits format "c".
  if (!padLightsAnything(s)) s.brightness = 5;

  // A solo that no longer names a soloable stream of this state is a
  // leftover, not a request, so it is deleted rather than honoured.
  // rawStreamsOf reads the already-settled fields above, never
  // groundPadState, or this would recurse.
  if (typeof s.soloStream !== "undefined") {
    const id = s.soloStream;
    if (!rawStreamsOf(s).some((st) => st.id === id && st.soloable)) {
      delete s.soloStream;
    }
  }
  return s;
}

// Suppression made explicit. A sheet the layer plan dropped contributes
// nothing to either budget, so a counterfactual that switched a Sends
// picture off would silently resurrect it and report a NEGATIVE cost for
// the picture. Grounding first is what keeps the ledger and the fit ladder
// monotonic.
export function groundPadState(state: PadState): PadState {
  const s = normalisePadState(state);
  for (const note of planLayers(s).notes) s.enabled[note.sheet] = false;
  return normalisePadState(s);
}

// ---------------------------------------------------------------------------
// Streams: the single source the Map panel reads. Every MIDI stream the
// current card emits, in plain words with the real numbers the DAW shows.
// A stream that needs no solo (a note per pad is already unambiguous) is
// listed with a why string rather than hidden. Trackpad is HID, not MIDI,
// so it yields nothing and no Map section renders.

export type PadStream = {
  id: PadStreamId;
  // Plain words: "Left and right", "Fader 3", "Pads", "Turn".
  label: string;
  // The numbers the DAW shows the user: "CC 16 on channel 1".
  message: string;
  soloable: boolean;
  // Shown instead of the Solo action when the stream needs none.
  why?: string;
};

const ONLY_STREAM = "This card already sends only this.";

// Streams of an ALREADY-NORMALISED state. canonicalise calls this to
// validate a soloStream, so it must not call groundPadState or normalise
// again; the public streamsOf below does the grounding.
function rawStreamsOf(s: PadState): PadStream[] {
  if (!s.enabled.sends) return [];
  const ch = s.sends.channel;
  const cc = s.sends.ccBase;
  const ccWords = (n: number) =>
    s.sends.hiRes && s.sends.kind === "xy"
      ? `CC ${n}, with its fine pair CC ${n + 32}, on channel ${ch}`
      : `CC ${n} on channel ${ch}`;

  switch (s.sends.kind) {
    case "xy": {
      const both = s.sends.axes === "both";
      const bent = (axis: BendAxis, n: number) =>
        s.sends.bend === axis ? `Pitch bend on channel ${ch}` : ccWords(n);
      const out: PadStream[] = [];
      if (s.sends.axes !== "y") {
        out.push({
          id: "xy.x",
          label: "Left and right",
          message: bent("x", cc),
          soloable: both,
          ...(both ? {} : { why: ONLY_STREAM }),
        });
      }
      if (s.sends.axes !== "x") {
        out.push({
          id: "xy.y",
          label: "Up and down",
          message: bent("y", cc + 1),
          soloable: both,
          ...(both ? {} : { why: ONLY_STREAM }),
        });
      }
      return out;
    }
    case "zones": {
      const g = gridDiv(s);
      const notes = zoneNotes(s);
      const first = notes ? notes[0] : s.sends.baseNote;
      const last = notes
        ? notes[notes.length - 1]
        : s.sends.baseNote + g * g - 1;
      return [
        {
          id: "zones",
          label: "Pads",
          message: `Notes ${first} to ${last} on channel ${ch}`,
          soloable: false,
          why: "Each pad sends its own note, so your DAW can already tell them apart.",
        },
      ];
    }
    case "faders": {
      const n = faderCount(s);
      const out: PadStream[] = [];
      for (let k = 0; k < n; k++) {
        out.push({
          id: `fader.${k}`,
          label: `Fader ${k + 1}`,
          message: `CC ${cc + k} on channel ${ch}`,
          soloable: n > 1,
          ...(n > 1 ? {} : { why: ONLY_STREAM }),
        });
      }
      return out;
    }
    case "dial": {
      const radius = s.sends.dialRadius;
      const out: PadStream[] = [
        {
          id: "dial.turn",
          label: "Turn",
          message: `CC ${cc} on channel ${ch}, sent as turn amounts`,
          soloable: radius,
          ...(radius ? {} : { why: ONLY_STREAM }),
        },
      ];
      if (radius) {
        out.push({
          id: "dial.radius",
          label: "Distance from centre",
          message: `CC ${cc + 1} on channel ${ch}`,
          soloable: true,
        });
      }
      return out;
    }
    default:
      return [];
  }
}

// Computed on the grounded state, so a sends sheet the layer plan
// suppressed yields no streams and no Map section.
export function streamsOf(state: PadState): PadStream[] {
  return rawStreamsOf(groundPadState(state));
}

// The solo variant: the same card, one stream. Derived state, not a
// compile option, so it flows through compile, validate and writePad
// unchanged; encodeStamp ignores it, which is what makes a solo
// impossible to store as the user's configuration.
export function soloPadState(state: PadState, id: PadStreamId): PadState {
  // Validate against the grounded view (what actually emits), but return
  // the merely NORMALISED state: grounding flips enabled flags on
  // suppressed sheets, and the solo variant must stamp identically to the
  // base card, which is the whole safety argument.
  const stream = streamsOf(state).find((st) => st.id === id);
  if (typeof stream === "undefined" || !stream.soloable) {
    throw new Error(`The stream ${id} is not soloable on this card.`);
  }
  const s = normalisePadState(state);
  s.soloStream = id;
  return s;
}

// ---------------------------------------------------------------------------
// Sends.

function offset(base: number, term: string): string {
  return base === 0 ? term : `${base}+${term}`;
}

function midiChannel(s: PadState): number {
  // Firmware ORs the channel into the status nibble, so cmd must have a
  // clear low nibble and the channel is zero-based on the wire.
  return s.sends.channel - 1;
}

function axisTerm(s: PadState, axis: "x" | "y"): string {
  const invert = axis === "x" ? s.sends.invertX : s.sends.invertY;
  return invert ? `${axisMax(s)}-${axis}` : axis;
}

function phaseCond(phase: TouchPhase): string {
  // e == 5 is inexpressible here by construction.
  //
  // `or e>8` on the HELD arm is a HANGAR divergence (plan 11-04; see
  // src/lib/fidelity/upstream-manifest.json). A fast tap arrives as one
  // message with code 9 and no separate DOWN, so `e==1 or e==4` threw the
  // whole gesture away: measured, RADAR sent 0 controller messages on a tap
  // against 2 on a slow press, JOYSTICK 2 against 4 and FADERS 0 against 1,
  // and FADERS left its column unlit as well. +7 characters.
  //
  // The PRESS arm carries the same defect and is deliberately NOT changed.
  // `sends.phase` is not a HANGAR knob and all nine presets are "held", so
  // no state a visitor can reach compiles it; changing it would be an
  // unreachable divergence in a GPLv3 tree, which the record should not
  // have to carry. It is a real BOTOR bug and belongs upstream (D-08).
  return phase === "press"
    ? "e==4"
    : phase === "held"
      ? "e==1 or e==4 or e>8"
      : ENDED;
}

// "First finger" costs 78 characters more than the gate that freezes the
// pointer, and it is worth every one of them: firmware does no contact
// slot remapping, so the survivor of a two-finger touch keeps id 1 and any
// `i > 0` test dies at that moment. The claim accepts 9 as well as 4:
// a fast tap arrives as one DOWNUP message with no separate DOWN, and a
// claim that misses it silently drops exactly the taps a latch card
// exists for. The claimed 9 releases on the same message through the
// ENDED line below, so the slot cannot stick.
function fingerWrap(s: PadState, body: string): string {
  if (s.sends.fingers !== "first" || body === "") return body;
  return J(
    "if(e==4 or e==9)and not s.f then s.f=i end",
    "if i==s.f then",
    body,
    `if ${ENDED} then s.f=nil end`,
    "end",
  );
}

// The axes the xy emitter actually sends. Solo reuses the axes machinery
// verbatim: a soloed stream is just a forced single-axis compile, so the
// two features cannot disagree about which controller carries which axis.
export function effectiveAxes(s: PadState): AxesMode {
  if (s.soloStream === "xy.x") return "x";
  if (s.soloStream === "xy.y") return "y";
  return s.sends.axes;
}

// LED column to zone group. c//3 gives 3,3,3 columns with a worst
// boundary error of a fifth of a light; c*4//9 gives 3,2,2,2 and up to
// half a light. Both agree with the touch side at all nine LED centres,
// which is the whole reason the picture and the notes line up.
function ledZoneTerm(v: string, div: number): string {
  return div === 3 ? `${v}//3` : div === 9 ? v : `${v}*${div}//9`;
}

function gridDiv(s: PadState): number {
  return s.sends.grid === "3x3" ? 3 : s.sends.grid === "4x4" ? 4 : 9;
}

function zoneStatements(s: PadState): string {
  const g = gridDiv(s);
  const d = axisDivisor(s);
  // HANGAR divergence, plan 12.1-08b: with the library on the module the
  // zone is read off the LED under the finger - `N(x,y)`, the nearest
  // calibrated cell - through the LED-side zone rule (ledZoneTerm), so the
  // touch and the picture agree by construction at every finger position,
  // not only at the nine LED centres. An inverted axis inverts the column
  // or row index (8-c), never the raw value.
  if (libraryOn(s)) {
    const zx = ledZoneTerm(s.sends.invertX ? "(8-n%9)" : "n%9", g);
    const zy = ledZoneTerm(s.sends.invertY ? "(8-n//9)" : "n//9", g);
    const n = `local n=N(${libraryXY(s)})`;
    if (s.sends.order === "snake") {
      return J(
        n,
        `local zx,zy=${zx},${zy}`,
        `local z=zy%2==1 and zy*${g}+${g - 1}-zx or zy*${g}+zx`,
      );
    }
    const first = s.sends.order === "columns" ? zy : zx;
    const second = s.sends.order === "columns" ? zx : zy;
    return J(n, `local z=${first}+${second}*${g}`);
  }
  const xt = axisTerm(s, "x");
  const yt = axisTerm(s, "y");
  const px = s.sends.invertX ? `(${xt})` : xt;
  const py = s.sends.invertY ? `(${yt})` : yt;
  if (s.sends.order === "snake") {
    return J(
      `local zx,zy=${px}*${g}//${d},${py}*${g}//${d}`,
      `local z=zy%2==1 and zy*${g}+${g - 1}-zx or zy*${g}+zx`,
    );
  }
  const first = s.sends.order === "columns" ? py : px;
  const second = s.sends.order === "columns" ? px : py;
  return `local z=${first}*${g}//${d}+${second}*${g}//${d}*${g}`;
}

function ledZoneExpr(s: PadState, index: string): string {
  const g = gridDiv(s);
  const zx = ledZoneTerm(`${index}%9`, g);
  const zy = ledZoneTerm(`${index}//9`, g);
  if (s.sends.order === "snake") {
    return `${zy}%2==1 and (${zy})*${g}+${g - 1}-${zx} or (${zy})*${g}+${zx}`;
  }
  return s.sends.order === "columns" ? `${zy}+${zx}*${g}` : `${zx}+${zy}*${g}`;
}

// The single LED a 4x4 zone lights: the dot at the odd intersection
// (2*zx+1, 2*zy+1). Derived from the ORDERED zone id, so the inverse of
// zoneStatements' order mapping is baked in here; a direct address costs
// a fraction of the 81-cell inverse loop the checkerboard needs.
function dotExpr(s: PadState, zone: string): string {
  if (s.sends.order === "snake") {
    return `(${zone}//4%2==1 and 3-${zone}%4 or ${zone}%4)*2+${zone}//4*18+10`;
  }
  if (s.sends.order === "columns") {
    return `${zone}//4*2+${zone}%4*18+10`;
  }
  return `${zone}%4*2+${zone}//4*18+10`;
}

// The one caveat this design ships rather than fixes: two fingers in the
// same pad clear the highlight when the first of them leaves, because the
// repaint keys on the zone rather than counting contacts in it. The MIDI
// stays correct.
function highlightRepaint(s: PadState): string {
  if (gridDiv(s) === 4) {
    return J(
      `if o then glp(glag(0,${dotExpr(s, "o")}),2,0)end`,
      `if z then glp(glag(0,${dotExpr(s, "z")}),2,255)end`,
    );
  }
  return J(
    "for m=0,80 do",
    `local q=${ledZoneExpr(s, "m")}`,
    "if q==o or q==z then glp(glag(0,m),2,q==z and 255 or 0)end",
    "end",
  );
}

function faderCount(s: PadState): number {
  return s.sends.faders === 3 ? 3 : 4;
}

function faderColour(s: PadState, f: string): string {
  // Brightness scales the coefficients of the arithmetic form, keeping
  // its shape; the worst case (the last fader) stays non-negative at
  // every detent, which the tests enumerate.
  const sc = (v: number) => scaleChannel(v, briPct(s));
  return faderCount(s) === 3
    ? `${f}*${sc(127)},${sc(255)}-${f}*${sc(30)},${sc(255)}-${f}*${sc(127)}`
    : `${f}*${sc(85)},${sc(255)}-${f}*${sc(20)},${sc(255)}-${f}*${sc(85)}`;
}

function needsWatchdog(s: PadState, plan: LayerPlan): boolean {
  // Any latching output the pad did not MEAN to latch. A dropped UP
  // leaves a permanently held note and firmware's delta gate makes it
  // unrecoverable until a page change, because the gate writes prev_x,
  // prev_y and prev_event before checking whether the ring has room.
  // Toggle mode is exempt by definition: its held notes are the feature,
  // and a watchdog would silence a latch two seconds after every press.
  return plan.sends && s.sends.kind === "zones" && !s.sends.toggle;
}

function sendsLoop(s: PadState, plan: LayerPlan): ArmLoop | undefined {
  if (!plan.sends || !sendsIsVisible(s)) return undefined;
  const pct = briPct(s);

  if (s.sends.kind === "zones") {
    const g = gridDiv(s);
    const light = s.sends.gridColour;
    if (g === 4) {
      // The 4x4 picture is sixteen dots, not a checkerboard: 9 columns
      // split as 3,2,2,2 and the chequer reads lopsided, but the odd
      // intersections (1,3,5,7 both ways) are perfectly symmetric and
      // every dot sits inside its own touch zone. Gutter phases are
      // zeroed explicitly because Setup can re-run over live LEDs.
      return {
        positional: true,
        extraNames: [],
        extraInits: [],
        statements: [
          `glc(a,1,${rgb(light, pct)},1)`,
          "if n%9%2==1 and n//9%2==1 then glp(a,1,255)else glp(a,1,0)end",
          `glc(a,2,${rgb(s.sends.heldColour, pct)},1)`,
          "glp(a,2,0)",
        ],
      };
    }
    // dim FIRST, then the brightness funnel on each channel: the
    // checkerboard's dark square is a ratio of the light one, and the
    // sim mirrors this order exactly.
    const dark = dim(light, 2, 5);
    return {
      positional: true,
      extraNames: [],
      extraInits: [],
      statements: [
        `local zx,zy=${ledZoneTerm("n%9", g)},${ledZoneTerm("n//9", g)}`,
        `if(zx+zy)%2==0 then glc(a,1,${rgb(light, pct)},1)else glc(a,1,${rgb(dark, pct)},1)end`,
        "glp(a,1,255)",
        `glc(a,2,${rgb(s.sends.heldColour, pct)},1)`,
        "glp(a,2,0)",
      ],
    };
  }

  if (s.sends.kind === "faders") {
    const sc = (v: number) => scaleChannel(v, pct);
    if (s.sends.layout === "blocks") {
      return {
        positional: true,
        extraNames: [],
        extraInits: [],
        statements: [
          "local f=n%9*4//9",
          `glc(a,1,f*${sc(80)},${sc(255)}-f*${sc(60)},${sc(200)}-f*${sc(60)},1)`,
          "glp(a,1,0)",
          // A dim track on layer 2 so a fader at zero is still visible.
          `glc(a,2,${sc(20)},${sc(20)},${sc(30)},1)`,
          "glp(a,2,255)",
        ],
      };
    }
    // Rails. Every LED writes the same colour to BOTH layers and drives
    // them together, because one layer alone caps at 49.6 percent and the
    // rails would read grey instead of white.
    const k = faderCount(s) === 3 ? 3 : 2;
    const col = faderColour(s, "f");
    const w = sc(255);
    return {
      positional: true,
      extraNames: [],
      extraInits: [],
      statements: [
        "local c=n%9",
        `if c%${k}==1 then local f=c//${k} glc(a,1,${col},1)glc(a,2,${col},1)glp(a,1,0)glp(a,2,0)else glc(a,1,${w},${w},${w},1)glc(a,2,${w},${w},${w},1)glp(a,1,255)glp(a,2,255)end`,
      ],
    };
  }

  return undefined;
}

// Which LED story a sprung joystick can tell, if any. The pulse rides the
// touch sheet's own layer, so it exists only while the plan gives layer 1
// to the touch and the kind has a picture that survives a lift: the glow
// dot parks on the home cell, the comet fires one decaying pulse there.
// The other kinds (and a sends-only card) spring silently, which the
// panel says out loud rather than papering over.
export function springLed(
  s: PadState,
  plan: LayerPlan,
): "glow" | "comet" | undefined {
  if (!plan.sends || s.sends.kind !== "xy" || !s.sends.spring) {
    return undefined;
  }
  if (!plan.touch || plan.layer1 !== "touch") return undefined;
  if (s.touch.kind === "glow") return "glow";
  if (s.touch.kind === "comet") return "comet";
  return undefined;
}

function sendsInit(s: PadState, plan: LayerPlan): string[] {
  if (!plan.sends) return [];
  const out: string[] = [];
  if (s.sends.kind === "zones") {
    if (s.sends.toggle) {
      // The latch table, keyed by zone. No per-contact note map and no
      // watchdog slots: only presses matter here.
      out.push("self.g={}");
    } else {
      out.push("self.n={}");
      if (needsWatchdog(s, plan)) out.push("self.p={}");
    }
    const notes = zoneNotes(s);
    if (notes) out.push(`self.m={${notes.join(",")}}`);
  }
  if (s.sends.kind === "xy" && springLed(s, plan) === "glow") {
    // The home cell is lit from power-on, so the hardware shows where
    // the stick rests before it is ever touched. s.l makes the parked
    // dot the glow's own, so the next touch clears it like any other.
    const cell = springRestCell(s);
    out.push(`self.l=${cell}`, `glp(glag(0,${cell}),1,255)`);
  }
  if (s.sends.kind === "dial") {
    // The residual accumulator starts at zero; the absolute level starts
    // mid-range. s.a and s.r start nil on purpose: nil is the "no previous
    // sample" marker for both.
    out.push("self.d=0");
    if (s.sends.dialMode === "absolute") out.push("self.v=64");
  }
  return out;
}

// The dial: the pad as an endless encoder. Angle from the doubled centre
// in fine units, delta with seam correction, an accumulator divided by
// the sensitivity K with a carried residual and a half-divisor bias (the
// trackpad's proven round-to-nearest, which keeps the two turn directions
// symmetric where plain floor division fires one direction a full tick
// early), emitted as 64 plus or minus n relative CC or an accumulated
// absolute 0..127 level. It carries its own wrap rather than fingerWrap
// because the end-of-contact branch must clear s.a as well as s.f, which
// is what makes the next touch jump-free; the residual s.d and the
// absolute level s.v deliberately survive lifts, because an endless
// encoder continues where it was. No LED writes anywhere: the card's Look
// and Touch sheets carry all visual feedback, exactly like xy.
function dialPaint(s: PadState): string {
  const ch = midiChannel(s);
  const cc = s.sends.ccBase;
  const K = DIAL_SENSE_TABLE[s.sends.dialSense - 1];
  const solo = s.soloStream;
  // The radius stream exists only when its knob is on; a solo of the turn
  // stream drops it entirely, and a solo of the radius stream keeps the
  // residual update so ending the solo causes no burst.
  const radiusOn = s.sends.dialRadius && solo !== "dial.turn";

  const turnGms =
    solo === "dial.radius" ? "" : `s:gms(${ch},176,${cc},glim(64+n,1,127),0)`;
  const emit =
    s.sends.dialMode === "relative"
      ? // Only a nonzero n emits, so 64 itself (the DAW's "no movement")
        // is unreachable: the clamp floor is 1, the ceiling 127.
        J(`if n~=0 then s.d=s.d-n*${K}`, turnGms, "end")
      : // The change gate keeps the pad silent while pinned at 0 or 127,
        // like a real knob against its stop.
        J(
          `if n~=0 then s.d=s.d-n*${K}`,
          "local w=glim(s.v+n,0,127)",
          "if w~=s.v then s.v=w",
          solo === "dial.radius" ? "" : `s:gms(${ch},176,${cc},w,0)`,
          "end",
          "end",
        );

  // math.sqrt(q) is the radius in doubled units: 0 at the centre, exactly
  // 127 at an edge midpoint, clamped at the corners. s.r starts nil and
  // r ~= nil is true, so the first sample emits without an init.
  const radiusEmit = radiusOn
    ? J(
        "local r=glim(math.sqrt(q)//1,0,127)",
        `if r~=s.r then s.r=r s:gms(${ch},176,${cc + 1},r,0)end`,
      )
    : "";

  return J(
    "if e==4 and not s.f then s.f=i end",
    "if i==s.f then",
    "local u,v=2*x-127,2*y-127",
    radiusOn ? "local q=u*u+v*v" : "",
    `if ${radiusOn ? "q" : "u*u+v*v"}>${DIAL_DEADZONE_R2} then`,
    `local a=math.atan(v,u)*${DIAL_ATAN_SCALE}//1`,
    // The `or a` makes the first sample after touch-down or deadzone-exit
    // a zero delta: the no-jump reset in three tokens.
    "local d=a-(s.a or a)s.a=a",
    `if d>${DIAL_HALF_TURN} then d=d-${DIAL_FINE_PER_TURN} elseif d<-${DIAL_HALF_TURN} then d=d+${DIAL_FINE_PER_TURN} end`,
    "s.d=s.d+d",
    `local n=(s.d+${K / 2})//${K}`,
    emit,
    radiusEmit,
    // Clearing s.a inside the deadzone matters: a finger crossing the
    // centre flips the angle by about half a turn, exactly the wrap
    // correction's ambiguity point, so the first sample after leaving the
    // deadzone re-baselines instead of bursting.
    "else s.a=nil end",
    `if ${ENDED} then s.f=nil s.a=nil end`,
    "end",
  );
}

function sendsPaint(s: PadState, plan: LayerPlan): string {
  if (!plan.sends) return "";
  const ch = midiChannel(s);
  const d = axisDivisor(s);

  if (s.sends.kind === "xy") {
    // Do not widen with txma(16383) and expect true 14 bits: the firmware
    // rescale tops out at 16368. Scaling in Lua hits both endpoints
    // exactly, and // keeps it integer all the way to the call.
    const scale = (t: string) =>
      s.sends.hiRes ? `${t.length > 1 ? `(${t})` : t}*16383//1023` : t;
    const mode = s.sends.hiRes ? 1 : 0;
    // A dropped axis drops its whole gms statement, which is a real budget
    // refund the ledger's differential sends row picks up for free. The
    // controller assignment is FIXED in every mode: left-right is ccBase,
    // up-down is ccBase + 1, so an axes change never renumbers a stream.
    // A bend axis skips its controller rather than renumbering the other.
    const ax = effectiveAxes(s);
    // Standard resolution rides the MSB directly, so the pad's centre
    // column is bit-exact 8192; fine resolution scales first and splits,
    // because bend has no firmware pair mode like CC's mode 1.
    const bendLive = (t: string) =>
      s.sends.hiRes
        ? J(`local b=${scale(t)}`, `s:gms(${ch},224,b%128,b//128,0)`)
        : `s:gms(${ch},224,0,${t},0)`;
    const axisLive = (axis: "x" | "y", cc: number) =>
      s.sends.bend === axis
        ? bendLive(axisTerm(s, axis))
        : `s:gms(${ch},176,${cc},${scale(axisTerm(s, axis))},${mode})`;
    const body = J(
      ax !== "y" ? axisLive("x", s.sends.ccBase) : "",
      ax !== "x" ? axisLive("y", s.sends.ccBase + 1) : "",
    );
    if (!s.sends.spring) {
      return fingerWrap(s, wrapIf(phaseCond(s.sends.phase), body));
    }
    // The spring: one conditional in the end path. Rests are exact
    // literals rather than scaled positions, so the joystick lands on
    // bit-perfect 8192, 64 or 0 no matter where the finger left.
    const ccRest =
      s.sends.springTo === "centre" ? (s.sends.hiRes ? 8192 : 64) : 0;
    const axisRest = (axis: "x" | "y", cc: number) =>
      s.sends.bend === axis
        ? `s:gms(${ch},224,0,64,0)`
        : `s:gms(${ch},176,${cc},${ccRest},${mode})`;
    const led = springLed(s, plan);
    const cell = springRestCell(s);
    // The LED story sits OUTSIDE the first-finger gate on purpose: the
    // glow paint above it is unwrapped and douses the parked dot on any
    // contact's sample, so the re-park must fire on any contact's end
    // too, or a fast tap and the survivor of a two-finger touch both
    // leave the home cell dark. The MIDI rests stay gated: only the
    // claiming finger's lift moves the wire.
    const pulse =
      led === "glow"
        ? `s.l=${cell} glp(glag(0,${cell}),1,255)`
        : led === "comet"
          ? J(
              `local a=glag(0,${cell})`,
              `glpfs(a,1,${(256 - nearestDecay(s.touch.trailMs).rate) * nearestDecay(s.touch.trailMs).ticks},${nearestDecay(s.touch.trailMs).rate},0)`,
              `glt(a,1,${nearestDecay(s.touch.trailMs).ticks})`,
            )
          : "";
    const springBody = J(
      `if ${ENDED} then`,
      ax !== "y" ? axisRest("x", s.sends.ccBase) : "",
      ax !== "x" ? axisRest("y", s.sends.ccBase + 1) : "",
      "end",
    );
    return J(
      fingerWrap(s, J(wrapIf(phaseCond(s.sends.phase), body), springBody)),
      pulse === "" ? "" : J(`if ${ENDED} then`, pulse, "end"),
    );
  }

  if (s.sends.kind === "dial") return dialPaint(s);

  if (s.sends.kind === "zones") {
    const base = s.sends.baseNote;
    // The note a zone plays: plain arithmetic when chromatic, a lookup
    // into the baked table when scaled. The table carries baseNote, so
    // the two forms cost their own share and nothing else.
    const scaled = typeof zoneNotes(s) !== "undefined";
    const note = (zone: string) =>
      scaled ? `s.m[${zone}+1]` : offset(base, zone);

    if (s.sends.toggle) {
      // The latch: a press flips the zone and nothing else is listened
      // to, so sliding cannot retrigger and a lift changes nothing. Code
      // 9 is the fast DOWNUP tap arriving as one message; missing it
      // would drop exactly the taps a switcher card exists for.
      const body = J(
        "if e==4 or e==9 then",
        zoneStatements(s),
        "local w=not s.g[z]",
        "s.g[z]=w",
        `if w then s:gms(${ch},144,${note("z")},${s.sends.velocity},0)else s:gms(${ch},128,${note("z")},0,0)end`,
        sendsIsVisible(s)
          ? gridDiv(s) === 4
            ? `glp(glag(0,${dotExpr(s, "z")}),2,w and 255 or 0)`
            : J(
                "for m=0,80 do",
                `local q=${ledZoneExpr(s, "m")}`,
                "if q==z then glp(glag(0,m),2,w and 255 or 0)end",
                "end",
              )
          : undefined,
        "end",
      );
      return fingerWrap(s, body);
    }

    // Sliding between zones gives legato for free: leaving one zone sends
    // its note-off and entering the next sends note-on, in that order, in
    // one callback. The phase picker does not apply, because a note on and
    // a note off are the phases.
    const body = J(
      zoneStatements(s),
      `if ${ENDED} then z=nil end`,
      "local o=s.n[i]",
      "if o~=z then",
      `if o then s:gms(${ch},128,${note("o")},0,0)end`,
      `if z then s:gms(${ch},144,${note("z")},${s.sends.velocity},0)end`,
      "s.n[i]=z",
      sendsIsVisible(s) ? highlightRepaint(s) : undefined,
      "end",
      needsWatchdog(s, plan)
        ? `if ${ENDED} then s.p[i]=nil else s.p[i]=0 end`
        : undefined,
    );
    return fingerWrap(s, body);
  }

  if (s.sends.kind === "faders") {
    // Stateless and multi-touch for free: every sample sets whichever
    // fader its x falls in, and each one holds on release because the
    // handler only listens for MOVE and DOWN.
    const n = faderCount(s);
    const xt = axisTerm(s, "x");
    // HANGAR divergence, plan 12.1-08b: with the library on the module the
    // fader is the one under the LED column the finger is on - `N(x,y)%9`
    // through the LED-side rule `c*n//9` the rails and blocks are drawn
    // with - so a finger on a rail moves that fader at every position. The
    // level `v` stays the raw sensor value (12.1-CONTEXT D-14): what a DAW
    // receives is not changed silently.
    const fx = libraryOn(s)
      ? s.sends.invertX
        ? `(8-N(${libraryXY(s)})%9)*${n}//9`
        : `N(${libraryXY(s)})%9*${n}//9`
      : s.sends.invertX
        ? `(${xt})*${n}//${d}`
        : `${xt}*${n}//${d}`;
    const value = s.sends.invertY ? "y" : "127-y";
    // A solo guards ONLY the gms: a finger near a rail boundary crossing
    // into the neighbour column is exactly the accident being removed, but
    // the LED picture stays live for every fader, which is the right
    // mapping UX: full visual feedback, single MIDI stream.
    const soloFader = /^fader\.(\d+)$/.exec(s.soloStream ?? "");
    const gms = `s:gms(${ch},176,${offset(s.sends.ccBase, "f")},v,0)`;
    const parts: string[] = [
      `local f=${fx}`,
      `local v=${value}`,
      soloFader === null ? gms : wrapIf(`f==${soloFader[1]}`, gms),
    ];
    if (sendsIsVisible(s)) {
      // (v + 1) * 9 // 128 is exact: zero rows at value 0 and all nine at
      // 127, which the naive v * 9 // 127 does not manage at either end.
      parts.push("local l=(v+1)*9//128");
      if (s.sends.layout === "blocks") {
        parts.push(
          J(
            "for n=0,80 do",
            "if n%9*4//9==f then glp(glag(0,n),1,(8-n//9)<l and 255 or 0)end",
            "end",
          ),
        );
      } else {
        const k = n === 3 ? 3 : 2;
        parts.push(
          J(
            "for n=0,80 do",
            `if n%9==f*${k}+1 then`,
            "local w=(8-n//9)<l and 255 or 0",
            "local a=glag(0,n)",
            "glp(a,1,w)glp(a,2,w)",
            "end",
            "end",
          ),
        );
      }
    }
    return fingerWrap(s, wrapIf(phaseCond(s.sends.phase), J(...parts)));
  }

  return "";
}

function watchdogBody(s: PadState): string {
  const ch = midiChannel(s);
  const note =
    typeof zoneNotes(s) !== "undefined"
      ? "s.m[s.n[i]+1]"
      : offset(s.sends.baseNote, "s.n[i]");
  // Two seconds, not two hundred milliseconds: a motionless finger emits
  // nothing at all, so a short watchdog kills live contacts. The expiry
  // branch sends the note-off rather than only clearing the slot.
  return J(
    "for i,t in pairs(s.p)do",
    "s.p[i]=t+1",
    "if t>100 then",
    `if s.n[i]then s:gms(${ch},128,${note},0,0)s.n[i]=nil end`,
    "s.p[i]=nil",
    "end",
    "end",
  );
}

// ---------------------------------------------------------------------------
// The trackpad. A fixed variant, transcribed from hardware-tested Lua,
// with seven length-neutral knobs. Nothing composes alongside it: it owns
// the handler, the timer and both mouse axes.

function trackpadSetup(s: PadState, seam: string): string {
  const t = s.sends.trackpad;
  const u = t.scrollUnits;
  // The bias is exactly half the divisor in BOTH expressions. Plain floor
  // division breaks the two directions apart, because -1 // 128 is -1, so
  // scrolling one way fires a notch on the first unit of travel while the
  // other way needs a full unit, and the residual parks against one edge
  // so resting jitter emits notches. Never expose these as two numbers.
  const bias = u / 2;
  const cap = t.pointerCap;
  const head = J(
    "self:txma(1023)self:tyma(1023)",
    "gmbs(3,0)",
    "self.r=0",
    "self.z=function(s)s.p={}s.n=0 s.k=0 s.m=0 s.w=0 s.j=0 s.q=0 end",
    "self:z()",
    "self.touch_cb=function(s,i,e,x,y)",
    `if s.q>${t.tapTicks} then s:z()end`,
    "s.q=0",
    "local o,g,f,h=true,0,0,0",
    // Drains the whole ten-entry ring rather than taking the one sample
    // per cycle events.lua hands it. The firmware delta gate advances
    // before it checks for room, so a sample dropped there can never be
    // regenerated.
    "while o and g<24 do",
    "g=g+1",
    `local c,t=s.p[i],${ENDED}`,
    "if e==4 or e>7 or not c and not t then",
    "if not c then s.n=s.n+1 s.k=glim(s.k,s.n,9)end",
    `c={x,y}s.p[i]=c s.j=${t.pointerHoldOff}`,
    "end",
    "if t then",
    "if c then",
    `s.p[i]=nil s.n=s.n-1 s.j=${t.pointerHoldOff}`,
    "if s.n<1 then",
    `if s.r<1 and e>4 and s.m<s.k*${t.tapTolerance} then gmbs(glim(s.k,1,2),1)s.r=${t.clickTicks} end`,
    "gtt(0,20)s:z()",
    "end",
    "end",
    "else",
    "local u,v=x-c[1],y-c[2]c[1]=x c[2]=y",
    "s.m=s.m+math.abs(u)+math.abs(v)",
    "if s.n>1 then s.w=s.w+v else f=f+u h=h+v end",
    "end",
    "o=s:touch_pop()i=s:tid()e=s:tev()x=s:txv()y=s:tyv()",
    "end",
    "if s.j>0 then s.j=s.j-1",
    "elseif s.n>1 then",
    `local d=(s.w+${bias})//${u}`,
    `if d~=0 then s.w=s.w-d*${u} s.m=999 gmms(3,${t.scrollInvert ? "-d" : "d"})end`,
    "else",
    `gmms(1,glim(f,-${cap},${cap}))gmms(2,glim(h,-${cap},${cap}))`,
    "end",
  );
  return J(head, seam, "end", "gtt(0,20)");
}

function trackpadTimer(seam: string): string {
  return J(
    "gtt(0,20)",
    "local s=self",
    "if s.n then",
    "if s.r>0 then s.r=s.r-1 if s.r<1 then gmbs(3,0)end end",
    "s.q=s.q+1",
    "if s.q==100 then gmbs(3,0)end",
    "end",
    seam,
  );
}

// ---------------------------------------------------------------------------
// Compile.

export const KEEPER_PERIOD_SLOW = 300000;
export const KEEPER_PERIOD_FAST = 20;

export type PadEventName = "setup" | "timer";

export const SETUP_EVENT = 0;
export const TIMER_EVENT = 6;

export type PadAction = { short: "cb"; name: string; script: string };

export type PadSeams = { touch: boolean; timer: boolean };

export type PadUserCode = { script: string; seams?: PadSeams };

export type CompileResult = {
  state: PadState;
  plan: LayerPlan;
  stamp: string;
  setup: PadAction[];
  timer: PadAction[];
  setupLua: string;
  timerLua: string;
  timerPeriodMs: number;
  seams: PadSeams;
};

// A body that assigns only self.uh gets the touch hook and saves the
// Timer's own seam. The caller can override when it knows better.
export function detectSeams(script: string): PadSeams {
  return {
    touch: /\bself\s*\.\s*uh\s*=/.test(script),
    timer: /\bself\s*\.\s*ut\s*=/.test(script),
  };
}

export function padActionToLua(a: PadAction): string {
  return `--[[@${a.short}#${a.name}]] ${a.script}`;
}

function eventToLua(actions: PadAction[]): string {
  return actions.map(padActionToLua).join("");
}

export function compile(state: PadState, user?: PadUserCode): CompileResult {
  const s = normalisePadState(state);
  const plan = planLayers(s);
  const userScript = (user?.script ?? "").trim();
  const seams: PadSeams =
    userScript === ""
      ? { touch: false, timer: false }
      : (user?.seams ?? detectSeams(userScript));

  const timerIsOurs = ownerOf(s, "timer") !== "user";
  const trackpad = plan.sends && s.sends.kind === "trackpad";

  let setupBody: string;
  let timerBody: string;
  let period: number;

  if (trackpad) {
    setupBody = trackpadSetup(s, seams.touch ? SEAM_TOUCH : "");
    timerBody = trackpadTimer(seams.timer ? SEAM_TIMER : "");
    period = KEEPER_PERIOD_FAST;
  } else {
    const watchdog = timerIsOurs && needsWatchdog(s, plan);
    period = watchdog ? KEEPER_PERIOD_FAST : KEEPER_PERIOD_SLOW;

    // One merged loop, in the order the layers stack. Worth 18 characters
    // every time, which is why per-feature costs are not additive.
    let loop = emptyLoop();
    if (plan.look) loop = mergeLoop(loop, lookLoop(s));
    if (plan.touch) loop = mergeLoop(loop, touchLoop(s));
    loop = mergeLoop(loop, sendsLoop(s, plan));

    const paint = plan.touch ? touchPaint(s) : "";
    const send = sendsPaint(s, plan);
    const handlerBody = J(paint, send, seams.touch ? SEAM_TOUCH : "");
    const handler =
      handlerBody === "" || ownerOf(s, "touchHandler") === "user"
        ? ""
        : J("self.touch_cb=function(s,i,e,x,y)", handlerBody, "end");

    setupBody = J(
      // The axis range resets to 0..127 on every page change, so the
      // unlock has to live in Setup and nowhere else. Turning it on
      // rewrites every divisor in the element, which is why no user ever
      // sees it as a switch.
      plan.sends && s.sends.hiRes ? "self:txma(1023)self:tyma(1023)" : "",
      buildLoop(loop),
      ...sendsInit(s, plan),
      handler,
      timerIsOurs ? `gtt(0,${period === 20 ? "20" : "3e5"})` : "",
    );

    if (!timerIsOurs) {
      timerBody = "";
    } else {
      const keeper =
        plan.animates1 || plan.animates2
          ? J(
              "for a=0,80 do",
              plan.animates1 ? `glt(a,1,${CONTINUOUS})` : "",
              plan.animates2 ? `glt(a,2,${CONTINUOUS})` : "",
              "end",
            )
          : "";
      const needsSelf = watchdog || seams.timer;
      // gtt re-arms as the FIRST statement, because the handler runs
      // inside a pcall and a re-arm at the end dies permanently on any
      // Lua error.
      if (watchdog) {
        timerBody = J(
          "gtt(0,20)",
          "local s=self",
          keeper === ""
            ? ""
            : J("s.c=(s.c or 0)+1", "if s.c>15000 then s.c=0", keeper, "end"),
          watchdogBody(s),
          seams.timer ? SEAM_TIMER : "",
        );
      } else {
        timerBody = J(
          "gtt(0,3e5)",
          keeper,
          needsSelf ? "local s=self" : "",
          seams.timer ? SEAM_TIMER : "",
        );
      }
    }
  }

  const stamp = encodeStamp(s);
  const setup: PadAction[] = [
    { short: "cb", name: `${STAMP_PREFIX}${stamp}`, script: setupBody },
  ];
  // An empty Your code action costs 13 characters of the tightest budget
  // in the product and buys nothing until the user types, so it is created
  // on first edit rather than on every compile.
  if (userScript !== "") {
    setup.push({ short: "cb", name: `${STAMP_PREFIX}u`, script: userScript });
  }
  const timer: PadAction[] = timerIsOurs
    ? [{ short: "cb", name: `${STAMP_PREFIX}t`, script: timerBody }]
    : [];

  return {
    state: s,
    plan,
    stamp,
    setup,
    timer,
    setupLua: eventToLua(setup),
    timerLua: eventToLua(timer),
    timerPeriodMs: timerIsOurs ? period : 0,
    seams,
  };
}

// ---------------------------------------------------------------------------
// The stamp.
//
// The state lives in the marker name of the first Setup action, so the
// action reads `--[[@cb#z.<payload>]] <body>`. GridAction.parse splits the
// marker on the first #, which means the payload arrives whole with no
// escaping. The z. prefix is load-bearing: ActionData.getTourIndex() reads
// name.split(".")[0] as a Number, so a numeric-prefixed name would be
// misread as a tour step.
//
// Two formats, distinguished by the first character. "p" is a reference to
// a shelf card, four characters that cost seven over a bare marker and are
// what let the trackpad recipe fit its own budget. "a" is a full field
// dump: a kind-driven variable-length bit packing, because a fixed
// sixteen characters does not hold this state object. Packing every field
// at 24-bit colour comes to about 171 bits; quantising colour to RGB444
// and writing only the fields the chosen kinds read brings a typical
// Look-plus-Touch state to twelve characters and a loaded instrument to
// about twenty.

export const STAMP_PREFIX = "z.";
export const STAMP_ALPHABET = "0123456789abcdefghijklmnopqrstuv";
export const STAMP_FORMAT_STATE = "a";
// The stamp is not self-describing and finished() rejects any length
// mismatch, so a field can never be appended to format "a" without
// orphaning every existing stamp. Versioning is by format character: "b"
// differs from "a" in exactly two places, the xy branch gains 2 axes bits
// after the hiRes flag and the dial branch exists. The writer emits "b"
// only when the state needs it, so an unchanged card keeps producing
// stamps an older build can read, and an old editor meeting "b" returns
// undefined, the codec's designed fail-closed path.
export const STAMP_FORMAT_STATE_V2 = "b";
// "c" is the v2 layout plus exactly one appended field: after the owned
// block, three bits carrying the raw brightness detent 1..4. Detent 5 is
// never written, because "c" is only emitted when brightness is not the
// default; the decoder rejects 0 and 5..7, so a valid "c" payload can
// never encode the default and zero padding can never be mistaken for a
// detent. A card at full brightness keeps producing bit-identical "a" or
// "b" payloads an older build can read, and an old editor meeting "c"
// declines through the fail-closed format check below.
export const STAMP_FORMAT_STATE_V3 = "c";
// "d" is the v2 layout with two appended blocks and one changed tail: the
// xy branch gains spring + springTo + 2 bend bits + 1 reserved zero after
// the axes bits, the zones branch gains 2 scale bits + toggle + 2
// reserved zeros after its colours, and the brightness tail is always
// present carrying the raw detent 1..5 (unlike "c", where the tail
// exists only because the format character itself means "not Full").
// Both blocks are exactly five bits wide ON PURPOSE: a one-character
// format graft between "c" and "d" then misaligns every later read by a
// full character, which the starved reader and finished() detect, where
// a narrower block decoded a different card. The decoder additionally
// requires a "d" payload's raw fields to NEED the format, mirroring how
// "c" requires a non-default brightness. Emitted only when a state uses
// one of the new fields, so an untouched card keeps producing
// bit-identical "a", "b" or "c" payloads an older build can read, and an
// old editor meeting "d" declines through the fail-closed format check.
export const STAMP_FORMAT_STATE_V4 = "d";
export const STAMP_FORMAT_PRESET = "p";

class BitWriter {
  private bits: number[] = [];
  write(value: number, width: number): void {
    const v = Math.max(0, Math.round(value));
    for (let i = width - 1; i >= 0; i--) this.bits.push((v >> i) & 1);
  }
  flag(value: boolean): void {
    this.bits.push(value ? 1 : 0);
  }
  // RGB444. The picked-versus-as-it-lands swatch pair already tells the
  // user their colour is not what reaches the pad, so a 4096-step picker
  // is not a new lie, and it halves the cost of every colour in the stamp.
  colour(c: RGB): void {
    this.write(byte(c.r) >> 4, 4);
    this.write(byte(c.g) >> 4, 4);
    this.write(byte(c.b) >> 4, 4);
  }
  toString(): string {
    let out = "";
    for (let i = 0; i < this.bits.length; i += 5) {
      let v = 0;
      for (let j = 0; j < 5; j++) v = (v << 1) | (this.bits[i + j] ?? 0);
      out += STAMP_ALPHABET[v];
    }
    return out;
  }
}

class BitReader {
  private bits: number[] = [];
  private at = 0;
  ok = true;
  constructor(payload: string) {
    for (const ch of payload) {
      const v = STAMP_ALPHABET.indexOf(ch);
      if (v === -1) {
        this.ok = false;
        return;
      }
      for (let i = 4; i >= 0; i--) this.bits.push((v >> i) & 1);
    }
  }
  read(width: number): number {
    if (!this.ok || this.at + width > this.bits.length) {
      this.ok = false;
      return 0;
    }
    let v = 0;
    for (let i = 0; i < width; i++) v = (v << 1) | this.bits[this.at++];
    return v;
  }
  flag(): boolean {
    return this.read(1) === 1;
  }
  colour(): RGB {
    const r = this.read(4);
    const g = this.read(4);
    const b = this.read(4);
    return { r: r * 17, g: g * 17, b: b * 17 };
  }
  // The tail must be padding and nothing else, so a truncated or
  // over-long payload is rejected rather than half-read.
  finished(): boolean {
    if (!this.ok) return false;
    if (this.bits.length - this.at >= 5) return false;
    for (let i = this.at; i < this.bits.length; i++) {
      if (this.bits[i] !== 0) return false;
    }
    return true;
  }
}

const LOOK_KINDS: readonly LookKind[] = [
  "none",
  "breathe",
  "shimmer",
  "scan",
  "wave",
  "swirl",
  "ripple",
  "drift",
  "showpiece",
];
const TOUCH_KINDS: readonly TouchKind[] = [
  "none",
  "comet",
  "perFinger",
  "bloom",
  "glow",
  "disturb",
];
// Appended, never reordered: the index is a stamp payload. A v1 payload
// can never legitimately contain index 5, so the decoder rejects it there.
const SEND_KINDS: readonly SendKind[] = [
  "none",
  "xy",
  "zones",
  "faders",
  "trackpad",
  "dial",
];
const AXES_MODES: readonly AxesMode[] = ["both", "x", "y"];
const BEND_AXES: readonly BendAxis[] = ["none", "x", "y"];
const SCALE_KINDS: readonly ScaleKind[] = [
  "chromatic",
  "major",
  "minor",
  "pentatonic",
];
const AXES: readonly Axis[] = ["x", "y", "diagonal", "antidiagonal"];
const ORDERS: readonly Order[] = ["rows", "columns", "snake"];
const PHASES: readonly TouchPhase[] = ["press", "held", "release"];
const FINGERS: readonly Fingers[] = ["first", "any", "each"];
const GRIDS: readonly PadState["sends"]["grid"][] = ["3x3", "4x4", "9x9"];
const SLOTS: readonly PadSlot[] = ["touchHandler", "timer", "layer1", "layer2"];

const usesAxis = (k: LookKind) => k === "scan" || k === "wave";
const usesWavelength = (k: LookKind) =>
  k === "scan" || k === "wave" || k === "drift";
const usesColourB = (k: LookKind) => k === "drift" || k === "showpiece";
const touchUsesColour = (k: TouchKind) =>
  k === "comet" || k === "bloom" || k === "glow";
const touchUsesTrail = (k: TouchKind) =>
  k === "comet" || k === "perFinger" || k === "bloom";
const touchUsesBrush = (k: TouchKind) => k === "comet" || k === "perFinger";
const sendsUsesPhase = (k: SendKind) => k === "xy" || k === "faders";

export function encodeStamp(input: PadState): string {
  const s = normalisePadState(input);
  if (typeof s.preset !== "undefined" && /^[0-9a-z]{1,12}$/.test(s.preset)) {
    return `${STAMP_FORMAT_PRESET}${s.preset}`;
  }
  // soloStream is never written: encodeStamp(solo variant) equals
  // encodeStamp(base), so the stamp always records the real card.
  //
  // Format "b" only when the state needs the v2 layout, "c" only when it
  // carries a non-default brightness, and "d" only when a joystick or
  // scale/latch field is in play; everything else keeps emitting a
  // bit-identical "a" an older build can still read. "d" carries the v2
  // conditional fields too, so the writer conditionals below gate on
  // v2plus rather than v2.
  const v4 =
    (s.sends.kind === "xy" && (s.sends.spring || s.sends.bend !== "none")) ||
    (s.sends.kind === "zones" &&
      (s.sends.scale !== "chromatic" || s.sends.toggle));
  const v3 = s.brightness !== 5;
  const v2 =
    s.sends.kind === "dial" ||
    (s.sends.kind === "xy" && s.sends.axes !== "both");
  const v2plus = v2 || v3 || v4;
  const w = new BitWriter();
  w.flag(s.enabled.look);
  w.flag(s.enabled.touch);
  w.flag(s.enabled.sends);

  w.write(LOOK_KINDS.indexOf(s.look.kind), 4);
  if (s.look.kind !== "none") {
    w.colour(s.look.colour);
    w.write(s.look.speed - 1, 3);
    w.flag(s.look.reverse);
    w.flag(s.look.edge === "hard");
    if (usesAxis(s.look.kind)) w.write(AXES.indexOf(s.look.axis), 2);
    if (usesWavelength(s.look.kind)) w.write(s.look.wavelength - 8, 6);
    if (s.look.kind === "swirl") {
      w.write(s.look.arms - 1, 2);
      w.flag(s.look.spiral);
    }
    if (s.look.kind === "ripple") w.flag(s.look.ringsFrom === "edge");
    if (usesColourB(s.look.kind)) w.colour(s.look.colourB);
  }

  w.write(TOUCH_KINDS.indexOf(s.touch.kind), 3);
  if (s.touch.kind !== "none") {
    if (touchUsesColour(s.touch.kind)) w.colour(s.touch.colour);
    if (touchUsesTrail(s.touch.kind)) {
      w.write(
        DECAY_TABLE.findIndex((row) => row.ms === s.touch.trailMs),
        4,
      );
    }
    if (touchUsesBrush(s.touch.kind)) w.flag(s.touch.brush === 2);
  }

  w.write(SEND_KINDS.indexOf(s.sends.kind), 3);
  if (s.sends.kind === "trackpad") {
    const t = s.sends.trackpad;
    w.flag(t.scrollInvert);
    w.write(TRACKPAD_SCROLL_UNITS.indexOf(t.scrollUnits), 3);
    w.write(TRACKPAD_POINTER_CAPS.indexOf(t.pointerCap), 3);
    w.write(t.pointerHoldOff - 1, 3);
    w.write(TRACKPAD_TAP_TOLERANCE.indexOf(t.tapTolerance), 3);
    w.write(TRACKPAD_TAP_TICKS.indexOf(t.tapTicks), 3);
    w.write(t.clickTicks - 1, 3);
  } else if (s.sends.kind !== "none") {
    w.write(s.sends.channel - 1, 4);
    w.flag(s.sends.invertX);
    w.flag(s.sends.invertY);
    w.write(FINGERS.indexOf(s.sends.fingers), 2);
    if (sendsUsesPhase(s.sends.kind)) w.write(PHASES.indexOf(s.sends.phase), 2);
    if (s.sends.kind === "xy") {
      w.write(s.sends.ccBase, 7);
      w.flag(s.sends.hiRes);
      if (v2plus) w.write(AXES_MODES.indexOf(s.sends.axes), 2);
      if (v4) {
        w.flag(s.sends.spring);
        w.flag(s.sends.springTo === "zero");
        w.write(BEND_AXES.indexOf(s.sends.bend), 2);
        // One reserved zero, so the block is five bits wide. A "c"
        // payload relabelled "d" (or the reverse) then shifts every
        // later read by at least five bits, which is what finished()
        // and the starved reader can actually detect; a narrower block
        // slid the calib and owned reads into each other and decoded a
        // DIFFERENT card from a one-character corruption.
        w.write(0, 1);
      }
    }
    if (s.sends.kind === "dial") {
      w.write(s.sends.ccBase, 7);
      w.flag(s.sends.dialMode === "absolute");
      w.write(s.sends.dialSense - 1, 3);
      w.flag(s.sends.dialRadius);
    }
    if (s.sends.kind === "zones") {
      w.write(GRIDS.indexOf(s.sends.grid), 2);
      w.write(s.sends.baseNote, 7);
      w.write(ORDERS.indexOf(s.sends.order), 2);
      w.write(s.sends.velocity, 7);
      w.flag(s.sends.hiRes);
      w.flag(s.sends.showGrid);
      if (s.sends.showGrid) {
        w.colour(s.sends.gridColour);
        w.colour(s.sends.heldColour);
      }
      if (v4) {
        w.write(SCALE_KINDS.indexOf(s.sends.scale), 2);
        w.flag(s.sends.toggle);
        // Two reserved zeros: five bits, for the same graft-detection
        // arithmetic as the xy block above.
        w.write(0, 2);
      }
    }
    if (s.sends.kind === "faders") {
      w.flag(s.sends.faders === 4);
      w.flag(s.sends.layout === "rails");
      w.write(s.sends.ccBase, 7);
      w.flag(s.sends.showGrid);
    }
  }

  w.write(s.calib.rot, 2);
  w.flag(s.calib.flipX);
  w.flag(s.calib.flipY);

  const owned = s.owned;
  const hasOwned =
    typeof owned !== "undefined" &&
    SLOTS.some((slot) => owned[slot] === "user");
  w.flag(hasOwned);
  if (hasOwned) {
    for (const slot of SLOTS) w.flag(owned?.[slot] === "user");
  }

  // The brightness tail, after the owned block. Under "c" it exists only
  // because the format character itself means "not Full", so it is the
  // raw detent 1..4 and never 5. Under "d" the format character carries
  // no brightness meaning, so the tail is always present and 1..5 are all
  // legal.
  if (v4 || v3) w.write(s.brightness, 3);

  const format = v4
    ? STAMP_FORMAT_STATE_V4
    : v3
      ? STAMP_FORMAT_STATE_V3
      : v2
        ? STAMP_FORMAT_STATE_V2
        : STAMP_FORMAT_STATE;
  return `${format}${w.toString()}`;
}

// Total. A truncated payload, an unknown format, a kind index we no longer
// emit or a field outside its domain all return undefined, and the caller
// treats that as no stamp at all rather than as a corrupt one. That is the
// only behaviour that stays safe under a version bump: an older editor
// meeting a payload it cannot read must decline, not overwrite.
export function decodeStamp(payload: string): PadState | undefined {
  if (typeof payload !== "string" || payload.length < 2) return undefined;
  const format = payload[0];
  const rest = payload.slice(1);

  if (format === STAMP_FORMAT_PRESET) {
    const preset = presetById(rest);
    if (typeof preset === "undefined") return undefined;
    const s = clonePadState(preset.state);
    s.preset = preset.id;
    return s;
  }
  if (
    format !== STAMP_FORMAT_STATE &&
    format !== STAMP_FORMAT_STATE_V2 &&
    format !== STAMP_FORMAT_STATE_V3 &&
    format !== STAMP_FORMAT_STATE_V4
  ) {
    return undefined;
  }
  // One shared reader for all four formats: they differ only where the
  // v2, v3 and v4 checks below say so, and everything else stays
  // byte-identical. "c" is the v2 layout plus the brightness tail; "d"
  // adds the joystick and scale/latch blocks and always carries the tail.
  const v4 = format === STAMP_FORMAT_STATE_V4;
  const v2 =
    format === STAMP_FORMAT_STATE_V2 || format === STAMP_FORMAT_STATE_V3 || v4;
  const v3 = format === STAMP_FORMAT_STATE_V3;

  const r = new BitReader(rest);
  if (!r.ok) return undefined;
  const s = defaultState();

  s.enabled.look = r.flag();
  s.enabled.touch = r.flag();
  s.enabled.sends = r.flag();

  const lookKind = LOOK_KINDS[r.read(4)];
  if (typeof lookKind === "undefined") return undefined;
  s.look.kind = lookKind;
  if (lookKind !== "none") {
    s.look.colour = r.colour();
    s.look.speed = r.read(3) + 1;
    s.look.reverse = r.flag();
    s.look.edge = r.flag() ? "hard" : "soft";
    if (usesAxis(lookKind)) {
      const axis = AXES[r.read(2)];
      if (typeof axis === "undefined") return undefined;
      s.look.axis = axis;
    }
    if (usesWavelength(lookKind)) {
      const w = r.read(6) + 8;
      if (w > WAVELENGTH_MAX) return undefined;
      s.look.wavelength = w;
    }
    if (lookKind === "swirl") {
      s.look.arms = (r.read(2) + 1) as 1 | 2 | 3;
      if (s.look.arms > 3) return undefined;
      s.look.spiral = r.flag();
    }
    if (lookKind === "ripple") s.look.ringsFrom = r.flag() ? "edge" : "centre";
    if (usesColourB(lookKind)) s.look.colourB = r.colour();
  }

  const touchKind = TOUCH_KINDS[r.read(3)];
  if (typeof touchKind === "undefined") return undefined;
  s.touch.kind = touchKind;
  if (touchKind !== "none") {
    if (touchUsesColour(touchKind)) s.touch.colour = r.colour();
    if (touchUsesTrail(touchKind)) {
      const row = DECAY_TABLE[r.read(4)];
      if (typeof row === "undefined") return undefined;
      s.touch.trailMs = row.ms;
    }
    if (touchUsesBrush(touchKind)) s.touch.brush = r.flag() ? 2 : 1;
  }

  const sendKind = SEND_KINDS[r.read(3)];
  if (typeof sendKind === "undefined") return undefined;
  // A v1 payload can never legitimately contain the dial index, so it is
  // corruption rather than data and the whole payload is declined.
  if (!v2 && sendKind === "dial") return undefined;
  s.sends.kind = sendKind;
  if (sendKind === "trackpad") {
    s.sends.trackpad = {
      scrollInvert: r.flag(),
      scrollUnits: TRACKPAD_SCROLL_UNITS[r.read(3)],
      pointerCap: TRACKPAD_POINTER_CAPS[r.read(3)],
      pointerHoldOff: r.read(3) + 1,
      tapTolerance: TRACKPAD_TAP_TOLERANCE[r.read(3)],
      tapTicks: TRACKPAD_TAP_TICKS[r.read(3)],
      clickTicks: r.read(3) + 1,
    };
  } else if (sendKind !== "none") {
    s.sends.channel = r.read(4) + 1;
    s.sends.invertX = r.flag();
    s.sends.invertY = r.flag();
    const fingers = FINGERS[r.read(2)];
    if (typeof fingers === "undefined") return undefined;
    s.sends.fingers = fingers;
    if (sendsUsesPhase(sendKind)) {
      const phase = PHASES[r.read(2)];
      if (typeof phase === "undefined") return undefined;
      s.sends.phase = phase;
    }
    if (sendKind === "xy") {
      s.sends.ccBase = r.read(7);
      s.sends.hiRes = r.flag();
      if (v2) {
        const axes = AXES_MODES[r.read(2)];
        if (typeof axes === "undefined") return undefined;
        s.sends.axes = axes;
      }
      // Under v1 the field was not carried and "both" is the default the
      // state already holds.
      if (v4) {
        s.sends.spring = r.flag();
        s.sends.springTo = r.flag() ? "zero" : "centre";
        const bend = BEND_AXES[r.read(2)];
        if (typeof bend === "undefined") return undefined;
        s.sends.bend = bend;
        // The reserved bit is corruption when set: no writer emits it.
        if (r.read(1) !== 0) return undefined;
      }
    }
    if (sendKind === "dial") {
      s.sends.ccBase = r.read(7);
      s.sends.dialMode = r.flag() ? "absolute" : "relative";
      s.sends.dialSense = r.read(3) + 1;
      s.sends.dialRadius = r.flag();
    }
    if (sendKind === "zones") {
      const grid = GRIDS[r.read(2)];
      if (typeof grid === "undefined") return undefined;
      s.sends.grid = grid;
      s.sends.baseNote = r.read(7);
      const order = ORDERS[r.read(2)];
      if (typeof order === "undefined") return undefined;
      s.sends.order = order;
      s.sends.velocity = r.read(7);
      s.sends.hiRes = r.flag();
      s.sends.showGrid = r.flag();
      if (s.sends.showGrid) {
        s.sends.gridColour = r.colour();
        s.sends.heldColour = r.colour();
      }
      if (v4) {
        // All four 2-bit values are legal scales, so only the reserved
        // bits can fail here; a scale on a 9x9 grid is resolved by
        // normalise, the same way the writer resolved it before encoding.
        s.sends.scale = SCALE_KINDS[r.read(2)];
        s.sends.toggle = r.flag();
        if (r.read(2) !== 0) return undefined;
      }
    }
    if (sendKind === "faders") {
      s.sends.faders = r.flag() ? 4 : 3;
      s.sends.layout = r.flag() ? "rails" : "blocks";
      s.sends.ccBase = r.read(7);
      s.sends.showGrid = r.flag();
    }
  }

  s.calib = {
    rot: r.read(2) as 0 | 1 | 2 | 3,
    flipX: r.flag(),
    flipY: r.flag(),
  };

  if (r.flag()) {
    const owned: Partial<PadOwnership> = {};
    for (const slot of SLOTS) if (r.flag()) owned[slot] = "user";
    s.owned = owned;
  }

  if (v4) {
    // Unlike "c", the format character carries no brightness meaning, so
    // the full detent range 1..5 is legal; 0, 6 and 7 stay corruption.
    const b = r.read(3);
    if (b < 1 || b > 5) return undefined;
    s.brightness = b;
  } else if (v3) {
    // The domain is 1..4: 0 would be padding read as data, 5 would be a
    // default the writer never emits, 6..7 are unreachable. All four are
    // corruption and the whole payload is declined.
    const b = r.read(3);
    if (b < 1 || b > 4) return undefined;
    s.brightness = b;
  }

  // "d" exists only because a joystick or scale field is in play, the
  // same way "c" exists only because brightness is not Full. A "d"
  // payload whose raw fields need no v4 block is corruption, typically a
  // relabelled older payload whose reads happened to align, and it is
  // declined rather than half-trusted. Raw fields on purpose: a 9x9
  // scale is still a v4 field in play, and normalise resolves it after
  // this check the same way the writer resolved it before encoding.
  if (v4) {
    const needs =
      (s.sends.kind === "xy" && (s.sends.spring || s.sends.bend !== "none")) ||
      (s.sends.kind === "zones" &&
        (s.sends.scale !== "chromatic" || s.sends.toggle));
    if (!needs) return undefined;
  }

  if (!r.finished()) return undefined;
  if (s.sends.velocity < 1 || s.sends.velocity > 127) return undefined;
  if (s.sends.ccBase > maxCcBase(s)) return undefined;
  return normalisePadState(s);
}

export type PadActionRole = "managed" | "timer" | "user";

// Name-based, unlike the widget editor's structural check, and
// deliberately so: the savings that make the published costs true destroy
// the feature boundaries a structural parser would need. The stamp is the
// state of record and the body is its output, so the body is never
// compared back against the stamp - that would be a version lock rather
// than a safety net, turning every codegen improvement into a data-loss
// event.
export function padActionRole(
  short: string,
  name?: string,
): PadActionRole | undefined {
  if (short !== "cb" || typeof name === "undefined") return undefined;
  if (name === `${STAMP_PREFIX}u`) return "user";
  if (name === `${STAMP_PREFIX}t`) return "timer";
  if (/^z\.[0-9A-Za-z]{2,}$/.test(name)) return "managed";
  return undefined;
}

export function isPadManagedAction(short: string, name?: string): boolean {
  return typeof padActionRole(short, name) !== "undefined";
}

// ---------------------------------------------------------------------------
// Cost.
//
// Grid.Protocol.maxScriptLength is 909, so 908 characters are usable per
// event, markers included, and there are two of them. Two numbers matter
// and they differ: the device rejects on the COMPRESSED length of the
// event's toLua(), while GridEvent.insert() budgets on the UNCOMPRESSED
// one, which runs exactly one character per action higher because the
// minifier deletes the space after each ]]. The uncompressed figure is the
// binding one and it is what the editor's own counter shows, so both are
// checked here. A configuration the ledger called legal and the editor
// refused would be the worst kind of lie this compiler can tell.

export const EVENT_BUDGET = 908;
export const BUDGET_WARN = 606;
export const BUDGET_ERROR = 890;

export function measure(lua: string): number {
  assertPadCompilerReady();
  return GridScript.compressScript(lua).length;
}

export type Budget = { used: number; limit: number; free: number };

export type PadReserved = { setup: number; timer: number };

export type PadCost = {
  setup: Budget;
  timer: Budget;
  // The Shelf's ten dots read the tighter of the two and never say there
  // are two events.
  slotsFree: number;
  fits: boolean;
};

function budgetOf(lua: string, reserved: number): Budget {
  const used = Math.max(measure(lua), lua.length) + reserved;
  return { used, limit: EVENT_BUDGET, free: EVENT_BUDGET - used };
}

export function cost(
  result: CompileResult,
  reserved: PadReserved = { setup: 0, timer: 0 },
): PadCost {
  const setup = budgetOf(result.setupLua, reserved.setup);
  const timer = budgetOf(result.timerLua, reserved.timer);
  return {
    setup,
    timer,
    slotsFree: Math.min(setup.free, timer.free),
    fits: setup.free >= 0 && timer.free >= 0,
  };
}

export function fits(result: CompileResult, reserved?: PadReserved): boolean {
  return cost(result, reserved).fits;
}

// ---------------------------------------------------------------------------
// The ledger.
//
// Measured differentially: compile with the feature on, compile with it
// off, subtract. That is the only way the per-feature numbers stay true
// when features share a merged 81-LED loop, and it is what makes the
// "turn it off to free them" tooltip honest. It costs N+1 minifier calls,
// so the store should memoise on a state hash rather than call it per
// keystroke.

export type PadFeatureId =
  | "look"
  | "touch"
  | "sends"
  | "grid"
  | "hiRes"
  | "spring"
  | "scale"
  | "latch"
  | "keeper"
  | "watchdog"
  | "stamp"
  | "usercode";

export type LedgerRow = {
  id: PadFeatureId;
  label: string;
  detail?: string;
  event: PadEventName;
  chars: number;
  enabled: boolean;
  // A dash instead of a checkbox: the compiler generated it and the user
  // cannot switch it off on its own.
  generated: boolean;
  caveat?: string;
};

const LOOK_LABELS: Record<LookKind, string> = {
  none: "None",
  breathe: "Breathe",
  shimmer: "Shimmer",
  scan: "Scan",
  wave: "Wave",
  swirl: "Swirl",
  ripple: "Ripple",
  drift: "Drift",
  showpiece: "Showpiece",
};

const TOUCH_LABELS: Record<TouchKind, string> = {
  none: "None",
  comet: "Comet trail",
  perFinger: "Per-finger colours",
  bloom: "Bloom on tap",
  glow: "Glow dot",
  disturb: "Bend the background",
};

const SEND_LABELS: Record<SendKind, string> = {
  none: "None",
  xy: "Whole-pad XY",
  zones: "Note zones",
  faders: "Faders",
  trackpad: "Trackpad",
  dial: "Dial",
};

const SCALE_LABELS: Record<ScaleKind, string> = {
  chromatic: "Chromatic",
  major: "Major",
  minor: "Minor",
  pentatonic: "Pentatonic",
};

function withChange(s: PadState, change: (draft: PadState) => void): PadState {
  const draft = clonePadState(s);
  change(draft);
  // Any edit clears the shelf card, so the stamp becomes a field dump and
  // the measurement reflects what would really be written. A solo is
  // stripped for the same reason: the ledger, ghostCost and fit always
  // measure the real card, never the audition variant.
  delete draft.preset;
  delete draft.soloStream;
  return groundPadState(draft);
}

function eventCosts(s: PadState, user?: PadUserCode): PadReserved {
  const built = compile(s, user);
  const c = cost(built);
  return { setup: c.setup.used, timer: c.timer.used };
}

export function ledger(state: PadState, user?: PadUserCode): LedgerRow[] {
  const s = groundPadState(state);
  // The ledger prices the real card: a soloed state costs the same rows.
  delete s.soloStream;
  const plan = planLayers(s);
  const base = eventCosts(s, user);
  const rows: LedgerRow[] = [];

  const diff = (
    change: (draft: PadState) => void,
    event: PadEventName,
  ): number => {
    const without = eventCosts(withChange(s, change), user);
    return base[event] - without[event];
  };

  rows.push({
    id: "stamp",
    label: "Settings stamp",
    detail: "Lets the pad be reopened exactly as you left it",
    event: "setup",
    chars: 1 + STAMP_PREFIX.length + encodeStamp(s).length,
    enabled: true,
    generated: true,
  });

  if (plan.look) {
    rows.push({
      id: "look",
      label: `Look: ${LOOK_LABELS[s.look.kind]}`,
      event: "setup",
      chars: diff((d) => {
        d.look.kind = "none";
      }, "setup"),
      enabled: true,
      generated: false,
      caveat:
        s.look.kind === "shimmer"
          ? "Speed does nothing here: the never-repeating field comes from the per-light rate mix."
          : s.look.kind === "ripple"
            ? "Direction does nothing here: rings from centre or edge already sets it."
            : undefined,
    });
  }

  if (plan.touch) {
    rows.push({
      id: "touch",
      label: `Touch: ${TOUCH_LABELS[s.touch.kind]}`,
      event: "setup",
      chars: diff((d) => {
        d.touch.kind = "none";
      }, "setup"),
      enabled: true,
      generated: false,
      caveat:
        s.touch.kind === "comet"
          ? "A finger that stops moving stops reporting, so its dot fades while it is still down."
          : s.touch.kind === "glow"
            ? "One dot only: two fingers fight over it. The comet trail is cheaper and handles five."
            : s.touch.kind === "bloom"
              ? "Blooms replace rather than stack, so five fingers tapping together give one."
              : undefined,
    });
  }

  if (plan.sends) {
    rows.push({
      id: "sends",
      label: `Sends: ${SEND_LABELS[s.sends.kind]}`,
      detail: sendsDetail(s),
      event: "setup",
      chars: diff((d) => {
        d.sends.kind = "none";
      }, "setup"),
      enabled: true,
      generated: false,
    });
    if (sendsIsVisible(s)) {
      rows.push({
        id: "grid",
        label: "Show the control on the pad",
        event: "setup",
        chars: diff((d) => {
          d.sends.showGrid = false;
        }, "setup"),
        enabled: true,
        generated: false,
        caveat:
          s.sends.kind === "zones"
            ? "Two fingers in one pad: the highlight clears when the first one leaves. The notes stay correct."
            : undefined,
      });
    }
    if (s.sends.hiRes) {
      rows.push({
        id: "hiRes",
        label: "Fine resolution",
        event: "setup",
        chars: diff((d) => {
          d.sends.hiRes = false;
        }, "setup"),
        enabled: true,
        generated: false,
      });
    }
    if (s.sends.kind === "xy" && s.sends.spring) {
      rows.push({
        id: "spring",
        label: "Return on lift",
        detail:
          s.sends.springTo === "centre"
            ? "Lets go to the centre, like a synth joystick"
            : "Falls to zero on lift; a bend axis still centres",
        event: "setup",
        chars: diff((d) => {
          d.sends.spring = false;
        }, "setup"),
        enabled: true,
        generated: false,
      });
    }
    if (s.sends.kind === "zones" && s.sends.scale !== "chromatic") {
      rows.push({
        id: "scale",
        label: `Scale: ${SCALE_LABELS[s.sends.scale]}`,
        detail: "The note table is baked in, so this costs bytes, not time",
        event: "setup",
        chars: diff((d) => {
          d.sends.scale = "chromatic";
        }, "setup"),
        enabled: true,
        generated: false,
      });
    }
    if (s.sends.kind === "zones" && s.sends.toggle) {
      rows.push({
        id: "latch",
        label: "Pads latch",
        detail: "A press holds the note until the next press",
        event: "setup",
        chars: diff((d) => {
          d.sends.toggle = false;
        }, "setup"),
        enabled: true,
        generated: false,
      });
    }
  }

  if (plan.animates1 || plan.animates2) {
    rows.push({
      id: "keeper",
      label: "Keep it moving",
      detail: "Motion stops after eleven minutes without this",
      event: "timer",
      chars: diff((d) => {
        d.look.kind = "none";
        d.enabled.look = false;
      }, "timer"),
      enabled: true,
      generated: true,
    });
  }

  if (needsWatchdog(s, plan)) {
    rows.push({
      id: "watchdog",
      label: "Multi-touch accuracy",
      detail: "Releases a note the pad forgot to let go of",
      event: "timer",
      chars: diff((d) => {
        d.sends.kind = "none";
      }, "timer"),
      enabled: true,
      generated: true,
    });
  }

  const script = (user?.script ?? "").trim();
  if (script !== "") {
    rows.push({
      id: "usercode",
      label: "Your code",
      event: "setup",
      chars: measure(padActionToLua({ short: "cb", name: "z.u", script })) + 1,
      enabled: true,
      generated: false,
    });
  }

  return rows;
}

function sendsDetail(s: PadState): string | undefined {
  const ch = `ch ${s.sends.channel}`;
  switch (s.sends.kind) {
    case "xy": {
      const word = (axis: "x" | "y", n: number) =>
        s.sends.bend === axis ? "bend" : `CC ${n}`;
      return s.sends.axes === "x"
        ? `${word("x", s.sends.ccBase)}, ${ch}`
        : s.sends.axes === "y"
          ? `${word("y", s.sends.ccBase + 1)}, ${ch}`
          : `${word("x", s.sends.ccBase)} and ${word("y", s.sends.ccBase + 1)}, ${ch}`;
    }
    case "dial":
      return s.sends.dialRadius
        ? `CC ${s.sends.ccBase} and ${s.sends.ccBase + 1}, ${ch}`
        : `CC ${s.sends.ccBase}, ${ch}`;
    case "zones": {
      const g = gridDiv(s);
      const notes = zoneNotes(s);
      const first = notes ? notes[0] : s.sends.baseNote;
      const last = notes
        ? notes[notes.length - 1]
        : s.sends.baseNote + g * g - 1;
      return `Notes ${first} to ${last}, ${ch}`;
    }
    case "faders": {
      const n = faderCount(s);
      return `CC ${s.sends.ccBase} to ${s.sends.ccBase + n - 1}, ${ch}`;
    }
    case "trackpad":
      return "Pointer, scroll and click";
    default:
      return undefined;
  }
}

export function ghostCost(
  state: PadState,
  change: (draft: PadState) => void,
  user?: PadUserCode,
): PadCost {
  return cost(compile(withChange(groundPadState(state), change), user));
}

// ---------------------------------------------------------------------------
// Validation.
//
// GridScript.checkSyntax is a bare Lua parse: it accepts nosuchfunction(),
// wrong arities, and every semantic trap in this file. So the compiler
// runs its own lint first and treats checkSyntax as the last gate, not the
// only one. Both have to pass before EITHER write, because
// GridEvent.sendToGrid() returns { value: true, text: "Nothing to sync,
// event has invalid actions." } when isValid() is false: a broken script
// reports success and leaves the pad dead, which is precisely the failure
// class this whole product exists to abolish.

export type PadDiagnosticCode =
  | "syntax"
  | "over-budget"
  | "not-ready"
  | "trap-end-of-contact"
  | "trap-contact-gate"
  | "trap-float-division"
  | "trap-auto-phase"
  | "trap-unlit-layer"
  | "trap-comment"
  | "suppressed"
  | "unmeasured-orientation";

export type PadDiagnostic = {
  severity: "error" | "warning";
  code: PadDiagnosticCode;
  event?: PadEventName;
  message: string;
  detail?: string;
};

export class PadCompileError extends Error {
  readonly diagnostics: PadDiagnostic[];
  constructor(diagnostics: PadDiagnostic[]) {
    super(diagnostics.map((d) => d.message).join(" "));
    this.name = "PadCompileError";
    this.diagnostics = diagnostics;
  }
}

// Thrown when the Timer landed but the Setup did not, which leaves the pad
// running one half of one configuration and one half of another. Observed on
// real hardware: a config write during a busy 20 ms keeper timer failed with
// "Waiting for response was interrupted", and the module kept the old Setup
// beside the new Timer. Callers must surface this rather than treat it as a
// generic failure, because retrying is safe and doing nothing is not.
export class PadPartialWriteError extends Error {
  readonly wrote: PadEventName[];
  readonly failed: PadEventName;
  readonly cause: unknown;
  constructor(wrote: PadEventName[], failed: PadEventName, cause: unknown) {
    super(
      `The ${failed} event did not save, so the pad is running a mixed configuration. Try again.`,
    );
    this.name = "PadPartialWriteError";
    this.wrote = wrote;
    this.failed = failed;
    this.cause = cause;
  }
}

// Serial-level failures that are worth retrying. The grid link drops requests
// when the module is busy, which a fast keeper timer makes routine.
const TRANSIENT_WRITE = /interrupted|timeout|timed out|busy|no response/i;

function isTransient(e: unknown): boolean {
  // GridEvent's runtime methods reject with plain { value, text, type }
  // objects rather than Errors; String(obj) is "[object Object]", so the
  // transient text has to be read from .text or the retry never happens.
  const text =
    e instanceof Error
      ? e.message
      : typeof (e as { text?: unknown })?.text === "string"
        ? (e as { text: string }).text
        : String(e ?? "");
  return TRANSIENT_WRITE.test(text);
}

async function withRetry<T>(
  label: PadEventName,
  attempts: number,
  fn: () => Promise<T>,
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!isTransient(e) || i === attempts - 1) break;
      // Back off enough for the module to finish the cycle that blocked us.
      await new Promise((r) => setTimeout(r, 120 * (i + 1)));
    }
  }
  throw last;
}

export type TrapHit = { code: PadDiagnosticCode; index: number; text: string };

const LED_CALLS = [
  "glc",
  "gln",
  "gld",
  "glx",
  "glp",
  "glpfs",
  "glt",
  "glf",
  "gls",
  "glag",
];
const OUT_CALLS = ["gms", "gmms", "gmbs", "gks"];
const GUARDED_CALLS = [...LED_CALLS, ...OUT_CALLS];

type LuaCall = { name: string; args: string[]; index: number };

// A deliberately small scanner: find an identifier immediately followed by
// "(", take the balanced argument list, split it at top level. Scanning
// continues from the end of the identifier rather than the end of the
// call, so nested calls such as glp(glag(0,n),1,255) are seen too.
function scanCalls(body: string): LuaCall[] {
  const out: LuaCall[] = [];
  const re = /[A-Za-z_][A-Za-z0-9_]*(?=\()/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const open = m.index + m[0].length;
    let depth = 0;
    let i = open;
    let quote: string | undefined;
    const args: string[] = [];
    let start = open + 1;
    for (; i < body.length; i++) {
      const ch = body[i];
      if (typeof quote !== "undefined") {
        if (ch === quote && body[i - 1] !== "\\") quote = undefined;
        continue;
      }
      if (ch === "'" || ch === '"') {
        quote = ch;
        continue;
      }
      if (ch === "(" || ch === "{" || ch === "[") depth++;
      else if (ch === ")" || ch === "}" || ch === "]") {
        depth--;
        if (depth === 0) break;
      } else if (ch === "," && depth === 1) {
        args.push(body.slice(start, i));
        start = i + 1;
      }
    }
    if (depth !== 0) continue;
    if (i > start) args.push(body.slice(start, i));
    out.push({ name: m[0], args, index: m.index });
  }
  return out;
}

function isFloored(arg: string): boolean {
  return (
    arg.includes("//") ||
    arg.includes("math.tointeger(") ||
    arg.includes("math.floor(") ||
    arg.includes("math.ceil(")
  );
}

function hasBareDivision(arg: string): boolean {
  const stripped = arg.replace(/\/\//g, "");
  return stripped.includes("/");
}

// Everything the compiler generates returns []. This is an assertion with
// teeth rather than a user feature: if it ever fires on a generated body,
// a codegen edit broke an invariant.
export function findTraps(body: string): TrapHit[] {
  const hits: TrapHit[] = [];
  const push = (code: PadDiagnosticCode, index: number, text: string) =>
    hits.push({ code, index, text });

  // Code 9 is DOWNUP, a fast tap arriving as one message with no separate
  // UP, so anything waiting only for 5 leaks a stuck contact.
  const ended = /\be\s*==\s*5\b/.exec(body);
  if (ended) push("trap-end-of-contact", ended.index, ended[0]);

  // Firmware never remaps contact slots, so the survivor of a two-finger
  // touch keeps id 1 and this gate freezes the pointer at that moment.
  const gate = /if\s+i\s*[>~=]=?\s*0\s+then\s+return\s+end/.exec(body);
  if (gate) push("trap-contact-gate", gate.index, gate[0]);

  // A comment is preserved by the minifier and costs its full length plus
  // the newline it forces, so a generated body carries the marker and
  // nothing else.
  const comment = /--(?!\[\[@)/.exec(body);
  if (comment) push("trap-comment", comment.index, "--");

  const litLayers = new Set<string>();
  const phaseLayers = new Map<string, number>();

  for (const call of scanCalls(body)) {
    if (!GUARDED_CALLS.includes(call.name)) continue;

    for (const arg of call.args) {
      if (hasBareDivision(arg) && !isFloored(arg)) {
        push("trap-float-division", call.index, `${call.name}(${arg.trim()})`);
        break;
      }
    }

    // glp(n, layer, -1) never sets a phase on ZONA: for the indices where
    // real LED addresses land it returns silently with no diagnostic.
    if (call.name === "glp" && (call.args[2] ?? "").trim() === "-1") {
      push("trap-auto-phase", call.index, "glp(...,-1)");
    }

    const layer = (call.args[1] ?? "").trim();
    if (!/^[0-2]$/.test(layer)) continue;
    if (call.name === "glc" || call.name === "glx" || call.name === "gln") {
      litLayers.add(layer);
    }
    if (call.name === "glp" || call.name === "glpfs" || call.name === "glf") {
      if (!phaseLayers.has(layer)) phaseLayers.set(layer, call.index);
    }
  }

  for (const [layer, index] of phaseLayers) {
    if (!litLayers.has(layer)) {
      push("trap-unlit-layer", index, `layer ${layer}`);
    }
  }

  return hits;
}

const TRAP_MESSAGES: Record<string, string> = {
  "trap-end-of-contact":
    "A fast tap would leave a finger stuck down, because it arrives as one message with no separate lift.",
  "trap-contact-gate":
    "The pointer would freeze whenever the first finger lifts before the second.",
  "trap-float-division":
    "A fraction reaching the lights or the MIDI output silently becomes zero on this hardware.",
  "trap-auto-phase": "Automatic phase does nothing on this pad.",
  "trap-unlit-layer":
    "This would set motion on a light layer that has no colour, so the pad would stay black.",
  "trap-comment":
    "A comment here would cost as much space as the code around it.",
};

export function validate(
  result: CompileResult,
  reserved?: PadReserved,
): PadDiagnostic[] {
  const out: PadDiagnostic[] = [];
  if (!isPadCompilerReady()) {
    out.push({
      severity: "error",
      code: "not-ready",
      message: "The editor is still starting up. Try again in a moment.",
    });
    return out;
  }

  const events: { event: PadEventName; lua: string; body: string }[] = [
    {
      event: "setup",
      lua: result.setupLua,
      body: result.setup.map((a) => a.script).join(" "),
    },
    {
      event: "timer",
      lua: result.timerLua,
      body: result.timer.map((a) => a.script).join(" "),
    },
  ];

  // Syntax first and alone: compressScript THROWS on unparseable Lua, so
  // the budget check below cannot even run until this passes.
  for (const e of events) {
    if (e.lua === "") continue;
    if (!GridScript.checkSyntax(e.body)) {
      out.push({
        severity: "error",
        code: "syntax",
        event: e.event,
        message: "The generated code did not compile. Nothing was written.",
      });
    }
  }
  if (out.length > 0) return out;

  for (const e of events) {
    if (e.lua === "") continue;
    for (const hit of findTraps(e.body)) {
      out.push({
        severity: "error",
        code: hit.code,
        event: e.event,
        message: TRAP_MESSAGES[hit.code] ?? "The generated code is unsafe.",
        detail: hit.text,
      });
    }
  }

  const c = cost(result, reserved);
  for (const [event, budget] of [
    ["setup", c.setup],
    ["timer", c.timer],
  ] as const) {
    if (budget.free < 0) {
      out.push({
        severity: "error",
        code: "over-budget",
        event,
        message: `This pad needs ${-budget.free} more characters than it has room for.`,
      });
    }
  }

  for (const note of result.plan.notes) {
    out.push({
      severity: "warning",
      code: "suppressed",
      message: note.reason,
      detail: note.sheet,
    });
  }

  if (!isIdentityCalib(result.state.calib)) {
    out.push({
      severity: "warning",
      code: "unmeasured-orientation",
      message:
        "This pad is set to a rotated or mirrored mount, which the generated code does not apply.",
    });
  }

  return out;
}

// ---------------------------------------------------------------------------
// Reading an element back.

export type PadActionInput = { short: string; name?: string; script: string };

export type PadReadInput = {
  setup: PadActionInput[];
  timer: PadActionInput[];
};

export type SlotClaim = {
  slot: PadSlot;
  event: PadEventName;
  actionIndex: number;
  message: string;
};

export type PadRead = {
  // Undefined means no stamp: the pad was set up by hand, or it is the
  // factory default, and nothing is written until the user chooses to
  // replace it.
  state?: PadState;
  user: string;
  foreign: (PadActionInput & { event: PadEventName })[];
  claims: SlotClaim[];
};

// Blocks that abort the whole Setup script on a nil method and leave the
// pad dead, because none of these exist on the touch metatable.
export const PAD_KILLER_SHORTS: readonly string[] = [
  "bmo",
  "emo",
  "epmo",
  "pmo",
];
// Blocks that resolve a single LED through the element index and do
// nothing at all on a 81-cell pad.
export const PAD_NOOP_SHORTS: readonly string[] = ["sglc", "sglp"];

const SLOT_WARNINGS: Record<PadSlot, string> = {
  touchHandler:
    "Two blocks both set what a finger does. Only the last one runs, with no error on the pad.",
  timer:
    "Two blocks both set the repeating tick. Only the last one runs, with no error on the pad.",
  layer1:
    "Another block writes to the same light layer as your touch response. One of them will win silently.",
  layer2:
    "Another block writes to the same light layer as your look. One of them will win silently.",
};

export function scanForeignSlots(
  actions: PadActionInput[],
  event: PadEventName,
): SlotClaim[] {
  const claims: SlotClaim[] = [];
  actions.forEach((action, actionIndex) => {
    if (isPadManagedAction(action.short, action.name)) return;
    const claim = (slot: PadSlot) =>
      claims.push({
        slot,
        event,
        actionIndex,
        message: SLOT_WARNINGS[slot],
      });
    if (/\btouch_cb\s*=/.test(action.script)) claim("touchHandler");
    if (/\b(self|s)\s*\.\s*tim\s*=/.test(action.script)) claim("timer");
    for (const call of scanCalls(action.script)) {
      if (!LED_CALLS.includes(call.name) || call.name === "glag") continue;
      const layer = (call.args[1] ?? "").trim();
      if (layer === "1") claim("layer1");
      if (layer === "2") claim("layer2");
    }
  });
  // One warning per slot is enough; the panel names the danger, not the
  // count.
  return claims.filter(
    (c, i) => claims.findIndex((o) => o.slot === c.slot) === i,
  );
}

export function readPad(input: PadReadInput): PadRead {
  const foreign: PadRead["foreign"] = [];
  let state: PadState | undefined;
  let user = "";

  const walk = (actions: PadActionInput[], event: PadEventName) => {
    for (const action of actions) {
      const role = padActionRole(action.short, action.name);
      if (role === "managed") {
        const decoded = decodeStamp(
          (action.name ?? "").slice(STAMP_PREFIX.length),
        );
        // A stamp that does not decode is treated as no stamp, never as a
        // corrupt one, so an older editor meeting a newer payload declines
        // instead of overwriting.
        if (typeof decoded !== "undefined") {
          state = decoded;
          continue;
        }
        foreign.push({ ...action, event });
        continue;
      }
      if (role === "user") {
        user = action.script;
        continue;
      }
      if (role === "timer") continue;
      foreign.push({ ...action, event });
    }
  };

  walk(input.setup, "setup");
  walk(input.timer, "timer");

  return {
    ...(typeof state !== "undefined" ? { state } : {}),
    user,
    foreign,
    claims: [
      ...scanForeignSlots(input.setup, "setup"),
      ...scanForeignSlots(input.timer, "timer"),
    ],
  };
}

// ---------------------------------------------------------------------------
// The write.
//
// An injected adapter rather than a GridEvent, so this module stays
// importable in a headless test: ActionData.information routes through the
// config block registry, which throws until the whole Svelte component
// library has been initialised. The Phase 3 store builds the adapter from
// element.findEvent(0) and element.findEvent(6) in about ten lines.

export type PadEventWriter = {
  replace(actions: PadAction[]): Promise<void>;
  send(): Promise<void>;
};

export type PadWriteAdapter = {
  setup: PadEventWriter;
  timer: PadEventWriter;
  // Omitted for an audition write. Present for Store on the pad.
  storePage?(): Promise<void>;
};

export async function writePad(
  adapter: PadWriteAdapter,
  result: CompileResult,
  reserved?: PadReserved,
): Promise<void> {
  const diagnostics = validate(result, reserved).filter(
    (d) => d.severity === "error",
  );
  if (diagnostics.length > 0) throw new PadCompileError(diagnostics);

  // TIMER FIRST, ALWAYS. Storing Setup on its own leaves the left mouse
  // button held down after the first tap, because Setup runs immediately
  // in the live VM and nothing exists yet to release it. It also satisfies
  // gtt's precondition, which is a no-op until the Timer event holds at
  // least one stored action.
  //
  // Never GridElement.sendToGrid(): it collects the events into
  // Promise.all, so the order is not guaranteed. The two events are
  // written and awaited individually, in sequence.
  // Each half is retried on transient serial failures, because the link drops
  // requests while the module is busy and a fast keeper timer makes that
  // routine. If Setup still fails after the Timer landed, the pad is running a
  // mixed configuration and the caller has to be told precisely that.
  await withRetry("timer", 3, async () => {
    await adapter.timer.replace(result.timer);
    await adapter.timer.send();
  });

  try {
    await withRetry("setup", 3, async () => {
      await adapter.setup.replace(result.setup);
      await adapter.setup.send();
    });
  } catch (e) {
    throw new PadPartialWriteError(["timer"], "setup", e);
  }

  await adapter.storePage?.();
}

// ---------------------------------------------------------------------------
// The fit solver.
//
// It proposes and never applies. A compiler that turned Drift into Wave
// because Drift did not fit would make the picture on screen a lie about
// the object on the desk. Every unconditional saving - merged loops,
// integer arithmetic, glc over three colour calls, the slow keeper when
// nothing needs a fast tick - is already applied and is never offered,
// because nobody should be given the option to write worse code and a
// ladder that included them would double count.

export type FitStep = {
  id: string;
  feature: PadSheet;
  field: string;
  from: string;
  to: string;
  // The exact words the panel prints.
  label: string;
  saves: PadReserved;
  apply(state: PadState): PadState;
};

export type FitPlan = {
  setup: Budget;
  timer: Budget;
  fits: boolean;
  steps: FitStep[];
  resolved?: PadState;
  // Why no ladder exists. Sends never sheds past fine resolution, because
  // a fader bank quietly becoming three faders is the silent lie this
  // product exists to prevent, and Your code is never touched.
  blocked?: "sends" | "usercode";
};

const LOOK_STEP_DOWN: Partial<Record<LookKind, LookKind>> = {
  showpiece: "swirl",
  drift: "wave",
  ripple: "wave",
  swirl: "wave",
  wave: "scan",
  scan: "shimmer",
  shimmer: "breathe",
};

type Candidate = {
  id: string;
  feature: PadSheet;
  field: string;
  applies(s: PadState): boolean;
  from(s: PadState): string;
  to(s: PadState): string;
  label(s: PadState): string;
  change(d: PadState): void;
};

const LADDER: Candidate[] = [
  {
    id: "showGrid",
    feature: "sends",
    field: "showGrid",
    applies: (s) => sendsIsVisible(s),
    from: () => "drawn on the pad",
    to: () => "not drawn",
    label: () => "Stop drawing the control on the pad",
    change: (d) => {
      d.sends.showGrid = false;
    },
  },
  {
    id: "hiRes",
    feature: "sends",
    field: "hiRes",
    applies: (s) => s.sends.hiRes && s.sends.kind !== "none",
    from: () => "fine resolution",
    to: () => "standard resolution",
    label: () => "Turn off fine resolution",
    change: (d) => {
      d.sends.hiRes = false;
    },
  },
  {
    id: "dialRadius",
    feature: "sends",
    field: "dialRadius",
    applies: (s) => s.sends.kind === "dial" && s.sends.dialRadius,
    from: () => "sends distance from centre too",
    to: () => "turn only",
    label: () => "Turn off the distance-from-centre stream",
    change: (d) => {
      d.sends.dialRadius = false;
    },
  },
  {
    id: "lookDown",
    feature: "look",
    field: "kind",
    applies: (s) =>
      s.enabled.look && typeof LOOK_STEP_DOWN[s.look.kind] !== "undefined",
    from: (s) => LOOK_LABELS[s.look.kind],
    to: (s) => LOOK_LABELS[LOOK_STEP_DOWN[s.look.kind] ?? "breathe"],
    label: (s) =>
      `Change the look from ${LOOK_LABELS[s.look.kind]} to ${LOOK_LABELS[LOOK_STEP_DOWN[s.look.kind] ?? "breathe"]}`,
    change: (d) => {
      d.look.kind = LOOK_STEP_DOWN[d.look.kind] ?? "breathe";
    },
  },
  {
    id: "touchDown",
    feature: "touch",
    field: "kind",
    // The comet is the floor: stateless, multi-touch correct, and the
    // cheapest response that is also right. Bending the background is
    // cheaper still but it needs a background to bend, so it is a choice
    // and never a fallback.
    applies: (s) =>
      s.enabled.touch && s.touch.kind !== "none" && s.touch.kind !== "comet",
    from: (s) => TOUCH_LABELS[s.touch.kind],
    to: () => TOUCH_LABELS.comet,
    label: (s) =>
      `Change the touch response from ${TOUCH_LABELS[s.touch.kind]} to a comet trail`,
    change: (d) => {
      d.touch.kind = "comet";
    },
  },
  {
    id: "touchOff",
    feature: "touch",
    field: "enabled",
    applies: (s) => s.enabled.touch && s.touch.kind !== "none",
    from: (s) => TOUCH_LABELS[s.touch.kind],
    to: () => "nothing",
    label: () => "Turn off the touch response",
    change: (d) => {
      d.enabled.touch = false;
    },
  },
  {
    id: "lookOff",
    feature: "look",
    field: "enabled",
    applies: (s) => s.enabled.look && s.look.kind !== "none",
    from: (s) => LOOK_LABELS[s.look.kind],
    to: () => "nothing",
    label: () => "Turn off the look",
    change: (d) => {
      d.enabled.look = false;
    },
  },
];

export function fit(
  state: PadState,
  options?: {
    user?: PadUserCode;
    reserved?: PadReserved;
    // The control the user's hand is on. The compiler never proposes
    // degrading the thing they just moved.
    pinned?: PadSheet;
  },
): FitPlan {
  const user = options?.user;
  const reserved = options?.reserved ?? { setup: 0, timer: 0 };
  let current = groundPadState(state);
  // The solver reasons about the real card, never the audition variant.
  delete current.soloStream;
  let measured = cost(compile(current, user), reserved);
  const steps: FitStep[] = [];

  const plan = (): FitPlan => ({
    setup: measured.setup,
    timer: measured.timer,
    fits: measured.fits,
    steps,
    ...(measured.fits && steps.length > 0 ? { resolved: current } : {}),
  });

  if (measured.fits) return plan();

  for (let guard = 0; guard < 16 && !measured.fits; guard++) {
    const candidate = LADDER.find(
      (c) => c.feature !== options?.pinned && c.applies(current),
    );
    if (typeof candidate === "undefined") break;
    const next = withChange(current, candidate.change);
    const after = cost(compile(next, user), reserved);
    steps.push({
      id: candidate.id,
      feature: candidate.feature,
      field: candidate.field,
      from: candidate.from(current),
      to: candidate.to(current),
      label: candidate.label(current),
      saves: {
        setup: measured.setup.used - after.setup.used,
        timer: measured.timer.used - after.timer.used,
      },
      apply: (s: PadState) => withChange(groundPadState(s), candidate.change),
    });
    current = next;
    measured = after;
  }

  const result = plan();
  if (!result.fits) {
    result.blocked =
      (options?.user?.script ?? "").trim() !== "" ? "usercode" : "sends";
  }
  return result;
}

// ---------------------------------------------------------------------------
// Presets.
//
// Every declared cost is asserted in npm test against the compiler's own
// output, because without that one edit to a shared codegen helper leaves
// every published capacity number stale with no device-free way to catch
// it. The ids are the short stamp payload, so they are permanent: renaming
// one orphans every pad that carries it.

export type KnobKind =
  | "colour"
  | "speed"
  | "direction"
  | "size"
  | "count"
  | "note"
  | "feel"
  | "amount"
  // The dial's relative/absolute switch. A type extension only: the panel
  // maps it to an existing kit control, no kit change.
  | "mode"
  // The joystick's bend-axis and return-on-lift switches, and the zones
  // scale picker. Type extensions only, same as mode: existing kit
  // controls, no kit change.
  | "bend"
  | "spring"
  | "scale";

export type PadPreset = {
  id: string;
  name: string;
  sentence: string;
  category: "looks" | "instruments" | "computer";
  knobs: KnobKind[];
  exclusive?: boolean;
  quiet?: string;
  state: PadState;
  cost: { setup: number; timer: number };
};

function preset(
  id: string,
  name: string,
  sentence: string,
  category: PadPreset["category"],
  knobs: KnobKind[],
  change: (d: PadState) => void,
  cost: { setup: number; timer: number },
  extra?: { exclusive?: boolean; quiet?: string },
): PadPreset {
  const state = defaultState();
  change(state);
  state.preset = id;
  return {
    id,
    name,
    sentence,
    category,
    knobs,
    state: normalisePadState(state),
    cost,
    ...(extra ?? {}),
  };
}

export const PRESETS: readonly PadPreset[] = [
  preset(
    "aurora",
    "Aurora",
    "A band of light crosses the pad, and your finger leaves a glowing tail behind it.",
    "looks",
    ["colour", "speed", "direction", "size"],
    () => {
      // The default state is this card.
    },
    { setup: 250, timer: 55 },
  ),
  preset(
    "pinwheel",
    "Pinwheel",
    "Light turns around the centre, and each finger paints in its own colour.",
    "looks",
    ["colour", "speed", "count"],
    (d) => {
      d.look.kind = "swirl";
      d.look.colour = { r: 0, g: 110, b: 255 };
      d.touch.kind = "perFinger";
    },
    { setup: 312, timer: 55 },
  ),
  preset(
    "starfield",
    "Starfield",
    "Every light breathes at its own pace, so the pad never repeats itself.",
    "looks",
    ["colour", "feel"],
    (d) => {
      d.look.kind = "shimmer";
      d.look.colour = { r: 119, g: 153, b: 255 };
      d.touch.kind = "comet";
    },
    { setup: 238, timer: 55 },
  ),
  preset(
    "radar",
    "Radar",
    "Rings roll out from the centre, and the pad sends your finger's position to your computer.",
    "instruments",
    ["colour", "speed", "note"],
    (d) => {
      d.look.kind = "ripple";
      d.look.colour = { r: 255, g: 68, b: 0 };
      d.touch.kind = "comet";
      d.sends.kind = "xy";
      d.sends.fingers = "first";
    },
    { setup: 445, timer: 55 },
  ),
  preset(
    "joystick",
    "Joystick",
    "Push the pad like a synth stick: left-right bends pitch, and letting go snaps everything home.",
    "instruments",
    // bend is the per-axis message switch, spring the return-on-lift
    // three-way. Colour and the CC number matter more here than speed, so
    // the look stays an Adjust-sheet edit.
    ["colour", "note", "bend", "spring"],
    (d) => {
      // Dark field, one glow dot: the dot is the stick's position, parks
      // on the home cell on lift, and the home cell is lit from power-on.
      d.look.kind = "none";
      d.enabled.look = false;
      d.touch.kind = "glow";
      d.touch.colour = { r: 255, g: 187, b: 0 };
      d.sends.kind = "xy";
      d.sends.fingers = "first";
      d.sends.spring = true;
      d.sends.bend = "x";
      // The classic pitch/mod stick: the bend axis centres by definition,
      // and the CC axis falls to zero like a mod amount. Up is more, like
      // the fader cards, so the stick rests at the bottom-centre cell.
      d.sends.springTo = "zero";
      d.sends.invertY = true;
    },
    { setup: 542, timer: 24 },
    {
      quiet:
        "Left-right is pitch bend and snaps back straight. Up-down is a mod amount that falls to zero on lift.",
    },
  ),
  preset(
    "ninepads",
    "Nine pads",
    "Nine drum pads drawn on the lights, each one a note, with the one you are holding lit up.",
    "instruments",
    ["colour", "note", "scale", "amount"],
    (d) => {
      d.look.kind = "none";
      d.enabled.look = false;
      d.touch.kind = "none";
      d.enabled.touch = false;
      d.sends.kind = "zones";
      d.sends.grid = "3x3";
      d.sends.showGrid = true;
      d.sends.fingers = "each";
    },
    { setup: 580, timer: 158 },
  ),
  preset(
    "faders",
    "Four faders",
    "Four faders side by side, each with a white rail and a coloured level you can see across the room.",
    "instruments",
    ["note", "amount"],
    (d) => {
      d.look.kind = "none";
      d.enabled.look = false;
      d.touch.kind = "none";
      d.enabled.touch = false;
      d.sends.kind = "faders";
      d.sends.faders = 4;
      d.sends.layout = "rails";
      d.sends.showGrid = true;
      d.sends.phase = "held";
    },
    { setup: 520, timer: 24 },
  ),
  preset(
    "dial",
    "Dial",
    "Circle your finger and the pad becomes an endless knob, sending how far you turned.",
    "instruments",
    // note is the CC, feel the sensitivity detent, mode the
    // relative/absolute switch, amount the distance-from-centre stream.
    // Colour and speed stay Adjust-sheet edits: the preset cap is four
    // knobs and the mapping knobs matter more on this card.
    ["note", "feel", "mode", "amount"],
    (d) => {
      // Amber swirl: the rotational look matches the gesture, and colour
      // plus the comet response distinguish it from Pinwheel's blue swirl.
      // No new visual vocabulary, zero new LED budget.
      d.look.kind = "swirl";
      d.look.colour = { r: 255, g: 170, b: 0 };
      d.look.arms = 3;
      d.look.speed = 2;
      d.touch.kind = "comet";
      // Brings fingers "first" and hiRes off through normalise.
      d.sends.kind = "dial";
    },
    { setup: 646, timer: 55 },
    {
      quiet:
        "Clockwise raises, counter-clockwise lowers. The middle of the pad stays quiet.",
    },
  ),
  preset(
    "tpad",
    "Trackpad",
    "One finger moves the pointer, two fingers scroll, a tap clicks and two fingers tapping right-click.",
    "computer",
    ["feel", "amount"],
    (d) => {
      d.look.kind = "none";
      d.enabled.look = false;
      d.touch.kind = "none";
      d.enabled.touch = false;
      d.sends.kind = "trackpad";
    },
    { setup: 902, timer: 146 },
    {
      exclusive: true,
      quiet:
        "The pad has no pressure sensing, so this cannot tell a firm press from a light one.",
    },
  ),
];

export function presetById(id: string): PadPreset | undefined {
  return PRESETS.find((p) => p.id === id);
}
