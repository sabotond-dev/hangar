// TRACKPAD - the vendored trackpad recipe, every gesture kept, and the edges flash in the
// direction the finger moves. The flash is a tune option.
//
// The Setup is the vendored trackpad recipe (`_pad.ts:2241-2311`, `trackpadSetup`, hardware-
// tested) at the preset's own defaults plus eleven characters (`s.u,s.v=f,h`, the net delta
// stored for the Timer); the flash lives in the Timer because no Setup-side shape fits beside
// the four gestures. One card, the look chosen in its tune panel, an off state that is the plain
// trackpad (the user's "as is, selectable tuning options under Trackpad"). Knobs, all in the
// Timer: @FX (true / false), @C, @N, @T. Setup 903 of 908 at every knob state (5 free), Timer 526
// at the picker corner (524 at the defaults); restsBlack true. The id is `trackpad`, not `tpad`.
// No MIDI: the Timer assigns `s.midirx_cb=nil` on every call (change 17B - the Setup has 5 free;
// a previous landing's receive callback never survives this one).
// History: docs/entries/trackpad.md (the bench line, 12-06, 12-10, 12-12, 12.1-04 measurements;
// change 17B).
//
// MECHANISM
//   - Setup: `txma(1023) tyma(1023)` (both axes, as the recipe has them), `gmbs(3,0)` at load,
//     `local function z(s)` the reset of seven fields (the recipe's `self.z` made a local: a
//     `self:` method the host's SELF_PRELUDE does not install is refused by host-surface.spec.ts).
//     The handler: an idle reset after 25 quiet Timer calls (`s.q`, which recovers a lost lift);
//     a 24-deep drain loop over `touch_pop`; per contact, an onset (`e==4 or e>7 or not c and
//     not t`) registers it and sets the four-sample pointer hold-off `s.j`; an end (`e==3 or
//     e>=5`) drops it and, on the last lift, clicks if the travel per finger was under 120
//     (`gmbs(glim(s.k,1,2),1)` - button 2 if two fingers were seen; `s.r=4` for the release),
//     `gtt(0,20)`, reset; a move accumulates travel, the vertical into `s.w` with two fingers,
//     the deltas into `f, h` with one. After the drain: while `s.j>0` nothing is sent; with two
//     fingers a scroll notch per 128 units (`gmms(3,-d)`, biased by half a unit); with one,
//     `gmms(1,glim(f,-63,63)) gmms(2,glim(h,-63,63))` and `s.u,s.v=f,h`.
//   - The Timer, `gtt(0,20)` first: release the click four calls later (`gmbs(3,0)`), a safety
//     release at 100 quiet calls, the colour written once over all 81 cells of layer 1 on the
//     first call (`if not s.i`). Then the flash, `if @FX and s.u and s.n<2`: the direction is
//     the dominant axis of the net delta, sign included (`h*h>f*f` vertical, `u>0` the far
//     edge); `f*f+h*h>2` is the dead band (a resting finger wobbles one unit); the edge is
//     centred on the finger's OTHER coordinate through the measured map, `(U(c//8,K)+32)//64`
//     (`N` per axis; `c//8` is the hi-res to sensor step); the cells fall off from the centre by
//     the quadratic `@T*(16-k*k)//16*6` through the library's `D`, `glim(o+k,0,8)` clipping at
//     the pad's edge. A two-finger scroll does not flash; the hold-off suppresses the flash.
//
// WHAT IT SENDS
//   HID, not MIDI: gmms(1,dx) gmms(2,dy) pointer motion, each clamped to +-63; gmms(3,-d) scroll
//   notches; gmbs(1,1) / gmbs(2,1) a click on lift and gmbs(3,0) the release. Recorded by the
//   host's recordHid and inert in the browser.
//
// TRAPS
//   - THE SETUP HAS FIVE CHARACTERS FREE AND NO KNOB TOKEN IN IT; every knob is in the Timer,
//     so the sweep's worst corner is a Timer figure.
//   - EVERY FLASH VALUE IS A MULTIPLE OF SIX BY CONSTRUCTION (the `*6` is the last operation),
//     so every one lands on phase 0 through `D` and all twelve (fade 42 / 31 / 21 by k = 0..3)
//     are inside `D`'s 42-tick ceiling. decay-idiom.spec.ts cannot see this flash - it reads
//     literal glpfs / glt pairs - so lua-smoke.spec.ts's phase walk is the gate for this card.
//   - THE TOUCH-GUARD ROWS: `e==3 or e>=5`, `e>4` and `e==4 or e>7` are the recipe's and are
//     correct because of the order around them (a code 9 is registered by the onset test first
//     and ended by the same pass); all three are in touch-guard.spec.ts's DECLARED_EXCEPTIONS.
//   - THE SHAPE CHARACTER IS `8` (4 knobs, 12 options) and the format `w`; every stamp minted
//     under it restores for as long as no knob is resized.
//   - TOKEN PREFIX CHECK: @FX, @C, @N, @T - none is a prefix of another.
//   - NOTHING HERE IS HARDWARE-VERIFIED beyond the recipe's gestures; the flash goes to the
//     bench as a row in docs/HARDWARE-AUDITION.md.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]self:txma(1023)self:tyma(1023)gmbs(3,0)self.r=0 local function z(s)s.p={}s.n=0 s.k=0 s.m=0 s.w=0 s.j=0 s.q=0 end z(self)self.touch_cb=function(s,i,e,x,y)if s.q>25 then z(s)end s.q=0 local o,g,f,h=true,0,0,0 while o and g<24 do g=g+1 local c,t=s.p[i],e==3 or e>=5 if e==4 or e>7 or not c and not t then if not c then s.n=s.n+1 s.k=glim(s.k,s.n,9)end c={x,y}s.p[i]=c s.j=4 end if t then if c then s.p[i]=nil s.n=s.n-1 s.j=4 if s.n<1 then if s.r<1 and e>4 and s.m<s.k*120 then gmbs(glim(s.k,1,2),1)s.r=4 end gtt(0,20)z(s)end end else local u,v=x-c[1],y-c[2]c[1]=x c[2]=y s.m=s.m+math.abs(u)+math.abs(v)if s.n>1 then s.w=s.w+v else f=f+u h=h+v end end o=s:touch_pop()i=s:tid()e=s:tev()x=s:txv()y=s:tyv()end if s.j>0 then s.j=s.j-1 elseif s.n>1 then local d=(s.w+64)//128 if d~=0 then s.w=s.w-d*128 s.m=999 gmms(3,-d)end else gmms(1,glim(f,-63,63))gmms(2,glim(h,-63,63))s.u,s.v=f,h end end gtt(0,20)";

const TIMER =
  "--[[@cb]]gtt(0,20)local s=self s.midirx_cb=nil if s.n then if s.r>0 then s.r=s.r-1 if s.r<1 then gmbs(3,0)end end s.q=s.q+1 if s.q==100 then gmbs(3,0)end if not s.i then s.i=1 for n=0,80 do glc(glag(0,n),1,@C,1)end end if @FX and s.u and s.n<2 then local f,h=s.u,s.v s.u=nil if f*f+h*h>2 then for _,c in pairs(s.p)do local u,p,q,o=f,1,9,(U(c[2]//8,KY)+32)//64 if h*h>f*f then u,p,q,o=h,9,1,(U(c[1]//8,KX)+32)//64 end for k=-(@N//2),@N//2 do D((u>0 and 8 or 0)*p+glim(o+k,0,8)*q,1,@T*(16-k*k)//16*6)end end end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const TRACKPAD: CatalogEntry = {
  id: "trackpad",
  name: "Trackpad",
  description:
    "One finger moves the pointer, two fingers scroll, a tap clicks, and the edge you move toward lights up.",
  // The preset's three, unchanged: `still` is true of a card that paints nothing until it is
  // touched, `precise` is ten-bit relative motion, `pointing` is what it is for.
  tags: ["pointing", "precise", "still"],
  featured: false,
  addedAt: "2026-09-11",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Four knobs, every one in the Timer. Defaults reproduce the canonical text.
  knobs: [
    {
      id: "flash",
      label: "Edge flash",
      kind: "mode",
      token: "@FX",
      // `false` is the plain trackpad: the Timer never paints, and the card
      // is the vendored preset's gestures with nothing else. The literal is
      // Lua's own boolean, so the panel shows the word.
      values: ["true", "false"],
      default: 0,
    },
    {
      id: "colour",
      label: "Flash colour",
      kind: "colour",
      token: "@C",
      // Written once over layer 1 by the Timer's first call. The picker can
      // reach any RGB444 literal; the sweep gates 255,255,255.
      values: ["214,255,78", "255,255,255", "0,200,255", "255,170,0"],
      default: 0,
    },
    {
      id: "reach",
      label: "Flash width (cells)",
      kind: "size",
      token: "@N",
      // The number of cells lit along the edge, centred on the finger. The
      // loop runs `-(@N//2)..@N//2`, so the literal IS the cell count.
      values: ["3", "5", "7"],
      default: 1,
    },
    {
      id: "fade",
      label: "Fade length",
      kind: "speed",
      token: "@T",
      // Ticks of ten milliseconds for the centre cell to reach black: 42 is
      // `D`'s ceiling (w = 252), 21 is half of it. The neighbours are shorter
      // by the quadratic, and every value is a multiple of six by
      // construction.
      values: ["42", "31", "21"],
      default: 0,
    },
  ],

  defaults: {
    flash: 0,
    colour: 0,
    reach: 1,
    fade: 0,
  },

  // TRUE. Nothing is lit until a finger moves, and the flash decays to exact
  // black. frames.spec.ts test 5 checks the declaration against the fixture,
  // and src/lib/sim/demo.ts gives the card a demonstration drag so its picture
  // shows the edge rather than a black square (D-09).
  restsBlack: true,
};
