// The Sandbox's runtime: the Lua a contact drives - the guarded state head, the release
// convention `R`, the entry `O`, one branch per element kind (`I[1]`..`I[5]`) and `packRuntime`,
// which spreads the parts over the touch Timer (0/6) and, under three slots, the system element's
// fourth event (255/4). emit.ts's Setup pulls both slots in and installs `O` as the touch callback.
//
// Every string here was run in a real Lua VM before it was measured or pinned (runtime.spec.ts,
// seven tests, wasmoon). The runtime spends the names `S F I R` (and `O`) - the four the library
// and the emitter leave free - and calls the library's `E G N U X` and nothing else. Every table
// it creates is guarded (`S=S or{}`) because the Timer re-runs every 100 ms.
// History, costings and the branch-by-branch contract: docs/entries/sandbox-runtime.md.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { EVENT_BUDGET } from "../../vendor/botor/_pad";
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
export const RUNTIME_NAMES: readonly string[] = ["S", "F", "I", "R", "O"];

/** The library names the runtime calls, and only these. */
export const RUNTIME_CALLS: readonly string[] = ["E", "G", "N", "U", "X"];

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

/** `R`: the release convention the library calls and the entry defines - forget the contact's region and last value; a momentary button's 0 on the way out. `E` calls it on every release path. */
export const RELEASE =
  "R=function(s,i)local r=J[S[i]]S[i]=nil F[i]=nil " +
  "if r and r[5]==3 and r[7]<1 then s:gms(r[8],176,r[6],0,0)end end";

/**
 * `O`: the entry. An end code (`e~=1 and e~=4 and e<9`) hands the contact to `E` and returns; an
 * onset (`e==4 or e>8`) first expires the same id, then any other contact holding the region
 * landed on, then pins `S[i]` to `M[N(x,y)]`. Every live sample stamps `T[i]=C` for the sweep;
 * the finger is drawn by `G` on layer 2 in the region's colour; then the kind's branch `I[t]`; a 9
 * is ended in the same pass. A contact keeps its region for the whole gesture.
 */
export const ENTRY =
  `${RUNTIME_ENTRY}=function(s,i,e,x,y)` +
  "if e~=1 and e~=4 and e<9 then E(s,i)return end " +
  "local o=e==4 or e>8 " +
  "if o then E(s,i)local n=M[N(x,y)]" +
  "for j,g in pairs(S)do if g==n then E(s,j)end end S[i]=n end " +
  "T[i]=C local r=J[S[i]]if not r then return end " +
  "G(s,i,e,x,y,2,r[9],r[10],r[11])" +
  "I[r[5]](s,i,r,x,y,o)" +
  "if e>8 then E(s,i)end end";

const FADER_V =
  "I[1]=function(s,i,r,x,y)local v=glim((r[3]-U(y,KY))*127//r[4],0,127)" +
  "if v~=F[i]then F[i]=v s:gms(r[8],176,r[6],v,0)end end";

const FADER_H =
  "I[2]=function(s,i,r,x,y)local v=glim((U(x,KX)-r[1])*127//r[2],0,127)" +
  "if v~=F[i]then F[i]=v s:gms(r[8],176,r[6],v,0)end end";

const BUTTON =
  "I[3]=function(s,i,r,x,y,o)if o then local v=127 " +
  "if r[7]>0 then r[12]=not r[12]v=r[12]and 127 or 0 end " +
  "s:gms(r[8],176,r[6],v,0)end end";

const XY =
  "I[4]=function(s,i,r,x,y)local a,b=glim((U(x,KX)-r[1])*127//r[2],0,127)," +
  "glim((r[3]-U(y,KY))*127//r[4],0,127)local p=F[i]or{}" +
  "if a~=p[1]then s:gms(r[8],176,r[6],a,0)end " +
  "if b~=p[2]then s:gms(r[8],176,r[7],b,0)end F[i]={a,b}end";

// The rotary: the offset from the centre, the dead zone (`F[i]=nil`, so leaving on the far side
// is a fresh start), whole degrees, the wrap `(a-F[i]+180)%360-180`, `math.modf` for whole
// steps with a signed remainder in `r[13]`, the clamp; the value in `r[12]` is per region, the
// previous angle per contact. The dead zone and the step are rendered from model.ts's derivation.
const KNOB =
  "I[5]=function(s,i,r,x,y)local u,v=x-r[1],y-r[2]" +
  `if u*u+v*v<${KNOB_DEAD_ZONE_SQUARED} then F[i]=nil return end ` +
  "local a=math.deg(math.atan(v,u))//1 " +
  "if F[i]then local c=r[13]+(a-F[i]+180)%360-180 " +
  `local k,f=math.modf(c/${KNOB_STEP_DEG})r[13]=f*${KNOB_STEP_DEG} ` +
  "local w=glim(r[12]+k,0,127)" +
  "if w~=r[12]then r[12]=w s:gms(r[8],176,r[6],w,0)end end F[i]=a end";

/** The branch texts, keyed as model.ts names them. */
export const BRANCH_TEXT: Readonly<Record<Branch, string>> = {
  "fader-v": FADER_V,
  "fader-h": FADER_H,
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
 * canonical on the first round - runtime.spec.ts test 7 asserts it.
 */
export function joinLua(parts: readonly string[]): string {
  return parts.reduce(
    (acc, part) =>
      acc === "" ? part : /[)}\]]$/.test(acc) ? acc + part : `${acc} ${part}`,
    "",
  );
}

/** The runtime's parts for the branches named, in the order they are packed. */
export function runtimeParts(
  branches: readonly Branch[],
): { readonly name: string; readonly lua: string }[] {
  const ordered = BRANCHES.filter((b) => branches.includes(b));
  return [
    { name: "R", lua: RELEASE },
    { name: RUNTIME_ENTRY, lua: ENTRY },
    // A branch's name is read off its own text (`I[1]=`), never typed twice.
    ...ordered.map((b) => ({
      name: BRANCH_TEXT[b].slice(0, BRANCH_TEXT[b].indexOf("=")),
      lua: BRANCH_TEXT[b],
    })),
  ];
}

export type PackedRuntime = {
  /** The touch Timer (0/6): the arm, a head if it carries parts, the parts, the sweep. */
  readonly timer: string;
  /** The system element's fourth event (255/4) under three slots; undefined under two. */
  readonly mapmode: string | undefined;
  /** Which slot each part landed in. */
  readonly placement: readonly {
    readonly name: string;
    readonly slot: "timer" | "mapmode";
  }[];
  /** The parts in order, for a spec that measures them apart. */
  readonly parts: readonly { readonly name: string; readonly lua: string }[];
};

export type PackOptions = {
  readonly slots?: 2 | 3;
  readonly sweepCalls?: number;
  /** The Setup's own marker is 13-14's; the Timer and 255/4 open with the same nine characters. */
  readonly budget?: number;
};

/**
 * Pack the runtime into its slot(s). Under two slots every part
 * is in the Timer. Under three, 255/4 is filled from the front until the
 * next part would not fit beside the marker and the head, and the Timer
 * takes the rest. Nothing here measures under the minifier: the parts are
 * fixed points and `joinLua` keeps them so, which cost.ts re-checks.
 */
export function packRuntime(
  branches: readonly Branch[],
  options: PackOptions = {},
): PackedRuntime {
  const slots = options.slots ?? 2;
  const sweep = sweepCall(options.sweepCalls ?? DEFAULT_SWEEP_CALLS);
  const budget = options.budget ?? EVENT_BUDGET;
  const parts = runtimeParts(branches);
  const placement: { name: string; slot: "timer" | "mapmode" }[] = [];
  const inMapmode: string[] = [];
  const inTimer: string[] = [];
  if (slots === 3) {
    for (const part of parts) {
      const trial = joinLua([MARKER, STATE, ...inMapmode, part.lua]);
      if (inTimer.length === 0 && trial.length <= budget) {
        inMapmode.push(part.lua);
        placement.push({ name: part.name, slot: "mapmode" });
      } else {
        inTimer.push(part.lua);
        placement.push({ name: part.name, slot: "timer" });
      }
    }
  } else {
    for (const part of parts) {
      inTimer.push(part.lua);
      placement.push({ name: part.name, slot: "timer" });
    }
  }
  const timer = joinLua([
    MARKER,
    ARM,
    ...(inTimer.length > 0 ? [STATE, ...inTimer] : []),
    sweep,
  ]);
  const mapmode =
    slots === 3 ? joinLua([MARKER, STATE, ...inMapmode]) : undefined;
  return { timer, mapmode, placement, parts };
}
