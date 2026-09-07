---
phase: 09-twenty-configurations
plan: 05
subsystem: catalog
tags:
  [
    CONT-02,
    CONT-03,
    TUNE-01,
    lua-entries,
    control-surfaces,
    fourteen-bit-cc,
    mapping-helper,
    latching,
    D-04,
    deferred-items,
    chip-row,
  ]

# Dependency graph
requires:
  - ".planning/phases/09-twenty-configurations/09-04-SUMMARY.md - the rolling pair PREV_FILES 74 / PREV_TESTS 780 (+1 todo), BASE_SWEEP `4 19` at 416 combinations, PREV_E2E 89, svelte-check 553, KNOWN_TAGS 47, chip row 16, ROW_COUNT 18, PHASE_ADDED_AT = 2026-09-07 copied verbatim, and the rule that +y RUNS DOWN, which decided LEARN's bottom row and CONSOLE's level term"
  - ".planning/phases/09-twenty-configurations/09-01-SUMMARY.md - HOST_GLOBALS (15) and HOST_SELF_METHODS (9). Every call site of all three entries was resolved against them before the entries were committed and the classifier was never edited; it is why CONSOLE's, STRIP's and LEARN's repaint helpers are `local function`s rather than `self:` methods"
  - "09-CONTEXT.md D-01..D-12 and the amendment block - every entry is kind: \"lua\", the 49.6 per cent single-layer cap is what binds, and D-04 (no inbound MIDI in this phase) is the source of all three honest limits and of deferred item 1"
  - ".planning/research/ZONA-CAPABILITIES.md 3.2 and 489-493 - the self:gms mode table and the rule that mode 1 sends the least significant byte on p1 + 32, which is the hard constraint on STRIP's controller knob"
  - ".planning/research/USE-CASES.md 1.3 and open question 5 - the XY_LEARN_EVIDENCE dossier that LEARN is built on, and the Mackie question CONSOLE answers by refusing"
  - "src/vendor/botor/_pad.ts:290 (sends.faders is 3 | 4), :346-352 and :2637 (soloStream is audition-only and encodeStamp never writes it), :1143 (hiRes is card-wide and excludes the faders kind) - the three route arguments"
provides:
  - "The rolling pair for 09-06: PREV_FILES 74, PREV_TESTS 780 (+ 1 todo) - unchanged, as an entry wave must be"
  - "Three configurations: CONSOLE (nine-strip mixer with a mute latch), STRIP (whole-pad fourteen-bit fader, hi-res range unlocked), LEARN (mapping helper, featured). Twenty-five catalog entries, sixteen of them hand-authored Lua"
  - "The sweep is 482 combinations over sixteen entries (416 + 22 + 22 + 22); the test count is still 6"
  - "The standing chip row at twenty-five entries: TWENTY-TWO chips, up from sixteen. Six tags crossed the two-carrier threshold in one wave - latching, mixing, rails, modulation, utility and precise - re-recorded in both browse specs and in 05.1-UI-SPEC.md"
  - "KNOWN_TAGS unchanged at 47. The first entry wave of this phase that coins no tag at all"
  - "docs/HARDWARE-AUDITION.md at twenty-one rows, ROW_COUNT 21, and a cost table of sixteen"
  - ".planning/phases/09-twenty-configurations/deferred-items.md, opened with item 1: Mackie Control is not attempted and cannot be until inbound MIDI is proven"
  - "THE PHASE-SET-ONCE PICTURE: when a repaint changes only WHICH colour a cell carries and never how bright it is, glp goes in Setup for all 81 cells and the redraw is glc alone. STRIP and LEARN both repaint the whole pad and both are cheap because of it"
  - "A HEADER CLAIM MUST NOT COUNT ITSELF. `grep -c \"65535\"` and `grep -c \"16383\"` over an entry FILE count the header's own warnings; the claim belongs to the stored Lua and has to say so"
affects:
  - "09-06 to 09-09 - the entry template, the nine-part header plus the route note, the four-channel knob rule, the phase-set-once picture, and the self-counting header trap"
  - "09-10's phase gate - ROW_COUNT is 21 as this plan leaves it and the cost table is sixteen; deferred-items.md now exists and 09-06 appends item 2 rather than creating the file"
  - "05.1-UI-SPEC.md, The tag chips and the ASCII mock - re-taken at twenty-five by this plan, and the row moved by six chips rather than by one"

tech-stack:
  added: []
  patterns:
    - "SET THE PHASES ONCE, REPAINT THE COLOURS. STRIP and LEARN both redraw all 81 cells on a change. Both are affordable because every cell's phase is written to 255 in Setup and never again, so the redraw is one glc per layer per cell and nothing else. A redraw that also wrote glp would be half again as long for a picture whose brightness never varies"
    - "A HEADER CLAIM MUST NOT COUNT ITSELF. Two claims in this wave were written as `grep -c` over the entry FILE, and both were false the moment the header named the number it was warning about. The measurable claim is over the SETUP string, and both headers now say so. Measured: the stored Lua of all three holds zero 65535, zero glt, zero glf and zero glpfs"
    - "CHECK A DIVISOR AT THE TOP OF ITS RANGE, NOT IN THE MIDDLE. The plan's fine term x*8//1023 returns 8 at x = 1023, which is a fourth bit in a field described as three. //1024 is the correct divisor and the difference only ever shows at one coordinate"
    - "A PLAN'S PICTURE AND A PLAN'S HONEST LIMIT CAN CONTRADICT EACH OTHER, AND THE LIMIT WINS. CONSOLE's mechanism asked for a rail on the top AND bottom cell of every column while its honest limit claimed nine steps per strip. Nine steps needs all eight body cells, so the rail is the top cell alone - and that cap is also the mute button, so the mute row costs no cells either"
    - "WHAT THE BROWSER RECORDS IS NOT ALWAYS WHAT THE WIRE CARRIES. self:gms with mode 1 becomes two CC messages on the module and exactly one HostMidi in HANGAR. The entry header, the SUMMARY and the bench row all say which of the two they are talking about, and the test asserts only the observable"

key-files:
  created:
    - "src/lib/catalog/entries/console.ts"
    - "src/lib/catalog/entries/strip.ts"
    - "src/lib/catalog/entries/learn.ts"
    - ".planning/phases/09-twenty-configurations/deferred-items.md"
    - ".planning/phases/09-twenty-configurations/09-05-SUMMARY.md"
  modified:
    - "src/lib/catalog/index.ts"
    - "src/lib/catalog/listing.ts"
    - "src/lib/catalog/front-door.ts"
    - "src/lib/catalog/frames.json"
    - "src/lib/catalog/audition.spec.ts"
    - "src/lib/browse/filter.spec.ts"
    - "src/lib/browse/sort.spec.ts"
    - "docs/HARDWARE-AUDITION.md"
    - ".planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md"

decisions:
  - "CONSOLE ships as NINE strips, not eight plus a master, and its rail is the TOP CELL of each column rather than the top and bottom. Dimming the bottom cell too would leave seven body cells and eight level steps, which contradicts the card's own honest limit that nine steps is the resolution the pad has. The cap doubles as the mute button, so the mute row costs no cells"
  - "CONSOLE ships as plain controller messages and is not a Mackie Control surface. The header says so in those words and the question is deferred item 1 rather than a silence"
  - "Sliding a muted CONSOLE column clears its mute. Moving a fader is an unambiguous request for that level, and the alternative - a slide that stores a level it does not send - is a control that lies"
  - "STRIP's fine term is x*8//1024, not the plan's x*8//1023, which returns 8 at the top of the axis and is a fourth bit in a field the plan calls three"
  - "STRIP's ninth vernier cell is a rail. Three bits is eight positions over nine cells; nine positions would need coarse*9 + fine, whose maximum is 18431 and outside fourteen bits"
  - "STRIP's stored Lua holds exactly one 16383 and it is the value clamp; both axis maxima are 1023. The count is made over the SETUP string because the header names the trap five more times on purpose"
  - "LEARN's mode cell is NOT separately lit. In a solo mode the pad must carry exactly one lit shape, because the legend and the thing the host is about to bind have to be the same thing; a second shape would dilute it. The centre tap lives in the card copy instead"
  - "All three are declared static, and the fixture agreed with all three at every sampled tick. All three quiet lines were written with the entry, as the plan asked, and none was corrected"
  - "KNOWN_TAGS was not touched. Every tag all three entries carry was already in the vocabulary and already carried, confirmed by copy.spec.ts test 3 in both directions rather than by reading"

requirements-completed: []
requirements-contributed: [CONT-02, CONT-03, TUNE-01]

# Metrics
duration: 41min
completed: 2026-09-07
---

# Phase 9 Plan 05: CONSOLE, STRIP and LEARN — Summary

A mixer whose mute is a latch the compiler has no word for, a fader that spends eighty-one cells on
one fourteen-bit number and is honest about what the browser can see of it, and the configuration
that fixes a twenty-year mapping papercut on the device itself — plus the phase's first deferred
item, written down instead of answered by silence, and a chip row that moved by six chips in one
wave.

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
  asserted). `check-counts 74 780` printed *"matches the expected counts"*. Three configurations
  moved no test count, because every catalog gate loops over the entries internally.
- sweep: `BASE_SWEEP 4 19 + 0 = 4 19`. The growth is paid in wall time, not in tests: **416 + 66 =
  482 combinations** over **13 + 3 = 16** hand-authored entries.
- svelte-check: `553 + 3 = 556` files, `0 errors, 0 warnings`. The three new files are the three
  entries. Provenance only — the count line is never asserted.
- e2e: **not run.**
- catalog: `22 + 3 = 25`. Lua entries `13 + 3 = 16`. `EXCLUDED_FROM_ROW` `14 + 3 = 17`.
  **`FRONT_DOOR` is byte-untouched and still eight** (D-02).

`PHASE_ADDED_AT` is **`2026-09-07`**, copied verbatim into `console.ts`, `strip.ts`, `learn.ts` and
their three `LISTING` rows. Nobody used a run date.

---

## CONSOLE

**The card.** Nine faders side by side, one per column. Slide anywhere in a column to set that
strip's level; tap the cell at the top of the column to mute it, and tap it again to put the level
back exactly where it was.

**It ships as NINE strips, not eight plus a master**, and the header, the description and the code
all say nine. The rail is the top cell of each column — see deviation 2 — and that cap is also the
mute button, so neither the rail nor the mute row costs a column.

### Route note

`kind: "lua"`, and either half would decide it alone. `sends.faders` is typed **`3 | 4`**
(`_pad.ts:290`), so a nine-strip mixer is outside the vocabulary by a literal type; and **there is no
mute anywhere in the sends sheet**, in either branch — `sends.toggle` is read only when `sends.kind`
is `"zones"` and it toggles a note, not a fader. Nine strips with a latching mute row is outside the
vocabulary twice over.

### It is not a Mackie Control surface

`USE-CASES.md`'s open question 5 asks whether MCU is reachable and answers that MCU is bidirectional
and a controller that only talks is half a controller. This entry does not attempt it, says so in the
header in those words, and the question is **deferred item 1** rather than an absence a later reader
has to reconstruct.

### Canonical Setup at the defaults, verbatim (785)

```
--[[@cb]]self.v={}self.m={}local function P(s,c)local m=s.m[c]local h=s.v[c]for r=0,8 do local a=glag(0,c+r*9)if r==0 then if m then glc(a,1,255,40,0,1)glc(a,2,255,40,0,1)else glc(a,1,60,60,60,1)glc(a,2,60,60,60,1)end glp(a,1,255)glp(a,2,255)elseif m then glc(a,2,255,40,0,1)glp(a,1,0)glp(a,2,8-r<h and 90 or 0)else glc(a,1,0,200,255,1)glc(a,2,0,200,255,1)local p=8-r<h and 255 or 0 glp(a,1,p)glp(a,2,p)end end end for c=0,8 do self.v[c]=4 P(self,c)end self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then return end local c=x*9//128 local r=y*9//128 if r==0 then if e==4 or e>8 then local m=not s.m[c]s.m[c]=m s:gms(0,176,16+c,m and 0 or s.v[c]*127//8,0)P(s,c)end return end local h=8-r if h~=s.v[c]or s.m[c]then s.v[c]=h s.m[c]=nil s:gms(0,176,16+c,h*127//8,0)P(s,c)end end
```

### Canonical Timer at the defaults, verbatim (0)

```

```

The empty string, written inline, the same shape MORPH, SLAM, KEYS, GRIDLOCK and TABLE use.
`compressScript("")` is `""` — already a fixed point — and `checkSyntax("")` is `true`.

### The substitution table

| Token | Knob id | Needle in the canonical text | Sites | Default |
| --- | --- | --- | --- | --- |
| `@CC` | `cc` | the `16` of both `s:gms(0,176,16+c,…)` | 2 Setup, 0 Timer | index 0 |
| `@CH` | `channel` | the leading `0` of both `s:gms(0,…)` | 2 Setup, 0 Timer | index 0 |
| `@LEVELC` | `level` | `0,200,255` in both `glc(a,_,…)` of the lit branch | 2 Setup, 0 Timer | index 0 |
| `@RAILC` | `rail` | `60,60,60` in both `glc(a,_,…)` of the unmuted cap | 2 Setup, 0 Timer | index 0 |
| `@MUTEC` | `mute` | `255,40,0` in the muted cap's two `glc` and the muted body's one | 3 Setup, 0 Timer | index 0 |

`90` (the muted body's phase), `255`, `4` (the arrival level) and `127//8` are **literals, not
knobs**, and the header says why for each.

### Six numbers, and the corner

| | Setup | Timer |
| --- | --- | --- |
| defaults | **785** | **0** |
| all-longest corner | **789** | **0** |
| all-shortest corner | **780** | **0** |

**Free at the worst corner: 119 of 908.** **Combinations: 22** (`4+4+4+4+4 + 2`).

### The `@CC + 8 < 128` arithmetic, checked at the largest value

| `@CC` | top controller `@CC + 8` | inside 128 |
| --- | --- | --- |
| 16 | 24 | yes |
| 48 | 56 | yes |
| 80 | 88 | yes |
| 102 | 110 | yes |

Checked by script over the knob's own `values` array rather than by reading:
`["16","48","80","102"] -> tops [24,56,88,110] all < 128: true`.

### The mute, observed rather than read

A scripted host run against the entry as `renderLua` produces it, not a reading of the source.

```
rest lit cells 45
after slide in column 3 (x=48, y=20), midi [[19,111]]
after a slide in column 8 (x=120, y=100), midi [[19],[24]]
mute tap then unmute tap on column 3's top cell   [[19,0],[19,111]]
errors []  pending 0
```

Column 3 sends controller `16 + 3 = 19` and **nothing else**; column 8 sends `24` and nothing else.
The mute tap sends the column's controller at **0**; the second tap sends **111**, which is the level
the column had before it was muted — `4*127//8` at rest is 63 and the slide had raised it to
`7*127//8 = 111`. `self.v[c]` is never touched by muting, which is why the restore is exact rather
than approximate.

The picture, one column at a time, read off the rendered frame:

```
col 3 at rest   59/59/59  0/0/0  0/0/0  0/0/0  0/0/0  0/198/253 ×4
col 3 at level 7 59/59/59  0/0/0  0/198/253 ×7
col 4 meanwhile 59/59/59  0/0/0  0/0/0  0/0/0  0/0/0  0/198/253 ×4   (untouched)
col 3 muted    253/39/0   0/0/0  44/7/0 ×7
col 3 unmuted   59/59/59  0/0/0  0/198/253 ×7                        (identical to level 7)
```

The muted column keeps its level visible at a dim warm phase, which is what makes the restore
legible before it happens.

### Traps

Every division floored. `@CC + 8 < 128` at every knob value, above. Code 9 handled — the mute test is
`e == 4 or e > 8`, and an `e == 5` branch would miss every fast tap on the mute row. Colour channels
inside 0..255 by construction. **No keeper and no decay**: the stored Lua holds zero `65535`, zero
`glt`, zero `glf` and zero `glpfs`, measured over the SETUP string.

**And the latch warning, which is HOLD's.** Firmware advances `prev_*` before the writability check,
so a dropped release leaves a permanently stuck contact and `pad-sim.ts` states plainly that it
cannot manufacture one. A latching configuration can look perfect in a browser and stick on hardware;
here that presents as a mute that latches on and will not clear. Row 13 is HOLD's bench row for the
bug and **row 19 is CONSOLE's**.

**The honest limit, for the card copy:** nine steps per strip is the resolution the pad has — this is
a control surface, not a motorised console — and it cannot show what the mixer is doing, because
nothing in this phase receives (D-04).

---

## STRIP

**The card.** The whole pad is one long fader, with a fine row along the bottom for the last few
numbers.

### Route note

`kind: "lua"`, two reasons in the same sheet. `sends.faders` is typed **`3 | 4`** (`_pad.ts:290`), so
one whole-pad fader is outside the vocabulary by a literal type; and **`sends.hiRes` is a card-wide
flag, not a per-fader one** — `_pad.ts:1143` excludes the `faders` kind from the hi-res coordinate
range entirely (`s.sends.hiRes && s.sends.kind !== "faders" ? 1024 : 128`). A single fourteen-bit
fader with a vernier row is not expressible as a `PadState`.

### Canonical Setup at the defaults, verbatim (638)

```
--[[@cb]]self:txma(1023)self:tyma(1023)local function D(h,f)for n=0,80 do local a=glag(0,n)local r=n//9 if r==8 then if n%9==f then glc(a,1,255,180,60,1)glc(a,2,255,180,60,1)else glc(a,1,0,25,50,1)glc(a,2,0,25,50,1)end elseif 8-r<=h then glc(a,1,0,200,255,1)glc(a,2,0,200,255,1)else glc(a,1,0,25,50,1)glc(a,2,0,25,50,1)end end end for n=0,80 do local a=glag(0,n)glp(a,1,255)glp(a,2,255)end self.h=4 self.f=0 D(4,0)self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then return end local v=(1023-y)*2047//1023 local f=x*8//1024 s:gms(0,176,1,glim(v*8+f,0,16383),1)local h=v*9//2048 if h~=s.h or f~=s.f then s.h=h s.f=f D(h,f)end end
```

### Canonical Timer at the defaults, verbatim (0)

```

```

### The substitution table

| Token | Knob id | Needle in the canonical text | Sites | Default |
| --- | --- | --- | --- | --- |
| `@CC` | `cc` | the `1` of `s:gms(0,176,1,glim(…),1)` | 1 Setup, 0 Timer | index 0 |
| `@CH` | `channel` | the leading `0` of that same `s:gms` | 1 Setup, 0 Timer | index 0 |
| `@BARC` | `bar` | `0,200,255` in both `glc(a,_,…)` of the bar branch | 2 Setup, 0 Timer | index 0 |
| `@VERNC` | `vernier` | `255,180,60` in both `glc(a,_,…)` of the vernier branch | 2 Setup, 0 Timer | index 0 |
| `@RAILC` | `rail` | `0,25,50` in the two unlit branches, on two layers each | 4 Setup, 0 Timer | index 0 |

`1023`, `2047`, `1024`, `2048`, `16383` and the arrival pair `4, 0` are **literals, not knobs**, and
the header says why for each. The two `1023`s are the axis maxima and the third is the divisor that
scales them; none of the three is ever a knob, because a knob on any of them would change the meaning
of the number the card sends.

### Six numbers, and the corner

| | Setup | Timer |
| --- | --- | --- |
| defaults | **638** | **0** |
| all-longest corner | **646** | **0** |
| all-shortest corner | **634** | **0** |

**Free at the worst corner: 262 of 908.** **Combinations: 22** (`4+4+4+4+4 + 2`).

### The controller values, checked against the 0..31 rule

Mode 1 sends the least significant byte on `p1 + 32`, so a controller above 31 would put the low
seven bits on a real controller number, silently and only under fine movement. Checked by script over
the knob's own `values` array:

```
["1","7","11","16"] -> all 0..31: true
```

| `@CC` | what it is | its mode-1 partner `@CC + 32` |
| --- | --- | --- |
| 1 | modulation wheel | 33 |
| 7 | volume | 39 |
| 11 | expression | 43 |
| 16 | general purpose 1 | 48 |

### The per-send record, observed — one `gms`, `mode: 1`, `p1` in range

A scripted host run: a press and eight moves up the pad, nine samples.

```
coordMax 1023
gestures 9 -> recorded messages 9; one per call is the observable
every message mode 1: true | every p1 in 0..31: true | every p2 in 0..16383: true
values [4,1924,3844,5764,7684,9604,11524,13444,15364]
monotone rising: true
errors []  pending 0
```

**The pair is firmware expansion HANGAR records but does not simulate.** On the module one
`self:gms(ch, 0xB0, p1, v, 1)` becomes `CC p1 = v//128` followed by `CC p1+32 = v%128`
(`ZONA-CAPABILITIES.md:489-493`). `lua-host.ts:556-572` pushes exactly one `HostMidi` per `gms` call
and stores `mode` as a field on it, so the browser never sees a pair and no test here asserts one.
Whether the two arrive, arrive in order, and arrive in the same 10 ms cycle for a host to reassemble
is **audition row 20**, and it is the only place it can be checked.

A separate run confirms both ends of the range are reachable: a press at the top right,
`(x=1023, y=0)`, produced `[[1, 16383]]` — exactly the maximum, because `2047*8 + 7` is `16383` and
not one less. A fine sweep at a fixed height produced `[8176, 8177, 8178, 8179, 8180, 8181, 8182,
8183]`, which is the vernier moving the low three bits one at a time with the coarse half held still.

### The `16383` count and the `txma(16383)` trap

`grep -c "16383" src/lib/catalog/entries/strip.ts` prints **6**, and five of those are the header
naming the trap on purpose. The claim that matters is over the STORED LUA, and it was measured rather
than asserted:

```
occurrences of 16383 in the stored Lua: 1
occurrences of txma: 1 | txma argument: 1023
tyma argument: 1023
glim call: glim(v*8+f,0,16383)
```

`16384 * 1023 / 1024` is `16368`, so an axis maximum of 16383 would make the top fifteen codes
permanently unreachable and the fader would stop short of the top for no visible reason. The header
refuses it by name. See deviation 3 — the original wording of that claim counted itself.

### The ninth vernier cell

Three bits is eight positions and the bottom row has nine cells, so cell 8 of that row never lights
and is painted as rail. Nine vernier positions would need `coarse*9 + fine`, whose maximum is 18431 —
outside fourteen bits. The ninth cell is spent on the rail rather than on a number that cannot be
sent, and the header says so.

**The honest limit, for the card copy:** fourteen bits of resolution shown through nine cells. You
can send a number finer than you can see; the bar moves once every 2048 steps of the coarse half, and
the vernier row is the only part of the picture that moves at all for the last three bits.

---

## LEARN

**The card.** A mapping helper. It sends one axis at a time and lights the row or column it is
sending on, so a host that binds the next incoming message binds the right control the first time.

### Route note — the sharpest one in the phase

`kind: "lua"`, because **the compiler has this idea and deliberately refuses to persist it**.
`PadState.soloStream` exists and compiles a variant body that emits exactly one stream, and
`_pad.ts:346-352` says in its own words that it is *"AUDITION-ONLY derived state"*, that
*"encodeStamp never writes it, so the stamp always records the real card and readPad can never
mistake a solo leftover for the user's configuration"*, and that *"withChange, fit and the ledger
strip it before measuring"*. `encodeStamp` restates it at `:2637`: *"soloStream is never written:
encodeStamp(solo variant) equals encodeStamp(base)"*. A configuration whose whole point is soloing
one stream cannot BE a `PadState`, because the one field that would express it is deliberately not
persistable — a stamp carrying it would round-trip back to the un-soloed card.

### Canonical Setup at the defaults, verbatim (657)

```
--[[@cb]]self.k=0 self.x=-9 self.y=-9 local function L(k)for n=0,80 do local a=glag(0,n)if(k~=1 and n>71)or(k~=0 and n%9==0)then glc(a,1,0,255,120,1)glc(a,2,0,255,120,1)else glc(a,1,0,25,50,1)glc(a,2,0,25,50,1)end end end for n=0,80 do local a=glag(0,n)glp(a,1,255)glp(a,2,255)end L(0)self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then return end if x*9//128+y*9//128*9==40 then if e==4 or e>8 then local k=(s.k+1)%3 s.k=k L(k)end return end local k=s.k if k~=1 then local v=x*127//128 if v-s.x>=2 or s.x-v>=2 then s.x=v s:gms(0,176,1,v,0)end end if k~=0 then local v=y*127//128 if v-s.y>=2 or s.y-v>=2 then s.y=v s:gms(0,176,1+1,v,0)end end end
```

### Canonical Timer at the defaults, verbatim (0)

```

```

### The substitution table

| Token | Knob id | Needle in the canonical text | Sites | Default |
| --- | --- | --- | --- | --- |
| `@CC` | `cc` | the `1` of `s:gms(0,176,1,v,0)` and the leading `1` of `1+1` | 2 Setup, 0 Timer | index 0 |
| `@CH` | `channel` | the leading `0` of both `s:gms(0,…)` | 2 Setup, 0 Timer | index 0 |
| `@ONC` | `on` | `0,255,120` in both `glc(a,_,…)` of the active branch | 2 Setup, 0 Timer | index 0 |
| `@OFFC` | `off` | `0,25,50` in both `glc(a,_,…)` of the idle branch | 2 Setup, 0 Timer | index 0 |
| `@STEP` | `step` | all four `2`s — two comparisons per axis | 4 Setup, 0 Timer | index 1 |

`-9` (the two sentinels), `40` (the centre cell) and `3` (the mode count) are **literals, not
knobs**. `-9` is chosen so that the first sample of either axis always sends at every value of
`@STEP`, whose largest value is 8.

### Six numbers, and the corner

| | Setup | Timer |
| --- | --- | --- |
| defaults | **657** | **0** |
| all-longest corner | **665** | **0** |
| all-shortest corner | **655** | **0** |

**Free at the worst corner: 243 of 908.** **Combinations: 22** (`4+4+4+4+4 + 2`).

### The per-mode message counts, from a scripted run

The same diagonal drag run three times, with a tap on the centre cell between runs to advance the
mode. Counted by controller number, not read from the source:

| mode | messages | on controller 1 (X) | on controller 2 (Y) | bright cells | which cells |
| --- | --- | --- | --- | --- | --- |
| 0 — X only | **8** | **8** | **0** | 9 | 72, 73, 74, 75, 76, 77, 78, 79, 80 — the bottom row |
| 1 — Y only | **8** | **0** | **8** | 9 | 0, 9, 18, 27, 36, 45, 54, 63, 72 — the left column |
| 2 — both | **16** | **8** | **8** | 17 | both, sharing the bottom-left corner |

`errors: []`, `pending: 0`. **In a solo mode the other axis is not sent at all** — not at a fixed
value, not at its last value: the count is zero. That is the entire feature, because a host's learn
function latches onto whatever moves and a constant stream is still a stream.

`+y` runs down, so the bottom row is cells 72..80 and it is what mode 0 lights — a horizontal bar for
the horizontal axis. The left column is `n%9 == 0` and it is what mode 1 lights.

### The mode cell is not separately lit, and that is the point

The centre cell paints in `@OFFC` like every other cell that is not the active axis. In a solo mode
the pad must carry exactly **one** lit shape, so that what you see and what the host is about to bind
are the same thing; a second lit shape would dilute the legend, which is the whole product. The card
copy carries the centre tap instead, where it costs no light. The header states the reason so a later
reader does not "fix" it.

**The honest limit, for the card copy:** it fixes the problem on the device and it cannot tell you
whether the host heard it. Nothing in this phase receives (D-04), so the pad shows what it is
sending, never what the DAW has bound.

---

## The three deviations

### Auto-fixed issues

**1. [Rule 1 — bug] `x*8//1023` returns 8, which is a fourth bit in a three-bit field**

- **Found during:** Task 9-05-02, checking the vernier divisor at the top of its range before writing
  it.
- **Issue:** The plan specifies `fine = x*8//1023`, described in the same paragraph as *"0..7, three
  bits"*. At `x = 1023` — which is reachable, because Setup unlocks the axis to exactly 1023 — the
  expression is `8184//1023`, which is **8**. That is four bits, not three, and it would push
  `coarse*8 + fine` to 16384 at the top right corner, where `glim` would crop it to 16383 and the top
  two codes would collide. It also breaks the picture: the lit vernier cell would be column 8 for one
  coordinate and column 7 for the 127 below it.
- **Fix:** `fine = x*8//1024`. One character. The maximum is now `2047*8 + 7 = 16383` exactly, which
  is why the clamp is a guard rather than a cropper, and the top-right press was measured producing
  `[[1, 16383]]`.
- **Files modified:** `src/lib/catalog/entries/strip.ts`.
- **Commit:** `87144b6`.

**2. [Rule 1 — bug] CONSOLE's rail contradicted CONSOLE's honest limit**

- **Found during:** Task 9-05-01, working the level arithmetic out before choosing the paint pass.
- **Issue:** The plan's mechanism asks for the rail to be drawn *"by dimming the top and bottom cell
  of each column"*, and the same plan's honest limit says *"Nine steps per strip is the resolution
  the pad has"*. The two cannot both hold: a column with a rail at the top and a rail at the bottom
  has seven body cells and therefore eight level values, not nine. Its own `lv = 8 - y*9//128` term,
  which produces 0..8, says nine.
- **Fix:** the rail is the **top cell alone**, and that cap is also the mute button. Level 0..8 is
  nine values drawn over the eight body cells — row `r` in 1..8 is lit when `8-r < h`, so `h = 0`
  lights nothing and `h = 8` lights all eight. The rail therefore costs no column and the mute row
  costs no cells either, which is the third of the three differences that earn CONSOLE its place
  beside the shelf's `faders`. The header states the trade and the description agrees with the code.
  Measured: 45 lit cells at rest — nine caps and thirty-six level cells at the arrival level of 4.
- **Files modified:** `src/lib/catalog/entries/console.ts`.
- **Commit:** `7a017c5`.

**3. [Rule 1 — bug] Two header claims that counted themselves**

- **Found during:** Task 9-05-03, running the acceptance criteria's own `grep -c` checks.
- **Issue:** STRIP's header said *"The only 16383 in this file is the value clamp"* and CONSOLE's said
  *"`grep -c "65535"` over this file prints 0"*. Both were false as written, and both were falsified
  by the sentence making the claim: the greps print **6** and **1**, because a header that names a
  trap number contains that number. A later reader running the check would find a red count and no
  fault.
- **Fix:** both claims are now made about the **stored Lua**, and both say so explicitly. Measured
  over the SETUP string of all three entries: zero `65535`, zero `glt`, zero `glf`, zero `glpfs`; and
  STRIP holds exactly one `16383`, which is the clamp, with both axis maxima at 1023.
- **Files modified:** `src/lib/catalog/entries/strip.ts`, `src/lib/catalog/entries/console.ts`.
- **Commit:** `9838289`.

### Scope notes, recorded because a later reader will wonder

- **No tag was coined, and `KNOWN_TAGS` was not touched.** This is the first entry wave of the phase
  where that is true. Every one of the twelve tags the three entries carry — `mixing`, `rails`,
  `readable`, `latching`, `precise`, `modulation`, `hands-free`, `utility`, `xy-control` — was
  already a member and already carried. Confirmed by `copy.spec.ts` test 3, which gates the
  vocabulary in both directions and reports **5 passed**, rather than by reading the array.
- **The repaint helpers are `local function`s, not methods on `self`.** A `self:` call is classified
  against `HOST_SELF_METHODS`, which has nine members and would refuse `self:P(...)`;
  `host-surface.spec.ts`'s classifier admits a local declared in the same event. 09-01's gate decided
  the shape of all three entries before a line of any of them was written, exactly as it decided
  TABLE's.
- **Sliding a muted CONSOLE column clears its mute.** The plan does not say what a slide on a muted
  strip should do. A slide that stores a level it does not send is a control that lies, so the slide
  wins and the mute clears. The mute is restored by tapping the cap again, which is where it came
  from.
- **STRIP and LEARN both write every cell's phase once, in Setup, and never again.** Both repaint all
  81 cells on a change, and both are affordable only because the repaint is `glc` alone — the
  brightness of every cell in both pictures is the same at every moment, and only the colour moves.
  A repaint that also wrote `glp` would be half again as long for no visible difference.
- **CONSOLE repaints one column, not the pad**, and the repaint is gated on the level actually
  changing. A sample that lands on the same level in the same column paints nothing. Observed: a
  slide in column 8 that landed on the arrival level sent nothing at all until the level moved.
- **All three are Setup-only for the same reason and it is a new one.** MORPH and SLAM animate under
  a finger, KEYS paints a map, GRIDLOCK carries its own countdown, TABLE redraws on a boundary. These
  three are **control surfaces whose picture is a readout of the last value you sent**, repainted on
  the change that caused it and never otherwise. The audition document now names all eight together
  with that eighth reason written out.

---

## The fixture, and three declarations it agreed with

`UPDATE_FRAMES=1` was run once for all three entries, then **again**, and the second file is
**byte-identical** (`diff -q` silent). The fixture covers **25** entries at `0,37,101,500,1009`.

| Entry | `restsBlack` declared | fixture | `motion` declared in tasks 1-2 | fixture says | outcome |
| --- | --- | --- | --- | --- | --- |
| `console` | false | 99 non-zero bytes at all five ticks | static | `animating: false` at all five | **agrees** |
| `strip` | false | 163 non-zero bytes at all five ticks | static | `animating: false` at all five | **agrees** |
| `learn` | false | 162 non-zero bytes at all five ticks | static | `animating: false` at all five | **agrees** |

Every entry's five records carry the same `sha256` as its tick-0 record, which is what a card with
nothing advancing on its own looks like in this fixture.

**No motion correction was forced, and the plan predicted that.** All three ship `timer: ""` and none
of them moves without a finger, so `listing.spec.ts:211-225` requires a non-empty single-line `quiet`
for each, and all three were written into the `LISTING` row with the entry rather than discovered
here:

> **CONSOLE** — The nine levels hold where you left them; this pad only moves when your hand does.
> (82 characters)
>
> **STRIP** — The bar rests at the number you last sent; nothing here moves on its own. (73
> characters)
>
> **LEARN** — The lit row or column is the legend, and it stays lit until you change the mode. (80
> characters)

Each is one line, second person, present tense, no exclamation mark, no emoji, no ASCII apostrophe
between letters, no hyphen doing a dash's job, no ellipsis, and none is `RESTS_DARK_NOTE` — which
belongs only to a `restsBlack: true` entry, and none of this wave's three is one. `copy.spec.ts`
test 2 counts all three by the same rules it counts a description by, and it reports **5 passed**.
The three descriptions are 97, 91 and 90 characters against the 110 cap.

The catalog's motion census is now **12 animated, 10 static, 3 dark**, so `listing.spec.ts`'s
requirement that all three motions occur is satisfied with room on every side. The three still cards
09-04 opened have become six.

---

## The chip row, before and after — six chips in one wave

| | Old (twenty-two entries) | New (twenty-five entries) |
| --- | --- | --- |
| `entries` | 22 | **25** |
| `tags` | 47 | **47** |
| `singletons` | 31 | **25** |
| chips | 16 | **22** |

```
old  playable (8) · drums (4) · expressive (4) · gestural (4) · generative (3) · hypnotic (3)
     · readable (3) · xy-control (3) · ambient (2) · blooming (2) · colour (2) · grid (2)
     · hands-free (2) · harmonic (2) · rippling (2) · sequencer (2)

new  playable (8) · readable (6) · drums (4) · expressive (4) · gestural (4) · xy-control (4)
     · generative (3) · hands-free (3) · hypnotic (3) · precise (3) · ambient (2) · blooming (2)
     · colour (2) · grid (2) · harmonic (2) · latching (2) · mixing (2) · modulation (2)
     · rails (2) · rippling (2) · sequencer (2) · utility (2)
```

**`latching` crossed into the standing row, and it is not alone.** The plan predicted one crossing —
`latching`, which arrived with HOLD as a singleton in 09-03 and takes its second carrier here in
CONSOLE. **Six** crossed:

| tag | old carriers | new carriers |
| --- | --- | --- |
| `latching` | HOLD | HOLD, **CONSOLE** |
| `mixing` | faders | faders, **CONSOLE** |
| `rails` | faders | faders, **CONSOLE** |
| `modulation` | ARC | ARC, **STRIP** |
| `utility` | tpad | tpad, **LEARN** |
| `precise` | dial | dial, **STRIP**, **LEARN** (3) |

`readable` gained three and is now second in the row at six; `xy-control` and `hands-free` each
gained one. This is the first time the phase moves the chip row by design rather than by arithmetic:
a wave of three control surfaces is a wave that re-uses the utility half of the vocabulary, and six
singletons finding a second carrier at once is what that looks like in the census.

**New `RECORDED` values.** `filter.spec.ts`: `entries: 25, tags: 47, singletons: 25`, the
twenty-two chips above and
`chipCounts: [8, 6, 4, 4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]`. `sort.spec.ts`:
`{ entries: 25, featured: 11 }` — LEARN is this wave's one featured entry. Both derived with a
throwaway script over `LISTING` in the gitignored scratch directory and confirmed by the rule
assertions in the same tests; both files still report **6 passed**.

**`KNOWN_TAGS` gains nothing and stays at 47**, confirmed by `copy.spec.ts` test 3 — which asserts
`KNOWN_TAGS.length === carried.size` and names any tag declared and not carried — rather than by
reading the array.

### The document that quotes the row

`.planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md`, **"The tag chips"**. Nothing in the
repository goes red when it drifts, which is exactly why it is checked first.

**Old lines, verbatim:**

> catalog grows. **Re-recorded at twenty-two entries by 09-04** (it was nine chips at sixteen entries
> when Phase 5.1 wrote this section, and fourteen at nineteen after 09-03; every entry wave of Phase 9
> re-takes it, and 09-10 confirms the final row at thirty-six entries). Today that is sixteen:
>
> > `playable` (8) · `drums` (4) · `expressive` (4) · `gestural` (4) · `generative` (3) · `hypnotic` (3)
> > · `readable` (3) · `xy-control` (3) · `ambient` (2) · `blooming` (2) · `colour` (2) · `grid` (2)
> > · `hands-free` (2) · `harmonic` (2) · `rippling` (2) · `sequencer` (2)

**New lines, verbatim:**

> catalog grows. **Re-recorded at twenty-five entries by 09-05** (it was nine chips at sixteen
> entries when Phase 5.1 wrote this section, fourteen at nineteen after 09-03 and sixteen at
> twenty-two after 09-04; every entry wave of Phase 9 re-takes it, and 09-10 confirms the final row at
> thirty-six entries). Today that is twenty-two:
>
> > `playable` (8) · `readable` (6) · `drums` (4) · `expressive` (4) · `gestural` (4) · `xy-control` (4)
> > · `generative` (3) · `hands-free` (3) · `hypnotic` (3) · `precise` (3) · `ambient` (2) · `blooming` (2)
> > · `colour` (2) · `grid` (2) · `harmonic` (2) · `latching` (2) · `mixing` (2) · `modulation` (2)
> > · `rails` (2) · `rippling` (2) · `sequencer` (2) · `utility` (2)

The paragraph beneath it moved from *"remaining 31"* to **25** and from *"forty-seven 44px chips
above twenty-two live pads"* to **twenty-five**. The ASCII mock at the top of the same document was
re-taken too: its tag block became five lines in the new order, and its count line went from
`22 of 22 configurations.` to `25 of 25 configurations.`

---

## The three audition rows, verbatim, and the new `ROW_COUNT`

`ROW_COUNT` in `src/lib/catalog/audition.spec.ts` is **21**, and the test title reads *"keeps
twenty-one numbered rows"*. `docs/HARDWARE-AUDITION.md` has twenty-one numbered rows, contiguous
from 1.

| # | Config | What to check | Why it cannot be simulated |
| --- | --- | --- | --- |
| 19 | **CONSOLE** | Mute and unmute a strip a dozen times quickly, in different columns. Does a mute ever stick on, or clear on its own? | The same firmware stuck-contact bug row 13 covers: `prev_*` advances before the writability check, and the simulator states it cannot manufacture a stuck contact. A latch is where that bug shows. |
| 20 | **STRIP** | Move slowly across one cell's worth of travel while watching the host's value. Do the low seven bits move smoothly, or jump? | **This is where the two-message claim is checked, and it is the only place it can be.** One `gms` with `mode: 1` becomes two CC messages on the wire — `@CC` then `@CC + 32` — and firmware, not HANGAR, does the expanding: `lua-host.ts` records one message per call and stores `mode` as a field, so the browser never sees a pair. Whether the two arrive, arrive in order, and arrive in the same cycle for the host to reassemble is a wire question no simulator answers. |
| 21 | **LEARN** | Put your host into learn mode, choose X-only, and move. Does it latch onto exactly one control? | Whether a host's learn function is satisfied by this message pattern is a property of the host, and there is no host in a browser. |

### The cost table, now sixteen

`## The thirteen, and what they cost` became `## The sixteen, and what they cost`, with every new
number taken from this wave's own measurement:

| id | name | Setup | Timer | knobs | dark at rest |
| --- | --- | --- | --- | --- | --- |
| `console` | CONSOLE | 785 | 0 — **no Timer** | 5 | no |
| `strip` | STRIP | 638 | 0 — **no Timer** | 5 | no |
| `learn` | LEARN | 657 | 0 — **no Timer** | 5 | no |

**The Setup-only note is now eight names rather than five**, with a new reason written out for the
three that join it: CONSOLE, STRIP and LEARN are control surfaces whose picture is a readout of the
last value you sent, repainted on the change that caused it and never otherwise. The document's prose
counts moved with its rows: *"Twenty-one rows"* twice, *"twenty-one lines"*, *"sixteen Setup files and
eight Timer files"*, the opening paragraph's list of Phase 9 entries (now nine names, "the first
nine"), and item 4's exemption, which is now eight configurations. Item 4 keeps the substring
`MORPH … Setup only` inside one sentence with no full stop in it, because `audition.spec.ts` matches
`/MORPH[^.]{0,200}Setup only/` — and it was re-worded to put "Setup only" **before** the reason
rather than after it, because eight names plus the reason would have pushed the match past 200
characters.

### `AUDITION_DUMP=1`, all sixteen

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
```

Every printed count matches the recorded numbers above. `.tmp-audition/` holds **sixteen**
`.setup.lua` files and **eight** `.timer.lua` files, which is what the document now says.

---

## Deferred item 1, verbatim

`.planning/phases/09-twenty-configurations/deferred-items.md` was created by this plan and holds:

> ## 1. Mackie Control is not attempted, and cannot be until inbound MIDI is proven (decided by 09-05)
>
> `USE-CASES.md`'s open question 5 and `09-CONTEXT.md`'s open item 3 both ask whether CONSOLE should
> be an MCU surface. It is not. MCU is a bidirectional protocol — the desk sends fader positions,
> track names and meter data back — and `midirx_cb` is verified in firmware source and never tested
> on a rig, which is exactly the block D-04 places on the whole clock-locked family.
> `docs/MIDI-IN-PROBE.md` is the bench test that would unblock it. CONSOLE ships as plain controller
> messages and says so on the card; an MCU surface would be a different configuration, not a knob on
> this one.

09-CONTEXT.md's open item 3 — *"Whether CONSOLE ships, given that Mackie Control is a bidirectional
protocol and a controller that only talks is half a controller"* — is answered by this plan in the
only way it can be answered without inbound MIDI: **CONSOLE ships, and it is not a Mackie Control
surface.**

---

## `SMOKE_REPORT=1`, the three new entries

```
console: 7 MIDI, 0 HID, first three MIDI (0,176,17,111,0) (0,176,18,95,0) (0,176,19,79,0)
strip:   8 MIDI, 0 HID, first three MIDI (0,176,1,13089,1) (0,176,1,11458,1) (0,176,1,9827,1)
learn:   7 MIDI, 0 HID, first three MIDI (0,176,1,24,0) (0,176,1,37,0) (0,176,1,50,0)
```

Three readings worth stating. **CONSOLE walks across the strips.** The gate's drag is a diagonal, so
each sample lands in a new column at a new level and the controller number climbs with the finger —
17, 18, 19 for columns 1, 2 and 3 — while the value falls, because the drag descends and the level
is `8 - row`. The fast tap lands in column 1 at row 3, off the mute row, so it sets a level rather
than toggling anything.

**STRIP is the only entry in the catalog whose `p2` exceeds 127**, and the smoke line is where that
is visible at a glance: `13089`, `11458`, `9827`, every one with `mode: 1` and `p1: 1`. It is also
the only entry that reports `coordMax 1023`, because the gate reads the maximum the entry declared
and scales its drag to it — which is exactly why `DRAG` is written as fractions.

**LEARN is quiet by design.** Seven messages from a seven-sample drag, all on controller 1, none on
controller 2, because the default mode is X only and the suppressed axis is not sent at all. Every
entry still reads **0 HID**, so 09-06's deferred assertion is still correctly deferred.

---

## Three wall times, before and after

Taken on the same machine in the same session. The "before" column was measured by writing the
pre-wave `index.ts`, `listing.ts` and `front-door.ts` from `4ce5c17` over the working copy with
`git show`, measuring, and writing them back from `HEAD` — no `git checkout` of an unperturbed path,
and `git diff --quiet` on all three exited **0** afterwards.

| Measurement | Before (22 entries, 13 Lua) | After (25 entries, 16 Lua) |
| --- | --- | --- |
| `lua-entries.sweep.spec.ts` alone | **2.06 s** tests / 2.59 s wall | **2.31 s** tests / 2.85 s wall |
| `npm run build` | **10.409 s** | **10.630 s** |
| `static/og/` | **131,485 bytes**, 22 PNGs | **148,343 bytes**, 25 PNGs |

The sweep grew from 416 combinations to **482** — 832 measured events to 964 — for 0.25 s of test
time. The build is 0.2 s slower, which is inside this machine's run-to-run noise; three more
prerendered pages and three more OG images still cost nothing measurable at this size. The 22-entry
"before" reproduces 09-04's closing numbers **exactly** (131,485 bytes, 22 PNGs), which is the
cross-check that the plant was the tree 09-04 left.

The three new OG images, from the build's own log: `console 5175 bytes, 45 of 81 cells lit`,
`strip 5858 bytes, 81 of 81`, `learn 5825 bytes, 81 of 81`. `build/og/` holds 25.

**One thing went wrong and is recorded rather than tidied away.** The first "before" measurement
planted `9c7b4ce` — the commit at the top of the session's opening `git log`, which is Phase **7**'s
closing commit and a **sixteen**-entry catalog, not the pre-wave twenty-two. `gen-og` printed sixteen
images and the mistake was visible immediately in that number. The correct pre-wave commit is
`4ce5c17`, the measurement was re-taken against it, and the 131,485-byte cross-check against 09-04 is
what confirms the second plant was right. Nothing was committed from the wrong plant.

---

## The two negative checks

Each was planted, observed with the stated command, restored with `git checkout --`, and
`git diff --quiet` on the perturbed path exited **0** afterwards. Everything this wave created was
committed **before** anything was perturbed, so no restore passed vacuously.

| # | Task | Perturbation | Observed |
| --- | --- | --- | --- |
| 1 | 9-05-03 | one hex digit of CONSOLE's tick-0 hash in `frames.json`, `5` → `a` | **Red on test 3**, naming the entry and the tick: `console at tick 0: frame hash changed: expected '5084788766b9a0f171403d53c882399833488…' to be 'a084788766b9a0f171403d53c882399833488…'`. `Tests 1 failed \| 4 passed (5)` |
| 2 | 9-05-03 | `RECORDED.featured` in `sort.spec.ts` reverted from 11 to its old 10 | **Red on the FEATURED test**, naming the count: `the recorded featured count: expected [ …(11) ] to have a length of 10 but got 11`. `Tests 1 failed \| 5 passed (6)` |

Both restored files reported their full counts again immediately afterwards — `frames.spec.ts`
**5 passed**, `sort.spec.ts` **6 passed** — and `git status --short` prints nothing as this plan
leaves it.

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
| `npx vitest run --project server src/lib/catalog/` | **7 files, 41 passed** |
| `lua-entries.sweep.spec.ts` | **6 passed**, twenty-five entries, 482 combinations |
| `lua-smoke.spec.ts` | **3 passed**, all three producing MIDI |
| `filter.spec.ts` / `sort.spec.ts` | **6 passed each** |
| `vendored-diff.spec.ts` | **14 passed** |
| `npm run test:quick \| check-counts 74 780` | **74 files / 780 passed + 1 todo** — `PREV + 0 / PREV + 0` |
| `npm run test:sweep \| check-counts 4 19` | **`4 19`** |
| `npm run build` | exit 0, 25 PNGs in `static/og/` and 25 in `build/og/` |
| `npm run test:quick` again, after the build | **74 / 780 + 1 todo** |
| `npm run check 2>&1 \| grep -Ei "error\|warning"` | `556 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run lint` | exit 0 |
| `git diff --stat HEAD -- src/vendor/` | prints nothing |
| `FRONT_DOOR` | byte-untouched and still **eight**; `EXCLUDED_FROM_ROW` now **seventeen** |
| `frames.json` shape | `Object.keys(j.entries).length` **25**, `j.ticks.join()` **`0,37,101,500,1009`** |
| Two consecutive `UPDATE_FRAMES=1` runs | byte-identical |
| Two negative checks | observed with the stated outcomes and reverted byte-identical |
| STRIP's `@CC` values against 0..31 | `["1","7","11","16"] -> all 0..31: true` |
| STRIP's stored Lua | one `16383` (the clamp); `txma` and `tyma` both `1023` |
| CONSOLE's `@CC` values against `@CC + 8 < 128` | tops `[24, 56, 88, 110]`, all under 128 |
| LEARN's `@CC` values against `@CC + 1 < 128` | tops `[2, 17, 75, 103]`, all under 128 |
| Keepers and decays in all three stored Lua strings | zero `65535`, zero `glt`, zero `glf`, zero `glpfs` |

The three declarations are in place for all three entries: `grep -c '"console"' listing.ts`,
`grep -c 'id: "console"' front-door.ts` and the same for `strip` and `learn` each print **1**, all
three are in `CATALOG` and all three are re-exported by name.

No device was connected to, looked for or written to. Nothing under `src/vendor/` was read for
editing or edited. Nothing under `src/lib/tune/` was touched. No sibling repository was touched.
`wrangler` was not run. `test-results/` was not created. The scratch harness used to render, measure
and probe the three configurations lives in the gitignored `.tmp-audition/scratch/` and was never
added to the repository.

---

## Commits

| Commit | What |
| --- | --- |
| `7a017c5` | `feat(09-05): CONSOLE - nine strips, a cap that is the rail and the mute` |
| `87144b6` | `feat(09-05): STRIP and LEARN - one fourteen-bit fader, and the mapping papercut` |
| `c59ef49` | `chore(09-05): the fixture at twenty-five, a twenty-two chip row, three bench rows` |
| `9838289` | `docs(09-05): two header claims that counted themselves, corrected` |

## Self-Check: PASSED

All three entry files, `deferred-items.md`, `frames.json`, `docs/HARDWARE-AUDITION.md` and this
SUMMARY are on disk; all four commit hashes resolve in `git log`. `grep -c` over `listing.ts` and
`front-door.ts` prints **1** for each of `console`, `strip` and `learn` in both files, and
`front-door.ts` holds **25** ids — seventeen excluded plus the eight of the untouched ring. Every
character count, wall time, MIDI reading, frame record, chip count and negative-check message quoted
above was read from a runner's or a script's own output in this session, and every canonical Lua
string was dumped from `renderLua` after the final format pass and re-confirmed by
`AUDITION_DUMP=1`.
