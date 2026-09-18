// The Sandbox's emitter: a surface -> the touch Setup, the touch Timer, the system element's
// fourth event (255/4) under three slots and, under five (change 10B), the two trimmed system
// halves carrying the runtime's overflow. The Setup is the data half: the region table `J` (one
// row per region: its BOX in cells, its kind, controller, channel and colour, then the change 10B
// tail - min, max, the flag word, a spring position - written only past the last non-default),
// the `[0]`-indexed 81-entry cell map `M` (the same array geometry.ts validated), the paint on
// layer 1, the pull-in call(s) `self:tim()` / `ele[#ele]:map()` that run the runtime's slot(s),
// and `self.touch_cb=O` AFTER the pull-in so `O` exists when it is named. A blank (change 10A) is
// paint only: its row carries the colour alone, its cells in `M` are its index NEGATED. The
// runtime is runtime.ts's, packed per surface with only the branches the surface's kinds need;
// on the wire the Sandbox is a Lua entry (land.ts). This file's names are `J M`, free of the
// library's - emit.spec.ts test 5. History: docs/entries/sandbox-runtime.md.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { brightnessOf, scaleChannel } from "../catalog/brightness";
import { sensorAt } from "../catalog/calibration";
import { buildCellMap, type CellMap } from "./geometry";
import {
  BRANCHES,
  SURFACE_CELLS,
  branchesUsed,
  colourByte,
  flagsOf,
  groupOf,
  isPaintOnly,
  maxOf,
  minOf,
  springOf,
  springPosition,
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
  type SlotCount,
} from "./runtime";

export { MARKER, RUNTIME_ENTRY, DEFAULT_SWEEP_CALLS, BRANCHES };

/** The names this emitter defines. Test 5 holds them apart from the library's. */
export const OWN_NAMES: readonly string[] = ["J", "M"];

/** The pull-in calls, by slot: the touch Timer (probe 1) and the system element's fourth event (probe 2, `map` the firmware's short name for the mapmode event). */
export const PULL_IN_TIMER = "self:tim()";
export const PULL_IN_MAPMODE = "ele[#ele]:map()";

/** The quiet resting phase the paint sets on a region's cells. */
const DEFAULT_REST_PHASE = 48;

/** The tail's defaults, in column order: min 0, max 127, flags 0 - a trailing default is omitted. */
export const TAIL_DEFAULTS: readonly number[] = [0, 127, 0];

export type EmitOptions = {
  /** 2: the touch Timer only. 3: the Timer and 255/4. 5: those and the trimmed system halves (change 10B). Default 2 - emit.spec.ts pins the two-slot figures; every shipped caller passes 5 (the route's SLOTS, preview.ts's PREVIEW_SLOTS, land.ts's LANDING_SLOTS). */
  readonly slots?: SlotCount;
  /** Dead-branch elimination's parameter. Default: the branches the surface uses. */
  readonly branches?: readonly Branch[];
  readonly sweepCalls?: number;
  readonly restPhase?: number;
};

export type Emitted = {
  readonly setup: string;
  readonly timer: string;
  /** The system element's fourth event under three or five slots (runtime.ts, `packRuntime`); undefined otherwise. */
  readonly mapmode: string | undefined;
  /** 255/6 and 255/0 under five slots: the trimmed library halves and the runtime parts they carry; undefined otherwise. */
  readonly systemTimer: string | undefined;
  readonly system: string | undefined;
  /** The packed runtime. */
  readonly runtime: PackedRuntime;
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

/**
 * The four geometry numbers of a region: its BOX in cells, `col, row, w, h` (change 10B; until
 * then the kind's own frame). The runtime derives what it reads from the box - a fader's
 * calibrated bounds (`(row+h-1)*64`, `(h-1)*64`), a knob's centre through the knots - and the
 * pictures need the cells. A one-row fader would divide by zero on the module; model.ts refuses it.
 */
export function geometryOf(region: Region): [number, number, number, number] {
  return [region.col, region.row, region.w, region.h];
}

/**
 * A knob's centre in RAW units, as the runtime computes it from the knots: the middle LED's
 * knot for an odd width, the floor of the midpoint of the middle two for an even one - what
 * `sensorAt` gives for the middle LED position, so a spec can hold the two equal.
 */
export function knobCentre(region: Region): [number, number] {
  return [
    Math.round(sensorAt(region.col + (region.w - 1) / 2, "x")),
    Math.round(sensorAt(region.row + (region.h - 1) / 2, "y")),
  ];
}

/** The colour columns, nine to eleven: 0..255 scaled to the surface's brightness (change 5; 255 is the identity). */
const colourColumns = (region: Region, brightness: number): number[] =>
  region.colour.map((level) => scaleChannel(colourByte(level), brightness));

/**
 * The change 10B tail: `min, max, flags[, spring position | centre x, centre y]`, trimmed of
 * trailing defaults - a region with every option at its default has no tail at all, and the
 * runtime reads the missing columns as 0, 127, 0 (runtime.ts, `O`). Column 15 is a spring
 * fader's spring position; columns 15 and 16 a knob's centre in raw units (always written: the
 * rotary reads them on every sample); either forces the three before it.
 */
export function regionTail(region: Region): number[] {
  const columns = [minOf(region), maxOf(region), flagsOf(region)];
  if (springOf(region)) return [...columns, springPosition(region)];
  if (region.kind === "knob") return [...columns, ...knobCentre(region)];
  let end = columns.length;
  while (end > 0 && columns[end - 1] === TAIL_DEFAULTS[end - 1]) end -= 1;
  return columns.slice(0, end);
}

/** A region's row: `{col,row,w,h,t,cc,c7,ch,r,g,b}` and the tail - the seventh column is the XY pad's second controller or the button's radio group, the eighth the wire channel 0..15, nine to eleven the colour; every number at its exact width. A blank has no row of numbers (`blankRow`). */
export function regionRow(region: Region, brightness: number = 255): number[] {
  if (isPaintOnly(region)) {
    throw new Error("a blank has no numeric row: renderRegionTable paints it");
  }
  const seventh = region.kind === "xy" ? (region.cc2 ?? 0) : groupOf(region);
  return [
    ...geometryOf(region),
    typeCodeOf(region),
    region.cc,
    seventh,
    wireChannel(region.channel),
    ...colourColumns(region, brightness),
    ...regionTail(region),
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
 * The paint: every region's cells coloured on layer 1 at the resting phase,
 * and the same colour set on layer 2 at phase 0 - the runtime's pictures
 * (change 10B) only move layer 2's phase. A bare loop, not a function: nothing
 * ever clears layer 1, so no caller would ever re-paint, and the wrapper's
 * sixteen characters buy nothing. With a blank on the surface the lookup falls
 * through to the negated index.
 */
function renderPaint(restPhase: number, withBlanks: boolean): string {
  return (
    `for n=0,80 do local r=J[M[n]]${withBlanks ? "or J[-M[n]]" : ""}if r then local a=glag(0,n)` +
    `glc(a,1,r[9],r[10],r[11],1)glp(a,1,${restPhase})glc(a,2,r[9],r[10],r[11],1)end end`
  );
}

/** The pull-in calls, by slot count: the Timer alone under two, the Timer and 255/4 under three or five. */
function renderPullIn(slots: SlotCount): string {
  return slots >= 3 ? PULL_IN_TIMER + PULL_IN_MAPMODE : PULL_IN_TIMER;
}

/** The callback: the runtime entry installed after the pull-in ran. */
const CALLBACK = `self.touch_cb=${RUNTIME_ENTRY}`;

// ---------------------------------------------------------------------------
// The emit.

/**
 * A surface -> its strings. Throws on a surface the cell map refuses (overlap
 * or off-surface): such a surface has no `M` and cannot be emitted, by
 * construction. Callers validate first through geometry.ts.
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
  const branches = options.branches ?? branchesUsed(surface.regions);
  const restPhase = options.restPhase ?? DEFAULT_REST_PHASE;
  const sweepCalls = options.sweepCalls ?? DEFAULT_SWEEP_CALLS;

  // The one place the surface's brightness reaches the wire: every colour the
  // Sandbox writes is in J (the paint reads r[9..11], the runtime's pictures too).
  const regionTable = renderRegionTable(
    surface.regions,
    brightnessOf(surface.brightness),
  );
  const blanks = blankIndices(surface.regions);
  const cellMap = renderCellMap(built.map, blanks);
  const paint = renderPaint(restPhase, blanks.size > 0);
  const pullIn = renderPullIn(slots);

  // The paint ends in `end` and what follows starts with a name, so one
  // separator; every other seam is `}` against a name and needs none.
  const setup =
    MARKER + regionTable + cellMap + paint + " " + pullIn + CALLBACK;
  const packed = packRuntime(branches, { slots, sweepCalls });

  return {
    setup,
    timer: packed.timer,
    mapmode: packed.mapmode,
    systemTimer: packed.systemTimer,
    system: packed.system,
    runtime: packed,
    parts: { regionTable, cellMap, paint, pullIn, callback: CALLBACK },
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

/** `sweepCall`, re-exported for a spec that builds the two-slot Timer by hand. */
export { sweepCall };
