// POMODORO - twenty-five minutes that mean something in a room.
//
// A countdown read at a glance from three metres: the 32 border cells are the ring, one goes out
// for every 1/32 of the interval, and the inner 7x7 breathes in the working colour while it runs
// and in the resting colour after it ends. One tap anywhere in the inner 7x7 starts, pauses,
// resumes or - at zero - resets; a tap on the ring does nothing (a readout, not a control).
// Every tap sends a transport note (an octave below the alarm at the defaults); the alarm sounds
// once at zero. Knobs: @MINS (15 20 25 50 1 5, in that order), @RINGC, @BREAKC, and since change
// 17B two MIDI outputs - Transport (@TT @TCH @TN) and Alarm (@AT @CH @NOTE). Setup 766 of 908 at
// the picker corner (754 at the defaults), Timer 669 (655); restsBlack false. Kind "lua": nothing
// in PadState counts. A kitchen timer, not a stopwatch: every tick is 10 ms late at best.
// History: docs/entries/pomodoro.md (09-09, 11-09: the append, the 160,000-tick run, the corner;
// change 17B).
//
// MECHANISM
//   - THE RING IS THE 32 BORDER CELLS, WALKED CLOCKWISE ONCE IN SETUP into self.r: the top row
//     0..8 (nine), the right column k*9+8 for k = 1..8 (eight), the bottom row 80-k (eight,
//     right to left), the left column (8-k)*9 for k = 1..7 (seven). r[1] is the top-left corner.
//   - self.n = @MINS*60 the interval in seconds, self.t the seconds remaining, self.p 1 running /
//     0 paused, self.c the re-issue countdown (300). `I(p,q,w)` colours the inner 7x7 on layer 2
//     and arms the breathe glpfs(a,2,(x+y)*16,1,3) glt(a,2,60000) - shape 3 the sine, rate 1,
//     the (x+y)*16 spread 32..224 across the diagonal so it rolls corner to corner (256 ticks a
//     cycle). The ring's phase is written to 255 on both layers once; the Timer only rewrites its
//     COLOUR, and an all-zero colour renders black (glc's sixth argument forces the minimum stop).
//   - The handler: `if e~=4 and e<9 then return end` (a press or a coalesced tap, nothing else);
//     c = x*9//128, w = y*9//128; return outside 1..7 on either axis; at zero reset (s.t = s.n,
//     I(@RINGC), s.p = 1), otherwise toggle s.p; send the transport note-on and note-off.
//     `self.midirx_cb=nil` (change 17B, below), `gtt(0,1000)`.
//   - The Timer, `gtt(0,1000)` first: `s.c` counts down and every 300 s RE-ISSUES glpfs and glt
//     on all 49 inner cells - OUTSIDE the `if s.p>0` test, so the breathe outlives the countdown.
//     While running: s.t decrements; if s.t > 0, m = s.t*32//s.n and the ring lights r[1]..r[m]
//     in @RINGC and blacks the rest (the darkness opens below the top-left corner and eats
//     backwards down the left edge; m takes all 33 values 32..0 at every interval); at zero,
//     s.p = 0, the alarm note-on and note-off, the whole ring and the inner field in @BREAKC.
//     At five minutes the re-issue and the completion land on the same call, re-issue first.
//
// WHAT IT SENDS (two outputs since change 17B, each Note or CC; `T*3//2-88` is the note-off
// 128, or the controller again at 0)
//   Transport  s:gms(@TCH,@TT,@TN,90,0) then s:gms(@TCH,@TT*3//2-88,@TN,0,0) on every accepted
//              tap - the card's only way of saying it started (lua-smoke.spec.ts test 2 fails an
//              entry with no output in 218 ticks). @TN is its own Number since 17B, 48 by default -
//              the old @NOTE-12 at the default alarm (SNAKE's death-note octave idiom).
//   Alarm      s:gms(@CH,@AT,@NOTE,110,0) then s:gms(@CH,@AT*3//2-88,@NOTE,0,0), ONCE, at zero.
//   At the defaults the wire is POMODORO's before the change, message for message.
// WHAT IT RECEIVES (change 17B): nothing. The notes announce events - a tap, the end - and hold
//   no value; a received transport note would have to act as a tap, and a DAW's MIDI thru echoing
//   the card's own tap note would undo every tap. Neither output has a Receive; the Setup assigns
//   `self.midirx_cb=nil`. The latch: onset-only taps - already latched.
//
// TRAPS
//   - THE 655 SECOND RE-ISSUE, DO NOT REMOVE. glt caps at 65535 ticks; the breathe is armed at
//     60000 (600 s) and a 25-minute interval is 1500 s. On the last tick of a countdown firmware
//     sets the layer's rate to 0 and re-arming with glt alone will not restart it, so the Timer
//     re-issues glpfs AND glt every 300 s. No gate runs an entry long enough to notice (the
//     160,000-tick run is in 09-09-SUMMARY.md). ZONA-CAPABILITIES.md 5.3: the Timer re-arm is one
//     of three ways to beat the ceiling and the only one right for an ambient card.
//   - glt(a,2,60000) IS A LONG KEEPER AND IT IS LEGITIMATE - DO NOT "FIX" IT: this layer's rate
//     is 1, three orders of magnitude below pitfall 1's rate floor.
//   - @MINS IS APPENDED, NEVER INSERTED, SORTED OR TIDIED: a knob position is stamp payload by
//     index, so 15, 20, 25, 50 keep indices 0..3 forever (stamp.spec.ts test 9 pins them). The
//     append moved the shape character from `n` to `p`, so older stamps land `older` - the
//     tripwire working, not a wrong interval. @MINS reaches ONE site, self.n.
//   - THE TIMER PERIOD IS THE LITERAL 1000 AND THE RE-ISSUE PERIOD THE LITERAL 300, never a
//     knob: gtt(index,0) never fires and is indistinguishable from stopping the timer.
//   - EVERY DIVISION IS FLOORED: s.t*32//s.n, x*9//128, y*9//128, n//9.
//   - CODE 9 IS HANDLED: `e~=4 and e<9` fires on a press and a coalesced tap and nothing else.
//   - AN ALERT LIGHTS THE SAME 32 CELLS: the module's alert system touches the border LEDs,
//     additively - a fact about the module, not a fault in the configuration.
//   - EACH OUTPUT'S CHANNEL IS AT BOTH OF ITS gms SITES (@TCH twice, @CH twice), so no off goes
//     out on a channel its on did not. @RINGC and @BREAKC reach six and three sites; their own
//     colours are nine characters each, the lattice's 5 to 11 (change 19, costed at 255,255,255).
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; both palettes are inside 0..255 and the phase
//     spread (x+y)*16 can never wrap.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";
import { onLattice } from "../lattice";
import {
  CHANNEL_VALUES,
  TRIGGER_STATUSES,
  numberValues,
} from "../../tune/midi";

const SETUP =
  "--[[@cb]]local r={}for k=0,8 do r[k+1]=k end for k=1,8 do r[k+9]=k*9+8 r[k+17]=80-k end for k=1,7 do r[k+25]=(8-k)*9 end self.r=r self.n=@MINS*60 self.t=self.n self.p=1 self.c=300 local function I(p,q,w)for n=0,80 do local x=n%9 local y=n//9 if x>0 and x<8 and y>0 and y<8 then local a=glag(0,n)glc(a,2,p,q,w,1)glpfs(a,2,(x+y)*16,1,3)glt(a,2,60000)end end end I(@RINGC)for k=1,32 do local a=glag(0,r[k])glc(a,1,@RINGC,1)glc(a,2,@RINGC,1)glp(a,1,255)glp(a,2,255)end self.touch_cb=function(s,i,e,x,y)if e~=4 and e<9 then return end local c=x*9//128 local w=y*9//128 if c<1 or c>7 or w<1 or w>7 then return end if s.t<1 then s.t=s.n I(@RINGC)s.p=1 else s.p=1-s.p end s:gms(@TCH,@TT,@TN,90,0)s:gms(@TCH,@TT*3//2-88,@TN,0,0)end self.midirx_cb=nil gtt(0,1000)";

const TIMER =
  "--[[@cb]]gtt(0,1000)local s=self s.c=s.c-1 if s.c<1 then s.c=300 for n=0,80 do local x=n%9 local y=n//9 if x>0 and x<8 and y>0 and y<8 then local a=glag(0,n)glpfs(a,2,(x+y)*16,1,3)glt(a,2,60000)end end end if s.p>0 then s.t=s.t-1 if s.t>0 then local m=s.t*32//s.n for k=1,32 do local a=glag(0,s.r[k])if k<=m then glc(a,1,@RINGC,1)glc(a,2,@RINGC,1)else glc(a,1,0,0,0,1)glc(a,2,0,0,0,1)end end else s.p=0 s:gms(@CH,@AT,@NOTE,110,0)s:gms(@CH,@AT*3//2-88,@NOTE,0,0)for k=1,32 do local a=glag(0,s.r[k])glc(a,1,@BREAKC,1)glc(a,2,@BREAKC,1)end for n=0,80 do local x=n%9 local y=n//9 if x>0 and x<8 and y>0 and y<8 then glc(glag(0,n),2,@BREAKC,1)end end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const POMODORO: CatalogEntry = {
  id: "pomodoro",
  name: "Pomodoro",
  description:
    "A twenty-five minute ring draining around the edge, so the time left is a thing in the room.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  tags: ["show", "readable", "generative"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution (TUNE-01); every default is the INDEX of
  // the value that reproduces the canonical text. TOKEN PREFIX CHECK: no one of @MINS, @RINGC,
  // @BREAKC, @NOTE, @CH is a prefix of another. 300 (the re-issue period) and 1000 (the Timer
  // period) ARE LITERALS AND NOT KNOBS - both load-bearing (TRAPS).
  knobs: [
    {
      id: "mins",
      label: "Interval (min)",
      kind: "count",
      token: "@MINS",
      // The interval: 25 the pomodoro proper, 15 and 20 the shorter ones people keep to, 50 the
      // two-pomodoro block, 1 and 5 the bench's ask. THE ORDER IS THE POINT AND IT IS NOT
      // SORTED: the two new values are APPENDED so the first four keep their indices (TRAPS;
      // stamp.spec.ts test 9). Reaches ONE site, self.n = @MINS*60.
      values: ["15", "20", "25", "50", "1", "5"],
      default: 2,
    },
    {
      id: "ring",
      label: "Working colour",
      kind: "colour",
      token: "@RINGC",
      // The draining ring and the breathing interior while the interval runs. Its own four are
      // warm triples, nine characters each: the token reaches six sites.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice(["255,120,0", "255,30,10", "255,200,0", "255,60,90"]),
      default: 0,
    },
    {
      id: "break",
      label: "Resting colour",
      kind: "colour",
      token: "@BREAKC",
      // What the whole pad turns when the interval ends. Its own four are cool triples, nine
      // characters each; three sites, all in the Timer.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice(["0,140,255", "0,255,180", "60,90,255", "0,200,220"]),
      default: 0,
    },
    {
      id: "note",
      label: "Alarm MIDI note",
      kind: "note",
      token: "@NOTE",
      // The Alarm output's Number (change 17B), sent once at zero with its off: all of 0..127, the
      // four it offered first (60, 72, 48, 84) so a saved copy's index keeps its note. The tap's
      // transport note was this minus twelve until 17B and is its own Number now.
      values: numberValues(["60", "72", "48", "84"]),
      default: 0,
    },
    {
      id: "channel",
      label: "Alarm MIDI channel",
      kind: "amount",
      token: "@CH",
      // The Alarm output's Channel (change 17B; both notes' before it). ZERO-BASED, the first
      // argument of gms; the rows read 1..16. Sixteen since 17B (four before: 0, 1, 9, 15). At both
      // alarm sites, so no off goes out on a channel its on did not.
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "alarmType",
      label: "Alarm MIDI type",
      kind: "mode",
      token: "@AT",
      // The Alarm output's type (change 17B): 144 a note, 176 a controller; the off is
      // @AT*3//2-88 (a note-off, or the controller at 0).
      values: TRIGGER_STATUSES,
      default: 0,
    },
    {
      id: "transportType",
      label: "Transport MIDI type",
      kind: "mode",
      token: "@TT",
      // The Transport output's type (change 17B): the note every accepted tap sends.
      values: TRIGGER_STATUSES,
      default: 0,
    },
    {
      id: "transportChannel",
      label: "Transport MIDI channel",
      kind: "amount",
      token: "@TCH",
      // The Transport output's Channel (change 17B), the Alarm's by default.
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "transportNote",
      label: "Transport MIDI note",
      kind: "note",
      token: "@TN",
      // The Transport output's Number (change 17B): 48 by default - the old @NOTE-12 at the
      // default alarm.
      values: numberValues(),
      default: 48,
    },
  ],

  // Two outputs (change 17B), both triggers with an off, neither receiving: the Transport (every
  // accepted tap - start, pause, reset) and the Alarm (once, at zero). docs/entries/pomodoro.md.
  outputs: [
    {
      id: "transport",
      name: "Transport",
      kind: "trigger",
      tokens: { type: "@TT", channel: "@TCH", number: "@TN" },
    },
    {
      id: "alarm",
      name: "Alarm",
      kind: "trigger",
      tokens: { type: "@AT", channel: "@CH", number: "@NOTE" },
    },
  ],

  // The same nine indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    mins: 2,
    ring: 0,
    break: 0,
    note: 0,
    channel: 0,
    alarmType: 0,
    transportType: 0,
    transportChannel: 0,
    transportNote: 48,
  },

  // FALSE: a full ring at phase 255 and a breathing interior from tick 0. frames.spec.ts test 5.
  restsBlack: false,
};
