---
phase: 09-twenty-configurations
plan: 07
subsystem: catalog
tags:
  [
    CONT-02,
    CONT-03,
    TUNE-01,
    lua-entries,
    hid,
    keystrokes,
    accessibility,
    modal-state,
    glyphs,
    D-11,
    deferred-items,
    chip-row,
  ]

# Dependency graph
requires:
  - ".planning/phases/09-twenty-configurations/09-06-SUMMARY.md - the rolling pair PREV_FILES 74 / PREV_TESTS 780 (+1 todo), BASE_SWEEP `4 19` at 543 combinations over nineteen Lua entries, PREV_E2E 89, svelte-check 559, KNOWN_TAGS 51, chip row 23, ROW_COUNT 24, RECORDED 28 / 51 / 28 and { entries: 28, featured: 12 }, PHASE_ADDED_AT = 2026-09-07 copied verbatim, and A DECLARED MOTION IS A PROMISE ABOUT THE PICTURE, NOT A READING OF THE ENGINE - which is the rule that decided FORGE's whole Timer design"
  - ".planning/phases/09-twenty-configurations/09-04-SUMMARY.md and 09-03's decay work - EVERY DECAY LENGTH MUST DIVIDE 252, because the rate is 256 - 252//length and a length that does not divide it expires part-way down and freezes the cell part lit. This plan shipped with the wrong four values in its own knob table and the rule caught them"
  - ".planning/phases/09-twenty-configurations/09-01-SUMMARY.md - HOST_GLOBALS (15) and HOST_SELF_METHODS (9). A field call on self is refused by the classifier, which is why FORGE's Timer redeclares its own painter rather than calling Setup's"
  - "09-CONTEXT.md D-01..D-12 and the amendment block - every entry is kind: \"lua\", and D-02 keeps the front-door ring at eight"
  - ".planning/research/ZONA-CAPABILITIES.md 3.4, 435-437 and section 6 point 5 - gks(default_delay, is_modifier, state, keycode, ...) with its (nargs-1) % 3 rule, the statement that HID is recorded and never simulated, and the dropped-release bug with its two prescribed mitigations"
  - ".planning/research/USE-CASES.md N4, N7 and N8 - the photo culling grid whose ratings must be readable without colour (ZONA_GUI_SPEC.md 7.7), the IDE macro pad with a held-corner second bank, and the nine-app switcher drawn in glyph blocks"
  - "USB HID Usage Tables, Keyboard/Keypad page 0x07 - the source of every usage id in CULL, FORGE and SWITCH. Named because no gate in this repository can catch a wrong one"
provides:
  - "The rolling pair for 09-08: PREV_FILES 74, PREV_TESTS 780 (+ 1 todo) - unchanged, as an entry wave must be"
  - "Three configurations: CULL (five ratings that read without colour), FORGE (twenty-seven macros and a modal second bank), SWITCH (nine apps in nine glyph blocks, featured). Thirty-one catalog entries, twenty-two of them hand-authored Lua"
  - "The sweep is 600 combinations over twenty-two entries (543 + 17 + 22 + 18); the test count is still 6"
  - "THE MINIFIER RESPACES `&` AND `^` AND LEAVES `>>` ALONE. `(g>>k)&1` compresses to `(g>>k)& 1` and is therefore not a fixed point; `(g>>k)%2` is. Measured three ways before either bit-masked entry was written, and it is why both use a shift and a modulo"
  - "A TIMER THAT IS ARMED ONLY WHILE THERE IS SOMETHING TO WATCH KEEPS AN ENTRY HONESTLY STATIC. The Timer is a one-shot; if Setup never calls gtt and the body re-arms only under a condition, timerArmed is false at rest and the fixture classifies the entry static even though its stored Timer is not empty"
  - "The standing chip row at thirty-one entries: TWENTY-FOUR chips, up from twenty-three. `macros` arrives as a chip; `readable` takes the head of the row at ten"
  - "KNOWN_TAGS 51 -> 53: photo, accessible"
  - "docs/HARDWARE-AUDITION.md at twenty-seven rows, ROW_COUNT 27, and a cost table of twenty-two. Row 26 is the second D-11-shaped row of the phase"
  - "deferred item 3: nothing in the repository checks that a per-cell picture is distinguishable from itself, measured by a deliberately green negative check"
  - "RECORDED.singletons IS A TAG COUNT, NOT AN ENTRY COUNT. It was equal to the entry count at 25 and at 28 by coincidence and it is not at 31"
affects:
  - "09-08 and 09-09 - the next entry waves inherit the gks arity check, the usage-table rule, the honest-limit wording, the decay-divides-252 rule and deferred items 2 and 3"
  - "09-09's QUADRANT - it makes the same accessibility claim CULL makes and takes `accessible` off singleton status; the measurement CULL used is the one to repeat"
  - "09-10's phase gate - ROW_COUNT is 27 as this plan leaves it and the cost table is twenty-two; deferred-items.md holds three items"
  - "05.1-UI-SPEC.md, The tag chips and the ASCII mock - re-taken at thirty-one by this plan"

tech-stack:
  added: []
  patterns:
    - "THE PINNED MINIFIER RESPACES THE BITWISE AND. `(g>>k)&1` compresses to `(g>>k)& 1`, ` >>2&1` to ` >>2 & 1` and `2^k` to `2 ^ k`; `>>` alone is returned byte for byte. A stored `&` or `^` is therefore not a fixed point of compressScript and lua-entries.sweep.spec.ts test 1 goes red on it. `(g>>k)%2` is the substitution, it costs nothing, and both bit-masked entries in this wave use it"
    - "A ONE-SHOT TIMER ARMED BY A GESTURE IS NOT AN ANIMATION. lua-host.ts:604-618 consumes the deadline on every fire and only the body's own gtt re-arms it, so a Timer that Setup never arms and that re-arms only while a condition holds leaves timerArmed FALSE at rest. That is what let FORGE ship a required watchdog and still be honestly `static` - the alternative was a card reporting `animated` at every sampled tick on a pad where nothing moves"
    - "A DECAY LENGTH THAT DOES NOT DIVIDE 252 FREEZES THE CELL PART LIT, AND A PLAN'S OWN KNOB TABLE CAN CARRY THE WRONG FOUR. CULL was specified with 12, 24, 42, 64 - the rounder-looking pair 09-04 had already measured failing on this exact idiom. Every value must divide 252 because the rate is 256 - 252//length and the phase starts at 252"
    - "A SECOND MODIFIER IS A SAFER SECOND BANK THAN A KEYCODE SHIFT. A shift has to land somewhere for every value of the base key, and from F13 twenty-seven macros already reach usage id 130, so any further offset walks into the LANG and system ids. Shift plus the same key cannot land on an id nobody chose - and it forces left shift out of the base modifier's value list, because otherwise the two banks send the same chord"
    - "RELEASE A HELD-CORNER MODE ON THE CONTACT ID, NEVER ON THE CELL. Press the corner, drift off it, lift is the commonest real gesture there is, and the lift arrives with coordinates somewhere else entirely. Observed: the release was watched arriving at (10,10) and the bank still returned to A"
    - "A FRAME HASH IS A CHANGE DETECTOR, NOT A DISTINCTNESS GATE. Two of SWITCH's nine glyphs were made identical; only frames.spec.ts test 3 went red, and only on the hash. With the fixture re-taken the whole quick suite was 74 files / 780 passed with a card promising nine marks and drawing eight"
    - "RECORDED.singletons COUNTS TAGS CARRIED BY EXACTLY ONE ENTRY, NOT ENTRIES. It read 25 at twenty-five entries and 28 at twenty-eight by coincidence - 51 tags minus 23 chips is 28 - and the coincidence ends at thirty-one, where it is 29"

key-files:
  created:
    - "src/lib/catalog/entries/cull.ts"
    - "src/lib/catalog/entries/forge.ts"
    - "src/lib/catalog/entries/switch.ts"
    - ".planning/phases/09-twenty-configurations/09-07-SUMMARY.md"
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
  - "CULL's flash lengths are 12, 28, 42, 63, not the plan's 12, 24, 42, 64. The rate is 256 - 252//@FLASH against a starting phase of 252, so a length that does not divide 252 leaves the phase part-way down when the timeout expires and the band freezes lit. 24 and 64 are exactly the two 09-04 measured failing"
  - "FORGE's second bank adds left shift as a second modifier rather than shifting the keycode by a literal @BANK. At @KEY0 = 104 the twenty-seven macros already top at 130 and any offset lands in the LANG and system usage ids. @MOD therefore carries 224, 226, 227 and 0 - NOT 225, which would make the two banks identical"
  - "FORGE's watchdog Timer is armed by the corner's onset and re-arms only while the bank is held. Setup never calls gtt. A gtt in Setup would have made FORGE report animating at every sampled tick on a still pad, which is the declaration-versus-fixture trap 09-06 recorded; this way the watchdog exists, the Timer is not empty, and the entry is honestly static"
  - "CULL's five fills are a nine-entry ROW-MASK TABLE rather than a chain of predicates. Nine integers is nine literals, the drawing is one loop, and the geometry becomes auditable as data - which is what let the accessibility claim be measured against the shipped numbers rather than against the intent"
  - "CULL's geometry is 2,2,1,2,2 from the top, and the band index is (y*5+2)//9. The +2 is what puts the single row in the middle instead of at the bottom; one floored division replaces four comparisons"
  - "CULL's @DIM is a MULTIPLIER over a fixed divisor of 6, never a divisor of its own. A knob labelled brightness whose largest value is the darkest is a knob that reads backwards - LUMEN's correction, applied before it could be made again"
  - "CULL's key knob ships THREE values, not four. Digit 1, keypad 1 and F1 are the three contiguous five-key runs on page 0x07 that a photo application plausibly binds; a fourth would have been invented to fill a row"
  - "FORGE paints BOTH layers with the band colour and ships NO press flash. One layer caps at 49.6 % and this card's whole picture is three bands; reserving layer 1 for a flash would have halved it for feedback the application already gives"
  - "FORGE's bank corner is cell 80 exactly, so macro 26 fires from the two cells above it rather than from three. A whole zone reserved for the bank would have cost a macro; a cell costs a third of one"
  - "SWITCH's modifier values are ordered 224, 227, 226, 225 so that the plan's default index of 1 selects left GUI. Win+1..9 is the taskbar chord on Windows and the launcher chord on most Linux desktops; left shift as the default of an app switcher would have been a card that does nothing"
  - "SWITCH's press flashes the WHOLE 3x3 block rather than the glyph. The block goes solid for 280 ms and returns to its mark, which reads as `that one` from across a room in a way a brightened mark does not"
  - "KNOWN_TAGS was updated in the TASK 1 commit rather than in task 3, because copy.spec.ts test 3 gates the vocabulary in both directions. 09-06 set the same precedent"

requirements-completed: []
requirements-contributed: [CONT-02, CONT-03, TUNE-01]

# Metrics
duration: 62min
completed: 2026-09-07
---

# Phase 9 Plan 07: CULL, FORGE and SWITCH — Summary

A rating grid whose accessibility claim was measured rather than asserted, a macro pad whose modal
bank is defended against the one firmware bug that could strand it, and a switcher whose nine marks
were proved tellable apart before they shipped — plus the finding that nothing in this repository
would have noticed if they had not been.

---

## The seven-name block

| Name          | Value                        | Where it came from                                                                            |
| ------------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| `BASE_FILES`  | **73** — **frozen**          | 09-01, the clean tree Phase 7 closed at `34d0fd6`. Carried forward unchanged                    |
| `BASE_TESTS`  | **776** (+ 1 todo) — frozen  | 09-01. Carried forward unchanged                                                                |
| `PREV_FILES`  | **74**                       | measured by this plan: ` Test Files  74 passed (74)` — `PREV_FILES + 0`                         |
| `PREV_TESTS`  | **780** (+ 1 todo)           | measured by this plan: `      Tests  780 passed \| 1 todo (781)` — `PREV_TESTS + 0`             |
| `BASE_SWEEP`  | **`4 19`**                   | re-measured here, unchanged                                                                     |
| `BASE_E2E`    | **89** — **frozen**          | 09-01. **Not re-measured**; this plan adds no e2e title and the plan does not ask for a run     |
| `PREV_E2E`    | **89 (measured by 09-01)**   | copied verbatim                                                                                 |

**Observed totals as baseline plus delta.**

- quick: `PREV_FILES 74 + 0 = 74`, `PREV_TESTS 780 + 0 = 780` (+ 1 todo, reported and never
  asserted). The delta was computed rather than assumed: this wave edited four test files
  (`copy.spec.ts`, `audition.spec.ts`, `filter.spec.ts`, `sort.spec.ts`) and every edit was to a
  **constant**, never to an `it`. Three configurations moved no count either, because every catalog
  gate loops over the entries internally.
- sweep: `BASE_SWEEP 4 19 + 0 = 4 19`. The growth is paid in wall time: **543 + 57 = 600
  combinations** over **19 + 3 = 22** hand-authored entries (CULL 17, FORGE 22, SWITCH 18).
- svelte-check: `559 + 3 = 562` files, `0 errors, 0 warnings`. The three new files are the three
  entries. Provenance only — the count line is never asserted.
- e2e: **not run.**
- catalog: `28 + 3 = 31`. Lua entries `19 + 3 = 22`. `EXCLUDED_FROM_ROW` `20 + 3 = 23`.
  **`FRONT_DOOR` is byte-untouched and still eight** (D-02) — the whole diff of `front-door.ts`
  against `8561acf` is three `EXCLUDED_FROM_ROW` rows.

`PHASE_ADDED_AT` is **`2026-09-07`**, copied verbatim into `cull.ts`, `forge.ts`, `switch.ts` and
their three `LISTING` rows. Nobody used a run date.

**The HID usage table, named once for all three entries: the USB HID Usage Tables, Keyboard/Keypad
page (0x07).** Every id below was read off it rather than remembered, because a wrong usage id
presses the wrong key on somebody's machine and no gate in this repository can catch one.

---

## CULL

**The card.** Rate a photograph without leaving the keyboard. Each rating has its own colour **and**
its own shape, so it reads at a glance and it reads without colour at all.

### Route note

`kind: "lua"`, two independent reasons. **The picture:** `sends.showGrid` paints its zones in ONE
`gridColour` (`_pad.ts:331-332`) — a single colour for the whole grid, with no per-band colour and no
per-cell fill anywhere in the sheet. **The send:** there is **no keyboard in `sends`**. The vocabulary
is `none | xy | zones | faders | trackpad | dial` (`_pad.ts:185`) and the only HID kind among them is
`sends.trackpad` (`_pad.ts:334`), which is a mouse.

### Canonical Setup at the defaults, verbatim (564)

```
--[[@cb]]local M={511,511,341,170,146,257,257,16,16}local C={255,180,0,0,255,80,0,170,255,140,60,255,255,30,0}for n=0,80 do local y=n//9 if(M[y+1]>>n%9)%2>0 then local a=glag(0,n)local i=(y*5+2)//9*3 glc(a,1,C[i+1],C[i+2],C[i+3],1)glc(a,2,C[i+1]*3//6,C[i+2]*3//6,C[i+3]*3//6,1)glp(a,1,0)glp(a,2,255)end end self.touch_cb=function(s,i,e,x,y)if e~=4 and e<9 then return end local b=(y*9//128*5+2)//9 gks(0,0,2,30+4-b)for r=0,8 do if(r*5+2)//9==b then for c=0,8 do if(M[r+1]>>c)%2>0 then local a=glag(0,c+r*9)glpfs(a,1,252,256-252//28,0)glt(a,1,28)end end end end end
```

### Canonical Timer at the defaults, verbatim (0)

```

```

The empty string, the shape MORPH, SLAM, KEYS, GRIDLOCK, TABLE, CONSOLE, STRIP, LEARN, LUMEN and
SWITCH also use.

### The substitution table

| Token    | Knob id | Needle in the canonical text                          | Sites            | Default |
| -------- | ------- | ----------------------------------------------------- | ---------------- | ------- |
| `@DIM`   | `dim`   | the `3` of each `C[i+n]*3//6`                          | 3 Setup, 0 Timer | index 1 |
| `@DELAY` | `delay` | the leading `0` of `gks(0,0,2,…)`                     | 1 Setup, 0 Timer | index 0 |
| `@KEY1`  | `key`   | the `30` of `gks(…,2,30+4-b)`                         | 1 Setup, 0 Timer | index 0 |
| `@FLASH` | `flash` | both `28` — `256-252//28` and `glt(a,1,28)`           | 2 Setup, 0 Timer | index 1 |

`511, 511, 341, 170, 146, 257, 257, 16, 16` (the row masks), the fifteen palette numbers, `252` (the
starting phase), `6` (the brightness divisor) and `(y*5+2)//9` (the band index) are **literals, not
knobs**, and the header says why for each.

### Six numbers, and the corner

|                     | Setup   | Timer |
| ------------------- | ------- | ----- |
| defaults            | **564** | **0** |
| all-longest corner  | **565** | **0** |
| all-shortest corner | **564** | **0** |

**Free at the worst corner: 343 of 908.** **Combinations: 17** (`3+4+4+4 + 2`). The corner barely
moves because three of the four knobs have equal-length values throughout; the one character is
`@DELAY` going from `0` to `10`.

### The accessibility claim, measured

A scripted host run against the entry as `renderLua` produces it, reduced cell by cell to
`max(r, g, b)` and thresholded above zero, at tick 0:

```
row0 ######### 511      row3 .#.#.#.#. 170      row6 #.......# 257
row1 ######### 511      row4 .#..#..#. 146      row7 ....#....  16
row2 #.#.#.#.# 341      row5 #.......# 257      row8 ....#....  16
```

**The five band patterns, and they are five distinct patterns:**

| rating  | rows | pattern (single channel, thresholded) | as integers  | cells |
| ------- | ---- | ------------------------------------- | ------------ | ----- |
| five    | 0-1  | `#########` / `#########`             | **511, 511** | 18    |
| four    | 2-3  | `#.#.#.#.#` / `.#.#.#.#.`             | **341, 170** | 9     |
| three   | 4    | `.#..#..#.`                           | **146**      | 3     |
| two     | 5-6  | `#.......#` / `#.......#`             | **257, 257** | 4     |
| one     | 7-8  | `....#....` / `....#....`             | **16, 16**   | 2     |

**No two collided, so no fill had to be changed.** Solid, a checker, three pips, two edge pips and
one centre pip: three of the five happen to count themselves and two do not, which is why the honest
limit still says the fills are a legend rather than a label.

### The mechanism, observed rather than read

```
lit tick0 76 non-zero bytes, 36 cells
band colours rendered  five 63/44/0   four 0/63/19   three 0/42/63   two 34/14/63   one 63/7/0
tap at (64,10)  hid [{"call":"gks","args":[0,0,2,34]}]     top band flashes to 179/126/0
60 ticks later  the band is back at 63/44/0 - the decay landed on exact black
press at (64,120)  hid [..., {"call":"gks","args":[0,0,2,30]}]
errors []  pending 0
```

Key `30 + 4 = 34` is digit 5 for the top band and key `30` is digit 1 for the bottom, which is the
`@KEY1 + 4 - b` arithmetic observed rather than reasoned about.

### Every usage id, verified against the named table

| knob    | value | what it is | `+ 4` | what that is | inside 256 |
| ------- | ----- | ---------- | ----- | ------------ | ---------- |
| `@KEY1` | 30    | digit 1    | 34    | digit 5      | yes        |
| `@KEY1` | 89    | keypad 1   | 93    | keypad 5     | yes        |
| `@KEY1` | 58    | F1         | 62    | F5           | yes        |

All three runs are contiguous on page 0x07. Digit 1 is the default because 1..5 is what Lightroom,
Capture One and Photo Mechanic all bind out of the box.

### The `gks` arity check, for the exact call shipped

```
gks(@DELAY, 0,2,@KEY1+4-b)
```

**Four arguments: one leading delay plus one tuple. `(4 - 1) % 3 = 0`, so firmware accepts it.**
Observed from the host, not read from the source: `gks(0,0,2,34)` and `gks(0,0,2,30)`.

### Traps

Every division floored. Colour channels inside 0..255, and `C*@DIM//6` with `@DIM` at most 6 can
neither exceed the palette entry nor go negative. Code 9 handled, and a fast tap must rate. The bit
test is a shift and a modulo, never `& 1` — see the minifier finding below. **Every `@FLASH` value
divides 252** — see deviation 1, which is the correction this entry needed.

**The honest limit, for the card copy.** Two. **HANGAR cannot show the keystroke arriving**
(`lua-host.ts:429`), so the picture is checked by four gates and the output by none. **And the fills
are a legend you learn once**: they distinguish the five ratings, they do not name them. That is
row 25.

---

## FORGE

**The card.** Twenty-seven editor and terminal macros in three colour families, with a second bank
under a held corner.

### Route note

`kind: "lua"`, two independent reasons. **The send:** there is **no keyboard in `sends`** — the
vocabulary is `none | xy | zones | faders | trackpad | dial` (`_pad.ts:185`) and the only HID kind is
`sends.trackpad` (`_pad.ts:334`), a mouse. **The state:** there is **no modal state in `PadState` at
all**; nothing in the sheet reads a held cell as a mode, and `showGrid` paints its zones in one
`gridColour`, so neither the three families nor the bank-B hue rotation is expressible either.

### Canonical Setup at the defaults, verbatim (716)

```
--[[@cb]]local B={0,200,255,0,255,120,255,60,0}local function W(k)for n=0,80 do local y=n//9 local i=y//3*3 local d=y%3==1 and 6 or 2 local a=glag(0,n)local p=B[i+1]*d//6 local q=B[i+2]*d//6 local v=B[i+3]*d//6 if k>0 then p,q,v=q,v,p end glc(a,1,p,q,v,1)glc(a,2,p,q,v,1)glp(a,1,255)glp(a,2,255)end local a=glag(0,80)glc(a,1,200,200,200,1)glc(a,2,200,200,200,1)end W(0)self.b=0 self.w=0 self.k=-1 self.touch_cb=function(s,i,e,x,y)s.w=0 if e>=5 and e<9 then if i==s.k then s.k=-1 s.b=0 W(0)end return end local c=x*9//128 local r=y*9//128 if c==8 and r==8 then if e==4 then s.k=i s.b=1 W(1)gtt(0,4000)end return end if e~=4 and e<9 then return end local m=s.b*225 gks(10,1,1,224,1,1,m,0,2,4+r//3*9+c,1,0,m,1,0,224)end
```

### Canonical Timer at the defaults, verbatim (373)

```
--[[@cb]]local s=self if s.b>0 then if s.w>0 then s.b=0 s.k=-1 local B={0,200,255,0,255,120,255,60,0}for n=0,80 do local y=n//9 local i=y//3*3 local d=y%3==1 and 6 or 2 local a=glag(0,n)local p=B[i+1]*d//6 local q=B[i+2]*d//6 local v=B[i+3]*d//6 glc(a,1,p,q,v,1)glc(a,2,p,q,v,1)end local a=glag(0,80)glc(a,1,200,200,200,1)glc(a,2,200,200,200,1)else s.w=1 gtt(0,4000)end end
```

### The substitution table

| Token   | Knob id    | Needle in the canonical text                              | Sites            | Default |
| ------- | ---------- | --------------------------------------------------------- | ---------------- | ------- |
| `@FAMA` | `bandA`    | the first triple of `local B={…}`                         | 1 Setup, 1 Timer | index 0 |
| `@FAMB` | `bandB`    | the second triple of `local B={…}`                        | 1 Setup, 1 Timer | index 0 |
| `@FAMC` | `bandC`    | the third triple of `local B={…}`                         | 1 Setup, 1 Timer | index 0 |
| `@MOD`  | `modifier` | the fourth and sixteenth arguments of `gks`, both `224`    | 2 Setup, 0 Timer | index 0 |
| `@KEY0` | `key`      | the `4` of `gks(…,2,4+r//3*9+c,…)`                        | 1 Setup, 0 Timer | index 0 |

`225` (the bank modifier), `10` (the default delay), `4000` (the watchdog period), `200,200,200` (the
corner), `6` (the pip divisor) and `-1` (the contact sentinel) are **literals, not knobs** — the plan
declares five knobs and `catalog.spec.ts` gates the table.

### Six numbers, and the corner

|                     | Setup   | Timer   |
| ------------------- | ------- | ------- |
| defaults            | **716** | **373** |
| all-longest corner  | **722** | **377** |
| all-shortest corner | **712** | **373** |

**Free at the worst corner: 186 of 908 on Setup, 531 on Timer.** **Combinations: 22**
(`4+4+4+4+4 + 2`). The all-shortest corner is four characters under the defaults, and both are the
two sites of `@MOD` at its shortest value, `0`.

### The `gks` arity check, and one call for both banks

```
gks(10, 1,1,@MOD, 1,1,m, 0,2,@KEY0+n, 1,0,m, 1,0,@MOD)     where m = self.b * 225
```

**Sixteen arguments: one leading delay plus five tuples. `(16 - 1) % 3 = 0`.** Observed from the
host:

```
bank A press   gks(10,1,1,224,1,1,  0,0,2,15,1,0,  0,1,0,224)
bank B press   gks(10,1,1,224,1,1,225,0,2,15,1,0,225,1,0,224)
```

`m` is 0 in bank A — "no event indicated" on page 0x07 — and 225, left shift, in bank B. Two dead
tuples and sixteen bytes of a 256-byte buffer on a call that happens once per press, against a second
`gks` call site where the arity could be wrong. STAGE measured the same trade and took the same side.

Key `4 + 11 = 15` is the letter `l`, from a press at `(40, 64)`: column `40*9//128 = 2`, row
`64*9//128 = 4`, macro `4//3*9 + 2 = 11`.

### Every usage id, verified against the named table

| knob    | value | what it is    | `+ 26` | what that is           | inside 256 |
| ------- | ----- | ------------- | ------ | ---------------------- | ---------- |
| `@KEY0` | 4     | keyboard a    | 30     | digit 1                | yes        |
| `@KEY0` | 30    | digit 1       | 56     | keyboard `/`           | yes        |
| `@KEY0` | 58    | F1            | 84     | keypad `/`             | yes        |
| `@KEY0` | 104   | F13           | 130    | Locking Caps Lock      | yes        |
| `@MOD`  | 224   | left control  | —      | —                      | —          |
| `@MOD`  | 226   | left alt      | —      | —                      | —          |
| `@MOD`  | 227   | left GUI      | —      | —                      | —          |
| `@MOD`  | 0     | no event indicated | —  | —                      | —          |
| literal | 225   | left shift    | —      | bank B's second modifier | —        |

`@KEY0 = 4` is the default because a..z plus digit 1 is twenty-seven ordinary characters. The header
writes out what the other three runs pass through, because two of them cross into the navigation and
media blocks and that is a fact a binder should know before choosing.

### The two dropped-release mitigations, both shipped, both observed

`ZONA-CAPABILITIES.md` section 6 point 5: firmware's `prev_*` advances **before** the writability
check (`grid_ui_touch.c:126-142`), so a latch can end up with a permanently stuck contact — and the
HANGAR simulator deliberately cannot reproduce it. Both mitigations the section prescribes ship, and
both are marked do-not-remove in the header.

**(a) The release keys off the CONTACT ID, not the cell.** `self.k` holds the id that armed the bank
and the end branch fires on `e >= 5 and e < 9` for that id wherever the finger has slid to.

**(b) A slow Timer watchdog.** The corner's onset arms `gtt(0,4000)`; the Timer clears the bank if
two consecutive fires arrive with no touch sample between them. Every touch sample sets `self.w` to
zero, including samples from other contacts, so pressing macros keeps a genuine hold alive.

**Observed in a scripted host run against the shipped entry, not read from the source:**

```
tick 0                                     litBytes 163, animating false, timerArmed false
bank A press                               gks(10,1,1,224,1,1,0,0,2,15,1,0,0,1,0,224)
corner held at (127,127)                   timerArmed true, the pad rotates to 200,255,0 / 255,0,120 / 0,84,39
bank B press                               gks(10,1,1,224,1,1,225,0,2,15,1,0,225,1,0,224)
LIFT AT (10,10) - away from the corner     next press carries m = 0, so the bank returned to A
DOWNUP on the corner                       next press carries m = 0, so the tap did not latch
watchdog, corner held, no further samples  timerArmed true at 4 s, FALSE at 8 s, bank back at A
errors []  pending 0
```

**The code-9 case was observed rather than reasoned about**, which is what the plan asked for: a
`touchTap` on the corner was followed by an ordinary macro press, and the press still carried
`m = 0`. The corner branch arms on `e == 4` only and returns for everything else, so a DOWNUP on a
key whose whole meaning is a hold does nothing at all.

### The watchdog is armed by the corner, and that is what keeps FORGE static

**This is the one place this wave could have shipped an aspirational declaration and did not.** The
plan expects FORGE to classify `static` even though its Timer is not `""`; 09-06 established that
`lua-pad-sim.ts:150-152` returns `host.animating || host.timerArmed`, so any entry with a Timer
**armed in Setup** classifies `animated` whatever its pad is doing. Both are true at once only
because the Timer is a **one-shot** (`lua-host.ts:604-618`): a fire consumes the deadline and only
the body's own `gtt` re-arms it. Setup never calls `gtt`; the corner's onset does; the body re-arms
only while `self.b` is 1. With no hand on the pad nothing is armed, `timerArmed` is false, and the
fixture agrees: `animating: false` at all five sampled ticks. The watchdog exists, the Timer is not
empty, and the declared motion is a fact.

### The picture, observed

```
lit tick0 163 non-zero bytes, all 81 cells
rows 0-2  0/65/84  0/198/253  0/65/84        build, @FAMA, the middle row bright
rows 3-5  0/84/39  0/253/119  0/84/39        test, @FAMB
rows 6-8  84/19/0  253/59/0   84/19/0        source, @FAMC
cell 80   198/198/198                        the bank corner
bank B    200,255,0 / 255,0,120 / 0,84,39    the channels rotated r,g,b -> g,b,r
```

Nine bright pips per band on a dim field of the same colour, which is what makes twenty-seven targets
countable on a pad with no labels.

### Traps

The dropped-release bug and both mitigations, above. `@KEY0 + 26 < 256` at every value, above. The
`gks` arity rule for the sixteen-argument call. Repaint gating: `W(k)` is called on the corner's
onset, on its release and by the watchdog, and never on a press. Every division floored — including
the folded outer division, `floor(floor(9t/128)/3) = floor(3t/128)`. Colour channels inside 0..255 by
construction, and `channel*d//6` with `d` at most 6 can neither exceed the channel nor go negative.
**No decay and no keeper anywhere**: the stored Setup and Timer hold no `glf`, no `glpfs` and no
65535, measured over the two event strings rather than over the file.

**The honest limit, for the card copy.** Two. **HANGAR cannot show the keystroke arriving.** And **a
macro pad is only as good as what you bind to it** — the card names the family and never the command,
because it cannot know yours. That is row 26.

---

## SWITCH

**The card.** Nine apps in nine blocks, each with its own mark, so you find one without reading
anything.

### Route note, with the keyboard half first

`kind: "lua"`, **and the send is the first reason**, as the plan review's flag F4 asked. There is
**no keyboard in `sends`**: the vocabulary is `none | xy | zones | faders | trackpad | dial`
(`_pad.ts:185`) and the only HID kind among them is **`sends.trackpad`** (`_pad.ts:334`), which is a
mouse — a relative pointer and a button bitmask, with no usage id anywhere in it. A configuration
whose whole output is keystrokes is outside `PadState` before the picture is even considered.
**Second, and still decisive:** nine distinct 3x3 glyphs are eighty-one individually chosen cells and
`showGrid` paints its zones in one `gridColour` (`_pad.ts:331-332`). As zones plus `showGrid` this
card would be `ninepads` with a different send, and overlap is a rejection reason in this repository —
the glyphs are what make it a different card at all.

### Canonical Setup at the defaults, verbatim (487)

```
--[[@cb]]local G={511,341,186,273,457,56,151,42,16}for z=0,8 do local r=z//3*27+z%3*3 local g=G[z+1]for k=0,8 do local a=glag(0,r+k%3+k//3*9)glc(a,1,255,240,120,1)glp(a,1,0)if(g>>k)%2>0 then glc(a,2,255,240,120,1)else glc(a,2,30,30,40,1)end glp(a,2,255)end end self.touch_cb=function(s,i,e,x,y)if e~=4 and e<9 then return end local z=x*3//128+y*3//128*3 local r=z//3*27+z%3*3 for k=0,8 do local a=glag(0,r+k%3+k//3*9)glpfs(a,1,252,247,0)glt(a,1,28)end gks(10,1,1,227,0,2,30+z,1,0,227)end
```

### Canonical Timer at the defaults, verbatim (0)

```

```

### The substitution table

| Token   | Knob id    | Needle in the canonical text                             | Sites            | Default |
| ------- | ---------- | -------------------------------------------------------- | ---------------- | ------- |
| `@ONC`  | `on`       | `255,240,120` in the layer-1 `glc` and the lit-branch one | 2 Setup, 0 Timer | index 0 |
| `@OFFC` | `off`      | `30,30,40` in the unlit branch                            | 1 Setup, 0 Timer | index 0 |
| `@MOD`  | `modifier` | the fourth and tenth arguments of `gks`, both `227`       | 2 Setup, 0 Timer | index 1 |
| `@KEY1` | `key`      | the `30` of `gks(…,2,30+z,…)`                            | 1 Setup, 0 Timer | index 0 |

The nine glyph integers, `10` (the default delay) and the pair `252 / 247 / 28` (the decay) are
**literals, not knobs**.

### Six numbers, and the corner

|                     | Setup   | Timer |
| ------------------- | ------- | ----- |
| defaults            | **487** | **0** |
| all-longest corner  | **488** | **0** |
| all-shortest corner | **483** | **0** |

**Free at the worst corner: 420 of 908.** **Combinations: 18** (`4+4+4+4 + 2`). SWITCH is the
cheapest entry of the wave and one of the cheapest in the catalog.

### The nine glyphs, as binary, with the pairwise minimum

Checked as data with a one-off script before the entry was written:

| z   | integer | binary        | rows            | shape           |
| --- | ------- | ------------- | --------------- | --------------- |
| 0   | **511** | `111111111`   | `###/###/###`   | a full square   |
| 1   | **341** | `101010101`   | `#.#/.#./#.#`   | an X            |
| 2   | **186** | `010111010`   | `.#./###/.#.`   | a cross         |
| 3   | **273** | `100010001`   | `#../.#./..#`   | a diagonal      |
| 4   | **457** | `111001001`   | `#../#../###`   | a corner        |
| 5   | **56**  | `000111000`   | `.../###/...`   | a bar           |
| 6   | **151** | `010010111`   | `###/.#./.#.`   | a T             |
| 7   | **42**  | `000101010`   | `.#./#.#/...`   | a chevron       |
| 8   | **16**  | `000010000`   | `.../.#./...`   | a centre dot    |

**Nine distinct integers**, and the **minimum pairwise difference over all thirty-six pairs is TWO
lit cells** — the X against the diagonal, which differ in the two cells of the leading corner pair.
No two marks are one cell apart, so a single dead LED cannot turn one glyph into another. The full
distance matrix ran 2 to 8.

Bit `k` is row `k//3`, column `k%3`, reading top-left first, and the rendered frame confirms it block
for block:

```
row0  ### #.# .#.        row3  #.. #.. ...        row6  ### .#. ...
row1  ### .#. ###        row4  .#. #.. ###        row7  .#. #.# .#.
row2  ### #.# .#.        row5  ..# ### ...        row8  .#. ... ...
```

### The `gks` arity check, and every usage id

```
gks(10, 1,1,@MOD, 0,2,@KEY1+z, 1,0,@MOD)
```

**Ten arguments: one leading delay plus three tuples. `(10 - 1) % 3 = 0`.** Observed: a tap at the
centre recorded `gks(10,1,1,227,0,2,34,1,0,227)` — key `30 + 4 = 34`, digit 5, block 4.

| knob    | value | what it is   | `+ 8` | what that is | inside 256 |
| ------- | ----- | ------------ | ----- | ------------ | ---------- |
| `@KEY1` | 30    | digit 1      | 38    | digit 9      | yes        |
| `@KEY1` | 89    | keypad 1     | 97    | keypad 9     | yes        |
| `@KEY1` | 58    | F1           | 66    | F9           | yes        |
| `@KEY1` | 104   | F13          | 112   | F21          | yes        |
| `@MOD`  | 224   | left control | —     | —            | —          |
| `@MOD`  | 227   | left GUI     | —     | —            | —          |
| `@MOD`  | 226   | left alt     | —     | —            | —          |
| `@MOD`  | 225   | left shift   | —     | —            | —          |

### The picture, observed, and one rank claim made over the whole fixture

```
lit tick0 243 of 243 non-zero bytes, all 81 cells
mark cell   126/119/59        field cell   14/14/19        a nine to one ratio
tap on block 4   the whole 3x3 block goes to 242/228/114 and returns to its mark in 28 ticks
errors []  pending 0
```

**SWITCH is the most lit card in the catalog** — 243 of 243 non-zero bytes at all five sampled ticks,
the arithmetic maximum. Checked over `Object.entries(frames.json)` rather than over remembered
neighbours, following 09-06's correction: the ported `starfield` holds 222 to 226 and `chorus` a flat
198.

**One consequence, recorded because it is easy to misread.** The single-channel reduction that gave
CULL its five band patterns shows **511 on every row of SWITCH**: the field colour is dim but it is
not zero, so a lit-or-unlit threshold sees a full pad. The glyphs read by **contrast**, not by
presence, and the row-27 bench check is written accordingly.

### Traps

The bit test is a shift and a modulo. **Precedence: `%` binds tighter than `>>`**, so the parentheses
are load-bearing — `g>>k%2` is `g >> (k%2)`, a different number, silently. The decay length divides
252: rate 247 is `256 - 252//28` and the phase steps by 9 to exactly 0 in exactly 28 ticks. No keeper
on the decaying layer. `@KEY1 + 8 < 256`. Code 9 handled. Every division floored. Colour channels
inside 0..255 by construction.

**The honest limit, for the card copy.** Two. **HANGAR cannot show the keystroke arriving.** And
**nine glyphs are a mnemonic, not labels** — the pad makes the nine blocks tellable apart; which app
is behind which mark is a decision you make and remember. That is row 27.

---

## Whether `>>` and `&` survive `compressScript` — measured first, as the plan asked

The plan told this wave to measure the shift **before writing the rest of the entry**, because a
shift is not a construct any of the nineteen entries before it used. It was, and the answer decided
the shape of two of the three entries.

| probe (input)      | compressScript output | fixed point | note                                                 |
| ------------------ | --------------------- | ----------- | ---------------------------------------------------- |
| `(7>>2)&1`         | `(7>>2)& 1`           | **no**      | the minifier inserts a space **after** the `&`        |
| `(7>>2)& 1`        | `(7>>2)& 1`           | yes         | the compressed form is itself canonical               |
| `7>>2&1`           | `7>>2 & 1`            | **no**      | spaced on **both** sides without the parentheses      |
| `7//4%2`           | `7//4%2`              | yes         | the divide-and-modulo form, unchanged                 |
| `7>>2%2`           | `7>>2%2`              | **yes**     | `>>` is returned byte for byte                        |
| `g[z]//2^k%2`      | `g[z]//2 ^ k%2`       | **no**      | `^` is respaced too — and returns a FLOAT in Lua 5.4  |
| a full nine-cell loop with `>>` | unchanged | yes         | the shift survives in a real drawing loop             |

**`>>` survives unchanged. `&` does not, and `^` does not.** No substitution was needed for the
shift itself; the substitution was for the **mask**, and it cost nothing: `(g>>k)%2` is the same
length as `(g>>k)&1` plus zero, and it is a fixed point. The `& 1` form could have been stored
verbatim at a cost of one character per site, and the `//2^k` form is disqualified twice over —
respaced and a float, and a fraction passed to a firmware call silently becomes 0. Both bit-masked
entries in this wave therefore ship `(mask >> bit) % 2`, and both headers say why so nobody tidies it
back.

---

## The deviations

### Auto-fixed issues

**1. [Rule 1 — bug] CULL's flash lengths did not divide 252, so two of four values froze the band part lit**

- **Found during:** Task 9-07-01, choosing the decay idiom against 09-04's rule before writing it.
- **Issue:** The plan's knob table specifies `@FLASH` values `"12"`, `"24"`, `"42"`, `"64"`. The
  self-erasing flash idiom is `glpfs(a,1,252,256-252//@FLASH,0)` plus `glt(a,1,@FLASH)`, so the phase
  step is `252//length` and the product only lands on exactly 0 when the length **divides 252**. 24
  and 64 do not: the timeout expires part-way down, firmware zeroes the rate and **the cell freezes
  part lit**, forever, on half the settings. This is not a new failure — `steps.ts:41-55` records
  09-04 measuring it on this exact idiom at phases 183, 111 and 127 for lengths of 12, 24 and 64, and
  says in as many words that *"the trail values are 12, 28, 42 and 63 rather than a rounder looking
  12, 24, 42, 64"*. The plan reproduced the rounder-looking four.
- **Fix:** `"12"`, `"28"`, `"42"`, `"63"`, default index 1 as the plan asks. Steps of 21, 9, 6 and 4
  against a starting phase of 252, so every setting lands on exact black. Observed: the flashed band
  went to 179/126/0 and was back at its resting 63/44/0 sixty ticks later.
- **Files modified:** `src/lib/catalog/entries/cull.ts`.
- **Commit:** `c9ec8c9`.

**2. [Rule 1 — bug] FORGE's bank-B keycode shift lands on the LANG and system usage ids**

- **Found during:** Task 9-07-02, checking `@KEY0 + 26 + @BANK` against the usage table at every knob
  value before choosing `@BANK`.
- **Issue:** The plan's mechanism says *"bank B shifts every keycode by `@BANK`"*, with `@BANK` a
  literal. There is no safe literal. At `@KEY0 = 104` the twenty-seven bank-A macros already top at
  **130**, so any positive offset puts bank B at 131 and above — LANG1..LANG9, the international keys,
  Clear/Again and CrSel/Props — which do nothing on most machines and something unexpected on the
  rest. A negative offset collides with bank A at the low bases. One literal has to serve all four
  values of `@KEY0` and none does.
- **Fix:** **bank B adds left shift as a second modifier and sends the same keycode.** `m` is
  `self.b * 225`, so one sixteen-argument `gks` serves both banks with no branch and no second call
  site; in bank A the two extra tuples carry usage id 0, "no event indicated", which is STAGE's
  measured dead-tuple trade. Ctrl+A against Ctrl+Shift+A is the chord every editor already
  understands, and it cannot land on an id nobody chose. **`@MOD`'s value list changes with it:** 224,
  226, 227 and 0, with **225 deliberately absent**, because left shift as the base modifier would make
  the two banks send the same chord. Observed: `gks(…,1,1,0,…)` in bank A and `gks(…,1,1,225,…)` in
  bank B.
- **Files modified:** `src/lib/catalog/entries/forge.ts`.
- **Commit:** `0b32565`.

**3. [Rule 1 — bug] FORGE's watchdog Timer, armed where a Timer is normally armed, would have made the entry declare a motion its pad does not have**

- **Found during:** Task 9-07-02, applying 09-06's declaration rule to a card the plan predicts will
  be `static` while carrying a non-empty Timer.
- **Issue:** Every other Timer in this catalog is armed by a `gtt` at the end of Setup. Written that
  way, FORGE's watchdog would arm at tick 0 and re-arm forever, `host.timerArmed` would be true at
  every sampled tick, and `lua-pad-sim.ts:150-152` would report `animating` on a pad where **nothing
  moves**. The plan's own expectation (`static`) and the plan's own requirement (the Timer is not
  `""`) would have been in direct contradiction, and 09-06's rule says the pad is changed rather than
  the declaration — but there is nothing on a macro pad that ought to move.
- **Fix:** the third option, which is better than either. **Setup never calls `gtt`.** The corner's
  onset arms `gtt(0,4000)`, and the Timer body re-arms only while `self.b` is 1. The Timer is a
  one-shot (`lua-host.ts:604-618`), so once the bank is released nothing re-arms and `timerArmed`
  returns to false. A watchdog that only runs while there is something to watch: the mitigation is
  real, the Timer is not empty, and the fixture reports `animating: false` at all five ticks. It also
  costs the module nothing at rest.
- **Files modified:** `src/lib/catalog/entries/forge.ts`.
- **Commit:** `0b32565`.

### Decisions taken inside the plan's own latitude

- **CULL's geometry is written out and it is 2,2,1,2,2 from the top**, band index `(y*5+2)//9`. The
  plan offered that split or five equal bands with a reject column and asked for the one that makes
  the fills legible; a single-row band cannot carry a two-row fill, and putting it in the middle is
  what makes one floored division replace four comparisons.
- **CULL's fills are a nine-entry row-mask table**, not a chain of predicates computed per cell. Same
  five fills, one loop, and the geometry becomes data the SUMMARY can quote and a script can check.
- **CULL's `@DIM` is a multiplier over a fixed divisor of 6.** The plan's values are unchanged; a
  divisor would have made "Legend brightness" darkest at its largest value.
- **CULL's `key` knob ships three values.** The plan's table lists three and `catalog.spec.ts` asks
  for at least two.
- **FORGE paints both layers and ships no press flash.** The plan says layer 2 dim and layer 1 off;
  one layer caps at 49.6 % and this card's whole picture is three bands, so both layers carry the
  colour and there is nothing left for a flash — which the touch-budget rule did not want per press
  anyway.
- **FORGE's bank corner is cell 80 exactly, as the plan says**, so macro 26 fires from the two cells
  above it. Reserving the whole zone would have cost a macro.
- **SWITCH's modifier values are ordered 224, 227, 226, 225** so the plan's default index of 1 selects
  left GUI. The four ids are the plan's four; the display order is chosen so the shipped default is
  the chord the card is built around.
- **SWITCH's press flashes the whole block**, not the mark.

### Scope notes, recorded because a later reader will wonder

- **`RECORDED.singletons` is a TAG count, not an entry count**, and this wave is where that stops
  being invisible. It counts tags carried by exactly one entry. At twenty-five entries it was 25 and
  at twenty-eight it was 28 — both coincidences, because 51 tags minus 23 chips is 28. At thirty-one
  entries it is **29**, and `filter.spec.ts` test 5 said so by name: *"the recorded singletons stay
  searchable text: expected [ … ] to have a length of 31 but got 29"*. The gate caught it on the first
  run.
- **`KNOWN_TAGS` was updated in the task 1 commit**, not task 3, because `copy.spec.ts` test 3 gates
  the vocabulary in both directions — a tag carried and not declared is red, and a tag declared and
  not carried is red too. 09-03 and 09-06 set the same precedent.
- **All three entries send no MIDI at all**, which makes five such entries in the catalog after
  STAGE and SHUTTLE. The `SMOKE_REPORT` lines below are where it is visible.
- **FORGE's Timer redeclares its own palette and its own repaint** rather than calling Setup's `W`.
  `W` is a local of the Setup chunk and the Timer is a separate chunk; hanging the painter off `self`
  and calling `self.W(0)` would be a field call the host-surface classifier refuses, and 09-01's rule
  is that the entry is wrong, not the gate. The Timer's copy writes colours only, because the phases
  were set in Setup and nothing on this card ever changes them.

---

## The fixture, and every declaration it agreed with

`UPDATE_FRAMES=1` was run once for all three entries, then **again**, and the second file is
**byte-identical** (`diff -q` silent). The fixture covers **31** entries at `0,37,101,500,1009`.

| Entry    | `restsBlack` | non-zero bytes            | `motion` declared in tasks 1-2 | fixture says                    | outcome     |
| -------- | ------------ | ------------------------- | ------------------------------ | ------------------------------- | ----------- |
| `cull`   | false        | **76** at all five ticks  | `static`                       | `animating: false` at all five  | **agrees**  |
| `forge`  | false        | **163** at all five ticks | `static`                       | `animating: false` at all five  | **agrees**  |
| `switch` | false        | **243** at all five ticks | `static`                       | `animating: false` at all five  | **agrees**  |

**No `motion` correction was needed in this wave**, and the reason FORGE did not need one is
deviation 3 rather than luck: the declaration was reconciled against the derivation while the entry
was being written, not after the fixture disagreed.

**The three quiet lines, verbatim, written with the entries in tasks 1 and 2 as the plan asked, each
beside its declared motion:**

> **CULL** — `motion: "static"` — The five bands are a legend, not an animation; only the band you
> press flashes. (78 characters)
>
> **FORGE** — `motion: "static"` — The three colour bands sit still; the pad only changes when you
> hold the corner. (79 characters)
>
> **SWITCH** — `motion: "static"` — The nine marks are painted once and stay; the block you press is
> the only thing that moves. (90 characters)

One line each, second person, present tense, no exclamation mark, no emoji, no ASCII apostrophe
between letters, no hyphen doing a dash's job, no ellipsis, and none of them `RESTS_DARK_NOTE` —
which belongs only to a `restsBlack: true` entry, and none of this wave's three is one.
`listing.spec.ts` reports **5 passed** and `copy.spec.ts` counts all three by the same rules it counts
a description by.

The three descriptions are 92, 86 and 91 characters against the 110 cap.

**The catalog's motion census is now 14 animated, 14 static and 3 dark.** This wave is where the
still half draws level, which is the contrast Phase 8's own retrospective asked for — *"a wall of
twenty animated cards would need its own quiet ones"*.

---

## The chip row, before and after — one chip, and a new head of the row

|              | Old (twenty-eight entries) | New (thirty-one entries) |
| ------------ | -------------------------- | ------------------------ |
| `entries`    | 28                         | **31**                   |
| `tags`       | 51                         | **53**                   |
| `singletons` | 28                         | **29**                   |
| chips        | 23                         | **24**                   |
| `featured`   | 12                         | **13**                   |

```
old  playable (8) · readable (8) · expressive (5) · gestural (5) · drums (4) · hypnotic (4)
     · xy-control (4) · colour (3) · generative (3) · hands-free (3) · precise (3) · utility (3)
     · ambient (2) · blooming (2) · grid (2) · harmonic (2) · hotkeys (2) · latching (2)
     · mixing (2) · modulation (2) · rails (2) · rippling (2) · sequencer (2)

new  readable (10) · playable (8) · utility (6) · expressive (5) · gestural (5) · drums (4)
     · hotkeys (4) · hypnotic (4) · precise (4) · xy-control (4) · colour (3) · generative (3)
     · grid (3) · hands-free (3) · ambient (2) · blooming (2) · harmonic (2) · latching (2)
     · macros (2) · mixing (2) · modulation (2) · rails (2) · rippling (2) · sequencer (2)
```

**`macros` is the one new chip**, and it arrives because FORGE gives CONSOLE's tag a second carrier.
**`readable` takes the head of the row at ten**, having overtaken `playable` — all three of this
wave's entries are cards you read rather than play, which is what a desktop wave looks like in a tag
census. `utility` went from 3 to 6, `hotkeys` from 2 to 4, `precise` from 3 to 4 and `grid` from 2 to 3. `photo` and `accessible` each arrive as singletons; `accessible` stays one until
QUADRANT takes it in wave 9.

**The two tags added to `KNOWN_TAGS`, 51 -> 53:** `photo`, `accessible`. Confirmed by
`copy.spec.ts` test 3, which asserts `KNOWN_TAGS.length === carried.size` and names any tag declared
and not carried, rather than by reading the array.

**New `RECORDED` values.** `filter.spec.ts`: `entries: 31, tags: 53, singletons: 29`, the twenty-four
chips above and
`chipCounts: [10, 8, 6, 5, 5, 4, 4, 4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]`.
`sort.spec.ts`: `{ entries: 31, featured: 13 }` — SWITCH is this wave's one featured entry. Both
files still report **6 passed**.

### The document that quotes the row

`.planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md`, **"The tag chips"**. Nothing in the
repository goes red when it drifts, which is exactly why it is checked.

**Old lines, verbatim:**

> catalog grows. **Re-recorded at twenty-eight entries by 09-06** (it was nine chips at sixteen
> entries when Phase 5.1 wrote this section, fourteen at nineteen after 09-03, sixteen at twenty-two
> after 09-04 and twenty-two at twenty-five after 09-05; every entry wave of Phase 9 re-takes it, and
> 09-10 confirms the final row at thirty-six entries). Today that is twenty-three:
>
> > `playable` (8) · `readable` (8) · `expressive` (5) · `gestural` (5) · `drums` (4) · `hypnotic` (4)
> > · `xy-control` (4) · `colour` (3) · `generative` (3) · `hands-free` (3) · `precise` (3)
> > · `utility` (3) · `ambient` (2) · `blooming` (2) · `grid` (2) · `harmonic` (2) · `hotkeys` (2)
> > · `latching` (2) · `mixing` (2) · `modulation` (2) · `rails` (2) · `rippling` (2) · `sequencer` (2)

**New lines, verbatim:**

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

The paragraph beneath it moved from *"remaining 28"* to **29** and from *"fifty-one 44px chips above
twenty-eight live pads"* to **fifty-three** and **thirty-one**. The ASCII mock at the top of the same
document was re-taken too: its tag block became six lines in the new order and its count line went
from `28 of 28 configurations.` to `31 of 31 configurations.`

---

## The three audition rows, verbatim, and the new `ROW_COUNT`

`ROW_COUNT` in `src/lib/catalog/audition.spec.ts` is **27**, and the test title reads *"keeps
twenty-seven numbered rows"*. `docs/HARDWARE-AUDITION.md` has twenty-seven numbered rows, contiguous
from 1.

| #   | Config     | What to check                                                                                                                                                                                                                                                                          | Why it cannot be simulated                                                                                                                                                                                                                                                                                                                                          |
| --- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 25  | **CULL**   | Look at the pad through a colour-blindness simulator, or squint until the five colours merge into one. Are the five ratings still tellable apart, and can you name which band is which without checking?                                                                                | The claim is about perception under a condition no frame hash models. A physical diffuser blurs a one-cell fill in a way a pixel grid does not, and whether a checker and a three-pip row survive that blur is the whole accessibility claim this card makes.                                                                                                        |
| 26  | **FORGE**  | Hold the bottom-right corner, run three macros, release. Then hold it and lift with a fast flick a dozen times, and once slide off the corner before lifting. **Does the bank ever stay stuck in B?** Then hold it still for fifteen seconds and confirm the watchdog drops it back to A. | **The dropped-release bug.** Firmware advances `prev_*` before the writability check (`grid_ui_touch.c:126-142`) and `pad-sim.ts` states it only runs the watchdog semantics and cannot manufacture the stuck contact, so a stranded bank is invisible in a browser. The watchdog that answers it is a mitigation nobody has watched fire on hardware.               |
| 27  | **SWITCH** | Stand two metres back. Can you name which block is which without reading a label, and does the pressed block read as a solid flash rather than as a brighter mark?                                                                                                                      | Whether nine three-cell marks are distinguishable at a distance through a diffuser is exactly the kind of judgement a frame comparison cannot make, and the field colour that separates them is nine times dimmer than the marks with no gamma correction anywhere in the path.                                                                                      |

**Row 26 is the second D-11-shaped row of this phase**, after HOLD's row 13 and CONSOLE's row 19, and
its reason names both the bug and the watchdog as the plan required.

### The cost table, now twenty-two

`## The nineteen, and what they cost` became `## The twenty-two, and what they cost`:

| id       | name   | Setup | Timer            | knobs | dark at rest |
| -------- | ------ | ----- | ---------------- | ----- | ------------ |
| `cull`   | CULL   | 564   | 0 — **no Timer** | 4     | no           |
| `forge`  | FORGE  | 716   | 373              | 5     | no           |
| `switch` | SWITCH | 487   | 0 — **no Timer** | 4     | no           |

**The Setup-only note is now eleven names rather than nine**, with CULL's and SWITCH's reason written
out: both paint a legend once and then have only a per-press decay, which firmware runs down to exact
black on its own. The document's prose counts moved with its rows: *"Twenty-seven rows"* twice,
*"twenty-seven lines"*, and *"twenty-two Setup files and eleven Timer files"*. Item 4 of **Before you start** and the
paragraph under the cost table BOTH carry the Setup-only list, and both moved from nine names to
eleven; the first is the one `audition.spec.ts` matches with `/MORPH[^.]{0,200}Setup only/`, and the
match is now **96 characters**, still inside one sentence with no full stop in it.

### `AUDITION_DUMP=1`, the three new entries

```
  cull: setup 564/908, no Timer
  forge: setup 716/908, timer 373/908
  switch: setup 487/908, no Timer
```

Every printed count matches the recorded numbers above, and every one of the nineteen earlier lines
reproduced 09-06's numbers exactly. `.tmp-audition/` held **twenty-two** `.setup.lua` files and
**eleven** `.timer.lua` files, which is what the document now says, and the directory was removed by
hand afterwards.

---

## `SMOKE_REPORT=1`, the three new entries

```
stage:  0 MIDI, 2 HID, first three MIDI
shuttle: 0 MIDI, 2 HID, first three MIDI
cull:   0 MIDI, 2 HID, first three MIDI
forge:  0 MIDI, 2 HID, first three MIDI
switch: 0 MIDI, 2 HID, first three MIDI
```

**A non-zero HID count for all three and a zero MIDI count for all three**, which is the acceptance
criterion word for word — and the trailing blank after `first three MIDI` is the visible form of it.
Five of the catalog's twenty-two hand-authored entries now send no MIDI at all, and
`lua-smoke.spec.ts` test 2's HID non-vacuity half — landed by 09-06 — rests on five entries rather
than two.

---

## Deferred item 3, verbatim

Appended to `.planning/phases/09-twenty-configurations/deferred-items.md` beneath items 1 and 2,
neither of which was touched:

> ## 3. Nothing in the repository checks that a per-cell picture is distinguishable from itself (recorded by 09-07)
>
> CULL's five fill patterns and SWITCH's nine glyphs are both claims about DISTINCTNESS: five bands
> you can tell apart with the colour taken away, nine marks you can tell apart at three cells across.
> Both were measured by hand before shipping, and 09-07 then checked what the repository would say if
> they were wrong. Two of SWITCH's nine glyphs were made identical and the whole quick suite was run:
> only `frames.spec.ts` test 3 went red, and it went red on the frame HASH — a change detector that
> fires for any pixel change and says nothing about distinctness. With the fixture re-taken over the
> perturbed entry the suite was **74 files, 780 passed**, shipping a card whose card copy promises
> nine different marks and whose pad has eight. What would close this: a spec that extracts each
> entry's declared per-cell picture — the row masks, the glyph table — and asserts the intended sets
> are pairwise distinct, or, more generally, a `frames.spec.ts` test that reduces a declared-distinct
> entry's tick-0 frame to one channel per cell and asserts the named regions differ. It is a small
> spec and QUADRANT in wave 9 makes the same kind of accessibility claim, so it has at least three
> carriers already.

**Yes, a glyph-distinctness gate is worth a deferred item, and the negative check is the argument for
it.** The measurement this plan made is exactly as strong as the person making it, and the next wave
that makes a distinctness claim will make it against nothing.

---

## The two negative checks

Everything this wave created was committed **before** anything was perturbed, so no restore passed
vacuously. Each perturbation was restored with `git checkout --` and `git diff --quiet` exited **0**
afterwards.

| #   | Perturbation                                                                       | Observed                                                                                                                                                                    | What it proves                                                                                                                        |
| --- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1a  | SWITCH's glyph 1 changed from 341 to 511, making it identical to glyph 0            | `frames.spec.ts` test 3 red: `switch at tick 0: frame hash changed: expected '99819035…' to be 'edd4bc4c…'`. **`Tests 1 failed \| 779 passed \| 1 todo (781)`** — one test    | The **only** thing that noticed is the fixture hash, and it noticed a PIXEL CHANGE. Nothing checked the glyphs                          |
| 1b  | the same perturbation, with `frames.json` regenerated over it                       | **`Test Files 74 passed (74)`, `Tests 780 passed \| 1 todo (781)`** — the whole quick suite green                                                                             | **The deliberately green one.** A card promising nine marks and drawing eight passes every gate in this repository. Deferred item 3     |
| 2   | one hex digit of FORGE's tick-0 hash in `frames.json`, `8187f39…` -> `a187f39…`     | `frames.spec.ts` test 3 red, naming the entry and the tick: `forge at tick 0: frame hash changed`                                                                             | The fixture is load-bearing and its failure message names what moved                                                                    |

After each restore `frames.spec.ts` reported **5 passed** and `git status --short` printed nothing.

---

## Three wall times and one byte size, before and after

Taken on the same machine in the same session. **No plant was needed and none was made:** the
"before" column was measured against the working tree at `8561acf`, which is 09-06's closing commit,
before a line of this wave was written. The cross-check that it was the right tree is `static/og/` at
**166,412 bytes over 28 PNGs**, which reproduces 09-06's closing numbers exactly.

| Measurement                     | Before (28 entries, 19 Lua)                     | After (31 entries, 22 Lua)                      |
| ------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| `lua-entries.sweep.spec.ts` alone | **2.71 s** tests / 3.32 s reported / 6.44 s wall | **3.02 s** tests / 3.62 s reported / 6.73 s wall |
| `npm run build`                 | **10.917 s**                                    | **11.715 s**                                    |
| `static/og/`                    | **166,412 bytes**, 28 PNGs                      | **184,651 bytes**, 31 PNGs                      |

The sweep grew from 543 combinations to **600** — 1,086 measured events to 1,200 — for 0.31 s of test
time. The build is 0.80 s slower, three OG images of which are new.

The three new OG images, from the build's own log:

```
gen-og: cull         5915 bytes   36 of 81 cells lit
gen-og: forge        5878 bytes   81 of 81 cells lit
gen-og: switch       6446 bytes   81 of 81 cells lit
```

**FORGE and SWITCH both light all eighty-one cells**, which until this wave only LUMEN did. LUMEN is
still the largest OG image the phase has produced at 6,835 bytes and SWITCH is second at 6,446,
because a field of two colours compresses better than a field of eighty-one distinct ones. CULL lights
36 of 81, which is its thirty-six-cell legend exactly. `build/og/` holds 31.

---

## Verification

| Gate                                                    | Result                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `catalog.spec.ts`                                       | **10 passed**                                                                   |
| `frames.spec.ts`                                        | **5 passed**                                                                    |
| `front-door.spec.ts`                                    | **8 passed**                                                                    |
| `listing.spec.ts`                                       | **5 passed**                                                                    |
| `audition.spec.ts`                                      | **4 passed**                                                                    |
| `copy.spec.ts`                                          | **5 passed**                                                                    |
| `host-surface.spec.ts`                                  | **4 passed**                                                                    |
| `catalog + host-surface + copy`                         | **3 files, 19 passed**                                                          |
| `frames + listing + front-door + audition`              | **4 files, 22 passed**                                                          |
| `lua-entries.sweep.spec.ts`                             | **6 passed**, twenty-two entries, 600 combinations                              |
| `lua-smoke.spec.ts`                                     | **3 passed**, both non-vacuity halves asserted                                  |
| `filter.spec.ts` / `sort.spec.ts`                       | **6 passed each**                                                               |
| `vendored-diff.spec.ts`                                 | **14 passed**                                                                   |
| `npm run test:quick \| check-counts 74 780`             | **74 files / 780 passed + 1 todo** — `PREV + 0 / PREV + 0`                       |
| `npm run test:sweep \| check-counts 4 19`               | **`4 19`**                                                                      |
| `npm run build`                                         | exit 0, 31 PNGs in `static/og/` and 31 in `build/og/`                           |
| `npm run test:quick` again, after the build             | **74 / 780 + 1 todo**                                                           |
| `npm run check 2>&1 \| grep -Ei "error\|warning"`       | `562 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`                           |
| `npm run lint`                                          | exit 0                                                                          |
| `git diff --stat HEAD -- src/vendor/`                   | prints nothing                                                                  |
| `FRONT_DOOR`                                            | byte-untouched and still **eight**; `EXCLUDED_FROM_ROW` now **twenty-three**    |
| `frames.json` shape                                     | `Object.keys(j.entries).length` **31**, `j.ticks.join()` **`0,37,101,500,1009`** |
| Two consecutive `UPDATE_FRAMES=1` runs                  | byte-identical                                                                  |
| Both negative checks                                    | observed with the outcomes above and restored byte-identical                    |
| CULL's `@KEY1` values against `@KEY1 + 4 < 256`         | tops 34, 93, 62 — all under 256                                                 |
| CULL's `@FLASH` values against "divides 252"            | 12, 28, 42, 63 — steps 21, 9, 6, 4, every product exactly 252                   |
| FORGE's `@KEY0` values against `@KEY0 + 26 < 256`       | tops 30, 56, 84, 130 — all under 256                                            |
| SWITCH's `@KEY1` values against `@KEY1 + 8 < 256`       | tops 38, 97, 66, 112 — all under 256                                            |
| `gks` arity, per call shipped                           | CULL `(4 - 1) % 3 = 0`; FORGE `(16 - 1) % 3 = 0`; SWITCH `(10 - 1) % 3 = 0`     |
| Every HID usage id                                      | verified against the USB HID Usage Tables, Keyboard/Keypad page 0x07            |
| Keepers and decays                                      | FORGE's two event strings hold no `glf`, `glpfs` or 65535; CULL's and SWITCH's hold no 65535 |
| SWITCH's nine glyphs                                    | nine distinct integers, minimum pairwise difference **2** lit cells             |
| CULL's five band patterns                               | five distinct single-channel patterns, quoted above                             |

The three declarations are in place for all three entries: `grep -c '"cull"' listing.ts`,
`grep -c 'id: "cull"' front-door.ts` and the same for `forge` and `switch` each print **1**, all three
are in `CATALOG` and all three are re-exported by name.

No device was connected to, looked for or written to. Nothing under `src/vendor/` was read for editing
or edited. Nothing under `src/lib/tune/` was touched. No sibling repository was touched. `wrangler`
was not run. `test-results/` and `.tmp-audition/` were removed by hand. The scratch harness used to
probe the minifier, canonicalise, measure and observe the three configurations was a temporary spec
file under `src/lib/catalog/` that was deleted before every commit and never left in the repository;
`git status --short` prints nothing as this plan leaves it.

---

## Commits

| Commit    | What                                                                                  |
| --------- | ------------------------------------------------------------------------------------- |
| `c9ec8c9` | `feat(09-07): CULL - five ratings that read without colour`                            |
| `0b32565` | `feat(09-07): FORGE and SWITCH - a bank that cannot get stuck, and nine marks`         |
| `ce21926` | `chore(09-07): the fixture at thirty-one, a twenty-four chip row, three bench rows`    |

## Self-Check: PASSED

All three entry files, `frames.json`, `docs/HARDWARE-AUDITION.md`, `deferred-items.md` and this
SUMMARY are on disk; all three commit hashes resolve in `git log`. `grep -c` over `listing.ts` and
`front-door.ts` prints **1** for each of `cull`, `forge` and `switch` in both files, and
`front-door.ts` holds **31** ids — twenty-three excluded plus the eight of the untouched ring. Every
character count, wall time, HID reading, frame record, rendered pixel, glyph integer, chip count and
negative-check message quoted above was read from a runner's or a script's own output in this
session, and every canonical Lua string was dumped from `renderLua` after the final format pass and
re-confirmed by `AUDITION_DUMP=1`.
