// CHORUS - seven diatonic triads, the lowest at the bottom-left, two octave pads, and a bloom.
//
// Nine 3x3 pads: seven chord pads read left to right from the bottom row (I ii iii / IV V vi /
// vii), each a triad baked in Setup from a scale table over a chromatic root (@KEY, C3..B3); the
// top row's two right-hand pads are Octave down and Octave up, each press moving the set by 12,
// two octaves either way, the pad's brightness showing the shift. ONE CHORD AT A TIME; a press on
// the sounding pad re-owns it; a finger keeps the pad it landed on until it lifts (change 18's
// latch, landed at 17B: a slide onto the next pad no longer re-chords); a still chord is swept
// after two seconds. @INV
// Smart voices each chord as the inversion that moves the voices least from the previous one. A
// blue / violet chessboard on the chord pads, green on the octave pads, the bloom on layer 2 from
// the pad you hit. Knobs: @KEY, @SCALE, @INV, @BLOOMC, @VEL, and the Chord output's @CH and @TYPE
// (change 17B). Setup 798 / Timer 602 at the corner; restsBlack false. History:
// docs/entries/chorus.md (11-02, 12-09, 12.1-04, change 7, change 17B).
//
// MECHANISM
//   - The pad of cell n is `z=n%9//3+6-n//27*3`: z 0..2 the bottom row left to right, 3..5 the
//     middle, 6 the top-left; z 7 is Octave down (top row, columns 3..5) and z 8 Octave up
//     (columns 6..8). The bottom-left pad is the lowest chord, the user's "legmelyebb hang".
//   - Setup: the chord table `self.h[z]`, z 0..6, c[j+1] = @KEY + t[d%7+1] + d//7*12 for d =
//     z + j*2; `self.o` the octave shift (-2..2, 0 at boot); `self.n` the notes last sent (the I
//     chord's table at boot, so a first press of I under Smart is root position at distance 0
//     and any other first chord is voiced as if coming from I); `R=function(s,i)` the library's
//     release convention - IDEMPOTENT: it returns unless `s.c` is the contact being expired, sends
//     the three note-offs from `s.n`, clears s.z and s.c. `E` calls it on an end code, on a stale
//     press by another contact, on the Timer sweep and on EVERY onset including a first press.
//   - The callback: `local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not n or e~=4 and e<9
//     then return end` - THE LATCH (change 17B, section 18): only the onset edge (`e==4 or e>8`)
//     acts, so a cell change `Q` reports mid-gesture (a slide onto the next pad) moves nothing and
//     the finger keeps the chord it landed on; `G` still draws it. An octave pad moves `s.o` by
//     `glim(s.o+z*2-15,-2,2)` and returns - at +2 or -2 a further
//     press in that direction is refused, not clamped into a wrong shift; the sounding chord keeps
//     its notes. A chord pad: if z == s.z re-own (`s.c=i`) and return; if a chord is sounding,
//     `R(s,s.c)` FIRST; then the voicing: for k = -@INV..@INV build candidate c, voice j =
//     h[(j+k-1)%3+1] + ((j+k-1)//3 + s.o)*12 - k 0 root position, 1 and 2 the first and second
//     inversion above it, -1 and -2 the same two inversions an octave down (Lua's floored `//`
//     and `%` make the negative k land there), so each inversion is tried in the octave nearest
//     the previous chord; d = the sum over j of |c[j] - s.n[j]|, keep the least, a tie going to
//     root position (`d<m or d==m and k==0`) and otherwise to the lower k; the three note-ons
//     from the winner; s.z, s.c, s.n = the winner, and `s.b=z` asks the Timer for the bloom.
//     Under Off the loop is `for k=-0,0`: root position only.
//   - The Timer, `gtt(0,20)X(self,100)` first (one hundred calls at 20 ms is the two-second
//     window the private watchdog carried; the window is the CALLER's argument, library.ts
//     section 5). On its first call (`not s.q`) it paints the picture: layer 1 the chessboard on
//     the chord pads at phase 255 (`(n%9//3+n//27)%2`), green on the octave pads, layer 2
//     @BLOOMC at phase 0 on every cell. When `s.o` differs from the painted `s.q` it repaints the
//     octave pads' phase: `glim(40+(n%9//6*2-1)*s.o*100,40,240)` over cells 3..26 with n%9>2 -
//     the down pad 240 / 140 / 40 at -2 / -1 / 0 and 40 above, the up pad the mirror. Then the
//     bloom for `s.b` if one is asked: for every cell, w = glim(248 - sqrt(p*p+q*q)*12//4*4, 0,
//     248) from the pad's centre (u = z%3*3+1, v = 7-z//3*3), `glpfs(a,2,w,4,0)`,
//     `glt(a,2,(256-w)//4)`; `s.b=nil`. The picture, the indicator and the bloom are at most one
//     20 ms call behind the press; the notes are not.
//   - `Q` holds the cell with hysteresis and returns it only on a change or an onset; a pad
//     boundary is a cell boundary, so the hysteresis is zone hysteresis for free. `G` draws the
//     library's finger in WHITE on layer 0 (a literal, not a knob); `Q` before `G` because `Q`'s
//     `E` clears the block through `V`. A new press REPLACES the bloom: layer 2 is one field.
//
// WHAT IT SENDS (the Chord output since change 17B, its Type @TYPE: 144 a note, 176 a controller)
//   note-on   s:gms(@CH,@TYPE,b[j],@VEL,0) for j = 1..3, on a press on a new chord pad; b the
//             chosen voicing, root position under Off, the closest of five under Smart, every
//             note inside 16..109 by construction (48+4-12-24 at the bottom, 59+14+12+24 at
//             the top), so no clamp is needed and none is written.
//   note-off  s:gms(@CH,@TYPE*3//2-88,s.n[j],0,0) for j = 1..3, from `R` - before the new chord,
//             on a lift, on a stale press, on the sweep. The receiver never hears two triads
//             overlap. `@TYPE*3//2-88` is 128 under a note and 176 under a controller.
//   Under CC the chord's three note numbers are its three controllers, @VEL on and 0 off (the
//   Sandbox button's controller, three at a time). The output has no Number: the numbers are the
//   chord's (@KEY, the scale, the voicing, the octave shift). An octave pad sends nothing.
// WHAT IT RECEIVES (change 17B): nothing. A received note names no one pad - a chord's numbers move
//   with the voicing and the octave shift - so the Chord has no Receive, and the Setup assigns
//   `self.midirx_cb=nil`: a previous landing's callback never survives this one.
//
// TRAPS
//   - THE BLOOM USES THE COMPUTED DECAY FORM, AND IT MUST: the starting phase is per cell, so a
//     FIXED timeout cannot land it on zero (11-02, "colour stucks after touching it"). The rate
//     is 4, w is a multiple of 4 by construction (the spread is 12, three times the rate), w +
//     4*((256-w)/4) = 256 = 0 for every cell; glim holds w inside 0..248 so the timeout stays
//     inside 2..64 and is never the 0 that CANCELS a countdown. decay-idiom.spec.ts carries the
//     form, now in the TIMER.
//   - R IS IDEMPOTENT, and must stay so (above). It reads `s.n`, the notes actually sent, never
//     the table: an inversion or an octave shift would otherwise leave a note hanging.
//   - THE HANDLER IS THE SETUP'S, the picture the Timer's: a handler defined from the Timer would
//     miss a press before the first call (the VM presses before it ticks; a module could too).
//     What the Timer owns tolerates one call of lag; a note-on does not.
//   - THE ENTRY CARRIES NO EVENT-CODE GUARD OF ITS OWN beyond the octave pads' onset edge: the
//     live test is inside `Q`, and touch-guard.spec.ts REQUIRES a body with no chain of its own
//     to carry `Q(s,i,e,x,y)`.
//   - @CH AND @TYPE APPEAR TWICE, both in the Setup (the note-off in R, the note-on in the
//     callback), so the two cannot drift; the Timer carries no MIDI.
//   - LAYER 0 IS THE ALERT LAYER: `G` re-asserts white on every call; `glc(...,1)` forces the
//     min to 0.
//   - THE KNOB IDS `key`, `scale`, `bloomColour`, `velocity`, `channel` DO NOT MOVE; `bloomSpeed`
//     left at change 7 (the spread is the literal 12) and `inversion` arrived in its place, so
//     both captured CHORUS records in wild-stamps.json land `older` or `unreadable` by design
//     (stamp.spec.ts declares them).
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of every @BLOOMC value is 0..255.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";
import { onLattice } from "../lattice";
import { CHANNEL_VALUES, TRIGGER_STATUSES } from "../../tune/midi";

const SETUP =
  "--[[@cb]]local t={@SCALE}self.h={}for z=0,6 do local c={}for j=0,2 do local d=z+j*2 c[j+1]=@KEY+t[d%7+1]+d//7*12 end self.h[z]=c end self.o=0 self.n=self.h[0]R=function(s,i)if s.c==i then for j=1,3 do s:gms(@CH,@TYPE*3//2-88,s.n[j],0,0)end s.z=nil s.c=nil end end self.touch_cb=function(s,i,e,x,y)local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not n or e~=4 and e<9 then return end local z=n%9//3+6-n//27*3 if z>6 then s.o=glim(s.o+z*2-15,-2,2)return end if z==s.z then s.c=i return end if s.z then R(s,s.c)end local h,p,b,m=s.h[z],s.n,0,999 for k=-@INV,@INV do local c,d={},0 for j=1,3 do c[j]=h[(j+k-1)%3+1]+((j+k-1)//3+s.o)*12 d=d+math.abs(c[j]-p[j])end if d<m or d==m and k==0 then m,b=d,c end end for j=1,3 do s:gms(@CH,@TYPE,b[j],@VEL,0)end s.z=z s.c=i s.n=b s.b=z end self.midirx_cb=nil gtt(0,20)";

const TIMER =
  "--[[@cb]]gtt(0,20)X(self,100)local s=self if not s.q then for n=0,80 do local a=glag(0,n)local z=n%9//3+6-n//27*3 if z<7 then if(n%9//3+n//27)%2==0 then glc(a,1,0,60,120,1)else glc(a,1,80,40,140,1)end glp(a,1,255)else glc(a,1,0,180,60,1)end glc(a,2,@BLOOMC,1)glp(a,2,0)end end if s.o~=s.q then s.q=s.o for n=3,26 do if n%9>2 then glp(glag(0,n),1,glim(40+(n%9//6*2-1)*s.o*100,40,240))end end end local z=s.b if z then s.b=nil local u,v=z%3*3+1,7-z//3*3 for n=0,80 do local p,q=n%9-u,n//9-v local w=glim(248-math.sqrt(p*p+q*q)*12//4*4,0,248)local a=glag(0,n)glpfs(a,2,w,4,0)glt(a,2,(256-w)//4)end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const CHORUS: CatalogEntry = {
  id: "chorus",
  name: "Chorus",
  description:
    "Seven chord pads, the lowest at the bottom-left, two octave pads, and a warm bloom from the pad you hit.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  tags: ["play", "playable", "expressive"],
  featured: true,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),
  // Change 7 (2026-09-18): the card offers no Randomize and no lock; the inspector reads this.
  rollable: false,

  // Seven knobs - six and, since change 17B, the Chord output's Type (the cap, D-12, counts a
  // card's knobs outside its outputs) - each one literal token substitution (TUNE-01); every
  // default is the INDEX of the value that reproduces the canonical text.
  knobs: [
    {
      id: "key",
      label: "Key",
      kind: "note",
      token: "@KEY",
      // The MIDI note of the first degree: the twelve chromatic roots C3..B3 (change 7). Twelve
      // is past the word row, so the knob is a rail whose readout is the note's name.
      values: [
        "48",
        "49",
        "50",
        "51",
        "52",
        "53",
        "54",
        "55",
        "56",
        "57",
        "58",
        "59",
      ],
      default: 0,
    },
    {
      id: "scale",
      label: "Scale",
      kind: "scale",
      token: "@SCALE",
      // Seven semitone offsets, one per degree; the builder reads t[d%7+1] + d//7*12, so any
      // seven-note table works. Major first.
      values: [
        "0,2,4,5,7,9,11",
        "0,2,3,5,7,8,10",
        "0,2,3,5,7,9,10",
        "0,2,4,5,7,9,10",
        "0,2,4,6,7,9,11",
        "0,1,3,5,7,8,10",
      ],
      default: 0,
    },
    {
      id: "inversion",
      label: "Smart inversion",
      kind: "mode",
      token: "@INV",
      // The upper bound of the voicing loop: 0 tries root position only, 2 tries all three
      // inversions and keeps the one closest to the previous chord. Worded Off / Smart by
      // view.ts's INVERSION_WORDS. Off first, the default.
      values: ["0", "2"],
      default: 0,
    },
    {
      id: "bloomColour",
      label: "Bloom colour",
      kind: "colour",
      token: "@BLOOMC",
      // Layer 2's colour. Every channel inside 0..255: the firmware truncates rather than clamps.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice([
        "255,200,80",
        "255,60,0",
        "0,255,200",
        "120,0,255",
        "255,255,255",
      ]),
      default: 0,
    },
    {
      id: "velocity",
      label: "Velocity",
      kind: "amount",
      token: "@VEL",
      // Sent on all three notes of the triad; the note-off is always velocity zero.
      values: ["40", "70", "100", "127"],
      default: 2,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, the first argument of gms (zona-docs/docs/ZONA_RECIPES.md:1058); the rows read
      // it 1..16 (change 17B). TWICE, both in the Setup - the note-off inside R and the note-on in
      // the callback. The Chord output's Channel.
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "midiType",
      label: "MIDI type",
      kind: "mode",
      token: "@TYPE",
      // The Chord output's type (change 17B): the status byte - 144 a note, 176 a controller - on
      // the three note-ons; the off is @TYPE*3//2-88 (a note-off, or the controller at 0).
      // Appended last so a record's older indices land on the knobs they were.
      values: TRIGGER_STATUSES,
      default: 0,
    },
  ],

  // The one output (change 17B): the Chord, a trigger - its Type and Channel. No Number (the
  // numbers are the chord's) and no Receive (docs/entries/chorus.md "Change 17B").
  outputs: [
    {
      id: "chord",
      name: "Chord",
      kind: "trigger",
      tokens: { type: "@TYPE", channel: "@CH" },
    },
  ],

  // The same seven indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    key: 0,
    scale: 0,
    inversion: 0,
    bloomColour: 0,
    velocity: 2,
    channel: 0,
    midiType: 0,
  },

  // FALSE: the chessboard and the octave pads are lit from the Timer's first call at 20 ms, so
  // tick 0 is dark and every later sampled tick is lit. frames.spec.ts checks it.
  restsBlack: false,
};
