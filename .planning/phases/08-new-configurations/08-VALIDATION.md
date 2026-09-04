---
phase: 8
slug: new-configurations
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-04
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is the Nyquist contract. `docs/TESTING.md` (updated by plan 08-07) is the developer-facing
> companion and deliberately does not duplicate the map below. There is no `docs/VALIDATION.md`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 (node env, `expect.requireAssertions`, `passWithNoTests`), two projects per D-10: `server` (quick) and `sweep` (the 4,860-state invariant sweep) + @playwright/test 1.62.1 over `wrangler dev` on `./build` |
| **Config file** | `vite.config.ts` `test.projects` — **no change expected this phase** except a possible `optimizeDeps.exclude` entry for the Lua VM in task 8-02-01; `playwright.config.ts` unchanged |
| **Quick run command** | `npm run test:quick` (= `vitest run --project server`) |
| **Sweep command** | `npm run test:sweep` (= `vitest run --project sweep`) |
| **Wave run command** | `npm run check && npm run lint && npm run test:quick && npm run test:sweep` |
| **Full suite command** | the wave run plus `npm run build` and `npm run test:e2e` |
| **Estimated runtime** | quick ~8 s before this phase, higher after (see "The new cost" below); sweep ~40 s; e2e ~21 s including the build and the wrangler cold start |

**Baseline measured on this machine on 2026-09-04, immediately before planning:**
`npm run test:quick` = 26 files / 453 passed | 1 todo (454), 8.00 s wall.
`npm run test:sweep` = 1 file / 9 tests. `npm run test:e2e` = 10 tests.

**Those three numbers are recorded here as provenance and are deliberately NOT asserted anywhere.**
Phase 4 depends only on plan 08-01 and will land specs in this tree while Phase 8 runs, so the
baseline a Phase 8 plan actually observes will be larger. Task 8-01-01 re-measures it at execution
time and writes it into `08-01-SUMMARY.md`; every plan after that reads the previous plan's SUMMARY.
See "Expected deltas after each plan" below.

### Facts the map depends on

All measured in this repository on 2026-09-04, against
`@intechstudio/grid-protocol@1.20260825.1135` and the vendored compiler at `a0fb69d5`, by the
planner. They are reproductions, not estimates.

- **Every candidate's printed length reproduces exactly.** The eighteen Lua strings in
  `08-RESEARCH.md` measure the lengths the document claims, all `checkSyntax` true.
- **Seventeen of the eighteen are canonical** (`compressScript(x) === x`). The exception is **SONAR's
  Timer**: `if s.v[n] then` minifies to `if s.v[n]then`, 280 raw to 279 compressed. Plan 08-06 carries
  the canonical text; the gate asserts the fixed point, so the research text as printed would go red.
- **`compressScript("") === ""` and `checkSyntax("") === true`**, so MORPH's empty Timer needs **no
  special case** in the canonical, budget or syntax tests.
- **Token substitution round-trips byte-exactly.** For all seven shipped configurations, the template
  rendered at its default knob indices is byte-identical to the canonical text — with one deliberate
  exception, GHOST's Timer at 333 rather than 331, because `@CCX+1` replaces the literal `17` so one
  knob moves both CC numbers.
- **The whole knob cross-product is nowhere near the limit.** All-longest corners: EUCLID 706/221,
  CHORUS 733/174, ARC 382/253, GHOST 308/337, LATTICE 618/172, MORPH 510/0, SONAR 433/282. The
  budget is 908 per event.
- **`self:gms(ch, cmd, p1, p2, mode)`** — the first argument is a zero-based channel
  (`zona-docs/docs/ZONA_RECIPES.md:1058`). Every `@CH` knob depends on this.
- **The `--[[@cb]]` marker contains an `@`.** A "no `@` remains after substitution" check is
  permanently red; the check is on `@` followed by an upper-case letter.
- **`screenToHw` moves exactly 40 of 81 cells** — the five even rows mirror eight cells each, the
  centre of each staying put. That literal is what makes the identity-stub regression detectable.
- **`wasmoon@1.16.0` is MIT, 458,718 bytes unpacked, with one runtime dependency
  `@types/emscripten@1.39.10` (MIT).** Both are already inside `scripts/gen-licenses.mjs`'s allowlist,
  so `npm run licenses` must exit 0 with no allowlist edit.
- **`EVENT_BUDGET = 908` is exported from the vendored `_pad.ts`.** No spec restates 908.
- **Three configurations rest black, and that is a design, not a fault.** A blank layer's stops are
  all zero and `glc`'s sixth argument forces the minimum stop black, so a card whose only light is a
  touch response renders an all-zero frame until a finger arrives. `tpad` writes no LEDs at all;
  **GHOST** paints nothing until it is drawn on; **MORPH** has no Timer and its only animation is a
  per-touch decay. Every entry therefore declares `restsBlack`, and `frames.spec.ts` test 5 asserts
  the declaration **equals** what the fixture shows, in both directions - a card that went dark by
  accident is red because it did not declare it, and a card that declared it and then lit up is red
  too. The smoke gate asks the different, weaker question that is actually about breakage: does the
  card light **at some point during a real gesture**. `golden-frames.spec.ts`'s hard-coded `tpad`
  exemption was fine for a fixed nine and does not survive a growing catalog.

### The design decision that shapes every count

**Every catalog gate loops over the entries internally and never uses `it.each`.** A test names the
offending entry in its assertion message rather than being one test per entry. The consequence is
load-bearing for this map: **adding a configuration changes no test count**, so plans 08-05 and 08-06
assert exactly the totals plan 08-04 left behind, and a green run means the same thing before and
after six configurations were added. What grows instead is `frames.json`'s entry count and the entry
file count, and both are asserted with explicit `node -e` checks.

### The Phase 4 seam

Phase 4 depends only on plan **08-01**, so the two phases interleave in one tree. Two consequences
are written into the plans rather than left to be discovered:

- **Counts.** No Phase 8 assertion may be an absolute suite total. See the deltas table below.
- **The front-door row.** Phase 4's `src/lib/catalog/front-door.ts` declares a curated row plus an
  `EXCLUDED_FROM_ROW` list, and its spec asserts the two together account for **every** `CATALOG`
  id. A new catalog entry that is in neither list therefore reddens Phase 4's suite, not Phase 8's.
  Plans 08-04, 08-05 and 08-06 each carry a conditional step: **if that file exists, add the new
  entry to `EXCLUDED_FROM_ROW` with a one-line `why`.** Excluding rather than inserting is the
  conservative default - the row's order, length and copy are Phase 4's design decisions and this
  phase must not make them by accident. If Phase 4's spec still asserts the exclusion count as a
  literal, the step may update that literal and only that literal, and must name the old and new
  numbers in the SUMMARY.

### Why the waves are serial

Plans 08-01 and 08-02 share no file and could run concurrently. They do not, because every
acceptance criterion in this repository asserts an **exact cumulative test count**, and two plans
adding specs in the same wave would both compute the wrong total. Serial waves cost wall time and buy
a gate that cannot be green for the wrong reason.

### Expected deltas after each plan

**There is no absolute total anywhere in this phase.** Phase 4 depends only on plan 08-01 and lands
in this same tree, so a Phase 8 plan that asserted `Tests 490 passed` would go red the moment Phase 4
committed a spec - for a reason that has nothing to do with Phase 8. Task 8-01-01 therefore captures
the observed `test:quick`, `test:sweep` and `test:e2e` summary lines into `08-01-SUMMARY.md` as the
**Phase 8 baseline**, every later plan reads `BASE_FILES` / `BASE_TESTS` / `BASE_E2E` from the
previous plan's SUMMARY, and every assertion is baseline plus the delta below, evaluated by
`scripts/check-counts.mjs` (created in task 8-01-01) rather than by an extended regular expression.

| Plan | `test:quick` files | `test:quick` passing tests | `test:sweep` | `test:e2e` |
|---|---|---|---|---|
| 08-01 | +2 | +15 | 1 file / 9 | unchanged |
| 08-02 | +1 | +8 | 1 file / 9 | unchanged |
| 08-03 | +1 | +5 | 1 file / 9 | unchanged |
| 08-04 | +2 | +9 | 1 file / 9 | unchanged |
| 08-05 | 0 | 0 | 1 file / 9 | unchanged |
| 08-06 | 0 | 0 | 1 file / 9 | unchanged |
| 08-07 | +1 | +3 | 1 file / 9 | +2 |
| 08-08 | +1 | +4 | 1 file / 9 | unchanged |
| **Phase total** | **+8** | **+44** | unchanged | **+2** |

The sweep is the one absolute that stays absolute: it is a single file with nine tests and no other
phase adds to it, so `node scripts/check-counts.mjs 1 9` is safe.

New spec files and their fixed test counts - these **are** asserted absolutely, per file, because a
per-file count is unaffected by anything another phase does: `catalog.spec.ts` 10, `frames.spec.ts`
5, `lua-host.spec.ts` 8, `lua-parity.spec.ts` 5, `lua-entries.spec.ts` 6, `lua-smoke.spec.ts` 3,
`lazy.spec.ts` 3, `audition.spec.ts` 4, `e2e/catalog.e2e.ts` 2. They sum to the deltas above.

### The new cost

Three specs run a real Lua VM and are the first in the repository to do so. Each plan that adds one
records its measured wall duration in its SUMMARY, and each carries a threshold above which the
answer is **not** to trim:

| Spec | Threshold set by its plan | If exceeded |
|---|---|---|
| `lua-host.spec.ts` | none — recorded only | — |
| `lua-parity.spec.ts` | 20 s | say so in the SUMMARY and flag it for `docs/TESTING.md`; the D-10 precedent is a separate Vitest project, never a trimmed comparison |
| `lua-entries.spec.ts` | 10 s with all seven entries | same |
| `frames.spec.ts` | **15 s with all sixteen entries** | same. This one is easy to under-estimate: it builds a fresh engine per sample and runs to tick 1009, so it is 16 entries x 5 ticks x up to 1009 ticks of engine time, and seven of those entries run a Lua VM. It is also the spec every authoring plan regenerates, so its cost is paid repeatedly |

The single largest lever on all four is that the Timer body is **compiled once at `LuaHost.create`
and invoked as a cached Lua function**, never `doString`-ed per tick (required in task 8-02-02). At
100 Hz across 1009 ticks and sixteen entries, a per-tick parse would put the Lua parser at the top of
the profile and none of these thresholds would be reachable.

Plan 08-07 writes the measured figures into `docs/TESTING.md` and states the recommendation if any
threshold was crossed.

---

## Requirement ownership

`.planning/ROADMAP.md` maps **CONT-02** to Phase 8 alone, and that is correct: this phase is where
the requirement is satisfied and closed. Three further requirements are **touched** here without
being owned here, and the plans' `requirements` frontmatter says so:

| Requirement | Owner | What Phase 8 contributes |
|---|---|---|
| **PREV-02** | Phase 4 | The Lua host and its nine-preset parity gate make "the simulator consumes the exact compiler output" literally true for hand-authored entries; Phase 4 still owns the visible claim |
| **CONT-03** | Phase 4 | `CatalogEntry` carries name, description, tags, Featured and defaults, and `catalog.spec.ts` gates them for every entry, ported and new |
| **TUNE-01** | Phase 5 | Every hand-authored entry ships 3 to 6 knobs over the vendored `KnobKind` vocabulary; Phase 5 owns the widgets that render them |

This is a note for the orchestrator's traceability pass, not an instruction to edit
`.planning/REQUIREMENTS.md` or the roadmap's coverage table - no plan in this phase touches either.

---

## Sampling Rate

- **After every task commit:** `npm run test:quick` (plus `npm run lint` for tasks touching
  HANGAR-owned files)
- **After every plan wave:** `npm run check && npm run lint && npm run test:quick && npm run test:sweep`
- **Before `/gsd:verify-work`:** the full suite including `npm run build` and `npm run test:e2e`,
  green against the **production static build** — the FOUND-05 lesson that a WASM asset resolving in
  dev can fail in `build/` applies twice over now that there are two of them
- **Max feedback latency:** ~10 seconds (quick, before the VM specs land; re-measured in 08-07),
  50 seconds (wave)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 8-01-01 | 01 | 1 | CONT-03 | types + structural | `scripts/check-counts.mjs` exists and the Phase 8 baseline is recorded in the SUMMARY; `npm run check` reports `0 errors`; `npm run lint` exits 0; `test:quick` unchanged from that baseline | created here | ⬜ pending |
| 8-01-02 | 01 | 1 | CONT-03, CONT-02 | unit | `npx vitest run --project server src/lib/catalog/catalog.spec.ts` reports `10 passed` | created here | ⬜ pending |
| 8-01-03 | 01 | 1 | CONT-02 | fixture + unit | `... src/lib/catalog/frames.spec.ts` reports `5 passed`; `test:quick` is baseline +2 files / +15 tests; `frames.json` has 9 entries and every `restsBlack` declaration agrees with it | created here | ⬜ pending |
| 8-02-01 | 02 | 2 | PREV-02 | dependency + licence | `npm run licenses` exits 0 with no allowlist edit; `THIRD-PARTY.md` names the VM and `@types/emscripten`; `npm run build` exits 0; `protocol-pin.spec.ts` reports `5 passed` | created here | ⬜ pending |
| 8-02-02 | 02 | 2 | PREV-02 | source + structural | `npm run check` reports `0 errors`; all thirteen Grid stubs present; `vendored-diff.spec.ts` reports `14 passed` | created here | ⬜ pending |
| 8-02-03 | 02 | 2 | PREV-02 | unit | `... src/lib/sim/lua-host.spec.ts` reports `8 passed`; `test:quick` is 08-01's recorded total +1 file / +8 tests | created here | ⬜ pending |
| 8-03-01 | 03 | 3 | PREV-02 | types + structural | `npm run check` reports `0 errors` (the `SimEngine` conformance assertion is type-level only); dynamic import present, static absent | created here | ⬜ pending |
| 8-03-02 | 03 | 3 | **PREV-02 — the Wave 0 gate** | evidence | `... src/lib/fidelity/lua-parity.spec.ts` reports `5 passed`; 2,187 layer records compared; `test:quick` is 08-02's recorded total +1 file / +5 tests | created here | ⬜ pending |
| 8-04-01 | 04 | 4 | CONT-02, CONT-03, TUNE-01 | entry + unit | `... src/lib/catalog/catalog.spec.ts` reports `10 passed`; `renderLua` round-trips to 702 / 218. **No whole-suite run in this task** - `frames.spec.ts` is red until 8-04-03 | created here | ⬜ pending |
| 8-04-02 | 04 | 4 | CONT-02 (crit. 2 and 3) | unit | `... src/lib/catalog/lua-entries.spec.ts` reports `6 passed` | created here | ⬜ pending |
| 8-04-03 | 04 | 4 | CONT-02 (crit. 3) | unit + fixture | `... src/lib/sim/lua-smoke.spec.ts` reports `3 passed`; `frames.spec.ts` reports `5 passed`; `frames.json` has 10 entries; `test:quick` is 08-03's recorded total +2 files / +9 tests | created here | ⬜ pending |
| 8-05-01 | 05 | 5 | CONT-02, CONT-03, TUNE-01 | entry | `lua-entries.spec.ts` `6 passed`; `catalog.spec.ts` `10 passed`; no gate file modified | created here | ⬜ pending |
| 8-05-02 | 05 | 5 | CONT-02, CONT-03, TUNE-01 | entry | `lua-entries.spec.ts` `6 passed`; `lua-smoke.spec.ts` `3 passed`; 5 entry files | created here | ⬜ pending |
| 8-05-03 | 05 | 5 | CONT-02 | fixture | `frames.spec.ts` `5 passed`; `frames.json` has 13 entries; `test:quick` **unchanged** from 08-04's recorded total | exists | ⬜ pending |
| 8-06-01 | 06 | 6 | CONT-02, CONT-03, TUNE-01 | entry | `lua-entries.spec.ts` `6 passed`; both `@BASE` sites substituted | created here | ⬜ pending |
| 8-06-02 | 06 | 6 | CONT-02, CONT-03, TUNE-01 | entry | `lua-entries.spec.ts` `6 passed`; `lua-smoke.spec.ts` `3 passed`; 8 entry files; MORPH `timer: ""` | created here | ⬜ pending |
| 8-06-03 | 06 | 6 | **CONT-02 — the floor is cleared** | fixture | `frames.spec.ts` `5 passed`; `frames.json` has 16 entries; MORPH and GHOST are dark, static and not animating, matching their `restsBlack: true`; `test:quick` unchanged from 08-05's recorded total | exists | ⬜ pending |
| 8-07-01 | 07 | 7 | PREV-02 | build artefact | `npm run build` exits 0; `build/dev/catalog/index.html` exists | created here | ⬜ pending |
| 8-07-02 | 07 | 7 | **CONT-02 (D-14 bundle), PREV-02** | e2e + structural | `... src/lib/sim/lazy.spec.ts` reports `3 passed`; `test:e2e` is baseline +2; `test:quick` is 08-06's recorded total +1 file / +3 tests | created here | ⬜ pending |
| 8-07-03 | 07 | 7 | CONT-02 | doc shape | `npx prettier --check docs/TESTING.md docs/PIN-POLICY.md` exits 0; all eight new spec names present; `wasmoon` in `.planning/research/STACK.md` and in the regenerated `CLAUDE.md`; `docs/VALIDATION.md` does not exist | exists | ⬜ pending |
| 8-08-01 | 08 | 8 | CONT-02 (D-16) | doc | `npx prettier --check docs/HARDWARE-AUDITION.md` exits 0; all seven configurations named; `.tmp-audition/` gitignored | created here | ⬜ pending |
| 8-08-02 | 08 | 8 | CONT-02 (D-16) | doc shape + writer | `... src/lib/catalog/audition.spec.ts` reports `4 passed`; `AUDITION_DUMP=1` writes 7 setups and 6 timers; `test:quick` is 08-07's recorded total +1 file / +4 tests | created here | ⬜ pending |
| 8-08-03 | 08 | 8 | CONT-02 (D-16) | **human, hardware** | pre-checkpoint gate: full suite green at the totals this plan's SUMMARY records, sweep 1 file / 9 tests, e2e at its recorded total. The audition itself is the twelve-row checklist and is not automatable | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

`08-RESEARCH.md`'s "Wave 0 gaps" list, each mapped to a creating task. The phase's own Wave 0 gate —
the property that licenses any configuration being authored — is **task 8-03-02**.

- [ ] `npm install wasmoon@1.16.0 --save-exact` as a production dependency, plus the MIT entries in
      `THIRD-PARTY.md` and `licenses/` from `npm run licenses` → **8-02-01**
- [ ] `src/lib/sim/ready.ts` — a **separate** memoised lazy gate, not fused with `padReady()`
      → **8-02-02**
- [ ] `src/lib/sim/lua-host.ts` — the thirteen Grid stubs, the F2Ieq integer rule, the colour
      truncation, `screenToHw`-correct `glag`, the change-gated 10-deep touch FIFO, the `gtt`
      deadline that re-arms before the body → **8-02-02**
- [ ] `src/lib/sim/lua-pad-sim.ts` — the `SimEngine` wrapper over a blank fully-`owned:"user"`
      `PadSim`, plus `renderLua` → **8-03-01**
- [ ] `src/lib/sim/engine.ts` — the shared `SimEngine` interface and `createEngine`'s dynamic import
      → **8-03-01**
- [ ] `src/lib/fidelity/lua-parity.spec.ts` — the nine-preset cross-check, re-derived inside
      `src/lib/` and never imported from a scratchpad → **8-03-02**
- [ ] `src/lib/catalog/` skeleton — `types.ts`, `entries/ported.ts`, `index.ts` → **8-01-01 / 8-01-02**
- [ ] `src/lib/catalog/catalog.spec.ts` and `frames.json` + `frames.spec.ts` → **8-01-02 / 8-01-03**
- [ ] The measuring harness promoted into the repository as thin helpers over `src/lib/pad/index.ts`
      → **8-04-02** (`lua-entries.spec.ts` calls `measureLua` and `GridScript.compressScript` behind
      `padReady()`; no new module is needed)
- [ ] `scripts/check-counts.mjs` and the Phase 8 baseline recorded in `08-01-SUMMARY.md`, so no plan
      carries an absolute suite total → **8-01-01**
- [ ] The `restsBlack` field on `CatalogEntry`, its per-entry declarations, and the two-directional
      assertion against `frames.json` → **8-01-01 / 8-01-02 / 8-01-03**
- [ ] The conditional `front-door.ts` exclusion step, taken only if Phase 4 has landed that file
      → **8-04-01 / 8-05-01 / 8-05-02 / 8-06-01 / 8-06-02**
- [ ] `.tmp-audition/` in `.gitignore`, beside `.tmp-e2e/` → **8-08-01**
- [ ] Possible `optimizeDeps.exclude` entry for the VM in `vite.config.ts`, **only if the build needs
      it** → **8-02-01**, recorded either way

---

## What the fixtures and gates prove

| Artefact | Status | Proves |
|---|---|---|
| `src/lib/fidelity/lua-parity.spec.ts` | **evidence** | The compiler's own emitted Lua, run in a real Lua 5.4 VM, reproduces the vendored simulator's 2,187 layer records and its frames at five ticks for all nine presets — and those frames also equal Phase 3's recorded hashes. Three independent producers agreeing, not one transcription checked twice. |
| `src/lib/catalog/frames.json` | **regression tripwire, not an oracle** | Its hashes come from the engine itself, so it proves only that a change altered a named configuration's appearance. Firmware fidelity is still pinned by `firmware-oracle.spec.ts`, which the Lua route inherits for free because it drives the same engine. |
| `src/lib/catalog/lua-entries.spec.ts` | **budget gate, valid only at the current pin** | Canonical form and character cost are properties of `@intechstudio/grid-protocol@1.20260825.1135`'s minifier. `docs/PIN-POLICY.md` gains the bump item in 8-07-03. |
| `src/lib/sim/lua-smoke.spec.ts` | **execution proof** | Every configuration runs its real Lua through a real gesture without raising, and cannot carry the keeper-on-a-decaying-trail bug the research shipped in three drafts before catching it. |
| `e2e/catalog.e2e.ts` | **production-build proof** | A cold catalog load against `build/` served by the real Worker fetches no WebAssembly at all, and the VM arrives only on an explicit action, as `application/wasm`. |
| `src/lib/sim/lazy.spec.ts` | **fast guard** | The same property as above, in 8 seconds instead of 40. Its worth is established by the paired negative check in 8-07-02: the perturbation that reddens it also reddens the e2e. |
| `docs/HARDWARE-AUDITION.md` + `audition.spec.ts` | **checklist that cannot rot** | A lost row, a renamed configuration, a quietly shipped MIRROR or a dropped install-order rule each turn a named test red. |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Perceived polyrhythm, LED diffusion, brightness after the /512 with no gamma correction, timer drift under load, whether a real finger is ever motionless enough to trip a 2 s watchdog, and whether anything strobes over fifteen minutes | CONT-02 (D-16) | Physical perception and physical hardware. The simulator is firmware-faithful about state, not about photons | `docs/HARDWARE-AUDITION.md`, twelve rows, run by the user on a real ZONA through BOTOR's shelf. Task 8-08-03 |
| Whether host MIDI over USB reaches `midirx_cb` on a ZONA with `grxm(0,2)`, and which `instr` it carries | — (blocks a future MIRROR entry only) | Firmware shows the path; nothing shows the traffic. Not simulable at any fidelity | Row 11 of the audition, explicitly optional. A yes unblocks MIRROR as a one-file follow-on; a no keeps it unshipped |
| Every RGB triple in the seven configurations | CONT-02 | One layer caps at 49.6 % and there is no gamma correction anywhere in the WS2812 path, so a colour is a starting point rather than a measured result | Rows 5, 8, 9 and 10 of the audition. A change is a knob-value edit plus a `frames.json` regeneration and nothing else |
| That the VM's WASM asset is served correctly under whatever headers the deployed site sends | CONT-02 (D-14) | Partly automated — `e2e/catalog.e2e.ts` asserts status and MIME against `wrangler dev` — but the deployed origin is only exercised by a real deploy, which this phase does not do | Carried forward; `worker/index.js` sets no CSP today, and any future CSP must include `'wasm-unsafe-eval'` in `script-src` or both WASM modules stop instantiating with a symptom indistinguishable from "it never initialised" |

---

## Negative checks (observe red before trusting)

Every one is observed going red once, reverted, and both exit codes plus the failing test name
recorded in the plan's SUMMARY — the Phase 1 convention.

| Gate | Task | How to make it red | Expected |
|------|------|--------------------|----------|
| Metadata completeness | 8-01-02 | Set one ported entry's `tags` to `[]` | `catalog.spec.ts` test 1 red, naming that entry's id |
| Frame fixture | 8-01-03 | Change one hex digit of one hash in `frames.json` | `frames.spec.ts` test 3 red, naming the entry and the tick |
| **Declared darkness** | 8-06-03 | Flip MORPH's `restsBlack` to `false` | `frames.spec.ts` test 5 red naming `morph` - the declaration and the fixture must agree in both directions |
| **`glag` is the serpentine** | 8-02-03 | Replace the `glag` stub body with the identity | `lua-host.spec.ts` test 2 red, reporting a moved-cell count of 0 where 40 was expected |
| **The parity gate — engine half** | 8-03-02 | The same identity perturbation | `lua-parity.spec.ts` test 1 red, naming a preset and a hardware index |
| **The parity gate — fixture half** | 8-03-02 | Change one hex digit in `golden-frames.json` | `lua-parity.spec.ts` test 3 red naming the preset and tick, **while test 2 stays green** — the discrimination that makes test 3 worth having |
| Canonical form | 8-04-02 | Give `@TRAIL` a value with a trailing space, `"42 "`, and default to it | `lua-entries.spec.ts` test 1 red, naming `euclid` and `timer` |
| Cross-product budget | 8-04-02 | Add a 900-character `@RINGC` value | `lua-entries.spec.ts` test 6 red, naming the entry, event and length |
| **Pitfall 1 — the strobe bug** | 8-04-03 | Append `for a=0,80 do glt(a,2,65535)end` to EUCLID's Timer template | `lua-smoke.spec.ts` test 3 red, naming the entry, hardware index, layer and tick |
| Frame coverage | 8-05-03 | Delete GHOST's record from `frames.json` | `frames.spec.ts` test 1 red, naming `ghost` |
| **Laziness, paired** | 8-07-02 | Add a static `import ... from "./lua-pad-sim"` to `engine.ts` | `lazy.spec.ts` test 2 red **and** `catalog.e2e.ts` test 1 red with a non-empty `.wasm` array on the cold load. The pairing is what makes the fast guard evidence rather than a style rule |
| WASM MIME | 8-07-02 | Change the expected content type in `catalog.e2e.ts` | e2e test 2 red naming the type |
| Audition row count | 8-08-02 | Delete row 7 from the checklist table | `audition.spec.ts` test 1 red, 11 rows where 12 were expected |
| Audition naming | 8-08-02 | Rename `SONAR` to `SONNAR` in one row | `audition.spec.ts` test 2 red, naming it |

---

## Standing hazards carried into this phase

Each has already cost real time in this repository and each is written into the plan that can hit it.

- **`grep -c` counts matching lines, not matches.** Every count-style acceptance criterion in this
  phase is either a zero-check (where the two readings agree) or a `node -e` check.
- **Prettier collapses primitive arrays in generated JSON.** `frames.json`'s `ticks` array lands on
  one line and that is correct; no criterion asserts one element per line.
- **The Bash transport may halve backslashes.** No acceptance criterion in this phase carries a
  multi-backslash regex; structural checks live inside specs, which is the house style anyway.
- **A forbid-check must not match its own requirement.** Every "must not contain" criterion is paired
  with a requirement that does not mandate the forbidden string, and the two specs that must search
  for strings they forbid (`lua-entries.spec.ts` test 4, `lazy.spec.ts` test 3) assemble their
  needles from fragments, as `forbidden-instructions.spec.ts` established.
- **`npm install` rewrites the lockfile indentation on this machine.** Expected in 8-02-01; commit it.
  What must not move is the resolved `@intechstudio/grid-protocol` version.
- **Playwright wipes `test-results/` at the start of every run.** All e2e output goes to `.tmp-e2e/`,
  and no Playwright test title contains the word `failed`.
- **A stray `wrangler dev` holds `build/` open** and `reuseExistingServer` will happily attach to it.
  Check port 4173 before every build in plans 08-02 and 08-07, and kill the whole process tree from
  the `npx-cli` root rather than `workerd.exe` alone.
- **The `--[[@cb]]` marker contains an `@`.** Leftover-token checks are on `@` followed by an
  upper-case letter.
- **`PadSim.pokeLayer` throws on a non-integer.** The F2Ieq rule must be applied in the stub, not
  discovered as a crash.
- **`license-checker-rseidelsohn` only makes a directory for a SCOPED package.** The existing tree is
  `licenses/@intechstudio/...` and `licenses/@wasm-fmt/...`; an unscoped package lands as a bare
  `licenses/<name>@<version>-LICENSE.txt`. A `test -d licenses/<name>` check can never pass for one.
- **A blank layer plus `glc`'s force-min-black argument renders an all-zero frame.** Three shipped
  entries are dark until touched, so any "the picture is not black" assertion has to say *when*.
- **Phase 4 shares this tree.** No absolute suite total, and every new catalog entry has to be
  accounted for in `front-door.ts` once that file exists.
- **A Timer body re-parsed per tick is the phase's one real performance cliff.** Compile once at
  `LuaHost.create`, invoke a cached function.

---

## Deferred, and where it went

| Item | Why deferred | Where |
|---|---|---|
| MIRROR | Blocked on the hardware MIDI-in question (D-04) | Audition row 11; a yes makes it a one-file follow-on |
| STEP, RIBBON | Reserves beyond the seven shipped; STEP overlaps EUCLID's sequencer slot and RIBBON's 10-bit unlock is the fiddliest to knob-tune | Available as one-file follow-ons now the machinery exists; noted in `08-06-SUMMARY.md` |
| A BOTOR patch for new looks or send kinds (route 1b) | D-05: multi-week upstream work, and `SEND_KINDS` has 2 of 8 slots left | Open question 2 for the user; nothing in this phase depends on it |
| The shareable-stamp envelope for Lua entries | D-13: a Phase 5 seam. This phase guarantees only stable `id`s and integer knob indices | Phase 5 |
| Knob widgets and live meters | Phase 5 (TUNE-01..05). This phase ships knob **data** over the compiler's own `KnobKind` vocabulary | Phase 5 |
| The coverflow | Phase 4. This phase ships the `SimEngine` seam and the `CatalogEntry` shape D-10 promises it | Phase 4 |
| A runtime fit ladder for Lua entries | There is none, by design: the whole cross-product is proven in budget at build time, so TUNE-04's "we trimmed something" line never fires for a Lua entry | Recorded in 8-04-02 and in `08-04-SUMMARY.md` |

---

## Validation Sign-Off

- [x] All tasks have an `<automated>` verify (the checkpoint's is its pre-checkpoint full-suite gate;
      its human steps are in `<how-to-verify>`)
- [x] Sampling continuity: no 3 consecutive tasks without an automated verify
- [x] Wave 0 covers all MISSING references, each mapped to a creating task
- [x] No watch-mode flags anywhere (`test:unit` stays `vitest`, but every task command uses
      `--run` semantics via `test:quick`, `test:sweep` or an explicit `vitest run`)
- [x] Feedback latency < 10 s quick (re-measured in 08-07 once the VM specs land) / < 50 s wave
- [x] Every claim that a suite is green is a test-count assertion, never an exit code
- [x] Every entry-count claim is a `node -e` check against `frames.json` or a file listing, never a
      test count — because the gates are deliberately entry-count-independent
- [x] **No absolute suite total appears in any plan.** Every `test:quick` and `test:e2e` assertion is
      an observed baseline plus a stated delta, evaluated by `scripts/check-counts.mjs`; the sweep is
      the one exception, and it is absolute because no other phase adds to it
- [x] Every "must not be black" claim distinguishes **breakage** (never lights, checked by the smoke
      gate under a real gesture) from **rest state** (declared per entry as `restsBlack`, checked
      against the fixture in both directions)
- [x] Phase 4's front-door contract is accounted for by a conditional step in every authoring plan
- [x] Every negative check names the mutation that makes it red and the expected failing test
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planned 2026-09-04, pending execution
