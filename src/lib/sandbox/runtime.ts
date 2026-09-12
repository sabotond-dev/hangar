// The Sandbox's runtime: the Lua a contact drives, RUN in a real Lua VM, then
// MEASURED under the pinned minifier, then PINNED - in that order.
//
// ---------------------------------------------------------------------------
// 1. THE METHOD, AND THE LESSON IT SPENDS
// ---------------------------------------------------------------------------
//
// 12-07's planner measured a library sketch at 885 of 908, syntax-checked it
// and shipped it into a plan; the plan-check then found two defects a VM
// would have caught in a minute - a `Q` that could not expire the same
// contact id, and an `F` that nothing called. 13-02 costed THIS runtime from
// 13-RESEARCH 3.1's prose, which was itself never run, and labelled every
// figure an estimate. So every string in this file was driven through
// `createLuaHost` (runtime.spec.ts, seven tests, wasmoon) before a number was
// written down, and every disagreement between the contract and the VM is in
// 13-15-SUMMARY.md with its fix. The costs are the tree's, measured after
// `padReady()` as `max(compressed, raw)` on a canonical text; the research's
// 861 and D-08's 150-200 are printed beside them and not carried.
//
// ---------------------------------------------------------------------------
// 2. WHERE IT LIVES, AND HOW IT IS PULLED IN
// ---------------------------------------------------------------------------
//
// The touch Timer (0/6), proved callable from the touch Setup by probe 1
// (`self:tim()`, PROBE-RESULTS-2026-09-10.md, cell 80, commit 493a21a), and
// under three slots the system element's fourth event (255/4), proved by
// probe 2 (`ele[#ele]:map()`). The Setup 13-14 emits calls both and then
// installs `O` as the touch callback, so `O` exists when it is named.
//
// THE TIMER RUNS EVERY 100 ms AND 255/4 RUNS ONCE PER SETUP, and the text
// is written for both at once. `gtt(0,100)` opens the Timer: the Setup's
// `self:tim()` runs the body once, which ARMS the one-shot (the firmware's
// timer is a one-shot the body re-arms - lua-host.ts `gtt`), and every
// re-run re-arms it. Without that call the Timer never fires on the module,
// the sweep `X(self,20)` never runs, and the lost lift the probe measured
// four times in five hangs its note forever; 13-14's Timer had no `gtt` and
// this plan added it as a Rule 2 deviation. The window is twenty calls at
// 100 ms - CHORUS's own figure - and it is the CALLER's (library.ts section
// 8). Because the Timer re-runs, every table it creates is guarded:
// `S=S or{}` keeps the contacts' regions across ticks where `S={}` would
// drop every finger on the pad ten times a second. The same head opens
// 255/4, so the text is one text wherever the packer puts it (section 6).
//
// ---------------------------------------------------------------------------
// 3. THE CONTRACT, BRANCH BY BRANCH
// ---------------------------------------------------------------------------
//
// The row `r = J[S[i]]` is 13-14's, eleven columns: four geometry numbers in
// the KIND's own frame (emit.ts section 2), the type code `t`, the
// controller, the second controller or the latch flag, the wire channel,
// and the colour; a knob row carries two more, its value and its
// accumulator remainder, both seeded 0.
//
// | Part  | What it does                                                  | Answers |
// | ----- | ------------------------------------------------------------- | ------- |
// | R     | the release convention (library.ts section 5): forget the     | Q6.5    |
// |       | contact's region and its last value; a MOMENTARY button's 0   |         |
// |       | on the way out. Idempotent: a contact holding nothing sends   |         |
// |       | nothing, because `E` calls `R` on every onset.                |         |
// | O     | the entry. An end code (`e~=1 and e~=4 and e<9`, the blessed  | Q3, Q6.5|
// |       | spelling) hands the contact to `E` and returns; an onset      |         |
// |       | (`e==4 or e>8`) FIRST expires the same id (12-07's rule -     |         |
// |       | firmware assigns the lowest free id, so after a lost lift the |         |
// |       | next press is normally the same id), then expires any other   |         |
// |       | contact holding the region just landed on, then pins `S[i]`   |         |
// |       | to `M[N(x,y)]` - the nearest calibrated cell, no hysteresis.  |         |
// |       | Every live sample stamps `T[i]=C` for the sweep. A contact    |         |
// |       | with no region returns. The finger is drawn by `G` on layer 2 |         |
// |       | in the region's colour, above the region's own paint on layer |         |
// |       | 1 (finding 5). Then the kind's branch `I[t]`; then a 9 is     |         |
// |       | ended in the same pass, so nothing is built on 9 staying live.|         |
// | I[1]  | vertical fader: `(gy-U(y,KY))*127//gh`, clamped, sent on      | Q1, Q5  |
// |       | change; `gy` is the BOTTOM LED's calibrated position and `gh` |         |
// |       | the LED span, so the top and bottom LEDs give 127 and 0       |         |
// |       | exactly and the half-cell beyond each end clamps.             |         |
// | I[2]  | horizontal fader: the same on `U(x,KX)` from the left LED.    |         |
// | I[3]  | button: on an onset, 127 - or, latching, a toggle held in     | Q6.5    |
// |       | `r[12]`; the 0 of a momentary button is `R`'s, so it fires on |         |
// |       | all four release paths (section 4).                           |         |
// | I[4]  | XY pad: both axes as the faders read them, ONE CC PER MOVED   | rule 3  |
// |       | AXIS against the last pair sent - Phase 12's `A` with the     |         |
// |       | region's bounds instead of the pad's.                         |         |
// | I[5]  | the rotary (D-08), section 5.                                 | -       |
//
// `Q` AND `W` ARE NOT ON THIS HOT PATH, and the reason is the row above: a
// contact KEEPS the region it landed in (`S[i]`) for the whole gesture,
// until a lift or an expiry. That is better than hysteresis and cheaper - a
// finger dragged off the end of a fader must not start driving the XY pad
// beside it - so the library's cell hysteresis (`W`) and its cell-change
// contract (`Q`) have nothing to decide here. They stay for the hand-authored
// entries. What the runtime takes from the library is `E`, `N`, `G`, `U`, the
// knots and the Timer's `X`, and it DEFINES `R`, the one name the library
// calls but leaves to the entry.
//
// ---------------------------------------------------------------------------
// 4. THE FOUR RELEASE PATHS, AND WHY A BUTTON'S 0 IS `R`'s
// ---------------------------------------------------------------------------
//
// Probe A Q6.5: four of five lifts were lost after a chord. A button that
// sent its 0 on code 5 would hang four notes in five. So the 0 is sent by
// `R`, which `E` calls on every path there is: (1) an end code; (2) a same-id
// re-press without a lift, which `O`'s onset expiry takes FIRST; (3) a press
// by another contact on the region the ghost still holds, which the onset
// scan over `S` takes; (4) the Timer's `X(self,20)` sweep, two seconds after
// the contact's last sample. runtime.spec.ts test 2 drives all four in a VM
// and asserts the 0 on the button's controller on each - the note-off, not
// merely that a release ran - with the same-id case driven first.
//
// ---------------------------------------------------------------------------
// 5. THE ROTARY, AND THE WRAP ARITHMETIC WRITTEN OUT
// ---------------------------------------------------------------------------
//
// `math` is open in the firmware's VM (`../grid-fw/common/src/c/grid_lua.c:
// 523`, `LUA_MATHLIBNAME`; `coroutine` and `utf8` are not), so `math.atan`
// with two arguments and `math.deg` and `math.modf` are available. The
// knob's row carries its CENTRE in raw units (`r[1]`, `r[2]`: the region's
// middle LED position through the forward map, emit.ts) - raw, because Q1's
// jitter is one raw unit wherever the finger is and the dead zone below is
// therefore a constant in raw units, whereas in calibrated units it would
// grow with the map's local pitch.
//
//   u,v = x-r[1], y-r[2]                     the offset from the centre
//   if u*u+v*v < 103 then F[i]=nil return    the dead zone (model.ts 4b):
//                                            nothing changes, and the previous
//                                            angle is forgotten so leaving on
//                                            the far side is a fresh start
//   a = math.deg(math.atan(v,u))//1          WHOLE degrees in [-180, 180]:
//                                            screen y grows downward, so a
//                                            clockwise turn INCREASES the
//                                            angle. Floored to an integer
//                                            because the VM said so: summed
//                                            as floats, a full turn of 4-degree
//                                            samples came to 359.99999 and 44
//                                            steps, not 45 (13-15-SUMMARY.md,
//                                            disagreement 1); whole degrees
//                                            make every delta and every
//                                            remainder exact
//   if F[i] then                             a previous angle exists:
//     c = r[13] + (a-F[i]+180)%360-180       THE WRAP. The raw difference
//                                            a-F[i] is in (-360, 360); adding
//                                            180, taking it modulo 360 and
//                                            subtracting 180 brings it into
//                                            [-180, 180), so 179 -> -179 is
//                                            +2 and not -358, and -179 -> 179
//                                            is -2 and not +358. Lua's `%` is
//                                            floored, which is what makes the
//                                            negative side land in the same
//                                            half-open interval.
//     k, f = math.modf(c/8)                  whole steps, TRUNCATED TOWARD
//                                            ZERO, and the fraction; the
//                                            remainder r[13] = f*8 keeps its
//                                            sign. That is the hysteresis: a
//                                            wobble of +1 then -1 degree around
//                                            a fresh remainder of 0 never
//                                            reaches +-8 and never steps, where
//                                            a floor would step down at -1 and
//                                            up again at +8.
//     w = glim(r[12]+k, 0, 127)              the clamp, both ends; sent only
//                                            when it moved, so a finger held
//                                            at either end is silent.
//   F[i] = a                                 the per-contact previous angle.
//
// KNOB_STEP_DEG = 8 degrees a step, 45 steps a turn, 2.84 turns from 0 to
// 127; the dead zone's radius 10.13 raw units, the literal 103 = ceil(rho0^2)
// - both DERIVED in model.ts section 4b from Probe A Q1 and rendered here,
// never typed. The knob's value is `r[12]`, per REGION, so it keeps its
// position between gestures; the previous angle is per CONTACT, so a second
// finger does not inherit the first's. The value starts at 0.
//
// ---------------------------------------------------------------------------
// 6. THE SLOTS, THE CEILING, AND THE PACKER
// ---------------------------------------------------------------------------
//
// Dead-branch elimination applies here as 13-RESEARCH 3.1 said it would:
// HANGAR emits the runtime PER SURFACE, so only the branches the surface's
// kinds need are written (`branchesUsed`, model.ts). The branches are
// functions in a table `I` rather than inline `if t==1 then` blocks - about
// eleven characters a branch dearer - because a function is a PART, and the
// runtime spans two slots under 13-02's `three-slots` answer: `packRuntime`
// fills 255/4 from the front (the head, `R`, `O`, then the branches in kind
// order) until 908 is reached and the touch Timer takes the rest between
// `gtt(0,100)` and the sweep. Under two slots (the default until 13-17
// writes 255/4 - emit.ts section 4) everything is in the Timer, and a
// surface whose runtime does not fit is a surface the meter refuses; the
// measured table is runtime.spec.ts test 7's and 13-15-SUMMARY.md's. In one
// sentence: on two slots a Knob shares a surface with one fader orientation
// or with buttons and with nothing else, the other kinds mix two at a time;
// on three slots every kind fits together with room to spare.
//
// ---------------------------------------------------------------------------
// 7. THE NAMES
// ---------------------------------------------------------------------------
//
// The library owns `A B C D E G H K KX KY L N P Q T U V W X Y Z` and the
// emitter's data half owns `J M O`. What is left of the alphabet is `F I R
// S`, and the runtime spends exactly those: `S` the region by contact, `F`
// the last value (or pair, or angle) by contact, `I` the branch table, `R`
// the release convention. The inline contingency in emit.ts spends `S F R`
// for the same three jobs and is never emitted beside this file's text.
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
export const TIMER_PERIOD_MS = 100;

/** `X(self, n)` expires contacts unseen for n Timer calls (library.ts section 8): CHORUS's twenty. */
export const DEFAULT_SWEEP_CALLS = 20;

/** The names this file defines. emit.spec.ts / runtime.spec.ts hold them apart from the library's. */
export const RUNTIME_NAMES: readonly string[] = ["S", "F", "I", "R", "O"];

/** The library names the runtime calls, and only these. */
export const RUNTIME_CALLS: readonly string[] = ["E", "G", "N", "U", "X"];

// ---------------------------------------------------------------------------
// The text. Each part is one statement; `joinLua` supplies the one separator
// the minifier keeps, so the packed strings are fixed points of it.

/** Opens the Timer: the one-shot the body re-arms (section 2). */
export const ARM = `gtt(0,${TIMER_PERIOD_MS})`;

/** The guarded state head, at the top of every slot that carries a part (section 2). */
export const STATE = "S=S or{}F=F or{}I=I or{}";

/** `R`: the release convention, a momentary button's 0 on every path (section 4). */
export const RELEASE =
  "R=function(s,i)local r=J[S[i]]S[i]=nil F[i]=nil " +
  "if r and r[5]==3 and r[7]<1 then s:gms(r[8],176,r[6],0,0)end end";

/** `O`: the entry (section 3). */
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

// The dead zone and the step are rendered from model.ts's derivation.
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
 * Pack the runtime into its slot(s) (section 6). Under two slots every part
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
