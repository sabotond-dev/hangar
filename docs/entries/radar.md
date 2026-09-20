# RADAR - the history behind src/lib/catalog/entries/radar.ts

RADAR is the ring that rolls out from the centre while the pad sends the first finger's position:
the ported BOTOR preset, rebuilt by hand on 2026-09-18 (change 12b, `BENCH-2026-09-16.txt`
section 12) so it can take ORBIT's MIDI clock idiom. Its source is
`src/lib/catalog/entries/radar.ts`; the preset it replaces stays on the shelf in
`src/lib/catalog/presets.ts` untouched, reached through `portedEntry("radar")`, and the vendored
compiler in `src/vendor/botor/_pad.ts` is untouched. The entry's own header carries the mechanism,
the wire and the traps; the ask, the preset's compiled strings, the divergences, the costs, the VM
cases and the stamp are below.

## The ask

> MIDI sync works perfectly. implement it to Ghost, Radar points, Radar and Steps.

RADAR was a ported preset compiled from the vendored compiler, kind `padsim`, and the front door's
row required it to stay `padsim` (`front-door.ts`), so the sync could not go into it as it was.
Three options were put to the user - leave it, RADAR POINTS carrying the sync; rebuild it as a
hand-authored Lua card with sync and take it off the row; a new card beside the untouched preset -
and the answer was `2`. STEPS, RADAR POINTS and GHOST took the idiom first (change 12, `63ad1ed`,
`4dd7837`, `d1519f3`); RADAR is this change.

## The preset it replaces, verbatim

HANGAR's shelf declaration (`presets.ts`): `preset("radar", "Radar", "Rings roll out from the
centre, and the pad sends your finger's position to your computer.", "instruments", ["colour",
"speed", "note"], look ripple from the centre in 255,68,0 at speed 2, touch comet, sends xy with
fingers "first", cost 391 / 55)`, carrying the touch library's knots (12.1-08b). Compiled at its
defaults under the pinned `compressScript` after `initLuaFormatter()`, Setup 391 of 908, Timer
55:

```lua
--[[@cb#z.pradar]] for n=0,80 do local a,u,v=glag(0,n),n%9-4,n//9-4 glc(a,2,255,68,0,1)glpfs(a,2,math.sqrt(u*u+v*v)*45//1,254,3)glt(a,2,65535)glc(a,1,255,170,34,1)end self.touch_cb=function(s,i,e,x,y)K(x,y,1,252)if(e==4 or e==9)and not s.f then s.f=i end if i==s.f then if e==1 or e==4 or e>8 then s:gms(0,176,16,x,0)s:gms(0,176,17,y,0)end if e==3 or e>=5 then s.f=nil end end end gtt(0,3e5)
```

```lua
--[[@cb#z.t]] gtt(0,3e5)for a=0,80 do glt(a,2,65535)end
```

What it does, as read: every cell's layer 2 is the ring colour at a phase of `sqrt(u*u+v*v)*45`
(the distance from cell 40; 45 the largest multiplier that keeps the corner under 256, so one ring
is ever on screen), walked by the firmware's sine (shape 3) at fre 254 - the firmware ADDS fre each
tick (`grid_led.c:191-211`, `pad-sim.ts` `ledTick`), so 254 is -2 a tick and the crest moves
OUTWARD, 128 ticks a ring (SPEED_TABLE step 2, 1.28 s) - under a keeper the Timer re-arms every
300 s. Layer 1 carries the comet's colour 255,170,34 and the library's calibrated decaying stamp
`K(x,y,1,252)`. The wire is the compiler's xy emitter with `fingers: "first"`: the first contact
to arrive (code 4 or 9) claims `s.f`; while it is the claimant, every sample on 1 / 4 / >8 sends
the RAW pair - X on CC 16, Y on CC 17, channel 1 (zero-based 0) - and 3 / >=5 releases the claim;
no send-on-change, no calibration of the coordinates, a second finger silent. The preset's three
tune knobs (`knobs.preset.ts`): Colour (the RGB444 lattice, applied to the look), Speed (the eight
firmware detents 1 2 3 4 6 8 12 16) and Send (`SEND_OPTIONS`, twelve CC bases 16 to 80).

## What the rebuild is

The compiled Setup carried into a hand-authored `SETUP` with the three knobs as tokens and the
idiom added; the Timer carried verbatim (it carries no token). The picture under Internal is the
preset's byte for byte: `frames.json`'s radar block did not move through the regeneration
(all five sampled ticks, the same hashes under the Lua VM as under the native PadSim), and
`lua-smoke.spec.ts` holds the two engines frame for frame at ticks 0, 1, 37, 64, 101, 128 and
300, under a finger, after its lift and sixty ticks on.

- **The ripple loop**: `self.a[n]` keeps each cell's base phase p; `glc(a,2,@COL,1)`,
  `glpfs(a,2,p,@SYNC and 0 or 256-@SPEED,3)`, `glt(a,2,65535)`, `glc(a,1,255,170,34,1)`. Under
  External the fold gives fre 0 (0 is truthy in Lua, so `true and 0` is 0): the walk is FROZEN at
  the rest picture until the DAW's clock moves it.
- **The step** `local function f(s)`, a Setup LOCAL called by the callback directly: k = s.k%8,
  advance, then every cell's layer-2 phase to `(s.a[n]-k*32)%256` - eight steps a ring, so at
  Division 16th a ring is eight 16ths, half a bar (RADAR POINTS's ping), at 8th a bar, at 32nd a
  beat. It lives in the Setup, not the Timer, because the Timer's period is the preset's 300 s: a
  published-from-the-Timer step (change 12's `s.f`) would leave every clock inside the first five
  minutes counted and not stepped. Nothing is published, and `s.f` stays what the compiler made
  it - the first finger's contact id.
- **The callback**: the compiler's, verbatim but for `@CC` and `@CC+1` in place of 16 and 17.
- **The clock handler**: ORBIT's spelling, without a release (the card holds no note) -
  `self.rtmrx_cb=function(s,h,b)if b==250 then s.k=0 s.q=0 end if b==250 or b==251 then s.r=1
elseif b==252 then s.r=nil elseif b==248 and s.r then if s.q%@DIV==0 then f(s)end s.q=s.q+1 end
end` then `grxm(2,@SYNC and 3 or 0)gtt(0,3e5)`. Start resets k and q, so the next clock lands
  step 0 - the rest picture, the ring at the centre; Stop halts and the ring holds where it is;
  Continue resumes from the kept count; 254 does nothing.
- **The knobs**, five: `colour` Ring colour (`@COL`, a palette of five, the preset's 255,68,0
  first), `speed` Ring speed (`@SPEED`, the preset's eight detents, ascending so the bigger
  number is the faster ring; the literal is the firmware rate and the Lua spells `256-@SPEED`),
  `send` CC pair (`@CC`, the preset's twelve `SEND_OPTIONS`), `sync` Sync (`@SYNC`, Internal /
  External, `previewIndex: 0`), `division` Division (`@DIV`, 12 / 6 / 3). The ids `colour`,
  `speed` and `send` are the preset's knob ids. No channel knob: the preset had none (the brief's
  condition), so the pair stays on channel 1 as it did.

## The divergences from the preset, D-14 style

Nothing on the wire moved: the CC pair, its channel, its raw coordinates, the first-finger policy
and the event guards are the compiler's text. The library's `Q G N U` and `A` are NOT used - the
compiled finger already IS the library's `K`, the sends are coordinates and not cells, and a
send-on-change `A` would change what a DAW receives, which D-14 forbids doing silently. What did
move:

1. **The colour knob's shape.** The preset's Colour is the 4,096-position RGB444 lattice; a Lua
   entry's colour knob is a palette list plus the picker (format `w`), so RADAR offers five named
   colours with the picker behind them. `colour-picker.spec.ts`'s lattice count on the shelf is
   5 knobs since (was 6).
2. **The description's apostrophe.** The shelf sentence carries the vendored ASCII apostrophe,
   which `typographic.ts` curls at render time on a preset card; a hand-authored string is held to
   the house punctuation by `copy.spec.ts`, so the entry's and the listing's sentence carry U+2019
   at source. `typographic.spec.ts`'s test 3 reads the shelf preset through `portedEntry("radar")`
   now, so it still proves the transform against vendored copy.
3. **The sign-turned walk, measured and NOT taken.** A walk at `+@SPEED` from `(128-p)%256`
   would keep the rate a single digit for `lua-smoke.spec.ts`'s keeper guard, and the firmware
   sine is symmetric about 64 - but only to rounding (s(0) = 128, s(128) = 126): the regenerated
   frames had the same non-zero counts at every tick and different hashes. So the card keeps the
   compiler's 254, and the guard reads the layer's SHAPE (`sha === 0`, a decay) to tell pitfall 1
   - a keeper replacing a decay's countdown - from the compiler's own continuous look under a
     keeper, which every RADAR card has always been. A gate refined with a field it always had;
     nothing else it caught is excused.
4. **The touch guard's row.** `touch-guard.spec.ts` reads a Lua entry's "contact ended" as
   `e==3 or e>=5 and e<9`; the compiler's release `e==3 or e>=5` is reached only inside
   `if i==s.f then` after the claim and the send in the same pass, so a code 9 is claimed, sent
   and released in one call - which is what makes a fast tap send exactly one pair and leave no
   finger claimed. Declared as RADAR's row, keyed on the whole branch, the eighth exception.
5. **`addedAt`** is 2026-09-18 (the rebuild's date; TRACKPAD's precedent at 12-10), so the card
   sorts newest.
6. **The front door.** The preset held ring position 5; the user's word took it off the row. The
   row is seven (`FRONT_DOOR`), `EXCLUDED_FROM_ROW` carries `radar` with the reason, and
   `front-door.spec.ts`'s floor of eight is seven with the reason written beside it.

## The costs, under the pinned `compressScript` after `initLuaFormatter()`

Setup **758** at the defaults, **763** at the worst of the whole 5 x 8 x 12 x 2 x 3 cross-product
(colour `255,255,255`, speed `12`, Internal, Division 12) - 145 free; Timer **50**, no token. The
preset's 391 / 55 grew by the two tables, the step, the handler and the routing. Every state is a
fixed point of `compressScript` and passes `checkSyntax`. No system slot; the brief's order Setup ->
Timer -> system holds at the Setup with room to spare.

## The VM cases (`lua-smoke.spec.ts`, 46 -> 47)

Internal: the Lua card's frame equal to `new PadSim(presetById("radar").state)`'s at ticks 0, 1,
37, 64, 101, 128 and 300, then with a finger dead on LED (4,4) - the press sends the raw pair on
CC 16 / 17 channel 0, the frame still equal - a move to (6,2) sending the pair again, a second
finger while the first is held sending nothing, the lift sending nothing, the frames equal after
the lift and sixty ticks on, and the next finger claiming the pair. External: `grxm(2,3)`, fre 0
from the Setup, the centre at phase 0 and ring 1 east at 45, 300 Timer ticks and twelve clocks
before Start moving nothing, the first clock after Start landing step 0 (the rest picture - the
step is a Setup local, so there is no first-period caveat on this card), the seventh clock walking
the centre to 224 and ring 1 to 13 with the rate left at 0, 200 Timer ticks moving nothing, the
finger's pair unchanged under External, Stop holding 224 through clocks and 254, Continue keeping
the count at 7 and stepping on the sixth clock to 192, six more steps wrapping to the rest
picture (k reads 1: `k=s.k%8 s.k=k+1`), Start putting the ring back at the centre on the clock;
Division 12 and 3 stepping at clocks 1, 13, 25 and 1, 4, 7; the words and the preview. The
existing catalog-wide cases (the gesture, the strobe guard with its shape read, the residue, the
parity tap) run RADAR as the twentieth Lua entry.

## The stamp

Every link shared while RADAR was a preset card carried a BOTOR payload - the base-card `pradar`
or a tuned `z…` field dump of its three knobs. Under the Lua route both land `unreadable` and open
the card at its defaults (`stamp.spec.ts` asserts both against real stamps encoded through the
shelf preset, and the Lua card's own `w` stamp unreadable under the shelf preset in turn). RADAR is
not in `wild-stamps.json`, so no captured record moves.
