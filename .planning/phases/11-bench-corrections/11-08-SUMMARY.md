---
phase: 11-bench-corrections
plan: 08
subsystem: catalog
tags: [catalog, lua-entries, bench, touch, midi, budget, sweep, clock-sync]
requires:
  - phase: 11-bench-corrections
    plan: 07
    provides: "the PREV_FILES 84 / PREV_TESTS 848 / PREV_E2E 103 / BASE_CHECK 580 / sweep 4 19 / Pass A 20,782 baseline; the finding that every hand-authored header written before 10-08 quotes the DECLARED-PALETTE corner rather than the picker corner the 908 gate reads; and the instruction to ask whether a handler ever SEES a contact end before paying for a contact-end clear"
  - phase: 11-bench-corrections
    plan: 02
    provides: "touch-guard.spec.ts and the class-B convention every guard here is written in, and the +8 DOWNUP escape plus the @DECAY re-cut this plan costs MORPH against"
provides:
  - "EUCLID, SONAR and STEPS accept a drag, guarded by a per-contact last-cell table self.q[i] keyed on the 9x9 PAD CELL in all three"
  - "The store is s.q[i]=e<9 and <cell>, so a fast tap - a whole contact in one message with no lift to run the clear - never poisons the guard for the next tap"
  - "SONAR's centre is lit on LAYER 0, the one layer neither the sweep nor the arming touch writes, and it survives the sweep passing over it AND the trail expiring afterwards"
  - "SONAR's notes were never hanging: three fired, three released, every one exactly one @PERIOD later, and one step is the floor this card can express - reported, pinned, and NOT changed"
  - "Clock sync named as not built in the two entries that carry the request, with both blockers, and nothing stubbed, flagged or reserved"
  - "MORPH sends a corner only when that corner moved: 512 -> 255 messages on a top-edge stroke, 840 -> 450 under a jittering finger, and the two corners the finger is nowhere near send NOTHING"
affects: [11-09, 11-16]
tech-stack:
  added: []
  patterns:
    - "The arm layer's PHASE as the observable, not the frame: every one of these entries animates from a Timer, so a frame diff over a 130-tick gesture is mostly the Timer's own work. Each paints its armed state on a layer its Timer never writes, and that layer's phase IS the armed state, tick-independent"
    - "An invariant assertion beats a count: 'no CC ever restates its previous value' cannot pass on a card that suppressed the wrong corners, and it needs no expected number to drift"
    - "A negative check that will not redden is a signal about the CODE, not about the check. Dropping the contact-end clear could not redden the first guard shape written here; the shape was changed until it could, and the change was one character cheaper"
key-files:
  created: []
  modified:
    - src/lib/catalog/entries/euclid.ts
    - src/lib/catalog/entries/sonar.ts
    - src/lib/catalog/entries/steps.ts
    - src/lib/catalog/entries/morph.ts
    - src/lib/sim/lua-smoke.spec.ts
    - src/lib/catalog/frames.json
key-decisions:
  - "THE GUARD IS NOT THE SHAPE THE PLAN SKETCHED, and the reason is a measured bug rather than taste. `if s.q[i]==m then return end s.q[i]=m` swallows the SECOND fast tap on a cell - three taps read 0 -> 255 -> 255 -> 255 - because code 9 is a whole contact with no lift to run the clear. `s.q[i]=e<9 and m` escapes it for +8 and makes BOTH the escape and the clear load-bearing."
  - "ALL THREE ENTRIES KEY ON THE 9x9 PAD CELL, never on the entry's own inner index. STEPS's c+r*8 ALIASES over the whole pad (c=8,r=0 and c=0,r=1 are both 8) and EUCLID's ring position is nil for 33 of 81 cells. EUCLID stores the key BEFORE the ring lookup, so a finger that leaves a ring and comes back onto the same cell arms it again."
  - "SONAR'S CENTRE IS ON LAYER 0. Layer 1 would be erased by the first tap on the centre; LAYER 2 IS THE INTERESTING WRONG ANSWER because it looks right twice - lit at rest, lit under the sweep - and then the 42-tick decay runs it to black with nothing to put it back. Measured on that plant: [0,0,0] sixty ticks after the pass."
  - "SONAR'S NOTES WERE NEVER HANGING and nothing was changed. Reading 2 of the plan's two: notes ARE released, one step long, and one step is the FLOOR because this card has one timer whose resolution is one step. The behaviour is pinned by an assertion instead. The third reading - that the ARMED CELLS should fade - is a real design question and is left as one."
  - "MORPH'S PAINT IS DELIBERATELY LEFT UNCONDITIONAL, from the same local the send is guarded on. The picture is a readout and the wire is traffic; glp has no bus behind it, so repainting a corner that has not moved costs nothing and guarantees the picture cannot drift from the last value sent."
  - "THE PLAN'S FREE-CHARACTER FIGURE IS WRONG FOR THE FIFTH WAVE RUNNING, and STEPS carries 11-07's exact systematic error: its header quoted 391 / 517 free, the declared-palette corner. The picker corner was 394 / 514. EUCLID, SONAR and MORPH happen to be clean because each already declares 255,255,255 in a colour knob."
patterns-established:
  - "When a plan says to regenerate frames.json, check what the fixture SAMPLES first: it runs each entry with NO gesture, so a change to a touch callback cannot reach it. Only SONAR's five rows moved here, and only because a Setup paint moved."
requirements-completed: []
duration: 45m
completed: 2026-09-09
---

# Phase 11 Plan 08: The Swipe Family, and MORPH's Suppression — Summary

**Three entries could not be drawn on, and the reason was one line each: every MOVE was thrown away
before anything else happened. Measured through the real Lua host before the change, a 128-sample
swipe along row 4 armed 0 cells on EUCLID — its landing cell is not even on a ring — and exactly 1 on
SONAR and STEPS. All three now arm every eligible cell they cross, once each, and the toggle storm the
naive fix causes is measured rather than argued: unguarded, a still finger toggled its cell 209 times
in 209 samples. SONAR's centre is lit on layer 0, the one layer neither the sweep nor the arming touch
writes, and layer 2 — the plausible wrong answer — was planted and measured going black sixty ticks
after the sweep passed. SONAR's notes were never hanging: three fired, three released, every one
exactly one @PERIOD later, and one step is the floor this card can express, so nothing was changed and
the behaviour is pinned instead. MORPH's four CCs went from 512 messages on a 128-sample stroke to 255,
and the two corners the finger is nowhere near now send nothing at all. Clock sync is named as not
built in the two entries that carry the request, with both blockers, and nothing was stubbed.**

## Performance

- **Duration:** ~45 m
- **Tasks:** 3 of 3
- **Files:** 0 created, 6 edited
- **Commits:** `05940ad`, `e025d84`, `a5de4d9`, `743526f`

---

## Counts, as carried name plus delta

| Name                | Carried                | Declared | Observed                     | Agreement |
| ------------------- | ---------------------- | -------- | ---------------------------- | --------- |
| quick files         | `PREV_FILES` 84        | **+0**   | **84**                       | agrees    |
| quick tests         | `PREV_TESTS` 848       | **+2**   | **850** (+1 todo)            | agrees    |
| e2e                 | `PREV_E2E` 103         | **+0**   | **not run**, as the plan directs | agrees |
| sweep               | `4 19`                 | +0       | **4 19**                     | agrees    |
| `svelte-check`      | `BASE_CHECK` 580       | —        | **580**, 0 ERRORS 0 WARNINGS | agrees    |
| catalog             | 27 (9 preset + 18 Lua) | +0       | **27**, untouched            | agrees    |
| reachability Pass A | 20,782                 | +0       | **20,782**                   | agrees    |

`node scripts/check-counts.mjs 84 850` exited **0**. `node scripts/check-counts.mjs 4 19` exited **0**.
`npm run lint` clean; `npm run build` exit **0**; `npm run check` **580 FILES 0 ERRORS 0 WARNINGS**.
The reachability sweep re-observed **Pass A 20,782, Pass B 24,576, total 45,358 states, over budget 0,
Pass B colours excluded 0**, and the kind cross-product's **worst 906 of 908 at
none/none/trackpad/hi=false/grid=false**. The lua-entries sweep re-observed **1,174 combinations,
2,348 measurements**.

**The +2 is this plan's declared term and it splits with nothing left over**, both in
`src/lib/sim/lua-smoke.spec.ts`, 10 → 12:

| #  | Test | For |
| -- | ---- | --- |
| 11 | *"arms one cell per cell a swipe crosses, on EUCLID, SONAR and STEPS"* | task 01, **extended** by task 02 with SONAR's centre and its note release rather than a thirteenth test being added |
| 12 | *"sends a MORPH corner only when that corner moved, and never a stale zero"* | task 03 |

**`svelte-check` is +0**: no file was created. **`frames.json` moved on five rows, all SONAR's**, and
nothing else in the file changed.

**No agent connected to or wrote to a device, nothing was deployed, and nothing here is claimed as
hardware-verified.** All four notes came from the user's bench and only their bench can confirm any of
this. **No sibling repository was read or written.** `git checkout`, `git restore`, `git stash` and
`git clean` were not used at any point; every plant was reverted from a scratch copy with `sha256`
compared either side.

---

## The four costs, before and after, at the true worst corner

**Every figure is `max(GridScript.compressScript(lua).length, lua.length)` after `await padReady()`,
and every "worst" is the RGB444 PICKER corner (D-06) the 908 gate actually reads — not the
declared-palette corner an entry header written before plan 10-08 quotes.** Every rendering below is
canonical (`compressScript` returns it unchanged) and accepted by `checkSyntax`.

| Entry | Event | Before, defaults | Before, worst | After, defaults | After, worst | Delta | **Free at worst** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **EUCLID** | Setup | 702 | **706** | 786 | **790** | **+84** | **118** |
| EUCLID | Timer | 226 | 230 | 226 | 230 | +0 | 678 |
| **SONAR** | Setup | 432 | **433** | 558 | **559** | **+126** | **349** |
| SONAR | Timer | 279 | 282 | 279 | 282 | +0 | 626 |
| **STEPS** | Setup | 388 | **394** | 473 | **479** | **+85** | **429** |
| STEPS | Timer | 251 | 253 | 251 | 253 | +0 | 655 |
| **MORPH** | Setup | 523 | **527** | 575 | **579** | **+52** | **329** |

SONAR's +126 splits **+74 for the swipe guard (task 01) and +52 for the always-lit centre (task 02)**.

**EUCLID's final margin at the worst knob position is 118 characters. MORPH's is 329.** Nothing needed
trimming, no ask was cut, and there is no shortfall to report. The dearest card in the catalog is still
`tpad` at 907 of 908, untouched.

The all-shortest corner a picker can reach, for the record: EUCLID 781 / 225, SONAR 545 / 279,
STEPS 466 / 250, MORPH 569.

---

## The guard, and why it is not the shape the plan sketched

The plan's shape, costed exactly as written and measured at **778 at the defaults — the plan's own
predicted number, to the character**:

```lua
if e~=1 and e~=4 and e<9 then s.q[i]=nil return end
local m=x*9//128+y*9//128*9
if s.q[i]==m then return end
s.q[i]=m
```

**It has a bug, and EUCLID is the worst possible card to have it on, because tapping a cell is this
card's primary gesture.** Event code 9 is a whole contact in ONE message — a down and an up, no
separate lift — so the contact-end branch never runs for a tap, `s.q[i]` is still holding that cell
when the next tap arrives, and the tap is swallowed. Planted and measured through the real Lua host:

```
euclid cell 39, three fast taps: 0 -> 255 -> 255 -> 255
```

**A step that can be armed from the pad and never disarmed.** The shipped shape escapes it in the
store rather than in the test:

```lua
if s.q[i]==m then return end
s.q[i]=e<9 and m
```

`e<9 and m` evaluates to `false` for a tap, and `false` is never equal to a cell index, so the next tap
always lands. Measured after: `0 -> 255 -> 0 -> 255`. **Cost +8 characters**, and it is the same
`s.p[n]and 255 or 0` idiom these entries already ship.

### A shape was written, tested, and REPLACED, and the reason it was replaced is a negative check

The first shape written here deduped only drags — `if e==1 and s.q[i]==m then return end s.q[i]=m` —
which is correct, is CONSOLE's 11-07 idiom, and is **one character dearer**. It was replaced because
**the plan's negative check 2 could not redden against it**: with only MOVE deduped, dropping the
`s.q[i]=nil` clear breaks nothing, because a fresh press is `e==4` and bypasses the dedup entirely.
The clear would have been eleven characters of dead code defended by no check that could fail.

Under the shipped shape the clear is load-bearing and the check reddens exactly as the plan describes,
at `0 -> 255 -> 255`. **Both halves of the mechanism are now defended by a check that goes red, and the
whole thing is cheaper.** 11-07's rule — when a negative check comes back green, suspect the check —
turned out to have a second edge: sometimes the thing to suspect is the code the check is aimed at.

### The key: all three entries remember the 9x9 PAD CELL, and none of them remembers its own index

| Entry | Inner index | Why the guard does NOT use it | Key used |
| --- | --- | --- | --- |
| EUCLID | `self.i[m]` → `d*32+t`, a ring position | **nil for 33 of 81 cells** — the centre and the outermost square carry no step — so it is not a name for a place on the pad | `m = x*9//128+y*9//128*9`, stored **before** the lookup |
| SONAR | none; the cell *is* the index | — | `n = x*9//128+y*9//128*9` |
| STEPS | `n = c+r*8`, the 8x8 pattern index | **it ALIASES over the whole pad**: c=8,r=0 and c=0,r=1 are both 8, so a finger that swiped down the dark ninth column and then crossed into cell (0,1) would meet its own stale key | `a = c+r*9`, which `glp` already needed |

**EUCLID's ring-mapping reasoning, in full.** The guard stores `m` **before** `local v=s.i[m]` rather
than after. That is a behavioural choice, not an ordering accident: storing it before means a finger
that wanders off a ring onto a dead cell and comes back onto the SAME ring cell arms it again, because
it genuinely crossed it twice. Storing it only on a successful toggle would have swallowed the return.
It is also the cheaper of the two — one site instead of two.

**STEPS's key is `c+r*9` and it is the one place this entry differs from its two siblings.** It costs
nothing, because `glp(glag(0,a),2,...)` needed that expression anyway; the change actually removes the
second `c+r*9` the entry used to compute inline.

---

## The reversal, per entry, and what a twice-crossed cell now does

All three headers now record this as a reversal rather than a replacement. **STEPS's was the one
written down as a design statement** — its trap list read *"the guard is `e~=4 and e<9 then return`, so
onset is e == 4 or e > 8 and a move never toggles a cell"* — and the bench overrode it with *"same as
SONAR or EUCLID"*.

**What it costs, said plainly in all three headers: a swipe that crosses a cell twice toggles it
twice.** Dragging back over your own stroke erases it. That is correct for a toggle and it is **not**
what a paint gesture does.

**A set-rather-than-toggle swipe would paint, and it is named as a finding rather than shipped as an
interpretation.** It is not a guess about cost either: 11-07 measured that shape on CONSOLE's mute row
at **807 against 844**, thirty-seven characters cheaper than the dedup. What it is not is what the
bench asked for in so many words, and it would make a cell impossible to disarm by dragging — so it
is a bench question, recorded in `euclid.ts`'s header and cited from the other two.

### What the tests observed, printed

```
euclid: swipe across row 4 changed 6 cell(s) [37, 38, 39, 41, 42, 43], eligible [37, 38, 39, 41, 42, 43]
euclid: rested inside cell 39, 210 sample(s) delivered, 0 further change(s)
euclid: press, lift, press on cell 39: 0 -> 255 -> 0
euclid: three fast taps on cell 39: 0 -> 255 -> 0 -> 255
sonar:  swipe across row 4 changed 9 cell(s) [36, 37, 38, 39, 40, 41, 42, 43, 44], eligible [36, ..., 44]
sonar:  rested inside cell 39, 210 sample(s) delivered, 0 further change(s)
sonar:  press, lift, press on cell 39: 0 -> 255 -> 0
sonar:  three fast taps on cell 39: 0 -> 255 -> 0 -> 255
steps:  swipe across row 4 changed 8 cell(s) [36, 37, 38, 39, 40, 41, 42, 43], eligible [36, ..., 43]
steps:  rested inside cell 39, 210 sample(s) delivered, 0 further change(s)
steps:  press, lift, press on cell 39: 0 -> 255 -> 0
steps:  three fast taps on cell 39: 0 -> 255 -> 0 -> 255
```

The swipe assertion compares the **cells**, not the count, and the eligible set is derived from each
entry's own rule rather than pasted — 11-07's finding that a count-only assertion passes green on a
real off-by-one. Every sample in the resting probe is a **different coordinate inside the same cell**
(all 14 x-values by all 15 y-values), because the host's enqueue is change-gated on `(event, x, y)` per
contact and a probe that re-sent one point would have measured the host's dedup and called it the
entry's.

### The unguarded resting-finger count, and a second number that is just as loud

**209 changes over 209 further samples — one toggle per sample.** At the firmware's rate that is a
step flickering at 100 Hz under a still finger.

And the unguarded **swipe** changed **0 cells** — `[]`, not "the wrong cells". Each of the nine columns
is 14 or 15 raw coordinates wide, so an unguarded drag toggles each crossed cell 14 or 15 times, and
every even number lands back where it started. **A naive "just accept MOVE" fix would have looked
exactly like the bug it was fixing.**

---

## SONAR's centre: the layer was read, and the wrong layer was planted to prove it

`sonar.ts`'s Timer writes **layer 2** (`glpfs` + `glt(a,2,42)`) and armed cells are **layer 1**
(`glp(glag(0,n),1,...)`). Setup now writes cell 40 in `@SWEEPC` on **layer 0**, which neither touches.

| Moment | Centre cell 40, observed |
| --- | --- |
| tick 0, at rest | `[59,126,126]` |
| tick 7, **with the sweep on top of it** | `[116,248,248]` |
| tick 67, once the trail has expired | `[59,126,126]` |

It brightens under the sweep rather than being replaced by it, because the LED engine **adds** layers
before its single divide by 512. Cost **+52**, and **+0 against a hard-coded white** at the corner that
counts, since a colour token and `255,255,255` are the same eleven characters there — so the hub
follows the card's palette for free.

**Layer 1 was rejected by reading: it would be erased by the first tap on the centre. LAYER 2 IS THE
INTERESTING WRONG ANSWER and it was planted rather than argued** — it is lit at rest AND lit under the
sweep, so a test that only looked at those two moments would have passed it, and then the 42-tick decay
runs it to black with nothing to put it back. Planted: **`[0,0,0]` at tick 61**. The test therefore
looks three times, and the third look is the assertion; the layer number is then pinned by name as
well, so a future edit that moved the hub onto a layer that merely happens to be quiet today is caught.

---

## "Notes should disappear after a while": which reading the source turned out to support

**The second, and there is nothing to change.** Read before anything was designed, exactly as the plan
required.

`sonar.ts`'s Timer opens with `if s.z then for j=1,#s.z do s:gms(@CH,128,s.z[j],0,0)end end s.z={}` —
every note the previous fire started is released before anything new is played. Measured through the
real Lua host at the defaults:

```
sonar: 3 note(s) fired, 3 released after 7 tick(s), 0 still open at the end of 400 ticks
```

**Seven ticks is one @PERIOD.** Every note opened was closed, none was started twice without being
released in between, and the gate is exactly one step at every knob position by construction.

**And one step is the FLOOR.** This card has one timer and its resolution IS one step, so there is no
constant to shorten and no second event to hang a shorter release on. **Reading 1 — a missing or
mistimed note-off — is false. Reading 2 — a length that wants a shorter constant — is true of the ask
and impossible for the card.** So nothing was changed and the behaviour is now pinned by an assertion
that a future Timer edit cannot break silently.

**The third reading is raised as a finding, exactly as the plan directs.** The words could instead mean
that the ARMED CELLS should fade, so a pattern you drew decays on its own. That is a much larger
behaviour change — 81 per-cell countdowns with no spare table — it is not what *"notes should
disappear"* most naturally says, and **it is more attractive after this plan than before it, because a
swipe now arms nine cells where a tap armed one.** It is a bench question, in `sonar.ts`'s header.

---

## Clock sync: the double block, and where it is written

Written into **`sonar.ts`'s and `euclid.ts`'s headers**, two blocks, and CITED from `steps.ts` — which
carries the request only by reference (*"same as SONAR or EUCLID"*) — rather than restated a third
time.

**Blocker 1, the hardware answer is unknown.** `docs/MIDI-IN-PROBE.md` is a written, minifier-checked
264- and 328-character pair of probe scripts for exactly this question, and its Results section reads
**"None yet. This probe has not been run."** `gts` is dead on ZONA and `rtmrx_cb` is the only clock
route the hardware has, so **a NO on that probe closes this family rather than redirecting it.**

**Blocker 2, and it does not open when the first does.** HANGAR's Lua host has no inbound MIDI path of
any kind: `grxm` is a recorded no-op that discards its slot argument entirely (`lua-host.ts:455`,
`grxm: (_slot, mode) => this.grxm(mode)`), and neither callback is bound anywhere. **A clock-locked
card would run on a real ZONA and sit motionless in its own catalog card.** The prerequisite is a
synthetic MIDI source and a synthetic clock in `src/lib/sim/`, which is a phase and not a task.

**Nothing was stubbed, flagged or reserved.** No `@SYNC` knob was added to any of the four entries — a
reserved knob is a stamp slot, and a stamp slot spent on a feature that may never exist is a link
format nobody can take back.

### The grep, and the correction it needed

The plan's verification asks that `grep -rn "rtmrx_cb\|midirx_cb" src/` be **"still empty"**. **It was
never empty and it is not empty now**, and `MIDI-IN-PROBE.md` itself says so: there has always been one
match, a sentence of prose in `src/lib/catalog/audition.spec.ts:248`. After this plan there are **six**,
because the two blocker notes name the callbacks in order to explain them.

**The claim that can actually be checked is about ASSIGNMENT and BINDING, and it is zero:**

```
$ grep -rnE "(midirx_cb|rtmrx_cb)[[:space:]]*[=:]|\"(midirx_cb|rtmrx_cb)\"|'(midirx_cb|rtmrx_cb)'" src/
(no output)
```

No host binding, no `HOST_GLOBALS` or `HOST_SELF_METHODS` member, no catalog entry's Lua, no
`self.<callback>=` anywhere. **That is the honest proof that nothing here was stubbed**, and commit
`743526f` corrects both headers, which had inherited the plan's version of the claim and would have
been false the moment they were written.

---

## MORPH's suppression, with its message counts before and after

`self.p={0,0,0,0}` in Setup; the send loop became:

```lua
for j=1,4 do local z=w[j]if z~=s.p[j]then s.p[j]=z s:gms(@CH,176,@CCB+j,z,0)end
  local b=s.k[j]for d=0,3 do glp(glag(0,b+d%2+d//2*9),1,z*2)end end
```

**`s.p` is indexed by CORNER and not by contact, and that was checked rather than assumed**: the
callback's first line is `if i>0 or e==3 or e>=5 and e<9 then return end`, so the card is
single-contact by construction. If that guard ever moves, the table's key has to move with it — which
is now a sentence in the header.

### The counts

| Stroke | Samples accepted | Messages **before** | Messages **after** | Per CC, after |
| --- | --- | --- | --- | --- |
| top edge, y = 0 | 128 | **512** | **255** | 16: 128, 17: 127, **18: 0, 19: 0** |
| jitter inside one cell | 210 | **840** | **450** | 16: 112, 17: 112, 18: 113, 19: 113 |

**The top-edge stroke is not a convenient example, it is the arithmetic.** At `y = 0` both `u*y//127`
and `x*y//127` are exactly 0 for every x, so the two bottom corners never leave zero for the whole
stroke — and with `self.p` initialised to zeros **they send nothing at all, over 128 samples**. That is
the bench's *"don't send 0 value"* stated as arithmetic rather than as a complaint.

### The two readings of "don't send 0 value", and the one taken

**Taken:** *a corner that is at zero and was at zero sends nothing, and a corner that FALLS to zero
sends zero exactly once.* The zero-initialised table delivers both halves with one mechanism.

**Rejected:** *never emit a 0 at all.* It fails on the gesture the card exists for. The finger has to
be able to LEAVE a corner; under the literal reading the receiver would hold the last non-zero value of
every corner the finger walked away from, forever, so a slide from one corner to the opposite one would
leave both macros up. **That is a worse bug than the one being reported.**

Both readings are written into `morph.ts`'s header as readings, in the entry's own words, and the
departed corner's single zero is asserted by name: on a top-edge stroke CC 16 runs 127 down to 0, and
the test asserts there is **exactly one** zero in its 128 messages and that it is that corner's **last
word** rather than a value it passed through.

### The paint decision, and why it went the other way

**The paint is deliberately left unconditional**, from the same local `z` the send is guarded on. A
suppressed send with a suppressed repaint is one decision and a suppressed send with a live repaint is
another; this is the second, **because the picture is a READOUT and the wire is TRAFFIC**. `glp` is a
local write with no bus behind it, so repainting a corner that has not moved costs nothing and
guarantees the picture cannot drift from the last value sent — which is the failure mode a shared guard
would have introduced. **`frames.json` therefore did not move for MORPH**, and its Setup paint is
byte-identical.

---

## `frames.json`: five rows, all SONAR's

| Entry | Rows moved | Why |
| --- | --- | --- |
| **sonar** | **5 of 5** | the always-lit centre is a **Setup** paint, which is exactly what the fixture samples |
| euclid | 0 | its Setup gained `self.q={}`, which paints nothing |
| steps | 0 | same |
| morph | 0 | same, and the paint decision left the picture identical |

SONAR's tick 0 goes **0 → 3 non-zero bytes** — the hub, three colour channels of one cell — and tick
101, 500 and 1009 each gain 3. Tick 37's count stays at 81 because the sweep already lights a wedge
containing the centre there; its hash moves because the centre is brighter.

**`restsBlack` stays `false` and its comment was rewritten**, because the fact underneath it changed:
SONAR used to be genuinely black at tick 0 and non-black at every sampled tick after, and it is now
non-black everywhere.

**The regeneration was verified in both directions**: `UPDATE_FRAMES=1` rewrote the fixture and failed
by design, and the plain re-run then passed 5 of 5.

---

## The eight negative checks, with exit codes

Six were planned; eight were run, because the guard-shape decision needed its own two. Every plant was
reverted from a scratch copy with `sha256` compared either side.

| # | Task | Plant | Observed | Planted exit | Restored |
| - | ---- | ----- | -------- | ------------ | -------- |
| 1 | 01 | EUCLID accepts MOVE with **no guard at all** | swipe assertion red: *"A SWIPE MUST ARM EVERY CELL IT CROSSES... Observed []"* — **zero cells, because each is toggled 14–15 times**; separately measured, **209 changes in 209 samples** resting | **1** | exit 0 |
| 2 | 01 | the plan's bare `s.q[i]==m` dedup, **no `e<9 and` escape** | three-fast-taps assertion red: *"Observed 0 -> 255 -> 255 -> 255"* | **1** | exit 0 |
| 3 | 01 | `s.q[i]=nil` clear dropped | second-contact assertion red: *"Observed 0 -> 255 -> 255"* | **1** | exit 0 |
| 4 | 01 | the clear written bare as `if e==3 or e>=5` | `touch-guard.spec.ts` **test 1** red by name: *"euclid.setup writes `if e==3 or e>=5`"* | **1** | exit 0 |
| 5 | 02 | SONAR's hub written on **layer 2**, the sweep's own layer | *"THE CENTRE MUST SURVIVE THE SWEEP PASSING OVER IT... Observed [0,0,0] at tick 61"* | **1** | exit 0 |
| 6 | 02 | SONAR's note-release loop removed | *"EVERY NOTE THE SWEEP STARTS MUST BE RELEASED... expected [ 46 ] to deeply equal []"* — **the hanging note named** | **1** | exit 0 |
| 7 | 03 | MORPH's `z~=s.p[j]` comparison removed | *"A CORNER MUST NOT BE RE-SENT WHEN IT HAS NOT MOVED... Observed 512"* of 512 — and 840 of 840 on the jitter stroke | **1** | exit 0 |
| 8 | 03 | `self.p={-1,-1,-1,-1}` | *"cc 17 (top right) opened with a 0. self.p={0,0,0,0} is half of the mechanism"* | **1** | exit 0 |

**Check 3 is the one that changed the code.** Run against the first guard shape written here it came
back **green**, and the shape was replaced rather than the check re-aimed — see the guard section.

**Check 6 had to be re-ordered before it could name the right thing.** With the release removed, no
note-off is ever paired to a note-on, so a run that asserted `gaps.length > 0` first failed with *"the
sweep fired nothing"* — the wrong diagnosis for a hung note. The assertions were reordered so
non-vacuity sits on the note-**ons** and the hanging-note assertion fires first, naming note 46.

**Check 8 fires one assertion earlier than the plan predicts, and the mechanism is the same one.** The
plan expects the never-touched-corner assertion; the *"no corner opens with a zero"* assertion comes
first in the loop and catches it at CC 17. Both are red under that plant — with `-1` every corner
announces its zero on the first sample — and the earlier one names the initialiser directly.

Restore hashes, compared before and after every plant: `euclid.ts`
`f669d484…` then `03047ba9…`; `sonar.ts` `f5278bf7…`; `morph.ts` `de9746b5…`.

---

## The vendored tree: nothing moved

```
$ git diff --stat HEAD -- src/vendor/
(no output)

$ git diff --stat 4131ff5 HEAD -- src/vendor/          # 11-03's tip to now
 src/vendor/botor/_pad.ts               | 70 ++++++++++++++++++++++++++--------
 src/vendor/botor/pad-sim.ts            | 29 ++++++++++----
 src/vendor/botor/tests/pad-sim.test.js | 19 +++++----
 src/vendor/botor/tests/pad.test.js     |  7 +++-
 4 files changed, 92 insertions(+), 33 deletions(-)
```

Byte for byte 11-04's through 11-07's recorded output. `git diff --quiet 9d06b00 HEAD --
src/lib/fidelity/firmware-oracle.spec.ts` exits **0**: green and **unedited**; it was not opened.
`git diff --quiet 2d249f3 HEAD -- src/lib/fidelity/upstream-manifest.json` exits **0** — **the four
mislabelled *"free at its worst knob position"* rows are untouched for the fifth wave running** and
still belong to 11-16.

`decay-idiom.spec.ts` and `touch-guard.spec.ts` are green and **`DECLARED_EXCEPTIONS.length` is still
2**. No new exception row was added; the clear is written in the LIVE spelling
(`e~=1 and e~=4 and e<9`), which the convention names as self-guarding.

---

## Deviations from Plan

### Auto-decided

**1. [Rule 1 — bug] The guard escapes the fast tap in the store, which the plan's shape does not**

- **Found during:** Task 01, costing the plan's shape before writing it.
- **Issue:** `if s.q[i]==m then return end s.q[i]=m` swallows every fast tap after the first on the same
  cell, because code 9 carries no lift and the contact-end clear never runs. Measured:
  `0 -> 255 -> 255 -> 255`. On EUCLID, whose own header calls tapping the primary gesture, that is a
  step that can be armed and never disarmed.
- **Fix:** `s.q[i]=e<9 and m`, +8 characters. Asserted by a fourth probe in test 11.
- **Commit:** `05940ad`

**2. [Rule 1 — bug] The first shape written here was replaced because a negative check would not redden**

- **Issue:** `if e==1 and s.q[i]==m` (dedupe drags only, CONSOLE's 11-07 idiom) is correct and one
  character DEARER, and it makes the `s.q[i]=nil` clear dead code — dropping the clear changed nothing
  observable, so eleven characters were defended by no check that could fail.
- **Fix:** the shipped shape, under which check 3 reddens exactly as the plan describes. Both numbers
  are in this SUMMARY so the choice is auditable rather than asserted.
- **Commit:** `05940ad`

**3. [Rule 2 — missing correctness] STEPS keys on `c+r*9`, not on the pattern index**

- The plan asks that the key be "consistent with whichever index the toggle uses" and leaves the choice
  open. `c+r*8` aliases over the full pad, so it was rejected with the collision written into the
  header. Costs nothing: `glp` needed the expression anyway.
- **Commit:** `05940ad`

**4. [Rule 1 — bug] STEPS's declared corner was corrected while the file was open**

- Its header claimed 391 / 517 free. That is the declared-palette corner; the picker corner the 908
  gate reads was **394 / 514**. The same correction CONSOLE's and FORGE's headers received in 11-07,
  now on a third entry. Fifteen minus one remain unchecked.
- **Commit:** `05940ad`

**5. [Rule 1 — bug] Both headers' clock-sync grep claim was false as written**

- They inherited the plan's *"appears nowhere under `src/`"* phrasing, which was already untrue of
  `audition.spec.ts` and became untrue six times over the moment the notes themselves named the
  callbacks. Re-aimed at assignment and binding, which is zero and checkable.
- **Commit:** `743526f`

**6. [judgement] SONAR shipped NO change to its note handling**

- The plan permits either outcome and forbids inventing a fix. The source already releases every note
  after exactly one step, which is the floor. A named non-delivery carrying its measurement, plus a new
  assertion so the behaviour cannot regress silently.
- **Commit:** `e025d84`

No Rule 4 checkpoints were reached. **The closest call was SONAR's third reading** — the armed cells
fading — and it was resolved by measuring, costing it in prose and handing it to the bench, because the
plan's own instruction is that it is a question rather than a choice.

---

## What the plan asserts that the tree does not support

Nine, and none was reconciled into a passing number or a quieter sentence.

### 1. The `rtmrx_cb` / `midirx_cb` grep is not empty and never was

The plan's verification reads *"`grep -rn "rtmrx_cb\|midirx_cb" src/` still empty — the honest proof
that nothing was stubbed."* It has always returned `audition.spec.ts:248` and it now returns six lines,
five of them this plan's own blocker notes. `MIDI-IN-PROBE.md` documents the pre-existing match in its
own words. The checkable proof is assignment and binding: **zero**.

### 2. "SONAR's notes stop instead of hanging" — they never hung

The plan's `must_haves` presumes a hang. Measured: three fired, three released, all at exactly one
@PERIOD, none left open after 400 ticks. Reading 2 of the plan's two, and the constant is already at its
floor.

### 3. STEPS has 514 free at worst, not 518 — and its own header said 517

The plan states *"STEPS (388, 518)"* and the entry header said 391 / 517. The picker corner is **394,
514 free**. This is 11-07's systematic finding on a third entry. EUCLID, SONAR and MORPH are clean by
accident — each already declares `255,255,255` in a colour knob.

### 4. EUCLID's pre-change Setup is 706 at the corner that counts, not 702

702 is the defaults. The plan's *"702 → 778, +76, 130 free"* is exactly right at the **defaults** for
the shape it sketches — 778 measured, to the character — and 130 free is a defaults figure too. At the
picker corner that shape is 782 / 126, and the shipped shape is **790 / 118 free**.

### 5. MORPH has 381 free at worst before this plan, not 400

The plan's *"507 at defaults and 508 at worst, so 400 free"* is the pre-11-02 text. After 11-02's +8
DOWNUP escape and the `@DECAY` re-cut, MORPH was **523 / 527, 381 free**, and it is **579, 329 free**
after this plan.

### 6. Negative check 2 of task 01 does not redden against the shape it was written for

See deviation 2. The plan's clear-dropping check is only meaningful against a guard that dedupes the
onset as well as the drag. The code was changed rather than the check.

### 7. `frames.json` does not move for three of the four entries

The plan asks for regeneration in all three tasks. The fixture samples each entry with **no gesture at
all**, so a change to a touch callback cannot reach it. Only SONAR's five rows moved, and only because
a Setup paint moved.

### 8. "For a finger held still, the message count after the first sample is zero" is not measurable

The host's enqueue is change-gated on `(event, x, y)` per contact, so a truly motionless finger delivers
**no sample at all** — asserting zero messages would have measured the host's dedup and called it
MORPH's, which is 11-07's stated trap. Replaced with a **jittering** finger (210 distinct coordinates
inside one cell, 840 → 450) and with the strictly stronger invariant **no CC ever restates its previous
value**, which cannot pass on a card that suppressed the wrong corners.

### 9. MORPH's negative check 2 fires one assertion earlier than predicted

`{-1,-1,-1,-1}` reddens at *"no corner opens with a zero"* (CC 17) before the never-touched-corner
assertion. Both are red; the earlier one names the initialiser directly, which is what the check is
for.

---

## Known Stubs

None. All four bench notes this plan carries are shipped and measured, except SONAR's clock sync and
its third-reading fade, which are **named non-deliveries** carrying their blockers and their costs in
the entry headers where the next author will read them. **Nothing here is hardware-verified** and this
SUMMARY says so in three places, because these four notes came from the user's bench and only their
bench can confirm any of them.

---

## Requirements

`requirements-completed` is empty on purpose. The plan's frontmatter lists `[CONT-02, TUNE-05]` and
**both are already `[x]`**:

- **CONT-02** — re-observed: all eighteen hand-authored entries still canonical, in budget on both
  events at the defaults and at every corner, running in a real Lua VM. `lua-entries.sweep.spec.ts` is
  green at **1,174 combinations / 2,348 measurements**, and the four entries this plan touched are the
  four that moved.
- **TUNE-05** — re-observed at **over budget 0 across 45,358 states, Pass B colours excluded 0**, with
  the kind cross-product's worst at **906 of 908**. The dearest margin this plan created is EUCLID's
  **118 free at the worst knob position**, well inside.

---

## For the waves that follow

- **11-09 owns MORPH's "mapping mode" and this plan did not touch it.** `morph.ts`'s header now says so
  explicitly and names the suppression as a separate, delivered clause, so the checkpoint is not
  presented with a file that looks already answered.
- **SONAR's third reading is the open bench question this plan created**: should the ARMED CELLS fade?
  It is more attractive after this plan than before it, because a swipe now arms nine cells where a tap
  armed one. Costed in prose in `sonar.ts`, not guessed.
- **The set-rather-than-toggle swipe is the other open bench question**, in `euclid.ts`, with 11-07's
  measured 37-character saving beside it.
- **11-16 gains nothing new and loses one row from (f):** STEPS's header now quotes the picker corner,
  so the wrong-corner count is three corrected (CONSOLE, FORGE, STEPS) and fourteen unchecked.
- **The four mislabelled `upstream-manifest.json` rows are still untouched**, fifth wave running.
- **An untracked `.planning/phases/11-bench-corrections/CANVAS-CONTEXT-LOSS.md` was present in the
  working tree throughout this plan and was not written, read into, or committed by it.** It appears to
  belong to the e2e-flake diagnosis 11-07 asked for. Left exactly as found.
- **`PREV_FILES` 84 · `PREV_TESTS` 850 · `PREV_E2E` 103 · `BASE_CHECK` 580 · sweep `4 19` ·
  reachability Pass A 20,782 · catalog 27 (9 preset + 18 Lua)** are what wave 9 carries forward.

---

## Commits

| Commit | Task | What |
| --- | --- | --- |
| `05940ad` | 11-08-01 | three entries answer a finger, and the toggle storm is designed out |
| `e025d84` | 11-08-02 | SONAR's centre never goes out, and clock sync is named as not built |
| `a5de4d9` | 11-08-03 | MORPH stops repeating itself, and stops shouting zeros |
| `743526f` | 11-08-02 | the clock-sync note cites the grep that can actually prove it |

---

## Self-Check: PASSED

- `src/lib/catalog/entries/euclid.ts` — FOUND; `self.q={}`, `if e~=1 and e~=4 and e<9 then s.q[i]=nil`,
  `s.q[i]=e<9 and m`, the reversal and the MIDI-sync blockers in the header
- `src/lib/catalog/entries/sonar.ts` — FOUND; `self.q={}`, `s.q[i]=e<9 and n`,
  `glc(h,0,@SWEEPC,1)glp(h,0,255)`, the clock-sync blockers and the note-reading in the header
- `src/lib/catalog/entries/steps.ts` — FOUND; `self.q={}`, `s.q[i]=e<9 and a`, the `c+r*9` key, the
  reversal, the corrected corner
- `src/lib/catalog/entries/morph.ts` — FOUND; `self.p={0,0,0,0}`, `if z~=s.p[j]then s.p[j]=z`, the two
  readings of "don't send 0 value" in the header
- `src/lib/sim/lua-smoke.spec.ts` — FOUND, 12 tests (10 → 12)
- `src/lib/catalog/frames.json` — FOUND, five SONAR rows moved, re-sampled green afterwards
- Commits `05940ad`, `e025d84`, `a5de4d9`, `743526f` — all four FOUND in `git log --oneline --all`
- `check-counts.mjs 84 850` exit 0; `check-counts.mjs 4 19` exit 0; `npm run check` 580 files 0 ERRORS
  0 WARNINGS; `npm run lint` clean; `npm run build` exit 0
- `git diff --stat HEAD -- src/vendor/` **empty**; `git status --porcelain` carries only the untracked
  `CANVAS-CONTEXT-LOSS.md` this plan did not create; no server left running
