---
phase: 9
slug: twenty-configurations
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-07
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is the Nyquist contract. `docs/TESTING.md` (updated by plan 09-10) is the developer-facing
> companion and deliberately does not duplicate the map below. There is no `docs/VALIDATION.md`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.x (node env, `expect.requireAssertions`, `passWithNoTests`), two projects: `server` (quick) and `sweep` + @playwright/test 1.62.1 over `wrangler dev` on `./build`, two projects: `chromium` and `webkit-phone` grepped on `@webkit` |
| **Config file** | `vite.config.ts` (Vitest) and `playwright.config.ts` — **neither is edited in this phase.** D-08's move is a **rename** to `*.sweep.spec.ts`, which the shipped file-name rule already routes |
| **Quick run** | `npm run test:quick` (= `vitest run --project server`) |
| **Sweep** | `npm run test:sweep` (= `vitest run --project sweep`) — **gains a member in 09-01** |
| **Wave run** | `npm run check && npm run lint && npm run test:quick && npm run test:sweep` |
| **Full suite** | the wave run plus `npm run build` and `npm run test:e2e -- --workers 3` |
| **Count gate** | `… 2>&1 \| node scripts/check-counts.mjs <files> <tests>` — **baseline + delta only, never a literal total (D-17)** |
| **New dependency** | **none.** Nothing is installed in this phase |
| **Hardware** | **none, to any agent.** Nothing opens a serial port. The thirty-two audition rows are the user's, presented at 09-10's checkpoint |

**Baselines are NOT known at planning time.** Phase 7 closed on 2026-09-05 and this phase was planned
on 2026-09-07 against a tree nobody has re-measured since. **Task 09-01-01 confirms Phase 7 has
closed** (`07-13-SUMMARY.md` and `07-VERIFICATION.md` on disk, ROADMAP marked complete) **and measures
the block on the clean tree**, reconciling against 07-13's closing block. No number in this document is
asserted anywhere in a plan; every plan asserts a carried name plus a stated delta - `PREV_* ± n` in
the waves, `BASE_* ± n` only in 09-10.

For provenance only, `docs/TESTING.md`'s Phase 7 gate reads quick **73 / 776 + 1 todo**, sweep
**`3 13`**, e2e **89**, `svelte-check` **545 / 0 / 0**, build **12 s**. If 09-01 observes something
else, **the observation is the phase's** and every plan quotes it.

### The seven-name carry-forward block

Phase 5.1 established it and Phases 6 and 7 carried it as five names. **This phase splits one of them
in two**, for the reason the e2e pair was already split:

> **Every SUMMARY in this phase carries the same seven names, whether or not that plan moved them.**

| Name | What it is | How it moves |
|---|---|---|
| `BASE_FILES` | the `test:quick` **file** count on the clean tree Phase 7 closed, measured once in 09-01 | **never moves.** Only 09-10 writes an arithmetic against it |
| `BASE_TESTS` | the `test:quick` **passing test** count on that same clean tree | **never moves.** The todo count is reported and never asserted |
| `PREV_FILES` | the `test:quick` **file** count **as that plan left the tree** | starts equal to `BASE_FILES`; re-measured by every plan that changes it; copied verbatim otherwise |
| `PREV_TESTS` | the `test:quick` **passing test** count as that plan left the tree | starts equal to `BASE_TESTS`; moves the way `PREV_FILES` does |
| `BASE_SWEEP` | the literal the sweep printed | **moves once, in 09-01**, from `3 13` to `4 19`, and never again |
| `BASE_E2E` | the Playwright total on the clean tree Phase 7 closed, measured once in 09-01 | **never moves.** 09-10's phase gate asserts against it |
| `PREV_E2E` | the **last measured** Playwright total, with the plan that measured it named beside it | starts equal to `BASE_E2E`; re-measured by 09-09 and 09-10; copied verbatim otherwise |

**Why the split.** Phases 6 and 7 let `BASE_FILES` and `BASE_TESTS` roll, which works while only one
plan moves them. This phase has one plan that moves them down (09-01, `-1`), one that moves them up
(09-02, `+1 / +5`), seven that must assert they moved nothing, and a phase gate that asserts one
cumulative delta - `BASE_FILES + 1` and `BASE_TESTS + 4` - against the tree the phase started on. Under
one rolling name those are two different arithmetics wearing the same word, and 09-02's `+5` and
09-10's `+4` read as a contradiction rather than as the same chain seen from two ends. So:

- **A wave asserts against `PREV_FILES` / `PREV_TESTS`**, the tree the previous plan left. 09-03 to
  09-09 each assert `PREV_FILES + 0` / `PREV_TESTS + 0`, seven times over.
- **Only 09-10 asserts against `BASE_FILES` / `BASE_TESTS`**, and its number is the phase total.
- The chain has to close: `BASE_TESTS` → `-1` (09-01) → `+5` (09-02) → `+0` × 7 = `BASE_TESTS + 4`.
  09-10 writes that chain out rather than the total alone.

Any plan that finds a name missing from the SUMMARY it reads **stops rather than guessing**. `BASE_CHECK` (the `svelte-check` file count) is provenance only; only `0 errors, 0
warnings` is asserted, and it is read with `grep -Ei "error|warning"` rather than off the count line.

**`PHASE_ADDED_AT`** is an eighth name, introduced by 09-02 and unique to this phase: the one `addedAt`
date every one of the twenty configurations carries. Plans 09-03 to 09-09 copy it verbatim and none of
them uses today's date. One date rather than seven is what keeps the NEWEST sort three blocks instead
of nine.

### Facts the map depends on

Read from this repository on 2026-09-07 by the planner, from the sources, not estimated.

- **The catalog is sixteen entries**: nine `source.kind === "preset"` and seven `"lua"`. **Zero
  `"state"`.** `CATALOG` is `[...PORTED, EUCLID, CHORUS, ARC, GHOST, LATTICE, MORPH, SONAR]`
  (`index.ts:36-45`).
- **Every entry is declared three times** — `entries/<id>.ts`, `LISTING` and the
  `FRONT_DOOR`/`EXCLUDED_FROM_ROW` partition — and all three are gated in both directions.
  `front-door.ts` has **zero imports** and `listing.ts` **one erased `import type`**, both asserted by
  a source scan, which is why they restate rather than read.
- **No catalog gate's test count moves with the catalog.** Every one loops over `CATALOG` inside a
  single `it`, never `it.each` (`catalog.spec.ts:22-27`, `lua-entries.spec.ts:4-8`). This is the
  property that makes seven entry waves cost zero test-count churn, and it is why the per-plan delta
  table below is almost all zeros.
- **`lua-entries.spec.ts` is the load-sensitive test in the quick run.** 283 knob combinations, 566
  measured events, 2.56 s wall / 1.47 s tests measured single-file on 2026-09-07; three timeouts on
  2026-09-05 at 0.8–1.7 GB free on a tree that had not changed a vitest file
  (`docs/TESTING.md:31-33`). D-08 moves it.
- **The vendored `findTraps` knows `gln`, `gld` and `glx`** (`_pad.ts:3513-3524`); the HANGAR Lua host
  registers none of them (`lua-host.ts:360-412`). Recipe-book code passes the static gate and raises
  at runtime — and only if a scripted gesture reaches the line. That is D-07 and 09-01 closes it.
- **`lua-smoke.spec.ts` test 2 fails an entry that produced no MIDI**, in those words. Five
  configurations on this slate send keystrokes and nothing else, and `gks` is recorded and inert
  (`lua-host.ts:429`). 09-02 widens the question to "any output" and 09-06 adds the HID non-vacuity
  half — deliberately in two plans, because an assertion that cannot be true yet is not a gate.
- **`compilerKnobs` returns an empty list for any source kind that is not `preset`**
  (`src/lib/share/stamp.ts:115-119`), so `stampKnobs` does too and a `kind: "state"` entry would ship
  with no knobs and no shareable stamp. This contradicts `ZONA-CAPABILITIES.md` section 7.1's claim
  that `state` is *"fully knob-and-stamp integrated"*, and it is half the reason every entry in this
  phase is `lua`. Recorded as a deferred item by 09-10.
- **`planLayers`'s mutual exclusions are a compiler rule and do not run for a `lua` entry**
  (`_pad.ts:901-983` is reached only from the compile path). D-09's *decision* still applies — every
  entry states which layer carries what — but the mechanism binding a hand-authored entry is the
  **49.6 % single-layer cap** and the two free layers, not `planLayers`.
- **`filter.spec.ts` and `sort.spec.ts` hard-code the catalog's shape** in **seventeen** places, not
  the eleven an earlier count of this document claimed; 09-02 derives what is arithmetic and moves what
  is a review into one `RECORDED` block per file. The full list is in the plan's interfaces table,
  nineteen rows with the two `>= 16` floors 09-10 raises. Three of the seventeen are invisible to the
  obvious grep because Prettier wrapped `.toHaveLength(\n  16,\n)` and left the number alone on
  `sort.spec.ts:110`, `:146` and `:167`; two more are the featured/plain split at `sort.spec.ts:133`
  and `:136`, which hard-code **8** rather than 16 and go red the moment 09-03 makes a ninth entry
  featured. Enumeration, not grep, is what makes that table trustworthy.
- **`audition.spec.ts:52` pins `ROW_COUNT = 12`** and test 3 requires every hand-authored entry's name
  in some row's Config column, so a new entry with no row is red on arrival. `ROW_COUNT` moves in every
  entry wave: 12 → 15 → 18 → 21 → 24 → 27 → 30 → 32.
- **`e2e/browse.e2e.ts` needs `?q=aurora` to leave exactly one card** (`:719-734`, the zero-WebAssembly
  proof) and `filter.spec.ts` needs `ghost` to return exactly one. Both are one careless word away from
  breaking; 09-02's copy gate test 4 protects them.
- **`e2e/browse.e2e.ts` presses `tag-playable` and `tag-generative` by name** (`:332-404`) and requires
  at least one chip to be disabled beside them. Both tags must stay in the derived standing chip row as
  the catalog grows. Watched at 09-09's e2e run.
- **The e2e suite derives everything else from `LISTING`** — every count in `browse.e2e.ts` and
  `browse-webkit.e2e.ts` is `LISTING.length`, and `catalog.e2e.ts` reads its entry count from
  `frames.json`. **No e2e title is added in this phase**, so `test:e2e` is unchanged throughout.
- **`gen-og.mjs` loops `ROUTED` and needs no edit**, and neither does `src/routes/c/[id]/+page.ts`.
  Twenty entries means twenty more images and twenty more prerendered pages, both automatic. Its three
  gates fire per image: engine-buildable, non-dark unless `restsBlack`, under 1 MB.
- **`src/lib/tune/surprise.spec.ts:80`, `stamp-roundtrip.sweep.spec.ts:123` and
  `reachability.sweep.spec.ts:134` all read `toBe(9)`** — and all three filter to preset entries or to
  `stampKnobs(entry).length > 0`, so a Lua entry never enters any of them. The 118-second sweep does
  **not** grow with this phase.
- **`config-shape.spec.ts:614` names `build/c/euclid/index.html`** as a representative off-row page.
  Stable; nothing in this phase moves it.

### The architectural decisions this phase's plans make, so the checker can see them

| Decision | Where | Why |
|---|---|---|
| **All twenty entries are `kind: "lua"`. Zero are `state`.** | 09-03 to 09-09 | D-06 preferred `state` and the planner tested it against the `PadState` vocabulary entry by entry. Two structural reasons: no slate entry's identity survives translation into the six `look.kind`s and six `sends.kind`s (no 2x2 grid, no sequencer, no mute, no per-cell colour map, `sends.scale` refused on the 9x9, `toggle` zones-only, `faders` 3-or-4 only, no keyboard, `soloStream` audition-only); and a `state` entry carries **no knobs and no stamp** today. Each entry file states its own reason in a **route note**, which is a ninth part added to the shipped eight-part header |
| The host surface becomes **two exported arrays that `registerGlobals` iterates** | 09-01 | A gate holding a restatement is a divergence waiting to happen. Making the registration read the list means a name added or removed moves the gate with no second edit |
| The D-07 gate is a **call-site classifier**, not a name blocklist | 09-01 | A blocklist of `gln`/`gld`/`glx` would miss the next unregistered name. Classifying by the character **before** the identifier — `:` a self method, `.` a `math.*` member, bare a global or a local — refuses everything outside the surface, by construction |
| The gap is proved **two-sided in one test**: `findTraps` accepts `gln`, the classifier refuses it | 09-01 | The MIRROR precedent (`audition.spec.ts:236-256`): a status recorded as a two-sided assertion rather than as a note in a document |
| `lua-entries.spec.ts` is **renamed**, not reconfigured | 09-01 | The shipped file-name rule already routes `*.sweep.spec.ts`, and it is quoted in both `vite.config.ts` and `config-shape.spec.ts`. A rename honours it; a third project with an explicit-path include would undercut it |
| Browse literals split into **derived** and **RECORDED** | 09-02 | A number that is arithmetic over the data is derived; a number that is a review of the data stays a literal in one named block, so changing it is a decision rather than a silenced test |
| NEWEST is asserted as **date blocks, descending**, not two fixed sizes | 09-02 | A third `addedAt` breaks "seven then nine" for a reason that is not a fault |
| The NAME order is a **property against an independently written comparator**, plus two witness pairs | 09-02 | The sixteen-name literal would become thirty-six and be rewritten seven times; the property plus `ARC < Aurora` and `SONAR < Starfield` keeps the code-point consequence reviewable at any size |
| A new **`copy.spec.ts`** counts every catalog string | 09-02 | Twenty new descriptions and eighty tags is the volume at which reading is not checking. It also mirrors `e2e/browse.e2e.ts`'s uniqueness rule into the 30-second run |
| `lua-smoke` asks **"any output"**, and the HID non-vacuity half lands with the first HID entry | 09-02, 09-06 | A keyboard is not a silent instrument. An assertion that cannot be true yet is a scheduled failure, not a gate |
| **One `addedAt` for all twenty** | 09-02 | Seven waves on seven days would be seven blocks of three on the NEWEST page |
| **No entry ships a sixteen-value channel knob** | 09-03 to 09-09 | A sixteen-value channel knob alone is 112 of the current 283 sweep combinations. Four common channels keeps twenty-seven entries affordable in a project that already costs 118 s |
| Entries land **three per wave** (two in the last) | 09-03 to 09-09 | Phase 8 is a **weaker** precedent than it first looks, and the comparison should be made honestly: its entry plans shipped canonical Lua **verbatim**, drafted and measured in its research document before its plans were written, so the executor was transcribing and gating. Phase 9's executor authors, minifies, corner-measures and budget-fits three configurations from scratch. What actually carries the three-per-wave size is different: the gate is already built (09-01 and 09-02), every mechanism, layer plan, knob table, trap list and honest limit is fixed in the plan, and the measurement is the oracle - so the work is authoring against a specification, not designing. **09-03 is the densest of the seven** - HOLD's re-arming Timer, STEPS's 64-cell sequencer, SLAM's per-contact state - and it says so in its own objective, with task 1 named as the resumption boundary if context runs short. Seven waves, grouped by what the card is for rather than by what the code does |
| Each entry wave updates the audition **in its own wave** | 09-03 to 09-09 | `audition.spec.ts` test 3 goes red on arrival otherwise. Three or four lines per wave, and the document never lies about the catalog |
| `frames.json` is regenerated **once per wave**, not once per entry | 09-03 to 09-09 | Regeneration rewrites the whole fixture; three regenerations is three chances to commit a half-written one |
| CONSOLE ships as **plain controller messages, not Mackie** | 09-05 | MCU is bidirectional and nothing in this phase receives. The question is a deferred item, not a silence |
| The accessibility claims of CULL and QUADRANT are **measured on a single-channel reduction** | 09-07, 09-09 | A card that claims shape and ships two identical fills is worse than one that claims only colour |
| SNAKE's and LIFE's determinism is **checked by hand and recorded**, and the gap noted | 09-08 | `math.random` is refused statically; nothing asserts build-to-build reproducibility, so a non-deterministic entry would show up as a mysterious hash mismatch two waves later |
| POMODORO is run for **160,000 ticks** outside any gate | 09-09 | No gate runs an entry past 1009 ticks. The 655-second `glt` ceiling is the phase's longest-lived risk and this is the only place it is exercised |
| The two `>= 16` floors rise to `>= 36` and stay **literals** | 09-10 | They are non-vacuity floors a human chose; a derived comparison against `ROUTED.length` is a tautology |

### Why the waves are serial

No two plans in this phase run concurrently, for the arithmetic reason Phases 5.1, 6 and 7 gave:
every acceptance criterion asserts an exact cumulative count, and two plans landing in the same wave
would both compute the wrong total. There is a second reason here: **every entry wave writes to the
same four files** — `index.ts`, `listing.ts`, `front-door.ts` and `frames.json` — and `frames.json` is
regenerated wholesale. Two concurrent entry waves would conflict on all four. The `wave` numbers in
the frontmatter are dependency groupings, one plan each; `depends_on` names the previous plan
explicitly.

### Expected deltas after each plan

| Plan | `test:quick` files | `test:quick` tests | `test:sweep` | `test:e2e` | catalog |
|---|---|---|---|---|---|
| 09-01 | +1 −1 = **+0** | +4 +1 −6 = **−1** | `3 13` → **`4 19`** | unchanged (measured) | 16 |
| 09-02 | **+1** | **+5** | `4 19` | unchanged | 16 |
| 09-03 | +0 | +0 | `4 19` | unchanged | **19** |
| 09-04 | +0 | +0 | `4 19` | unchanged | **22** |
| 09-05 | +0 | +0 | `4 19` | unchanged | **25** |
| 09-06 | +0 | +0 | `4 19` | unchanged | **28** |
| 09-07 | +0 | +0 | `4 19` | unchanged | **31** |
| 09-08 | +0 | +0 | `4 19` | unchanged | **34** |
| 09-09 | +0 | +0 | `4 19` | unchanged (measured) | **36** |
| 09-10 | +0 | +0 | `4 19` | unchanged (measured) | 36 |
| **Phase total** | **+1** | **+4** | **+1 file / +6 tests** | **unchanged** | **+20** |

The quick arithmetic written out: `host-surface.spec.ts` **+4**, `lua-host.spec.ts` **+1**,
`copy.spec.ts` **+5**, `lua-entries.spec.ts` leaving the project **−6**. Net **+1 file, +4 tests**.
The sweep gains that same file: **+1 file, +6 tests**.

**Seven waves of configurations move no test count at all**, and that is the property `docs/TESTING.md`
and D-17 bought. If a count moves during an entry wave, something was written as `it.each` and the
wave should stop rather than update a number.

Per-file counts, which **are** asserted absolutely:

| File | Tests | Plan |
|---|---|---|
| `src/lib/catalog/host-surface.spec.ts` | **4** | 09-01 (created) |
| `src/lib/sim/lua-host.spec.ts` | 8 → **9** | 09-01 |
| `src/lib/catalog/lua-entries.sweep.spec.ts` | **6**, unchanged, moved to the `sweep` project | 09-01 |
| `src/lib/catalog/copy.spec.ts` | **5** | 09-02 (created) |
| `src/lib/browse/filter.spec.ts` | **6**, unchanged (rewritten inside) | 09-02, then every entry wave |
| `src/lib/browse/sort.spec.ts` | **6**, unchanged (rewritten inside) | 09-02, then every entry wave |
| `src/lib/sim/lua-smoke.spec.ts` | **3**, unchanged (test 2 widened, then completed) | 09-02, 09-06 |
| `src/lib/catalog/catalog.spec.ts` | **10**, unchanged | every entry wave |
| `src/lib/catalog/frames.spec.ts` | **5**, unchanged | every entry wave |
| `src/lib/catalog/listing.spec.ts` | **5**, unchanged | every entry wave |
| `src/lib/catalog/front-door.spec.ts` | **8**, unchanged | every entry wave |
| `src/lib/catalog/audition.spec.ts` | **4**, unchanged (`ROW_COUNT` moves) | every entry wave |
| `src/lib/og/build.spec.ts` | unchanged (floor 16 → 36) | 09-10 |
| `e2e/artifacts.e2e.ts` | unchanged (floor 16 → 36) | 09-10 |

Standing gates that must be green at the phase gate and are **not** edited:
`src/lib/fidelity/vendored-diff.spec.ts` (**14**), `src/lib/fidelity/lua-parity.spec.ts` (**5**,
pinned to the nine presets), `src/lib/fidelity/preset-baseline.spec.ts`, `src/lib/protocol-pin.spec.ts`,
`src/lib/config-shape.spec.ts` (**14**), `src/lib/sim/lazy.spec.ts` (**3**),
`src/lib/tune/surprise.spec.ts`, `src/lib/tune/reachability.sweep.spec.ts` (**2**),
`src/lib/share/stamp-roundtrip.sweep.spec.ts`, `e2e/catalog.e2e.ts` (**2**), `e2e/browse.e2e.ts`,
`e2e/browse-webkit.e2e.ts`.

### The new cost

| Suite | Threshold | If exceeded |
|---|---|---|
| `src/lib/catalog/lua-entries.sweep.spec.ts` | none stated; projected ~1,090 combinations at 27 entries against 283 at 7, so roughly 5–8 s of `tests` time inside a 118 s sweep | record the wall time each wave. **Do not trim what it covers** — that is the sentence `docs/TESTING.md:302-310` already carries |
| `src/lib/catalog/frames.spec.ts` | none; 36 entries × 6 engine builds, 27 of them fresh Lua VMs | record the wall time each wave |
| `src/lib/sim/lua-smoke.spec.ts` | none; 27 entries × 216 ticks × 243 layer records ≈ 1.4 M record reads | record the wall time each wave |
| `src/lib/catalog/host-surface.spec.ts` | none; pure text scanning plus one booted VM at module scope | if it exceeds 2 s, the classifier is doing something per-call it should do once |
| `npm run build` | none; 36 OG images, 27 of them a fresh wasmoon `lua_State`. Projected 16–20 s against 12 s at sixteen | record it in every entry wave and reconcile in 09-10 |
| `npm run test:sweep` | **moves once**, in 09-01, from `3 13` to `4 19`. If it moves again, something was misfiled |

---

## Requirement ownership

`.planning/ROADMAP.md` maps **CONT-02** to Phase 9. The plans also close **CONT-03** (metadata) and
**TUNE-01** (knobs), which Phase 8's plans carried in the same way, and each closes with a qualifier
that must appear in 09-10's SUMMARY:

| Requirement | Closed by | Qualifier |
|---|---|---|
| CONT-02 | 09-10 | Twenty configurations authored, thirty-six in the catalog. Every one fits both 908-character budgets at its defaults and at **every corner of its own knob cross-product**, proved by the separability identity rather than by enumeration; runs in a real Lua 5.4 VM through a scripted drag, tap and lift plus 200 ticks without error; and **calls only names the HANGAR Lua host registers** — the D-07 gate, new in this phase. **Hardware: thirty-two audition rows are the user's and are unanswered.** |
| CONT-03 | 09-10 | Every entry's name, one-line description, four feel tags, Featured flag and arrival date are declared in the entry file and restated in `LISTING`, gated field by field in both directions, with the copy **counted by `copy.spec.ts`** rather than read: no exclamation mark, no emoji, typographic apostrophes, no hyphen as a dash, at most 110 characters, one line, and no two descriptions the same |
| TUNE-01 | 09-10 | Three to six knobs per hand-authored entry over the vendored `KnobKind` vocabulary, index defaults, every token live in at least one event, none a prefix of another, the whole cross-product measured. **No sixteen-value channel knob**, which is what kept the sweep affordable at twenty-seven entries |

Phase 9's success criteria 4 and 5 in the ROADMAP map to 09-01 (the host-surface gate) and to
09-09/09-10 (the ring unchanged at eight, the browse page and the gates green at thirty-six).

---

## Sampling Rate

- **After every task:** `npm run test:quick`, plus `npm run lint` when the task touched a source file.
  In an entry wave, also the four gate commands the plan names —
  `catalog.spec.ts` + `host-surface.spec.ts` + `copy.spec.ts`,
  `lua-entries.sweep.spec.ts` under `--project sweep`, `lua-smoke.spec.ts`, and `AUDITION_DUMP=1`.
- **After every wave:** `npm run check && npm run lint && npm run test:quick && npm run test:sweep`,
  then `npm run build`, then **`npm run test:quick` again** — `config-shape.spec.ts` test 14 and
  `og/build.spec.ts` tests 1, 4 and 5 read `build/`.
- **After the last entry wave and at the gate:** the above plus `npm run test:e2e -- --workers 3`.
  Waves 09-09 and 09-10 do this; no other wave runs e2e, because no e2e title moves and a 112-second
  run per wave buys nothing.
- **Max feedback latency:** ~35 s (quick), ~3 min (wave with the sweep), ~4 min (gate with the build
  and e2e).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | all | precondition + baseline | Phase 7 closed; the seven-name block measured and reconciled against 07-13, with PREV_FILES / PREV_TESTS equal to BASE_FILES / BASE_TESTS on the clean tree; ten per-file counts and the 283-combination table recorded; `git status --porcelain` empty | n/a | pending |
| 09-01-02 | 01 | 1 | CONT-02 | unit + source | `host-surface.spec.ts` **4**; `lua-host.spec.ts` **9**; `registerGlobals` iterates `HOST_GLOBALS`; `findTraps` accepts `gln` and the classifier refuses it; the seven shipped entries pass unedited; negative check red on test 2 naming `euclid`/`setup`/`gld` | created here | pending |
| 09-01-03 | 01 | 1 | CONT-02 | infrastructure | `lua-entries.sweep.spec.ts` **6** under `--project sweep`; `test:sweep` `4 19`; `grep -rn "lua-entries.spec"` empty; `vite.config.ts` unedited; four wall times recorded | renamed here | pending |
| 09-02-01 | 02 | 2 | CONT-02 | unit | `filter.spec.ts` **6**, `sort.spec.ts` **6**, counts unmoved; one `RECORDED` block per file; no bare 16; two negative checks with their stated outcomes | exists | pending |
| 09-02-02 | 02 | 2 | CONT-03 | unit | `copy.spec.ts` **5**; quick `BASE + 1 / + 5`; the `COPY_CENSUS=1` table recorded; three negative checks red | created here | pending |
| 09-02-03 | 02 | 2 | CONT-02 | unit | `lua-smoke.spec.ts` **3** reading `run.hid`; the deferred HID assertion marked in a comment; `PHASE_ADDED_AT` recorded; negative check red on test 2 with the new message | exists | pending |
| 09-03-01 | 03 | 3 | CONT-02, 03, TUNE-01 | unit + measured | HOLD: canonical, in budget at both corners, host-surface green, smoke green with MIDI; six measurements and the combination count | created here | pending |
| 09-03-02 | 03 | 3 | CONT-02, 03, TUNE-01 | unit + measured | STEPS and SLAM: the same four gates; SLAM stores `timer: ""`; code 9 handled explicitly | created here | pending |
| 09-03-03 | 03 | 3 | CONT-02, CONT-03 | fixture + docs | frames 19 entries, two regenerations identical; `ROW_COUNT` **15**; `RECORDED` 19 / 9; quick `+0/+0`; two negative checks red | exists | pending |
| 09-04-01 | 04 | 4 | CONT-02, 03, TUNE-01 | unit + measured | KEYS: four gates; the four scale masks checked against their degree lists; a press on a dark cell sends nothing, observed | created here | pending |
| 09-04-02 | 04 | 4 | CONT-02, 03, TUNE-01 | unit + measured | GRIDLOCK and TABLE: four gates; GRIDLOCK's `glim` phase clamp; TABLE's gated redraw | created here | pending |
| 09-04-03 | 04 | 4 | CONT-02, CONT-03 | fixture + docs | frames 22; `ROW_COUNT` **18**; `RECORDED` 22 / 10; five tags added; quick `+0/+0`; two negative checks red | exists | pending |
| 09-05-01 | 05 | 5 | CONT-02, 03, TUNE-01 | unit + measured | CONSOLE: four gates; the not-Mackie sentence; `@CC + 8 < 128`; deferred item 1 written | created here | pending |
| 09-05-02 | 05 | 5 | CONT-02, 03, TUNE-01 | unit + measured | STRIP and LEARN: four gates; every `@CC` 0..31; one recorded `gms` per send with `mode: 1` and `p1` in range (the two-message pair is firmware expansion the host does not model, `lua-host.ts:556-572`, and is audition row 20's question); LEARN's per-mode message counts | created here | pending |
| 09-05-03 | 05 | 5 | CONT-02, CONT-03 | fixture + docs | frames 25; `ROW_COUNT` **21**; `RECORDED` 25 / 11; `latching` crosses into the chip row; two negative checks red | exists | pending |
| 09-06-01 | 06 | 6 | CONT-02, 03, TUNE-01 | unit + measured | LUMEN: four gates; both hue forms measured; channels inside 0..255 at every `@DEPTH` | created here | pending |
| 09-06-02 | 06 | 6 | CONT-02, 03, TUNE-01 | unit + source | STAGE and SHUTTLE: four gates; every HID usage id verified against a named table; `gks` arity per call; **`lua-smoke.spec.ts` asserts HID non-vacuity and passes** | created here | pending |
| 09-06-03 | 06 | 6 | CONT-02, CONT-03 | fixture + docs | frames 28; `ROW_COUNT` **24** with row 23 naming `gks`'s inertness; `RECORDED` 28 / 12; deferred item 2; two-stage negative check recorded | exists | pending |
| 09-07-01 | 07 | 7 | CONT-02, 03, TUNE-01 | unit + measured | CULL: four gates; five distinct single-channel band patterns pasted | created here | pending |
| 09-07-02 | 07 | 7 | CONT-02, 03, TUNE-01 | unit + measured | FORGE and SWITCH: four gates; FORGE's two dropped-release mitigations; nine distinct glyphs; whether `>>`/`&` survive `compressScript` | created here | pending |
| 09-07-03 | 07 | 7 | CONT-02, CONT-03 | fixture + docs | frames 31; `ROW_COUNT` **27** with row 26 naming the watchdog; `RECORDED` 31 / 13; the deliberately green negative check recorded | exists | pending |
| 09-08-01 | 08 | 8 | CONT-02, 03, TUNE-01 | unit + measured | SNAKE: four gates; determinism check to tick 1009, byte-identical; every loop bounded by a literal | created here | pending |
| 09-08-02 | 08 | 8 | CONT-02, 03, TUNE-01 | unit + measured | ETCH and LIFE: four gates; ETCH `restsBlack: true` with `RESTS_DARK_NOTE` verbatim; LIFE's determinism check and its note ceiling | created here | pending |
| 09-08-03 | 08 | 8 | CONT-02, CONT-03 | fixture + docs | frames 34, **three** regenerations identical; `ROW_COUNT` **30**; `RECORDED` 34 / 14; deferred item 3; two negative checks red | exists | pending |
| 09-09-01 | 09 | 9 | CONT-02, 03, TUNE-01 | unit + measured | QUADRANT: four gates; four distinct single-channel patterns; the dead cross sends nothing, observed | created here | pending |
| 09-09-02 | 09 | 9 | CONT-02, 03, TUNE-01 | unit + measured | POMODORO: four gates; **160,000-tick run with the breathe still moving**; the ring drains between ticks 37 and 1009 | created here | pending |
| 09-09-03 | 09 | 9 | CONT-02, CONT-03 | fixture + docs + e2e | frames 36; the fifteen-row arithmetic table with `state` reading **0**; `ROW_COUNT` **32**; `RECORDED` 36 / 15; e2e `BASE_E2E`; partition negative check red | exists | pending |
| 09-10-01 | 10 | 10 | CONT-02 | measured + docs | every research projection replaced by an observation; `docs/TESTING.md` re-measured; both floors 36; the ceiling comment re-stated; floor negative check red | exists | pending |
| 09-10-02 | 10 | 10 | **CONT-02, CONT-03, TUNE-01** | phase gate | quick `BASE + 1 / + 4`, sweep `4 19`, e2e `BASE_E2E`, against a fresh production build; `vendored-diff` **14**, `lua-parity` **5**; `git diff --stat HEAD -- src/vendor/` empty; three qualifiers written | exists | pending |
| 09-10-03 | 10 | 10 | **CONT-02 (hardware)** | **checkpoint:human-verify** | not automatable — thirty-two audition rows run by the user on a real ZONA, six of them first | n/a | pending |

*Status: pending / green / red / flaky. Every row starts pending; an executing plan updates only its own rows.*

---

## Wave 0 Requirements

None of these is a framework gap. Vitest, Playwright, both browser binaries, `wrangler` and every
dependency are installed and pinned; **nothing is installed in this phase**. The gaps are files and two
shipped rules to extend.

- [ ] **Phase 7 closed** → **09-01-01** (a precondition, not a file)
- [ ] `src/lib/sim/lua-host.ts` gains `HOST_GLOBALS` and `HOST_SELF_METHODS`, and `registerGlobals`
      iterates them → **09-01-02**
- [ ] `src/lib/catalog/host-surface.spec.ts` → **09-01-02** (created)
- [ ] `src/lib/catalog/lua-entries.spec.ts` renamed to `*.sweep.spec.ts`, **nineteen** references fixed
      - twelve source-comment lines and seven document lines across two documents
      (`docs/PIN-POLICY.md:54`; `docs/TESTING.md:31, 288, 299, 302, 323, 661`) → **09-01-03**
- [ ] `src/lib/browse/filter.spec.ts` and `sort.spec.ts` rewritten inside, counts unmoved → **09-02-01**
- [ ] `src/lib/catalog/copy.spec.ts` → **09-02-02** (created)
- [ ] `src/lib/sim/lua-smoke.spec.ts` test 2 widened to any output → **09-02-03**, completed **09-06-02**
- [ ] `PHASE_ADDED_AT` recorded → **09-02-03**
- [ ] `.planning/phases/09-twenty-configurations/deferred-items.md` → **09-05-01** (created)

---

## What the fixtures and gates prove

**`src/lib/catalog/host-surface.spec.ts` is evidence, and it is the phase's new one.** It compares two
independent things: the surface a booted wasmoon VM actually has in `_G`, and the calls twenty-seven
hand-authored entries make. Neither was derived from the other. Its third test compares the vendored
compiler's own scanner against the same text and records that they disagree.

**`src/lib/catalog/frames.json` is a regression tripwire, not an oracle.** Its hashes came out of the
engine they check, so a red `frames.spec.ts` says rendering moved and says nothing about which side of
the move was right. That answer comes from `lua-parity.spec.ts`, which is untouched by this phase
because it is pinned to the nine presets.

**`src/lib/catalog/lua-entries.sweep.spec.ts` is a budget gate valid only at the current protocol
pin.** Canonical compressed form is a property of a specific minifier version, so a bump can turn any
of twenty-seven stored strings non-canonical without changing a character of HANGAR's source.
`docs/PIN-POLICY.md` item 4 is what carries that, and 09-10 raises its stake from seven entries to
twenty-seven.

**`src/lib/catalog/copy.spec.ts` proves the punctuation and the vocabulary, not the prose.** It cannot
tell whether a description is good; it can tell that no two are identical, that every apostrophe is
U+2019 in HANGAR-authored copy, and that no tag is a typo of another.

**`src/lib/sim/lua-smoke.spec.ts` proves that an entry runs and emits, not that what it emits is
right.** For the five keystroke entries it proves strictly less than for the others: `gks` is recorded
and inert, so their output is unchecked by construction. That is deferred item 2 and audition rows 23,
24, 25, 26 and 27.

---

## Manual-Only Verifications

Everything in `docs/HARDWARE-AUDITION.md` — thirty-two rows after this phase, over twenty-seven
hand-authored configurations. Six of them are the ones a green test cannot stand in for:

| row | Config | Why a test is not evidence |
|---|---|---|
| 13 | HOLD | firmware's dropped-release bug; `pad-sim.ts:262-268` states it cannot manufacture the stuck contact |
| 19 | CONSOLE | the mute latch, same bug |
| 23 | STAGE | `gks` is recorded and inert; nothing in HANGAR consumes it |
| 24 | SHUTTLE | the same, plus whether the module can press a key that fast inside a 256-byte cycle |
| 26 | FORGE | the held-corner bank, same bug, plus a watchdog nobody has watched fire |
| 32 | POMODORO | the 655-second `glt` ceiling and a Timer that drifts under load |

Presented at 09-10's checkpoint. **No agent connects to or writes to a device in this phase.**

---

## Negative checks (observe red before trusting)

| Plan | Perturbation | Expected red |
|---|---|---|
| 09-01 | add ` gld(0,2,0,0,0)` to euclid's Setup template | `host-surface.spec.ts` test 2, naming `euclid`, `setup`, `gld` |
| 09-01 | run the renamed sweep spec under `--project server` | it collects nothing — the exclusion working |
| 09-02 | add a second carrier for an existing tag in `listing.ts` | `filter.spec.ts` test 5 on `RECORDED.tags` or `RECORDED.chips` |
| 09-02 | give one entry a third `addedAt` | `sort.spec.ts` NEWEST **passes** (the restructure) while `listing.spec.ts` goes red |
| 09-02 | GHOST's U+2019 → ASCII | `copy.spec.ts` test 2, naming `ghost`, `description`, `U+0027` |
| 09-02 | `!` in a hand-authored description | `copy.spec.ts` test 2 |
| 09-02 | duplicate one description onto another entry | `copy.spec.ts` test 1, naming both ids |
| 09-02 | remove MORPH's `self:gms` | `lua-smoke.spec.ts` test 2, with the new "no MIDI and no HID" message |
| 09-03 | one hex digit of HOLD's hash | `frames.spec.ts` test 3, naming `hold` and the tick |
| 09-03 | delete HOLD's audition row | `audition.spec.ts`, naming `HOLD` and the row count |
| 09-04 | delete GRIDLOCK's audition row; one hex digit of TABLE's hash | `audition.spec.ts`; `frames.spec.ts` test 3 |
| 09-05 | one hex digit of CONSOLE's hash; revert `RECORDED.featured` | `frames.spec.ts` test 3; `sort.spec.ts`'s featured test |
| 09-06 | remove `gks` from STAGE only, then from both | green, then `lua-smoke.spec.ts` test 2 — and the difference is the finding |
| 09-07 | make two of SWITCH's glyphs identical | **nothing** — the deliberate green one, proving glyph distinctness has no gate |
| 09-07 | one hex digit of FORGE's hash | `frames.spec.ts` test 3 |
| 09-08 | ETCH's `restsBlack` → false | `frames.spec.ts` test 5, naming `etch` |
| 09-08 | one hex digit of SNAKE's hash at tick 1009 | `frames.spec.ts` test 3 |
| 09-09 | remove POMODORO from `EXCLUDED_FROM_ROW` | `front-door.spec.ts` on the partition |
| 09-10 | `og/build.spec.ts` floor → 37 | its floor test, naming the observed count |

Every one is reverted with `git checkout --` and every one is recorded in its plan's SUMMARY with both
exit codes and the failing message. **`git add` any new file before perturbing it**: on an untracked
path `git checkout --` fails outright and `git diff --quiet` passes vacuously.

---

## Standing hazards carried into this phase

- **Memory during `test:quick`.** The 2026-09-05 timeouts happened at 0.8–1.7 GB free on a tree that
  had not changed a vitest file. D-08 removes the biggest contributor in wave 1; record the free memory
  beside every quick run anyway.
- **The chip row reshuffles every wave.** `filter.spec.ts`'s `RECORDED.chips` and `chipCounts` move in
  all seven entry waves, and `e2e/browse.e2e.ts` presses `tag-playable` and `tag-generative` by name.
  If either stops standing, the e2e run at 09-09 is where it surfaces.
- **Two reserved words.** No new entry's name, description or tags may contain `aurora` or `ghost`.
  09-02's copy gate test 4 is the guard, and 09-08's plan restates it because "a ghost of the last
  shape" is a natural thing to write about a drawing card.
- **`gen-og.mjs` runs before `vite build`**, because `vite build` copies `static/` into `build/`.
  And `test:quick` must be run **after** a build, because three specs read `build/`.
- **A `restsBlack` or `motion` declaration is an expectation the fixture proves.** Every entry wave
  reconciles both against the regenerated frames and the fixture wins. GHOST's case — `animating` at
  every tick with zero lit bytes — is the one to watch for.
- **Firmware's dropped-release bug is present at current HEAD** and the simulator deliberately does not
  reproduce it. Four configurations in this phase latch.
- **The 655-second `glt` ceiling.** Three entries here arm long-lived animations; only POMODORO is
  exercised past it, and only in a throwaway 160,000-tick run.
- **The 256-byte protocol buffer.** Eighteen 7-bit MIDI messages per 10 ms cycle, and an append that
  does not fit is refused with **no error**. LIFE and ETCH are the two entries that can reach it.
- **`touch_cb` under ~1000 microseconds.** At 1 ms you lose ~9 % of touch samples; at 5 ms a third.
  Four entries in this phase gate a repaint on a stored value for exactly this reason, and each marks
  it do-not-remove.

---

## Open questions the plans could not resolve from the documents

1. **Should the front-door ring grow?** D-02 says it stays at eight this phase and
   `front-door.spec.ts:110-112` requires `preview === "padsim"` for every row member, so **no Lua
   entry can join the row at all today**. Twenty-seven of the catalog's thirty-six entries are now
   Lua. Widening the row is a decision plus a spec change, and it is not in this phase.
2. **Should `kind: "state"` become usable?** Every entry in this phase is `lua`, and one of the two
   reasons is that a `state` entry ships with no knobs and no stamp. Fixing that is an optional
   `knobKinds` on the source plus a `compilerKnobs` change — and it pulls `state` entries into a
   118-second sweep. Recorded by 09-10 as a deferred item.
3. **Should the five keystroke configurations have a HID consumer in the simulator?** Deferred item 2.
   Decoding `gks` tuples into named key events and asserting them per entry is cheap and would turn
   five unchecked cards into five checked ones. It would not prove the wire; only rows 23 and 24 do.
4. **Should determinism be gated rather than checked by hand?** Deferred item 3. One extra engine build
   per entry in `frames.spec.ts`, at one tick.
5. **Whether any slate entry should be swapped** for one of the twenty-four candidates that did not
   make the cut (`09-CONTEXT.md`'s open item 1). The slate is settled with the user and these plans do
   not re-open it.

---

## Validation Sign-Off

- [ ] Phase 7 confirmed closed and the seven-name block measured and reconciled (09-01-01)
- [ ] The D-07 host-surface gate exists, is red on a `gln`, and the seven shipped entries pass it
      unedited (09-01-02)
- [ ] The knob sweep runs in the `sweep` project with nothing trimmed (09-01-03)
- [ ] Every browse count is derived or in a `RECORDED` block; NEWEST is date blocks (09-02-01)
- [ ] Every catalog string is counted by a script, including the two reserved search words (09-02-02)
- [ ] The execution gate asks for any output and both non-vacuity halves are asserted (09-02-03,
      09-06-02)
- [ ] Twenty configurations authored, three per wave, each with the nine-part header including its
      route note and its honest limit (09-03 to 09-09)
- [ ] Each entry declared three times and gated in both directions; the front-door ring still eight
      (09-03 to 09-09)
- [ ] `frames.json` regenerated once per wave, idempotent, with every `restsBlack` and `motion`
      reconciled against it (09-03 to 09-09)
- [ ] `ROW_COUNT` reaches 32 and every hand-authored entry is named in a row (09-03 to 09-09)
- [ ] The cost of thirty-six is measured, not projected, and written into `docs/TESTING.md` (09-10-01)
- [ ] The phase gate green against a production build: quick `+1 / +4`, sweep `4 19`, e2e unchanged,
      `src/vendor/` untouched (09-10-02)
- [ ] Every deferred item recorded with what would close it (09-10-02)
- [ ] The audition handed to the user, unanswered, with no agent having touched a device (09-10-03)
