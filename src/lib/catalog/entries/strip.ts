// STRIP - one big fader up the pad, one crossfader along the bottom, and neither of them can
// move the other.
//
// Rows 0..7 are the big fader (seventy-two cells, a solid @BARC block growing from the bottom
// over a dim @RAILC body); row 8 is the crossfader (a dim @XFC line with one bright marker cell).
// Two ordinary seven-bit controllers, each resolving every one of the 128 codes over its whole
// travel; each gesture is locked at its onset to the control it started on. Ten-bit axes, the
// catalog's only `txma` / `tyma`. No running Timer (`static`): since change 17B the Timer event
// holds the typed sender, the rows' phases and the MIDI receive, and the Setup PULLS IT IN with
// `self:tim()`, never arming it. Knobs: @BARC, @XFC (id `vernier`), @RAILC and two MIDI outputs,
// the Fader (@FT @CH @CC @FR) and the Crossfader (@XT @XCH @XCC @XR). Setup 849 / Timer 476 of 908
// at the picker corner (829 / 470 at the defaults); restsBlack false. Kind "lua": `sends.faders`
// is typed `3 | 4`.
// History: docs/entries/strip.md (the bench note, the trade, the three-control costing, 11-13;
// change 17B).
//
// MECHANISM
//   - Setup: `txma(1023) tyma(1023)`; both axes unlocked though only y needs it, because
//     lua-host.ts:713-719 keeps ONE `_coordMax` behind both names. The unlock pays for a control
//     that owns a FRACTION of its axis: locked, the fader's eight rows are y in 0..113 and can
//     emit only 114 of the 128 codes; unlocked they are 0..910 and reach every one. The
//     crossfader owns the whole x axis and sends `x//8`, exactly what a locked axis would hand it.
//   - `self.o[i]` records at the ONSET (`e==4 or e>8 or s.o[i]==nil`) whether contact i is on
//     the crossfader (`y>910`); every later sample of that contact goes to the same control.
//     `s.o[i]==nil` covers a MOVE whose onset was never delivered.
//   - ROW = y*9//1024, so row 8 is y >= 911 and rows 0..7 are y in 0..910: 910 is both the
//     boundary and the fader's divisor, by construction.
//   - FADER v = glim((910-y)*127//910,0,127): 127 at y = 0, 0 at y = 910, both ends exact; the
//     clamp keeps the low end AT zero (a locked contact can see y > 910). Bar height k = v*9//128,
//     0..8 over eight body rows (row r lit when r >= 8-k): nine heights, "none" to "all eight".
//   - CROSSFADER p = x//8; marker column c = x*9//1024.
//   - A send is gated on the VALUE changing (p ~= s.p, v ~= s.v); a repaint on k or c changing,
//     so a slide inside one cell's travel sends and paints nothing. DO NOT REMOVE THE GATE.
//   - `F(s)` repaints rows 0..7 in ONE PASS, colours only (@BARC where n//9 >= 8-s.k, @RAILC
//     otherwise, both layers); the phases of rows 0..7 are written to 255 once - by the
//     pulled-in Timer body since change 17B, still inside the Setup - and never again (folding them into the repaint would double the calls per cell under a moving
//     finger). `X(s)` repaints row 8: @XFC on both layers, phase 255 on the marker, 51 elsewhere
//     (the track, so the control is legible at rest). Rest state: v = 63 (k = 4), c = 4 - a
//     reachable state.
//
// WHAT IT SENDS (two outputs since change 17B; `M(t,c,n,o)`, the Timer's typed sender taken by
// the Setup after the pull-in: a controller n, o; a pitch bend 0, o; a pressure o, 0)
//   M(@FT,@CH,@CC,v)     the fader, on a change of v
//   M(@XT,@XCH,@XCC,p)   the crossfader, on a change of p
//   At the defaults 1 and 2 on channel 0 - the pair the card sent, message for message.
// WHAT IT RECEIVES (change 17B; @FR / @XR the header INSTR, 13 On, 0 Off)
//   The host's message on a control's type, channel and (a controller) number sets its value -
//   the fader's v and bar (k = w*9//128), the crossfader's p and marker (c = w*9//128) - and
//   repaints it through F or X (handed over as self.f, self.x). A relative next touch does not
//   exist here: both are absolute, so the next touch takes the control from the finger. Nothing is
//   sent back. The latch: `s.o[i]` fixes each contact's control at its onset - already latched.
//
// TRAPS
//   - THE NEGATIVE-VALUE PATH, closed by `glim` and by `s.o[i]==nil`: a fader-locked contact
//     dragged to y = 1023 put -1..-16 on the wire with every gate green. Observed, not anticipated.
//   - EVERY DIVISION IS FLOORED: //1024, //910, //128, //8. A fraction reaching a firmware call
//     becomes 0, silently.
//   - EACH CONTROL'S NUMBER IS ITS OWN (0..127) since change 17B; the fader's four old rungs (1, 7,
//     11, 16) first, the crossfader's own knob 2 by default (the old @CC+1).
//   - THE FADER'S DIVISOR IS 910, NOT 1023: the crossfader owns the bottom row (the rule CONSOLE
//     learned with //7).
//   - CODE 9 IS HARMLESS HERE: a tap sets a value and a fader has nothing to release. The live
//     filter is the blessed `e~=1 and e~=4 and e<9 then return`, the onset `e==4 or e>8`. The
//     only per-contact state is s.o[i], overwritten by the next onset rather than cleared.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of @BARC, @XFC, @RAILC is 0..255.
//   - NO KEEPER AND NO DECAY: nothing writes glt, glf or glpfs.
//   - THE KNOB ID `vernier` IS A STALE NAME ON PURPOSE: src/lib/share/fixtures/wild-stamps.json
//     keys STRIP's captured `xn33333` on it and stamp.spec.ts asserts the decoded indices. THE
//     LABEL CARRIES THE MEANING; THE ID IS HISTORY. (CHORUS's `@SPREAD` is the same case.)
//   - THE RACK GREW AT CHANGE 17B (eleven knobs, the fader's Number 0..127), so STRIP's captured
//     wild stamp lands `unreadable` - the known pattern of a grown rack.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";
import { onLattice } from "../lattice";
import {
  CHANNEL_VALUES,
  CONTINUOUS_STATUSES,
  RECEIVE_ON_INDEX,
  RECEIVE_VALUES,
  numberValues,
} from "../../tune/midi";

const SETUP =
  "--[[@cb]]local M self:txma(1023)self:tyma(1023)self.o={}local function F(s)for n=0,71 do local a=glag(0,n)if n//9>=8-s.k then glc(a,1,@BARC,1)glc(a,2,@BARC,1)else glc(a,1,@RAILC,1)glc(a,2,@RAILC,1)end end end local function X(s)for n=72,80 do local a=glag(0,n)local p=n-72==s.c and 255 or 51 glc(a,1,@XFC,1)glc(a,2,@XFC,1)glp(a,1,p)glp(a,2,p)end end self.k=4 self.c=4 self.v=63 self.p=63 self.f=F self.x=X F(self)X(self)self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then return end if e==4 or e>8 or s.o[i]==nil then s.o[i]=y>910 end if s.o[i]then local p=x//8 if p~=s.p then s.p=p M(@XT,@XCH,@XCC,p)local c=x*9//1024 if c~=s.c then s.c=c X(s)end end else local v=glim((910-y)*127//910,0,127)if v~=s.v then s.v=v M(@FT,@CH,@CC,v)local k=v*9//128 if k~=s.k then s.k=k F(s)end end end end self:tim()M=self.m";

const TIMER =
  "--[[@cb]]local s=self for n=0,71 do local a=glag(0,n)glp(a,1,255)glp(a,2,255)end local k,F,X=s.touch_cb,s.f,s.x s.m=function(t,c,n,o)s:gms(c,t,t==208 and o or t>223 and 0 or n,t==208 and 0 or o)end s.midirx_cb=function(s,e,v)local function f(r,t,c,n)return e[1]==r and v[2]==t and v[1]==c and(t>207 or v[3]==n)and v[t//16%3+2]end if s.touch_cb==k then local a,b=f(@FR,@FT,@CH,@CC),f(@XR,@XT,@XCH,@XCC)if a then s.v=a s.k=a*9//128 F(s)end if b then s.p=b s.c=b*9//128 X(s)end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const STRIP: CatalogEntry = {
  id: "strip",
  name: "Strip",
  description:
    "Slide up the pad for the big fader and along the bottom for the crossfader; each sends its own controller.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  // "precise" holds at seven bits: both controls resolve every one of the 128 codes, which no
  // other entry does; "precise" and "still" sit at the FEELS floor facets.spec.ts asserts.
  tags: ["mixing", "precise", "still"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution (TUNE-01); every default is the INDEX of
  // the value that reproduces the canonical text. THE RACK IS UNCHANGED BY THE REWRITE (five
  // knobs, four values each, the same ids), so every captured STRIP stamp still restores.
  // TOKEN PREFIX CHECK: no one of @CC, @CH, @BARC, @XFC, @RAILC is a prefix of another.
  knobs: [
    {
      id: "cc",
      label: "Fader controller",
      kind: "amount",
      token: "@CC",
      // The Fader output's Number (change 17B; "First controller" of an adjacent pair before it):
      // all of 0..127, its four old rungs first so a saved copy keeps its controller.
      values: numberValues(["1", "7", "11", "16"]),
      default: 0,
    },
    {
      id: "channel",
      label: "Fader MIDI channel",
      kind: "amount",
      token: "@CH",
      // The Fader output's Channel (change 17B; both controls' before it). ZERO-BASED on the wire,
      // the rows read 1..16; sixteen since 17B (four before: 0, 1, 9, 15).
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "bar",
      label: "Fader colour",
      kind: "colour",
      token: "@BARC",
      // The lit part of the big fader, on layers 1 and 2. Bright: it is the number.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice(["0,200,255", "255,90,0", "0,255,120", "255,0,180"]),
      default: 0,
    },
    {
      id: "vernier",
      label: "Crossfader colour",
      kind: "colour",
      token: "@XFC",
      // The bottom row, on layers 1 and 2: the marker cell at phase 255, the track at 51. The
      // id is stale on purpose (TRAPS). The four old values sit apart from the bar's at every index.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice(["255,180,60", "255,255,255", "255,0,180", "0,255,120"]),
      default: 0,
    },
    {
      id: "rail",
      label: "Rail colour",
      kind: "colour",
      token: "@RAILC",
      // The unlit body of the big fader, on layers 1 and 2. Dim: a body, not the number.
      // APPEARS TWICE - once per layer.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice(["0,25,50", "25,0,50", "40,20,0", "20,20,20"]),
      default: 0,
    },
    {
      id: "faderType",
      label: "Fader MIDI type",
      kind: "mode",
      token: "@FT",
      // The Fader output's type (change 17B): a controller, a pitch bend, a channel pressure.
      values: CONTINUOUS_STATUSES,
      default: 0,
    },
    {
      id: "faderReceive",
      label: "Fader MIDI receive",
      kind: "mode",
      token: "@FR",
      // The header INSTR the receive answers for the Fader: 13 the host (On), 0 (Off).
      values: RECEIVE_VALUES,
      default: RECEIVE_ON_INDEX,
    },
    {
      id: "crossType",
      label: "Crossfader MIDI type",
      kind: "mode",
      token: "@XT",
      // The Crossfader output's type (change 17B).
      values: CONTINUOUS_STATUSES,
      default: 0,
    },
    {
      id: "crossChannel",
      label: "Crossfader MIDI channel",
      kind: "amount",
      token: "@XCH",
      // The Crossfader output's Channel (change 17B), the Fader's by default.
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "crossCc",
      label: "Crossfader controller",
      kind: "amount",
      token: "@XCC",
      // The Crossfader output's Number (change 17B): 2 by default - the old "@CC+1" at the default.
      values: numberValues(),
      default: 2,
    },
    {
      id: "crossReceive",
      label: "Crossfader MIDI receive",
      kind: "mode",
      token: "@XR",
      // The header INSTR the receive answers for the Crossfader.
      values: RECEIVE_VALUES,
      default: RECEIVE_ON_INDEX,
    },
  ],

  // Two outputs (change 17B): the Fader and the Crossfader, continuous, each with its own Type,
  // Channel, Number and Receive - a received value moves the control and its light.
  outputs: [
    {
      id: "fader",
      name: "Fader",
      kind: "continuous",
      tokens: { type: "@FT", channel: "@CH", number: "@CC", receive: "@FR" },
    },
    {
      id: "crossfader",
      name: "Crossfader",
      kind: "continuous",
      tokens: { type: "@XT", channel: "@XCH", number: "@XCC", receive: "@XR" },
    },
  ],

  // The same eleven indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    cc: 0,
    channel: 0,
    bar: 0,
    vernier: 0,
    rail: 0,
    faderType: 0,
    faderReceive: RECEIVE_ON_INDEX,
    crossType: 0,
    crossChannel: 0,
    crossCc: 2,
    crossReceive: RECEIVE_ON_INDEX,
  },

  // FALSE: Setup lights all eighty-one cells. frames.spec.ts test 5 checks it.
  restsBlack: false,
};
