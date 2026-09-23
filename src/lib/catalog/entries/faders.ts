// FOUR FADERS - four faders side by side, each a white rail with a coloured level, each its own MIDI
// output that receives; a finger keeps the fader it landed on (change 17C, 2026-09-23,
// BENCH-2026-09-16.txt sections 17 and 18).
//
// The ported FOUR FADERS preset rebuilt by hand, RADAR's route (change 12b, entries/radar.ts): the
// compiled preset's Setup carried with its sends as the four outputs' tokens, plus the latch and the
// receive. It could not stay a wrapped `padsim` card (entries/ported-midi.ts) because the latch is
// the fault the user saw - "i saw it on the faders config in playground" - and the vendored PadSim
// runs the PadState's fader-under-the-finger rule, so a wrapped card's preview would still slide
// from fader to fader while the module latched. A Lua card's preview runs this Lua. The preset
// stays on the shelf (presets.ts) untouched, reached through `portedEntry("faders")`. Setup 757 of
// 908 at the defaults (765 at the dearest literals), Timer 292 (300); sixteen knobs, every one an
// output's. Off the front door: a Lua card cannot sit in the row (front-door.ts). History:
// docs/entries/faders.md.
//
// MECHANISM
//   - Setup, the preset's loop, verbatim: odd columns are the four faders (f = column // 2), their
//     cells coloured `f*85,255-f*20,255-f*85` on layers 1 and 2 and dark; even columns are the
//     white rails, lit. The compiled preset's picture, byte for byte - frames.json's `faders` block
//     did not move.
//   - `B(f,v)`, the compiled bar painter lifted into a local: `l=(v+1)*9//128` rows lit from the
//     bottom of fader f's column on both layers. Published as `s.b` for the Timer's receive.
//   - The callback: on a live sample (`e==1 or e==4 or e>8`, the compiler's guard) the contact's
//     fader is PINNED on its onset - `if e~=1 or not s.g[i]then s.g[i]=N(x,y)%9*4//9 end`, the
//     compiled fader rule (`N` the library's calibrated cell) read once instead of per sample - then
//     `127-y` goes out on the pinned fader's output and its bar is painted; a release (`e==3 or
//     e>=5 and e<9`, touch-guard.spec.ts's escaped form) clears the pin. A fast tap (9) leaves its
//     pin for the next onset on the same id to replace - an onset always re-pins.
//   - `s:tim()` last (17B's pull-in): the Timer body, run once as a method, makes the receive. The
//     Setup has no room for it (953 with it) and arms no Timer - a still card's armed Timer reads as
//     motion to the preview (docs/MIDI.md section 6), and the preset's `gtt(0,3e5)` kept nothing
//     alive (no keeper on this card), so it is gone from both events.
//
// WHAT IT SENDS (four outputs, Fader 1..4)
//   `s:gms(C[f+1],t,t==208 and v or t>223 and 0 or U[f+1],t==208 and 0 or v)`, t = T[f+1]: a
//   controller `number, v`, a pitch bend `0, v`, a channel pressure `v, 0` (docs/MIDI.md section 2),
//   on every live sample of the contact, as the compiled preset sends: no send-on-change. At the
//   defaults the preset's wire exactly - controllers 16, 17, 18, 19 on channel 1 (wire 0).
// WHAT IT RECEIVES (@R1..@R4 the header INSTR, 13 On, 0 Off)
//   A host message on a fader's output (its type, channel and - a controller - number) paints that
//   fader's bar at the value, `B(f,w)`: the lights follow the DAW. The fader holds no other value -
//   the next touch jumps to the finger, as it always did. Nothing is sent back.
// THE LATCH (section 18): a contact keeps the fader it landed on until it lifts - a slide from
//   fader 1 onto fader 2 moves fader 1's output only, and the finger's height still drives it. Two
//   fingers on two faders drive two faders.
//
// TRAPS
//   - THE PIN IS PER CONTACT (`s.g[i]`), cleared on release: a lost lift is healed by the next
//     onset on the same id (the firmware reuses the lowest free id) re-pinning it, and a live
//     sample from a contact with no pin (an onset the module lost) pins where it is.
//   - `s.g`, `s.b` ARE THIS CARD'S FIELDS; the library's state is global (H T C P B L).
//   - THE TIMER CARRIES THE SEND TABLES TOO (@T1..@N4 appear in both events) - one substitution each.
//   - COLOUR CHANNELS: the three linear forms are the brightness scaler's `linear` class
//     (brightness.ts), every value 0..255 at f = 0..3.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";
import {
  CHANNEL_VALUES,
  CONTINUOUS_STATUSES,
  RECEIVE_ON_INDEX,
  RECEIVE_VALUES,
  numberValues,
} from "../../tune/midi";
import { SEND_RUNGS } from "./ported-midi";

const SETUP =
  "--[[@cb]]for n=0,80 do local a=glag(0,n)local c=n%9 if c%2==1 then local f=c//2 glc(a,1,f*85,255-f*20,255-f*85,1)glc(a,2,f*85,255-f*20,255-f*85,1)glp(a,1,0)glp(a,2,0)else glc(a,1,255,255,255,1)glc(a,2,255,255,255,1)glp(a,1,255)glp(a,2,255)end end local s,T,C,U=self,{@T1,@T2,@T3,@T4},{@CH,@C2,@C3,@C4},{@CC,@N2,@N3,@N4}s.g={}local function B(f,v)local l=(v+1)*9//128 for n=0,80 do if n%9==f*2+1 then local w=(8-n//9)<l and 255 or 0 local a=glag(0,n)glp(a,1,w)glp(a,2,w)end end end s.b=B s.touch_cb=function(s,i,e,x,y)if e==1 or e==4 or e>8 then if e~=1 or not s.g[i]then s.g[i]=N(x,y)%9*4//9 end local f,v=s.g[i],127-y local t=T[f+1]s:gms(C[f+1],t,t==208 and v or t>223 and 0 or U[f+1],t==208 and 0 or v)B(f,v)end if e==3 or e>=5 and e<9 then s.g[i]=nil end end s:tim()";

const TIMER =
  "--[[@cb]]local s=self local k,B,T,C,U,R=s.touch_cb,s.b,{@T1,@T2,@T3,@T4},{@CH,@C2,@C3,@C4},{@CC,@N2,@N3,@N4},{@R1,@R2,@R3,@R4}s.midirx_cb=function(s,h,v)if s.touch_cb==k then for f=0,3 do local t=T[f+1]if h[1]==R[f+1]and v[2]==t and v[1]==C[f+1]and(t>207 or v[3]==U[f+1])then B(f,v[t//16%3+2])end end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

/** One fader's four knobs: Type, Channel, Number, Receive; fader 1's Channel and Number are the preset's two knobs, by id. */
function faderKnobs(n: number): CatalogEntry["knobs"] {
  const one = n === 1;
  return [
    {
      id: `type${n}`,
      label: `Fader ${n} MIDI type`,
      kind: "mode",
      token: `@T${n}`,
      values: CONTINUOUS_STATUSES,
      default: 0,
    },
    ...(one
      ? []
      : [
          {
            id: `channel${n}`,
            label: `Fader ${n} MIDI channel`,
            kind: "amount" as const,
            token: `@C${n}`,
            values: CHANNEL_VALUES,
            default: 0,
          },
          {
            id: `cc${n}`,
            label: `Fader ${n} controller`,
            kind: "amount" as const,
            token: `@N${n}`,
            // Controller 15 + n, the preset's ccBase + f at its shipped 16.
            values: numberValues(),
            default: 15 + n,
          },
        ]),
    {
      id: `receive${n}`,
      label: `Fader ${n} MIDI receive`,
      kind: "mode",
      token: `@R${n}`,
      values: RECEIVE_VALUES,
      default: RECEIVE_ON_INDEX,
    },
  ];
}

const KNOBS: CatalogEntry["knobs"] = [
  // The preset's two knobs first, by id and in their order, so a saved copy's positions keep landing
  // on them: its Send is fader 1's Number (the twelve old rungs first), its Channel fader 1's Channel
  // (the sixteen in order, the wire's 0..15 read 1..16).
  {
    id: "send",
    label: "Fader 1 controller",
    kind: "amount",
    token: "@CC",
    values: numberValues(SEND_RUNGS),
    default: 0,
  },
  {
    id: "channel",
    label: "Fader 1 MIDI channel",
    kind: "amount",
    token: "@CH",
    values: CHANNEL_VALUES,
    default: 0,
  },
  ...faderKnobs(1),
  ...faderKnobs(2),
  ...faderKnobs(3),
  ...faderKnobs(4),
];

export const FADERS: CatalogEntry = {
  id: "faders",
  name: "Four faders",
  description:
    "Four faders side by side, each with a white rail and a coloured level you can see across the room.",
  // D-10: the ported card's three, unchanged, so the FEELS histogram moves by zero.
  tags: ["mixing", "readable", "still"],
  featured: false,
  // The rebuild's date (RADAR's precedent, change 12b), so the card sorts newest.
  addedAt: "2026-09-23",
  source: SOURCE,
  preview: previewFor(SOURCE),
  knobs: KNOBS,
  // Four outputs, one per fader (answer 3, "per output"): each its own Type, Channel, Number and
  // Receive; four blocks, open (the panel folds past four).
  outputs: [1, 2, 3, 4].map((n) => ({
    id: `fader${n}`,
    name: `Fader ${n}`,
    kind: "continuous" as const,
    tokens: {
      type: `@T${n}`,
      channel: n === 1 ? "@CH" : `@C${n}`,
      number: n === 1 ? "@CC" : `@N${n}`,
      receive: `@R${n}`,
    },
  })),
  defaults: Object.fromEntries(KNOBS.map((knob) => [knob.id, knob.default])),
  // FALSE from tick 0: the rails are lit by the Setup.
  restsBlack: false,
};
