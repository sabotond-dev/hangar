// The Sandbox's runtime: the Lua a contact drives - the guarded state head, the release
// convention `R`, the entry `O`, three helpers (`Q` the region painter, `D` the scaled send on
// change by the output's type, `K` a button's off), one branch per kind (`I[1]`..`I[5]`), the
// receive callback `Y` and the colour input `Z` (change 17), the MULTITOUCH variant of `R`, `O`
// and `I[4]` (change 11), and `packRuntime`, which spreads the parts over the slots a surface lands
// on, largest first. Every string was run in a real Lua VM before it was measured (runtime.spec.ts).
// Names `S F I R O` and the trim's `Q D K Y Z`; calls the library's `E N U X`. docs/MIDI.md, docs/entries/sandbox-runtime.md.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { EVENT_BUDGET } from "../../vendor/botor/_pad";
import { TRIMMED_LIBRARY, TRIMMED_LIBRARY_TIMER } from "./library-trim";
import {
  BRANCHES,
  KNOB_DEAD_ZONE_SQUARED,
  KNOB_STEP_DEG,
  TOUCHES_MAX,
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

/**
 * The names this file's parts define. emit.spec.ts / runtime.spec.ts hold them apart from the
 * library's; `E`, `A`, `Y` and `Z` are change 17's, four more the trim freed. The contact tables `S`
 * and `F` are made by the trimmed 255/0's head under five slots and the Setup under fewer
 * (`SETUP_STATE`) since change 17, so they are not a part's.
 */
export const RUNTIME_NAMES: readonly string[] = [
  "I",
  "R",
  "O",
  "Q",
  "D",
  "K",
  "E",
  "A",
  "Y",
  "Z",
];

/** The receive callback's name: the Setup assigns `self.midirx_cb` to it (change 17). */
export const RECEIVE_ENTRY = "Y";

/** The library names the runtime calls, and only these (the pictures are the runtime's own, so not `G`; the expiry `E` is its own since change 17). */
export const RUNTIME_CALLS: readonly string[] = ["N", "U", "X"];

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

/**
 * The multitouch XY pad's state (change 11) is PER SLOT: finger n's six columns start at
 * `z = 17 + 3k`, k its controller offset `2(n-1)` - the one number `F[i]` keeps for a contact,
 * set at the onset and freed by `R` - so slot 1 is columns 17..22, the single-touch layout plus
 * the anchor: z+1 the held x, z+2 the held y, z+3 and z+4 the last sent pair, z+5 the crosshair
 * cell (nil while the slot is free: the entry's "lowest free slot" reads it), z+6 the relative
 * anchor. The count itself rides in the SEVENTH column, `cc2 + 128(n-1)` (model.ts `seventhOf`).
 */
export const SLOT_COLUMNS = { base: 17, perOffset: 3, cell: 5 } as const;
export const slotColumn = (finger: number, field: number): number =>
  SLOT_COLUMNS.base + SLOT_COLUMNS.perOffset * (2 * (finger - 1)) + field;

/** The most fingers a pad's slots carry - the schema's ceiling; the painter reads every slot's cell up to it. */
export const SLOT_MAX = TOUCHES_MAX;

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

/**
 * The guarded head at the top of every slot that carries a part: the branch table the parts
 * define into (the Timer re-runs, so `I={}` would be wasted work, never harm). The contact tables
 * `S` and `F` are made once per landing instead (`SETUP_STATE`): under five slots by the trimmed
 * 255/0's own head (library-trim.ts), which runs before the touch Setup; under two or three by the
 * Setup - change 17 moved them out of this head (16 characters a slot) and kept them out of the
 * Setup the cap is measured on.
 */
export const STATE = "I=I or{}";

/** The contact tables (change 17): made fresh on every landing, before any part can run. */
export const SETUP_STATE = "S={}F={}";

/**
 * The receive assignment (change 17): the touch element's `midirx_cb`, the callback when anything
 * receives, `nil` otherwise - so a previous landing's never outlives this one. It stands at the end
 * of the touch TIMER, not the Setup: the Timer is the same element's own event (`self` is the touch
 * element there too), it runs inside the Setup's own `self:tim()` and every 100 ms after, and the
 * Setup is where the cap is measured - sixteen elements at their dearest defaults leave it 16
 * characters (emit.spec.ts test 1). A callback parked in 255/4 is assigned on the Timer's next run.
 */
export const RECEIVE_ON = `self.midirx_cb=${RECEIVE_ENTRY}`;
export const RECEIVE_NONE = "self.midirx_cb=nil";

/**
 * The row's omitted tail columns read as their defaults - min 0, max 127, flags 0 (`q%2*127`: 0,
 * 127, 0 for columns 12, 13, 14). Since change 17 once per landing and on every Timer run, for
 * every row, at the head of the touch TIMER (`TAIL_DEFAULTS_LOOP`): its first run is inside the Setup's
 * own `self:tim()`, before the touch callback is installed or the receive callback assigned, so
 * every reader - the entry, the branches, `Y` - finds a whole row. It was the entry's per sample
 * until then (and change 11's variant's Setup paint); the Setup is where the cap is measured.
 */
export const TAIL_DEFAULTS_LUA = "for q=12,14 do r[q]=r[q]or q%2*127 end";

/** The Timer's defaults statement: every row of `J` (a blank's too, harmlessly). */
export const TAIL_DEFAULTS_LOOP = `for _,r in pairs(J)do ${TAIL_DEFAULTS_LUA} end`;

/**
 * `R`: the release convention the library calls and the entry defines. Forget the contact's
 * region and its anchor; then the kind's release: a spring fader returns to its spring position
 * (held, sent, drawn - through its own branch with no finger); any other fader keeps its bar
 * where the finger left it, as a fader holds its position (the bench of 2026-09-18 read a bar
 * going out on the lift as the fader falling to 0 - change 10C); a momentary button that is on
 * goes off through `K` (a toggle stays); an XY pad and a knob clear. Since change 17 `R` also
 * forgets the contact's stamp and IS the expiry: `E=R` - the library's `E` did that and called
 * `R`, and forgot `H[i]` and a `G` block besides, which a surface never makes (library-trim.ts
 * no longer lands it). `O` and the library's sweep `X` call `E` on every release path.
 */
export const RELEASE =
  "R=function(s,i)local r=J[S[i]]S[i],F[i],T[i]=nil if not r then return end " +
  "local t,f=r[5],r[14]" +
  "if t<3 then if f//4>0 then r[17]=r[15]*127 I[1](s,i,r)end " +
  "elseif t==3 then if f%2<1 and r[17]then K(s,r)end else r[21]=nil Q(r)end end E=R";

/**
 * `R` under multitouch (change 11): the same releases, except an XY pad's runs its branch with
 * no finger (`I[4](s,i,r)`, `F[i]` still naming the slot - freed last) - the slot's cell goes
 * and the union of the other fingers' crosses is redrawn - and only a knob is cleared whole.
 */
export const RELEASE_MULTITOUCH =
  "R=function(s,i)local r=J[S[i]]S[i],T[i]=nil if r then local t,f=r[5],r[14]" +
  "if t<3 then if f//4>0 then r[17]=r[15]*127 I[1](s,i,r)end " +
  "elseif t==3 then if f%2<1 and r[17]then K(s,r)end " +
  "elseif t==4 then I[4](s,i,r)else Q(r)end end F[i]=nil end E=R";

/**
 * `O`: the entry. An end code (`e~=1 and e~=4 and e<9`) hands the contact to `E` and returns; an
 * onset (`e==4 or e>8`) first expires the same id, then any other contact holding the region
 * landed on, then pins `S[i]` to `M[N(x,y)]`. Every live sample stamps `T[i]=C` for the sweep;
 * a contact with no region (or a blank's, negated) returns; then the kind's branch `I[t]`; a 9
 * is ended in the same pass. A contact keeps its region for the whole gesture. The omitted tail
 * columns are the Timer's to default since change 17 (`TAIL_DEFAULTS_LOOP`).
 */
export const ENTRY =
  `${RUNTIME_ENTRY}=function(s,i,e,x,y)` +
  "if e~=1 and e~=4 and e<9 then E(s,i)return end " +
  "local o=e==4 or e>8 " +
  "if o then E(s,i)local n=M[N(x,y)]" +
  "for j,g in pairs(S)do if g==n then E(s,j)end end S[i]=n end " +
  "T[i]=C local r=J[S[i]]if not r then return end " +
  "I[r[5]](s,i,r,x,y,o)" +
  "if e>8 then E(s,i)end end";

/**
 * `O` under multitouch (change 11): an onset on a pad with more than one finger (the seventh
 * column past 127) expires nobody - it takes the lowest slot whose cell column is nil, `F[i]=k`
 * (k the controller offset 0, 2, 4...), and returns unpinned when every slot is held (`k >
 * r[7]//64`: the finger is ignored - no picture, no message, its later samples find no region).
 * Every other region keeps the single-touch rule above. The slot is the contact's for the gesture.
 * The tail defaults are the Timer's (`TAIL_DEFAULTS_LOOP`; change 11 had them in the variant's Setup
 * paint to keep this text inside 255/0's room).
 */
export const ENTRY_MULTITOUCH =
  `${RUNTIME_ENTRY}=function(s,i,e,x,y)` +
  "if e~=1 and e~=4 and e<9 then E(s,i)return end " +
  "local o=e==4 or e>8 " +
  "if o then E(s,i)local n=M[N(x,y)]local r=J[n]" +
  "if r and r[7]>127 then local k=0 " +
  `while r[${SLOT_COLUMNS.base + SLOT_COLUMNS.cell}+${SLOT_COLUMNS.perOffset}*k]do k=k+2 end ` +
  "if k>r[7]//64 then return end F[i]=k " +
  "else for j,g in pairs(S)do if g==n then E(s,j)end end end S[i]=n end " +
  "T[i]=C local r=J[S[i]]if not r then return end " +
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
 * `D(s,r,n,c,v,h)`: the scale and the send. A position `v` 0..127 along the region's travel ->
 * `min + (max - min) * v // 127` (model.ts `scaleValue` is the twin), kept in column `n` and sent
 * when it differs from the last value sent, on the CHANNEL WORD `h` (the row's eighth column
 * unless handed - an XY pad's Y axis hands its fifteenth; model.ts `channelWord`): the channel
 * `h%16`, the status `176 + 16 * (h//16%4)` - a controller `c, v`, a channel pressure `v, 0`, a
 * pitch bend `c, v` with the emitter's `c` 0 (the least significant byte; the value is the most
 * significant, so 64 is the centre 8192 exactly). Called with no element (`s` nil, the receive
 * callback's redraw, change 17) it keeps the value as the last one sent and sends nothing: a
 * received value is never echoed.
 */
export const SEND =
  "function D(s,r,n,c,v,h)v=r[12]+(r[13]-r[12])*v//127 " +
  "if v~=r[n]then r[n]=v h=h or r[8]local t=h//16%4 " +
  "if s then s:gms(h%16,176+t*16,t==2 and v or c,t==2 and 0 or v)end end end";

/** `K(s,r)`: a button off - a note-off (status 128, velocity 0) when its channel word says Note (code -2: the word modulo 128 is 96 and up), else the min on its controller; the on-flag and the light go. */
export const BUTTON_OFF =
  "function K(s,r)if r[8]%128>95 then s:gms(r[8]%16,128,r[6],0)" +
  "else s:gms(r[8]%16,176,r[6],r[12])end r[17]=nil Q(r)end";

// The position on the calibrated axis between the region's first and last LED centres: a
// vertical fader reads 127 at its top LED and 0 at its bottom, a horizontal one 0 at the left.
const POS_V = "glim(((r[2]+r[4]-1)*64-U(y,KY))*127//((r[4]-1)*64),0,127)";
const POS_H = "glim((U(x,KX)-r[1]*64)*127//((r[3]-1)*64),0,127)";

/**
 * `A(r,x,y)`: both positions of a finger in a region, x then y (change 17: the two formulas the
 * fader and both XY pad texts carried inline, one text - 54 characters less on a surface with a
 * fader and a pad, and three smaller parts for the packer).
 */
export const POSITION = `function A(r,x,y)return ${POS_H},${POS_V}end`;

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
  "if x then local a,b=A(r,x,y)p=r[5]<2 and b or a " +
  "if f%2>0 then if o then F[i]=p return end " +
  `r[17]=glim((r[17]or(r[15]or 0)*127)+(p-F[i])*(f//2%2>0 and 127 or 64),0,${FINE_MAX})` +
  "F[i]=p p=r[17]//127 else r[17]=p*127 end end " +
  "D(s,r,19,r[6],p)local v=r[5]<2 local k=p*((v and r[4]or r[3])-1)//127 " +
  "Q(r,function(x,y)return(v and r[4]-1-y or x)<=k and 255 or 0 end)end I[2]=I[1]";

/**
 * The button, on an onset only: an on toggle (bit 0) goes off through `K`; a radio group (`r[7]`
 * 1..8) turns every other on member off through `K` first; then on - the max as the value (or
 * the velocity, status 144, under a note output: the channel word's code -2, 176 less 32) - and
 * the whole region lit.
 */
const BUTTON =
  "I[3]=function(s,i,r,x,y,o)if not o then return end local f=r[14]" +
  "if f%2>0 and r[17]then K(s,r)return end " +
  "if r[7]>0 then for _,g in pairs(J)do " +
  "if g~=r and g[5]==3 and g[7]==r[7]and g[17]then K(s,g)end end end " +
  "r[17]=true s:gms(r[8]%16,176-r[8]%128//96*32,r[6],r[13])" +
  "Q(r,function()return 255 end)end";

/**
 * The XY pad: both positions as the fader reads them; the crosshair through the finger's cell
 * `N(x,y)` (redrawn when the cell moves, `r[21]`); relative as the fader, per axis, the pair
 * held in `r[17]`, `r[18]`; one scaled send per axis on change, the Y axis on its own channel
 * word (`r[15]`, absent when it is the X axis's). With no finger (the receive callback, change 17)
 * the pair is the held one and the crosshair goes through its nearest cell: the received pair.
 */
const XY =
  "I[4]=function(s,i,r,x,y,o)local f,a,b,c=r[14]" +
  "if x then a,b=A(r,x,y)c=N(x,y)else " +
  "a,b=(r[17]or 0)//127,(r[18]or 0)//127 " +
  "c=r[1]+(a*(r[3]-1)+63)//127+(r[2]+r[4]-1-(b*(r[4]-1)+63)//127)*9 end " +
  "if c~=r[21]then r[21]=c " +
  "Q(r,function(x,y)return(r[1]+x==c%9 or r[2]+y==c//9)and 255 or 0 end)end " +
  "if f%2>0 and x then if o then F[i]={a,b}return end local k=f//2%2>0 and 127 or 64 " +
  `r[17]=glim((r[17]or 0)+(a-F[i][1])*k,0,${FINE_MAX})r[18]=glim((r[18]or 0)+(b-F[i][2])*k,0,${FINE_MAX})` +
  "F[i]={a,b}a,b=r[17]//127,r[18]//127 end " +
  "D(s,r,19,r[6],a)D(s,r,20,r[7],b,r[15])end";

/**
 * The XY pad under multitouch (change 11): the finger's state in the six columns from
 * `z=17+3k`, k its controller offset (`F[i]`; 0 when the entry set none - a one-finger pad on
 * the same surface); the crosshair is the UNION of every held slot's row and column (the cell
 * columns 22, 28 .. 46, nil where free), redrawn when this finger's cell moves; called with no
 * finger (from `R`) it drops its slot's cell, redraws and does nothing else. Relative as the single-touch
 * pad, per finger, the anchor in the sixth column. The finger sends on the pad's pair plus k
 * (answer 1a); the second controller is the seventh column's low seven bits.
 */
const XY_MULTITOUCH =
  `I[4]=function(s,i,r,x,y,o)local f,k=r[14],F[i]or 0 local z,c=${SLOT_COLUMNS.base}+${SLOT_COLUMNS.perOffset}*k,x and N(x,y)` +
  "if c~=r[z+5]then r[z+5]=c Q(r,function(x,y)" +
  `for j=${slotColumn(1, SLOT_COLUMNS.cell)},${slotColumn(SLOT_MAX, SLOT_COLUMNS.cell)},${2 * SLOT_COLUMNS.perOffset} do ` +
  "if r[j]and(r[1]+x==r[j]%9 or r[2]+y==r[j]//9)then return 255 end end return 0 end)end " +
  "if x then local a,b=A(r,x,y)" +
  "if f%2>0 then if o then r[z+6]={a,b}return end local p,g,v={a,b},r[z+6],f//2%2>0 and 127 or 64 " +
  `for j=1,2 do r[z+j]=glim((r[z+j]or 0)+(p[j]-g[j])*v,0,${FINE_MAX})end ` +
  "r[z+6]=p a,b=r[z+1]//127,r[z+2]//127 end " +
  "D(s,r,z+3,r[6]+k,a)D(s,r,z+4,r[7]%128+k,b,r[15])end end";

// The rotary: the centre in raw units from the row (`r[15]`, `r[16]`, emit.ts `knobCentre`),
// the dead zone (`F[i]=nil`, so leaving on the far side is a fresh start), whole degrees, the
// wrap `(a-F[i]+180)%360-180`, `math.modf` for whole steps with a signed remainder in `r[18]`;
// the position `r[17]` is per region, the previous angle per contact. Under a relative mode
// (`r[14]` 1..3) the detents crossed in the sample (at most 22: the wrap bounds a sample at 180
// degrees, inside every encoding's 63) go out in the mode's encoding
// and no position is kept. The picture: the cells whose angle from `b` lies within `k` - the arc
// from 7:30 to the position under absolute, a sector round the finger under relative; the centre
// cell stays dark. With no finger (the receive callback, change 17: an absolute knob) the arc alone.
const KNOB =
  "I[5]=function(s,i,r,x,y)local m,a=r[14]if x then local u,v=x-r[15],y-r[16]" +
  `if u*u+v*v<${KNOB_DEAD_ZONE_SQUARED} then F[i]=nil return end ` +
  "a=math.deg(math.atan(v,u))//1 " +
  "if F[i]then local c=(r[18]or 0)+(a-F[i]+180)%360-180 " +
  `local k,e=math.modf(c/${KNOB_STEP_DEG})r[18]=e*${KNOB_STEP_DEG} ` +
  "if k~=0 then if m>0 then " +
  "s:gms(r[8]%16,176,r[6],m==1 and k%128 or m==2 and 64+k or k>0 and k or 64-k)" +
  "else r[17]=glim((r[17]or 0)+k,0,127)D(s,r,19,r[6],r[17])end end end F[i]=a end " +
  `local b,k=${KNOB_ARC_START_DEG},(r[17]or 0)*${KNOB_ARC_DEG}//127 ` +
  `if m>0 then b,k=a-${KNOB_SECTOR_DEG},${2 * KNOB_SECTOR_DEG} end ` +
  "Q(r,function(x,y)local p,q=x*2-r[3]+1,y*2-r[4]+1 " +
  "return(p~=0 or q~=0)and(math.deg(math.atan(q,p))-b)%360<=k and 255 or 0 end)end";

/**
 * `Y(s,h,v)`: MIDI RX (change 17, answers 1i and 1ii), the touch element's `self.midirx_cb` -
 * assigned in the Setup, because `gmrr` does not reach a touch element (BOTOR's route, `_pad.ts`
 * `motorRx`). The firmware hands every element each decoded voice message as `h = {instr, sx, sy}`
 * and `v = {channel, status, p1, p2}` (grid-fw decode.lua `pass_midi`); voice RX reaches Lua by
 * default (init.lua: `grxm(MIDIVOICE, FORWARD | HANDLE_EXTERNAL)`), external sources only, so the
 * module's own sends never come back. It acts on host traffic alone (`h[1]==13`, REPORT) and only
 * while this surface's entry is still the element's touch callback (a later landing that never
 * assigned `midirx_cb` leaves this one inert rather than painting over it). A note-off folds into
 * a note-on at 0 (simplemidi.lua's rule), and the message becomes a WORD as the rows spell theirs
 * (the channel plus the status less 176: a note -32..-17, a controller 0..15, a program change
 * 16..31 - no output's - a channel pressure 32..47, a pitch bend 48..63). Then every row that
 * receives (the channel word under 64) and each of its outputs - an XY pad's two, the Y axis on
 * `r[15]` or the X axis's word - matches the word whole and, for a controller or a note (a word
 * under 32), the number. The value is a channel pressure's first byte, anything else's second; mapped back
 * through min..max to a POSITION, it becomes the element's held value - a fader's held fine
 * position, an XY pad's held axis (`r[16+j]`), a knob's position - kept as the last value sent
 * (`D` with no element, so nothing is echoed), and the kind's own branch runs with no finger to
 * redraw it: the bar, the crosshair at the held pair, the arc. A button's on-flag and light follow
 * the value (on when it is above 0 and not the button's min, its off value). The colour input's call, when the surface
 * has one (`receivePart`), comes before the rows.
 */
const RECEIVE_HEAD =
  `function ${RECEIVE_ENTRY}(s,h,v)if h[1]~=13 or s.touch_cb~=${RUNTIME_ENTRY} then return end ` +
  "local t,n,w=v[2],v[3],v[4]if t==128 then t,w=144,0 end " +
  "local q=v[1]+t-176 ";

const RECEIVE_ROWS =
  "for _,r in pairs(J)do local k=r[5]if k and r[8]<64 then " +
  "for j,o in pairs(k==4 and{r[8],r[15]or r[8]}or{r[8]})do " +
  "if o==q and(o>31 or n==r[5+j])then " +
  "local u,d=o//16==2 and n or w,r[13]-r[12]" +
  "local p=d~=0 and glim((u-r[12])*127//d,0,127)or 0 " +
  "if k==3 then r[17]=u~=r[12]and u>0 or nil Q(r,r[17]and function()return 255 end)" +
  "else r[16+j]=k>4 and p or p*127 D(nil,r,18+j,0,p)I[k](nil,0,r)end end end end end end";

/**
 * The surface's Colour input as the receive callback sees it (change 17, answer 1iii): the WIRE
 * channel, the first controller, and the surface's brightness (a received colour is dimmed the way
 * the paint's are).
 */
export type ColourInputWire = {
  readonly channel: number;
  readonly first: number;
  readonly brightness: number;
};

/** The colour input's call inside `Y`: a controller on its channel recolours element `n - first + 1` (`Z` ignores one past the surface). */
function colourCall(colour: ColourInputWire): string {
  const offset = colour.first - 1;
  const index =
    offset === 0 ? "n" : offset < 0 ? `n+${-offset}` : `n-${offset}`;
  return `if t==176 and v[1]==${colour.channel} then Z(${index},w)end `;
}

/** `Y`'s text: the head, the colour input's call when there is one, the rows when any region receives. */
export function receivePart(receive: ReceiveOptions): string {
  return (
    RECEIVE_HEAD +
    (receive.colour === undefined ? "" : colourCall(receive.colour)) +
    (receive.rows ? RECEIVE_ROWS : "end")
  );
}

/**
 * `Z(e,w)`: the colour input (change 17, answer 1iii) - element `e`'s cells (a blank's too: its
 * cells in `M` are its index negated) recoloured on layers 1 and 2 by the value: 0 its own colour
 * back, 1..126 a HUE WHEEL (red at 1 through yellow, green, cyan, blue and magenta, six sectors of
 * 256 in `(w-1)*1536//126`), 127 white. Measured against a palette index (docs/MIDI.md): a
 * 128-entry table is ten times this text. Dimmed by the surface's brightness below 255.
 */
export function colourPart(brightness: number): string {
  const dim =
    brightness >= 255
      ? ""
      : `if w>0 then x,y,z=x*${brightness}//255,y*${brightness}//255,z*${brightness}//255 end `;
  return (
    "function Z(e,w)local r=J[e]if r then local x,y,z=r[9],r[10],r[11]" +
    "if w>126 then x,y,z=255,255,255 elseif w>0 then local a,q=math.abs,(w-1)*1536//126 " +
    "x,y,z=glim(a(q-768)-256,0,255),glim(512-a(q-512),0,255),glim(512-a(q-1024),0,255)end " +
    dim +
    "for m=0,80 do if math.abs(M[m])==e then local g=glag(0,m)" +
    "glc(g,1,x,y,z,1)glc(g,2,x,y,z,1)end end end end"
  );
}

/** What the runtime's receive half carries: nothing (no region receives and no colour input), or `Y` and, with a colour input, `Z`. */
export type ReceiveOptions = {
  /** At least one region answers host MIDI (model.ts `receivesOf`). */
  readonly rows: boolean;
  /** The surface's colour input, on the wire; undefined while off. */
  readonly colour?: ColourInputWire;
};

/** The branch texts, keyed as model.ts names them; both fader orientations are one text. */
export const BRANCH_TEXT: Readonly<Record<Branch, string>> = {
  "fader-v": FADER,
  "fader-h": FADER,
  button: BUTTON,
  xy: XY,
  knob: KNOB,
};

/** The three texts the multitouch variant swaps in (change 11); every other part is the same text. */
export const MULTITOUCH_TEXT = {
  release: RELEASE_MULTITOUCH,
  entry: ENTRY_MULTITOUCH,
  xy: XY_MULTITOUCH,
} as const;

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
 * branches in kind order - the fader's one text once for either orientation - then the receive
 * callback and the colour input (change 17) when `receive` asks for them. Under `multitouch` (a
 * surface with a Touches > 1 pad) the release, the entry and the XY pad are the variant's texts,
 * and the XY branch is always among the parts, as the variant's `R` calls it.
 */
export function runtimeParts(
  branches: readonly Branch[],
  multitouch = false,
  receive: ReceiveOptions | undefined = undefined,
): RuntimePart[] {
  const wanted: readonly Branch[] = multitouch ? [...branches, "xy"] : branches;
  const ordered = BRANCHES.filter((b) => wanted.includes(b));
  const text = (b: Branch): string =>
    multitouch && b === "xy" ? MULTITOUCH_TEXT.xy : BRANCH_TEXT[b];
  const texts = [
    multitouch ? MULTITOUCH_TEXT.release : RELEASE,
    multitouch ? MULTITOUCH_TEXT.entry : ENTRY,
    ...(ordered.length > 0 ? [PAINT, SEND] : []),
    ...(ordered.some((b) => b === "fader-v" || b === "fader-h" || b === "xy")
      ? [POSITION]
      : []),
    ...(ordered.includes("button") ? [BUTTON_OFF] : []),
    ...new Set(ordered.map(text)),
    ...(receive === undefined ? [] : [receivePart(receive)]),
    ...(receive?.colour === undefined
      ? []
      : [colourPart(receive.colour.brightness)]),
  ];
  return texts.map((lua) => ({ name: nameOf(lua), lua }));
}

/** The slots a part may land in, in the order the packer fills them; the Setup last (change 17, five slots only). */
export type RuntimeSlot =
  | "systemTimer"
  | "system"
  | "mapmode"
  | "timer"
  | "setup";

export type PackedRuntime = {
  /** The touch Timer (0/6): the arm, the tail defaults and a head if it carries parts (change 17), the parts, the receive assignment (change 17), the sweep. */
  readonly timer: string;
  /** The system element's fourth event (255/4) under three or five slots; undefined under two. */
  readonly mapmode: string | undefined;
  /** 255/6 under five slots: the trimmed half and the parts it took; undefined otherwise. */
  readonly systemTimer: string | undefined;
  /** 255/0 under five slots: the trimmed half and the parts it took; undefined otherwise. */
  readonly system: string | undefined;
  /** The touch Setup with the parts it took (change 17), when the emitter handed its data half; undefined otherwise. */
  readonly setup: string | undefined;
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
  /** The multitouch variant (change 11): the emitter sets it when a pad has more than one finger. */
  readonly multitouch?: boolean;
  /** The receive half (change 17): the emitter sets it when a region receives or the colour input is on. */
  readonly receive?: ReceiveOptions;
  /**
   * The touch Setup's data half (change 17, under five slots): its head (the marker, `J`, `M`, the
   * contact tables, the paint) and its tail (the pull-ins, the receive assignment, the callback).
   * Handed, the Setup is the last slot a part may land in, between the two.
   */
  readonly setup?: { readonly head: string; readonly tail: string };
};

type Bin = {
  readonly slot: RuntimeSlot;
  readonly prefix: readonly string[];
  readonly tail: readonly string[];
  readonly taken: string[];
};

/** How many placements the exact search may try before the first-fit answer stands (a surface over by little is where it runs longest). */
export const PACK_SEARCH_LIMIT = 20000;

/**
 * Pack the runtime into its slot(s), largest part first, each into the first slot with room
 * (a slot's head paid once), the Timer taking whatever fits nowhere else. Under two slots every
 * part is in the Timer; under three the fill order is 255/4 then the Timer; under five 255/6 and
 * 255/0 (each the trimmed half, then the head, then the parts), 255/4, the Timer, then - handed
 * (change 17) - the touch Setup between its data and its pull-ins. When first fit leaves a part
 * over, an EXACT search (depth first over the same order, bounded by `PACK_SEARCH_LIMIT` and by
 * the room left against the parts left) looks for a placement before the surface is called over:
 * the receive callback made the five-kind surface a packing problem first fit loses (change 17).
 * Within a slot the parts stand in their canonical order. Nothing here measures under the
 * minifier: the parts are fixed points and `joinLua` keeps them so, which cost.ts re-checks.
 */
export function packRuntime(
  branches: readonly Branch[],
  options: PackOptions = {},
): PackedRuntime {
  const slots = options.slots ?? 2;
  const sweep = sweepCall(options.sweepCalls ?? DEFAULT_SWEEP_CALLS);
  const budget = options.budget ?? EVENT_BUDGET;
  const parts = runtimeParts(
    branches,
    options.multitouch ?? false,
    options.receive,
  );

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
    prefix: [MARKER, ARM, TAIL_DEFAULTS_LOOP],
    tail: [options.receive === undefined ? RECEIVE_NONE : RECEIVE_ON, sweep],
    taken: [],
  };
  bins.push(timer);
  const setupBin: Bin | undefined =
    options.setup === undefined
      ? undefined
      : {
          slot: "setup",
          prefix: [options.setup.head],
          tail: [options.setup.tail],
          taken: [],
        };
  if (setupBin !== undefined) bins.push(setupBin);

  const fitsIn = (bin: Bin, lua: string): boolean =>
    joinLua([...bin.prefix, STATE, ...bin.taken, lua, ...bin.tail]).length <=
    budget;

  const bySize = [...parts].sort((a, b) => b.lua.length - a.lua.length);
  // First fit, decreasing: every part into the first slot with room.
  let fits = true;
  for (const part of bySize) {
    const bin = bins.find((b) => fitsIn(b, part.lua));
    if (bin !== undefined) bin.taken.push(part.lua);
    else {
      fits = false;
      break;
    }
  }
  if (!fits) {
    for (const bin of bins) bin.taken.length = 0;
    fits = searchPlacement(bySize, bins, fitsIn, budget);
    if (!fits) {
      // No placement: first fit again, the Timer carrying whatever fits nowhere (over).
      for (const bin of bins) bin.taken.length = 0;
      for (const part of bySize) {
        (bins.find((b) => fitsIn(b, part.lua)) ?? timer).taken.push(part.lua);
      }
    }
  }
  const slotOf = new Map<string, RuntimeSlot>();
  for (const bin of bins) {
    for (const lua of bin.taken) slotOf.set(lua, bin.slot);
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
    setup: setupBin === undefined ? undefined : render(setupBin),
    placement: parts.map((p) => ({
      name: p.name,
      slot: slotOf.get(p.lua) as RuntimeSlot,
    })),
    parts,
    fits,
  };
}

/**
 * The exact search behind `packRuntime`: the parts in the order given (largest first), each tried
 * in every slot with room, depth first, the first complete placement kept in the bins. Two bounds:
 * a branch whose parts left outweigh the room left in every slot is cut, and the whole search stops
 * after `PACK_SEARCH_LIMIT` tries. Returns whether a placement was found.
 */
function searchPlacement(
  bySize: readonly RuntimePart[],
  bins: Bin[],
  fitsIn: (bin: Bin, lua: string) => boolean,
  budget: number,
): boolean {
  const rest: number[] = [];
  let sum = 0;
  for (let i = bySize.length - 1; i >= 0; i -= 1) {
    sum += bySize[i].lua.length;
    rest[i] = sum;
  }
  const roomOf = (bin: Bin): number =>
    budget - joinLua([...bin.prefix, STATE, ...bin.taken, ...bin.tail]).length;
  let tries = 0;
  const place = (i: number): boolean => {
    if (i === bySize.length) return true;
    if (tries > PACK_SEARCH_LIMIT) return false;
    const room = bins.reduce((n, bin) => n + Math.max(0, roomOf(bin)), 0);
    if (rest[i] > room) return false;
    const lua = bySize[i].lua;
    for (const bin of bins) {
      tries += 1;
      if (!fitsIn(bin, lua)) continue;
      bin.taken.push(lua);
      if (place(i + 1)) return true;
      bin.taken.pop();
    }
    return false;
  };
  return place(0);
}
