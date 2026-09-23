# NINE PADS - the history behind src/lib/catalog/entries/ninepads.ts

NINE PADS is sixteen (or nine) drum pads drawn on the lights, each one a note, the pad you hold lit
up: the ported BOTOR preset, rebuilt by hand on 2026-09-23 (change 17C, `BENCH-2026-09-16.txt`
sections 17 and 18) so a finger keeps the pad it landed on, a fast tap plays its pad, and the pads are
one MIDI output that receives. Its source is `src/lib/catalog/entries/ninepads.ts`; the preset stays
on the shelf in `src/lib/catalog/presets.ts` untouched, reached through `portedEntry("ninepads")`, and
the vendored compiler is untouched.

## The ask

Section 17: every element that sends MIDI gets a Type, a Channel and a Number per output, and receives
by default; 17C's brief named NINE PADS "nine pads or one bank with a base note". Section 18's rule -
a contact keeps the control it landed on - audited on every card with side-by-side controls; the brief:
"NINE PADS' pads - a slide re-triggering pads is the fault to fix unless it is plainly the design".

## The preset it replaces, verbatim

`preset("ninepads", "Nine pads", ..., ["colour", "note", "scale", "amount", "count"], look none,
touch none, sends zones 4x4, showGrid, fingers each, cost 565 / 158)`. Its knobs: Colour (the RGB444
lattice, the grid colour), Notes (24 36 48 60), Scale (chromatic, major, minor, pentatonic), Channel
(1..16), Pads (9 / 16). Compiled at its defaults:

```lua
--[[@cb#z.pninepads]] for n=0,80 do local a=glag(0,n)glc(a,1,0,68,204,1)if n%9%2==1 and n//9%2==1 then glp(a,1,255)else glp(a,1,0)end glc(a,2,255,136,34,1)glp(a,2,0)end self.n={}self.p={}self.touch_cb=function(s,i,e,x,y)local n=N(x,y)local z=n%9*4//9+n//9*4//9*4 if e==3 or e>=5 then z=nil end local o=s.n[i]if o~=z then if o then s:gms(0,128,36+o,0,0)end if z then s:gms(0,144,36+z,100,0)end s.n[i]=z if o then glp(glag(0,o%4*2+o//4*18+10),2,0)end if z then glp(glag(0,z%4*2+z//4*18+10),2,255)end end if e==3 or e>=5 then s.p[i]=nil else s.p[i]=0 end end gtt(0,20)
```

```lua
--[[@cb#z.t]] gtt(0,20)local s=self for i,t in pairs(s.p)do s.p[i]=t+1 if t>100 then if s.n[i]then s:gms(0,128,36+s.n[i],0,0)s.n[i]=nil end s.p[i]=nil end end
```

At 3x3 the compiler paints a checkerboard of the colour and its two-fifths (`dim(c,2,5)`), every cell
lit, and a held zone lights its nine cells; at a scale other than chromatic it bakes the zone notes into
`self.m`. Read: the zone is re-read on EVERY sample (`local z=...N(x,y)...`), and `o~=z` sends the old
pad's off and the new one's on - the compiler's own words for it are "legato for free". And a fast
tap (code 9) is an end, so `z` is nil and nothing is sent: lua-smoke.spec.ts's PRESET_PARITY_ALLOWANCES
recorded it at plan 11-04 as "NINEPADS IS A FINDING, NOT A FIX" - the fix is a shape change D-02 did
not grant the vendored compiler.

## The route, and the design question

The slide's re-trigger is the compiler's stated design, which is the brief's "unless it is plainly the
design". It is latched anyway, for the reason CHORUS's slide was at 17B: section 18's rule is the
user's word over every card with side-by-side controls, and 17B's decided questions kept it on CHORUS
("the user's latch word covers it; a glide can come back on request"). A glide option is the question
this card leaves (the Done paragraph).

The latch is what the visitor sees, so the card is rebuilt by hand, RADAR's route: a wrapped `padsim`
card's preview is the vendored PadSim running the pad-under-the-finger rule and would still re-trigger
while the module latched. The card leaves the front-door ring (five there now).

## What the rebuild is

- **Both grids and every scale in one text.** The grid `G` is `@PADS>9 and 4 or 3`; the zone of LED n
  is `n%9*G//9+n//9*G//9*G` (at 3, `n%9*3//9` is `n%9//3`); the highlight `L(q,w)` lights zone q's
  marker cell at 4x4 and its nine cells at 3x3; the picture - painted by the Timer body the Setup pulls
  in, once per install - is the compiled one at both grids. A pad's note `P(z)` is the scale's degree
  list laid from the Number up, capped at 127: the compiler's zoneNotes for every scale, `B+z` at the
  chromatic twelve.
- **The latch** (`s.z[i]`): the pad is pinned on the onset, never re-read.
- **The fast tap** plays: `D(s,i,z)` then `D(s,i)`, the note-on and the note-off in one callback.
- **The watchdog**, the compiled Timer's, armed on a held pad and lapsing when none is held - the
  compiled preset armed its 20 ms Timer forever, and an armed Timer reads as motion to the preview; the
  card rests still, as `frames.json` says.
- **One output**, Pads - a bank: a per-pad Number would fight the Scale knob, which lays the notes.
  Type Note (on at velocity 100, off 128 / 0) or CC (the pad's note number as a controller, 100 on and 0
  off); Channel; Number the lowest pad's note; Receive.
- **The receive**: a host note-on whose number is a pad's note lights that pad; its note-off (or a
  note-on at 0) darkens it; under CC a controller of a pad's number, above 0 on, 0 off. Nothing is sent
  back.

## The divergences from the preset, D-14 style

1. **The latch** - a slide plays nothing new (the compiler's legato overruled, as CHORUS's was).
2. **The fast tap** plays its pad - the one change to the defaults' wire, and a fix.
3. **The watchdog's Timer** is armed only while a pad is held.
4. **The colour knob** is five named colours, the preset's 0,68,204 first, where the lattice was (RADAR's
   divergence 1); `C` is a palette for the brightness scaler (`brightness.ts` ENTRY_SITES).
5. **The knobs** keep the preset's ids and rack positions: Notes is the output's Number (0..127, the four
   old C's first), Channel the output's Channel (the sixteen in order), Scale the degree list (the
   pentatonic words as Major pentatonic, the chromatic twelve as Chromatic, `view.ts`), Pads 9 / 16;
   Type and Receive are appended.
6. **The stamp**: the preset's vendored links and `#z.pninepads` land `unreadable` (format `w` now).
7. **`addedAt`** 2026-09-23; **the front door**: off the ring (position 3).

## Costs

Setup 749 of 908 at the defaults, 752 at the RGB444 picker corner and the dearest literals (156 free);
Timer 759 / 764. The preset was 565 / 158. A first draft with the grid and the receive in the Setup
measured 1,188 - why the Timer paints and makes the receive, pulled in.

## The VM cases (`lua-smoke.spec.ts`, "NINE PADS (rebuilt by hand)")

- Against the shelf preset compiled in the same VM, at both grids and all four scales: the same frames
  from rest through slow taps on four pads and two pads held at once, and the same messages.
- At rest no Timer armed. The latch: a finger landing on pad 0 and sliding across pads 1 and 2 sends
  36 on and off only; the shelf preset sends 36, 37 and 38 on and off. The fast tap: `41 on, 41 off` in
  one callback, the highlight gone. The watchdog: a silent held pad's note-off after 100 runs, the Timer
  lapsing after.
- A controller bank on channel 3 from 60 in a major scale: pad 8 sends controller 74 at 100 and 0; the
  receive lights pad 8's marker and darkens it at 0; another channel, a neighbour's traffic, a note under
  CC and no pad's number change nothing; nothing sent back; a previous landing's callback never answers.
  A note bank receiving its note-off darkens its pad; Receive Off hears nothing.

## Change 17C's record

The Done paragraph "17C" under `BENCH-2026-09-16.txt` section 17 has the per-card table. Audition row 46
asks the bench what the VM cannot: whether a real fast tap reaches the module as one DOWNUP (code 9),
whether a slide keeps its contact id, and host MIDI at the touch element (row 40).
