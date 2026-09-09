---
phase: 11
slug: bench-corrections
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-09
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is the Nyquist contract. `docs/TESTING.md` (updated by plan 11-16) is the developer-facing
> companion and deliberately does not duplicate the map below.
>
> Binding upstream: `BENCH-2026-09-09.txt` (the user's own words, and the only authority on what is
> wrong), `11-CONTEXT.md` (D-01 to D-04), `11-RESEARCH.md` and `WHEELS-REQUEST.md`. Where this
> document contradicts the research it says so by name, in **Where this document corrects the
> research**, with the evidence.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11, two projects — `server` (quick) and `sweep` — plus @playwright/test 1.62.1 over `wrangler dev` on `./build`, two projects: `chromium` and `webkit-phone` grepped on `@webkit` |
| **Config file** | `vite.config.ts` (Vitest) and `playwright.config.ts` — **neither is edited in this phase.** No new sweep member is created; the `*.sweep.spec.ts` file-name rule routes any that ever is |
| **Quick run** | `npm run test:quick` (= `vitest run --project server`) |
| **Sweep** | `npm run test:sweep` (= `vitest run --project sweep`) |
| **Wave run** | `npm run check && npm run lint && npm run test:quick`, plus `npm run test:sweep` for **every wave that changes an entry's Lua, a knob's value list, or anything under `src/vendor/`** — which in this phase is most of them |
| **Full suite** | the wave run plus `npm run build` and `npm run test:e2e -- --workers 3` |
| **Count gate** | `… 2>&1 \| node scripts/check-counts.mjs <files> <tests>` — baseline plus delta, never a literal total, with the one standing exception: the sweep's `4 19`, which is the sweep project's **member list** and not a total that accumulates. Every plan in this phase asserts it **unchanged** |
| **New dependencies** | **none.** No package is installed, uninstalled or bumped. `@intechstudio/grid-protocol` stays at the exact pin `1.20260825.1135`; `wasmoon` stays at `1.16.0` |
| **Hardware** | **none, to any agent.** Nothing opens a serial port and nothing deploys. Every claim in this phase is measured in the simulator, in the Lua host or read out of firmware C, and the plans say so in those words |

---

## Baselines: measured, and carried by name

Measured on this tree at `a17e926` on 2026-09-09 and stated in the phase brief:

**quick `81 / 828` (+1 todo)** · **sweep `4 19`** · **e2e `103`** · **`svelte-check` 584 files, 0/0** ·
**catalog `36`** (9 preset, 27 Lua) · **`FRONT_DOOR` 8** · **`EXCLUDED_FROM_ROW` 28**.

`11-01-01` re-measures the block on a clean tree and **its observation rules**. If it disagrees with
any number above, the observation is the phase's and every later plan quotes it — the disagreement is
reported, never reconciled quietly. That instruction is not decoration: Phase 10 miscounted seven
times, and every one of the seven was somebody reconciling a number instead of reporting that two
numbers disagreed.

### The carry-forward block

| Name | What it is | How it moves |
|---|---|---|
| `BASE_FILES` | the `test:quick` **file** count on the clean tree Phase 10 closed, measured once in 11-01 | **never moves.** Only 11-16 writes an arithmetic against it |
| `BASE_TESTS` | the `test:quick` **passing test** count on that same clean tree | **never moves.** The todo count is reported and never asserted |
| `PREV_FILES` | the `test:quick` **file** count **as that plan left the tree** | starts equal to `BASE_FILES`; re-measured by every plan that changes it; copied verbatim otherwise |
| `PREV_TESTS` | the `test:quick` **passing test** count as that plan left the tree | moves the way `PREV_FILES` does |
| `BASE_SWEEP` | the sweep project's **member list**, expected `4 19` | **never moves in this phase.** No sweep file is added and no sweep test is split. Every plan asserts `4 19` unchanged; if it ever moves, the plan that moved it says so by name |
| `BASE_SWEEP_WALL` | the `npm run test:sweep` wall clock on the clean tree, with free memory beside it | **never moves.** Measured in 11-01. 11-16 compares against it. The sweep gets **cheaper** in this phase — 36 entries become 28 — and a wall clock that did not fall is evidence the removal did not reach the sweep |
| `PREV_SWEEP_WALL` | the last measured sweep wall clock | re-measured by 11-01 and 11-16 |
| `BASE_E2E` | the Playwright total on the clean tree, measured once in 11-01 | **never moves.** 11-16 asserts against it |
| `PREV_E2E` | the last measured Playwright total, with the plan that measured it named beside it | starts equal to `BASE_E2E`; re-measured by **11-01, 11-05, 11-08.1, 11-15 and 11-16** — **five plans, not four and not three**. 11-15 builds a new route and a new OG image and runs the suite at `11-15:320` and `:361`, so under the `BASE_SWEEP` row's own contract it names itself; **11-08.1 is the one plan in the phase that MOVES this baseline**, 103 to 105, because a canvas context-loss fix is unprovable without a browser |
| `BASE_OG_BYTES` | `static/og/` total bytes over its file count on the clean tree | **never moves.** 11-16 compares. It is 36 files before this phase and **28** after |
| `BASE_CATALOG` | `CATALOG.length` on the clean tree, expected 36 | **never moves.** Every plan states the running catalog size as a carried name plus a delta, never as a restated total |

`BASE_CHECK` (the `svelte-check` file count, 584) is **provenance only**. It falls with the removal
and nothing asserts it; only `0 errors, 0 warnings` is asserted, read with
`npm run check 2>&1 | grep -Ei "error|warning"`, whose one matching line must read `0 ERRORS 0 WARNINGS`.

Any plan that finds a name missing from the SUMMARY it reads **stops rather than guessing**.

---

## The catalog count, as a chain

The phase's headline number is a chain, for the same reason the test total is:

```
BASE_CATALOG (36)
  −9 (11-01: hold, keys, learn, switch, etch, gridlock, life, slam, table)
  +0 (11-02) +0 (11-03) +0 (11-04) +0 (11-05) +0 (11-06) +0 (11-07) +0 (11-08)
  +0 (11-08.1) +0 (11-09) +0 (11-10) +0 (11-11) +0 (11-12) +0 (11-13)
  + T14 (11-14: +0 if RADAR changes SOURCE, +1 under new-entry — see the ring question)
  +1 (11-15: the wheels)
  +0 (11-16)
  = 28, or 29 under new-entry
```

**`T14` is a function of an answer the user has not yet given**, and it moves four downstream numbers
together. 11-14 carries the authoritative branch table and its SUMMARY copies the applicable row;
11-15 and 11-16 read that row rather than restating a literal:

| 11-14's answer | `T14` | catalog | preset / Lua | `static/og/` | audition rows after 11-15 | test total |
|---|---|---|---|---|---|---|
| `ring-seven` | +0 | **28** | 8 + 20 | 28 | 24 | `BASE_TESTS + 36` |
| `ring-eight-lua` | +0 | **28** | 8 + 20 | 28 | 24 | `BASE_TESTS + 36` |
| `new-entry` | **+1** | **29** | 9 + 20 | **29** | **25** | `BASE_TESTS + 36` |
| `fold-into-sonar` | +0 | **28** | 9 + 19 | 28 | 24 | `BASE_TESTS + 35` |

**Seventeen terms, one per plan, and every `+0` is written out rather than omitted**, because a zero
absent from a chain is indistinguishable from a term nobody computed. The split behind the 28 moves
too and is stated the same way: **9 preset-backed + 19 hand-authored Lua**, unless 11-14's ring
question is answered in a way that moves radar out of the preset-backed set, in which case it is
**8 + 20** and 11-14 says so.

---

## Where this document corrects the research

`11-RESEARCH.md` is measured rather than argued and almost all of it holds. Five things in it are
wrong or missing, and each is load-bearing enough that a plan written from the research alone would
have discovered them during execution instead of during planning.

### R-1. Dropping the byte-pin breaks **seven** assertions, not two

`11-CONTEXT.md` D-02 and the research both name `vendored-diff.spec.ts` and `VENDOR.md` as the things
that assert `git diff --stat HEAD -- src/vendor/` is empty. Read from the tree, the same claim is made
in five more places, and three of them forbid the obvious repair:

| # | Site | What it asserts | Named by the research? |
|---|---|---|---|
| 1 | `src/lib/fidelity/vendored-diff.spec.ts` (**14** tests: 6 files × 2 `it.each` + 2) | reconstructed pristine bytes hash to `upstream-manifest.json` | yes |
| 2 | `src/vendor/botor/VENDOR.md` | the sync procedure and "modified: nothing" | yes |
| 3 | **`src/vendor/botor/tests/pad.test.js`** | contains the literal `glpfs(a,1,255,250,0)`. It is **itself a vendored file under the manifest**, so repairing it is a second divergence inside a file whose whole purpose is to be upstream's | **no** |
| 4 | **`src/lib/fidelity/preset-baseline.spec.ts` + `.json`** | compiles the vendored `PRESETS` with the vendored compiler and compares `setupLua` **character for character** against a fixture captured by running BOTOR's own compiler in BOTOR's own tree. Its header: *"a mismatch here is a STOP-and-report, never a fixture edit (D-08)"* | **no** |
| 5 | **`src/lib/fidelity/golden-frames.json`** | per-preset frame hashes from `PadSim` over the vendored preset states. `pad-sim.ts` carries the same `255` constant at four sites, so a compiler-only fix would make the **preview disagree with the device** — the exact failure D-02 exists to prevent, arrived at from the other side | **no** |
| 6 | **`REQUIREMENTS.md` CONT-01** | *"each compiling to the same Lua as BOTOR at the pinned protocol version"* | **no** |
| 7 | **`REQUIREMENTS.md` FOUND-02** | *"with their existing test suites passing unchanged"* | **no** |

Consequences the plans own: 11-03 lands the divergence machinery with an **empty** table and re-cuts
the two fidelity contracts before a single byte moves; 11-04 spends the table; 11-16 amends CONT-01
and FOUND-02 by name and dated, rather than leaving two requirements whose wording the phase
deliberately falsified.

`golden-frames.json` and `src/lib/catalog/frames.json` both carry sanctioned regeneration paths
(`UPDATE_GOLDEN=1`, `UPDATE_FRAMES=1`, each of which rewrites and then **fails by design**) and are
tripwires rather than oracles, so regenerating them with the moved rows recorded is legitimate.
`preset-baseline.json` carries no such path and must never be regenerated: it is BOTOR's behaviour,
not HANGAR's.

### R-2. The compiler's own `ENDED` and `LIVE` carry the class-B bug, and the research never looked

`_pad.ts:780-781`:

```
const ENDED = "e==3 or e>=5";
const LIVE  = "e~=3 and e<5";
```

`ENDED` is the exact defect the research names in five hand-authored entries, in the compiler, reached
by **eleven** interpolation sites (`:1220, 1256, 1671, 1688, 2000, 2069, 2076, 2123, 2132, 2241`).
`LIVE` is worse in the other direction: `e<5` excludes code 9 outright, so a fast tap never enters the
live body at all. The research measured fast-tap versus slow-tap MIDI for all twenty-seven **Lua**
entries and for none of the **nine presets**.

**And the naive fix is wrong.** `tpad` interpolates `ENDED` at `:2241` inside
`if e==4 or e>7 or not c and not t then`, which already routes code 9 through the onset branch; making
`ENDED` false for 9 would start a trackpad contact that never ends. `tpad` also has **six characters
free** of 908, so it could not afford `+8` even if it wanted it. 11-04 therefore **measures the nine
before it changes anything** and excludes `tpad` by name with both reasons.

### R-3. Two idioms are being deleted, not one

The research says the correct decay idiom lives in `life.ts` and must be rescued. It also lives, in
its **computed** form, in `gridlock.ts` — which is also one of the nine:

```
local p=glim(248-math.max(...)*@SPREAD,0,248) glpfs(a,1,p,4,0) glt(a,1,(256-p)//4)
```

with the rule written into its `@SPREAD` knob comment: *"EVERY VALUE IS A MULTIPLE OF FOUR, because
the derived timeout is (256 - p)//4 and it has to be exact."* That is the **only** worked example of
the form CHORUS's broken bloom needs, and losing it would leave 11-02 to re-derive from scratch what
the repository already knows. Both statements are rescued by 11-01, into the header of the gate that
enforces them.

### R-4. `STEPS` and `CULL` already ship the parameterised idiom, and the research never checked their values

Both write `glpfs(a,l,252,256-252//@T,0)` + `glt(a,l,@T)`, which only lands on zero when `@T` divides
252 exactly. Measured: both value lists are `["12","28","42","63"]` and **all four divide 252**. Both
are correct, and `cull.ts` survives as the phase's one shipped literal-form worked example. The
research warned about EUCLID's `@TRAIL` and said nothing about these two — the answer is good news,
but it was luck rather than evidence until now.

### R-5. RADAR is one of the eight front-door cards, and the research says the ring is untouched

The research writes: *"The eight-entry ring itself is untouched — it is the eight ported presets, and
none of the nine is in it."* True of the **removal**. Not true of **D-03**. `FRONT_DOOR` is
`aurora, pinwheel, ninepads, starfield, joystick, radar, faders, dial`, and
`front-door.spec.ts:110-112` requires every ring member to have `preview === "padsim"`. Delivering the
user's RADAR ask — user-placed points, note-on and note-off as the sweep crosses them — is not
descriptor-reachable, so it makes radar a hand-authored Lua entry, whose `preview` is `"lua"`, which
takes it **off the ring** and leaves seven, breaking the documented geometry that keeps the three
quiet pads at positions 2, 4 and 6. That is a product decision the user has not been asked, and 11-14
opens with it.

---

## Why the waves are serial

No two plans in this phase run concurrently. Two reasons, the second stronger than the first:

1. Every acceptance criterion asserts an exact cumulative count, and two plans landing in the same
   wave would both compute the wrong total. This is Phases 5.1, 6, 7, 9 and 10's reason and it still
   holds.
2. **Almost every plan regenerates a fixture keyed by appearance.** `src/lib/catalog/frames.json`
   carries one record per catalog entry per sampled tick and moves whenever a picture moves — which
   is 11-01, 11-02, 11-04, 11-06, 11-07, 11-08, 11-09, 11-10, 11-11, 11-12, 11-13, 11-14 and 11-15.
   Two plans regenerating it in one wave would each produce a fixture missing the other's rows.

The `wave` numbers in the frontmatter are dependency groupings, one plan each; `depends_on` names the
previous plan explicitly.

**11-08.1 was inserted between waves 8 and 9 after the phase was written**, by the decimal convention
Phase 10 set when D-17 inserted 10-13.1 — no plan is renumbered, `11-09`'s `depends_on` becomes
`["11-08.1"]`, and the `wave` field of 11-09 through 11-16 rises by one. **It takes its own wave for
reason 1 and not for reason 2**: it asserts an exact cumulative count like every other plan, but it is
the one plan in the phase that does NOT regenerate `frames.json`, because the fixture runs each
entry's engine in node with no canvas and `SimHost` is not in its path. Thirteen plans regenerate it;
this is not one of them.

**The one ordering claim worth defending.** The research argues, and the phase brief directs, that the
removal leads — because it closes nine reports outright, shrinks every later wave from 36 entries to
27, and is the only change that must precede the fixture regenerations. It is followed here. The cost
is stated rather than hidden: `frames.json` is regenerated **thirteen** times in this phase, not once.
The saving the removal buys is that every one of those thirteen runs is over 27 or 28 rows instead of
36, and that the nine removed ids never appear in `static/og/`, in `wild-stamps.json` or in a
prerendered route at any point after wave 1.

---

## Expected deltas after each plan

Deltas are the planner's estimate and are **reconciled, never asserted**, except where a plan names a
per-file count. The file column counts spec files created or deleted.

| Plan | Wave | `test:quick` files | `test:quick` tests | `test:sweep` | `test:e2e` | Notes |
|---|---|---|---|---|---|---|
| 11-01 | 1 | **+1** | **+3** | `4 19` (measured, and **faster**) | measured, expected `+0` | `decay-idiom.spec.ts` created with 3. Nine entry files deleted are **sources, not specs**, so the file column does not fall |
| 11-02 | 2 | **+1** | **+5** | `4 19` | `+0` | `touch-guard.spec.ts` created with 3; `lua-smoke.spec.ts` +2 (the matched-pair residue probe, the fast-tap parity probe) |
| 11-03 | 3 | +0 | **+2** | `4 19` | `+0` | `vendored-diff.spec.ts` 14 → **15**; `preset-baseline.spec.ts` +1. **No source hunk lands in this plan** |
| 11-04 | 4 | +0 | **+1** | `4 19` | `+0` | `lua-smoke.spec.ts` +1 — one fast-tap parity test over the nine compiled presets |
| 11-05 | 5 | **+1** | **+4** | `4 19` | measured, expected `+0` | `src/lib/catalog/presets.spec.ts` created with 4 |
| 11-06 | 6 | +0 | **+1** | `4 19` | `+0` | `knobs.preset.spec.ts` +1 — the ninepads grid knob |
| 11-07 | 7 | +0 | **+4** | `4 19` | `+0` | `lua-smoke.spec.ts` **+4** — CONSOLE reaches 127; a muted fader emits nothing; **FORGE's whole travel swept**; **LATTICE's clamp swept**. The last two answer bench notes that previously reached no plan, no removal and no deferral |
| 11-08 | 8 | +0 | **+2** | `4 19` | `+0` | `lua-smoke.spec.ts` **+2** — a swipe toggles once per cell crossed, not at 100 Hz; **MORPH sends a corner only when that corner changed**, which is the second clause of MORPH's note and had reached no plan |
| 11-08.1 | 9 | +0 | **+3** | `4 19` | **+2** | `host.spec.ts` **18 → 21** — a lost 2D context noticed by event AND by paint-time guard, recovered by both routes, both listeners removed at teardown. **The one non-zero e2e term in the phase**: one `@webkit` title, which counts +1 in `grep -c "test("` and **+2** in the run. `frames.json` is NOT regenerated — the fixture runs each entry's engine in node with no canvas, so `SimHost` is not in its path |
| 11-09 | 10 | +0 | **+2** | `4 19` | `+0` | `lua-smoke.spec.ts` +1 (ARC's picture tracks its emitted value); `stamp.spec.ts` +1 (POMODORO's first four indices unmoved) |
| 11-10 | 11 | +0 | **+2** | `4 19` | `+0` | `lua-host.spec.ts` +1 and `host-surface.spec.ts` +1 for `gmss` |
| 11-11 | 12 | +0 | **+1** | `4 19` | `+0` | GHOST's redesign carries one behaviour test |
| 11-12 | 13 | +0 | **+1** | `4 19` | `+0` | SHUTTLE's |
| 11-13 | 14 | +0 | **+2** | `4 19` | `+0` | STRIP's three independent streams, and the 14-bit loss recorded as a test rather than a comment |
| 11-14 | 15 | +0 | **+1**, or **+0** under `fold-into-sonar` | `4 19` | `+0` | RADAR — **blocked on the ring question**. Under `new-entry` the plan also owns a catalog `+1`, an audition row and a `static/og/` file; see the branch table above. 11-16 names the term either way |
| 11-15 | 16 | +0 | **+2** | `4 19` | `+0` | the wheels: the spring returns in MIDI as well as in light; mod holds across a release |
| 11-16 | 17 | +0 | **+0** | `4 19` | measured, expected `+0` | the gate writes no tests — written out, not omitted, so the term count is the plan count |
| **Phase total** | | **+3** | **+36**, or **+35** under `fold-into-sonar` | `4 19` **unchanged** | **+2** | 3+5+2+1+4+1+4+2+3+2+2+1+1+2+T14+2+0, where the sixteen fixed terms sum to **35** and `T14` is 1 or 0 — in **seventeen** terms. The three created files are `decay-idiom.spec.ts`, `touch-guard.spec.ts`, `presets.spec.ts`; 11-08.1 creates a fourth, `e2e/poll.ts`, which the gate does not count because `e2e/` is in neither the vitest `server` project nor `svelte-check`'s reach. **The e2e total is `BASE_E2E + 2` in seventeen terms** — sixteen written-out zeros and 11-08.1's `+2`. **`grep -c "test("` proves a zero term and cannot prove a non-zero one**: `BASE_E2E` 103 is 85 chromium titles plus 18 `@webkit` titles run twice, so 11-08.1's one tagged title moves the grep 85 → 86 and the run 103 → 105. The **five** plans that run the suite (**11-01, 11-05, 11-08.1, 11-15, 11-16**) state both numbers |

**A wave asserts against `PREV_FILES` / `PREV_TESTS`.** **Only 11-16 asserts against
`BASE_FILES` / `BASE_TESTS`**, and its number is the phase total written out as a seventeen-term chain,
never as a total alone. **The count of terms is itself asserted**: seventeen, equal to the plan count,
checked against every prose statement of it in this document and in 11-16. That number drifted twice
in Phase 10 after being fixed, which is why it is asserted rather than described.

Per-file counts, which **are** asserted absolutely:

| File | Tests | Plan |
|---|---|---|
| `src/lib/catalog/decay-idiom.spec.ts` | **3** | 11-01 (created) |
| `src/lib/catalog/touch-guard.spec.ts` | **3** | 11-02 (created) |
| `src/lib/catalog/presets.spec.ts` | **4** | 11-05 (created) |
| `src/lib/fidelity/vendored-diff.spec.ts` | 14 → **15** | 11-03 |
| `src/lib/fidelity/preset-baseline.spec.ts` | +1 | 11-03 |
| `src/lib/sim/lua-smoke.spec.ts` | **+17 across ten plans** — see the breakdown below | 11-02, 11-04, 11-07, 11-08, 11-09, 11-11, 11-12, 11-13, 11-14, 11-15 |
| `src/lib/sim/host.spec.ts` | 18 → **21** | 11-08.1 |
| `src/lib/sim/lua-host.spec.ts` | +1 | 11-10 |
| `src/lib/catalog/host-surface.spec.ts` | +1 | 11-10 |
| `src/lib/tune/knobs.preset.spec.ts` | +1 | 11-06 |
| `src/lib/share/stamp.spec.ts` | +1 | 11-09 |
| `src/lib/browse/facets.spec.ts` | **unchanged** (three literals and two floors move inside) | 11-01 |
| `src/lib/catalog/audition.spec.ts` | **unchanged** (`ROW_COUNT` 32 → 23 inside) | 11-01 |
| `src/lib/catalog/frames.spec.ts` | **unchanged** (the fixture moves, the spec does not) | thirteen plans |
| `src/lib/fidelity/golden-frames.spec.ts` | **unchanged** (fixture regenerated in 11-04) | 11-04 |
| `e2e/browse-webkit.e2e.ts` | 3 → **4** titles, all `@webkit`, so **6 → 8** runs | 11-08.1 |

**`lua-smoke.spec.ts` is the file most of this phase's behavioural evidence lands in, and its row
above used to name five plans totalling +8. Ten plans declare it in their own `files_modified`:**

| Plan | delta | what it adds |
|---|---|---|
| 11-02 | +2 | the matched-pair residue probe; the fast-tap parity probe |
| 11-04 | +1 | fast-tap parity across the nine compiled presets |
| 11-07 | +4 | CONSOLE's full scale; the inert mute; FORGE's travel sweep; LATTICE's clamp sweep |
| 11-08 | +2 | the swipe guard; MORPH's per-corner suppression |
| 11-09 | +1 | ARC's picture and emitted value moving together |
| 11-11 | +1 | GHOST |
| 11-12 | +1 | SHUTTLE |
| 11-13 | +2 | STRIP's three streams; the 14-bit loss |
| 11-14 | +1, or +0 under `fold-into-sonar` | RADAR |
| 11-15 | +2 | the wheels |
| **total** | **+17**, or +16 | |

**11-16 is told to derive each chain term from this per-file table**, which is why the row being wrong
mattered more than a stale note usually would.

Standing gates that must be green at the phase gate and are **not** edited:
`src/lib/fidelity/firmware-oracle.spec.ts` (**the proof the phase walk was not touched — see below**),
`src/lib/fidelity/lua-parity.spec.ts`, `src/lib/format-parity.spec.ts`, `src/lib/protocol-pin.spec.ts`,
`src/lib/sim/paint.spec.ts`, `src/lib/sim/lazy.spec.ts`, `e2e/catalog.e2e.ts`, `e2e/fidelity.e2e.ts`.

---

## The load-bearing half of D-02, restated so it cannot be got backwards

**What may change:** the constants `_pad.ts` and `pad-sim.ts` emit for a decaying layer's starting
phase, at the three comet-family sites in each file, and the compiler's `ENDED` / `LIVE` guards where
11-04 measures them wrong and affordable.

**What may NOT change:** `pad-sim.ts:883-891`, which reproduces `grid_led.c:190-211` line for line —
`L.pha = (L.pha + L.fre) & 255`, a `uint8_t` that **wraps**. That wrap is the firmware's real
behaviour. The simulator is correct and the configurations were choosing pairs firmware semantics can
never land on zero. Changing the walk would make the preview *less* faithful while appearing to fix
the symptom.

**The proof, and it is mechanical.** `src/lib/fidelity/firmware-oracle.spec.ts` compares the simulator
against constants re-derived from `grid-fw` by an author who never read the simulator. It is not
edited by any plan in this phase and it must stay green through 11-04. A phase-walk edit turns it red;
a start-constant edit does not. **11-04 states its green run as the evidence that the boundary held**,
and 11-16 states it again against a fresh build.

**Both files move together or neither does.** `_pad.ts` compiles the descriptor to Lua for the device;
`pad-sim.ts` renders the same descriptor for the preview. They are two independent implementations of
one behaviour. Fixing only the compiler would leave the preview showing a stuck cell where the device
now goes dark — the same fidelity loss D-02 forbids, reached from the other side.

---

## The two class gates, and why a fix without a gate is not a fix

Both class bugs are **conventions that files silently missed**, not arithmetic slips. Six entries
already write the touch guard correctly; two already write the decay idiom correctly. So the failure
mode is not that the rule is unknown — it is that nothing checks it. Both gates must therefore fail
**naming the rule**, not naming an arithmetic.

### `src/lib/catalog/decay-idiom.spec.ts` (11-01, three tests)

1. **Literal pairs.** For every hand-authored entry, pair each `glpfs(<a>,<l>,<start>,<rate>,0)` with
   the `glt(<a>,<l>,<timeout>)` that follows it on the same cell expression, and fail unless
   `(start + rate * timeout) mod 256 == 0`. The message names the rule first —
   *"a decaying layer must land on phase 0; this pair freezes at N"* — and the arithmetic second.
2. **Parameterised timeouts.** Where the timeout is a knob token, enumerate that knob's declared
   values and require **every one** to satisfy the rule. This is what catches EUCLID's `@TRAIL`
   (`64`, `100`, `150` fail) and MORPH's `@DECAY` (`20`, `80`, `120` fail) while passing STEPS's and
   CULL's `["12","28","42","63"]`.
3. **`KNOWN_VIOLATIONS` is exhaustive and shrinking.** 11-01 lands the table naming euclid, ghost,
   morph, sonar and chorus with *"closed by 11-02"*; 11-02 empties it; 11-16 asserts it is empty. A
   site not in the table fails outright; a site in the table that has been fixed also fails, so the
   table cannot rot.

**The rule's permanent home is this file's header**, carrying both forms rescued verbatim from
`life.ts` (the literal-parameterised form, `glpfs(a,l,252,256-252//T,0)` + `glt(a,l,T)` with `T` an
exact divisor of 252) and `gridlock.ts` (the computed form, `glpfs(a,l,p,4,0)` + `glt(a,l,(256-p)//4)`
with `p` a multiple of 4). It is a **move**, not a third statement: both source files are deleted in
the same plan.

### `src/lib/catalog/touch-guard.spec.ts` (11-02, three tests)

1. **"Ended" is `e==3 or e>=5 and e<9`.** Fail on `e>=5` or `e>4` not immediately followed by
   `and e<9`. Build the needles from fragments at runtime, the way `forbidden-instructions.spec.ts`
   and `lua-entries.sweep.spec.ts` test 4 already do, so the spec does not match itself.
2. **"Started" is `e==4 or e>8`.** Fail on a bare `e==4` used as an onset test.
3. **`DECLARED_EXCEPTIONS` is justified and closed.** **`stage.ts` is a false positive and must not
   be silently special-cased.** Its `elseif e>=5` is preceded in the same `if`-chain by
   `if e==4 or e>8`, so code 9 never reaches it. The table holds the entry id, the matched fragment
   and the reason in a sentence; a member whose reason is missing fails, and a member that no longer
   matches fails too.

---

## The 908-character budget, per request

Every request is costed **before** it is designed, with
`cost = max(GridScript.compressScript(lua).length, lua.length)` via `measureLua` / `costOf`, after
`await padReady()`. **A request that cannot fit is a finding, not a failure**, and the plan that finds
one says so in the SUMMARY rather than trimming the user's ask to fit.

**"Free" means two different things and they must never share a column heading.** *Free at defaults*
is `908 − cost at the shipped knob values`; *free at worst* is `908 − cost at the worst reachable knob
position`. They differ by 1-5 characters, and **the binding gate is worst-based** —
`lua-entries.sweep.spec.ts` asserts every entry inside 908 at every knob position. **Every margin in
every plan and every SUMMARY is stated at worst.** The table below states the cost at defaults and the
free at worst, which is the pairing `11-RESEARCH.md`'s survey uses, and it says so in its headings
rather than leaving a reader to infer it.

Measured headroom for every entry this phase touches, from `11-RESEARCH.md` and re-verified where a
plan spends it:

| Entry | Setup (at defaults) | **Setup free (at worst)** | Timer (at defaults) | **Timer free (at worst)** | What this phase asks of it |
|---|---|---|---|---|---|
| console | 785 | **121** | 0 | 908 | three asks: `+0`, `+5`, and the mute-row swipe |
| forge | 716 | **189** | 373 | **532** | its whole travel swept, then a costed fix or a named non-delivery |
| chorus | 729 | **177** | 173 | 734 | `+8` for the guard, plus the bloom re-cut |
| euclid | 702 | **204** | 218 | 688 | `+76` for the swipe guard, `−5` for the decay |
| shuttle | 663 | **245** | 201 | 707 | a blank page |
| strip | 638 | **266** | 0 | 908 | three streams instead of one 14-bit fader |
| lattice | 615 | 291 | 171 | 736 | `+8`, then the clamp clause swept |
| lumen | 604 | 302 | **0** | **908** | sysex, and the most room in the catalog |
| snake | 581 | 327 | **870** | **36** | **nothing. Deferred by the user** |
| stage | 505 | 399 | 109 | 799 | a third zone state, if the answer says so |
| morph | 507 | 400 | 0 | 908 | `+8`, a `@DECAY` re-cut, and the per-corner send suppression |
| sonar | 432 | 475 | 279 | 627 | swipe, centre lit, note length |
| steps | 388 | 518 | 251 | 655 | swipe |
| arc | 379 | 527 | 251 | 656 | `+21` for the amplitude |
| ghost | 305 | 601 | 333 | 573 | a blank page |
| **tpad** | **902** | **1** | 146 | 762 | **nothing can be afforded. Recorded, not attempted.** This row previously read **6**, which is the free-at-defaults figure; at the worst reachable knob position tpad costs **907**, so the correct worst-based figure is **1**. It is the one row in this table that used the other convention |

**SNAKE's Timer has 36 characters free**, which is the phase's clearest example of a request that
cannot fit — "one note per movement" does not go in. The user deferring it is fortunate rather than
merely convenient, and 11-16 records that as the reason the deferral was right.

---

## Sampling Rate

- **After every task:** `npm run test:quick`, plus `npm run lint` when the task touched a source file,
  plus the per-file gate commands the plan names. Free memory recorded beside every quick run.
- **After every wave:** `npm run check 2>&1 | grep -Ei "error|warning"`, `npm run lint`,
  `npm run test:quick`, **and `npm run test:sweep`** for every wave that changes an entry's Lua, a
  knob's value list or anything under `src/vendor/` — which is 11-01 through 11-15 with the single
  exception of 11-03, which lands no source hunk and proves it by grep.
- **Add `npm run build`** for any wave that changes the catalog's membership or a card's picture —
  then **`npm run test:quick` again**, because three specs read `build/`.
- **e2e runs in FIVE waves** — 11-01 (routes and OG images stop being generated for nine ids), 11-05
  (the preset entries change hands), **11-08.1** (the canvas context-loss fix, which a source scan
  cannot prove), **11-15** (a new entry adds a route and an OG image) and 11-16 (the gate) — at
  `--workers 3`, with `test-results/` removed by hand afterwards and `git status --porcelain`
  confirmed empty. No other wave runs it, because no title moves in it and a two-minute run buys
  nothing. **Four of the five prove their own `+0` with `grep -c "test("` before and after; 11-08.1
  cannot, and says so.** Its one `@webkit` title counts **once** in the grep and **twice** in the run,
  so it states `grep -c "test("` 85 → 86 AND the run total 103 → 105, with the reason they differ.
  **The grep is a sound proof of a zero term and an unsound proof of a non-zero one** — written here
  because 11-16 derives the e2e chain from this bullet. (Under 11-14's `new-entry` answer that plan
  also adds a route; it does not run the suite, because 11-15's run is the next thing that happens
  and it rebuilds from scratch. Say so rather than leaving the gap unexplained.)
- **Do not commit while the suite is running.** `e2e/artifacts.e2e.ts` reads `git rev-parse HEAD` and
  asserts `build/source-<sha>.tar.gz` exists, so a commit mid-run reddens it for a reason unrelated to
  the code; combined with `reuseExistingServer`, a stale server also means `npm run build` never
  re-runs and the suite silently tests a stale `build/`. Diagnosed in `CANVAS-CONTEXT-LOSS.md`,
  narrowed by 11-08.1, and a run-procedure rule for every wave that runs the suite.
- **Max feedback latency:** ~45 s (quick), ~3 min (wave with the sweep), ~6 min (wave with a build and
  e2e).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated command / evidence | File exists | Status |
|---|---|---|---|---|---|---|---|
| 11-01-01 | 01 | 1 | all | precondition + baseline | the eleven-name block measured on a clean tree; `BASE_SWEEP_WALL`, `BASE_E2E`, `BASE_OG_BYTES` and free memory recorded; disagreement with the brief's numbers **reported, not reconciled**; `git status --porcelain` empty | n/a | pending |
| 11-01-02 | 01 | 1 | CAT-01, CAT-04, CONT-02 | unit + build | nine entry files deleted; `index.ts`, `front-door.ts`, `listing.ts`, `demo.ts`, `wild-stamps.json` (18 of 54 records), `stamp.spec.ts` 27 → 18, `audition.spec.ts` `ROW_COUNT` 32 → 23 and the four re-chosen count literals; `frames.json` regenerated at **27**; catalog stated as `BASE_CATALOG − 9` | exists | pending |
| 11-01-03 | 01 | 1 | CAT-03, CONT-03 | unit | D-01 option (a): `drums` and `clips` retired, ninepads → `play`, stage → `shortcuts`, `FOR_TERMS` 10 → **8** re-sorted descending, `LEGACY_TAG_MAP`'s two rows re-targeted, `facets.spec.ts`'s three literals and two `>30` floors; **`precise` and `still` at exactly 6** recorded where a later remover will see it | exists | pending |
| 11-01-04 | 01 | 1 | CONT-02 | unit (source scan) | `decay-idiom.spec.ts` **3**, with both idioms rescued verbatim from `life.ts` and `gridlock.ts` into its header **before** those files are deleted, and `KNOWN_VIOLATIONS` naming five sites; two negative checks red | created here | pending |
| 11-02-01 | 02 | 2 | CONT-02, PREV-01 | unit + sweep | class A closed: euclid, ghost, morph, sonar literals and chorus's computed bloom; `@TRAIL` and `@DECAY` re-cut to divisors of 252 **with the shared-link consequence stated**; `KNOWN_VIOLATIONS` empty | exists | pending |
| 11-02-02 | 02 | 2 | CONT-02, PREV-01 | unit (source scan) | `touch-guard.spec.ts` **3** with `DECLARED_EXCEPTIONS` holding `stage.ts` and its reason; the five `+8` fixes at arc, chorus, ghost, lattice, morph; three negative checks red | created here | pending |
| 11-02-03 | 02 | 2 | PREV-01, PREV-02 | unit (Lua host) | `lua-smoke.spec.ts` +2: the matched-pair residue probe (a gesture leaves no cell a never-touched run leaves dark) and the fast-tap parity probe (`touchTap` and a slow down/move/up produce the same MIDI) | exists | pending |
| 11-03-01 | 03 | 3 | FOUND-02 | unit | `upstream-manifest.json` gains `intendedDivergence` per file; `vendored-diff.spec.ts` **15**, inverting both `deltas` and `intendedDivergence` so the sha256 still names upstream and a change outside both still moves it; `VENDOR.md` rewritten; **the table is empty and `git diff --stat HEAD -- src/vendor/` is still empty at the end of this plan** | exists | pending |
| 11-03-02 | 03 | 3 | CONT-01, PREV-06 | unit | `preset-baseline.spec.ts` +1: an `INTENDED_DIVERGENCE` table, empty here, whose absence of an entry keeps D-08's STOP-and-report rule intact for every un-named row; **`preset-baseline.json` is not touched by any plan in this phase**; `golden-frames.json`'s regeneration path documented as the sanctioned one and not yet run | exists | pending |
| 11-04-01 | 04 | 4 | PREV-02, PREV-06 | unit + sweep | the comet decay at source: **three hunks in `_pad.ts` (:1204, :1223, :2064), three in `pad-sim.ts` (:987, :1002, :1227), one in `tests/pad.test.js`**, every emitted start becoming `(256 − rate) × ticks`, **+0 characters**; bloom and disturb **left alone and recorded as unreachable from any catalog entry or knob position**; `firmware-oracle.spec.ts` green as the proof the phase walk was not touched | exists | pending |
| 11-04-02 | 04 | 4 | CONT-01, PREV-01 | unit (Lua host) | the compiled fast tap **measured across all nine presets before anything changes**, fast versus slow, counted; `ENDED` / `LIVE` corrected only where wrong **and** affordable; **`tpad` excluded by name with both reasons** (`:2241` already routes 9 through its onset branch; six characters free); every divergence added to the manifest table | exists | pending |
| 11-04-03 | 04 | 4 | PREV-06 | unit | `golden-frames.json` regenerated via `UPDATE_GOLDEN=1` with the moved hashes and `nonZeroBytes` deltas listed per preset; `frames.json` regenerated; the residue probe from 11-02-03 re-run over the five preset-backed entries and reported at **zero** | exists | pending |
| 11-05-01 | 05 | 5 | CONT-01, CAT-04 | unit | `src/lib/catalog/presets.ts` re-declaring the nine from `defaultState` / `normalisePadState` and the **types** only; the six runtime readers flipped; `knobs.preset.spec.ts:108` and `front-door.spec.ts:303` repointed; **the two fidelity fixtures keep importing `PRESETS` from `src/vendor/`** | created here | pending |
| 11-05-02 | 05 | 5 | CONT-01 | unit | `presets.spec.ts` **4**: field-by-field divergence against the vendored nine over `id`, `name`, `sentence`, `category`, `knobs`, `exclusive`, `quiet` **and the whole of `state`**, failing on anything not in `INTENDED_DIVERGENCE` with a reason. **The trade stated in the plan's own words**: today two strings are read through, so a BOTOR rename shows up; after this every field is diffed and every divergence must be *said* | created here | pending |
| 11-06-01 | 06 | 6 | CONT-01, TUNE-01 | unit + sweep | AURORA `xy` 250 → **408**, PINWHEEL 305 → **463**, STARFIELD 238 → **396**, all `fingers: "first"`; nine `cost` declarations re-measured; `frames.json` regenerated | exists | pending |
| 11-06-02 | 06 | 6 | TUNE-01, CONT-01 | unit | NINE PADS `sends.grid` reaching `"4x4"` **as a knob** (580 → **550**, cheaper), and JOYSTICK `springTo: "centre"` with `invertY: false` (535 → **532**) plus the `comet` trail (→ **468**), whose residue 11-04 removed — **the trade-off the research required be stated is now gone, and the plan says why**; `knobs.preset.spec.ts` +1 | exists | pending |
| 11-07-01 | 07 | 7 | CONT-02 | unit (Lua host) | CONSOLE reaches full scale: `h*127//8` → `h*127//7`, **+0**, with the emitted set swept through the real host and **127 asserted present**; muted faders inert, `+5` | exists | pending |
| 11-07-02 | 07 | 7 | CONT-02 | unit | the mute row accepts a swipe as well as a press — today it is onset-gated `if e==4 or e>8` inside a body that already accepts MOVE; costed against **121** free at worst | exists | pending |
| 11-07-03 | 07 | 7 | CONT-02, TUNE-05 | unit (Lua host) | **FORGE's and LATTICE's whole travel swept the way CONSOLE's was.** FORGE: reachable macro indices against the twenty-seven its header claims, every boundary's raw coordinate, each target's size, macro 26's reduced area behind the bank corner, and what a down-then-slide emits from an onset-gated handler. LATTICE: emitted range against claimed range, on both axes. **Then a costed fix or a named non-delivery carrying the numbers — never silence.** `lua-smoke.spec.ts` **+2**, one assertion per card, pinning whichever way each landed | **Wave 0 gap — the assertions do not exist** | pending |
| 11-08-01 | 08 | 8 | CONT-02 | unit + sweep | EUCLID, SONAR and STEPS accept MOVE with a **per-contact last-cell guard**, so a resting finger does not toggle at 100 Hz; EUCLID `+76` against 204 free | exists | pending |
| 11-08-02 | 08 | 8 | CONT-02 | unit | SONAR's centre always lit and its notes released after a while; **clock sync explicitly not built**, with both blockers named | exists | pending |
| 11-08-03 | 08 | 8 | CONT-02 | unit (Lua host) | **MORPH's suppression clause**, which had reached no plan: a per-corner last-sent table consulted before `gms` and initialised to zeros, so a corner that has not changed sends nothing and a corner sitting at zero sends nothing at all, while a corner that *falls* to zero sends its zero once rather than leaving a stale value on the wire. Costed at worst against what 11-02 left. `lua-smoke.spec.ts` **+1**, asserted as three counts | **Wave 0 gap — the assertion does not exist** | pending |
| 11-08.1-01 | 08.1 | 9 | PREV-01 | browser (harness) | `litCells` attributes its own failure and is labelled a DIAGNOSTIC; `e2e/poll.ts` created in two shapes; **all eleven `expect.poll` sites** enumerated with a per-site verdict and every throwing one guarded, including `tuning.e2e.ts:821`'s `.not.toBe(was)`, where a string sentinel would SATISFY the negation and turn a broken page green. Two plants red, with both `litCells` wall times published | **Wave 0 gap — `e2e/poll.ts` does not exist** | pending |
| 11-08.1-02 | 08.1 | 9 | PREV-01 | browser | `/dev/session/` publishes `install-phase`; `onlyReads` waits on the store LEAVING `snapshotting` and reads the safety counters AFTER, in that order, so a late write is still caught; the `0 <= shown <= 3` pair retired to an equality, with the constant-zero plant published passing under the old form and red under the new; `browse.e2e.ts:669`'s `built >= 4` of 27 floor derived rather than typed; `artifacts.e2e.ts` reads the BUILD and names a stale build or a moved HEAD as itself | exists | pending |
| 11-08.1-03 | 08.1 | 9 | PREV-01, PREV-05, DEGR-01 | unit + browser | **The product defect: there is no `contextlost`, `contextrestored` or `isContextLost` handler anywhere in `src/`.** `SimHost` notices by event AND by paint-time guard, **and neither half is redundant** — the event is the only thing that can reach a STILL card, which never paints, and the guard is the only thing that can reach a card on an engine that never emits the event. `host.spec.ts` **18 → 21**; one `@webkit` title proving the picture comes back with the card sitting still and `BrowseGrid`'s `started` set never consulted. **This plan runs the suite** | **Wave 0 gap — the browser assertion does not exist** | pending |
| 11-09-01 | 09 | 10 | CONT-02, SHARE-01 | unit | ARC's amplitude visible: the 3×3 heart scaled by the same `s.d` the CC is scaled by, `+21` against 527 free at worst. **And POMODORO's `@MINS` gains `"1"` and `"5"` APPENDED, never inserted**, with `stamp.spec.ts` +1 asserting the first four indices still decode to 15/20/25/50 — **moved ahead of 11-09-02's checkpoint, because nothing in "make a 1 minute and a 5 minute one" is ambiguous and nothing in it depends on an answer** | exists | pending |
| 11-09-02 | 09 | 10 | — | **checkpoint:decision** | the three remaining two-reading notes put to the user together: **ARC's centre-press**, **STAGE's lining-up** (with the evidence that `listing.ts:447` already promises it) and **LUMEN's depth** | n/a | pending |
| 11-09-03 | 09 | 10 | CONT-02 | unit | STAGE's third zone state per the answer, or the answer recorded and nothing shipped. **Term `+0`, written out.** MORPH's "mapping mode" answer recorded and carried to 11-16 rather than acted on here | exists | pending |
| 11-10-01 | 10 | 11 | PREV-01 | unit | `gmss` reaches the Lua host on the `gmms`/`gmbs`/`gks` template: `lua-host.ts`, `HOST_GLOBALS` 15 → **16**, `host-surface.spec.ts` +1, `lua-host.spec.ts` +1, and **every literal 15 in the tree named and moved** | exists | pending |
| 11-10-02 | 10 | 11 | CONT-02 | unit | LUMEN sends its colour as hex over sysex, `0xF0` and `0xF7` supplied by the entry; costed against 302 free Setup at worst and a **completely free Timer**; the depth half per 11-09-02's answer. **`lua-host.spec.ts` +1 as a new test, not an extension of 11-10-01's** — the plan's asserted `PREV_TESTS+2` depends on it | exists | pending |
| 11-11-01/02 | 11 | 12 | CONT-02, PREV-01 | unit | GHOST from a blank page: the budget costed up front (601 / 573 free), the reliability the user reported diagnosed as **gone rather than patched**, `restsBlack` re-declared and proved in both directions by `frames.json`, and its demo path in `demo.ts:177` re-cut | exists | pending |
| 11-12-01/02 | 12 | 13 | CONT-02 | unit | SHUTTLE from a blank page (D-04): the lift-stops decision at `shuttle.ts:80-92` **reversed on the record with its two reasons answered**, the `gtt(index,0)` floor kept, 245 free spent deliberately | exists | pending |
| 11-13-01/02 | 13 | 14 | CONT-02 | unit | STRIP as two independent faders plus a crossfader; **what is discarded named**: the repository's only worked 10-bit unlock and its 14-bit stream, traded for three 7-bit streams | exists | pending |
| 11-14-01 | 14 | 15 | — | **checkpoint:decision** | the front-door ring question: RADAR is ring position 6 and the ring requires `preview === "padsim"` | n/a | pending |
| 11-14-02 | 14 | 15 | CONT-02, CAT-04 | unit | RADAR per the answer, with D-03's rule honoured — neither RADAR nor SONAR is given a job the user did not ask for | exists | pending |
| 11-15-01 | 15 | 16 | CONT-02 | unit | the wheels, costed **before** designed: pitch left, mod right, column 4 a lit divider, pitch bend as status **224** through `self:gms`, **never `gmbs`**; the value not quantised to the row | created here | pending |
| 11-15-02 | 15 | 16 | CONT-02, CONT-03 | unit + sweep | the spring returns **in MIDI as well as in light** — the named failure mode — and mod holds across a release; both budgets stated; catalog `27 + 1 = 28`; one `FOR` and two `FEELS` with the FEELS floor re-checked | exists | pending |
| 11-16-01 | 16 | 17 | all | measured + docs | every projection in this document replaced by an observation, **every wrong one named as wrong**; `docs/TESTING.md`, `docs/HARDWARE-AUDITION.md` and `deferred-items.md` re-measured and rewritten | exists | pending |
| 11-16-02 | 16 | 17 | all | phase gate | quick `BASE_FILES + 3` / **`BASE_TESTS + 36`** (or `+ 35` under `fold-into-sonar`) as a **seventeen-term** chain with `T14` named; sweep `4 19`; e2e **`BASE_E2E + 2`** in seventeen terms — sixteen written-out zeros and 11-08.1's `+2` — with **five** suite-running plans named and BOTH e2e numbers stated (`grep -c "test("` 85 → 86, run 103 → 105) with the reason they differ; catalog **28, or 29 under `new-entry`**, as a seventeen-term chain; `CONT-01` and `FOUND-02` amended by name and dated; `firmware-oracle.spec.ts` green — and its **seventh** test named as the one that runs through `pad-sim.ts:987`, which is what makes the D-02 proof mechanical; the vendored divergence enumerated and justified | exists | pending |
| 11-16-03 | 16 | 17 | — | **checkpoint:human-verify** | the hardware rows and the six things this phase could not do, handed over unasserted | n/a | pending |

*Status: pending / green / red / flaky. Every row starts pending; an executing plan updates only its own rows.*

---

## Wave 0 Requirements

None is a framework gap. Vitest, Playwright, both browser binaries, `wrangler`, `svelte-check`, ESLint
and Prettier are installed and pinned, and **no dependency moves in this phase**. The gaps are one
measurement and three files.

- [ ] **The eleven-name block measured on a clean tree**, with any disagreement against the brief's
      `81 / 828 / 103 / 584 / 4 19` **reported rather than reconciled** → **11-01-01**
- [ ] `src/lib/catalog/decay-idiom.spec.ts` — the class-A gate, created **in the same plan that
      deletes the two files carrying its rule** → **11-01-04**
- [ ] `src/lib/catalog/touch-guard.spec.ts` — the class-B gate, with `stage.ts` declared rather than
      silently excused → **11-02-02**
- [ ] `src/lib/catalog/presets.spec.ts` — the divergence spec that replaces the read-through
      guarantee → **11-05-02**
- [ ] `e2e/poll.ts` — the guard that makes a Playwright poll's timeout real, in the two shapes the
      eleven sites need. **Added by 11-08.1, which was inserted after this list was written** →
      **11-08.1-01**
- [ ] The browser assertion that a pad whose 2D backing store is dropped gets its picture back. **A
      source scan cannot see paint order**, and this repository has twice shipped something that
      painted nothing while every scan stayed green → **11-08.1-03**

---

## Manual-Only Verifications

**No agent connects to or writes to a device in this phase, and no agent deploys.** The user tests
hardware personally. Nothing below may be claimed as hardware-verified by anything this phase writes.

| Row | Question for the bench | Why a test is not evidence |
|---|---|---|
| **H-1. `docs/MIDI-IN-PROBE.md`, Part B** | Does ZONA receive MIDI clock at all? The document is a written, minifier-checked, 264- and 328-character probe pair and its last line still reads *"Results: None yet. This probe has not been run."* | Ten minutes at a bench. `gts` is dead on ZONA and `rtmrx_cb` is the only clock route the hardware has, so **a no does not send the clock-sync family down a different road; it closes it** |
| **H-2. DIAL's encoder mode** | What relative-CC convention is the control set to in your host? | The simulator says the two directions are **exactly symmetric**: 192 messages each way, values 65 and 63, at 64 and at 128 samples per turn. The compiler emits binary-offset relative CC. The strong hypothesis is **signed-bit**, in which 63 reads as **+63** — violent in exactly the one direction reported. One question |
| **H-3. The comet residue on AURORA and STARFIELD** | After 11-04, does the glow still linger? | 11-04 removes 1–2 units of permanent residue per crossed cell. Whether that is what you saw, or something larger the simulator does not reproduce, only the bench can say |
| **H-4. ARC's centre-press** | 11-09-02's question, on hardware | ARC has no stop, no resume and no toggle anywhere in its source. `s.r = 1 + x*31//127` is at least 1 for every x, so the oscillator cannot reach rate 0 |
| **H-5. Four faders** | **Never tested.** No verdict is invented for it anywhere in this phase | — |
| **H-6. Everything already in `docs/HARDWARE-AUDITION.md`** | 32 rows become **23** in 11-01 and stay the user's | — |

---

## Negative checks (observe red before trusting)

Every one is reverted with `git checkout --` and recorded in its plan's SUMMARY with both exit codes
and the failing message. **`git add` any new file before perturbing it**: on an untracked path
`git checkout --` fails outright and `git diff --quiet` passes vacuously.

| Plan | Perturbation | Expected red |
|---|---|---|
| 11-01 | set `cull.ts`'s `@FLASH` values to `["12","28","42","64"]` | `decay-idiom.spec.ts` test 2, naming **the rule** and then `64` |
| 11-01 | remove `ghost` from `KNOWN_VIOLATIONS` | test 3, naming ghost as an unrecorded violation |
| 11-01 | leave `stage`'s tag as `clips` | `facets.spec.ts`'s zero-singleton assertion, naming `clips` |
| 11-02 | restore `euclid`'s `255,250` pair | `decay-idiom.spec.ts` test 1, naming the frozen phase |
| 11-02 | drop `and e<9` from `lattice.ts` | `touch-guard.spec.ts` test 1, naming **the convention** |
| 11-02 | remove `stage.ts` from `DECLARED_EXCEPTIONS` | test 3 red **and test 1 red** — the pair is the proof the exception is declared rather than pattern-matched away |
| 11-03 | add a stray space to `src/vendor/botor/pad-sim.ts` | `vendored-diff.spec.ts`, naming the file and the byte delta — **the assertion still works with the machinery in place and the table empty** |
| 11-04 | change `pad-sim.ts:887`'s `& 255` to a clamp | `firmware-oracle.spec.ts` red — the boundary D-02 draws, proved mechanically |
| 11-04 | apply the `ENDED` fix to `tpad`'s site | the sweep's 908 gate red on `tpad`, naming 902 + 8 |
| 11-05 | rename one preset in `presets.ts` | `presets.spec.ts`, naming the field and the card, and saying the divergence is undeclared |
| 11-06 | leave AURORA's `cost` declaration at 250 | `preset-baseline`-style cost assertion red at 408 |
| 11-07 | restore `h*127//8` | the CONSOLE full-scale test, naming 111 and 127 |
| 11-08.1 | plant `throw new Error("planted")` in `litCells` | the poll runs its FULL 30 s and fails naming `planted`, instead of dying at 0.2 s with an unattributed stack — **both wall times recorded** |
| 11-08.1 | plant the same throw in `tuning.e2e.ts:821`'s callback | that test RED. **Green means the `.not.toBe(was)` inversion was not applied and a throw is satisfying the negation** |
| 11-08.1 | comment out `install.svelte.ts`'s `this.phase = "ready"` | the new wait failing by naming the phase it was stuck in, not an off-by-one count |
| 11-08.1 | wire `session-writes` to a constant `0` | the retired assertion RED — and **published passing under the old `0 <= shown <= 3` form**, which is the whole reason it is being retired |
| 11-08.1 | remove the `contextlost` listener | the still-card half of the browser proof red, naming the black pad |
| 11-08.1 | drop the `paint()` re-acquire guard | the animating-card half red. **If it stays green, that is a finding about which half is load-bearing and is recorded, never reconciled** |
| 11-08.1 | keep `entry.scratch` across the loss | may well be GREEN, because an `ImageData` is a plain object. If so, the scratch clear is defensive rather than load-bearing and is labelled as such |
| 11-09 | insert `"1"` at the front of `@MINS` | `stamp.spec.ts`'s index test, naming the interval a shared link would now render |
| 11-10 | call `gmss` before it is registered | `host-surface.spec.ts`, refusing a call outside `HOST_GLOBALS` |
| 11-15 | use `gmbs` for the bend | the wheels' MIDI test, naming a recorded **mouse button** where a bend was expected |
| 11-16 | raise one non-vacuity floor by one | that test red, naming the observed count |

---

## Standing hazards carried into this phase

- **`src/vendor/` is no longer byte-pinned, and that is the single largest change this phase makes.**
  Every plan from 11-03 onward runs `git diff --stat HEAD -- src/vendor/` and states the result;
  before 11-04 it is empty and after it the diff must equal the enumerated table exactly.
- **`preset-baseline.json` must never be regenerated.** It is BOTOR's behaviour captured in BOTOR's
  tree. `scripts/capture-preset-baseline.mjs` stays as it is and stays pointed at the vendored shelf.
- **`src/lib/format-parity.spec.ts` copies out of the sibling BOTOR checkout**, formats with both
  Prettiers and compares outputs. It is unaffected by a vendored edit and **must not be chased** when
  it goes red for an environmental reason; it fails loudly by design and `BOTOR_REPO` overrides the
  path.
- **Knob positions are stamp payload.** Appending a value is safe; **inserting one re-points every
  shared link at or above it and no test catches it**, because `stamp.spec.ts` compares indices.
  Re-cutting a value set (EUCLID's `@TRAIL`, MORPH's `@DECAY`) keeps every link decodable and silently
  changes what it renders — say so in the plan and in the SUMMARY.
- **`glt(a,l,65535)` beside a fast rate is a strobe, not a keeper** — `lua-smoke.spec.ts` test 3
  guards it. **The legitimate keeper form exists too**: ARC and POMODORO both carry one deliberately
  with capitalised "do not fix" notes in their headers. Read the note before touching either.
- **`gtt(index, 0)` does not run fast; it stops silently** with the last frame still showing. Any
  computed period needs a `math.max(...,1)//1` floor. SHUTTLE already carries one.
- **The `glt` 65535 ceiling is 655 seconds.** POMODORO's header says it in capitals: a 25-minute
  interval is 1,500 seconds, and re-arming with `glt` alone will not restart a rate that has already
  been zeroed. Any long-running card this phase writes inherits that — **including the wheels**.
- **A Setup-only entry still classifies as animated** if it stores a Timer, because the engine reports
  `host.animating || host.timerArmed`. `front-door.ts` says motion must never be guessed or
  aspirational, and `frames.json` proves it in both directions. **The wheels stores a Timer and is
  therefore `animated` whatever its picture is doing.**
- **Nine dead `/c/<id>/` addresses go live the moment this deploys.** `src/routes/c/[id]/+page.ts`
  handles an unknown id gracefully only for ids that still generate a page; a removed id generates no
  page and adapter-static falls through to `404.html`. 11-01 ships the honest default and 11-16
  restates it as an Open-for-the-user item **with its reversal costed**, rather than letting a
  deletion have a user-visible consequence nobody decided.
- **`static/og/` is rebuilt from empty** by `gen-og.mjs`'s `rmSync` before every write, explicitly so
  a removed id cannot leave a stale picture. The **deployed** artifact keeps serving nine images until
  the next `wrangler deploy`, which no agent runs.
- **Memory during `test:quick`.** Timeouts were observed at 0.8–1.7 GB free. Record free memory beside
  every quick run.
- **`npm run build` fails with `EPERM` while `wrangler dev` holds `build/`**, and the e2e run then
  silently tests the stale artefact. Stop wrangler parents-first, including both `workerd` children.
- **Nothing type-checks `e2e/`.** A wrong type in a Playwright file is found by the run, never by
  `npm run check`.
- **`precise` and `still` land at exactly 6 after 11-01, the FEELS floor.** A tenth removal in any
  later phase breaks a FEELS rule. 11-01 writes that where whoever proposes one will see it.

---

## Open questions the plans could not resolve from the documents

Each is put to the user by a named task rather than guessed. **Four of them block a plan.**

1. **ARC's centre-press** (11-09-02, blocking 11-09's third task). "Press the centre and it stops,
   press again and it resumes" describes behaviour the source does not have. Reading 1: "stops" means
   the output went flat — at the bottom edge `s.d = 127 − y = 0` and the CC pins at 64 while the heart
   keeps pulsing, which 11-09-01 fixes anyway. Reading 2: something on hardware the simulator does not
   reproduce, which is a bench row.
2. **STAGE's lining-up** (11-09-02, blocking 11-09's third task). Reading 1 is a third zone state — a
   preview/standby scene that breathes — and **`listing.ts:447` already promises it in the shipped
   description**: *"the live one glows and the one you are lining up breathes."* The code has only
   live (rate 4) and touched (rate 24). Reading 2 is that the four corners breathe out of step, which
   the source denies (all four armed from phase 0 in one call) and which would be a bench finding.
   The evidence favours reading 1 strongly; the choice is still the user's.
3. **LUMEN's depth** (11-09-02, blocking 11-10's second task). Reading 1: the ramp is too shallow —
   `d = 36 − row*@DEPTH` bottoms out at 78 % of the anchor at DEPTH 1 and 11 % at DEPTH 4 and **never
   black**. Reading 2: opacity should be an emitted value rather than a picture — LUMEN sends only raw
   X and Y today, so a lighting desk receives a position and not an intensity.
4. **RADAR and the front-door ring** (11-14-01, blocking 11-14's second task). See R-5 above. Three
   options, all with costs: the ring at seven with its geometry re-derived; a new hand-authored entry
   beside the RADAR preset, landing the catalog at 29; or the ask folded into SONAR with RADAR left
   alone, which D-03 forbids the planner from choosing but the user may.
5. **Nine dead `/c/<id>/` addresses.** Blocks nothing. Shipped as the honest default (a 404), restated
   by 11-16 with the reversal costed: a prerendered stub per id, or a `_redirects`-style rule at the
   Worker — the latter possible only because the site is on Cloudflare Workers and not GitHub Pages.
6. **`docs/MIDI-IN-PROBE.md` has never been run** (H-1). Blocks the clock-sync family, which is
   blocked twice over anyway: even a yes leaves those cards **unpreviewable**, because HANGAR's Lua
   host has no inbound MIDI of any kind — `grxm` is a recorded no-op and `midirx_cb` / `rtmrx_cb`
   appear nowhere under `src/`. **11-08 plans nothing that depends on the answer** and says so.
7. **DIAL's encoder mode** (H-2). Blocks any DIAL work. Not descriptor-reachable either way: `DialMode`
   offers only `relative` and `absolute` and the binary-offset convention is hard-coded at
   `_pad.ts:2043`, so delivering an alternative means a hand-authored dial. **Recorded by 11-16, not
   attempted.**
8. **TRACKPAD's animation.** Blocked twice and not attempted: `normalisePadState` forces
   `look.kind` and `touch.kind` to `"none"` for a trackpad state — measured, a `breathe`/`comet`
   variant normalises straight back and compiles to the identical 902 characters — and there are
   **six characters free at the defaults, one at the worst reachable knob position**. Recorded by
   11-16 as an honest "not in this phase".

---

## Validation Sign-Off

- [ ] The eleven-name block measured on a clean tree, with any disagreement reported rather than
      reconciled (11-01-01)
- [ ] Nine entries gone, the catalog at `BASE_CATALOG − 9`, eight FOR terms every one carrying two or
      more, and the decay rule rescued into a gate **before** the two files carrying it were deleted
      (11-01)
- [ ] Both class bugs closed at every site and both gates failing by naming the rule, with `stage.ts`
      declared rather than excused (11-02)
- [ ] The vendored divergence is a record with an empty table, and the two fidelity contracts are
      re-cut before a single byte moves (11-03)
- [ ] The comet decay fixed in both vendored files at `+0` characters, the compiled fast tap measured
      before it was changed, `tpad` excluded by name, and `firmware-oracle.spec.ts` green as the proof
      the phase walk was not touched (11-04)
- [ ] HANGAR owns the nine, and the guarantee that replaced the read-through is strictly stronger and
      said so in those words (11-05)
- [ ] Five preset asks delivered, four of them free and one of them cheaper than what it replaced
      (11-06)
- [ ] CONSOLE reaches 127, its muted faders are inert, and its mute row takes a swipe; **FORGE's and
      LATTICE's travel both swept the same way**, each answered by a costed fix or by a named
      non-delivery carrying its numbers (11-07)
- [ ] EUCLID, SONAR and STEPS take a swipe without toggling at 100 Hz; **MORPH sends a corner only
      when it changed and a corner at zero sends nothing**; and clock sync is **named as not built**
      with both blockers stated (11-08)
- [ ] **HANGAR notices when a canvas loses its 2D context and comes back** — by event and by
      paint-time guard, with neither half redundant — proved in a browser on a still card and on an
      animating one, with the card sitting still; the eleven `expect.poll` sites repaired including the
      one negation that would have gone green on a throw; `onlyReads` waiting on a signal that implies
      completion; and `retries`, `workers` and `waitForTimeout` refused by name (11-08.1)
- [ ] ARC's picture stops lying about its amplitude; POMODORO gains one and five minutes **appended,
      before the checkpoint rather than behind it**; the **four** multi-reading notes are the user's
      answer and not the planner's (11-09)
- [ ] `gmss` reaches the host and LUMEN sends hex over sysex (11-10)
- [ ] GHOST and SHUTTLE are re-authored from blank pages with their budgets costed up front (11-11,
      11-12)
- [ ] STRIP is two faders and a crossfader, with the 14-bit stream it discards named (11-13)
- [ ] RADAR is built per the user's answer to the ring question, and neither RADAR nor SONAR is given
      a job the user did not ask for (11-14)
- [ ] The wheels: pitch springs home in MIDI as well as in light, mod holds, status **224** through
      `self:gms` and never `gmbs`, and the catalog lands at the branch table's total for 11-14's
      recorded answer — **28, or 29 under `new-entry`** (11-15)
- [ ] The phase gate green against a production build at quick `BASE_FILES + 3` / **`BASE_TESTS + 36`**
      (or `+ 35` under `fold-into-sonar`) in a **seventeen-term** chain with `T14` named, sweep `4 19`,
      e2e **`BASE_E2E + 2`** in seventeen terms with both e2e numbers stated, catalog **28 or 29** in
      seventeen terms; CONT-01 and FOUND-02
      amended by name; **every** thing named as not done rather than quietly dropped — the six certain,
      plus FORGE's and LATTICE's precision notes if their sweeps came back clean, plus MORPH's
      "mapping mode" per the user's answer (11-16)
- [ ] The hardware rows handed to the user, unanswered, and no agent having touched a device (11-16-03)
