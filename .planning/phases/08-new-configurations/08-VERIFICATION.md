---
phase: 08-new-configurations
verified: 2026-09-04T08:10:32Z
status: human_needed
score: 8/8 automated must-haves verified; 1 item awaiting the user on hardware
re_verification: false
human_verification:
  - test: "Run docs/HARDWARE-AUDITION.md — twelve rows, on a real ZONA, through BOTOR's shelf with minimalist mode off. Capture the module's current configuration FIRST. Install order is Timer into event 6, then Setup into event 0 (gtt is a no-op until the Timer event holds a stored action); MORPH is the exception, its Timer is the empty string. AUDITION_DUMP=1 npx vitest run --project server src/lib/catalog/audition.spec.ts writes the thirteen pasteable files into .tmp-audition/."
    expected: "Each of the twelve rows answered and written under a dated `## Results` heading in docs/HARDWARE-AUDITION.md. Row 11 is the one that unblocks or permanently drops MIRROR. Any failing row becomes a knob-value or colour edit in src/lib/catalog/entries/<id>.ts plus a frames.json regeneration."
    why_human: "Web Serial is not automatable (no CDP domain, no fake-device hook) and HANGAR cannot install until Phase 7. Every row is a perceptual or physical fact — perceived polyrhythm, real T100 touch codes, glf's rate-only behaviour on hardware, LED diffusion, the brightness of 0,25,50 after the divide-by-512, timer drift under load, whether a real finger is motionless enough to trip a 2 s watchdog, whether anything strobes over fifteen minutes. D-16 is standing: the user tests on hardware personally."
---

# Phase 8: New Configurations Verification Report

**Phase Goal:** The catalog stops being a port of BOTOR's shelf and becomes HANGAR's own —
configurations authored for spectacle against a working simulator and a live budget meter.
**Verified:** 2026-09-04T08:10:32Z
**Status:** human_needed — every automated must-have verified; the 08-08 hardware audition is
presented and unanswered, which is what the plan requires, not a gap.
**Re-verification:** No — initial verification.

---

## Suites run by the verifier

Every number below was produced by this verifier on this machine, not read from a SUMMARY.

| Command                | Expected            | Observed                                       | Result |
| ---------------------- | ------------------- | ---------------------------------------------- | ------ |
| `npm run test:quick`   | 43 files / 563 \| 1 todo | **43 files, 563 passed \| 1 todo (564), 4.54 s** | ✓      |
| `npm run test:sweep`   | 1 file / 9          | **1 file, 9 passed, 36.90 s**                   | ✓      |
| `npm run check`        | 0 errors            | **456 FILES 0 ERRORS 0 WARNINGS**               | ✓      |
| `npm run lint`         | exit 0              | **prettier clean, eslint clean, exit 0**        | ✓      |
| `npm run build`        | succeeds            | **built; postbuild wrote source-564b2b9…tar.gz (611 KB)** | ✓ |
| `npx playwright test`  | 23                  | **23 passed, 26.9 s**                           | ✓      |
| `npm run licenses`     | exit 0, no allowlist edit | **exit 0; 5 production deps; tree still clean** | ✓  |

Port 4173 was free before the run. After the run `netstat -ano | grep :4173 | grep LISTENING`
returns nothing and no `wrangler`/`workerd` process remains; only `TIME_WAIT` sockets. Playwright
output is in `.tmp-e2e/e2e-out.txt`.

**Working tree at the end of verification is identical to the start**: the only entry in
`git status --porcelain` is the other agent's untracked
`.planning/phases/05-tuning-budgets-and-shareable-links/05-UI-SPEC.md`. No source or planning file
was modified by this verification. Nothing was committed.

---

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                        | Status     | Evidence                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **CONT-02 floor cleared**: at least six HANGAR-authored configurations are in the catalog, each fully specified | ✓ VERIFIED | Seven ship. `CATALOG` = 9 ported + EUCLID, CHORUS, ARC, GHOST, LATTICE, MORPH, SONAR. `catalog.spec.ts` 10/10.                        |
| 2   | Each new configuration is **canonical, in budget, syntax-clean, executes, lights and is pinned by frames**      | ✓ VERIFIED | `lua-entries.spec.ts` 6/6, `lua-smoke.spec.ts` 3/3, `frames.spec.ts` 5/5. Per-truth breakdown below.                                    |
| 3   | The **whole knob cross-product** stays in budget, and the separability argument is *tested*, not asserted       | ✓ VERIFIED | `lua-entries.spec.ts` test 5 proves the length identity per event, per knob, per value; test 6 sweeps every value plus both corners.    |
| 4   | Each is **fun and USEFUL** (D-02) — a real instrument, not a screensaver                                        | ✓ VERIFIED | Behavioural MIDI captured by the verifier via `SMOKE_REPORT=1`. Table below.                                                            |
| 5   | **PREV-02 (shared)**: the Lua host reproduces all nine presets and no vendored file changed                     | ✓ VERIFIED | `lua-parity.spec.ts` 5/5 — 2,187 layer records, 45 hashes vs live PadSim, 45 vs `golden-frames.json`. `git diff 16e5232..HEAD -- src/vendor/` empty; `vendored-diff.spec.ts` 14/14. |
| 6   | **Laziness**: a cold front-door load fetches no WebAssembly; the VM chunk is dynamic and self-hosted            | ✓ VERIFIED | `lazy.spec.ts` 3/3, `e2e/catalog.e2e.ts` 2/2 against the real `build/`. `glue.Dlydm7r2.wasm` (271,581 B) emitted and referenced by no HTML entry point. |
| 7   | **The curated row**: every new entry is excluded with a `why`; Phase 4's partition holds; the row is unchanged  | ✓ VERIFIED | All 7 in `EXCLUDED_FROM_ROW` with a reason. `front-door.spec.ts` untouched since 04-02 and green. `FRONT_DOOR` byte-identical to `f3cfbc1`. |
| 8   | **Honesty**: no AI attribution, no sibling repo touched, no paid dependency, deferred items recorded            | ✓ VERIFIED | Details below. One info-level documentation note (§ Anti-Patterns).                                                                     |
| —   | **The hardware audition** answers the twelve rows only a bench can answer                                       | ⏳ HUMAN    | `checkpoint:human-verify`, `autonomous: false`, presented and **unanswered** by design (D-16). Not a gap.                               |

**Score: 8/8 automated truths verified.** One item routed to the user.

---

### Truth 2 in detail — the CONT-02 gate, per property

Verified against the code, then re-run by this verifier rather than read from a SUMMARY.

| Property                              | Where it is enforced                                          | Verifier's finding                                                                                |
| ------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Canonical: `compressScript(x) === x`  | `lua-entries.spec.ts` test 1 — on the **rendered** text, never the template | Green. The empty-Timer case (MORPH) needs no branch: `compressScript("") === ""`.  |
| Budget at defaults, both events       | `lua-entries.spec.ts` test 2 — `max(raw, compressed) <= EVENT_BUDGET`, and `EVENT_BUDGET` is imported from the vendored `_pad.ts`, never restated | Green. Worst default anywhere: 729 (CHORUS Setup), 333 (GHOST Timer).             |
| Syntax after `padReady()`             | `lua-entries.spec.ts` test 3, with `beforeAll(padReady)`      | Green. The gate correctly runs the formatter first — without it `checkSyntax` returns `false` silently and every entry would read as broken. |
| Restricted Lua subset (D-08)          | `lua-entries.spec.ts` test 4 — 13 forbidden needles assembled from fragments, plus a 7-name numeric-library allowlist | Green. `grep -c` for the two literal needles in the spec: 0 / 0.                    |
| Executes in the Lua host, no error    | `lua-smoke.spec.ts` test 2 — gesture + 200 settle ticks, `host.errors` empty, touch queue drained | Green for all 7.                                                                   |
| Lights during the scripted gesture    | `lua-smoke.spec.ts` test 1 — drag, lift, fast tap; asks for light **at some point**, not immediately after Setup | Green for all 7, including the three that rest black.                              |
| No keeper on a decaying layer (D-15)  | `lua-smoke.spec.ts` test 3 — timeout ≥ 64511 **and** rate ≥ 200, sampled every tick | Green. The documented research bug is mechanically excluded, not reviewed.          |
| Golden frames at 5 ticks              | `frames.spec.ts` tests 1–4 — 16 entries × 5 ticks, fresh engine per sample, ported entries cross-checked against `golden-frames.json` | Green. `frames.json` covers exactly 16 entries.                                     |
| `restsBlack` matches the fixture      | `frames.spec.ts` test 5 — **both directions**                 | Green, and independently recomputed by this verifier from `frames.json` (table below). |

**`restsBlack`, recomputed by the verifier from `frames.json` `nonZeroBytes`:**

| Entry  | nonZeroBytes at ticks 0/37/101/500/1009 | All black? | Declared `restsBlack` | Agree |
| ------ | ---------------------------------------- | ---------- | --------------------- | ----- |
| tpad   | 0,0,0,0,0                                | yes        | `true`                | ✓     |
| ghost  | 0,0,0,0,0                                | yes        | `true`                | ✓     |
| morph  | 0,0,0,0,0                                | yes        | `true`                | ✓     |
| euclid | 30,45,73,111,111                         | no         | `false`               | ✓     |
| chorus | 198×5                                    | no         | `false`               | ✓     |
| arc    | 152,160,160,161,162                      | no         | `false`               | ✓     |
| lattice| 169×5                                    | no         | `false`               | ✓     |
| sonar  | 0,81,184,194,188                         | no (tick 0 only) | `false`         | ✓     |

The three that rest black are exactly the three the CONTEXT predicted (D-19). SONAR is dark at tick 0
and lights from tick 37 — `restsBlack: false` is the correct declaration, since the fact is "black at
*every* sampled tick".

---

### Truth 3 in detail — the separability argument is tested, not asserted

This was the single most load-bearing thing to check, because the cross-products are far too large to
enumerate (EUCLID alone is 100,800 combinations).

`lua-entries.spec.ts` **test 5** proves the reduction rather than assuming it. For every entry, every
knob and **every value** of that knob, it renders and asserts:

```
moved[event].length === base[event].length + occurrences(template[event], token) × (to.length − from.length)
```

Occurrences are counted **per event**, never summed across both — the comment names exactly why a
cross-event count would be wrong for most knobs and accidentally right for one. That identity is what
licenses **test 6**'s corner-only bound: substitution is pure literal arithmetic with zero interaction
between knobs, so the maximum over the cross-product is the all-longest corner. Test 6 then measures
every single-knob variation plus both corners, asserts the combination count equals
`Σ|values| + 2`, and re-checks canonical form, live-token absence and budget at each.

**Independently measured by this verifier** (fresh render at the all-longest corner, outside the spec):

| Entry   | Knobs | Cross-product | Setup/Timer at defaults | Setup/Timer at all-longest | Headroom vs 908 |
| ------- | ----- | ------------- | ----------------------- | -------------------------- | --------------- |
| euclid  | 6     | 100,800       | 702 / 218               | **706 / 221**              | 202 / 687       |
| chorus  | 6     | 76,800        | 729 / 173               | **733 / 174**              | 175 / 734       |
| arc     | 5     | 6,000         | 379 / 251               | **382 / 253**              | 526 / 655       |
| ghost   | 5     | 8,000         | 305 / 333               | **308 / 337**              | 600 / 571       |
| lattice | 6     | 46,080        | 615 / 171               | **618 / 172**              | 290 / 736       |
| morph   | 5     | 6,400         | 507 / 0                 | **510 / 0**                | 398 / 908       |
| sonar   | 5     | 10,000        | 432 / 279               | **433 / 282**              | 475 / 626       |

Every figure reproduces `08-VALIDATION.md`'s table exactly. Nothing was fabricated. Knob counts are
5–6, inside D-12's 3-to-6 band, over the vendored `KnobKind` vocabulary (TUNE-01's shared widget set),
and `types.ts` carries a compile-time exhaustiveness assertion so a widened upstream union breaks
`npm run check` instead of drifting silently.

---

### Truth 4 in detail — fun *and* useful (D-02)

`lua-smoke.spec.ts` asserts every entry produces MIDI ("a silent instrument is exactly what the gate
exists to notice"). This verifier ran it with `SMOKE_REPORT=1` and read the actual traffic — the
behaviour, not the claim:

| Entry   | Messages | First three `(ch,cmd,p1,p2,mode)`                  | What that is                                            |
| ------- | -------- | -------------------------------------------------- | ------------------------------------------------------- |
| euclid  | 76       | (0,128,36,0,0) (0,144,36,100,0) (0,128,38,0,0)      | Note off/on at 36 and 38 — GM kick and snare, three rings|
| chorus  | 18       | (0,144,48,100,0) (0,144,52,100,0) (0,144,55,100,0)  | **A real triad**: C3–E3–G3 fired together                |
| arc     | 109      | (0,176,16,18,0) (0,176,16,31,0) (0,176,16,43,0)     | CC 16 sweeping — a free-running LFO after the finger lifts|
| ghost   | 218      | (0,176,16,25,0) (0,176,17,102,0) (0,176,16,38,0)    | Two-axis CC 16/17 retraced — the gesture loop            |
| lattice | 14       | (0,144,72,100,0) (0,128,72,0,0) (0,144,68,100,0)    | Note on/off 72 then 68 — a fourth apart, isomorphic grid |
| morph   | 28       | (0,176,16,81,0) (0,176,17,20,0) (0,176,18,20,0)     | Three simultaneous macro CCs — corner weights            |
| sonar   | 8        | (0,144,43,100,0) (0,128,43,0,0) (0,144,43,100,0)    | Note on/off repeating — the radial step sequencer        |

Every one is a playable instrument or a real playing aid. The channel is the **first** argument in all
of them, matching the recipe-book signature the CONTEXT pins. Descriptions and tags are feel-based
(`polyrhythm`, `chords`, `hands-free`, `looper`, `isomorphic`, `macros`, `radial`), never compiler
kinds, and `catalog.spec.ts` gates that.

---

### Required Artifacts

| Artifact                                | Expected                                                     | Status     | Details                                                                             |
| --------------------------------------- | ------------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------- |
| `src/lib/catalog/types.ts`              | `CatalogEntry`, `LuaKnob`, `previewFor`, `build`, `restsBlack` | ✓ VERIFIED | Imports neither the protocol package nor the compile surface — constants restated and gated. |
| `src/lib/catalog/index.ts`              | `CATALOG` = 9 ported + 7 authored, `byId`, three sorts        | ✓ VERIFIED | Frozen; every sort returns a new array; `nameAsc` is a plain comparison, never `localeCompare`. |
| `src/lib/catalog/entries/*.ts`          | 8 files (ported + 7 authored)                                 | ✓ VERIFIED | 8 files present.                                                                     |
| `src/lib/catalog/catalog.spec.ts`       | 10 tests                                                      | ✓ VERIFIED | 10 passed, 0.45 s.                                                                   |
| `src/lib/catalog/lua-entries.spec.ts`   | 6 tests, the CONT-02 gate                                     | ✓ VERIFIED | 6 passed, 2.06 s (threshold 10 s).                                                   |
| `src/lib/catalog/frames.json` + spec    | 16 entries × 5 ticks; 5 tests                                 | ✓ VERIFIED | 16 entries confirmed by direct parse; 5 passed.                                      |
| `src/lib/catalog/audition.spec.ts`      | 4 tests holding the doc to the catalog                        | ✓ VERIFIED | 4 tests present and green in the suite.                                              |
| `src/lib/catalog/front-door.ts` + spec  | 7 new exclusions with a `why`; spec untouched                 | ✓ VERIFIED | Diff since `f3cfbc1` is exclusively additive `EXCLUDED_FROM_ROW` entries.             |
| `src/lib/sim/ready.ts`                  | The VM gate; the only module naming the package               | ✓ VERIFIED | Confirmed by repo-wide grep: 7 hits, all in `ready.ts`.                              |
| `src/lib/sim/lua-host.ts` / `lua-pad-sim.ts` | Grid API over the vendored LED engine                    | ✓ VERIFIED | `lua-host.spec.ts` 8 tests, incl. `screenToHw` moving exactly 40 of 81 cells.        |
| `src/lib/sim/engine.ts`                 | `SimEngine`, `createEngine` picking by `entry.preview`         | ✓ VERIFIED | Compile-time proof `PadSim` satisfies `SimEngine`; `SimEngineError` for a skip, never a crash. |
| `src/lib/sim/lazy.spec.ts`              | 3 laziness guards                                              | ✓ VERIFIED | 3 passed.                                                                            |
| `src/lib/fidelity/lua-parity.spec.ts`   | 5 tests, the Wave 0 gate                                       | ✓ VERIFIED | 5 passed, 0.93 s (threshold 20 s).                                                   |
| `src/routes/dev/catalog/+page.svelte`   | Unlinked probe; catalog static, engine dynamic                 | ✓ VERIFIED | Static `$lib/catalog` at module scope, dynamic `$lib/sim/engine` inside the click handler. |
| `e2e/catalog.e2e.ts`                    | 2 Playwright tests against `build/`                            | ✓ VERIFIED | Both green inside the 23.                                                            |
| `scripts/check-counts.mjs`              | Baseline+delta count checker                                   | ✓ VERIFIED | Present; usage line confirmed.                                                       |
| `scripts/gen-licenses.mjs`              | wasmoon discharged with no allowlist edit                      | ✓ VERIFIED | Exit 0; 5 prod deps; tree unchanged afterwards.                                      |
| `package.json`                          | `wasmoon` at an exact pin                                      | ✓ VERIFIED | `"wasmoon": "1.16.0"` — no caret, in `dependencies`.                                  |
| `THIRD-PARTY.md` + `licenses/`          | wasmoon and @types/emscripten, MIT                             | ✓ VERIFIED | Both listed MIT; `licenses/wasmoon@1.16.0-LICENSE.txt` on disk and copied into `build/`. |
| `docs/TESTING.md`                       | The catalog and Lua-host test surface, measured costs          | ✓ VERIFIED | Costs, thresholds, and the "adding a configuration changes no test count" property recorded. |
| `docs/PIN-POLICY.md`                    | The budget re-measure item and the separate VM pin rationale   | ✓ VERIFIED | Item names `lua-entries.spec.ts` → 6 passed; the VM pin is explicitly *not* gated by that checklist. |
| `docs/HARDWARE-AUDITION.md`             | Twelve rows, install order, pasteable procedure                | ✓ VERIFIED | Present; held to the catalog by `audition.spec.ts`.                                  |
| `CLAUDE.md`                             | Regenerated with the wasmoon rows                              | ✓ VERIFIED | Stack row and version-compatibility row both present, both naming the CDN trap.       |

No artifact is MISSING, STUB, ORPHANED or HOLLOW.

---

### Key Link Verification

| From                        | To                              | Via                                             | Status  | Details                                                                                                    |
| --------------------------- | ------------------------------- | ----------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| `engine.ts`                 | `lua-pad-sim.ts`                | `await import("./lua-pad-sim")`                 | ✓ WIRED | Dynamic only. `lazy.spec.ts` test 2 asserts the dynamic form is present **and** the static form is absent.    |
| `lua-pad-sim.ts` → `lua-host.ts` | `ready.ts` → `wasmoon`     | `await import("wasmoon")` inside `luaReady()`   | ✓ WIRED | Memoised; a `resetLuaReadyForTests` escape hatch exists and is named test-only.                              |
| `ready.ts`                  | `build/_app/immutable/assets/`  | `new URL("wasmoon/dist/glue.wasm", import.meta.url)` | ✓ WIRED | Verifier confirmed `glue.Dlydm7r2.wasm` (271,581 B) is emitted and referenced from a chunk as `assets/glue.Dlydm7r2.wasm`. |
| Lua host                    | vendored `PadSim`               | public `pokeLayer` / `layer` / `tick` / `frame` | ✓ WIRED | `git diff 16e5232..HEAD -- src/vendor/` is empty; D-06's "no vendored file is edited" holds.                  |
| `frames.spec.ts`            | both engines                    | `createEngine(entry)`                            | ✓ WIRED | The fixture records a hand-authored entry through the engine the row actually plays it with, not a parallel path. |
| New catalog entries         | `EXCLUDED_FROM_ROW`             | 7 additions, each with a `why`                   | ✓ WIRED | Partition asserted by Phase 4's own spec; that spec was not edited by Phase 8.                                |
| `audition.spec.ts`          | `docs/HARDWARE-AUDITION.md`     | doc-shape gate over 12 rows + the catalog        | ✓ WIRED | A renamed or dropped configuration reddens test 2 or 3; the install-order sentence is matched by test 4.      |

---

### Data-Flow Trace (Level 4)

| Artifact                    | Data variable        | Source                                        | Produces real data                                                    | Status     |
| --------------------------- | -------------------- | --------------------------------------------- | ---------------------------------------------------------------------- | ---------- |
| `/dev/catalog/+page.svelte` | `luaOut`, `padsimOut`| `createEngine(entry).run(30).frame`           | Yes — the e2e parses the JSON and asserts `frameLength === 243` and `nonZeroBytes > 0` in real Chromium | ✓ FLOWING |
| `frames.json`               | `nonZeroBytes`, `sha256` | fresh engine per sample, `run(tick)`      | Yes — 13 of 16 entries carry non-zero lit-byte counts; the 3 zeros are declared and cross-asserted       | ✓ FLOWING |
| `FRONT_DOOR[].motion`       | `animated/static/dark` | derived by the spec from `golden-frames.json` | Yes — motion is derived from recorded frames, never authored          | ✓ FLOWING |
| Lua entry MIDI              | `host.midi`          | real VM calling `self:gms`                    | Yes — 8 to 218 messages per entry, verifier-inspected                  | ✓ FLOWING |

No hollow artifacts. The one thing that could have been hollow — a "Lua route" that was quietly the
vendored simulator answering its own question — is explicitly excluded by `lua-parity.spec.ts` test 4
and `lua-host.spec.ts` test 5, both of which prove the wrapped blank `PadSim` contributes nothing
before Setup runs (0 lit bytes, `animating === false`, still 0 after 200 ticks with no Lua at all).

---

### Behavioural Spot-Checks

| Behaviour                                                      | Command                                                                     | Result                                                | Status |
| -------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------- | ------ |
| Seven configurations exist and are hand-authored                | parse `CATALOG` / count `entries/*.ts`                                       | 16 entries, 8 entry files, 7 `source.kind === "lua"`   | ✓ PASS |
| Corner budgets reproduce the documented figures                 | fresh `renderLua` at the all-longest corner for all 7                        | Byte-identical to `08-VALIDATION.md`                   | ✓ PASS |
| Every configuration actually plays                              | `SMOKE_REPORT=1 npx vitest run … lua-smoke.spec.ts`                          | 8–218 MIDI messages each; triads, drums, CC sweeps     | ✓ PASS |
| The VM WASM is bundled at HANGAR's own origin                   | `ls build/_app/immutable/assets/*.wasm`                                      | `glue.Dlydm7r2.wasm` 271,581 B; `lua_fmt_bg…` 628,148 B| ✓ PASS |
| No HTML entry point pulls the VM                                | grep `glue` in `build/index.html` and every `build/c/*/index.html`           | 0 matches in all 9 files                               | ✓ PASS |
| The vendored tree is untouched                                  | `git diff --stat 16e5232..HEAD -- src/vendor/`                              | empty                                                  | ✓ PASS |
| No listener leaked after the e2e                                | `netstat -ano \| grep :4173 \| grep LISTENING`                               | no output; no `wrangler`/`workerd` process             | ✓ PASS |

---

### Requirements Coverage

| Requirement | Source plans     | Owner (REQUIREMENTS.md)                        | Status                | Evidence                                                                                                                                                        |
| ----------- | ---------------- | ---------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CONT-02** | 08-01 … 08-08    | **Phase 8** (sole owner)                        | ✓ SATISFIED           | Seven configurations, all six gate properties green, sweep proven. Marked `[x]` / `Complete` — **justified**.                                                     |
| **PREV-02** | 08-02, 08-03     | Phase 4 (Lua-sourced entries: Phase 8)          | ✓ SATISFIED (share)   | `lua-parity.spec.ts`: 2,187 layer records + 45 hashes vs live `PadSim` + 45 vs the Phase 3 fixture. Three-way agreement, and the fixture cannot drift. Consistent with the qualifier. |
| **CONT-03** | 08-01, 08-04..06 | Phase 4 (metadata gate for new entries: Phase 8)| ✓ SATISFIED (share)   | `catalog.spec.ts` gates name, description, feel-based tags, `featured` and `defaults` for **every** entry, ported and new. Row still `Pending` under Phase 4 — correct, Phase 8 owns only the gate. |
| **TUNE-01** | 08-04, 08-05, 08-06 | Phase 5 (knob data for Lua entries: Phase 8) | ✓ SATISFIED (share)   | 5–6 knobs per entry over the vendored `KnobKind` union, with a compile-time exhaustiveness assertion. Widgets remain Phase 5's. Row still `Pending` — correct.      |

No orphaned requirements: `.planning/REQUIREMENTS.md` maps only CONT-02 to Phase 8, and 08-01…08-08
claim it. `08-VALIDATION.md`'s "Requirement ownership" section states the three shared rows and says
explicitly that no plan edits `REQUIREMENTS.md` or the roadmap coverage table — and none did.

**Success Criteria, read literally:**

1. *"At least six new configurations … each with its name, one-line description, feel-based tags,
   Featured flag and default knob state filled in."* — ✓ **met**, seven.
2. *"Each new configuration fits both the 908-character Setup and 908-character Timer budgets at its
   default knob positions, shown green in the live meters."* — the budget half is ✓ **met and
   independently re-measured**. The clause *"shown green in the live meters"* cannot be observed
   today because the meters are Phase 5 (TUNE-02, **Not started**), which `08-CONTEXT.md`'s phase
   boundary excludes from Phase 8 by name. This is a **scope carry-over to Phase 5, not a Phase 8
   gap**: Phase 8 delivered the measurement the meter will render.
3. *"…swept across its full knob range, with no combination silently exceeding budget — the fit
   ladder either holds it or names what it trimmed."* — ✓ **met, by a stronger route**. D-12 removes
   the runtime fit ladder for Lua entries entirely and proves the whole cross-product at build time,
   so nothing can be trimmed and TUNE-04's "we trimmed something" line can never fire for these
   cards. `lua-entries.spec.ts` says so in a comment beside the sweep rather than asserting about a
   ladder that does not exist, which is the honest form.

---

### Anti-Patterns Found

| File / area                                | Pattern                                                                 | Severity | Impact                                                                                                                                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/protocol/forbidden-instructions.spec.ts` | `SCANNED_DIRS = ["src/lib/protocol", "src/lib/transport"]` — Phase 8's new `src/lib/catalog` and `src/lib/sim` are outside the scan, and **no Phase 8 SUMMARY records that boundary** | ℹ️ Info   | No live risk: the verifier grepped all four instruction names (`NVMERASE`, `PAGECLEAR`, `PAGEDISCARD`, `PAGEACTIVE`) across both new directories and found none, the wire path is unchanged, and the Lua side has its own subset gate. What is missing is only the written note that the D-06 scan does not cover the new tree. Worth a line when Phase 7 makes the entry text wire-bound. |
| `e2e/catalog.e2e.ts`                       | The VM `.wasm` response is asserted on `status` and `content-type`, but not on **origin** | ℹ️ Info   | A regression to wasmoon's `https://unpkg.com/wasmoon@1.16.0/dist/glue.wasm` fallback would satisfy both. It cannot happen today — `ready.ts` always passes an explicit URI in a browser and the verifier confirmed the emitted, chunk-referenced `assets/glue.Dlydm7r2.wasm`. A one-line `expect(new URL(vm[0].url).origin).toBe(...)` would close it. The unpkg string does ship in the bundle, but only inside wasmoon's `e === void 0` branch, which is dead. |

No blockers. No warnings. No TODO/FIXME/placeholder stubs, no empty handlers, no hardcoded empty
props: every `= []`/`= {}` in the new code is either a spec accumulator or a `PadSim` structure that
is written before it is read, and the frames fixture proves the reads are non-empty.

**Honesty checks, all clean:**

- **No Claude/Anthropic attribution** anywhere. Grep across `src/`, `docs/`, `e2e/`, `scripts/`,
  `worker/` and root `*.md` returns only Windows filesystem paths
  (`C:\Users\sabot\Documents\Claude\…`, `.claude/worktrees/…`) and the `CLAUDE.md` filename, which
  `licence-notices.spec.ts` and `artifacts.e2e.ts` already keep out of the source archive via
  `export-ignore`. All 25 recent commits are authored `Botond Sandor <botond.sandor@intech.studio>`;
  no `Co-Authored-By` trailer anywhere.
- **No sibling repo touched.** `grid-fw`, `zona-docs`, `profile-cloud` and `grid-uikit` are all
  clean. `grid-editor` carries two modified files, both last written **2026-08-28** — a week before
  Phase 8 — so they pre-date this work.
- **No paid dependency.** `wasmoon@1.16.0` is MIT with one runtime dependency
  `@types/emscripten@1.39.10`, also MIT. `npm run licenses` exits 0 with no allowlist edit, and the
  regenerated `THIRD-PARTY.md` is byte-identical to the committed one.
- **Nothing was written to a device.** The 08-08 checkpoint is `autonomous: false`, was presented and
  left unanswered, and its SUMMARY states plainly: "No part of the audition was run, no result was
  fabricated, and nothing was written to a device."
- **Nothing was fabricated.** Every figure this verifier could re-derive — the seven corner budgets,
  the 16 fixture entries, `glue.Dlydm7r2.wasm` at 271,581 bytes, 43/563+1, 9, 23, 0 errors — matches
  the summaries and `docs/TESTING.md` exactly.

**Deferred / open items, all recorded:**

| Item                                                        | Where it is written down                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **MIRROR blocked** on the DAW MIDI-in hardware test          | `08-02`, `08-03`, `08-06`, `08-08` SUMMARYs; row 11 of `docs/HARDWARE-AUDITION.md`; `audition.spec.ts` test 2 asserts it appears **only** as an optional row and is **absent** from `CATALOG` |
| **`gln` / `gld` / `glx` unregistered** and still raising     | `08-03-SUMMARY` §5, restated in `08-04-SUMMARY` and `08-05-SUMMARY`                   |
| **`self.midirx_cb` has no dispatcher**                       | `08-02-SUMMARY` §8, restated in `08-03-SUMMARY` §6                                    |
| **Stamp envelope for Lua entries** (D-13)                    | Deferred to Phase 5 by `08-CONTEXT.md`; Phase 8 guarantees only stable ids and integer knob indices |
| **Toolchain quirks**: the benign `rolldown:vite-resolve` "externalized for browser compatibility" warnings for `module`/`url`; Vitest's console interception swallowing module-scope `console.log` | `08-02-SUMMARY` (with the proof the emitted chunk carries `{}` stubs and no top-level `import "module"`); `08-08-SUMMARY` tech-stack patterns and §Deviations |
| **`forbidden-instructions.spec.ts` scan boundary**           | ⚠️ **Not recorded** — see the Anti-Patterns table above. Info-level.                   |

---

### Human Verification Required

#### 1. The twelve-row ZONA hardware audition

**Test:** Follow `docs/HARDWARE-AUDITION.md` on a real ZONA.

- Capture the module's current configuration **first**.
- The audition goes through BOTOR's shelf with minimalist mode off, because HANGAR cannot install
  until Phase 7.
- **Install order: Timer into event 6 first, then Setup into event 0.** `gtt` is a no-op until the
  Timer event holds at least one stored action. MORPH is the exception that proves the rule — its
  Timer is the empty string and it starts moving from the Setup alone.
- `AUDITION_DUMP=1 npx vitest run --project server src/lib/catalog/audition.spec.ts` writes the
  thirteen pasteable files (7 Setup, 6 Timer) into `.tmp-audition/`. It deliberately exits 0 and does
  not fail the run — it writes only to a gitignored scratch directory and rewrites no committed
  fixture.

**Expected:** Each of the twelve rows answered, written under a dated `## Results` heading in
`docs/HARDWARE-AUDITION.md`. Any failing row becomes a knob-value or colour edit in
`src/lib/catalog/entries/<id>.ts` plus a `frames.json` regeneration. **Row 11 is the one answer that
unblocks or permanently drops MIRROR.**

**Why human:** Web Serial is not automatable — no CDP domain, no fake-device hook — and every row is
a perceptual or physical fact a simulator cannot produce: perceived polyrhythm, real T100 touch
codes, `glf`'s rate-only behaviour on hardware, physical LED diffusion, the brightness of `0,25,50`
after the divide-by-512, timer drift under load, whether a real finger is ever motionless enough to
trip a 2 s watchdog, and whether anything strobes over fifteen minutes. D-16 is standing: the user
tests on hardware personally, in daytime, on their own module.

**This is the plan working as designed, not a gap.** `/gsd:verify-work` must not read the presented
checkpoint as a completed audition, and this report does not.

---

### Gaps Summary

**None.** Every automated must-have derived from the phase goal and from `ROADMAP.md`'s three Success
Criteria is verified against the code, and every figure that could be independently re-derived was
re-derived rather than trusted.

The phase goal — *"the catalog stops being a port of BOTOR's shelf and becomes HANGAR's own"* — is
achieved on the evidence, not the claim. Seven configurations, one more than the floor, are real
instruments: a Euclidean drum machine that beats 3-against-5-against-7, nine diatonic triads, a
drawable LFO that keeps running after the finger lifts, a gesture looper, an isomorphic grid tuned in
fourths, a four-corner macro blender and a radial step sequencer. Each is stored in canonical
compressed form so the budget meter cannot lie, fits both 908-character events with 175 to 908
characters of headroom at its worst corner, stays inside a restricted Lua subset that is *forbidden*
rather than argued about, boots a real Lua 5.4 VM over the vendored LED engine without editing a
single vendored byte, lights under a scripted finger and is pinned by golden frames whose black
entries are declared facts checked in both directions.

Two things are worth naming plainly rather than burying.

**First, the strongest piece of engineering in this phase is `lua-entries.spec.ts` test 5.** EUCLID's
knob cross-product is 100,800 combinations and CHORUS's is 76,800; nobody enumerates those. The
obvious shortcut is to measure the all-longest corner and assert that it bounds the rest. That
assertion is exactly the kind of thing that is true right up until a template gains a token that
interacts with another. Test 5 does not assert it — it *proves* it, by checking, for every knob and
every value, that the rendered length moves by precisely `occurrences-in-this-event × Δ`, with the
occurrence count taken per event rather than summed across both. Only then does test 6 measure the
corners. The reduction from 100,800 to a handful is earned, and the comment beside it explains why
the cross-event count would have been silently wrong for almost every knob and accidentally right for
one. This is what the phase was asked to demonstrate and it demonstrates it.

**Second, the two carry-overs are honest, not evasions.** Success Criterion 2's "shown green in the
live meters" is unobservable today because the meters are Phase 5's and `08-CONTEXT.md` excludes them
from this phase by name; the measurement they will render is delivered and re-verified here.
Criterion 3's "the fit ladder either holds it or names what it trimmed" is answered by removing the
ladder rather than building one — D-12 proves the whole cross-product at build time, so nothing can
be trimmed, and the spec says so in prose instead of asserting about a mechanism that does not exist.
Both are the right calls and both are written down.

Two info-level notes are recorded above and neither blocks anything: the D-06 forbidden-instruction
scan does not cover the two directories Phase 8 created and no SUMMARY says so (nothing forbidden is
present in them — the verifier checked all four names), and `e2e/catalog.e2e.ts` pins the VM asset's
status and MIME but not its origin (the emitted, chunk-referenced same-origin asset is what makes it
true today).

The one thing standing between this phase and `passed` is a bench, a ZONA and half an hour of the
user's daytime.

---

_Verified: 2026-09-04T08:10:32Z_
_Verifier: Claude (gsd-verifier)_
