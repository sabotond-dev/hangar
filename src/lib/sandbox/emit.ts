// The Sandbox's emitter: a surface -> the touch Setup and the touch Timer.
//
// ---------------------------------------------------------------------------
// 1. WHAT THIS EMITS, AND WHAT IT DOES NOT
// ---------------------------------------------------------------------------
//
// The data half (13-RESEARCH 3.1, "the split"): the region table `J`, the
// 81-entry cell map `M`, the paint loop, the pull-in call(s) that run the
// runtime's slot(s), and the callback assignment. The runtime itself - the
// per-kind behaviour a contact drives - is 13-15's, lives in the touch Timer
// (proved reachable from Setup by probe 1, `SLOT-ARITHMETIC.md`) and, for a
// four-kind surface, spans the system element's fourth event as well (probe
// 2). 13-15 defines the entry `O(s,i,e,x,y)`; this Setup installs it as the
// touch callback AFTER the pull-in has run, so `O` exists when it is named.
//
// THE NAMES ARE FREE OF THE LIBRARY'S. The plan's interfaces block calls the
// table `G` and the paint `Y()`; both are library functions since 12.1 (`G`
// the bilinear finger, `Y` a corner weight, `Z` the block), and 13-02's
// sketch used `S`, `N` and `K` for state that are now the library's too. The
// twenty-one names the library defines are `LIBRARY_GLOBALS`; emit.spec.ts
// test 5 asserts every name this file defines is outside that set and that
// the only capital names it CALLS are inside it. This file's own: `J` (the
// region table), `M` (the map), `O` (13-15's runtime entry,
// named here so both plans spell it once), and under the inline contingency
// `S` (contact -> region index), `F` (last sent per contact) and `R` (the
// release convention, section 5 of library.ts - defined, never called here).
//
// ---------------------------------------------------------------------------
// 2. THE SHAPES
// ---------------------------------------------------------------------------
//
//   J={{x0,x1,y0,y1,t,cc,cc2,ch,r,g,b},...}   one row per region
//   M={[0]=n0,n1,...,n80}                      cell -> 1-based row index, 0 none
//
// `x0..y1` ARE PRECOMPUTED IN RAW 0..127 UNITS. A fader's value is
// `127-(y-y0)*127//(y1-y0)` and the compiler knows `y0` and `y1` exactly, so
// the runtime never derives a bound from a cell. The bounds are the raw
// span of the region's cells UNDER THE MEASURED MAP: cell `c` on an axis
// begins at the midpoint between knots `c-1` and `c` and ends one short of
// the midpoint between `c` and `c+1` (`KX` / `KY`, calibration.ts, measured
// on the user's ZONA by Probe C), with the first cell starting at 0 and the
// last ending at 127 because the pad reaches its edges (Probe A Q5). That is
// exactly the span in which the library's `N(x,y)` reports one of the
// region's cells, so a finger that is IN the region by the map's reckoning
// is inside its bounds by the fader's. The knots are imported, never typed.
//
// `M` IS `[0]=`-INDEXED so the lookup is `M[N(x,y)]` with `N` returning
// 0..80 - the spelling the Phase 12.1 hand-off names - at four characters
// once, against two per lookup for `M[N(x,y)+1]`. `M` is rendered from the
// SAME array geometry.ts built to validate the surface (test 3 asserts it
// cell for cell), so an overlapping surface has no `M` and cannot be emitted.
//
// A ROW'S SEVENTH COLUMN is the XY pad's second controller and the button's
// latch flag (0 or 1), 0 otherwise; the fifth is the type code (model.ts);
// the eighth is the wire channel (0..15, through `wireChannel`); the last
// three are the colour as `glc` takes it (0..255, through `colourByte`).
// Every number is emitted at its exact width - no padding, no float.
//
// ---------------------------------------------------------------------------
// 3. DEAD-BRANCH ELIMINATION IS A PARAMETER, AND THE INLINE CONTINGENCY
// ---------------------------------------------------------------------------
//
// `branches` names the runtime branches to emit and defaults to the ones the
// surface uses (`branchesUsed`). The data half has no branches of its own -
// `J`, `M` and the paint are the same for every kind - so the parameter reaches
// the runtime: under the split it is what 13-15 reads to emit the Timer per
// surface, and under the INLINE contingency it selects which of the four
// branch texts below go into the callback. The contingency exists because
// the research measured four vertical faders inline at 697 against 1,166
// with every branch (13-RESEARCH 3.1), and the plan asks the pair to be
// re-measured rather than quoted (emit.spec.ts test 2). It carries no Knob
// branch: the rotary is 13-15's (D-08), and an inline surface with a Knob is
// refused rather than approximated.
//
// The inline callback, in prose (its text is `INLINE` below): an end code
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
// The ceiling in element KINDS is the runtime's and 13-15 measures it; the
// data half is the same under every answer, which is the plan's premise.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { KX, KY } from "../catalog/calibration";
import { buildCellMap, type CellMap } from "./geometry";
import {
  BRANCHES,
  LAST_CELL,
  SURFACE_CELLS,
  branchesUsed,
  colourByte,
  typeCodeOf,
  wireChannel,
  type Branch,
  type Region,
  type Surface,
} from "./model";

/** The event marker every stored body opens with (9 characters, a block comment). */
export const MARKER = "--[[@cb]]";

/** 13-15's runtime entry, installed as the touch callback under the split. */
export const RUNTIME_ENTRY = "O";

/** The names this emitter defines, split and inline. Test 5 holds them apart from the library's. */
export const OWN_NAMES_SPLIT: readonly string[] = ["J", "M"];
export const OWN_NAMES_INLINE: readonly string[] = ["J", "M", "S", "F", "R"];

/** The pull-in calls, by slot (section 4). */
export const PULL_IN_TIMER = "self:tim()";
export const PULL_IN_MAPMODE = "ele[#ele]:map()";

/** The Timer's sweep: `X(self, n)` expires contacts unseen for n Timer calls (library.ts section 8). */
export const DEFAULT_SWEEP_CALLS = 20;

/** The quiet resting phase the paint sets on a region's cells. PROVISIONAL; 13-15 / 13-16 may move it. */
export const DEFAULT_REST_PHASE = 48;

export type EmitOptions = {
  /** 2: the touch Timer only. 3: the Timer and 255/4 (section 4). Default 2. */
  readonly slots?: 2 | 3;
  /** "split" (default): the runtime is pulled in. "inline": the contingency. */
  readonly runtime?: "split" | "inline";
  /** Dead-branch elimination's parameter. Default: the branches the surface uses. */
  readonly branches?: readonly Branch[];
  /** The runtime body 13-15 supplies for the Timer, ahead of the sweep call. */
  readonly runtimeBody?: string;
  readonly sweepCalls?: number;
  readonly restPhase?: number;
};

export type Emitted = {
  readonly setup: string;
  readonly timer: string;
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
// The bounds (section 2).

/** The first raw value of cell `c` on the axis with knots `k`. */
export function rawLow(c: number, k: readonly number[]): number {
  return c === 0 ? 0 : Math.ceil((k[c - 1] + k[c]) / 2);
}

/** The last raw value of cell `c` on the axis with knots `k`. */
export function rawHigh(c: number, k: readonly number[]): number {
  return c === LAST_CELL ? 127 : Math.ceil((k[c] + k[c + 1]) / 2) - 1;
}

/** A region's row: `{x0,x1,y0,y1,t,cc,cc2,ch,r,g,b}`. */
export function regionRow(region: Region): number[] {
  const x0 = rawLow(region.col, KX);
  const x1 = rawHigh(region.col + region.w - 1, KX);
  const y0 = rawLow(region.row, KY);
  const y1 = rawHigh(region.row + region.h - 1, KY);
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

const FADER_V =
  "if t==1 then local v=glim(127-(y-r[3])*127//(r[4]-r[3]),0,127)" +
  "if v~=F[i]then F[i]=v s:gms(r[8],176,r[6],v,0)end end";

const FADER_H =
  "if t==2 then local v=glim((x-r[1])*127//(r[2]-r[1]),0,127)" +
  "if v~=F[i]then F[i]=v s:gms(r[8],176,r[6],v,0)end end";

const BUTTON =
  "if t==3 and o then if r[7]>0 then r[12]=not r[12]" +
  "s:gms(r[8],176,r[6],r[12]and 127 or 0,0)else s:gms(r[8],176,r[6],127,0)end end";

const XY =
  "if t==4 then local a,b=glim((x-r[1])*127//(r[2]-r[1]),0,127)," +
  "glim(127-(y-r[3])*127//(r[4]-r[3]),0,127)local p=F[i]or{}" +
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
  const sweep = `X(self,${options.sweepCalls ?? DEFAULT_SWEEP_CALLS})`;

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
  const runtimeBody = runtime === "split" ? (options.runtimeBody ?? "") : "";
  const timer = MARKER + (runtimeBody ? runtimeBody + " " : "") + sweep;

  return {
    setup,
    timer,
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
