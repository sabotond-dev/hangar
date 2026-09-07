---
phase: 09-twenty-configurations
plan: 03
subsystem: catalog
tags:
  [
    CONT-02,
    CONT-03,
    TUNE-01,
    lua-entries,
    latching,
    sequencer,
    velocity-from-position,
    D-11,
    decay-arithmetic,
  ]

# Dependency graph
requires:
  - ".planning/phases/09-twenty-configurations/09-02-SUMMARY.md - the rolling pair PREV_FILES 74 / PREV_TESTS 780 (+1 todo), BASE_SWEEP `4 19`, PREV_E2E 89, svelte-check 547, and PHASE_ADDED_AT = 2026-09-07 copied verbatim into three entry files and three LISTING rows"
  - ".planning/phases/09-twenty-configurations/09-01-SUMMARY.md - HOST_GLOBALS (15) and HOST_SELF_METHODS (9); every call site of all three new entries was resolved against them before the entries were committed, and the classifier was never edited"
  - "09-CONTEXT.md D-01..D-12 and the amendment block - every entry is kind: \"lua\", planLayers never runs for a hand-authored entry, so what binds is the 49.6 per cent single-layer cap and the two free layers"
  - ".planning/research/USE-CASES.md Part Three - the build-these-first table, which opens with latching, then the step sequencer, then drum velocity from position"
  - ".planning/research/ZONA-CAPABILITIES.md sections 2.3, 2.4 and 5.2 - glc's forced minimum black, the uint8 rate that wraps, the freeze-at-final-phase rule, and gtt as a one-shot"
provides:
  - "The rolling pair for 09-04: PREV_FILES 74, PREV_TESTS 780 (+ 1 todo) - unchanged, as an entry wave must be"
  - "Three configurations: HOLD (latching XY, featured), STEPS (8x8 step sequencer), SLAM (nine drum zones, velocity from height). Nineteen catalog entries, ten of them hand-authored Lua"
  - "The sweep is 354 combinations over ten entries (283 + 22 + 27 + 22); the test count is still 6"
  - "The standing chip row at nineteen entries: fourteen chips, re-recorded in both browse specs and in 05.1-UI-SPEC.md"
  - "KNOWN_TAGS at 42 - \"latching\" coined, a singleton until CONSOLE takes it in wave 5"
  - "docs/HARDWARE-AUDITION.md at fifteen rows, ROW_COUNT 15, and a cost table of ten"
  - "THE DECAY ARITHMETIC, for waves 4 to 9: a decaying trail's rate must be derived from its length. rate = 256 - 252//ticks with a starting phase of 252 and ticks a divisor of 252 lands the fade on exactly 0 at every knob setting. A fixed rate of 250 lands on black at 42 ticks and NOWHERE ELSE"
affects:
  - "09-04 to 09-09 - the entry template, the nine-part header plus the route note, the four-channel knob rule, and the decay arithmetic above"
  - "09-10's phase gate - the cost table in docs/HARDWARE-AUDITION.md becomes twenty-seven and the checklist grows again; ROW_COUNT is 15 as this plan leaves it"
  - "05.1-UI-SPEC.md, The tag chips - re-recorded at nineteen by this plan, and re-taken by every later entry wave"

tech-stack:
  added: []
  patterns:
    - "A DECAYING TRAIL'S RATE IS DERIVED FROM ITS LENGTH, never fixed. glpfs(a,L,252,256-252//@TICKS,0) with @TICKS a divisor of 252 makes the phase product exactly 252 at every setting, so the fade ends on exactly 0. The shipped fixed rate of 250 is a phase step of 6 and lands on black only at 42 ticks; at any other length the timeout expires part-way down, firmware sets the rate to 0, and the cell freezes half lit forever"
    - "A STATIC PICTURE AND A DECAY MAY NOT SHARE A LAYER. A decay ends at exact black, so any static cell it covers is erased permanently unless something repaints it. SLAM's bloom therefore owns layer 1 alone even though one layer caps at 49.6 per cent, and HOLD's clear-the-old-cell pass restores the frame colour on layer 2 rather than writing black over it"
    - "A PERIOD THAT RE-ISSUES AN ANIMATION IS CHOSEN TO BE PHASE-ALIGNED. Total phase advance over T ticks is rate*T mod 256, so a re-issue every 256 ticks writes back the phase the cell already had, for every rate. HOLD's Timer period is 2560 ms for that reason and no other"
    - "A CORRECTION TO A PLAN'S MECHANISM IS MEASURED, THEN WRITTEN INTO THE HEADER WITH ITS MEASUREMENT. Every one of this wave's four deviations names the phase, the tick or the byte that forced it, so the next reader does not re-argue it from taste"
    - "A CENSUS IN PROSE IS POINTED AT THE RECORDED BLOCK RATHER THAN RESTATED. filter.ts's own comment stopped counting; 09-02's deviation 3 set the precedent and this wave applied it to the module rather than only to the spec"

key-files:
  created:
    - "src/lib/catalog/entries/hold.ts"
    - "src/lib/catalog/entries/steps.ts"
    - "src/lib/catalog/entries/slam.ts"
    - ".planning/phases/09-twenty-configurations/09-03-SUMMARY.md"
  modified:
    - "src/lib/catalog/index.ts"
    - "src/lib/catalog/listing.ts"
    - "src/lib/catalog/front-door.ts"
    - "src/lib/catalog/frames.json"
    - "src/lib/catalog/copy.spec.ts"
    - "src/lib/catalog/audition.spec.ts"
    - "src/lib/browse/filter.spec.ts"
    - "src/lib/browse/filter.ts"
    - "src/lib/browse/sort.spec.ts"
    - "docs/HARDWARE-AUDITION.md"
    - ".planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md"

decisions:
  - "The decay rate is derived from the trail length in STEPS and SLAM, and the trail values are divisors of 252 (12, 28, 42, 63) rather than the plan's 12, 24, 42, 64. Measured: at a fixed rate of 250 the phase freezes at 183, 111 and 127 for 12, 24 and 64 ticks. On SLAM, which has no Timer, that is a permanently half-lit cell per hit"
  - "SLAM's bloom is one layer, not two. The zone outline is on layer 2, the bloom's bottom row always covers two outline corners, and a decay ends at exact black - so painting the bloom on layer 2 as the plan specifies would erase two of every hit zone's four outline cells forever"
  - "HOLD's clear pass restores the frame rather than writing black. The frame and the latch share layer 2, so latching onto a border cell and moving away would otherwise punch a permanent hole in the frame"
  - "HOLD's Timer period is 2560 ms, chosen because 256 ticks is a whole number of phase cycles at every rate the knob offers, so the plan's re-issue of glpfs at phase 0 is invisible instead of a visible snap once a period. It also keeps the argument inside a uint16 millisecond field"
  - "latching was added to KNOWN_TAGS in the TASK 1 commit rather than in task 3, because copy.spec.ts test 3 gates the vocabulary in both directions and task 1's own acceptance criterion asks for 5 passed"
  - "SLAM's declared motion is static, not animated. The plan predicted this and wrote its quiet line with the entry; the fixture confirmed it at all five ticks"
  - "05.1-UI-SPEC.md's vocabulary table was left at sixteen entries with a sentence saying so, rather than re-taken. Only the quoted chip row and the mock are load-bearing, and the live census now has one address: filter.spec.ts's RECORDED"

requirements-completed: []
requirements-contributed: [CONT-02, CONT-03, TUNE-01]

# Metrics
duration: 78min
completed: 2026-09-07
---

# Phase 9 Plan 03: HOLD, STEPS and SLAM — Summary

The catalog latches, sequences and reads velocity off the height of a hit; the one gesture that can
look perfect in a browser and stick on a module says so in its header, in its card copy and in its own
bench row; and a fade that the shipped idiom leaves frozen half lit now lands on exactly zero at every
knob setting, proved in the rendered frame rather than in the layer record.

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
- svelte-check: `547 + 3 = 550` files, `0 errors, 0 warnings`. The three new files are the three
  entries. Provenance only — the count line is never asserted.
- e2e: **not run.**

`PHASE_ADDED_AT` is **`2026-09-07`**, copied verbatim into `hold.ts`, `steps.ts`, `slam.ts` and their
three `LISTING` rows. Nobody used a run date.

---

## HOLD

**The card.** A latching effect pad. Slide anywhere to set an X and a Y; lift, and the value stays
where you left it, with the cell you lifted from lit and breathing.

**Route note.** `kind: "lua"`, because `sends.toggle` is read only when `sends.kind` is `"zones"` and
`spring` only when it is `"xy"` — **a latching XY is in neither branch of the `PadState` sends sheet,
so it is not expressible as a state at all.**

### Canonical Setup at the defaults, verbatim (696)

```
--[[@cb]]for n=0,80 do if n<9 or n>71 or n%9==0 or n%9==8 then local a=glag(0,n)glc(a,2,0,25,50,1)glp(a,2,255)end end self.h=40 local a=glag(0,40)glc(a,1,255,90,0,1)glc(a,2,255,90,0,1)glpfs(a,1,0,2,3)glpfs(a,2,0,2,3)glt(a,1,60000)glt(a,2,60000)self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then return end local n=x*9//128+y*9//128*9 local h=s.h if n~=h then local b=glag(0,h)glt(b,1,0)glt(b,2,0)glc(b,1,0,0,0,1)glp(b,1,0)glc(b,2,0,25,50,1)glp(b,2,(h<9 or h>71 or h%9==0 or h%9==8)and 255 or 0)s.h=n b=glag(0,n)glc(b,1,255,90,0,1)glc(b,2,255,90,0,1)glpfs(b,1,0,2,3)glpfs(b,2,0,2,3)glt(b,1,60000)glt(b,2,60000)end s:gms(0,176,1,x*127//128,0)s:gms(0,176,1+1,y*127//128,0)end gtt(0,2560)
```

### Canonical Timer at the defaults, verbatim (102)

```
--[[@cb]]gtt(0,2560)local a=glag(0,self.h)glpfs(a,1,0,2,3)glpfs(a,2,0,2,3)glt(a,1,60000)glt(a,2,60000)
```

### The substitution table

| Token | Knob id | Needle in the canonical text | Sites | Default |
| --- | --- | --- | --- | --- |
| `@COL` | `colour` | `255,90,0` in the four `glc(_,1,…)` / `glc(_,2,…)` latch paints | 4 Setup, 0 Timer | index 0 |
| `@RATE` | `rate` | the `2` in every `glpfs(_,_,0,2,3)` | 4 Setup, 2 Timer | index 1 |
| `@RINGC` | `ring` | `0,25,50` in the frame paint and in the frame restore | 2 Setup, 0 Timer | index 0 |
| `@CC` | `cc` | the `1` in `s:gms(0,176,1,…)` and the leading `1` of `1+1` | 2 Setup, 0 Timer | index 0 |
| `@CH` | `channel` | the leading `0` of both `s:gms(0,176,…)` | 2 Setup, 0 Timer | index 0 |

`2560` and `60000` are **literals, not knobs**, and the header says why for each.

### Six numbers, and the corner

| | Setup | Timer |
| --- | --- | --- |
| defaults | **696** | **102** |
| all-longest corner | **706** | **102** |
| all-shortest corner | **696** | **102** |

**Free at the worst corner: 202 of 908 on the Setup, 806 on the Timer.** The all-shortest corner
equals the defaults because every default already selects its knob's shortest value.
**Combinations: 22** (`4+4+4+4+4 + 2`).

### Traps, and the one that is a hardware risk

F2Ieq on `x*9//128`, `y*9//128`, `x*127//128` and `y*127//128`. Every channel of every `@COL` and
`@RINGC` value inside 0..255. `e == 5` nowhere; the guard is `e~=1 and e~=4 and e<9 then return`.
No negative phase. The keeper is **60000 on a layer whose rate is single-digit** and the header marks
it **do-not-fix**: `grep -c "65535"` over the Lua strings prints **0**.

**And the one the simulator cannot show.** Firmware advances `prev_*` before the writability check, so
a dropped release leaves a permanently stuck contact, and `pad-sim.ts` states plainly that it cannot
manufacture one. **A latching configuration can look perfect in a browser and stick on hardware.**
That sentence is in the entry header, the card copy carries the single-contact half, and row 13 of
`docs/HARDWARE-AUDITION.md` carries it in the document's own voice.

### The latch, observed rather than asserted

Latched cell 30, lifted, then 300 ticks: `layer 1 timeout=59951 fre=2 pha=98 sha=3` and the same on
layer 2 — still lit, still breathing, the countdown still three orders of magnitude below the keeper
floor. The default centre cell 40 was cleared to black on layer 1 and to `@RINGC` at phase 0 on
layer 2, which is what an interior cell should look like after the latch leaves it. The Timer fired at
ticks 256 and 512 with `errors: []`.

---

## STEPS

**The card.** An eight by eight step grid. Tap a cell to arm it; a bright column sweeps left to right
and plays what you armed on the way past.

**Route note.** `kind: "lua"`, because **there is no sequencer anywhere in the `PadState` vocabulary** —
`sends.kind` is `none | xy | zones | faders | trackpad | dial` and not one of them has a clock.

### Canonical Setup at the defaults, verbatim (388)

```
--[[@cb]]self.p={}self.k=0 for n=0,63 do self.p[n]=n>55 and n%2==0 local a=glag(0,n%8+n//8*9)glc(a,1,0,200,255,1)glp(a,1,0)glc(a,2,0,40,60,1)glp(a,2,self.p[n]and 255 or 0)end self.touch_cb=function(s,i,e,x,y)if e~=4 and e<9 then return end local c=x*9//128 local r=y*9//128 if c>7 or r>7 then return end local n=c+r*8 s.p[n]=not s.p[n]glp(glag(0,c+r*9),2,s.p[n]and 255 or 0)end gtt(0,120)
```

### Canonical Timer at the defaults, verbatim (251)

```
--[[@cb]]gtt(0,120)local s=self local k=s.k%8 s.k=k+1 local q=(k+7)%8 for r=0,7 do if s.p[q+r*8]then s:gms(9,128,36+r,0,0)end end for r=0,7 do local a=glag(0,k+r*9)glpfs(a,1,252,256-252//42,0)glt(a,1,42)if s.p[k+r*8]then s:gms(9,144,36+r,100,0)end end
```

### The substitution table

| Token | Knob id | Needle in the canonical text | Sites | Default |
| --- | --- | --- | --- | --- |
| `@TEMPO` | `tempo` | the `120` in both `gtt(0,120)` | 1 Setup, 1 Timer | index 2 |
| `@ARMC` | `armed` | `0,40,60` in `glc(a,2,…)` | 1 Setup, 0 Timer | index 0 |
| `@SWEEPC` | `sweep` | `0,200,255` in `glc(a,1,…)` | 1 Setup, 0 Timer | index 0 |
| `@TRAIL` | `trail` | both `42`s — `256-252//42` and `glt(a,1,42)` | 0 Setup, 2 Timer | index 2 |
| `@NOTE` | `note` | the `36` in both `s:gms(9,…,36+r,…)` | 0 Setup, 2 Timer | index 0 |
| `@CH` | `channel` | the leading `9` of both `s:gms(9,…)` | 0 Setup, 2 Timer | index 2 |

### Six numbers, and the corner

| | Setup | Timer |
| --- | --- | --- |
| defaults | **388** | **251** |
| all-longest corner | **391** | **253** |
| all-shortest corner | **386** | **250** |

**Free at the worst corner: 517 of 908 on the Setup, 655 on the Timer.** **Combinations: 27**
(`5+4+4+4+4+4 + 2`).

### Two spaces measured out, and the honest limit

The readable form writes `self.p[n] and 255 or 0`; the pinned minifier emits `self.p[n]and 255 or 0`
with no space, at both sites, and 390 collapsed to 388. Storing the readable form would have failed
the canonical-form gate on its first run for a reason that has nothing to do with the configuration —
the same finding SONAR's header records for `if s.v[n]then`.

**The honest limit, for the card copy:** eight rows is eight voices, and there is no inbound MIDI in
this phase (D-04), so the column tells you where the sequencer is, not where your DAW is.

---

## SLAM

**The card.** Nine drum zones. How high in the pad you hit is how hard it plays, and the height of the
bloom is the velocity you sent.

**Route note.** `kind: "lua"`, because `sends.velocity` is a **literal 1..127** in `PadState` and
`_pad.ts:296` records that *"From position" has no measured recipe* — velocity from position is not in
the vocabulary at all, and it is the whole card.

### Canonical Setup at the defaults, verbatim (659)

```
--[[@cb]]self.z={}for n=0,80 do local a=glag(0,n)glc(a,1,255,90,0,1)glp(a,1,0)end for z=0,8 do local bx=z%3*3 local by=z//3*3 for d=0,3 do local a=glag(0,bx+d%2*2+(by+d//2*2)*9)glc(a,2,0,25,50,1)glp(a,2,255)end end self.touch_cb=function(s,i,e,x,y)if e>=5 and e<9 then local m=s.z[i]if m then s:gms(9,128,36+m,0,0)s.z[i]=nil end return end if e~=4 and e<9 then return end local z=x*3//128+y*3//128*3 local v=(127-y)*126//127+1 local bx=z%3*3 local by=z//3*3 for r=0,glim(v*3//127+1,1,3)-1 do for c=0,2 do local a=glag(0,bx+c+(by+2-r)*9)glpfs(a,1,252,256-252//28,0)glt(a,1,28)end end s:gms(9,144,36+z,v,0)if e==9 then s:gms(9,128,36+z,0,0)else s.z[i]=z end end
```

### Canonical Timer at the defaults, verbatim (0)

```

```

The empty string, written inline, the same shape MORPH uses. `compressScript("")` is `""` — already a
fixed point — and `checkSyntax("")` is `true`. `grep -q 'timer: ""'` exits **0**.

### The substitution table

| Token | Knob id | Needle in the canonical text | Sites | Default |
| --- | --- | --- | --- | --- |
| `@COL` | `colour` | `255,90,0` in `glc(a,1,…)` | 1 Setup | index 0 |
| `@ZONEC` | `zone` | `0,25,50` in `glc(a,2,…)` | 1 Setup | index 0 |
| `@DECAY` | `decay` | both `28`s — `256-252//28` and `glt(a,1,28)` | 2 Setup | index 1 |
| `@NOTE` | `note` | the `36` in all three `s:gms(9,…,36+…)` | 3 Setup | index 0 |
| `@CH` | `channel` | the leading `9` of all three `s:gms(9,…)` | 3 Setup | index 2 |

### Six numbers, and the corner

| | Setup | Timer |
| --- | --- | --- |
| defaults | **659** | **0** |
| all-longest corner | **666** | **0** |
| all-shortest corner | **659** | **0** |

**Free at the worst corner: 242 of 908.** **Combinations: 22** (`4+4+4+4+4 + 2`).

### Code 9, and the per-contact state

`e == 9` is answered with its own note-off immediately after the note-on; `e >= 5 and e < 9` releases
the zone stored at `self.z[i]` and clears it; `e == 5` alone appears nowhere. The state is keyed by
**contact id**, so two fingers cannot cancel each other's release. The smoke gesture's fast tap on
contact 1 produced `(9,144,39,70,0)` followed by its matching note-off, with zero samples left in the
queue.

**The honest limit, for the card copy:** two fingers in one zone restart the same bloom rather than
keeping the first, and **height is not force** — the card measures where you hit, not how hard.

---

## The four deviations

### Auto-fixed issues

**1. [Rule 1 — bug] A fixed decay rate of 250 lands on black at 42 ticks and nowhere else**

- **Found during:** Task 9-03-02, checking that SLAM's bloom really returns the pad to its resting
  picture.
- **Issue:** The shipped idiom `glpfs(a,L,255,250,0)` plus `glt(a,L,<ticks>)` is a phase step of 6 a
  tick (250 is −6 as a uint8), so the total advance is `6 * ticks`. That reaches 252 — i.e. lands on
  phase 3 — **only at 42 ticks**. At any other trail length the timeout expires part-way down,
  firmware sets the rate to 0 and the animation freezes at whatever phase it reached. Measured on
  SLAM at the four values the plan specifies: **phase 183 at 12 ticks, 111 at 24, 3 at 42 and 127 at
  64** — a cell frozen at roughly two fifths of full colour. On STEPS the swept column would refresh
  it forever, so the whole 8x8 grid would glow; on SLAM, which has **no Timer to repaint anything**,
  every hit cell would stay half lit permanently.
- **Fix:** the rate is derived from the length — `glpfs(a,1,252,256-252//@TICKS,0)` — the starting
  phase is 252 rather than 255, and the four values are **divisors of 252**: 12, 28, 42, 63 (steps 21,
  9, 6, 4). The product is then exactly 252 at every setting and the phase lands on **exactly 0**.
  Re-measured: phase 3 at all four before the phase-252 change, and after it a rest-versus-post-bloom
  frame diff over 400 ticks printed **nothing** — the rendered frame is byte-identical to the resting
  frame. All four values are two characters long, so no corner moved.
- **Files modified:** `src/lib/catalog/entries/steps.ts`, `src/lib/catalog/entries/slam.ts`.
- **Commit:** `f5027fa`.

**2. [Rule 1 — bug] SLAM's bloom cannot be painted on both layers**

- **Found during:** Task 9-03-02.
- **Issue:** The plan specifies the bloom on **both** layers in `@COL`, for the brightness reason the
  49.6 per cent cap gives. But the zone outline lives on layer 2, the bloom fills the zone **from the
  bottom up** so its bottom row always covers two of the four outline corners, and a decay ends at
  exact black. The first hit in a zone would therefore erase two of its outline cells permanently, and
  SLAM has no Timer to put them back.
- **Fix:** the bloom owns **layer 1 alone**, at the loud end of the colour range, and the header states
  the trade in those terms. This is also what every shipped decaying trail already does — EUCLID's
  head, SONAR's sweep and MORPH's touch decay are all single-layer.
- **Files modified:** `src/lib/catalog/entries/slam.ts`.
- **Commit:** `f5027fa`.

**3. [Rule 1 — bug] HOLD's clear pass would punch a hole in its own frame**

- **Found during:** Task 9-03-01.
- **Issue:** The plan says to darken the old held cell with `glc(a,1,0,0,0,1)` and `glc(a,2,0,0,0,1)`.
  The frame — the 32 border cells — is on layer 2. Latch onto a border cell, then move away, and that
  cell is black on layer 2 forever: a permanent gap in the frame, in the one picture the card has at
  rest.
- **Fix:** the clear pass writes `glt(b,1,0)glt(b,2,0)` first (so a restored frame cell sits still
  instead of inheriting the breathe), blacks layer 1, and writes `@RINGC` to layer 2 at phase
  `(h<9 or h>71 or h%9==0 or h%9==8)and 255 or 0` — the frame colour at full phase on a border index
  and at zero phase anywhere else. One branchless expression, one extra `@RINGC` site, and the header
  names it as a trap.
- **Files modified:** `src/lib/catalog/entries/hold.ts`.
- **Commit:** `1fc2d27`.

**4. [Rule 1 — bug] SLAM's row count is 4 at full velocity, in a three-row zone**

- **Found during:** Task 9-03-02, reading the plan's arithmetic before writing it.
- **Issue:** `n = v*3//127 + 1` is `4` at `v = 127` (`381//127 = 3`). A zone has three rows, so the
  fourth would light a cell belonging to the zone above it.
- **Fix:** `glim(v*3//127+1,1,3)`, the firmware clamp, which is a registered global and costs nine
  characters. The plan's expression is kept intact inside it.
- **Files modified:** `src/lib/catalog/entries/slam.ts`.
- **Commit:** `f5027fa`.

### Scope notes, recorded because a later reader will wonder

- **`latching` went into `KNOWN_TAGS` in the task 1 commit, not the task 3 commit.** The plan puts it
  in task 3, but `copy.spec.ts` test 3 gates the vocabulary in both directions and task 1's own
  acceptance criterion asks for **5 passed** — so the tag had to arrive with the entry that carries it.
- **`src/lib/browse/filter.ts` was edited, and the plan does not list it.** Its doc comment said
  *"Today it is nine of the forty-one; the other 32 sit on exactly one entry each"* — a census in
  prose, in the module, which this wave made false. It now points at `filter.spec.ts`'s `RECORDED`
  instead of restating anything, so no later wave has to touch it. 09-02's deviation 3 is the
  precedent; this applies it to the module rather than only to the spec.
- **`docs/HARDWARE-AUDITION.md`'s prose counts moved too**, not only its rows: *"Twelve rows"* twice,
  *"twelve lines"*, *"seven Setup files and six Timer files"* (now ten and eight), the opening
  paragraph, and item 4's MORPH exemption, which is now MORPH **and** SLAM. Item 4 had to keep the
  substring `MORPH … Setup only` inside one sentence, because `audition.spec.ts` matches
  `/MORPH[^.]{0,200}Setup only/` — the first rewrite put a full stop in the middle of it and the test
  went red, correctly.
- **HOLD's Timer never fires inside `lua-smoke.spec.ts`.** The scripted run is 218 ticks and the period
  is 256. It does fire inside `frames.spec.ts`, at ticks 256, 512 and 768 of the 1009-tick sample, and
  it was separately run out to tick 704 with `errors: []`. Worth knowing before a later wave edits it.
- **`05.1-UI-SPEC.md`'s full vocabulary table was left at sixteen entries**, with a sentence saying so
  and pointing at `RECORDED`. Only the quoted chip row and the ASCII mock are load-bearing, and the
  plan scopes the edit to those two.

---

## The fixture, and one corrected declaration

`UPDATE_FRAMES=1` was run once for all three entries, then **again**, and the second file is
**byte-identical** (`diff -q` silent). The fixture covers **19** entries at `0,37,101,500,1009`.

| Entry | `restsBlack` declared | fixture | `motion` declared in tasks 1-2 | fixture says | outcome |
| --- | --- | --- | --- | --- | --- |
| `hold` | false | 66 lit bytes at all five ticks | animated | `animating: true` at all five | **agrees** |
| `steps` | false | 8, 52, 54, 52, 68 lit bytes | animated | `animating: true` at all five | **agrees** |
| `slam` | false | 72 lit bytes at all five ticks | animated | `animating: false` at **all five** | **corrected to `static`** |

**SLAM was the one correction, and the plan predicted it.** Its whole picture at rest is a static zone
outline with `timeout: 0` — the blooms only exist under a finger — so no sampled tick ever reports a
running layer. `listing.spec.ts:211-225` therefore requires a non-empty single-line `quiet`, and the
plan had that line written into the `LISTING` row with the entry rather than discovered here:

> The nine zone outlines sit still until you hit one; every bloom is a hit you made.

82 characters, one line, second person, present tense, no exclamation mark, no emoji, no ASCII
apostrophe between letters, no hyphen doing a dash's job, no ellipsis. `copy.spec.ts` test 2 counts it
by the same rules it counts a description by, and it reports **5 passed**.

HOLD and STEPS needed no `quiet` line and none was written. `RESTS_DARK_NOTE` belongs only to a
`restsBlack: true` entry, and none of this wave's three is one.

---

## The chip row, before and after

| | Old (sixteen entries) | New (nineteen entries) |
| --- | --- | --- |
| `entries` | 16 | **19** |
| `tags` | 41 | **42** |
| `singletons` | 32 | **28** |
| chips | 9 | **14** |

```
old  playable (4) · generative (3) · gestural (3) · hypnotic (3) · ambient (2) · colour (2)
     · drums (2) · expressive (2) · readable (2)

new  playable (6) · drums (4) · expressive (4) · generative (3) · gestural (3) · hypnotic (3)
     · ambient (2) · blooming (2) · colour (2) · grid (2) · hands-free (2) · readable (2)
     · sequencer (2) · xy-control (2)
```

Five tags crossed the two-carrier threshold in one wave — `blooming`, `grid`, `hands-free`,
`sequencer` and `xy-control` — which is what the `RECORDED` block exists to make visible.

**New `RECORDED` values.** `filter.spec.ts`: `entries: 19, tags: 42, singletons: 28`, the fourteen
chips above and `chipCounts: [6, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2]`. `sort.spec.ts`:
`{ entries: 19, featured: 9 }` — HOLD is this wave's one featured entry. Both derived with a throwaway
Node script over `LISTING` and confirmed by the rule assertions in the same tests; both files still
report **6 passed**.

**`KNOWN_TAGS`** gains **`latching`** and is **42**, sorted, gated in both directions. Every other tag
this wave used — `hands-free`, `expressive`, `xy-control`, `sequencer`, `playable`, `drums`, `grid`,
`blooming` — was already a member, confirmed against the array rather than by reading.

### The document that quotes the row

`.planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md`, **"The tag chips"**. Nothing in the repository
would have gone red had it been left stale, which is exactly why it was the first thing to check.

**Old line, verbatim:**

> Today that is nine, and it is derived from the data rather than a magic number, so it stays right as
> the catalog grows:
>
> > `playable` (4) · `generative` (3) · `gestural` (3) · `hypnotic` (3) · `ambient` (2) · `colour` (2)
> > · `drums` (2) · `expressive` (2) · `readable` (2)

**New line, verbatim:**

> It is derived from the data rather than a magic number, so it stays right as the catalog grows.
> **Re-recorded at nineteen entries by 09-03** (it was nine chips at sixteen entries when Phase 5.1
> wrote this section; every entry wave of Phase 9 re-takes it, and 09-10 confirms the final row at
> thirty-six entries). Today that is fourteen:
>
> > `playable` (6) · `drums` (4) · `expressive` (4) · `generative` (3) · `gestural` (3) · `hypnotic` (3)
> > · `ambient` (2) · `blooming` (2) · `colour` (2) · `grid` (2) · `hands-free` (2) · `readable` (2)
> > · `sequencer` (2) · `xy-control` (2)

The ASCII mock at the top of the same document was corrected too, because its first four names
changed: `playable  generative  gestural  hypnotic` became `playable  drums  expressive  generative`,
the row grew to three lines, and the count line beneath it went from `16 of 16 configurations.` to
`19 of 19 configurations.` The `MORE TAGS` paragraph's *"remaining 32"* is now 28 and its
*"forty-one 44px chips above sixteen live pads"* is now forty-two above nineteen.

---

## The three audition rows, verbatim, and the new `ROW_COUNT`

`ROW_COUNT` in `src/lib/catalog/audition.spec.ts` is **15**, and the test title reads *"keeps fifteen
numbered rows"*. `docs/HARDWARE-AUDITION.md` has fifteen numbered rows, contiguous from 1.

| # | Config | What to check | Why it cannot be simulated |
| --- | --- | --- | --- |
| 13 | **HOLD** | Latch a value, then lift and put the same finger down and up quickly several times in different places. Does the latched cell always follow, or does one of them stick? Leave it latched for five minutes and confirm the breathing has not frozen. | **The simulator deliberately cannot reproduce this.** Firmware advances `prev_*` before the writability check, so a dropped release leaves a permanently stuck contact — and `pad-sim.ts` states it only runs the watchdog semantics and cannot manufacture the stuck contact. Latching is the one gesture where a green test is not evidence. Also the 655 s `glt` ceiling: only time on hardware shows a frozen breathe. |
| 14 | STEPS | The column sweep reads as a single moving bar rather than a flicker, and a tapped cell arms on the first touch every time. | Perceived motion at 30 fps against a physical diffuser, and real T100 touch codes including the fast-tap DOWNUP 9 that firmware coalesces into one message. |
| 15 | SLAM | Hit the same zone high and low. Does the note get audibly louder, and does the bloom get taller by the same amount? | Whether a height-derived velocity feels like a velocity is a judgement, and the mapping from lit rows to a loudness you hear is not a number any frame hash checks. |

### The cost table, now ten

`## The seven, and what they cost` became `## The ten, and what they cost`, with every new number taken
from this wave's own measurement:

| id | name | Setup | Timer | knobs | dark at rest |
| --- | --- | --- | --- | --- | --- |
| `hold` | HOLD | 696 | 102 | 5 | no |
| `steps` | STEPS | 388 | 251 | 6 | no |
| `slam` | SLAM | 659 | 0 — **no Timer** | 5 | no |

and one sentence beneath it: **MORPH and SLAM are Setup-only, and that is legitimate rather than an
omission** — both animate only under a finger, with a per-touch decay firmware runs down to black on
its own, so there is nothing for a Timer to advance and row 1's install-order rule does not apply to
them.

### `AUDITION_DUMP=1`, all ten

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
```

Every printed count matches the recorded numbers above. `.tmp-audition/` holds ten `.setup.lua` files
and eight `.timer.lua` files, including `hold.setup.lua`, `hold.timer.lua`, `steps.setup.lua`,
`steps.timer.lua` and `slam.setup.lua`.

---

## `SMOKE_REPORT=1`, the three new entries

```
hold: 16 MIDI, 0 HID, first three MIDI (0,176,1,24,0) (0,176,2,24,0) (0,176,1,37,0)
steps: 28 MIDI, 0 HID, first three MIDI (9,144,43,100,0) (9,128,43,0,0) (9,144,37,100,0)
slam: 4 MIDI, 0 HID, first three MIDI (9,144,36,102,0) (9,128,36,0,0) (9,144,39,70,0)
```

Three readings worth stating. HOLD sends **two CCs a sample and nothing on the lift**, which is the
feature: `(0,176,1,24,0)` and `(0,176,2,24,0)` are X on CC 1 and Y on CC 2 from one touch. STEPS is the
only one of the three that plays with nobody touching it — 28 messages from the default pattern alone,
starting with the bottom row's note 43 on channel 10 and its release one step later. SLAM's four are a
note-on at velocity **102** for the drag's onset at `y = 25`, its release, and then the fast tap's
note-on at velocity **70** for `y = 57` with its own immediate note-off: the velocity really does fall
as the hit moves down the pad. Every entry still reads **0 HID**, so 09-06's deferred assertion is
still correctly deferred.

---

## Three wall times, before and after

Taken on the same machine in the same session. The "before" column was measured by checking out the
pre-wave `index.ts`, `listing.ts` and `front-door.ts` at `9c7b4ce`, measuring, and restoring — the
same plant-and-restore discipline the negative checks use, with `git diff --quiet` exiting 0
afterwards.

| Measurement | Before (16 entries, 7 Lua) | After (19 entries, 10 Lua) |
| --- | --- | --- |
| `lua-entries.sweep.spec.ts` alone | **1.97 s** tests / 4.409 s wall | **2.44 s** tests / 5.091 s wall |
| `npm run build` | **10.557 s** | **9.588 s** |
| `static/og/` | **95,092 bytes**, 16 PNGs | **112,131 bytes**, 19 PNGs |

The sweep grew from 283 combinations to **354** — 566 measured events to 708 — for 0.47 s of test time.
The build did not get slower; the 1 s difference is inside this machine's run-to-run noise, and the
honest reading is that three more prerendered pages and three more OG images cost nothing measurable
at this size. `npm run test:sweep` as a whole was **108.49 s** (`4 19`), which is `pad-invariants`
dominating exactly as 09-01 recorded.

---

## The four negative checks

Each was planted, observed with the stated command, restored with `git checkout --`, and
`git diff --quiet` on the perturbed path exited **0** afterwards. Every new file was `git add`ed and
committed **before** anything was perturbed, so no restore passed vacuously.

| # | Task | Perturbation | Observed |
| --- | --- | --- | --- |
| 1 | 9-03-03 | one hex digit of HOLD's tick-0 hash in `frames.json`, `4` → `a` | **Red on test 3**, naming the entry and the tick: `AssertionError: hold at tick 0: frame hash changed: expected '4c846668…' to be 'ac846668…'`. `Tests 1 failed \| 4 passed (5)` |
| 2 | 9-03-03 | HOLD's row deleted from `docs/HARDWARE-AUDITION.md` | **Red on two tests**, naming both the count and the name: `checklist rows: expected 14 to be 15` and `HOLD (hold) ships in the catalog but no checklist row auditions it`. `Tests 2 failed \| 2 passed (4)` |
| 3 | 9-03-02 | `gln(a,1,255,255,255)` inserted into STEPS' Timer, the call every published ZONA recipe uses and the host does not register | **Red on host-surface test 2**, naming the entry, the event, the call and its index: `steps/timer at defaults: "gln" at index 164 is a bare call the HANGAR Lua host does not register, so it raises "attempt to call a nil value" the moment this line is reached`. `Tests 1 failed \| 3 passed (4)` |
| 4 | 9-03-01 | one space added after HOLD's event marker, `--[[@cb]]for` → `--[[@cb]] for` | **Red on sweep tests 1 and 6**: `hold/setup: stored text is not a fixed point of the minifier, so cost() would charge the raw length and the budget meter would be lying` and `hold/setup at colour="255,90,0": not canonical`. `Tests 2 failed \| 4 passed (6)` |

Checks 3 and 4 are the two that matter for an entry wave: 3 proves 09-01's classifier really covers a
configuration authored after it was written, and 4 proves the canonical-form gate catches a single
character. `git diff --quiet` over the whole tree exits 0 as this plan leaves it.

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
| `lua-entries.sweep.spec.ts` | **6 passed**, nineteen entries, 354 combinations |
| `lua-smoke.spec.ts` | **3 passed** |
| `filter.spec.ts` / `sort.spec.ts` | **6 passed each** |
| `vendored-diff.spec.ts` | **14 passed** |
| `npm run test:quick \| check-counts 74 780` | **74 files / 780 passed + 1 todo** — `PREV + 0 / PREV + 0` |
| `npm run test:sweep` | **`4 19`** |
| `npm run build` | exit 0, 19 PNGs in `static/og/` and 19 in `build/og/` |
| `npm run test:quick` again, after the build | **74 / 780 + 1 todo** |
| `npm run check 2>&1 \| grep -Ei "error\|warning"` | `550 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run lint` | exit 0 |
| `git diff --stat HEAD -- src/vendor/` | prints nothing |
| `git diff -- src/lib/catalog/front-door.ts` over the wave | additions to `EXCLUDED_FROM_ROW` only; `FRONT_DOOR` byte-untouched and still eight |
| `frames.json` shape | `Object.keys(j.entries).length` **19**, `j.ticks.join()` **`0,37,101,500,1009`** |
| Two consecutive `UPDATE_FRAMES=1` runs | byte-identical |
| Four negative checks | observed with the stated outcomes and reverted byte-identical |

The three declarations are in place for all three entries: `grep -c '"hold"' listing.ts`,
`grep -c 'id: "hold"' front-door.ts` and the same for `steps` and `slam` each print **1**, all three
are in `CATALOG` and all three are re-exported by name.

No device was connected to, looked for or written to. Nothing under `src/vendor/` was read for editing
or edited. No sibling repository was touched. `wrangler` was not run. `test-results/` was removed by
hand. The scratch harness used to render, measure and probe the three configurations lives in the
gitignored `.tmp-audition/` and was never added to the repository.

---

## Commits

| Commit | What |
| --- | --- |
| `1fc2d27` | `feat(09-03): HOLD - the value you lift from stays put, lit and breathing` |
| `f5027fa` | `feat(09-03): STEPS and SLAM - a sweeping column, and velocity you can see` |
| `e95a1a0` | `chore(09-03): the fixture at nineteen, the recorded row, and HOLD's bench row` |

## Self-Check: PASSED

All three entry files, `frames.json`, `docs/HARDWARE-AUDITION.md` and this SUMMARY are on disk; all
three commit hashes resolve in `git log`. `grep -c` over `listing.ts` and `front-door.ts` prints
**1** for each of `hold`, `steps` and `slam` in both files, and `front-door.ts` holds **19** ids —
eleven excluded plus the eight of the untouched ring. Every character count, wall time, MIDI reading,
frame record and negative-check message quoted above was read from a runner's or a script's own
output in this session, and every canonical Lua string was dumped from `renderLua` after the final
format pass.
