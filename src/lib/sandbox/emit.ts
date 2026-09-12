// The Sandbox's emitter: a surface -> the touch Setup, the touch Timer and,
// under three slots, the system element's fourth event.
//
// ---------------------------------------------------------------------------
// 1. WHAT THIS EMITS, AND WHAT IT DOES NOT
// ---------------------------------------------------------------------------
//
// The data half (13-RESEARCH 3.1, "the split"): the region table `J`, the
// 81-entry cell map `M`, the paint loop, the pull-in call(s) that run the
// runtime's slot(s), and the callback assignment. The runtime itself - the
// per-kind behaviour a contact drives - is runtime.ts's (13-15), lives in the
// touch Timer (proved reachable from Setup by probe 1, `SLOT-ARITHMETIC.md`)
// and, under three slots, spans the system element's fourth event as well
// (probe 2); `packRuntime` decides which part lands where. runtime.ts defines
// the entry `O(s,i,e,x,y)`; this Setup installs it as the touch callback
// AFTER the pull-in has run, so `O` exists when it is named.
// On the wire the Sandbox is a Lua entry: 13-17 lands these two strings
// beside `TOUCH_LIBRARY` (255/0) and `TOUCH_LIBRARY_TIMER` (255/6) exactly
// as 12.1-07's `landLua` does for a hand-authored card, and the library's
// functions are what the runtime calls by name.
//
// THE NAMES ARE FREE OF THE LIBRARY'S. The plan's interfaces block calls the
// table `G` and the paint `Y()`; both are library functions since 12.1 (`G`
// the bilinear finger, `Y` a corner weight, `Z` the block), and 13-02's
// sketch used `S`, `N` and `K` for state that are now the library's too. The
// twenty-one names the library defines are `LIBRARY_GLOBALS`; emit.spec.ts
// test 5 asserts every name this file defines is outside that set and that
// the only capital names it CALLS are inside it. This file's own: `J` (the
// region table), `M` (the map), `O` (the runtime's entry, spelled once in
// runtime.ts and re-exported here), and under the inline contingency `S`
// (contact -> region index), `F` (last sent per contact) and `R` (the
// release convention, section 5 of library.ts - defined, never called here).
//
// ---------------------------------------------------------------------------
// 2. THE SHAPES
// ---------------------------------------------------------------------------
//
//   J={{g1,g2,g3,g4,t,cc,cc2,ch,r,g,b},...}   one row per region
//   M={[0]=n0,n1,...,n80}                      cell -> 1-based row index, 0 none
//
// THE FOUR GEOMETRY NUMBERS ARE PRECOMPUTED IN THE FRAME THE KIND READS THEM
// IN, so the runtime never derives a bound from a cell and pays no
// conversion (13-15; 13-14 carried the raw span of the cells for every kind,
// and the Phase 12.1 hand-off's rule replaced it: a fader's value is read on
// the library's CALIBRATED axis `U`, LED n at n*64, between the region's
// first and last LED centres, or the top and bottom LEDs do not give 127 and
// 0). Per kind:
//
//   fader, vertical    0, 0, gy, gh        gy = the BOTTOM LED's U (row*64),
//                                          gh = the LED span ((h-1)*64);
//                                          value (gy-U(y,KY))*127//gh, clamped
//   fader, horizontal  gx, gw, 0, 0        gx = the LEFT LED's U, gw = (w-1)*64;
//                                          value (U(x,KX)-gx)*127//gw
//   button             0, 0, 0, 0          reads none
//   XY pad             gx, gw, gy, gh      both axes as the faders read them
//   knob               cx, cy, 0, 0        the region's centre in RAW units:
//                                          its middle LED position through the
//                                          forward map (`sensorAt`), so the
//                                          centre and the dead zone are in the
//                                          sensor's own units (runtime.ts 5)
//
// A knob's row carries two more columns, its value and its accumulator
// remainder, both 0. The knots are imported, never typed; a one-row fader
// would divide by zero on the module, and model.ts section 4a is where that
// is refused.
//
// `M` IS `[0]=`-INDEXED so the lookup is `M[N(x,y)]` with `N` returning
// 0..80 - the spelling the Phase 12.1 hand-off names - at four characters
// once, against two per lookup for `M[N(x,y)+1]`. `M` is rendered from the
// SAME array geometry.ts built to validate the surface (test 3 asserts it
// cell for cell), so an overlapping surface has no `M` and cannot be emitted.
//
// A ROW'S SEVENTH COLUMN is the XY pad's second controller and the button's
// latch flag (0 or 1), 0 otherwise; the fifth is the type code (model.ts);
// the eighth is the wire channel (0..15, through `wireChannel`); columns
// nine to eleven are the colour as `glc` takes it (0..255, through
// `colourByte`). Every number is emitted at its exact width - no padding,
// no float.
//
// ---------------------------------------------------------------------------
// 3. DEAD-BRANCH ELIMINATION IS A PARAMETER, AND THE INLINE CONTINGENCY
// ---------------------------------------------------------------------------
//
// `branches` names the runtime branches to emit and defaults to the ones the
// surface uses (`branchesUsed`). The data half has no branches of its own -
// `J`, `M` and the paint are the same for every kind - so the parameter reaches
// the runtime: under the split it is what `packRuntime` reads to emit the
// Timer (and 255/4) per surface, and under the INLINE contingency it selects
// which of the four branch texts below go into the callback - dead-branch
// elimination in the research's words, worth about 470 characters there.
// The contingency exists because the research measured four vertical faders
// inline at 697 against 1,166 with every branch (13-RESEARCH 3.1), and the
// plan asks the pair to be re-measured rather than quoted (emit.spec.ts test
// 2). It carries no Knob branch: the rotary is runtime.ts's (D-08), and an
// inline surface with a Knob is refused rather than approximated.
//
// The inline callback, in prose (its text is assembled below): an end code
// (`e~=1 and e~=4 and e<9`) hands the contact to the library's `E`, whose
// release `R` sends a button's 0 - so a lost lift (Probe A Q6.5) is released
// by the Timer's `X` sweep through the same `R`. An onset (`e==4 or e>8`)
// first expires the same id (12-07's rule, section 7 of library.ts) and then
// pins the region under the finger through `M[N(x,y)]`; every live sample
// stamps `T[i]=C` so the sweep sees it; a contact KEEPS the region it landed
// in for the whole gesture, so a finger dragged off a fader's end does not
// start driving the XY pad beside it - which is why Phase 12's `Q` and `W`
// are not on this hot path. Faders and the XY pad send on change only; a 9
// (press and lift in one message) is ended in the same pass after its onset
// was taken, so nothing is built on 9 staying live. Both class gates run
// over the text in emit.spec.ts test 4 with the gate's own needles.
//
// ---------------------------------------------------------------------------
// 4. THE SLOTS, AND WHY THE THIRD PULL-IN IS OFF BY DEFAULT
// ---------------------------------------------------------------------------
//
// 13-02 recorded the user's answer as `three-slots` (SLOT-ARITHMETIC.md
// section 5): the Sandbox may pull the runtime in from the touch Timer
// (`self:tim()`, probe 1) AND from the system element's fourth event
// (`ele[#ele]:map()`, probe 2 - `ele[#ele]` is the spelling that lit, and
// `map` is the firmware's short name for the mapmode event,
// GRID_LUA_FNC_A_MAPMODE_short in ../grid-fw/common/src/c/grid_protocol.h,
// read and not edited). This emitter takes `slots` as a parameter and emits
// BOTH calls under 3. The default is 2, for one reason that is a safety
// matter and not a ceiling: HANGAR does not write 255/4 until 13-17 lands
// (D-19), and until it does that slot holds the firmware's default -
// page-next, `gpl(gpn())` - so a Setup that called `ele[#ele]:map()` on a
// module whose 255/4 is untouched would TURN THE PAGE on every load. 13-17
// flips the default when its write and its PUT BACK exist. The costs are
// measured under both (emit.spec.ts test 1 prints the pair) and the
// difference is the fifteen characters of the second call.
//
// The ceiling in element KINDS is the runtime's - runtime.ts section 6 and
// runtime.spec.ts test 7 measure it under both slot counts; the data half is
// the same under every answer, which was 13-14's premise and holds.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { LED_STEP, sensorAt } from "../catalog/calibration";
import { buildCellMap, type CellMap } from "./geometry";
import {
  BRANCHES,
  SURFACE_CELLS,
  branchesUsed,
  colourByte,
  orientationOf,
  typeCodeOf,
  wireChannel,
  type Branch,
  type Region,
  type Surface,
} from "./model";
import {
  DEFAULT_SWEEP_CALLS,
  MARKER,
  RUNTIME_ENTRY,
  packRuntime,
  sweepCall,
  type PackedRuntime,
} from "./runtime";

export { MARKER, RUNTIME_ENTRY, DEFAULT_SWEEP_CALLS };

/** The names this emitter defines, split and inline. Test 5 holds them apart from the library's. */
export const OWN_NAMES_SPLIT: readonly string[] = ["J", "M"];
export const OWN_NAMES_INLINE: readonly string[] = ["J", "M", "S", "F", "R"];

/** The pull-in calls, by slot (section 4). */
export const PULL_IN_TIMER = "self:tim()";
export const PULL_IN_MAPMODE = "ele[#ele]:map()";

/** The quiet resting phase the paint sets on a region's cells. PROVISIONAL; 13-15 / 13-16 may move it. */
export const DEFAULT_REST_PHASE = 48;

export type EmitOptions = {
  /** 2: the touch Timer only. 3: the Timer and 255/4 (section 4). Default 2. */
  readonly slots?: 2 | 3;
  /** "split" (default): the runtime is pulled in. "inline": the contingency. */
  readonly runtime?: "split" | "inline";
  /** Dead-branch elimination's parameter. Default: the branches the surface uses. */
  readonly branches?: readonly Branch[];
  readonly sweepCalls?: number;
  readonly restPhase?: number;
};

export type Emitted = {
  readonly setup: string;
  readonly timer: string;
  /** The system element's fourth event under three slots (runtime.ts section 6); undefined otherwise. */
  readonly mapmode: string | undefined;
  /** The packed runtime under the split; undefined under the inline contingency. */
  readonly runtime: PackedRuntime | undefined;
  /** The parts, for a spec that measures them apart. */
  readonly parts: {
    readonly regionTable: string;
    readonly cellMap: string;
    readonly paint: string;
    readonly pullIn: string;
    readonly callback: string;
  };
  readonly branches: readonly Branch[];
  readonly map: CellMap;
};

// ---------------------------------------------------------------------------
// The geometry numbers (section 2).

/** LED `c`'s position on the calibrated axis: `c * 64`, what `U` returns at the knot. */
const led = (c: number): number => c * LED_STEP;

/** The four geometry numbers of a region, in its kind's frame (section 2). */
export function geometryOf(region: Region): [number, number, number, number] {
  const { col, row, w, h } = region;
  switch (region.kind) {
    case "fader":
      return orientationOf(region) === "horizontal"
        ? [led(col), led(w - 1), 0, 0]
        : [0, 0, led(row + h - 1), led(h - 1)];
    case "xy":
      return [led(col), led(w - 1), led(row + h - 1), led(h - 1)];
    case "knob":
      // The centre in raw units: the middle LED position on each axis through
      // the forward map (an LED centre for an odd width, halfway between two
      // for an even one). Rounded to the sensor's own integers.
      return [
        Math.round(sensorAt(col + (w - 1) / 2, "x")),
        Math.round(sensorAt(row + (h - 1) / 2, "y")),
        0,
        0,
      ];
    case "button":
      return [0, 0, 0, 0];
  }
}

/** A region's row: `{g1,g2,g3,g4,t,cc,cc2,ch,r,g,b}`, plus `0,0` on a knob. */
export function regionRow(region: Region): number[] {
  const [x0, x1, y0, y1] = geometryOf(region);
  const seventh =
    region.kind === "xy"
      ? (region.cc2 ?? 0)
      : region.kind === "button" && region.latch
        ? 1
        : 0;
  return [
    x0,
    x1,
    y0,
    y1,
    typeCodeOf(region),
    region.cc,
    seventh,
    wireChannel(region.channel),
    ...region.colour.map(colourByte),
    // A knob's value and its accumulator remainder (runtime.ts section 5).
    ...(region.kind === "knob" ? [0, 0] : []),
  ];
}

// ---------------------------------------------------------------------------
// The parts.

/** `J={{...},{...}}` - one row per region, in the surface's order. */
export function renderRegionTable(regions: readonly Region[]): string {
  return `J={${regions.map((r) => `{${regionRow(r).join(",")}}`).join(",")}}`;
}

/** `M={[0]=...}` - the 81 entries, rendered from geometry.ts's own array. */
export function renderCellMap(map: CellMap): string {
  if (map.length !== SURFACE_CELLS)
    throw new Error("the cell map is not 81 entries");
  return `M={[0]=${map.join(",")}}`;
}

/**
 * The paint: every region's cells coloured on layer 1 at the resting phase.
 * A bare loop, not a function: nothing ever clears layer 1 (the library's
 * `V` clears the layer `G` last drew on, and a Sandbox finger is drawn
 * above the regions, on layer 2 - 13-RESEARCH 3.1), so no caller would
 * ever re-paint, and the wrapper's sixteen characters buy nothing.
 */
export function renderPaint(restPhase: number): string {
  return (
    "for n=0,80 do local r=J[M[n]]if r then local a=glag(0,n)" +
    `glc(a,1,r[9],r[10],r[11],1)glp(a,1,${restPhase})end end`
  );
}

/** The pull-in calls, by slot count. */
export function renderPullIn(slots: 2 | 3): string {
  return slots === 3 ? PULL_IN_TIMER + PULL_IN_MAPMODE : PULL_IN_TIMER;
}

// ---------------------------------------------------------------------------
// The inline contingency (section 3). Assembled from the branches asked for.

const INLINE_OPEN =
  "self.touch_cb=function(s,i,e,x,y)" +
  "if e~=1 and e~=4 and e<9 then E(s,i)return end " +
  "local o=e==4 or e>8 if o then E(s,i)S[i]=M[N(x,y)]end T[i]=C " +
  "local r=J[S[i]]if not r then return end local t=r[5]";

// On the calibrated axis with the per-kind geometry numbers (section 2),
// exactly as runtime.ts's branches read them.
const FADER_V =
  "if t==1 then local v=glim((r[3]-U(y,KY))*127//r[4],0,127)" +
  "if v~=F[i]then F[i]=v s:gms(r[8],176,r[6],v,0)end end";

const FADER_H =
  "if t==2 then local v=glim((U(x,KX)-r[1])*127//r[2],0,127)" +
  "if v~=F[i]then F[i]=v s:gms(r[8],176,r[6],v,0)end end";

const BUTTON =
  "if t==3 and o then if r[7]>0 then r[12]=not r[12]" +
  "s:gms(r[8],176,r[6],r[12]and 127 or 0,0)else s:gms(r[8],176,r[6],127,0)end end";

const XY =
  "if t==4 then local a,b=glim((U(x,KX)-r[1])*127//r[2],0,127)," +
  "glim((r[3]-U(y,KY))*127//r[4],0,127)local p=F[i]or{}" +
  "if a~=p[1]then s:gms(r[8],176,r[6],a,0)end " +
  "if b~=p[2]then s:gms(r[8],176,r[7],b,0)end F[i]={a,b}end";

const INLINE_CLOSE = "if e>8 then E(s,i)end end";

/** The release convention: clear the contact's pin, and send a momentary button's 0. */
const RELEASE_WITH_BUTTON =
  "R=function(s,i)local r=J[S[i]]S[i]=nil F[i]=nil " +
  "if r and r[5]==3 and r[7]==0 then s:gms(r[8],176,r[6],0,0)end end";
const RELEASE = "R=function(s,i)S[i]=nil F[i]=nil end";

const INLINE_BRANCH: Record<Exclude<Branch, "knob">, string> = {
  "fader-v": FADER_V,
  "fader-h": FADER_H,
  button: BUTTON,
  xy: XY,
};

/** The inline callback for the branches named, with its state and release. */
export function renderInlineCallback(branches: readonly Branch[]): string {
  if (branches.includes("knob")) {
    throw new Error(
      "the inline contingency has no Knob branch: the rotary is 13-15's (D-08)",
    );
  }
  const ordered = BRANCHES.filter((b) => branches.includes(b)) as Exclude<
    Branch,
    "knob"
  >[];
  const release = ordered.includes("button") ? RELEASE_WITH_BUTTON : RELEASE;
  return (
    "S={}F={}" +
    release +
    " " +
    INLINE_OPEN +
    ordered.map((b) => INLINE_BRANCH[b]).join(" ") +
    " " +
    INLINE_CLOSE
  );
}

/** The split's callback: the runtime entry installed after the pull-in ran. */
export const SPLIT_CALLBACK = `self.touch_cb=${RUNTIME_ENTRY}`;

// ---------------------------------------------------------------------------
// The emit.

/**
 * A surface -> its two touch strings. Throws on a surface the cell map
 * refuses (overlap or off-surface): such a surface has no `M` and cannot be
 * emitted, by construction. Callers validate first through geometry.ts.
 */
export function emitSurface(
  surface: Surface,
  options: EmitOptions = {},
): Emitted {
  const built = buildCellMap(surface.regions);
  if (!built.ok) {
    throw new Error(
      built.kind === "overlap"
        ? `${built.a} overlaps ${built.b}: an overlapping surface has no cell map`
        : `${built.region} is off the surface (${built.field})`,
    );
  }
  const slots = options.slots ?? 2;
  const runtime = options.runtime ?? "split";
  const branches = options.branches ?? branchesUsed(surface.regions);
  const restPhase = options.restPhase ?? DEFAULT_REST_PHASE;
  const sweepCalls = options.sweepCalls ?? DEFAULT_SWEEP_CALLS;

  const regionTable = renderRegionTable(surface.regions);
  const cellMap = renderCellMap(built.map);
  const paint = renderPaint(restPhase);
  const pullIn = runtime === "split" ? renderPullIn(slots) : "";
  const callback =
    runtime === "split" ? SPLIT_CALLBACK : renderInlineCallback(branches);

  // The paint ends in `end` and what follows starts with a name, so one
  // separator; every other seam is `}` against a name and needs none.
  const setup =
    MARKER + regionTable + cellMap + paint + " " + pullIn + callback;
  // The split's Timer (and 255/4) are the runtime's, packed per surface;
  // the inline contingency's Timer is the sweep alone.
  const packed =
    runtime === "split"
      ? packRuntime(branches, { slots, sweepCalls })
      : undefined;
  const timer = packed ? packed.timer : MARKER + sweepCall(sweepCalls);

  return {
    setup,
    timer,
    mapmode: packed?.mapmode,
    runtime: packed,
    parts: { regionTable, cellMap, paint, pullIn, callback },
    branches,
    map: built.map,
  };
}

/** The capital-letter names a Lua text CALLS (`X(`), one or two capitals, as library.ts spells them. */
export function capitalCalls(lua: string): string[] {
  return [
    ...new Set(
      [...lua.matchAll(/(?<![A-Za-z0-9_.:])([A-Z]{1,2})\s*\(/g)].map(
        (m) => m[1],
      ),
    ),
  ].sort();
}

/** The capital-letter names a Lua text DEFINES (`X=` or `function X(`). */
export function capitalDefinitions(lua: string): string[] {
  return [
    ...new Set([
      ...[...lua.matchAll(/(?<![A-Za-z0-9_.:[])([A-Z]{1,2})=/g)].map(
        (m) => m[1],
      ),
      ...[...lua.matchAll(/\bfunction\s+([A-Z]{1,2})\s*\(/g)].map((m) => m[1]),
    ]),
  ].sort();
}
