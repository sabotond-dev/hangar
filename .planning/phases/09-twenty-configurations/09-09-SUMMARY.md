---
phase: 09-twenty-configurations
plan: 09
subsystem: catalog
tags:
  [
    CONT-02,
    CONT-03,
    TUNE-01,
    lua-entries,
    accessibility,
    ambient,
    glt-ceiling,
    D-06,
    deferred-items,
    chip-row,
    e2e,
  ]

# Dependency graph
requires:
  - ".planning/phases/09-twenty-configurations/09-08-SUMMARY.md - the rolling pair PREV_FILES 74 / PREV_TESTS 780 (+1 todo), BASE_SWEEP `4 19` at 662 combinations over twenty-five Lua entries, PREV_E2E 89, svelte-check 565, KNOWN_TAGS 55, chip row 26, ROW_COUNT 30, RECORDED 34 / 55 / 29 with featured 14, PHASE_ADDED_AT = 2026-09-07 copied verbatim, and glpfs-not-glp on any layer that has ever decayed"
  - ".planning/phases/09-twenty-configurations/09-01-SUMMARY.md - HOST_GLOBALS (15) and HOST_SELF_METHODS (9), and the rule this plan needed twice: IF AN ENTRY NEEDS SOMETHING A GATE DOES NOT GIVE IT, THE ENTRY IS WRONG, NOT THE GATE"
  - ".planning/phases/09-twenty-configurations/09-07-SUMMARY.md - CULL's single-channel reduction, the measurement QUADRANT repeats, and `accessible` left as a deliberate singleton for this wave to claim"
  - ".planning/research/ZONA-CAPABILITIES.md 5.3 - the 65535-tick glt ceiling, its three escapes and the statement that there is no fourth. POMODORO is the phase's only instance of it"
  - "09-CONTEXT.md D-06 and D-12 - the preference for kind: state and the two structural reasons every one of the twenty is kind: lua instead"
provides:
  - "The slate is complete. THIRTY-SIX catalog entries, twenty-seven of them hand-authored Lua, TWENTY of those authored in this phase, and ZERO of source.kind 'state'"
  - "The rolling pair for 09-10: PREV_FILES 74, PREV_TESTS 780 (+ 1 todo) - unchanged, as an entry wave must be"
  - "PREV_E2E 89, RE-MEASURED BY THIS PLAN at --workers 3 across both projects. BASE_E2E is 89 and the delta is ZERO across the whole phase"
  - "The sweep is 701 combinations over twenty-seven entries (662 + 17 + 22); the test count is still 6"
  - "A MULTI-COLOUR PALETTE IS NOT A `colour` KNOB. widgetFor gives a swatch row only when every value is one RGB triple, and knobs.lua.spec.ts makes the fall-through a failure rather than a fallback. QUADRANT's four-colour palette ships kind 'mode'"
  - "AN AMBIENT CARD WHOSE ONLY OUTPUT IS TWENTY-FIVE MINUTES AWAY CANNOT PASS THE SMOKE GATE. lua-smoke.spec.ts test 2 runs 218 ticks and fails an entry that produced nothing; POMODORO's start-pause tap therefore sends a transport note an octave below the alarm"
  - "The standing chip row at thirty-six entries: TWENTY-EIGHT chips, up from twenty-six. `accessible` and `calm` both cross; `readable` takes the head of the row back from `playable` at eleven against ten"
  - "KNOWN_TAGS is unchanged at 55 - the first entry wave of the phase that coins no tag"
  - "docs/HARDWARE-AUDITION.md at thirty-two rows, ROW_COUNT 32, and a cost table of twenty-seven, which is every hand-authored configuration in the catalog"
  - "deferred item 5: the tune panel has no widget for a multi-colour palette"
affects:
  - "09-10's phase gate - ROW_COUNT is 32 as this plan leaves it, the cost table is twenty-seven, deferred-items.md holds five items, and the fifteen-row arithmetic table below is the phase's closing census"
  - "05.1-UI-SPEC.md, The tag chips and the ASCII mock - re-taken at thirty-six by this plan, and 09-10 confirms rather than moves it"
  - "e2e/browse.e2e.ts presses tag-playable and tag-generative by name; both still stand, at ten and five carriers, and the full suite was run to prove it"

tech-stack:
  added: []
  patterns:
    - "A FILL IS A MASK TABLE, AND FOUR DENSITIES ARE WORTH MORE THAN FOUR SHAPES. QUADRANT's four 4x4 fills are four sixteen-bit integers - 65535, 23130, 63903, 33825 - and they light 16, 8, 12 and 4 cells. The pairwise Hamming distances are 4 to 12 of 16, and the closest pair is solid against outline, which differ only in the four interior cells"
    - "HUE SEPARATION IS NOT LUMINANCE SEPARATION, AND THE MEASUREMENT SAYS SO. QUADRANT's high-contrast palette is four hues ninety degrees apart, and two of them - chartreuse and cyan - render at a luminance ratio of 1.02:1. On a single-channel reduction they are the same colour. That is the whole argument for shipping a fill as well as a hue, and it was measured rather than assumed"
    - "A LONG KEEPER IS LEGITIMATE WHEN THE RATE IS SINGLE-DIGIT, AND POMODORO IS TWO ORDERS OF MARGIN ON BOTH AXES. glt(a,2,60000) with fre 1 sits below the smoke gate's keeper floor of 64511 AND below its rate floor of 200; pitfall 1 needs both"
    - "THE 655 SECOND CEILING IS BEATEN BY RE-ISSUING THE RATE ON A HALF-PERIOD, AND THE BRANCH MUST SIT OUTSIDE THE RUNNING TEST. POMODORO re-issues glpfs and glt on all 49 inner cells every 300 seconds against a 600 second timeout. The re-arm runs whether or not the countdown is running, because a finished pomodoro must still breathe"
    - "A DEAD BAND IS A FEATURE AND IT HAS TO BE OBSERVED, NOT READ. Eighteen scripted taps along QUADRANT's row 4 and column 4 produced ZERO MIDI messages, and four taps at four different cells inside one quadrant produced the same note four times"
    - "AN ENTRY WAVE FINDS ITS OWN BUGS IN THE GATES THAT ARE NOT THE ENTRY GATES. Both of this wave's two corrections came from suites the plan's per-task verify blocks do not name - lua-smoke.spec.ts and the two src/lib/tune/ specs - and both were found by the full run rather than by reading"

key-files:
  created:
    - "src/lib/catalog/entries/quadrant.ts"
    - "src/lib/catalog/entries/pomodoro.ts"
    - ".planning/phases/09-twenty-configurations/09-09-SUMMARY.md"
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
    - ".planning/phases/09-twenty-configurations/deferred-items.md"

decisions:
  - "QUADRANT's @FILL value 1 is FILLS ON, not fills off. The plan lists the three positions in prose as on, off, high contrast and pins the default to index 1; taken literally that ships a card whose own description promises a colour AND a fill and whose defaults draw neither. The numbers were assigned so that index 1 draws fills - 0 is colour only, 1 is colour and fill, 2 is high contrast. A declaration must never be aspirational"
  - "QUADRANT's palette knob is kind 'mode', not kind 'colour'. widgetFor gives a swatch row only when every value is one RGB triple and knobs.lua.spec.ts makes the fall-through a hard failure. src/lib/tune/ is not an entry wave's to edit, so the entry carries the correct kind. Recorded as deferred item 5"
  - "QUADRANT paints layer 2 at phase 255 and layer 1 at phase 0. The plan asks for both layers painted in Setup AND for the pressed quadrant to be held bright on layer 1; both lit at rest leaves no headroom for a press to change anything, so a target would have no confirmation. This is CULL's and LATTICE's shipped idiom and both halves of the plan's sentence survive it"
  - "QUADRANT's palette shipped as ONE knob, not two. The measured reason is the corner: 838 of 908 with 70 free, so the split the plan authorises against a budget failure was never needed"
  - "All four QUADRANT palettes are EXACTLY 39 characters and all four POMODORO ring and break colours EXACTLY 9, so neither colour knob contributes anything to a budget corner. Only @CH moves either entry"
  - "POMODORO's every tap sends a transport note an octave below the alarm. Without it the entry produced no output at all inside lua-smoke.spec.ts's 218 ticks and the plan's own acceptance criterion - 'lua-smoke.spec.ts 3 with POMODORO producing MIDI' - could not hold"
  - "POMODORO's ring FILLS with the resting colour at zero and stays, rather than flashing once. A one-second flash on a twenty-five minute timer is a thing you miss, and the filled ring is the 'done' picture readable from across a room - which is the card's whole claim"
  - "POMODORO re-issues glpfs rather than glf, as the plan specifies, and re-issues the SAME per-cell phase spread, so the breathe resets coherently every 300 seconds rather than flattening"
  - "The Timer's period is the literal 1000 and the re-arm period the literal 300; neither is a knob, because a visitor who could zero the first would get gtt's silent no-op and one who could raise the second past 600 would get a card that freezes - and neither failure is visible in a browser inside 1009 ticks"
  - "deferred-items.md gains item 5, appended. Items 1 to 4 are byte-untouched"

requirements-completed: []
requirements-contributed: [CONT-02, CONT-03, TUNE-01]

# Metrics
duration: 41min
completed: 2026-09-07
---

# Phase 9 Plan 09: QUADRANT and POMODORO — Summary

The twentieth configuration lands and the slate closes at thirty-six: four targets whose
distinguishability was measured rather than claimed, and a twenty-five minute ring checked over a
longer run than any gate in this repository performs — plus the finding that hue separation is not
luminance separation, and the two gates outside the plan's own verify blocks that caught this wave's
two corrections.

---

## The seven-name block

| Name         | Value                       | Where it came from                                                                                    |
| ------------ | --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `BASE_FILES` | **73** — **frozen**         | 09-01, the clean tree Phase 7 closed at `34d0fd6`. Carried forward unchanged                            |
| `BASE_TESTS` | **776** (+ 1 todo) — frozen | 09-01. Carried forward unchanged                                                                        |
| `PREV_FILES` | **74**                      | measured by this plan: ` Test Files  74 passed (74)` — `PREV_FILES + 0`                                 |
| `PREV_TESTS` | **780** (+ 1 todo)          | measured by this plan: `      Tests  780 passed \| 1 todo (781)` — `PREV_TESTS + 0`                     |
| `BASE_SWEEP` | **`4 19`**                  | re-measured here, unchanged                                                                             |
| `BASE_E2E`   | **89** — **frozen**         | 09-01                                                                                                   |
| `PREV_E2E`   | **89 (measured by 09-09)**  | **re-measured by this plan**, both projects at `--workers 3`: `89 passed (1.8m)`. `BASE_E2E + 0`        |

**Observed totals as baseline plus delta.**

- quick: `PREV_FILES 74 + 0 = 74`, `PREV_TESTS 780 + 0 = 780` (+ 1 todo, reported and never asserted).
  The delta was computed rather than assumed: this wave edited four test files
  (`audition.spec.ts`, `filter.spec.ts`, `sort.spec.ts` and — as a title only — `audition.spec.ts`'s
  test 1) and every edit was to a **constant** or a test **title**, never to an `it` count. Two
  configurations moved no count either, because every catalog gate loops over the entries internally.
- sweep: `BASE_SWEEP 4 19 + 0 = 4 19`. The growth is paid in wall time: **662 + 39 = 701
  combinations** over **25 + 2 = 27** hand-authored entries (QUADRANT 17, POMODORO 22).
- e2e: **`BASE_E2E 89 + 0 = 89`**, and the delta is the interesting number rather than the total —
  see the e2e section below.
- svelte-check: `565 + 2 = 567` files, `0 errors, 0 warnings`. The two new files are the two entries.
  Provenance only — the count line is never asserted.
- catalog: `34 + 2 = 36`. Lua entries `25 + 2 = 27`. `EXCLUDED_FROM_ROW` `26 + 2 = 28`.
  **`FRONT_DOOR` is byte-untouched and still eight** (D-02) — the whole diff of `front-door.ts`
  against `0ef0cb8` is two `EXCLUDED_FROM_ROW` rows, quoted in full below, and `grep -c 'id: "'`
  over the file prints **36**, which is twenty-eight excluded plus the eight of the untouched ring.

`PHASE_ADDED_AT` is **`2026-09-07`**, copied verbatim into `quadrant.ts`, `pomodoro.ts` and their two
`LISTING` rows. Nobody used a run date.

---

## QUADRANT

**The card.** Four targets big enough to hit without looking, each with its own colour and its own
fill.

### Route note

`kind: "lua"`, and it is the shortest route note in the phase. **`sends.grid` is `3x3 | 4x4 | 9x9`.
There is no 2x2.** Four zones is outside the sheet's vocabulary by arithmetic rather than by taste,
so nothing about the fills, the dead cross or the per-quadrant colours ever gets a chance to matter.

### Canonical Setup at the defaults, verbatim (835)

```
--[[@cb]]local C={255,140,0,0,200,255,0,255,120,255,0,180}if 1>1 then C={255,0,0,128,255,0,0,255,255,128,0,255}end local M={65535,23130,63903,33825}local function B(q,p)for j=0,15 do glp(glag(0,q%2*5+j%4+(q//2*5+j//4)*9),1,p)end end for n=0,80 do local x=n%9 local y=n//9 if x~=4 and y~=4 then local q=x//5+y//5*2 if 1==0 or(M[q+1]>>y%5*4+x%5)%2>0 then local a=glag(0,n)local i=q*3 glc(a,1,C[i+1],C[i+2],C[i+3],1)glc(a,2,C[i+1],C[i+2],C[i+3],1)glp(a,1,0)glp(a,2,255)end end end self.k={}self.touch_cb=function(s,i,e,x,y)local o=s.k[i]if e==3 or e>4 and e<9 then if o then s:gms(0,128,48+o,0,0)B(o,0)s.k[i]=nil end return end if e~=4 and e<9 then return end local c=x*9//128 local r=y*9//128 if c==4 or r==4 then return end local q=c//5+r//5*2 s:gms(0,144,48+q,100,0)B(q,255)if e==9 then s:gms(0,128,48+q,0,0)B(q,0)else s.k[i]=q end end
```

### Canonical Timer at the defaults, verbatim (0)

```

```

The empty string, the shape MORPH, SLAM, KEYS, GRIDLOCK, TABLE, CONSOLE, STRIP, LEARN, LUMEN, SWITCH,
CULL and ETCH also use — **thirteen** cards now.

### The substitution table

| Token   | Knob id   | Needle in the canonical text                                  | Sites            | Default |
| ------- | --------- | ------------------------------------------------------------- | ---------------- | ------- |
| `@HUE`  | `hue`     | the twelve numbers of `C={…}`                                 | 1 Setup, 0 Timer | index 0 |
| `@FILL` | `fill`    | the leading `1` of `if 1>1 then` and of `if 1==0 or(`         | 2 Setup, 0 Timer | index 1 |
| `@NOTE` | `note`    | the `48` of `48+o` and of both `48+q`                         | 3 Setup, 0 Timer | index 1 |
| `@CH`   | `channel` | the leading `0` of all three `s:gms(0,…)`                     | 3 Setup, 0 Timer | index 0 |

`65535, 23130, 63903, 33825` (the fill masks), the high-contrast palette, `100` (the velocity), `255`
and `0` (the pressed and unpressed phases) and `4`, `5` and `9` (the cross, the half split and the
grid width) are **literals, not knobs**, and the header says why for each.

**The two `@FILL` sites answer different questions** — `@FILL>1` picks the palette and `@FILL==0`
skips the mask — so substituting one and not the other compiles, fits the budget and is silently
wrong on the pad. That is the LATTICE `@BASE` trap in a different entry.

### Six numbers, and the corner

|                     | Setup   | Timer |
| ------------------- | ------- | ----- |
| defaults            | **835** | **0** |
| all-longest corner  | **838** | **0** |
| all-shortest corner | **835** | **0** |

**Free at the worst corner: 70 of 908.** **Combinations: 17** (`4+3+4+4 + 2`). The three characters
are `@CH` going from `0` to `15` at its three sites — and **nothing else moves at all**, because all
four palettes are exactly 39 characters and both other knobs are one and two digits throughout.

### Whether the palette shipped as one knob or two — one, and the reason is measured

The plan authorises splitting the palette into two knobs of two colours each **if the all-longest
corner pushes the Setup past 908**. It does not: the corner is **838**, seventy inside the budget,
so the split was never needed and the palette ships as one twelve-number value. Every one of the four
palettes was written to exactly 39 characters — twenty-eight digits and eleven commas — which is what
holds that corner still no matter which palette is selected.

### The accessibility claim, MEASURED — the four single-channel patterns

Every cell of the tick-0 frame reduced to `max(r, g, b)` and thresholded at 8, then each quadrant's
sixteen cells printed as a 4x4 block. Run at every `@FILL` position:

**`@FILL = 1`, the default — four distinct patterns, four different densities:**

```
q0  ####   16 of 16   solid       mask 65535
    ####
    ####
    ####

q1  .#.#    8 of 16   checker     mask 23130
    #.#.
    .#.#
    #.#.

q2  ####   12 of 16   outline     mask 63903
    #..#
    #..#
    ####

q3  #...    4 of 16   diagonal    mask 33825
    .#..
    ..#.
    ...#
```

`distinct = 4/4`, forty lit cells of eighty-one, and **zero lit cells anywhere on the dividing
cross**.

**`@FILL = 2`, high contrast — the SAME four patterns**, `distinct = 4/4`, forty lit cells. The
position changes the palette, not the geometry, which is the correct behaviour and is why the check
had to be run at both fills-on positions rather than only at the default.

**`@FILL = 0`, colour only — `distinct = 1/4`**, all four quadrants solid at sixteen cells,
sixty-four lit. That is the position doing exactly what it says, and it is the reason index 1 rather
than index 0 is the default.

### QUADRANT's measured contrast figures

Rendered RGB read off the frame, luminance by the sRGB relative-luminance formula, ratios computed as
`(L + 0.05) / (L' + 0.05)`.

**At the defaults (`@HUE` 0, `@FILL` 1):**

| Quadrant | rendered rgb | relative luminance | ratio against an unlit cell |
| -------- | ------------ | ------------------ | --------------------------- |
| q0 amber | `126,69,0`   | 0.0869             | **2.74:1**                  |
| q1 cyan  | `0,99,126`   | 0.1043             | **3.09:1**                  |
| q2 green | `0,126,59`   | 0.1524             | **4.05:1**                  |
| q3 rose  | `126,0,89`   | 0.0516             | **2.03:1**                  |

| Pair  | fill Hamming distance | luminance ratio |
| ----- | --------------------- | --------------- |
| q0/q1 | **8 of 16**           | 1.13:1          |
| q0/q2 | **4 of 16**           | 1.48:1          |
| q0/q3 | **12 of 16**          | 1.35:1          |
| q1/q2 | **8 of 16**           | 1.31:1          |
| q1/q3 | **12 of 16**          | 1.52:1          |
| q2/q3 | **12 of 16**          | 1.99:1          |

**At `@FILL = 2`, the high-contrast palette — and this is the finding.**

| Quadrant       | rendered rgb | relative luminance | ratio against an unlit cell |
| -------------- | ------------ | ------------------ | --------------------------- |
| q0 red         | `126,0,0`    | 0.0444             | 1.89:1                      |
| q1 chartreuse  | `63,126,0`   | 0.1598             | 4.20:1                      |
| q2 cyan        | `0,126,126`  | 0.1643             | 4.29:1                      |
| q3 violet      | `63,0,126`   | 0.0256             | 1.51:1                      |

| Pair  | luminance ratio |
| ----- | --------------- |
| q0/q1 | 2.22:1          |
| q0/q2 | 2.27:1          |
| q0/q3 | 1.25:1          |
| q1/q2 | **1.02:1**      |
| q1/q3 | 2.77:1          |
| q2/q3 | 2.83:1          |

**`q1/q2` is 1.02:1.** Chartreuse and cyan are ninety degrees apart on the hue wheel and, reduced to
one channel, they are **the same colour** — and that is on the palette whose whole name is "high
contrast". Hue separation is not luminance separation. This is the entire argument for shipping a
fill as well as a hue, and it is the number that makes it rather than an assertion: those two
quadrants are told apart by an eight-of-sixteen fill difference and by nothing else.

**The honest weak pair is q0/q2, at 4 of 16.** Solid and outline differ only in the four interior
cells, which is a genuine hole in a hollow square and is legible, but it is the smallest fill
distance on the pad and it is recorded here rather than glossed. Row 31 of the audition asks a human
at two metres.

### The dead cross sends nothing — how it was observed

A scripted host run, not a reading of the source. Eighteen `touchTap` events at the centre of every
cell of row 4 and every cell of column 4, each followed by two ticks:

```
QUADRANT cross: 18 taps on row 4 and column 4 -> 0 MIDI messages, errors 0
```

Then four taps, one inside each quadrant, at `(1,1)`, `(7,2)`, `(2,7)` and `(6,6)`:

```
QUADRANT four in-zone taps -> 8 messages:
  (0,144,48,100) (0,128,48,0) (0,144,49,100) (0,128,49,0)
  (0,144,50,100) (0,128,50,0) (0,144,51,100) (0,128,51,0)
```

Four notes and their offs, at 48, 49, 50 and 51 — one per quadrant, in reading order. Then the same
tap at four *different* cells inside quadrant 0 — `(0,0)`, `(3,0)`, `(0,3)` and `(3,3)`, the corners:

```
QUADRANT four different cells inside quadrant 0 -> 48,48,48,48,48,48,48,48
```

**One zone, one note, wherever inside it you land.** That is the behaviour clause proved in both
directions in one run.

### Traps

Every division and modulo floored. Colour channels inside 0..255 across all five palettes, checked
value by value. Code 9 handled and it sends both the on and the off in one handler; the end test is
`e==3 or e>4 and e<9`. The bit test is `(M[q+1]>>y%5*4+x%5)%2` and **not** `& 1`, because the pinned
minifier respaces `&` and a stored `&` is not a fixed point of `compressScript`; `>>` binds looser
than `+` and `*` in Lua, so the shift amount needs no parentheses. Per-contact state keyed by `id`
and cleared on an end. No `glt`, no `glf` and no `glpfs` anywhere, so pitfall 1 is unreachable rather
than merely avoided. The note range is 24..63.

**The honest limit, for the card copy.** Four zones is the point, so nothing here is fine control;
and the dividing cross is a deliberate dead band rather than a gap in the picture. That is row 31.

---

## POMODORO

**The card.** A twenty-five minute ring draining around the edge, so the time left is a thing in the
room.

### Route note

`kind: "lua"`. **Nothing in `PadState` counts.** `sends.kind` is
`none | xy | zones | faders | trackpad | dial` and none of them has any notion of elapsed time; every
`look.kind` is a phase generator that computes a colour from a tick and has no memory of how many
ticks have gone by, so a value that decreases once a second and survives across ticks has no
representation on the sheet at all. `showGrid` paints its zones in one `gridColour` besides, so a
ring of thirty-two individually decided cells could not be drawn there even if something could count.

### Canonical Setup at the defaults, verbatim (733)

```
--[[@cb]]local r={}for k=0,8 do r[k+1]=k end for k=1,8 do r[k+9]=k*9+8 r[k+17]=80-k end for k=1,7 do r[k+25]=(8-k)*9 end self.r=r self.n=25*60 self.t=self.n self.p=1 self.c=300 local function I(p,q,w)for n=0,80 do local x=n%9 local y=n//9 if x>0 and x<8 and y>0 and y<8 then local a=glag(0,n)glc(a,2,p,q,w,1)glpfs(a,2,(x+y)*16,1,3)glt(a,2,60000)end end end I(255,120,0)for k=1,32 do local a=glag(0,r[k])glc(a,1,255,120,0,1)glc(a,2,255,120,0,1)glp(a,1,255)glp(a,2,255)end self.touch_cb=function(s,i,e,x,y)if e~=4 and e<9 then return end local c=x*9//128 local w=y*9//128 if c<1 or c>7 or w<1 or w>7 then return end if s.t<1 then s.t=s.n I(255,120,0)s.p=1 else s.p=1-s.p end s:gms(0,144,60-12,90,0)s:gms(0,128,60-12,0,0)end gtt(0,1000)
```

### Canonical Timer at the defaults, verbatim (647)

```
--[[@cb]]gtt(0,1000)local s=self s.c=s.c-1 if s.c<1 then s.c=300 for n=0,80 do local x=n%9 local y=n//9 if x>0 and x<8 and y>0 and y<8 then local a=glag(0,n)glpfs(a,2,(x+y)*16,1,3)glt(a,2,60000)end end end if s.p>0 then s.t=s.t-1 if s.t>0 then local m=s.t*32//s.n for k=1,32 do local a=glag(0,s.r[k])if k<=m then glc(a,1,255,120,0,1)glc(a,2,255,120,0,1)else glc(a,1,0,0,0,1)glc(a,2,0,0,0,1)end end else s.p=0 s:gms(0,144,60,110,0)s:gms(0,128,60,0,0)for k=1,32 do local a=glag(0,s.r[k])glc(a,1,0,140,255,1)glc(a,2,0,140,255,1)end for n=0,80 do local x=n%9 local y=n//9 if x>0 and x<8 and y>0 and y<8 then glc(glag(0,n),2,0,140,255,1)end end end end
```

### The substitution table

| Token     | Knob id   | Needle in the canonical text                                | Sites            | Default |
| --------- | --------- | ----------------------------------------------------------- | ---------------- | ------- |
| `@MINS`   | `mins`    | the `25` of `self.n=25*60`                                  | 1 Setup, 0 Timer | index 2 |
| `@RINGC`  | `ring`    | `255,120,0` in both `I(…)` and in every working-colour `glc` | 4 Setup, 2 Timer | index 0 |
| `@BREAKC` | `break`   | `0,140,255` in all three resting-colour `glc`                | 0 Setup, 3 Timer | index 0 |
| `@NOTE`   | `note`    | the `60` of both `60-12` and of both alarm `gms`            | 2 Setup, 2 Timer | index 0 |
| `@CH`     | `channel` | the leading `0` of all four `s:gms(0,…)`                    | 2 Setup, 2 Timer | index 0 |

`300` (the re-arm period, in seconds), `1000` (the Timer period, in milliseconds), `60000` (the
breathe timeout, in ticks), `32` (the ring), `16` (the phase spread), `12` (the transport octave),
`110` and `90` (the velocities) and `0,0,0` (the blacking colour) are **literals, not knobs**, and
the header says why for each. **`@REARM` is a literal and never a token** — the plan is explicit, and
a live `@REARM` would also be caught by the sweep's `/@[A-Z]/` leftover check.

### Six numbers, and the corner

|                     | Setup   | Timer   |
| ------------------- | ------- | ------- |
| defaults            | **733** | **647** |
| all-longest corner  | **735** | **649** |
| all-shortest corner | **733** | **647** |

**Free at the worst corner: 173 of 908 on the Setup, 259 on the Timer.** **Combinations: 22**
(`4+4+4+4+4 + 2`). The two characters on each event are `@CH` going from `0` to `15` at its two sites
per event; **both colour knobs contribute nothing at any corner**, because all four working colours
and all four resting colours are exactly nine characters.

### The 160,000-tick run — the only place the ceiling is exercised

Built through `createLuaHost` over the rendered defaults and run for **160,020 ticks**, which is
1600.2 seconds: longer than a twenty-five minute interval and past **two** 60000-tick expiries.

```
POMODORO 160000-tick run: ticks 160020, errors 0
  tick 159000  non-zero 150   inner sample 0,68,125,0,53,96,0,26,48,0,5,9,0,1,1,0,16,30,0,42,77
  tick 160000  non-zero 154   inner sample 0,67,122,0,66,121,0,46,85,0,20,36,0,2,3,0,3,5,0,22,41
  tick 160020                 inner sample 0,69,126,0,55,101,0,30,54,0,7,12,0,0,0,0,13,25,0,38,70
  frames 160000 vs 160020 differ: true
  cell 40 layer 2 at tick 159000: fre 1  timeout 50999  pha 169
  cell 40 layer 2 at tick 160020: fre 1  timeout 49979  pha 165
  MIDI over the whole run: 2 -> (0,144,60,110) (0,128,60,0)
  lit border cells at the end: 32/32
```

**The two compared frames' non-zero byte counts are 150 and 154**, and the inner cells sampled twenty
ticks apart at the very end of the run are still moving. The layer record is the mechanical half of
the same answer: at tick 160,020 the centre cell's layer 2 still holds **rate 1** and **timeout
49,979**. A single `glt(a,2,60000)` armed in Setup would have reached zero at tick 60,000 and the
rate would have been set to 0 there and stayed 0; the re-arm branch is what keeps it alive, and it
has been re-armed five times by the end of the run.

**Two MIDI messages over 160,020 ticks** — one alarm note and its off, sent once, exactly as the
mechanism promises. The ring finishes full in the resting colour, which is the "done" picture.

### The ring drains — the lit border count at the five sampled ticks

Read from a fresh engine per tick, the same construction `frames.spec.ts` uses:

| tick | lit border cells | lit inner cells | non-zero bytes | animating |
| ---- | ---------------- | --------------- | -------------- | --------- |
| 0    | **32** / 32      | 40 / 49         | 156            | true      |
| 37   | **32** / 32      | 34 / 49         | 146            | true      |
| 101  | **31** / 32      | 34 / 49         | 146            | true      |
| 500  | **31** / 32      | 43 / 49         | 156            | true      |
| 1009 | **31** / 32      | 43 / 49         | 156            | true      |

**32 at tick 37 and 31 at tick 1009 — strictly fewer, which is the acceptance criterion.** The
arithmetic behind the thinness is worth stating: the Timer period is 1000 ms, so ten fires have
happened by tick 1009, `self.t` is 1490 of 1500 and `1490*32//1500` is 31. On a twenty-five minute
interval one ring cell is worth forty-seven seconds, so a browse card that lives for ten seconds can
only ever show one cell going out. The inner count moves because the breathe is a sine and cells
cross the threshold in both directions.

### Start, pause, and the ring that holds

```
POMODORO pause: after 200 s 27/32; tap, +200 s 27/32; +200 s more 27/32; tap to resume, +200 s 23/32
POMODORO ring tap: 23/32 before, 23/32 after a tap on the corner plus two seconds
POMODORO transport notes from three taps (two inner, one on the ring): 4 ->
  (0,144,48,90) (0,128,48,0) (0,144,48,90) (0,128,48,0)
```

Four hundred seconds of paused time moved the ring by **zero cells**; two hundred seconds of resumed
time moved it by four. A tap on the ring itself did nothing to the ring **and sent nothing**, which
is the readout-not-a-control rule observed rather than asserted.

### The alarm, at the shortest interval

Run at `@MINS = 15` — nine hundred seconds — for nine hundred and fifty:

```
POMODORO @MINS=15 after 950 s: 2 MIDI (0,144,60,110) (0,128,60,0)
  at rest after the alarm: lit border 32/32, sample rgb 0,138,253
  another 300 s later, still 2 MIDI messages (one note, once)
  reset tap: lit border 31/32, sample rgb 253,119,0
```

The whole ring in the resting blue after the alarm, still two messages three hundred seconds later,
and a reset tap that puts it back to the working amber and starts it draining again inside two
seconds.

### Traps

The 655 second re-issue, in capitals in the header, marked do-not-remove, with the firmware fact
written out. `glt(a,2,60000)` marked do-not-fix with its rate-floor reasoning: pitfall 1's signature
is a long timeout **together with** a fast rate, this layer's rate is **1**, the smoke gate's floors
are 64511 and 200, and 60000/1 is outside the signature on **both** axes rather than only one. The
Timer period is a literal and can never reach zero. Every division floored. Colour channels inside
0..255; the phase spread `(x+y)*16` runs 32..224 with `x` and `y` in 1..7 and can never wrap. Code 9
handled. The alert note: on ZONA an alert lights the 32 border cells additively — the exact ring this
card draws on — and that is a fact to know, not a fault to fix. The note range is 36..84.

**The honest limit, for the card copy.** Firmware fires a Timer on the next 100 Hz cycle *after* its
countdown, so every tick is at least 10 ms late and later under load, and the error accumulates over
1500 of them. This is a kitchen timer, not a stopwatch, and over twenty-five minutes the drift is
visible. That is row 32.

---

## The phase-wide check over the finished LISTING — what the sweep found

Run once over all thirty-six entries, not only this wave's two, because this is the last entry wave.

```
non-animated entries: 19 of 36
  ids: joystick ninepads faders tpad ghost morph slam keys gridlock table console
       strip learn lumen cull forge switch etch quadrant
  motion census: animated 17, static 15, dark 4
  entries whose quiet line is missing, empty or multi-line: 0
  restsBlack entries: 4 -> tpad ghost morph etch
  carrying RESTS_DARK_NOTE byte-for-byte: 4
  animated entries that also carry a quiet line: 1 -> dial
  descriptions over 110: 0; distinct descriptions 36 of 36
  longest description: euclid at 109
  quiet lines: 20, distinct 17 (RESTS_DARK_NOTE is shared by 4)
  quiet lines over 110: 0
  entries not carrying the right tag count (4 hand-authored, 3 shelf): 0
  fixture disagreements with motion or restsBlack: 0
```

**Nineteen entries rest still and every one of them carries a quiet line**, non-empty and on one
line. The number is worth having stated once at thirty-six rather than inferred from seven waves of
corrections, and so are the four things around it:

- **All three motions occur** — 17 animated, 15 static, 4 dark — which is what `listing.spec.ts`
  test 2 requires and which no single wave could have confirmed.
- **The four `restsBlack` entries all carry `RESTS_DARK_NOTE` byte-for-byte**, and no other entry
  carries it. Twenty quiet lines, seventeen distinct, because that one sentence is shared by four.
- **`dial` is `animated` and carries a quiet line anyway.** That is correct and deliberate:
  `front-door.ts` says in its own comment that Dial's line is a usage hint rather than a motion
  caveat, and the spec asserts it byte-for-byte against the shelf preset. It is the only entry in the
  catalog for which the quiet line is optional and present.
- **Zero disagreements between the fixture and any declared `motion` or `restsBlack`**, derived
  independently here: dark if every sampled tick has zero non-zero bytes, else animated if any tick
  reports `animating`, else static. Thirty-six entries, both fields, in both directions.

The tag count needed one correction to the *check* rather than to the data: a first pass asserted
four tags everywhere and named nine entries, which are exactly the nine shelf presets that carry
three by the shipped convention `copy.spec.ts` test 3 states. With the convention applied per source
kind the answer is **zero**.

---

## The fifteen-row phase arithmetic table

Every value observed, none carried:

```
CATALOG.length                            36
entries with source.kind === "preset"      9
entries with source.kind === "lua"        27
entries with source.kind === "state"       0
LISTING.length                            36
ROUTED.length                             36
FRONT_DOOR.length                          8
EXCLUDED_FROM_ROW.length                  28
FRONT_DOOR + EXCLUDED_FROM_ROW            36
distinct addedAt values                    3   (2026-09-02, 2026-09-04, 2026-09-07)
entries added in this phase               20
featured                                  15
frames.json entries                       36
static/og/*.png                           36
build/c/*/index.html                      36
```

**`state` reads 0, and that is the phase's headline finding stated as a number rather than as prose.**
D-06 *preferred* `kind: "state"`, and every one of the twenty was checked against the `PadState`
vocabulary and moved to `lua` for a stated, per-entry reason written into that entry's own route
note. Two of them are in this plan: QUADRANT because `sends.grid` offers `3x3 | 4x4 | 9x9` and there
is no 2x2, and POMODORO because nothing in the sheet counts. Plan 09-10 writes the twenty up
together.

The partition line is the one worth reading twice: **8 + 28 = 36**, and the eight is the front-door
ring, untouched. The whole diff of `front-door.ts` since 09-08's closing commit:

```
+  {
+    id: "quadrant",
+    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
+  },
+  {
+    id: "pomodoro",
+    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
+  },
```

---

## The fixture, and every declaration it agreed with

`UPDATE_FRAMES=1` was run twice and the two files are **byte-identical** (`diff -q` silent). The
fixture covers **36** entries at `0,37,101,500,1009`.

| Entry      | `restsBlack` | non-zero bytes                 | `motion` declared in tasks 1-2 | fixture says                    | outcome    |
| ---------- | ------------ | ------------------------------ | ------------------------------ | ------------------------------- | ---------- |
| `quadrant` | false        | **80** at all five ticks       | `static`                       | `animating: false` at all five  | **agrees** |
| `pomodoro` | false        | **156, 146, 146, 156, 156**    | `animated`                     | `animating: true` at all five   | **agrees** |

**No `motion` correction was needed in this wave.** QUADRANT's eighty is arithmetic rather than
coincidence: forty lit cells and every one of the four default palette colours has exactly two
non-zero channels. Its five ticks share **one identical hash**, `1e8ca185…`, five times over, which
is what a genuinely still card looks like. POMODORO's five hashes are all **different**, which is more
than the "at least two must differ" the plan asks for.

**QUADRANT's quiet line was written in task 1, with the entry**, for the reason the plan gives: the
mechanism ships `timer: ""`, so the classification was known before the fixture confirmed it.

> The four targets and the dark cross between them never move; that is what makes them findable.

Ninety-four characters against the 110 cap, one line, held to 09-02's copy rules and counted by
`copy.spec.ts` test 2 exactly as a description is. It is **not** `RESTS_DARK_NOTE`, which belongs
only to a `restsBlack: true` entry, and it is not the description repeated. **POMODORO carries no
quiet line at all**, and that is correct rather than an omission: `listing.spec.ts:211-225` requires
one only of entries whose `motion` is not `"animated"`.

The two descriptions are **90** and **92** characters against the 110 cap. Neither contains `aurora`
or `ghost`. `listing.spec.ts` reports **5 passed**, which is what proves all of it.

---

## The chip row, before and after — two chips, and the head of the row changes hands again

|              | Old (thirty-four entries) | New (thirty-six entries) |
| ------------ | ------------------------- | ------------------------ |
| `entries`    | 34                        | **36**                   |
| `tags`       | 55                        | **55**                   |
| `singletons` | 29                        | **27**                   |
| chips        | 26                        | **28**                   |
| `featured`   | 14                        | **15**                   |

```
old  playable (10) · readable (10) · gestural (6) · utility (6) · expressive (5) · generative (5)
     · grid (5) · hypnotic (5) · drums (4) · hotkeys (4) · precise (4) · xy-control (4)
     · colour (3) · hands-free (3) · ambient (2) · blooming (2) · game (2) · harmonic (2)
     · latching (2) · macros (2) · mixing (2) · modulation (2) · rails (2) · rippling (2)
     · sequencer (2) · still (2)

new  readable (11) · playable (10) · utility (8) · gestural (6) · expressive (5) · generative (5)
     · grid (5) · hypnotic (5) · drums (4) · hotkeys (4) · precise (4) · still (4) · xy-control (4)
     · ambient (3) · colour (3) · hands-free (3) · accessible (2) · blooming (2) · calm (2)
     · game (2) · harmonic (2) · latching (2) · macros (2) · mixing (2) · modulation (2)
     · rails (2) · rippling (2) · sequencer (2)
```

**`accessible` crosses into the chip row, exactly as the plan and CULL's own knob comment predicted.**
It was coined by CULL in wave 7 as a deliberate singleton and QUADRANT is the second carrier that was
always going to make it a chip.

**`calm` crosses too, and that one was not predicted** — POMODORO's second tag gives `starfield`'s
tag its second carrier. It is the same shape ETCH's `still` had in 09-08.

**`readable` takes the head of the row back from `playable`**, at eleven against ten. The two were
tied at ten after 09-08 and the tie broke on name ascending; QUADRANT's fourth tag breaks it on count
instead. **`utility` goes 6 to 8** — both of this wave's entries carry it — and jumps `gestural` into
third place. **`still` goes 2 to 4**, which is both of them again and is the census noticing that
this wave was deliberately the quiet one.

**`singletons` falls by two, from 29 to 27**, which is the first time in the phase it has fallen:
this is the only entry wave that coins **no new tag at all**. `KNOWN_TAGS` stays at **55**, confirmed
by `copy.spec.ts` test 3 — which asserts `KNOWN_TAGS.length === carried.size` and names any tag
declared and not carried — rather than by reading the array.

**New `RECORDED` values.** `filter.spec.ts`: `entries: 36, tags: 55, singletons: 27`, the twenty-eight
chips above and
`chipCounts: [11, 10, 8, 6, 5, 5, 5, 5, 4, 4, 4, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]`.
`sort.spec.ts`: `{ entries: 36, featured: 15 }` — QUADRANT is this wave's one featured entry. Both
files still report **6 passed**.

### The document that quotes the row

`.planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md`, **"The tag chips"**. Nothing in the
repository goes red when it drifts, which is exactly why it is checked.

**Old lines, verbatim:**

> catalog grows. **Re-recorded at thirty-four entries by 09-08** (it was nine chips at sixteen
> entries when Phase 5.1 wrote this section, fourteen at nineteen after 09-03, sixteen at twenty-two
> after 09-04, twenty-two at twenty-five after 09-05, twenty-three at twenty-eight after 09-06 and
> twenty-four at thirty-one after 09-07; every entry wave of Phase 9 re-takes it, and 09-10 confirms
> the final row at thirty-six entries). Today that is twenty-six:

**New lines, verbatim:**

> catalog grows. **Re-recorded at thirty-six entries by 09-09, which is the last entry wave of
> Phase 9 and therefore the finished row** (it was nine chips at sixteen entries when Phase 5.1 wrote
> this section, fourteen at nineteen after 09-03, sixteen at twenty-two after 09-04, twenty-two at
> twenty-five after 09-05, twenty-three at twenty-eight after 09-06, twenty-four at thirty-one after
> 09-07 and twenty-six at thirty-four after 09-08; every entry wave of Phase 9 re-took it, and 09-10
> confirms this one rather than moving it). Today that is twenty-eight:

The paragraph beneath it moved from *"The remaining 29 single-configuration tags"* and *"fifty-five
44px chips above thirty-four live pads"* to **27** and **thirty-six**; the tag total stayed at
fifty-five, which is why that number did not change. The ASCII mock at the top of the same document
was re-taken too: its tag block is now `readable playable utility gestural` first and seven lines
long, and its count line went from `34 of 34 configurations.` to `36 of 36 configurations.`

---

## The two audition rows, verbatim, and the new `ROW_COUNT`

`ROW_COUNT` in `src/lib/catalog/audition.spec.ts` is **32**, and the test title reads *"keeps
thirty-two numbered rows"*. `docs/HARDWARE-AUDITION.md` has thirty-two numbered rows, contiguous
from 1.

| #   | Config       | What to check                                                                                                                                                                                             | Why it cannot be simulated                                                                                                                                                                                                                                                                                             |
| --- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 31  | **QUADRANT** | Stand back two metres. Can you name each quadrant by its fill alone, with the colours ignored? Then hit each one without looking, ten times each, and count the misses that landed on the dark cross.       | The claim is about perception at a distance through a physical diffuser, and whether a target is hittable without looking is a question about hands. A pixel comparison says the four fills differ; it cannot say a person can tell them apart, and it cannot say a finger lands where its owner meant it to.            |
| 32  | **POMODORO** | Start it and leave the module alone for the full interval. **Does the inner breathe still move at the end, and does the ring reach zero at the right time?** Note how far behind a wall clock it finishes.  | The 655 s `glt` ceiling: the animation freezes when the countdown expires and only a re-issued rate restarts it. The re-issue is checked in a browser over 160,000 simulated ticks and has never run on hardware, where the Timer fires on the next 100 Hz cycle after its countdown and drifts under load over 1500 of them. |

**Row 32 is the last of the phase's four time-and-latch rows**, after HOLD's, CONSOLE's and FORGE's,
and it is the only one in the catalog that asks for twenty-five uninterrupted minutes. Row 31 is the
second accessibility row, after CULL's row 25, and the two ask the same question about two different
claims.

### The cost table, now twenty-seven — every hand-authored configuration in the catalog

`## The twenty-five, and what they cost` became
`## The twenty-seven, and what they cost — every hand-authored configuration in the catalog`, with a
sentence added naming the nine that are not on it and why: they are BOTOR's shelf presets rather than
HANGAR's own Lua.

| id         | name     | Setup | Timer            | knobs | dark at rest |
| ---------- | -------- | ----- | ---------------- | ----- | ------------ |
| `quadrant` | QUADRANT | 835   | 0 — **no Timer** | 4     | no           |
| `pomodoro` | POMODORO | 733   | 647              | 5     | no           |

**QUADRANT's 835 is the largest Setup in the catalog** — CONSOLE's 785 was the previous one — and it
is the entry with the least headroom in the phase at seventy free.

**The Setup-only note is now thirteen names rather than twelve**, with QUADRANT's reason written out:
it is four targets that are supposed to sit still, so a Timer would be motion nobody asked for on the
one card whose whole claim is that you can find it without looking. The prose counts moved with the
rows: *"Thirty-two rows"* twice, *"thirty-two lines"*, and *"twenty-seven Setup files and fourteen
Timer files"*. Item 4 of **Before you start** and the paragraph under the cost table both carry the
Setup-only list and both moved from twelve names to thirteen; the first is the one
`audition.spec.ts` matches with `/MORPH[^.]{0,200}Setup only/`, and the match is now **112
characters**, still inside one sentence with no full stop in it. The closing note on colour, which
still said *"the seven configurations"* from Phase 8, now says **twenty-seven**.

### `AUDITION_DUMP=1`, the two new entries

```
  quadrant: setup 835/908, no Timer
  pomodoro: setup 733/908, timer 647/908
```

Every printed count matches the recorded numbers above, and every one of the twenty-five earlier
lines reproduced 09-08's numbers exactly. `.tmp-audition/` held **twenty-seven** `.setup.lua` files
and **fourteen** `.timer.lua` files, which is what the document now says, and the directory was
removed by hand afterwards.

---

## `SMOKE_REPORT=1`, the two new entries

```
quadrant: 2 MIDI, 0 HID, first three MIDI (0,144,48,100,0) (0,128,48,0,0)
pomodoro: 4 MIDI, 0 HID, first three MIDI (0,144,48,90,0) (0,128,48,0,0) (0,144,48,90,0)
```

QUADRANT's two are one press and its lift — the scripted drag starts at cell (1,1), inside quadrant 0,
and the note is 48. POMODORO's four are two transport notes and their offs, one from the drag's press
and one from the fast tap, both at 48 because the default alarm is 60 and the transport note is an
octave below it. **Neither entry sends HID**, and both produce output, which is what test 2 asks.

---

## The deviations

### Auto-fixed issues

**1. [Rule 1 — bug] POMODORO produced no output at all inside the smoke gate's window, and the plan's
own acceptance criterion could not hold**

- **Found during:** Task 9-09-02, running the plan's own verify block.
- **Issue:** `lua-smoke.spec.ts` test 2 runs a scripted gesture plus two hundred further ticks — 218
  in total, about 2.2 seconds — and **fails an entry that produced no MIDI and no HID at all**, in
  those words. POMODORO as the plan specifies it sends exactly one note, at the moment the interval
  reaches zero, which at the shortest knob position is nine hundred seconds away. The observed
  failure: `pomodoro: produced no MIDI and no HID at all across 218 ticks - the scripted gesture
  never reached anything this configuration sends`. The plan's own acceptance criterion for this
  task reads *"`lua-smoke.spec.ts` **3** with POMODORO producing MIDI"*, so the mechanism as written
  contradicts the criterion it is measured against. It is also a real gap rather than a gate
  artefact: a card you start with a tap that tells nothing it started is a card with no transport.
- **Fix:** every tap in the inner 7x7 now sends `s:gms(@CH,144,@NOTE-12,90,0)` and its note-off. An
  octave below the alarm, which is the idiom SNAKE uses for its death note, so the transport and the
  alarm are never confused on one channel. Forty-five characters, taking the Setup from 688 to 733
  with 173 still free at the corner. Observed: three taps — two inside, one on the ring — produced
  **four** messages and the ring tap produced none.
- **Files modified:** `src/lib/catalog/entries/pomodoro.ts`.
- **Commit:** `f84d446`.

**2. [Rule 1 — bug] QUADRANT's palette declared a knob kind whose shipped widget cannot render it**

- **Found during:** Task 9-09-03, `npm run test:quick`. Not by any per-task verify block — neither
  `src/lib/tune/knobs.lua.spec.ts` nor `src/lib/tune/view.spec.ts` is named in this plan.
- **Issue:** `src/lib/tune/view.ts`'s `widgetFor` gives a `kind: "colour"` knob a swatch row only
  when **every value parses as one RGB triple**, and falls back to a rail otherwise.
  `knobs.lua.spec.ts` makes that fall-back a hard failure with a stated reason — *"a colour that
  reaches a rail is a malformed value set, not a rendering choice: the swatch row is the only honest
  widget for a colour"* — and `view.spec.ts` asserts `swatchOf` and `hueName` over **every** colour
  value the catalog ships. QUADRANT's palette is four colours in one twelve-number value, so it went
  red on both: `quadrant.hue is not a swatch: expected 'rail' to be 'swatch'` and
  `255,140,0,0,200,255,0,255,120,255,0,180: expected undefined to be 'rgb(255 140 0 0 …)'`.
- **Fix:** the knob ships `kind: "mode"` and renders as a four-position rail. `src/lib/tune/` is not
  an entry wave's to edit and 09-01's rule is that the entry is wrong, not the gate; the knob's own
  comment now carries the whole argument so the next reader does not "fix" it back. The
  user-visible consequence — four unlabelled positions where the thing being chosen is four colours
  — is real, and it is recorded as **deferred item 5** rather than silently accepted.
- **Files modified:** `src/lib/catalog/entries/quadrant.ts`,
  `.planning/phases/09-twenty-configurations/deferred-items.md`.
- **Commit:** `187ce58`.

### Decisions taken inside the plan's own latitude

- **`@FILL` value "1" is fills ON.** The plan lists the three positions in prose as *fills on, fills
  off, high contrast* and pins the default to index 1, which read together ship a card whose own
  description promises *"its own colour and its own fill"* and whose defaults draw no fill at all.
  The numbers were assigned so index 1 draws fills: "0" colour only, "1" colour and fill, "2" high
  contrast. The plan fixes the value set and the default index and both are honoured exactly; only
  the meaning of each number was chosen, and it was chosen so the declaration is not aspirational.
- **QUADRANT paints layer 2 at phase 255 and layer 1 at phase 0**, rather than both lit. The plan
  asks for both layers painted in Setup *and* for the pressed quadrant held bright on layer 1; with
  both lit at rest there is no headroom left and a press cannot change the picture, so a target
  would have no confirmation. Both layers **are** painted in Setup, which is what the plan says; only
  layer 1 waits at phase 0, which is black because the sixth argument of `glc` forces the minimum
  stop black. It is CULL's and LATTICE's shipped idiom and it costs a phase write per cell rather
  than a colour write.
- **The palette shipped as one knob**, with the corner measured at 838 and seventy free. The plan
  authorises a split against a budget failure and there was none.
- **All four QUADRANT palettes are exactly 39 characters** and all four of POMODORO's ring and break
  colours exactly nine, written that way rather than accepted that way: the only knob that moves
  either entry's corner is `@CH`.
- **POMODORO's ring fills with the resting colour at zero and stays**, rather than flashing once as
  the plan suggests. A one-second flash on a twenty-five minute timer is a thing you miss, and this
  card's whole claim is that the state is readable from across a room without looking at the moment
  it changed. The filled ring is the "done" picture; a tap resets it and the next Timer fire repaints
  it draining.
- **POMODORO's re-arm re-issues `glpfs` and `glt` with the same per-cell phase spread**, as the plan
  specifies. `glf` alone would have preserved the phase and avoided a five-minute reset of the wave,
  but the plan is explicit and re-issuing the spread resets the pattern coherently rather than
  flattening it.
- **The re-arm branch sits outside the `if s.p > 0` test.** After the interval ends the countdown
  stops and the breathe must not, so the re-issue has to keep running while the card is paused,
  finished or waiting. The 160,000-tick run passes through the finished state and the breathe is
  still moving at the end, which is the observation that proves the placement.

### Scope notes, recorded because a later reader will wonder

- **`listing.spec.ts` and `og/build.spec.ts` could not be green until task 3.** The first reads
  `frames.json` and asserts every listed id has a record; the second counts `static/og/` and
  `build/c/` against `ROUTED`. Both are red the moment an entry lands in tasks 1 or 2 and both go
  green on the fixture regeneration and the build. **5 passed** and the OG pair were confirmed in
  task 3.
- **`KNOWN_TAGS` needed no edit at all**, the first entry wave of the phase for which that is true.
  Both entries' eight tags were already declared and already carried.
- **`copy.spec.ts` was not modified**, though the plan lists it in `files_modified`. Its only
  wave-sensitive contents are `KNOWN_TAGS`, which did not move.
- **POMODORO's Timer redeclares its own inner-cell loops** rather than calling Setup's `I`. `I` is a
  local of the Setup chunk and the Timer is a separate chunk; hanging it off `self` and calling
  `self.I(...)` would be a field call the host-surface classifier refuses, and 09-01's rule is that
  the entry is wrong, not the gate. It is the same finding SNAKE's `P` produced in 09-08.
- **`P(k,0,0,0)`'s equivalent here is `glc(a,1,0,0,0,1)`**, and it is worth stating because it looks
  like a colour: the sixth argument forces the minimum stop black, so an all-zero colour renders
  black at every phase and one call serves both lighting and blacking. POMODORO writes the ring's
  phase once in Setup and never again for that reason.
- **The scratch harness** used to canonicalise, measure and observe the two configurations was three
  temporary `*.sweep.spec.ts` files under `src/lib/catalog/`, deleted before every commit and never
  left in the repository. `git status --short` prints nothing as this plan leaves it.

---

## The full e2e run — baseline plus delta, stated honestly

```
89 passed (1.8m)
```

**`BASE_E2E` is 89 and `PREV_E2E` was 89, so the delta is ZERO** — and the delta is the number worth
reading rather than the total, because the tree under test is not the tree 09-01 measured. Since then
this phase has added **twenty entries, twenty prerendered `build/c/<id>/index.html` pages and twenty
OG images**, and the e2e suite derives almost everything it counts from `LISTING`. It stayed at 89
for a reason that is a design decision rather than luck: **no e2e title was added anywhere in this
phase**, every count in `browse.e2e.ts` and `browse-webkit.e2e.ts` is `LISTING.length`, and
`catalog.e2e.ts` reads its entry count from `frames.json`. A suite that had hard-coded sixteen would
have needed seven edits.

Both projects ran, `chromium` and `webkit-phone`, at `--workers 3` against `wrangler dev` over the
freshly built `./build`. **The run was green on the first attempt and none of the three failure modes
09-02 anticipated fired:**

- `?q=aurora` still leaves exactly one card — neither new description, name nor tag contains the
  substring.
- `ghost` still returns exactly one result.
- `tag-playable` and `tag-generative` are both still in the derived standing chip row, at **10** and
  **5** carriers, and there is still at least one disabled chip beside them.

`test-results/` was removed by hand afterwards.

---

## Three wall times, and `static/og/`'s size

Taken on the same machine in the same session. **No plant was needed and none was made:** the
"before" column is 09-08's closing measurement, and the cross-check that it was still the right tree
is `static/og/` at **198,152 bytes over 34 PNGs** read immediately before this plan's first build,
which reproduces 09-08's closing number exactly.

| Measurement                       | Before (34 entries, 25 Lua)     | After (36 entries, 27 Lua)                       |
| --------------------------------- | ------------------------------- | ------------------------------------------------ |
| `lua-entries.sweep.spec.ts` alone | **3.45 s** tests / 7.17 s wall  | **3.80 s** tests / 4.44 s reported / 7.19 s wall |
| `npm run build`                   | **11.255 s**                    | **10.57 s**                                      |
| `static/og/`                      | **198,152 bytes**, 34 PNGs      | **210,926 bytes**, 36 PNGs                       |

The sweep grew from 662 combinations to **701** — 1,324 measured events to 1,402 — for 0.35 s of test
time, and the wall time is within two hundredths of a second of 09-08's. The build is *faster* by
seven tenths of a second, which is noise on an eleven-second build and is recorded rather than
explained; both this plan's builds landed between 10.5 and 10.6 seconds.

The two new OG images, from the build's own log:

```
gen-og: quadrant     6212 bytes   40 of 81 cells lit
gen-og: pomodoro     6562 bytes   74 of 81 cells lit
```

**POMODORO's seventy-four lit cells is the highest in the catalog** — the full ring plus the
breathing interior, minus the seven inner cells the sine happened to have at low intensity at tick
zero — and its 6,562 bytes is the largest image in `static/og/`. QUADRANT's forty is the forty cells
its mask table lights, exactly, which is the fixture and the OG generator agreeing from two
directions.

---

## The negative check

Everything this wave created was committed **before** anything was perturbed, so the restore did not
pass vacuously. The perturbation was restored from a copy taken before the edit and
`git diff --quiet` exited **0** afterwards.

| Perturbation                                              | Observed                                                                                                                                                                                                                                                                                                       | What it proves                                                                          |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| POMODORO's row removed from `EXCLUDED_FROM_ROW`           | `front-door.spec.ts` **test 5** red, **exit code 1**: `AssertionError: 8 in the row plus 27 excluded must be exactly the 36 in CATALOG`, with the diff naming the missing id — `-   "pomodoro",` — between `"pinwheel"` and `"quadrant"`. `Tests 1 failed \| 7 passed (8)` | The partition is checked rather than assumed, and its failure message names the exact entry that is in neither the row nor the exclusion list |

After the restore `front-door.spec.ts` reported **8 passed** and `git diff --quiet` exited 0.

---

## Verification

| Gate                                              | Result                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `catalog.spec.ts`                                 | **10 passed**                                                                   |
| `frames.spec.ts`                                  | **5 passed**                                                                    |
| `front-door.spec.ts`                              | **8 passed**                                                                    |
| `listing.spec.ts`                                 | **5 passed**                                                                    |
| `audition.spec.ts`                                | **4 passed**                                                                    |
| `copy.spec.ts`                                    | **5 passed**                                                                    |
| `host-surface.spec.ts`                            | **4 passed**                                                                    |
| `catalog + host-surface + copy`                   | **3 files, 19 passed**                                                          |
| `frames + listing + front-door + audition`        | **4 files, 22 passed**                                                          |
| `lua-entries.sweep.spec.ts`                       | **6 passed**, twenty-seven entries, 701 combinations                            |
| `lua-smoke.spec.ts`                               | **3 passed**, both non-vacuity halves asserted, POMODORO producing MIDI         |
| `filter.spec.ts` / `sort.spec.ts`                 | **6 passed each**                                                               |
| `knobs.lua.spec.ts` / `view.spec.ts`              | green after the knob-kind correction                                            |
| `vendored-diff.spec.ts`                           | **14 passed**                                                                   |
| `npm run test:quick \| check-counts 74 780`       | **74 files / 780 passed + 1 todo** — `PREV + 0 / PREV + 0`                       |
| `npm run test:sweep \| check-counts 4 19`         | **`4 19`**                                                                      |
| `npm run build`                                   | exit 0, **36** PNGs in `static/og/`, **36** in `build/og/`, **36** in `build/c/` |
| `npm run test:quick` again, after the build       | **74 / 780 + 1 todo**                                                           |
| `npm run test:e2e -- --workers 3`                 | **89 passed (1.8m)**, both projects — `BASE_E2E + 0`                            |
| `npm run check 2>&1 \| grep -Ei "error\|warning"` | `567 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`                           |
| `npm run lint`                                    | exit 0                                                                          |
| `git diff --stat HEAD -- src/vendor/`             | prints nothing                                                                  |
| `FRONT_DOOR`                                      | byte-untouched and still **eight**; `EXCLUDED_FROM_ROW` now **twenty-eight**    |
| `frames.json` shape                               | `Object.keys(j.entries).length` **36**, `j.ticks.join()` **`0,37,101,500,1009`** |
| Two consecutive `UPDATE_FRAMES=1` runs            | byte-identical                                                                  |
| The negative check                                | observed red at exit 1 with the message above, restored byte-identical          |
| QUADRANT's four single-channel patterns           | four distinct, at 16 / 8 / 12 / 4 lit cells, at BOTH fills-on positions         |
| QUADRANT's dead cross                             | 18 scripted taps -> **0** MIDI messages, 0 errors                                |
| QUADRANT's zone invariance                        | four different cells inside quadrant 0 -> note 48 four times                     |
| POMODORO over 160,020 ticks                       | 0 errors, breathe still moving, rate 1 and timeout 49,979 at the end, 2 MIDI     |
| POMODORO's ring at ticks 37 and 1009              | **32** then **31** lit border cells — strictly fewer                            |
| POMODORO's pause                                  | 27/32 held across 400 s of paused time, then 23/32 after 200 s resumed          |
| The phase-wide `LISTING` sweep                    | 19 non-animated entries, 0 missing quiet lines, 0 fixture disagreements, 0 tag-count problems |
| The fifteen-row arithmetic table                  | every value observed; `state` reads **0**                                        |
| Note ranges                                       | QUADRANT 24..63, POMODORO 36..84 — all inside 0..127                            |
| Keepers and decays                                | QUADRANT holds no `glt`, `glf` or `glpfs` at all; POMODORO's only keeper is 60000 at rate 1, below both smoke-gate floors |

No device was connected to, looked for or written to. Nothing under `src/vendor/` was read for
editing or edited. Nothing under `src/lib/tune/` was touched — the tune-panel finding was fixed in
the entry, which is the point. No sibling repository was touched. `wrangler` was not run directly.
`test-results/` and `.tmp-audition/` were removed by hand. `git status --short` prints nothing as
this plan leaves it.

---

## Commits

| Commit    | What                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------- |
| `edde82d` | `feat(09-09): QUADRANT - four targets whose distinguishability was measured, not claimed`         |
| `f84d446` | `feat(09-09): POMODORO - the phase's longest-lived card, checked over 160,000 ticks`              |
| `187ce58` | `chore(09-09): the fixture at thirty-six, a twenty-eight chip row, two bench rows`                |

## Self-Check: PASSED

Both entry files, `frames.json`, `docs/HARDWARE-AUDITION.md`, `deferred-items.md`, `05.1-UI-SPEC.md`
and this SUMMARY are on disk; all three commit hashes resolve in `git log`. `grep -c` over
`listing.ts` and `front-door.ts` prints **1** for each of `quadrant` and `pomodoro` in both files,
and `front-door.ts` holds **36** ids — twenty-eight excluded plus the eight of the untouched ring.
Every character count, wall time, frame record, rendered cell, luminance ratio, Hamming distance,
chip count, message stream, tick reading and negative-check message quoted above was read from a
runner's or a script's own output in this session, and both canonical Lua strings were dumped from
the pinned minifier after the final format pass and re-confirmed by `AUDITION_DUMP=1`.
