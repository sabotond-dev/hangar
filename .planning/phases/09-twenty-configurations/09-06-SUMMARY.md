---
phase: 09-twenty-configurations
plan: 06
subsystem: catalog
tags:
  [
    CONT-02,
    CONT-03,
    TUNE-01,
    lua-entries,
    hid,
    keystrokes,
    colour-picker,
    show-control,
    non-vacuity,
    D-04,
    deferred-items,
    chip-row,
  ]

# Dependency graph
requires:
  - ".planning/phases/09-twenty-configurations/09-05-SUMMARY.md - the rolling pair PREV_FILES 74 / PREV_TESTS 780 (+1 todo), BASE_SWEEP `4 19` at 482 combinations over sixteen Lua entries, PREV_E2E 89, svelte-check 556, KNOWN_TAGS 47, chip row 22, ROW_COUNT 21, RECORDED 25 / 47 / 25 and { entries: 25, featured: 11 }, PHASE_ADDED_AT = 2026-09-07 copied verbatim, and A HEADER CLAIM MUST NOT COUNT ITSELF, which is why every trap claim in this wave's three headers is made about the stored Lua"
  - ".planning/phases/09-twenty-configurations/09-01-SUMMARY.md - HOST_GLOBALS (15) and HOST_SELF_METHODS (9). gks, gmms and gmbs are IN HOST_GLOBALS and callable bare, and they are recorded and inert; lua-host.ts:429 says nothing in HANGAR consumes them. That one fact is the whole shape of this wave"
  - ".planning/phases/09-twenty-configurations/09-02-SUMMARY.md - PHASE_ADDED_AT, the five copy rules, and the exact spot in lua-smoke.spec.ts test 2 that 09-02 marked for the HID non-vacuity half. This plan lands it"
  - ".planning/phases/09-twenty-configurations/09-03-SUMMARY.md - A PERIOD THAT RE-ISSUES AN ANIMATION IS CHOSEN TO BE PHASE-ALIGNED (HOLD's 2560 ms), which STAGE keeps and then declines to use, for a reason recorded below"
  - "09-CONTEXT.md D-01..D-12 and the amendment block - every entry is kind: \"lua\", and D-02 keeps the front-door ring at eight"
  - ".planning/research/ZONA-CAPABILITIES.md 3.1, 3.4 and 435-437 - the 256-byte per-cycle buffer, gks(default_delay, is_modifier, state, keycode, ...) with its (nargs-1) % 3 rule, and the statement that HID is recorded and never simulated"
  - ".planning/research/USE-CASES.md V3, V5 and N2 - the lighting colour picker ranked fifth of forty-four, the OBS switcher that needs no plugin, and the J/K/L shuttle"
  - "USB HID Usage Tables, Keyboard/Keypad page 0x07 - the source of every usage id in STAGE and SHUTTLE. Named because no gate in this repository can catch a wrong one"
provides:
  - "The rolling pair for 09-07: PREV_FILES 74, PREV_TESTS 780 (+ 1 todo) - unchanged, as an entry wave must be, even though this one DID edit a test file"
  - "Three configurations: LUMEN (two-axis colour field, featured), STAGE (nine scenes over plain keystrokes), SHUTTLE (a keystroke shuttle whose spin is its speed). Twenty-eight catalog entries, nineteen of them hand-authored Lua"
  - "The sweep is 543 combinations over nineteen entries (482 + 17 + 18 + 26); the test count is still 6"
  - "THE HID NON-VACUITY HALF IS LANDED. lua-smoke.spec.ts test 2 now asserts at least one entry produced HID as well as at least one producing MIDI, and both halves pass. The file is still exactly 3 tests"
  - "The standing chip row at twenty-eight entries: TWENTY-THREE chips, up from twenty-two. hotkeys arrives as a chip in the same wave that coins it, because STAGE and SHUTTLE carry it together"
  - "KNOWN_TAGS 47 -> 51: lighting, streaming, hotkeys, video"
  - "docs/HARDWARE-AUDITION.md at twenty-four rows, ROW_COUNT 24, and a cost table of nineteen. Row 23 is the load-bearing one: every keystroke configuration in the catalog is unverified until it is run"
  - "deferred item 2: keystroke configurations animate correctly and prove nothing about their output"
  - "A DECLARED MOTION IS A PROMISE ABOUT THE PICTURE, NOT A READING OF THE ENGINE. For a Lua entry the engine reports `host.animating || host.timerArmed`, so ANY entry with a stored Timer classifies as animated whatever its pad is doing. SHUTTLE's first draft was a still ring the fixture called animated; the ring was given real motion rather than the declaration being bent"
affects:
  - "09-07 to 09-09 - CULL, FORGE and SWITCH are the next keystroke entries and inherit the gks arity check, the usage-table rule, the honest-limit wording and deferred item 2"
  - "09-10's phase gate - ROW_COUNT is 24 as this plan leaves it and the cost table is nineteen; deferred-items.md holds two items"
  - "05.1-UI-SPEC.md, The tag chips and the ASCII mock - re-taken at twenty-eight by this plan"

tech-stack:
  added: []
  patterns:
    - "A DECLARED MOTION MUST BE TRUE OF THE PICTURE, NOT OF THE ENGINE. lua-pad-sim.ts:150-152 returns `host.animating || host.timerArmed`, and a Timer that re-arms itself never settles - so every Lua entry with a stored Timer is `animated` by derivation regardless of what its pad does. front-door.ts says this field is 'never guessed and never aspirational' and that 'faking motion here would be faking the one thing the product claims'. When the derivation and the pad disagreed, the PAD was changed"
    - "A PHASE STAGGER IS WHAT MAKES A RING SPIN RATHER THAN PULSE. Sixteen cells given phases j*16 sit at sixteen evenly spaced points of the same 0..255 gradient, so one shared rate moves a bright point around the circle. Sixteen times sixteen is 256, which wraps to 0, and that is why the spacing is exact. Set the stagger once in Setup and let every later write touch colour and rate only"
    - "THE UINT8 PHASE WRAP IS A REVERSE GEAR. Advancing a phase by 256 - r each tick IS advancing it by -r. SHUTTLE turns the transport direction into a spin direction for the price of one subtraction - and pays for it by dropping its keeper from 65535 to 30000, because a maximum timeout beside a rate of 248 is exactly pitfall 1's signature"
    - "A SHUTTLE RUNS WHILE YOUR FINGER IS DOWN. A speed that survives the lift is a transport that scrubs forever, and a DOWNUP tap arrives with no lift behind it, so a latching speed set by a tap can never be cleared by the gesture that set it. `(e==1 or e==4) and expr or 0` is the whole handler, and it is safe at zero because 0 is TRUTHY in Lua"
    - "CHECK A DIVISOR AGAINST THE INDEX THAT DIVIDES IT, NOT AGAINST TASTE. The obvious depth ramp anchor*(@DEPTH-row)//@DEPTH is NEGATIVE at @DEPTH 6 and exactly BLACK at @DEPTH 8, because the row index reaches 8. Subtracting a multiple from a fixed 36 cannot do either, and 8*4 = 32 < 36 is the whole proof"
    - "A SUPERLATIVE IN A HEADER IS A MEASUREMENT, AND IT IS MEASURED AGAINST THE WHOLE FIXTURE. LUMEN's 'most lit card in the catalog' was checked against the three entries of the previous wave and was wrong: the ported starfield holds 222 to 226 non-zero bytes and CHORUS a flat 198, against LUMEN's 171. Rank claims are made over Object.entries(frames.json), never over the neighbours you happen to remember"

key-files:
  created:
    - "src/lib/catalog/entries/lumen.ts"
    - "src/lib/catalog/entries/stage.ts"
    - "src/lib/catalog/entries/shuttle.ts"
    - ".planning/phases/09-twenty-configurations/09-06-SUMMARY.md"
  modified:
    - "src/lib/catalog/index.ts"
    - "src/lib/catalog/listing.ts"
    - "src/lib/catalog/front-door.ts"
    - "src/lib/catalog/frames.json"
    - "src/lib/catalog/copy.spec.ts"
    - "src/lib/catalog/audition.spec.ts"
    - "src/lib/sim/lua-smoke.spec.ts"
    - "src/lib/browse/filter.spec.ts"
    - "src/lib/browse/sort.spec.ts"
    - "docs/HARDWARE-AUDITION.md"
    - ".planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md"
    - ".planning/phases/09-twenty-configurations/deferred-items.md"

decisions:
  - "LUMEN's depth term is anchor*(36 - row*@DEPTH)//36 with @DEPTH in 1..4, not the plan's anchor*(@DEPTH-row)//@DEPTH with @DEPTH in 6, 8, 10, 12. The plan's form is negative at 6 and exactly black at 8, and the plan's own instruction was to keep the bottom row visible"
  - "LUMEN ships the nine-entry anchor table at 604 characters even though the computed six-segment ramp measured 594 - ten characters CHEAPER. The ramp is a pure hue wheel with 135 non-zero bytes; the table has 171. Ten characters of 908 against thirty-six bytes of picture is not a trade worth taking"
  - "LUMEN's ninth anchor is an amber white, 255,230,190, not a ninth hue. A lighting desk's most-used colour is white and a picker without one is missing its first choice; it is also the only three-channel column and is worth nine of the 171 non-zero bytes"
  - "LUMEN is NOT the most lit card in the catalog. Measured over the whole fixture it is third, behind the ported starfield (222 to 226) and CHORUS (198). The header now says so"
  - "SHUTTLE's lift STOPS the shuttle. Every event that is not a press or a move sets the speed to zero, including the DOWNUP tap the plan called harmless. A latching speed is a video that scrubs forever, and a tap has no lift behind it to clear it"
  - "SHUTTLE is declared `animated`, and its ring was given a real slow drift to make that true. The fixture classifies any Lua entry with a stored Timer as animated; rather than ship a still pad wearing that word, the sixteen ring phases were staggered by j*16 and given an idle rate of 2"
  - "SHUTTLE's backward key is a SIXTH KNOB, not an arithmetic partner. L to J is minus two, right arrow to left arrow is PLUS one, and full stop to comma is minus one - no single relation is right on more than one setting, and a wrong key is a card that does something nobody asked for"
  - "SHUTTLE's timeout is 30000, not a 65535 keeper. The backward rate is 256 - @GAIN*k, which reaches 248, and a maximum timeout beside a rate above 200 is pitfall 1's exact signature. The Timer refreshes 30000 every period, which answers the 655 s ceiling just as completely"
  - "SHUTTLE paints BOTH layers. On layer 2 alone the arc measured 0/99/126 at its brightest against 0/198/253 on two, and a card whose whole picture is one shape cannot afford to be half lit"
  - "STAGE's Timer refreshes glt and does not re-issue glpfs. The phase a cell is at depends on when the FINGER armed it, not on the Timer's period, so a re-issue snaps the breathe to black mid-breath at an arbitrary moment. The period is still HOLD's 2560 ms"
  - "STAGE ships the two dead modifier tuples rather than a branch. Measured: a branch on @MOD costs 35 MORE characters and saves eight bytes of a 256-byte buffer on a call that happens once per press"
  - "The delay, the two breathe rates and the Timer period in STAGE are LITERALS, not knobs. The plan's prose names @DELAY, @RATE and @PERIOD but its knob table has exactly four knobs, and the table is what catalog.spec.ts gates"
  - "KNOWN_TAGS was updated in the TASK 1 and TASK 2 commits rather than in task 3, because copy.spec.ts test 3 gates the vocabulary in both directions and each task's own acceptance criterion asks for 5 passed"

requirements-completed: []
requirements-contributed: [CONT-02, CONT-03, TUNE-01]

# Metrics
duration: 55min
completed: 2026-09-07
---

# Phase 9 Plan 06: LUMEN, STAGE and SHUTTLE — Summary

A colour picker that needs no legend, a scene switcher that works on a machine with nothing
installed, and a shuttle whose spin is the number it is sending — plus the assertion 09-02 could not
make, landed in the same commit as the first two configurations that make it true, and a fixture
that caught a card declaring a motion its pad did not have.

---

## The seven-name block

| Name | Value | Where it came from |
| --- | --- | --- |
| `BASE_FILES` | **73** — **frozen** | 09-01, the clean tree Phase 7 closed at `34d0fd6`. Carried forward unchanged |
| `BASE_TESTS` | **776** (+ 1 todo) — **frozen** | 09-01. Carried forward unchanged |
| `PREV_FILES` | **74** | measured by this plan: ` Test Files  74 passed (74)` — `PREV_FILES + 0` |
| `PREV_TESTS` | **780** (+ 1 todo) | measured by this plan: `      Tests  780 passed \| 1 todo (781)` — `PREV_TESTS + 0` |
| `BASE_SWEEP` | **`4 19`** | re-measured here, unchanged |
| `BASE_E2E` | **89** — **frozen** | 09-01. **Not re-measured**; this plan adds no e2e title and the plan does not ask for a run |
| `PREV_E2E` | **89 (measured by 09-01)** | copied verbatim |

**Observed totals as baseline plus delta.**

- quick: `PREV_FILES 74 + 0 = 74`, `PREV_TESTS 780 + 0 = 780` (+ 1 todo, reported and never
  asserted). `check-counts 74 780` printed *"matches the expected counts"*.
  **The delta was computed rather than assumed, and this wave had a reason to check it:** unlike
  09-03 to 09-05 this plan DID edit a test file. `lua-smoke.spec.ts` gained an assertion **inside an
  existing `it`**, not a new one, so the file stays at 3 and the total stays at 780. Three
  configurations moved no count either, because every catalog gate loops over the entries
  internally.
- sweep: `BASE_SWEEP 4 19 + 0 = 4 19`. The growth is paid in wall time: **482 + 61 = 543
  combinations** over **16 + 3 = 19** hand-authored entries (LUMEN 17, STAGE 18, SHUTTLE 26).
- svelte-check: `556 + 3 = 559` files, `0 errors, 0 warnings`. The three new files are the three
  entries. Provenance only — the count line is never asserted.
- e2e: **not run.**
- catalog: `25 + 3 = 28`. Lua entries `16 + 3 = 19`. `EXCLUDED_FROM_ROW` `17 + 3 = 20`.
  **`FRONT_DOOR` is byte-untouched and still eight** (D-02).

`PHASE_ADDED_AT` is **`2026-09-07`**, copied verbatim into `lumen.ts`, `stage.ts`, `shuttle.ts` and
their three `LISTING` rows. Nobody used a run date.

---

## LUMEN

**The card.** A colour picker for a lighting desk. Hue runs across, depth runs down, and the pad
paints itself in the colour it is about to send. No legend.

### Route note

`kind: "lua"`. The field is eighty-one DISTINCT COMPUTED COLOURS and the `look` sheet has no such
thing. `look.kind` is one of none, breathe, shimmer, scan, wave, swirl, ripple, drift and showpiece
(`_pad.ts:161-170`), every one of them carries exactly one `colour`, and `colourB` is read only by
drift and showpiece (`_pad.ts:2624`). The nearest is `drift`, which ramps between those two colours
along x and animates — one axis, two colours, no way to darken by row. A two-axis per-cell colour
map is not expressible as a `PadState`.

### Canonical Setup at the defaults, verbatim (604)

```
--[[@cb]]local H={255,90,0,200,255,0,30,255,0,0,255,150,0,150,255,30,0,255,200,0,255,255,0,100,255,230,190}local function F(n)local a=glag(0,n)local i=n%9*3 local d=36-n//9*3 local r=H[i+1]*d//36 local g=H[i+2]*d//36 local b=H[i+3]*d//36 glc(a,1,r,g,b,1)glc(a,2,r,g,b,1)glp(a,1,255)glp(a,2,255)end for n=0,80 do F(n)end self.c=-1 self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then return end local n=x*9//128+y*9//128*9 if n~=s.c then if s.c>=0 then F(s.c)end local a=glag(0,n)glc(a,1,255,255,255,1)glc(a,2,255,255,255,1)s.c=n end s:gms(0,176,16,x*127//128,0)s:gms(0,176,16+1,y*127//128,0)end
```

### Canonical Timer at the defaults, verbatim (0)

```

```

The empty string, the shape MORPH, SLAM, KEYS, GRIDLOCK, TABLE, CONSOLE, STRIP and LEARN use.

### The substitution table

| Token | Knob id | Needle in the canonical text | Sites | Default |
| --- | --- | --- | --- | --- |
| `@CC` | `cc` | the `16` of both `s:gms(0,176,16…)` — one bare, one as `16+1` | 2 Setup, 0 Timer | index 0 |
| `@CH` | `channel` | the leading `0` of both `s:gms(0,…)` | 2 Setup, 0 Timer | index 0 |
| `@CURSORC` | `cursor` | `255,255,255` in the two cursor `glc` | 2 Setup, 0 Timer | index 0 |
| `@DEPTH` | `depth` | the trailing `3` of `local d=36-n//9*3` | 1 Setup, 0 Timer | index 2 |

`36` (the depth divisor), `255` (the phase), `-1` (the cursor sentinel) and `127//128` are
**literals, not knobs**, and the header says why for each. The divisor is never a knob because a knob
on it could take the bottom row to black.

### Six numbers, and the corner

| | Setup | Timer |
| --- | --- | --- |
| defaults | **604** | **0** |
| all-longest corner | **608** | **0** |
| all-shortest corner | **604** | **0** |

**Free at the worst corner: 300 of 908.** **Combinations: 17** (`4+4+3+4 + 2`).

### The two hue forms, both measured, and which shipped

| Form | Setup at the defaults | Non-zero bytes at tick 0 |
| --- | --- | --- |
| **Nine-entry flat anchor table** (`local H={…27 numbers…}`) | **604** | **171** |
| Computed six-segment ramp (`local function W(c,p)local d=(c-p)%9 if d>4 then d=9-d end return glim(255-d*85,0,255)end`) | **594** | **135** |

**The ramp is ten characters cheaper and it did not ship.** Its wheel is mathematically clean and
puts a bare primary on columns 0, 3 and 6, each of which is a ONE-channel colour; the count falls
from 171 to 135. Ten characters of a 908-character budget with 300 already free, against thirty-six
bytes of picture on the phase's most photogenic card, is not a trade worth taking. Both numbers are
recorded because the plan asked for both, and the header names the one that shipped.

### The ninth column is an amber white, and it is not a fudge

Eight of the nine anchors are a hue wheel at full saturation, forty-five degrees apart and offset so
no column lands on a bare primary. The ninth is **255,230,190**. A lighting desk's most-used colour
is white; a picker with no white is missing its first choice. It is also the only three-channel
column in the field and is therefore worth exactly nine of the 171 non-zero bytes on its own, and a
pure white cursor still reads against it.

### The colour arithmetic, checked at all four corners

Channels truncate rather than clamp, so both ends were proved rather than assumed.

| corner | `d` | rendered |
| --- | --- | --- |
| top left (col 0, row 0) | 36 | `253/89/0` — the anchor `255,90,0` at the two-layer render |
| top right (col 8, row 0) | 36 | `253/228/188` — the amber white |
| bottom left (col 0, row 8, `@DEPTH` 3) | 12 | `84/29/0` |
| bottom right (col 8, row 8, `@DEPTH` 3) | 12 | `84/75/62` |

Upper bound: every anchor channel is at most 255, `d` is at most 36 and the divisor is 36, so
`anchor*d//36 <= 255`. The maximum is attained on row 0 and IS the anchor. Lower bound:
`d = 36 - 8*@DEPTH` at the bottom row is 28, 20, 12 or 4 — positive at every knob value, because
`8*4 = 32 < 36`.

### The tick-0 non-zero byte count, and the rank claim corrected

**171 of 243, at all five sampled ticks.** See deviation 2: the header's first draft called this the
most lit card in the catalog and it is **third**.

| entry | min non-zero bytes | max |
| --- | --- | --- |
| `starfield` (ported) | 222 | 226 |
| `chorus` | 198 | 198 |
| **`lumen`** | **171** | **171** |
| `lattice` | 169 | 169 |
| `strip` | 163 | 163 |

The OG image from the build's own log: `lumen 6835 bytes, 81 of 81 cells lit` — the only entry in
the catalog that lights every cell.

### The mechanism, observed rather than read

A scripted host run against the entry as `renderLua` produces it.

```
coordMax 127   lit tick0 171
row0  253/89/0  198/253/0  29/253/0  0/253/148  0/148/253  29/0/253  198/0/253  253/0/99  253/228/188
row8  84/29/0   65/84/0    9/84/0    0/84/49    0/49/84    9/0/84    65/0/84    84/0/32   84/75/62
after a press at (38,38): midi [[0,176,16,37,0],[0,176,17,37,0]], lit 172
after a move to (89,89):  lit 172, midi 4
errors []  pending 0
```

Two controllers per sample, `@CC` for hue and `@CC + 1` for depth, both 7-bit. The lit count goes
from 171 to **172** when the cursor lands and stays at 172 when it moves — which is the restore
observed rather than asserted: a cursor that repainted without restoring would leave a trail and the
count would climb.

### Traps

Every division floored. Colour channels inside 0..255, proved at all four corners above. The depth
divisor is a literal and can never be zero. `@CC + 1 < 128` at every knob value — tops 17, 49, 81,
103. Code 9 handled. **The cursor restores rather than repaints, marked do-not-simplify**: `touch_cb`
has a 1000-microsecond budget at 100 Hz, eighty-one cells is four firmware calls each, and a handler
that overruns drops touch samples exactly when the finger moves fastest. One pass over one cell to
restore plus one `glc` pair on the new cell is at most two cells per sample. **No keeper and no
decay**: the stored Lua holds no `glt`, no `glf` and no `glpfs`, measured over the SETUP string
rather than over the file.

**The honest limit, for the card copy:** the pad shows the colour it is SENDING, not the colour the
fixture is producing. The desk has its own curve, the lamp its own gamut, and there is no gamma
correction anywhere in the module's LED path. That is row 22.

---

## STAGE

**The card.** Nine scenes for a stream. The live one glows, the one under your finger breathes, and
it works on a machine with no software installed at all.

### Route note

`kind: "lua"`. **The only HID in the `sends` vocabulary is `sends.kind: "trackpad"`**, which is a
mouse — `gmms` and `gmbs`, a relative pointer and a button bitmask. There is no keyboard anywhere in
`PadState`, in either branch of the sends sheet, and no field of any kind carries a usage id. A
configuration whose whole output is keystrokes is outside the vocabulary by absence rather than by a
type.

### Canonical Setup at the defaults, verbatim (505)

```
--[[@cb]]local function Z(z,f)local r=z//3*27+z%3*3 for j=0,3 do local a=glag(0,r+j%2*2+j//2*18)if f>0 then glc(a,1,255,40,0,1)glc(a,2,255,40,0,1)glpfs(a,1,0,f,3)glt(a,1,30000)else glc(a,1,0,0,0,1)glc(a,2,40,40,50,1)glp(a,1,0)glt(a,1,0)end glp(a,2,255)end end for z=0,8 do Z(z,0)end Z(0,4)self.l=0 self.touch_cb=function(s,i,e,x,y)local z=x*3//128+y*3//128*3 if e==4 or e>8 then if z~=s.l then Z(s.l,0)s.l=z end Z(z,e>8 and 4 or 24)gks(10,1,1,0,0,2,104+z,1,0,0)elseif e>=5 then Z(s.l,4)end end gtt(0,2560)
```

### Canonical Timer at the defaults, verbatim (109)

```
--[[@cb]]gtt(0,2560)local z=self.l local r=z//3*27+z%3*3 for j=0,3 do glt(glag(0,r+j%2*2+j//2*18),1,30000)end
```

### The substitution table

| Token | Knob id | Needle in the canonical text | Sites | Default |
| --- | --- | --- | --- | --- |
| `@KEY0` | `key` | the `104` of `gks(…,2,104+z,…)` | 1 Setup, 0 Timer | index 0 |
| `@MOD` | `modifier` | the fourth and tenth arguments of `gks`, both `0` | 2 Setup, 0 Timer | index 0 |
| `@LIVEC` | `live` | `255,40,0` in both `glc` of the live branch | 2 Setup, 0 Timer | index 0 |
| `@ZONEC` | `zone` | `40,40,50` in the idle branch's layer-2 `glc` | 1 Setup, 0 Timer | index 0 |

`10` (the default delay), `4` and `24` (the live and held breathe rates), `30000` (the timeout),
`2560` (the Timer period) and `0,0,0` (the idle layer-1 black) are **literals, not knobs**. The
plan's prose names `@DELAY`, `@RATE` and `@PERIOD`; its knob table declares exactly four knobs, and
the table is what `catalog.spec.ts` gates.

### Six numbers, and the corner

| | Setup | Timer |
| --- | --- | --- |
| defaults | **505** | **109** |
| all-longest corner | **511** | **109** |
| all-shortest corner | **504** | **109** |

**Free at the worst corner: 397 of 908 on Setup, 799 on Timer.** **Combinations: 18** (`4+4+4+4 + 2`).

### The `gks` arity check, for the exact call shipped

```
gks(10, 1,1,@MOD, 0,2,@KEY0+z, 1,0,@MOD)
```

**Ten arguments: one leading delay plus three tuples. `(10 - 1) % 3 = 0`, so firmware accepts it.**
Observed from the host, not read from the source: a tap at `(64, 64)` recorded
`gks(10,1,1,0,0,2,108,1,0,0)` — ten arguments, key `104 + 4 = 108`, zone 4 — and a press at
`(10, 120)` recorded `gks(10,1,1,0,0,2,110,1,0,0)`, zone 6. The three tuples are modifier down, key
**down-then-up** (state 2), modifier up. State 2 is what keeps it to one call, which matters because
`gks` costs `10 + 4n` bytes of the 256-byte per-cycle buffer.

### Every usage id, verified against a named table

**Source: the USB HID Usage Tables, Keyboard/Keypad page (0x07).** Named here because no gate in
this repository can catch a wrong usage id, and a wrong one presses the wrong key on somebody's
machine.

| knob | value | what it is | `+ 8` | inside 256 |
| --- | --- | --- | --- | --- |
| `@KEY0` | 104 | F13 | 112 (F21) | yes |
| `@KEY0` | 30 | digit 1 | 38 (digit 9) | yes |
| `@KEY0` | 58 | F1 | 66 (F9) | yes |
| `@KEY0` | 89 | keypad 1 | 97 (keypad 9) | yes |
| `@MOD` | 0 | no event indicated | — | — |
| `@MOD` | 224 | left control | — | — |
| `@MOD` | 225 | left shift | — | — |
| `@MOD` | 226 | left alt | — | — |

All four `@KEY0` blocks are contiguous on that page, which is what makes `@KEY0 + z` a scene index
rather than a guess. F13 is the default because F13 to F24 exist on no keyboard, so OBS can own them
without colliding with anything the machine already binds.

### The branch versus the two dead tuples, measured

At `@MOD = 0` the two modifier tuples send usage id 0 — "no event indicated" on that page — and are
wasted but harmless. The alternative:

```
if @MOD>0 then gks(10,1,1,@MOD,0,2,@KEY0+z,1,0,@MOD)else gks(10,0,2,@KEY0+z)end
```

**costs 35 MORE characters of Setup** and saves eight bytes of a 256-byte buffer on a call that
happens once per press. **The dead tuples ship.**

### The picture, observed

```
lit tick0 104 bytes, 36 cells: 0,2,3,5,6,8 / 18,20,21,23,24,26 / 27,29,30,32,33,35 / 45,47,48,50,51,53 / 54,56,57,59,60,62 / 72,74,75,77,78,80
animating: true at ticks 0, 37, 101, 500 and 1009
errors []  pending 0
```

Thirty-six cells is nine boxes of four corners each. Only the corners are painted: four corners read
as a countable box at arm's length and a filled 3x3 block reads as a smear. `Z(z, f)` takes a RATE
rather than a flag — `f = 0` is idle, 4 is live, 24 is held — so the whole painter is one function
and a repaint is at most two zones, eight cells, never the pad.

### Traps

The `gks` arity rule, above. `@KEY0 + 8 < 256` at every value, above. The default delay is 0..255
only and ships as the literal 10. **Code 9 is handled and it is the whole card** — a fast tap must
fire the scene, so the test is `e == 4 or e > 8`; and because a DOWNUP has no lift behind it, it
settles the zone to the slow rate immediately (`e>8 and 4 or 24`) rather than leaving a zone
breathing fast forever with no gesture that can clear it. **The keeper is 30000 on a layer whose rate
is single-digit and that is legitimate** — pitfall 1 is a keeper on a layer carrying a DECAY, and the
guard's rate floor is 200. Colour channels inside 0..255 by construction.

**The honest limit, for the card copy — a new kind for this catalog.** **HANGAR cannot show a
keystroke arriving.** `gks` is recorded and inert in the browser (`lua-host.ts:429` — *"Nothing in
HANGAR consumes them"*), so this card animates perfectly while the keystroke, the entire point of it,
is a claim the simulator does not check. The description promises the picture and never the result.
Row 23 is where the wire is checked, and every keystroke configuration in this catalog is unverified
until it is run.

---

## SHUTTLE

**The card.** Scrub video with a finger. The arc grows and spins faster the harder you push it.

### Route note

`kind: "lua"`, two independent reasons. **Nothing in `PadState` repeats anything** at a rate derived
from a finger's position — there is no timer expression in the sends sheet at all — and **there is no
keyboard in `sends`** in either branch; the only HID kind is `"trackpad"`, which is a mouse. A
repeating keystroke whose period IS the data is outside the vocabulary twice over.

### Canonical Setup at the defaults, verbatim (663)

```
--[[@cb]]local R={22,23,24,33,42,51,60,59,58,57,56,47,38,29,20,21}for j=1,16 do local a=glag(0,R[j])glc(a,1,0,25,50,1)glc(a,2,0,25,50,1)glpfs(a,1,j*16,2,3)glpfs(a,2,j*16,2,3)glt(a,1,30000)glt(a,2,30000)end local function A(v)local k=v<0 and -v or v local f=v<0 and 256-16*k or 16*k for j=1,16 do local a=glag(0,R[v<0 and 17-j or j])if j<=k*4 then glc(a,1,0,200,255,1)glc(a,2,0,200,255,1)glf(a,1,f)glf(a,2,f)else glc(a,1,0,25,50,1)glc(a,2,0,25,50,1)glf(a,1,2)glf(a,2,2)end glt(a,1,30000)glt(a,2,30000)end end self.s=0 self.touch_cb=function(s,i,e,x,y)local v=(e==1 or e==4)and x*9//128-4 or 0 if v~=s.s then if s.s==0 then gtt(0,20)end s.s=v A(v)end end gtt(0,300)
```

### Canonical Timer at the defaults, verbatim (201)

```
--[[@cb]]local v=self.s local k=v<0 and -v or v gtt(0,math.max(300//(1+k),20)//1)for n=0,80 do local a=glag(0,n)glt(a,1,30000)glt(a,2,30000)end if v>0 then gks(0,0,2,15)elseif v<0 then gks(0,0,2,13)end
```

### The substitution table

| Token | Knob id | Needle in the canonical text | Sites | Default |
| --- | --- | --- | --- | --- |
| `@BASEP` | `period` | the `300` of the trailing `gtt(0,300)` and of `300//(1+k)` | 1 Setup, 1 Timer | index 1 |
| `@GAIN` | `gain` | both `16` of `local f=v<0 and 256-16*k or 16*k` | 2 Setup, 0 Timer | index 1 |
| `@KEYF` | `forward` | the `15` of `gks(0,0,2,15)` | 0 Setup, 1 Timer | index 0 |
| `@KEYB` | `backward` | the `13` of `gks(0,0,2,13)` | 0 Setup, 1 Timer | index 0 |
| `@ARCC` | `arc` | `0,200,255` in the arc branch's two `glc` | 2 Setup, 0 Timer | index 0 |
| `@RESTC` | `rest` | `0,25,50` in the Setup ring loop's two `glc` and the rest branch's two | 4 Setup, 0 Timer | index 0 |

`20` (the kick and the period floor), `2` (the idle drift rate), `30000` (the timeout), `16` in
`j*16` (the phase stagger) and `4` in `k*4` (cells per unit of speed) are **literals, not knobs**.
Prefix check: `@KEYF` and `@KEYB` share `@KEY` and neither continues into the other; no other pair
shares a first letter.

### Six numbers, and the corner

| | Setup | Timer |
| --- | --- | --- |
| defaults | **663** | **201** |
| all-longest corner | **663** | **201** |
| all-shortest corner | **659** | **201** |

**Free at the worst corner: 245 of 908 on Setup, 707 on Timer.** **Combinations: 26**
(`4+4+4+4+4+4 + 2`). The longest corner equals the defaults because five of the six knobs have
equal-length values at their longest and the sixth is already at it.

### The backward key: a sixth knob, and why no arithmetic works

The plan asked for `@KEYB` to be derived from `@KEYF` where the usage ids allow it, and to be a
sixth knob rather than a wrong key where they do not. **They do not.**

| `@KEYF` | what it is | natural partner | relation |
| --- | --- | --- | --- |
| 15 | letter L | 13, letter J | **minus 2** |
| 79 | right arrow | 80, left arrow | **plus 1** |
| 55 | full stop | 54, comma | **minus 1** |
| 54 | comma | 55, full stop | **plus 1** |

No single relation is right on more than two of the four, and two of them run in opposite
directions. A derived key would press the wrong key on somebody's machine on at least half the
settings. **`@KEYB` ships as a sixth knob**, the ceiling `catalog.spec.ts` allows, with values that
pair index for index with the forward list.

### Every usage id, verified against the same table

**USB HID Usage Tables, Keyboard/Keypad page (0x07).**

| knob | value | what it is |
| --- | --- | --- |
| `@KEYF` | 15 | keyboard l and L |
| `@KEYF` | 79 | keyboard right arrow |
| `@KEYF` | 55 | keyboard . and > |
| `@KEYF` | 54 | keyboard , and < |
| `@KEYB` | 13 | keyboard j and J |
| `@KEYB` | 80 | keyboard left arrow |
| `@KEYB` | 54 | keyboard , and < |
| `@KEYB` | 55 | keyboard . and > |

### The `gks` arity check

```
gks(0, 0,2,@KEYF)
```

**Four arguments: one delay plus one tuple. `(4 - 1) % 3 = 0`.** Observed: a press at the right edge
recorded `gks(0,0,2,15)` and one at the left edge `gks(0,0,2,13)`.

### The uint8 rate wrap, used deliberately in one place

| `@GAIN` | forward rate at speed 4 | backward rate at speed 4 |
| --- | --- | --- |
| 8 | 32 | 224 |
| 16 | 64 | 192 |
| 24 | 96 | 160 |
| 32 | **128** | 128 |

`@GAIN * 4 < 256` at every value, checked at the largest speed. **The backward rate is `256 - @GAIN*k`
and that is the same wrap read as a negative step**, so the arc turns the way the video is going for
the price of one subtraction. It is also why **the timeout is 30000 and not a 65535 keeper**: at
`@GAIN` 8 and speed 1 the backward rate is 248, and a maximum timeout beside a rate above 200 is
exactly pitfall 1's signature in `lua-smoke.spec.ts` test 3. 30000 ticks refreshed every period
answers the 655 s firmware ceiling just as completely without wearing the signature.

### The `gtt` zero guard, and the silent stop it prevents

`gtt(0, 0)` NEVER FIRES. A Timer that re-arms with a period of zero does not run fast, it **stops** —
permanently, with no error and nothing in the picture to say so, because the arc goes on showing the
last speed the finger asked for while the transport sits still. `@BASEP//(1+k)` is 24 at its smallest
over the shipped values (120 at speed 4), so `math.max(…, 20)//1` never fires today; it is there
because the divisor is data and the failure it prevents is invisible.

### The arc, observed

```
lit tick0 29 bytes, 16 cells: 20,21,22,23,24,29,33,38,42,47,51,56,57,58,59,60
rest ring one cell        0/24/49
arc peak one cell         0/198/253
x = 90 (v = +2)   bright: 22,23,24,33,42,51,60,59   dim: the other eight
x = 20 (v = -3)   bright: 21,20,29,38,47,56,57,58,59,60,51,42   dim: 22,23,24,33
after the lift    hid count 3 -> 3 over 100 further ticks
errors []  pending 0
```

Sixteen cells is the ring at radius two, held in `R` in clockwise order starting at the top centre
(cell 22). A positive speed lights `R[1..4k]` clockwise; a negative one reads the same table
backwards through `R[17-j]`, so the arc grows anticlockwise from the same starting cell. Four cells
per unit of speed, so `|v| = 4` lights the whole ring.

### Traps

The rate wrap and the `gtt` zero guard, above. Every division floored — and for the period argument
a floor to zero IS the silent stop. The `gks` arity rule. **Code 9 stops rather than starts.** The
phases are set once and never re-written — writing the phase on a speed change would snap all sixteen
cells back to their starting stagger every time the finger crossed a column boundary. Colour channels
inside 0..255 by construction.

**The honest limit, for the card copy.** Two things. **HANGAR cannot show a keystroke arriving** —
the same limit STAGE has, `lua-host.ts:429`. And **a keystroke shuttle is coarse next to a jog
wheel**: the host advances one frame per key press, and the press rate is bounded by the 256-byte
per-cycle buffer, where `gks` costs `10 + 4n` bytes and one 10 ms cycle holds about sixty-one key
steps. That is the second half of row 24.

---

## The deviations

### Auto-fixed issues

**1. [Rule 1 — bug] LUMEN's depth divisor went negative at one knob value and exactly black at another**

- **Found during:** Task 9-06-01, checking the divisor against the index that divides it before
  writing it.
- **Issue:** The plan specifies `glc(a, 2, r*(8-y)//8, …)` with a `@DEPTH` knob of `"6"`, `"8"`,
  `"10"`, `"12"` substituted for the 8, and in the same paragraph asks for values that keep the
  bottom row visible. The row index reaches **8**. At `@DEPTH = 8` the bottom row's numerator is
  `8 - 8 = 0` and the whole row is BLACK; at `@DEPTH = 6` it is `-2` and every channel of the bottom
  two rows is NEGATIVE, which a truncating channel renders as garbage. Two of the four shipped values
  are broken and one of them is the plan's own default.
- **Fix:** the multiplier moves out of the divisor: `d = 36 - row*@DEPTH`, every channel
  `anchor*d//36`, with `@DEPTH` in 1, 2, 3, 4 and a default of index 2. The bottom row is 28, 20, 12
  or 4 of 36 — between 78 and 11 per cent, never zero and never negative, because `8*4 = 32 < 36`.
  A larger `@DEPTH` is now a DEEPER ramp, which is also the way the label reads; the plan's form had
  it backwards.
- **Files modified:** `src/lib/catalog/entries/lumen.ts`.
- **Commit:** `d7497e5`.

**2. [Rule 1 — bug] LUMEN is not the most lit card in the catalog, and the header said it was**

- **Found during:** Task 9-06-03, reading the regenerated fixture rather than the neighbours.
- **Issue:** The plan predicts LUMEN will be *"the most lit card in the catalog"* and the first draft
  of the header wrote that as fact, comparing against STRIP's 163, LEARN's 162 and CONSOLE's 99 — the
  three entries of the wave immediately before. Over the whole fixture the claim is false: the ported
  `starfield` holds **222 to 226** non-zero bytes and `chorus` a flat **198**, against LUMEN's
  **171**. LUMEN is third.
- **Fix:** the header now states the measurement, the rank and the two entries above it, and says
  that a pure hue is two channels by definition so eight of the nine columns are two-channel. The
  `restsBlack` comment was corrected in the same pass. The claim is now made over
  `Object.entries(frames.json)` rather than over remembered neighbours.
- **Files modified:** `src/lib/catalog/entries/lumen.ts`.
- **Commit:** `967184b`.

**3. [Rule 1 — bug] SHUTTLE's speed survived the lift, so the transport scrubbed forever**

- **Found during:** Task 9-06-02, writing the touch handler against the shipped event-filter idiom.
- **Issue:** The plan's mechanism stores the speed in `self.s` and says code 9 is harmless because
  *"a tap sets a speed and the Timer does the rest"*. Written that way with the shipped filter
  (`if e~=1 and e~=4 and e<9 then return end`), the speed SURVIVES THE LIFT: the video keeps scrubbing
  after the finger is gone and the only way to stop it is to touch the exact centre column. Worse, a
  DOWNUP tap arrives with NO LIFT BEHIND IT, so a speed set by a tap can never be cleared by the same
  gesture that set it.
- **Fix:** `local v=(e==1 or e==4)and x*9//128-4 or 0`. A press or a move sets a speed; every other
  event — an end, a grip-suppression code, a DOWNUP — sets zero. A shuttle runs while your finger is
  down. Observed: `hid count 3 -> 3` over a hundred ticks after the lift. Safe at the centre column
  because 0 is TRUTHY in Lua.
- **Files modified:** `src/lib/catalog/entries/shuttle.ts`.
- **Commit:** `07b2b8d`.

**4. [Rule 2 — missing critical functionality] SHUTTLE did not move for up to 400 ms after the finger landed**

- **Found during:** Task 9-06-02, tracing the first Timer fire through the smoke gate's own gesture.
- **Issue:** Setup arms `gtt(0, @BASEP)` — up to 400 ms. `touch_cb` set a speed and re-armed nothing,
  so the first keystroke arrived up to a period after the finger. In the execution gate that was not
  a latency complaint but a FAILURE: the scripted gesture is eighteen ticks long and the first Timer
  fire lands at tick 30, so SHUTTLE produced no MIDI and no HID at all and test 2 would have gone red
  on arrival.
- **Fix:** `if s.s==0 then gtt(0,20)end` — a 20 ms kick on the zero-to-non-zero transition ONLY.
  Re-arming on every change would be worse than either: a fast slide changes the speed every 10 ms,
  each change would push the deadline out by a whole period, and the Timer would never fire at all
  while the finger was moving.
- **Files modified:** `src/lib/catalog/entries/shuttle.ts`.
- **Commit:** `07b2b8d`.

**5. [Rule 1 — bug] SHUTTLE declared a motion its pad did not have**

- **Found during:** Task 9-06-03, reconciling the declarations against the regenerated fixture — the
  open case the plan flagged.
- **Issue:** The first draft's ring was still at rest: every rate 0 until a finger asked for a speed.
  A direct `sim.animating` probe agreed and returned **false at all five ticks**, so the entry was
  declared `static` with a quiet line. **The fixture disagreed and returned `animating: true` at all
  five.** The reason is `lua-pad-sim.ts:150-152`: the engine reports
  `host.animating || host.timerArmed`, and a Timer that re-arms itself on every fire NEVER SETTLES.
  **Every Lua entry with a stored Timer therefore classifies as `animated` whatever its pad is doing**,
  and `listing.spec.ts` gates the declaration against that derivation.
- **Fix:** not the declaration — the pad. `front-door.ts` says of this field that it is *"never
  guessed and never aspirational"* and that *"faking motion here would be faking the one thing the
  product claims"*, so a still ring wearing the word `animated` was not an option. The sixteen ring
  phases are now staggered `j*16` and given an idle rate of 2, set once in Setup, so the ring drifts
  slowly with nobody touching it and the arc genuinely SPINS rather than pulsing in unison. Sixteen
  times sixteen is 256, which wraps to 0, so the spacing is exact. `motion: "animated"` is now true of
  the picture as well as of the derivation, and the quiet line was removed.
- **Files modified:** `src/lib/catalog/entries/shuttle.ts`, `src/lib/catalog/listing.ts`,
  `src/lib/catalog/frames.json`.
- **Commit:** `967184b`.

**6. [Rule 1 — bug] SHUTTLE's arc was half lit**

- **Found during:** Task 9-06-02, reading the rendered frame rather than the layer record.
- **Issue:** The plan's mechanism animates the arc with `glf(a, 2, @GAIN * |s|)` — layer 2 alone. One
  layer can never exceed 254/512 of the colour asked for, and measured against the rendered frame the
  arc peaked at **0/99/126** instead of **0/198/253**. A card whose entire picture is one shape cannot
  afford to be half lit, and the same phase's own trap list says to paint both.
- **Fix:** both layers carry the same colour and the same rate, written from the same value in the
  same pass so they can never beat against each other. The rest ring went from 0/12/24 to 0/24/49 in
  the same change. Cost: 87 characters of Setup, of which 245 remained free.
- **Files modified:** `src/lib/catalog/entries/shuttle.ts`.
- **Commit:** `07b2b8d`.

**7. [Rule 1 — bug] SHUTTLE's 65535 keeper wore pitfall 1's signature once the spin could reverse**

- **Found during:** Task 9-06-03, adding the reverse gear.
- **Issue:** The first draft used ARC's `glt(a, _, 65535)` keeper, which is correct beside a
  single-digit rate. Once the backward rate became `256 - @GAIN*k` it reached **248**, and a timeout
  at or above 64511 beside a rate at or above 200 is the exact pair `lua-smoke.spec.ts` test 3 looks
  for. The guard would have gone red on a card with no decay in it at all.
- **Fix:** the timeout is 30000 everywhere, refreshed on both layers of all eighty-one cells by the
  Timer every period. The 655 s firmware ceiling is answered just as completely and the signature is
  gone. Eighty-one rather than sixteen because a bare `for n=0,80` costs less than declaring the ring
  table a second time in the second event.
- **Files modified:** `src/lib/catalog/entries/shuttle.ts`.
- **Commit:** `967184b`.

**8. [Rule 1 — bug] STAGE's Timer would have snapped the breathe to black at an arbitrary moment**

- **Found during:** Task 9-06-02, applying 09-03's phase-alignment rule and finding it did not reach.
- **Issue:** The plan's Timer *"re-arms `gtt(0, @PERIOD)` and re-issues `glpfs` on the live zone"*.
  09-03 established that a re-issue is invisible when the period is a whole number of phase cycles —
  HOLD's 2560 ms, 256 ticks — but that argument holds only for a cell armed by the TIMER. STAGE's
  zones are armed by a FINGER, at an arbitrary tick, so the phase at the next Timer fire is arbitrary
  and `glpfs(a,1,0,…)` writes 0 over it: a visible snap to black mid-breath, once every 2560 ms,
  forever.
- **Fix:** the Timer refreshes `glt` alone. The timeout is 30000 and the period is 256 ticks, so the
  countdown never approaches its end, the rate is never zeroed and nothing freezes — which is all the
  655 s ceiling actually needs. The period stays 2560 ms so that the phase-aligned property is kept
  and the choice above remains a preference rather than a necessity.
- **Files modified:** `src/lib/catalog/entries/stage.ts`.
- **Commit:** `07b2b8d`.

### Decisions taken inside the plan's own latitude

- **LUMEN ships the anchor table at 604 although the computed ramp measured 594.** The plan says to
  measure both and ship the cheaper. The cheaper one costs thirty-six non-zero bytes of picture (171
  to 135) to save ten characters of a budget with 300 free. Both numbers are recorded above and the
  header names the one that shipped.
- **LUMEN's ninth anchor is an amber white rather than a ninth hue.** A lighting picker with no white
  is missing its first choice; it is also the only three-channel column and is worth nine of the 171.
- **SHUTTLE ships the RING, not the bar the plan allowed as a fallback.** The table is sixty-five
  characters and the whole Setup came in at 663 of 908, so there was never a reason to spend the
  card's own word on a straight line.
- **SHUTTLE's backward key is a sixth knob.** The full arithmetic is in the table above.
- **STAGE's delay, breathe rates and Timer period are literals.** The plan's prose names `@DELAY`,
  `@RATE` and `@PERIOD`; its knob table declares four knobs and `catalog.spec.ts` gates the table.

### Scope notes, recorded because a later reader will wonder

- **`KNOWN_TAGS` was updated in the task 1 and task 2 commits, not in task 3.** `copy.spec.ts` test 3
  gates the vocabulary in both directions — a tag carried and not declared is red, and a tag declared
  and not carried is red too — so `lighting` had to land with LUMEN and `streaming`, `hotkeys` and
  `video` with STAGE and SHUTTLE. 09-03 set the same precedent for `latching`.
- **This is the first entry wave of the phase that edited a test file, and the count still did not
  move.** The HID assertion went inside the existing `it`, so `lua-smoke.spec.ts` is still 3 tests and
  `PREV_TESTS` is still 780. The delta was computed rather than assumed.
- **STAGE and SHUTTLE send NO MIDI AT ALL.** They are the first two entries in the catalog for which
  that is true, and the `SMOKE_REPORT` lines below are where it is visible.
- **The repaint helpers are `local function`s, not methods on `self`.** `F`, `Z` and `A` are all
  declared in Setup and called from inside `touch_cb`; a `self:` call would be classified against
  `HOST_SELF_METHODS`, which has nine members and would refuse it. 09-01's gate decided the shape of
  all three entries before a line of any of them was written.

---

## The fixture, and the one declaration it corrected

`UPDATE_FRAMES=1` was run once for all three entries, then **again**, and the second file is
**byte-identical** (`diff -q` silent). The fixture covers **28** entries at `0,37,101,500,1009`.

| Entry | `restsBlack` | non-zero bytes | `motion` declared in tasks 1-2 | fixture says | outcome |
| --- | --- | --- | --- | --- | --- |
| `lumen` | false | **171** at all five ticks | `static` | `animating: false` at all five | **agrees** |
| `stage` | false | **104** at all five ticks | `animated` | `animating: true` at all five | **agrees** |
| `shuttle` | false | 29, 28, 28, 28, 29 | `static` | `animating: true` at all five | **CORRECTED — see deviation 5** |

**SHUTTLE was the plan's open case and it was the one that moved.** What the frames showed:
`animating: true` at every sampled tick, on a pad whose every rate was zero. The cause is the
engine's derivation, not the pad: `lua-pad-sim.ts:150-152` returns
`host.animating || host.timerArmed`. The declaration is now `animated` **and the pad now animates**;
the quiet line written for it in task 2 was removed rather than left beside an animated entry, where
`FidelityLine.svelte` would suppress it anyway.

**LUMEN's quiet line, verbatim, written with the entry in task 1 as the plan asked:**

> **LUMEN** — The whole field stays lit and still, so you read the colour instead of watching it.
> (83 characters)

One line, second person, present tense, no exclamation mark, no emoji, no ASCII apostrophe between
letters, no hyphen doing a dash's job, no ellipsis, and not `RESTS_DARK_NOTE` — which belongs only to
a `restsBlack: true` entry, and none of this wave's three is one. `copy.spec.ts` test 2 counts it by
the same rules it counts a description by and reports **5 passed**. **STAGE and SHUTTLE carry no
quiet line, because both are `animated`.**

The three descriptions are 96, 87 and 88 characters against the 110 cap.

The catalog's motion census is now **14 animated, 11 static, 3 dark**, so `listing.spec.ts`'s
requirement that all three motions occur is satisfied with room on every side.

---

## The chip row, before and after — one chip, and it arrives already standing

| | Old (twenty-five entries) | New (twenty-eight entries) |
| --- | --- | --- |
| `entries` | 25 | **28** |
| `tags` | 47 | **51** |
| `singletons` | 25 | **28** |
| chips | 22 | **23** |

```
old  playable (8) · readable (6) · drums (4) · expressive (4) · gestural (4) · xy-control (4)
     · generative (3) · hands-free (3) · hypnotic (3) · precise (3) · ambient (2) · blooming (2)
     · colour (2) · grid (2) · harmonic (2) · latching (2) · mixing (2) · modulation (2)
     · rails (2) · rippling (2) · sequencer (2) · utility (2)

new  playable (8) · readable (8) · expressive (5) · gestural (5) · drums (4) · hypnotic (4)
     · xy-control (4) · colour (3) · generative (3) · hands-free (3) · precise (3) · utility (3)
     · ambient (2) · blooming (2) · grid (2) · harmonic (2) · hotkeys (2) · latching (2)
     · mixing (2) · modulation (2) · rails (2) · rippling (2) · sequencer (2)
```

**`hotkeys` is a standing chip in the wave that coins it, and it is the only tag in the phase so far
that has been.** Two carriers is the threshold (`filter.ts:121-125`), and STAGE and SHUTTLE land
together carrying it. `lighting` (LUMEN), `streaming` (STAGE) and `video` (SHUTTLE) each arrive as
singletons. `readable` gained two and is now level with `playable` at the head of the row at eight;
`expressive`, `gestural`, `hypnotic`, `colour` and `utility` each gained one.

**The four tags added to `KNOWN_TAGS`, 47 -> 51:** `lighting`, `streaming`, `hotkeys`, `video`.
Confirmed by `copy.spec.ts` test 3, which asserts `KNOWN_TAGS.length === carried.size` and names any
tag declared and not carried, rather than by reading the array.

**New `RECORDED` values.** `filter.spec.ts`: `entries: 28, tags: 51, singletons: 28`, the
twenty-three chips above and
`chipCounts: [8, 8, 5, 5, 4, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]`.
`sort.spec.ts`: `{ entries: 28, featured: 12 }` — LUMEN is this wave's one featured entry. Both
derived by a throwaway spec over `LISTING` and confirmed by the rule assertions in the same tests;
both files still report **6 passed**.

### The document that quotes the row

`.planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md`, **"The tag chips"**. Nothing in the
repository goes red when it drifts, which is exactly why it is checked.

**Old lines, verbatim:**

> catalog grows. **Re-recorded at twenty-five entries by 09-05** (it was nine chips at sixteen
> entries when Phase 5.1 wrote this section, fourteen at nineteen after 09-03 and sixteen at
> twenty-two after 09-04; every entry wave of Phase 9 re-takes it, and 09-10 confirms the final row at
> thirty-six entries). Today that is twenty-two:
>
> > `playable` (8) · `readable` (6) · `drums` (4) · `expressive` (4) · `gestural` (4) · `xy-control` (4)
> > · `generative` (3) · `hands-free` (3) · `hypnotic` (3) · `precise` (3) · `ambient` (2) · `blooming` (2)
> > · `colour` (2) · `grid` (2) · `harmonic` (2) · `latching` (2) · `mixing` (2) · `modulation` (2)
> > · `rails` (2) · `rippling` (2) · `sequencer` (2) · `utility` (2)

**New lines, verbatim:**

> catalog grows. **Re-recorded at twenty-eight entries by 09-06** (it was nine chips at sixteen
> entries when Phase 5.1 wrote this section, fourteen at nineteen after 09-03, sixteen at twenty-two
> after 09-04 and twenty-two at twenty-five after 09-05; every entry wave of Phase 9 re-takes it, and
> 09-10 confirms the final row at thirty-six entries). Today that is twenty-three:
>
> > `playable` (8) · `readable` (8) · `expressive` (5) · `gestural` (5) · `drums` (4) · `hypnotic` (4)
> > · `xy-control` (4) · `colour` (3) · `generative` (3) · `hands-free` (3) · `precise` (3)
> > · `utility` (3) · `ambient` (2) · `blooming` (2) · `grid` (2) · `harmonic` (2) · `hotkeys` (2)
> > · `latching` (2) · `mixing` (2) · `modulation` (2) · `rails` (2) · `rippling` (2) · `sequencer` (2)

The paragraph beneath it moved from *"remaining 25"* to **28** and from *"forty-seven 44px chips
above twenty-five live pads"* to **fifty-one** and **twenty-eight**. The ASCII mock at the top of the
same document was re-taken too: its tag block became six lines in the new order, and its count line
went from `25 of 25 configurations.` to `28 of 28 configurations.`

---

## The three audition rows, verbatim, and the new `ROW_COUNT`

`ROW_COUNT` in `src/lib/catalog/audition.spec.ts` is **24**, and the test title reads *"keeps
twenty-four numbered rows"*. `docs/HARDWARE-AUDITION.md` has twenty-four numbered rows, contiguous
from 1.

| # | Config | What to check | Why it cannot be simulated |
| --- | --- | --- | --- |
| 22 | **LUMEN** | Hold the module beside a lit fixture driven by the colours it is sending and compare the two by eye, at three points across the pad and at the top and bottom of a column. | No gamma correction anywhere in the WS2812 path and no colour management at either end — the desk has its own curve and the lamp its own gamut. Whether two lights match is the one question only two lights answer. |
| 23 | **STAGE** | Plug the module into a computer with OBS open, bind three scenes to the keys this card sends, and press them. **Do the keystrokes arrive at all, and do they arrive as the right keys?** Try it with a modifier and without one. | **`gks` is recorded and inert in the browser** — `src/lib/sim/lua-host.ts` binds it to `recordHid` and says at `:429` that nothing in HANGAR consumes them. Every keystroke configuration in this catalog is unverified until this row is run, and no gate in this repository can catch a wrong usage id. |
| 24 | **SHUTTLE** | Scrub in a video editor at each of the four speeds, in both directions. Do the keystrokes keep up, does the transport actually reverse, and does the arc's spin match how fast the picture is moving? | The same HID invisibility as row 23, plus the 256-byte per-cycle protocol buffer: `gks` costs 10 + 4n bytes and one 10 ms cycle holds about sixty-one key steps, so whether the module can press a key as fast as the top speed asks is a firmware question a simulator cannot answer. |

**Row 23 is the load-bearing one of the whole document from here on**, and its reason names `gks` and
its inertness explicitly, because three more keystroke configurations land in wave 7.

### The cost table, now nineteen

`## The sixteen, and what they cost` became `## The nineteen, and what they cost`:

| id | name | Setup | Timer | knobs | dark at rest |
| --- | --- | --- | --- | --- | --- |
| `lumen` | LUMEN | 604 | 0 — **no Timer** | 4 | no |
| `stage` | STAGE | 505 | 109 | 4 | no |
| `shuttle` | SHUTTLE | 663 | 201 | 6 | no |

**The Setup-only note is now nine names rather than eight**, with LUMEN's reason written out: it
computes eighty-one colours once and then has nothing left to do. The document's prose counts moved
with its rows: *"Twenty-four rows"* twice, *"twenty-four lines"*, *"nineteen Setup files and ten
Timer files"*, and item 4's exemption, which is now nine configurations. Item 4 still keeps the
substring `MORPH … Setup only` inside one sentence with no full stop in it, because
`audition.spec.ts` matches `/MORPH[^.]{0,200}Setup only/`, and the match is well inside 200
characters.

### `AUDITION_DUMP=1`, all nineteen

```
  euclid: setup 702/908, timer 218/908
  chorus: setup 729/908, timer 173/908
  arc: setup 379/908, timer 251/908
  ghost: setup 305/908, timer 333/908
  lattice: setup 615/908, timer 171/908
  morph: setup 507/908, no Timer
  sonar: setup 432/908, timer 279/908
  hold: setup 696/908, timer 102/908
  steps: setup 388/908, timer 251/908
  slam: setup 659/908, no Timer
  keys: setup 644/908, no Timer
  gridlock: setup 425/908, no Timer
  table: setup 529/908, no Timer
  console: setup 785/908, no Timer
  strip: setup 638/908, no Timer
  learn: setup 657/908, no Timer
  lumen: setup 604/908, no Timer
  stage: setup 505/908, timer 109/908
  shuttle: setup 663/908, timer 201/908
```

Every printed count matches the recorded numbers above. `.tmp-audition/` held **nineteen**
`.setup.lua` files and **ten** `.timer.lua` files, which is what the document now says, and the
directory was removed by hand afterwards.

---

## Deferred item 2, verbatim

Appended to `.planning/phases/09-twenty-configurations/deferred-items.md` beneath item 1, which was
not touched:

> ## 2. Keystroke configurations animate correctly and prove nothing about their output (recorded by 09-06)
>
> `gmms`, `gmbs` and `gks` resolve in `src/lib/sim/lua-host.ts` and are recorded into `hidLog`;
> `lua-host.ts:429` states that nothing in HANGAR consumes them. STAGE and SHUTTLE — and CULL, FORGE
> and SWITCH in wave 7 — therefore pass every automated gate in this repository while their actual
> output is unchecked. `lua-smoke.spec.ts` was widened in 09-02 to accept HID as output, which is
> honest, and it is not the same as verifying a keystroke. What would close this: either a HID
> consumer in the simulator that decodes `gks` tuples into named key events and asserts them against
> a per-entry expectation, or the bench rows 23 and 24. The first is cheap and worth planning; the
> second is the only thing that proves the wire.

---

## The assertion 09-02 deferred, landed

`src/lib/sim/lua-smoke.spec.ts` test 2, immediately beneath the MIDI half, at the exact spot 09-02
marked:

```ts
// THE HID SIDE OF THAT GUARANTEE, landed by 09-06 with STAGE and SHUTTLE -
// the first two configurations in this catalog whose whole output is
// keystrokes, and therefore the first wave in which this assertion could
// be true rather than scheduled.
const hidEntries = runs.filter((r) => r.hid.length > 0).map((r) => r.id);
expect(
  hidEntries.length,
  "no hand-authored configuration produced HID at all - the widening in 09-02 " +
    "would then be admitting a kind of output the catalog does not actually have",
).toBeGreaterThan(0);
```

09-02's seven-line comment promising the assertion to a later plan is **gone**, replaced by the
four-line note above. `grep -q "produced HID at all" src/lib/sim/lua-smoke.spec.ts` exits **0** and
`grep -c "09-06 adds it"` prints **0**. The file still reports **3 passed**.

### `SMOKE_REPORT=1`, the three new entries

```
lumen:   16 MIDI, 0 HID, first three MIDI (0,176,16,24,0) (0,176,17,24,0) (0,176,16,37,0)
stage:    0 MIDI, 2 HID, first three MIDI
shuttle:  0 MIDI, 2 HID, first three MIDI
```

**A non-zero HID count for STAGE and SHUTTLE and a zero MIDI count for both**, which is the
acceptance criterion word for word — and the trailing blank after `first three MIDI` is the visible
form of it. LUMEN sends two controllers per sample, `@CC` and `@CC + 1`, for eight samples. Every one
of the other sixteen entries still reads **0 HID**, so the assertion rests on exactly the two entries
this wave landed, which is what the negative check below then measures.

---

## The negative check, in three stages rather than two

Everything this wave created was committed **before** anything was perturbed, so no restore passed
vacuously. Each perturbation was restored with `git checkout --` and `git diff --quiet` on the
perturbed paths exited **0** afterwards.

| # | Perturbation | Observed | What it proves |
| --- | --- | --- | --- |
| 1 | STAGE's `gks` call deleted from its Setup | **Red on test 2**, `stage: produced no MIDI and no HID at all across 218 ticks`. `Tests 1 failed \| 2 passed (3)` | Red, but **not on the new assertion**. SHUTTLE still produced HID, so the non-vacuity half was green — which is correct, and is the finding the plan predicted |
| 2 | The `gks` calls deleted from **both** entries | **Red on test 2**, and on the SAME message: `stage: produced no MIDI and no HID at all` | Still not the new assertion. The per-entry "any output" check runs first in the loop and fires before the non-vacuity half is ever reached |
| 3 | Both `gks` calls **replaced by `gms` calls** — `s:gms(0,176,20,z,0)` in STAGE and `self:gms(0,176,20,k,0)` in SHUTTLE | **Red on the new assertion, by name**: `no hand-authored configuration produced HID at all - the widening in 09-02 would then be admitting a kind of output the catalog does not actually have: expected 0 to be greater than 0`. `Tests 1 failed \| 2 passed (3)` | The intended red, observed |

**What this shows about the assertion's strength, stated plainly.** For an entry whose ONLY output is
keystrokes, the per-entry "produced no MIDI and no HID at all" check is strictly stronger than the
non-vacuity half and will always fire first — so **deleting a `gks` call can never exercise the new
assertion**. The regression it actually guards is the one 09-02 described: a catalog that still
produces output everywhere but has quietly stopped producing HID anywhere, which is exactly the state
of the tree before this wave. Stage 3 is the perturbation that reproduces it, and it is the one that
turns the assertion red. The plan's two-stage check was worth running because it is what showed the
first two stages test something else.

After the restore, `lua-smoke.spec.ts` reported **3 passed** and `git status --short` printed nothing.

---

## Three wall times and one byte size, before and after

Taken on the same machine in the same session. **No plant was needed and none was made:** the "before"
column was measured against the working tree at `084e354`, which is 09-05's closing commit, before a
line of this wave was written. The cross-check that it was the right tree is `static/og/` at
**148,343 bytes over 25 PNGs**, which reproduces 09-05's closing numbers exactly.

| Measurement | Before (25 entries, 16 Lua) | After (28 entries, 19 Lua) |
| --- | --- | --- |
| `lua-entries.sweep.spec.ts` alone | **2.35 s** tests / 2.93 s reported / 5.47 s wall | **2.73 s** tests / 3.34 s reported / 6.35 s wall |
| `npm run build` | **11.001 s** | **11.367 s** |
| `static/og/` | **148,343 bytes**, 25 PNGs | **166,412 bytes**, 28 PNGs |

The sweep grew from 482 combinations to **543** — 964 measured events to 1,086 — for 0.38 s of test
time. The build is 0.37 s slower, which is inside this machine's run-to-run noise.

The three new OG images, from the build's own log:

```
gen-og: lumen        6835 bytes   81 of 81 cells lit
gen-og: stage        5869 bytes   36 of 81 cells lit
gen-og: shuttle      5365 bytes   15 of 81 cells lit
```

**LUMEN is the only entry in the catalog that lights all eighty-one cells**, and at 6,835 bytes it is
also the largest OG image the phase has produced — both of which are the same fact about a field of
eighty-one distinct colours. SHUTTLE's 15 of 16 ring cells is the drift: one cell was at the black end
of its gradient when the frame was taken, which is the motion the deviation above put there.
`build/og/` holds 28.

---

## Verification

| Gate | Result |
| --- | --- |
| `catalog.spec.ts` | **10 passed** |
| `frames.spec.ts` | **5 passed** |
| `front-door.spec.ts` | **8 passed** |
| `listing.spec.ts` | **5 passed** |
| `audition.spec.ts` | **4 passed** |
| `copy.spec.ts` | **5 passed** |
| `host-surface.spec.ts` | **4 passed** |
| `catalog + frames + front-door + listing + audition` | **4 files, 22 passed** |
| `lua-entries.sweep.spec.ts` | **6 passed**, nineteen entries, 543 combinations |
| `lua-smoke.spec.ts` | **3 passed**, both non-vacuity halves asserted |
| `filter.spec.ts` / `sort.spec.ts` | **6 passed each** |
| `vendored-diff.spec.ts` | **14 passed** |
| `npm run test:quick \| check-counts 74 780` | **74 files / 780 passed + 1 todo** — `PREV + 0 / PREV + 0` |
| `npm run test:sweep \| check-counts 4 19` | **`4 19`** |
| `npm run build` | exit 0, 28 PNGs in `static/og/` and 28 in `build/og/` |
| `npm run test:quick` again, after the build | **74 / 780 + 1 todo** |
| `npm run check 2>&1 \| grep -Ei "error\|warning"` | `559 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run lint` | exit 0 |
| `git diff --stat HEAD -- src/vendor/` | prints nothing |
| `FRONT_DOOR` | byte-untouched and still **eight**; `EXCLUDED_FROM_ROW` now **twenty** |
| `frames.json` shape | `Object.keys(j.entries).length` **28**, `j.ticks.join()` **`0,37,101,500,1009`** |
| Two consecutive `UPDATE_FRAMES=1` runs | byte-identical |
| Three-stage negative check | observed with the outcomes above and restored byte-identical |
| LUMEN's `@CC` values against `@CC + 1 < 128` | tops 17, 49, 81, 103 — all under 128 |
| LUMEN's depth term at the bottom row | 28, 20, 12, 4 of 36 — positive at every `@DEPTH` |
| STAGE's `@KEY0` values against `@KEY0 + 8 < 256` | tops 112, 38, 66, 97 — all under 256 |
| SHUTTLE's `@GAIN` values against `@GAIN * 4 < 256` | 32, 64, 96, 128 — all under 256 |
| `gks` arity, per call shipped | STAGE `(10 - 1) % 3 = 0`; SHUTTLE `(4 - 1) % 3 = 0` |
| Every HID usage id | verified against the USB HID Usage Tables, Keyboard/Keypad page 0x07 |
| Keepers and decays | LUMEN's stored Lua holds zero `glt`, `glf`, `glpfs` and zero 65535; STAGE's and SHUTTLE's hold zero 65535 |

The three declarations are in place for all three entries: `grep -c '"lumen"' listing.ts`,
`grep -c 'id: "lumen"' front-door.ts` and the same for `stage` and `shuttle` each print **1**, all
three are in `CATALOG` and all three are re-exported by name.

No device was connected to, looked for or written to. Nothing under `src/vendor/` was read for
editing or edited. Nothing under `src/lib/tune/` was touched. No sibling repository was touched.
`wrangler` was not run. `test-results/` and `.tmp-audition/` were removed by hand. The scratch
harness used to canonicalise, measure and probe the three configurations was a temporary spec file
under `src/lib/catalog/` that was deleted before every commit and never added to the repository;
`git status --short` prints nothing as this plan leaves it.

---

## Commits

| Commit | What |
| --- | --- |
| `d7497e5` | `feat(09-06): LUMEN - the pad is the colour it is sending` |
| `07b2b8d` | `feat(09-06): STAGE and SHUTTLE - the first cards HANGAR cannot show working` |
| `967184b` | `chore(09-06): the fixture at twenty-eight, a twenty-three chip row, three bench rows` |

## Self-Check: PASSED

All three entry files, `frames.json`, `docs/HARDWARE-AUDITION.md`, `deferred-items.md` and this
SUMMARY are on disk; all three commit hashes resolve in `git log`. `grep -c` over `listing.ts` and
`front-door.ts` prints **1** for each of `lumen`, `stage` and `shuttle` in both files, and
`front-door.ts` holds **28** ids — twenty excluded plus the eight of the untouched ring.
`grep -q "produced HID at all" src/lib/sim/lua-smoke.spec.ts` exits **0** and
`grep -c "09-06 adds it"` prints **0**, so the assertion is in and the promise it replaced is out.
Every character count, wall time, MIDI and HID reading, frame record, rendered pixel, chip count and
negative-check message quoted above was read from a runner's or a script's own output in this
session, and every canonical Lua string was dumped from `renderLua` after the final format pass and
re-confirmed by `AUDITION_DUMP=1`.
