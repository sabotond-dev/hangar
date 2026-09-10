---
phase: 12
slug: touch-framework
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-10
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. `docs/TESTING.md` (rewritten
> by plan 12-12) is the developer-facing companion and deliberately does not duplicate the map below.
>
> Binding upstream, in this order: `PROBE-RESULTS-2026-09-10.md` (the phase's ground truth, measured
> on the user's ZONA; everything the simulator says about touch is subordinate to it),
> `12-RESEARCH.md` (where it disagrees with the probe, the probe wins), `BENCH-2026-09-10.txt` (the
> user's own words), `ROADMAP.md` Phase 12, `11-16-SUMMARY.md` (the carried counts) and `11-CONTEXT.md`
> D-02 (the vendored-edit boundary). Where this document contradicts the research it says so by name
> in **Where this document corrects the research**, with the evidence.

---

## Test Infrastructure

| Property | Value |
|---|---|
| **Framework** | vitest 4.1.11, projects `server` (quick) and `sweep`; @playwright/test 1.62.1 over `wrangler dev` on `./build`, projects `chromium` and `webkit-phone` (grepped on `@webkit`) |
| **Config file** | `vite.config.ts` and `playwright.config.ts` — **neither is edited in this phase.** The library's gate is a **server** spec (`library.spec.ts`) by choice, so the sweep's member list does not move |
| **Quick run** | `npm run test:quick` (`vitest run --project server`) |
| **Sweep** | `npm run test:sweep` (`vitest run --project sweep`) |
| **Wave run** | `npm run check && npm run lint && npm run test:quick`, plus `npm run test:sweep` for every wave that changes an entry's Lua, a knob's value list, the library, or anything under `src/vendor/` (nothing does) |
| **Full suite** | the wave run plus `npm run build` and `npx playwright test --workers 3` |
| **Count gate** | `… 2>&1 \| node scripts/check-counts.mjs <files> <tests>` — carried plus delta, never a literal total; the sweep's `4 19` is a member list and is asserted **unchanged in every plan** |
| **New dependencies** | **none.** `@intechstudio/grid-protocol` stays at the exact pin `1.20260825.1135`; `wasmoon` at `1.16.0` |
| **Hardware** | **none, to any agent.** The probe was the user's. Every plan says in those words that nothing in it is hardware-verified, and 12-12 hands the rows over |

---

## Baselines: carried by name from 11-16

Measured by 11-16 on a clean tree at `c5fd1cd`, 2026-09-10, and carried here **as names**:

**quick `84 / 869` (+1 todo)** · **sweep `4 19`** · **e2e `86` source titles / `105` runs (86 chromium +
19 webkit-phone)** · **`svelte-check` 582, 0/0** · **catalog `29`** (9 preset + 20 Lua) ·
**`static/og/` 29 files, 172,699 B** · **audition 25 rows** · **`FRONT_DOOR` 8** · **`EXCLUDED_FROM_ROW`
21** (29 − 8, counted from the file; 12-04 takes it to 18).

12-01 is the first plan to run the suites; if any observation disagrees with the block above, the
observation is the phase's and the disagreement is **reported, never reconciled**.

### The carry-forward block

| Name | What it is | How it moves |
|---|---|---|
| `PREV_FILES` / `PREV_TESTS` | the `test:quick` file and passing-test counts as the previous plan left the tree | start at 84 / 869; re-measured by every plan; copied verbatim when a plan asserts `+0` |
| `BASE_SWEEP` | `4 19` | **never moves.** 12-07 puts the library's cost gate in the server project for exactly this reason and says so |
| `PREV_E2E` | titles / runs, with the plan that measured it | 86 / 105; **12-01 moves it once** (+1 / +1, one chromium-only title); 12-03, 12-04, 12-10 and 12-12 run the suite and prove `+0` with `grep -c "test("` |
| `BASE_CATALOG` | 29 | **never moves.** Every plan states the running size as a chain |
| `BASE_OG` | 29 files / 172,699 B | 12-12 compares |
| `BASE_AUDITION` | 25 | 12-04 −3, 12-10 +1 |

`svelte-check`'s file count is provenance only: −3 (12-04), +2 (12-07: `library.ts`, `library.spec.ts`),
+1 (12-10: `glide.ts`) → 582, reported not asserted.

---

## The catalog count, as a chain

```
                 12-01 12-02 12-03 12-04 12-05 12-06 12-07 12-08 12-09 12-10 12-11 12-12
catalog   29       +0    +0    +0    −3    +0    +0    +0    +0    +0    +1    +0    +0   = 27, 9 + 18
og        29       +0    +0    +0    −3    +0    +0    +0    +0    +0    +1    +0    +0   = 27
audition  25       +0    +0    +0    −3    +0    +0    +0    +0    +0    +1    +0    +0   = 23
```

**Three chains, twelve terms each, one term per plan, every `+0` written out** - the OG and audition
chains included, because "the same two terms, zeros elsewhere" is a summary rather than a chain and
this document does not carry summaries where it asks its plans for chains.

- −3 at 12-04 is lattice, forge and shuttle.
- +1 at 12-10 is glide, beside the tpad preset - **or `+0` under `replace` at 12-06, with tpad gone**,
  in which case all three chains end at 26 / 26 / 22 and the catalog splits 8 + 18.
- **The chains are in PLAN order and the waves are not.** 12-06 sits at wave 9 (see "Why the waves are
  serial"); its term is `+0` on every chain, which is what made the move arithmetic-free.

---

## Where this document corrects the research

`12-RESEARCH.md` is measured rather than argued and almost all of it holds; the probe retired three of
its readings and planning found four more things.

### R-1. The knob-to-wire path is green at the tuner level, measured before planning finished

A throwaway probe (deleted; tree clean; never committed) built the tuner for LUMEN and NINE PADS
through `model.spec.ts`'s own callback shape on real timers: LUMEN `depth` 0 and 3 land different bytes
at 742 / 742; NINE PADS `grid` 0 and 1 land 580 / **556**. The research and `presets.ts:257-263` both
say 4x4 is **550**. 12-01 lands the test as a gate and the e2e that the research never asked for (a
rail turned in a browser, TRY clicked, the fake ZONA's RAM read); 12-05 settles 550 / 556 by
measurement.

### R-2. The library with the probe's expiry rule does not fit the research's shape - and the planner's own first answer did not fit the probe either

The research costed `Q W A F D` at 643 with no expiry. The probe requires two expiry paths. Measured
under the pinned minifier during planning: the research's shape plus expiry with a per-contact light
layer is **954**; with the light layer held once in a global `L` it is **885 of 908** (syntax true,
never run in a VM).

**A plan-check then found two defects in the 885 sketch, so 885 is superseded and 12-07 carries a
revised one.** Both are recorded here rather than in a SUMMARY, because they are corrections to this
document's own upstream:

1. **`Q`'s stale-contact rule could not fire for the same contact id.** The onset scan expired
   *other* contacts (`j~=i`) and never `i` itself. Firmware assigns the lowest free id, so after a
   lost lift the next press is normally the **same id** - which means the sketch missed exactly the
   case the probe's Q6.5 calls its most important answer: the second press returned nil and the entry
   never saw it. 12-07 expires contact `i` on onset before its cell is computed, drops the now
   unnecessary `j~=i` guard, and drives a same-id sequence in its test.
2. **`F` had no caller.** No entry in the phase calls it: the sequencers decline it by name, and
   CONSOLE, MORPH, CHORUS, LUMEN and GLIDE each provide their own feedback. It is **dropped**, with
   `O` and `L`. Probe rule 5 is satisfied per entry, not by a shared function, and 12-07 says so.

The revised sketch's **raw source length is 770**, against the superseded sketch's **884 raw / 885
under the minifier** - a string length, not a minifier measurement, and 12-07 asserts the part sums
rather than carrying either figure.
12-07 measures it under `compressScript`, canonicalises it and runs it in wasmoon before pinning.
**The fallback order also changed**: uncalled functions cannot be dropped first because there are
none, so it is `A` (one caller, LUMEN) then `D` (one caller, GLIDE, already costed both ways at
553 / 603), and never `Q`, `W`, `E` or `X`.

### R-3. `D` covers timeouts of at most 42 ticks

`D(n,l,w)` takes `w` as a byte and derives the timeout as `w//6`, so it reaches 42 and no further.
MORPH's `@DECAY` runs 21..126; MORPH keeps the inlined idiom. Written into 12-07's contract table.

### R-4. The research's MORPH call shape would freeze the card inside a cell

`if i>0 then return end local c=Q(...)if not c then return end` returns on `Q`'s nil, which is "the
cell did not change" — and MORPH must recompute and send its bilinear weights on every sample inside a
cell. 12-09 keeps MORPH's own end test, calls `Q` for the trail cell only, and proves the research's
shape wrong with a negative check that records the frozen count.

### R-5. `Q` takes `s`

The expiry's release callback `R(s,i)` needs the touch element to send note-offs, so `Q(s,i,e,x,y)`
is a five-argument call and every research saving is two characters smaller. 12-08 re-measures.

### R-6. The tenth-removal warning was about `precise` and `still`; the twelfth breaks `keys` and `still` - and retiring `keys` breaks a third thing nobody planned

`facets.ts:15` and `:104` say `precise` and `still` sit at six. After LATTICE, FORGE and SHUTTLE:
`keys` is a singleton (CHORUS) and `still` is five; `precise` is untouched. The research's re-homing
(retire `keys`, CHORUS → `play`, LUMEN → `still`) is taken; the header sentence is rewritten for the
thirteenth removal, not the tenth.

**The third thing: `LEGACY_TAG_MAP` has a row that points AT `keys`.** `facets.ts:315` maps
`harmonic: "keys"`, and `facets.spec.ts:286-294` asserts every value of that table is a live facet
member - so retiring `keys` turns that assertion red on `harmonic`. 12-04 re-targets it from the
recorded derivation at `10-06-SUMMARY.md:280`.

**And the first draft's answer to it was backwards.** It said the table *gains* `keys: "play"` and
that `RETIRED_VOCABULARY` may grow. Three facts, each read out of the source, say otherwise:
`keys` is **not** one of the fifty-five (it was minted at the 10-06 re-cut as `harmonic`'s
destination); `facets.ts:174-178` says the list **never grows**; and `query.ts:185` consults the
legacy table only for `key === "tag"`, so a row could not migrate a `?for=` link even if it existed.
**`RETIRED_VOCABULARY` therefore stays at fifty-five and the four `55` literals plus the sorted-order
assertion are asserted UNMOVED** (`facets.spec.ts:262`, `:263`, `:264-269`, `:285`, `:302`). The
`?for=keys` address drops silently under W-12 unamended and lands on the full catalog; 12-04 records
that as a decided cost, and 12-12 puts it beside the dead links.

**11-01 never met any of this** because `drums` and `clips` were already among the fifty-five, which
is what its own comment says. `keys` is the first term this project has retired that was born after
the re-cut, and that is the whole difference.

### R-7. Three readings retired by the probe, recorded rather than argued

The sRGB-gamma hypothesis for LUMEN (Probe B: four steps distinct, 27 clearly lit); code 9 as a
practical event (Q3: never for a human tap, so `touch.ts` is faithful and `TOUCH-CODE-9.md`'s framing
is superseded — pointed at, never edited); the fast-tap reading of "not precise" (Q2: the one-unit
boundary). Every plan that touches an entry Phase 11 fixed for code 9 says the fix was correct and
harmless and not the complaint.

### R-8. SONAR carries the sequencers' guard byte for byte, and the research's §3c table omitted it

`sonar.ts:168` holds the same inlined cell guard as EUCLID, character for character, and it
**toggles** (`s.v[n]=not s.v[n]`), so a boundary finger can leave a cell **off** rather than merely
re-arming it - a worse reading of Q2 than any of the three the bench reported. It is already a subject
of `lua-smoke.spec.ts:1946`'s swipe test alongside EUCLID and STEPS. **12-08 re-fits four entries, not
three**, and states SONAR's before-count with the cell's final state beside it. The entry list in
12-08's `files_modified` moved; its term did not (`+0 / +1`), because a fourth subject in one test is
not a fourth test.

**QUADRANT is the secondary case and is a finding, not a re-fit.** It computes `x*9//128` too, but it
acts on onsets only, so Q2 does not reach it; its exposure is Q6.5 through the note it holds in
`s.k[i]`, and closing that needs `R` **and** a Timer it does not have. 12-08 records the arithmetic
and 12-12 carries it into `deferred-items.md` section A.

### R-9. `Q`'s onset rule is not enough on its own, so four more entries take `X`

The first draft of 12-08 declined the Timer sweep for the sequencers because "a stale `H[i]` is
cleared by the next press on that cell through `Q`'s own rule". **That is false for the case the probe
actually recorded.** `Q`'s onset rules need *a press*; a contact whose lift was lost and which is
never pressed again (Q6.5's four-of-five, Q7's palm) holds its cell for the session. Only `X` reaches
it. All four sequencers already have a Timer, so the cost is `X(s,20)` - **7 characters** into a
string with its own 908 - against 90 characters saved in Setup. 12-08 takes it in all four, and the
window becomes the bench's to move in five callers rather than one.

### R-10. `A` had no caller and `F` had none; one was fixed and one was dropped

The 885 sketch shipped `A` (150) and `F` (123) with nothing calling either - 273 characters in a
string with 23 free - while the over-budget fallback said to drop `D` first, the only one of the three
that had a caller (GLIDE, 12-10). Corrected in three places: **`F` is dropped** (R-2); **`A` gets its
caller**, LUMEN, whose two `s:gms` calls sit outside every gate and fire on every sample, which is
exactly what probe rule 3 forbids (12-11 puts them behind `A` and asserts one CC per moved axis); and
**the fallback order is re-derived** to drop the fewest-callers function first. The user's first bench
line now reaches an entry rather than stopping at the library.

### R-11. Probe rule 4 is an entry-level rule and the library does not carry it

"Single contact by default" is quoted in the phase's plans and implemented nowhere in the library -
correctly, because `H`, `T` and `P` are keyed by contact and CHORUS, CONSOLE, EUCLID and WHEELS all
want that. The rule lives in each entry as `if i>0 then return end` (MORPH and GHOST have it; GLIDE's
sketch has it), and WHEELS is the card that earns the two-finger bench row the rule's own second
sentence asks for. 12-07 states where each of the six probe rules lives rather than quoting the list.

### Also found in planning, outside the research

- **SAFE-03, SAFE-05 and SAFE-07 are falsified by the third string** and 12-12 amends all three by
  name. SAFE-07's criterion reads *"a write that lands one event but not the other"* - a two-event
  sentence - and its coverage row quotes the literal *"Timer reached your ZONA and Setup did not."*,
  which 12-03 replaces. **SAFE-04's coverage row names `hangar.snapshot.v1` by key** and 12-03 writes
  `.v2`, so it takes a qualifier rather than an amendment. The research named the seams and the copy
  but not the requirements, and the first draft of 12-12 named two of the three.
- **`e2e/fake-zona.ts` may re-declare `ZonaState`**; 12-02 checks and says which.
- **Partial writes:** with sequential writes that abort on failure, "system did not land, Setup did"
  cannot occur; the research's Pitfall 6 describes it. 12-03's classifier comment says so.
- **LUMEN's cursor** has the same one-unit boundary; 12-11 puts it on `Q` - **and LUMEN's two axis CCs, which fire on every sample outside every gate, go behind `A`**, making LUMEN the one caller of the function the user's own bench line asked for.
- **`moduleState` is a FACTORY, not a set of fixtures**, and both "twelve" and "eighteen" are wrong
  for it. `e2e/install.e2e.ts:215` declares `function moduleState(nth, over = {})` and it has
  **seventeen call sites, ids 1..17**. Its `configs` are keyed by event number for the touch element;
  12-02 keeps that shape and adds a `system` map beside it rather than re-keying anything - which is
  the point, because a re-key would touch all seventeen in a file 12-03 also edits. **12-02 counts the
  call sites at execution and reports the number as found**; if it is not seventeen, that is this
  document's defect and 12-12 names it.

---

## Why the waves are serial

No two plans run concurrently, for Phase 11's two reasons: every acceptance criterion asserts an
exact cumulative count, and several plans regenerate `frames.json` (12-04, 12-05, 12-06 conditionally,
12-10, 12-11). **One plan per wave where `frames.json` regenerates**; the plans that declare it and
expect NOT to move it (12-07, 12-08, 12-09) prove the zero with `git diff --quiet` and say so.

`wave` numbers are dependency groupings, one plan each; `depends_on` names the plan at the previous **wave**, which is not always the previous plan number - see the wave table below.

**One checkpoint sits mid-phase** (12-06, JOYSTICK's visual and the TRACKPAD default), by 11-09's
precedent; **one closes it** (12-12, the bench rows). If 12-06's answer is `trail` or `replace`, the
catalog and front-door chains branch and 12-10 and 12-12 read the recorded answer before writing a
number.

### The wave order is not the plan order, and 12-06 is why

```
wave  1     2     3     4     5     6     7     8     9     10    11    12
plan  12-01 12-02 12-03 12-04 12-05 12-07 12-08 12-09 12-06 12-10 12-11 12-12
```

**12-06 carries the phase's one blocking mid-phase checkpoint and exactly one plan reads its answer:
12-10**, for the TRACKPAD beside-or-replace half. At wave 6 it stopped nine plans - the whole library
and every re-fit - on an answer none of them consumes. It now sits **immediately before 12-10**.
**Plan numbers did not move and no plan was renumbered**; only `wave` and `depends_on` moved.

**The move is arithmetic-free and that is why it was allowed.** 12-06's term is `+0 / +0` on tests and
files and `+0` on catalog, OG, audition, sweep and e2e, so every chain in this document is
byte-identical under either placement. The carried names move with it and nothing else does:

| Plan | Carries | Was | Is |
|---|---|---|---|
| 12-07 | `PREV_FILES` / `PREV_TESTS` | 84 / 876 from 12-06 | 84 / 876 **from 12-05** - the same numbers |
| 12-06 | `PREV_FILES` / `PREV_TESTS` | 84 / 876 from 12-05 | **85 / 887 from 12-09** |
| 12-10 | `PREV_FILES` / `PREV_TESTS` | 85 / 887 from 12-09 | 85 / 887 **from 12-06** - the same numbers |

`frames.json` still regenerates in one plan per wave: 12-04 (wave 4), 12-05 (wave 5), 12-06
conditionally (now wave 9), 12-10 (wave 10), 12-11 (wave 11); 12-07, 12-08 and 12-09 (waves 6, 7, 8)
declare it and prove the zero. **JOYSTICK is a preset and no plan at waves 6, 7 or 8 touches
`presets.ts`**, so 12-06's five costed options are expected to measure identically to where they were
costed; a movement is a finding.

`static/og/` is at `26` when 12-06 runs under either placement, because the twenty-seventh file is
GLIDE's and arrives at 12-10 in both.

---

## Expected deltas after each plan

Deltas are the planner's estimate and are **reconciled at 12-12, never asserted**, except where a plan
names a per-file count.

| Plan | Wave | files | tests | sweep | e2e | Notes |
|---|---|---|---|---|---|---|
| 12-01 | 1 | +0 | **+1** | `4 19` | **+1 / +1** | `model.spec.ts` +1 (LUMEN depth 0/3, NINE PADS grid 0/1 land different pairs); one chromium title in `install.e2e.ts` (a rail turned, TRY clicked, RAM read). **The one plan that moves the e2e baseline** |
| 12-02 | 2 | +0 | **+4** | `4 19` | +0 (two files run, not the suite) | `constants.spec` +1, `descriptors.spec` +1, `sequence.spec` +1, `synthetic.spec` +1. The adapters keep every count above at two |
| 12-03 | 3 | +0 | **+3** | `4 19` | +0, suite run twice | `install.spec` +2, `snapshot.spec` +1; every pinned 2 → 3; D-11-08.1-a closed |
| 12-04 | 4 | +0 | **−3** | `4 19` faster | +0, suite run | `lua-smoke` 25 → 22 (FORGE, LATTICE, SHUTTLE); catalog −3; OG −3; audition −3; `DECLARED_EXCEPTIONS` 2 → 1 |
| 12-05 | 5 | +0 | **+2** | `4 19` | +0 | `lua-smoke` +1 (ARC), `view.spec` +1 (two-valued count → words); test 8 rewritten (+0); `frames.json` (NINE PADS) |
| 12-06 | **9** | +0 | **+0** | `4 19` | +0 | JOYSTICK decision; fixtures move under a look layer or the trail; written out |
| 12-07 | **6** | **+1** | **+8** | `4 19` by choice | +0 | `library.spec.ts` created with 3; `lua-smoke` +2; `lua-host.spec` +1; `host-surface.spec` +1; `model.spec` +1. `frames.json` proved unmoved |
| 12-08 | **7** | +0 | **+1** | `4 19` | +0 | `lua-smoke` +1 (boundary finger on **four** cell-toggling sequencers - SONAR joins the three the bench named, and a fourth subject in one test is not a fourth test); four Timers gain `X(s,20)`; QUADRANT recorded as a finding. `frames.json` proved unmoved |
| 12-09 | **8** | +0 | **+2** | `4 19` | +0 | `lua-smoke` +1 (CHORUS one voice, expiry) +1 (MORPH); CONSOLE +0 extended. `frames.json` proved or regenerated, stated |
| 12-10 | **10** | +0 | **+1** | `4 19` | +0, suite run | `lua-smoke` +1 (GLIDE); catalog +1; OG +1; audition +1 |
| 12-11 | 11 | +0 | **+0** | `4 19` | +0 | LUMEN's depth test extended with the exact-black, one-sysex and per-moved-axis CC clauses; `frames.json` (LUMEN) |
| 12-12 | 12 | +0 | **+0** | `4 19` | +0, suite run twice | the gate writes no tests — written out, so the term count is the plan count |
| **Phase total** | | **+1** | **+19** | `4 19` unchanged | **+1 / +1** | `1+4+3−3+2+0+8+1+2+1+0+0 = 19` in **twelve** terms; files `0+0+0+0+0+0+1+0+0+0+0+0 = 1`; e2e titles 86 → 87, runs 105 → 106 |

Per-file counts, asserted absolutely:

| File | Tests | Plan |
|---|---|---|
| `src/lib/catalog/library.spec.ts` | **3** | 12-07 (created) |
| `src/lib/tune/model.spec.ts` | +2 | 12-01, 12-07 |
| `src/lib/protocol/constants.spec.ts` | +1 | 12-02 |
| `src/lib/protocol/descriptors.spec.ts` | +1 | 12-02 |
| `src/lib/transport/sequence.spec.ts` | +1 (12-02), rewritten +0 (12-03) | 12-02, 12-03 |
| `src/lib/transport/fixtures/synthetic.spec.ts` | +1 | 12-02 |
| `src/lib/device/install.spec.ts` | +2 | 12-03 |
| `src/lib/device/snapshot.spec.ts` | +1 | 12-03 |
| `src/lib/sim/lua-smoke.spec.ts` | **25 → 29**: −3 (12-04) +1 (12-05) +2 (12-07) +1 (12-08) +2 (12-09) +1 (12-10) | six plans |
| `src/lib/tune/view.spec.ts` | +1 | 12-05 |
| `src/lib/sim/lua-host.spec.ts` | +1 | 12-07 |
| `src/lib/catalog/host-surface.spec.ts` | +1 | 12-07 |
| `src/lib/sim/lua-smoke.spec.ts` (12-08's row, restated) | +1 covering **four** entries | 12-08 - a fourth subject inside one test is not a fourth test |
| `src/lib/catalog/touch-guard.spec.ts` | unchanged (`toBe(2)` → 1 inside) | 12-04 |
| `src/lib/browse/facets.spec.ts` | unchanged (two literals move inside) | 12-04 |
| `src/lib/catalog/audition.spec.ts` | unchanged (`ROW_COUNT` 25 → 22 → 23) | 12-04, 12-10 |
| `src/lib/share/stamp.spec.ts` | unchanged (18 → 15 inside) | 12-04 |

`2+1+1+1+1+2+1+4+1+1+1 = 16`, plus `library.spec.ts`'s 3 = **19**. **12-12 derives each chain term from
this table** and names any row that was wrong.

Standing gates that must be green at the phase gate and are **not** edited:
`src/lib/fidelity/firmware-oracle.spec.ts` (the proof the phase walk was not touched),
`src/lib/fidelity/lua-parity.spec.ts`, `src/lib/fidelity/preset-baseline.spec.ts` and its `.json`,
`src/lib/fidelity/vendored-diff.spec.ts`, `src/lib/format-parity.spec.ts`, `src/lib/protocol-pin.spec.ts`,
`src/lib/catalog/decay-idiom.spec.ts` (edited only if 12-10 finds it blind to `D(`, and then named),
`e2e/catalog.e2e.ts`, `e2e/fidelity.e2e.ts`.

---

## The vendored boundary, restated

**No plan in this phase edits `src/vendor/`.** The Lua host is HANGAR's (`src/lib/sim/lua-host.ts`);
the library is HANGAR's (`src/lib/catalog/library.ts`); every re-fit is a hand-authored entry. The
compiler's constants may change under D-02's permission and nothing here needs them to; the simulator's
phase walk may not change and nothing here touches it. `git diff --stat HEAD -- src/vendor/` equals
`upstream-manifest.json`'s rows in every plan, and `firmware-oracle.spec.ts` is green and unedited at
the gate.

---

## The two class gates, and the library's own Lua

`decay-idiom.spec.ts` and `touch-guard.spec.ts` apply to every entry this phase touches and to the
library string: `library.spec.ts` test (c) builds the touch-guard needles from fragments and runs them
over `TOUCH_LIBRARY`; `D` lands on phase 0 by construction (rate 250, `w` a multiple of 6). **Whether
`decay-idiom.spec.ts` can see a decay that runs through `D(n,l,w)` rather than a literal `glpfs` pair
is established by 12-10** (GLIDE is the first caller) and recorded either way — a gate that cannot see
through a call is a finding for 12-12, not a reason to inline.

---

## The 908-character budget, per request

Every request costed **before** it is designed at the RGB444 picker corner, `cost =
max(GridScript.compressScript(lua).length, lua.length)` after `padReady()`; free at defaults and free
at worst in separate columns; **a request that cannot fit is a finding, not a failure**.

| Entry | Setup (defaults / picker) | free at worst | What this phase asks |
|---|---|---|---|
| library | — / **770 raw** (planning; the superseded sketch was 885 under the minifier) | measure | run in a VM, canonicalise, measure, pin. **Six functions, each with a named caller**; fallback order `A` then `D`, never `Q W E X` |
| euclid | 786 / 790 | 118 | `Q` in place of the inlined guard (−125 − 9 + 44 = −90 in Setup); `X(s,20)` **+7 in the Timer** |
| steps | 473 / 479 | 429 | same |
| radar-points | 579 / 579 | 329 | same |
| **sonar** | audition row records 558 / 279 at defaults - **re-measure at the picker corner; do not carry** | measure | the same `Q` and the same `X`; the fourth carrier of the identical guard |
| quadrant | audition row records 835, no Timer | measure | **not re-fitted.** A finding: onset-only, so Q2 does not reach it; Q6.5 through `s.k[i]`; closing it needs `R` plus a Timer it does not have |
| console | 821 / 844 | 64 | +8 (12-05), then `Q` (12-09); **the tightest**; if `Q` does not fit beside +8, a finding |
| morph | 706 / 710 | 198 | +0 corners, +56 margin, `Q` for the trail; `D` not used (42-tick ceiling) |
| chorus | 768 / 771; Timer 173 / 174 | 137 / 734 | one voice through `Q R X`; the Timer shrinks |
| arc | 520 / 523 | 385 | +18 |
| lumen | 742 / 746 | 162 | 32/32 re-cut (neutral), `Q` for the cursor, **and `A` for the two axis CCs** (26 against the 46 they cost today; it is `A`'s one caller and `A` inverts y, which is a wire change on `@CC+1`) |
| glide | — | — | 553 with `D` at the widest colour; knobs to be costed at birth |
| ninepads (preset) | 580 → 556 or 550 | — | the default moves; measured, not chosen |
| joystick (preset) | 532 | — | 468 / 603 / 621 / 641 / 652 per the answer |

---

## Sampling Rate

- **After every task:** `npm run test:quick`, plus `npm run lint` when a source moved, plus the
  per-file commands the plan names. Free memory beside every run.
- **After every wave:** `npm run check 2>&1 | grep -Ei "error|warning"`, `npm run lint`,
  `npm run test:quick`, and `npm run test:sweep` for every wave that changes an entry's Lua, a knob's
  value list or the library — every plan from wave 4 to wave 11, which is 12-04, 12-05, 12-07, 12-08, 12-09, 12-06, 12-10 and 12-11 in wave order.
- **`npm run build`** for any wave that changes catalog membership or a picture (12-04, 12-05, 12-06
  under a layer or the trail, 12-10, 12-11), then `npm run test:quick` again.
- **e2e runs in FIVE plans** — 12-01 (the title that moves the baseline), 12-03 (the counts at three;
  run twice), 12-04 (routes and OG images stop for three ids), 12-10 (a new route and image), 12-12
  (the gate; run twice). Their waves are 1, 3, 4, 10 and 12. 12-02 runs two files, not the suite, to
  prove its adapters. Every other plan proves its zero with `grep -c "test("`.
- **Do not commit while the suite is running** (`artifacts.e2e.ts` reads `HEAD`).
- **Max feedback latency:** ~45 s (quick), ~3 min (wave with the sweep), ~6 min (wave with a build
  and e2e).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated command / evidence | File exists | Status |
|---|---|---|---|---|---|---|---|
| 12-01-01 | 01 | 1 | TUNE-02 | unit (real timers) | `model.spec.ts` +1: LUMEN depth 0/3 and NINE PADS grid 0/1 land different pairs through `recorder()` and `pause`; lengths printed | exists | pending |
| 12-01-02 | 01 | 1 | SAFE-02, SAFE-07 | e2e | one chromium title: rail turned on `/c/lumen/`, TRY, `zona.state.configs[0]` carries the tuned literal derived from the entry; count read after PLAYING NOW; suite `105 + 1`; **the verdict written for 12-05 and 12-11, or the wiring fixed here** | exists | pending |
| 12-02-01 | 02 | 2 | SAFE-03 | unit | `ELEMENT_SYSTEM`, `SYSTEM_EVENTS`, `SYSTEM_DEFAULT_SETUP` (24, from the package), `defaultFor(element, event)`; `sendConfig`/`fetchConfig` with an element in descriptor and filter; the 255 round trip through `match.ts` | exists | pending |
| 12-02-02 | 02 | 2 | SAFE-07 | unit | `writeAll` three frames 255/0, 0/6, 0/0 under three ids; `fetchAll` three; `writeBoth` still two (the adapter's promise) | exists | pending |
| 12-02-03 | 02 | 2 | CAT-04 | unit + e2e (two files) | the fake keeps two RAMs apart, echoes the requested element, answers the factory default; the `moduleState` **factory** (`install.e2e.ts:215`) and its **seventeen** call sites untouched, the count reported as found; `install.e2e` and `session.e2e` green at two | exists | pending |
| 12-03-01 | 03 | 3 | SAFE-01, SAFE-03, SAFE-04, SAFE-07, SAFE-09 | unit | the five store sites over three; classifier over three ids with the impossible partial named; snapshot v2 with v1 read as default and never overwritten; the tuner's constant `system`; adapters gone | exists | pending |
| 12-03-02 | 03 | 3 | SAFE-05, SAFE-08 | e2e + docs | third textarea; **twenty-two enumerated sites in `install.e2e.ts` of which twenty move, `:644` and `:670` proved unchanged and `:613` at 5 not 6, eleven step-line arrays re-subjected, five sites in `session.e2e.ts` including `:338`'s `4 * connects`**; D-11-08.1-a's wait; runbook rows C and E, the white-flash sentence; suite `106` twice | exists | pending |
| 12-04-01 | 04 | 4 | CAT-01, CAT-04, CONT-02 | unit + build + e2e | three entries gone, every table row moved, `lua-smoke` −3, `DECLARED_EXCEPTIONS` 1, `frames.json` at 26, catalog `BASE_CATALOG − 3` | exists | pending |
| 12-04-02 | 04 | 4 | CAT-03, CONT-03 | unit | `keys` retired, **`harmonic` re-targeted off it** from `10-06-SUMMARY.md:280`, `RETIRED_VOCABULARY` and the four `55` literals plus the sorted-order assertion proved unmoved, the `?for=keys` drop recorded; CHORUS → `play`, LUMEN → `still` with its motion-axis doubt and its named alternatives; seven FOR / thirteen; both rules pass unweakened; **three** planted states red naming the term | exists | pending |
| 12-05-01 | 05 | 5 | CONT-02 | unit (real VM) | ARC +18 with the in-cell MOVE test and the re-armed rate recorded; CONSOLE +8 with test 8 rewritten to the user's sentence | exists | pending |
| 12-05-02 | 05 | 5 | CONT-01, TUNE-01 | unit + build | NINE PADS default 4x4, `shapeOf` equal, 550/556 settled; a two-valued `count` knob renders as words, PINWHEEL's `arms` a rail; `frames.json` and the OG regenerated | exists | pending |
| 12-06-01 | 06 | 9 | — | **checkpoint:decision** | JOYSTICK: trail / shimmer / wave / swirl / ripple / as-is, each with its front-door consequence; TRACKPAD: beside (default) or replace | n/a | pending |
| 12-06-02 | 06 | 9 | CONT-01, PREV-01, SHARE-04 | unit + build | the answer at the quoted cost re-measured; `golden-frames.json` before `frames.json`; the front door's three properties re-derived in any branch that moves them; `+0` | exists | pending |
| 12-07-01 | 07 | 6 | CONT-02, PREV-02 | unit (real VM) | the **revised** sketch (raw 770; `F` dropped, `Q` expiring contact `i` on onset) run in wasmoon on the research's nine samples, the probe's 71/72 boundary and **a same-id re-press** before it is measured, canonicalised and pinned; `library.ts` + `library.spec.ts` (3, the third running **both** class gates over the string); `lua-smoke` +2 (hysteresis over the seven-value band, per-axis sends; **all four** expiry paths through `R`; a reporting contact not released; `D` lands) | **Wave 0 gap — the files do not exist** | pending |
| 12-07-02 | 07 | 6 | PREV-01, TUNE-05, SAFE-02 | unit | the host runs `system` after the snapshot and on restart with tables proved empty; `createLuaPadSim` and `open()` pass it; `host-surface` admits the derived globals and scans the library; the tuner publishes the library for Lua entries; `frames.json` zero | exists | pending |
| 12-08-01 | 08 | 7 | CONT-02, TUNE-05 | unit + sweep | EUCLID, STEPS, RADAR POINTS **and SONAR** on `Q`, and `X(s,20)` in all four Timers; `self.q` gone; eight measured before/after pairs; headers say why `X` is there and what was not taken; **QUADRANT recorded as a finding** | exists | pending |
| 12-08-02 | 08 | 7 | PREV-01 | unit (real VM) | a boundary finger arms one cell on all **four**, counted, with SONAR's final state asserted ON; a stale `H` entry proved cleared after 21 Timer calls; both pre-plan counts recorded; `frames.json` zero | exists | pending |
| 12-09-01 | 09 | 8 | CONT-02 | unit (real VM) | CHORUS one voice through `Q R X` with the sounding count never above three and the quiet-finger release; CONSOLE's cell from `Q`, mute-row swipe still one per column | exists | pending |
| 12-09-02 | 09 | 8 | CONT-02, PREV-01 | unit (real VM) | MORPH 3x3 corners, margin, `Q` for the trail with weights still moving inside a cell; the research's shape proved wrong by the frozen count | exists | pending |
| 12-10-01 | 10 | 10 | CONT-02, TUNE-01, TUNE-05 | unit + sweep | `glide.ts` costed before designed, both axes, `D`, the worst knob corner inside 908, the shape character at birth; the decay gate's sight through `D(` established | **Wave 0 gap — the entry does not exist** | pending |
| 12-10-02 | 10 | 10 | CONT-03, CAT-01, CAT-04, SHARE-04 | unit + build + e2e | listing, exclusion, demo path, `lua-smoke` +1, `frames.json` at 27, OG at 27, audition at 23, `RECORDED` recounted; suite `106` | exists | pending |
| 12-11-01 | 11 | 11 | CONT-02, TUNE-01, SHARE-01, **PREV-02** | unit + build | 32/32 re-cut with exact black at index 3 on emitted bytes, `shapeOf` equal, the cursor on `Q` with one sysex counted, **the two axis CCs on `A` with one CC per moved axis counted, `A` outside the `Q` gate, and the y inversion asserted**, the anchor-row sentence in the card, 12-01's verdict quoted | exists | pending |
| 12-12-01 | 12 | 12 | all | phase gate | `84 + 1` / `869 + 19` in twelve terms, term count asserted; sweep `4 19`; e2e `87 / 106` twice; catalog 27 as a chain; every touched entry at the picker corner; every wrong projection named | exists | pending |
| 12-12-02 | 12 | 12 | SAFE-03, SAFE-05, SAFE-07, all touched | docs | the three amendments and SAFE-04's superseded row; every qualifier's unproved half; `deferred-items.md` sections A–E; the bench-note trace; the ROADMAP row for the SUMMARY | created here | pending |
| 12-12-03 | 12 | 12 | — | **checkpoint:human-verify** | the bench rows, the probe's two findings first; the hardware findings; the retired readings; the open items | n/a | pending |

*Status: pending / green / red / flaky. Every row starts pending; an executing plan updates only its own rows.*

---

## Wave 0 Requirements

No framework gap: Vitest, Playwright, both browser binaries, `wrangler`, `svelte-check`, ESLint and
Prettier are installed and pinned, and **no dependency moves in this phase**. The gaps are files and
one measurement.

- [ ] **The knob-to-wire verdict** — `model.spec.ts` +1 and one e2e title, taken **first** because a
      red reorders the phase and a green closes a suspect → **12-01**
- [ ] `src/lib/catalog/library.ts` and `src/lib/catalog/library.spec.ts` — the library and its three
      gates, **run in a VM before the string is pinned**, on the revised sketch (raw 770) rather than
      the superseded 885, and with the same-id re-press driven before anything is pinned → **12-07-01**
- [ ] `src/lib/catalog/entries/glide.ts` — the from-scratch trackpad, costed before designed →
      **12-10-01**
- [ ] `.planning/phases/12-touch-framework/deferred-items.md` → **12-12-02**
- [ ] **Whether `decay-idiom.spec.ts` sees through a `D(` call** — established by the first caller →
      **12-10-01**, recorded by **12-12**
