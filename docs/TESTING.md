# Testing HANGAR

Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

This is the developer-facing guide: which command to run when, what each one costs, and the small
number of traps that have already cost real time. The per-phase validation contract — the sampling
rates, the Nyquist argument behind them and the per-task verification map — lives in each phase's
`XX-VALIDATION.md` (`.planning/phases/03-vendor-the-domain/03-VALIDATION.md` for the vendored
simulator, `.planning/phases/02-walking-skeleton/02-VALIDATION.md` for the protocol and transport
work) and is not repeated here.

## How to run it

**Re-measured whole on 2026-09-09 at the Phase 10 gate (plan 10-14), at commit `305e425`**, on this
machine (Windows 11, Node v24.14.0), against a fresh `npm run build`, on a clean tree, with **6.3–6.7
GB of 15.26 GB of memory free** throughout. Wall times are the whole command including npm and
process startup, each command run alone in the order below; the parenthesised figure is the runner's
own reported duration. Every number here is **observed**, never predicted — the tree is shared
between phases, so a row that was guessed rather than run is worse than no row at all. The catalog
under these numbers is **thirty-six configurations, twenty-seven of them hand-authored Lua**; the
figures they replace were taken at sixteen and seven.

> **AMENDMENT, plan 11-01, 2026-09-09. THE CATALOG IS NOW TWENTY-SEVEN CONFIGURATIONS, EIGHTEEN OF
> THEM HAND-AUTHORED LUA.** The user's bench report asked for nine to be removed — HOLD, KEYS, LEARN,
> SWITCH, ETCH, GRIDLOCK, LIFE, SLAM and TABLE — and 11-01 removed them. **Every measured row in this
> document was observed at thirty-six and is left exactly as it was observed**, because a measurement
> rewritten to match a later tree is no longer a measurement. Plan 11-16 re-measures the whole set
> against the phase's closing build and is the plan that moves these numbers. Where a count below
> describes what the catalog IS rather than what a run reported, it has been corrected in place and
> says so.

| Command                      | Covers                                                               | Measured                                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`              | `svelte-check` over the whole project                                | **584 files, 0 errors, 0 warnings**; 8 s wall, 6.69 GB free                                                                                  |
| `npm run lint`               | `prettier --check .` then `eslint .`                                 | exit 0; 16 s wall, 6.68 GB free                                                                                                              |
| `npm run build`              | `gen-og.mjs`, `vite build`, `postbuild.mjs`                          | exit 0; **10 s wall** — under Phase 9's 12.08 s and well under the 16–20 s the research projected at thirty-six                              |
| `npm run test:quick`         | the `server` Vitest project — everything except the four sweeps      | **81 files, 828 passed + 1 todo (829)**; 32 s wall (29.90 s) at 6.67 GB free, and 32 s again after the build                                 |
| `npm run test:sweep`         | the `sweep` project: four files, and most of its cost is one of them | **4 files, 19 tests**; 93 s wall (90.47 s) at 6.64 GB free                                                                                   |
| `npm run test:unit -- --run` | both Vitest projects in one run                                      | **not re-run at this gate.** It is the sum of the two rows above, **85 files / 847 tests**; the last observation was Phase 9's 78 / 799      |
| `npm run test:e2e`           | Playwright over the built site through `wrangler dev`, two projects  | **103 tests (85 chromium, 18 webkit-phone)** at `--workers 3`; 1.8 m runner time, 109 s wall including the cold start, 6.29 GB free at start |
| `npm run licenses`           | `gen-licenses.mjs` over the production dependency tree               | exit 0; 12 s wall; five production dependencies, Inter and Grifter recorded, **no Quicksand anywhere**                                       |

**The counts reconcile across the three commands, and that is worth one line:** `test:quick` is 81
files / 828 tests, `test:sweep` is 4 / 19, so `test:unit` must be **85 / 847**. A combined run that
does not add up is a project-routing bug, not a rounding difference. **That sum is arithmetic, not an
observation, and it is marked as such** — Phase 9's row was measured and this one was not.

**Three load-sensitive tests were found and fixed at the Phase 9 gate, and all three were found by
running the commands rather than by reading them.** Thirty-six configurations is roughly twice the
work of sixteen in the specs whose cost is linear in the catalog; two of those crossed Vitest's
**default 5,000 ms per-test timeout**, and a third — a spec with nothing to do with the catalog — lost
a wall-clock race to the load the first two created. Each was reproduced at least twice on 2026-09-07,
each on a tree whose only change to the failing file was a comment, and each only when free memory
fell below about 0.7 GB:

- **`src/lib/og/build.spec.ts`, "paints real LEDs"** — `Test timed out in 5000ms`, failing
  `npm run test:quick` at 0.37 and 0.47 GB free. **Made cheaper**, see below.
- **`src/lib/catalog/lua-entries.sweep.spec.ts` test 6** — `Test timed out in 5000ms`, failing
  `npm run test:sweep` at 0.56 GB free and `npm run test:unit` twice. **Given the explicit timeout its
  sibling sweep already carries**, see below.
- **`src/lib/transport/queue.spec.ts`** — `the bytes went out: expected [] to have a length of 1`,
  failing `npm run test:quick` at 0.67 GB free and `npm run test:unit` once. Three of its tests waited
  `await sleep(5)` for the queue to put a request's bytes on the transport, and **5 ms of wall clock
  is not 5 ms of scheduled CPU** on a machine two other tests are starving. All three now poll for the
  condition they meant, behind a 2,000 ms deadline whose failure message says the write never
  happened. Eight tests before, eight after; the queue itself was never wrong.

**A test that writes down a number of milliseconds where it means a condition is a bug in the test,
and the catalog's growth is what made all three of them visible.** None of the three was introduced by
Phase 9's configurations; two were made expensive by them and one was made unlucky by them.

**The quick run's one load-sensitive test left it in plan 09-01, and the move has held.**
`lua-entries.sweep.spec.ts` test 6 measures every value of every knob of every hand-authored entry,
plus both corners, compressed and budget-checked on both events. It **was** the quick run's
load-sensitive test: it timed out three times on 2026-09-05 at 0.8 to 1.7 GB free on a tree that had
not changed a vitest file (Phase 7 deferred items 12 and 21). **Plan 09-01 took the escape hatch
those items named, under D-08**: the file was renamed `*.sweep.spec.ts`, which the shipped file-name
rule routes into the `sweep` project with no configuration edit at all, so it now runs per wave
rather than per task. Nothing it covers was trimmed — six tests before, six after — and the decision
has since been paid off exactly as predicted. **Its work has grown from 283 knob combinations over
seven entries to 701 over twenty-seven**, and the cost of that growth is wall time in a per-wave
project (**1.47 s of test time in 2026-09-04's quick run, 3.89 s alone under `sweep` today**) rather
than a flaky per-task run. Run it directly with
`npx vitest run --project sweep src/lib/catalog/lua-entries.sweep.spec.ts`.

**What the move did not buy it was a timeout, and plan 09-10 gave it one.** 3.89 s against a 5,000 ms
default is about a second of headroom, and a loaded machine takes that. Test 6 now carries an
explicit `600000` as its second `it` argument — **exactly the idiom
`src/lib/tune/reachability.sweep.spec.ts:254` already uses at its own long test**, which is why that
75-second sweep has never had this problem. A sweep project's tests are long by definition; 5,000 ms
is the right default for a unit test and the wrong one here. Nothing about what the test covers
changed: still six tests, still 701 combinations, still both events, still no sampling. The number
that moved is the ceiling, and 600 s is a ceiling rather than a budget — reaching it means something
is genuinely wrong.

**A second load-sensitive test appeared at thirty-six entries, and it was fixed rather than moved.**
`src/lib/og/build.spec.ts`'s "paints real LEDs" test decodes every image in `static/og/` and
classifies every pixel of each. At sixteen images that was 12.1 million pixels; at thirty-six it is
**27.2 million**, and on 2026-09-07 the test took **4.27 s of a 5,000 ms default timeout and failed
`npm run test:quick` twice** at 0.37 and 0.47 GB of memory free — on a tree whose only change to that
file was a comment. The cost was not the decode: it was a `${r},${g},${b}` template string built once
per pixel, 27.2 million short-lived allocations per run. Comparing the three channels numerically
covers **exactly** the same pixels and asserts exactly the same thing, and took the test from **4.27 s
to 0.56 s**. Nothing was sampled and nothing was trimmed, which is the D-08 and D-10 rule for a spec
that gets expensive: make it cheaper or move it, never make it smaller. The quick run was green at
74 / 780 immediately afterwards at 0.85 GB free.

**Run `test:quick` after a build, not only before one.** `src/lib/config-shape.spec.ts` test 14 and
`src/lib/og/build.spec.ts` tests 1, 4 and 5 read `build/`, so they are only armed when the directory
beside them is fresh. The numbers above were taken in that order.

**Run the e2e suite at `--workers 3`, not at Playwright's default.** Twice on this machine a full run
under the default worker count ended with `wrangler dev` printing `Network connection lost.` and every
remaining test refusing to connect (Phase 6 deferred item 7). At three workers every full run since has
passed first time; `playwright.config.ts` does not yet pin the number, so pass it on the command line:
`npm run test:e2e -- --workers 3`.

**Every count is a baseline plus a delta, never a literal total.** `scripts/check-counts.mjs` reads a
Vitest or Playwright summary from stdin and compares it against an expected file count and test count;
each phase records its baseline on a clean tree in its first SUMMARY and every later plan asserts
`baseline + N`. Phase 6's arithmetic, reconciled at its gate: quick **66 → 69 files** and **691 → 724
tests** (+3 / +33), sweep **unchanged**, e2e **61 → 77** (+16, of which ten are the five `@webkit`
titles counted twice — see the table under "Before an e2e run"). Phase 7's, reconciled at its gate
against the baseline its first plan measured on the clean tree Phase 6 closed (`BASE_E2E` 77, frozen
there and never re-derived): quick **69 → 73 files** and **724 → 776 tests** (+4 / +52), sweep
**unchanged**, e2e **77 → 89** (+12: six untagged probe walks, four untagged titles on the real page,
and one `@webkit` title counted twice). No number was adjusted to fit.

Phase 8's, from its own gate (`08-VERIFICATION.md`) against the baseline `08-01-SUMMARY.md` measured
on the clean tree it started from: quick **26 → 43 files** and **453 → 563 tests** (+17 / +110),
sweep **1 file / 9 tests, unchanged**, e2e **10 → 23**.

**Phase 9's, reconciled at its gate on 2026-09-07 against the baseline `09-01-SUMMARY.md` froze on
the clean tree Phase 7 closed (`BASE_FILES` 73, `BASE_TESTS` 776 + 1 todo, `BASE_E2E` 89):**

| Suite | Phase 9                  | Where the delta came from                                                                                                                                                                      |
| ----- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| quick | **73 → 74 files (+1)**   | `src/lib/catalog/host-surface.spec.ts` arrived (09-01, +1); `src/lib/catalog/lua-entries.spec.ts` left for the `sweep` project (09-01, −1); `src/lib/catalog/copy.spec.ts` arrived (09-02, +1) |
| quick | **776 → 780 tests (+4)** | `host-surface.spec.ts` +4, `lua-host.spec.ts` +1, `copy.spec.ts` +5, `lua-entries` moved out −6. Net **+4**                                                                                    |
| sweep | **`3 13` → `4 19`**      | the one file `lua-entries.sweep.spec.ts` moved in, with its six tests, in 09-01. Nothing else joined or left                                                                                   |
| e2e   | **89 → 89, unchanged**   | no e2e title was added anywhere in the phase; every count in the browse suites is `LISTING.length` and `catalog.e2e.ts` reads its entry count from `frames.json`                               |

**Two baselines, two names, and they meet here.** Phase 9 was ten plans deep and split its quick-run
baseline in two, exactly as it split `BASE_E2E` from `PREV_E2E`. `BASE_FILES` and `BASE_TESTS` are
**frozen** at the clean tree (73 / 776) and are written against once, at this gate. `PREV_FILES` and
`PREV_TESTS` are the **rolling** pair — the tree as the previous plan left it — and every wave
asserted "I moved nothing" against them. The chain, and it has to close: 09-01 left
`BASE_TESTS − 1` (775), 09-02 added five to reach `BASE_TESTS + 4` (780), and 09-03 through 09-09
each asserted `PREV_TESTS + 0` seven times over. **`776 − 1 + 5 + 0×7 = 780 = BASE_TESTS + 4`**, which
is the number the gate observed. A reader who does not notice that `BASE_*` and `PREV_*` are
different names will read `BASE_TESTS + 5` in 09-02's SUMMARY and `BASE_TESTS + 4` here and conclude
one of them is wrong; they are both right, and 09-02's five is measured against the 775 that 09-01
left rather than against the 776 that Phase 7 closed on. No number was adjusted to fit.

The sampling rule, in three lines:

- After every task: `npm run test:quick`, plus `npm run lint` when the task touched a source file.
- After every wave: `npm run check && npm run lint && npm run test:quick && npm run test:sweep`.
- Before verification: all of the above plus `npm run test:e2e`.

## Why there are two Vitest projects

`src/vendor/botor/tests/pad-invariants.test.js` sweeps 4,860 labelled states — 1,620 kind
combinations times three brightness levels — and when it was the only member of the `sweep` project
it accounted for almost all of the whole-run wall time: 36.4 s of a 38.3 s two-project run, against
3.9 s for the other twenty-six files. That is the whole reason it is a separate project rather than
one more file in `server`.

**The project has four members as of Phase 9** — three since Phase 5, plus
`src/lib/catalog/lua-entries.sweep.spec.ts`, which plan 09-01 moved in under D-08 — and the rule that
admits a file is its cost, never
its subject: anything matching `*.sweep.spec.ts` joins it. See the Phase 5 section below for the
per-file numbers — the short version is that `src/lib/tune/reachability.sweep.spec.ts` now dominates
the run, at 75.8 s of a 78.0 s three-file run re-measured on 2026-09-05.

The sweep is the anti-drift mechanism. It runs less **often** — per wave, not per task — and never
less **fully**. Do not trim it, do not sample a subset of the states, do not add a `--bail`, and do
not move it back into the `server` project to "simplify the config". If it is slow, that is the
cost of the guarantee it provides.

Note also that `server` excludes both sweeps by **file name and by the `.sweep.` infix**, never by
directory. A directory-wide `src/vendor/**` exclusion is exactly the failure described next.

## The green-and-vacuous trap

Phase 1 excluded the vendored tree from the `server` project as quarantine hygiene, before there
was anything in it to quarantine. Once all six BOTOR files landed, that exclusion made
`npx vitest run` report 4 files and 18 tests and never mention the three ported suites at all — no
warning, no "0 tests collected in file", no error. A perfectly green run that proved nothing.

The tell is a suite that gets **faster** after 281 tests are added to it. `src/lib/config-shape.spec.ts`
now carries structural guards that turn the exclusion's return into a red test, and every
acceptance check in the vendoring work asserts a test **count** rather than an exit code.

The counts to expect today:

| File                                            | Tests |
| ----------------------------------------------- | ----- |
| `src/vendor/botor/tests/pad.test.js`            | 176   |
| `src/vendor/botor/tests/pad-sim.test.js`        | 96    |
| `src/vendor/botor/tests/pad-invariants.test.js` | 9     |

If any of those three numbers drops, the suite is not green — it is silent.

## The walking skeleton's test surface

The walking skeleton (FOUND-01) added two directories of first-party code and 98 tests to the
`server` project, plus three tests inside the existing `src/lib/config-shape.spec.ts` and two inside
`e2e/skeleton.e2e.ts`. All of it runs in node, with no browser and no ZONA attached. Phase 4 has since
added one more test to `transport.spec.ts` — the control label the copy interpolates — and Phase 6
two more — the `already-open` row a racing `open()` lands in, rendered as one sentence with no
steps — so the table below totals 101.

| File                                              | Tests | What it holds                                                                                                                                                                                                                      |
| ------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/protocol/constants.spec.ts`              | 7     | 5 → 7 (plan 10-12): values read from the pinned package rather than restated, plus the touch element's own default Setup (641) and Timer (22) selected BY EVENT NUMBER, and the canonicity gate that turns red on a datestamp bump |
| `src/lib/protocol/descriptors.spec.ts`            | 10    | the four outbound descriptors, byte for byte                                                                                                                                                                                       |
| `src/lib/protocol/forbidden-instructions.spec.ts` | 5     | D-06: `PAGEACTIVE/EXECUTE`, `NVMERASE`, `PAGECLEAR`, `PAGEDISCARD`                                                                                                                                                                 |
| `src/lib/protocol/framing.spec.ts`                | 9     | the frame scanner: split, coalesced and torn inputs                                                                                                                                                                                |
| `src/lib/protocol/decode.spec.ts`                 | 5     | the decode guard — `undefined`, never `false`                                                                                                                                                                                      |
| `src/lib/protocol/match.spec.ts`                  | 7     | which inbound class may resolve which waiter                                                                                                                                                                                       |
| `src/lib/protocol/write-guard.spec.ts`            | 6     | D-09: what makes a fetched string safe to write back                                                                                                                                                                               |
| `src/lib/transport/transport.spec.ts`             | 9     | the six named open failures, CONN-04's recovery order and the control label the copy interpolates                                                                                                                                  |
| `src/lib/transport/capture.spec.ts`               | 6     | D-07's recorder and the pinned `STEP_IDS` vocabulary                                                                                                                                                                               |
| `src/lib/transport/fake.spec.ts`                  | 8     | capture replay and the five injected faults                                                                                                                                                                                        |
| `src/lib/transport/queue.spec.ts`                 | 8     | one outstanding request, bounded retry, a NACK never retried                                                                                                                                                                       |
| `src/lib/transport/sequence.spec.ts`              | 9     | the no-op cycle, including the mandatory restore in its `finally`                                                                                                                                                                  |
| `src/lib/transport/fixtures/synthetic.spec.ts`    | 3     | the generated capture, regenerated at module scope                                                                                                                                                                                 |
| `src/lib/transport/fixtures/fixtures.spec.ts`     | 4     | **the gate**: at least one committed capture is real                                                                                                                                                                               |
| `src/lib/skeleton-results.spec.ts`                | 7     | `docs/SKELETON-RESULTS.md` answers all six questions, with citations                                                                                                                                                               |

Two of those deserve their own paragraph.

**`fixtures/fixtures.spec.ts` is the gate that stops the phase shipping on synthetic data.** Every
fixture-backed test written before the hardware checkpoint ran against `synthetic-zona.json` — real
`encode_packet` bytes, invented content, invented timing — so the whole protocol and transport layer
could be built and proven with nothing plugged in. That sequencing is deliberate and it has one
cost: a repository full of green tests that had never seen a module. Test 1 of `fixtures.spec.ts`
fails unless a committed capture declares `"source": "hardware"`, so the phase cannot be closed
without a real run. Test 3 replays every recorded chunk of every committed hardware arm through the
shipped scanner and decoder, which is what pins the framing path against real USB CDC chunk
boundaries instead of invented ones.

**`fixtures/synthetic-zona.json` is kept deliberately, and must not be deleted now that real
captures exist.** It is what keeps the suite runnable on a machine with no ZONA attached: it is
regenerable from `scripts/make-synthetic-capture.mjs`, it can be edited freely to construct a case
nobody's hardware has produced, and a hardware capture can do neither. `src/lib/transport/fixtures/`
therefore holds both kinds, and `fixtures.spec.ts` test 1 asserts the synthetic one still says so.

`src/lib/skeleton-results.spec.ts` test 7 is the same idea as `src/lib/protocol-pin.spec.ts`: it
parses the single machine-readable `Shipped:` line out of `docs/SKELETON-RESULTS.md` and asserts it
equals `TIMEOUTS` and `PRE_SEND_DELAY_MS` in `src/lib/protocol/constants.ts`. A document that records
a measurement and a constant that ships a different number is a failure nothing else would catch.

`e2e/skeleton.e2e.ts` covers the half of the page a machine can reach: the degrade path with
`navigator.serial` deleted, and the route being served as a real prerendered file from `build/`.
Web Serial itself is not automatable — there is no CDP domain and no fake-device hook — so
everything downstream of an open port is exercised through `FakeTransport` in node, and the hardware
half is a human checklist in `docs/SKELETON-RUNBOOK.md` whose results are written up in
`docs/SKELETON-RESULTS.md`.

## The front door's test surface

Phase 4 added nine `server` spec files, one test to `src/lib/transport/transport.spec.ts`, two to
`src/lib/config-shape.spec.ts` and eleven Playwright tests. Every count below was observed on
2026-09-04 after the phase's last plan, by running each file on its own.

| File                                 | Tests | What it holds                                                                                                                    |
| ------------------------------------ | ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/ui/identity.spec.ts`        | 7     | 6 → 7 (Phase 10): IDENT-01's token ladder, the WCAG AA floor on black, the two font stacks, the 9x9 favicon                      |
| `src/lib/catalog/front-door.spec.ts` | 8     | the row and the exclusion list as a **partition** of the catalog, and motion derived from the fixture rather than declared       |
| `src/lib/coverflow/slots.spec.ts`    | 8     | the ring arithmetic and the slot ladder, including the left/right mirror                                                         |
| `src/lib/sim/schedule.spec.ts`       | 7     | the 10 ms accumulator, the 100 ms catch-up clamp and parity with the vendored host's constants                                   |
| `src/lib/sim/paint.spec.ts`          | 5     | one `putImageData` per pad per paint, zero of every forbidden call, and the unlit-cell alpha                                     |
| `src/lib/sim/touch.spec.ts`          | 8     | mouse-as-finger geometry and the tick-locked, at-most-one-sample-per-tick delivery                                               |
| `src/lib/sim/host.spec.ts`           | 10    | the shared rAF host: the 9x9 backing store, the coverflow window gate, the hero's continuity across steps, teardown              |
| `src/lib/ui/glyph-field.spec.ts`     | 5     | the splash field is deterministic and byte-identical across two builds                                                           |
| `src/lib/device/try-on.spec.ts`      | 7     | connect and identify against `FakeTransport`, including **zero writes** across a full cycle; Phase 6 added the rig-aware refusal |

`src/lib/config-shape.spec.ts` went from 12 tests to **14**. The two additions are the pair that keeps
the 131,101-byte `@intechstudio/grid-protocol` chunk off the front door's critical path, and they are
deliberately redundant with each other: test 13 walks the **source** of both routes and every file in
`src/lib/ui/`, forbidding `vendor`, `intechstudio` and `lib/pad` in the `from` form only — the
`onMount` dynamic import is the rule being obeyed, not broken — while test 14 walks the **built**
artefact, finds the chunk containing `GRID_PARAMETER_ELEMENT_POTMETER` and asserts that no page
reaches it. Test 14 also fails when it can find no such chunk at all, because a probe that has gone
blind must fail rather than pass. Perturbing `FidelityLine.svelte` with one static vendored import
turns test 13 red without a rebuild and leaves test 14 green, which is exactly why there are two.

Plan 05.1-05 amended test 14 twice: `build/c/euclid/index.html` joined `build/index.html` and
`build/c/aurora/index.html` in the page list, and the walk was corrected to follow each page's
**transitive static import graph** rather than only the modules its `<head>` preloads. MEASURED: a
static `import { CATALOG } from "$lib/catalog"` in `src/routes/c/[id]/+page.svelte` put the protocol
chunk in the detail page's static graph — three real `import ... from` edges — and test 14 stayed
green, because Kit preloads eleven modules and none of the three was among them. Test 13 was blind to
it as well: `COMPILER_MARKERS` matches specifier text and `$lib/catalog` contains none of its three
markers, which is the same hole `src/lib/ui/tune-ui.spec.ts` test 1 already records for
`$lib/tune/model`. Dynamic imports stay invisible to the corrected walk by construction — Vite emits
them as `__mapDeps` string tables, never as import statements — so `Coverflow.svelte`'s
`await import()` of the simulator does not trip it.

**There are no component tests, and that is a decision rather than a gap.** This repository has no
browser Vitest project: `vite.config.ts`'s `server` project _excludes_
`src/**/*.svelte.{test,spec}.{js,ts}` and nothing else collects it, and `@vitest/browser`, jsdom and
happy-dom are all absent. A `.svelte.spec.ts` written here would be collected by nothing and report
green — the green-and-vacuous trap described above, in its purest form. So every decidable thing in
Phase 4 lives in a pure `.ts` module with its own spec, and everything that needs a real layout, a
real canvas or a real history entry is proven in a browser instead.

**What the browser proves that node cannot.** `e2e/first-experience.e2e.ts` holds **11** tests, and
they are the only place the coverflow, the splash, the chosen panel, the deep-link routes and the
reduced-motion path are proven at all. They assert that an animated pad really moves (two samples of
its own 9x9 canvas, 400 ms apart, must differ), that a pad the catalog calls static really does not
(the same sampling on `ninepads`, asserted equal and non-empty), that the row steps from the keyboard
and wraps at both ends through `aria-activedescendant`, that the splash is on screen with the
coverflow already mounted underneath it and then clears itself, that any key cuts straight to the
dissolve, that choosing the centre pad reveals the panel and that both Escape and the browser Back
button take it away again, that a browser with no Web Serial still shows the device control —
present, really `disabled`, naming Chrome, Edge and desktop Firefox 151 and no engine — that reduced
motion holds one lit still frame while stepping becomes instant, that `/c/radar/` lands with radar
centred, alive and with no splash, that all thirty-six routed configurations are real files with their
own descriptions while an off-row page is a row of one (a solo pad and an arrow-less plate on
`/c/euclid/`, against the shelf with both arrows on `/c/aurora/`) and a genuinely unknown address
still lands on the shelf with a line saying so, and that the shared animation loop is really painting. All but one assert an
empty error-level console; the exception is the test that navigates to a 404 on purpose, and it
asserts that the one logged message is that 404 and nothing else. The first two are the honest half of
PREV-01: a row where everything changed between samples would be as wrong as one where nothing did.

**The paint count is recorded, never gated.** Test 11 patches
`CanvasRenderingContext2D.prototype.putImageData` in an init script and counts pad frames for two
seconds on the built site. Observed on this machine on 2026-09-04 at the default 1280x720 viewport,
across four runs: **139, 212, 215 and 216**. The 139 came from a whole-suite run with five Playwright
workers competing for the machine; the other three, including a second whole-suite run, sat within
two percent of each other. The test asserts only that the number is greater than zero. That is
deliberate: the honest ceiling on a four-core laptop with integrated graphics is unmeasured, those
four numbers already span a 1.55x range purely on how busy the machine was, and a frame-rate
threshold asserted here would go red on someone else's hardware for a reason that is not a
regression. A real frame-rate budget needs hardware this project has not measured on, and belongs
with that measurement rather than in a test.

Three more conventions in that file, beyond the two below.

**Nothing about the device is asserted absent until the opening has cleared.** Test 6 counts
`chosen-panel` only after `splash` has reached zero matches and `coverflow` is visible. A count taken
against an unhydrated document would be zero for the wrong reason, and a key press taken while the
splash is up races two `keydown` listeners — the splash's skip rule and the row's choose — for one
key.

**The degrade test deletes `serial` off `Navigator.prototype`, never off the instance.** It is an
accessor on the prototype, so `delete navigator.serial` returns `true` and removes nothing. The test
then asserts its own precondition (`"serial" in navigator` is `false`) before asserting anything else,
which is the discipline `e2e/skeleton.e2e.ts` established.

**Web Serial past the capability check is still not automatable.** Everything downstream of an open
port — `identifyOnly`, the identified block, `DISCONNECT ZONA` — is covered in node through
`FakeTransport` in `src/lib/device/try-on.spec.ts`, including the never-writes invariant. When this
section was written the one remaining hardware check was a person with a ZONA on the desk clicking
`TRY ON DEVICE`; Phase 6 widened both halves — a scripted `navigator.serial` now drives the shipped
header in a browser, and the hardware half is the six-row checklist in `docs/SESSION-RUNBOOK.md`. See
"The device session's test surface" below.

Two conventions in that file are worth copying rather than rediscovering.

**Assert the splash through `data-phase`, never through a stopwatch.** `Splash.svelte` publishes `in`,
`hold`, `dissolve` and then removes itself. Timing the 1,840 ms sequence with `waitForTimeout` would
flake on a busy machine; waiting for an attribute does not. Measured on this machine on 2026-09-04, at
the default 1280x720 viewport: **2,784 ms** from `page.goto("/")` to the splash detaching in full
motion, and **874 ms** under reduced motion — the 1,840 ms and 600 ms sequences plus navigation and
hydration.

**`test.use({ reducedMotion: "reduce" })` is not sufficient on its own here.** Measured with
Playwright 1.62.1: it left `window.matchMedia("(prefers-reduced-motion: reduce)").matches` reporting
`false` inside the page. HANGAR reads the preference in JavaScript — `src/lib/sim/host.ts` subscribes
to that media query to still the engines, and `NamePlate.svelte` and `Splash.svelte` read it through
`svelte/motion` — so the declarative option alone would have run the full-motion path under a
reduced-motion title. The test therefore also calls `page.emulateMedia({ reducedMotion: "reduce" })`,
**before** `goto`, so the page arrives stilled instead of being stilled after it has started moving.

## The catalog and the Lua host

Phase 8 added the catalog module, a real Lua 5.4 VM (`wasmoon`, lazily loaded) and seven
hand-authored configurations. Phase 9 took the catalog to **thirty-six entries, twenty-seven of them
hand-authored Lua**, and added two gates. **Plan 11-01 then removed nine on the user's bench report,
leaving twenty-seven entries, eighteen of them hand-authored** — see the amendment at the top of this
document for why the measured figures below still read thirty-six. Every count and cost below was re-observed on **2026-09-07
at commit `36a1965`** by running each file on its own; the cost is that single-file run's reported
duration, which includes transform and import and is therefore dominated by startup for the cheap
ones.

| File                                   | Tests | Cost   | What it holds                                                                                                                       |
| -------------------------------------- | ----- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/catalog/catalog.spec.ts`      | 10    | 0.58 s | the entry shape: unique ids, the preview kind derived from the source kind, knob ids and defaults that index their own value lists  |
| `src/lib/catalog/listing.spec.ts`      | 5     | 0.65 s | the browse listing restated against `CATALOG` field by field, in both directions, and the quiet line every non-animated entry owes  |
| `src/lib/catalog/front-door.spec.ts`   | 8     | 0.57 s | the eight-entry ring and the partition: the row plus the exclusion list is exactly `CATALOG`, and the failure names the missing id  |
| `src/lib/catalog/frames.spec.ts`       | 5     | 1.25 s | the golden-frame fixture: every entry renders, every recorded hash still matches, and the fixture covers the catalog exactly        |
| `src/lib/catalog/copy.spec.ts`         | 5     | 0.60 s | the Copywriting Contract over catalog copy, `KNOWN_TAGS` gated in both directions, and the census (plan 09-02)                      |
| `src/lib/catalog/host-surface.spec.ts` | 4     | 0.69 s | the D-07 gate: every call site in every hand-authored entry classified against the surface `lua-host.ts` registers (plan 09-01)     |
| `src/lib/catalog/audition.spec.ts`     | 4     | 0.63 s | the shape of `docs/HARDWARE-AUDITION.md`: its thirty-two rows, its numbering, its reasons and the install-order sentence            |
| `src/lib/sim/lua-host.spec.ts`         | 9     | 0.47 s | the Grid API the VM is handed - `led`, timers, MIDI, the element table - and the globals a configuration may not reach              |
| `src/lib/sim/lua-smoke.spec.ts`        | 3     | 0.93 s | the end-to-end shape: every hand-authored entry boots a VM, runs a scripted gesture, and sends MIDI or HID                          |
| `src/lib/fidelity/lua-parity.spec.ts`  | 5     | 0.98 s | the nine shelf presets rendered twice - once by the vendored simulator, once by real Lua - and asserted equal                       |
| `src/lib/sim/lazy.spec.ts`             | 3     | 0.30 s | the fast half of D-14: the catalog reaches no engine, `engine.ts` reaches the Lua wrapper only dynamically, one module names the VM |

**The catalog gate that is not in that table is not in the quick run.**
`src/lib/catalog/lua-entries.sweep.spec.ts` — the CONT-02 gate on every hand-authored entry:
canonical compressed form, both 908-character budgets across the whole knob cross-product, the
restricted Lua subset, and token separability — reports **6 tests in 4.54 s** run alone under
`--project sweep`, of which **3.89 s is test time** (2026-09-07, twice, 4.54 s and 4.37 s). It moved
there in plan 09-01 under D-08; see the note under the How-to-run table. **It costs 701 knob
combinations over twenty-seven entries — 1,402 measured events**, by `Σ(knob arities) + 2` per entry,
the two corners being the `+2` licensed by the separability identity the same file proves.

**Adding a configuration changes no test count, and the evidence for that is now much stronger than
it was.** Every catalog gate loops over `CATALOG` (or over the hand-authored subset) _inside_ a
single `it`, deliberately rather than through `it.each`. The claim used to rest on one wave: three
configurations landed in plan 08-06 and `npm run test:quick` reported the same 41 files and 556 tests
before and after. **Phase 9 landed twenty configurations across seven waves and every one of those
seven asserted `PREV_FILES + 0` / `PREV_TESTS + 0` through `scripts/check-counts.mjs`** — 74 files
and 780 tests before HOLD, STEPS and SLAM, and 74 files and 780 tests after QUADRANT and POMODORO,
with nothing but wall time between them. The phase's whole quick-run delta, **+1 file and +4 tests**,
is three new spec files, one moved-out spec file and one added test, and not one of the five is a
configuration. That is what makes the counts above worth writing down: a moved number means a moved
gate, never a bigger catalog. The cost of an added entry is paid in the wall time of
`lua-entries.sweep.spec.ts` and `frames.spec.ts`, which is where it belongs, and Phase 9 paid it:
`lua-entries` from 1.47 s to 3.89 s of test time, `frames.spec.ts` from 318 ms to 649 ms.

**The VM-backed specs are cheap, and the expensive one is not the one anybody expected.**
`lua-entries.sweep.spec.ts` was the costliest of them at **2.18 s** while it was still in the quick
run - it calls `compressScript` for every event of every hand-authored entry and then runs each one
through a real VM at every knob position - against the 10-second threshold its plan set. It now runs
in the `sweep` project (4.54 s alone at twenty-seven entries, 2026-09-07), so the quick run no longer
pays it at all. `lua-parity.spec.ts` renders all nine presets through both
engines in **0.98 s** and is **unchanged by the catalog's growth**, because it is pinned to the nine
shelf presets and nothing else; it was the one expected to hurt and it does not, because wasmoon
boots in milliseconds under Node and its per-preset samples are memoised at module scope. Neither
needs a carve-out today. If a future wave pushes one of them over,
the precedent is D-10's invariant sweep: **move it into its own Vitest project and run it per wave**,
never trim what it covers.

### The cost of thirty-six, measured

`.planning/research/CATALOG-SURFACE.md` section 4 projected the cost of twenty more entries before
any of them existed, and said so plainly: _"nothing was built or benchmarked at 36 entries."_ All of
it was MEDIUM confidence and all of it was arithmetic. Plan 09-10 built and benchmarked at
thirty-six, on this machine, at commit `36a1965`, and this is the comparison.

| Thing                             | At 16 (measured 2026-09-07) | Projected at 36         | **Observed at 36**                | Verdict                                         |
| --------------------------------- | --------------------------- | ----------------------- | --------------------------------- | ----------------------------------------------- |
| `build/browse/index.html`         | 34,041 B                    | ~57,400 B               | **61,673 B**                      | +7 % over the projection                        |
| listing chunk                     | 4,665 B                     | ~10,500 B               | **11,008 B**                      | +5 %                                            |
| `glue.<hash>.wasm` (the Lua VM)   | 271,581 B                   | 271,581 B, +0           | **271,581 B**                     | **exactly zero growth, confirmed**              |
| `lua_fmt_bg.<hash>.wasm`          | 628,148 B                   | 628,148 B, +0           | **628,148 B**                     | **exactly zero growth, confirmed**              |
| protocol chunk                    | 39,269 B                    | unchanged               | **39,269 B**                      | unchanged                                       |
| `static/og/`                      | 132 KB, 16 images           | ~300 KB                 | **292 KB, 36 images** (210,926 B) | within 3 % — **moved to 213,919 B by 10-05**    |
| `npm run build`                   | 12 s                        | ~16-20 s                | **12.08 s**                       | **the projection was wrong: it did not grow**   |
| `frames.json`                     | 15,259 B                    | ~34,300 B               | **33,553 B**                      | −2 %                                            |
| `lua-entries` sweep, combinations | 283                         | ~1,090                  | **701**                           | **−36 %** — see below                           |
| `lua-entries` sweep, test time    | 1.47 s                      | ~5.7 s                  | **3.89 s**                        | −32 %                                           |
| `frames.spec.ts` test time        | 318 ms                      | ~1.2 s                  | **649 ms**                        | −46 %                                           |
| `lua-smoke.spec.ts` test time     | 129 ms                      | ~500 ms                 | **286 ms**                        | −43 %                                           |
| mounted canvases on `/browse/`    | 16                          | 36, under a ~40 ceiling | **36**                            | exact                                           |
| on-screen ticking cards           | ~8-12                       | ~8-12, unchanged        | **4 at 1280x720**                 | the shape of the claim held, the number did not |

**Why the sweep came in at 701 rather than 1,090, and why it matters.** The projection assumed the
twenty new entries would look like the seven that existed, and **all seven** of those carry a
**sixteen-value MIDI-channel knob** — 7 x 16 = 112 of their 283 combinations, in one knob. **No entry
authored in Phase 9 ships a sixteen-value channel knob**; the widest knob in any of the twenty has
five values. The twenty added 418 combinations between them, an average of 20.9 each against the
seven originals' 40.4. That single authoring choice is what kept the sweep affordable at twenty-seven
entries, and it is written into TUNE-01's qualifier for the phase.

**Why the build did not grow.** `gen-og.mjs` renders thirty-six 1200x630 PNGs where it used to render
sixteen, and the whole three-stage build still finishes in 12.08 s against 12 s at sixteen entries.
The OG stage was never the build's critical path — a Vite dev-server boot and
`vite-plugin-sveltekit-compile`'s `writeBundle` (3.6 s of a 4.9 s Vite build, from the build's own
`PLUGIN_TIMINGS`) are — so doubling a linear stage that was not the bottleneck cost nothing
observable.

**The zero-growth WASM claim is confirmed rather than assumed**, and it is the row worth having.
`luaReady()` memoises the `LuaFactory` and wasmoon memoises the module inside it, so twenty more Lua
entries add exactly **0 bytes** of WebAssembly download; both `.wasm` assets are byte-for-byte the
sizes recorded at sixteen entries. `e2e/catalog.e2e.ts` proves the stronger half separately: a cold
catalog load fetches neither.

**The on-screen count is the one row the research got numerically wrong, and it got the reasoning
right.** It projected ~8-12 ticking cards at both catalog sizes on the argument that the count is
viewport-bound rather than catalog-bound. That argument is correct and it is the important half: at
thirty-six entries, thirty-six canvases mount and **four** intersect a 1280x720 viewport at the
four-column cap. The projection's 8-12 assumed roughly two rows plus the 200 px `rootMargin`; one row
is what fits. Measured in Chromium against the production build through the real Worker: 36 mounted,
4 on screen, first contentful paint 584 ms, load 731 ms, 30 resources.

### What the catalog gates prove, and what they do not

`src/lib/fidelity/lua-parity.spec.ts` is **evidence**. The Lua it runs is the vendored compiler's own
output, executed in a real Lua 5.4 VM, and the result is compared against the vendored TypeScript
simulator - an independent transcription of the same firmware - and against a recorded fixture.
Agreement is two implementations meeting, not one implementation quoted twice.

`src/lib/catalog/frames.json` is a regression **tripwire, not an oracle**. Its hashes came out of the
engine they are used to check, so a red `frames.spec.ts` says rendering moved and says nothing about
which side of the move was right. That answer comes from the parity spec and from
`src/lib/fidelity/firmware-oracle.spec.ts`, never from regenerating the fixture.

`src/lib/catalog/lua-entries.sweep.spec.ts` is a **budget gate valid only at the current protocol
pin**.
Canonical compressed form is a property of a specific minifier version, so a green run means "these
entries fit at `1.20260825.1135`" and nothing more. `docs/PIN-POLICY.md` carries the checklist item
that re-measures it after a bump.

### The laziness proof

`e2e/catalog.e2e.ts` is the production-build half, and it is what makes the 271 KB VM affordable at
all. It loads the unlinked `/dev/catalog/` probe page from the real `build/` through the real Worker
and asserts that a cold load fetches **no** WebAssembly - not the VM, not the formatter - then clicks
a button and asserts that opening a Lua-backed configuration is what fetches
`_app/immutable/assets/glue.<hash>.wasm`, with status 200, `content-type: application/wasm` and a real
243-byte frame rendered in Chromium. Observed on 2026-09-04: `glue.Dlydm7r2.wasm`, 271,581 bytes.

The two layers are not symmetric, and the measurement that established it is worth keeping. Adding a
static `import ... from "./lua-pad-sim"` to `src/lib/sim/engine.ts` turns `lazy.spec.ts` red and
leaves `catalog.e2e.ts` **green**: every consumer of `engine.ts` in this repository - the coverflow
row included - already reaches it through a dynamic import, so a fatter `engine.ts` chunk is not a
fatter cold load. The unit guard protects a chunk-composition property one level upstream of the fetch
the e2e watches. The perturbation that does turn the e2e red is reaching the VM from a page's own load
path - an `onMount` that calls `luaReady()` - which was observed to put exactly one URL on the cold
load, `/_app/immutable/assets/glue.Dlydm7r2.wasm`. Keep both layers; they fail for different reasons.

## Tuning, budgets and shareable links

Phase 5 added **fifteen** `server` spec files, **two** `sweep` files, **two** Playwright files and one
more unlinked probe route. Every count below was observed on 2026-09-04 after the phase's last plan,
by running each file on its own; the cost column is the wall time of that single-file run.

| File                                | Tests | Cost    | What it holds                                                                                                                                                                       |
| ----------------------------------- | ----- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/tune/copy.spec.ts`         | 6     | 0.38 s  | the Copywriting Contract as executable rules: sentence case, no exclamation, the compiler's own words never rewritten                                                               |
| `src/lib/tune/idle.spec.ts`         | 3     | 0.22 s  | D-08's prefetch shim: `requestIdleCallback` where it exists, `setTimeout` where it does not, and an idempotent cancel                                                               |
| `src/lib/tune/view.spec.ts`         | 8     | 0.53 s  | the zero-import view seam: the twelve knob kinds, the widget rule, and `over` outranking staleness on a meter                                                                       |
| `src/lib/tune/state.spec.ts`        | 5     | 0.44 s  | the reimplemented `withChange`, pinned against the vendored private it replaces                                                                                                     |
| `src/lib/tune/knobs.preset.spec.ts` | 6     | 0.43 s  | the nine per-card descriptor lists held against `presetById(id).knobs`, and every default derived from the shipped state                                                            |
| `src/lib/tune/knobs.lua.spec.ts`    | 4     | 0.45 s  | the Lua route arriving in the same descriptor shape, so the panel cannot tell the two routes apart                                                                                  |
| `src/lib/tune/model.spec.ts`        | 7     | 1.35 s  | the tuner: an immediate `PadSim` preview, a 120 ms debounced compile, and the stamp precomputed on every change                                                                     |
| `src/lib/tune/ladder.spec.ts`       | 5     | 0.71 s  | TUNE-04 and TUNE-05 against a real over-budget measurement, plus the never-writes scan over `src/lib/tune/`                                                                         |
| `src/lib/tune/surprise.spec.ts`     | 4     | 21.64 s | `SURPRISE ME` as a property, with 18,000 draws behind it: it moves something, it lands in budget, it terminates                                                                     |
| `src/lib/share/url.spec.ts`         | 4     | 0.37 s  | the two restated literals — the deployed origin and the vendored `STAMP_PREFIX` — held against their real sources                                                                   |
| `src/lib/share/stamp.spec.ts`       | 8     | 0.55 s  | the base36 stamp, the entry-consistency guard and the three landings (restored, older, unreadable)                                                                                  |
| `src/lib/og/png.spec.ts`            | 5     | 0.29 s  | the PNG encoder over `node:zlib` alone, verified byte by byte                                                                                                                       |
| `src/lib/og/render.spec.ts`         | 4     | 0.28 s  | the 1200x630 pad, with both structural colours computed from `src/app.css`'s tokens rather than typed                                                                               |
| `src/lib/og/build.spec.ts`          | 5     | 1.38 s  | the `<head>` and the built artefact: every absolute `og:image` resolves back to a real file under `build/` — 0.86 s at sixteen images, 1.38 s at thirty-six, re-measured 2026-09-07 |
| `src/lib/ui/tune-ui.spec.ts`        | 5     | 0.23 s  | five structural rules over the seven tuning components, including the dynamic-import rule `config-shape` test 13 misses                                                             |

**The costliest file in the `server` project is now `surprise.spec.ts` at 21.6 s on its own.** It
stays in `server` deliberately: it is 18,000 draws against a pure function with no compiler in the
loop, it is the per-task guard for the one control that can move every knob at once, and inside a
parallel run it overlaps with the other 65 files — the whole `server` project is 22.7 s.

### The sweep project's new membership

`*.sweep.spec.ts` is the file-name rule, and Phase 5 is what made it more than a convention.

| File                                            | Tests | Cost alone | Why it is a sweep                                                                                                                                     |
| ----------------------------------------------- | ----- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/tune/reachability.sweep.spec.ts`       | 2     | 75.8 s     | it costs all 32,852 reachable knob states of the nine shelf cards, with no sampling                                                                   |
| `src/vendor/botor/tests/pad-invariants.test.js` | 9     | 36.2 s     | 4,860 labelled states: 1,620 kind combinations times three brightness levels                                                                          |
| `src/lib/share/stamp-roundtrip.sweep.spec.ts`   | 2     | 1.6 s      | it round-trips every one of those states through the encoder and back                                                                                 |
| `src/lib/catalog/lua-entries.sweep.spec.ts`     | 6     | 4.5 s      | 701 knob combinations over twenty-seven hand-authored entries, each `compressScript`-d and budget-checked on both events (joined in plan 09-01, D-08) |

The whole `sweep` project is **4 files / 19 tests, 89.7 s** (93 s wall, 2026-09-07) against **3 files
/ 13 tests, 78.0 s** before Phase 9 and **1 file / 9 tests, 38.3 s** before Phase 5. The invariant
sweep it used to be alone in is no longer the expensive one:
the reachability sweep is, and that is the price of the finding below being a measurement rather
than an opinion. The newest member is the cheapest by an order of magnitude and it is here for
**memory, not wall time**: it is the file that timed out three times in the quick run, and the
project it moved into runs per wave.

**Two of the three single-file costs above moved between 2026-09-04 and 2026-09-05 without a line of
either file changing** — reachability from 125.4 s to 75.8 s, `stamp-roundtrip` from 2.3 s to 1.6 s.
Nothing about the sweep got faster; the machine was less busy. That is the reason these numbers are
dated and the reason no threshold is asserted against any of them. The files run in parallel, which
is why 75.8 + 36.2 + 1.6 was 113.6 s alone and 78.0 s together at three members. The project reported
**89.7 s at four members on 2026-09-07**; how much of the 11.7 s is the new file and how much is the
machine is not separable from these two readings, and it is not claimed to be. Plan 09-01 measured
the move in the other direction on the same day it happened, from 110 s to 87 s, because four files
distribute across the worker pool better than three did around `pad-invariants`.

### The phase's central finding, and how it is exercised

**Over budget is unreachable for anything a visitor can produce.** `reachability.sweep.spec.ts` costs
every reachable knob state of every shelf card — 32,852 of them, the full cross-product, no sampling —
and not one crosses 908 characters. TUNE-04 (the fit ladder) and TUNE-05 (the over-budget block, the
red meter, the disabled primary control and the one-click back-off) therefore ship as **tested guards
rather than as states any visitor will meet**, and they are exercised in two places:

- `src/lib/tune/ladder.spec.ts` proves the model in node, against two **measured** reserves:
  `tpad` + `{ setup: 20 }` for the block without a ladder (`fit()` returns no steps at any reserve,
  because the card's only sheet is `sends` and the compiler refuses to shed sends), and
  `dial` + `{ setup: 300 }` for the block **and** a four-step ladder.
- **`/dev/tune/`** — the fourth unlinked probe, beside the walking skeleton's, the fidelity one and
  the catalog one — mounts the real tuning region for `tpad` over a real `PadReserved` of
  `{ setup: 3, timer: 0 }`, which the vendored `cost()` charges itself. Nothing is faked and there is
  no test-only prop: the reserve is the mechanism Phase 7's install marker will use. Tests 9 and 10
  of `e2e/tuning.e2e.ts` are what watch a browser do it.

The reserve on the probe is **3 and not 20** because it was chosen by measurement rather than by
convenience: `tpad` ships at Setup 902/908 and its whole 512-state cross-product spans 902 to 907, so
3 is the reserve that straddles the budget and leaves knob positions on **both** sides of the line.
At 20 every state is over, and the knob branch, the back-off and the way back inside would all be
unreachable from the page.

A guard nobody has watched work is a hope. That is the whole argument for the probe existing.

### The two Playwright files, and the WebKit project

| File                       | Tests | Runs in                    | What it holds                                                                                                                                                                         |
| -------------------------- | ----- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/tuning.e2e.ts`        | 10    | chromium                   | the desktop journey: a knob turn, both meters, `RESET ALL`, `SURPRISE ME`, `COPY LINK`, three landings, the no-clipboard fallback, and the two over-budget tests against `/dev/tune/` |
| `e2e/tuning-webkit.e2e.ts` | 5     | chromium **and** the phone | DEGR-01: the front door, choosing without sideways scroll, a knob turn with the meters settling, the copy confirm state, and a shared link landing with install present-but-disabled  |

**`playwright.config.ts` has two projects, and one of them is filtered.** `chromium` carries no
`grep` and runs everything at `devices["Desktop Chrome"]` (1280x720). `webkit-phone` carries
`grep: /@webkit/` and `devices["iPhone 15"]` (393x659, `isMobile`, `hasTouch`). The consequence is
worth stating as arithmetic rather than as prose: **a title containing `@webkit` runs twice and counts
twice.** `tuning-webkit.e2e.ts`'s five tests therefore contribute **ten** to the suite total, which is
why the whole run at the end of Phase 5 was 44 and not 39. Phase 5.1 added a second tagged file on
the same rule; the current totals are in the per-file table below.

The filter is what makes a second project affordable. A bare second project would double every
existing test for no new coverage; leaving `chromium` ungrepped is what makes the tagged tests
cross-browser rather than WebKit-only.

```bash
npx playwright test --project chromium      # everything, one engine
npx playwright test --project webkit-phone  # the five tagged titles, on a phone
npx playwright test --project webkit-phone --list   # the tagging check, and it is cheap
```

Three things that file learned the hard way, all worth copying:

- **A layout is classified from both boxes, never from `y` alone.** A knob row is a grid with
  `align-items: center`, so a 14 px label and a 44 px control have different tops while sitting
  perfectly side by side. The first draft asserted equal `y` and was red on correct code.
- **The stacking assertion lives at 320 px, not at the phone's own 393 px.** At 393 px the tuning
  region's content box is about 265 px, above `Knob.svelte`'s 220 px container-query threshold, so the
  row genuinely does **not** stack there. Asserting stacking at 393 px would assert something false.
- **`shareUrl` names the deployed origin**, because a shared link goes into somebody else's chat
  window. Following a minted link verbatim leaves the local build and lands on the real site's Basic
  Auth gate — observed. Swap the origin and keep the path and the fragment.

**The clipboard branch, measured on both engines.** `CopyLink.svelte` has two: the write resolves and
the button confirms, or the API is missing / the write rejects and the select-and-copy field is
revealed. On `webkit-phone`, `navigator.clipboard.writeText` **resolves with no grant at all** —
`navigator.permissions.query` is not even implemented there — and the button confirms. Headless
chromium refuses the same write with `NotAllowedError: Write permission denied` unless the context is
granted `clipboard-write`. That difference is the harness's permission model, not a product defect,
and it falls the reassuring way round: the engine this file exists for is the one that succeeds
unaided. So the test grants for chromium only — `grantPermissions` does not accept those names on
WebKit and throws — and both projects then assert the **same** branch, plus the absence of the
fallback field, so a silent branch flip is a red test rather than a passing one that proved nothing.

### What the Open Graph tests can and cannot prove

`src/lib/og/build.spec.ts` proves that an image **exists** and that the `<head>` points at it: it
walks the built artefact, resolves every absolute `og:image` back to a real file under `build/`, and
counts pixels that are none of black, the unlit-dot colour or the frame colour, so a renderer that
dropped every LED cannot pass on composition alone. What it cannot prove is the two things below, and
both are qualifiers on SHARE-04 rather than gaps in the tests.

**An image exists for routed entries — since plan 05.1-05 that is all 16.** D-07 gave every catalog
entry a prerendered `/c/<id>/` page, and the routed set has exactly one declaration: `ROUTED` in
`src/lib/catalog/listing.ts`, read by the route, by `scripts/gen-og.mjs`, by
`src/lib/og/build.spec.ts` and by `e2e/artifacts.e2e.ts`. Before that widening the row WAS the routed
set and the gate asserted the eight that had an address; the four files were amended together
because widening any one of them alone ships eight pages whose `og:image` 404s with nothing red
anywhere — observed between that plan's two commits. **Three of the twenty-seven images** (tpad,
ghost and morph) carry no lit LED at all and are exempted by their own declared `restsBlack`, not by
a list. It was four of thirty-six until plan 11-01 removed ETCH, and three of thirty-four before ETCH
arrived in plan 09-08.

**And a real Discord unfurl cannot be verified until the Basic Auth gate comes down.** Every crawler —
Discord's, Slack's, Twitter's — gets a 401 from `worker/index.js` and never reaches the `<head>` these
tests check. What is provable today is that the markup and the bytes are right; that a scraper does
the expected thing with them is a check for the first un-gated deploy, and it is written down as such
rather than assumed.

## The catalog's browse surface

Phase 5.1 added `/browse/` — sixteen live cards, a sort, a search field, tag chips, a roving
tabindex and a way back from a detail page. It added **eight** `server` spec files, **one** Playwright
file, **three** tests to the existing `e2e/browse.e2e.ts` and a second `@webkit`-tagged Playwright
file. Every count below was observed on 2026-09-05 by running each file on its own.

| File                                 | Tests | Cost   | What it holds                                                                                                                                                                                                |
| ------------------------------------ | ----- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/catalog/listing.spec.ts`    | 5     | 0.40 s | the restated entries held against the catalog in both directions, and the zero-import scan over the source — sixteen when this row was measured, thirty-six and 0.65 s today (see the catalog section above) |
| `src/lib/browse/sort.spec.ts`        | 6     | 0.42 s | the three comparators against literal id sequences, and a scan asserting neither `localeCompare` nor `Intl` is named                                                                                         |
| `src/lib/browse/filter.spec.ts`      | 6     | 0.23 s | case-and-diacritic folding, the term split, AND-combining chips, and the standing chip row derived from the data                                                                                             |
| `src/lib/browse/grid.spec.ts`        | 6     | 0.21 s | the column ladder and the whole keyboard model: clamp-never-wrap, `Home`/`End`, and `undefined` for a foreign key                                                                                            |
| `src/lib/browse/query.spec.ts`       | 5     | 0.23 s | the URL-visible state: parsed defensively, serialised canonically, an unknown `?tag=` dropped silently                                                                                                       |
| `src/lib/browse/return.spec.ts`      | 4     | 0.21 s | the `sessionStorage` record, and that nothing in it ever throws                                                                                                                                              |
| `src/lib/browse/typographic.spec.ts` | 4     | 0.39 s | the apostrophe and quotation-mark rules applied to a visitor's own query                                                                                                                                     |
| `src/lib/ui/browse-ui.spec.ts`       | 6     | 0.21 s | six structural rules over the browse components, including the comment-stripped "no popularity metric" scan                                                                                                  |

Eight files, **42 tests**, and the whole set runs in well under a second. That is deliberate: every
decidable thing on this screen lives in a pure `.ts` module with its own spec, because this
repository collects no `.svelte.spec.ts` in any Vitest project and one written here would report
green while running nothing. Everything that needs a real layout, a real canvas or a real history
entry is proven in a browser instead — `e2e/browse.e2e.ts` (11 chromium tests) and
`e2e/browse-webkit.e2e.ts` (3 titles, both projects, 6 against the total).

### What the browse gates prove, and what they do not

**The mounted-canvas frame budget is a recorded measurement, not a threshold.** Test 6 of
`e2e/browse.e2e.ts` patches `CanvasRenderingContext2D.prototype.putImageData` in an init script and
counts pad frames for two seconds on the built site, then records the viewport, how many cards were
on screen and how many engines had been built beside the number. Observed at 1280x720 with 4 of 16
cards on screen and 4 engines built: **139–156** over four runs, and **152** in the Phase 5.1 gate
run. The test asserts only that the number is greater than zero. **At thirty-six entries the count
that moved is the mounted one, and only that one**: plan 09-10 measured **36 canvases mounted and
still 4 on screen** at the same 1280x720 viewport, because the four-column cap and the window decide
the second number and the catalog decides only the first. The two independent readings of "4 on
screen", taken four days apart at sixteen and at thirty-six entries, are the evidence that
`.planning/research/CATALOG-SURFACE.md`'s projected 8-12 was a viewport estimate rather than a
measurement — and that its actual claim, _"unchanged — viewport-bound"_, was right.
`.planning/research/STACK.md`'s own
estimate — 10–16 concurrently visible animating cards before stutter with the vendored blit, 30+
after the two fixes HANGAR ships — is marked _"Unverified estimate — profile it"_, and this phase
does not promote an unverified estimate into a gate that would go red on somebody else's machine for
a reason that is not a regression. If the wall ever does stutter the first lever is the column count,
and it is never `SIDE_INTERVAL_MS`, which `schedule.spec.ts` pins against the vendored host.

**The WebAssembly claim is narrower than D-06's wording, and the test says so out loud.** D-06 asks
for _"a cold `/browse/` with no Lua card in view fetches no WebAssembly"_. With the default Featured
sort the first screenful holds several Lua cards, so a genuine cold `/browse/` at the top of the page
**will** fetch the 271 KB VM — correctly, and immediately. The honest claim is _a visitor who never
brings a Lua card into view never downloads the VM_, and the honest test is therefore a **filtered**
load: `/browse/?q=aurora` leaves exactly one card in the grid and that card is declared `padsim`. The
test asserts the filtered set is one and that the card is not a Lua card **before** it asserts the
absence, so it cannot pass because the filter silently stopped working. Substituting a bare
`/browse/` was observed red. Do not "simplify" it.

**Two guards keep `/browse/` light, and they are deliberately redundant.** `src/lib/config-shape.spec.ts`
test 13 walks the **source** of both routes and every file in `src/lib/ui/`, forbidding `vendor`,
`intechstudio` and `lib/pad` in the `from` form, and from Phase 5.1 it names
`src/routes/browse/+page.svelte` explicitly; test 14 walks the **built** artefact, finds the chunk
containing `GRID_PARAMETER_ELEMENT_POTMETER` and asserts that no page's transitive static import
graph reaches it. Test 13 goes red without a rebuild; test 14 catches what specifier text cannot see
— a static `import { CATALOG } from "$lib/catalog"` puts the 131,101-byte protocol chunk in a page's
static graph while naming none of test 13's markers. `e2e/browse.e2e.ts` test 7 makes the same claim a
third time against the **served HTML**, which is the only artefact that is race-free: Vite's preload
helper inserts `modulepreload` links for a dynamic import's dependencies too, so the DOM after the
grid has settled is not a first-paint graph. All three fail for different reasons; keep all three.

**The keyboard is proven in both halves.** `grid.spec.ts` pins the arithmetic in node — clamping
rather than wrapping, `Home`/`End`, `undefined` for a key the grid does not own, and the
`Math.max(1, …)` column clamp — and `e2e/browse.e2e.ts` test 9 pins the browser half: exactly one
`tabindex="0"` inside the grid, one `Tab` crossing the whole wall, arrows moving focus by a column
count read off the **live** layout rather than a constant, `ArrowDown` off the last row not moving,
and `Enter` following the anchor with no handler at all.

**The D-18 engine hazard is proven where a visitor would have met it.** `buildTuner`'s `destroy()`
closes only an engine the consumer has never seen; before plan 05.1-04 it closed the engine
unconditionally, which was harmless only while every Lua entry stayed out of `FRONT_DOOR`. Plan
05.1-05 made `/c/euclid/` real, where the row is EUCLID **alone**. `e2e/browse.e2e.ts` test 11 opens
that page, waits for both meters to settle (which is what proves the engine has been handed over),
presses `Escape`, and asserts the pad's own 9x9 backing store still changes 400 ms later. Reverting
`model.ts` to `closeEngine(engine)` was observed turning it red, with the pad frozen on a lit frame.

## The device session's test surface

Phase 6 turned Phase 4's per-panel connect into a site-wide device session: one connection that
survives navigation, a one-click reconnect offer for a previously granted port, plug and unplug
awareness, the module's identity in the header, nine named failure states each with a recovery, and
`FORGET THIS ZONA`. It added **three** `server` spec files, grew two existing ones, widened three
shipped gates without growing them, and added one Playwright file that runs in both projects. Every
count below was observed on 2026-09-05 at the phase gate by running the files on their own.

| File                                              | Tests | What it holds                                                                                                                                                                                                                          |
| ------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/device/session-copy.spec.ts`             | 6     | every session string, character-exact and import-free; the seventeen-phase to nine-slot-state table; the guard that keeps the managed-computer sentence out                                                                            |
| `src/lib/device/session.spec.ts`                  | 17    | the machine over a fake port: every transition and refusal, the in-flight guard, replug adoption by USB identity, the missed-disconnect watchdog, `forget()` ordering, the 500 ms announcer, and zero writes in both halves            |
| `src/lib/ui/device-ui.spec.ts`                    | 7     | the structural gate over the seven device components: no compiler import, no hex, 44px controls, one live region, `aria-expanded` in exactly four states, `data-hydrated` from `onMount` only                                          |
| `src/lib/transport/transport.spec.ts`             | 9     | 7 → 9: the `already-open` row and its no-steps rendering                                                                                                                                                                               |
| `src/lib/device/try-on.spec.ts`                   | 7     | 6 → 7: a rig refusal names the module reporting heartbeat type 1, not whichever spoke first                                                                                                                                            |
| `src/lib/config-shape.spec.ts`                    | 14    | **unchanged in count, widened in reach**: test 13 follows the transitive static import graph from `+layout.svelte` and every file in `src/lib/ui/` against five permitted specifiers; test 12 discovers every `src/routes/dev/*` probe |
| `src/lib/protocol/forbidden-instructions.spec.ts` | 5     | **unchanged in count, widened in reach**: the scan now covers all of `src/lib`, so `src/lib/device/` — the directory that would do the writing if the phase were wrong about itself — is inside it                                     |

**Three files, thirty new node tests, and none of them opens a real port.** The session takes its serial
surface (`requestPort`, `getPorts`, the `connect` and `disconnect` listeners) and its transport factory
as injectable arguments, so `session.spec.ts` drives the whole machine against a fake port and a
`FakeTransport` fed from the Phase 2 hardware capture. Identification from that capture needs **3 of
its 119 rx chunks**. `vi.useFakeTimers()` fakes `setTimeout` alone for the watchdog and the announcer,
so promise chains and dynamic imports keep running.

**The scripted serial is modelled on a source reading, and its own header says so.** `e2e/fake-serial.ts`
installs a `navigator.serial` on `Navigator.prototype` from an init script, before any page script, and
exposes `grant()`, `pick()`, `busy()`, `unplug()`, `replug()`, `feed()`, `requests()`, `openCount(i)` and
`writes()`. It can prove that HANGAR reacts correctly to a `NetworkError`, to a `disconnect` event, to a
`connect` event that hands back a **different** port object, and to `getPorts()` returning a granted
port on load. It cannot prove that a browser really does any of those things — that the grant survives a
restart, that a replug really mints a new object, that Grid Editor is what produces the busy port, that a
real EN16 says so on the wire, that `forget()` really removes the entry. Those five are
`docs/SESSION-RUNBOOK.md`, the hardware half of this phase, run by a person with a ZONA; the runbook
says for each row why a machine cannot.

**`e2e/session.e2e.ts` holds 14 titles and adds 16 to the suite**, because two of them carry `@webkit`
and run in both projects. Tests 1 to 9 drive the unlinked `/dev/session/` probe — the fifth probe route,
which exposes the phase, the identity and a write counter as plain text — through the two capability
messages (the `insecure` branch rendered in a real browser for the first time in this project), the
offer, the busy port, the unplug, the replug, and a whole visit that ends with `writes() === 0`. Tests
10 to 14 drive the **shipped header** on `/`, `/browse/` and `/c/aurora/`: the offer connects to
`ZONA · fw 1.5.5 · page 3` with no picker; one connection survives a four-hop client-router walk and a
reload lands the offer rather than the connection; a busy port raised from the header opens its recovery
with focus inside it and `Escape` hands focus back; the degrade header is asserted in a fixed order on
both projects; and one session transition is spoken exactly once while the tuning and browse regions
stay quiet.

Three conventions in that file worth copying:

- **Wait on published state, then read prose.** The prerendered document already ships a slot and a
  note, so a text or count assertion taken before `data-hydrated="true"` can pass for a reason unrelated
  to the claim. The degrade test's ordering negative — the hydration waits deleted and the entry chunk
  held for two seconds — was observed passing against a document that had not read the capability, 1870
  ms before it did. That is a false green, not a red, and it is the reason every shipped-chrome test waits
  on `data-slot`, `data-hydrated` or `data-ready` before it reads a word.
- **A property that must survive navigation is proven by clicking the site's own links**, with a stamp on
  the document, never by `goto`; the same test then reloads and asserts the **offer**, so a connection
  leaked across reloads cannot read as a feature.
- **A counter a passing test rests on is made to leave zero once, deliberately.** A write planted in the
  session's open path made `writes()` report 2 and the whole-visit test red before the zero was trusted.

## The install flow's test surface

Phase 7 made `TRY ON DEVICE` write, added `PUT BACK` and `KEEP ON DEVICE`, and made each of them safe:
a snapshot of the module's own Setup and Timer before any write control enables, RAM before flash, an
acknowledgement per event before "installed", a read-back before "kept", and a named state with the
way back offered for every failure. It added **four** `server` spec files, grew seven existing ones,
widened two shipped gates without growing them, and extended `e2e/install.e2e.ts` from six titles to
eleven. Every count below was observed on 2026-09-05 at the phase gate by running the files on their
own.

| File                                              | Tests   | What it holds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `src/lib/protocol/descriptors.spec.ts`            | 12      | 10 → 12: the fifth outbound descriptor, `SERIALNUMBER/FETCH`, addressed to the module and never broadcast, and `moduleKeyOf` over `WORD0..WORD3`                                                                                                                                                                                                                                                                                                                                                                        |
| `src/lib/protocol/forbidden-instructions.spec.ts` | 5       | **unchanged in count**: test 4 counts five builders and its class set names `SERIALNUMBER`                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `src/lib/transport/sequence.spec.ts`              | 11      | 9 → 11: `writeBoth` as the one writer (Timer then Setup, verbatim) with `writeBack` an adapter over it; test 3 rewritten so a store on a rig RESOLVES with three acknowledgements to one request                                                                                                                                                                                                                                                                                                                        |
| `src/lib/transport/fixtures/synthetic.spec.ts`    | 6       | 3 → 6: the scripted ZONA's `currentpage` refusal, its flash and `powerCycle()`, its addressed serial report from the global position, and `rigResponder`                                                                                                                                                                                                                                                                                                                                                                |
| `src/lib/device/snapshot.spec.ts`                 | 7       | the durable record under `hangar.snapshot.v1`, keyed by serial then page, never overwritten, never deleted, `unavailable` on a throwing store                                                                                                                                                                                                                                                                                                                                                                           |
| `src/lib/device/install-copy.spec.ts`             | 6       | **unchanged in count through plans 10-12 and 10-13, widened in reach**: every install sentence held against the spec read from disk, zero import specifiers, and four enumerations that are arithmetic over the module's own exports rather than transcriptions — 9 control labels, 7 failure builders, 7 distinct titles, 13 utterances and 4 character caps                                                                                                                                                           |     |
| `src/lib/device/session.spec.ts`                  | 21      | 17 → 21, **unchanged in count since** (test 15's needle list moved 8 → 9 → 10 inside it, the tenth being `clearToDefault`): the write view whose `onData` throws, `onClass` fan-out beside a moving fold, `onConnection` once per teardown, `writeLock` and `announce`                                                                                                                                                                                                                                                  |
| `src/lib/device/session-copy.spec.ts`             | 6       | **unchanged in count**: test 5 rewritten for the amended `SAFE_PROMISE` (88 characters, present tense), test 6 walking the writing form of the unplugged block                                                                                                                                                                                                                                                                                                                                                          |
| `src/lib/tune/model.spec.ts`                      | 10      | 8 → 10: `onconfig` emitted from inside `land()` with the pair the meters measured, `undefined` on every stale                                                                                                                                                                                                                                                                                                                                                                                                           |
| `src/lib/device/wire-pin.spec.ts`                 | 4       | D-10: the strings on the wire are the meters' bytes for all nine presets and every Lua entry; `undefined` builds no request                                                                                                                                                                                                                                                                                                                                                                                             |
| `src/lib/device/install.spec.ts`                  | 21      | 18 → 21 (plan 10-12): the store in node over a tee on `FakeTransport`: zero `CONFIG/EXECUTE` across connect, the snapshot and every knob move; **the four clicks**; the clear proved by class with a counted zero `PAGESTORE/EXECUTE`; the half-landed clear that is partial and not cleared; the fifteen-row CLEAR enablement partition cross-checked against the `InstallPhase` union parsed out of the source; partial, nothing-landed, lost, unconfirmed, kept-mismatch; the bounded retries; the pacing escalation |
| `src/lib/config-shape.spec.ts`                    | 14      | **unchanged in count, widened in reach**: the allow-list gained the store's three specifiers and the walk reads 8 of 8; three planted mutations each turned test 13 red with the offender named                                                                                                                                                                                                                                                                                                                         |
| `src/lib/ui/device-ui.spec.ts`                    | 13      | 7 → 11, then 11 → 13 (plan 10-13): `Clear.svelte` in the hand-listed device components so the 44px walk actually reads it, the CLEAR cell's 48px whose second line is headroom rather than occupancy, and a shapelessness test over BOTH Quiet controls that also proves the confirmation nobody built is absent; the three install leaves, the 44px floor on every control, the twins and the 72px cell, a group that is not a dialog, the header lock's two bindings, no `setInterval`, no retyped install sentence   |
| `e2e/install.e2e.ts`                              | 13 / 16 | 11 / 12 → 13 / 16 (plan 10-13): six untagged probe walks visiting all fourteen install states, four untagged titles on `/c/aurora/`, and **three `@webkit` titles run on both projects** — the degrade path, the clear walk (one click, no confirmation, `FACTORY DEFAULT`, then `PUT BACK`), and CLEAR present-and-disabled where `PUT BACK` is absent                                                                                                                                                                 |     |

Standing gates untouched and green at Phase 7's gate: `src/lib/ui/identity.spec.ts` (6 then, **7** since Phase 10),
`src/lib/ui/tune-ui.spec.ts` (5), `src/lib/sim/lazy.spec.ts` (3), `src/lib/transport/fixtures/fixtures.spec.ts`
(4), `src/lib/catalog/lua-entries.sweep.spec.ts` (6, in the `sweep` project since plan 09-01),
`e2e/session.e2e.ts` (14 titles), `e2e/first-experience.e2e.ts`
(11 titles, three assertions appended to its degrade test).

**The fake ZONA in the browser is the node suite's own responder, exposed into the page.** Phase 6's
`e2e/fake-serial.ts` shim gained one hook: the fake port's `write()` hands each chunk to a function a
test has exposed, awaits the reply and pushes every returned frame into its own readable stream. The
Node side of that hook is `e2e/fake-zona.ts`, which wraps the same `zonaResponder` and `rigResponder`
that `synthetic.spec.ts` and `install.spec.ts` drive, so the request id an acknowledgement echoes is
read off the real wire and a state the browser reaches is a state the node suite can reach. Five
faults are scripted on top of it — a dropped acknowledgement by class and ordinal, a delayed one, a
refusal on the first write, a read-back that lies, a rig — and none inside it. Its limits are its
header's: it models firmware's acceptance rule (`CONFIG` is addressed, `PAGESTORE` and `SERIALNUMBER`
are addressed or broadcast), its flash and its power cycle from a source reading, and it answers
`SERIALNUMBER/FETCH` because it was told to. No frame of that class exists in any hardware capture.

**`e2e/install.e2e.ts` has three blocks.** Tests 1 to 6 drive the unlinked `/dev/install/` probe — the
sixth probe route, a plain-text readout of the store's fields plus a trace of every phase since load,
which is what makes a 40 ms `writing` assertable — through the snapshot before any control enables
(SAFE-01 counted **by class**: zero `CONFIG/EXECUTE` and zero `PAGESTORE/EXECUTE` over a
connect-and-snapshot journey), `TRY ON DEVICE` and `PUT BACK`, `KEEP ON DEVICE` kept only after the
read-back matches and `kept-mismatch` when it lies, partial and both nothing-landed causes with the
pacing escalation observed, lost on an unplug with the record surviving the replug, and unconfirmed /
restored-unconfirmed under `test.slow()` (23 s in the gate run: two legs of three 3000 ms store
timeouts, the shipped constants, never shortened under test). Tests 7 to 10 drive the shipped panel
on `/c/aurora/`: `WRITING…` with `aria-busy` and every install control disabled inside a 200 ms
acknowledgement hold, the header's `DISCONNECT ZONA` and `FORGET THIS ZONA` locked with their reason
after the panel was un-chosen mid-leg, the confirmation replacing the control with focus on the group
and two exits plus `Escape`, a put-back after a keep storing too, and the one live region speaking
once per outcome including `Still writing.` at 2 s into a held store (test 10, `test.slow()`, 11 s in
the suite). Test 11 carries `@webkit` and runs on both projects: on the engine that can never install,
`TRY ON DEVICE` and `KEEP ON DEVICE` are present, disabled and explained, `PUT BACK` is absent by
decision, and the document is as wide as the window at the phone layout. The e2e arithmetic follows
from that shape: the install walks run on `chromium` alone, because Web Serial exists in no WebKit,
and the degrade path is what runs on `webkit-phone` — not two engines walking the install.

Every test in that file ends on the wire counted by class. A passing test that never asserted
`CONFIG/EXECUTE` equal to the number of clicks would be green for the wrong reason.

**Two numbers are recorded and not gated.** The store exposes `pacingEscalated` (the pre-send gap moved
from 0 to 10 ms after a write timeout with no refusal, once per visit) and `refetchRounds` (how many
read-back rounds a store needed before `kept`, of a bound of three). Whether the escalation ever helps
against the module's 2,048-byte receive ring and how many rounds a real store's page reload costs are
measurements no capture holds; `install.spec.ts` and `install.e2e.ts` prove the mechanisms fire on the
scripted faults, and `docs/INSTALL-RUNBOOK.md` rows B and E ask a person for the numbers.

**The hardware half is `docs/INSTALL-RUNBOOK.md`.** Seven rows for a person with a ZONA, each with the
reason a machine cannot run it: whether a real module answers `SERIALNUMBER/FETCH` at all, the first
RAM write and its wall time, `PUT BACK` by eye, a power cycle bringing the original back, a store
surviving a power cycle with its round count, a fresh-tab `PUT BACK` from the browser's own storage,
and an optional rig. No agent has written a byte to a real ZONA in this phase; the first write is the
user's click at that runbook's row B.

Two conventions in that file worth copying, beyond Phase 6's three:

- **A transient is read in one in-page snapshot, not in a chain of round trips.** Everything the spec
  says about a 400 ms window — the busy label, `aria-busy` on the control and on the state region, the
  three disabled controls, the held sentence, the label's computed transition — is returned by one
  `page.evaluate` the moment the label is caught, so the window is spent on assertions and not on the
  wire.
- **A store leg's proof is paced by a bounded beat loop, never one timed beat.** The acknowledgement's
  landing is invisible from the page and the heartbeat waiter is armed only after it, so the loop
  pushes a heartbeat, polls the panel for about one heartbeat period and pushes again, capped at the
  module's own cadence. The same state needed 1, 2 and 3 beats across runs; a single timed beat would
  have been a flaky test by construction.

## Phase 10's suites, measured at the gate

**Every count below was observed on 2026-09-09 at commit `305e425`**, from one
`vitest run --project server` whose per-file totals were read out of the runner's own JSON rather
than transcribed from a plan. `.planning/phases/10-redesign/10-VALIDATION.md` carried a _projected_
per-file table from planning time; this table is the observation that replaces it, and every
disagreement is named in "Where the planner was wrong" below.

### The seven files this phase created

| File                                 | Tests | What it holds                                                                                                                                                                                             |
| ------------------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/ui/aesthetic.spec.ts`       | **8** | the CRT treatment as source: the four layers, the tokens they may name, the reduced-motion and `SCREEN` escapes declared rather than assumed, and (scan 8) the unlit-cell wash capped below the dot       |
| `src/lib/ui/font-assets.spec.ts`     | **5** | the gate `npm run licenses` cannot be: every font binary in `git ls-files` is allowlisted, licensed and recorded                                                                                          |
| `src/lib/sim/demo.spec.ts`           | **2** | the three authored demo gestures light cells `frames.json` records as dark, and `DARK_BY_CONSTRUCTION` names the one entry a finger cannot help                                                           |
| `src/lib/browse/facets.spec.ts`      | **4** | the closed sixteen terms in two facets, exactly three per entry in both directions, both health rules, and the legacy table's bounds                                                                      |
| `src/lib/tune/colour-picker.spec.ts` | **6** | the picker's model: one picker per panel, three rails over the 4,096-colour lattice, A-09's six forbidden shapes, and the two-swatch window retired                                                       |
| `src/lib/tune/mix.spec.ts`           | **2** | the seeded crossover property over all 36 entries with knobs, and the four boundaries                                                                                                                     |
| `src/lib/ui/instrument.spec.ts`      | **6** | the register line asserted from both sides, the pill, the lattice and its `:where()` ground rule with three declared exceptions, the halftone density, the headline form and the seven `--font-mono` uses |

### The files this phase touched without creating

| File                                          | Tests  | Moved by                                        |
| --------------------------------------------- | ------ | ----------------------------------------------- |
| `src/lib/ui/identity.spec.ts`                 | **7**  | 10-02 (6 → 7)                                   |
| `src/lib/sim/host.spec.ts`                    | **18** | 10-05 (+3)                                      |
| `src/lib/browse/sort.spec.ts`                 | **5**  | 10-07 (6 → 5, the only negative term)           |
| `src/lib/browse/filter.spec.ts`               | **6**  | 10-06, 10-07 — unchanged, rewritten inside      |
| `src/lib/browse/query.spec.ts`                | **5**  | 10-07 — unchanged, cases land inside its blocks |
| `src/lib/catalog/copy.spec.ts`                | **5**  | 10-06 — unchanged, `KNOWN_TAGS` re-cut          |
| `src/lib/catalog/listing.spec.ts`             | **5**  | 10-05, 10-07 — unchanged                        |
| `src/lib/tune/copy.spec.ts`                   | **6**  | 10-03, 10-09, 10-11 — unchanged                 |
| `src/lib/tune/surprise.spec.ts`               | **5**  | 10-09 (4 → 5)                                   |
| `src/lib/ui/tune-ui.spec.ts`                  | **9**  | 10-03, 10-09, 10-11 (5 → 9)                     |
| `src/lib/ui/device-ui.spec.ts`                | **13** | 10-03, 10-13 (11 → 13); 10-13.1 rode inside it  |
| `src/lib/ui/browse-ui.spec.ts`                | **6**  | 10-13.1 — unchanged, edited inside              |
| `src/lib/device/install.spec.ts`              | **21** | 10-12 (18 → 21)                                 |
| `src/lib/device/install-copy.spec.ts`         | **6**  | 10-03, 10-12 — unchanged                        |
| `src/lib/device/session.spec.ts`              | **21** | 10-12 — unchanged; test 15's needles 9 → 10     |
| `src/lib/device/session-copy.spec.ts`         | **6**  | 10-03 — unchanged, tests 5 and 6 rewritten      |
| `src/lib/protocol/constants.spec.ts`          | **7**  | 10-12 (5 → 7)                                   |
| `src/lib/tune/reachability.sweep.spec.ts`     | **2**  | 10-08 — unchanged, two passes inside            |
| `src/lib/share/stamp-roundtrip.sweep.spec.ts` | **2**  | 10-08 — unchanged, two passes inside            |
| `src/lib/catalog/lua-entries.sweep.spec.ts`   | **6**  | 10-08 — unchanged, 27-literal colour sample     |

### The standing gates, re-read at the gate rather than assumed

`src/lib/fidelity/vendored-diff.spec.ts` **14**, `src/lib/fidelity/lua-parity.spec.ts` **5**,
`src/lib/fidelity/preset-baseline.spec.ts` **19**, `src/lib/fidelity/firmware-oracle.spec.ts` **8**,
`src/lib/fidelity/golden-frames.spec.ts` **11**, `src/lib/protocol-pin.spec.ts` **5**,
`src/lib/sim/paint.spec.ts` **5**, `src/lib/catalog/front-door.spec.ts` **8**,
`src/lib/catalog/frames.spec.ts` **5**, `src/lib/sim/lazy.spec.ts` **3**,
`src/lib/format-parity.spec.ts` **3**, `src/lib/licence-notices.spec.ts` **7**,
`src/lib/pad/ready.spec.ts` **6**. All green, none edited by this phase.

**The eight suites this document was missing are now four.** `browse/facets.spec.ts`,
`sim/demo.spec.ts`, `tune/mix.spec.ts` and `ui/font-assets.spec.ts` are written up in the tables
above. `fidelity/vendored-diff.spec.ts`, `format-parity.spec.ts`, `licence-notices.spec.ts` and
`pad/ready.spec.ts` have a count and no description, which is less than they deserve and more than
they had. Carried in `.planning/phases/10-redesign/deferred-items.md`.

### e2e

| File                   | Titles      | What it holds                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/aesthetic.e2e.ts` | **5** / 10  | the treatment at the compositor, every title `@webkit`-tagged so it runs on both projects: reduced motion stops both moving layers, `SCREEN: FLAT` turns off all four, the choice survives a navigation and a reload, Switch 3 removes only the roll bar, and (test 5) the lattice ground and the unlit-cell wash proved as **paint order**, which no source scan can see |
| `e2e/install.e2e.ts`   | **+2** / +4 | `CLEAR` end to end against the scripted ZONA in both projects                                                                                                                                                                                                                                                                                                             |

### The phase total, written as a chain

**Nothing below is a transcribed total.** `BASE_FILES`, `BASE_TESTS` and `BASE_E2E` were measured by
plan 10-01 on a clean tree at commit `0c8a18d` — **74 / 780 / 89** — and every plan since carried a
stated delta. The gate observes the far end and the two ends meet:

```
BASE_TESTS 780
  +6 (10-01: aesthetic 1, font-assets 5)      786
  +1 (10-02: identity 6 -> 7)                 787
  +0 (10-03)                                  787
  +6 (10-04: aesthetic 1 -> 7)                793
  +5 (10-05: demo 2, host +3)                 798
  +4 (10-06: facets 4)                        802
  -1 (10-07: sort 6 -> 5)                     801
  +0 (10-08)                                  801
  +3 (10-09: tune-ui +2, surprise +1)         804
  +6 (10-10: colour-picker 6)                 810
  +4 (10-11: mix 2, tune-ui +2)               814
  +5 (10-12: install +3, constants +2)        819
  +2 (10-13: device-ui +2)                    821
  +5 (10-13.1: instrument created with 5)     826
  +2 (10-13.2: instrument 5 -> 6, aesthetic 7 -> 8)  828
  +0 (10-14: the gate writes no tests)        828
```

**Sixteen terms, one per plan** — the zero terms are written out rather than omitted, because a zero
absent from a chain is indistinguishable from a term nobody computed. Observed at the gate:
**81 files, 828 tests**, which is `BASE_FILES + 7` and `BASE_TESTS + 48`. The seven created files are
the seven in the first table.

```
BASE_E2E 89
  +8 (10-04: aesthetic.e2e.ts, 4 titles x 2 projects)   97
  +0 (10-05: gen-og and the dark exemption, no title moves)  97
  +0 (10-07: D-11 and A-19, six sites, every edit inside an existing title)  97
  +4 (10-13: install.e2e.ts, 2 titles x 2 projects)     101
  +0 (10-13.1: the aesthetic pass adds no title - and runs the suite anyway)  101
  +2 (10-13.2: aesthetic.e2e.ts test 5, 1 title x 2 projects, @webkit)  103
```

**Six terms.** Observed at the gate: **103 passed**, which is `BASE_E2E + 14`.

`svelte-check` moved **567 → 584**, always 0 errors and 0 warnings. The sweep is `4 19` at both ends;
10-08 grew what it enumerates by a third without adding a test.

### The cost, observed against what was projected

| Thing                             | Projected / carried                                                    | **Observed 2026-09-09**                                 | Verdict                                                                                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:sweep` wall         | `BASE_SWEEP_WALL` **123 s** (10-01, before 10-08 grew it)              | **93 s (90.47 s runner)**                               | the sweep got a third bigger and **25 % faster**; the 2026-09-07 figures were taken at 0.4–1.3 GB free                                                                  |
| sweep, three later readings       | 119 s (10-08), 130 s (10-10), 90 s (10-12/10-13)                       | **93 s**                                                | consistent with the last two; the spread is the machine, not the tree                                                                                                   |
| `npm run build`                   | 12 s at 16 entries; 12.08 s at 36 (09-VERIFICATION); 16–20 s projected | **10 s**                                                | **the projection was wrong twice over** — it did not grow at 36 and it did not grow through this phase's four CRT layers, two shared rules and a demo-path replay       |
| `npm run test:e2e -- --workers 3` | 89 titles / 2.0 min at 1.56 GB free                                    | **103 titles / 1.8 m runner, 109 s wall**, 6.29 GB free | +14 titles for −6 s; memory was never the constraint at this gate                                                                                                       |
| `static/og/`                      | 210,926 B over 36 files (Phase 9)                                      | **213,919 B over 36 files**                             | **+2,993 B, and it is the point**: 10-05 removed `gen-og.mjs`'s `restsBlack` exemption, so ETCH's 4,192-byte black square became a 4,737-byte picture of a real gesture |
| `reachability.sweep.spec.ts`      | 32,852 states → 44,078, +34 %                                          | **19,502 + 24,576 = 44,078 in 87.0 s**                  | exact                                                                                                                                                                   |
| `stamp-roundtrip.sweep.spec.ts`   | compiler 44,078; Lua 276,160 → 234,784 (−15 %)                         | **44,078 and 234,784**                                  | exact                                                                                                                                                                   |
| `lua-entries.sweep.spec.ts`       | 701 → 1,728 combinations, 3,456 measurements                           | **1,728 and 3,456**                                     | exact                                                                                                                                                                   |
| TUNE-05's margin                  | `ninepads` 640 of 908, 268 free; `tpad` 907 of 908                     | **640 / 268 and 907 / 1**                               | exact, and over-budget states **0**, Pass B colours excluded **0**                                                                                                      |
| `build/source-<sha>.tar.gz`       | 1,216 KB at 10-01                                                      | **1,468 KB**                                            | +252 KB, which is this phase's documents; the font binary is still absent and `static/fonts/README.md` is still in its place                                            |

### Where the planner was wrong, named rather than corrected

A validation document whose estimates are never checked teaches the next phase to estimate
carelessly, so every row `10-VALIDATION.md` got wrong is named here.

1. **The e2e sampling rule said five waves; it was seven.** The rule's stated reason — _"no e2e title
   moves in it"_ — was wrong for two waves that move no title and must run anyway: 10-13.1 repaints
   every surface three e2e files measure, and 10-13.2's subject is paint order, which a source scan
   is structurally blind to. Amended twice, by name, on 2026-09-08 and 2026-09-09.
2. **The 10-12 term was `+4`, then `+3`, and it is `+5`.** Revision 1 carried a `session.spec.ts +1`
   that 10-12's own task 02 denies twice; revision 2 carried a payload of empty strings. A-48 made
   the payload the pinned package's own `defaultConfig`, so `constants.spec.ts` gained two tests.
3. **The 10-13 term was `+3`; it is `+2`.** A-45 removed `ClearConfirm.svelte` from the control walk
   and A-46 retired the tracking-uniqueness test with the Bare tier.
4. **`src/lib/tune/copy.spec.ts` was printed as 5 and is 6.** Corrected 2026-09-08. It moves no
   total — the file is unchanged by all three plans that touch it — which is exactly why stating it
   matters: an absolute that disagrees with the tree teaches the reader to distrust the column that
   _is_ asserted.
5. **`browse-webkit.e2e.ts` was said never to name `newest`.** It does, at `:79`, in its own
   `orderOf` literal union. Retracted 2026-09-08. The edit moves no title, so 10-07's term stays 0 —
   the claim was wrong and the number was right.
6. **The phase total itself moved four times** — `+40` in fourteen terms, `+45` when D-17 inserted
   10-13.1, `+46` when the CLEAR fold moved two terms, `+48` when D-22 inserted 10-13.2 — and six
   occurrences of a superseded total survive in shipped SUMMARYs and are deliberately not edited. A
   shipped SUMMARY is a record of what was observed and believed; rewriting one falsifies it.
7. **`npm run check` "must print nothing" is impossible.** `svelte-check`'s own summary line matches
   `grep -Ei "error|warning"`. The grep prints exactly one line and the assertion that means anything
   is that it reads `0 ERRORS 0 WARNINGS`. First recorded by 10-01; still true at 584 files.
8. **The gate's own negative-check instruction was wrong, and the finding is worth more than the
   check.** 10-14 asked for a non-vacuity floor raised **by one**, expecting red.
   `facets.spec.ts:99`'s floor is `> 30` against an observed `LISTING.length` of **36**, so raising
   it to 31 is **green** — six silent raises of headroom. Red arrives only at 36, with
   `the listing was actually read: expected 36 to be greater than 36`. Both arms were run, the file
   was restored from a scratch copy (never `git checkout --`, see below) and its sha256 is identical
   before and after. **A floor six below its observation is a floor that would not notice five
   entries disappearing.**

### One process hazard this phase proved the hard way

`git checkout -- <path>` restores to **HEAD**, and during 10-13.2 it silently destroyed the
uncommitted work of the task that was running, in two files. It was caught only because the plan
already required a sha256 comparison around every negative check. **Restore a perturbed file from a
scratch copy taken immediately before the perturbation**, and compare sha256 both sides. Every
negative check in this repository from 10-13.2 onward uses that idiom.

## Why the vendored tree is excluded from type-checking but not from the test run

`tsconfig.json` has `checkJs: true`, and the three vendored BOTOR test files are untyped JavaScript.
Together they produced **489** `svelte-check` errors — every one of them inside those three `.js`
files, and none in the vendored TypeScript, which is clean under `strict`.

Fixing them inside the files would be a fourth delta against upstream, and
`src/vendor/botor/VENDOR.md` forbids that: the vendored bytes must stay reconstructible from the
upstream originals. So `tsconfig.json` carries `"exclude": ["src/vendor/**"]` instead. That is
narrower than turning `checkJs` off, which would quietly lower the bar for every first-party
HANGAR `.js` file written from now on, and it still type-checks the three vendored `.ts` sources
the moment HANGAR code imports them — which is where the real risk lives.

`svelte-check --ignore` is not an alternative: its CLI rejects the flag when `--tsconfig` is used.

The exclusion is a **type-checker** exclusion only. The vendored tests still run, and they are the
majority of the suite.

## What the fidelity suite proves, and what it does not

`src/lib/fidelity/firmware-oracle.spec.ts` is an **oracle**. The constants it checks against were
re-derived from the grid firmware C sources by an author who never opened the simulator, with a
`file:line` citation per value. Agreement between the vendored simulator and that oracle is two
independent readings of the same firmware, not one reading transcribed twice.

`src/lib/fidelity/preset-baseline.spec.ts` is **evidence**, for the same reason. Its fixture was
produced by BOTOR's own compiler running inside BOTOR's own checkout; the vendored copy is then
asserted to emit character-identical Lua and identical `compressScript` lengths for all nine shelf
presets. The copy did not produce the numbers it is measured against.

`src/lib/fidelity/golden-frames.spec.ts` is a regression **tripwire and not an oracle**. Its hashes
come from the simulator itself, so it can only tell you that rendering changed — never that it was
right before or is wrong now. When it goes red, the question is what moved, and the answer comes
from the oracle spec, never from regenerating the fixture.

## Before an e2e run

`playwright.config.ts` sets `reuseExistingServer: !process.env.CI`, so locally Playwright will
happily attach to whatever is already answering on port 4173 — including a `wrangler dev` left over
from an earlier session that is serving a **stale** `build/`. A stale tree also holds `build/` open,
which makes `npm run build` die with `EPERM ... hangar\build` from rimraf.

Check first:

```bash
netstat -ano | grep -w LISTENING | grep ":4173"
```

Nothing listening means you are clear. If something is, walk the process tree up from the listening
PID to the `npx-cli` root — the shape is `npx-cli.js` -> `wrangler.js` -> `wrangler-dist/cli.js` ->
`workerd.exe`:

```powershell
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"ProcessId=<pid>\" | Select-Object ProcessId,ParentProcessId,CommandLine"
```

Then kill the whole tree from that root:

```powershell
powershell -NoProfile -Command "taskkill /PID <root pid> /T /F"
```

Killing `workerd.exe` alone does **not** work: `cli.js` restarts it, and the resulting zombie keeps
accepting connections it never answers, so every request hangs until its own timeout rather than
failing fast. Use PowerShell for `taskkill` — Git Bash mangles the `/PID` flag. Re-run the `netstat`
check and confirm 4173 is free before continuing, and leave no listener behind when you finish.

Capture e2e output to `.tmp-e2e/` (gitignored), never under `test-results/` or
`playwright-report/`: Playwright deletes its `outputDir` at the start of every run, so a redirect
target inside it is unlinked mid-run.

The whole Playwright suite is **89 tests** as of 2026-09-05, and it is 89 rather than 78 because the
eleven tagged titles — five in `tuning-webkit.e2e.ts`, three in `browse-webkit.e2e.ts`, two in
`session.e2e.ts`, one in `install.e2e.ts` — run in both projects. Observed, per file and per project,
from the Phase 7 gate run at `--workers 3` (the Phase 6 gate run was 77, with `install.e2e.ts` not yet
written; the Phase 5.1 gate run was 61):

| File                      | chromium | webkit-phone | Total |
| ------------------------- | -------- | ------------ | ----- |
| `session.e2e.ts`          | 14       | 2            | 16    |
| `install.e2e.ts`          | 11       | 1            | 12    |
| `first-experience.e2e.ts` | 11       | -            | 11    |
| `browse.e2e.ts`           | 11       | -            | 11    |
| `tuning.e2e.ts`           | 10       | -            | 10    |
| `tuning-webkit.e2e.ts`    | 5        | 5            | 10    |
| `smoke.e2e.ts`            | 4        | -            | 4     |
| `browse-webkit.e2e.ts`    | 3        | 3            | 6     |
| `artifacts.e2e.ts`        | 3        | -            | 3     |
| `catalog.e2e.ts`          | 2        | -            | 2     |
| `fidelity.e2e.ts`         | 2        | -            | 2     |
| `skeleton.e2e.ts`         | 2        | -            | 2     |
| **Total**                 | **78**   | **11**       | 89    |

There are six unlinked probe routes under `/dev/`, one per thing a browser has to prove about the
production build: the walking skeleton's page, `/dev/fidelity/` (the WASM formatter resolves and
compiles), `/dev/catalog/` (a cold load fetches no WebAssembly), `/dev/tune/` (the over-budget guard,
over a real reserve), `/dev/session/` (the device session's phase, identity and write counter as
plain text, driven by the scripted serial) and `/dev/install/` (the install store's fields and a trace
of every phase since load, driven by the scripted serial and the Node responder). None of them is linked from anywhere, `e2e/fidelity.e2e.ts`
asserts site-wide that no anchor on `/` points into `/dev/`, and `src/lib/config-shape.spec.ts` test 12
discovers every directory under `src/routes/dev/` and asserts the same property over the source of
`src/routes/`.

A green run also leaves `test-results/.last-run.json` behind, not only a failing one. It is gitignored;
remove the directory by hand after a run until `playwright.config.ts` gains an `outputDir` under
`.tmp-e2e/` (Phase 6 deferred item 5).

One convention worth keeping: no Playwright test title may contain the word `failed`, because the
acceptance checks assert an exact total and then grep the captured log for that word.

## Headers and WASM

`@intechstudio/grid-protocol` carries the Lua minifier as a WebAssembly module. `npm run build`
emits it as `build/_app/immutable/assets/lua_fmt_bg.<hash>.wasm` (628,148 bytes), and Vite rewrites
the package's own `new URL(...)` reference to point at that hashed asset.

`worker/index.js` serves it as `application/wasm`, alongside `Cache-Control: private, no-store`,
`X-Robots-Tag: noindex, nofollow, noarchive` and `Referrer-Policy: no-referrer`. It sets **no**
`Content-Security-Policy` header at all.

Two consequences worth writing down:

- If a CSP is ever added — a reasonable hardening step for a site that talks to hardware —
  `script-src` **must** include `'wasm-unsafe-eval'`. Without it the module never instantiates, and
  the symptom is indistinguishable from "the formatter never initialised".
- `e2e/fidelity.e2e.ts` asserts the response `content-type` because a wrong MIME does not break
  anything visibly: `@wasm-fmt/lua_fmt` falls back from `WebAssembly.instantiateStreaming` to
  `WebAssembly.instantiate` with only a console warning, and then runs the slower path forever.

That spec is the production-build proof: it loads the unlinked `/dev/fidelity/` page from the real
`build/` through the real Worker, compiles a preset in Chromium, and compares the result against
`src/lib/fidelity/preset-baseline.json` with an empty console asserted.
