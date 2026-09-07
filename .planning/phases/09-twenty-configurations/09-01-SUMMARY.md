---
phase: 09-twenty-configurations
plan: 01
subsystem: catalog
tags: [baseline, host-surface, call-classifier, findTraps, D-07, D-08, sweep-project, CONT-02]

# Dependency graph
requires:
  - ".planning/phases/07-install-flow/07-13-SUMMARY.md - Phase 7's closing block (BASE_FILES 69 + 4 = 73, BASE_TESTS 724 + 52 = 776 + 1 todo, BASE_SWEEP `3 13`, BASE_E2E 77 frozen, PREV_E2E 89), reconciled against here with no discrepancy"
  - ".planning/phases/07-install-flow/07-VERIFICATION.md and .planning/ROADMAP.md line 31 - Phase 7 marked complete, the precondition this plan refused to measure without"
  - "09-CONTEXT.md D-07 as AMENDED - findTraps is exported from the vendored compiler and called by no HANGAR spec, so there was no static gate at all over a hand-authored entry's call surface; the new gate is a classifier, not a blocklist, and the disagreement is proved two-sided"
  - "09-CONTEXT.md D-08 - lua-entries.spec.ts measures 283 knob combinations through the WASM minifier and timed out three times under memory pressure; it moves before the entry count grows"
  - ".planning/research/ZONA-CAPABILITIES.md sections 0 and 4.5 - the three capability tiers and the authoritative T3 list (15 globals + 9 self: methods)"
  - "src/lib/sim/lua-host.ts registerGlobals() and SELF_PRELUDE - the registration the two new exports had to BECOME rather than restate"
  - "scripts/check-counts.mjs (08-01, D-17) - baseline plus delta, never a literal total"
provides:
  - "The seven-name carry-forward block for Phase 9, measured on the clean tree Phase 7 closed at 34d0fd6: BASE_FILES 73 (frozen), BASE_TESTS 776 (frozen), PREV_FILES 73, PREV_TESTS 775, BASE_SWEEP `4 19`, BASE_E2E 89 (frozen), PREV_E2E 89 (measured by 09-01). BASE_CHECK 545 on the clean tree, 546 as this plan left it; npm run build 12 s"
  - "HOST_GLOBALS (15 names) and HOST_SELF_METHODS (9 names), exported from src/lib/sim/lua-host.ts. registerGlobals() ITERATES the first through a Record keyed by it, so a name without a binding or a binding without a name fails to compile"
  - "src/lib/catalog/host-surface.spec.ts - the D-07 gate, 4 tests, a fixed count: a call-site classifier that resolves every call in every hand-authored entry at its defaults and at both knob corners against the registered surface, and refuses everything outside it"
  - "The two-sided gln proof, in test 3: findTraps returns ZERO hits for a body that calls gln, and the classifier refuses that same body naming gln"
  - "src/lib/catalog/lua-entries.sweep.spec.ts - the CONT-02 budget and canonical-form gate, 6 tests unchanged, moved into the sweep project by the shipped file-name rule with vite.config.ts unedited"
  - "The ten per-file counts and the 283-combination per-entry sweep table, for plan 09-10 to reconcile against"
affects:
  - "09-02 to 09-09 - every entry authored in this phase is gated by host-surface.spec.ts test 2 before it can ship, and every one of them asserts PREV_FILES + 0 / PREV_TESTS + 0 against the 73 / 775 this plan left"
  - "09-10's phase gate - asserts BASE_FILES + 1 and BASE_TESTS + 4 against the 73 / 776 frozen here, and BASE_E2E against the 89 frozen here"
  - "docs/PIN-POLICY.md items 1, 4 and 6 - the sweep is 4 files / 19 tests and item 4's command moved to --project sweep on the new path"
  - "docs/TESTING.md - the two rows this plan moved are re-measured and dated 2026-09-07; the rest of the table is left to 09-10 and said to be"

tech-stack:
  added: []
  patterns:
    - "A gate's permitted list IS the registration: the host exports the array, the registration loops it through a Record keyed by it so TypeScript fails the build on either kind of drift, and the gate imports the same array. A name added or removed moves all three with no second edit"
    - "A call surface is gated by a CLASSIFIER, not a blocklist. The character BEFORE an identifier is the discrimination the vendored scanner throws away: ':' a self method, '.' a math.<version-stable> member, bare a registered global or a Lua base name or a local declared in the same event. A name nobody has thought of yet is refused by construction"
    - "A disagreement between two shipped mechanisms is recorded as one two-sided test rather than as a note in a document: findTraps accepts the body, the classifier refuses it, both asserted in the same it()"
    - "A phase splits its quick-run baseline into a FROZEN pair and a ROLLING pair when more than one plan moves it, so a wave asserts 'I moved nothing' against the previous plan while the phase gate asserts one cumulative delta against the tree the phase started on"
    - "Moving a load-sensitive spec between Vitest projects is a git mv, because the file-name rule is the routing rule. No configuration file is touched and the history follows the file"

key-files:
  created:
    - "src/lib/catalog/host-surface.spec.ts"
    - ".planning/phases/09-twenty-configurations/09-01-SUMMARY.md"
  modified:
    - "src/lib/sim/lua-host.ts"
    - "src/lib/sim/lua-host.spec.ts"
    - "src/lib/catalog/lua-entries.spec.ts -> src/lib/catalog/lua-entries.sweep.spec.ts (renamed)"
    - "src/lib/catalog/entries/arc.ts"
    - "src/lib/catalog/entries/chorus.ts"
    - "src/lib/catalog/entries/euclid.ts"
    - "src/lib/catalog/entries/ghost.ts"
    - "src/lib/catalog/entries/lattice.ts"
    - "src/lib/catalog/entries/morph.ts"
    - "src/lib/catalog/entries/sonar.ts"
    - "src/lib/device/wire-pin.spec.ts"
    - "src/lib/sim/lua-smoke.spec.ts"
    - "src/lib/tune/model.ts"
    - "docs/PIN-POLICY.md"
    - "docs/TESTING.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "BASE_FILES 73 and BASE_TESTS 776 are frozen at the clean tree Phase 7 closed (34d0fd6) and every number reconciled against 07-13-SUMMARY.md exactly, with no discrepancy to trace. BASE_E2E is re-frozen at 89 for this phase - Phase 7's BASE_E2E was 77 and its PREV_E2E 89, and 89 is the clean tree Phase 9 starts on"
  - "The self: half of the surface is a plain restatement in SELF_PRELUDE, not a generated string. The prelude is Lua SOURCE and a generated one would be less readable than the list it replaced; what holds the two together is a test in each of the two specs, not a loop"
  - "The three __hangar_ bridges stay OUTSIDE HOST_GLOBALS and the reason is written at the binding: gms is bridged so a bare gms(...) still raises, and the touch queue's accessors have no bare form in firmware either. HOST_SELF_METHODS is where their public spelling lives"
  - "The classifier filters Lua's 22 reserved words before classifying, because `self.touch_cb=function(s,i,e,x,y)` would otherwise read as a bare call to something named `function`. A reserved word followed by ( is a definition, a parenthesised expression or a syntax error - never a call"
  - "The callability half of lua-host.spec.ts test 9 runs INSIDE the VM, as a Setup built from HOST_GLOBALS that calls error() on any name that is not a function, because nothing public on LuaHost evaluates a string. A host that constructs at all has already proved every name resolves"
  - "docs/TESTING.md's How-to-run table was NOT re-measured whole. Only the two rows this plan moved were re-taken, they carry the date 2026-09-07 in the cell, and a paragraph says in those words that the rest is Phase 7's and belongs to 09-10. A half-updated table read as a whole is worse than a stale one"
  - "The quick run did not get faster and the SUMMARY says so. D-08 buys headroom against a timeout under memory pressure, not wall time: the quick run is parallel and lua-entries' 2.18 s was never its critical path. What did move is the sweep, 110 s -> 87 s, because four files distribute across the worker pool better than three did around pad-invariants"

requirements-completed: []
requirements-contributed: [CONT-02]

# Metrics
duration: 71min
completed: 2026-09-07
---

# Phase 9 Plan 01: Baselines, the Host-Surface Gate and the Sweep Move — Summary

A call the HANGAR Lua host does not register is now refused by a classifier whose permitted list is
the registration itself, the vendored scanner's disagreement is proved in the same test, and the
283-combination knob sweep has left the parallel quick run — measured against a tree that reconciles
with Phase 7's closing block to the number.

---

## The seven-name block

**Measured on the clean tree Phase 7 closed, at `34d0fd6`, before this plan created anything.** Each
command was run alone, in the plan's order, with `npm run build` before `test:quick` so
`config-shape.spec.ts` test 14 and `og/build.spec.ts` tests 1, 4 and 5 were armed.

| Name | Value | The runner's own line, verbatim |
|---|---|---|
| `BASE_FILES` | **73** — **frozen** | ` Test Files  73 passed (73)` |
| `BASE_TESTS` | **776** (+ 1 todo) — **frozen** | `      Tests  776 passed \| 1 todo (777)` |
| `PREV_FILES` | **73** — as this plan left the tree | ` Test Files  73 passed (73)` |
| `PREV_TESTS` | **775** (+ 1 todo) — as this plan left the tree | `      Tests  775 passed \| 1 todo (776)` |
| `BASE_SWEEP` | **`4 19`** — was `3 13` on the clean tree; moved once, here | ` Test Files  4 passed (4)` / `      Tests  19 passed (19)` |
| `BASE_E2E` | **89** — **frozen** | `  89 passed (1.7m)` |
| `PREV_E2E` | **89 (measured by 09-01)** | same run |

**Both facts, said rather than left to be subtracted.** `BASE_FILES` and `BASE_TESTS` are the clean
tree and do not move again for the whole phase — only 09-10 writes an arithmetic against them, and it
is `BASE_FILES + 1` / `BASE_TESTS + 4`. `PREV_FILES` and `PREV_TESTS` are the tree **as this plan left
it**, which is `BASE_FILES + 0` and `BASE_TESTS − 1`: `host-surface.spec.ts` arrived (+1 file, +4
tests), `lua-host.spec.ts` gained one (+1 test), and `lua-entries.spec.ts` left for the sweep (−1
file, −6 tests). Plans 09-02 onward assert against `PREV_*`, not `BASE_*`.

Provenance, not asserted:

- `BASE_CHECK` — **545 files, 0 errors, 0 warnings** on the clean tree; **546 / 0 / 0** as this plan
  left it, the one new file being `host-surface.spec.ts`. Read with
  `npm run check 2>&1 | grep -Ei "error|warning"`, which printed the count line and nothing else on
  both runs.
- `npm run build` — **exit 0, 12 s wall**, at `34d0fd6`. Recorded so 09-10 can report the cost of
  twenty more OG images and twenty more prerendered pages as a before and an after taken the same way
  on the same machine.
- `npm run lint` — exit 0, 31 s wall. `npm run check` — 17 s wall.

### Reconciliation against `07-13-SUMMARY.md`

Phase 7 closed on a clean tree and **nothing had landed since**. Every number matched on the first
reading; there was no discrepancy to trace to a commit.

| Name | 07-13 recorded | 09-01 observed | |
|---|---|---|---|
| quick files | 73 (`BASE_FILES` 69 + 4) | **73** | matches |
| quick tests | 776 passed + 1 todo | **776 passed + 1 todo** | matches |
| sweep | `3 13` | **`3 13`** | matches |
| e2e at `--workers 3` | 89 = 78 chromium + 11 webkit-phone | **89** | matches |
| `svelte-check` | 545 / 0 / 0 | **545 / 0 / 0** | matches |
| `npm run build` | 12 s | **12 s** | matches |

Note on `BASE_E2E`. Phase 7's `BASE_E2E` was **77**, frozen by 07-01 on the tree Phase 6 closed, and
its `PREV_E2E` closed at **89**. This phase re-freezes `BASE_E2E` at **89**, because that is the clean
tree Phase 9 starts on. The two numbers are different names for different phases' starting points, not
a contradiction.

### The helper works in both directions

```
cat base-quick.txt | node scripts/check-counts.mjs 73 776
  check-counts: observed 73 files, 776 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts                                          exit 0

cat base-quick.txt | node scripts/check-counts.mjs 73 1
  check-counts: observed 73 files, 776 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: tests: observed 776, expected 1                                      exit 1
```

The failing line names both numbers, as the acceptance criterion required.

### The ten per-file counts

Each file run alone under `--project server`, on the clean tree. **Every one equals the plan's
expectation.**

| File | Tests |
|---|---|
| `src/lib/catalog/catalog.spec.ts` | 10 |
| `src/lib/catalog/frames.spec.ts` | 5 |
| `src/lib/catalog/front-door.spec.ts` | 8 |
| `src/lib/catalog/listing.spec.ts` | 5 |
| `src/lib/catalog/audition.spec.ts` | 4 |
| `src/lib/catalog/lua-entries.spec.ts` | 6 |
| `src/lib/sim/lua-smoke.spec.ts` | 3 |
| `src/lib/sim/lua-host.spec.ts` | 8 |
| `src/lib/browse/filter.spec.ts` | 6 |
| `src/lib/browse/sort.spec.ts` | 6 |

### The sweep arithmetic, per entry

`combos = sum(knob.values.length) + 2`, over every entry with `source.kind === "lua"`. Printed by a
one-off script written into the scratchpad, run from the repository root and **deleted afterwards**;
nothing was added to `src/` or `scripts/`.

| Entry | Knobs | Σ values | Combinations |
|---|---|---|---|
| `euclid` | 6 | 45 | **47** |
| `chorus` | 6 | 44 | **46** |
| `arc` | 5 | 34 | **36** |
| `ghost` | 5 | 35 | **37** |
| `lattice` | 6 | 41 | **43** |
| `morph` | 5 | 34 | **36** |
| `sonar` | 5 | 36 | **38** |
| **Total** | | | **283** over 7 entries |

283, exactly as D-08 claimed. Each combination is measured on **both** events, which is the 566
measured events the sweep's own assertion counts.

---

## The host surface, as a list

`src/lib/sim/lua-host.ts` now exports the two arrays verbatim below, and `registerGlobals()` builds a
`Record<(typeof HOST_GLOBALS)[number], HostBinding>` and loops `for (const name of HOST_GLOBALS)
g.set(name, bindings[name])`. TypeScript fails the build on a listed name with no binding **and** on a
binding with no listed name, so there is no third place the two can drift apart in.

```ts
export const HOST_GLOBALS = [
  "glag", "glc", "glp", "glf", "gls", "glt", "glpfs", "glim",
  "gtt", "grxm", "txma", "tyma", "gmms", "gmbs", "gks",
] as const;

export const HOST_SELF_METHODS = [
  "gms", "grxm", "txma", "tyma",
  "touch_pop", "tid", "tev", "txv", "tyv",
] as const;
```

**The two asymmetries, restated because every entry plan in this phase writes Lua against them.**

- **`gms` is method-only.** It is absent from `HOST_GLOBALS` on purpose and bridged under the private
  name `__hangar_gms`, so a bare `gms(...)` still raises. Write `self:gms(ch, cmd, p1, p2, mode)`, and
  note the channel is **zero-based and first**.
- **`gmms`, `gmbs` and `gks` are callable bare.** They are in `HOST_GLOBALS` because tpad's compiled
  Setup opens with a bare `gmbs(3,0)` and would otherwise raise before writing a single LED. They are
  recorded and inert — HANGAR has no host to send a mouse move or a keystroke to.
- `grxm`, `txma` and `tyma` are in **both** lists. The recipe book calls `grxm(0,2)` bare while calling
  `self:txma(1023)` with a colon; both spellings are real and both work.
- The three `__hangar_*` bridges (`__hangar_gms`, `__hangar_tpop`, `__hangar_tfield`) stay outside both
  lists, with the reason written at the binding. They are not part of the surface an entry may call.

`src/lib/sim/lua-host.spec.ts` went **8 → 9**. The added test asserts the arrays are the surface the
VM has, in both directions: the callability half runs inside the VM as a Setup built from
`HOST_GLOBALS` that calls `error()` on any name that is not a function (nothing public on `LuaHost`
evaluates a string, so a host that constructs at all has proved it); the coverage half filters
`globalKeys()` by `^(g[a-z]{1,4}|t[xy]m[ai])$` and requires every Grid-shaped name in `_G` to be in
the list. The eight shipped tests are unedited — the diff on that file is an import widening and an
addition.

---

## The classifier

`src/lib/catalog/host-surface.spec.ts`, **4 tests, a fixed count** (`grep -c "  it(" ` prints `4`).
It reuses the vendored scanner's shape — an identifier immediately followed by `(`, scanning onward
from the end of the identifier so nested calls are seen — and records the character **before** the
identifier, which `scanCalls` throws away and which is the whole discrimination.

**The three prefix rules, verbatim:**

```
prefix ":"  -> a method call. Must be in HOST_SELF_METHODS.
prefix "."  -> a field call. Must be math.<one of atan sqrt abs max min floor tointeger>.
otherwise   -> a bare call. Must be in HOST_GLOBALS, or a Lua base name (see below),
               or a local declared in the SAME event text.
```

**The Lua base allow-list, verbatim, with its reasons:**

| Name | Why it is on the list |
|---|---|
| `type` | branching on nil versus number, which every touch handler does |
| `tostring` | building a message for an `error()` a gate will read |
| `tonumber` | parsing a knob value that arrived as text |
| `ipairs` | walking an array part in order |
| `pairs` | walking a per-contact table — SONAR and LATTICE both do |
| `select` | reading a variadic argument count without a table |

**`print` is not on it, and that is deliberate.** Firmware's `print` costs the 256-byte protocol
buffer and the host does not register it at all.

**Locals** are collected from the same event text with the two patterns the plan specified: `local
<ident>` including comma lists (`local a,b`) and `local function <ident>`, and `function(<params>)`
parameter names — a shipped entry writes `self.touch_cb=function(s,i,e,x,y)` and then calls
`s:gms(...)`, so a parameter is as real a binding as a `local`.

**One addition the plan did not name, and it was necessary.** Lua's 22 reserved words are filtered out
before classification. `self.touch_cb=function(s,i,e,x,y)` puts `function` immediately before a `(`,
and without the filter it would read as a bare call to something named `function` and every entry
would be red. A reserved word followed by `(` is a definition, a parenthesised expression or a syntax
error — never a call — so the filter cannot hide anything. Recorded as a deviation below.

### The four tests

1. **The list is the registration.** Both arrays asserted non-empty first, then against a booted
   `LuaHost`'s own `globalKeys()` in both directions, plus every `HOST_SELF_METHODS` member resolving
   through the classifier as `self:<name>(0)`. One VM for the file, over `--[[@cb]]gtt(0,100)`.
2. **Every hand-authored entry calls only registered names.** Six texts per entry — defaults, all
   knobs longest, all knobs shortest, each on both events — every call site classified, the entry, the
   event, the call and its zero-based index named in the failure message. Non-vacuity: at least two
   call sites per entry per **non-empty** event (MORPH stores the empty string as its Timer and is
   exempted by that clause).
3. **The gap, from both sides.** Below.
4. **The asymmetries and the corpus.** `gms` absent from `HOST_GLOBALS` and present in
   `HOST_SELF_METHODS`; `gmms`/`gmbs`/`gks` present; a bare `gms(0,144,60,100,0)` refused and
   `self:gms(...)` accepted; at least six entries scanned and at least forty call sites found.

### The two-sided `gln` result

The scratch body is `"--[[@cb]]for a=0,80 do gln(a,2,0,0,0)end"`.

| Side | What it returned |
|---|---|
| `findTraps(body)` | **`[]` — zero hits**, and therefore no hit whose `text` names `gln`. The vendored scanner lists `gln` among its ten `LED_CALLS` (`_pad.ts:3513-3524`), so it treats the call as legitimate: no bare division, layer `2` is a valid layer, and `gln` adds `2` to `litLayers`, so there is not even an unlit-layer hit |
| the classifier | **refused, naming exactly `["gln"]`** — a bare call the host does not register |
| `HOST_GLOBALS` | contains none of `gln`, `gld`, `glx`; `grep -c '"gln"\|"gld"\|"glx"' src/lib/sim/lua-host.ts` prints **0** |

Written into the file in those terms: the compiler's scanner and the browser's host disagree about
what the surface is, every published ZONA recipe is written against the half the host does not have,
and **"the compiler accepted it" is not "it will render"**.

### The seven shipped entries passed the gate unedited

`npx vitest run --project server src/lib/catalog/host-surface.spec.ts` reported **4 passed** on the
first run, before any classifier iteration. **No entry was edited and no finding was raised.**
`git diff --stat HEAD -- src/lib/catalog/entries/` printed nothing at the end of task 2. (Task 3 does
touch those seven files, but only to move a comment's path — no Lua changed.)

The corpus is not hypothetical: the scan resolves `glp`, `glc`, `glag`, `gtt`, `glt`, `glpfs`, `glim`,
`glf` as registered globals, `self:gms` as a registered method, `math.atan`/`abs`/`sqrt`/`max` as
version-stable field calls, `pairs` as a base name, and the per-event locals of every `for`, `local`
and callback parameter.

---

## The sweep move

`git mv src/lib/catalog/lua-entries.spec.ts src/lib/catalog/lua-entries.sweep.spec.ts`.
`git log --follow --oneline -- src/lib/catalog/lua-entries.sweep.spec.ts` shows `be7c004` above
`5e230ec test(08-04): the CONT-02 gate for hand-authored Lua entries` — the history followed the file.
`git diff -M` on the rename reports **92 % similarity, +23 lines and no deletions**: the header
comment only.

**`vite.config.ts` was not edited** — `git diff --quiet -- vite.config.ts` exits 0. The `server`
project already excludes `src/**/*.sweep.spec.ts` and the `sweep` project already includes it, by the
file-name rule quoted in the config itself and restated in `config-shape.spec.ts`. That is why D-08 is
a rename.

**Nineteen references followed it**, exactly as enumerated: twelve source-comment lines (the seven
entry files with `sonar.ts` twice, `wire-pin.spec.ts` twice, `lua-smoke.spec.ts`, `tune/model.ts`) and
seven document lines across two documents. `grep -rn "lua-entries.spec" src docs e2e scripts` printed
19 before and **nothing** after.

`docs/PIN-POLICY.md`: the sweep now reads **4 files / 19 tests** in all three places it is quoted
(items 1, 6 and the paragraph after item 6, which now decomposes 19 as the 9-test invariant sweep, the
two Phase 5 sweeps at 4, and this file's 6), and item 4's command is
`npx vitest run --project sweep src/lib/catalog/lua-entries.sweep.spec.ts` still reporting **6
passed**. Item 4's reasoning is verbatim — canonical form is a property of a specific minifier version
and a bump can turn a stored string non-canonical without changing a character of HANGAR's source.

`docs/TESTING.md`: the `lua-entries` row left the catalog per-file table and became a sentence naming
the sweep project and its measured 1.91 s alone, beside a sentence introducing `host-surface.spec.ts`
at 4 tests; the timeout note now records that the escape hatch **has been taken**, by plan 09-01, with
"nothing it covers was trimmed — six tests before, six after, the same 283 combinations"; the "budget
gate valid only at the current protocol pin" paragraph and the standing-gate list carry the new path.
Only the two How-to-run rows this plan moved were re-measured; they carry `re-measured 2026-09-07` in
the cell and a paragraph says plainly that the rest is Phase 7's and belongs to 09-10.

### The four wall times

Same machine, same session, one command at a time.

| Run | Before the move | After the move |
|---|---|---|
| `npm run test:quick` | **31 s wall** (28.95 s runner), 74 files / 781 tests | **30 s wall** (28.27 s runner), 73 files / 775 tests |
| `npm run test:sweep` | **110 s wall** (108.64 s runner), `3 13` | **87 s wall** (85.78 s runner), `4 19` |

**Read honestly, the quick run did not get faster and the sweep got faster.** That is not what a naive
reading of D-08 predicts, and it is worth writing down:

- The quick run is **parallel**, so its wall time is bounded by the slowest worker rather than by the
  sum of the files. `lua-entries` at 2.18 s was never the critical path, so removing it bought about a
  second. **What D-08 actually buys is headroom against a timeout under memory pressure** — the file
  that timed out three times at 0.8 to 1.7 GB free no longer competes with 72 other files for a worker
  pool — and that is exactly what the decision claimed. Wall time was never the argument.
- The sweep went **110 s → 87 s** despite gaining a file, and it is reproducible (86 s and 88 s on two
  consecutive runs). Four files distribute across the worker pool better than three did around
  `pad-invariants.test.js`, which dominates the project at roughly 38 s. The added file costs 1.91 s
  measured alone and it overlaps with the giant instead of extending it.
- The first post-move quick run read 42 s wall with a 16.4 s transform against a 10 s norm — a cold
  Vite cache after the rename. The 30 s figure above is the warm re-run, which is the fair comparison.

---

## Both negative checks

| Check | Observed |
|---|---|
| **Task 2** — append ` gld(0,2,0,0,0)` inside the `for` loop of `euclid.ts`'s Setup template | **Red on test 2**, exit **1**: `AssertionError: euclid/setup at defaults: "gld" at index 83 is a bare call the HANGAR Lua host does not register, so it raises "attempt to call a nil value" the moment this line is reached: expected false to be true`. `Test Files 1 failed (1)`, `Tests 1 failed \| 3 passed (4)`. Restored with `git checkout -- src/lib/catalog/entries/euclid.ts`; `git diff --quiet` exits **0** and the spec exits **0** |
| **Task 3** — run the renamed file under `--project server` | **Collects nothing**, exit **0** (`passWithNoTests`): `No test files found, exiting with code 0`, `filter: src/lib/catalog/lua-entries.sweep.spec.ts`, `projects: server`, and the printed `exclude:` list ends with `src/**/*.sweep.spec.ts` — the exclusion working, named in the runner's own output. Under `--project sweep` the same file reports **6 passed** in 1.91 s |

`host-surface.spec.ts` was `git add`ed before anything was perturbed, per the plan's warning: on an
untracked path `git checkout --` fails outright and `git diff --quiet` passes vacuously.

---

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 2 — missing critical functionality] The classifier had to filter Lua's reserved words**

- **Found during:** Task 2, writing the classifier against the shipped corpus.
- **Issue:** The plan's three prefix rules classify `self.touch_cb=function(s,i,e,x,y)`'s `function`
  as a bare call, because the identifier `function` is immediately followed by `(` and its preceding
  character is `=`. Every one of the seven shipped entries declares a touch callback that way, so the
  gate as literally specified would have been red on all seven and would have "found" a call that does
  not exist.
- **Fix:** A 22-member `LUA_KEYWORDS` set filtered in `scanCallSites` before any classification, with
  the reason in the doc comment. A reserved word followed by `(` is a function definition, a
  parenthesised expression or a syntax error — never a call — so the filter cannot mask a real name.
- **Files modified:** `src/lib/catalog/host-surface.spec.ts`.
- **Commit:** `71d66c0`.

**2. [Rule 2 — missing critical functionality] `docs/PIN-POLICY.md` carried the sweep's counts in
three places, not two**

- **Found during:** Task 3.
- **Issue:** The plan named item 1 and item 4. A third statement of `3 files / 13 tests` sits in the
  paragraph after item 6, decomposing 13 as "the 9-test invariant sweep plus the two Phase 5 sweeps".
  Leaving it would have made the document contradict itself two paragraphs apart.
- **Fix:** All three moved to `4 19`, and the decomposition now reads 9 + 4 + 6 with the new file
  named and plan 09-01 credited.
- **Files modified:** `docs/PIN-POLICY.md`.
- **Commit:** `be7c004`.

**3. [Rule 1 — bug] The timeout note in `docs/TESTING.md` would have become actively misleading**

- **Found during:** Task 3.
- **Issue:** The shipped sentence read "If a quick run reads 775 passed and one timeout in that file,
  run the file alone before reading it as a regression." After this plan, **775 passed is the correct
  total** and there is no such file in the quick run at all. A reader hitting a real regression would
  have been told it was the known timeout.
- **Fix:** The paragraph was replaced rather than patched: it now records the timeout as history, says
  the escape hatch was taken and by which plan, and gives the direct `--project sweep` command.
- **Files modified:** `docs/TESTING.md`.
- **Commit:** `be7c004`.

**4. [Rule 3 — blocking] The one-off sweep-count script needed a bundler to resolve `.ts` imports**

- **Found during:** Task 1.
- **Issue:** `src/lib/catalog/index.ts` imports extensionlessly, which Node's ESM resolver rejects, and
  neither `vite-node` nor `tsx` is installed. Node's own type stripping does not fix the specifier.
- **Fix:** `npx esbuild --bundle --platform=node --format=esm` into the scratchpad, then `node` on the
  bundle. Both the source and the bundle were deleted after the table was recorded. **Nothing was
  written to `src/` or `scripts/` and nothing was committed.**
- **Files modified:** none.

### Not a deviation, recorded because a later reader will wonder

The plan's expected delta table said `test:quick` would read `BASE_FILES + 0` files and
`BASE_TESTS − 1` tests. It read exactly that: **73 / 775**. The intermediate tree after task 2 read
**74 / 781** (`BASE_FILES + 1` / `BASE_TESTS + 5`), which is the number 09-10's phase-total arithmetic
is built from, and it is recorded here so the chain `BASE_TESTS → −1 → +5 → +0 × 7 = BASE_TESTS + 4`
can be checked from both ends.

---

## Verification

| Gate | Result |
|---|---|
| `npx vitest run --project server src/lib/catalog/host-surface.spec.ts \| check-counts 1 4` | **exit 0** |
| `npx vitest run --project server src/lib/sim/lua-host.spec.ts \| check-counts 1 9` | **exit 0** |
| `npx vitest run --project sweep src/lib/catalog/lua-entries.sweep.spec.ts \| check-counts 1 6` | **exit 0** |
| `npm run test:quick \| check-counts 73 775` | **exit 0** (`BASE_FILES + 0`, `BASE_TESTS − 1`) |
| `npm run test:sweep \| check-counts 4 19` | **exit 0** |
| `npm run check 2>&1 \| grep -Ei "error\|warning"` | `546 FILES 0 ERRORS 0 WARNINGS` and nothing else |
| `npm run lint` | **exit 0** |
| `git diff --stat HEAD -- src/vendor/` | prints nothing |
| `npx vitest run --project server src/lib/fidelity/vendored-diff.spec.ts` | **14 passed** |
| `npx vitest run --project server src/lib/sim/lua-smoke.spec.ts` | **3 passed** — the host refactor changed no behaviour |
| `grep -rn "lua-entries.spec" src docs e2e scripts` | prints nothing |
| `git diff --quiet -- vite.config.ts` | **exit 0** |
| `grep -c "  it(" src/lib/catalog/host-surface.spec.ts` | **4** |
| `grep -c '"gln"\|"gld"\|"glx"' src/lib/sim/lua-host.ts` | **0** |
| Both negative checks | observed red / observed empty, and reverted byte-identical |

No device was connected to, looked for or written to. Nothing under `src/vendor/` was edited. No
sibling repository was read.

## Commits

| Commit | What |
|---|---|
| — | Task 1 measured and wrote nothing; `git status --porcelain` was empty at its end |
| `71d66c0` | `feat(09-01): the host surface becomes a list, and a classifier refuses everything outside it` |
| `be7c004` | `chore(09-01): the 283-combination knob sweep leaves the quick run` |

## Self-Check: PASSED

Every file this SUMMARY claims to have created or modified is on disk, the renamed file's old path is
gone, and both commit hashes resolve in `git log`. Every count quoted above was read from a runner's
own summary line in this session, never carried from a document.
