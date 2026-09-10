---
phase: 11-bench-corrections
plan: 15
subsystem: catalog
tags:
  [wheels, pitch-bend, mod-wheel, spring, timer, budget, new-entry, legibility]
requires:
  - phase: 11-bench-corrections
    plan: 13
    provides: "the PREV_FILES 84 / PREV_TESTS 866 / PREV_E2E 86 source + 105 runs / BASE_CHECK 580 / sweep 4 19 / catalog 27 baseline, the origin-lock idiom, the ten-bit axis-ownership rule and the shape-not-colour legibility assertion"
  - phase: 11-bench-corrections
    plan: 12
    provides: "the gtt zero-period trap written out in shuttle.ts, the rule that a Timer re-armed on every touch sample never fires, and D-11-12-b - that nothing in the tree asserts a card is legible"
  - phase: 11-bench-corrections
    plan: 02
    provides: "the two live gates, decay-idiom.spec.ts and touch-guard.spec.ts, and the blessed spellings of the live filter and the onset"
provides:
  - "WHEELS: the phase's one new configuration - a fourteen-bit pitch wheel that springs home on the wire as well as in the light, a seven-bit mod wheel that holds, and a lit divider between them that answers to no finger"
  - "The measured proof that A STORED TIMER DOES NOT MAKE AN ENTRY `animated` - it is Setup arming it and the body re-arming unconditionally that does, and FORGE has shipped the counter-example since 09-07"
  - "A THIRD reason to spend the ten-bit unlock, beside 11-13's two: a control whose OUTPUT IS WIDER THAN THE AXIS. Pitch owns the whole y axis and still wants it, because 128 raw positions into a 14-bit value is a 7-bit controller wearing a 14-bit label"
  - "D-11-15-a: host-surface.spec.ts cannot express an entry-installed `self:` method, though `self.touch_cb` proves the construct is legal and universal - a gate that refuses a call that works"
  - "The measurement that the plan's own `grep -n gmbs` check CANNOT be empty for a card whose header explains why gmbs is wrong, and the two assertions that replace it - one over the rendered Lua at every knob value, one over the host's HID log"
  - "Four rejected shapes priced at the picker corner - ribbon 939, detent 922, two-layer divider 917, mod marker-plus-bar 914 - and four taken levers priced by removal"
affects: [11-16]
tech-stack:
  added: []
  patterns:
    - "One paint function over all eighty-one cells, colour and phase together, with NO Setup paint loop of its own - the character trade that turns 1118 into 895"
    - "nil AS THE SENTINEL: a repaint gate written `if r==s.r and k==s.k then return end` against fields that start nil, which is 19 characters of nothing"
    - "A spring that lands on an EXACT LITERAL by construction - `else d=0` - and a Timer that disarms by NOT re-arming, never by gtt(index,0)"
    - "A bounded settle in the test, asserting termination, because a spring that never lands HANGS an unbounded wait and a hang is not a red"
key-files:
  created:
    - src/lib/catalog/entries/wheels.ts
  modified:
    - src/lib/catalog/index.ts
    - src/lib/catalog/listing.ts
    - src/lib/catalog/front-door.ts
    - src/lib/catalog/frames.json
    - src/lib/catalog/audition.spec.ts
    - src/lib/browse/filter.spec.ts
    - src/lib/tune/colour-picker.spec.ts
    - src/lib/share/stamp-roundtrip.sweep.spec.ts
    - src/lib/sim/lua-smoke.spec.ts
    - docs/HARDWARE-AUDITION.md
key-decisions:
  - "RAN AHEAD OF 11-14, WHICH IS OPEN AT A BLOCKING CHECKPOINT AND HAS SHIPPED NOTHING. The dependency is only through the catalog count chain and it COMMUTES: this plan's term is +1 in every branch. Every count is therefore stated as CARRIED PLUS DELTA and no absolute total is asserted"
  - "ONE ENTRY WITH TWO WHEELS, not two entries - the layout sentence describes one module carrying both, which is how a keyboard's left-hand section is laid out"
  - "COLUMNS 0-3 AND 5-8 WITH COLUMN 4 A LIT DIVIDER. Nine does not halve; sharing column 4 would make the boundary a lie, and a contact that begins on the divider does nothing at all"
  - "THE TEN-BIT UNLOCK IS TAKEN, for a reason 11-13's rule does not cover: the test is not only axis ownership but OUTPUT WIDER THAN THE AXIS. Costed at 53 characters"
  - "SETUP DOES NOT ARM THE TIMER, so the entry is honestly `static` and the fixture says so at all five ticks. The plan's premise that a stored Timer forces `animated` is FALSE, and FORGE is the shipped counter-example"
  - "`self.D=function(s)` WAS TRIED, RAN GREEN IN A LIVE HOST AND WAS WITHDRAWN, because host-surface.spec.ts refuses an entry-installed `self:` method. The shipped shape is snake.ts's: a Setup local plus the Timer's own smaller copy, and the duplication is closed by a byte-for-byte frame assertion rather than by a comment"
  - "`wild-stamps.json` NOT TOUCHED, and the contract was read first: it is 36 captured literals over 18 entries with `toBe(18)` asserted twice, so a record for WHEELS would be a FABRICATED capture that broke the fixture's whole point"
  - "TAGS CHOSEN FOR TRUTH: modulation / expressive / precise. `precise` takes that term from 6 to 7 and off the FEELS floor - reported as a consequence, never used as a reason. `still` would have left the floor alone and is simply not true of a card whose whole gesture is something moving after the finger has gone"
patterns-established:
  - "A new entry re-counts every CENSUS in the tree rather than only the gates named in its plan - three censuses in three unnamed files moved here"
requirements-completed: [CONT-02, CONT-03, CAT-01, CAT-04, SHARE-04]
duration: 70min
completed: 2026-09-10
---

# Phase 11 Plan 15: WHEELS — two wheels on one pad, a spring that lands on exactly 8192, and a natural shape that missed by 210 Summary

**The user asked for a pitch wheel on the left and a mod wheel on the right. The
asymmetry IS the entry, so the two halves differ in four places rather than in
colour, and the one that matters is the spring: THE LAST BEND THE TIMER EMITS IS
EXACTLY 8192, asserted at all four spring speeds, alongside a BYTE-FOR-BYTE
comparison of the whole pad against the frame Setup painted. A plant that lands
the wire two flat WHILE THE PICTURE COMES HOME reddens on that clause alone,
naming both values. The natural architecture measured 1118 of 908 — TWO HUNDRED
AND TEN OVER — and the shipped card fits at 895 with thirteen free, the tightest
margin in the catalog.**

## Performance

- **Duration:** 70 min, one executor session
- **Tasks:** 2 of 2
- **Files:** 1 created, 9 modified, across two commits

---

## FIRST: THIS PLAN RAN AHEAD OF AN OPEN CHECKPOINT, AND WHY THAT WAS SAFE

`depends_on` names **11-14**, which is **open at a blocking checkpoint and has
shipped nothing** — no commits, no SUMMARY, every carried count unmoved.
`11-14-HANDOVER.md` is task 01's reported answer and the tree at `HEAD~2` was
byte-identical to 11-13's tip apart from that one document.

**The dependency is only through the catalog count chain, and it commutes.**
This plan's own term is `+1` under every one of 11-14's four options, and RADAR's
own `+1` under `new-entry` would land whichever order the two waves run in. So:

- **no absolute total is asserted anywhere in this SUMMARY.** Every count below
  is a **carried name plus a delta**.
- **11-14's recorded answer is: THERE IS NONE.** There is no
  `11-14-SUMMARY.md`, so the plan's branch table cannot be applied and **the row
  it names was not copied**. Stating "28" or "29" would have been the exact
  defect 11-16 is instructed to report. What is true today, measured:

```
catalog:      27 carried  +1 (this plan)  = 28 observed today, and
                                            + T14 whenever 11-14 lands
preset / Lua:  9 + 18     +0 / +1         =  9 + 19 observed today
static/og/:    27 files   +1              = 28 files observed today
audition rows: 23         +1              = 24 rows observed today
```

`T14` is **+1** under `new-entry` and **+0** under `ring-seven`,
`ring-eight-lua` and `fold-into-sonar`. **11-14 can still land in any of its four
branches without this wave having pre-empted it**, and its own SUMMARY should
state its total as `28 + T14` rather than reading a literal out of its plan.

**One correction to 11-14's own finding 5, confirmed here.** The handover says
11-14's branch table "mixes this plan's figures with post-11-15 totals". It is
right, and the direction is now measurable: before this wave the tree read
**27**, **9 + 18**, **27**; after it, **28**, **9 + 19**, **28**. Note the split
is **9 + 19**, not the table's `8 + 20` — plan 11-05 gave HANGAR ownership of the
nine preset definitions but they are still nine PRESET entries, so it is the Lua
side that grows.

---

## THE BUDGET, COSTED BEFORE THE ENTRY WAS AUTHORED

Every figure is `max(GridScript.compressScript(lua).length, lua.length)` after
`await padReady()`. The **RGB444 picker corner** is every colour knob at
`255,255,255` and every other knob at its longest declared value — the corner
`lua-entries.sweep.spec.ts` actually gates.

### THE SKETCH LADDER, MEASURED WITH NOTHING COMMITTED

| Sketch | Shape                                                                    | Setup    | free     | Timer |
| ------ | ------------------------------------------------------------------------ | -------- | -------- | ----- |
| **1**  | a paint function per wheel, COLOUR AND PHASE written on every repaint     | **1118** | **−210** | 191   |
| **6**  | colours written once in a Setup loop, a PHASE-ONLY repaint                | 1035     | −127     | 191   |
| **11** | **ONE paint function over all 81 cells, and NO Setup paint loop at all**  | **922**  | **−14**  | 191   |
| —      | 11 with the divider colour a fixed literal rather than a knob             | 916      | −8       | 191   |
| —      | 11 without the ten-bit unlock                                             | 869      | +39      | 191   |

**THE NATURAL SHAPE DOES NOT FIT, AND BY A WIDE MARGIN.** Sketch 1 is the way
this card wants to be written — one function per wheel, each gated on its own
quantity — and it is 210 characters over on the Setup while the Timer sits at
191 with 717 free.

**The Timer's 717 free cannot absorb it, and that is a measured constraint
rather than a preference.** Moving the repaint into the Timer is 11-12's move and
it is the obvious one; it is unavailable here because `touch_cb` has to repaint
IMMEDIATELY, and the only way a Timer could do that is if `touch_cb` re-armed on
every sample — which `shuttle.ts` documents as the trap that stops a Timer firing
at all while a finger is moving, since each `gtt` pushes the deadline out by a
whole period.

### WHAT MADE IT FIT: TWO MOVES AND ONE BRIGHTNESS DECISION

1. **ONE FUNCTION PAINTS THE WHOLE PAD**, colour and phase together, and Setup
   has no paint loop of its own — it sets two fields and calls `D(self)`. That is
   four firmware calls per cell per repaint where two would do, **which is
   exactly the trade `strip.ts` spends 34 characters to AVOID**. Here the
   characters are the scarce thing and the calls are not: the repaint is gated on
   `(r,k)` changing and a whole pitch traverse fires it nine times.
2. **NO SENTINELS.** `self.r` and `self.k` start nil, and `r==s.r` against nil is
   false, so the first call paints. **19 characters of nothing.**
3. **THE DIVIDER ON ONE LAYER** — the only single-layer cell in the card. Layers
   ADD in the render sum (`pad-sim.ts:1487-1508`) and one layer caps at 254/512
   of the asked colour, which is the brightness a divider wants. **22 characters
   at the picker corner.**

### SHIPPED

|                          | Setup   | free   | Timer   | free    |
| ------------------------ | ------- | ------ | ------- | ------- |
| **RGB444 picker corner** | **895** | **13** | **343** | **565** |
| all-longest declared     | 891     | 17     | 343     | 565     |
| all-shortest declared    | 880     | 28     | 338     | 570     |
| at the defaults          | **882** | 26     | **338** | 570     |

**THIRTEEN FREE ON THE SETUP is the tightest margin in the catalog** — STRIP's 33
was the previous one. Both events are fixed points of `compressScript` at the
defaults and both pass `checkSyntax`. The sweep gate is green across all 1,271
combinations.

**The picker corner is 4 dearer than the all-longest corner**, and the reason is
@MWC: its longest declared value is 9 characters where the picker can write 11,
and it occurs twice.

### THE FOUR SHAPES THE THIRTEEN CHARACTERS REFUSED

Priced against the shipped architecture, at the picker corner. **A request that
cannot fit is a finding, not a failure**, so each is recorded with its number.

| Rejected shape                                                          | Setup | over |
| ----------------------------------------------------------------------- | ----- | ---- |
| a **deflection ribbon** — the rows between centre and the marker lit      | 939   | −31  |
| a **centre detent**, so a finger could hold exactly 8192                  | 922   | −14  |
| a **two-layer divider**                                                   | 917   | −9   |
| a **mod bar with a marker cell on its top edge**                          | 914   | −6   |

**None of the four can move to the Timer.** They are all Setup-side paint or
Setup-side arithmetic, and the repaint cannot leave `touch_cb` for the reason
above.

### AND THE FOUR LEVERS THE CARD DOES TAKE, PRICED BY REMOVING THEM

| Lever                            | with | without | costs  |
| -------------------------------- | ---- | ------- | ------ |
| the second layer on both wheels  | 895  | 841     | **54** |
| the ten-bit unlock               | 895  | 842     | **53** |
| the origin lock                  | 895  | 845     | **50** |
| the held-finger guard (`s.h`)    | 895  | 873     | **22** |

---

## THE DIVIDE, AND WHY COLUMN 4 IS PAINTED AND ANSWERS TO NOBODY

**Columns 0-3 pitch, columns 5-8 mod, COLUMN 4 A LIT DIVIDER THAT BELONGS TO
NEITHER.** Nine columns do not halve, and the alternative — 0-4 and 4-8, sharing
the middle column — makes the boundary a lie: one column would answer to whichever
wheel the arithmetic reached first, and a finger landing on it could not know
which.

**A contact that begins on column 4 does nothing at all.** `s.o[i]` records the
onset COLUMN and the two branches are `c<4` and `c>4`, so 4 falls through both.
Measured: **a full-height drag beginning on the divider produces 0 messages**,
asserted in `lua-smoke.spec.ts`.

**The divider had to be MADE legible, and that was measured rather than eyeballed.**
The first draft painted it at phase 90 on one layer and it rendered at **38**
against the pitch rail's 50 and the mod rail's 46 — **dimmer than both rails**,
which is a divider nobody can see. At phase 255 it measures **142**, and the test
asserts the ratio rather than a colour:

```
AT REST, at the defaults
  rows 0-3, 5-8  [50,50,50,50, 142, 46,46,46,46]   rails and the divider
  row 4          [431,431,431,431, 142, 46,46,46,46]   the pitch marker
```

**Asserted as `divider > 2 x max(both rails)`, naming no colour**, because all
three hues are knobs a visitor can set to the same value — 11-13's shape idiom
applied to a third element.

---

## THE SPRING: WHY 8192 AND NOT "NEAR CENTRE", AND HOW IT IS PROVED

**The failure mode `WHEELS-REQUEST.md` names by itself: if the picture comes home
and the bend does not, a held note stays bent after the finger is gone.**

The Timer walks the deflection to zero and **stops the walk at exactly zero**:

```lua
local d = s.h and 0 or s.b-8192
if d ~= 0 then
  gtt(0,20)
  if d > @RATE then d = d - @RATE
  elseif d < -@RATE then d = d + @RATE
  else d = 0 end
  s.b = 8192 + d
  s:gms(@CH, 224, s.b%128, s.b//128, 0)
  ...
end
```

The final assignment is `8192 + 0` and nothing rounds. This is the joystick
preset's shipped idiom: its compiled spring lands on **exact literals** (8192 for
a bend axis, 64 for a CC axis) rather than on a scaled position.

**A PROPORTIONAL SPRING WAS REJECTED AND THE REASON IS ARITHMETIC.**
`b = 8192 + (b-8192)*3//4` never lands, because Lua's `//` floors towards minus
infinity and a deflection of −1 maps to `-3//4 = -1` for ever. The card would sit
one code flat, permanently, with every gate in this repository green.

### THE PROOF, PRINTED BY THE TEST FROM LIVE RUNS

```
WHEELS spring, plan 11-15 (the last bend is the centre literal):
  rate  256: drive 512 messages, 512 distinct bends, max 16383;
             spring 32 messages over  65 ticks, ending 8703,8447,8192; frame restored
  rate  512: drive 512 messages, 512 distinct bends, max 16383;
             spring 16 messages over  33 ticks, ending 9215,8703,8192; frame restored
  rate 1024: drive 512 messages, 512 distinct bends, max 16383;
             spring  8 messages over  17 ticks, ending 10239,9215,8192; frame restored
  rate 2048: drive 512 messages, 512 distinct bends, max 16383;
             spring  4 messages over   9 ticks, ending 12287,10239,8192; frame restored
```

**All four spring speeds land on 8192 EXACTLY**, and each takes more than one
step, so the card travels rather than snapping at every setting.

### AND THE LIGHT IS ASSERTED WITH IT, NOT INSTEAD OF IT

The test asserts the marker row is back at the middle row **and** that the whole
243-byte frame is **byte-identical to the frame Setup painted**. That second
assertion is doing two jobs: it proves the light came home, and it closes the one
duplication in this card (below).

### THE TIMER STOPS, AND THE DISARM IS THE ABSENCE OF A RE-ARM

**Never `gtt(0,0)`.** `gtt(index,0)` stops a Timer silently on firmware and is
this catalog's documented trap (`shuttle.ts`), and worse:
`src/lib/sim/lua-host.ts:679-685` **returns early on a period of zero WITHOUT
clearing the deadline**, so a card that stopped itself that way would stop on the
module and keep running in the preview with nothing red anywhere. Instead the
body re-arms only while there is deflection left, and the fire that lands on zero
does not re-arm.

**Asserted three ways:** `timerArmed` is false after the settle; 500 further
ticks produce **0** further messages; and the settle loop is **bounded and
asserts that it terminated**.

**THE PERIOD IS THE LITERAL 20 AND IS NEVER COMPUTED**, so the phase's
`math.max(...,1)//1` floor has nothing to floor here. `@RATE` appears only in
comparisons, never as a period.

**The re-arm is not the first statement in the body, and that is deliberate.**
Firmware runs every handler inside a pcall, so a re-arm placed after something
that raises dies permanently — hence the catalog's gtt-first idiom. It cannot be
first here, because *whether to re-arm* is the question the body exists to
answer. What precedes it is two locals and one integer comparison over fields
Setup writes before any Timer can fire. **There is no raise path in front of the
gtt**, and that was checked rather than assumed.

**A NEW PRESS STOPS THE SPRING**, and `s.h` is what makes that true — 22
characters. Without it a finger landing during the return would set the bend from
`y` and the still-armed Timer would drag it back to centre **under a held
finger**. The Timer opens with `s.h and 0 or s.b-8192`, which works because **0
is truthy in Lua**. The honest edge, named in the header: with two fingers on the
pitch wheel, the first lift arms the spring and the second finger's next sample
stops it again, so at most one spring step happens under the remaining finger.

---

## `gmbs` APPEARS NOWHERE — AND THE PLAN'S OWN CHECK FOR IT CANNOT PASS

The plan asks for `grep -n "gmbs" src/lib/catalog/entries/wheels.ts` to be
**empty**, and in the same breath asks the header to **say why gmbs is wrong**.
**Those two instructions contradict each other**, and the tree says so:

```
$ grep -c "gmbs" src/lib/catalog/entries/wheels.ts
4
```

**All four hits are in one header paragraph.** The file-wide grep could never
have been empty for a card that explains the trap, and — worse — **a card that
DID call gmbs in its Lua would satisfy that grep exactly as badly**. It is this
phase's own fourth standing warning in advance: 11-13 lost a negative check to a
plant that landed in a comment, and here a comment would have satisfied the check
rather than defeating it.

**Two replacement assertions, and NEITHER can be moved by a comment:**

1. **Over the RENDERED LUA at every declared knob value.** `gmbs`, `gmms` and
   `gks` must be absent from both event strings at all 24 renderings, and the
   loop's own count is asserted so a clean result is a measurement rather than an
   empty loop.
2. **Over the host's HID LOG.** After the whole drive — 512 bend messages, a
   lift, a full spring — `host.hid` must be `[]`. **A behavioural check no amount
   of prose can satisfy.**

Plant 3b — the bend sent correctly AND one `gmbs(1,0)` added beside it —
reddens both, the second with **1,752 recorded HID sends**.

**Pitch bend is status 224 through `self:gms`**, low byte first, and the test
reads that off the Lua rather than trusting the header:
`/:gms\([^,]+,224,/` must match **both** the Setup and the Timer. (The channel is
a knob token, not a digit, which is why the regex reads the argument slot.)

---

## THE LEDS ARE THE READOUT, NOT THE QUANTISER — AND THE TEN-BIT DECISION

**Measured on the wire: 512 distinct bend values over a half-travel drive,
reaching 16383, on a pad that draws nine rows.** The marker row is a **second,
independent derivation** — `(16383-b)*9//16384` — computed only so the eye has
something to follow. Mod reads `(1023-y)*127//1023`, all 128 codes, and its bar
height `m*10//128` is likewise a readout of the value rather than the value.

### THE TEN-BIT UNLOCK: TAKEN, AND 11-13'S RULE NEEDS A THIRD CLAUSE

11-13 measured the test as **axis ownership**: a seven-bit control that owns a
whole axis gains nothing, because firmware reports a locked axis by dividing the
native 0..1023 by eight and the code divides it straight back down.

**The pitch wheel owns the WHOLE y axis and still wants the unlock**, because its
**output is wider than the axis**:

| Axis    | Raw positions | Pitch's 14-bit output                          |
| ------- | ------------- | ---------------------------------------------- |
| locked  | 128           | 128 reachable bends of 16384 — **jumps of 128** |
| ten-bit | 1024          | **1024 reachable bends**, 8x finer              |

A locked axis would give a card that says "fourteen-bit pitch bend" and moves in
128-code steps: **a seven-bit controller wearing a fourteen-bit label.** So the
rule reads, after this wave:

> **Unlock when a control owns a FRACTION of its axis (STRIP's fader), or when
> its OUTPUT IS FINER THAN THE AXIS (this pitch wheel). Never for a cell grid,
> which is neither.**

**Cost: 53 characters** (895 against 842). **Both axes are unlocked though only
`y` needs it**, for `D-11-13-a`: `lua-host.ts:713-719` keeps ONE `_coordMax`
behind both names, so an entry unlocking `y` alone would be simulated with a
ten-bit `x` it does not have on the module, and every `x*9//1024` in it would map
the whole pad into one column on real hardware with nothing red. **WHEELS is now
the SECOND entry in the catalog that unlocks either axis**, and the second to pay
for both.

### THE ONE VALUE A FINGER CANNOT HOLD IS THE ONE THE SPRING GUARANTEES

`(1023-y)*16383//1023` reaches **16383 at y = 0** and **0 at y = 1023** — both
ends exact, which is the CONSOLE lesson — but it steps from **8199 at y = 511**
to **8183 at y = 512**, so **8192 is not reachable by hand**. That is what a
spring-loaded wheel is: you cannot hold dead centre, you let go and it is dead
centre. The centre detent that would have made 8192 holdable measured **922 of
908** and is one of the four rejected shapes.

---

## THE MOD WHEEL HOLDS, AND THE TWO WHEELS ARE INDEPENDENT

```
WHEELS hold and independence, plan 11-15:
  mod up+down: 254 messages, controller 1, 0..127, 128 distinct
  lifted at 89 with 6 rows lit: 0 messages afterwards, bar still 6
  pitch driven: 801 messages, cmd 224 only, bar unmoved at 6
  mod driven: 100 messages, cmd 176 only, marker unmoved at 4
  began on the divider: 0 messages
  began on pitch, dragged the whole width: 951 messages, cmd 224 only
```

- **The mod wheel reaches BOTH ENDS**, 0 and 127, all 128 codes — and it is
  driven in **both directions** deliberately. A drive that STARTS at zero is
  already at the resting value and the entry's own change gate sends nothing,
  which is correct; asserting "reaches 0" on one direction alone would have gone
  red on a card behaving properly.
- **It HOLDS across a lift**: 0 messages after the release, bar unchanged, and
  the Timer is **not armed at all** — only the pitch wheel has a spring.
- **Independence in both directions**, and the two crossing gestures are the ones
  the layout makes easy: a contact that begins on the **divider** sends nothing,
  and a contact that begins on **pitch** and is dragged the entire width of the
  pad — across the divider and all four mod columns — sends **951 messages, all
  of them bends**, with the mod bar not moving a cell.
- **Every drive moves its coordinate on every step**, because the host's own
  change gate silently drops a repeated `(event, x, y)` per contact. **That
  matters more here than anywhere else in the suite: a spring that returns to ONE
  value is exactly the shape a change-gated probe cannot see.** The phase's third
  standing warning, honoured by construction, with every message count asserted
  above zero so no drive can pass by sending nothing.

---

## THE ONE DUPLICATION, AND THE ASSERTION THAT CLOSES IT

**A Timer body is a separate Lua chunk and cannot see a Setup local.** The
painter `D` lives in Setup, so the Timer carries **its own smaller copy** —
phases on the pitch columns only, because during a spring the mod wheel is
untouched and every cell's colour is already set.

**`snake.ts` ships the identical duplication for the identical reason**
(`local function P(k,r,g,b)` declared in both events), so this is the catalog's
idiom rather than an oversight.

**The duplication is closed by an assertion, not by a comment:** after a bend and
a settle, **the whole frame must be byte-identical to the boot frame**. A Timer
that repainted with a different rail phase, a different marker phase or a
different row derivation is red there — and plant 4 proves it is not vacuous.

### `self.D` WAS TRIED, RAN GREEN, AND WAS WITHDRAWN — D-11-15-a

The obvious way to avoid the duplication is `self.D=function(s)...end` plus
`s:D()`. It is legal Lua, it is **exactly the mechanism behind `self.touch_cb`**
that every entry in this catalog already uses, and it ran green in a live host
probe with zero errors.

**`src/lib/catalog/host-surface.spec.ts` refuses it.** Its classifier resolves a
`:` call only against `HOST_SELF_METHODS`, so an entry-installed method reads as
*"a self: method the host's SELF_PRELUDE does not install"*. The `.` spelling
(`s.D(s)`) is refused too — *"math is the only table a configuration may reach
through"*.

**The gate is INCOMPLETE rather than right.** Its own test 1 exists to catch
precisely this shape for globals: *"these Grid names are in the VM but not in
HOST_GLOBALS, so this gate would refuse a call that works"*. There is no
equivalent for `self`.

**Filed as `D-11-15-a` and NOT widened here**, for one reason: a card the user is
going to flash onto hardware is the wrong place to introduce the catalog's first
entry-installed method. The proposal for 11-16 or later: teach `resolveCalls` a
per-ENTRY set of names the entry assigns as `self.<name>=function`, keyed on an
actual assignment in either event, so a typo (`s:E()` where only `D` is
installed) still reddens.

---

## MOTION, `restsBlack`, AND A PLAN PREMISE THE TREE DOES NOT SUPPORT

**The plan asserts, in its `key_links` and its `interfaces`, that "a stored Timer
makes the entry animated whatever its picture is doing" and that the executor
should "declare `animated` and let the fixture confirm it". THAT IS FALSE, and
FORGE has been the counter-example since 09-07.**

`LuaPadSim.animating` is `host.animating || host.timerArmed`, and `timerArmed` is
true only if something CALLED `gtt`. The received wisdom holds for an entry whose
**Setup arms the Timer** and whose **body re-arms unconditionally**. WHEELS does
neither, and neither does FORGE:

| entry  | Timer chars | Setup arms it? | `animating` in `frames.json` | `motion` |
| ------ | ----------- | -------------- | ---------------------------- | -------- |
| FORGE  | 373         | no             | false at all five ticks      | `static` |
| WHEELS | 338         | no             | **false at all five ticks**  | `static` |

**READ FROM THE REGENERATED FIXTURE, NOT DECLARED:**

```json
"wheels": [ {tick 0, 37, 101, 500, 1009}
            sha256 dcbb05d7507aec17d9cf3317653a8931962f5a40840bb076ba2879fe9aea8daa,
            nonZeroBytes 171, animating false ]
```

**Identical at all five ticks**, because Setup paints the picture and nothing
advances until a finger has bent the pitch wheel and let go.

`git diff --stat src/lib/catalog/frames.json` is **32 insertions, 0 deletions** —
WHEELS' five records and nothing else moved. `frames.spec.ts` was then re-run
**without** `UPDATE_FRAMES` and is green at 5 tests, which is the proof rather
than the regeneration.

**171 non-zero bytes of 243** is derived, not a coincidence with STRIP's: the
pitch colour `0,180,255` has a zero red channel over 36 cells and the mod colour
`255,150,0` a zero blue channel over 36, so 243 − 72 = 171.

### `restsBlack` IS FALSE, AND THAT DECIDED THE DEMO PATH

Setup lights all eighty-one cells. **`restsBlack: false`**, confirmed by
`frames.spec.ts` test 5 rather than declared.

**THE DEMO PATH QUESTION WAS ESTABLISHED DELIBERATELY, WHICH IS WHAT THE PLAN
ASKED FOR.** `DEMO_PATHS` holds exactly two keys, `ghost` and `morph`, and
`listing.spec.ts` fails any key whose entry does not rest black. **WHEELS rests
lit, so it is on the side of that line where it CANNOT have a demonstration
gesture at all**, and `src/lib/sim/demo.ts` is byte-untouched. 11-11's finding —
that no test asserts what a demo path depicts — does not bite here, because there
is nothing to depict. **The quiet line carries the weight instead**, and it is
required because the motion is `static`.

**The OG image is therefore the resting picture**, rebuilt and inspected: a dim
cyan rail with one bright cyan row across its middle, a pale divider column, and
a dim amber rail with nothing above it. **Both rest states visible, and the two
halves plainly two different pictures.**

---

## THE COPY, COUNTED BY SCRIPT

|             | String                                                                                                       | Length |
| ----------- | ------------------------------------------------------------------------------------------------------------ | ------ |
| description | *"Pitch on the left springs home the moment you let go; the mod wheel on the right stays where you left it."*  | **105** |
| quiet       | *"Both wheels sit lit and still: the pitch marker at the centre row, the mod bar wherever you left it."*       | **100** |

The description cap is **110** (`catalog.spec.ts`); it is written in **both**
`entries/wheels.ts` and `listing.ts` and `listing.spec.ts` asserts the two equal
in both directions. **The description says the asymmetry rather than the
layout** — a reader who only sees this line still learns that one springs and one
stays.

---

## THE TAGS, AND THE HISTOGRAM READ AFTERWARDS RATHER THAN BEFORE

**`["modulation", "expressive", "precise"]`**, chosen for what is true of the
card (CONT-03) and then reported against the histogram.

| Facet     | Carried (27 entries)                                                                 | After (28)                                                                            |
| --------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| **FOR**   | modulation 7, show 5, mixing 3, sequencing 3, shortcuts 3, keys 2, pointing 2, play 2 | **modulation 8**, show 5, mixing 3, sequencing 3, shortcuts 3, keys 2, pointing 2, play 2 |
| **FEELS** | generative 12, readable 11, expressive 11, playable 8, **precise 6**, **still 6**     | generative 12, **expressive 12**, readable 11, playable 8, **precise 7**, still 6      |

Sums **28** and **56**. Singletons **0**.

- **`modulation`** is the truthful FOR term — a pitch and mod wheel pair IS the
  modulation section of a keyboard. 7 to 8.
- **`expressive`** is what a wheel pair is for: the half of a synthesiser you play
  with your left hand while the right hand holds a note. 11 to 12.
- **`precise` LIFTS THAT TERM OFF THE FLOOR OF 6, AND THAT IS A CONSEQUENCE
  REPORTED, NEVER A REASON.** The tag is true at a scale nothing else in the
  catalog reaches: **1024 distinct bend positions across the travel**, against
  STRIP's 128. **`still` is the tag that would have left the floor exactly where
  it was, and it is simply not true** of a card whose entire signature gesture is
  something moving on its own after your finger has gone.

---

## THE COUNTS, AS A CARRIED NAME PLUS A DELTA

| Name                | Carried (11-13)              | Observed                                       | Delta                                       |
| ------------------- | ---------------------------- | ---------------------------------------------- | ------------------------------------------- |
| `PREV_FILES`        | 84                           | **84**                                         | **+0** — no spec file was created           |
| `PREV_TESTS`        | 866                          | **868**                                        | **+2** — exactly the declared term          |
| `PREV_E2E` titles   | 86 source titles             | **86**                                         | **+0**, proved by `grep -c` before and after |
| `PREV_E2E` runs     | 105 runs                     | **105 passed**                                 | **+0** — the suite WAS run                  |
| `BASE_CHECK`        | 580                          | **581**, `0 ERRORS 0 WARNINGS`                 | **+1** — `wheels.ts`, a SOURCE file         |
| sweep members       | `4 19`                       | **`4 19`**                                     | **+0**                                      |
| catalog             | 27                           | **28**                                         | **+1** (plus `T14`, unresolved)             |
| `static/og/` files  | 27                           | **28**                                         | **+1**                                      |
| audition rows       | 23                           | **24**                                         | **+1**                                      |

**`wheels.ts` IS A SOURCE FILE, NOT A SPEC FILE, so `PREV_FILES` DOES NOT MOVE.**
The plan says so and it is repeated here because a reader expecting a new entry
to raise the file count would otherwise think the gate is wrong. **`BASE_CHECK`
DOES move**, because `svelte-check` counts source files.

**BOTH E2E NUMBERS ARE REPORTED, AND THE DECOMPOSITION WAS MEASURED RATHER THAN
INHERITED — BECAUSE THE INHERITED ONE IS WRONG.** The executor's brief says
*"`BASE_E2E` 103 decomposes as 85 chromium + 18 `@webkit` run twice"*. Counted
off this run's own log:

```
$ grep -oE "ok +[0-9]+ \[(chromium|webkit-phone)\]" e2e.log | ... | sort | uniq -c
     86 chromium
     19 webkit-phone
```

**86 + 19 = 105 runs, from 86 source titles.** The chromium project runs every
title; the webkit-phone project re-runs the **nineteen** `@webkit`-tagged ones on
a phone viewport. So the brief is wrong twice — **103 where the tree runs 105**,
and **85 / 18 where it is 86 / 19**. 11-13's carry-forward says 105 and is
correct. **Reported, not reconciled.**

`grep -c "test("` therefore proves a **zero** soundly — a new file or a new title
would move it — and any non-zero unsoundly, because adding or removing an
`@webkit` tag moves runs without moving titles. **Both numbers are zero-delta
here and both were checked.**

`npm run test:quick | node scripts/check-counts.mjs 84 868` exits **0**;
`84 866` exits **1**, *"tests: observed 868, expected 866"*. **Both were run and
both are reported.** `npm run test:sweep | node scripts/check-counts.mjs 4 19`
exits **0**. `npm run lint` clean. `npm run check` reads
**581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS**.

**Both new tests are `lua-smoke.spec.ts` 22 -> 24**, which is where 11-09.2,
11-10, 11-11, 11-12 and 11-13 each put an entry-pinned test. The plan names that
file directly.

### THE SWEEP TOTALS, AND WHICH ONES ROSE

| Sweep readout                 | Carried                                                | Observed                                                | Delta          |
| ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------- | -------------- |
| compiler route / reachability | Pass A **20,782**, Pass B 24,576, total **45,358**      | identical                                               | **+0**         |
| Lua route round trip          | Pass A **49,824** (w 49,424, x 382), Pass B 118,784, total **168,608** | Pass A **49,888** (w **49,487**, x 382), Pass B **131,072**, total **180,960** | **+64 / +12,288 / +12,352** |
| `lua-entries`                 | **1,176** combinations, 2,352 measurements              | **1,271** combinations, **2,542** measurements          | **+95 / +190** |
| kind cross-product            | 1,296 combinations, worst **906 of 908**                | identical                                               | **+0**         |

**AN EIGHTH INDEPENDENT CONFIRMATION THAT COMPILER PASS A CANNOT MOVE FOR A
HAND-AUTHORED LUA ENTRY.** Every rise is derived rather than observed-and-accepted:

- Lua Pass A **+64** = WHEELS' three non-colour knobs, 4 x 4 x 4.
- Lua Pass B **+12,288** = three colour knobs x 4,096 RGB444 literals.
- `lua-entries` **+95** = 3 colour knobs x 27 sampled literals + 3 non-colour
  knobs x 4 values + 2 corners.

WHEELS' own sweep row reads
`passA 64 passB 12288 format w payload 14 characters`.

### `static/og/`, DECOMPOSED RATHER THAN QUOTED

**28 files, 166,516 bytes.** `BASE_OG_BYTES` as 11-01 left it was **161,754 over
27 files**. `wheels.png` is **6,243 bytes**, so the other 27 now total **160,273**
— **1,481 fewer than 11-01 recorded**, and that difference is 11-11's, 11-12's
and 11-13's re-authoring of GHOST, SHUTTLE and STRIP rather than anything this
wave did. **The delta is not attributable to WHEELS alone and is not reported as
if it were.**

---

## `wild-stamps.json`: THE CONTRACT WAS READ FIRST, AND NOTHING WAS ADDED

`stamp.spec.ts:395-470` was read before the file was opened. The contract is
**not** "a record per entry":

- **36 records over 18 entries** — each entry at its defaults (payload `null`)
  and at a wild vector.
- Every payload is a **byte-for-byte literal captured at commit `b3f99bb`**,
  before format `w` existed. The file's whole value is that **it was never
  regenerated**.
- Two literal assertions: `expect(wild).toBe(18)` and `expect(nulls).toBe(18)`.
- The only requirement about the catalog is `toBeDefined()` — every record's
  entry must **still exist**.

**So a WHEELS record would have to be either a fabricated "capture" of history
that never happened, or a real capture from today — which is not history — and
either way it breaks `toBe(18)` twice.** **Nothing was added, and this is the
report the plan asked for in place of adding one.** `git diff --quiet HEAD~2 HEAD
-- src/lib/share/fixtures/wild-stamps.json src/lib/share/stamp.ts` exits **0**.

WHEELS' own stamp shape was checked all the same: six knobs, value counts
`[4,4,4,4,4,4]`, `(6 x 7 + 24) mod 32 = 66 mod 32 = 2`. No existing entry's shape
character moved, and `stamp.spec.ts` is green.

---

## THE AUDITION ROW, AND WHAT ONLY A MODULE CAN SETTLE

`docs/HARDWARE-AUDITION.md` gains **one checklist row and one cost-table row**,
taking the checklist from **whatever 11-14 left — which is 23, because 11-14 left
nothing — to 24**, renumbered contiguously, with `audition.spec.ts`'s `ROW_COUNT`,
its test title (*"twenty-four"*) and its ordering message all moved with it.

**Row 24, verbatim:**

> **WHEELS** — **(a) THE ONE THING ONLY A SYNTHESISER CAN SETTLE.** Hold a note,
> bend it to the top of the pad, and let go — twenty times, fast and slow, and
> once by lifting while your finger slides sideways off the wheel. **Does the
> note come back to true pitch, exactly, every time, or does it sit a hair
> flat?** **(b)** Watch the return at each of the four spring speeds: does it read
> as travel, or as a jump? **(c)** Hand the module to somebody who has not seen
> it and ask them what the two halves are, and where the boundary is.
>
> *Why it cannot be simulated:* A held note going out of tune is a thing you
> HEAR, and nothing in this repository listens: there is no synthesiser behind
> the simulator, so "the last logged bend is 8192" is a claim about a log and not
> about a note. Whether the spring reads as travel is a judgement about motion at
> 20 ms a step on real LEDs, and whether a stranger sees two controls and a
> divider rather than one confused picture is the legibility question D-11-12-b
> says nothing in the tree can ask.

The cost-table row reads **`wheels` | WHEELS | 882 | 338 | 6 | no**, measured at
the default knob positions like every other row, with a provenance paragraph
saying plainly that **WHEELS is NEW rather than re-measured** — the first row in
that table written by the wave that authored the entry — and pointing at this
document for the picker-corner margin. `D-11-10-b` is unchanged: four rows
examined in four waves, one stale, fourteen unchecked. **Four prose counts in the
document's own header moved with the row** (*eighteen* to *nineteen*,
*twenty-three* to *twenty-four* twice, and the dump's file counts), none of which
any spec gates.

---

## BOTH GATES, GREEN, WITH NO NEW ROWS IN EITHER TABLE

| Gate                                        | Rows before      | Rows after | Result         |
| ------------------------------------------- | ---------------- | ---------- | -------------- |
| `touch-guard.spec.ts` `DECLARED_EXCEPTIONS` | 2 (stage, forge) | **2**      | green, 3 tests |
| `decay-idiom.spec.ts` `KNOWN_VIOLATIONS`    | 0                | **0**      | green, 3 tests |

**A card written after the gates exist has no excuse for needing an exception,
and it does not have one.**

The live filter is the blessed spelling `if e~=1 and e~=4 and e<9 then`, which
`isLiveTest` classifies as live and test 2 skips by construction. The onset
beside it is `if e==4 or e>8 or c==nil then` — **a pure disjunction, so no
parenthesis is load-bearing here**, and that was checked rather than assumed
because `and` binds tighter than `or` and 11-12's trap is one clause away.

**The decay gate has nothing to check and that is by construction:** this entry
writes no `glt`, no `glf` and no `glpfs` at all. No keeper, no decay, no countdown
to freeze, no rate to wrap.

**On code 9:** `src/lib/sim/touch.ts` never emits it (`TOUCH-CODE-9.md`), so in a
browser a fast tap arrives as a 4 and a 5. **This card's signature gesture is a
plain LIFT, which the preview delivers completely** — 11-12's shape, chosen for
the same reason. Code 9 is handled anyway, for the module: the `e>8` arm inside
the pitch branch clears the contact, clears `s.h` and arms the spring, so a
coalesced tap bends and springs back in one message. Measured directly through
the host: **1 bend, then a 13-message spring landing on 8192.**
`PARITY_ALLOWANCES` is untouched and still empty.

---

## THE NEGATIVE CHECKS: SIX PLANTS, WITH BOTH EXIT CODES

**Every plant was restored from a scratch copy with `sha256` compared either
side. No `git checkout`, `git restore`, `git stash` or `git clean` was run at any
point.** `wheels.ts` reads
`1dc66364f7425927b67261b2e86d377c22f1081bc50b4f8b63d87cc99ccede4e` before every
plant and after every restore, **six times over**. Every plant was verified
**unique in the file and inside the Lua string, never in a comment**, before it
was run.

| #      | Plant                                                                          | Exit               | Reddened on                                                                                                                 |
| ------ | ------------------------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **1a** | the spring walks to **8190** instead of 8192 (`s.b=8190+d`)                     | **1** (restored 0) | *"THE TIMER STOPS WHEN THE SPRING LANDS"* and *"the spring SETTLED inside 4000 ticks"*, plus the fast-tap parity test        |
| **1b** | the walk still lands, but **the WIRE is sent two flat** — the light comes home  | **1** (restored 0) | the bend clause **alone**, naming both: *"MUST BE EXACTLY 8192... Observed 8190, which is -2 away"*                          |
| **2**  | **mod resets on lift** (`s.m=0` in the release branch)                          | **1** (restored 0) | the hold clause: *"and its light did not move either - still 6 rows: expected +0 to be 6"*                                   |
| **3**  | the bend **sent with `gmbs`** instead of `gms`                                  | **1** (restored 0) | the geometry precondition — *"BOTH halves must send PITCH BEND, status 224, through gms"* — in **both** tests                |
| **3b** | the bend correct **AND one `gmbs(1,0)` added beside it**                        | **1** (restored 0) | the rendered-Lua scan by knob (*"gmbs is an HID out-call"*) **and** the HID log: *"expected [ ...(1752) ] to deeply equal []"* |
| **4**  | the Timer's copy of the repaint uses **rail phase 40** where Setup uses 30      | **1** (restored 0) | the frame equality: *"after the spring the WHOLE PAD is byte-identical to the frame Setup painted"*                          |

Restored state re-run: **24 passed, exit 0.**

### PLANT 1a HUNG THE SUITE BEFORE IT FAILED IT, AND THAT COST A TEST CHANGE

The first run of plant 1a **did not redden — it never finished.** `s.b=8190+d`
makes the walk oscillate: `else d=0` sets d to 0, the next fire reads
`8190 - 8192 = -2`, `else d=0` again, for ever. The test's settle loop was
written `while (host.timerArmed) host.tick();` and simply never returned. The run
was killed at the ten-minute mark.

**A HANG IS NOT A RED.** It is a suite that never finishes and a reader who never
learns why, and it is a strictly worse outcome than a green plant, because a
green plant at least tells you the check is weak. The settle loop is now a
**bounded helper that asserts it terminated**, and plant 1a's second run reddens
on that assertion by name.

### PLANT 3 REDDENED ON THE WRONG CLAUSE, WHICH IS WHY 3b EXISTS

Plant 3 removed the `gms(...,224,...)` call entirely, so the geometry
precondition — which reads the bend status off the Lua before any drive — fired
first and **the HID assertions were never reached**. That is 11-10's finding: a
check that reddens on the wrong clause leaves its own clause untested. **Plant 3b
keeps the bend correct and merely ADDS a click**, which is the shape that
isolates the HID clause, and it reddens both halves of it.

---

## Deviations from Plan

### 1. [Rule 3 - blocking] Five of task 02's files moved in task 01's commit

- **Found during:** task 01
- **Issue:** the plan puts `listing.ts`, `front-door.ts`, `frames.json` and
  `docs/HARDWARE-AUDITION.md` under task 02. All four are coupled to the entry
  and leave the tree RED if they move separately: `listing.spec.ts` asserts the
  entry's description and the listing's are equal in both directions,
  `front-door.spec.ts` asserts the row-plus-excluded partition equals CATALOG,
  `frames.spec.ts` fails on an entry with no fixture record, and
  `audition.spec.ts` fails on a shipped entry with no checklist row.
- **Fix:** all four moved in task 01's commit, plus `audition.spec.ts`'s
  `ROW_COUNT`. Task 01 therefore leaves a green tree and task 02 is the tests
  that prove the behaviour. **This is the same deviation 11-11, 11-12 and 11-13
  each recorded.**
- **Commit:** `e2d1f6a`

### 2. [Rule 3 - blocking] Task 01's negative check needs task 02's tests

- **Found during:** task 01
- **Issue:** the plan asks task 01 to plant `gmbs` and *"expect the test in task
  02 to fail"*. That test does not exist during task 01.
- **Fix:** all six plants ran after the tests landed. All six are reported with
  both exit codes, and two of them found faults in the checks rather than in the
  card. **The same deviation 11-13 recorded.**
- **Commit:** `28cbc78`

### 3. [Rule 2 - missing critical functionality] Three censuses in three files no plan names

- **Found during:** task 01, by running the suites
- **Issue:** a new entry moves three RECORDED blocks that neither this plan's
  `files_modified` nor 11-01's blast-radius table names:
  - `src/lib/browse/filter.spec.ts` — `entries` 27 to 28, `modulation` 7 to 8,
    `expressive` 11 to 12, `precise` 6 to 7.
  - `src/lib/tune/colour-picker.spec.ts` — the colour-knob split `12 / 7 / 3 / 5`
    to `12 / 7 / 4 / 5`, and the three-colour list gains `wheels`. **WHEELS is
    the first entry to join the four worst cases the six-canvas colour-rail
    budget is measured against since that list was written.**
  - `src/lib/share/stamp-roundtrip.sweep.spec.ts` — `exempted` 29 to 32, because
    WHEELS declares three colour knobs. It still reconciles: 65 + 32 = 97.
- **Fix:** each re-counted with a paragraph saying which wave moved it and why,
  never silenced. **11-01 reported the first two the same way and for the same
  reason; this is the third occurrence of the same shape and it is now a
  pattern rather than an accident.**
- **Commit:** `e2d1f6a`

### 4. [judgement, reported] `self.D` withdrawn on a gate, and the gate is the thing at fault

- **Found during:** task 01
- **Issue:** `self.D=function(s)` plus `s:D()` is the cheapest correct shape,
  runs green in a live host, and is refused by `host-surface.spec.ts`.
- **Decision:** shipped `snake.ts`'s duplication instead and filed `D-11-15-a`,
  rather than widening a safety gate inside a wave that authors a card the user
  will flash. Detailed above.
- **Commit:** `e2d1f6a`

### 5. [judgement, reported] The plan's `grep -n "gmbs"` check is unsatisfiable as written

- **Found during:** task 01
- **Issue:** the plan asks for the grep to be empty AND for the header to explain
  why gmbs is wrong. Measured: `grep -c` returns **4**, all in prose.
- **Fix:** two assertions that a comment cannot move, detailed above, and the
  header now says plainly that the file-wide grep is not the check.
- **Commit:** `e2d1f6a`

### 6. [Rule 1 - bug] The divider was invisible at its first phase, and a probe found it

- **Found during:** task 01, first behaviour probe
- **Issue:** at phase 90 on one layer the divider rendered at **38** against the
  pitch rail's 50 and the mod rail's 46 — dimmer than both. A "lit divider" that
  is the darkest thing on the pad.
- **Fix:** phase 255 (one character) and a stronger default colour. It now
  measures **142**, and the ratio is asserted rather than left to the eye.
- **Commit:** `e2d1f6a`

### 7. [Rule 1 - bug] The hold test compared against a stale capture

- **Found during:** task 02
- **Issue:** the crossing-drag assertion compared the mod bar against
  `restingBar`, captured before a drive that deliberately moved it. The card was
  correct; the test was wrong, and it would have gone red on correct behaviour.
- **Fix:** re-read immediately before the drag, with a non-vacuity assertion
  beside it and a comment saying why the stale capture was wrong.
- **Commit:** `28cbc78`

**No other rule fired.** No missing dependency, no broken import, and no
architectural question — the entry stayed inside the two events it was given.

---

## Everything the plan asserts that the tree does not support

1. **"A STORED TIMER MAKES THE ENTRY ANIMATED WHATEVER ITS PICTURE IS DOING."**
   False. It is Setup arming the Timer and the body re-arming unconditionally
   that does. FORGE has shipped a 373-character Timer and `animating: false` at
   every tick since 09-07. The plan's `key_links` and `interfaces` both carry
   this claim, and its instruction to *"declare `animated` and let the fixture
   confirm it"* would have produced a card claiming motion it does not have —
   the one thing `front-door.ts` says must never be faked.
2. **THE SAME SECTION ASKS FOR THE OPPOSITE THING ONE PARAGRAPH LATER.** *"Stop
   the Timer when the spring lands... and assert it"* is incompatible with a
   permanently-animating card. This wave took the honest half of the pair.
3. **THE `gmbs` GREP CANNOT BE EMPTY** for a card whose header explains why gmbs
   is wrong, and a card that DID call it would satisfy that grep just as badly.
   Deviation 5.
4. **`self:D()` IS REFUSED BY A GATE THAT SHOULD ALLOW IT.** `D-11-15-a`. The
   plan invites a shared painter across both events and the tree cannot express
   the cheapest correct spelling of one.
5. **THE BRANCH TABLE CANNOT BE APPLIED, BECAUSE 11-14 RECORDED NO ANSWER.** The
   plan instructs the executor to *"copy the applicable row into the SUMMARY with
   the answer beside it"*. There is no `11-14-SUMMARY.md` and no answer. Stated
   as carried-plus-delta throughout instead.
6. **THE BRANCH TABLE'S PRESET/LUA SPLIT IS WRONG IN EVERY ROW.** It reads
   `8 + 20` under three branches and `9 + 20` under `new-entry`. The tree reads
   **9 + 19** after this wave: there are still nine PORTED preset entries — 11-05
   moved their DEFINITIONS into HANGAR, not their kind — and nineteen Lua ones.
   11-14's own handover found the table confused in the other direction; this is
   the same defect from the third side.
7. **THE PLAN CLAIMS THE AUDITION ROW COUNT IS "23 -> 24 UNDER THREE OF 11-14'S
   FOUR ANSWERS".** True as arithmetic and unusable as an instruction, because
   the number to add to is only knowable once 11-14 lands. Read off
   `audition.spec.ts` (23) and moved by one.
8. **`PREV_TESTS` +2 IS RIGHT, BUT `BASE_CHECK` +1 IS NOT ANTICIPATED ANYWHERE.**
   The plan's verification block asserts `PREV_FILES PREV_TESTS+2` and says
   explicitly that no spec file is created — correct — but nothing in it says
   `npm run check` moves from 580 to 581. It does, because `wheels.ts` is a
   source file and `svelte-check` counts source files.
9. **`src/lib/sim/lua-smoke.spec.ts`'s header still opens "Thirteen tests"**, and
   the file now carries **24**. **Not corrected here**, for the reason 11-10 to
   11-13 each left it: it is one of the stale header counts **11-16 owns**, and
   correcting one would make the rest look checked.
10. **THE PLAN NAMES ITSELF AS THE THIRD OF FOUR SUITE RUNS.** Its own
    `<verification>` says *"This is the third of the four suite runs in the
    phase — 11-01, 11-05, this plan, 11-16"*, while 11-13's carry-forward says
    the suite-running plans are **five**: 11-01, 11-05, **11-08.1**, 11-15,
    11-16. **The two documents disagree and this SUMMARY does not reconcile
    them.** What is measured here is only that **this plan ran the suite**, at
    105 runs from 86 source titles, and that the disagreement is reported for
    11-16 rather than resolved by an executor.

---

## Invariants, each proved by a command

| Claim                                             | Command                                                                | Result                                                              |
| ------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| both gates green, no new rows                     | `decay-idiom.spec.ts`, `touch-guard.spec.ts`                            | **green, 3 + 3**; tables 0 and 2, unchanged                          |
| `frames.spec.ts` green with no `UPDATE_FRAMES`    | re-run in the server project after the regeneration                     | **green, 5 tests**                                                   |
| `src/vendor/` untouched by this plan              | `git diff --quiet HEAD -- src/vendor/`                                  | **exit 0**. No manifest row declared                                 |
| `src/vendor/` unmoved since 11-04                 | `git diff --stat 4131ff5 HEAD -- src/vendor/`                           | the recorded **four-file** output (`_pad.ts` 70, `pad-sim.ts` 29, `tests/pad-sim.test.js` 19, `tests/pad.test.js` 7) |
| `firmware-oracle.spec.ts` green and unedited      | `git diff --quiet HEAD~2 HEAD -- ...`; run                              | **exit 0**; green                                                    |
| `upstream-manifest.json` untouched (**14th** wave) | `git diff --quiet HEAD~2 HEAD -- ...`                                  | **exit 0** — the four mislabelled *"free at its worst knob position"* rows stand for 11-16 |
| configs and roadmap untouched                     | `git diff --quiet HEAD~2 HEAD -- playwright.config.ts vite.config.ts .planning/ROADMAP.md` | **exit 0**                                |
| `stamp.ts` and `wild-stamps.json` untouched       | `git diff --quiet HEAD~2 HEAD -- ...`                                   | **exit 0**                                                           |
| `demo.ts` untouched, and WHEELS has no path       | `git diff --quiet HEAD~2 HEAD -- src/lib/sim/demo.ts`; `DEMO_PATHS` read | **exit 0**; keys are `ghost` and `morph` only                       |
| `gmbs` absent from the LUA at every knob value    | `lua-smoke.spec.ts`, 24 renderings x 2 events x 3 names                 | **green**; the file-wide grep returns 4, all prose                    |
| no HID reaches the host                           | `host.hid` after the whole drive                                        | **`[]`**; a plant with one `gmbs` records **1,752**                  |
| `svelte-check`                                    | `npm run check`                                                          | **581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS**              |
| lint                                              | `npm run lint`                                                           | **clean** (prettier + eslint)                                        |
| build                                             | `npm run build`                                                          | **exit 0**; writes only gitignored paths (`build/`, `static/og/`, `.svelte-kit/`) |
| quick suite after the build                       | `npm run test:quick`                                                     | **84 files / 868 tests + 1 todo, exit 0**                            |
| e2e term `+0`, both numbers                       | `grep -c "test(" e2e/*.e2e.ts`; `npx playwright test --workers 3`         | **86 titles** before and after; **105 passed** in 2.5 min            |
| no server was stale                               | probed `127.0.0.1:4173` before building (no server), then built, then ran | Playwright started its own                                          |
| no commit during a Playwright run                 | the suite finished and `test-results/` was removed before either commit   | —                                                                    |
| `test-results/` removed by hand                   | `rm -rf test-results`                                                    | `git status --porcelain` empty                                       |
| canonical form and syntax                         | `lua-entries.sweep.spec.ts` tests 1, 3, 6                                | **green** across 1,271 combinations                                  |
| no sibling repository touched                     | none read or written                                                     | —                                                                    |
| nothing hardware-verified                         | no agent connected to or wrote to a device                               | —                                                                    |
| nothing deployed                                  | no `wrangler`, no `npm run deploy`                                       | —                                                                    |
| tree clean                                        | `git status --porcelain`                                                 | empty before this SUMMARY                                            |

Three scratch measurement specs were used (`zz-sketch`, `zz-cost`, `zz-hist`) and
one scratch behaviour probe (`zz-behave`), **all four deleted before any commit**;
they do not appear in the file count, and `npm run check` reads 581 with them
gone.

---

## WHAT IS NOT CLAIMED

**Nothing here is hardware-verified.** The user asked for this configuration from
a bench and only a bench can confirm it. **No agent connected to a device, wrote
to a device, or deployed anything.**

**"The spring returns in MIDI" is proved against a LOG, not against a note.**
There is no synthesiser behind the simulator. That the last recorded bend is the
integer 8192 is a claim about `host.midi`; that a held note comes back to true
pitch is row 24(a), and only a bench closes it.

**"Beautifully visualized" is not claimed at all.** 11-12 established that an
illegible card is fully green, and the two assertions added here — the divider
standing clear of both rails, and the two wheels drawing different shapes — narrow
that gap without closing it. They prove the three elements draw distinguishable
pictures, not that a stranger can name which is which. That is row 24(c).

**The 1024-position claim rests on the simulator's model of the sensor.** The
assertion that pitch resolves 512 distinct bends over half its travel is
arithmetic over coordinates the host generates; the module is the thing that
actually has the sensor.

**The `self` closure question is only half answered.** `self.touch_cb` proves
firmware's `self` accepts a stored function, and the withdrawn `self.D` ran green
in the browser host, but no agent put either on a module.

---

## Commits

| Hash      | Message                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| `e2d1f6a` | `feat(11-15): two wheels on one pad, a spring that lands on exactly 8192, and a natural shape that missed by 210`   |
| `28cbc78` | `test(11-15): the spring lands on the centre literal at all four speeds, and a light that comes home while the wire does not` |

---

## Carry-forward for the next wave

**`PREV_FILES` 84 · `PREV_TESTS` 868 · `PREV_E2E` 86 source titles / 105 runs ·
`BASE_CHECK` 581 · sweep members `4 19` · catalog 27 + 1 (this plan) + `T14`
= 28 today · preset/Lua 9 + 19 · `static/og/` 28 files, 166,516 B · audition 24
rows**

**Sweep totals:**

- compiler route **Pass A 20,782**, Pass B 24,576, **total 45,358** — unmoved
- Lua route **Pass A 49,888** (format w 49,487, format x 382), Pass B **131,072**,
  **total 180,960**
- `lua-entries` **1,271 combinations, 2,542 measurements**
- kind cross-product 1,296 combinations, **worst 906 of 908** — unmoved

**Entry headers or plans found quoting something other than the RGB444 picker
corner: still SEVEN.** WHEELS is the **twelfth** entry checked and the **first
authored against the picker corner from the start**, so it neither adds to that
count nor is correct by accident. **Ten headers have never been checked. 11-16
owns the sweep.**

**Suite-running plans: the two documents disagree.** 11-13's carry-forward says
five (11-01, 11-05, 11-08.1, 11-15, 11-16); this plan's own verification says
four (11-01, 11-05, 11-15, 11-16) and instructs the executor to say *"four, not
three"*. **Reported, not reconciled — 11-16 owns it.**

**Seven open items handed forward:**

1. **`D-11-15-a` — `host-surface.spec.ts` cannot express an entry-installed
   `self:` method.** New. The gate refuses a call that works and that every entry
   already relies on through `self.touch_cb`. A concrete widening is proposed
   above.
2. **11-14 IS STILL OPEN AT ITS CHECKPOINT.** This wave ran ahead of it safely,
   and its `T14` term is still `+0` or `+1` as its four options say. Its SUMMARY
   should state `28 + T14`, and its branch table's preset/Lua column should read
   `9 + 19` plus its own term rather than `8 + 20`.
3. **The plan's `animated` premise, corrected.** Recorded above with FORGE as the
   counter-example, so no later wave re-derives it.
4. **`D-11-12-b` is AMENDED AGAIN, not closed.** A third narrow legibility claim
   (the divider against both rails, as a ratio, naming no colour) joins 11-13's
   two. Still nothing asserts a card is *readable*.
5. **`D-11-12-a` — nothing catches a Timer re-armed with a period of zero**,
   carried unchanged. WHEELS never computes a period, so it does not touch it —
   but it DID find the neighbouring hole: `lua-host.ts` returns early on a zero
   period **without clearing the deadline**, so a card that stopped itself with
   `gtt(0,0)` would stop on the module and keep running in the preview.
6. **`D-11-10-b` is unchanged at four rows examined, one stale, fourteen
   unchecked** — WHEELS' row is new rather than re-checked, so it adds nothing to
   that tally.
7. **The LUMEN depth discrepancy, unchanged and unreconciled** (carried from
   11-09.2 onwards). Only the bench closes it.

---

## Known Stubs

**None.** Nothing was stubbed. Both wheels, the divider, the origin lock, the
held-finger guard, the spring, the Timer's disarm and both message streams are
complete, reachable and driven by the two tests; every property the entry
declares is derived from the fixture rather than asserted by hand.

**Four things are deliberately absent and are named rather than left as edges:**

- **8192 is not reachable by a finger.** The one value a finger cannot hold is
  the one the spring guarantees. A centre detent was costed at 922 of 908.
- **The pitch wheel sends far finer than it draws.** 1024 positions through nine
  rows: the marker moves once every 114 positions, and between two steps of the
  picture the bend is still moving. That is what a wheel with an LED readout is.
- **A contact that begins on the divider does nothing.** That is the geometry
  being honest, and it is written into the header rather than discovered later.
- **The picture is a readout of the last value YOU sent.** Nothing in this phase
  receives (D-04), so a wheel moved at the other end leaves this pad with nothing
  to say.

---

## THE STATE.md TOOLING, AND FOUR THINGS IT MOVED WITHOUT BEING ASKED

`.planning/STATE.md` was **copied before every command** and diffed line by line
after each. The warning that `advance-plan` destroys the Status line is now at
**twelve consecutive waves**, and this wave found **three more** faults beside
it.

| # | Command | What it did | Repair |
| - | ------- | ----------- | ------ |
| 1 | `state advance-plan` | **DESTROYED the Status line.** 11-13's whole narrative was replaced by `Status: Ready to execute` and **was not demoted** to a `Previous status, retained (11-13):` line — it was simply gone. | Inverse edit: 11-13's text restored verbatim from the pre-command copy as `Previous status, retained (11-13):`, and a new `Status:` written for 11-15. **Every line below the splice diffed: 0 diverge**, at a one-line offset. |
| 2 | `state advance-plan` | **Left the Plan line at 11-13.** The counter went 16 to 17 but the prose named sixteen plans. | Extended to name 11-15, and to say in the same line that **11-14 is NOT in the list and is NOT complete** — the seventeen is seventeen SUMMARY files, not seventeen contiguous waves. |
| 3 | `state record-session` | **DESTROYED the previous `Stopped at:` line the same way.** *"Completed 11-13-PLAN.md"* was overwritten and not demoted, and the retained chain below it already jumped from **11-13 straight to 10-12** — so this has been silently eating one entry per wave for the whole of phase 11. **This is a NEW finding; no prior SUMMARY records it.** | `Previous stop, retained: Completed 11-13-PLAN.md` inserted by hand. The earlier losses (11-12 back to 10-13) are **not** reconstructed here — they are gone from the file and only the git history has them. |
| 4 | `state advance-plan` and `state record-metric`/`record-session` | **BOTH write the frontmatter `status:` field, and they disagree.** `advance-plan` set it to `executing` (a value it has never held before in this project); it was corrected by hand to `paused`, which is what the tool itself chose after 11-12's open checkpoint; and `record-session` then **overwrote it back to `verifying`**. Left at `verifying` rather than fought over a third time. **`executing` would have been actively wrong** — no agent is running, and 11-14 is stopped awaiting a person. | Reported, not re-edited. |

`state add-decision` was **clean**: three decisions added, one timestamp moved,
nothing else touched. `state record-metric` added
`| Phase 11 P15 | 70min | 2 tasks | 10 files |` correctly, and **there is no
`Phase 11 P14` row**, which is right — 11-14 has shipped nothing.

**`roadmap update-plan-progress` was NOT run**, as instructed, and
`.planning/ROADMAP.md` is byte-untouched.

**Frontmatter `percent` still reads 100** and has since before this phase began.
**Left alone and reported**, as instructed.

### AND `requirements mark-complete` WAS DELIBERATELY NOT RUN

The plan's frontmatter lists `[CONT-02, CONT-03, CAT-01, CAT-04, SHARE-04]`. Read
against `.planning/REQUIREMENTS.md`:

- **CONT-02, CONT-03, CAT-01 and SHARE-04 are ALREADY `[x]`.** Marking them again
  moves nothing.
- **CAT-04 is `[ ]` AND HAS BEEN DELIBERATELY LEFT UNCHECKED THREE TIMES** — by
  10-06, 10-07 and 10-14, each of which wrote out why: *"CAT-04's subject is the
  SHAPE of the catalog data file — Profile-Cloud-shaped config objects plus
  tuning metadata, buildable with no backend — and nothing in this phase touched
  that."* **Nothing in this plan touched it either.** It added a record to the
  catalog; it did not change the shape of the file.

**Running the command as the plan's frontmatter lists it would have ticked CAT-04
and reversed a decision three waves recorded in writing.** It was not run, and
`REQUIREMENTS.md` is byte-untouched. **This is reported as a defect in the plan's
frontmatter** rather than acted on: `CAT-04` does not belong in its
`requirements` list.

---

## Self-Check: PASSED

- `src/lib/catalog/entries/wheels.ts` FOUND, `src/lib/catalog/index.ts` FOUND,
  `src/lib/catalog/listing.ts` FOUND, `src/lib/catalog/front-door.ts` FOUND,
  `src/lib/catalog/frames.json` FOUND, `src/lib/catalog/audition.spec.ts` FOUND,
  `src/lib/browse/filter.spec.ts` FOUND, `src/lib/tune/colour-picker.spec.ts`
  FOUND, `src/lib/share/stamp-roundtrip.sweep.spec.ts` FOUND,
  `src/lib/sim/lua-smoke.spec.ts` FOUND, `docs/HARDWARE-AUDITION.md` FOUND,
  `.planning/phases/11-bench-corrections/11-15-SUMMARY.md` FOUND.
- `e2d1f6a` FOUND in `git log --oneline --all`; `28cbc78` FOUND.
