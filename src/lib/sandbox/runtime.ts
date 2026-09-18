// The Sandbox's runtime: the Lua a contact drives - the guarded state head, the release
// convention `R`, the entry `O`, three helpers (`Q` the region painter, `D` the scaled send on
// change, `K` a button's off), one branch per kind (`I[1]`..`I[5]`, `I[2]` the fader's second
// name) and `packRuntime`, which spreads the parts over the slots a surface lands on: under five
// (change 10B) the trimmed system halves' tails (255/6, 255/0), 255/4 and the touch Timer (0/6),
// largest part first. Every string here was run in a real Lua VM before it was measured or
// pinned (runtime.spec.ts, wasmoon). The runtime spends the names `S F I R O` and three the trim
// frees (`Q D K`), and calls the library's `E N U X` and nothing else - the pictures are its own
// `glp` on layer 2, whose colour the Setup's paint set. Every table it creates is guarded
// (`S=S or{}`) because the Timer re-runs every 100 ms. History: docs/entries/sandbox-runtime.md.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { EVENT_BUDGET } from "../../vendor/botor/_pad";
import { TRIMMED_LIBRARY, TRIMMED_LIBRARY_TIMER } from "./library-trim";
import {
  BRANCHES,
  KNOB_DEAD_ZONE_SQUARED,
  KNOB_STEP_DEG,
  type Branch,
} from "./model";

/** The event marker every stored body opens with (9 characters, a block comment). */
export const MARKER = "--[[@cb]]";

/** The runtime's entry, installed by the Setup as the touch callback. Spelled once. */
export const RUNTIME_ENTRY = "O";

/** The Timer's period in milliseconds; the sweep window is in calls of it. */
const TIMER_PERIOD_MS = 100;

/** `X(self, n)` expires contacts unseen for n Timer calls (library.ts section 8): CHORUS's twenty. */
export const DEFAULT_SWEEP_CALLS = 20;

/** The names this file defines. emit.spec.ts / runtime.spec.ts hold them apart from the library's. */
export const RUNTIME_NAMES: readonly string[] = [
  "S",
  "F",
  "I",
  "R",
  "O",
  "Q",
  "D",
  "K",
];

/** The library names the runtime calls, and only these (the pictures are the runtime's own, so not `G`). */
export const RUNTIME_CALLS: readonly string[] = ["E", "N", "U", "X"];

/** A relative fader's or XY pad's position is kept in fine units: 127 per position step, 0..16129. */
export const FINE_MAX = 127 * 127;

/** The knob's arc sweeps this many degrees from its low position (7:30, 135 degrees) at 127. */
export const KNOB_ARC_DEG = 270;
export const KNOB_ARC_START_DEG = 135;

/** The relative knob's lit sector: the cells within this many degrees of the finger, either side. */
export const KNOB_SECTOR_DEG = 45;

/** The most detents a relative knob can report in one sample: a sample's wrapped delta is at most 180 degrees, 22 steps - inside every encoding's 63 by construction, so no cap is written. */
export const KNOB_STEP_CAP = Math.floor(180 / KNOB_STEP_DEG);

/**
 * The row's state columns, past the data (1..11 and the tail 12..16): 17 the held fine position
 * (a fader), the held x (an XY pad), the on-flag (a button), the position (a knob); 18 the held
 * y (an XY pad), the step remainder (a knob); 19 and 20 the last sent value per controller; 21
 * the XY pad's crosshair cell. Named here for the reader; the Lua spells the numbers.
 */
export const STATE_COLUMNS = {
  held: 17,
  heldY: 18,
  sent: 19,
  sentY: 20,
  crosshair: 21,
} as const;

// ---------------------------------------------------------------------------
// The text. Each part is one statement; `joinLua` supplies the one separator
// the minifier keeps, so the packed strings are fixed points of it.

/**
 * Opens the Timer. The firmware timer is a one-shot the body re-arms: the Setup's `self:tim()`
 * runs the body once and arms it, and every re-run re-arms it; without this call the Timer never
 * fires on the module and the sweep never runs.
 * Decided at 13-15; see .planning/phases/13-gui-overhaul/13-15-SUMMARY.md
 */
export const ARM = `gtt(0,${TIMER_PERIOD_MS})`;

/** The guarded state head at the top of every slot that carries a part: the Timer re-runs, so `S={}` would drop every finger ten times a second. */
export const STATE = "S=S or{}F=F or{}I=I or{}";

/**
 * `R`: the release convention the library calls and the entry defines. Forget the contact's
 * region and its anchor; then the kind's release: a spring fader returns to its spring position
 * (held, sent, drawn - through its own branch with no finger), an absolute fader clears its bar,
 * a relative one keeps it; a momentary button that is on goes off through `K` (a toggle stays);
 * an XY pad and a knob clear. `E` calls it on every release path.
 */
export const RELEASE =
  "R=function(s,i)local r=J[S[i]]S[i]=nil F[i]=nil if not r then return end " +
  "local t,f=r[5],r[14]" +
  "if t<3 then if f//4>0 then r[17]=r[15]*127 I[1](s,i,r)elseif f%2<1 then Q(r)end " +
  "elseif t==3 then if f%2<1 and r[17]then K(s,r)end else r[21]=nil Q(r)end end";

/**
 * `O`: the entry. An end code (`e~=1 and e~=4 and e<9`) hands the contact to `E` and returns; an
 * onset (`e==4 or e>8`) first expires the same id, then any other contact holding the region
 * landed on, then pins `S[i]` to `M[N(x,y)]`. Every live sample stamps `T[i]=C` for the sweep;
 * a contact with no region (or a blank's, negated) returns; the row's omitted tail columns are
 * read as their defaults once here (min 0, max 127, flags 0); then the kind's branch `I[t]`; a 9
 * is ended in the same pass. A contact keeps its region for the whole gesture.
 */
export const ENTRY =
  `${RUNTIME_ENTRY}=function(s,i,e,x,y)` +
  "if e~=1 and e~=4 and e<9 then E(s,i)return end " +
  "local o=e==4 or e>8 " +
  "if o then E(s,i)local n=M[N(x,y)]" +
  "for j,g in pairs(S)do if g==n then E(s,j)end end S[i]=n end " +
  "T[i]=C local r=J[S[i]]if not r then return end " +
  "r[12]=r[12]or 0 r[13]=r[13]or 127 r[14]=r[14]or 0 " +
  "I[r[5]](s,i,r,x,y,o)" +
  "if e>8 then E(s,i)end end";

/**
 * `Q(r,f)`: the region painter - every cell of the region's box on layer 2 at the phase `f(x,y)`
 * returns (x, y the cell's offset in the box); `Q(r)` alone clears the region. The colour is the
 * Setup's paint's, set on layer 2 once.
 */
export const PAINT =
  "function Q(r,f)for y=0,r[4]-1 do for x=0,r[3]-1 do " +
  "glp(glag(0,(r[2]+y)*9+r[1]+x),2,f and f(x,y)or 0)end end end";

/**
 * `D(s,r,n,c,v)`: the scale and the send. A position `v` 0..127 along the region's travel ->
 * `min + (max - min) * v // 127` (model.ts `scaleValue` is the twin), sent on controller `c`
 * when it differs from the last value sent, kept in column `n`.
 */
export const SEND =
  "function D(s,r,n,c,v)v=r[12]+(r[13]-r[12])*v//127 " +
  "if v~=r[n]then r[n]=v s:gms(r[8],176,c,v,0)end end";

/** `K(s,r)`: a button off - a note-off (status 128, velocity 0) or the min on its controller; the on-flag and the light go. */
export const BUTTON_OFF =
  "function K(s,r)if r[14]//2%2>0 then s:gms(r[8],128,r[6],0,0)" +
  "else s:gms(r[8],176,r[6],r[12],0)end r[17]=nil Q(r)end";

// The position on the calibrated axis between the region's first and last LED centres: a
// vertical fader reads 127 at its top LED and 0 at its bottom, a horizontal one 0 at the left.
const POS_V = "glim(((r[2]+r[4]-1)*64-U(y,KY))*127//((r[4]-1)*64),0,127)";
const POS_H = "glim((U(x,KX)-r[1]*64)*127//((r[3]-1)*64),0,127)";

/**
 * The fader, both orientations (`I[2]=I[1]`; the type code picks the axis). With a finger: the
 * position `p` along the axis; relative (flag bit 0), the onset anchors and changes nothing and
 * a move adds the displacement times the speed (64 or 127 fine units a step, bit 1) to the held
 * fine position, clamped, which starts at the spring position when there is one; absolute, the
 * held position mirrors the finger. Without a finger (`R`'s spring return) the held position is
 * the value. Then the scaled send on change and the bar from the low end to `p`.
 */
const FADER =
  "I[1]=function(s,i,r,x,y,o)local f,p=r[14],(r[17]or 0)//127 " +
  `if x then p=r[5]<2 and ${POS_V}or ${POS_H}` +
  "if f%2>0 then if o then F[i]=p return end " +
  `r[17]=glim((r[17]or(r[15]or 0)*127)+(p-F[i])*(f//2%2>0 and 127 or 64),0,${FINE_MAX})` +
  "F[i]=p p=r[17]//127 else r[17]=p*127 end end " +
  "D(s,r,19,r[6],p)local v=r[5]<2 local k=p*((v and r[4]or r[3])-1)//127 " +
  "Q(r,function(x,y)return(v and r[4]-1-y or x)<=k and 255 or 0 end)end I[2]=I[1]";

/**
 * The button, on an onset only: an on toggle (bit 0) goes off through `K`; a radio group (`r[7]`
 * 1..8) turns every other on member off through `K` first; then on - the max as the value (or
 * the velocity, status 144, under a note output) - and the whole region lit.
 */
const BUTTON =
  "I[3]=function(s,i,r,x,y,o)if not o then return end local f=r[14]" +
  "if f%2>0 and r[17]then K(s,r)return end " +
  "if r[7]>0 then for _,g in pairs(J)do " +
  "if g~=r and g[5]==3 and g[7]==r[7]and g[17]then K(s,g)end end end " +
  "r[17]=true s:gms(r[8],f//2%2>0 and 144 or 176,r[6],r[13],0)" +
  "Q(r,function()return 255 end)end";

/**
 * The XY pad: both positions as the fader reads them; the crosshair through the finger's cell
 * `N(x,y)` (redrawn when the cell moves, `r[21]`); relative as the fader, per axis, the pair
 * held in `r[17]`, `r[18]`; one scaled send per controller on change.
 */
const XY =
  `I[4]=function(s,i,r,x,y,o)local f,a,b=r[14],${POS_H},${POS_V}` +
  "local c=N(x,y)if c~=r[21]then r[21]=c " +
  "Q(r,function(x,y)return(r[1]+x==c%9 or r[2]+y==c//9)and 255 or 0 end)end " +
  "if f%2>0 then if o then F[i]={a,b}return end local k=f//2%2>0 and 127 or 64 " +
  `r[17]=glim((r[17]or 0)+(a-F[i][1])*k,0,${FINE_MAX})r[18]=glim((r[18]or 0)+(b-F[i][2])*k,0,${FINE_MAX})` +
  "F[i]={a,b}a,b=r[17]//127,r[18]//127 end " +
  "D(s,r,19,r[6],a)D(s,r,20,r[7],b)end";

// The rotary: the centre in raw units from the row (`r[15]`, `r[16]`, emit.ts `knobCentre`),
// the dead zone (`F[i]=nil`, so leaving on the far side is a fresh start), whole degrees, the
// wrap `(a-F[i]+180)%360-180`, `math.modf` for whole steps with a signed remainder in `r[18]`;
// the position `r[17]` is per region, the previous angle per contact. Under a relative mode
// (`r[14]` 1..3) the detents crossed in the sample (at most 22: the wrap bounds a sample at 180
// degrees, inside every encoding's 63) go out in the mode's encoding
// and no position is kept. The picture: the cells whose angle from `b` lies within `k` - the arc
// from 7:30 to the position under absolute, a sector round the finger under relative; the centre
// cell stays dark.
const KNOB =
  "I[5]=function(s,i,r,x,y)local m,u,v=r[14],x-r[15],y-r[16]" +
  `if u*u+v*v<${KNOB_DEAD_ZONE_SQUARED} then F[i]=nil return end ` +
  "local a=math.deg(math.atan(v,u))//1 " +
  "if F[i]then local c=(r[18]or 0)+(a-F[i]+180)%360-180 " +
  `local k,e=math.modf(c/${KNOB_STEP_DEG})r[18]=e*${KNOB_STEP_DEG} ` +
  "if k~=0 then if m>0 then " +
  "s:gms(r[8],176,r[6],m==1 and k%128 or m==2 and 64+k or k>0 and k or 64-k,0)" +
  "else r[17]=glim((r[17]or 0)+k,0,127)D(s,r,19,r[6],r[17])end end end F[i]=a " +
  `local b,k=${KNOB_ARC_START_DEG},(r[17]or 0)*${KNOB_ARC_DEG}//127 ` +
  `if m>0 then b,k=a-${KNOB_SECTOR_DEG},${2 * KNOB_SECTOR_DEG} end ` +
  "Q(r,function(x,y)local p,q=x*2-r[3]+1,y*2-r[4]+1 " +
  "return(p~=0 or q~=0)and(math.deg(math.atan(q,p))-b)%360<=k and 255 or 0 end)end";

/** The branch texts, keyed as model.ts names them; both fader orientations are one text. */
export const BRANCH_TEXT: Readonly<Record<Branch, string>> = {
  "fader-v": FADER,
  "fader-h": FADER,
  button: BUTTON,
  xy: XY,
  knob: KNOB,
};

/** The sweep call for the Timer's tail. */
export const sweepCall = (calls: number): string => `X(self,${calls})`;

/**
 * Join statements with the one separator the minifier keeps: none after a
 * closing bracket or brace (`}` / `)` / `]` need no separator before a
 * name), one space otherwise (`end R=`). The packed strings are therefore
 * canonical on the first round - runtime.spec.ts asserts it.
 */
export function joinLua(parts: readonly string[]): string {
  return parts.reduce(
    (acc, part) =>
      acc === "" ? part : /[)}\]]$/.test(acc) ? acc + part : `${acc} ${part}`,
    "",
  );
}

export type RuntimePart = { readonly name: string; readonly lua: string };

/** A part's name, read off its own text (`I[1]=`, `function Q(`), never typed twice. */
function nameOf(lua: string): string {
  const fn = /^function ([A-Z]{1,2})\(/.exec(lua);
  return fn === null ? lua.slice(0, lua.indexOf("=")) : fn[1];
}

/**
 * The runtime's parts for the branches named, in their canonical order: the release, the entry,
 * the painter and the send (any branch needs them), the button's off with a button, then the
 * branches in kind order - the fader's one text once for either orientation.
 */
export function runtimeParts(branches: readonly Branch[]): RuntimePart[] {
  const ordered = BRANCHES.filter((b) => branches.includes(b));
  const texts = [
    RELEASE,
    ENTRY,
    ...(ordered.length > 0 ? [PAINT, SEND] : []),
    ...(ordered.includes("button") ? [BUTTON_OFF] : []),
    ...new Set(ordered.map((b) => BRANCH_TEXT[b])),
  ];
  return texts.map((lua) => ({ name: nameOf(lua), lua }));
}

/** The slots a part may land in, in the order the packer fills them. */
export type RuntimeSlot = "systemTimer" | "system" | "mapmode" | "timer";

export type PackedRuntime = {
  /** The touch Timer (0/6): the arm, a head if it carries parts, the parts, the sweep. */
  readonly timer: string;
  /** The system element's fourth event (255/4) under three or five slots; undefined under two. */
  readonly mapmode: string | undefined;
  /** 255/6 under five slots: the trimmed half and the parts it took; undefined otherwise. */
  readonly systemTimer: string | undefined;
  /** 255/0 under five slots: the trimmed half and the parts it took; undefined otherwise. */
  readonly system: string | undefined;
  /** Which slot each part landed in, in the parts' order. */
  readonly placement: readonly {
    readonly name: string;
    readonly slot: RuntimeSlot;
  }[];
  /** The parts in order, for a spec that measures them apart. */
  readonly parts: readonly RuntimePart[];
  /** True when every part found a slot inside the budget; false is a surface that does not fit (its Timer carries the rest, over). */
  readonly fits: boolean;
};

export type SlotCount = 2 | 3 | 5;

export type PackOptions = {
  readonly slots?: SlotCount;
  readonly sweepCalls?: number;
  /** The Setup's own marker is 13-14's; every slot opens with the same nine characters. */
  readonly budget?: number;
};

type Bin = {
  readonly slot: RuntimeSlot;
  readonly prefix: readonly string[];
  readonly tail: readonly string[];
  readonly taken: string[];
};

/**
 * Pack the runtime into its slot(s), largest part first, each into the first slot with room
 * (a slot's head paid once), the Timer taking whatever fits nowhere else. Under two slots every
 * part is in the Timer; under three the fill order is 255/4 then the Timer; under five 255/6 and
 * 255/0 (each the trimmed half, then the head, then the parts), 255/4, then the Timer. Within a
 * slot the parts stand in their canonical order. Nothing here measures under the minifier: the
 * parts are fixed points and `joinLua` keeps them so, which cost.ts re-checks.
 */
export function packRuntime(
  branches: readonly Branch[],
  options: PackOptions = {},
): PackedRuntime {
  const slots = options.slots ?? 2;
  const sweep = sweepCall(options.sweepCalls ?? DEFAULT_SWEEP_CALLS);
  const budget = options.budget ?? EVENT_BUDGET;
  const parts = runtimeParts(branches);

  const bins: Bin[] = [];
  if (slots === 5) {
    bins.push({
      slot: "systemTimer",
      prefix: [TRIMMED_LIBRARY_TIMER],
      tail: [],
      taken: [],
    });
    bins.push({
      slot: "system",
      prefix: [TRIMMED_LIBRARY],
      tail: [],
      taken: [],
    });
  }
  if (slots >= 3) {
    bins.push({ slot: "mapmode", prefix: [MARKER], tail: [], taken: [] });
  }
  const timer: Bin = {
    slot: "timer",
    prefix: [MARKER, ARM],
    tail: [sweep],
    taken: [],
  };

  const fitsIn = (bin: Bin, lua: string): boolean =>
    joinLua([...bin.prefix, STATE, ...bin.taken, lua, ...bin.tail]).length <=
    budget;

  let fits = true;
  const slotOf = new Map<string, RuntimeSlot>();
  const bySize = [...parts].sort((a, b) => b.lua.length - a.lua.length);
  for (const part of bySize) {
    const bin = bins.find((b) => fitsIn(b, part.lua));
    if (bin !== undefined) {
      bin.taken.push(part.lua);
      slotOf.set(part.lua, bin.slot);
    } else {
      if (!fitsIn(timer, part.lua)) fits = false;
      timer.taken.push(part.lua);
      slotOf.set(part.lua, "timer");
    }
  }
  // Within a slot, the parts in their canonical order.
  const inOrder = (taken: string[]): string[] =>
    parts.map((p) => p.lua).filter((lua) => taken.includes(lua));
  const render = (bin: Bin): string =>
    joinLua([
      ...bin.prefix,
      ...(bin.taken.length > 0 ? [STATE, ...inOrder(bin.taken)] : []),
      ...bin.tail,
    ]);
  const byName = (slot: RuntimeSlot): Bin | undefined =>
    bins.find((b) => b.slot === slot);
  const mapmode = byName("mapmode");
  const systemTimer = byName("systemTimer");
  const system = byName("system");
  return {
    timer: render(timer),
    // 255/4 always opens with the head under three or five slots, as 13-17 wrote it.
    mapmode:
      mapmode === undefined
        ? undefined
        : joinLua([MARKER, STATE, ...inOrder(mapmode.taken)]),
    systemTimer: systemTimer === undefined ? undefined : render(systemTimer),
    system: system === undefined ? undefined : render(system),
    placement: parts.map((p) => ({
      name: p.name,
      slot: slotOf.get(p.lua) as RuntimeSlot,
    })),
    parts,
    fits,
  };
}
