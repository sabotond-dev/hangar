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
BASE_CATALOG (29)
  +0 (12-01) +0 (12-02) +0 (12-03)
  −3 (12-04: lattice, forge, shuttle)
  +0 (12-05) +0 (12-06) +0 (12-07) +0 (12-08) +0 (12-09)
  +1 (12-10: glide, beside the tpad preset)   — or +0 under `replace` at 12-06, with tpad gone
  +0 (12-11) +0 (12-12)
  = 27, split 9 + 18                         — or 26, split 8 + 18, under `replace`
```

**Twelve terms, one per plan, every `+0` written out.** `static/og/` and the audition rows follow the
same two terms: 29 → 26 → 27 and 25 → 22 → 23.

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

### R-2. The library with the probe's expiry rule does not fit the research's shape

The research costed `Q W A F D` at 643 with no expiry. The probe requires two expiry paths. Measured
under the pinned minifier during planning: the research's shape plus expiry with a per-contact light
layer is **954**; with the light layer held once in a global `L` it is **885 of 908** (syntax true,
**not yet run in a VM**). 12-07 carries the 885 sketch and runs it in wasmoon before pinning; `D`
is the first thing dropped if the VM moves it past 908.

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

### R-6. The tenth-removal warning was about `precise` and `still`; the twelfth breaks `keys` and `still`

`facets.ts:15` and `:104` say `precise` and `still` sit at six. After LATTICE, FORGE and SHUTTLE:
`keys` is a singleton (CHORUS) and `still` is five; `precise` is untouched. The research's re-homing
(retire `keys`, CHORUS → `play`, LUMEN → `still`) is taken; the header sentence is rewritten for the
thirteenth removal, not the tenth.

### R-7. Three readings retired by the probe, recorded rather than argued

The sRGB-gamma hypothesis for LUMEN (Probe B: four steps distinct, 27 clearly lit); code 9 as a
practical event (Q3: never for a human tap, so `touch.ts` is faithful and `TOUCH-CODE-9.md`'s framing
is superseded — pointed at, never edited); the fast-tap reading of "not precise" (Q2: the one-unit
boundary). Every plan that touches an entry Phase 11 fixed for code 9 says the fix was correct and
harmless and not the complaint.

### Also found in planning, outside the research

- **SAFE-03 and SAFE-05 are falsified by the third string** and 12-12 amends both by name. The
  research named the seams and the copy but not the requirements.
- **`e2e/fake-zona.ts` may re-declare `ZonaState`**; 12-02 checks and says which.
- **Partial writes:** with sequential writes that abort on failure, "system did not land, Setup did"
  cannot occur; the research's Pitfall 6 describes it. 12-03's classifier comment says so.
- **LUMEN's cursor** has the same one-unit boundary; 12-11 puts it on `Q`.
- **The probe document's `moduleState` fixtures** are keyed by event for the touch element; 12-02
  keeps that shape and adds a `system` map beside it rather than re-keying twelve fixtures.

---

## Why the waves are serial

No two plans run concurrently, for Phase 11's two reasons: every acceptance criterion asserts an
exact cumulative count, and several plans regenerate `frames.json` (12-04, 12-05, 12-06 conditionally,
12-10, 12-11). **One plan per wave where `frames.json` regenerates**; the plans that declare it and
expect NOT to move it (12-07, 12-08, 12-09) prove the zero with `git diff --quiet` and say so.

`wave` numbers are dependency groupings, one plan each; `depends_on` names the previous plan.

**One checkpoint sits mid-phase** (12-06, JOYSTICK's visual and the TRACKPAD default), by 11-09's
precedent; **one closes it** (12-12, the bench rows). If 12-06's answer is `trail` or `replace`, the
catalog and front-door chains branch and 12-10 and 12-12 read the recorded answer before writing a
number.

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
| 12-06 | 6 | +0 | **+0** | `4 19` | +0 | JOYSTICK decision; fixtures move under a look layer or the trail; written out |
| 12-07 | 7 | **+1** | **+8** | `4 19` by choice | +0 | `library.spec.ts` created with 3; `lua-smoke` +2; `lua-host.spec` +1; `host-surface.spec` +1; `model.spec` +1. `frames.json` proved unmoved |
| 12-08 | 8 | +0 | **+1** | `4 19` | +0 | `lua-smoke` +1 (boundary finger on three sequencers). `frames.json` proved unmoved |
| 12-09 | 9 | +0 | **+2** | `4 19` | +0 | `lua-smoke` +1 (CHORUS one voice, expiry) +1 (MORPH); CONSOLE +0 extended. `frames.json` proved or regenerated, stated |
| 12-10 | 10 | +0 | **+1** | `4 19` | +0, suite run | `lua-smoke` +1 (GLIDE); catalog +1; OG +1; audition +1 |
| 12-11 | 11 | +0 | **+0** | `4 19` | +0 | LUMEN's depth test extended; `frames.json` (LUMEN) |
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
| library | — / **885** (planning) | 23 | run in a VM, pin; `D` dropped first if it does not fit |
| euclid | 786 / 790 | 118 | `Q` in place of the inlined guard (−90 projected) |
| steps | 473 / 479 | 429 | same (−85) |
| radar-points | 579 / 579 | 329 | same (−90) |
| console | 821 / 844 | 64 | +8 (12-05), then `Q` (12-09); **the tightest**; if `Q` does not fit beside +8, a finding |
| morph | 706 / 710 | 198 | +0 corners, +56 margin, `Q` for the trail; `D` not used (42-tick ceiling) |
| chorus | 768 / 771; Timer 173 / 174 | 137 / 734 | one voice through `Q R X`; the Timer shrinks |
| arc | 520 / 523 | 385 | +18 |
| lumen | 742 / 746 | 162 | 32/32 re-cut (neutral), `Q` for the cursor |
| glide | — | — | 553 with `D` at the widest colour; knobs to be costed at birth |
| ninepads (preset) | 580 → 556 or 550 | — | the default moves; measured, not chosen |
| joystick (preset) | 532 | — | 468 / 603 / 621 / 641 / 652 per the answer |

---

## Sampling Rate

- **After every task:** `npm run test:quick`, plus `npm run lint` when a source moved, plus the
  per-file commands the plan names. Free memory beside every run.
- **After every wave:** `npm run check 2>&1 | grep -Ei "error|warning"`, `npm run lint`,
  `npm run test:quick`, and `npm run test:sweep` for every wave that changes an entry's Lua, a knob's
  value list or the library — 12-04 through 12-11.
- **`npm run build`** for any wave that changes catalog membership or a picture (12-04, 12-05, 12-06
  under a layer or the trail, 12-10, 12-11), then `npm run test:quick` again.
- **e2e runs in FIVE waves** — 12-01 (the title that moves the baseline), 12-03 (the counts at three;
  run twice), 12-04 (routes and OG images stop for three ids), 12-10 (a new route and image), 12-12
  (the gate; run twice). 12-02 runs two files, not the suite, to prove its adapters. Every other wave
  proves its zero with `grep -c "test("`.
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
| 12-02-03 | 02 | 2 | CAT-04 | unit + e2e (two files) | the fake keeps two RAMs apart, echoes the requested element, answers the factory default; twelve `moduleState` fixtures untouched; `install.e2e` and `session.e2e` green at two | exists | pending |
| 12-03-01 | 03 | 3 | SAFE-01, SAFE-03, SAFE-04, SAFE-07, SAFE-09 | unit | the five store sites over three; classifier over three ids with the impossible partial named; snapshot v2 with v1 read as default and never overwritten; the tuner's constant `system`; adapters gone | exists | pending |
| 12-03-02 | 03 | 3 | SAFE-05, SAFE-08 | e2e + docs | third textarea; every 2 → 3 in both e2e files; D-11-08.1-a's wait; runbook rows C and E, the white-flash sentence; suite `106` twice | exists | pending |
| 12-04-01 | 04 | 4 | CAT-01, CAT-04, CONT-02 | unit + build + e2e | three entries gone, every table row moved, `lua-smoke` −3, `DECLARED_EXCEPTIONS` 1, `frames.json` at 26, catalog `BASE_CATALOG − 3` | exists | pending |
| 12-04-02 | 04 | 4 | CAT-03, CONT-03 | unit | `keys` retired, CHORUS → `play`, LUMEN → `still`; seven FOR / thirteen; both rules pass unweakened; two planted states red naming the term | exists | pending |
| 12-05-01 | 05 | 5 | CONT-02 | unit (real VM) | ARC +18 with the in-cell MOVE test and the re-armed rate recorded; CONSOLE +8 with test 8 rewritten to the user's sentence | exists | pending |
| 12-05-02 | 05 | 5 | CONT-01, TUNE-01 | unit + build | NINE PADS default 4x4, `shapeOf` equal, 550/556 settled; a two-valued `count` knob renders as words, PINWHEEL's `arms` a rail; `frames.json` and the OG regenerated | exists | pending |
| 12-06-01 | 06 | 6 | — | **checkpoint:decision** | JOYSTICK: trail / shimmer / wave / swirl / ripple / as-is, each with its front-door consequence; TRACKPAD: beside (default) or replace | n/a | pending |
| 12-06-02 | 06 | 6 | CONT-01, PREV-01, SHARE-04 | unit + build | the answer at the quoted cost re-measured; `golden-frames.json` before `frames.json`; the front door's three properties re-derived in any branch that moves them; `+0` | exists | pending |
| 12-07-01 | 07 | 7 | CONT-02, PREV-02 | unit (real VM) | the 885 sketch run in wasmoon on the research's nine samples and the probe's 71/72 boundary before pinning; `library.ts` + `library.spec.ts` (3); `lua-smoke` +2 (hysteresis, sends, light; both expiry paths through `R`; a reporting contact not released; `D` lands) | **Wave 0 gap — the files do not exist** | pending |
| 12-07-02 | 07 | 7 | PREV-01, TUNE-05, SAFE-02 | unit | the host runs `system` after the snapshot and on restart with tables proved empty; `createLuaPadSim` and `open()` pass it; `host-surface` admits the derived globals and scans the library; the tuner publishes the library for Lua entries; `frames.json` zero | exists | pending |
| 12-08-01 | 08 | 8 | CONT-02, TUNE-05 | unit + sweep | EUCLID, STEPS, RADAR POINTS on `Q`; `self.q` gone; measured savings; headers say what was not taken | exists | pending |
| 12-08-02 | 08 | 8 | PREV-01 | unit (real VM) | a boundary finger arms one cell on all three, counted; the pre-plan count recorded; `frames.json` zero | exists | pending |
| 12-09-01 | 09 | 9 | CONT-02 | unit (real VM) | CHORUS one voice through `Q R X` with the sounding count never above three and the quiet-finger release; CONSOLE's cell from `Q`, mute-row swipe still one per column | exists | pending |
| 12-09-02 | 09 | 9 | CONT-02, PREV-01 | unit (real VM) | MORPH 3x3 corners, margin, `Q` for the trail with weights still moving inside a cell; the research's shape proved wrong by the frozen count | exists | pending |
| 12-10-01 | 10 | 10 | CONT-02, TUNE-01, TUNE-05 | unit + sweep | `glide.ts` costed before designed, both axes, `D`, the worst knob corner inside 908, the shape character at birth; the decay gate's sight through `D(` established | **Wave 0 gap — the entry does not exist** | pending |
| 12-10-02 | 10 | 10 | CONT-03, CAT-01, CAT-04, SHARE-04 | unit + build + e2e | listing, exclusion, demo path, `lua-smoke` +1, `frames.json` at 27, OG at 27, audition at 23, `RECORDED` recounted; suite `106` | exists | pending |
| 12-11-01 | 11 | 11 | CONT-02, TUNE-01, SHARE-01 | unit + build | 32/32 re-cut with exact black at index 3 on emitted bytes, `shapeOf` equal, the cursor on `Q` with one sysex counted, the anchor-row sentence in the card, 12-01's verdict quoted | exists | pending |
| 12-12-01 | 12 | 12 | all | phase gate | `84 + 1` / `869 + 19` in twelve terms, term count asserted; sweep `4 19`; e2e `87 / 106` twice; catalog 27 as a chain; every touched entry at the picker corner; every wrong projection named | exists | pending |
| 12-12-02 | 12 | 12 | SAFE-03, SAFE-05, all touched | docs | the two amendments; every qualifier's unproved half; `deferred-items.md` sections A–E; the bench-note trace; the ROADMAP row for the SUMMARY | created here | pending |
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
      gates, **run in a VM before the string is pinned** → **12-07-01**
- [ ] `src/lib/catalog/entries/glide.ts` — the from-scratch trackpad, costed before designed →
      **12-10-01**
- [ ] `.planning/phases/12-touch-framework/deferred-items.md` → **12-12-02**
- [ ] **Whether `decay-idiom.spec.ts` sees through a `D(` call** — established by the first caller →
      **12-10-01**, recorded by **12-12**
