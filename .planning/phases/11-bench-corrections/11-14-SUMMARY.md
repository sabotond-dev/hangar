---
phase: 11-bench-corrections
plan: 14
subsystem: catalog
tags: [radar, sonar, new-entry, front-door, checkpoint, ring-geometry, budget, census]
requires:
  - phase: 11-bench-corrections
    plan: 15
    provides: "the carried counts PREV_FILES 84 / PREV_TESTS 868 / PREV_E2E 86 source + 105 runs / BASE_CHECK 581 / sweep 4 19 / catalog 28 (9 + 19) / static/og 28 / audition 24, and the rule that a new entry re-counts every census in the tree"
  - phase: 11-bench-corrections
    plan: 13
    provides: "the finding that a value can go negative on the wire with every gate green, and the shape-not-colour legibility idiom"
  - phase: 11-bench-corrections
    plan: 08
    provides: "SONAR's swipe arming with its per-contact cell guard, its always-lit centre on layer 0, and its one-step note release - the structure this entry reuses verbatim"
  - phase: 11-bench-corrections
    plan: 02
    provides: "the two live gates, decay-idiom.spec.ts and touch-guard.spec.ts, and the blessed spellings of the live filter and the decay pair"
provides:
  - "The answer to the checkpoint, recorded: `new-entry`. The RADAR preset stays at ring position 5 untouched; RADAR POINTS (id radar-points) carries the radar ask as a second hand-authored card beside it and beside SONAR, by the user's choice, with the overlap accepted under D-03"
  - "The option-(d) measurement, carried from 11-14-HANDOVER.md: the front door's `padsim` rule is LIVE for a reason its own comment does not give - Coverflow.svelte builds an engine for every ring entry, so a lua row puts 271,581 bytes of Lua VM on the front page's first paint, which e2e/tuning.e2e.ts forbids in words - and three assertions gate a lua entry in the ring, two of which pass by id"
  - "RADAR POINTS: SONAR's arming, layer split, pending-list release, decay pair and five-knob rack reused character for character, with the one geometric difference the two names imply - the wave is a ring rolling out from the centre, so a cell's step is its Chebyshev distance - and the pitch map that difference forces: eight compass directions walking a named scale and wrapping an octave"
  - "The boundary, handled by construction: eight steps to a ping and five rings on the pad, so for three steps the ring is past the edge and the Timer compares k against a distance that is 0..4; k is never an index"
  - "The measured finding that the tune panel's word table (view.ts SCALE_WORDS, derived from the catalog by view.spec.ts) is a gate on every `scale` value, so a table invented for eight directions is red - found by the full suite after the entry was green in every spec its plan names"
  - "The finding that docs/HARDWARE-AUDITION.md's name parser claimed only a single upper-case word, so the catalog's first two-word Lua name went red on a real row, and the widening that claims the same names for every row already there"
affects: [11-16]
tech-stack:
  added: []
  patterns:
    - "A polar coordinate spent on time forces the other onto pitch: SONAR's ring is pitch because its angle is time; RADAR POINTS' direction is pitch because its ring is time. Stated as a consequence, never as a second difference"
    - "A compass walk over a named scale with an octave wrap - t[b%#t+1]+b//#t*12 - so a direction count that does not match a mode's length still reads every direction from the tune panel's vocabulary"
    - "A half-bucket offset before the modulo when bucketing a floored angle, so the bucket EDGES do not land on the directions the cells actually sit on"
key-files:
  created:
    - src/lib/catalog/entries/radar-points.ts
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
  - "THE CHECKPOINT WAS ANSWERED `new-entry` BY THE USER, and exactly that was built: the preset untouched, ported.ts untouched at nine, radar.ts untouched, the ring untouched at eight, and a twenty-ninth entry registered in EXCLUDED_FROM_ROW with the measured reason rather than the curated-row boilerplate"
  - "SONAR REUSED OPENLY AND NAMED IN THE HEADER, CLAUSE BY CLAUSE, with ONE geometric difference taken and stated: the ring is the time. The pitch flip is recorded as the consequence it is. No tag, colour, gesture or rack differs from SONAR's for any other reason, because D-03 forbids tidying"
  - "THE ID IS THE PLAN'S PLACEHOLDER `radar-points` AND THE NAME IS `RADAR POINTS` - the first two-word hand-authored name, kept because it is the ask's own words and because nothing in the tree binds a name to its id; the one collision it found (the audition's parser) was widened by name rather than the name bent to the parser"
  - "AN EIGHT-ENTRY SCALE TABLE FOR EIGHT DIRECTIONS WAS WITHDRAWN ON A GATE, NOT ON COST. It measured 560 / 281 and ran green in every spec the plan names; view.spec.ts refuses a scale value SCALE_WORDS cannot name. The walk-and-wrap costs nineteen more characters and puts SONAR's own values back in the rack"
  - "%8 RATHER THAN %5: three quiet steps while the ring is past the edge, the same character count, and the difference between a ring rolling out and a pad that glows permanently under a 42-tick trail. A `%9` plant isolates the eight-step clause; a `%5` plant reddens one clause earlier"
  - "`requirements mark-complete` NOT RUN, for 11-15's reason: the plan's list carries CAT-04, deliberately unchecked three times over, and CONT-01, which this plan did not touch"
patterns-established:
  - "A plant that comes back green is suspected first, and the suspicion can land on the PLANT: one that added a sticky table without reading it, and two that reddened on Lua syntax rather than on their clause, were all re-planted before anything was concluded about the check"
requirements-completed: []
duration: 30min task 02, plus task 01's earlier session (91b9279, 4abed05)
completed: 2026-09-10
---

# Phase 11 Plan 14: RADAR POINTS beside the preset - the checkpoint answered, a ring that is the time, and a word table that refused the first sketch Summary

**The user chose `new-entry`. The RADAR preset stays at front-door position 5
untouched and a second hand-authored card, RADAR POINTS, carries the radar ask
beside it and beside SONAR. SONAR is reused character for character with the
one difference the two names imply - the wave is a RING rolling out from the
centre, so a cell's step is its distance and its direction is its pitch. Costed
at the RGB444 picker corner before authoring: Setup 579 / Timer 281, 329 and 627
free. The first sketch indexed an eight-entry table straight by direction,
measured 560 / 281, was green in every spec the plan names, and was WITHDRAWN
by the tune panel's word table - a gate the plan does not mention and the full
suite found. Catalog 28 + 1 = 29, preset/Lua 9 + 20.**

## Performance

- **Duration:** task 02, 30 min in one executor session; task 01 was an earlier
  session whose report is `11-14-HANDOVER.md` (`91b9279`), answered at
  `4abed05`
- **Tasks:** 2 of 2 - task 01 a blocking checkpoint, answered; task 02 built
- **Files:** 1 created, 10 modified, across two commits

---

## TASK 01, CARRIED FROM THE HANDOVER: THE CHECKPOINT AND WHAT WAS MEASURED BEFORE IT

`11-14-HANDOVER.md` is task 01's full report and is not restated here; what
follows is what the resuming agent read and acted on. **The option-(d) check
was not re-run.**

**The front door's `padsim` rule is live, for a reason nobody wrote beside
it.** The comment says lua entries have no engine until 08-03 lands one; 08-03
landed it two phases ago. The assertion picked up a second purpose in Phase 10:
`Coverflow.svelte` calls `createEngine` for every ring entry unconditionally,
so a lua entry in the ring dynamic-imports the Lua VM, and `e2e/tuning.e2e.ts`
asserts for `/` that a browsing visitor downloads no WebAssembly - not the 628
KB formatter, not the 271 KB VM. A hand-authored RADAR in the ring turns that
test red. **Three assertions gate a lua entry in the ring, not one** (measured
by planting SONAR at ring position 5): the engine check, the golden-frames
record and the vendored-shelf resolution - **and the last two pass by id**, so a
hand-authored card keeping the id `radar` would sail past them while
`deriveMotion("radar")` went on reading the preset's frames.

**Option (a) is not re-derivable**: 0 of 5,040 orderings of a seven-card ring
satisfy both front-page rules; at eight, 720 of 40,320 do. Quiet pads at 2, 4,
6; RADAR sits between two of them.

**The four options and their measured costs** are in the handover. The
recommended answer was none of them; it was the user's call.

### The answer, verbatim

> **new-entry**

Recorded in the handover on 2026-09-10 at `4abed05`, with its consequences:
`T14 = +1`, phase total `BASE_TESTS + 41`, catalog 28 to 29, split 9 + 20,
`static/og/` 28 to 29, audition 24 to 25, `front-door.ts` still changes, and a
third overlapping card lands beside SONAR and RADAR by the user's choice with
D-03 standing.

### The branch table's row, copied as the plan asks, and corrected where the tree disagrees

| Answer        | 11-14 catalog term | 11-14 test term | audition rows after this plan | catalog total | preset / Lua split | `static/og/` files | audition rows after 11-15 | phase test total   |
| ------------- | ------------------ | --------------- | ----------------------------- | ------------- | ------------------ | ------------------ | ------------------------- | ------------------ |
| **new-entry** | **+1**             | **+1**          | **24**                        | **29**        | 9 + 20             | **29**             | **25**                    | `BASE_TESTS + 33`  |

**Two of its cells do not describe the tree, and both were already reported.**
The row assumes this plan runs before 11-15; the wheels ran first, so "audition
rows after this plan" is **25** (24 carried from 11-15, plus one) and "after
11-15" is the column that describes nothing. The phase test total reads
`BASE_TESTS + 33` where the handover's answer records `+41` - the handover's
figure is the one that counts the decimal insertions, and this SUMMARY asserts
no absolute total at all. The split `9 + 20` is right, and it is right for the
reason 11-15 gave: the nine ported presets are still nine PRESET entries.

---

## TASK 02: WHAT WAS BUILT, AND WHAT WAS REUSED

**A second card, not a rewrite.** `ported.ts` is untouched at nine, `radar.ts`
is untouched, `presets.ts` keeps nine and `presets.spec.ts` test 3 still asserts
them, and `FRONT_DOOR` is untouched at eight with its header table still true.
`src/lib/catalog/entries/radar-points.ts` is created and registered in
`index.ts` (import, `CATALOG`, re-export) and `listing.ts` (a full
`ListingEntry`, `motion: "animated"`, `preview: "lua"`).

### Reused from SONAR, character for character, and named in the header

| Reused                             | What it is                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| the arming callback                | the blessed live filter `if e~=1 and e~=4 and e<9 then`, the per-contact last-cell guard `s.q[i]` (11-08), and the `s.q[i]=e<9 and n` store that lets a fast tap escape it |
| the layer split                    | armed cells on layer 1 in a fixed pink, the wave on layer 2 in `@SWEEPC`, the centre on layer 0 in `@SWEEPC` always lit - the emitter            |
| the pending list                   | every note the Timer starts goes into `s.z` and the FOLLOWING fire releases the whole list before playing; a note is one step long               |
| the decay pair                     | `glpfs(a,2,252,250,0)glt(a,2,42)`, the idiom 11-02 rescued, landing on phase 0 at T = 42                                                          |
| the rack                           | scale, root, wave colour, wave period, MIDI channel at value counts `[5,5,5,5,16]` - the same stamp shape character as SONAR - and `@PERIOD`, not `@SWEEP`, for the prefix reason |

### The one difference, taken and stated

**SONAR sweeps an angle: sixteen wedges, one per step, turning. A radar ping is
a ring rolling out from the centre: five rings, one per step, expanding.** So
`self.a[n]` - the step at which cell n is crossed - is the cell's Chebyshev
distance here, where SONAR's is its angle bucket. That is the difference D-03
sanctions and the two names imply, and it is the only one taken.

**It forces the pitch map to flip, and that is recorded as a consequence rather
than a second difference.** A cell has two polar coordinates. SONAR spends the
angle on time, so its ring is the pitch; this card spends the ring on time, so
the direction is the pitch: eight compass directions, `b` in 0..7, and ring 1
has exactly eight cells landing one per direction, so the eight cells around
the emitter are the scale in order, east first.

**The half-bucket offset is measured, not decorative.** Dividing the vendored
Pinwheel's angle expression by 32 straight off puts every bucket EDGE on a
compass direction, and the floor of a negative angle tips a diagonal cell into
the bucket beside it. Checked over all 81 cells before a line was authored:
cells 30 and 39 both read bucket 4 and bucket 7 held six cells. `+16` before
the modulo centres every bucket on its direction and ring 1 reads one cell per
bucket, 0 to 7. Three characters, and the test asserts the property on the
ported arithmetic as well as on the wire.

### The boundary: eight steps, five rings

`k` counts 0..7. Rings 0..4 are crossed on steps 0..4; **on steps 5, 6 and 7
the ring has left the pad** and `if s.a[n]==k` matches nothing. The radius
exceeding the pad is handled by a comparison that fails rather than an index
that goes out of range - `k` is never used as a table index, only compared
against a distance that is 0..4 by construction. The silence is also what
makes the wave read as a ring: the trail is 42 ticks and at the default 140 ms
step that is three steps of fade, so `%5` would have kept the whole pad lit at
all times. `%8` is the same character count.

**What reaches the wire, checked for sign and range** (11-13's finding): pitch
`@ROOT + t[b%#t+1] + 12*(b//#t)`, at most 60 + 5 + 12 = 77 across every declared
value; velocity 100; note-off with velocity 0. Nothing is computed from a
coordinate, so nothing can go negative; the channel is a knob token 0..15.

---

## THE BUDGET, COSTED BEFORE THE ENTRY WAS AUTHORED

Every figure is `max(GridScript.compressScript(lua).length, lua.length)` after
`await padReady()`, at the **RGB444 picker corner** - every colour knob at
`255,255,255` and every other knob at its longest declared value. Measured on a
scratch spec over the raw strings before any file was authored, then again on
the entry through `renderLua`.

|                          | Setup   | free    | Timer   | free    |
| ------------------------ | ------- | ------- | ------- | ------- |
| **RGB444 picker corner** | **579** | **329** | **281** | **627** |
| at the defaults          | 579     | 329     | 279     | 629     |
| all-shortest declared    | 569     | 339     | 278     | 630     |

Both events are fixed points of `compressScript` at every corner and pass
`checkSyntax`. The picker corner equals the defaults on the Setup because the
default scale is the longest declared value and `255,255,255` is the same
length as `120,255,255`; the Timer's `+2` is `@CH` at `15`.

**SONAR's 559 / 282 at the same corner is the reference the plan named.** This
card is twenty over it on the Setup - the compass walk with its octave wrap
(nineteen), the half-bucket offset (three), a three-digit default period, less
the two the shorter angle divisor saves - and one under on the Timer.

### The first sketch, and why it was withdrawn

The first shape indexed an **eight-entry scale table straight by direction**,
`t[b+1]`, with five invented eight-note tables. It measured **560 / 281** at the
picker corner, was a fixed point, passed `checkSyntax`, and **ran green in every
spec the plan names** - `front-door`, `listing`, `frames`, `catalog`,
`touch-guard`, `decay-idiom`, `host-surface`, `lua-smoke`, the three censuses
and the audition.

**`npm run test:quick` then reddened two tests in `src/lib/tune/`.**
`view.ts`'s `SCALE_WORDS` maps semitone SETS to mode names, `view.spec.ts`
derives its check from the catalog so an unlisted set is red rather than a
rail, and `knobs.lua.spec.ts` requires every `scale` knob to render as a word
row. An eight-entry table invented for eight directions is not a named mode.

**The walk-and-wrap replaces it:** `t[b%#t+1]+b//#t*12`. A seven-note mode puts
its octave on the eighth direction; a five-note set climbs into its second
octave on the sixth. The rack now carries **Major, Minor, minor pentatonic,
major pentatonic and whole tone** - three of them SONAR's own values, all five
in the word table - which is both the gate satisfied and a more faithful reuse
of SONAR's rack than the sketch was. Nineteen characters, withdrawn on a gate
and not on cost.

---

## MOTION, REST, AND WHAT THAT DECIDED

**`animated`, read off the regenerated fixture.** Setup arms the Timer and the
body re-arms unconditionally on its first statement, which is the shape 11-15
measured as the actual cause of `animating` (a stored Timer alone is not).
`frames.json` reads:

```
"radar-points": tick 0    nonZeroBytes 3   animating true
                tick 37   nonZeroBytes 27  animating true
                tick 101  nonZeroBytes 99  animating true
                tick 500  nonZeroBytes 75  animating true
                tick 1009 nonZeroBytes 3   animating true
```

`git diff --stat src/lib/catalog/frames.json` is **32 insertions, 0
deletions**; `frames.spec.ts` was re-run without `UPDATE_FRAMES` and is green
at 5 tests. Ticks 0 and 1009 hash identically: three bytes, the emitter alone,
with the ring past the edge.

**`restsBlack: false`**, and it is false at tick 0 - the emitter on layer 0
puts three non-zero bytes into the first record. So the card **cannot carry a
demonstration gesture** (`listing.spec.ts` refuses a `DEMO_PATHS` key for a lit
entry), `src/lib/sim/demo.ts` is byte-untouched, and 11-11's finding that no
test asserts what a demo path depicts does not bite. **The OG image is the
sampled frame** and was inspected: the emitter lit at the centre, ring 3
brightest, rings 2 and 1 fading behind it, ring 4 still dark - a ring rolling
out, legible as one. `static/og/radar-points.png` is **6,183 bytes**.

---

## THE FRONT DOOR: UNTOUCHED AT EIGHT, AND STILL CHANGED

**The ring's eight rows do not move**, the header table is still true, and
`front-door.spec.ts` is green at eight without an edit. But the spec asserts
row members plus `EXCLUDED_FROM_ROW` equals `CATALOG` exactly, so the
twenty-ninth entry needed a row there, and it got **the real reason** rather
than the curated-row boilerplate the other eighteen carry:

> The hand-authored radar the user asked for, built as a second card under plan
> 11-14's answer new-entry so the RADAR preset at ring position 5 stays exactly
> as it is. It cannot take that position or an eighth-plus-one:
> front-door.spec.ts requires preview === 'padsim' of every row entry, and
> 11-14-HANDOVER.md measured that the rule is live for a reason its own comment
> does not give - Coverflow.svelte builds an engine for every ring entry, so a
> 'lua' row would put the 271 KB Lua VM on the front page's first paint, which
> e2e/tuning.e2e.ts forbids in words.

**10-07's parked ring item is NOT unblocked** - that is option (d)'s
consequence and option (d) was not chosen. The `padsim` comment at
`front-door.spec.ts:110-112` is still stale and is **left for 11-16** rather
than corrected in a wave that did not take the option it gates; the handover
records the correct reason and this row restates it.

---

## THE TEST, AND WHAT IT PRINTED

One test in `lua-smoke.spec.ts`, **24 to 25**, where 11-09.2 through 11-15 each
put an entry-pinned test:

```
RADAR POINTS, plan 11-14 (the ring is the time, the direction the pitch):
  three points armed, 224 ticks: ring 1 pitch 48 fired at 28,140; ring 2 pitch 60 fired at 42,154; ring 4 pitch 59 fired at 70,182
  ring 2 removed, 224 ticks: fired ring 1 x2, ring 2 x0, ring 4 x2
  ring 2 put back, 224 ticks: fired x2
```

Three points on three rings in three directions (cells 41, 24, 4), armed by a
**press and a lift** - which `touch.ts` delivers completely, since it never
emits code 9 - each at a different coordinate inside its cell so the host's
change gate delivers every one. Over **exactly sixteen steps**:

- **ring order on the wire** - ring 2's point sounds exactly one step after
  ring 1's, ring 4's exactly three steps after. SONAR's angular sweep places
  these three by direction at three unrelated steps, so this clause says
  which card this is;
- **the eight-step ping** - ring 1's point sounds every `8 x stepTicks`;
- **the light at the fire** - all eight ring-1 cells lit on the wave layer and
  no ring-4 cell: a ring, not a wedge and not a pulse;
- **the one-step release** - every note-on paired to a note-off exactly
  `stepTicks` later, nothing due and open;
- then **the middle point taken away** must be silent while the other two keep
  sounding twice each - the clause the plan names as the one a happy-path test
  misses - and **put back** must return;
- `host.hid` is `[]` and `host.errors` is `[]` across the run.

Every expected pitch is **derived** by porting the Setup's own compass walk,
never pasted, and the scale's eight-direction property is asserted on that
port as well. The step count is derived from the `sweep` knob.

### Two faults in the test, found and fixed before any plant ran

1. **The window was one step too wide.** Sixteen steps plus one, from the
   phase the arming presses happened to leave, held THREE fires of ring 1 and
   reported a correct card as wrong. An eight-step period fires exactly twice
   in any sixteen-step span; the window is now exactly that.
2. **A note started inside the last step of the window was reported as
   hung.** Its release is the next fire, which the window had not reached. The
   open-note check now ignores a note whose release is not yet due, and says
   why, so the assertion cannot be moved by the phase of the window.

Both are the third standing warning in a different coat: a probe can be
defeated by its own framing as easily as by the host.

---

## THE NEGATIVE CHECKS: EIGHT PLANTS, THREE OF THEM RE-PLANTED

Every plant was verified **unique in the file and inside the Lua string, never
in a comment**, by a helper that refuses a match on a comment line, and every
one was restored from a scratch copy with sha256 compared either side. **No
`git checkout`, `git restore`, `git stash` or `git clean` was run at any
point.** The shipped entry reads
`51746a353bc2ec737694cdca0d125dd72b2c7287bfc8e161e25ba58b22824317` before every
plant and after every restore, and the earlier sketch's `0ca881db…` the same
way before the word table moved it.

| #      | Plant                                                                              | Exit | Reddened on                                                                                          |
| ------ | ---------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------- |
| **1**  | a sticky armed set `s.w` the Timer reads, with the light still toggling honestly    | 1    | *"A POINT TAKEN AWAY FALLS SILENT ON THE NEXT PASS ... still sounded 2 time(s)"* - the silence clause alone |
| **2b** | SONAR's angle bucket as `self.a[n]` - the angular sweep                              | 1    | *"A PING ROLLS OUT RING BY RING ... ring 1 at 14, ring 2 at 98: expected 84 to be 14"*              |
| **3**  | `%5` - the ring re-fires the centre straight after the edge                          | 1    | the count clause: *"ring 1's point fired 3 time(s) over two pings"* - one clause EARLIER than aimed  |
| **3b** | `%9` - two fires in sixteen steps, so the count passes and the period does not       | 1    | *"ONE PING IS EIGHT STEPS ... Observed 28 then 154: expected 126 to be 112"* - the clause 3 never reached |
| **4**  | the release sent on the wrong pitch, `s.z[j]+1`                                      | 1    | *"EVERY NOTE THE PING STARTS MUST BE RELEASED. Left open ... [48, 59]"*                            |
| **5b** | every cell lit on every fire - a whole-pad pulse - with the notes still ring-gated   | 1    | *"NO ring-4 cell is lit on the wave layer - it is a ring, not a pulse ... Observed 32"*             |
| **6**  | the compass walk without its octave wrap                                             | 1    | the count clause, via a pitch collision: ring 1's pitch counted 4 because cell 24 now shared it     |
| **1a** | the sticky table ADDED but the Timer still reading `s.v`                             | **0** | nothing - **the plant was incomplete**, not the check; re-planted as 1                              |
| 2, 5   | the same two ideas, malformed: a missing space made `//32self` a bad number, one `end` too many | 1 | **Lua syntax errors** - the wrong clause; re-planted as 2b and 5b                             |

Restored state re-run: **1 passed**, and the full suite below.

**Plant 1a is the phase's first standing warning cashed in from the other
side.** It came back green, and the thing to suspect was the plant: it never
wired the sticky table into the Timer. Plants 2 and 5 reddened, but on a
parse error rather than on their clause, which is 11-10's "wrong clause"
finding in its crudest form. All three were re-planted before anything was
concluded. Plant 6 reddens indirectly - the wrap is defended by the count
clause because dropping it collides two pitches - which is reported as
indirect rather than dressed up as a boundary check.

---

## THE COPY, COUNTED BY SCRIPT

|             | String                                                                                                       | Length  |
| ----------- | ------------------------------------------------------------------------------------------------------------ | ------- |
| description | *"Rings roll out from the centre and play the points you placed: the ring is the time, the direction the pitch."* | **109** |
| quiet       | none - the card is `animated`                                                                                | -       |

The cap is 110. Two earlier drafts measured **112** and **111** and were
shortened by script rather than by eye. The description says the geometric
difference in the shape SONAR's own line uses (*"the ring is the pitch, the
angle the time"*), and it opens with the preset's own four words so the two
RADAR cards read as kin rather than as a duplicate.

## THE TAGS, AND THE HISTOGRAM READ AFTERWARDS

**`["sequencing", "generative", "playable"]` - SONAR's three, deliberately.**
They are true of this card for exactly the reasons they are true of SONAR - it
sequences, it runs on its own, you play it by placing points live - and
choosing different ones to spread the histogram would be the tidying D-03
forbids.

| Facet     | Carried (28)                                                                          | After (29)                                                                            |
| --------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **FOR**   | modulation 8, show 5, mixing 3, sequencing 3, shortcuts 3, keys 2, pointing 2, play 2 | modulation 8, show 5, **sequencing 4**, mixing 3, shortcuts 3, keys 2, pointing 2, play 2 |
| **FEELS** | generative 12, expressive 12, readable 11, playable 8, precise 7, still 6             | **generative 13**, expressive 12, readable 11, **playable 9**, precise 7, still 6      |

Sums **29** and **58**. Singletons **0**. No term touches the floor of 6;
`still` stays exactly on it, unmoved.

---

## THE COUNTS, AS A CARRIED NAME PLUS A DELTA

| Name                | Carried (11-15)    | Observed                                   | Delta                                              |
| ------------------- | ------------------ | ------------------------------------------ | -------------------------------------------------- |
| `PREV_FILES`        | 84                 | **84**                                     | **+0** - no spec file was created                  |
| `PREV_TESTS`        | 868                | **869**                                    | **+1** - exactly the declared term                 |
| `PREV_E2E` titles   | 86 source titles   | **86**, by `grep -c "test("`               | **+0**; the suite was NOT run (not a suite-running plan) |
| `PREV_E2E` runs     | 105 runs           | not observed                               | **+0** declared, unproved here - see below         |
| `BASE_CHECK`        | 581                | **582**, `0 ERRORS 0 WARNINGS`             | **+1** - `radar-points.ts`, a SOURCE file          |
| sweep members       | `4 19`             | **`4 19`**                                 | **+0**                                             |
| catalog             | 28 (9 + 19)        | **29 (9 + 20)**                            | **+1**, this plan's `T14`                          |
| `static/og/` files  | 28, 166,516 B      | **29, 172,699 B**                          | **+1**, **+6,183 B** - `radar-points.png` exactly  |
| audition rows       | 24                 | **25**                                     | **+1**                                             |

`npm run test:quick | node scripts/check-counts.mjs 84 869` exits **0**;
`84 868` exits **1**, *"tests: observed 869, expected 868"*. **Both were run and
both are reported.** `npm run test:sweep | node scripts/check-counts.mjs 4 19`
exits **0**. `npm run lint` clean. `npm run check` reads **582 FILES 0 ERRORS
0 WARNINGS 0 FILES_WITH_PROBLEMS**.

**`static/og/` decomposes exactly**: the other 28 files total 166,516 bytes,
which is 11-15's figure to the byte, so the whole delta is this entry's image.

**On `PREV_E2E` runs.** `grep -c "test("` proves the title zero soundly. The
run count moves only if an `@webkit` tag moves, and none did - but that is an
inference from the diff rather than a measurement, and it is reported as one.
The plan does not name this wave as a suite-running plan and Playwright was not
started.

### The sweep totals, and which ones rose

| Sweep readout                 | Carried (11-15)                                                          | Observed                                                                  | Delta                          |
| ----------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------ |
| compiler route / reachability | Pass A **20,782**, Pass B 24,576, total **45,358**                        | identical                                                                 | **+0**                         |
| Lua route round trip          | Pass A **49,888** (w 49,487, x 382), Pass B **131,072**, total **180,960** | Pass A **51,888** (w **51,486**, x 382), Pass B **135,168**, total **187,056** | **+2,000 / +4,096 / +6,096** |
| `lua-entries`                 | **1,271** combinations, 2,542 measurements                                | **1,331** combinations, **2,662** measurements                            | **+60 / +120**                 |
| kind cross-product            | 1,296 combinations, worst **906 of 908**                                  | identical                                                                 | **+0**                         |

**A ninth independent confirmation that compiler Pass A cannot move for a
hand-authored Lua entry.** Every rise is derived: Lua Pass A **+2,000** is the
four non-colour knobs, 5 x 5 x 5 x 16 (of which 1,999 land in format `w` and
one is the entry's defaults vector); Pass B **+4,096** is one colour knob times
the RGB444 lattice; `lua-entries` **+60** is 27 sampled literals for the one
colour knob plus 31 non-colour values plus 2 corners. The entry's own sweep row
reads `radar-points passA 2000 passB 4096 format w payload 9 characters`.

---

## THE CENSUSES, AND ONE PARSER THAT COULD NOT READ THE NAME

**A new entry is a new row in every census** - 11-15's pattern, and it held.
The same three recorded blocks in the same three files that no plan names moved,
each re-counted with a paragraph saying which wave moved it and why:

| File                                        | Moved                                                                         |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/lib/browse/filter.spec.ts`             | `entries` 28 to 29, `sequencing` 3 to 4, `generative` 12 to 13, `playable` 8 to 9 |
| `src/lib/tune/colour-picker.spec.ts`        | the split `12 / 7 / 4 / 5` to **`13 / 7 / 4 / 5`** - one colour knob; catalog 29 |
| `src/lib/share/stamp-roundtrip.sweep.spec.ts` | `exempted` 32 to **33**, `guarded` 65 to 69; it still reconciles, 69 + 33 = 102 |

**And a fourth surface the two-word name found.** `audition.spec.ts`'s
`namesIn` took *the leading upper-case run* of a Config cell, so `**RADAR
POINTS**` was claimed as `RADAR` - which no live entry is called; the preset is
`Radar` - and the gate went red on a real row for a name it could not read.
**Nothing in the tree binds a name to its id**, and the name is the ask's own
words, so the parser was widened rather than the name bent: a run may now
contain single spaces, still stops at a parenthesis or a lower-case letter, and
claims exactly the same names for the twenty-four rows already there (the two
shared rows split on `/` first; no cell holds two names separated by a space).
Its `ROW_COUNT`, title and numbering message moved 24 to 25.

**`docs/HARDWARE-AUDITION.md`** gains row 25 and a cost-table row, with four
prose counts moved (*nineteen* to *twenty* twice, *twenty-four* to
*twenty-five* three times, *thirteen* Timer files to *fourteen*). The diff is
118 lines because Prettier re-aligned the whole cost table around the wider
`radar-points` id; the content change is one row, one paragraph and those
counts.

**Row 25, verbatim:**

> **RADAR POINTS** - **(a)** Place three points on three different rings - one
> next to the emitter, one two out, one on the edge - and hold a synth patch
> with a fast attack. Do the three notes arrive inner first, one per step, and
> is there a rest of three steps before the next ping? **(b) REMOVE ONE WHILE IT
> IS RUNNING.** Tap the middle point off between two pings: is it silent on the
> very next ping, with the other two still sounding, and did the note it was
> holding come off? Then put it back and confirm it returns on the next ping.
> **(c)** At the default speed, stand back: does the light read as ONE RING
> ROLLING OUT, or as the whole pad flashing? Try the slowest and fastest ping
> speeds too.
>
> *Why it cannot be simulated:* the note-off is proved against a LOG, not
> against a note - there is no synthesiser behind the simulator, so "released
> one step later" says nothing about whether a 140 ms note is even audible on
> the patch you play it into. Whether five rings 140 ms apart with a 420 ms
> trail read as an expanding ring rather than a flash is a judgement about LED
> diffusion and real brightness after the divide-by-512, and whether a stranger
> sees points on a compass is the legibility question D-11-12-b says nothing in
> the tree can ask.

The cost-table row reads **`radar-points` | RADAR POINTS | 579 | 279 | 5 |
no**, at the defaults like every other row, with a provenance paragraph saying
it is NEW rather than re-measured - the second such row after WHEELS.

**`D-11-10-b` MOVES, incidentally: SONAR's row is stale.** The plan quoted
SONAR at 432 / 279 from this table; `sonar.ts`'s own header has read **558 /
279** at the defaults since 11-08 (+52 for the always-lit centre, +8 for the
`e<9 and n` store, and the rest of that wave's repairs). The row was not
corrected here - this wave did not re-author SONAR, and 11-11 to 11-13's rule
is that the re-authoring wave re-measures - so the tally reads **five rows
examined in five waves, TWO stale, thirteen unchecked**, and the row is 11-16's
with the rest of the table.

**`wild-stamps.json`: nothing added**, for the reason 11-15 read off
`stamp.spec.ts:395-470` and handed to this plan: the fixture is 36 captured
literals over 18 entries with `toBe(18)` asserted twice, and a record for a
card that did not exist at commit `b3f99bb` would be a fabricated capture.
`git diff --quiet HEAD~2 HEAD -- src/lib/share/fixtures/wild-stamps.json
src/lib/share/stamp.ts` exits 0. The entry's stamp shape was checked all the
same: five knobs at `[5,5,5,5,16]`, the same shape character as SONAR's, and
`stamp.spec.ts` is green.

---

## BOTH GATES, GREEN, WITH NO NEW ROWS IN EITHER TABLE

| Gate                                        | Rows before      | Rows after | Result         |
| ------------------------------------------- | ---------------- | ---------- | -------------- |
| `touch-guard.spec.ts` `DECLARED_EXCEPTIONS` | 2 (stage, forge) | **2**      | green          |
| `decay-idiom.spec.ts` `KNOWN_VIOLATIONS`    | 0                | **0**      | green          |

The live filter and the decay pair are SONAR's spellings, character for
character, and SONAR passes both gates; there is nothing new for either to
classify. There is no `e>=5` anywhere and no onset disjunction at all - the
callback has one filter and one dedup, as SONAR's does. **On code 9:** the
arming gesture is a press, which the preview delivers completely; the `e<9 and
n` store handles the module's coalesced tap for the reason `sonar.ts` gives.
`PARITY_ALLOWANCES` is untouched and still empty, and the fast-tap parity test
is green over the new entry.

---

## Deviations from Plan

### 1. [Rule 3 - blocking] Task 02's files moved in one commit, and the test in a second

- **Found during:** task 02
- **Issue:** the plan lists the entry, the registrations, `frames.json`, the
  audition and the censuses under one task, and they leave the tree red if
  they move separately (partition, listing equality, fixture record, audition
  row). The behavioural test is additive.
- **Fix:** entry plus every registration and census in `186c75e`, green on its
  own; the test in `2e0d051`. The same shape 11-11 through 11-15 recorded.

### 2. [Rule 2 - missing critical functionality] The tune panel's word table refused the first sketch

- **Found during:** task 02, by the FULL quick suite after every plan-named
  spec was green
- **Issue:** `view.spec.ts` derives from the catalog that every `scale` value
  is a set `SCALE_WORDS` can name, and `knobs.lua.spec.ts` requires a word row
  for it. The plan names neither file, and an eight-entry table invented for
  eight directions satisfies neither.
- **Fix:** the compass walk with an octave wrap, `t[b%#t+1]+b//#t*12`, and
  SONAR's own named sets in the rack. +19 characters; 560 to 579 at the
  picker corner. Detailed above.
- **Commit:** `186c75e`

### 3. [Rule 2 - missing critical functionality] Three censuses in three files no plan names, and a parser that could not read the name

- **Found during:** task 02, by running the suites
- **Issue:** `filter.spec.ts`, `colour-picker.spec.ts` and
  `stamp-roundtrip.sweep.spec.ts` each record a count a new entry moves - the
  same three files 11-01 and 11-15 found - and `audition.spec.ts`'s name
  parser claimed `RADAR POINTS` as `RADAR`.
- **Fix:** each census re-counted with its reason; the parser widened by name
  and shown to claim the same names for every prior row. **Fourth occurrence
  of the census shape; first of the parser's.**
- **Commit:** `186c75e`

### 4. [Rule 1 - bug] Two faults in the new test, both in its own framing

- **Found during:** task 02, on the test's first two runs
- **Issue:** a seventeen-step window held three fires of an eight-step ping; a
  note started inside the window's last step was reported as hung.
- **Fix:** exactly sixteen steps; the open-note check ignores a note whose
  release is not yet due, with the reason beside it.
- **Commit:** `2e0d051`

### 5. [judgement, reported] Three plants re-planted before anything was concluded

- **Found during:** task 02's negative checks
- **Issue:** plant 1a came back green because it never wired the sticky table
  into the Timer; plants 2 and 5 reddened on Lua parse errors.
- **Decision:** all three re-planted; all eight now redden on the clause they
  were aimed at, listed above with both exit codes.

### 6. [judgement, reported] `requirements mark-complete` deliberately not run

- **Found during:** state updates
- **Issue:** the plan's frontmatter lists `[CONT-01, CONT-02, CAT-04,
  CONT-03]`. `CAT-04` has been deliberately left unchecked by 10-06, 10-07,
  10-14 and 11-15 in writing, and nothing here touched the shape of the
  catalog data file. `CONT-01` is `[ ]` and concerns the nine presets, which
  this plan did not touch. `CONT-02` and `CONT-03` are already `[x]`.
- **Decision:** not run; `REQUIREMENTS.md` byte-untouched. Reported as a
  defect in the plan's frontmatter, as 11-15 reported the same list.

**No other rule fired.** No missing dependency, no broken import, no
architectural question, and no auth gate.

---

## Everything the plan asserts that the tree does not support

The handover's seven are carried, not restated. Task 02 found these:

1. **The branch table's "audition rows after this plan" cell reads 24 and the
   tree reads 25**, because 11-15 ran first. The "after 11-15" column describes
   an order that did not happen. Reported above with the row.
2. **The plan's `BASE_TESTS + 33` phase total disagrees with the handover's
   `+41`.** No absolute total is asserted here; the disagreement is 11-16's.
3. **"SONAR's 432 / 279 is the known-affordable reference."** SONAR's own header
   reads **558 / 279 at the defaults and 559 / 282 at the picker corner**; 432 is
   the audition table's figure from plan 08-06, which `sonar.ts` has since
   outgrown by 126 characters and which `D-11-10-b` records as unchecked. The
   plan quoted a stale table rather than the entry, and the number it quoted
   is now **one of the seven entries or plans found quoting something other
   than the picker corner - the eighth**, reported for 11-16's sweep.
4. **The plan names no gate on `scale` values**, and there is one that reddens
   on an unnamed set. `view.spec.ts` and `knobs.lua.spec.ts` belong in any
   plan that declares a `scale` knob.
5. **The plan does not anticipate `BASE_CHECK` moving** - it moves by one for
   any new source file, as 11-15 found for `wheels.ts`.
6. **The plan's negative check "leave radar in `FRONT_DOOR` after it becomes a
   Lua entry" is `ring-seven` only** and was not run, correctly: under
   `new-entry` there is no such state to plant. The handover had already
   observed the `padsim` wall red by planting SONAR.
7. **`front-door.spec.ts`'s comment at 110-112 is still stale** after this
   wave, and this wave left it so deliberately: correcting a comment about a
   rule whose real reason the handover found, inside a wave that did not take
   the option the rule gates, would make the reason look reviewed. **11-16
   owns it.**
8. **`src/lib/sim/lua-smoke.spec.ts`'s header still opens "Thirteen tests"**
   and the file carries **25**. Left for 11-16 with the other stale headers,
   for the reason 11-10 through 11-15 each gave.

---

## Invariants, each proved by a command

| Claim                                                | Command                                                                                        | Result                                                          |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| both gates green, no new rows                        | `decay-idiom.spec.ts`, `touch-guard.spec.ts` in the catalog run                                | **green**; tables 0 and 2 unchanged                             |
| `frames.spec.ts` green with no `UPDATE_FRAMES`       | re-run after the regeneration                                                                  | **green, 5 tests**; diff 32 insertions, 0 deletions            |
| `src/vendor/` untouched by this plan                 | `git diff --quiet HEAD -- src/vendor/`                                                         | **exit 0**. No manifest row declared                            |
| `src/vendor/` unmoved since 11-04                    | `git diff --stat 4131ff5 HEAD -- src/vendor/`                                                  | the recorded four-file output (`_pad.ts` 70, `pad-sim.ts` 29, `tests/pad-sim.test.js` 19, `tests/pad.test.js` 7) |
| `firmware-oracle.spec.ts` green and unedited         | `git diff --quiet HEAD -- ...`; in the quick run                                               | **exit 0**; green                                               |
| `upstream-manifest.json` untouched (**15th** wave)   | `git diff --quiet HEAD -- src/lib/fidelity/upstream-manifest.json`                             | **exit 0** - the four mislabelled rows stand for 11-16          |
| configs and roadmap untouched                        | `git diff --quiet HEAD -- playwright.config.ts vite.config.ts .planning/ROADMAP.md`            | **exit 0**                                                      |
| `stamp.ts`, `wild-stamps.json`, `demo.ts` untouched  | `git diff --quiet HEAD -- ...`                                                                 | **exit 0**                                                      |
| `ported.ts`, `radar.ts`, `presets.ts` untouched      | not in either commit's file list                                                               | `presets.spec.ts` green at nine                                 |
| `FRONT_DOOR` untouched at eight                      | `front-door.ts` diff is 4 added lines, all in `EXCLUDED_FROM_ROW`                              | `front-door.spec.ts` green, 8 tests                             |
| `svelte-check`                                       | `npm run check`                                                                                | **582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS**         |
| lint                                                 | `npm run lint`                                                                                 | **clean** (prettier + eslint)                                   |
| build                                                | `npm run build`, twice (once after the word-table change)                                      | **exit 0**; writes only gitignored paths                        |
| quick suite after the build                          | `npm run test:quick`                                                                           | **84 files / 869 tests + 1 todo, exit 0**                       |
| sweep                                                | `npm run test:sweep`                                                                           | **4 files / 19 tests, exit 0**                                  |
| no server was stale                                  | probed `127.0.0.1:4173` before building                                                        | no server                                                       |
| e2e term `+0`                                        | `grep -c "test(" e2e/*.e2e.ts`                                                                 | **86** before and after; Playwright not run                     |
| no sibling repository touched                        | none read or written                                                                           | -                                                               |
| nothing hardware-verified                            | no agent connected to or wrote to a device                                                     | -                                                               |
| nothing deployed                                     | no `wrangler`, no `npm run deploy`                                                             | -                                                               |
| tree clean                                           | `git status --porcelain`                                                                       | empty before this SUMMARY                                       |

Two scratch measurement specs (`zz-cost`, twice) were used and **deleted before
any commit**; `npm run check` reads 582 with them gone. The plant helper, the
pristine copies and the run logs live in the session scratchpad outside the
repository.

---

## WHAT IS NOT CLAIMED

**Nothing here is hardware-verified.** No agent connected to a device, wrote to
a device, or deployed anything. Row 25 is the only thing that closes it.

**"Note-off when the wave hits a point" is proved against a LOG, not a note.**
The release is one step later in `host.midi`; whether a 140 ms note is audible
on the patch it lands in is row 25(a).

**"Acts like a radar" is a claim about the wire and the wave layer, not about
the eye.** The test proves a ring is lit at once and ring 4 is not; whether
five rings 140 ms apart with a 420 ms trail READ as a ring on real LEDs is row
25(c), and D-11-12-b still says nothing in the tree can ask it.

**The compass pitch map is arithmetic over the simulator's coordinates.** The
module has the sensor.

---

## Commits

| Hash      | Message                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| `91b9279` | `docs(11-14): the front-door rule is live for a reason nobody wrote next to it` (task 01, prior session)     |
| `4abed05` | `docs(11-14): the answer is new-entry, and the catalog lands at twenty-nine` (the answer, prior session)     |
| `186c75e` | `feat(11-14): RADAR POINTS beside the preset, a ring that is the time and a direction that is the pitch`     |
| `2e0d051` | `test(11-14): the ping rolls out ring by ring, and a point taken away is silent on the next pass`            |

---

## Carry-forward for the next wave

**`PREV_FILES` 84 · `PREV_TESTS` 869 · `PREV_E2E` 86 source titles / 105 runs
(runs carried, not re-observed) · `BASE_CHECK` 582 · sweep members `4 19` ·
catalog 28 + 1 = **29** · preset/Lua **9 + 20** · `static/og/` **29** files,
172,699 B · audition **25** rows**

**Sweep totals:**

- compiler route **Pass A 20,782**, Pass B 24,576, **total 45,358** - unmoved
- Lua route **Pass A 51,888** (format w 51,486, format x 382), Pass B
  **135,168**, **total 187,056**
- `lua-entries` **1,331 combinations, 2,662 measurements**
- kind cross-product 1,296 combinations, **worst 906 of 908** - unmoved

**Entry headers or plans quoting something other than the RGB444 picker corner:
EIGHT.** This plan's `interfaces` quotes SONAR at 432 / 279 - the 08-06 audition
figure - and that is the eighth. RADAR POINTS is the thirteenth entry checked
and the second authored against the picker corner from the start. **11-16 owns
the sweep.**

**Open items handed forward:**

1. **`front-door.spec.ts:110-112`'s comment is stale and its rule is live for a
   different reason** - the handover's finding, now with two SUMMARY paragraphs
   and an `EXCLUDED_FROM_ROW` reason restating it. The comment itself is
   uncorrected. 11-16.
2. **10-07's parked ring item stays parked.** `new-entry` did not touch the
   wall.
3. **The plan's branch table disagrees with the tree in two cells and with the
   handover in one** (audition-after-this-plan, the after-11-15 column, and
   `+33` against `+41`). Reported, not reconciled.
4. **`D-11-15-a`** carried unchanged - this entry installs no `self:` method.
5. **`D-11-12-b` amended a fourth time, not closed**: a fourth narrow legibility
   claim (a ring is lit whole, and the outer ring is not, at the fire) joins the
   three before it. Still nothing asserts a card is readable.
6. **`D-11-10-b` MOVED**: five rows examined, TWO stale - SONAR's reads 432
   where the entry measures 558 at the defaults - thirteen unchecked. RADAR
   POINTS' row is new rather than re-checked, and SONAR's is left for 11-16.
7. **The LUMEN depth discrepancy**, unchanged and unreconciled since 11-09.2.
8. **The plan's frontmatter `requirements` list carries CAT-04 and CONT-01**,
   neither of which this plan touched; the same defect 11-15 reported.

---

## Known Stubs

**None.** The emitter, the wave, the arming, the release and the pitch walk are
all complete, reachable and driven by the test. **Three things are deliberately
absent and named rather than left as edges:**

- **The centre cell can be armed and sounds on step 0 of every ping**, at the
  root: it is bucket 0 by `math.atan(0,0)`. That is the emitter being a point
  like any other, and it is not special-cased.
- **Points on the same ring in the same direction share a pitch**, and points
  on the same ring sound together. Ring is time and direction is pitch; that is
  the geometry being honest, as SONAR's header says of its own.
- **Nothing is received (D-04)**, so a point cannot be placed from the other
  end of the wire.

---

## THE STATE.md TOOLING, COPIED BEFORE EVERY COMMAND AND DIFFED AFTER EACH

The warning that `advance-plan` destroys the Status line is now at **thirteen
consecutive waves**, and `record-session` ate the previous `Stopped at:` line
again, exactly as 11-15 first recorded.

| # | Command                 | What it did                                                                                                                                            | Repair                                                                                                                                                                         |
| - | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | `state advance-plan`    | **DESTROYED the Status line.** 11-15's narrative replaced by `Status: Ready to execute`, not demoted. Counter 17 to 18; prose left saying 11-14 is not complete. Frontmatter `status` set to `executing`. | Inverse edit from the pre-command copy: 11-15's text restored verbatim as `Previous status, retained (11-15):`, a new `Status:` written for 11-14, the Plan prose extended to name 11-14 as the eighteenth SUMMARY. **Every line below the splice diffed: 0 of 752 diverge** at a one-line offset. |
| 2 | `state update-progress` | Reported `percent: 99` and wrote nothing but `status: verifying` and a timestamp. **Frontmatter `percent` still reads 100.**                       | Left, and reported, as instructed.                                                                                                                                             |
| 3 | `state record-metric`   | Clean: `| Phase 11 P14 | 30min | 2 tasks | 11 files |` appended, nothing else touched.                                                          | -                                                                                                                                                                              |
| 4 | `state add-decision`    | Clean: three decisions added, one timestamp moved.                                                                                                     | -                                                                                                                                                                              |
| 5 | `state record-session`  | **DESTROYED the previous `Stopped at:` line** - *"Completed 11-15-PLAN.md (ran ahead of 11-14 ...)"* overwritten, not demoted - the second wave to record this. | `Previous stop, retained: Completed 11-15-PLAN.md (...)` inserted by hand from the pre-command copy. **Lines below the splice diffed: 0 of 34 diverge.**                        |

**`roadmap update-plan-progress` was NOT run**, as instructed, and
`.planning/ROADMAP.md` is byte-untouched. **`requirements mark-complete` was
NOT run** (deviation 6) and `REQUIREMENTS.md` is byte-untouched. The frontmatter
`status` reads `verifying`, which is what `update-progress` left after
`advance-plan`'s `executing`; not fought over.
