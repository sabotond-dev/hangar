// TRACKPAD COMET - the Trackpad's recipe, every gesture kept, and a comet under the finger
// instead of the edge flash: the bilinear finger as the head, the cells it crosses fading behind it.
//
// The Setup is TRACKPAD's, byte for byte (lua-smoke.spec.ts compares the two strings): the
// vendored trackpad recipe plus `s.u,s.v=f,h`, unread here. Only the Timer differs: on every
// call while the recipe holds a contact, the library's `G` draws the finger on layer 0 and `D`
// re-arms the nearest cell on layer 1 through `N` - GHOST's comet shape - so a moving finger
// leaves a trail at full length at any speed and a still one holds a lit head. Knobs, all in the
// Timer: @C, @H, @T, @S. Setup 903 of 908 at every knob state (5 free), Timer 443 at the picker
// corner (440 at the defaults); restsBlack true. No MIDI: the Timer assigns `s.midirx_cb=nil`
// on every call (change 17B - the Setup, TRACKPAD's byte for byte, has 5 free; a previous
// landing's receive callback never survives this one). Asked 2026-09-17 (BENCH-2026-09-16.txt section
// 4); the name is provisional, the user's to set.
//
// MECHANISM
//   - Setup: TRACKPAD's, unchanged - see that file's MECHANISM for the pointer, the two-finger
//     scroll, the tap, the right-click, the drain, the hold-off and the idle reset. What this
//     Timer reads of it: `s.p` (the live contacts, `{x,y}` hi-res per id), `s.n` (their count),
//     `s.q` (the quiet-call counter the recipe resets on every sample).
//   - The Timer, `gtt(0,20)` first: the recipe's release and safety release, the trail colour
//     written once over all 81 cells of layer 1 on the first call (`if not s.i`). Then
//     `k=s.q<26 and(@S or s.n<2)` decides whether contacts are drawn this call: every block in
//     the library's `B` whose contact is not drawn is cleared through `V`; then, for every
//     contact in `s.p`, `G(s,i,1,x,y,0,@H)` draws the bilinear finger on layer 0 in the head
//     colour (a move code, so `G` clears the previous block and draws the fresh one) and
//     `D(N(x,y),1,@T*6)` re-arms the nearest calibrated cell on layer 1 at `@T*6` - the
//     hi-res coordinate over eight is the raw sensor value the knot tables were measured in.
//   - THE TRAIL IS WHOLE CELLS ON PURPOSE: a cell the finger leaves keeps its last full arm and
//     decays from it over @T ticks whatever the finger's speed. Measured first with the
//     library's `K` alone, as the brief proposed: a stamp re-written every call at the cell's
//     falling weight dims a cell the finger is leaving to its last small start, so a slow
//     finger left almost no trail. The head's softness is `G`'s job on the other layer; the
//     layers add in the firmware's mix, so the head reads brighter than the trail.
//   - `s.q<26` is the recipe's own idle window: after 25 quiet Timer calls the recipe forgets the
//     gesture on the next sample (`s.q>25`), so the head is cleared and the trail fades at the
//     same moment, and a lost lift fades out rather than glowing forever. A real finger wobbles
//     on every sample (probe Q1), so a held finger never reaches the window.
//   - `@S`: `true` draws every contact, so a two-finger scroll leaves two trails; `false` keeps
//     the comet to the single-finger pointer (`s.n<2`), as TRACKPAD's flash is.
//
// WHAT IT SENDS
//   Exactly what TRACKPAD sends - the Setup is the same string: gmms(1,dx) gmms(2,dy) pointer
//   motion clamped to +-63, gmms(3,-d) scroll notches, gmbs(1,1) / gmbs(2,1) a click on lift and
//   gmbs(3,0) the release. lua-smoke.spec.ts asserts the wire identical to TRACKPAD's for the
//   same gestures. Recorded by the host's recordHid and inert in the browser.
//
// TRAPS
//   - THE SETUP HAS FIVE CHARACTERS FREE AND NO KNOB TOKEN IN IT; every knob is in the Timer,
//     so the sweep's worst corner is a Timer figure. `s.u,s.v=f,h` is carried unread: dropping
//     it would make the Setup a second recipe to keep in step.
//   - EVERY TRAIL START IS A MULTIPLE OF SIX BY CONSTRUCTION (`@T*6`), so every cell lands on
//     phase 0 through `D`; 42 / 31 / 21 ticks are all inside `D`'s 42-tick ceiling.
//     decay-idiom.spec.ts cannot see a `D(` call - lua-smoke.spec.ts's walk to black is the gate.
//   - `G` FROM THE TIMER, NOT THE CALLBACK: the library's finger is normally drawn on the
//     contact's own event; here it is drawn with a move code on every call and its block is
//     cleared by this Timer's own sweep over `B` when the contact is gone, or not drawn. No
//     `Q`, `X` or `E` runs here, so nothing else ever clears `B`.
//   - LAYER 0 IS THE ALERT LAYER: `G` re-asserts @H on every call, so an alert's recolour
//     heals on the next call; `glc(...,1)` forces the min to 0, so the black rest frame holds.
//   - THE TOUCH-GUARD ROWS are the recipe's three, declared for this id in touch-guard.spec.ts
//     with the same reason as TRACKPAD's (a code 9 is registered by the onset test first and
//     ended by the same pass). Nothing here is built on code 9. The recipe has no `Q`, so the
//     Q-then-G order of 12.1 does not arise.
//   - TOKEN PREFIX CHECK: @C, @H, @T, @S - none is a prefix of another.
//   - NOTHING HERE IS HARDWARE-VERIFIED beyond the recipe's gestures; the comet goes to the
//     bench as row 29 in docs/HARDWARE-AUDITION.md.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";
import { onLattice } from "../lattice";

const SETUP =
  "--[[@cb]]self:txma(1023)self:tyma(1023)gmbs(3,0)self.r=0 local function z(s)s.p={}s.n=0 s.k=0 s.m=0 s.w=0 s.j=0 s.q=0 end z(self)self.touch_cb=function(s,i,e,x,y)if s.q>25 then z(s)end s.q=0 local o,g,f,h=true,0,0,0 while o and g<24 do g=g+1 local c,t=s.p[i],e==3 or e>=5 if e==4 or e>7 or not c and not t then if not c then s.n=s.n+1 s.k=glim(s.k,s.n,9)end c={x,y}s.p[i]=c s.j=4 end if t then if c then s.p[i]=nil s.n=s.n-1 s.j=4 if s.n<1 then if s.r<1 and e>4 and s.m<s.k*120 then gmbs(glim(s.k,1,2),1)s.r=4 end gtt(0,20)z(s)end end else local u,v=x-c[1],y-c[2]c[1]=x c[2]=y s.m=s.m+math.abs(u)+math.abs(v)if s.n>1 then s.w=s.w+v else f=f+u h=h+v end end o=s:touch_pop()i=s:tid()e=s:tev()x=s:txv()y=s:tyv()end if s.j>0 then s.j=s.j-1 elseif s.n>1 then local d=(s.w+64)//128 if d~=0 then s.w=s.w-d*128 s.m=999 gmms(3,-d)end else gmms(1,glim(f,-63,63))gmms(2,glim(h,-63,63))s.u,s.v=f,h end end gtt(0,20)";

const TIMER =
  "--[[@cb]]gtt(0,20)local s=self s.midirx_cb=nil if s.n then if s.r>0 then s.r=s.r-1 if s.r<1 then gmbs(3,0)end end s.q=s.q+1 if s.q==100 then gmbs(3,0)end if not s.i then s.i=1 for n=0,80 do glc(glag(0,n),1,@C,1)end end local k=s.q<26 and(@S or s.n<2)for i,o in pairs(B)do if not(k and s.p[i])then V(o)B[i]=nil end end if k then for i,c in pairs(s.p)do local x,y=c[1]//8,c[2]//8 G(s,i,1,x,y,0,@H)D(N(x,y),1,@T*6)end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const TRACKPAD_COMET: CatalogEntry = {
  id: "trackpad-comet",
  name: "Trackpad comet",
  description:
    "One finger moves the pointer, two fingers scroll, a tap clicks, and a comet trail fades behind your finger.",
  // TRACKPAD's three: `still` is true of a card that paints nothing until it
  // is touched, `precise` is ten-bit relative motion, `pointing` is what it
  // is for.
  tags: ["pointing", "precise", "still"],
  featured: false,
  addedAt: "2026-09-17",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Four knobs, every one in the Timer. Defaults reproduce the canonical text.
  knobs: [
    {
      id: "colour",
      label: "Trail colour",
      kind: "colour",
      token: "@C",
      // Written once over layer 1 by the Timer's first call. The picker can
      // reach any RGB444 literal; the sweep gates 255,255,255.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice(["214,255,78", "255,255,255", "0,200,255", "255,170,0"]),
      default: 0,
    },
    {
      id: "head",
      label: "Head colour",
      kind: "colour",
      token: "@H",
      // The finger itself, through `G` on layer 0, re-asserted every call.
      // The same lime as the trail by default; white is the classic comet.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice(["214,255,78", "255,255,255", "0,200,255", "255,170,0"]),
      default: 0,
    },
    {
      id: "tail",
      label: "Tail length",
      kind: "speed",
      token: "@T",
      // Ticks of ten milliseconds for a cell the finger left to reach black:
      // 42 is `D`'s ceiling (w = 252), 21 is half of it. The literal is the
      // tick count, as TRACKPAD's fade knob has it; `*6` in the Lua makes the
      // start a multiple of six by construction.
      values: ["42", "31", "21"],
      default: 0,
    },
    {
      id: "scroll",
      label: "Comet on scroll",
      kind: "mode",
      token: "@S",
      // `true` draws every contact, so a two-finger scroll draws two comets;
      // `false` keeps the comet to the single-finger pointer, as TRACKPAD's
      // flash is. The literal is Lua's own boolean, so the panel shows the word.
      values: ["true", "false"],
      default: 0,
    },
  ],

  defaults: {
    colour: 0,
    head: 0,
    tail: 0,
    scroll: 0,
  },

  // TRUE. Nothing is lit until a finger lands, the head is cleared when it
  // goes and the trail decays to exact black. frames.spec.ts test 5 checks
  // the declaration against the fixture, and src/lib/sim/demo.ts gives the
  // card a demonstration drag so its picture shows the comet rather than a
  // black square (D-09).
  restsBlack: true,
};
