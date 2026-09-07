---
phase: 09-twenty-configurations
plan: 04
subsystem: catalog
tags:
  [
    CONT-02,
    CONT-03,
    TUNE-01,
    lua-entries,
    in-key-grid,
    clip-launcher,
    wavetable-plot,
    D-04,
    derived-timeout,
    tune-panel-vocabulary,
  ]

# Dependency graph
requires:
  - ".planning/phases/09-twenty-configurations/09-03-SUMMARY.md - the rolling pair PREV_FILES 74 / PREV_TESTS 780 (+1 todo), BASE_SWEEP `4 19`, PREV_E2E 89, svelte-check 550, PHASE_ADDED_AT = 2026-09-07 copied verbatim, and THE DECAY ARITHMETIC, which this wave applies per cell rather than per entry"
  - ".planning/phases/09-twenty-configurations/09-01-SUMMARY.md - HOST_GLOBALS (15) and HOST_SELF_METHODS (9); every call site of all three new entries resolved against them before the entries were committed, and the classifier was never edited. It is why TABLE's redraw helper is a `local function` and not a `self:` method"
  - "09-CONTEXT.md D-01..D-12 and the amendment block - every entry is kind: \"lua\", the 49.6 per cent single-layer cap is what binds, and D-04 (no inbound MIDI in this phase) is the source of GRIDLOCK's honest limit"
  - ".planning/research/ZONA-CAPABILITIES.md sections 2.2, 2.3 and 2.4 - `+y runs DOWN` and `glag(0, x + y*9)` is plain row-major, glc's forced minimum black, and the uint8 phase that wraps"
  - "src/lib/tune/view.ts SCALE_WORDS and src/lib/tune/knobs.lua.spec.ts - the shipped scale vocabulary, which decided KEYS's @SCALE encoding after a cheaper one was measured and rejected"
provides:
  - "The rolling pair for 09-05: PREV_FILES 74, PREV_TESTS 780 (+ 1 todo) - unchanged, as an entry wave must be"
  - "Three configurations: KEYS (in-key note grid, featured), GRIDLOCK (81-clip launcher), TABLE (wavetable plot). Twenty-two catalog entries, thirteen of them hand-authored Lua"
  - "The sweep is 416 combinations over thirteen entries (354 + 22 + 22 + 18); the test count is still 6"
  - "The standing chip row at twenty-two entries: sixteen chips, re-recorded in both browse specs and in 05.1-UI-SPEC.md"
  - "KNOWN_TAGS at 47 - in-key, clips, launcher, wavetable and sound-design coined"
  - "docs/HARDWARE-AUDITION.md at eighteen rows, ROW_COUNT 18, and a cost table of thirteen"
  - "A DERIVED TIMEOUT, for any later wave whose animation staggers its starting phase per cell: when every cell starts at a different phase, the LENGTH is derived from the PHASE rather than the phase from the length, or a uniform timeout strands each ring at a different brightness"
  - "A `scale` knob's values are read by src/lib/tune/view.ts's SCALE_WORDS. Any encoding outside that table renders as a numbered rail and turns knobs.lua.spec.ts and view.spec.ts red"
affects:
  - "09-05 to 09-09 - the entry template, the nine-part header plus the route note, the four-channel knob rule, the derived-timeout arithmetic, and the tune-panel vocabulary constraint on `scale` and `note` knobs"
  - "09-10's phase gate - the cost table in docs/HARDWARE-AUDITION.md becomes twenty-seven and the checklist grows again; ROW_COUNT is 18 as this plan leaves it"
  - "05.1-UI-SPEC.md, The tag chips and the ASCII mock - re-recorded at twenty-two by this plan, and re-taken by every later entry wave"

tech-stack:
  added: []
  patterns:
    - "A KNOB'S VALUES ARE ALSO A DISPLAY VOCABULARY. `scale` values go through src/lib/tune/view.ts's SCALE_WORDS and `note` values through noteName; a value outside the table renders as a numbered rail, and two shipped specs derive their vocabulary FROM the catalog so a new encoding is red rather than ugly. The cheapest Lua is not automatically the right literal"
    - "WHEN THE STARTING PHASE IS STAGGERED PER CELL, THE TIMEOUT IS DERIVED FROM THE PHASE. 09-03's rule - a decay's rate follows its length - inverts here: every GRIDLOCK cell starts at its own phase and its own timeout is (256 - p)//4, so all 81 cells land on exactly 0 on their own tick. A uniform timeout would strand each ring at a different brightness and there is no Timer to repaint them"
    - "A MONOTONE SHAPE COUPLES BRIGHTNESS TO LIFETIME, so an expanding ring cannot be built from a decay. With shape 0 brightness IS the phase, so a cell that starts bright also lives longest and any staggered decay implodes. The ring is built on the WRAP instead: every cell climbs to exactly 256 and freezes at 0, so the peak sweeps outward and the layer ends black"
    - "A PLAN'S COST PREDICTION IS AN EXPECTATION, NOT A MEASUREMENT. TABLE's four-by-nine literal table was predicted not to fit and is three characters CHEAPER than the arithmetic form. The arithmetic form shipped anyway, and the header says the reason is legibility rather than cost"
    - "AN ENTRY IS CORRECTED AGAINST THE MODULE'S GEOMETRY BEFORE IT IS CORRECTED AGAINST TASTE. +y runs down, so a note grid written as base + column + row*interval plays lower as your hand goes up. The fix is four characters and the header names the source line"

key-files:
  created:
    - "src/lib/catalog/entries/keys.ts"
    - "src/lib/catalog/entries/gridlock.ts"
    - "src/lib/catalog/entries/table.ts"
    - ".planning/phases/09-twenty-configurations/09-04-SUMMARY.md"
  modified:
    - "src/lib/catalog/index.ts"
    - "src/lib/catalog/listing.ts"
    - "src/lib/catalog/front-door.ts"
    - "src/lib/catalog/frames.json"
    - "src/lib/catalog/copy.spec.ts"
    - "src/lib/catalog/audition.spec.ts"
    - "src/lib/browse/filter.spec.ts"
    - "src/lib/browse/sort.spec.ts"
    - "docs/HARDWARE-AUDITION.md"
    - ".planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md"

decisions:
  - "KEYS's @SCALE carries semitone lists, not the plan's decimal bit masks. The masks were computed, checked against their degree lists, measured canonical through the pinned minifier and are 48 characters cheaper - and src/lib/tune/view.ts's SCALE_WORDS knows only semitone sets, so knobs.lua.spec.ts and view.spec.ts both went red naming the entry. The plan forbids editing src/lib/tune/, and the semitone list is the vocabulary this repository already has"
  - "KEYS's row term is (8 - row), not row. +y runs down on this module, so the plan's note = base + column + row*interval puts the lowest note at the top and lowers the pitch as your hand goes up"
  - "KEYS's row interval is 3, 5, 7, 4 rather than 3, 5, 7, 12. Twelve semitones a row spans 104 over nine rows, which forces @BASE under 24 by the plan's own range rule - four sensible root notes do not exist under that ceiling, and nine columns of an octave layout leave three degrees off the pad"
  - "GRIDLOCK's ripple is a phase CLIMB to the uint8 wrap, not the plan's decay at a fixed rate of 250, and its timeout is derived per cell as (256 - p)//4. A monotone shape couples brightness to lifetime, so any staggered decay makes the lit region shrink toward the fired cell; the climb makes the peak sweep outward and lands every cell on exactly 0"
  - "GRIDLOCK's ring spacing is 8, 16, 24, 32 rather than 24, 32, 48, 64, and every value is a multiple of four so the derived timeout is exact. The default is the widest, index 3"
  - "GRIDLOCK's velocity is v*14+14, not v+1. The plan's row-in-the-velocity mapping is kept; nine velocities of 1 to 9 are inside range and inaudible, and 14 to 126 is the same nine steps in a range a DAW will actually distinguish"
  - "TABLE ships the arithmetic plot, and the plan's cost prediction was wrong. The four-by-nine literal table fits easily and is three characters cheaper (526/533 against 529/536). Legibility decided it, not the budget, and the header says so"
  - "All three are declared static, and the fixture agreed with all three at every sampled tick. All three quiet lines were written with the entry, as the plan asked"
  - "The three new tags each entry coined went into KNOWN_TAGS in the SAME commit as the entry that carries them, following 09-03's precedent: copy.spec.ts test 3 gates the vocabulary in both directions"

requirements-completed: []
requirements-contributed: [CONT-02, CONT-03, TUNE-01]

# Metrics
duration: 62min
completed: 2026-09-07
---

# Phase 9 Plan 04: KEYS, GRIDLOCK and TABLE — Summary

A note grid that removes the wrong notes instead of marking them, an eighty-one cell launcher whose
ring is a receipt and whose layer lands on exact black at every knob setting, and a wavetable pad
that draws the shape it is asking for — plus two findings the next wave inherits: a knob's values are
also a display vocabulary, and a staggered phase inverts 09-03's decay rule rather than repeating it.

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

- quick: `PREV_FILES 74 + 0 = 74`, `PREV_TESTS 780 + 0 = 780` (+ 1 todo, reported and never asserted).
  Three configurations moved no test count, because every catalog gate loops over the entries
  internally.
- sweep: `BASE_SWEEP 4 19 + 0 = 4 19`. The growth is paid in wall time, not in tests.
- svelte-check: `550 + 3 = 553` files, `0 errors, 0 warnings`. The three new files are the three
  entries. Provenance only — the count line is never asserted.
- e2e: **not run.**

`PHASE_ADDED_AT` is **`2026-09-07`**, copied verbatim into `keys.ts`, `gridlock.ts`, `table.ts` and
their three `LISTING` rows. Nobody used a run date.

---

## KEYS

**The card.** Every note of one key laid across the pad. Roots bright, the rest of the scale dim, and
everything out of key not painted at all — so a wrong note is not a wrong note you played, it is a
cell that was never there.

**Route note.** `kind: "lua"`, because `sends.scale` is read only when `sends.kind` is `"zones"` and
**only on the 3x3 and 4x4 grids**. `_pad.ts:314-316` gives the reason in its own words: *"an 81-entry
table cannot fit the budget and an 81-zone scale is not an instrument, so the 9x9 grid stays
chromatic."* A 9x9 in-key grid is outside the vocabulary by an explicit compiler decision, and it is
the whole card.

### Canonical Setup at the defaults, verbatim (644)

```
--[[@cb]]self.k={}self.c={}local m={}for _,v in ipairs({0,2,4,5,7,9,11})do m[v]=1 end for n=0,80 do local p=36+n%9+(8-n//9)*5 local d=p%12 if m[d]then self.k[n]=p local a=glag(0,n)glc(a,1,255,180,60,1)glc(a,2,255,180,60,1)glp(a,1,d==0 and 255 or 0)glp(a,2,d==0 and 255 or 96)end end self.touch_cb=function(s,i,e,x,y)if e>=5 and e<9 then local o=s.c[i]if o then s:gms(0,128,s.k[o],0,0)glp(glag(0,o),1,s.k[o]%12==0 and 255 or 0)s.c[i]=nil end return end if e~=4 and e<9 then return end local o=x*9//128+y*9//128*9 local m=s.k[o]if m==nil then return end s:gms(0,144,m,100,0)if e==9 then s:gms(0,128,m,0,0)else glp(glag(0,o),1,255)s.c[i]=o end end
```

### Canonical Timer at the defaults, verbatim (0)

```

```

The empty string, written inline, the same shape MORPH and SLAM use. `compressScript("")` is `""` —
already a fixed point — and `checkSyntax("")` is `true`.

### The substitution table

| Token | Knob id | Needle in the canonical text | Sites | Default |
| --- | --- | --- | --- | --- |
| `@BASE` | `base` | the `36` in `local p=36+n%9+…` | 1 Setup, 0 Timer | index 0 |
| `@ROW` | `row` | the `5` in `(8-n//9)*5` | 1 Setup, 0 Timer | index 1 |
| `@SCALE` | `scale` | `0,2,4,5,7,9,11` inside `ipairs({…})` | 1 Setup, 0 Timer | index 0 |
| `@ROOTC` | `root` | `255,180,60` in both `glc(a,_,…)` | 2 Setup, 0 Timer | index 0 |
| `@CH` | `channel` | the leading `0` of all three `s:gms(0,…)` | 3 Setup, 0 Timer | index 0 |

`96` (the in-scale phase) and `100` (the velocity) are **literals, not knobs**, and the header says
why for each.

### Six numbers, and the corner

| | Setup | Timer |
| --- | --- | --- |
| defaults | **644** | **0** |
| all-longest corner | **649** | **0** |
| all-shortest corner | **635** | **0** |

**Free at the worst corner: 259 of 908.** **Combinations: 22** (`4+4+4+4+4 + 2`).

### The four scales, checked against their degree lists

The plan asked for four twelve-bit masks. They were computed and checked first, then **rejected** —
see deviation 1. Both encodings are recorded here because the mask table is what the plan asked for
and the semitone list is what ships.

| Shipped `@SCALE` | Scale | Degrees it selects | Equivalent mask | Hex |
| --- | --- | --- | --- | --- |
| `0,2,4,5,7,9,11` | major | 0 2 4 5 7 9 11 | 2741 | `0xAB5` |
| `0,2,3,5,7,8,10` | natural minor | 0 2 3 5 7 8 10 | 1453 | `0x5AD` |
| `0,2,4,7,9` | major pentatonic | 0 2 4 7 9 | 661 | `0x295` |
| `0,2,4,6,8` | whole tone | 0 2 4 6 8 | 1365 | `0x555` |

Each mask was checked digit by digit against its degree list before it was written into a knob value:
`0xAB5 = 2560 + 176 + 5 = 2741 = 1+4+16+32+128+512+2048`, and the same arithmetic for the other
three. The masks are correct; they are simply the wrong literal for this repository.

Each shipped list was then checked **on the rendered frame**, not by reading: 141, 138, 99 and 105 lit
bytes - 47, 46, 33 and 35 of the 81 cells - for major, minor, pentatonic and whole tone, with the root lattice falling in the regular
diagonal an isomorphic layout produces. At the defaults the bottom row reads C, dark, D, dark, E, F,
dark, G, dark — degrees 0, 1, 2, 3, 4, 5, 6, 7, 8 of a C major grid, exactly.

### A press on a dark cell sends nothing, observed rather than read

A scripted host run, not a reading of the source. Contact 0 pressed at `(20, 120)` — bottom row,
column 1, note 37, C sharp, not in C major:

```
dark-cell press midi: []
dark-cell frame unchanged: true
```

Zero MIDI messages and a byte-identical frame. The same run then pressed the root at `(5, 120)` and
got `(0,144,36,100,0)` followed by its note-off on the lift, and pressed the in-scale D at
`(35, 120)`, whose red channel went from 47 to 174 and back to 47 after the lift. `back to rest: true`
against the tick-0 frame; `errors: []`; `pending: 0`.

The refusal is not a branch that tests membership under the finger — `self.k[cell]` simply does not
exist for an out-of-scale cell, so `local m=s.k[o]if m==nil then return end` is the lookup and the
refusal in one line.

### The three brightness levels, measured

Red channel on the rendered frame at the defaults: **root 253, in-scale 47, out of key 0**, and a
pressed in-scale cell 174. Root is two layers at phase 255; in-scale is one layer at phase 96, which
is where the "dim" in the description comes from. Row 16 of the bench checklist asks whether three
levels are still three at a metre, which is the half no frame hash can answer.

### The note range, at the corner the two knobs can reach

`@BASE + 8 + 8*@ROW` with `@BASE = 60` and `@ROW = 7` is **124**, inside 128. Confirmed on a run at
that corner: the top-right press produced `(0,144,124,100,0)` and `errors: []`.

**The honest limit, for the card copy:** two fingers on one cell clear that cell's light when the
first leaves, the same limitation LATTICE and the shipped Nine pads card carry; and a scale is a
picture, not a filter — the pad refuses to send a wrong note, it cannot stop a host transposing one.

---

## GRIDLOCK

**The card.** Eighty-one clips under one hand, and a ring rolls out from the one you fired so you know
it took.

**Route note.** `kind: "lua"`, because `sends.grid` is `"3x3" | "4x4" | "9x9"` and on the 9x9 the
compiler emits a chromatic zone map with one `gridColour` and one `heldColour` — **there is no
per-cell fired state and no ripple in the vocabulary at all.**

### Canonical Setup at the defaults, verbatim (425)

```
--[[@cb]]for n=0,80 do local a=glag(0,n)glc(a,1,255,90,0,1)glp(a,1,0)glc(a,2,0,60,90,1)glp(a,2,(n%9//3+n//9//3)%2==0 and 255 or 130)end self.touch_cb=function(s,i,e,x,y)if e~=4 and e<9 then return end local u=x*9//128 local v=y*9//128 for n=0,80 do local a=glag(0,n)local p=glim(248-math.max(math.abs(n%9-u),math.abs(n//9-v))*32,0,248)glpfs(a,1,p,4,0)glt(a,1,(256-p)//4)end s:gms(0,144,48+u,v*14+14,0)s:gms(0,128,48+u,0,0)end
```

### Canonical Timer at the defaults, verbatim (0)

```

```

### The substitution table

| Token | Knob id | Needle in the canonical text | Sites | Default |
| --- | --- | --- | --- | --- |
| `@RIPC` | `ripple` | `255,90,0` in `glc(a,1,…)` | 1 Setup, 0 Timer | index 0 |
| `@BLOCKC` | `blocks` | `0,60,90` in `glc(a,2,…)` | 1 Setup, 0 Timer | index 0 |
| `@SPREAD` | `spread` | the `32` in `…))*32,0,248)` | 1 Setup, 0 Timer | index 3 |
| `@BASE` | `base` | the `48` in both `s:gms(0,…,48+u,…)` | 2 Setup, 0 Timer | index 1 |
| `@CH` | `channel` | the leading `0` of both `s:gms(0,…)` | 2 Setup, 0 Timer | index 0 |

`248`, `4` and `130` are **literals, not knobs**, and the header says why for each.

### Six numbers, and the corner

| | Setup | Timer |
| --- | --- | --- |
| defaults | **425** | **0** |
| all-longest corner | **431** | **0** |
| all-shortest corner | **424** | **0** |

**Free at the worst corner: 477 of 908.** **Combinations: 22** (`4+4+4+4+4 + 2`).

### The note-and-velocity mapping, written out

**The column is the note and the row rides in the velocity.**

```
self:gms(@CH, 144, @BASE + u, v*14 + 14, 0)      u = x*9//128, v = y*9//128
self:gms(@CH, 128, @BASE + u, 0, 0)              unconditional, on the next line
```

Nine notes, `@BASE` to `@BASE + 8` — 48 to 56 at the defaults, and 60 to 68 at the highest value the
knob offers, inside 128. Nine velocities, **14 to 126, fourteen apart**, so no two rows land in the
same DAW velocity bucket. A reader will otherwise assume a note per cell, which does not fit: nine
tracks by nine scenes is eighty-one values and an eighty-one note range would push past 127.

Observed: a tap at `(10, 10)` produced `(0,144,48,14,0)` and its note-off; `(120, 20)` produced
`(0,144,56,28,0)`; `(60, 120)` produced `(0,144,52,126,0)`.

**The note-off is unconditional and immediate, and that is how the code-9 trap is answered by design
rather than by a branch.** Nothing is stored per contact, so a fast tap needs no special case
anywhere in the file. It is the one entry in this phase where that is true.

### The ripple form that shipped, and the two that were measured and rejected

| Form | What it does | Why not |
| --- | --- | --- |
| **shipped** — phase CLIMB to the wrap: `p = glim(248 - d*@SPREAD, 0, 248)`, rate `4`, `glt(a,1,(256-p)//4)` | every cell climbs to exactly 256, wraps to 0 and freezes there, so the peak sweeps outward and the layer is exact black afterwards | — |
| the plan's — decay at a fixed rate of 250 with a uniform `@TRAIL` | 09-03's finding, per cell: with 81 different starting phases a uniform timeout strands each ring at a different brightness, and GRIDLOCK has no Timer to repaint them | rejected |
| decay with a per-cell timeout `p//6` | lands on exact black, but a monotone shape couples brightness to lifetime — the brightest cell is the fired one and it therefore lives longest, so the lit region shrinks INWARD | rejected |

**Measured, at every value of the spread knob.** A corner fire, then 400 ticks, comparing the
rendered frame with the tick-0 frame byte for byte:

```
spread 8:  corner fire back to rest at tick 17, final identical true, errors []
spread 16: corner fire back to rest at tick 33, final identical true, errors []
spread 24: corner fire back to rest at tick 49, final identical true, errors []
spread 32: corner fire back to rest at tick 63, final identical true, errors []
```

Three overlapping fires in different places, five ticks apart, also settle to the byte-identical
resting frame.

**The ring, at four ticks of a centre fire** (the display caps at 99; the block picture is 44 and 22):

```
tick 0            tick 8            tick 16           tick 24
61 … 61           77 … 77           93 … 93           99 … 99
   77 … 77           93 … 93           99 … 99           99 … 99
      93 …              99 …              99 …              44 22 …
         99 99 99          99 44 99          44 44 44          22 44 44
```

The dark hole grows from the fired cell while the bright edge walks out to the border and leaves.

**The `glim` clamp, and the fault it prevents.** `248 - 8*32` is `-8`, and `pha` is a uint8 that
**wraps**: without the clamp the far corners would arrive at phase 248 and light up brightest of all —
a silent, plausible-looking fault nobody would find by reading. `grep -q "glim"
src/lib/catalog/entries/gridlock.ts` exits **0**.

**The honest limit, for the card copy:** the pad shows what **you** fired, not what the host is
playing. There is no inbound MIDI anywhere in this phase (D-04), so a clip that stops on its own, or
one launched from the mouse, leaves this pad with nothing to say about it. The ring confirms the
message left the module; it does not confirm the clip started. The description claims only the first.

---

## TABLE

**The card.** Slide across to change the wave and down to filter it, and the grid draws the shape you
land on.

**Route note.** `kind: "lua"`, because `look.kind` is
`none | breathe | shimmer | scan | wave | swirl | ripple | drift | showpiece` and **not one of them is
a data plot**; `sends.kind: "xy"` sends the two axes and paints nothing at all. The plot is the card.

### Canonical Setup at the defaults, verbatim (529)

```
--[[@cb]]local function D(w)for c=0,8 do local h=c if w==1 then h=(4-math.abs(c-4))*2 elseif w==2 then h=c<4 and 8 or 0 elseif w==3 then h=c%3*4 end h=glim(h,0,8)for r=0,8 do local a=glag(0,c+r*9)if r+h>7 then glc(a,1,0,200,255,1)glp(a,1,255)glc(a,2,0,200,255,1)glp(a,2,255)else glp(a,1,0)glc(a,2,0,25,50,1)glp(a,2,255)end end end end D(0)self.w=0 self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then return end s:gms(0,176,74,x*127//128,0)s:gms(0,176,74+1,y*127//128,0)local w=x*4//128 if w~=s.w then s.w=w D(w)end end
```

### Canonical Timer at the defaults, verbatim (0)

```

```

### The substitution table

| Token | Knob id | Needle in the canonical text | Sites | Default |
| --- | --- | --- | --- | --- |
| `@WAVEC` | `wave` | `0,200,255` in both `glc(a,_,…)` of the lit branch | 2 Setup, 0 Timer | index 0 |
| `@BGC` | `field` | `0,25,50` in `glc(a,2,…)` of the field branch | 1 Setup, 0 Timer | index 0 |
| `@CC` | `cc` | the `74` in `s:gms(0,176,74,…)` and the leading `74` of `74+1` | 2 Setup, 0 Timer | index 2 |
| `@CH` | `channel` | the leading `0` of both `s:gms(0,176,…)` | 2 Setup, 0 Timer | index 0 |

### Six numbers, and the corner

| | Setup | Timer |
| --- | --- | --- |
| defaults | **529** | **0** |
| all-longest corner | **536** | **0** |
| all-shortest corner | **527** | **0** |

**Free at the worst corner: 372 of 908.** **Combinations: 18** (`4+4+4+4 + 2`).

### Which plot form shipped, and what the other measured

Both were written out in full and measured through the pinned minifier at the defaults, at both
corners and at every single-knob variation — nineteen renders each, all canonical.

| Form | defaults | all-longest | all-shortest | free at worst |
| --- | --- | --- | --- | --- |
| **arithmetic (shipped)** | **529** | **536** | **527** | 372 |
| four-by-nine literal table | 526 | 533 | 524 | 375 |

**The plan's prediction was wrong and the measurement is recorded rather than argued away.** The plan
says *"a nine-entry table per shape is 36 literals and will not fit beside four knobs"*; it fits with
375 characters to spare and it is **three characters cheaper**. So cost did not decide this and the
header says so. The arithmetic form ships because each expression NAMES its shape — a reader sees a
triangle in `(4-math.abs(c-4))*2` and a pulse train in `c%3*4`, while 36 literals in a row name
nothing — and because a fifth shape is one `elseif` rather than nine more numbers.

The four heights, and the plot each draws:

```
0  saw          h = c                     0 1 2 3 4 5 6 7 8
1  triangle     h = (4-math.abs(c-4))*2   0 2 4 6 8 6 4 2 0
2  square       h = c<4 and 8 or 0        8 8 8 8 0 0 0 0 0
3  pulse train  h = c%3*4                 0 4 8 0 4 8 0 4 8
```

### The gated redraw, observed

```
shape 0 equals rest: true
after five y-only moves, plot unchanged: true
shape 1 lit 162   shape 2 lit 162   shape 3 lit 162
back at shape 0: true
errors: []  pending 0  midi count: 22
```

Five successive Y-only moves leave the rendered frame **byte-identical**; every X move that crosses a
shape boundary redraws; returning to the first quarter reproduces the tick-0 frame exactly. The sends
are ungated and ran throughout — 22 control messages across the run, X on CC 74 and Y on CC 75.

**Four knobs and no fifth token.** `grep -c "@SENSE\|"sense"" src/lib/catalog/entries/table.ts` prints
**0**, and every token TABLE declares is live in its Setup, which is what
`lua-entries.sweep.spec.ts`'s token-liveness check asserts and what the dropped knob would have
failed. The header records the reason without naming the token, so the grep stays at zero.

**The honest limit, for the card copy:** nine columns of nine cells is a caricature of a wavetable,
not an oscilloscope; and the pad draws the shape it is **asking for**, not the one the synth is
producing.

---

## The five deviations

### Auto-fixed issues

**1. [Rule 3 — blocking] A `scale` knob's values are a display vocabulary, and a bit mask is not in it**

- **Found during:** Task 9-04-01, on the first full quick run after KEYS landed.
- **Issue:** The plan specifies `@SCALE` as four decimal twelve-bit masks — 2741, 1453, 661, 1365 —
  tested with `(@SCALE >> note%12) & 1`. That build works: the bit operators survive the pinned
  minifier (canonical spelling `@SCALE>>d & 1==1`, with those exact spaces), run correctly in the VM,
  and are 48 characters cheaper than what shipped. But `src/lib/tune/view.ts`'s `SCALE_WORDS` maps a
  `scale` knob's literal to a display word and knows only **semitone sets**, so the tune panel would
  render `2741` on a numbered rail instead of `Major`. Two shipped gates say so out loud, and both
  derive their vocabulary FROM the catalog exactly so a new encoding is red rather than ugly:
  `knobs.lua.spec.ts` — `keys.scale is not a word row: expected 'rail' to be 'words'` — and
  `view.spec.ts` — `2741: expected undefined to be truthy`.
- **Fix:** `@SCALE` carries the semitone lists LATTICE and CHORUS already ship, and Setup turns the
  list into a twelve-slot lookup in one `ipairs` pass. The plan explicitly forbids editing anything
  under `src/lib/tune/`, and the semitone list is the vocabulary this repository already has, so
  widening `SCALE_WORDS` was never the cheaper answer. Cost: Setup 596 to 644. Both encodings and
  the mask-versus-degree check are recorded above.
- **Files modified:** `src/lib/catalog/entries/keys.ts`.
- **Commit:** `749499c`.

**2. [Rule 1 — bug] KEYS played lower as your hand went up**

- **Found during:** Task 9-04-01, checking the note map against the module's geometry before writing
  it.
- **Issue:** The plan's `note = @BASE + x + y*@ROW`. `ZONA-CAPABILITIES.md` section 2.2 records that
  **`+y` runs DOWN** and `glag(0, x + y*9)` is plain row-major, so `y*@ROW` puts the lowest note on
  the top row and raises the pitch as your hand descends. LATTICE, the entry KEYS is written against,
  uses `(8 - i//9)` for exactly this reason.
- **Fix:** `note = @BASE + n%9 + (8 - n//9)*@ROW`. Four characters. The bottom-left cell is `@BASE`
  and the top-right is `@BASE + 8 + 8*@ROW`, which is what the plan's own range rule is stated
  against.
- **Files modified:** `src/lib/catalog/entries/keys.ts`.
- **Commit:** `749499c`.

**3. [Rule 1 — bug] A row interval of 12 makes the plan's own range rule unsatisfiable**

- **Found during:** Task 9-04-01, working the range arithmetic out before choosing the `@BASE` values
  as the plan asks.
- **Issue:** The plan fixes `@ROW` at `3, 5, 7, 12` and requires `@BASE + 8 + 8*@ROW < 128` for every
  combination. At `@ROW = 12` that is `@BASE + 104 < 128`, so `@BASE < 24` — and four sensible root
  notes do not exist under that ceiling. Twelve semitones a row also spans eight octaves over nine
  rows, and a nine-column octave layout leaves three of every twelve degrees off the pad entirely.
- **Fix:** `@ROW` is `3, 5, 7, 4` — the default is still index 1, still 5, still fourths — and `@BASE`
  is `36, 48, 24, 60`, every value a multiple of twelve so `note%12` is the degree above the root with
  no subtraction. The corner is `60 + 8 + 8*7 = 124`, confirmed on a run at that corner:
  `(0,144,124,100,0)`.
- **Files modified:** `src/lib/catalog/entries/keys.ts`.
- **Commit:** `749499c`.

**4. [Rule 1 — bug] A staggered decay makes the ring collapse inward, and a fixed rate strands it**

- **Found during:** Task 9-04-02, working GRIDLOCK's ripple arithmetic against 09-03's decay finding.
- **Issue:** Two faults in one mechanism. First, the plan's `glpfs(a, 1, 255 - d*@SPREAD, 250, 0)`
  with a uniform `glt` is 09-03's finding per cell: 81 cells start at 81 different phases, so a single
  timeout strands every one of them at a different brightness, and **GRIDLOCK has no Timer to repaint
  anything**. Second, and deeper: with shape 0 the brightness IS the phase, so under any decay the
  brightest cell is also the longest-lived — the fired cell outlives its neighbours and the lit region
  shrinks toward it. A decay cannot produce an expanding ring at all, whatever the timeout.
- **Fix:** the phase CLIMBS to the wrap instead. `p = glim(248 - d*@SPREAD, 0, 248)` with rate `4` and
  a timeout derived per cell as `(256 - p)//4`, so every cell advances exactly 256 phase units, wraps
  to 0 on its last tick and freezes at exact black. The peak therefore sweeps outward — the fired cell
  first, the border last — and the layer is byte-identical to its resting state afterwards. Measured
  at all four spread values (back to rest at ticks 17, 33, 49 and 63) and after three overlapping
  fires. `@SPREAD` became `8, 16, 24, 32`, every value a multiple of four so the derived timeout is
  exact; the plan's `48` and `64` would clamp half the pad to phase 0 and fire it as one late flash.
- **Files modified:** `src/lib/catalog/entries/gridlock.ts`.
- **Commit:** `2a5c53b`.

**5. [Rule 2 — missing critical functionality] Nine velocities of 1 to 9 are inside range and inaudible**

- **Found during:** Task 9-04-02.
- **Issue:** The plan's send is `self:gms(@CH, 144, @BASE + cx, cy + 1, 0)` — the row in the velocity,
  as 1 to 9. Both bytes are legal, and a velocity of 1 is a note most instruments render as silence
  and many DAWs filter. The plan's own claim for the mapping is that it is *"mappable in a DAW in a
  minute"*, which 1 to 9 is not.
- **Fix:** `v*14 + 14`, which is the same nine steps spread over 14 to 126 — fourteen apart, so no two
  rows land in the same velocity bucket, and every one of them audible. Nine characters.
- **Files modified:** `src/lib/catalog/entries/gridlock.ts`.
- **Commit:** `2a5c53b`.

### Scope notes, recorded because a later reader will wonder

- **The five new tags went into `KNOWN_TAGS` in the entry commits, not in task 3.** `copy.spec.ts`
  test 3 gates the vocabulary in both directions and tasks 1 and 2 each ask for **5 passed**, so a tag
  has to arrive with the entry that carries it. 09-03 set the precedent with `latching`.
- **The stored KEYS Setup writes `if m[d]then` with no space**, which is the minifier's canonical
  spelling rather than a typo. The readable form fails the canonical-form gate on its first run — the
  same finding STEPS records for `if s.p[n]then` and SONAR for `if s.v[n]then`. It cost one
  measurement to find and is named as a trap in the header so the next reader does not "fix" it.
- **TABLE's redraw helper is a `local function`, not a method on `self`.** A `self:` call is
  classified against `HOST_SELF_METHODS`, which has nine members and would refuse `self:d(...)`;
  `host-surface.spec.ts`'s classifier admits a local declared in the same event, which is what a
  `local function` is. 09-01's gate decided the shape of this entry before a line of it was written.
- **`docs/HARDWARE-AUDITION.md`'s prose counts moved with its rows**: *"Fifteen rows"* twice,
  *"fifteen lines"*, *"ten Setup files and eight Timer files"* (now thirteen and eight), the opening
  paragraph's list of Phase 9 entries, and item 4's exemption, which is now five configurations rather
  than two. Item 4 keeps the substring `MORPH … Setup only` inside one sentence with no full stop in
  it, because `audition.spec.ts` matches `/MORPH[^.]{0,200}Setup only/`.
- **`05.1-UI-SPEC.md`'s full vocabulary table was left at sixteen entries**, with the sentence 09-03
  added saying so and pointing at `RECORDED`. Only the quoted chip row and the ASCII mock are
  load-bearing, and the plan scopes the edit to those two.
- **No entry in this wave has a Timer.** All five Setup-only configurations — MORPH, SLAM, KEYS,
  GRIDLOCK and TABLE — are now named together in the audition document with the reason each of them
  has nothing for a Timer to advance, because "no Timer" for five different reasons reads as an
  omission if the reasons are not written down.

---

## The fixture, and three declarations it agreed with

`UPDATE_FRAMES=1` was run once for all three entries, then **again**, and the second file is
**byte-identical** (`diff -q` silent). The fixture covers **22** entries at `0,37,101,500,1009`.

| Entry | `restsBlack` declared | fixture | `motion` declared in tasks 1-2 | fixture says | outcome |
| --- | --- | --- | --- | --- | --- |
| `keys` | false | 141 lit bytes at all five ticks | static | `animating: false` at all five | **agrees** |
| `gridlock` | false | 162 lit bytes at all five ticks | static | `animating: false` at all five | **agrees** |
| `table` | false | 162 lit bytes at all five ticks | static | `animating: false` at all five | **agrees** |

**No correction was forced, and the plan predicted that.** All three ship `timer: ""` and none of them
moves without a finger, so no sampled tick can report a running layer. `listing.spec.ts:211-225`
therefore requires a non-empty single-line `quiet` for each, and all three were written into the
`LISTING` row with the entry rather than discovered here:

> **KEYS** — The key sits on the pad whether or not anyone is playing it; the light is the map, not
> the motion. (98 characters)
>
> **GRIDLOCK** — The nine track blocks stay put until you fire a cell; every ring on this pad is one
> you started. (96 characters)
>
> **TABLE** — The plot holds the shape you last landed on; move across the pad and it redraws. (80
> characters)

Each is one line, second person, present tense, no exclamation mark, no emoji, no ASCII apostrophe
between letters, no hyphen doing a dash's job, no ellipsis, and none is `RESTS_DARK_NOTE` — which
belongs only to a `restsBlack: true` entry, and none of this wave's three is one. `copy.spec.ts` test
2 counts all three by the same rules it counts a description by, and it reports **5 passed**.

The catalog's motion census is now **12 animated, 7 static, 3 dark**, so `listing.spec.ts`'s
requirement that all three motions occur is satisfied with room on every side.

---

## The chip row, before and after

| | Old (nineteen entries) | New (twenty-two entries) |
| --- | --- | --- |
| `entries` | 19 | **22** |
| `tags` | 42 | **47** |
| `singletons` | 28 | **31** |
| chips | 14 | **16** |

```
old  playable (6) · drums (4) · expressive (4) · generative (3) · gestural (3) · hypnotic (3)
     · ambient (2) · blooming (2) · colour (2) · grid (2) · hands-free (2) · readable (2)
     · sequencer (2) · xy-control (2)

new  playable (8) · drums (4) · expressive (4) · gestural (4) · generative (3) · hypnotic (3)
     · readable (3) · xy-control (3) · ambient (2) · blooming (2) · colour (2) · grid (2)
     · hands-free (2) · harmonic (2) · rippling (2) · sequencer (2)
```

Two tags crossed the two-carrier threshold — `harmonic` (CHORUS plus KEYS) and `rippling` (Radar plus
GRIDLOCK) — `playable` gained two, and `gestural`, `readable` and `xy-control` each gained one.

**New `RECORDED` values.** `filter.spec.ts`: `entries: 22, tags: 47, singletons: 31`, the sixteen
chips above and `chipCounts: [8, 4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2]`. `sort.spec.ts`:
`{ entries: 22, featured: 10 }` — KEYS is this wave's one featured entry. Both derived with a
throwaway script over `LISTING` in the gitignored scratch directory and confirmed by the rule
assertions in the same tests; both files still report **6 passed**.

**`KNOWN_TAGS`** gains **`in-key`**, **`clips`**, **`launcher`**, **`wavetable`** and
**`sound-design`** and is **47**, sorted, gated in both directions. Every other tag this wave used —
`harmonic`, `playable`, `readable`, `rippling`, `xy-control`, `gestural` — was already a member,
confirmed against the array rather than by reading.

### The document that quotes the row

`.planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md`, **"The tag chips"**. Nothing in the repository
goes red when it drifts, which is exactly why it is checked first.

**Old lines, verbatim:**

> catalog grows. **Re-recorded at nineteen entries by 09-03** (it was nine chips at sixteen entries
> when Phase 5.1 wrote this section; every entry wave of Phase 9 re-takes it, and 09-10 confirms the
> final row at thirty-six entries). Today that is fourteen:
>
> > `playable` (6) · `drums` (4) · `expressive` (4) · `generative` (3) · `gestural` (3) · `hypnotic` (3)
> > · `ambient` (2) · `blooming` (2) · `colour` (2) · `grid` (2) · `hands-free` (2) · `readable` (2)
> > · `sequencer` (2) · `xy-control` (2)

**New lines, verbatim:**

> catalog grows. **Re-recorded at twenty-two entries by 09-04** (it was nine chips at sixteen entries
> when Phase 5.1 wrote this section, and fourteen at nineteen after 09-03; every entry wave of Phase 9
> re-takes it, and 09-10 confirms the final row at thirty-six entries). Today that is sixteen:
>
> > `playable` (8) · `drums` (4) · `expressive` (4) · `gestural` (4) · `generative` (3) · `hypnotic` (3)
> > · `readable` (3) · `xy-control` (3) · `ambient` (2) · `blooming` (2) · `colour` (2) · `grid` (2)
> > · `hands-free` (2) · `harmonic` (2) · `rippling` (2) · `sequencer` (2)

The paragraph beneath it moved from *"remaining 28"* and *"forty-two 44px chips above nineteen live
pads"* to **31** and **forty-seven above twenty-two**. The ASCII mock at the top of the same document
was re-taken too: its tag block became four lines in the new order, and its count line went from
`19 of 19 configurations.` to `22 of 22 configurations.`

---

## The three audition rows, verbatim, and the new `ROW_COUNT`

`ROW_COUNT` in `src/lib/catalog/audition.spec.ts` is **18**, and the test title reads *"keeps eighteen
numbered rows"*. `docs/HARDWARE-AUDITION.md` has eighteen numbered rows, contiguous from 1.

| # | Config | What to check | Why it cannot be simulated |
| --- | --- | --- | --- |
| 16 | **KEYS** | Stand back a metre. Are the three brightness levels — root, in-scale, out of key — still three, and do the unlit cells read as a deliberate absence rather than as dead LEDs? | Physical brightness after the divide-by-512 with no gamma correction anywhere in the WS2812 path, and whether an unlit cell reads as a design or as a fault is a perception, not a byte. |
| 17 | **GRIDLOCK** | Fire cells fast in several different places, overlapping. Do the rings read as separate events, or does one cancel another? Then let the pad settle and confirm the nine track blocks are exactly as they were. | Layer arithmetic is additive and the simulator sums it exactly; whether two overlapping rings on a physical diffuser read as two events is a judgement. The settle is arithmetically exact here and still worth one look on real LEDs. |
| 18 | **TABLE** | Sweep X slowly across all four shapes and then as fast as you can. Does the plot change where your finger expects it to, and does the redraw ever stutter or drop a touch under the fast sweep? | The redraw is gated to keep `touch_cb` under a millisecond; whether that budget holds on the module under a real fast sweep, with real T100 sample timing, is exactly what no simulator clock can tell you. |

### The cost table, now thirteen

`## The ten, and what they cost` became `## The thirteen, and what they cost`, with every new number
taken from this wave's own measurement:

| id | name | Setup | Timer | knobs | dark at rest |
| --- | --- | --- | --- | --- | --- |
| `keys` | KEYS | 644 | 0 — **no Timer** | 5 | no |
| `gridlock` | GRIDLOCK | 425 | 0 — **no Timer** | 5 | no |
| `table` | TABLE | 529 | 0 — **no Timer** | 4 | no |

and the sentence beneath it is now five names rather than two: **MORPH, SLAM, KEYS, GRIDLOCK and
TABLE are Setup-only, and that is legitimate rather than an omission** — MORPH and SLAM animate only
under a finger with a per-touch decay firmware runs down to black on its own; KEYS paints a scale map
once and never moves it; GRIDLOCK's ripple carries its own countdown down to exact black; and TABLE
redraws only when a finger crosses a shape boundary. None of the five has anything for a Timer to
advance, and row 1's install-order rule does not apply to them.

### `AUDITION_DUMP=1`, all thirteen

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
```

Every printed count matches the recorded numbers above. `.tmp-audition/` holds thirteen `.setup.lua`
files and eight `.timer.lua` files.

---

## `SMOKE_REPORT=1`, the three new entries

```
keys: 4 MIDI, 0 HID, first three MIDI (0,144,72,100,0) (0,128,72,0,0) (0,144,57,100,0)
gridlock: 4 MIDI, 0 HID, first three MIDI (0,144,49,28,0) (0,128,49,0,0) (0,144,49,70,0)
table: 16 MIDI, 0 HID, first three MIDI (0,176,74,24,0) (0,176,75,24,0) (0,176,74,37,0)
```

Three readings worth stating. **KEYS is quiet on purpose.** Four messages from a seven-step drag plus
a tap, because only the onset sounds and only an in-scale cell sounds at all: the drag's press landed
on cell (1,1), note 72, a root, and the fast tap on (1,4), note 57, with its own immediate note-off.
Four of the drag's seven diagonal points are out of key and sent nothing. **GRIDLOCK is a trigger.**
Two notes with their note-offs on the same tick, `49` twice because the drag's press and the tap are
in the same column at velocities 28 and 70 — different rows, same track. **TABLE is continuous.**
Sixteen control messages, X on CC 74 and Y on CC 75, one pair a sample, with the plot redrawing four
times behind them. Every entry still reads **0 HID**, so 09-06's deferred assertion is still correctly
deferred.

---

## Three wall times, before and after

Taken on the same machine in the same session. The "before" column was measured by writing the
pre-wave `index.ts`, `listing.ts` and `front-door.ts` from `a7b88c3` over the working copy with
`git show`, measuring, and writing them back from `HEAD` — no `git checkout` of an unperturbed path,
and `git diff --quiet` exited 0 afterwards.

| Measurement | Before (19 entries, 10 Lua) | After (22 entries, 13 Lua) |
| --- | --- | --- |
| `lua-entries.sweep.spec.ts` alone | **2.32 s** tests / 4.804 s wall | **2.50 s** tests / 4.947 s wall |
| `npm run build` | **11.060 s** | **10.679 s** |
| `static/og/` | **112,131 bytes**, 19 PNGs | **131,485 bytes**, 22 PNGs |

The sweep grew from 354 combinations to **416** — 708 measured events to 832 — for 0.18 s of test
time. The build did not get slower; the difference is inside this machine's run-to-run noise, and the
honest reading is that three more prerendered pages and three more OG images cost nothing measurable
at this size. The 19-entry "before" reproduces 09-03's closing numbers exactly (112,131 bytes, 19
PNGs), which is the cross-check that the plant was the tree 09-03 left.

---

## The two negative checks

Each was planted, observed with the stated command, restored with `git checkout --`, and
`git diff --quiet` on the perturbed path exited **0** afterwards. Everything this wave created was
committed **before** anything was perturbed, so no restore passed vacuously.

| # | Task | Perturbation | Observed |
| --- | --- | --- | --- |
| 1 | 9-04-03 | GRIDLOCK's row 17 deleted from `docs/HARDWARE-AUDITION.md` | **Red on two tests**, naming both the count and the name: `checklist rows: expected 17 to be 18` and `GRIDLOCK (gridlock) ships in the catalog but no checklist row auditions it: expected [ 'EUCLID', 'SONAR', 'ARC', …(10) ] to include 'GRIDLOCK'`. `Tests 2 failed \| 2 passed (4)` |
| 2 | 9-04-03 | one hex digit of TABLE's tick-0 hash in `frames.json`, `5` → `a` | **Red on test 3**, naming the entry and the tick: `table at tick 0: frame hash changed: expected '5281f9ee…' to be 'a281f9ee…'`. `Tests 1 failed \| 4 passed (5)` |

Both restored files reported their full counts again immediately afterwards — `audition.spec.ts`
**4 passed**, `frames.spec.ts` **5 passed** — and `git diff --quiet` over the whole tree exits 0 as
this plan leaves it.

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
| `lua-entries.sweep.spec.ts` | **6 passed**, twenty-two entries, 416 combinations |
| `lua-smoke.spec.ts` | **3 passed** |
| `filter.spec.ts` / `sort.spec.ts` | **6 passed each** |
| `vendored-diff.spec.ts` | **14 passed** |
| `npm run test:quick \| check-counts 74 780` | **74 files / 780 passed + 1 todo** — `PREV + 0 / PREV + 0` |
| `npm run test:sweep \| check-counts 4 19` | **`4 19`** |
| `npm run build` | exit 0, 22 PNGs in `static/og/` and 22 in `build/og/` |
| `npm run test:quick` again, after the build | **74 / 780 + 1 todo** |
| `npm run check 2>&1 \| grep -Ei "error\|warning"` | `553 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run lint` | exit 0 |
| `git diff --stat HEAD -- src/vendor/` | prints nothing |
| `git diff a7b88c3 -- src/lib/catalog/front-door.ts` | additions to `EXCLUDED_FROM_ROW` only; `FRONT_DOOR` byte-untouched and still **eight**, `EXCLUDED_FROM_ROW` now fourteen |
| `frames.json` shape | `Object.keys(j.entries).length` **22**, `j.ticks.join()` **`0,37,101,500,1009`** |
| Two consecutive `UPDATE_FRAMES=1` runs | byte-identical |
| Two negative checks | observed with the stated outcomes and reverted byte-identical |
| `grep -q "glim" .../gridlock.ts` | exits **0** |
| `grep -c "@SENSE\|"sense"" .../table.ts` | prints **0** |

The three declarations are in place for all three entries: `grep -c '"keys"' listing.ts`,
`grep -c 'id: "keys"' front-door.ts` and the same for `gridlock` and `table` each print **1**, all
three are in `CATALOG` and all three are re-exported by name.

No device was connected to, looked for or written to. Nothing under `src/vendor/` was read for editing
or edited. No sibling repository was touched. `wrangler` was not run. `test-results/` was not created.
The scratch harness used to render, measure and probe the three configurations lives in the gitignored
`.tmp-audition/` and was never added to the repository.

---

## Commits

| Commit | What |
| --- | --- |
| `749499c` | `feat(09-04): KEYS - the wrong notes are not dark, they are not there` |
| `2a5c53b` | `feat(09-04): GRIDLOCK and TABLE - a ring that is a receipt, and a plot you steer` |
| `e6ffbe8` | `chore(09-04): the fixture at twenty-two, the sixteen-chip row, and three bench rows` |
| `a22653f` | `docs(09-04): KEYS header - the lit-cell counts and the mask delta re-measured` |

## Self-Check: PASSED

All three entry files, `frames.json`, `docs/HARDWARE-AUDITION.md` and this SUMMARY are on disk; all
four commit hashes resolve in `git log`. `grep -c` over `listing.ts` and `front-door.ts` prints **1**
for each of `keys`, `gridlock` and `table` in both files, and `front-door.ts` holds **22** ids —
fourteen excluded plus the eight of the untouched ring. Every character count, wall time, MIDI
reading, frame record, chip count and negative-check message quoted above was read from a runner's or
a script's own output in this session, and every canonical Lua string was dumped from `renderLua`
through `AUDITION_DUMP=1` after the final format pass.
