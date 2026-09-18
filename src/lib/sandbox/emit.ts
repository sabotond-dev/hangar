// The Sandbox's emitter: a surface -> the touch Setup, the touch Timer and, under three slots,
// the system element's fourth event (255/4). The Setup is the data half: the region table `J`
// (one row per region, its geometry precomputed in the frame its kind reads), the `[0]`-indexed
// 81-entry cell map `M` (the same array geometry.ts validated), the paint on layer 1, the pull-in
// call(s) `self:tim()` / `ele[#ele]:map()` that run the runtime's slot(s), and `self.touch_cb=O`
// AFTER the pull-in so `O` exists when it is named. A blank (change 10A) is paint only: its row in
// `J` carries the colour alone, its cells in `M` are its index NEGATED so the runtime's `J[M[n]]`
// finds nothing (no finger drawn, nothing sent) and the paint's `or J[-M[n]]` finds the colour;
// a surface without a blank emits byte for byte what it did. The Timer and 255/4 are runtime.ts's, packed
// per surface with only the branches the surface's kinds need. On the wire the Sandbox is a Lua
// entry: land.ts's `measureLuaRoute` and `land` put these strings beside `TOUCH_LIBRARY` (255/0)
// and `TOUCH_LIBRARY_TIMER` (255/6). This file's names are `J M` (inline: `J M S F R`), free of
// the library's twenty-one - emit.spec.ts test 5. History: docs/entries/sandbox-runtime.md.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { brightnessOf, scaleChannel } from "../catalog/brightness";
import { LED_STEP, sensorAt } from "../catalog/calibration";
import { buildCellMap, type CellMap } from "./geometry";
import {
  BRANCHES,
  SURFACE_CELLS,
  branchesUsed,
  colourByte,
  isPaintOnly,
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

/** The pull-in calls, by slot: the touch Timer (probe 1) and the system element's fourth event (probe 2, `map` the firmware's short name for the mapmode event). */
export const PULL_IN_TIMER = "self:tim()";
export const PULL_IN_MAPMODE = "ele[#ele]:map()";

/** The quiet resting phase the paint sets on a region's cells. */
const DEFAULT_REST_PHASE = 48;

export type EmitOptions = {
  /** 2: the touch Timer only. 3: the Timer and 255/4. Default 2 - emit.spec.ts pins the two-slot figures; every shipped caller passes 3 (the route's SLOTS, preview.ts's PREVIEW_SLOTS, land.ts's LANDING_SLOTS). */
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
  /** The system element's fourth event under three slots (runtime.ts, `packRuntime`); undefined otherwise. */
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
// The geometry numbers.

/** LED `c`'s position on the calibrated axis: `c * 64`, what `U` returns at the knot. */
const led = (c: number): number => c * LED_STEP;

/**
 * The four geometry numbers of a region, in the frame its kind reads them in, so the runtime
 * derives no bound from a cell: a vertical fader `0, 0, gy, gh` (gy the BOTTOM LED's U = row*64,
 * gh the LED span (h-1)*64; value (gy-U(y,KY))*127//gh, so the top and bottom LEDs give 127 and
 * 0); a horizontal fader `gx, gw, 0, 0` from the LEFT LED; a button `0, 0, 0, 0`; an XY pad
 * `gx, gw, gy, gh`; a knob `cx, cy, 0, 0`, its centre in RAW units through the forward map. A
 * one-row fader would divide by zero on the module; model.ts refuses it.
 */
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
    case "blank":
      return [0, 0, 0, 0];
  }
}

/** The colour columns, nine to eleven: 0..255 scaled to the surface's brightness (change 5; 255 is the identity). */
const colourColumns = (region: Region, brightness: number): number[] =>
  region.colour.map((level) => scaleChannel(colourByte(level), brightness));

/** A region's row: `{g1,g2,g3,g4,t,cc,cc2,ch,r,g,b}`, plus `0,0` on a knob - the seventh column is the XY pad's second controller or the button's latch flag, the eighth the wire channel 0..15, nine to eleven the colour; every number at its exact width. A blank has no row of numbers (`blankRow`). */
export function regionRow(region: Region, brightness: number = 255): number[] {
  if (isPaintOnly(region)) {
    throw new Error("a blank has no numeric row: renderRegionTable paints it");
  }
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
    ...colourColumns(region, brightness),
    // A knob's value and its accumulator remainder (runtime.ts, the rotary branch).
    ...(region.kind === "knob" ? [0, 0] : []),
  ];
}

/** A blank's row: the colour at columns nine to eleven and nothing else - `{[9]=r,[10]=g,[11]=b}`, the paint's three reads. */
export function blankRow(region: Region, brightness: number = 255): string {
  const [r, g, b] = colourColumns(region, brightness);
  return `{[9]=${r},[10]=${g},[11]=${b}}`;
}

// ---------------------------------------------------------------------------
// The parts.

/** `J={{...},{...}}` - one row per region, in the surface's order, the colours at the brightness; a blank's row is `blankRow`'s. */
export function renderRegionTable(
  regions: readonly Region[],
  brightness: number = 255,
): string {
  const rows = regions.map((r) =>
    isPaintOnly(r)
      ? blankRow(r, brightness)
      : `{${regionRow(r, brightness).join(",")}}`,
  );
  return `J={${rows.join(",")}}`;
}

/** The 1-based indices of the blanks among the regions - the entries `renderCellMap` negates. */
export function blankIndices(regions: readonly Region[]): ReadonlySet<number> {
  const out = new Set<number>();
  regions.forEach((r, i) => {
    if (isPaintOnly(r)) out.add(i + 1);
  });
  return out;
}

/** `M={[0]=...}` - the 81 entries from geometry.ts's own array, `[0]`-indexed so the lookup is `M[N(x,y)]`; a blank's cells carry its index negated. */
export function renderCellMap(
  map: CellMap,
  blanks: ReadonlySet<number> = new Set(),
): string {
  if (map.length !== SURFACE_CELLS)
    throw new Error("the cell map is not 81 entries");
  return `M={[0]=${map.map((n) => (blanks.has(n) ? -n : n)).join(",")}}`;
}

/**
 * The paint: every region's cells coloured on layer 1 at the resting phase.
 * A bare loop, not a function: nothing ever clears layer 1 (the library's
 * `V` clears the layer `G` last drew on, and a Sandbox finger is drawn
 * above the regions, on layer 2 - 13-RESEARCH 3.1), so no caller would
 * ever re-paint, and the wrapper's sixteen characters buy nothing. With a
 * blank on the surface the lookup falls through to the negated index.
 */
function renderPaint(restPhase: number, withBlanks: boolean): string {
  return (
    `for n=0,80 do local r=J[M[n]]${withBlanks ? "or J[-M[n]]" : ""}if r then local a=glag(0,n)` +
    `glc(a,1,r[9],r[10],r[11],1)glp(a,1,${restPhase})end end`
  );
}

/** The pull-in calls, by slot count. */
function renderPullIn(slots: 2 | 3): string {
  return slots === 3 ? PULL_IN_TIMER + PULL_IN_MAPMODE : PULL_IN_TIMER;
}

// ---------------------------------------------------------------------------
// The inline contingency: the whole callback in the Setup, assembled from the branches asked
// for, with its own `S F R`; no Knob branch (the rotary is runtime.ts's), so an inline surface
// with a Knob is refused. emit.spec.ts test 2 re-measures four faders inline against every branch.

const INLINE_OPEN =
  "self.touch_cb=function(s,i,e,x,y)" +
  "if e~=1 and e~=4 and e<9 then E(s,i)return end " +
  "local o=e==4 or e>8 if o then E(s,i)S[i]=M[N(x,y)]end T[i]=C " +
  "local r=J[S[i]]if not r then return end local t=r[5]";

// On the calibrated axis with the per-kind geometry numbers,
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
function renderInlineCallback(branches: readonly Branch[]): string {
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
const SPLIT_CALLBACK = `self.touch_cb=${RUNTIME_ENTRY}`;

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

  // The one place the surface's brightness reaches the wire: every colour the
  // Sandbox writes is in J (the paint reads r[9..11], the runtime's finger too).
  const regionTable = renderRegionTable(
    surface.regions,
    brightnessOf(surface.brightness),
  );
  const blanks = blankIndices(surface.regions);
  const cellMap = renderCellMap(built.map, blanks);
  const paint = renderPaint(restPhase, blanks.size > 0);
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
