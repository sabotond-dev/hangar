---
phase: 11-bench-corrections
plan: 09
subsystem: catalog
tags: [stage, arc, pomodoro, breathe, gesture, budget, rgb444, stamp, shape-character, checkpoint]
requires:
  - phase: 11-bench-corrections
    plan: 08.1
    provides: "the PREV_FILES 84 / PREV_TESTS 853 / PREV_E2E 86 source + 105 runs / BASE_CHECK 580 / sweep 4 19 / catalog 27 baseline, and the lesson that a negative check which comes back green is a finding about the check"
  - phase: 11-bench-corrections
    plan: 07
    provides: "the RGB444-picker-corner defect, found in CONSOLE, FORGE and STEPS"
provides:
  - "ARC's 3x3 heart is scaled by the same depth its controller is scaled by, so the picture is the amplitude - proved by a rank correlation at three depths, not by a brightness literal"
  - "POMODORO carries six intervals with 1 and 5 APPENDED, and four payload literals captured before the change prove indices 0..3 still name 15, 20, 25 and 50"
  - "STAGE has a third zone state - the scene you are lining up - breathing at rate 10 on the idle base, selected by SLIDING onto the zone"
  - "STAGE's header corrected from the declared-palette corner to the RGB444 picker corner: STAGE is the FIFTH entry confirmed with that defect"
  - "The selection gesture costed four ways with three measured rejections, recorded in the entry header rather than only in this SUMMARY"
  - "The four checkpoint answers, recorded verbatim, with the finding that three of the four fell outside the option set they answered"
affects: [11-09.1, 11-09.2, 11-10, 11-15, 11-16]
tech-stack:
  added: []
  patterns:
    - "A painter that has to express THREE states takes two independent axes, not one wider enum: Z(z,f,g) splits the layer-1 rate from the layer-2 base and the third state is the cross of the other two"
    - "'nothing is selected' spelled as an equality against another field (self.p == self.l) rather than as an out-of-range sentinel, so consuming the selection is free"
    - "A behaviour test asserts SEPARATION between observed cycle counts, never a rate literal, so re-tuning stays green and only a collapse reddens"
key-files:
  created: []
  modified:
    - src/lib/catalog/entries/arc.ts
    - src/lib/catalog/entries/pomodoro.ts
    - src/lib/catalog/entries/stage.ts
    - src/lib/sim/lua-smoke.spec.ts
    - src/lib/share/stamp.spec.ts
key-decisions:
  - "STAGE's selection gesture is the SLIDE (event code 1), because it is the only candidate that adds a state without reversing an installed card's cut behaviour"
  - "The tap-versus-hold discrimination is rejected: it is exactly what the class-B parity gate forbids, measured red"
  - "A second contact is rejected despite being deliverable, because a mouse has one pointer and the preview must show the headline gesture"
  - "No knob was added to STAGE, so its shape character stays 'c' and no shared STAGE link is demoted"
  - "listing.ts is deliberately unchanged, and the entry header says why"
patterns-established:
  - "An entry header quoting a budget corner names WHICH corner, and the four corners are quoted together"
requirements-completed: [CONT-02, SHARE-01, SHARE-03, TUNE-05]
duration: 57min
completed: 2026-09-09
---

# Phase 11 Plan 09: ARC's amplitude, POMODORO's two intervals and STAGE's breathing state Summary

**Two bench notes that admitted one reading each shipped before the pause; the pause returned four answers of which three fell outside their own option set; and STAGE finally got the third zone state its shipped copy has promised since Phase 9 - authoring work costed against 390 free at a corner two different documents had quoted wrongly.**

## Performance

- **Duration:** 57 min across two executor sessions (task 01 at 22:45 CEST, the checkpoint answered at 22:48, task 03 committed at 23:42)
- **Tasks:** 3 of 3 (task 02 is the checkpoint, answered)
- **Files modified:** 5

---

## The counts, as a carried name plus a delta

| Name | Carried | Observed | Delta |
|---|---|---|---|
| `PREV_FILES` | 84 | **84** | +0 |
| `PREV_TESTS` | 853 | **856** | **+3** |
| `PREV_E2E` | 86 source titles / 105 runs | **86 source titles** | +0 (the suite is not run by this plan) |
| `BASE_CHECK` | 580 | **580**, `0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` | +0 |
| sweep members | `4 19` | **`4 19`** | +0 |
| catalog | 27 | **27** | +0 |

`npm run test:quick 2>&1 | node scripts/check-counts.mjs 84 856` exits **0**:
*"observed 84 files, 856 tests passed, 1 todo"*.
`npm run test:sweep 2>&1 | node scripts/check-counts.mjs 4 19` exits **0**.

**The `+3` breaks down as `lua-smoke.spec.ts` 12 -> 13 and `stamp.spec.ts` 8 -> 9 in
task 01, and `lua-smoke.spec.ts` 13 -> 14 in task 03.**

### The plan's declared term was a latent chain break, and it is named rather than quietly fixed

**The plan as first drafted declared task 03's term as `+0` while the same task's
own action text said "if nothing does, add it."** Both cannot be true. The
re-scope at `b4e245b` resolved it **in favour of the test** and moved 11-09's
term from `+2` to `+3`, and the tree now agrees with `+3` exactly. **This is a
plan defect and 11-16 owns it**: a task that declares a term and then instructs
work that changes it is a chain break that only shows up in the wave after.

### The sweep totals, and one carried figure that the tree does not support

**The carry-forward figure `Pass A 20,782` is NOT stale and did NOT move.** The
brief said it predates task 01 and should be re-measured because POMODORO's two
appended `@MINS` values would move it. **They could not have, and they did not.**
Observed on this tree:

| Sweep readout | Observed | Carried | Moved? |
|---|---|---|---|
| stamp round-trip, **the compiler route** | Pass A **20,782**, Pass B 24,576, total 45,358 | 20,782 | **no** |
| reachability sweep | Pass A **20,782**, Pass B 24,576, total **45,358** states | 20,782 | **no** |
| stamp round-trip, **the Lua route** | Pass A **49,824** (format w 49,424, format x 382), Pass B 118,784, total **168,608** | 49,792 | **yes, +32** |
| `lua-entries` sweep | **1,176** combinations, 2,352 measurements | 1,174 | **yes, +2** |

**The reason is structural, not incidental.** `Pass A 20,782` belongs to the
*compiler* route, which enumerates compiled `PadState`s; POMODORO is a
hand-authored Lua entry and its knobs can only reach the *Lua* route. **This is
reported as a finding, not reconciled**: downstream plans should carry
**20,782 unchanged** for the compiler route and **49,824 / 168,608** and
**1,176** for the two figures that really moved.

One further readout, pre-existing and untouched by this plan, worth carrying:
the kind cross-product sweep counts 1,296 combinations with **worst 906 of 908**
at `none/none/trackpad/hi=false/grid=false`.

---

## Task 01 - ARC's amplitude and POMODORO's two intervals (`c9a621a`)

Shipped by the previous executor **before** the checkpoint, because neither note
depended on an answer. Recorded here in full so this SUMMARY is the plan's whole
record.

### ARC: the picture stopped lying

The 3x3 heart was painted with the **raw** triangle while the CC went out
**depth-scaled**, so at the bottom edge of the pad - `s.d = 127 - y = 0` - the
controller pinned at 64 and the card was sending nothing at all while the heart
went on swinging its full 0..254.

| depth | heart travel before | heart travel after | cc excursion from 64 |
|---|---|---|---|
| 127 (top edge) | 254 | 254 | 64 |
| 63 (middle) | 254 | **126** | 32 |
| 0 (bottom edge) | 254 | **0** | 0 |

- The scale is `v*s.d//127`, **+9 characters, not the +21 the plan costed** - a
  local binding was not needed. Timer **251 -> 260** at the defaults,
  **253 -> 262** at the RGB444 picker corner, **646 free of 908**. Setup untouched.
- Painting the emitted byte itself was considered and rejected in the header: at
  zero depth that is a constant 128, a heart glowing on a card that is sending
  nothing - the same lie in a quieter voice.
- Both `glt(a,2,65535)` keeper timeouts untouched, confirmed again by this task:
  `grep -n "65535" src/lib/catalog/entries/arc.ts` still reports the header note
  and both Lua sites.

### POMODORO: six intervals, the two new ones APPENDED

`@MINS` is now `["15", "20", "25", "50", "1", "5"]`.

- **The worst corner did not move and could not have: 743 / 659 at the RGB444
  picker corner before and after**, because that corner takes each knob's
  *longest* value and the two new ones are shorter. What moved is the
  all-shortest corner, **717 -> 716** on the Setup - which is also the proof
  that `@MINS` reaches exactly one site.
- **POMODORO's header quoted 735 / 649 - the declared-palette corner, not the one
  the gate reads. Corrected to 743 / 659**, 165 and 249 free. The **fourth**
  entry with that defect after CONSOLE, FORGE and STEPS.
- The ring arithmetic holds at both new values: `m = s.t*32//s.n` takes all 33
  values 32..0, a step is **1.875 s at n=60** and **9.375 s at n=300**, the drain
  is monotone and exactly one alarm note-on is sent.
- **The 655-second `glt` ceiling belongs to the LONG intervals, not the new short
  ones.** The breathe is still advancing at t = 700 s at 1, 5 and 25 minutes
  alike. The obvious worry was the wrong one, and saying so stops the next reader
  worrying about it.
- The keeper `glt(a,2,60000)` and the 300-second re-issue are untouched.

### The four captured stamp literals

Captured with the encoder **as it stood before the append** and committed as
literals, asserted after the change against the **value** each index names rather
than against the index:

| payload | index | must still decode to |
|---|---|---|
| `wn0f2145f31` | 0 | **15** minutes |
| `wn1f2145f31` | 1 | **20** minutes |
| `wn2f2145f31` | 2 | **25** minutes |
| `wn3f2145f31` | 3 | **50** minutes |

This is the **only** guard against the insertion mistake: `stamp.spec.ts`
otherwise compares indices and would have stayed green through a re-pointing.

### POMODORO shipped ahead of the checkpoint, and why

*"make a 1 minute and a 5 minute one"* is the least ambiguous note on the whole
bench and nothing in it depends on an answer. Holding it behind a conversation
about STAGE would have cost a wave for nothing. **Only STAGE was gated.**

### The price of the append, stated as a price

Appending is still a **RESIZE**, and the shape character is a resize tripwire.
`stamp.ts:324`'s `shapeOf` sums a rack's option counts, so POMODORO moves from
**5 knobs / 20 options** to **5 knobs / 22 options** and its shape character
moves **`n` -> `p`**. Every POMODORO stamp minted before this change now lands
**`older`** instead of `restored`.

- The one `wild-stamps.json` payload it demotes is **`xn33333`** (format x, all
  five knobs at index 3). The fixture is **NOT regenerated and NOT edited** - the
  expectation moved into `stamp.spec.ts`, where the reason can be written down,
  gated on `record.entry === "pomodoro"` so a second entry appearing in that
  branch is a signal that somebody is resizing knobs casually.
- **HANGAR has never been public, so no real shared link exists yet.** That is
  what makes this affordable exactly once, and it is why STAGE did not spend it
  a second time.

---

## Task 02 - the checkpoint, ANSWERED

Answered by the user on **2026-09-09**, recorded verbatim in
`.planning/phases/11-bench-corrections/11-09-ANSWERS.md`, committed at
**`c530d87`**. Not re-asked.

> 1. **STAGE** - *"implement breathing as planned"*
> 2. **ARC** - *"i meant to add stopping and resuming tap as a feature"*
> 3. **LUMEN** - *"try it but we observed no difference in the LEDs"*
> 4. **MORPH** - *"when you tap morphs corners it should only send one MIDI message"*

**Three of the four answers came back OUTSIDE the option set they answered, and
that is a result about the options rather than something to absorb silently.**

| Note | Which option | What that means |
|---|---|---|
| STAGE | `stage-third-state` | the only answer inside its option set - **task 03 of this plan** |
| ARC | **neither** | new feature work on an entry with no toggle at all - **11-09.1**, task 01 |
| LUMEN | **neither** | an investigation, not a ramp and not a stream - **11-09.2**, both tasks |
| MORPH | **neither** | a fourth reading, cheaper than all three costed - **11-09.1**, task 02 |

**ARC's answer CLOSES a live worry rather than opening one.** The open question
was whether the hardware did something the simulator does not reproduce - which
would have meant the preview was lying about a shipped card. It does not: the
user was describing what they **want**, not what they saw. Nothing about the
simulator is in doubt, and `arc-hardware` is **not** handed to 11-16 as a bench
row.

**MORPH's answer makes `morph-assign` cheap rather than expensive.** The option
named the selection gesture as the costly part; `self.k = {0,7,63,70}` already
declares four corner blocks, so **the corner tap IS the selection** - no latch,
no mode, nothing to exit.

### The other three answers are HANDED ON, by name, not carried as open items

- **ARC** - stop/resume as a tap toggle: **`11-09.1`, task 01**.
- **MORPH** - one tap, one MIDI message: **`11-09.1`, task 02**.
- **LUMEN** - does the depth knob reach the LEDs at all: **`11-09.2`**, both tasks.

**MORPH's three clauses are still reported SEPARATELY**, because a note reported
as "answered" when one-third of it was is the failure this phase's gates exist to
catch:

| MORPH clause | Owned by | State |
|---|---|---|
| the stuck colours | **11-02** | closed |
| *"if something doesn't change don't send it don't send 0 value"* | **11-08** | closed |
| *"mapping mode needed in"* | **11-09.1**, task 02 | answered here, not yet built |

MORPH's remaining margin is **the figure 11-08 left**, not the "400 free at
worst" this plan's interfaces section quoted before 11-02's `+8`, the `@DECAY`
re-cut and 11-08's suppression guard were spent against it. 11-09.1 must carry
11-08's figure and cost the chosen reading against that.

---

## Task 03 - STAGE's breathing state (`db3ab1a`)

### The budget figure was the wrong corner, twice over, and the plan's own two numbers did not agree

Measured on this tree at all four corners, before and after the work:

| corner | Setup before | Setup after | Timer before | Timer after | free before | free after |
|---|---|---|---|---|---|---|
| defaults | 505 | 640 | 109 | 136 | 403 | 268 |
| all-longest **declared** palettes | 511 | 646 | 109 | 136 | **397** | 262 |
| **RGB444 PICKER (D-06) - the one the gate reads** | **518** | **653** | **109** | **136** | **390** | **255** |
| all-shortest a picker can reach | 495 | 630 | 109 | 136 | 413 | 278 |

- **The entry header quoted `511 / 109, 397 free`** - the all-longest **declared**
  corner. Seven characters optimistic, corrected.
- **The plan quoted `505 Setup / 399 free`**, and that figure is wrong in a third
  way nobody has named: 505 is the **defaults**, not a corner, and **908 - 505 is
  403, not 399**. The plan's own two numbers do not agree with each other, and
  399 free corresponds to a Setup of 509, which is **none of the four corners**.
- The gap exists because STAGE declares two colour knobs, `@LIVEC` reaching
  **two** Setup sites and `@ZONEC` **one**, and its longest declared literal is
  nine characters against the picker's eleven.

**The work was costed against 390 free and leaves 255**: **+135 on the Setup and
+27 on the Timer** at the corner that binds.

### STAGE is the FIFTH entry confirmed quoting the declared-palette corner

After **CONSOLE, FORGE and STEPS** (11-07) and **POMODORO** (this plan's own task
01, which corrected 735/649 to 743/659). **Fifteen entry headers were never
checked; five are now confirmed wrong and all five are wrong in the dangerous
direction.** The running count is 11-16's.

### The state was described, shipped in the copy, and never built

`listing.ts:371` has carried *"Nine scenes for your stream: the live one glows and
**the one you are lining up breathes**"* since Phase 9, while `stage.ts` carried
only **live** (rate 4) and **under a finger** (rate 24). **The breathing state was
never broken.** This is **authoring work with a budget cost, not a repair**, and
the copy was already written for it. That sentence is in the entry header as well
as here.

### What ships

`Z(z, f)` became `Z(z, f, g)` and now takes **two independent axes**, because the
third state is a mix of the other two: `f` is the layer-1 **rate** and `g` is the
layer-2 **base**.

| state | call | look |
|---|---|---|
| idle | `Z(z, 0, 0)` | dim `@ZONEC` base, still |
| **lined up** | `Z(z, 10, 0)` | **dim `@ZONEC` base, `@LIVEC` pulsing through it** |
| live | `Z(z, 4, 1)` | `@LIVEC` base, `@LIVEC` breathing slowly over it |
| under a finger | `Z(z, 24, 1)` | the live box while a finger is on it |

Layers **sum** before the render's single divide by 512, so the lined-up box
really is the idle box with a live-coloured pulse washing through it - and **its
floor is the idle floor exactly**, which is the half of the design that says
*"not on air"*. Measured at the defaults over 512 ticks:

```
idle      floor 248  ceil  248  cycles  0
lined up  floor 248  ceil  836  cycles 20
live      floor 580  ceil 1168  cycles  8   (48 while a finger is on it)
```

**"Nothing is lined up" is spelled `self.p == self.l`, not with a sentinel.** That
is not a saving for its own sake: it makes **cutting to the lined-up scene clear
the line-up for free**, because `s.l = z` on a zone that was already `s.p` makes
the two equal in the same step. It also removes the Timer's guard entirely - when
nothing is lined up, `R(self.l)` and `R(self.p)` name the same zone and the second
call is a harmless repeat.

**Why 4, 10 and 24 read as three states.** They turn over 8, 20 and 48 times in
512 ticks. **10 is close to the geometric mean of its two neighbours** (sqrt(4*24)
= 9.8), so the middle state is as distinguishable from the slow one as from the
fast one. And the rate is the **second** discriminator, not the only one: the
lined-up box also differs from both live states in its layer-2 base.

### The one place the third state is not free

**30000 is 300 seconds**, so a scene lined up and left alone for five minutes
would simply stop breathing. The Timer's single loop became `R(z)` and is called
for **both** zones. **It did not gain a `glpfs`** - the trap the header states in
capitals stands: a re-issue writes phase 0 and snaps a breathe back to black
mid-breath at an arbitrary moment.

### The gesture: costed four ways, three rejected by measurement

**CHOSEN - the SLIDE.** Event code 1 (MOVE) reached **no branch** of this handler
before now: a finger that pressed and then dragged did nothing after the initial
cut. So a slide onto another zone lines that zone up, and **the cut path is not
touched at all** - a press still cuts, on both arrival codes, exactly as an
installed card already behaves. It is the only candidate that adds a state
without reversing a behaviour, it is deterministic from the operator's side, and
it is reachable in the browser with a mouse.
*The price is stated rather than hidden:* a finger that rolls across a zone
boundary during a press lines up a scene nobody asked for. That is visible, costs
nothing on air, and clears on the next slide.

**REJECTED - the tap-versus-hold discrimination the card already computes.**
`Z(z, e>8 and 4 or 24)` already tells a coalesced DOWNUP from a held press, so
mapping one to "cut" and the other to "line up" costs **nothing in characters** -
which is exactly why the plan proposed it. **It is rejected because it is the
discrimination the class-B gate exists to forbid.** Measured: gating the `gks` on
`e==4` turns `lua-smoke.spec.ts` test 5 red at stage with

```
stage: A FAST TAP MUST SEND WHAT A SLOW TAP SENDS.
fast tap sent 0 message(s): (nothing)
slow tap sent 1: hid({"call":"gks","args":[10,1,1,0,0,2,107,1,0,0]})
```

and shipping it would mean adding a `PARITY_ALLOWANCES` row. **The reason that
gate exists applies here in full**: whether one quick tap arrives as 4-then-5 or
as a coalesced 9 depends on sub-cycle timing the operator cannot control, so the
same physical gesture would sometimes cut and sometimes not. On a card that
switches a live camera feed that is not a trade-off, it is a fault. **The free
gesture was free because it was the wrong one.**

**REJECTED - a second contact. Measured in both directions, as the plan asked,
and the plan's gate was the wrong gate.** The plan gated this option on *"first
proving `i > 0` is deliverable at all through the Lua host and the shipped
`TouchSampler`"*. **It IS deliverable, on both halves:** `touch_cb` sees
`i = 0, 1, 2` for three contacts through the real Lua host with no errors, and
`src/lib/sim/touch.ts` allocates slots **0, 1, 2** for three pointers
(`MAX_CONTACTS = 5`). **The option still has to be rejected, for a reason the
plan did not name: a mouse has exactly one pointer.** `Coverflow.svelte`'s
`onHeroDown` maps one `pointerId` to one contact, so a visitor driving the
preview with a mouse can never perform the gesture - and the multi-touch audience
that could is the audience Web Serial cannot reach anyway (no iOS browser has it,
and Chrome on Android exposes only Bluetooth RFCOMM ports, never a USB ZONA). **A
headline gesture invisible in the browser is the failure PREV-01 exists to
prevent.**

**REJECTED - a long press.** The conventional answer, and the one that costs
something other than characters. STAGE's only clock is its Timer, and the Timer's
period is **pinned at 2560 ms** by the header's own trap - 256 ticks, a whole
number of phase cycles. **The cheapest threshold it can express is therefore
2.56 s with 2.56 s of jitter**, and buying a usable half-second threshold means
shortening the period, which re-opens the `glpfs` re-issue question that trap
closed. It would also have to defer the cut until the press resolved, putting
latency on the one thing this card must do instantly.

### No knob was added, and the proof

`shapeOf(knobs) = ALPHABET[(knobs.length * 7 + total options) % 32]`.

| entry | knobs / options before | after | shape character |
|---|---|---|---|
| **STAGE** | 4 / 16 | **4 / 16** | **`c` -> `c`, unmoved** |
| POMODORO (task 01) | 5 / 20 | 5 / 22 | `n` -> `p`, **moved** |

`git diff HEAD -- src/lib/catalog/entries/stage.ts | grep -E "knobs|values:|default:"`
over the added/removed lines returns **two matches and both are header comment
prose**; **no knob code line changed**. The lined-up colour comes entirely out of
the existing `@LIVEC` / `@ZONEC` arithmetic. **The tripwire this plan spent once
on POMODORO, for two intervals the user asked for by name, was not spent again
for a colour nobody asked for.**

### `listing.ts` does not move, and its absence from the diff is explained

The sentence it already carries describes exactly what now ships, and the shipped
gesture does not make it inaccurate in any **new** way - it says **what** the pad
shows and never how a scene is selected. **Said in a line in the entry header**
rather than left unexplained, with the note that `listing.spec.ts` is the gate
that keeps the two copies of the sentence agreeing.

### `frames.json` is byte-untouched, and it was PROVED rather than asserted

- `npx vitest run --project server src/lib/catalog/frames.spec.ts` **without**
  `UPDATE_FRAMES`: **5 passed**.
- `git diff --quiet HEAD -- src/lib/catalog/frames.json`: **exit 0**.

The fixture runs each entry at its defaults with **no gesture**, and a lined-up
zone exists only once a finger has slid onto one - so Setup still paints nine idle
boxes and one live one. The restructure of `Z` reorders the two `glc` writes but
leaves the end state of both layers identical, which is why no row moved.

### The new test

`lua-smoke.spec.ts` 13 -> 14: *"shows STAGE's live, lined-up and idle zones as
THREE states"*. It drives the real gesture through the real Lua host and asserts

1. **lining up sends no keystroke** - a scene you are lining up is one the
   audience must not see;
2. the idle zone's swing is **0** and all three active states' swings are **> 0**;
3. the lined-up zone's floor **equals** the idle floor, and the live zone's floor
   is **greater** than the lined-up floor;
4. the three cycle counts are **pairwise separated by at least 1.5x**.

**Clause 4 is a legibility claim, not a rate literal**, which is what lets a
future re-tuning stay green while a collapse reddens. 1.5 is also comfortably
outside the one-cycle window-alignment artefact a fixed sample window produces
(the same rate read 7 and 8 cycles in two adjacent windows, and that is recorded
here so nobody later mistakes it for drift).

---

## The six negative checks, with what each proved

All restored from **scratch copies with sha256 compared either side**. No
`git checkout`, `restore`, `stash` or `clean` was run at any point.

### Task 01's three

| # | Plant | Result |
|---|---|---|
| 1 | ARC's heart repainted with the raw `v` | **red** - *"That is the lie, made visible"* |
| 2 | `"1"` **inserted** at the front of `@MINS` | **red** - *"wn0f2145f31 was minted for 15 minutes at index 0; that index now names 1 minutes"*. **The other eight tests in the same file stayed GREEN**, which is precisely why that test had to exist |
| 3 | the append undone | **red**, twice - the test cannot pass by the work not having been done |

### Task 03's three

| # | Plant | Result |
|---|---|---|
| 4 | lined-up rate set to the **live** rate (4) | **red** - *"the live zone 4 at rest breathed 8 time(s) in 512 ticks and the lined-up zone 8 breathed 8 - too close to read as different states at arm's length"* |
| 5 | lined-up rate set to the **touched** rate (24) | **red** - *"the lined-up zone 8 breathed 48 time(s) ... and the zone 4 under the finger breathed 48"*. **It names the touched zone, not live**, so the test is not half a test |
| 6 | the `gks` gated on `e==4` (the rejected gesture (a)) | **red** at `lua-smoke.spec.ts` test 5 - *"fast tap sent 0 message(s), slow tap sent 1"*. Run as a COSTING, not as a guard: it is how gesture (a) was rejected |

**Check 2 is the model this phase has been asking for and it is worth restating:
it turned one test red while the other eight in the same file stayed green.** A
plant that reddens everything proves only that the file runs.

---

## Deviations from Plan

### Auto-fixed and re-scoped

**1. [Plan defect - named, not fixed] Task 03's declared term was `+0` and its
action text said "add it"**
- **Found during:** task 03, reading the plan's verification block against its own action text
- **Issue:** the two halves of the same task disagreed about whether a test was added
- **Resolution:** the re-scope at `b4e245b` had already resolved it in favour of the test and moved the term to `+3`; the tree observes exactly `+3`
- **Owner:** **11-16**

**2. [Rule 3 - blocking] The Timer had to grow a loop, which the plan did not cost**
- **Found during:** task 03, checking the lined-up zone's `glt` lifetime
- **Issue:** 30000 is 300 s; a lined-up scene left alone for five minutes stops breathing
- **Fix:** the Timer's single loop became `R(z)`, called for the live and the lined-up zone. It did **not** gain a `glpfs`, which is the trap the header states in capitals
- **Cost:** Timer 109 -> 136 at every corner
- **Commit:** `db3ab1a`

**3. [Design - the plan's option (b) gate was the wrong gate]**
- The plan gated the second-contact option on proving `i > 0` deliverable. It **is** deliverable, measured on both halves. The option still fails, on a reason the plan did not name (a mouse has one pointer). **Measuring what the plan asked would have admitted the option.** Recorded in the entry header so the next reader does not re-derive it.

**4. [Design - a fourth gesture, not among the plan's three]**
- The plan offered three candidates and asked for at least two to be costed. All three were costed and **all three were rejected**; the gesture that ships is a fourth (the slide) that the plan did not name. This is reported as a result about the option set, the same way the checkpoint's three out-of-set answers are.

---

## Everything the plan or the tree asserts that the tree does not support

1. **`Pass A 20,782` was said to be stale and to have moved. It has not moved and could not have** - it is the *compiler* route's figure and POMODORO is a hand-authored Lua entry. What moved is the *Lua* route's Pass A (49,792 -> 49,824) and `lua-entries` (1,174 -> 1,176).
2. **The plan's STAGE budget figure `505 / 399 free` is not merely the wrong corner, it is self-inconsistent** - 908 - 505 is 403, and 399 free corresponds to a Setup of 509, which is none of the four corners.
3. **The plan costed ARC's fix at `+21` of 527 free.** Task 01 measured **+9**, and the "527 free" and "636 free" figures in the plan's interfaces section are neither of the corners `arc.ts` now quotes.
4. **`i > 0` is deliverable through the Lua host and the shipped `TouchSampler`**, contrary to the plan's implication that this was the open question; the option fails downstream of it.
5. **The plan's `must_haves.artifacts` row for `stage.ts` requires `contains: "Z(z,f)"`.** The shipped painter is `Z(z,f,g)`; the substring `Z(z,f` is still present but the exact three-character-argument form is not, and a literal reading of that row is now false. Flagged so 11-16 does not read it as a regression.
6. **`REQUIREMENTS.md`'s SHARE-03 traceability row is now stale, and this plan made it stale.** It reads *"format `x` still lands `restored`, proved against 54 literals captured with the unmodified encoder"*. **One of those 54 - `xn33333` - now lands `older`**, because task 01 resized POMODORO's `@MINS`. The behaviour is correct and is the graceful apology SHARE-03 exists to specify, but the row's wording no longer describes the tree. All four of this plan's requirements were already `[x]` and `requirements mark-complete` was a no-op; **the row wants a sentence, and 11-16 owns it.**
7. **`decay-idiom.spec.ts` never sees any of STAGE's rates.** The plan asked that a new rate be checked by it; in fact a `glpfs` with a non-zero shape argument is a **keeper** and is skipped outright, so STAGE's rates 4, 10 and 24 are outside that gate entirely. `lua-smoke.spec.ts` test 3's `DECAY_RATE_FLOOR` of 200 is the guard that actually applies, and all three sit an order of magnitude below it.

---

## Invariants, each proved by a command

| Claim | Command | Result |
|---|---|---|
| `frames.json` byte-untouched | `git diff --quiet HEAD -- src/lib/catalog/frames.json` | **exit 0** |
| `frames.spec.ts` green with no `UPDATE_FRAMES` | `npx vitest run --project server src/lib/catalog/frames.spec.ts` | **5 passed** |
| `src/vendor/` unmoved since 11-04 | `git diff --stat 4131ff5 HEAD -- src/vendor/` | the recorded **four-file** output |
| `firmware-oracle.spec.ts` unedited | `git diff --quiet 9d06b00 HEAD -- src/lib/fidelity/firmware-oracle.spec.ts` | **exit 0** |
| `upstream-manifest.json` untouched (7th wave) | `git diff --quiet 2d249f3 HEAD -- src/lib/fidelity/upstream-manifest.json` | **exit 0** - the four mislabelled "free at worst" rows stand for 11-16 |
| configs and roadmap untouched | `git diff --quiet HEAD -- playwright.config.ts vite.config.ts .planning/ROADMAP.md` | **exit 0** |
| `DECLARED_EXCEPTIONS.length` still 2 | `touch-guard.spec.ts` | **3 passed**, both rows still justified, STAGE's `elseif e>=5` clause unchanged and still preceded in the same if-chain by `if e==4 or e>8` |
| `decay-idiom.spec.ts` green | run in the catalog project | **3 passed** |
| STAGE's 30000 keeper unchanged | the Setup and Timer both still write `glt(...,1,30000)` | unchanged |
| ARC's and POMODORO's keepers untouched | `grep -n "65535" src/lib/catalog/entries/arc.ts src/lib/catalog/entries/pomodoro.ts` | both ARC sites present, POMODORO's note intact |
| no knob added to STAGE | shape character `c` before and after; no knob code line in the diff | **unmoved** |
| e2e term `+0` | `grep -c "test(" e2e/*.e2e.ts` | **86**; the suite is not run by this plan |
| nothing hardware-verified | no agent connected to or wrote to a device | - |
| nothing deployed | no `wrangler`, no `npm run deploy` | - |
| no sibling repository touched | - | - |
| tree clean | `git status --porcelain` | only this SUMMARY and STATE.md |

---

## Commits

| Hash | Message |
|---|---|
| `c9a621a` | `fix(11-09): ARC's heart shows the amplitude ARC is sending, and POMODORO gets a one and a five minute interval` |
| `c530d87` | `docs(11-09): the four answers, and three of them are outside the options they answer` |
| `db3ab1a` | `feat(11-09): STAGE breathes the scene you are lining up, which its own card has promised since phase 9` |

No commit was made while a Playwright suite was running; no Playwright suite was
run by this plan.

---

## Carry-forward for wave 11

**`PREV_FILES` 84 · `PREV_TESTS` 856 · `PREV_E2E` 86 source titles / 105 runs ·
`BASE_CHECK` 580 · sweep members `4 19` · catalog 27**

**Sweep totals, corrected - carry THESE, not the pre-11-09 shorthand:**

- compiler route / reachability **Pass A 20,782**, Pass B 24,576, **total 45,358** (**unmoved by this plan**)
- Lua route **Pass A 49,824** (format w 49,424, format x 382), Pass B 118,784, **total 168,608**
- `lua-entries` **1,176 combinations, 2,352 measurements**
- kind cross-product 1,296 combinations, **worst 906 of 908**

**Entry headers found quoting the declared-palette corner instead of the RGB444
picker corner: FIVE** - CONSOLE, FORGE, STEPS (11-07), POMODORO and STAGE
(11-09). Fifteen were never checked. All five were wrong in the dangerous
direction. **11-16 owns the sweep of the rest.**

Suite-running plans in this phase remain **five**: 11-01, 11-05, 11-08.1, 11-15,
11-16.

---

## Known Stubs

None. Every state this plan added is wired, rendered and asserted through the
real Lua host.

---

## Self-Check: PASSED

All eight files claimed above exist on disk. All four commit hashes resolve in
`git log --oneline --all`. The measurement scratch spec used during task 03 was
deleted before the commit and does not appear in the file count.
