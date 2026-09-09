---
phase: 11-bench-corrections
plan: 07
subsystem: catalog
tags: [catalog, lua-entries, bench, midi, budget, touch, sweep]
requires:
  - phase: 11-bench-corrections
    plan: 06
    provides: "the PREV_FILES 84 / PREV_TESTS 844 / PREV_E2E 103 / BASE_CHECK 580 / sweep 4 19 / Pass A 20,782 baseline, the JOYSTICK precedent that a request which cannot fit is a finding, and the e2e flake this plan met again"
  - phase: 11-bench-corrections
    plan: 02
    provides: "touch-guard.spec.ts and the class-B convention every guard here is written in, and LATTICE's +8 fast-tap fix which answers two of that card's three clauses"
provides:
  - "CONSOLE's faders reach 127: h*127//8 -> h*127//7 at BOTH sites, at +0, after a sweep showed every column topping out at 111"
  - "A muted CONSOLE column is inert, which REVERSES the shipped touch-to-unmute decision - and it cost -6 rather than the +5 an early return costs"
  - "CONSOLE's mute row answers a swipe, guarded by self.q[i], with the onset passing unconditionally because this card's outer gate never sees a contact end"
  - "FORGE's whole travel swept, 16,384 presses: all 27 macros reachable, the boundaries and target areas measured, and THE PRESS IS FINAL named as the one plausible mechanism"
  - "LATTICE's whole travel swept: 49 notes, 36 to 84, exactly the claimed range, both ends present - there is no clamp to improve"
  - "Four assertions in lua-smoke.spec.ts that pin each outcome, every one observed red on a planted change"
affects: [11-08, 11-16]
tech-stack:
  added: []
  patterns:
    - "A value sweep as a shipped assertion: drive the whole travel through the real Lua host and assert the COUNT and the ENDPOINTS, never the list, so a re-scaling does not redden it but a lost endpoint does"
    - "A measured non-delivery written into the entry header with its numbers, so the next author meets the measurement rather than the silence"
    - "Every probe coordinate derived from the entry's own t*9//128 division rather than pasted, and every wobble sample a DISTINCT point, because the host's enqueue is change-gated and an identical re-send would measure the host's dedup and call it the entry's"
key-files:
  created: []
  modified:
    - src/lib/catalog/entries/console.ts
    - src/lib/catalog/entries/forge.ts
    - src/lib/catalog/entries/lattice.ts
    - src/lib/sim/lua-smoke.spec.ts
key-decisions:
  - "THE PLAN'S FREE-CHARACTER FIGURE IS WRONG FOR THE FOURTH WAVE RUNNING, and this time in a new way: CONSOLE has 100 free at worst, not 121. The binding corner is the PICKER corner D-06 opens (255,255,255), which is 808, not the declared-palette corner the entry header quotes at 789."
  - "The muted-fader gate was folded into the existing condition (`and not s.m[c]`) rather than written as the plan's early return. Measured -6 against +5: the two are behaviourally identical and the fold drops the s.m[c]=nil the reversal removes anyway."
  - "The mute-row guard lets the ONSET pass unconditionally, which is NOT 11-08's idiom, and the reason is not budget. CONSOLE's outer gate never sees a contact end, so 11-08's contact-end clear would never run and the second fast tap on a cap would be swallowed."
  - "FORGE shipped NO change to its Lua. All 27 macros are reachable and both endpoints present; the two things the sweep found - macro 26's reduced target and the press-is-final gesture - are geometry and a bench decision, not arithmetic."
  - "LATTICE shipped NO change to its Lua. 49 notes, 36 to 84, exactly the range its own header claims, both ends reachable, every one of 16,384 coordinates sounding something. There is no clamp to improve."
  - "The plan's negative check 1 does not behave as described: reverting the UNMUTE site is not caught by the full-scale test, because that site is not on the sweep path. Re-aimed at the mute test's unmute stage, where it fails at 63 against 72."
patterns-established:
  - "When a plan and an entry header disagree about free characters, suspect BOTH and measure the picker corner: an entry header written before plan 10-08 quotes the declared-palette corner, and the 908 gate does not read that one"
requirements-completed: []
duration: 1h 05m
completed: 2026-09-09
---

# Phase 11 Plan 07: CONSOLE's Three Asks, and Two Bench Notes That Had Reached Nothing — Summary

**CONSOLE's faders reach 127. Sweeping a column emitted `0, 15, 31, 47, 63, 79, 95, 111` and could not
reach the top at any position of any column, because the mute row owns the top of the travel and
`h*127//8` over a reachable `h` of 0..7 stops at 111 — `//7` fixes it at +0, at BOTH sites. A muted
strip is now inert, which reverses a shipped decision and costs **-6**, not the +5 the plan expected.
The mute row answers a swipe: measured unguarded, one still finger toggled a mute **210 times in 210
samples**; guarded, once. FORGE and LATTICE were swept the same way, 16,384 presses each, and **neither
is a clamp** — all twenty-seven FORGE macros reachable, LATTICE emitting exactly the 49 notes its own
arithmetic claims — so both shipped no change and a measured non-delivery instead. And CONSOLE has
**100 free at worst, not the plan's 121**: the binding corner is the picker's, not the palette's.**

## Performance

- **Duration:** ~65 m
- **Tasks:** 3 of 3
- **Files:** 0 created, 4 edited
- **Commits:** `43b73cf`, `be7845a`, `b625e77`

---

## Counts, as carried name plus delta

| Name                | Carried                | Declared | Observed                     | Agreement |
| ------------------- | ---------------------- | -------- | ---------------------------- | --------- |
| quick files         | `PREV_FILES` 84        | **+0**   | **84**                       | agrees    |
| quick tests         | `PREV_TESTS` 844       | **+4**   | **848** (+1 todo)            | agrees    |
| e2e                 | `PREV_E2E` 103         | **+0**   | **103**, **run**             | agrees, see the flake note |
| sweep               | `4 19`                 | +0       | **4 19**                     | agrees    |
| `svelte-check`      | `BASE_CHECK` 580       | —        | **580**, 0 ERRORS 0 WARNINGS | agrees    |
| catalog             | 27 (9 preset + 18 Lua) | +0       | **27**, untouched            | agrees    |
| reachability Pass A | 20,782                 | +0       | **20,782**                   | agrees    |

`node scripts/check-counts.mjs 84 848` exited **0**. `node scripts/check-counts.mjs 4 19` exited **0**,
twice. `npm run lint` clean; `npm run build` exit **0**; `npm run check` **580 FILES 0 ERRORS 0
WARNINGS**. The reachability sweep re-observed **Pass A 20,782, Pass B 24,576, total 45,358 states,
over budget 0, Pass B colours excluded 0**, and the kind cross-product's **worst 906 of 908 at
none/none/trackpad**.

**The +4 splits with nothing left over**, all in `src/lib/sim/lua-smoke.spec.ts`, 6 → 10:

| # | Test | For |
| - | ---- | --- |
| 7 | *"drives a CONSOLE column across its whole travel and reaches 127"* | task 01 |
| 8 | *"leaves a muted CONSOLE column inert, and gives it back from the mute cap"* | task 01, **extended** by task 02 rather than a ninth test being added |
| 9 | *"reaches every one of FORGE's twenty-seven macros, at both ends"* | task 03 |
| 10 | *"reaches both ends of LATTICE's range across the whole travel"* | task 03 |

**`svelte-check` is +0**: no file was created.

**No agent connected to or wrote to a device, nothing was deployed, and nothing here is claimed as
hardware-verified.** All five notes came from the user's bench and only their bench can confirm any of
this. **No sibling repository was read or written.** `git checkout`, `git restore`, `git stash` and
`git clean` were not used at any point.

---

## CONSOLE's three asks, before and after, at the worst knob position

**Every figure is `max(GridScript.compressScript(lua).length, lua.length)` after `await padReady()`,
and every "worst" is the corner the 908 gate actually reads.** See the next section for why that is
not the corner the plan or the entry header quoted.

| Ask | Change | Setup before | Setup after | Delta | Free at worst | Plan said |
| --- | --- | --- | --- | --- | --- | --- |
| **Full scale** | `h*127//8` → `h*127//7`, **both sites** | 808 | **808** | **+0** | 100 | +0 ✓ |
| **Muted faders inert** | `and not s.m[c]` folded into the existing condition | 808 | **802** | **-6** | 106 | +5 |
| **The mute row takes a swipe** | `self.q={}` + `or s.q[i]~=c then s.q[i]=c` + a fader-path clear | 802 | **844** | **+42** | **64** | "measure" |
| **All three** | | **808** | **844** | **+36** | **64** | — |

At the defaults: **785 → 821**. **Nothing needed trimming and no ask was cut.** The dearest card in the
catalog is still `tpad` at 907 of 908, untouched.

### The `127//` grep, published

Before, `grep -n "127//" src/lib/catalog/entries/console.ts`:

```
42://   - The controller value is self.v[c]*127//8, which is exactly 0 at h = 0 and
71://   - EVERY DIVISION IS FLOORED. x*9//128, y*9//128 and *127//8 are all `//`.
130:  "--[[@cb]]...m and 0 or s.v[c]*127//8,0)P(s,c)end return end local h=8-r if h~=s.v[c]or s.m[c]then ... h*127//8,0)P(s,c)end end";
```

**Two Lua sites, exactly as the plan said, and the grep is what proved it rather than the sentence.**
After, over the Lua line only: `127//7`, `127//7`. Over the whole file: **four `127//7` and two
`127//8`**, and the two remaining `//8` are the prose that now explains the defect.

---

## THE PLAN'S FREE-CHARACTER FIGURE IS WRONG, FOR THE FOURTH WAVE RUNNING, AND IN A NEW WAY

The plan states CONSOLE at **785 at defaults and 787 at worst, 121 free**. The entry header states
**789 at the all-longest corner, 119 free**. **Both are wrong about the number the gate reads, and they
are wrong differently.**

| Corner | CONSOLE, as shipped | What it is |
| --- | --- | --- |
| defaults | **785** | the knob positions the card ships at |
| all-longest over the **DECLARED palettes** | **789** | what the header quoted — correct for what it claimed |
| **all-longest a VISITOR CAN REACH** | **808** | **the binding one**, and 21 characters dearer |

**The gate is `lua-entries.sweep.spec.ts`, and since plan 10-08 it sweeps the RGB444 picker lattice
(D-06), not the declared palettes.** Its `COLOUR_LONGEST` is `"255,255,255"` — eleven characters
against CONSOLE's longest declared colour at nine. CONSOLE has three colour tokens occurring 3 + 2 + 2
times, so 19 of the 23 characters between the two corners are colour; the other 4 are `@CC` and `@CH`
at their longest values. **CONSOLE had 100 free at worst before this plan and has 64 after**, not 121
and not the 116 the plan's table projects. The plan's 787 is not any corner this repository measures.

**This is not the same staleness the last three waves reported** — that was a pre-11-04 baseline. This
is a *different corner*, and it is a systematic error in every hand-authored entry header written
before 10-08. **FORGE carries it too** (722 declared, 725 real, 183 free rather than 186) and was
corrected here because this plan was in the file. **LATTICE does not**, because its one colour knob
already declares `255,255,255`. Both CONSOLE's and FORGE's headers now quote the picker corner and say
in a sentence why it is the one that counts. **The other fifteen hand-authored entries have not been
checked and almost certainly carry the same error — that is a finding for 11-16.**

---

## The touch-to-unmute reversal, and the way back

**As shipped, touching a muted fader unmuted it.** `s.m[c]=nil` in the fader body, on a stated design
argument carried in the header: *"Sliding a muted column clears the mute, because moving a fader is an
unambiguous request for that level."* The bench asked for the opposite — *"you should not be able to
interact with the 'muted' faders"* — so **that decision is reversed**, and it is recorded as a reversal
in the entry rather than quietly replaced.

**The only remaining way to unmute is the mute cap, and it is reachable by construction.** The cap is
**row 0 of the same column** — the cell directly above the fader the finger is already on, one cell
away from anywhere in the strip. While the mute is held the cap is painted in `@MUTEC` on **both**
layers, so it is the one cell in that column that says what to press, and the dim `@MUTEC` body keeps
the remembered level readable underneath. **This does not read as worse than the complaint**: a mixer
mute that only the mute button clears is what a mixer does. The test asserts both halves — silent while
muted, responsive after — because a mute that cannot be undone would be.

**The +5 the plan predicted is right about the early-return shape and wrong about the cheapest one.**
Measured, both through the real minifier:

| Shape | Setup at defaults | at worst | delta |
| --- | --- | --- | --- |
| `if s.m[c]then return end local h=8-r if h~=s.v[c]then` — the plan's | 790 | 813 | **+5** ✓ |
| `if h~=s.v[c]and not s.m[c]then` — folded, **shipped** | 779 | **802** | **-6** |

They are behaviourally identical — neither sends, neither stores, neither repaints. The fold is 11
characters cheaper because the reversal deletes `s.m[c]=nil` (10 characters plus its separator) and the
fold pays only `and not ` against `or `. **A correctness change that gives budget back.**

---

## The mute row: both shapes costed, and a third and fourth measured too

The plan asks for two shapes to be costed and one chosen. **Four were measured**, because the choice
turned on a behavioural detail the two named shapes do not distinguish.

| Shape | Setup at worst | Free | Behaviour |
| --- | --- | --- | --- |
| as task 01 left it | 802 | 106 | onset only; no swipe |
| **A — onset passes unconditionally, MOVE deduped, fader path clears q. SHIPPED** | **844** | **64** | the ask, exactly |
| A− the same without the fader-path clear | 833 | 75 | slide off a cap and back and the second visit is eaten |
| B — 11-08's literal idiom, dedup every event + contact-end clear | 836 | 72 | **the second fast tap on a cap is swallowed** |
| C — swipe SETS rather than toggles | 807 | 101 | a different behaviour from the one asked for |

**All four fit. Nothing was trimmed and there is no shortfall to report.** The per-contact guard on
EUCLID costs **+76** in 11-08; CONSOLE's is **+42**, because it guards one axis rather than a cell
index and needs no contact-end branch.

### Why the shipped shape diverges from the neighbouring plan's idiom, and it is not budget

11-08 writes `if s.q[i]==m then return end s.q[i]=m` — a filter on **every** event — and pays for a
contact-end clear so a fresh press is not swallowed. **That shape is wrong on CONSOLE, and the reason
is in CONSOLE's outer gate:**

```lua
if e~=1 and e~=4 and e<9 then return end
```

**This handler never sees a contact end.** Code 3 and codes 5..8 return at the first line, and code 9 —
the fast tap, which is the mute row's *primary* gesture and a whole contact in one message — passes
`e<9` and is not an end either. So 11-08's `s.q[i]=nil` would have **no site that ever runs**, and the
**second fast tap on the same cap would be swallowed**: the mute would appear to work every other time.
Letting the onset through instead (`e==4 or e>8 or s.q[i]~=c`) needs no contact-end branch at all, and
it costs eight characters more than the idiom that would have been broken here. **The reason is in the
entry's header in one sentence, as the plan asked.**

The fader path's `s.q[i]=nil` costs **11** (844 against 833) and buys the one gesture the dedup would
otherwise eat: slide off a cap into the strip and back onto the same cap.

**No `DECLARED_EXCEPTIONS` row was added, and none was needed.** `touch-guard.spec.ts` test 2 skips
chains that name code 1 as live tests and examines chains containing `e==4`; the shipped chain is
`e==4 or e>8 or s.q[i]~=c`, whose onset half is intact and admits 9. Test 1 examines `>=5` / `>4`
members and the entry has none. **`DECLARED_EXCEPTIONS.length` is still 2.**

---

## The observed controller value set, before and after

Driven down each of the nine columns through the real Lua host, one body cell per sample:

| | column 0..8, every one identical |
| --- | --- |
| **before** | `0, 15, 31, 47, 63, 79, 95, 111` |
| **after** | `0, 18, 36, 54, 72, 90, 108, 127` |

Eight distinct values either way; **127 present only after**. The test asserts **the presence of 127,
the presence of 0, and the distinct count of 8** — never the list, so a future re-scaling does not
redden it for no reason.

### One thing the fix does NOT change, measured and reported rather than left for a bench to find

**The picture still tops out at seven of the eight body cells.** `h` cells light for `h` in 0..7, so at
full scale the row you touched to get there is itself dark. That is **not** a leftover of the same
defect — it was true before and after, and the value change did not move it — but it is the other half
of what a bench might mean by *"the top row"*. Lighting 0..8 cells needs **nine** levels over **eight**
touchable rows, so closing it is a layout change (store `h = 9-r` and rescale, at roughly +9, losing
the ability to set a fader to exactly zero from the pad), not a constant. **It is a bench question and
it is recorded in the entry header and here rather than guessed at.**

### The mute probe, printed

```
mute cap tapped: 0
swept while muted: 8 sample(s) delivered, 0 message(s)
mute cap tapped again: 72
swept after unmuting: 0, 18, 36, 54, 72, 90, 108, 127
swiped across the mute row: 128 sample(s) delivered, changes per column 0:1 1:1 2:1 3:1 4:1 5:1 6:1 7:1 8:1
rested inside mute cell 6: 210 sample(s) delivered, 1 change(s)
```

The `72` is `4*127//7` and it is the load-bearing line: it proves the muted sweep **stored** nothing as
well as **sent** nothing, because Setup left the strip at `h = 4` and an unmute that reported anything
else would mean `self.v[c]` had moved.

**Every sample in the resting probe is a DIFFERENT coordinate inside the same cell** — all 14 x-values
by all 15 y-values of mute cell 6. That is deliberate: the host's enqueue is change-gated on
`(event, x, y)` per contact, so a probe that re-sent one point would have measured the host's dedup and
called it the entry's.

### The unguarded resting-finger count

**210 changes for 210 samples — one toggle per sample.** And a swipe across the row with no guard
toggled each column **14 or 15 times** rather than once, which is exactly the raw-coordinate width of
each column. With the guard: **1 and 1**. At the firmware's rate that unguarded number is a strip
flickering at 100 Hz under a still finger, and it is the clearest possible statement of why the guard
is not optional.

---

## `frames.json` did not move, and was not regenerated

The plan says to regenerate it, expecting the muted column's paint to change. **The tree does not
support that**, and the reason is structural: `frames.spec.ts` samples each entry at ticks 0, 37, 101,
500 and 1009 through `createEngine` with **no gesture at all**. CONSOLE's fixture is therefore its
Setup paint — nine rail caps and nine half-open faders — and **Setup is byte-identical after all three
changes**: it still writes `self.v[c]=4` and calls the same `P`. Nothing a finger does reaches this
fixture.

**Proved by the committed tripwire re-sampling green rather than by writing identical content**, which
is 11-06's precedent: regenerating a tripwire to identical content and reporting it as evidence is not
evidence. `src/lib/catalog/frames.json` is unchanged in `git status`.

---

## FORGE: swept, and the numbers say it is not the arithmetic

**16,384 presses — every raw coordinate on the pad, pressed and lifted one at a time**, because FORGE
is onset-gated and a drag would report one macro for a whole stroke.

### Reachable macro indices, against the twenty-seven the header claims

```
4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30
```

**All twenty-seven, `@KEY0` through `@KEY0 + 26`, both endpoints present.** Nothing is lost to a
floored division, and the `gks` arity was checked before any of this was read off it: **16 arguments,
`(16-1) % 3 = 0`**, so the call is not silently rejected.

### Where the boundaries fall, in raw coordinates

| Axis | First raw coordinate of each target | Widths |
| --- | --- | --- |
| **column** (x) | 0, 15, 29, 43, 57, 72, 86, 100, 114 | **15**, 14, 14, 14, **15**, 14, 14, 14, 14 |
| **band** (y) | 0, 43, 86 | 43, 43, **42** |

Two columns are 15 raw units wide and seven are 14; two bands are 43 tall and one is 42. That is
`floor(9t/128)` and `floor(3t/128)` doing exactly what they say, and it is **not** a precision defect:
the widest and narrowest column differ by one part in fifteen.

### Target areas, in raw units

| Macro | Area | Why |
| --- | --- | --- |
| 0, 4, 9, 13 (`@KEY0`+ 0, 4, 9, 13) | **645** | 15-wide column, 43-tall band |
| 18, 22 | **630** | 15-wide column, 42-tall band 2 |
| most others in bands 0 and 1 | **602** | 14 x 43 |
| most others in band 2 | **588** | 14 x 42 |
| **26** (`@KEY0`+26) | **392** | 14 x 42 **minus 14 x 14** |
| the bank corner | **196**, sending nothing | cell 80, one cell of the nine-wide mapping |

**Macro 26's strip is two rows rather than three, confirmed and measured.** It is **392 against 588**
for its band-mates and **645** for the largest target on the pad — **67 %** of a band-mate and **61 %**
of the largest. **That is a fact of the bank's geometry, not the complaint**: it is one target of
twenty-seven, it is still 392 raw units, and shrinking the other twenty-six to match would be worse.
It is asserted so it cannot move quietly.

### THE PRESS IS FINAL, and this is the one plausible mechanism the sweep turned up

The handler reads `if e~=4 and e<9 then return end`. Measured:

| Gesture | Sent |
| --- | --- |
| down at raw x = 10 (column 0), slid to x = 40 (column 2), lift | **1 keystroke, column 0's** |
| down at raw y = 40 (band 0), slid to y = 90 (band 2), lift | **1 keystroke, band 0's** |
| fast tap on the bank corner | **0 keystrokes** |

**A finger that lands one column off and slides to the macro it wanted sends the wrong macro, once, and
never corrects.** On a labelless twenty-seven-target pad that is a completely plausible reading of
*"waay not precise enough"*.

**It is not fixed here, and the reason is that the obvious fix is worse than the complaint.** Firing on
MOVE would spray a keystroke into every target a finger crossed — on a pad bound to build, commit and
push, that is a genuinely bad afternoon. Committing on **release** instead is a coherent alternative
(it lets a finger correct before the key lands) but it is a different feel from what the card ships, it
interacts with the code-9 tap that carries no lift of its own, and it is not what the note asked for in
so many words.

**FORGE's outcome: a NAMED NON-DELIVERY carrying its measurement.** What would close it is a bench
answer about which of the three the user meant — the target geometry, macro 26's smaller strip, or the
press-is-final gesture. All three numbers are above, in `forge.ts`'s header, and pinned by test 9.

**FORGE's two dropped-release mitigations, its `gtt` placement and its `gks` arity are untouched.** The
only change to `forge.ts` is header prose plus the corrected corner figure; its Lua is byte-identical.

---

## LATTICE: swept, and there is no clamp to improve

**16,384 presses, every raw coordinate**, pressed and lifted.

| | Observed | The card's own arithmetic |
| --- | --- | --- |
| distinct notes | **49** | 49 (`@BASE` to `@BASE + 8 + 8*@ROW`) |
| lowest | **36** | 36 |
| highest | **84** | 84 |
| coordinates that sounded something | **16,384 of 16,384** | every coordinate is inside some cell |

Both ends present. **No value the arithmetic can name is unreachable and nothing is truncated away** —
which is the exact opposite of what CONSOLE's sweep found, and it is why this is a measurement rather
than a fix.

Raw-coordinate area per note, printed in full by the test, runs 196 to 421 — notes repeat because the
layout is isomorphic and a pitch appears on several cells, which is the whole argument of the card. The
column and row boundaries are the **same** nine values as FORGE's columns (0, 15, 29, 43, 57, 72, 86,
100, 114), so **a cell of the note map is exactly a cell of the picture**, which is the specific thing
the plan asked to check: the picture's cell boundary sits where the emitted value's step does.

**And no knob combination can leave the MIDI range**: the top cell is `@BASE + 8 + 8*@ROW`, which is
108 at the largest root with the widest row interval, against a smallest root of 24.

**LATTICE's outcome: a NAMED NON-DELIVERY carrying its measurement.** The first two clauses of its note
were answered by 11-02's +8 fast-tap fix (0 messages on a fast tap against 2 on a slow one, now 2/2 —
re-observed green in this run's probe output). **The third clause, "clamp it better", has now been
looked at and there is nothing there.** What would close it is a bench answer about what "clamp" meant.
Its Lua is byte-identical; only header prose moved.

---

## The one sentence for 11-16 on the 10-bit unlock

**`self:txma(1023)` / `self:tyma(1023)` is the obvious wrong answer to "not precise enough" on a
cell-grid card: it costs +30 and improves the placement of a column boundary from 0.07 of a cell to
0.009 of a cell, which is imperceptible — a nine-cell grid puts each column 14.22 raw units wide, so
7-bit quantisation already resolves a boundary far finer than a fingertip.** It matters only for
continuous output, which is why STRIP uses it and no cell-grid card does. Not spent on CONSOLE, not
spent on FORGE, not spent on LATTICE, and now written into all three headers so 11-16 does not have to
re-derive it for a fourth time.

---

## The seven negative checks, with exit codes

Six were planned; the two-site claim was split into two because they are caught by **different tests**,
which is a stronger statement than one check would have made. Every plant was reverted from a scratch
copy with `sha256` compared either side.

| # | Task | Plant | Observed | Planted exit | Restored |
| - | ---- | ----- | -------- | ------------ | -------- |
| 1a | 01 | `h*127//7` → `//8` at the **fader** site only | test 7 red: *"A FADER MUST REACH THE TOP OF ITS RANGE... Observed: 0, 15, 31, 47, 63, 79, 95, 111: expected to include 127"* | **1** | exit 0 |
| 1b | 01 | `//7` → `//8` at the **unmute** site only | **not the test the plan predicts.** Test 7 stays GREEN — that site is not on the sweep path. Test 8 red: *"expected [ 63 ] to deeply equal [ 72 ]"* | **1** | exit 0 |
| 2 | 01 | `and not s.m[c]` removed from the fader gate | test 8 red: *"A MUTED FADER MUST DO NOTHING... expected [ 0, 18, 36, 54, 72, 90, 108, 127 ] to deeply equal []"* | **1** | exit 0 |
| 3 | 02 | the `r==0` branch accepting MOVE with **no guard at all** | test 8 red at the swipe; separately measured, **210 changes in 210 samples** resting, and **14–15 toggles per column** on a swipe | **1** | exit 0 |
| 4 | 02 | a contact-end clear written bare as `if e==3 or e>=5` | `touch-guard.spec.ts` **test 1** red: *"console.setup writes `if e==3 or e>=5`"* | **1** | exit 0 |
| 5 | 03 | FORGE's `r//3*9+c` → `r//3*9+c+1` | test 9 red: *"the first macro is @KEY0 itself: expected 5 to be 4"* | **1** | exit 0 |
| 6 | 03 | LATTICE's `x*9//128` → `x*8//128` | test 10 red: *"THE TOP OF THE RANGE MUST BE REACHABLE... asserted here by number: 84: expected [...] to include 84"* | **1** | exit 0 |

**Check 1b is the one that did not behave as described, and it was re-aimed rather than believed.**
The plan expects the full-scale test to go red when the *unmute* site is reverted. It cannot: the
unmute restore is only reached by tapping the mute cap, and the column sweep never touches row 0. The
mute test's unmute stage catches it at **63 against 72** — which is the *better* evidence for the
two-site claim, because it shows the two sites are caught by two different assertions and neither test
covers the other's site.

**Check 5 also names something slightly different from the plan's prediction.** With the index shifted
by one the reachable set is still twenty-seven values, so a count-only assertion would have passed
green. The **endpoint** assertion is what fires, at `5` where `4` was expected — which is exactly why
the plan's instruction to assert the count *and* the endpoints was right.

Restore hashes, printed either side: `console.ts` `7f066cdc…` (task 01), `20d9e7e4…` then
`156ebbda…` (task 02); `forge.ts` `1167b416…`; `lattice.ts` `a20724ae…`. Each was compared before and
after every plant.

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

Byte for byte 11-04's, 11-05's and 11-06's recorded output. `pad-sim.ts` still hashes to
`2651e236ab8f2dd19c7441abeaf43584b0a3a919840f79e1ab27fee10604b39b` and `_pad.ts` to
`c8f4ccb3a32638b2386e69700deac61cc60b31312fba828f834110a1f0a092d3`.
`git diff --quiet 9d06b00 HEAD -- src/lib/fidelity/firmware-oracle.spec.ts` exits **0**: green and
**unedited**. It was not opened.

**`upstream-manifest.json` was not touched** — `git diff --quiet 2d249f3 HEAD` over it exits **0**. The
four mislabelled *"free at its worst knob position"* rows (pinwheel, radar, joystick, faders) are
untouched for the fourth wave running and still belong to 11-16, unhalf-corrected.

---

## Deviations from Plan

### Auto-decided

**1. [Rule 1 — bug] The muted-fader gate was folded rather than written as an early return**

- **Found during:** Task 01, costing the plan's shape before writing it.
- **Issue:** The plan specifies `if s.m[c]then return end` and predicts +5. Measured at exactly +5 —
  but folding the same test into the condition the line already has is **-6**, for identical
  behaviour, because the reversal deletes `s.m[c]=nil` anyway.
- **Fix:** `if h~=s.v[c]and not s.m[c]then`. Both numbers are in this SUMMARY so the choice is
  auditable rather than asserted.
- **Commit:** `43b73cf`

**2. [Rule 1 — bug] The mute-row guard does NOT use 11-08's idiom, and the reason is correctness**

- **Issue:** 11-08's shape filters every event and relies on a contact-end clear. CONSOLE's outer gate
  never sees a contact end — code 9, the mute row's primary gesture, is a whole contact in one message
  and passes `e<9` — so the clear would never run and the second fast tap on a cap would be swallowed.
- **Fix:** the onset passes unconditionally; only MOVE is deduped. Costed both ways (844 against 836)
  so the divergence is a decision with a number rather than a preference, and the reason is one
  sentence in the entry's header as the plan asked.
- **Commit:** `be7845a`

**3. [Rule 2 — missing correctness] The fader path clears `self.q[i]`**

- Not in the plan. Without it, sliding off a mute cap into the strip and back onto the same cap is
  eaten by the dedup. +11 (844 against 833), out of 75 free.
- **Commit:** `be7845a`

**4. [Rule 1 — bug] FORGE's declared corner was corrected while the file was open**

- Its header claimed 722 / 377 and 186 free. That is the declared-palette corner; the picker corner
  the 908 gate reads is **725 / 380, 183 free**. Corrected with the reason, the same correction
  CONSOLE's header received.
- **Commit:** `b625e77`

**5. [judgement] FORGE and LATTICE shipped NO Lua change**

- The plan permits either outcome and forbids inventing a fix. Neither sweep named a defect in the
  arithmetic, so both are named non-deliveries with their numbers, in the entry headers and here. The
  press-is-final gesture is the one real candidate and it is handed to the bench with its measurement
  and its costed alternative rather than being changed on a guess.
- **Commit:** `b625e77`

**6. [reported, not reconciled] `frames.json` was not regenerated**

- The plan says a row should move. Nothing moves: the fixture samples an untouched pad and Setup is
  unchanged. Proved by the committed tripwire re-sampling green.

**7. [reported, not reconciled] Negative check 1 was re-aimed**

- See the check table. The plan's predicted test does not cover the plan's specified site.

No Rule 4 checkpoints were reached. **The closest call was FORGE's press-is-final gesture**, and it was
resolved by measuring and handing over rather than escalated, because the plan's own instruction is
that the fix is a separate decision with its own cost.

---

## What the plan asserts that the tree does not support

Six, and none was reconciled into a passing number or a quieter sentence.

### 1. CONSOLE has 100 free at worst, not 121 — and the error is a different one from the last three waves

Measured 785 / 789 / **808** at the defaults, the palette corner and the picker corner. The plan's 787
is not any corner this repository measures, and the entry's own 789 is the corner the 908 gate does not
read. **The systematic version of this is the finding**: every hand-authored entry header written
before plan 10-08 quotes the declared-palette corner, and D-06 widened what a visitor can write.
FORGE carried it too. Fifteen entries have not been checked.

### 2. "Muted faders inert" is `-6`, not `+5`

+5 is right for the early return the plan specifies and wrong for the cheapest identical-behaviour
shape. The ask gives budget back rather than spending it.

### 3. Negative check 1 does not behave as described

The full-scale test cannot go red on a revert at the unmute site, because the column sweep never
touches row 0. Re-aimed at the mute test, where it fails at 63 against 72.

### 4. Negative check 2 of task 02 had no site to plant on

The plan says *"write the contact-end clear as `e>=5`"*. **The shipped shape has no contact-end clear
at all** — that is the whole point of item 2 in the deviations above. The check was re-aimed to plant a
contact-end guard written bare, which `touch-guard.spec.ts` test 1 catches by name.

### 5. `frames.json` does not move

Structural, not incidental: the fixture is sampled with no gesture.

### 6. FORGE is 183 free at worst, not 189; LATTICE is 282, not 283

Both small, both measured, both reported rather than absorbed. LATTICE's Setup is 623 at the defaults
and 626 at both corners, so its 908 margin is 282.

---

## The e2e flake recurred, and it is reported rather than absorbed

`npx playwright test` at the default worker count failed **twice on one run**, and both failures are
from the family 11-06 recorded:

| failure | alone |
| --- | --- |
| `session.e2e.ts:770` replug — *"expected 4, received 3"* on `CONFIG FETCH` — **the same test as wave 6's run 2** | **16 passed** |
| `browse-webkit.e2e.ts:202` — `page.evaluate: InvalidStateError` out of `getContext("2d")` — **the same shape wave 6 recorded from an earlier run** | **6 passed** |

**`npx playwright test --workers=1` is 103 passed, exit 0**, which is the run this SUMMARY's count is
taken from. Neither touches a surface this plan changed — this plan edited three catalog entries and
one unit spec, and no e2e asserts CONSOLE's, FORGE's or LATTICE's emitted values. **The pattern is now
two waves deep and no longer looks like one bad run:** parallel workers fail a small, rotating set of
tests that pass alone, and the `InvalidStateError` from a canvas context is the shape of a browser
under contention rather than a logic error. **This deserves a plan of its own rather than another
paragraph in another SUMMARY** — either pin `workers: 1` in `playwright.config` with the measurement as
the reason, or find the contention.

---

## Known Stubs

None. Every one of CONSOLE's three asks is shipped and measured. FORGE's and LATTICE's notes are
answered with measurements and named non-deliveries, both pinned by an assertion, both carrying the
open bench question in the entry header where the next author will read it. **Nothing here is
hardware-verified** and the SUMMARY says so in three places, because these five notes came from the
user's bench and only their bench can confirm any of them.

---

## Requirements

`requirements-completed` is empty on purpose. The plan's frontmatter lists `[CONT-02, TUNE-05]` and
**both are already `[x]`**:

- **CONT-02** — re-observed: all eighteen hand-authored entries still canonical, in budget on both
  events at the defaults and at every corner, running in a real Lua VM. The `lua-entries.sweep.spec.ts`
  gate is green at 1,174 combinations / 2,348 measurements, and this plan added a fourth kind of
  evidence to it: not only *does it run* but *what does it emit across its whole travel*.
- **TUNE-05** — re-observed at `ninepads` 640 of 908, `tpad` 907 of 908, over budget **0** across
  45,358 states, Pass B colours excluded **0**. CONSOLE's own margin moved from 100 to **64** free at
  the worst knob position and is well inside.

---

## For the waves that follow

- **11-08 should read this plan's guard-shape note before writing EUCLID's.** CONSOLE's outer gate made
  11-08's idiom incorrect here; EUCLID's may differ, but *whether the handler ever sees a contact end*
  is the question to ask before paying for a contact-end clear.
- **FORGE's press-is-final gesture is the user's decision and it is costed in prose.** Firing on MOVE
  is refused with a reason. Committing on release is the coherent alternative and it changes the feel.
  FORGE has 183 free at worst in Setup and 528 in Timer, so budget is not the constraint.
- **CONSOLE's picture question:** at full scale one body cell stays dark. A layout change, not a
  constant, roughly +9 and it costs the ability to set a fader to exactly zero from the pad.
- **11-16 gains two items.** (f) **Every hand-authored entry header written before plan 10-08 quotes
  the wrong corner** — the declared-palette one rather than the picker one the 908 gate reads. Two were
  corrected here; fifteen are unchecked. (g) **The e2e parallel-worker flake is two waves deep** and
  should be pinned or diagnosed rather than reported a third time.
- **The four mislabelled `upstream-manifest.json` rows are still untouched**, fourth wave running.
- **`PREV_FILES` 84 · `PREV_TESTS` 848 · `PREV_E2E` 103 · `BASE_CHECK` 580 · sweep `4 19` ·
  reachability Pass A 20,782 · catalog 27 (9 preset + 18 Lua)** are what wave 8 carries forward.

---

## Commits

| Commit | Task | What |
| --- | --- | --- |
| `43b73cf` | 11-07-01 | the fader reaches 127, and a muted one answers nothing at all |
| `be7845a` | 11-07-02 | the mute row answers a swipe, and `self.q[i]` is why it can |
| `b625e77` | 11-07-03 | FORGE and LATTICE swept the way CONSOLE was, and neither is a clamp |

---

## Self-Check: PASSED

- `src/lib/catalog/entries/console.ts` — FOUND; two Lua `127//7` sites, `and not s.m[c]`, `self.q={}`,
  `or s.q[i]~=c then s.q[i]=c`, `s.q[i]=nil` in the fader path
- `src/lib/catalog/entries/forge.ts` — FOUND; Lua byte-identical to `2d249f3`, header carries the
  sweep and the corrected corner
- `src/lib/catalog/entries/lattice.ts` — FOUND; Lua byte-identical to `2d249f3`, header carries the
  sweep
- `src/lib/sim/lua-smoke.spec.ts` — FOUND, 10 tests (6 → 10)
- `src/lib/catalog/frames.json` — unchanged, and asserted unchanged by its own tripwire
- Commits `43b73cf`, `be7845a`, `b625e77` — all three FOUND in `git log --oneline --all`
- `check-counts.mjs 84 848` exit 0; `check-counts.mjs 4 19` exit 0 (x2);
  `npx playwright test --workers=1` 103 passed exit 0; `npm run check` 580 files 0 ERRORS 0 WARNINGS;
  `npm run lint` clean; `npm run build` exit 0
- `git diff --stat HEAD -- src/vendor/` **empty**; `git status --porcelain` **empty**;
  `test-results/` removed; no server left running
