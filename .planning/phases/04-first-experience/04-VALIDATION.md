---
phase: 4
slug: first-experience
status: planned
nyquist_compliant: true
wave_0_complete: true
created: 2026-09-04
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 (node env, two projects: `server` quick ~4 s, `sweep` ~39 s) + @playwright/test 1.62.1 (chromium only) over `wrangler dev` serving `./build` |
| **Config file** | `vite.config.ts` (`test.projects`) and `playwright.config.ts` — **neither changes this phase** |
| **Quick run command** | `npm run test:quick` |
| **Wave run command** | `npm run check && npm run lint && npm run test:quick && npm run test:sweep` |
| **Full suite command** | the wave run plus `npm run build && npx playwright test` |
| **Estimated runtime** | quick ~6 s; sweep ~40 s; e2e ~25 s including the build and the wrangler cold start |

**Baselines this phase starts from.** `npm run test:quick` is **26 files / 453 passed | 1 todo**,
`npm run test:sweep` is **9**, `npx playwright test` is **10 passed**, `npm run check` is **0 errors**.
Phase 8 plan 08-01 runs before this phase's first wave and adds two files and fifteen tests
(`catalog.spec.ts` 10, `frames.spec.ts` 5), so the practical starting point is **28 files / 468
passed | 1 todo**.

**Why nothing here pins a whole-suite total.** The orchestrator guarantees the ordering of 08-01
against Phase 4's first wave; it does not guarantee that no other Phase 8 plan lands in between.
08-02 adds a spec and 08-03 adds `src/lib/sim/engine.ts`; Phase 8's authoring waves append
Lua-sourced entries to `CATALOG`, each one registered in `EXCLUDED_FROM_ROW` by the plan that lands
it; and 08-07 adds a Playwright test. The orchestrator sequences those authoring waves **after** this
phase, so the row should be stable while Phase 4 executes — but no Phase 4 assertion relies on that,
because a schedule is not a contract. A Phase 4 acceptance
criterion asserting a fixed grand total — of tests, of catalog entries or of exclusions — would go red
for a reason that is not a regression. So every task pins the **exact count of the file it wrote**,
every catalog assertion is a partition rather than a count (plan 04-02), and every whole-suite gate
goes through **`scripts/check-counts.mjs`** — the helper Phase 8 plan 08-01 lands, which reads a
Vitest or Playwright summary on stdin, compares it against an expected file/test count and **reports
the todo count without asserting it**:

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs $EXPECTED_FILES $EXPECTED_TESTS
npm run test:sweep  2>&1 | node scripts/check-counts.mjs 1 9
```

The two expected numbers are **baseline plus delta**: the totals the previous plan's SUMMARY recorded
plus the current task's own delta. Every Phase 4 SUMMARY therefore records the observed `test:quick`
file and test totals, and plan 04-01 captures the starting baseline before it touches anything.

An earlier draft of this document used `grep -E "Tests +[0-9]+ passed | 1 todo"` as a cheap
no-regression check. That asserted a **todo count** on a tree shared with Phase 8, and it has been
removed everywhere. Where a gate only needs "nothing failed", the pair `grep -E "Tests +[0-9]+ passed"`
matching and `grep -qE "Tests +[0-9]+ failed"` exiting non-zero is used instead. The **per-file**
Playwright count for `e2e/first-experience.e2e.ts` is pinned exactly at every step (3, 6, 8, 11); the
suite total is recorded, never asserted.

Phase 8 plan 08-01 also lands `scripts/check-counts.mjs`, a stdin filter that compares an observed
summary against an expected file/test count. Phase 4 does not use it for the whole-suite check —
that check is deliberately count-free — but a task may use it for a **per-file** count if it prefers a
named failure message to a regular expression. Both conventions are now in the tree; neither is wrong.

**Facts the map depends on** (measured or read from a committed fixture, 2026-09-04):

- A `PadSim.tick()` costs **0.28–0.40 µs** and a full 81-cell frame render **4.4–9.0 µs**. Seven pads
  ticking at 100 Hz and painting at 30/20 fps cost about **1.1 ms of CPU per second**. The simulator is
  not the constraint; the whole render budget is canvas paints and CSS compositing.
- `new PadSim(state)` costs **0.044 ms**, so all eight row engines are built eagerly.
- **Only five of the nine seeds animate.** `src/lib/fidelity/golden-frames.json` says so in its own
  note: joystick, ninepads, faders and tpad are static by design, and tpad's frame is all zeros
  because it writes no LEDs. Plan 04-02's gate derives the classification from that fixture rather
  than declaring it.
- `build/_app/immutable/chunks/*.js` contains `@intechstudio/grid-protocol` in a **131,101-byte**
  chunk, matched on `GRID_PARAMETER_ELEMENT_POTMETER`. `_pad.ts:42` imports it at module scope and the
  package declares no `sideEffects`, so any static import of the simulator from a route puts that chunk
  on the front door's critical path.
- **There is no browser Vitest project.** `vite.config.ts`'s `server` project *excludes*
  `src/**/*.svelte.{test,spec}.{js,ts}` and nothing else collects it; `@vitest/browser`, jsdom and
  happy-dom are all absent. A component test written this phase would be collected by nothing and
  report green — the exact green-and-vacuous trap `docs/TESTING.md` describes. **No `.svelte.spec.ts`
  file is created in this phase**, and every decidable thing lives in a pure `.ts` module instead.
- Playwright has **chromium only** installed. No cross-browser task is planned.
- `expect: { requireAssertions: true }` is on — a spec with no assertion fails, and so does an
  unasserted branch.
- **The catalog can grow underneath this phase.** New configurations are registered in
  `EXCLUDED_FROM_ROW` by whichever phase lands them, and Phase 8 plan 08-03 lands the `SimEngine`
  a Lua-sourced entry needs. The orchestrator holds Phase 8's authoring waves until Phase 4 is
  complete, so the row should not move while these plans run; the gates are written not to depend on
  that anyway. Phase 4's row holds only `preview: "padsim"` entries, its gate asserts a partition
  rather than a size, and `Coverflow.svelte` skips (and warns about) any row id the vendored shelf
  does not know instead of crashing.
- Web Serial is not automatable: no CDP domain, no fake-device hook. The device half of this phase is
  proven in node against `FakeTransport` and in the browser against the **degrade** path; the happy
  path is a one-line human check with a real ZONA.

**Sequencing constraint honoured by the plan order.** Plan 04-01 begins by asserting
`src/lib/catalog/` exists with `CATALOG`, `byId` and `build`, and by running Phase 8's own
`catalog.spec.ts`. If either fails the phase stops and names plan 08-01. No Phase 4 plan creates a
second catalog, and no Phase 4 plan edits a file 08-01 wrote — their acceptance criteria assert exact
test counts and exact `grep -c` results, so an addition there turns Phase 8 red.

---

## Sampling Rate

- **After every task commit:** `npm run test:quick` (~6 s), plus `npm run lint` when a source file
  changed, plus `npm run build` for any task that touches a route, the licence pipeline or an asset.
- **After every plan wave:** `npm run check && npm run lint && npm run test:quick && npm run test:sweep`.
- **Before `/gsd:verify-work`:** the wave run plus `npm run build` and `npx playwright test`.
- **Max feedback latency:** 10 s quick / 60 s wave. No task goes without an automated verify.

**Execution is serial.** The orchestrator runs one executor at a time, even for plans that share a
wave: a wave here is a **dependency grouping, not a parallelism guarantee**. That matters mechanically
rather than administratively — only one of `npm run build`, `npm run check` and a Playwright run may
be in flight at a time. Two concurrent builds fight over `build/`, which is deleted at the start of
each one (Phase 1 recorded the `EPERM ... hangaruild` failure that follows); two Playwright runs
fight over port 4173, and `playwright.config.ts`'s `reuseExistingServer` will happily attach the
second to the first's stale server. Plan 04-01 additionally runs `npm install`, which rewrites
`package-lock.json` while `src/lib/licence-notices.spec.ts` reads it on every quick run.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Expected | Status |
|---------|------|------|-------------|-----------|-------------------|----------|--------|
| 4-01-01 | 01 | 1 | IDENT-01, CAT-04, CONT-01 | preflight + unit | `npx vitest run --project server src/lib/catalog/catalog.spec.ts` then `... src/lib/ui/identity.spec.ts` | catalog `10 passed` (else **stop**, naming plan 08-01); identity `5 passed` | ⬜ |
| 4-01-02 | 01 | 1 | IDENT-01 | build gate | `npm run licenses && npx vitest run --project server src/lib/licence-notices.spec.ts` | licences exit 0 with one more production dependency; notices `7 passed`; `npm run build` exit 0 | ⬜ |
| 4-01-03 | 01 | 1 | IDENT-01 | unit + build | `npx vitest run --project server src/lib/ui/identity.spec.ts && npm run build` | identity `6 passed`; a favicon asset emitted | ⬜ |
| 4-02-01 | 02 | 2 | CAT-04, CONT-01, CONT-03, PREV-01, PREV-02 | unit | `npx vitest run --project server src/lib/catalog/front-door.spec.ts` | `8 passed` — the row and the exclusion list asserted as a **partition** of `CATALOG`, never as counts, because Phase 8 waves 4-6 append to both; `catalog.spec.ts` still `10 passed` (08-01 designed its ten tests to loop internally so later waves change no counts) | ⬜ |
| 4-02-02 | 02 | 2 | PREV-01 (D-10) | unit | `npx vitest run --project server src/lib/coverflow/slots.spec.ts` | `8 passed` | ⬜ |
| 4-03-01 | 03 | 2 | PREV-05 (D-15) | unit | `npx vitest run --project server src/lib/sim/schedule.spec.ts` | `7 passed`, including the constant-parity check against the vendored host | ⬜ |
| 4-03-02 | 03 | 2 | PREV-01 | unit | `npx vitest run --project server src/lib/sim/paint.spec.ts` | `5 passed`; one `putImageData`, zero of every forbidden call | ⬜ |
| 4-03-03 | 03 | 2 | PREV-04 | unit | `npx vitest run --project server src/lib/sim/touch.spec.ts` | `8 passed` | ⬜ |
| 4-04-01 | 04 | 2 | DEGR-02 (Phase 4 half) | unit + e2e regression | `npx vitest run --project server src/lib/transport/transport.spec.ts` then `npx playwright test e2e/skeleton.e2e.ts` | transport `7 passed` (6 unchanged + 1); skeleton `2 passed` | ⬜ |
| 4-04-02 | 04 | 2 | DEGR-02 (Phase 4 half) | unit | `npx vitest run --project server src/lib/device/try-on.spec.ts` | `6 passed`, including **zero writes** across a full cycle | ⬜ |
| 4-05-01 | 05 | 3 | PREV-05 | unit | `npx vitest run --project server src/lib/sim/host.spec.ts` | `7 passed`, including the 9x9 backing store `register` sets and the no-restart rule on re-register | ⬜ |
| 4-05-02 | 05 | 3 | IDENT-02, PREV-05 | unit | `npx vitest run --project server src/lib/sim/host.spec.ts` | `10 passed` | ⬜ |
| 4-06-01 | 06 | 4 | IDENT-01 | build + structural | `npm run check && npm run lint && npm run build` | 0 errors; no `getContext`, no vendored import, no colour-authoring filter in the pad components | ⬜ |
| 4-06-02 | 06 | 4 | PREV-01, PREV-04 | build + structural | `npm run check && npm run lint && npm run build` | 0 errors; the clip and the 3D context on different elements; no non-scalar in a rune | ⬜ |
| 4-06-03 | 06 | 4 | PREV-01, PREV-02 | e2e | `npx playwright test e2e/first-experience.e2e.ts` then the full suite into `.tmp-e2e/` | file `3 passed`; suite log holds `passed` and no `failed`; `build/index.html` free of the protocol chunk | ⬜ |
| 4-07-01 | 07 | 5 | PREV-03 | build + structural | `npm run build` then the prerendered-HTML greps | the five name-plate and fidelity test ids present; the fidelity copy character-exact | ⬜ |
| 4-07-02 | 07 | 5 | IDENT-01 | unit | `npx vitest run --project server src/lib/ui/glyph-field.spec.ts` | `5 passed`; the field is byte-identical across two builds | ⬜ |
| 4-07-03 | 07 | 5 | IDENT-02, PREV-05 | e2e | `npx playwright test e2e/first-experience.e2e.ts` then the full suite into `.tmp-e2e/` | file `6 passed`; suite log holds `passed` and no `failed` | ⬜ |
| 4-08-01 | 08 | 6 | IDENT-01 | build + structural | `npm run check && npm run lint && npm run build` | 0 errors; no inert meter; the secondary control genuinely `disabled` with its reason | ⬜ |
| 4-08-02 | 08 | 6 | DEGR-02 (Phase 4 half) | build + structural | `npm run build` then the handler-order and forbidden-symbol probes | nothing awaited before `requestPort`; no `RequestQueue`, keeper, write or compile symbol in the component | ⬜ |
| 4-08-03 | 08 | 6 | DEGR-02, IDENT-01 | e2e | `npx playwright test e2e/first-experience.e2e.ts` then the full suite into `.tmp-e2e/` | file `8 passed`; suite log holds `passed` and no `failed` | ⬜ |
| 4-09-01 | 09 | 7 | CAT-01 | build | `npm run build` then the eight-page probe | one `build/c/<id>/index.html` per row entry, each with its own title; **no** `build/c/tpad` | ⬜ |
| 4-09-02 | 09 | 7 | PREV-01, PREV-05 | unit (structural) | `npx vitest run --project server src/lib/config-shape.spec.ts` | `14 passed` (12 + 2) | ⬜ |
| 4-09-03 | 09 | 7 | CAT-01, PREV-01 | e2e + full gate | `npx playwright test` then the full suite | file `11 passed`; suite log holds `passed` and no `failed`, with the total recorded; sweep `9 passed`; check 0 errors; lint exit 0 | ⬜ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Phase totals when every plan has landed:** nine new `server` spec files carrying **66 new tests**
(identity 6, front-door 8, slots 8, schedule 7, paint 5, touch 8, host 10, glyph-field 5, try-on 6,
plus one added to `transport.spec.ts` and two to `config-shape.spec.ts`), and **11 new Playwright
tests**. Starting from the 28-file / 468-test point after plan 08-01 alone, `npm run test:quick` would
land at 37 files / 534 passed plus the pre-existing todo and `npx playwright test` at 21 passed — **an estimate for the
SUMMARYs to compare against, not a gate.** Interleaved Phase 8 waves make both numbers larger. Only
the per-file counts in the table above are contractual.

**If a per-file count differs from this table** because a task legitimately needed an extra assertion,
the executing task updates the number here and states the delta in its SUMMARY. A stale count is worse
than no count.

---

## Wave 0 Requirements

**None in the tooling sense.** No test framework, no Vitest project, no Playwright config and no
harness convention changes this phase. Specifically:

- [x] **Do not add a Vitest client or browser project.** That is a deliberate dependency decision, not
      a side effect of wanting a component test, and this phase does not need one.
- [x] `playwright.config.ts` is untouched; the webServer stays `npm run preview` over `wrangler dev`.
- [x] `vite.config.ts` is untouched, including its `prerender.entries: ["*"]` and its
      `handleHttpError` suppression — the deep-link route uses an `entries()` export instead.

**One external dependency is installed**, in plan 04-01 and nowhere else: `@fontsource/quicksand`,
exactly pinned, with `OFL-1.1` added to `scripts/gen-licenses.mjs`'s `ALLOWED` and the notices
regenerated. Plan 04-01 runs **alone in wave 1** for that reason: `npm install` rewrites
`package-lock.json`, and `src/lib/licence-notices.spec.ts` reads that file on every `npm run
test:quick`, so a plan running beside it would see red tests for reasons of its own.

Files the phase creates, by wave:

- **Wave 1** — `src/lib/ui/identity.spec.ts`; edits to `src/app.css`, `scripts/gen-licenses.mjs`,
  `THIRD-PARTY.md`, `licenses/`, `src/lib/assets/favicon.svg`, `package.json`, `package-lock.json`
- **Wave 2** — `src/lib/catalog/front-door.ts` + spec, `src/lib/coverflow/slots.ts` + spec,
  `src/lib/sim/{schedule,paint,touch}.ts` + three specs, `src/lib/device/try-on.ts` + spec; one added
  parameter and one added test on `src/lib/transport/transport.{ts,spec.ts}`
- **Wave 3** — `src/lib/sim/host.ts` + spec
- **Wave 4** — `src/lib/ui/{PadFrame,PadCanvas,Coverflow,FrontDoor}.svelte`, `src/routes/+page.svelte`,
  `e2e/first-experience.e2e.ts`
- **Wave 5** — `src/lib/ui/{NamePlate,FidelityLine,Splash}.svelte`, `src/lib/ui/glyph-field.ts` + spec
- **Wave 6** — `src/lib/ui/{PadSpinner,KeepOnDevice,ChosenPanel,TryOnDevice}.svelte`
- **Wave 7** — `src/routes/c/[id]/{+page.ts,+page.svelte}`, two tests in
  `src/lib/config-shape.spec.ts`, `docs/TESTING.md`

---

## Accepted deviations from the roadmap's success criteria

Three, all deliberate, all recorded here so verification measures the phase against what it actually
ships rather than against a sentence written before the fixtures were read.

1. **"Every visible pad is animating live" (criterion 1) is delivered as "every visible pad is running
   its own configuration live, and the ones that are still say why."** Only five of the nine seeds
   animate; `golden-frames.json` records that four are static by design and that `tpad` writes no LEDs
   at all. Faking motion is the one thing PREV-02 forbids outright. What is asserted instead: the
   declared motion matches the fixture, no dark pad is in the opening window, the three largest pads at
   the opening all animate, no two quiet pads are adjacent on the ring, and a still pad carries its own
   honest line. Sources: 04-RESEARCH §Pitfall 1, 04-CONTEXT D-20.

2. **"The nine BOTOR shelf presets are the seed row" (criterion 1) is delivered as eight in the row and
   nine in the catalog.** `tpad` is a black square; D-20 keeps it in the catalog and out of the front
   door until a look gives it LEDs. The exclusion is not a preference in the code: plan 04-02's test 4
   proves `tpad` derives to `dark` from the fixture and cross-checks Phase 8's own `restsBlack` flag,
   and test 2 proves the row and the exclusion list partition the catalog exactly, so nothing else can
   go missing quietly. Open for the user to overturn.

3. **"Five to seven visible pads hold 30 fps on the centre and at least 20 fps on the sides"
   (criterion 5) ships with no falsifiable frame-rate floor.** The cadences are implemented and unit
   tested — `intervalFor` returns 33 ms and 50 ms, the host paints on that schedule, and
   `schedule.spec.ts` pins both — but the *achieved* rate is not asserted anywhere. The honest ceiling
   on a four-core laptop with integrated graphics is unmeasured (04-RESEARCH §Open Question 4), and a
   frame-rate threshold asserted on this machine is a flake generator on any other.

   What plan 04-09 asserts instead is a **stall floor**: the paints counted over two seconds on the
   built site must exceed **70**, which is 25% of the `7 × 2 × 20 = 280` the specified cadences imply.
   Far enough below the target to survive a slow machine, far enough above zero to catch a loop that
   stopped, a row that never woke, or an observer that paused everything. The observed number is
   recorded in the SUMMARY and in `docs/TESTING.md` as an observation. A real frame-rate budget needs
   hardware this project has not measured on, and belongs with that measurement rather than here.

---

## Manual-Only Verifications (the user, with a ZONA on the desk)

Web Serial is not automatable, so the happy path of `TRY ON DEVICE` is a checklist for a person. It is
**one row**, because this phase writes nothing.

| # | Behaviour | Requirement | Exact steps | Passes when |
|---|-----------|-------------|-------------|-------------|
| **1** | Connect and identify, and write nothing | crit. 3 (D-13, D-22) | Open the front door, choose the centre pad, click `TRY ON DEVICE`, pick the ZONA in the browser's chooser | Within about a second the panel shows `ZONA IDENTIFIED` with the firmware version and the active page read from the module, and the sentence that install arrives in the next release. `DISCONNECT ZONA` appears. Afterwards the module behaves exactly as before — its own configuration is untouched, because nothing was sent |

Everything else in the phase is machine-verified. The two properties that most deserve a human eye and
are **not** assertions are recorded as checkpoints in the SUMMARYs rather than as gates: whether the
coverflow's depth reads as depth on a real screen, and whether the splash's dissolve lands the wordmark
cleanly in the header.

---

## Negative checks (observe red before trusting)

| Gate | Task | How to make it red | Expected |
|------|------|--------------------|----------|
| The token ladder's contrast floor | 4-01-01 | change `--color-ink-dim`'s alpha from `0.50` to `0.20` | `identity.spec` test 2 red, printing the computed ratio |
| The licence allowlist | 4-01-02 | remove `"OFL-1.1"` from `ALLOWED` | `npm run licenses` exits 1 naming the font package and the allowlist |
| The favicon | 4-01-03 | restore the framework logo from git | `identity.spec` test 6 red on the framework string |
| **The motion classification** | **4-02-01** | **declare `ninepads` as `animated`** | **`front-door.spec` test 3 red, naming `ninepads` — this is the gate that keeps a dead-looking pad off the front door** |
| The row's ordering rule | 4-02-01 | swap indices 4 and 5 so two quiet pads become adjacent | `front-door.spec` test 7 red on the adjacent pair |
| The slot mirror | 4-02-02 | drop the sign inversion on `rotateY` | `slots.spec` red on the left/right rotation test |
| The catch-up clamp | 4-03-01 | set `MAX_CATCHUP_MS` to 1000 | `schedule.spec` red **twice** — the clamp test and the vendored-parity test |
| **The unlit-cell alpha** | **4-03-02** | **give unlit cells alpha 255** | **`paint.spec` test 1 red naming the cell index. The pad still looks plausible on screen with opaque black cells; only the dot field silently vanishes** |
| MOVE coalescing | 4-03-03 | always push instead of overwriting the last MOVE | `touch.spec` red reporting the extra delivered call |
| The control label | 4-04-01 | interpolate at five of the six sites | `transport.spec` test 7 red naming `unknown` |
| **The never-writes invariant** | **4-04-02** | **add one `write` call to `identifyOnly`** | **`try-on.spec` test 3 red on BOTH halves — the recorded write and the structural scan. Either alone would be a weaker gate** |
| The coverflow pause rule | 4-05-01 | drop `inWindow` from `running`, leaving only the observer | `host.spec` test 6 red naming the pad that kept ticking |
| The centre pad's continuity | 4-05-01 | call `engine.reset()` inside `register` | `host.spec` test 7 red — the hero would restart at tick 0 on every step |
| Teardown | 4-05-02 | delete the media subscription's `stop()` from `destroy()` | `host.spec` test 9 red on the leaked listener |
| The front door's import graph | 4-09-02 | add a static vendored import to `FidelityLine.svelte` | `config-shape` test 13 red naming that file, while test 14 stays green — which is why both exist |

Every negative check is `git add`ed before it is perturbed (on an untracked path `git checkout --`
fails outright and `git diff --quiet` passes vacuously), reverted immediately afterwards, and its red
line quoted verbatim in the plan's SUMMARY.

---

## Harness discipline (non-negotiable, from `docs/TESTING.md`)

- Before any e2e run: `netstat -ano | grep -w LISTENING | grep ":4173"`. If occupied, walk the process
  tree to the `npx-cli.js` root and `taskkill /PID <root> /T /F` **from PowerShell** — Git Bash mangles
  `/PID`, and killing `workerd.exe` alone leaves a zombie that accepts connections it never answers.
- Capture e2e output to `.tmp-e2e/`, never under `test-results/` or `playwright-report/`, which
  Playwright wipes at the start of each run.
- **No Playwright test title may contain the word `failed`** — the acceptance checks grep the captured
  log for it.
- `locator.count()` does not auto-wait. Every count is taken **after** an `expect(...).toBeVisible()`
  on something that proves the page has hydrated.
- Never run `npm run format` across `src/vendor/`; scope Prettier to the files the task wrote.
- One build, one type-check and one Playwright run at a time — see "Execution is serial" above.
- Whole-suite counts go through `scripts/check-counts.mjs` with baseline plus delta; no criterion in
  this phase asserts a todo count or a fixed grand total.
- Generated JSON is normalised with `npx prettier --write` before commit, and Prettier collapses
  primitive arrays onto one line — a generator that does not account for that produces a file
  `npm run lint` rejects and no human wrote.

---

## Validation Sign-Off

- [x] All 24 tasks have an `<automated>` verify
- [x] Three accepted deviations from the roadmap's criteria are recorded, with what is asserted instead
- [x] Sampling continuity: no task, let alone three, without an automated verify
- [x] Wave 0 covers all MISSING references — there are none; no framework or config change
- [x] No watch-mode flags anywhere
- [x] Feedback latency < 10 s quick / < 60 s wave
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planned 2026-09-04
