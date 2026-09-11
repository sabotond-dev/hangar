# The ZONA calibration probe (Probe C)

Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

One question underlies every finger a HANGAR configuration draws, and no simulator on this machine
can answer it:

- **Where are the LEDs, in the sensor's units?**

The ZONA's touch controller is not under its LEDs. The value it reports for a finger resting on LED
column 7 is not `7 * 128 / 9`; on the module this document was written against it is 120, and the
naive divisor every Phase 12 configuration used (`x*9//128`) put that finger into column 8. The
third bench round said so in the user's words (`BENCH-2026-09-11.txt`: _"if my finger is directly on
top of the LED in row 2 column 8 the top right LED lights up, same in each corner"_). This probe
measures the map directly: nine knots per axis, the raw value the sensor reports with a fingertip
centred on each LED, and four corners that check the two axes are independent.

The probe **has been run once**, on 2026-09-11, and its result is frozen in
`src/lib/catalog/calibration.ts` with `MEASURED = true`. Everything below the procedure is that
run's record. The document exists so the run can be repeated in five minutes from a page rather
than from a research note - audition row 24 of `docs/HARDWARE-AUDITION.md` asks for exactly that -
and so the derivation rule is written down once.

The script below was checked by machine against the pinned minifier before it was written into this
document. `GridScript.checkSyntax` accepts it, `GridScript.compressScript` returns it unchanged (it
is already in canonical compressed form), and it measures **483** characters against a budget of 908. Paste it exactly as it appears. One changed space is a different character count, and because
the stored form is canonical it is also a different configuration.

## What it measures, and how

The readout is **MIDI, one triple per LED, on the lift**. The pad's own job is to **show the
target**: one white LED at a time, lit by _address_ and never from the finger's coordinates, so the
probe cannot display the map it is measuring. Rest a fingertip dead-centre on the lit LED, hold a
beat, lift; the probe sends the last position it saw before the lift as CC20 (x), CC21 (y) and CC22
(the target number, 1..21) on channel 1, darkens that target and lights the next. A second finger is
ignored. A twenty-second lift does nothing.

**Why the last sample before the lift and not the lift's own coordinates:** a lifting finger rolls,
and the UP message carries wherever it left. The last DOWN or MOVE sample is where the finger
rested. A resting finger wobbles by about one unit (Phase 12's probe, Q1); that is the measurement's
noise floor, and it is under a sixteenth of an LED pitch.

**Targets, in order (21):** row 4 left to right (cells 36..44), then column 4 top to bottom without
the centre (cells 4, 13, 22, 31, 49, 58, 67, 76), then the four corners (0, 8, 72, 80). Row 4 gives
the nine X knots, column 4 with the centre's own y gives the nine Y knots, and the corners check
that the map is separable.

## The paste

Touch element, event 0 (Setup). **483 of 908**, canonical, `checkSyntax` true. Timer box: leave
whatever is there (nothing arms it). System box: leave it.

```lua
--[[@cb]]local t={36,37,38,39,40,41,42,43,44,4,13,22,31,49,58,67,76,0,8,72,80}for a=0,80 do glc(a,1,255,255,255,1)glp(a,1,0)end self.k=1 self.x=0 self.y=0 glp(glag(0,t[1]),1,255)self.touch_cb=function(s,i,e,x,y)if i>0 then return end if e==4 or e==1 then s.x=x s.y=y return end if e~=5 then return end local n=t[s.k]if not n then return end s:gms(0,176,20,s.x,0)s:gms(0,176,21,s.y,0)s:gms(0,176,22,s.k,0)glp(glag(0,n),1,0)s.k=s.k+1 local m=t[s.k]if m then glp(glag(0,m),1,255)end end
```

How it reads. `t` is the target list. The loop gives all 81 LEDs white on layer 1 at phase 0, so
the pad is dark except what the probe lights. `self.k` is the target index, `self.x` and `self.y`
the last sample. The callback ignores every contact but the first (`i>0`), stores the position on a
press (`e==4`) or a move (`e==1`), and acts only on a lift (`e==5`): if a target is still pending it
sends the three CCs, darkens the target, advances, and lights the next if there is one.

## What you do (ten minutes)

1. `/dev/install/` -> Connect -> paste the script into the **Setup** box (leave System and Timer as
   they are) -> **Try**. The pad goes dark except one white LED at the left end of the middle row.
   Open a MIDI monitor on the ZONA's port. **Do not press the module's utility button** during the
   session: its default reloads the next page and drops the RAM configuration.
2. Put one fingertip **dead-centre on the lit LED** - look at the LED, not the pad edge. Hold still
   for about a second. Lift straight up. The LED goes dark and the next one lights.
3. Repeat until nothing is lit: 21 lifts - nine along the middle row, eight down the middle column
   skipping the centre, then the four corners top-left, top-right, bottom-left, bottom-right.
4. Copy the monitor's CC20 / CC21 / CC22 rows - 21 triples - into the bench note, in order. **If a
   lift did not advance the target** (a dropped lift; the firmware does not always deliver one),
   tap the same target again - and say so, because the re-tap is where the finger already was, not
   a fresh centred reading. If the finger slipped, note the target number and run the whole probe
   again afterwards (Try again restarts it at 1).
5. Optional second pass: run it once more and report both, so each knot has two readings.
6. **Put back.**

**Report back:** the 21 triples (or 42), which hand and finger, and whether the module was flat on
the desk. If a row's CC22 is missing, say which. If the LED pitch in millimetres is known, say it:
it is a sanity check on the research's geometry and nothing waits on it.

## How the map is derived from the report

- Targets 1..9 (cells 36..44) give **`KX[0..8]`** = the CC20 of each, in order.
- Targets 10..13 (cells 4, 13, 22, 31) give **`KY[0..3]`**; target 5 (cell 40) gives **`KY[4]`**
  from its CC21; targets 14..17 (cells 49, 58, 67, 76) give **`KY[5..8]`**.
- Targets 18..21 (the corners) are the **separability check**: target 18 should read about
  `(KX[0], KY[0])`, 19 `(KX[8], KY[0])`, 20 `(KX[0], KY[8])`, 21 `(KX[8], KY[8])`. If any corner is
  off by more than 3 units on an axis, the map is not a product of two one-dimensional maps and this
  document's model is wrong - stop and report, do not fit.
- The knot tables must be **strictly increasing**. If two neighbouring readings are equal (both
  saturated at 0 or 127, plausible for the outermost pair on an axis that clips hard), nudge the
  inner one by one unit and record that the outer LED's centre is unreachable. `U` divides by the
  knot difference and Lua 5.4 raises on integer floor division by zero.
- With two passes, average and round; with one, use it as read. A one-unit wobble is under a
  sixteenth of an LED pitch and invisible in the gradient.
- A reading that is not what its target could produce - x pinned at an edge for a column-4 target,
  y on row 4 for a row-0 target - is a re-tap after a dropped lift. Discard it, name it, and take
  the knot it would have supplied from the corners if the corners can supply it (they can for
  `KY[0]` and `KY[8]`, `KX[0]` and `KX[8]`; for an interior knot, run the probe again).
- The tables go into **one TypeScript source of truth**, `src/lib/catalog/calibration.ts`, from
  which the Lua tables, the simulator's forward map and every test expectation are derived. No
  number is typed twice.

## Run 1, 2026-09-11, 11:43:50 - 11:44:31

On the user's ZONA over `npm run dev`. Hand, finger and flatness not reported. CC20 = x,
CC21 = y, CC22 = target.

| target | cell | x   | y   | gives                                                                                                                      |
| ------ | ---- | --- | --- | -------------------------------------------------------------------------------------------------------------------------- |
| 1      | 36   | 1   | 61  | `KX[0]`                                                                                                                    |
| 2      | 37   | 13  | 63  | `KX[1]`                                                                                                                    |
| 3      | 38   | 29  | 61  | `KX[2]`                                                                                                                    |
| 4      | 39   | 46  | 62  | `KX[3]`                                                                                                                    |
| 5      | 40   | 64  | 68  | `KX[4]`, and `KY[4]` from its y                                                                                            |
| 6      | 41   | 85  | 66  | `KX[5]`                                                                                                                    |
| 7      | 42   | 100 | 62  | `KX[6]`                                                                                                                    |
| 8      | 43   | 120 | 64  | `KX[7]`                                                                                                                    |
| 9      | 44   | 126 | 60  | `KX[8]`                                                                                                                    |
| 10     | 4    | 127 | 68  | **DISCARDED** - x at the right edge, y on row 4: a re-tap at target 9's position after a dropped lift, not a row-0 reading |
| 11     | 13   | 65  | 12  | `KY[1]`                                                                                                                    |
| 12     | 22   | 65  | 26  | `KY[2]`                                                                                                                    |
| 13     | 31   | 66  | 48  | `KY[3]`                                                                                                                    |
| 14     | 49   | 65  | 83  | `KY[5]`                                                                                                                    |
| 15     | 58   | 66  | 97  | `KY[6]`                                                                                                                    |
| 16     | 67   | 65  | 115 | `KY[7]`                                                                                                                    |
| 17     | 76   | 67  | 126 | `KY[8]`                                                                                                                    |
| 18     | 0    | 1   | 0   | corner: against `(KX[0], KY[0])`; and `KY[0]` = 0, with 19                                                                 |
| 19     | 8    | 127 | 0   | corner: against `(KX[8], KY[0])`; and `KY[0]` = 0, with 18                                                                 |
| 20     | 72   | 0   | 127 | corner: against `(KX[0], KY[8])`                                                                                           |
| 21     | 80   | 127 | 126 | corner: against `(KX[8], KY[8])`                                                                                           |

**The tables as frozen** (`src/lib/catalog/calibration.ts`, `MEASURED = true`, `runs: 1`):

```
KX = 1, 13, 29, 46, 64, 85, 100, 120, 126   steps 12, 16, 17, 18, 21, 15, 20, 6
KY = 0, 12, 26, 48, 68, 83,  97, 115, 126   steps  -, 14, 22, 20, 15, 14, 18, 11
```

**The corners against the product of the tables:** 18 reads (1, 0) against (1, 0); 19 (127, 0)
against (126, 0); 20 (0, 127) against (1, 126); 21 (127, 126) against (126, 126). Every corner
within 1 unit, under the 3-unit rule: the map is separable, and twenty-one targets are the whole
map.

**What the numbers say.** The high side of both axes runs out of range inside the outer LED (LED 7
to LED 8 is 6 units in x, 11 in y); the low side compresses less (12 and 14); the middle is about 17
per LED. The user's "row 2 / column 8 lights the corner" follows exactly: `x = 120` under `x*9//128`
is column 8.

**What run 1 could not settle.** A corner finger saturates both axes, so corners 18 and 19 can only
say `KY[0]` is about 0..2; they cannot distinguish 0 from a small positive value the way a direct
reading of target 10 would (the low side of x compresses to a 12-unit step, so a centred row-0
finger may plausibly read a few units above 0). The only thing that value moves is the blend
between row 0 and row 1, at the top row only, by at worst a third of a pitch. It was frozen at 0
and the re-run below answers it.

## Running it again

The script advances on lifts, one target per lift, from target 1. There is no way to tap "only
target 10": nine lifts along row 4 come first whatever you do. So the honest instruction is one of
two:

- **The five-minute version:** run the probe and stop after the tenth lift - the first LED of the
  top row, cell 4, column 4 - and report the ten triples. The tenth is the reading run 1 lost.
- **The whole second pass:** run all twenty-one and report them. Every knot then has two readings,
  and the rule above averages them.

Either way the answer goes into **audition row 24** of `docs/HARDWARE-AUDITION.md` (the triples,
which hand and finger, whether the module was flat, the LED pitch if known). What the planner
expects: target 10 reads y in 0..5, and every other knot within 2 of run 1. If any knot moves by
more than 2 units, the two arrays in `src/lib/catalog/calibration.ts` are edited - and the
provenance record beside them - and nothing else in the tree is edited by hand: the Lua literal, the
preview's forward map and every test expectation are derived from the arrays, and
`UPDATE_FRAMES=1` regenerates `frames.json` for the demo cards. One commit; no plan re-opened. If
nothing moves, nothing is edited and the row says so.

## What a re-run does not do

It does not write the map to the module. The probe is a Setup pasted through `/dev/install/` and
put back afterwards; the library that carries `KX` and `KY` onto the module is installed with any
configuration, from `calibration.ts`, and no bench row touches it. And it measures **one module**:
the map is of the user's prototype unit, held by one hand on one desk, and another ZONA may differ
by a few units at the edges.

## Results

Run 1, 2026-09-11: above, frozen. The re-run (row 24) has not been run.
