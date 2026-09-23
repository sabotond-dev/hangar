# FOUR FADERS - the history behind src/lib/catalog/entries/faders.ts

FOUR FADERS is four faders side by side, each a white rail with a coloured level: the ported BOTOR
preset, rebuilt by hand on 2026-09-23 (change 17C, `BENCH-2026-09-16.txt` sections 17 and 18) so a
finger keeps the fader it landed on and so each fader is its own MIDI output that receives. Its source
is `src/lib/catalog/entries/faders.ts`; the preset it replaces stays on the shelf in
`src/lib/catalog/presets.ts` untouched, reached through `portedEntry("faders")`, and the vendored
compiler in `src/vendor/botor/_pad.ts` is untouched. The entry's own header carries the mechanism,
the wire and the traps; the ask, the preset's compiled strings, the route, the divergences, the costs,
the VM cases and the stamp are below.

## The ask

Section 18: "Imagine that you are sliding a fader and you touch another fader by accident then that
second fader should not react to the touch but keep controlling the first fader" - and, asked where,
"i saw it on the faders config in playground". Section 17: every element that sends MIDI gets a Type,
a Channel (all sixteen) and a Number per output, and receives by default. Part 17C took the seven
ported presets.

## The preset it replaces, verbatim

HANGAR's shelf declaration (`presets.ts`): `preset("faders", "Four faders", ..., "instruments",
["note", "amount"], sends faders 4, layout rails, showGrid, phase held, cost 525 / 24)`, carrying the
touch library's knots (12.1-08b). Its knobs (`knobs.preset.ts`): Send (`SEND_OPTIONS`, twelve CC bases
16 to 80) and Channel (1..16). Compiled at its defaults:

```lua
--[[@cb#z.pfaders]] for n=0,80 do local a=glag(0,n)local c=n%9 if c%2==1 then local f=c//2 glc(a,1,f*85,255-f*20,255-f*85,1)glc(a,2,f*85,255-f*20,255-f*85,1)glp(a,1,0)glp(a,2,0)else glc(a,1,255,255,255,1)glc(a,2,255,255,255,1)glp(a,1,255)glp(a,2,255)end end self.touch_cb=function(s,i,e,x,y)if e==1 or e==4 or e>8 then local f=N(x,y)%9*4//9 local v=127-y s:gms(0,176,16+f,v,0)local l=(v+1)*9//128 for n=0,80 do if n%9==f*2+1 then local w=(8-n//9)<l and 255 or 0 local a=glag(0,n)glp(a,1,w)glp(a,2,w)end end end end gtt(0,3e5)
```

```lua
--[[@cb#z.t]] gtt(0,3e5)
```

The fault, read in the first callback: `local f=N(x,y)%9*4//9` - the fader is the one under the
finger ON EVERY SAMPLE, so a finger sliding past a fader's edge drives the next one (the compiler's own
comment: "every sample sets whichever fader its x falls in"). The VM proves it: one finger landing on
fader 1 and sliding across to fader 3 sends controllers 16, 17 and 18 from the shelf preset.

## The route: rebuilt by hand, not wrapped

17C's brief offered two routes per card: wrap the compiled pair on HANGAR's side and keep the card
`padsim` (it stays on the front door's ring), or rebuild it as a hand-authored Lua card as RADAR was
(change 12b). The five cards whose sends are the only change took the first
(`src/lib/catalog/entries/ported-midi.ts`). FOUR FADERS could not: the fix IS the latch, and a wrapped
card's browser preview is the vendored PadSim running the PadState - the fader-under-the-finger rule -
so the preview would still slide from fader to fader while the module latched. The user saw the fault
"in playground"; a preview still showing it would be a lie about the one thing asked for. A Lua card's
preview runs its Lua. The card leaves the front-door ring (a Lua row would load the Lua VM on the front
page's first paint): six there, then five when NINE PADS followed.

## What the rebuild is

- **The picture, verbatim**: the compiled loop - odd columns the four faders (`f*85,255-f*20,255-f*85`,
  dark), even columns the white rails, lit - so `frames.json`'s `faders` block did not move, and the
  OG image did not either.
- **The latch** (`s.g[i]`): the contact's fader is pinned on its onset (`e==4 or e>8`, or a live
  sample from a contact with no pin - an onset the module lost) by the compiled rule, and every later
  sample of that contact drives the pinned fader with its own height; the release
  (`e==3 or e>=5 and e<9`) clears the pin, and a fast tap's pin waits for the next onset on its id.
- **Four outputs**, Fader 1..4: `T`, `C`, `U` tables of the four Types, Channels and Numbers, one send
  `s:gms(C[f+1],t,t==208 and v or t>223 and 0 or U[f+1],t==208 and 0 or v)`.
- **The receive**, made by the Timer body the Setup pulls in (`s:tim()`, 17B): a host message on a
  fader's output paints its bar (`B`, the compiled painter, published as `s.b`).
- **No Timer armed**: the preset re-armed a 300 s keeper that kept nothing alive on this card; an armed
  Timer reads as motion to the preview (17B), so both events arm nothing.

## The divergences from the preset, D-14 style

1. **The latch** - the fault fixed: a slide keeps its fader.
2. **The knobs.** Send and Channel became fader 1's Number and Channel, by id and in their rack
   positions (a saved copy's positions land on them): the Number is 0..127 with the twelve old rungs
   first in their order, the Channel the sixteen in order (index i is still channel i + 1). Each other
   fader has its own Type, Channel and Number, and every fader a Receive.
3. **The Timer** arms nothing (above).
4. **The stamp.** A Lua card reads HANGAR's formats (`x` here, no colour knob); the preset's vendored
   links and `#z.pfaders` land `unreadable` - the known pattern of a grown rack (RADAR's `pradar`).
5. **`addedAt`** is 2026-09-23 (the rebuild's date, RADAR's precedent), so the card sorts newest.
6. **The front door**: off the ring (position 6), stated in `front-door.ts`.

## Costs

Under the pinned `compressScript` after `initLuaFormatter()`: Setup 757 of 908 at the defaults, 765
at the dearest literals (no colour knob: every channel 15, every number three digits), 143 free; Timer
292 / 300. The preset was 525 / 24. The Setup with the receive in it measured 953 - why the Timer makes
it.

## The VM cases (`lua-smoke.spec.ts`, "FOUR FADERS (rebuilt by hand)")

- Against the shelf preset compiled in the same VM: the same frames at every step of a drag up fader
  1, a tap on each of the others and two fingers on two faders; the same messages (controllers 16..19
  on channel 0); no Timer armed.
- The latch: a finger landing on fader 1 and sliding across faders 2 and 3 sends controller 16 only,
  faders 2 and 3 stay dark, fader 1's bar follows the finger up; the shelf preset sends 16, 17 and 18.
- Per fader: fader 2 a pitch bend on channel 4 (`3:224:0:v`), fader 3 a channel pressure (`0:208:v:0`),
  fader 4 controller 74 on channel 10, fader 1 as shipped; the receive paints fader 2 at the top, fader
  4 at the bottom and fader 1 half way; another channel, a neighbour's traffic (header 14), Receive
  Off and another number change nothing; nothing is sent back; a previous landing's callback is never
  reached.
- The residue probe allows the fader columns: an absolute fader holds its level (CONSOLE's allowance).

## Change 17C's record

The Done paragraph "17C" under `BENCH-2026-09-16.txt` section 17 has the per-card table; the line under
section 18 records the latch. Audition row 45 asks the bench what the VM cannot: a real finger sliding
across a column gap keeps its contact id, and host MIDI reaches the touch element (row 40).
