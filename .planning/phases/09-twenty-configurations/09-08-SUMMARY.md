---
phase: 09-twenty-configurations
plan: 08
subsystem: catalog
tags:
  [
    CONT-02,
    CONT-03,
    TUNE-01,
    lua-entries,
    game,
    drawing,
    cellular-automaton,
    determinism,
    D-03,
    deferred-items,
    chip-row,
  ]

# Dependency graph
requires:
  - ".planning/phases/09-twenty-configurations/09-07-SUMMARY.md - the rolling pair PREV_FILES 74 / PREV_TESTS 780 (+1 todo), BASE_SWEEP `4 19` at 600 combinations over twenty-two Lua entries, PREV_E2E 89, svelte-check 562, KNOWN_TAGS 53, chip row 24, ROW_COUNT 27, RECORDED 31 / 53 / 29 and { entries: 31, featured: 13 }, PHASE_ADDED_AT = 2026-09-07 copied verbatim, and A DECLARATION MUST NEVER BE ASPIRATIONAL - reconcile the motion against the fixture while the entry is being written, not after"
  - ".planning/phases/09-twenty-configurations/09-04-SUMMARY.md and steps.ts:41-55 - EVERY DECAY LENGTH MUST DIVIDE 252, because the rate is 256 - 252//length and a length that does not divide it expires part-way down and freezes the cell part lit. LIFE's dying trail is 28 for exactly this reason"
  - ".planning/phases/09-twenty-configurations/09-01-SUMMARY.md - HOST_GLOBALS (15) and HOST_SELF_METHODS (9). A field call on self is refused by the classifier, which is why SNAKE's Timer redeclares its own painter rather than calling Setup's"
  - "09-CONTEXT.md D-03 - the user's ruling that three or four entries are pure play, because a large share of HANGAR's visitors can never install anything and the site has to be worth opening anyway. This wave is that ruling"
  - ".planning/research/ZONA-CAPABILITIES.md 2.4, 3.1, 5.2 and 5.4 - the animation calls and the 65535 timeout ceiling, GRID_LUA_STDO_LENGTH = 256 with its eighteen-messages-per-cycle consequence and its silent refusal, the one-shot timer, and per-contact state keyed by id"
  - ".planning/research/USE-CASES.md - SNAKE named as the Discord card, the one people share"
provides:
  - "The rolling pair for 09-09: PREV_FILES 74, PREV_TESTS 780 (+ 1 todo) - unchanged, as an entry wave must be"
  - "Three configurations that need no hardware to enjoy: SNAKE (featured), ETCH (the catalog's third dark card), LIFE. Thirty-four catalog entries, twenty-five of them hand-authored Lua"
  - "The sweep is 662 combinations over twenty-five entries (600 + 22 + 18 + 22); the test count is still 6"
  - "A SINGLE SIGNED INDEX STEP CANNOT TORUS-WRAP A 9x9 GRID. Recovering the row step from an index step needs step//9, which is 0 for +1 and MINUS ONE for -1 under Lua's floor division, so a snake steered left on the top row crawls up a row every step. Two signed fields and (h//9+v)%9*9+(h%9+u)%9 is the whole move in one expression"
  - "A STRAIGHT-LINE SELF-PLAYING GAME NEVER DIES. Without an autopilot SNAKE circles one row forever, so the plan's own 'runs, dies and restarts' could not hold. A perpendicular-only greedy - turn onto the food's row while travelling horizontally, onto its column while travelling vertically - is one floored subtraction and one sign, cannot reverse by construction, and produces a five-bite game every 6.5 seconds"
  - "glp AFTER A DECAY IS A BUG, NOT A REPAINT. glp writes the phase and nothing else, so a LIFE cell coming back from the dying layer would keep the rate of 247 and fade out again. glpfs(a,l,255,0,0) is what puts a cell back under manual control"
  - "The standing chip row at thirty-four entries: TWENTY-SIX chips, up from twenty-four. `game` and `still` both arrive; `playable` takes the head of the row back from `readable` on the name-ascending tiebreak at ten each"
  - "KNOWN_TAGS 53 -> 55: game, drawing"
  - "docs/HARDWARE-AUDITION.md at thirty rows, ROW_COUNT 30, and a cost table of twenty-five. ETCH joins GHOST and MORPH as a declared dark-at-rest card"
  - "deferred item 4: determinism is proved per entry by hand and nothing gates it. Numbered 4 rather than the plan's 3, because 09-07 already took 3"
affects:
  - "09-09 - the last entry wave inherits the decay-divides-252 rule, the glpfs-not-glp correction, the honest-limit wording and deferred items 2, 3 and 4"
  - "09-10's phase gate - ROW_COUNT is 30 as this plan leaves it and the cost table is twenty-five; deferred-items.md holds four items"
  - "05.1-UI-SPEC.md, The tag chips and the ASCII mock - re-taken at thirty-four by this plan"
  - "e2e/browse.e2e.ts presses tag-playable and tag-generative by name; both still stand, at ten and five carriers"

tech-stack:
  added: []
  patterns:
    - "A TORUS STEP NEEDS TWO SIGNED FIELDS. (row + v) % 9 * 9 + (col + u) % 9, with Lua's floor-modulo turning -1 into 8, wraps both axes in one expression. A single signed index step (1, -1, 9, -9) cannot: the row component is step//9, which floor-divides -1 to MINUS ONE, so a left-moving snake climbs a row every step and the bug is silent"
    - "A CARD THAT PLAYS ITSELF NEEDS A REASON TO TURN. Determinism plus a straight line is a still picture that happens to move. SNAKE's autopilot writes only the PERPENDICULAR axis, so a direct reversal is impossible by construction rather than by a comparison, and the same rule makes a finger's steer safe"
    - "glp IS NOT A REPAINT ON A LAYER THAT HAS EVER DECAYED. It writes pha and leaves fre alone by design (lua-host.ts, 'that is what makes an accelerating swirl accelerate instead of restarting'), so a cell handed rate 247 by a dying trail and then lifted to phase 255 fades straight back out. glpfs(a,l,255,0,0) is eight characters more and it is the correct call"
    - "A NOTE CEILING IS ARITHMETIC, NOT A KNOB. 256-byte buffer, 14 bytes a voice message, about eighteen a cycle, and an append that does not fit is refused WITH NO ERROR. LIFE caps births at the literal 6 - twelve messages, 168 bytes - and a knob that let a visitor raise it would let them lose notes silently"
    - "A PERSISTENT MARK IS A CELL WITH NO TIMEOUT, AND THE MISSING CALL NEEDS A DO-NOT-ADD. Every touch look on the compiler's sheet is a self-erasing decay, so ETCH's whole card is the glt that is not there; without the note, adding one reads as a fix"
    - "PER-CONTACT PREVIOUS-CELL STATE MUST BE CLEARED ON AN END EVENT. Otherwise a lift at one corner and a fresh touch at the other reads as one enormous jump. Measured: draw at column 0, lift, touch column 8, and the canvas grows rather than wiping"

key-files:
  created:
    - "src/lib/catalog/entries/snake.ts"
    - "src/lib/catalog/entries/etch.ts"
    - "src/lib/catalog/entries/life.ts"
    - ".planning/phases/09-twenty-configurations/09-08-SUMMARY.md"
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
    - ".planning/phases/09-twenty-configurations/deferred-items.md"

decisions:
  - "SNAKE's direction is TWO signed fields, self.u and self.v, not the plan's single signed index step. The plan asks for `%9 on the column and %81 on the index`, which wraps the column correctly only when the step is +/-1 and cannot recover the row step at all: step//9 is 0 for +1 and MINUS ONE for -1 under floor division. Two fields make the whole move one expression and cost four characters"
  - "SNAKE has an AUTOPILOT, which the plan does not specify. Without one the deterministic snake travels in a straight line forever, circles one row on the torus and never eats or dies - so the plan's own behaviour clause, `with no touch at all the game runs, dies and restarts`, could not be satisfied. The autopilot is a perpendicular-only greedy and it yields five bites and a death every 6.5 seconds, identically, forever"
  - "A FINGER HOLDS CONTROL FOR THREE GENERATIONS. self.t is set to 3 by any live touch sample and spent one generation at a time by the Timer. A moving finger re-arms it on every sample and keeps control indefinitely; a still finger hands the snake back after three steps, which is what the honest limit on the card says"
  - "SNAKE's post-death snake is two cells at 39 and 40 with food at 41, as the plan asks, painted by a two-iteration loop rather than by three literal calls - which is nineteen characters and is what took the Timer's worst corner from 896 to 872"
  - "SNAKE's food fallback is computed BEFORE the re-roll and overwritten by it. Same result, same two bounded loops, one branch fewer, nine characters cheaper"
  - "MOVING INTO THE CELL THE TAIL IS ABOUT TO VACATE COUNTS AS DEATH in SNAKE. Reading the occupancy table before releasing the tail is one lookup cheaper than the arcade rule and one cell stricter; it is written into the header as a rule and it is why the self-played games are short"
  - "LIFE's live branch uses glpfs(a,2,255,0,0) and not glp(a,2,255). glp writes the phase only, so a cell returning from the dying layer would keep rate 247 and fade straight back out - a bug that would have looked like a rendering quirk"
  - "LIFE's @VOICES is the literal 6 in the source rather than a knob, as the plan requires, and the header carries the arithmetic: six births is twelve messages is 168 of 256 bytes against a ceiling of about eighteen"
  - "LIFE's notes send note-on and note-off together, as ETCH's do. A deferred off costs the same twelve messages per cycle plus a per-generation allocation, and it would strand a note the moment the pattern settled"
  - "ETCH's `still` tag is its fourth, giving LATTICE's tag a second carrier and putting it in the chip row. `drawing` is the coined one"
  - "deferred-items.md gains item 4, not the plan's item 3. 09-07 landed a third item after 09-08 was written, and the file is appended to rather than overwritten"
  - "KNOWN_TAGS was updated in the task 1 and task 2 commits rather than in task 3, because copy.spec.ts test 3 gates the vocabulary in both directions. 09-06 and 09-07 set the same precedent"

requirements-completed: []
requirements-contributed: [CONT-02, CONT-03, TUNE-01]

# Metrics
duration: 48min
completed: 2026-09-07
---

# Phase 9 Plan 08: SNAKE, ETCH and LIFE — Summary

A game that plays itself on the shelf and plays the same game every time, a canvas that is honestly a
black square until somebody draws on it, and an automaton that re-seeds rather than dying quietly on
a browse page — plus the finding that the plan's own torus arithmetic could not have wrapped and its
own straight-line snake could never have died.

---

## The seven-name block

| Name         | Value                       | Where it came from                                                                        |
| ------------ | --------------------------- | ----------------------------------------------------------------------------------------- |
| `BASE_FILES` | **73** — **frozen**         | 09-01, the clean tree Phase 7 closed at `34d0fd6`. Carried forward unchanged                |
| `BASE_TESTS` | **776** (+ 1 todo) — frozen | 09-01. Carried forward unchanged                                                            |
| `PREV_FILES` | **74**                      | measured by this plan: ` Test Files  74 passed (74)` — `PREV_FILES + 0`                     |
| `PREV_TESTS` | **780** (+ 1 todo)          | measured by this plan: `      Tests  780 passed \| 1 todo (781)` — `PREV_TESTS + 0`         |
| `BASE_SWEEP` | **`4 19`**                  | re-measured here, unchanged                                                                 |
| `BASE_E2E`   | **89** — **frozen**         | 09-01. **Not re-measured**; this plan adds no e2e title and the plan does not ask for a run |
| `PREV_E2E`   | **89 (measured by 09-01)**  | copied verbatim                                                                             |

**Observed totals as baseline plus delta.**

- quick: `PREV_FILES 74 + 0 = 74`, `PREV_TESTS 780 + 0 = 780` (+ 1 todo, reported and never asserted).
  The delta was computed rather than assumed: this wave edited four test files (`copy.spec.ts`,
  `audition.spec.ts`, `filter.spec.ts`, `sort.spec.ts`) and every edit was to a **constant** or a test
  **title**, never to an `it` count. Three configurations moved no count either, because every catalog
  gate loops over the entries internally.
- sweep: `BASE_SWEEP 4 19 + 0 = 4 19`. The growth is paid in wall time: **600 + 62 = 662
  combinations** over **22 + 3 = 25** hand-authored entries (SNAKE 22, ETCH 18, LIFE 22).
- svelte-check: `562 + 3 = 565` files, `0 errors, 0 warnings`. The three new files are the three
  entries. Provenance only — the count line is never asserted.
- e2e: **not run.**
- catalog: `31 + 3 = 34`. Lua entries `22 + 3 = 25`. `EXCLUDED_FROM_ROW` `23 + 3 = 26`.
  **`FRONT_DOOR` is byte-untouched and still eight** (D-02) — the whole diff of `front-door.ts`
  against `494d87e` is three `EXCLUDED_FROM_ROW` rows, and `grep -c 'id: "'` over the file prints
  **34**, which is twenty-six excluded plus the eight of the untouched ring.
- Free memory during the quick runs: **1.4 GB of 16.4**, inside the band `docs/TESTING.md` records
  the 2026-09-05 timeouts in — and nothing timed out, on any run, at any point in this wave.

`PHASE_ADDED_AT` is **`2026-09-07`**, copied verbatim into `snake.ts`, `etch.ts`, `life.ts` and their
three `LISTING` rows. Nobody used a run date.

---

## SNAKE

**The card.** Snake on eighty-one lights: steer with a finger, eat, grow, and hear a note for every
bite.

### Route note

`kind: "lua"`. There is **no state machine anywhere in `PadState`**: `sends.kind` is
`none | xy | zones | faders | trackpad | dial` and every `look.kind` is a phase generator with no
memory between ticks, so nothing on the sheet can hold a body, a direction and a food cell across a
generation. And nothing there paints three individually chosen cells in two colours — `showGrid`
paints its zones in one `gridColour`.

### Canonical Setup at the defaults, verbatim (581)

```
--[[@cb]]local function P(k,r,g,b)local a=glag(0,k)glc(a,1,r,g,b,1)glc(a,2,r,g,b,1)glp(a,1,255)glp(a,2,255)end self.b={}self.o={}self.p=1 self.l=2 self.u=1 self.v=0 self.f=41 self.t=0 for k=39,40 do self.b[k-39]=k self.o[k]=1 P(k,0,255,120)end P(41,255,140,0)self.touch_cb=function(s,i,e,x,y)if e==3 or e>=5 and e<9 then return end s.t=3 local h=s.b[s.p]local c=x*9//128-h%9 local r=y*9//128-h//9 local m=c<0 and -c or c local w=r<0 and -r or r if m>w then if s.u==0 then s.u=c>0 and 1 or -1 s.v=0 end elseif w>0 then if s.v==0 then s.v=r>0 and 1 or -1 s.u=0 end end end gtt(0,220)
```

### Canonical Timer at the defaults, verbatim (870)

```
--[[@cb]]gtt(0,220)local s=self local function P(k,r,g,b)local a=glag(0,k)glc(a,1,r,g,b,1)glc(a,2,r,g,b,1)glp(a,1,255)glp(a,2,255)end local h=s.b[s.p]local o=s.u~=0 if s.t>0 then s.t=s.t-1 else local d=o and s.f//9-h//9 or s.f%9-h%9 if d~=0 then d=d>0 and 1 or -1 if o then s.v=d s.u=0 else s.u=d s.v=0 end end end local n=(h//9+s.v)%9*9+(h%9+s.u)%9 if s.o[n]then s:gms(0,144,48-12,110,0)for k=0,80 do P(k,0,0,0)end s.o={}s.b={}s.p=1 s.l=2 s.u=1 s.v=0 s.f=41 for k=39,40 do s.b[k-39]=k s.o[k]=1 P(k,0,255,120)end P(41,255,140,0)return end s.p=(s.p+1)%81 if n==s.f then s.l=s.l+1 local g=0 for k=0,80 do if k~=n and not s.o[k]then g=k break end end local w=s.f for _=1,12 do w=(w*7+23)%81 if w~=n and not s.o[w]then g=w break end end s.f=g P(g,255,140,0)s:gms(0,144,48+s.l%12,100,0)else local t=s.b[(s.p-s.l)%81]s.o[t]=nil P(t,0,0,0)end s.b[s.p]=n s.o[n]=1 P(n,0,255,120)
```

### The substitution table

| Token     | Knob id   | Needle in the canonical text                        | Sites            | Default |
| --------- | --------- | --------------------------------------------------- | ---------------- | ------- |
| `@SPEED`  | `speed`   | the `220` of both `gtt(0,220)`                      | 1 Setup, 1 Timer | index 1 |
| `@SNAKEC` | `body`    | `0,255,120` in each `P(…)` that paints the snake    | 1 Setup, 2 Timer | index 0 |
| `@FOODC`  | `food`    | `255,140,0` in each `P(…)` that paints the food     | 1 Setup, 2 Timer | index 0 |
| `@NOTE`   | `note`    | the `48` of `48-12` and of `48+s.l%12`              | 0 Setup, 2 Timer | index 0 |
| `@CH`     | `channel` | the leading `0` of both `s:gms(0,…)`                | 0 Setup, 2 Timer | index 0 |

`39`, `40`, `41` (the reset snake and its first food), `7` and `23` (the food step), `12` (the
re-roll bound and the note octave), `3` (the hands-on credit), `81` (the ring), `110` and `100` (the
velocities) and `-12` (the death interval) are **literals, not knobs**, and the header says why for
each.

### Six numbers, and the corner

|                     | Setup   | Timer   |
| ------------------- | ------- | ------- |
| defaults            | **581** | **870** |
| all-longest corner  | **581** | **872** |
| all-shortest corner | **581** | **870** |

**Free at the worst corner: 327 of 908 on the Setup, 36 on the Timer.** **Combinations: 22**
(`4+4+4+4+4 + 2`). The Setup does not move at all across the whole cross-product, because the two
knobs that reach it — `@SPEED` and the two colours — have equal-length values throughout; the
Timer's two characters are `@CH` going from `0` to `15` at its two sites.

**Both colour knobs ship four nine-character values on purpose.** Written with a mixed-length set
the Timer's corner would have been 880 and this entry's whole margin would have been eight bytes.

### The torus step, which is the one place the plan's mechanism could not have worked

The plan specifies `self.d` as *"the direction as a signed index step"*, wrapping with *"`%9` on the
column and `%81` on the index"*. That works for the column only when the step is `+1` or `-1`, and
the row step cannot be recovered from it at all:

| index step | intended | `step // 9` in Lua |
| ---------- | -------- | ------------------ |
| `9`        | row +1   | **1** — correct    |
| `-9`       | row -1   | **-1** — correct   |
| `1`        | row 0    | **0** — correct    |
| `-1`       | row 0    | **-1** — WRONG     |

Lua's floor division rounds toward negative infinity, so `-1 // 9` is `-1`, and a snake steered LEFT
would have climbed a row on every step. Two signed fields make the whole move one expression:

```
local n=(h//9+s.v)%9*9+(h%9+s.u)%9
```

Both moduli are floor-modulo, so `-1 % 9` is `8` and the wrap is free in both axes. **Observed**, on
a scripted steer with a finger parked at the top-left corner and the head starting at (4,4) going
right — the column-nine wrap is generation 9:

```
t=0    3,4 4,4 5,4      the two-cell snake, and the food at 5,4
gen1   4,3 4,4 5,4      turned UP toward the finger's row
gen2   3,3 4,3          turned LEFT toward its column
gen3   3,2 3,3          up
gen4   2,2 3,2          left
gen5   2,1 2,2          up
gen6   1,1 2,1          left
gen7   1,0 1,1          up
gen8   0,0 1,0          left, arriving under the finger
gen9   0,0 8,0          WRAPPED off the left edge onto column 8
gen10  7,0 8,0          still going left
```

### Is it genuinely playable? Yes, and the trace above is the evidence

One turn per generation, always onto the perpendicular axis, always toward the finger, and a direct
reversal is impossible by construction. At the default step time of 220 ms that is a comfortable
walking pace and at 110 ms it is brisk. The two honest caveats, both on the card:

1. **A still finger is not a held finger.** Touch enqueue is change-gated per contact, so a
   motionless finger emits nothing and the three-generation credit runs out — 660 ms at the default —
   after which the autopilot takes the wheel. A finger that keeps moving keeps control indefinitely.
2. **Steering is by position, not by direction.** You point at where you want the head to go; you do
   not push it. That is the only gesture a 9x9 absolute sensor can offer honestly.

### The autopilot, which the plan does not specify and the plan's own behaviour clause requires

The plan's behaviour says *"with no touch at all the game runs, dies and restarts"*. With the plan's
mechanism exactly as written it does not: nothing turns, so the snake travels right along row 4
forever, wraps, and circles. It eats the first food (which sits directly ahead) and then never again,
and it never dies. That is a still picture that happens to move.

The autopilot is one branch: while travelling horizontally, turn onto the food's ROW; while
travelling vertically, turn onto its COLUMN. One floored subtraction, one sign, no table, and it
writes only the perpendicular axis so it can never reverse. Cost: 121 characters.

**Observed over 12,000 ticks with no touch at all — the message stream, in full, is one game
repeated:**

```
51 52 53 54 55 36  51 52 53 54 55 36  51 52 53 54 55 36  …  (111 messages, 18 and a half games)
```

Five bites at lengths 3, 4, 5, 6 and 7 — notes `48 + l % 12` — then a death at `48 - 12 = 36`. One
game is **about 6.5 seconds**, which is the right length for something a stranger scrolls past.

### The determinism check, run twice as the plan asked

```
build A, run to tick 1009   fe9da6ce3a5b0378
build B, run to tick 1009   fe9da6ce3a5b0378
identical = true
```

Two separately constructed `createLuaHost` engines over the same rendered text, each ticked from
zero to 1009 with **no touch input at all**, hashed over the 243-byte frame. Byte-identical.

### Every loop, and how it was checked

Not read off the source file — extracted from the two **stored strings** with a script, so the
prose in the TypeScript around them could not be counted by mistake:

```
setup   for-loops 1   while 0   repeat 0   goto 0   bounds: ["for k=39,40 do"]
timer   for-loops 4   while 0   repeat 0   goto 0   bounds: ["for k=0,80 do","for k=39,40 do",
                                                             "for k=0,80 do","for _=1,12 do"]
keeper 65535: false    glf: false    glpfs: false    math.: false
```

**Five loops, five literal bounds, no unbounded construct of any kind, and no call into the numeric
library.** The `for _=1,12` bound is marked do-not-remove in the header with the watchdog reason: an
unbounded loop in a Timer hangs the port task with the panic disabled and the only recovery is a
power cycle.

### Traps

Every division and modulo floored. Colour channels inside 0..255 by construction. Code 9 steers, and
`e == 5` is never tested for on its own. `glp` is never handed a negative phase. No keeper and no
decay anywhere in either string, so pitfall 1 is unreachable rather than merely avoided. The note
range: a bite tops at `72 + 11 = 83` and a death bottoms at `36 - 12 = 24`.

**The honest limit, for the card copy.** One finger steers, and the game runs whether or not anyone
is playing — which is what makes it a card rather than a game you have to start. That is row 28.

---

## ETCH

**The card.** Draw on the pad with a finger and it stays; sweep across it fast and the whole thing
wipes.

### Route note

`kind: "lua"`. **`touch.kind` offers `none | comet | perFinger | bloom | glow | disturb` and every
one of them is a self-erasing decay** — a mark that stays is the single thing the compiler's touch
sheet is built not to do. Second, and still decisive: `showGrid` paints its zones in one
`gridColour`, so a per-cell drawing has no representation there either.

### Canonical Setup at the defaults, verbatim (535)

```
--[[@cb]]self.c={}self.q={}self.touch_cb=function(s,i,e,x,y)if e==3 or e>=5 and e<9 then s.q[i]=nil return end local c=x*9//128 local r=y*9//128 local n=c+r*9 local p=s.q[i]s.q[i]=n if p then local m=c-p%9 local w=r-p//9 if m<0 then m=-m end if w<0 then w=-w end if m>3 or w>3 then s.c={}for k=0,80 do local a=glag(0,k)glc(a,1,0,0,0,1)glc(a,2,0,0,0,1)end return end end if s.c[n]then return end s.c[n]=1 local a=glag(0,n)glc(a,1,0,200,255,1)glc(a,2,0,200,255,1)glp(a,1,255)glp(a,2,255)s:gms(0,144,48+8-r,90,0)s:gms(0,128,48+8-r,0,0)end
```

### Canonical Timer at the defaults, verbatim (0)

```

```

The empty string, the shape MORPH, SLAM, KEYS, GRIDLOCK, TABLE, CONSOLE, STRIP, LEARN, LUMEN, SWITCH
and CULL also use — twelve cards now.

### The substitution table

| Token   | Knob id   | Needle in the canonical text                              | Sites            | Default |
| ------- | --------- | --------------------------------------------------------- | ---------------- | ------- |
| `@INKC` | `ink`     | `0,200,255` in both `glc` calls on the drawing path        | 2 Setup, 0 Timer | index 0 |
| `@WIPE` | `wipe`    | both `3` of `if m>3 or w>3 then`                          | 2 Setup, 0 Timer | index 1 |
| `@NOTE` | `note`    | the `48` of both `48+8-r`                                 | 2 Setup, 0 Timer | index 0 |
| `@CH`   | `channel` | the leading `0` of both `s:gms(0,…)`                      | 2 Setup, 0 Timer | index 0 |

`8` (the row-to-pitch offset), `90` (the velocity) and `0,0,0` (the blacking colour) are **literals,
not knobs**.

### Six numbers, and the corner

|                     | Setup   | Timer |
| ------------------- | ------- | ----- |
| defaults            | **535** | **0** |
| all-longest corner  | **537** | **0** |
| all-shortest corner | **535** | **0** |

**Free at the worst corner: 371 of 908.** **Combinations: 18** (`4+4+4+4 + 2`). The two characters
are `@CH` going from `0` to `15` at its two sites.

### How the wipe behaved at each `@WIPE` value on the scripted drag

A mark drawn at column 0, then one sample jumping `j` columns on the same contact. `WIPE` means the
canvas went to zero lit bytes; anything else means it grew:

| `@WIPE`     | j=1  | j=2  | j=3      | j=4      | j=5      | j=6      | j=7      | j=8      |
| ----------- | ---- | ---- | -------- | -------- | -------- | -------- | -------- | -------- |
| `2`         | grew | grew | **WIPE** | **WIPE** | **WIPE** | **WIPE** | **WIPE** | **WIPE** |
| `3` default | grew | grew | grew     | **WIPE** | **WIPE** | **WIPE** | **WIPE** | **WIPE** |
| `4`         | grew | grew | grew     | grew     | **WIPE** | **WIPE** | **WIPE** | **WIPE** |
| `6`         | grew | grew | grew     | grew     | grew     | grew     | **WIPE** | **WIPE** |

**The wipe fires on a jump STRICTLY GREATER than the threshold, at every setting, with no
off-by-one.** The last row is the one worth knowing: on a nine-column pad `@WIPE = 6` needs a jump
of seven cells, which is very nearly the full width, so that setting is close to "never wipe" — which
is exactly what it is there for, for anyone who draws fast.

**And the lift, measured separately:** draw at column 0, lift, touch column 8 — an eight-cell gap,
far past every threshold — and the canvas went from one cell to two with **no wipe**. The end branch
clears `s.q[i]`, so a stale coordinate cannot trigger a spurious wipe on the next touch.

### The picture, and why `restsBlack` is TRUE

Setup writes no colour and no phase to any cell at all: it declares two tables and a touch handler,
and every cell's stops are still the zeroes `grid_led_reset` left. The fixture agrees at all five
sampled ticks — **0 non-zero bytes, `animating: false`, `timerArmed: false`**, one identical hash
five times over. It is the catalog's **third** dark card, after GHOST and MORPH, and the one whose
OG image is a genuine black square (4,192 bytes, the smallest in `static/og/`).

### Traps

**No `glt` on the ink, marked do-not-add**, with both failure modes written out: a timeout makes the
drawing fade and a 65535 keeper is pitfall 1 exactly. There is no `glt`, no `glf` and no `glpfs`
anywhere in the entry, so neither is reachable. Every division and modulo floored. Colour channels
inside 0..255. Per-contact state keyed by `id`, cleared on an end event. Code 3 and codes 5..8 are
ends; code 9 falls through and draws. The single loop is bounded by 0..80. The note range tops at
`72 + 8 = 80`.

**The honest limit, for the card copy.** A wipe is a gesture, so a genuinely fast stroke will erase
what you meant to draw — which is why the threshold is a knob. That is row 29.

---

## LIFE

**The card.** Conway’s Life on the pad: tap to seed it, and the pattern plays itself out in light and
notes.

### Route note

`kind: "lua"`. **Nothing in `PadState` evolves state**: `sends.kind` is
`none | xy | zones | faders | trackpad | dial`, every `look.kind` is a phase generator with no memory
between ticks, and `showGrid` paints its zones in one `gridColour` — so neither the automaton nor its
per-cell two-colour picture has any representation on the sheet.

### Canonical Setup at the defaults, verbatim (435)

```
--[[@cb]]self.g={}self.h={}self.i=1 self.j=2 for n=0,80 do self.g[n]=0 self.h[n]=0 end local S={1,11,18,19,20}for k=1,5 do local n=S[k]self.g[n]=1 local a=glag(0,n)glc(a,1,0,255,120,1)glc(a,2,0,255,120,1)glp(a,1,255)glp(a,2,255)end self.touch_cb=function(s,i,e,x,y)if e~=4 and e<9 then return end local n=x*9//128+y*9//128*9 s.g[n]=1 local a=glag(0,n)glc(a,1,0,255,120,1)glc(a,2,0,255,120,1)glp(a,1,255)glpfs(a,2,255,0,0)end gtt(0,400)
```

### Canonical Timer at the defaults, verbatim (674)

```
--[[@cb]]gtt(0,400)local s=self local G=s.g local H=s.h local k=0 for n=0,80 do local x=n%9 local y=n//9 local c=0 for j=-1,1 do for i=-1,1 do c=c+G[(y+j)%9*9+(x+i)%9]end end c=c-G[n]local v=(c==3 or c==2 and G[n]>0)and 1 or 0 H[n]=v k=k*3+v end if k==s.i or k==s.j then for n=0,80 do H[n]=0 end H[1]=1 H[11]=1 H[18]=1 H[19]=1 H[20]=1 k=0 end s.i=s.j s.j=k local m=0 for n=0,80 do local a=glag(0,n)if H[n]>0 then glc(a,1,0,255,120,1)glc(a,2,0,255,120,1)glp(a,1,255)glpfs(a,2,255,0,0)if G[n]==0 and m<6 then m=m+1 s:gms(0,144,48+8-n//9,100,0)s:gms(0,128,48+8-n//9,0,0)end elseif G[n]>0 then glc(a,1,0,0,0,1)glc(a,2,60,20,0,1)glpfs(a,2,252,247,0)glt(a,2,28)end end s.g=H s.h=G
```

### The substitution table

| Token      | Knob id   | Needle in the canonical text                          | Sites            | Default |
| ---------- | --------- | ----------------------------------------------------- | ---------------- | ------- |
| `@GEN`     | `gen`     | the `400` of both `gtt(0,400)`                        | 1 Setup, 1 Timer | index 1 |
| `@LIVEC`   | `live`    | `0,255,120` in every living-cell `glc`                | 4 Setup, 2 Timer | index 0 |
| `@DYINGC`  | `dying`   | `60,20,0` in the dying branch's layer-2 `glc`         | 0 Setup, 1 Timer | index 0 |
| `@NOTE`    | `note`    | the `48` of both `48+8-n//9`                          | 0 Setup, 2 Timer | index 0 |
| `@CH`      | `channel` | the leading `0` of both `s:gms(0,…)`                  | 0 Setup, 2 Timer | index 0 |

`1, 11, 18, 19, 20` (the glider), `6` (the note ceiling), `3` (the hash multiplier and the birth
rule), `252 / 247 / 28` (the dying decay), `8` (the row-to-pitch offset) and `100` (the velocity) are
**literals, not knobs**. **`@VOICES` is deliberately not a knob** — see below.

### Six numbers, and the corner

|                     | Setup   | Timer   |
| ------------------- | ------- | ------- |
| defaults            | **435** | **674** |
| all-longest corner  | **435** | **677** |
| all-shortest corner | **435** | **674** |

**Free at the worst corner: 473 of 908 on the Setup, 231 on the Timer.** **Combinations: 22**
(`4+4+4+4+4 + 2`). The three characters are `@DYINGC` going from seven characters to eight and `@CH`
going from `0` to `15` at its two sites.

### The picture, observed at the five sampled ticks

```
tick 0     .#....... ..#...... ###...... . . .        10 non-zero bytes, the seeded glider
tick 37    .#....... ..#...... ###...... . . .        10 - IDENTICAL, and the reason is below
tick 101   ......... #.#...... ###...... .##......    14
tick 500   ......... ...##.... ....##... ...###...    14, walked to the middle
tick 1009  .......#. … ......#.# ......###             14, wrapped across the corner
```

**Ticks 0 and 37 hash identically, and that is arithmetic rather than a fault.** The default
generation time is 400 ms, which is forty ticks, so the first generation lands at tick 40 and tick 37
is still the seed. The other three differ from each other and from the seed, so the acceptance
criterion — different hashes between at least two sampled ticks — holds four times over.

**Tick 1009 is the torus doing its job**: the glider has walked the diagonal and is straddling the
corner. On a 9x9 torus a glider returns to its start after thirty-six generations and therefore
**never settles**, which is why the card is alive with nobody in front of it.

### The determinism check, run twice as the plan asked

```
build A, run to tick 1009   1a777083c3952421
build B, run to tick 1009   1a777083c3952421
identical = true
```

### The busiest sampled generation, and the ceiling that produced it

Seeded with a deliberately dense 5x5 tap storm and sampled over forty generations:

```
LIFE busiest sampled generation: 12 messages (6 births, each a note-on and its note-off)
```

**Twelve is the cap doing its job.** `@VOICES` is the literal `6` in the source; six births is twelve
`gms` calls is **168 of the 256-byte `GRID_LUA_STDO_LENGTH` buffer**, against a ceiling of about
eighteen messages per 10 ms cycle. An append that does not fit is **refused with no error** — no
raise, no return code, the note simply never leaves — and a busy generation on a torus can have
twenty or more births. That is why the ceiling is a literal and not a knob: a visitor who set it to
twenty would lose notes silently and nothing anywhere would say so.

### The double buffer, and the `glp` correction

`H` is computed from `G` in full and only then swapped in. Marked **do-not-simplify** in the header:
a single buffer would count neighbours the same pass had already updated, the top half of the grid
would evolve against generation *n* and the bottom half against a mixture, and **it would still look
like Life**. No gate in this repository could tell the difference.

The other correction is smaller and would have read as a rendering quirk: the living branch writes
`glpfs(a,2,255,0,0)` and **not** `glp(a,2,255)`. `glp` writes the phase and leaves the rate alone by
design, so a cell coming back from the dying layer would have kept the rate of `247` the trail gave
it and faded straight back out.

### Traps

The double buffer and the `glpfs`, above. **The dying decay divides 252**: the rate is
`256 - 252//28 = 247` and the phase steps by 9 to exactly 0 in exactly 28 ticks. No keeper on the
decaying layer — the longest timeout in the entry is 28. Every division and modulo floored; the
neighbour wrap relies on Lua's floor-modulo turning `-1` into `8`. Colour channels inside 0..255.
Code 9 seeds; a move never does. Five loops, all bounded by literals (`0..80` three times, `-1..1`
twice). The note range tops at `72 + 8 = 80`. `k = k*3 + v` overflows and wraps, which is defined
identically in Lua 5.3, 5.4 and 5.5.

**The honest limit, for the card copy.** Eighty-one cells on a torus is a very small universe — most
seeds settle in seconds, which is why tapping matters and why the card re-seeds itself. That is row
30.

---

## The fixture, and every declaration it agreed with

`UPDATE_FRAMES=1` was run **three times**, not two, because two of these entries are running state
machines and this is the wave where a non-deterministic card would surface. All three files are
**byte-identical** (`diff -q` silent on 1↔2 and on 2↔3). The fixture covers **34** entries at
`0,37,101,500,1009`.

| Entry   | `restsBlack` | non-zero bytes             | `motion` declared in tasks 1-2 | fixture says                   | outcome    |
| ------- | ------------ | -------------------------- | ------------------------------ | ------------------------------ | ---------- |
| `snake` | false        | **6, 8, 8, 12, 12**        | `animated`                     | `animating: true` at all five  | **agrees** |
| `etch`  | **true**     | **0** at all five ticks    | `dark`                         | `animating: false` at all five | **agrees** |
| `life`  | false        | **10, 10, 14, 14, 14**     | `animated`                     | `animating: true` at all five  | **agrees** |

**No `motion` correction was needed in this wave**, and for SNAKE and LIFE that is not luck: both
store a Timer that Setup arms and whose body re-arms unconditionally, so `host.timerArmed` is true at
every sampled tick and `lua-pad-sim.ts:150-152` reports `animating` — which is also true of the
picture, because both pads visibly move. ETCH stores no Timer at all, so `gtt` could not arm one even
if the entry called it, and both halves of the derivation agree on `dark`.

**The quiet lines.** ETCH is the one entry in this phase that declares `restsBlack: true`, and it
carries **`RESTS_DARK_NOTE` verbatim** — the shared sentence, referenced by name in `listing.ts`
rather than retyped, which is what makes `listing.spec.ts`'s byte-for-byte assertion structurally
impossible to fail by a typo:

> This pad rests dark. That is the configuration, not a broken picture.

**SNAKE and LIFE carry no quiet line at all**, and that is correct rather than an omission:
`listing.spec.ts:211-225` requires one only of entries whose `motion` is not `"animated"`, and both
of these are. `listing.spec.ts` reports **5 passed**, which is what proves it.

The three descriptions are **91, 91 and 94** characters against the 110 cap. LIFE's carries the
**U+2019** right single quotation mark in "Conway’s", not the ASCII apostrophe; `copy.spec.ts` test 2
would have named it otherwise. No field of any of the three contains `aurora` or `ghost`.

**The catalog's motion census is now 16 animated, 14 static and 4 dark.**

---

## The chip row, before and after — two chips, and the head of the row changes hands

|              | Old (thirty-one entries) | New (thirty-four entries) |
| ------------ | ------------------------ | ------------------------- |
| `entries`    | 31                       | **34**                    |
| `tags`       | 53                       | **55**                    |
| `singletons` | 29                       | **29**                    |
| chips        | 24                       | **26**                    |
| `featured`   | 13                       | **14**                    |

```
old  readable (10) · playable (8) · utility (6) · expressive (5) · gestural (5) · drums (4)
     · hotkeys (4) · hypnotic (4) · precise (4) · xy-control (4) · colour (3) · generative (3)
     · grid (3) · hands-free (3) · ambient (2) · blooming (2) · harmonic (2) · latching (2)
     · macros (2) · mixing (2) · modulation (2) · rails (2) · rippling (2) · sequencer (2)

new  playable (10) · readable (10) · gestural (6) · utility (6) · expressive (5) · generative (5)
     · grid (5) · hypnotic (5) · drums (4) · hotkeys (4) · precise (4) · xy-control (4)
     · colour (3) · hands-free (3) · ambient (2) · blooming (2) · game (2) · harmonic (2)
     · latching (2) · macros (2) · mixing (2) · modulation (2) · rails (2) · rippling (2)
     · sequencer (2) · still (2)
```

**`game` crosses into the chip row, exactly as the plan predicted**: it is coined by SNAKE in task 1
and takes its second carrier from LIFE in task 2, so the two commits that create it are also the two
that make it a chip. **`still` crosses too, and that one was not predicted** — ETCH's fourth tag
gives LATTICE's tag a second carrier.

**`playable` takes the head of the row back from `readable`.** The two are tied at ten and the tie
breaks on name ascending (`filter.ts:121-125`), so `p` before `r`. This wave is where a phase of
desktop and utility cards is answered by three cards you play, and the census says so without anybody
asserting it.

`gestural` went 5 to 6, `generative` 3 to 5, `grid` 3 to 5, `hypnotic` 4 to 5. **`singletons` did not
move**, which is the first time in the phase it has not: the two tags this wave coins both reach two
carriers inside the same wave, so neither is ever a singleton.

**The two tags added to `KNOWN_TAGS`, 53 -> 55:** `game`, `drawing`. Confirmed by `copy.spec.ts` test
3, which asserts `KNOWN_TAGS.length === carried.size` and names any tag declared and not carried,
rather than by reading the array.

**New `RECORDED` values.** `filter.spec.ts`: `entries: 34, tags: 55, singletons: 29`, the twenty-six
chips above and
`chipCounts: [10, 10, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]`.
`sort.spec.ts`: `{ entries: 34, featured: 14 }` — SNAKE is this wave's one featured entry. Both files
still report **6 passed**.

### The document that quotes the row

`.planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md`, **"The tag chips"**. Nothing in the
repository goes red when it drifts, which is exactly why it is checked.

**Old lines, verbatim:**

> catalog grows. **Re-recorded at thirty-one entries by 09-07** (it was nine chips at sixteen
> entries when Phase 5.1 wrote this section, fourteen at nineteen after 09-03, sixteen at twenty-two
> after 09-04, twenty-two at twenty-five after 09-05 and twenty-three at twenty-eight after 09-06;
> every entry wave of Phase 9 re-takes it, and 09-10 confirms the final row at thirty-six entries).
> Today that is twenty-four:
>
> > `readable` (10) · `playable` (8) · `utility` (6) · `expressive` (5) · `gestural` (5) · `drums` (4)
> > · `hotkeys` (4) · `hypnotic` (4) · `precise` (4) · `xy-control` (4) · `colour` (3)
> > · `generative` (3) · `grid` (3) · `hands-free` (3) · `ambient` (2) · `blooming` (2)
> > · `harmonic` (2) · `latching` (2) · `macros` (2) · `mixing` (2) · `modulation` (2) · `rails` (2)
> > · `rippling` (2) · `sequencer` (2)

**New lines, verbatim:**

> catalog grows. **Re-recorded at thirty-four entries by 09-08** (it was nine chips at sixteen
> entries when Phase 5.1 wrote this section, fourteen at nineteen after 09-03, sixteen at twenty-two
> after 09-04, twenty-two at twenty-five after 09-05, twenty-three at twenty-eight after 09-06 and
> twenty-four at thirty-one after 09-07; every entry wave of Phase 9 re-takes it, and 09-10 confirms
> the final row at thirty-six entries). Today that is twenty-six:
>
> > `playable` (10) · `readable` (10) · `gestural` (6) · `utility` (6) · `expressive` (5)
> > · `generative` (5) · `grid` (5) · `hypnotic` (5) · `drums` (4) · `hotkeys` (4) · `precise` (4)
> > · `xy-control` (4) · `colour` (3) · `hands-free` (3) · `ambient` (2) · `blooming` (2)
> > · `game` (2) · `harmonic` (2) · `latching` (2) · `macros` (2) · `mixing` (2)
> > · `modulation` (2) · `rails` (2) · `rippling` (2) · `sequencer` (2) · `still` (2)

The paragraph beneath it moved from *"fifty-three 44px chips above thirty-one live pads"* to
**fifty-five** and **thirty-four**; the singleton count stayed at 29, which is why that number did not
change. The ASCII mock at the top of the same document was re-taken too: its tag block is now
`playable readable gestural utility` first and seven lines long, and its count line went from
`31 of 31 configurations.` to `34 of 34 configurations.`

---

## The three audition rows, verbatim, and the new `ROW_COUNT`

`ROW_COUNT` in `src/lib/catalog/audition.spec.ts` is **30**, and the test title reads *"keeps thirty
numbered rows"*. `docs/HARDWARE-AUDITION.md` has thirty numbered rows, contiguous from 1.

| #   | Config     | What to check                                                                                                                                                                                              | Why it cannot be simulated                                                                                                                                                                                                                                                                                                                    |
| --- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 28  | **SNAKE**  | Play a full game. Does the snake turn where you meant it to, or does the turn arrive a beat late? Then take your finger off and watch it play itself.                                                       | One touch sample per 10 ms cycle across all contacts, plus a display that appears 0 to 10 ms after the write on a different core — the felt latency of a steer is exactly what a deterministic simulator cannot report.                                                                                                                        |
| 29  | **ETCH**   | Draw a slow line, then sweep. Does the wipe fire when you expect, and never when you did not want it? Try each of the four wipe distances.                                                                  | The wipe threshold is measured in cells between consecutive samples, and how far a real finger moves between samples depends on the sensor's delta gate and on how fast people actually sweep. A browser's scripted drag chooses that distance; a hand does not.                                                                               |
| 30  | **LIFE**   | Leave it for fifteen minutes. Does it keep re-seeding, and does the light stay steady or start to strobe? Then tap a dense block and listen for whether every birth is heard.                                | The 655 s `glt` ceiling and pitfall 1 — a keeper on a decaying trail wraps the countdown and strobes forever, which only time on hardware surfaces. The note ceiling is the other half: a `gms` that does not fit the 256-byte cycle buffer is refused with no error, so only ears can tell a capped generation from a lost one.                |

Row 29 is the wave's honest one: the wipe threshold is the only knob in this phase whose correct
value **cannot be chosen from a browser at all**, because the quantity it measures is how far a real
finger travels between two samples of a real sensor.

### The cost table, now twenty-five

`## The twenty-two, and what they cost` became `## The twenty-five, and what they cost`:

| id      | name  | Setup | Timer            | knobs | dark at rest |
| ------- | ----- | ----- | ---------------- | ----- | ------------ |
| `snake` | SNAKE | 581   | 870              | 5     | no           |
| `etch`  | ETCH  | 535   | 0 — **no Timer** | 4     | **yes**      |
| `life`  | LIFE  | 435   | 674              | 5     | no           |

**The Setup-only note is now twelve names rather than eleven**, with ETCH's reason written out: it is
a canvas whose marks are written once and never counted down, so a Timer would have nothing to
advance and a timeout on the ink would make the drawing fade. **The dark-at-rest paragraph is now
three names** — *"GHOST, MORPH and ETCH being dark at rest is a declared fact about them, not a
fault … ETCH is a blank canvas until somebody draws on it. If any of the three looks black on
arrival, that is correct."* The document's prose counts moved with its rows: *"Thirty rows"* twice,
*"thirty lines"*, and *"twenty-five Setup files and thirteen Timer files"*. Item 4 of **Before you
start** and the paragraph under the cost table both carry the Setup-only list and both moved from
eleven names to twelve; the first is the one `audition.spec.ts` matches with
`/MORPH[^.]{0,200}Setup only/`, and the match is now **102 characters**, still inside one sentence
with no full stop in it.

### `AUDITION_DUMP=1`, the three new entries

```
  snake: setup 581/908, timer 870/908
  etch: setup 535/908, no Timer
  life: setup 435/908, timer 674/908
```

Every printed count matches the recorded numbers above, and every one of the twenty-two earlier lines
reproduced 09-07's numbers exactly. `.tmp-audition/` held **twenty-five** `.setup.lua` files and
**thirteen** `.timer.lua` files, which is what the document now says, and the directory was removed
by hand afterwards.

---

## `SMOKE_REPORT=1`, the three new entries

```
snake: 3 MIDI, 0 HID, first three MIDI (0,144,36,110,0) (0,144,51,100,0) (0,144,52,100,0)
etch:  16 MIDI, 0 HID, first three MIDI (0,144,55,90,0) (0,128,55,0,0) (0,144,54,90,0)
life:  22 MIDI, 0 HID, first three MIDI (0,144,56,100,0) (0,128,56,0,0) (0,144,53,100,0)
```

All three send MIDI under the scripted gesture and none sends HID, which is the first wave since
09-05 for which that is true of every entry. SNAKE's three are a death (note 36, an octave below the
lowest bite) followed by two bites at 51 and 52 — the scripted drag steers it, the credit runs out,
and the autopilot takes over inside the two hundred settle ticks, which is exactly the behaviour the
card promises. ETCH's sixteen are eight drawn cells, each an on and an immediate off. LIFE's
twenty-two are eleven births over the same window.

---

## The deviations

### Auto-fixed issues

**1. [Rule 1 — bug] SNAKE's direction cannot be a single signed index step: the plan's wrap is
unrecoverable in one axis**

- **Found during:** Task 9-08-01, writing the move expression against the plan's stated mechanism.
- **Issue:** The plan specifies `self.d` as *"the direction as a signed index step"* and the wrap as
  *"`%9` on the column and `%81` on the index"*. `(h + d) % 81` wraps the row correctly; the column
  needs `(h%9 + dx) % 9`, and `dx` has to be recovered from `d`. There is no expression that does it:
  `d // 9` gives the row step and is **1, -1, 0, -1** for `d` of **9, -9, 1, -1**, because Lua's floor
  division rounds toward negative infinity. A snake steered LEFT would have climbed one row on every
  step, silently, and the frames would still have looked like a snake.
- **Fix:** two signed fields, `self.u` (column) and `self.v` (row), and the whole move becomes
  `n=(h//9+s.v)%9*9+(h%9+s.u)%9` — one expression, both axes, both moduli floor-modulo so `-1 % 9` is
  `8`. Costs four characters against the single-field form and removes the branch entirely. Observed
  wrapping in both axes on a scripted steer (the trace is above; the column wrap is generation 9).
- **Files modified:** `src/lib/catalog/entries/snake.ts`.
- **Commit:** `5020956`.

**2. [Rule 2 — missing critical functionality] SNAKE as specified never dies, so the plan's own
behaviour clause could not hold**

- **Found during:** Task 9-08-01, running the entry to tick 6000 with no touch to check the plan's
  *"with no touch at all the game runs, dies and restarts"*.
- **Issue:** The plan's mechanism has nothing that turns the snake when nobody is touching it. Started
  at cell 40 travelling right, it eats the food at 41 on generation 1 and then travels right along row
  4 **forever**, wrapping at the edge, never reaching another food and never colliding with itself. On
  a browse page that is a three-cell dot circling one row: no bite, no note, no death, no reset. The
  golden frames would still have been reproducible, and the card would have been dead.
- **Fix:** an autopilot the finger overrides. When the hands-on credit `self.t` is zero, the Timer
  steers: travelling horizontally it turns onto the food's row, travelling vertically onto its column.
  One floored subtraction, one sign, no table, 121 characters, and it writes only the PERPENDICULAR
  axis so it can never reverse. `self.t` is set to 3 by any live touch sample and spent one
  generation at a time, so a moving finger keeps control indefinitely and a lifted one hands the
  snake back after three steps. Measured over 12,000 ticks: five bites and a death, then exactly the
  same five bites and the same death, eighteen and a half times, about 6.5 seconds a game.
- **Files modified:** `src/lib/catalog/entries/snake.ts`.
- **Commit:** `5020956`.

**3. [Rule 1 — bug] LIFE's living cells would have faded out again, because `glp` does not clear a
rate**

- **Found during:** Task 9-08-02, choosing the paint calls for the three cases of the generation loop.
- **Issue:** The dying branch hands a cell `glpfs(a,2,252,247,0)` plus `glt(a,2,28)`. When that cell
  comes back to life a generation or two later, `glp(a,2,255)` lifts the phase and **leaves `fre` at
  247** — `lua-host.ts` documents that as deliberate, *"there is no phase reset here; that is what
  makes an accelerating swirl accelerate instead of restarting"*. The reborn cell would have decayed
  straight back to black inside 28 ticks and the card would have flickered in a way that looked like
  a rendering quirk rather than a bug.
- **Fix:** the living branch writes `glpfs(a,2,255,0,0)` — phase 255, rate 0, shape 0 — which is
  eight characters more and puts the cell back under manual control. Layer 1 keeps `glp`, because
  nothing ever gives layer 1 a rate.
- **Files modified:** `src/lib/catalog/entries/life.ts`.
- **Commit:** `a8964c2`.

**4. [Rule 3 — blocking] The plan's deferred item is numbered 3 and 09-07 already took 3**

- **Found during:** Task 9-08-03, appending to `deferred-items.md`.
- **Issue:** 09-08's plan was written before 09-07 executed, and 09-07 landed its own third item —
  the distinctness-gate finding. Writing this wave's item as "3" would have produced two items
  numbered 3, and following the plan's literal instruction would have meant overwriting somebody
  else's finding.
- **Fix:** appended as **item 4**, with the plan's prose otherwise verbatim and a closing sentence
  recording the renumbering and its reason. The file is appended to, never overwritten; items 1, 2
  and 3 are byte-untouched.
- **Files modified:** `.planning/phases/09-twenty-configurations/deferred-items.md`.
- **Commit:** `49c1479`.

### Decisions taken inside the plan's own latitude

- **SNAKE's colour knobs ship four nine-character values each.** With a mixed-length set the Timer's
  worst corner would have been 880 rather than 872 and the entry's whole margin would have been eight
  bytes. The plan asks for "four bright triples" and "four contrasting triples"; these are those, with
  their lengths chosen rather than accepted.
- **SNAKE's post-death repaint is a two-iteration loop**, not three literal `P` calls. Nineteen
  characters, and it is what took the Timer from 896 at the corner to 872.
- **SNAKE's food fallback is computed before the re-roll and overwritten by it.** Identical result,
  the same two bounded loops the plan requires, one branch fewer, nine characters cheaper.
- **Moving into the cell the tail is about to vacate counts as death.** Reading the occupancy table
  before releasing the tail is one lookup cheaper than the arcade rule; it is written into the header
  as a rule with its consequence (shorter self-played games) stated.
- **ETCH's fourth tag is `still`**, which gives LATTICE's tag a second carrier and puts it in the chip
  row. The plan specifies the tag; the chip-row consequence is recorded here because it was not
  predicted.
- **ETCH's notes send an immediate note-off**, as the plan says, and the header gives the reason
  rather than the instruction: this entry stores no Timer, so nothing could ever turn a note off
  later and a deferred off would stick forever the moment a finger lifted.
- **LIFE's notes do the same**, for a measured reason: a deferred off costs the same twelve messages
  per cycle (six offs plus six ons) and adds a per-generation allocation, so it buys nothing and
  strands a note when the pattern settles.
- **LIFE seeds a glider rather than a random field**, at 1, 11, 18, 19 and 20, as the plan asks. On a
  torus it never settles, so the settle detector is genuinely for the pad somebody has tapped.

### Scope notes, recorded because a later reader will wonder

- **`listing.spec.ts` could not be green until task 3.** It reads `frames.json` and asserts every
  listed id has a record, so the three entries landed in tasks 1 and 2 turn it red until the fixture
  is regenerated. The plan puts the fixture in task 3 and the per-task verify blocks name the four
  gates that can be green earlier; **5 passed** was confirmed in task 3, before anything else in that
  task was touched.
- **`KNOWN_TAGS` was updated in the task 1 and task 2 commits**, not task 3, because `copy.spec.ts`
  test 3 gates the vocabulary in both directions — a tag carried and not declared is red, and a tag
  declared and not carried is red too. 09-03, 09-06 and 09-07 set the same precedent.
- **SNAKE's Timer redeclares its own painter** rather than calling Setup's `P`. `P` is a local of the
  Setup chunk and the Timer is a separate chunk; hanging it off `self` and calling `self.P(...)` would
  be a field call the host-surface classifier refuses, and 09-01's rule is that the entry is wrong,
  not the gate. It costs 101 characters and saves more than three times that at its four call sites.
- **`P(k,0,0,0)` is how a cell is blacked**, and that is worth stating because it looks like a
  colour. The sixth argument of `glc` forces the minimum stop black, so an all-zero colour renders
  black at every phase and one helper serves both painting and erasing.
- **The scratch harness** used to canonicalise, measure and observe the three configurations was a
  temporary spec file under `src/lib/catalog/`, deleted before every commit and never left in the
  repository. `git status --short` prints nothing as this plan leaves it.

---

## Three wall times, `static/og/`'s size and ETCH's own image

Taken on the same machine in the same session. **No plant was needed and none was made:** the
"before" column was measured against the working tree at `494d87e`, which is 09-07's closing commit,
before a line of this wave was written. The cross-check that it was the right tree is `static/og/` at
**184,651 bytes over 31 PNGs**, which reproduces 09-07's closing numbers exactly.

| Measurement                       | Before (31 entries, 22 Lua)                     | After (34 entries, 25 Lua)                      |
| --------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| `lua-entries.sweep.spec.ts` alone | **3.03 s** tests / 3.65 s reported / 6.32 s wall | **3.45 s** tests / 4.06 s reported / 7.17 s wall |
| `npm run build`                   | **11.652 s**                                    | **11.255 s**                                    |
| `static/og/`                      | **184,651 bytes**, 31 PNGs                      | **198,152 bytes**, 34 PNGs                      |

The sweep grew from 600 combinations to **662** — 1,200 measured events to 1,324 — for 0.42 s of test
time. The build is *faster* by four tenths of a second, which is noise on an eleven-second build and
is recorded rather than explained.

The three new OG images, from the build's own log:

```
gen-og: snake        4612 bytes    4 of 81 cells lit
gen-og: etch         4192 bytes    0 of 81 cells lit   (restsBlack)
gen-og: life         4697 bytes    7 of 81 cells lit
```

**ETCH's is 4,192 bytes and it is the smallest image in the directory**, which is exactly what a
black square should be — and `gen-og.mjs` wrote it without complaint because the entry declared
`restsBlack`, which is the whole point of the declaration (`gen-og.mjs:142-154`). SNAKE's four lit
cells are the two-cell snake, its food, and one cell of the food's own second channel; LIFE's seven
are the five glider cells plus two whose second channel is lit.

---

## The two negative checks

Everything this wave created was committed **before** anything was perturbed, so no restore passed
vacuously. Each perturbation was restored with `git checkout --` and `git diff --quiet` exited **0**
afterwards.

| #   | Perturbation                                                              | Observed                                                                                                                                                                                | What it proves                                                                                    |
| --- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | ETCH's `restsBlack` changed from `true` to `false`                        | `frames.spec.ts` **test 5** red, naming the entry and both directions: `etch: declared restsBlack false, but the recorded frames say true`. `Tests 1 failed \| 4 passed (5)`             | The darkness declaration is checked against the frames rather than trusted, and the message says which way round it disagreed |
| 2   | one hex digit of SNAKE's tick-1009 hash, `fe9da6ce…` -> `ae9da6ce…`       | `frames.spec.ts` **test 3** red, naming the entry AND the tick: `snake at tick 1009: frame hash changed: expected 'fe9da6ce…' to be 'ae9da6ce…'`                                        | The fixture is load-bearing and its failure message names exactly what moved and when              |

After each restore `frames.spec.ts` reported **5 passed** and `git status --short` printed nothing.

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
| `lua-entries.sweep.spec.ts`                       | **6 passed**, twenty-five entries, 662 combinations                             |
| `lua-smoke.spec.ts`                               | **3 passed**, both non-vacuity halves asserted                                  |
| `filter.spec.ts` / `sort.spec.ts`                 | **6 passed each**                                                               |
| `vendored-diff.spec.ts`                           | **14 passed**                                                                   |
| `npm run test:quick \| check-counts 74 780`       | **74 files / 780 passed + 1 todo** — `PREV + 0 / PREV + 0`                       |
| `npm run test:sweep \| check-counts 4 19`         | **`4 19`**                                                                      |
| `npm run build`                                   | exit 0, 34 PNGs in `static/og/` and 34 in `build/og/`                           |
| `npm run test:quick` again, after the build       | **74 / 780 + 1 todo**                                                           |
| `npm run check 2>&1 \| grep -Ei "error\|warning"` | `565 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`                           |
| `npm run lint`                                    | exit 0                                                                          |
| `git diff --stat HEAD -- src/vendor/`             | prints nothing                                                                  |
| `FRONT_DOOR`                                      | byte-untouched and still **eight**; `EXCLUDED_FROM_ROW` now **twenty-six**      |
| `frames.json` shape                               | `Object.keys(j.entries).length` **34**, `j.ticks.join()` **`0,37,101,500,1009`** |
| Three consecutive `UPDATE_FRAMES=1` runs          | byte-identical, 1↔2 and 2↔3                                                     |
| Both negative checks                              | observed with the outcomes above and restored byte-identical                    |
| SNAKE determinism, two builds to tick 1009        | `fe9da6ce3a5b0378` both times                                                   |
| LIFE determinism, two builds to tick 1009         | `1a777083c3952421` both times                                                   |
| ETCH at the five sampled ticks                    | **0** non-zero bytes each time, one identical hash five times over              |
| Every loop in SNAKE, from the stored strings      | 5 loops, 5 literal bounds, 0 while, 0 repeat, 0 goto                            |
| Every loop in ETCH and LIFE                       | 1 and 5 respectively, all literal-bounded, no while and no repeat               |
| Keepers and decays                                | SNAKE's and ETCH's two event strings hold no `glf`, `glpfs`, `glt` or 65535; LIFE's longest timeout is 28, which divides 252 |
| Note ranges                                       | SNAKE 24..83, ETCH 36..80, LIFE 36..80 — all inside 0..127                      |
| The three declarations                            | `grep -c '"snake"' listing.ts` and `grep -c 'id: "snake"' front-door.ts` each print **1**, and the same for `etch` and `life`; all three are in `CATALOG` and all three are re-exported by name |
| LIFE's busiest sampled generation                 | **12 messages**, the `@VOICES` cap of six births                                |
| ETCH's wipe at every threshold                    | fires on a jump strictly greater than the threshold, at all four settings       |

No device was connected to, looked for or written to. Nothing under `src/vendor/` was read for
editing or edited. Nothing under `src/lib/tune/` was touched. No sibling repository was touched.
`wrangler` was not run. `test-results/` and `.tmp-audition/` were removed by hand. `git status
--short` prints nothing as this plan leaves it.

---

## Commits

| Commit    | What                                                                                        |
| --------- | ------------------------------------------------------------------------------------------- |
| `5020956` | `feat(09-08): SNAKE - a game that plays itself on the shelf, identically every time`         |
| `a8964c2` | `feat(09-08): ETCH and LIFE - a canvas that is honestly black, and an automaton that re-seeds` |
| `49c1479` | `chore(09-08): the fixture at thirty-four, a twenty-six chip row, three bench rows`          |
| `51a46d3` | `docs(09-08): the sixth entry wave recorded, and the two corrections it needed to be a game at all` |

## Self-Check: PASSED

All three entry files, `frames.json`, `docs/HARDWARE-AUDITION.md`, `deferred-items.md` and this
SUMMARY are on disk; all three commit hashes resolve in `git log`. `grep -c` over `listing.ts` and
`front-door.ts` prints **1** for each of `snake`, `etch` and `life` in both files, and
`front-door.ts` holds **34** ids — twenty-six excluded plus the eight of the untouched ring. Every
character count, wall time, frame record, rendered cell, chip count, message stream and
negative-check message quoted above was read from a runner's or a script's own output in this
session, and every canonical Lua string was dumped from the pinned minifier after the final format
pass and re-confirmed by `AUDITION_DUMP=1`.
